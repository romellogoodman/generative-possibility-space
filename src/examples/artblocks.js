import { hash } from "../lib/outputs.js";
import { MAP_SIZE, mapSteps } from "../canvas/camera.js";

// An example made from an Art Blocks project's real tokens. GPS reads their traits; it never
// invents a value they lack, so every step, child or blend lands on the closest real token.
// Each project (fidenza.js, meridian.js, asemica.js) is mostly data handed to `artBlocks`.

// Every token is drawn at this one size: size is not one of their settings
const FIXED_SIZE = 0.9;

// Breed: how often a child changes one trait, for each mutation level
const MUTATION_RATE = { 0.04: 0.25, 0.08: 0.5, 0.16: 0.85 };

const BREED_SIZE = 9;

// Views that lay outputs in cells give them the tokens' shape once a square cell would waste
// more than a fifth of itself (narrower than 4:5 or wider than 5:4); nearer square stays square
const cellAspect = (aspect) =>
  Math.min(aspect, 1 / aspect) < 0.8 ? aspect : 1;

const mod = (a, n) => ((a % n) + n) % n;

// "a, b or c"
const listed = (words) =>
  words.length < 2
    ? words.join("")
    : `${words.slice(0, -1).join(", ")} or ${words.at(-1)}`;

/**
 * The project, as data:
 * - id, label, prefix (starts each output's id), tokens (the catalog), bucket (the folder of
 *   its previews in the gps-assets bucket; none means the Art Blocks thumbnails)
 * - order: ordered traits, low to high; fold: values counted as another, e.g. { Grid: { 3: "4" } }
 * - shown: the settings GPS shows; brief: the ones under small tiles (default: shown)
 * - map: { x, y, axes }, compass: { x, y, labels }, dials: { trait: note }
 * - cycle: the unordered trait variations try other values of, after stepping each dial
 * - families: [{ key, only? }], the groupings beyond day and score
 * - keep: traits Breed children and Blend ends always share
 * - copy: picker copy for this project
 */
