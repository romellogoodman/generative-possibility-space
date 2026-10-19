import fidenza from "../data/fidenza.json";
import { hash } from "../lib/outputs.js";
import { MAP_SIZE, mapSteps } from "../canvas/camera.js";

// Fidenza: 999 real Art Blocks outputs. GPS reads their traits; it never invents a value they lack,
// so every step, child or blend lands on the closest real token.

// Every Fidenza is drawn at this one size: size is not one of its settings
const FIXED_SIZE = 0.9;

// Ordered traits, low to high; Colors has no order
const ORDER = {
  Density: ["Low", "Medium", "High", "High AF"],
  Turbulence: ["None", "Low", "Med", "High"],
  Scale: [
    "Micro-Uniform",
    "Uniform",
    "Small",
    "Medium",
    "Large",
    "Jumbo",
    "Jumbo XL",
  ],
};

// Every trait a token has, and the values each one takes
const TRAITS = Object.keys(fidenza[0].features);
const VALUES = Object.fromEntries(
  TRAITS.map((k) => [
    k,
    ORDER[k] ?? [...new Set(fidenza.map((t) => t.features[k]))].sort(),
  ])
);

// The settings GPS shows; matching them counts for more than the minor traits
const SHOWN = ["Density", "Turbulence", "Scale", "Colors"];
const weight = (k) => (SHOWN.includes(k) ? 10 : 1);

// One output per token, made once so the same token is always the same object
const OUTPUTS = fidenza.map((token, n) => {
  const day = Math.floor(hash(n, 0, 3) * 11);
  const hour = Math.floor(hash(n, 0, 4) * 24);
  const minute = Math.floor(hash(n, 0, 5) * 60);
  return {
    id: `f${n}`,
    seed: n,
    token,
    traits: token.features,
    size: FIXED_SIZE,
    score: Math.floor(hash(n, 0, 6) * 5) + 1,
    created: new Date(Date.UTC(2026, 9, 1 + day, hour, minute)),
  };
});

// The real token closest to a set of traits: it must match every `fixed` trait, then share the
// most others (the shown settings first); ties go to the lowest number. Null when none can.
export function closest(target, fixed = [], exclude = new Set()) {
  let best = null;
  let bestScore = -1;
  for (const output of OUTPUTS) {
    if (exclude.has(output.seed)) continue;
    if (fixed.some((k) => output.traits[k] !== target[k])) continue;
    let score = 0;
    for (const k of TRAITS)
      if (!fixed.includes(k) && output.traits[k] === target[k])
        score += weight(k);
    if (score > bestScore) {
      best = output;
      bestScore = score;
    }
  }
  return best;
}

// This output, moved `delta` steps along each ordered trait; null past the ends or with no match
function step(output, moves) {
  const target = { ...output.traits };
  for (const [key, delta] of moves) {
    const values = VALUES[key];
    const next = values[values.indexOf(output.traits[key]) + delta];
    if (next === undefined) return null;
    target[key] = next;
  }
  return closest(
    target,
    moves.map(([key]) => key),
    new Set([output.seed])
  );
}

const ordered = (key) => ({
  key,
  label: key,
  name: key,
  dir: -1,
  values: VALUES[key],
  read: (o) => o.traits[key],
  sortValue: (o) => VALUES[key].indexOf(o.traits[key]),
  text: (o) => o.traits[key],
  cell: (o) => o.traits[key],
  position: (o) =>
    VALUES[key].indexOf(o.traits[key]) / (VALUES[key].length - 1),
});

// The canvas: a lattice through all 999 tokens, so no two within 37 columns or 27 rows repeat
const mod = (a, n) => ((a % n) + n) % n;
function cell(gridX, gridY) {
  const n = mod(mod(gridX + gridY * 37, OUTPUTS.length) * 577 + 123, 999);
  return { ...OUTPUTS[n], gridX, gridY };
}

const TABLE_OUTPUTS = [];
for (let gy = 0; gy < 6; gy++) {
  for (let gx = 0; gx < 10; gx++) {
    TABLE_OUTPUTS.push(OUTPUTS[cell(gx, gy).seed]);
  }
}

