# Builds assets/data/reciters.json ONCE from MP3Quran.net (same source and filter as the SiraatOne Quran app:
# rewaya=1 (Hafs), https server, surah_total 114, surah_list exactly 1..114). Each reciter is then tested:
# files 001.mp3 and 114.mp3 must answer HTTP 200 with an audio type. Failed reciters are skipped and listed.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$out  = Join-Path $root 'assets\data\reciters.json'
$rep  = Join-Path $env:USERPROFILE 'Desktop\rec-report.txt'
function Get-Json($u) { $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 120; [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json }
function Test-Mp3($u) {
  try { $r = Invoke-WebRequest $u -Method Head -UseBasicParsing -TimeoutSec 30; return ($r.StatusCode -eq 200) -and ("$($r.Headers['Content-Type'])" -match 'audio|mpeg|octet') }
  catch { return $false }
}
try {
  $all = (Get-Json 'https://mp3quran.net/api/v3/reciters?language=eng&rewaya=1').reciters
  $want = (1..114) -join ','
  $ok = @(); $bad = @(); $n = 0
  foreach ($r in $all) {
    foreach ($m in @($r.moshaf)) {
      if (-not ($m.server -like 'https://*') -or [int]$m.surah_total -ne 114) { continue }
      $list = ((($m.surah_list -split ',') | ForEach-Object { [int]$_.Trim() }) | Sort-Object -Unique) -join ','
      if ($list -ne $want) { continue }
      $n++
      $srv = "$($m.server)"; if (-not $srv.EndsWith('/')) { $srv += '/' }
      if ((Test-Mp3 ($srv + '001.mp3')) -and (Test-Mp3 ($srv + '114.mp3'))) {
        $ok += [pscustomobject]@{ id = "$($r.id)-$($m.id)"; name = "$($r.name)".Trim(); moshaf = "$($m.name)".Trim(); server = $srv }
        Write-Host "OK   $($r.name) - $($m.name)"
      } else { $bad += "$($r.name) - $($m.name) : audio test failed"; Write-Host "SKIP $($r.name)" }
    }
  }
  if ($ok.Count -lt 5) { throw "only $($ok.Count) reciters passed" }
  $doc = [ordered]@{ source = 'MP3Quran.net API v3 (mp3quran.net/api/v3/reciters?language=eng&rewaya=1)'; fetched = (Get-Date -Format 'yyyy-MM-dd'); reciters = @($ok | Sort-Object name, moshaf) }
  [IO.File]::WriteAllText($out, ($doc | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding $false))
  $sum = "PASS: $($ok.Count) reciters (of $n full-Quran Hafs recordings tested). Skipped: $($bad.Count)"
  @($sum) + $bad | Out-File $rep -Encoding utf8
  Write-Host $sum; Write-Host "Report: $rep"
} catch {
  if (Test-Path $out) { Remove-Item $out -Force }
  Write-Host "FAIL: $($_.Exception.Message)"; exit 1
}
