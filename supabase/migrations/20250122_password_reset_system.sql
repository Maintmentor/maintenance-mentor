-- Password Reset System Migration
-- Creates the password_reset_tokens table and validation functions

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON public.password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only service role can access this table
-- No direct user access for security reasons
CREATE POLICY "Service role only" ON public.password_reset_tokens
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- Function to validate a password reset token
CREATE OR REPLACE FUNCTION public.validate_password_reset_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token_record RECORD;
    v_result JSON;
BEGIN
    -- Find the token
    SELECT * INTO v_token_record
    FROM public.password_reset_tokens
    WHERE token = p_token
    LIMIT 1;
    
    -- Check if token exists
    IF v_token_record IS NULL THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Token not found'
        );
    END IF;
    
    -- Check if token is already used
    IF v_token_record.used_at IS NOT NULL THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Token has already been used'
        );
    END IF;
    
    -- Check if token is expired
    IF v_token_record.expires_at < NOW() THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Token has expired'
        );
    END IF;
    
    -- Token is valid
    RETURN json_build_object(
        'valid', true,
        'user_id', v_token_record.user_id,
        'email', v_token_record.email
    );
END;
$$;

-- Function to create a password reset token
CREATE OR REPLACE FUNCTION public.create_password_reset_token(
    p_email TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_token TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_recent_requests INTEGER;
BEGIN
    -- Find user by email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = LOWER(p_email)
    LIMIT 1;
    
    -- If user not found, return success anyway (security best practice)
    -- Don't reveal whether email exists
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', true,
            'message', 'If an account exists with this email, a reset link will be sent'
        );
    END IF;
    
    -- Rate limiting: Check for recent requests (max 3 per hour)
    SELECT COUNT(*) INTO v_recent_requests
    FROM public.password_reset_tokens
    WHERE user_id = v_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
    
    IF v_recent_requests >= 3 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Too many password reset requests. Please try again later.'
        );
    END IF;
    
    -- Invalidate any existing unused tokens for this user
    UPDATE public.password_reset_tokens
    SET used_at = NOW()
    WHERE user_id = v_user_id
    AND used_at IS NULL;
    
    -- Generate new token (32 character random string)
    v_token := encode(gen_random_bytes(24), 'base64');
    v_token := replace(replace(replace(v_token, '+', 'A'), '/', 'B'), '=', '');
    
    -- Set expiration (1 hour from now)
    v_expires_at := NOW() + INTERVAL '1 hour';
    
    -- Insert new token
    INSERT INTO public.password_reset_tokens (user_id, email, token, expires_at, ip_address, user_agent)
    VALUES (v_user_id, LOWER(p_email), v_token, v_expires_at, p_ip_address, p_user_agent);
    
    -- Return success with token
    RETURN json_build_object(
        'success', true,
        'token', v_token,
        'user_id', v_user_id,
        'email', LOWER(p_email),
        'expires_at', v_expires_at
    );
END;
$$;

-- Function to consume a password reset token (mark as used)
CREATE OR REPLACE FUNCTION public.consume_password_reset_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token_record RECORD;
BEGIN
    -- Validate the token first
    SELECT * INTO v_token_record
    FROM public.password_reset_tokens
    WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > NOW()
    LIMIT 1;
    
    IF v_token_record IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired token'
        );
    END IF;
    
    -- Mark token as used
    UPDATE public.password_reset_tokens
    SET used_at = NOW()
    WHERE id = v_token_record.id;
    
    RETURN json_build_object(
        'success', true,
        'user_id', v_token_record.user_id,
        'email', v_token_record.email
    );
END;
$$;

-- Function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.password_reset_tokens
    WHERE expires_at < NOW() - INTERVAL '24 hours'
    OR used_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

-- Grant execute permissions to authenticated users for validation
GRANT EXECUTE ON FUNCTION public.validate_password_reset_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_password_reset_token(TEXT) TO anon;

-- Comment on table
COMMENT ON TABLE public.password_reset_tokens IS 'Stores password reset tokens with expiration and usage tracking';
