import { formatDay } from "../lib/outputs.js";
import { Score } from "../components/Output.jsx";

// The columns a table sorts by: seed, then the example's settings, then score and date.
// Ordered settings sort by their place in the order, not alphabetically.
export const sortKeys = (example) => [
  { key: "seed", label: "Seed", dir: 1 },
  ...example.settings.map((s) => ({
    key: s.key,
    label: s.label,
    dir: s.dir,
    numeric: s.numeric,
    value: s.sortValue ?? s.read,
  })),
  { key: "score", label: "Score", dir: -1, numeric: true },
  { key: "created", label: "Created", dir: -1 },
];

export function sortOutputs(outputs, { key, dir }, example) {
  const value = sortKeys(example).find((k) => k.key === key)?.value;
  const read = value ?? ((o) => o[key]);
  return [...outputs].sort((a, b) => {
    const [x, y] = [read(a), read(b)];
    return ((x > y) - (x < y)) * dir || a.seed - b.seed;
  });
}

export function nextSort(sort, key, example) {
  if (sort.key === key) return { key, dir: -sort.dir };
  return { key, dir: sortKeys(example).find((k) => k.key === key).dir };
}

export const canHover = () => window.matchMedia("(hover: hover)").matches;

const SIZE_BUCKETS = {
  L: "Large · 0.79 and up",
  M: "Medium · 0.67–0.79",
  S: "Small · under 0.67",
};

export const GROUPINGS = {
  day: {
    label: "Day",
    key: (o) => o.created.toISOString().slice(0, 10),
    title: (key, list) => formatDay(list[0].created),
    order: (a, b) => (a < b ? 1 : -1),
    within: (a, b) => b.created - a.created,
  },
  score: {
    label: "Score",
    key: (o) => String(o.score),
    title: (key) => (
      <>
        {key} / 5 <Score value={Number(key)} />
      </>
    ),
    order: (a, b) => b - a,
    within: (a, b) => b.created - a.created,
  },
  size: {
    label: "Size",
    key: (o) => (o.size < 0.67 ? "S" : o.size < 0.79 ? "M" : "L"),
    title: (key) => SIZE_BUCKETS[key],
    order: (a, b) => "LMS".indexOf(a) - "LMS".indexOf(b),
    within: (a, b) => b.size - a.size,
  },
  colors: {
    label: "Colors",
    key: (o) => o.traits.Colors,
    title: (key) => key,
    order: (a, b) => (a < b ? -1 : 1),
    within: (a, b) => b.created - a.created,
  },
};

export function groupOutputs(outputs, groupBy) {
  const grouping = GROUPINGS[groupBy];
  const map = new Map();
  outputs.forEach((o) => {
    const key = grouping.key(o);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(o);
  });
  return [...map.keys()]
    .sort(grouping.order)
    .map((key) => ({ key, list: map.get(key).sort(grouping.within) }));
}