export function artBlocks(project) {
  const {
    tokens,
    order = {},
    fold = {},
    shown,
    brief = shown,
    keep = [],
    families = [],
  } = project;
  const aspect = tokens[0].aspect;
  const box = cellAspect(aspect);

  // Every trait a token has, and the values each one takes
  const TRAITS = Object.keys(tokens[0].features);
  const VALUES = Object.fromEntries(
    TRAITS.map((k) => [
      k,
      order[k] ?? [...new Set(tokens.map((t) => t.features[k]))].sort(),
    ])
  );

  // Matching the shown settings counts for more than the minor traits
  const weight = (k) => (shown.includes(k) ? 10 : 1);

  // One output per token, made once so the same token is always the same object. `traits` are
  // the token's own; `levels` are what GPS orders and matches by, with folded values merged.
  const OUTPUTS = tokens.map((token, n) => {
    const day = Math.floor(hash(n, 0, 3) * 11);
    const hour = Math.floor(hash(n, 0, 4) * 24);
    const minute = Math.floor(hash(n, 0, 5) * 60);
    const traits = token.features;
    return {
      id: `${project.prefix}${n}`,
      seed: n,
      token: { ...token, bucket: project.bucket },
      traits,
      levels: Object.fromEntries(
        TRAITS.map((k) => [k, fold[k]?.[traits[k]] ?? traits[k]])
      ),
      size: FIXED_SIZE,
      score: Math.floor(hash(n, 0, 6) * 5) + 1,
      created: new Date(Date.UTC(2026, 9, 1 + day, hour, minute)),
    };
  });

  // Where an output sits in an ordered trait; -1 when its value has no place (Asemica's Mixed)
  const index = (o, key) => VALUES[key].indexOf(o.levels[key]);

  // The real token closest to a set of traits: it must match every `fixed` trait, then share the
  // most others (the shown settings first); ties go to the lowest number. Null when none can.
  function closest(target, fixed = [], exclude = new Set()) {
    let best = null;
    let bestScore = -1;
    for (const output of OUTPUTS) {
      if (exclude.has(output.seed)) continue;
      if (fixed.some((k) => output.levels[k] !== target[k])) continue;
      let score = 0;
      for (const k of TRAITS)
        if (!fixed.includes(k) && output.levels[k] === target[k])
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
    const target = { ...output.levels };
    for (const [key, delta] of moves) {
      const at = index(output, key);
      const next = at < 0 ? undefined : VALUES[key][at + delta];
      if (next === undefined) return null;
      target[key] = next;
    }
    return closest(
      target,
      moves.map(([key]) => key),
      new Set([output.seed])
    );
  }

  const setting = (key) => {
    const base = {
      key,
      label: key,
      name: key,
      read: (o) => o.traits[key],
      text: (o) => o.traits[key],
      cell: (o) => o.traits[key],
    };
    if (!order[key]) return { ...base, dir: 1, position: null };
    return {
      ...base,
      dir: -1,
      values: VALUES[key],
      sortValue: (o) => index(o, key),
      position: (o) =>
        index(o, key) < 0 ? null : index(o, key) / (VALUES[key].length - 1),
    };
  };

  // The canvas: a lattice through every token, so no two within 37 columns or 27 rows repeat
  const N = OUTPUTS.length;
  function cell(gridX, gridY) {
    const n = mod(mod(gridX + gridY * 37, N) * 577 + 123, N);
    return { ...OUTPUTS[n], gridX, gridY };
  }

  const TABLE_OUTPUTS = [];
  for (let gy = 0; gy < 6; gy++) {
    for (let gx = 0; gx < 10; gx++) {
      TABLE_OUTPUTS.push(OUTPUTS[cell(gx, gy).seed]);
    }
  }

  // The parameter map: one trait across, one down, every token in the cell of its pair.
  // Tokens off either order (Asemica's Mixed margin) stay off the map.
  const MAP_X = VALUES[project.map.x];
  const MAP_Y = VALUES[project.map.y];
  const PAIRS = MAP_X.map((x) =>
    MAP_Y.map((y) =>
      OUTPUTS.filter(
        (o) => o.levels[project.map.x] === x && o.levels[project.map.y] === y
      )
    )
  );

  // Each pair's cell holds a grid of its tokens in their own shape, about k × k of them and
  // centred; zooming in makes room for more. Square tokens in square cells fill it exactly.
  function mapCells(camera, width, height) {
    const pairW = MAP_SIZE / MAP_X.length;
    const pairH = MAP_SIZE / MAP_Y.length;
    const k = mapSteps(camera.zoom) / MAP_X.length;
    const across = Math.max(1, Math.round(k * Math.sqrt(pairW / pairH / box)));
    const down = Math.max(1, Math.round((k * k) / across));
    const w = Math.min(pairW / across, (pairH / down) * box);
    const h = w / box;
    const offsetX = (pairW - across * w) / 2;
    const offsetY = (pairH - down * h) / 2;
    const right = camera.x + width / camera.zoom;
    const bottom = camera.y + height / camera.zoom;
    const cells = [];
    PAIRS.forEach((column, i) =>
      column.forEach((list, j) =>
        list.slice(0, across * down).forEach((output, n) => {
          const left = i * pairW + offsetX + (n % across) * w;
          const top = j * pairH + offsetY + Math.floor(n / across) * h;
          if (left + w < camera.x || left > right) return;
          if (top + h < camera.y || top > bottom) return;
          cells.push({
            key: output.id,
            left,
            top,
            width: w,
            height: h,
            output,
          });
        })
      )
    );
    return cells;
  }

  const dialKeys = Object.keys(project.dials);

  // Variations: each dial stepped up, then down, then other values of the cycled trait, each
  // landing on the closest real token
  function variations(output, layout) {
    const count = layout === "strip" ? 8 : 6;
    const { cycle } = project;
    const others = VALUES[cycle]
      .filter((c) => c !== output.levels[cycle])
      .sort(
        (a, b) =>
          hash(output.seed, VALUES[cycle].indexOf(a), 30) -
          hash(output.seed, VALUES[cycle].indexOf(b), 30)
      );
    const tries = [
      ...dialKeys.map((key) => () => step(output, [[key, 1]])),
      ...dialKeys.map((key) => () => step(output, [[key, -1]])),
      ...others.map(
        (c) => () =>
          closest(
            { ...output.levels, [cycle]: c },
            [cycle],
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

  const dial = (key) => {
    const values = VALUES[key];
    return {
      key,
      name: key,
      note: project.dials[key],
      // Five steps along the trait, the current value centred where the ends allow; an output
      // with no place on the order only shows itself
      steps(output) {
        const at = index(output, key);
        if (at < 0) return [null, null, 0, null, null];
        const fits = (i) => at + i >= 0 && at + i < values.length;
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
        at:
          index(output, key) < 0
            ? null
            : index(output, key) / (values.length - 1),
      }),
    };
  };

  // Families: groupings by an unordered trait, or an ordered one in its order. `only` leaves out
  // tokens the trait doesn't describe (Meridian's Palette outside Paletted and Prime).
  const familyId = (key) => key.toLowerCase().replace(/\s+/g, "-");
  const FAMILIES = Object.fromEntries(
    families.map(({ key, only }) => [
      familyId(key),
      {
        label: key,
        key: (o) => (only && !only(o) ? null : o.traits[key]),
        title: (value) => value,
        order: order[key]
          ? (a, b) => order[key].indexOf(a) - order[key].indexOf(b)
          : (a, b) => (a < b ? -1 : 1),
        within: (a, b) => b.created - a.created,
      },
    ])
  );
  const groupings = ["day", "score", ...Object.keys(FAMILIES)];

  function firstGeneration() {
    const seeds = [];
    for (let k = 0; seeds.length < BREED_SIZE; k++) {
      const seed = Math.floor(hash(k, 0, 11) * N);
      if (!seeds.includes(seed)) seeds.push(seed);
    }
    return { outputs: seeds.map((n) => OUTPUTS[n]), picked: [] };
  }

  // A different value for one trait (never a kept one): an ordered trait moves one step, any
  // other changes outright
  const mutable = TRAITS.filter((k) => !keep.includes(k));
  function mutate(traits) {
    const key = mutable[Math.floor(Math.random() * mutable.length)];
    const values = VALUES[key];
    const at = values.indexOf(traits[key]);
    if (order[key] && at >= 0) {
      const up = at === 0 || (at < values.length - 1 && Math.random() < 0.5);
      return { ...traits, [key]: values[at + (up ? 1 : -1)] };
    }
    const others = values.filter((v) => v !== traits[key]);
    return {
      ...traits,
      [key]: others[Math.floor(Math.random() * others.length)],
    };
  }

  // Each child takes every trait from parent A or B (the kept ones together, from one of them),
  // maybe changes one, then becomes the closest real token with the kept traits that isn't
  // already in this generation or among its parents
  function nextGeneration({ outputs, picked }, mutation) {
    const parents = outputs.filter((o) => picked.includes(o.id));
    const pick = () => parents[Math.floor(Math.random() * parents.length)];
    const taken = new Set(parents.map((p) => p.seed));
    return {
      outputs: Array.from({ length: BREED_SIZE }, () => {
        const [a, b] = [pick(), pick()];
        let traits = Object.fromEntries(
          TRAITS.map((k) => [k, (Math.random() < 0.5 ? a : b).levels[k]])
        );
        if (keep.length) {
          const from = Math.random() < 0.5 ? a : b;
          keep.forEach((k) => (traits[k] = from.levels[k]));
        }
        if (Math.random() < MUTATION_RATE[mutation]) traits = mutate(traits);
        // A small family can run out of unused tokens; then repeats are allowed
        const child =
          closest(traits, keep, taken) ?? closest(traits, keep, new Set());
        taken.add(child.seed);
        return { ...child, parents: [...new Set([a.seed, b.seed])] };
      }),
      picked: [],
    };
  }

  // Whether two outputs share the kept traits, so they can be Blend's two ends
  const matches = (a, b) => keep.every((k) => a.levels[k] === b.levels[k]);

  // A random token; with `like`, one that shares its kept traits
  function randomOutput(draw, like) {
    const pool = like ? OUTPUTS.filter((o) => matches(o, like)) : OUTPUTS;
    return pool[Math.floor(hash(draw, 0, 21) * pool.length)];
  }

  // Blend: A's traits swapped for B's one at a time (shown settings first); each step is the
  // closest real token with the traits swapped so far, and the ends are A and B themselves
  function blendAt({ a, b }, t) {
    const differ = [
      ...shown,
      ...TRAITS.filter((k) => !shown.includes(k)),
    ].filter((k) => a.levels[k] !== b.levels[k]);
    if (t <= 0 || !differ.length) return a;
    if (t >= 1) return b;
    // Between the ends, at least one trait is swapped and at least one is still A's
    const swapped = Math.min(
      differ.length - 1,
      Math.max(1, Math.round(t * differ.length))
    );
    if (!swapped) return a;
    const keys = differ.slice(0, swapped);
    const target = { ...a.levels };
    keys.forEach((k) => (target[k] = b.levels[k]));
    const ends = new Set([a.seed, b.seed]);
    return (
      closest(target, [...keep, ...keys], ends) ??
      closest(target, [...keep, ...keys.slice(-1)], ends) ??
      closest(target, keep, ends)
    );
  }

  const { compass } = project;
  return {
    id: project.id,
    label: project.label,
    // Every view works, molded around the traits
    views: null,
    fixedSize: FIXED_SIZE,
    aspect,
    cellAspect: box,
    settings: shown.map(setting),
    // A short caption under small tiles, e.g. "High · Med · Jumbo · Luxe"
    brief: (o) => brief.map((k) => o.traits[k]).join(" · "),
    copy: {
      "contact-sheet": "Scan many outputs side by side at the same size.",
      grouped: `See outputs sorted into buckets by ${listed(groupings)}.`,
      ...project.copy,
    },

    cell,
    fromId: (id) => OUTPUTS[Number(id.slice(project.prefix.length))],
    tableOutputs: TABLE_OUTPUTS,
    groupings,
    families: FAMILIES,

    map: {
      axes: project.map.axes,
      ticks: { x: MAP_X, y: MAP_Y },
      cells: mapCells,
    },

    variations,

    // Left and right step one trait, up and down the other
    compass: {
      labels: compass.labels,
      step: (output, x, y) =>
        step(
          output,
          [
            [compass.x, x],
            [compass.y, y],
          ].filter(([, d]) => d)
        ),
    },

    dials: dialKeys.map(dial),

    keep,
    matches,
    firstGeneration,
    nextGeneration,
    randomOutput,
    blendAt,
  };
}
