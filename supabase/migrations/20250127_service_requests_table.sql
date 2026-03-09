-- Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  technician_notes TEXT,
  customer_notes TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own service requests" ON service_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service requests" ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service requests" ON service_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service requests" ON service_requests
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add columns to repair_history if they don't exist
ALTER TABLE repair_history ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE repair_history ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE repair_history ADD COLUMN IF NOT EXISTS technician_notes TEXT;
ALTER TABLE repair_history ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE repair_history ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for repair_history updated_at if not exists
DROP TRIGGER IF EXISTS update_repair_history_updated_at ON repair_history;
CREATE TRIGGER update_repair_history_updated_at
  BEFORE UPDATE ON repair_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();