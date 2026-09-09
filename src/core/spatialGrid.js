export const SPATIAL_CELL_SIZE = 75;
export const spatialGrid = new Map();

export function getGridKey(cx, cy) {
  return `${cx},${cy}`;
}

export function clearSpatialGrid() {
  spatialGrid.clear();
}

export function insertIntoGrid(e, index) {
  const cx = Math.floor(e.x / SPATIAL_CELL_SIZE);
  const cy = Math.floor(e.y / SPATIAL_CELL_SIZE);
  const key = getGridKey(cx, cy);
  let list = spatialGrid.get(key);
  if (!list) {
    list = [];
    spatialGrid.set(key, list);
  }
  list.push(index);
  e.gridCx = cx;
  e.gridCy = cy;
}

export function getNeighborIndices(x, y, radius) {
  const minCx = Math.floor((x - radius) / SPATIAL_CELL_SIZE);
  const maxCx = Math.floor((x + radius) / SPATIAL_CELL_SIZE);
  const minCy = Math.floor((y - radius) / SPATIAL_CELL_SIZE);
  const maxCy = Math.floor((y + radius) / SPATIAL_CELL_SIZE);
  const indices = [];

  for (let cx = minCx; cx <= maxCx; cx++) {
    for (let cy = minCy; cy <= maxCy; cy++) {
      const list = spatialGrid.get(getGridKey(cx, cy));
      if (list) {
        for (let i = 0; i < list.length; i++) {
          indices.push(list[i]);
        }
      }
    }
  }
  return indices;
}