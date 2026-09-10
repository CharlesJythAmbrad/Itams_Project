-- SIMPLE ASSIGNMENT AND BORROWING SETUP
-- Run this in your Supabase SQL Editor to fix the schema issues

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS public.asset_assignments CASCADE;
DROP TABLE IF EXISTS public.asset_borrowing CASCADE;

-- 2. Create asset_assignments table (for permanent assignments)
CREATE TABLE public.asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
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

-- 3. Create asset_borrowing table (for temporary borrowing)
CREATE TABLE public.asset_borrowing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
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

-- 4. Enable RLS
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_borrowing ENABLE ROW LEVEL SECURITY;

-- 5. Create policies
CREATE POLICY "Allow all operations for authenticated users" ON public.asset_assignments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.asset_borrowing
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Grant permissions
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT ALL ON public.asset_borrowing TO authenticated;

-- 7. Force schema cache refresh (multiple methods)
NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE public.asset_assignments IS 'Assignments table - ' || NOW();
COMMENT ON TABLE public.asset_borrowing IS 'Borrowing table - ' || NOW();

-- 8. Verify tables exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('asset_assignments', 'asset_borrowing')
ORDER BY table_name, ordinal_position;

-- Success message
SELECT 'Assignment and borrowing tables created successfully!' as result;