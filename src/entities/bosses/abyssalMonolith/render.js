/**
 * src/entities/bosses/abyssalMonolith/render.js
 * Pipeline de renderização gráfica procedural em Canvas 2D de "Ignis Lithos, o Titã de Basalto".
 */

import { MONOLITH_STATES } from './constants.js';

/**
 * Desenha a sombra projetada no chão sob o corpo megalítico.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {boolean} isVuln
 */
export function drawShadow(ctx, e, bob, isVuln) {
  const shadowY = 56 + (isVuln ? 12 : 0);
  const shadowRadius = (e.radius * 0.90) - (isVuln ? 0 : bob * 0.35);

  const grad = ctx.createRadialGradient(0, shadowY, 6, 0, shadowY, shadowRadius);
  grad.addColorStop(0, 'rgba(15, 8, 6, 0.70)');
  grad.addColorStop(0.65, 'rgba(25, 12, 8, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowRadius, shadowRadius * 0.40, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Renderiza as Fontes Termais residuais deixadas no chão após quebrar Litocistos.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} boss
 * @param {number} frameCount
 */
export function drawThermalVents(ctx, boss, frameCount) {
  for (let vent of boss.thermalVents) {
    if (!vent.active) continue;

    const relX = vent.x - boss.x;
    const relY = vent.y - boss.y;
    const pulse = Math.sin(frameCount * 0.08 + vent.pulsePhase) * 3;
    const curR = vent.radius + pulse;

    ctx.save();
    const grad = ctx.createRadialGradient(relX, relY, 4, relX, relY, curR);
    grad.addColorStop(0, 'rgba(241, 196, 15, 0.40)');
    grad.addColorStop(0.5, 'rgba(230, 126, 34, 0.20)');
    grad.addColorStop(1, 'rgba(211, 84, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(relX, relY, curR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(241, 196, 15, ${0.45 + pulse * 0.08})`;
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(relX, relY, curR * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2c3e50';
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(relX, relY - 12);
    ctx.lineTo(relX + 7, relY - 2);
    ctx.lineTo(relX, relY + 10);
    ctx.lineTo(relX - 7, relY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(relX, relY - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Desenha telegrafias animadas com clareza visual impecável (Slam frontal, Epicentro, Onda Externa e Giro).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawTelegraphsAndZones(ctx, e, frameCount) {
  // 1. Telegrafia do Esmagamento Frontal (Cone com Rachaduras)
  if (e.actionState === MONOLITH_STATES.WINDUP_SLAM) {
    const maxTimer = e.isPhase3 ? 34 : (e.isEnraged ? 40 : 48);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const aim = e.aimAngle || 0;
    const arcHalf = e.slamArc;
    const r = e.slamRadius;

    ctx.save();
    // Fundo do cone em brasa
    ctx.fillStyle = `rgba(231, 76, 60, ${0.12 + progress * 0.35})`;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.arc(0, 20, r, aim - arcHalf, aim + arcHalf);
    ctx.closePath();
    ctx.fill();

    // Contorno
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : (e.aimLocked ? '#ff1744' : '#f39c12');
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.arc(0, 20, r, aim - arcHalf, aim + arcHalf);
    ctx.stroke();

    // Linhas de fratura internas no cone
    const spineCount = 5;
    ctx.strokeStyle = `rgba(255, 234, 167, ${0.3 + progress * 0.6})`;
    ctx.lineWidth = 1.8;
    for (let s = 0; s < spineCount; s++) {
      const fracAng = aim - arcHalf + (s / (spineCount - 1)) * (arcHalf * 2);
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(Math.cos(fracAng) * (r * progress), 20 + Math.sin(fracAng) * (r * progress));
      ctx.stroke();
    }

    // Indicador visual de Mira Travada (Lock-in)
    if (e.aimLocked) {
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(Math.cos(aim) * (r * 0.75), 20 + Math.sin(aim) * (r * 0.75), 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Telegrafia do EPICENTRO (Solo sob o chefe rachando)
  if (e.actionState === MONOLITH_STATES.WINDUP_EPICENTER) {
    const maxTimer = e.isPhase3 ? 126 : (e.isEnraged ? 144 : 168);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const coreR = 115;

    ctx.save();
    // Chão sob o boss brilhando em calor crescente
    const epicGrad = ctx.createRadialGradient(0, 20, 10, 0, 20, coreR);
    epicGrad.addColorStop(0, `rgba(255, 23, 68, ${0.25 + progress * 0.45})`);
    epicGrad.addColorStop(0.7, `rgba(230, 126, 34, ${0.15 + progress * 0.35})`);
    epicGrad.addColorStop(1, 'rgba(211, 84, 0, 0)');
    ctx.fillStyle = epicGrad;
    ctx.beginPath();
    ctx.arc(0, 20, coreR, 0, Math.PI * 2);
    ctx.fill();

    // Linhas de fratura em zig-zag sob o boss
    const crackCount = 8;
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#ff4757';
    ctx.lineWidth = 2.4;
    for (let c = 0; c < crackCount; c++) {
      const ca = (c * Math.PI * 2) / crackCount;
      const cDist = coreR * (0.3 + progress * 0.7);
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(Math.cos(ca) * (cDist * 0.5) + (c % 2 === 0 ? 5 : -5), 20 + Math.sin(ca) * (cDist * 0.5));
      ctx.lineTo(Math.cos(ca) * cDist, 20 + Math.sin(ca) * cDist);
      ctx.stroke();
    }

    // Anel de aviso que contrai indicando o momento exato da explosão
    const contractR = coreR + (coreR * 0.6) * (1 - progress);
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#f39c12';
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.2;
    ctx.beginPath();
    ctx.arc(0, 20, contractR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Telegrafia da ONDA EXTERNA (O centro já explodiu e é SEGURO; o anel externo vai estourar!)
  if (e.actionState === MONOLITH_STATES.PROPAGATING_SURGE) {
    const maxTimer = e.isPhase3 ? 96 : (e.isEnraged ? 114 : 135);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));

    ctx.save();
    // Centro Seguro (Safe Zone de 0 a 115px) sinalizado com contorno verde/dourado suave
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.75)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 20, 115, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Anel Externo de Perigo (140px a 245px) com expansão e estacas de pedra
    ctx.fillStyle = `rgba(230, 126, 34, ${0.10 + progress * 0.30})`;
    ctx.beginPath();
    ctx.arc(0, 20, 245, 0, Math.PI * 2);
    ctx.arc(0, 20, 140, 0, Math.PI * 2, true);
    ctx.fill();

    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#ff4757';
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.arc(0, 20, 140 + (245 - 140) * progress, 0, Math.PI * 2);
    ctx.stroke();

    // Estacas de basalto emergindo no anel externo
    const spikeCount = 12;
    ctx.fillStyle = '#2c3e50';
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1.5;
    for (let sp = 0; sp < spikeCount; sp++) {
      const sa = (sp * Math.PI * 2) / spikeCount + (frameCount * 0.01);
      const sDist = 190;
      const sx = Math.cos(sa) * sDist;
      const sy = 20 + Math.sin(sa) * sDist;
      const spikeH = 14 * progress;

      ctx.beginPath();
      ctx.moveTo(sx - 6, sy);
      ctx.lineTo(sx, sy - spikeH);
      ctx.lineTo(sx + 6, sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Telegrafia da Varredura de Placas (Plate Whirl)
  if (e.actionState === MONOLITH_STATES.WINDUP_WHIRL) {
    const maxTimer = e.isPhase3 ? 28 : (e.isEnraged ? 32 : 38);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const whirlR = 105;

    ctx.save();
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#ff1744';
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.2;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, 20, whirlR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(255, 23, 68, ${0.12 + progress * 0.28})`;
    ctx.beginPath();
    ctx.arc(0, 20, whirlR * progress, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Desenha as placas tectônicas articuladas que flutuam dinamicamente ao redor do corpo.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isWindup
 */
export function drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup) {
  const isP3 = e.isPhase3;

  let plateColDark = isVuln ? '#151b1e' : (isP3 ? '#3a080d' : (isEnraged ? '#2d0f12' : '#1e272e'));
  let plateColLight = isVuln ? '#242b30' : (isP3 ? '#5c1018' : (isEnraged ? '#45161b' : '#2f3640'));
  let trimCol = isVuln ? '#57606f' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22'));

  for (let i = 0; i < e.floatingPlates.length; i++) {
    const p = e.floatingPlates[i];
    let px = 0;
    let py = 0;
    let rot = 0;

    if (e.actionState === MONOLITH_STATES.WINDUP_SLAM) {
      // Martelos erguidos no alto
      const lift = Math.sin(frameCount * 0.3) * 4;
      const spread = (i - 1.5) * 22;
      px = spread;
      py = -82 + bob + lift + Math.abs(spread) * 0.25;
      rot = spread / 45;
    } else if (e.actionState === MONOLITH_STATES.WINDUP_EPICENTER) {
      // Placas fincadas na base
      const pAng = p.angleOffset + frameCount * 0.02;
      px = Math.cos(pAng) * 72;
      py = 32 + bob + Math.sin(pAng) * 20;
      rot = pAng;
    } else if (e.actionState === MONOLITH_STATES.WINDUP_WHIRL) {
      // Placas girando em lâminas afiadas
      const spinAng = p.angleOffset + frameCount * 0.25;
      px = Math.cos(spinAng) * 95;
      py = Math.sin(spinAng) * 55 + bob;
      rot = spinAng + Math.PI / 2;
    } else if (e.actionState === MONOLITH_STATES.CHANNELING_SIPHON) {
      const fastAng = p.angleOffset - frameCount * 0.14;
      px = Math.cos(fastAng) * 65;
      py = Math.sin(fastAng) * 36 + bob;
      rot = fastAng + Math.PI / 2;
    } else if (isVuln) {
      const fallOffset = (i - 1.5) * 36;
      px = fallOffset;
      py = 48 + bob + (i % 2 === 0 ? 8 : -4);
      rot = (i - 1.5) * 0.35;
    } else {
      const pAng = p.angleOffset + (frameCount * (isP3 ? 0.032 : (isEnraged ? 0.024 : 0.016)));
      const wobble = Math.sin(frameCount * 0.08 + p.wobblePhase) * 4.5;
      const currentDist = p.baseDist + wobble;
      px = Math.cos(pAng) * currentDist;
      py = (Math.sin(pAng) * (currentDist * 0.45)) + bob;
      rot = pAng + Math.PI / 2;
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);

    const sz = p.size;
    ctx.fillStyle = plateColDark;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.6, -sz * 0.5);
    ctx.lineTo(sz * 0.6, -sz * 0.5);
    ctx.lineTo(sz * 0.4, sz * 0.5);
    ctx.lineTo(-sz * 0.4, sz * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = plateColLight;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.6, -sz * 0.5);
    ctx.lineTo(0, -sz * 0.3);
    ctx.lineTo(sz * 0.6, -sz * 0.5);
    ctx.closePath();
    ctx.fill();

    if (!isVuln) {
      ctx.strokeStyle = trimCol;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.25, 0);
      ctx.lineTo(sz * 0.25, 0);
      ctx.moveTo(0, -sz * 0.25);
      ctx.lineTo(0, sz * 0.25);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Desenha as veias de magma pulsantes na face do monólito.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 */
export function drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged, isP3) {
  if (isVuln) {
    ctx.strokeStyle = '#273c75';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-12, -32 + bob);
    ctx.lineTo(-24, -10 + bob);
    ctx.lineTo(-10, 16 + bob);
    ctx.moveTo(12, -32 + bob);
    ctx.lineTo(24, -10 + bob);
    ctx.lineTo(10, 16 + bob);
    ctx.stroke();
    return;
  }

  const pulse = Math.sin(frameCount * (isP3 ? 0.24 : (isEnraged ? 0.18 : 0.09)));
  const veinColPrimary = isP3 ? '#ff1744' : (isEnraged ? '#e74c3c' : '#d35400');
  const veinColGlow    = isP3 ? '#ff9f43' : (isEnraged ? '#f1c40f' : '#f39c12');

  ctx.strokeStyle = veinColPrimary;
  ctx.lineWidth = 2.4 + pulse * 0.7;
  ctx.beginPath();

  ctx.moveTo(-6, -44 + bob);
  ctx.lineTo(-26, -14 + bob);
  ctx.lineTo(-14, 22 + bob);

  ctx.moveTo(6, -44 + bob);
  ctx.lineTo(26, -14 + bob);
  ctx.lineTo(14, 22 + bob);

  ctx.moveTo(-10, 32 + bob);
  ctx.lineTo(0, 44 + bob);
  ctx.lineTo(10, 32 + bob);
  ctx.stroke();

  ctx.strokeStyle = veinColGlow;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

/**
 * Desenha o corpo do megalito de basalto com facetas poliédricas e iluminação procedural.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 */
export function drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged, isP3) {
  const basaltShadow = isVuln ? '#0e1214' : (isP3 ? '#1c0306' : (isEnraged ? '#1e0508' : '#1a2228'));
  const basaltMid    = isVuln ? '#1a2126' : (isP3 ? '#2e070c' : (isEnraged ? '#2c080d' : '#27313a'));
  const basaltLight  = isVuln ? '#28333b' : (isP3 ? '#4a0d14' : (isEnraged ? '#420f15' : '#3d4b56'));
  const edgeTrim     = isVuln ? '#4b5760' : (isP3 ? '#ff3838' : (isEnraged ? '#ff4757' : '#718093'));

  const topY = -64 + bob;
  const waistY = -6 + bob;
  const botY = 48 + bob;

  ctx.fillStyle = basaltShadow;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-44, waistY);
  ctx.lineTo(-24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = basaltLight;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(44, waistY);
  ctx.lineTo(24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = basaltMid;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-18, waistY + 4);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(18, waistY + 4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = edgeTrim;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-44, waistY);
  ctx.lineTo(-24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(24, botY);
  ctx.lineTo(44, waistY);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(0, botY + 6);
  ctx.stroke();

  drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged, isP3);
}

/**
 * Desenha o Núcleo Abissal radiante no centro do peito de Ignis Lithos.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 * @param {boolean} isChanneling
 * @param {boolean} isWindup
 */
export function drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isChanneling, isWindup) {
  const coreY = -4 + bob;
  let coreBaseRadius = isVuln ? 9 : (isChanneling ? 27 : 17);
  if (isWindup) coreBaseRadius += 4;

  const pulse = isVuln ? 0 : Math.sin(frameCount * (isP3 ? 0.28 : (isEnraged ? 0.20 : 0.12))) * 2.8;
  const currentR = Math.max(6, coreBaseRadius + pulse);

  ctx.strokeStyle = isVuln ? '#2f3640' : (isChanneling ? '#e67e22' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#f39c12')));
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, coreY, currentR + 4, 0, Math.PI * 2);
  ctx.stroke();

  const grad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, currentR);
  if (isVuln) {
    grad.addColorStop(0, '#57606f');
    grad.addColorStop(0.7, '#1e272e');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else if (isP3) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ff4757');
    grad.addColorStop(0.8, '#8b0000');
    grad.addColorStop(1, 'rgba(139, 0, 0, 0)');
  } else if (isEnraged || isChanneling) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, '#ff9f43');
    grad.addColorStop(0.85, '#c0392b');
    grad.addColorStop(1, 'rgba(192, 57, 43, 0)');
  } else {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#f1c40f');
    grad.addColorStop(0.85, '#d35400');
    grad.addColorStop(1, 'rgba(211, 84, 0, 0)');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, coreY, currentR, 0, Math.PI * 2);
  ctx.fill();

  if (!isVuln) {
    ctx.fillStyle = '#1e0508';
    ctx.beginPath();
    ctx.ellipse(0, coreY, 2.5, currentR * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Desenha as orbes orbitais (Litocistos) e conexões etéreas ao redor do chefe.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 */
export function drawLitocistos(ctx, e, bob, frameCount, isEnraged, isP3) {
  const coreY = -4 + bob;

  for (let o of e.orbitals) {
    if (!o.active) continue;

    const ox = Math.cos(o.angle) * o.dist;
    const oy = Math.sin(o.angle) * o.dist + bob;

    ctx.save();
    ctx.strokeStyle = isP3 ? 'rgba(255, 23, 68, 0.45)' : (isEnraged ? 'rgba(255, 71, 87, 0.40)' : 'rgba(230, 126, 34, 0.35)');
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, coreY);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(ox, oy);

    if (o.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, o.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = isP3 ? '#3d080c' : (isEnraged ? '#2d0f12' : '#2f3640');
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22');
      ctx.lineWidth = 2.0;
      ctx.stroke();

      const orbGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, o.radius * 0.65);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.5, isP3 ? '#ff4d4d' : (isEnraged ? '#ff6b81' : '#f1c40f'));
      orbGrad.addColorStop(1, isP3 ? '#8b0000' : (isEnraged ? '#c0392b' : '#d35400'));
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      const hpPct = Math.max(0, o.hp / o.maxHp);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius + 4, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPct));
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Função principal de renderização gráfica exportada de Ignis Lithos.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawAbyssalMonolith(ctx, e, frameCount) {
  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged;
  const isP3 = e.isPhase3;
  const isWindup = e.actionState.startsWith('WINDUP');
  const isChanneling = e.actionState === MONOLITH_STATES.CHANNELING_SIPHON;

  const bob = isVuln ? 24 : (e.floatBob || 0);

  // 1. Elementos em Coordenadas de Mundo Absolutas (Desespelhadas)
  ctx.save();
  if (e.facing === -1) {
    ctx.scale(-1, 1);
  }

  // Renderização das Fontes Termais no Solo
  drawThermalVents(ctx, e, frameCount);

  // Telegrafias exclusivas do chefe (Epicentro, Onda de Fendas, Slam e Giro)
  drawTelegraphsAndZones(ctx, e, frameCount);

  // Orbes Orbitais (Litocistos)
  drawLitocistos(ctx, e, bob, frameCount, isEnraged, isP3);

  ctx.restore();

  // 2. Renderização do Corpo do Chefe (Orientado em e.facing)
  ctx.save();

  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.8);
  }

  drawShadow(ctx, e, bob, isVuln);
  drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup);
  drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged, isP3);
  drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isChanneling, isWindup);

  ctx.restore();
}
