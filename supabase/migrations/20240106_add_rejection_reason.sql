-- ============================================================
-- Add rejection reason column to asset_requests table
-- This allows capturing rejection reasons when denying borrow requests
-- ============================================================

-- Add rejection_reason column to asset_requests table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'asset_requests' 
                  AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.asset_requests 
        ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.asset_requests.rejection_reason IS 'Reason provided when rejecting a borrow request';

-- Create index for better performance on queries filtering by rejection reason
CREATE INDEX IF NOT EXISTS asset_requests_rejection_reason_idx 
ON public.asset_requests (rejection_reason) 
WHERE rejection_reason IS NOT NULL;