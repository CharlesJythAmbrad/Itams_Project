-- ========================================
-- FINAL DATABASE SETUP FOR ASSIGNMENTS & BORROWING
-- Copy this ENTIRE script and run it in Supabase SQL Editor
-- ========================================

-- Step 1: Clean up any existing tables
DROP TABLE IF EXISTS public.asset_assignments CASCADE;
DROP TABLE IF EXISTS public.asset_borrowing CASCADE;

-- Step 2: Create asset_assignments table (for permanent assignments)
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

-- Step 3: Create asset_borrowing table (for temporary borrowing)
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

-- Step 4: Add foreign key constraints
ALTER TABLE public.asset_assignments
ADD CONSTRAINT fk_asset_assignments_asset_id
FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

ALTER TABLE public.asset_borrowing
ADD CONSTRAINT fk_asset_borrowing_asset_id
FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

-- Step 5: Enable Row Level Security
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_borrowing ENABLE ROW LEVEL SECURITY;

-- Step 6: Create security policies
CREATE POLICY "authenticated_users_all_access" ON public.asset_assignments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_users_all_access" ON public.asset_borrowing
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 7: Grant permissions
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT ALL ON public.asset_borrowing TO authenticated;

-- Step 8: Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Step 9: Insert sample test data
INSERT INTO public.asset_assignments (
    asset_id,
    assignee_name,
    assignee_email,
    assignee_department,
    assignment_location,
    purpose
) VALUES (
    (SELECT id FROM public.assets LIMIT 1),
    'Test User Assignment',
    'test.assignment@example.com',
    'IT Department',
    'Test Location',
    'Testing assignment functionality'
);

INSERT INTO public.asset_borrowing (
    asset_id,
    borrower_name,
    borrower_email,
    borrower_department,
    borrow_location,
    purpose,
    expected_return_date
) VALUES (
    (SELECT id FROM public.assets LIMIT 1),
    'Test User Borrowing',
    'test.borrowing@example.com',
    'IT Department',
    'Test Location',
    'Testing borrowing functionality',
    CURRENT_DATE + INTERVAL '7 days'
);

-- Step 10: Verify everything works
SELECT 'VERIFICATION - asset_assignments table:' as check_type, COUNT(*) as record_count FROM public.asset_assignments;
SELECT 'VERIFICATION - asset_borrowing table:' as check_type, COUNT(*) as record_count FROM public.asset_borrowing;

-- Step 11: Show table structures
SELECT 
    'TABLE STRUCTURE VERIFICATION' as info,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('asset_assignments', 'asset_borrowing')
ORDER BY table_name, ordinal_position;

-- Final success message
SELECT '🎉 SUCCESS: Assignment and borrowing tables are ready!' as result;