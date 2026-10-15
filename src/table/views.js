import {
  SpreadsheetLayout,
  CardsLayout,
  SplitLayout,
  GroupedLayout,
} from "./layouts.jsx";

// Table's layouts, as the view picker lists them

export const TABLE_LAYOUTS = [
  {
    id: "spreadsheet",
    label: "Spreadsheet",
    description: "Sort and compare every property, one output per row.",
    Component: SpreadsheetLayout,
  },
  {
    id: "cards",
    label: "Cards",
    description: "Browse big previews with their details underneath.",
    Component: CardsLayout,
  },
  {
    id: "split",
    label: "Split",
    description: "Skim a long list while a large preview follows along.",
    Component: SplitLayout,
  },
  {
    id: "grouped",
    label: "Grouped",
    description: "See outputs sorted into buckets by day, score or size.",
    Component: GroupedLayout,
  },
];
