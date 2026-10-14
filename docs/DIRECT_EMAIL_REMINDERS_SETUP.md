# Direct Asset Due-Date Email Reminders

This setup sends reminders directly through the `send-email` Edge Function. It does not write to or process `email_queue`.

## 1. Prepare the database

Run this file once in the Supabase SQL Editor:

```text
supabase/direct_email_reminder_setup.sql
```

The borrowing row must have:

- `status = 'active'`
- `expected_return_date = CURRENT_DATE + 1` for a due-tomorrow reminder, or a date before `CURRENT_DATE` for an overdue reminder
- a valid `borrower_email`
- a valid `asset_id`

## 2. Deploy the direct processor

Set both server-side secrets. Do not put either value in the React `.env` file:

```powershell
supabase secrets set RESEND_API_KEY=re_your_resend_key_here
supabase secrets set REMINDER_CRON_SECRET=use-a-long-random-secret
supabase functions deploy send-email
```

The function now accepts this protected action:

```json
{ "action": "process_reminders" }
```

It finds due-tomorrow and overdue records, claims each record atomically, sends directly through Resend, updates the reminder flags, and writes to `notification_logs`. A failed Resend request releases the claim so the next scheduled run can retry.

## 3. Test immediately without the queue

Reset the sample record and make it due tomorrow:

```sql
UPDATE public.asset_borrowing
SET
  expected_return_date = CURRENT_DATE + 1,
  status = 'active',
  reminder_sent_tomorrow = FALSE,
  reminder_sent_overdue = FALSE,
  last_overdue_reminder = NULL,
  last_reminder_sent = NULL
WHERE borrower_email = 'janetteambrad902@gmail.com';
```

Call the Edge Function from PowerShell:

```powershell
$env:SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"
$env:SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"
$env:REMINDER_CRON_SECRET = "the-same-secret-used-with-supabase-secrets-set"

$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer $env:SUPABASE_ANON_KEY"
  "x-reminder-secret" = $env:REMINDER_CRON_SECRET
}

Invoke-RestMethod `
  -Uri "$env:SUPABASE_URL/functions/v1/send-email" `
  -Method POST `
  -Headers $headers `
  -Body '{"action":"process_reminders"}'
```

A successful response should contain `mode: "direct"` and `sent: 1`.

Check the result:

```sql
SELECT
  borrower_email,
  expected_return_date,
  reminder_sent_tomorrow,
  reminder_sent_overdue,
  last_reminder_sent
FROM public.asset_borrowing
WHERE borrower_email = 'janetteambrad902@gmail.com';

SELECT
  recipient_email,
  notification_type,
  status,
  error_message,
  sent_at
FROM public.notification_logs
WHERE recipient_email = 'janetteambrad902@gmail.com'
ORDER BY sent_at DESC;
```

## 4. Run automatically every day

The repository does not contain a scheduler. Configure one trusted daily invocation in Supabase or another scheduler. The recommended Supabase approach is `pg_cron` plus `pg_net`:

1. Enable the `pg_cron`, `pg_net`, and Vault extensions in the Supabase Dashboard.
2. Store these values in Supabase Vault, not in committed SQL:
   - the function URL
   - `REMINDER_CRON_SECRET`
   - the service-role key, used only by the internal scheduler request

For example, run these statements with your real values in the Supabase SQL Editor and do not commit them:

```sql
SELECT vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email',
  'direct_reminder_function_url'
);
SELECT vault.create_secret('the-same-reminder-cron-secret', 'direct_reminder_secret');
SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'direct_reminder_service_role_key');
```

3. Schedule a daily HTTP request. For example, this runs at 09:00 UTC:

```sql
SELECT cron.schedule(
  'direct-asset-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'direct_reminder_function_url'
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'direct_reminder_service_role_key'
      ),
      'x-reminder-secret', (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'direct_reminder_secret'
      )
    ),
    body := '{"action":"process_reminders"}'::jsonb
  );
  $$
);
```

Adjust `0 9 * * *` to the desired timezone. If `pg_net` is unavailable on the project, use a trusted external scheduler to make the same POST request once per day. Do not call the endpoint from the browser.

## Troubleshooting

- `401 Unauthorized`: the `x-reminder-secret` header does not match `REMINDER_CRON_SECRET`, or the Edge Function gateway rejected the Authorization token.
- `sent: 0`: there are no active records due tomorrow or overdue, or their reminder flags already indicate they were sent.
- `failed: 1`: inspect the Edge Function logs and the failed row in `notification_logs`; common causes are a missing `RESEND_API_KEY`, an unverified Resend sender/domain, or an invalid recipient.
- `sent: 1` but no inbox message: check spam and the Resend delivery dashboard. `onboarding@resend.dev` is suitable for testing but a verified sender/domain is recommended for production.
