-- ==============================================================================
-- DIAGNOSE DATABASE TABLES - CHECK WHAT EXISTS
-- Run this to see what tables and columns exist in your database
-- ==============================================================================

-- Check if asset_assignments table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'asset_assignments' AND table_schema = 'public'
        ) 
        THEN '✅ asset_assignments table EXISTS'
        ELSE '❌ asset_assignments table DOES NOT EXIST'
    END as table_status;

-- Check if assets table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'assets' AND table_schema = 'public'
        ) 
        THEN '✅ assets table EXISTS'
        ELSE '❌ assets table DOES NOT EXIST'
    END as assets_table_status;

-- Show all tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- If asset_assignments exists, show its columns
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'asset_assignments' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '=== ASSET_ASSIGNMENTS TABLE COLUMNS ===';
        -- This will be shown in the results below
    ELSE
        RAISE NOTICE '❌ asset_assignments table does not exist!';
    END IF;
END $$;

-- Show columns of asset_assignments table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show a count of any data in the tables
SELECT 
    'assets' as table_name,
    COUNT(*) as row_count
FROM public.assets
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'assets' AND table_schema = 'public'
)
UNION ALL
SELECT 
    'asset_assignments' as table_name,
    COUNT(*) as row_count
FROM public.asset_assignments
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'asset_assignments' AND table_schema = 'public'
);