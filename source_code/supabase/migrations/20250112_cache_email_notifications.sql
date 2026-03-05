-- Create cache_email_notifications table
CREATE TABLE IF NOT EXISTS cache_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_notification_preferences table
CREATE TABLE IF NOT EXISTS email_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  alert_types TEXT[] DEFAULT ARRAY['low_hit_rate', 'high_response_time', 'storage_limit', 'api_errors'],
  severity_levels TEXT[] DEFAULT ARRAY['critical', 'warning'],
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cache_email_notifications_alert_id ON cache_email_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_cache_email_notifications_sent_at ON cache_email_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_notification_preferences_user_id ON email_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notification_preferences_enabled ON email_notification_preferences(enabled);

-- Enable RLS
ALTER TABLE cache_email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all email notifications"
  ON cache_email_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert email notifications"
  ON cache_email_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own preferences"
  ON email_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON email_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON email_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences"
  ON email_notification_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
