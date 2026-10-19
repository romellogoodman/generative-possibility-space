import fidenza from "../data/fidenza.json";
import { artBlocks } from "./artblocks.js";

// Fidenza by Tyler Hobbs: 999 real Art Blocks outputs, 5:6

export const FIDENZA = artBlocks({
  id: "fidenza",
  label: "Fidenza",
  byline: "Tyler Hobbs · 999",
  prefix: "f",
  tokens: fidenza,
  bucket: "fidenza",
  // Ordered traits, low to high; Colors has no order
  order: {
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
  },
  shown: ["Density", "Turbulence", "Scale", "Colors"],
  // Density across, Turbulence down
  map: {
    x: "Density",
    y: "Turbulence",
    axes: {
      x: { name: "Density", left: "sparser", right: "denser" },
      y: { name: "Turbulence", top: "calmer", bottom: "wilder" },
    },
  },
  compass: {
    x: "Density",
    y: "Turbulence",
    labels: {
      up: "Calmer",
      down: "Wilder",
      left: "Sparser",
      right: "Denser",
    },
  },
  dials: {
    Density: "sparser → denser",
    Turbulence: "calmer → wilder",
    Scale: "smaller → bigger",
  },
  cycle: "Colors",
  families: [{ key: "Colors" }],
  copy: {
    "parameter-map":
      "Find outputs by their traits: density runs left to right, turbulence top to bottom.",
    compass:
      "Nudge in a direction: left and right change density, up and down change turbulence.",
  },
});
