import { Frame } from "../components/Output.jsx";
import { describe } from "../examples/index.js";
import { BLEND_STEPS } from "./blend.js";
import "./BlendMode.scss";

export function BlendMode({ example, blend, onScrub }) {
  const { a, b, t } = blend;
  const { blendAt } = example;
  const current = blendAt(blend, t);
  const active = Math.round(t * (BLEND_STEPS - 1));
  return (
    <div className="blend">
      <div className="blend__ends">
        <div className="blend__end">
          <span className="blend__label">A</span>
          <Frame output={a} />
        </div>
        <div>
          <Frame key={current.id} output={current} full />
          <p className="focus-meta">
            <span className="data-table__mono">
              {Math.round((1 - t) * 100)}% A · {Math.round(t * 100)}% B
            </span>
            {example.settings.map((s) => (
              <span key={s.key} className="data-table__mono">
                {s.name} {s.text(current)}
              </span>
            ))}
          </p>
        </div>
        <div className="blend__end">
          <span className="blend__label">B</span>
          <Frame output={b} />
        </div>
      </div>
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
      <div className="blend__steps">
        {Array.from({ length: BLEND_STEPS }, (_, k) => {
          const s = blendAt(blend, k / (BLEND_STEPS - 1));
          return (
            <button
              key={k}
              className={`alternative${k === active ? " alternative--peek" : ""}`}
              title={describe(example, s)}
              onClick={() => onScrub(k / (BLEND_STEPS - 1))}
            >
              <Frame output={s} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
