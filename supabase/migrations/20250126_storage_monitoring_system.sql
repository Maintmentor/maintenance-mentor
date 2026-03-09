-- Create storage metrics table
CREATE TABLE IF NOT EXISTS storage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_name TEXT NOT NULL,
  total_size BIGINT NOT NULL,
  file_count INTEGER NOT NULL,
  avg_file_size BIGINT,
  max_file_size BIGINT,
  capacity_percentage FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage alerts table
CREATE TABLE IF NOT EXISTS storage_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('capacity', 'unusual_pattern', 'stale_files')),
  bucket_name TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage predictions table
CREATE TABLE IF NOT EXISTS storage_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_name TEXT NOT NULL,
  prediction_date DATE NOT NULL,
  predicted_size BIGINT NOT NULL,
  predicted_file_count INTEGER,
  confidence_score FLOAT,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bucket_name, prediction_date)
);

-- Create storage access logs table
CREATE TABLE IF NOT EXISTS storage_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  action TEXT NOT NULL CHECK (action IN ('upload', 'download', 'delete', 'access')),
  user_id UUID REFERENCES auth.users(id),
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_storage_metrics_bucket_created ON storage_metrics(bucket_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_alerts_type_created ON storage_alerts(alert_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_alerts_notification ON storage_alerts(notification_sent, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_predictions_bucket_date ON storage_predictions(bucket_name, prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_storage_access_logs_bucket_accessed ON storage_access_logs(bucket_name, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_access_logs_file_accessed ON storage_access_logs(file_path, accessed_at DESC);

-- Enable RLS
ALTER TABLE storage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_access_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin only for metrics and alerts)
CREATE POLICY "Admins can view storage metrics" ON storage_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view storage alerts" ON storage_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view storage predictions" ON storage_predictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own access logs" ON storage_access_logs
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );