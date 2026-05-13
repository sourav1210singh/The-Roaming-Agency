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
  'src\pages\blog.html'
)
foreach ($f in $files) {
  $full = Join-Path 'C:\Brotherockers' $f
  $c = Get-Content -LiteralPath $full -Raw -Encoding UTF8
  $c2 = $c -replace '#1C1C1C', '#393939'
  if ($c -ne $c2) {
    [System.IO.File]::WriteAllText($full, $c2, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "updated: $f"
  } else {
    Write-Host "no change: $f"
  }
}
