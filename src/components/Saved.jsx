import { createContext, useContext, useEffect, useState } from "react";
import { Heart } from "lucide-react";

// Saved: the outputs you've hearted, one list per example, kept in this browser. It's your own
// mark, so a real artwork never carries a rating GPS made up.

const SavedContext = createContext({ has: () => false, toggle: () => {} });

const storageKey = (exampleId) => `gps:saved:${exampleId}`;

function load(exampleId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey(exampleId))));
  } catch {
    return new Set();
  }
}

export function SavedProvider({ exampleId, children }) {
  const [saved, setSaved] = useState(() => load(exampleId));
  const [loadedFor, setLoadedFor] = useState(exampleId);
  // A new example brings its own list
  if (loadedFor !== exampleId) {
    setLoadedFor(exampleId);
    setSaved(load(exampleId));
  }

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(loadedFor), JSON.stringify([...saved]));
    } catch {
      // Without storage, saves last until the page closes
    }
  }, [saved, loadedFor]);

  const value = {
    has: (id) => saved.has(id),
    toggle: (id) =>
      setSaved((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
  };
  return (
    <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
  );
}

const useSaved = () => useContext(SavedContext);

// The heart: click to save or unsave, without opening the row or card it sits on
export function SaveButton({ output, className = "" }) {
  const { has, toggle } = useSaved();
  const on = has(output.id);
  return (
    <button
      className={`save${on ? " save--on" : ""} ${className}`}
      aria-pressed={on}
      title={on ? "Saved · click to remove" : "Save"}
      onClick={(e) => {
        e.stopPropagation();
        toggle(output.id);
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Heart />
    </button>
  );
}
