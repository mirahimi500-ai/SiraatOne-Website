# One-step publish: commit + push, then wait until GitHub Pages serves the new version and open the site.
param([string]$m = "Website update")
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
git add -A
git commit -m $m | Out-Null
git push
$ver = ([regex]::Match((Get-Content index.html -Raw), '\?v=(\d{8}[a-z]?)')).Groups[1].Value
$url = 'https://mirahimi500-ai.github.io/SiraatOne-Website/'
Write-Host "Waiting for GitHub Pages (version $ver)..."
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep 10
  try { $h = (Invoke-WebRequest "$url`?t=$(Get-Random)" -UseBasicParsing -Headers @{ 'Cache-Control' = 'no-cache' }).Content } catch { $h = '' }
  if ($h -match [regex]::Escape("?v=$ver")) { Write-Host "PASS: live after $(($i + 1) * 10) s"; Start-Process $url; exit 0 }
}
Write-Host "PENDING: not live after 5 minutes - check https://github.com/mirahimi500-ai/SiraatOne-Website/actions"
