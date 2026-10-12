-- Create Test Email Data with All Required Fields
-- Run this in Supabase SQL Editor

-- Clean up old test data
DELETE FROM email_queue WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com';
DELETE FROM asset_borrowing WHERE borrower_email = 'chbe.ambrad.swu@phinmaed.com';

-- Create a borrowing record due tomorrow (with all required fields)
INSERT INTO asset_borrowing (
  id,
  asset_id,
  borrower_name,
  borrower_email,
  borrower_department,  -- This was missing
  borrowed_date,
  expected_return_date,
  status,
  borrow_location,
  purpose,
  reminder_sent_tomorrow,
  reminder_sent_overdue
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM assets LIMIT 1),
  'Test User',
  'chbe.ambrad.swu@phinmaed.com',
  'IT Department',  -- Added required borrower_department
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE + INTERVAL '1 day', -- Due tomorrow
  'active',
  'IT Department',
  'Testing email reminder system',
  FALSE,
  FALSE
);

-- Queue the reminder
SELECT trigger_return_reminders() as queue_result;

-- Check what was queued
SELECT 
  'QUEUED EMAILS:' as info,
  id,
  recipient_email,
  email_subject,
  status,
  created_at
FROM email_queue 
WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com'
ORDER BY created_at DESC;

-- Show borrowing data
SELECT 
  'BORROWING DATA:' as info,
  borrower_name,
  borrower_email,
  expected_return_date,
  CURRENT_DATE as today,
  expected_return_date - CURRENT_DATE as days_until_due
FROM asset_borrowing 
WHERE borrower_email = 'chbe.ambrad.swu@phinmaed.com';