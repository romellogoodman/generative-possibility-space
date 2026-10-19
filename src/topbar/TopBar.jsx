import { useState, useLayoutEffect, useRef } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Ellipsis,
  Maximize2,
  Minus,
  Plus,
  Settings,
} from "lucide-react";
import { Frame } from "../components/Output.jsx";
import { CANVAS_LAYOUTS } from "../canvas/layouts.js";
import { sortKeys, nextSort, groupingOf } from "../table/data.jsx";
import { EXAMPLES, supports } from "../examples/index.js";
import { TABLE_LAYOUTS } from "../table/views.js";
import { FOCUS_LAYOUTS } from "../focus/views.js";
import { Trail } from "../focus/FocusMode.jsx";
import { MUTATIONS } from "../make/breed.js";
import { MenuButton, MenuItem, OptionMenu } from "./Menu.jsx";
import "./TopBar.scss";

// Holds one set of controls; when the set changes, the width eases to fit and the new set fades in
function MorphStage({ contentKey, className = "", children }) {
  const panelRef = useRef(null);
  const [width, setWidth] = useState(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const measure = () => setWidth(panel.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [contentKey]);

  return (
    <div
      className={`top-bar__stage ${className}`}
      style={{ width: width ?? "auto" }}
    >
      <div
        ref={panelRef}
        key={contentKey}
        className="top-bar__panel"
        data-content={contentKey}
      >
        {children}
      </div>
    </div>
  );
}

function SortIcon({ dir }) {
  const Arrow = dir > 0 ? ArrowUp : ArrowDown;
  return <Arrow className="sort-icon" />;
}

function SortMenu({ example, sort, onSort }) {
  const keys = sortKeys(example);
  const current = keys.find((k) => k.key === sort.key);
  return (
    <MenuButton
      title="Sort"
      label={
        <>
          <span className="chip__label">Sort</span> {current.label}{" "}
          <SortIcon dir={sort.dir} />
        </>
      }
    >
      {(close) => (
        <>
          <div className="menu__title">Sort by · pick again to flip</div>
          {keys.map(({ key, label }) => (
            <MenuItem
              key={key}
              checked={key === sort.key}
              hint={key === sort.key ? <SortIcon dir={sort.dir} /> : null}
              onSelect={() => onSort(nextSort(sort, key, example))}
              close={close}
            >
              {label}
            </MenuItem>
          ))}
        </>
      )}
    </MenuButton>
  );
}

// Every view in one menu: the canvas and table layouts, then Focus's, which work on one output
const VIEW_GROUPS = [
  { id: "canvas", title: "See a lot at once", layouts: CANVAS_LAYOUTS },
  { id: "table", title: "Line them up and sort", layouts: TABLE_LAYOUTS },
  {
    id: "focus",
    title: "Explore around one output",
    layouts: FOCUS_LAYOUTS,
  },
  {
    id: "make",
    title: "Make new ones",
    layouts: [
      {
        id: "breed",
        label: "Breed",
        description:
          "Pick the outputs you like, and the next generation grows from them.",
      },
      {
        id: "blend",
        label: "Blend",
        description:
          "Choose two outputs and scrub through the steps between them.",
      },
    ],
  },
];

const MAKE_MODES = ["breed", "blend"];

// The settings control: which example GPS shows
function ExampleMenu({ example, onExample }) {
  return (
    <MenuButton
      label={<Settings className="chip__icon" />}
      title="Settings"
      caret={false}
      className="chip--settings"
    >
      {(close) => (
        <>
          <div className="menu__title">Example</div>
          {EXAMPLES.map((e) => (
            <MenuItem
              key={e.id}
              checked={e.id === example.id}
              onSelect={() => onExample(e.id)}
              close={close}
            >
              {e.label}
            </MenuItem>
          ))}
        </>
      )}
    </MenuButton>
  );
}

// The picker lists only the views the example supports, with its copy where it differs
function ViewPicker({ example, group, layout, onView, label: override }) {
  const label =
    override ??
    VIEW_GROUPS.find((g) => g.id === group).layouts.find((l) => l.id === layout)
      .label;
  return (
    <MenuButton
      label={label}
      title="View"
      className="chip--view"
      menuClassName="menu--views"
      centered
    >
      {(close) =>
        VIEW_GROUPS.map((g) => (
          <div key={g.id} className="menu__column">
            <div className="menu__title">{g.title}</div>
            {g.layouts
              .filter((l) => supports(example, l.id))
              .map((l) => (
                <MenuItem
                  key={l.id}
                  checked={g.id === group && l.id === layout}
                  description={example.copy[l.id] ?? l.description}
                  onSelect={() => onView(g.id, l.id)}
                  close={close}
                >
                  {l.label}
                </MenuItem>
              ))}
          </div>
        ))
      }
    </MenuButton>
  );
}

export function TopBar({
  example,
  onExample,
  mode,
  about,
  onAbout,
  focus,
  onHandOff,
  onOpenMade,
  opened,
  onReopen,
  onZoom,
  onView,
  onClose,
  onJump,
  canvasLayout,
  zoom,
  onResetView,
  tableLayout,
  sort,
  onSort,
  groupBy,
  onGroupBy,
  allGroupsClosed,
  onToggleAllGroups,
  focusLayout,
  breed,
  onMutation,
  onBreed,
  onBlendEnd,
  onNewB,
}) {
  const grouped = tableLayout === "grouped";
  const making = MAKE_MODES.includes(mode);
  const group = focus ? "focus" : making ? "make" : mode;
  const layout = focus
    ? focusLayout
    : making
      ? mode
      : mode === "canvas"
        ? canvasLayout
        : tableLayout;
  const contextKey = about
    ? "about"
    : focus
      ? "focus"
      : mode === "table"
        ? `table-${grouped}`
        : mode;

  let context;
  // Leaving About or Focus says where it lands
  const baseLabel = making
    ? mode[0].toUpperCase() + mode.slice(1)
    : (mode === "canvas" ? CANVAS_LAYOUTS : TABLE_LAYOUTS).find(
        (l) => l.id === (mode === "canvas" ? canvasLayout : tableLayout)
      ).label;
  const backTo =
    about && focus
      ? FOCUS_LAYOUTS.find((l) => l.id === focusLayout).label
      : baseLabel;
  const back = (
    <button
      className="chip chip--back"
      title={`Back to ${backTo} (Esc)`}
      onClick={onClose}
    >
      <ArrowLeft className="chip__icon" />
      <span className="chip__text">{backTo}</span>
    </button>
  );

  if (about) {
    context = back;
  } else if (focus) {
    context = (
      <>
        <Trail trail={focus.trail} current={focus.output} onJump={onJump} />
        <MenuButton
          label={<Ellipsis className="chip__icon" />}
          title="Use this output in…"
          caret={false}
        >
          {(close) => (
            <>
              <div className="menu__title">Use #{focus.output.seed} in…</div>
              <MenuItem onSelect={() => onHandOff("a")} close={close}>
                Blend · make it A
              </MenuItem>
              <MenuItem onSelect={() => onHandOff("b")} close={close}>
                Blend · make it B
              </MenuItem>
              <MenuItem onSelect={() => onHandOff("breed")} close={close}>
                Breed · start a generation from it
              </MenuItem>
            </>
          )}
        </MenuButton>
        {back}
      </>
    );
  } else if (mode === "breed") {
    const picks = breed.generations[breed.current].picked.length;
    context = (
      <>
        <OptionMenu
          title="Mutation"
          label={
            <>
              <span className="chip__label">mutation</span>{" "}
              {MUTATIONS.find((m) => m.id === breed.mutation).label}
            </>
          }
          options={MUTATIONS}
          value={breed.mutation}
          onChange={onMutation}
        />
        <button
          className="chip chip--action"
          disabled={!picks}
          title={picks ? `Breed from ${picks} picked` : "Pick at least one"}
          onClick={onBreed}
        >
          Next<span className="chip__long"> generation</span>
          {picks > 0 && <span className="chip__count">{picks}</span>}
        </button>
        <button
          className="chip"
          disabled={!picks}
          title="Open the last one you picked"
          onClick={onOpenMade}
        >
          <Maximize2 className="chip__icon" />
          <span className="chip__long">Open</span>
        </button>
      </>
    );
  } else if (mode === "blend") {
    context = (
      <>
        <button className="chip" onClick={() => onBlendEnd("a")}>
          Make <span className="chip__long">this </span>A
        </button>
        <button className="chip" onClick={() => onBlendEnd("b")}>
          Make <span className="chip__long">this </span>B
        </button>
        <button className="chip" title="New random B" onClick={onNewB}>
          New B
        </button>
        <button className="chip" title="Open this blend" onClick={onOpenMade}>
          <Maximize2 className="chip__icon" />
          <span className="chip__long">Open</span>
        </button>
      </>
    );
  } else if (mode === "canvas") {
    context = (
      <>
        {opened && (
          <button
            className="chip"
            title="Open the last output you looked at"
            onClick={onReopen}
          >
            <span className="chip__long">Reopen </span>
            <Frame output={opened} className="chip__thumb" />
          </button>
        )}
        <button
          className="chip chip--zoom-step"
          title="Zoom out (−)"
          onClick={() => onZoom(1 / 1.25)}
        >
          <Minus className="chip__icon" />
        </button>
        <button
          className="chip chip--zoom"
          title="Reset view (0)"
          onClick={onResetView}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          className="chip chip--zoom-step"
          title="Zoom in (+)"
          onClick={() => onZoom(1.25)}
        >
          <Plus className="chip__icon" />
        </button>
      </>
    );
  } else if (grouped) {
    context = (
      <>
        <OptionMenu
          title="Group by"
          label={
            <>
              <span className="chip__label">by</span>{" "}
              {groupingOf(example, groupBy).label}
            </>
          }
          options={example.groupings.map((id) => ({
            id,
            label: groupingOf(example, id).label,
          }))}
          value={groupBy}
          onChange={onGroupBy}
        />
        <MenuButton
          label={<Ellipsis className="chip__icon" />}
          title="More"
          caret={false}
        >
          {(close) => (
            <MenuItem onSelect={onToggleAllGroups} close={close}>
              {allGroupsClosed ? "Expand all" : "Collapse all"}
            </MenuItem>
          )}
        </MenuButton>
      </>
    );
  } else {
    context = <SortMenu example={example} sort={sort} onSort={onSort} />;
  }

  return (
    <nav className="top-bar">
      <button
        className={`chip chip--mark${about ? " chip--mark-active" : ""}`}
        title="About GPS"
        aria-pressed={about}
        onClick={onAbout}
      >
        gps
        <span className="chip__dot" />
      </button>
      <span className="top-bar__divider" />
      <MorphStage contentKey="view">
        <ViewPicker
          example={example}
          group={group}
          layout={layout}
          onView={onView}
          label={about ? "About GPS" : undefined}
        />
      </MorphStage>
      <MorphStage contentKey={contextKey} className="top-bar__stage--context">
        {context}
      </MorphStage>
      <span className="top-bar__divider top-bar__divider--settings" />
      <ExampleMenu example={example} onExample={onExample} />
    </nav>
  );
}
