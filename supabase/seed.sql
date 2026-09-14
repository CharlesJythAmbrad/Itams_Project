-- ==============================================================================
-- ITAMS Supabase RBAC Schema: Each Role on a Dedicated Table
-- Tables: public.users, public.itsd_users, public.inventory_staff_users, public.end_users
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop old structures if they exist to ensure a clean migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.itsd_users CASCADE;
DROP TABLE IF EXISTS public.inventory_staff_users CASCADE;
DROP TABLE IF EXISTS public.end_users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 3. Create RBAC Role Enum
CREATE TYPE user_role AS ENUM ('itsd', 'inventory_staff', 'end_user');

-- 4. Main public.users Table (Linked 1:1 with auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'end_user'::user_role,
  is_deactivated BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Dedicated Role Tables for each role
-- 5A. ITSD Role Table (IT Support & System Administrators)
CREATE TABLE public.itsd_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  admin_level TEXT NOT NULL DEFAULT 'Tier 2 Support',
  specialization TEXT DEFAULT 'Enterprise IT & Hardware Infrastructure',
  shift TEXT DEFAULT 'Day Shift',
  can_manage_assets BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5B. INVENTORY STAFF Role Table (Asset Custodians & Warehouse Managers)
CREATE TABLE public.inventory_staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  warehouse_location TEXT NOT NULL DEFAULT 'Central Depot - Building B',
  inventory_tier TEXT DEFAULT 'Full Custody & Stock Control',
  badge_number TEXT DEFAULT 'INV-8821',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5C. END USERS Role Table (General Employees / Faculty Requesters)
CREATE TABLE public.end_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  department TEXT NOT NULL DEFAULT 'Medical Faculty & Operations',
  employee_id TEXT DEFAULT 'EMP-9024',
  job_title TEXT DEFAULT 'Clinical Staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itsd_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.end_users ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Helper function with SECURITY DEFINER to check user role without recursive policy loops
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Function to check if user is deactivated during authentication
CREATE OR REPLACE FUNCTION check_user_access_on_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user exists and is deactivated
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.id 
    AND is_deactivated = TRUE
  ) THEN
    -- Prevent login by raising an exception
    RAISE EXCEPTION 'ACCOUNT_DEACTIVATED: Your account has been deactivated. Please contact an administrator.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last login timestamp
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies first so re-running seed.sql is 100% idempotent
DROP POLICY IF EXISTS "Users can view own user record" ON public.users;
DROP POLICY IF EXISTS "ITSD can view all users" ON public.users;
DROP POLICY IF EXISTS "ITSD can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Block deactivated users from all access" ON public.users;
DROP POLICY IF EXISTS "ITSD users can view own role record" ON public.itsd_users;
DROP POLICY IF EXISTS "Inventory staff can view own role record" ON public.inventory_staff_users;
DROP POLICY IF EXISTS "End users can view own role record" ON public.end_users;
DROP POLICY IF EXISTS "ITSD can view all role tables" ON public.itsd_users;
DROP POLICY IF EXISTS "ITSD can view all inventory" ON public.inventory_staff_users;
DROP POLICY IF EXISTS "ITSD can view all end_users" ON public.end_users;
DROP POLICY IF EXISTS "Block deactivated users from itsd table" ON public.itsd_users;
DROP POLICY IF EXISTS "Block deactivated users from inventory table" ON public.inventory_staff_users;
DROP POLICY IF EXISTS "Block deactivated users from end_users table" ON public.end_users;

-- Users table policies (no recursion because get_auth_user_role is SECURITY DEFINER!)
CREATE POLICY "Users can view own user record"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "ITSD can view all users"
  ON public.users FOR SELECT USING (public.get_auth_user_role() = 'itsd');

