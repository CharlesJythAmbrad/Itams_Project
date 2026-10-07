-- Quick fix for asset availability function type casting issue
-- This script fixes the enum casting problem

-- Drop existing function first to ensure clean replacement
DROP FUNCTION IF EXISTS public.simple_check_asset_availability(TEXT);

-- Create fixed version with proper type casting
CREATE OR REPLACE FUNCTION public.simple_check_asset_availability(p_asset_type TEXT)
RETURNS JSONB AS $$
DECLARE
    in_stock_count INTEGER := 0;
    allocated_count INTEGER := 0;
    deployed_count INTEGER := 0;
    maintenance_count INTEGER := 0;
    retired_disposed_count INTEGER := 0;
    total_assets INTEGER := 0;
BEGIN
    -- Get counts by status with proper type casting
    -- Cast category to TEXT to compare with TEXT parameter
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

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.simple_check_asset_availability(TEXT) TO authenticated;

-- Test query to verify function works
SELECT public.simple_check_asset_availability('laptop') as test_result;

-- Show success message
SELECT 'Asset availability function updated successfully!' as status;