/**
 * src/entities/bosses/abyssalMonolith/render.js
 * Pipeline de renderização gráfica procedural em Canvas 2D de "Ignis Lithos, o Titã de Basalto".
 */

import { MONOLITH_STATES } from './constants.js';
import { dpr, viewW, viewH } from '../../../main.js';

/**
 * Renderiza o Banner Cinematográfico de Título de "Ignis Lithos, o Titã de Basalto"
 * no topo da tela com tipografia majestosa, estética de basalto e ouro derretido.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawCinematicScreenTitle(ctx, e, frameCount) {
  const maxT = e.titleMaxTimer || 180;
  const titleProgress = 1 - Math.max(0, e.titleTimer / maxT);

  let bannerAlpha = 1.0;
  if (titleProgress < 0.10) {
    bannerAlpha = titleProgress / 0.10;
  } else if (titleProgress > 0.80) {
    bannerAlpha = Math.max(0, (1 - titleProgress) / 0.20);
  }

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = bannerAlpha;

  const screenW = viewW || (typeof window !== 'undefined' ? window.innerWidth : 1280);
  const screenH = viewH || (typeof window !== 'undefined' ? window.innerHeight : 800);
  const isVertical = screenH > screenW || screenW < 640;

  const bannerW = isVertical ? Math.min(380, screenW * 0.94) : Math.min(860, screenW * 0.90);
  const bannerH = isVertical ? 62 : 98;
  const bx = (screenW - bannerW) / 2;
  const by = Math.round((screenH / 2) - bannerH - (isVertical ? 45 : 75));

  // 1. Fundo Gradiente de Basalto e Obsidiana Vulcânica
  const bgGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  bgGrad.addColorStop(0, 'rgba(12, 6, 4, 0)');
  bgGrad.addColorStop(0.18, 'rgba(25, 12, 6, 0.95)');
  bgGrad.addColorStop(0.5, 'rgba(54, 18, 6, 0.98)');
  bgGrad.addColorStop(0.82, 'rgba(25, 12, 6, 0.95)');
  bgGrad.addColorStop(1, 'rgba(12, 6, 4, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(bx, by, bannerW, bannerH);

  // 2. Frisos de Magma Incandescente e Ouro Primordial
  const borderGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  borderGrad.addColorStop(0, 'rgba(230, 126, 34, 0)');
  borderGrad.addColorStop(0.2, 'rgba(230, 126, 34, 0.95)');
  borderGrad.addColorStop(0.5, 'rgba(243, 156, 18, 1)');
  borderGrad.addColorStop(0.8, 'rgba(230, 126, 34, 0.95)');
  borderGrad.addColorStop(1, 'rgba(230, 126, 34, 0)');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isVertical ? 2.0 : 3.0;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bannerW, by);
  ctx.moveTo(bx, by + bannerH);
  ctx.lineTo(bx + bannerW, by + bannerH);
  ctx.stroke();

  // Frisos internos dourados finos
  ctx.strokeStyle = 'rgba(241, 196, 15, 0.45)';
  ctx.lineWidth = 1.2;
  const padX = isVertical ? 24 : 45;
  ctx.beginPath();
  ctx.moveTo(bx + padX, by + 4);
  ctx.lineTo(bx + bannerW - padX, by + 4);
  ctx.moveTo(bx + padX, by + bannerH - 4);
  ctx.lineTo(bx + bannerW - padX, by + bannerH - 4);
  ctx.stroke();

  // Cantoneiras Geométricas de Basalto e Ouro
  const cornerSize = isVertical ? 12 : 18;
  ctx.fillStyle = '#e67e22';
  ctx.fillRect(bx + padX * 0.7, by - 2, cornerSize, 4);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by - 2, cornerSize, 4);
  ctx.fillRect(bx + padX * 0.7, by + bannerH - 2, cornerSize, 4);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by + bannerH - 2, cornerSize, 4);

  // Ornamento Central Superior: Diamante Monolítico de Basalto & Olho de Fogo
  ctx.fillStyle = '#1e272e';
  ctx.beginPath();
  ctx.moveTo(screenW / 2, by - 10);
  ctx.lineTo(screenW / 2 + 12, by);
  ctx.lineTo(screenW / 2, by + 10);
  ctx.lineTo(screenW / 2 - 12, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f39c12';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.fillStyle = '#ff793f';
  ctx.beginPath();
  ctx.arc(screenW / 2, by, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Tipografia Majestosa
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = '#e67e22';
  ctx.shadowBlur = isVertical ? 10 : 18;
  ctx.font = isVertical ? '900 21px "Cinzel", "Times New Roman", serif' : '900 34px "Cinzel", "Times New Roman", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('MONÓLITO ABISSAL', screenW / 2, by + (isVertical ? 22 : 36));

  ctx.shadowBlur = 0;
  ctx.font = isVertical ? '600 10px "Cinzel", sans-serif' : '700 13px "Cinzel", sans-serif';
  ctx.letterSpacing = isVertical ? '3px' : '6px';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText('IGNIS LITHOS, O TITÃ DE BASALTO', screenW / 2, by + (isVertical ? 45 : 71));
  ctx.letterSpacing = '0px';

  ctx.restore();
}

/**
 * Renderiza a introdução cinematográfica de 5 segundos (4 Atos) do Monólito Abissal.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawMonolithSpawnIntro(ctx, e, frameCount) {
  const introMax = e.introDuration || 300;
  const progress = Math.min(1.0, Math.max(0, 1 - (e.introTimer / introMax)));

  // =========================================================================
  // ATO 1: FRATURA TECTÔNICA E LAGO DE MAGMA (0.00 <= progress < 0.25)
  // =========================================================================
  if (progress < 0.25) {
    const act1Prog = progress / 0.25;
    const fissureR = e.radius * (1.0 + act1Prog * 1.2);

    ctx.save();
    // Calha de magma no solo (Elipse 2.5D)
    ctx.translate(0, 48);
    ctx.scale(1, 0.44);

    const magGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, fissureR);
    magGrad.addColorStop(0, `rgba(255, 234, 167, ${0.4 + act1Prog * 0.5})`);
    magGrad.addColorStop(0.35, `rgba(230, 126, 34, ${0.4 + act1Prog * 0.4})`);
    magGrad.addColorStop(0.75, `rgba(192, 57, 43, ${0.3 + act1Prog * 0.4})`);
    magGrad.addColorStop(1, 'rgba(26, 10, 5, 0)');
    ctx.fillStyle = magGrad;
    ctx.beginPath();
    ctx.arc(0, 0, fissureR, 0, Math.PI * 2);
    ctx.fill();

    // Fraturas tectônicas radiais rachando o solo
    const crackCount = 10;
    ctx.strokeStyle = `rgba(243, 156, 18, ${0.5 + act1Prog * 0.5})`;
    ctx.lineWidth = 2.8;
    for (let c = 0; c < crackCount; c++) {
      const ca = (c * Math.PI * 2) / crackCount;
      const cDist = fissureR * (0.4 + act1Prog * 0.6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ca) * (cDist * 0.5) + (c % 2 === 0 ? 8 : -8), Math.sin(ca) * (cDist * 0.5));
      ctx.lineTo(Math.cos(ca) * cDist, Math.sin(ca) * cDist);
      ctx.stroke();
    }

    // Bolhas de lava e faíscas incandescentes borbulhando do solo
    const bubbleCount = 6;
    for (let b = 0; b < bubbleCount; b++) {
      const bProgress = ((frameCount * 0.05 + b / bubbleCount) % 1);
      const bAng = b * 1.1 + frameCount * 0.02;
      const bDist = (b * 14) % (fissureR * 0.7);
      const bx = Math.cos(bAng) * bDist;
      const by = Math.sin(bAng) * bDist;
      const bR = Math.max(1, 6 * (1 - bProgress));

      ctx.fillStyle = bProgress > 0.7 ? '#ffffff' : '#f39c12';
      ctx.beginPath();
      ctx.arc(bx, by, bR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Fumaça vulcânica e cinzas subindo
    ctx.save();
    const smokeCount = 8;
    for (let s = 0; s < smokeCount; s++) {
      const sProgress = ((frameCount * 0.02 + s / smokeCount) % 1);
      const sX = Math.sin(s * 1.7 + frameCount * 0.04) * (25 + s * 4);
      const sY = 48 - sProgress * 120;
      const sR = 8 + sProgress * 22;
      ctx.fillStyle = `rgba(44, 30, 24, ${Math.max(0, (1 - sProgress) * 0.45 * act1Prog)})`;
      ctx.beginPath();
      ctx.arc(sX, sY, sR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // =========================================================================
  // ATO 2: ASCENSÃO DO TITÃ DE BASALTO (0.25 <= progress < 0.52)
  // =========================================================================
  if (progress < 0.52) {
    const act2Prog = (progress - 0.25) / 0.27;
    const easeRise = Math.sin(act2Prog * Math.PI * 0.5);
    const riseY = (1 - easeRise) * 140; // Do subsolo até a posição de levitação

    // 1. Caldeira de magma borbulhante e expansão tectônica
    ctx.save();
    ctx.translate(0, 48);
    ctx.scale(1, 0.44);

    const calderaR = e.radius * 2.2;
    const calGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, calderaR);
    calGrad.addColorStop(0, '#ffffff');
    calGrad.addColorStop(0.2, '#f39c12');
    calGrad.addColorStop(0.6, '#d35400');
    calGrad.addColorStop(0.9, '#270c06');
    calGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = calGrad;
    ctx.beginPath();
    ctx.arc(0, 0, calderaR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, calderaR * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Chunks de rocha de basalto sendo arremessados para o alto
    ctx.save();
    const rockCount = 6;
    for (let r = 0; r < rockCount; r++) {
      const rProg = ((frameCount * 0.04 + r / rockCount) % 1);
      const rAng = r * 1.05 - 1.5;
      const rDist = 35 + r * 12;
      const rx = Math.cos(rAng) * rDist;
      const ry = 48 - (Math.sin(rProg * Math.PI) * 80) + (r % 2 === 0 ? 10 : -10);
      ctx.fillStyle = '#1e272e';
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(rx, ry, 5 * (1 - rProg * 0.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 3. Monólito e Manoplas Subindo das Profundezas
    ctx.save();
    ctx.translate(0, riseY);

    // Corpo emergindo
    drawMegalithBody(ctx, e, 0, frameCount, false, false, false);
    drawAbyssalCore(ctx, e, 0, frameCount, false, false, false, false, false);

    // Manoplas erguendo-se dos lados
    const riseGauntlets = {
      left: { x: -62, y: 15, rot: -0.3 },
      right: { x: 62, y: 15, rot: 0.3 }
    };
    drawFloatingGauntlets(ctx, { ...e, gauntlets: riseGauntlets }, 0, frameCount, false, false, false, false);

    ctx.restore();
    return;
  }

  // =========================================================================
  // ATO 3: CONJUNÇÃO TECTÔNICA & LITOCISTOS EM IGNIÇÃO (0.52 <= progress < 0.78)
  // =========================================================================
  if (progress < 0.78) {
    const act3Prog = (progress - 0.52) / 0.26;
    const bob = Math.sin(frameCount * 0.08) * 4;

    // Sombra no chão estabilizada
    drawShadow(ctx, e, bob, false);

    // Placas tectônicas convergindo do exterior para suas órbitas normais
    const plateSpread = (1 - act3Prog) * 80;
    ctx.save();
    const tempPlates = e.floatingPlates.map(p => ({
      ...p,
      baseDist: p.baseDist + plateSpread
    }));
    drawFloatingPlates(ctx, { ...e, floatingPlates: tempPlates }, bob, frameCount, false, false, false);
    ctx.restore();

    // Litocistos descendo dos céus em fogo meteórico para órbita
    ctx.save();
    for (let o of e.orbitals) {
      if (!o.active) continue;
      const meteorOffset = (1 - act3Prog) * 160;
      const ox = Math.cos(o.angle) * o.dist;
      const oy = Math.sin(o.angle) * o.dist + bob - meteorOffset;

      // Cauda de rastro de fogo
      const tailGrad = ctx.createLinearGradient(ox, oy - 40, ox, oy);
      tailGrad.addColorStop(0, 'rgba(230, 126, 34, 0)');
      tailGrad.addColorStop(1, 'rgba(243, 156, 18, 0.85)');
      ctx.strokeStyle = tailGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ox, oy - 40);
      ctx.lineTo(ox, oy);
      ctx.stroke();

      // Meteoro Litocisto em si
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.arc(ox, oy, o.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    ctx.restore();

    // Corpo e Manoplas
    drawMegalithBody(ctx, e, bob, frameCount, false, false, false);
    drawAbyssalCore(ctx, e, bob, frameCount, false, false, false, true, false);

    const readyGauntlets = {
      left: { x: -62, y: -8 + Math.sin(frameCount * 0.1) * 3, rot: -0.15 },
      right: { x: 62, y: -8 - Math.sin(frameCount * 0.1) * 3, rot: 0.15 }
    };
    drawFloatingGauntlets(ctx, { ...e, gauntlets: readyGauntlets }, bob, frameCount, false, false, false, false);

    return;
  }

  // =========================================================================
  // ATO 4: ESMAGAMENTO PRIMORDIAL & DESPERTAR (0.78 <= progress <= 1.00)
  // =========================================================================
  const act4Prog = (progress - 0.78) / 0.22;
  const bob = Math.sin(frameCount * 0.08) * 3;

  drawShadow(ctx, e, bob, false);
  drawFloatingPlates(ctx, e, bob, frameCount, false, false, false);
  drawLitocistos(ctx, e, bob, frameCount, false, false);
  drawMegalithBody(ctx, e, bob, frameCount, false, false, false);
  drawAbyssalCore(ctx, e, bob, frameCount, false, false, false, false, act4Prog < 0.6);

  // Animação de erguer e bater as manoplas titânicas
  let gY = -8;
  let gRot = 0.15;
  if (act4Prog < 0.60) {
    // Erguendo alto no ar
    const liftProg = act4Prog / 0.60;
    gY = -8 - liftProg * 65;
    gRot = 0.15 + liftProg * 0.4;
  } else {
    // Esmagando violentamente no solo
    const slamProg = (act4Prog - 0.60) / 0.40;
    gY = -73 + slamProg * 115;
    gRot = 0.55 - slamProg * 0.7;
  }

  const slamGauntlets = {
    left: { x: -62, y: gY, rot: -gRot },
    right: { x: 62, y: gY, rot: gRot }
  };
  drawFloatingGauntlets(ctx, { ...e, gauntlets: slamGauntlets }, bob, frameCount, false, false, false, act4Prog < 0.6);

  // Onda de Choque Telúrica massiva expandindo no solo ao atingir act4Prog >= 0.70
  if (act4Prog >= 0.70) {
    const shockProg = (act4Prog - 0.70) / 0.30;
    const shockR = shockProg * 320;
    const shockAlpha = Math.max(0, 1 - shockProg);

    ctx.save();
    ctx.translate(0, 48);
    ctx.scale(1, 0.42);

    // Anel externo ardente
    ctx.strokeStyle = `rgba(255, 234, 167, ${shockAlpha * 0.95})`;
    ctx.lineWidth = 6 * (1 - shockProg * 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, shockR, 0, Math.PI * 2);
    ctx.stroke();

    // Anel de magma secundário
    ctx.strokeStyle = `rgba(230, 126, 34, ${shockAlpha * 0.75})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, shockR * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    // Fagulhas voando ao longo do anel
    ctx.fillStyle = '#ffffff';
    for (let sp = 0; sp < 12; sp++) {
      const sa = sp * (Math.PI * 2 / 12) + frameCount * 0.1;
      ctx.fillRect(Math.cos(sa) * shockR - 2, Math.sin(sa) * shockR - 2, 4, 4);
    }

    ctx.restore();
  }
}

/**
 * Renderiza as Manoplas Primordiais flutuantes (punhos de basalto levitantes e garras pétreas).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 * @param {boolean} isWindup
 */
