import { Fragment } from "react";
import { Check } from "lucide-react";
import { Frame, Value } from "../components/Output.jsx";
import "./BreedMode.scss";

export function BreedMode({
  example,
  generations,
  current: index,
  onToggle,
  onRewind,
}) {
  const current = generations[index];
  const brief = example.brief ?? example.settings;
  return (
    <div className={`breed${example.cellAspect < 1 ? " breed--tall" : ""}`}>
      {/* The history: a thin strip above the grid, where you'll see it */}
      <section className="breed__history">
        <span className="breed__history-label">Generations</span>
        {generations.map((g, n) => (
          <button
            key={n}
            className={`breed__generation${n === index ? " breed__generation--current" : ""}${n > index ? " breed__generation--later" : ""}`}
            title={`Generation ${n + 1}`}
            onClick={() => onRewind(n)}
          >
            {g.outputs.map((o) => (
              <Frame
                key={o.id}
                output={o}
                box={example.cellAspect}
                className={g.picked.includes(o.id) ? "breed__picked" : ""}
              />
            ))}
          </button>
        ))}
        {generations.length > 1 && (
          <span className="breed__history-hint">
            click an earlier one to go back
          </span>
        )}
      </section>
      <p className="breed__title">
        <b>Generation {index + 1}</b> · pick the ones you like
      </p>
      <div className="breed__grid">
        {current.outputs.map((o) => {
          const picked = current.picked.includes(o.id);
          return (
            <button
              key={o.id}
              className={`breed__candidate${picked ? " breed__candidate--picked" : ""}`}
              aria-pressed={picked}
              title={
                o.parents
                  ? `#${o.seed} · from #${o.parents.join(" × #")}`
                  : `#${o.seed}`
              }
              onClick={() => onToggle(o.id)}
            >
              <span className="breed__frame">
                <Frame output={o} box={example.cellAspect} />
                <span className="breed__tick">{picked && <Check />}</span>
              </span>
              <span className="breed__brief">
                {brief.map((s, n) => (
                  <Fragment key={s.key}>
                    {n > 0 && " · "}
                    <span className="breed__name">{s.label}</span>{" "}
                    <Value setting={s} output={o} as="text" />
                  </Fragment>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
