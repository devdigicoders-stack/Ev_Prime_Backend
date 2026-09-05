$token = (Invoke-RestMethod -Uri "https://ev-prime-backend.onrender.com/api/partner/login" -Method POST -ContentType "application/json" -Body '{"username":"green@gmail.com","password":"green123"}').token
Write-Host "Token: $token"

# Get stations
$stationsRes = Invoke-RestMethod -Uri "https://ev-prime-backend.onrender.com/api/partner/me/stations" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "Stations response:"
$stationsRes | ConvertTo-Json -Depth 5