CREATE POLICY "ITSD can manage all users"
  ON public.users FOR ALL USING (
    public.get_auth_user_role() = 'itsd' 
    AND NOT EXISTS (
      SELECT 1 FROM public.users blocked_user
      WHERE blocked_user.id = auth.uid()
      AND blocked_user.is_deactivated = TRUE
    )
  );

CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Prevent deactivated users from accessing any data
CREATE POLICY "Block deactivated users from all access"
  ON public.users FOR ALL TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.users blocked_user
      WHERE blocked_user.id = auth.uid()
      AND blocked_user.is_deactivated = TRUE
    )
  );

-- Role-specific table policies
CREATE POLICY "ITSD users can view own role record"
  ON public.itsd_users FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Inventory staff can view own role record"
  ON public.inventory_staff_users FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "End users can view own role record"
  ON public.end_users FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ITSD can view all role tables"
  ON public.itsd_users FOR ALL USING (public.get_auth_user_role() = 'itsd');

CREATE POLICY "ITSD can view all inventory"
  ON public.inventory_staff_users FOR ALL USING (public.get_auth_user_role() = 'itsd');

CREATE POLICY "ITSD can view all end_users"
  ON public.end_users FOR ALL USING (public.get_auth_user_role() = 'itsd');

-- Block deactivated users from role tables
CREATE POLICY "Block deactivated users from itsd table"
  ON public.itsd_users FOR ALL TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.users blocked_user
      WHERE blocked_user.id = auth.uid()
      AND blocked_user.is_deactivated = TRUE
    )
  );

CREATE POLICY "Block deactivated users from inventory table"
  ON public.inventory_staff_users FOR ALL TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.users blocked_user
      WHERE blocked_user.id = auth.uid()
      AND blocked_user.is_deactivated = TRUE
    )
  );

CREATE POLICY "Block deactivated users from end_users table"
  ON public.end_users FOR ALL TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.users blocked_user
      WHERE blocked_user.id = auth.uid()
      AND blocked_user.is_deactivated = TRUE
    )
  );

-- 8. Auto-provisioning trigger on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role := 'end_user'::user_role;
  user_full_name TEXT;
BEGIN
  -- Determine role from metadata if specified
  IF (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN
    BEGIN
      assigned_role := (NEW.raw_user_meta_data->>'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
      assigned_role := 'end_user'::user_role;
    END;
  END IF;

  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_full_name, assigned_role)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Insert into respective dedicated role table
  IF assigned_role = 'itsd' THEN
    INSERT INTO public.itsd_users (user_id, admin_level, specialization)
    VALUES (NEW.id, 'Tier 2 Support', 'Enterprise IT & Hardware')
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF assigned_role = 'inventory_staff' THEN
    INSERT INTO public.inventory_staff_users (user_id, warehouse_location, inventory_tier)
    VALUES (NEW.id, 'Central Depot - Building B', 'Stock Custodian')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.end_users (user_id, department, employee_id)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'department', 'Operations'), 'EMP-' || SUBSTRING(NEW.id::TEXT, 1, 4))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to check user access on auth updates (prevents deactivated user login)
DROP TRIGGER IF EXISTS check_deactivated_user_login ON auth.users;
CREATE TRIGGER check_deactivated_user_login
  BEFORE UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION check_user_access_on_login();

-- Trigger to update last login timestamp
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_user_last_login();

-- ==============================================================================
-- 10. USER ACTIVITY LOG TABLE FOR ADMIN AUDIT TRAIL
-- ==============================================================================

-- Create user activity log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'activated', 'deactivated', 'role_changed'
    performed_by UUID NOT NULL REFERENCES public.users(id),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user activity log
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policy for user activity log
DROP POLICY IF EXISTS "ITSD admins can manage activity log" ON public.user_activity_log;
CREATE POLICY "ITSD admins can manage activity log" ON public.user_activity_log
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'itsd'
            AND (u.is_deactivated = FALSE OR u.is_deactivated IS NULL)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'itsd'
            AND (u.is_deactivated = FALSE OR u.is_deactivated IS NULL)
        )
    );

