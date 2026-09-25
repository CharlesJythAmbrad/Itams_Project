-- ==============================================================================
-- Create Users Directly (Bypass Email Limits)
-- This creates users directly in the database without sending emails
-- ==============================================================================

-- Insert users directly into auth.users and public.users tables
-- This bypasses email sending and rate limits

BEGIN;

-- Create ITSD Admin User
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@itams.edu',
    crypt('admin123', gen_salt('bf')), -- Password: admin123
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "ITSD Administrator", "role": "itsd"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Get the user ID we just created
WITH new_admin AS (
    SELECT id FROM auth.users WHERE email = 'admin@itams.edu' LIMIT 1
)
-- Insert into public.users
INSERT INTO public.users (id, email, full_name, role, is_deactivated, created_at, updated_at)
SELECT 
    new_admin.id,
    'admin@itams.edu',
    'ITSD Administrator',
    'itsd',
    false,
    NOW(),
    NOW()
FROM new_admin;

-- Insert into itsd_users
WITH new_admin AS (
    SELECT id FROM auth.users WHERE email = 'admin@itams.edu' LIMIT 1
)
INSERT INTO public.itsd_users (user_id, admin_level, specialization, shift, can_manage_assets)
SELECT 
    new_admin.id,
    'System Administrator',
    'Database & Security Management', 
    'Day Shift',
    true
FROM new_admin;

-- Create Inventory Staff User
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'inventory@itams.edu',
    crypt('inventory123', gen_salt('bf')), -- Password: inventory123
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Inventory Staff", "role": "inventory_staff"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Insert inventory staff into public tables
WITH new_inv AS (
    SELECT id FROM auth.users WHERE email = 'inventory@itams.edu' LIMIT 1
)
INSERT INTO public.users (id, email, full_name, role, is_deactivated, created_at, updated_at)
SELECT 
    new_inv.id,
    'inventory@itams.edu',
    'Inventory Staff',
    'inventory_staff',
    false,
    NOW(),
    NOW()
FROM new_inv;

WITH new_inv AS (
    SELECT id FROM auth.users WHERE email = 'inventory@itams.edu' LIMIT 1
)
INSERT INTO public.inventory_staff_users (user_id, warehouse_location, inventory_tier, badge_number)
SELECT 
    new_inv.id,
    'Central IT Warehouse - Bay 4',
    'Asset Custodian',
    'INV-2024'
FROM new_inv;

-- Create End User
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'user@itams.edu',
    crypt('user123', gen_salt('bf')), -- Password: user123
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "End User", "role": "end_user"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Insert end user into public tables
WITH new_user AS (
    SELECT id FROM auth.users WHERE email = 'user@itams.edu' LIMIT 1
)
INSERT INTO public.users (id, email, full_name, role, is_deactivated, created_at, updated_at)
SELECT 
    new_user.id,
    'user@itams.edu',
    'End User',
    'end_user',
    false,
    NOW(),
    NOW()
FROM new_user;

WITH new_user AS (
    SELECT id FROM auth.users WHERE email = 'user@itams.edu' LIMIT 1
)
INSERT INTO public.end_users (user_id, department, employee_id, job_title)
SELECT 
    new_user.id,
    'Medical Faculty & Operations',
    'EMP-2024',
    'Clinical Staff'
FROM new_user;

COMMIT;

-- Show created users
SELECT 'SUCCESS: Users created directly in database!' as status;

SELECT 
    'Created users:' as info,
    email,
    (raw_user_meta_data->>'full_name') as full_name,
    (raw_user_meta_data->>'role') as role
FROM auth.users 
WHERE email IN ('admin@itams.edu', 'inventory@itams.edu', 'user@itams.edu')
ORDER BY email;