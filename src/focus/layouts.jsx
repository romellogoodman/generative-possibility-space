import { Fragment, useState, useEffect } from "react";
import { formatDate } from "../lib/outputs.js";
import { Score, Frame, Delta } from "../components/Output.jsx";
import { describe } from "../examples/index.js";
import { COMPASS_ARROWS, ARROW_KEYS, focusPath } from "./tree.js";

// Focus layouts: one output plus its variations, all read from the example

function FocusMeta({ output, example }) {
  return (
    <p className="focus-meta">
      <b className="data-table__mono">#{output.seed}</b>
      {example.settings.map((s) => (
        <span key={s.key} className="data-table__mono">
          {s.name} {s.text(output)}
        </span>
      ))}
      <Score value={output.score} />
      <span>{formatDate(output.created)}</span>
    </p>
  );
}

function Hero({ output, children }) {
  return (
    <div className="focus-hero">
      <Frame
        key={output.id}
        output={output}
        className="focus-hero__image"
        full
      />
      {children}
    </div>
  );
}

// How a variation differs: numeric settings as a delta, others only when they change
function Changes({ output, variation, example }) {
  return example.settings
    .filter((s) => s.numeric || s.read(variation) !== s.read(output))
    .map((s) => (
      <Fragment key={s.key}>
        <span>{s.name}</span>
        {s.numeric ? (
          <Delta value={s.read(variation) - s.read(output)} />
        ) : (
          <span className="delta delta--value">{s.text(variation)}</span>
        )}
      </Fragment>
    ));
}

export function StripLayout({ output, onFocus, example }) {
  const variations = example.variations(output, "strip");
  return (
    <div className="focus-strip">
      <Hero output={output}>
        <FocusMeta output={output} example={example} />
      </Hero>
      <section>
        <p className="focus-label">Nearby variations · click to focus</p>
        <div className="focus-strip__row">
          {variations.map((v) => (
            <button
              key={v.id}
              className="alternative focus-strip__item"
              title={`#${v.seed} · ${describe(example, v)}`}
              onClick={() => onFocus(v)}
            >
              <Frame output={v} />
              <span className="focus-strip__deltas data-table__mono">
                <Changes output={output} variation={v} example={example} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// Neighbours laid out by direction, along the example's two compass settings
export function CompassLayout({ output, onFocus, example }) {
  const { labels } = example.compass;
  const cells = [];
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      const dir = `${x},${y}`;
      if (!x && !y) {
        cells.push({ dir, current: true });
        continue;
      }
      cells.push({ dir, variation: example.compass.step(output, x, y) });
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
          {labels.up}
        </span>
        <span className="focus-compass__axis focus-compass__axis--down">
          {labels.down}
        </span>
        <span className="focus-compass__axis focus-compass__axis--left">
          {labels.left}
        </span>
        <span className="focus-compass__axis focus-compass__axis--right">
          {labels.right}
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
                    box={example.cellAspect}
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
                  <div
                    className="frame frame--edge"
                    style={{ aspectRatio: example.cellAspect }}
                  >
                    end of range
                  </div>
                </div>
              );
            }
            return (
              <button
                key={dir}
                className="focus-compass__cell alternative"
                title={`${COMPASS_ARROWS[dir]} #${variation.seed} · ${describe(example, variation)}`}
                onClick={() => onFocus(variation)}
              >
                <span className="focus-compass__arrow">
                  {COMPASS_ARROWS[dir]}
                </span>
                <Frame output={variation} box={example.cellAspect} />
              </button>
            );
          })}
        </div>
      </div>
      <FocusMeta output={output} example={example} />
      <p className="focus-label focus-label--hover-only">
        Arrow keys step in a direction
      </p>
    </div>
  );
}

// Where a value sits in its setting's range, from 0 to 1
function RangeMeter({ at }) {
  return (
    <span className="range-meter">
      <span className="range-meter__fill" style={{ width: `${at * 100}%` }} />
    </span>
  );
}

// A changed setting: a delta when it's a number, otherwise whether it changed
function Difference({ setting, from, to }) {
  if (setting.numeric)
    return <Delta value={setting.read(to) - setting.read(from)} />;
  return setting.read(to) === setting.read(from) ? (
    <span className="delta delta--none">same</span>
  ) : (
    <span className="delta">new</span>
  );
}

