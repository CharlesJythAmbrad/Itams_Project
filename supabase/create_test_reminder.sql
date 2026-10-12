-- Create Test Email Reminder
-- Run this in Supabase SQL Editor

-- Clean up old test data
DELETE FROM email_queue WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com';
DELETE FROM asset_borrowing WHERE borrower_email = 'chbe.ambrad.swu@phinmaed.com';

-- Create a fresh borrowing record due tomorrow
INSERT INTO asset_borrowing (
  id,
  asset_id,
  borrower_email,
  borrower_name,
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
  'chbe.ambrad.swu@phinmaed.com',
  'Test User',
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE + INTERVAL '1 day', -- Due tomorrow
  'active',
  'IT Department',
  'Testing email reminder system',
  FALSE, -- Reset reminder flags
  FALSE
);

-- Queue the email reminder
SELECT trigger_return_reminders() as queue_result;

-- Show what was queued
SELECT 
  'Queued Email Details:' as info,
  recipient_email,
  email_subject,
  status,
  created_at
FROM email_queue 
WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com'
ORDER BY created_at DESC;