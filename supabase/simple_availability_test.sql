-- Simple test and fix for availability function
-- This will work with most asset table structures

-- Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS public.simple_check_asset_availability(TEXT);

CREATE OR REPLACE FUNCTION public.simple_check_asset_availability(p_asset_type TEXT)
RETURNS JSONB AS $$
DECLARE
    result_data JSONB;
BEGIN
    -- Try different approaches to handle various column types
    BEGIN
        -- Method 1: Try with text cast (most common case)
        SELECT jsonb_build_object(
            'total_assets', COUNT(*),
            'in_stock_count', COALESCE(SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END), 0),
            'allocated_count', COALESCE(SUM(CASE WHEN status = 'allocated' THEN 1 ELSE 0 END), 0),
            'deployed_count', COALESCE(SUM(CASE WHEN status = 'deployed' THEN 1 ELSE 0 END), 0),
            'maintenance_count', COALESCE(SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END), 0),
            'retired_disposed_count', COALESCE(SUM(CASE WHEN status IN ('retired', 'disposed') THEN 1 ELSE 0 END), 0),
            'available_for_borrowing', COALESCE(SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END), 0) > 0
        )
        INTO result_data
        FROM public.assets
        WHERE category::TEXT = p_asset_type;
        
        RETURN result_data;
        
    EXCEPTION WHEN OTHERS THEN
        -- Method 2: Try without text casting
        BEGIN
            SELECT jsonb_build_object(
                'total_assets', COUNT(*),
                'in_stock_count', COALESCE(SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END), 0),
                'allocated_count', COALESCE(SUM(CASE WHEN status = 'allocated' THEN 1 ELSE 0 END), 0),
                'deployed_count', COALESCE(SUM(CASE WHEN status = 'deployed' THEN 1 ELSE 0 END), 0),
                'maintenance_count', COALESCE(SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END), 0),
                'retired_disposed_count', COALESCE(SUM(CASE WHEN status IN ('retired', 'disposed') THEN 1 ELSE 0 END), 0),
                'available_for_borrowing', COALESCE(SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END), 0) > 0
            )
            INTO result_data
            FROM public.assets
            WHERE category = p_asset_type;
            
            RETURN result_data;
            
        EXCEPTION WHEN OTHERS THEN
            -- Method 3: Return error information
            RETURN jsonb_build_object(
                'error', 'Unable to check availability',
                'total_assets', 0,
                'in_stock_count', 0,
                'allocated_count', 0,
                'deployed_count', 0,
                'maintenance_count', 0,
                'retired_disposed_count', 0,
                'available_for_borrowing', false
            );
        END;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.simple_check_asset_availability(TEXT) TO authenticated;

-- Test the function
SELECT 'Testing availability function...' as status;

-- Test with common asset types
SELECT 'laptop', public.simple_check_asset_availability('laptop') as result
UNION ALL
SELECT 'computer', public.simple_check_asset_availability('computer')
UNION ALL  
SELECT 'monitor', public.simple_check_asset_availability('monitor');

SELECT 'Availability function setup completed!' as final_status;