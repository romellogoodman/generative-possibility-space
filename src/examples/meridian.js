import meridian from "../data/meridian.json";
import { artBlocks } from "./artblocks.js";

// Meridian by Matt DesLauriers: 1,000 real Art Blocks outputs, tall 9:16

export const MERIDIAN = artBlocks({
  id: "meridian",
  label: "Meridian",
  prefix: "m",
  tokens: meridian,
  bucket: "meridian",
  // Ordered traits, low to high; Style, Palette and Structure have no order
  order: {
    Zoom: ["Close", "Medium", "Far"],
    Chromaticity: ["Monochrome", "Duochrome", "Trichrome", "Polychrome"],
    // Gradual's place between Low and Standard is a guess from its name
    Frequency: ["Low", "Gradual", "Standard", "High"],
  },
  shown: ["Zoom", "Chromaticity", "Frequency", "Style"],
  // Zoom across, Chromaticity down: every one of the 12 pairs has tokens
  map: {
    x: "Zoom",
    y: "Chromaticity",
    axes: {
      x: "closer ← zoom → farther",
      y: "more colors ← chromaticity → fewer colors",
    },
  },
  compass: {
    x: "Zoom",
    y: "Chromaticity",
    labels: {
      up: "↑ fewer colors",
      down: "more colors ↓",
      left: "closer",
      right: "farther",
    },
  },
  dials: {
    Zoom: "closer → farther",
    Frequency: "lower → higher",
    Chromaticity: "fewer colors → more",
  },
  cycle: "Style",
  families: [
    { key: "Style" },
    // Only Paletted and Prime tokens have a named palette; the rest are "Other"
    { key: "Palette", only: (o) => o.traits.Palette !== "Other" },
    { key: "Structure" },
  ],
  copy: {
    "parameter-map":
      "Find outputs by their traits: zoom runs left to right, chromaticity top to bottom.",
    compass:
      "Nudge in a direction: left and right change zoom, up and down change chromaticity.",
  },
});
