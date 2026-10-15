export const CANVAS_LAYOUTS = [
  // Big cells, odd columns half a cell lower, like crescents
  {
    id: "staggered",
    label: "Staggered",
    description:
      "Wander a big field of outputs and let your eye catch what stands out.",
    cellSize: 240,
    stagger: true,
  },
  // Tight even grid of same-size squares, captioned when zoomed in
  {
    id: "contact-sheet",
    label: "Contact sheet",
    description:
      "Scan many outputs at the same size, so only the shade differs.",
    cellSize: 150,
    fixedSize: 0.92,
  },
  // A bounded square where position is the settings; zooming in shows finer steps
  {
    id: "parameter-map",
    label: "Parameter map",
    description:
      "Find outputs by their settings: size runs left to right, shade top to bottom.",
    mapped: true,
  },
];

export const CAPTION_ZOOM = 1.6;
