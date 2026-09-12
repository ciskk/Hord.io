/**
 * src/entities/bosses/supremeReaper.js
 * Módulo de Comportamento, Física e Renderização: Ceifador Supremo (bossId: 3)
 * Survivor / Bullet-Heaven "Hord.io" (Fase 5)
 */

import { playSfx, triggerHaptic } from '../../core/audio.js';
import { bullets, acidPuddles, enemies } from '../../main.js';
import { player } from '../player.js';

export function cleanupReaperSubTargets(boss, targetList = enemies) {
  for (let i = targetList.length - 1; i >= 0; i--) {
    if (targetList[i].parentBoss === boss) {
      targetList.splice(i, 1);
    }
  }
}

export function spawnReaperLanterns(boss, count, lHp, targetList = enemies) {
  cleanupReaperSubTargets(boss, targetList);
  boss.lanterns = [];

  for (let k = 0; k < count; k++) {
    const angle = (k * Math.PI * 2) / count;
    const lantern = {
      angle: angle,
      dist: 105,
      radius: 16,
      hp: lHp,
      maxHp: lHp,
      active: true,
      hitFlash: 0,
      hitCd: 0,
      axeHitCd: 0,
      sway: 0,
      swayVel: 0,
      isBossSubTarget: true,
      baseType: 'LANTERNA',
      color: '#00cec9',
      parentBoss: boss,
      x: boss.x + Math.cos(angle) * 105,
      y: boss.y + Math.sin(angle) * (105 * 0.48)
    };
    boss.lanterns.push(lantern);
    targetList.push(lantern);
  }
}

export function initSupremeReaper(boss) {
  boss.actionState = 'CHASE';
  boss.actionTimer = 0;
  boss.currentSkill = null;
  boss.skillCooldown = 75;
  boss.aimAngle = 0;

  boss.delayedActions = [];

  // Janelas de Vulnerabilidade e Colapso (6.0 segundos = 360 frames)
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;
  boss.prevHp = boss.hp;

  // Lanternas Espirituais como Sub-Alvos Selecionáveis (Fase Normal: 4.000 HP)
  boss.lanterns = [];
  boss.lanternAngularSpeed = 0.026;
  spawnReaperLanterns(boss, 3, 4000, enemies);

  boss.hasEnraged = false;
  boss.isEnraged = false;
  boss.isPhase3 = false;

  boss.tetherActive = false;
  boss.tetherTimer = 0;
  boss.tetherMaxDist = 310;
  boss.blinkTarget = null;
  boss.phantoms = [];

  boss.floatY = 0;
  boss.floatBob = 0;
  boss.facing = 1;
  boss.wingSpan = 0.55;
  boss.wingTargetSpan = 0.55;
  boss.scytheAngle = -0.3;
  boss.scytheTargetAngle = -0.3;
  boss.eyePulse = 0;
  boss.ghostTrail = [];
}

