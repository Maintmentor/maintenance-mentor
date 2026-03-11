-- Create Edge Function Deployments Table
CREATE TABLE IF NOT EXISTS edge_function_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  deployment_type TEXT NOT NULL, -- 'auto', 'manual', 'rollback'
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  config_changes JSONB,
  previous_config JSONB,
  error_message TEXT,
  deployed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_edge_deployments_function ON edge_function_deployments(function_name);
CREATE INDEX idx_edge_deployments_status ON edge_function_deployments(status);
CREATE INDEX idx_edge_deployments_created ON edge_function_deployments(created_at DESC);

-- Enable RLS
ALTER TABLE edge_function_deployments ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can view deployments"
  ON edge_function_deployments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert deployments"
  ON edge_function_deployments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update deployments"
  ON edge_function_deployments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
