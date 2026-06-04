# SEO & URL Conventions (read before adding any new page)

The site uses **clean, extensionless URLs** (no `/src/pages/`, no `.html`).
The HTML files still live in `/src/pages/`; Vercel maps the clean URL to the
file via `vercel.json`.

## Current URL map
| Clean URL | File |
|---|---|
| `/` | `index.html` |
| `/the-brotherockers` … `/the-blackjacks` | `src/pages/<band>.html` (10 bands) |
| `/blog` | `src/pages/blog.html` |
| `/dj`, `/faq` | `src/pages/dj.html`, `src/pages/faq.html` |
| `/blog/<descriptive-slug>` | `src/pages/article-*.html` (articles nested under /blog/) |

## Adding a NEW page — checklist
1. **Create the file** in `src/pages/your-page.html`.
2. **Use ABSOLUTE paths only** (never `../`):
   - CSS/JS/img → `/src/css/…`, `/src/js/…`, `/src/assets/…`
   - Home → `/` and `/#section`
   - Inter-page links → clean URLs (`/the-kingsmen`, `/blog`, `/blog/<slug>`)
   (Relative `../` paths BREAK on clean URLs — the browser resolves them
   against the clean URL, not the file location.)
3. **vercel.json**:
   - add a `rewrites` entry: `{ "source": "/your-page", "destination": "/src/pages/your-page.html" }`
   - (the `/src/pages/:slug → /:slug` redirect already covers the old path)
4. **SEO head tags** (every page needs all of these, each UNIQUE):
   - `<title>` ~55-60 chars: `Primary Keyword - <descriptor> | The Roaming Agency`
   - `<meta name="description">` ~150-160 chars, compelling, keyword-led
   - one clear `<h1>` containing the primary keyword
   - `canonical`, `og:url`, `hreflang` → the **clean** URL
   - `og:title` / `twitter:title` should match `<title>`
5. Blog articles: slug = a dash-cased version of the headline, nested under
   `/blog/…` (e.g. `/blog/why-everyone-is-looking-at-the-kingsmen`).

## Title patterns in use
- Bands: `<Band> - Luxury Roaming Band | The Roaming Agency`
- Blog: `Blog - Luxury Live Music Stories | The Roaming Agency`
- FAQ: `FAQ - Booking a Luxury Roaming Band | The Roaming Agency`
- DJ: `DJ - The Party Engineer | The Roaming Agency`
