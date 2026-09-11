/**
 * src/entities/bosses/supremeReaper.js
 * Módulo de Comportamento e Renderização: Ceifador Supremo (bossId: 3)
 */

import { playSfx, triggerHaptic } from '../../core/audio.js';
import { bullets } from '../../main.js';

export function initSupremeReaper(boss) {
  boss.actionState = 'CHASE'; // 'CHASE', 'WINDUP', 'VORTEX_HARVEST', 'RECOVERY', 'ENRAGE_TRANSITION'
  boss.actionTimer = 0;
  boss.currentSkill = null;
  boss.skillCooldown = 70;

  boss.recoveryTimer = 0;
  boss.isVulnerable = false;
  boss.prevHp = boss.hp;
  boss.facing = 1;

  // Lanternas de Almas: orbitais defensivas que fornecem intangibilidade parcial
  boss.lanterns = [
    { angle: 0, dist: 95, radius: 14, hp: 1600, maxHp: 1600, active: true, hitFlash: 0, hitCd: 0 },
    { angle: (Math.PI * 2) / 3, dist: 95, radius: 14, hp: 1600, maxHp: 1600, active: true, hitFlash: 0, hitCd: 0 },
    { angle: (Math.PI * 4) / 3, dist: 95, radius: 14, hp: 1600, maxHp: 1600, active: true, hitFlash: 0, hitCd: 0 }
  ];
  boss.lanternAngularSpeed = 0.032;

  // Controle de fase e fúria (< 40% HP)
  boss.hasEnraged = false;
  boss.isEnraged = false;

  // Variáveis procedurais de animação
  boss.floatY = 0;
  boss.scytheAngle = 0;
  boss.scytheTargetAngle = 0;
  boss.ghostTrail = [];
}