-- Function to log user management actions
CREATE OR REPLACE FUNCTION log_user_management_action()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    current_admin UUID;
BEGIN
    -- Get current admin user
    SELECT id INTO current_admin FROM public.users WHERE id = auth.uid() AND role = 'itsd';
    
    IF current_admin IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'created';
        INSERT INTO public.user_activity_log (user_id, action, performed_by, details)
        VALUES (NEW.id, action_type, current_admin, 
                jsonb_build_object(
                    'email', NEW.email,
                    'full_name', NEW.full_name,
                    'role', NEW.role
                ));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check what changed
        IF OLD.is_deactivated != NEW.is_deactivated THEN
            action_type := CASE WHEN NEW.is_deactivated THEN 'deactivated' ELSE 'activated' END;
            INSERT INTO public.user_activity_log (user_id, action, performed_by, details)
            VALUES (NEW.id, action_type, current_admin,
                    jsonb_build_object(
                        'previous_status', CASE WHEN OLD.is_deactivated THEN 'inactive' ELSE 'active' END,
                        'new_status', CASE WHEN NEW.is_deactivated THEN 'inactive' ELSE 'active' END
                    ));
        END IF;
        
        IF OLD.role != NEW.role THEN
            action_type := 'role_changed';
            INSERT INTO public.user_activity_log (user_id, action, performed_by, details)
            VALUES (NEW.id, action_type, current_admin,
                    jsonb_build_object(
                        'previous_role', OLD.role,
                        'new_role', NEW.role
                    ));
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user management logging
DROP TRIGGER IF EXISTS user_management_log_trigger ON public.users;
CREATE TRIGGER user_management_log_trigger
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_management_action();

-- ==============================================================================
-- 11. SEED DATA FOR EACH ROLE INTO DEDICATED ROLE TABLES
-- Default password for all seed users: Password123!
-- ==============================================================================

DO $$
DECLARE
  itsd_user_id UUID := 'a0000000-0000-0000-0000-000000000001';
  inventory_user_id UUID := 'b0000000-0000-0000-0000-000000000002';
  end_user_id UUID := 'c0000000-0000-0000-0000-000000000003';
  hashed_password TEXT;
