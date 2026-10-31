# Builds assets/data/chapters.json from the Quran Foundation API (one-time, no runtime calls from the site).
# Validates: 114 suras, 6236 verses total, ids 1..114 in order.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$out  = Join-Path $root 'assets\data\chapters.json'
$r = Invoke-RestMethod 'https://api.quran.com/api/v4/chapters?language=en'
$ch = $r.chapters | ForEach-Object {
  [pscustomobject]@{ id=[int]$_.id; name_simple=$_.name_simple; name_arabic=$_.name_arabic;
              meaning=$_.translated_name.name; verses=[int]$_.verses_count; place=$_.revelation_place }
}
$total = ($ch | Measure-Object -Property verses -Sum).Sum
$ok = ($ch.Count -eq 114) -and ($total -eq 6236) -and (-not (Compare-Object (1..114) ($ch | % { $_.id }) -SyncWindow 0))
if (-not $ok) { Write-Host "FAIL: count=$($ch.Count) verses=$total"; exit 1 }
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
$doc = [ordered]@{ source='Quran Foundation API v4 (api.quran.com/api/v4/chapters?language=en)';
                   fetched=(Get-Date -Format 'yyyy-MM-dd'); chapters=$ch }
[IO.File]::WriteAllText($out, ($doc | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding $false))
Write-Host "PASS: 114 suras, 6236 verses -> $out"
Write-Host ("Check: 1={0} | 2={1} | 114={2}" -f $ch[0].name_simple, $ch[1].name_simple, $ch[113].name_simple)

