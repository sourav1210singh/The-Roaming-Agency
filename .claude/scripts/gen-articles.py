# -*- coding: utf-8 -*-
"""Generate 5 article pages for The Roaming Agency blog (5th draft)."""
import io, os

PAGES_DIR = r'C:\Brotherockers\src\pages'

HEADER = '''  <!-- Header -->
  <header class="header header--scrolled" id="mainHeader">
    <div class="header__inner">
      <a href="../../index.html" class="logo logo--scrolled" id="mainLogo">
        <img class="logo__img" src="../assets/images/logo-roaming-agency.png" alt="The Roaming Agency" width="670" height="373">
      </a>
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
              <li><a href="the-brotherockers.html">The Brotherockers</a></li>
              <li><a href="the-kingsmen.html">The Kingsmen</a></li>
              <li><a href="the-peppermints.html">The Peppermints</a></li>
              <li><a href="the-gentlemen.html">The Gentlemen</a></li>
              <li><a href="the-serenades.html">The Serenades</a></li>
              <li><a href="the-supersonics.html">The Supersonics</a></li>
              <li><a href="the-rendez-vous.html">The Rendez-Vous</a></li>
              <li><a href="cafe-creme.html">Café Crème</a></li>
              <li><a href="why-so-serious.html">Why So Serious?</a></li>
              <li><a href="the-blackjacks.html">The Blackjacks</a></li>
              <li class="nav__dropdown-divider" aria-hidden="true"></li>
              <li><a href="../../index.html#contact">More Music Acts</a></li>
            </ul>
          </li>
          <li class="nav__item"><a href="dj.html"  class="nav__link">DJ</a></li>
          <li class="nav__item"><a href="faq.html"  class="nav__link">FAQ</a></li>
          <li class="nav__item"><a href="blog.html" class="nav__link nav__link--active">Blog</a></li>
          <li class="nav__item"><a href="../../index.html#contact" class="nav__link">More Music Acts</a></li>
        </ul>
      </nav>
      <button class="lang-toggle" id="langToggle">FR</button>
    </div>
  </header>'''

WHATSAPP = '''  <a href="https://wa.me/33686621282" target="_blank" rel="noopener" class="whatsapp-btn" aria-label="Contact us on WhatsApp">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    <span class="whatsapp-btn__label" data-en="Let\'s chat." data-fr="Discutons.">Let\'s chat.</span>
  </a>'''

