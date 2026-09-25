-- ==============================================================================
-- ITAMS Database Migration: Add is_deactivated and last_login_at to public.users
-- Run this script in the Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New query -> Paste and click "Run"
-- ==============================================================================

-- 1. Add missing columns to public.users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2. Create index for query performance on user status filtering
CREATE INDEX IF NOT EXISTS idx_users_is_deactivated ON public.users(is_deactivated);

-- 3. Ensure ITSD administrators have permission to update user status
DROP POLICY IF EXISTS "ITSD can update users" ON public.users;

CREATE POLICY "ITSD can update users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users admin_u 
      WHERE admin_u.id = auth.uid() 
        AND admin_u.role = 'itsd'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users admin_u 
      WHERE admin_u.id = auth.uid() 
        AND admin_u.role = 'itsd'
    )
  );

-- 4. Reload PostgREST schema cache immediately so the REST API detects the new columns
NOTIFY pgrst, 'reload schema';
