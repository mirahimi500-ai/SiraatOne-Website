# Downloads whole-surah audio links + ayah start times (Quran Foundation, Quran.com audio) for gapless recitation.
# Writes assets/data/timing/<reciter>/<n>.json = { "u": audio url, "t": [start ms of each ayah], "e": end ms }.
# Run once from the site folder:  powershell -ExecutionPolicy Bypass -File scripts\fetch-recitation-timings.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$api = 'https://api.qurancdn.com/api/qdc/audio/reciters'
$want = @{ Alafasy = 'afasy'; Husary = 'husary' }   # reader key -> name part to look for
function Get-Json($u) { Invoke-RestMethod -Uri $u -Headers @{ Accept = 'application/json' } -TimeoutSec 30 }

try { $list = (Get-Json "$api`?locale=en").reciters } catch { Write-Host "FAIL: reciter list ($($_.Exception.Message))"; exit 1 }
$ids = @{}
foreach ($k in $want.Keys) {
  $r = $list | Where-Object { ($_.name -match $want[$k] -or $_.translated_name.name -match $want[$k]) -and (-not $_.style -or $_.style.name -match 'Murattal') } | Select-Object -First 1
  if (-not $r) { Write-Host "FAIL: reciter '$k' not found"; exit 1 }
  $ids[$k] = $r.id; Write-Host "Found $k = id $($r.id) ($($r.name) $($r.style.name))"
}

$ok = 0; $bad = @(); $shown = $false; $err = $null
foreach ($k in $ids.Keys) {
  $dir = Join-Path $root "assets\data\timing\$k"; New-Item -ItemType Directory -Force -Path $dir | Out-Null
  for ($n = 1; $n -le 114; $n++) {
    try {
      $d = Get-Json "$api/$($ids[$k])/audio_files?chapter=$n&segments=true"
      $f = if ($d.audio_files) { $d.audio_files[0] } else { $d.audio_file }
      $vt = if ($f.verse_timings) { $f.verse_timings } elseif ($d.timestamps) { $d.timestamps } else { $f.timestamps }
      if (-not $f.audio_url -or -not $vt) { if (-not $shown) { $shown = $true; $j = (($d | ConvertTo-Json -Depth 3 -Compress) -replace '\s+',' '); Write-Host ("DEBUG: " + $j.Substring(0, [Math]::Min(300, $j.Length))) }; throw 'no audio or timings' }
      $t = @($vt | Sort-Object { [int]($_.verse_key -split ':')[1] } | ForEach-Object { [int]$_.timestamp_from })
      $e = [int]($vt | Measure-Object -Property timestamp_to -Maximum).Maximum
      $json = '{"u":"' + $f.audio_url + '","t":[' + ($t -join ',') + '],"e":' + $e + '}'
      [IO.File]::WriteAllText((Join-Path $dir "$n.json"), $json)
      $ok++
    } catch { if (-not $err) { $err = $_.Exception.Message; Write-Host "First error ($k/$n): $err" }; $bad += "$k/$n" }
    Start-Sleep -Milliseconds 120
  }
}
if ($bad.Count) { Write-Host "FAIL: $($bad.Count) missing: $($bad[0..9] -join ', ')" } else { Write-Host "PASS: $ok timing files (Alafasy + Husary, 114 suras each)" }
$s = Get-Content (Join-Path $root 'assets\data\timing\Alafasy\1.json') -Raw -ErrorAction SilentlyContinue
if ($s) { Write-Host "Sample Alafasy 1: $($s.Substring(0, [Math]::Min(160, $s.Length)))" }
