# 好きな色 — Favourite Colour

A minimal, Japanese-inspired web app that helps you discover your favourite colour through a series of pairwise comparisons.

## Features

- **Two ranking algorithms**
  - **Tennis Ladder** — bottom-up merge sort; produces a complete, definitive ranking in O(n log n) comparisons.
  - **Chess Ranking** — Elo-style rating system; adapts pair selection to maximise information per comparison.
- **Four colour palettes** — 8 basic, 16 extended, 65 curated named colours, or the full 216-colour web-safe palette.
- **Session persistence** — progress is saved to `localStorage`; you can leave and resume at any time.
- **Responsive layout** — swatches fill the screen; stacks vertically on portrait/mobile, side-by-side on landscape/desktop.
- **Accessible** — keyboard shortcuts (A/← and B/→), ARIA labels, high-contrast swatch labels.
- **Analytics-ready** — results page updates the URL to `?fav=RRGGBB` for GoatCounter (or any URL-based analytics).
- **Algorithm explainer** — `algorithms.html` documents both algorithms with Mermaid flow diagrams.

## Quick start (GitHub Pages)

1. Fork or clone this repository.
2. Enable **GitHub Pages** from *Settings → Pages*, source = `main` branch, root `/`.
3. (Optional) Add your [GoatCounter](https://www.goatcounter.com/) site code in `index.html`:
   ```html
   <script data-goatcounter="https://YOUR_ACCOUNT.goatcounter.com/count"
           async src="//gc.zgo.at/count.js"></script>
   ```
4. Visit `https://<your-username>.github.io/favouritecolour/`.

## File structure

```
index.html          Main app (welcome, comparison, results screens)
algorithms.html     Algorithm explainer with Mermaid diagrams
css/
  style.css         All styles — edit the :root block to restyle everything
js/
  colours.js        Colour datasets (8, 16, 64 named, 216 web-safe)
  algorithms.js     TennisLadder and ChessRanking classes
  storage.js        localStorage helpers
  app.js            Main controller (screen transitions, comparison loop)
```

## Customisation

All visual tokens live in the `:root` block at the top of `css/style.css`:

```css
:root {
  --color-bg:     #f6f5f0;   /* page background */
  --color-accent: #c0392b;   /* Japanese vermilion — buttons, progress bar */
  --font-main:    'Helvetica Neue', Arial, sans-serif;
  /* … etc. */
}
```

Change any token to instantly restyle the entire app.

## Licence

MIT