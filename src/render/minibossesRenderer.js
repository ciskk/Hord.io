/**
 * src/render/minibossesRenderer.js
 * 
 * Módulo especializado na renderização procedural dos 16 arquétipos de Minibosses
 * e do glifo de solo de alta ameaça rúnica.
 * 
 * Conta com física visual procedural (capas com curvas de Bézier, fumaça espectral,
 * pistões hidráulicos, asas bi-articuladas, discos de acreção cósmicos e rastreamento
 * ocular dinâmico), mantendo 60 FPS no Canvas 2D sem alocação no loop de renderização.
 */
import { ctx, frameCount } from '../main.js';
import { player } from '../entities/player.js';

/**
 * Glifo de Ameaça Rúnico de solo desenhado sob os pés do Miniboss.
 * @param {number} R Raio de colisão do monstro
 * @param {string} color Cor base/elite do monstro
 * @param {boolean} isHit Flag indicando se está em flash de dano
 * @param {boolean} isEnraged Flag indicando se o monstro está em fúria
 */
export function drawThreatGlyph(R, color, isHit, isEnraged) {
  const glyphPulse = Math.sin(frameCount * 0.12) * 2.5;
  const glyphCol = isHit ? '#ffffff' : (isEnraged ? '#ff4757' : color);

  ctx.save();
  // Brilho suave sob o glifo
  ctx.fillStyle = isEnraged ? 'rgba(231, 76, 60, 0.08)' : 'rgba(243, 156, 18, 0.05)';
  ctx.beginPath();
  ctx.ellipse(0, R * 0.82, R * 1.35 + glyphPulse, R * 0.5 + glyphPulse * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Anel Externo Principal
  ctx.strokeStyle = glyphCol;
  ctx.lineWidth = isEnraged ? 2.4 : 1.8;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.82, R * 1.32 + glyphPulse, R * 0.48 + glyphPulse * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Anel Interno Fino Concêntrico
  ctx.strokeStyle = isEnraged ? 'rgba(255, 71, 87, 0.45)' : 'rgba(241, 196, 15, 0.35)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.82, R * 0.95 + glyphPulse * 0.6, R * 0.34 + glyphPulse * 0.2, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 8 Marcadores Rúnicos Orbitais no Perímetro
  const count = isEnraged ? 8 : 6;
  const rot = frameCount * (isEnraged ? 0.045 : 0.025);
  ctx.lineWidth = isEnraged ? 2.2 : 1.6;
  for (let i = 0; i < count; i++) {
    const a = rot + (i * Math.PI * 2) / count;
    const gx = Math.cos(a) * (R * 1.32 + glyphPulse);
    const gy = R * 0.82 + Math.sin(a) * (R * 0.48 + glyphPulse * 0.35);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.cos(a) * 4.5, gy + Math.sin(a) * 2.8);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renderizador Procedural Modular dos 16 Minibosses por Arquétipo.
 * O contexto Canvas já está centrado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do Miniboss
 */
export function drawMiniBossShape(e) {
  const R = e.radius;
  const isHit = e.hitFlash > 0;
  const isEnraged = !!e.enraged;
  const eliteColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (e.color || '#f39c12'));

  drawThreatGlyph(R, eliteColor, isHit, isEnraged);

  switch (e.baseType) {
    // =========================================================================
    // 1. ZOMBI ALFA (ZOMBIE_ALPHA) - Coluna exposta, bíceps hipertrofiados e bile
    // =========================================================================
    case 'ZOMBIE_ALPHA': {
      const stepBob = Math.sin(frameCount * 0.14) * 3;
      const armSwing = Math.sin(frameCount * 0.14) * 6;
      const skinColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (isEnraged ? '#15241b' : '#1e392a'));
      const skinShade = isHit ? '#ffffff' : (isEnraged ? '#0d1812' : '#14271c');
      const veinColor = isHit ? '#ffffff' : (isEnraged ? '#ff4757' : '#2ecc71');
      const boneColor = isHit ? '#ffffff' : '#dfe4ea';

      // 1. Tronco Curvado e Corcunda Muscular
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.moveTo(-R * 0.9, -R * 0.4 + stepBob);
      ctx.quadraticCurveTo(0, -R * 0.55 + stepBob, R * 0.85, -R * 0.35 + stepBob);
      ctx.lineTo(R * 0.6, R * 0.7 + stepBob);
      ctx.lineTo(-R * 0.6, R * 0.7 + stepBob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = skinShade;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // 2. Coluna Vertebral Exposta no Dorso (5 Vértebras Ósseas)
      ctx.fillStyle = boneColor;
      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 1.2;
      for (let v = 0; v < 5; v++) {
        const vy = -R * 0.35 + v * (R * 0.22) + stepBob;
        const vx = -R * 0.65 + Math.sin(v * 0.8) * 3;
        ctx.beginPath();
        ctx.ellipse(vx, vy, 4.5, 3.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // 3. Feixes de Veias Pulsantes com Ritmo Cardíaco
      const pulseRate = isEnraged ? 0.35 : 0.18;
      const veinWidth = isEnraged ? 3.0 : 2.0;
      ctx.strokeStyle = veinColor;
      ctx.lineWidth = veinWidth;
      ctx.beginPath();
      ctx.moveTo(-R * 0.4, -R * 0.15 + stepBob);
      ctx.lineTo(-R * 0.1, R * 0.15 + stepBob);
      ctx.lineTo(R * 0.25, -R * 0.05 + stepBob);
      ctx.lineTo(R * 0.5, R * 0.35 + stepBob);
      ctx.stroke();

      // 4. Cabeça Massiva com Mandíbula Caída
      ctx.fillStyle = skinShade;
      ctx.beginPath();
      ctx.arc(R * 0.25, -R * 0.6 + stepBob, R * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a140d';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Mandíbula e Dentes Amarelados
      ctx.fillStyle = '#0a140d';
      ctx.beginPath();
      ctx.rect(R * 0.2, -R * 0.48 + stepBob, R * 0.35, 6.5);
      ctx.fill();
      ctx.fillStyle = '#f1f2f6';
      ctx.fillRect(R * 0.26, -R * 0.48 + stepBob, 2.5, 4);
      ctx.fillRect(R * 0.36, -R * 0.48 + stepBob, 2.5, 4);
      ctx.fillRect(R * 0.46, -R * 0.48 + stepBob, 2.5, 4);

      // Olho Único em Fenda Néon
      ctx.fillStyle = isEnraged ? '#ff1744' : '#ff3838';
      ctx.fillRect(R * 0.32, -R * 0.7 + stepBob, isEnraged ? 6.5 : 5.0, 4.0);

      // Gotejamento de Bile Ácida Verde
      ctx.fillStyle = '#2ecc71';
      for (let d = 0; d < 3; d++) {
        const dropY = -R * 0.4 + ((frameCount * 1.8 + d * 14) % 24);
        const dropAlpha = 1 - (((frameCount * 1.8 + d * 14) % 24) / 24);
        ctx.save();
        ctx.globalAlpha = dropAlpha;
        ctx.beginPath();
        ctx.arc(R * 0.38 + d * 3, dropY + stepBob, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Efeito Visual de Rugido (HOWL)
      if (e.actionState === 'WINDUP' && e.currentSkill === 'HOWL') {
        const howlWave = (frameCount * 0.2) % 1;
        ctx.strokeStyle = `rgba(46, 204, 113, ${1 - howlWave})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(R * 0.4, -R * 0.58 + stepBob, 12 + howlWave * 30, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
      }

      // 5. Braços e Garras com Poses de Bote (POUNCE)
      const isPouncing = e.currentSkill === 'POUNCE' && (e.actionState === 'WINDUP' || e.actionState === 'STRIKE');
      const armLift = isPouncing ? -R * 0.55 : armSwing;

      const f1X = R * 0.85;
      const f1Y = R * 0.2 + armLift + stepBob;
      const f2X = -R * 0.85;
      const f2Y = R * 0.2 - armLift + stepBob;

      ctx.fillStyle = skinColor;
      ctx.strokeStyle = skinShade;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(f1X, f1Y, R * 0.38, 0, Math.PI * 2);
      ctx.arc(f2X, f2Y, R * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Garras Triplas Recurvadas
      ctx.strokeStyle = isHit ? '#ffffff' : (isEnraged ? '#ff6b81' : '#ced6e0');
      ctx.lineWidth = 2.8;
      for (let g = -1; g <= 1; g++) {
        const gx1 = f1X + g * 5;
        const gy1 = f1Y + R * 0.2;
        ctx.beginPath();
        ctx.moveTo(gx1, gy1);
        ctx.lineTo(gx1 + 3, gy1 + R * 0.4);
        ctx.stroke();

        const gx2 = f2X + g * 5;
        const gy2 = f2Y + R * 0.2;
        ctx.beginPath();
        ctx.moveTo(gx2, gy2);
        ctx.lineTo(gx2 - 3, gy2 + R * 0.4);
        ctx.stroke();
      }
      break;
    }

    // =========================================================================
    // 2. CENTURIÃO DA GUARDA (PHALANX_LEADER) - Capa romana, pavês com brasão e lança
    // =========================================================================
    case 'PHALANX_LEADER': {
      const step = Math.sin(frameCount * 0.12) * 2;
      const steelCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#57606f');
      const steelDark = isHit ? '#ffffff' : '#2f3542';
      const goldTrim = isHit ? '#ffffff' : (isEnraged ? '#e74c3c' : '#f1c40f');
      const capeWave = Math.sin(frameCount * 0.15) * 5;

      // 1. Capa Romana Esfarrapada (Paludamentum) Balançando
      ctx.fillStyle = isHit ? '#ffffff' : (isEnraged ? '#781515' : '#8b0000');
      ctx.beginPath();
      ctx.moveTo(-R * 0.5, -R * 0.4 + step);
      ctx.quadraticCurveTo(-R * 1.1, -R * 0.1 + capeWave, -R * 1.35, R * 0.7 + capeWave);
      ctx.lineTo(-R * 0.8, R * 0.8 + step);
      ctx.quadraticCurveTo(-R * 0.6, R * 0.2, -R * 0.4, -R * 0.2 + step);
      ctx.closePath();
      ctx.fill();

      // 2. Lança Imperial de Cerco (SPEAR_THRUST)
      const isThrusting = (e.currentSkill === 'SPEAR_THRUST' && e.actionState === 'STRIKE');
      const spearReach = isThrusting ? R * 2.3 : R * 1.4;

      ctx.strokeStyle = isHit ? '#ffffff' : '#dfe4ea';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-R * 0.2, -R * 0.1 + step);
      ctx.lineTo(spearReach, -R * 0.45 + step);
      ctx.stroke();

      // Ponta de Lança Dourada com Barbela
      ctx.fillStyle = goldTrim;
      ctx.beginPath();
      ctx.moveTo(spearReach + R * 0.25, -R * 0.45 + step);
      ctx.lineTo(spearReach - R * 0.15, -R * 0.62 + step);
      ctx.lineTo(spearReach - R * 0.05, -R * 0.45 + step);
      ctx.lineTo(spearReach - R * 0.15, -R * 0.28 + step);
      ctx.closePath();
      ctx.fill();

      // 3. Peitoral de Armadura Blindada com Rebites
      ctx.fillStyle = steelCol;
      ctx.fillRect(-R * 0.55, -R * 0.45 + step, R * 0.85, R * 0.95);
      ctx.strokeStyle = steelDark;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-R * 0.55, -R * 0.45 + step, R * 0.85, R * 0.95);

      // 4. Elmo Coríntio com Penacho e Fenda em T
      ctx.fillStyle = steelDark;
      ctx.beginPath();
      ctx.arc(-R * 0.12, -R * 0.62 + step, R * 0.34, 0, Math.PI * 2);
      ctx.fill();

      // Penacho de Crina de Cavalo Vermelho
      ctx.fillStyle = isEnraged ? '#ff4757' : '#c0392b';
      ctx.beginPath();
      ctx.moveTo(-R * 0.35, -R * 0.75 + step);
      ctx.quadraticCurveTo(-R * 0.1, -R * 1.15 + step, R * 0.15, -R * 0.8 + step);
      ctx.lineTo(-R * 0.05, -R * 0.65 + step);
      ctx.closePath();
      ctx.fill();

      // Viseira em Fenda T com Brilho Sombrio
      ctx.fillStyle = goldTrim;
      ctx.fillRect(-R * 0.16, -R * 0.65 + step, 7, 2.5);
      ctx.fillRect(-R * 0.14, -R * 0.65 + step, 2.5, 6);

      // 5. Pavês Maciço de Torre (Escudo Frontal Ativo)
      const shX = R * 0.35;
      const shY = -R * 0.9 + step;
      const shW = R * 0.58;
      const shH = R * 1.8;

      ctx.fillStyle = steelDark;
      ctx.fillRect(shX, shY, shW, shH);
      ctx.strokeStyle = goldTrim;
      ctx.lineWidth = 2.8;
      ctx.strokeRect(shX, shY, shW, shH);

      // Chanfro e Cruz Imperial em Relevo Dourado
      ctx.fillStyle = goldTrim;
      ctx.fillRect(shX + shW * 0.4, shY + shH * 0.15, 5, shH * 0.7);
      ctx.fillRect(shX + shW * 0.15, shY + shH * 0.45, shW * 0.7, 5);

      // Rebites de Bronze nos 4 Cantos do Escudo
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(shX + 2, shY + 2, 3, 3);
      ctx.fillRect(shX + shW - 5, shY + 2, 3, 3);
      ctx.fillRect(shX + 2, shY + shH - 5, 3, 3);
      ctx.fillRect(shX + shW - 5, shY + shH - 5, 3, 3);

      // Efeito Ativo de Bloqueio/Deflexão Frontal
      if (e.shieldBlockFlash > 0 || (e.actionState === 'WINDUP' && e.currentSkill === 'SHIELD_CHARGE')) {
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(shX + shW * 0.5, shY + shH * 0.5, shH * 0.68, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // Fagulhas de Deflexão de Projétil
        for (let spk = 0; spk < 4; spk++) {
          const sa = (Math.random() - 0.5) * Math.PI * 0.8;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(shX + shW + Math.cos(sa) * 12, shY + shH * 0.5 + Math.sin(sa) * 16, 2.5, 2.5);
        }
      }
      break;
    }

    // =========================================================================
    // 3. DEMOLIDOR SÍSMICO (SEISMIC_SMASHER) - Pistões, martelos com magma e vapor
    // =========================================================================
    case 'SEISMIC_SMASHER': {
      const step = Math.sin(frameCount * 0.1) * 2;
      const isCharging = (e.actionState === 'WINDUP' || (e.slamTimer && e.slamTimer > 80));
      const vibrate = isCharging ? (Math.random() - 0.5) * 5 : 0;
      const mechCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4b6584');
      const mechDark = isHit ? '#ffffff' : '#2c3e50';

      // 1. Chassi Hexagonal Blindado
      ctx.fillStyle = mechCol;
      ctx.beginPath();
      ctx.moveTo(-R * 0.8, -R * 0.5 + step);
      ctx.lineTo(R * 0.8, -R * 0.5 + step);
      ctx.lineTo(R * 0.55, R * 0.65 + step);
      ctx.lineTo(-R * 0.55, R * 0.65 + step);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = mechDark;
      ctx.lineWidth = 3;
      ctx.stroke();

      // 2. Visor Industrial com Fenda Incandescente
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(-R * 0.3, -R * 0.85 + step, R * 0.6, R * 0.38);
      ctx.fillStyle = isCharging ? '#f1c40f' : (isEnraged ? '#ff4757' : '#e67e22');
      ctx.fillRect(-R * 0.22, -R * 0.72 + step, R * 0.44, 4);

      // 3. Braços com Pistões Hidráulicos Ativos
      const hammerLift = isCharging ? -R * 0.85 : R * 0.15;
      const h1X = R * 0.9 + vibrate;
      const h1Y = hammerLift + step + vibrate;
      const h2X = -R * 0.9 + vibrate;
      const h2Y = hammerLift + step - vibrate;

      // Cilindros Cromados dos Pistões
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(R * 0.4, 0);
      ctx.lineTo(h1X, h1Y);
      ctx.moveTo(-R * 0.4, 0);
      ctx.lineTo(h2X, h2Y);
      ctx.stroke();

      // 4. Cabeças de Martelo Vulcânicas com Fissuras de Magma
      const drawHammerHead = (hx, hy) => {
        ctx.fillStyle = isHit ? '#ffffff' : '#2f3542';
        ctx.fillRect(hx - 10, hy - 16, 20, 32);
        ctx.strokeStyle = isCharging ? '#f1c40f' : '#7f8c8d';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(hx - 10, hy - 16, 20, 32);

        // Fissura de Ferro Fundido Incandescente no Martelo
        ctx.strokeStyle = isCharging ? '#ffffff' : '#f39c12';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx - 6, hy - 10);
        ctx.lineTo(hx + 2, hy);
        ctx.lineTo(hx - 4, hy + 10);
        ctx.stroke();
      };

      drawHammerHead(h1X, h1Y);
      drawHammerHead(h2X, h2Y);

      // 5. Escape de Vapor Pressurizado e Fagulhas
      if (isCharging) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(h1X + (Math.random() - 0.5) * 24, h1Y + (Math.random() - 0.5) * 24, 3.5, 3.5);
        ctx.fillRect(h2X + (Math.random() - 0.5) * 24, h2Y + (Math.random() - 0.5) * 24, 3.5, 3.5);
      }
      if (e.actionState === 'STRIKE') {
        // Lufada cônica de vapor branco
        ctx.fillStyle = 'rgba(236, 240, 241, 0.7)';
        ctx.beginPath();
        ctx.arc(0, R * 0.7, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // =========================================================================
    // 4. COLOSSO FERRUGINOSO (RUST_COLOSSUS) - Fornalha aberta, correntes e rocha vulcânica
    // =========================================================================
    case 'RUST_COLOSSUS': {
      const step = Math.sin(frameCount * 0.09) * 2.5;
      const rustBase = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#b33927');
      const rustDark = isHit ? '#ffffff' : '#533422';

      // 1. Chaminé Traseira com Fumaça e Fuligem
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.7, -R * 1.05 + step, 9, 18);
      if (Math.floor(frameCount) % 3 === 0) {
        ctx.fillStyle = 'rgba(127, 140, 141, 0.75)';
        ctx.beginPath();
        ctx.arc(-R * 0.68 + (Math.random() - 0.5) * 6, -R * 1.25 + step, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Carcaça Maciça Blindada com Rebites
      ctx.fillStyle = rustBase;
      ctx.beginPath();
      ctx.moveTo(-R * 0.9, -R * 0.5 + step);
      ctx.lineTo(R * 0.9, -R * 0.5 + step);
      ctx.lineTo(R * 0.65, R * 0.75 + step);
      ctx.lineTo(-R * 0.65, R * 0.75 + step);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rustDark;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Rebites de Aço Escuro
      ctx.fillStyle = '#f7d794';
      for (let rv = -3; rv <= 3; rv++) {
        ctx.fillRect(rv * (R * 0.23) - 2, -R * 0.42 + step, 3.5, 3.5);
      }

      // 3. Correntes de Ferro Suspensas nos Ombros com Inércia
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 2.2;
      const chainSway = Math.sin(frameCount * 0.12) * 4;
      for (let c = -1; c <= 1; c += 2) {
        const cx = c * (R * 0.75);
        ctx.beginPath();
        ctx.moveTo(cx, -R * 0.4 + step);
        ctx.lineTo(cx + chainSway * c, R * 0.2 + step);
        ctx.stroke();
      }

      // 4. Fornalha Peitoral com Brasas Vivas e Grade de Ferro
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.38, -R * 0.18 + step, R * 0.76, R * 0.54);

      // Núcleo de Fogo e Brasas
      const furnacePulse = (Math.sin(frameCount * 0.16) + 1) * 0.5;
      ctx.fillStyle = furnacePulse > 0.4 ? '#f1c40f' : '#e67e22';
      ctx.fillRect(-R * 0.3, -R * 0.12 + step, R * 0.6, R * 0.42);

      // Grade de Ferro Forjado
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-R * 0.12, -R * 0.12 + step);
      ctx.lineTo(-R * 0.12, R * 0.3 + step);
      ctx.moveTo(R * 0.12, -R * 0.12 + step);
      ctx.lineTo(R * 0.12, R * 0.3 + step);
      ctx.stroke();

      // 5. Rocha Vulcânica com Magma no Arremesso (BOULDER_TOSS)
      if (e.actionState === 'WINDUP' && e.currentSkill === 'BOULDER_TOSS') {
        const bRad = R * 0.7;
        const bY = -R * 1.55 + step;
        ctx.fillStyle = '#3d3d3d';
        ctx.beginPath();
        ctx.arc(0, bY, bRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d35400';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Veias de Magma Fluido na Rocha
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-bRad * 0.5, bY - bRad * 0.3);
        ctx.lineTo(0, bY);
        ctx.lineTo(bRad * 0.4, bY + bRad * 0.4);
        ctx.stroke();
      }
      break;
    }

    // =========================================================================
    // 5. GÁRGULA DE SANGUE (BLOOD_GARGOYLE) - Asas bi-articuladas, fendas rubi e garras
    // =========================================================================
    case 'BLOOD_GARGOYLE': {
      const isStone = !!e.isStoneForm;
      const wingFlap = isStone ? 0 : Math.sin(frameCount * (e.isAirborne ? 0.48 : 0.28)) * (e.isAirborne ? 24 : 16);
      const bodyCol = isHit ? '#ffffff' : (isStone ? '#7f8c8d' : (e.slowTimer > 0 ? '#74b9ff' : '#4b6584'));
      const wingMembrane = isHit ? '#ffffff' : (isStone ? '#535c68' : '#8b0000');

      // 1. Asas Góticas Bi-Articuladas com Garras nos Ombros
      for (let side = -1; side <= 1; side += 2) {
        ctx.fillStyle = wingMembrane;
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 2.4;

        ctx.beginPath();
        ctx.moveTo(side * (R * 0.2), -R * 0.2);
        // Cotovelo superior da asa com garra afiada
        const elbowX = side * (R * 1.65);
        const elbowY = -R * 1.35 + wingFlap;
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(side * (R * 1.25), -R * 0.2 + wingFlap * 0.5);
        ctx.lineTo(side * (R * 1.45), R * 0.55 + wingFlap);
        ctx.lineTo(0, R * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Nervuras Góticas da Membrana da Asa
        ctx.strokeStyle = isStone ? '#3d3d3d' : '#5c0000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(side * (R * 1.25), -R * 0.2 + wingFlap * 0.5);
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(side * (R * 1.45), R * 0.55 + wingFlap);
        ctx.stroke();
      }

      // 2. Corpo Pétreo Triangular Esguio
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.75);
      ctx.lineTo(R * 0.5, R * 0.55);
      ctx.lineTo(0, R * 0.9);
      ctx.lineTo(-R * 0.5, R * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 3. Focinho Demoníaco e Chifres Góticos
      ctx.fillStyle = isHit ? '#ffffff' : '#2f3542';
      ctx.beginPath();
      ctx.arc(0, -R * 0.7, R * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Chifres Longos Curvados
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-R * 0.2, -R * 0.85);
      ctx.quadraticCurveTo(-R * 0.45, -R * 1.35, -R * 0.6, -R * 1.45);
      ctx.moveTo(R * 0.2, -R * 0.85);
      ctx.quadraticCurveTo(R * 0.45, -R * 1.35, R * 0.6, -R * 1.45);
      ctx.stroke();

      // Olhos de Rubi Flamejante
      ctx.fillStyle = isStone ? '#bdc3c7' : '#ff1744';
      ctx.fillRect(-R * 0.2, -R * 0.76, 4, 4);
      ctx.fillRect(R * 0.08, -R * 0.76, 4, 4);

      // Fissuras de Pedra se estiver na Forma de Pedra
      if (isStone) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-R * 0.2, 0);
        ctx.lineTo(0, R * 0.3);
        ctx.lineTo(R * 0.2, R * 0.1);
        ctx.stroke();
      }
      break;
    }

    // =========================================================================
    // 6. PREDADOR ESPECTRAL (SPECTRAL_STALKER) - Cauda fluida, distorção e adagas
    // =========================================================================
    case 'SPECTRAL_STALKER': {
      const isStealth = !!e.isStealthed;
      if (isStealth) {
        ctx.save();
        ctx.globalAlpha = 0.28;
      }
      const isAiming = (e.actionState === 'WINDUP' || e.dashState === 'aim');
      const isDashing = (e.actionState === 'STRIKE' || e.dashState === 'dashing');
      const wave = Math.sin(frameCount * 0.2) * 6;
      const shadowCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#341f97');
      const daggerCol = isHit ? '#ffffff' : (isAiming ? '#ff4757' : '#00cec9');

      // 1. Cauda Fluida de Fumaça Fantasmagórica (Curvas de Bézier)
      ctx.fillStyle = shadowCol;
      ctx.beginPath();
      ctx.moveTo(R * 0.4, -R * 0.65);
      ctx.quadraticCurveTo(R * 0.5, 0, R * 0.2, R * 0.65);
      ctx.bezierCurveTo(-R * 0.4, R * 0.8 + wave, -R * 0.9, wave, -R * 1.25 + (isDashing ? -12 : 0), wave * 0.8);
      ctx.bezierCurveTo(-R * 0.8, -R * 0.4, -R * 0.3, -R * 0.65, R * 0.4, -R * 0.65);
      ctx.closePath();
      ctx.fill();

      // 2. Máscara Espectral do Caçador
      ctx.fillStyle = isHit ? '#ffffff' : '#0a0814';
      ctx.beginPath();
      ctx.moveTo(R * 0.6, 0);
      ctx.lineTo(R * 0.2, -R * 0.5);
      ctx.lineTo(0, 0);
      ctx.lineTo(R * 0.2, R * 0.5);
      ctx.closePath();
      ctx.fill();

      // Olhos Espectrais Violetas
      ctx.fillStyle = '#a29bfe';
      ctx.fillRect(R * 0.25, -R * 0.22, 4, 3);
      ctx.fillRect(R * 0.25, R * 0.08, 4, 3);

      // 3. 4 Adagas Rúnicas Orbitais com Rastro de Luz
      ctx.strokeStyle = daggerCol;
      ctx.lineWidth = 2.6;

      if (isAiming) {
        // Alinhadas na frente em formação de ponta de flecha
        for (let d = 0; d < 4; d++) {
          const dy = (d - 1.5) * 10;
          ctx.beginPath();
          ctx.moveTo(R * 0.4, dy);
          ctx.lineTo(R * 1.45, dy * 0.4);
          ctx.stroke();
        }
      } else if (isDashing) {
        // Trilhas paralelas de estocada rápida
        for (let d = 0; d < 4; d++) {
          const dy = (d < 2 ? -1 : 1) * (d % 2 === 0 ? 9 : 18);
          ctx.beginPath();
          ctx.moveTo(R * 0.3, dy * 0.5);
          ctx.lineTo(-R * 1.3, dy);
          ctx.stroke();
        }
      } else {
        // Órbita circular com after-images
        for (let d = 0; d < 4; d++) {
          const dAng = frameCount * 0.08 + (d * Math.PI / 2);
          const dx = Math.cos(dAng) * (R * 1.25);
          const dy = Math.sin(dAng) * (R * 0.75);
          ctx.save();
          ctx.translate(dx, dy);
          ctx.rotate(dAng + Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(3.5, 8);
          ctx.lineTo(-3.5, 8);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
      }

      if (isStealth) {
        ctx.restore();
      }
      break;
    }

    // =========================================================================
    // 7. FATIADOR QUÂNTICO (QUANTUM_SLICER) - Aberração cromática, singularidade e plasma
    // =========================================================================
    case 'QUANTUM_SLICER': {
      const slicerCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#6c5ce7');
      const bladeCol = isHit ? '#ffffff' : '#e056fd';

      // 1. Aberração Cromática em Teleportes (Ecos Tricromáticos)
      if (e.blinkCount && e.blinkCount > 0) {
        const chromaticGhosts = [
          { color: 'rgba(255, 71, 87, 0.45)', dx: -10, dy: -4 },
          { color: 'rgba(0, 210, 211, 0.45)', dx: 8, dy: 4 },
          { color: 'rgba(162, 155, 254, 0.45)', dx: -2, dy: 6 }
        ];
        chromaticGhosts.forEach(g => {
          ctx.save();
          ctx.fillStyle = g.color;
          ctx.beginPath();
          ctx.ellipse(g.dx, g.dy, R * 0.65, R * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 2. Chassi Poligonal Geométrico Futurista
      ctx.fillStyle = slicerCol;
      ctx.beginPath();
      ctx.moveTo(R * 0.65, 0);
      ctx.lineTo(R * 0.15, -R * 0.65);
      ctx.lineTo(-R * 0.65, -R * 0.45);
      ctx.lineTo(-R * 0.45, 0);
      ctx.lineTo(-R * 0.65, R * 0.45);
      ctx.lineTo(R * 0.15, R * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // 3. Núcleo de Singularidade Central Rotativo
      ctx.fillStyle = '#0a051b';
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00d2d3';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, frameCount * 0.2, frameCount * 0.2 + Math.PI * 1.4);
      ctx.stroke();

      // 4. Lâminas Duplas de Plasma com Arcos Elétricos
      const bladePulse = Math.sin(frameCount * 0.3) * 4;
      ctx.strokeStyle = bladeCol;
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(R * 0.25, -R * 0.5);
      ctx.lineTo(R * 1.45 + bladePulse, -R * 0.72);
      ctx.moveTo(R * 0.25, R * 0.5);
      ctx.lineTo(R * 1.45 + bladePulse, R * 0.72);
      ctx.stroke();

      // Micro-raios oscilantes entre as pontas das lâminas
      if (Math.floor(frameCount) % 2 === 0) {
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(R * 1.45 + bladePulse, -R * 0.72);
        ctx.lineTo(R * 1.15, 0);
        ctx.lineTo(R * 1.45 + bladePulse, R * 0.72);
        ctx.stroke();
      }
      break;
    }

    // =========================================================================
    // 8. TORRE MÓVEL (ARTILLERY_MECH) - Pernas aranha, dissipador de calor e laser tático
    // =========================================================================
    case 'ARTILLERY_MECH': {
      const isShootingRecoil = (e.actionState === 'STRIKE' || (e.shootTimer && e.shootTimer > 95)) ? -7 : 0;
      const mechDark = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e3799');

      // 1. Pernas de Aranha Mecânicas Articuladas (2 Juntas)
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 3.5;
      const legP = [[-R * 0.9, -R * 0.9], [R * 0.8, -R * 0.9], [-R * 0.9, R * 0.9], [R * 0.8, R * 0.9]];
      for (let lp = 0; lp < 4; lp++) {
        const jointX = legP[lp][0] * 0.55;
        const jointY = legP[lp][1] * 0.45;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(jointX, jointY);
        ctx.lineTo(legP[lp][0], legP[lp][1]);
        ctx.stroke();

        // Sapatas de Sustentação com Travas
        ctx.fillStyle = e.isSiegeMode ? '#e74c3c' : '#2d3436';
        ctx.fillRect(legP[lp][0] - 5, legP[lp][1] - 5, 10, 10);
      }

      // 2. Chassi Blindado Circular com Cúpula
      ctx.fillStyle = mechDark;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.68, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a69bd';
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Cúpula Óptica Central
      ctx.fillStyle = '#00d2d3';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Canos Duplos com Dissipadores de Calor Incandescentes
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(R * 0.2 + isShootingRecoil, -R * 0.28, R * 1.15, 6);
      ctx.fillRect(R * 0.2 + isShootingRecoil, R * 0.1, R * 1.15, 6);

      // Ranhuras em Brasa nos Canos
      ctx.fillStyle = isEnraged ? '#ff4757' : '#f39c12';
      ctx.fillRect(R * 0.4 + isShootingRecoil, -R * 0.26, R * 0.5, 2.5);
      ctx.fillRect(R * 0.4 + isShootingRecoil, R * 0.12, R * 0.5, 2.5);

      // 4. Mira Laser Tática com Retículo Holográfico
      if (e.isSiegeMode || (e.actionState === 'WINDUP' && e.currentSkill === 'SIEGE_BURST')) {
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.9)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(R * 1.35 + isShootingRecoil, -R * 0.1);
        ctx.lineTo(R * 8.0, -R * 0.1);
        ctx.stroke();

        // Retículo Holográfico
        ctx.beginPath();
        ctx.arc(R * 5.0, -R * 0.1, 10, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255, 56, 56, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(R * 1.35 + isShootingRecoil, -R * 0.25);
        ctx.lineTo(R * 3.5, -R * 0.25);
        ctx.stroke();
      }
      break;
    }

    // =========================================================================
    // 9. INCINERADOR INSTÁVEL (FIRE_INCINERATOR) - Vidro borbulhante e fogo multicamadas
    // =========================================================================
    case 'FIRE_INCINERATOR': {
      const boilPulse = Math.sin(frameCount * 0.25) * 2;
      const boilerCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#d35400');

      // 1. Escapamentos Traseiros com Faíscas
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.95, -R * 0.75, 8, 16);
      ctx.fillRect(-R * 0.95, R * 0.35, 8, 16);

      if (Math.floor(frameCount) % 2 === 0) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-R * 1.3 - Math.random() * 5, -R * 0.7 + (Math.random() - 0.5) * 8, 3.5, 3.5);
        ctx.fillRect(-R * 1.3 - Math.random() * 5, R * 0.4 + (Math.random() - 0.5) * 8, 3.5, 3.5);
      }

      // 2. Chassi Esférico da Caldeira
      ctx.fillStyle = boilerCol;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.82 + boilPulse * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // 3. Ventre de Vidro Translúcido com Combustível Fervente
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(R * 0.15, -R * 0.38, R * 0.5, R * 0.76);

      // Líquido Alquímico Borbulhante
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(R * 0.22, -R * 0.28, R * 0.36, R * 0.56);
      ctx.fillStyle = '#e74c3c';
      for (let b = 0; b < 3; b++) {
        const by = -R * 0.2 + ((frameCount * 1.5 + b * 8) % (R * 0.5));
        ctx.fillRect(R * 0.3 + b * 3, by, 2.5, 2.5);
      }

      // 4. Labareda Multicamadas do Lança-Chamas Ativo
      if (e.isFlamethrowing) {
        const fPulse = Math.sin(frameCount * 0.4) * 5;
        // Camada 1: Núcleo Branco/Azul Superquente
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(R * 0.65, 0);
        ctx.lineTo(R * 1.6 + fPulse, -R * 0.2);
        ctx.lineTo(R * 1.6 + fPulse, R * 0.2);
        ctx.closePath();
        ctx.fill();

        // Camada 2: Labareda Amarelo-Dourada
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.moveTo(R * 0.6, -R * 0.25);
        ctx.lineTo(R * 2.1 + fPulse, -R * 0.65);
        ctx.lineTo(R * 2.4 + fPulse, 0);
        ctx.lineTo(R * 2.1 + fPulse, R * 0.65);
        ctx.lineTo(R * 0.6, R * 0.25);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    // =========================================================================
    // 10. CAPITÃO DE CERCO (SIEGE_CAPTAIN) - Esteiras rolantes, morteiro pesado e flâmula
    // =========================================================================
    case 'SIEGE_CAPTAIN': {
      const isMortarRecoil = (e.actionState === 'STRIKE' || (e.mortarTimer && e.mortarTimer > 120)) ? -8 : 0;
      const hullCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#b71540');

      // 1. Esteiras de Blindado Rolantes (Gomos Móveis)
      const trackShift = (frameCount * 2) % 8;
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.85, -R * 0.9, R * 1.7, 14);
      ctx.fillRect(-R * 0.85, R * 0.58, R * 1.7, 14);

      // Gomos Articulados da Lagarta
      ctx.fillStyle = '#636e72';
      for (let g = -4; g <= 4; g++) {
        const gx = g * 9 + trackShift;
        if (gx > -R * 0.8 && gx < R * 0.8) {
          ctx.fillRect(gx, -R * 0.9, 3.5, 14);
          ctx.fillRect(gx, R * 0.58, 3.5, 14);
        }
      }

      // 2. Carcaça Blindada Angular de Tanque
      ctx.fillStyle = hullCol;
      ctx.beginPath();
      ctx.moveTo(-R * 0.7, -R * 0.65);
      ctx.lineTo(R * 0.7, -R * 0.65);
      ctx.lineTo(R * 0.9, 0);
      ctx.lineTo(R * 0.7, R * 0.65);
      ctx.lineTo(-R * 0.7, R * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4a0e17';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 3. Morteiro Pesado com Coice e Anéis de Exaustão
      ctx.save();
      ctx.translate(isMortarRecoil * 0.75, 0);
      ctx.rotate(-0.68);
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(0, -9, R * 1.3, 18);
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(0, -9, R * 1.3, 18);

      if (isMortarRecoil < 0) {
        // Clarão de Boca de Fogo e Anel de Fumaça
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(R * 1.4, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(R * 1.6, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Flâmula de Cerco Traseira Tremulando
      const flagWave = Math.sin(frameCount * 0.25) * 4;
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.moveTo(-R * 0.6, 0);
      ctx.lineTo(-R * 1.1, -8 + flagWave);
      ctx.lineTo(-R * 0.9, 0);
      ctx.lineTo(-R * 1.1, 8 + flagWave);
      ctx.closePath();
      ctx.fill();
      break;
    }

    // =========================================================================
    // 11. MATRIARCA PARASITA (BROOD_MATRIARCH) - Saco translúcido de ovos e mandíbulas
    // =========================================================================
    case 'BROOD_MATRIARCH': {
      const pinch = Math.sin(frameCount * 0.18) * 4;
      const chitinCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#006266');

      // 1. 6 Patas Aracnídeas Articuladas com Cerdas e Espinhos
      ctx.strokeStyle = isHit ? '#ffffff' : '#004d40';
      ctx.lineWidth = 2.8;
      for (let p = 0; p < 3; p++) {
        const stepA = Math.sin(frameCount * 0.2 + p * 1.4) * 7;
        const px = -R * 0.35 + p * (R * 0.42);
        // Pata Superior
        ctx.beginPath();
        ctx.moveTo(px, -R * 0.25);
        ctx.lineTo(px - 3, -R * 0.7);
        ctx.lineTo(px - 6, -R * 1.2 + stepA);
        ctx.stroke();
        // Pata Inferior
        ctx.beginPath();
        ctx.moveTo(px, R * 0.25);
        ctx.lineTo(px - 3, R * 0.7);
        ctx.lineTo(px - 6, R * 1.2 - stepA);
        ctx.stroke();
      }

      // 2. Saco de Ovos Bioluminescente Translúcido
      ctx.fillStyle = isHit ? '#ffffff' : 'rgba(0, 206, 201, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-R * 0.8, 0, R * 0.9, R * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = chitinCol;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Ovos e Embriões em Contorção Interna
      const eggPulse = Math.sin(frameCount * 0.15) * 2;
      ctx.fillStyle = (e.actionState === 'WINDUP' && e.currentSkill === 'BROOD_EGGS') ? '#00cec9' : '#2ecc71';
      const eggPos = [[-R * 1.0, -R * 0.25], [-R * 0.8, R * 0.25], [-R * 0.6, -R * 0.18], [-R * 0.9, R * 0.18]];
      for (let eg = 0; eg < 4; eg++) {
        ctx.beginPath();
        ctx.arc(eggPos[eg][0], eggPos[eg][1], 4.5 + (eg % 2 === 0 ? eggPulse : -eggPulse), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Cefalotórax Blindado
      ctx.fillStyle = chitinCol;
      ctx.beginPath();
      ctx.ellipse(R * 0.28, 0, R * 0.58, R * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Quelíceras Mandibulares com Fios de Saliva Ácida
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.moveTo(R * 0.65, -R * 0.28);
      ctx.quadraticCurveTo(R * 1.15, -R * 0.5 + pinch, R * 1.35, -pinch);
      ctx.lineTo(R * 0.65, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(R * 0.65, R * 0.28);
      ctx.quadraticCurveTo(R * 1.15, R * 0.5 - pinch, R * 1.35, pinch);
      ctx.lineTo(R * 0.65, 0);
      ctx.closePath();
      ctx.fill();

      // Fio de Saliva Ácida Verde entre as Mandíbulas
      ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(R * 1.25, -pinch);
      ctx.lineTo(R * 1.25, pinch);
      ctx.stroke();
      break;
    }

    // =========================================================================
    // 12. NINHO MÓVEL (MOBILE_HIVE) - Favo celular respirante, enxame e gavinhas
    // =========================================================================
    case 'MOBILE_HIVE': {
      const bioPulse = Math.sin(frameCount * 0.09) * 3;
      const hiveCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#16a085');

      // 1. Carcaça de Favo de Mel Respirante
      ctx.fillStyle = hiveCol;
      ctx.beginPath();
      ctx.moveTo(0, -R * 1.0 - bioPulse);
      ctx.quadraticCurveTo(R * 1.0 + bioPulse, -R * 0.5, R * 0.85, R * 0.5);
      ctx.quadraticCurveTo(0, R * 1.15 + bioPulse, -R * 0.85, R * 0.5);
      ctx.quadraticCurveTo(-R * 1.0 - bioPulse, -R * 0.5, 0, -R * 1.0 - bioPulse);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0e6251';
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Cavidades Celulares Orgânicas
      ctx.fillStyle = '#0b3b32';
      const hives = [[-R * 0.4, -R * 0.35], [R * 0.38, -R * 0.25], [-R * 0.12, R * 0.4], [R * 0.42, R * 0.35]];
      for (let h = 0; h < 4; h++) {
        ctx.beginPath();
        ctx.ellipse(hives[h][0], hives[h][1], 7, 5, h * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Mini-Enxame Caótico e Turbulento (6 Insetos/Morcegos)
      ctx.fillStyle = '#ff4757';
      for (let b = 0; b < 5; b++) {
        const bAng = frameCount * 0.11 + (b * Math.PI * 2 / 5);
        const bx = Math.cos(bAng) * (R * 1.35);
        const by = Math.sin(bAng) * (R * 0.95);
        const bFlap = Math.sin(frameCount * 0.45 + b) * 3.5;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - 4.5, by - 4.5 + bFlap);
        ctx.lineTo(bx + 4.5, by - 4.5 + bFlap);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Gavinhas Parasitas Rastejantes
      ctx.strokeStyle = '#0e6251';
      ctx.lineWidth = 2;
      for (let t = -1; t <= 1; t++) {
        const wave = Math.sin(frameCount * 0.15 + t) * 4;
        ctx.beginPath();
        ctx.moveTo(t * 10, R * 0.8);
        ctx.lineTo(t * 14 + wave, R * 1.35);
        ctx.stroke();
      }
      break;
    }

    // =========================================================================
    // 13. ALTO SACERDOTE (HIGH_OCCULTIST) - Capuz de vazio, runas astrais e prisma
    // =========================================================================
    case 'HIGH_OCCULTIST': {
      const hover = Math.sin(frameCount * 0.09) * 5;
      const drape = Math.sin(frameCount * 0.15) * 3.5;
      const robeCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2c003e');

      // 1. Túnica Cerimonial com Caimento Esvoaçante
      ctx.fillStyle = robeCol;
      ctx.beginPath();
      ctx.moveTo(-R * 0.5, -R * 0.7 + hover);
      ctx.lineTo(R * 0.5, -R * 0.7 + hover);
      ctx.lineTo(R * 0.7 + drape, R * 1.0 + hover);
      ctx.quadraticCurveTo(0, R * 0.8 + hover, -R * 0.7 - drape, R * 1.0 + hover);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Bordados Arcanos Dourados na Bainha da Túnica
      ctx.fillStyle = '#f1c40f';
      for (let run = -3; run <= 3; run++) {
        ctx.fillRect(run * 7 - 1.5, R * 0.88 + hover, 3, 3);
      }

      // 2. Capuz de Vazio Absoluto e Olhos Astrais Fúcsia
      ctx.fillStyle = '#05000a';
      ctx.beginPath();
      ctx.arc(0, -R * 0.6 + hover, R * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Olhos Estelares que Brilham na Escuridão
      ctx.fillStyle = '#e056fd';
      ctx.fillRect(-R * 0.18, -R * 0.65 + hover, 4.5, 4.5);
      ctx.fillRect(R * 0.06, -R * 0.65 + hover, 4.5, 4.5);

      // 3. Cajado Arcano com Prisma de Ametista Levitante
      const isRitual = (e.actionState === 'WINDUP' || (e.ritualTimer && e.ritualTimer > 100));
      const stX = R * 0.9;
      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(stX, R * 0.85 + hover);
      ctx.lineTo(stX, -R * 1.1 + hover);
      ctx.stroke();

      // Prisma de Ametista Levitante
      const gemPulse = Math.sin(frameCount * 0.2) * 2;
      ctx.fillStyle = isRitual ? '#ff4757' : '#a29bfe';
      ctx.beginPath();
      ctx.moveTo(stX, -R * 1.35 + hover - gemPulse);
      ctx.lineTo(stX + 6, -R * 1.2 + hover - gemPulse);
      ctx.lineTo(stX, -R * 1.05 + hover - gemPulse);
      ctx.lineTo(stX - 6, -R * 1.2 + hover - gemPulse);
      ctx.closePath();
      ctx.fill();

      // Anéis de Energia Gravitacional Cósmica no Ritual
      if (isRitual) {
        ctx.strokeStyle = 'rgba(224, 86, 253, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(stX, -R * 1.2 + hover, 14 + gemPulse * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    // =========================================================================
    // 14. GUARDIÃO RÚNICO (RUNIC_WARDEN) - Golem de basalto com partes flutuantes
    // =========================================================================
    case 'RUNIC_WARDEN': {
      const stoneCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2c3e50');

      // 1. Torso Central Monolítico de Basalto
      ctx.fillStyle = stoneCol;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.9);
      ctx.lineTo(R * 0.75, -R * 0.35);
      ctx.lineTo(R * 0.6, R * 0.8);
      ctx.lineTo(-R * 0.6, R * 0.8);
      ctx.lineTo(-R * 0.75, -R * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0984e3';
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // 2. Ombreiras Levitantes Desconectadas
      for (let s = -1; s <= 1; s += 2) {
        const shX = s * (R * 0.95);
        const shY = -R * 0.35 + Math.sin(frameCount * 0.1 + s) * 3;
        ctx.fillStyle = stoneCol;
        ctx.fillRect(shX - 6, shY - 10, 12, 20);
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(shX - 6, shY - 10, 12, 20);

        // Filamento Elétrico Unindo a Ombreira ao Torso
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(s * (R * 0.5), -R * 0.2);
        ctx.lineTo(shX, shY);
        ctx.stroke();
      }

      // 3. Glifos Nórdicos Incisos no Peito com Pulso de Mana
      const manaPulse = (Math.sin(frameCount * 0.15) + 1) * 2;
      ctx.fillStyle = isHit ? '#ffffff' : '#00d2d3';
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.35 - manaPulse);
      ctx.lineTo(R * 0.3 + manaPulse, 0);
      ctx.lineTo(0, R * 0.35 + manaPulse);
      ctx.lineTo(-R * 0.3 - manaPulse, 0);
      ctx.closePath();
      ctx.fill();

      // 4. Glifos Orbitais com Cúpula de Força Hexagonal
      const rSpeed = (e.actionState === 'WINDUP' ? 0.08 : 0.035);
      for (let r = 0; r < 3; r++) {
        const rAng = frameCount * rSpeed + (r * Math.PI * 2 / 3);
        const rx = Math.cos(rAng) * (R * 1.4);
        const ry = Math.sin(rAng) * (R * 0.85);

        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(frameCount * 0.05);
        ctx.fillStyle = 'rgba(9, 132, 227, 0.45)';
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let h = 0; h < 6; h++) {
          const ha = h * Math.PI / 3;
          const hx = Math.cos(ha) * 8.5;
          const hy = Math.sin(ha) * 8.5;
          if (h === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      break;
    }

    // =========================================================================
    // 15. PRECURSOR DO VAZIO (VOID_PRECURSOR) - Horizonte de eventos e disco de acreção
    // =========================================================================
    case 'VOID_PRECURSOR': {
      // 1. Núcleo Devorador de Luz do Horizonte de Eventos
      ctx.fillStyle = isHit ? '#ffffff' : '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8e44ad';
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // 2. Disco de Acreção Estelar com Partículas e Velocidade Kepleriana
      const spinMult = (e.actionState === 'WINDUP' ? 2.2 : 1.0);
      
      // Anel Externo Violeta
      ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(142, 68, 173, 0.7)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.4, R * 0.6, frameCount * 0.04 * spinMult, 0, Math.PI * 2);
      ctx.stroke();

      // Anel Intermediário Magenta
      ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(232, 67, 147, 0.6)';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.25, R * 0.52, -frameCount * 0.05 * spinMult, 0, Math.PI * 2);
      ctx.stroke();

      // Anel Interno Ciano Relativístico
      ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(0, 206, 201, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.1, R * 0.44, frameCount * 0.07 * spinMult, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Poeira Estelar Cintilante em Órbita
      ctx.fillStyle = '#a29bfe';
      for (let f = 0; f < 5; f++) {
        const fa = frameCount * 0.06 + f * 1.3;
        ctx.fillRect(Math.cos(fa) * (R * 0.95) - 2, Math.sin(fa) * (R * 0.95) - 2, 4, 4);
      }
      break;
    }

    // =========================================================================
    // 16. ARAUTO DO CAOS (CHAOS_HERALD) - Olho rastreador do jogador, chifres e tentáculos
    // =========================================================================
    case 'CHAOS_HERALD': {
      const chaosWave = Math.sin(frameCount * 0.16) * 6;
      const demonCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (isEnraged ? '#d63031' : '#961b1b'));

      // 1. 4 Tentáculos Abissais com Ventosas
      ctx.strokeStyle = demonCol;
      ctx.lineWidth = isEnraged ? 4.8 : 3.8;
      for (let t = 0; t < 4; t++) {
        const tWave = Math.sin(frameCount * 0.18 + t * 1.5) * 9;
        const tx = (t - 1.5) * (R * 0.42);
        ctx.beginPath();
        ctx.moveTo(tx, R * 0.4);
        ctx.quadraticCurveTo(tx + tWave, R * 0.85, tx - tWave * 0.5, R * 1.3);
        ctx.stroke();

        // Ventosa Carmesim
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(tx + tWave * 0.5 - 2, R * 0.85, 4, 4);
      }

      // 2. Torso Demoníaco Esférico
      ctx.fillStyle = demonCol;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.76, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2c0c16';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 3. Chifres Longos de Obsidiana com Labaredas nas Pontas
      ctx.strokeStyle = isEnraged ? '#ff4757' : '#1e080d';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(-R * 0.4, -R * 0.4);
      ctx.quadraticCurveTo(-R * 0.95, -R * 1.15 + chaosWave, -R * 1.45, -R * 0.85);
      ctx.moveTo(R * 0.4, -R * 0.4);
      ctx.quadraticCurveTo(R * 0.95, -R * 1.15 + chaosWave, R * 1.45, -R * 0.85);
      ctx.moveTo(-R * 0.25, -R * 0.65);
      ctx.quadraticCurveTo(-R * 0.65, -R * 1.45, -R * 0.8, -R * 1.7);
      ctx.moveTo(R * 0.25, -R * 0.65);
      ctx.quadraticCurveTo(R * 0.65, -R * 1.45, R * 0.8, -R * 1.7);
      ctx.stroke();

      // 4. Olho do Caos com Rastreamento Óptico Dinâmico do Jogador
      const eyeR = R * 0.35 + Math.sin(frameCount * 0.12) * (isEnraged ? 4 : 2);
      ctx.fillStyle = isEnraged ? '#ff1744' : '#ff4757';
      ctx.beginPath();
      ctx.arc(0, -R * 0.05, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Cálculo do Olhar Relativo na Direção do Jogador
      let lookAngle = 0;
      if (player && typeof player.x === 'number') {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        lookAngle = Math.atan2(dy, dx) - (e.facing === -1 ? Math.PI : 0);
      }
      const pupilDist = eyeR * 0.4;
      const pupilX = Math.cos(lookAngle) * pupilDist;
      const pupilY = -R * 0.05 + Math.sin(lookAngle) * pupilDist;

      // Pupila em Fenda Demoníaca Vertical
      ctx.fillStyle = '#0a0104';
      ctx.beginPath();
      ctx.ellipse(pupilX, pupilY, 3.5, eyeR * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default: {
      ctx.fillStyle = eliteColor;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      break;
    }
  }
}

/**
 * Glifo de Ameaça agonizante: racha, perde a rotação rúnica e apaga no chão.
 */
function drawDyingThreatGlyph(R, color, t) {
  const glyphAlpha = Math.max(0, 1 - t * 1.35);
  if (glyphAlpha <= 0.01) return;

  const shatter = t * 14;
  ctx.save();
  ctx.globalAlpha = glyphAlpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.5, 2.0 * (1 - t));

  // Anel Externo Fraturando
  ctx.beginPath();
  ctx.ellipse(0, R * 0.82, Math.max(2, R * 1.32 - shatter * 0.4), Math.max(1, R * 0.48 - shatter * 0.2), 0, 0, Math.PI * 2);
  ctx.stroke();

  // Rachaduras radiais partindo do centro do glifo
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let c = 0; c < 6; c++) {
    const ca = c * (Math.PI / 3) + 0.2;
    const cr = (R * 1.3) * (0.3 + (c % 2) * 0.4);
    ctx.moveTo(0, R * 0.82);
    ctx.lineTo(Math.cos(ca) * cr, R * 0.82 + Math.sin(ca) * (cr * 0.4));
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Renderizador de Animações de Morte Complexas para todos os 16 Mini-Bosses.
 * Coreografia em 3 Fases: Impacto & Recoil (t < 0.35) -> Colapso Estrutural (0.35 <= t < 0.75) -> Dissipação (t >= 0.75).
 * @param {Object} de Entidade agonizante em dyingEnemies
 */
export function drawDyingMiniBossShape(de) {
  const t = Math.max(0, Math.min(1, 1 - (de.timer / de.maxTimer)));
  const R = de.radius;
  const isEnraged = !!de.enraged;
  const eliteColor = isEnraged ? '#ff4757' : (de.color || '#f39c12');

  ctx.save();
  ctx.translate(de.x, de.y);
  ctx.scale(de.facing || 1, 1);

  // Efeito de queda e rotação física de impacto
  if (de.rot) ctx.rotate(de.rot);

  // Fade suave de transparência apenas no último quarto da animação (t >= 0.75)
  const bodyAlpha = Math.max(0, 1 - Math.max(0, (t - 0.75) / 0.25));
  ctx.globalAlpha = bodyAlpha;

  // Glifo de ameaça no solo rachando e apagando
  drawDyingThreatGlyph(R, eliteColor, t);

  switch (de.baseType) {
    // =========================================================================
    // 1. ZOMBI ALFA (ZOMBIE_ALPHA)
    // =========================================================================
    case 'ZOMBIE_ALPHA': {
      // Fase 1: Racha a coluna e arqueia o dorso
      // Fase 2: Jatos de sangue verde e estalo vertebral
      // Fase 3: Tombo pesado de frente com os braços esticados
      const fallPitch = t < 0.35 ? -t * 0.4 : (t - 0.35) * 1.1;
      ctx.rotate(fallPitch);
      ctx.translate(0, t * 14);

      const skinColor = isEnraged ? '#15241b' : '#1e392a';
      const skinShade = isEnraged ? '#0d1812' : '#14271c';
      const veinColor = isEnraged ? '#ff4757' : '#2ecc71';

      // Torso desabando
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.moveTo(-R * 0.9, -R * 0.4);
      ctx.quadraticCurveTo(0, -R * 0.55 + t * 4, R * 0.85, -R * 0.35 + t * 8);
      ctx.lineTo(R * 0.6, R * 0.7);
      ctx.lineTo(-R * 0.6, R * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = skinShade;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Coluna vertebral se partindo (vértebras ejetadas)
      for (let v = 0; v < 5; v++) {
        const vDisplace = t > 0.35 ? (t - 0.35) * (v * 12 - 24) : 0;
        const vy = -R * 0.35 + v * (R * 0.22) + vDisplace * 0.4;
        const vx = -R * 0.65 + Math.sin(v * 0.8) * 3 + vDisplace;
        ctx.fillStyle = '#dfe4ea';
        ctx.beginPath();
        ctx.ellipse(vx, vy, 4.5, 3.2, -0.3 + t * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Erupção de bile verde esmeralda pelas veias rompidas
      if (t > 0.25) {
        ctx.fillStyle = veinColor;
        for (let b = 0; b < 6; b++) {
          const ba = b * 1.05 + t * 2.2;
          const bd = R * (0.4 + (t - 0.25) * 1.8);
          ctx.fillRect(Math.cos(ba) * bd - 2.5, Math.sin(ba) * (bd * 0.6) - 2.5, 5, 5);
        }
      }

      // Cabeça abatida
      ctx.fillStyle = skinShade;
      ctx.beginPath();
      ctx.arc(R * 0.25 + t * 6, -R * 0.6 + t * 12, R * 0.36, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // =========================================================================
    // 2. CENTURIÃO DA GUARDA (PHALANX_LEADER)
    // =========================================================================
    case 'PHALANX_LEADER': {
      // Fase 1: Escudo parte ao meio e tomba para a frente
      // Fase 2: Lança imperial quebra e elmo salta
      // Fase 3: O centurião cai de joelhos com capa esfarrapada
      const kneeDrop = t * 12;
      ctx.translate(0, kneeDrop);

      const steelCol = '#576574';
      const steelDark = '#2f3542';
      const goldTrim = isEnraged ? '#e74c3c' : '#f1c40f';

      // 1. Capa vermelha caindo no chão
      ctx.fillStyle = '#8b0000';
      ctx.beginPath();
      ctx.moveTo(-R * 0.5, -R * 0.4);
      ctx.quadraticCurveTo(-R * 1.1, R * 0.2 + t * 10, -R * 1.35, R * 0.7 + t * 12);
      ctx.lineTo(-R * 0.8, R * 0.8 + t * 12);
      ctx.closePath();
      ctx.fill();

      // 2. Peitoral metálico curvando para a frente
      ctx.save();
      ctx.rotate(t * 0.45);
      ctx.fillStyle = steelCol;
      ctx.fillRect(-R * 0.5, -R * 0.4, R * 0.8, R * 0.9);
      ctx.strokeStyle = steelDark;
      ctx.lineWidth = 2.0;
      ctx.strokeRect(-R * 0.5, -R * 0.4, R * 0.8, R * 0.9);
      ctx.restore();

      // 3. Duas metades do Pavês Imperial caindo separadas
      ctx.save();
      ctx.translate(R * 0.5 + t * 12, t * 10);
      ctx.rotate(t * 0.8);
      ctx.fillStyle = '#b71540';
      ctx.fillRect(0, -R * 0.9, R * 0.25, R * 0.85);
      ctx.strokeStyle = goldTrim;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, -R * 0.9, R * 0.25, R * 0.85);
      ctx.restore();

      ctx.save();
      ctx.translate(R * 0.5 + t * 18, t * 14);
      ctx.rotate(-t * 0.6);
      ctx.fillStyle = '#b71540';
      ctx.fillRect(0, 0, R * 0.25, R * 0.85);
      ctx.strokeRect(0, 0, R * 0.25, R * 0.85);
      ctx.restore();

      // 4. Lança de cerco partida
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(-R * 0.2, 0);
      ctx.lineTo(R * 0.8, -R * 0.2 + t * 8);
      ctx.stroke();

      // 5. Elmo coríntio rolando
      ctx.save();
      ctx.translate(-R * 0.3 - t * 10, t * 10);
      ctx.rotate(-t * 1.6);
      ctx.fillStyle = steelDark;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = goldTrim;
      ctx.fillRect(-2, -R * 0.4, 4, 6);
      ctx.restore();
      break;
    }

    // =========================================================================
    // 3. DEMOLIDOR SÍSMICO (SEISMIC_SMASHER)
    // =========================================================================
    case 'SEISMIC_SMASHER': {
      // Fase 1: Tremor violento de curto-circuito e pistões descontrolados
      // Fase 2: Explosão de vapor sob pressão e óleo
      // Fase 3: As pernas colapsam e a cabeça do martelo crava na terra
      const shudder = t < 0.45 ? (Math.sin(t * 50) * (1 - t) * 6) : 0;
      ctx.translate(shudder, t * 12);

      const mechCol = '#4b6584';
      const mechDark = '#2c3e50';

      // Chassi principal abatido
      ctx.fillStyle = mechCol;
      ctx.fillRect(-R * 0.75, -R * 0.5, R * 1.5, R * 0.9);
      ctx.strokeStyle = mechDark;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(-R * 0.75, -R * 0.5, R * 1.5, R * 0.9);

      // Martelo pneumático dianteiro despencando e cravando no solo
      ctx.save();
      ctx.translate(R * 0.6 + t * 8, t * 10);
      ctx.rotate(t * 0.7);
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(-6, -R * 0.7, 12, R * 1.4);
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(-8, R * 0.4, 16, 12);
      ctx.restore();

      // Jatos de vapor branco de alta pressão e estilhaços de faísca
      if (t > 0.2) {
        ctx.fillStyle = 'rgba(236, 240, 241, 0.8)';
        for (let s = 0; s < 5; s++) {
          const sa = s * 1.25 + t * 3;
          const sd = R * (0.3 + (t - 0.2) * 1.8);
          ctx.beginPath();
          ctx.arc(Math.cos(sa) * sd, -R * 0.4 + Math.sin(sa) * (sd * 0.7), 4 + s * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(R * 0.2 + (Math.random() - 0.5) * 12, -R * 0.2 + (Math.random() - 0.5) * 12, 3, 3);
      }
      break;
    }

    // =========================================================================
    // 4. COLOSSO FERRUGINOSO (RUST_COLOSSUS)
    // =========================================================================
    case 'RUST_COLOSSUS': {
      // Fase 1: Chaminés expelem nuvem negra e fornalha abre com luz branca
      // Fase 2: Braços de pedra/ferro despencam em direções opostas
      // Fase 3: O torso de fornalha racha ao meio desabando em pilha de sucata
      ctx.translate(0, t * 14);

      const rustBase = '#b33927';
      const rustDark = '#533422';

      // Chaminés traseiras tombando e soltando fumaça densa
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.8 - t * 8, -R * 0.9 - t * 4, 10, R * 0.6);
      ctx.fillRect(-R * 0.4 - t * 4, -R * 0.95 - t * 6, 10, R * 0.65);

      // Fumaça espessa de fuligem
      ctx.fillStyle = 'rgba(45, 52, 54, 0.75)';
      for (let f = 0; f < 4; f++) {
        const fa = f * 1.6 + t * 2;
        const fy = -R * 0.8 - t * 20 - f * 6;
        ctx.beginPath();
        ctx.arc(-R * 0.6 + Math.sin(fa) * 10, fy, 6 + f * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Torso rachando em dois blocos monolíticos
      ctx.fillStyle = rustBase;
      ctx.fillRect(-R * 0.8 - t * 10, -R * 0.4, R * 0.75, R * 0.9);
      ctx.fillRect(t * 10, -R * 0.4, R * 0.75, R * 0.9);
      ctx.strokeStyle = rustDark;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-R * 0.8 - t * 10, -R * 0.4, R * 0.75, R * 0.9);
      ctx.strokeRect(t * 10, -R * 0.4, R * 0.75, R * 0.9);

      // Braço esquerdo de rocha caindo
      ctx.save();
      ctx.translate(-R * 1.1 - t * 14, t * 8);
      ctx.rotate(-t * 0.8);
      ctx.fillStyle = '#636e72';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Fornalha incandescente esfriando no centro
      if (t < 0.7) {
        ctx.fillStyle = t < 0.35 ? '#ffffff' : '#d35400';
        ctx.beginPath();
        ctx.arc(0, -R * 0.1, R * 0.3 * (1 - t * 1.2), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // =========================================================================
    // 5. GÁRGULA DE SANGUE (BLOOD_GARGOYLE)
    // =========================================================================
    case 'BLOOD_GARGOYLE': {
      // Fase 1: Asas de morcego rasgam e ela despenca girando em espiral
      // Fase 2: O coração de sangue cristalizado no peito estilhaça em rubis
      // Fase 3: O corpo vira pedra cinzenta e fragmenta no solo
      ctx.translate(0, t * 20);
      ctx.rotate(t * 0.85);

      const isPetrified = t > 0.45;
      const bodyCol = isPetrified ? '#57606f' : '#3d161d';
      const wingCol = isPetrified ? '#2f3542' : '#8b0000';

      // Asas membranosas rasgadas
      ctx.fillStyle = wingCol;
      ctx.beginPath();
      ctx.moveTo(-R * 1.4 * (1 - t * 0.5), -R * 0.6);
      ctx.lineTo(-R * 0.4, -R * 0.2);
      ctx.lineTo(0, R * 0.3);
      ctx.lineTo(-R * 0.8, R * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(R * 1.4 * (1 - t * 0.5), -R * 0.6);
      ctx.lineTo(R * 0.4, -R * 0.2);
      ctx.lineTo(0, R * 0.3);
      ctx.lineTo(R * 0.8, R * 0.5);
      ctx.closePath();
      ctx.fill();

      // Corpo principal
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Estilhaçamento de rubis e cristais de sangue
      if (t > 0.3 && t < 0.85) {
        ctx.fillStyle = '#ff4757';
        for (let g = 0; g < 6; g++) {
          const ga = g * (Math.PI / 3) + t * 2.5;
          const gd = R * (0.4 + (t - 0.3) * 2.2);
          ctx.beginPath();
          ctx.moveTo(Math.cos(ga) * gd, Math.sin(ga) * gd);
          ctx.lineTo(Math.cos(ga + 0.3) * (gd + 5), Math.sin(ga + 0.3) * (gd + 5));
          ctx.lineTo(Math.cos(ga - 0.2) * (gd + 4), Math.sin(ga - 0.2) * (gd + 4));
          ctx.closePath();
          ctx.fill();
        }
      }
      break;
    }

    // =========================================================================
    // 6. PREDADOR ESPECTRAL (SPECTRAL_STALKER)
    // =========================================================================
    case 'SPECTRAL_STALKER': {
      // Fase 1: Distorção cromática em ecos espectrais (ciano e magenta)
      // Fase 2: Foices fantasmas se dissolvem em pó violeta
      // Fase 3: Mini-buraco de névoa escura suga a silhueta em espiral
      const chromaticOffset = (1 - t) * 8;
      const swirl = t * Math.PI * 2;
      ctx.rotate(swirl * 0.25);

      // Eco Espectral Ciano
      ctx.save();
      ctx.translate(-chromaticOffset, 0);
      ctx.globalAlpha = bodyAlpha * 0.45;
      ctx.fillStyle = '#00d2d3';
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 0.55, R * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Eco Espectral Magenta
      ctx.save();
      ctx.translate(chromaticOffset, 0);
      ctx.globalAlpha = bodyAlpha * 0.45;
      ctx.fillStyle = '#e056fd';
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 0.55, R * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Corpo Central em Roxo Profundo com Sorvedouro
      ctx.fillStyle = '#2c003e';
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(2, R * (0.6 - t * 0.5)), Math.max(2, R * (0.8 - t * 0.7)), 0, 0, Math.PI * 2);
      ctx.fill();

      // Fitas de névoa e fitas do manto girando em espiral
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 1.8;
      for (let w = 0; w < 4; w++) {
        const wa = swirl + w * (Math.PI / 2);
        const wd = R * (0.8 - t * 0.6);
        ctx.beginPath();
        ctx.arc(0, 0, wd, wa, wa + 1.2);
        ctx.stroke();
      }
      break;
    }

    // =========================================================================
    // 7. FATIADOR QUÂNTICO (QUANTUM_SLICER)
    // =========================================================================
    case 'QUANTUM_SLICER': {
      // Fase 1: Micro-blinks frenéticos em grade 3x3 deixando clones estáticos
      // Fase 2: Lâminas de plasma explodem em prismas de luz
      // Fase 3: As cópias colapsam para o centro numa fenda estelar brilhante
      const blinkStep = Math.sin(t * 32);
      const shiftX = (blinkStep > 0.4 ? 1 : (blinkStep < -0.4 ? -1 : 0)) * (1 - t) * 14;

      // Fantasmas de teleporte holográficos
      ctx.save();
      ctx.translate(-shiftX, 0);
      ctx.globalAlpha = bodyAlpha * 0.35;
      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(shiftX, 0);
      ctx.globalAlpha = bodyAlpha * 0.35;
      ctx.strokeStyle = '#e056fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Chassi central colapsando
      ctx.fillStyle = '#1e1a38';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, R * (0.55 - t * 0.45)), 0, Math.PI * 2);
      ctx.fill();

      // Lâminas de laser explodindo em prismas coloridos em expansão
      ctx.fillStyle = '#81ecec';
      for (let p = 0; p < 8; p++) {
        const pa = p * (Math.PI / 4) + t * 4;
        const pd = R * (0.5 + t * 2.0);
        ctx.fillRect(Math.cos(pa) * pd - 3, Math.sin(pa) * pd - 3, 6, 6);
      }
      break;
    }

    // =========================================================================
    // 8. TORRE MÓVEL (ARTILLERY_MECH)
    // =========================================================================
    case 'ARTILLERY_MECH': {
      // Fase 1: Recuo duplo dos canhões e antena de radar ejetada girando
      // Fase 2: Pernas de aranha mecânicas dobram e quebram
      // Fase 3: Detonação interna de munições com micro-estalos e queda da cúpula
      ctx.translate(0, t * 14);

      const mechDark = '#1e3799';

      // Antena de radar ejetada girando
      ctx.save();
      ctx.translate(R * 0.4 + t * 16, -R * 0.8 - t * 12);
      ctx.rotate(t * 6);
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 8, -0.6, 0.6);
      ctx.stroke();
      ctx.restore();

      // Pernas mecânicas quebradas esticadas no chão
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 2.4;
      for (let l = -1; l <= 1; l += 2) {
        ctx.beginPath();
        ctx.moveTo(0, l * R * 0.3);
        ctx.lineTo(-R * 0.7, l * (R * 0.8 + t * 8));
        ctx.lineTo(-R * 1.2, l * (R * 0.6 + t * 10));
        ctx.stroke();
      }

      // Cúpula central da torreta tombando de lado
      ctx.save();
      ctx.rotate(t * 0.35);
      ctx.fillStyle = mechDark;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Canhões duplos tombando
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(R * 0.3, -8, R * 0.7, 5);
      ctx.fillRect(R * 0.3, 3, R * 0.7, 5);
      ctx.restore();

      // Micro-estalos de munição explodindo internamente
      if (t > 0.25 && t < 0.75) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, 4, 4);
        ctx.fillStyle = '#ff4757';
        ctx.fillRect((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, 3, 3);
      }
      break;
    }

    // =========================================================================
    // 9. INCINERADOR INSTÁVEL (FIRE_INCINERATOR)
    // =========================================================================
    case 'FIRE_INCINERATOR': {
      // Fase 1: Caldeira estufa e vibra; rebites saltam
      // Fase 2: Costuras rompem com labareda vertical e vazamento de lava
      // Fase 3: Caldeirão colapsa num bloco de escória vulcânica negra
      const swell = 1 + Math.sin(t * Math.PI) * 0.35;
      ctx.scale(swell, swell);
      ctx.translate(0, t * 10);

      const boilerCol = '#d35400';

      // Chassi do caldeirão tombando
      ctx.fillStyle = t > 0.6 ? '#2d3436' : boilerCol;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Coluna vertical de fogo e lava ejetada
      if (t > 0.15) {
        ctx.fillStyle = t < 0.5 ? '#f1c40f' : '#e67e22';
        ctx.beginPath();
        ctx.moveTo(-R * 0.4, -R * 0.5);
        ctx.lineTo(0, -R * 0.5 - t * 28);
        ctx.lineTo(R * 0.4, -R * 0.5);
        ctx.closePath();
        ctx.fill();

        // Gotas de lava incandescentes espirrando
        ctx.fillStyle = '#ff7675';
        for (let dr = 0; dr < 6; dr++) {
          const dra = dr * 1.05 + t * 2.5;
          const drd = R * (0.6 + (t - 0.15) * 2.0);
          ctx.fillRect(Math.cos(dra) * drd - 2.5, Math.sin(dra) * (drd * 0.7) - 2.5, 5, 5);
        }
      }
      break;
    }

    // =========================================================================
    // 10. CAPITÃO DE CERCO (SIEGE_CAPTAIN)
    // =========================================================================
    case 'SIEGE_CAPTAIN': {
      // Fase 1: Esteiras rompem e desenrolam; morteiro dispara contragolpe
      // Fase 2: Escotilha da torreta voa em bola de fogo
      // Fase 3: Blindado tomba de lado vazando fumaça e óleo diesel
      ctx.translate(0, t * 12);
      ctx.rotate(t * 0.4);

      const hullCol = '#b71540';

      // Esteiras de blindado arrebentadas
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-R * 1.3 - t * 10, R * 0.5);
      ctx.lineTo(R * 0.8, R * 0.5);
      ctx.stroke();

      // Casco blindado principal
      ctx.fillStyle = hullCol;
      ctx.fillRect(-R * 0.8, -R * 0.4, R * 1.5, R * 0.8);
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2.4;
      ctx.strokeRect(-R * 0.8, -R * 0.4, R * 1.5, R * 0.8);

      // Cano do morteiro quebrado apontando para baixo
      ctx.fillStyle = '#1e272e';
      ctx.save();
      ctx.translate(R * 0.4, -R * 0.3);
      ctx.rotate(t * 1.2);
      ctx.fillRect(0, -5, R * 0.7, 10);
      ctx.restore();

      // Escotilha voando
      ctx.save();
      ctx.translate(-R * 0.2 - t * 14, -R * 0.8 - t * 16);
      ctx.rotate(-t * 4);
      ctx.fillStyle = '#718093';
      ctx.fillRect(-6, -3, 12, 6);
      ctx.restore();

      // Labareda e fumaça escapando da escotilha
      if (t > 0.2) {
        ctx.fillStyle = 'rgba(53, 59, 72, 0.7)';
        ctx.beginPath();
        ctx.arc(-R * 0.2, -R * 0.5 - t * 14, 8 + t * 8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // =========================================================================
    // 11. MATRIARCA PARASITA (BROOD_MATRIARCH)
    // =========================================================================
    case 'BROOD_MATRIARCH': {
      // Fase 1: Abdômen ciano convulsiona e mandíbulas tremem
      // Fase 2: Bolsa de ovos rompe expelindo jatos de fluido turquesa e vesículas
      // Fase 3: As 6 patas dobram para cima na postura de morte e o corpo derrete
      ctx.translate(0, t * 10);

      const chitinCol = '#006266';

      // 6 Patas aracnídeas curvando para cima (death curl)
      ctx.strokeStyle = '#004d40';
      ctx.lineWidth = 2.8;
      for (let p = -1; p <= 1; p += 2) {
        for (let leg = 0; leg < 3; leg++) {
          const lX = -R * 0.4 + leg * (R * 0.4);
          const curlY = -R * 0.8 * (1 - t * 0.3) - t * 8;
          ctx.beginPath();
          ctx.moveTo(lX, 0);
          ctx.lineTo(lX + p * (R * 0.7 * (1 - t * 0.6)), curlY);
          ctx.stroke();
        }
      }

      // Abdômen de ninho estourando e murchando
      const abdomenScale = Math.max(0.1, 1 - t * 0.85);
      ctx.fillStyle = chitinCol;
      ctx.beginPath();
      ctx.ellipse(-R * 0.4, 0, R * 0.7 * abdomenScale, R * 0.55 * abdomenScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cefalotórax frontal
      ctx.fillStyle = '#004d40';
      ctx.beginPath();
      ctx.arc(R * 0.3, 0, R * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Jato de linfa bioluminescente turquesa
      if (t > 0.25) {
        ctx.fillStyle = '#00cec9';
        for (let sp = 0; sp < 7; sp++) {
          const spa = sp * 0.9 + t * 3;
          const spd = R * (0.5 + (t - 0.25) * 2.0);
          ctx.beginPath();
          ctx.arc(Math.cos(spa) * spd, Math.sin(spa) * spd, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    // =========================================================================
    // 12. NINHO MÓVEL (MOBILE_HIVE)
    // =========================================================================
    case 'MOBILE_HIVE': {
      // Fase 1: Alvéolos hexagonais trincam e vazam néctar tóxico
      // Fase 2: Morcegos remanescentes fogem em pânico em todas as direções
      // Fase 3: A estrutura bio-orgânica parte em 3 blocos e desmancha em esporos
      ctx.translate(0, t * 12);

      const hiveCol = '#16a085';

      // 3 Blocos de favo se separando
      ctx.fillStyle = hiveCol;
      ctx.beginPath();
      ctx.arc(-R * 0.3 - t * 10, -t * 6, R * 0.4, 0, Math.PI * 2);
      ctx.arc(R * 0.3 + t * 10, -t * 6, R * 0.4, 0, Math.PI * 2);
      ctx.arc(0, t * 8, R * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Alvéolos escuros desfeitos
      ctx.fillStyle = '#0e4438';
      ctx.fillRect(-R * 0.2 - t * 6, -3, 6, 6);
      ctx.fillRect(R * 0.2 + t * 6, -3, 6, 6);

      // Silhuetas de mini-morcegos fugindo para o alto
      ctx.fillStyle = '#2c3e50';
      for (let b = 0; b < 4; b++) {
        const bx = -R * 0.6 + b * (R * 0.4) + Math.sin(t * 8 + b) * 8;
        const by = -R * 0.8 - t * 24 - b * 4;
        ctx.beginPath();
        ctx.moveTo(bx - 6, by - 2);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + 6, by - 2);
        ctx.stroke();
      }

      // Nuvem de esporos turquesa
      if (t > 0.35) {
        ctx.fillStyle = 'rgba(72, 219, 251, 0.7)';
        for (let ep = 0; ep < 6; ep++) {
          const epa = ep * 1.05 + t * 2;
          const epd = R * (0.4 + (t - 0.35) * 1.8);
          ctx.fillRect(Math.cos(epa) * epd - 2, Math.sin(epa) * epd - 2, 4, 4);
        }
      }
      break;
    }

    // =========================================================================
    // 13. ALTO SACERDOTE (HIGH_OCCULTIST)
    // =========================================================================
    case 'HIGH_OCCULTIST': {
      // Fase 1: Cessação de levitação, cai no solo com túnica ondulando
      // Fase 2: Orbes de gravidade orbitam em aceleração e convergem ao peito
      // Fase 3: As vestes colapsam num ponto singular de gravidade e glifos sobem
      ctx.translate(0, t * 16);

      const robeCol = '#2c003e';

      // Túnica cerimonial desabando
      ctx.fillStyle = robeCol;
      ctx.beginPath();
      ctx.moveTo(-R * 0.6 * (1 + t * 0.4), R * 0.8);
      ctx.lineTo(0, -R * 0.5 * (1 - t * 0.6));
      ctx.lineTo(R * 0.6 * (1 + t * 0.4), R * 0.8);
      ctx.closePath();
      ctx.fill();

      // Orbes de gravidade em espiral convergente para o centro
      const orbRadius = Math.max(1, R * (1.2 - t * 1.1));
      const orbSpin = t * Math.PI * 8;
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#9c88ff';
      ctx.lineWidth = 1.5;
      for (let o = 0; o < 3; o++) {
        const oa = orbSpin + o * (Math.PI * 2 / 3);
        const ox = Math.cos(oa) * orbRadius;
        const oy = Math.sin(oa) * (orbRadius * 0.5) - R * 0.1;
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Glifos cósmicos dourados ascendendo ao explodir o ponto singular
      if (t > 0.45) {
        ctx.fillStyle = '#f1c40f';
        for (let g = 0; g < 5; g++) {
          const ga = g * 1.3 + t * 3;
          const gy = -R * 0.2 - (t - 0.45) * 26 - g * 4;
          ctx.fillRect(Math.cos(ga) * 8 - 2, gy, 4, 4);
        }
      }
      break;
    }

    // =========================================================================
    // 14. GUARDIÃO RÚNICO (RUNIC_WARDEN)
    // =========================================================================
    case 'RUNIC_WARDEN': {
      // Fase 1: Escudos de safira orbitais quebram em prismas de vidro azul
      // Fase 2: Runas no monólito apagam progressivamente
      // Fase 3: O corpo central de basalto racha em pilares que tombam
      ctx.translate(0, t * 12);

      const stoneCol = '#2c3e50';

      // Fragmentos de cristais de barreira se dispersando
      ctx.fillStyle = '#0984e3';
      for (let cr = 0; cr < 6; cr++) {
        const cra = cr * (Math.PI / 3) + t * 2.2;
        const crd = R * (0.8 + t * 1.8);
        ctx.beginPath();
        ctx.moveTo(Math.cos(cra) * crd, Math.sin(cra) * crd);
        ctx.lineTo(Math.cos(cra + 0.3) * (crd + 6), Math.sin(cra + 0.3) * (crd + 6));
        ctx.lineTo(Math.cos(cra - 0.2) * (crd + 5), Math.sin(cra - 0.2) * (crd + 5));
        ctx.closePath();
        ctx.fill();
      }

      // Torso de basalto partindo em dois menires
      ctx.fillStyle = stoneCol;
      ctx.fillRect(-R * 0.65 - t * 8, -R * 0.6, R * 0.6, R * 1.2);
      ctx.fillRect(t * 8, -R * 0.6, R * 0.6, R * 1.2);
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-R * 0.65 - t * 8, -R * 0.6, R * 0.6, R * 1.2);
      ctx.strokeRect(t * 8, -R * 0.6, R * 0.6, R * 1.2);

      // Runas apagando do topo à base
      if (t < 0.6) {
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-R * 0.3, -R * 0.1);
        ctx.lineTo(0, R * 0.2);
        ctx.lineTo(R * 0.3, -R * 0.1);
        ctx.stroke();
      }
      break;
    }

    // =========================================================================
    // 15. PRECURSOR DO VAZIO (VOID_PRECURSOR)
    // =========================================================================
    case 'VOID_PRECURSOR': {
      // Fase 1: Disco de acreção inverte rotação e expande
      // Fase 2: Pulso gravitacional de sucção e clarão de supernova no núcleo
      // Fase 3: Implosão total em ponto negro com anel de choque violeta
      const pulseIn = t < 0.5 ? (1 + t * 0.6) : Math.max(0.02, 1.3 - (t - 0.5) * 2.6);

      // Anel de choque gravitacional em expansão
      ctx.strokeStyle = '#8e44ad';
      ctx.lineWidth = 2.5 * (1 - t);
      ctx.beginPath();
      ctx.arc(0, 0, R * (0.8 + t * 2.5), 0, Math.PI * 2);
      ctx.stroke();

      // Disco de acreção rodando velozmente
      ctx.strokeStyle = '#e056fd';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.2 * pulseIn, R * 0.45 * pulseIn, t * 8, 0, Math.PI * 2);
      ctx.stroke();

      // Núcleo do Horizonte de Eventos (Preto Absoluto -> Flash Branco -> Implosão)
      ctx.fillStyle = (t > 0.4 && t < 0.6) ? '#ffffff' : '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.75 * pulseIn, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      break;
    }

    // =========================================================================
    // 16. ARAUTO DO CAOS (CHAOS_HERALD)
    // =========================================================================
    case 'CHAOS_HERALD': {
      // Fase 1: 4 tentáculos abissais desintegram das pontas para a base
      // Fase 2: Olhos caóticos estouram em filamentos de éter rubro
      // Fase 3: Torso demoníaco torce sobre si mesmo sugado para fenda abissal
      const twist = t * Math.PI * 1.5;
      ctx.rotate(twist * 0.15);

      const demonCol = isEnraged ? '#d63031' : '#961b1b';

      // 4 Tentáculos encurtando e se desfazendo em brasas
      ctx.strokeStyle = demonCol;
      ctx.lineWidth = Math.max(1, 3.5 * (1 - t * 0.7));
      for (let tk = 0; tk < 4; tk++) {
        const ta = tk * (Math.PI / 2) + t * 1.5;
        const reach = R * (1.2 * Math.max(0.1, 1 - t * 0.9));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(Math.cos(ta + 0.4) * (reach * 0.6), Math.sin(ta + 0.4) * (reach * 0.6), Math.cos(ta) * reach, Math.sin(ta) * reach);
        ctx.stroke();
      }

      // Corpo demoníaco central torcendo e contraindo
      const bodyScale = Math.max(0.05, 1 - t * 0.9);
      ctx.scale(bodyScale, bodyScale);
      ctx.fillStyle = demonCol;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Olhos caóticos explodindo em filamentos rubros
      if (t > 0.25) {
        ctx.fillStyle = '#ff4757';
        for (let eye = 0; eye < 8; eye++) {
          const ea = eye * (Math.PI / 4) + t * 3;
          const ed = R * (0.4 + (t - 0.25) * 2.2);
          ctx.fillRect(Math.cos(ea) * ed - 2.5, Math.sin(ea) * ed - 2.5, 5, 5);
        }
      }
      break;
    }

    default: {
      ctx.scale(1, Math.max(0.05, 1 - t));
      ctx.fillStyle = eliteColor;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}
