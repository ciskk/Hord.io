import { 
  camera, 
  viewW, 
  viewH, 
  currentArenaTheme, 
  setCurrentArenaTheme,
  bloodSplats, 
  acidPuddles, 
  frameCount 
} from '../main.js';

export function tileHash(gx, gy) {
  let n = Math.sin(gx * 374761393 + gy * 668265263) * 43758.5453;
  return n - Math.floor(n);
}

// Ruído suave de baixa frequência para gerar caminhos e manchas de terreno
function smoothNoise(x, y) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = tileHash(i, j);
  const n10 = tileHash(i + 1, j);
  const n01 = tileHash(i, j + 1);
  const n11 = tileHash(i + 1, j + 1);

  const nx0 = n00 + sx * (n10 - n00);
  const nx1 = n01 + sx * (n11 - n01);
  return nx0 + sy * (nx1 - nx0);
}

// Curva de interpolação cúbica suave (smoothstep)
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// Conversão e Interpolação Cromática (RGB Lerp)
function parseHex(hex) {
  if (!hex) return [0, 0, 0];
  let h = hex.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function lerpColor(c1, c2, t) {
  if (!c1 || !c2) return c1 || c2 || '#000000';
  if (c1.startsWith('rgba') || c2.startsWith('rgba')) {
    return t < 0.5 ? c1 : c2;
  }
  const [r1, g1, b1] = parseHex(c1);
  const [r2, g2, b2] = parseHex(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

// Paletas de Cores de Alta Visibilidade (Value Hierarchy calibrada para contraste total de silhuetas)
export const ARENA_PALETTES = {
  IVORY_OSSUARY: {
    name: 'Ossário de Marfim',
    tileA: '#ded8cb',      // Mármore calcário claro
    tileB: '#cfc7b6',      // Marfim antigo desgastado
    pathA: '#e8e3d8',      // Lajes sacras polidas
    pathB: '#ded8cb',      // Lajes alternadas
    detailA: '#bfb7a4',    // Mosaicos e cantarias
    groove: '#8c806f',     // Rejunte / cinza de ossos
    fissure: '#58151f',    // Veios de sangue seco escuro
    crack: '#9c907f',      // Fissuras do mármore
    mistBase: 'rgba(235, 228, 215, 0.025)',
    mistPuff: 'rgba(215, 205, 190, 0.035)',
    emberR: 245, emberG: 235, emberB: 215, // Cinzas sagradas
    accentR: 243, accentG: 156, accentB: 18 // Ouro / chamas
  },
  CRIMSON_SALT: {
    name: 'Deserto de Sal Carmesim',
    tileA: '#f0f4f8',      // Sal branco-giz puro
    tileB: '#e2e8f0',      // Crosta salina cristalina
    pathA: '#f8fafc',      // Cristais de sal puro
    pathB: '#e8ecf1',      // Sal gema
    detailA: '#cbd5e1',    // Sedimento calcário
    groove: '#94a3b8',     // Linhas de ressecamento
    fissure: '#8b0000',    // Fendas de sangue carmesim profundo
    crack: '#64748b',      // Fissuras do sal
    mistBase: 'rgba(240, 245, 250, 0.025)',
    mistPuff: 'rgba(255, 230, 235, 0.035)',
    emberR: 255, emberG: 255, emberB: 255, // Cristais de sal cintilantes
    accentR: 231, accentG: 76, accentB: 60 // Fagulhas carmesins
  },
  ECLIPSE_BASILICA: {
    name: 'Basílica do Eclipse',
    tileA: '#9db0bf',      // Lajes de pedra lunar prateada
    tileB: '#889baa',      // Cantaria gótica fria
    pathA: '#adbcc7',      // Pedra polida sob eclipse
    pathB: '#93a5b4',      // Lajotas alternadas
    detailA: '#728494',    // Rejuntes de ferro e prata
    groove: '#5a6a78',     // Frestas profundas
    fissure: '#34495e',    // Sombras abissais
    crack: '#4a5b6c',      // Fissuras na pedra
    mistBase: 'rgba(130, 160, 190, 0.03)',
    mistPuff: 'rgba(116, 185, 255, 0.035)',
    emberR: 116, emberG: 185, emberB: 255, // Poeira estelar ciano
    accentR: 223, accentG: 230, accentB: 233 // Prata líquida
  },
  VAMPIRE: {
    name: 'Câmara Vampírica',
    tileA: '#320d17', tileB: '#1d050c',
    pathA: '#42111f', pathB: '#280711',
    detailA: '#581628', groove: '#140207',
    fissure: '#8e1b30', crack: '#26040d',
    mistBase: 'rgba(70, 15, 25, 0.04)', mistPuff: 'rgba(130, 25, 45, 0.04)',
    emberR: 231, emberG: 76, emberB: 60, accentR: 255, accentG: 107, accentB: 129
  },
  MONOLITH: {
    name: 'Terra dos Monólitos',
    tileA: '#2c1609', tileB: '#1a0a03',
    pathA: '#3a1d0d', pathB: '#231005',
    detailA: '#4e2813', groove: '#120501',
    fissure: '#e67e22', crack: '#220e04',
    mistBase: 'rgba(55, 30, 12, 0.04)', mistPuff: 'rgba(100, 50, 20, 0.04)',
    emberR: 230, emberG: 126, emberB: 34, accentR: 243, accentG: 156, accentB: 18
  },
  REAPER: {
    name: 'Cripta do Ceifador',
    tileA: '#0a1f29', tileB: '#051117',
    pathA: '#0e2937', pathB: '#071823',
    detailA: '#153c50', groove: '#030a0f',
    fissure: '#00cec9', crack: '#061e2b',
    mistBase: 'rgba(12, 45, 55, 0.04)', mistPuff: 'rgba(25, 75, 90, 0.04)',
    emberR: 0, emberG: 206, emberB: 201, accentR: 129, accentG: 236, accentB: 236
  },
  ABYSS: {
    name: 'O Vazio do Abismo',
    tileA: '#1d0930', tileB: '#0f031b',
    pathA: '#270d40', pathB: '#150524',
    detailA: '#38145b', groove: '#080110',
    fissure: '#9b59b6', crack: '#1a062e',
    mistBase: 'rgba(40, 12, 70, 0.04)', mistPuff: 'rgba(80, 25, 125, 0.04)',
    emberR: 155, emberG: 89, emberB: 182, accentR: 224, accentG: 86, accentB: 253
  },
  CEMETERY: {
    name: 'Cemitério Noturno',
    tileA: '#1c2420', tileB: '#121714',
    pathA: '#24302a', pathB: '#161c18',
    detailA: '#0c100e', groove: '#080d09',
    fissure: '#040805', crack: '#060d09',
    mistBase: 'rgba(20, 50, 35, 0.035)', mistPuff: 'rgba(35, 75, 55, 0.03)',
    emberR: 46, emberG: 204, emberB: 113, accentR: 168, accentG: 255, accentB: 219
  }
};

function lerpPalette(p1, p2, t) {
  if (!p1) return p2;
  if (!p2) return p1;
  return {
    name: t < 0.5 ? p1.name : p2.name,
    tileA: lerpColor(p1.tileA, p2.tileA, t),
    tileB: lerpColor(p1.tileB, p2.tileB, t),
    pathA: lerpColor(p1.pathA, p2.pathA, t),
    pathB: lerpColor(p1.pathB, p2.pathB, t),
    detailA: lerpColor(p1.detailA, p2.detailA, t),
    groove: lerpColor(p1.groove, p2.groove, t),
    fissure: lerpColor(p1.fissure, p2.fissure, t),
    crack: lerpColor(p1.crack, p2.crack, t),
    mistBase: t < 0.5 ? p1.mistBase : p2.mistBase,
    mistPuff: t < 0.5 ? p1.mistPuff : p2.mistPuff,
    emberR: Math.round(p1.emberR + (p2.emberR - p1.emberR) * t),
    emberG: Math.round(p1.emberG + (p2.emberG - p1.emberG) * t),
    emberB: Math.round(p1.emberB + (p2.emberB - p1.emberB) * t),
    accentR: Math.round(p1.accentR + (p2.accentR - p1.accentR) * t),
    accentG: Math.round(p1.accentG + (p2.accentG - p1.accentG) * t),
    accentB: Math.round(p1.accentB + (p2.accentB - p1.accentB) * t),
  };
}

// Gerenciamento de Estado da Transição Suave
let previousArenaTheme = 'IVORY_OSSUARY';
let transitionProgress = 1.0;
let transitionDuration = 150; // ~2.5 segundos a 60 FPS

/**
 * Dispara uma transição suave entre temas de arena.
 * @param {string} newTheme Identificador do novo tema (ex: 'IVORY_OSSUARY', 'CRIMSON_SALT')
 * @param {number} duration Duração em frames (~150 = 2.5s)
 */
export function transitionToArenaTheme(newTheme, duration = 150) {
  if (newTheme === currentArenaTheme && transitionProgress >= 1.0) return;
  previousArenaTheme = currentArenaTheme;
  setCurrentArenaTheme(newTheme);
  transitionProgress = 0.0;
  transitionDuration = Math.max(30, duration);
}

/**
 * Retorna o tema de arena correspondente a uma onda específica (1 arena a cada 3 ondas).
 * @param {number} waveIndex Índice da onda (1, 2, 3...)
 * @returns {string} Tema da arena
 */
export function getWaveArenaTheme(waveIndex) {
  const cycle = Math.floor((Math.max(1, waveIndex) - 1) / 3) % 3;
  if (cycle === 0) return 'IVORY_OSSUARY';
  if (cycle === 1) return 'CRIMSON_SALT';
  return 'ECLIPSE_BASILICA';
}

/**
 * Reseta o estado do ambiente para o início de uma nova partida.
 */
export function resetEnvironment() {
  previousArenaTheme = 'IVORY_OSSUARY';
  transitionProgress = 1.0;
  transitionDuration = 150;
  setCurrentArenaTheme('IVORY_OSSUARY');
}

export const ambientEmbers = [];
for (let i = 0; i < 48; i++) {
  ambientEmbers.push({
    x: Math.random() * 2000 - 1000,
    y: Math.random() * 2000 - 1000,
    r: Math.random() * 1.8 + 0.6,
    speed: Math.random() * 0.45 + 0.2,
    alpha: Math.random() * 0.45 + 0.25
  });
}

export function renderEnvironment(ctx) {
  const tileSize = 96;
  const startCol = Math.floor(camera.x / tileSize) - 1;
  const endCol = Math.floor((camera.x + viewW) / tileSize) + 1;
  const startRow = Math.floor(camera.y / tileSize) - 1;
  const endRow = Math.floor((camera.y + viewH) / tileSize) + 1;

  // Atualização da transição suave entre temas
  if (transitionProgress < 1.0) {
    transitionProgress = Math.min(1.0, transitionProgress + (1 / transitionDuration));
  }
  const t = smoothstep(transitionProgress);

  const prevPal = ARENA_PALETTES[previousArenaTheme] || ARENA_PALETTES.IVORY_OSSUARY;
  const currPal = ARENA_PALETTES[currentArenaTheme] || ARENA_PALETTES.IVORY_OSSUARY;
  const pal = transitionProgress >= 1.0 ? currPal : lerpPalette(prevPal, currPal, t);

  // 1. RENDERIZAÇÃO DO SOLO COM LERP CROMÁTICO (Alta Visibilidade e Zonas Orgânicas)
  for (let c = startCol; c <= endCol; c++) {
    for (let r = startRow; r <= endRow; r++) {
      const tileX = c * tileSize;
      const tileY = r * tileSize;
      const h = tileHash(c, r);
      const macroZone = smoothNoise(c * 0.18, r * 0.18);

      if (macroZone > 0.62) {
        // Trilhas de lajotas polidas
        ctx.fillStyle = (c + r) % 2 === 0 ? pal.pathA : pal.pathB;
        ctx.fillRect(tileX, tileY, tileSize, tileSize);

        // Detalhes de calçamento encaixado
        ctx.fillStyle = pal.detailA;
        ctx.fillRect(tileX + 10, tileY + 12, 32, 22);
        ctx.fillRect(tileX + 50, tileY + 24, 38, 26);
        ctx.fillRect(tileX + 18, tileY + 54, 44, 28);
      } else if (macroZone < 0.36) {
        // Sedimentos / crostas e fendas
        ctx.fillStyle = h > 0.5 ? pal.tileB : pal.groove;
        ctx.fillRect(tileX, tileY, tileSize, tileSize);

        // Manchas ou poças de resíduos / sangue antigo
        if (h < 0.28) {
          ctx.fillStyle = pal.fissure;
          ctx.beginPath();
          ctx.ellipse(tileX + 48, tileY + 48, 28, 14, h * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Solo base límpido de alto contraste
        ctx.fillStyle = h > 0.5 ? pal.tileA : pal.tileB;
        ctx.fillRect(tileX, tileY, tileSize, tileSize);
      }

      // Fissuras no solo
      if (h > 0.86) {
        ctx.strokeStyle = pal.fissure;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(tileX + 10, tileY + 15);
        ctx.lineTo(tileX + 45, tileY + 48);
        ctx.lineTo(tileX + 80, tileY + 52);
        ctx.stroke();
      }
    }
  }

  // 2. PROPS E CENOGRAFIA PROCEDURAL (Cross-fade suave entre temas)
  if (transitionProgress < 1.0) {
    ctx.save();
    ctx.globalAlpha = 1.0 - t;
    renderArenaProps(ctx, previousArenaTheme, startCol, endCol, startRow, endRow, tileSize);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = t;
    renderArenaProps(ctx, currentArenaTheme, startCol, endCol, startRow, endRow, tileSize);
    ctx.restore();
  } else {
    renderArenaProps(ctx, currentArenaTheme, startCol, endCol, startRow, endRow, tileSize);
  }

  // 3. POÇAS DE SANGUE E ÁCIDO
  bloodSplats.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  acidPuddles.forEach(p => {
    const pulse = Math.sin(frameCount * 0.15) * 3;
    ctx.fillStyle = p.isFire ? 'rgba(230, 126, 34, 0.35)' : 'rgba(46, 204, 113, 0.28)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.isFire ? '#e67e22' : 'rgba(46, 204, 113, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // 4. PARTÍCULAS ATMOSFÉRICAS ADAPTATIVAS (Chispas, Cinzas e Cristais de Sal)
  for (let s of ambientEmbers) {
    const floatY = s.y - (frameCount * 0.3 * s.speed);
    const sway = Math.sin(frameCount * 0.03 + s.y) * 8;
    let sx = (((s.x + sway) - camera.x * s.speed) % viewW + viewW) % viewW;
    let sy = ((floatY - camera.y * s.speed) % viewH + viewH) % viewH;

    const pulse = Math.sin(frameCount * 0.05 + s.x) * 0.35 + 0.65;
    ctx.fillStyle = `rgba(${pal.emberR}, ${pal.emberG}, ${pal.emberB}, ${s.alpha * 0.25 * pulse})`;
    ctx.beginPath();
    ctx.arc(camera.x + sx, camera.y + sy, s.r * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(${pal.accentR}, ${pal.accentG}, ${pal.accentB}, ${s.alpha * pulse})`;
    ctx.beginPath();
    ctx.arc(camera.x + sx, camera.y + sy, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. NÉVOA VOLUMÉTRICA RASTEIRA TRANSLÚCIDA
  const mist1 = (frameCount * 0.35 + camera.x * 0.2) % 1200;
  const mist2 = (frameCount * 0.20 + camera.y * 0.15) % 1200;

  ctx.fillStyle = pal.mistBase;
  ctx.fillRect(camera.x, camera.y, viewW, viewH);

  ctx.fillStyle = pal.mistPuff;
  ctx.beginPath();
  ctx.ellipse(camera.x + (viewW * 0.5) - mist1 + 600, camera.y + viewH * 0.4, 380, 90, 0.05, 0, Math.PI * 2);
  ctx.ellipse(camera.x + mist2, camera.y + viewH * 0.75, 440, 110, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // 6. VINHETA PERIFÉRICA SUAVE (Calibrada: iluminação ampla, bordas leves sem cegar os cantos)
  const vignette = ctx.createRadialGradient(
    camera.x + viewW / 2, 
    camera.y + viewH / 2, 
    Math.min(viewW, viewH) * 0.65,
    camera.x + viewW / 2, 
    camera.y + viewH / 2, 
    Math.max(viewW, viewH) * 0.95
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(10, 15, 20, 0.16)');
  ctx.fillStyle = vignette;
  ctx.fillRect(camera.x, camera.y, viewW, viewH);
}

/**
 * Despacha a renderização dos props procedurais de acordo com o tema.
 */
function renderArenaProps(ctx, theme, startCol, endCol, startRow, endRow, tileSize) {
  for (let c = startCol; c <= endCol; c++) {
    for (let r = startRow; r <= endRow; r++) {
      const tileX = c * tileSize;
      const tileY = r * tileSize;
      const h = tileHash(c, r);
      const h2 = tileHash(c + 71, r + 137);
      const h3 = tileHash(c - 93, r + 419);

      if (theme === 'IVORY_OSSUARY') {
        drawIvoryOssuaryProps(ctx, c, r, tileX, tileY, h, h2, h3);
      } else if (theme === 'CRIMSON_SALT') {
        drawCrimsonSaltProps(ctx, c, r, tileX, tileY, h, h2, h3);
      } else if (theme === 'ECLIPSE_BASILICA') {
        drawEclipseBasilicaProps(ctx, c, r, tileX, tileY, h, h2, h3);
      } else if (theme === 'CEMETERY' || theme === 'INDUSTRIAL') {
        drawCemeteryProps(ctx, c, r, tileX, tileY, h, h2, h3);
      }
    }
  }
}

/**
 * ARENA 1: OSSÁRIO DE MARFIM (Candelabros góticos tombados, mosaicos de crânios, anjos decapitados)
 */
function drawIvoryOssuaryProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Grande Candelabro Gótico de Ferro Negro Tombado
  if (c % 9 === 0 && r % 9 === 0) {
    const mx = tileX + 18;
    const my = tileY + 16;

    // Sombra translúcida no mármore claro
    ctx.fillStyle = 'rgba(40, 35, 30, 0.24)';
    ctx.beginPath();
    ctx.ellipse(mx + 36, my + 34, 46, 20, -0.18, 0, Math.PI * 2);
    ctx.fill();

    // Aro de ferro forjado negro
    ctx.strokeStyle = '#252024';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(mx + 36, my + 30, 38, 16, -0.18, 0, Math.PI * 2);
    ctx.stroke();

    // Raio central e correntes caídas
    ctx.strokeStyle = '#383236';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx + 8, my + 22);
    ctx.lineTo(mx + 64, my + 38);
    ctx.moveTo(mx + 22, my + 44);
    ctx.lineTo(mx + 50, my + 16);
    ctx.stroke();

    // 6 Velas de cera pálida acesas com chamas âmbar
    const candleOffsets = [
      { x: mx + 10, y: my + 18 },
      { x: mx + 24, y: my + 14 },
      { x: mx + 48, y: my + 20 },
      { x: mx + 62, y: my + 32 },
      { x: mx + 46, y: my + 42 },
      { x: mx + 24, y: my + 44 }
    ];

    candleOffsets.forEach((cd, idx) => {
      const flicker = Math.sin(frameCount * 0.2 + idx * 1.5) * 1.4;
      ctx.fillStyle = '#ded8cb';
      ctx.fillRect(cd.x - 1.5, cd.y - 7, 3, 7);

      ctx.fillStyle = 'rgba(243, 156, 18, 0.22)';
      ctx.beginPath();
      ctx.arc(cd.x, cd.y - 10, 8 + flicker, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(cd.x, cd.y - 9, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cd.x, cd.y - 10, 1.1, 0, Math.PI * 2);
      ctx.fill();
    });
    return;
  }

  // Props Secundários: Mosaico Ritual de Crânios no Piso
  if (h < 0.08) {
    const gx = tileX + 26 + (h2 * 34);
    const gy = tileY + 22 + (h3 * 28);

    ctx.strokeStyle = '#5a131e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(gx + 12, gy + 12, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ece6d8';
    ctx.beginPath();
    ctx.arc(gx + 12, gy + 12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a7d6d';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#2b2426';
    ctx.fillRect(gx + 9, gy + 10, 2.2, 2.5);
    ctx.fillRect(gx + 13, gy + 10, 2.2, 2.5);
    ctx.fillRect(gx + 11, gy + 14, 2, 2);

    const vx = gx + 22;
    const vy = gy + 4;
    const flick = Math.sin(frameCount * 0.18 + gx) * 1.2;
    ctx.fillStyle = '#ded8cb';
    ctx.fillRect(vx - 1, vy - 6, 2.5, 6);
    ctx.fillStyle = 'rgba(243, 156, 18, 0.28)';
    ctx.beginPath();
    ctx.arc(vx, vy - 8, 6 + flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(vx, vy - 8, 1.8, 0, Math.PI * 2);
    ctx.fill();

  } else if (h >= 0.08 && h < 0.16) {
    // Estátua Sacra Decapitada de Anjo em Mármore
    const sx = tileX + 32 + (h2 * 28);
    const sy = tileY + 20 + (h3 * 26);

    ctx.fillStyle = 'rgba(40, 35, 30, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 30, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cdc5b4';
    ctx.fillRect(sx - 10, sy + 18, 20, 12);
    ctx.strokeStyle = '#9c907f';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(sx - 10, sy + 18, 20, 12);

    ctx.fillStyle = '#e8e2d4';
    ctx.beginPath();
    ctx.moveTo(sx - 7, sy + 18);
    ctx.lineTo(sx - 5, sy + 4);
    ctx.lineTo(sx + 5, sy + 4);
    ctx.lineTo(sx + 7, sy + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dcd5c4';
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy + 6);
    ctx.lineTo(sx - 14, sy - 2);
    ctx.lineTo(sx - 6, sy + 12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sx + 5, sy + 6);
    ctx.lineTo(sx + 14, sy - 2);
    ctx.lineTo(sx + 6, sy + 12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#241b1e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx - 1, sy + 4);
    ctx.lineTo(sx - 1, sy + 16);
    ctx.stroke();

  } else if (h >= 0.16 && h < 0.32) {
    // Inscrição Sacrílega Entalhada na Pedra & Cinzas Sagradas
    const rx = tileX + 24 + (h2 * 45);
    const ry = tileY + 24 + (h3 * 45);

    ctx.strokeStyle = '#bfa87a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 14, ry + 14);
    ctx.moveTo(rx + 14, ry);
    ctx.lineTo(rx, ry + 14);
    ctx.stroke();

    ctx.fillStyle = 'rgba(120, 110, 95, 0.18)';
    ctx.beginPath();
    ctx.ellipse(rx + 7, ry + 7, 18, 9, h, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * ARENA 2: DESERTO DE SAL CARMESIM (Arcadas de leviatã, cristais prismáticos e fendas arteriais)
 */
function drawCrimsonSaltProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Arcada Costal de Leviatã Fossilizado
  if ((c + 4) % 9 === 0 && (r + 4) % 9 === 0) {
    const lx = tileX + 20;
    const ly = tileY + 18;

    ctx.fillStyle = 'rgba(30, 45, 60, 0.18)';
    ctx.beginPath();
    ctx.ellipse(lx + 32, ly + 42, 48, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(lx - 4, ly + 26, 68, 8);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(lx - 4, ly + 26, 68, 8);

    const ribOffsets = [4, 18, 34, 50];
    ribOffsets.forEach(ro => {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(lx + ro, ly + 26);
      ctx.quadraticCurveTo(lx + ro + 10, ly - 22, lx + ro + 20, ly + 26);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(lx + ro, ly + 26);
      ctx.quadraticCurveTo(lx + ro + 10, ly - 22, lx + ro + 20, ly + 26);
      ctx.stroke();
    });
    return;
  }

  // Props Secundários: Cristais de Sal Gema Prismáticos
  if (h < 0.09) {
    const kx = tileX + 28 + (h2 * 32);
    const ky = tileY + 24 + (h3 * 30);

    ctx.fillStyle = 'rgba(25, 40, 55, 0.16)';
    ctx.beginPath();
    ctx.ellipse(kx + 4, ky + 18, 14, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(kx, ky + 16);
    ctx.lineTo(kx + 4, ky - 6);
    ctx.lineTo(kx + 9, ky + 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 184, 184, 0.55)';
    ctx.beginPath();
    ctx.moveTo(kx + 4, ky - 6);
    ctx.lineTo(kx + 9, ky + 16);
    ctx.lineTo(kx + 4, ky + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(kx + 7, ky + 16);
    ctx.lineTo(kx + 14, ky + 2);
    ctx.lineTo(kx + 16, ky + 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  } else if (h >= 0.09 && h < 0.18) {
    // Fenda Arterial de Sangue Borbulhante no Sal
    const fx = tileX + 30 + (h2 * 28);
    const fy = tileY + 28 + (h3 * 24);
    const pulse = Math.sin(frameCount * 0.14 + h * 10) * 1.5;

    ctx.fillStyle = '#800000';
    ctx.beginPath();
    ctx.ellipse(fx, fy, 16, 8, h * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = '#d63031';
    ctx.beginPath();
    ctx.arc(fx + 2, fy - 1, Math.max(1, 2.5 + pulse), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fx + 1.2, fy - 2, 0.9, 0, Math.PI * 2);
    ctx.fill();

  } else if (h >= 0.18 && h < 0.35) {
    const px = tileX + 22 + (h2 * 46);
    const py = tileY + 20 + (h3 * 46);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + 12, py + 6);
    ctx.lineTo(px + 20, py - 4);
    ctx.moveTo(px + 12, py + 6);
    ctx.lineTo(px + 10, py + 18);
    ctx.stroke();
  }
}

/**
 * ARENA 3: BASÍLICA DO ECLIPSE (Rosácea monumental, vitrais estilhaçados, runas de prata líquida)
 */
function drawEclipseBasilicaProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Rosácea Gótica Monumental Desmoronada
  if ((c + 2) % 9 === 0 && (r + 6) % 9 === 0) {
    const rx = tileX + 16;
    const ry = tileY + 16;

    ctx.fillStyle = 'rgba(20, 30, 45, 0.3)';
    ctx.beginPath();
    ctx.ellipse(rx + 36, ry + 36, 44, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#748796';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(rx + 36, ry + 32, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(rx + 36, ry + 32, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dfe6e9';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const shards = [
      { x: rx + 24, y: ry + 22, col: '#e74c3c' },
      { x: rx + 48, y: ry + 20, col: '#0984e3' },
      { x: rx + 22, y: ry + 40, col: '#f1c40f' },
      { x: rx + 46, y: ry + 44, col: '#2ecc71' }
    ];
    shards.forEach(sh => {
      ctx.fillStyle = sh.col;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x + 6, sh.y + 2);
      ctx.lineTo(sh.x + 3, sh.y + 7);
      ctx.closePath();
      ctx.fill();
    });
    return;
  }

  // Props Secundários: Cacos de Vitrais Sacros Refletindo Luz do Eclipse
  if (h < 0.09) {
    const vx = tileX + 26 + (h2 * 35);
    const vy = tileY + 24 + (h3 * 30);

    ctx.fillStyle = '#0984e3';
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + 9, vy + 4);
    ctx.lineTo(vx + 4, vy + 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(vx + 11, vy + 3);
    ctx.lineTo(vx + 18, vy + 7);
    ctx.lineTo(vx + 14, vy + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(vx + 3, vy + 14);
    ctx.lineTo(vx + 8, vy + 18);
    ctx.lineTo(vx + 1, vy + 19);
    ctx.closePath();
    ctx.fill();

    const glint = Math.sin(frameCount * 0.15 + vx) > 0.7;
    if (glint) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(vx + 5, vy + 3, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (h >= 0.09 && h < 0.17) {
    const mx = tileX + 30 + (h2 * 28);
    const my = tileY + 22 + (h3 * 28);

    ctx.fillStyle = 'rgba(20, 30, 40, 0.28)';
    ctx.fillRect(mx - 8, my - 6, 16, 22);

    ctx.fillStyle = '#d5e2ea';
    ctx.fillRect(mx - 7, my - 5, 14, 20);
    ctx.strokeStyle = '#546574';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(mx - 7, my - 5, 14, 20);

    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx - 3, my);
    ctx.lineTo(mx + 4, my + 6);
    ctx.lineTo(mx - 5, my + 10);
    ctx.moveTo(mx + 4, my + 6);
    ctx.lineTo(mx + 6, my + 14);
    ctx.stroke();

  } else if (h >= 0.17 && h < 0.32) {
    const ax = tileX + 24 + (h2 * 45);
    const ay = tileY + 24 + (h3 * 45);

    ctx.strokeStyle = 'rgba(116, 185, 255, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(ax + 10, ay + 10, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ax + 10, ay + 10, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(ax + 8.5, ay + 6, 3, 8);
    ctx.fillRect(ax + 6, ay + 8.5, 8, 3);
  }
}

/**
 * FALLBACK: CENÁRIO DO CEMITÉRIO NOTURNO
 */
function drawCemeteryProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  if (c % 9 === 0 && r % 9 === 0) {
    const mx = tileX + 16;
    const my = tileY + 12;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(mx + 36, my + 64, 44, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c2420';
    ctx.fillRect(mx, my, 72, 60);
    ctx.strokeStyle = '#2d3b34';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(mx, my, 72, 60);
    return;
  }

  if (h < 0.08) {
    const gx = tileX + 24 + (h2 * 36);
    const gy = tileY + 20 + (h3 * 28);
    ctx.fillStyle = '#202924';
    ctx.beginPath();
    ctx.arc(gx + 12, gy + 12, 12, Math.PI, 0);
    ctx.lineTo(gx + 24, gy + 34);
    ctx.lineTo(gx, gy + 34);
    ctx.closePath();
    ctx.fill();
  }
}
