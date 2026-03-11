-- Create Slack webhook configuration table
CREATE TABLE IF NOT EXISTS slack_webhook_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_url TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  alert_types TEXT[] DEFAULT ARRAY['critical', 'warning', 'info'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create Slack notification history table
CREATE TABLE IF NOT EXISTS slack_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID REFERENCES slack_webhook_config(id),
  alert_type TEXT NOT NULL,
  key_name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE slack_webhook_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage Slack config"
  ON slack_webhook_config FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Admins can view Slack notifications"
  ON slack_notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can insert Slack notifications"
  ON slack_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_slack_webhook_enabled ON slack_webhook_config(enabled);
CREATE INDEX idx_slack_notifications_sent_at ON slack_notifications(sent_at DESC);
