# -*- coding: utf-8 -*-
"""
FR build - step 1: EXTRACT every translatable string that has no data-fr.

For each page it collects:
  - text nodes whose element has NO data-en/data-fr pair (nav dropdown links,
    blog card titles/dates, article bodies, chips, figcaptions...)
  - alt="" attribute values
  - <title> + meta/og/twitter title & description values
  - JSON-LD text fields (description, headline, text, caption, Question name)

Strings that exactly match a known data-en value anywhere on the site are
auto-translated from that pair (site glossary) and NOT sent to the agents.

Output: scratchpad fr_work/<page>.json  {"auto": {en: fr}, "needs": [en, ...]}
        fr_work/_glossary.json (for agent prompts)
"""
import os, re, json, html
from html.parser import HTMLParser

ROOT = r"C:\Brotherockers"
OUT = os.path.join(os.environ.get("FR_WORK", r"C:\Brotherockers\.claude\fr_work"))
os.makedirs(OUT, exist_ok=True)

PAGES = ["index.html"] + [os.path.join("src", "pages", f) for f in sorted(os.listdir(os.path.join(ROOT, "src", "pages"))) if f.endswith(".html")]

SKIP_TAGS = {"script", "style", "svg", "noscript", "path", "iframe"}
# Never translate these exact strings (brands, band names, codes, UI atoms)
KEEP = {
    "The Roaming Agency", "The Brotherockers", "The Kingsmen", "The Peppermints",
    "The Gentlemen", "The Serenades", "The Supersonics", "The Rendez-Vous",
    "Café Crème", "Why So Serious?", "Why So Serious", "The Blackjacks",
    "DJ", "FAQ", "EN", "FR", "Johnny Molotov", "Alizée & Raffaella",
    "Instagram", "WhatsApp", "YouTube", "Google", "Vercel",
}

def is_translatable(s):
    t = s.strip()
    if len(t) < 2: return False
    if not re.search(r"[A-Za-z]{2}", t): return False
    if t in KEEP: return False
    if re.fullmatch(r"[\d\s\W]+", t): return False
    if t.startswith(("http", "www.", "+", "@")): return False
    return True

class Walker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # (tag, has_pair)
        self.texts = []          # text nodes needing translation
        self.pairs = {}          # data-en -> data-fr glossary from this page
        self.alts = []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        has_pair = "data-en" in d and "data-fr" in d
        if has_pair:
            self.pairs[d["data-en"]] = d["data-fr"]
        alt = d.get("alt")
        if alt and is_translatable(alt):
            self.alts.append(alt)
        if tag not in ("br", "img", "hr", "input", "meta", "link", "source"):
            self.stack.append((tag, has_pair))
    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break
    def handle_data(self, data):
        if any(t in SKIP_TAGS for t, _ in self.stack): return
        if any(p for _, p in self.stack[-1:]): return   # direct parent has the pair
        if is_translatable(data):
            self.texts.append(data.strip())

META_RE = [
    re.compile(r"<title>(.*?)</title>", re.S),
    re.compile(r'name="description"\s+content="(.*?)"', re.S),
    re.compile(r'property="og:title"\s+content="(.*?)"', re.S),
    re.compile(r'property="og:description"\s+content="(.*?)"', re.S),
    re.compile(r'name="twitter:title"\s+content="(.*?)"', re.S),
    re.compile(r'name="twitter:description"\s+content="(.*?)"', re.S),
]
JSON_KEYS = {"description", "headline", "caption", "text", "alternativeHeadline"}

def json_strings(obj, parent_type=None, out=None):
    if out is None: out = []
    if isinstance(obj, dict):
        t = obj.get("@type", parent_type)
        for k, v in obj.items():
            if isinstance(v, str) and (k in JSON_KEYS or (k == "name" and t == "Question")):
                if is_translatable(v): out.append(v)
            else:
                json_strings(v, t, out)
    elif isinstance(obj, list):
        for it in obj: json_strings(it, parent_type, out)
    return out

site_glossary = {}
page_data = {}
for rel in PAGES:
    src = open(os.path.join(ROOT, rel), "rb").read().decode("utf-8")
    w = Walker(); w.feed(src)
    site_glossary.update({html.unescape(k): html.unescape(v) for k, v in w.pairs.items()})
    metas = []
    for rx in META_RE:
        for m in rx.finditer(src):
            v = html.unescape(m.group(1)).strip()
            if is_translatable(v): metas.append(v)
    schemas = []
    for m in re.finditer(r'application/ld\+json[^>]*>\s*(\{.*?\})\s*</script>', src, re.S):
        try: schemas += json_strings(json.loads(m.group(1)))
        except Exception: pass
    page_data[rel] = {"texts": w.texts, "alts": w.alts, "metas": metas, "schemas": schemas}

json.dump(site_glossary, open(os.path.join(OUT, "_glossary.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

total_needs = 0
for rel, d in page_data.items():
    seen, needs, auto = set(), [], {}
    for s in d["texts"] + d["alts"] + d["metas"] + d["schemas"]:
        if s in seen: continue
        seen.add(s)
        if s in site_glossary:
            auto[s] = site_glossary[s]
        else:
            needs.append(s)
    name = "index" if rel == "index.html" else os.path.splitext(os.path.basename(rel))[0]
    json.dump({"page": rel, "auto": auto, "needs": needs},
              open(os.path.join(OUT, name + ".json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    total_needs += len(needs)
    print(f"{name}: auto={len(auto)} needs-translation={len(needs)}")

print(f"\nglossary={len(site_glossary)} pairs | total strings needing agents: {total_needs}")
