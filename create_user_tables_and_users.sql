-- ==============================================================================
-- COMPLETE USER SETUP FOR ITAMS SYSTEM
-- This creates the user tables and users needed for the application
-- ==============================================================================

-- 1. Create public.users table for role management
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('itsd', 'inventory_staff', 'end_user')),
    department TEXT,
    employee_id TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create role-specific tables for additional information
CREATE TABLE IF NOT EXISTS public.inventory_staff_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    staff_id TEXT UNIQUE,
    access_level TEXT DEFAULT 'standard' CHECK (access_level IN ('standard', 'supervisor', 'admin')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.end_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    faculty_id TEXT,
    office_location TEXT,
    request_permissions JSONB DEFAULT '{"can_request_assets": true, "can_borrow_equipment": true}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.itsd_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    admin_level TEXT DEFAULT 'standard' CHECK (admin_level IN ('standard', 'super_admin')),
    system_permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.end_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itsd_admins ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Users table policies
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to view users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Inventory staff policies
CREATE POLICY "Allow all operations for authenticated users" ON public.inventory_staff_users
    FOR ALL USING (auth.role() = 'authenticated');

-- End users policies
CREATE POLICY "Allow all operations for authenticated users" ON public.end_users
    FOR ALL USING (auth.role() = 'authenticated');

-- ITSD admins policies
CREATE POLICY "Allow all operations for authenticated users" ON public.itsd_admins
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.inventory_staff_users TO authenticated;
GRANT ALL ON public.end_users TO authenticated;
GRANT ALL ON public.itsd_admins TO authenticated;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_inventory_staff_user_id ON public.inventory_staff_users(user_id);
CREATE INDEX IF NOT EXISTS idx_end_users_user_id ON public.end_users(user_id);
CREATE INDEX IF NOT EXISTS idx_itsd_admins_user_id ON public.itsd_admins(user_id);

-- 7. Create the actual users with passwords
-- INVENTORY STAFF USER
DO $$
DECLARE
  inventory_user_id UUID := 'b0000000-0000-0000-0000-000000000001'::UUID;
  hashed_password TEXT;
BEGIN
  -- Generate hashed password
  SELECT crypt('Password123!', gen_salt('bf')) INTO hashed_password;

  -- Create auth.users entry
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  ) VALUES (
    inventory_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'inventory.staff@itams.edu', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Inventory Staff", "role": "inventory_staff"}',
    NOW(), NOW(), '', '', '', '', '', '', '', '', FALSE, FALSE
  ) ON CONFLICT (id) DO NOTHING;

  -- Create auth.identities entry
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    inventory_user_id, inventory_user_id,
    jsonb_build_object('sub', inventory_user_id::text, 'email', 'inventory.staff@itams.edu'),
    'email', inventory_user_id::text, NOW(), NOW(), NOW()
  ) ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Create public.users entry
  INSERT INTO public.users (id, email, full_name, role, department)
  VALUES (inventory_user_id, 'inventory.staff@itams.edu', 'Inventory Staff User', 'inventory_staff', 'ITSD')
  ON CONFLICT (id) DO NOTHING;

  -- Create inventory_staff_users entry
  INSERT INTO public.inventory_staff_users (user_id, staff_id, access_level)
  VALUES (inventory_user_id, 'STAFF-001', 'admin')
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✅ Created inventory staff user: inventory.staff@itams.edu / Password123!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating inventory staff user: %', SQLERRM;
END $$;

-- ITSD ADMIN USER
DO $$
DECLARE
  itsd_user_id UUID := 'b0000000-0000-0000-0000-000000000002'::UUID;
  hashed_password TEXT;
BEGIN
  -- Generate hashed password
  SELECT crypt('Password123!', gen_salt('bf')) INTO hashed_password;

  -- Create auth.users entry
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  ) VALUES (
    itsd_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'itsd.admin@itams.edu', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "ITSD Admin", "role": "itsd"}',
    NOW(), NOW(), '', '', '', '', '', '', '', '', FALSE, FALSE
  ) ON CONFLICT (id) DO NOTHING;

  -- Create auth.identities entry
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    itsd_user_id, itsd_user_id,
    jsonb_build_object('sub', itsd_user_id::text, 'email', 'itsd.admin@itams.edu'),
    'email', itsd_user_id::text, NOW(), NOW(), NOW()
  ) ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Create public.users entry
  INSERT INTO public.users (id, email, full_name, role, department)
  VALUES (itsd_user_id, 'itsd.admin@itams.edu', 'ITSD Administrator', 'itsd', 'ITSD')
  ON CONFLICT (id) DO NOTHING;

  -- Create itsd_admins entry
  INSERT INTO public.itsd_admins (user_id, admin_level)
  VALUES (itsd_user_id, 'super_admin')
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✅ Created ITSD admin user: itsd.admin@itams.edu / Password123!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating ITSD admin user: %', SQLERRM;
END $$;

-- END USER
DO $$
DECLARE
  end_user_id UUID := 'b0000000-0000-0000-0000-000000000003'::UUID;
  hashed_password TEXT;
BEGIN
  -- Generate hashed password
  SELECT crypt('Password123!', gen_salt('bf')) INTO hashed_password;

  -- Create auth.users entry
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  ) VALUES (
    end_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'faculty.user@itams.edu', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Faculty User", "role": "end_user"}',
    NOW(), NOW(), '', '', '', '', '', '', '', '', FALSE, FALSE
  ) ON CONFLICT (id) DO NOTHING;

  -- Create auth.identities entry
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    end_user_id, end_user_id,
    jsonb_build_object('sub', end_user_id::text, 'email', 'faculty.user@itams.edu'),
    'email', end_user_id::text, NOW(), NOW(), NOW()
  ) ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Create public.users entry
  INSERT INTO public.users (id, email, full_name, role, department)
  VALUES (end_user_id, 'faculty.user@itams.edu', 'Faculty End User', 'end_user', 'CITE')
  ON CONFLICT (id) DO NOTHING;

  -- Create end_users entry
  INSERT INTO public.end_users (user_id, faculty_id, office_location)
  VALUES (end_user_id, 'FAC-001', 'CITE Building Room 301')
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✅ Created end user: faculty.user@itams.edu / Password123!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating end user: %', SQLERRM;
END $$;

-- 8. Verify the setup
SELECT 
    'USER VERIFICATION' as check_type,
    u.email,
    u.full_name,
    u.role,
    u.department
FROM public.users u
ORDER BY u.role, u.email;

-- 9. Final message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 COMPLETE USER SETUP FINISHED!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '- public.users (main user info)';
  RAISE NOTICE '- public.inventory_staff_users (inventory staff details)';
  RAISE NOTICE '- public.end_users (faculty/staff details)';
  RAISE NOTICE '- public.itsd_admins (admin details)';
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials (Password: Password123!):';
  RAISE NOTICE '1. Inventory Staff: inventory.staff@itams.edu';
  RAISE NOTICE '2. ITSD Admin: itsd.admin@itams.edu';
  RAISE NOTICE '3. Faculty User: faculty.user@itams.edu';
  RAISE NOTICE '';
  RAISE NOTICE 'You should now see the public.users table in your Supabase Table Editor!';
END $$;