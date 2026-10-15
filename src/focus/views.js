import {
  StripLayout,
  CompassLayout,
  InspectorLayout,
  DialsLayout,
  LineageLayout,
} from "./layouts.jsx";

// Focus's layouts, as the view picker lists them

export const FOCUS_LAYOUTS = [
  {
    id: "strip",
    label: "Strip",
    description: "One output large, with a row of close variations under it.",
    Component: StripLayout,
  },
  {
    id: "compass",
    label: "Compass",
    description:
      "Nudge in a direction: left and right change size, up and down change shade.",
    Component: CompassLayout,
  },
  {
    id: "inspector",
    label: "Inspector",
    description: "Read every property and see how each variation differs.",
    Component: InspectorLayout,
  },
  {
    id: "dials",
    label: "Dials",
    description: "Step one property at a time while the rest stay put.",
    Component: DialsLayout,
  },
  {
    id: "lineage",
    label: "Lineage",
    description:
      "See where you have been as a tree, and branch off from any step.",
    Component: LineageLayout,
  },
];
