import fidenza from "../data/fidenza.json";
import { artBlocks } from "./artblocks.js";

// Fidenza by Tyler Hobbs: 999 real Art Blocks outputs, 5:6

export const FIDENZA = artBlocks({
  id: "fidenza",
  label: "Fidenza",
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
      x: "sparser ← density → denser",
      y: "wilder ← turbulence → calmer",
    },
  },
  compass: {
    x: "Density",
    y: "Turbulence",
    labels: {
      up: "↑ calmer",
      down: "wilder ↓",
      left: "sparser",
      right: "denser",
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
