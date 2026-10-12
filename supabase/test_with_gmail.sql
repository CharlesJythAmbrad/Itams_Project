-- Test with Gmail address
-- Run this in Supabase SQL Editor

-- 1. Check current error details first
SELECT 
  'CURRENT ERROR DETAILS:' as info,
  recipient_email,
  email_subject,
  status,
  error_message,
  created_at
FROM email_queue 
WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com'
ORDER BY created_at DESC;

-- 2. Switch to Gmail address and reset status
UPDATE email_queue 
SET recipient_email = 'acharlesjyth@gmail.com',
    status = 'pending',
    error_message = NULL,
    sent_at = NULL
WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com';

-- 3. Also update the borrowing record to match
UPDATE asset_borrowing 
SET borrower_email = 'acharlesjyth@gmail.com',
    borrower_name = 'Charles Jyth'
WHERE borrower_email = 'chbe.ambrad.swu@phinmaed.com';

-- 4. Confirm the changes
SELECT 
  'UPDATED QUEUE:' as info,
  recipient_email,
  email_subject,
  status,
  created_at
FROM email_queue 
WHERE recipient_email = 'acharlesjyth@gmail.com'
ORDER BY created_at DESC;

SELECT 
  'UPDATED BORROWING:' as info,
  borrower_name,
  borrower_email,
  expected_return_date
FROM asset_borrowing 
WHERE borrower_email = 'acharlesjyth@gmail.com';