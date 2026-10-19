import { SIZE_RANGE, SHADE_RANGE, round2 } from "../lib/outputs.js";

// Focus's visit tree and the constants its layouts step by

export const COMPASS_STEP = { size: 0.12, shade: 0.18 };

export const ARROW_KEYS = {
  ArrowLeft: "-1,0",
  ArrowRight: "1,0",
  ArrowUp: "0,-1",
  ArrowDown: "0,1",
};

export const DIALS = [
  {
    key: "size",
    name: "Size",
    note: "smaller → bigger",
    step: 0.1,
    range: SIZE_RANGE,
  },
  {
    key: "shade",
    name: "Shade",
    note: "lighter → darker",
    step: 0.15,
    range: SHADE_RANGE,
  },
];

// Five steps along one property, with the current value centred where the range allows
export function dialSteps(output, { key, step, range }) {
  const fits = (i) => {
    const value = round2(output[key] + i * step);
    return value >= range[0] && value <= range[1];
  };
  let low = -2;
  while (low < 0 && !fits(low)) low++;
  while (low > -4 && !fits(low + 4) && fits(low - 1)) low--;
  return [0, 1, 2, 3, 4].map((n) => (fits(low + n) ? low + n : null));
}

// Everything visited in Focus is a tree; the trail is the path from its root to the current node
export function focusPath({ nodes, current }) {
  const path = [];
  for (let id = current; id !== null; id = nodes[id].parent)
    path.unshift(nodes[id]);
  return path;
}

export const TRAIL_LENGTH = 5;