export function updateSupremeReaper(e, dt, context) {
  const {
    player,
    frameCount,
    enemyBullets,
    bossTelegraphs,
    bossShockwaves,
    triggerShake,
    createHitParticles,
    addDamageText
  } = context;

  if (e.delayedActions && e.delayedActions.length > 0) {
    for (let i = e.delayedActions.length - 1; i >= 0; i--) {
      const action = e.delayedActions[i];
      action.timer -= dt;
      if (action.timer <= 0) {
        action.callback();
        e.delayedActions.splice(i, 1);
      }
    }
  }

  e.floatBob = Math.sin(frameCount * 0.065) * 8;
  e.floatY = e.floatBob;
  
  if (e.actionState !== 'POST_ATTACK_RECOVERY' && e.actionState !== 'RECOVERY') {
    e.facing = (player.x - e.x) > 0 ? 1 : -1;
  }
  e.eyePulse = (Math.sin(frameCount * (e.isEnraged ? 0.22 : 0.12)) + 1) * 0.5;

  e.wingSpan += (e.wingTargetSpan - e.wingSpan) * 0.14 * dt;
  e.scytheAngle += (e.scytheTargetAngle - e.scytheAngle) * 0.18 * dt;

  if (Math.floor(frameCount) % 3 === 0) {
    e.ghostTrail.unshift({
      x: e.x,
      y: e.y + e.floatBob,
      alpha: e.isPhase3 ? 0.65 : 0.40,
      enraged: e.isEnraged || e.isPhase3
    });
    if (e.ghostTrail.length > 8) e.ghostTrail.pop();
  }
  for (let i = e.ghostTrail.length - 1; i >= 0; i--) {
    e.ghostTrail[i].alpha -= 0.018 * dt;
    if (e.ghostTrail[i].alpha <= 0) e.ghostTrail.splice(i, 1);
  }

  // FASE 5: Buff Ofensivo baseado nas Lanternas (absorção passiva de 70% removida)
  const activeLanterns = e.lanterns.filter(l => l.active);
  if (activeLanterns.length > 0 && e.actionState === 'CHASE') {
    e.skillCooldown -= dt * (0.20 * activeLanterns.length);
  }

  updateReaperLanterns(e, dt, context);
  checkReaperPhases(e, context);
  updateSoulTether(e, dt, context);

  // MÁQUINA DE ESTADOS PRINCIPAL
  switch (e.actionState) {
    case 'ENRAGE_TRANSITION': {
      e.actionTimer -= dt;
      e.wingTargetSpan = 1.35;
      e.scytheTargetAngle = 1.2 * e.facing;
      if (Math.floor(frameCount) % 3 === 0) triggerShake(3.5);
      if (e.actionTimer <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = 25;
      }
      return;
    }

    // Janela de Exaustão de 6.0 segundos após quebra de todas as lanternas
    case 'RECOVERY': {
      e.recoveryTimer -= dt;
      e.isVulnerable = true;
      e.wingTargetSpan = 0.18;
      e.scytheTargetAngle = 0.9;

      if (Math.floor(frameCount) % 5 === 0) {
        createHitParticles(e.x + (Math.random() - 0.5) * e.radius, e.y + (Math.random() - 0.5) * e.radius, '#81ecec', 1);
      }

      if (e.recoveryTimer <= 0) {
        e.isVulnerable = false;
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 40 : 65;

        triggerShake(13);
        playSfx('boss');
        addDamageText(e.x, e.y, "RECONSTITUIÇÃO ESPIRITUAL!", true, '#00cec9');
      }
      return;
    }

    // Janela de Recuperação Pós-Ataque (70 frames: punição melee)
    case 'POST_ATTACK_RECOVERY': {
      e.actionTimer -= dt;
      e.wingTargetSpan = 0.30;
      e.scytheTargetAngle = 0.8;

      if (Math.floor(frameCount) % 8 === 0) {
        createHitParticles(e.x + (Math.random() - 0.5) * e.radius, e.y + (Math.random() - 0.5) * e.radius, '#81ecec', 1);
      }
      if (e.actionTimer <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 40 : 60;
      }
      return;
    }

    case 'BLINK_AIM': {
      e.actionTimer -= dt;
      e.wingTargetSpan = 0.12;

      if (Math.floor(frameCount) % 3 === 0 && e.blinkTarget) {
        createHitParticles(e.blinkTarget.x, e.blinkTarget.y, '#00cec9', 2);
        createHitParticles(e.x, e.y, '#00cec9', 1);
      }

      if (e.actionTimer <= 0 && e.blinkTarget) {
        playSfx('boss');
        triggerShake(10);
        triggerHaptic('heavy');

        createHitParticles(e.x, e.y, '#00cec9', 15);
        e.x = e.blinkTarget.x;
        e.y = e.blinkTarget.y;
        createHitParticles(e.x, e.y, '#00cec9', 18);

        const sideAng = e.blinkTarget.angle + Math.PI * 0.5;
        e.phantoms = [
          { x: e.x + Math.cos(sideAng) * 60, y: e.y + Math.sin(sideAng) * 60, life: 25 },
          { x: e.x - Math.cos(sideAng) * 60, y: e.y - Math.sin(sideAng) * 60, life: 25 }
        ];

        bossTelegraphs.push({
          type: 'SCYTHE_CLEAVE',
          x: e.x,
          y: e.y,
          radius: 165,
          angle: e.blinkTarget.cleaveAngle,
          timer: e.isEnraged ? 20 : 26,
          maxTimer: e.isEnraged ? 20 : 26,
          damage: Math.round(e.damage * 0.85),
          color: '#00cec9',
          colorRgb: '0, 206, 201',
          boss: e
        });

        e.blinkTarget = null;
        e.actionState = 'POST_ATTACK_RECOVERY';
        e.actionTimer = 65;
      }
      return;
    }

    case 'VORTEX_HARVEST': {
      e.actionTimer -= dt;
      e.wingTargetSpan = 1.15;
      e.scytheTargetAngle = 0;

      const pdx = e.x - player.x;
      const pdy = e.y - player.y;
      const pDist = Math.hypot(pdx, pdy);

      if (pDist > 40 && pDist < 360) {
        const pull = (e.isEnraged ? 1.15 : 0.85) * dt;
        player.x += (pdx / pDist) * pull;
        player.y += (pdy / pDist) * pull;
      }

      if (Math.floor(frameCount) % 5 === 0) {
        triggerShake(1.6);
        createHitParticles(player.x, player.y, '#00cec9', 1);
      }

      if (e.actionTimer <= 0) {
        triggerShake(15);
        triggerHaptic('heavy');
        playSfx('boss');

        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 18,
          maxRadius: 320,
          speed: 6.2,
          damage: Math.round(e.damage * 0.55),
          hitPlayer: false
        });

        const bladeCount = e.isEnraged ? 16 : 12;
        for (let s = 0; s < bladeCount; s++) {
          const sAng = (s * Math.PI * 2) / bladeCount;
          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(sAng) * 4.4,
            vy: Math.sin(sAng) * 4.4,
            radius: 7,
            damage: Math.round(e.damage * 0.28),
            life: 120
          });
        }

        e.actionState = 'POST_ATTACK_RECOVERY';
        e.actionTimer = 70;
      }
      return;
    }

    case 'WINDUP': {
      e.actionTimer -= dt;

      if (e.actionTimer > (e.isEnraged ? 8 : 14)) {
        e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
      }

      if (e.currentSkill === 'DOUBLE_CLEAVE') {
        e.wingTargetSpan = 1.30;
        e.scytheTargetAngle = -1.5 * e.facing;
      } else if (e.currentSkill === 'SOUL_SCYTHES') {
        e.wingTargetSpan = 0.85;
        e.scytheTargetAngle = frameCount * 0.25;
      } else if (e.currentSkill === 'VORTEX_HARVEST') {
        e.wingTargetSpan = 0.20;
        e.scytheTargetAngle = Math.PI * 0.5;
      }

      if (Math.floor(frameCount) % 3 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 1.3,
          e.y + (Math.random() - 0.5) * e.radius * 1.3,
          e.isEnraged ? '#ff4757' : '#00cec9',
          1
        );
      }

      if (e.actionTimer <= 0) {
        executeReaperSkill(e, context);
      }
      return;
    }

    case 'CHASE':
    default: {
      e.wingTargetSpan = 0.55;
      e.scytheTargetAngle = -0.3;

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      let curSpeed = e.speed;
      if (activeLanterns.length > 0) curSpeed *= (1 + 0.10 * activeLanterns.length);
      if (e.slowTimer > 0) curSpeed *= (1 - 0.18);

      if (dist > 85) {
        const angle = Math.atan2(dy, dx);
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
      }

      e.skillCooldown -= dt;
      if (e.skillCooldown <= 0) {
        selectReaperSkill(e, dist, player);
      }
      break;
    }
  }
}

