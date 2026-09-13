/**
 * src/entities/bosses/supremeReaper/render.js
 * Pipeline de renderização procedural gráfica em Canvas 2D do Ceifador Supremo.
 */

import { player } from '../../player.js';
import { REAPER_STATES } from './constants.js';

/**
 * Desenha a sombra projetada no chão sob o Ceifador.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {boolean} isVuln
 */
export function drawReaperShadow(ctx, e, bob, isVuln) {
  const shadowY = 56 + (isVuln ? 12 : 0);
  const shadowR = (e.radius * 0.88) - (isVuln ? 0 : bob * 0.35);

  const grad = ctx.createRadialGradient(0, shadowY, 4, 0, shadowY, shadowR);
  grad.addColorStop(0, 'rgba(5, 5, 8, 0.7)');
  grad.addColorStop(0.7, 'rgba(10, 15, 20, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowR, shadowR * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Renderiza o rastro fantasma espectral deixado pela movimentação do Ceifador.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 */
export function drawGhostTrail(ctx, e) {
  for (let t of e.ghostTrail) {
    if (t.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.enraged ? 'rgba(231, 76, 60, 0.35)' : 'rgba(0, 206, 201, 0.3)';
    ctx.beginPath();
    ctx.ellipse(t.x - e.x, t.y - e.y, e.radius * 0.7, e.radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Desenha o círculo rúnico místico no solo durante a janela de vulnerabilidade/colapso.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawRecoveryGliph(ctx, e, frameCount) {
  const pulse = Math.sin(frameCount * 0.18) * 3.5;
  const R = e.radius * 1.15 + pulse;

  ctx.strokeStyle = '#81ecec';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 54, R, 22, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 206, 201, 0.1)';
  ctx.fill();

  const runeCount = 8;
  const rot = frameCount * 0.02;
  for (let k = 0; k < runeCount; k++) {
    const a = rot + (k * Math.PI * 2 / runeCount);
    const rx = Math.cos(a) * R;
    const ry = 54 + Math.sin(a) * 22;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry - 3);
    ctx.lineTo(rx + 3, ry + 3);
    ctx.stroke();
  }
}

/**
 * Desenha as asas esqueléticas e membranas de ectoplasma translúcidas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 */
export function drawSpectralWings(ctx, e, bob, isVuln, isEnraged) {
  const wingSpan = e.wingSpan || 0.55;
  const boneCol = isVuln ? '#636e72' : (isEnraged ? '#ff6b81' : '#81ecec');
  const boneShade = isVuln ? '#2d3436' : (isEnraged ? '#5a0d14' : '#0f323d');
  const ectoFill = isVuln 
    ? 'rgba(45, 52, 54, 0.4)' 
    : (isEnraged ? 'rgba(255, 71, 87, 0.28)' : 'rgba(0, 206, 201, 0.26)');

  ctx.save();
  ctx.translate(0, -20 + bob);

  for (let side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(-0.28 * wingSpan);

    // 1. Membranas de Ectoplasma Translúcidas (Penas Fantasmais)
    ctx.fillStyle = ectoFill;
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.quadraticCurveTo(42 * wingSpan, -25 * wingSpan, 85 * wingSpan, -28 * wingSpan);
    ctx.lineTo(96 * wingSpan, -14 * wingSpan);
    ctx.lineTo(76 * wingSpan, 18 * wingSpan);
    ctx.lineTo(48 * wingSpan, 32 * wingSpan);
    ctx.lineTo(24 * wingSpan, 24 * wingSpan);
    ctx.closePath();
    ctx.fill();

    // 2. Estrutura Óssea da Asa (Arched Bone Spine)
    ctx.strokeStyle = boneShade;
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(38 * wingSpan, -38 * wingSpan, 88 * wingSpan, -28 * wingSpan);
    ctx.stroke();

    ctx.strokeStyle = boneCol;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Falanges / Espigões Ósseos da Asa
    const fingerAngles = [
      { ex: 96 * wingSpan, ey: -14 * wingSpan },
      { ex: 76 * wingSpan, ey: 18 * wingSpan },
      { ex: 48 * wingSpan, ey: 32 * wingSpan }
    ];
    ctx.strokeStyle = boneCol;
    ctx.lineWidth = 1.8;
    for (let f of fingerAngles) {
      ctx.beginPath();
      ctx.moveTo(40 * wingSpan, -10 * wingSpan);
      ctx.lineTo(f.ex, f.ey);
      ctx.stroke();
    }

    ctx.restore();
  }
  ctx.restore();
}

/**
 * Desenha o manto de seda do vazio com drapeamento físico senoidal.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 */
export function drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged) {
  const t = frameCount * 0.07;
  const drape1 = Math.sin(t) * 9 + Math.cos(t * 1.8) * 4;
  const drape2 = Math.cos(t * 1.2) * 8 + Math.sin(t * 2.3) * 3;
  const drapeMid = Math.sin(t * 1.5 + 1.2) * 6;

  const voidBlack = isVuln ? '#13191d' : (isEnraged ? '#180306' : '#03070d');
  const robeDeep   = isVuln ? '#1e272e' : (isEnraged ? '#2c080d' : '#08121a');
  const robeInner  = isVuln ? '#2c3e50' : (isEnraged ? '#4a0e16' : '#0c222d');
  const soulCyan   = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulLight  = isVuln ? '#b2bec3' : (isEnraged ? '#ff6b81' : '#81ecec');

  // Camada 1: Forro Interior de Almas (Undercloak Ethereal Glow)
  ctx.fillStyle = robeInner;
  ctx.beginPath();
  ctx.moveTo(0, -58 + bob);
  ctx.quadraticCurveTo(-54, -10 + bob, -42 + drape1, 52 + bob);
  ctx.quadraticCurveTo(0, 38 + bob, 42 + drape2, 52 + bob);
  ctx.quadraticCurveTo(54, -10 + bob, 0, -58 + bob);
  ctx.closePath();
  ctx.fill();

  // Camada 2: Manto Principal de Seda do Vazio (Outer Void Shroud)
  ctx.fillStyle = voidBlack;
  ctx.beginPath();
  ctx.moveTo(0, -54 + bob);
  ctx.quadraticCurveTo(-50, -12 + bob, -36 + drape1 * 0.8, 48 + bob);
  ctx.lineTo(-20 + drapeMid, 45 + bob);
  ctx.lineTo(-6, 50 + bob);
  ctx.lineTo(6, 47 + bob);
  ctx.lineTo(20 + drapeMid, 46 + bob);
  ctx.lineTo(36 + drape2 * 0.8, 48 + bob);
  ctx.quadraticCurveTo(50, -12 + bob, 0, -54 + bob);
  ctx.closePath();
  ctx.fill();

  // Camada 3: Painel Central com Dobras Verticais
  ctx.fillStyle = robeDeep;
  ctx.beginPath();
  ctx.moveTo(0, -42 + bob);
  ctx.quadraticCurveTo(-26, 0 + bob, -16 + drapeMid, 44 + bob);
  ctx.lineTo(16 + drapeMid, 44 + bob);
  ctx.quadraticCurveTo(26, 0 + bob, 0, -42 + bob);
  ctx.closePath();
  ctx.fill();

  // Borda Rúnica Luminosa na Barra do Manto
  ctx.strokeStyle = soulCyan;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-36 + drape1 * 0.8, 48 + bob);
  ctx.quadraticCurveTo(-18 + drapeMid, 42 + bob, 0, 46 + bob);
  ctx.quadraticCurveTo(18 + drapeMid, 42 + bob, 36 + drape2 * 0.8, 48 + bob);
  ctx.stroke();

  // Efeito de Almas Ascendendo da Barra do Manto
  if (!isVuln && Math.floor(frameCount) % 4 === 0) {
    const smokeX = (Math.random() - 0.5) * 60;
    const smokeY = 46 + bob + Math.random() * 6;
    ctx.fillStyle = Math.random() < 0.6 ? soulCyan : soulLight;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(smokeX, smokeY, 2.5, 2.5);
    ctx.globalAlpha = 1.0;
  }
}

/**
 * Desenha a caixa torácica esquelética e o núcleo radiante de almas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 */
export function drawRibcageAndCore(ctx, bob, frameCount, isVuln, isEnraged) {
  const coreY = -12 + bob;
  const pulse = Math.sin(frameCount * (isEnraged ? 0.24 : 0.14)) * 3.5;
  const coreR = Math.max(6, 16 + pulse);

  const soulCyan  = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulGlow  = isVuln ? '#7f8c8d' : (isEnraged ? '#ff6b81' : '#81ecec');
  const boneCol   = isVuln ? '#576574' : (isEnraged ? '#f8d7da' : '#dff9fb');

  // 1. Núcleo das Almas (Soul Nexus Core) com Gradiente Tridimensional
  const coreGrad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, coreR);
  if (isVuln) {
    coreGrad.addColorStop(0, '#95a5a6');
    coreGrad.addColorStop(0.6, '#34495e');
    coreGrad.addColorStop(1, 'rgba(44, 62, 80, 0)');
  } else if (isEnraged) {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, '#ff4757');
    coreGrad.addColorStop(0.8, '#c0392b');
    coreGrad.addColorStop(1, 'rgba(192, 57, 43, 0)');
  } else {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, soulGlow);
    coreGrad.addColorStop(0.75, soulCyan);
    coreGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');
  }

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, coreY, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Partículas Orbitais do Núcleo
  if (!isVuln) {
    for (let p = 0; p < 3; p++) {
      const pAng = frameCount * 0.08 + p * (Math.PI * 2 / 3);
      const pDist = coreR * 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.cos(pAng) * pDist - 1.5, coreY + Math.sin(pAng) * (pDist * 0.5) - 1.5, 3, 3);
    }
  }

  // 2. Costelas Esqueléticas Protegendo o Núcleo (Skeletal Ribcage)
  ctx.strokeStyle = boneCol;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';

  // Espinha central
  ctx.beginPath();
  ctx.moveTo(0, -22 + bob);
  ctx.lineTo(0, 6 + bob);
  ctx.stroke();

  // Pares de Costelas Arqueadas
  for (let r = 0; r < 4; r++) {
    const ry = -20 + r * 6.5 + bob;
    const rw = 18 - r * 2.5;
    ctx.beginPath();
    ctx.arc(0, ry, rw, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
  }
}

