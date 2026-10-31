# Builds assets/data/tajweed/1..114.json = Quran Foundation text_uthmani_tajweed markup (the RULE source only).
# This markup is never shown as Quran text: the browser projects its rules onto the selected Mushaf text
# (same fail-closed method as the SiraatOne Quran app). Validates verse counts, 6236 total and that only
# <tajweed class=..>, <rule class=..> and <span class=end> tags occur. Partial output deleted on failure.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$ch   = (Get-Content (Join-Path $root 'assets\data\chapters.json') -Raw -Encoding UTF8 | ConvertFrom-Json).chapters
$tmp  = Join-Path $root 'assets\data\tajweed.tmp'; $dir = Join-Path $root 'assets\data\tajweed'
$enc  = New-Object Text.UTF8Encoding $false
function Get-Json($u) { $r = Invoke-WebRequest $u -UseBasicParsing; [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json }
$ok = '^<\s*/?\s*(tajweed|rule|span)\b[^>]*>$'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory $tmp | Out-Null
try {
  $total = 0; $tags = 0
  foreach ($c in $ch) {
    $n = [int]$c.id
    $v = (Get-Json "https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=$n").verses
    if ($v.Count -ne $c.verses) { throw "Sura ${n}: $($v.Count) verses, expected $($c.verses)" }
    $out = New-Object System.Collections.ArrayList
    for ($i = 0; $i -lt $v.Count; $i++) {
      $t = [string]$v[$i].text_uthmani_tajweed
      if ($t -notmatch '[\u0600-\u06FF]') { throw "${n}:$($i+1) empty" }
      foreach ($m in [regex]::Matches($t, '<[^>]+>')) { $tags++; if ($m.Value -notmatch $ok) { throw "${n}:$($i+1) unsupported tag $($m.Value)" } }
      [void]$out.Add($t)
    }
    [IO.File]::WriteAllText((Join-Path $tmp "$n.json"), (ConvertTo-Json @{ n=$n; ar=$out.ToArray() } -Compress -Depth 3), $enc)
    $total += $v.Count
  }
  if ($total -ne 6236) { throw "total $total, expected 6236" }
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  Rename-Item $tmp 'tajweed'
  Write-Host "PASS: Tajweed rule markup 114 suras, $total verses, $tags tags (all allowed types)"
} catch {
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Write-Host "FAIL: $($_.Exception.Message) (partial files deleted)"; exit 1
}