export function updateSupremeReaper(e, dt, context) {
  const {
    player,
    frameCount,
    enemyBullets,
    bossTelegraphs,
    bossShockwaves,
    voidVortices,
    triggerShake,
    createHitParticles,
    addDamageText
  } = context;

  // Micro-animações
  e.floatY = Math.sin(frameCount * 0.06) * 7;
  e.facing = (player.x - e.x) > 0 ? 1 : -1;

  // Registro de rastro fantasmagórico
  if (Math.floor(frameCount) % 4 === 0) {
    e.ghostTrail.unshift({ x: e.x, y: e.y + e.floatY, alpha: 0.45 });
    if (e.ghostTrail.length > 5) e.ghostTrail.pop();
  }
  for (let t of e.ghostTrail) t.alpha -= 0.012 * dt;

  // Mitigação de Dano pelas Lanternas Espirituais
  const activeLanterns = e.lanterns.filter(l => l.active);
  if (activeLanterns.length > 0 && e.actionState !== 'RECOVERY') {
    if (e.hp < e.prevHp) {
      const diff = e.prevHp - e.hp;
      e.hp += diff * 0.70; // 70% de absorção enquanto houver lanternas
      if (Math.floor(frameCount) % 4 === 0) {
        createHitParticles(e.x, e.y, '#00cec9', 2);
      }
    }
  }
  e.prevHp = e.hp;

  // Atualiza colisão das Lanternas
  updateLanterns(e, dt, context);

  // Transição de Fúria (< 40% HP)
  if (!e.hasEnraged && (e.hp / e.maxHp) < 0.40) {
    e.hasEnraged = true;
    e.isEnraged = true;
    e.speed *= 1.35;
    e.lanternAngularSpeed *= 1.6;
    e.actionState = 'ENRAGE_TRANSITION';
    e.actionTimer = 60;
    e.isVulnerable = false;

    triggerShake(16);
    triggerHaptic('heavy');
    playSfx('boss');
    addDamageText(e.x, e.y, "DESPERTAR DA MORTE!", true, '#00cec9');

    bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 20,
      maxRadius: 360,
      speed: 7.0,
      damage: Math.round(e.damage * 0.45),
      hitPlayer: false
    });

    e.lanterns = [
      { angle: 0, dist: 100, radius: 15, hp: 1800, maxHp: 1800, active: true, hitFlash: 0, hitCd: 0 },
      { angle: Math.PI * 0.5, dist: 100, radius: 15, hp: 1800, maxHp: 1800, active: true, hitFlash: 0, hitCd: 0 },
      { angle: Math.PI, dist: 100, radius: 15, hp: 1800, maxHp: 1800, active: true, hitFlash: 0, hitCd: 0 },
      { angle: Math.PI * 1.5, dist: 100, radius: 15, hp: 1800, maxHp: 1800, active: true, hitFlash: 0, hitCd: 0 }
    ];
    return;
  }

  // FSM do Ceifador
  switch (e.actionState) {
    case 'ENRAGE_TRANSITION': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 3 === 0) triggerShake(3);
      if (e.actionTimer <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = 25;
      }
      return;
    }

    case 'RECOVERY': {
      e.recoveryTimer -= dt;
      e.isVulnerable = true;
      if (Math.floor(frameCount) % 5 === 0) {
        createHitParticles(e.x, e.y, '#81ecec', 1);
      }

      if (e.recoveryTimer <= 0) {
        e.isVulnerable = false;
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 40 : 60;

        triggerShake(12);
        playSfx('boss');
        addDamageText(e.x, e.y, "RESTAURAÇÃO ESPECTRAL!", true, '#00cec9');

        const lCount = e.isEnraged ? 4 : 3;
        const lHp = e.isEnraged ? 1700 : 1300;
        e.lanterns = [];
        for (let i = 0; i < lCount; i++) {
          e.lanterns.push({
            angle: (i * Math.PI * 2) / lCount,
            dist: 95,
            radius: 14,
            hp: lHp,
            maxHp: lHp,
            active: true,
            hitFlash: 0,
            hitCd: 0
          });
        }
      }
      return;
    }

    case 'VORTEX_HARVEST': {
      e.actionTimer -= dt;
      const pdx = e.x - player.x;
      const pdy = e.y - player.y;
      const pDist = Math.hypot(pdx, pdy);

      if (pDist > 30 && pDist < 460) {
        const pull = (e.isEnraged ? 1.25 : 0.95) * dt;
        player.x += (pdx / pDist) * pull;
        player.y += (pdy / pDist) * pull;
      }

      if (Math.floor(frameCount) % 8 === 0) {
        enemyBullets.push({
          x: e.x + (Math.random() - 0.5) * 40,
          y: e.y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          radius: 5,
          damage: Math.round(e.damage * 0.22),
          life: 80
        });
      }

      if (e.actionTimer <= 0) {
        triggerShake(14);
        playSfx('boss');
        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 15,
          maxRadius: 300,
          speed: 6.0,
          damage: Math.round(e.damage * 0.5),
          hitPlayer: false
        });
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 45 : 75;
      }
      return;
    }

    case 'WINDUP': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 2 === 0) {
        createHitParticles(e.x, e.y, '#00cec9', 1);
      }
      if (e.actionTimer <= 0) {
        executeReaperSkill(e, context);
      }
      return;
    }

    case 'CHASE':
    default: {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      let curSpeed = e.speed;
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        curSpeed *= (1 - 0.18);
      }

      if (dist > 75) {
        const angle = Math.atan2(dy, dx);
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
      }

      e.skillCooldown -= dt;
      if (e.skillCooldown <= 0) {
        selectReaperSkill(e, dist);
      }
      break;
    }
  }
}

function updateLanterns(e, dt, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  for (let l of e.lanterns) {
    if (l.hitFlash > 0) l.hitFlash -= dt;
    if (l.hitCd > 0) l.hitCd -= dt;
    if (!l.active) continue;

    l.angle += e.lanternAngularSpeed * dt;
    const lx = e.x + Math.cos(l.angle) * l.dist;
    const ly = e.y + Math.sin(l.angle) * (l.dist * 0.5);

    // Colisão com projéteis do jogador
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      const bdx = b.x - lx;
      const bdy = b.y - ly;
      const rSum = (b.radius || 6) + l.radius;

      if (bdx * bdx + bdy * bdy < rSum * rSum) {
        const dmg = b.damage || 20;
        l.hp -= dmg;
        l.hitFlash = 3;
        createHitParticles(lx, ly, '#00cec9', 3);
        addDamageText(lx, ly, Math.round(dmg), false, '#81ecec');
        playSfx('hit');

        b.piercing = (b.piercing || 1) - 1;
        if (b.piercing <= 0) b.life = 0;

        if (l.hp <= 0) {
          l.active = false;
          triggerShake(7);
          triggerHaptic('medium');
          playSfx('boss');
          createHitParticles(lx, ly, '#00cec9', 14);
          addDamageText(lx, ly, "LANTERNA DESTRUÍDA!", true, '#00cec9');
          checkLanternCollapse(e, context);
          break;
        }
      }
    }
  }
}

