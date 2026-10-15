---
name: gps
description: Add GPS-style views for browsing generative outputs to a project, so someone can sort through lots of outputs (images, video, audio, text, data) by their settings. Views include a pan/zoom canvas, a sortable table, a focus view with variations, a parameter map, lineage, breed and blend, all behind one top-bar view picker. Use when the user has a generator (a script, notebook or sketch) that makes many outputs and wants to browse, compare or steer them, or says "install the GPS skill", "add GPS to this project" or mentions /gps.
---

# GPS: ways to browse generative outputs

GPS (generative possibility space) is a set of interface patterns for looking through a
big pile of generated outputs. The reference app is
[gps.romellogoodman.com](https://gps.romellogoodman.com). Its source is
`src/App.jsx` and `src/App.scss` in
[romellogoodman/generative-possibility-space](https://github.com/romellogoodman/generative-possibility-space).
In the demo, every output is a grey square: its **size** and **shade** stand in for two
real settings. Your job is to give the user's real outputs the same views, with their
real settings in place of size and shade.

[patterns.md](patterns.md) is the catalog. It lists each view, what it's for, and what it
needs from the project. Read it before choosing views.

## 1. Understand the outputs

Read the project before asking anything. Find out:

- **What one output is**: an image, a video clip, an audio file, a text, a data file.
  Work out how to show it small (a thumbnail, a poster frame, a waveform, the first
  line) and large.
- **Where outputs come from**: files already on disk, or made on demand by calling the
  generator. On-demand generation is what Focus, Lineage, Breed and Blend need.
- **The settings**: the parameters that produce an output (seed, density, speed,
  palette…), and whether each one is continuous, stepped or categorical.
- **What can be measured**: stats worth a column, like duration, cuts, black frames or
  a score.

## 2. Ask two short questions

Ask only what the code can't tell you, with options to tap where you can:

1. **Which two settings matter most?** They become GPS's size and shade: the axes of
   the Parameter map and Compass, and the defaults for sorting and grouping. Suggest
   the two you'd pick and say why.
2. **Which views do you want?** Recommend a starting set from patterns.md that fits
   what the project can do. Folders of finished files suit Staggered, Contact sheet,
   Spreadsheet and Grouped. If the generator can be called with nudged settings, add
   Strip and Compass. Offer the rest as extras.

## 3. Build it

- **Smallest stack that fits.** If the project already has a web front end, add to
  it. Otherwise make one self-contained page, or a small Vite + React app like GPS,
  next to the generator. Don't restructure the user's project.
- **One output model.** Write the equivalent of GPS's `makeOutput`: a function that
  returns `{ id, seed, …settings, …stats, thumb }` for one output. Every view reads
  outputs only through it. Mirror `vary` / `nearby` (variations that nudge two settings)
  only if the generator can make new outputs.
- **One floating top bar, and nothing else on the page.** On the left is a view picker:
  one menu listing every view in columns by group, each view with a one-line
  description. On the right are only the current view's controls (zoom, sort, group by,
  the trail in Focus). New controls go in the bar, not on the page.
- **Name things after the user's settings.** For example, a variation is "density
  denser", not "size +0.12". Show real stats wherever GPS shows size and shade.
- **Keep it fast.** Use thumbnails or proxies for heavy outputs, generate only what's
  visible, and cache what's been made.

Copy the patterns, not the code. Read the matching section of GPS's `src/App.jsx` for
how a view behaves (sections: Canvas mode, Table mode, Focus mode, Make new ones,
Top bar). Then write it for the user's stack and data.

## 4. Check it

Run it and look at every view you added in a browser, at desktop width and about 390px
wide. Click into an output and back, and switch every view from the picker. Then tell
the user which views they have, how to start it, and what you left out and why.

## Example

A coworker pointed GPS at a video-editing script whose outputs are cut-together clips.
Claude used the clip's settings (density, turnover, black frames, motion) in place of
size and shade. Compass variations were labelled "density denser" and "turnover
slower", and the Spreadsheet had a column for each stat: cuts, cuts per second, clips,
black %, hold ms. Each output showed its clip's poster frame, and Play previewed it.