# Article data: slug -> dict
ARTICLES = [
  {
    'slug': 'article-kingsmen',
    'title': 'Why Everyone Is Looking at The Kingsmen',
    'date': 'May 7, 2026',
    'subtitle': 'A quintet that turned a Riviera reception into something people are still talking about.',
    'tags': ['Weddings', 'Bands', 'Riviera'],
    'hero': 'gallery-04', 'mid': 'gallery-08',
    'lead': 'Last weekend, the South of France became the setting for a celebration that felt suspended somewhere between cinema and reality. Hidden among the hills outside Nice, an extraordinary villa opened its doors for a wedding that gathered artists, tastemakers, entrepreneurs and familiar faces from across Europe for a night defined by elegance, music and atmosphere.',
    'body1': 'As the sun dropped behind the villa and candlelight took over the gardens, one thing became immediately clear: The Kingsmen were not simply part of the evening. They became its centre. Moving effortlessly between timeless classics, unexpected reinterpretations and high-energy moments that carried guests onto the dance floor long before dinner had ended, the band transformed the celebration into something immersive and unforgettable.',
    'body2': 'What sets The Kingsmen apart is restraint. Five musicians, several of whom sing and play at once, plus a saxophone that seems to find every gap in the arrangement. There is no wall of sound, no fight for attention. Just a group reading the room and adjusting in real time, so the music always feels like a response to the moment rather than a setlist being worked through.',
    'quote': 'They never played at the room. They played with it, and you could feel the difference in every corner of the garden.',
    'body3': 'By the end of the night, conversations no longer centred around who attended, but around who played. The music, the setting, the energy: everything aligned. And as the Riviera summer fades, the people who were there will keep talking about the night The Kingsmen quietly made their own.',
  },
  {
    'slug': 'article-wedding-music',
    'title': 'What a Wedding Feels Like When Music Is Done Right',
    'date': 'May 2, 2026',
    'subtitle': 'The difference between a good evening and an unforgettable one is rarely the venue.',
    'tags': ['Weddings', 'Worldwide', 'Bands'],
    'hero': 'gallery-05', 'mid': 'gallery-17',
    'lead': 'Couples spend months choosing flowers, menus and lighting, and they are right to. But ask anyone what they actually remember about a wedding a year later, and the answer is almost always the same: the moment the room came alive. That moment is made of music.',
    'body1': 'Done right, a live band does something a playlist cannot. It reads the temperature of a room and answers it. A slow start over cocktails, a lift as the plates are cleared, a release the second the dance floor opens. The energy is shaped, not scheduled, and guests feel guided through the night without ever noticing the hand on the wheel.',
    'body2': 'There is also the matter of presence. Watching musicians who clearly love what they do gives guests permission to let go. A saxophone moving between tables, a singer catching someone\'s eye across the floor, a guitar solo that lands at exactly the right second. These are small things that add up to a feeling people struggle to describe afterwards, except to say it was perfect.',
    'quote': 'Nobody walks away remembering the third song of the night. They remember how the room felt, and music is what makes a room feel like anything at all.',
    'body3': 'When the music is done right, the evening stops being an event and becomes a memory. That is the whole point, and it is the part worth getting right.',
  },
  {
    'slug': 'article-guest-experience',
    'title': 'How Live Music Shapes the Guest Experience',
    'date': 'April 24, 2026',
    'subtitle': 'Atmosphere is not decoration. It is the thing your guests actually take home.',
    'tags': ['Events', 'Worldwide', 'Atmosphere'],
    'hero': 'gallery-12', 'mid': 'gallery-13',
    'lead': 'Every host wants their guests to have a good time, yet good intentions rarely translate into a good atmosphere on their own. The room has to be led somewhere. More often than not, the thing doing the leading is the music.',
    'body1': 'Live performance changes the physics of a space. People stand closer, talk louder, stay later. A roaming band that moves through the crowd dissolves the usual line between stage and audience, so the entertainment is not something guests watch from their seats but something they are inside of.',
    'body2': 'The best bands treat a guest list like an instrument. They notice when energy dips after dinner and lift it. They sense when a quieter moment is needed and give the room space to breathe. By the time the night peaks, guests feel like they helped build it, which is exactly why they remember it so fondly.',
    'quote': 'Guests do not remember a performance they watched. They remember a night they were part of.',
    'body3': 'Get the music right and everything else, the food, the venue, the speeches, lands better. The atmosphere becomes the through-line that holds the whole evening together.',
  },
  {
    'slug': 'article-right-sound',
    'title': 'Why the Right Sound Changes Everything',
    'date': 'April 15, 2026',
    'subtitle': 'The same band can transform a room or disappear into it. Usually it comes down to sound.',
    'tags': ['Sound', 'Weddings', 'Bands'],
    'hero': 'gallery-25', 'mid': 'gallery-21',
    'lead': 'Booking talented musicians is only half the decision. The other half, quieter and easier to overlook, is sound: how the music actually reaches the people in the room. Get it wrong and even the finest band fades into background noise. Get it right and the whole evening sharpens into focus.',
    'body1': 'Sound is deeply tied to setting. An open-air dinner under the stars asks for something different than a vaulted ballroom or an intimate terrace. The right approach respects the space rather than fighting it, so the music feels like it belongs to the room instead of being imposed on it.',
    'body2': 'There is craft in restraint. Knowing when to fill a space and when to leave it open, when a single voice carries further than a full arrangement. This is the difference between musicians who simply play loud and those who shape an atmosphere guests can feel without being able to name.',
    'quote': 'Volume fills a room. Sound shapes it. The two are not the same thing, and your guests will feel which one they got.',
    'body3': 'When the sound is right, nobody comments on it, and that is the point. They simply feel that everything worked, and they carry that feeling home.',
  },
  {
    'slug': 'article-elevated-evening',
    'title': 'The Band That Elevated the Entire Evening',
    'date': 'March 28, 2026',
    'subtitle': 'Some celebrations have a turning point. At this one, it arrived with the first note.',
    'tags': ['Weddings', 'Worldwide', 'Bands'],
    'hero': 'gallery-09', 'mid': 'gallery-11',
    'lead': 'It started, as these nights often do, with a room that was polite but reserved. Guests in beautiful clothes, drinks in hand, conversation flowing at a careful distance. And then the band began, and within twenty minutes the entire shape of the evening had changed.',
    'body1': 'What followed was less a performance than a slow, deliberate gathering of energy. The band did not rush the room. They let the early songs do their work over cocktails, then leaned in as dinner ended, until the dance floor filled almost on its own. By the time the night peaked, nobody was watching from the edges.',
    'body2': 'The detail people kept returning to afterwards was how natural it all felt. There was no obvious push, no forced singalong. Just a group of musicians reading the room and meeting it exactly where it was, then carrying it somewhere better. That is a rarer skill than it looks, and it is the reason the evening is still being talked about.',
    'quote': 'The room did not change because the band played louder. It changed because they finally let go, and so did everyone else.',
    'body3': 'Long after the last guests left, the hosts kept describing the same moment. Not the venue, not the menu, but the night the band quietly elevated everything around it.',
  },
]

