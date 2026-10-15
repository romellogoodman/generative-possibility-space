import { round2, short } from "../lib/outputs.js";

// The pieces every view draws an output with

// Stand-in for a generative output
export function Output({ output, scale = 1 }) {
  return (
    <div
      className="output"
      data-id={output.id}
      style={{
        width: `${output.size * 100 * scale}%`,
        height: `${output.size * 100 * scale}%`,
        "--shade": output.shade,
      }}
    />
  );
}

export function Score({ value }) {
  return (
    <span className="score" aria-label={`${value} of 5`}>
      {"●".repeat(value)}
      <span className="score__empty">{"●".repeat(5 - value)}</span>
    </span>
  );
}

export function Frame({ output, className = "" }) {
  return (
    <div className={`frame ${className}`}>
      <Output output={output} />
    </div>
  );
}

export function Delta({ value, digits = 2 }) {
  const rounded = round2(value);
  if (!rounded) return <span className="delta delta--none">±0</span>;
  const amount = digits ? short(Math.abs(rounded)) : Math.abs(rounded);
  return (
    <span className="delta">
      {rounded > 0 ? "+" : "−"}
      {amount}
    </span>
  );
}
