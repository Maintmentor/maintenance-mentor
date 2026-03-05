-- Create table for environment variable backups
CREATE TABLE IF NOT EXISTS env_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_name TEXT NOT NULL,
  env_data JSONB NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  validation_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  notes TEXT
);

-- Create table for repair logs
CREATE TABLE IF NOT EXISTS env_repair_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repair_type TEXT NOT NULL,
  status TEXT NOT NULL,
  corrupted_keys TEXT[],
  repaired_keys TEXT[],
  backup_used_id UUID REFERENCES env_backups(id),
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for env configuration vault
CREATE TABLE IF NOT EXISTS env_vault (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT UNIQUE NOT NULL,
  encrypted_config TEXT NOT NULL,
  encryption_key_hash TEXT NOT NULL,
  last_validated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE env_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE env_repair_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE env_vault ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own backups"
  ON env_backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backups"
  ON env_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own repair logs"
  ON env_repair_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create repair logs"
  ON env_repair_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_env_backups_user_id ON env_backups(user_id);
CREATE INDEX idx_env_backups_created_at ON env_backups(created_at DESC);
CREATE INDEX idx_env_repair_logs_user_id ON env_repair_logs(user_id);
CREATE INDEX idx_env_repair_logs_created_at ON env_repair_logs(created_at DESC);
