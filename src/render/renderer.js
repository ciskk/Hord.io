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
import {
  ctx,
  dpr,
  viewW,
  viewH,
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
  frameCount
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
  ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

  renderEnvironment(ctx);

  const pad = 60;
  const viewLeft = camera.x - pad;
  const viewRight = camera.x + viewW + pad;
  const viewTop = camera.y - pad;
  const viewBottom = camera.y + viewH + pad;

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

  for (let i = 0; i < gems.length; i++) {
    const g = gems[i];
    if (g.x < viewLeft || g.x > viewRight || g.y < viewTop || g.y > viewBottom) continue;
    ctx.save();
    let pulse = 0;
    if (g.isSuper) {
      pulse = Math.sin(frameCount * 0.16 + (g.pulseOffset || 0)) * 2.2;
      ctx.fillStyle = 'rgba(224, 86, 253, 0.32)';
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius + 6 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = g.color || (g.isSuper ? '#e056fd' : '#00d2d3');
    ctx.beginPath();
    ctx.arc(g.x, g.y, Math.max(2, g.radius + pulse), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(g.x - g.radius * 0.3, g.y - g.radius * 0.3, Math.max(1, g.radius * 0.28), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Renderização das poças ativas no solo (Ácido / Alquimia / Fogo)
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

    ctx.save();
    // Opacidade base 50% mais translúcida para Valéria (0.28), atenuada linearmente por globalAlpha
    const baseAlpha = p.isAlchemist ? 0.28 : 0.60;
    ctx.globalAlpha = baseAlpha * fadeProgress;

    if (p.isFire) {
      ctx.fillStyle = '#e67e22';
      ctx.strokeStyle = '#e74c3c';
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
      ctx.fillStyle = p.isFire ? '#f39c12' : (p.isEvolved ? '#e0ffff' : '#a8e6cf');
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(0.5, (2.2 + Math.sin(frameCount * 0.2 + b) * 1.2) * shrinkFactor), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Renderização precisa dos telégrafos de chefes (cones, faixas, crateras de queda e fissuras)
  for (let i = 0; i < bossTelegraphs.length; i++) {
    const t = bossTelegraphs[i];
    const maxT = (t.maxTimer && t.maxTimer > 0) ? t.maxTimer : (t.timer || 1);
    const rawProgress = 1 - (t.timer / maxT);
    const progress = isNaN(rawProgress) ? 1 : Math.max(0, Math.min(1, rawProgress));
    ctx.save();

    if (t.type === 'SCYTHE_CLEAVE') {
      const arcHalf = Math.PI * 0.52;
      const startAng = t.angle - arcHalf;
      const endAng = t.angle + arcHalf;
      const rgbCol = t.colorRgb || '0, 206, 201';
      const hexCol = t.color || '#00cec9';

      ctx.fillStyle = `rgba(${rgbCol}, 0.12)`;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, t.radius, startAng, endAng);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(${rgbCol}, 0.55)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x + Math.cos(startAng) * t.radius, t.y + Math.sin(startAng) * t.radius);
      ctx.arc(t.x, t.y, t.radius, startAng, endAng);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();

      ctx.fillStyle = `rgba(${rgbCol}, ${0.22 + progress * 0.45})`;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, t.radius * progress, startAng, endAng);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : hexCol;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * progress, startAng, endAng);
      ctx.stroke();
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
    } else {
      const isTeleport = t.type === 'VAMPIRE_TELEPORT';
      const baseCol = isTeleport ? '#8e44ad' : '#e74c3c';

      ctx.fillStyle = isTeleport ? 'rgba(142, 68, 173, 0.12)' : 'rgba(231, 76, 60, 0.12)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isTeleport ? 'rgba(142, 68, 173, 0.65)' : 'rgba(231, 76, 60, 0.65)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isTeleport ? `rgba(142, 68, 173, ${0.2 + progress * 0.45})` : `rgba(231, 76, 60, ${0.2 + progress * 0.45})`;
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

  // Renderização visual das ondas de choque em expansão
  for (let i = 0; i < bossShockwaves.length; i++) {
    const sw = bossShockwaves[i];
    const alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
    ctx.save();
    const swColor = sw.colorRgb || (activeBoss && activeBoss.bossId === 3 ? '0, 206, 201' : '230, 126, 34');
    ctx.strokeStyle = `rgba(${swColor}, ${alpha * 0.85})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < bossProjectiles.length; i++) {
    const bp = bossProjectiles[i];
    ctx.save();
    ctx.translate(bp.x, bp.y);
    ctx.rotate(bp.angle);

    if (bp.type === 'SOUL_SCYTHE') {
      const scytheColor = bp.color || '#00cec9';
      ctx.strokeStyle = scytheColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, bp.radius, -Math.PI * 0.4, Math.PI * 0.75);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, bp.radius * 0.85, -Math.PI * 0.2, Math.PI * 0.5);
      ctx.stroke();

      ctx.fillStyle = '#1e272e';
      ctx.fillRect(-2, -bp.radius * 0.65, 4, bp.radius * 1.3);

      ctx.fillStyle = scytheColor;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
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
      const shockR = b.radius * (0.35 + progress * 0.65);

      ctx.save();
      ctx.translate(b.x, b.y);

      // 1. Anel Sísmico 360° com Fendas Douradas e Radiação Sacra
      ctx.strokeStyle = b.isEvolved ? `rgba(230, 126, 34, ${alpha * 0.55})` : `rgba(241, 196, 15, ${alpha * 0.45})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, shockR * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      // Cone de Projeção Tectônica Frontal
      ctx.fillStyle = b.isEvolved ? `rgba(230, 126, 34, ${alpha * 0.35})` : `rgba(241, 196, 15, ${alpha * 0.28})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, shockR * 1.25, b.angle - Math.PI * 0.32, b.angle + Math.PI * 0.32);
      ctx.closePath();
      ctx.fill();

      // Bordô Incandescente de Ruptura
      ctx.strokeStyle = b.isEvolved ? `rgba(255, 234, 167, ${alpha * 0.95})` : `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, shockR * 1.25, b.angle - Math.PI * 0.32, b.angle + Math.PI * 0.32);
      ctx.stroke();

      // 2. Fissura Sísmica Central Tridimensional
      const mainCrackLen = shockR * 1.35;
      const perpX = -Math.sin(b.angle);
      const perpY = Math.cos(b.angle);
      const seg1X = Math.cos(b.angle) * (mainCrackLen * 0.35) + perpX * 8;
      const seg1Y = Math.sin(b.angle) * (mainCrackLen * 0.35) + perpY * 8;
      const seg2X = Math.cos(b.angle) * (mainCrackLen * 0.70) - perpX * 10;
      const seg2Y = Math.sin(b.angle) * (mainCrackLen * 0.70) - perpY * 10;
      const tipX = Math.cos(b.angle) * mainCrackLen;
      const tipY = Math.sin(b.angle) * mainCrackLen;

      // Profundidade da Fenda
      ctx.strokeStyle = '#1e130c';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(seg1X, seg1Y);
      ctx.lineTo(seg2X, seg2Y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Núcleo de Fogo e Luz Sacra na Fratura
      ctx.strokeStyle = b.isEvolved ? `rgba(243, 156, 18, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(seg1X, seg1Y);
      ctx.lineTo(seg2X, seg2Y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Ramificações Laterais
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = b.isEvolved ? `rgba(230, 126, 34, ${alpha * 0.85})` : `rgba(241, 196, 15, ${alpha * 0.85})`;
      ctx.beginPath();
      ctx.moveTo(seg1X, seg1Y);
      ctx.lineTo(seg1X + Math.cos(b.angle + 0.55) * 26, seg1Y + Math.sin(b.angle + 0.55) * 26);
      ctx.moveTo(seg2X, seg2Y);
      ctx.lineTo(seg2X + Math.cos(b.angle - 0.55) * 30, seg2Y + Math.sin(b.angle - 0.55) * 30);
      ctx.stroke();

      // 3. Geysers de Luz Sagrada Brotos das Fendas
      if (progress > 0.25) {
        const geyserAlpha = Math.sin((progress - 0.25) / 0.75 * Math.PI) * alpha;
        ctx.fillStyle = `rgba(255, 255, 255, ${geyserAlpha * 0.85})`;
        ctx.fillRect(seg1X - 2, seg1Y - 14, 4, 14);
        ctx.fillRect(seg2X - 2, seg2Y - 18, 4, 18);
        ctx.fillRect(tipX - 2, tipY - 22, 4, 22);

        ctx.fillStyle = b.isEvolved ? `rgba(243, 156, 18, ${geyserAlpha * 0.6})` : `rgba(241, 196, 15, ${geyserAlpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(seg1X, seg1Y - 12, 6, 0, Math.PI * 2);
        ctx.arc(seg2X, seg2Y - 16, 7, 0, Math.PI * 2);
        ctx.arc(tipX, tipY - 20, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Cinemática de Balanço, Arco de Luz e Impacto do Martelo
      if (progress < 0.65) {
        const slamPhase = Math.min(1, progress / 0.38);
        const swingAng = b.angle + (1 - Math.pow(slamPhase, 2)) * -1.25;
        const forwardReach = 20 + slamPhase * 16;
        const hammerX = Math.cos(b.angle) * forwardReach;
        const hammerY = Math.sin(b.angle) * forwardReach;

        // Faixa em Arco de Luz Sagrada (Motion Ribbon do Swing)
        if (slamPhase < 0.95) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - slamPhase) * 0.85})`;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.arc(0, 0, forwardReach + 10, swingAng - 0.5, swingAng + 0.3);
          ctx.stroke();

          ctx.strokeStyle = `rgba(241, 196, 15, ${(1 - slamPhase) * 0.6})`;
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.arc(0, 0, forwardReach + 10, swingAng - 0.7, swingAng + 0.2);
          ctx.stroke();
        }

        // Micro-vibração de impacto
        const microShake = (slamPhase >= 1.0 && progress < 0.58) ? (Math.random() - 0.5) * 3 : 0;

        // Desenho Fiel do Martelo Sagrado Titânico
        ctx.save();
        ctx.translate(hammerX + microShake, hammerY + microShake);
        ctx.rotate(swingAng + Math.PI / 2);

        // Cabo de carvalho com amarras cruzadas
        ctx.fillStyle = '#3d271d';
        ctx.fillRect(-3, -2, 6, 42);
        ctx.strokeStyle = '#1e130c';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let st = 4; st <= 36; st += 7) {
          ctx.moveTo(-3, st); ctx.lineTo(3, st + 4);
        }
        ctx.stroke();

        // Pomo inferior
        ctx.fillStyle = '#57606f';
        ctx.fillRect(-4, 40, 8, 3.5);

        // Colar e cabeça de guerra
        ctx.fillStyle = '#2f3640';
        ctx.fillRect(-4.5, -6, 9, 8);

        // Bloco principal de ferro forjado
        ctx.fillStyle = b.isEvolved ? '#d35400' : '#57606f';
        ctx.fillRect(-18, -25, 36, 20);
        ctx.strokeStyle = '#2f3640';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(-18, -25, 36, 20);

        // Faixas e placas biseladas em ouro sagrado
        ctx.fillStyle = b.isEvolved ? '#f39c12' : '#f1c40f';
        ctx.fillRect(-19, -23, 38, 4);
        ctx.fillRect(-19, -13, 38, 4);
        ctx.fillRect(-4, -25, 8, 20);

        // Runa central radiante
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -18, 4, 6);

        // Espigão superior perfurante
        ctx.fillStyle = '#dcdde1';
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(5, -25);
        ctx.lineTo(-5, -25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      continue;
    }

    if (b.x < viewLeft || b.x > viewRight || b.y < viewTop || b.y > viewBottom) continue;

    if (b.type === 'STAFF') {
      // Rastro Térmico Contínuo (Comet Tail Ribbon)
      if (b.trail) {
        for (let t = 0; t < b.trail.length; t++) {
          const pt = b.trail[t];
          const tProgress = t / b.trail.length;
          const tAlpha = (1 - tProgress) * 0.55;
          const tR = b.radius * (1 - tProgress * 0.65);

          // Camada externa alaranjada
          ctx.fillStyle = b.isEvolved 
            ? `rgba(231, 76, 60, ${tAlpha * 0.5})` 
            : `rgba(230, 126, 34, ${tAlpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, tR * 1.4, 0, Math.PI * 2);
          ctx.fill();

          // Núcleo interno dourado
          ctx.fillStyle = `rgba(241, 196, 15, ${tAlpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, tR * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle || 0);

      const rad = b.radius;
      const spin = frameCount * 0.25;

      // 1. Halo Flamejante com Línguas de Fogo Espirais
      ctx.fillStyle = b.isEvolved ? 'rgba(231, 76, 60, 0.4)' : 'rgba(230, 126, 34, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, rad * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Manto de Fogo Solar
      ctx.fillStyle = b.isEvolved ? '#e74c3c' : '#e67e22';
      ctx.beginPath();
      ctx.moveTo(rad * 1.4, 0);
      ctx.quadraticCurveTo(0, -rad * 1.1, -rad * 1.2, 0);
      ctx.quadraticCurveTo(0, rad * 1.1, rad * 1.4, 0);
      ctx.closePath();
      ctx.fill();

      // 3. Manto Interno Incandescente Amarelo-Ouro
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.ellipse(0, 0, rad * 0.9, rad * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Núcleo Concentrado de Plasma Branco Solar
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(rad * 0.15, 0, rad * 0.45, rad * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. Se Evoluído: Anéis Rúnicos Astrais Cruzados em Rotação Contínua
      if (b.isEvolved) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, rad * 1.6, rad * 0.5, spin, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(241, 196, 15, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, rad * 1.6, rad * 0.5, -spin, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Coroa orbital simples de faíscas
        ctx.strokeStyle = 'rgba(255, 234, 167, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, rad * 1.2, spin, spin + Math.PI);
        ctx.stroke();
      }

      ctx.restore();
      continue;
    }

    if (b.type === 'POTION') {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle || 0);
      ctx.fillStyle = '#d35400';
      ctx.fillRect(-2.5, -9, 5, 3);
      ctx.fillStyle = b.isEvolved ? '#00cec9' : '#2ecc71';
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    if (b.type === 'SWORD') {
      if (b.trail) {
        for (let t = 0; t < b.trail.length; t++) {
          const pt = b.trail[t];
          const tAlpha = (1 - t / b.trail.length) * 0.35;
          ctx.fillStyle = b.isEvolved ? `rgba(241, 196, 15, ${tAlpha})` : `rgba(46, 204, 113, ${tAlpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, b.radius * (1 - t / b.trail.length * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle || 0);
      ctx.fillStyle = b.isEvolved ? '#f1c40f' : '#2ecc71';
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
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -1, 6, 2);
      ctx.restore();
      continue;
    }
  }

  for (let i = 0; i < enemyBullets.length; i++) {
    const eb = enemyBullets[i];
    if (eb.x < viewLeft || eb.x > viewRight || eb.y < viewTop || eb.y > viewBottom) continue;
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d63031';
    ctx.lineWidth = 1.5;
    ctx.stroke();
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

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.x >= viewLeft && p.x <= viewRight && p.y >= viewTop && p.y <= viewBottom) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
  }

  for (let i = 0; i < damageTexts.length; i++) {
    const dtItem = damageTexts[i];
    if (dtItem.x < viewLeft || dtItem.x > viewRight || dtItem.y < viewTop || dtItem.y > viewBottom) continue;
    const alpha = Math.max(0, dtItem.life / dtItem.maxLife);
    ctx.save();
    ctx.fillStyle = dtItem.color;
    ctx.globalAlpha = alpha;
    ctx.font = dtItem.isCrit ? 'bold 16px sans-serif' : 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    if (dtItem.isCrit) {
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 2.5;
      ctx.strokeText(dtItem.text, dtItem.x, dtItem.y);
    }
    ctx.fillText(dtItem.text, dtItem.x, dtItem.y);
    ctx.restore();
  }

  ctx.restore();

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

  ctx.restore();
}