function updateReaperLanterns(e, dt, context) {
  const bob = e.isVulnerable ? 22 : (e.floatBob || 0);

  for (let l of e.lanterns) {
    if (l.hitFlash > 0) l.hitFlash -= dt;
    if (l.hitCd > 0) l.hitCd -= dt;
    if (l.axeHitCd > 0) l.axeHitCd -= dt;

    if (!l.active) continue;

    l.angle += e.lanternAngularSpeed * dt;
    l.swayVel += -0.06 * l.sway;
    l.swayVel *= 0.94;
    l.sway += l.swayVel * dt;

    l.x = e.x + Math.cos(l.angle) * l.dist;
    l.y = e.y + Math.sin(l.angle) * (l.dist * 0.48) + bob + l.sway;

    if (l.hp <= 0) {
      destroyLantern(e, l, l.x, l.y, context);
    }
  }
}

function destroyLantern(boss, lantern, lx, ly, context) {
  lantern.active = false;

  const idx = enemies.indexOf(lantern);
  if (idx !== -1) enemies.splice(idx, 1);

  // Mecânica de Contragolpe (Backlash: 5% do HP máximo do chefe)
  const backlashDmg = Math.round(boss.maxHp * 0.05);
  boss.hp -= backlashDmg;

  playSfx('shatter');
  context.triggerShake(12);
  triggerHaptic('heavy');
  context.createHitParticles(lx, ly, '#00cec9', 22);
  context.createHitParticles(lx, ly, '#81ecec', 14);
  context.addDamageText(boss.x, boss.y, backlashDmg, true, '#f1c40f');
  context.addDamageText(lx, ly, "LANTERNA DESTRUÍDA!", true, '#00cec9');

  // Ao destruir a última lanterna da fase: Colapso por 6.0 segundos
  const activeCount = boss.lanterns.filter(o => o.active).length;
  if (activeCount === 0 && boss.actionState !== 'RECOVERY' && boss.actionState !== 'ENRAGE_TRANSITION') {
    boss.actionState = 'RECOVERY';
    boss.recoveryTimer = 360;
    boss.isVulnerable = true;

    context.triggerShake(16);
    triggerHaptic('heavy');
    playSfx('boss');
    context.addDamageText(boss.x, boss.y, "COLAPSO ESPIRITUAL (6.0s)!", true, '#81ecec');
  }
}

