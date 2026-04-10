$resetEmail = "test.aurem.51438@gmail.com"
Write-Host "Testing password reset for: $resetEmail" -ForegroundColor Cyan

$body = @{
    email = $resetEmail
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://www.auremthecoatsociety.com/api/auth/reset" `
      -Method POST `
      -ContentType "application/json" `
      -Body $body `
      -UseBasicParsing -ErrorAction Stop
    
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`nWaiting 2 seconds for logs..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "Checking logs..." -ForegroundColor Cyan
& npx vercel logs --since 15s --expand
