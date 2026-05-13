$path = 'C:\Brotherockers\src\css\style.css'
$lines = [System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8)
# 0-indexed: delete 614..1315 (file lines 615..1316)
$before = $lines[0..613]
$after  = $lines[1316..($lines.Length - 1)]
$replacement = @(
  '/* ============================================================================'
  '   DOOR PORTAL CSS REMOVED (revision round 2, item 1.1)'
  '   ~700 lines of .door-portal* rules dropped per client direction.'
  '   The HTML section, the initDoorPortal() function, and the assets'
  '   (hero-door-bg.jpg, door-reveal.mp4) have all been removed.'
  '   ============================================================================ */'
  ''
)
$out = $before + $replacement + $after
[System.IO.File]::WriteAllLines($path, $out, (New-Object System.Text.UTF8Encoding $false))
Write-Host "wrote $($out.Length) lines"