def chips(tags):
    return ''.join('<span class="chip">%s</span>' % t for t in tags)

def related_cards(current_slug):
    others = [a for a in ARTICLES if a['slug'] != current_slug][:4]
    out = []
    for a in others:
        out.append(
          '          <a class="post-card reveal" href="%s.html">\n'
          '            <div class="post-card__media"><img src="../assets/images/gallery/%s.jpg" alt="%s" loading="lazy"></div>\n'
          '            <div class="post-card__tags">%s</div>\n'
          '            <h3 class="post-card__title">%s</h3>\n'
          '            <span class="post-card__date">%s</span>\n'
          '          </a>' % (a['slug'], a['hero'], a['title'], chips(a['tags']), a['title'], a['date']))
    return '\n'.join(out)

TEMPLATE = '''<!DOCTYPE html>
<html lang="en" data-lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{subtitle}">
  <title>{title} - The Roaming Agency</title>
  <link rel="canonical" href="https://theroamingagency.com/src/pages/{slug}.html">
  <meta property="og:title" content="{title} - The Roaming Agency">
  <meta property="og:description" content="{subtitle}">
  <meta property="og:type" content="article">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#2A2A2A">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\U0001F3B5</text></svg>">
  <link rel="stylesheet" href="../css/variables.css">
  <link rel="stylesheet" href="../css/reset.css">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/band-page.css">
  <link rel="stylesheet" href="../css/blog-page.css">
  <script src="../js/smart-header.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js" defer></script>
</head>
<body class="blog-body">
  <a href="#main-content" class="skip-link">Skip to content</a>
  <div class="page-loader" id="pageLoader"><div class="page-loader__spinner"></div></div>
{whatsapp}
{header}

  <main id="main-content" class="article">

    <!-- Split hero -->
    <section class="article-hero">
      <div class="article-hero__media reveal">
        <img src="../assets/images/gallery/{hero}.jpg" alt="{title}">
      </div>
      <div class="article-hero__head">
        <span class="article-hero__date">{date}</span>
        <h1 class="article-hero__title">{title}</h1>
        <p class="article-hero__sub">{subtitle}</p>
        <div class="article-hero__tags">{chips}</div>
      </div>
    </section>

    <!-- Body -->
    <article class="article-body">
      <p class="article-body__lead">{lead}</p>
      <p>{body1}</p>

      <figure class="article-figure reveal">
        <img src="../assets/images/gallery/{mid}.jpg" alt="The band performing" loading="lazy">
      </figure>

      <p>{body2}</p>

      <blockquote class="article-quote reveal">{quote}</blockquote>

      <p>{body3}</p>

      <p class="article-byline">Words by The Roaming Agency</p>
    </article>

    <!-- You might also like -->
    <section class="blog2-row article-related">
      <div class="blog2-row__inner">
        <h2 class="blog2-row__title" data-en="You might also like" data-fr="À lire aussi">You might also like</h2>
        <div class="blog2-grid">
{related}
        </div>
      </div>
    </section>

  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer__bottom" style="border: none; padding-top: 0;">
        <span>© 2026 The Roaming Agency. All rights reserved.</span>
        <span class="footer__credit">Designed by <a href="https://www.incrementors.com/" target="_blank" rel="noopener noreferrer">Incrementors</a></span>
        <a href="blog.html" class="footer__back">← Back to the journal</a>
      </div>
    </div>
  </footer>

  <script src="../js/blog-article.js" defer></script>
  <script src="../js/smooth-scroll.js" defer></script>
</body>
</html>
'''

for a in ARTICLES:
    html = TEMPLATE.format(
        slug=a['slug'], title=a['title'], date=a['date'], subtitle=a['subtitle'],
        chips=chips(a['tags']), hero=a['hero'], mid=a['mid'],
        lead=a['lead'], body1=a['body1'], body2=a['body2'], quote=a['quote'], body3=a['body3'],
        related=related_cards(a['slug']), header=HEADER, whatsapp=WHATSAPP)
    path = os.path.join(PAGES_DIR, a['slug'] + '.html')
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)
    print('wrote', a['slug'] + '.html')

print('done -', len(ARTICLES), 'articles')
