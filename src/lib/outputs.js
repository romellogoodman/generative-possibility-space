// Stand-in outputs: deterministic from a grid position or a seed, plus the helpers that vary them

// Deterministic randomness in [0, 1): the same inputs always give the same value.
// (The crescents version only ever returned values below 0.5.)
export function hash(x, y, seed = 0) {
  let h = (seed * 2654435761 + x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

// Where the image assets live: the gps-assets R2 bucket's public address
const ASSETS_URL = "https://pub-997b197b1d4547cab5898c0fda1d12fb.r2.dev";

// The Art Blocks thumbnail of a token: about 1000 px on the long side, a PNG
export const thumbUrl = (token) =>
  `https://media.artblocks.io/thumb/${token.id}.png`;

// A token's two images, both from its id: a small preview for grids (400 px on the long side,
// a WebP in the bucket folder its project names, made by scripts/previews.mjs; a project with
// no folder uses the Art Blocks thumbnail), and the full-size PNG from Art Blocks
export const previewUrl = (token) =>
  token.bucket
    ? `${ASSETS_URL}/${token.bucket}/${token.id}.webp`
    : thumbUrl(token);
export const fullUrl = (token) =>
  `https://media-proxy.artblocks.io/1/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/${token.id}.png`;

// A stand-in generative output, worked out from its grid position
export function makeOutput(gridX, gridY) {
  const day = Math.floor(hash(gridX, gridY, 3) * 11);
  const hour = Math.floor(hash(gridX, gridY, 4) * 24);
  const minute = Math.floor(hash(gridX, gridY, 5) * 60);
  return {
    id: `${gridX},${gridY}`,
    gridX,
    gridY,
    seed: Math.floor(hash(gridX, gridY, 7) * 1e6),
    size: 0.55 + hash(gridX, gridY, 1) * 0.35,
    shade: 0.45 + hash(gridX, gridY, 2) * 0.55,
    score: Math.floor(hash(gridX, gridY, 6) * 5) + 1,
    created: new Date(Date.UTC(2026, 9, 1 + day, hour, minute)),
  };
}

// An output made elsewhere (a variation, a child, a blend): its seed fixes everything but size and shade
export function seededOutput(seed, size, shade) {
  const day = Math.floor(hash(seed, 0, 3) * 11);
  const hour = Math.floor(hash(seed, 0, 4) * 24);
  const minute = Math.floor(hash(seed, 0, 5) * 60);
  return {
    id: `s${seed}`,
    seed,
    size: round2(size),
    shade: round2(shade),
    score: Math.floor(hash(seed, 0, 6) * 5) + 1,
    created: new Date(Date.UTC(2026, 9, 1 + day, hour, minute)),
  };
}

export const formatDate = (date) =>
  date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

export const formatDay = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

// A day without the time, for tight spots: "Oct 11"
export const formatShort = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

// A real token's date, which lies years back: "Jun 11, 2021"
export const formatYear = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export const formatTime = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

export const lerp = ([min, max], t) => min + (max - min) * t;

export const SIZE_RANGE = [0.3, 0.95];

export const SHADE_RANGE = [0.1, 1];

export const clamp = (value, [min, max]) => Math.min(max, Math.max(min, value));

export const round2 = (value) => Math.round(value * 100) / 100;

export const short = (value) => value.toFixed(2).replace(/^0/, "");

// A variation of an output: a new seed, with size and shade nudged
export function vary(output, dSize, dShade, k) {
  const seed = Math.floor(hash(output.seed, k, 50) * 1e6);
  return {
    id: `v${seed}`,
    seed,
    size: round2(clamp(output.size + dSize, SIZE_RANGE)),
    shade: round2(clamp(output.shade + dShade, SHADE_RANGE)),
    score: Math.floor(hash(seed, 0, 6) * 5) + 1,
    created: new Date(output.created.getTime() + (k + 1) * 97000),
  };
}

// Variations spread around the output, each in a different (size, shade) direction
export function nearby(output, count, sizeReach, shadeReach) {
  const variations = [];
  for (let k = 0; k < count; k++) {
    const angle = (k / count + hash(output.seed, k, 10) * 0.08) * 2 * Math.PI;
    const reach = 0.75 + hash(output.seed, k, 20) * 0.5;
    let dSize = Math.cos(angle) * sizeReach * reach;
    let dShade = Math.sin(angle) * shadeReach * reach;
    // Flip directions that would run past the range
    const size = output.size + dSize;
    const shade = output.shade + dShade;
    if (size > SIZE_RANGE[1] || size < SIZE_RANGE[0]) dSize = -dSize;
    if (shade > SHADE_RANGE[1] || shade < SHADE_RANGE[0]) dShade = -dShade;
    variations.push(vary(output, dSize, dShade, k));
  }
  return variations;
}
