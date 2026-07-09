# [Business Name] — Window Cleaning Website

A clean, single-page site for a residential window-cleaning business, built to turn
visitors into quote requests.

## Files

- `index.html` — all the page content
- `styles.css` — all styling
- `script.js` — footer year + quote form handling
- `README.md` — this file

## Run it

Just double-click `index.html` to open it in your browser. No build step, no install.

To host it for real, upload these files to any static host:
[Netlify](https://netlify.com), [Cloudflare Pages](https://pages.cloudflare.com),
GitHub Pages, or any web host that serves HTML.

## Make it yours — 3 quick edits

1. **Business name & city.** Open `index.html` and find-and-replace:
   - `[Business Name]` → your real name
   - `[Your City]` → the area you serve
   - `[Customer Name]` / `[Neighborhood]` in the testimonial

2. **Connect the quote form** (so you actually receive submissions):
   - Sign up free at <https://formspree.io>
   - Create a form; copy its form ID (looks like `xyzabcd`)
   - In `index.html`, find `YOUR_FORM_ID` and replace it with your ID
   - Until you do this, the form runs in "demo mode" and just shows a confirmation.

3. **Adjust the services / steps** text in `index.html` to match what you offer.

## Design notes

- **Palette** is drawn from glass and clean water: a faint cool "glass white"
  background, deep slate ink for trust, and a single bright cyan accent (used
  sparingly on purpose).
- **Type** pairs Fraunces (a warm optical serif) for headings with Inter for body.
- **Signature element**: the animated hero pane with a squeegee swipe — the
  product's core gesture. It respects `prefers-reduced-motion`.
