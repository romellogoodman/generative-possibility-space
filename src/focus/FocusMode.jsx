import { ChevronRight } from "lucide-react";
import { Frame } from "../components/Output.jsx";
import { TRAIL_LENGTH } from "./tree.js";
import { FOCUS_LAYOUTS } from "./views.js";
import "./FocusMode.scss";

export function Trail({ trail, current, onJump }) {
  if (!trail.length) return null;
  const from = Math.max(0, trail.length - TRAIL_LENGTH);
  return (
    <div className="trail">
      {from > 0 && (
        <button
          className="trail__more"
          title={`Back to the step before (${from} earlier)`}
          onClick={() => onJump(from - 1)}
        >
          +{from}
        </button>
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

export function FocusMode({ example, output, layoutId, onFocus, lineage }) {
  const { Component } = FOCUS_LAYOUTS.find((l) => l.id === layoutId);
  return (
    <div className="focus-mode">
      <div className="focus-mode__body">
        <Component
          example={example}
          output={output}
          onFocus={onFocus}
          lineage={lineage}
        />
      </div>
    </div>
  );
}
