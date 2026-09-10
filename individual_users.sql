-- ==============================================================================
-- INDIVIDUAL USER CREATION TEMPLATES
-- Customize the values and run one block at a time
-- ==============================================================================

-- ----------------------------------------------------------------------------
-- TEMPLATE 1: CREATE NEW ITSD USER
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  user_id UUID := gen_random_uuid();
  hashed_password TEXT := crypt('Password123!', gen_salt('bf'));
BEGIN
  -- CUSTOMIZE THESE VALUES:
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  ) VALUES (
    user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'your.itsd.email@itams.edu', -- CHANGE EMAIL
    hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Your ITSD Name", "role": "itsd"}', -- CHANGE NAME
    NOW(), NOW(), '', '', '', '', '', '', '', '', FALSE, FALSE
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    user_id, user_id,
    jsonb_build_object('sub', user_id::text, 'email', 'your.itsd.email@itams.edu'), -- CHANGE EMAIL
    'email', user_id::text, NOW(), NOW(), NOW()
  );

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (user_id, 'your.itsd.email@itams.edu', 'Your ITSD Name (ITSD Admin)', 'itsd'::user_role); -- CHANGE EMAIL AND NAME

  INSERT INTO public.itsd_users (user_id, admin_level, specialization, shift, can_manage_assets)
  VALUES (user_id, 'Tier 1 Support', 'Hardware Maintenance', 'Day Shift', TRUE); -- CUSTOMIZE THESE

  RAISE NOTICE 'Created ITSD user: your.itsd.email@itams.edu';
END $$;

-- ----------------------------------------------------------------------------
-- TEMPLATE 2: CREATE NEW INVENTORY STAFF USER
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  user_id UUID := gen_random_uuid();
  hashed_password TEXT := crypt('Password123!', gen_salt('bf'));
BEGIN
  -- CUSTOMIZE THESE VALUES:
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  ) VALUES (
    user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'your.inventory.email@itams.edu', -- CHANGE EMAIL
    hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Your Inventory Name", "role": "inventory_staff"}', -- CHANGE NAME
    NOW(), NOW(), '', '', '', '', '', '', '', '', FALSE, FALSE
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    user_id, user_id,
    jsonb_build_object('sub', user_id::text, 'email', 'your.inventory.email@itams.edu'), -- CHANGE EMAIL
    'email', user_id::text, NOW(), NOW(), NOW()
  );

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (user_id, 'your.inventory.email@itams.edu', 'Your Inventory Name (Inventory)', 'inventory_staff'::user_role); -- CHANGE EMAIL AND NAME

  INSERT INTO public.inventory_staff_users (user_id, warehouse_location, inventory_tier, badge_number)
  VALUES (user_id, 'North Building - Level 2', 'Stock Controller', 'INV-1001'); -- CUSTOMIZE THESE

  RAISE NOTICE 'Created Inventory Staff user: your.inventory.email@itams.edu';
END $$;

-- ----------------------------------------------------------------------------
-- TEMPLATE 3: CREATE NEW END USER
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  user_id UUID := gen_random_uuid();
  hashed_password TEXT := crypt('Password123!', gen_salt('bf'));
BEGIN
  -- CUSTOMIZE THESE VALUES:
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  ) VALUES (
    user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'your.enduser.email@itams.edu', -- CHANGE EMAIL
    hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Your End User Name", "role": "end_user"}', -- CHANGE NAME
    NOW(), NOW(), '', '', '', '', '', '', '', '', FALSE, FALSE
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    user_id, user_id,
    jsonb_build_object('sub', user_id::text, 'email', 'your.enduser.email@itams.edu'), -- CHANGE EMAIL
    'email', user_id::text, NOW(), NOW(), NOW()
  );

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (user_id, 'your.enduser.email@itams.edu', 'Your End User Name (Staff)', 'end_user'::user_role); -- CHANGE EMAIL AND NAME

  INSERT INTO public.end_users (user_id, department, employee_id, job_title)
  VALUES (user_id, 'Engineering Department', 'ENG-2001', 'Software Engineer'); -- CUSTOMIZE THESE

  RAISE NOTICE 'Created End User: your.enduser.email@itams.edu';
END $$;