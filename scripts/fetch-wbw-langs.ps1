# Builds word-by-word meanings in other languages from Quran Foundation API v4 (same source as assets/data/wbw).
# 1) Probes each candidate language on 1:1-1:7 and keeps only languages that return their own (non-English) words.
# 2) Downloads glosses only: assets/data/wbw-<code>/<sura>.json = { n, t: [[gloss,...] per verse] }, word counts checked
#    against assets/data/wbw (same words, same order). 3) Writes assets/data/wbw-langs.json. Partial output deleted on failure.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$data = Join-Path $root 'assets\data'
$ch   = (Get-Content (Join-Path $data 'chapters.json') -Raw -Encoding UTF8 | ConvertFrom-Json).chapters
$enc  = New-Object Text.UTF8Encoding $false
function Get-Json($u) { for ($k = 0; $k -lt 4; $k++) { try { $r = Invoke-WebRequest $u -UseBasicParsing; return [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json } catch { Start-Sleep 2 } }; throw "download failed: $u" }
function Glosses($n, $lang) {
  $out = New-Object System.Collections.ArrayList; $p = 1
  do {
    $r = Get-Json "https://api.quran.com/api/v4/verses/by_chapter/${n}?words=true&word_fields=text_uthmani&language=$lang&per_page=50&page=$p"
    foreach ($v in $r.verses) { [void]$out.Add(@($v.words | ? { $_.char_type_name -eq 'word' } | % { [string]$_.translation.text })) }
    $p = $r.pagination.next_page
  } while ($p)
  return ,$out
}
$cand = [ordered]@{ ur='Urdu'; bn='Bengali'; id='Indonesian'; tr='Turkish'; fa='Persian'; hi='Hindi'; ta='Tamil'; ml='Malayalam'; ru='Russian'; de='German'; fr='French'; es='Spanish'; zh='Chinese'; ms='Malay'; ps='Pashto'; ku='Kurdish'; bs='Bosnian'; sq='Albanian'; uz='Uzbek'; az='Azerbaijani'; it='Italian'; ko='Korean'; th='Thai'; sw='Swahili'; ha='Hausa'; so='Somali' }
$en = (Glosses 1 'en') | % { $_ -join '|' }
$keep = @()
foreach ($c in $cand.Keys) {
  try { $g = (Glosses 1 $c) | % { $_ -join '|' } } catch { continue }
  $same = 0; for ($i = 0; $i -lt $en.Count; $i++) { if ($g[$i] -eq $en[$i]) { $same++ } }
  if ($same -lt 2 -and ($g -join '').Trim().Length -gt 10) { $keep += $c; Write-Host "  $c ($($cand[$c])): available" } else { Write-Host "  ${c}: not available (English fallback)" }
}
if (-not $keep.Count) { Write-Host 'FAIL: no extra word-by-word languages found'; exit 1 }
$done = @()
foreach ($c in $keep) {
  $dir = Join-Path $data "wbw-$c"; $tmp = "$dir.tmp"
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  New-Item -ItemType Directory $tmp | Out-Null
  try {
    foreach ($s in $ch) {
      $n = [int]$s.id; $t = Glosses $n $c
      $base = (Get-Content (Join-Path $data "wbw\$n.json") -Raw -Encoding UTF8 | ConvertFrom-Json).w
      if ($t.Count -ne $base.Count) { throw "sura ${n}: $($t.Count) verses, expected $($base.Count)" }
      for ($i = 0; $i -lt $t.Count; $i++) { if (@($t[$i]).Count -ne @($base[$i]).Count) { throw "${n}:$($i+1) word count differs" } }
      [IO.File]::WriteAllText((Join-Path $tmp "$n.json"), (ConvertTo-Json @{ n=$n; t=$t.ToArray() } -Compress -Depth 4), $enc)
    }
    if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
    Rename-Item $tmp "wbw-$c"; $done += $c; Write-Host "PASS: $c ($($cand[$c])) 114 suras"
  } catch { if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }; Write-Host "SKIP: $c - $($_.Exception.Message)" }
}
$list = @(@{ code='en'; name='English' }) + @($done | % { @{ code=$_; name=$cand[$_] } })
[IO.File]::WriteAllText((Join-Path $data 'wbw-langs.json'), (ConvertTo-Json $list -Compress), $enc)
$mb = [math]::Round(((Get-ChildItem $data -Directory -Filter 'wbw-*' | Get-ChildItem -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
Write-Host "PASS: word-by-word languages = English + $($done.Count) ($($done -join ', ')), $mb MB"
