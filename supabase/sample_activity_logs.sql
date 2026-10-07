-- Sample Activity Logs for Testing
-- Run this after creating the activity_logs table to populate sample data

-- Sample Admin Activities
INSERT INTO public.activity_logs (
    user_id,
    user_name,
    user_role,
    action,
    resource_type,
    resource_id,
    resource_name,
    description,
    metadata,
    success
) VALUES 
-- Admin login activities
(
    (SELECT id FROM public.users WHERE role = 'itsd' LIMIT 1),
    'System Administrator',
    'itsd',
    'login',
    'system',
    NULL,
    'ITAMS System',
    'Admin user logged into the system',
    '{"login_method": "password", "browser": "Chrome", "ip": "192.168.1.100"}'::jsonb,
    true
),
-- User management activities
(
    (SELECT id FROM public.users WHERE role = 'itsd' LIMIT 1),
    'System Administrator',
    'itsd',
    'create',
    'user',
    'user_001',
    'John Doe (john.doe@itams.edu)',
    'Created new inventory staff user account',
    '{"email": "john.doe@itams.edu", "role": "inventory_staff", "department": "IT Department"}'::jsonb,
    true
),
(
    (SELECT id FROM public.users WHERE role = 'itsd' LIMIT 1),
    'System Administrator',
    'itsd',
    'update',
    'user',
    'user_001',
    'John Doe (john.doe@itams.edu)',
    'Updated user account permissions',
    '{"changes": {"role": "inventory_staff"}, "previous_role": "end_user"}'::jsonb,
    true
),
-- System monitoring activities
(
    (SELECT id FROM public.users WHERE role = 'itsd' LIMIT 1),
    'System Administrator',
    'itsd',
    'view',
    'system',
    NULL,
    'System Logs',
    'Accessed system activity logs for security review',
    '{"log_count": 150, "date_range": "last_7_days"}'::jsonb,
    true
);

-- Sample Inventory Staff Activities
INSERT INTO public.activity_logs (
    user_id,
    user_name,
    user_role,
    action,
    resource_type,
    resource_id,
    resource_name,
    description,
    metadata,
    success
) VALUES 
-- Asset management activities
(
    (SELECT id FROM public.users WHERE role = 'inventory_staff' LIMIT 1),
    'Inventory Staff',
    'inventory_staff',
    'create',
    'asset',
    'asset_001',
    'Dell Laptop Inspiron 15 (ITAMS-LAP-001)',
    'Added new laptop asset to inventory',
    '{"category": "laptop", "brand": "Dell", "model": "Inspiron 15", "cost": 35000, "location": "IT Store"}'::jsonb,
    true
),
(
    (SELECT id FROM public.users WHERE role = 'inventory_staff' LIMIT 1),
    'Inventory Staff',
    'inventory_staff',
    'create',
    'asset',
    'asset_002',
    'HP Desktop ProDesk (ITAMS-PC-001)',
    'Added new desktop computer to inventory',
    '{"category": "computer", "brand": "HP", "model": "ProDesk 600", "cost": 28000, "location": "IT Store"}'::jsonb,
    true
),
(
    (SELECT id FROM public.users WHERE role = 'inventory_staff' LIMIT 1),
    'Inventory Staff',
    'inventory_staff',
    'assign',
    'assignment',
    'assign_001',
    'Dell Laptop Inspiron 15 → Jane Smith',
    'Assigned laptop to employee Jane Smith from HR Department',
    '{"asset_tag": "ITAMS-LAP-001", "assignee": "Jane Smith", "department": "HR", "purpose": "Daily work tasks"}'::jsonb,
    true
),
(
    (SELECT id FROM public.users WHERE role = 'inventory_staff' LIMIT 1),
    'Inventory Staff',
    'inventory_staff',
    'update',
    'asset',
    'asset_001',
    'Dell Laptop Inspiron 15 (ITAMS-LAP-001)',
    'Updated asset location and status',
    '{"changes": {"location": "HR Department", "status": "deployed"}, "previous_location": "IT Store"}'::jsonb,
    true
),
-- Repair management activities
(
    (SELECT id FROM public.users WHERE role = 'inventory_staff' LIMIT 1),
    'Inventory Staff',
    'inventory_staff',
    'create',
    'repair',
    'repair_001',
    'TKT-2024-001 - HP Printer LaserJet',
    'Created repair ticket for malfunctioning printer',
    '{"asset_tag": "ITAMS-PRT-003", "issue": "Paper jam and print quality issues", "priority": "medium", "technician": "Tech Support Team"}'::jsonb,
    true
),
(
    (SELECT id FROM public.users WHERE role = 'inventory_staff' LIMIT 1),
    'Inventory Staff',
    'inventory_staff',
    'complete',
    'repair',
    'repair_001',
    'TKT-2024-001 - HP Printer LaserJet',
    'Completed repair ticket - printer fully functional',
    '{"resolution": "Cleaned print heads and replaced toner cartridge", "cost": 2500, "completion_time": "2 hours"}'::jsonb,
    true
),
-- Error example
(
    (SELECT id FROM public.users WHERE role = 'inventory_staff' LIMIT 1),
    'Inventory Staff',
    'inventory_staff',
    'delete',
    'asset',
    'asset_999',
    'Non-existent Asset',
    'Attempted to delete asset but operation failed',
    '{"error_code": "ASSET_NOT_FOUND"}'::jsonb,
    false
);

