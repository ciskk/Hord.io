/**
 * src/render/renderer.js
 * 
 * Orquestrador principal do pipeline gráfico de renderização.
 * Gerencia a câmera, screen shake, proporção DPR, composição de camadas
 * e despacho para os renderizadores modulares especializados.
 */
import { stick } from '../core/input.js';
import { renderEnvironment } from './environment.js';
import { drawEnemyShape, drawDyingEnemyShape } from './enemiesRenderer.js';
import { drawPlayerCharacter, drawPlayerEquipment } from './playerRenderer.js';
import { generateGroundCracks, drawDetailedGroundCracks, drawGroundCraters } from './groundCracks.js';
import { drawBossVictoryOverlay } from '../entities/bosses/abyssSovereign/render.js';
import { getHudBottom, layoutMetrics } from '../core/responsive.js';
import { player } from '../entities/player.js';
import {
  ctx,
  dpr,
  viewW,
  viewH,
  CAMERA_ZOOM,
  cameraViewW,
  cameraViewH,
  camera,
  screenShake,
  props,
  drops,
  chests,
  gems,
  acidPuddles,
  bossTelegraphs,
  bossProjectiles,
  bossShockwaves,
  activeBoss,
  bullets,
  enemyBullets,
  enemies,
  dyingEnemies,
  particles,
  damageTexts,
  frameCount,
  waveAnnouncement,
  cinematicCamera
} from '../main.js';

// Reexportações para assegurar total retrocompatibilidade
export { drawEnemyShape } from './enemiesRenderer.js';
export { drawPlayerCharacter } from './playerRenderer.js';

/**
 * Pipeline principal de renderização do quadro (Frame Render Loop).
 */
