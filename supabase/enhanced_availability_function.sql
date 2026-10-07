-- Enhanced availability function that handles various category formats
-- This version is more robust and handles different data types

CREATE OR REPLACE FUNCTION public.simple_check_asset_availability(p_asset_type TEXT)
RETURNS JSONB AS $$
DECLARE
    in_stock_count INTEGER := 0;
    allocated_count INTEGER := 0;
    deployed_count INTEGER := 0;
    maintenance_count INTEGER := 0;
    retired_disposed_count INTEGER := 0;
    total_assets INTEGER := 0;
    category_found BOOLEAN := FALSE;
BEGIN
    -- First, check what categories exist in the database
    -- and try multiple matching strategies
    
    -- Strategy 1: Direct text comparison (if category is TEXT)
    BEGIN
        SELECT 
            COALESCE(SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END), 0) as in_stock,
            COALESCE(SUM(CASE WHEN status = 'allocated' THEN 1 ELSE 0 END), 0) as allocated,
            COALESCE(SUM(CASE WHEN status = 'deployed' THEN 1 ELSE 0 END), 0) as deployed,
            COALESCE(SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END), 0) as maintenance,
            COALESCE(SUM(CASE WHEN status IN ('retired', 'disposed') THEN 1 ELSE 0 END), 0) as retired_disposed,
            COUNT(*) as total
        INTO in_stock_count, allocated_count, deployed_count, maintenance_count, retired_disposed_count, total_assets
        FROM public.assets
        WHERE category::TEXT = p_asset_type;
        
        category_found := TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            -- Strategy 2: Try without casting (if category is already TEXT)
            BEGIN
                SELECT 
                    COALESCE(SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END), 0) as in_stock,
                    COALESCE(SUM(CASE WHEN status = 'allocated' THEN 1 ELSE 0 END), 0) as allocated,
                    COALESCE(SUM(CASE WHEN status = 'deployed' THEN 1 ELSE 0 END), 0) as deployed,
                    COALESCE(SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END), 0) as maintenance,
                    COALESCE(SUM(CASE WHEN status IN ('retired', 'disposed') THEN 1 ELSE 0 END), 0) as retired_disposed,
                    COUNT(*) as total
                INTO in_stock_count, allocated_count, deployed_count, maintenance_count, retired_disposed_count, total_assets
                FROM public.assets
                WHERE category = p_asset_type;
                
                category_found := TRUE;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Strategy 3: Try case-insensitive matching
                    BEGIN
                        SELECT 
                            COALESCE(SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END), 0) as in_stock,
                            COALESCE(SUM(CASE WHEN status = 'allocated' THEN 1 ELSE 0 END), 0) as allocated,
                            COALESCE(SUM(CASE WHEN status = 'deployed' THEN 1 ELSE 0 END), 0) as deployed,
                            COALESCE(SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END), 0) as maintenance,
                            COALESCE(SUM(CASE WHEN status IN ('retired', 'disposed') THEN 1 ELSE 0 END), 0) as retired_disposed,
                            COUNT(*) as total
                        INTO in_stock_count, allocated_count, deployed_count, maintenance_count, retired_disposed_count, total_assets
                        FROM public.assets
                        WHERE LOWER(category::TEXT) = LOWER(p_asset_type);
                        
                        category_found := TRUE;
                    EXCEPTION
                        WHEN OTHERS THEN
                            category_found := FALSE;
                    END;
            END;
    END;
    
    -- Return results
    IF NOT category_found THEN
        RETURN jsonb_build_object(
            'error', 'Unable to query assets table or category not found',
            'total_assets', 0,
            'in_stock_count', 0,
            'allocated_count', 0,
            'deployed_count', 0,
            'maintenance_count', 0,
            'retired_disposed_count', 0,
            'available_for_borrowing', FALSE
        );
    END IF;
    
    RETURN jsonb_build_object(
        'total_assets', total_assets,
        'in_stock_count', in_stock_count,
        'allocated_count', allocated_count,
        'deployed_count', deployed_count,
        'maintenance_count', maintenance_count,
        'retired_disposed_count', retired_disposed_count,
        'available_for_borrowing', in_stock_count > 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.simple_check_asset_availability(TEXT) TO authenticated;

-- Test with common categories
SELECT 'Testing availability function...' as status;
SELECT public.simple_check_asset_availability('laptop') as laptop_test;
SELECT public.simple_check_asset_availability('computer') as computer_test;