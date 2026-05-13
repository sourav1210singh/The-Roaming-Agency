# Website Second Draft — Revisions (Round 2)

> Source: client Notion page "Website Second draft - Revisions"
> Date: latest revision round after the v2 implementation.
> Saved verbatim so we can work through every item without losing context.

---

## Client's intro

> Hi guys, overall, I think the site is looking really good. We should probably check if the fluidity and some of the interactions can be improved a bit so everything feels smoother.
> Leaving here a few notes, mostly design-related and some questions as well, just to see if they're feasible or not.

---

## 🔴 High-priority (red items in client doc)

| # | Item | Status |
|---|---|---|
| R1 | **Remove the door intro and the video.** Later we'll add the logo loading animation instead. | ⬜ |
| R2 | **Remove the custom cursor**, keep a normal one so it feels smoother. | ⬜ |
| R3 | **Brands section** — icons much smaller + grey background like mockup. Q: prefer 2 PNGs (one per row)? | ⬜ |
| R4 | Remove **"available worldwide"** from globe section, add it into the subtitle instead. | ⬜ |
| R5 | **Gallery** — remove the title, just photos on dark bg. Q: does zoom-on-hover make sense if not clickable? | ⬜ |
| R6 | **Remove the FAQ section** — will become a separate page. | ⬜ |

---

## 🎨 Global / palette / layout

| # | Item | Status |
|---|---|---|
| G1 | Change color `#1c1c1c` → `#393939` (in texts and backgrounds) | ⬜ |
| G2 | Left and right margins aligned across all sections so every text block / graphic starts at the same position | ⬜ |
| G3 | Scrolling feels like it moves in blocks — check smoothness reference (Lenis-style?) | ⬜ |

---

## 🧭 Navigation bar

| # | Item | Status |
|---|---|---|
| N1 | Remove transparency → use solid `#393939` background | ⬜ |
| N2 | Make nav text smaller AND closer to the right side of the screen | ⬜ |
| N3 | Active-item line: animate left → right (like reference). Otherwise drop the line and use bold text only | ⬜ |
| N4 | Replace gold with off-white | ⬜ |
| N5 | Bands dropdown: dropdown disappears too quickly when moving cursor over items — fix hover-out timing | ⬜ |
| N6 | Dropdown items: no background color change on hover — only font-weight + white color change | ⬜ |

---

## 🎬 Hero tagline ("Bespoke musical solutions for exclusive events worldwide")

| # | Item | Status |
|---|---|---|
| H1 | Tighter line spacing | ⬜ |
| H2 | Thinner typography (less bold) | ⬜ |

---

## 👥 Who We Are

| # | Item | Status |
|---|---|---|
| W1 | Thinner type for both the title AND the numbers | ⬜ |
| W2 | Spacing: title sits too far from the descriptive paragraph — match mockup | ⬜ |
| W3 | "Who we are" gold eyebrow: reduce letter-spacing + make thinner | ⬜ |
| W4 | "Years of experience" etc. labels: align better with the number + reduce spacing between number and label | ⬜ |

---

## 🏷 Brands

| # | Item | Status |
|---|---|---|
| B1 | Logo icons much SMALLER | ⬜ |
| B2 | Grey background block to visually separate this section (like mockup) | ⬜ |
| B3 | **Q to answer: should client send 2 PNGs (one per row, all brands inside)?** | ❓ |

---

## 📅 Events We Serve

| # | Item | Status |
|---|---|---|
| E1 | "EVENTS" closer to "WE SERVE" in heading | ⬜ |
| E2 | Photos NO rotation (currently tilted) | ⬜ |
| E3 | **Image transition should follow cursor movement** instead of auto-cycling | ⬜ |
| E4 | Curtain effect: top-to-bottom only, not center-outward | ⬜ |
| E5 | Title ("Weddings") closer to subtitle | ⬜ |
| E6 | Replace bold title with thinner style | ⬜ |

---

## 🎵 Choose Your Band

| # | Item | Status |
|---|---|---|
| C1 | Typography thinner | ⬜ |
| C2 | Check band-name SIZE against reference | ⬜ |
| C3 | Background photos must be BLACK AND WHITE | ⬜ |
| C4 | Reduce spacing between title and paragraph | ⬜ |
| C5 | Replicate the smoother movement from the previous reference file | ⬜ |
| C6 | Title stays FIXED regardless of scroll; paragraph always starts at the same position | ⬜ |

---

## 🌍 Performing Across Europe (Globe / Map)

