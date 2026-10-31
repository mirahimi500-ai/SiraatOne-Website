# Builds assets/data/index.json (Juz, Hizb, Rub al-Hizb and Madani page starts) from Quran Foundation API v4.
# Validates: 30 juz, 60 hizb, 240 rub, 604 pages, each numbered 1..N in order, 6236 verses. Partial output deleted on failure.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$out  = Join-Path $root 'assets\data\index.json'
$tmp  = "$out.tmp"
function Get-Json($u) { $r = Invoke-WebRequest $u -UseBasicParsing; [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json }
try {
  $f = @('juz_number','hizb_number','rub_el_hizb_number','page_number'); $k = @('juz','hizb','rub','page')
  $starts = @{}; $last = @{}; foreach ($x in $k) { $starts[$x] = New-Object System.Collections.ArrayList; $last[$x] = 0 }
  $total = 0
  foreach ($s in 1..114) {
    $p = 1
    do {
      $r = Get-Json "https://api.quran.com/api/v4/verses/by_chapter/${s}?per_page=50&page=$p"
      foreach ($v in $r.verses) {
        $total++; $a = [int]$v.verse_number
        for ($i = 0; $i -lt 4; $i++) {
          $val = [int]$v.($f[$i]); $key = $k[$i]
          if ($val -ne $last[$key]) {
            if ($val -ne $last[$key] + 1) { throw "$key jumps from $($last[$key]) to $val at ${s}:$a" }
            [void]$starts[$key].Add(@($s, $a)); $last[$key] = $val
          }
        }
      }
      $p = $r.pagination.next_page
    } while ($p)
  }
  $want = @{ juz=30; hizb=60; rub=240; page=604 }
  foreach ($x in $k) { if ($starts[$x].Count -ne $want[$x]) { throw "$x count $($starts[$x].Count), expected $($want[$x])" } }
  if ($total -ne 6236) { throw "total verses $total, expected 6236" }
  $doc = [ordered]@{ source='Quran Foundation API v4 (verses/by_chapter: juz, hizb, rub_el_hizb, page)'; fetched=(Get-Date -Format 'yyyy-MM-dd');
                     juz=$starts.juz; hizb=$starts.hizb; rub=$starts.rub; page=$starts.page }
  [IO.File]::WriteAllText($tmp, ($doc | ConvertTo-Json -Compress -Depth 4), (New-Object Text.UTF8Encoding $false))
  Move-Item $tmp $out -Force
  Write-Host "PASS: 30 juz, 60 hizb, 240 rub, 604 pages, $total verses -> assets\data\index.json"
  Write-Host ("Check: juz2={0}:{1} | juz30={2}:{3} | page604={4}:{5}" -f $starts.juz[1][0],$starts.juz[1][1],$starts.juz[29][0],$starts.juz[29][1],$starts.page[603][0],$starts.page[603][1])
} catch {
  if (Test-Path $tmp) { Remove-Item $tmp -Force }
  Write-Host "FAIL: $($_.Exception.Message) (partial file deleted)"; exit 1
}
