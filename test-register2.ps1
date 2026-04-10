$testEmail = "test.aurem." + (Get-Random -Minimum 10000 -Maximum 99999) + "@gmail.com"
Write-Host "Testing registration with: $testEmail" -ForegroundColor Cyan

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

$response = Invoke-WebRequest -Uri "https://www.auremthecoatsociety.com/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing

Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
Write-Host "Email: $testEmail"

Start-Sleep -Seconds 2
Write-Host "`nChecking Resend error logs..." -ForegroundColor Yellow
& npx vercel logs --since 15s --level error --expand
