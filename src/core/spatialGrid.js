export const SPATIAL_CELL_SIZE = 75;
export const spatialGrid = new Map();

// Pool estático de listas para reuso total de memória (Zero Garbage Collection)
const arrayPool = [];

// Buffer estático reutilizável para consultas de vizinhos sem criar novos arrays
export const neighborIndicesBuffer = [];

// Hash numérico inteiro único em 32-bit (elimina alocação de strings como chave de Map)
export function getGridKey(cx, cy) {
  return (cx + 16384) * 32768 + (cy + 16384);
}

export function clearSpatialGrid() {
  for (const list of spatialGrid.values()) {
    list.length = 0;
    arrayPool.push(list);
  }
  spatialGrid.clear();
}

export function insertIntoGrid(e, index) {
  const cx = Math.floor(e.x / SPATIAL_CELL_SIZE);
  const cy = Math.floor(e.y / SPATIAL_CELL_SIZE);
  const key = getGridKey(cx, cy);
  let list = spatialGrid.get(key);
  if (!list) {
    list = arrayPool.pop() || [];
    spatialGrid.set(key, list);
  }
  list.push(index);
  e.gridCx = cx;
  e.gridCy = cy;
}

export function getNeighborIndices(x, y, radius) {
  neighborIndicesBuffer.length = 0;
  const minCx = Math.floor((x - radius) / SPATIAL_CELL_SIZE);
  const maxCx = Math.floor((x + radius) / SPATIAL_CELL_SIZE);
  const minCy = Math.floor((y - radius) / SPATIAL_CELL_SIZE);
  const maxCy = Math.floor((y + radius) / SPATIAL_CELL_SIZE);

  for (let cx = minCx; cx <= maxCx; cx++) {
    const colOffset = (cx + 16384) * 32768;
    for (let cy = minCy; cy <= maxCy; cy++) {
      const key = colOffset + (cy + 16384);
      const list = spatialGrid.get(key);
      if (list) {
        for (let i = 0; i < list.length; i++) {
          neighborIndicesBuffer.push(list[i]);
        }
      }
    }
  }
  return neighborIndicesBuffer;
}