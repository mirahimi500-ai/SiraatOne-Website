# LANG7: official Quran.com (Quran Foundation API v4) data for the 7 extra website languages (de, hi, ps, ru, so, sw, ta):
#  - surah name meanings (chapters?language=xx; the API answers in English when it has no translation)
#  - the 69 Quranic du'a verses used on the Duas & Adhkar page, from one published translation per language
# Writes small JSON files to scripts\out\ and a short report. Run:  powershell -ExecutionPolicy Bypass -File .\scripts\fetch-lang7.ps1
$ErrorActionPreference = 'Stop'
$out = Join-Path $PSScriptRoot 'out'; New-Item -ItemType Directory -Force $out | Out-Null
function Get-Json($u) { $b = (Invoke-WebRequest -UseBasicParsing -Uri $u -Headers @{ 'Accept' = 'application/json' }).RawContentStream.ToArray(); return ([Text.Encoding]::UTF8.GetString($b) | ConvertFrom-Json) }
function Save($obj, $name) { $j = $obj | ConvertTo-Json -Depth 6 -Compress; [IO.File]::WriteAllText((Join-Path $out $name), $j, (New-Object Text.UTF8Encoding $false)) }
$tr = [ordered]@{ de = 27; hi = 122; ps = 118; ru = 45; so = 46; sw = 231; ta = 229 }
$keys = @('2:128','2:201','2:250','2:255','3:8','3:16','3:38','3:53','3:147','3:173','3:191','3:193','3:194','7:23','7:126','10:85','10:86','12:101','14:35','14:38','14:40','14:41','17:24','17:80','18:10','20:25','20:26','20:27','20:28','21:87','23:94','23:118','25:65','25:74','26:83','26:84','26:85','27:15','27:19','28:24','28:70','34:1','40:7','40:8','40:9','43:13','43:14','46:15','59:10','59:22','59:23','59:24','60:4','60:5','112:1','112:2','112:3','112:4','113:1','113:2','113:3','113:4','113:5','114:1','114:2','114:3','114:4','114:5','114:6')
$chs = $keys | ForEach-Object { [int]($_ -split ':')[0] } | Sort-Object -Unique
$rep = @()
foreach ($l in $tr.Keys) {
  try {
    $c = Get-Json "https://api.quran.com/api/v4/chapters?language=$l"
    $names = @($c.chapters | ForEach-Object { [ordered]@{ id = $_.id; m = $_.translated_name.name; l = $_.translated_name.language_name } })
    Save $names "chapters-$l.json"
    $qv = [ordered]@{}; $meta = $null
    foreach ($ch in $chs) {
      $r = Get-Json "https://api.quran.com/api/v4/quran/translations/$($tr[$l])?chapter_number=$ch"
      $meta = $r.meta; $i = 0
      foreach ($t in $r.translations) { $i++; $k = "${ch}:$i"; if ($keys -contains $k) { $qv[$k] = (($t.text -replace '<sup[^>]*>.*?</sup>', '') -replace '<[^>]+>', '').Trim() } }
    }
    Save ([ordered]@{ id = $tr[$l]; name = $meta.translation_name; author = $meta.author_name; qv = $qv }) "qv-$l.json"
    $own = @($names | Where-Object { $_.l -and $_.l -ne 'english' }).Count
    $rep += "$l : names in own language $own/114, du'a verses $($qv.Count)/$($keys.Count), translation $($meta.translation_name)"
  } catch { $rep += "$l : FAIL $($_.Exception.Message)" }
}
[IO.File]::WriteAllLines((Join-Path $out 'report.txt'), $rep)
$rep
