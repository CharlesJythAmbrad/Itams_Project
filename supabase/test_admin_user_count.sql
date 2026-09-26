-- ==============================================================================
-- Test Admin User Count Function
-- This verifies the admin_get_all_users function works correctly
-- ==============================================================================

-- Test 1: Call the admin function
SELECT 'Admin function result:' as test;
SELECT 
    id,
    email,
    full_name,
    role,
    is_deactivated,
    created_at
FROM public.admin_get_all_users()
ORDER BY created_at DESC;

-- Test 2: Compare with direct query (should show different results due to RLS)
SELECT 'Direct users query (limited by RLS):' as test;
SELECT 
    id,
    email,
    full_name,
    role,
    is_deactivated,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Test 3: Count users by role
SELECT 'User count by role:' as test;
SELECT 
    role,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_deactivated = false) as active_count,
    COUNT(*) FILTER (WHERE is_deactivated = true) as deactivated_count
FROM public.admin_get_all_users()
GROUP BY role
ORDER BY role;

-- Test 4: Total counts
SELECT 'Total user statistics:' as test;
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_deactivated = false) as active_users,
    COUNT(*) FILTER (WHERE is_deactivated = true) as deactivated_users
FROM public.admin_get_all_users();

SELECT 'Test completed!' as status;