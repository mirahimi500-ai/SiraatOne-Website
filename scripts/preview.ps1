# Instant local preview: serves C:\SiraatOne-Website at http://localhost:8000 and opens it. Ctrl+C to stop.
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
Start-Process "http://localhost:8000/"
python -m http.server 8000