// The parameter map: Density across, Turbulence down, every token in the cell of its pair
const MAP_X = ORDER.Density;
const MAP_Y = ORDER.Turbulence;
const PAIRS = MAP_X.map((x) =>
  MAP_Y.map((y) =>
    OUTPUTS.filter((o) => o.traits.Density === x && o.traits.Turbulence === y)
  )
);

// Each pair's cell holds a k × k grid of its tokens; zooming in makes room for more
function mapCells(camera, width, height) {
  const k = mapSteps(camera.zoom) / MAP_X.length;
  const pairSize = MAP_SIZE / MAP_X.length;
  const size = pairSize / k;
  const right = camera.x + width / camera.zoom;
  const bottom = camera.y + height / camera.zoom;
  const cells = [];
  PAIRS.forEach((column, i) =>
    column.forEach((list, j) =>
      list.slice(0, k * k).forEach((output, n) => {
        const left = i * pairSize + (n % k) * size;
        const top = j * pairSize + Math.floor(n / k) * size;
        if (left + size < camera.x || left > right) return;
        if (top + size < camera.y || top > bottom) return;
        cells.push({ key: output.id, left, top, size, output });
      })
    )
  );
  return cells;
}

// Variations: one shown setting moved at a time, each landing on the closest real token
function variations(output, layout) {
  const count = layout === "strip" ? 8 : 6;
  const colors = VALUES.Colors.filter((c) => c !== output.traits.Colors).sort(
    (a, b) =>
      hash(output.seed, VALUES.Colors.indexOf(a), 30) -
      hash(output.seed, VALUES.Colors.indexOf(b), 30)
  );
  const tries = [
    () => step(output, [["Density", 1]]),
    () => step(output, [["Turbulence", 1]]),
    () => step(output, [["Scale", 1]]),
    () => step(output, [["Density", -1]]),
    () => step(output, [["Turbulence", -1]]),
    () => step(output, [["Scale", -1]]),
    ...colors.map(
      (c) => () =>
        closest(
          { ...output.traits, Colors: c },
          ["Colors"],
          new Set([output.seed])
        )
    ),
  ];
  const found = [];
  for (const attempt of tries) {
    if (found.length === count) break;
    const v = attempt();
    if (v && !found.includes(v)) found.push(v);
  }
  return found;
}

const DIAL_NOTES = {
  Density: "sparser → denser",
  Turbulence: "calmer → wilder",
  Scale: "smaller → bigger",
};

const dial = (key) => {
  const values = VALUES[key];
  const index = (o) => values.indexOf(o.traits[key]);
  return {
    key,
    name: key,
    note: DIAL_NOTES[key],
    // Five steps along the trait, the current value centred where the ends allow
    steps(output) {
      const fits = (i) =>
        index(output) + i >= 0 && index(output) + i < values.length;
      let low = -2;
      while (low < 0 && !fits(low)) low++;
      while (low > -4 && !fits(low + 4) && fits(low - 1)) low--;
      return [0, 1, 2, 3, 4].map((n) => (fits(low + n) ? low + n : null));
    },
    at: (output, i) => step(output, [[key, i]]),
    value: (output) => output.traits[key],
    track: (output) => ({
      min: values[0],
      max: values.at(-1),
      at: index(output) / (values.length - 1),
    }),
  };
};

// Breed: how often a child changes one trait, for each mutation level
const MUTATION_RATE = { 0.04: 0.25, 0.08: 0.5, 0.16: 0.85 };

const BREED_SIZE = 9;

function firstGeneration() {
  const seeds = [];
  for (let k = 0; seeds.length < BREED_SIZE; k++) {
    const seed = Math.floor(hash(k, 0, 11) * OUTPUTS.length);
    if (!seeds.includes(seed)) seeds.push(seed);
  }
  return { outputs: seeds.map((n) => OUTPUTS[n]), picked: [] };
}

// A different value for one trait: an ordered trait moves one step, any other changes outright
function mutate(traits) {
  const key = TRAITS[Math.floor(Math.random() * TRAITS.length)];
  const values = VALUES[key];
  const at = values.indexOf(traits[key]);
  if (ORDER[key]) {
    const up = at === 0 || (at < values.length - 1 && Math.random() < 0.5);
    return { ...traits, [key]: values[at + (up ? 1 : -1)] };
  }
  const others = values.filter((v) => v !== traits[key]);
  return {
    ...traits,
    [key]: others[Math.floor(Math.random() * others.length)],
  };
}

