-- Add admin_notes column to contact_inquiries if it doesn't exist
ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create audit_logs table for system activity monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = auth.uid() AND ur.name = 'admin'
  )
);

-- Allow authenticated users to insert their own audit logs
CREATE POLICY "Users can create their own audit logs" ON audit_logs FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Function to automatically log user actions
CREATE OR REPLACE FUNCTION log_user_action(
  p_action VARCHAR,
  p_resource VARCHAR,
  p_details JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource, details)
  VALUES (auth.uid(), p_action, p_resource, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
