# Email Notifications for Asset Return Reminders

This document outlines the automated email notification system for borrowed asset return reminders.

## Overview

The system automatically sends email notifications to borrowers:
- **1 day before** the return due date (Tomorrow reminder)
- **On the day** the asset becomes overdue (Overdue notification)
- **Daily reminders** for continued overdue assets

## Architecture

### Components
1. **Database Functions** - Core logic for checking due dates and sending emails
2. **Supabase Edge Function** - Email sending service using Resend API
3. **Scheduled Jobs** - Daily automated execution using pg_cron
4. **Admin Interface** - Manual triggers and monitoring dashboard

### Email Flow
```
Daily Cron Job (9:00 AM)
    ↓
Check asset_borrowing table
    ↓
Find assets due tomorrow/overdue
    ↓
Send emails via Edge Function
    ↓
Log notifications
    ↓
Update reminder flags
```

## Setup Instructions

### 1. Database Setup

**IMPORTANT**: Run these SQL files in order in your Supabase SQL editor:

1. **First, create required tables (if they don't exist):**
   ```sql
   -- Execute the entire create_missing_tables_for_email.sql file
   ```

2. **Then, setup email notifications:**
   ```sql
   -- Execute the entire email_notifications_setup.sql file
   ```

This creates:
- `assets` and `asset_borrowing` tables (if missing)
- `send_asset_return_reminders()` function
- `notification_logs` table
- Required columns in `asset_borrowing`
- Scheduled cron job
- Proper indexes and permissions

### 2. Email Service Setup

#### Deploy the Edge Function
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the email function
supabase functions deploy send-email
```

#### Set Up Email Provider (Resend)

1. **Sign up for Resend**
   - Go to [resend.com](https://resend.com)
   - Create an account and verify your domain
   - Generate an API key

2. **Set the API Key**
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   ```

3. **Update the Edge Function URL**
   In `email_notifications_setup.sql`, update the URL:
   ```sql
   url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-email',
   ```

### 3. Configuration

#### Email Templates
The system uses built-in HTML email templates:

**Tomorrow Reminder:**
- Subject: "Reminder: Asset Return Due Tomorrow - [ASSET_TAG]"
- Contains asset details and friendly reminder

**Overdue Notification:**
- Subject: "OVERDUE: Asset Return Required - [ASSET_TAG]"
- Urgent tone with days overdue count

#### Scheduling
- Default: Daily at 9:00 AM server time
- Configurable via cron expression in the SQL setup
- Can be triggered manually for testing

### 4. Admin Interface Integration

Add the EmailNotificationSettings component to your admin pages:

```jsx
import EmailNotificationSettings from '../components/inventory/EmailNotificationSettings';

// In your admin/settings page
<EmailNotificationSettings />
```

## Database Schema Changes

### New Tables

**notification_logs**
```sql
CREATE TABLE notification_logs (
  id BIGSERIAL PRIMARY KEY,
  borrow_id BIGINT REFERENCES borrowed_assets(id),
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Modified Tables

**asset_borrowing** - Added columns:
```sql
ALTER TABLE asset_borrowing 
ADD COLUMN reminder_sent_tomorrow BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_sent_overdue BOOLEAN DEFAULT FALSE,
ADD COLUMN last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_overdue_reminder DATE;
```

## Functions Reference

### Database Functions

#### `send_asset_return_reminders()`
- Main function that processes all reminders
- Checks for assets due tomorrow and overdue assets
- Sends emails and logs notifications
- Updates reminder flags

#### `trigger_return_reminders()`
- Manual trigger function for testing
- Returns confirmation message
- Available to authenticated users

### Edge Function

#### `send-email`
- Accepts: `{ to, subject, html, from? }`
- Uses Resend API for delivery
- Returns: `{ success, message, id }`
- Handles CORS and error responses

## Testing

### Manual Testing
1. Use the admin interface to trigger reminders manually
2. Check the notification logs for sent emails
3. Test the email function with sample data

### Database Testing
```sql
-- Test the manual trigger
SELECT trigger_return_reminders();

-- Check notification logs
SELECT * FROM notification_logs ORDER BY sent_at DESC;

-- View assets due for reminders
SELECT ab.*, a.asset_tag, a.name
FROM asset_borrowing ab
JOIN assets a ON ab.asset_id = a.id
WHERE ab.status = 'borrowed'
AND (ab.expected_return_date = CURRENT_DATE + INTERVAL '1 day'
     OR ab.expected_return_date < CURRENT_DATE);
```

## Troubleshooting

### Common Issues

1. **Emails Not Sending**
   - Check RESEND_API_KEY is set correctly
   - Verify domain is verified in Resend
   - Check Edge Function logs in Supabase dashboard

2. **Cron Job Not Running**
   - Verify pg_cron extension is enabled
   - Check if your Supabase plan supports cron jobs
   - Use manual trigger as alternative

3. **Function Permissions**
   - Ensure RLS policies allow function execution
   - Check that service role key is configured
   - Verify function permissions are granted

### Monitoring

- **Notification Logs**: Track all sent emails and their status
- **Admin Dashboard**: View statistics and recent notifications
- **Supabase Logs**: Check Edge Function execution logs
- **Database Logs**: Monitor cron job execution

## Security Considerations

- Email addresses are validated before sending
- Service role key is used for internal API calls
- Notification logs maintain audit trail
- Rate limiting handled by Resend API

## Alternative Email Providers

The system can be adapted for other email providers:

### SendGrid
Replace Resend API calls with SendGrid API

### SMTP
Use nodemailer or similar SMTP client

### Postmark
Implement Postmark API integration

Update the Edge Function accordingly and set the appropriate API keys.

## Performance Notes

- Function runs efficiently with proper indexes
- Batch processing prevents timeout issues
- Notification flags prevent duplicate sends
- Daily execution minimizes resource usage

## Support

For issues or questions:
1. Check Supabase function logs
2. Review notification_logs table
3. Test email function manually
4. Verify all setup steps completed