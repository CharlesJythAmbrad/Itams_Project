# Quick Email Troubleshooting

## Step 1: Run the Database Check

In your Supabase SQL Editor, copy and paste the entire content of:
**`supabase/quick_email_check.sql`**

This will show you:
- ✅ Are the email tables created?
- ✅ Is there test data for chbe.ambrad.swu@phinmaed.com?
- ✅ Are emails being queued?

## Step 2: Test Basic Email Function

In PowerShell:
```powershell
# Set your Supabase anon key (get from Supabase Settings > API)
$env:SUPABASE_ANON_KEY = "your-anon-key-here"

# Run the basic email test
.\supabase\test_basic_email.ps1
```

This will:
- 🧪 Send a direct test email
- 🔄 Process any queued emails
- 📋 Show you exactly what's working/failing

## Step 3: Check Common Issues

### Issue 1: No Tables Created
**Symptom:** Quick check shows missing tables
**Solution:** Run the complete setup:
```sql
-- Copy and paste entire content of:
-- supabase/complete_email_queue_setup.sql
```

### Issue 2: Edge Function Not Deployed
**Symptom:** "Function not found" error
**Solution:** Deploy the function:
```bash
supabase functions deploy send-email
```

### Issue 3: Missing API Key
**Symptom:** "RESEND_API_KEY not set" error
**Solution:** Set your Resend API key:
```bash
supabase secrets set RESEND_API_KEY=your_resend_key_here
```

### Issue 4: Wrong Anon Key
**Symptom:** "Unauthorized" or authentication errors
**Solution:** Get the correct key from Supabase Dashboard > Settings > API

### Issue 5: No Test Data
**Symptom:** "0 active borrowings" in database check
**Solution:** The setup script should create test data, but if not:
```sql
INSERT INTO asset_borrowing (
  id, asset_id, borrower_email, borrower_name,
  borrowed_date, expected_return_date, status,
  borrow_location, purpose
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM assets LIMIT 1),
  'chbe.ambrad.swu@phinmaed.com',
  'Test User',
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE + INTERVAL '1 day',
  'active',
  'IT Department',
  'Testing'
);
```

## Expected Results

### Successful Database Check:
```
✓ Email queue table exists
✓ Notification logs table exists
1 test_user_borrowings
1 due_tomorrow
Queued 1 email notifications for sending
```

### Successful Email Test:
```
✅ Direct email sent successfully!
✅ Queue processing completed!
```

### In Your Inbox:
- Subject: "TEST: Direct Email from Asset Management System"
- Subject: "Reminder: Asset Return Due Tomorrow - [ASSET_TAG]"
- From: onboarding@resend.dev

## Still Not Working?

If you still don't receive emails after all checks pass:

1. **Check Spam/Junk Folder** - New domains often go to spam
2. **Try Different Email** - Test with a different email address
3. **Check Resend Dashboard** - Log into resend.com to see delivery status
4. **Wait 5-10 minutes** - Sometimes there's a delay

## Quick Commands Summary

```powershell
# 1. Set API key
$env:SUPABASE_ANON_KEY = "your-key"

# 2. Test emails
.\supabase\test_basic_email.ps1

# 3. If function missing
supabase functions deploy send-email

# 4. If API key missing  
supabase secrets set RESEND_API_KEY=your_resend_key
```