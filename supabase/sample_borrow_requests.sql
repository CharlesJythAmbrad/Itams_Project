-- Sample Borrow Requests for Testing Pagination
-- These requests demonstrate various statuses and asset types
-- Run this in your Supabase SQL editor to create test data

INSERT INTO borrow_requests (
  requester_id,
  asset_type_needed,
  quantity_needed,
  purpose,
  expected_return_date,
  priority_level,
  department,
  status,
  created_at,
  updated_at
) VALUES
-- Request 1: Pending laptop request
(
  '11111111-1111-1111-1111-111111111111',
  'laptop',
  1,
  'Software development project for Q4 deliverables',
  '2026-10-15',
  'high',
  'Engineering',
  'pending',
  '2026-09-10 09:00:00',
  '2026-09-10 09:00:00'
),

-- Request 2: Approved monitor request
(
  '22222222-2222-2222-2222-222222222222',
  'monitor',
  2,
  'Dual monitor setup for design work',
  '2026-11-30',
  'medium',
  'Design',
  'approved',
  '2026-09-11 14:30:00',
  '2026-09-12 10:15:00'
),

-- Request 3: Rejected printer request
(
  '33333333-3333-3333-3333-333333333333',
  'printer',
  1,
  'Personal use printing',
  '2026-09-25',
  'low',
  'HR',
  'rejected',
  '2026-09-12 11:20:00',
  '2026-09-13 16:45:00'
),

-- Request 4: Borrowed tablet
(
  '44444444-4444-4444-4444-444444444444',
  'tablet',
  1,
  'Field data collection for customer survey',
  '2026-10-01',
  'high',
  'Marketing',
  'borrowed',
  '2026-09-08 08:15:00',
  '2026-09-09 13:30:00'
),

-- Request 5: Overdue camera equipment
(
  '55555555-5555-5555-5555-555555555555',
  'camera',
  1,
  'Product photography session',
  '2026-09-14',
  'medium',
  'Marketing',
  'overdue',
  '2026-09-05 10:45:00',
  '2026-09-06 09:20:00'
),

-- Request 6: Pending networking equipment
(
  '11111111-1111-1111-1111-111111111111',
  'networking',
  3,
  'Network infrastructure upgrade testing',
  '2026-12-15',
  'high',
  'IT',
  'pending',
  '2026-09-13 15:20:00',
  '2026-09-13 15:20:00'
),

-- Request 7: Approved smartphone
(
  '66666666-6666-6666-6666-666666666666',
  'smartphone',
  1,
  'Mobile app testing on different devices',
  '2026-10-30',
  'medium',
  'QA',
  'approved',
  '2026-09-14 09:30:00',
  '2026-09-14 16:00:00'
),

-- Request 8: Returned projector
(
  '77777777-7777-7777-7777-777777777777',
  'projector',
  1,
  'Client presentation meeting',
  '2026-09-12',
  'high',
  'Sales',
  'returned',
  '2026-09-07 12:00:00',
  '2026-09-12 17:30:00'
),

-- Request 9: Pending server equipment
(
  '88888888-8888-8888-8888-888888888888',
  'server',
  1,
  'Development environment setup',
  '2026-11-01',
  'high',
  'Engineering',
  'pending',
  '2026-09-14 13:45:00',
  '2026-09-14 13:45:00'
),

-- Request 10: Approved mouse and keyboard
(
  '99999999-9999-9999-9999-999999999999',
  'mouse',
  2,
  'Ergonomic workstation setup for new employees',
  '2026-10-20',
  'low',
  'HR',
  'approved',
  '2026-09-13 11:00:00',
  '2026-09-14 08:30:00'
);

-- Add some comments to requests for better testing
UPDATE borrow_requests 
SET admin_notes = 'Request approved - high priority project requirement'
WHERE asset_type_needed = 'monitor' AND status = 'approved';

UPDATE borrow_requests 
SET admin_notes = 'Rejected - personal use not permitted for company equipment'
WHERE asset_type_needed = 'printer' AND status = 'rejected';

UPDATE borrow_requests 
SET admin_notes = 'Equipment overdue - please contact requester immediately'
WHERE status = 'overdue';

UPDATE borrow_requests 
SET admin_notes = 'Returned in excellent condition'
WHERE status = 'returned';