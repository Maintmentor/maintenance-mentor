-- API Key Validation System Tables
CREATE TABLE IF NOT EXISTS api_key_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_type TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ DEFAULT NOW(),
  last_error TEXT,
  expires_at TIMESTAMPTZ,
  days_until_expiration INTEGER,
  validation_count INTEGER DEFAULT 0,
  consecutive_failures INTEGER DEFAULT 0,
  health_score INTEGER DEFAULT 100,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_key_validation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  validation_details JSONB DEFAULT '{}',
  validated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_key_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  notified_via_email BOOLEAN DEFAULT false,
  notified_via_slack BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_key_status_key_name ON api_key_status(key_name);
CREATE INDEX IF NOT EXISTS idx_api_key_validation_history_key_name ON api_key_validation_history(key_name);
CREATE INDEX IF NOT EXISTS idx_api_key_alerts_is_resolved ON api_key_alerts(is_resolved);
