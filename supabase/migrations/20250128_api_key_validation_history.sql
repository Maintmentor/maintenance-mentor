-- Create API Key Validation History Table
CREATE TABLE IF NOT EXISTS api_key_validation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL,
  key_type TEXT NOT NULL, -- 'openai', 'stripe', 'supabase', etc.
  validation_status TEXT NOT NULL, -- 'success', 'failed', 'invalid_format'
  error_message TEXT,
  validation_details JSONB,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_time_ms INTEGER
);

-- Create index for faster queries
CREATE INDEX idx_validation_history_key_name ON api_key_validation_history(key_name);
CREATE INDEX idx_validation_history_validated_at ON api_key_validation_history(validated_at DESC);
CREATE INDEX idx_validation_history_status ON api_key_validation_history(validation_status);

-- Enable RLS
ALTER TABLE api_key_validation_history ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "Admins can view validation history"
  ON api_key_validation_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