function checkReaperPhases(e, context) {
  const hpRatio = e.hp / e.maxHp;

  if (hpRatio < 0.45 && !e.hasEnraged) {
    e.hasEnraged = true;
    e.isEnraged = true;
    e.speed *= 1.32;
    e.lanternAngularSpeed *= 1.5;
    e.actionState = 'ENRAGE_TRANSITION';
    e.actionTimer = 65;
    e.isVulnerable = false;

    context.triggerShake(18);
    triggerHaptic('heavy');
    playSfx('boss');
    context.addDamageText(e.x, e.y, "DESPERTAR DA CEIFA!", true, '#e74c3c');

    context.bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 18,
      maxRadius: 340,
      speed: 6.5,
      damage: Math.round(e.damage * 0.42),
      hitPlayer: false
    });

    // Respawn da Fase de Fúria calibrado para 4.800 HP
    spawnReaperLanterns(e, 4, 4800, enemies);
    return;
  }

  if (hpRatio < 0.20 && !e.isPhase3) {
    e.isPhase3 = true;
    e.speed *= 1.20;
    e.lanternAngularSpeed *= 1.4;
    context.triggerShake(20);
    playSfx('boss');
    context.addDamageText(e.x, e.y, "DANÇA MACABRA!", true, '#ff4757');
  }
}

function updateSoulTether(e, dt, context) {
  if (!e.tetherActive) return;

  const { player, triggerShake, addDamageText, createHitParticles } = context;
  const dx = e.x - player.x;
  const dy = e.y - player.y;
  const dist = Math.hypot(dx, dy);

  if (dist > e.tetherMaxDist) {
    e.tetherActive = false;
    triggerShake(6);
    addDamageText(player.x, player.y, "VÍNCULO QUEBRADO!", true, '#2ecc71');
    playSfx('crit');
    return;
  }

  e.tetherTimer -= dt;
  player.x += (dx / dist) * 0.65 * dt;
  player.y += (dy / dist) * 0.65 * dt;

  if (Math.floor(context.frameCount) % 15 === 0) {
    if (player.iFrames <= 0) {
      player.hp -= 4;
      player.iFrames = 15;
      playSfx('hit');
      addDamageText(player.x, player.y, "-4", false, '#00cec9');
      createHitParticles(player.x, player.y, '#00cec9', 3);
    }
    e.hp = Math.min(e.maxHp, e.hp + 45);
    createHitParticles(e.x, e.y, '#2ecc71', 2);
  }

  if (e.tetherTimer <= 0) {
    e.tetherActive = false;
  }
}

function selectReaperSkill(e, dist, player) {
  const isEnraged = e.isEnraged || e.isPhase3;
  const rand = Math.random();

  if (dist < 160) {
    e.currentSkill = 'DOUBLE_CLEAVE';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 22 : 30;
  } else if (dist > 240 && rand < 0.42) {
    const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
    const flankOffset = (Math.random() < 0.5 ? 1 : -1) * (Math.PI * 0.35);
    const blinkAngle = angleToPlayer + flankOffset;
    const safeDistance = 160;

    const targetX = player.x + Math.cos(blinkAngle) * safeDistance;
    const targetY = player.y + Math.sin(blinkAngle) * safeDistance;
    const intendedCleaveAngle = Math.atan2(player.y - targetY, player.x - targetX);

    e.blinkTarget = {
      x: targetX,
      y: targetY,
      angle: blinkAngle,
      cleaveAngle: intendedCleaveAngle
    };

    e.currentSkill = 'PHANTOM_BLINK';
    e.actionState = 'BLINK_AIM';
    e.actionTimer = isEnraged ? 36 : 46;
  } else if (rand < 0.65) {
    e.currentSkill = 'SOUL_SCYTHES';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 26 : 34;
  } else if (!e.tetherActive && rand < 0.85) {
    e.currentSkill = 'SOUL_TETHER';
    e.actionState = 'WINDUP';
    e.actionTimer = 24;
  } else {
    e.currentSkill = 'VORTEX_HARVEST';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 24 : 32;
  }
}

