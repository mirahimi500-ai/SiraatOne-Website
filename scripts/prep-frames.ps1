# Copies the app's sura header images (owned by the user) into the website, resized to max 1200px wide.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$src = 'C:\SiraatOne-Quran\assets\quran\data'
$dst = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets\img'
$map = @{ 'surah_header_v3_frame_only.png' = 'frame.png'; 'surah_header_v3_full.png' = 'frame-bism.png' }
foreach ($k in $map.Keys) {
  $in = Join-Path $src $k; $out = Join-Path $dst $map[$k]
  $img = [Drawing.Image]::FromFile($in)
  try {
    $w = [Math]::Min(1200, $img.Width); $h = [int]($img.Height * $w / $img.Width)
    $bmp = New-Object Drawing.Bitmap $w, $h, ([Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
    $g.DrawImage($img, 0, 0, $w, $h); $g.Dispose()
    $bmp.Save($out, [Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
    "{0}: original {1}x{2} -> {3}x{4}, {5:N0} KB" -f $map[$k], $img.Width, $img.Height, $w, $h, ((Get-Item $out).Length / 1KB)
  } finally { $img.Dispose() }
}
