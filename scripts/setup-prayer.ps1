# Prayer Times page setup: 1) downloads the Adhan calculation library (MIT, Batoul Apps) v4.4.3 from jsDelivr and checks
# its SHA-256 against jsDelivr's published hash; 2) copies the Azan recordings from the SiraatOne Azan app.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
function Get-B64Sha($p) { $h = (Get-FileHash $p -Algorithm SHA256).Hash; $b = [byte[]]::new($h.Length / 2); for ($i = 0; $i -lt $b.Length; $i++) { $b[$i] = [Convert]::ToByte($h.Substring($i * 2, 2), 16) }; [Convert]::ToBase64String($b) }
try {
  $v = Join-Path $root 'assets\js\vendor'; New-Item -ItemType Directory $v -Force | Out-Null
  $files = @(@('lib/bundles/adhan.umd.min.js', 'adhan.umd.min.js', 'YWHAnV6z6XXATGvBNr7OISlz9esiXN3syfdOAbreVyw='), @('LICENSE', 'adhan.LICENSE.txt', 'YP8butzAk+DSJDZLbtGkOem4+PBaTdWcRckdNAtygTY='))
  foreach ($f in $files) {
    $out = Join-Path $v $f[1]
    Invoke-WebRequest "https://cdn.jsdelivr.net/npm/adhan@4.4.3/$($f[0])" -OutFile $out -UseBasicParsing
    if ((Get-B64Sha $out) -ne $f[2]) { Remove-Item $out -Force; throw "hash mismatch for $($f[1])" }
  }
  $src = 'C:\SiraatOne-Azan\assets\audio'; $dst = Join-Path $root 'assets\audio\azan'
  $map = @(@('Complete Azan', 'complete', '{0}.mp3'), @('Short Azan', 'short', '{0}.mp3'), @('Beep Beep Sound', 'beep', '{0}_beep_alarm.mp3'))
  $n = 0
  foreach ($m in $map) {
    $d = Join-Path $dst $m[1]; New-Item -ItemType Directory $d -Force | Out-Null
    foreach ($p in 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha') { Copy-Item (Join-Path $src (Join-Path $m[0] ($m[2] -f $p))) (Join-Path $d "$p.mp3") -Force; $n++ }
  }
  if ($n -ne 15) { throw "copied $n audio files, expected 15" }
  Write-Host "PASS: Adhan 4.4.3 (hash verified) + 15 Azan audio files"
} catch { Write-Host "FAIL: $($_.Exception.Message)"; exit 1 }
