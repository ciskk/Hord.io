/**
 * src/entities/bosses/abyssSovereign/render.js
 * Renderização procedural completa no Canvas do Soberano do Abismo (Boss 4 / Chefe Final).
 */
import { 
  dpr, 
  viewW, 
  viewH 
} from '../../../main.js';
import { getHudBottom } from '../../../core/responsive.js';
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
 * Renderiza a Sequência Cinematográfica Dramática de Derrota em 4 Atos do Soberano do Abismo.
 * Ato 1: Fratura Fatal & Desestabilização (Agulhas quebram, espasmos nos tentáculos, fendas na mandala).
 * Ato 2: Implosão Gravitacional de Vácuo (Vórtice reverso sugando a luz e matéria para dentro do olho).
 * Ato 3: Supernova Divina Dourada (Flash de glória celestial e dispersão em poeira estelar ascendente).
 * Ato 4: Despedida Estelar & Fade-out.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
function drawMajesticDeathCollapse(ctx, e, frameCount) {
  const R = e.radius;
  const maxT = e.defeatMaxTimer || 420;
  const progress = Math.min(1.0, Math.max(0, 1 - ((e.defeatTimer || 0) / maxT)));

  // =========================================================================
  // ATO 1: FRATURA FATAL & DESESTABILIZAÇÃO (0.00 <= progress < 0.25)
  // =========================================================================
  if (progress < 0.25) {
    const act1Prog = progress / 0.25;
    ctx.save();

    // Tremores e espasmos agônicos da carcaça titânica
    const spasmX = (Math.sin(frameCount * 0.9) * 2.5 + Math.cos(frameCount * 1.3) * 1.5) * (1 + act1Prog * 2);
    const spasmY = (Math.cos(frameCount * 0.8) * 2.0) * (1 + act1Prog * 2);
    ctx.translate(spasmX, spasmY);

    // 1. As 4 Agulhas Cristalinas inferiores partindo-se e caindo em pedaços girando
    const fallDist = Math.pow(act1Prog, 2) * 110;
    const spikeDefs = [
      { x: -R * 0.40, y: R * 0.70, len: 32, ang: 0.02, w: 6.5, vx: -32 * act1Prog, rot: -0.8 * act1Prog },
      { x: -R * 0.16, y: R * 0.80, len: 48, ang: 0.00, w: 8.5, vx: -14 * act1Prog, rot: -0.4 * act1Prog },
      { x:  R * 0.16, y: R * 0.80, len: 48, ang: 0.00, w: 8.5, vx:  14 * act1Prog, rot:  0.4 * act1Prog },
      { x:  R * 0.40, y: R * 0.70, len: 32, ang: -0.02, w: 6.5, vx:  32 * act1Prog, rot:  0.8 * act1Prog }
    ];

    for (let i = 0; i < spikeDefs.length; i++) {
      const sp = spikeDefs[i];
      const curX = sp.x + sp.vx;
      const curY = sp.y + fallDist;
      const curAng = sp.ang + sp.rot;

      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(curAng);

      const tipX = Math.sin(0) * sp.len;
      const tipY = Math.cos(0) * sp.len;
      const perpX = sp.w * 0.5;

      ctx.fillStyle = '#0a0614';
      ctx.beginPath();
      ctx.moveTo(-perpX, 0);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(perpX, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Fissura de luz interna no fragmento
      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      ctx.restore();
    }

    // 2. Membros e Tentáculos Convulsionando com Faíscas
    ctx.save();
    drawCelestialLimbs(ctx, e, R, frameCount, true, false, false);
    ctx.restore();

    // 3. Domo Sagrado e Esfera Obsidiana com Trincas Violentas e Flash
    const isGlitchFlash = act1Prog > 0.10 && Math.floor(frameCount) % 4 === 0;
    drawSacredMandalaVoidSphere(ctx, e, R, frameCount, isGlitchFlash, true, 3, 0);

    // 4. Olho Observador Arregalado e Trincando
    e.eyeAperture = 1.0;
    drawColdObserverEye(ctx, e, R, frameCount, true, false, false, 3, 0);

    // 5. Relâmpagos de matéria escura e arco elétrico instável
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    for (let l = 0; l < 3; l++) {
      const lY = (Math.sin(frameCount * 0.5 + l * 2) * R * 0.7);
      const lW = Math.sin(frameCount * 0.6 + l) * (R * 1.1);
      ctx.beginPath();
      ctx.moveTo(0, lY);
      ctx.lineTo(lW * 0.5, lY + 6);
      ctx.lineTo(lW, lY - 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // ATO 2: IMPLOSÃO GRAVITACIONAL DE VÁCUO (0.25 <= progress < 0.55)
  // =========================================================================
  else if (progress < 0.55) {
    const act2Prog = (progress - 0.25) / 0.30;
    const implodeScale = Math.max(0.04, 1.0 - Math.pow(act2Prog, 1.6) * 0.96);
    const spinAng = act2Prog * Math.PI * 4;

    ctx.save();

    // 1. Anéis concêntricos de sucção reversa (colapso gravitacional)
    for (let r = 0; r < 4; r++) {
      const ringProg = ((act2Prog * 3 + r * 0.25) % 1);
      const ringR = (1 - ringProg) * (R * 3.4);
      ctx.strokeStyle = r % 2 === 0 ? `rgba(0, 206, 201, ${ringProg * 0.9})` : `rgba(241, 196, 15, ${ringProg * 0.85})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, ringR), 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Raios de sucção espiral curvando para o centro
    const suctionRays = 8;
    for (let s = 0; s < suctionRays; s++) {
      const sAng = (s * Math.PI * 2) / suctionRays + act2Prog * 8;
      const rayLen = (1 - act2Prog) * 170;
      ctx.strokeStyle = s % 2 === 0 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(232, 67, 147, 0.75)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sAng) * rayLen, Math.sin(sAng) * rayLen);
      ctx.lineTo(Math.cos(sAng + 0.35) * (rayLen * 0.25), Math.sin(sAng + 0.35) * (rayLen * 0.25));
      ctx.stroke();
    }

    // 3. Entidade sendo comprimida para dentro do próprio centro
    ctx.scale(implodeScale, implodeScale);
    ctx.rotate(spinAng);
    drawSacredMandalaVoidSphere(ctx, e, R, frameCount, true, true, 3, 0);
    drawColdObserverEye(ctx, e, R, frameCount, true, false, false, 3, 0);
    drawCelestialLimbs(ctx, e, R, frameCount, true, false, false);

    ctx.restore();

    // 4. Núcleo hiperdenso incandescente prestes a explodir
    const corePulse = 10 + Math.sin(frameCount * 0.5) * 4 + act2Prog * 14;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, corePulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }

  // =========================================================================
  // ATO 3: SUPERNOVA DIVINA & DISSIPAÇÃO ESTELAR (0.55 <= progress < 0.85)
  // =========================================================================
  else if (progress < 0.85) {
    const act3Prog = (progress - 0.55) / 0.30;
    ctx.save();

    // 1. Flash Inicial e Corona Radiante da Supernova Divina Dourada/Branca
    if (act3Prog < 0.28) {
      const flashAlpha = 1 - (act3Prog / 0.28);
      const coronaR = (act3Prog / 0.28) * (R * 7.5);

      const blastGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, Math.max(12, coronaR));
      blastGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha * 0.98})`);
      blastGrad.addColorStop(0.25, `rgba(241, 196, 15, ${flashAlpha * 0.92})`);
      blastGrad.addColorStop(0.65, `rgba(0, 206, 201, ${flashAlpha * 0.50})`);
      blastGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = blastGrad;
      ctx.beginPath();
      ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
      ctx.fill();

      // Feixes radiais de luz estelar saindo do epicentro
      const starRays = 12;
      for (let sr = 0; sr < starRays; sr++) {
        const sAng = (sr * Math.PI * 2) / starRays + frameCount * 0.02;
        ctx.strokeStyle = `rgba(255, 246, 169, ${flashAlpha * 0.75})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sAng) * (coronaR * 1.25), Math.sin(sAng) * (coronaR * 1.25));
        ctx.stroke();
      }
    }

    // 2. Poeira Estelar Celestial Ascendente
    const stardustCount = 32;
    for (let p = 0; p < stardustCount; p++) {
      const pSeed = p * 137.5;
      const pT = ((frameCount * 0.015 + p * 0.035) % 1);
      const px = Math.sin(pSeed) * (R * 2.8);
      const py = (Math.cos(pSeed) * (R * 1.4)) - pT * 240;
      const pAlpha = Math.sin(pT * Math.PI) * (1 - act3Prog * 0.25);

      ctx.fillStyle = p % 3 === 0 ? `rgba(241, 196, 15, ${pAlpha})` : (p % 3 === 1 ? `rgba(255, 255, 255, ${pAlpha})` : `rgba(0, 206, 201, ${pAlpha})`);
      const pR = 2.2 + Math.sin(frameCount * 0.2 + p) * 1.4;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.6, pR), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // ATO 4: DESPEDIDA ESTELAR & FADE-OUT (0.85 <= progress <= 1.00)
  // =========================================================================
  else {
    const act4Prog = (progress - 0.85) / 0.15;
    ctx.save();
    for (let p = 0; p < 18; p++) {
      const pSeed = p * 137.5;
      const pT = ((frameCount * 0.01 + p * 0.05) % 1);
      const px = Math.sin(pSeed) * (R * 2.4);
      const py = (Math.cos(pSeed) * (R * 1.2)) - pT * 220;
      const pAlpha = Math.sin(pT * Math.PI) * (1 - act4Prog);

      ctx.fillStyle = `rgba(241, 196, 15, ${pAlpha * 0.85})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
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
  // O banner é centralizado horizontalmente e ancorado com evasão garantida do HUD
  const isCompactH = screenH < 520;
  const hudBottom = getHudBottom();
  const bannerW = isVertical 
    ? Math.min(380, screenW * 0.94) 
    : (isCompactH ? Math.min(640, screenW * 0.88) : Math.min(880, screenW * 0.90));
  const bannerH = isVertical ? 58 : (isCompactH ? 56 : 94);
  const bx = (screenW - bannerW) / 2;
  const calculatedY = Math.round((screenH / 2) - bannerH - (isVertical ? 45 : (isCompactH ? 20 : 65)));
  const by = Math.max(hudBottom + 8, calculatedY);

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
 * Renderiza o Grande Banner Dourado de Vitória Cósmica ao abater o Soberano do Abismo.
 * Geometria heráldica inspirada no banner de boss, transmutada para Ouro Imperial Cósmico.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
function drawGoldenVictoryBanner(ctx, e, frameCount) {
  const maxT = e.defeatMaxTimer || 540;
  const progress = Math.min(1.0, Math.max(0, 1 - ((e.defeatTimer || 0) / maxT)));

  // O banner começa a surgir suavemente a partir de progress = 0.52 (Ato 3)
  if (progress < 0.52) return;

  const enterRatio = Math.min(1.0, (progress - 0.52) / 0.08);
  let bannerAlpha = enterRatio;
  if (progress > 0.94) {
    bannerAlpha = Math.max(0, (1.0 - progress) / 0.06);
  }

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = bannerAlpha;

  const screenW = viewW || (typeof window !== 'undefined' ? window.innerWidth : 1280);
  const screenH = viewH || (typeof window !== 'undefined' ? window.innerHeight : 800);
  const isVertical = screenH > screenW || screenW < 640;
  const isCompactH = screenH < 520;

  const bannerW = isVertical 
    ? Math.min(420, screenW * 0.94) 
    : (isCompactH ? Math.min(680, screenW * 0.90) : Math.min(940, screenW * 0.92));
  const bannerH = isVertical ? 108 : (isCompactH ? 90 : 128);
  const bx = (screenW - bannerW) / 2;
  const by = Math.round((screenH - bannerH) / 2 - (isVertical ? 40 : (isCompactH ? 15 : 28)));
  const centerX = screenW / 2;
  const centerY = by + bannerH / 2;

  // Punch-in zoom de entrada com sutil pulsação contínua
  const punchScale = 0.88 + 0.12 * Math.sin(enterRatio * Math.PI * 0.5) + Math.sin(frameCount * 0.04) * 0.006;
  ctx.translate(centerX, centerY);
  ctx.scale(punchScale, punchScale);
  ctx.translate(-centerX, -centerY);

  // 0. Raios Cósmicos Celestiais Rotativos atrás do banner (God Rays)
  ctx.save();
  const rayCount = isVertical ? 16 : 24;
  const rayRot = frameCount * 0.005;
  const maxRayDist = Math.max(bannerW * 0.75, 420);
  const rayGrad = ctx.createRadialGradient(centerX, centerY, 15, centerX, centerY, maxRayDist);
  rayGrad.addColorStop(0, 'rgba(255, 245, 170, 0.28)');
  rayGrad.addColorStop(0.3, 'rgba(241, 196, 15, 0.16)');
  rayGrad.addColorStop(0.7, 'rgba(212, 172, 13, 0.05)');
  rayGrad.addColorStop(1, 'rgba(212, 172, 13, 0)');
  ctx.fillStyle = rayGrad;

  for (let r = 0; r < rayCount; r++) {
    const ang = rayRot + (r * Math.PI * 2) / rayCount;
    const rayWidth = (r % 2 === 0 ? 0.06 : 0.032);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, maxRayDist, ang - rayWidth, ang + rayWidth);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 1. Fundo Imperial Obsidiana com Ouro Profundo
  const bgGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  bgGrad.addColorStop(0, 'rgba(10, 8, 2, 0)');
  bgGrad.addColorStop(0.12, 'rgba(20, 15, 4, 0.96)');
  bgGrad.addColorStop(0.5, 'rgba(46, 34, 8, 0.98)');
  bgGrad.addColorStop(0.88, 'rgba(20, 15, 4, 0.96)');
  bgGrad.addColorStop(1, 'rgba(10, 8, 2, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(bx, by, bannerW, bannerH);

  // 2. Frisos de Neon Dourado Superior e Inferior com pulsação
  const pulseGlow = 14 + Math.sin(frameCount * 0.12) * 6;
  const borderGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  borderGrad.addColorStop(0, 'rgba(241, 196, 15, 0)');
  borderGrad.addColorStop(0.2, 'rgba(241, 196, 15, 0.95)');
  borderGrad.addColorStop(0.5, 'rgba(255, 250, 190, 1)');
  borderGrad.addColorStop(0.8, 'rgba(241, 196, 15, 0.95)');
  borderGrad.addColorStop(1, 'rgba(241, 196, 15, 0)');

  ctx.shadowColor = 'rgba(241, 196, 15, 0.85)';
  ctx.shadowBlur = pulseGlow;
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isVertical ? 2.4 : 3.0;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bannerW, by);
  ctx.moveTo(bx, by + bannerH);
  ctx.lineTo(bx + bannerW, by + bannerH);
  ctx.stroke();

  // Frisos internos dourados finos
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 235, 150, 0.4)';
  ctx.lineWidth = 1;
  const padX = isVertical ? 22 : 45;
  ctx.beginPath();
  ctx.moveTo(bx + padX, by + 3);
  ctx.lineTo(bx + bannerW - padX, by + 3);
  ctx.moveTo(bx + padX, by + bannerH - 3);
  ctx.lineTo(bx + bannerW - padX, by + bannerH - 3);
  ctx.stroke();

  // 3. Cantoneiras Geométricas Douradas e Gemas Celestiais
  const cornerSize = isVertical ? 12 : 18;
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(bx + padX * 0.7, by - 1.5, cornerSize, 3);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by - 1.5, cornerSize, 3);
  ctx.fillStyle = '#d4ac0d';
  ctx.fillRect(bx + padX * 0.7, by + bannerH - 1.5, cornerSize, 3);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by + bannerH - 1.5, cornerSize, 3);

  // 4. Efeito de Shimmer Metálico Deslizante (Varredura Diagonal Dourada)
  const shimmerCycle = (frameCount * 0.014) % 1.6;
  if (shimmerCycle <= 1.0) {
    const shimmerX = bx - 100 + shimmerCycle * (bannerW + 200);
    const shimGrad = ctx.createLinearGradient(shimmerX - 70, by, shimmerX + 70, by + bannerH);
    shimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    shimGrad.addColorStop(0.35, 'rgba(255, 245, 180, 0.10)');
    shimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.40)');
    shimGrad.addColorStop(0.65, 'rgba(255, 245, 180, 0.10)');
    shimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bannerW, bannerH);
    ctx.clip();
    ctx.fillStyle = shimGrad;
    ctx.fillRect(bx, by, bannerW, bannerH);
    ctx.restore();
  }

  // 5. Partículas e Brasas Douradas Cintilantes ao Redor das Bordas
  const sparkCount = isVertical ? 12 : 18;
  for (let s = 0; s < sparkCount; s++) {
    const sparkSeed = s * 79.19;
    const sProg = ((frameCount * 0.018 + sparkSeed) % 1.0);
    const perimeterPos = ((s * 0.23) % 1.0);
    let sx, sy;
    if (perimeterPos < 0.35) {
      sx = bx + (perimeterPos / 0.35) * bannerW;
      sy = by - 3 - sProg * 14;
    } else if (perimeterPos < 0.70) {
      sx = bx + ((perimeterPos - 0.35) / 0.35) * bannerW;
      sy = by + bannerH + 3 + sProg * 14;
    } else if (perimeterPos < 0.85) {
      sx = bx - 3 - sProg * 12;
      sy = by + ((perimeterPos - 0.70) / 0.15) * bannerH;
    } else {
      sx = bx + bannerW + 3 + sProg * 12;
      sy = by + ((perimeterPos - 0.85) / 0.15) * bannerH;
    }
    const sAlpha = Math.sin(sProg * Math.PI);
    const sSize = 1.2 + (s % 3 === 0 ? 1.6 : 0.8);
    ctx.fillStyle = `rgba(255, 245, 180, ${sAlpha * 0.95})`;
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(sx, sy - sSize);
    ctx.lineTo(sx + sSize, sy);
    ctx.lineTo(sx, sy + sSize);
    ctx.lineTo(sx - sSize, sy);
    ctx.closePath();
    ctx.fill();
  }

  // 6. Textos e Glifos do Banner Dourado
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const stats = e.victoryStats || { time: '10:00', kills: 0, level: 1, gold: 0 };

  if (isVertical) {
    // Layout Vertical
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#f6e58d';
    ctx.shadowColor = 'rgba(241, 196, 15, 0.85)';
    ctx.shadowBlur = 6;
    ctx.fillText("[ CATACLISMA PURGADO • O ABISMO FOI SELADO ]", screenW / 2, by + 14);

    const titleY = by + 37;
    const titleGrad = ctx.createLinearGradient(0, titleY - 10, 0, titleY + 10);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(0.5, '#fff7c2');
    titleGrad.addColorStop(1, '#f1c40f');

    ctx.font = 'bold 19px "Cinzel", "Cinzel Decorative", Georgia, serif';
    ctx.fillStyle = titleGrad;
    ctx.shadowColor = 'rgba(241, 196, 15, 0.95)';
    ctx.shadowBlur = pulseGlow;
    ctx.fillText("❖ VITÓRIA SUPREMA ❖", screenW / 2, titleY);

    ctx.font = 'italic 10px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#fff2a8';
    ctx.shadowColor = 'rgba(212, 172, 13, 0.7)';
    ctx.shadowBlur = 3;
    ctx.fillText("✦ O SOBERANO DO ABISMO FOI ANIQUILADO ✦", screenW / 2, by + 58);

    // Linha de Honra e Métricas
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.shadowBlur = 2;
    ctx.fillText(`TEMPO: ${stats.time}  •  ABATES: ${stats.kills}  •  NÍVEL: ${stats.level}  •  OURO: +${stats.gold}`, screenW / 2, by + 84);
  } else {
    // Layout Horizontal
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#f6e58d';
    ctx.shadowColor = 'rgba(241, 196, 15, 0.85)';
    ctx.shadowBlur = 8;
    ctx.fillText("[ CATACLISMA PURGADO // A ORDEM CÓSMICA FOI RESTAURADA ]", screenW / 2, by + 22);

    const titleY = by + 53;
    const titleGrad = ctx.createLinearGradient(0, titleY - 16, 0, titleY + 16);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(0.45, '#fff8cc');
    titleGrad.addColorStop(0.8, '#f1c40f');
    titleGrad.addColorStop(1, '#d4ac0d');

    ctx.font = 'bold 31px "Cinzel", "Cinzel Decorative", Georgia, serif';
    ctx.fillStyle = titleGrad;
    ctx.shadowColor = 'rgba(241, 196, 15, 0.95)';
    ctx.shadowBlur = pulseGlow;
    ctx.fillText("❖ VITÓRIA SUPREMA ❖", screenW / 2, titleY);

    ctx.font = 'italic 13px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#fff2a8';
    ctx.shadowColor = 'rgba(212, 172, 13, 0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText("✦ O SOBERANO DO ABISMO FOI ANIQUILADO E AS TREVAS EXPURGADAS ✦", screenW / 2, by + 82);

    // Fita de Honra com Métricas Destacadas
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = 'rgba(241, 196, 15, 0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText(`TEMPO DE COMBATE: ${stats.time}    |    MONSTROS EXPURGADOS: ${stats.kills}    |    NÍVEL: ${stats.level}    |    OURO CONQUISTADO: +${stats.gold}`, screenW / 2, by + 108);
  }

  ctx.restore();
}

/**
 * Renderiza a camada completa de vitória cósmica sobre todas as outras camadas de jogo:
 * Banner Dourado Animado e Cortina de Fade-Out para o Menu.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
export function drawBossVictoryOverlay(ctx, e, frameCount) {
  if (!e) return;
  if (e.showGoldenBanner) {
    drawGoldenVictoryBanner(ctx, e, frameCount);
  }
  if (e.fadeAlpha > 0) {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const screenW = viewW || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const screenH = viewH || (typeof window !== 'undefined' ? window.innerHeight : 800);
    ctx.fillStyle = `rgba(5, 2, 8, ${Math.min(1.0, e.fadeAlpha)})`;
    ctx.fillRect(0, 0, screenW, screenH);
    ctx.restore();
  }
}

/**
 * Renderiza os Locais de Cura Sagrados (Santuários de Luz Celestial) na Arena do Soberano.
 * Exibe halo esmeralda, anel rúnico, medidor circular decrescente dos 7 segundos e cruz de restauração.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
function drawHealingZones(ctx, e, frameCount) {
  if (!e.healingZones || e.healingZones.length === 0) return;

  for (let i = 0; i < e.healingZones.length; i++) {
    const zone = e.healingZones[i];
    const R = zone.radius;
    const lifeRatio = Math.max(0, zone.life / (zone.maxLife || 420));

    ctx.save();
    // drawAbyssSovereign já neutralizou o facing horizontal, mantendo coordenadas de mundo 1:1
    ctx.translate(zone.x - e.x, zone.y - e.y);

    // 1. Halo Radial de Luz Esmeralda/Ouro no Solo
    const pulse = Math.sin(frameCount * 0.14 + i * 2) * 4;
    const groundGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, R + pulse);
    groundGrad.addColorStop(0, 'rgba(46, 204, 113, 0.45)');
    groundGrad.addColorStop(0.65, 'rgba(26, 188, 156, 0.22)');
    groundGrad.addColorStop(0.9, 'rgba(241, 196, 15, 0.15)');
    groundGrad.addColorStop(1, 'rgba(46, 204, 113, 0)');
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.arc(0, 0, R + pulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Anel de Limite Sagrado Rúnico
    ctx.strokeStyle = zone.playerInside ? '#ffffff' : 'rgba(46, 204, 113, 0.85)';
    ctx.lineWidth = zone.playerInside ? 3.0 : 2.2;
    ctx.shadowColor = '#2ecc71';
    ctx.shadowBlur = zone.playerInside ? 14 : 8;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Medidor Circular de Duração Residual (Contagem Regressiva dos 7 Segundos)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, R + 4, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * lifeRatio));
    ctx.stroke();

    // 4. Glifos Celestiais Orbitantes
    const rot = frameCount * 0.035;
    ctx.save();
    ctx.rotate(rot);
    const glyphCount = 4;
    for (let g = 0; g < glyphCount; g++) {
      const ga = (g * Math.PI * 2) / glyphCount;
      const gx = Math.cos(ga) * (R * 0.65);
      const gy = Math.sin(ga) * (R * 0.65);
      ctx.fillStyle = g % 2 === 0 ? '#2ecc71' : '#f1c40f';
      ctx.beginPath();
      ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Cruz Sagrada de Cura no Centro
    ctx.fillStyle = zone.playerInside ? '#ffffff' : '#2ecc71';
    ctx.shadowColor = '#2ecc71';
    ctx.shadowBlur = 7;
    const cSize = Math.round(R * 0.26); // Proporcional ao raio da zona (~19px para R=73)
    const cThick = 5.5;
    ctx.fillRect(-cSize / 2, -cThick / 2, cSize, cThick);
    ctx.fillRect(-cThick / 2, -cSize / 2, cThick, cSize);

    // 6. Partículas Ascendentes de Cura
    const sparkleCount = 4;
    for (let sp = 0; sp < sparkleCount; sp++) {
      const spProgress = ((frameCount * 0.04 + sp * 0.25) % 1);
      const spAng = sp * 1.57;
      const spDist = (R * 0.4) * (1 - spProgress * 0.3);
      const spX = Math.cos(spAng) * spDist;
      const spY = Math.sin(spAng) * spDist - spProgress * 35;
      const spAlpha = Math.sin(spProgress * Math.PI);
      ctx.fillStyle = sp % 2 === 0 ? `rgba(46, 204, 113, ${spAlpha})` : `rgba(241, 196, 15, ${spAlpha})`;
      ctx.beginPath();
      ctx.arc(spX, spY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Texto Flutuante Indicador de Duração
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = zone.playerInside ? '#ffffff' : '#2ecc71';
    const secondsLeft = (zone.life / 60).toFixed(1);
    ctx.fillText(`CURA +10%/s (${secondsLeft}s)`, 0, -R - 10);

    ctx.restore();
  }
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
 * Renderiza Fissuras Visuais Progressivas de Dano de Batalha (Battle Damage) no Domo Gótico.
 * Intensifica-se conforme o HP do Soberano diminui (<75%, <50%, <30%, <15%).
 */
function drawDomeFractures(ctx, R, hpRatio, frameCount) {
  ctx.save();
  const severity = 1 - hpRatio;
  const glow = 4 + Math.sin(frameCount * 0.15) * 2;

  ctx.strokeStyle = hpRatio < 0.20 ? '#ffffff' : (hpRatio < 0.40 ? '#fff6a9' : 'rgba(255, 255, 255, 0.85)');
  ctx.shadowColor = hpRatio < 0.20 ? '#f1c40f' : (hpRatio < 0.40 ? '#00cec9' : '#e84393');
  ctx.shadowBlur = glow;
  ctx.lineWidth = hpRatio < 0.20 ? 2.2 : 1.4;

  // Racha 1: Superior Esquerda
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.2);
  ctx.lineTo(-R * 0.35, -R * 0.45);
  ctx.lineTo(-R * 0.42, -R * 0.65);
  if (hpRatio < 0.50) {
    ctx.lineTo(-R * 0.65, -R * 0.85);
    ctx.moveTo(-R * 0.35, -R * 0.45);
    ctx.lineTo(-R * 0.55, -R * 0.35);
  }
  ctx.stroke();

  // Racha 2: Inferior Direita (< 60% HP)
  if (hpRatio < 0.60) {
    ctx.beginPath();
    ctx.moveTo(R * 0.1, R * 0.1);
    ctx.lineTo(R * 0.38, R * 0.35);
    ctx.lineTo(R * 0.52, R * 0.55);
    if (hpRatio < 0.35) {
      ctx.lineTo(R * 0.72, R * 0.78);
      ctx.moveTo(R * 0.38, R * 0.35);
      ctx.lineTo(R * 0.60, R * 0.25);
    }
    ctx.stroke();
  }

  // Racha 3: Fissura de Cisalhamento Central Crítica (< 30% HP)
  if (hpRatio < 0.30) {
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-R * 0.1, -R * 0.75);
    ctx.lineTo(R * 0.15, -R * 0.35);
    ctx.lineTo(-R * 0.08, R * 0.15);
    ctx.lineTo(R * 0.22, R * 0.65);
    ctx.stroke();

    // Micro-faíscas estelares vazando da brecha
    const sparkCount = 3;
    for (let s = 0; s < sparkCount; s++) {
      const sAng = (frameCount * 0.25 + s * 2.1) % (Math.PI * 2);
      const sDist = R * 0.45 + Math.sin(frameCount * 0.3 + s) * (R * 0.35);
      ctx.fillStyle = s % 2 === 0 ? '#ffffff' : '#f1c40f';
      ctx.fillRect(Math.cos(sAng) * sDist - 1.5, Math.sin(sAng) * sDist - 1.5, 3, 3);
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

  // Trincas de Dano de Batalha (Battle Damage) Progressivas no Domo
  const hpRatio = Math.max(0, e.hp / (e.maxHp || 1));
  if (hpRatio < 0.75) {
    drawDomeFractures(ctx, R, hpRatio, frameCount);
  }

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
      // FEIXE DE LUZ CELESTIAL COM FRATURA DIMENSIONAL (Feixe único P1-P2 / Tríplice P3)
      const angles = atk.angles || [e.cleaveAngle || 0];
      const isTriple = angles.length > 1; // Diferenciação visual entre Feixe Único e Feixe Triplo
      const alpha = Math.max(0, 1 - progress);
      const len = atk.length || 1500;
      const mainW = atk.width || 108;
      const sideW = atk.sideWidth || (mainW * 0.65);

      ctx.save();

      // =========================================================================
      // 1. ARCOS DE RESSONÂNCIA DIMENSIONAL CRUZADA (Exclusivo do Feixe Triplo)
      // =========================================================================
      if (isTriple) {
        const centerAng = angles[0];
        const leftAng = angles[1];
        const rightAng = angles[2];

        // Arcos de plasma e pontes elétricas saltando entre o feixe central e os laterais
        const bridgeCount = 8;
        for (let b = 1; b <= bridgeCount; b++) {
          const bDist = (b / (bridgeCount + 1)) * len * Math.min(1, progress * 1.5);
          const cx = Math.cos(centerAng) * bDist;
          const cy = Math.sin(centerAng) * bDist;

          for (let sideAng of [leftAng, rightAng]) {
            if (sideAng === undefined) continue;
            const sx = Math.cos(sideAng) * bDist;
            const sy = Math.sin(sideAng) * bDist;
            const midJitterX = (Math.sin(b * 3.7 + frameCount * 0.5) * 22) * alpha;
            const midJitterY = (Math.cos(b * 3.1 + frameCount * 0.5) * 22) * alpha;

            // Ponte de plasma instável entre os feixes
            ctx.strokeStyle = (b % 2 === 0)
              ? `rgba(0, 206, 201, ${alpha * 0.85})`
              : `rgba(232, 67, 147, ${alpha * 0.75})`;
            ctx.lineWidth = 2.0 * alpha;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo((cx + sx) * 0.5 + midJitterX, (cy + sy) * 0.5 + midJitterY);
            ctx.lineTo(sx, sy);
            ctx.stroke();
          }
        }
      }

      // =========================================================================
      // 2. RENDERIZAÇÃO DOS FEIXES DE LUZ (Individual para cada ângulo de disparo)
      // =========================================================================
      for (let a = 0; a < angles.length; a++) {
        const ang = angles[a];
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);
        const tipX = cosA * len;
        const tipY = sinA * len;
        const isMain = a === 0;
        const beamW = isMain ? mainW : sideW;
        const perpX = -sinA;
        const perpY = cosA;

        // 2.1 Cicatriz abissal no solo (fenda preta sob o feixe com bordas queimadas)
        const scorchW = beamW * 0.65;
        ctx.strokeStyle = `rgba(5, 2, 12, ${alpha * 0.85})`;
        ctx.lineWidth = scorchW;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 2.2 Halo volumétrico de ionização atmosférica (dispersão volumétrica)
        const haloPulse = Math.sin(frameCount * 0.35 + a * 2) * 6;
        const haloW = beamW * (1 - progress * 0.22) + haloPulse;
        ctx.strokeStyle = isTriple
          ? (isMain ? `rgba(0, 206, 201, ${alpha * 0.5})` : `rgba(0, 206, 201, ${alpha * 0.35})`)
          : `rgba(232, 67, 147, ${alpha * 0.48})`;
        ctx.lineWidth = haloW;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 2.3 Bainha intermediária de plasma cósmico
        ctx.strokeStyle = isTriple
          ? (isMain ? `rgba(129, 236, 236, ${alpha * 0.8})` : `rgba(224, 86, 253, ${alpha * 0.65})`)
          : `rgba(224, 86, 253, ${alpha * 0.75})`;
        ctx.lineWidth = beamW * 0.48;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 2.4 Anéis de compressão de choque (Mach Cones / Diamantes de Choque)
        const machCount = isMain ? (isTriple ? 6 : 8) : 4;
        for (let m = 1; m <= machCount; m++) {
          const mDist = (m / (machCount + 1)) * len;
          const mx = cosA * mDist;
          const my = sinA * mDist;
          const diamondW = (beamW * 0.38) * alpha;
          const diamondL = 16 * alpha;

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
          ctx.beginPath();
          ctx.moveTo(mx - cosA * diamondL, my - sinA * diamondL);
          ctx.lineTo(mx + perpX * diamondW, my + perpY * diamondW);
          ctx.lineTo(mx + cosA * diamondL, my + sinA * diamondL);
          ctx.lineTo(mx - perpX * diamondW, my - perpY * diamondW);
          ctx.closePath();
          ctx.fill();
        }

        // 2.5 Hélice dupla de plasma vivo entrelaçado
        const segCount = isMain ? 28 : 20;
        const waveAmp = (isMain ? (isTriple ? 12 : 16) : 8) * alpha;
        // Fita 1
        ctx.beginPath();
        for (let s = 0; s <= segCount; s++) {
          const d = (s / segCount) * len;
          const wave = Math.sin(d * 0.03 - frameCount * 0.45 + a * 1.5) * waveAmp;
          const wx = cosA * d + perpX * wave;
          const wy = sinA * d + perpY * wave;
          if (s === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.strokeStyle = isTriple ? `rgba(0, 206, 201, ${alpha * 0.9})` : `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = isMain ? 2.6 : 1.8;
        ctx.stroke();

        // Fita 2 (oposta)
        ctx.beginPath();
        for (let s = 0; s <= segCount; s++) {
          const d = (s / segCount) * len;
          const wave = -Math.sin(d * 0.03 - frameCount * 0.45 + a * 1.5) * waveAmp;
          const wx = cosA * d + perpX * wave;
          const wy = sinA * d + perpY * wave;
          if (s === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.strokeStyle = isTriple ? `rgba(224, 86, 253, ${alpha * 0.75})` : `rgba(232, 67, 147, ${alpha * 0.75})`;
        ctx.lineWidth = isMain ? 2.0 : 1.5;
        ctx.stroke();

        // 2.6 Núcleo incandescente superaquecido branco
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = Math.max(4, beamW * 0.22);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 2.7 Nódulos de energia correndo pelo feixe (Fluxo Contínuo)
        const nodeCount = isMain ? 5 : 3;
        for (let n = 0; n < nodeCount; n++) {
          const nodeProg = ((frameCount * 0.065 + n * 0.22 + a * 0.09) % 1.0);
          const nDist = nodeProg * len;
          const nx = cosA * nDist;
          const ny = sinA * nDist;
          const nLen = isMain ? 52 : 32;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = (isMain ? 10 : 6) * alpha;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(nx + cosA * nLen, ny + sinA * nLen);
          ctx.stroke();
        }

        // 2.8 Fissuras dimensionais e centelhas estelares de alta velocidade
        const sparkCount = isMain ? (isTriple ? 14 : 10) : 7;
        for (let s = 1; s <= sparkCount; s++) {
          const sDist = (s / (sparkCount + 1)) * len * Math.min(1, progress * 1.4);
          if (sDist <= len) {
            const sx = cosA * sDist;
            const sy = sinA * sDist;
            const perpDist = (s % 2 === 0 ? 1 : -1) * (24 * (1 - progress));
            const sparkLen = 22 + (s * 4) * (1 - progress);

            // Centelha estelar esticada em alta velocidade
            ctx.strokeStyle = s % 2 === 0
              ? (isTriple ? `rgba(0, 206, 201, ${alpha * 0.95})` : `rgba(255, 255, 255, ${alpha * 0.95})`)
              : `rgba(232, 67, 147, ${alpha * 0.9})`;
            ctx.lineWidth = 2.4 * alpha;
            ctx.beginPath();
            ctx.moveTo(sx + perpX * perpDist, sy + perpY * perpDist);
            ctx.lineTo(sx + perpX * perpDist + cosA * sparkLen, sy + perpY * perpDist + sinA * sparkLen);
            ctx.stroke();

            // Micro-fissura dimensional perpendicular rasgando o tecido da realidade
            if (s % 2 === 0) {
              ctx.strokeStyle = `rgba(224, 86, 253, ${alpha * 0.8})`;
              ctx.lineWidth = 1.6;
              const fissLen = perpDist * 1.8;
              const fissJitter = Math.sin(s * 2.7 + frameCount * 0.2) * 8;
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(sx + perpX * fissLen + cosA * fissJitter, sy + perpY * fissLen + sinA * fissJitter);
              ctx.stroke();
            }
          }
        }
      }

      // =========================================================================
      // 3. EPICENTRO DE DISPARO NO CORPO DO SOBERANO (0, 0)
      // =========================================================================
      const flareR = Math.max(0, (isTriple ? 74 : 58) * (1 - progress * 0.85));
      const flareGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, Math.max(6, flareR));
      flareGrad.addColorStop(0, '#ffffff');
      flareGrad.addColorStop(0.25, isTriple ? 'rgba(0, 206, 201, 0.95)' : 'rgba(232, 67, 147, 0.95)');
      flareGrad.addColorStop(0.55, isTriple ? 'rgba(129, 236, 236, 0.75)' : 'rgba(224, 86, 253, 0.75)');
      flareGrad.addColorStop(0.85, 'rgba(142, 68, 173, 0.4)');
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(0, 0, flareR, 0, Math.PI * 2);
      ctx.fill();

      // Anéis de choque de recuo na saída do disparo
      if (progress < 0.45) {
        const recoilR = (progress / 0.45) * (isTriple ? 98 : 75);
        const recoilAlpha = (1 - progress / 0.45);
        ctx.strokeStyle = `rgba(255, 255, 255, ${recoilAlpha * 0.8})`;
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.arc(0, 0, recoilR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    } else if (atk.type === 'VOID_IMPLOSION_CORE') {
      // Coordenadas relativas ao centro do chefe
      const relX = atk.x - e.x;
      const relY = atk.y - e.y;
      const alpha = Math.max(0, 1 - progress);
      const R = atk.radius || 175;

      ctx.save();

      // 1. Flash de Vácuo Negativo e Campo de Gravidade Residual
      const burstR = R * Math.min(1, progress * 1.35);
      const burstGrad = ctx.createRadialGradient(relX, relY, 0, relX, relY, Math.max(1, burstR));
      burstGrad.addColorStop(0, `rgba(5, 2, 12, ${alpha * 0.95})`);
      burstGrad.addColorStop(0.4, `rgba(142, 68, 173, ${alpha * 0.75})`);
      burstGrad.addColorStop(0.85, `rgba(0, 206, 201, ${alpha * 0.45})`);
      burstGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = burstGrad;
      ctx.beginPath();
      ctx.arc(relX, relY, burstR, 0, Math.PI * 2);
      ctx.fill();

      // 2. Anel de Choque Implosivo com Aberração Cromática
      const ringR = R * Math.min(1, progress * 1.12);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.lineWidth = 4.0 * alpha;
      ctx.beginPath();
      ctx.arc(relX, relY, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(224, 86, 253, ${alpha * 0.85})`;
      ctx.lineWidth = 2.5 * alpha;
      ctx.beginPath();
      ctx.arc(relX, relY, Math.max(1, ringR - 5), 0, Math.PI * 2);
      ctx.stroke();

      // 3. Fissuras Elétricas de Matéria Escura (12 Relâmpagos Abissais no solo)
      const rayCount = 12;
      ctx.strokeStyle = `rgba(0, 206, 201, ${alpha * 0.9})`;
      ctx.lineWidth = 1.8 * alpha;
      for (let r = 0; r < rayCount; r++) {
        const ra = (r * Math.PI * 2) / rayCount + Math.sin(r * 3.1) * 0.15;
        const reach = R * (0.65 + 0.45 * Math.sin(r * 4.7 + frameCount * 0.1));
        const mx = relX + Math.cos(ra) * (reach * 0.5) + Math.sin(r * 2.3) * 10;
        const my = relY + Math.sin(ra) * (reach * 0.5) + Math.cos(r * 2.9) * 10;
        const ex = relX + Math.cos(ra) * reach;
        const ey = relY + Math.sin(ra) * reach;

        ctx.beginPath();
        ctx.moveTo(relX, relY);
        ctx.lineTo(mx, my);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      // 4. Epicentro Superdenso Residual
      const centerR = Math.max(2, 22 * (1 - progress));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(relX, relY, centerR, 0, Math.PI * 2);
      ctx.fill();

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
  } else if (e.actionState === SOVEREIGN_STATES.DEATH_COLLAPSE) {
    drawMajesticDeathCollapse(ctx, e, frameCount);
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

  // 1.5. Locais de Cura Sagrados (Santuários Celestiais)
  if (e.healingZones && e.healingZones.length > 0) {
    drawHealingZones(ctx, e, frameCount);
  }

  // 2. Barreira do Horizonte de Eventos
  if (e.phase >= 2) {
    const relCenterX = e.arenaCenterX - e.x;
    const relCenterY = e.arenaCenterY - e.y;

    ctx.save();
    // drawAbyssSovereign já neutralizou o facing horizontal, mantendo coordenadas de mundo 1:1
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

  // 4. Telegrafia do Crucifixo (Convergência de Luz e Alinhamento de Perigo)
  if (isWindup && e.currentSkill === 'VOID_CRUCIFIX') {
    const armCount = 4;
    const ratio = 1 - (e.windupTimer / (e.windupMax || 50));
    ctx.save();

    // 4.1 Vórtice de convergência de fótons no núcleo (0, 0)
    const chargeR = 12 + ratio * 24;
    const coreGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, chargeR);
    coreGlow.addColorStop(0, '#ffffff');
    coreGlow.addColorStop(0.4, e.phase === 3 ? 'rgba(0, 206, 201, 0.8)' : 'rgba(232, 67, 147, 0.8)');
    coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, chargeR, 0, Math.PI * 2);
    ctx.fill();

    // 4.2 Feixes guias e corredores de aviso dos 4 braços
    const isImminent = e.windupTimer <= 14;
    const strobe = isImminent && Math.sin(frameCount * 0.6) > 0;

    for (let arm = 0; arm < armCount; arm++) {
      const rayAng = e.beamAngle + (arm * (Math.PI * 2 / armCount));
      const cosA = Math.cos(rayAng);
      const sinA = Math.sin(rayAng);
      const len = 1300;
      const perpX = -sinA;
      const perpY = cosA;

      // Corredor translúcido de aviso (largura proporcional à hitbox de 40px)
      const warningHalfW = 20 * ratio;
      ctx.fillStyle = e.phase === 3 
        ? (strobe ? 'rgba(0, 206, 201, 0.22)' : 'rgba(0, 206, 201, 0.08)') 
        : (strobe ? 'rgba(232, 67, 147, 0.22)' : 'rgba(232, 67, 147, 0.08)');
      ctx.beginPath();
      ctx.moveTo(perpX * warningHalfW, perpY * warningHalfW);
      ctx.lineTo(cosA * len + perpX * warningHalfW, sinA * len + perpY * warningHalfW);
      ctx.lineTo(cosA * len - perpX * warningHalfW, sinA * len - perpY * warningHalfW);
      ctx.lineTo(-perpX * warningHalfW, -perpY * warningHalfW);
      ctx.closePath();
      ctx.fill();

      // Linha laser guia de alta precisão
      ctx.strokeStyle = strobe ? '#ffffff' : (e.phase === 3 ? 'rgba(0, 206, 201, 0.8)' : 'rgba(232, 67, 147, 0.8)');
      ctx.lineWidth = strobe ? 3.0 : 1.8;
      ctx.setLineDash([14, 7]);
      ctx.lineDashOffset = -frameCount * 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * len, sinA * len);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 5. Feixes do Crucifixo do Vácuo (Lasers de Plasma Cósmico & Fratura Dimensional)
  if (isCasting && e.currentSkill === 'VOID_CRUCIFIX') {
    const armCount = 4;
    const len = 1300;
    const isP3 = e.phase === 3;
    const primaryCol = isP3 ? 'rgba(0, 206, 201, ' : 'rgba(232, 67, 147, ';
    const secondaryCol = isP3 ? 'rgba(129, 236, 236, ' : 'rgba(224, 86, 253, ';
    const accentCol = isP3 ? '#81ecec' : '#fd79a8';

    ctx.save();

    for (let arm = 0; arm < armCount; arm++) {
      const rayAng = e.beamAngle + (arm * (Math.PI * 2 / armCount));
      const cosA = Math.cos(rayAng);
      const sinA = Math.sin(rayAng);
      const perpX = -sinA;
      const perpY = cosA;

      // 5.1 Halo de Ionização Atmosférica (Largura 44px - cobre a hitbox real)
      const haloW = 42 + Math.sin(frameCount * 0.35 + arm * 1.5) * 4;
      ctx.strokeStyle = primaryCol + (0.24 + Math.sin(frameCount * 0.2 + arm) * 0.06) + ')';
      ctx.lineWidth = haloW;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * len, sinA * len);
      ctx.stroke();

      // 5.2 Bainha Intermediária de Plasma Cósmico
      const plasmaW = 20 + Math.sin(frameCount * 0.5 + arm) * 3;
      ctx.strokeStyle = secondaryCol + '0.65)';
      ctx.lineWidth = plasmaW;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * len, sinA * len);
      ctx.stroke();

      // 5.3 Dupla Hélice de Plasma Ondulante (Serpenteamento de Energia Viva)
      // Fita 1
      ctx.beginPath();
      const segCount = 26;
      for (let s = 0; s <= segCount; s++) {
        const d = (s / segCount) * len;
        const wave = Math.sin(d * 0.032 - frameCount * 0.35 + arm) * 10;
        const wx = cosA * d + perpX * wave;
        const wy = sinA * d + perpY * wave;
        if (s === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.strokeStyle = secondaryCol + '0.85)';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Fita 2 (oposta)
      ctx.beginPath();
      for (let s = 0; s <= segCount; s++) {
        const d = (s / segCount) * len;
        const wave = -Math.sin(d * 0.032 - frameCount * 0.35 + arm) * 10;
        const wx = cosA * d + perpX * wave;
        const wy = sinA * d + perpY * wave;
        if (s === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.strokeStyle = primaryCol + '0.75)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 5.4 Núcleo Incandescente Superaquecido
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * len, sinA * len);
      ctx.stroke();

      // 5.5 Nódulos de Pulso de Alta Velocidade (Fluxo Contínuo de Luz)
      for (let n = 0; n < 4; n++) {
        const nodeProg = ((frameCount * 0.05 + n * 0.25 + arm * 0.07) % 1.0);
        const nDist = nodeProg * len;
        const nx = cosA * nDist;
        const ny = sinA * nDist;
        const nLen = 42;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8.5;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(nx + cosA * nLen, ny + sinA * nLen);
        ctx.stroke();
      }

      // 5.6 Descargas Elétricas / Micro-Arcos Transversais
      const arcSeed = Math.floor(frameCount * 0.35) + arm * 5;
      if (arcSeed % 2 === 0) {
        const arcDist = ((arcSeed * 179) % (len - 250)) + 80;
        const arcSide = (arcSeed % 4 > 1) ? 1 : -1;
        const arcBaseX = cosA * arcDist;
        const arcBaseY = sinA * arcDist;
        const arcLen = 16 + (arcSeed % 14);
        const midX = arcBaseX + perpX * (arcSide * arcLen * 0.6) + cosA * 8;
        const midY = arcBaseY + perpY * (arcSide * arcLen * 0.6) + sinA * 8;
        const endX = arcBaseX + perpX * (arcSide * arcLen);
        const endY = arcBaseY + perpY * (arcSide * arcLen);

        ctx.strokeStyle = accentCol;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(arcBaseX, arcBaseY);
        ctx.lineTo(midX, midY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }

    // 5.7 Núcleo Emissor Central e Lente de Convergência no Chefe (0, 0)
    const emitR = 36 + Math.sin(frameCount * 0.4) * 6;
    const emitGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, emitR);
    emitGrad.addColorStop(0, '#ffffff');
    emitGrad.addColorStop(0.35, isP3 ? 'rgba(0, 206, 201, 0.95)' : 'rgba(232, 67, 147, 0.95)');
    emitGrad.addColorStop(0.7, isP3 ? 'rgba(129, 236, 236, 0.6)' : 'rgba(224, 86, 253, 0.6)');
    emitGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = emitGrad;
    ctx.beginPath();
    ctx.arc(0, 0, emitR, 0, Math.PI * 2);
    ctx.fill();

    // 5.8 Clarão Dramático de Inversão ("INVERSÃO!")
    if (e.inversionFlashTimer && e.inversionFlashTimer > 0) {
      const invRatio = 1 - (e.inversionFlashTimer / 18);
      const invR = 20 + invRatio * 160;
      const invAlpha = Math.max(0, 1 - invRatio);

      ctx.strokeStyle = `rgba(255, 255, 255, ${invAlpha})`;
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.arc(0, 0, invR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 118, 117, ${invAlpha * 0.8})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, invR - 8), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Telegrafia do Corte Dimensional: Feixe Único (P1-P2) vs Feixe Triplo em Tridente (P3)
  if (isWindup && e.currentSkill === 'DIMENSIONAL_CLEAVE') {
    ctx.save();
    const isLocked = e.cleaveLocked;
    const isPhase3 = e.phase === 3;
    const baseAng = e.cleaveAngle || 0;
    const ratio = 1 - (e.windupTimer / (e.windupMax || 48));
    const isImminent = e.windupTimer <= 10;
    const strobe = isImminent && Math.sin(frameCount * 0.7) > 0;
    const beamLen = 1500;

    // No Feixe Triplo, as miras laterais se abrem suavemente no início (efeito de refração em prisma)
    const sideSpread = isPhase3 ? Math.min(0.28, Math.max(0.05, ratio * 0.7) * 0.28) : 0;
    const aimAngles = isPhase3 ? [baseAng, baseAng - sideSpread, baseAng + sideSpread] : [baseAng];

    // Arcos elétricos pré-disparo entre as miras do Feixe Triplo
    if (isPhase3 && ratio > 0.25) {
      for (let bridge = 1; bridge <= 5; bridge++) {
        const bDist = bridge * 220;
        const cx = Math.cos(baseAng) * bDist;
        const cy = Math.sin(baseAng) * bDist;
        for (let s of [-sideSpread, sideSpread]) {
          const sx = Math.cos(baseAng + s) * bDist;
          const sy = Math.sin(baseAng + s) * bDist;
          if (Math.sin(frameCount * 0.35 + bridge) > 0.15) {
            ctx.strokeStyle = `rgba(0, 206, 201, ${0.45 * ratio})`;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo((cx + sx) * 0.5 + Math.sin(bridge * 2.1) * 14, (cy + sy) * 0.5 + Math.cos(bridge * 2.1) * 14);
            ctx.lineTo(sx, sy);
            ctx.stroke();
          }
        }
      }
    }

    for (let l = 0; l < aimAngles.length; l++) {
      const ang = aimAngles[l];
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const isMain = l === 0;
      const perpX = -sinA;
      const perpY = cosA;

      // Corredor de perigo com gradiente dimensional
      const halfVisualW = (isMain ? (isPhase3 ? 35 : 54) : 23) * Math.min(1, ratio * 1.5);
      if (halfVisualW > 2) {
        ctx.fillStyle = isLocked
          ? (strobe ? 'rgba(232, 67, 147, 0.28)' : 'rgba(232, 67, 147, 0.14)')
          : (isPhase3 
              ? (isMain ? `rgba(0, 206, 201, ${0.05 + ratio * 0.09})` : `rgba(0, 206, 201, ${0.03 + ratio * 0.06})`)
              : `rgba(232, 67, 147, ${0.04 + ratio * 0.08})`);
        ctx.beginPath();
        ctx.moveTo(perpX * halfVisualW, perpY * halfVisualW);
        ctx.lineTo(cosA * beamLen + perpX * halfVisualW, sinA * beamLen + perpY * halfVisualW);
        ctx.lineTo(cosA * beamLen - perpX * halfVisualW, sinA * beamLen - perpY * halfVisualW);
        ctx.lineTo(-perpX * halfVisualW, -perpY * halfVisualW);
        ctx.closePath();
        ctx.fill();
      }

      // Fio guia central de alta voltagem com dash dinâmico
      ctx.strokeStyle = isLocked
        ? (isMain ? (strobe ? '#ffffff' : (isPhase3 ? '#00cec9' : '#e84393')) : 'rgba(232, 67, 147, 0.85)')
        : (isMain ? (isPhase3 ? 'rgba(0, 206, 201, 0.9)' : 'rgba(232, 67, 147, 0.9)') : 'rgba(0, 206, 201, 0.55)');
      ctx.lineWidth = isLocked ? (isMain ? 3.5 : 2.0) : (isMain ? 2.4 : 1.5);
      ctx.setLineDash(isLocked ? [14, 5] : [8, 6]);
      ctx.lineDashOffset = -frameCount * 2.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * beamLen, sinA * beamLen);
      ctx.stroke();
      ctx.setLineDash([]);

      // Nódulos de convergência viajando para o chefe (sucção de fótons)
      if (isMain || isPhase3) {
        const nodeCount = isMain ? 5 : 3;
        for (let n = 0; n < nodeCount; n++) {
          const nProg = ((frameCount * 0.045 + n * 0.2 + l * 0.1) % 1.0);
          const nDist = (1 - nProg) * beamLen * 0.75;
          const nAlpha = Math.sin(nProg * Math.PI) * 0.85;
          const nSize = (isMain ? 3.8 : 2.6) + (1 - nProg) * 2.5;
          ctx.fillStyle = isPhase3 ? `rgba(0, 206, 201, ${nAlpha})` : `rgba(232, 67, 147, ${nAlpha})`;
          ctx.beginPath();
          ctx.arc(cosA * nDist, sinA * nDist, nSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Bordas laterais de fissura dimensional (revelam a largura exata de impacto)
      if (ratio > 0.25) {
        const edgeAlpha = Math.min(0.65, (ratio - 0.25) * 1.5);
        ctx.strokeStyle = isPhase3 ? `rgba(0, 206, 201, ${edgeAlpha})` : `rgba(232, 67, 147, ${edgeAlpha})`;
        ctx.lineWidth = 1.3;
        for (let side = -1; side <= 1; side += 2) {
          ctx.beginPath();
          for (let seg = 0; seg <= 14; seg++) {
            const d = (seg / 14) * beamLen * 0.92;
            const jitter = Math.sin(d * 0.018 + frameCount * 0.22 + side) * 3;
            const edgeX = cosA * d + perpX * (halfVisualW + jitter) * side;
            const edgeY = sinA * d + perpY * (halfVisualW + jitter) * side;
            if (seg === 0) ctx.moveTo(edgeX, edgeY);
            else ctx.lineTo(edgeX, edgeY);
          }
          ctx.stroke();
        }
      }
    }

    // Disco focal de carga pré-corte no centro do chefe
    const chargeR = 14 + ratio * 30 + Math.sin(frameCount * 0.45) * 5;
    const focusGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, chargeR);
    focusGrad.addColorStop(0, '#ffffff');
    focusGrad.addColorStop(0.3, isPhase3 ? 'rgba(0, 206, 201, 0.95)' : 'rgba(232, 67, 147, 0.95)');
    focusGrad.addColorStop(0.7, isPhase3 ? 'rgba(129, 236, 236, 0.55)' : 'rgba(142, 68, 173, 0.5)');
    focusGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = focusGrad;
    ctx.beginPath();
    ctx.arc(0, 0, chargeR, 0, Math.PI * 2);
    ctx.fill();

    // No Feixe Triplo, desenha 3 focos de plasma satélites na lente de disparo
    if (isPhase3) {
      for (let l = 0; l < aimAngles.length; l++) {
        const satAng = aimAngles[l];
        const satDist = chargeR * 0.75;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.cos(satAng) * satDist, Math.sin(satAng) * satDist, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Arco de energia concentrada na direção do corte
    if (ratio > 0.45) {
      const arcAlpha = (ratio - 0.45) * 2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${arcAlpha * 0.9})`;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, chargeR + 6, baseAng - (isPhase3 ? 0.55 : 0.35), baseAng + (isPhase3 ? 0.55 : 0.35));
      ctx.stroke();
    }

    ctx.restore();
  }

  // 6. Colapso de Matéria Escura / Singularidade Primordial (Reformulação Cósmica em 3 Atos)
  if (isWindup && e.currentSkill === 'SINGULARITY_IMPLOSION') {
    const relX = e.implosionX - e.x;
    const relY = e.implosionY - e.y;
    const R = e.implosionMaxRadius || 175;
    const elapsed = (e.windupMax || 148) - e.windupTimer;
    const isReleased = e.implosionReleased;
    const isLocked = e.implosionLocked;

    ctx.save();

    // 6.1 Gradiente do Horizonte de Eventos (Vácuo Abissal no solo)
    const voidGrad = ctx.createRadialGradient(relX, relY, 10, relX, relY, R);
    if (isReleased) {
      // Ato 3: Sobrecarga crítica / Alerta máximo
      const flashAlpha = 0.28 + Math.sin(frameCount * 0.4) * 0.12;
      voidGrad.addColorStop(0, 'rgba(5, 2, 12, 0.85)');
      voidGrad.addColorStop(0.45, `rgba(224, 86, 253, ${flashAlpha})`);
      voidGrad.addColorStop(0.85, `rgba(0, 206, 201, ${flashAlpha * 0.7})`);
      voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (isLocked) {
      // Ato 2: Poço Gravitacional intenso
      voidGrad.addColorStop(0, 'rgba(5, 2, 12, 0.80)');
      voidGrad.addColorStop(0.5, 'rgba(142, 68, 173, 0.32)');
      voidGrad.addColorStop(0.9, 'rgba(0, 206, 201, 0.12)');
      voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      // Ato 1: Gênese suave
      voidGrad.addColorStop(0, 'rgba(5, 2, 12, 0.65)');
      voidGrad.addColorStop(0.6, 'rgba(142, 68, 173, 0.18)');
      voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    ctx.arc(relX, relY, R, 0, Math.PI * 2);
    ctx.fill();

    // 6.2 Perímetro do Horizonte de Eventos (Borda nítida do raio letal de 140px)
    if (isReleased) {
      // Estroboscópio de ruptura / Alerta final de fuga
      const isStrobe = Math.sin(frameCount * 0.5) > 0;
      ctx.strokeStyle = isStrobe ? '#ffffff' : '#00cec9';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(relX, relY, R, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(232, 67, 147, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(relX, relY, R + 4, frameCount * 0.08, frameCount * 0.08 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (isLocked) {
      // Borda gravada com runas orbitantes no Ato 2
      ctx.strokeStyle = 'rgba(224, 86, 253, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(relX, relY, R, 0, Math.PI * 2);
      ctx.stroke();

      // Runas / Marcadores orbitais no perímetro de perigo
      const runeCount = 6;
      ctx.fillStyle = '#00cec9';
      for (let rn = 0; rn < runeCount; rn++) {
        const rAng = (rn * Math.PI * 2) / runeCount + frameCount * 0.03;
        const rx = relX + Math.cos(rAng) * R;
        const ry = relY + Math.sin(rAng) * R;
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Anel tracejado suave no Ato 1
      ctx.strokeStyle = 'rgba(142, 68, 173, 0.65)';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(relX, relY, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6.3 Onda de Choque da Ruptura Gravitacional (Pulso no início do Ato 3)
    if (e.implosionSnapRing && e.implosionSnapRing > 0) {
      const snapAlpha = Math.max(0, 1 - e.implosionSnapRing / (R * 1.5));
      ctx.strokeStyle = `rgba(255, 255, 255, ${snapAlpha})`;
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(relX, relY, e.implosionSnapRing, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(0, 206, 201, ${snapAlpha * 0.7})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(relX, relY, Math.max(1, e.implosionSnapRing - 8), 0, Math.PI * 2);
      ctx.stroke();
    }

    // 6.4 Disco de Acreção e Filamentos Espirais (Rotação Diferencial)
    const armCount = 3;
    const spinSpeed = isReleased ? 0.14 : (isLocked ? 0.08 : 0.04);
    for (let a = 0; a < armCount; a++) {
      const armBaseAng = (a * Math.PI * 2) / armCount + frameCount * spinSpeed;
      ctx.beginPath();
      for (let s = 0; s <= 22; s++) {
        const t = s / 22;
        const curDist = 16 + (R - 16) * t;
        const spiralAng = armBaseAng + (1 - t) * 2.6;
        const sx = relX + Math.cos(spiralAng) * curDist;
        const sy = relY + Math.sin(spiralAng) * curDist;
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = a % 2 === 0
        ? `rgba(0, 206, 201, ${isReleased ? 0.75 : 0.5})`
        : `rgba(224, 86, 253, ${isReleased ? 0.75 : 0.5})`;
      ctx.lineWidth = isReleased ? 2.2 : 1.6;
      ctx.stroke();
    }

    // 6.5 Partículas Estelares Sendo Ingeridas (Ativas enquanto a gravidade puxa)
    if (!isReleased) {
      for (let p = 0; p < 8; p++) {
        const pProgress = ((frameCount * 2.4 + p * 32) % R) / R;
        const pDist = R * (1 - pProgress);
        const pAng = (p * 2.399) + (pProgress * 3.0) + frameCount * 0.04;
        const px = relX + Math.cos(pAng) * pDist;
        const py = relY + Math.sin(pAng) * pDist;
        ctx.fillStyle = p % 2 === 0 ? '#81ecec' : '#e056fd';
        ctx.beginPath();
        ctx.arc(px, py, 1.8 + (1 - pProgress) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6.6 Núcleo da Singularidade (Buraco Negro com Lente Gravitacional)
    let coreJitterX = 0;
    let coreJitterY = 0;
    let coreRadius = 18;

    if (isReleased) {
      // Ato 3: vibração caótica de alta frequência e contração pré-implosão
      const collapseProgress = Math.min(1, Math.max(0, (elapsed - 70) / 65));
      coreRadius = Math.max(4, 18 * (1 - collapseProgress * 0.8));
      coreJitterX = (Math.sin(frameCount * 1.9) + Math.cos(frameCount * 2.7)) * 2.2;
      coreJitterY = (Math.cos(frameCount * 2.1) + Math.sin(frameCount * 1.7)) * 2.2;
    } else {
      coreRadius = 16 + Math.sin(frameCount * 0.15) * 2;
    }

    const cx = relX + coreJitterX;
    const cy = relY + coreJitterY;

    // Halo Incandescente do Anel de Fótons
    const photonGrad = ctx.createRadialGradient(cx, cy, coreRadius * 0.8, cx, cy, coreRadius * 1.9);
    photonGrad.addColorStop(0, '#ffffff');
    photonGrad.addColorStop(0.3, isReleased ? '#e056fd' : '#00cec9');
    photonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = photonGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // Esfera Negra Absoluta Central
    ctx.fillStyle = '#05020a';
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Borda afiada de horizonte óptico
    ctx.strokeStyle = isReleased ? '#ffffff' : '#81ecec';
    ctx.lineWidth = isReleased ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.stroke();

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

  // 7.1 Telegrafia e Efeito de Disparo Relativístico (RELATIVISTIC_SALVO)
  if (isWindup && e.currentSkill === 'RELATIVISTIC_SALVO') {
    ctx.save();
    const ratio = 1 - (e.windupTimer / (e.windupMax || 1));
    const salvoAng = e.salvoSpiralAngle || 0;
    
    // Anel contrátil de energia cósmica no núcleo
    const chargeR = Math.max(12, (R * 1.8) * (1 - ratio));
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.8)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, chargeR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Linha guia de mira vetorial na direção do alvo
    ctx.strokeStyle = `rgba(0, 206, 201, ${0.35 + ratio * 0.5})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(salvoAng) * 450, Math.sin(salvoAng) * 450);
    ctx.stroke();

    // Nós espirais de partículas convergindo para o núcleo
    const nodeCount = 5;
    for (let n = 0; n < nodeCount; n++) {
      const nAng = salvoAng + (n * Math.PI * 2 / nodeCount) + frameCount * 0.12;
      const nDist = chargeR * 0.85;
      ctx.fillStyle = n % 2 === 0 ? '#00cec9' : '#e84393';
      ctx.beginPath();
      ctx.arc(Math.cos(nAng) * nDist, Math.sin(nAng) * nDist, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (isCasting && e.currentSkill === 'RELATIVISTIC_SALVO') {
    ctx.save();
    const salvoAng = e.salvoSpiralAngle || 0;
    const pulseMuzzle = 12 + Math.sin(frameCount * 0.4) * 6;
    ctx.fillStyle = 'rgba(0, 206, 201, 0.7)';
    ctx.beginPath();
    ctx.arc(Math.cos(salvoAng) * (R * 0.85), Math.sin(salvoAng) * (R * 0.85), pulseMuzzle, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 7.2 Telegrafia das Fendas Abissais (ABYSSAL_RIFTS)
  if (isWindup && e.currentSkill === 'ABYSSAL_RIFTS') {
    ctx.save();
    const ratio = 1 - (e.windupTimer / (e.windupMax || 1));
    const groundPulseR = R * (1.2 + ratio * 0.8);

    // Selos de fenda escura no solo sob o chefe
    ctx.strokeStyle = `rgba(232, 67, 147, ${0.4 + ratio * 0.55})`;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.ellipse(0, R * 0.9, groundPulseR, groundPulseR * 0.45, frameCount * 0.05, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fissuras radiais se abrindo do centro para fora
    const fissureCount = 6;
    for (let f = 0; f < fissureCount; f++) {
      const fAng = (f * Math.PI * 2 / fissureCount) + frameCount * 0.02;
      const fDist = groundPulseR * 0.9;
      ctx.strokeStyle = f % 2 === 0 ? '#00cec9' : '#e84393';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, R * 0.9);
      ctx.lineTo(Math.cos(fAng) * fDist, R * 0.9 + Math.sin(fAng) * fDist * 0.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 7.3 Telegrafia da Chuva Astral (ASTRAL_BARRAGE)
  if (isWindup && e.currentSkill === 'ASTRAL_BARRAGE') {
    ctx.save();
    const ratio = 1 - (e.windupTimer / (e.windupMax || 1));
    
    // Vórtice vertical celestial ascendente conectando aos céus
    const beamW = 16 + ratio * 20;
    const beamH = 380;
    const colGrad = ctx.createLinearGradient(0, 0, 0, -beamH);
    colGrad.addColorStop(0, 'rgba(0, 206, 201, 0.9)');
    colGrad.addColorStop(0.5, 'rgba(232, 67, 147, 0.65)');
    colGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = colGrad;
    ctx.fillRect(-beamW * 0.5, -beamH, beamW, beamH);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -beamH, 4, beamH);

    // Glifos astrais em anel subindo
    const ringY = -beamH * ratio;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, ringY, 28, 9, 0, 0, Math.PI * 2);
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