/**
 * Desenha o capuz abissal, a máscara entalhada em marfim e os olhos de fogo fátuo.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 */
export function drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged) {
  const headY = -36 + bob;

  const soulCyan  = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulGlow  = isVuln ? '#7f8c8d' : (isEnraged ? '#ff6b81' : '#81ecec');
  const boneWhite = isVuln ? '#636e72' : (isEnraged ? '#f1dcd6' : '#e6f2f2');
  const boneShade = isVuln ? '#2d3436' : (isEnraged ? '#4a151b' : '#1e3842');

  // 1. Capuz Abissal com Espigões / Chifres Ósseos no Topo
  ctx.fillStyle = '#020509';
  ctx.beginPath();
  ctx.moveTo(0, headY - 26);
  ctx.lineTo(16, headY - 14);
  ctx.lineTo(18, headY + 14);
  ctx.lineTo(0, headY + 22);
  ctx.lineTo(-18, headY + 14);
  ctx.lineTo(-16, headY - 14);
  ctx.closePath();
  ctx.fill();

  // Chifres / Cristas Ósseas do Capuz
  ctx.strokeStyle = boneShade;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-10, headY - 16);
  ctx.quadraticCurveTo(-18, headY - 28, -22, headY - 32);
  ctx.moveTo(10, headY - 16);
  ctx.quadraticCurveTo(18, headY - 28, 22, headY - 32);
  ctx.stroke();

  // 2. Máscara de Caveira Entalhada em Marfim Antigo
  ctx.fillStyle = boneWhite;
  ctx.beginPath();
  ctx.moveTo(0, headY - 15);
  ctx.lineTo(13, headY - 5);
  ctx.lineTo(10, headY + 5);
  ctx.lineTo(6, headY + 13);
  ctx.lineTo(0, headY + 17);
  ctx.lineTo(-6, headY + 13);
  ctx.lineTo(-10, headY + 5);
  ctx.lineTo(-13, headY - 5);
  ctx.closePath();
  ctx.fill();

  // Sombreamento craniano e mandíbula
  ctx.fillStyle = boneShade;
  ctx.beginPath();
  ctx.moveTo(-4, headY + 11);
  ctx.lineTo(4, headY + 11);
  ctx.lineTo(2, headY + 16);
  ctx.lineTo(-2, headY + 16);
  ctx.closePath();
  ctx.fill();

  // Cavidade Nasal Triangular
  ctx.fillStyle = '#050a0f';
  ctx.beginPath();
  ctx.moveTo(0, headY + 3);
  ctx.lineTo(-2.5, headY + 7);
  ctx.lineTo(2.5, headY + 7);
  ctx.closePath();
  ctx.fill();

  // Cavidades Oculares Profundas e Chamas de Almas Incandescentes
  const eyePulse = e.eyePulse || 0.5;
  const eyeR = 3.2 + eyePulse * 1.8;

  // Cavidade escura do olho
  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.ellipse(-5.5, headY - 1, 4.5, 3.2, -0.15, 0, Math.PI * 2);
  ctx.ellipse(5.5, headY - 1, 4.5, 3.2, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Fogo Fátuo nos Olhos com Auréola Luminosa
  const eyeGrad = ctx.createRadialGradient(-5.5, headY - 1, 1, -5.5, headY - 1, eyeR);
  eyeGrad.addColorStop(0, '#ffffff');
  eyeGrad.addColorStop(0.5, soulGlow);
  eyeGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');

  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.arc(-5.5, headY - 1, eyeR, 0, Math.PI * 2);
  ctx.fill();

  const eyeGradR = ctx.createRadialGradient(5.5, headY - 1, 1, 5.5, headY - 1, eyeR);
  eyeGradR.addColorStop(0, '#ffffff');
  eyeGradR.addColorStop(0.5, soulGlow);
  eyeGradR.addColorStop(1, 'rgba(0, 206, 201, 0)');

  ctx.fillStyle = eyeGradR;
  ctx.beginPath();
  ctx.arc(5.5, headY - 1, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Rastro Dinâmico de Luz dos Olhos
  if (!isVuln) {
    const trailLen = 8 + eyePulse * 6;
    ctx.strokeStyle = soulCyan;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-5.5, headY - 1);
    ctx.quadraticCurveTo(-10 - eyePulse * 4, headY - 4, -5.5 - trailLen, headY - 3 + Math.sin(frameCount * 0.3) * 2);
    ctx.moveTo(5.5, headY - 1);
    ctx.quadraticCurveTo(10 + eyePulse * 4, headY - 4, 5.5 + trailLen, headY - 3 + Math.sin(frameCount * 0.3) * 2);
    ctx.stroke();
  }
}

