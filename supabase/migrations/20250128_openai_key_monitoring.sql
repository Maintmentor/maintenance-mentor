-- OpenAI API Key Monitoring System
CREATE TABLE IF NOT EXISTS openai_key_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_valid BOOLEAN NOT NULL,
  error_message TEXT,
  quota_used NUMERIC,
  quota_limit NUMERIC,
  quota_remaining NUMERIC,
  last_successful_call TIMESTAMPTZ,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email alerts for low quota
CREATE TABLE IF NOT EXISTS openai_quota_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'low_quota', 'invalid_key', 'quota_exceeded'
  quota_remaining NUMERIC,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_email TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE openai_key_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_quota_alerts ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admin read openai_key_status" ON openai_key_status
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin read openai_quota_alerts" ON openai_quota_alerts
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Function to check and alert on quota
CREATE OR REPLACE FUNCTION check_openai_quota()
RETURNS void AS $$
DECLARE
  latest_status RECORD;
  alert_threshold NUMERIC := 10.0; -- Alert when less than $10 remaining
BEGIN
  SELECT * INTO latest_status FROM openai_key_status ORDER BY checked_at DESC LIMIT 1;
  
  IF latest_status.quota_remaining < alert_threshold AND latest_status.is_valid THEN
    INSERT INTO openai_quota_alerts (alert_type, quota_remaining, recipient_email)
    VALUES ('low_quota', latest_status.quota_remaining, 'admin@example.com');
  END IF;
  
  IF NOT latest_status.is_valid THEN
    INSERT INTO openai_quota_alerts (alert_type, quota_remaining, recipient_email)
    VALUES ('invalid_key', latest_status.quota_remaining, 'admin@example.com');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
