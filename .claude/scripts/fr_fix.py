# -*- coding: utf-8 -*-
"""
FR build - step 3: fix everything the 27 verification agents flagged.
Systematic fixes across src/pages/fr/*.html (+ small EN-side injections):
  A. form placeholders -> French
  B. "Google Review -" -> "Avis Google -", "All rights reserved." -> FR
  C. re-run translation map with a NEWLINE-tolerant text-node regex
     (round 1 only matched same-line text; multiline nodes were skipped)
  D. index: drop the duplicate x-default hreflang
  E. articles EN+FR: inject missing hreflang trio + og:url + og:locale
  F. JSON-LD: breadcrumb "Home" -> "Accueil", translate names via the map
  G. cafe-creme MusicGroup url fix (was /bands/cafe-creme on both languages)
"""
import os, re, json, html

ROOT = r"C:\Brotherockers"
FR = os.path.join(ROOT, "src", "pages", "fr")
WORK = os.path.join(ROOT, ".claude", "fr_work")
TRANS = os.path.join(WORK, "translated")
DOMAIN = "https://theroamingagency.com"

ARTICLES = {
    "article-elevated-evening.html": "/blog/the-band-that-elevated-the-entire-evening",
    "article-guest-experience.html": "/blog/how-live-music-shapes-the-guest-experience",
    "article-kingsmen.html": "/blog/why-everyone-is-looking-at-the-kingsmen",
    "article-right-sound.html": "/blog/why-the-right-sound-changes-everything",
    "article-wedding-music.html": "/blog/what-a-wedding-feels-like-when-music-is-done-right",
}

PLACEHOLDERS = {
    "Full Name": "Nom complet",
    "Email address": "Adresse e-mail",
    "Event date": "Date de l'événement",
    "Location": "Lieu",
    "Phone": "Téléphone",
    "Number of guests": "Nombre d'invités",
    "Tell us what are you planning...": "Parlez-nous de votre projet...",
}

