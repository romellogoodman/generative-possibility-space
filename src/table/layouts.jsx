import { Fragment, useState, useEffect, useRef, useMemo } from "react";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { formatDate, formatTime } from "../lib/outputs.js";
import { Output, Score, Fact, Value } from "../components/Output.jsx";
import { SaveButton } from "../components/Saved.jsx";
import {
  sortKeys,
  sortOutputs,
  sortPhrase,
  nextSort,
  canHover,
  groupingOf,
  groupOutputs,
} from "./data.jsx";

function SortArrow({ sort, sortKey }) {
  if (sort.key !== sortKey) return <span className="sort-arrow" />;
  const Arrow = sort.dir > 0 ? ArrowUp : ArrowDown;
  return <Arrow className="sort-arrow" />;
}

// Over a table: which example and how many, and the sort as you'd say it
function TableHeading({ example, count, sort }) {
  const current = sortKeys(example).find((k) => k.key === sort.key);
  return (
    <div className="table-heading">
      <span>
        <b>{example.label}</b>
        <span className="table-heading__count">
          {" "}
          · {count}
          {example.count
            ? ` of ${example.count.toLocaleString("en-US")}`
            : ""}{" "}
          outputs
        </span>
      </span>
      <span className="table-heading__sort">
        {sortPhrase(sort, example) ?? (
          <>
            {current?.label} <SortArrow sort={sort} sortKey={sort.key} />
          </>
        )}
      </span>
    </div>
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
            className={`data-table__head${numeric && key !== "seed" ? " data-table__head--numeric" : ""}`}
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
        <th className="data-table__head data-table__head--save">
          <span>Saved</span>
        </th>
      </tr>
    </thead>
  );
}

// A setting in a cell: numbers right-aligned in mono, a family's value as a tag, words plain
function SettingCell({ setting, output }) {
  return (
    <td className={setting.numeric ? "data-table__numeric" : undefined}>
      {setting.tag ? (
        <span className="tag">{setting.cell(output)}</span>
      ) : (
        <Value setting={setting} output={output} />
      )}
      {setting.meter && (
        <span className="meter">
          <span
            className="meter__fill"
            style={{ width: `${setting.meter(output) * 100}%` }}
          />
        </span>
      )}
    </td>
  );
}

function PropertyCells({ output, example }) {
  return (
    <>
      <td className="data-table__id num">#{output.seed}</td>
      {example.settings.map((s) => (
        <SettingCell key={s.key} setting={s} output={output} />
      ))}
      {example.facts.map((f) => (
        <td
          key={f.key}
          className={
            f.kind === "score" ? "data-table__score" : "data-table__date"
          }
        >
          <Fact fact={f} output={output} />
        </td>
      ))}
      <td className="data-table__save">
        <SaveButton output={output} />
      </td>
    </>
  );
}

