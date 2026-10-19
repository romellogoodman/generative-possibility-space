import asemica from "../data/asemica.json";
import { artBlocks } from "./artblocks.js";

// Asemica by Emily Edelman, Dima Ofman and Andrew Badr: 980 real Art Blocks outputs, 4:5.
// Its licence is plain copyright: it's shown while the artists are asked, and comes down if
// they'd rather it didn't. Its previews are the Art Blocks thumbnails, not files in the bucket.

export const ASEMICA = artBlocks({
  id: "asemica",
  label: "Asemica",
  prefix: "a",
  tokens: asemica,
  bucket: null,
  order: {
    // 3 counts as 4 and "25 (pull)" as 25, leaving four grids
    Grid: ["1", "4", "9", "25"],
    // Mixed has no place, so its 15 tokens stay off the map and the Margin dial
    Margin: ["Negative", "Small", "Medium"],
    Paper: ["Linen", "Grain", "Speckled"],
  },
  fold: { Grid: { 3: "4", "25 (pull)": "25" } },
  shown: ["Grid", "Margin", "Paper", "Composition", "Background Color"],
  brief: ["Grid", "Margin", "Composition"],
  // Grid across, Margin down
  map: {
    x: "Grid",
    y: "Margin",
    axes: {
      x: "fewer ← grid → more",
      y: "more margin ← margin → less margin",
    },
  },
  compass: {
    x: "Grid",
    y: "Margin",
    labels: {
      up: "↑ less margin",
      down: "more margin ↓",
      left: "fewer",
      right: "more",
    },
  },
  dials: {
    Margin: "less → more",
    Paper: "linen → speckled",
    Grid: "fewer → more",
  },
  cycle: "Background Color",
  families: [{ key: "Composition" }, { key: "Background Color" }],
  // Breed children and both Blend ends share one Composition
  keep: ["Composition"],
  copy: {
    "parameter-map":
      "Find outputs by their traits: grid runs left to right, margin top to bottom.",
    compass:
      "Nudge in a direction: left and right change the grid, up and down change the margin.",
  },
});
