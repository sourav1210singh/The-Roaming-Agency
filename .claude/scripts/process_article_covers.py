# -*- coding: utf-8 -*-
"""
8th revision point 5: swap the 880x600 placeholder covers (root cause of the
"bad quality") for the client's real photos.
  - 3 articles had dedicated folders (cover + body shots)
  - 2 covers were selected from Extra Photos by the review agents
Covers -> 1800px wide. Body figures -> portrait-cropped 4:5, 1200px wide.
Outputs in src/assets/images/articles/, then the EN + FR article pages are
patched (old gallery-XX paths are unique per file, so whole-file replace is
safe and also catches og:image / schema copies).
"""
import os, re
from PIL import Image, ImageOps

ROOT = r"C:\Brotherockers"
BLOG = os.path.join(ROOT, "src", "Web Site Assets", "Blog")
OUT = os.path.join(ROOT, "src", "assets", "images", "articles")
os.makedirs(OUT, exist_ok=True)

def prep(src, out_name, width, crop_ratio=None, quality=82):
    im = Image.open(src)
    im = ImageOps.exif_transpose(im).convert("RGB")
    if crop_ratio:  # crop to width:height ratio around the upper-middle
        w, h = im.size
        target_h = w / crop_ratio
        if h > target_h:
            top = int((h - target_h) * 0.35)
            im = im.crop((0, top, w, int(top + target_h)))
        else:
            target_w = h * crop_ratio
            left = int((w - target_w) / 2)
            im = im.crop((left, 0, int(left + target_w), h))
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, out_name)
    im.save(p, "JPEG", quality=quality, optimize=True, progressive=True)
    print(f"{out_name}: {im.size[0]}x{im.size[1]}  {os.path.getsize(p)/1024:,.0f} KB")

CA = os.path.join(BLOG, "Current articles")
EX = os.path.join(BLOG, "Extra Photos")

# ---- process ----
prep(os.path.join(EX, "E&M-571 (1).jpg"), "elevated-evening-cover.jpg", 1800)
prep(os.path.join(CA, "How Live Music Shapes the Guest Experience", "1 Cover.JPG"), "guest-experience-cover.jpg", 1440)
prep(os.path.join(CA, "How Live Music Shapes the Guest Experience", "2.jpg"), "guest-experience-fig1.jpg", 1200, crop_ratio=0.8)
prep(os.path.join(CA, "How Live Music Shapes the Guest Experience", "3.jpg"), "guest-experience-fig2.jpg", 1200, crop_ratio=0.8)
prep(os.path.join(CA, "Why Everyone Is Looking at The Kingsmen", "1 Cover.jpg"), "kingsmen-cover.jpg", 1800)
prep(os.path.join(CA, "Why Everyone Is Looking at The Kingsmen", "2.jpg"), "kingsmen-fig1.jpg", 1200, crop_ratio=0.8)
prep(os.path.join(CA, "Why Everyone Is Looking at The Kingsmen", "3.JPG"), "kingsmen-fig2.jpg", 1200, crop_ratio=0.8)
prep(os.path.join(CA, "Why the Right Sound Changes Everything", "AURELIE_NICOLAS-707-2.jpg"), "right-sound-cover.jpg", 1800)
prep(os.path.join(EX, "Weddings and brides", "ruby-aj-dinner-party (480).jpg"), "wedding-music-cover.jpg", 1800)

# ---- patch pages (EN + FR share identical image paths) ----
A = "/src/assets/images/articles/"
G = "/src/assets/images/gallery/"
PATCH = {
    "article-elevated-evening.html": {
        G + "gallery-09.jpg": A + "elevated-evening-cover.jpg",
    },
    "article-guest-experience.html": {
        G + "gallery-12.jpg": A + "guest-experience-cover.jpg",
        G + "gallery-08.jpg": A + "guest-experience-fig1.jpg",
        G + "gallery-14.jpg": A + "guest-experience-fig2.jpg",
    },
    "article-kingsmen.html": {
        G + "gallery-04.jpg": A + "kingsmen-cover.jpg",
        G + "gallery-06.jpg": A + "kingsmen-fig1.jpg",
        G + "gallery-10.jpg": A + "kingsmen-fig2.jpg",
    },
    "article-right-sound.html": {
        G + "gallery-25.jpg": A + "right-sound-cover.jpg",
    },
    "article-wedding-music.html": {
        G + "gallery-05.jpg": A + "wedding-music-cover.jpg",
    },
}
# agent-written alts for the two newly selected covers
ALTS = {
    "elevated-evening-cover.jpg": (
        "A live band in pale blue suits plays between the tables at an evening party while a laughing guest sings along under white parasols.",
        "Un groupe en costumes bleu clair joue entre les tables lors d'une soirée, tandis qu'une invitée rit et chante avec eux sous les parasols blancs."),
    "wedding-music-cover.jpg": (
        "Bride and groom laughing and dancing at night at a chateau wedding reception, bathed in warm golden light",
        "Les mariés rient et dansent en soirée lors d'une réception de mariage au château, baignés d'une lumière dorée chaleureuse"),
}

for fname, repl in PATCH.items():
    for lang_dir, alt_i in (("", 0), ("fr", 1)):
        p = os.path.join(ROOT, "src", "pages", lang_dir, fname) if lang_dir else os.path.join(ROOT, "src", "pages", fname)
        s = open(p, "rb").read().decode("utf-8")
        n = 0
        for old, new in repl.items():
            n += s.count(old)
            s = s.replace(old, new)
            base = os.path.basename(new)
            if base in ALTS:
                s = re.sub(r'(<img src="' + re.escape(new) + r'" alt=")[^"]*(")',
                           lambda m: m.group(1) + ALTS[base][alt_i] + m.group(2), s)
        open(p, "wb").write(s.encode("utf-8"))
        print(f"{'fr/' if lang_dir else ''}{fname}: {n} path swaps")
print("done")
