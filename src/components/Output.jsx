import { useEffect, useState } from "react";
import {
  fullUrl,
  previewUrl,
  round2,
  formatDate,
  formatShort,
  formatYear,
} from "../lib/outputs.js";

// The pieces every view draws an output with

// A token's picture. Grids get the small local preview; `full` (the one large output in Focus,
// Blend and Split) shows the preview first and swaps in the full PNG once it has loaded
function TokenImage({ token, full }) {
  const [ready, setReady] = useState(null);
  useEffect(() => {
    if (!full) return;
    // Wait a beat so scrubbing Blend or arrowing through Focus doesn't start a download per step
    const url = fullUrl(token);
    let live = true;
    const timer = setTimeout(() => {
      const image = new Image();
      image.fetchPriority = "high";
      image.src = url;
      image
        .decode()
        .then(() => live && setReady(url))
        .catch(() => {});
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [full, token]);
  const src = full && ready === fullUrl(token) ? ready : previewUrl(token);
  return (
    <img
      src={src}
      alt={token.name}
      loading={full ? "eager" : "lazy"}
      decoding="async"
      draggable="false"
    />
  );
}

// Stand-in for a generative output. `box` is the shape (width / height) of the cell it sits in.
export function Output({ output, scale = 1, full = false, box = 1 }) {
  if (output.token) {
    // Keep the image's own shape inside the box: the side it reaches first gets the size
    const { aspect } = output.token;
    const side = output.size * 100 * scale;
    return (
      <div
        className="output output--image"
        data-id={output.id}
        style={{
          width: `${aspect < box ? (side * aspect) / box : side}%`,
          height: `${aspect < box ? side : (side * box) / aspect}%`,
        }}
      >
        <TokenImage token={output.token} full={full} />
      </div>
    );
  }
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

// An output on its backing; `box` gives the backing that shape instead of a square
export function Frame({ output, className = "", full = false, box = 1 }) {
  return (
    <div
      className={`frame ${className}`}
      style={box === 1 ? undefined : { aspectRatio: box }}
    >
      <Output output={output} full={full} box={box} />
    </div>
  );
}

export function Delta({ value, digits = 2 }) {
  const rounded = round2(value);
  if (!rounded) return <span className="delta delta--none">±0</span>;
  const amount = Math.abs(rounded).toFixed(digits);
  return (
    <span className="delta">
      {rounded > 0 ? "+" : "−"}
      {amount}
    </span>
  );
}

// A fact beyond the settings (Grey squares' score and date, a token's mint date), by its kind
// (`short` drops the time, where room is tight)
export function Fact({ fact, output, short = false }) {
  const value = output[fact.key];
  if (value === undefined) return null;
  if (fact.kind === "score") return <Score value={value} />;
  if (fact.kind === "day") return formatYear(value);
  return short ? formatShort(value) : formatDate(value);
}

// A setting's value: numbers in the mono face that lines digits up, words in the UI face
export function Value({ setting, output, as = "cell" }) {
  const text = as === "cell" ? setting.cell(output) : setting.text(output);
  return <span className={setting.numeric ? "num" : undefined}>{text}</span>;
}

// One line naming an output: its number, then each setting as a muted name and a bright value
export function Meta({ output, settings, lead, children, className = "" }) {
  return (
    <p className={`meta ${className}`}>
      {lead}
      {output && <b className="meta__id num">#{output.seed}</b>}
      {settings.map((s) => (
        <span key={s.key} className="meta__pair">
          <span className="meta__name">{s.label}</span>{" "}
          <Value setting={s} output={output} as="text" />
        </span>
      ))}
      {children}
    </p>
  );
}
