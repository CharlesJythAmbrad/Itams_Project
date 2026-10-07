-- ============================================================
-- Simple Asset Availability Columns Addition
-- Just adds the essential columns first
-- ============================================================

-- Add availability columns to asset_requests table (only if they don't exist)
DO $$ 
BEGIN
    -- Add availability_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'asset_requests' 
                  AND column_name = 'availability_status') THEN
        ALTER TABLE public.asset_requests 
        ADD COLUMN availability_status TEXT DEFAULT 'pending_check';
    END IF;

    -- Add availability_details column  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'asset_requests' 
                  AND column_name = 'availability_details') THEN
        ALTER TABLE public.asset_requests 
        ADD COLUMN availability_details JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add available_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'asset_requests' 
                  AND column_name = 'available_count') THEN
        ALTER TABLE public.asset_requests 
        ADD COLUMN available_count INTEGER DEFAULT 0;
    END IF;

    -- Add last_availability_check column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'asset_requests' 
                  AND column_name = 'last_availability_check') THEN
        ALTER TABLE public.asset_requests 
        ADD COLUMN last_availability_check TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add constraint for availability_status (drop first if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'asset_requests_availability_status_check') THEN
        ALTER TABLE public.asset_requests DROP CONSTRAINT asset_requests_availability_status_check;
    END IF;
END $$;

ALTER TABLE public.asset_requests
ADD CONSTRAINT asset_requests_availability_status_check
CHECK (availability_status IN (
    'pending_check',
    'available', 
    'partially_available',
    'unavailable',
    'mixed'
));

-- Create indexes
CREATE INDEX IF NOT EXISTS asset_requests_availability_status_idx ON public.asset_requests (availability_status);
CREATE INDEX IF NOT EXISTS asset_requests_available_count_idx ON public.asset_requests (available_count);
CREATE INDEX IF NOT EXISTS asset_requests_last_check_idx ON public.asset_requests (last_availability_check);

-- Add comments
COMMENT ON COLUMN public.asset_requests.availability_status IS 'Current availability status of requested assets';
COMMENT ON COLUMN public.asset_requests.availability_details IS 'Detailed availability information including counts and conditions';
COMMENT ON COLUMN public.asset_requests.available_count IS 'Number of available assets matching the request';
COMMENT ON COLUMN public.asset_requests.last_availability_check IS 'Timestamp of last availability check';

-- Simple function to check asset availability by asset type
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

-- Simple function to check asset availability by request ID
CREATE OR REPLACE FUNCTION public.simple_check_asset_availability(request_id UUID)
RETURNS JSONB AS $$
DECLARE
    request_record RECORD;
    available_assets INTEGER;
    total_requested INTEGER;
    status TEXT;
BEGIN
    -- Get the borrow request details
    SELECT * INTO request_record
    FROM public.asset_requests
    WHERE id = request_id AND request_type = 'borrow_request';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Request not found');
    END IF;
    
    -- Get requested quantity
    total_requested := COALESCE(request_record.quantity, 0);
    
    IF total_requested = 0 THEN
        RETURN jsonb_build_object('error', 'Invalid quantity');
    END IF;
    
    -- Count available assets of the requested type with proper type casting
    SELECT COUNT(*) INTO available_assets
    FROM public.assets
    WHERE category::TEXT = request_record.asset_type
    AND status = 'in_stock'
    AND condition IN ('excellent', 'good');
    
    -- Determine availability status
    IF available_assets >= total_requested THEN
        status := 'available';
    ELSIF available_assets > 0 THEN
        status := 'partially_available';
    ELSE
        status := 'unavailable';
    END IF;
    
    -- Update the request record
    UPDATE public.asset_requests
    SET 
        availability_status = status,
        available_count = available_assets,
        last_availability_check = NOW()
    WHERE id = request_id;
    
    RETURN jsonb_build_object(
        'status', status,
        'available_count', available_assets,
        'requested_count', total_requested
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.simple_check_asset_availability(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.simple_check_asset_availability(UUID) TO authenticated;