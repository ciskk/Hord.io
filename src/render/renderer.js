import { CHARACTERS } from '../config/characters.js';
import { player, selectedHeroKey } from '../entities/player.js';
import { stick } from '../core/input.js';
import { renderEnvironment } from './environment.js';
import { drawBoss } from '../entities/bosses/bossRegistry.js';
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
  bossTelegraphs,
  bossProjectiles,
  bossShockwaves,
  activeBoss,
  bullets,
  enemyBullets,
  enemies,
  particles,
  damageTexts,
  frameCount
} from '../main.js';

// Glifo de Ameaça Rúnico desenhado no solo sob os pés do Miniboss
function drawThreatGlyph(R, color, isHit) {
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

// Renderizador Procedural Modular dos 16 Minibosses por Arquétipo
function drawMiniBossShape(e) {
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

export function drawEnemyShape(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(e.facing, 1);

  if (e.stunTimer > 0) {
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    for (let s = 0; s < 3; s++) {
      const starAng = frameCount * 0.18 + s * (Math.PI * 2 / 3);
      const starR = e.radius + 8;
      const sx = Math.cos(starAng) * starR;
      const sy = Math.sin(starAng) * (starR * 0.45) - (e.radius + 12);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }
  }

  if (e.slowTimer > 0) {
    const pulseSlow = Math.sin(frameCount * 0.25) * 2;
    ctx.strokeStyle = '#74b9ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 4 + pulseSlow, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(116, 185, 255, 0.65)';
    for (let sp = 0; sp < 4; sp++) {
      const spAng = sp * (Math.PI / 2) + frameCount * 0.05;
      const spDist = e.radius + 5;
      ctx.fillRect(Math.cos(spAng) * spDist - 2, Math.sin(spAng) * spDist - 2, 4, 4);
    }
  }

  if (e.isElite) {
    const auraPulse = Math.sin(frameCount * 0.2) * 3;
    let aColor = '#00d2d3';
    if (e.eliteMod === 'HASTE') aColor = '#f1c40f';
    if (e.eliteMod === 'TOXIC') aColor = '#2ecc71';
    ctx.strokeStyle = aColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 6 + auraPulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (e.isMiniBoss) {
    const barW = 44;
    const barH = 5;
    const hpPct = Math.max(0, e.hp / e.maxHp);
    const offsetY = -e.radius - 14;

    ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
    ctx.fillRect(-barW / 2, offsetY, barW, barH);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(-barW / 2, offsetY, barW * hpPct, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, offsetY, barW, barH);

    ctx.strokeStyle = 'rgba(243, 156, 18, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (e.isBoss) {
    drawBoss(ctx, e, frameCount);
  } else if (e.isMiniBoss) {
    drawMiniBossShape(e);
  } else {
    const isHit = e.hitFlash > 0;
    const baseCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : e.color);

    if (e.baseType === 'ZOMBIE') {
      ctx.fillStyle = baseCol;
      ctx.beginPath();
      ctx.arc(0, -6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-5, -2, 9, 13);
      ctx.fillRect(2, -1, 11, 4);
      ctx.fillRect(11, 0, 3, 2);
      ctx.fillRect(-4, 11, 3, 6);
      ctx.fillRect(1, 10, 3, 7);
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(2, -7, 2, 2);
    } else if (e.baseType === 'BAT') {
      ctx.fillStyle = baseCol;
      const wingFlap = Math.sin(frameCount * 0.35) * 9;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-3, -1);
      ctx.lineTo(-14, -8 + wingFlap);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(3, -1);
      ctx.lineTo(14, -8 + wingFlap);
      ctx.lineTo(5, 5);
      ctx.closePath();
      ctx.fill();
    } else if (e.baseType === 'SHIELDED') {
      ctx.fillStyle = baseCol;
      ctx.beginPath();
      ctx.arc(-2, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dfe6e9';
      ctx.fillRect(8, -14, 6, 28);
      ctx.strokeStyle = '#636e72';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, -14, 6, 28);
      ctx.fillStyle = '#d63031';
      ctx.fillRect(9, -2, 4, 4);
    } else if (e.baseType === 'GOLEM') {
      const R_m = e.radius;
      const stoneDark = isHit ? '#ffffff' : '#2d3436';
      const stoneMid = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4b6584');
      const stoneLight = isHit ? '#ffffff' : '#778ca3';
      const runeGlow = isHit ? '#ffffff' : '#f39c12';
      const lavaColor = isHit ? '#ffffff' : '#e74c3c';

      const stepCycle = Math.sin(frameCount * 0.1);
      ctx.fillStyle = stoneDark;
      ctx.fillRect(-R_m * 0.65, R_m * 0.5 + stepCycle * 2.5, R_m * 0.45, R_m * 0.5);
      ctx.fillRect(R_m * 0.2, R_m * 0.5 - stepCycle * 2.5, R_m * 0.45, R_m * 0.5);

      ctx.fillStyle = stoneMid;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.85, -R_m * 0.4);
      ctx.lineTo(R_m * 0.85, -R_m * 0.45);
      ctx.lineTo(R_m * 0.55, R_m * 0.6);
      ctx.lineTo(-R_m * 0.55, R_m * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = stoneLight;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.75, -R_m * 0.35);
      ctx.lineTo(0, -R_m * 0.4);
      ctx.lineTo(-R_m * 0.1, R_m * 0.3);
      ctx.lineTo(-R_m * 0.5, R_m * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -R_m * 0.4);
      ctx.lineTo(R_m * 0.75, -R_m * 0.35);
      ctx.lineTo(R_m * 0.5, R_m * 0.25);
      ctx.lineTo(R_m * 0.05, R_m * 0.35);
      ctx.closePath();
      ctx.fill();

      const crackPulse = (Math.sin(frameCount * 0.12) + 1) * 0.5;
      ctx.strokeStyle = crackPulse > 0.4 ? runeGlow : lavaColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.1, -R_m * 0.3);
      ctx.lineTo(R_m * 0.15, -R_m * 0.05);
      ctx.lineTo(-R_m * 0.05, R_m * 0.2);
      ctx.lineTo(R_m * 0.2, R_m * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R_m * 0.15, -R_m * 0.05);
      ctx.lineTo(R_m * 0.4, 0);
      ctx.stroke();

      ctx.fillStyle = stoneDark;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.75);
      ctx.lineTo(R_m * 0.35, -R_m * 0.75);
      ctx.lineTo(R_m * 0.25, -R_m * 0.25);
      ctx.lineTo(-R_m * 0.25, -R_m * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = stoneLight;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = runeGlow;
      ctx.fillRect(-R_m * 0.2, -R_m * 0.55, R_m * 0.4, 3.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-R_m * 0.05, -R_m * 0.55, R_m * 0.15, 3.5);

      const fistBob = Math.sin(frameCount * 0.1) * (R_m * 0.25);
      ctx.fillStyle = stoneMid;
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(-R_m * 1.05, fistBob + 2, R_m * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(R_m * 1.05, -fistBob + 2, R_m * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (e.baseType === 'EXPLODER') {
      const R_m = e.radius;
      const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
      const urgency = Math.min(1, Math.max(0, 1 - distToPlayer / 260));
      const pulseSpeed = 0.12 + urgency * 0.35;
      const pustulePulse = Math.sin(frameCount * pulseSpeed) * (2.5 + urgency * 4);
      const heatPhase = (Math.sin(frameCount * pulseSpeed) + 1) * 0.5;

      const fleshColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4a2810');
      const fleshDark = isHit ? '#ffffff' : '#2c1508';
      const pustuleOuter = isHit ? '#ffffff' : (heatPhase > 0.4 ? '#e67e22' : '#c0392b');
      const pustuleInner = isHit ? '#ffffff' : (heatPhase > 0.6 ? '#f1c40f' : '#e67e22');

      const legWalk = Math.sin(frameCount * 0.25) * 6;
      ctx.strokeStyle = fleshDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, R_m * 0.2);
      ctx.lineTo(-R_m * 0.5 + legWalk, R_m * 0.6);
      ctx.lineTo(-R_m * 0.4 + legWalk, R_m * 0.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, R_m * 0.2);
      ctx.lineTo(R_m * 0.1 - legWalk, R_m * 0.6);
      ctx.lineTo(R_m * 0.3 - legWalk, R_m * 0.95);
      ctx.stroke();

      const pustuleR = (R_m * 0.75) + pustulePulse;
      ctx.fillStyle = pustuleOuter;
      ctx.beginPath();
      ctx.arc(-R_m * 0.45, -R_m * 0.4, pustuleR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pustuleInner;
      ctx.beginPath();
      ctx.arc(-R_m * 0.45, -R_m * 0.4, pustuleR * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-R_m * 0.55, -R_m * 0.5, pustuleR * 0.25, 0, Math.PI * 2);
      ctx.fill();

      if (Math.floor(frameCount + e.x) % 3 === 0) {
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(-R_m * 1.3 - Math.random() * 6, -R_m * 0.4 + (Math.random() - 0.5) * 12, 2.5, 2.5);
      }

      ctx.fillStyle = fleshColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.4, -R_m * 0.1);
      ctx.quadraticCurveTo(R_m * 0.1, -R_m * 0.7, R_m * 0.45, -R_m * 0.2);
      ctx.lineTo(R_m * 0.2, R_m * 0.45);
      ctx.lineTo(-R_m * 0.3, R_m * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = fleshDark;
      ctx.beginPath();
      ctx.arc(R_m * 0.6, -R_m * 0.1, R_m * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(R_m * 0.7, -R_m * 0.2, 3, 2.5);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(R_m * 0.65, 0, 4, 2);

      const armSway = Math.sin(frameCount * 0.2) * 3;
      ctx.strokeStyle = fleshColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.15, -R_m * 0.1);
      ctx.lineTo(R_m * 0.45 + armSway, R_m * 0.5);
      ctx.lineTo(R_m * 0.6 + armSway, R_m * 0.9);
      ctx.stroke();

      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.6 + armSway, R_m * 0.9);
      ctx.lineTo(R_m * 0.75 + armSway, R_m * 1.05);
      ctx.moveTo(R_m * 0.55 + armSway, R_m * 0.9);
      ctx.lineTo(R_m * 0.65 + armSway, R_m * 1.1);
      ctx.stroke();
    } else if (e.baseType === 'NECRO') {
      const R_m = e.radius;
      const hover = Math.sin(frameCount * 0.08) * 3.5;
      const wave1 = Math.sin(frameCount * 0.14) * 4;
      const wave2 = Math.cos(frameCount * 0.16) * 4;

      const robeColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e1b2e');
      const trimColor = isHit ? '#ffffff' : '#6c5ce7';
      const innerVoid = isHit ? '#ffffff' : '#090810';
      const eyeColor = isHit ? '#ffffff' : '#00cec9';

      ctx.fillStyle = robeColor;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, -R_m * 0.6 + hover);
      ctx.lineTo(R_m * 0.65, R_m * 0.7 + hover);
      ctx.quadraticCurveTo(R_m * 0.3 + wave2, R_m * 0.95 + hover, 0, R_m * 0.75 + hover);
      ctx.quadraticCurveTo(-R_m * 0.3 + wave1, R_m * 0.95 + hover, -R_m * 0.65, R_m * 0.7 + hover);
      ctx.lineTo(-R_m * 0.3, -R_m * 0.6 + hover);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = trimColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = trimColor;
      ctx.fillRect(-2, -R_m * 0.2 + hover, 4, R_m * 0.8);

      ctx.fillStyle = robeColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.5, -R_m * 0.75 + hover);
      ctx.lineTo(-R_m * 0.2, -R_m * 1.3 + hover);
      ctx.lineTo(R_m * 0.45, -R_m * 0.5 + hover);
      ctx.lineTo(R_m * 0.2, -R_m * 0.25 + hover);
      ctx.lineTo(-R_m * 0.4, -R_m * 0.3 + hover);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = innerVoid;
      ctx.beginPath();
      ctx.ellipse(R_m * 0.1, -R_m * 0.45 + hover, R_m * 0.32, R_m * 0.25, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = eyeColor;
      ctx.fillRect(R_m * 0.05, -R_m * 0.52 + hover, 3.5, 2);
      ctx.fillRect(R_m * 0.22, -R_m * 0.48 + hover, 3.5, 2);

      const staffX = R_m * 0.85;
      const staffTopY = -R_m * 1.1 + hover;
      const staffBotY = R_m * 0.8 + hover;

      ctx.strokeStyle = isHit ? '#ffffff' : '#8395a7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(staffX - 2, staffBotY);
      ctx.lineTo(staffX + 2, 0 + hover);
      ctx.lineTo(staffX, staffTopY);
      ctx.stroke();

      const summonRatio = Math.min(1, Math.max(0, (e.summonTimer || 0) / 230));
      const orbPulse = Math.sin(frameCount * (0.15 + summonRatio * 0.35)) * (2 + summonRatio * 4);
      const orbColor = summonRatio > 0.75 ? '#ff7675' : '#a29bfe';

      ctx.fillStyle = isHit ? '#ffffff' : orbColor;
      ctx.beginPath();
      ctx.arc(staffX, staffTopY - 6, Math.max(2, 4.5 + orbPulse), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isHit ? '#ffffff' : '#dfe6e9';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (summonRatio > 0.4) {
        ctx.strokeStyle = isHit ? '#ffffff' : '#fd79a8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(staffX, staffTopY - 6, 7 + orbPulse, 3, frameCount * 0.1, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (e.baseType === 'SHOOTER') {
      const R_m = e.radius;
      const armorBase = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2c3e50');
      const armorDark = isHit ? '#ffffff' : '#1e272e';
      const mechMetal = isHit ? '#ffffff' : '#7f8c8d';
      const visorGlow = isHit ? '#ffffff' : '#00cec9';

      const walkCycle = frameCount * 0.18;
      const legSwingA = Math.sin(walkCycle) * 7;
      const legSwingB = Math.sin(walkCycle + Math.PI) * 7;

      ctx.strokeStyle = mechMetal;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, R_m * 0.2);
      ctx.lineTo(-R_m * 0.45 + legSwingA * 0.4, R_m * 0.65);
      ctx.lineTo(-R_m * 0.5 + legSwingA, R_m * 1.05);
      ctx.stroke();
      ctx.fillStyle = armorDark;
      ctx.fillRect(-R_m * 0.65 + legSwingA, R_m * 1.0, 7, 3);

      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, R_m * 0.2);
      ctx.lineTo(R_m * 0.15 + legSwingB * 0.4, R_m * 0.65);
      ctx.lineTo(R_m * 0.3 + legSwingB, R_m * 1.05);
      ctx.stroke();
      ctx.fillRect(R_m * 0.15 + legSwingB, R_m * 1.0, 7, 3);

      ctx.fillStyle = armorBase;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.6, -R_m * 0.6);
      ctx.lineTo(R_m * 0.4, -R_m * 0.6);
      ctx.lineTo(R_m * 0.65, -R_m * 0.1);
      ctx.lineTo(R_m * 0.35, R_m * 0.45);
      ctx.lineTo(-R_m * 0.55, R_m * 0.45);
      ctx.lineTo(-R_m * 0.75, -R_m * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = armorDark;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = mechMetal;
      ctx.fillRect(-R_m * 0.4, -R_m * 0.4, R_m * 0.7, R_m * 0.4);

      ctx.fillStyle = armorDark;
      ctx.beginPath();
      ctx.ellipse(R_m * 0.2, -R_m * 0.1, R_m * 0.3, R_m * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = visorGlow;
      ctx.fillRect(R_m * 0.1, -R_m * 0.18, R_m * 0.25, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(R_m * 0.25, -R_m * 0.18, 2, 4);

      const isRecoil = (e.shootTimer > 95);
      const recoilX = isRecoil ? -4.5 : 0;

      ctx.fillStyle = armorDark;
      ctx.fillRect(-R_m * 0.2 + recoilX, -R_m * 0.85, R_m * 0.6, R_m * 0.35);

      ctx.fillStyle = mechMetal;
      ctx.fillRect(R_m * 0.4 + recoilX, -R_m * 0.85, R_m * 0.65, 3.5);
      ctx.fillRect(R_m * 0.4 + recoilX, -R_m * 0.65, R_m * 0.65, 3.5);

      if (e.shootTimer > 85) {
        ctx.fillStyle = '#ff7675';
        ctx.fillRect(R_m * 1.05 + recoilX, -R_m * 0.85, 3, 3.5);
        ctx.fillRect(R_m * 1.05 + recoilX, -R_m * 0.65, 3, 3.5);
      }
    } else if (e.baseType === 'STALKER') {
      const R_m = e.radius;
      const isAiming = e.dashState === 'aim';
      const isDashing = e.dashState === 'dashing';

      const stalkerColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4834d4');
      const mistColor = isHit ? '#ffffff' : '#686de0';
      const maskColor = isHit ? '#ffffff' : '#130f40';
      const eyeColor = isHit ? '#ffffff' : '#f9ca24';
      const bladeColor = isAiming ? '#e74c3c' : (isDashing ? '#f1c40f' : '#dff9fb');

      if (isDashing) {
        ctx.fillStyle = 'rgba(72, 52, 212, 0.35)';
        ctx.beginPath();
        ctx.ellipse(-R_m * 1.1, 0, R_m * 0.8, R_m * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const waveA = Math.sin(frameCount * 0.22) * 6;
      const waveB = Math.cos(frameCount * 0.26) * 5;

      ctx.fillStyle = mistColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, -R_m * 0.4);
      ctx.quadraticCurveTo(-R_m * 0.8, -R_m * 0.6 + waveA, -R_m * 1.6 + (isDashing ? -8 : 0), waveA * 0.8);
      ctx.quadraticCurveTo(-R_m * 0.8, R_m * 0.6 + waveB, -R_m * 0.3, R_m * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = stalkerColor;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, -R_m * 0.5);
      ctx.lineTo(R_m * 0.4, 0);
      ctx.lineTo(R_m * 0.2, R_m * 0.5);
      ctx.lineTo(-R_m * 0.5, R_m * 0.35);
      ctx.lineTo(-R_m * 0.6, -R_m * 0.35);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = maskColor;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.65, 0);
      ctx.lineTo(R_m * 0.1, -R_m * 0.45);
      ctx.lineTo(0, 0);
      ctx.lineTo(R_m * 0.1, R_m * 0.45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = eyeColor;
      ctx.fillRect(R_m * 0.2, -R_m * 0.22, 4, 2);
      ctx.fillRect(R_m * 0.2, R_m * 0.12, 4, 2);

      ctx.strokeStyle = isHit ? '#ffffff' : bladeColor;
      ctx.lineWidth = 2.5;

      if (isAiming) {
        ctx.beginPath();
        ctx.moveTo(R_m * 0.1, -R_m * 0.6);
        ctx.lineTo(R_m * 0.85, R_m * 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(R_m * 0.1, R_m * 0.6);
        ctx.lineTo(R_m * 0.85, -R_m * 0.6);
        ctx.stroke();
      } else if (isDashing) {
        ctx.beginPath();
        ctx.moveTo(R_m * 0.3, -R_m * 0.3);
        ctx.quadraticCurveTo(-R_m * 0.4, -R_m * 0.9, -R_m * 1.3, -R_m * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(R_m * 0.3, R_m * 0.3);
        ctx.quadraticCurveTo(-R_m * 0.4, R_m * 0.9, -R_m * 1.3, R_m * 0.8);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -R_m * 0.4);
        ctx.quadraticCurveTo(R_m * 0.5, -R_m * 0.7, R_m * 0.95, -R_m * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, R_m * 0.4);
        ctx.quadraticCurveTo(R_m * 0.5, R_m * 0.7, R_m * 0.95, -R_m * 0.25);
        ctx.stroke();
      }
    } else if (e.baseType === 'SPLITTER' || e.baseType === 'SPLITTER_MINI') {
      const R_m = e.radius;
      const isMini = e.baseType === 'SPLITTER_MINI';
      const legPairs = isMini ? 2 : 3;

      const shellDark = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#006266');
      const shellLight = isHit ? '#ffffff' : '#009432';
      const jellyColor = isHit ? '#ffffff' : 'rgba(18, 203, 196, 0.55)';
      const eggGlow = isHit ? '#ffffff' : '#c4e538';
      const mandColor = isHit ? '#ffffff' : '#1e272e';

      ctx.strokeStyle = isHit ? '#ffffff' : '#1289a7';
      ctx.lineWidth = isMini ? 1.5 : 2;

      for (let p = 0; p < legPairs; p++) {
        const stepPhase = Math.sin(frameCount * 0.28 + p * 1.5) * (R_m * 0.35);
        const legStartX = -R_m * 0.4 + p * (R_m * 0.45);
        const legSpreadY = R_m * 0.85;

        ctx.beginPath();
        ctx.moveTo(legStartX, -R_m * 0.2);
        ctx.lineTo(legStartX - 2, -legSpreadY + stepPhase);
        ctx.lineTo(legStartX + 3, -legSpreadY * 1.25 + stepPhase);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(legStartX, R_m * 0.2);
        ctx.lineTo(legStartX - 2, legSpreadY + stepPhase);
        ctx.lineTo(legStartX + 3, legSpreadY * 1.25 + stepPhase);
        ctx.stroke();
      }

      ctx.fillStyle = jellyColor;
      ctx.beginPath();
      ctx.ellipse(-R_m * 0.38, 0, R_m * 0.65, R_m * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shellDark;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const eggPulse = Math.sin(frameCount * 0.15) * 1.2;
      ctx.fillStyle = eggGlow;
      const eggCount = isMini ? 2 : 3;
      for (let eg = 0; eg < eggCount; eg++) {
        const egX = -R_m * 0.55 + eg * (R_m * 0.22);
        const egY = Math.sin(frameCount * 0.1 + eg * 2) * (R_m * 0.18);
        ctx.beginPath();
        ctx.arc(egX, egY, Math.max(1, (isMini ? 2.5 : 3.5) + (eg === 0 ? eggPulse : -eggPulse)), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = shellLight;
      ctx.beginPath();
      ctx.ellipse(R_m * 0.15, 0, R_m * 0.45, R_m * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shellDark;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = shellDark;
      ctx.fillRect(0, -R_m * 0.4, 3, R_m * 0.8);
      ctx.fillRect(R_m * 0.25, -R_m * 0.35, 3, R_m * 0.7);

      const pinch = Math.sin(frameCount * 0.2) * 2.5;
      ctx.fillStyle = mandColor;

      ctx.beginPath();
      ctx.moveTo(R_m * 0.5, -R_m * 0.2);
      ctx.quadraticCurveTo(R_m * 0.9, -R_m * 0.35 + pinch, R_m * 0.95, -pinch);
      ctx.lineTo(R_m * 0.5, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(R_m * 0.5, R_m * 0.2);
      ctx.quadraticCurveTo(R_m * 0.9, R_m * 0.35 - pinch, R_m * 0.95, pinch);
      ctx.lineTo(R_m * 0.5, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ff3838';
      ctx.fillRect(R_m * 0.4, -R_m * 0.25, 3, 2.5);
      ctx.fillRect(R_m * 0.4, R_m * 0.12, 3, 2.5);
    } else {
      ctx.fillStyle = baseCol;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawPlayerCharacter() {
  const isInvulnBlink = player.iFrames > 0 && Math.floor(player.iFrames / 4) % 2 === 0;
  if (isInvulnBlink) return;

  const charDef = CHARACTERS[selectedHeroKey];
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(player.facing, 1);

  if (player.berserkTimer > 0) {
    const bPulse = Math.sin(frameCount * 0.3) * 4;
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 2, player.radius + 10 + bPulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(230, 126, 34, 0.22)';
    ctx.fill();
  }

  if (player.ignisDashDuration > 0) {
    ctx.fillStyle = 'rgba(230, 126, 34, 0.4)';
    ctx.fillRect(-18, -14, 14, 28);
    ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
    ctx.fillRect(-32, -14, 12, 28);
  }

  if (player.invisTimer > 0) {
    ctx.globalAlpha = 0.45;
  }

  const bob = player.isMoving ? Math.sin(player.walkCycle * 2) * 2.5 : Math.sin(frameCount * 0.05) * 0.8;
  const legSwing = player.isMoving ? Math.sin(player.walkCycle) * 5.5 : 0;
  const capeWave = player.isMoving ? Math.sin(player.walkCycle) * 4 : Math.sin(frameCount * 0.08) * 1.5;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 15, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (selectedHeroKey === 'BARBARIAN') {
    ctx.fillStyle = charDef.color.cape;
    ctx.beginPath();
    ctx.moveTo(-6, -2 + bob);
    ctx.lineTo(-14 - Math.abs(capeWave), 15 + bob);
    ctx.lineTo(-2, 16 + bob);
    ctx.lineTo(4, -2 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2d1d12';
    ctx.fillRect(-7 - legSwing * 0.4, 7 + bob, 5, 8);
    ctx.fillRect(2 + legSwing * 0.4, 7 + bob, 5, 8);

    ctx.fillStyle = player.berserkTimer > 0 ? '#c0392b' : '#d35400';
    ctx.fillRect(-9, -4 + bob, 18, 12);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(-9, 4 + bob, 18, 4);

    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(0, -9 + bob, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(-6, -15 + bob, 12, 6);
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.moveTo(-6, -13 + bob);
    ctx.lineTo(-12, -20 + bob);
    ctx.lineTo(-4, -14 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, -13 + bob);
    ctx.lineTo(12, -20 + bob);
    ctx.lineTo(4, -14 + bob);
    ctx.closePath();
    ctx.fill();
  } else if (selectedHeroKey === 'ALCHEMIST') {
    ctx.fillStyle = charDef.color.cape;
    ctx.beginPath();
    ctx.moveTo(-4, -2 + bob);
    ctx.lineTo(-12 - Math.abs(capeWave), 14 + bob);
    ctx.lineTo(-2, 15 + bob);
    ctx.lineTo(2, -2 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e272e';
    ctx.fillRect(-6 - legSwing * 0.4, 7 + bob, 4, 7);
    ctx.fillRect(2 + legSwing * 0.4, 7 + bob, 4, 7);

    ctx.fillStyle = charDef.color.armor;
    ctx.fillRect(-8, -4 + bob, 16, 12);
    ctx.fillStyle = '#1abc9c';
    ctx.fillRect(-8, 5 + bob, 16, 3);
    ctx.fillRect(-5, 5 + bob, 3, 3);
    ctx.fillRect(2, 5 + bob, 3, 3);

    ctx.fillStyle = '#f5cd79';
    ctx.beginPath();
    ctx.arc(0, -9 + bob, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(0, -10 + bob, 8, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();
  } else {
    ctx.fillStyle = charDef.color.cape;
    ctx.beginPath();
    ctx.moveTo(-4, -2 + bob);
    ctx.lineTo(-12 - Math.abs(capeWave), 13 + bob);
    ctx.lineTo(-2, 14 + bob);
    ctx.lineTo(2, -2 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e1b18';
    ctx.fillRect(-6 - legSwing * 0.4, 7 + bob, 4, 7);
    ctx.fillRect(2 + legSwing * 0.4, 7 + bob, 4, 7);

    ctx.fillStyle = charDef.color.armor;
    ctx.fillRect(-8, -4 + bob, 16, 12);
    ctx.fillStyle = charDef.color.trim;
    ctx.fillRect(-8, 6 + bob, 16, 2);
    ctx.fillRect(-1, -4 + bob, 2, 10);

    ctx.fillStyle = '#f5cd79';
    ctx.beginPath();
    ctx.arc(0, -9 + bob, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = charDef.color.hair;
    ctx.beginPath();
    ctx.arc(0, -11 + bob, 7, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1.5, -10 + bob, 3, 3);
    ctx.fillStyle = '#0984e3';
    ctx.fillRect(3, -9.5 + bob, 1.5, 2);
  }

  ctx.restore();
}

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
    ctx.save();
    ctx.translate(ch.x, ch.y);
    ctx.fillStyle = 'rgba(241, 196, 15, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, ch.radius + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d35400';
    ctx.fillRect(-11, -8, 22, 16);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-11, -3, 22, 4);
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

  // Renderização precisa dos telégrafos de chefes (círculos e cones)
  for (let i = 0; i < bossTelegraphs.length; i++) {
    const t = bossTelegraphs[i];
    const progress = Math.max(0, Math.min(1, 1 - (t.timer / t.maxTimer)));
    ctx.save();

    if (t.type === 'SCYTHE_CLEAVE') {
      const arcHalf = Math.PI * 0.52;
      const startAng = t.angle - arcHalf;
      const endAng = t.angle + arcHalf;

      ctx.fillStyle = 'rgba(0, 206, 201, 0.25)';
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, t.radius * progress, startAng, endAng);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, t.radius, startAng, endAng);
      ctx.closePath();
      ctx.stroke();
    } else {
      const isTeleport = t.type === 'VAMPIRE_TELEPORT';
      ctx.fillStyle = isTeleport ? 'rgba(142, 68, 173, 0.32)' : 'rgba(231, 76, 60, 0.28)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isTeleport ? '#8e44ad' : '#e74c3c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Renderização visual das ondas de choque em expansão
  for (let i = 0; i < bossShockwaves.length; i++) {
    const sw = bossShockwaves[i];
    const alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
    ctx.save();
    ctx.strokeStyle = `rgba(230, 126, 34, ${alpha * 0.85})`;
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
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, bp.radius, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  if (activeBoss && activeBoss.bossId === 4) {
    const laserCount = activeBoss.isEnraged ? 6 : 4;
    ctx.strokeStyle = activeBoss.isEnraged ? 'rgba(232, 67, 147, 0.85)' : 'rgba(155, 89, 182, 0.85)';
    ctx.lineWidth = activeBoss.isEnraged ? 8 : 6;
    for (let arm = 0; arm < laserCount; arm++) {
      const rayAng = activeBoss.beamAngle + (arm * (Math.PI * 2 / laserCount));
      ctx.beginPath();
      ctx.moveTo(activeBoss.x, activeBoss.y);
      ctx.lineTo(activeBoss.x + Math.cos(rayAng) * 650, activeBoss.y + Math.sin(rayAng) * 650);
      ctx.stroke();
    }
  }

  if (player.auraLvl > 0 || player.evolvedAura) {
    const auraRadius = (player.evolvedAura ? 150 : 65) + player.auraLvl * 18;
    const pulse = Math.sin(frameCount * 0.15) * 3;
    ctx.strokeStyle = player.evolvedAura ? 'rgba(241, 196, 15, 0.75)' : 'rgba(241, 196, 15, 0.4)';
    ctx.lineWidth = player.evolvedAura ? 4 : 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, auraRadius + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = player.evolvedAura ? 'rgba(241, 196, 15, 0.12)' : 'rgba(241, 196, 15, 0.04)';
    ctx.fill();
  }

  if (player.orbitals > 0) {
    const orbDist = player.evolvedOrbitals ? 88 : 72;
    for (let oIdx = 0; oIdx < player.orbitals; oIdx++) {
      const angle = player.orbitalAngle + (oIdx * (Math.PI * 2 / player.orbitals));
      const ox = player.x + Math.cos(angle) * orbDist;
      const oy = player.y + Math.sin(angle) * orbDist;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = player.evolvedOrbitals ? '#f1c40f' : '#2980b9';
      ctx.fillRect(-6, -8, 12, 16);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-2, -6, 4, 12);
      ctx.restore();
    }
  }

  if (player.axeCount > 0) {
    const count = player.evolvedAxe ? Math.max(player.axeCount, 6) : player.axeCount;
    const r = player.axeRadius || 56;
    ctx.strokeStyle = player.evolvedAxe ? 'rgba(230, 126, 34, 0.35)' : 'rgba(241, 196, 15, 0.18)';
    ctx.lineWidth = player.evolvedAxe ? 3.5 : 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < count; i++) {
      const angle = player.axeAngle + (i * (Math.PI * 2 / count));
      const ax = player.x + Math.cos(angle) * r;
      const ay = player.y + Math.sin(angle) * r;

      ctx.strokeStyle = player.evolvedAxe ? 'rgba(243, 156, 18, 0.48)' : 'rgba(241, 196, 15, 0.32)';
      ctx.lineWidth = player.evolvedAxe ? 8 : 5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, r, angle - 0.42, angle);
      ctx.stroke();

      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(angle + Math.PI / 2);

      ctx.fillStyle = '#5d4037';
      ctx.fillRect(-2.5, -6, 5, 28);

      ctx.fillStyle = player.evolvedAxe ? '#f39c12' : '#bdc3c7';
      ctx.beginPath();
      ctx.arc(-9, -12, 11, -Math.PI / 2, Math.PI / 2, true);
      ctx.lineTo(-2.5, -6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(9, -12, 11, -Math.PI / 2, Math.PI / 2, false);
      ctx.lineTo(2.5, -6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = player.evolvedAxe ? '#e74c3c' : '#f1c40f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];

    if (b.type === 'HAMMER_SLAM') {
      const progress = 1 - (b.life / b.maxLife);
      const alpha = Math.max(0, b.life / b.maxLife);
      const shockR = b.radius * (0.35 + progress * 0.65);

      ctx.save();
      ctx.translate(b.x, b.y);

      ctx.strokeStyle = `rgba(180, 185, 200, ${alpha * 0.35})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, shockR * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = b.isEvolved ? `rgba(243, 156, 18, ${alpha * 0.32})` : `rgba(241, 196, 15, ${alpha * 0.25})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, shockR * 1.15, b.angle - Math.PI * 0.28, b.angle + Math.PI * 0.28);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = b.isEvolved ? `rgba(231, 76, 60, ${alpha * 0.9})` : `rgba(255, 255, 255, ${alpha * 0.85})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, shockR * 1.15, b.angle - Math.PI * 0.28, b.angle + Math.PI * 0.28);
      ctx.stroke();

      ctx.strokeStyle = b.isEvolved ? `rgba(255, 234, 167, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);

      const mainCrackLen = shockR * 1.25;
      const perpX = -Math.sin(b.angle);
      const perpY = Math.cos(b.angle);
      const seg1X = Math.cos(b.angle) * (mainCrackLen * 0.35) + perpX * 7;
      const seg1Y = Math.sin(b.angle) * (mainCrackLen * 0.35) + perpY * 7;
      const seg2X = Math.cos(b.angle) * (mainCrackLen * 0.70) - perpX * 9;
      const seg2Y = Math.sin(b.angle) * (mainCrackLen * 0.70) - perpY * 9;
      const tipX = Math.cos(b.angle) * mainCrackLen;
      const tipY = Math.sin(b.angle) * mainCrackLen;

      ctx.lineTo(seg1X, seg1Y);
      ctx.lineTo(seg2X, seg2Y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = b.isEvolved ? `rgba(243, 156, 18, ${alpha * 0.8})` : `rgba(241, 196, 15, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.moveTo(seg1X, seg1Y);
      ctx.lineTo(seg1X + Math.cos(b.angle + 0.5) * 22, seg1Y + Math.sin(b.angle + 0.5) * 22);
      ctx.moveTo(seg2X, seg2Y);
      ctx.lineTo(seg2X + Math.cos(b.angle - 0.5) * 26, seg2Y + Math.sin(b.angle - 0.5) * 26);
      ctx.stroke();

      if (progress < 0.48) {
        const slamPhase = progress / 0.48;
        const swingAng = b.angle + (1 - slamPhase) * -0.95;
        const forwardReach = 28 + slamPhase * 8;
        const hammerX = Math.cos(b.angle) * forwardReach;
        const hammerY = Math.sin(b.angle) * forwardReach;
        ctx.save();
        ctx.translate(hammerX, hammerY);
        ctx.rotate(swingAng + Math.PI / 2);
        ctx.fillStyle = '#4a235a';
        ctx.fillRect(-3, -4, 6, 36);
        ctx.fillStyle = b.isEvolved ? '#e67e22' : '#f1c40f';
        ctx.fillRect(-17, -22, 34, 18);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-17, -22, 34, 18);
        ctx.restore();
      }
      ctx.restore();
      continue;
    }

    if (b.x < viewLeft || b.x > viewRight || b.y < viewTop || b.y > viewBottom) continue;

    if (b.type === 'STAFF') {
      if (b.trail) {
        for (let t = 0; t < b.trail.length; t++) {
          const pt = b.trail[t];
          const tAlpha = (1 - t / b.trail.length) * 0.4;
          ctx.fillStyle = b.isEvolved ? `rgba(231, 76, 60, ${tAlpha})` : `rgba(230, 126, 34, ${tAlpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, b.radius * (1 - t / b.trail.length * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = b.isEvolved ? '#ff4757' : '#e67e22';
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, b.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = b.isEvolved ? '#f1c40f' : '#ffa502';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.radius * 1.35, b.radius * 0.6, frameCount * 0.2, 0, Math.PI * 2);
      ctx.stroke();
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