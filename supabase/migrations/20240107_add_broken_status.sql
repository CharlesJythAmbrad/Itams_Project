-- Migration to add 'broken' status to asset status enum
-- This allows assets with broken status to be automatically tracked for disposal

DO $$ 
BEGIN
    -- Check if the enum type exists and add 'broken' if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'asset_status' AND e.enumlabel = 'broken'
    ) THEN
        -- Add 'broken' status to the enum
        -- Position it after 'retired' but before 'to_be_disposed'
        ALTER TYPE asset_status ADD VALUE 'broken' AFTER 'retired';
    END IF;
END $$;

-- Comment explaining the disposal logic:
-- - Assets with status 'broken' will automatically count towards "For Disposal" summary
-- - Assets with status 'retired' will automatically count towards "To Be Disposed" summary
-- - This allows for automatic categorization of assets ready for disposal workflow