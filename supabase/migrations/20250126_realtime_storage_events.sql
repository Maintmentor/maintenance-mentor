-- Create storage events table for real-time tracking
CREATE TABLE IF NOT EXISTS storage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('upload', 'delete', 'update', 'access')),
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_storage_events_bucket ON storage_events(bucket_name);
CREATE INDEX idx_storage_events_type ON storage_events(event_type);
CREATE INDEX idx_storage_events_timestamp ON storage_events(timestamp DESC);
CREATE INDEX idx_storage_events_user ON storage_events(user_id);

-- Update storage_alerts table for real-time notifications
ALTER TABLE storage_alerts 
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium' 
  CHECK (severity IN ('critical', 'high', 'medium', 'low'));

ALTER TABLE storage_alerts 
ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT FALSE;

ALTER TABLE storage_alerts 
ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- Create function to trigger real-time events on storage changes
CREATE OR REPLACE FUNCTION trigger_storage_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast storage event through Supabase Realtime
  PERFORM pg_notify(
    'storage_event',
    json_build_object(
      'bucket_name', NEW.bucket_name,
      'event_type', TG_OP,
      'file_path', NEW.file_path,
      'file_size', NEW.file_size,
      'timestamp', NOW()
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for storage events
CREATE TRIGGER storage_event_trigger
AFTER INSERT OR UPDATE OR DELETE ON storage_events
FOR EACH ROW EXECUTE FUNCTION trigger_storage_event();

-- Create function to check critical storage conditions
CREATE OR REPLACE FUNCTION check_critical_storage_conditions()
RETURNS TRIGGER AS $$
DECLARE
  usage_percent NUMERIC;
  alert_record RECORD;
BEGIN
  -- Calculate usage percentage for the bucket
  SELECT 
    (COALESCE(SUM(file_size), 0)::NUMERIC / NULLIF(max_size, 0)) * 100
  INTO usage_percent
  FROM storage_metrics
  WHERE bucket_name = NEW.bucket_name
  GROUP BY bucket_name, max_size;

  -- Check for critical conditions
  IF usage_percent >= 95 THEN
    INSERT INTO storage_alerts (
      bucket_name,
      alert_type,
      severity,
      threshold_value,
      current_value,
      message,
      details
    ) VALUES (
      NEW.bucket_name,
      'capacity_critical',
      'critical',
      95,
      usage_percent,
      format('CRITICAL: Bucket %s is at %.1f%% capacity', NEW.bucket_name, usage_percent),
      jsonb_build_object(
        'usage_percentage', usage_percent,
        'event_type', NEW.event_type,
        'file_size', NEW.file_size,
        'timestamp', NOW()
      )
    )
    RETURNING * INTO alert_record;

    -- Trigger immediate notification
    PERFORM pg_notify(
      'critical_storage_alert',
      row_to_json(alert_record)::text
    );
  ELSIF usage_percent >= 80 THEN
    INSERT INTO storage_alerts (
      bucket_name,
      alert_type,
      severity,
      threshold_value,
      current_value,
      message
    ) VALUES (
      NEW.bucket_name,
      'high_usage',
      'high',
      80,
      usage_percent,
      format('Warning: Bucket %s is at %.1f%% capacity', NEW.bucket_name, usage_percent)
    );
  END IF;

  -- Check for unusual activity (more than 100 uploads in 5 minutes)
  IF NEW.event_type = 'upload' THEN
    PERFORM 1
    FROM storage_events
    WHERE bucket_name = NEW.bucket_name
      AND event_type = 'upload'
      AND timestamp > NOW() - INTERVAL '5 minutes'
    HAVING COUNT(*) > 100;

    IF FOUND THEN
      INSERT INTO storage_alerts (
        bucket_name,
        alert_type,
        severity,
        message,
        details
      ) VALUES (
        NEW.bucket_name,
        'unusual_activity',
        'high',
        'Unusual upload activity detected',
        jsonb_build_object(
          'uploads_last_5min', (
            SELECT COUNT(*)
            FROM storage_events
            WHERE bucket_name = NEW.bucket_name
              AND event_type = 'upload'
              AND timestamp > NOW() - INTERVAL '5 minutes'
          ),
          'file_path', NEW.file_path,
          'timestamp', NOW()
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for critical condition checks
CREATE TRIGGER check_critical_storage_trigger
AFTER INSERT ON storage_events
FOR EACH ROW EXECUTE FUNCTION check_critical_storage_conditions();

-- Create view for real-time storage statistics
CREATE OR REPLACE VIEW realtime_storage_stats AS
SELECT
  bucket_name,
  COUNT(*) FILTER (WHERE event_type = 'upload' AND timestamp > NOW() - INTERVAL '1 hour') as uploads_last_hour,
  COUNT(*) FILTER (WHERE event_type = 'delete' AND timestamp > NOW() - INTERVAL '1 hour') as deletes_last_hour,
  SUM(file_size) FILTER (WHERE event_type = 'upload' AND timestamp > NOW() - INTERVAL '1 hour') as bytes_uploaded_last_hour,
  COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '1 minute') as events_last_minute,
  MAX(timestamp) as last_activity
FROM storage_events
GROUP BY bucket_name;

-- Enable Row Level Security
ALTER TABLE storage_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage storage events"
  ON storage_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view their own events"
  ON storage_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON storage_events TO service_role;
GRANT SELECT ON storage_events TO authenticated;
GRANT SELECT ON realtime_storage_stats TO authenticated;