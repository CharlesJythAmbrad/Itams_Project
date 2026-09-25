-- ==============================================================================
-- Test User Dashboard Access
-- This script verifies that users can access their assigned dashboards
-- ==============================================================================

-- Test 1: Check users table structure and data
SELECT 
    'Users table data:' as test,
    id,
    email,
    full_name,
    role,
    is_deactivated,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Test 2: Check role-specific tables have matching records
SELECT 
    'ITSD users:' as test,
    u.email,
    u.full_name,
    i.admin_level,
    i.specialization
FROM public.users u
JOIN public.itsd_users i ON u.id = i.user_id
WHERE u.role = 'itsd';

SELECT 
    'Inventory staff users:' as test,
    u.email,
    u.full_name,
    inv.warehouse_location,
    inv.inventory_tier
FROM public.users u
JOIN public.inventory_staff_users inv ON u.id = inv.user_id
WHERE u.role = 'inventory_staff';

SELECT 
    'End users:' as test,
    u.email,
    u.full_name,
    e.department,
    e.job_title
FROM public.users u
JOIN public.end_users e ON u.id = e.user_id
WHERE u.role = 'end_user';

-- Test 3: Check for orphaned users (users without role-specific records)
SELECT 
    'Users without role records:' as test,
    u.id,
    u.email,
    u.role,
    CASE 
        WHEN u.role = 'itsd' AND i.user_id IS NULL THEN 'Missing ITSD record'
        WHEN u.role = 'inventory_staff' AND inv.user_id IS NULL THEN 'Missing Inventory Staff record'
        WHEN u.role = 'end_user' AND e.user_id IS NULL THEN 'Missing End User record'
        ELSE 'OK'
    END as status
FROM public.users u
LEFT JOIN public.itsd_users i ON u.id = i.user_id AND u.role = 'itsd'
LEFT JOIN public.inventory_staff_users inv ON u.id = inv.user_id AND u.role = 'inventory_staff'
LEFT JOIN public.end_users e ON u.id = e.user_id AND u.role = 'end_user'
WHERE 
    (u.role = 'itsd' AND i.user_id IS NULL) OR
    (u.role = 'inventory_staff' AND inv.user_id IS NULL) OR
    (u.role = 'end_user' AND e.user_id IS NULL);

-- Test 4: Check RLS policies allow proper access
SELECT 
    'RLS policies for user access:' as test,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('users', 'itsd_users', 'inventory_staff_users', 'end_users')
ORDER BY tablename, policyname;

-- Test 5: Test trigger function
SELECT 
    'User creation trigger status:' as test,
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_timing
FROM information_schema.triggers t
WHERE t.trigger_name = 'on_auth_user_created';

SELECT 'All dashboard access tests completed!' as final_status;