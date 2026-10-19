import { Check } from "lucide-react";
import { describe } from "../examples/index.js";
import { Frame } from "../components/Output.jsx";
import "./BreedMode.scss";

export function BreedMode({
  example,
  generations,
  current: index,
  onToggle,
  onRewind,
}) {
  const current = generations[index];
  return (
    <div className={`breed${example.cellAspect < 1 ? " breed--tall" : ""}`}>
      <section>
        <p className="focus-label">
          Generation {index + 1} · pick the ones you like, then breed
        </p>
        <div className="breed__grid">
          {current.outputs.map((o) => {
            const picked = current.picked.includes(o.id);
            return (
              <button
                key={o.id}
                className={`alternative breed__candidate${picked ? " alternative--peek" : ""}`}
                aria-pressed={picked}
                title={
                  o.parents
                    ? `#${o.seed} · from #${o.parents.join(" × #")}`
                    : `#${o.seed}`
                }
                onClick={() => onToggle(o.id)}
              >
                <Frame output={o} box={example.cellAspect} />
                <span className="breed__meta data-table__mono">
                  <span className="breed__brief">
                    {example.brief?.(o) ?? describe(example, o)}
                  </span>
                  {picked && <Check className="breed__check" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="breed__history">
        <p className="focus-heading">
          <span>Generations · click one to go back</span>
        </p>
        {generations.map((g, n) => (
          <button
            key={n}
            className={`breed__generation${n === index ? " breed__generation--current" : ""}${n > index ? " breed__generation--later" : ""}`}
            onClick={() => onRewind(n)}
          >
            <span className="data-table__mono">{n + 1}</span>
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
      </section>
    </div>
  );
}
