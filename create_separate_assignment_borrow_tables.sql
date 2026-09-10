-- ==============================================================================
-- CREATE SEPARATE TABLES FOR ASSET ASSIGNMENTS AND BORROWING
-- This creates dedicated tables for each type of asset allocation
-- ==============================================================================

-- 1. DROP existing combined table if it exists
DROP TABLE IF EXISTS public.asset_assignments CASCADE;

-- 2. CREATE ASSET_ASSIGNMENTS TABLE (for permanent/long-term assignments)
CREATE TABLE public.asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Asset Information
    asset_id UUID NOT NULL,
    
    -- Assignee Information
    assignee_name TEXT NOT NULL,
    assignee_email TEXT NOT NULL,
    assignee_department TEXT NOT NULL,
    assignee_employee_id TEXT,
    assignee_phone TEXT,
    
    -- Assignment Details
    assignment_location TEXT NOT NULL,
    purpose TEXT NOT NULL,
    assignment_reason TEXT, -- Why this asset was assigned (new employee, replacement, etc.)
    
    -- Assignment Tracking
    assigned_by UUID, -- Who assigned the asset
    assigned_date TIMESTAMPTZ DEFAULT NOW(),
    effective_start_date DATE DEFAULT CURRENT_DATE,
    expected_end_date DATE, -- Optional, for temporary assignments
    
    -- Status and Notes
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'returned', 'terminated')),
    special_instructions TEXT,
    notes TEXT,
    
    -- Approval Workflow (if needed)
    supervisor_name TEXT,
    supervisor_email TEXT,
    approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID,
    approved_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE ASSET_BORROWING TABLE (for temporary/short-term borrowing)
CREATE TABLE public.asset_borrowing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Asset Information
    asset_id UUID NOT NULL,
    
    -- Borrower Information
    borrower_name TEXT NOT NULL,
    borrower_email TEXT NOT NULL,
    borrower_department TEXT NOT NULL,
    borrower_employee_id TEXT,
    borrower_phone TEXT,
    
    -- Borrowing Details
    borrow_location TEXT NOT NULL,
    purpose TEXT NOT NULL,
    project_name TEXT, -- What project/activity this is for
    
    -- Time Management
    borrowed_date TIMESTAMPTZ DEFAULT NOW(),
    expected_return_date DATE NOT NULL, -- Always required for borrowing
    actual_return_date TIMESTAMPTZ,
    
    -- Borrowing Tracking
    borrowed_by UUID, -- Staff member who processed the borrowing
    returned_by UUID, -- Staff member who processed the return
    
    -- Status Management
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost', 'damaged')),
    
    -- Condition Tracking
    condition_on_borrow TEXT DEFAULT 'good' CHECK (condition_on_borrow IN ('excellent', 'good', 'fair', 'poor')),
    condition_on_return TEXT CHECK (condition_on_return IN ('excellent', 'good', 'fair', 'poor', 'damaged', 'lost')),
    condition_notes TEXT,
    
    -- Approval and Supervision
    supervisor_name TEXT,
    supervisor_email TEXT,
    supervisor_approval_required BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    approved_date TIMESTAMPTZ,
    
    -- Special Instructions and Extensions
    special_instructions TEXT,
    extension_requests JSONB DEFAULT '[]', -- Track extension requests
    late_return_fees DECIMAL(10,2) DEFAULT 0.00,
    
    -- Notifications
    reminder_sent_dates TIMESTAMPTZ[],
    overdue_notification_sent BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ADD FOREIGN KEY CONSTRAINTS
ALTER TABLE public.asset_assignments
ADD CONSTRAINT fk_asset_assignments_asset_id
FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

ALTER TABLE public.asset_borrowing
ADD CONSTRAINT fk_asset_borrowing_asset_id
FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

-- 5. CREATE INDEXES FOR PERFORMANCE
-- Asset Assignments Indexes
CREATE INDEX idx_asset_assignments_asset_id ON public.asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_status ON public.asset_assignments(status);
CREATE INDEX idx_asset_assignments_assignee_email ON public.asset_assignments(assignee_email);
CREATE INDEX idx_asset_assignments_department ON public.asset_assignments(assignee_department);
CREATE INDEX idx_asset_assignments_assigned_date ON public.asset_assignments(assigned_date DESC);

-- Asset Borrowing Indexes
CREATE INDEX idx_asset_borrowing_asset_id ON public.asset_borrowing(asset_id);
CREATE INDEX idx_asset_borrowing_status ON public.asset_borrowing(status);
CREATE INDEX idx_asset_borrowing_borrower_email ON public.asset_borrowing(borrower_email);
CREATE INDEX idx_asset_borrowing_return_date ON public.asset_borrowing(expected_return_date);
CREATE INDEX idx_asset_borrowing_borrowed_date ON public.asset_borrowing(borrowed_date DESC);
CREATE INDEX idx_asset_borrowing_overdue ON public.asset_borrowing(expected_return_date) WHERE status = 'active';

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_borrowing ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES
-- Asset Assignments Policies
CREATE POLICY "Enable all operations for authenticated users" ON public.asset_assignments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Assignees can view their assignments" ON public.asset_assignments
    FOR SELECT USING (
        assignee_email = (SELECT email FROM public.users WHERE id = auth.uid())
    );

