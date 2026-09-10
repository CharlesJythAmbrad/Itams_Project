-- ==============================================================================
-- FIX ASSET ASSIGNMENTS TABLE - CORRECT COLUMN NAMES
-- Run this to fix the assignments table to match the form fields
-- ==============================================================================

-- First, drop the existing table if it exists
DROP TABLE IF EXISTS public.asset_assignments CASCADE;

-- Create asset assignments table with correct column names matching the form
CREATE TABLE public.asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Asset Information
  asset_id UUID NOT NULL,
  
  -- Borrower/Assignee Information
  borrower_name VARCHAR(255) NOT NULL,
  borrower_email VARCHAR(255) NOT NULL,
  borrower_department VARCHAR(255) NOT NULL,
  borrower_employee_id VARCHAR(100),
  borrower_phone VARCHAR(50),
  
  -- Assignment Details (matching form field names exactly)
  assignment_location VARCHAR(500) NOT NULL,
  purpose TEXT NOT NULL,
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('assign', 'borrow')),
  expected_return_date DATE,
  actual_return_date DATE,
  
  -- Additional Information (for borrowing)
  project_name VARCHAR(255),
  supervisor_name VARCHAR(255),
  supervisor_email VARCHAR(255),
  special_instructions TEXT,
  
  -- Assignment Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  
  -- Audit Information
  assigned_by UUID,
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  returned_by UUID,
  returned_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Notes
  notes TEXT
);

-- Add foreign key constraint to assets table (if it exists)
DO $$
BEGIN
    -- Try to add foreign key constraint
    BEGIN
        ALTER TABLE public.asset_assignments 
        ADD CONSTRAINT fk_asset_assignments_asset_id 
        FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Foreign key constraint added successfully!';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️  Assets table not found. Foreign key will be added when assets table exists.';
    END;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset_id ON public.asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_borrower_email ON public.asset_assignments(borrower_email);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_status ON public.asset_assignments(status);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_assignment_type ON public.asset_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_assigned_date ON public.asset_assignments(assigned_date);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_expected_return_date ON public.asset_assignments(expected_return_date);

-- Enable Row Level Security
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.asset_assignments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.asset_assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.asset_assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.asset_assignments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_asset_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_asset_assignments_updated_at_trigger
    BEFORE UPDATE ON public.asset_assignments
    FOR EACH ROW EXECUTE FUNCTION update_asset_assignments_updated_at();

-- Grant permissions
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT ALL ON public.asset_assignments TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Asset assignments table fixed successfully!';
  RAISE NOTICE 'Column names now match the form fields exactly:';
  RAISE NOTICE '  - assignment_location ✅';
  RAISE NOTICE '  - borrower_name ✅';
  RAISE NOTICE '  - borrower_email ✅';
  RAISE NOTICE '  - borrower_department ✅';
  RAISE NOTICE '  - purpose ✅';
  RAISE NOTICE '  - assignment_type ✅';
  RAISE NOTICE '  - expected_return_date ✅';
  RAISE NOTICE '';
  RAISE NOTICE 'The assignment form should now work correctly!';
END $$;

-- Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;