$ErrorActionPreference = "SilentlyContinue"

Write-Host "🛑 Stopping existing Ollama instances..." -ForegroundColor Yellow
Stop-Process -Name "ollama" -Force
Stop-Process -Name "ollama app" -Force

Start-Sleep -Seconds 2

Write-Host "🌍 Setting OLLAMA_ORIGINS environment variable..." -ForegroundColor Cyan
[System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'Process')
$env:OLLAMA_ORIGINS = "*"

Write-Host "🚀 Starting Ollama with CORS enabled..." -ForegroundColor Green
try {
    # Start Ollama in a separate process so it doesn't block this shell
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Minimized
    
    Write-Host "✅ Ollama is restarting in the background!" -ForegroundColor Green
    Write-Host "⏳ Please wait 5-10 seconds before trying the app again." -ForegroundColor Gray
}
catch {
    Write-Host "❌ Failed to start Ollama. Please run 'ollama serve' manually after setting '$env:OLLAMA_ORIGINS=""*""'" -ForegroundColor Red
}
