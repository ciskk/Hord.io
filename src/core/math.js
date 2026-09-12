/**
 * src/core/math.js
 * Módulo puramente funcional de utilitários geométricos e vetoriais.
 */

/**
 * Restringe um valor numérico entre os limites mínimo e máximo fornecidos.
 * @param {number} val - Valor a ser limitado
 * @param {number} min - Limite inferior
 * @param {number} max - Limite superior
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Interpolação linear entre dois escalares.
 * @param {number} a - Início
 * @param {number} b - Fim
 * @param {number} t - Fator [0, 1]
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Calcula o quadrado da distância Euclidiana entre dois pontos.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export function vecDistSq(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * Calcula a distância Euclidiana entre dois pontos.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export function vecDist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Magnitude (comprimento) de um vetor (x, y).
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function vecLength(x, y) {
  return Math.hypot(x, y);
}

/**
 * Quadrado da magnitude de um vetor (x, y).
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function vecLengthSq(x, y) {
  return x * x + y * y;
}

/**
 * Retorna o vetor unitário normalizado de (x, y).
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
export function vecNormalize(x, y) {
  const len = Math.hypot(x, y);
  if (len < 0.00001) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/**
 * Produto escalar (dot product) entre dois vetores 2D.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export function vecDot(x1, y1, x2, y2) {
  return x1 * x2 + y1 * y2;
}

/**
 * Calcula a distância Euclidiana mínima entre um ponto P(px, py) e um segmento
 * de reta finito delimitado por A(x1, y1) e B(x2, y2).
 * 
 * Projeção escalar normalizada:
 * t = clamp(((P - A) · (B - A)) / |B - A|^2, 0, 1)
 *
 * @param {number} px - Ponto P coord X
 * @param {number} py - Ponto P coord Y
 * @param {number} x1 - Segmento A coord X
 * @param {number} y1 - Segmento A coord Y
 * @param {number} x2 - Segmento B coord X
 * @param {number} y2 - Segmento B coord Y
 * @returns {{ dist: number, closestX: number, closestY: number, t: number }}
 */
export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;

  // Segmento degenerado (ponto único A ≈ B)
  if (l2 < 0.000001) {
    const ddx = px - x1;
    const ddy = py - y1;
    return {
      dist: Math.hypot(ddx, ddy),
      closestX: x1,
      closestY: y1,
      t: 0
    };
  }

  // Projeção escalar normalizada no intervalo [0, 1]
  const pdx = px - x1;
  const pdy = py - y1;
  const t = Math.max(0, Math.min(1, (pdx * dx + pdy * dy) / l2));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const dist = Math.hypot(px - closestX, py - closestY);

  return { dist, closestX, closestY, t };
}