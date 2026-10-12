-- Check Email Errors and Reset Queue
-- Run this in Supabase SQL Editor

-- 1. Check the current error details
SELECT 
  'CURRENT ERROR DETAILS:' as info,
  recipient_email,
  email_subject,
  status,
  error_message,
  created_at,
  sent_at
FROM email_queue 
WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com'
ORDER BY created_at DESC;

-- 2. Reset the failed email back to pending
UPDATE email_queue 
SET status = 'pending',
    error_message = NULL,
    sent_at = NULL
WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com'
AND status = 'failed';

-- 3. Confirm the reset worked
SELECT 
  'AFTER RESET:' as info,
  recipient_email,
  email_subject,
  status,
  error_message
FROM email_queue 
WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com'
ORDER BY created_at DESC;