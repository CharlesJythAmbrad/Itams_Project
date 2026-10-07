-- Create Activity Logs Table
-- This table tracks all admin and staff actions in the system
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL, -- Cache user name for performance
    user_role TEXT NOT NULL, -- 'itsd', 'inventory_staff', etc.
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'assign', 'unassign', 'login', 'logout', etc.
    resource_type TEXT NOT NULL, -- 'asset', 'user', 'repair', 'assignment', 'borrowing', 'system', etc.
    resource_id TEXT, -- ID of the affected resource (can be null for system-wide actions)
    resource_name TEXT, -- Human-readable name of the resource for display
    description TEXT NOT NULL, -- Human-readable description of the action
    metadata JSONB, -- Additional structured data about the action
    ip_address INET, -- IP address of the user
    user_agent TEXT, -- User agent string
    session_id TEXT, -- Session identifier
    success BOOLEAN DEFAULT true, -- Whether the action was successful
    error_message TEXT, -- Error message if action failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_role ON activity_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_success ON activity_logs(success);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action ON activity_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date_user ON activity_logs(created_at DESC, user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: ITSD users can see all logs
CREATE POLICY "ITSD users can view all activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'itsd'
        )
    );

-- RLS Policy: Inventory staff can see their own logs and asset-related logs
CREATE POLICY "Inventory staff can view relevant activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'inventory_staff'
        ) AND (
            user_id = auth.uid() OR 
            resource_type IN ('asset', 'repair', 'assignment', 'borrowing')
        )
    );

-- RLS Policy: End users can only see their own logs
CREATE POLICY "End users can view their own activity logs" ON public.activity_logs
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- RLS Policy: Only authenticated users can insert logs (typically done by system)
CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create a function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
    p_user_id UUID,
    p_user_name TEXT,
    p_user_role TEXT,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_resource_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT '',
    p_metadata JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
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
        ip_address,
        user_agent,
        session_id,
        success,
        error_message
    ) VALUES (
        p_user_id,
        p_user_name,
        p_user_role,
        p_action,
        p_resource_type,
        p_resource_id,
        p_resource_name,
        p_description,
        p_metadata,
        p_ip_address,
        p_user_agent,
        p_session_id,
        p_success,
        p_error_message
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity TO authenticated;

-- Add some sample activity logs for testing
DO $$
DECLARE
    admin_user_id UUID;
    staff_user_id UUID;
BEGIN
    -- Get admin user ID (assuming there's an ITSD user)
    SELECT u.id INTO admin_user_id 
    FROM public.users u 
    WHERE u.role = 'itsd' 
    LIMIT 1;
    
    -- Get inventory staff user ID
    SELECT u.id INTO staff_user_id 
    FROM public.users u 
    WHERE u.role = 'inventory_staff' 
    LIMIT 1;
    
    -- Insert sample logs if users exist
    IF admin_user_id IS NOT NULL THEN
        PERFORM public.log_activity(
            admin_user_id,
            'System Administrator',
            'itsd',
            'login',
            'system',
            NULL,
            'ITAMS System',
            'Admin user logged into the system',
            '{"login_method": "password", "browser": "Chrome"}'::jsonb,
            '192.168.1.100'::inet,
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'sess_' || substr(md5(random()::text), 1, 16)
        );
        
        PERFORM public.log_activity(
            admin_user_id,
            'System Administrator',
            'itsd',
            'create',
            'user',
            'user_' || substr(md5(random()::text), 1, 8),
            'New Inventory Staff',
            'Created new inventory staff user account',
            '{"user_role": "inventory_staff", "department": "IT Department"}'::jsonb
        );
    END IF;
    
    IF staff_user_id IS NOT NULL THEN
        PERFORM public.log_activity(
            staff_user_id,
            'Inventory Staff',
            'inventory_staff',
            'create',
            'asset',
            'asset_' || substr(md5(random()::text), 1, 8),
            'Dell Laptop XPS 13',
            'Added new laptop asset to inventory',
            '{"category": "laptop", "cost": 25000, "location": "IT Store"}'::jsonb
        );
        
        PERFORM public.log_activity(
            staff_user_id,
            'Inventory Staff',
            'inventory_staff',
            'assign',
            'assignment',
            'assign_' || substr(md5(random()::text), 1, 8),
            'Dell Laptop XPS 13 → John Doe',
            'Assigned laptop to employee John Doe',
            '{"assignee": "John Doe", "department": "HR", "purpose": "Work laptop"}'::jsonb
        );
    END IF;
END
$$;

COMMENT ON TABLE public.activity_logs IS 'Tracks all user activities in the system including admin and staff actions';
COMMENT ON FUNCTION public.log_activity IS 'Function to log user activities with comprehensive metadata';