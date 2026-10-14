-- Direct due-date reminder setup
-- Run this in Supabase SQL Editor before deploying the direct reminder action.
-- This file does not create or use email_queue.

ALTER TABLE public.asset_borrowing
  ADD COLUMN IF NOT EXISTS reminder_sent_tomorrow BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_sent_overdue BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_overdue_reminder DATE;

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id BIGSERIAL PRIMARY KEY,
  borrow_id UUID REFERENCES public.asset_borrowing(id),
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_asset_reminders
  ON public.asset_borrowing(expected_return_date, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_direct_notification_logs_borrow
  ON public.notification_logs(borrow_id, notification_type, sent_at DESC);