-- Sample End User Activities
INSERT INTO public.activity_logs (
    user_id,
    user_name,
    user_role,
    action,
    resource_type,
    resource_id,
    resource_name,
    description,
    metadata,
    success
) VALUES 
-- User login/logout activities
(
    (SELECT id FROM public.users WHERE role = 'end_user' LIMIT 1),
    'End User',
    'end_user',
    'login',
    'system',
    NULL,
    'ITAMS Portal',
    'User logged into the system',
    '{"login_method": "password", "browser": "Firefox"}'::jsonb,
    true
),
(
    (SELECT id FROM public.users WHERE role = 'end_user' LIMIT 1),
    'End User',
    'end_user',
    'create',
    'request',
    'req_001',
    'Service Request - Software Installation',
    'Submitted new service request for software installation',
    '{"software": "Adobe Photoshop", "justification": "Graphic design work", "priority": "normal"}'::jsonb,
    true
),
(
    (SELECT id FROM public.users WHERE role = 'end_user' LIMIT 1),
    'End User',
    'end_user',
    'logout',
    'system',
    NULL,
    'ITAMS Portal',
    'User logged out of the system',
    '{"session_duration": "45 minutes"}'::jsonb,
    true
);

-- Create some time-distributed sample logs (for testing date filters)
-- Recent activities (today)
INSERT INTO public.activity_logs (
    user_id,
    user_name,
    user_role,
    action,
    resource_type,
    resource_id,
    resource_name,
    description,
    metadata,
    success,
    created_at
) VALUES 
(
    (SELECT id FROM public.users WHERE role = 'itsd' LIMIT 1),
    'System Administrator',
    'itsd',
    'login',
    'system',
    NULL,
    'ITAMS System',
    'Admin morning login',
    '{"time": "09:00"}'::jsonb,
    true,
    NOW()
),
-- Yesterday
(
    (SELECT id FROM public.users WHERE role = 'inventory_staff' LIMIT 1),
    'Inventory Staff',
    'inventory_staff',
    'create',
    'asset',
    'asset_yesterday',
    'Canon Printer PIXMA (ITAMS-PRT-010)',
    'Added printer asset yesterday',
    '{"category": "printer", "brand": "Canon"}'::jsonb,
    true,
    NOW() - INTERVAL '1 day'
),
-- Last week
(
    (SELECT id FROM public.users WHERE role = 'inventory_staff' LIMIT 1),
    'Inventory Staff',
    'inventory_staff',
    'assign',
    'assignment',
    'assign_lastweek',
    'Monitor Samsung 24" → Mike Johnson',
    'Monitor assignment from last week',
    '{"asset_tag": "ITAMS-MON-005"}'::jsonb,
    true,
    NOW() - INTERVAL '5 days'
),
-- Last month
(
    (SELECT id FROM public.users WHERE role = 'itsd' LIMIT 1),
    'System Administrator',
    'itsd',
    'update',
    'user',
    'user_lastmonth',
    'Employee Account Update',
    'Monthly user permissions review',
    '{"review_type": "monthly_audit"}'::jsonb,
    true,
    NOW() - INTERVAL '20 days'
);

-- Add a comment explaining the sample data
COMMENT ON TABLE public.activity_logs IS 'Activity logs with sample data for testing - includes admin, staff, and user activities across different time periods';