function executeReaperSkill(e, context) {
  const {
    player,
    bossTelegraphs,
    bossProjectiles,
    triggerShake,
    addDamageText
  } = context;

  const angleToPlayer = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);

  switch (e.currentSkill) {
    case 'DOUBLE_CLEAVE': {
      playSfx('boss');
      triggerShake(11);
      triggerHaptic('heavy');
      e.wingTargetSpan = 1.35;
      e.scytheTargetAngle = 1.4 * e.facing;

      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 175,
        angle: angleToPlayer,
        timer: 18,
        maxTimer: 18,
        damage: Math.round(e.damage * 0.75),
        color: '#00cec9',
        colorRgb: '0, 206, 201',
        boss: e
      });

      e.delayedActions.push({
        timer: 14,
        callback: () => {
          playSfx('crit');
          bossTelegraphs.push({
            type: 'SCYTHE_CLEAVE',
            x: e.x,
            y: e.y,
            radius: 205,
            angle: angleToPlayer + 0.38 * e.facing,
            timer: 18,
            maxTimer: 18,
            damage: Math.round(e.damage * 0.90),
            color: '#ff4757',
            colorRgb: '255, 71, 87',
            boss: e
          });
        }
      });

      e.actionState = 'POST_ATTACK_RECOVERY';
      e.actionTimer = 70;
      break;
    }

    case 'SOUL_SCYTHES': {
      playSfx('shoot');
      const blades = e.isPhase3 ? 7 : (e.isEnraged ? 5 : 3);
      const arc = Math.PI * (e.isEnraged ? 0.65 : 0.45);
      const startAngle = angleToPlayer - arc / 2;
      const step = arc / (blades - 1);

      for (let i = 0; i < blades; i++) {
        const bAng = startAngle + i * step;
        bossProjectiles.push({
          type: 'SOUL_SCYTHE',
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * 6.5,
          vy: Math.sin(bAng) * 6.5,
          radius: 19,
          damage: Math.round(e.damage * 0.48),
          life: 140,
          maxLife: 140,
          color: e.isEnraged ? '#ff4757' : '#00cec9',
          isReturning: false
        });
      }

      e.actionState = 'POST_ATTACK_RECOVERY';
      e.actionTimer = 60;
      break;
    }

    case 'SOUL_TETHER': {
      playSfx('boss');
      e.tetherActive = true;
      e.tetherTimer = 160;
      e.actionState = 'CHASE';
      e.skillCooldown = 80;
      addDamageText(player.x, player.y, "VÍNCULO DE ALMAS!", true, '#00cec9');
      break;
    }

    case 'VORTEX_HARVEST': {
      playSfx('boss');
      triggerShake(8);
      e.actionState = 'VORTEX_HARVEST';
      e.actionTimer = e.isEnraged ? 75 : 95;
      break;
    }

    default: {
      e.actionState = 'CHASE';
      e.skillCooldown = 60;
      break;
    }
  }
}

