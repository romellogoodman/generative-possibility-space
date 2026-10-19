import { useState, useEffect } from "react";
import {
  formatDate,
  SIZE_RANGE,
  SHADE_RANGE,
  round2,
  short,
  vary,
  nearby,
} from "../lib/outputs.js";
import { Score, Frame, Delta } from "../components/Output.jsx";
import {
  COMPASS_STEP,
  COMPASS_ARROWS,
  ARROW_KEYS,
  DIALS,
  dialSteps,
  focusPath,
} from "./tree.js";

// Focus layouts: one output plus its variations

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

export function StripLayout({ output, onFocus }) {
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

// Neighbours laid out by direction: left/right is size, up/down is shade
export function CompassLayout({ output, onFocus }) {
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

export function InspectorLayout({ output, onFocus }) {
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

export function DialsLayout({ output, onFocus }) {
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

export function LineageLayout({ output, onFocus, lineage }) {
  const { nodes, current, onGoTo } = lineage;
  const variations = nearby(output, 6, 0.14, 0.22);
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
          <FocusMeta output={output} />
        </Hero>
        <p className="focus-label">
          Variations · a dot means you have been there
        </p>
        <div className="lineage__variations">
          {variations.map((v) => (
            <button
              key={v.id}
              className={`alternative${visited.has(v.id) ? " alternative--visited" : ""}`}
              title={`#${v.seed} · size ${short(v.size)} · shade ${short(v.shade)}`}
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
