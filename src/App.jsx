import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Ellipsis,
} from "lucide-react";
import "./App.scss";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

// Deterministic randomness in [0, 1): the same inputs always give the same value.
// (The crescents version only ever returned values below 0.5.)
function hash(x, y, seed = 0) {
  let h = (seed * 2654435761 + x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

// A stand-in generative output, worked out from its grid position
function makeOutput(gridX, gridY) {
  const day = Math.floor(hash(gridX, gridY, 3) * 11);
  const hour = Math.floor(hash(gridX, gridY, 4) * 24);
  const minute = Math.floor(hash(gridX, gridY, 5) * 60);
  return {
    id: `${gridX},${gridY}`,
    gridX,
    gridY,
    seed: Math.floor(hash(gridX, gridY, 7) * 1e6),
    size: 0.55 + hash(gridX, gridY, 1) * 0.35,
    shade: 0.45 + hash(gridX, gridY, 2) * 0.55,
    score: Math.floor(hash(gridX, gridY, 6) * 5) + 1,
    created: new Date(Date.UTC(2026, 9, 1 + day, hour, minute)),
  };
}

function outputFromId(id) {
  const [gridX, gridY] = id.split(",").map(Number);
  return makeOutput(gridX, gridY);
}

// The outputs listed in Table mode: a 10 × 6 block of the canvas
const TABLE_OUTPUTS = [];
for (let gy = 0; gy < 6; gy++) {
  for (let gx = 0; gx < 10; gx++) {
    TABLE_OUTPUTS.push(makeOutput(gx, gy));
  }
}

const formatDate = (date) =>
  date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

const formatDay = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const formatTime = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

// Stand-in for a generative output
function Output({ output, scale = 1 }) {
  return (
    <div
      className="output"
      data-id={output.id}
      style={{
        width: `${output.size * 100 * scale}%`,
        height: `${output.size * 100 * scale}%`,
        "--shade": output.shade,
      }}
    />
  );
}

function Score({ value }) {
  return (
    <span className="score" aria-label={`${value} of 5`}>
      {"●".repeat(value)}
      <span className="score__empty">{"●".repeat(5 - value)}</span>
    </span>
  );
}

function Segmented({ label, options, value, onChange, quiet = false }) {
  return (
    <div
      className={`segmented${quiet ? " segmented--quiet" : ""}`}
      role="tablist"
      aria-label={label}
    >
      {options.map(({ id, label: optionLabel, short }) => (
        <button
          key={id}
          role="tab"
          aria-selected={id === value}
          className={`segmented__option${id === value ? " segmented__option--active" : ""}`}
          onClick={() => onChange(id)}
        >
          {short ? (
            <>
              <span className="segmented__full">{optionLabel}</span>
              <span className="segmented__short">{short}</span>
            </>
          ) : (
            optionLabel
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- Canvas mode ---------- */

const CANVAS_LAYOUTS = [
  // Big cells, odd columns half a cell lower, like crescents
  { id: "staggered", label: "Staggered", cellSize: 240, stagger: true },
  // Tight even grid of same-size squares, captioned when zoomed in
  {
    id: "contact-sheet",
    label: "Contact sheet",
    short: "Contact",
    cellSize: 150,
    fixedSize: 0.92,
  },
];
const CAPTION_ZOOM = 1.6;

// Cells covering the visible area plus a margin, so panning never shows gaps
function visibleCells(camera, width, height, cellSize) {
  const padding = cellSize;
  const startX = Math.floor((camera.x - padding) / cellSize);
  const endX = Math.ceil((camera.x + width / camera.zoom + padding) / cellSize);
  const startY = Math.floor((camera.y - padding) / cellSize);
  const endY = Math.ceil(
    (camera.y + height / camera.zoom + padding) / cellSize
  );

  const cells = [];
  for (let gx = startX; gx <= endX; gx++) {
    for (let gy = startY; gy <= endY; gy++) {
      cells.push(makeOutput(gx, gy));
    }
  }
  return cells;
}

function CanvasMode({ onOpen, layoutId, camera, setCamera }) {
  const containerRef = useRef(null);
  const layout = CANVAS_LAYOUTS.find((l) => l.id === layoutId);
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll to pan, pinch (ctrl + wheel) to zoom around the cursor
  useEffect(() => {
    const container = containerRef.current;

    const handleWheel = (e) => {
      e.preventDefault();
      setCamera((prev) => {
        if (!e.ctrlKey) {
          return {
            ...prev,
            x: prev.x + e.deltaX / prev.zoom,
            y: prev.y + e.deltaY / prev.zoom,
          };
        }
        const zoom = Math.min(
          Math.max(MIN_ZOOM, prev.zoom * Math.exp(-e.deltaY * 0.01)),
          MAX_ZOOM
        );
        const worldX = prev.x + e.clientX / prev.zoom;
        const worldY = prev.y + e.clientY / prev.zoom;
        return {
          x: worldX - e.clientX / zoom,
          y: worldY - e.clientY / zoom,
          zoom,
        };
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [setCamera]);

  // Click and drag to pan; a click without a drag opens the square under it
  const dragRef = useRef(null);
  const handlePointerDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, moved: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      moved: drag.moved + Math.abs(dx) + Math.abs(dy),
    };
    setCamera((prev) => ({
      ...prev,
      x: prev.x - dx / prev.zoom,
      y: prev.y - dy / prev.zoom,
    }));
  };
  const handlePointerUp = (e) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.moved > 4) return;
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest(".output");
    if (target) onOpen(outputFromId(target.dataset.id));
  };

  const { cellSize } = layout;
  const cells = visibleCells(camera, viewport.width, viewport.height, cellSize);
  const showCaptions = layout.fixedSize && camera.zoom >= CAPTION_ZOOM;

  return (
    <>
      <div
        ref={containerRef}
        className="infinite-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => (dragRef.current = null)}
      >
        <div
          className="infinite-canvas__world"
          style={{
            transform: `scale(${camera.zoom}) translate(${-camera.x}px, ${-camera.y}px)`,
          }}
        >
          {cells.map((cell) => {
            const columnOffset =
              layout.stagger && Math.abs(cell.gridX) % 2 === 1
                ? cellSize / 2
                : 0;
            const output = layout.fixedSize
              ? { ...cell, size: layout.fixedSize }
              : cell;
            return (
              <div
                key={`${layoutId}:${cell.id}`}
                className="infinite-canvas__cell"
                style={{
                  left: cell.gridX * cellSize,
                  top: cell.gridY * cellSize + columnOffset,
                  width: cellSize,
                  height: cellSize,
                }}
              >
                <Output output={output} />
                {showCaptions && (
                  <span className="infinite-canvas__caption">
                    #{cell.seed} <Score value={cell.score} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ---------- Table mode ---------- */

const SORT_KEYS = [
  { key: "seed", label: "Seed", dir: 1 },
  { key: "size", label: "Size", dir: -1, numeric: true },
  { key: "shade", label: "Shade", dir: -1, numeric: true },
  { key: "score", label: "Score", dir: -1, numeric: true },
  { key: "created", label: "Created", dir: -1 },
];

function sortOutputs(outputs, { key, dir }) {
  return [...outputs].sort(
    (a, b) => ((a[key] > b[key]) - (a[key] < b[key])) * dir || a.seed - b.seed
  );
}

function nextSort(sort, key) {
  if (sort.key === key) return { key, dir: -sort.dir };
  return { key, dir: SORT_KEYS.find((k) => k.key === key).dir };
}

function SortArrow({ sort, sortKey }) {
  return (
    <span className="sort-arrow">
      {sort.key === sortKey ? (sort.dir > 0 ? "▲" : "▼") : ""}
    </span>
  );
}

function SortableHead({ sort, onSort, withThumb = false }) {
  return (
    <thead>
      <tr>
        {withThumb && <th className="data-table__thumb" />}
        {SORT_KEYS.map(({ key, label, numeric }) => (
          <th
            key={key}
            className={`data-table__head${numeric ? " data-table__head--numeric" : ""}`}
            aria-sort={
              sort.key === key
                ? sort.dir > 0
                  ? "ascending"
                  : "descending"
                : undefined
            }
          >
            <button onClick={() => onSort(nextSort(sort, key))}>
              {label}
              <SortArrow sort={sort} sortKey={key} />
            </button>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function PropertyCells({ output }) {
  return (
    <>
      <td className="data-table__mono">#{output.seed}</td>
      <td className="data-table__mono data-table__numeric">
        {output.size.toFixed(2)}
      </td>
      <td className="data-table__mono data-table__numeric">
        {output.shade.toFixed(2)}
        <span className="meter">
          <span
            className="meter__fill"
            style={{ width: `${output.shade * 100}%` }}
          />
        </span>
      </td>
      <td className="data-table__numeric">
        <Score value={output.score} />
      </td>
      <td>{formatDate(output.created)}</td>
    </>
  );
}

function SpreadsheetLayout({ outputs, sort, onSort, selectedId, onOpen }) {
  const handleKeyDown = (e, output) => {
    const row = e.currentTarget;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(output);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      row.nextElementSibling?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      row.previousElementSibling?.focus();
    }
  };

  return (
    <div className="table-layout">
      <table className="data-table">
        <SortableHead sort={sort} onSort={onSort} withThumb />
        <tbody>
          {sortOutputs(outputs, sort).map((output) => (
            <tr
              key={output.id}
              tabIndex={0}
              className={`data-table__row${output.id === selectedId ? " data-table__row--selected" : ""}`}
              onClick={() => onOpen(output)}
              onKeyDown={(e) => handleKeyDown(e, output)}
            >
              <td className="data-table__thumb">
                <div className="thumb">
                  <Output output={output} />
                </div>
              </td>
              <PropertyCells output={output} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardsLayout({ outputs, sort, selectedId, onOpen }) {
  const highlight = (key) =>
    sort.key === key ? " card__property--sorted" : "";

  return (
    <div className="table-layout">
      <div className="cards">
        {sortOutputs(outputs, sort).map((output) => (
          <button
            key={output.id}
            className={`card${output.id === selectedId ? " card--selected" : ""}`}
            onClick={() => onOpen(output)}
          >
            <div className="card__image">
              <Output output={output} scale={0.85} />
            </div>
            <dl className="card__properties">
              <dt className={highlight("seed")}>Seed</dt>
              <dd className={`data-table__mono${highlight("seed")}`}>
                #{output.seed}
              </dd>
              <dt className={highlight("size")}>Size</dt>
              <dd className={`data-table__mono${highlight("size")}`}>
                {output.size.toFixed(2)}
              </dd>
              <dt className={highlight("shade")}>Shade</dt>
              <dd className={`data-table__mono${highlight("shade")}`}>
                {output.shade.toFixed(2)}
              </dd>
              <dt className={highlight("score")}>Score</dt>
              <dd className={highlight("score")}>
                <Score value={output.score} />
              </dd>
              <dt className={highlight("created")}>Created</dt>
              <dd className={highlight("created")}>
                {formatDate(output.created)}
              </dd>
            </dl>
          </button>
        ))}
      </div>
    </div>
  );
}

const canHover = () => window.matchMedia("(hover: hover)").matches;

function SplitLayout({ outputs, sort, onSort, onOpen, paused }) {
  const sorted = sortOutputs(outputs, sort);
  const [previewId, setPreviewId] = useState(sorted[0].id);
  const preview = sorted.find((o) => o.id === previewId) ?? sorted[0];
  const listRef = useRef(null);

  // Arrow keys move the preview, Enter opens it
  useEffect(() => {
    if (paused) return;
    const handleKeyDown = (e) => {
      if (e.target.closest?.("button")) return;
      const index = sorted.findIndex((o) => o.id === preview.id);
      let next;
      if (e.key === "ArrowDown")
        next = sorted[Math.min(sorted.length - 1, index + 1)];
      else if (e.key === "ArrowUp") next = sorted[Math.max(0, index - 1)];
      else if (e.key === "Enter") onOpen(preview);
      else return;
      e.preventDefault();
      if (next) {
        setPreviewId(next.id);
        listRef.current
          ?.querySelector(`[data-row="${next.id}"]`)
          ?.scrollIntoView({ block: "nearest" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sorted, preview, onOpen, paused]);

  // With touch, the first tap previews a row and the second opens it
  const handleClick = (output) => {
    if (!canHover() && output.id !== preview.id) setPreviewId(output.id);
    else onOpen(output);
  };

  return (
    <div className="split">
      <div className="split__list" ref={listRef}>
        <table className="data-table">
          <SortableHead sort={sort} onSort={onSort} />
          <tbody>
            {sorted.map((output) => (
              <tr
                key={output.id}
                data-row={output.id}
                className={`data-table__row${output.id === preview.id ? " data-table__row--selected" : ""}`}
                onMouseEnter={() => canHover() && setPreviewId(output.id)}
                onClick={() => handleClick(output)}
              >
                <PropertyCells output={output} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <aside className="split__preview">
        <button className="split__image" onClick={() => onOpen(preview)}>
          <span className="split__frame">
            <Output output={preview} />
          </span>
        </button>
        <div className="split__meta">
          <h2 className="split__title">#{preview.seed}</h2>
          <dl className="properties">
            <dt>Size</dt>
            <dd className="data-table__mono">{preview.size.toFixed(2)}</dd>
            <dt>Shade</dt>
            <dd className="data-table__mono">{preview.shade.toFixed(2)}</dd>
            <dt>Score</dt>
            <dd>{preview.score} / 5</dd>
            <dt>Created</dt>
            <dd>{formatDate(preview.created)}</dd>
          </dl>
          <div className="split__actions">
            <button className="pill-button" onClick={() => onOpen(preview)}>
              Open in Focus
            </button>
            <span className="split__hint">
              {canHover()
                ? "↑ ↓ to move · Enter to open"
                : "or tap the row again"}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

const SIZE_BUCKETS = {
  L: "Large · 0.79 and up",
  M: "Medium · 0.67–0.79",
  S: "Small · under 0.67",
};

const GROUPINGS = {
  day: {
    label: "Day",
    key: (o) => o.created.toISOString().slice(0, 10),
    title: (key, list) => formatDay(list[0].created),
    order: (a, b) => (a < b ? 1 : -1),
    within: (a, b) => b.created - a.created,
  },
  score: {
    label: "Score",
    key: (o) => String(o.score),
    title: (key) => (
      <>
        {key} / 5 <Score value={Number(key)} />
      </>
    ),
    order: (a, b) => b - a,
    within: (a, b) => b.created - a.created,
  },
  size: {
    label: "Size",
    key: (o) => (o.size < 0.67 ? "S" : o.size < 0.79 ? "M" : "L"),
    title: (key) => SIZE_BUCKETS[key],
    order: (a, b) => "LMS".indexOf(a) - "LMS".indexOf(b),
    within: (a, b) => b.size - a.size,
  },
};

function groupOutputs(outputs, groupBy) {
  const grouping = GROUPINGS[groupBy];
  const map = new Map();
  outputs.forEach((o) => {
    const key = grouping.key(o);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(o);
  });
  return [...map.keys()]
    .sort(grouping.order)
    .map((key) => ({ key, list: map.get(key).sort(grouping.within) }));
}

function GroupedLayout({
  outputs,
  selectedId,
  onOpen,
  groupBy,
  closed,
  onToggleGroup,
}) {
  const grouping = GROUPINGS[groupBy];
  const groups = useMemo(
    () => groupOutputs(outputs, groupBy),
    [outputs, groupBy]
  );

  const isClosed = (key) => closed.has(`${groupBy}:${key}`);

  return (
    <div className="table-layout">
      <div className="grouped">
        {groups.map(({ key, list }) => {
          const average =
            list.reduce((sum, o) => sum + o.score, 0) / list.length;
          return (
            <section
              key={key}
              className={`group${isClosed(key) ? " group--closed" : ""}`}
            >
              <button
                className="group__header"
                aria-expanded={!isClosed(key)}
                onClick={() => onToggleGroup(key)}
              >
                <span className="group__twisty">▼</span>
                <span className="group__title">
                  {grouping.title(key, list)}
                </span>
                <span className="group__count">{list.length}</span>
                <span className="group__strip" aria-hidden="true">
                  {list.slice(0, 24).map((o) => (
                    <span key={o.id} className="group__strip-item">
                      <Output output={o} />
                    </span>
                  ))}
                </span>
                <span className="group__average">avg {average.toFixed(1)}</span>
              </button>
              {!isClosed(key) && (
                <div className="group__items">
                  {list.map((o) => (
                    <button
                      key={o.id}
                      className={`group-item${o.id === selectedId ? " group-item--selected" : ""}`}
                      onClick={() => onOpen(o)}
                    >
                      <span className="group-item__thumb">
                        <Output output={o} scale={0.85} />
                      </span>
                      <span className="group-item__seed data-table__mono">
                        #{o.seed}
                      </span>
                      <span className="group-item__side">
                        {groupBy !== "score" && <Score value={o.score} />}
                        <span className="group-item__open">Open →</span>
                      </span>
                      <span className="group-item__details">
                        {groupBy === "day"
                          ? formatTime(o.created)
                          : formatDate(o.created)}{" "}
                        · size {o.size.toFixed(2)} · shade {o.shade.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

const TABLE_LAYOUTS = [
  { id: "spreadsheet", label: "Spreadsheet", Component: SpreadsheetLayout },
  { id: "cards", label: "Cards", Component: CardsLayout },
  { id: "split", label: "Split", Component: SplitLayout },
  { id: "grouped", label: "Grouped", Component: GroupedLayout },
];

function TableMode({ onOpen, paused, layout, ...settings }) {
  const [selectedId, setSelectedId] = useState(null);
  const { Component } = TABLE_LAYOUTS.find((l) => l.id === layout);

  const handleOpen = (output) => {
    setSelectedId(output.id);
    onOpen(output);
  };

  return (
    <div className="table-mode">
      <Component
        outputs={TABLE_OUTPUTS}
        selectedId={selectedId}
        onOpen={handleOpen}
        paused={paused}
        {...settings}
      />
    </div>
  );
}

/* ---------- Focus mode ---------- */

const SIZE_RANGE = [0.3, 0.95];
const SHADE_RANGE = [0.1, 1];
const clamp = (value, [min, max]) => Math.min(max, Math.max(min, value));
const round2 = (value) => Math.round(value * 100) / 100;
const short = (value) => value.toFixed(2).replace(/^0/, "");

// A variation of an output: a new seed, with size and shade nudged
function vary(output, dSize, dShade, k) {
  const seed = Math.floor(hash(output.seed, k, 50) * 1e6);
  return {
    id: `v${seed}`,
    seed,
    size: round2(clamp(output.size + dSize, SIZE_RANGE)),
    shade: round2(clamp(output.shade + dShade, SHADE_RANGE)),
    score: Math.floor(hash(seed, 0, 6) * 5) + 1,
    created: new Date(output.created.getTime() + (k + 1) * 97000),
  };
}

// Variations spread around the output, each in a different (size, shade) direction
function nearby(output, count, sizeReach, shadeReach) {
  const variations = [];
  for (let k = 0; k < count; k++) {
    const angle = (k / count + hash(output.seed, k, 10) * 0.08) * 2 * Math.PI;
    const reach = 0.75 + hash(output.seed, k, 20) * 0.5;
    let dSize = Math.cos(angle) * sizeReach * reach;
    let dShade = Math.sin(angle) * shadeReach * reach;
    // Flip directions that would run past the range
    const size = output.size + dSize;
    const shade = output.shade + dShade;
    if (size > SIZE_RANGE[1] || size < SIZE_RANGE[0]) dSize = -dSize;
    if (shade > SHADE_RANGE[1] || shade < SHADE_RANGE[0]) dShade = -dShade;
    variations.push(vary(output, dSize, dShade, k));
  }
  return variations;
}

function Frame({ output, className = "" }) {
  return (
    <div className={`frame ${className}`}>
      <Output output={output} />
    </div>
  );
}

function Delta({ value, digits = 2 }) {
  const rounded = round2(value);
  if (!rounded) return <span className="delta delta--none">±0</span>;
  const amount = digits ? short(Math.abs(rounded)) : Math.abs(rounded);
  return (
    <span className="delta">
      {rounded > 0 ? "+" : "−"}
      {amount}
    </span>
  );
}

function FocusMeta({ output }) {
  return (
    <p className="focus-meta">
      <b className="data-table__mono">#{output.seed}</b>
      <span className="data-table__mono">size {short(output.size)}</span>
      <span className="data-table__mono">shade {short(output.shade)}</span>
      <Score value={output.score} />
      <span>{formatDate(output.created)}</span>
    </p>
  );
}

function Hero({ output, children }) {
  return (
    <div className="focus-hero">
      <Frame key={output.id} output={output} className="focus-hero__image" />
      {children}
    </div>
  );
}

function StripLayout({ output, onFocus }) {
  const variations = nearby(output, 8, 0.14, 0.22);
  return (
    <div className="focus-strip">
      <Hero output={output}>
        <FocusMeta output={output} />
      </Hero>
      <section>
        <p className="focus-label">Nearby variations · click to focus</p>
        <div className="focus-strip__row">
          {variations.map((v) => (
            <button
              key={v.id}
              className="alternative focus-strip__item"
              title={`#${v.seed} · size ${short(v.size)} · shade ${short(v.shade)}`}
              onClick={() => onFocus(v)}
            >
              <Frame output={v} />
              <span className="focus-strip__deltas data-table__mono">
                <span>size</span>
                <Delta value={v.size - output.size} />
                <span>shade</span>
                <Delta value={v.shade - output.shade} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

const COMPASS_STEP = { size: 0.12, shade: 0.18 };
const COMPASS_ARROWS = {
  "-1,-1": "↖",
  "0,-1": "↑",
  "1,-1": "↗",
  "-1,0": "←",
  "1,0": "→",
  "-1,1": "↙",
  "0,1": "↓",
  "1,1": "↘",
};
const ARROW_KEYS = {
  ArrowLeft: "-1,0",
  ArrowRight: "1,0",
  ArrowUp: "0,-1",
  ArrowDown: "0,1",
};

// Neighbours laid out by direction: left/right is size, up/down is shade
function CompassLayout({ output, onFocus }) {
  const cells = [];
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      const dir = `${x},${y}`;
      if (!x && !y) {
        cells.push({ dir, current: true });
        continue;
      }
      const v = vary(
        output,
        x * COMPASS_STEP.size,
        y * COMPASS_STEP.shade,
        (y + 1) * 3 + x + 1
      );
      const stuck =
        (x && v.size === round2(output.size)) ||
        (y && v.shade === round2(output.shade));
      cells.push({ dir, variation: stuck ? null : v });
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = cells.find((c) => c.dir === ARROW_KEYS[e.key])?.variation;
      if (!target) return;
      e.preventDefault();
      onFocus(target);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="focus-compass">
      <div className="focus-compass__dial">
        <span className="focus-compass__axis focus-compass__axis--up">
          ↑ lighter
        </span>
        <span className="focus-compass__axis focus-compass__axis--down">
          darker ↓
        </span>
        <span className="focus-compass__axis focus-compass__axis--left">
          smaller
        </span>
        <span className="focus-compass__axis focus-compass__axis--right">
          bigger
        </span>
        <div className="focus-compass__grid">
          {cells.map(({ dir, current, variation }) => {
            if (current) {
              return (
                <div
                  key={dir}
                  className="focus-compass__cell focus-compass__cell--current"
                >
                  <Frame
                    key={output.id}
                    output={output}
                    className="frame--pop"
                  />
                </div>
              );
            }
            if (!variation) {
              return (
                <div
                  key={dir}
                  className="focus-compass__cell"
                  aria-hidden="true"
                >
                  <div className="frame frame--edge">end of range</div>
                </div>
              );
            }
            return (
              <button
                key={dir}
                className="focus-compass__cell alternative"
                title={`${COMPASS_ARROWS[dir]} #${variation.seed} · size ${short(variation.size)} · shade ${short(variation.shade)}`}
                onClick={() => onFocus(variation)}
              >
                <span className="focus-compass__arrow">
                  {COMPASS_ARROWS[dir]}
                </span>
                <Frame output={variation} />
              </button>
            );
          })}
        </div>
      </div>
      <FocusMeta output={output} />
      <p className="focus-label focus-label--hover-only">
        Arrow keys step in a direction
      </p>
    </div>
  );
}

function RangeMeter({ value, range: [min, max] }) {
  return (
    <span className="range-meter">
      <span
        className="range-meter__fill"
        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
      />
    </span>
  );
}

function InspectorLayout({ output, onFocus }) {
  const variations = nearby(output, 6, 0.15, 0.24);
  const [peekId, setPeekId] = useState(null);
  const peek = variations.find((v) => v.id === peekId);

  return (
    <div className="focus-inspector">
      <div className="focus-inspector__hero">
        <Hero output={output} />
      </div>
      <aside className="focus-inspector__side">
        <section>
          <h3 className="focus-heading">Properties</h3>
          <dl className="properties">
            <dt>Seed</dt>
            <dd className="data-table__mono">#{output.seed}</dd>
            <dt>Size</dt>
            <dd className="focus-inspector__value">
              <span className="data-table__mono">{short(output.size)}</span>
              <RangeMeter value={output.size} range={SIZE_RANGE} />
            </dd>
            <dt>Shade</dt>
            <dd className="focus-inspector__value">
              <span className="data-table__mono">{short(output.shade)}</span>
              <RangeMeter value={output.shade} range={SHADE_RANGE} />
            </dd>
            <dt>Score</dt>
            <dd>
              <Score value={output.score} />
            </dd>
            <dt>Created</dt>
            <dd>{formatDate(output.created)}</dd>
          </dl>
        </section>
        <section>
          <h3 className="focus-heading">
            Alternatives <small>click to focus</small>
          </h3>
          <div
            className="focus-inspector__grid"
            onMouseLeave={() => setPeekId(null)}
          >
            {variations.map((v) => (
              <button
                key={v.id}
                className={`alternative${v.id === peekId ? " alternative--peek" : ""}`}
                aria-label={`Focus #${v.seed}`}
                onMouseEnter={() => setPeekId(v.id)}
                onFocus={() => setPeekId(v.id)}
                onClick={() => onFocus(v)}
              >
                <Frame output={v} />
              </button>
            ))}
          </div>
        </section>
        <section className="focus-inspector__compare">
          <h3 className="focus-heading">Compare</h3>
          {peek ? (
            <div className="compare">
              <span />
              <Frame output={output} className="compare__thumb" />
              <Frame output={peek} className="compare__thumb" />
              <span />
              <span className="compare__key">Seed</span>
              <span className="data-table__mono">{output.seed}</span>
              <span className="data-table__mono">{peek.seed}</span>
              <span />
              <span className="compare__key">Size</span>
              <span className="data-table__mono">{short(output.size)}</span>
              <span className="data-table__mono">{short(peek.size)}</span>
              <Delta value={peek.size - output.size} />
              <span className="compare__key">Shade</span>
              <span className="data-table__mono">{short(output.shade)}</span>
              <span className="data-table__mono">{short(peek.shade)}</span>
              <Delta value={peek.shade - output.shade} />
              <span className="compare__key">Score</span>
              <span>{output.score}</span>
              <span>{peek.score}</span>
              <Delta value={peek.score - output.score} digits={0} />
            </div>
          ) : (
            <p className="focus-label">
              Hover an alternative to compare it with the focused output.
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}

const DIALS = [
  {
    key: "size",
    name: "Size",
    note: "smaller → bigger",
    step: 0.1,
    range: SIZE_RANGE,
  },
  {
    key: "shade",
    name: "Shade",
    note: "lighter → darker",
    step: 0.15,
    range: SHADE_RANGE,
  },
];

// Five steps along one property, with the current value centred where the range allows
function dialSteps(output, { key, step, range }) {
  const fits = (i) => {
    const value = round2(output[key] + i * step);
    return value >= range[0] && value <= range[1];
  };
  let low = -2;
  while (low < 0 && !fits(low)) low++;
  while (low > -4 && !fits(low + 4) && fits(low - 1)) low--;
  return [0, 1, 2, 3, 4].map((n) => (fits(low + n) ? low + n : null));
}

function DialsLayout({ output, onFocus }) {
  return (
    <div className="focus-dials">
      <Hero output={output}>
        <FocusMeta output={output} />
      </Hero>
      <section
        className="focus-dials__rows"
        aria-label="Variations, one property at a time"
      >
        {DIALS.map((dial, d) => {
          const [min, max] = dial.range;
          return (
            <div key={dial.key} className="dial">
              <div className="dial__header">
                <span className="dial__name">{dial.name}</span>
                <span className="dial__note">{dial.note}</span>
              </div>
              <div className="dial__row">
                {dialSteps(output, dial).map((i, n) => {
                  if (i === null)
                    return (
                      <div key={n} className="dial__step dial__step--empty" />
                    );
                  if (i === 0) {
                    return (
                      <div
                        key={n}
                        className="dial__step dial__step--current"
                        title="Current"
                      >
                        <Frame output={output} />
                        <span className="dial__value">
                          {short(output[dial.key])}
                        </span>
                      </div>
                    );
                  }
                  const v = vary(
                    output,
                    dial.key === "size" ? i * dial.step : 0,
                    dial.key === "shade" ? i * dial.step : 0,
                    d * 10 + i + 5
                  );
                  return (
                    <button
                      key={n}
                      className="dial__step alternative"
                      title={`#${v.seed} · ${dial.key} ${short(v[dial.key])}`}
                      onClick={() => onFocus(v)}
                    >
                      <Frame output={v} />
                      <span className="dial__value">{short(v[dial.key])}</span>
                    </button>
                  );
                })}
              </div>
              <div
                className="dial__track"
                title={`Where this output sits in the full ${dial.key} range`}
              >
                <span>{short(min)}</span>
                <span className="dial__bar">
                  <i
                    style={{
                      left: `${((output[dial.key] - min) / (max - min)) * 100}%`,
                    }}
                  />
                </span>
                <span>{short(max)}</span>
              </div>
            </div>
          );
        })}
        <p className="focus-label focus-label--wide-only">
          Each row changes one thing and keeps the rest. Click any step to focus
          it.
        </p>
      </section>
    </div>
  );
}

const FOCUS_LAYOUTS = [
  { id: "strip", label: "Strip", Component: StripLayout },
  { id: "compass", label: "Compass", Component: CompassLayout },
  { id: "inspector", label: "Inspector", Component: InspectorLayout },
  { id: "dials", label: "Dials", Component: DialsLayout },
];

const TRAIL_LENGTH = 5;

function Trail({ trail, current, onJump }) {
  if (!trail.length) return null;
  const from = Math.max(0, trail.length - TRAIL_LENGTH);
  return (
    <div className="trail">
      {from > 0 && (
        <span className="trail__more" title={`${from} earlier`}>
          +{from}
        </span>
      )}
      {trail.slice(from).map((o, n) => (
        <span key={`${o.id}-${from + n}`} className="trail__step">
          <button
            className="trail__crumb"
            title={`Back to #${o.seed}`}
            onClick={() => onJump(from + n)}
          >
            <Frame output={o} />
          </button>
          <span className="trail__separator">
            <ChevronRight />
          </span>
        </span>
      ))}
      <span
        className="trail__crumb trail__crumb--current"
        title={`#${current.seed} (current)`}
      >
        <Frame output={current} />
      </span>
    </div>
  );
}

function FocusMode({ output, layoutId, onFocus }) {
  const { Component } = FOCUS_LAYOUTS.find((l) => l.id === layoutId);
  return (
    <div className="focus-mode">
      <div className="focus-mode__body">
        <Component output={output} onFocus={onFocus} />
      </div>
    </div>
  );
}

/* ---------- Top bar ---------- */

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
      <div ref={panelRef} key={contentKey} className="top-bar__panel">
        {children}
      </div>
    </div>
  );
}

// A pill button that opens a small menu below it
function MenuButton({ label, title, caret = true, children }) {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState(null);
  const close = () => setPosition(null);

  const toggle = () => {
    if (position) return close();
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 200),
    });
  };

  useEffect(() => {
    if (!position) return;
    const handlePointerDown = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      )
        close();
    };
    // Captured first, so Esc closes the menu without also leaving Focus
    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      close();
      buttonRef.current.focus();
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [position]);

  useEffect(() => {
    if (position) menuRef.current?.querySelector("button")?.focus();
  }, [position]);

  return (
    <>
      <button
        ref={buttonRef}
        className="chip"
        title={title}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        onClick={toggle}
      >
        {label}
        {caret && (
          <span className="chip__caret">
            <ChevronDown />
          </span>
        )}
      </button>
      {position &&
        createPortal(
          <div ref={menuRef} className="menu" role="menu" style={position}>
            {children(close)}
          </div>,
          document.body
        )}
    </>
  );
}

function MenuItem({ checked, hint, onSelect, close, children }) {
  return (
    <button
      role={checked === undefined ? "menuitem" : "menuitemradio"}
      aria-checked={checked}
      className="menu__item"
      onClick={() => {
        onSelect();
        close();
      }}
    >
      <span className="menu__check">{checked && <Check />}</span>
      {children}
      {hint && <span className="menu__hint">{hint}</span>}
    </button>
  );
}

function OptionMenu({ title, options, value, onChange, label, hints }) {
  return (
    <MenuButton label={label} title={title}>
      {(close) => (
        <>
          <div className="menu__title">{title}</div>
          {options.map((option, n) => (
            <MenuItem
              key={option.id}
              checked={option.id === value}
              hint={hints?.[n]}
              onSelect={() => onChange(option.id)}
              close={close}
            >
              {option.label}
            </MenuItem>
          ))}
        </>
      )}
    </MenuButton>
  );
}

function SortIcon({ dir }) {
  const Arrow = dir > 0 ? ArrowUp : ArrowDown;
  return <Arrow className="sort-icon" />;
}

function SortMenu({ sort, onSort }) {
  const current = SORT_KEYS.find((k) => k.key === sort.key);
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
          {SORT_KEYS.map(({ key, label }) => (
            <MenuItem
              key={key}
              checked={key === sort.key}
              hint={key === sort.key ? <SortIcon dir={sort.dir} /> : null}
              onSelect={() => onSort(nextSort(sort, key))}
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

function TopBar({
  mode,
  onModeChange,
  focus,
  onBack,
  onJump,
  canvasLayout,
  onCanvasLayout,
  zoom,
  onResetView,
  tableLayout,
  onTableLayout,
  sort,
  onSort,
  groupBy,
  onGroupBy,
  allGroupsClosed,
  onToggleAllGroups,
  focusLayout,
  onFocusLayout,
}) {
  const modeLabel = MODES.find((m) => m.id === mode).label;
  const grouped = tableLayout === "grouped";
  const contextKey = focus
    ? "focus"
    : mode === "table"
      ? `table-${grouped}`
      : mode;

  let context;
  if (focus) {
    context = (
      <>
        <Trail trail={focus.trail} current={focus.output} onJump={onJump} />
        <OptionMenu
          title="Focus layout"
          label={FOCUS_LAYOUTS.find((l) => l.id === focusLayout).label}
          options={FOCUS_LAYOUTS}
          value={focusLayout}
          onChange={onFocusLayout}
          hints={["1", "2", "3", "4"]}
        />
      </>
    );
  } else if (mode === "canvas") {
    context = (
      <>
        <Segmented
          label="Canvas layout"
          options={CANVAS_LAYOUTS}
          value={canvasLayout}
          onChange={onCanvasLayout}
          quiet
        />
        <button
          className="chip chip--zoom"
          title="Reset view"
          onClick={onResetView}
        >
          {Math.round(zoom * 100)}%
        </button>
      </>
    );
  } else {
    context = (
      <>
        <OptionMenu
          title="Table layout"
          label={TABLE_LAYOUTS.find((l) => l.id === tableLayout).label}
          options={TABLE_LAYOUTS}
          value={tableLayout}
          onChange={onTableLayout}
        />
        {grouped ? (
          <>
            <OptionMenu
              title="Group by"
              label={
                <>
                  <span className="chip__label">by</span>{" "}
                  {GROUPINGS[groupBy].label}
                </>
              }
              options={Object.entries(GROUPINGS).map(([id, g]) => ({
                id,
                label: g.label,
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
        ) : (
          <SortMenu sort={sort} onSort={onSort} />
        )}
      </>
    );
  }

  return (
    <nav className="top-bar">
      <MorphStage contentKey={focus ? "back" : "modes"}>
        {focus ? (
          <button
            className="chip chip--back"
            title="Back (Esc)"
            onClick={onBack}
          >
            <ArrowLeft className="chip__icon" />{" "}
            <span className="chip__text">{modeLabel}</span>
          </button>
        ) : (
          <Segmented
            label="Mode"
            options={MODES}
            value={mode}
            onChange={onModeChange}
          />
        )}
      </MorphStage>
      <MorphStage contentKey={contextKey} className="top-bar__stage--context">
        {context}
      </MorphStage>
    </nav>
  );
}

/* ---------- App ---------- */

const MODES = [
  { id: "canvas", label: "Canvas" },
  { id: "table", label: "Table" },
];

const START_CAMERA = { x: 0, y: 0, zoom: 1 };

function App() {
  const [mode, setMode] = useState(MODES[0].id);
  const [canvasLayout, setCanvasLayout] = useState(CANVAS_LAYOUTS[0].id);
  const [camera, setCamera] = useState(START_CAMERA);
  const [tableLayout, setTableLayout] = useState(TABLE_LAYOUTS[0].id);
  const [sort, setSort] = useState({ key: "created", dir: -1 });
  const [groupBy, setGroupBy] = useState("day");
  const [closedGroups, setClosedGroups] = useState(new Set());
  const [focusLayout, setFocusLayout] = useState(FOCUS_LAYOUTS[0].id);
  // The output open in Focus, and the ones looked at before it
  const [focus, setFocus] = useState(null);

  const openFocus = (output) => setFocus({ output, trail: [] });
  const focusOn = (output) =>
    setFocus((prev) => ({ output, trail: [...prev.trail, prev.output] }));
  const jumpTo = (index) =>
    setFocus((prev) => ({
      output: prev.trail[index],
      trail: prev.trail.slice(0, index),
    }));

  // Esc leaves Focus; 1–4 pick a Focus layout
  useEffect(() => {
    if (!focus) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setFocus(null);
      const layout = FOCUS_LAYOUTS[Number(e.key) - 1];
      if (layout) setFocusLayout(layout.id);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focus]);

  const groupKey = (key) => `${groupBy}:${key}`;
  const groupKeys = groupOutputs(TABLE_OUTPUTS, groupBy).map((g) =>
    groupKey(g.key)
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

  const changeMode = (id) => {
    setFocus(null);
    setMode(id);
  };

  return (
    <main className="app">
      {/* Kept mounted under Focus so the canvas position and table state survive */}
      {mode === "canvas" ? (
        <CanvasMode
          onOpen={openFocus}
          layoutId={canvasLayout}
          camera={camera}
          setCamera={setCamera}
        />
      ) : (
        <TableMode
          onOpen={openFocus}
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
          output={focus.output}
          layoutId={focusLayout}
          onFocus={focusOn}
        />
      )}
      <TopBar
        mode={mode}
        onModeChange={changeMode}
        focus={focus}
        onBack={() => setFocus(null)}
        onJump={jumpTo}
        canvasLayout={canvasLayout}
        onCanvasLayout={setCanvasLayout}
        zoom={camera.zoom}
        onResetView={() => setCamera(START_CAMERA)}
        tableLayout={tableLayout}
        onTableLayout={setTableLayout}
        sort={sort}
        onSort={setSort}
        groupBy={groupBy}
        onGroupBy={setGroupBy}
        allGroupsClosed={allGroupsClosed}
        onToggleAllGroups={toggleAllGroups}
        focusLayout={focusLayout}
        onFocusLayout={setFocusLayout}
      />
    </main>
  );
}

export default App;
