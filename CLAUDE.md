# GPS — Generative possibility space

A demo of different ways to browse generative outputs. Every output is a stand-in grey square
(seed, size, shade, score, created date) until real generators are plugged in.

React 19 + Vite + SCSS, no router or state library. Deployed on Vercel at gps.romellogoodman.com.

## Map

Everything lives in two files on purpose (fast prototyping). Split them only when asked.

- `src/App.jsx`, by section comment:
  - top: `hash` / `makeOutput` (`src/App.jsx:19`) — outputs are deterministic from their grid position; `seededOutput` for ones made from a seed (variations, children, blends)
  - Canvas mode (`src/App.jsx:129`) — infinite pan/zoom canvas, layouts Staggered, Contact sheet and Parameter map (a bounded square where position is size × shade)
  - Table mode (`src/App.jsx:398`) — Spreadsheet, Cards, Split, Grouped
  - Focus mode (`src/App.jsx:836`) — one output plus variations from `vary`; layouts Strip, Compass, Inspector, Dials, Lineage. Everything visited is a tree that outlives Focus; the trail is its path
  - Make new ones (`src/App.jsx:1463`) — Breed (pick, breed the next generation) and Blend (scrub from A to B)
  - About (`src/App.jsx:1649`) — the About GPS page, opened from the `gps` mark; what the squares are, the install prompt, thanks
  - Top bar (`src/App.jsx:1729`) — the only chrome: one floating pill; the `gps` mark (opens About), then a view picker on the left (every view, in four columns, with a line each), the current view's controls on the right
  - App (`src/App.jsx:2267`) — owns all view state (mode, layouts, sort, camera, focus tree, breed, blend, about) and passes it down
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
