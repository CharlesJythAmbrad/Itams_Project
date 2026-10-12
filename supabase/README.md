# Supabase Files

## Essential Files

### SQL Files
- **`complete_email_queue_setup.sql`** - Complete email notification system setup
- **`seed.sql`** - Database seed data
- **`diagnose_complete_email_system.sql`** - Email system diagnostic tool

### Scripts  
- **`process_email_queue.ps1`** - PowerShell script to trigger email sending

### Directories
- **`functions/`** - Supabase Edge Functions (send-email function)
- **`migrations/`** - Database migration files
- **`.temp/`** - Temporary files

## Usage

### Setup Email System
```sql
-- Run in Supabase SQL Editor
-- Copy and paste content of complete_email_queue_setup.sql
```

### Process Email Queue
```powershell
# Set your API key
$env:SUPABASE_ANON_KEY = "your-anon-key"

# Run the processor
.\supabase\process_email_queue.ps1
```

### Diagnose Issues  
```sql
-- Run in Supabase SQL Editor
-- Copy and paste content of diagnose_complete_email_system.sql
```