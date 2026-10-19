import {
  makeOutput,
  vary,
  nearby,
  round2,
  SIZE_RANGE,
  SHADE_RANGE,
} from "../lib/outputs.js";
import { outputFromId, visibleMapCells } from "../canvas/camera.js";
import { COMPASS_STEP, DIALS, dialSteps } from "../focus/tree.js";
import { firstGeneration, nextGeneration } from "../make/breed.js";
import { randomOutput, blendAt } from "../make/blend.js";

// Grey squares: the original stand-in generator. Each square's size and shade are drawn from its seed.

// A numeric setting read straight off the output, written 0.55 everywhere
const numeric = (key, label, range, extra = {}) => ({
  key,
  label,
  name: key,
  numeric: true,
  dir: -1,
  range,
  read: (o) => o[key],
  text: (o) => o[key].toFixed(2),
  cell: (o) => o[key].toFixed(2),
  position: (o) => (o[key] - range[0]) / (range[1] - range[0]),
  ...extra,
});

// How far each Focus layout reaches for its variations, in size and shade
const REACH = {
  strip: [8, 0.14, 0.22],
  inspector: [6, 0.15, 0.24],
  lineage: [6, 0.14, 0.22],
};

// The outputs listed in Table mode: a 10 × 6 block of the canvas
const TABLE_OUTPUTS = [];
for (let gy = 0; gy < 6; gy++) {
  for (let gx = 0; gx < 10; gx++) {
    TABLE_OUTPUTS.push(makeOutput(gx, gy));
  }
}

export const SQUARES = {
  id: "squares",
  label: "Grey squares",
  byline: "The stand-in: size and shade",
  cover: makeOutput(0, 0),
  // What each output is called by its number, and the facts beyond its settings
  idLabel: "Seed",
  facts: [
    { key: "score", label: "Score", kind: "score", dir: -1 },
    { key: "created", label: "Created", kind: "date", dir: -1 },
  ],
  defaultSort: { key: "created", dir: -1 },
  // Every view works with the squares
  views: null,
  // The shape (width / height) views give the cells they lay outputs in
  cellAspect: 1,
  settings: [
    numeric("size", "Size", SIZE_RANGE),
    numeric("shade", "Shade", SHADE_RANGE, { meter: (o) => o.shade }),
  ],
  // Picker copy that differs from the defaults
  copy: {},

  cell: makeOutput,
  fromId: outputFromId,
  tableOutputs: TABLE_OUTPUTS,
  groupings: ["day", "score", "size"],

  map: {
    axes: {
      x: { name: "Size", left: "smaller", right: "bigger" },
      y: { name: "Shade", top: "lighter", bottom: "darker" },
    },
    cells: (camera, width, height) =>
      visibleMapCells(camera, width, height).map(
        ({ i, j, cellSize, output }) => ({
          key: output.id,
          left: i * cellSize,
          top: j * cellSize,
          width: cellSize,
          height: cellSize,
          output,
        })
      ),
  },

  variations: (output, layout) => nearby(output, ...REACH[layout]),

  // Left and right change size, up and down change shade; null past the end of a range
  compass: {
    labels: {
      up: "Lighter",
      down: "Darker",
      left: "Smaller",
      right: "Bigger",
    },
    axes: { x: "size", y: "shade" },
    step(output, x, y) {
      const v = vary(
        output,
        x * COMPASS_STEP.size,
        y * COMPASS_STEP.shade,
        (y + 1) * 3 + x + 1
      );
      const stuck =
        (x && v.size === round2(output.size)) ||
        (y && v.shade === round2(output.shade));
      return stuck ? null : v;
    },
  },

  dials: DIALS.map((dial, d) => ({
    key: dial.key,
    name: dial.name,
    note: dial.note,
    numeric: true,
    steps: (output) => dialSteps(output, dial),
    at: (output, i) =>
      vary(
        output,
        dial.key === "size" ? i * dial.step : 0,
        dial.key === "shade" ? i * dial.step : 0,
        d * 10 + i + 5
      ),
    value: (output) => output[dial.key].toFixed(2),
  })),

  firstGeneration,
  nextGeneration,
  randomOutput,
  blendAt,
};
