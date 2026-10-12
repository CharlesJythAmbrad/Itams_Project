-- Complete Email System Diagnosis
-- Run this to check every step of the email process

-- 1. Check if email queue table exists and has data
SELECT 'STEP 1: Email Queue Check' as step;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_queue')
    THEN '✓ email_queue table exists'
    ELSE '✗ email_queue table does NOT exist - run complete_email_queue_setup.sql'
  END as email_queue_status;

-- Show queued emails if table exists
SELECT 
  id,
  recipient_email,
  email_subject,
  status,
  created_at,
  sent_at,
  error_message
FROM email_queue 
WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check test borrowing data
SELECT 'STEP 2: Test Data Check' as step;
SELECT 
  id,
  borrower_email,
  borrower_name,
  expected_return_date,
  status,
  reminder_sent_tomorrow
FROM asset_borrowing 
WHERE borrower_email = 'chbe.ambrad.swu@phinmaed.com'
AND status = 'active';

-- 3. Check if functions exist
SELECT 'STEP 3: Function Check' as step;
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('queue_asset_return_reminders', 'trigger_return_reminders');

-- 4. Test the queue function manually
SELECT 'STEP 4: Manual Queue Test' as step;
SELECT trigger_return_reminders() as queue_result;

-- 5. Check queue status after manual trigger
SELECT 'STEP 5: Queue Status After Manual Trigger' as step;
SELECT 
  status,
  COUNT(*) as count
FROM email_queue 
GROUP BY status;

-- 6. Show recent queue entries
SELECT 'STEP 6: Recent Queue Entries' as step;
SELECT 
  recipient_email,
  email_subject,
  status,
  created_at,
  error_message
FROM email_queue 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Check notification logs
SELECT 'STEP 7: Notification Logs Check' as step;
SELECT 
  recipient_email,
  notification_type,
  sent_at,
  status,
  error_message
FROM notification_logs 
WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com'
ORDER BY sent_at DESC
LIMIT 5;