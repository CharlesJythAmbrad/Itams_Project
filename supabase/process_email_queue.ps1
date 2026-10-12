# Process Email Queue via Edge Function (PowerShell)
# This script calls the Edge Function to process queued emails

# Your Supabase project URL
$SUPABASE_URL = "https://anzuiuoobrczdpbyjowe.supabase.co"

# You can set your anon key here or use environment variable
# $env:SUPABASE_ANON_KEY = "your-anon-key-here"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $env:SUPABASE_ANON_KEY"
}

$body = @{
    action = "process_queue"
} | ConvertTo-Json

try {
    Write-Host "Processing email queue..." -ForegroundColor Green
    
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/send-email" -Method POST -Headers $headers -Body $body
    
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 3
    
    Write-Host "Email queue processing completed." -ForegroundColor Green
    Write-Host "Check your email at chbe.ambrad.swu@phinmaed.com" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error processing email queue:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}