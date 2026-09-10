import { CHARACTERS } from '../config/characters.js';
import { player, selectedHeroKey } from '../entities/player.js';
import { stick } from '../core/input.js';
import { renderEnvironment } from './environment.js';
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
  activeBoss, 
  bullets, 
  enemyBullets, 
  enemies, 
  particles, 
  damageTexts, 
  frameCount 
} from '../main.js';

export function drawEnemyShape(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(e.facing, 1);

  // Efeito Visual de Atordoamento (Stun) do Rugido de Kragdor
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

  if (e.isBoss) {
    if (e.bossId === 1) {
      const wingFlap = Math.sin(frameCount * 0.18) * 16;
      ctx.fillStyle = '#180309';
      ctx.beginPath();
      ctx.moveTo(-10, -15);
      ctx.lineTo(-65, -45 + wingFlap);
      ctx.lineTo(-45, 10 + wingFlap * 0.5);
      ctx.lineTo(-60, 45 + wingFlap);
      ctx.lineTo(0, 20);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(10, -15);
      ctx.lineTo(65, -45 + wingFlap);
      ctx.lineTo(45, 10 + wingFlap * 0.5);
      ctx.lineTo(60, 45 + wingFlap);
      ctx.lineTo(0, 20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#68081d';
      ctx.beginPath();
      ctx.moveTo(-28, -20);
      ctx.lineTo(0, 52);
      ctx.lineTo(28, -20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#2c0c16';
      ctx.fillRect(-22, -26, 44, 40);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-22, -26, 44, 40);

      ctx.fillStyle = '#0d0205';
      ctx.beginPath();
      ctx.arc(0, -32, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff1744';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 8;
      ctx.fillRect(-7, -35, 4, 4);
      ctx.fillRect(3, -35, 4, 4);
      ctx.shadowBlur = 0;
    } else if (e.bossId === 2) {
      for (let r = 0; r < 4; r++) {
        const orbAng = frameCount * 0.04 + (r * Math.PI / 2);
        const rx = Math.cos(orbAng) * 98;
        const ry = Math.sin(orbAng) * 98;
        ctx.fillStyle = '#1c1008';
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rx, ry, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = '#140c06';
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const a = (s * Math.PI * 2) / 6 + (frameCount * 0.005);
        const hx = Math.cos(a) * e.radius;
        const hy = Math.sin(a) * e.radius;
        if (s === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = e.isEnraged ? '#e74c3c' : '#d35400';
      ctx.lineWidth = 5;
      ctx.stroke();

      const corePulse = Math.sin(frameCount * 0.12) * 6;
      ctx.fillStyle = '#e74c3c';
      ctx.shadowColor = '#e67e22';
      ctx.shadowBlur = 16;
      ctx.fillRect(-20 - corePulse/2, -20 - corePulse/2, 40 + corePulse, 40 + corePulse);
      ctx.shadowBlur = 0;
    } else if (e.bossId === 3) {
      const drape = Math.sin(frameCount * 0.1) * 8;
      ctx.fillStyle = '#060c12';
      ctx.beginPath();
      ctx.moveTo(-35, -45);
      ctx.quadraticCurveTo(-50 + drape, 15, -30, 65);
      ctx.lineTo(30, 65);
      ctx.quadraticCurveTo(50 - drape, 15, 35, -45);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#020406';
      ctx.beginPath();
      ctx.arc(0, -42, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#81ecec';
      ctx.shadowColor = '#00cec9';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(-8, -44, 3.5, 0, Math.PI * 2);
      ctx.arc(8, -44, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.translate(55, -20 + Math.sin(frameCount * 0.12) * 10);
      ctx.rotate(0.4);
      ctx.fillStyle = '#636e72';
      ctx.fillRect(-3, -60, 6, 120);
      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, -60, 40, 0, Math.PI * 0.8, true);
      ctx.stroke();
      ctx.restore();
    } else if (e.bossId === 4) {
      for (let t = 0; t < 8; t++) {
        const baseAngle = (t * Math.PI * 2) / 8;
        ctx.strokeStyle = '#341f97';
        ctx.lineWidth = 7;
        ctx.beginPath();
        let currX = Math.cos(baseAngle) * 55;
        let currY = Math.sin(baseAngle) * 55;
        ctx.moveTo(currX, currY);
        for (let seg = 1; seg <= 4; seg++) {
          const wave = Math.sin(frameCount * 0.15 + t + seg) * 16;
          currX += Math.cos(baseAngle) * 22 + Math.cos(baseAngle + Math.PI/2) * wave * 0.3;
          currY += Math.sin(baseAngle) * 22 + Math.sin(baseAngle + Math.PI/2) * wave * 0.3;
          ctx.lineTo(currX, currY);
        }
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(155, 89, 182, 0.55)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 115, 45, frameCount * 0.02, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(232, 67, 147, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 115, 45, -frameCount * 0.025, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#08010f';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.fillStyle = '#e84393';
      ctx.shadowColor = '#e84393';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 10, frameCount * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  } else {
    ctx.fillStyle = e.hitFlash > 0 ? '#fff' : (e.slowTimer > 0 ? '#74b9ff' : e.color);
    if (e.baseType === 'ZOMBIE') {
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
    } else if (e.baseType === 'GOLEM') {
      ctx.beginPath();
      const sides = 8;
      for (let s = 0; s < sides; s++) {
        const a = (s * Math.PI * 2) / sides;
        const gx = Math.cos(a) * e.radius;
        const gy = Math.sin(a) * e.radius;
        if (s === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(-6, -2, 12, 4);
    } else if (e.baseType === 'SHIELDED') {
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
    } else if (e.baseType === 'SHOOTER') {
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 13);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(2, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(8, -3, 9, 6);
    } else if (e.baseType === 'SPLITTER' || e.baseType === 'SPLITTER_MINI') {
      const blob = Math.sin(frameCount * 0.25) * 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.radius + blob, e.radius - blob, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0abde3';
      ctx.beginPath();
      ctx.arc(-3, 0, 3, 0, Math.PI * 2);
      ctx.arc(3, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.baseType === 'NECRO') {
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(9, 13);
      ctx.lineTo(-9, 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#9b59b6';
      ctx.beginPath();
      ctx.arc(0, -7, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
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

  // Aura de Frenesi (Kragdor Berserk)
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

  // Fantasma Térmico do Passo Ígneo (Ignis Dash)
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
    ctx.fillStyle = '#9b59b6';
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

  props.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.hitFlash > 0 ? '#fff' : '#7f8c8d';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
  });

  drops.forEach(d => {
    ctx.save();
    ctx.translate(d.x, d.y);
    if (d.life < 300 && Math.floor(d.life / 10) % 2 === 0) {
      ctx.restore();
      return;
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
  });

  chests.forEach(ch => {
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
  });

  gems.forEach(g => {
    ctx.save();
    let pulse = 0;
    if (g.isSuper) {
      pulse = Math.sin(frameCount * 0.16 + (g.pulseOffset || 0)) * 2.2;
      ctx.shadowColor = g.color || '#e056fd';
      ctx.shadowBlur = 12 + pulse * 2;
    } else {
      ctx.shadowColor = g.color || '#00d2d3';
      ctx.shadowBlur = 4;
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
  });

  bossTelegraphs.forEach(t => {
    const progress = 1 - (t.timer / t.maxTimer);
    ctx.fillStyle = 'rgba(231, 76, 60, 0.28)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  bossProjectiles.forEach(bp => {
    ctx.save();
    ctx.translate(bp.x, bp.y);
    ctx.rotate(bp.angle);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, bp.radius, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  });

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

  // Renderização do Machado de Kragdor (Orientação Radial com o cabo voltado ao herói)
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

      // Rastro curvo centrífugo de corte
      ctx.strokeStyle = player.evolvedAxe ? 'rgba(243, 156, 18, 0.48)' : 'rgba(241, 196, 15, 0.32)';
      ctx.lineWidth = player.evolvedAxe ? 8 : 5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, r, angle - 0.42, angle);
      ctx.stroke();

      ctx.save();
      ctx.translate(ax, ay);
      // Rotação radial: o cabo aponta rigorosamente para o herói e as lâminas cortam para fora
      ctx.rotate(angle + Math.PI / 2);

      // Cabo de madeira estendido para dentro
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(-2.5, -6, 5, 28);

      // Lâminas duplas cortando para fora
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

  // Renderização das Armas e Impactos
  bullets.forEach(b => {
    if (b.type === 'HAMMER_SLAM') {
      const progress = 1 - (b.life / b.maxLife);
      const alpha = Math.max(0, b.life / b.maxLife);
      const shockR = b.radius * (0.35 + progress * 0.65);

      ctx.save();
      ctx.translate(b.x, b.y);

      // 1. Onda de tremor secundária suave nas laterais e costas (360°)
      ctx.strokeStyle = `rgba(180, 185, 200, ${alpha * 0.35})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, shockR * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Cone de choque frontal telegrafado na direção prioritária
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

      // 3. Fissura Sísmica Principal: Fenda dourada brilhante na direção do alvo
      ctx.shadowColor = b.isEvolved ? '#e74c3c' : '#f1c40f';
      ctx.shadowBlur = 12 * alpha;
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
      ctx.shadowBlur = 0;

      // 4. Animação do Martelo de Guerra esmagando o chão à frente do Paladino
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
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 12;
        ctx.fillRect(-17, -22, 34, 18);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-17, -22, 34, 18);
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      ctx.restore();
      return;
    }

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

      ctx.shadowColor = b.isEvolved ? '#e74c3c' : '#e67e22';
      ctx.shadowBlur = 14;

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

      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }

    if (b.type === 'POTION') {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle || 0);

      ctx.fillStyle = '#d35400';
      ctx.fillRect(-2.5, -9, 5, 3);

      ctx.fillStyle = b.isEvolved ? '#00cec9' : '#2ecc71';
      ctx.shadowColor = b.isEvolved ? '#00cec9' : '#2ecc71';
      ctx.shadowBlur = 8;
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

      ctx.shadowBlur = 0;
      ctx.restore();
      return;
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
      ctx.shadowColor = b.isEvolved ? '#f39c12' : '#27ae60';
      ctx.shadowBlur = 8;

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

      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }
  });

  enemyBullets.forEach(eb => {
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d63031';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  enemies.forEach(e => drawEnemyShape(e));
  drawPlayerCharacter();

  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });

  damageTexts.forEach(dtItem => {
    const alpha = Math.max(0, dtItem.life / dtItem.maxLife);
    ctx.save();
    ctx.fillStyle = dtItem.color;
    ctx.globalAlpha = alpha;
    ctx.font = dtItem.isCrit ? 'bold 16px sans-serif' : 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    if (dtItem.isCrit) {
      ctx.shadowColor = '#f1c40f';
      ctx.shadowBlur = 6;
    }
    ctx.fillText(dtItem.text, dtItem.x, dtItem.y);
    ctx.restore();
  });

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