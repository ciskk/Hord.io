/**
 * src/render/minibossesRenderer.js
 * 
 * Módulo especializado na renderização procedural dos 16 arquétipos de Minibosses
 * e do glifo de solo de alta ameaça rúnica.
 */
import { ctx, frameCount } from '../main.js';

/**
 * Glifo de Ameaça Rúnico desenhado no solo sob os pés do Miniboss.
 * @param {number} R Raio de colisão do monstro
 * @param {string} color Cor base/elite do monstro
 * @param {boolean} isHit Flag indicando se está em flash de dano
 */
export function drawThreatGlyph(R, color, isHit) {
  const glyphPulse = Math.sin(frameCount * 0.1) * 2;
  const glyphCol = isHit ? '#ffffff' : color;

  ctx.save();
  ctx.strokeStyle = glyphCol;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.78, R * 1.25 + glyphPulse, R * 0.46 + glyphPulse * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  const count = 6;
  const rot = frameCount * 0.03;
  ctx.lineWidth = 2;
  for (let i = 0; i < count; i++) {
    const a = rot + (i * Math.PI * 2) / count;
    const gx = Math.cos(a) * (R * 1.25 + glyphPulse);
    const gy = R * 0.78 + Math.sin(a) * (R * 0.46 + glyphPulse * 0.35);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.cos(a) * 4, gy + Math.sin(a) * 2.5);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renderizador Procedural Modular dos 16 Minibosses por Arquétipo.
 * @param {Object} e Entidade do Miniboss
 */
export function drawMiniBossShape(e) {
  const R = e.radius;
  const isHit = e.hitFlash > 0;
  const eliteColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (e.color || '#f39c12'));

  drawThreatGlyph(R, eliteColor, isHit);

  switch (e.baseType) {
    case 'ZOMBIE_ALPHA': {
      const stepBob = Math.sin(frameCount * 0.14) * 3;
      const armSwing = Math.sin(frameCount * 0.14) * 5;
      const skinColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e392a');
      const veinColor = isHit ? '#ffffff' : '#2ecc71';

      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.moveTo(-R * 0.85, -R * 0.35 + stepBob);
      ctx.lineTo(R * 0.85, -R * 0.35 + stepBob);
      ctx.lineTo(R * 0.55, R * 0.65 + stepBob);
      ctx.lineTo(-R * 0.55, R * 0.65 + stepBob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0d1f14';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = veinColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-R * 0.4, -R * 0.1 + stepBob);
      ctx.lineTo(-R * 0.1, R * 0.15 + stepBob);
      ctx.lineTo(R * 0.25, -R * 0.05 + stepBob);
      ctx.lineTo(R * 0.45, R * 0.35 + stepBob);
      ctx.stroke();

      ctx.fillStyle = isHit ? '#ffffff' : '#14291c';
      ctx.beginPath();
      ctx.arc(R * 0.2, -R * 0.55 + stepBob, R * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff3838';
      ctx.fillRect(R * 0.3, -R * 0.65 + stepBob, 4.5, 3.5);

      ctx.fillStyle = skinColor;
      ctx.strokeStyle = '#0d1f14';
      ctx.lineWidth = 2;

      const f1X = R * 0.8;
      const f1Y = R * 0.2 + armSwing + stepBob;
      ctx.beginPath();
      ctx.arc(f1X, f1Y, R * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const f2X = -R * 0.8;
      const f2Y = R * 0.2 - armSwing + stepBob;
      ctx.beginPath();
      ctx.arc(f2X, f2Y, R * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = isHit ? '#ffffff' : '#bdc3c7';
      ctx.lineWidth = 2.5;
      const sway = Math.sin(frameCount * 0.15) * 4;
      ctx.beginPath();
      ctx.moveTo(f1X, f1Y + R * 0.2);
      ctx.lineTo(f1X + sway, f1Y + R * 0.55);
      ctx.lineTo(f1X + sway - 2, f1Y + R * 0.85);
      ctx.moveTo(f2X, f2Y + R * 0.2);
      ctx.lineTo(f2X - sway, f2Y + R * 0.55);
      ctx.lineTo(f2X - sway + 2, f2Y + R * 0.85);
      ctx.stroke();
      break;
    }

    case 'PHALANX_LEADER': {
      const step = Math.sin(frameCount * 0.12) * 2;
      const steelCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#57606f');
      const goldTrim = isHit ? '#ffffff' : '#f1c40f';

      ctx.strokeStyle = isHit ? '#ffffff' : '#dfe4ea';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-R * 0.2, -R * 0.1 + step);
      ctx.lineTo(R * 1.35, -R * 0.5 + step);
      ctx.stroke();
      ctx.fillStyle = goldTrim;
      ctx.beginPath();
      ctx.moveTo(R * 1.35, -R * 0.5 + step);
      ctx.lineTo(R * 1.15, -R * 0.65 + step);
      ctx.lineTo(R * 1.55, -R * 0.5 + step);
      ctx.lineTo(R * 1.15, -R * 0.35 + step);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = steelCol;
      ctx.fillRect(-R * 0.6, -R * 0.45 + step, R * 0.9, R * 0.95);
      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 2;
      ctx.strokeRect(-R * 0.6, -R * 0.45 + step, R * 0.9, R * 0.95);

      ctx.fillStyle = isHit ? '#ffffff' : '#2f3542';
      ctx.beginPath();
      ctx.arc(-R * 0.15, -R * 0.6 + step, R * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-R * 0.3, -R * 1.05 + step, R * 0.5, 5);

      const shX = R * 0.35;
      const shY = -R * 0.85 + step;
      const shW = R * 0.55;
      const shH = R * 1.7;

      ctx.fillStyle = isHit ? '#ffffff' : '#2f3542';
      ctx.fillRect(shX, shY, shW, shH);
      ctx.strokeStyle = goldTrim;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(shX, shY, shW, shH);

      ctx.fillStyle = goldTrim;
      ctx.fillRect(shX + shW * 0.4, shY + shH * 0.2, 4, shH * 0.6);
      ctx.fillRect(shX + shW * 0.15, shY + shH * 0.45, shW * 0.7, 4);
      break;
    }

    case 'SEISMIC_SMASHER': {
      const step = Math.sin(frameCount * 0.1) * 2;
      const isChargingSlam = (e.slamTimer && e.slamTimer > 80);
      const vibrate = isChargingSlam ? (Math.random() - 0.5) * 4 : 0;
      const mechCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4b6584');

      ctx.fillStyle = mechCol;
      ctx.beginPath();
      ctx.moveTo(-R * 0.75, -R * 0.5 + step);
      ctx.lineTo(R * 0.75, -R * 0.5 + step);
      ctx.lineTo(R * 0.5, R * 0.6 + step);
      ctx.lineTo(-R * 0.5, R * 0.6 + step);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.25, -R * 0.8 + step, R * 0.5, R * 0.35);
      ctx.fillStyle = isChargingSlam ? '#f1c40f' : '#e67e22';
      ctx.fillRect(-R * 0.2, -R * 0.7 + step, R * 0.4, 3.5);

      const hammerLift = isChargingSlam ? -R * 0.6 : R * 0.1;
      const h1X = R * 0.85 + vibrate;
      const h1Y = hammerLift + step + vibrate;
      const h2X = -R * 0.85 + vibrate;
      const h2Y = hammerLift + step - vibrate;

      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(R * 0.4, 0);
      ctx.lineTo(h1X, h1Y);
      ctx.moveTo(-R * 0.4, 0);
      ctx.lineTo(h2X, h2Y);
      ctx.stroke();

      ctx.fillStyle = isHit ? '#ffffff' : '#34495e';
      ctx.fillRect(h1X - 8, h1Y - 14, 16, 28);
      ctx.fillRect(h2X - 8, h2Y - 14, 16, 28);
      ctx.strokeStyle = isChargingSlam ? '#f1c40f' : '#7f8c8d';
      ctx.lineWidth = 2;
      ctx.strokeRect(h1X - 8, h1Y - 14, 16, 28);
      ctx.strokeRect(h2X - 8, h2Y - 14, 16, 28);

      if (isChargingSlam && Math.floor(frameCount) % 2 === 0) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(h1X + (Math.random() - 0.5) * 20, h1Y + (Math.random() - 0.5) * 20, 3, 3);
        ctx.fillRect(h2X + (Math.random() - 0.5) * 20, h2Y + (Math.random() - 0.5) * 20, 3, 3);
      }
      break;
    }

    case 'RUST_COLOSSUS': {
      const step = Math.sin(frameCount * 0.09) * 2.5;
      const rustBase = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#b33927');
      const rustDark = isHit ? '#ffffff' : '#533422';

      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.65, -R * 0.95 + step, 8, 16);
      if (Math.floor(frameCount) % 4 === 0) {
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-R * 0.65 + (Math.random() - 0.5) * 4, -R * 1.1 + step, 4, 4);
      }

      ctx.fillStyle = rustBase;
      ctx.beginPath();
      ctx.moveTo(-R * 0.85, -R * 0.45 + step);
      ctx.lineTo(R * 0.85, -R * 0.5 + step);
      ctx.lineTo(R * 0.6, R * 0.7 + step);
      ctx.lineTo(-R * 0.6, R * 0.7 + step);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rustDark;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#f7d794';
      for (let rv = -3; rv <= 3; rv++) {
        ctx.fillRect(rv * (R * 0.22) - 1.5, -R * 0.4 + step, 3, 3);
      }

      ctx.fillStyle = rustDark;
      ctx.fillRect(-R * 0.25, -R * 0.75 + step, R * 0.5, R * 0.3);
      ctx.fillStyle = '#ff7675';
      ctx.fillRect(-R * 0.18, -R * 0.68 + step, R * 0.36, 3);

      const furnacePulse = (Math.sin(frameCount * 0.16) + 1) * 0.5;
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.35, -R * 0.15 + step, R * 0.7, R * 0.5);

      ctx.fillStyle = furnacePulse > 0.4 ? '#f1c40f' : '#e67e22';
      ctx.fillRect(-R * 0.28, -R * 0.1 + step, R * 0.56, R * 0.4);

      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-R * 0.1, -R * 0.1 + step);
      ctx.lineTo(-R * 0.1, R * 0.3 + step);
      ctx.moveTo(R * 0.1, -R * 0.1 + step);
      ctx.lineTo(R * 0.1, R * 0.3 + step);
      ctx.stroke();
      break;
    }

    case 'BLOOD_GARGOYLE': {
      const wingFlap = Math.sin(frameCount * 0.28) * 16;
      const bodyCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4b6584');
      const wingMembrane = isHit ? '#ffffff' : '#8b0000';

      ctx.fillStyle = wingMembrane;
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-R * 0.2, -R * 0.2);
      ctx.lineTo(-R * 1.5, -R * 1.2 + wingFlap);
      ctx.lineTo(-R * 1.1, -R * 0.2 + wingFlap * 0.5);
      ctx.lineTo(-R * 1.35, R * 0.5 + wingFlap);
      ctx.lineTo(0, R * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(R * 0.2, -R * 0.2);
      ctx.lineTo(R * 1.5, -R * 1.2 + wingFlap);
      ctx.lineTo(R * 1.1, -R * 0.2 + wingFlap * 0.5);
      ctx.lineTo(R * 1.35, R * 0.5 + wingFlap);
      ctx.lineTo(0, R * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.7);
      ctx.lineTo(R * 0.45, R * 0.5);
      ctx.lineTo(0, R * 0.85);
      ctx.lineTo(-R * 0.45, R * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isHit ? '#ffffff' : '#2f3542';
      ctx.beginPath();
      ctx.arc(0, -R * 0.65, R * 0.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-R * 0.2, -R * 0.8);
      ctx.lineTo(-R * 0.45, -R * 1.25);
      ctx.moveTo(R * 0.2, -R * 0.8);
      ctx.lineTo(R * 0.45, -R * 1.25);
      ctx.stroke();

      ctx.fillStyle = '#ff1744';
      ctx.fillRect(-R * 0.18, -R * 0.72, 3.5, 3.5);
      ctx.fillRect(R * 0.05, -R * 0.72, 3.5, 3.5);
      break;
    }

    case 'SPECTRAL_STALKER': {
      const isAiming = e.dashState === 'aim';
      const isDashing = e.dashState === 'dashing';
      const wave = Math.sin(frameCount * 0.2) * 5;
      const shadowCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#341f97');
      const daggerCol = isHit ? '#ffffff' : (isAiming ? '#e74c3c' : '#00cec9');

      ctx.fillStyle = shadowCol;
      ctx.beginPath();
      ctx.moveTo(R * 0.35, -R * 0.6);
      ctx.lineTo(R * 0.45, 0);
      ctx.lineTo(R * 0.15, R * 0.6);
      ctx.lineTo(-R * 1.1 + (isDashing ? -10 : 0), wave);
      ctx.lineTo(-R * 0.45, -R * 0.45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isHit ? '#ffffff' : '#090810';
      ctx.beginPath();
      ctx.moveTo(R * 0.55, 0);
      ctx.lineTo(R * 0.15, -R * 0.5);
      ctx.lineTo(0, 0);
      ctx.lineTo(R * 0.15, R * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#a29bfe';
      ctx.fillRect(R * 0.22, -R * 0.22, 3.5, 2.5);
      ctx.fillRect(R * 0.22, R * 0.08, 3.5, 2.5);

      ctx.strokeStyle = daggerCol;
      ctx.lineWidth = 2.5;

      if (isAiming) {
        for (let d = 0; d < 4; d++) {
          const dy = (d - 1.5) * 9;
          ctx.beginPath();
          ctx.moveTo(R * 0.4, dy);
          ctx.lineTo(R * 1.35, dy * 0.5);
          ctx.stroke();
        }
      } else if (isDashing) {
        for (let d = 0; d < 4; d++) {
          const dy = (d < 2 ? -1 : 1) * (d % 2 === 0 ? 8 : 16);
          ctx.beginPath();
          ctx.moveTo(R * 0.3, dy * 0.5);
          ctx.lineTo(-R * 1.2, dy);
          ctx.stroke();
        }
      } else {
        for (let d = 0; d < 4; d++) {
          const dAng = frameCount * 0.08 + (d * Math.PI / 2);
          const dx = Math.cos(dAng) * (R * 1.2);
          const dy = Math.sin(dAng) * (R * 0.7);
          ctx.save();
          ctx.translate(dx, dy);
          ctx.rotate(dAng + Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, -7);
          ctx.lineTo(3, 7);
          ctx.lineTo(-3, 7);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
      }
      break;
    }

    case 'QUANTUM_SLICER': {
      const slicerCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#6c5ce7');
      const bladeCol = isHit ? '#ffffff' : '#e056fd';

      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = slicerCol;
      const ghostOffset = Math.sin(frameCount * 0.2) * 8;
      ctx.beginPath();
      ctx.ellipse(-ghostOffset, 0, R * 0.6, R * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = slicerCol;
      ctx.beginPath();
      ctx.moveTo(R * 0.6, 0);
      ctx.lineTo(R * 0.1, -R * 0.6);
      ctx.lineTo(-R * 0.6, -R * 0.4);
      ctx.lineTo(-R * 0.4, 0);
      ctx.lineTo(-R * 0.6, R * 0.4);
      ctx.lineTo(R * 0.1, R * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#00d2d3';
      ctx.fillRect(R * 0.2, -3, 8, 6);

      const bladePulse = Math.sin(frameCount * 0.3) * 3;
      ctx.strokeStyle = bladeCol;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(R * 0.2, -R * 0.5);
      ctx.lineTo(R * 1.35 + bladePulse, -R * 0.7);
      ctx.moveTo(R * 0.2, R * 0.5);
      ctx.lineTo(R * 1.35 + bladePulse, R * 0.7);
      ctx.stroke();
      break;
    }

    case 'ARTILLERY_MECH': {
      const isShootingRecoil = (e.shootTimer && e.shootTimer > 95) ? -6 : 0;
      const mechDark = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e3799');

      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 3.5;
      const legP = [[-R * 0.8, -R * 0.8], [R * 0.7, -R * 0.8], [-R * 0.8, R * 0.8], [R * 0.7, R * 0.8]];
      for (let lp = 0; lp < 4; lp++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(legP[lp][0], legP[lp][1]);
        ctx.stroke();
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(legP[lp][0] - 4, legP[lp][1] - 4, 8, 8);
      }

      ctx.fillStyle = mechDark;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a69bd';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#2d3436';
      ctx.fillRect(R * 0.2 + isShootingRecoil, -R * 0.25, R * 1.1, 5);
      ctx.fillRect(R * 0.2 + isShootingRecoil, R * 0.1, R * 1.1, 5);

      ctx.strokeStyle = 'rgba(255, 56, 56, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(R * 1.3 + isShootingRecoil, -R * 0.25);
      ctx.lineTo(R * 3.2, -R * 0.25);
      ctx.stroke();

      ctx.fillStyle = '#00d2d3';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'FIRE_INCINERATOR': {
      const boilPulse = Math.sin(frameCount * 0.25) * 2;
      const boilerCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#d35400');

      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.9, -R * 0.7, 7, 14);
      ctx.fillRect(-R * 0.9, R * 0.3, 7, 14);

      if (Math.floor(frameCount) % 3 === 0) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-R * 1.2 - Math.random() * 4, -R * 0.65 + (Math.random() - 0.5) * 6, 3, 3);
        ctx.fillRect(-R * 1.2 - Math.random() * 4, R * 0.35 + (Math.random() - 0.5) * 6, 3, 3);
      }

      ctx.fillStyle = boilerCol;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.8 + boilPulse * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.8, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();

      ctx.fillStyle = '#1e272e';
      ctx.fillRect(R * 0.15, -R * 0.35, R * 0.45, R * 0.7);

      const fireShift = Math.sin(frameCount * 0.3) * 2;
      ctx.fillStyle = fireShift > 0 ? '#f1c40f' : '#e74c3c';
      ctx.fillRect(R * 0.22, -R * 0.25, R * 0.32, R * 0.5);

      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(R * 0.3, -R * 0.35);
      ctx.lineTo(R * 0.3, R * 0.35);
      ctx.moveTo(R * 0.45, -R * 0.35);
      ctx.lineTo(R * 0.45, R * 0.35);
      ctx.stroke();
      break;
    }

    case 'SIEGE_CAPTAIN': {
      const isMortarRecoil = (e.mortarTimer && e.mortarTimer > 120) ? -5 : 0;
      const hullCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#b71540');

      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.8, -R * 0.85, R * 1.6, 12);
      ctx.fillRect(-R * 0.8, R * 0.55, R * 1.6, 12);

      ctx.fillStyle = hullCol;
      ctx.beginPath();
      ctx.moveTo(-R * 0.65, -R * 0.6);
      ctx.lineTo(R * 0.65, -R * 0.6);
      ctx.lineTo(R * 0.85, 0);
      ctx.lineTo(R * 0.65, R * 0.6);
      ctx.lineTo(-R * 0.65, R * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4a0e17';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(isMortarRecoil * 0.7, 0);
      ctx.rotate(-0.65);
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(0, -8, R * 1.2, 16);
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, -8, R * 1.2, 16);

      if (isMortarRecoil < 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(R * 1.35, 0, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = Math.floor(frameCount / 8) % 2 === 0 ? '#ff3838' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(-R * 0.25, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'BROOD_MATRIARCH': {
      const pinch = Math.sin(frameCount * 0.18) * 3.5;
      const chitinCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#006266');

      ctx.strokeStyle = isHit ? '#ffffff' : '#004d40';
      ctx.lineWidth = 2.5;
      for (let p = 0; p < 3; p++) {
        const stepA = Math.sin(frameCount * 0.2 + p * 1.4) * 6;
        const px = -R * 0.3 + p * (R * 0.4);
        ctx.beginPath();
        ctx.moveTo(px, -R * 0.2);
        ctx.lineTo(px - 4, -R * 1.1 + stepA);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px, R * 0.2);
        ctx.lineTo(px - 4, R * 1.1 - stepA);
        ctx.stroke();
      }

      ctx.fillStyle = isHit ? '#ffffff' : 'rgba(0, 206, 201, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-R * 0.75, 0, R * 0.85, R * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = chitinCol;
      ctx.lineWidth = 2;
      ctx.stroke();

      const eggPulse = Math.sin(frameCount * 0.12) * 1.5;
      ctx.fillStyle = '#2ecc71';
      const eggPos = [[-R * 0.95, -R * 0.2], [-R * 0.75, R * 0.2], [-R * 0.55, -R * 0.15], [-R * 0.85, R * 0.15]];
      for (let eg = 0; eg < 4; eg++) {
        ctx.beginPath();
        ctx.arc(eggPos[eg][0], eggPos[eg][1], 4 + (eg % 2 === 0 ? eggPulse : -eggPulse), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = chitinCol;
      ctx.beginPath();
      ctx.ellipse(R * 0.25, 0, R * 0.55, R * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.moveTo(R * 0.6, -R * 0.25);
      ctx.quadraticCurveTo(R * 1.1, -R * 0.45 + pinch, R * 1.25, -pinch);
      ctx.lineTo(R * 0.6, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(R * 0.6, R * 0.25);
      ctx.quadraticCurveTo(R * 1.1, R * 0.45 - pinch, R * 1.25, pinch);
      ctx.lineTo(R * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'MOBILE_HIVE': {
      const bioPulse = Math.sin(frameCount * 0.08) * 2.5;
      const hiveCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#16a085');

      ctx.fillStyle = hiveCol;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.95 - bioPulse);
      ctx.quadraticCurveTo(R * 0.95 + bioPulse, -R * 0.5, R * 0.8, R * 0.5);
      ctx.quadraticCurveTo(0, R * 1.1 + bioPulse, -R * 0.8, R * 0.5);
      ctx.quadraticCurveTo(-R * 0.95 - bioPulse, -R * 0.5, 0, -R * 0.95 - bioPulse);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0e6251';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#0b3b32';
      const hives = [[-R * 0.35, -R * 0.3], [R * 0.35, -R * 0.2], [-R * 0.1, R * 0.35], [R * 0.4, R * 0.3]];
      for (let h = 0; h < 4; h++) {
        ctx.beginPath();
        ctx.ellipse(hives[h][0], hives[h][1], 6, 4, h * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ff4757';
      for (let b = 0; b < 3; b++) {
        const bAng = frameCount * 0.09 + (b * Math.PI * 2 / 3);
        const bx = Math.cos(bAng) * (R * 1.25);
        const by = Math.sin(bAng) * (R * 0.85);
        const bFlap = Math.sin(frameCount * 0.4 + b) * 3;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - 4, by - 4 + bFlap);
        ctx.lineTo(bx + 4, by - 4 + bFlap);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'HIGH_OCCULTIST': {
      const hover = Math.sin(frameCount * 0.09) * 4;
      const drape = Math.sin(frameCount * 0.15) * 3;
      const robeCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2c003e');

      ctx.fillStyle = robeCol;
      ctx.beginPath();
      ctx.moveTo(-R * 0.45, -R * 0.65 + hover);
      ctx.lineTo(R * 0.45, -R * 0.65 + hover);
      ctx.lineTo(R * 0.65 + drape, R * 0.95 + hover);
      ctx.quadraticCurveTo(0, R * 0.75 + hover, -R * 0.65 - drape, R * 0.95 + hover);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = isHit ? '#ffffff' : '#f1c40f';
      ctx.beginPath();
      ctx.arc(0, -R * 0.55 + hover, R * 0.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e082b';
      ctx.fillRect(-R * 0.18, -R * 0.6 + hover, 4, 4);
      ctx.fillRect(R * 0.06, -R * 0.6 + hover, 4, 4);

      const isRitual = (e.ritualTimer && e.ritualTimer > 100);
      const stX = R * 0.85;
      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(stX, R * 0.8 + hover);
      ctx.lineTo(stX, -R * 1.05 + hover);
      ctx.stroke();

      ctx.fillStyle = isRitual ? '#ff4757' : '#a29bfe';
      ctx.beginPath();
      ctx.arc(stX, -R * 1.15 + hover, isRitual ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();

      for (let s = 0; s < 4; s++) {
        const sAng = frameCount * 0.04 + (s * Math.PI / 2);
        const sx = Math.cos(sAng) * (R * 0.85);
        const sy = R * 0.85 + hover + Math.sin(sAng) * 4;
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }
      break;
    }

    case 'RUNIC_WARDEN': {
      const stoneCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2c3e50');

      ctx.fillStyle = stoneCol;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.85);
      ctx.lineTo(R * 0.7, -R * 0.3);
      ctx.lineTo(R * 0.55, R * 0.75);
      ctx.lineTo(-R * 0.55, R * 0.75);
      ctx.lineTo(-R * 0.7, -R * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0984e3';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const manaPulse = (Math.sin(frameCount * 0.15) + 1) * 2;
      ctx.fillStyle = isHit ? '#ffffff' : '#00d2d3';
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.3 - manaPulse);
      ctx.lineTo(R * 0.28 + manaPulse, 0);
      ctx.lineTo(0, R * 0.3 + manaPulse);
      ctx.lineTo(-R * 0.28 - manaPulse, 0);
      ctx.closePath();
      ctx.fill();

      for (let r = 0; r < 3; r++) {
        const rAng = frameCount * 0.035 + (r * Math.PI * 2 / 3);
        const rx = Math.cos(rAng) * (R * 1.35);
        const ry = Math.sin(rAng) * (R * 0.8);

        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(frameCount * 0.05);
        ctx.fillStyle = 'rgba(9, 132, 227, 0.45)';
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let h = 0; h < 6; h++) {
          const ha = h * Math.PI / 3;
          const hx = Math.cos(ha) * 7.5;
          const hy = Math.sin(ha) * 7.5;
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

    case 'VOID_PRECURSOR': {
      ctx.fillStyle = isHit ? '#ffffff' : '#08010f';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8e44ad';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(142, 68, 173, 0.65)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.35, R * 0.55, frameCount * 0.04, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(232, 67, 147, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.2, R * 0.5, -frameCount * 0.035, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(0, 206, 201, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.05, R * 0.42, frameCount * 0.06, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#a29bfe';
      for (let f = 0; f < 3; f++) {
        const fa = frameCount * 0.05 + f * 2.1;
        ctx.fillRect(Math.cos(fa) * (R * 0.9) - 2, Math.sin(fa) * (R * 0.9) - 2, 4, 4);
      }
      break;
    }

    case 'CHAOS_HERALD': {
      const chaosWave = Math.sin(frameCount * 0.16) * 5;
      const demonCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#961b1b');

      ctx.strokeStyle = demonCol;
      ctx.lineWidth = 3.5;
      for (let t = 0; t < 4; t++) {
        const tWave = Math.sin(frameCount * 0.18 + t * 1.5) * 8;
        const tx = (t - 1.5) * (R * 0.4);
        ctx.beginPath();
        ctx.moveTo(tx, R * 0.4);
        ctx.quadraticCurveTo(tx + tWave, R * 0.8, tx - tWave * 0.5, R * 1.25);
        ctx.stroke();
      }

      ctx.fillStyle = demonCol;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2c0c16';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = '#1e080d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-R * 0.4, -R * 0.4);
      ctx.quadraticCurveTo(-R * 0.9, -R * 1.1 + chaosWave, -R * 1.35, -R * 0.8);
      ctx.moveTo(R * 0.4, -R * 0.4);
      ctx.quadraticCurveTo(R * 0.9, -R * 1.1 + chaosWave, R * 1.35, -R * 0.8);
      ctx.moveTo(-R * 0.25, -R * 0.6);
      ctx.quadraticCurveTo(-R * 0.6, -R * 1.4, -R * 0.75, -R * 1.6);
      ctx.moveTo(R * 0.25, -R * 0.6);
      ctx.quadraticCurveTo(R * 0.6, -R * 1.4, R * 0.75, -R * 1.6);
      ctx.stroke();

      const eyeR = R * 0.32 + Math.sin(frameCount * 0.12) * 2;
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(0, -R * 0.05, eyeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0a0104';
      ctx.beginPath();
      ctx.ellipse(0, -R * 0.05, 3, eyeR * 0.8, 0, 0, Math.PI * 2);
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
