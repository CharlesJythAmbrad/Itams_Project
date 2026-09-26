-- ==============================================================================
-- Debug Asset Status Values
-- This helps verify what status values exist in your assets table
-- ==============================================================================

-- Show all assets with their current status
SELECT 
    'Asset Status Distribution:' as info,
    status,
    COUNT(*) as count
FROM public.assets
GROUP BY status
ORDER BY count DESC;

-- Show individual assets with details
SELECT 
    'All Assets:' as info,
    id,
    name,
    asset_tag,
    status,
    assigned_to,
    created_at
FROM public.assets
ORDER BY created_at DESC;

-- Show active assignments
SELECT 
    'Active Assignments:' as info,
    aa.id,
    aa.asset_id,
    aa.assignee_name,
    aa.status as assignment_status,
    a.name as asset_name,
    a.status as asset_status
FROM public.asset_assignments aa
JOIN public.assets a ON aa.asset_id = a.id
WHERE aa.status = 'active'
ORDER BY aa.assigned_date DESC;

-- Show active borrowing
SELECT 
    'Active Borrowing:' as info,
    ab.id,
    ab.asset_id,
    ab.borrower_name,
    ab.status as borrowing_status,
    a.name as asset_name,
    a.status as asset_status
FROM public.asset_borrowing ab
JOIN public.assets a ON ab.asset_id = a.id
WHERE ab.status = 'active'
ORDER BY ab.borrowed_date DESC;