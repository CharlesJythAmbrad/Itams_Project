-- Fix the asset_assignments table to match the form fields
-- This will recreate the table with all required columns

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.asset_assignments CASCADE;

-- Create the correct table structure
CREATE TABLE public.asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  borrower_name TEXT NOT NULL,
  borrower_email TEXT NOT NULL,
  borrower_department TEXT NOT NULL,
  borrower_employee_id TEXT,
  borrower_phone TEXT,
  assignment_location TEXT NOT NULL,
  purpose TEXT NOT NULL,
  assignment_type TEXT NOT NULL,
  expected_return_date DATE,
  project_name TEXT,
  supervisor_name TEXT,
  supervisor_email TEXT,
  special_instructions TEXT,
  status TEXT DEFAULT 'active',
  assigned_by UUID,
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to assets table
ALTER TABLE public.asset_assignments
ADD CONSTRAINT fk_asset_assignments_asset_id
FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.asset_assignments
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT ALL ON public.asset_assignments TO anon;

-- Verify the table structure
SELECT 
    'TABLE CREATED SUCCESSFULLY' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;