function drawReaperShadow(ctx, e, bob, isVuln) {
  const shadowY = 56 + (isVuln ? 12 : 0);
  const shadowR = (e.radius * 0.88) - (isVuln ? 0 : bob * 0.35);

  const grad = ctx.createRadialGradient(0, shadowY, 4, 0, shadowY, shadowR);
  grad.addColorStop(0, 'rgba(5, 5, 8, 0.7)');
  grad.addColorStop(0.7, 'rgba(10, 15, 20, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowR, shadowR * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGhostTrail(ctx, e) {
  for (let t of e.ghostTrail) {
    if (t.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.enraged ? 'rgba(231, 76, 60, 0.35)' : 'rgba(0, 206, 201, 0.3)';
    ctx.beginPath();
    ctx.ellipse(t.x - e.x, t.y - e.y, e.radius * 0.7, e.radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawRecoveryGliph(ctx, e, frameCount) {
  const pulse = Math.sin(frameCount * 0.18) * 3.5;
  const R = e.radius * 1.15 + pulse;

  ctx.strokeStyle = '#81ecec';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 54, R, 22, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 206, 201, 0.1)';
  ctx.fill();

  const runeCount = 8;
  const rot = frameCount * 0.02;
  for (let k = 0; k < runeCount; k++) {
    const a = rot + (k * Math.PI * 2 / runeCount);
    const rx = Math.cos(a) * R;
    const ry = 54 + Math.sin(a) * 22;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry - 3);
    ctx.lineTo(rx + 3, ry + 3);
    ctx.stroke();
  }
}

function drawSpectralWings(ctx, e, bob, isVuln, isEnraged) {
  const wingSpan = e.wingSpan || 0.55;
  const wingCol = isVuln ? '#2d3436' : (isEnraged ? '#4a1017' : '#0a1d26');
  const boneCol = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#81ecec');

  ctx.save();
  ctx.translate(0, -18 + bob);

  for (let side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(-0.25 * wingSpan);

    ctx.strokeStyle = boneCol;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(35 * wingSpan, -35 * wingSpan, 78 * wingSpan, -25 * wingSpan);
    ctx.quadraticCurveTo(58 * wingSpan, 5, 25 * wingSpan, 20);
    ctx.stroke();

    ctx.fillStyle = wingCol;
    ctx.beginPath();
    ctx.moveTo(15, 5);
    ctx.quadraticCurveTo(45 * wingSpan, -15 * wingSpan, 75 * wingSpan, -22 * wingSpan);
    ctx.lineTo(88 * wingSpan, -10 * wingSpan);
    ctx.lineTo(62 * wingSpan, 25 * wingSpan);
    ctx.lineTo(35 * wingSpan, 35 * wingSpan);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
  ctx.restore();
}

function drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged) {
  const t = frameCount * 0.08;
  const drapeL = Math.sin(t) * 9 + Math.cos(t * 2.3) * 4;
  const drapeR = Math.cos(t) * 9 + Math.sin(t * 1.7) * 4;

  const robeDark = isVuln ? '#12171a' : (isEnraged ? '#1e0508' : '#06090e');
  const robeMid  = isVuln ? '#1e272e' : (isEnraged ? '#350a0f' : '#0e1721');
  const rimColor = isVuln ? '#57606f' : (isEnraged ? '#ff4757' : '#00cec9');

  ctx.fillStyle = robeDark;
  ctx.beginPath();
  ctx.moveTo(0, -56 + bob);
  ctx.quadraticCurveTo(-52, -10 + bob, -38 + drapeL, 48 + bob);
  ctx.quadraticCurveTo(0, 36 + bob, 38 + drapeR, 48 + bob);
  ctx.quadraticCurveTo(52, -10 + bob, 0, -56 + bob);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = robeMid;
  ctx.beginPath();
  ctx.moveTo(0, -42 + bob);
  ctx.quadraticCurveTo(-28, 0 + bob, -18 + drapeL * 0.5, 42 + bob);
  ctx.lineTo(18 + drapeR * 0.5, 42 + bob);
  ctx.quadraticCurveTo(28, 0 + bob, 0, -42 + bob);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-38 + drapeL, 48 + bob);
  ctx.quadraticCurveTo(0, 38 + bob, 38 + drapeR, 48 + bob);
  ctx.stroke();
}

function drawRibcageAndCore(ctx, bob, frameCount, isVuln, isEnraged) {
  const coreY = -12 + bob;
  const pulse = Math.sin(frameCount * (isEnraged ? 0.24 : 0.14)) * 3;
  const coreR = Math.max(6, 15 + pulse);

  const coreGrad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, coreR);
  if (isVuln) {
    coreGrad.addColorStop(0, '#7f8c8d');
    coreGrad.addColorStop(1, 'rgba(44, 62, 80, 0)');
  } else if (isEnraged) {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, '#ff4757');
    coreGrad.addColorStop(1, 'rgba(192, 57, 43, 0)');
  } else {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, '#81ecec');
    coreGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');
  }

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, coreY, coreR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isVuln ? '#636e72' : (isEnraged ? '#ff6b81' : '#dff9fb');
  ctx.lineWidth = 2.4;
  for (let r = 0; r < 4; r++) {
    const ry = -20 + r * 6 + bob;
    const rw = 16 - r * 2.2;
    ctx.beginPath();
    ctx.arc(0, ry, rw, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
}

function drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged) {
  const headY = -34 + bob;

  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.arc(0, headY, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isVuln ? '#636e72' : (isEnraged ? '#f8d7da' : '#ecf0f1');
  ctx.beginPath();
  ctx.moveTo(0, headY - 14);
  ctx.lineTo(12, headY - 4);
  ctx.lineTo(8, headY + 12);
  ctx.lineTo(0, headY + 16);
  ctx.lineTo(-8, headY + 12);
  ctx.lineTo(-12, headY - 4);
  ctx.closePath();
  ctx.fill();

  const eyeCol = isVuln ? '#7f8c8d' : (isEnraged ? '#ff4757' : '#00cec9');
  const eyeGlow = e.eyePulse * 2.0;

  ctx.fillStyle = eyeCol;
  ctx.beginPath();
  ctx.arc(-5, headY - 2, 2.5 + eyeGlow, 0, Math.PI * 2);
  ctx.arc(5, headY - 2, 2.5 + eyeGlow, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrnateScythe(ctx, e, bob, isVuln, isEnraged) {
  ctx.save();
  ctx.translate(44 * e.facing, -12 + bob);
  ctx.rotate(e.scytheAngle * e.facing);

  ctx.fillStyle = '#1e272e';
  ctx.fillRect(-3, -75, 6, 140);
  ctx.fillStyle = '#718093';
  ctx.fillRect(-4, -40, 8, 4);
  ctx.fillRect(-4, 10, 8, 4);

  const bladeGlow = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  ctx.strokeStyle = bladeGlow;
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.arc(-26 * e.facing, -75, 52, -0.2, Math.PI * 0.78 * (e.facing > 0 ? 1 : -1), e.facing < 0);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();
}

function drawGothicLanterns(ctx, e, bob, frameCount, isEnraged) {
  for (let l of e.lanterns) {
    if (!l.active) continue;

    const lx = Math.cos(l.angle) * l.dist;
    const ly = (Math.sin(l.angle) * (l.dist * 0.48)) + bob + l.sway;

    ctx.save();
    ctx.strokeStyle = isEnraged ? 'rgba(255, 71, 87, 0.4)' : 'rgba(0, 206, 201, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(0, -18 + bob);
    ctx.lineTo(lx, ly - l.radius);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(lx, ly);

    if (l.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, l.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = isEnraged ? '#3d0c11' : '#15222e';
      ctx.beginPath();
      ctx.moveTo(-l.radius * 0.7, -l.radius);
      ctx.lineTo(l.radius * 0.7, -l.radius);
      ctx.lineTo(l.radius * 0.9, l.radius * 0.7);
      ctx.lineTo(0, l.radius * 1.1);
      ctx.lineTo(-l.radius * 0.9, l.radius * 0.7);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isEnraged ? '#ff4757' : '#00cec9';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      const flameGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, l.radius * 0.65);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.5, isEnraged ? '#ff6b81' : '#81ecec');
      flameGrad.addColorStop(1, isEnraged ? '#c0392b' : '#00cec9');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(0, 0, l.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      const hpPct = Math.max(0, l.hp / l.maxHp);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, l.radius + 4, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPct));
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawBlinkAimIndicator(ctx, e, frameCount) {
  if (e.actionState !== 'BLINK_AIM' || !e.blinkTarget) return;

  const targetDx = e.blinkTarget.x - e.x;
  const targetDy = e.blinkTarget.y - e.y;

  ctx.save();
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.6)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -frameCount * 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(targetDx, targetDy);
  ctx.stroke();
  ctx.setLineDash([]);

  const pulse = Math.sin(frameCount * 0.22) * 5;
  const ringR = 38 + pulse;

  ctx.translate(targetDx, targetDy);

  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR, ringR * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 206, 201, 0.15)';
  ctx.fill();

  ctx.strokeStyle = '#81ecec';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(14, 0);
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 10);
  ctx.stroke();

  if (e.blinkTarget.cleaveAngle !== undefined) {
    const cleaveArc = Math.PI * 0.52;
    const startAng = e.blinkTarget.cleaveAngle - cleaveArc;
    const endAng = e.blinkTarget.cleaveAngle + cleaveArc;

    ctx.fillStyle = 'rgba(0, 206, 201, 0.16)';
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 165, startAng, endAng);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawSoulScytheAimLines(ctx, e, frameCount) {
  if (e.actionState !== 'WINDUP' || e.currentSkill !== 'SOUL_SCYTHES') return;

  const blades = e.isPhase3 ? 7 : (e.isEnraged ? 5 : 3);
  const arc = Math.PI * (e.isEnraged ? 0.65 : 0.45);
  const baseAngle = e.aimAngle || 0;
  const startAngle = baseAngle - arc / 2;
  const step = arc / (blades - 1);

  ctx.save();
  ctx.strokeStyle = e.isEnraged ? 'rgba(255, 71, 87, 0.45)' : 'rgba(0, 206, 201, 0.45)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([7, 6]);
  ctx.lineDashOffset = -frameCount * 1.5;

  for (let i = 0; i < blades; i++) {
    const bAng = startAngle + i * step;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(bAng) * 320, Math.sin(bAng) * 320);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHarvestField(ctx, e, frameCount) {
  const maxR = 320;
  const maxTime = e.isEnraged ? 75 : 95;
  const progress = Math.max(0, Math.min(1, 1 - (e.actionTimer / maxTime)));

  ctx.save();
  ctx.fillStyle = 'rgba(0, 206, 201, 0.06)';
  ctx.beginPath();
  ctx.arc(0, 0, maxR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 206, 201, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  const arms = 3;
  const spin = -frameCount * 0.05;
  ctx.lineWidth = 2;
  for (let a = 0; a < arms; a++) {
    const baseAng = spin + (a * Math.PI * 2 / arms);
    ctx.strokeStyle = `rgba(129, 236, 236, ${0.2 + (a % 2 === 0 ? 0.25 : 0.1)})`;
    ctx.beginPath();
    for (let step = 0; step < 16; step++) {
      const stepR = maxR * (1 - step / 16);
      const stepA = baseAng + step * 0.22;
      const sx = Math.cos(stepA) * stepR;
      const sy = Math.sin(stepA) * stepR;
      if (step === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  const shrinkR = Math.max(24, maxR * (1 - progress));
  ctx.strokeStyle = progress > 0.82 ? '#ffffff' : '#00cec9';
  ctx.lineWidth = progress > 0.82 ? 3.5 : 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, shrinkR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSoulTetherBeam(ctx, e, bob) {
  if (!e.tetherActive) return;

  const targetX = player.x - e.x;
  const targetY = player.y - e.y;
  const originY = -12 + bob;

  ctx.save();
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
  ctx.lineWidth = 3.2;
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -performance.now() * 0.04;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 10]);
  ctx.lineDashOffset = performance.now() * 0.05;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(targetX, targetY, 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 206, 201, 0.2)';
  ctx.fill();

  ctx.fillStyle = '#81ecec';
  ctx.beginPath();
  ctx.arc(targetX, targetY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawSupremeReaper(ctx, e, frameCount) {
  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged || e.isPhase3;
  const isWindup = e.actionState === 'WINDUP';
  const isHarvest = e.actionState === 'VORTEX_HARVEST';
  const isAimingBlink = e.actionState === 'BLINK_AIM';

  const bob = isVuln ? 22 : (e.floatBob || 0);

  ctx.save();
  ctx.scale(e.facing, 1);

  if (isAimingBlink) {
    ctx.globalAlpha = 0.65 + Math.sin(frameCount * 0.3) * 0.25;
  }

  if (isWindup || isHarvest) {
    ctx.translate((Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 3.5);
  }

  if (isHarvest) {
    drawHarvestField(ctx, e, frameCount);
  }

  drawSoulScytheAimLines(ctx, e, frameCount);
  drawBlinkAimIndicator(ctx, e, frameCount);
  drawReaperShadow(ctx, e, bob, isVuln);
  drawGhostTrail(ctx, e);

  if (isVuln) drawRecoveryGliph(ctx, e, frameCount);

  drawSpectralWings(ctx, e, bob, isVuln, isEnraged);
  drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged);
  drawRibcageAndCore(ctx, bob, frameCount, isVuln, isEnraged);
  drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged);
  drawOrnateScythe(ctx, e, bob, isVuln, isEnraged);
  drawSoulTetherBeam(ctx, e, bob);

  ctx.restore();

  // Renderiza as lanternas em coordenadas não invertidas
  drawGothicLanterns(ctx, e, bob, frameCount, isEnraged);
}