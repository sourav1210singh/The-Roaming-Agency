$files = @(
  'src\pages\why-so-serious.html',
  'src\pages\the-supersonics.html',
  'src\pages\the-serenades.html',
  'src\pages\the-rendez-vous.html',
  'src\pages\the-peppermints.html',
  'src\pages\the-kingsmen.html',
  'src\pages\the-gentlemen.html',
  'src\pages\the-brotherockers.html',
  'src\pages\the-blackjacks.html',
  'src\pages\dj.html',
  'src\pages\cafe-creme.html',
  'src\pages\blog.html',
  'src\pages\faq.html'
)
# Match the existing smart-header.js line on sub-pages and append the
# Lenis CDN + our init right after it (so Lenis loads on every page).
$searchPattern = '([ \t]*)(<script src="\.\./js/smart-header\.js" defer></script>)'
$replacement = '$1$2' + "`r`n" + '$1<!-- Lenis smooth-scroll (revision round 2, G3). -->' + "`r`n" + '$1<script src="https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.42/bundled/lenis.min.js" defer></script>' + "`r`n" + '$1<script src="../js/lenis-scroll.js" defer></script>'

foreach ($f in $files) {
  $full = Join-Path 'C:\Brotherockers' $f
  $c = Get-Content -LiteralPath $full -Raw -Encoding UTF8
  # Skip if already injected
  if ($c -match 'lenis-scroll\.js') {
    Write-Host "already has lenis: $f"
    continue
  }
  $c2 = [System.Text.RegularExpressions.Regex]::Replace($c, $searchPattern, $replacement)
  if ($c -ne $c2) {
    [System.IO.File]::WriteAllText($full, $c2, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "updated: $f"
  } else {
    Write-Host "NO MATCH (smart-header line not found): $f"
  }
}
