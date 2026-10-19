import { Fragment, useState, useEffect, useRef, useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatDate, formatTime } from "../lib/outputs.js";
import { Output, Score } from "../components/Output.jsx";
import {
  sortKeys,
  sortOutputs,
  nextSort,
  canHover,
  GROUPINGS,
  groupOutputs,
} from "./data.jsx";

function SortArrow({ sort, sortKey }) {
  return (
    <span className="sort-arrow">
      {sort.key === sortKey ? (sort.dir > 0 ? "▲" : "▼") : ""}
    </span>
  );
}

function SortableHead({ example, sort, onSort, withThumb = false }) {
  return (
    <thead>
      <tr>
        {withThumb && <th className="data-table__thumb" />}
        {sortKeys(example).map(({ key, label, numeric }) => (
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
            <button onClick={() => onSort(nextSort(sort, key, example))}>
              {label}
              <SortArrow sort={sort} sortKey={key} />
            </button>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function PropertyCells({ output, example }) {
  return (
    <>
      <td className="data-table__mono">#{output.seed}</td>
      {example.settings.map((s) => (
        <td
          key={s.key}
          className={`data-table__mono${s.numeric ? " data-table__numeric" : ""}`}
        >
          {s.cell(output)}
          {s.meter && (
            <span className="meter">
              <span
                className="meter__fill"
                style={{ width: `${s.meter(output) * 100}%` }}
              />
            </span>
          )}
        </td>
      ))}
      <td className="data-table__numeric">
        <Score value={output.score} />
      </td>
      <td>{formatDate(output.created)}</td>
    </>
  );
}

export function SpreadsheetLayout({
  example,
  outputs,
  sort,
  onSort,
  selectedId,
  onOpen,
}) {
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
        <SortableHead example={example} sort={sort} onSort={onSort} withThumb />
        <tbody>
          {sortOutputs(outputs, sort, example).map((output) => (
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
              <PropertyCells output={output} example={example} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardsLayout({ example, outputs, sort, selectedId, onOpen }) {
  const highlight = (key) =>
    sort.key === key ? " card__property--sorted" : "";

  return (
    <div className="table-layout">
      <div className="cards">
        {sortOutputs(outputs, sort, example).map((output) => (
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
              {example.settings.map((s) => (
                <Fragment key={s.key}>
                  <dt className={highlight(s.key)}>{s.label}</dt>
                  <dd className={`data-table__mono${highlight(s.key)}`}>
                    {s.cell(output)}
                  </dd>
                </Fragment>
              ))}
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

export function SplitLayout({
  example,
  outputs,
  sort,
  onSort,
  onOpen,
  paused,
}) {
  const sorted = sortOutputs(outputs, sort, example);
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
          <SortableHead example={example} sort={sort} onSort={onSort} />
          <tbody>
            {sorted.map((output) => (
              <tr
                key={output.id}
                data-row={output.id}
                className={`data-table__row${output.id === preview.id ? " data-table__row--selected" : ""}`}
                onMouseEnter={() => canHover() && setPreviewId(output.id)}
                onClick={() => handleClick(output)}
              >
                <PropertyCells output={output} example={example} />
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
            {example.settings.map((s) => (
              <Fragment key={s.key}>
                <dt>{s.label}</dt>
                <dd className="data-table__mono">{s.cell(preview)}</dd>
              </Fragment>
            ))}
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

export function GroupedLayout({
  example,
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
                          : formatDate(o.created)}
                        {example.settings
                          .map((s) => ` · ${s.name} ${s.cell(o)}`)
                          .join("")}
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
