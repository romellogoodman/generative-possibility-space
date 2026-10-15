import { useState, useEffect, useRef } from "react";
import { short } from "../lib/outputs.js";
import { Output, Score } from "../components/Output.jsx";
import {
  outputFromId,
  MAP_SIZE,
  visibleMapCells,
  zoomAround,
  visibleCells,
} from "./camera.js";
import { CANVAS_LAYOUTS, CAPTION_ZOOM } from "./layouts.js";
import "./CanvasMode.scss";

export function CanvasMode({ onOpen, layoutId, camera, setCamera, openedId }) {
  const containerRef = useRef(null);
  const layout = CANVAS_LAYOUTS.find((l) => l.id === layoutId);
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll to pan, pinch (ctrl + wheel) to zoom around the cursor
  useEffect(() => {
    const container = containerRef.current;

    const handleWheel = (e) => {
      e.preventDefault();
      setCamera((prev) => {
        if (!e.ctrlKey) {
          return {
            ...prev,
            x: prev.x + e.deltaX / prev.zoom,
            y: prev.y + e.deltaY / prev.zoom,
          };
        }
        // A mouse-wheel notch is ~100px of delta; cap each event near 10%
        const step = Math.max(-0.1, Math.min(0.1, -e.deltaY * 0.01));
        return zoomAround(
          prev,
          prev.zoom * Math.exp(step),
          e.clientX,
          e.clientY
        );
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [setCamera]);

  // Click and drag to pan; a click without a drag opens the square under it
  const dragRef = useRef(null);
  const handlePointerDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, moved: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      moved: drag.moved + Math.abs(dx) + Math.abs(dy),
    };
    setCamera((prev) => ({
      ...prev,
      x: prev.x - dx / prev.zoom,
      y: prev.y - dy / prev.zoom,
    }));
  };
  const handlePointerUp = (e) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.moved > 4) return;
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest(".output");
    if (target) onOpen(outputFromId(target.dataset.id));
  };

  const { cellSize } = layout;
  const cells = layout.mapped
    ? []
    : visibleCells(camera, viewport.width, viewport.height, cellSize);
  const mapCells = layout.mapped
    ? visibleMapCells(camera, viewport.width, viewport.height)
    : [];
  const showCaptions = layout.fixedSize && camera.zoom >= CAPTION_ZOOM;

  return (
    <>
      <div
        ref={containerRef}
        className="infinite-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => (dragRef.current = null)}
      >
        <div
          className="infinite-canvas__world"
          style={{
            transform: `scale(${camera.zoom}) translate(${-camera.x}px, ${-camera.y}px)`,
          }}
        >
          {cells.map((cell) => {
            const columnOffset =
              layout.stagger && Math.abs(cell.gridX) % 2 === 1
                ? cellSize / 2
                : 0;
            const output = layout.fixedSize
              ? { ...cell, size: layout.fixedSize }
              : cell;
            return (
              <div
                key={`${layoutId}:${cell.id}`}
                className={`infinite-canvas__cell${cell.id === openedId ? " infinite-canvas__cell--opened" : ""}`}
                style={{
                  left: cell.gridX * cellSize,
                  top: cell.gridY * cellSize + columnOffset,
                  width: cellSize,
                  height: cellSize,
                }}
              >
                <Output output={output} />
                {showCaptions && (
                  <span className="infinite-canvas__caption">
                    #{cell.seed} <Score value={cell.score} />
                  </span>
                )}
              </div>
            );
          })}
          {layout.mapped && (
            <div
              className="parameter-map__bounds"
              style={{ width: MAP_SIZE, height: MAP_SIZE }}
            />
          )}
          {mapCells.map(({ i, j, cellSize: size, output }) => (
            <div
              key={output.id}
              className={`infinite-canvas__cell${output.id === openedId ? " infinite-canvas__cell--opened" : ""}`}
              title={`#${output.seed} · size ${short(output.size)} · shade ${short(output.shade)}`}
              style={{
                left: i * size,
                top: j * size,
                width: size,
                height: size,
              }}
            >
              <Output output={output} scale={0.9} />
            </div>
          ))}
        </div>
      </div>
      {layout.mapped && (
        <>
          <span className="parameter-map__axis parameter-map__axis--x">
            smaller ← size → bigger
          </span>
          <span className="parameter-map__axis parameter-map__axis--y">
            darker ← shade → lighter
          </span>
        </>
      )}
    </>
  );
}
