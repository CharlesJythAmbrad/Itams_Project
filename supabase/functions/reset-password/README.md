# Password Reset Edge Function

This Edge Function handles password reset functionality by generating temporary passwords and updating user authentication.

## Setup

1. Deploy the function to Supabase:
```bash
supabase functions deploy reset-password
```

2. Set the required environment variables in your Supabase project:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (has admin privileges)
   - `SUPABASE_ANON_KEY` - Your anon key for database operations

## Usage

The function expects a POST request with JSON body:
```json
{
  "email": "user@example.com"
}
```

## Response

Success:
```json
{
  "success": true,
  "message": "Temporary password sent to user@example.com. Please check your email and log in with the new password.",
  "tempPassword": "TempPass123!" // Only in development
}
```

Error:
```json
{
  "success": false,
  "error": "No account found with this email address"
}
```

## Security Features

- Uses service role key for admin operations
- Generates secure temporary passwords (12 characters, mixed case, numbers, special chars)
- Searches all user tables (users, itsd_users, inventory_staff_users, end_users)
- Proper CORS headers for web requests

## Integration with Email Service

To integrate with a real email service:

1. Add your email service API key to environment variables
2. Replace the console.log email content with actual email sending
3. Popular options: SendGrid, Resend, Nodemailer, etc.

Example with SendGrid:
```typescript
import { sendEmail } from 'sendgrid'

// After password reset success:
await sendEmail({
  to: cleanEmail,
  from: 'noreply@itams.edu',
  subject: 'ITAMS - Your New Temporary Password',
  text: emailContent
})
```