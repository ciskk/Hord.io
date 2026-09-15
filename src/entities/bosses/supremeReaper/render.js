/**
 * src/entities/bosses/supremeReaper/render.js
 * Pipeline de renderização procedural gráfica de alta definição de Thanatos, o Ceifador Supremo.
 * Incorpora Banner Majestoso de Tela Cheia, Intro em 4 Atos, 6 Asas de Serafim da Morte,
 * Manto do Vazio de 4 Camadas, Caveira 3D com Chifres de Carneiro e Foice Monumental Rúnica.
 */

import { dpr, viewW, viewH } from '../../../main.js';
import { getHudBottom } from '../../../core/responsive.js';
import { player } from '../../player.js';
import { REAPER_STATES } from './constants.js';

// ============================================================================
// 1. BANNER CINEMATOGRÁFICO DE APRESENTAÇÃO EM TELA CHEIA
// ============================================================================

/**
 * Renderiza o Banner Majestoso de Título de Thanatos no espaço de tela (Screen Space).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do chefe.
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
  const isCompactH = screenH < 520;
  const hudBottom = getHudBottom();

  const bannerW = isVertical 
    ? Math.min(380, screenW * 0.94) 
    : (isCompactH ? Math.min(640, screenW * 0.88) : Math.min(880, screenW * 0.90));
  const bannerH = isVertical ? 60 : (isCompactH ? 56 : 100);
  const bx = (screenW - bannerW) / 2;
  const calculatedY = Math.round((screenH / 2) - bannerH - (isVertical ? 45 : (isCompactH ? 20 : 75)));
  const by = Math.max(hudBottom + 8, calculatedY);
  const centerX = screenW / 2;

  // 1. Fundo Gradiente de Cripta de Obsidiana e Névoa Espectral
  const bgGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  bgGrad.addColorStop(0, 'rgba(2, 5, 9, 0)');
  bgGrad.addColorStop(0.18, 'rgba(5, 14, 22, 0.96)');
  bgGrad.addColorStop(0.5, 'rgba(9, 28, 40, 0.98)');
  bgGrad.addColorStop(0.82, 'rgba(5, 14, 22, 0.96)');
  bgGrad.addColorStop(1, 'rgba(2, 5, 9, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(bx, by, bannerW, bannerH);

  // 2. Frisos de Neon Ciano e Ectoplasma
  const borderGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  borderGrad.addColorStop(0, 'rgba(0, 206, 201, 0)');
  borderGrad.addColorStop(0.2, 'rgba(0, 206, 201, 0.95)');
  borderGrad.addColorStop(0.5, 'rgba(129, 236, 236, 1)');
  borderGrad.addColorStop(0.8, 'rgba(0, 206, 201, 0.95)');
  borderGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isVertical ? 2.0 : 2.8;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bannerW, by);
  ctx.moveTo(bx, by + bannerH);
  ctx.lineTo(bx + bannerW, by + bannerH);
  ctx.stroke();

  // Frisos internos com acabamento dourado antigo
  ctx.strokeStyle = 'rgba(241, 196, 15, 0.40)';
  ctx.lineWidth = 1.2;
  const padX = isVertical ? 24 : 45;
  ctx.beginPath();
  ctx.moveTo(bx + padX, by + 4);
  ctx.lineTo(bx + bannerW - padX, by + 4);
  ctx.moveTo(bx + padX, by + bannerH - 4);
  ctx.lineTo(bx + bannerW - padX, by + bannerH - 4);
  ctx.stroke();

  // Cantoneiras Góticas em Ferro Espectral
  const cornerSize = isVertical ? 10 : 16;
  ctx.fillStyle = '#00cec9';
  ctx.fillRect(bx + padX * 0.7, by - 2, cornerSize, 4);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by - 2, cornerSize, 4);
  ctx.fillRect(bx + padX * 0.7, by + bannerH - 2, cornerSize, 4);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by + bannerH - 2, cornerSize, 4);

  // Ornamento Central Superior: Brasão Alado com Joia de Fogo Fátuo
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.moveTo(centerX, by - 10);
  ctx.lineTo(centerX + 12, by - 1);
  ctx.lineTo(centerX, by + 8);
  ctx.lineTo(centerX - 12, by - 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#00cec9';
  ctx.beginPath();
  ctx.arc(centerX, by - 1, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX, by - 1, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Asas do Ornamento Superior
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(centerX - 12, by - 1);
  ctx.lineTo(centerX - 26, by - 6);
  ctx.lineTo(centerX - 18, by + 2);
  ctx.moveTo(centerX + 12, by - 1);
  ctx.lineTo(centerX + 26, by - 6);
  ctx.lineTo(centerX + 18, by + 2);
  ctx.stroke();

  // 3. Tipografia Majestosa
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Sub-alerta superior
  ctx.font = isVertical ? '700 8.5px "Cinzel", monospace' : '800 10.5px "Cinzel", monospace';
  ctx.letterSpacing = isVertical ? '2px' : '4px';
  ctx.fillStyle = 'rgba(129, 236, 236, 0.80)';
  ctx.fillText('[ JULGAMENTO DO ALÉM // AMEAÇA DA CEIFA ]', centerX, by + (isVertical ? 15 : 20));

  // Título Principal
  ctx.shadowColor = '#00cec9';
  ctx.shadowBlur = isVertical ? 12 : 22;
  ctx.font = isVertical ? '900 20px "Cinzel", "Times New Roman", serif' : '900 32px "Cinzel", "Times New Roman", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('THANATOS, O CEIFADOR SUPREMO', centerX, by + (isVertical ? 34 : 50));

  // Subtítulo Épico Inferior
  ctx.shadowBlur = 0;
  ctx.font = isVertical ? '600 9px "Cinzel", sans-serif' : '700 12px "Cinzel", sans-serif';
  ctx.letterSpacing = isVertical ? '2px' : '5px';
  ctx.fillStyle = '#81ecec';
  ctx.fillText('✦ O ARQUITETO DO VÉU DAS ALMAS & COLHEDOR ETERNO ✦', centerX, by + (isVertical ? 51 : 78));
  ctx.letterSpacing = '0px';

  ctx.restore();
}

// ============================================================================
// 2. INTRODUÇÃO CINEMATOGRÁFICA DE 5 SEGUNDOS EM 4 ATOS
// ============================================================================

/**
 * Renderiza a encenação gráfica em 4 atos da Introdução do Ceifador.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do chefe.
 * @param {number} frameCount
 */
