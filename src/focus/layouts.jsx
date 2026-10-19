import { Fragment, useState, useEffect } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import {
  Score,
  Frame,
  Delta,
  Fact,
  Meta,
  Value,
} from "../components/Output.jsx";
import { SaveButton } from "../components/Saved.jsx";
import { describe } from "../examples/index.js";
import { ARROW_KEYS, focusPath } from "./tree.js";

// Focus layouts: one output plus its variations, all read from the example

// Under the large output: its number and settings, its score where it has one, and the heart
function FocusMeta({ output, example }) {
  return (
    <Meta output={output} settings={example.settings} className="focus-meta">
      {output.score !== undefined && <Score value={output.score} />}
      <SaveButton output={output} />
    </Meta>
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

// How a variation differs, in one line: the setting that moved furthest (a number as a delta,
// a trait as its new value)
function Change({ output, variation, example }) {
  const reach = (s) =>
    s.numeric
      ? Math.abs(s.read(variation) - s.read(output)) / (s.range[1] - s.range[0])
      : s.read(variation) !== s.read(output)
        ? 1
        : 0;
  const [biggest] = [...example.settings].sort((a, b) => reach(b) - reach(a));
  if (!biggest || !reach(biggest))
    return <span className="focus-change">same</span>;
  return (
    <span className="focus-change">
      <span className="focus-change__name">{biggest.label}</span>{" "}
      {biggest.numeric ? (
        <Delta value={biggest.read(variation) - biggest.read(output)} />
      ) : (
        biggest.text(variation)
      )}
    </span>
  );
}

export function StripLayout({ output, onFocus, example }) {
  const variations = example.variations(output, "strip");
  return (
    <div className="focus-strip">
      <Hero output={output}>
        <FocusMeta output={output} example={example} />
      </Hero>
      <section>
        <p className="focus-label">Variations · click one to step to it</p>
        <div className="focus-strip__row">
          {variations.map((v) => (
            <button
              key={v.id}
              className="alternative focus-strip__item"
              title={`#${v.seed} · ${describe(example, v)}`}
              onClick={() => onFocus(v)}
            >
              <Frame output={v} />
              <Change output={output} variation={v} example={example} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// The label on one side of Compass: the direction, and the value a step that way lands on
function CompassLabel({ side, icon: Icon, label, setting, step }) {
  return (
    <span className={`focus-compass__axis focus-compass__axis--${side}`}>
      <Icon />
      <b>{label}</b>
      <span className="focus-compass__lands">
        {step ? (
          <>
            {side === "up" || side === "down" ? `${setting.label} ` : ""}
            <Value setting={setting} output={step} as="text" />
          </>
        ) : (
          "end of range"
        )}
      </span>
    </span>
  );
}

// Neighbours laid out by direction, along the example's two compass settings
export function CompassLayout({ output, onFocus, example }) {
  const { labels, axes } = example.compass;
  const settingOf = (key) => example.settings.find((s) => s.key === key);
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
  const at = (dir) => cells.find((c) => c.dir === dir)?.variation;

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = at(ARROW_KEYS[e.key]);
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
        <CompassLabel
          side="up"
          icon={ArrowUp}
          label={labels.up}
          setting={settingOf(axes.y)}
          step={at("0,-1")}
        />
        <CompassLabel
          side="left"
          icon={ArrowLeft}
          label={labels.left}
          setting={settingOf(axes.x)}
          step={at("-1,0")}
        />
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
                title={`#${variation.seed} · ${describe(example, variation)}`}
                onClick={() => onFocus(variation)}
              >
                <Frame output={variation} box={example.cellAspect} />
              </button>
            );
          })}
        </div>
        <CompassLabel
          side="right"
          icon={ArrowRight}
          label={labels.right}
          setting={settingOf(axes.x)}
          step={at("1,0")}
        />
        <CompassLabel
          side="down"
          icon={ArrowDown}
          label={labels.down}
          setting={settingOf(axes.y)}
          step={at("0,1")}
        />
      </div>
      <FocusMeta output={output} example={example} />
      <p className="focus-label focus-label--hover-only">
        Click a neighbour, or use the arrow keys
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
            <dt>{example.idLabel}</dt>
            <dd className="focus-inspector__id">
              <span className="num">#{output.seed}</span>
              <SaveButton output={output} />
            </dd>
            {example.settings.map((s) => (
              <Fragment key={s.key}>
                <dt>{s.label}</dt>
                <dd className="focus-inspector__value">
                  <Value setting={s} output={output} as="text" />
                  {s.position?.(output) != null && (
                    <RangeMeter at={s.position(output)} />
                  )}
                </dd>
              </Fragment>
            ))}
            {example.facts.map((f) => (
              <Fragment key={f.key}>
                <dt>{f.label}</dt>
                <dd>
                  <Fact fact={f} output={output} />
                </dd>
              </Fragment>
            ))}
          </dl>
        </section>
        <section>
          <h3 className="focus-heading">Variations</h3>
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
              <span className="compare__key">{example.idLabel}</span>
              <span className="num">#{output.seed}</span>
              <span className="num">#{peek.seed}</span>
              <span />
              {example.settings.map((s) => (
                <Fragment key={s.key}>
                  <span className="compare__key">{s.label}</span>
                  <Value setting={s} output={output} as="text" />
                  <Value setting={s} output={peek} as="text" />
                  <Difference setting={s} from={output} to={peek} />
                </Fragment>
              ))}
              {output.score !== undefined && (
                <>
                  <span className="compare__key">Score</span>
                  <span className="num">{output.score}</span>
                  <span className="num">{peek.score}</span>
                  <Delta value={peek.score - output.score} digits={0} />
                </>
              )}
            </div>
          ) : (
            <p className="focus-hint">
              Hover a variation to see what it changes.
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
                        <span
                          className={`dial__value${dial.numeric ? " num" : ""}`}
                        >
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
                      <span
                        className={`dial__value${dial.numeric ? " num" : ""}`}
                      >
                        {dial.value(v)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <p className="focus-label focus-label--wide-only">
          Each row changes one thing. Click a step to go there.
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
        <span className="num">#{node.output.seed}</span>
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
          Variations · <span className="focus-label__dot" /> already visited
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
            Where you've been · {nodes.length} visited
            {branches > 1 && ` · ${branches} branches`}
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
        {nodes.length === 1 && (
          <p className="lineage__ghost">
            <b>This fills in as you explore.</b> Click a variation and it joins
            the tree under this one. Go back to any step and branch off: each
            branch shows here.
          </p>
        )}
      </section>
    </div>
  );
}
