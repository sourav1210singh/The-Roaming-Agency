$path = 'C:\Brotherockers\src\js\main.js'
$lines = [System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8)
# 0-indexed: delete 145..274 (file lines 146..275)
$before = $lines[0..144]
$after  = $lines[275..($lines.Length - 1)]
$replacement = @(
  '/* ──────────────────────────────────────────────'
  '   DOOR PORTAL — pre-hero cinematic intro (REMOVED)'
  '   Revision round 2, item 1.1 — client asked for the pre-hero door'
  '   intro to be removed entirely. The section, its CSS (~500 lines),'
  '   the hero-door-bg.jpg / door-reveal.mp4 assets, and this function'
  '   have all been deleted so the page starts directly on the hero stack.'
  '   ────────────────────────────────────────────── */'
  ''
)
$out = $before + $replacement + $after
[System.IO.File]::WriteAllLines($path, $out, (New-Object System.Text.UTF8Encoding $false))
Write-Host "wrote $($out.Length) lines"
