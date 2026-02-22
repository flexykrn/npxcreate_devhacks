# Ollama Startup Script for ScriptED Backend
Write-Host "=" * 60
Write-Host "🚀 ScriptED Backend - Ollama Setup"
Write-Host "=" * 60

# Check if Ollama is installed
$ollamaFound = $false
$ollamaPaths = @(
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe",
    "C:\Program Files\Ollama\ollama.exe",
    "C:\Ollama\ollama.exe"
)

foreach ($path in $ollamaPaths) {
    if (Test-Path $path) {
        $ollamaFound = $true
        $ollamaExe = $path
        Write-Host "✅ Found Ollama at: $path"
        break
    }
}

if (-not $ollamaFound) {
    Write-Host "❌ Ollama not found!"
    Write-Host "📥 Please download from: https://ollama.com/download"
    exit 1
}

# Check if Ollama is running
$ollamaProcess = Get-Process ollama* -ErrorAction SilentlyContinue
if ($ollamaProcess) {
    Write-Host "✅ Ollama is already running (PID: $($ollamaProcess.Id))"
} else {
    Write-Host "🔄 Starting Ollama service..."
    Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "✅ Ollama service started"
}

# Check API
Write-Host "`n🔍 Checking Ollama API..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5
    Write-Host "✅ Ollama API is accessible"
    
    Write-Host "`n📦 Available models:"
    foreach ($model in $response.models) {
        Write-Host "   - $($model.name) ($(([math]::Round($model.size / 1GB, 2))) GB)"
    }
    
    # Check for required model
    $requiredModel = "redule26/huihui_ai_qwen2.5-vl-7b-abliterated:latest"
    $modelExists = $response.models | Where-Object { $_.name -eq $requiredModel }
    
    if ($modelExists) {
        Write-Host "`n✅ Required model found: $requiredModel"
    } else {
        Write-Host "`n⚠️  Required model not found: $requiredModel"
        Write-Host "💡 Available Qwen models:"
        $qwenModels = $response.models | Where-Object { $_.name -like "*qwen*" }
        foreach ($model in $qwenModels) {
            Write-Host "   - $($model.name)"
        }
    }
    
} catch {
    Write-Host "❌ Ollama API not accessible: $_"
    Write-Host "💡 Try restarting Ollama or check logs"
    exit 1
}

Write-Host "`n" + ("=" * 60)
Write-Host "🎉 Ollama is ready! You can now start the backend."
Write-Host ("=" * 60)

exit 0
