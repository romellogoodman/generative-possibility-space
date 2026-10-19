# GPS — Generative possibility space

A demo of many ways to browse the outputs of a generative algorithm. The views stay the same and
the outputs come from an example, switched from the example chip at the end of the top bar: Grey squares
(the default stand-in generator: seed, size, shade, score, date) or a real Art Blocks project
such as Fidenza, browsed by its own traits. The point is that GPS molds around each example.

React 19 + Vite + SCSS, no router or state library. Deployed on Vercel at gps.romellogoodman.com.

## Map

One folder per part of the app. Each component file imports its own `.scss` beside it, and
`.js` files hold the plain data and helpers.

- `src/App.jsx` — owns all view state (example, mode, layouts, sort, camera, focus tree, breed, blend, about) and passes it down. It imports `App.scss` first, then each part, so the CSS keeps the original order.
- `src/App.scss` — theme tokens on `:root` (light theme via `prefers-color-scheme`), plus shared pieces: `.output`, `.frame`, `.score`, `.meter`, `.thumb`, `.num`, `.tag`, `.meta`, `.save`
- `src/examples/` — one object per example (`squares.js`, `fidenza.js`, `meridian.js`, `asemica.js`; `index.js` lists them): its outputs (`cell`, `fromId`, `tableOutputs`), `settings` (how to read, show and sort each), the parameter map, `variations`, `compass`, `dials`, breed and blend rules, picker copy, supported `views` and `cellAspect` (the shape views give cells). Each also names its number (`idLabel`: Seed or Token), its `facts` beyond the settings (Grey squares' score and date; a token's real mint date), `defaultSort`, and the `cover` and `byline` the example menu shows. Views read all of this from the example instead of naming size and shade. `artblocks.js` builds every Art Blocks example from its catalog plus a little data (ordered traits, axes, dials, families, kept traits); its `closest` finds the real token nearest a set of traits.
- `src/data/` — one catalog per Art Blocks project (id, name, hash, aspect, features, minted), fetched from the Art Blocks token and data APIs
- `scripts/` — `previews.mjs` rebuilds an example's small previews into `.assets/` (ignored) for upload to the R2 bucket; `mint-dates.mjs` adds each token's real mint date to its catalog
- `src/lib/outputs.js` — `hash` / `makeOutput` (deterministic from a grid position), `seededOutput` (variations, children, blends), formatters, and `vary` / `nearby`
- `src/components/Output.jsx` — `Output`, `Score`, `Frame`, `Delta`, and the data style every view shares: `Meta` (one line naming an output), `Value` (numbers mono, words not), `Fact` (score or date by kind)
- `src/components/Saved.jsx` — the hearts you set (`SavedProvider`, `SaveButton`), one list per example in this browser
- `src/canvas/` — `CanvasMode.jsx` (infinite pan/zoom canvas), `layouts.js` (Staggered, Contact sheet, Parameter map), `camera.js` (zoom, the parameter map's geometry, `outputFromId`)
- `src/table/` — `TableMode.jsx`, `layouts.jsx` (Spreadsheet, Cards, Split, Grouped), `views.js` (the list the picker shows), `data.jsx` (sorting and grouping)
- `src/focus/` — `FocusMode.jsx` (plus `Trail`), `layouts.jsx` (Strip, Compass, Inspector, Dials, Lineage), `views.js`, `tree.js` (everything visited is a tree that outlives Focus; the trail is its path)
- `src/make/` — `BreedMode.jsx` + `breed.js` (pick, breed the next generation), `BlendMode.jsx` + `blend.js` (scrub from A to B)
- `src/about/AboutPage.jsx` — opened from the `gps` mark: the examples and their credits, the install prompt, thanks
- `src/topbar/` — `TopBar.jsx`, the only chrome: one floating pill with the `gps` mark, the view picker (`VIEW_GROUPS`: every view in four columns, a line each) and the current view's controls, then the example chip (its picture and name; the menu picks which example); `Menu.jsx` (`MenuButton`, `MenuItem`, `OptionMenu`)
- `skills/gps/` — the GPS Claude Code skill (`SKILL.md`) and its catalog of views (`patterns.md`)
- `.orcc/` — design record from orcc sessions (decisions, mockups); not app code

## Conventions

- CSS classes use BEM (`block__element--modifier`) with SCSS `&` nesting.
- Use the CSS custom properties on `:root` in `src/App.scss` for colours, spacing and bar clearances.
- A view never names size, shade or a trait: it reads settings from the current example.
- An Art Blocks example only shows real tokens: nudges, children and blend steps land on the closest one. It never invents a fact about one either: no score, and its date is the real mint date.
- Numbers (and seeds) use the mono face via `.num`; words never do. A setting's name is muted, its value bright.
- A grey square's level comes from the `--shade` property on `.output`, not opacity.
- New controls go in the top bar (`TopBar`), not on the page; lift their state into `App`.
- Images never go in git: they live in the `gps-assets` R2 bucket (`ASSETS_URL` in `src/lib/outputs.js`).
- `button` keeps the browser's default padding (`src/App.scss` resets only font, colour, background, border); set `padding` on any button that wraps an image.

## Verify a change

```bash
npm run lint
npm run format:check
npm run build
npm run dev   # http://localhost:8080 — switch views from the picker at desktop and ~390px wide
```

Check every example from the gear, not only Grey squares.

## More

- `agent_docs/examples.md` — adding an Art Blocks project: fetch its catalog, pick axes and dials, make and upload its previews, credit and licence
