# Builds assets/data/wbw/1..114.json (word-by-word: Uthmani word + English gloss) from Quran Foundation API v4.
# Validates verse counts per sura, 6236 total, every verse has words with Arabic text. Partial output deleted on failure.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$dir  = Join-Path $root 'assets\data\wbw'; $tmp = "$dir.tmp"
$ch   = (Get-Content (Join-Path $root 'assets\data\chapters.json') -Raw -Encoding UTF8 | ConvertFrom-Json).chapters
$enc  = New-Object Text.UTF8Encoding $false
function Get-Json($u) { $r = Invoke-WebRequest $u -UseBasicParsing; [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json }
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory $tmp | Out-Null
try {
  $total = 0
  foreach ($c in $ch) {
    $n = [int]$c.id; $verses = New-Object System.Collections.ArrayList; $p = 1
    do {
      $r = Get-Json "https://api.quran.com/api/v4/verses/by_chapter/${n}?words=true&word_fields=text_uthmani&language=en&per_page=50&page=$p"
      foreach ($v in $r.verses) {
        $w = @($v.words | ? { $_.char_type_name -eq 'word' } | % { ,@($_.text_uthmani, $_.translation.text) })
        if (-not $w.Count -or ($w | ? { $_[0] -notmatch '[؀-ۿ]' })) { throw "${n}:$($v.verse_number) bad words" }
        [void]$verses.Add($w)
      }
      $p = $r.pagination.next_page
    } while ($p)
    if ($verses.Count -ne $c.verses) { throw "Sura ${n}: $($verses.Count) verses, expected $($c.verses)" }
    [IO.File]::WriteAllText((Join-Path $tmp "$n.json"), (ConvertTo-Json @{ n=$n; w=$verses.ToArray() } -Compress -Depth 5), $enc)
    $total += $verses.Count
  }
  if ($total -ne 6236) { throw "total $total, expected 6236" }
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  Rename-Item $tmp 'wbw'
  $s1 = Get-Content (Join-Path $dir '1.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  Write-Host "PASS: word-by-word 114 suras, $total verses -> assets\data\wbw"
  Write-Host ("Check 1:1 words: " + (($s1.w[0] | % { $_[1] }) -join ' | '))
} catch {
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Write-Host "FAIL: $($_.Exception.Message) (partial files deleted)"; exit 1
}
