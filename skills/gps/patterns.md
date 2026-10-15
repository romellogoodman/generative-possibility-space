# GPS patterns

Fourteen views in four groups, as GPS's view picker lists them. Each entry says what the
view is for, what it needs from the project, and how GPS builds it. In GPS, "size" and
"shade" stand in for the user's two most important settings.

**Needs** uses three levels:

- **files**: works on outputs that already exist.
- **settings**: needs each output's settings as numbers.
- **generator**: needs to call the generator with chosen settings to make new outputs.

## See a lot at once

| View          | For                                                                              | Needs                                | In GPS                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Staggered     | Wander a big field of outputs and let your eye catch what stands out.            | files                                | Infinite pan/zoom canvas of big cells; odd columns sit half a cell lower. Drag to pan, pinch or ctrl+scroll to zoom, click to open in Focus. |
| Contact sheet | Scan many outputs at the same size, so only the content differs.                 | files                                | Same canvas, a tight even grid of same-size thumbnails, captioned when zoomed in.                                                            |
| Parameter map | Find outputs by their settings: one runs left to right, the other top to bottom. | settings (generator for finer steps) | A bounded square. Position maps to two settings, and zooming in subdivides into finer steps. Axis labels sit on the edges.                   |

## Line them up and sort

| View        | For                                                      | Needs    | In GPS                                                                                                           |
| ----------- | -------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| Spreadsheet | Sort and compare every property, one output per row.     | settings | A table with a thumbnail and a column per setting or stat. Click a header to sort.                               |
| Cards       | Browse big previews with their details underneath.       | files    | A grid of cards, each a large thumbnail plus its key properties.                                                 |
| Split       | Skim a long list while a large preview follows along.    | files    | A list on the left and a large preview on the right that follows hover or selection.                             |
| Grouped     | See outputs sorted into buckets by a setting or by date. | settings | Collapsible groups, each with a summary (count, mini strip, average score), and a "group by" control in the bar. |

## Explore around one output

All of these open on one output. Clicking any output elsewhere opens it here. Close it
with Esc or the X in the bar. Everything visited forms a tree, and the bar shows the
path to the current output as a trail.

| View      | For                                                                      | Needs                               | In GPS                                                                                                                |
| --------- | ------------------------------------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Strip     | One output large, with a row of close variations under it.               | generator                           | A hero output plus 8 variations from `nearby`, each labelled with its change in each setting.                         |
| Compass   | Nudge in a direction: one setting left and right, the other up and down. | generator                           | A 3×3 grid with the current output in the centre and a neighbour in each direction. Arrow keys step.                  |
| Inspector | Read every property and see how each variation differs.                  | settings (generator for variations) | The hero output, its properties with range meters, and variations with their differences.                             |
| Dials     | Step one property at a time while the rest stay put.                     | generator                           | One row of five steps per setting, with the current value centred.                                                    |
| Lineage   | See where you've been as a tree, and branch off from any step.           | generator                           | The hero, 6 variations (a dot marks ones already visited), and the visit tree beside them. Click any node to go back. |

## Make new ones

| View  | For                                                                 | Needs     | In GPS                                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Breed | Pick the outputs you like, and the next generation grows from them. | generator | A 3×3 grid; pick favourites, then press Breed in the bar. Children mix two picked parents and drift by a mutation amount (Low / Medium / High). A history of generations lets you go back. |
| Blend | Choose two outputs and scrub through the steps between them.        | generator | A and B at the ends, a large preview between them, a slider and 9 steps. Make this A, Make this B and New B sit in the bar.                                                                |

## The top bar

- **Left:** a small `gps` mark opens an About page. After it comes the view picker: a
  filled chip naming the current view, which opens a centred menu with one column per
  group. Each item has its name and a grey one-line description, taken from the "For"
  column above. On phones the menu becomes one scrolling column.
- **Right:** only the current view's controls. GPS shows zoom % on the canvases, Sort on
  lists, "by …" and "…" on Grouped, the trail and X in Focus, Mutation and Breed in
  Breed, and Make A, Make B and New B in Blend.
- The bar is a pill floating at the top centre. When the view changes, its width eases
  to fit the new controls.
