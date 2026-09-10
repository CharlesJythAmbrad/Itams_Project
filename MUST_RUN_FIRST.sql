-- !!!! CRITICAL: RUN THIS FIRST IN SUPABASE SQL EDITOR !!!!
-- This script creates the required database tables for assignment/borrowing functionality

-- Clean slate: Drop existing tables
DROP TABLE IF EXISTS public.asset_assignments CASCADE;
DROP TABLE IF EXISTS public.asset_borrowing CASCADE;

-- Create asset_assignments table
CREATE TABLE public.asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL,
    assignee_name TEXT NOT NULL,
    assignee_email TEXT NOT NULL,
    assignee_department TEXT NOT NULL,
    assignee_employee_id TEXT,
    assignee_phone TEXT,
    assignment_location TEXT NOT NULL,
    purpose TEXT NOT NULL,
    assignment_reason TEXT,
    supervisor_name TEXT,
    supervisor_email TEXT,
    special_instructions TEXT,
    assigned_by UUID,
    status TEXT DEFAULT 'active',
    assigned_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create asset_borrowing table
CREATE TABLE public.asset_borrowing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL,
    borrower_name TEXT NOT NULL,
    borrower_email TEXT NOT NULL,
    borrower_department TEXT NOT NULL,
    borrower_employee_id TEXT,
    borrower_phone TEXT,
    borrow_location TEXT NOT NULL,
    purpose TEXT NOT NULL,
    project_name TEXT,
    expected_return_date DATE NOT NULL,
    supervisor_name TEXT,
    supervisor_email TEXT,
    special_instructions TEXT,
    borrowed_by UUID,
    status TEXT DEFAULT 'active',
    borrowed_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE public.asset_assignments
ADD CONSTRAINT fk_asset_assignments_asset_id
FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

ALTER TABLE public.asset_borrowing
ADD CONSTRAINT fk_asset_borrowing_asset_id
FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_borrowing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "authenticated_all_access" ON public.asset_assignments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_all_access" ON public.asset_borrowing
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT ALL ON public.asset_borrowing TO authenticated;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Verify everything is working
SELECT 'SETUP COMPLETE! Tables created successfully.' as result;
SELECT table_name, column_name FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('asset_assignments', 'asset_borrowing')
ORDER BY table_name, ordinal_position;