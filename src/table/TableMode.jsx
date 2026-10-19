import { useState } from "react";
import { TABLE_LAYOUTS } from "./views.js";
import "./TableMode.scss";

export function TableMode({ example, onOpen, paused, layout, ...settings }) {
  const [selectedId, setSelectedId] = useState(null);
  const { Component } = TABLE_LAYOUTS.find((l) => l.id === layout);

  const handleOpen = (output) => {
    setSelectedId(output.id);
    onOpen(output);
  };

  return (
    <div className="table-mode">
      <Component
        example={example}
        outputs={example.tableOutputs}
        selectedId={selectedId}
        onOpen={handleOpen}
        paused={paused}
        {...settings}
      />
    </div>
  );
}
