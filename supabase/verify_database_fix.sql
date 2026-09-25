-- ==============================================================================
-- ITAMS Database Verification Script
-- Run this to verify that all fixes have been applied correctly
-- ==============================================================================

-- 1. Check if all required columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('is_deactivated', 'last_login_at', 'updated_at')
ORDER BY column_name;

-- 2. Check RLS policies
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- 3. Test basic user queries that should work
SELECT 'Testing user count...' as test;
SELECT COUNT(*) as user_count FROM public.users;

SELECT 'Testing user status breakdown...' as test;
SELECT 
  role,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_deactivated = false) as active,
  COUNT(*) FILTER (WHERE is_deactivated = true) as inactive
FROM public.users 
GROUP BY role
ORDER BY role;

-- 4. Check if admin function works
SELECT 'Testing admin function...' as test;
SELECT public.is_admin_user() as current_user_is_admin;

-- 5. Test metadata sync
SELECT 'Checking auth metadata sync...' as test;
SELECT 
  u.id,
  u.email,
  u.role as user_role,
  (au.raw_user_meta_data ->> 'role') as metadata_role
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'itsd'
LIMIT 5;

SELECT 'Verification completed!' as status;