export function render() {
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, viewW, viewH);

  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;

  ctx.save();
  // Aplica a aproximação de câmera (~20% menor FOV)
  ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);

  // Quantização inteira da posição da câmera: elimina o anti-aliasing cinzento de subpixel no mobile
  const renderCamX = Math.round(-camera.x + shakeX);
  const renderCamY = Math.round(-camera.y + shakeY);
  ctx.translate(renderCamX, renderCamY);

  renderEnvironment(ctx);

  const pad = 60;
  const viewLeft = camera.x - pad;
  const viewRight = camera.x + cameraViewW + pad;
  const viewTop = camera.y - pad;
  const viewBottom = camera.y + cameraViewH + pad;

  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    if (p.x < viewLeft || p.x > viewRight || p.y < viewTop || p.y > viewBottom) continue;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.hitFlash > 0 ? '#fff' : '#7f8c8d';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
  }

  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (d.x < viewLeft || d.x > viewRight || d.y < viewTop || d.y > viewBottom) continue;
    ctx.save();
    ctx.translate(d.x, d.y);
    if (d.life < 300 && Math.floor(d.life / 10) % 2 === 0) {
      ctx.restore();
      continue;
    }
    if (d.type === 'HEART') {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(-3, -2, 4, 0, Math.PI * 2);
      ctx.arc(3, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-7, -1);
      ctx.lineTo(7, -1);
      ctx.lineTo(0, 7);
      ctx.closePath();
      ctx.fill();
    } else if (d.type === 'MAGNET') {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 6, Math.PI, 0);
      ctx.stroke();
    } else if (d.type === 'CLOCK') {
      ctx.fillStyle = '#00d2d3';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (let i = 0; i < chests.length; i++) {
    const ch = chests[i];
    if (ch.x < viewLeft || ch.x > viewRight || ch.y < viewTop || ch.y > viewBottom) continue;

    const z = Math.min(0, ch.z || 0);
    const isMini = ch.tier === 'MINI_BOSS';
    const bw = isMini ? 22 : 26;
    const bh = isMini ? 16 : 19;
    const hw = bw / 2;
    const hh = bh / 2;

    // 1. Sombra elíptica no solo
    const shadowScale = Math.max(0.3, 1 - Math.abs(z) / 90);
    const shadowAlpha = Math.max(0.12, 0.45 * shadowScale);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(ch.x, ch.y + 4, (ch.radius + 3) * shadowScale, ((ch.radius + 3) * 0.42) * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Feixes de Luz Místicos (God Rays) e Pulso Radiante quando em repouso
    if (ch.isResting) {
      const rayColor = isMini ? 'rgba(52, 152, 219, 0.07)' : 'rgba(241, 196, 15, 0.08)';
      const glowColor = isMini ? 'rgba(52, 152, 219, 0.22)' : 'rgba(241, 196, 15, 0.25)';
      const angleRot = frameCount * 0.012 + (ch.pulseOffset || 0);

      ctx.save();
      ctx.translate(ch.x, ch.y + 2);
      ctx.rotate(angleRot);
      ctx.fillStyle = rayColor;
      for (let r = 0; r < 6; r++) {
        const rayA = (r * Math.PI * 2) / 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, ch.radius + 18, rayA - 0.22, rayA + 0.22);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      const pulse = Math.sin(frameCount * 0.08 + (ch.pulseOffset || 0)) * 2.2;
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(ch.x, ch.y + 2, ch.radius + 3 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Arte Procedural do Baú em Perspectiva 2.5D
    ctx.save();
    ctx.translate(ch.x, ch.y + z);

    // Caixa de madeira reforçada
    const woodGrad = ctx.createLinearGradient(-hw, -hh, -hw, hh);
    woodGrad.addColorStop(0, '#542d18');
    woodGrad.addColorStop(0.5, '#3a1e0f');
    woodGrad.addColorStop(1, '#241208');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh + 3, bw, bh - 3, 3);
    ctx.fill();
    ctx.strokeStyle = '#1a0b04';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tampa arredondada superior (Lid)
    const lidGrad = ctx.createLinearGradient(-hw, -hh - 4, -hw, -hh + 5);
    lidGrad.addColorStop(0, isMini ? '#47535e' : '#733c1d');
    lidGrad.addColorStop(0.5, isMini ? '#2f3640' : '#542d18');
    lidGrad.addColorStop(1, isMini ? '#1e272e' : '#33190c');
    ctx.fillStyle = lidGrad;
    ctx.beginPath();
    ctx.roundRect(-hw - 1, -hh - 3, bw + 2, 7, [4, 4, 1, 1]);
    ctx.fill();
    ctx.strokeStyle = isMini ? '#718093' : '#8d4b24';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tiras verticais de aço reforçado
    const strapColor = isMini ? '#718093' : '#d35400';
    const rivetColor = isMini ? '#dcdde1' : '#f1c40f';
    const strapOffset = hw * 0.52;
    [-strapOffset, strapOffset].forEach(sx => {
      ctx.fillStyle = strapColor;
      ctx.fillRect(sx - 1.5, -hh - 3, 3, bh + 3);
      ctx.fillStyle = rivetColor;
      ctx.beginPath(); ctx.arc(sx, -hh - 1, 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx, hh - 2, 1, 0, Math.PI * 2); ctx.fill();
    });

    // Friso horizontal da tampa
    ctx.fillStyle = isMini ? '#bdc3c7' : '#f1c40f';
    ctx.fillRect(-hw - 1, -hh + 3, bw + 2, 2);

    // Fechadura em formato de brasão com gema
    ctx.fillStyle = isMini ? '#95a5a6' : '#f39c12';
    ctx.beginPath();
    ctx.roundRect(-3.5, -hh + 2, 7, 7, 2);
    ctx.fill();
    ctx.strokeStyle = isMini ? '#dcdde1' : '#f1c40f';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Gema mística no miolo da fechadura
    ctx.fillStyle = isMini ? '#00cec9' : '#e74c3c';
    ctx.beginPath();
    ctx.arc(0, -hh + 5.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Ponto de luz na gema
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-0.6, -hh + 4.9, 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 0. Fendas Tectônicas e Crateras Persistentes de Sir Roland (duram 5.5s com fade out gradual no solo)
  drawGroundCraters(ctx, viewLeft, viewRight, viewTop, viewBottom);

  // 1. Renderização das poças ativas no solo (Ácido / Alquimia / Fogo) - no chão, abaixo das orbes de XP
  for (let i = 0; i < acidPuddles.length; i++) {
    const p = acidPuddles[i];
    if (p.x < viewLeft || p.x > viewRight || p.y < viewTop || p.y > viewBottom) continue;

    const maxL = p.maxLife || 220;
    
    // Janela de animação visível de fade out cobrindo os últimos 50% de vida da poça
    const fadeWindow = maxL * 0.50;
    const fadeProgress = Math.min(1, Math.max(0, p.life / fadeWindow));

    // Dissipação visual: a poça encolhe gradualmente até o solo enquanto esvazia o alpha
    const shrinkFactor = 0.25 + 0.75 * fadeProgress;
    const pulse = Math.sin(frameCount * 0.14 + i) * 2;
    const r = Math.max(2, (p.radius + pulse) * shrinkFactor);

    // 1. Rastro de Fogo Vivo e Leito de Magma Incandescente (Ignis Ult / Passo Ígneo)
    if (p.isFire) {
      const shrinkFactor = 0.35 + 0.65 * fadeProgress;
      const baseR = Math.max(6, (p.radius || 38) * shrinkFactor);
      const fireAlpha = Math.min(1, fadeProgress * 1.15);
      const seed = (p.x * 12.9898 + p.y * 78.233) % 1000;

      ctx.save();
      ctx.globalAlpha = fireAlpha;

      // A. Resplendor térmico difuso no solo (Ambient Heat Glow)
      const glowR = baseR * 1.7;
      const heatGrad = ctx.createRadialGradient(p.x, p.y, baseR * 0.15, p.x, p.y, glowR);
      heatGrad.addColorStop(0, 'rgba(255, 170, 0, 0.35)');
      heatGrad.addColorStop(0.45, 'rgba(230, 80, 20, 0.20)');
      heatGrad.addColorStop(1, 'rgba(180, 40, 10, 0)');
      ctx.fillStyle = heatGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // B. Rocha vulcânica chamuscada e leito de magma orgânico
      ctx.beginPath();
      const numPoints = 8;
      for (let pt = 0; pt < numPoints; pt++) {
        const angle = (pt / numPoints) * Math.PI * 2;
        const radiusVar = baseR * (0.82 + 0.22 * Math.sin(angle * 3 + seed + frameCount * 0.04));
        const px = p.x + Math.cos(angle) * radiusVar;
        const py = p.y + Math.sin(angle) * radiusVar * 0.72; // perspectiva 2.5D
        if (pt === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Gradiente do leito de magma (de núcleo incandescente para fuligem)
      const magmaGrad = ctx.createRadialGradient(p.x, p.y, baseR * 0.1, p.x, p.y, baseR);
      magmaGrad.addColorStop(0, '#ffffff');
      magmaGrad.addColorStop(0.2, '#fff176');
      magmaGrad.addColorStop(0.5, '#f39c12');
      magmaGrad.addColorStop(0.78, '#d35400');
      magmaGrad.addColorStop(1, 'rgba(44, 20, 15, 0.85)');
      ctx.fillStyle = magmaGrad;
      ctx.fill();

      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // C. Fendas térmicas incandescentes (pulsando no interior da poça)
      const fissurePulse = Math.sin(frameCount * 0.18 + seed) * 0.2 + 0.8;
      ctx.strokeStyle = `rgba(255, 240, 160, ${0.75 * fissurePulse})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x - baseR * 0.5, p.y + baseR * 0.1);
      ctx.lineTo(p.x, p.y - baseR * 0.15);
      ctx.lineTo(p.x + baseR * 0.45, p.y + baseR * 0.12);
      ctx.stroke();

      // D. Línguas de Fogo Vivas (Procedural Animated Flame Tongues)
      const flameCount = 4;
      for (let f = 0; f < flameCount; f++) {
        const fSeed = seed + f * 47;
        const fRelX = ((f - (flameCount - 1) / 2) / (flameCount / 2)) * (baseR * 0.65);
        const fBaseX = p.x + fRelX;
        const fBaseY = p.y + Math.sin(fSeed) * (baseR * 0.25);

        // Altura e oscilação da labareda
        const fWave = Math.sin(frameCount * 0.32 + fSeed * 0.5);
        const fHeight = (baseR * 0.95 + fWave * (baseR * 0.35)) * shrinkFactor;
        const fSway = Math.sin(frameCount * 0.22 + fSeed) * (baseR * 0.22);
        const fWidth = (baseR * 0.38 + fWave * (baseR * 0.08)) * shrinkFactor;

        const tipX = fBaseX + fSway;
        const tipY = fBaseY - fHeight;

        // Labareda Externa (Carmesim / Vermelho Fogo)
        ctx.fillStyle = f % 2 === 0 ? '#e74c3c' : '#c0392b';
        ctx.beginPath();
        ctx.moveTo(fBaseX - fWidth, fBaseY);
        ctx.quadraticCurveTo(fBaseX - fWidth * 0.7, fBaseY - fHeight * 0.45, tipX, tipY);
        ctx.quadraticCurveTo(fBaseX + fWidth * 0.7, fBaseY - fHeight * 0.45, fBaseX + fWidth, fBaseY);
        ctx.closePath();
        ctx.fill();

        // Labareda Média (Laranja Solar / Âmbar)
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.moveTo(fBaseX - fWidth * 0.65, fBaseY);
        ctx.quadraticCurveTo(fBaseX - fWidth * 0.45, fBaseY - fHeight * 0.4, tipX * 0.95 + fBaseX * 0.05, tipY + fHeight * 0.15);
        ctx.quadraticCurveTo(fBaseX + fWidth * 0.45, fBaseY - fHeight * 0.4, fBaseX + fWidth * 0.65, fBaseY);
        ctx.closePath();
        ctx.fill();

        // Labareda Interna (Amarelo Ouro / Branco Solar)
        ctx.fillStyle = '#fff176';
        ctx.beginPath();
        ctx.moveTo(fBaseX - fWidth * 0.35, fBaseY);
        ctx.quadraticCurveTo(fBaseX - fWidth * 0.2, fBaseY - fHeight * 0.35, tipX * 0.9 + fBaseX * 0.1, tipY + fHeight * 0.35);
        ctx.quadraticCurveTo(fBaseX + fWidth * 0.2, fBaseY - fHeight * 0.35, fBaseX + fWidth * 0.35, fBaseY);
        ctx.closePath();
        ctx.fill();
      }

      // E. Brasas e Fagulhas Ascendentes (Rising Embers)
      const emberCount = 5;
      for (let emb = 0; emb < emberCount; emb++) {
        const embSeed = seed + emb * 83;
        const cycle = ((frameCount * 0.6 + embSeed * 7) % 36) / 36; // 0..1
        const embAlpha = (1 - cycle) * (cycle > 0.1 ? 1 : cycle * 10);
        const embDist = cycle * (baseR * 1.55);
        const embSway = Math.sin(frameCount * 0.14 + embSeed + cycle * 4) * (baseR * 0.35);
        const embX = p.x + ((embSeed % 17) - 8) * (baseR * 0.08) + embSway;
        const embY = p.y - embDist;
        const embSize = Math.max(0.8, (2.4 - cycle * 1.5) * shrinkFactor);

        ctx.fillStyle = emb % 2 === 0 ? `rgba(255, 235, 120, ${embAlpha})` : `rgba(243, 156, 18, ${embAlpha})`;
        ctx.beginPath();
        ctx.arc(embX, embY, embSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      continue;
    }

    ctx.save();
    // Opacidade base 50% mais translúcida para Valéria (0.28), atenuada linearmente por globalAlpha
    const baseAlpha = p.isAlchemist ? 0.28 : 0.60;
    ctx.globalAlpha = baseAlpha * fadeProgress;

    if (p.isAlchemist) {
      // Poça de veneno da Valéria: ROXA / Violeta Alquímica (diferenciada de venenos de mobs)
      ctx.fillStyle = p.isEvolved ? '#a29bfe' : '#8e44ad';
      ctx.strokeStyle = p.isEvolved ? '#d6a2e8' : '#9b59b6';
    } else if (p.isEvolved) {
      ctx.fillStyle = '#00cec9';
      ctx.strokeStyle = '#81ecec';
    } else {
      ctx.fillStyle = '#2ecc71';
      ctx.strokeStyle = '#27ae60';
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const bubbleCount = p.isEvolved ? 4 : 3;
    for (let b = 0; b < bubbleCount; b++) {
      const bAng = frameCount * 0.08 + (b * Math.PI * 2 / bubbleCount) + i;
      const bDist = r * 0.52;
      const bx = p.x + Math.cos(bAng) * bDist;
      const by = p.y + Math.sin(bAng) * bDist;
      ctx.fillStyle = p.isAlchemist ? (p.isEvolved ? '#e056fd' : '#d6a2e8') : (p.isEvolved ? '#e0ffff' : '#a8e6cf');
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(0.5, (2.2 + Math.sin(frameCount * 0.2 + b) * 1.2) * shrinkFactor), 0, Math.PI * 2);
      ctx.fill();
    }

    if (p.isAlchemist) {
      // Anel cáustico efervescente interno em tom violeta
      ctx.strokeStyle = p.isEvolved ? 'rgba(214, 162, 232, 0.70)' : 'rgba(155, 89, 182, 0.70)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, r * 0.78), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Renderização das Orbes de XP (Gems) - Sobrepostas às poças com alto relevo visual (Zero-Save/Restore)
  for (let i = 0; i < gems.length; i++) {
    const g = gems[i];
    if (g.x < viewLeft || g.x > viewRight || g.y < viewTop || g.y > viewBottom) continue;

    const baseColor = g.color || (g.isSuper ? '#e056fd' : '#00d2d3');
    const baseR = g.radius || 4.5;
    const pulseOffset = g.pulseOffset || 0;
    const pulse = Math.sin(frameCount * 0.16 + pulseOffset) * (g.isSuper ? 2.2 : 1.2);
    const rad = Math.max(3, baseR + pulse);

    const gx = g.x;
    const gy = g.y;

    // 1. Halo Luminoso / Aura Radiante Pulsante
    let haloColor = 'rgba(0, 210, 211, 0.38)';
    if (g.isSuper) haloColor = 'rgba(224, 86, 253, 0.45)';
    else if (baseColor === '#f1c40f') haloColor = 'rgba(241, 196, 15, 0.40)';
    else if (baseColor === '#2ecc71') haloColor = 'rgba(46, 204, 113, 0.40)';

    ctx.fillStyle = haloColor;
    ctx.beginPath();
    ctx.arc(gx, gy, rad * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Geometria de Cristal Facetado em Losango / Gema Lapidada
    const rx = rad * 0.95;
    const ry = rad * 1.35;

    // Faceta Esquerda (Tom Base)
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(gx, gy - ry);
    ctx.lineTo(gx - rx, gy);
    ctx.lineTo(gx, gy + ry);
    ctx.closePath();
    ctx.fill();

    // Faceta Direita (Reflexo Lapidado Mais Claro)
    ctx.fillStyle = g.isSuper ? '#f3a4fc' : (baseColor === '#f1c40f' ? '#f9ca24' : (baseColor === '#2ecc71' ? '#55efc4' : '#81ecec'));
    ctx.beginPath();
    ctx.moveTo(gx, gy - ry);
    ctx.lineTo(gx + rx, gy);
    ctx.lineTo(gx, gy + ry);
    ctx.closePath();
    ctx.fill();

    // Borda Lapidada de Alto Contraste
    ctx.strokeStyle = g.isSuper ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(gx, gy - ry);
    ctx.lineTo(gx + rx, gy);
    ctx.lineTo(gx, gy + ry);
    ctx.lineTo(gx - rx, gy);
    ctx.closePath();
    ctx.stroke();

    // Núcleo Incandescente Central
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(gx, gy, rx * 0.32, ry * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Ponto Especular e Cintilação Estelar (Sparkle Glint)
    const glintPhase = Math.sin(frameCount * 0.22 + pulseOffset);
    if (glintPhase > 0.3) {
      const glintSize = (g.isSuper ? 4.5 : 3.0) * glintPhase;
      ctx.fillStyle = '#ffffff';
      const glintCenterX = gx - rx * 0.22;
      const glintCenterY = gy - ry * 0.35;

      // Brilho em cruz de 4 pontas
      ctx.beginPath();
      ctx.moveTo(glintCenterX, glintCenterY - glintSize);
      ctx.lineTo(glintCenterX + glintSize * 0.28, glintCenterY);
      ctx.lineTo(glintCenterX, glintCenterY + glintSize);
      ctx.lineTo(glintCenterX - glintSize * 0.28, glintCenterY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(glintCenterX - glintSize, glintCenterY);
      ctx.lineTo(glintCenterX, glintCenterY - glintSize * 0.28);
      ctx.lineTo(glintCenterX + glintSize, glintCenterY);
      ctx.lineTo(glintCenterX, glintCenterY + glintSize * 0.28);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Detalhe Astral de Super Gemas: Fagulho Orbital Mágico
    if (g.isSuper) {
      const sparkAng = frameCount * 0.14 + pulseOffset;
      const sparkDist = rad * 1.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(gx + Math.cos(sparkAng) * sparkDist, gy + Math.sin(sparkAng) * sparkDist, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(gx, gy, sparkDist, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Renderização precisa dos telégrafos de chefes (cones, faixas, crateras de queda e fissuras)
  for (let i = 0; i < bossTelegraphs.length; i++) {
    const t = bossTelegraphs[i];
    const maxT = (t.maxTimer && t.maxTimer > 0) ? t.maxTimer : (t.timer || 1);
    const rawProgress = 1 - (t.timer / maxT);
    const progress = isNaN(rawProgress) ? 1 : Math.max(0, Math.min(1, rawProgress));
    ctx.save();

    if (t.type === 'SCYTHE_CLEAVE') {
      const arcHalf = t.arcHalf !== undefined ? t.arcHalf : Math.PI * 0.52;
      const startAng = t.angle - arcHalf;
      const endAng = t.angle + arcHalf;
      const rgbCol = t.colorRgb || '0, 206, 201';
      const hexCol = t.color || '#00cec9';

      // 1. Área total de corte com grade rúnica sutil
      ctx.fillStyle = `rgba(${rgbCol}, 0.14)`;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, t.radius, startAng, endAng);
      ctx.closePath();
      ctx.fill();

      // Borda total do cone
      ctx.strokeStyle = `rgba(${rgbCol}, 0.55)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x + Math.cos(startAng) * t.radius, t.y + Math.sin(startAng) * t.radius);
      ctx.arc(t.x, t.y, t.radius, startAng, endAng);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();

      // 2. Preenchimento de carregamento de perigo
      ctx.fillStyle = `rgba(${rgbCol}, ${0.22 + progress * 0.48})`;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, t.radius * progress, startAng, endAng);
      ctx.closePath();
      ctx.fill();

      // Borda de avanço da lâmina
      ctx.strokeStyle = progress > 0.82 ? '#ffffff' : hexCol;
      ctx.lineWidth = progress > 0.82 ? 4.5 : 3.0;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * progress, startAng, endAng);
      ctx.stroke();

      // 3. Setas direcionais curvas espectrais no chão
      const arrowArcs = [0.45, 0.72];
      for (let rFrac of arrowArcs) {
        const arrowR = t.radius * rFrac;
        if (progress > 0.12) {
          ctx.strokeStyle = progress > 0.8 ? '#ffffff' : `rgba(${rgbCol}, 0.75)`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y, arrowR, t.angle - 0.28, t.angle + 0.28);
          ctx.stroke();

          const tipAng = t.angle + 0.28;
          const tipX = t.x + Math.cos(tipAng) * arrowR;
          const tipY = t.y + Math.sin(tipAng) * arrowR;
          ctx.fillStyle = progress > 0.8 ? '#ffffff' : hexCol;
          ctx.beginPath();
          ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (t.type === 'MIST_DASH_LANE') {
      const len = t.length || 320;
      const w = t.width || 70;
      const halfW = w / 2;

      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);

      ctx.fillStyle = 'rgba(142, 68, 173, 0.15)';
      ctx.fillRect(0, -halfW, len, w);

      ctx.strokeStyle = 'rgba(155, 89, 182, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(0, -halfW, len, w);
      ctx.setLineDash([]);

      ctx.fillStyle = `rgba(231, 76, 60, ${0.25 + progress * 0.4})`;
      ctx.fillRect(0, -halfW, len * progress, w);

      const arrowCount = 4;
      ctx.fillStyle = progress > 0.8 ? '#ffffff' : '#ff7675';
      for (let a = 1; a <= arrowCount; a++) {
        const ax = (len / (arrowCount + 1)) * a;
        if (ax <= len * (progress + 0.2)) {
          ctx.beginPath();
          ctx.moveTo(ax - 8, -10);
          ctx.lineTo(ax + 8, 0);
          ctx.lineTo(ax - 8, 10);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(len * progress, -halfW);
      ctx.lineTo(len * progress, halfW);
      ctx.stroke();
    } else if (t.type === 'FALLING_ROCK') {
      // Telegrafia Intuitiva de Queda: Sombra que cresce + Anel de aviso que encolhe de fora para dentro
      const shadowR = t.radius * (0.25 + progress * 0.75);
      ctx.fillStyle = 'rgba(15, 10, 8, 0.45)';
      ctx.beginPath();
      ctx.ellipse(t.x, t.y, shadowR, shadowR * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Anel de impacto fixo
      ctx.strokeStyle = 'rgba(230, 126, 34, 0.4)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Anel cadente em retração
      const fallingRingR = t.radius + (t.radius * 1.5) * (1 - progress);
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : `rgba(243, 156, 18, ${0.35 + progress * 0.65})`;
      ctx.lineWidth = progress > 0.85 ? 3.5 : 2.2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, fallingRingR, 0, Math.PI * 2);
      ctx.stroke();

      // Renderização do monólito de basalto caindo do céu nos últimos 35% do tempo
      if (progress > 0.65) {
        const rockDropPhase = (progress - 0.65) / 0.35;
        const altitude = (1 - rockDropPhase) * 110;
        const rockY = t.y - altitude;
        ctx.fillStyle = '#2d3436';
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(t.x, rockY - 14);
        ctx.lineTo(t.x + 12, rockY);
        ctx.lineTo(t.x + 8, rockY + 14);
        ctx.lineTo(t.x - 8, rockY + 14);
        ctx.lineTo(t.x - 12, rockY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (t.type === 'FISSURE_NODE') {
      // Linha de fratura conectada à origem e nós precedentes
      if (t.originX !== undefined && t.originY !== undefined) {
        ctx.strokeStyle = `rgba(230, 126, 34, ${0.25 + progress * 0.45})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(t.originX, t.originY);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(230, 126, 34, ${0.15 + progress * 0.35})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      // Estacas de pedra saindo do chão gradualmente
      const spikeR = t.radius * progress;
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : '#e67e22';
      ctx.lineWidth = progress > 0.85 ? 3.0 : 2.0;
      ctx.beginPath();
      ctx.arc(t.x, t.y, spikeR, 0, Math.PI * 2);
      ctx.stroke();

      // Racha tectônica no centro do nó
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x - 8, t.y - 4);
      ctx.lineTo(t.x, t.y + 4);
      ctx.lineTo(t.x + 8, t.y - 2);
      ctx.stroke();
    } else if (t.type === 'ABYSSAL_VOID_RIFT') {
      // Telegrafia Cósmica do Bombardeio Abissal
      // 1. Círculo Externo com glifos pulsantes e anel de alerta
      ctx.fillStyle = `rgba(14, 2, 24, ${0.25 + progress * 0.35})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(0, 206, 201, ${0.4 + progress * 0.45})`;
      ctx.lineWidth = 2.0;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Preenchimento de carregamento de perigo em expansão
      const curR = t.radius * progress;
      const riftGrad = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, Math.max(3, curR));
      riftGrad.addColorStop(0, '#ffffff');
      riftGrad.addColorStop(0.35, '#00cec9');
      riftGrad.addColorStop(0.75, 'rgba(232, 67, 147, 0.7)');
      riftGrad.addColorStop(1, 'rgba(142, 68, 173, 0.1)');
      ctx.fillStyle = riftGrad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, curR, 0, Math.PI * 2);
      ctx.fill();

      // Borda de detonação
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : '#00cec9';
      ctx.lineWidth = progress > 0.85 ? 3.5 : 2.2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, curR, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Glifos e runas rotativas cósmicas
      const rot = frameCount * 0.06;
      ctx.strokeStyle = progress > 0.8 ? '#ffffff' : 'rgba(232, 67, 147, 0.8)';
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 4; g++) {
        const ga = rot + (g * Math.PI * 0.5);
        const gx = t.x + Math.cos(ga) * (t.radius * 0.65);
        const gy = t.y + Math.sin(ga) * (t.radius * 0.65);
        ctx.beginPath();
        ctx.arc(gx, gy, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (t.type === 'DIMENSIONAL_CLEAVE') {
      // Telegrafia da Fratura Dimensional: Lâminas Geométricas de Vácuo Cortando a Arena
      const halfLen = (t.length || 1300) * 0.5;
      const w = t.width || 68; // Dobro da espessura base de telegrafia
      const cosA = Math.cos(t.angle);
      const sinA = Math.sin(t.angle);

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);

      // 1. Corredor de perigo translúcido
      const corridorAlpha = 0.10 + progress * 0.22;
      ctx.fillStyle = `rgba(0, 206, 201, ${corridorAlpha})`;
      ctx.fillRect(-halfLen, -w * 0.5, halfLen * 2, w);

      // Bordas do corredor
      ctx.strokeStyle = `rgba(232, 67, 147, ${0.35 + progress * 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(-halfLen, -w * 0.5);
      ctx.lineTo(halfLen, -w * 0.5);
      ctx.moveTo(-halfLen, w * 0.5);
      ctx.lineTo(halfLen, w * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Fissura Central de Navalha com Brilho Cósmico
      const coreAlpha = 0.4 + progress * 0.6;
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : `rgba(0, 206, 201, ${coreAlpha})`;
      ctx.lineWidth = progress > 0.85 ? 4.0 : 2.0;
      ctx.beginPath();
      ctx.moveTo(-halfLen * progress, 0);
      ctx.lineTo(halfLen * progress, 0);
      ctx.stroke();

      // 3. Glifos e micro-fissuras estelares ao longo do corte
      const runeStep = 75;
      const runeCount = Math.floor((halfLen * 2) / runeStep);
      for (let r = 0; r <= runeCount; r++) {
        const rx = -halfLen + r * runeStep;
        if (Math.abs(rx) <= halfLen * progress) {
          ctx.fillStyle = r % 2 === 0 ? '#00cec9' : '#e84393';
          ctx.beginPath();
          ctx.arc(rx, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Pequenas pontas de agulha ortogonais
          ctx.strokeStyle = progress > 0.85 ? '#ffffff' : 'rgba(232, 67, 147, 0.7)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(rx, -4);
          ctx.lineTo(rx, 4);
          ctx.stroke();
        }
      }
      ctx.restore();
    } else if (t.type === 'ASTRAL_METEOR_SEAL') {
      // Selo Rúnico de Queda de Meteoro Cósmico
      // 1. Círculo Externo com anel de alerta
      ctx.fillStyle = `rgba(30, 2, 40, ${0.22 + progress * 0.32})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(232, 67, 147, ${0.45 + progress * 0.5})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Mira nos 4 eixos
      const crossSize = 10;
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : '#00cec9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x - t.radius - crossSize, t.y); ctx.lineTo(t.x - t.radius + crossSize, t.y);
      ctx.moveTo(t.x + t.radius - crossSize, t.y); ctx.lineTo(t.x + t.radius + crossSize, t.y);
      ctx.moveTo(t.x, t.y - t.radius - crossSize); ctx.lineTo(t.x, t.y - t.radius + crossSize);
      ctx.moveTo(t.x, t.y + t.radius - crossSize); ctx.lineTo(t.x, t.y + t.radius + crossSize);
      ctx.stroke();

      // 2. Preenchimento de avanço do meteoro
      const curR = t.radius * progress;
      const sealGrad = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, Math.max(3, curR));
      sealGrad.addColorStop(0, '#ffffff');
      sealGrad.addColorStop(0.3, '#e84393');
      sealGrad.addColorStop(0.7, '#8e44ad');
      sealGrad.addColorStop(1, 'rgba(0, 206, 201, 0.15)');
      ctx.fillStyle = sealGrad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, curR, 0, Math.PI * 2);
      ctx.fill();

      // Borda de detonação
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : '#e84393';
      ctx.lineWidth = progress > 0.85 ? 3.5 : 2.0;
      ctx.beginPath();
      ctx.arc(t.x, t.y, curR, 0, Math.PI * 2);
      ctx.stroke();

      // Rotação estelar interna
      const starRot = frameCount * 0.08;
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : 'rgba(0, 206, 201, 0.7)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const sa = starRot + (s * Math.PI / 3);
        const sx = t.x + Math.cos(sa) * (t.radius * 0.5);
        const sy = t.y + Math.sin(sa) * (t.radius * 0.5);
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      const isTeleport = t.type === 'VAMPIRE_TELEPORT';
      const isRepulsion = t.type === 'REPULSION';
      const baseCol = isTeleport ? '#8e44ad' : (isRepulsion ? '#ff1744' : '#e74c3c');

      ctx.fillStyle = isTeleport ? 'rgba(142, 68, 173, 0.12)' : (isRepulsion ? 'rgba(255, 23, 68, 0.18)' : 'rgba(231, 76, 60, 0.12)');
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isTeleport ? 'rgba(142, 68, 173, 0.65)' : (isRepulsion ? 'rgba(255, 23, 68, 0.85)' : 'rgba(231, 76, 60, 0.65)');
      ctx.lineWidth = isRepulsion ? 2.8 : 2;
      ctx.stroke();

      ctx.fillStyle = isTeleport 
        ? `rgba(142, 68, 173, ${0.2 + progress * 0.45})` 
        : (isRepulsion ? `rgba(255, 23, 68, ${0.25 + progress * 0.5})` : `rgba(231, 76, 60, ${0.2 + progress * 0.45})`);
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : baseCol;
      ctx.lineWidth = progress > 0.85 ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2);
      ctx.stroke();

      if (isTeleport) {
        const rot = frameCount * 0.05;
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.75)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const a = rot + (k * Math.PI * 2 / 3);
          const px = t.x + Math.cos(a) * (t.radius * 0.65);
          const py = t.y + Math.sin(a) * (t.radius * 0.65);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Renderização volumétrica das ondas de choque em expansão
  for (let i = 0; i < bossShockwaves.length; i++) {
    const sw = bossShockwaves[i];
    const alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
    if (alpha <= 0.01) continue;

    ctx.save();
    const swColor = sw.colorRgb || (activeBoss && activeBoss.bossId === 3 ? '0, 206, 201' : '230, 126, 34');

    // 1. Corpo volumétrico translúcido da onda (camada externa com dispersão de luz)
    ctx.strokeStyle = `rgba(${swColor}, ${alpha * 0.24})`;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Camada intermediária saturada e nítida
    ctx.strokeStyle = `rgba(${swColor}, ${alpha * 0.78})`;
    ctx.lineWidth = 4.8;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Crista frontal superaquecida de luz branca (marcação exata da hitbox)
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Fagulhas estelares projetadas na crista da onda para leitura visual imediata
    if (sw.radius > 20 && alpha > 0.2) {
      const sparkCount = 8;
      const timeOffset = (frameCount || 0) * 0.04;
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < sparkCount; s++) {
        const sAng = (s * Math.PI * 2) / sparkCount + timeOffset;
        const sparkX = sw.x + Math.cos(sAng) * sw.radius;
        const sparkY = sw.y + Math.sin(sAng) * sw.radius;

        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 2.0 * alpha, 0, Math.PI * 2);
        ctx.fill();

        // Rastro curto radial
        const trailLen = 7 * alpha;
        ctx.strokeStyle = `rgba(${swColor}, ${alpha * 0.65})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sparkX, sparkY);
        ctx.lineTo(sparkX - Math.cos(sAng) * trailLen, sparkY - Math.sin(sAng) * trailLen);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  for (let i = 0; i < bossProjectiles.length; i++) {
    const bp = bossProjectiles[i];
    ctx.save();
    ctx.translate(bp.x, bp.y);
    ctx.rotate(bp.angle);

    if (bp.type === 'SOUL_SCYTHE') {
      const isRet = bp.isReturning;
      const primaryCol = isRet ? '#ff4757' : (bp.color || '#00cec9');
      const glowCol    = isRet ? '#ff6b81' : '#81ecec';
      const r = bp.radius || 20;

      // 1. Rastro Espectral Circular / Desfoque de Giro (Motion Blur Whirl)
      ctx.save();
      const whirlGrad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.45);
      whirlGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      whirlGrad.addColorStop(0.65, isRet ? 'rgba(255, 71, 87, 0.24)' : 'rgba(0, 206, 201, 0.20)');
      whirlGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = whirlGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
      ctx.fill();

      // Anéis de perigo no retorno
      if (isRet) {
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.6)';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      // 2. Haste Reto e Manivela Serrilhada com Orbe Ciano
      const tealCol  = isRet ? '#ff4757' : '#00cec9';
      const rubyCol  = isRet ? '#ff4757' : '#c0392b';

      // Haste reta
      ctx.fillStyle = '#141a1f';
      ctx.fillRect(-1.5, -r * 0.95, 3, r * 1.75);

      // Braçadeiras teal
      ctx.fillStyle = '#222d36';
      ctx.strokeStyle = tealCol;
      ctx.lineWidth = 0.9;
      ctx.strokeRect(-2.8, -r * 0.45, 5.6, 3);
      ctx.strokeRect(-2.8, r * 0.25, 5.6, 3);

      // Manivela serrilhada e orbe inferior
      ctx.strokeStyle = tealCol;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.8);
      ctx.lineTo(-r * 0.25, r * 1.0);
      ctx.lineTo(-r * 0.25, r * 1.35);
      ctx.lineTo(-r * 0.45, r * 1.45);
      ctx.stroke();

      // Dentes de serra na manivela
      ctx.fillStyle = '#222d36';
      for (let s = 0; s < 3; s++) {
        const sy = r * (1.05 + s * 0.1);
        ctx.beginPath();
        ctx.moveTo(-r * 0.25, sy);
        ctx.lineTo(-r * 0.08, sy + r * 0.04);
        ctx.lineTo(-r * 0.25, sy + r * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Orbe ciano no pomo
      ctx.fillStyle = tealCol;
      ctx.beginPath();
      ctx.arc(-r * 0.45, r * 1.45, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Escala reduzida pela metade (50%) para a lâmina e contra-lâmina da foice giratória
      ctx.save();
      ctx.translate(0, -r * 0.95);
      ctx.scale(0.5, 0.5);
      ctx.translate(0, r * 0.95);

      // 3. Cabeçote e Contra-Lâmina Traseira com Rubi (Formato Curvo em Garra)
      ctx.fillStyle = '#1e2b36';
      ctx.beginPath();
      ctx.moveTo(r * 0.1, -r * 1.0);
      ctx.bezierCurveTo(r * 0.35, -r * 1.1, r * 0.55, -r * 0.88, r * 0.65, -r * 0.35);
      ctx.bezierCurveTo(r * 0.48, -r * 0.55, r * 0.28, -r * 0.75, r * 0.1, -r * 0.86);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = tealCol;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Rubi na contra-lâmina
      ctx.fillStyle = rubyCol;
      ctx.beginPath();
      ctx.moveTo(r * 0.18, -r * 0.95);
      ctx.lineTo(r * 0.36, -r * 1.0);
      ctx.lineTo(r * 0.52, -r * 0.80);
      ctx.lineTo(r * 0.32, -r * 0.82);
      ctx.closePath();
      ctx.fill();

      // Gume prateado traseiro
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(r * 0.65, -r * 0.35);
      ctx.bezierCurveTo(r * 0.48, -r * 0.55, r * 0.28, -r * 0.75, r * 0.1, -r * 0.86);
      ctx.stroke();

      // 4. Lâmina Principal (Formato Fiel ao Conceito Artístico)
      // A. Estalactites de cristal sob a junção
      ctx.fillStyle = rubyCol;
      const stalsProj = [
        [[-r * 0.35, -r * 0.74], [-r * 0.42, -r * 0.46], [-r * 0.48, -r * 0.74]],
        [[-r * 0.48, -r * 0.74], [-r * 0.53, -r * 0.58], [-r * 0.58, -r * 0.74]]
      ];
      for (let st of stalsProj) {
        ctx.beginPath();
        ctx.moveTo(st[0][0], st[0][1]);
        ctx.lineTo(st[1][0], st[1][1]);
        ctx.lineTo(st[2][0], st[2][1]);
        ctx.closePath();
        ctx.fill();
      }

      // B. Corpo da Lâmina: Cúpula com Crista, 3 Espigões Inclinados e Curvatura Monumental
      ctx.fillStyle = '#1e2b36';
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, -r * 1.0);
      // Crista da cúpula
      ctx.quadraticCurveTo(-r * 0.2, -r * 1.16, -r * 0.32, -r * 1.24);
      ctx.quadraticCurveTo(-r * 0.42, -r * 1.20, -r * 0.5, -r * 1.14);
      // Espigão 1
      ctx.quadraticCurveTo(-r * 0.54, -r * 1.25, -r * 0.58, -r * 1.26);
      ctx.lineTo(-r * 0.64, -r * 1.16);
      ctx.lineTo(-r * 0.7, -r * 1.12);
      // Espigão 2
      ctx.quadraticCurveTo(-r * 0.74, -r * 1.22, -r * 0.8, -r * 1.22);
      ctx.lineTo(-r * 0.86, -r * 1.12);
      ctx.lineTo(-r * 0.92, -r * 1.06);
      // Espigão 3
      ctx.quadraticCurveTo(-r * 0.96, -r * 1.14, -r * 1.02, -r * 1.14);
      ctx.lineTo(-r * 1.08, -r * 1.04);
      ctx.lineTo(-r * 1.15, -r * 0.96);
      // Curva monumental do dorso até a ponta
      ctx.bezierCurveTo(-r * 1.45, -r * 0.86, -r * 1.72, -r * 0.55, -r * 1.86, -r * 0.14);
      ctx.bezierCurveTo(-r * 1.96, r * 0.20, -r * 1.94, r * 0.44, -r * 1.86, r * 0.58);
      // Gume interno de retorno
      ctx.bezierCurveTo(-r * 1.82, r * 0.36, -r * 1.74, r * 0.14, -r * 1.64, -r * 0.08);
      ctx.bezierCurveTo(-r * 1.48, -r * 0.38, -r * 1.18, -r * 0.62, -r * 0.6, -r * 0.74);
      // Gancho/barb inferior da cúpula
      ctx.lineTo(-r * 0.25, -r * 0.70);
      ctx.lineTo(-r * 0.16, -r * 0.60);
      ctx.lineTo(-r * 0.1, -r * 0.86);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0e1419';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // C. Canal de Cristais de Rubi Facetados
      ctx.fillStyle = rubyCol;
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.95);
      ctx.lineTo(-r * 0.65, -r * 0.95);
      ctx.lineTo(-r * 1.15, -r * 0.78);
      ctx.lineTo(-r * 1.55, -r * 0.40);
      ctx.lineTo(-r * 1.78, r * 0.15);
      ctx.lineTo(-r * 1.70, r * 0.25);
      ctx.lineTo(-r * 1.50, -r * 0.20);
      ctx.lineTo(-r * 1.10, -r * 0.52);
      ctx.lineTo(-r * 0.60, -r * 0.74);
      ctx.closePath();
      ctx.fill();

      // Facetas internas do rubi
      ctx.strokeStyle = isRet ? '#ff7675' : '#ff4d61';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-r * 0.65, -r * 0.95);
      ctx.lineTo(-r * 0.60, -r * 0.74);
      ctx.moveTo(-r * 1.15, -r * 0.78);
      ctx.lineTo(-r * 1.10, -r * 0.52);
      ctx.moveTo(-r * 1.55, -r * 0.40);
      ctx.lineTo(-r * 1.50, -r * 0.20);
      ctx.stroke();

      // D. Gume Chanfrado em Aço Prateado Polido
      const bladeGrad = ctx.createLinearGradient(-r * 0.6, -r * 0.74, -r * 1.86, r * 0.58);
      bladeGrad.addColorStop(0.0, '#74b9ff');
      bladeGrad.addColorStop(0.4, '#c7ecee');
      bladeGrad.addColorStop(0.8, '#dff9fb');
      bladeGrad.addColorStop(1.0, '#ffffff');

      ctx.strokeStyle = bladeGrad;
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 1.86, r * 0.58); // Ponta extrema da foice
      ctx.bezierCurveTo(-r * 1.82, r * 0.36, -r * 1.74, r * 0.14, -r * 1.64, -r * 0.08);
      ctx.bezierCurveTo(-r * 1.48, -r * 0.38, -r * 1.18, -r * 0.62, -r * 0.6, -r * 0.74);
      ctx.stroke();

      // Fio incandescente puro
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Ponto especular na ponta da foice
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-r * 1.86 - 2, r * 0.58 - 2, 4, 4);

      ctx.restore(); // Restaura escala de 50% da foice giratória
    } else {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, bp.radius, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Renderiza auras, bíblias protetoras e machados giratórios do jogador
  drawPlayerEquipment();

  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];

    if (b.type === 'HAMMER_SLAM') {
      const progress = 1 - (b.life / b.maxLife);
      const alpha = Math.max(0, b.life / b.maxLife);

      ctx.save();
      ctx.translate(b.x, b.y);

      if (progress < 0.32) {
        // FASE 1: WINDUP - Glifo de Carga e Solo Rúnico Sagrado Concentrando Luz
        const windT = progress / 0.32;
        const gatherR = 32 * (1 - windT * 0.4);
        ctx.strokeStyle = `rgba(241, 196, 15, ${windT * 0.65})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, gatherR, 0, Math.PI * 2);
        ctx.stroke();

        // Raios de luz convergindo ao ponto de esmagamento
        for (let r = 0; r < 4; r++) {
          const rAng = b.angle + (r * Math.PI * 0.5) + windT * 0.8;
          ctx.strokeStyle = `rgba(255, 235, 150, ${windT * 0.75})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(rAng) * (gatherR + 14), Math.sin(rAng) * (gatherR + 14));
          ctx.lineTo(Math.cos(rAng) * 5, Math.sin(rAng) * 5);
          ctx.stroke();
        }
      } else {
        // IMPACTO SÍSMICO IMEDIATO: Anel de choque estelar dourado e nítido
        // (Sem disco branco sólido opaco que cega a tela e polui a visão em alta cadência)
        const impactP = (progress - 0.32) / 0.68;
        const flashAlpha = Math.max(0, 1 - impactP * 3.2);
        if (flashAlpha > 0) {
          const shockRingR = b.radius * (0.25 + impactP * 0.75);

          // Anel principal de choque sagrado
          ctx.strokeStyle = b.isEvolved ? `rgba(243, 156, 18, ${flashAlpha * 0.85})` : `rgba(241, 196, 15, ${flashAlpha * 0.80})`;
          ctx.lineWidth = Math.max(1.5, 3.2 * (1 - impactP * 0.7));
          ctx.beginPath();
          ctx.arc(0, 0, shockRingR, 0, Math.PI * 2);
          ctx.stroke();

          // Filete fino interno celestial
          ctx.strokeStyle = `rgba(255, 255, 255, ${flashAlpha * 0.75})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, shockRingR * 0.88, 0, Math.PI * 2);
          ctx.stroke();

          // Ponto de luz concentrado rápido apenas no início exato do choque
          if (impactP < 0.20) {
            const burstAlpha = (1 - impactP / 0.20) * 0.45;
            ctx.fillStyle = `rgba(255, 255, 255, ${burstAlpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
      continue;
    }

    if (b.x < viewLeft || b.x > viewRight || b.y < viewTop || b.y > viewBottom) continue;

    if (b.type === 'STAFF') {
      const rad = b.radius || 9;
      const spin = frameCount * 0.25;

      // 1. RASTRO DE FOGO EM CAUDA DE COMETA FLUIDA (Continuous Flame Comet Ribbon)
      if (b.trail && b.trail.length > 0) {
        ctx.save();
        const allPts = [{ x: b.x, y: b.y }, ...b.trail];
        const numPts = allPts.length;

        if (numPts >= 2) {
          const leftPoints = [];
          const rightPoints = [];

          for (let t = 0; t < numPts; t++) {
            const pt = allPts[t];
            const progress = t / (numPts - 1 || 1); // 0 (cabeça) -> 1 (ponta da cauda)
            const taper = Math.pow(1 - progress, 0.82);
            const currentW = (rad * 1.35) * taper;

            // Vetor tangencial e perpendicular
            let segAngle = b.angle || 0;
            if (t < numPts - 1) {
              segAngle = Math.atan2(allPts[t + 1].y - pt.y, allPts[t + 1].x - pt.x);
            } else if (t > 0) {
              segAngle = Math.atan2(pt.y - allPts[t - 1].y, pt.x - allPts[t - 1].x);
            }

            // Ondulação térmica viva de labareda com o vento e deslocamento
            const wave = Math.sin(frameCount * 0.42 + t * 1.3) * (rad * 0.35 * taper);
            const perpX = -Math.sin(segAngle);
            const perpY = Math.cos(segAngle);

            leftPoints.push({
              x: pt.x + perpX * (currentW + wave),
              y: pt.y + perpY * (currentW + wave)
            });
            rightPoints.push({
              x: pt.x - perpX * (currentW - wave),
              y: pt.y - perpY * (currentW - wave)
            });
          }

          // A. Manto Externo de Fogo Vivo (Carmesim / Laranja Incandescente)
          ctx.beginPath();
          ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
          for (let i = 1; i < leftPoints.length; i++) ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
          for (let i = rightPoints.length - 1; i >= 0; i--) ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
          ctx.closePath();

          const tailGrad = ctx.createLinearGradient(
            b.x, b.y,
            allPts[numPts - 1].x, allPts[numPts - 1].y
          );
          tailGrad.addColorStop(0, b.isEvolved ? 'rgba(231, 76, 60, 0.85)' : 'rgba(230, 126, 34, 0.85)');
          tailGrad.addColorStop(0.45, b.isEvolved ? 'rgba(214, 48, 49, 0.55)' : 'rgba(230, 80, 20, 0.55)');
          tailGrad.addColorStop(1, 'rgba(180, 30, 10, 0)');
          ctx.fillStyle = tailGrad;
          ctx.fill();

          // B. Núcleo Interno de Fogo Dourado
          ctx.beginPath();
          ctx.moveTo(
            b.x + (leftPoints[0].x - b.x) * 0.65,
            b.y + (leftPoints[0].y - b.y) * 0.65
          );
          for (let i = 1; i < leftPoints.length; i++) {
            const lp = leftPoints[i];
            const pt = allPts[i];
            ctx.lineTo(pt.x + (lp.x - pt.x) * 0.65, pt.y + (lp.y - pt.y) * 0.65);
          }
          for (let i = rightPoints.length - 1; i >= 0; i--) {
            const rp = rightPoints[i];
            const pt = allPts[i];
            ctx.lineTo(pt.x + (rp.x - pt.x) * 0.65, pt.y + (rp.y - pt.y) * 0.65);
          }
          ctx.closePath();

          const coreGrad = ctx.createLinearGradient(
            b.x, b.y,
            allPts[numPts - 1].x, allPts[numPts - 1].y
          );
          coreGrad.addColorStop(0, 'rgba(255, 240, 150, 0.95)');
          coreGrad.addColorStop(0.35, 'rgba(241, 196, 15, 0.8)');
          coreGrad.addColorStop(0.8, 'rgba(230, 126, 34, 0.35)');
          coreGrad.addColorStop(1, 'rgba(231, 76, 60, 0)');
          ctx.fillStyle = coreGrad;
          ctx.fill();

          // C. Espinha Dorsal de Plasma Branco de Alta Fusão
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = Math.max(1.2, rad * 0.35);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          const spineCut = Math.min(numPts, 6);
          for (let i = 1; i < spineCut; i++) {
            ctx.lineTo(allPts[i].x, allPts[i].y);
          }
          ctx.stroke();

          // D. Brasas e Faíscas que se desprendem na esteira térmica
          for (let t = 1; t < numPts; t++) {
            const pt = allPts[t];
            const progress = t / numPts;
            const sparkAngle = frameCount * 0.35 + t * 2.3;
            const sparkDist = (rad * 0.85) * Math.sin(sparkAngle);
            const sx = pt.x + Math.cos(sparkAngle) * sparkDist;
            const sy = pt.y + Math.sin(sparkAngle) * sparkDist;
            const sSize = Math.max(0.8, rad * 0.28 * (1 - progress));
            ctx.fillStyle = (t % 2 === 0) 
              ? `rgba(255, 255, 255, ${0.85 * (1 - progress)})` 
              : `rgba(241, 196, 15, ${0.85 * (1 - progress)})`;
            ctx.beginPath();
            ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle || 0);

      // 2. Halo Térmico Radial (Ambient Solar Corona)
      const coronaR = rad * 1.85;
      const orbHalo = ctx.createRadialGradient(0, 0, rad * 0.35, 0, 0, coronaR);
      orbHalo.addColorStop(0, b.isEvolved ? 'rgba(231, 76, 60, 0.60)' : 'rgba(243, 156, 18, 0.60)');
      orbHalo.addColorStop(0.55, b.isEvolved ? 'rgba(192, 57, 43, 0.30)' : 'rgba(230, 126, 34, 0.30)');
      orbHalo.addColorStop(1, 'rgba(230, 80, 20, 0)');
      ctx.fillStyle = orbHalo;
      ctx.beginPath();
      ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
      ctx.fill();

      // 3. Manto de Labaredas em Gota Esculpidas no Contorno
      ctx.fillStyle = b.isEvolved ? '#e74c3c' : '#e67e22';
      ctx.beginPath();
      ctx.moveTo(rad * 1.5, 0);
      ctx.quadraticCurveTo(rad * 0.2, -rad * 1.3, -rad * 1.4, -rad * 0.45);
      ctx.lineTo(-rad * 1.85, 0);
      ctx.lineTo(-rad * 1.4, rad * 0.45);
      ctx.quadraticCurveTo(rad * 0.2, rad * 1.3, rad * 1.5, 0);
      ctx.closePath();
      ctx.fill();

      // 4. Manto Incandescente Amarelo-Ouro
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.ellipse(0, 0, rad * 0.95, rad * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. Núcleo Concentrado de Fusão Branca Solar
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(rad * 0.18, 0, rad * 0.52, rad * 0.40, 0, 0, Math.PI * 2);
      ctx.fill();

      // 6. Anéis Orbitais de Fogo e Plasma
      if (b.isEvolved) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, rad * 1.6, rad * 0.55, spin, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, rad * 1.6, rad * 0.55, -spin, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255, 235, 120, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, rad * 1.35, rad * 0.48, spin, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
      continue;
    }

    if (b.type === 'POTION') {
      // Rastro de vapor e gotículas cáusticas em arco
      if (b.trail && b.trail.length > 0) {
        for (let t = 0; t < b.trail.length; t++) {
          const pt = b.trail[t];
          const tAlpha = (1 - t / b.trail.length) * 0.40;
          ctx.fillStyle = b.isEvolved ? `rgba(162, 155, 254, ${tAlpha})` : `rgba(155, 89, 182, ${tAlpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, (b.radius * 0.65) * (1 - t / b.trail.length * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle || 0);

      const acidCol = b.isEvolved ? '#a29bfe' : '#9b59b6';
      const r = b.radius || 8;

      // Halo luminoso do reagente químico volátil violeta
      ctx.fillStyle = b.isEvolved ? 'rgba(162, 155, 254, 0.32)' : 'rgba(155, 89, 182, 0.32)';
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
      ctx.fill();

      // Vidro exterior do frasco de laboratório (formato cônico / retorta)
      ctx.fillStyle = 'rgba(235, 255, 248, 0.82)';
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, -r * 0.95);
      ctx.lineTo(r * 0.35, -r * 0.95);
      ctx.lineTo(r * 0.35, -r * 0.35);
      ctx.quadraticCurveTo(r * 0.95, -r * 0.05, r * 0.95, r * 0.35);
      ctx.arc(0, r * 0.35, r * 0.95, 0, Math.PI);
      ctx.quadraticCurveTo(-r * 0.95, -r * 0.05, -r * 0.35, -r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Líquido Ácido Fluorescente preenchendo a base
      ctx.fillStyle = acidCol;
      ctx.beginPath();
      ctx.arc(0, r * 0.35, r * 0.78, 0.15, Math.PI - 0.15);
      ctx.closePath();
      ctx.fill();

      // Gargalo de latão e rolha de cortiça
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(-r * 0.42, -r * 0.85, r * 0.84, 2);
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(-r * 0.32, -r * 1.3, r * 0.64, r * 0.5);

      // Reflexo especular no bojo do vidro
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, r * 0.35, r * 0.6, -Math.PI * 0.7, -Math.PI * 0.3);
      ctx.stroke();

      ctx.restore();
      continue;
    }

    if (b.type === 'SWORD') {
      if (b.trail) {
        for (let t = 0; t < b.trail.length; t++) {
          const pt = b.trail[t];
          const tAlpha = (1 - t / b.trail.length) * 0.42;
          ctx.fillStyle = b.isEvolved ? `rgba(241, 196, 15, ${tAlpha})` : `rgba(0, 245, 212, ${tAlpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, b.radius * (1 - t / b.trail.length * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle || 0);

      // Halo translúcido de éter
      ctx.fillStyle = b.isEvolved ? 'rgba(241, 196, 15, 0.35)' : 'rgba(0, 245, 212, 0.35)';
      ctx.beginPath();
      if (b.isEvolved) {
        ctx.moveTo(18, 0);
        ctx.lineTo(-10, -7.5);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-10, 7.5);
      } else {
        ctx.moveTo(14, 0);
        ctx.lineTo(-8, -5.5);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-8, 5.5);
      }
      ctx.closePath();
      ctx.fill();

      // Corpo da Foice Astral em plasma puro
      ctx.fillStyle = b.isEvolved ? '#f1c40f' : '#00cec9';
      ctx.beginPath();
      if (b.isEvolved) {
        ctx.moveTo(16, 0);
        ctx.lineTo(-9, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-9, 6);
      } else {
        ctx.moveTo(12, 0);
        ctx.lineTo(-7, -4.5);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-7, 4.5);
      }
      ctx.closePath();
      ctx.fill();

      // Núcleo incandescente branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -1, 6, 2);
      ctx.restore();
      continue;
    }
  }

  for (let i = 0; i < enemyBullets.length; i++) {
    const eb = enemyBullets[i];
    if (eb.x < viewLeft || eb.x > viewRight || eb.y < viewTop || eb.y > viewBottom) continue;

    const bType = eb.bulletType || 'DEFAULT';
    ctx.save();
    ctx.translate(eb.x, eb.y);

    if (bType === 'TECH') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);
      // Rastro de Plasma Carmesim
      ctx.fillStyle = 'rgba(255, 71, 87, 0.45)';
      ctx.fillRect(-12, -2.5, 16, 5);
      // Núcleo Energético Vermelho
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(-8, -1.8, 12, 3.6);
      // Centro Incandescente
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -1, 7, 2);
      ctx.fillStyle = '#ff6b81';
      ctx.fillRect(4, -1.5, 3, 3);
    } else if (bType === 'FIRE_SHRAPNEL') {
      ctx.rotate(frameCount * 0.18 + eb.x);
      // Rastro de fumaça cinzenta
      ctx.fillStyle = 'rgba(45, 52, 54, 0.4)';
      ctx.beginPath();
      ctx.arc(-8, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Fragmento de Brasa Incandescente
      ctx.fillStyle = '#d35400';
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo(5, -2);
      ctx.lineTo(3, 5);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -1, 2, 2);
    } else if (bType === 'CHAOS') {
      const cPulse = Math.sin(frameCount * 0.25) * 1.5;
      // Halo do Caos Pulsante
      ctx.fillStyle = 'rgba(142, 68, 173, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, eb.radius + 2.5 + cPulse, 0, Math.PI * 2);
      ctx.fill();
      // Núcleo Abissal
      ctx.fillStyle = '#090810';
      ctx.beginPath();
      ctx.arc(0, 0, eb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // Fagulho Orbital
      const fAng = frameCount * 0.15;
      ctx.fillStyle = '#ff7675';
      ctx.fillRect(Math.cos(fAng) * (eb.radius + 1) - 1.5, Math.sin(fAng) * (eb.radius + 1) - 1.5, 3, 3);
    } else if (bType === 'ABYSSAL_BOLT') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);
      // Rastro de Vácuo e Plasma Ciano
      const grad = ctx.createLinearGradient(-16, 0, 8, 0);
      grad.addColorStop(0, 'rgba(142, 68, 173, 0)');
      grad.addColorStop(0.4, 'rgba(142, 68, 173, 0.55)');
      grad.addColorStop(0.8, 'rgba(0, 206, 201, 0.85)');
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(4, -3.5);
      ctx.lineTo(10, 0);
      ctx.lineTo(4, 3.5);
      ctx.closePath();
      ctx.fill();
      // Núcleo Incandescente
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (bType === 'COSMIC_BOLT') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);
      // Cauda Estelar Superaquecida
      ctx.fillStyle = 'rgba(232, 67, 147, 0.45)';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(2, -4);
      ctx.lineTo(8, 0);
      ctx.lineTo(2, 4);
      ctx.closePath();
      ctx.fill();
      // Agulha de Plasma Branco/Ciano
      ctx.strokeStyle = '#81ecec';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (bType === 'VAMPIRE_BAT') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Rastro de fumaça e névoa carmesim
      const tailGrad = ctx.createLinearGradient(-18, 0, 0, 0);
      tailGrad.addColorStop(0, 'rgba(40, 2, 8, 0)');
      tailGrad.addColorStop(0.6, 'rgba(142, 68, 173, 0.4)');
      tailGrad.addColorStop(1, 'rgba(255, 23, 68, 0.7)');
      ctx.fillStyle = tailGrad;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(2, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();

      // Morcego espectral animado (batimento de asas)
      const flap = Math.sin(frameCount * 0.5 + (eb.x * 0.1)) * 6;
      ctx.fillStyle = '#120206';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-2, -9 + flap);
      ctx.lineTo(-5, -2);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-5, 2);
      ctx.lineTo(-2, 9 - flap);
      ctx.closePath();
      ctx.fill();

      // Borda das asas em sangue brilhante
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Olhos vermelhos brilhantes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, -2, 1.5, 1.5);
      ctx.fillRect(3, 1, 1.5, 1.5);
    } else if (bType === 'BLOOD_ORB') {
      const bPulse = Math.sin(frameCount * 0.28 + (eb.x * 0.05)) * 1.8;
      const orbR = eb.radius + bPulse;

      // Halo pulsante exterior
      const haloGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, orbR * 1.8);
      haloGrad.addColorStop(0, 'rgba(255, 0, 85, 0.9)');
      haloGrad.addColorStop(0.4, 'rgba(200, 15, 45, 0.6)');
      haloGrad.addColorStop(0.8, 'rgba(80, 5, 20, 0.3)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(0, 0, orbR * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo denso de sangue carmesim
      ctx.fillStyle = '#200207';
      ctx.beginPath();
      ctx.arc(0, 0, orbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Anel rúnico orbital
      const rAng = frameCount * 0.15;
      ctx.strokeStyle = 'rgba(255, 107, 129, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, orbR * 1.35, orbR * 0.55, rAng, 0, Math.PI * 2);
      ctx.stroke();

      // Ponto especular branco no núcleo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-orbR * 0.35, -orbR * 0.35, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (bType === 'BLOOD_CLAW') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Rastro de corte translúcido
      const cGrad = ctx.createLinearGradient(-16, 0, 10, 0);
      cGrad.addColorStop(0, 'rgba(255, 23, 68, 0)');
      cGrad.addColorStop(0.5, 'rgba(180, 10, 35, 0.65)');
      cGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.quadraticCurveTo(-4, -8, 8, 0);
      ctx.quadraticCurveTo(-4, 8, -16, 0);
      ctx.fill();

      // Lâmina curvada afiada em forma de garra
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-4, -6);
      ctx.quadraticCurveTo(0, 0, -4, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else if (bType === 'BLOOD_DAGGER') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Adaga de cristal de sangue giratória
      const spin = frameCount * 0.22;
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-2, -5 * Math.cos(spin));
      ctx.lineTo(-10, 0);
      ctx.lineTo(-2, 5 * Math.cos(spin));
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Guarda e pomo
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-3, -3.5, 2, 7);
      ctx.fillRect(-11, -1.5, 3, 3);
    } else if (bType === 'SHADOW_ORB') {
      const oPulse = Math.sin(frameCount * 0.2 + (eb.x * 0.05)) * 1.5;
      const orbR = (eb.radius || 6.5) + oPulse;

      // Halo pulsante exterior sombrio
      ctx.fillStyle = 'rgba(155, 89, 182, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, orbR * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo abissal
      ctx.fillStyle = '#1e082b';
      ctx.beginPath();
      ctx.arc(0, 0, orbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Olho / pupila fantasmagórica
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, orbR * 0.7, frameCount * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -1, 2, 2);
    } else if (bType === 'ACID_SPIT') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Rastro de gosma cáustica vermelha
      ctx.fillStyle = 'rgba(255, 71, 87, 0.45)';
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-2, -3.5);
      ctx.lineTo(6, 0);
      ctx.lineTo(-2, 3.5);
      ctx.closePath();
      ctx.fill();

      // Gota ácida escarlate incandescente
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.ellipse(2, 0, 5.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(3, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Projétil Padrão Polido (Ruby Shard)
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(0, 0, eb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d63031';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eb.radius * 0.35, -eb.radius * 0.35, Math.max(1, eb.radius * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (let i = 0; i < dyingEnemies.length; i++) {
    const de = dyingEnemies[i];
    if (de.x >= viewLeft && de.x <= viewRight && de.y >= viewTop && de.y <= viewBottom) {
      drawDyingEnemyShape(de);
    }
  }

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.isBoss || (e.x >= viewLeft && e.x <= viewRight && e.y >= viewTop && e.y <= viewBottom)) {
      drawEnemyShape(e);
    }
  }

  drawPlayerCharacter();
  drawPlayerChestArrows(ctx);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.x >= viewLeft && p.x <= viewRight && p.y >= viewTop && p.y <= viewBottom) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
  }

  if (damageTexts.length > 0) {
    ctx.textAlign = 'center';
    for (let i = 0; i < damageTexts.length; i++) {
      const dtItem = damageTexts[i];
      if (dtItem.x < viewLeft || dtItem.x > viewRight || dtItem.y < viewTop || dtItem.y > viewBottom) continue;
      const alpha = Math.max(0, dtItem.life / dtItem.maxLife);
      ctx.fillStyle = dtItem.color;
      ctx.globalAlpha = alpha;
      ctx.font = dtItem.isCrit ? 'bold 16px sans-serif' : 'bold 12px sans-serif';
      if (dtItem.isCrit) {
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 2.5;
        ctx.strokeText(dtItem.text, dtItem.x, dtItem.y);
      }
      ctx.fillText(dtItem.text, dtItem.x, dtItem.y);
    }
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();

  // 1. Radar Periférico de Minibosses Fora de Tela (Offscreen Threat Radar)
  for (let i = 0; i < enemies.length; i++) {
    const mb = enemies[i];
    if (!mb || !mb.isMiniBoss || mb.hp <= 0) continue;

    const sx = (mb.x - camera.x) * CAMERA_ZOOM;
    const sy = (mb.y - camera.y) * CAMERA_ZOOM;
    const pad = 42;
    const isOffscreen = sx < pad || sx > viewW - pad || sy < pad || sy > viewH - pad;

    if (isOffscreen) {
      const centerX = viewW / 2;
      const centerY = viewH / 2;
      const angle = Math.atan2(sy - centerY, sx - centerX);
      const clampX = Math.max(pad, Math.min(viewW - pad, sx));
      const clampY = Math.max(pad, Math.min(viewH - pad, sy));
      const pulse = Math.sin(frameCount * 0.2) * 3;
      const arrowColor = mb.color || '#f39c12';

      ctx.save();
      ctx.translate(clampX, clampY);
      ctx.rotate(angle);

      // Seta indicadora de ameaça com pulso
      ctx.fillStyle = arrowColor;
      ctx.beginPath();
      ctx.moveTo(10 + pulse, 0);
      ctx.lineTo(-8, -9);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 9);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ponto de alerta
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-1, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Radar Periférico de Baús de Miniboss e Boss Fora de Tela
  drawOffscreenChestRadar(ctx);

  // 2. Banner Cinematográfico de Transição de Onda (In-Game Wave Announcement)
  if (waveAnnouncement && waveAnnouncement.timer > 0) {
    const maxT = waveAnnouncement.maxTimer || 180;
    const progress = 1 - (waveAnnouncement.timer / maxT);
    let alpha = 1.0;
    if (progress < 0.15) {
      alpha = progress / 0.15;
    } else if (progress > 0.82) {
      alpha = Math.max(0, (1 - progress) / 0.18);
    }

    const isCompactH = layoutMetrics.isCompactHeight || viewH < 520;
    const hudBottom = getHudBottom();
    const bannerW = Math.min(560, Math.floor(viewW * 0.92));
    const bannerH = isCompactH ? 42 : 52;
    const bx = (viewW - bannerW) / 2;
    
    // Ancoragem dinâmica: SEMPRE abaixo da base do HUD com margem de segurança garantida
    const safeTop = hudBottom + (isCompactH ? 8 : 14);
    const by = Math.max(safeTop, Math.floor(viewH * (isCompactH ? 0.12 : 0.15)));

    ctx.save();
    ctx.globalAlpha = alpha;

    // Fundo do Banner Gótico Sombrio com bordas translúcidas
    const bgGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
    bgGrad.addColorStop(0, 'rgba(10, 12, 16, 0)');
    bgGrad.addColorStop(0.18, 'rgba(14, 18, 28, 0.92)');
    bgGrad.addColorStop(0.82, 'rgba(14, 18, 28, 0.92)');
    bgGrad.addColorStop(1, 'rgba(10, 12, 16, 0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(bx, by, bannerW, bannerH);

    // Linhas de friso douradas superior e inferior
    const borderGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
    borderGrad.addColorStop(0, 'rgba(241, 196, 15, 0)');
    borderGrad.addColorStop(0.25, 'rgba(241, 196, 15, 0.85)');
    borderGrad.addColorStop(0.5, 'rgba(255, 234, 167, 1)');
    borderGrad.addColorStop(0.75, 'rgba(241, 196, 15, 0.85)');
    borderGrad.addColorStop(1, 'rgba(241, 196, 15, 0)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bannerW, by);
    ctx.moveTo(bx, by + bannerH);
    ctx.lineTo(bx + bannerW, by + bannerH);
    ctx.stroke();

    // Texto Centralizado com Auto-Scaling
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Rótulo Principal da Horda com redução dinâmica de fonte
    let fontSize = isCompactH ? 14 : 18;
    const waveTitle = (waveAnnouncement.name || '').toUpperCase();
    const titleText = `⚜ ${waveTitle} ⚜`;
    
    ctx.font = `bold ${fontSize}px "Cinzel", "Cinzel Decorative", Georgia, serif`;
    let textWidth = ctx.measureText(titleText).width;
    const maxTextWidth = bannerW - 32;

    while (textWidth > maxTextWidth && fontSize > 11) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px "Cinzel", "Cinzel Decorative", Georgia, serif`;
      textWidth = ctx.measureText(titleText).width;
    }

    ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = 'rgba(241, 196, 15, 0.65)';
    ctx.shadowBlur = 10;
    const titleY = by + (isCompactH ? 15 : 20);
    ctx.fillText(titleText, viewW / 2, titleY);

    // Subtítulo descritivo
    if (!isCompactH || viewH > 370) {
      ctx.font = 'italic 10.5px sans-serif';
      ctx.fillStyle = '#dfe4ea';
      ctx.shadowBlur = 0;
      ctx.fillText("Sobreviva à maré crescente de horrores", viewW / 2, by + (isCompactH ? 29 : 37));
    }

    ctx.restore();
  }

  if (stick.active) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(stick.startX, stick.startY, stick.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(stick.curX, stick.curY, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Overlay Cósmico de Vitória do Boss Final (Banner Dourado + Fade-Out da Tela)
  // Renderizado na camada superior absoluta para que nunca seja sobreposto pelo jogador ou projéteis
  const sovereignBoss = (activeBoss && activeBoss.bossId === 4) 
    ? activeBoss 
    : enemies.find(en => en && en.bossId === 4);
  if (sovereignBoss && (sovereignBoss.showGoldenBanner || sovereignBoss.fadeAlpha > 0)) {
    drawBossVictoryOverlay(ctx, sovereignBoss, frameCount);
  }

  // 4. Barras Pretas de Cinema (Letterbox) durante a intro do Boss
  if (cinematicCamera && cinematicCamera.letterboxProgress > 0.005) {
    const barHeight = Math.floor(viewH * 0.11 * cinematicCamera.letterboxProgress);
    ctx.fillStyle = '#000000';
    // Barra Superior
    ctx.fillRect(0, 0, viewW, barHeight);
    // Barra Inferior
    ctx.fillRect(0, viewH - barHeight, viewW, barHeight);

    // Friso dourado gótico na borda interna das barras
    ctx.strokeStyle = `rgba(241, 196, 15, ${0.65 * cinematicCamera.letterboxProgress})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, barHeight);
    ctx.lineTo(viewW, barHeight);
    ctx.moveTo(0, viewH - barHeight);
    ctx.lineTo(viewW, viewH - barHeight);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renderiza o sistema de setas direcionais místicas que emanam do herói apontando
 * com precisão matemática para os baús dropados por Minibosses e Bosses.
 * - Seta Azul Safira / Ciano Etéreo para baú de Miniboss.
 * - Seta Dourada Rúnica Imperial para baú de Boss.
 * - Inclui feixe pulsante de energia saindo do perímetro do herói e fade-out de proximidade.
 */
function drawPlayerChestArrows(ctx) {
  if (!chests || chests.length === 0 || !player) return;

  for (let i = 0; i < chests.length; i++) {
    const ch = chests[i];
    const dx = ch.x - player.x;
    const dy = ch.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0) continue;

    // Fade-out suave quando o jogador se aproxima do baú (< 70px)
    const proximityAlpha = Math.max(0, Math.min(1, (dist - 40) / 30));
    if (proximityAlpha <= 0) continue;

    const angle = Math.atan2(dy, dx);
    const isMini = ch.tier === 'MINI_BOSS';

    const primaryColor = isMini ? '#00cec9' : '#f1c40f';
    const glowColor = isMini ? 'rgba(0, 206, 201, 0.85)' : 'rgba(241, 196, 15, 0.9)';
    const trailAlpha = (0.55 + Math.sin(frameCount * 0.12) * 0.25) * proximityAlpha;

    // 1. Feixe de Luz Místico saindo do jogador em direção ao baú
    ctx.save();
    const startR = 18;
    const orbitR = 44 + Math.sin(frameCount * 0.15) * 3.5;
    const x1 = player.x + Math.cos(angle) * startR;
    const y1 = player.y + Math.sin(angle) * startR;
    const x2 = player.x + Math.cos(angle) * (orbitR - 6);
    const y2 = player.y + Math.sin(angle) * (orbitR - 6);

    const beamGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    beamGrad.addColorStop(0.4, isMini ? 'rgba(9, 132, 227, 0.45)' : 'rgba(230, 126, 34, 0.45)');
    beamGrad.addColorStop(0.85, primaryColor);
    beamGrad.addColorStop(1, '#ffffff');

    ctx.strokeStyle = beamGrad;
    ctx.lineWidth = isMini ? 2.2 : 2.8;
    ctx.lineCap = 'round';
    ctx.globalAlpha = trailAlpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();

    // 2. Seta Rúnica em Formato de Lança / Chevron na Órbita
    ctx.save();
    const arrowX = player.x + Math.cos(angle) * orbitR;
    const arrowY = player.y + Math.sin(angle) * orbitR;
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);
    ctx.globalAlpha = (0.9 + Math.sin(frameCount * 0.18) * 0.1) * proximityAlpha;

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isMini ? 9 : 14;

    // Corpo pontiagudo da seta
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(11, 0);       // Ponta frontal
    ctx.lineTo(-7, -7);      // Aresta superior
    ctx.lineTo(-3, 0);       // Chanfro traseiro
    ctx.lineTo(-7, 7);       // Aresta inferior
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Runa central de navegação
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-1, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Radar Periférico na Borda da Tela para Baús Fora de Campo (Offscreen).
 * Exibe seta direcional na borda, badge estilizado e distância em metros até o baú.
 */
function drawOffscreenChestRadar(ctx) {
  if (!chests || chests.length === 0 || !player) return;

  for (let i = 0; i < chests.length; i++) {
    const ch = chests[i];
    const sx = (ch.x - camera.x) * CAMERA_ZOOM;
    const sy = (ch.y - camera.y) * CAMERA_ZOOM;
    const pad = 46;
    const isOffscreen = sx < pad || sx > viewW - pad || sy < pad || sy > viewH - pad;

    if (!isOffscreen) continue;

    const centerX = viewW / 2;
    const centerY = viewH / 2;
    const angle = Math.atan2(sy - centerY, sx - centerX);
    const clampX = Math.max(pad, Math.min(viewW - pad, sx));
    const clampY = Math.max(pad, Math.min(viewH - pad, sy));
    const isMini = ch.tier === 'MINI_BOSS';

    const primaryColor = isMini ? '#00cec9' : '#f1c40f';
    const glowColor = isMini ? 'rgba(0, 206, 201, 0.85)' : 'rgba(241, 196, 15, 0.9)';
    const pulse = Math.sin(frameCount * 0.16) * 3;

    const dx = ch.x - player.x;
    const dy = ch.y - player.y;
    const distMeters = Math.max(1, Math.round(Math.hypot(dx, dy) / 22));

    ctx.save();
    ctx.translate(clampX, clampY);

    // Seta periférica apontando para fora
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isMini ? 8 : 12;

    ctx.beginPath();
    ctx.moveTo(12 + pulse, 0);
    ctx.lineTo(-7, -8);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();

    // Etiqueta com Distância Rúnica
    const textLabel = `${distMeters}m`;
    ctx.font = 'bold 10px Outfit, sans-serif';
    const textW = ctx.measureText(textLabel).width;
    const badgeW = textW + 14;
    const badgeH = 16;

    const badgeOffsetX = -Math.cos(angle) * 22;
    const badgeOffsetY = -Math.sin(angle) * 22;

    ctx.save();
    ctx.translate(badgeOffsetX, badgeOffsetY);
    ctx.fillStyle = 'rgba(10, 14, 22, 0.88)';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textLabel, 0, 1);
    ctx.restore();

    ctx.restore();
  }
}