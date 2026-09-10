-- ==============================================================================
-- CREATE WORKING USERS FOR ITAMS - COPY AND PASTE INTO SUPABASE SQL EDITOR
-- Password for all users: Password123!
-- ==============================================================================

-- Create Inventory Staff User (for testing assets)
DO $$
DECLARE
  inventory_user_id UUID := gen_random_uuid();
  hashed_password TEXT := crypt('Password123!', gen_salt('bf'));
BEGIN
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
  );

  -- Create auth.identities entry
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    inventory_user_id, inventory_user_id,
    jsonb_build_object('sub', inventory_user_id::text, 'email', 'inventory.staff@itams.edu'),
    'email', inventory_user_id::text, NOW(), NOW(), NOW()
  );

  -- Create public.users entry (if table exists)
  BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (inventory_user_id, 'inventory.staff@itams.edu', 'Inventory Staff User', 'inventory_staff');
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'public.users table does not exist - user created in auth only';
  END;

  RAISE NOTICE '✅ Created inventory staff user: inventory.staff@itams.edu / Password123!';

EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'User inventory.staff@itams.edu already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating user: %', SQLERRM;
END $$;

-- Create ITSD Admin User
DO $$
DECLARE
  itsd_user_id UUID := gen_random_uuid();
  hashed_password TEXT := crypt('Password123!', gen_salt('bf'));
BEGIN
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
  );

  -- Create auth.identities entry
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    itsd_user_id, itsd_user_id,
    jsonb_build_object('sub', itsd_user_id::text, 'email', 'itsd.admin@itams.edu'),
    'email', itsd_user_id::text, NOW(), NOW(), NOW()
  );

  -- Create public.users entry (if table exists)
  BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (itsd_user_id, 'itsd.admin@itams.edu', 'ITSD Administrator', 'itsd');
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'public.users table does not exist - user created in auth only';
  END;

  RAISE NOTICE '✅ Created ITSD admin user: itsd.admin@itams.edu / Password123!';

EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'User itsd.admin@itams.edu already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating user: %', SQLERRM;
END $$;

-- Create End User
DO $$
DECLARE
  end_user_id UUID := gen_random_uuid();
  hashed_password TEXT := crypt('Password123!', gen_salt('bf'));
BEGIN
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
  );

  -- Create auth.identities entry
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    end_user_id, end_user_id,
    jsonb_build_object('sub', end_user_id::text, 'email', 'faculty.user@itams.edu'),
    'email', end_user_id::text, NOW(), NOW(), NOW()
  );

  -- Create public.users entry (if table exists)
  BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (end_user_id, 'faculty.user@itams.edu', 'Faculty End User', 'end_user');
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'public.users table does not exist - user created in auth only';
  END;

  RAISE NOTICE '✅ Created end user: faculty.user@itams.edu / Password123!';

EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'User faculty.user@itams.edu already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating user: %', SQLERRM;
END $$;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 USER CREATION COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials (Password for all: Password123!):';
  RAISE NOTICE '1. Inventory Staff: inventory.staff@itams.edu';
  RAISE NOTICE '2. ITSD Admin: itsd.admin@itams.edu';
  RAISE NOTICE '3. Faculty User: faculty.user@itams.edu';
  RAISE NOTICE '';
  RAISE NOTICE 'Use inventory.staff@itams.edu to test the Assets page!';
END $$;