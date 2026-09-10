-- ==============================================================================
-- CREATE ASSET REPAIRS TABLE
-- This table tracks repair requests, maintenance, and service activities
-- ==============================================================================

-- Create the repairs table
CREATE TABLE IF NOT EXISTS public.asset_repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Asset reference
  asset_id UUID NOT NULL,
  
  -- Repair request details
  repair_ticket TEXT UNIQUE NOT NULL, -- Generated ticket number (e.g., RPR-2024-0001)
  issue_description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, quote_pending, completed, cancelled
  
  -- Reporter information
  reported_by_name TEXT NOT NULL,
  reported_by_email TEXT,
  reported_by_department TEXT,
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Technician/Service provider
  assigned_technician TEXT,
  technician_contact TEXT,
  service_provider TEXT,
  
  -- Cost tracking
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  
  -- Timeline
  estimated_completion_date DATE,
  actual_completion_date DATE,
  
  -- Location and notes
  repair_location TEXT,
  notes TEXT,
  work_order_number TEXT,
  
  -- Metadata
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to assets table
ALTER TABLE public.asset_repairs
ADD CONSTRAINT fk_asset_repairs_asset_id
FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_repairs_asset_id ON public.asset_repairs(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_repairs_status ON public.asset_repairs(status);
CREATE INDEX IF NOT EXISTS idx_asset_repairs_priority ON public.asset_repairs(priority);
CREATE INDEX IF NOT EXISTS idx_asset_repairs_reported_date ON public.asset_repairs(reported_date);

-- Enable RLS
ALTER TABLE public.asset_repairs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "repairs_full_access" ON public.asset_repairs
    FOR ALL 
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.asset_repairs TO authenticated;
GRANT ALL ON public.asset_repairs TO anon;

-- Create function to generate repair ticket numbers
CREATE OR REPLACE FUNCTION generate_repair_ticket()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    ticket_number TEXT;
BEGIN
    -- Get current year
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(repair_ticket FROM 'RPR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.asset_repairs
    WHERE repair_ticket LIKE 'RPR-' || year_part || '-%';
    
    -- Format ticket number with zero padding
    ticket_number := 'RPR-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Insert sample repair data
INSERT INTO public.asset_repairs (
    asset_id,
    repair_ticket,
    issue_description,
    priority,
    status,
    reported_by_name,
    reported_by_email,
    reported_by_department,
    reported_date,
    assigned_technician,
    technician_contact,
    estimated_cost,
    actual_cost,
    estimated_completion_date,
    actual_completion_date,
    repair_location,
    notes,
    work_order_number
) 
SELECT 
    a.id,
    generate_repair_ticket(),
    'Routine maintenance and cleaning required',
    'low',
    'pending',
    'System Admin',
    'admin@itams.edu',
    'IT Department',
    CURRENT_DATE - INTERVAL '2 days',
    'Internal IT Team',
    'it-support@itams.edu',
    50.00,
    NULL,
    CURRENT_DATE + INTERVAL '7 days',
    NULL,
    'IT Workshop',
    'Regular maintenance schedule',
    'WO-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0')
FROM public.assets a
WHERE a.category IN ('computer', 'laptop', 'printer')
LIMIT 3;

-- Insert a completed repair example
INSERT INTO public.asset_repairs (
    asset_id,
    repair_ticket,
    issue_description,
    priority,
    status,
    reported_by_name,
    reported_by_email,
    reported_by_department,
    reported_date,
    assigned_technician,
    technician_contact,
    estimated_cost,
    actual_cost,
    estimated_completion_date,
    actual_completion_date,
    repair_location,
    notes,
    work_order_number
) 
SELECT 
    a.id,
    generate_repair_ticket(),
    'Screen display issues - flickering',
    'high',
    'completed',
    'Faculty User',
    'faculty@itams.edu',
    'Academic Department',
    CURRENT_DATE - INTERVAL '10 days',
    'Display Repair Services',
    '555-0199',
    200.00,
    180.00,
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE - INTERVAL '1 day',
    'External Repair Shop',
    'LCD panel replaced successfully',
    'WO-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0')
FROM public.assets a
WHERE a.category = 'monitor'
LIMIT 1;

-- Show the created table structure
SELECT 'REPAIRS TABLE CREATED SUCCESSFULLY:' as status;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'asset_repairs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data
SELECT 'SAMPLE REPAIR RECORDS:' as info;
SELECT 
    repair_ticket,
    issue_description,
    priority,
    status,
    reported_by_name
FROM public.asset_repairs
ORDER BY created_at DESC;