-- Create health check alerts table
CREATE TABLE IF NOT EXISTS health_check_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create alert configurations table
CREATE TABLE IF NOT EXISTS alert_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  critical_alerts BOOLEAN DEFAULT TRUE,
  warning_alerts BOOLEAN DEFAULT TRUE,
  info_alerts BOOLEAN DEFAULT FALSE,
  daily_summary BOOLEAN DEFAULT TRUE,
  summary_time TEXT DEFAULT '09:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alert history table
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES health_check_alerts(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  error_message TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_health_check_alerts_severity ON health_check_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_health_check_alerts_resolved ON health_check_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_health_check_alerts_created_at ON health_check_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_configurations_user_id ON alert_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON alert_history(alert_id);

-- Enable RLS
ALTER TABLE health_check_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin users can view all alerts" ON health_check_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can manage alert configurations" ON alert_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can manage their own alert configurations" ON alert_configurations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin users can view alert history" ON alert_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
