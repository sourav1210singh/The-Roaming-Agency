# -*- coding: utf-8 -*-
"""
FR build - step 2: GENERATE src/pages/fr/*.html from the EN pages.

Per page:
  - <html lang="fr" data-lang="fr">
  - every element with a data-en/data-fr pair gets its French text baked in
  - agent/auto translations applied to: JSON-LD fields, alt="", <title>/meta,
    plain text nodes (longest string first, entity-aware)
  - canonical/og:url -> /fr/..., og:locale swapped, hreflang trio (en/fr/x-default)
  - internal links -> /fr/... ; language toggle button -> <a> to the EN page
Also patches the EN pages (toggle -> <a> to /fr, proper hreflang), vercel.json
rewrites and a bilingual sitemap.xml with xhtml:link alternates.
"""
import os, re, json, html, datetime

ROOT = r"C:\Brotherockers"
WORK = os.path.join(ROOT, ".claude", "fr_work")
TRANS = os.path.join(WORK, "translated")
FR_DIR = os.path.join(ROOT, "src", "pages", "fr")
os.makedirs(FR_DIR, exist_ok=True)
DOMAIN = "https://theroamingagency.com"

# EN route -> page file (mirrors vercel.json)
ROUTES = {
    "/": "index.html",
    "/the-brotherockers": "src/pages/the-brotherockers.html",
    "/the-kingsmen": "src/pages/the-kingsmen.html",
    "/the-peppermints": "src/pages/the-peppermints.html",
    "/the-gentlemen": "src/pages/the-gentlemen.html",
    "/the-serenades": "src/pages/the-serenades.html",
    "/the-supersonics": "src/pages/the-supersonics.html",
    "/the-rendez-vous": "src/pages/the-rendez-vous.html",
    "/cafe-creme": "src/pages/cafe-creme.html",
    "/why-so-serious": "src/pages/why-so-serious.html",
    "/the-blackjacks": "src/pages/the-blackjacks.html",
    "/blog": "src/pages/blog.html",
    "/dj": "src/pages/dj.html",
    "/faq": "src/pages/faq.html",
    "/more-music-acts": "src/pages/more-music-acts.html",
    "/the-violin-duet": "src/pages/the-violin-duet.html",
    "/the-saxophonist": "src/pages/the-saxophonist.html",
    "/the-jazz-band": "src/pages/the-jazz-band.html",
    "/weddings": "src/pages/weddings.html",
    "/corporate-events": "src/pages/corporate-events.html",
    "/private-parties": "src/pages/private-parties.html",
    "/artistic-direction": "src/pages/artistic-direction.html",
    "/blog/the-band-that-elevated-the-entire-evening": "src/pages/article-elevated-evening.html",
    "/blog/how-live-music-shapes-the-guest-experience": "src/pages/article-guest-experience.html",
    "/blog/why-everyone-is-looking-at-the-kingsmen": "src/pages/article-kingsmen.html",
    "/blog/why-the-right-sound-changes-everything": "src/pages/article-right-sound.html",
    "/blog/what-a-wedding-feels-like-when-music-is-done-right": "src/pages/article-wedding-music.html",
}
FILE2ROUTE = {v: k for k, v in ROUTES.items()}

def fr_route(en_route):
    return "/fr" if en_route == "/" else "/fr" + en_route

def esc_text(s):   # plain -> HTML text context
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def esc_attr(s):   # plain -> attribute context
    return esc_text(s).replace('"', "'")

def candidates(s):  # raw-source spellings of a plain string
    c = [s]
    if "&" in s:
        c.append(s.replace("&", "&amp;"))
    return c

# translated string maps per page-name
def load_map(name):
    m = {}
    p = os.path.join(WORK, name + ".json")
    d = json.load(open(p, encoding="utf-8"))
    m.update(d.get("auto", {}))
    tp = os.path.join(TRANS, name + ".json")
    if os.path.exists(tp):
        m.update(json.load(open(tp, encoding="utf-8")))
    # never let a mapping be empty / non-string
    return {k: v for k, v in m.items() if isinstance(v, str) and v.strip()}