function checkLanternCollapse(boss, context) {
  const rem = boss.lanterns.filter(l => l.active).length;
  if (rem === 0 && boss.actionState !== 'RECOVERY' && boss.actionState !== 'ENRAGE_TRANSITION') {
    boss.actionState = 'RECOVERY';
    boss.recoveryTimer = boss.isEnraged ? 200 : 260;
    boss.isVulnerable = true;

    context.triggerShake(14);
    triggerHaptic('heavy');
    playSfx('boss');
    context.addDamageText(boss.x, boss.y, "COLAPSO ESPIRITUAL!", true, '#81ecec');
  }
}

function selectReaperSkill(e, dist) {
  const rand = Math.random();
  if (dist < 150) {
    e.currentSkill = 'DOUBLE_CLEAVE';
    e.actionState = 'WINDUP';
    e.actionTimer = e.isEnraged ? 18 : 26;
  } else if (dist > 300 && rand < 0.45) {
    e.currentSkill = 'BLINK_STRIKE';
    e.actionState = 'WINDUP';
    e.actionTimer = e.isEnraged ? 16 : 24;
  } else if (rand < 0.5) {
    e.currentSkill = 'VORTEX_HARVEST';
    e.actionState = 'WINDUP';
    e.actionTimer = 25;
  } else {
    e.currentSkill = 'SOUL_SCYTHES';
    e.actionState = 'WINDUP';
    e.actionTimer = e.isEnraged ? 20 : 28;
  }
}

function executeReaperSkill(e, context) {
  const { player, bossTelegraphs, bossProjectiles, triggerShake } = context;
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const angleToPlayer = Math.atan2(dy, dx);

  switch (e.currentSkill) {
    case 'DOUBLE_CLEAVE': {
      playSfx('boss');
      triggerShake(10);
      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 160,
        angle: angleToPlayer,
        timer: 18,
        maxTimer: 18,
        damage: Math.round(e.damage * 0.75),
        boss: e
      });
      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 35 : 55;
      break;
    }

    case 'BLINK_STRIKE': {
      playSfx('boss');
      // Teletransporte preditivo para trás do jogador
      const blinkDist = 70;
      e.x = player.x - Math.cos(angleToPlayer) * blinkDist;
      e.y = player.y - Math.sin(angleToPlayer) * blinkDist;
      triggerShake(12);

      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 170,
        angle: angleToPlayer,
        timer: 14,
        maxTimer: 14,
        damage: Math.round(e.damage * 0.90),
        boss: e
      });

      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 40 : 60;
      break;
    }

    case 'VORTEX_HARVEST': {
      playSfx('boss');
      triggerShake(8);
      e.actionState = 'VORTEX_HARVEST';
      e.actionTimer = e.isEnraged ? 75 : 95;
      break;
    }

    case 'SOUL_SCYTHES': {
      playSfx('shoot');
      const blades = e.isEnraged ? 5 : 3;
      const arc = Math.PI * 0.45;
      const start = angleToPlayer - arc / 2;
      const step = arc / (blades - 1);

      for (let i = 0; i < blades; i++) {
        const bAng = start + i * step;
        bossProjectiles.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * 6.5,
          vy: Math.sin(bAng) * 6.5,
          radius: 18,
          damage: Math.round(e.damage * 0.5),
          life: 140,
          maxLife: 140
        });
      }
      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 38 : 55;
      break;
    }

    default:
      e.actionState = 'CHASE';
      e.skillCooldown = 50;
      break;
  }
}

