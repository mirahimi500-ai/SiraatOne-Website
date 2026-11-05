# Downloads the translated surah names (meanings) for the website interface languages from Quran Foundation (Quran.com).
# Writes assets/data/sura-names/<code>.json = { "lang": "<language name returned>", "n": [114 names] }. Run once:
#   powershell -ExecutionPolicy Bypass -File scripts\fetch-sura-names.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$dir = Join-Path $root 'assets\data\sura-names'; New-Item -ItemType Directory -Force -Path $dir | Out-Null
$codes = 'ur','fa','ps','tr','id','ms','bn','hi','ta','so','sw','fr','es','de','ru'
$ok = @(); $fallback = @(); $bad = @()
foreach ($c in $codes) {
  try {
    $d = Invoke-RestMethod -Uri "https://api.qurancdn.com/api/qdc/chapters?language=$c" -Headers @{ Accept = 'application/json' } -TimeoutSec 30
    $ch = @($d.chapters | Sort-Object { [int]$_.id })
    if ($ch.Count -ne 114) { throw "got $($ch.Count) chapters" }
    $ln = [string]$ch[0].translated_name.language_name
    $names = $ch | ForEach-Object { ([string]$_.translated_name.name).Replace('\', '\\').Replace('"', '\"') }
    $json = '{"lang":"' + $ln + '","n":["' + ($names -join '","') + '"]}'
    [IO.File]::WriteAllText((Join-Path $dir "$c.json"), $json, (New-Object Text.UTF8Encoding $false))
    if ($ln -match 'english') { $fallback += $c } else { $ok += "$c($ln)" }
  } catch { $bad += "$c ($($_.Exception.Message))" }
  Start-Sleep -Milliseconds 150
}
Write-Host ("PASS: " + $ok.Count + " languages: " + ($ok -join ' '))
if ($fallback.Count) { Write-Host ("English only (no translation): " + ($fallback -join ' ')) }
if ($bad.Count) { Write-Host ("FAIL: " + ($bad -join '; ')) }