BEGIN
  hashed_password := crypt('Password123!', gen_salt('bf'));

  -- ----------------------------------------------------------------------------
  -- A. ITSD USER -> inserted in auth.users, auth.identities, public.users, and public.itsd_users
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  VALUES (
    itsd_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'itsd.admin@itams.edu', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Alex Rivera", "role": "itsd"}',
    NOW(), NOW(),
    '', '', '', '',
    '', '', '', '',
    FALSE, FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = NOW(),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    email_change_token_current = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    is_sso_user = FALSE,
    is_anonymous = FALSE;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    itsd_user_id, itsd_user_id,
    jsonb_build_object('sub', itsd_user_id::text, 'email', 'itsd.admin@itams.edu'),
    'email', itsd_user_id::text,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (itsd_user_id, 'itsd.admin@itams.edu', 'Alex Rivera (ITSD Admin)', 'itsd'::user_role)
  ON CONFLICT (id) DO UPDATE SET
    role = 'itsd'::user_role,
    full_name = 'Alex Rivera (ITSD Admin)';

  INSERT INTO public.itsd_users (user_id, admin_level, specialization, shift, can_manage_assets)
  VALUES (itsd_user_id, 'Tier 3 Lead Admin', 'IT Systems & Security Vault', 'Day Shift', TRUE)
  ON CONFLICT (user_id) DO UPDATE SET
    admin_level = 'Tier 3 Lead Admin',
    specialization = 'IT Systems & Security Vault';

  -- ----------------------------------------------------------------------------
  -- B. INVENTORY STAFF USER -> auth.users, auth.identities, public.users, public.inventory_staff_users
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  VALUES (
    inventory_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'inventory.staff@itams.edu', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Sarah Chen", "role": "inventory_staff"}',
    NOW(), NOW(),
    '', '', '', '',
    '', '', '', '',
    FALSE, FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = NOW(),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    email_change_token_current = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    is_sso_user = FALSE,
    is_anonymous = FALSE;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    inventory_user_id, inventory_user_id,
    jsonb_build_object('sub', inventory_user_id::text, 'email', 'inventory.staff@itams.edu'),
    'email', inventory_user_id::text,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (inventory_user_id, 'inventory.staff@itams.edu', 'Sarah Chen (Inventory Lead)', 'inventory_staff'::user_role)
  ON CONFLICT (id) DO UPDATE SET
    role = 'inventory_staff'::user_role,
    full_name = 'Sarah Chen (Inventory Lead)';

  INSERT INTO public.inventory_staff_users (user_id, warehouse_location, inventory_tier, badge_number)
  VALUES (inventory_user_id, 'Central IT Warehouse - Bay 4', 'Lead Hardware Custodian', 'INV-0042')
  ON CONFLICT (user_id) DO UPDATE SET
    warehouse_location = 'Central IT Warehouse - Bay 4',
    inventory_tier = 'Lead Hardware Custodian';

  -- ----------------------------------------------------------------------------
  -- C. END USER -> auth.users, auth.identities, public.users, public.end_users
  -- ----------------------------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  VALUES (
    end_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'end.user@itams.edu', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Michael Torres", "role": "end_user"}',
    NOW(), NOW(),
    '', '', '', '',
    '', '', '', '',
    FALSE, FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = NOW(),
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    email_change_token_current = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    is_sso_user = FALSE,
    is_anonymous = FALSE;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    end_user_id, end_user_id,
    jsonb_build_object('sub', end_user_id::text, 'email', 'end.user@itams.edu'),
    'email', end_user_id::text,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = NOW();

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (end_user_id, 'end.user@itams.edu', 'Michael Torres (Staff)', 'end_user'::user_role)
  ON CONFLICT (id) DO UPDATE SET
    role = 'end_user'::user_role,
    full_name = 'Michael Torres (Staff)';

  INSERT INTO public.end_users (user_id, department, employee_id, job_title)
  VALUES (end_user_id, 'Medical Faculty Operations', 'MED-7719', 'Clinical Equipment Officer')
  ON CONFLICT (user_id) DO UPDATE SET
    department = 'Medical Faculty Operations',
    employee_id = 'MED-7719';

END $$;

-- ==============================================================================
-- 12. REPAIR & SANITIZATION FOR SUPABASE GOTRUE COMPLIANCE
-- Ensures all auth.users satisfy non-null token constraints and have auth.identities
-- ==============================================================================
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  is_sso_user = COALESCE(is_sso_user, FALSE),
  is_anonymous = COALESCE(is_anonymous, FALSE),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL
  OR reauthentication_token IS NULL
  OR is_sso_user IS NULL
  OR is_anonymous IS NULL
  OR email_confirmed_at IS NULL;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  id,
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities WHERE provider = 'email')
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ==============================================================================
-- 13. GRANT PERMISSIONS AND ADD COMMENTS
-- ==============================================================================

-- Grant necessary permissions for user management
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.user_activity_log TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.user_activity_log IS 'Tracks all user management actions performed by ITSD administrators';
COMMENT ON COLUMN public.users.is_deactivated IS 'Flag to temporarily disable user accounts without deleting them - prevents login and all access';
COMMENT ON COLUMN public.users.last_login_at IS 'Timestamp of users last successful login';

-- Sample data update to ensure existing users have proper status
UPDATE public.users SET is_deactivated = FALSE WHERE is_deactivated IS NULL;

-- Success message for user management system
SELECT 'ITAMS Database with User Management ready! ITSD Admin can now activate/deactivate users.' as setup_status;