| # | Item | Status |
|---|---|---|
| M1 | Remove "AVAILABLE WORLDWIDE" eyebrow, fold it into the subtitle text | ⬜ |
| M2 | Photos shouldn't rotate, location buttons shouldn't either (they're rotating currently?) | ⬜ |
| M3 | **Q: can the globe rotate smoothly via cursor hover only?** (no click/scroll required) | ❓ |

---

## ⭐ Our Standards

| # | Item | Status |
|---|---|---|
| S1 | "OUR" closer to "STANDARDS" | ⬜ |
| S2 | Vertical lines on each block should extend ALL THE WAY to the end of the subtitle (like mockup) | ⬜ |
| S3 | **Q: each block appear one by one on scroll?** | ❓ |
| S4 | Subtitle typography also thinner | ⬜ |

---

## 🖼 Gallery

| # | Item | Status |
|---|---|---|
| GL1 | Remove the title completely — just photos on a dark background | ⬜ |
| GL2 | **Q: does zoom-on-hover make sense if photos aren't clickable?** | ❓ |

---

## 📨 Contact / "Get in touch"

| # | Item | Status |
|---|---|---|
| CT1 | Remove gold accents from phone + email | ⬜ |
| CT2 | Send button much smaller | ⬜ |
| CT3 | "Let's create something…" infinite marquee — use LIGHTER font weight (currently too bold) | ⬜ |

---

## ❓ FAQ

| # | Item | Status |
|---|---|---|
| F1 | Remove from homepage — becomes a separate page later | ⬜ |

---

## Questions to answer back to the client (when implementation is done)

1. **Brands:** Do you prefer sending 2 PNGs (one per row, all brands inside) instead of individual logos? Our take: individual files are more flexible (easier to swap, no Photoshop needed for ordering), but if alignment is the issue we can solve via CSS. Will recommend after implementing.

2. **Events We Serve:** Cursor-following image transition — yes, feasible. We'll bind transition trigger to mouse-position-within-section instead of auto-cycle.

3. **Globe:** Hover-only rotation — yes, doable. We can wire `mousemove` over the canvas to drive the rotation angle proportional to cursor X position. Click + scroll fallbacks stay available.

4. **Standards:** Block-by-block reveal on scroll — already implemented via clip-reveal IntersectionObserver. Confirm if the current behaviour matches what was meant, or if they want a different per-block animation.

5. **Gallery:** Zoom-on-hover for non-clickable images — fair point, will remove. Hover state becomes a subtle brightness lift instead, signalling "viewable" without implying "clickable".

6. **General smoothness:** Scrolling feels block-y — likely due to the sticky-stack sections (door portal, Choose Your Band, Events) where the user is "pinned" while content swaps. Will add Lenis (smooth-scroll library) for the in-between scroll feel, which makes the transitions between sticky sections fluid.

---

## Implementation order (proposed)

Phase 1 — quick deletions / global fixes (lowest risk, highest visual impact):
1. R1 — Remove door intro + video
2. R6 — Remove FAQ from homepage
3. R2 — Remove custom cursor
4. R5 — Gallery: remove title, drop zoom-on-hover
5. G1 — Color swap `#1C1C1C → #393939` (variables.css)
6. G2 — Container padding alignment audit

Phase 2 — nav + global UX:
7. N1–N6 — Navigation bar restyle (solid bg, smaller text right-aligned, dropdown hover fix, off-white instead of gold, no bg change on hover)
8. G3 — Add Lenis smooth-scroll

Phase 3 — typography pass (thinner weights):
9. H1, H2 — Hero tagline
10. W1, W3, W4 — Who We Are weights + spacing
11. E5, E6 — Events title
12. C1 — Choose Your Band typography
13. S4 — Standards subtitle
14. CT3 — Contact marquee
15. M1 — Globe eyebrow into subtitle

Phase 4 — section-specific behaviour:
16. R3 — Brands smaller logos + grey bg
17. R4 — Globe eyebrow removal
18. E2, E3, E4 — Events photos (no rotation, cursor-follow transition, curtain top-to-bottom)
19. C3 — Choose Your Band photos to B&W
20. C5, C6 — Choose Your Band smoother motion + fixed title position
21. M2 — Globe location buttons no rotation
22. M3 — Globe hover-rotation
23. S1, S2, S3 — Standards header spacing + line extension + reveal animation

Phase 5 — contact polish:
24. CT1, CT2 — Contact gold removal + smaller send button

Phase 6 — final QA + answer client questions in a single message.
