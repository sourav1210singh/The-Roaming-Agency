# -*- coding: utf-8 -*-
# Optimize <title>/og:title/twitter:title by injecting a primary keyword.
# Descriptions + H1s are already keyword-rich, so they're left as-is.

bands = {
 'the-brotherockers':'The Brotherockers','the-kingsmen':'The Kingsmen','the-peppermints':'The Peppermints',
 'the-gentlemen':'The Gentlemen','the-serenades':'The Serenades','the-supersonics':'The Supersonics',
 'the-rendez-vous':'The Rendez-Vous','cafe-creme':'Café Crème','why-so-serious':'Why So Serious?',
 'the-blackjacks':'The Blackjacks',
}
jobs = []
for fn, name in bands.items():
    old = "%s - The Roaming Agency" % name
    new = "%s - Luxury Roaming Band | The Roaming Agency" % name
    jobs.append(('src/pages/%s.html' % fn, old, new))
jobs += [
 ('src/pages/blog.html', 'Blog - The Roaming Agency', 'Blog - Luxury Live Music Stories | The Roaming Agency'),
 ('src/pages/faq.html',  'FAQ - The Roaming Agency',  'FAQ - Booking a Luxury Roaming Band | The Roaming Agency'),
 ('src/pages/dj.html',   'DJ - The Roaming Agency',   'DJ - The Party Engineer | The Roaming Agency'),
]
for fn, old, new in jobs:
    s = open(fn, encoding='utf-8').read()
    n = s.count(old)
    if n == 0:
        print("!! NOT FOUND in %s -> %s" % (fn, old)); continue
    s = s.replace(old, new)
    open(fn, 'w', encoding='utf-8').write(s)
    print("%-34s %d occurrence(s) -> %s" % (fn.split('/')[-1], n, new))
