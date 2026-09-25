-- ==============================================================================
-- Fix Function Type Mismatch
-- This fixes the "structure of query does not match function result type" error
-- ==============================================================================

-- Drop and recreate the function with proper type casting
DROP FUNCTION IF EXISTS public.admin_get_all_users();

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    is_deactivated BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
AS $$
BEGIN
    -- This function runs with elevated privileges to bypass RLS
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.role::TEXT,  -- Cast enum to text to fix type mismatch
        COALESCE(u.is_deactivated, false) as is_deactivated,
        u.created_at,
        COALESCE(u.updated_at, u.created_at) as updated_at
    FROM public.users u
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;

SELECT 'SUCCESS: Function type mismatch fixed!' as status;