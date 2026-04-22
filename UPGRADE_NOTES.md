# RGPV Study Hub – Upgrade Notes

## What's New in This Version

### New Features
- **Global Search** (Ctrl+K) — searches across Notes, Syllabus & PYQ simultaneously
- **Shareable URLs** — branch/semester is saved in URL (?branch=CS&sem=4), so you can share direct links
- **Breadcrumb navigation** on all inner pages
- **Back to Top button** — appears after scrolling down
- **Live Stats** — footer and homepage show real counts from JSON data
- **Explore section** — random subject cards on homepage
- **"Coming Soon" state** — broken/placeholder links gracefully show "Coming soon" instead of opening a broken URL
- **"Latest" badge** on most recent PYQ year
- **Retry button** on load errors
- **Keyboard accessibility** — dark toggle, jokes, and search all work with keyboard
- **Better mobile menu** — closes on outside click, aria attributes

### SEO Improvements
- Full meta tags (description, keywords, Open Graph, Twitter Card) on all pages
- Canonical URLs
- Structured data (JSON-LD) on homepage
- Emoji favicons per page
- Font preconnect for faster load

### Accessibility
- ARIA roles on nav, tabs, dialogs, live regions
- aria-current on active nav link
- aria-label on all interactive elements
- Keyboard shortcuts documented

### Performance
- `passive: true` on all scroll listeners
- `requestAnimationFrame` for card animations
- Debounced search (180ms)
- Lazy index building (search index built only on first open)

## File Structure
```
<<<<<<< HEAD
project-x/
=======
rgpv-study-hub/
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
├── index.html
├── notes.html
├── syllabus.html
├── pyq.html
├── css/
│   └── style.css       ← All styles + new search/back-to-top/breadcrumb
├── js/
│   ├── main.js         ← Dark mode, nav, scroll, URL params, breadcrumb
│   ├── search.js       ← NEW: Global search engine (indexes all JSON data)
│   ├── notes.js        ← URL param support, retry, coming-soon state
│   ├── syllabus.js     ← URL param support, retry
│   ├── pyq.js          ← URL param support, year sorting, Latest badge
│   └── typing.js       ← Hero typing animation (unchanged)
└── data/
    ├── notes.json
    ├── syllabus.json
    └── pyq.json
```

## Deployment
<<<<<<< HEAD
Deploy with Netlify (drag & drop the project-x folder) or push to GitHub + enable GitHub Pages.
=======
Deploy with Netlify (drag & drop the rgpv-study-hub folder) or push to GitHub + enable GitHub Pages.
>>>>>>> ad11b44fc234b13ed695f73fce199db7d659a2e2
