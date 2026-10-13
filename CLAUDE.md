# GPS — Generative possibility space

A demo of different ways to browse generative outputs. Every output is a stand-in grey square
(seed, size, shade, score, created date) until real generators are plugged in.

React 19 + Vite + SCSS, no router or state library. Deployed on Vercel at gps.romellogoodman.com.

## Map

Everything lives in two files on purpose (fast prototyping). Split them only when asked.

- `src/App.jsx`, by section comment:
  - top: `hash` / `makeOutput` (`src/App.jsx:10`) — outputs are deterministic from their grid position
  - Canvas mode (`src/App.jsx:124`) — infinite pan/zoom canvas, layouts Staggered and Contact sheet
  - Table mode (`src/App.jsx:292`) — Spreadsheet, Cards, Split, Grouped
  - Focus mode (`src/App.jsx:710`) — one output plus variations from `vary`; layouts Strip, Compass, Inspector, Dials
  - Top bar (`src/App.jsx:1207`) — the only chrome: one floating pill that morphs per mode
  - App (`src/App.jsx:1508`) — owns all view state (mode, layouts, sort, camera, focus + trail) and passes it down
- `src/App.scss` — same sections; theme tokens on `:root`, light theme via `prefers-color-scheme`
- `.orcc/` — design record from orcc sessions (decisions, mockups); not app code

## Conventions

- CSS classes use BEM (`block__element--modifier`) with SCSS `&` nesting.
- Use the CSS custom properties on `:root` in `src/App.scss` for colours, spacing and bar clearances.
- An output's grey level comes from the `--shade` property on `.output`, not opacity.
- New controls go in the top bar (`TopBar`), not on the page; lift their state into `App`.

## Verify a change

```bash
npm run lint
npm run format:check
npm run build
npm run dev   # http://localhost:8080 — check Canvas, Table, Focus at desktop and ~390px wide
```
