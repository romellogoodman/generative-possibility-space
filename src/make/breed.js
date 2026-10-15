import {
  hash,
  seededOutput,
  lerp,
  SIZE_RANGE,
  SHADE_RANGE,
  clamp,
} from "../lib/outputs.js";

// Breed: generations grown from the outputs you pick

const BREED_SIZE = 9;

export const MUTATIONS = [
  { id: 0.04, label: "Low" },
  { id: 0.08, label: "Medium" },
  { id: 0.16, label: "High" },
];

export function firstGeneration() {
  return {
    outputs: Array.from({ length: BREED_SIZE }, (_, k) =>
      seededOutput(
        Math.floor(hash(k, 0, 11) * 1e6),
        lerp(SIZE_RANGE, hash(k, 0, 12)),
        lerp(SHADE_RANGE, hash(k, 0, 13))
      )
    ),
    picked: [],
  };
}

// A rough bell curve in [-1, 1]
const wobble = () => (Math.random() + Math.random() + Math.random()) / 1.5 - 1;

// Children mix two random parents from the picks, then drift by the mutation amount
export function nextGeneration({ outputs, picked }, mutation) {
  const parents = outputs.filter((o) => picked.includes(o.id));
  const pick = () => parents[Math.floor(Math.random() * parents.length)];
  return {
    outputs: Array.from({ length: BREED_SIZE }, () => {
      const [a, b] = [pick(), pick()];
      const mix = Math.random();
      return {
        ...seededOutput(
          Math.floor(Math.random() * 1e6),
          clamp(
            a.size * mix + b.size * (1 - mix) + wobble() * mutation,
            SIZE_RANGE
          ),
          clamp(
            a.shade * mix + b.shade * (1 - mix) + wobble() * mutation * 1.4,
            SHADE_RANGE
          )
        ),
        parents: [...new Set([a.seed, b.seed])],
      };
    }),
    picked: [],
  };
}
