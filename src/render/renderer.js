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
    ctx.fillStyle = e.hitFlash > 0 ? '#fff' : e.color;
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

  ctx.save();
  ctx.translate(14, -4 + bob);
  if (player.evolvedSword) {
    ctx.rotate(0.4 + Math.sin(frameCount * 0.12) * 0.15);
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(5, 4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.rotate(0.3);
    ctx.fillStyle = '#dcdde1';
    ctx.fillRect(-2, -10, 4, 14);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-4, 0, 8, 3);
  }
  ctx.restore();

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
    ctx.fillStyle = g.isSuper ? '#e056fd' : '#00d2d3';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
    ctx.fill();
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

  bullets.forEach(b => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    ctx.fillStyle = b.isEvolved ? '#f1c40f' : '#00d2d3';
    ctx.beginPath();
    if (b.isEvolved) {
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -6);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 6);
    } else {
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-6, 4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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