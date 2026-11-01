# Downloads every Quran Foundation translation ONCE into assets/data/tr/<id>/<sura>.json and assets/data/translations.json.
# Checks each translation: verse order (verse_key), 114 suras, counts = chapters.json, 6236 total, no empty verse.
# A translation that fails a check is skipped and listed. On any run error all partial output is deleted.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$data = Join-Path $root 'assets\data'
$dir  = Join-Path $data 'tr'
$tmp  = Join-Path $data 'tr.tmp'
$rep  = Join-Path $env:USERPROFILE 'Desktop\tr-report.txt'
$ch   = (Get-Content (Join-Path $data 'chapters.json') -Raw -Encoding UTF8 | ConvertFrom-Json).chapters
$api  = 'https://api.quran.com/api/v4'
$enc  = New-Object Text.UTF8Encoding $false
function Get-Json($u) {
  for ($i = 1; $i -le 3; $i++) {
    try { $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 180; return [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json }
    catch { if ($i -eq 3) { throw }; Start-Sleep 5 }
  }
}
function Clean($t) { $t = ($t -replace '<sup[^>]*>.*?</sup>', '') -replace '<[^>]+>', ''; ([Net.WebUtility]::HtmlDecode($t) -replace '\s+', ' ').Trim() }
$keys = New-Object System.Collections.Generic.List[string]
foreach ($c in $ch) { for ($a = 1; $a -le [int]$c.verses; $a++) { $keys.Add("$($c.id):$a") } }
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory $tmp | Out-Null
try {
  $list = (Get-Json "$api/resources/translations").translations
  $ok = @(); $bad = @(); $n = 0
  foreach ($t in $list) {
    $n++; $id = [int]$t.id
    $info = "$id $($t.language_name) - $($t.name)"
    if ($id -eq 20) { $ok += [pscustomobject]@{ id = 20; name = $t.name; author = $t.author_name; lang = $t.language_name; dir = 'ltr' }; continue }
    try {
      $all = @((Get-Json "$api/quran/translations/${id}?fields=verse_key").translations)
      $seq = $all.Count -eq 6236
      if ($seq) { for ($i = 0; $i -lt 6236; $i++) { if ($all[$i].verse_key -ne $keys[$i]) { $seq = $false; break } } }
      if (-not $seq) {
        $all = @()
        foreach ($c in $ch) {
          $part = @((Get-Json "$api/quran/translations/${id}?chapter_number=$($c.id)").translations)
          if ($part.Count -ne [int]$c.verses) { throw "sura $($c.id): $($part.Count) of $($c.verses) verses" }
          $all += $part
        }
      }
      if ($all.Count -ne 6236) { throw "total $($all.Count), expected 6236" }
      $txt = @($all | ForEach-Object { Clean $_.text })
      $empty = @($txt | Where-Object { -not $_ }).Count
      if ($empty) { throw "$empty empty verses" }
      $sample = ($txt[0..6] -join '')
      $rtlCount = @($sample.ToCharArray() | Where-Object { [int]$_ -ge 0x0590 -and [int]$_ -le 0x08FF }).Count
      $d = Join-Path $tmp $id
      New-Item -ItemType Directory $d | Out-Null
      $p = 0
      foreach ($c in $ch) {
        $v = [int]$c.verses
        [IO.File]::WriteAllText((Join-Path $d "$($c.id).json"), (@{ t = @($txt[$p..($p + $v - 1)]) } | ConvertTo-Json -Compress -Depth 3), $enc)
        $p += $v
      }
      $ok += [pscustomobject]@{ id = $id; name = $t.name; author = $t.author_name; lang = $t.language_name; dir = $(if ($rtlCount -gt $sample.Length / 3) { 'rtl' } else { 'ltr' }) }
      Write-Host "[$n/$($list.Count)] OK   $info"
    } catch {
      $bad += "$info : $($_.Exception.Message)"; Write-Host "[$n/$($list.Count)] SKIP $info"
      $d = Join-Path $tmp $id; if (Test-Path $d) { Remove-Item $d -Recurse -Force }
    }
  }
  if ($ok.Count -lt 2) { throw "only $($ok.Count) translations passed" }
  $man = [ordered]@{ source = 'Quran Foundation API v4 (api.quran.com/api/v4/resources/translations)'; fetched = (Get-Date -Format 'yyyy-MM-dd'); translations = @($ok | Sort-Object lang, name) }
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  Rename-Item $tmp 'tr'
  [IO.File]::WriteAllText((Join-Path $data 'translations.json'), ($man | ConvertTo-Json -Depth 4), $enc)
  $langs = @($ok | ForEach-Object { $_.lang } | Sort-Object -Unique).Count
  $mb = [math]::Round(((Get-ChildItem $dir -Recurse -File | Measure-Object Length -Sum).Sum) / 1MB)
  $sum = "PASS: $($ok.Count) translations, $langs languages, $mb MB. Skipped: $($bad.Count)"
  @($sum) + $bad | Out-File $rep -Encoding utf8
  Write-Host $sum
  Write-Host "Report: $rep"
} catch {
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Write-Host "FAIL: $($_.Exception.Message)"; exit 1
}
