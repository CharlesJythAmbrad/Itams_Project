-- ==============================================================================
-- ADD NEW USERS FOR EACH ROLE IN SUPABASE SQL EDITOR
-- Password for all new users: Password123!
-- ==============================================================================

DO $$
DECLARE
  -- Generate unique UUIDs for new users
  new_itsd_user_id UUID := gen_random_uuid();
  new_inventory_user_id UUID := gen_random_uuid();
  new_end_user_id UUID := gen_random_uuid();
  hashed_password TEXT;
BEGIN
  -- Hash the password
  hashed_password := crypt('Password123!', gen_salt('bf'));

  -- ----------------------------------------------------------------------------
  -- 1. NEW ITSD USER
  -- ----------------------------------------------------------------------------
  -- Insert into auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  VALUES (
    new_itsd_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'itsd.support@itams.edu', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Jordan Williams", "role": "itsd"}',
    NOW(), NOW(),
    '', '', '', '',
    '', '', '', '',
    FALSE, FALSE
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    new_itsd_user_id, new_itsd_user_id,
    jsonb_build_object('sub', new_itsd_user_id::text, 'email', 'itsd.support@itams.edu'),
    'email', new_itsd_user_id::text,
    NOW(), NOW(), NOW()
  );

  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new_itsd_user_id, 'itsd.support@itams.edu', 'Jordan Williams (ITSD Support)', 'itsd'::user_role);

  -- Insert into public.itsd_users
  INSERT INTO public.itsd_users (user_id, admin_level, specialization, shift, can_manage_assets)
  VALUES (new_itsd_user_id, 'Tier 2 Support Specialist', 'Network Infrastructure & Security', 'Night Shift', TRUE);

  -- ----------------------------------------------------------------------------
  -- 2. NEW INVENTORY STAFF USER
  -- ----------------------------------------------------------------------------
  -- Insert into auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  VALUES (
    new_inventory_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'inventory.manager@itams.edu', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Emma Rodriguez", "role": "inventory_staff"}',
    NOW(), NOW(),
    '', '', '', '',
    '', '', '', '',
    FALSE, FALSE
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    new_inventory_user_id, new_inventory_user_id,
    jsonb_build_object('sub', new_inventory_user_id::text, 'email', 'inventory.manager@itams.edu'),
    'email', new_inventory_user_id::text,
    NOW(), NOW(), NOW()
  );

  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new_inventory_user_id, 'inventory.manager@itams.edu', 'Emma Rodriguez (Inventory Manager)', 'inventory_staff'::user_role);

  -- Insert into public.inventory_staff_users
  INSERT INTO public.inventory_staff_users (user_id, warehouse_location, inventory_tier, badge_number)
  VALUES (new_inventory_user_id, 'South Campus Warehouse - Section C', 'Asset Management Specialist', 'INV-0075');

  -- ----------------------------------------------------------------------------
  -- 3. NEW END USER
  -- ----------------------------------------------------------------------------
  -- Insert into auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  )
  VALUES (
    new_end_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'faculty.member@itams.edu', hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "David Kim", "role": "end_user"}',
    NOW(), NOW(),
    '', '', '', '',
    '', '', '', '',
    FALSE, FALSE
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    new_end_user_id, new_end_user_id,
    jsonb_build_object('sub', new_end_user_id::text, 'email', 'faculty.member@itams.edu'),
    'email', new_end_user_id::text,
    NOW(), NOW(), NOW()
  );

  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new_end_user_id, 'faculty.member@itams.edu', 'David Kim (Faculty)', 'end_user'::user_role);

  -- Insert into public.end_users
  INSERT INTO public.end_users (user_id, department, employee_id, job_title)
  VALUES (new_end_user_id, 'Computer Science Department', 'CS-4401', 'Associate Professor');

  -- Output the results
  RAISE NOTICE 'Successfully created 3 new users:';
  RAISE NOTICE '1. ITSD User: Jordan Williams (itsd.support@itams.edu)';
  RAISE NOTICE '2. Inventory Staff: Emma Rodriguez (inventory.manager@itams.edu)';
  RAISE NOTICE '3. End User: David Kim (faculty.member@itams.edu)';
  RAISE NOTICE 'All users have password: Password123!';

END $$;