-- ==============================================================================
-- RESET ALL ASSETS TO IN_STOCK STATUS
-- This will make all assets available for assignment/borrowing
-- ==============================================================================

-- Update all assets to in_stock status
UPDATE public.assets 
SET status = 'in_stock'
WHERE status != 'in_stock';

-- Show the results
SELECT 
    status,
    COUNT(*) as asset_count
FROM public.assets
GROUP BY status
ORDER BY status;

-- Success message
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Asset status reset completed!';
    RAISE NOTICE 'Updated % assets to "in_stock" status', updated_count;
    RAISE NOTICE 'All assets are now available for assignment/borrowing.';
END $$;