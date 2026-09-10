-- Check if asset_assignments table exists and what columns it has
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'asset_assignments' 
            AND table_schema = 'public'
        ) 
        THEN 'asset_assignments table EXISTS'
        ELSE 'asset_assignments table DOES NOT EXIST - need to create it'
    END as table_status;

-- If table exists, show its columns
SELECT 
    'CURRENT COLUMNS IN asset_assignments:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if assets table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'assets' 
            AND table_schema = 'public'
        ) 
        THEN 'assets table EXISTS'
        ELSE 'assets table DOES NOT EXIST'
    END as assets_table_status;