export function drawFloatingGauntlets(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isWindup) {
  const gauntlets = e.gauntlets || {
    left: { x: -62, y: -8, rot: -0.15 },
    right: { x: 62, y: -8, rot: 0.15 }
  };

  const basaltDark  = isVuln ? '#151b1e' : (isP3 ? '#3a080d' : (isEnraged ? '#2d0f12' : '#1e272e'));
  const basaltMid   = isVuln ? '#242b30' : (isP3 ? '#5c1018' : (isEnraged ? '#45161b' : '#2f3640'));
  const basaltLight = isVuln ? '#38424a' : (isP3 ? '#821824' : (isEnraged ? '#612028' : '#45505b'));
  const trimCol     = isVuln ? '#57606f' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22'));
  const glowCol     = isVuln ? 'transparent' : (isP3 ? '#ff7675' : (isEnraged ? '#ff9f43' : '#f1c40f'));

  for (let side of ['left', 'right']) {
    const g = gauntlets[side];
    if (!g) continue;
    const isLeft = side === 'left';
    const sign = isLeft ? -1 : 1;

    ctx.save();
    ctx.translate(g.x, g.y + bob);
    ctx.rotate(g.rot);

    // 1. Fragmentos de basalto orbitando o pulso da manopla
    if (!isVuln) {
      const orbWobble = frameCount * 0.08 + (isLeft ? 0 : Math.PI);
      const fx = Math.cos(orbWobble) * 18;
      const fy = -22 + Math.sin(orbWobble) * 8;
      ctx.fillStyle = basaltMid;
      ctx.beginPath();
      ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Placa do Antebraço / Punho de Rocha Facetada
    // Faceta Sombreada (Face exterior)
    ctx.fillStyle = basaltDark;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(sign * -16, -18);
    ctx.lineTo(sign * -14, 10);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fill();

    // Faceta Central Iluminada
    ctx.fillStyle = basaltLight;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(sign * 16, -18);
    ctx.lineTo(sign * 14, 10);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fill();

    // Crista Central da Manopla
    ctx.fillStyle = basaltMid;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(sign * -8, -12);
    ctx.lineTo(0, 14);
    ctx.lineTo(sign * 8, -12);
    ctx.closePath();
    ctx.fill();

    // Contorno cinzelado
    ctx.strokeStyle = trimCol;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(sign * -16, -18);
    ctx.lineTo(sign * -14, 10);
    ctx.lineTo(0, 16);
    ctx.lineTo(sign * 14, 10);
    ctx.lineTo(sign * 16, -18);
    ctx.closePath();
    ctx.stroke();

    // Linha divisória longitudinal
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(0, 16);
    ctx.stroke();

    // 3. Garras / Dedos de Basalto Articulados
    const fingerCount = 3;
    for (let f = 0; f < fingerCount; f++) {
      const fx = (f - 1) * 7 * sign;
      const fy = 16;
      const fLen = 12 + (f === 1 ? 4 : 0);

      ctx.fillStyle = basaltMid;
      ctx.strokeStyle = trimCol;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(fx - 3, fy);
      ctx.lineTo(fx + 3, fy);
      ctx.lineTo(fx + (sign * 1.5), fy + fLen);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ponta em brasa se não estiver vulnerável
      if (!isVuln && (isEnraged || isP3 || isWindup)) {
        ctx.fillStyle = glowCol;
        ctx.beginPath();
        ctx.arc(fx + (sign * 1.5), fy + fLen - 1, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Fratura de Magma Incandescente nos Nós dos Dedos
    if (!isVuln) {
      const pulse = Math.sin(frameCount * 0.15 + (isLeft ? 0 : 2)) * 0.5;
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = 2.0 + pulse;
      ctx.beginPath();
      ctx.moveTo(sign * -10, 8);
      ctx.lineTo(sign * -3, 6);
      ctx.lineTo(sign * 4, 9);
      ctx.lineTo(sign * 10, 7);
      ctx.stroke();
    }

    ctx.restore();
  }
}

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
 * Desenha o corpo do megalito de basalto com facetas poliédricas 2.5D,
 * coroa vulcânica escarpada com fumaça e runas petroglíficas de magma.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 */
export function drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged, isP3) {
  const basaltShadow = isVuln ? '#0e1214' : (isP3 ? '#1c0306' : (isEnraged ? '#1e0508' : '#141c22'));
  const basaltMid    = isVuln ? '#1a2126' : (isP3 ? '#2e070c' : (isEnraged ? '#2c080d' : '#222c35'));
  const basaltLight  = isVuln ? '#28333b' : (isP3 ? '#4a0d14' : (isEnraged ? '#420f15' : '#33414d'));
  const edgeTrim     = isVuln ? '#4b5760' : (isP3 ? '#ff3838' : (isEnraged ? '#ff4757' : '#718093'));

  const topY = -68 + bob;
  const waistY = -6 + bob;
  const botY = 50 + bob;

  // 1. Tier 1: Plinto / Base Hexagonal Inferior
  ctx.fillStyle = basaltShadow;
  ctx.beginPath();
  ctx.moveTo(-32, botY);
  ctx.lineTo(-44, botY + 12);
  ctx.lineTo(0, botY + 20);
  ctx.lineTo(0, botY + 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = basaltMid;
  ctx.beginPath();
  ctx.moveTo(32, botY);
  ctx.lineTo(44, botY + 12);
  ctx.lineTo(0, botY + 20);
  ctx.lineTo(0, botY + 6);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = edgeTrim;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-44, botY + 12);
  ctx.lineTo(0, botY + 20);
  ctx.lineTo(44, botY + 12);
  ctx.stroke();

  // 2. Tier 2: Corpo do Obelisco Central 2.5D Multifacetado
  // Faceta Esquerda (Sombra densa de basalto)
  ctx.fillStyle = basaltShadow;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-48, waistY);
  ctx.lineTo(-28, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  // Faceta Direita (Iluminada)
  ctx.fillStyle = basaltLight;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(48, waistY);
  ctx.lineTo(28, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  // Faceta Central (Relevo / Quilha frontal do monólito)
  ctx.fillStyle = basaltMid;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-20, waistY + 6);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(20, waistY + 6);
  ctx.closePath();
  ctx.fill();

  // Biséis e chanfros angulares externos
  ctx.strokeStyle = edgeTrim;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-48, waistY);
  ctx.lineTo(-28, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(28, botY);
  ctx.lineTo(48, waistY);
  ctx.closePath();
  ctx.stroke();

  // Quilha vertical e linhas estruturais de relevo
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(0, botY + 6);
  ctx.moveTo(0, topY);
  ctx.lineTo(-20, waistY + 6);
  ctx.lineTo(0, botY + 6);
  ctx.moveTo(0, topY);
  ctx.lineTo(20, waistY + 6);
  ctx.lineTo(0, botY + 6);
  ctx.stroke();

  // 3. Tier 3: Coroa Vulcânica Escarpada (Chifres e Espigões de Obsidiana)
  const crownSpires = [
    { x: 0, yOffset: -26, w: 9 },      // Espigão Central Maior
    { x: -14, yOffset: -18, w: 7 },   // Espigão Médio Esquerdo
    { x: 14, yOffset: -18, w: 7 },    // Espigão Médio Direito
    { x: -26, yOffset: -10, w: 6 },   // Chifre Lateral Esquerdo
    { x: 26, yOffset: -10, w: 6 }     // Chifre Lateral Direito
  ];

  for (let sp of crownSpires) {
    const tipY = topY + sp.yOffset;
    ctx.fillStyle = basaltShadow;
    ctx.beginPath();
    ctx.moveTo(sp.x - sp.w, topY);
    ctx.lineTo(sp.x, tipY);
    ctx.lineTo(sp.x + sp.w, topY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = edgeTrim;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Pontas incandescentes na coroa
    if (!isVuln) {
      ctx.fillStyle = isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22');
      ctx.beginPath();
      ctx.arc(sp.x, tipY + 2, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Fagulhas e cinzas térmicas emanando da coroa
  if (!isVuln) {
    ctx.fillStyle = isP3 ? '#ff7675' : '#f39c12';
    for (let c = 0; c < 4; c++) {
      const cProg = ((frameCount * 0.05 + c * 0.25) % 1);
      const cx = Math.sin(frameCount * 0.1 + c) * 22;
      const cy = topY - 10 - cProg * 35;
      const cR = Math.max(0.5, 2.2 * (1 - cProg));
      ctx.beginPath();
      ctx.arc(cx, cy, cR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Runas Petroglíficas e Veias de Magma
  drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged, isP3);
}

/**
 * Desenha o Olho Primordial de Basalto (Núcleo Abissal) no peito de Ignis Lithos,
 * completo com íris de obsidiana viva, correntes de convecção de magma e dilatação responsiva.
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
  const coreY = -6 + bob;
  let coreBaseRadius = isVuln ? 10 : (isChanneling ? 28 : 18);
  if (isWindup) coreBaseRadius += 5;

  const pulse = isVuln ? 0 : Math.sin(frameCount * (isP3 ? 0.28 : (isEnraged ? 0.20 : 0.12))) * 2.8;
  const currentR = Math.max(7, coreBaseRadius + pulse);

  // 1. Soquete de Rocha Esculpida com Dentes Cônicos
  ctx.fillStyle = '#121619';
  ctx.beginPath();
  ctx.arc(0, coreY, currentR + 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isVuln ? '#2f3640' : (isChanneling ? '#e67e22' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#f39c12')));
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // 2. Halo de Convecção Térmica / Erupção Solar
  if (!isVuln) {
    const flareCount = 8;
    const flareR = currentR + 7 + Math.sin(frameCount * 0.2) * 3;
    ctx.strokeStyle = isP3 ? 'rgba(255, 23, 68, 0.4)' : 'rgba(243, 156, 18, 0.35)';
    ctx.lineWidth = 1.4;
    for (let f = 0; f < flareCount; f++) {
      const fa = (f * Math.PI * 2) / flareCount + frameCount * 0.03;
      ctx.beginPath();
      ctx.moveTo(Math.cos(fa) * currentR, coreY + Math.sin(fa) * currentR);
      ctx.lineTo(Math.cos(fa) * flareR, coreY + Math.sin(fa) * flareR);
      ctx.stroke();
    }
  }

  // 3. Disco de Magma Incandescente com Gradiente Radial Profundo
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

  // 4. Íris Viva / Fenda Vertical de Obsidiana
  if (!isVuln) {
    const slitW = isWindup ? 1.5 : (isChanneling ? 4.0 : 2.5);
    const slitH = currentR * 0.75;
    ctx.fillStyle = '#1e0508';
    ctx.beginPath();
    ctx.ellipse(0, coreY, slitW, slitH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ponto de luz especular divino no olho de basalto
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(slitW + 1, coreY - slitH * 0.3, 1.8, 0, Math.PI * 2);
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
  // 1. Introdução Cinematográfica de 5 segundos (4 Atos)
  if (e.actionState === MONOLITH_STATES.SPAWN_INTRO) {
    drawMonolithSpawnIntro(ctx, e, frameCount);
    if (e.titleTimer > 0) {
      drawCinematicScreenTitle(ctx, e, frameCount);
    }
    return;
  }

  // 2. Banner Cinematográfico de Título (continua visível na transição para combate)
  if (e.titleTimer > 0) {
    drawCinematicScreenTitle(ctx, e, frameCount);
  }

  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged;
  const isP3 = e.isPhase3;
  const isWindup = e.actionState.startsWith('WINDUP');
  const isChanneling = e.actionState === MONOLITH_STATES.CHANNELING_SIPHON;

  const bob = isVuln ? 24 : (e.floatBob || 0);

  // 3. Elementos em Coordenadas de Mundo Absolutas (Desespelhadas)
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

  // 4. Renderização do Corpo do Chefe (Orientado em e.facing)
  ctx.save();

  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 3.0, (Math.random() - 0.5) * 3.0);
  }

  drawShadow(ctx, e, bob, isVuln);
  drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup);
  drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged, isP3);
  drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isChanneling, isWindup);
  drawFloatingGauntlets(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isWindup);

  ctx.restore();
}
