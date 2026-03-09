-- Create repair_history table
CREATE TABLE IF NOT EXISTS public.repair_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    cost DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    technician_name VARCHAR(255),
    technician_notes TEXT,
    repair_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    images JSONB,
    parts_used JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    urgency VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    preferred_date DATE,
    assigned_technician VARCHAR(255),
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_repair_history_user_id ON public.repair_history(user_id);
CREATE INDEX idx_repair_history_status ON public.repair_history(status);
CREATE INDEX idx_repair_history_created_at ON public.repair_history(created_at DESC);

CREATE INDEX idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_service_requests_urgency ON public.service_requests(urgency);
CREATE INDEX idx_service_requests_created_at ON public.service_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.repair_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for repair_history
CREATE POLICY "Users can view their own repair history"
    ON public.repair_history FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own repair history"
    ON public.repair_history FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own repair history"
    ON public.repair_history FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own repair history"
    ON public.repair_history FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Create RLS policies for service_requests
CREATE POLICY "Users can view their own service requests"
    ON public.service_requests FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own service requests"
    ON public.service_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own service requests"
    ON public.service_requests FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own service requests"
    ON public.service_requests FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_repair_history_updated_at BEFORE UPDATE
    ON public.repair_history FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE
    ON public.service_requests FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.repair_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;