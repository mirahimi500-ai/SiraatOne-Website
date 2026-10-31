# Builds assets/data/tajweed/1..114.json from Quran Foundation API v4 (text_uthmani_tajweed).
# Validates: verse counts, 6236 total, only <tajweed class=...> tags, and that the text with tags removed
# is IDENTICAL to the already-verified Uthmani text in assets/data/sura (so colouring never changes a letter).
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$ch   = (Get-Content (Join-Path $root 'assets\data\chapters.json') -Raw -Encoding UTF8 | ConvertFrom-Json).chapters
$tmp  = Join-Path $root 'assets\data\tajweed.tmp'; $dir = Join-Path $root 'assets\data\tajweed'
$enc  = New-Object Text.UTF8Encoding $false
function Get-Json($u) { $r = Invoke-WebRequest $u -UseBasicParsing; [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json }
function Norm($x) { ($x -replace '\s+', ' ').Trim() }
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory $tmp | Out-Null
try {
  $total = 0
  foreach ($c in $ch) {
    $n = [int]$c.id
    $base = (Get-Content (Join-Path $root "assets\data\sura\$n.json") -Raw -Encoding UTF8 | ConvertFrom-Json).ar
    $v = (Get-Json "https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=$n").verses
    if ($v.Count -ne $c.verses) { throw "Sura ${n}: $($v.Count) verses, expected $($c.verses)" }
    $out = New-Object System.Collections.ArrayList
    for ($i = 0; $i -lt $v.Count; $i++) {
      $t = $v[$i].text_uthmani_tajweed -replace '<span class=["'']?end["'']?>[^<]*</span>', ''
      $bad = [regex]::Matches($t, '<[^>]+>') | ? { $_.Value -notmatch '^</?tajweed( class=["'']?[a-z_]+["'']?)?>$' }
      if ($bad) { throw "${n}:$($i+1) unexpected tag $($bad[0].Value)" }
      if ((Norm ($t -replace '<[^>]+>', '')) -ne (Norm $base[$i])) { throw "${n}:$($i+1) letters differ from verified Uthmani text" }
      [void]$out.Add((Norm $t))
    }
    [IO.File]::WriteAllText((Join-Path $tmp "$n.json"), (ConvertTo-Json @{ n=$n; ar=$out.ToArray() } -Compress -Depth 3), $enc)
    $total += $v.Count
  }
  if ($total -ne 6236) { throw "total $total, expected 6236" }
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  Rename-Item $tmp 'tajweed'
  Write-Host "PASS: Tajweed 114 suras, $total verses; every verse matches the verified Uthmani text letter-for-letter"
} catch {
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Write-Host "FAIL: $($_.Exception.Message) (partial files deleted)"; exit 1
}
