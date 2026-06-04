import glob, os

# filename (no .html) -> clean URL
slug = {
 'the-brotherockers':'/the-brotherockers','the-kingsmen':'/the-kingsmen','the-peppermints':'/the-peppermints',
 'the-gentlemen':'/the-gentlemen','the-serenades':'/the-serenades','the-supersonics':'/the-supersonics',
 'the-rendez-vous':'/the-rendez-vous','cafe-creme':'/cafe-creme','why-so-serious':'/why-so-serious',
 'the-blackjacks':'/the-blackjacks','blog':'/blog','dj':'/dj','faq':'/faq',
 'article-elevated-evening':'/blog/the-band-that-elevated-the-entire-evening',
 'article-guest-experience':'/blog/how-live-music-shapes-the-guest-experience',
 'article-kingsmen':'/blog/why-everyone-is-looking-at-the-kingsmen',
 'article-right-sound':'/blog/why-the-right-sound-changes-everything',
 'article-wedding-music':'/blog/what-a-wedding-feels-like-when-music-is-done-right',
}

# ---- /src/pages/*.html ----
for fn in glob.glob('src/pages/*.html'):
    name = os.path.basename(fn)[:-5]
    if name == 'scroll-test':
        continue
    s = open(fn, encoding='utf-8').read()
    o = s
    s = s.replace('"../css/', '"/src/css/').replace('"../js/', '"/src/js/').replace('"../assets/', '"/src/assets/')
    s = s.replace('"../../index.html#', '"/#').replace('"../../index.html"', '"/"')
    for n, c in slug.items():
        s = s.replace('/src/pages/%s.html' % n, c)
    for n, c in slug.items():
        s = s.replace('"%s.html"' % n, '"%s"' % c).replace('"%s.html#' % n, '"%s#' % c).replace('"%s.html?' % n, '"%s?' % c)
    open(fn, 'w', encoding='utf-8').write(s)
    print("%-32s %s" % (name, 'changed' if s != o else 'nochange'))

# ---- index.html ----
s = open('index.html', encoding='utf-8').read()
s = s.replace('"src/css/', '"/src/css/').replace('"src/js/', '"/src/js/').replace('"src/assets/', '"/src/assets/')
for n, c in slug.items():
    s = s.replace('"src/pages/%s.html"' % n, '"%s"' % c)
open('index.html', 'w', encoding='utf-8').write(s)
print("index.html                       done")
