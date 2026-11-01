# Exports surah information from the SiraatOne Quran app's verified metadata (read-only) to assets/data/surah-info.json.
# Source: C:\SiraatOne-Quran\assets\quran\data\quran_full_114.json (the app's 114 Surah / 6236 Ayah gated file). Ayah text is not copied.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$src  = 'C:\SiraatOne-Quran\assets\quran\data\quran_full_114.json'
$out  = Join-Path $root 'assets\data\surah-info.json'
try {
  $j = [IO.File]::ReadAllText($src, [Text.Encoding]::UTF8) | ConvertFrom-Json
  $list = $null
  foreach ($p in $j.PSObject.Properties) { if ($p.Value -is [array] -and $p.Value.Count -eq 114 -and $p.Value[0].ayah_count) { $list = $p.Value } }
  if (-not $list) { throw 'surah list (114 items with ayah_count) not found' }
  $rows = @(); $sum = 0; $i = 0
  foreach ($s in $list) {
    $i++
    if ([int]$s.number -ne $i) { throw "order broken at $i" }
    $rows += [pscustomobject]@{ number = [int]$s.number; name_ar = $s.name_ar; name_en = $s.name_en; meaning_en = "$($s.meaning_en)"; revelation_type = "$($s.revelation_type)";
      revelation_order = [int]$s.revelation_order; ruku_count = [int]$s.ruku_count; ayah_count = [int]$s.ayah_count;
      page_start = [int]$s.page_start; page_end = [int]$s.page_end; juz_start = [int]$s.juz_start; juz_end = [int]$s.juz_end }
    $sum += [int]$s.ayah_count
  }
  if ($sum -ne 6236) { throw "total ayahs $sum, expected 6236" }
  $hash = (Get-FileHash $src -Algorithm SHA256).Hash.Substring(0, 12)
  $doc = [ordered]@{ source = "SiraatOne Quran app assets/quran/data/quran_full_114.json (sha256 $hash...), metadata only"; exported = (Get-Date -Format 'yyyy-MM-dd'); surahs = $rows }
  [IO.File]::WriteAllText($out, ($doc | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding $false))
  Write-Host ("PASS: 114 surahs, 6236 ayahs. Check 2: order={0} rukus={1} pages={2}-{3}" -f $rows[1].revelation_order, $rows[1].ruku_count, $rows[1].page_start, $rows[1].page_end)
} catch { if (Test-Path $out) { Remove-Item $out -Force }; Write-Host "FAIL: $($_.Exception.Message)"; exit 1 }