/**
 * Desenha a foice monumental de ferro espectral com farpas serrilhadas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 */
export function drawOrnateScythe(ctx, e, bob, isVuln, isEnraged) {
  ctx.save();
  // Posiciona a foice na mão frontal do Ceifador (+X é a direção para frente)
  ctx.translate(36, -10 + bob);
  ctx.rotate(e.scytheAngle);

  const soulCyan  = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulGlow  = isVuln ? '#7f8c8d' : (isEnraged ? '#ff6b81' : '#81ecec');

  // 1. Cabo Esculpido em Ferro Espectral com Envolturas Místicas
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(-3, -80, 6, 155);

  // Bandagens / Envolturas no Cabo
  ctx.fillStyle = '#57606f';
  for (let b = 0; b < 4; b++) {
    ctx.fillRect(-4, -50 + b * 22, 8, 4);
  }

  // Pomo e Encaixe de Caveira no Topo do Cabo
  ctx.fillStyle = '#2f3542';
  ctx.beginPath();
  ctx.arc(0, -80, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = soulCyan;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // 2. Lâmina Monumental de Foice em Lua Crescente
  ctx.strokeStyle = soulCyan;
  ctx.lineWidth = 7.0;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-28, -78, 56, -0.22, Math.PI * 0.82, false);
  ctx.stroke();

  // Lâmina Branca Incandescente Central
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Dentes / Farpas Serrilhadas Internas da Lâmina
  ctx.fillStyle = soulGlow;
  for (let d = 0; d < 3; d++) {
    const barbAng = 0.15 + d * 0.28;
    const bx = -28 + Math.cos(barbAng) * 52;
    const by = -78 + Math.sin(barbAng) * 52;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 7, by + 4);
    ctx.lineTo(bx - 3, by + 8);
    ctx.closePath();
    ctx.fill();
  }

  // Ponto de Luz Espectral na Ponta da Lâmina
  const tipX = -28 + Math.cos(-0.22) * 56;
  const tipY = -78 + Math.sin(-0.22) * 56;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(tipX, tipY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Desenha as Lanternas Góticas orbitando ao redor do Ceifador.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isEnraged
 */
export function drawGothicLanterns(ctx, e, bob, frameCount, isEnraged) {
  for (let l of e.lanterns) {
    if (!l.active) continue;

    const lx = Math.cos(l.angle) * l.dist;
    const ly = (Math.sin(l.angle) * (l.dist * 0.48)) + bob + l.sway;

    // Corrente de Sustentação
    ctx.save();
    ctx.strokeStyle = isEnraged ? 'rgba(255, 71, 87, 0.45)' : 'rgba(0, 206, 201, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, -18 + bob);
    ctx.lineTo(lx, ly - l.radius - 6);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(lx, ly);

    if (l.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, l.radius + 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 1. Corpo da Gaiola Gótica de Ferro Forjado
      ctx.fillStyle = isEnraged ? '#2c080d' : '#0d1821';
      ctx.beginPath();
      ctx.moveTo(-l.radius * 0.7, -l.radius);
      ctx.lineTo(l.radius * 0.7, -l.radius);
      ctx.lineTo(l.radius * 0.9, l.radius * 0.65);
      ctx.lineTo(0, l.radius * 1.15);
      ctx.lineTo(-l.radius * 0.9, l.radius * 0.65);
      ctx.closePath();
      ctx.fill();

      // Borda e Barras de Ferro
      ctx.strokeStyle = isEnraged ? '#ff4757' : '#00cec9';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Barras verticais da gaiola
      ctx.beginPath();
      ctx.moveTo(-l.radius * 0.35, -l.radius);
      ctx.lineTo(-l.radius * 0.45, l.radius * 0.65);
      ctx.moveTo(l.radius * 0.35, -l.radius);
      ctx.lineTo(l.radius * 0.45, l.radius * 0.65);
      ctx.moveTo(0, -l.radius);
      ctx.lineTo(0, l.radius * 1.15);
      ctx.stroke();

      // 2. Alma Prisioneira / Fogo Fátuo Vivo no Interior
      const wispAngle = frameCount * 0.12;
      const wispR = l.radius * 0.6;
      const flameGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, wispR);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.4, isEnraged ? '#ff6b81' : '#81ecec');
      flameGrad.addColorStop(1, isEnraged ? '#c0392b' : '#00cec9');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(0, 0, wispR, 0, Math.PI * 2);
      ctx.fill();

      // Micro-alma orbitando no interior do vidro
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(Math.cos(wispAngle) * (wispR * 0.5), Math.sin(wispAngle) * (wispR * 0.5), 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 3. Barra Circular de Vida da Lanterna
      const hpPct = Math.max(0, l.hp / l.maxHp);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, l.radius + 5, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPct));
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Desenha o portal holográfico e telegrafia de teleporte espectral (Blink).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawBlinkAimIndicator(ctx, e, frameCount) {
  if (e.actionState !== REAPER_STATES.BLINK_AIM || !e.blinkTarget) return;

  const targetDx = e.blinkTarget.x - e.x;
  const targetDy = e.blinkTarget.y - e.y;

  ctx.save();

  // 1. Filamento espectral ligando a posição atual ao destino
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -frameCount * 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(targetDx, targetDy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.translate(targetDx, targetDy);

  // 2. Fenda Espectral no Chão (Rift Portal)
  const pulse = Math.sin(frameCount * 0.22) * 5;
  const ringR = 42 + pulse;

  // Disco abissal no chão
  ctx.fillStyle = 'rgba(3, 7, 13, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR, ringR * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  // Anéis rúnicos concentricos
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR, ringR * 0.52, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(129, 236, 236, 0.6)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR * 0.65, ringR * 0.32, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Runa central de mira
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(16, 0);
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 10);
  ctx.stroke();

  // 3. Silhueta Espectral Translúcida do Ceifador (Holograma de Aviso)
  const phantomAlpha = 0.35 + Math.sin(frameCount * 0.25) * 0.12;
  ctx.save();
  ctx.globalAlpha = phantomAlpha;
  ctx.fillStyle = '#00cec9';
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.quadraticCurveTo(-26, -10, -18, 20);
  ctx.lineTo(18, 20);
  ctx.quadraticCurveTo(26, -10, 0, -48);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-5, -28, 3, 3);
  ctx.fillRect(5, -28, 3, 3);

  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(15, -45, 30, -0.4, Math.PI * 0.65);
  ctx.stroke();
  ctx.restore();

  // 4. Cone Telegrafado do Corte Iminente
  if (e.blinkTarget.cleaveAngle !== undefined) {
    const cleaveArc = Math.PI * 0.52;
    const startAng = e.blinkTarget.cleaveAngle - cleaveArc;
    const endAng = e.blinkTarget.cleaveAngle + cleaveArc;

    ctx.fillStyle = 'rgba(0, 206, 201, 0.18)';
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 165, startAng, endAng);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, 165, startAng, endAng);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Desenha as linhas tracejadas de mira das Foices de Almas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawSoulScytheAimLines(ctx, e, frameCount) {
  if (e.actionState !== REAPER_STATES.WINDUP || e.currentSkill !== 'SOUL_SCYTHES') return;

  const blades = e.isPhase3 ? 7 : (e.isEnraged ? 5 : 3);
  const arc = Math.PI * (e.isEnraged ? 0.65 : 0.45);
  const baseAngle = e.aimAngle || 0;
  const startAngle = baseAngle - arc / 2;
  const step = arc / (blades - 1);

  ctx.save();
  ctx.strokeStyle = e.isEnraged ? 'rgba(255, 71, 87, 0.55)' : 'rgba(0, 206, 201, 0.55)';
  ctx.lineWidth = 2.0;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -frameCount * 1.8;

  for (let i = 0; i < blades; i++) {
    const bAng = startAngle + i * step;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(bAng) * 340, Math.sin(bAng) * 340);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Desenha o campo de atração em espiral do Vórtice Colhedor (Vortex Harvest).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawHarvestField(ctx, e, frameCount) {
  const maxR = 320;
  const maxTime = e.isEnraged ? 75 : 95;
  const progress = Math.max(0, Math.min(1, 1 - (e.actionTimer / maxTime)));

  ctx.save();
  ctx.fillStyle = 'rgba(0, 206, 201, 0.06)';
  ctx.beginPath();
  ctx.arc(0, 0, maxR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 206, 201, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  const arms = 3;
  const spin = -frameCount * 0.05;
  ctx.lineWidth = 2;
  for (let a = 0; a < arms; a++) {
    const baseAng = spin + (a * Math.PI * 2 / arms);
    ctx.strokeStyle = `rgba(129, 236, 236, ${0.2 + (a % 2 === 0 ? 0.25 : 0.1)})`;
    ctx.beginPath();
    for (let step = 0; step < 16; step++) {
      const stepR = maxR * (1 - step / 16);
      const stepA = baseAng + step * 0.22;
      const sx = Math.cos(stepA) * stepR;
      const sy = Math.sin(stepA) * stepR;
      if (step === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  const shrinkR = Math.max(24, maxR * (1 - progress));
  ctx.strokeStyle = progress > 0.82 ? '#ffffff' : '#00cec9';
  ctx.lineWidth = progress > 0.82 ? 3.5 : 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, shrinkR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Desenha a corrente de almas e o círculo limite de ruptura do Vínculo de Almas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 */
export function drawSoulTetherBeam(ctx, e, bob) {
  if (!e.tetherActive) return;

  const targetX = player.x - e.x;
  const targetY = player.y - e.y;
  const originY = -12 + bob;

  ctx.save();

  // 1. Círculo Limite de Ruptura do Vínculo (310px) centrado no Ceifador
  const maxR = e.tetherMaxDist || 310;
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.40)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 8]);
  ctx.lineDashOffset = -performance.now() * 0.02;
  ctx.beginPath();
  ctx.arc(0, 0, maxR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Marcadores de pulso nas 4 direções cardeais do anel
  ctx.fillStyle = '#81ecec';
  for (let k = 0; k < 4; k++) {
    const ma = (k * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(ma) * maxR, Math.sin(ma) * maxR, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Feixe / Corrente de Almas entre Ceifador e Jogador
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
  ctx.lineWidth = 3.5;
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -performance.now() * 0.04;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 10]);
  ctx.lineDashOffset = performance.now() * 0.05;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Orbe / Ponto de conexão na vítima (Jogador)
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(targetX, targetY, 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 206, 201, 0.22)';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(targetX, targetY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Função principal de renderização gráfica exportada do Ceifador Supremo.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawSupremeReaper(ctx, e, frameCount) {
  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged || e.isPhase3;
  const isWindup = e.actionState === REAPER_STATES.WINDUP;
  const isHarvest = e.actionState === REAPER_STATES.VORTEX_HARVEST;
  const isAimingBlink = e.actionState === REAPER_STATES.BLINK_AIM;

  const bob = isVuln ? 22 : (e.floatBob || 0);

  // 1. ELEMENTOS E INDICADORES DO ESPAÇO DO MUNDO (Não invertidos horizontalmente)
  ctx.save();
  if (e.facing === -1) {
    ctx.scale(-1, 1);
  }

  if (isHarvest) {
    drawHarvestField(ctx, e, frameCount);
  }

  drawSoulScytheAimLines(ctx, e, frameCount);
  drawBlinkAimIndicator(ctx, e, frameCount);
  drawSoulTetherBeam(ctx, e, bob);
  drawGhostTrail(ctx, e);
  drawGothicLanterns(ctx, e, bob, frameCount, isEnraged);

  if (isVuln) drawRecoveryGliph(ctx, e, frameCount);

  ctx.restore();

  // 2. CORPO DO CHEFE (Espaço local com +X orientado para frente)
  ctx.save();

  if (isAimingBlink) {
    ctx.globalAlpha = 0.65 + Math.sin(frameCount * 0.3) * 0.25;
  }

  if (isWindup || isHarvest) {
    ctx.translate((Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 3.5);
  }

  drawReaperShadow(ctx, e, bob, isVuln);
  drawSpectralWings(ctx, e, bob, isVuln, isEnraged);
  drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged);
  drawRibcageAndCore(ctx, bob, frameCount, isVuln, isEnraged);
  drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged);
  drawOrnateScythe(ctx, e, bob, isVuln, isEnraged);

  ctx.restore();
}
