# PowerShell script to start the backend server
Write-Host "Starting Vehicle Investigation System Backend..." -ForegroundColor Green

# Change to the backend directory
Set-Location -Path .\backend

# Start the server
npm run dev

# Reset to the original directory when the server stops
Set-Location -Path ..

Write-Host "Server has stopped." -ForegroundColor Yellow 