-- Complete Email Queue Setup (Single File)
-- Run this entire file in your Supabase SQL Editor

-- Create email_queue table to store pending emails
CREATE TABLE IF NOT EXISTS email_queue (
  id BIGSERIAL PRIMARY KEY,
  borrow_id UUID REFERENCES asset_borrowing(id),
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  email_subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_logs table for tracking
CREATE TABLE IF NOT EXISTS notification_logs (
  id BIGSERIAL PRIMARY KEY,
  borrow_id UUID REFERENCES asset_borrowing(id),
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add reminder tracking columns to asset_borrowing table
ALTER TABLE asset_borrowing 
ADD COLUMN IF NOT EXISTS reminder_sent_tomorrow BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_overdue BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_overdue_reminder DATE;

-- Function to queue email reminders (no HTTP calls)
CREATE OR REPLACE FUNCTION queue_asset_return_reminders()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder_record RECORD;
  email_subject TEXT;
  email_body TEXT;
  queued_count INTEGER := 0;
BEGIN
  -- Queue reminders for assets due tomorrow
  FOR reminder_record IN
    SELECT 
      ab.id as borrow_id,
      ab.expected_return_date,
      ab.borrower_email,
      ab.borrower_name,
      a.asset_tag,
      a.name as asset_name,
      a.category as asset_category,
      a.brand,
      a.model
    FROM asset_borrowing ab
    JOIN assets a ON ab.asset_id = a.id
    WHERE ab.status = 'active'
    AND ab.expected_return_date = CURRENT_DATE + INTERVAL '1 day'
    AND ab.reminder_sent_tomorrow IS NOT TRUE
  LOOP
    -- Prepare email content for tomorrow reminder
    email_subject := 'Reminder: Asset Return Due Tomorrow - ' || reminder_record.asset_tag;
    email_body := 'Dear ' || reminder_record.borrower_name || E',\n\n' ||
                  'This is a friendly reminder that your borrowed asset is due for return tomorrow.\n\n' ||
                  'Asset Details:\n' ||
                  '• Asset Tag: ' || reminder_record.asset_tag || E'\n' ||
                  '• Asset Name: ' || reminder_record.asset_name || E'\n' ||
                  '• Category: ' || reminder_record.asset_category || E'\n' ||
                  CASE 
                    WHEN reminder_record.brand IS NOT NULL THEN '• Brand: ' || reminder_record.brand || E'\n'
                    ELSE ''
                  END ||
                  CASE 
                    WHEN reminder_record.model IS NOT NULL THEN '• Model: ' || reminder_record.model || E'\n'
                    ELSE ''
                  END ||
                  '• Due Date: ' || TO_CHAR(reminder_record.expected_return_date, 'YYYY-MM-DD') || E'\n\n' ||
                  'Please ensure the asset is returned on time to avoid any inconvenience.\n\n' ||
                  'If you need to extend your borrowing period, please contact the inventory staff immediately.\n\n' ||
                  'Thank you for your cooperation.\n\n' ||
                  'Best regards,\n' ||
                  'IT Asset Management System';

    -- Queue email instead of sending directly
    INSERT INTO email_queue (
      borrow_id,
      notification_type,
      recipient_email,
      email_subject,
      email_body,
      status
    ) VALUES (
      reminder_record.borrow_id,
      'return_reminder_tomorrow',
      reminder_record.borrower_email,
      email_subject,
      email_body,
      'pending'
    );

    -- Mark as reminded (queued)
    UPDATE asset_borrowing 
    SET reminder_sent_tomorrow = TRUE,
        last_reminder_sent = NOW()
    WHERE id = reminder_record.borrow_id;

    queued_count := queued_count + 1;
  END LOOP;

  -- Queue overdue notifications
  FOR reminder_record IN
    SELECT 
      ab.id as borrow_id,
      ab.expected_return_date,
      ab.borrower_email,
      ab.borrower_name,
      a.asset_tag,
      a.name as asset_name,
      a.category as asset_category,
      a.brand,
      a.model,
      CURRENT_DATE - ab.expected_return_date as days_overdue
    FROM asset_borrowing ab
    JOIN assets a ON ab.asset_id = a.id
    WHERE ab.status = 'active'
    AND ab.expected_return_date < CURRENT_DATE
    AND (ab.reminder_sent_overdue IS NOT TRUE OR ab.last_overdue_reminder < CURRENT_DATE)
  LOOP
    -- Prepare email content for overdue notification
    email_subject := 'OVERDUE: Asset Return Required - ' || reminder_record.asset_tag;
    email_body := 'Dear ' || reminder_record.borrower_name || E',\n\n' ||
                  'URGENT: Your borrowed asset is now OVERDUE for return.\n\n' ||
                  'Asset Details:\n' ||
                  '• Asset Tag: ' || reminder_record.asset_tag || E'\n' ||
                  '• Asset Name: ' || reminder_record.asset_name || E'\n' ||
                  '• Category: ' || reminder_record.asset_category || E'\n' ||
                  CASE 
                    WHEN reminder_record.brand IS NOT NULL THEN '• Brand: ' || reminder_record.brand || E'\n'
                    ELSE ''
                  END ||
                  CASE 
                    WHEN reminder_record.model IS NOT NULL THEN '• Model: ' || reminder_record.model || E'\n'
                    ELSE ''
                  END ||
                  '• Original Due Date: ' || TO_CHAR(reminder_record.expected_return_date, 'YYYY-MM-DD') || E'\n' ||
                  '• Days Overdue: ' || reminder_record.days_overdue || E'\n\n' ||
                  'Please return this asset IMMEDIATELY to avoid further complications.\n\n' ||
                  'If there are any issues preventing the return, please contact the inventory staff urgently.\n\n' ||
                  'Continued delays may result in additional measures being taken.\n\n' ||
                  'Best regards,\n' ||
                  'IT Asset Management System';

    -- Queue overdue email
    INSERT INTO email_queue (
      borrow_id,
      notification_type,
      recipient_email,
      email_subject,
      email_body,
      status
    ) VALUES (
      reminder_record.borrow_id,
      'return_reminder_overdue',
      reminder_record.borrower_email,
      email_subject,
      email_body,
      'pending'
    );

    -- Mark as reminded
    UPDATE asset_borrowing 
    SET reminder_sent_overdue = TRUE,
        last_overdue_reminder = CURRENT_DATE,
        last_reminder_sent = NOW()
    WHERE id = reminder_record.borrow_id;

    queued_count := queued_count + 1;
  END LOOP;

  RETURN 'Queued ' || queued_count || ' email notifications for sending.';
END;
$$;

-- Manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_return_reminders()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN queue_asset_return_reminders();
END;
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_asset_borrowing_return_date_status 
ON asset_borrowing(expected_return_date, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_email_queue_status 
ON email_queue(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_notification_logs_borrow_id 
ON notification_logs(borrow_id);

-- Grant permissions
GRANT EXECUTE ON FUNCTION queue_asset_return_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_return_reminders() TO authenticated;
GRANT ALL ON email_queue TO authenticated;
GRANT ALL ON notification_logs TO authenticated;

-- Create test data for chbe.ambrad.swu@phinmaed.com
INSERT INTO asset_borrowing (
  id,
  asset_id,
  borrower_email,
  borrower_name,
  borrowed_date,
  expected_return_date,
  status,
  borrow_location,
  purpose
) 
SELECT 
  gen_random_uuid(),
  (SELECT id FROM assets LIMIT 1),
  'chbe.ambrad.swu@phinmaed.com',
  'Test User',
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE + INTERVAL '1 day', -- Due tomorrow
  'active',
  'IT Department',
  'Testing email notifications'
WHERE NOT EXISTS (
  SELECT 1 FROM asset_borrowing 
  WHERE borrower_email = 'chbe.ambrad.swu@phinmaed.com'
  AND status = 'active'
);

-- Queue email reminders (this should work without HTTP extension)
SELECT trigger_return_reminders();

-- Show what was queued
SELECT 
  id,
  notification_type,
  recipient_email,
  email_subject,
  status,
  created_at
FROM email_queue 
WHERE recipient_email = 'chbe.ambrad.swu@phinmaed.com'
ORDER BY created_at DESC;