-- Asset Borrowing Policies  
CREATE POLICY "Enable all operations for authenticated users" ON public.asset_borrowing
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Borrowers can view their borrowing records" ON public.asset_borrowing
    FOR SELECT USING (
        borrower_email = (SELECT email FROM public.users WHERE id = auth.uid())
    );

-- 8. GRANT PERMISSIONS
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT ALL ON public.asset_borrowing TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. CREATE FUNCTIONS FOR COMMON OPERATIONS

-- Function to check overdue borrowing
CREATE OR REPLACE FUNCTION check_overdue_borrowing()
RETURNS TABLE(
    borrowing_id UUID,
    asset_name TEXT,
    borrower_name TEXT,
    borrower_email TEXT,
    days_overdue INTEGER
) 
LANGUAGE SQL
AS $$
    SELECT 
        ab.id as borrowing_id,
        a.name as asset_name,
        ab.borrower_name,
        ab.borrower_email,
        (CURRENT_DATE - ab.expected_return_date)::INTEGER as days_overdue
    FROM public.asset_borrowing ab
    JOIN public.assets a ON ab.asset_id = a.id
    WHERE ab.status = 'active' 
    AND ab.expected_return_date < CURRENT_DATE;
$$;

-- Function to get borrowing history for an asset
CREATE OR REPLACE FUNCTION get_asset_borrowing_history(asset_uuid UUID)
RETURNS TABLE(
    borrower_name TEXT,
    borrowed_date TIMESTAMPTZ,
    expected_return_date DATE,
    actual_return_date TIMESTAMPTZ,
    status TEXT,
    purpose TEXT
)
LANGUAGE SQL
AS $$
    SELECT 
        ab.borrower_name,
        ab.borrowed_date,
        ab.expected_return_date,
        ab.actual_return_date,
        ab.status,
        ab.purpose
    FROM public.asset_borrowing ab
    WHERE ab.asset_id = asset_uuid
    ORDER BY ab.borrowed_date DESC;
$$;

-- 10. CREATE TRIGGERS FOR UPDATED_AT
-- Asset Assignments trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_asset_assignments_updated_at
    BEFORE UPDATE ON public.asset_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_borrowing_updated_at
    BEFORE UPDATE ON public.asset_borrowing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. FORCE SCHEMA CACHE REFRESH
NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE public.asset_assignments IS 'Asset assignments table - created ' || NOW();
COMMENT ON TABLE public.asset_borrowing IS 'Asset borrowing table - created ' || NOW();

-- 12. INSERT SAMPLE DATA FOR TESTING
-- Sample Assignment
INSERT INTO public.asset_assignments (
    asset_id,
    assignee_name,
    assignee_email,
    assignee_department,
    assignment_location,
    purpose,
    assignment_reason,
    status
) 
SELECT 
    id,
    'John Smith',
    'john.smith@itams.edu',
    'CITE',
    'CITE Building Room 201',
    'Teaching and research activities',
    'New faculty assignment',
    'active'
FROM public.assets 
WHERE status = 'in_stock'
LIMIT 1;

-- Sample Borrowing
INSERT INTO public.asset_borrowing (
    asset_id,
    borrower_name,
    borrower_email,
    borrower_department,
    borrow_location,
    purpose,
    project_name,
    expected_return_date,
    status
) 
SELECT 
    id,
    'Jane Doe',
    'jane.doe@itams.edu',
    'Engineering',
    'Engineering Lab A',
    'Student project demonstration',
    'Capstone Project 2024',
    CURRENT_DATE + INTERVAL '7 days',
    'active'
FROM public.assets 
WHERE status = 'in_stock' AND id NOT IN (
    SELECT asset_id FROM public.asset_assignments WHERE status = 'active'
)
LIMIT 1;

-- 13. VERIFICATION QUERIES
-- Show table structures
SELECT 
    'ASSET_ASSIGNMENTS_STRUCTURE' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'ASSET_BORROWING_STRUCTURE' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'asset_borrowing' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data
SELECT 'ASSIGNMENTS_SAMPLE' as data_type, COUNT(*) as count FROM public.asset_assignments;
SELECT 'BORROWING_SAMPLE' as data_type, COUNT(*) as count FROM public.asset_borrowing;

-- 14. FINAL SUCCESS MESSAGE
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SEPARATE ASSIGNMENT AND BORROWING TABLES CREATED!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '1. asset_assignments - For permanent/long-term assignments';
    RAISE NOTICE '2. asset_borrowing - For temporary/short-term borrowing';
    RAISE NOTICE '';
    RAISE NOTICE 'Features included:';
    RAISE NOTICE '- Separate tracking for assignments vs borrowing';
    RAISE NOTICE '- Overdue tracking for borrowed items';
    RAISE NOTICE '- Condition tracking (borrow/return condition)';
    RAISE NOTICE '- Extension request tracking';
    RAISE NOTICE '- Late return fees tracking';
    RAISE NOTICE '- Approval workflows';
    RAISE NOTICE '- Helper functions for overdue items';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample data has been inserted for testing.';
    RAISE NOTICE 'You can now update your React components to use these separate tables!';
END $$;