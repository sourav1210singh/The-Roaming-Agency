# -*- coding: utf-8 -*-
"""
Wire the new /bands + /fr/bands pages into the whole site:
  1. Header: the Bands parent link now navigates to the listing page
     (was /#chooseBand, which the dropdown JS often swallowed) and the
     dropdown gains an "All Bands" / "Tous les Groupes" first item.
  2. vercel.json: rewrites for /bands and /fr/bands.
  3. sitemap.xml: both URLs with hreflang alternates.
"""
import os, re, json

ROOT = r"C:\Brotherockers"
EN_LI = '<li><a href="/bands">All Bands</a></li>'
FR_LI = '<li><a href="/fr/bands">Tous les Groupes</a></li>'

def patch(path, old_href, new_href, label_rx, li_html):
    s = open(path, "rb").read().decode("utf-8")
    orig = s
    s = s.replace(f'<a href="{old_href}" class="nav__link"', f'<a href="{new_href}" class="nav__link"')
    # add the All-Bands item right under the Bands dropdown opening (skip if present)
    if li_html not in s:
        pat = re.compile(r'(class="nav__link"[^>]*>(?:' + label_rx + r')</a>\s*\n(\s*)<ul class="nav__dropdown" role="menu">\s*\n)')
        def ins(m):
            indent = m.group(2) + "  "
            return m.group(1) + indent + li_html + "\n"
        s, n = pat.subn(ins, s, count=1)
        if n != 1:
            print(f"!! {os.path.relpath(path, ROOT)}: dropdown insert n={n}")
    if s != orig:
        open(path, "wb").write(s.encode("utf-8"))
        return True
    return False

pages_dir = os.path.join(ROOT, "src", "pages")
fr_dir = os.path.join(pages_dir, "fr")
count = 0

# EN sub-pages
for f in os.listdir(pages_dir):
    if f.endswith(".html") and f != "bands.html":
        count += patch(os.path.join(pages_dir, f), "/#chooseBand", "/bands", "Bands", EN_LI)
# FR sub-pages
for f in os.listdir(fr_dir):
    if f.endswith(".html") and f not in ("bands.html", "index.html"):
        count += patch(os.path.join(fr_dir, f), "/fr#chooseBand", "/fr/bands", "Groupes", FR_LI)
# homepages (anchor href has no leading slash there)
count += patch(os.path.join(ROOT, "index.html"), "#chooseBand", "/bands", "Bands|Groupes", EN_LI)
count += patch(os.path.join(fr_dir, "index.html"), "#chooseBand", "/fr/bands", "Bands|Groupes", FR_LI)
print(f"nav patched on {count} pages")

# vercel.json rewrites
vj_path = os.path.join(ROOT, "vercel.json")
vj = json.load(open(vj_path, encoding="utf-8"))
have = {r["source"] for r in vj["rewrites"]}
add = [
    {"source": "/bands", "destination": "/src/pages/bands.html"},
    {"source": "/fr/bands", "destination": "/src/pages/fr/bands.html"},
]
vj["rewrites"] = [r for r in add if r["source"] not in have] + vj["rewrites"]
json.dump(vj, open(vj_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print("vercel.json rewrites:", len(vj["rewrites"]))

# sitemap.xml
sm_path = os.path.join(ROOT, "sitemap.xml")
s = open(sm_path, "rb").read().decode("utf-8")
if "theroamingagency.com/bands" not in s:
    D = "https://theroamingagency.com"
    alts = (f'    <xhtml:link rel="alternate" hreflang="en" href="{D}/bands"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="fr" href="{D}/fr/bands"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="x-default" href="{D}/bands"/>')
    lastmod = re.search(r"<lastmod>(.*?)</lastmod>", s).group(1)
    block = ""
    for u in (D + "/bands", D + "/fr/bands"):
        block += ("  <url>\n"
                  f"    <loc>{u}</loc>\n{alts}\n"
                  f"    <lastmod>{lastmod}</lastmod>\n"
                  f"    <priority>0.9</priority>\n"
                  "  </url>\n")
    s = s.replace("</urlset>", block + "</urlset>")
    open(sm_path, "wb").write(s.encode("utf-8"))
print("sitemap urls:", s.count("<loc>"))
