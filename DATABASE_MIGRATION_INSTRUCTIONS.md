# Database Migration Instructions

## New Migration Added: Rejection Reason Support

A new migration has been created to support rejection reasons for borrow requests:
- File: `supabase/migrations/20240106_add_rejection_reason.sql`

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Apply all pending migrations
supabase db push

# Or apply this specific migration
supabase db push --include-all
```

### Option 2: Manual SQL Execution
If you can't use the CLI, run this SQL in your Supabase SQL Editor:

```sql
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS asset_requests_rejection_reason_idx 
ON public.asset_requests (rejection_reason) 
WHERE rejection_reason IS NOT NULL;
```

## What This Migration Does

1. **Adds `rejection_reason` column** to the `asset_requests` table
2. **Adds documentation comment** explaining the column purpose  
3. **Creates a performance index** for queries filtering by rejection reason
4. **Uses safe IF NOT EXISTS checks** to prevent errors if already applied

## New Features Enabled

After applying this migration, the Borrow Request Details will support:
- ✅ **Status Flow Control**: Cannot go back to "pending" from "approved" or "rejected"
- ✅ **Rejection Reason Modal**: Required reason when rejecting requests
- ✅ **Rejection Reason Display**: Shows rejection reason in request details
- ✅ **Activity Logging**: Logs rejection reasons in activity history

## Testing the Features

1. Go to Borrow Request page
2. Click "View" on any request 
3. Try to change status - notice "pending" is disabled for approved/rejected requests
4. Click "Rejected" - a modal will prompt for a rejection reason
5. After rejecting, view the request details to see the rejection reason displayed