def walk_json(obj, tmap, parent_type=None):
    KEYS = {"description", "headline", "caption", "text", "alternativeHeadline"}
    if isinstance(obj, dict):
        t = obj.get("@type", parent_type)
        for k, v in list(obj.items()):
            if isinstance(v, str):
                if (k in KEYS or (k == "name" and t == "Question")) and v in tmap:
                    obj[k] = tmap[v]
                elif k == "inLanguage":
                    obj[k] = "fr"
                elif v.startswith(DOMAIN):
                    path = v[len(DOMAIN):] or "/"
                    base = path.split("#")[0].rstrip("/") or "/"
                    if base in ROUTES:
                        obj[k] = DOMAIN + fr_route(base) + (("#" + path.split("#")[1]) if "#" in path else "")
            else:
                walk_json(v, tmap, t)
    elif isinstance(obj, list):
        for it in obj:
            walk_json(it, tmap, parent_type)

report = {"pages": 0, "warnings": []}

for en_route, rel in ROUTES.items():
    name = "index" if rel == "index.html" else os.path.splitext(os.path.basename(rel))[0]
    s = open(os.path.join(ROOT, rel), "rb").read().decode("utf-8")
    tmap = load_map(name)
    frr = fr_route(en_route)
    en_url = DOMAIN + ("/" if en_route == "/" else en_route)
    fr_url = DOMAIN + frr

    # 1. html tag
    s2, n = re.subn(r'<html lang="en" data-lang="en">', '<html lang="fr" data-lang="fr">', s)
    if n != 1: report["warnings"].append(f"{name}: html tag swap n={n}")
    s = s2

    # 2. JSON-LD: translate fields, swap urls/inLanguage
    def fix_schema(m):
        try:
            obj = json.loads(m.group(1))
        except Exception:
            return m.group(0)
        walk_json(obj, tmap)
        return m.group(0).replace(m.group(1), json.dumps(obj, ensure_ascii=False, indent=2))
    s = re.sub(r'application/ld\+json[^>]*>\s*(\{.*?\})\s*</script>',
               lambda m: fix_schema(m), s, flags=re.S)

    # 3. data-en/data-fr baked-in swap (both attribute orders)
    def bake(m):
        open_tag, fr_val, text = m.group(1), m.group(2), m.group(3)
        if not text.strip():
            return m.group(0)
        return open_tag + fr_val
    s = re.sub(r'(<[a-zA-Z][^>]*?data-en="[^"]*"[^>]*?data-fr="([^"]*)"[^>]*>)([^<]+)', bake, s)
    s = re.sub(r'(<[a-zA-Z][^>]*?data-fr="([^"]*)"[^>]*?data-en="[^"]*"[^>]*>)([^<]+)', bake, s)

    # 4. attribute + meta + title + text-node replacements (longest first)
    for en in sorted(tmap, key=len, reverse=True):
        fr = tmap[en]
        for raw in candidates(en):
            s = s.replace(f'<title>{raw}</title>', f'<title>{esc_text(fr)}</title>')
            s = s.replace(f'content="{raw}"', f'content="{esc_attr(fr)}"')
            s = s.replace(f'alt="{raw}"', f'alt="{esc_attr(fr)}"')
            s = s.replace(f'aria-label="{raw}"', f'aria-label="{esc_attr(fr)}"')
            # text node (exact chunk between tags, whitespace preserved around)
            s = re.sub(r'(>[\t ]*)' + re.escape(raw) + r'([\t ]*<)',
                       lambda m: m.group(1) + esc_text(fr) + m.group(2), s)

    # 5. head URLs: canonical + hreflang trio + og
    s = s.replace(f'rel="canonical" href="{en_url}"', f'rel="canonical" href="{fr_url}"')
    s = re.sub(r'<link rel="alternate" hreflang="en"[^>]*>\s*',
               f'<link rel="alternate" hreflang="en" href="{en_url}">\n  ', s)
    s = re.sub(r'<link rel="alternate" hreflang="fr"[^>]*>',
               f'<link rel="alternate" hreflang="fr" href="{fr_url}">\n  '
               f'<link rel="alternate" hreflang="x-default" href="{en_url}">', s)
    s = s.replace(f'property="og:url" content="{en_url}"', f'property="og:url" content="{fr_url}"')
    s = s.replace('og:locale" content="en_GB"', 'og:locale" content="fr_FR"')
    s = s.replace('og:locale:alternate" content="fr_FR"', 'og:locale:alternate" content="en_GB"')

    # 6. internal links -> /fr/...
    for r in sorted(ROUTES, key=len, reverse=True):
        if r == "/":
            continue
        s = s.replace(f'href="{r}"', f'href="/fr{r}"')
        s = s.replace(f'href="{r}#', f'href="/fr{r}#')
    s = s.replace('href="/"', 'href="/fr"')
    s = s.replace('href="/#', 'href="/fr#')

    # 7. language toggle -> link to the EN twin
    s2, n = re.subn(r'<button[^>]*class="lang-toggle"[^>]*>.*?</button>',
                    f'<a class="lang-toggle" href="{en_route}">EN</a>', s, flags=re.S)
    if n != 1: report["warnings"].append(f"{name}: FR toggle n={n}")
    s = s2

    open(os.path.join(FR_DIR, os.path.basename(rel) if rel != "index.html" else "index.html"),
         "wb").write(s.encode("utf-8"))
    report["pages"] += 1

