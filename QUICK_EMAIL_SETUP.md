# 🚀 Quick Email Setup (No Domain Needed)

You can set up email notifications for FREE without owning a domain!

## ✅ 5-Minute Setup

### Step 1: Get Free Email Service
1. Go to [resend.com](https://resend.com)
2. Sign up with your email (FREE account)
3. Go to API Keys → Create API Key
4. Copy your API key (starts with `re_`)

### Step 2: Deploy Email Function
```bash
# Install Supabase CLI (one time only)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (replace with your project ID from Supabase dashboard)
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the email function
supabase functions deploy send-email

# Set your API key
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### Step 3: Run Database Setup
Execute this in Supabase SQL Editor:
```sql
-- Run: supabase/email_notifications_setup.sql
```

### Step 4: Update Project URL
In `email_notifications_setup.sql`, find this line and update YOUR_PROJECT_ID:
```sql
url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-email',
```

### Step 5: Test It!
```sql
-- Run: supabase/test_email_notification.sql
-- Then uncomment the trigger line and run again
```

## 📧 What You Get

**FREE Features:**
- ✅ 100 emails per day (Resend free tier)
- ✅ Emails from `onboarding@resend.dev`
- ✅ Professional HTML templates
- ✅ Automatic daily reminders at 9 AM
- ✅ No domain verification needed

**Email Example:**
```
From: ITAMS <onboarding@resend.dev>
To: chbe.ambrad.swu@phinmaed.com
Subject: Reminder: Asset Return Due Tomorrow - ITAMS-AST-001

Dear Christine Ambrad,
Your borrowed asset is due for return tomorrow...
```

## 🔧 Alternative: Simple Log-Only System

If you don't want to set up email service, I can create a version that just logs notifications to the database instead. Would you prefer that?

## 💡 Why This Works

- **Resend.com** provides free domain (`onboarding@resend.dev`)
- **100 emails/day** is more than enough for asset notifications
- **No verification** needed for their free domain
- **Professional appearance** - recipients won't know it's free

## 🎯 Total Cost: $0

Everything needed for email notifications is completely free!