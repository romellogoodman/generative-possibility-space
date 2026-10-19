import { useState, useEffect } from "react";
import "./App.scss";
import { DEFAULT_EXAMPLE, exampleById, supports } from "./examples/index.js";
import { fitMapCamera, zoomAround, START_CAMERA } from "./canvas/camera.js";
import { CANVAS_LAYOUTS } from "./canvas/layouts.js";
import { CanvasMode } from "./canvas/CanvasMode.jsx";
import { sortKeys, groupOutputs } from "./table/data.jsx";
import { TABLE_LAYOUTS } from "./table/views.js";
import { TableMode } from "./table/TableMode.jsx";
import { focusPath } from "./focus/tree.js";
import { FOCUS_LAYOUTS } from "./focus/views.js";
import { FocusMode } from "./focus/FocusMode.jsx";
import { MUTATIONS } from "./make/breed.js";
import { BreedMode } from "./make/BreedMode.jsx";
import { BlendMode } from "./make/BlendMode.jsx";
import { AboutPage } from "./about/AboutPage.jsx";
import { TopBar } from "./topbar/TopBar.jsx";

// A fresh Breed and Blend for an example
const newBreed = (example, mutation = MUTATIONS[1].id) => ({
  generations: [example.firstGeneration()],
  // The generation on screen; later ones stay in the history until you breed again
  current: 0,
  mutation,
});

// A random other end for Blend, sharing what the example keeps across a blend (Asemica's
// Composition) with `end`; `draws` counts the draws so far
function partner(example, end, draws) {
  let other = example.randomOutput(++draws, end);
  while (other.id === end.id) other = example.randomOutput(++draws, end);
  return { other, draws };
}

function newBlend(example) {
  const a = example.randomOutput(1);
  const { other: b, draws } = partner(example, a, 1);
  return { a, b, t: 0.5, draws };
}

