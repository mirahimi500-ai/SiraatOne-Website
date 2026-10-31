# Builds assets/data/sura/1..114.json from Quran Foundation API v4 (one-time; the site makes no runtime API calls).
# Arabic: Uthmani script. English: translation resource 20 (Saheeh International).
# Validates every sura's verse count against chapters.json and the 6236 total. On any failure, deletes partial output.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$dir  = Join-Path $root 'assets\data\sura'
$tmp  = Join-Path $root 'assets\data\sura.tmp'
$ch   = (Get-Content (Join-Path $root 'assets\data\chapters.json') -Raw -Encoding UTF8 | ConvertFrom-Json).chapters
$api  = 'https://api.quran.com/api/v4/quran'
$enc  = New-Object Text.UTF8Encoding $false
function Get-Json($u) { $r = Invoke-WebRequest $u -UseBasicParsing; [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json }  # force UTF-8 (PS 5.1)
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory $tmp | Out-Null
try {
  $total = 0; $trName = ''
  foreach ($c in $ch) {
    $n  = [int]$c.id
    if ($c.name_arabic -notmatch '[\u0600-\u06FF]') { throw "chapters.json Arabic is garbled - rerun fetch-chapters.ps1" }
    $ar = (Get-Json "$api/verses/uthmani?chapter_number=$n").verses
    $t  = Get-Json "$api/translations/20?chapter_number=$n"
    if (-not $trName) { $trName = "$($t.meta.translation_name) | $($t.meta.author_name)" }
    $en = $t.translations | % { (($_.text -replace '<sup[^>]*>.*?</sup>','') -replace '<[^>]+>','').Trim() }
    if ($ar.Count -ne $c.verses -or $en.Count -ne $c.verses) { throw "Sura ${n}: arabic=$($ar.Count) english=$($en.Count) expected=$($c.verses)" }
    if (($ar | ? { $_.text_uthmani -notmatch '[\u0600-\u06FF]' }).Count -or ($en | ? { -not $_ }).Count) { throw "Sura ${n}: empty verse text" }
    $doc = [ordered]@{ n=$n; ar=@($ar | % { $_.text_uthmani }); en=@($en) }
    [IO.File]::WriteAllText((Join-Path $tmp "$n.json"), ($doc | ConvertTo-Json -Compress -Depth 3), $enc)
    $total += $ar.Count
  }
  if ($total -ne 6236) { throw "total verses $total, expected 6236" }
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  Rename-Item $tmp 'sura'
  Write-Host "PASS: 114 suras, $total verses -> assets\data\sura"
  Write-Host "Translation: $trName"
  $s1 = Get-Content (Join-Path $dir '1.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  Write-Host "Check 1:1 en: $($s1.en[0])"
} catch {
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Write-Host "FAIL: $($_.Exception.Message) (partial files deleted)"; exit 1
}
