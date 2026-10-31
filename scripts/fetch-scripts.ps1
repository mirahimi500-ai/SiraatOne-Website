# Adds two Quran scripts (same sources as the SiraatOne Quran app):
#  - Uthmani (QPC Hafs text + KFGQPC UthmanicHafs font)   -> assets/data/qpc/N.json
#  - IndoPak (Nastaleeq text + IndoPak Nastaleeq font)     -> assets/data/indopak/N.json
# Fonts from verses.quran.foundation, verified by the SHA-256 the app uses. Text from Quran Foundation API v4.
# Validates verse counts per sura + 6236 total + Arabic characters. Partial output deleted on failure.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$ch   = (Get-Content (Join-Path $root 'assets\data\chapters.json') -Raw -Encoding UTF8 | ConvertFrom-Json).chapters
$enc  = New-Object Text.UTF8Encoding $false
function Get-Json($u) { $r = Invoke-WebRequest $u -UseBasicParsing; [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json }
$fonts = @(
  @{ url='https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.ttf'; out='uthmanic-hafs.ttf'; sha='A0636E68E375AF9552470D67773936F54D536E6586CE2608311B2FE7F9CBEC3A' },
  @{ url='https://verses.quran.foundation/fonts/quran/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.ttf'; out='indopak-nastaleeq.ttf'; sha='4C8F002E7538EF6351AC676EB0F2C1708ECD17F6F8A5FC4A19DBC8EAF4DDDFF5' })
$dirs = @{ qpc='text_qpc_hafs'; indopak='text_indopak_nastaleeq' }
$made = @()
try {
  foreach ($f in $fonts) {
    $p = Join-Path $root "assets\fonts\$($f.out)"; $made += $p
    Invoke-WebRequest $f.url -OutFile $p -UseBasicParsing
    if ((Get-FileHash $p -Algorithm SHA256).Hash -ne $f.sha) { throw "font hash mismatch: $($f.out)" }
  }
  foreach ($d in $dirs.Keys) { $t = Join-Path $root "assets\data\$d.tmp"; if (Test-Path $t) { Remove-Item $t -Recurse -Force }; New-Item -ItemType Directory $t | Out-Null; $made += $t }
  $total = 0
  foreach ($c in $ch) {
    $n = [int]$c.id; $acc = @{ qpc = New-Object System.Collections.ArrayList; indopak = New-Object System.Collections.ArrayList }; $p = 1
    do {
      $r = Get-Json "https://api.quran.com/api/v4/verses/by_chapter/${n}?fields=text_qpc_hafs,text_indopak_nastaleeq&per_page=50&page=$p"
      foreach ($v in $r.verses) { foreach ($d in $dirs.Keys) {
        $x = $v.($dirs[$d]); if ($x -notmatch '[\u0600-\u06FF]') { throw "${n}:$($v.verse_number) empty $($dirs[$d])" }; [void]$acc[$d].Add($x) } }
      $p = $r.pagination.next_page
    } while ($p)
    foreach ($d in $dirs.Keys) {
      if ($acc[$d].Count -ne $c.verses) { throw "Sura ${n} ${d}: $($acc[$d].Count) verses, expected $($c.verses)" }
      [IO.File]::WriteAllText((Join-Path $root "assets\data\$d.tmp\$n.json"), (ConvertTo-Json @{ n=$n; ar=$acc[$d].ToArray() } -Compress -Depth 3), $enc)
    }
    $total += $c.verses
  }
  if ($total -ne 6236) { throw "total $total, expected 6236" }
  foreach ($d in $dirs.Keys) { $fin = Join-Path $root "assets\data\$d"; if (Test-Path $fin) { Remove-Item $fin -Recurse -Force }; Rename-Item (Join-Path $root "assets\data\$d.tmp") $d }
  Write-Host "PASS: fonts verified (SHA-256 = app); Uthmani (QPC Hafs) + IndoPak text, 114 suras, $total verses"
} catch {
  foreach ($m in $made) { if ((Test-Path $m) -and ($m -like '*.tmp' -or $_.Exception.Message -like 'font hash*')) { Remove-Item $m -Recurse -Force } }
  Write-Host "FAIL: $($_.Exception.Message) (partial files deleted)"; exit 1
}