// Each child takes every trait from parent A or B, maybe changes one, then becomes the closest
// real token not already in this generation or among its parents
function nextGeneration({ outputs, picked }, mutation) {
  const parents = outputs.filter((o) => picked.includes(o.id));
  const pick = () => parents[Math.floor(Math.random() * parents.length)];
  const taken = new Set(parents.map((p) => p.seed));
  return {
    outputs: Array.from({ length: BREED_SIZE }, () => {
      const [a, b] = [pick(), pick()];
      let traits = Object.fromEntries(
        TRAITS.map((k) => [k, (Math.random() < 0.5 ? a : b).traits[k]])
      );
      if (Math.random() < MUTATION_RATE[mutation]) traits = mutate(traits);
      const child = closest(traits, [], taken);
      taken.add(child.seed);
      return { ...child, parents: [...new Set([a.seed, b.seed])] };
    }),
    picked: [],
  };
}

function randomOutput(draw) {
  return OUTPUTS[Math.floor(hash(draw, 0, 21) * OUTPUTS.length)];
}

// Blend: A's traits swapped for B's one at a time (shown settings first); each step is the
// closest real token with the traits swapped so far, and the ends are A and B themselves
function blendAt({ a, b }, t) {
  const differ = [...SHOWN, ...TRAITS.filter((k) => !SHOWN.includes(k))].filter(
    (k) => a.traits[k] !== b.traits[k]
  );
  if (t <= 0 || !differ.length) return a;
  if (t >= 1) return b;
  // Between the ends, at least one trait is swapped and at least one is still A's
  const swapped = Math.min(
    differ.length - 1,
    Math.max(1, Math.round(t * differ.length))
  );
  if (!swapped) return a;
  const keys = differ.slice(0, swapped);
  const target = { ...a.traits };
  keys.forEach((k) => (target[k] = b.traits[k]));
  const ends = new Set([a.seed, b.seed]);
  return (
    closest(target, keys, ends) ??
    closest(target, keys.slice(-1), ends) ??
    closest(target, [], ends)
  );
}

export const FIDENZA = {
  id: "fidenza",
  label: "Fidenza",
  // Every view works, molded around the traits
  views: null,
  fixedSize: FIXED_SIZE,
  settings: [
    ordered("Density"),
    ordered("Turbulence"),
    ordered("Scale"),
    {
      key: "Colors",
      label: "Colors",
      name: "Colors",
      dir: 1,
      read: (o) => o.traits.Colors,
      text: (o) => o.traits.Colors,
      cell: (o) => o.traits.Colors,
      position: null,
    },
  ],
  // A short caption under small tiles: the shown settings' values, e.g. "High · Med · Jumbo · Luxe"
  brief: (o) => SHOWN.map((k) => o.traits[k]).join(" · "),
  copy: {
    "contact-sheet": "Scan many outputs side by side at the same size.",
    "parameter-map":
      "Find outputs by their traits: density runs left to right, turbulence top to bottom.",
    compass:
      "Nudge in a direction: left and right change density, up and down change turbulence.",
    grouped: "See outputs sorted into buckets by day, score or colors.",
  },

  cell,
  fromId: (id) => OUTPUTS[Number(id.slice(1))],
  tableOutputs: TABLE_OUTPUTS,
  groupings: ["day", "score", "colors"],

  map: {
    axes: {
      x: "sparser ← density → denser",
      y: "calmer ← turbulence → wilder",
    },
    ticks: { x: MAP_X, y: MAP_Y },
    cells: mapCells,
  },

  variations,

  // Left and right step Density, up and down step Turbulence
  compass: {
    labels: {
      up: "↑ calmer",
      down: "wilder ↓",
      left: "sparser",
      right: "denser",
    },
    step: (output, x, y) =>
      step(
        output,
        [
          ["Density", x],
          ["Turbulence", y],
        ].filter(([, d]) => d)
      ),
  },

  dials: ["Density", "Turbulence", "Scale"].map(dial),

  firstGeneration,
  nextGeneration,
  randomOutput,
  blendAt,
};
