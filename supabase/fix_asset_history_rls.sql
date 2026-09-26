-- ==============================================================================
-- Fix Asset History RLS Policies
-- This fixes RLS policies preventing asset borrowing/assignment operations
-- ==============================================================================

BEGIN;

-- Step 1: Temporarily disable RLS on asset-related tables to make changes
ALTER TABLE IF EXISTS public.asset_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.asset_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.asset_borrowing DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assets DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing problematic policies
DROP POLICY IF EXISTS "asset_history_insert" ON public.asset_history;
DROP POLICY IF EXISTS "asset_history_select" ON public.asset_history;
DROP POLICY IF EXISTS "asset_history_update" ON public.asset_history;
DROP POLICY IF EXISTS "asset_assignments_insert" ON public.asset_assignments;
DROP POLICY IF EXISTS "asset_assignments_select" ON public.asset_assignments;
DROP POLICY IF EXISTS "asset_assignments_update" ON public.asset_assignments;
DROP POLICY IF EXISTS "asset_borrowing_insert" ON public.asset_borrowing;
DROP POLICY IF EXISTS "asset_borrowing_select" ON public.asset_borrowing;
DROP POLICY IF EXISTS "asset_borrowing_update" ON public.asset_borrowing;
DROP POLICY IF EXISTS "assets_insert" ON public.assets;
DROP POLICY IF EXISTS "assets_select" ON public.assets;
DROP POLICY IF EXISTS "assets_update" ON public.assets;

-- Step 3: Create simple, working RLS policies for asset tables

-- ASSETS table policies
CREATE POLICY "assets_all_access"
    ON public.assets
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ASSET_HISTORY table policies (for audit logging)
CREATE POLICY "asset_history_insert_policy"
    ON public.asset_history
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "asset_history_select_policy"
    ON public.asset_history
    FOR SELECT
    TO authenticated
    USING (true);

-- ASSET_ASSIGNMENTS table policies
CREATE POLICY "asset_assignments_all_access"
    ON public.asset_assignments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ASSET_BORROWING table policies
CREATE POLICY "asset_borrowing_all_access"
    ON public.asset_borrowing
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 4: Re-enable RLS on all tables
ALTER TABLE IF EXISTS public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.asset_borrowing ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant necessary permissions
GRANT ALL ON public.assets TO authenticated;
GRANT ALL ON public.asset_history TO authenticated;
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT ALL ON public.asset_borrowing TO authenticated;

-- Step 6: Ensure any triggers can insert into asset_history
-- Check if asset_history table exists and create it if missing
CREATE TABLE IF NOT EXISTS public.asset_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Grant permissions on asset_history sequences if they exist
DO $$ 
BEGIN
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if sequences don't exist
END $$;

-- Step 7: Create or update asset status change trigger
CREATE OR REPLACE FUNCTION public.log_asset_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the status change to asset_history
    INSERT INTO public.asset_history (
        asset_id,
        action,
        old_values,
        new_values,
        changed_by,
        notes
    ) VALUES (
        NEW.id,
        'status_change',
        jsonb_build_object('status', OLD.status, 'assigned_to', OLD.assigned_to),
        jsonb_build_object('status', NEW.status, 'assigned_to', NEW.assigned_to),
        NEW.updated_by,
        CASE 
            WHEN NEW.status = 'assigned' THEN 'Asset assigned to user'
            WHEN NEW.status = 'borrowed' THEN 'Asset borrowed by user'
            WHEN NEW.status = 'allocated' THEN 'Asset allocated for borrowing'
            WHEN NEW.status = 'deployed' THEN 'Asset deployed to user'
            WHEN NEW.status = 'in_stock' THEN 'Asset returned to stock'
            WHEN NEW.status = 'maintenance' THEN 'Asset sent for maintenance'
            ELSE 'Asset status updated'
        END
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Don't fail the asset update if history logging fails
    RAISE WARNING 'Failed to log asset history: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS asset_status_change_trigger ON public.assets;

-- Create trigger for asset status changes
CREATE TRIGGER asset_status_change_trigger
    AFTER UPDATE ON public.assets
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.log_asset_status_change();

COMMIT;

-- Final verification
SELECT 'SUCCESS: Asset history RLS policies fixed! Asset borrowing/assignment should work now.' as status;

-- Show current policies
SELECT 
    'Asset table policies:' as info,
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN ('assets', 'asset_history', 'asset_assignments', 'asset_borrowing') 
AND schemaname = 'public'
ORDER BY tablename, policyname;