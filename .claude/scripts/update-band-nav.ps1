# Sweep all 11 band sub-pages, replace the old flat .nav__band-list with
# the new dropdown nav structure. Active page detection: derived from the
# filename (e.g. the-brotherockers.html → "the-brotherockers").

$pagesDir = 'C:\Brotherockers\src\pages'
$bands = @(
    @{file='the-brotherockers.html';   title='The Brotherockers'},
    @{file='the-kingsmen.html';        title='The Kingsmen'},
    @{file='the-peppermints.html';     title='The Peppermints'},
    @{file='the-gentlemen.html';       title='The Gentlemen'},
    @{file='the-serenades.html';       title='The Serenades'},
    @{file='the-supersonics.html';     title='The Supersonics'},
    @{file='the-rendez-vous.html';     title='The Rendez-Vous'},
    @{file='cafe-creme.html';          title='Café Crème'},
    @{file='why-so-serious.html';      title='Why So Serious?'},
    @{file='the-blackjacks.html';      title='The Blackjacks'},
    @{file='dj.html';                  title='DJ'}
)

# Pattern matching the OLD .nav__band-list block — needs MULTILINE.
# We match from `<nav class="nav nav--visible" id="mainNav">` through `</nav>`.
$oldNavRegex = '(?s)<nav class="nav nav--visible" id="mainNav">.*?</nav>'

foreach ($b in $bands) {
    $path = Join-Path $pagesDir $b.file
    if (-not (Test-Path -LiteralPath $path)) { Write-Host "SKIP missing: $($b.file)"; continue }

    $isDjPage  = ($b.file -eq 'dj.html')
    $bandLinks = $bands | Where-Object { $_.file -ne 'dj.html' } | ForEach-Object {
        # Active band gets the active class; others get plain link
        if ($_.file -eq $b.file) {
            "              <li><a href=`"$($_.file)`" class=`"nav__dropdown-link--active`">$($_.title)</a></li>"
        } else {
            "              <li><a href=`"$($_.file)`">$($_.title)</a></li>"
        }
    }

    $djActiveAttr  = if ($isDjPage) { ' class="nav__link nav__link--active"' } else { ' class="nav__link"' }

    $newNav = @"
<nav class="nav nav--visible" id="mainNav" aria-label="Site navigation">
        <ul class="nav__list">
          <li class="nav__item nav__item--has-dropdown">
            <a href="../../index.html#events" class="nav__link">Events</a>
            <ul class="nav__dropdown" role="menu">
              <li><a href="../../index.html#events">Weddings</a></li>
              <li><a href="../../index.html#events">Corporate Events</a></li>
              <li><a href="../../index.html#events">Private Parties</a></li>
              <li><a href="../../index.html#events">Artistic Direction</a></li>
            </ul>
          </li>
          <li class="nav__item nav__item--has-dropdown">
            <a href="../../index.html#chooseBand" class="nav__link">Bands</a>
            <ul class="nav__dropdown" role="menu">
$($bandLinks -join "`r`n")
              <li class="nav__dropdown-divider" aria-hidden="true"></li>
              <li><a href="../../index.html#contact">Other Musical Services</a></li>
            </ul>
          </li>
          <li class="nav__item"><a href="dj.html"$djActiveAttr>DJ</a></li>
          <li class="nav__item"><a href="../../index.html#faq" class="nav__link">FAQ</a></li>
          <li class="nav__item"><a href="blog.html" class="nav__link">Blog</a></li>
          <li class="nav__item"><a href="../../index.html#contact" class="nav__link">Other Musical Services</a></li>
        </ul>
      </nav>
"@

    $content = Get-Content -LiteralPath $path -Raw
    if ($content -match $oldNavRegex) {
        $updated = [regex]::Replace($content, $oldNavRegex, $newNav, [System.Text.RegularExpressions.RegexOptions]::Singleline)
        Set-Content -LiteralPath $path -Value $updated -NoNewline -Encoding UTF8
        Write-Host "OK: $($b.file)"
    } else {
        Write-Host "SKIP no-match: $($b.file)"
    }
}
