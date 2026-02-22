# Simpler, more reliable startup script
Write-Host "🚀 Starting Screenplay Enhancement System..." -ForegroundColor Cyan
Write-Host ""

# Start Backend in new window
Write-Host "Starting Backend on Port 8000..." -ForegroundColor Green
Start-Process -FilePath "pwsh.exe" -ArgumentList "-NoExit", "-Command", "cd 'D:\SEM6\npxcreate_devhacks\backend'; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --host 0.0.0.0 --port 8000"

# Wait for backend to initialize
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start Frontend in new window
Write-Host "Starting Frontend on Port 3000..." -ForegroundColor Cyan
Start-Process -FilePath "pwsh.exe" -ArgumentList "-NoExit", "-Command", "cd 'D:\SEM6\npxcreate_devhacks\scripted'; npm run dev"

Write-Host ""
Write-Host "✅ Services started in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000/main" -ForegroundColor White
Write-Host "   Health:   http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Look for two new PowerShell windows" -ForegroundColor Gray
Write-Host "    If they close immediately, check for errors in those windows" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

