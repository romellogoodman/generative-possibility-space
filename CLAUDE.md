# GPS — Generative possibility space

A demo of different ways to browse generative outputs. Every output is a stand-in grey square
(seed, size, shade, score, created date) until real generators are plugged in.

React 19 + Vite + SCSS, no router or state library. Deployed on Vercel at gps.romellogoodman.com.

## Map

One folder per part of the app. Each component file imports its own `.scss` beside it, and
`.js` files hold the plain data and helpers.

- `src/App.jsx` — owns all view state (mode, layouts, sort, camera, focus tree, breed, blend, about) and passes it down. It imports `App.scss` first, then each part, so the CSS keeps the original order.
- `src/App.scss` — theme tokens on `:root` (light theme via `prefers-color-scheme`), plus shared pieces: `.output`, `.frame`, `.score`, `.meter`, `.thumb`
- `src/lib/outputs.js` — `hash` / `makeOutput` (deterministic from a grid position), `seededOutput` (variations, children, blends), formatters, and `vary` / `nearby`
- `src/components/Output.jsx` — `Output`, `Score`, `Frame`, `Delta`
- `src/canvas/` — `CanvasMode.jsx` (infinite pan/zoom canvas), `layouts.js` (Staggered, Contact sheet, Parameter map), `camera.js` (zoom, the parameter map's geometry, `outputFromId`)
- `src/table/` — `TableMode.jsx`, `layouts.jsx` (Spreadsheet, Cards, Split, Grouped), `views.js` (the list the picker shows), `data.jsx` (sorting and grouping)
- `src/focus/` — `FocusMode.jsx` (plus `Trail`), `layouts.jsx` (Strip, Compass, Inspector, Dials, Lineage), `views.js`, `tree.js` (everything visited is a tree that outlives Focus; the trail is its path)
- `src/make/` — `BreedMode.jsx` + `breed.js` (pick, breed the next generation), `BlendMode.jsx` + `blend.js` (scrub from A to B)
- `src/about/AboutPage.jsx` — opened from the `gps` mark: what the squares are, the install prompt, thanks
- `src/topbar/` — `TopBar.jsx`, the only chrome: one floating pill with the `gps` mark, the view picker (`VIEW_GROUPS`: every view in four columns, a line each) and the current view's controls; `Menu.jsx` (`MenuButton`, `MenuItem`, `OptionMenu`)
- `skills/gps/` — the GPS Claude Code skill (`SKILL.md`) and its catalog of views (`patterns.md`)
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
npm run dev   # http://localhost:8080 — switch views from the picker at desktop and ~390px wide
```
