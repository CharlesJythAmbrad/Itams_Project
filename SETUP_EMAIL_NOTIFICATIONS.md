# 🚀 Complete Email Notifications Setup

You're not receiving emails because the system needs to be set up. Follow these steps:

## ✅ Step 1: Database Setup

Run this SQL file in your Supabase SQL Editor:
```sql
-- Execute: supabase/email_notifications_setup.sql
```

## ✅ Step 2: Deploy Email Function

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. **Deploy the email function**:
   ```bash
   supabase functions deploy send-email
   ```

## ✅ Step 3: Set Up Email Provider

1. **Sign up for Resend** (free email service):
   - Go to [resend.com](https://resend.com)
   - Create account
   - Verify your domain (or use their test domain)
   - Get API key

2. **Set the API key in Supabase**:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   ```

## ✅ Step 4: Update Function URL

In your `email_notifications_setup.sql` file, replace `YOUR_PROJECT_ID` with your actual Supabase project ID:
```sql
url := 'https://YOUR_ACTUAL_PROJECT_ID.supabase.co/functions/v1/send-email',
```

## ✅ Step 5: Test the System

1. **Check your borrowed asset**:
   ```sql
   -- Run: supabase/check_email_system.sql
   ```

2. **Manually trigger emails**:
   ```sql
   SELECT trigger_return_reminders();
   ```

## 🔍 Why You're Not Getting Emails

Most likely one of these is missing:

1. **❌ Database functions not set up** - Run `email_notifications_setup.sql`
2. **❌ Edge Function not deployed** - Run `supabase functions deploy send-email`
3. **❌ No API key** - Set `RESEND_API_KEY` 
4. **❌ Wrong project URL** - Update project ID in SQL
5. **❌ Cron job not running** - System runs daily at 9 AM, or trigger manually

## 🎯 Quick Fix

If you want emails to work RIGHT NOW:

1. **Set up Resend account** (5 minutes)
2. **Deploy function**: `supabase functions deploy send-email`
3. **Set API key**: `supabase secrets set RESEND_API_KEY=your_key`
4. **Run setup SQL**: Execute `email_notifications_setup.sql`
5. **Test manually**: `SELECT trigger_return_reminders();`

## 📧 Expected Result

Once set up, you'll automatically get:
- **Tomorrow reminders** at 9:00 AM for assets due next day
- **Overdue notices** daily for assets past due date
- **Professional emails** with asset details

## 🆘 Need Help?

1. Check Supabase Dashboard → Functions → Logs for errors
2. Verify your borrowed asset has `expected_return_date = tomorrow`
3. Make sure asset status is `active` in `asset_borrowing` table
4. Check spam folder in your email

The system is designed to work automatically, but needs initial setup first!