def esc_text(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def load_map(name):
    m = {}
    p = os.path.join(WORK, name + ".json")
    if os.path.exists(p):
        d = json.load(open(p, encoding="utf-8"))
        m.update(d.get("auto", {}))
    tp = os.path.join(TRANS, name + ".json")
    if os.path.exists(tp):
        m.update(json.load(open(tp, encoding="utf-8")))
    return {k: v for k, v in m.items() if isinstance(v, str) and v.strip() and k != v}

def candidates(s):
    c = [s]
    if "&" in s:
        c.append(s.replace("&", "&amp;"))
    return c

fixed = {}
for fname in sorted(os.listdir(FR)):
    if not fname.endswith(".html"):
        continue
    p = os.path.join(FR, fname)
    s = open(p, "rb").read().decode("utf-8")
    orig = s
    name = "index" if fname == "index.html" else os.path.splitext(fname)[0]
    tmap = load_map(name)
    notes = []

    # A. placeholders
    for en, fr in PLACEHOLDERS.items():
        s = s.replace(f'placeholder="{en}"', f'placeholder="{fr}"')

    # B. fixed labels
    n = s.count("Google Review - ")
    if n:
        s = s.replace("Google Review - ", "Avis Google - ")
        notes.append(f"gmb x{n}")
    s = s.replace("All rights reserved.", "Tous droits réservés.")

    # C. newline-tolerant re-apply of the translation map (text nodes only)
    applied = 0
    for en in sorted(tmap, key=len, reverse=True):
        fr = tmap[en]
        for raw in candidates(en):
            pat = re.compile(r'(>\s*)' + re.escape(raw) + r'(\s*<)')
            s, k = pat.subn(lambda m: m.group(1) + esc_text(fr) + m.group(2), s)
            applied += k
    if applied:
        notes.append(f"text x{applied}")

    # D. duplicate x-default (keep the first)
    xd = re.findall(r'<link rel="alternate" hreflang="x-default"[^>]*>\s*\n?', s)
    if len(xd) > 1:
        first = s.find(xd[0])
        rest = s[first + len(xd[0]):].replace(xd[0], "", len(xd) - 1)
        for extra in set(xd[1:]):
            rest = rest.replace(extra, "")
        s = s[:first + len(xd[0])] + rest
        notes.append("x-default dedupe")

    # E. FR articles: inject hreflang trio + og:url + og:locale after canonical
    if fname in ARTICLES:
        en_route = ARTICLES[fname]
        en_url, fr_url = DOMAIN + en_route, DOMAIN + "/fr" + en_route
        if 'hreflang="fr"' not in s:
            s = s.replace(
                f'<link rel="canonical" href="{fr_url}">',
                f'<link rel="canonical" href="{fr_url}">\n'
                f'  <link rel="alternate" hreflang="en" href="{en_url}">\n'
                f'  <link rel="alternate" hreflang="fr" href="{fr_url}">\n'
                f'  <link rel="alternate" hreflang="x-default" href="{en_url}">')
            notes.append("hreflang injected")
        if 'property="og:url"' not in s:
            s = s.replace('<meta property="og:type"',
                          f'<meta property="og:url" content="{fr_url}">\n  <meta property="og:type"', 1)
        if 'property="og:locale"' not in s:
            s = s.replace('<meta name="twitter:card"',
                          '<meta property="og:locale" content="fr_FR">\n  <meta name="twitter:card"', 1)

    # F. JSON-LD: breadcrumbs/home + name translation via map
    def fix_ld(m):
        try:
            obj = json.loads(m.group(1))
        except Exception:
            return m.group(0)
        def walk(o):
            if isinstance(o, dict):
                for k, v in list(o.items()):
                    if isinstance(v, str):
                        if k == "name" and v == "Home":
                            o[k] = "Accueil"
                        elif k in ("name", "headline") and v in tmap:
                            o[k] = tmap[v]
                    else:
                        walk(v)
            elif isinstance(o, list):
                for it in o:
                    walk(it)
        walk(obj)
        return m.group(0).replace(m.group(1), json.dumps(obj, ensure_ascii=False, indent=2))
    s = re.sub(r'application/ld\+json[^>]*>\s*(\{.*?\})\s*</script>', fix_ld, s, flags=re.S)

    # G. cafe-creme wrong MusicGroup url
    s = s.replace(f'"{DOMAIN}/bands/cafe-creme"', f'"{DOMAIN}/fr/cafe-creme"')

    if s != orig:
        open(p, "wb").write(s.encode("utf-8"))
        fixed[fname] = notes or ["minor"]

# EN articles: inject the same missing head tags; EN cafe-creme url fix
for fname, en_route in ARTICLES.items():
    p = os.path.join(ROOT, "src", "pages", fname)
    s = open(p, "rb").read().decode("utf-8")
    orig = s
    en_url, fr_url = DOMAIN + en_route, DOMAIN + "/fr" + en_route
    if 'hreflang="en"' not in s:
        s = s.replace(
            f'<link rel="canonical" href="{en_url}">',
            f'<link rel="canonical" href="{en_url}">\n'
            f'  <link rel="alternate" hreflang="en" href="{en_url}">\n'
            f'  <link rel="alternate" hreflang="fr" href="{fr_url}">\n'
            f'  <link rel="alternate" hreflang="x-default" href="{en_url}">')
    if 'property="og:url"' not in s:
        s = s.replace('<meta property="og:type"',
                      f'<meta property="og:url" content="{en_url}">\n  <meta property="og:type"', 1)
    if 'property="og:locale"' not in s:
        s = s.replace('<meta name="twitter:card"',
                      '<meta property="og:locale" content="en_GB">\n  <meta name="twitter:card"', 1)
    if s != orig:
        open(p, "wb").write(s.encode("utf-8"))
        fixed["EN:" + fname] = ["head tags injected"]

pen = os.path.join(ROOT, "src", "pages", "cafe-creme.html")
s = open(pen, "rb").read().decode("utf-8")
if f'"{DOMAIN}/bands/cafe-creme"' in s:
    open(pen, "wb").write(s.replace(f'"{DOMAIN}/bands/cafe-creme"', f'"{DOMAIN}/cafe-creme"').encode("utf-8"))
    fixed["EN:cafe-creme.html"] = ["MusicGroup url fixed"]

for k, v in fixed.items():
    print(f"{k}: {', '.join(v)}")
print(f"\n{len(fixed)} files fixed")
