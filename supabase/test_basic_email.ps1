# Test Basic Email Function
# This sends a simple test email to verify the system works

param(
    [string]$Email = "chbe.ambrad.swu@phinmaed.com"
)

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }

Write-Info "=== Basic Email System Test ==="
Write-Info "Target Email: $Email"
Write-Info "Timestamp: $(Get-Date)"

# Check if environment variable is set
if (-not $env:SUPABASE_ANON_KEY) {
    Write-Error "ERROR: SUPABASE_ANON_KEY environment variable is not set"
    Write-Warning "Please run: `$env:SUPABASE_ANON_KEY = 'your-anon-key-from-supabase-settings'"
    Write-Info "You can find your anon key in Supabase Dashboard > Settings > API"
    exit 1
}

$SUPABASE_URL = "https://anzuiuoobrczdpbyjowe.supabase.co"

# Test 1: Direct email send
Write-Info "`n=== TEST 1: Direct Email Send ==="

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $env:SUPABASE_ANON_KEY"
}

$emailBody = @{
    to = $Email
    subject = "TEST: Direct Email from Asset Management System"
    html = @"
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">✅ Direct Email Test</h2>
    <p>Dear User,</p>
    <p><strong>This is a direct email test from your Asset Management System.</strong></p>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3>Test Details:</h3>
        <ul>
            <li><strong>Test Type:</strong> Direct Email Send</li>
            <li><strong>Timestamp:</strong> $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</li>
            <li><strong>System:</strong> Email Notification System</li>
            <li><strong>Purpose:</strong> Verify email delivery is working</li>
        </ul>
    </div>
    
    <p>If you receive this email, it means:</p>
    <ul>
        <li>✅ Your Edge Function is deployed and working</li>
        <li>✅ Your Resend API key is configured correctly</li>
        <li>✅ Email delivery is functional</li>
    </ul>
    
    <p><em>This is an automated test message. Please ignore if received unexpectedly.</em></p>
    
    <hr>
    <p style="color: #666; font-size: 12px;">
        Asset Management System<br>
        Email Test Service
    </p>
</div>
"@
} | ConvertTo-Json -Depth 3

try {
    Write-Info "Sending direct email..."
    
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/send-email" -Method POST -Headers $headers -Body $emailBody -TimeoutSec 30
    
    Write-Success "✅ Direct email sent successfully!"
    Write-Info "Response: $($response | ConvertTo-Json -Depth 2)"
    
} catch {
    Write-Error "❌ Direct email failed!"
    Write-Error "Error: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Error "HTTP Status Code: $statusCode"
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Error "Response: $responseBody"
        } catch {
            Write-Warning "Could not read error response"
        }
    }
    
    Write-Warning "`nPossible issues:"
    Write-Warning "1. Edge Function not deployed: supabase functions deploy send-email"
    Write-Warning "2. Resend API key not set: supabase secrets set RESEND_API_KEY=your_key"
    Write-Warning "3. Wrong anon key: Check Supabase Settings > API"
    Write-Warning "4. Internet/network issues"
    
    exit 1
}

# Test 2: Process email queue
Write-Info "`n=== TEST 2: Process Email Queue ==="

$queueBody = @{
    action = "process_queue"
} | ConvertTo-Json

try {
    Write-Info "Processing email queue..."
    
    $queueResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/send-email" -Method POST -Headers $headers -Body $queueBody -TimeoutSec 30
    
    Write-Success "✅ Queue processing completed!"
    Write-Info "Queue Response: $($queueResponse | ConvertTo-Json -Depth 2)"
    
} catch {
    Write-Error "❌ Queue processing failed!"
    Write-Error "Queue Error: $($_.Exception.Message)"
}

Write-Info "`n=== SUMMARY ==="
Write-Success "Test completed. Check your email at: $Email"
Write-Info "Expected emails:"
Write-Info "1. Subject: 'TEST: Direct Email from Asset Management System'"
Write-Info "2. Any queued reminder emails (if queue had pending items)"
Write-Warning "`nIf you don't receive emails, check:"
Write-Warning "• Spam/Junk folder"
Write-Warning "• Email address is correct: $Email"
Write-Warning "• Resend.com dashboard for delivery status"