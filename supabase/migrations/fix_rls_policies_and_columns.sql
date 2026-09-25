-- ==============================================================================
-- ITAMS Database Fix: RLS Policies and Missing Columns
-- ==============================================================================

-- 1. Add missing columns to public.users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_is_deactivated ON public.users(is_deactivated);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON public.users(updated_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON public.users(last_login_at);

-- 3. Create a function to update last_login_at automatically
CREATE OR REPLACE FUNCTION update_last_login_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_login_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Drop all existing potentially problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "ITSD can update users" ON public.users;
DROP POLICY IF EXISTS "ITSD can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public user registration" ON public.users;

-- 5. Create simple, non-recursive RLS policies
-- Policy for users to view their own profile
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to update their own profile (but not role or deactivation status)
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND OLD.role = NEW.role 
    AND OLD.is_deactivated = NEW.is_deactivated
  );

-- Policy for ITSD admins to view all users
CREATE POLICY "itsd_select_all"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    -- Check if current user is ITSD by looking up their role directly in auth.users metadata
    (auth.jwt() ->> 'user_metadata' ->> 'role') = 'itsd'
    OR
    -- Fallback: check role in users table without recursion
    auth.uid() IN (
      SELECT u.id FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'itsd'
    )
  );

-- Policy for ITSD admins to update any user
CREATE POLICY "itsd_update_all"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    -- Check if current user is ITSD
    (auth.jwt() ->> 'user_metadata' ->> 'role') = 'itsd'
    OR
    auth.uid() IN (
      SELECT u.id FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'itsd'
    )
  );

-- Policy for user registration (INSERT)
CREATE POLICY "public_insert_users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 6. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 7. Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- 8. Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 9. Create a simple function to test if user is ITSD (non-recursive)
CREATE OR REPLACE FUNCTION is_user_itsd(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'itsd'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update auth trigger function to set user metadata role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user metadata in auth.users to include role
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();