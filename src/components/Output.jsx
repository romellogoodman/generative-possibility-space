import { useEffect, useState } from "react";
import { fullUrl, previewUrl, round2, short } from "../lib/outputs.js";

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

// Stand-in for a generative output
export function Output({ output, scale = 1, full = false }) {
  if (output.token) {
    // Keep the image's own shape inside the square: the longer side gets the size
    const { aspect } = output.token;
    const side = output.size * 100 * scale;
    return (
      <div
        className="output output--image"
        data-id={output.id}
        style={{
          width: `${aspect < 1 ? side * aspect : side}%`,
          height: `${aspect < 1 ? side : side / aspect}%`,
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

export function Frame({ output, className = "", full = false }) {
  return (
    <div className={`frame ${className}`}>
      <Output output={output} full={full} />
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
