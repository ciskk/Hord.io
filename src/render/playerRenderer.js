/**
 * src/render/playerRenderer.js
 * 
 * Módulo especializado na renderização do herói jogável, estados especiais
 * (phasing, invisibilidade, fúria berserk, investida sagrada, passo ígneo),
 * auras sagradas, bíblias orbitais e machados giratórios nórdicos.
 */
import { ctx, frameCount, bullets } from '../main.js';
import { player, selectedHeroKey } from '../entities/player.js';
import { CHARACTERS } from '../config/characters.js';

/**
 * Renderiza a Aura Sagrada / Santuário Celestial com fade radial inverso,
 * alta transparência na arena, geometria sagrada tênue e ondas de purificação.
 */
const auraGradCache = {};

function getAuraGradient(c, isEvolved, radius) {
  const quantRadius = Math.round(radius / 8) * 8;
  const key = `${isEvolved ? 1 : 0}_${quantRadius}`;
  if (auraGradCache[key]) return auraGradCache[key];

  const grad = c.createRadialGradient(0, 0, 4, 0, 0, quantRadius);
  if (isEvolved) {
    grad.addColorStop(0.00, 'rgba(255, 245, 200, 0.22)');
    grad.addColorStop(0.20, 'rgba(255, 215, 0, 0.14)');
    grad.addColorStop(0.50, 'rgba(243, 156, 18, 0.05)');
    grad.addColorStop(0.80, 'rgba(241, 196, 15, 0.015)');
    grad.addColorStop(1.00, 'rgba(241, 196, 15, 0.00)');
  } else {
    grad.addColorStop(0.00, 'rgba(255, 240, 180, 0.16)');
    grad.addColorStop(0.25, 'rgba(255, 215, 0, 0.09)');
    grad.addColorStop(0.55, 'rgba(241, 196, 15, 0.03)');
    grad.addColorStop(0.85, 'rgba(241, 196, 15, 0.008)');
    grad.addColorStop(1.00, 'rgba(241, 196, 15, 0.00)');
  }
  auraGradCache[key] = grad;
  return grad;
}

