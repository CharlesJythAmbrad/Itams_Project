-- Quick Email System Check
-- Run this to see exactly what's happening with your email system

SELECT '=== STEP 1: Check if email tables exist ===' as status;
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'email_queue' THEN '✓ Email queue table exists'
    WHEN table_name = 'notification_logs' THEN '✓ Notification logs table exists'
    ELSE '? Unknown table'
  END as table_status
FROM information_schema.tables 
WHERE table_name IN ('email_queue', 'notification_logs');

SELECT '=== STEP 2: Check test borrowing data ===' as status;
SELECT 
  COUNT(*) as active_borrowings,
  COUNT(CASE WHEN borrower_email = 'chbe.ambrad.swu@phinmaed.com' THEN 1 END) as test_user_borrowings,
  COUNT(CASE WHEN expected_return_date = CURRENT_DATE + INTERVAL '1 day' THEN 1 END) as due_tomorrow,
  COUNT(CASE WHEN expected_return_date < CURRENT_DATE THEN 1 END) as overdue
FROM asset_borrowing 
WHERE status = 'active';

SELECT '=== STEP 3: Show test user data ===' as status;
SELECT 
  id,
  borrower_email,
  borrower_name,
  expected_return_date,
  CURRENT_DATE as today,
  expected_return_date - CURRENT_DATE as days_until_due,
  reminder_sent_tomorrow,
  reminder_sent_overdue
FROM asset_borrowing 
WHERE borrower_email = 'chbe.ambrad.swu@phinmaed.com' 
AND status = 'active';

SELECT '=== STEP 4: Try to queue reminders ===' as status;
SELECT trigger_return_reminders() as queue_result;

SELECT '=== STEP 5: Check what was queued ===' as status;
SELECT 
  id,
  recipient_email,
  email_subject,
  status,
  created_at
FROM email_queue 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '=== STEP 6: Check queue status counts ===' as status;
SELECT 
  status,
  COUNT(*) as count
FROM email_queue 
GROUP BY status;