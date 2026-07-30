# -*- coding: utf-8 -*-
"""
8th revision point 2: rebuild every band page gallery from the client's
"3 Gallery" Drive photos, as selected/ordered by the per-band review agents
(picks in .claude/gallery_picks.json).
  - landscape -> 1400px wide, portrait -> 1400px tall, JPG q80
  - output: src/assets/images/band-galleries/<slug>/<slug>-NN.jpg
  - the gallery-slider block on the EN page (altEn) and FR page (altFr) is
    rebuilt as slides of up to 7 masonry items, buttons preserved.
"""
import os, re, json
from PIL import Image, ImageOps

ROOT = r"C:\Brotherockers"
OUT_BASE = os.path.join(ROOT, "src", "assets", "images", "band-galleries")
PICKS = json.load(open(os.path.join(ROOT, ".claude", "gallery_picks.json"), encoding="utf-8"))

PAGE = {
    "brotherockers": "the-brotherockers.html", "kingsmen": "the-kingsmen.html",
    "peppermints": "the-peppermints.html", "gentlemen": "the-gentlemen.html",
    "serenades": "the-serenades.html", "supersonics": "the-supersonics.html",
    "rendezvous": "the-rendez-vous.html", "whysoserious": "why-so-serious.html",
    "cafecreme": "cafe-creme.html", "blackjacks": "the-blackjacks.html",
}

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "'")

for band in PICKS:
    slug = band["band"]
    photos = band["photos"]  # no cap: the client explicitly added back photos beyond the original 14
    out_dir = os.path.join(OUT_BASE, slug)
    os.makedirs(out_dir, exist_ok=True)

    web_paths = []
    for i, ph in enumerate(photos, 1):
        im = Image.open(ph["path"])
        im = ImageOps.exif_transpose(im).convert("RGB")
        w, h = im.size
        if w >= h and w > 1400:
            im = im.resize((1400, round(h * 1400 / w)), Image.LANCZOS)
        elif h > w and h > 1400:
            im = im.resize((round(w * 1400 / h), 1400), Image.LANCZOS)
        name = f"{slug}-{i:02d}.jpg"
        im.save(os.path.join(out_dir, name), "JPEG", quality=80, optimize=True, progressive=True)
        # ph["style"] (optional): inline style for the <img> - used to keep a
        # marked person fully visible (object-position / zoom tweaks)
        web_paths.append((f"/src/assets/images/band-galleries/{slug}/{name}",
                          ph["altEn"], ph["altFr"], ph.get("style", ""), im.height > im.width))
    total_kb = sum(os.path.getsize(os.path.join(out_dir, f)) for f in os.listdir(out_dir)) / 1024
    print(f"{slug}: {len(web_paths)} photos, {total_kb:,.0f} KB total")

    # build slides html (7 per slide) for a given alt index (1=EN, 2=FR)
    def slides_html(alt_idx):
        chunks = [web_paths[i:i + 7] for i in range(0, len(web_paths), 7)]
        # a trailing slide of 1-2 photos looks lost: rebalance the last two
        # slides so every partial slide has 3-6 items (gallery--part-N CSS)
        if len(chunks) >= 2 and len(chunks[-1]) < 3:
            merged = chunks[-2] + chunks[-1]
            h = (len(merged) + 1) // 2
            chunks[-2:] = [merged[:h], merged[h:]]
        parts = []
        for ci, chunk in enumerate(chunks):
            active = " is-active" if ci == 0 else ""
            part = "" if len(chunk) == 7 else f" gallery--part-{len(chunk)}"
            # a 4-slide with 2+ portrait photos gets the tall-pair layout so
            # the portraits land in tall cells instead of being decapitated
            if len(chunk) == 4:
                ports = [x for x in chunk if x[4]]
                if len(ports) >= 2:
                    chunk = ports[:2] + [x for x in chunk if x is not ports[0] and x is not ports[1]]
                    part += " gallery--part-4--tall"
            items = "\n".join(
                f'            <div class="gallery__item"><img src="{p}" alt="{esc(a if alt_idx == 1 else b)}"'
                + (f' style="{st}"' if st else "") + ' loading="lazy"></div>'
                for p, a, b, st, _ in chunk
            )
            parts.append(f'        <div class="gallery-slide{active}">\n'
                         f'          <div class="gallery gallery--masonry{part}">\n{items}\n'
                         f'          </div>\n        </div>')
        return "\n" + "\n".join(parts) + "\n        "

    rx = re.compile(r'(<div class="gallery-slider" id="bandGallerySlider">)(.*?)(<button class="gallery-nav gallery-nav--prev")', re.S)
    for lang_dir, alt_idx in (("", 1), ("fr", 2)):
        p = os.path.join(ROOT, "src", "pages", lang_dir, PAGE[slug]) if lang_dir else os.path.join(ROOT, "src", "pages", PAGE[slug])
        s = open(p, "rb").read().decode("utf-8")
        html = slides_html(alt_idx)
        s2, n = rx.subn(lambda m: m.group(1) + html + m.group(3), s)
        if n != 1:
            print(f"!! {'fr/' if lang_dir else ''}{PAGE[slug]}: slider block match n={n}")
            continue
        open(p, "wb").write(s2.encode("utf-8"))
print("done")
