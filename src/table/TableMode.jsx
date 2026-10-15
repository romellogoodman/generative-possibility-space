import { useState } from "react";
import { TABLE_OUTPUTS } from "./data.jsx";
import { TABLE_LAYOUTS } from "./views.js";
import "./TableMode.scss";

export function TableMode({ onOpen, paused, layout, ...settings }) {
  const [selectedId, setSelectedId] = useState(null);
  const { Component } = TABLE_LAYOUTS.find((l) => l.id === layout);

  const handleOpen = (output) => {
    setSelectedId(output.id);
    onOpen(output);
  };

  return (
    <div className="table-mode">
      <Component
        outputs={TABLE_OUTPUTS}
        selectedId={selectedId}
        onOpen={handleOpen}
        paused={paused}
        {...settings}
      />
    </div>
  );
}
