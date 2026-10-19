import {
  makeOutput,
  lerp,
  SIZE_RANGE,
  SHADE_RANGE,
  round2,
} from "../lib/outputs.js";

// The canvas camera and the parameter map's geometry

const MIN_ZOOM = 0.25;

const MAX_ZOOM = 3;

export function outputFromId(id) {
  if (id.startsWith("m")) {
    const [steps, i, j] = id.slice(1).split(/[:,]/).map(Number);
    return mapOutput(steps, i, j);
  }
  const [gridX, gridY] = id.split(",").map(Number);
  return makeOutput(gridX, gridY);
}

// The parameter map is a MAP_SIZE square in world space, split into more steps as you zoom in
export const MAP_SIZE = 960;

export const mapSteps = (zoom) => (zoom >= 2.4 ? 32 : zoom >= 1.3 ? 16 : 8);

// The output at step (i, j) of an n × n map: left to right is size, top to bottom is shade
function mapOutput(steps, i, j) {
  const base = makeOutput(i + steps * 100, j);
  return {
    ...base,
    id: `m${steps}:${i},${j}`,
    size: round2(lerp(SIZE_RANGE, (i + 0.5) / steps)),
    shade: round2(lerp(SHADE_RANGE, (j + 0.5) / steps)),
  };
}

// Visible map steps; outside the square there is nothing
export function visibleMapCells(camera, width, height) {
  const steps = mapSteps(camera.zoom);
  const cellSize = MAP_SIZE / steps;
  const toStep = (world) => Math.floor(world / cellSize);
  const cells = [];
  const iEnd = Math.min(steps - 1, toStep(camera.x + width / camera.zoom));
  const jEnd = Math.min(steps - 1, toStep(camera.y + height / camera.zoom));
  for (let i = Math.max(0, toStep(camera.x)); i <= iEnd; i++) {
    for (let j = Math.max(0, toStep(camera.y)); j <= jEnd; j++) {
      cells.push({ i, j, cellSize, output: mapOutput(steps, i, j) });
    }
  }
  return cells;
}

// The camera that fits the whole map below the top bar
export function fitMapCamera() {
  const width = window.innerWidth;
  const height = window.innerHeight - 140;
  const zoom = Math.min(1, (width - 64) / MAP_SIZE, height / MAP_SIZE);
  return {
    zoom,
    x: -(width / zoom - MAP_SIZE) / 2,
    y: -(height / zoom - MAP_SIZE) / 2 - 70 / zoom,
  };
}

// The camera zoomed to `zoom`, keeping the world point under (screenX, screenY) still
export function zoomAround(camera, zoom, screenX, screenY) {
  const next = Math.min(Math.max(MIN_ZOOM, zoom), MAX_ZOOM);
  const worldX = camera.x + screenX / camera.zoom;
  const worldY = camera.y + screenY / camera.zoom;
  return { x: worldX - screenX / next, y: worldY - screenY / next, zoom: next };
}

// Cells covering the visible area plus a margin, so panning never shows gaps
export function visibleCells(
  camera,
  width,
  height,
  cellSize,
  make = makeOutput
) {
  const padding = cellSize;
  const startX = Math.floor((camera.x - padding) / cellSize);
  const endX = Math.ceil((camera.x + width / camera.zoom + padding) / cellSize);
  const startY = Math.floor((camera.y - padding) / cellSize);
  const endY = Math.ceil(
    (camera.y + height / camera.zoom + padding) / cellSize
  );

  const cells = [];
  for (let gx = startX; gx <= endX; gx++) {
    for (let gy = startY; gy <= endY; gy++) {
      cells.push(make(gx, gy));
    }
  }
  return cells;
}

export const START_CAMERA = { x: 0, y: 0, zoom: 1 };