export function drawReaperSpawnIntro(ctx, e, frameCount) {
  const introMax = e.introDuration || 300;
  const progress = Math.max(0, Math.min(1, 1 - (e.introTimer / introMax)));

  // =========================================================================
  // ATO 1: O FRIO SEPULCRAL & FENDA NO VÉU (0.00 <= progress < 0.24)
  // =========================================================================
  if (progress < 0.24) {
    const act1Prog = progress / 0.24;
    const riftR = 30 + act1Prog * 65;

    ctx.save();
    ctx.translate(0, 38);
    ctx.scale(1, 0.45);

    const riftGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, riftR);
    riftGrad.addColorStop(0, 'rgba(0, 206, 201, 0.85)');
    riftGrad.addColorStop(0.35, 'rgba(6, 24, 34, 0.7)');
    riftGrad.addColorStop(0.8, 'rgba(2, 6, 12, 0.4)');
    riftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = riftGrad;
    ctx.beginPath();
    ctx.arc(0, 0, riftR, 0, Math.PI * 2);
    ctx.fill();

    // Fratura rúnica central
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-riftR * 0.75, 0);
    ctx.lineTo(-riftR * 0.2, -6);
    ctx.lineTo(riftR * 0.2, 6);
    ctx.lineTo(riftR * 0.75, 0);
    ctx.stroke();

    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 4.5;
    ctx.stroke();
    ctx.restore();
    return;
  }

  // =========================================================================
  // ATO 2: CONVOCAÇÃO DAS LANTERNAS & GAIOLAS DE ALMAS (0.24 <= progress < 0.50)
  // =========================================================================
  if (progress < 0.50) {
    const act2Prog = (progress - 0.24) / 0.26;
    const colHeight = 140 * act2Prog;
    const colWidth = 40 + Math.sin(frameCount * 0.18) * 8;

    ctx.save();
    // Coluna vertical de ectoplasma e névoa da morte
    const colGrad = ctx.createLinearGradient(-colWidth, 0, colWidth, 0);
    colGrad.addColorStop(0, 'rgba(2, 6, 12, 0)');
    colGrad.addColorStop(0.2, 'rgba(6, 24, 34, 0.85)');
    colGrad.addColorStop(0.5, 'rgba(0, 206, 201, 0.95)');
    colGrad.addColorStop(0.8, 'rgba(6, 24, 34, 0.85)');
    colGrad.addColorStop(1, 'rgba(2, 6, 12, 0)');
    ctx.fillStyle = colGrad;
    ctx.fillRect(-colWidth, -colHeight + 25, colWidth * 2, colHeight);

    // Silhueta do Ceifador condensando no centro
    ctx.globalAlpha = act2Prog * 0.85;
    ctx.fillStyle = '#020509';
    ctx.beginPath();
    ctx.ellipse(0, -10, 26, 46, 0, 0, Math.PI * 2);
    ctx.fill();

    // Olhos de fogo fátuo abrindo e cortando as trevas
    if (act2Prog > 0.35) {
      const eyeFlare = Math.sin(frameCount * 0.3) * 3;
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.ellipse(-6, -26, 4 + eyeFlare * 0.5, 2.5, 0.2, 0, Math.PI * 2);
      ctx.ellipse(6, -26, 4 + eyeFlare * 0.5, 2.5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7, -27, 2, 2);
      ctx.fillRect(5, -27, 2, 2);

      ctx.strokeStyle = 'rgba(129, 236, 236, 0.85)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-6, -26);
      ctx.lineTo(-24 - eyeFlare * 2, -30);
      ctx.moveTo(6, -26);
      ctx.lineTo(24 + eyeFlare * 2, -30);
      ctx.stroke();
    }

    // Correntes emergindo do chão conectando as lanternas em ascensão
    if (e.lanterns) {
      for (let l of e.lanterns) {
        const lx = Math.cos(l.angle) * (l.dist * act2Prog);
        const ly = Math.sin(l.angle) * (l.dist * 0.48 * act2Prog);
        ctx.strokeStyle = 'rgba(0, 206, 201, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 25);
        ctx.lineTo(lx, ly);
        ctx.stroke();
      }
    }

    ctx.restore();
    return;
  }

  // =========================================================================
  // ATO 3: DESDOBRAR DO SERAFIM DA MORTE & BANNER IMPERIAL (0.50 <= progress < 0.76)
  // ATO 4: GOLPE DO JULGAMENTO & IMPACTO (0.76 <= progress <= 1.00)
  // =========================================================================
  const wingProg = (progress - 0.50) / 0.50;
  const wingSpan = 0.35 + Math.min(1.0, wingProg * 1.5) * 1.1;
  const flap = Math.sin(frameCount * 0.16) * 10 * (1 - wingProg * 0.3);
  const bob = Math.sin(frameCount * 0.08) * 4;

  ctx.save();
  if (progress < 0.76) {
    const mistAlpha = Math.max(0, 1 - (progress - 0.5) / 0.26);
    ctx.fillStyle = `rgba(3, 10, 18, ${mistAlpha * 0.55})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 60, 80, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawReaperShadow(ctx, e, bob, false, 0);
  drawSpectralWings(ctx, e, bob, false, false, flap, wingSpan);
  drawReaperRobe(ctx, e, bob, frameCount, false, false, 0, 0);
  drawRibcageAndCore(ctx, bob, frameCount, false, false, 0);
  drawMaskAndEyes(ctx, e, bob, frameCount, false, false, 0);
  drawOrnateScythe(ctx, e, bob, false, false, 0);
  drawGothicLanterns(ctx, e, bob, frameCount, false);

  ctx.restore();
}

// ============================================================================
// 3. COMPONENTES VISUAIS PROCEDURAIS DE ALTA DEFINIÇÃO
// ============================================================================

/**
 * Desenha a sombra projetada no chão sob o Ceifador.
 */
export function drawReaperShadow(ctx, e, bob, isVuln, collapseProg = 0) {
  const shadowY = 56 + (isVuln ? 12 : 0) + collapseProg * 6;
  const shadowR = (e.radius * 0.90) - (isVuln ? 0 : bob * 0.35) + collapseProg * 14;

  const grad = ctx.createRadialGradient(0, shadowY, 4, 0, shadowY, shadowR);
  grad.addColorStop(0, 'rgba(2, 5, 8, 0.75)');
  grad.addColorStop(0.65, 'rgba(6, 14, 20, 0.30)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowR, shadowR * (0.35 + collapseProg * 0.1), 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Renderiza o rastro fantasma espectral deixado pela movimentação do Ceifador.
 */
export function drawGhostTrail(ctx, e) {
  for (let t of e.ghostTrail) {
    if (t.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.enraged ? 'rgba(255, 71, 87, 0.35)' : 'rgba(0, 206, 201, 0.28)';
    ctx.beginPath();
    ctx.ellipse(t.x - e.x, t.y - e.y, e.radius * 0.75, e.radius * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Renderiza réplicas translúcidas (pós-imagens) durante o Phantom Blink.
 */
export function drawAfterImages(ctx, e) {
  if (!e.afterImages || e.afterImages.length === 0) return;
  for (let ai of e.afterImages) {
    const alpha = (ai.life / ai.maxLife) * (ai.alpha || 0.6);
    if (alpha <= 0) continue;

    ctx.save();
    ctx.translate(ai.x - e.x, ai.y - e.y);
    ctx.scale(ai.facing || 1, 1);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(0, 206, 201, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -10, e.radius * 0.8, e.radius * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Foice espectral na réplica
    ctx.strokeStyle = '#81ecec';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(28, -25, 45, -0.2, Math.PI * 0.7);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Renderiza os rastros contínuos de fogo fátuo emitidos pelos olhos de Thanatos.
 */
export function drawEyeTrails(ctx, e) {
  if (!e.eyeTrails || e.eyeTrails.length < 2) return;

  ctx.save();
  for (let i = 0; i < e.eyeTrails.length; i++) {
    const pt = e.eyeTrails[i];
    const alpha = (pt.life / pt.maxLife) * 0.75;
    const size = Math.max(1, (pt.life / pt.maxLife) * 4);

    ctx.fillStyle = pt.isEnraged ? `rgba(255, 71, 87, ${alpha})` : `rgba(0, 206, 201, ${alpha})`;
    const ox = pt.x - e.x;
    const oy = pt.y - e.y;

    ctx.beginPath();
    ctx.arc(ox - 5 * pt.facing, oy, size, 0, Math.PI * 2);
    ctx.arc(ox + 5 * pt.facing, oy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Desenha o círculo rúnico místico no solo durante o Colapso Espiritual.
 */
export function drawRecoveryGliph(ctx, e, frameCount) {
  const pulse = Math.sin(frameCount * 0.18) * 3.5;
  const R = e.radius * 1.25 + pulse;

  ctx.strokeStyle = '#81ecec';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 54, R, 24, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 206, 201, 0.12)';
  ctx.fill();

  const runeCount = 8;
  const rot = frameCount * 0.02;
  for (let k = 0; k < runeCount; k++) {
    const a = rot + (k * Math.PI * 2 / runeCount);
    const rx = Math.cos(a) * R;
    const ry = 54 + Math.sin(a) * 24;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry - 3);
    ctx.lineTo(rx + 3, ry + 3);
    ctx.stroke();
  }
}

/**
 * Desenha as 6 Asas de Serafim Esquelético (3 pares de asas articuladas).
 */
export function drawSpectralWings(ctx, e, bob, isVuln, isEnraged, flap = 0, customSpan = null) {
  const baseSpan = customSpan !== null ? customSpan : (e.wingSpan || 0.60);
  const boneCol = isVuln ? '#636e72' : (isEnraged ? '#ff6b81' : '#81ecec');
  const boneShade = isVuln ? '#2d3436' : (isEnraged ? '#5a0d14' : '#0f323d');
  const ectoFill = isVuln 
    ? 'rgba(45, 52, 54, 0.35)' 
    : (isEnraged ? 'rgba(255, 71, 87, 0.28)' : 'rgba(0, 206, 201, 0.25)');
  const ectoGlow = isVuln
    ? 'rgba(99, 110, 114, 0.2)'
    : (isEnraged ? 'rgba(255, 107, 129, 0.4)' : 'rgba(129, 236, 236, 0.4)');

  ctx.save();
  ctx.translate(0, -18 + bob);

  // 3 Pares de Asas: Superior (Maior), Média (Horizontal), Inferior (Estabilizador)
  const wingPairs = [
    { spanScale: 1.00, angleOffset: -0.32 + flap, originY: -8, length: 105 },
    { spanScale: 0.82, angleOffset: 0.05 + flap * 0.7, originY: 6, length: 88 },
    { spanScale: 0.62, angleOffset: 0.42 - flap * 0.4, originY: 20, length: 70 }
  ];

  for (let side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);

    for (let pair of wingPairs) {
      ctx.save();
      ctx.translate(10, pair.originY);

      if (isVuln) {
        ctx.rotate(0.65); // Asas caídas em prostração
      } else {
        ctx.rotate(pair.angleOffset * baseSpan);
      }

      const wLen = pair.length * baseSpan * pair.spanScale;

      // 1. Membranas Translúcidas em Camadas (Penas Espectrais)
      ctx.fillStyle = ectoFill;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(wLen * 0.45, -wLen * 0.32, wLen * 0.90, -wLen * 0.22);
      ctx.lineTo(wLen * 1.02, -wLen * 0.08);
      ctx.lineTo(wLen * 0.82, wLen * 0.20);
      ctx.lineTo(wLen * 0.52, wLen * 0.35);
      ctx.lineTo(wLen * 0.25, wLen * 0.25);
      ctx.closePath();
      ctx.fill();

      // Borda luminosa de ectoplasma
      ctx.strokeStyle = ectoGlow;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 2. Espinha Óssea Principal Arqueada
      ctx.strokeStyle = boneShade;
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(wLen * 0.42, -wLen * 0.36, wLen * 0.92, -wLen * 0.22);
      ctx.stroke();

      ctx.strokeStyle = boneCol;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // 3. Esporão e Falanges Articuladas
      ctx.strokeStyle = boneCol;
      ctx.lineWidth = 1.8;
      const spurs = [
        { tx: wLen * 1.02, ty: -wLen * 0.08 },
        { tx: wLen * 0.82, ty: wLen * 0.20 },
        { tx: wLen * 0.52, ty: wLen * 0.35 }
      ];
      for (let sp of spurs) {
        ctx.beginPath();
        ctx.moveTo(wLen * 0.42, -wLen * 0.12);
        ctx.lineTo(sp.tx, sp.ty);
        ctx.stroke();
      }

      // Espigão afiado na articulação da asa
      ctx.fillStyle = boneCol;
      ctx.beginPath();
      ctx.moveTo(wLen * 0.42, -wLen * 0.36);
      ctx.lineTo(wLen * 0.48, -wLen * 0.48);
      ctx.lineTo(wLen * 0.38, -wLen * 0.32);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Desenha o manto de seda do vazio com 4 camadas volumétricas e física senoidal.
 */
export function drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged, tilt = 0, collapseProg = 0) {
  const t = frameCount * 0.07;
  const drape1 = (Math.sin(t) * 9 + Math.cos(t * 1.8) * 4) + (tilt * 18);
  const drape2 = (Math.cos(t * 1.2) * 8 + Math.sin(t * 2.3) * 3) + (tilt * 18);
  const drapeMid = Math.sin(t * 1.5 + 1.2) * 6;

  const voidBlack = isVuln ? '#13191d' : (isEnraged ? '#180306' : '#020509');
  const robeDeep   = isVuln ? '#1e272e' : (isEnraged ? '#2c080d' : '#061019');
  const robeInner  = isVuln ? '#2c3e50' : (isEnraged ? '#4a0e16' : '#0a1e2a');
  const soulCyan   = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulLight  = isVuln ? '#b2bec3' : (isEnraged ? '#ff6b81' : '#81ecec');

  const spread = collapseProg * 16;
  const yOffset = collapseProg * 12;

  // Camada 1: Forro Interior de Almas (Undercloak Ethereal Glow)
  ctx.fillStyle = robeInner;
  ctx.beginPath();
  ctx.moveTo(0, -58 + bob);
  ctx.quadraticCurveTo(-54 - spread, -10 + bob, -44 - spread + drape1, 52 + bob + yOffset);
  ctx.quadraticCurveTo(0, 38 + bob, 44 + spread + drape2, 52 + bob + yOffset);
  ctx.quadraticCurveTo(54 + spread, -10 + bob, 0, -58 + bob);
  ctx.closePath();
  ctx.fill();

  // Camada 2: Manto Principal de Seda do Vazio (Outer Void Shroud)
  ctx.fillStyle = voidBlack;
  ctx.beginPath();
  ctx.moveTo(0, -54 + bob);
  ctx.quadraticCurveTo(-50 - spread, -12 + bob, -38 - spread + drape1 * 0.8, 48 + bob + yOffset);
  ctx.lineTo(-20 + drapeMid, 45 + bob + yOffset);
  ctx.lineTo(-6, 50 + bob + yOffset);
  ctx.lineTo(6, 47 + bob + yOffset);
  ctx.lineTo(20 + drapeMid, 46 + bob + yOffset);
  ctx.lineTo(38 + spread + drape2 * 0.8, 48 + bob + yOffset);
  ctx.quadraticCurveTo(50 + spread, -12 + bob, 0, -54 + bob);
  ctx.closePath();
  ctx.fill();

  // Camada 3: Estola Central Sacerdotal com Runas
  ctx.fillStyle = robeDeep;
  ctx.beginPath();
  ctx.moveTo(0, -42 + bob);
  ctx.quadraticCurveTo(-26, 0 + bob, -16 + drapeMid, 44 + bob + yOffset);
  ctx.lineTo(16 + drapeMid, 44 + bob + yOffset);
  ctx.quadraticCurveTo(26, 0 + bob, 0, -42 + bob);
  ctx.closePath();
  ctx.fill();

  // Costura dourada sutil na estola
  ctx.strokeStyle = 'rgba(241, 196, 15, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -38 + bob);
  ctx.lineTo(0, 42 + bob + yOffset);
  ctx.stroke();

  // Camada 4: Borda Rúnica Luminosa na Barra do Manto
  ctx.strokeStyle = soulCyan;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-38 - spread + drape1 * 0.8, 48 + bob + yOffset);
  ctx.quadraticCurveTo(-18 + drapeMid, 42 + bob + yOffset, 0, 46 + bob + yOffset);
  ctx.quadraticCurveTo(18 + drapeMid, 42 + bob + yOffset, 38 + spread + drape2 * 0.8, 48 + bob + yOffset);
  ctx.stroke();

  // Efeito Contínuo de Almas / Brasas Ascendendo da Barra do Manto
  if (!isVuln && Math.floor(frameCount) % 3 === 0) {
    const smokeX = (Math.random() - 0.5) * (70 + spread);
    const smokeY = 46 + bob + yOffset + Math.random() * 6;
    ctx.fillStyle = Math.random() < 0.6 ? soulCyan : soulLight;
    ctx.globalAlpha = 0.50;
    ctx.fillRect(smokeX, smokeY, 2.5, 2.5);
    ctx.globalAlpha = 1.0;
  }
}

/**
 * Desenha a caixa torácica esquelética 3D e o Coração das Almas (Soul Nexus Core).
 */
export function drawRibcageAndCore(ctx, bob, frameCount, isVuln, isEnraged, collapseProg = 0) {
  const coreY = -12 + bob + collapseProg * 8;
  const pulse = Math.sin(frameCount * (isEnraged ? 0.24 : 0.14)) * 3.5;
  const coreR = Math.max(6, 16 + pulse);

  const soulCyan  = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulGlow  = isVuln ? '#7f8c8d' : (isEnraged ? '#ff6b81' : '#81ecec');
  const boneCol   = isVuln ? '#576574' : (isEnraged ? '#f8d7da' : '#dff9fb');

  // 1. Núcleo das Almas (Soul Nexus)
  const coreGrad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, coreR);
  if (isVuln) {
    coreGrad.addColorStop(0, '#95a5a6');
    coreGrad.addColorStop(0.6, '#34495e');
    coreGrad.addColorStop(1, 'rgba(44, 62, 80, 0)');
  } else if (isEnraged) {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, '#ff6b81');
    coreGrad.addColorStop(0.75, '#ff4757');
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

  // Partículas Orbitais no Interior do Núcleo
  if (!isVuln) {
    for (let p = 0; p < 3; p++) {
      const pAng = frameCount * 0.08 + p * (Math.PI * 2 / 3);
      const pDist = coreR * 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.cos(pAng) * pDist - 1.5, coreY + Math.sin(pAng) * (pDist * 0.5) - 1.5, 3, 3);
    }
  }

  // 2. Caixa Torácica Esquelética 3D
  ctx.strokeStyle = boneCol;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';

  // Espinha central dorsal
  ctx.beginPath();
  ctx.moveTo(0, -22 + bob + collapseProg * 8);
  ctx.lineTo(0, 6 + bob + collapseProg * 8);
  ctx.stroke();

  // 4 Pares de Costelas Arqueadas
  for (let r = 0; r < 4; r++) {
    const ry = -20 + r * 6.5 + bob + collapseProg * 8;
    const rw = 18 - r * 2.5;
    ctx.beginPath();
    ctx.arc(0, ry, rw, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
  }
}

/**
 * Desenha o capuz abissal, a máscara de marfim em 3D e os Chifres Espirais de Carneiro.
 */
export function drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged, collapseProg = 0) {
  const headY = -36 + bob + collapseProg * 10;

  const soulCyan  = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulGlow  = isVuln ? '#7f8c8d' : (isEnraged ? '#ff6b81' : '#81ecec');
  const boneWhite = isVuln ? '#636e72' : (isEnraged ? '#f1dcd6' : '#e6f2f2');
  const boneShade = isVuln ? '#2d3436' : (isEnraged ? '#4a151b' : '#1e3842');

  // 1. Capuz Abissal
  ctx.fillStyle = '#020509';
  ctx.beginPath();
  ctx.moveTo(0, headY - 26);
  ctx.lineTo(17, headY - 14);
  ctx.lineTo(19, headY + 14);
  ctx.lineTo(0, headY + 22);
  ctx.lineTo(-19, headY + 14);
  ctx.lineTo(-17, headY - 14);
  ctx.closePath();
  ctx.fill();

  // 2. Chifres Espirais de Carneiro / Demônio do Submundo
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  for (let side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);

    // Chifre arqueado curvado para trás
    ctx.strokeStyle = boneShade;
    ctx.beginPath();
    ctx.moveTo(10, headY - 15);
    ctx.bezierCurveTo(24, headY - 32, 36, headY - 24, 30, headY - 8);
    ctx.stroke();

    ctx.strokeStyle = isEnraged ? '#ff6b81' : '#81ecec';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Ranhuras/anéis de crescimento no chifre
    ctx.strokeStyle = boneShade;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(18, headY - 22);
    ctx.lineTo(24, headY - 18);
    ctx.moveTo(26, headY - 24);
    ctx.lineTo(31, headY - 18);
    ctx.stroke();

    ctx.restore();
  }

  // 3. Máscara de Caveira Entalhada em Marfim Ancestral
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
  ctx.fillStyle = '#020509';
  ctx.beginPath();
  ctx.moveTo(0, headY + 3);
  ctx.lineTo(-2.5, headY + 7);
  ctx.lineTo(2.5, headY + 7);
  ctx.closePath();
  ctx.fill();

  // Cavidades Oculares Profundas e Fogos Fátuos
  const eyePulse = e.eyePulse || 0.5;
  const eyeR = 3.4 + eyePulse * 1.8;

  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.ellipse(-5.5, headY - 1, 4.5, 3.2, -0.15, 0, Math.PI * 2);
  ctx.ellipse(5.5, headY - 1, 4.5, 3.2, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Fogo Fátuo Incandescente
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
}

/**
 * Desenha a Foice Monumental das Eras de Thanatos reproduzindo com máxima fidelidade
 * a arma conceitual: lâmina em foice com dorso de aço negro, 3 espigões dorsais inclinados,
 * núcleo de cristais de rubi carmesim facetados, estalactites de cristal suspensas,
 * gume de corte chanfrado em aço prateado/ciano polido, bico traseiro com rubi,
 * haste reta com amarrações em "X", 3 braçadeiras com rebites ciano,
 * manivela serrilhada com dentes de serra e pomo em orbe ciano.
 */
export function drawOrnateScythe(ctx, e, bob, isVuln, isEnraged, collapseProg = 0) {
  ctx.save();
  ctx.translate(36, -10 + bob + collapseProg * 14);
  ctx.rotate(e.scytheAngle);

  const isGlow = (e.scytheGlow && e.scytheGlow > 0) || false;

  // Paleta da Foice de Thanatos (Fiel à Imagem Conceitual)
  // 1. Detalhes em Ciano / Teal (Orbe, anéis, bordas dos acopladores e serra)
  const tealMain   = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const tealGlow   = isVuln ? '#7f8c8d' : (isEnraged ? '#ff6b81' : '#81ecec');
  const tealBorder = isVuln ? '#2d3436' : (isEnraged ? '#780016' : '#008b8b');

  // 2. Cabo e Casca Estrutural em Aço Negro / Grafite Escuro
  const metalDark   = '#141a1f';
  const metalPlates = '#222d36';
  const metalRim    = '#374754';
  const strapColor  = '#3d4d5a';

  // 3. Cristais de Rubi Facetados (Carmesim / Sangue Profundo)
  const rubyDeep   = isVuln ? '#2d3436' : '#45040d';
  const rubyDark   = isVuln ? '#4b5766' : '#780c1b';
  const rubyMid    = isVuln ? '#636e72' : '#b7152b';
  const rubyBright = isVuln ? '#8a99a8' : '#e8253b';
  const rubyHigh   = isVuln ? '#b2bec3' : '#ff4d61';
  const rubyGlint  = isVuln ? '#dfe6e9' : '#ffa8b5';

  // 4. Lâmina e Gume Chanfrado em Aço Prateado / Ciano Polido
  const steelDull   = '#2c3e50';
  const steelMid    = '#53708a';
  const steelBright = '#94bfd6';
  const steelSilver = '#dff9fb';
  const steelEdge   = '#ffffff';

  // =========================================================================
  // 1. CABO INFERIOR: MANIVELA ARTICULADA COM INÉRCIA, DENTES DE SERRA E ORBE CIANO
  // =========================================================================

  // A. Disco / Acoplador Circular no final do cabo reto (y = 70)
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.arc(0, 70, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // B. Braço Articulado com Inércia Física (Pivô dinâmico em 0, 70)
  const crankAngle = e.crankAngle || 0;
  ctx.save();
  ctx.translate(0, 70);
  ctx.rotate(crankAngle);

  // Braço da Manivela Angular e Serrada (coordenadas relativas ao pivô 0, 70)
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-10, 15);
  ctx.lineTo(-10, 52);
  ctx.lineTo(-24, 60);
  ctx.lineTo(-26, 54);
  ctx.lineTo(-15, 48);
  ctx.lineTo(-15, 13);
  ctx.lineTo(-2, -2);
  ctx.closePath();
  ctx.fill();

  // Contorno Ciano do braço
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Dentes de Serra Triangulares Afiados (voltados para a direita da haste)
  ctx.fillStyle = metalPlates;
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.2;
  const sawStartY = 16;
  const sawCount = 7;
  const toothH = 4.8;
  for (let s = 0; s < sawCount; s++) {
    const ty = sawStartY + s * toothH;
    ctx.beginPath();
    ctx.moveTo(-10, ty);
    ctx.lineTo(-2.5, ty + toothH * 0.4); // Ponta do dente
    ctx.lineTo(-10, ty + toothH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // C. Orbe Terminal / Pomo Ciano na ponta da manivela
  const pommelX = -24;
  const pommelY = 60;
  const pommelR = 5.5;

  const orbGrad = ctx.createRadialGradient(pommelX - 1.5, pommelY - 1.5, 1, pommelX, pommelY, pommelR);
  orbGrad.addColorStop(0, tealGlow);
  orbGrad.addColorStop(0.7, tealMain);
  orbGrad.addColorStop(1, tealBorder);

  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(pommelX, pommelY, pommelR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = metalDark;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();

  // Núcleo central do disco / Pino do eixo da articulação
  ctx.fillStyle = metalDark;
  ctx.beginPath();
  ctx.arc(0, 70, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // =========================================================================
  // 2. HASTE PRINCIPAL DO CABO COM AMARRAÇÕES EM "X" E BRAÇADEIRAS QUADRADAS
  // =========================================================================

  // Haste reta sólida preta (de y = -92 até y = 70)
  ctx.fillStyle = metalDark;
  ctx.fillRect(-3.2, -92, 6.4, 162);
  ctx.strokeStyle = metalRim;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-3.2, -92, 6.4, 162);

  // Amarras cruzadas em "X" (Crossed Straps)
  ctx.strokeStyle = strapColor;
  ctx.lineWidth = 1.8;
  const xPositions = [-55, -40, 2, 17, 56];
  for (let py of xPositions) {
    ctx.beginPath();
    ctx.moveTo(-4, py - 4);
    ctx.lineTo(4, py + 4);
    ctx.moveTo(-4, py + 4);
    ctx.lineTo(4, py - 4);
    ctx.stroke();
  }

  // 3 Braçadeiras Metálicas Quadradas / Acopladores com Rebite Ciano
  const collarY = [-72, -18, 36];
  for (let cy of collarY) {
    // Bloco quadrado escuro
    ctx.fillStyle = metalPlates;
    ctx.fillRect(-5.5, cy - 4.5, 11, 9);
    // Borda ciano
    ctx.strokeStyle = tealMain;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-5.5, cy - 4.5, 11, 9);
    // Rebite central ciano
    ctx.fillStyle = tealGlow;
    ctx.fillRect(-1.5, cy - 1.5, 3, 3);
  }

  // =========================================================================
  // 3. CABEÇOTE / BLOCO SUPERIOR DE JUNÇÃO (TRAPÉZIO REFORÇADO COM REBITE)
  // =========================================================================
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.moveTo(-7.5, -86);
  ctx.lineTo(-6.5, -100);
  ctx.lineTo(6.5, -100);
  ctx.lineTo(7.5, -86);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Rebite central ciano
  ctx.fillStyle = tealGlow;
  ctx.fillRect(-2, -95, 4, 4);

  // Escala reduzida pela metade (50%) para a lâmina e contra-lâmina em relação ao encaixe
  ctx.save();
  ctx.translate(0, -94);
  ctx.scale(0.5, 0.5);
  ctx.translate(0, 94);

  // =========================================================================
  // 4. BICO TRASEIRO / CONTRA-LÂMINA OPOSTA (BICO CURVO COM RUBI E GUME)
  // =========================================================================

  // A. Dorso e Casca Externa da contra-lâmina curvando para baixo
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.moveTo(6.5, -100);
  ctx.bezierCurveTo(28, -110, 52, -88, 62, -34); // Ponta em garra/bico curvado para baixo
  ctx.bezierCurveTo(48, -54, 28, -74, 7.5, -86);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = metalDark;
  ctx.lineWidth = 3.0;
  ctx.stroke();

  // B. Cristais de Rubi Facetados na Contra-Lâmina
  const backRubyFacets = [
    { pts: [[14, -96], [32, -101], [50, -78], [30, -82]], c: rubyBright, h: rubyHigh },
    { pts: [[32, -101], [46, -90], [56, -60], [50, -78]], c: rubyHigh, h: rubyDark },
    { pts: [[30, -82], [50, -78], [56, -60], [38, -68]], c: rubyMid, h: rubyDeep }
  ];
  for (let br of backRubyFacets) {
    ctx.fillStyle = br.c;
    ctx.beginPath();
    ctx.moveTo(br.pts[0][0], br.pts[0][1]);
    for (let p = 1; p < br.pts.length; p++) ctx.lineTo(br.pts[p][0], br.pts[p][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = br.h;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // C. Gume de Aço Prateado Polido da contra-lâmina
  ctx.strokeStyle = steelSilver;
  ctx.lineWidth = 3.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(62, -34);
  ctx.bezierCurveTo(48, -54, 28, -74, 7.5, -86);
  ctx.stroke();

  // Fio luminoso puro
  ctx.strokeStyle = steelEdge;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Brilho diamante na ponta da contra-lâmina
  ctx.fillStyle = steelEdge;
  ctx.fillRect(60, -36, 4, 4);

  // =========================================================================
  // 5. GRANDE LÂMINA PRINCIPAL DA FOICE (FORMA FIEL AO CONCEITO ARTÍSTICO)
  // =========================================================================

  // A. ESTALACTITES DE CRISTAL DE RUBI PENDENTES SOB A JUNÇÃO
  const stalactites = [
    { p: [[-32, -74], [-36, -58], [-40, -74]], col1: rubyMid, col2: rubyBright },
    { p: [[-38, -74], [-43, -44], [-48, -74]], col1: rubyDark, col2: rubyHigh },
    { p: [[-46, -74], [-51, -56], [-56, -74]], col1: rubyMid, col2: rubyBright },
    { p: [[-54, -74], [-58, -65], [-62, -74]], col1: rubyDeep, col2: rubyMid }
  ];
  for (let st of stalactites) {
    ctx.fillStyle = st.col1;
    ctx.beginPath();
    ctx.moveTo(st.p[0][0], st.p[0][1]);
    ctx.lineTo(st.p[1][0], st.p[1][1]);
    ctx.lineTo(st.p[2][0], st.p[2][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = st.col2;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // B. CORPO PRINCIPAL EM AÇO NEGRO (CÚPULA COM CRISTA, 3 ESPIGÕES INCLINADOS E ARCO MONUMENTAL)
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.moveTo(-6.5, -100);

  // Crista da cúpula de armadura
  ctx.quadraticCurveTo(-16, -116, -28, -124); // Pico da crista
  ctx.quadraticCurveTo(-38, -120, -46, -114); // Vale antes do Espigão 1

  // Espigão Dorsal 1 (inclinado para trás)
  ctx.quadraticCurveTo(-49, -122, -52, -126);
  ctx.lineTo(-58, -118);
  ctx.lineTo(-64, -112);

  // Espigão Dorsal 2 (inclinado para trás)
  ctx.quadraticCurveTo(-68, -120, -73, -122);
  ctx.lineTo(-80, -112);
  ctx.lineTo(-87, -106);

  // Espigão Dorsal 3 (inclinado para trás)
  ctx.quadraticCurveTo(-91, -114, -96, -114);
  ctx.lineTo(-103, -104);
  ctx.lineTo(-110, -96);

  // Grande Curvatura Monumental em Crescente até a Ponta Extrema
  ctx.bezierCurveTo(-140, -86, -170, -58, -186, -14);
  ctx.bezierCurveTo(-196, 20, -194, 44, -186, 58); // PONTA EXTREMA DA FOICE

  // Borda Interna / Gume de Retorno até a base
  ctx.bezierCurveTo(-182, 36, -174, 14, -164, -8);
  ctx.bezierCurveTo(-148, -38, -118, -62, -60, -74);

  // Borda inferior da cúpula com o arpão/gancho afiado
  ctx.lineTo(-40, -74);
  ctx.lineTo(-24, -70);
  ctx.lineTo(-16, -60); // Ponta do gancho inferior
  ctx.lineTo(-10, -72);
  ctx.lineTo(-7.5, -86);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = metalDark;
  ctx.lineWidth = 3.6;
  ctx.stroke();

  // Friso metálico chanfrado de relevo na crista superior
  ctx.strokeStyle = metalRim;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-6.5, -100);
  ctx.quadraticCurveTo(-16, -116, -28, -124);
  ctx.quadraticCurveTo(-38, -120, -46, -114);
  ctx.stroke();

  // C. GRANDE CRISTAL DE RUBI MULTIFACETADO DA CÚPULA DA BASE
  const baseRubyFacets = [
    { pts: [[-10, -96], [-25, -116], [-41, -108], [-26, -94]], c: rubyBright, h: rubyHigh },
    { pts: [[-12, -88], [-26, -94], [-41, -88], [-23, -80]], c: rubyMid, h: rubyBright },
    { pts: [[-14, -80], [-23, -80], [-41, -88], [-32, -74]], c: rubyDark, h: rubyMid },
    { pts: [[-41, -108], [-48, -102], [-50, -86], [-41, -88]], c: rubyDeep, h: rubyDark }
  ];
  for (let f of baseRubyFacets) {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.moveTo(f.pts[0][0], f.pts[0][1]);
    for (let p = 1; p < f.pts.length; p++) ctx.lineTo(f.pts[p][0], f.pts[p][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = f.h;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // D. CANAL CONTÍNUO DE CRISTAIS DE RUBI FACETADOS AO LONGO DA LÂMINA
  const rubyFacets = [
    { pts: [[-48, -102], [-68, -96], [-70, -82], [-50, -86]], c: rubyBright, h: rubyHigh },
    { pts: [[-68, -96], [-92, -88], [-94, -74], [-70, -82]], c: rubyMid, h: rubyBright },
    { pts: [[-92, -88], [-122, -76], [-120, -58], [-94, -74]], c: rubyBright, h: rubyGlint },
    { pts: [[-122, -76], [-148, -52], [-144, -34], [-120, -58]], c: rubyMid, h: rubyBright },
    { pts: [[-148, -52], [-170, -16], [-160, -2], [-144, -34]], c: rubyDark, h: rubyMid },
    { pts: [[-170, -16], [-182, 20], [-174, 28], [-160, -2]], c: rubyBright, h: rubyHigh }
  ];
  for (let f of rubyFacets) {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.moveTo(f.pts[0][0], f.pts[0][1]);
    for (let p = 1; p < f.pts.length; p++) ctx.lineTo(f.pts[p][0], f.pts[p][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = f.h;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // Pontos de brilho especular de joia nos vértices das facetas
  ctx.fillStyle = rubyGlint;
  const glints = [[-25, -116], [-41, -88], [-68, -96], [-92, -88], [-122, -76], [-148, -52], [-170, -16]];
  for (let g of glints) {
    ctx.fillRect(g[0] - 2, g[1] - 2, 4, 4);
  }

  // E. GUME CHANFRADO EM AÇO PRATEADO POLIDO (SILVER-CYAN METALLIC RAZOR BLADE)
  const edgeGrad = ctx.createLinearGradient(-60, -74, -186, 58);
  edgeGrad.addColorStop(0.0, steelMid);
  edgeGrad.addColorStop(0.3, steelBright);
  edgeGrad.addColorStop(0.7, steelSilver);
  edgeGrad.addColorStop(1.0, steelEdge);

  // Chanfro primário côncavo de corte
  ctx.fillStyle = edgeGrad;
  ctx.beginPath();
  // Gume externo
  ctx.moveTo(-186, 58);
  ctx.bezierCurveTo(-182, 36, -174, 14, -164, -8);
  ctx.bezierCurveTo(-148, -38, -118, -62, -60, -74);
  // Borda interna chanfrada
  ctx.bezierCurveTo(-110, -68, -140, -42, -156, -14);
  ctx.bezierCurveTo(-168, 12, -176, 36, -186, 58);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = metalDark;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Fio de corte puro em aço prateado espelhado (Razor Bevel)
  ctx.strokeStyle = isGlow ? '#ffffff' : steelSilver;
  ctx.lineWidth = isGlow ? 5.2 : 3.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-186, 58); // Ponta extrema da foice
  ctx.bezierCurveTo(-182, 36, -174, 14, -164, -8);
  ctx.bezierCurveTo(-148, -38, -118, -62, -60, -74);
  ctx.stroke();

  // Fio incandescente puro no vértice cortante
  ctx.strokeStyle = steelEdge;
  ctx.lineWidth = isGlow ? 2.6 : 1.8;
  ctx.stroke();

  // F. BRILHO ESPECULAR DIAMANTE NA PONTA EXTREMA DA LÂMINA
  const tipX = -186;
  const tipY = 58;
  ctx.fillStyle = steelEdge;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY - 7);
  ctx.lineTo(tipX + 5, tipY);
  ctx.lineTo(tipX, tipY + 7);
  ctx.lineTo(tipX - 5, tipY);
  ctx.closePath();
  ctx.fill();

  ctx.restore(); // Restaura a escala de 50% da lâmina

  ctx.restore();
}

/**
 * Desenha as Lanternas Góticas dos Condenados orbitando ao redor do Ceifador.
 */
export function drawGothicLanterns(ctx, e, bob, frameCount, isEnraged) {
  if (!e.lanterns) return;

  for (let l of e.lanterns) {
    if (!l.active) continue;

    const lx = Math.cos(l.angle) * l.dist;
    const ly = (Math.sin(l.angle) * (l.dist * 0.48)) + bob + (l.sway || 0);

    // Corrente de Sustentação conectando ao Ceifador
    ctx.save();
    ctx.strokeStyle = isEnraged ? 'rgba(255, 71, 87, 0.50)' : 'rgba(0, 206, 201, 0.50)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, -18 + bob);
    ctx.lineTo(lx, ly - l.radius - 8);
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
      // 1. Corpo da Gaiola Gótica Octogonal de Ferro Forjado
      ctx.fillStyle = isEnraged ? '#2c080d' : '#0d1821';
      ctx.beginPath();
      ctx.moveTo(-l.radius * 0.7, -l.radius);
      ctx.lineTo(l.radius * 0.7, -l.radius);
      ctx.lineTo(l.radius * 0.9, l.radius * 0.65);
      ctx.lineTo(0, l.radius * 1.25);
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
      ctx.lineTo(0, l.radius * 1.25);
      ctx.stroke();

      // Pináculo do Topo da Lanterna
      ctx.fillStyle = isEnraged ? '#ff4757' : '#81ecec';
      ctx.beginPath();
      ctx.moveTo(0, -l.radius - 6);
      ctx.lineTo(4, -l.radius);
      ctx.lineTo(-4, -l.radius);
      ctx.closePath();
      ctx.fill();

      // 2. Alma Prisioneira / Fogo Fátuo Vivo no Interior
      const wispAngle = frameCount * 0.12 + (l.flickerPhase || 0);
      const wispR = l.radius * 0.62;
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
      ctx.arc(Math.cos(wispAngle) * (wispR * 0.5), Math.sin(wispAngle) * (wispR * 0.5), 2.4, 0, Math.PI * 2);
      ctx.fill();

      // 3. Barra Circular de Vida da Lanterna
      const hpPct = Math.max(0, l.hp / l.maxHp);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, l.radius + 6, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPct));
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Desenha o portal holográfico e telegrafia de teleporte espectral (Blink).
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
  const ringR = 44 + pulse;

  ctx.fillStyle = 'rgba(3, 7, 13, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR, ringR * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

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

  // Foice espectral na mão do holograma
  ctx.save();
  ctx.translate(22, -18);
  ctx.rotate(0.35);
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.lineTo(0, 35);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0, 206, 201, 0.45)';
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.lineTo(-12, -58);
  ctx.lineTo(-30, -52);
  ctx.lineTo(-44, -20);
  ctx.quadraticCurveTo(-48, 10, -40, 25);
  ctx.quadraticCurveTo(-34, 0, -28, -15);
  ctx.quadraticCurveTo(-18, -35, 0, -40);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();
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
    ctx.arc(0, 0, 170, startAng, endAng);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, 170, startAng, endAng);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Desenha as linhas tracejadas de mira das Foices de Almas.
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
    ctx.lineTo(Math.cos(bAng) * 350, Math.sin(bAng) * 350);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Desenha o campo de atração em espiral do Vórtice Colhedor.
 */
export function drawHarvestField(ctx, e, frameCount) {
  const maxR = 330;
  const maxTime = e.isEnraged ? 75 : 95;
  const progress = Math.max(0, Math.min(1, 1 - (e.actionTimer / maxTime)));

  ctx.save();
  ctx.fillStyle = 'rgba(0, 206, 201, 0.07)';
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

  // Orbe de conexão no Jogador
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

// ============================================================================
// 4. FUNÇÃO MESTRE DE RENDERIZAÇÃO GRÁFICA DO CHEFE
// ============================================================================

/**
 * Função principal de renderização gráfica exportada de Thanatos, o Ceifador Supremo.
 * @param {CanvasRenderingContext2D} ctx Contexto de renderização 2D.
 * @param {Object} e Entidade do chefe.
 * @param {number} frameCount Contador de frames global.
 */
export function drawSupremeReaper(ctx, e, frameCount) {
  // 1. Introdução Cinemática de 5 segundos
  if (e.actionState === REAPER_STATES.SPAWN_INTRO) {
    drawReaperSpawnIntro(ctx, e, frameCount);
    if (e.titleTimer > 0) {
      drawCinematicScreenTitle(ctx, e, frameCount);
    }
    return;
  }

  // 2. Banner de apresentação (ativo durante e após a intro)
  if (e.titleTimer > 0) {
    drawCinematicScreenTitle(ctx, e, frameCount);
  }

  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged || e.isPhase3;
  const isWindup = e.actionState === REAPER_STATES.WINDUP;
  const isHarvest = e.actionState === REAPER_STATES.VORTEX_HARVEST;
  const isAimingBlink = e.actionState === REAPER_STATES.BLINK_AIM;

  const collapseProg = e.collapseProgress || 0;
  const bob = isVuln ? (22 + collapseProg * 6) : (e.floatBob || 0);

  // 3. ELEMENTOS DO ESPAÇO DO MUNDO (Não invertidos horizontalmente)
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
  drawAfterImages(ctx, e);
  drawEyeTrails(ctx, e);
  drawGothicLanterns(ctx, e, bob, frameCount, isEnraged);

  if (isVuln) drawRecoveryGliph(ctx, e, frameCount);

  ctx.restore();

  // 4. CORPO DO CHEFE (Espaço local com orientação +X para frente)
  ctx.save();

  if (isAimingBlink) {
    ctx.globalAlpha = 0.65 + Math.sin(frameCount * 0.3) * 0.25;
  }

  if (isWindup || isHarvest) {
    ctx.translate((Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 3.5);
  }

  // Inclinação inercial de voo (Tilt)
  if (e.tilt) {
    ctx.rotate(e.tilt);
  }

  drawReaperShadow(ctx, e, bob, isVuln, collapseProg);
  drawSpectralWings(ctx, e, bob, isVuln, isEnraged, e.wingFlap || 0);
  drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged, e.tilt || 0, collapseProg);
  drawRibcageAndCore(ctx, bob, frameCount, isVuln, isEnraged, collapseProg);
  drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged, collapseProg);
  drawOrnateScythe(ctx, e, bob, isVuln, isEnraged, collapseProg);

  ctx.restore();
}
