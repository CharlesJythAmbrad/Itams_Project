-- ==============================================================================
-- QUICK FIX: Add missing assignment_location column
-- This adds the missing column to the existing asset_assignments table
-- ==============================================================================

-- Add the missing assignment_location column
DO $$ 
BEGIN
    -- Check if the column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asset_assignments' 
        AND column_name = 'assignment_location' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.asset_assignments 
        ADD COLUMN assignment_location TEXT NOT NULL DEFAULT 'Not Specified';
        
        RAISE NOTICE 'Added assignment_location column to asset_assignments table';
    ELSE
        RAISE NOTICE 'assignment_location column already exists';
    END IF;
    
    -- Also add other missing columns that the form uses
    
    -- borrower_employee_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asset_assignments' 
        AND column_name = 'borrower_employee_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.asset_assignments 
        ADD COLUMN borrower_employee_id TEXT;
        RAISE NOTICE 'Added borrower_employee_id column';
    END IF;
    
    -- borrower_phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asset_assignments' 
        AND column_name = 'borrower_phone' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.asset_assignments 
        ADD COLUMN borrower_phone TEXT;
        RAISE NOTICE 'Added borrower_phone column';
    END IF;
    
    -- expected_return_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asset_assignments' 
        AND column_name = 'expected_return_date' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.asset_assignments 
        ADD COLUMN expected_return_date DATE;
        RAISE NOTICE 'Added expected_return_date column';
    END IF;
    
    -- special_instructions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asset_assignments' 
        AND column_name = 'special_instructions' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.asset_assignments 
        ADD COLUMN special_instructions TEXT;
        RAISE NOTICE 'Added special_instructions column';
    END IF;
    
    -- project_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asset_assignments' 
        AND column_name = 'project_name' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.asset_assignments 
        ADD COLUMN project_name TEXT;
        RAISE NOTICE 'Added project_name column';
    END IF;
    
    -- supervisor_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asset_assignments' 
        AND column_name = 'supervisor_name' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.asset_assignments 
        ADD COLUMN supervisor_name TEXT;
        RAISE NOTICE 'Added supervisor_name column';
    END IF;
    
    -- supervisor_email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asset_assignments' 
        AND column_name = 'supervisor_email' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.asset_assignments 
        ADD COLUMN supervisor_email TEXT;
        RAISE NOTICE 'Added supervisor_email column';
    END IF;

EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'asset_assignments table does not exist. Please create it first using complete_database_fix.sql';
END $$;

-- Show the updated table structure
SELECT 
    'UPDATED TABLE STRUCTURE:' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'SUCCESS: All missing columns have been added to asset_assignments table!' as result;