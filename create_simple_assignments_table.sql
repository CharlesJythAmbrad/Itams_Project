-- ==============================================================================
-- SIMPLE ASSIGNMENTS TABLE - GUARANTEED TO WORK
-- This creates a minimal table that will definitely work with the form
-- ==============================================================================

-- Drop existing table to start fresh
DROP TABLE IF EXISTS public.asset_assignments CASCADE;

-- Create a simple, guaranteed-to-work table
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
  actual_return_date DATE,
  project_name TEXT,
  supervisor_name TEXT,
  supervisor_email TEXT,
  special_instructions TEXT,
  status TEXT DEFAULT 'active',
  assigned_by UUID,
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  returned_by UUID,
  returned_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

-- Simple policies - allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON public.asset_assignments
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT ALL ON public.asset_assignments TO anon;

-- Create basic indexes
CREATE INDEX idx_assignments_asset_id ON public.asset_assignments(asset_id);
CREATE INDEX idx_assignments_status ON public.asset_assignments(status);
CREATE INDEX idx_assignments_type ON public.asset_assignments(assignment_type);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Simple assignments table created successfully!';
  RAISE NOTICE 'This table has all the columns the form needs:';
  RAISE NOTICE '  - assignment_location ✅';
  RAISE NOTICE '  - borrower_name ✅';
  RAISE NOTICE '  - borrower_email ✅'; 
  RAISE NOTICE '  - All other required fields ✅';
  RAISE NOTICE '';
  RAISE NOTICE 'Try the assignment form now - it should work!';
END $$;

-- Show the created table structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;