import { Shuffle } from "lucide-react";
import { Frame, Meta } from "../components/Output.jsx";
import { describe } from "../examples/index.js";
import { BLEND_STEPS } from "./blend.js";
import "./BlendMode.scss";

// Where the scrubber sits, in words
const where = (t) =>
  t <= 0
    ? "A"
    : t >= 1
      ? "B"
      : t < 0.4
        ? "Mostly A"
        : t <= 0.6
          ? "Halfway"
          : "Mostly B";

function End({ name, output, onShuffle }) {
  return (
    <div className="blend__end">
      <Frame output={output} />
      <span className="blend__tag">
        <b>{name}</b>
        <span className="num">#{output.seed}</span>
      </span>
      <button
        className="blend__shuffle"
        title={`A random new ${name}`}
        onClick={onShuffle}
      >
        <Shuffle />
        Shuffle
      </button>
    </div>
  );
}

export function BlendMode({ example, blend, onScrub, onShuffle }) {
  const { a, b, t } = blend;
  const { blendAt } = example;
  const current = blendAt(blend, t);
  const active = Math.round(t * (BLEND_STEPS - 1));
  return (
    <div className="blend">
      <div className="blend__ends">
        <End name="A" output={a} onShuffle={() => onShuffle("a")} />
        <div>
          <Frame key={current.id} output={current} full />
          <Meta
            settings={example.settings}
            output={current}
            className="blend__meta"
            lead={<b className="blend__where">{where(t)}</b>}
          >
            {/* What the example never blends across: B is always drawn to share it with A */}
            {example.keep?.map((k) => (
              <span key={k} className="meta__pair">
                <span className="meta__name">{k}</span> {a.traits[k]} at both
                ends
              </span>
            ))}
          </Meta>
        </div>
        <End name="B" output={b} onShuffle={() => onShuffle("b")} />
      </div>
      {/* The steps are the slider: drag along them or click one */}
      <div className="blend__film">
        <div className="blend__steps" aria-hidden="true">
          {Array.from({ length: BLEND_STEPS }, (_, k) => {
            const s = blendAt(blend, k / (BLEND_STEPS - 1));
            return (
              <span
                key={k}
                className={`blend__step${k === active ? " blend__step--active" : ""}`}
                title={describe(example, s)}
              >
                <Frame output={s} />
              </span>
            );
          })}
        </div>
        <span className="blend__rail">
          <span className="blend__fill" style={{ width: `${t * 100}%` }} />
          <span className="blend__knob" style={{ left: `${t * 100}%` }} />
        </span>
        <input
          className="blend__scrubber"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={t}
          aria-label="Blend from A to B"
          onChange={(e) => onScrub(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