function App() {
  // Which example GPS shows, switched from the settings control in the top bar
  const [exampleId, setExampleId] = useState(DEFAULT_EXAMPLE);
  const example = exampleById(exampleId);
  // "canvas", "table", "breed" or "blend": what sits under Focus
  const [mode, setMode] = useState("canvas");
  const [canvasLayout, setCanvasLayout] = useState(CANVAS_LAYOUTS[0].id);
  const [camera, setCamera] = useState(START_CAMERA);
  const [tableLayout, setTableLayout] = useState(TABLE_LAYOUTS[0].id);
  const [sort, setSort] = useState({ key: "created", dir: -1 });
  const [groupBy, setGroupBy] = useState("day");
  const [closedGroups, setClosedGroups] = useState(new Set());
  const [focusLayout, setFocusLayout] = useState(FOCUS_LAYOUTS[0].id);
  // The About GPS page, opened from the mark at the left of the bar
  const [about, setAbout] = useState(false);
  // Every output visited in Focus, as a tree: { nodes: [{ id, output, parent }], current }.
  // It outlives Focus, so closing and reopening keeps the path and Lineage's branches.
  const [tree, setTree] = useState(null);
  const [focusOpen, setFocusOpen] = useState(false);
  const focus = focusOpen ? tree : null;
  // The output last opened from a browsing view, marked when you come back to it
  const [opened, setOpened] = useState(null);
  const path = focus ? focusPath(focus) : [];
  const focused = focus && {
    output: path.at(-1).output,
    trail: path.slice(0, -1).map((n) => n.output),
  };

  // Opening an output already in the tree returns to it; a new one starts another root
  const openFocus = (output) => {
    setTree((prev) => {
      const nodes = prev?.nodes ?? [];
      const existing = nodes.find((n) => n.output.id === output.id);
      if (existing) return { nodes, current: existing.id };
      const id = nodes.length;
      return { nodes: [...nodes, { id, output, parent: null }], current: id };
    });
    setFocusOpen(true);
  };
  const openFrom = (output) => {
    setOpened(output);
    openFocus(output);
  };
  const closeFocus = () => setFocusOpen(false);
  // Stepping to an output already reached from here reuses that branch
  const focusOn = (output) =>
    setTree(({ nodes, current }) => {
      const existing = nodes.find(
        (n) => n.parent === current && n.output.id === output.id
      );
      if (existing) return { nodes, current: existing.id };
      const id = nodes.length;
      return {
        nodes: [...nodes, { id, output, parent: current }],
        current: id,
      };
    });
  const goTo = (id) => setTree((prev) => ({ ...prev, current: id }));
  const jumpTo = (index) =>
    setTree((prev) => ({ ...prev, current: focusPath(prev)[index].id }));

  // Esc closes About, then leaves Focus
  useEffect(() => {
    if (!focus && !about) return;
    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (about) setAbout(false);
      else closeFocus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focus, about]);

  const groupKey = (key) => `${groupBy}:${key}`;
  const groupKeys = groupOutputs(example.tableOutputs, groupBy, example).map(
    (g) => groupKey(g.key)
  );
  const allGroupsClosed = groupKeys.every((key) => closedGroups.has(key));
  const toggleGroup = (key) =>
    setClosedGroups((prev) => {
      const next = new Set(prev);
      next.has(groupKey(key))
        ? next.delete(groupKey(key))
        : next.add(groupKey(key));
      return next;
    });
  const toggleAllGroups = () =>
    setClosedGroups((prev) => {
      const next = new Set(prev);
      groupKeys.forEach((key) =>
        allGroupsClosed ? next.delete(key) : next.add(key)
      );
      return next;
    });

  const [breed, setBreed] = useState(() => newBreed(example));
  const [blend, setBlend] = useState(() => newBlend(example));
  const { blendAt } = example;

  const updateGeneration = (update) =>
    setBreed((prev) => ({
      ...prev,
      generations: prev.generations.map((g, n) =>
        n === prev.current ? update(g) : g
      ),
    }));
  // Breeding from an earlier generation replaces everything after it
  const addGeneration = (prev, generation) => ({
    ...prev,
    generations: [...prev.generations.slice(0, prev.current + 1), generation],
    current: prev.current + 1,
  });
  const togglePick = (id) =>
    updateGeneration((g) => ({
      ...g,
      picked: g.picked.includes(id)
        ? g.picked.filter((p) => p !== id)
        : [...g.picked, id],
    }));
  const breedNext = () =>
    setBreed((prev) => {
      const shown = prev.generations[prev.current];
      if (!shown.picked.length) return prev;
      return addGeneration(prev, example.nextGeneration(shown, prev.mutation));
    });
  const rewind = (n) => setBreed((prev) => ({ ...prev, current: n }));
  // The blend under the scrubber becomes one end, and the scrubber recentres
  const setBlendEnd = (end) =>
    setBlend((prev) => ({ ...prev, [end]: blendAt(prev, prev.t), t: 0.5 }));
  const newB = () =>
    setBlend((prev) => {
      const { other, draws } = partner(example, prev.a, prev.draws);
      return { ...prev, b: other, draws };
    });

  // Send the output in Focus on to Blend or Breed
  const handOff = (to) => {
    const output = focus.nodes[focus.current].output;
    if (to === "breed")
      setBreed((prev) =>
        addGeneration(
          prev,
          example.nextGeneration(
            { outputs: [output], picked: [output.id] },
            prev.mutation
          )
        )
      );
    else
      setBlend((prev) => {
        const next = { ...prev, [to]: output, t: 0.5 };
        // An other end that can't blend with this one is redrawn so it can
        const end = to === "a" ? "b" : "a";
        if (example.matches && !example.matches(output, prev[end])) {
          const { other, draws } = partner(example, output, prev.draws);
          Object.assign(next, { [end]: other, draws });
        }
        return next;
      });
    closeFocus();
    setMode(to === "breed" ? "breed" : "blend");
  };
  // Open what Blend or Breed made in Focus
  const openMade = () => {
    if (mode === "blend") return openFocus(blendAt(blend, blend.t));
    const shown = breed.generations[breed.current];
    const id = shown.picked.at(-1);
    if (id) openFocus(shown.outputs.find((o) => o.id === id));
  };
  // Zoom by a factor around the middle of the window
  const zoomBy = (factor) =>
    setCamera((prev) =>
      zoomAround(
        prev,
        prev.zoom * factor,
        window.innerWidth / 2,
        window.innerHeight / 2
      )
    );

  const resetView = () =>
    setCamera(canvasLayout === "parameter-map" ? fitMapCamera() : START_CAMERA);

  // On the canvas, + and − zoom and 0 resets the view
  useEffect(() => {
    if (mode !== "canvas" || focusOpen || about) return;
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.target.closest?.("input, textarea"))
        return;
      if (e.key === "+" || e.key === "=") zoomBy(1.25);
      else if (e.key === "-") zoomBy(1 / 1.25);
      else if (e.key === "0") resetView();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const changeView = (group, layout) => {
    setAbout(false);
    if (group === "make") {
      closeFocus();
      setMode(layout);
      return;
    }
    if (group === "focus") {
      setFocusLayout(layout);
      if (tree) setFocusOpen(true);
      else openFocus(example.cell(0, 0));
      return;
    }
    closeFocus();
    setMode(group);
    if (group === "table") setTableLayout(layout);
    if (group !== "canvas") return;
    // The map is a bounded square, so frame it whenever it's entered or left
    if (layout === "parameter-map" || canvasLayout === "parameter-map")
      setCamera(layout === "parameter-map" ? fitMapCamera() : START_CAMERA);
    setCanvasLayout(layout);
  };

  // Switching starts the new example afresh: no visit tree, new Breed and Blend, and a sort or
  // grouping it has. A view it can't show falls back to the first canvas view.
  const switchExample = (id) => {
    if (id === exampleId) return;
    const next = exampleById(id);
    setExampleId(id);
    setTree(null);
    setOpened(null);
    setBreed((prev) => newBreed(next, prev.mutation));
    setBlend(newBlend(next));
    setClosedGroups(new Set());
    if (!sortKeys(next).some((k) => k.key === sort.key))
      setSort({ key: "created", dir: -1 });
    if (!next.groupings.includes(groupBy)) setGroupBy("day");
    const view = focusOpen
      ? focusLayout
      : ({ canvas: canvasLayout, table: tableLayout }[mode] ?? mode);
    if (!supports(next, view)) {
      closeFocus();
      setMode("canvas");
      setCanvasLayout(CANVAS_LAYOUTS[0].id);
      setCamera(START_CAMERA);
      return;
    }
    // Focus carries on, from the new example's first output
    if (focusOpen)
      setTree({
        nodes: [{ id: 0, output: next.cell(0, 0), parent: null }],
        current: 0,
      });
  };

  return (
    <main className="app" style={{ "--cell-aspect": example.cellAspect }}>
      {/* Kept mounted under Focus so the canvas position and table state survive */}
      {mode === "canvas" && (
        <CanvasMode
          example={example}
          onOpen={openFrom}
          openedId={opened?.id}
          layoutId={canvasLayout}
          camera={camera}
          setCamera={setCamera}
        />
      )}
      {mode === "breed" && (
        <BreedMode
          example={example}
          generations={breed.generations}
          current={breed.current}
          onToggle={togglePick}
          onRewind={rewind}
        />
      )}
      {mode === "blend" && (
        <BlendMode
          example={example}
          blend={blend}
          onScrub={(t) => setBlend((prev) => ({ ...prev, t }))}
        />
      )}
      {mode === "table" && (
        <TableMode
          example={example}
          onOpen={openFrom}
          paused={Boolean(focus)}
          layout={tableLayout}
          sort={sort}
          onSort={setSort}
          groupBy={groupBy}
          closed={closedGroups}
          onToggleGroup={toggleGroup}
        />
      )}
      {focus && (
        <FocusMode
          example={example}
          output={focused.output}
          layoutId={focusLayout}
          onFocus={focusOn}
          lineage={{ ...focus, onGoTo: goTo }}
        />
      )}
      {about && <AboutPage />}
      <TopBar
        example={example}
        onExample={switchExample}
        mode={mode}
        onHandOff={handOff}
        onOpenMade={openMade}
        opened={mode === "canvas" ? opened : null}
        onReopen={() => openFocus(opened)}
        onZoom={zoomBy}
        about={about}
        onAbout={() => setAbout((open) => !open)}
        focus={focused}
        onView={changeView}
        onClose={() => (about ? setAbout(false) : closeFocus())}
        onJump={jumpTo}
        canvasLayout={canvasLayout}
        zoom={camera.zoom}
        onResetView={resetView}
        tableLayout={tableLayout}
        sort={sort}
        onSort={setSort}
        groupBy={groupBy}
        onGroupBy={setGroupBy}
        allGroupsClosed={allGroupsClosed}
        onToggleAllGroups={toggleAllGroups}
        focusLayout={focusLayout}
        breed={breed}
        onMutation={(mutation) => setBreed((prev) => ({ ...prev, mutation }))}
        onBreed={breedNext}
        onBlendEnd={setBlendEnd}
        onNewB={newB}
      />
    </main>
  );
}

export default App;
