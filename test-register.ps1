$testEmail = "test.aurem." + (Get-Random -Minimum 10000 -Maximum 99999) + "@gmail.com"
Write-Host "Testing with: $testEmail" -ForegroundColor Cyan

$body = @{
    email = $testEmail
    password = "TestPass123!"
    firstName = "Test"
    lastName = "User"
    countryCode = "IT"
    address1 = "Via Roma 123"
    city = "Milano"
    postalCode = "20100"
    acceptsMarketing = $true
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://www.auremthecoatsociety.com/api/auth/register" `
      -Method POST `
      -ContentType "application/json" `
      -Body $body `
      -UseBasicParsing -ErrorAction Stop
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.Exception.Response.Content
}

Write-Host "`nWaiting 3 seconds for logs..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "Checking logs..." -ForegroundColor Cyan
& npx vercel logs --since 1m --limit 50
