import { 
  camera, 
  viewW, 
  viewH, 
  currentArenaTheme, 
  setCurrentArenaTheme,
  bloodSplats, 
  acidPuddles, 
  frameCount,
  activeBoss
} from '../main.js';
import { player } from '../entities/player.js';

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
    name: 'Salão Carmesim',
    tileA: '#631828',      // Mármore carmesim nobre
    tileB: '#490e1b',      // Vinho imperial profundo
    pathA: '#7b1e32',      // Lajes de banquete polidas
    pathB: '#561220',      // Lajes alternadas
    detailA: '#b38f4d',    // Veios de ouro imperial barroco
    groove: '#28060e',     // Rejunte de ônix
    fissure: '#a31b34',    // Veios de sangue puro brilhante
    crack: '#3d0a15',      // Fissuras no mármore
    mistBase: 'rgba(80, 15, 30, 0.035)',
    mistPuff: 'rgba(140, 25, 50, 0.04)',
    emberR: 255, emberG: 71, emberB: 87, // Mariposas de sangue / brasas carmesins
    accentR: 241, accentG: 196, accentB: 15 // Ouro de cálices
  },
  MONOLITH: {
    name: 'Caldeira Tectônica',
    tileA: '#4c4642',      // Basalto vulcânico cinza-médio
    tileB: '#3a3430',      // Rocha ígnea porosa
    pathA: '#5a534e',      // Lajes de basalto polido
    pathB: '#443e3a',      // Lajes alternadas
    detailA: '#262220',    // Obsidiana negra
    groove: '#d35400',     // Fendas crepitantes de magma vivo
    fissure: '#f39c12',    // Lava incandescente
    crack: '#e67e22',      // Fissuras sísmicas
    mistBase: 'rgba(55, 28, 12, 0.035)',
    mistPuff: 'rgba(125, 55, 18, 0.04)',
    emberR: 230, emberG: 126, emberB: 34, // Fagulhas de fogo e cinzas
    accentR: 243, accentG: 156, accentB: 18 // Calor solar de magma
  },
  REAPER: {
    name: 'Necrópole Espectral',
    tileA: '#58768a',      // Ardósia congelada azul-cinza
    tileB: '#435d6e',      // Pedra sepulcral gélida
    pathA: '#6b8ca2',      // Lajes de geada polida
    pathB: '#4d697c',      // Lajes alternadas
    detailA: '#2c404d',    // Gelo negro profundo
    groove: '#1d2d38',     // Frestas de permafrost
    fissure: '#00cec9',    // Fissuras de alma ciano fluorescente
    crack: '#81ecec',      // Fissuras de gelo espectral
    mistBase: 'rgba(22, 55, 70, 0.035)',
    mistPuff: 'rgba(0, 206, 201, 0.04)',
    emberR: 0, emberG: 206, emberB: 201, // Fogos-fátuos ciano
    accentR: 223, accentG: 249, accentB: 251 // Geada pura
  },
  ABYSS: {
    name: 'Horizonte do Vazio',
    tileA: '#542c70',      // Obsidiana dimensional ametista
    tileB: '#3c1c50',      // Tecido do espaço-tempo
    pathA: '#68368b',      // Lajes de matéria estelar
    pathB: '#482262',      // Lajes alternadas
    detailA: '#240f32',    // Vácuo cósmico
    groove: '#160622',     // Singularidade gravitacional
    fissure: '#d980fa',    // Fendas de nébula cósmica fluorescente
    crack: '#8e44ad',      // Fissuras dimensionais
    mistBase: 'rgba(50, 18, 75, 0.035)',
    mistPuff: 'rgba(155, 89, 182, 0.04)',
    emberR: 224, emberG: 86, emberB: 253, // Poeira estelar ultravioleta
    accentR: 116, accentG: 185, accentB: 255 // Plasma cósmico estelar
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

/**
 * Estado rastreado da singularidade do Altar do Fim dos Tempos (Boss Final).
 */
const lastAbyssState = { x: 0, y: 0, radius: 620, phase: 1 };

export function getAbyssArenaState() {
  if (activeBoss && (activeBoss.bossId === 4 || activeBoss.arenaCenterX !== undefined)) {
    lastAbyssState.x = activeBoss.arenaCenterX;
    lastAbyssState.y = activeBoss.arenaCenterY;
    lastAbyssState.radius = activeBoss.arenaRadius || 620;
    lastAbyssState.phase = activeBoss.phase || 1;
  } else if (!lastAbyssState.x && !lastAbyssState.y && player) {
    lastAbyssState.x = player.x;
    lastAbyssState.y = player.y;
  }
  return lastAbyssState;
}

/**
 * Renderiza a arena surreal do Chefe Final: O Altar da Singularidade / O Disco do Fim dos Tempos.
 * Plataforma cósmica 2.5D de obsidiana flutuando no vazio infinito, com horizonte de eventos,
 * relógio astronômico de entropia, monólitos com correntes de plasma e olhos vivos do abismo.
 */
export function renderSurrealAbyssArena(ctx) {
  const arena = getAbyssArenaState();
  const cx = arena.x;
  const cy = arena.y;
  const R = arena.radius;
  const phase = arena.phase || 1;

  // ==========================================
  // CAMADA 1: O VAZIO CÓSMICO PROFUNDO (BACKGROUND)
  // ==========================================
  ctx.fillStyle = '#040108';
  ctx.fillRect(camera.x, camera.y, viewW, viewH);

  // Estrelas cósmicas no vácuo com leve paralaxe
  for (let i = 0; i < 48; i++) {
    const h1 = tileHash(i * 13, i * 37);
    const h2 = tileHash(i * 71, i * 19);
    const starX = camera.x + ((h1 * 3200 - camera.x * 0.08) % viewW + viewW) % viewW;
    const starY = camera.y + ((h2 * 3200 - camera.y * 0.08) % viewH + viewH) % viewH;
    const twinkle = Math.sin(frameCount * 0.05 + i * 2) * 0.4 + 0.6;
    const isCyan = i % 3 === 0;
    ctx.fillStyle = isCyan ? `rgba(0, 206, 201, ${0.7 * twinkle})` : `rgba(232, 67, 147, ${0.6 * twinkle})`;
    ctx.beginPath();
    ctx.arc(starX, starY, (i % 5 === 0 ? 2.2 : 1.2), 0, Math.PI * 2);
    ctx.fill();
  }

  // Disco de Acreção do Buraco Negro Supermassivo
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.25);

  const accGrad = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 2.3);
  accGrad.addColorStop(0, 'rgba(108, 92, 231, 0.28)');
  accGrad.addColorStop(0.35, 'rgba(232, 67, 147, 0.2)');
  accGrad.addColorStop(0.7, 'rgba(0, 206, 201, 0.14)');
  accGrad.addColorStop(1, 'rgba(4, 1, 8, 0)');
  ctx.fillStyle = accGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 2.3, R * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();

  const accAngle = frameCount * 0.004;
  for (let a = 0; a < 4; a++) {
    const streamAngle = accAngle + (a * Math.PI / 2);
    ctx.strokeStyle = a % 2 === 0 ? 'rgba(0, 206, 201, 0.35)' : 'rgba(232, 67, 147, 0.3)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 1.55 + Math.sin(frameCount * 0.02 + a) * 20, (R * 1.55) * 0.38, streamAngle, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  // Ruínas de templos celestiais à deriva no vácuo
  const debrisCount = 10;
  for (let i = 0; i < debrisCount; i++) {
    const baseAngle = (i * Math.PI * 2) / debrisCount + 0.3;
    const driftDist = R + 220 + (i * 45) % 320;
    const floatX = cx + Math.cos(baseAngle) * driftDist + Math.sin(frameCount * 0.01 + i) * 15;
    const floatY = cy + Math.sin(baseAngle) * driftDist + Math.cos(frameCount * 0.012 + i) * 12;
    const debSize = 22 + (i % 4) * 10;

    ctx.save();
    ctx.translate(floatX, floatY);
    ctx.rotate(frameCount * 0.003 * ((i % 2 === 0) ? 1 : -1) + i);
    ctx.fillStyle = '#0e0618';
    ctx.beginPath();
    ctx.moveTo(-debSize * 0.6, -debSize * 0.4);
    ctx.lineTo(debSize * 0.8, -debSize * 0.2);
    ctx.lineTo(debSize * 0.5, debSize * 0.7);
    ctx.lineTo(-debSize * 0.7, debSize * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 206, 201, 0.45)' : 'rgba(224, 86, 253, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // Olhos Cósmicos Colossais observando silenciosamente
  const cosmicEyes = [
    { angle: -0.85, dist: R + 340, size: 48 },
    { angle: 1.15, dist: R + 400, size: 62 },
    { angle: 2.8, dist: R + 360, size: 54 }
  ];
  for (let eIdx = 0; eIdx < cosmicEyes.length; eIdx++) {
    const ce = cosmicEyes[eIdx];
    const ex = cx + Math.cos(ce.angle) * ce.dist;
    const ey = cy + Math.sin(ce.angle) * ce.dist;
    const openAmount = Math.max(0.08, Math.sin(frameCount * 0.02 + eIdx * 4));
    if (openAmount > 0.1) {
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(ce.angle + Math.PI / 2);

      const eyeGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, ce.size * 1.2);
      eyeGlow.addColorStop(0, 'rgba(232, 67, 147, 0.35)');
      eyeGlow.addColorStop(0.6, 'rgba(108, 92, 231, 0.15)');
      eyeGlow.addColorStop(1, 'rgba(4, 1, 8, 0)');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(0, 0, ce.size * 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 206, 201, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, ce.size, ce.size * 0.45 * openAmount, 0, 0, Math.PI * 2);
      ctx.stroke();

      const pdx = player.x - ex;
      const pdy = player.y - ey;
      const pDist = Math.hypot(pdx, pdy) || 1;
      const pupOffset = Math.min(ce.size * 0.25, pDist * 0.04);
      const pupAngle = Math.atan2(pdy, pdx) - (ce.angle + Math.PI / 2);

      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.arc(Math.cos(pupAngle) * pupOffset, Math.sin(pupAngle) * pupOffset * openAmount, ce.size * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#05020c';
      ctx.beginPath();
      ctx.ellipse(Math.cos(pupAngle) * pupOffset, Math.sin(pupAngle) * pupOffset * openAmount, ce.size * 0.07, ce.size * 0.15 * openAmount, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ==========================================
  // CAMADA 2: O PRECIPÍCIO 2.5D E CASCATAS DE MATÉRIA ESCURA
  // ==========================================
  const cliffDepth = 28;
  ctx.fillStyle = '#0a0314';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI);
  ctx.lineTo(cx - R, cy + cliffDepth);
  ctx.arc(cx, cy + cliffDepth, R, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(232, 67, 147, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy + (cliffDepth * 0.5), R - 2, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 206, 201, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy + (cliffDepth * 0.8), R - 4, 0.3, Math.PI - 0.3);
  ctx.stroke();

  // Cascatas de luz e matéria caindo no infinito
  const cascadeStreams = 16;
  for (let c = 0; c < cascadeStreams; c++) {
    const cAngle = (c * Math.PI * 2) / cascadeStreams + 0.1;
    const lipX = cx + Math.cos(cAngle) * R;
    const lipY = cy + Math.sin(cAngle) * R;
    const flowLength = 42 + Math.sin(frameCount * 0.1 + c * 2) * 16;
    const streamAlpha = 0.35 + Math.sin(frameCount * 0.08 + c) * 0.2;

    const cascadeGrad = ctx.createLinearGradient(lipX, lipY, lipX, lipY + flowLength);
    cascadeGrad.addColorStop(0, `rgba(0, 206, 201, ${streamAlpha})`);
    cascadeGrad.addColorStop(0.5, `rgba(232, 67, 147, ${streamAlpha * 0.6})`);
    cascadeGrad.addColorStop(1, 'rgba(10, 3, 20, 0)');

    ctx.fillStyle = cascadeGrad;
    ctx.fillRect(lipX - 3, lipY, 6, flowLength);

    if ((frameCount + c * 3) % 4 === 0) {
      ctx.fillStyle = '#81ecec';
      ctx.beginPath();
      ctx.arc(lipX + (Math.random() * 6 - 3), lipY + (Math.random() * 4), 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================
  // CAMADA 3: PISO DE ESPELHO DE OBSIDIANA (CLIPPED)
  // ==========================================
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Fundo do espelho de obsidiana
  const floorGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  floorGrad.addColorStop(0, '#1c0c2e');
  floorGrad.addColorStop(0.5, '#12071f');
  floorGrad.addColorStop(0.85, '#0b0313');
  floorGrad.addColorStop(1, '#050109');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(cx - R - 5, cy - R - 5, (R + 5) * 2, (R + 5) * 2);

  // Nebulosa refletida na lâmina de obsidiana
  const mirrorNebula = ctx.createRadialGradient(
    cx + Math.sin(frameCount * 0.01) * 80, 
    cy + Math.cos(frameCount * 0.01) * 80, 
    20, 
    cx, 
    cy, 
    R * 0.7
  );
  mirrorNebula.addColorStop(0, 'rgba(108, 92, 231, 0.22)');
  mirrorNebula.addColorStop(0.5, 'rgba(232, 67, 147, 0.12)');
  mirrorNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = mirrorNebula;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  // Divisores de placas radiais da plataforma (16 setores)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1.2;
  for (let s = 0; s < 16; s++) {
    const sAngle = (s * Math.PI * 2) / 16;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(sAngle) * (R * 0.25), cy + Math.sin(sAngle) * (R * 0.25));
    ctx.lineTo(cx + Math.cos(sAngle) * (R * 0.98), cy + Math.sin(sAngle) * (R * 0.98));
    ctx.stroke();
  }

  // --- RELÓGIO ASTRONÔMICO DE ENTROPIA ---
  // Anel 1: Externo Rúnico (0.84 * R) rotacionando anti-horário
  const ring1R = R * 0.84;
  const rot1 = -frameCount * 0.003;
  ctx.strokeStyle = 'rgba(217, 128, 250, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, ring1R, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(217, 128, 250, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, ring1R - 10, 0, Math.PI * 2);
  ctx.stroke();

  for (let g = 0; g < 36; g++) {
    const gAngle = rot1 + (g * Math.PI * 2) / 36;
    const gx1 = cx + Math.cos(gAngle) * (ring1R - 8);
    const gy1 = cy + Math.sin(gAngle) * (ring1R - 8);
    const gx2 = cx + Math.cos(gAngle) * ring1R;
    const gy2 = cy + Math.sin(gAngle) * ring1R;
    ctx.strokeStyle = (g % 3 === 0) ? 'rgba(0, 206, 201, 0.6)' : 'rgba(217, 128, 250, 0.35)';
    ctx.lineWidth = (g % 3 === 0) ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(gx1, gy1);
    ctx.lineTo(gx2, gy2);
    ctx.stroke();
  }

  // Anel 2: Geometria Sagrada / Estrela de 8 pontas (0.56 * R) rotacionando horário
  const ring2R = R * 0.56;
  const rot2 = frameCount * 0.005;
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.4)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, ring2R, 0, Math.PI * 2);
  ctx.stroke();

  for (let star = 0; star < 2; star++) {
    const starOffset = rot2 + (star * Math.PI / 8);
    ctx.strokeStyle = star === 0 ? 'rgba(0, 206, 201, 0.45)' : 'rgba(232, 67, 147, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let pt = 0; pt <= 8; pt++) {
      const ptAngle = starOffset + (pt * Math.PI * 2) / 8;
      const px = cx + Math.cos(ptAngle) * ring2R;
      const py = cy + Math.sin(ptAngle) * ring2R;
      if (pt === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Anel 3: Vórtice de Singularidade Interno (0.28 * R)
  const ring3R = R * 0.28;
  const spiralPulse = Math.sin(frameCount * 0.08) * 4;
  ctx.strokeStyle = 'rgba(224, 86, 253, 0.6)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, ring3R + spiralPulse, 0, Math.PI * 2);
  ctx.stroke();

  for (let sp = 0; sp < 4; sp++) {
    const spBase = frameCount * 0.02 + (sp * Math.PI / 2);
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let step = 0; step < 24; step++) {
      const stepR = ring3R * (1 - step / 24);
      const stepAngle = spBase + step * 0.25;
      const spx = cx + Math.cos(stepAngle) * stepR;
      const spy = cy + Math.sin(stepAngle) * stepR;
      if (step === 0) ctx.moveTo(spx, spy);
      else ctx.lineTo(spx, spy);
    }
    ctx.stroke();
  }

  // Singularidade Central
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ring3R * 0.65);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.2, '#00cec9');
  coreGrad.addColorStop(0.55, '#8e44ad');
  coreGrad.addColorStop(0.85, '#2c0e3e');
  coreGrad.addColorStop(1, 'rgba(10, 2, 20, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, ring3R * 0.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#030006';
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Olhos Vivos no Piso
  const floorEyes = [
    { angle: 0.5, distRatio: 0.44 },
    { angle: 1.6, distRatio: 0.68 },
    { angle: 2.7, distRatio: 0.48 },
    { angle: 3.8, distRatio: 0.72 },
    { angle: 4.9, distRatio: 0.42 },
    { angle: 5.7, distRatio: 0.65 }
  ];
  for (let fe = 0; fe < floorEyes.length; fe++) {
    const eyeDef = floorEyes[fe];
    const fx = cx + Math.cos(eyeDef.angle) * (R * eyeDef.distRatio);
    const fy = cy + Math.sin(eyeDef.angle) * (R * eyeDef.distRatio);
    const blinkVal = Math.sin(frameCount * 0.04 + fe * 2.2);
    if (blinkVal > -0.7) {
      const openH = Math.max(2, (blinkVal + 0.7) * 7);
      ctx.fillStyle = '#06010a';
      ctx.beginPath();
      ctx.ellipse(fx, fy, 16, openH, eyeDef.angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = (phase === 3) ? '#00cec9' : '#e84393';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      const pDistX = player.x - fx;
      const pDistY = player.y - fy;
      const pLen = Math.hypot(pDistX, pDistY) || 1;
      const pupShift = Math.min(6, pLen * 0.03);
      const pAng = Math.atan2(pDistY, pDistX);

      ctx.fillStyle = (phase === 3) ? '#00cec9' : '#fd79a8';
      ctx.beginPath();
      ctx.arc(fx + Math.cos(pAng) * pupShift, fy + Math.sin(pAng) * pupShift, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(pAng) * pupShift, fy + Math.sin(pAng) * pupShift, 1.4, openH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (phase >= 2) {
        ctx.strokeStyle = phase === 3 ? 'rgba(0, 206, 201, 0.5)' : 'rgba(232, 67, 147, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fx, fy + openH);
        ctx.lineTo(fx + Math.sin(fe) * 4, fy + openH + 14);
        ctx.stroke();
      }
    }
  }

  ctx.restore();

  // ==========================================
  // CAMADA 4: 12 MONÓLITOS DE CONTENÇÃO & CADEIAS DE PLASMA
  // ==========================================
  const monolithCount = 12;
  const monolithPos = [];

  for (let i = 0; i < monolithCount; i++) {
    const mAngle = (i * Math.PI * 2) / monolithCount;
    const mx = cx + Math.cos(mAngle) * (R - 4);
    const my = cy + Math.sin(mAngle) * (R - 4);
    monolithPos.push({ x: mx, y: my, angle: mAngle });
  }

  const plasmaColor = phase === 3 ? 'rgba(0, 206, 201, ' : (phase === 2 ? 'rgba(232, 67, 147, ' : 'rgba(186, 120, 255, ');
  const plasmaGlow = phase === 3 ? '#00cec9' : (phase === 2 ? '#e84393' : '#a29bfe');

  for (let i = 0; i < monolithCount; i++) {
    const curr = monolithPos[i];
    const next = monolithPos[(i + 1) % monolithCount];
    const segs = 6;

    ctx.strokeStyle = `${plasmaColor}0.85)`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(curr.x, curr.y - 18);

    for (let s = 1; s < segs; s++) {
      const frac = s / segs;
      const midX = curr.x + (next.x - curr.x) * frac;
      const midY = curr.y + (next.y - curr.y) * frac - 18;
      const jitter = Math.sin(frameCount * 0.4 + i * 5 + s * 3) * 6;
      const arcLen = R * (Math.PI * 2 / monolithCount);
      const normX = -(next.y - curr.y) / arcLen;
      const normY = (next.x - curr.x) / arcLen;
      ctx.lineTo(midX + normX * jitter, midY + normY * jitter);
    }
    ctx.lineTo(next.x, next.y - 18);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  for (let i = 0; i < monolithCount; i++) {
    const m = monolithPos[i];
    const distToPlayer = Math.hypot(player.x - m.x, player.y - m.y);
    const isWarning = distToPlayer < 90;

    ctx.fillStyle = '#0a0314';
    ctx.strokeStyle = isWarning ? '#ff7675' : plasmaGlow;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(m.x - 7, m.y + 4);
    ctx.lineTo(m.x - 4, m.y - 28);
    ctx.lineTo(m.x, m.y - 36);
    ctx.lineTo(m.x + 4, m.y - 28);
    ctx.lineTo(m.x + 7, m.y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(m.x, m.y - 36);
    ctx.lineTo(m.x + 4, m.y - 28);
    ctx.lineTo(m.x + 7, m.y + 4);
    ctx.lineTo(m.x, m.y + 2);
    ctx.closePath();
    ctx.fill();

    const runePulse = Math.sin(frameCount * 0.12 + i) * 0.35 + 0.65;
    ctx.fillStyle = isWarning ? '#ff7675' : (phase === 3 ? '#00cec9' : '#e84393');
    ctx.beginPath();
    ctx.ellipse(m.x - 1, m.y - 14, 2, 7 * runePulse, 0, 0, Math.PI * 2);
    ctx.fill();

    const capHover = Math.sin(frameCount * 0.15 + i) * 2.5;
    ctx.fillStyle = isWarning ? '#ff7675' : plasmaGlow;
    ctx.beginPath();
    ctx.moveTo(m.x, m.y - 42 + capHover);
    ctx.lineTo(m.x + 3.5, m.y - 37 + capHover);
    ctx.lineTo(m.x, m.y - 39 + capHover);
    ctx.lineTo(m.x - 3.5, m.y - 37 + capHover);
    ctx.closePath();
    ctx.fill();

    if (isWarning && (frameCount + i) % 3 === 0) {
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(m.x + (Math.random() * 16 - 8), m.y - 20 + (Math.random() * 16 - 8), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================
  // CAMADA 4.5: BARREIRA INVISÍVEL DE CONTENÇÃO (EFEITO REATIVO)
  // ==========================================
  const barrierR = R - (player.radius || 14) - 2;
  const pVecX = player.x - cx;
  const pVecY = player.y - cy;
  const pDistToCenter = Math.hypot(pVecX, pVecY) || 1;
  const distToBarrier = barrierR - pDistToCenter;
  const contactIntensity = activeBoss ? (activeBoss.barrierContact || 0) : 0;

  if (distToBarrier < 95 || contactIntensity > 0.05) {
    const playerAng = Math.atan2(pVecY, pVecX);
    const proximityRatio = Math.min(1.0, Math.max(0, 1.0 - (distToBarrier / 95)));
    const totalIntensity = Math.min(1.0, proximityRatio * 0.55 + contactIntensity * 0.85);

    ctx.save();
    const arcSpan = 0.46;
    const arcStart = playerAng - arcSpan;
    const arcEnd = playerAng + arcSpan;

    ctx.strokeStyle = phase === 3 
      ? `rgba(0, 206, 201, ${totalIntensity * 0.75})` 
      : (phase === 2 ? `rgba(232, 67, 147, ${totalIntensity * 0.75})` : `rgba(186, 120, 255, ${totalIntensity * 0.75})`);
    ctx.lineWidth = 4 + contactIntensity * 4;
    ctx.beginPath();
    ctx.arc(cx, cy, barrierR, arcStart, arcEnd);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${totalIntensity * 0.9})`;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const hexCount = 7;
    for (let hx = 0; hx < hexCount; hx++) {
      const hxAng = arcStart + (hx / (hexCount - 1)) * (arcSpan * 2);
      const hxDist = barrierR - 4;
      const cellX = cx + Math.cos(hxAng) * hxDist;
      const cellY = cy + Math.sin(hxAng) * hxDist;
      const hexPulse = Math.sin(frameCount * 0.2 + hx) * 0.3 + 0.7;

      ctx.strokeStyle = phase === 3 
        ? `rgba(0, 206, 201, ${totalIntensity * 0.5 * hexPulse})` 
        : `rgba(232, 67, 147, ${totalIntensity * 0.5 * hexPulse})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const sAng = (s * Math.PI) / 3 + frameCount * 0.02;
        const sx = cellX + Math.cos(sAng) * 9;
        const sy = cellY + Math.sin(sAng) * 9;
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();
    }

    if (contactIntensity > 0.1) {
      const contactX = cx + Math.cos(playerAng) * barrierR;
      const contactY = cy + Math.sin(playerAng) * barrierR;
      for (let r = 1; r <= 3; r++) {
        const ripR = ((frameCount * 2.2 + r * 16) % 48);
        const ripAlpha = Math.max(0, 1 - (ripR / 48)) * contactIntensity * 0.7;
        ctx.strokeStyle = phase === 3 ? `rgba(129, 236, 236, ${ripAlpha})` : `rgba(255, 121, 168, ${ripAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(contactX, contactY, ripR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ==========================================
  // CAMADA 5: PLACAS EXTERNAS QUEBRADAS À DERIVA (FASES 2 E 3)
  // ==========================================
  if (R < 610) {
    const chunkCount = phase === 3 ? 12 : 8;
    for (let ch = 0; ch < chunkCount; ch++) {
      const chAngle = (ch * Math.PI * 2) / chunkCount + Math.sin(ch * 7);
      const breakDist = R + 42 + (620 - R) * 0.35 + Math.sin(frameCount * 0.02 + ch * 1.5) * 10;
      const chX = cx + Math.cos(chAngle) * breakDist;
      const chY = cy + Math.sin(chAngle) * breakDist;
      const tilt = chAngle + Math.sin(frameCount * 0.015 + ch) * 0.2;

      ctx.save();
      ctx.translate(chX, chY);
      ctx.rotate(tilt);

      ctx.fillStyle = '#0d0519';
      ctx.strokeStyle = phase === 3 ? 'rgba(0, 206, 201, 0.45)' : 'rgba(232, 67, 147, 0.4)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-24, -14);
      ctx.lineTo(26, -18);
      ctx.lineTo(32, 16);
      ctx.lineTo(-18, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = phase === 3 ? '#00cec9' : '#e84393';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(12, 6);
      ctx.lineTo(24, 2);
      ctx.stroke();

      ctx.restore();
    }
  }
}

/**
 * Renderiza o solo regular em grade infinita para ondas comuns e Chefes 1-3.
 */
function renderStandardTileGround(ctx, startCol, endCol, startRow, endRow, tileSize, pal) {
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

  // 1 & 2. RENDERIZAÇÃO DO SOLO E PROPS (Com suporte ao Altar Surreal do Chefe Final)
  const isAbyssCurrent = currentArenaTheme === 'ABYSS';
  const isAbyssPrev = previousArenaTheme === 'ABYSS';

  if (isAbyssCurrent && transitionProgress >= 1.0) {
    // Modo 100% no Altar Surreal do Fim dos Tempos
    renderSurrealAbyssArena(ctx);
  } else if (isAbyssCurrent && transitionProgress < 1.0) {
    // Transicionando para o Abismo: solo anterior desvanece, altar surge
    renderStandardTileGround(ctx, startCol, endCol, startRow, endRow, tileSize, prevPal);
    ctx.save();
    ctx.globalAlpha = 1.0 - t;
    renderArenaProps(ctx, previousArenaTheme, startCol, endCol, startRow, endRow, tileSize);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = t;
    renderSurrealAbyssArena(ctx);
    ctx.restore();
  } else if (isAbyssPrev && transitionProgress < 1.0) {
    // Transicionando para fora do Abismo: altar desvanece, novo solo surge
    renderSurrealAbyssArena(ctx);
    ctx.save();
    ctx.globalAlpha = t;
    renderStandardTileGround(ctx, startCol, endCol, startRow, endRow, tileSize, currPal);
    renderArenaProps(ctx, currentArenaTheme, startCol, endCol, startRow, endRow, tileSize);
    ctx.restore();
  } else {
    // Arenas regulares e chefes 1-3
    renderStandardTileGround(ctx, startCol, endCol, startRow, endRow, tileSize, pal);
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
  if (theme === 'ABYSS') return;
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
      } else if (theme === 'VAMPIRE') {
        drawVampireProps(ctx, c, r, tileX, tileY, h, h2, h3);
      } else if (theme === 'MONOLITH') {
        drawMonolithProps(ctx, c, r, tileX, tileY, h, h2, h3);
      } else if (theme === 'REAPER') {
        drawReaperProps(ctx, c, r, tileX, tileY, h, h2, h3);
      } else if (theme === 'ABYSS') {
        drawAbyssProps(ctx, c, r, tileX, tileY, h, h2, h3);
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

/**
 * BOSS 1: SALÃO CARMESIM (Lorde Vampírico)
 * Trono de veludo vermelho caído, sarcófagos imperiais de ônix, espelhos profanados e cálices de sangue.
 */
function drawVampireProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Trono Caído & Sarcófago Imperial Aberto
  if (c % 9 === 0 && r % 9 === 0) {
    const vx = tileX + 16;
    const vy = tileY + 14;

    // Sombra no mármore carmesim
    ctx.fillStyle = 'rgba(25, 4, 8, 0.38)';
    ctx.beginPath();
    ctx.ellipse(vx + 38, vy + 40, 48, 18, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Sarcófago de ônix aberto tombado
    ctx.fillStyle = '#1c070c';
    ctx.fillRect(vx + 2, vy + 20, 52, 22);
    ctx.strokeStyle = '#b38f4d';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(vx + 2, vy + 20, 52, 22);

    // Forro interno acolchoado de veludo vermelho
    ctx.fillStyle = '#780f22';
    ctx.fillRect(vx + 6, vy + 23, 44, 16);

    // Encosto do Trono gótico em asa de morcego
    ctx.fillStyle = '#300812';
    ctx.beginPath();
    ctx.moveTo(vx + 36, vy + 20);
    ctx.lineTo(vx + 24, vy - 12);
    ctx.lineTo(vx + 38, vy - 4);
    ctx.lineTo(vx + 52, vy - 12);
    ctx.lineTo(vx + 44, vy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b38f4d';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Cálices de ouro caídos derramando sangue
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(vx + 60, vy + 32, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9e1b32';
    ctx.beginPath();
    ctx.ellipse(vx + 66, vy + 34, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Props Secundários: Espelhos de Ouro Profanados (sem reflexo)
  if (h < 0.08) {
    const mx = tileX + 26 + (h2 * 32);
    const my = tileY + 22 + (h3 * 28);

    ctx.fillStyle = 'rgba(25, 4, 8, 0.28)';
    ctx.fillRect(mx - 8, my - 6, 18, 26);

    // Moldura barroca de ouro
    ctx.fillStyle = '#b38f4d';
    ctx.fillRect(mx - 9, my - 7, 20, 28);
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(mx - 9, my - 7, 20, 28);

    // Vidro espelhado vazio translúcido
    ctx.fillStyle = 'rgba(220, 230, 240, 0.45)';
    ctx.fillRect(mx - 6, my - 4, 14, 22);

    // Mancha e escorrido de sangue fresco
    ctx.fillStyle = '#9e1b32';
    ctx.beginPath();
    ctx.moveTo(mx - 3, my - 4);
    ctx.lineTo(mx + 3, my + 4);
    ctx.lineTo(mx + 5, my + 14);
    ctx.lineTo(mx + 2, my + 14);
    ctx.lineTo(mx - 1, my);
    ctx.closePath();
    ctx.fill();

  } else if (h >= 0.08 && h < 0.17) {
    // Castiçal Duplo de Bronze com Velas Negras e Chamas Carmesins
    const cx = tileX + 32 + (h2 * 28);
    const cy = tileY + 22 + (h3 * 28);
    const flick = Math.sin(frameCount * 0.2 + cx) * 1.5;

    ctx.fillStyle = 'rgba(25, 4, 8, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy + 26, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Suporte de bronze
    ctx.fillStyle = '#7a602f';
    ctx.fillRect(cx + 4, cy + 12, 4, 14);
    ctx.fillRect(cx - 2, cy + 10, 16, 3);

    // 2 Velas Negras
    [-2, 10].forEach(ox => {
      ctx.fillStyle = '#1c0d12';
      ctx.fillRect(cx + ox, cy + 2, 4, 9);

      // Cera vermelha escorrendo
      ctx.fillStyle = '#9e1b32';
      ctx.fillRect(cx + ox + 1, cy + 6, 2, 5);

      // Chama cor de sangue
      ctx.fillStyle = 'rgba(255, 71, 87, 0.3)';
      ctx.beginPath();
      ctx.arc(cx + ox + 2, cy - 1, 6 + flick, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(cx + ox + 2, cy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + ox + 2, cy - 2, 1, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (h >= 0.17 && h < 0.32) {
    // Selo Heráldico Vampírico no Mármore
    const sx = tileX + 24 + (h2 * 44);
    const sy = tileY + 22 + (h3 * 44);

    ctx.strokeStyle = '#b38f4d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sx + 10, sy + 10, 13, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#9e1b32';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx + 10, sy - 1);
    ctx.lineTo(sx + 10, sy + 21);
    ctx.moveTo(sx + 2, sy + 6);
    ctx.lineTo(sx + 18, sy + 6);
    ctx.stroke();
  }
}

/**
 * BOSS 2: CALDEIRA TECTÔNICA (Monólito Abissal)
 * Obelisco quebrado levitando, gêiseres de magma, fendas sísmicas e fragmentos de obsidiana.
 */
function drawMonolithProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Obelisco Primordial Quebrado em Levitação
  if ((c + 3) % 9 === 0 && (r + 3) % 9 === 0) {
    const ox = tileX + 18;
    const oy = tileY + 16;
    const hover = Math.sin(frameCount * 0.08) * 3;

    // Sombra do monólito no solo vulcânico
    ctx.fillStyle = 'rgba(20, 15, 10, 0.42)';
    ctx.beginPath();
    ctx.ellipse(ox + 36, oy + 44, 46, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base de basalto cravada na terra
    ctx.fillStyle = '#322d2a';
    ctx.beginPath();
    ctx.moveTo(ox + 12, oy + 42);
    ctx.lineTo(ox + 26, oy + 16);
    ctx.lineTo(ox + 46, oy + 16);
    ctx.lineTo(ox + 60, oy + 42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Topo quebrado levitando sobre a base
    ctx.save();
    ctx.translate(0, hover);
    ctx.fillStyle = '#453f3a';
    ctx.beginPath();
    ctx.moveTo(ox + 22, oy + 10);
    ctx.lineTo(ox + 36, oy - 20);
    ctx.lineTo(ox + 50, oy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Glifo de fogo no núcleo
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(ox + 36, oy + 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fenda com magma sob a rocha
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(ox + 24, oy + 38, 24, 4);
    return;
  }

  // Props Secundários: Gêiseres de Fumaça e Lava
  if (h < 0.09) {
    const gx = tileX + 28 + (h2 * 32);
    const gy = tileY + 24 + (h3 * 30);
    const pulse = Math.sin(frameCount * 0.16 + gx) * 1.8;

    // Cratera cônica de rocha
    ctx.fillStyle = '#282320';
    ctx.beginPath();
    ctx.ellipse(gx + 4, gy + 8, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Miolo de lava crepitante
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(gx + 4, gy + 7, Math.max(1, 3.5 + pulse), 0, Math.PI * 2);
    ctx.fill();

    // Pequena fagulha subindo
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(gx + 4, gy - 2 - (pulse * 2), 1.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (h >= 0.09 && h < 0.18) {
    // Fragmentos de Obsidiana Pontiaguda
    const kx = tileX + 30 + (h2 * 28);
    const ky = tileY + 22 + (h3 * 28);

    ctx.fillStyle = 'rgba(20, 10, 5, 0.35)';
    ctx.beginPath();
    ctx.ellipse(kx + 4, ky + 16, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lâmina de obsidiana negra
    ctx.fillStyle = '#1c1816';
    ctx.beginPath();
    ctx.moveTo(kx, ky + 14);
    ctx.lineTo(kx + 5, ky - 8);
    ctx.lineTo(kx + 9, ky + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1;
    ctx.stroke();

  } else if (h >= 0.18 && h < 0.34) {
    // Fissuras Tectônicas Sísmicas com Magma
    const fx = tileX + 22 + (h2 * 46);
    const fy = tileY + 22 + (h3 * 46);

    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 10, fy + 8);
    ctx.lineTo(fx + 22, fy + 4);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(fx + 2, fy + 1);
    ctx.lineTo(fx + 10, fy + 8);
    ctx.lineTo(fx + 20, fy + 4);
    ctx.stroke();
  }
}

/**
 * BOSS 3: NECRÓPOLE ESPECTRAL (Ceifador Supremo)
 * Portal de correntes espectrais, lanternas fúnebres de alma, gelo com mãos fantasmagóricas.
 */
function drawReaperProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Portal das Almas & Correntes Colossais
  if ((c + 5) % 9 === 0 && (r + 2) % 9 === 0) {
    const rx = tileX + 16;
    const ry = tileY + 14;
    const glow = Math.sin(frameCount * 0.12) * 2;

    // Sombra fria no gelo
    ctx.fillStyle = 'rgba(10, 30, 40, 0.35)';
    ctx.beginPath();
    ctx.ellipse(rx + 36, ry + 42, 46, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arco Gótico de Ferro Congelado
    ctx.fillStyle = '#223844';
    ctx.beginPath();
    ctx.moveTo(rx + 12, ry + 42);
    ctx.lineTo(rx + 16, ry + 6);
    ctx.lineTo(rx + 36, ry - 18);
    ctx.lineTo(rx + 56, ry + 6);
    ctx.lineTo(rx + 60, ry + 42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#81ecec';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Vão do portal emitindo luz espectral de alma
    ctx.fillStyle = 'rgba(0, 206, 201, 0.28)';
    ctx.beginPath();
    ctx.moveTo(rx + 22, ry + 42);
    ctx.lineTo(rx + 24, ry + 12);
    ctx.lineTo(rx + 36, ry - 4);
    ctx.lineTo(rx + 48, ry + 12);
    ctx.lineTo(rx + 50, ry + 42);
    ctx.closePath();
    ctx.fill();

    // Correntes colossais cruzando o portal
    ctx.strokeStyle = '#051820';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(rx + 16, ry + 14);
    ctx.lineTo(rx + 56, ry + 36);
    ctx.moveTo(rx + 56, ry + 14);
    ctx.lineTo(rx + 16, ry + 36);
    ctx.stroke();

    // Chama fátua central
    ctx.fillStyle = '#00cec9';
    ctx.beginPath();
    ctx.arc(rx + 36, ry + 16, 4 + glow, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rx + 36, ry + 16, 1.8, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Props Secundários: Lanternas de Almas em Estacas de Gelo
  if (h < 0.09) {
    const lx = tileX + 28 + (h2 * 32);
    const ly = tileY + 22 + (h3 * 30);
    const flick = Math.sin(frameCount * 0.2 + lx) * 1.6;

    ctx.fillStyle = 'rgba(10, 30, 40, 0.28)';
    ctx.beginPath();
    ctx.ellipse(lx + 4, ly + 24, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Estaca de ferro
    ctx.fillStyle = '#1e323d';
    ctx.fillRect(lx + 3, ly + 4, 3, 20);

    // Gaiola da lanterna
    ctx.fillStyle = '#2a4452';
    ctx.fillRect(lx - 2, ly - 6, 13, 11);
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(lx - 2, ly - 6, 13, 11);

    // Fogo-fátuo de alma ciano
    ctx.fillStyle = 'rgba(0, 206, 201, 0.35)';
    ctx.beginPath();
    ctx.arc(lx + 4.5, ly - 1, 6 + flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00cec9';
    ctx.beginPath();
    ctx.arc(lx + 4.5, ly - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lx + 4.5, ly - 1.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

  } else if (h >= 0.09 && h < 0.17) {
    // Lápides de Ardósia Congelada com Geada
    const tx = tileX + 30 + (h2 * 28);
    const ty = tileY + 22 + (h3 * 28);

    ctx.fillStyle = 'rgba(10, 25, 35, 0.25)';
    ctx.beginPath();
    ctx.ellipse(tx + 6, ty + 20, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3c5464';
    ctx.beginPath();
    ctx.arc(tx + 6, ty + 6, 8, Math.PI, 0);
    ctx.lineTo(tx + 14, ty + 20);
    ctx.lineTo(tx - 2, ty + 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#dff9fb';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Cruz espectral entalhada
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tx + 6, ty + 2);
    ctx.lineTo(tx + 6, ty + 14);
    ctx.moveTo(tx + 2, ty + 6);
    ctx.lineTo(tx + 10, ty + 6);
    ctx.stroke();

  } else if (h >= 0.17 && h < 0.33) {
    // Fendas de Gelo com Mãos Espectrais Presas
    const fx = tileX + 22 + (h2 * 45);
    const fy = tileY + 22 + (h3 * 45);

    ctx.strokeStyle = '#81ecec';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 14, fy + 12);
    ctx.lineTo(fx + 24, fy + 8);
    ctx.stroke();

    // Silhueta translúcida de mão espectral
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx + 10, fy + 8);
    ctx.lineTo(fx + 10, fy + 2);
    ctx.moveTo(fx + 12, fy + 8);
    ctx.lineTo(fx + 13, fy + 1);
    ctx.moveTo(fx + 14, fy + 9);
    ctx.lineTo(fx + 16, fy + 3);
    ctx.stroke();
  }
}

/**
 * BOSS 4: HORIZONTE DO VAZIO (Soberano do Abismo - Chefe Final)
 * Âncora dimensional rompida, olhos vivos do abismo que seguem o jogador, runas cósmicas.
 */
function drawAbyssProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: A Âncora Dimensional de Singularidade Rompida
  if ((c + 1) % 9 === 0 && (r + 5) % 9 === 0) {
    const ax = tileX + 16;
    const ay = tileY + 16;
    const pulse = Math.sin(frameCount * 0.1) * 2;

    // Sombra astral púrpura
    ctx.fillStyle = 'rgba(30, 10, 45, 0.45)';
    ctx.beginPath();
    ctx.ellipse(ax + 36, ay + 42, 48, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Haste da âncora dimensional
    ctx.fillStyle = '#2a123a';
    ctx.fillRect(ax + 32, ay - 14, 8, 52);
    ctx.strokeStyle = '#d980fa';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(ax + 32, ay - 14, 8, 52);

    // Braços curvos inferiores da âncora
    ctx.beginPath();
    ctx.arc(ax + 36, ay + 30, 24, 0, Math.PI);
    ctx.stroke();

    // Anel orbital flutuando em perspectiva
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(ax + 36, ay + 8, 30, 10, 0.2, 0, Math.PI * 2);
    ctx.stroke();

    // Singularidade no centro do monumento
    ctx.fillStyle = '#100319';
    ctx.beginPath();
    ctx.arc(ax + 36, ay + 8, 6 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    return;
  }

  // Props Secundários: Olhos Vivos do Abismo (Seguem o Jogador)
  if (h < 0.09) {
    const ex = tileX + 26 + (h2 * 34);
    const ey = tileY + 24 + (h3 * 30);

    // Ângulo em direção ao jogador para a pupila acompanhar a movimentação
    const eyeTargetX = player ? player.x : camera.x + viewW / 2;
    const eyeTargetY = player ? player.y : camera.y + viewH / 2;
    const pAng = Math.atan2(eyeTargetY - ey, eyeTargetX - ex);
    const pupDist = 3.2;
    const pupX = ex + Math.cos(pAng) * pupDist;
    const pupY = ey + Math.sin(pAng) * (pupDist * 0.6);

    // Contorno do olho cósmico no piso
    ctx.fillStyle = '#180724';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d980fa';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Íris fluorescente magenta
    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(pupX, pupY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pupila vertical brilhante
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(pupX, pupY, 1.4, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (h >= 0.09 && h < 0.18) {
    // Cristais de Matéria Escura Flutuantes
    const cx = tileX + 30 + (h2 * 28);
    const cy = tileY + 22 + (h3 * 28);
    const hover = Math.sin(frameCount * 0.12 + cx) * 2.8;

    ctx.fillStyle = 'rgba(25, 8, 35, 0.3)';
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy + 18, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cristal levitando
    ctx.save();
    ctx.translate(0, hover);
    ctx.fillStyle = '#2c0e3e';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 14);
    ctx.lineTo(cx + 4, cy - 8);
    ctx.lineTo(cx + 9, cy + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d980fa';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(224, 86, 253, 0.5)';
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 8);
    ctx.lineTo(cx + 9, cy + 14);
    ctx.lineTo(cx + 4, cy + 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  } else if (h >= 0.18 && h < 0.33) {
    // Runas e Constelações de Entropia Cósmica
    const rx = tileX + 24 + (h2 * 45);
    const ry = tileY + 24 + (h3 * 45);

    ctx.strokeStyle = 'rgba(217, 128, 250, 0.6)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(rx + 10, ry + 10, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Triângulo estelar inscrito
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rx + 10, ry - 1);
    ctx.lineTo(rx + 19, ry + 16);
    ctx.lineTo(rx + 1, ry + 16);
    ctx.closePath();
    ctx.stroke();

    // Ponto estelar brilhante
    const blink = Math.sin(frameCount * 0.15 + rx) > 0.5;
    if (blink) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx + 10, ry + 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
