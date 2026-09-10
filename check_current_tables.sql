-- Check what tables currently exist and their policies
SELECT 
    'EXISTING TABLES:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS status
SELECT 
    'RLS STATUS:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public';

-- Check existing policies
SELECT 
    'CURRENT POLICIES:' as info,
    tablename,
    policyname,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public';

-- Check if asset_assignments has assignment_location column
SELECT 
    'ASSIGNMENT_LOCATION COLUMN CHECK:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' 
AND table_schema = 'public'
AND column_name = 'assignment_location';