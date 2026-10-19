# GPS — Generative possibility space

A demo of different ways to browse generative outputs: an infinite canvas, a table of
properties, and a focus view that shows variations of one output. For now every output is a
grey square.

Live at [gps.romellogoodman.com](https://gps.romellogoodman.com).

React 19 + Vite + SCSS.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8080
```

## Scripts

```bash
npm run dev           # Start dev server (port 8080)
npm run build         # Build for production
npm run lint          # Check for errors
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
npm run preview       # Preview production build
```

See [CLAUDE.md](CLAUDE.md) for a map of the code and project conventions.

## Use GPS on your own outputs

[`skills/gps`](skills/gps) is a Claude Code skill. It adds these views to a project that
generates outputs, using your real outputs and settings instead of grey squares. To
install it, run this from your project:

```bash
npx degit romellogoodman/generative-possibility-space/skills/gps .claude/skills/gps
```

Then run `/gps` in Claude Code, or ask it to "add GPS views to this project".
[patterns.md](skills/gps/patterns.md) lists every view and what it needs.

## Credits

GPS hosts four examples: the original grey squares, Fidenza, Meridian and Asemica.

[Fidenza](https://www.artblocks.io/collections/curated/projects/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/78)
is by [Tyler Hobbs](https://tylerxhobbs.com) (2021), via Art Blocks Curated. The images and
metadata (names and traits for all 999 tokens) come from the Art Blocks token API at
`token.artblocks.io`, saved in [`src/data/fidenza.json`](src/data/fidenza.json). The metadata is
licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). GPS uses it
non-commercially, as a demo.

[Meridian](https://www.artblocks.io/collections/curated/projects/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/163)
is by [Matt DesLauriers](https://www.mattdesl.com) (2021), via Art Blocks Curated. Its images and
metadata (names and traits for all 1,000 tokens) come from the same API, saved in
[`src/data/meridian.json`](src/data/meridian.json), and are licensed
[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). GPS uses them non-commercially,
as a demo.

[Asemica](https://www.artblocks.io/collections/curated/projects/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/206)
is by Emily Edelman, Dima Ofman and Andrew Badr, via Art Blocks Curated. Its metadata is saved in
[`src/data/asemica.json`](src/data/asemica.json) and its images load from Art Blocks. It is © the
artists, not openly licensed: GPS shows it as a non-commercial demo while we ask their
permission, and will take it down if they'd rather it didn't.

## Image assets

Fidenza's and Meridian's small previews live in the `gps-assets` Cloudflare R2 bucket, served
from its public r2.dev address (see `ASSETS_URL` in `src/lib/outputs.js`), not in git. To rebuild
and upload one project's previews (`--project fidenza` or `--project meridian`):

```bash
node scripts/previews.mjs --project meridian   # writes .assets/meridian/<tokenId>.webp (needs cwebp)
ls .assets/meridian/*.webp | xargs -P 8 -I{} sh -c \
  'wrangler r2 object put "gps-assets/meridian/$(basename {})" --file {} --content-type image/webp --remote'
```
