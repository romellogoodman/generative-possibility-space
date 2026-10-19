import { SQUARES } from "./squares.js";
import { FIDENZA } from "./fidenza.js";
import { MERIDIAN } from "./meridian.js";
import { ASEMICA } from "./asemica.js";

// The examples GPS hosts, in the order the settings menu lists them: Grey squares, then
// the rest alphabetically. Each one declares its
// outputs, settings, neighbours and breed/blend rules; the views read everything from it.
export const EXAMPLES = [SQUARES, ASEMICA, FIDENZA, MERIDIAN];

export const DEFAULT_EXAMPLE = SQUARES.id;

export const exampleById = (id) => EXAMPLES.find((e) => e.id === id);

// Whether an example supports a view (`views: null` means every view)
export const supports = (example, layout) =>
  !example.views || example.views.includes(layout);

// One line naming an output's settings, e.g. "size .55 · shade .40"
export const describe = (example, output) =>
  example.settings.map((s) => `${s.name} ${s.text(output)}`).join(" · ");
