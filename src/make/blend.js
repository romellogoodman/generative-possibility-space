import {
  hash,
  seededOutput,
  lerp,
  SIZE_RANGE,
  SHADE_RANGE,
} from "../lib/outputs.js";

// Blend: the steps between two outputs

export const BLEND_STEPS = 9;

export function randomOutput(draw) {
  return seededOutput(
    Math.floor(hash(draw, 0, 21) * 1e6),
    lerp(SIZE_RANGE, hash(draw, 0, 22)),
    lerp(SHADE_RANGE, hash(draw, 0, 23))
  );
}

// The output t of the way from A to B; its seed comes from both ends, and the ends are A and B
export function blendAt({ a, b }, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return seededOutput(
    Math.floor(hash(a.seed, b.seed, Math.round(t * 100)) * 1e6),
    a.size + (b.size - a.size) * t,
    a.shade + (b.shade - a.shade) * t
  );
}