// On a phone a row is two lines: the number and the date you scan, the settings underneath
function RowList({ example, outputs, onOpen, selectedId }) {
  const date = example.facts.find((f) => f.kind !== "score");
  return (
    <ol className="row-list">
      {outputs.map((output) => (
        <li key={output.id}>
          <button
            className={`row-list__row${output.id === selectedId ? " row-list__row--selected" : ""}`}
            onClick={() => onOpen(output)}
          >
            <span className="thumb">
              <Output output={output} box={example.cellAspect} />
            </span>
            <span className="row-list__main">
              <b className="num">#{output.seed}</b>
              <span className="row-list__settings">
                {example.settings.map((s, n) => (
                  <Fragment key={s.key}>
                    {n > 0 && " · "}
                    <Value setting={s} output={output} />
                  </Fragment>
                ))}
              </span>
            </span>
            <span className="row-list__side">
              {date && <Fact fact={date} output={output} />}
              {output.score !== undefined && <Score value={output.score} />}
            </span>
          </button>
        </li>
      ))}
    </ol>
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
  const sorted = sortOutputs(outputs, sort, example);
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
      <div className="spreadsheet">
        <TableHeading example={example} count={outputs.length} sort={sort} />
        <table className="data-table">
          <SortableHead
            example={example}
            sort={sort}
            onSort={onSort}
            withThumb
          />
          <tbody>
            {sorted.map((output) => (
              <tr
                key={output.id}
                tabIndex={0}
                className={`data-table__row${output.id === selectedId ? " data-table__row--selected" : ""}`}
                onClick={() => onOpen(output)}
                onKeyDown={(e) => handleKeyDown(e, output)}
              >
                <td className="data-table__thumb">
                  <div className="thumb">
                    <Output output={output} box={example.cellAspect} />
                  </div>
                </td>
                <PropertyCells output={output} example={example} />
              </tr>
            ))}
          </tbody>
        </table>
        <RowList
          example={example}
          outputs={sorted}
          onOpen={onOpen}
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}

// A card shows a few settings; the rest are a click away in Focus
const CARD_SETTINGS = 3;

export function CardsLayout({ example, outputs, sort, selectedId, onOpen }) {
  return (
    <div className="table-layout">
      <div className="cards">
        {sortOutputs(outputs, sort, example).map((output) => (
          <div
            key={output.id}
            className={`card${output.id === selectedId ? " card--selected" : ""}`}
          >
            <button className="card__open" onClick={() => onOpen(output)}>
              <span className="card__image">
                <Output output={output} scale={0.85} />
              </span>
              <span className="card__properties">
                <span className="card__id num">#{output.seed}</span>
                {example.settings.slice(0, CARD_SETTINGS).map((s) => (
                  <span key={s.key} className="card__row">
                    <span className="card__name">{s.label}</span>
                    <Value setting={s} output={output} />
                  </span>
                ))}
                {example.facts.map((f) => (
                  <span key={f.key} className="card__row">
                    <span className="card__name">{f.label}</span>
                    <Fact fact={f} output={output} short />
                  </span>
                ))}
              </span>
            </button>
            <SaveButton output={output} className="card__save" />
          </div>
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
            <Output output={preview} full />
          </span>
        </button>
        <div className="split__meta">
          <div className="split__title">
            <h2 className="num">#{preview.seed}</h2>
            <SaveButton output={preview} />
          </div>
          <dl className="properties">
            {example.settings.map((s) => (
              <Fragment key={s.key}>
                <dt>{s.label}</dt>
                <dd>
                  <Value setting={s} output={preview} />
                </dd>
              </Fragment>
            ))}
            {example.facts.map((f) => (
              <Fragment key={f.key}>
                <dt>{f.label}</dt>
                <dd>
                  <Fact fact={f} output={preview} />
                </dd>
              </Fragment>
            ))}
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

// The grouping a setting stands for, so a row doesn't repeat what its group already says
const groupingId = (setting) => setting.key.toLowerCase().replace(/\s+/g, "-");

export function GroupedLayout({
  example,
  outputs,
  selectedId,
  onOpen,
  groupBy,
  closed,
  onToggleGroup,
}) {
  const grouping = groupingOf(example, groupBy);
  const groups = useMemo(
    () => groupOutputs(outputs, groupBy, example),
    [outputs, groupBy, example]
  );
  const scored = example.facts.some((f) => f.kind === "score");
  const details = example.settings.filter((s) => groupingId(s) !== groupBy);

  const isClosed = (key) => closed.has(`${groupBy}:${key}`);

  return (
    <div className="table-layout">
      <div className="grouped">
        {groups.map(({ key, list }) => {
          const average =
            scored && list.reduce((sum, o) => sum + o.score, 0) / list.length;
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
                <ChevronDown className="group__twisty" />
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
                {scored && groupBy !== "score" && (
                  <span className="group__average">
                    Score {average.toFixed(1)} avg
                  </span>
                )}
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
                      <span className="group-item__seed num">#{o.seed}</span>
                      <span className="group-item__side">
                        {scored && groupBy !== "score" && (
                          <Score value={o.score} />
                        )}
                        <span className="group-item__open">Open →</span>
                      </span>
                      <span className="group-item__details">
                        {o.created &&
                          (groupBy === "day"
                            ? formatTime(o.created)
                            : formatDate(o.created))}
                        {details.map((s, n) => (
                          <Fragment key={s.key}>
                            {(o.created || n > 0) && " · "}
                            <span className="group-item__name">
                              {s.label}
                            </span>{" "}
                            <Value setting={s} output={o} />
                          </Fragment>
                        ))}
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
