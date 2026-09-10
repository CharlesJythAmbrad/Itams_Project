-- Show current columns in asset_assignments table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Now recreate the table with the exact columns the form needs
DROP TABLE IF EXISTS public.asset_assignments CASCADE;

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

-- Enable RLS and create simple policy
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON public.asset_assignments
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT ALL ON public.asset_assignments TO anon;

-- Show the new columns
SELECT 'NEW TABLE STRUCTURE:' as message;

SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;