# ---- patch EN pages: toggle -> link, hreflang fr -> /fr/..., add x-default ----
for en_route, rel in ROUTES.items():
    p = os.path.join(ROOT, rel)
    s = open(p, "rb").read().decode("utf-8")
    frr = fr_route(en_route)
    en_url = DOMAIN + ("/" if en_route == "/" else en_route)
    s2, n = re.subn(r'<button[^>]*class="lang-toggle"[^>]*>.*?</button>',
                    f'<a class="lang-toggle" href="{frr}">FR</a>', s, flags=re.S)
    if n != 1: report["warnings"].append(f"EN {rel}: toggle n={n}")
    s = s2
    s = re.sub(r'<link rel="alternate" hreflang="fr"[^>]*>',
               f'<link rel="alternate" hreflang="fr" href="{DOMAIN}{frr}">\n  '
               f'<link rel="alternate" hreflang="x-default" href="{en_url}">', s)
    open(p, "wb").write(s.encode("utf-8"))

# ---- vercel.json: FR rewrites ----
vj_path = os.path.join(ROOT, "vercel.json")
vj = json.load(open(vj_path, encoding="utf-8"))
have = {r["source"] for r in vj["rewrites"]}
new_rw = []
for en_route, rel in ROUTES.items():
    frr = fr_route(en_route)
    dest = "/src/pages/fr/" + (os.path.basename(rel) if rel != "index.html" else "index.html")
    if frr not in have:
        new_rw.append({"source": frr, "destination": dest})
vj["rewrites"] = new_rw + vj["rewrites"]
json.dump(vj, open(vj_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)

# ---- sitemap.xml: bilingual with hreflang alternates ----
today = datetime.date.today().isoformat()
PRIO = lambda r: "1.0" if r == "/" else ("0.7" if r.startswith("/blog/") else "0.8")
lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
         'xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for en_route in ROUTES:
    en_url = DOMAIN + ("/" if en_route == "/" else en_route)
    fr_url = DOMAIN + fr_route(en_route)
    alts = (f'    <xhtml:link rel="alternate" hreflang="en" href="{en_url}"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="fr" href="{fr_url}"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="x-default" href="{en_url}"/>')
    for u in (en_url, fr_url):
        lines += ["  <url>", f"    <loc>{u}</loc>", alts,
                  f"    <lastmod>{today}</lastmod>", f"    <priority>{PRIO(en_route)}</priority>", "  </url>"]
lines.append("</urlset>")
open(os.path.join(ROOT, "sitemap.xml"), "wb").write("\n".join(lines).encode("utf-8"))

print(json.dumps(report, indent=1))
print("FR pages:", report["pages"], "| sitemap urls:", 2 * len(ROUTES))