export function InspectorLayout({ output, onFocus, example }) {
  const variations = example.variations(output, "inspector");
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
            {example.settings.map((s) => (
              <Fragment key={s.key}>
                <dt>{s.label}</dt>
                <dd className="focus-inspector__value">
                  <span className="data-table__mono">{s.text(output)}</span>
                  {s.position?.(output) != null && (
                    <RangeMeter at={s.position(output)} />
                  )}
                </dd>
              </Fragment>
            ))}
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
              {example.settings.map((s) => (
                <Fragment key={s.key}>
                  <span className="compare__key">{s.label}</span>
                  <span className="data-table__mono">{s.text(output)}</span>
                  <span className="data-table__mono">{s.text(peek)}</span>
                  <Difference setting={s} from={output} to={peek} />
                </Fragment>
              ))}
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

export function DialsLayout({ output, onFocus, example }) {
  return (
    <div className="focus-dials">
      <Hero output={output}>
        <FocusMeta output={output} example={example} />
      </Hero>
      <section
        className="focus-dials__rows"
        aria-label="Variations, one property at a time"
      >
        {example.dials.map((dial) => {
          const track = dial.track(output);
          return (
            <div key={dial.key} className="dial">
              <div className="dial__header">
                <span className="dial__name">{dial.name}</span>
                <span className="dial__note">{dial.note}</span>
              </div>
              <div className="dial__row">
                {dial.steps(output).map((i, n) => {
                  const v = i ? dial.at(output, i) : null;
                  if (i === null || (i && !v))
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
                          {dial.value(output)}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={n}
                      className="dial__step alternative"
                      title={`#${v.seed} · ${dial.key} ${dial.value(v)}`}
                      onClick={() => onFocus(v)}
                    >
                      <Frame output={v} />
                      <span className="dial__value">{dial.value(v)}</span>
                    </button>
                  );
                })}
              </div>
              <div
                className="dial__track"
                title={`Where this output sits in the full ${dial.key} range`}
              >
                <span>{track.min}</span>
                <span className="dial__bar">
                  {track.at !== null && (
                    <i style={{ left: `${track.at * 100}%` }} />
                  )}
                </span>
                <span>{track.max}</span>
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

function LineageNode({ node, nodes, path, current, onGoTo }) {
  const children = nodes.filter((n) => n.parent === node.id);
  const onPath = path.has(node.id);
  return (
    <li>
      <button
        className={`lineage__node${onPath ? " lineage__node--path" : ""}${node.id === current ? " lineage__node--current" : ""}`}
        onClick={() => onGoTo(node.id)}
      >
        <Frame output={node.output} className="lineage__thumb" />
        <span className="data-table__mono">#{node.output.seed}</span>
      </button>
      {children.length > 0 && (
        <ul>
          {children.map((child) => (
            <LineageNode
              key={child.id}
              node={child}
              nodes={nodes}
              path={path}
              current={current}
              onGoTo={onGoTo}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LineageLayout({ output, onFocus, lineage, example }) {
  const { nodes, current, onGoTo } = lineage;
  const variations = example.variations(output, "lineage");
  const visited = new Set(
    nodes.filter((n) => n.parent === current).map((n) => n.output.id)
  );
  const path = new Set(focusPath(lineage).map((n) => n.id));
  const branches = nodes.filter(
    (n) => !nodes.some((child) => child.parent === n.id)
  ).length;
  return (
    <div className="lineage">
      <div className="lineage__main">
        <Hero output={output}>
          <FocusMeta output={output} example={example} />
        </Hero>
        <p className="focus-label">
          Variations · a dot means you have been there
        </p>
        <div className="lineage__variations">
          {variations.map((v) => (
            <button
              key={v.id}
              className={`alternative${visited.has(v.id) ? " alternative--visited" : ""}`}
              title={`#${v.seed} · ${describe(example, v)}`}
              onClick={() => onFocus(v)}
            >
              <Frame output={v} />
            </button>
          ))}
        </div>
      </div>
      <section className="lineage__tree">
        <p className="focus-heading">
          <span>
            {nodes.length} visited · {branches} branch
            {branches === 1 ? "" : "es"}
          </span>
        </p>
        <ul className="lineage__list">
          {nodes
            .filter((n) => n.parent === null)
            .map((root) => (
              <LineageNode
                key={root.id}
                node={root}
                nodes={nodes}
                path={path}
                current={current}
                onGoTo={onGoTo}
              />
            ))}
        </ul>
      </section>
    </div>
  );
}
