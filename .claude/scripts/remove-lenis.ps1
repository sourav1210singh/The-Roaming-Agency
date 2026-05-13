# Remove all Lenis-related script tags from production HTML.
# Reverts the Phase 2 G3 changes entirely while leaving every other
# revision round 2 change in place.

$subPages = @(
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

# Sub-page pattern — the comment line + two script tags + any trailing newline.
$subPagePattern = '(?ms)\s*<!-- Lenis smooth-scroll \(revision round 2, G3\)\. -->\r?\n\s*<script src="https://cdn\.jsdelivr\.net/npm/lenis@1\.1\.13/dist/lenis\.min\.js" defer></script>\r?\n\s*<script src="\.\./js/lenis-scroll\.js" defer></script>'

foreach ($f in $subPages) {
  $full = Join-Path 'C:\Brotherockers' $f
  $c = Get-Content -LiteralPath $full -Raw -Encoding UTF8
  $c2 = [System.Text.RegularExpressions.Regex]::Replace($c, $subPagePattern, '')
  if ($c -ne $c2) {
    [System.IO.File]::WriteAllText($full, $c2, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "stripped lenis: $f"
  } else {
    Write-Host "no lenis found: $f"
  }
}

# index.html has a slightly different lead comment + a different relative path.
$indexFull = 'C:\Brotherockers\index.html'
$indexPattern = '(?ms)\s*<!-- Lenis smooth-scroll \(revision round 2, G3\)\. Loaded before our own\r?\n\s*lenis-scroll\.js so the global `Lenis` constructor is available\. -->\r?\n\s*<script src="https://cdn\.jsdelivr\.net/npm/lenis@1\.1\.13/dist/lenis\.min\.js" defer></script>\r?\n\s*<script src="src/js/lenis-scroll\.js" defer></script>'
$c = Get-Content -LiteralPath $indexFull -Raw -Encoding UTF8
$c2 = [System.Text.RegularExpressions.Regex]::Replace($c, $indexPattern, '')
if ($c -ne $c2) {
  [System.IO.File]::WriteAllText($indexFull, $c2, (New-Object System.Text.UTF8Encoding $false))
  Write-Host "stripped lenis: index.html"
} else {
  Write-Host "no lenis found: index.html"
}
