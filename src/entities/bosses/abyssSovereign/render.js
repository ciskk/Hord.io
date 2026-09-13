/**
 * src/entities/bosses/abyssSovereign/render.js
 * Renderização procedural completa no Canvas do Soberano do Abismo (Boss 4 / Chefe Final).
 */
import { 
  dpr, 
  viewW, 
  viewH 
} from '../../../main.js';
import { SOVEREIGN_STATES } from './constants.js';

/**
 * Renderização da Introdução Majestosa em 4 Atos do Chefe Final (Soberano do Abismo).
 * Manifestação cósmica fiel à imagem de referência oficial:
 * Esfera de vácuo obsidiana, domo de vidro celeste com 16 arcos góticos, 4 agulhas cristalinas,
 * 9 tentáculos com nós de contas articulados, olho observador prateado, fenda dimensional reversa e pilar primordial.
 */
function drawMajesticSpawnIntro(ctx, e, frameCount) {
  const R = e.radius;
  const introMax = e.introDuration || 440;
  const progress = Math.min(1.0, Math.max(0, 1 - (e.introTimer / introMax)));

  // Selo Abissal no Solo com geometria sagrada, runas e círculos concêntricos
  ctx.save();
  const groundPulse = Math.sin(frameCount * 0.12) * 6 * progress;
  const groundRot = frameCount * 0.025;
  const rx = Math.max(0.1, R * 1.8 * progress + groundPulse);
  const ry = Math.max(0.1, (R * 0.6 * progress) + groundPulse * 0.35);

  ctx.strokeStyle = `rgba(0, 206, 201, ${0.2 + progress * 0.6})`;
  ctx.lineWidth = 2 + progress * 2;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.95, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Runas e glifos estelares orbitando o selo
  const glyphCount = 12;
  for (let g = 0; g < glyphCount; g++) {
    const ga = groundRot + (g * Math.PI * 2) / glyphCount;
    const gx = Math.cos(ga) * rx;
    const gy = R * 0.95 + Math.sin(ga) * ry;
    ctx.fillStyle = g % 2 === 0 ? '#00cec9' : '#e84393';
    ctx.fillRect(gx - 2, gy - 2, 4, 4);
  }
  ctx.restore();

  // =========================================================================
  // ATO 1: PREPARAÇÃO - O RASGO DA REALIDADE & VÁCUO GRAVITACIONAL (0.00 <= progress < 0.25)
  // =========================================================================
  if (progress < 0.25) {
    const act1Prog = progress / 0.25;
    const riftH = 160 * act1Prog;
    const riftW = 10 + Math.sin(frameCount * 0.3) * 6;

    ctx.save();
    // Halo gravitacional profundo do rasgo
    const riftGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, Math.max(12, riftH * 0.95));
    riftGlow.addColorStop(0, 'rgba(0, 206, 201, 0.9)');
    riftGlow.addColorStop(0.35, 'rgba(232, 67, 147, 0.6)');
    riftGlow.addColorStop(0.75, 'rgba(108, 92, 231, 0.3)');
    riftGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = riftGlow;
    ctx.beginPath();
    ctx.ellipse(0, 0, riftW * 5.5, riftH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fenda estelar em cruz (Crucifixo Primordial do Vazio)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -riftH * 0.9);
    ctx.lineTo(0, riftH * 0.9);
    ctx.moveTo(-riftW * 3.5, 0);
    ctx.lineTo(riftW * 3.5, 0);
    ctx.stroke();

    // Núcleo hiperdenso do rasgo (horizonte de eventos negro)
    ctx.fillStyle = '#020005';
    ctx.beginPath();
    ctx.ellipse(0, 0, riftW * 0.8, riftH * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Raios de sucção gravitacional inversa espiralando para o núcleo
    const suctionRays = 12;
    for (let s = 0; s < suctionRays; s++) {
      const sAngle = (s * Math.PI * 2) / suctionRays + frameCount * 0.05;
      const rayLen = (1 - ((frameCount * 2.8 + s * 14) % 90) / 90) * 160;
      const sx = Math.cos(sAngle) * rayLen;
      const sy = Math.sin(sAngle) * rayLen;
      ctx.strokeStyle = s % 2 === 0 ? 'rgba(0, 206, 201, 0.75)' : 'rgba(232, 67, 147, 0.75)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx * 0.12, sy * 0.12);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // ATO 2: SURGIMENTO - ASCENSÃO DA ESFERA & DOMO CELESTE (0.25 <= progress < 0.50)
  // =========================================================================
  else if (progress < 0.50) {
    const act2Prog = (progress - 0.25) / 0.25;
    const riseY = (1 - act2Prog) * 32; // Desce para a posição central de ancoragem
    const sphereScale = 0.55 + act2Prog * 0.45;

    ctx.save();
    // Fenda residual luminosa no fundo
    const fendaGlow = ctx.createRadialGradient(0, riseY, 10, 0, riseY, R * 2.2);
    fendaGlow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    fendaGlow.addColorStop(0.3, 'rgba(0, 206, 201, 0.6)');
    fendaGlow.addColorStop(0.7, 'rgba(232, 67, 147, 0.35)');
    fendaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fendaGlow;
    ctx.beginPath();
    ctx.ellipse(0, riseY, R * 2.4, R * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anel de refração expansivo
    const blastR = R * (0.8 + act2Prog * 0.8);
    ctx.strokeStyle = `rgba(0, 206, 201, ${0.8 * (1 - act2Prog * 0.5)})`;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, riseY, blastR, 0, Math.PI * 2);
    ctx.stroke();

    // Relâmpagos de matéria escura rasgando as bordas
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    for (let l = 0; l < 3; l++) {
      const lY = riseY + (Math.sin(frameCount * 0.4 + l * 2) * R * 0.8);
      const lW = Math.sin(frameCount * 0.5 + l * 1.5) * 45;
      ctx.beginPath();
      ctx.moveTo(0, lY);
      ctx.lineTo(lW * 0.4, lY + 8);
      ctx.lineTo(lW, lY - 5);
      ctx.stroke();
    }

    // Posiciona e escala a esfera e o domo celeste
    ctx.translate(0, riseY);
    ctx.scale(sphereScale, sphereScale);

    // 1. As 4 Agulhas Cristalinas materializando-se e descendo
    ctx.save();
    ctx.scale(1, Math.min(1.0, act2Prog * 1.2));
    drawDownwardCrystallineSpikes(ctx, e, R, frameCount);
    ctx.restore();

    // 2. Esfera de Vácuo Obsidiana e Domo Celeste com 16 Arcos Góticos
    drawSacredMandalaVoidSphere(ctx, e, R, frameCount, false, false, e.phase, 0.5 + act2Prog * 0.4);

    // 3. Olho central mantido 100% fechado na dormência da ascensão
    e.eyeAperture = 0.0;
    drawColdObserverEye(ctx, e, R, frameCount, false, false, false, e.phase, 1.0);

    ctx.restore();
  }

  // =========================================================================
  // ATO 3: APRESENTAÇÃO - DESABROCHAR DOS 9 TENTÁCULOS & OLHAR DIVINO (0.50 <= progress < 0.80)
  // =========================================================================
  else if (progress < 0.80) {
    const act3Prog = (progress - 0.50) / 0.30;
    const limbBloom = Math.min(1.0, 0.35 + act3Prog * 0.70);

    ctx.save();
    // Leve flutuação de autoridade cósmica
    const floatY = Math.sin(frameCount * 0.05) * 3;
    ctx.translate(0, floatY);

    // Halos celestes concêntricos reverberando
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.5)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, R * (1.1 + Math.sin(frameCount * 0.1) * 0.06), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(232, 67, 147, 0.4)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, R * (1.35 + Math.cos(frameCount * 0.08) * 0.05), 0, Math.PI * 2);
    ctx.stroke();

    // 1. Desabrochar gracioso dos 9 Tentáculos Articulados com juntas de contas
    ctx.save();
    ctx.scale(limbBloom, limbBloom);
    drawCelestialLimbs(ctx, e, R, frameCount, false, false, true);
    ctx.restore();

    // 2. As 4 Agulhas Cristalinas
    drawDownwardCrystallineSpikes(ctx, e, R, frameCount);

    // 3. Esfera de Vácuo e Domo Sagrado de Arcos Góticos
    drawSacredMandalaVoidSphere(ctx, e, R, frameCount, false, false, e.phase, 0.6 - act3Prog * 0.3);

    // 4. Abertura solene do Olho Observador (aperture de 0.0 a 1.0)
    e.eyeAperture = Math.min(1.0, Math.max(0.0, (act3Prog - 0.15) / 0.65));
    drawColdObserverEye(ctx, e, R, frameCount, false, false, false, e.phase, 1.0 - e.eyeAperture);

    ctx.restore();
  }

  // =========================================================================
  // ATO 4: CLÍMAX - O DESPERTAR DA SINGULARIDADE & PILAR PRIMORDIAL (0.80 <= progress <= 1.00)
  // =========================================================================
  else {
    const act4Prog = (progress - 0.80) / 0.20;

    ctx.save();
    // Pulsação pré-detonação
    const bossPulse = 1.0 + Math.sin(frameCount * 0.2) * 0.05 * act4Prog;
    ctx.scale(bossPulse, bossPulse);

    // 1. Pilar Primordial de Luz Celestial disparado verticalmente do Olho para o Cosmos
    const beamW = 18 + Math.sin(frameCount * 0.4) * 8 + act4Prog * 28;
    const beamH = 1000;
    const beamGrad = ctx.createLinearGradient(0, 0, 0, -beamH);
    beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
    beamGrad.addColorStop(0.25, 'rgba(0, 206, 201, 0.92)');
    beamGrad.addColorStop(0.70, 'rgba(108, 92, 231, 0.45)');
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(-beamW * 0.5, -beamH, beamW, beamH);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3.5, -beamH, 7, beamH);

    // 2. Ondas de Choque concêntricas em expansão antes da liberação final
    if (act4Prog > 0.35) {
      const ringExpand = ((act4Prog - 0.35) / 0.65) * (R * 3.4);
      const ringAlpha = 1 - ((act4Prog - 0.35) / 0.65);
      ctx.strokeStyle = `rgba(0, 206, 201, ${ringAlpha * 0.85})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, ringExpand, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(232, 67, 147, ${ringAlpha * 0.65})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, ringExpand * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Os 9 Tentáculos com contas totalmente estendidos em postura imponente
    drawCelestialLimbs(ctx, e, R, frameCount, false, false, true);

    // 4. As 4 Agulhas Cristalinas
    drawDownwardCrystallineSpikes(ctx, e, R, frameCount);

    // 5. Esfera de Vácuo Obsidiana e Domo Sagrado em ressonância estelar
    drawSacredMandalaVoidSphere(ctx, e, R, frameCount, false, false, e.phase, 0.2);

    // 6. Olho Central completamente aberto e resplandecente
    e.eyeAperture = 1.0;
    drawColdObserverEye(ctx, e, R, frameCount, false, false, false, e.phase, 0.0);

    ctx.restore();
  }
}

/**
 * Renderiza o Banner Cinematográfico Apocalíptico de Entrada do Soberano do Abismo.
 * Posicionado no centro da tela, flutuando diretamente acima do herói (horizontal e vertical).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
function drawCinematicScreenTitle(ctx, e, frameCount) {
  const maxT = e.titleMaxTimer || 220;
  const titleProgress = 1 - Math.max(0, e.titleTimer / maxT);

  // Transição suave de entrada e saída (duração ajustada: ~3.6s total)
  let bannerAlpha = 1.0;
  if (titleProgress < 0.08) {
    bannerAlpha = titleProgress / 0.08;
  } else if (titleProgress > 0.80) {
    bannerAlpha = Math.max(0, (1 - titleProgress) / 0.20);
  }

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = bannerAlpha;

  const screenW = viewW || (typeof window !== 'undefined' ? window.innerWidth : 1280);
  const screenH = viewH || (typeof window !== 'undefined' ? window.innerHeight : 800);
  const isVertical = screenH > screenW || screenW < 640;

  // Em telas verticais (smartphones) e horizontais (desktop):
  // O banner é centralizado horizontalmente e posicionado flutuando diretamente acima do personagem
  const bannerW = isVertical ? Math.min(380, screenW * 0.94) : Math.min(880, screenW * 0.90);
  const bannerH = isVertical ? 58 : 94;
  const bx = (screenW - bannerW) / 2;
  const by = Math.round((screenH / 2) - bannerH - (isVertical ? 45 : 65));

  // 1. Fundo Cósmico Carmesim Profundo com Gradiente Translúcido
  const bgGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  bgGrad.addColorStop(0, 'rgba(15, 0, 4, 0)');
  bgGrad.addColorStop(0.15, 'rgba(28, 2, 8, 0.95)');
  bgGrad.addColorStop(0.5, 'rgba(52, 4, 14, 0.98)');
  bgGrad.addColorStop(0.85, 'rgba(28, 2, 8, 0.95)');
  bgGrad.addColorStop(1, 'rgba(15, 0, 4, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(bx, by, bannerW, bannerH);

  // 2. Frisos de Neon Vermelho Carmesim Superior e Inferior
  const borderGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  borderGrad.addColorStop(0, 'rgba(255, 23, 68, 0)');
  borderGrad.addColorStop(0.2, 'rgba(255, 23, 68, 0.95)');
  borderGrad.addColorStop(0.5, 'rgba(255, 107, 129, 1)');
  borderGrad.addColorStop(0.8, 'rgba(255, 23, 68, 0.95)');
  borderGrad.addColorStop(1, 'rgba(255, 23, 68, 0)');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isVertical ? 2.0 : 2.6;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bannerW, by);
  ctx.moveTo(bx, by + bannerH);
  ctx.lineTo(bx + bannerW, by + bannerH);
  ctx.stroke();

  // Frisos internos finos
  ctx.strokeStyle = 'rgba(255, 150, 160, 0.35)';
  ctx.lineWidth = 1;
  const padX = isVertical ? 24 : 45;
  ctx.beginPath();
  ctx.moveTo(bx + padX, by + 3);
  ctx.lineTo(bx + bannerW - padX, by + 3);
  ctx.moveTo(bx + padX, by + bannerH - 3);
  ctx.lineTo(bx + bannerW - padX, by + bannerH - 3);
  ctx.stroke();

  // 3. Cantoneiras Geométricas Rubras
  const cornerSize = isVertical ? 10 : 16;
  ctx.fillStyle = '#ff1744';
  ctx.fillRect(bx + padX * 0.7, by - 1.5, cornerSize, 3);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by - 1.5, cornerSize, 3);
  ctx.fillStyle = '#b71540';
  ctx.fillRect(bx + padX * 0.7, by + bannerH - 1.5, cornerSize, 3);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by + bannerH - 1.5, cornerSize, 3);

  // 4. Textos do Banner
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const pulseGlow = 12 + Math.sin(frameCount * 0.14) * 6;

  if (isVertical) {
    // --- LAYOUT PARA TELAS VERTICAIS (Compacto & Legível) ---
    // Tag Superior
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#ff6b81';
    ctx.shadowColor = 'rgba(255, 23, 68, 0.85)';
    ctx.shadowBlur = 6;
    ctx.fillText("[ ALERTA DE CATACLISMA ]", screenW / 2, by + 13);

    // Título Central
    ctx.font = 'bold 17px "Cinzel", "Cinzel Decorative", Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 23, 68, 0.95)';
    ctx.shadowBlur = pulseGlow;
    ctx.fillText("❖ SOBERANO DO ABISMO ❖", screenW / 2, by + 31);

    // Subtítulo
    ctx.font = 'italic 10px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#ffd1d1';
    ctx.shadowColor = 'rgba(183, 21, 64, 0.7)';
    ctx.shadowBlur = 3;
    ctx.fillText("✦ SENHOR DO VÁZIO PRIMORDIAL ✦", screenW / 2, by + 46);
  } else {
    // --- LAYOUT PARA TELAS HORIZONTAIS (Majestoso & Completo) ---
    // Tag Superior
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ff4d4d';
    ctx.shadowColor = 'rgba(255, 23, 68, 0.85)';
    ctx.shadowBlur = 8;
    ctx.fillText("[ ALERTA DE CATACLISMA // AMEAÇA EXISTENCIAL ]", screenW / 2, by + 20);

    // Título Central
    ctx.font = 'bold 28px "Cinzel", "Cinzel Decorative", Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 23, 68, 0.95)';
    ctx.shadowBlur = pulseGlow;
    ctx.fillText("❖ SOBERANO DO ABISMO ❖", screenW / 2, by + 48);

    // Subtítulo
    ctx.font = 'italic 12px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#ffd1d1';
    ctx.shadowColor = 'rgba(183, 21, 64, 0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText("✦ O DEVORADOR DAS ERAS E SENHOR DO VÁZIO PRIMORDIAL ✦", screenW / 2, by + 74);
  }

  ctx.restore();
}

/**
 * Renderiza as Asas Celestiais de Plasma da Singularidade na Fase 3.
 */
function drawSingularityPlasmaWings(ctx, e, R, frameCount, edgeCol, isStaggered, idleBlend = 0) {
  ctx.save();
  const wingPairs = 2;
  const wingBreath = Math.sin(frameCount * 0.08) * 8;
  const wingFade = Math.max(0.08, 1.0 - (idleBlend || 0) * 0.88);
  ctx.globalAlpha = (ctx.globalAlpha || 1.0) * wingFade;

  for (let side = -1; side <= 1; side += 2) {
    for (let w = 0; w < wingPairs; w++) {
      const wingLen = (R * (1.75 + w * 0.45)) + wingBreath;
      const wingAng = (w === 0 ? -0.38 : -0.72) + Math.sin(frameCount * 0.06 + w) * 0.08;

      ctx.save();
      ctx.scale(side, 1);

      // Pena/Feixe de plasma principal
      const rootX = R * 0.35;
      const rootY = -R * 0.15;
      const tipX = rootX + Math.cos(wingAng) * wingLen;
      const tipY = rootY + Math.sin(wingAng) * wingLen;
      const cpX = rootX + Math.cos(wingAng + 0.3) * (wingLen * 0.55);
      const cpY = rootY + Math.sin(wingAng + 0.3) * (wingLen * 0.55);

      // Gradiente de plasma
      const wingGrad = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
      wingGrad.addColorStop(0, 'rgba(215, 200, 255, 0.75)');
      wingGrad.addColorStop(0.5, 'rgba(180, 160, 255, 0.45)');
      wingGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.85)');
      wingGrad.addColorStop(1, 'rgba(215, 200, 255, 0)');

      ctx.strokeStyle = wingGrad;
      ctx.lineWidth = 4.5 - w * 1.2;
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
      ctx.stroke();

      // Feixe central superaquecido
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Renderiza o cluster de espinhos cristalinos negros apontando para baixo na base da esfera (Fiel à Referência).
 */
function drawDownwardCrystallineSpikes(ctx, e, R, frameCount) {
  ctx.save();
  // 4 agulhas cristalinas voltadas para baixo na base do orbe, emoldurando o tentáculo inferior
  const spikeDefs = [
    { x: -R * 0.40, y: R * 0.70, len: 32, ang: 0.02, w: 6.5 },
    { x: -R * 0.16, y: R * 0.80, len: 48, ang: 0.00, w: 8.5 },
    { x:  R * 0.16, y: R * 0.80, len: 48, ang: 0.00, w: 8.5 },
    { x:  R * 0.40, y: R * 0.70, len: 32, ang: -0.02, w: 6.5 }
  ];

  for (let i = 0; i < spikeDefs.length; i++) {
    const sp = spikeDefs[i];
    const tipX = sp.x + Math.sin(sp.ang) * sp.len;
    const tipY = sp.y + Math.cos(sp.ang) * sp.len;
    const perpX = Math.cos(sp.ang) * (sp.w * 0.5);
    const perpY = -Math.sin(sp.ang) * (sp.w * 0.5);

    // Corpo metálico grafite/obsidiana
    const spGrad = ctx.createLinearGradient(sp.x, sp.y, tipX, tipY);
    spGrad.addColorStop(0, '#1a1824');
    spGrad.addColorStop(0.5, '#0b0814');
    spGrad.addColorStop(1, '#05020a');
    ctx.fillStyle = spGrad;
    ctx.beginPath();
    ctx.moveTo(sp.x - perpX, sp.y - perpY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(sp.x + perpX, sp.y + perpY);
    ctx.closePath();
    ctx.fill();

    // Contorno iluminado prata-ciano
    ctx.strokeStyle = '#e0f7fa';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Aresta central de reflexo
    ctx.strokeStyle = 'rgba(129, 236, 236, 0.75)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renderiza os 9 Tentáculos Articulados com Juntas de Nodos (Bead-Joints) e Física de Inércia (Fiel à Referência).
 */
function drawCelestialLimbs(ctx, e, R, frameCount, isStaggered, isWindup, isCasting) {
  // Configuração dos 9 tentáculos na silhueta icônica da imagem de referência
  const limbConfigs = [
    // 0: Superior vertical (aponta para cima)
    { baseAng: -Math.PI * 0.50, segs: [ { len: 18, ang: -0.04 }, { len: 16, ang: 0.08 }, { len: 15, ang: -0.10 }, { len: 14, ang: 0.12 } ] },
    // 1: Superior Direito
    { baseAng: -Math.PI * 0.22, segs: [ { len: 18, ang: 0.08 }, { len: 16, ang: -0.05 }, { len: 15, ang: 0.12 }, { len: 14, ang: -0.15 } ] },
    // 2: Médio Direito Horizontal
    { baseAng: -0.08, segs: [ { len: 19, ang: 0.05 }, { len: 17, ang: 0.12 }, { len: 15, ang: -0.10 }, { len: 14, ang: 0.18 } ] },
    // 3: Inferior Direito
    { baseAng: Math.PI * 0.16, segs: [ { len: 18, ang: 0.08 }, { len: 16, ang: -0.05 }, { len: 15, ang: 0.14 }, { len: 14, ang: -0.20 } ] },
    // 4: Inferior-Direita baixo
    { baseAng: Math.PI * 0.36, segs: [ { len: 18, ang: 0.05 }, { len: 16, ang: 0.12 }, { len: 15, ang: -0.08 }, { len: 14, ang: 0.16 } ] },
    // 5: Inferior Vertical Central (desce reto entre os espinhos cristalinos)
    { baseAng: Math.PI * 0.50, segs: [ { len: 20, ang: 0.00 }, { len: 18, ang: 0.02 }, { len: 16, ang: -0.02 }, { len: 15, ang: 0.00 } ] },
    // 6: Inferior-Esquerda baixo
    { baseAng: Math.PI * 0.64, segs: [ { len: 18, ang: -0.05 }, { len: 16, ang: -0.12 }, { len: 15, ang: 0.08 }, { len: 14, ang: -0.16 } ] },
    // 7: Médio Esquerdo Horizontal
    { baseAng: Math.PI * 0.98, segs: [ { len: 19, ang: -0.05 }, { len: 17, ang: -0.10 }, { len: 15, ang: 0.12 }, { len: 14, ang: -0.18 } ] },
    // 8: Superior Esquerdo
    { baseAng: -Math.PI * 0.78, segs: [ { len: 18, ang: -0.08 }, { len: 16, ang: 0.05 }, { len: 15, ang: -0.12 }, { len: 14, ang: 0.15 } ] }
  ];

  ctx.save();
  const time = frameCount * 0.04;
  const isIdle = e.actionState === SOVEREIGN_STATES.IDLE;
  const waveAmp = isIdle ? 0.025 : (isStaggered ? 0.02 : (isWindup ? 0.14 : 0.06));

  for (let l = 0; l < limbConfigs.length; l++) {
    const limb = limbConfigs[l];
    // Ponto de ancoragem na borda externa do anel
    let currX = Math.cos(limb.baseAng) * (R * 1.05);
    let currY = Math.sin(limb.baseAng) * (R * 1.05);
    let accumAng = limb.baseAng;

    const physLimb = e.tentaclePhysics && e.tentaclePhysics[l];

    for (let s = 0; s < limb.segs.length; s++) {
      const seg = limb.segs[s];
      // Ondulação orgânica sutil de respiração
      const wave = Math.sin(time + l * 0.8 + s * 0.6) * waveAmp;
      // Inércia física dinamicamente simulada pelo sistema spring-damper
      const inOffset = (physLimb && physLimb[s]) ? physLimb[s].angleOffset : 0;
      accumAng += seg.ang + inOffset + wave;

      const nextX = currX + Math.cos(accumAng) * seg.len;
      const nextY = currY + Math.sin(accumAng) * seg.len;

      // 1. Haste do Segmento (Osso/Placa Metálica)
      const segWidth = Math.max(2.8, 6.2 - s * 0.9);

      ctx.strokeStyle = '#dcdde1';
      ctx.lineWidth = segWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(currX, currY);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      // Friso interno escuro da junta
      ctx.strokeStyle = '#2f3640';
      ctx.lineWidth = Math.max(1.0, segWidth * 0.32);
      ctx.beginPath();
      ctx.moveTo(currX + (nextX - currX) * 0.15, currY + (nextY - currY) * 0.15);
      ctx.lineTo(currX + (nextX - currX) * 0.85, currY + (nextY - currY) * 0.85);
      ctx.stroke();

      // 2. Nó/Junta Circular de Contas (Torus Bead-Joint da Referência)
      const beadR = Math.max(3.2, 5.8 - s * 0.7);

      // Glow azul-gelo sutil ao redor de cada conta
      ctx.shadowColor = 'rgba(129, 236, 236, 0.65)';
      ctx.shadowBlur = 5;

      // Aro externo brilhante da conta
      ctx.fillStyle = '#0a0614';
      ctx.beginPath();
      ctx.arc(currX, currY, beadR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f5f6fa';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Centro da conta (pino prateado)
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(168, 245, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(currX, currY, beadR * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // 3. Ponta Afilada de Agulha no último segmento
      if (s === limb.segs.length - 1) {
        // Ponta final suavemente curvada
        const tipAng = accumAng + 0.10;
        const tipLen = 12;
        const finalX = nextX + Math.cos(tipAng) * tipLen;
        const finalY = nextY + Math.sin(tipAng) * tipLen;

        ctx.strokeStyle = '#f5f6fa';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(nextX, nextY);
        ctx.lineTo(finalX, finalY);
        ctx.stroke();

        // Ponto luminoso na ponta do membro com transição entre combate e dormência
        const idleB = e.idleBlend || 0;
        const tipCol = idleB > 0.4 ? '#81ecec' : (e.phase === 2 ? '#ff7675' : (e.phase === 3 ? '#ffffff' : '#a29bfe'));
        const tipGlow = idleB > 0.4 ? '#00cec9' : (e.phase === 2 ? '#e84393' : (e.phase === 3 ? '#00cec9' : '#8e44ad'));
        ctx.shadowColor = tipGlow;
        ctx.shadowBlur = idleB > 0.4 ? 4 : 8;
        ctx.fillStyle = tipCol;
        ctx.beginPath();
        ctx.arc(finalX, finalY, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      currX = nextX;
      currY = nextY;
    }
  }

  ctx.restore();
}

/**
 * Renderiza a Esfera de Vácuo Central Envolta pelo Anel Translúcido Ciano com Arcos Góticos (Fiel à Referência).
 * Comporta transição dinâmica entre energia de combate e paleta serena da referência durante a inatividade.
 */
function drawSacredMandalaVoidSphere(ctx, e, R, frameCount, isHit, isStaggered, phase, idleBlend = 0) {
  ctx.save();

  const haloR = R * 1.38;

  // Interpolação de cores baseada no estado de inatividade (idleBlend)
  // Paleta de Combate por Fase:
  let combatHaloStart, combatHaloMid, combatHaloEnd, combatRimColor, combatRimGlow;
  let archColor;

  if (phase === 2) {
    // Fase 2 Combate: Fratura do Horizonte - Magenta / Rosa Elétrico
    combatHaloStart = 'rgba(232, 67, 147, 0.18)';
    combatHaloMid = 'rgba(253, 121, 168, 0.40)';
    combatHaloEnd = 'rgba(232, 67, 147, 0.82)';
    combatRimColor = '#fd79a8';
    combatRimGlow = '#e84393';
    archColor = 'rgba(255, 121, 198, 0.55)';
  } else if (phase === 3) {
    // Fase 3 Combate: Singularidade Primordial - Ciano Elétrico / Branco
    combatHaloStart = 'rgba(0, 206, 201, 0.20)';
    combatHaloMid = 'rgba(9, 132, 227, 0.45)';
    combatHaloEnd = 'rgba(0, 206, 201, 0.85)';
    combatRimColor = '#00cec9';
    combatRimGlow = '#00cec9';
    archColor = 'rgba(129, 236, 236, 0.65)';
  } else {
    // Fase 1 Combate: Vácuo Abissal - Roxo / Violeta Profundo
    combatHaloStart = 'rgba(142, 68, 173, 0.18)';
    combatHaloMid = 'rgba(108, 92, 231, 0.38)';
    combatHaloEnd = 'rgba(142, 68, 173, 0.82)';
    combatRimColor = '#a29bfe';
    combatRimGlow = '#8e44ad';
    archColor = 'rgba(162, 155, 254, 0.55)';
  }

  // Paleta da Imagem de Referência (Ativada no Estado Inativo - IDLE):
  // Cúpula Celeste Translúcida Azul-Gelo e Prata Crystalline
  const idleHaloStart = 'rgba(129, 236, 236, 0.12)';
  const idleHaloMid = 'rgba(168, 245, 255, 0.38)';
  const idleHaloEnd = 'rgba(225, 250, 255, 0.85)';
  const idleRimColor = '#ffffff';
  const idleRimGlow = '#81ecec';
  const idleArchColor = 'rgba(220, 250, 255, 0.70)';

  // Desenho do Halo de Combate (desvanece quando inativo)
  if (idleBlend < 1.0) {
    ctx.save();
    ctx.globalAlpha = 1.0 - idleBlend;
    const cGrad = ctx.createRadialGradient(0, 0, R * 0.85, 0, 0, haloR);
    cGrad.addColorStop(0, combatHaloStart);
    cGrad.addColorStop(0.65, combatHaloMid);
    cGrad.addColorStop(0.92, combatHaloEnd);
    cGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = combatRimGlow;
    ctx.shadowBlur = isStaggered ? 6 : 14;
    ctx.strokeStyle = isStaggered ? '#f1c40f' : combatRimColor;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.stroke();

    if (!isHit) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = archColor;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.18, 0, Math.PI * 2);
      ctx.stroke();

      const archCount = 16;
      for (let a = 0; a < archCount; a++) {
        const a1 = (a * Math.PI * 2) / archCount;
        const a2 = ((a + 1) * Math.PI * 2) / archCount;
        const midA = (a1 + a2) * 0.5;
        const p1X = Math.cos(a1) * (R * 1.34);
        const p1Y = Math.sin(a1) * (R * 1.34);
        const p2X = Math.cos(a2) * (R * 1.34);
        const p2Y = Math.sin(a2) * (R * 1.34);
        const cpX = Math.cos(midA) * (R * 0.98);
        const cpY = Math.sin(midA) * (R * 0.98);
        ctx.beginPath();
        ctx.moveTo(p1X, p1Y);
        ctx.quadraticCurveTo(cpX, cpY, p2X, p2Y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Desenho do Halo Sagrado da Referência (manifesta-se plenamente no estado inativo)
  if (idleBlend > 0) {
    ctx.save();
    ctx.globalAlpha = idleBlend;
    const iGrad = ctx.createRadialGradient(0, 0, R * 0.85, 0, 0, haloR);
    iGrad.addColorStop(0, idleHaloStart);
    iGrad.addColorStop(0.65, idleHaloMid);
    iGrad.addColorStop(0.92, idleHaloEnd);
    iGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = iGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = idleRimGlow;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = idleRimColor;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.stroke();

    if (!isHit) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = idleArchColor;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.18, 0, Math.PI * 2);
      ctx.stroke();

      const archCount = 16;
      for (let a = 0; a < archCount; a++) {
        const a1 = (a * Math.PI * 2) / archCount;
        const a2 = ((a + 1) * Math.PI * 2) / archCount;
        const midA = (a1 + a2) * 0.5;
        const p1X = Math.cos(a1) * (R * 1.34);
        const p1Y = Math.sin(a1) * (R * 1.34);
        const p2X = Math.cos(a2) * (R * 1.34);
        const p2Y = Math.sin(a2) * (R * 1.34);
        const cpX = Math.cos(midA) * (R * 0.98);
        const cpY = Math.sin(midA) * (R * 0.98);
        ctx.beginPath();
        ctx.moveTo(p1X, p1Y);
        ctx.quadraticCurveTo(cpX, cpY, p2X, p2Y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 3. ESFERA DE VÁCUO CENTRAL OBSIDIANA (O Núcleo Escuro)
  const coreGrad = ctx.createRadialGradient(0, 0, R * 0.15, 0, 0, R * 0.96);
  if (idleBlend > 0.45) {
    // Dormência da Referência: Obsidiana pura cósmica profunda
    coreGrad.addColorStop(0, '#020106');
    coreGrad.addColorStop(0.65, '#060310');
    coreGrad.addColorStop(1, '#0e081c');
  } else if (phase === 2) {
    coreGrad.addColorStop(0, '#100008');
    coreGrad.addColorStop(0.65, '#220015');
    coreGrad.addColorStop(1, '#380024');
  } else if (phase === 3) {
    coreGrad.addColorStop(0, '#000808');
    coreGrad.addColorStop(0.65, '#001414');
    coreGrad.addColorStop(1, '#002525');
  } else {
    coreGrad.addColorStop(0, '#05020c');
    coreGrad.addColorStop(0.65, '#0b0617');
    coreGrad.addColorStop(1, '#150c26');
  }

  ctx.fillStyle = isHit ? '#ffffff' : coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.96, 0, Math.PI * 2);
  ctx.fill();

  // Borda sutil de delimitação do núcleo escuro
  const borderCol = idleBlend > 0.45 
    ? 'rgba(168, 245, 255, 0.45)' 
    : (phase === 2 ? 'rgba(253, 121, 168, 0.45)' : (phase === 3 ? 'rgba(0, 206, 201, 0.45)' : 'rgba(162, 155, 254, 0.45)'));
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.96, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renderiza o Olho Observador Prateado Horizontal com Fenda Vertical (Fiel à Referência).
 * Fecha-se suavemente em repouso estático / inativo (IDLE).
 */
function drawColdObserverEye(ctx, e, R, frameCount, isStaggered, isWindup, isCasting, phase, idleBlend = 0) {
  ctx.save();

  const coreScale = isStaggered ? 0.85 : (1.0 + (e.corePulse || 0) * 0.08);
  const breath = Math.sin(frameCount * 0.08) * 0.8;
  const eyeW = 22 * coreScale + breath;
  const openRatio = (e.eyeAperture !== undefined) ? e.eyeAperture : Math.max(0, 1.0 - (idleBlend || 0));

  // Moldura Externa Metálica Esbranquiçada / Grafite
  ctx.shadowColor = openRatio < 0.5 
    ? 'rgba(168, 245, 255, 0.55)' 
    : (phase === 2 ? 'rgba(232, 67, 147, 0.55)' : (phase === 3 ? 'rgba(0, 206, 201, 0.55)' : 'rgba(142, 68, 173, 0.55)'));
  ctx.shadowBlur = 6;
  ctx.strokeStyle = '#2f3640';
  ctx.lineWidth = 3.0;

  if (openRatio <= 0.08) {
    // === OLHO TOTALMENTE FECHADO EM DORMÊNCIA SAGRADA (MEDITAÇÃO CELESTE) ===
    ctx.shadowBlur = 0;

    // Fenda da Pálpebra Fechada (curvatura suave descendente em repouso)
    ctx.strokeStyle = '#18151f';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.95, 0);
    ctx.quadraticCurveTo(0, 1.8, eyeW * 0.95, 0);
    ctx.stroke();

    // Pálpebra metálica prateada superior
    ctx.strokeStyle = '#718093';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.88, -0.6);
    ctx.quadraticCurveTo(0, 1.0, eyeW * 0.88, -0.6);
    ctx.stroke();

    // Fio de luz celestial ciano dormente ao longo da costura
    ctx.shadowColor = '#81ecec';
    ctx.shadowBlur = 5;
    ctx.strokeStyle = 'rgba(168, 245, 255, 0.85)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.65, 0);
    ctx.quadraticCurveTo(0, 1.4, eyeW * 0.65, 0);
    ctx.stroke();
  } else {
    // === OLHO ABERTO OU EM TRANSIÇÃO SUAVE DE ABERTURA / FECHAMENTO ===
    const eyeH = Math.max(0.6, (11.5 * coreScale + breath * 0.4) * openRatio);

    ctx.beginPath();
    ctx.ellipse(0, 0, eyeW + 2.5, eyeH + 2.0, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#718093';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeW + 1.2, eyeH + 1.0, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Interior do Olho: Íris Elíptica Cinza Metálico / Grafite Polido
    const irisGrad = ctx.createRadialGradient(0, -2, 1, 0, 0, eyeW);
    irisGrad.addColorStop(0, '#57606f');
    irisGrad.addColorStop(0.45, '#3d434d');
    irisGrad.addColorStop(0.85, '#22252c');
    irisGrad.addColorStop(1, '#111216');

    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Reflexo Especular Superior Branco (Crescent Glint da Referência)
    if (openRatio > 0.35) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -1, eyeW * 0.72, -Math.PI * 0.82, -Math.PI * 0.18);
      ctx.stroke();
    }

    // 4. Pupila em Fenda Vertical Negra Pura (Razor Slit Pupil)
    const pupilW = Math.max(0.5, (isStaggered ? 4.2 : (isWindup ? 1.4 : (isCasting ? 3.2 : 2.2))) * openRatio);
    const pupilH = eyeH * 0.95;

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(0, 0, pupilW, pupilH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Micro reflexo de luz pontual frio
    if (openRatio > 0.40) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-1.5, -2, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Renderiza todos os efeitos visuais de ataques que estão na fase ativa (CASTING/STRIKE),
 * garantindo que golpes como Corte Dimensional, Chuva Astral, Implosão e Supernova sejam visíveis na tela.
 */
function drawActiveSovereignAttacks(ctx, e, frameCount) {
  if (!e.activeAttacks || e.activeAttacks.length === 0) return;

  ctx.save();

  for (let i = 0; i < e.activeAttacks.length; i++) {
    const atk = e.activeAttacks[i];
    const progress = Math.max(0, Math.min(1, 1 - (atk.timer / (atk.maxTimer || 1))));

    if (atk.type === 'DIMENSIONAL_SLASH') {
      // FEIXE DE LUZ CELESTIAL PARTINDO DIRETO DO CORPO DO SOBERANO (0, 0)
      const angles = atk.angles || [e.cleaveAngle || 0];
      const alpha = Math.max(0, 1 - progress);
      const len = atk.length || 1500;
      const w = atk.width || 54;

      ctx.save();

      for (let a = 0; a < angles.length; a++) {
        const ang = angles[a];
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);
        const tipX = cosA * len;
        const tipY = sinA * len;
        const isMain = a === 0;
        const beamW = isMain ? w : w * 0.65;

        // 1. Halo volumétrico externo de dispersão de luz
        ctx.strokeStyle = `rgba(0, 206, 201, ${alpha * 0.55})`;
        ctx.lineWidth = beamW * (1 - progress * 0.35);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 2. Feixe intermediário de plasma estelar
        ctx.strokeStyle = `rgba(232, 67, 147, ${alpha * 0.75})`;
        ctx.lineWidth = beamW * 0.45;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 3. Feixe central superaquecido incandescente
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = Math.max(3, beamW * 0.2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 4. Fraturas e partículas estelares disparadas ao longo do feixe
        const sparkCount = 6;
        ctx.fillStyle = '#ffffff';
        for (let s = 1; s <= sparkCount; s++) {
          const sDist = (s / (sparkCount + 1)) * len * (progress * 1.3);
          if (sDist <= len) {
            const sx = cosA * sDist;
            const sy = sinA * sDist;
            const perp = (s % 2 === 0 ? 1 : -1) * (14 * (1 - progress));
            ctx.fillRect(sx - sinA * perp - 3, sy + cosA * perp - 3, 6, 6);
          }
        }
      }

      // Detonação esférica brilhante no centro do corpo do Soberano (0, 0)
      const flareR = Math.max(0, 52 * (1 - progress));
      const flareGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, Math.max(6, flareR));
      flareGrad.addColorStop(0, '#ffffff');
      flareGrad.addColorStop(0.35, 'rgba(0, 206, 201, 0.95)');
      flareGrad.addColorStop(0.75, 'rgba(232, 67, 147, 0.7)');
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(0, 0, flareR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (atk.type === 'VOID_IMPLOSION_CORE') {
      // Coordenadas relativas ao centro do chefe
      const relX = atk.x - e.x;
      const relY = atk.y - e.y;
      const alpha = Math.max(0, 1 - progress);
      const curR = Math.max(4, (atk.radius || 180) * (1 - progress * 0.7));

      ctx.save();
      ctx.fillStyle = `rgba(142, 68, 173, ${alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(relX, relY, curR * 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(relX, relY, curR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(224, 86, 253, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      const rayCount = 8;
      ctx.strokeStyle = `rgba(0, 206, 201, ${alpha * 0.6})`;
      ctx.lineWidth = 1.5;
      for (let r = 0; r < rayCount; r++) {
        const ra = (r * Math.PI * 2) / rayCount + frameCount * 0.15;
        const rx1 = relX + Math.cos(ra) * curR;
        const ry1 = relY + Math.sin(ra) * curR;
        const rx2 = relX + Math.cos(ra) * (curR * 1.6);
        const ry2 = relY + Math.sin(ra) * (curR * 1.6);
        ctx.beginPath();
        ctx.moveTo(rx1, ry1);
        ctx.lineTo(rx2, ry2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (atk.type === 'SUPERNOVA_FLASH') {
      // Clarão cósmico expansivo centrado no chefe (0, 0)
      const alpha = Math.max(0, 1 - progress);
      const flashR = (atk.maxR || 420) * progress;

      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(0, 0, flashR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(232, 67, 147, ${alpha * 0.75})`;
      ctx.lineWidth = 6 * (1 - progress);
      ctx.beginPath();
      ctx.arc(0, 0, flashR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (atk.type === 'FALLING_ASTRAL_METEOR') {
      // Coordenadas relativas ao chefe
      const relStartX = atk.startX - e.x;
      const relStartY = atk.startY - e.y;
      const relTargetX = atk.targetX - e.x;
      const relTargetY = atk.targetY - e.y;
      const curX = relStartX + (relTargetX - relStartX) * progress;
      const curY = relStartY + (relTargetY - relStartY) * progress;

      ctx.save();
      const trailGrad = ctx.createLinearGradient(relStartX, relStartY, curX, curY);
      trailGrad.addColorStop(0, 'rgba(232, 67, 147, 0)');
      trailGrad.addColorStop(0.7, 'rgba(0, 206, 201, 0.6)');
      trailGrad.addColorStop(1, '#ffffff');

      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(curX - (relTargetX - relStartX) * 0.35, curY - (relTargetY - relStartY) * 0.35);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(curX, curY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

export function drawAbyssSovereign(ctx, e, frameCount) {
  // Neutraliza o espelhamento ctx.scale(e.facing, 1) vindo do enemiesRenderer.js
  // garantindo renderização matematicamente perfeita em coordenadas de mundo e ângulos reais
  ctx.scale(e.facing || 1, 1);

  if (e.actionState === SOVEREIGN_STATES.SPAWN_INTRO) {
    drawMajesticSpawnIntro(ctx, e, frameCount);
  } else {
  const R = e.radius;
  const isTransition = e.actionState === SOVEREIGN_STATES.PHASE_TRANSITION;

  // Micro-contração cósmica e anel de aviso contratil pré-detonação da transição
  if (isTransition && e.transitionWindup > 0) {
    const windupRatio = 1 - Math.max(0, e.transitionWindup / 40);
    const scaleFactor = 1.0 - 0.22 * Math.sin(windupRatio * Math.PI);
    ctx.scale(scaleFactor, scaleFactor);

    const ringRadius = Math.max(10, 260 * (1 - windupRatio));
    ctx.save();
    ctx.strokeStyle = e.phase === 2 ? 'rgba(232, 67, 147, 0.9)' : 'rgba(0, 206, 201, 0.9)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const isStaggered = e.actionState === SOVEREIGN_STATES.RECOVERY_STAGGER;
  const isWindup = e.actionState === SOVEREIGN_STATES.WINDUP;
  const isCasting = e.actionState === SOVEREIGN_STATES.CASTING;
  const isHit = e.hitFlash > 0;

  let primaryCol = '#8e44ad';
  let secondaryCol = '#341f97';
  let coreCol = '#e84393';
  let edgeCol = '#a29bfe';

  if (e.phase === 2) {
    primaryCol = '#e84393';
    secondaryCol = '#6c5ce7';
    coreCol = '#ff7675';
    edgeCol = '#fd79a8';
  } else if (e.phase === 3) {
    primaryCol = '#00cec9';
    secondaryCol = '#0984e3';
    coreCol = '#ffffff';
    edgeCol = '#81ecec';
  }

  // 1. Selo Abissal no Solo
  ctx.save();
  const groundPulse = Math.sin(frameCount * 0.08) * 4;
  const groundRot = frameCount * 0.015;

  const idleB = e.idleBlend || 0;
  let sealCol = isStaggered ? 'rgba(127, 140, 141, 0.4)' : (e.phase === 3 ? 'rgba(0, 206, 201, 0.4)' : (e.phase === 2 ? 'rgba(232, 67, 147, 0.4)' : 'rgba(142, 68, 173, 0.4)'));
  let innerCol = isStaggered ? 'rgba(189, 195, 199, 0.25)' : (e.phase === 3 ? 'rgba(129, 236, 236, 0.35)' : (e.phase === 2 ? 'rgba(232, 67, 147, 0.35)' : 'rgba(162, 155, 254, 0.35)'));

  if (idleB > 0.05) {
    // No estado inativo, o selo transmuta suavemente para o azul-gelo sereno da referência
    sealCol = `rgba(129, 236, 236, ${0.4 * (1 - idleB) + 0.38 * idleB})`;
    innerCol = `rgba(200, 245, 255, ${0.35 * (1 - idleB) + 0.42 * idleB})`;
  }

  ctx.strokeStyle = sealCol;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.95, R * 1.6 + groundPulse, R * 0.55 + groundPulse * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = innerCol;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.ellipse(0, R * 0.95, R * 1.35 + groundPulse * 0.5, R * 0.45 + groundPulse * 0.2, -groundRot * 1.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const runeCount = 8;
  for (let rn = 0; rn < runeCount; rn++) {
    const ra = groundRot + (rn * Math.PI * 2) / runeCount;
    const rx = Math.cos(ra) * (R * 1.6 + groundPulse);
    const ry = R * 0.95 + Math.sin(ra) * (R * 0.55 + groundPulse * 0.35);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + Math.cos(ra) * 6, ry + Math.sin(ra) * 3);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Barreira do Horizonte de Eventos
  if (e.phase >= 2) {
    const relCenterX = e.arenaCenterX - e.x;
    const relCenterY = e.arenaCenterY - e.y;

    ctx.save();
    ctx.translate(relCenterX, relCenterY);

    const pulseR = e.arenaRadius + e.horizonPulse * 3;

    ctx.strokeStyle = e.phase === 3 ? 'rgba(0, 206, 201, 0.65)' : 'rgba(232, 67, 147, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, pulseR - 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const horizonRunes = 12;
    ctx.fillStyle = e.phase === 3 ? '#00d2d3' : '#e84393';
    for (let r = 0; r < horizonRunes; r++) {
      const rAng = (r * Math.PI * 2 / horizonRunes) + frameCount * 0.005;
      const rx = Math.cos(rAng) * pulseR;
      const ry = Math.sin(rAng) * pulseR;
      ctx.fillRect(rx - 3, ry - 3, 6, 6);
    }
    ctx.restore();
  }

  // 3. Orbes Elípticos da Singularidade
  if (e.phase === 3 && e.singularityOrbs && e.singularityOrbs.length > 0) {
    ctx.save();
    for (let i = 0; i < e.singularityOrbs.length; i++) {
      const orb = e.singularityOrbs[i];
      if (orb.curX === undefined) continue;

      const relX = orb.curX - e.x;
      const relY = orb.curY - e.y;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(relX, relY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(relX, relY, 7.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Telegrafia do Crucifixo
  if (isWindup && e.currentSkill === 'VOID_CRUCIFIX') {
    const armCount = e.phase === 1 ? 4 : 6;
    ctx.save();
    ctx.strokeStyle = 'rgba(232, 67, 147, 0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);

    for (let arm = 0; arm < armCount; arm++) {
      const rayAng = e.beamAngle + (arm * (Math.PI * 2 / armCount));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(rayAng) * 1300, Math.sin(rayAng) * 1300);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 5. Feixes do Crucifixo do Vácuo
  if (isCasting && e.currentSkill === 'VOID_CRUCIFIX') {
    const armCount = e.phase === 1 ? 4 : 6;
    ctx.save();

    for (let arm = 0; arm < armCount; arm++) {
      const rayAng = e.beamAngle + (arm * (Math.PI * 2 / armCount));
      const rx = Math.cos(rayAng) * 1300;
      const ry = Math.sin(rayAng) * 1300;

      ctx.strokeStyle = e.phase === 3 ? 'rgba(0, 206, 201, 0.45)' : 'rgba(232, 67, 147, 0.45)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rx, ry);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Telegrafia do Corte Dimensional: Feixe de mira partindo DIRETO do corpo do Soberano (0, 0)
  if (isWindup && e.currentSkill === 'DIMENSIONAL_CLEAVE') {
    ctx.save();
    const isLocked = e.cleaveLocked;
    const isPhase3 = e.phase === 3;
    const baseAng = e.cleaveAngle || 0;
    const aimAngles = isPhase3 ? [baseAng, baseAng - 0.28, baseAng + 0.28] : [baseAng];
    const beamLen = 1500;

    for (let l = 0; l < aimAngles.length; l++) {
      const ang = aimAngles[l];
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const isMain = l === 0;

      // Linha guia de mira partindo de (0, 0) em direção ao jogador
      ctx.strokeStyle = isLocked 
        ? (isMain ? '#ffffff' : 'rgba(232, 67, 147, 0.85)') 
        : (isMain ? 'rgba(0, 206, 201, 0.75)' : 'rgba(0, 206, 201, 0.45)');
      ctx.lineWidth = isLocked ? (isMain ? 3.5 : 2.0) : (isMain ? 2.0 : 1.2);
      ctx.setLineDash(isLocked ? [12, 6] : [6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * beamLen, sinA * beamLen);
      ctx.stroke();
      ctx.setLineDash([]);

      // Corredor de perigo translúcido
      ctx.fillStyle = isLocked ? 'rgba(232, 67, 147, 0.12)' : 'rgba(0, 206, 201, 0.07)';
      ctx.beginPath();
      const perpX = -sinA * (isMain ? 26 : 18);
      const perpY = cosA * (isMain ? 26 : 18);
      ctx.moveTo(perpX, perpY);
      ctx.lineTo(cosA * beamLen + perpX, sinA * beamLen + perpY);
      ctx.lineTo(cosA * beamLen - perpX, sinA * beamLen - perpY);
      ctx.lineTo(-perpX, -perpY);
      ctx.closePath();
      ctx.fill();
    }

    // Ponto de foco de energia incandescente no centro do chefe
    const chargeR = 14 + Math.sin(frameCount * 0.3) * 4;
    ctx.fillStyle = isLocked ? '#ffffff' : '#00cec9';
    ctx.beginPath();
    ctx.arc(0, 0, chargeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 6. Colapso de Matéria Escura
  if (isWindup && e.currentSkill === 'SINGULARITY_IMPLOSION') {
    const relX = e.implosionX - e.x;
    const relY = e.implosionY - e.y;

    ctx.save();
    ctx.strokeStyle = e.implosionLocked ? 'rgba(224, 86, 253, 0.9)' : 'rgba(142, 68, 173, 0.8)';
    ctx.lineWidth = e.implosionLocked ? 3.5 : 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(relX, relY, Math.max(10, e.implosionRadius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = e.implosionLocked ? 'rgba(224, 86, 253, 0.25)' : 'rgba(142, 68, 173, 0.15)';
    ctx.beginPath();
    ctx.arc(relX, relY, Math.max(10, e.implosionRadius), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 7. Passo Interdimensional
  if (e.actionState === SOVEREIGN_STATES.WARP_AIM) {
    const relX = e.warpTargetX - e.x;
    const relY = e.warpTargetY - e.y;
    const ratio = 1 - (e.windupTimer / e.windupMax);

    ctx.save();
    ctx.strokeStyle = '#e84393';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(relX, relY, 55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(relX, relY, 55 * ratio, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 8. Âncoras de Vácuo (Orbes de Singularidade Cósmica)
  if (e.anchors && e.anchors.length > 0) {
    for (let i = 0; i < e.anchors.length; i++) {
      const a = e.anchors[i];
      if (!a.active) continue;

      const relX = a.x - e.x;
      const relY = a.y - e.y;
      const tetherDist = Math.hypot(relX, relY) || 1;
      const tetherAng = Math.atan2(relY, relX);

      // --- A. LIGAÇÃO ENERGÉTICA CÓSMICA (TETHER) ---
      ctx.save();

      // Feixe volumétrico externo de dispersão
      const pulseBeam = 0.25 + Math.sin(frameCount * 0.1 + i) * 0.1;
      ctx.strokeStyle = `rgba(0, 206, 201, ${pulseBeam})`;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(relX, relY);
      ctx.stroke();

      // Feixe intermediário
      ctx.strokeStyle = 'rgba(162, 155, 254, 0.65)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(relX, relY);
      ctx.stroke();

      // Filamento central superaquecido
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(relX, relY);
      ctx.stroke();

      // Espiral de energia helicoidal ao redor do feixe
      const waveSegs = 18;
      ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const perpX = -Math.sin(tetherAng);
      const perpY = Math.cos(tetherAng);
      for (let s = 0; s <= waveSegs; s++) {
        const t = s / waveSegs;
        const bx = relX * t;
        const by = relY * t;
        const wave = Math.sin(t * Math.PI * 4 - frameCount * 0.14 + i * 2) * 9;
        const wx = bx + perpX * wave;
        const wy = by + perpY * wave;
        if (s === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Sifões de matéria cósmica fluindo em direção ao Soberano
      for (let p = 0; p < 3; p++) {
        const flowT = ((frameCount * 0.04 + i * 0.33 + p * 0.33) % 1);
        const flowX = relX * (1 - flowT);
        const flowY = relY * (1 - flowT);
        const flowR = 2.5 + Math.sin(frameCount * 0.2 + p) * 1;
        ctx.fillStyle = p === 0 ? '#ffffff' : (p === 1 ? '#00d2d3' : '#e84393');
        ctx.beginPath();
        ctx.arc(flowX, flowY, flowR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- B. CORPO DA ORBE DE SINGULARIDADE ---
      ctx.save();
      ctx.translate(relX, relY);

      const isAnchorHit = a.hitFlash > 0;
      const anchorR = a.radius;
      const hpRatio = Math.max(0, a.hp / a.maxHp);

      // 1. Halo Radial de Distorção Gravitacional
      const auraPulse = Math.sin(frameCount * 0.12 + i * 1.5) * 5;
      const glowGrad = ctx.createRadialGradient(0, 0, anchorR * 0.2, 0, 0, anchorR * 2.0 + auraPulse);
      glowGrad.addColorStop(0, isAnchorHit ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 206, 201, 0.5)');
      glowGrad.addColorStop(0.5, 'rgba(142, 68, 173, 0.28)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, anchorR * 2.0 + auraPulse, 0, Math.PI * 2);
      ctx.fill();

      // 2. Anel Giroscópico Primário com Nodos Orbitais
      const rot1 = frameCount * 0.045 + i;
      ctx.save();
      ctx.rotate(rot1);
      ctx.strokeStyle = isAnchorHit ? '#ffffff' : 'rgba(0, 206, 201, 0.8)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, anchorR * 1.55, anchorR * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();

      for (let k = 0; k < 3; k++) {
        const kAng = (k * Math.PI * 2 / 3) + frameCount * 0.06;
        const kx = Math.cos(kAng) * (anchorR * 1.55);
        const ky = Math.sin(kAng) * (anchorR * 0.65);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(kx, ky, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Anel Giroscópico Secundário Contra-Rotativo
      const rot2 = -frameCount * 0.055 + i * 1.3;
      ctx.save();
      ctx.rotate(rot2);
      ctx.strokeStyle = isAnchorHit ? '#ffffff' : 'rgba(232, 67, 147, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(0, 0, anchorR * 1.3, anchorR * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 4. Carapaça de Fragmentos Criptográficos
      const shardCount = 4;
      const shardBreath = Math.sin(frameCount * 0.14 + i) * 3;
      const shardDist = anchorR * 0.88 + shardBreath;
      const shardRot = frameCount * 0.025 + i * 0.8;

      for (let s = 0; s < shardCount; s++) {
        const sAng = shardRot + (s * Math.PI * 2 / shardCount);
        const sx = Math.cos(sAng) * shardDist;
        const sy = Math.sin(sAng) * shardDist;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sAng + Math.PI / 2);

        ctx.fillStyle = isAnchorHit ? '#ffffff' : '#08010f';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(5.5, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-5.5, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isAnchorHit ? '#ffffff' : (s % 2 === 0 ? '#00cec9' : '#a29bfe');
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // 5. Núcleo Cósmico de Singularidade
      const coreR = anchorR * 0.68;
      ctx.fillStyle = isAnchorHit ? '#ffffff' : '#040008';
      ctx.beginPath();
      ctx.arc(0, 0, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isAnchorHit ? '#ffffff' : '#00cec9';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const innerPulse = Math.sin(frameCount * 0.2 + i * 2) * 2.2;
      const nebulaGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coreR * 0.85);
      nebulaGrad.addColorStop(0, '#ffffff');
      nebulaGrad.addColorStop(0.3, '#00cec9');
      nebulaGrad.addColorStop(0.7, '#8e44ad');
      nebulaGrad.addColorStop(1, '#05010a');
      ctx.fillStyle = nebulaGrad;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, coreR * 0.72 + innerPulse), 0, Math.PI * 2);
      ctx.fill();

      // Pupila de vácuo
      ctx.fillStyle = '#020005';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.8, coreR * 0.5 + innerPulse * 0.5, frameCount * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Arcos de instabilidade quando a vida está baixa
      if (hpRatio < 0.45 || isAnchorHit) {
        const sparkAng = (frameCount * 0.35 + i * 3) % (Math.PI * 2);
        ctx.strokeStyle = '#e84393';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(sparkAng) * (coreR * 0.8), Math.sin(sparkAng) * (coreR * 0.8));
        ctx.lineTo(Math.cos(sparkAng) * (anchorR * 1.45), Math.sin(sparkAng) * (anchorR * 1.45));
        ctx.stroke();
      }

      // 6. Barra de Vida Rúnica Superior
      const barW = 44;
      const barH = 5;
      const barY = -anchorR - 14;

      ctx.fillStyle = 'rgba(6, 4, 12, 0.9)';
      ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      const barGrad = ctx.createLinearGradient(-barW / 2, 0, barW / 2, 0);
      barGrad.addColorStop(0, '#00cec9');
      barGrad.addColorStop(1, '#a29bfe');
      ctx.fillStyle = barGrad;
      ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);

      ctx.strokeStyle = isAnchorHit ? '#ffffff' : 'rgba(0, 206, 201, 0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      ctx.fillStyle = '#00cec9';
      ctx.fillRect(-barW / 2 - 3, barY - 2, 2, barH + 4);
      ctx.fillRect(barW / 2 + 1, barY - 2, 2, barH + 4);

      ctx.restore();
    }
  }

  // 9. Asas de Plasma Celestial (Exclusivo Fase 3 / Despertar da Singularidade)
  if (e.phase === 3) {
    drawSingularityPlasmaWings(ctx, e, R, frameCount, edgeCol, isStaggered, e.idleBlend || 0);
  }

  // 10. Membros Articulados Brancos com Juntas e Olhos (Fiel à Referência)
  drawCelestialLimbs(ctx, e, R, frameCount, isStaggered, isWindup, isCasting);

  // 11. Espinhos Cristalinos apontando para baixo na base da esfera
  drawDownwardCrystallineSpikes(ctx, e, R, frameCount);

  // 12. Esfera de Vácuo Central com Contorno Branco e Mandala Sagrada
  drawSacredMandalaVoidSphere(ctx, e, R, frameCount, isHit, isStaggered, e.phase, e.idleBlend || 0);

  // 13. Olho Observador Prateado Horizontal (Fiel à Referência)
  drawColdObserverEye(ctx, e, R, frameCount, isStaggered, isWindup, isCasting, e.phase, e.idleBlend || 0);

  // 14. Efeitos Visuais Ativos de Ataques em Execução (Cortes, Meteoros, Implosões, Supernovas)
  drawActiveSovereignAttacks(ctx, e, frameCount);


  // Orbes e Constelações da Supernova da Entropia
  if (e.supernovaOrbs && e.supernovaOrbs.length > 0) {
    ctx.save();
    const orbCount = e.supernovaOrbs.length;
    const orbRot = frameCount * 0.03;
    const orbPts = [];
    for (let o = 0; o < orbCount; o++) {
      const oDef = e.supernovaOrbs[o];
      const oAng = oDef.baseAngle + orbRot;
      const ox = Math.cos(oAng) * oDef.dist;
      const oy = Math.sin(oAng) * oDef.dist;
      orbPts.push({ x: ox, y: oy });
    }

    // Linhas de constelação estelar
    ctx.strokeStyle = 'rgba(224, 86, 253, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let o = 0; o < orbCount; o++) {
      const p1 = orbPts[o];
      const p2 = orbPts[(o + 1) % orbCount];
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    // Linhas radiais ao núcleo do Soberano
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.25)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let o = 0; o < orbCount; o++) {
      ctx.moveTo(0, 0);
      ctx.lineTo(orbPts[o].x, orbPts[o].y);
    }
    ctx.stroke();

    // Orbes estelares individuais
    for (let o = 0; o < orbCount; o++) {
      const pt = orbPts[o];
      const oPulse = 5 + Math.sin(frameCount * 0.2 + o) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = (o % 2 === 0) ? '#00cec9' : '#e84393';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, oPulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 13. Barra de Estabilidade Dimensional
  if ((isWindup || isCasting) && e.staggerGauge > 0) {
    const barW = 54;
    const barH = 5;
    const ratio = Math.min(1, e.staggerGauge / e.maxStaggerGauge);
    ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
    ctx.fillRect(-barW / 2, -R - 18, barW, barH);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-barW / 2, -R - 18, barW * ratio, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, -R - 18, barW, barH);
  }
  }

  // 18. Grande Banner Cinematográfico de Tela (Tema Vermelho, Duração Reduzida em 50% e Responsivo para Telas Verticais)
  if (e.titleTimer > 0) {
    drawCinematicScreenTitle(ctx, e, frameCount);
  }
}
