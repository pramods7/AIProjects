$ErrorActionPreference = "Stop"

Write-Host "Checking Ollama Connectivity..." -ForegroundColor Cyan

try {
    $conn = Test-NetConnection -ComputerName 127.0.0.1 -Port 11434 -InformationLevel Quiet
    if ($conn) {
        Write-Host "✅ TCP Connection to 127.0.0.1:11434 Successful." -ForegroundColor Green
        
        # Try HTTP
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:11434" -UseBasicParsing -TimeoutSec 5
            if ($resp.StatusCode -eq 200) {
                 Write-Host "✅ HTTP Request Successful. Ollama is running." -ForegroundColor Green
                 Write-Host "Response: $($resp.Content)" -ForegroundColor Gray
            }
        } catch {
             Write-Host "⚠️ TCP connected but HTTP request failed or timed out: $_" -ForegroundColor Yellow
        }

    } else {
        Write-Host "❌ Could not connect to 127.0.0.1:11434." -ForegroundColor Red
        Write-Host "Please ensure Ollama is running."
        exit 1
    }
} catch {
    Write-Host "❌ Error running checks: $_" -ForegroundColor Red
    exit 1
}
