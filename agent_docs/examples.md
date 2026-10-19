# Adding an Art Blocks project as an example

Model the new example on the existing Art Blocks examples in `src/examples/` and list it in
`src/examples/index.js`.

## Fetch the catalog

- Token metadata: `https://token.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/<tokenId>`,
  where `tokenId = projectId * 1e6 + n`. Fidenza is project 78, Meridian 163, Asemica 206.
- Find the token count by probing for the first 404.
- Art Blocks answers bursts with 429: fetch with low concurrency and back off.
- Keep `id`, `name`, `hash` (`token_hash`), `aspect` (`aspect_ratio`) and `features`, and write
  the result to `src/data/<slug>.json`.

## Pick the settings

Count each trait's values before choosing:

- **Map axes:** two traits with a natural order whose grid has every cell, or nearly every cell, filled.
- **Dials:** ordered traits where a real token one step away, differing in that trait alone, is common.
- **Families:** traits with no order, for grouping and colour cycling.
- **Size:** none of these projects has a size trait, so every output draws at one fixed size.
- **Aspect:** cells take the project's aspect ratio. Meridian is 9:16, so don't assume square-ish.

## Images

- **Thumbnail:** `https://media.artblocks.io/thumb/<tokenId>.png`, about 1000 px on the long side.
- **Full image:** `https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/<tokenId>.png`
  is 1–7 MB and rate-limited. Load it only for the single large output (Focus, Blend, Split).
- **Grid previews:** WebP at 400 px on the long side, quality 80, made with `cwebp` by the script
  in `scripts/` into `.assets/<slug>/`.
- **Upload** to the `gps-assets` R2 bucket under `<slug>/<tokenId>.webp`. The README has the
  `wrangler r2 object put` loop. Creating or changing Cloudflare resources needs the user's OK.

## Credit and licence

- Read each token's `license` field.
- **CC BY-NC 4.0 projects** (Fidenza, Meridian) get an entry and a credit line on About and in
  the README's Credits.
- **"Copyright" projects** (Asemica) stay out of the public build (`import.meta.env.DEV`) and out
  of the bucket, until the artists agree.
