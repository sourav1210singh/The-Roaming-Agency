# Client Brief — First Draft Revision (v2)

> Client video transcript + Notion brief shared on the new direction.
> **This document is the source of truth.** Refer back to it before
> implementing any section change. Sections will be tackled one-by-one,
> with the client supplying current-vs-target imagery per section.

---

## 1. Overall Direction

| From | To |
|------|----|
| Heavy gold + dark luxury | **Modern, minimal, fresh** |
| Glow effects, box frames, gold accent lines | Removed — clean typography-led design |
| Saxophone loading screen | **Remove for now** (re-add when new logo is finalised) |
| Many decorative dividers | Keep typography hierarchy doing the work |

The website should NOT feel like a wedding planner. Modern minimal feel.

---

## 2. Color Palette (lock these in)

| Role | Hex | Usage % |
|------|-----|---------|
| Off-white (lighter) | `#FCFCFC` | ~40% backgrounds |
| Off-white (darker)  | `#F0F0F0` | ~40% backgrounds |
| Dark grey (text, lines) | `#393939` | ~50% (main) |
| Dark grey (alt) | `#414141` | shared with above |
| Off-black (some bg sections like Our Standards) | `#1C1C1C` | accent dark |
| Gold (highlights ONLY) | `#F2DCA3` | ≤10% — small accents |

**Never use pure `#000` or `#FFF`.**

---

## 3. Typography — `Nohemi`

Multiple weights: thin / regular / medium / bold / black.
- **Titles:** Medium or Bold + Thin combinations (contrast play)
- **Subtitles:** Regular
- **Paragraphs:** Thin

Hierarchy is the visual element — typography over decoration.

---

## 4. New Section Order

1. **Logo loading (TBD)** + **Slogan** + **Video banner** (the hero)
2. **Navigation** — top-left, hides on scroll-down, returns on slight scroll-up
3. **Who We Are** — animated counters + scroll text-darkening
4. **Brands** — TWO opposite-direction marquee rows
5. **Events We Serve** — sticky frame, content + bg color swap (negative effect)
6. **Bands** — sticky band selector, gold-highlighted active
7. **Map (Available Worldwide)** — white bg, grey lines, smoother cursor
8. **Our Standards** — minimal, text appears from behind left vertical line
9. **Reviews** — gold accent allowed here (per mockup)
10. **Gallery** — modern dynamic motion
11. **Contact form** — TDB (consider overlay-on-video style)

---

## 5. Hero / Landing — Specific Behaviour

After loading screen:
1. Slogan text appears with smooth modern fade-in
2. As user scrolls, the slogan stays sticky
3. The video container scrolls up from below
4. Once video centers, both elements scroll together as user continues
5. (Behaviour like many modern editorial sites)

**Loading screen** — saxophone removed for now. Will get a new one once logo is finalised.

---

## 6. Navigation

- Logo top-left (TBD)
- Items: **Events** (dropdown), **Bands** (dropdown w/ "Other musical services"), **DJ**, **FAQ**, **Blog**, **Other musical services**
- **Hide on scroll-down, reappear on slight scroll-up** (do NOT keep fixed)
- Remove the underline + two circles indicator on the active page — just bold typography to indicate current
- Alternative idea: stay fixed but use **negative blend effect** like https://veilobscura.com.au/

---

## 7. WhatsApp Icon

- Switch to subtle version
- ❌ No green, ❌ no colour
- White icon ONLY
- Background: black at 20–30% opacity
- Stays fixed for easy access
- Hover → expands and shows **"Let's chat."**

---

## 8. Cursor

- Check delay/offset issue (real cursor vs custom may have offset)
- Make sure custom cursor centers exactly on the actual pointer

---

## 9. Section-Specific Notes

### Who We Are
- Reduce text length
- Counter animations (0% → 100% opacity, animated count-up) on `+60 / +100` style metrics
- Reference: https://elyse-residence-dev.webflow.io/
- Keep the scroll-based text-highlighting effect

### Brands
- Reduce logo size by **~20%**
- **Two rows**, moving in **opposite directions**
- No internal divider lines
- Hover → speed up (no full stop), reference: https://www.vastspace.com/
- Logos source: https://drive.google.com/drive/u/0/folders/1afOROqTpQr4VF5tbUCHpaacBLFiJuCjG
- Open question to client: prefer two long PNGs (one per row, all brands inside)?

### Events We Serve
- Reference behaviour: "wellness center amenities" on https://elyse-residence-dev.webflow.io/
- ❌ No "Venetian blinds" image transitions
- Simple cursor-following transitions
- Frame, title, subtitle stay in same position. Only **background colour, text, image change** (negative-style swap white↔black)
- Add a NEW category: **"Artistic direction"**
- Left vertical line + descriptive text fill in progressively as the user scrolls

### Choose Your Band
- Reference: https://www.weavy.ai/ ("Use all AI models…" section)
- Backgrounds: low-noise, **black & white photos** with reduced opacity over dark base
- ENTIRE block is **sticky during scroll**, easy to scroll
- Active band → gold + paired photo
- After last band, section unsticks (UX dev to confirm)
- Remove unnecessary lines / separators — let typography breathe

### Available Worldwide (Map / Globe)
- Map quality: keep high-resolution; sometimes loads low-res
- White background, grey lines (like mockup)
- Smoother cursor interaction
- Remove subtitle from city cards — only city/country
- ❌ No emojis, just a simple location icon
- Locations stay fixed/anchored to the globe (don't disappear)
- Images at 0° rotation default

### Our Standards
- **Remove all images** — not adding value
- Smooth scroll-based animation
- Each item appears one-by-one
- Text emerges from BEHIND the left vertical line, moving rightward
- Soft, modern feel

### Reviews
- Per mockup
- This is one place where **gold accent text** is OK
- "Who we are" reference style works here
- Single accent — no need for both title + subtitle in every section

### Gallery
- Per mockup
- Modern + dynamic motion

### Contact
- Heading: "Let's create something extraordinary"
- Could be **infinite-loop scrolling text**
- Reference: https://www.pieterkoopt.nl/how-it-works → final block coming OVER the video
- Form fields TDB

---

## 10. Reference Sites (general motion inspo)

| Site | Why |
|------|----|
| https://www.camronglobal.com/ | Typography, subtle underlines on hover |
| https://elyse-residence-dev.webflow.io/ | Counters, "amenities" scroll behaviour |
| https://veilobscura.com.au/ | Negative-effect logo nav |
| https://www.vastspace.com/ | Brands hover speed-up |
| https://www.weavy.ai/ | Sticky band selector |
| https://www.orakl-oncology.com/ | General motion language |
| https://www.cregg-paris.com/ | General motion language |
| https://www.pieterkoopt.nl/how-it-works | Contact overlay-on-video |

---

## 11. Mockup + Video

- **Canva visual guide:** https://www.canva.com/design/DAHBrpuQE-4/pI3F4G4ISbIVJh3FFWi10w/edit
- **Video walkthrough:** https://drive.google.com/file/d/1IHK5ZRpKHvOq-MR6nkEfXyiFLBoIBY61/view

The mockup is a VISUAL GUIDE only. Some animation in it is just for the
mockup's own dynamism — the live site should use **smooth, scroll-fluid,
modern animations** rather than mimicking the mockup motion literally.

---

## 12. Working Mode

The user (developer-side intermediary) will share **per-section
"current vs target" images** as we go. Each time:
1. Re-read this brief for the relevant section.
2. Confirm understanding with the user.
3. Implement.
4. Preview + iterate.

Do not change unrelated sections in the same pass. Keep diffs scoped.