// ============================================================================
// RENDERIZAÇÃO PROCEDURAL VETORIAL (CANVAS 2D)
// ============================================================================

export function drawSupremeReaper(ctx, e, frameCount) {
  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged;
  const bob = isVuln ? 18 : (e.floatY || 0);

  ctx.save();

  // Rastro Espectral
  for (let t of e.ghostTrail) {
    if (t.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = isEnraged ? 'rgba(231, 76, 60, 0.4)' : 'rgba(0, 206, 201, 0.35)';
    ctx.beginPath();
    ctx.arc(t.x - e.x, t.y - e.y, e.radius * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 1. Sombra Difusa
  const shadowGrad = ctx.createRadialGradient(0, 52, 4, 0, 52, e.radius * 0.9);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(0, 52, e.radius * 0.85, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Manto Ondulante Procedural
  const drape1 = Math.sin(frameCount * 0.08) * 9;
  const drape2 = Math.cos(frameCount * 0.08) * 9;

  ctx.fillStyle = isVuln ? '#1e272e' : (isEnraged ? '#1a0508' : '#0a0d14');
  ctx.beginPath();
  ctx.moveTo(0, -56 + bob);
  ctx.quadraticCurveTo(-54, -10 + bob, -36 + drape1, 48 + bob);
  ctx.quadraticCurveTo(0, 36 + bob, 36 + drape2, 48 + bob);
  ctx.quadraticCurveTo(54, -10 + bob, 0, -56 + bob);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = isVuln ? '#57606f' : (isEnraged ? '#e74c3c' : '#00cec9');
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 3. Capuz e Olhos Incandescentes
  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.arc(0, -32 + bob, 22, 0, Math.PI * 2);
  ctx.fill();

  const eyeCol = isVuln ? '#7f8c8d' : (isEnraged ? '#ff4757' : '#81ecec');
  const eyeGlow = Math.sin(frameCount * 0.14) * 1.5;
  ctx.fillStyle = eyeCol;
  ctx.beginPath();
  ctx.arc(-8, -32 + bob, 3 + eyeGlow, 0, Math.PI * 2);
  ctx.arc(8, -32 + bob, 3 + eyeGlow, 0, Math.PI * 2);
  ctx.fill();

  // 4. Foice Cósmica Procedural
  ctx.save();
  ctx.translate(42 * e.facing, -10 + bob);
  ctx.rotate(0.35 * e.facing + Math.sin(frameCount * 0.05) * 0.1);

  // Cabo da foice
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(-3, -70, 6, 130);

  // Lâmina curvada
  ctx.strokeStyle = isVuln ? '#747d8c' : (isEnraged ? '#ff4757' : '#00cec9');
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.arc(-22 * e.facing, -70, 48, -0.2, Math.PI * 0.75 * (e.facing > 0 ? 1 : -1), e.facing < 0);
  ctx.stroke();
  ctx.restore();

  // 5. Lanternas Espirituais
  for (let l of e.lanterns) {
    if (!l.active) continue;
    const lx = Math.cos(l.angle) * l.dist;
    const ly = (Math.sin(l.angle) * (l.dist * 0.5)) + bob;

    ctx.save();
    ctx.strokeStyle = isEnraged ? 'rgba(231, 76, 60, 0.35)' : 'rgba(0, 206, 201, 0.35)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, -20 + bob);
    ctx.lineTo(lx, ly);
    ctx.stroke();

    ctx.translate(lx, ly);
    ctx.fillStyle = l.hitFlash > 0 ? '#fff' : (isEnraged ? '#4a1017' : '#102a38');
    ctx.fillRect(-l.radius * 0.7, -l.radius, l.radius * 1.4, l.radius * 2);

    ctx.strokeStyle = isEnraged ? '#ff4757' : '#81ecec';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-l.radius * 0.7, -l.radius, l.radius * 1.4, l.radius * 2);

    // Barra de vida da lanterna
    const hpPct = Math.max(0, l.hp / l.maxHp);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, l.radius + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpPct);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}