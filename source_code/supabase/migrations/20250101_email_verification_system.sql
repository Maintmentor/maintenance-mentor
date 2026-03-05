-- Add email verification columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

-- Create index for verification tokens
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token 
ON profiles(verification_token) 
WHERE verification_token IS NOT NULL;

-- Create email verification logs table
CREATE TABLE IF NOT EXISTS email_verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'sent', 'verified', 'expired', 'resent'
  token_hash VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for verification logs
CREATE INDEX IF NOT EXISTS idx_email_verification_logs_user_id 
ON email_verification_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_logs_created_at 
ON email_verification_logs(created_at DESC);

-- Function to generate verification token
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random 32-character token
  token := encode(gen_random_bytes(16), 'hex');
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send verification email (called by trigger)
CREATE OR REPLACE FUNCTION send_verification_email()
RETURNS TRIGGER AS $$
DECLARE
  verification_token TEXT;
  token_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate verification token
  verification_token := generate_verification_token();
  token_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Update profile with verification token
  UPDATE profiles 
  SET 
    verification_token = verification_token,
    verification_token_expires_at = token_expires_at,
    email_verified = FALSE
  WHERE id = NEW.id;
  
  -- Log the email sending
  INSERT INTO email_verification_logs (
    user_id,
    email,
    action,
    token_hash
  ) VALUES (
    NEW.id,
    NEW.email,
    'sent',
    encode(digest(verification_token, 'sha256'), 'hex')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to send verification email on user creation
DROP TRIGGER IF EXISTS send_verification_email_on_signup ON auth.users;
CREATE TRIGGER send_verification_email_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION send_verification_email();

-- Function to verify email
CREATE OR REPLACE FUNCTION verify_email(
  p_token TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_result JSON;
BEGIN
  -- Find user by token
  SELECT id, email INTO v_user_id, v_email
  FROM profiles
  WHERE verification_token = p_token
    AND verification_token_expires_at > NOW()
    AND (p_user_id IS NULL OR id = p_user_id)
    AND email_verified = FALSE;
  
  IF v_user_id IS NULL THEN
    -- Check if token expired
    SELECT id INTO v_user_id
    FROM profiles
    WHERE verification_token = p_token
      AND (p_user_id IS NULL OR id = p_user_id);
    
    IF v_user_id IS NOT NULL THEN
      -- Token expired
      INSERT INTO email_verification_logs (
        user_id,
        email,
        action,
        token_hash
      ) 
      SELECT 
        id,
        email,
        'expired',
        encode(digest(p_token, 'sha256'), 'hex')
      FROM profiles
      WHERE id = v_user_id;
      
      RETURN json_build_object(
        'success', false,
        'error', 'Verification token has expired'
      );
    ELSE
      -- Invalid token
      RETURN json_build_object(
        'success', false,
        'error', 'Invalid verification token'
      );
    END IF;
  END IF;
  
  -- Mark email as verified
  UPDATE profiles
  SET 
    email_verified = TRUE,
    email_verified_at = NOW(),
    verification_token = NULL,
    verification_token_expires_at = NULL
  WHERE id = v_user_id;
  
  -- Log verification
  INSERT INTO email_verification_logs (
    user_id,
    email,
    action,
    token_hash
  ) VALUES (
    v_user_id,
    v_email,
    'verified',
    encode(digest(p_token, 'sha256'), 'hex')
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email verified successfully',
    'user_id', v_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resend verification email
CREATE OR REPLACE FUNCTION resend_verification_email(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_email TEXT;
  v_email_verified BOOLEAN;
  v_last_sent TIMESTAMPTZ;
  v_token TEXT;
  v_token_expires_at TIMESTAMPTZ;
BEGIN
  -- Check if user exists and needs verification
  SELECT email, email_verified 
  INTO v_email, v_email_verified
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  IF v_email_verified THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email already verified'
    );
  END IF;
  
  -- Check rate limiting (max 1 email per 5 minutes)
  SELECT created_at INTO v_last_sent
  FROM email_verification_logs
  WHERE user_id = p_user_id
    AND action IN ('sent', 'resent')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_last_sent IS NOT NULL AND v_last_sent > NOW() - INTERVAL '5 minutes' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Please wait 5 minutes before requesting another verification email'
    );
  END IF;
  
  -- Generate new token
  v_token := generate_verification_token();
  v_token_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Update profile with new token
  UPDATE profiles
  SET 
    verification_token = v_token,
    verification_token_expires_at = v_token_expires_at
  WHERE id = p_user_id;
  
  -- Log resend
  INSERT INTO email_verification_logs (
    user_id,
    email,
    action,
    token_hash
  ) VALUES (
    p_user_id,
    v_email,
    'resent',
    encode(digest(v_token, 'sha256'), 'hex')
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Verification email sent',
    'token', v_token -- Return token for edge function to send email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for email verification logs
ALTER TABLE email_verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification logs"
  ON email_verification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all logs"
  ON email_verification_logs
  FOR ALL
  USING (auth.role() = 'service_role');