export function drawPlayerAura() {
  if (player.auraLvl <= 0 && !player.evolvedAura) return;

  const isEvolved = !!player.evolvedAura;
  const baseRadius = (isEvolved ? 150 : 65) + player.auraLvl * 18;
  const breathing = Math.sin(frameCount * 0.05) * 2.5;
  const auraRadius = Math.max(10, baseRadius + breathing);

  ctx.save();
  ctx.translate(player.x, player.y);

  // 1. Campo de Luz Celestial com Gradiente Radial em Cache
  const auraGrad = getAuraGradient(ctx, isEvolved, auraRadius);
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Anel Periférico Delicado com Traço Tênue (Não ofusca o piso da arena)
  ctx.strokeStyle = isEvolved ? 'rgba(241, 196, 15, 0.28)' : 'rgba(241, 196, 15, 0.18)';
  ctx.lineWidth = isEvolved ? 1.6 : 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Anel Rúnico Interno Tênue e Marcadores Cardeais Celestes
  const innerRingR = auraRadius * (isEvolved ? 0.82 : 0.86);
  ctx.save();
  ctx.setLineDash([3, 9]);
  ctx.strokeStyle = isEvolved ? 'rgba(255, 215, 0, 0.14)' : 'rgba(241, 196, 15, 0.09)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, innerRingR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 4 nós cardeais celestes rotacionando lentamente em harmonia
  const cardAngle = frameCount * 0.008;
  for (let k = 0; k < 4; k++) {
    const ang = cardAngle + (k * Math.PI / 2);
    const nx = Math.cos(ang) * auraRadius;
    const ny = Math.sin(ang) * auraRadius;
    ctx.fillStyle = isEvolved ? 'rgba(255, 235, 150, 0.35)' : 'rgba(241, 196, 15, 0.25)';
    ctx.beginPath();
    ctx.arc(nx, ny, isEvolved ? 2.2 : 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Pulso de Purificação / Onda de Dano Sincronizada com o Tick
  if (player.auraTickFlash && player.auraTickFlash > 0.01) {
    const flashProgress = 1 - player.auraTickFlash;
    const waveRadius = auraRadius * (0.25 + flashProgress * 0.75);
    const waveAlpha = player.auraTickFlash * (isEvolved ? 0.35 : 0.22);
    ctx.strokeStyle = isEvolved ? `rgba(255, 235, 150, ${waveAlpha})` : `rgba(241, 196, 15, ${waveAlpha})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 5. Centelhas Divinas Flutuantes (Otimizadas: 2 a 4 faíscas)
  const sparkCount = isEvolved ? 4 : 2;
  for (let s = 0; s < sparkCount; s++) {
    const seed = s * 73.13;
    const sparkDist = ((frameCount * 0.45 + seed * 19) % (auraRadius * 0.72)) + 14;
    const sparkAng = seed + Math.sin(frameCount * 0.015 + s) * 0.6;
    const sx = Math.cos(sparkAng) * sparkDist;
    const sy = Math.sin(sparkAng) * sparkDist - ((frameCount * 0.3 + seed) % 18);
    const lifeRatio = sparkDist / (auraRadius * 0.72);
    const sparkAlpha = Math.sin(lifeRatio * Math.PI) * (isEvolved ? 0.32 : 0.20);
    if (sparkAlpha > 0.02) {
      ctx.fillStyle = isEvolved ? `rgba(255, 250, 200, ${sparkAlpha})` : `rgba(255, 235, 160, ${sparkAlpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, isEvolved ? 1.4 : 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Santuário Celestial (Detalhe exclusivo da Evolução: Runa Estelar no Solo)
  if (isEvolved) {
    ctx.save();
    ctx.rotate(frameCount * 0.003);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.06)';
    ctx.lineWidth = 0.8;
    const starR = auraRadius * 0.38;
    ctx.beginPath();
    for (let p = 0; p < 8; p++) {
      const a1 = p * Math.PI / 4;
      const sr = p % 2 === 0 ? starR : starR * 0.55;
      const px = Math.cos(a1) * sr;
      const py = Math.sin(a1) * sr;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// Cache estático de sprites pré-renderizados para Tomos Orbitais e Machados de Kragdor
const bookSpriteCache = {};
const axeSpriteCache = {};

function getBookSprite(isEvolved) {
  const key = isEvolved ? 1 : 0;
  if (bookSpriteCache[key]) return bookSpriteCache[key];

  const off = document.createElement('canvas');
  off.width = 64;
  off.height = 64;
  const c = off.getContext('2d');
  
  c.save();
  c.translate(32, 32);

  const bookW = isEvolved ? 26 : 22;
  const bookH = isEvolved ? 18 : 15;
  const halfW = bookW / 2;
  const halfH = bookH / 2;
  const haloRadius = isEvolved ? 26 : 20;

  // Halo de Luz Sagrada ao redor do livro
  const haloGrad = c.createRadialGradient(0, 0, 2, 0, 0, haloRadius);
  haloGrad.addColorStop(0, isEvolved ? 'rgba(241, 196, 15, 0.35)' : 'rgba(52, 152, 219, 0.30)');
  haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = haloGrad;
  c.beginPath();
  c.arc(0, 0, haloRadius, 0, Math.PI * 2);
  c.fill();

  // 1. Capa de Couro Mística Externa (ângulo aberto)
  c.fillStyle = isEvolved ? '#b7791f' : '#1b3a4b';
  c.beginPath();
  c.roundRect(-halfW - 1, -halfH - 1, bookW + 2, bookH + 2, 2);
  c.fill();
  c.strokeStyle = isEvolved ? '#f1c40f' : '#3498db';
  c.lineWidth = 1;
  c.stroke();

  // 2. Páginas de Pergaminho Abertas
  // Página Esquerda
  const pageGradLeft = c.createLinearGradient(-halfW, 0, 0, 0);
  pageGradLeft.addColorStop(0, '#e8e2d5');
  pageGradLeft.addColorStop(1, '#fcfbfa');
  c.fillStyle = pageGradLeft;
  c.beginPath();
  c.roundRect(-halfW, -halfH, halfW - 0.5, bookH, [2, 0, 0, 2]);
  c.fill();

  // Página Direita
  const pageGradRight = c.createLinearGradient(0, 0, halfW, 0);
  pageGradRight.addColorStop(0, '#fcfbfa');
  pageGradRight.addColorStop(1, '#e8e2d5');
  c.fillStyle = pageGradRight;
  c.beginPath();
  c.roundRect(0.5, -halfH, halfW - 0.5, bookH, [0, 2, 2, 0]);
  c.fill();

  // 3. Linhas de Encantamento / Texto Rúnico
  c.strokeStyle = isEvolved ? 'rgba(217, 119, 6, 0.45)' : 'rgba(41, 128, 185, 0.40)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-halfW + 2, -3); c.lineTo(-2, -3);
  c.moveTo(-halfW + 2, 0);  c.lineTo(-2, 0);
  c.moveTo(-halfW + 2, 3);  c.lineTo(-2, 3);
  c.moveTo(2, -3); c.lineTo(halfW - 2, -3);
  c.moveTo(2, 0);  c.lineTo(halfW - 2, 0);
  c.moveTo(2, 3);  c.lineTo(halfW - 2, 3);
  c.stroke();

  // 4. Lombada Central
  c.fillStyle = isEvolved ? '#78350f' : '#0f172a';
  c.fillRect(-0.75, -halfH - 1, 1.5, bookH + 2);

  // 5. Cruz Sagrada / Runa Luminosa
  c.fillStyle = isEvolved ? '#fef08a' : '#38bdf8';
  c.fillRect(-0.75, -4, 1.5, 8);
  c.fillRect(-3, -2, 6, 1.5);

  // Ponto de luz divino
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(0, -1.25, 1, 0, Math.PI * 2);
  c.fill();

  c.restore();
  bookSpriteCache[key] = off;
  return off;
}

function getAxeSprite(isEvolved, isBerserk) {
  const key = `${isEvolved ? 1 : 0}_${isBerserk ? 1 : 0}`;
  if (axeSpriteCache[key]) return axeSpriteCache[key];

  const off = document.createElement('canvas');
  off.width = 64;
  off.height = 64;
  const c = off.getContext('2d');
  
  c.save();
  c.translate(32, 24);

  const shaftWood = '#3d271d';
  const steelDark = '#2c3e50';
  const steelMid = isEvolved ? '#d35400' : (isBerserk ? '#c0392b' : '#7f8c8d');
  const steelLight = isEvolved ? '#f39c12' : (isBerserk ? '#e74c3c' : '#bdc3c7');
  const edgeGlow = isEvolved ? '#ffffff' : (isBerserk ? '#ffffff' : '#f1c40f');

  // Cabo de Madeira Rústico voltado para o centro orbital (local +Y)
  c.fillStyle = shaftWood;
  c.fillRect(-2.5, -12, 5, 38);

  // Tiras de Couro Cruzadas no Cabo
  c.strokeStyle = '#1e130c';
  c.lineWidth = 1.4;
  c.beginPath();
  for (let w = -4; w <= 20; w += 6) {
    c.moveTo(-2.5, w);
    c.lineTo(2.5, w + 3.5);
  }
  c.stroke();

  // Pomo Inferior de Ferro com Espigão de Contrapeso
  c.fillStyle = steelDark;
  c.fillRect(-3.5, 23, 7, 3.5);
  c.beginPath();
  c.moveTo(-2, 26.5);
  c.lineTo(2, 26.5);
  c.lineTo(0, 30.5);
  c.closePath();
  c.fill();

  // Braçadeira de Fixação da Cabeça do Machado (Eye / Collar)
  c.fillStyle = steelDark;
  c.fillRect(-3.5, -14, 7, 10);
  c.fillStyle = '#f1c40f';
  c.fillRect(-1.0, -11, 2, 2);

  // --- Cabeça do Machado (Lâmina Nórdica Assimétrica / Bearded Axe) ---
  c.fillStyle = steelMid;
  c.beginPath();
  c.moveTo(2.5, -14);
  c.lineTo(15, -18);                                 // Ponta superior afiada
  c.quadraticCurveTo(20, -9, 14, 2);                 // Curva pronunciada da barba nórdica
  c.quadraticCurveTo(8, -1, 2.5, -5);                // Reentrância inferior voltando ao cabo
  c.closePath();
  c.fill();
  c.strokeStyle = steelDark;
  c.lineWidth = 1.4;
  c.stroke();

  // Bisel de Desbaste Interno da Lâmina
  c.fillStyle = steelLight;
  c.beginPath();
  c.moveTo(4, -13);
  c.lineTo(14, -16.5);
  c.quadraticCurveTo(18, -9, 13, 0.5);
  c.lineTo(5, -4.5);
  c.closePath();
  c.fill();

  // Gume de Corte Afiado (Sweet Spot: Corte Crítico e Cura da Passiva)
  c.strokeStyle = edgeGlow;
  c.lineWidth = isBerserk || isEvolved ? 2.8 : 2.0;
  c.beginPath();
  c.moveTo(15, -18);
  c.quadraticCurveTo(20, -9, 14, 2);
  c.stroke();

  // Runas Mágicas Entalhadas na Lâmina
  c.strokeStyle = isBerserk ? '#ffffff' : (isEvolved ? '#ffffff' : '#f39c12');
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(7, -12);
  c.lineTo(11, -9);
  c.lineTo(8, -6);
  c.stroke();

  // --- Espigão / Quebra-Armaduras Traseiro (Local -X) ---
  if (isEvolved) {
    // Na Tempestade de Aço, o machado torna-se de Lâmina Dupla Titânica
    c.fillStyle = steelMid;
    c.beginPath();
    c.moveTo(-2.5, -14);
    c.lineTo(-15, -18);
    c.quadraticCurveTo(-20, -9, -14, 2);
    c.quadraticCurveTo(-8, -1, -2.5, -5);
    c.closePath();
    c.fill();
    c.strokeStyle = steelDark;
    c.lineWidth = 1.4;
    c.stroke();

    c.fillStyle = steelLight;
    c.beginPath();
    c.moveTo(-4, -13);
    c.lineTo(-14, -16.5);
    c.quadraticCurveTo(-18, -9, -13, 0.5);
    c.lineTo(-5, -4.5);
    c.closePath();
    c.fill();

    c.strokeStyle = edgeGlow;
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-15, -18);
    c.quadraticCurveTo(-20, -9, -14, 2);
    c.stroke();
  } else {
    // Machado Padrão: Espigão Quebra-Crânios Rústico na Traseira
    c.fillStyle = steelDark;
    c.beginPath();
    c.moveTo(-2.5, -13);
    c.lineTo(-9.5, -10);
    c.lineTo(-2.5, -7);
    c.closePath();
    c.fill();

    c.strokeStyle = steelLight;
    c.lineWidth = 1.2;
    c.stroke();
  }

  c.restore();
  axeSpriteCache[key] = off;
  return off;
}

/**
 * Renderiza as Bíblias Astrais / Livros Orbitais em translação circular.
 */
export function drawPlayerOrbitals() {
  if (player.orbitals <= 0) return;

  const orbDist = player.evolvedOrbitals ? 88 : 72;
  const isEvolved = !!player.evolvedOrbitals;

  // 1. Anel Guia Orbital Celestial
  ctx.strokeStyle = isEvolved 
    ? 'rgba(241, 196, 15, 0.28)' 
    : 'rgba(52, 152, 219, 0.20)';
  ctx.lineWidth = isEvolved ? 2.2 : 1.4;
  ctx.beginPath();
  ctx.arc(player.x, player.y, orbDist, 0, Math.PI * 2);
  ctx.stroke();

  // Anel pontilhado rúnico sutil no entorno
  ctx.save();
  ctx.setLineDash([4, 8]);
  ctx.strokeStyle = isEvolved 
    ? 'rgba(243, 156, 18, 0.18)' 
    : 'rgba(41, 128, 185, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, orbDist + (isEvolved ? 6 : 4), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 2. Vínculo Harmônico Celestial entre os Tomos (Tríade Sagrada)
  if (player.orbitals === 3) {
    ctx.save();
    ctx.strokeStyle = isEvolved ? 'rgba(241, 196, 15, 0.16)' : 'rgba(52, 152, 219, 0.12)';
    ctx.lineWidth = isEvolved ? 1.4 : 1.0;
    ctx.beginPath();
    for (let oIdx = 0; oIdx < 3; oIdx++) {
      const a = player.orbitalAngle + (oIdx * (Math.PI * 2 / 3));
      const bx = player.x + Math.cos(a) * orbDist;
      const by = player.y + Math.sin(a) * orbDist;
      if (oIdx === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  } else if (player.orbitals === 2) {
    ctx.save();
    ctx.strokeStyle = isEvolved ? 'rgba(241, 196, 15, 0.14)' : 'rgba(52, 152, 219, 0.10)';
    ctx.lineWidth = 1.0;
    const a1 = player.orbitalAngle;
    const a2 = player.orbitalAngle + Math.PI;
    ctx.beginPath();
    ctx.moveTo(player.x + Math.cos(a1) * orbDist, player.y + Math.sin(a1) * orbDist);
    ctx.lineTo(player.x + Math.cos(a2) * orbDist, player.y + Math.sin(a2) * orbDist);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Renderização de Cada Tomo Celestial Aberto e seus Rastros (Via Sprite Cache)
  const bookSprite = getBookSprite(isEvolved);

  for (let oIdx = 0; oIdx < player.orbitals; oIdx++) {
    const angle = player.orbitalAngle + (oIdx * (Math.PI * 2 / player.orbitals));
    const ox = player.x + Math.cos(angle) * orbDist;
    const oy = player.y + Math.sin(angle) * orbDist;

    // Rastro Estelar conciso atrás do tomo (2 passos otimizados sem flood de arcos)
    const trailLength = isEvolved ? 0.36 : 0.22;
    for (let s = 1; s <= 2; s++) {
      const tAngle = angle - (trailLength * (s / 2));
      const tx = player.x + Math.cos(tAngle) * orbDist;
      const ty = player.y + Math.sin(tAngle) * orbDist;
      const alpha = (1 - s / 2.5) * (isEvolved ? 0.30 : 0.20);
      ctx.fillStyle = isEvolved 
        ? `rgba(241, 196, 15, ${alpha})` 
        : `rgba(0, 206, 201, ${alpha})`;
      ctx.beginPath();
      ctx.arc(tx, ty, (isEvolved ? 5.5 : 4.0) * (1 - s / 2.5), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angle + Math.PI / 2);
    ctx.drawImage(bookSprite, -32, -32);
    ctx.restore();
  }
}

/**
 * Renderiza os Machados Giratórios Nórdicos de Kragdor, arcos de corte otimizados
 * e blit acelerado via Sprite Cache pré-renderizado.
 */
export function drawSpinningAxes() {
  if (player.axeCount <= 0) return;

  const count = player.evolvedAxe ? Math.max(player.axeCount, 6) : player.axeCount;
  const r = player.axeRadius || 56;
  const isBerserk = (player.berserkTimer || 0) > 0;
  const isEvolved = !!player.evolvedAxe;

  // 1. Anel Guia Orbital
  ctx.strokeStyle = isEvolved 
    ? 'rgba(230, 126, 34, 0.45)' 
    : (isBerserk ? 'rgba(231, 76, 60, 0.40)' : 'rgba(241, 196, 15, 0.22)');
  ctx.lineWidth = isEvolved ? 3.0 : (isBerserk ? 2.5 : 1.8);
  ctx.beginPath();
  ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
  ctx.stroke();

  // Sprite pré-renderizado de alta resolução do Machado
  const axeSprite = getAxeSprite(isEvolved, isBerserk);

  // 2. Renderização de cada Machado Nórdico e seu Rastro de Corte
  for (let i = 0; i < count; i++) {
    const angle = player.axeAngle + (i * (Math.PI * 2 / count));
    const ax = player.x + Math.cos(angle) * r;
    const ay = player.y + Math.sin(angle) * r;

    // 2.1 Esteira Dinâmica de Corte em Arco (1 único traço nítido e luminoso ao invés de 2 arcos pesados de 9px e 18px)
    const trailLength = isBerserk ? 0.65 : (isEvolved ? 0.52 : 0.38);
    const ribbonStart = angle - trailLength;

    ctx.strokeStyle = isBerserk 
      ? 'rgba(231, 76, 60, 0.70)' 
      : (isEvolved ? 'rgba(243, 156, 18, 0.65)' : 'rgba(241, 196, 15, 0.45)');
    ctx.lineWidth = isEvolved ? 4.5 : (isBerserk ? 4.0 : 3.0);
    ctx.beginPath();
    ctx.arc(player.x, player.y, r + 2, ribbonStart, angle);
    ctx.stroke();

    // 2.2 Desenho Acelerado via Sprite Blit
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle + Math.PI / 2);
    ctx.drawImage(axeSprite, -32, -24);
    ctx.restore();
  }
}

/**
 * Renderiza todos os equipamentos orbitais e auras ativas do jogador.
 */
export function drawPlayerEquipment() {
  drawPlayerAura();
  drawPlayerOrbitals();
  drawSpinningAxes();
}

/**
 * Renderiza com máxima fidelidade o Martelo Sagrado / Martelo dos Titãs de Sir Roland.
 * Utilizado tanto no coldre dorsal quanto empunhado ativamente em combate.
 */
export function drawRolandHammerModel(c, cCol, isEvolved = false, runeGlowMult = 1.0) {
  const hammerWood = cCol.hammerWood || '#3d271d';
  const hammerSteel = isEvolved ? '#3d1c06' : (cCol.hammerSteel || '#57606f');
  const hammerSteelLight = isEvolved ? '#e67e22' : (cCol.hammerSteelLight || '#8395a7');
  const hammerGold = isEvolved ? '#f39c12' : (cCol.hammerGold || '#f1c40f');
  const hammerGoldLight = isEvolved ? '#ffeaa7' : (cCol.hammerGoldLight || '#ffeaa7');
  const hammerRune = isEvolved ? '#ff7675' : (cCol.hammerRune || '#f1c40f');
  const hammerRuneGlow = isEvolved ? '#ffffff' : (cCol.hammerRuneGlow || '#ffffff');
  const steelHighlight = cCol.armorHighlight || '#ffffff';

  // Cabo de carvalho torneado com ataduras cruzadas de couro cru
  c.fillStyle = hammerWood;
  c.fillRect(-2, -4, 4, 32);
  c.strokeStyle = '#1e130c';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-2, 4); c.lineTo(2, 7);
  c.moveTo(-2, 12); c.lineTo(2, 15);
  c.moveTo(-2, 20); c.lineTo(2, 23);
  c.stroke();

  // Pomo inferior de ferro forjado e anel de ouro maciço
  c.fillStyle = hammerSteel;
  c.fillRect(-2.5, 27, 5, 3.5);
  c.fillStyle = hammerGold;
  c.fillRect(-2, 29, 4, 1.5);
  c.fillStyle = hammerGoldLight;
  c.fillRect(-0.5, 29, 1.2, 1.5);

  // Colar / anel de junção do cabo à cabeça de guerra
  c.fillStyle = hammerGold;
  c.fillRect(-4, -3, 8, 2.5);
  c.fillStyle = hammerGoldLight;
  c.fillRect(-3, -3, 6, 0.8);

  // Cabeça titânica do martelo de guerra
  // Bloco principal de ferro temperado
  c.fillStyle = hammerSteel;
  c.fillRect(-9, -15, 18, 12);

  // Face chanfrada superior com reflexo especular de luz
  c.fillStyle = hammerSteelLight;
  c.beginPath();
  c.moveTo(-9, -15);
  c.lineTo(9, -15);
  c.lineTo(8, -12);
  c.lineTo(-8, -12);
  c.closePath();
  c.fill();

  // Crista especular brilhante
  c.strokeStyle = steelHighlight;
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-7.5, -14.8);
  c.lineTo(7.5, -14.8);
  c.stroke();

  // Faixas de reforço douradas forjadas
  c.fillStyle = hammerGold;
  c.fillRect(-10, -13, 20, 2.6);
  c.fillRect(-10, -7.5, 20, 2.6);
  c.fillRect(-2, -15, 4, 12);

  // Friso de luz dourada
  c.fillStyle = hammerGoldLight;
  c.fillRect(-10, -13, 20, 0.8);
  c.fillRect(-10, -7.5, 20, 0.8);

  // Runa divina incandescente pulsante
  c.fillStyle = `rgba(241, 196, 15, ${Math.min(1, 0.45 * runeGlowMult)})`;
  c.beginPath();
  c.arc(0, -9.5, 5.5, 0, Math.PI * 2);
  c.fill();

  // Cruz sagrada interior
  c.fillStyle = hammerRune;
  c.fillRect(-0.9, -12.5, 1.8, 6);
  c.fillRect(-2.7, -10.4, 5.4, 1.8);

  c.fillStyle = hammerRuneGlow;
  c.fillRect(-0.4, -9.9, 0.8, 0.8);

  // Espigão superior perfurante
  c.fillStyle = hammerSteelLight;
  c.beginPath();
  c.moveTo(0, -20);
  c.lineTo(3.0, -15);
  c.lineTo(-3.0, -15);
  c.closePath();
  c.fill();
}

/**
 * Renderiza proceduralmente o personagem jogável selecionado e seus efeitos corporais.
 */
export function renderHeroModel(c, heroKey, state = {}) {
  const charDef = CHARACTERS[heroKey] || CHARACTERS.KNIGHT;
  const x = state.x || 0;
  const y = state.y || 0;
  const facing = state.facing !== undefined ? state.facing : 1;
  const scale = state.scale !== undefined ? state.scale : 1;
  const isMoving = !!state.isMoving;
  const walkCycle = state.walkCycle || 0;
  const tFrame = state.tFrame !== undefined ? state.tFrame : (state.frameCount !== undefined ? state.frameCount : (typeof frameCount !== 'undefined' ? frameCount : 0));
  const berserkTimer = state.berserkTimer || 0;
  const invisTimer = state.invisTimer || 0;
  const radius = state.radius || 14;
  const dashDuration = state.dashDuration || 0;
  const ignisDashDuration = state.ignisDashDuration || 0;
  const staffCastTimer = state.staffCastTimer || 0;
  const potionThrowTimer = state.potionThrowTimer || 0;
  const alchemistSkillTimer = state.alchemistSkillTimer || 0;
  const iFrames = state.iFrames || 0;
  const isRetaliating = state.isRetaliating !== undefined ? state.isRetaliating : (iFrames > 12);
  const hammerProgress = state.hammerProgress !== undefined ? state.hammerProgress : (state.isHammerAttacking ? 0.45 : -1);
  const isHammerAttacking = hammerProgress >= 0 && hammerProgress <= 1.0;
  const evolvedHammer = !!(state.evolvedHammer || state.isEvolvedHammer);
  const isBerserk = state.isBerserk !== undefined ? state.isBerserk : (berserkTimer > 0);
  const fluidColor = state.fluidColor || (state.evolvedPotion ? '#a29bfe' : '#9b59b6');
  const isCasting = state.isCasting !== undefined ? state.isCasting : (staffCastTimer > 0 || !!state.isStaffCasting);
  const isPhasing = state.isPhasing !== undefined ? state.isPhasing : (invisTimer > 0 || !!state.isPhasing);
  const isAttacking = !!state.isSwordAttacking;
  const isThrowing = state.isThrowing !== undefined ? state.isThrowing : (potionThrowTimer > 0 || !!state.isThrowingPotion);
  const isAlchemistSkill = state.isAlchemistSkill !== undefined ? state.isAlchemistSkill : (alchemistSkillTimer > 0);
  const isAlchemistCombat = !!state.isAlchemistCombat;
  const isDashing = state.isDashing !== undefined ? state.isDashing : (dashDuration > 0 || ignisDashDuration > 0);

  c.save();
  c.translate(x, y);
  c.scale(facing * scale, scale);

  if (berserkTimer > 0 || isBerserk) {
    const bPulse = Math.sin(tFrame * 0.3) * 4;
    c.strokeStyle = 'rgba(231, 76, 60, 0.8)';
    c.lineWidth = 3.5;
    c.beginPath();
    c.arc(0, 2, radius + 10 + bPulse, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = 'rgba(230, 126, 34, 0.22)';
    c.fill();
  }

  if (invisTimer > 0) {
    c.globalAlpha = 0.45;
  }

  const bob = isMoving ? Math.sin(walkCycle * 2) * 2.5 : Math.sin(tFrame * 0.05) * 0.8;
  const legSwing = isMoving ? Math.sin(walkCycle) * 5.5 : 0;
  const capeWave = isMoving ? Math.sin(walkCycle) * 4 : Math.sin(tFrame * 0.08) * 1.5;

  if (state.showShadow !== false) {
    c.fillStyle = 'rgba(0, 0, 0, 0.45)';
    c.beginPath();
    c.ellipse(0, 15, 14, 6, 0, 0, Math.PI * 2);
    c.fill();
  }

  if (heroKey === 'KNIGHT') {
    // isDashing handled via state
    // isRetaliating handled via state
    // O martelo nas costas desaparece no instante em que o ataque HAMMER_SLAM está ativo
    // isHammerAttacking handled via state
    const cCol = charDef.color;
    const steelMid = cCol.armor || '#718093';
    const steelLight = cCol.armorLight || '#dcdde1';
    const steelHighlight = cCol.armorHighlight || '#ffffff';
    const steelDark = cCol.armorDark || '#2f3640';
    const goldTrim = cCol.trim || '#fbc531';
    const goldLight = cCol.trimLight || '#ffeaa7';
    const goldDark = cCol.trimDark || '#c79810';
    const goldGlint = cCol.goldGlint || '#ffffff';
    const plumeCol = cCol.plume || '#8e44ad';
    const plumeHigh = cCol.plumeHigh || '#a55eea';
    const tabardCol = cCol.tabard || '#f5f6fa';
    const tabardShadow = cCol.tabardShadow || '#dcdde1';
    const tabardCross = cCol.tabardCross || '#c23616';
    const tabardGold = cCol.tabardGold || '#f1c40f';
    const hammerWood = cCol.hammerWood || '#3d271d';
    const hammerSteel = cCol.hammerSteel || '#57606f';
    const hammerSteelLight = cCol.hammerSteelLight || '#8395a7';
    const hammerGold = cCol.hammerGold || '#f1c40f';
    const hammerGoldLight = cCol.hammerGoldLight || '#ffeaa7';
    const hammerRune = cCol.hammerRune || '#f1c40f';
    const hammerRuneGlow = cCol.hammerRuneGlow || '#ffffff';
    const eyeGlow = cCol.eyeGlow || '#00d2d3';
    const holyGlow = cCol.holyGlow || 'rgba(241, 196, 15, 0.40)';

    // --- ULT: Pós-Imagens Douradas e Solo Sagrado com Runas ---
    if (isDashing) {
      c.save();
      for (let g = 1; g <= 3; g++) {
        const ghostDist = g * 9;
        c.fillStyle = `rgba(241, 196, 15, ${0.32 / g})`;
        c.beginPath();
        c.ellipse(-ghostDist, 0, 12, 16, 0, 0, Math.PI * 2);
        c.fill();
      }
      // Solo Consagrado na base
      c.strokeStyle = 'rgba(241, 196, 15, 0.75)';
      c.lineWidth = 1.8;
      c.beginPath();
      c.ellipse(0, 14 + bob, 22, 7, 0, 0, Math.PI * 2);
      c.stroke();
      // Mini runas de luz no chão consagrado
      c.strokeStyle = 'rgba(255, 234, 167, 0.6)';
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(-14, 14 + bob); c.lineTo(14, 14 + bob);
      c.moveTo(0, 10 + bob); c.lineTo(0, 18 + bob);
      c.stroke();
      c.restore();
    }

    // 1. Capa Nobre Dupla de Veludo e Borda Bordada em Ouro
    // Forro interno escuro
    c.fillStyle = cCol.capeInner || '#2c1045';
    c.beginPath();
    c.moveTo(-5, -2 + bob);
    c.lineTo(-17 - Math.abs(capeWave * 1.2), 17 + bob);
    c.lineTo(-10 - Math.abs(capeWave * 0.7), 19 + bob);
    c.lineTo(-3, 17 + bob);
    c.lineTo(2, -2 + bob);
    c.closePath();
    c.fill();

    // Manto exterior de veludo púrpura
    c.fillStyle = cCol.cape || '#481b6d';
    c.beginPath();
    c.moveTo(-5, -3 + bob);
    c.lineTo(-15 - Math.abs(capeWave * 1.1), 15 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.6), 17 + bob);
    c.lineTo(-2, 16 + bob);
    c.lineTo(3, -3 + bob);
    c.closePath();
    c.fill();

    // Vinco de sombra no veludo da capa
    c.strokeStyle = '#220a35';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-4, -1 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.8), 16 + bob);
    c.stroke();

    // Borda bordada em fio de ouro duplo
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.3;
    c.stroke();

    c.strokeStyle = goldLight;
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-14 - Math.abs(capeWave * 1.1), 14.5 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.6), 16.2 + bob);
    c.lineTo(-2.5, 15.2 + bob);
    c.stroke();

    // 2. Coldre Dorsal do Martelo Sagrado (Visível em repouso/guarda, empunhado nas mãos no ataque)
    if (!isHammerAttacking) {
      c.save();
      c.translate(-2, -3 + bob);
      c.rotate(-0.58);
      drawRolandHammerModel(c, cCol, evolvedHammer, Math.sin(tFrame * 0.1) * 0.3 + 0.7);
      c.restore();
    }

    // 3. Pernas Blindadas, Grevas e Sabatons com Sombreamento 3D
    const legLeftX = -7 - legSwing * 0.4;
    const legRightX = 1.5 + legSwing * 0.4;

    // Sombra de profundidade posterior
    c.fillStyle = steelDark;
    c.fillRect(legLeftX, 6 + bob, 5, 8);
    c.fillRect(legRightX, 6 + bob, 5, 8);

    // Placa frontal das pernas (aço polido)
    c.fillStyle = steelMid;
    c.fillRect(legLeftX + 0.5, 7 + bob, 4, 6.5);
    c.fillRect(legRightX + 0.5, 7 + bob, 4, 6.5);

    // Chanfro de reflexo nas caneleiras (grevas)
    c.fillStyle = steelLight;
    c.fillRect(legLeftX + 1.2, 7 + bob, 1.8, 6.5);
    c.fillRect(legRightX + 1.2, 7 + bob, 1.8, 6.5);

    // Linha especular fina de aço polido (1px highlight)
    c.fillStyle = steelHighlight;
    c.fillRect(legLeftX + 1.6, 7.5 + bob, 0.7, 5.5);
    c.fillRect(legRightX + 1.6, 7.5 + bob, 0.7, 5.5);

    // Joelheiras em losango articuladas (Poleyns) com borda dourada
    // Joelheira esquerda
    c.fillStyle = steelDark;
    c.beginPath();
    c.moveTo(legLeftX + 2.5, 5 + bob);
    c.lineTo(legLeftX + 5, 7.5 + bob);
    c.lineTo(legLeftX + 2.5, 10 + bob);
    c.lineTo(legLeftX, 7.5 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(legLeftX + 2.5, 5.5 + bob);
    c.lineTo(legLeftX + 4.5, 7.5 + bob);
    c.lineTo(legLeftX + 2.5, 9.5 + bob);
    c.lineTo(legLeftX + 0.5, 7.5 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = goldLight;
    c.fillRect(legLeftX + 2, 7 + bob, 1.2, 1.2);

    // Joelheira direita
    c.fillStyle = steelDark;
    c.beginPath();
    c.moveTo(legRightX + 2.5, 5 + bob);
    c.lineTo(legRightX + 5, 7.5 + bob);
    c.lineTo(legRightX + 2.5, 10 + bob);
    c.lineTo(legRightX, 7.5 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(legRightX + 2.5, 5.5 + bob);
    c.lineTo(legRightX + 4.5, 7.5 + bob);
    c.lineTo(legRightX + 2.5, 9.5 + bob);
    c.lineTo(legRightX + 0.5, 7.5 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = goldLight;
    c.fillRect(legRightX + 2, 7 + bob, 1.2, 1.2);

    // Sabatons articulados (Lâminas de proteção dos pés)
    c.fillStyle = steelDark;
    c.fillRect(legLeftX - 1, 12.5 + bob, 6.5, 3.5);
    c.fillRect(legRightX - 1, 12.5 + bob, 6.5, 3.5);

    c.fillStyle = steelLight;
    c.fillRect(legLeftX + 0.8, 13 + bob, 4.2, 1.8);
    c.fillRect(legRightX + 0.8, 13 + bob, 4.2, 1.8);

    // Ponta metálica do bico do sabaton com brilho
    c.fillStyle = steelHighlight;
    c.fillRect(legLeftX + 3.2, 13.2 + bob, 1.8, 0.9);
    c.fillRect(legRightX + 3.2, 13.2 + bob, 1.8, 0.9);

    // 4. Tronco com Couraça Chanfrada (Gothic Cuirass) e Tabardo Sagrado
    // Placa peitoral de aço curvado com rebites e chanfros
    c.fillStyle = steelMid;
    c.beginPath();
    c.moveTo(-9, -5 + bob);
    c.lineTo(9, -5 + bob);
    c.lineTo(6.5, 7 + bob);
    c.lineTo(-6.5, 7 + bob);
    c.closePath();
    c.fill();

    // Sombra inferior do chanfro da armadura
    c.fillStyle = steelDark;
    c.beginPath();
    c.moveTo(-6.5, 4.5 + bob);
    c.lineTo(6.5, 4.5 + bob);
    c.lineTo(6.5, 7 + bob);
    c.lineTo(-6.5, 7 + bob);
    c.closePath();
    c.fill();

    // Contorno da placa peitoral
    c.strokeStyle = steelDark;
    c.lineWidth = 1.4;
    c.stroke();

    // Gola alta de aço / Gorjal (Gorget) com rebordo de ouro
    c.fillStyle = steelLight;
    c.fillRect(-5, -6.5 + bob, 10, 2.2);
    c.strokeStyle = goldTrim;
    c.lineWidth = 0.9;
    c.strokeRect(-5, -6.5 + bob, 10, 2.2);

    // Tabardo monástico sagrado drapeado com sombras de dobra
    c.fillStyle = tabardCol;
    c.beginPath();
    c.moveTo(-5.2, -5 + bob);
    c.lineTo(5.2, -5 + bob);
    c.lineTo(4.2, 8.5 + bob);
    c.lineTo(-4.2, 8.5 + bob);
    c.closePath();
    c.fill();

    // Sombreamento de dobras de tecido nas laterais do tabardo
    c.fillStyle = tabardShadow;
    c.beginPath();
    c.moveTo(-5.2, -5 + bob);
    c.lineTo(-3.8, -5 + bob);
    c.lineTo(-3.0, 8.5 + bob);
    c.lineTo(-4.2, 8.5 + bob);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(5.2, -5 + bob);
    c.lineTo(3.8, -5 + bob);
    c.lineTo(3.0, 8.5 + bob);
    c.lineTo(4.2, 8.5 + bob);
    c.closePath();
    c.fill();

    // Cruz frontal heráldica em veludo escarlate com contorno em filigrana de ouro
    // Fundo dourado bordado (expande 0.6px em torno da cruz)
    c.fillStyle = tabardGold;
    c.fillRect(-1.7, -4.4 + bob, 3.4, 10.8);
    c.fillRect(-4.3, -2.0 + bob, 8.6, 3.4);

    // Cruz escarlate interior
    c.fillStyle = tabardCross;
    c.fillRect(-1.2, -4.0 + bob, 2.4, 10);
    c.fillRect(-3.8, -1.5 + bob, 7.6, 2.4);

    // Ponto central de ouro na cruz
    c.fillStyle = goldLight;
    c.fillRect(-0.5, -0.7 + bob, 1.0, 0.8);

    // Cinto nobre de combate e correia transversal do coldre
    c.fillStyle = '#231711';
    c.fillRect(-7, 4.5 + bob, 14, 3.2);

    // Correia diagonal de couro do coldre transversal
    c.strokeStyle = '#231711';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-6, -4 + bob);
    c.lineTo(5, 5 + bob);
    c.stroke();

    // Rebites de aço na correia
    c.fillStyle = steelLight;
    c.fillRect(-3, -1.8 + bob, 1.2, 1.2);
    c.fillRect(1, 1.6 + bob, 1.2, 1.2);

    // Fivela ornamentada de ouro com espigão e brilho especular
    c.fillStyle = goldTrim;
    c.fillRect(-2.8, 4.0 + bob, 5.6, 4.2);
    c.fillStyle = '#1c130d';
    c.fillRect(-1.5, 4.8 + bob, 3.0, 2.4);
    c.fillStyle = goldLight;
    c.fillRect(-0.5, 4.8 + bob, 1.0, 2.4);
    c.fillStyle = goldGlint;
    c.fillRect(-2.2, 4.2 + bob, 1.2, 1.0);

    // 5. Ombreira Traseira e Braço Esquerdo
    c.fillStyle = steelDark;
    c.fillRect(-11, -3 + bob, 4, 8);
    c.fillStyle = steelMid;
    c.fillRect(-10.5, -2 + bob, 3.5, 6);

    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(-7, -6 + bob);
    c.lineTo(-14, -3 + bob);
    c.lineTo(-13, 2 + bob);
    c.lineTo(-8, 0 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = steelDark;
    c.lineWidth = 1.2;
    c.stroke();
    // Brilho no topo da ombreira traseira
    c.fillStyle = goldLight;
    c.fillRect(-12, -4.5 + bob, 4, 1);

    // 6. Cabeça e Grande Elmo Gótico (Greathelm) com Crista e Visor
    // Cúpula do elmo em aço chanfrado 3D
    c.fillStyle = steelMid;
    c.beginPath();
    c.moveTo(-5.5, -6 + bob);
    c.lineTo(6.5, -6 + bob);
    c.lineTo(7.5, -14 + bob);
    c.lineTo(-4.5, -15.5 + bob);
    c.lineTo(-7.0, -9 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = steelDark;
    c.lineWidth = 1.4;
    c.stroke();

    // Sombra do chanfro posterior do elmo
    c.fillStyle = steelDark;
    c.beginPath();
    c.moveTo(-5.5, -6 + bob);
    c.lineTo(-1.5, -6 + bob);
    c.lineTo(-1.5, -14.5 + bob);
    c.lineTo(-4.5, -15.5 + bob);
    c.lineTo(-7.0, -9 + bob);
    c.closePath();
    c.fill();

    // Crista superior em aço chanfrado com linha de reflexo de luz
    c.fillStyle = steelLight;
    c.beginPath();
    c.moveTo(-1.2, -15.5 + bob);
    c.lineTo(2.8, -15 + bob);
    c.lineTo(2.2, -6 + bob);
    c.lineTo(-0.8, -6 + bob);
    c.closePath();
    c.fill();

    // Linha especular na crista do elmo
    c.strokeStyle = steelHighlight;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(0.5, -15.2 + bob);
    c.lineTo(0.5, -6.5 + bob);
    c.stroke();

    // Reforço em cruz de latão forjado no visor
    // Sombra de rebaixo do visor
    c.fillStyle = '#151b23';
    c.fillRect(0.5, -13.8 + bob, 6.2, 7.8);

    // Barra vertical de ouro
    c.fillStyle = goldTrim;
    c.fillRect(1.5, -13.5 + bob, 2.2, 7.5);
    c.fillStyle = goldLight;
    c.fillRect(1.8, -13.5 + bob, 0.9, 7.5);

    // Barra horizontal de ouro
    c.fillStyle = goldTrim;
    c.fillRect(-2.5, -10.5 + bob, 9.2, 2.4);
    c.fillStyle = goldLight;
    c.fillRect(-2.5, -10.5 + bob, 9.2, 0.8);

    // Rebites dourados nos cantos da cruz do elmo
    c.fillStyle = goldGlint;
    c.fillRect(2.0, -13.2 + bob, 1.0, 1.0);
    c.fillRect(2.0, -6.8 + bob, 1.0, 1.0);
    c.fillRect(-2.2, -10.0 + bob, 1.0, 1.0);

    // Fenda ocular estilizada (O Olhar Sagrado do Paladino)
    const glowCol = isDashing ? '#ffffff' : eyeGlow;
    c.fillStyle = '#080d13';
    c.fillRect(2.6, -10.4 + bob, 4.0, 1.8);
    // Olho celeste incandescente
    c.fillStyle = glowCol;
    c.fillRect(2.8, -10.1 + bob, 3.6, 1.2);
    // Ponto solar especular no olhar
    c.fillStyle = '#ffffff';
    c.fillRect(4.6, -10.1 + bob, 1.5, 1.2);

    // Perfurações de respiração (ventilação histórica da couraça facial)
    c.fillStyle = steelDark;
    c.fillRect(4.8, -7.8 + bob, 0.9, 0.9);
    c.fillRect(6.0, -7.8 + bob, 0.9, 0.9);
    c.fillRect(5.4, -6.5 + bob, 0.9, 0.9);

    // Penacho Plumoso Glorioso (Plumas Imperiais com Curvatura Orgânica e Destaque Lavanda)
    const plumeSway = isMoving ? Math.sin(walkCycle) * 3.2 : Math.sin(tFrame * 0.08) * 1.6;

    // Camada base roxa profunda
    c.fillStyle = plumeCol;
    c.beginPath();
    c.moveTo(-3, -15 + bob);
    c.quadraticCurveTo(-9 - plumeSway, -22 + bob, -17 - Math.abs(plumeSway * 1.3), -15 + bob + plumeSway);
    c.quadraticCurveTo(-9 - plumeSway * 0.5, -13.5 + bob, -4, -13.5 + bob);
    c.closePath();
    c.fill();

    // Segunda pena sobreposta com destaque em lavanda vibrante
    c.fillStyle = plumeHigh;
    c.beginPath();
    c.moveTo(-2.5, -15.5 + bob);
    c.quadraticCurveTo(-7 - plumeSway * 0.9, -20.5 + bob, -14 - Math.abs(plumeSway * 1.1), -17 + bob + plumeSway * 0.8);
    c.quadraticCurveTo(-6 - plumeSway * 0.4, -15 + bob, -3.5, -14.2 + bob);
    c.closePath();
    c.fill();

    // Ponto de luz na raiz do penacho
    c.fillStyle = '#e056fd';
    c.beginPath();
    c.arc(-2.8, -14.8 + bob, 1.0, 0, Math.PI * 2);
    c.fill();

    // 7. Pauldron Nobre Dianteiro (Ombreira Gótica Esculpida com Frisos de Ouro)
    // Placa de aço polido
    c.fillStyle = steelMid;
    c.beginPath();
    c.moveTo(5, -6 + bob);
    c.lineTo(13.5, -4 + bob);
    c.lineTo(11.5, 2.5 + bob);
    c.lineTo(4, 0 + bob);
    c.closePath();
    c.fill();

    // Chanfro superior iluminado
    c.fillStyle = steelLight;
    c.beginPath();
    c.moveTo(5, -6 + bob);
    c.lineTo(13.5, -4 + bob);
    c.lineTo(12.0, -1.5 + bob);
    c.lineTo(4.5, -3.5 + bob);
    c.closePath();
    c.fill();

    // Borda esculpida em ouro reluzente
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.6;
    c.stroke();

    // Ponto especular no topo do pauldron
    c.fillStyle = steelHighlight;
    c.fillRect(9, -4.5 + bob, 3, 1);

    // 8. Braços, Manoplas Articuladas e Empunhadura Dinâmica do Martelo Sagrado
    if (isHammerAttacking) {
      const p = Math.max(0, Math.min(1, hammerProgress));
      let hX = 0, hY = 0, hAngle = 0;
      let runeGlow = 1.0;
      let showSmear = false;
      let smearAlpha = 0;

      if (p < 0.32) {
        // FASE 1: WINDUP (Elevação com as duas mãos e carga rúnica divina)
        const tWind = p / 0.32;
        hX = -2 + tWind * 6;
        hY = -8 - tWind * 14;
        hAngle = -0.75 - tWind * 0.95; // atinge ~ -1.70 rad (inclinado alto atrás da cabeça)
        runeGlow = 1.0 + Math.sin(tWind * Math.PI) * 1.5;

        // Aura sagrada condensando energia estelar no topo do martelo
        c.save();
        c.fillStyle = `rgba(255, 235, 150, ${0.15 + tWind * 0.35})`;
        c.beginPath();
        c.arc(hX - 2, hY - 14, 14 + tWind * 6, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // Braço esquerdo (traseiro) subindo para firmar a pegada no cabo
        c.fillStyle = steelDark;
        c.fillRect(-2, -8 + bob, 5, 5);
        c.fillStyle = steelMid;
        c.fillRect(-1, -12 + bob, 4.5, 6);
        c.fillStyle = goldTrim;
        c.fillRect(0, -14 + bob, 3, 3);

        // Braço direito (frontal) erguido segurando a manopla no colar
        c.fillStyle = steelMid;
        c.fillRect(5, -6 + bob, 5, 5);
        c.fillStyle = steelLight;
        c.fillRect(6, -11 + bob, 4.5, 6.5);
        c.fillStyle = steelDark;
        c.fillRect(6.5, -15 + bob, 4.5, 4.5);
        c.fillStyle = goldTrim;
        c.fillRect(7.5, -15 + bob, 3.5, 3.0);
        c.fillStyle = goldLight;
        c.fillRect(8.5, -14.5 + bob, 1.5, 1.5);
      } else if (p < 0.58) {
        // FASE 2: SLAM / DOWNSWING (Descida fulminante e impacto no solo)
        const tSlam = (p - 0.32) / 0.26;
        const easeSlam = Math.pow(tSlam, 2.2);
        hX = 4 + easeSlam * 16;
        hY = -22 + easeSlam * 34;
        hAngle = -1.70 + easeSlam * 2.82; // gira até +1.12 rad (martelada telúrica no solo)
        runeGlow = 2.0;

        if (tSlam < 0.85) {
          showSmear = true;
          smearAlpha = 1.0 - tSlam;
        } else {
          // Impacto no chão: micro-tremor de choque mecânico
          const shake = (Math.random() - 0.5) * 2.0;
          hX += shake;
          hY += shake;
        }

        // Braço esquerdo (traseiro) projetado para baixo acompanhando o golpe
        c.fillStyle = steelDark;
        c.fillRect(3, -4 + bob + easeSlam * 4, 4.5, 6);
        c.fillStyle = goldTrim;
        c.fillRect(4, 1 + bob + easeSlam * 6, 3, 3);

        // Braço direito (frontal) estendido com força sobre o cabo
        c.fillStyle = steelMid;
        c.fillRect(7, -4 + bob + easeSlam * 6, 5, 7);
        c.fillStyle = steelLight;
        c.fillRect(8, -3 + bob + easeSlam * 6, 2, 6);
        c.fillStyle = steelDark;
        c.fillRect(9, 2 + bob + easeSlam * 8, 4.5, 4.5);
        c.fillStyle = goldTrim;
        c.fillRect(9.5, 3 + bob + easeSlam * 8, 3.5, 3.0);
        c.fillStyle = goldLight;
        c.fillRect(10.5, 3.5 + bob + easeSlam * 8, 1.5, 1.5);
      } else {
        // FASE 3: RECOVERY E TRANSIÇÃO CONTÍNUA AO COLDRE
        const tRec = (p - 0.58) / 0.42;
        if (tRec < 0.40) {
          // Martelo cravado no chão e postura solene de guarda
          hX = 20;
          hY = 12;
          hAngle = 1.12;
          runeGlow = 1.2 - tRec;

          // Braços mantendo o apoio no cabo do martelo
          c.fillStyle = steelMid;
          c.fillRect(6, 0 + bob, 5, 6);
          c.fillStyle = steelDark;
          c.fillRect(8, 5 + bob, 4.5, 4);
          c.fillStyle = goldTrim;
          c.fillRect(9, 6 + bob, 3, 2.5);
        } else {
          // Retorno suave e contínuo ao coldre dorsal
          const tRet = (tRec - 0.40) / 0.60;
          const easeRet = Math.sin(tRet * Math.PI * 0.5);
          hX = 20 - easeRet * 22;
          hY = 12 - easeRet * 15;
          hAngle = 1.12 - easeRet * 1.70; // volta exatamente para -0.58 rad

          c.fillStyle = steelMid;
          c.fillRect(6, -2 + bob, 4.5, 7.5);
          c.fillStyle = steelLight;
          c.fillRect(7, -1.5 + bob, 1.8, 6.5);
          c.fillStyle = steelDark;
          c.fillRect(6.5, 3 + bob, 4.5, 3.5);
          c.fillStyle = goldTrim;
          c.fillRect(7.5, 4 + bob, 2.2, 2.0);
        }
      }

      // Rastro em Arco Sagrado de Alta Velocidade (Motion Smear Ribbon)
      if (showSmear) {
        c.save();
        // Arco externo dourado divino
        c.strokeStyle = evolvedHammer ? `rgba(243, 156, 18, ${smearAlpha * 0.85})` : `rgba(241, 196, 15, ${smearAlpha * 0.75})`;
        c.lineWidth = 11;
        c.beginPath();
        c.arc(hX - 8, hY - 6, 26, hAngle - 1.0, hAngle + 0.15);
        c.stroke();

        // Arco interno branco celestial incandescente
        c.strokeStyle = `rgba(255, 255, 255, ${smearAlpha * 0.95})`;
        c.lineWidth = 5;
        c.beginPath();
        c.arc(hX - 8, hY - 6, 26, hAngle - 0.8, hAngle + 0.05);
        c.stroke();
        c.restore();
      }

      // Renderiza o Martelo Sagrado na Pose Exata dos Braços
      c.save();
      c.translate(hX, hY + bob);
      c.rotate(hAngle);
      drawRolandHammerModel(c, cCol, evolvedHammer, runeGlow);
      c.restore();
    } else {
      // Braço em repouso lateral segurando o equilíbrio do escudo/martelo
      c.fillStyle = steelMid;
      c.fillRect(6, -2 + bob, 4.5, 7.5);
      c.fillStyle = steelLight;
      c.fillRect(7, -1.5 + bob, 1.8, 6.5);
      c.fillStyle = steelHighlight;
      c.fillRect(7.5, -1.0 + bob, 0.7, 5.0);

      // Manopla articulada (guarda-punho e nós dos dedos)
      c.fillStyle = steelDark;
      c.fillRect(6.5, 3 + bob, 4.5, 3.5);
      c.fillStyle = goldTrim;
      c.fillRect(7.5, 4 + bob, 2.2, 2.0);
      c.fillStyle = goldLight;
      c.fillRect(8.0, 4.2 + bob, 1.0, 1.0);
    }

    // --- ULT: Asas Astrais de Éter e Aríete Frontal de Torre (Pavise) ---
    if (isDashing) {
      c.save();
      const wingFlap = Math.sin(tFrame * 0.45) * 6;

      // Asas Astrais Celestiais de Luz Translúcida
      c.fillStyle = 'rgba(241, 196, 15, 0.40)';
      c.strokeStyle = '#00d2d3';
      c.lineWidth = 2.0;

      // Asa Esquerda
      c.beginPath();
      c.moveTo(-4, -10 + bob);
      c.quadraticCurveTo(-18, -26 + wingFlap, -34, -18 + wingFlap);
      c.lineTo(-24, -8 + wingFlap * 0.5);
      c.lineTo(-30, 2 + wingFlap);
      c.lineTo(-14, 4 + bob);
      c.closePath();
      c.fill();
      c.stroke();

      // Asa Direita
      c.beginPath();
      c.moveTo(2, -10 + bob);
      c.quadraticCurveTo(14, -28 + wingFlap, 32, -22 + wingFlap);
      c.lineTo(22, -9 + wingFlap * 0.5);
      c.lineTo(28, 0 + wingFlap);
      c.lineTo(10, 2 + bob);
      c.closePath();
      c.fill();
      c.stroke();

      // Grande Aríete Sagrado Frontal (Escudo Torre Pavise)
      const pPulse = Math.sin(tFrame * 0.5) * 2.5;
      const shX = 16;
      c.fillStyle = 'rgba(241, 196, 15, 0.35)';
      c.strokeStyle = '#ffffff';
      c.lineWidth = 3.2;

      c.beginPath();
      c.moveTo(shX, -22 + pPulse);
      c.lineTo(shX + 11, -12);
      c.lineTo(shX + 10, 14);
      c.lineTo(shX, 22 - pPulse);
      c.lineTo(shX - 4, 16);
      c.lineTo(shX - 4, -16);
      c.closePath();
      c.fill();
      c.stroke();

      // Cruz Heráldica Incandescente no Centro do Pavise
      c.strokeStyle = '#f1c40f';
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(shX + 4, -14); c.lineTo(shX + 4, 14);
      c.moveTo(shX - 1, -2); c.lineTo(shX + 8, -2);
      c.stroke();

      // Ondas frontais de pressão e corte cinético
      c.strokeStyle = 'rgba(0, 206, 201, 0.65)';
      c.lineWidth = 2.2;
      c.beginPath();
      c.arc(shX + 8, 0, 18 + pPulse * 1.5, -Math.PI * 0.45, Math.PI * 0.45);
      c.stroke();
      c.restore();
    }

    // Glifo Rúnico de Retaliação Melee
    if (isRetaliating) {
      c.save();
      c.strokeStyle = 'rgba(0, 206, 201, 0.85)';
      c.lineWidth = 2.2;
      c.beginPath();
      for (let g = 0; g < 6; g++) {
        const ga = (g * Math.PI / 3) + tFrame * 0.05;
        const gx = Math.cos(ga) * 20;
        const gy = Math.sin(ga) * 20 + bob;
        if (g === 0) c.moveTo(gx, gy);
        else c.lineTo(gx, gy);
      }
      c.closePath();
      c.stroke();
      c.restore();
    }
  } else if (heroKey === 'BARBARIAN') {
    // isBerserk handled via state
    const cCol = charDef.color || {};
    const skinCol = cCol.skin || '#c67846';
    const skinShadow = cCol.skinShadow || '#8e4823';
    const skinHigh = cCol.skinHighlight || '#df8b56';
    const scarCol = cCol.scar || '#ba5338';
    const runeCol = isBerserk ? '#ffffff' : (cCol.tattoo || '#f39c12');
    const runeGlow = isBerserk ? (cCol.tattooGlow || '#ff7675') : 'rgba(243, 156, 18, 0.45)';
    const hairCol = cCol.hair || '#d35400';
    const hairDark = cCol.hairDark || '#962d1d';
    const hairHigh = cCol.hairHighlight || '#e67e22';
    const capeCol = cCol.cape || '#7f1d1d';
    const capeInner = cCol.capeInner || '#1e110c';
    const furBase = cCol.furBase || '#36211a';
    const furHigh = cCol.furHighlight || '#5d3a2d';
    const boneCol = cCol.bone || '#e2d7c5';
    const boneLight = cCol.boneLight || '#f5eee1';
    const boneDark = cCol.boneDark || '#a19582';
    const hornTip = cCol.hornTip || '#2b221a';
    const leatherDark = cCol.leatherDark || '#1a120e';
    const leatherMid = cCol.armor || '#2c1e18';
    const leatherLight = cCol.leatherLight || '#5a3a2a';
    const axeSteel = cCol.axeSteel || '#7f8c8d';
    const axeSteelLight = cCol.axeSteelLight || '#b2bec3';
    const axeEdge = cCol.axeEdge || '#f1c40f';
    const axeWood = cCol.axeWood || '#3d271d';
    const ironCol = cCol.iron || '#47535e';
    const brassCol = cCol.brass || '#f39c12';
    const isDetailed = scale >= 1.5;

    // --- 0. EFEITO ESPECIAL BERSERK: Halo de Fúria e Trincas de Solo ---
    if (isBerserk) {
      c.save();
      const furyPulse = Math.sin(tFrame * 0.25) * 3;
      c.strokeStyle = 'rgba(231, 76, 60, 0.55)';
      c.lineWidth = 2.0;
      c.beginPath();
      c.ellipse(0, 14 + bob, 22 + furyPulse, 7.5 + furyPulse * 0.35, 0, 0, Math.PI * 2);
      c.stroke();

      // Fagulhas e emanação de vapor de sangue nos ombros
      for (let f = 0; f < 3; f++) {
        const fAng = tFrame * 0.15 + f * (Math.PI * 2 / 3);
        const fx = Math.cos(fAng) * (14 + furyPulse);
        const fy = -4 + bob + Math.sin(fAng) * 8 - ((tFrame * 0.4 + f * 4) % 10);
        c.fillStyle = f % 2 === 0 ? 'rgba(231, 76, 60, 0.65)' : 'rgba(243, 156, 18, 0.75)';
        c.fillRect(fx - 1, fy - 1, 2, 2);
      }
      c.restore();
    }

    // --- 1. CAPA PESADA DE PELE DE FERA COM BORDA SERRILHADA E RIM LIGHT ---
    // Forro interno escuro
    c.fillStyle = capeInner;
    c.beginPath();
    c.moveTo(-6, -1 + bob);
    c.lineTo(-16 - Math.abs(capeWave * 1.2), 17 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.7), 19 + bob);
    c.lineTo(-1, 17 + bob);
    c.lineTo(4, -1 + bob);
    c.closePath();
    c.fill();

    // Camada principal de pele desgastada com pontas denteadas
    c.fillStyle = capeCol;
    c.beginPath();
    c.moveTo(-6, -2 + bob);
    c.lineTo(-15 - Math.abs(capeWave * 1.1), 15 + bob);
    c.lineTo(-11 - Math.abs(capeWave * 0.8), 12 + bob);
    c.lineTo(-13 - Math.abs(capeWave * 1.0), 18 + bob);
    c.lineTo(-7 - Math.abs(capeWave * 0.6), 16 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.7), 19 + bob);
    c.lineTo(-2, 17 + bob);
    c.lineTo(4, -2 + bob);
    c.closePath();
    c.fill();

    // Borda desfiada / costura de tendão áspero
    c.strokeStyle = '#3d0c0c';
    c.lineWidth = 1.2;
    c.stroke();

    // Rim light sutil de fúria carmesim na silhueta da capa
    c.strokeStyle = isBerserk ? 'rgba(255, 118, 117, 0.8)' : 'rgba(231, 76, 60, 0.35)';
    c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-15 - Math.abs(capeWave * 1.1), 14 + bob);
    c.lineTo(-13 - Math.abs(capeWave * 1.0), 18 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.7), 19 + bob);
    c.stroke();

    // --- 2. COLDRE DORSAL DO MACHADO COLOSSO (Exibido em repouso / preview) ---
    const isAxeOrbitActive = !!state.isAxeOrbiting || (typeof player !== 'undefined' && player.axeCount > 0 && !state.showDorsalAxeForce);
    const showBackAxe = state.showDorsalAxe !== undefined ? state.showDorsalAxe : (!isAxeOrbitActive || state.scale > 2.0);

    if (showBackAxe) {
      c.save();
      c.translate(-3, -2 + bob);
      c.rotate(-0.55);

      // Cabo de carvalho nórdico com ataduras de couro cruzadas
      c.fillStyle = axeWood;
      c.fillRect(-2, -6, 4, 32);
      c.strokeStyle = leatherDark;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-2, 3); c.lineTo(2, 6);
      c.moveTo(-2, 11); c.lineTo(2, 14);
      c.moveTo(-2, 19); c.lineTo(2, 22);
      c.stroke();

      // Pomo inferior reforçado com ferro e correia
      c.fillStyle = ironCol;
      c.fillRect(-2.5, 25, 5, 3.5);
      c.fillStyle = brassCol;
      c.fillRect(-1.5, 26, 3, 1.5);

      // Cabeça do Machado Colosso Nórdico (Lâmina Barbada Assimétrica)
      c.fillStyle = axeSteel;
      c.beginPath();
      c.moveTo(-2, -6);
      c.lineTo(-13, -15);
      c.lineTo(-17, -8);
      c.quadraticCurveTo(-14, 2, -18, 10);
      c.lineTo(-12, 6);
      c.lineTo(-2, 0);
      c.closePath();
      c.fill();
      c.strokeStyle = ironCol;
      c.lineWidth = 1.2;
      c.stroke();

      // Chanfro de aço claro polido
      c.fillStyle = axeSteelLight;
      c.beginPath();
      c.moveTo(-5, -6);
      c.lineTo(-12, -13);
      c.lineTo(-11, 4);
      c.lineTo(-5, 0);
      c.closePath();
      c.fill();

      // Gume dourado incandescente afiado
      c.strokeStyle = axeEdge;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(-13, -15);
      c.lineTo(-17, -8);
      c.quadraticCurveTo(-14, 2, -18, 10);
      c.stroke();

      // Brilho especular branco no corte da lâmina
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(-14, -11);
      c.lineTo(-15, -4);
      c.stroke();

      c.restore();
    }

    // --- 3. PERNAS ROBUSTAS, AMARRAS CRUZADAS E BOTAS PESADAS ---
    const legLeftX = -7.5 - legSwing * 0.45;
    const legRightX = 2.0 + legSwing * 0.45;

    // Coxas musculosas com sombreamento de volume
    c.fillStyle = leatherDark;
    c.fillRect(legLeftX, 6.5 + bob, 5.5, 8.5);
    c.fillRect(legRightX, 6.5 + bob, 5.5, 8.5);

    c.fillStyle = leatherMid;
    c.fillRect(legLeftX + 0.8, 7.0 + bob, 3.8, 8.0);
    c.fillRect(legRightX + 0.8, 7.0 + bob, 3.8, 8.0);

    // Amarras de tendão trançadas em "X" com relevo
    c.strokeStyle = '#8d5524';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(legLeftX, 8.5 + bob);
    c.lineTo(legLeftX + 5.5, 11.5 + bob);
    c.moveTo(legLeftX + 5.5, 8.5 + bob);
    c.lineTo(legLeftX, 11.5 + bob);

    c.moveTo(legRightX, 8.5 + bob);
    c.lineTo(legRightX + 5.5, 11.5 + bob);
    c.moveTo(legRightX + 5.5, 8.5 + bob);
    c.lineTo(legRightX, 11.5 + bob);
    c.stroke();

    // Botas de couro de urso com sola reforçada
    c.fillStyle = '#141210';
    c.fillRect(legLeftX - 1.0, 12.5 + bob, 7.0, 4.0);
    c.fillRect(legRightX - 1.0, 12.5 + bob, 7.0, 4.0);

    // Biqueiras de ferro martelado com cravos
    c.fillStyle = ironCol;
    c.fillRect(legLeftX - 0.5, 14.2 + bob, 5.5, 1.8);
    c.fillRect(legRightX - 0.5, 14.2 + bob, 5.5, 1.8);

    c.fillStyle = '#ffffff';
    c.fillRect(legLeftX + 0.2, 14.2 + bob, 1.2, 1.0);
    c.fillRect(legRightX + 0.2, 14.2 + bob, 1.2, 1.0);

    // --- 4. TRONCO MUSCULOSO DE COLOSSO NÓRDICO (ANATOMIA 2.5D) ---
    // Base muscular em formato V-Taper
    c.fillStyle = skinCol;
    c.beginPath();
    c.moveTo(-11.0, -5 + bob);
    c.lineTo(11.0, -5 + bob);
    c.lineTo(6.5, 7 + bob);
    c.lineTo(-6.5, 7 + bob);
    c.closePath();
    c.fill();

    // Sombreamento muscular anatômico (Grandes Peitorais e Linha Esternal)
    c.fillStyle = skinShadow;
    // Sombra profunda sob os peitorais
    c.beginPath();
    c.moveTo(-8.5, 0.5 + bob);
    c.quadraticCurveTo(-4.5, 2.5 + bob, -0.5, 0.5 + bob);
    c.lineTo(-0.5, 2.0 + bob);
    c.quadraticCurveTo(-4.5, 3.8 + bob, -8.5, 1.8 + bob);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(0.5, 0.5 + bob);
    c.quadraticCurveTo(4.5, 2.5 + bob, 8.5, 0.5 + bob);
    c.lineTo(8.5, 1.8 + bob);
    c.quadraticCurveTo(4.5, 3.8 + bob, 0.5, 2.0 + bob);
    c.closePath();
    c.fill();

    // Sulco esternal central e abdômen
    c.fillRect(-0.6, -3.5 + bob, 1.2, 7.5);

    // Destaque de volume luminoso no topo dos peitorais
    c.fillStyle = skinHigh;
    c.fillRect(-8.0, -4.0 + bob, 6.5, 1.6);
    c.fillRect(1.5, -4.0 + bob, 6.5, 1.6);

    // Cicatriz de Guerra Veterana (Diagonal cruzando o peito esquerdo)
    c.strokeStyle = scarCol;
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-7.0, -3.5 + bob);
    c.lineTo(-2.0, 1.5 + bob);
    c.stroke();
    // Pontos de sutura primitiva na cicatriz
    c.strokeStyle = '#f5eee1';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-6.0, -3.0 + bob); c.lineTo(-4.8, -1.8 + bob);
    c.moveTo(-4.2, -1.0 + bob); c.lineTo(-3.0, 0.2 + bob);
    c.stroke();

    // Tatuagens Rúnicas Nórdicas (Pulsam em chamas no modo Berserk)
    c.strokeStyle = runeCol;
    c.lineWidth = isBerserk ? 2.0 : 1.5;
    c.beginPath();
    c.moveTo(-7, -2 + bob);
    c.lineTo(-3, 0 + bob);
    c.lineTo(-5, 3 + bob);
    c.lineTo(-1, 5 + bob);
    c.moveTo(1, -3 + bob);
    c.lineTo(5, -1 + bob);
    c.lineTo(3, 2 + bob);
    c.stroke();

    if (isBerserk) {
      c.save();
      c.fillStyle = runeGlow;
      c.fillRect(-4.5, -0.5 + bob, 3.2, 3.2);
      c.fillRect(1.8, -1.5 + bob, 3.2, 3.2);
      c.fillStyle = '#ffffff';
      c.fillRect(-3.5, 0.2 + bob, 1.5, 1.5);
      c.fillRect(2.5, -0.8 + bob, 1.5, 1.5);
      c.restore();
    }

    // Arnês de Couro em "X" com Broche Central de Bronze
    c.strokeStyle = leatherDark;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-9.5, -4 + bob);
    c.lineTo(6.5, 6.5 + bob);
    c.moveTo(9.5, -4 + bob);
    c.lineTo(-6.5, 6.5 + bob);
    c.stroke();

    c.strokeStyle = leatherLight;
    c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-9.0, -4.5 + bob);
    c.lineTo(6.0, 6.0 + bob);
    c.stroke();

    // Broche Central de Bronze com Gema Âmbar Lapidada
    c.fillStyle = '#d35400';
    c.beginPath();
    c.arc(0, 1 + bob, 3.0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = brassCol;
    c.lineWidth = 1.0;
    c.stroke();

    c.fillStyle = isBerserk ? '#ffffff' : '#f1c40f';
    c.fillRect(-1.2, -0.2 + bob, 2.4, 2.4);
    c.fillStyle = '#ffffff';
    c.fillRect(-0.6, -0.2 + bob, 1.0, 1.0);

    // Cinturão de Guerra com Fivela de Ferro Rúnico
    c.fillStyle = leatherDark;
    c.fillRect(-7.5, 4.5 + bob, 15, 3.4);
    c.fillStyle = leatherMid;
    c.fillRect(-7.0, 5.0 + bob, 14, 1.2);

    // Fivela de ferro maciço chanfrado
    c.fillStyle = ironCol;
    c.fillRect(-3.0, 3.8 + bob, 6.0, 4.6);
    c.fillStyle = brassCol;
    c.fillRect(-1.8, 4.6 + bob, 3.6, 3.0);
    c.fillStyle = ironCol;
    c.fillRect(-0.8, 5.2 + bob, 1.6, 1.8);

    // --- 5. OMBREIRA TRASEIRA DE CRÂNIO DE FERA COM CRAVOS E RELEVO ---
    c.fillStyle = boneCol;
    c.beginPath();
    c.moveTo(-11, -6 + bob);
    c.quadraticCurveTo(-16, -4 + bob, -14, 1 + bob);
    c.lineTo(-8, -1 + bob);
    c.closePath();
    c.fill();

    // Cavidade da órbita do crânio (preto profundo sombreado)
    c.fillStyle = '#14100d';
    c.beginPath();
    c.arc(-11.5, -2.5 + bob, 1.8, 0, Math.PI * 2);
    c.fill();

    // Dente / Espigão de marfim afiado projetado
    c.fillStyle = boneLight;
    c.beginPath();
    c.moveTo(-13, -3 + bob);
    c.lineTo(-18, -7.5 + bob);
    c.lineTo(-11, -6 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = boneDark;
    c.lineWidth = 1.0;
    c.stroke();

    // Ponta brilhante do espigão
    c.fillStyle = '#ffffff';
    c.fillRect(-17.5, -7.2 + bob, 1.4, 1.4);

    // --- 6. BRAÇOS MUSCULOSOS COM MUNHEQUEIRAS REFORÇADAS E VEIAS ---
    c.fillStyle = skinCol;
    c.fillRect(-11.5, -3 + bob, 4.8, 8.5);
    c.fillRect(7.0, -3 + bob, 4.8, 8.5);

    // Sombra de volume no bíceps
    c.fillStyle = skinShadow;
    c.fillRect(-11.5, 1.0 + bob, 4.8, 1.5);
    c.fillRect(7.0, 1.0 + bob, 4.8, 1.5);

    // Destaque de luz no deltoide externo
    c.fillStyle = skinHigh;
    c.fillRect(-11.0, -3.0 + bob, 1.5, 4.0);
    c.fillRect(10.0, -3.0 + bob, 1.5, 4.0);

    // Veias de adrenalina pulsando no modo Berserk
    if (isBerserk) {
      c.strokeStyle = 'rgba(255, 71, 87, 0.9)';
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(-10.5, -1 + bob); c.lineTo(-8.5, 1.5 + bob);
      c.moveTo(8.5, -1 + bob); c.lineTo(10.5, 1.5 + bob);
      c.stroke();
    }

    // Munhequeiras duplas de couro curtido
    c.fillStyle = leatherDark;
    c.fillRect(-12.0, 2.0 + bob, 5.5, 4.0);
    c.fillRect(6.5, 2.0 + bob, 5.5, 4.0);

    // Rebites de ferro polido com brilho
    c.fillStyle = ironCol;
    c.fillRect(-11.0, 2.8 + bob, 1.8, 1.8);
    c.fillRect(8.0, 2.8 + bob, 1.8, 1.8);
    c.fillStyle = '#ffffff';
    c.fillRect(-10.5, 2.8 + bob, 0.8, 0.8);
    c.fillRect(8.5, 2.8 + bob, 0.8, 0.8);

    // --- 7. GOLA DE PELES DE LOBO SELVAGEM (TUFOS RECORTADOS EM CAMADAS) ---
    // Camada escura de base
    c.fillStyle = furBase;
    c.beginPath();
    c.moveTo(-10.5, -6 + bob);
    c.quadraticCurveTo(0, -2.5 + bob, 10.5, -6 + bob);
    c.lineTo(8.5, -9.0 + bob);
    c.quadraticCurveTo(0, -6.5 + bob, -8.5, -9.0 + bob);
    c.closePath();
    c.fill();

    // Tufos recortados de pelagem em relevo com highlights
    c.fillStyle = furHigh;
    c.beginPath();
    c.moveTo(-9.0, -6.5 + bob);
    c.lineTo(-6.5, -4.5 + bob);
    c.lineTo(-5.0, -6.5 + bob);
    c.lineTo(-1.5, -4.0 + bob);
    c.lineTo(0.5, -6.5 + bob);
    c.lineTo(4.0, -4.2 + bob);
    c.lineTo(6.5, -6.5 + bob);
    c.lineTo(9.0, -5.5 + bob);
    c.lineTo(7.5, -8.0 + bob);
    c.quadraticCurveTo(0, -5.5 + bob, -8.0, -8.0 + bob);
    c.closePath();
    c.fill();

    // Mechas de pelo cinza-claro na gola
    c.fillStyle = boneLight;
    c.fillRect(-4.5, -5.5 + bob, 1.8, 1.2);
    c.fillRect(2.5, -5.5 + bob, 1.8, 1.2);

    // --- 8. CABEÇA, ROSTO E OLHOS FURIOSOS ---
    c.fillStyle = skinCol;
    c.beginPath();
    c.arc(0.5, -9.5 + bob, 6.2, 0, Math.PI * 2);
    c.fill();

    // Sombra do osso frontal e têmpora
    c.fillStyle = skinShadow;
    c.fillRect(-3.5, -12.0 + bob, 4.0, 1.8);

    // Olhos Expressivos
    if (isBerserk) {
      // Olho em brasa incandescente branca com chamas de fúria
      c.fillStyle = '#ffffff';
      c.fillRect(1.8, -11.0 + bob, 3.8, 2.6);
      c.strokeStyle = '#ff3838';
      c.lineWidth = 1.2;
      c.strokeRect(1.8, -11.0 + bob, 3.8, 2.6);

      // Fumaça de sangue saindo do canto do olho
      const eyeSmoke = Math.sin(tFrame * 0.3) * 1.5;
      c.strokeStyle = 'rgba(255, 71, 87, 0.75)';
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(5.6, -10.0 + bob);
      c.lineTo(8.5 + eyeSmoke, -12.0 + bob);
      c.stroke();
    } else {
      // Olho vivo com íris âmbar e reflexo
      c.fillStyle = '#1e140d';
      c.fillRect(2.0, -10.5 + bob, 3.0, 2.2);
      c.fillStyle = '#f39c12';
      c.fillRect(2.8, -10.2 + bob, 1.6, 1.6);
      c.fillStyle = '#ffffff';
      c.fillRect(3.6, -10.2 + bob, 0.8, 0.8);
    }

    // Sobrancelha cerrada e ruga de expressão
    c.strokeStyle = '#4a2810';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(1.2, -11.8 + bob);
    c.lineTo(5.6, -10.5 + bob);
    c.stroke();

    // Micro-baforada de vapor nórdico da respiração
    const breathCycle = (tFrame * 0.08) % 1;
    if (breathCycle < 0.5) {
      const bProg = breathCycle * 2;
      c.fillStyle = `rgba(245, 238, 225, ${(1 - bProg) * (isBerserk ? 0.65 : 0.35)})`;
      c.beginPath();
      c.arc(5.5 + bProg * 5, -5.5 + bob - bProg * 3, 1.0 + bProg * 2.2, 0, Math.PI * 2);
      c.fill();
    }

    // --- 9. BARBA RUIVA TRANÇADA COM ANEL DE OSSO E BIGODE ---
    // Base escura da barba
    c.fillStyle = hairDark;
    c.beginPath();
    c.moveTo(-2.5, -8.5 + bob);
    c.lineTo(5.8, -8.5 + bob);
    c.quadraticCurveTo(9.0, -3 + bob, 6.5, 1.5 + bob);
    c.lineTo(1.5, 3.0 + bob);
    c.quadraticCurveTo(0.0, -3 + bob, -2.5, -8.5 + bob);
    c.closePath();
    c.fill();

    // Volume frontal ruivo vibrante
    c.fillStyle = hairCol;
    c.beginPath();
    c.moveTo(-1.8, -8.0 + bob);
    c.lineTo(5.0, -8.0 + bob);
    c.quadraticCurveTo(8.0, -3 + bob, 5.5, 1.0 + bob);
    c.lineTo(1.8, 2.2 + bob);
    c.quadraticCurveTo(0.5, -3 + bob, -1.8, -8.0 + bob);
    c.closePath();
    c.fill();

    // Trança longa pendente
    c.fillStyle = hairCol;
    c.beginPath();
    c.moveTo(1.8, 1.5 + bob);
    c.lineTo(5.2, 1.5 + bob);
    c.lineTo(3.6, 6.5 + bob);
    c.closePath();
    c.fill();

    // Argola de Marfim Rústica com gravações rúnicas
    c.fillStyle = boneCol;
    c.fillRect(2.0, 2.2 + bob, 3.2, 2.2);
    c.fillStyle = boneDark;
    c.fillRect(2.0, 2.2 + bob, 3.2, 0.6);
    c.fillStyle = brassCol;
    c.fillRect(2.8, 2.8 + bob, 1.4, 1.0);

    // Bigode farto e cerrado sobre os lábios
    c.fillStyle = hairDark;
    c.beginPath();
    c.moveTo(0.8, -7.5 + bob);
    c.lineTo(6.8, -5.8 + bob);
    c.lineTo(2.5, -5.0 + bob);
    c.closePath();
    c.fill();
    c.fillStyle = hairHigh;
    c.fillRect(2.2, -6.8 + bob, 3.0, 1.0);

    // --- 10. CABELOS LONGOS SELVAGENS ONDULANTES ---
    const hairWave = isMoving ? Math.sin(walkCycle) * 3.8 : Math.sin(tFrame * 0.08) * 1.8;
    c.fillStyle = hairDark;
    c.beginPath();
    c.moveTo(-2, -12.5 + bob);
    c.quadraticCurveTo(-9 - hairWave * 0.8, -13.5 + bob, -15 - Math.abs(hairWave * 1.1), -6 + bob + hairWave * 0.6);
    c.quadraticCurveTo(-8, -7 + bob, -4, -8 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = hairCol;
    c.beginPath();
    c.moveTo(-2, -12.0 + bob);
    c.quadraticCurveTo(-8 - hairWave * 0.7, -12.5 + bob, -13 - Math.abs(hairWave * 0.9), -5.5 + bob + hairWave * 0.5);
    c.quadraticCurveTo(-7, -6.5 + bob, -3.5, -8 + bob);
    c.closePath();
    c.fill();

    // Mechas de luz ruivas claras nos fios soltos
    c.fillStyle = hairHigh;
    c.fillRect(-6.5 - hairWave * 0.4, -10.5 + bob, 2.5, 1.2);

    // --- 11. DIADEMA DE FERRO E CHIFRES RÚSTICOS ESCULPIDOS ---
    // Diadema de ferro batido com chanfro metálico claro
    c.fillStyle = ironCol;
    c.fillRect(-5.5, -15.0 + bob, 11, 3.5);
    c.fillStyle = axeSteelLight;
    c.fillRect(-5.5, -15.0 + bob, 11, 1.0);
    // Gema / Broche central do diadema
    c.fillStyle = brassCol;
    c.fillRect(-1.0, -14.5 + bob, 2.4, 2.4);
    c.fillStyle = isBerserk ? '#ffffff' : '#f1c40f';
    c.fillRect(-0.4, -14.0 + bob, 1.2, 1.2);

    // Chifres de Marfim esculpidos com estrias de crescimento
    c.fillStyle = boneCol;
    c.strokeStyle = boneDark;
    c.lineWidth = 1.2;

    // Chifre Esquerdo
    c.beginPath();
    c.moveTo(-5.0, -13.8 + bob);
    c.quadraticCurveTo(-12.0, -17.0 + bob, -11.5, -23.0 + bob);
    c.quadraticCurveTo(-7.5, -18.0 + bob, -3.2, -14.8 + bob);
    c.closePath();
    c.fill();
    c.stroke();

    // Chifre Direito
    c.beginPath();
    c.moveTo(3.2, -14.8 + bob);
    c.quadraticCurveTo(7.5, -18.0 + bob, 11.5, -23.0 + bob);
    c.quadraticCurveTo(12.0, -17.0 + bob, 5.0, -13.8 + bob);
    c.closePath();
    c.fill();
    c.stroke();

    // Pontas escurecidas e afiadas dos chifres
    c.fillStyle = hornTip;
    c.beginPath();
    c.moveTo(-10.5, -20.5 + bob);
    c.lineTo(-11.5, -23.0 + bob);
    c.lineTo(-9.5, -20.0 + bob);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(9.5, -20.0 + bob);
    c.lineTo(11.5, -23.0 + bob);
    c.lineTo(10.5, -20.5 + bob);
    c.closePath();
    c.fill();

    // Estrias horizontais de crescimento nos chifres
    c.strokeStyle = boneDark;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-8.0, -16.5 + bob); c.lineTo(-5.5, -15.5 + bob);
    c.moveTo(-9.5, -18.5 + bob); c.lineTo(-7.5, -17.5 + bob);
    c.moveTo(5.5, -15.5 + bob); c.lineTo(8.0, -16.5 + bob);
    c.moveTo(7.5, -17.5 + bob); c.lineTo(9.5, -18.5 + bob);
    c.stroke();

    // Brilho especular branco no topo da curvatura
    c.fillStyle = '#ffffff';
    c.fillRect(-10.0, -21.0 + bob, 1.2, 1.5);
    c.fillRect(9.0, -21.0 + bob, 1.2, 1.5);
  } else if (heroKey === 'ALCHEMIST') {
    const cCol = charDef.color || {};
    const coatCol = cCol.coat || '#112920';
    const coatDark = cCol.coatDark || '#081611';
    const coatLight = cCol.coatLight || '#165b45';
    const coatHigh = cCol.coatHighlight || '#1d6f54';
    const trimGold = cCol.trimGold || '#f39c12';
    const brassCol = cCol.brass || '#d4a373';
    const brassBright = cCol.brassBright || '#f5cd79';
    const brassDark = cCol.brassDark || '#8a5d3b';
    const brassGlint = cCol.brassGlint || '#ffffff';
    const copperCol = cCol.copper || '#b87333';
    const copperLight = cCol.copperLight || '#d98845';
    const leatherCol = cCol.leather || '#2c1e18';
    const leatherDark = cCol.leatherDark || '#17100d';
    const leatherStitch = cCol.leatherStitch || '#4a3525';
    const hairBase = cCol.hair || '#3a134a';
    const hairMid = cCol.hairMid || '#6a258a';
    const hairHigh = cCol.hairHighlight || '#a55eea';
    const skinTone = cCol.skin || '#fae1cb';
    const skinShadow = cCol.skinShadow || '#e0b08a';
    const eyeCol = cCol.eyeGlow || '#00ffcc';
    const lensCol = cCol.lens || '#00ffcc';
    const acidBase = state.evolvedPotion ? (cCol.acidEvolved || '#a29bfe') : (cCol.acid || '#9b59b6');
    const acidGlow = state.evolvedPotion ? (cCol.acidEvolvedGlow || '#e056fd') : (cCol.acidGlow || '#d6a2e8');
    const reagentPurple = cCol.reagentPurple || '#8e44ad';
    const reagentPurpleGlow = cCol.reagentPurpleGlow || '#d6a2e8';
    const reagentMutagen = cCol.reagentMutagen || '#6c218a';
    const reagentAmber = cCol.reagentAmber || '#f39c12';
    const reagentAmberGlow = cCol.reagentAmberGlow || '#f1c40f';

    const hairSway = isMoving ? Math.sin(walkCycle) * 4.5 : Math.sin(tFrame * 0.08) * 1.8;
    const coatSway = isMoving ? Math.sin(walkCycle * 1.1) * 3.5 : Math.sin(tFrame * 0.07) * 1.4;
    const isOvercharged = isAlchemistSkill || (alchemistSkillTimer > 0);
    const isDetailed = scale >= 1.5;

    // --- 0. RIM LIGHT CÁUSTICA (Luz de contorno violeta/roxa emitida pelo veneno) ---
    c.save();
    c.strokeStyle = isOvercharged ? 'rgba(224, 86, 253, 0.65)' : 'rgba(155, 89, 182, 0.40)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-6, 2 + bob);
    c.lineTo(-14 - Math.abs(coatSway * 1.0), 16 + bob);
    c.lineTo(-8 - Math.abs(coatSway * 0.5), 18 + bob);
    c.stroke();
    c.restore();

    // =========================================================================
    // 1. HABILIDADE: CÍRCULO RÚNICO DE TRANSMUTAÇÃO NO SOLO
    // =========================================================================
    if (isOvercharged) {
      c.save();
      const circleR = 24 + Math.sin(tFrame * 0.25) * 2.5;
      const rot1 = tFrame * 0.035;
      const rot2 = -tFrame * 0.025;

      // Anel rúnico externo com brilho
      c.strokeStyle = acidGlow;
      c.lineWidth = 2.0;
      c.beginPath();
      c.ellipse(0, 14 + bob, circleR, circleR * 0.38, 0, 0, Math.PI * 2);
      c.stroke();

      // Círculo interno tracejado com rotação
      c.save();
      c.translate(0, 14 + bob);
      c.scale(1, 0.38);
      c.rotate(rot1);
      c.setLineDash([4, 4]);
      c.strokeStyle = acidBase;
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(0, 0, circleR - 5, 0, Math.PI * 2);
      c.stroke();

      // Geometria de transmutação no solo (Triângulo Sagrado dos Elementos)
      c.setLineDash([]);
      c.rotate(rot2);
      c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      c.lineWidth = 1.1;
      c.beginPath();
      for (let pt = 0; pt < 3; pt++) {
        const pAng = (pt * Math.PI * 2 / 3);
        const px = Math.cos(pAng) * (circleR - 7);
        const py = Math.sin(pAng) * (circleR - 7);
        if (pt === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.stroke();

      // Glifo central alquímico no solo
      c.fillStyle = acidGlow;
      c.beginPath();
      c.arc(0, 0, 3.2, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // Miasma cáustico ascendente com partículas violeta e púrpura
      for (let m = 0; m < 5; m++) {
        const mAng = (m * Math.PI * 0.4) + tFrame * 0.12;
        const mx = Math.cos(mAng) * 16;
        const my = 12 + bob + Math.sin(mAng) * 5 - ((tFrame * 0.5 + m * 3.5) % 13);
        c.fillStyle = m % 2 === 0 
          ? `rgba(214, 162, 232, ${0.48 - (m * 0.07)})` 
          : `rgba(155, 89, 182, ${0.42 - (m * 0.07)})`;
        c.beginPath();
        c.arc(mx, my, 2.2, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    // =========================================================================
    // 2. CAPA / FRAQUE POSTERIOR VIRIDIAN (TAILCOAT DE ALQUIMISTA)
    // =========================================================================
    // Camada interna escura com degradê
    c.fillStyle = coatDark;
    c.beginPath();
    c.moveTo(-5, 2 + bob);
    c.lineTo(-14 - Math.abs(coatSway * 1.0), 16 + bob);
    c.lineTo(-8 - Math.abs(coatSway * 0.5), 18 + bob);
    c.lineTo(-2, 16 + bob);
    c.lineTo(3, 2 + bob);
    c.closePath();
    c.fill();

    // Camada principal de veludo viridian
    c.fillStyle = coatCol;
    c.beginPath();
    c.moveTo(-5, 1 + bob);
    c.lineTo(-12 - Math.abs(coatSway * 0.9), 15 + bob);
    c.lineTo(-7 - Math.abs(coatSway * 0.5), 17 + bob);
    c.lineTo(-2, 15 + bob);
    c.lineTo(3, 1 + bob);
    c.closePath();
    c.fill();

    // Abas com reflexo suave de luz
    c.fillStyle = coatHigh;
    c.beginPath();
    c.moveTo(-4, 2 + bob);
    c.lineTo(-10 - Math.abs(coatSway * 0.8), 14 + bob);
    c.lineTo(-6 - Math.abs(coatSway * 0.4), 15 + bob);
    c.lineTo(-2, 13 + bob);
    c.closePath();
    c.fill();

    // Debrum dourado de latão polido na bainha
    c.strokeStyle = brassCol;
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-12 - Math.abs(coatSway * 0.9), 15 + bob);
    c.lineTo(-7 - Math.abs(coatSway * 0.5), 17 + bob);
    c.lineTo(-2, 15 + bob);
    c.stroke();

    // Ponto de brilho metálico na ponta da bainha
    c.fillStyle = brassGlint;
    c.fillRect(-7.5 - Math.abs(coatSway * 0.5), 16.5 + bob, 1.2, 1.2);

    // =========================================================================
    // 3. APARATO DORSAL ALEMBIC (TANQUE DE VIDRO SOPRADO, SERPENTINA E MANÔMETRO)
    // =========================================================================
    c.save();
    c.translate(-7.5, -2 + bob);

    // Suporte dorsal de couro grosso com rebites
    c.fillStyle = leatherDark;
    c.fillRect(-2.2, -5.5, 4.4, 15.0);
    c.fillStyle = brassCol;
    c.fillRect(-1.8, -4.5, 1.0, 1.0);
    c.fillRect(-1.8, 7.5, 1.0, 1.0);

    // Cilindro de vidro reforçado com dupla espessura
    c.fillStyle = 'rgba(12, 25, 20, 0.94)';
    c.beginPath();
    c.roundRect(-3.5, -6.5, 6.2, 16.0, 2);
    c.fill();
    c.strokeStyle = brassCol;
    c.lineWidth = 1.1;
    c.stroke();

    // Líquido cáustico efervescente no interior (slosh dinâmico com menisco)
    const slosh = Math.sin(tFrame * 0.15) * 1.0;
    c.save();
    c.beginPath();
    c.roundRect(-3.0, -1.5, 5.2, 10.5, [0, 0, 1.5, 1.5]);
    c.clip();

    // Gradiente do líquido cáustico
    c.fillStyle = acidBase;
    c.fillRect(-3.5, -1.2 + slosh, 6.2, 11.5);

    // Linha luminosa de menisco na superfície do líquido
    c.strokeStyle = acidGlow;
    c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-3.5, -1.2 + slosh);
    c.lineTo(2.7, -1.2 - slosh * 0.6);
    c.stroke();

    // Microbolhas ativas subindo em velocidades desiguais
    const b1Y = 8.0 - ((tFrame * 0.32) % 9.5);
    const b2Y = 8.5 - (((tFrame + 14) * 0.24) % 9.5);
    const b3Y = 7.5 - (((tFrame + 28) * 0.38) % 9.5);

    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(-1.2, b1Y, 0.8, 0, Math.PI * 2);
    c.arc(0.8, b2Y, 0.6, 0, Math.PI * 2);
    c.arc(-0.2, b3Y, 0.5, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Chanfro de reflexo curvo de vidro soprado (vidro científico cristalino)
    c.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(-2.6, -5.2);
    c.lineTo(-2.6, 8.2);
    c.stroke();

    // Serpentina de tubulação de cobre contornando a lateral do tanque
    c.strokeStyle = copperCol;
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-3.2, -3.5); c.lineTo(-4.5, -2.5); c.lineTo(-3.2, -1.5);
    c.moveTo(-3.2, 0.5);  c.lineTo(-4.5, 1.5);  c.lineTo(-3.2, 2.5);
    c.moveTo(-3.2, 4.5);  c.lineTo(-4.5, 5.5);  c.lineTo(-3.2, 6.5);
    c.stroke();
    c.strokeStyle = copperLight;
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(-4.2, -2.5); c.lineTo(-4.0, -2.3);
    c.moveTo(-4.2, 1.5);  c.lineTo(-4.0, 1.7);
    c.moveTo(-4.2, 5.5);  c.lineTo(-4.0, 5.7);
    c.stroke();

    // Manômetro de latão trabalhado com escala de pressão
    c.fillStyle = brassCol;
    c.beginPath();
    c.arc(3.0, 1.0, 2.8, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = brassDark;
    c.lineWidth = 0.8;
    c.stroke();

    // Mostrador branco do manômetro
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(3.0, 1.0, 2.0, 0, Math.PI * 2);
    c.fill();

    // Zona vermelha de perigo na escala
    c.strokeStyle = '#e74c3c';
    c.lineWidth = 0.6;
    c.beginPath();
    c.arc(3.0, 1.0, 1.5, -Math.PI * 0.4, 0);
    c.stroke();

    // Ponteiro funcional oscilante com trepidação física de pressão
    const needleVibe = Math.sin(tFrame * 0.4) * 0.15;
    const needleAng = isOvercharged 
      ? (-Math.PI * 0.2 + needleVibe * 2.5) 
      : (-Math.PI * 0.75 + Math.sin(tFrame * 0.1) * 0.5 + needleVibe);
    c.strokeStyle = isOvercharged ? '#c0392b' : '#2c1e18';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(3.0, 1.0);
    c.lineTo(3.0 + Math.cos(needleAng) * 1.6, 1.0 + Math.sin(needleAng) * 1.6);
    c.stroke();

    // Ponto central do manômetro
    c.fillStyle = brassCol;
    c.fillRect(2.7, 0.7, 0.6, 0.6);

    // Chaminé de escape de vapor com anéis chanfrados
    c.fillStyle = brassCol;
    c.fillRect(-2.0, -9.0, 2.8, 3.0);
    c.fillStyle = brassBright;
    c.fillRect(-2.6, -10.0, 4.0, 1.3);
    c.fillStyle = brassGlint;
    c.fillRect(-2.0, -9.8, 2.8, 0.6);

    // Vapores químicos desprendendo da chaminé em arcos (Roxo / Violeta Alquímico)
    const steamAlpha = isOvercharged ? 0.85 : 0.42;
    for (let st = 1; st <= (isOvercharged ? 3 : 2); st++) {
      const stProg = ((tFrame * (isOvercharged ? 0.20 : 0.09) + st * 0.45) % 1);
      const stX = -1.2 - (stProg * 6.5);
      const stY = -10.5 - (stProg * 8.5);
      c.fillStyle = isOvercharged 
        ? `rgba(224, 86, 253, ${(1 - stProg) * steamAlpha})` 
        : `rgba(155, 89, 182, ${(1 - stProg) * steamAlpha})`;
      c.beginPath();
      c.arc(stX, stY, 1.6 + stProg * 3.2, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // =========================================================================
    // 4. PERNAS E BOTAS DE EXPEDIÇÃO ALQUÍMICA
    // =========================================================================
    const legLeftX = -6.0 - legSwing * 0.35;
    const legRightX = 1.5 + legSwing * 0.35;

    // Calças justas escuras com sombreamento
    c.fillStyle = coatDark;
    c.fillRect(legLeftX, 6.0 + bob, 4.5, 8.0);
    c.fillRect(legRightX, 6.0 + bob, 4.5, 8.0);

    // Joelheiras de couro esculpido com rebites de latão polido
    c.fillStyle = leatherCol;
    c.fillRect(legLeftX, 8.0 + bob, 4.5, 3.4);
    c.fillRect(legRightX, 8.0 + bob, 4.5, 3.4);

    c.fillStyle = brassCol;
    c.fillRect(legLeftX + 1.2, 9.0 + bob, 2.0, 1.4);
    c.fillRect(legRightX + 1.2, 9.0 + bob, 2.0, 1.4);
    c.fillStyle = brassGlint;
    c.fillRect(legLeftX + 1.6, 9.2 + bob, 0.8, 0.8);
    c.fillRect(legRightX + 1.6, 9.2 + bob, 0.8, 0.8);

    // Botas altas de couro com cano reforçado
    c.fillStyle = leatherDark;
    c.fillRect(legLeftX - 0.5, 11.5 + bob, 5.5, 4.5);
    c.fillRect(legRightX - 0.5, 11.5 + bob, 5.5, 4.5);

    // Fivelas duplas de latão nas botas com ponto de luz
    c.fillStyle = brassBright;
    c.fillRect(legLeftX + 0.5, 12.0 + bob, 3.5, 1.2);
    c.fillRect(legRightX + 0.5, 12.0 + bob, 3.5, 1.2);
    c.fillRect(legLeftX + 0.5, 14.0 + bob, 3.0, 1.0);
    c.fillRect(legRightX + 0.5, 14.0 + bob, 3.0, 1.0);

    c.fillStyle = brassGlint;
    c.fillRect(legLeftX + 1.5, 12.0 + bob, 1.0, 1.0);
    c.fillRect(legRightX + 1.5, 12.0 + bob, 1.0, 1.0);

    // =========================================================================
    // 5. BRAÇO TRASEIRO (ESQUERDO) - PREENCHE A SILHUETA LATERAL
    // =========================================================================
    c.fillStyle = coatCol;
    c.fillRect(-9.5, -3 + bob, 4.0, 7.5);
    c.fillStyle = leatherCol;
    c.fillRect(-10.0, 1.5 + bob, 4.5, 3.5);
    c.fillStyle = brassCol;
    c.fillRect(-9.5, 2.0 + bob, 2.0, 1.5);
    c.fillStyle = brassGlint;
    c.fillRect(-9.2, 2.2 + bob, 0.8, 0.8);

    // =========================================================================
    // 6. TRONCO, ESCLAVINA DE OMBROS E CORSELETE ACINTURADO
    // =========================================================================
    // Casaco viridian nobre com costuras de alfaiataria
    c.fillStyle = coatCol;
    c.beginPath();
    c.moveTo(-8.0, -5 + bob);
    c.lineTo(8.0, -5 + bob);
    c.lineTo(5.5, 6.5 + bob);
    c.lineTo(-5.5, 6.5 + bob);
    c.closePath();
    c.fill();

    // Costuras finas verticais douradas no casaco
    c.strokeStyle = leatherStitch;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-6.5, -4.5 + bob); c.lineTo(-4.5, 5.5 + bob);
    c.moveTo(6.5, -4.5 + bob);  c.lineTo(4.5, 5.5 + bob);
    c.stroke();

    // Esclavina de ombro (capa curta de couro com 3 botões chanfrados)
    c.fillStyle = leatherCol;
    c.beginPath();
    c.moveTo(-8.5, -5.5 + bob);
    c.lineTo(8.5, -5.5 + bob);
    c.lineTo(7.0, -1.0 + bob);
    c.lineTo(-7.0, -1.0 + bob);
    c.closePath();
    c.fill();

    // Botões de latão chanfrado com ponto especular
    c.fillStyle = brassBright;
    c.beginPath();
    c.arc(-5.5, -3.2 + bob, 1.1, 0, Math.PI * 2);
    c.arc(0, -3.2 + bob, 1.1, 0, Math.PI * 2);
    c.arc(5.5, -3.2 + bob, 1.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = brassGlint;
    c.fillRect(-5.8, -3.6 + bob, 0.7, 0.7);
    c.fillRect(-0.3, -3.6 + bob, 0.7, 0.7);
    c.fillRect(5.2, -3.6 + bob, 0.7, 0.7);

    // Corselete de couro escuro acinturado
    c.fillStyle = leatherDark;
    c.beginPath();
    c.moveTo(-5.0, -2.0 + bob);
    c.lineTo(5.0, -2.0 + bob);
    c.lineTo(4.0, 5.0 + bob);
    c.lineTo(-4.0, 5.0 + bob);
    c.closePath();
    c.fill();

    // Amarração em "X" com ilhoses de latão e relevo
    c.strokeStyle = brassCol;
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(-2.4, -1.2 + bob); c.lineTo(2.4, 0.8 + bob);
    c.moveTo(2.4, -1.2 + bob); c.lineTo(-2.4, 0.8 + bob);
    c.moveTo(-2.4, 1.8 + bob);  c.lineTo(2.4, 3.8 + bob);
    c.moveTo(2.4, 1.8 + bob);  c.lineTo(-2.4, 3.8 + bob);
    c.stroke();

    // Ilhoses circulares de latão
    c.fillStyle = brassBright;
    c.fillRect(-2.8, -1.6 + bob, 1.0, 1.0);
    c.fillRect(2.0, -1.6 + bob, 1.0, 1.0);
    c.fillRect(-2.8, 1.4 + bob, 1.0, 1.0);
    c.fillRect(2.0, 1.4 + bob, 1.0, 1.0);

    // =========================================================================
    // 7. BANDOLEIRA COM TRÍADE DE AMPOLAS QUÍMICAS DISTINTAS
    // =========================================================================
    c.strokeStyle = '#3d271d';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-6.0, -4.5 + bob);
    c.lineTo(5.0, 4.5 + bob);
    c.stroke();
    c.strokeStyle = leatherStitch;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-5.8, -4.8 + bob);
    c.lineTo(4.8, 4.2 + bob);
    c.stroke();

    // Ampola 1: Reagente Ácido Esmeralda (Verde Neon)
    c.fillStyle = acidBase;
    c.fillRect(-4.5, -3.5 + bob, 2.2, 3.8);
    c.fillStyle = '#ffffff';
    c.fillRect(-4.1, -3.1 + bob, 0.6, 2.8);
    c.fillStyle = '#8b5a2b';
    c.fillRect(-4.7, -4.5 + bob, 2.6, 1.2);
    c.strokeStyle = brassCol;
    c.lineWidth = 0.8;
    c.strokeRect(-4.5, -3.5 + bob, 2.2, 3.8);

    // Ampola 2: Elixir Mutagênico Volátil (Violeta Fluorescente)
    c.fillStyle = reagentPurple;
    c.fillRect(-1.5, -1.0 + bob, 2.2, 3.8);
    c.fillStyle = '#ffffff';
    c.fillRect(-1.1, -0.6 + bob, 0.6, 2.8);
    c.fillStyle = '#8b5a2b';
    c.fillRect(-1.7, -2.0 + bob, 2.6, 1.2);
    c.strokeStyle = brassCol;
    c.lineWidth = 0.8;
    c.strokeRect(-1.5, -1.0 + bob, 2.2, 3.8);

    // Ampola 3: Catalisador Volátil (Âmbar / Fogo Líquido)
    c.fillStyle = reagentAmber;
    c.fillRect(1.5, 1.5 + bob, 2.2, 3.6);
    c.fillStyle = '#ffffff';
    c.fillRect(1.9, 1.9 + bob, 0.6, 2.6);
    c.fillStyle = '#8b5a2b';
    c.fillRect(1.3, 0.5 + bob, 2.6, 1.2);
    c.strokeStyle = brassCol;
    c.lineWidth = 0.8;
    c.strokeRect(1.5, 1.5 + bob, 2.2, 3.6);

    // Cinturão utilitário com fivela de latão chanfrada
    c.fillStyle = leatherDark;
    c.fillRect(-6.5, 4.5 + bob, 13.0, 3.4);
    c.fillStyle = brassCol;
    c.fillRect(-2.5, 4.0 + bob, 5.0, 4.4);
    c.fillStyle = trimGold;
    c.fillRect(-1.2, 5.0 + bob, 2.4, 2.4);
    c.fillStyle = brassGlint;
    c.fillRect(-2.0, 4.2 + bob, 1.0, 1.0);

    // Frasco esférico pendente no quadril com menisco e lacre
    c.fillStyle = acidBase;
    c.beginPath();
    c.arc(5.2, 6.2 + bob, 2.5, 0, Math.PI * 2);
    c.fill();
    // Brilho curvo no vidro esférico
    c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(4.6, 5.6 + bob, 1.4, -Math.PI * 0.7, 0);
    c.stroke();
    // Suporte e rolha de cortiça
    c.fillStyle = brassCol;
    c.fillRect(4.2, 3.5 + bob, 2.0, 1.3);
    c.fillStyle = '#8b5a2b';
    c.fillRect(4.4, 2.5 + bob, 1.6, 1.2);

    // =========================================================================
    // 8. CABEÇA, ROSTO EXPRESSIVO, OLHOS DE JADE E RESPIRADOR
    // =========================================================================
    // Respirador / Gola Alta de Couro Cirúrgico (Abaixo do queixo)
    c.fillStyle = '#242d34';
    c.beginPath();
    c.moveTo(-4.5, -4.5 + bob);
    c.lineTo(4.5, -4.5 + bob);
    c.lineTo(3.5, -1.5 + bob);
    c.lineTo(-3.5, -1.5 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = brassCol;
    c.lineWidth = 1.0;
    c.stroke();

    // Filtro duplo de latão estriado na lateral do respirador
    c.fillStyle = brassCol;
    c.fillRect(-5.2, -4.0 + bob, 1.8, 2.4);
    c.fillStyle = brassBright;
    c.fillRect(-5.0, -3.3 + bob, 1.4, 0.8);
    c.fillStyle = copperCol;
    c.fillRect(-5.2, -2.6 + bob, 1.8, 0.5);

    // Cabeça / Rosto feminino delicado
    c.fillStyle = skinTone;
    c.beginPath();
    c.arc(0.5, -9.5 + bob, 5.8, 0, Math.PI * 2);
    c.fill();

    // Sombra de contorno mandibular delicada
    c.fillStyle = skinShadow;
    c.beginPath();
    c.arc(0.5, -9.5 + bob, 5.8, Math.PI * 0.3, Math.PI * 0.7);
    c.fill();

    // OLHO VIVO, NÍTIDO E EXPRESSIVO (Brilho especular duplo de jade)
    c.fillStyle = '#141e1b';
    c.fillRect(2.0, -10.6 + bob, 3.4, 2.4);
    // Íris esmeralda/jade luminescente
    c.fillStyle = eyeCol;
    c.fillRect(2.6, -10.3 + bob, 2.2, 1.8);
    // Ponto duplo de brilho especular branco
    c.fillStyle = '#ffffff';
    c.fillRect(3.8, -10.1 + bob, 0.9, 0.9);
    c.fillRect(2.8, -9.5 + bob, 0.5, 0.5);

    // Sobrancelha fina e elegante arqueada
    c.strokeStyle = hairBase;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(1.6, -11.8 + bob);
    c.lineTo(5.5, -10.6 + bob);
    c.stroke();

    // =========================================================================
    // 9. ÓCULOS DE ALQUIMIA STEAMPUNK (GOGGLES NA TESTA COM REFRAÇÃO DE CRISTAL)
    // =========================================================================
    // Correia de couro envolvendo a cabeça com fivela
    c.strokeStyle = '#3d271d';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0.5, -13.5 + bob);
    c.lineTo(-5.5, -12.5 + bob);
    c.stroke();
    c.fillStyle = brassBright;
    c.fillRect(-4.5, -13.5 + bob, 1.2, 1.5);

    // Armações duplas circulares de latão posicionadas na testa
    c.fillStyle = brassCol;
    c.beginPath();
    c.arc(2.6, -14.2 + bob, 2.7, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(-1.6, -14.2 + bob, 2.4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = brassDark;
    c.lineWidth = 0.8;
    c.stroke();

    // Ponte de latão entre as lentes
    c.fillStyle = brassBright;
    c.fillRect(0.2, -14.8 + bob, 1.5, 1.3);

    // Lentes convexas de cristal jade brilhante
    c.fillStyle = lensCol;
    c.beginPath();
    c.arc(2.6, -14.2 + bob, 1.9, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(-1.6, -14.2 + bob, 1.6, 0, Math.PI * 2);
    c.fill();

    // Reflexo de luz branco cruzado (simulando refração vítrea esférica)
    c.strokeStyle = '#ffffff';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(1.9, -15.2 + bob); c.lineTo(3.3, -13.8 + bob);
    c.moveTo(-2.2, -15.1 + bob); c.lineTo(-1.0, -13.9 + bob);
    c.stroke();
    c.fillStyle = '#ffffff';
    c.fillRect(3.1, -14.8 + bob, 0.7, 0.7);
    c.fillRect(-1.2, -14.8 + bob, 0.6, 0.6);

    // =========================================================================
    // 10. CABELOS ROXOS E TRANÇA LONGA COM ANÉIS DOURADOS
    // =========================================================================
    // Calota superior do cabelo em 3 tons
    c.fillStyle = hairBase;
    c.beginPath();
    c.arc(0, -11.5 + bob, 6.0, Math.PI * 0.95, Math.PI * 1.95);
    c.fill();

    // Mecha lateral suave atrás da orelha
    c.fillStyle = hairMid;
    c.beginPath();
    c.moveTo(-4.5, -12.0 + bob);
    c.quadraticCurveTo(-3.0, -8.0 + bob, -4.5, -5.0 + bob);
    c.lineTo(-2.0, -5.0 + bob);
    c.quadraticCurveTo(-1.0, -8.0 + bob, -2.5, -12.0 + bob);
    c.closePath();
    c.fill();

    // Presilha de latão ornamentada prendendo o rabo de cavalo
    c.fillStyle = brassBright;
    c.fillRect(-6.5, -13.5 + bob, 3.4, 3.2);
    c.fillStyle = trimGold;
    c.fillRect(-5.9, -12.9 + bob, 2.2, 2.0);
    c.fillStyle = brassGlint;
    c.fillRect(-6.2, -13.2 + bob, 0.8, 0.8);

    // Trança longa com ondulação fluida drapeada para trás
    const wave1 = hairSway;
    const wave2 = Math.sin(tFrame * 0.1 + (isMoving ? walkCycle : 0)) * 3.5;

    c.fillStyle = hairBase;
    c.beginPath();
    c.moveTo(-5.5, -13.0 + bob);
    c.quadraticCurveTo(-12 - wave1 * 0.7, -14 + bob, -16 - Math.abs(wave1 * 1.0), -6 + bob + wave1 * 0.6);
    c.quadraticCurveTo(-14 - wave2 * 0.8, 3 + bob, -20 - Math.abs(wave2 * 1.2), 8 + bob + wave2);
    c.quadraticCurveTo(-12 - wave1 * 0.5, 0 + bob, -5.5, -10.0 + bob);
    c.closePath();
    c.fill();

    // Mechas claras sobrepostas
    c.fillStyle = hairMid;
    c.beginPath();
    c.moveTo(-5.5, -12.0 + bob);
    c.quadraticCurveTo(-11 - wave1 * 0.6, -12 + bob, -15 - Math.abs(wave1 * 0.8), -5 + bob + wave1 * 0.5);
    c.quadraticCurveTo(-10 - wave1 * 0.4, -6 + bob, -5.5, -10.5 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = hairHigh;
    c.fillRect(-10.5 - wave1 * 0.5, -9.0 + bob + wave1 * 0.3, 2.0, 1.0);
    c.fillRect(-15.5 - wave2 * 0.6, 1.5 + bob + wave2 * 0.4, 2.0, 1.0);

    // Múltiplos anéis de latão ao longo da trança
    c.fillStyle = brassBright;
    c.fillRect(-11.5 - wave1 * 0.5, -10.0 + bob + wave1 * 0.3, 2.4, 2.4);
    c.fillRect(-16.5 - wave2 * 0.6, 0.5 + bob + wave2 * 0.4, 2.4, 2.4);
    c.fillRect(-19.5 - wave2 * 0.8, 6.5 + bob + wave2 * 0.8, 2.2, 2.2);
    c.fillStyle = brassGlint;
    c.fillRect(-11.0 - wave1 * 0.5, -9.8 + bob + wave1 * 0.3, 0.8, 0.8);
    c.fillRect(-16.0 - wave2 * 0.6, 0.7 + bob + wave2 * 0.4, 0.8, 0.8);

    // =========================================================================
    // 11. BRAÇO DIANTEIRO E POSTURAS DE COMBATE (FRASCO ERLENMEYER & ARREMESSO)
    // =========================================================================
    if (isThrowing) {
      // POSTURA DE ARREMESSO VOLÁTIL
      c.save();
      c.fillStyle = coatCol;
      c.fillRect(2, -4 + bob, 9, 4.5);
      c.fillStyle = leatherCol;
      c.fillRect(8, -4.5 + bob, 4.5, 5.0);
      c.fillStyle = brassCol;
      c.fillRect(10, -4.2 + bob, 2.5, 1.8);

      // Frasco projetado à frente em trajetória balística
      c.save();
      c.translate(15, -4 + bob);
      c.rotate(0.35);

      c.fillStyle = 'rgba(155, 89, 182, 0.45)';
      c.beginPath();
      c.arc(0, 0, 7.5, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = 'rgba(240, 255, 250, 0.90)';
      c.beginPath();
      c.moveTo(-1.6, -4.5); c.lineTo(1.6, -4.5);
      c.lineTo(4.8, 4.2);   c.lineTo(-4.8, 4.2);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      c.lineWidth = 1.0;
      c.stroke();

      c.fillStyle = acidBase;
      c.beginPath();
      c.moveTo(-3.6, 0); c.lineTo(3.6, 0);
      c.lineTo(4.2, 3.8); c.lineTo(-4.2, 3.8);
      c.closePath();
      c.fill();

      // Reflexo curvo no frasco arremessado
      c.strokeStyle = '#ffffff';
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(-3.2, 0.5); c.lineTo(-4.0, 3.4);
      c.stroke();

      c.fillStyle = '#8b5a2b';
      c.fillRect(-1.6, -6.0, 3.2, 1.8);
      c.restore();

      // Fagulhas e respingos químicos no arremesso
      c.fillStyle = acidGlow;
      c.beginPath();
      c.arc(17, -8 + bob, 1.3, 0, Math.PI * 2);
      c.arc(19, -2 + bob, 1.6, 0, Math.PI * 2);
      c.arc(14, 2 + bob, 1.1, 0, Math.PI * 2);
      c.fill();
      c.restore();
    } else if (isOvercharged) {
      // POSTURA DE HABILIDADE (REAGENTE VOLÁTIL ENERGIZADO)
      c.fillStyle = coatCol;
      c.fillRect(3, -5 + bob, 7, 4.2);
      c.fillStyle = leatherCol;
      c.fillRect(8, -6 + bob, 4.5, 4.5);
      c.fillStyle = brassCol;
      c.fillRect(9.5, -5.8 + bob, 2.4, 1.5);

      // Frasco suspenso energizado com sobrepressão e aura pulsante
      c.save();
      c.translate(13, -8 + bob);
      const auraPulse = Math.sin(tFrame * 0.3) * 3;
      c.fillStyle = 'rgba(214, 162, 232, 0.50)';
      c.beginPath();
      c.arc(0, 0, 8.5 + auraPulse, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = 'rgba(255, 255, 255, 0.92)';
      c.beginPath();
      c.moveTo(-2.2, -5.2); c.lineTo(2.2, -5.2);
      c.lineTo(5.8, 5.2); c.lineTo(-5.8, 5.2);
      c.closePath();
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.0;
      c.stroke();

      c.fillStyle = acidGlow;
      c.beginPath();
      c.moveTo(-4.6, -1.0); c.lineTo(4.6, -1.0);
      c.lineTo(5.2, 4.8); c.lineTo(-5.2, 4.8);
      c.closePath();
      c.fill();
      c.restore();
    } else {
      // POSTURA NORMAL: Mão empunhando o frasco Erlenmeyer com firmeza
      c.fillStyle = coatCol;
      c.fillRect(3.0, -3 + bob, 4.5, 7.0);
      c.fillStyle = leatherCol;
      c.fillRect(3.0, 2.5 + bob, 4.5, 3.5);
      c.fillStyle = brassCol;
      c.fillRect(3.5, 3.0 + bob, 2.2, 1.6);
      c.fillStyle = brassGlint;
      c.fillRect(3.8, 3.2 + bob, 0.8, 0.8);

      // Frasco Erlenmeyer Lapidado na Mão
      c.save();
      c.translate(6.5, 5.5 + bob);

      // Vidro exterior com transparência e brilho
      c.fillStyle = 'rgba(240, 255, 250, 0.88)';
      c.beginPath();
      c.moveTo(-2.2, -5.2);
      c.lineTo(2.2, -5.2);
      c.lineTo(5.4, 5.0);
      c.lineTo(-5.4, 5.0);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      c.lineWidth = 1.1;
      c.stroke();

      // Gargalo de latão e rolha de cortiça
      c.fillStyle = brassCol;
      c.fillRect(-2.3, -4.6, 4.6, 1.5);
      c.fillStyle = '#8b5a2b';
      c.fillRect(-1.7, -6.6, 3.4, 2.2);

      // Líquido Ácido no interior (slosh dinâmico)
      const fSlosh = Math.sin(tFrame * 0.12) * 0.8;
      c.fillStyle = acidBase;
      c.beginPath();
      c.moveTo(-3.6, 0.5 + fSlosh);
      c.lineTo(3.6, 0.5 - fSlosh);
      c.lineTo(4.6, 4.4);
      c.lineTo(-4.6, 4.4);
      c.closePath();
      c.fill();

      // Menisco luminoso do líquido no frasco
      c.strokeStyle = acidGlow;
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(-3.6, 0.5 + fSlosh);
      c.lineTo(3.6, 0.5 - fSlosh);
      c.stroke();

      // Reflexo vítreo curvo chanfrado
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(-3.3, 1.0);
      c.lineTo(-4.4, 4.0);
      c.stroke();

      // Fumaça sutil subindo da rolha
      const vaporY = -7.5 - ((tFrame * 0.15) % 4);
      c.fillStyle = 'rgba(214, 162, 232, 0.50)';
      c.beginPath();
      c.arc(0, vaporY, 1.0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  } else if (heroKey === 'MAGE') {
    // isDashing handled via state
    // isCasting handled via state
    const cCol = charDef.color || {};
    const robeBase = cCol.robe || '#19141e';
    const robeDark = cCol.robeDark || '#0f0c13';
    const robeHigh = cCol.robeHighlight || '#2e2436';
    const robeIn = cCol.robeInner || '#9b111e';
    const corsetCol = cCol.corset || '#2c111c';
    const goldTrim = cCol.trimGold || '#f1c40f';
    const goldLight = cCol.trimGoldLight || '#ffeaa7';
    const sashCol = cCol.sash || '#e67e22';
    const sashGold = cCol.sashGold || '#f39c12';
    const rubyCol = cCol.amuletRuby || '#ff4757';
    const rubyGlow = cCol.amuletGlow || 'rgba(255, 71, 87, 0.6)';
    const skinCol = cCol.skin || '#fbe4d8';
    const skinShadow = cCol.skinShadow || '#e0b8a4';
    const hairDark = cCol.hairDark || '#781a0e';
    const hairMid = cCol.hairMid || '#c0392b';
    const hairLight = cCol.hairLight || '#e67e22';
    const hairHighlight = cCol.hairHighlight || '#f39c12';
    const eyeSpark = cCol.eyeGlow || '#ffffff';
    const eyeFlame = cCol.eyeFlame || '#f39c12';
    const flameRoot = cCol.flameRoot || '#b33939';
    const flameMid = cCol.flameMid || '#e67e22';
    const flameBright = cCol.flameBright || '#f1c40f';
    const flameTip = cCol.flameTip || '#ffffff';
    const orbCore = cCol.orbCore || '#ffffff';
    const orbGlow = cCol.orbGlow || 'rgba(243, 156, 18, 0.65)';
    const staffWood = cCol.staffWood || '#1c1417';
    const staffGold = cCol.staffGold || '#f1c40f';
    const crystalCol = cCol.crystal || '#ff4757';
    const coronaCol = cCol.staffCorona || '#f39c12';

    // --- ULT: Pós-Imagens Térmicas, Asas Espectrais de Fênix e Jato de Fogo ---
    if (isDashing) {
      c.save();
      // Jato de plasma e esteira de fogo propulsora
      const jetWave = Math.sin(tFrame * 0.6) * 3;
      c.fillStyle = 'rgba(231, 76, 60, 0.45)';
      c.beginPath();
      c.moveTo(-6, -4 + bob);
      c.quadraticCurveTo(-22, -8 + jetWave, -38, bob + jetWave);
      c.quadraticCurveTo(-22, 6 + jetWave, -6, 8 + bob);
      c.closePath();
      c.fill();

      c.fillStyle = 'rgba(241, 196, 15, 0.65)';
      c.beginPath();
      c.moveTo(-5, -2 + bob);
      c.quadraticCurveTo(-16, -4 + jetWave * 0.7, -26, bob + jetWave * 0.5);
      c.quadraticCurveTo(-16, 4 + jetWave * 0.7, -5, 5 + bob);
      c.closePath();
      c.fill();

      // Fantasmas térmicos com decaimento cromático e labaredas
      const ghostColors = [
        'rgba(255, 255, 255, 0.55)',
        'rgba(241, 196, 15, 0.45)',
        'rgba(230, 126, 34, 0.32)',
        'rgba(179, 57, 57, 0.18)'
      ];
      for (let g = 0; g < ghostColors.length; g++) {
        const gDist = (g + 1) * 9;
        c.fillStyle = ghostColors[g];
        c.beginPath();
        c.ellipse(-gDist, bob, 11 - g * 1.5, 15 - g * 1.8, 0, 0, Math.PI * 2);
        c.fill();

        // Faíscas desprendidas de cada fantasma térmico
        const gSparkY = bob + Math.sin(tFrame * 0.4 + g * 2) * 8;
        c.fillStyle = g % 2 === 0 ? '#ffffff' : '#f1c40f';
        c.fillRect(-gDist - 4, gSparkY, 1.4, 1.4);
      }

      // Anéis de solo em brasa viva sob os pés
      c.strokeStyle = 'rgba(241, 196, 15, 0.9)';
      c.lineWidth = 2.2;
      c.beginPath();
      c.ellipse(0, 14 + bob, 22, 7, 0, 0, Math.PI * 2);
      c.stroke();

      // Asas Espectrais da Fênix de Plasma
      const wingFlap = Math.sin(tFrame * 0.55) * 6;
      c.fillStyle = 'rgba(241, 196, 15, 0.55)';
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2.2;

      // Asa Posterior
      c.beginPath();
      c.moveTo(-4, -8 + bob);
      c.quadraticCurveTo(-18, -26 + wingFlap, -38, -16 + wingFlap);
      c.lineTo(-24, -6 + wingFlap * 0.5);
      c.lineTo(-32, 5 + wingFlap);
      c.lineTo(-12, 4 + bob);
      c.closePath();
      c.fill();
      c.stroke();

      // Penas de labareda na Asa Posterior
      c.strokeStyle = '#e74c3c';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-16, -14 + wingFlap * 0.6); c.lineTo(-28, -12 + wingFlap);
      c.moveTo(-12, -4 + wingFlap * 0.4); c.lineTo(-22, 1 + wingFlap * 0.8);
      c.stroke();

      // Asa Anterior
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(3, -8 + bob);
      c.quadraticCurveTo(16, -28 + wingFlap, 36, -20 + wingFlap);
      c.lineTo(25, -7 + wingFlap * 0.5);
      c.lineTo(31, 3 + wingFlap);
      c.lineTo(10, 3 + bob);
      c.closePath();
      c.fill();
      c.stroke();

      // Penas de labareda na Asa Anterior
      c.strokeStyle = '#e74c3c';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(14, -15 + wingFlap * 0.6); c.lineTo(26, -15 + wingFlap);
      c.moveTo(12, -4 + wingFlap * 0.4); c.lineTo(22, 0 + wingFlap * 0.8);
      c.stroke();

      c.restore();
    }

    // 0. ORBE DE PLASMA SOLAR POSTERIOR (PYROSPHERE ESQUERDA) COM RASTRO DE FOGO
    const orb1Y = -12 + bob + Math.sin(tFrame * 0.08) * 2.8;
    const orb1X = -13 + Math.cos(tFrame * 0.07) * 2.0;
    c.save();

    // Rastro de fogo vivo / cauda de plasma na pyrosphere 1
    const o1TailLen = isDashing ? 12 : (isMoving ? 8 : 5);
    const o1Angle = isDashing ? Math.PI : (isMoving ? Math.PI * 0.85 : -Math.PI * 0.5 + Math.sin(tFrame * 0.15) * 0.35);
    const o1TailTipX = orb1X + Math.cos(o1Angle) * o1TailLen;
    const o1TailTipY = orb1Y + Math.sin(o1Angle) * o1TailLen;

    // Cauda externa carmesim
    c.fillStyle = 'rgba(231, 76, 60, 0.65)';
    c.beginPath();
    c.moveTo(orb1X - 2.5, orb1Y);
    c.quadraticCurveTo(orb1X + Math.cos(o1Angle) * (o1TailLen * 0.5), orb1Y + Math.sin(o1Angle) * (o1TailLen * 0.5), o1TailTipX, o1TailTipY);
    c.quadraticCurveTo(orb1X, orb1Y + 2.5, orb1X + 2.5, orb1Y);
    c.closePath();
    c.fill();

    // Cauda interna dourada
    c.fillStyle = 'rgba(241, 196, 15, 0.85)';
    c.beginPath();
    c.moveTo(orb1X - 1.4, orb1Y);
    c.quadraticCurveTo(orb1X + Math.cos(o1Angle) * (o1TailLen * 0.4), orb1Y + Math.sin(o1Angle) * (o1TailLen * 0.4), o1TailTipX * 0.7 + orb1X * 0.3, o1TailTipY * 0.7 + orb1Y * 0.3);
    c.quadraticCurveTo(orb1X, orb1Y + 1.4, orb1X + 1.4, orb1Y);
    c.closePath();
    c.fill();

    // Fagulhas que se desprendem da cauda do orbe 1
    const o1SparkProg = ((tFrame * 0.4) % 6) / 6;
    const o1SparkX = o1TailTipX + Math.cos(o1Angle) * (o1SparkProg * 4) + Math.sin(tFrame * 0.3) * 1.2;
    const o1SparkY = o1TailTipY + Math.sin(o1Angle) * (o1SparkProg * 4) - o1SparkProg * 3;
    c.fillStyle = '#ffffff';
    c.fillRect(o1SparkX, o1SparkY, 1.2, 1.2);

    // Núcleo do orbe 1
    c.fillStyle = orbGlow;
    c.beginPath();
    c.arc(orb1X, orb1Y, 4.4 + Math.sin(tFrame * 0.2) * 0.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = flameMid;
    c.beginPath();
    c.arc(orb1X, orb1Y, 2.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = orbCore;
    c.beginPath();
    c.arc(orb1X - 0.4, orb1Y - 0.4, 1.3, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 1. MANTO IMPERIAL DA FÊNIX (CAPA DUPLA DE OBSIDIANA & CARMESIM COM BORDAS DE BRASA)
    // Forro interno carmesim incandescente
    c.fillStyle = robeIn;
    c.beginPath();
    c.moveTo(-4, -2 + bob);
    c.lineTo(-16 - Math.abs(capeWave * 1.2), 17 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.7), 12 + bob);
    c.lineTo(-13 - Math.abs(capeWave * 1.1), 19 + bob);
    c.lineTo(-2, 16 + bob);
    c.lineTo(2, -2 + bob);
    c.closePath();
    c.fill();

    // Camada externa nobre de seda vulcânica obsidiana
    c.fillStyle = robeBase;
    c.beginPath();
    c.moveTo(-4, -3 + bob);
    c.lineTo(-14 - Math.abs(capeWave * 1.0), 15 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.6), 11 + bob);
    c.lineTo(-11 - Math.abs(capeWave * 0.9), 17 + bob);
    c.lineTo(-1, 15 + bob);
    c.lineTo(3, -3 + bob);
    c.closePath();
    c.fill();

    // Sombreamento de dobras na capa
    c.strokeStyle = robeDark;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-3, -1 + bob);
    c.lineTo(-7 - Math.abs(capeWave * 0.7), 13 + bob);
    c.stroke();

    // Brocado de ouro solar na orla da capa
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.3;
    c.stroke();

    // Linha fina de ouro brilhante
    c.strokeStyle = goldLight;
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-13.5 - Math.abs(capeWave * 1.0), 14.5 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.6), 10.5 + bob);
    c.lineTo(-10.5 - Math.abs(capeWave * 0.9), 16.5 + bob);
    c.stroke();

    // Brasas ativas nas pontas da capa chamuscada
    const emberCapY = 16.5 + bob - ((tFrame * 0.25) % 4);
    c.fillStyle = rubyCol;
    c.fillRect(-11 - Math.abs(capeWave * 0.9), 17 + bob, 1.4, 1.4);
    c.fillStyle = flameBright;
    c.fillRect(-11.5 - Math.abs(capeWave * 0.9), emberCapY, 1.0, 1.0);

    // 2. COLDRE DORSAL DO CAJADO DA TORMENTA (Em repouso/preview, recolhe ao conjurar)
    if (!isCasting) {
      c.save();
      c.translate(-2, -3 + bob);
      c.rotate(-0.52);

      // Haste de ébano petrificado com espiral de ouro solar
      c.fillStyle = staffWood;
      c.fillRect(-1.8, -14, 3.6, 38);
      c.strokeStyle = goldTrim;
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(-1.8, -4); c.lineTo(1.8, -1);
      c.moveTo(-1.8, 6);  c.lineTo(1.8, 9);
      c.moveTo(-1.8, 16); c.lineTo(1.8, 19);
      c.stroke();

      // Ponteira inferior de ouro batido com anéis
      c.fillStyle = staffGold;
      c.fillRect(-2.4, 23, 4.8, 3.5);
      c.fillStyle = goldLight;
      c.fillRect(-1.2, 23.5, 2.4, 1.2);

      // Coroa com garras de ouro da fênix segurando o micro-sol
      c.fillStyle = staffGold;
      c.beginPath();
      c.moveTo(-5.5, -13);
      c.lineTo(5.5, -13);
      c.lineTo(4.5, -19);
      c.lineTo(1.0, -15);
      c.lineTo(0, -17);
      c.lineTo(-1.0, -15);
      c.lineTo(-4.5, -19);
      c.closePath();
      c.fill();
      c.strokeStyle = goldLight;
      c.lineWidth = 0.8;
      c.stroke();

      // MICRO-SOL FLUTUANTE NO NÚCLEO DO CAJADO
      const sunPulse = Math.sin(tFrame * 0.2) * 0.6;
      // Corona de calor externa
      c.fillStyle = coronaCol;
      c.beginPath();
      c.arc(0, -19.5, 4.8 + sunPulse, 0, Math.PI * 2);
      c.fill();

      // Núcleo rubi solar
      c.fillStyle = crystalCol;
      c.beginPath();
      c.arc(0, -19.5, 3.2, 0, Math.PI * 2);
      c.fill();

      // Ponto de fusão solar branca no núcleo
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(-0.8, -20.3, 1.4, 0, Math.PI * 2);
      c.fill();

      // Anel orbital dourado inclinado
      c.strokeStyle = goldLight;
      c.lineWidth = 0.9;
      c.beginPath();
      c.ellipse(0, -19.5, 6.0, 1.8, -0.4, 0, Math.PI * 2);
      c.stroke();

      c.restore();
    }

    // 3. PERNAS & BOTAS ARCANAS DE BATALHA
    const legLeftX = -5.5 - legSwing * 0.35;
    const legRightX = 1.2 + legSwing * 0.35;

    // Sombra das pernas sob o manto
    c.fillStyle = robeDark;
    c.fillRect(legLeftX, 6 + bob, 4.2, 7.5);
    c.fillRect(legRightX, 6 + bob, 4.2, 7.5);

    // Botas pontiagudas de couro nobre
    c.fillStyle = '#1c1417';
    c.fillRect(legLeftX - 0.8, 11 + bob, 5.4, 4.5);
    c.fillRect(legRightX - 0.8, 11 + bob, 5.4, 4.5);

    // Punhos de cano das botas em ouro solar
    c.fillStyle = goldTrim;
    c.fillRect(legLeftX - 0.5, 10.5 + bob, 4.8, 1.6);
    c.fillRect(legRightX - 0.5, 10.5 + bob, 4.8, 1.6);
    c.fillStyle = goldLight;
    c.fillRect(legLeftX, 10.8 + bob, 2.0, 0.8);
    c.fillRect(legRightX, 10.8 + bob, 2.0, 0.8);

    // Bico curvado das botas com placa dourada
    c.fillStyle = goldTrim;
    c.fillRect(legLeftX + 3.0, 13.8 + bob, 1.8, 1.4);
    c.fillRect(legRightX + 3.0, 13.8 + bob, 1.8, 1.4);

    // 4. TRONCO COM TÚNICA DRAPEADA, CORSELETE & FAIXA DE SEDA SOLAR
    // Túnica base de obsidiana
    c.fillStyle = robeBase;
    c.beginPath();
    c.moveTo(-7.5, -5 + bob);
    c.lineTo(7.5, -5 + bob);
    c.lineTo(5.5, 8 + bob);
    c.lineTo(-5.5, 8 + bob);
    c.closePath();
    c.fill();

    // Sombra de drapeado lateral
    c.fillStyle = robeDark;
    c.beginPath();
    c.moveTo(-7.5, -5 + bob);
    c.lineTo(-5.0, -5 + bob);
    c.lineTo(-4.0, 8 + bob);
    c.lineTo(-5.5, 8 + bob);
    c.closePath();
    c.fill();

    // Friso de luz no veludo
    c.fillStyle = robeHigh;
    c.fillRect(-2, -4 + bob, 4, 11);

    // Corselete escuro com debrum e amarração nobre
    c.fillStyle = corsetCol;
    c.beginPath();
    c.moveTo(-5.5, -4 + bob);
    c.lineTo(5.5, -4 + bob);
    c.lineTo(4.2, 5 + bob);
    c.lineTo(-4.2, 5 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 0.9;
    c.stroke();

    // AMULETO "CORAÇÃO DE MAGMA" NO PEITO
    const amuletPulse = Math.sin(tFrame * 0.15) * 0.3 + 0.7;
    // Halo vermelho-solar emitido pelo amuleto
    c.fillStyle = rubyGlow;
    c.beginPath();
    c.arc(0, -1.0 + bob, 4.5 * amuletPulse, 0, Math.PI * 2);
    c.fill();

    // Suporte dourado do amuleto
    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(0, -3.2 + bob);
    c.lineTo(2.2, -1.0 + bob);
    c.lineTo(0, 1.2 + bob);
    c.lineTo(-2.2, -1.0 + bob);
    c.closePath();
    c.fill();

    // Gema rubi incandescente
    c.fillStyle = rubyCol;
    c.beginPath();
    c.moveTo(0, -2.5 + bob);
    c.lineTo(1.5, -1.0 + bob);
    c.lineTo(0, 0.5 + bob);
    c.lineTo(-1.5, -1.0 + bob);
    c.closePath();
    c.fill();
    c.fillStyle = '#ffffff';
    c.fillRect(-0.4, -1.6 + bob, 0.8, 0.8);

    // Faixa de seda solar (Obi Arcano) com laço e fitas rituais
    c.fillStyle = sashCol;
    c.fillRect(-6, 4.5 + bob, 12, 3.2);

    // Fitas cerimoniais pendentes gravadas com runas solares
    c.fillStyle = sashCol;
    c.beginPath();
    c.moveTo(-2.5, 6.5 + bob);
    c.lineTo(1.5, 6.5 + bob);
    c.lineTo(1.0, 14.5 + bob);
    c.lineTo(-0.5, 16.0 + bob);
    c.lineTo(-2.0, 14.5 + bob);
    c.closePath();
    c.fill();

    // Runa bordada em ouro na fita cerimonial
    c.fillStyle = sashGold;
    c.fillRect(-1.4, 8.5 + bob, 1.8, 4.0);
    c.fillRect(-2.0, 9.8 + bob, 3.0, 1.2);

    // Fivela de sol dourado no cinto
    c.fillStyle = goldTrim;
    c.fillRect(-2.6, 4.0 + bob, 5.2, 4.0);
    c.fillStyle = goldLight;
    c.fillRect(-1.2, 4.8 + bob, 2.4, 2.4);
    c.fillStyle = rubyCol;
    c.fillRect(-0.6, 5.4 + bob, 1.2, 1.2);

    // 5. CABELO DE FOGO VIVO POSTERIOR (MANTO FLAMEJANTE TRASEIRO)
    // Cabelos de fogo fluido saindo de sob o capuz e descendo pelas costas
    const flameSway = isMoving ? Math.sin(walkCycle) * 3.5 : Math.sin(tFrame * 0.12) * 2.0;

    // Mecha base carmesim profunda
    c.fillStyle = flameRoot;
    c.beginPath();
    c.moveTo(-4, -10 + bob);
    c.quadraticCurveTo(-11 - flameSway * 0.7, -6 + bob, -15 - Math.abs(flameSway * 1.0), 0 + bob + flameSway);
    c.quadraticCurveTo(-13 - flameSway * 0.4, 7 + bob, -17 - Math.abs(flameSway * 1.1), 12 + bob + flameSway * 1.2);
    c.quadraticCurveTo(-9 - flameSway * 0.3, 5 + bob, -3, -3 + bob);
    c.closePath();
    c.fill();

    // Mecha média em laranja solar vivo
    c.fillStyle = flameMid;
    c.beginPath();
    c.moveTo(-3.5, -9.5 + bob);
    c.quadraticCurveTo(-9 - flameSway * 0.6, -5 + bob, -12 - Math.abs(flameSway * 0.8), 1 + bob + flameSway * 0.8);
    c.quadraticCurveTo(-10 - flameSway * 0.3, 8 + bob, -14 - Math.abs(flameSway * 0.9), 10 + bob + flameSway);
    c.quadraticCurveTo(-7 - flameSway * 0.2, 4 + bob, -2.5, -4 + bob);
    c.closePath();
    c.fill();

    // Mecha interna de luz dourada
    c.fillStyle = flameBright;
    c.beginPath();
    c.moveTo(-3, -9 + bob);
    c.quadraticCurveTo(-7 - flameSway * 0.5, -3 + bob, -9 - Math.abs(flameSway * 0.6), 3 + bob + flameSway * 0.6);
    c.lineTo(-6, 2 + bob);
    c.closePath();
    c.fill();

    // Fagulhas que se desprendem no ar
    const fSparkY = 9 + bob - ((tFrame * 0.35) % 8);
    c.fillStyle = flameTip;
    c.fillRect(-15 - Math.abs(flameSway * 1.0), 12 + bob + flameSway, 1.8, 1.8);
    c.fillRect(-16 - Math.abs(flameSway * 0.9), fSparkY, 1.2, 1.2);

    // 6. OMBREIRAS ARCANAS EM LEQUE (OBSIDIANA & OURO)
    // Ombreira posterior
    c.fillStyle = robeBase;
    c.beginPath();
    c.moveTo(-7, -5 + bob);
    c.lineTo(-13, -2 + bob);
    c.lineTo(-12, -8 + bob);
    c.lineTo(-6, -6 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.2;
    c.stroke();
    c.fillStyle = goldLight;
    c.fillRect(-11, -7 + bob, 3, 1);

    // Ombreira dianteira
    c.fillStyle = robeBase;
    c.beginPath();
    c.moveTo(5.0, -3.5 + bob);
    c.lineTo(13.0, -1.0 + bob);
    c.lineTo(11.0, -6.5 + bob);
    c.lineTo(4.5, -4.5 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.0;
    c.stroke();
    c.fillStyle = goldLight;
    c.fillRect(7.5, -6.0 + bob, 3.0, 1.0);

    // 7. GOLA ALTA DE ARQUIMAGA & PESCOÇO DE PORCELANA
    // Gola alta de veludo carmesim imperial com debrum dourado atrás do pescoço
    c.fillStyle = robeIn;
    c.beginPath();
    c.moveTo(-4.5, -5.0 + bob);
    c.lineTo(-6.5, -11.0 + bob);
    c.lineTo(-3.5, -7.5 + bob);
    c.lineTo(-2.0, -5.0 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 0.9;
    c.stroke();

    // Base do pescoço
    c.fillStyle = skinCol;
    c.fillRect(-0.8, -6.8 + bob, 3.6, 2.2);
    c.fillStyle = skinShadow;
    c.fillRect(-0.8, -5.6 + bob, 3.6, 1.0);

    // 8. CABELO POSTERIOR FLUIDO & JUBA DE FOGO VIVO
    // Camadas de fogo ondulantes que descem pelas costas sob a gola
    c.fillStyle = flameRoot;
    c.beginPath();
    c.moveTo(-2.5, -12.0 + bob);
    c.quadraticCurveTo(-7.0 - flameSway * 0.5, -10.0 + bob, -11.0 - Math.abs(flameSway * 0.8), -3.0 + bob + flameSway * 0.4);
    c.quadraticCurveTo(-13.0 - flameSway * 0.4, 4.0 + bob, -15.0 - Math.abs(flameSway * 1.0), 9.0 + bob + flameSway);
    c.quadraticCurveTo(-8.0 - flameSway * 0.2, 5.0 + bob, -2.5, -2.0 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = flameMid;
    c.beginPath();
    c.moveTo(-2.0, -11.0 + bob);
    c.quadraticCurveTo(-5.5 - flameSway * 0.4, -9.0 + bob, -9.0 - Math.abs(flameSway * 0.6), -2.0 + bob + flameSway * 0.3);
    c.quadraticCurveTo(-10.0 - flameSway * 0.3, 5.0 + bob, -12.5 - Math.abs(flameSway * 0.8), 8.0 + bob + flameSway);
    c.quadraticCurveTo(-6.5 - flameSway * 0.2, 4.0 + bob, -2.0, -3.0 + bob);
    c.closePath();
    c.fill();

    // 9. CABEÇA E ROSTO FEMININO DELICADO (ESTILO ANIME / FEITICEIRA)
    // Cabeça oval graciosa em tom de porcelana
    c.fillStyle = skinCol;
    c.beginPath();
    c.arc(0.6, -9.5 + bob, 5.6, 0, Math.PI * 2);
    c.fill();

    // Sombra suave 2.5D na mandíbula inferior
    c.fillStyle = skinShadow;
    c.beginPath();
    c.arc(0.6, -9.5 + bob, 5.6, Math.PI * 0.28, Math.PI * 0.72);
    c.fill();

    // Rubor térmico suave nas maçãs do rosto
    c.fillStyle = 'rgba(231, 76, 60, 0.18)';
    c.beginPath();
    c.ellipse(3.2, -8.6 + bob, 1.5, 0.8, 0, 0, Math.PI * 2);
    c.fill();

    // Orelha graciosa
    c.fillStyle = skinCol;
    c.beginPath();
    c.ellipse(-2.5, -9.2 + bob, 1.2, 1.5, -0.15, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = skinShadow;
    c.beginPath();
    c.ellipse(-2.3, -9.2 + bob, 0.6, 0.9, -0.15, 0, Math.PI * 2);
    c.fill();

    // Brinco pendente de rubi com engaste dourado
    c.fillStyle = goldTrim;
    c.fillRect(-2.8, -7.8 + bob, 1.0, 1.2);
    c.fillStyle = rubyCol;
    c.beginPath();
    c.moveTo(-2.3, -6.6 + bob);
    c.lineTo(-1.5, -5.5 + bob);
    c.lineTo(-2.3, -4.4 + bob);
    c.lineTo(-3.1, -5.5 + bob);
    c.closePath();
    c.fill();
    c.fillStyle = '#ffffff';
    c.fillRect(-2.4, -5.8 + bob, 0.6, 0.6);

    // OLHO SOLAR AMENDOADO RADIANTE (ESTILO ANIME / FANTASIA)
    // 1. Esclera branca límpida
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(3.6, -9.8 + bob, 2.0, 1.5, -0.05, 0, Math.PI * 2);
    c.fill();

    // 2. Íris de fogo âmbar/ouro incandescente
    c.fillStyle = '#e67e22';
    c.beginPath();
    c.arc(3.9, -9.8 + bob, 1.3, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#f1c40f';
    c.beginPath();
    c.arc(4.1, -9.8 + bob, 0.75, 0, Math.PI * 2);
    c.fill();

    // 3. Delineado superior e cílios arqueados de feiticeira
    c.strokeStyle = '#140c0a';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(1.6, -10.0 + bob);
    c.quadraticCurveTo(3.6, -11.5 + bob, 5.8, -9.6 + bob);
    c.stroke();

    // 4. Ponto duplo de brilho especular branco puro
    c.fillStyle = '#ffffff';
    c.fillRect(4.1, -10.4 + bob, 0.8, 0.8);
    c.fillRect(3.2, -9.5 + bob, 0.4, 0.4);

    // Sobrancelha fina ruiva arqueada
    c.strokeStyle = hairDark;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(1.8, -12.0 + bob);
    c.quadraticCurveTo(3.6, -13.0 + bob, 5.5, -11.2 + bob);
    c.stroke();

    // Lábio carmesim delicado
    c.fillStyle = '#d63031';
    c.fillRect(3.2, -7.0 + bob, 1.8, 0.8);
    c.fillStyle = '#ff7675';
    c.fillRect(3.8, -7.0 + bob, 0.7, 0.4);

    // 10. CABELO RUIVO VOLUMOSO & FRANJA ELEGANTE
    // Calota superior em ruivo escuro
    c.fillStyle = hairDark;
    c.beginPath();
    c.arc(0.2, -11.5 + bob, 6.2, Math.PI * 0.95, Math.PI * 1.95);
    c.fill();

    // Mecha lateral suave atrás da orelha
    c.fillStyle = hairMid;
    c.beginPath();
    c.moveTo(-4.2, -11.8 + bob);
    c.quadraticCurveTo(-3.0, -8.0 + bob, -4.2, -5.0 + bob);
    c.lineTo(-2.2, -5.0 + bob);
    c.quadraticCurveTo(-1.2, -8.0 + bob, -2.5, -11.8 + bob);
    c.closePath();
    c.fill();

    // Franja repicada da arquimaga (desce graciosa na testa, sem encobrir o olho)
    c.fillStyle = hairMid;
    c.beginPath();
    c.moveTo(-1.2, -14.8 + bob);
    c.quadraticCurveTo(0.0, -13.2 + bob, 0.8, -12.4 + bob);
    c.lineTo(1.5, -14.0 + bob);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(1.2, -15.0 + bob);
    c.quadraticCurveTo(2.2, -13.5 + bob, 2.8, -12.5 + bob);
    c.quadraticCurveTo(3.2, -13.6 + bob, 3.8, -14.5 + bob);
    c.closePath();
    c.fill();

    // Fio de luz solar acobreado na franja
    c.strokeStyle = hairLight;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(1.6, -14.5 + bob);
    c.lineTo(2.6, -12.8 + bob);
    c.stroke();
    c.fillStyle = hairHighlight;
    c.fillRect(2.0, -13.6 + bob, 0.8, 0.8);

    // 11. DIADEMA SOLAR DE FEITICEIRA (TIARA DE OURO E RUBI)
    // Diadema gracioso coroando o alto da cabeça
    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(-0.5, -15.0 + bob);
    c.lineTo(1.8, -16.8 + bob);
    c.lineTo(4.0, -15.2 + bob);
    c.lineTo(3.4, -14.4 + bob);
    c.lineTo(1.8, -15.8 + bob);
    c.lineTo(0.0, -14.4 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldLight;
    c.lineWidth = 0.5;
    c.stroke();

    // Gema rubi lapidada incandescente no centro da tiara
    c.fillStyle = rubyCol;
    c.beginPath();
    c.moveTo(1.8, -17.2 + bob);
    c.lineTo(2.5, -16.2 + bob);
    c.lineTo(1.8, -15.2 + bob);
    c.lineTo(1.1, -16.2 + bob);
    c.closePath();
    c.fill();
    c.fillStyle = '#ffffff';
    c.fillRect(1.6, -16.6 + bob, 0.6, 0.6);

    // 12. PARTÍCULAS E BRASAS ELEMENTAIS TRASEIRAS
    const fSparkY2 = 9 + bob - (((tFrame + 10) * 0.35) % 8);
    c.fillStyle = flameTip;
    c.fillRect(-14 - Math.abs(flameSway * 1.0), 10 + bob + flameSway, 1.5, 1.5);
    c.fillRect(-15 - Math.abs(flameSway * 0.9), fSparkY2, 1.0, 1.0);

    // 13. ORBE DE PLASMA SOLAR ANTERIOR (PYROSPHERE DIREITA) COM RASTRO DE FOGO
    // Desenhado à frente do ombro para criar profundidade 3D
    const orb2Y = -14 + bob + Math.sin(tFrame * 0.08 + Math.PI) * 2.8;
    const orb2X = 13 + Math.cos(tFrame * 0.07 + Math.PI) * 2.0;
    c.save();

    // Rastro de fogo vivo / cauda de plasma na pyrosphere 2
    const o2TailLen = isDashing ? 13 : (isMoving ? 8.5 : 5.5);
    const o2Angle = isDashing ? Math.PI : (isMoving ? Math.PI * 0.82 : -Math.PI * 0.5 + Math.sin(tFrame * 0.15 + 2) * 0.35);
    const o2TailTipX = orb2X + Math.cos(o2Angle) * o2TailLen;
    const o2TailTipY = orb2Y + Math.sin(o2Angle) * o2TailLen;

    // Cauda externa carmesim
    c.fillStyle = 'rgba(231, 76, 60, 0.65)';
    c.beginPath();
    c.moveTo(orb2X - 2.5, orb2Y);
    c.quadraticCurveTo(orb2X + Math.cos(o2Angle) * (o2TailLen * 0.5), orb2Y + Math.sin(o2Angle) * (o2TailLen * 0.5), o2TailTipX, o2TailTipY);
    c.quadraticCurveTo(orb2X, orb2Y + 2.5, orb2X + 2.5, orb2Y);
    c.closePath();
    c.fill();

    // Cauda interna dourada
    c.fillStyle = 'rgba(241, 196, 15, 0.85)';
    c.beginPath();
    c.moveTo(orb2X - 1.4, orb2Y);
    c.quadraticCurveTo(orb2X + Math.cos(o2Angle) * (o2TailLen * 0.4), orb2Y + Math.sin(o2Angle) * (o2TailLen * 0.4), o2TailTipX * 0.7 + orb2X * 0.3, o2TailTipY * 0.7 + orb2Y * 0.3);
    c.quadraticCurveTo(orb2X, orb2Y + 1.4, orb2X + 1.4, orb2Y);
    c.closePath();
    c.fill();

    // Fagulhas que se desprendem da cauda do orbe 2
    const o2SparkProg = (((tFrame + 12) * 0.4) % 6) / 6;
    const o2SparkX = o2TailTipX + Math.cos(o2Angle) * (o2SparkProg * 4) + Math.sin(tFrame * 0.3 + 1) * 1.2;
    const o2SparkY = o2TailTipY + Math.sin(o2Angle) * (o2SparkProg * 4) - o2SparkProg * 3;
    c.fillStyle = '#ffffff';
    c.fillRect(o2SparkX, o2SparkY, 1.2, 1.2);

    // Núcleo do orbe 2
    c.fillStyle = orbGlow;
    c.beginPath();
    c.arc(orb2X, orb2Y, 4.6 + Math.sin(tFrame * 0.22) * 0.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = flameMid;
    c.beginPath();
    c.arc(orb2X, orb2Y, 2.7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = orbCore;
    c.beginPath();
    c.arc(orb2X - 0.4, orb2Y - 0.4, 1.3, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 10. BRAÇO, MANOPLA E POSTURAS (CONJURAÇÃO DO CAJADO OU REPOUSO)
    if (isCasting) {
      // POSTURA DE CONJURAÇÃO DE COMBATE: Braço estendido à frente canalizando o Cajado da Tormenta
      c.fillStyle = robeBase;
      c.fillRect(2, -4 + bob, 8, 4.2);
      c.fillStyle = goldTrim;
      c.fillRect(8, -4.2 + bob, 2.2, 4.6);
      c.fillStyle = skinCol;
      c.fillRect(9.5, -3.8 + bob, 3.2, 3.4);

      // Cajado frontal empunhado com o Micro-Sol flamejante
      c.save();
      c.translate(12, -2 + bob);
      c.rotate(0.25);

      // Haste
      c.fillStyle = staffWood;
      c.fillRect(-1.6, -18, 3.2, 38);
      c.strokeStyle = goldTrim;
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(-1.6, -10); c.lineTo(1.6, -7);
      c.moveTo(-1.6, 2);   c.lineTo(1.6, 5);
      c.stroke();

      // Coroa de garras douradas
      c.fillStyle = staffGold;
      c.fillRect(-2.4, -18, 4.8, 5.0);

      // Micro-Sol energizado com halo de plasma em expansão
      const cPulse = Math.sin(tFrame * 0.3) * 1.5;
      c.fillStyle = 'rgba(243, 156, 18, 0.45)';
      c.beginPath();
      c.arc(0, -22, 9.0 + cPulse, 0, Math.PI * 2);
      c.fill();

      // Corona de calor
      c.fillStyle = coronaCol;
      c.beginPath();
      c.arc(0, -22, 5.5 + cPulse * 0.5, 0, Math.PI * 2);
      c.fill();

      // Cristal solar central
      c.fillStyle = crystalCol;
      c.beginPath();
      c.arc(0, -22, 3.6, 0, Math.PI * 2);
      c.fill();

      // Núcleo solar branco
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(-1.0, -23, 1.6, 0, Math.PI * 2);
      c.fill();

      // Anéis de ignição térmica arremessados à frente
      c.strokeStyle = 'rgba(255, 234, 167, 0.85)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(6, -22, 6.0 + cPulse, -Math.PI * 0.5, Math.PI * 0.5);
      c.stroke();

      c.restore();
    } else {
      // POSTURA NORMAL: Braço em repouso gracioso com manga recortada e mão mágica
      c.fillStyle = robeBase;
      c.fillRect(5, -2 + bob, 4.2, 7.5);
      c.fillStyle = goldTrim;
      c.fillRect(5, 2 + bob, 4.2, 2.4);
      c.fillStyle = goldLight;
      c.fillRect(5.5, 2.2 + bob, 2.0, 1.0);
      c.fillStyle = skinCol;
      c.fillRect(5.5, 4.4 + bob, 3.2, 2.8);

      // Pequena faísca mágica na ponta dos dedos
      const fTipY = 7.5 + bob + Math.sin(tFrame * 0.2) * 1.0;
      c.fillStyle = flameBright;
      c.fillRect(6.2, fTipY, 1.4, 1.4);
      c.fillStyle = '#ffffff';
      c.fillRect(6.5, fTipY + 0.2, 0.8, 0.8);
    }
  } else if (heroKey === 'ROGUE') {
    // isPhasing handled via state
    // isAttacking handled via state
    const cCol = charDef.color || {};
    const abyssDark = cCol.tunicDark || '#070c14';
    const abyssMid = cCol.tunic || '#0d1522';
    const abyssHigh = cCol.tunicHighlight || '#1b293e';
    const armorPlate = cCol.armorPlates || '#131e2e';
    const armorPlateLight = cCol.armorPlateLight || '#1e2e46';
    const armorPlateHigh = cCol.armorPlateHighlight || '#38bdf8';
    const armorRim = cCol.armorRim || '#00f2fe';
    const leatherStrap = cCol.leatherStraps || '#0a0e17';
    const leatherDark = cCol.leatherDark || '#05080e';
    const platina = cCol.platina || '#e2e8f0';
    const platinaLight = cCol.platinaLight || '#ffffff';
    const platinaDark = cCol.platinaDark || '#64748b';
    const platinaGlint = cCol.platinaGlint || '#ffffff';
    const hoodBase = cCol.hood || '#070c14';
    const hoodDark = cCol.hoodDark || '#04070a';
    const hoodTrim = cCol.hoodTrim || '#00cec9';
    const hoodRune = cCol.hoodRune || '#81ecec';
    const hoodRuneGlow = cCol.hoodRuneGlow || 'rgba(0, 245, 212, 0.75)';
    const capeExt = cCol.cape || '#06131c';
    const capeIn = cCol.capeInner || '#061d22';
    const capeTrim = cCol.capeTrim || '#00f5d4';
    const rimLight = cCol.rimLight || 'rgba(0, 245, 212, 0.45)';
    const scarfCyan = cCol.scarfCyan || '#00cec9';
    const scarfBright = cCol.scarfCyanBright || '#00f5d4';
    const scarfGlow = cCol.scarfGlow || 'rgba(0, 245, 212, 0.40)';
    const maskCol = cCol.maskCol || '#0b1019';
    const maskPlate = cCol.maskPlate || '#cbd5e1';
    const shadowFace = cCol.shadowFace || '#020406';
    const eyeGlow = isPhasing ? '#ffffff' : (cCol.eyeGlow || '#00f2fe');
    const eyeCore = isPhasing ? '#ffffff' : (cCol.eyeGlowCore || '#ffffff');
    const eyeTrail = cCol.eyeTrail || '#00f5d4';
    const bandagesCol = cCol.bandages || '#cbd5e1';
    const bandagesDark = cCol.bandagesDark || '#64748b';
    const scabbardCol = cCol.scabbard || '#070c14';
    const scabbardSteel = cCol.scabbardSteel || '#94a3b8';
    const bladeSteel = cCol.bladeSteel || '#81ecec';
    const bladeSteelLight = cCol.bladeSteelLight || '#dff9fb';
    const bladeGlow = cCol.bladeGlow || '#00cec9';
    const bladeCore = cCol.bladeCore || '#ffffff';
    const hiltGold = cCol.hiltGold || '#e2e8f0';
    const hiltDark = cCol.hiltDark || '#475569';
    const phialSmoke = cCol.phialSmoke || '#00f5d4';
    const phialGlass = cCol.phialGlass || 'rgba(223, 249, 251, 0.85)';
    const mistBreath = cCol.mistBreath || 'rgba(223, 249, 251, 0.45)';
    const isDetailed = scale >= 1.5;

    // =========================================================================
    // 0. ULT/HABILIDADE: FENDAS DIMENSIONAIS, DISTORÇÃO DO VÁCUO & PÓS-IMAGENS
    // =========================================================================
    if (isPhasing) {
      c.save();
      // Pós-imagens de vácuo em dispersão translúcida com distorção de rotação
      for (let g = 1; g <= 4; g++) {
        const ghostDist = g * 9.5;
        const gAlpha = 0.40 / g;
        c.fillStyle = `rgba(0, 242, 254, ${gAlpha * 0.6})`;
        c.beginPath();
        c.ellipse(-ghostDist, bob + (g % 2 === 0 ? 1 : -1), 11, 16, -0.15, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = `rgba(7, 12, 20, ${0.52 / g})`;
        c.beginPath();
        c.ellipse(-ghostDist * 0.75, bob, 8.5, 14, 0, 0, Math.PI * 2);
        c.fill();
      }

      // Anel rúnico de transposição gravitacional no solo sob os passos
      const pulseGlow = Math.sin(tFrame * 0.2) * 3.5;
      c.strokeStyle = 'rgba(0, 245, 212, 0.85)';
      c.lineWidth = 1.8;
      c.setLineDash([4, 2]);
      c.beginPath();
      c.ellipse(0, 14 + bob, 22 + pulseGlow, 6.2 + pulseGlow * 0.25, 0, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);

      // Nós de éter giratórios cardeais ao redor do anel de transposição
      const nodeAngle = tFrame * 0.08;
      for (let n = 0; n < 4; n++) {
        const nAng = nodeAngle + n * (Math.PI / 2);
        const nx = Math.cos(nAng) * (22 + pulseGlow);
        const ny = 14 + bob + Math.sin(nAng) * (6.2 + pulseGlow * 0.25);
        c.fillStyle = '#ffffff';
        c.fillRect(nx - 0.8, ny - 0.8, 1.6, 1.6);
        c.fillStyle = scarfBright;
        c.fillRect(nx - 1.2, ny - 1.2, 2.4, 2.4);
      }
      c.restore();
    }

    // =========================================================================
    // 1. MANTO DA NEBULOSA (NEBULA SHROUD COM POEIRA ESTELAR ATIVA E RIM LIGHT)
    // =========================================================================
    // Forro interno cósmico com profundidade
    c.fillStyle = capeIn;
    c.beginPath();
    c.moveTo(-4.5, -4 + bob);
    c.lineTo(-17 - Math.abs(capeWave * 1.5), 17 + bob);
    c.lineTo(-11 - Math.abs(capeWave * 0.9), 13 + bob);
    c.lineTo(-15 - Math.abs(capeWave * 1.3), 20 + bob);
    c.lineTo(-7 - Math.abs(capeWave * 0.7), 16 + bob);
    c.lineTo(-10 - Math.abs(capeWave * 0.8), 21 + bob);
    c.lineTo(-2, 16 + bob);
    c.lineTo(2.5, -4 + bob);
    c.closePath();
    c.fill();

    // Camada principal exterior em preto abissal com gomos afiados
    c.fillStyle = capeExt;
    c.beginPath();
    c.moveTo(-5, -5 + bob);
    c.lineTo(-15 - Math.abs(capeWave * 1.3), 15 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.7), 11 + bob);
    c.lineTo(-13 - Math.abs(capeWave * 1.1), 18 + bob);
    c.lineTo(-6 - Math.abs(capeWave * 0.5), 14 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.6), 19 + bob);
    c.lineTo(-1, 14 + bob);
    c.lineTo(3.5, -5 + bob);
    c.closePath();
    c.fill();

    // Vincos de sombreamento profundo no tecido da capa
    c.strokeStyle = '#020407';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-4, -3 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.8), 12 + bob);
    c.moveTo(-1, -3 + bob);
    c.lineTo(-5 - Math.abs(capeWave * 0.6), 13 + bob);
    c.stroke();

    // Debrum de platina com costura em ciano estelar
    c.strokeStyle = capeTrim;
    c.lineWidth = 1.1;
    c.stroke();

    // RIM LIGHT ESPECTRAL na silhueta externa da capa
    c.strokeStyle = isPhasing ? 'rgba(255, 255, 255, 0.8)' : rimLight;
    c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-15 - Math.abs(capeWave * 1.3), 15 + bob);
    c.lineTo(-13 - Math.abs(capeWave * 1.1), 18 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.6), 19 + bob);
    c.stroke();

    // Fagulhas e poeira estelar cósmica ativas que evaporam das pontas
    for (let s = 0; s < 4; s++) {
      const sparkProg = ((tFrame * 0.2 + s * 1.6) % 6) / 6;
      const sparkX = -14 - Math.abs(capeWave * 1.1) + (s * 3.2);
      const sparkY = 17 + bob - (sparkProg * 12);
      c.fillStyle = s === 0 ? '#ffffff' : scarfBright;
      c.fillRect(sparkX, sparkY, 1.2, 1.2);
      if (isDetailed) {
        c.fillStyle = 'rgba(255, 255, 255, 0.65)';
        c.fillRect(sparkX + 0.3, sparkY + 0.3, 0.6, 0.6);
      }
    }

    // =========================================================================
    // 2. CACHECÓIS ASTRAIS FLUIDOS (FLOWING SHINOBI RIBBONS EM CONSTANTE VOO)
    // =========================================================================
    // Faixa 1: Longa com ondulação senoidal dupla e tripla camada de luz
    c.save();
    const s1X = -12 - Math.sin(tFrame * 0.12) * 5.5;
    const s1Y = -4 + bob + Math.cos(tFrame * 0.12) * 2.2;
    const s2X = -22 - Math.sin(tFrame * 0.12 + 0.8) * 6.5;
    const s2Y = 0 + bob + Math.sin(tFrame * 0.12 + 0.8) * 4.5;

    // Halo externo de éter da fita 1
    c.strokeStyle = scarfGlow;
    c.lineWidth = 4.2;
    c.beginPath();
    c.moveTo(-3, -7 + bob);
    c.bezierCurveTo(s1X, s1Y, s2X, s2Y, s2X - 5, s2Y + 4);
    c.stroke();

    // Corpo de seda cósmica ciano fluorescente da fita 1
    c.strokeStyle = scarfCyan;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-3, -7 + bob);
    c.bezierCurveTo(s1X, s1Y, s2X, s2Y, s2X - 5, s2Y + 4);
    c.stroke();

    // Núcleo de fusão branca estelar
    c.strokeStyle = '#ffffff';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(-3, -7 + bob);
    c.bezierCurveTo(s1X, s1Y, s2X, s2Y, s2X - 5, s2Y + 4);
    c.stroke();

    // Ponta chanfrada da fita com micro-brilho especular
    c.fillStyle = platinaLight;
    c.fillRect(s2X - 5.5, s2Y + 3.5, 1.4, 1.4);
    c.restore();

    // Faixa 2: Secundária com inércia defasada
    c.save();
    const s3X = -9 - Math.sin(tFrame * 0.14 + 1.2) * 4.2;
    const s3Y = -1 + bob;
    const s4X = -18 - Math.sin(tFrame * 0.14 + 2.0) * 5.2;
    const s4Y = 6 + bob;

    c.strokeStyle = scarfGlow;
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(-2, -6 + bob);
    c.bezierCurveTo(s3X, s3Y, s4X, s4Y, s4X - 3, s4Y + 3);
    c.stroke();

    c.strokeStyle = scarfBright;
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-2, -6 + bob);
    c.bezierCurveTo(s3X, s3Y, s4X, s4Y, s4X - 3, s4Y + 3);
    c.stroke();

    c.strokeStyle = '#ffffff';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(-2, -6 + bob);
    c.bezierCurveTo(s3X, s3Y, s4X, s4Y, s4X - 3, s4Y + 3);
    c.stroke();
    c.restore();

    // =========================================================================
    // 3. COLDRE DORSAL DE PLATINA & DUPLAS FOICES ASTRAIS LUNARES
    // =========================================================================
    c.save();
    c.translate(-1, -3 + bob);

    // Correias de couro do abisso com reforço de platina cruzado
    c.strokeStyle = leatherDark;
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-6.5, -5); c.lineTo(5.5, 7);
    c.moveTo(5.5, -5);  c.lineTo(-6.5, 7);
    c.stroke();

    c.strokeStyle = platina;
    c.lineWidth = 0.9;
    c.stroke();

    // Fivela central estelar chanfrada com núcleo ciano
    c.fillStyle = platina;
    c.fillRect(-1.0, 0.6, 2.0, 2.0);
    c.fillStyle = scarfBright;
    c.fillRect(-0.5, 1.1, 1.0, 1.0);
    c.fillStyle = platinaGlint;
    c.fillRect(-0.8, 0.8, 0.6, 0.6);

    // Lâminas gêmeas no coldre dorsal (visíveis em repouso)
    if (!isAttacking) {
      [-0.72, 0.72].forEach((ang) => {
        c.save();
        c.rotate(ang);

        // Bainha facetada de ônix com chanfro zenital 2.5D
        c.fillStyle = scabbardCol;
        c.fillRect(-2.4, -10.5, 4.8, 16.5);
        c.fillStyle = abyssMid;
        c.fillRect(-1.2, -10.5, 2.4, 16.5); // Meio-tom central da bainha
        c.strokeStyle = platinaDark;
        c.lineWidth = 0.8;
        c.strokeRect(-2.4, -10.5, 4.8, 16.5);

        // Ponteira de platina na ponta da bainha
        c.fillStyle = platina;
        c.fillRect(-2.2, 4.2, 4.4, 1.8);
        c.fillStyle = platinaLight;
        c.fillRect(-1.0, 4.5, 2.0, 0.8);

        // Runa ciano entalhada na bainha com núcleo branco
        c.fillStyle = scarfBright;
        c.fillRect(-0.8, -4, 1.6, 3.2);
        c.fillStyle = '#ffffff';
        c.fillRect(-0.4, -3, 0.8, 1.2);

        // Guarda em meia-lua com garras de platina polida
        c.fillStyle = platina;
        c.beginPath();
        c.arc(0, -11.5, 4.0, 0, Math.PI);
        c.fill();
        c.strokeStyle = platinaDark;
        c.lineWidth = 0.7;
        c.stroke();

        // Empunhadura de couro ônix com trançado visível
        c.fillStyle = '#060a10';
        c.fillRect(-1.3, -15.5, 2.6, 4.0);
        c.strokeStyle = platina;
        c.lineWidth = 0.6;
        c.beginPath();
        c.moveTo(-1.3, -14.5); c.lineTo(1.3, -13.5);
        c.moveTo(-1.3, -12.5); c.lineTo(1.3, -11.5);
        c.stroke();

        // Pomo em anel cósmico com núcleo de luz e brilho especular
        c.strokeStyle = platina;
        c.lineWidth = 1.3;
        c.beginPath();
        c.arc(0, -16.8, 2.0, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = scarfBright;
        c.beginPath();
        c.arc(0, -16.8, 1.0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
        c.fillRect(-0.4, -17.2, 0.8, 0.8);

        c.restore();
      });
    }
    c.restore();

    // =========================================================================
    // 4. PERNAS, GREVAS DE PLATINA & BOTAS SILENCIOSAS DE VELUDO
    // =========================================================================
    const legLeftX = -6.2 - legSwing * 0.4;
    const legRightX = 1.6 + legSwing * 0.4;

    // Calças táticas em tecido de veludo do abisso com sombreamento anatômico
    c.fillStyle = abyssDark;
    c.fillRect(legLeftX, 6 + bob, 4.6, 8.5);
    c.fillRect(legRightX, 6 + bob, 4.6, 8.5);

    // Meia-luz no quadríceps
    c.fillStyle = abyssMid;
    c.fillRect(legLeftX + 0.6, 6.5 + bob, 3.4, 6.0);
    c.fillRect(legRightX + 0.6, 6.5 + bob, 3.4, 6.0);

    // Bandagens / tiras ninja de seda lunar cruzadas em "X" com relevo
    c.fillStyle = bandagesCol;
    c.fillRect(legLeftX, 8.5 + bob, 4.6, 3.2);
    c.fillRect(legRightX, 8.5 + bob, 4.6, 3.2);
    c.strokeStyle = bandagesDark;
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(legLeftX, 8.8 + bob);        c.lineTo(legLeftX + 4.6, 11.2 + bob);
    c.moveTo(legLeftX + 4.6, 8.8 + bob);  c.lineTo(legLeftX, 11.2 + bob);
    c.moveTo(legRightX, 8.8 + bob);       c.lineTo(legRightX + 4.6, 11.2 + bob);
    c.moveTo(legRightX + 4.6, 8.8 + bob); c.lineTo(legRightX, 11.2 + bob);
    c.stroke();

    // Grevas frontais afiadas de platina estelar chanfradas
    c.fillStyle = armorPlate;
    c.fillRect(legLeftX + 0.8, 7.5 + bob, 3.0, 5.5);
    c.fillRect(legRightX + 0.8, 7.5 + bob, 3.0, 5.5);
    c.fillStyle = armorPlateLight;
    c.fillRect(legLeftX + 1.2, 7.8 + bob, 1.4, 4.8);
    c.fillRect(legRightX + 1.2, 7.8 + bob, 1.4, 4.8);
    c.strokeStyle = scarfCyan;
    c.lineWidth = 0.8;
    c.strokeRect(legLeftX + 0.8, 7.5 + bob, 3.0, 5.5);
    c.strokeRect(legRightX + 0.8, 7.5 + bob, 3.0, 5.5);

    // Ponto de luz zenital no topo da greva (joelheira)
    c.fillStyle = platinaGlint;
    c.fillRect(legLeftX + 1.6, 7.5 + bob, 1.2, 0.9);
    c.fillRect(legRightX + 1.6, 7.5 + bob, 1.2, 0.9);

    // Botas de couro de sombra com ponteira curvada
    c.fillStyle = '#070a10';
    c.fillRect(legLeftX - 1.0, 12.4 + bob, 6.2, 3.6);
    c.fillRect(legRightX - 1.0, 12.4 + bob, 6.2, 3.6);

    // Tira de aperto e fivela de platina na bota
    c.fillStyle = leatherDark;
    c.fillRect(legLeftX - 0.5, 12.8 + bob, 5.2, 1.2);
    c.fillRect(legRightX - 0.5, 12.8 + bob, 5.2, 1.2);
    c.fillStyle = platina;
    c.fillRect(legLeftX + 2.8, 12.6 + bob, 1.4, 1.6);
    c.fillRect(legRightX + 2.8, 12.6 + bob, 1.4, 1.6);

    // Biqueira curvada reforçada com bisel de platina
    c.fillStyle = platina;
    c.fillRect(legLeftX + 3.2, 13.5 + bob, 2.2, 1.6);
    c.fillRect(legRightX + 3.2, 13.5 + bob, 2.2, 1.6);
    c.fillStyle = platinaGlint;
    c.fillRect(legLeftX + 3.6, 13.7 + bob, 1.0, 0.8);
    c.fillRect(legRightX + 3.6, 13.7 + bob, 1.0, 0.8);

    // Rim light sutil nas botas
    c.strokeStyle = rimLight;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(legLeftX - 1.0, 15.0 + bob); c.lineTo(legLeftX + 4.5, 15.0 + bob);
    c.moveTo(legRightX - 1.0, 15.0 + bob); c.lineTo(legRightX + 4.5, 15.0 + bob);
    c.stroke();

    // =========================================================================
    // 5. TRONCO DO VÁCUO, OMBREIRA ASSIMÉTRICA EM 3 PLACAS & CINTURÃO TÁTICO
    // =========================================================================
    // Base muscular atlética em V-Taper
    c.fillStyle = abyssMid;
    c.beginPath();
    c.moveTo(-7.5, -5 + bob);
    c.lineTo(7.5, -5 + bob);
    c.lineTo(5.5, 7 + bob);
    c.lineTo(-5.5, 7 + bob);
    c.closePath();
    c.fill();

    // Peitoral reforçado com chanfro geométrico em "V" (Anatomia 2.5D)
    c.fillStyle = abyssDark;
    c.beginPath();
    c.moveTo(-6.0, -4.5 + bob);
    c.lineTo(6.0, -4.5 + bob);
    c.lineTo(0.0, 3.5 + bob);
    c.closePath();
    c.fill();

    // Linha esternal e chanfros de reflexo zenital no peitoral
    c.fillStyle = abyssHigh;
    c.fillRect(-2.8, -4.2 + bob, 5.6, 1.6);
    c.fillRect(-2.0, -1.8 + bob, 4.0, 1.4);
    c.fillStyle = armorPlateHigh;
    c.fillRect(-0.4, -3.8 + bob, 0.8, 4.5); // Friso esternal fino

    // Contorno rúnico ciano no peitoral
    c.strokeStyle = scarfCyan;
    c.lineWidth = 0.9;
    c.stroke();

    // OMBREIRA ESQUERDA ASSIMÉTRICA DO VAZIO EM 3 PLACAS ESCALONADAS (PADRÃO KRAGDOR)
    // Placa 1: Base de armadura
    c.fillStyle = armorPlate;
    c.beginPath();
    c.moveTo(-10.5, -6.8 + bob);
    c.lineTo(-4.5, -6.0 + bob);
    c.lineTo(-5.8, -1.0 + bob);
    c.lineTo(-12.5, -2.0 + bob);
    c.closePath();
    c.fill();

    // Placa 2: Camada central chanfrada com aço de platina
    c.fillStyle = armorPlateLight;
    c.beginPath();
    c.moveTo(-11.2, -7.5 + bob);
    c.lineTo(-6.0, -6.8 + bob);
    c.lineTo(-7.0, -3.0 + bob);
    c.lineTo(-13.0, -4.0 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = platinaDark;
    c.lineWidth = 0.8;
    c.stroke();

    // Placa 3: Espigão/Garra astral superior pontiaguda com reflexo de platina
    c.fillStyle = platina;
    c.beginPath();
    c.moveTo(-12.0, -5.0 + bob);
    c.lineTo(-16.0, -9.0 + bob); // Ponta afiada
    c.lineTo(-9.5, -7.5 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = platinaLight;
    c.lineWidth = 0.8;
    c.stroke();

    // Brilho especular no espigão da ombreira
    c.fillStyle = platinaGlint;
    c.fillRect(-15.8, -8.8 + bob, 1.5, 1.5);

    // Runa cósmica esculpida na ombreira com núcleo brilhante
    c.fillStyle = scarfBright;
    c.fillRect(-9.8, -4.8 + bob, 2.6, 1.6);
    c.fillStyle = '#ffffff';
    c.fillRect(-9.0, -4.4 + bob, 1.0, 0.8);

    // CINTURÃO TÁTICO COM FIVELA HEXAGONAL DE PLATINA E BOLSAS DE COURO
    c.fillStyle = leatherDark;
    c.fillRect(-7.2, 4.5 + bob, 14.4, 3.6);
    c.fillStyle = '#060a12';
    c.fillRect(-6.8, 5.0 + bob, 13.6, 1.2);

    // Bolsa utilitária de couro para gazuas no quadril direito com costuras
    c.fillStyle = '#0c1018';
    c.fillRect(3.2, 4.2 + bob, 3.4, 4.0);
    c.fillStyle = platinaDark;
    c.fillRect(4.2, 4.5 + bob, 1.4, 1.2);
    c.fillStyle = platinaGlint;
    c.fillRect(4.6, 4.7 + bob, 0.6, 0.6);

    // Fivela hexagonal de platina
    c.fillStyle = platina;
    c.beginPath();
    c.moveTo(-2.5, 4.2 + bob);
    c.lineTo(2.5, 4.2 + bob);
    c.lineTo(3.4, 6.2 + bob);
    c.lineTo(0.0, 8.2 + bob);
    c.lineTo(-3.4, 6.2 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = platinaLight;
    c.lineWidth = 0.7;
    c.stroke();

    // Gema estelar ciano no centro da fivela com brilho
    c.fillStyle = scarfBright;
    c.fillRect(-1.2, 5.2 + bob, 2.4, 2.0);
    c.fillStyle = '#ffffff';
    c.fillRect(-0.6, 5.4 + bob, 1.0, 0.9);

    // FRASCOS DE FUMAÇA DIMENSIONAL ESFÉRICOS COM MENISCO LÍQUIDO E BRILHO VÍTREO
    [-4.8, 4.8].forEach((fx) => {
      // Corpo esférico com fumaça
      c.fillStyle = scarfBright;
      c.beginPath();
      c.arc(fx, 6.2 + bob, 2.2, 0, Math.PI * 2);
      c.fill();

      // Reflexo curvo de vidro
      c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      c.lineWidth = 0.8;
      c.beginPath();
      c.arc(fx - 0.5, 5.6 + bob, 1.2, -Math.PI * 0.7, 0);
      c.stroke();

      // Ponto de luz especular
      c.fillStyle = '#ffffff';
      c.fillRect(fx - 0.9, 5.3 + bob, 0.8, 0.8);

      // Gargalo e lacre de platina
      c.fillStyle = platina;
      c.fillRect(fx - 1.2, 3.8 + bob, 2.4, 1.2);
      c.fillStyle = platinaLight;
      c.fillRect(fx - 0.6, 3.8 + bob, 1.2, 0.6);
    });

    // Kunai espectral de arremesso presa horizontalmente sob o cinturão
    c.fillStyle = scabbardSteel;
    c.fillRect(-1.8, 8.0 + bob, 3.8, 1.0);
    c.fillStyle = platina;
    c.fillRect(1.6, 7.8 + bob, 1.4, 1.4);
    c.strokeStyle = platina;
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(2.3, 8.5 + bob, 0.8, 0, Math.PI * 2);
    c.stroke();

    // =========================================================================
    // 6. BRAÇOS, MANOPLAS & GOLPE DE FOICE ASTRAL (KAMA)
    // =========================================================================
    if (isAttacking) {
      // POSTURA DE ATAQUE COM FOICE ASTRAL EM MEIA-LUA
      c.fillStyle = abyssMid;
      c.fillRect(2.5, -4.5 + bob, 9.0, 4.4);
      c.fillStyle = abyssDark;
      c.fillRect(7.5, -5.0 + bob, 4.2, 5.2);

      // Manopla de platina com frisos rúnicos e bandagens
      c.fillStyle = bandagesCol;
      c.fillRect(6.2, -4.2 + bob, 2.2, 3.8);
      c.fillStyle = platina;
      c.fillRect(8.8, -4.8 + bob, 2.5, 5.0);
      c.fillStyle = platinaLight;
      c.fillRect(9.8, -4.4 + bob, 1.0, 4.2);

      c.save();
      c.translate(14.0, -3.0 + bob);
      c.rotate(0.32);

      // Guarda e punho da Foice
      c.fillStyle = platina;
      c.fillRect(-1.8, -2.5, 3.6, 1.6);
      c.fillStyle = '#070c14';
      c.fillRect(-1.0, -5.0, 2.0, 2.5);

      // Pomo em anel cósmico com núcleo ciano
      c.strokeStyle = platina;
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(0, -6.5, 1.8, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = scarfBright;
      c.beginPath();
      c.arc(0, -6.5, 0.9, 0, Math.PI * 2);
      c.fill();

      // Halo translúcido externo de plasma da foice
      c.fillStyle = 'rgba(0, 245, 212, 0.35)';
      c.beginPath();
      c.moveTo(-3.0, -1.0);
      c.lineTo(3.0, -1.0);
      c.quadraticCurveTo(7.5, 7.5, 3.5, 16.5);
      c.lineTo(0.5, 20.0);
      c.quadraticCurveTo(0.5, 8.5, -3.0, -1.0);
      c.closePath();
      c.fill();

      // Lâmina em Foice Curva de Plasma Estelar Translúcido
      c.fillStyle = bladeGlow;
      c.beginPath();
      c.moveTo(-2.2, -1.0);
      c.lineTo(2.2, -1.0);
      c.quadraticCurveTo(5.5, 7.0, 2.5, 14.5);
      c.lineTo(0.5, 17.5); // Ponta cirúrgica penetrante
      c.quadraticCurveTo(0.5, 8.0, -2.2, -1.0);
      c.closePath();
      c.fill();

      // Núcleo branco puro de alta incandescência
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.moveTo(-0.5, 0);
      c.quadraticCurveTo(2.8, 6.5, 1.2, 13.5);
      c.lineTo(0.5, 16.5);
      c.quadraticCurveTo(0.2, 7.5, -0.5, 0);
      c.closePath();
      c.fill();

      // Friso de luz cortante no gume
      c.strokeStyle = '#e0f7fa';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(0.5, 0);
      c.lineTo(0.5, 16.5);
      c.stroke();

      // ARCO CINÉTICO DE VÁCUO NO AR (Duplo com partículas de vácuo)
      const slashPulse = Math.sin(tFrame * 0.4) * 2.0;
      c.strokeStyle = 'rgba(0, 245, 212, 0.85)';
      c.lineWidth = 3.4;
      c.beginPath();
      c.arc(10, 0, 14 + slashPulse, -Math.PI * 0.42, Math.PI * 0.42);
      c.stroke();

      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.3;
      c.beginPath();
      c.arc(10, 0, 14.5 + slashPulse, -Math.PI * 0.32, Math.PI * 0.32);
      c.stroke();

      // Fagulhas de vácuo desprendendo do golpe
      c.fillStyle = '#ffffff';
      c.fillRect(18 + slashPulse, -8, 1.4, 1.4);
      c.fillRect(19 + slashPulse, 6, 1.2, 1.2);
      c.restore();
    } else {
      // POSTURA NORMAL: Braços ágeis em repouso com braceletes de platina e rebites
      c.fillStyle = abyssMid;
      c.fillRect(-9.4, -3.0 + bob, 4.2, 8.0);
      c.fillRect(5.5, -3.0 + bob, 4.2, 8.0);

      // Sombra de volume muscular no braço
      c.fillStyle = abyssDark;
      c.fillRect(-9.4, 1.0 + bob, 4.2, 1.5);
      c.fillRect(5.5, 1.0 + bob, 4.2, 1.5);

      // Deltoide superior iluminado
      c.fillStyle = abyssHigh;
      c.fillRect(-9.0, -3.0 + bob, 1.4, 3.5);
      c.fillRect(7.8, -3.0 + bob, 1.4, 3.5);

      // Braceletes de platina nos punhos com rebites e canal ciano
      c.fillStyle = platina;
      c.fillRect(-9.6, 1.5 + bob, 4.6, 2.6);
      c.fillRect(5.3, 1.5 + bob, 4.6, 2.6);
      c.fillStyle = scarfBright;
      c.fillRect(-9.0, 2.1 + bob, 3.4, 1.2);
      c.fillRect(5.9, 2.1 + bob, 3.4, 1.2);

      // Pontos de brilho especular nos braceletes
      c.fillStyle = platinaGlint;
      c.fillRect(-9.2, 1.7 + bob, 0.8, 0.8);
      c.fillRect(8.9, 1.7 + bob, 0.8, 0.8);

      // Alojamento da lâmina oculta no antebraço direito
      c.fillStyle = scabbardSteel;
      c.fillRect(6.2, -0.5 + bob, 1.6, 4.2);
      c.fillStyle = scarfBright;
      c.fillRect(6.6, 3.2 + bob, 0.8, 1.0);
    }

    // =========================================================================
    // 7. GOLA ALTA RÚNICA & CACHOCOL TÁTICO
    // =========================================================================
    c.fillStyle = abyssDark;
    c.beginPath();
    c.moveTo(-6.0, -6.5 + bob);
    c.lineTo(6.0, -6.5 + bob);
    c.lineTo(4.5, -2.5 + bob);
    c.lineTo(-4.5, -2.5 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = scarfCyan;
    c.lineWidth = 1.1;
    c.stroke();

    // =========================================================================
    // 8. CAPUZ BICO DE FALCÃO NOTURNO (SHADOW RAVEN COWL COM RIM LIGHT)
    // =========================================================================
    // Volume base escuro que envolve a cabeça
    c.fillStyle = hoodBase;
    c.beginPath();
    c.moveTo(-6.5, -4.5 + bob);
    c.lineTo(-8.5, -11.5 + bob);
    c.quadraticCurveTo(-7.0, -18.5 + bob, -0.5, -19.5 + bob);
    c.lineTo(2.2, -21.2 + bob); // Bico de Falcão pontiagudo frontal agressivo
    c.quadraticCurveTo(7.8, -18.2 + bob, 8.4, -11.0 + bob);
    c.lineTo(6.5, -4.5 + bob);
    c.closePath();
    c.fill();

    // Sombreamento de dobras e vincos no tecido do capuz
    c.strokeStyle = hoodDark;
    c.lineWidth = 1.4;
    c.stroke();

    // Borda geométrica e bisel do capuz em platina e ciano
    c.strokeStyle = hoodTrim;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-0.5, -19.5 + bob);
    c.lineTo(2.2, -21.2 + bob);
    c.quadraticCurveTo(7.8, -18.2 + bob, 8.4, -11.0 + bob);
    c.stroke();

    // RIM LIGHT no topo do capuz
    c.strokeStyle = rimLight;
    c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-6.0, -17.5 + bob);
    c.quadraticCurveTo(-0.5, -20.2 + bob, 2.2, -21.2 + bob);
    c.stroke();

    // Runa cósmica ciano na aba do capuz com halo de pulso
    c.fillStyle = hoodRuneGlow;
    c.fillRect(0.2, -17.8 + bob, 3.0, 3.0);
    c.fillStyle = hoodRune;
    c.fillRect(0.8, -17.2 + bob, 1.8, 1.8);
    c.fillStyle = '#ffffff';
    c.fillRect(1.2, -16.8 + bob, 0.9, 0.9);

    // Sombra profunda interna sob a aba
    c.fillStyle = shadowFace;
    c.beginPath();
    c.arc(1.0, -10.5 + bob, 6.2, 0, Math.PI * 2);
    c.fill();

    // =========================================================================
    // 9. MÁSCARA DO ECLIPSE (ÔNIX COM PLATINA GEOMÉTRICA & 3 FACETAS 2.5D)
    // =========================================================================
    // Faceta escura (esquerda)
    c.fillStyle = '#06090e';
    c.beginPath();
    c.moveTo(0.5, -9.0 + bob);
    c.lineTo(3.2, -9.0 + bob);
    c.lineTo(2.6, -4.6 + bob);
    c.lineTo(-0.2, -4.8 + bob);
    c.closePath();
    c.fill();

    // Faceta iluminada (direita)
    c.fillStyle = maskCol;
    c.beginPath();
    c.moveTo(3.2, -9.0 + bob);
    c.lineTo(6.8, -9.0 + bob);
    c.lineTo(5.8, -4.2 + bob);
    c.lineTo(2.6, -4.6 + bob);
    c.closePath();
    c.fill();

    // Placa de reforço angular em platina estelar com bisel
    c.strokeStyle = maskPlate;
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(1.2, -8.6 + bob);
    c.lineTo(6.4, -8.6 + bob);
    c.lineTo(5.4, -4.6 + bob);
    c.stroke();

    // Ponto de brilho especular na quina da máscara
    c.fillStyle = platinaGlint;
    c.fillRect(6.0, -8.8 + bob, 1.0, 1.0);

    // Fenda de respiração filtrada com ilhós
    c.fillStyle = '#020406';
    c.fillRect(2.8, -6.5 + bob, 1.8, 0.8);
    c.fillStyle = platinaDark;
    c.fillRect(2.4, -6.5 + bob, 0.5, 0.8);
    c.fillRect(4.5, -6.5 + bob, 0.5, 0.8);

    // Micro-baforada de névoa fria espectral da respiração (Padrão Kragdor)
    const breathCycle = (tFrame * 0.08) % 1;
    if (breathCycle < 0.45) {
      const bProg = breathCycle / 0.45;
      c.fillStyle = `rgba(0, 245, 212, ${(1 - bProg) * (isPhasing ? 0.6 : 0.35)})`;
      c.beginPath();
      c.arc(6.5 + bProg * 5, -5.5 + bob - bProg * 2.5, 0.8 + bProg * 1.8, 0, Math.PI * 2);
      c.fill();
    }

    // =========================================================================
    // 10. OLHAR PREDADOR DUPLO & CHAMA ESPECTRAL ASCENDENTE (PADRÃO KRAGDOR)
    // =========================================================================
    // Fendas oculares afiadas na escuridão
    c.fillStyle = '#010305';
    c.fillRect(2.0, -12.0 + bob, 4.8, 2.6);

    // Olho laser ciano incandescente
    c.fillStyle = eyeGlow;
    c.fillRect(2.8, -11.6 + bob, 3.6, 1.8);
    c.fillStyle = eyeCore;
    c.fillRect(4.0, -11.4 + bob, 1.8, 1.2);
    c.fillStyle = '#ffffff';
    c.fillRect(4.6, -11.2 + bob, 0.8, 0.8); // Ponto de brilho estelar duplo

    // CHAMA ESPECTRAL FRIA ASCENDENTE (Rastro de Éter Flutuante Contínuo)
    const fireWisp = Math.sin(tFrame * 0.25) * 1.6;
    const fireWisp2 = Math.cos(tFrame * 0.28) * 1.2;

    // Halo da chama
    c.strokeStyle = isPhasing ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 245, 212, 0.4)';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(5.8, -11.2 + bob);
    c.bezierCurveTo(8.5, -13.0 + bob + fireWisp, 10.5, -15.0 + bob + fireWisp2, 12.5, -17.5 + bob - fireWisp);
    c.stroke();

    // Núcleo da chama
    c.strokeStyle = isPhasing ? '#ffffff' : eyeTrail;
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(5.8, -11.2 + bob);
    c.bezierCurveTo(8.5, -13.0 + bob + fireWisp, 10.5, -15.0 + bob + fireWisp2, 12.5, -17.5 + bob - fireWisp);
    c.stroke();

    // Fagulhas estelares que se soltam do olho
    c.fillStyle = '#ffffff';
    c.fillRect(11.0, -18.2 + bob - fireWisp, 1.2, 1.2);
    c.fillStyle = scarfBright;
    c.fillRect(13.5, -20.5 + bob - fireWisp2, 1.0, 1.0);
  } else {
    // Fallback genérico para chaves de heróis não mapeadas
    c.fillStyle = charDef.color.cape || '#7f8c8d';
    c.beginPath();
    c.moveTo(-4, -2 + bob);
    c.lineTo(-12 - Math.abs(capeWave), 13 + bob);
    c.lineTo(-2, 14 + bob);
    c.lineTo(2, -2 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = '#1e1b18';
    c.fillRect(-6 - legSwing * 0.4, 7 + bob, 4, 7);
    c.fillRect(2 + legSwing * 0.4, 7 + bob, 4, 7);

    c.fillStyle = charDef.color.armor || '#95a5a6';
    c.fillRect(-8, -4 + bob, 16, 12);
  }

  c.restore();
}

/**
 * Renderiza proceduralmente o personagem jogável selecionado na arena de combate.
 */
export function drawPlayerCharacter() {
  const isInvulnBlink = player.iFrames > 0 && Math.floor(player.iFrames / 4) % 2 === 0;

  ctx.save();
  if (isInvulnBlink) {
    ctx.globalAlpha = 0.35;
  }

  renderHeroModel(ctx, selectedHeroKey, {
    x: player.x,
    y: player.y,
    facing: player.facing,
    scale: 1,
    isMoving: player.isMoving,
    walkCycle: player.walkCycle,
    frameCount: frameCount,
    berserkTimer: player.berserkTimer,
    invisTimer: player.invisTimer,
    dashDuration: player.dashDuration,
    ignisDashDuration: player.ignisDashDuration,
    staffCastTimer: player.staffCastTimer,
    isPhasing: player.isPhasing,
    evolvedPotion: player.evolvedPotion,
    iFrames: player.iFrames,
    radius: player.radius,
    hammerProgress: (() => {
      const hb = bullets.find(b => b.type === 'HAMMER_SLAM');
      return hb ? Math.max(0, Math.min(1, 1 - (hb.life / hb.maxLife))) : -1;
    })(),
    isHammerAttacking: bullets.some(b => b.type === 'HAMMER_SLAM' && b.life > 0),
    evolvedHammer: player.evolvedHammer,
    isStaffCasting: bullets.some(b => b.type === 'STAFF' && b.life > 48),
    isSwordAttacking: bullets.some(b => b.type === 'SWORD' && b.life > 45),
    potionThrowTimer: player.potionThrowTimer || 0,
    alchemistSkillTimer: player.alchemistSkillTimer || 0,
    isThrowingPotion: (player.potionThrowTimer > 0) || bullets.some(b => b.type === 'POTION' && b.life > 18),
    isAlchemistSkill: (player.alchemistSkillTimer > 0)
  });

  ctx.restore();
}
