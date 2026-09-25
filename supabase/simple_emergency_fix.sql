-- ==============================================================================
-- SIMPLE EMERGENCY RLS FIX
-- This eliminates infinite recursion with a straightforward approach
-- ==============================================================================

BEGIN;

-- Step 1: Completely disable RLS to break all loops
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.itsd_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_staff_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.end_users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop problematic policies by name (avoid dynamic SQL issues)
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.users;
DROP POLICY IF EXISTS "itsd_admin_can_view_all_users" ON public.users;
DROP POLICY IF EXISTS "allow_user_registration" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "itsd_admin_can_update_all_users" ON public.users;
DROP POLICY IF EXISTS "service_role_full_access" ON public.users;
DROP POLICY IF EXISTS "prevent_deactivated_user_access" ON public.users;
DROP POLICY IF EXISTS "allow_public_signup" ON public.users;
DROP POLICY IF EXISTS "users_own_record_only" ON public.users;
DROP POLICY IF EXISTS "users_update_own_only" ON public.users;
DROP POLICY IF EXISTS "admins_view_all" ON public.users;
DROP POLICY IF EXISTS "admins_update_all" ON public.users;
DROP POLICY IF EXISTS "service_role_bypass" ON public.users;

-- Drop role table policies
DROP POLICY IF EXISTS "itsd_users_service_access" ON public.itsd_users;
DROP POLICY IF EXISTS "itsd_users_own_access" ON public.itsd_users;
DROP POLICY IF EXISTS "inventory_staff_users_service_access" ON public.inventory_staff_users;
DROP POLICY IF EXISTS "inventory_staff_users_own_access" ON public.inventory_staff_users;
DROP POLICY IF EXISTS "end_users_service_access" ON public.end_users;
DROP POLICY IF EXISTS "end_users_own_access" ON public.end_users;

-- Step 3: Drop helper functions that cause recursion
DROP FUNCTION IF EXISTS public.is_user_itsd_admin() CASCADE;
DROP FUNCTION IF EXISTS public.check_user_is_active() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;

-- Step 4: Create ULTRA-SIMPLE policies using ONLY auth.uid()
-- These policies CANNOT cause recursion because they never query the users table

-- USERS TABLE POLICIES (using ONLY auth.uid())
-- Policy 1: Allow public signup
CREATE POLICY "allow_signup"
    ON public.users
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy 2: Users can see only their own record
CREATE POLICY "view_own"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Policy 3: Users can update only their own record
CREATE POLICY "update_own"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Step 5: Create service role access for admin operations
CREATE POLICY "service_access"
    ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 6: Re-enable RLS with safe policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 7: Create simple role table policies
CREATE POLICY "itsd_service" ON public.itsd_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "itsd_own" ON public.itsd_users FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "inv_service" ON public.inventory_staff_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "inv_own" ON public.inventory_staff_users FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "end_service" ON public.end_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "end_own" ON public.end_users FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Enable RLS on role tables
ALTER TABLE IF EXISTS public.itsd_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.end_users ENABLE ROW LEVEL SECURITY;

-- Step 8: Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.users TO anon;
GRANT ALL ON public.itsd_users TO authenticated;
GRANT ALL ON public.inventory_staff_users TO authenticated;
GRANT ALL ON public.end_users TO authenticated;

-- Step 9: Create admin function for user management
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    is_deactivated BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
AS $$
BEGIN
    -- This function runs with elevated privileges to bypass RLS
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.role::TEXT,  -- Cast enum to text
        COALESCE(u.is_deactivated, false) as is_deactivated,
        u.created_at,
        COALESCE(u.updated_at, u.created_at) as updated_at
    FROM public.users u
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;

-- Step 10: Create admin update function
CREATE OR REPLACE FUNCTION public.admin_update_user(
    target_user_id UUID,
    new_is_deactivated BOOLEAN
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check if the current user is ITSD admin
    SELECT role INTO current_user_role 
    FROM public.users 
    WHERE id = auth.uid();
    
    -- Only allow ITSD users to perform admin operations
    IF current_user_role != 'itsd' THEN
        RAISE EXCEPTION 'Access denied: Only ITSD administrators can perform this operation';
    END IF;
    
    -- Prevent users from deactivating themselves
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot deactivate your own account';
    END IF;
    
    -- Update the user
    UPDATE public.users 
    SET 
        is_deactivated = new_is_deactivated,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_update_user(UUID, BOOLEAN) TO authenticated;

COMMIT;

-- Success message
SELECT 'SUCCESS: Infinite recursion eliminated! Admin functions created!' as status;