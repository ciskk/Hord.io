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
          timer: e.isEnraged ? 28 : 34,
          maxTimer: e.isEnraged ? 28 : 34,
          damage: Math.round(e.damage * 0.55),
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
        const spawnDist = 80;
        for (let s = 0; s < bladeCount; s++) {
          const sAng = (s * Math.PI * 2) / bladeCount;
          enemyBullets.push({
            x: e.x + Math.cos(sAng) * spawnDist,
            y: e.y + Math.sin(sAng) * spawnDist,
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
    e.actionTimer = isEnraged ? 26 : 34;
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
        timer: 32,
        maxTimer: 32,
        damage: Math.round(e.damage * 0.45),
        color: '#00cec9',
        colorRgb: '0, 206, 201',
        boss: e
      });

      e.delayedActions.push({
        timer: 20,
        callback: () => {
          playSfx('crit');
          bossTelegraphs.push({
            type: 'SCYTHE_CLEAVE',
            x: e.x,
            y: e.y,
            radius: 205,
            angle: angleToPlayer + 0.38 * e.facing,
            timer: 38,
            maxTimer: 38,
            damage: Math.round(e.damage * 0.55),
            color: '#ff4757',
            colorRgb: '255, 71, 87',
            boss: e
          });
        }
      });

      e.actionState = 'POST_ATTACK_RECOVERY';
      e.actionTimer = 75;
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
  const boneCol = isVuln ? '#636e72' : (isEnraged ? '#ff6b81' : '#81ecec');
  const boneShade = isVuln ? '#2d3436' : (isEnraged ? '#5a0d14' : '#0f323d');
  const ectoFill = isVuln 
    ? 'rgba(45, 52, 54, 0.4)' 
    : (isEnraged ? 'rgba(255, 71, 87, 0.28)' : 'rgba(0, 206, 201, 0.26)');

  ctx.save();
  ctx.translate(0, -20 + bob);

  for (let side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(-0.28 * wingSpan);

    // 1. Membranas de Ectoplasma Translúcidas (Penas Fantasmais)
    ctx.fillStyle = ectoFill;
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.quadraticCurveTo(42 * wingSpan, -25 * wingSpan, 85 * wingSpan, -28 * wingSpan);
    ctx.lineTo(96 * wingSpan, -14 * wingSpan);
    ctx.lineTo(76 * wingSpan, 18 * wingSpan);
    ctx.lineTo(48 * wingSpan, 32 * wingSpan);
    ctx.lineTo(24 * wingSpan, 24 * wingSpan);
    ctx.closePath();
    ctx.fill();

    // 2. Estrutura Óssea da Asa (Arched Bone Spine)
    ctx.strokeStyle = boneShade;
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(38 * wingSpan, -38 * wingSpan, 88 * wingSpan, -28 * wingSpan);
    ctx.stroke();

    ctx.strokeStyle = boneCol;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Falanges / Espigões Ósseos da Asa
    const fingerAngles = [
      { ex: 96 * wingSpan, ey: -14 * wingSpan },
      { ex: 76 * wingSpan, ey: 18 * wingSpan },
      { ex: 48 * wingSpan, ey: 32 * wingSpan }
    ];
    ctx.strokeStyle = boneCol;
    ctx.lineWidth = 1.8;
    for (let f of fingerAngles) {
      ctx.beginPath();
      ctx.moveTo(40 * wingSpan, -10 * wingSpan);
      ctx.lineTo(f.ex, f.ey);
      ctx.stroke();
    }

    ctx.restore();
  }
  ctx.restore();
}

function drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged) {
  const t = frameCount * 0.07;
  const drape1 = Math.sin(t) * 9 + Math.cos(t * 1.8) * 4;
  const drape2 = Math.cos(t * 1.2) * 8 + Math.sin(t * 2.3) * 3;
  const drapeMid = Math.sin(t * 1.5 + 1.2) * 6;

  const voidBlack = isVuln ? '#13191d' : (isEnraged ? '#180306' : '#03070d');
  const robeDeep   = isVuln ? '#1e272e' : (isEnraged ? '#2c080d' : '#08121a');
  const robeInner  = isVuln ? '#2c3e50' : (isEnraged ? '#4a0e16' : '#0c222d');
  const soulCyan   = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulLight  = isVuln ? '#b2bec3' : (isEnraged ? '#ff6b81' : '#81ecec');

  // Camada 1: Forro Interior de Almas (Undercloak Ethereal Glow)
  ctx.fillStyle = robeInner;
  ctx.beginPath();
  ctx.moveTo(0, -58 + bob);
  ctx.quadraticCurveTo(-54, -10 + bob, -42 + drape1, 52 + bob);
  ctx.quadraticCurveTo(0, 38 + bob, 42 + drape2, 52 + bob);
  ctx.quadraticCurveTo(54, -10 + bob, 0, -58 + bob);
  ctx.closePath();
  ctx.fill();

  // Camada 2: Manto Principal de Seda do Vazio (Outer Void Shroud)
  ctx.fillStyle = voidBlack;
  ctx.beginPath();
  ctx.moveTo(0, -54 + bob);
  ctx.quadraticCurveTo(-50, -12 + bob, -36 + drape1 * 0.8, 48 + bob);
  ctx.lineTo(-20 + drapeMid, 45 + bob);
  ctx.lineTo(-6, 50 + bob);
  ctx.lineTo(6, 47 + bob);
  ctx.lineTo(20 + drapeMid, 46 + bob);
  ctx.lineTo(36 + drape2 * 0.8, 48 + bob);
  ctx.quadraticCurveTo(50, -12 + bob, 0, -54 + bob);
  ctx.closePath();
  ctx.fill();

  // Camada 3: Painel Central com Dobras Verticais
  ctx.fillStyle = robeDeep;
  ctx.beginPath();
  ctx.moveTo(0, -42 + bob);
  ctx.quadraticCurveTo(-26, 0 + bob, -16 + drapeMid, 44 + bob);
  ctx.lineTo(16 + drapeMid, 44 + bob);
  ctx.quadraticCurveTo(26, 0 + bob, 0, -42 + bob);
  ctx.closePath();
  ctx.fill();

  // Borda Rúnica Luminosa na Barra do Manto
  ctx.strokeStyle = soulCyan;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-36 + drape1 * 0.8, 48 + bob);
  ctx.quadraticCurveTo(-18 + drapeMid, 42 + bob, 0, 46 + bob);
  ctx.quadraticCurveTo(18 + drapeMid, 42 + bob, 36 + drape2 * 0.8, 48 + bob);
  ctx.stroke();

  // Efeito de Almas Ascendendo da Barra do Manto
  if (!isVuln && Math.floor(frameCount) % 4 === 0) {
    const smokeX = (Math.random() - 0.5) * 60;
    const smokeY = 46 + bob + Math.random() * 6;
    ctx.fillStyle = Math.random() < 0.6 ? soulCyan : soulLight;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(smokeX, smokeY, 2.5, 2.5);
    ctx.globalAlpha = 1.0;
  }
}

function drawRibcageAndCore(ctx, bob, frameCount, isVuln, isEnraged) {
  const coreY = -12 + bob;
  const pulse = Math.sin(frameCount * (isEnraged ? 0.24 : 0.14)) * 3.5;
  const coreR = Math.max(6, 16 + pulse);

  const soulCyan  = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulGlow  = isVuln ? '#7f8c8d' : (isEnraged ? '#ff6b81' : '#81ecec');
  const boneCol   = isVuln ? '#576574' : (isEnraged ? '#f8d7da' : '#dff9fb');

  // 1. Núcleo das Almas (Soul Nexus Core) com Gradiente Tridimensional
  const coreGrad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, coreR);
  if (isVuln) {
    coreGrad.addColorStop(0, '#95a5a6');
    coreGrad.addColorStop(0.6, '#34495e');
    coreGrad.addColorStop(1, 'rgba(44, 62, 80, 0)');
  } else if (isEnraged) {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, '#ff4757');
    coreGrad.addColorStop(0.8, '#c0392b');
    coreGrad.addColorStop(1, 'rgba(192, 57, 43, 0)');
  } else {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, soulGlow);
    coreGrad.addColorStop(0.75, soulCyan);
    coreGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');
  }

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, coreY, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Partículas Orbitais do Núcleo
  if (!isVuln) {
    for (let p = 0; p < 3; p++) {
      const pAng = frameCount * 0.08 + p * (Math.PI * 2 / 3);
      const pDist = coreR * 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.cos(pAng) * pDist - 1.5, coreY + Math.sin(pAng) * (pDist * 0.5) - 1.5, 3, 3);
    }
  }

  // 2. Costelas Esqueléticas Protegendo o Núcleo (Skeletal Ribcage)
  ctx.strokeStyle = boneCol;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';

  // Espinha central
  ctx.beginPath();
  ctx.moveTo(0, -22 + bob);
  ctx.lineTo(0, 6 + bob);
  ctx.stroke();

  // Pares de Costelas Arqueadas
  for (let r = 0; r < 4; r++) {
    const ry = -20 + r * 6.5 + bob;
    const rw = 18 - r * 2.5;
    ctx.beginPath();
    ctx.arc(0, ry, rw, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
  }
}

function drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged) {
  const headY = -36 + bob;

  const soulCyan  = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulGlow  = isVuln ? '#7f8c8d' : (isEnraged ? '#ff6b81' : '#81ecec');
  const boneWhite = isVuln ? '#636e72' : (isEnraged ? '#f1dcd6' : '#e6f2f2');
  const boneShade = isVuln ? '#2d3436' : (isEnraged ? '#4a151b' : '#1e3842');

  // 1. Capuz Abissal com Espigões / Chifres Ósseos no Topo
  ctx.fillStyle = '#020509';
  ctx.beginPath();
  ctx.moveTo(0, headY - 26);
  ctx.lineTo(16, headY - 14);
  ctx.lineTo(18, headY + 14);
  ctx.lineTo(0, headY + 22);
  ctx.lineTo(-18, headY + 14);
  ctx.lineTo(-16, headY - 14);
  ctx.closePath();
  ctx.fill();

  // Chifres / Cristas Ósseas do Capuz
  ctx.strokeStyle = boneShade;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-10, headY - 16);
  ctx.quadraticCurveTo(-18, headY - 28, -22, headY - 32);
  ctx.moveTo(10, headY - 16);
  ctx.quadraticCurveTo(18, headY - 28, 22, headY - 32);
  ctx.stroke();

  // 2. Máscara de Caveira Entalhada em Marfim Antigo
  ctx.fillStyle = boneWhite;
  ctx.beginPath();
  ctx.moveTo(0, headY - 15);
  ctx.lineTo(13, headY - 5);
  ctx.lineTo(10, headY + 5);
  ctx.lineTo(6, headY + 13);
  ctx.lineTo(0, headY + 17);
  ctx.lineTo(-6, headY + 13);
  ctx.lineTo(-10, headY + 5);
  ctx.lineTo(-13, headY - 5);
  ctx.closePath();
  ctx.fill();

  // Sombreamento craniano e mandíbula
  ctx.fillStyle = boneShade;
  ctx.beginPath();
  ctx.moveTo(-4, headY + 11);
  ctx.lineTo(4, headY + 11);
  ctx.lineTo(2, headY + 16);
  ctx.lineTo(-2, headY + 16);
  ctx.closePath();
  ctx.fill();

  // Cavidade Nasal Triangular
  ctx.fillStyle = '#050a0f';
  ctx.beginPath();
  ctx.moveTo(0, headY + 3);
  ctx.lineTo(-2.5, headY + 7);
  ctx.lineTo(2.5, headY + 7);
  ctx.closePath();
  ctx.fill();

  // Cavidades Oculares Profundas e Chamas de Almas Incandescentes
  const eyePulse = e.eyePulse || 0.5;
  const eyeR = 3.2 + eyePulse * 1.8;

  // Cavidade escura do olho
  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.ellipse(-5.5, headY - 1, 4.5, 3.2, -0.15, 0, Math.PI * 2);
  ctx.ellipse(5.5, headY - 1, 4.5, 3.2, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Fogo Fátuo nos Olhos com Auréola Luminosa
  const eyeGrad = ctx.createRadialGradient(-5.5, headY - 1, 1, -5.5, headY - 1, eyeR);
  eyeGrad.addColorStop(0, '#ffffff');
  eyeGrad.addColorStop(0.5, soulGlow);
  eyeGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');

  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.arc(-5.5, headY - 1, eyeR, 0, Math.PI * 2);
  ctx.fill();

  const eyeGradR = ctx.createRadialGradient(5.5, headY - 1, 1, 5.5, headY - 1, eyeR);
  eyeGradR.addColorStop(0, '#ffffff');
  eyeGradR.addColorStop(0.5, soulGlow);
  eyeGradR.addColorStop(1, 'rgba(0, 206, 201, 0)');

  ctx.fillStyle = eyeGradR;
  ctx.beginPath();
  ctx.arc(5.5, headY - 1, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Rastro Dinâmico de Luz dos Olhos
  if (!isVuln) {
    const trailLen = 8 + eyePulse * 6;
    ctx.strokeStyle = soulCyan;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-5.5, headY - 1);
    ctx.quadraticCurveTo(-10 - eyePulse * 4, headY - 4, -5.5 - trailLen, headY - 3 + Math.sin(frameCount * 0.3) * 2);
    ctx.moveTo(5.5, headY - 1);
    ctx.quadraticCurveTo(10 + eyePulse * 4, headY - 4, 5.5 + trailLen, headY - 3 + Math.sin(frameCount * 0.3) * 2);
    ctx.stroke();
  }
}

function drawOrnateScythe(ctx, e, bob, isVuln, isEnraged) {
  ctx.save();
  // Posiciona a foice na mão frontal do Ceifador (+X é a direção para frente)
  ctx.translate(36, -10 + bob);
  ctx.rotate(e.scytheAngle);

  const soulCyan  = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const soulGlow  = isVuln ? '#7f8c8d' : (isEnraged ? '#ff6b81' : '#81ecec');

  // 1. Cabo Esculpido em Ferro Espectral com Envolturas Místicas
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(-3, -80, 6, 155);

  // Bandagens / Envolturas no Cabo
  ctx.fillStyle = '#57606f';
  for (let b = 0; b < 4; b++) {
    ctx.fillRect(-4, -50 + b * 22, 8, 4);
  }

  // Pomo e Encaixe de Caveira no Topo do Cabo
  ctx.fillStyle = '#2f3542';
  ctx.beginPath();
  ctx.arc(0, -80, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = soulCyan;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // 2. Lâmina Monumental de Foice em Lua Crescente
  // Brilho Externo de Plasma Espectral
  ctx.strokeStyle = soulCyan;
  ctx.lineWidth = 7.0;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-28, -78, 56, -0.22, Math.PI * 0.82, false);
  ctx.stroke();

  // Lâmina Branca Incandescente Central
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Dentes / Farpas Serrilhadas Internas da Lâmina
  ctx.fillStyle = soulGlow;
  for (let d = 0; d < 3; d++) {
    const barbAng = 0.15 + d * 0.28;
    const bx = -28 + Math.cos(barbAng) * 52;
    const by = -78 + Math.sin(barbAng) * 52;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 7, by + 4);
    ctx.lineTo(bx - 3, by + 8);
    ctx.closePath();
    ctx.fill();
  }

  // Ponto de Luz Espectral na Ponta da Lâmina
  const tipX = -28 + Math.cos(-0.22) * 56;
  const tipY = -78 + Math.sin(-0.22) * 56;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(tipX, tipY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGothicLanterns(ctx, e, bob, frameCount, isEnraged) {
  for (let l of e.lanterns) {
    if (!l.active) continue;

    const lx = Math.cos(l.angle) * l.dist;
    const ly = (Math.sin(l.angle) * (l.dist * 0.48)) + bob + l.sway;

    // Corrente de Sustentação
    ctx.save();
    ctx.strokeStyle = isEnraged ? 'rgba(255, 71, 87, 0.45)' : 'rgba(0, 206, 201, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, -18 + bob);
    ctx.lineTo(lx, ly - l.radius - 6);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(lx, ly);

    if (l.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, l.radius + 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 1. Corpo da Gaiola Gótica de Ferro Forjado
      ctx.fillStyle = isEnraged ? '#2c080d' : '#0d1821';
      ctx.beginPath();
      ctx.moveTo(-l.radius * 0.7, -l.radius);
      ctx.lineTo(l.radius * 0.7, -l.radius);
      ctx.lineTo(l.radius * 0.9, l.radius * 0.65);
      ctx.lineTo(0, l.radius * 1.15);
      ctx.lineTo(-l.radius * 0.9, l.radius * 0.65);
      ctx.closePath();
      ctx.fill();

      // Borda e Barras de Ferro
      ctx.strokeStyle = isEnraged ? '#ff4757' : '#00cec9';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Barras verticais da gaiola
      ctx.beginPath();
      ctx.moveTo(-l.radius * 0.35, -l.radius);
      ctx.lineTo(-l.radius * 0.45, l.radius * 0.65);
      ctx.moveTo(l.radius * 0.35, -l.radius);
      ctx.lineTo(l.radius * 0.45, l.radius * 0.65);
      ctx.moveTo(0, -l.radius);
      ctx.lineTo(0, l.radius * 1.15);
      ctx.stroke();

      // 2. Alma Prisioneira / Fogo Fátuo Vivo no Interior
      const wispAngle = frameCount * 0.12;
      const wispR = l.radius * 0.6;
      const flameGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, wispR);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.4, isEnraged ? '#ff6b81' : '#81ecec');
      flameGrad.addColorStop(1, isEnraged ? '#c0392b' : '#00cec9');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(0, 0, wispR, 0, Math.PI * 2);
      ctx.fill();

      // Micro-alma orbitando no interior do vidro
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(Math.cos(wispAngle) * (wispR * 0.5), Math.sin(wispAngle) * (wispR * 0.5), 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 3. Barra Circular de Vida da Lanterna
      const hpPct = Math.max(0, l.hp / l.maxHp);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, l.radius + 5, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPct));
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

  // 1. Filamento espectral ligando a posição atual ao destino
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -frameCount * 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(targetDx, targetDy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.translate(targetDx, targetDy);

  // 2. Fenda Espectral no Chão (Rift Portal)
  const pulse = Math.sin(frameCount * 0.22) * 5;
  const ringR = 42 + pulse;

  // Disco abissal no chão
  ctx.fillStyle = 'rgba(3, 7, 13, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR, ringR * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  // Anéis rúnicos concentricos
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR, ringR * 0.52, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(129, 236, 236, 0.6)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR * 0.65, ringR * 0.32, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Runa central de mira
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(16, 0);
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 10);
  ctx.stroke();

  // 3. Silhueta Espectral Translúcida do Ceifador (Holograma de Aviso)
  const phantomAlpha = 0.35 + Math.sin(frameCount * 0.25) * 0.12;
  ctx.save();
  ctx.globalAlpha = phantomAlpha;
  // Silhueta do corpo em névoa
  ctx.fillStyle = '#00cec9';
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.quadraticCurveTo(-26, -10, -18, 20);
  ctx.lineTo(18, 20);
  ctx.quadraticCurveTo(26, -10, 0, -48);
  ctx.closePath();
  ctx.fill();

  // Olhos brilhantes do fantasma
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-5, -28, 3, 3);
  ctx.fillRect(5, -28, 3, 3);

  // Silhueta da foice erguida
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(15, -45, 30, -0.4, Math.PI * 0.65);
  ctx.stroke();
  ctx.restore();

  // 4. Cone Telegrafado do Corte Iminente
  if (e.blinkTarget.cleaveAngle !== undefined) {
    const cleaveArc = Math.PI * 0.52;
    const startAng = e.blinkTarget.cleaveAngle - cleaveArc;
    const endAng = e.blinkTarget.cleaveAngle + cleaveArc;

    // Área do corte no chão
    ctx.fillStyle = 'rgba(0, 206, 201, 0.18)';
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 165, startAng, endAng);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arco frontal brilhante com setas
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, 165, startAng, endAng);
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
  ctx.strokeStyle = e.isEnraged ? 'rgba(255, 71, 87, 0.55)' : 'rgba(0, 206, 201, 0.55)';
  ctx.lineWidth = 2.0;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -frameCount * 1.8;

  for (let i = 0; i < blades; i++) {
    const bAng = startAngle + i * step;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(bAng) * 340, Math.sin(bAng) * 340);
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

  // 1. Círculo Limite de Ruptura do Vínculo (310px) centrado no Ceifador
  const maxR = e.tetherMaxDist || 310;
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.40)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 8]);
  ctx.lineDashOffset = -performance.now() * 0.02;
  ctx.beginPath();
  ctx.arc(0, 0, maxR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Marcadores de pulso nas 4 direções cardeais do anel
  ctx.fillStyle = '#81ecec';
  for (let k = 0; k < 4; k++) {
    const ma = (k * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(ma) * maxR, Math.sin(ma) * maxR, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Feixe / Corrente de Almas entre Ceifador e Jogador
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
  ctx.lineWidth = 3.5;
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -performance.now() * 0.04;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 10]);
  ctx.lineDashOffset = performance.now() * 0.05;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Orbe / Ponto de conexão na vítima (Jogador)
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(targetX, targetY, 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 206, 201, 0.22)';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
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

  // 1. ELEMENTOS E INDICADORES DO ESPAÇO DO MUNDO (Não invertidos horizontalmente)
  // Contexto vem de enemiesRenderer com ctx.translate(e.x, e.y) e ctx.scale(e.facing, 1).
  // Se e.facing === -1, invertemos X com ctx.scale(-1, 1) para restaurar as coordenadas mundiais reais.
  ctx.save();
  if (e.facing === -1) {
    ctx.scale(-1, 1);
  }

  if (isHarvest) {
    drawHarvestField(ctx, e, frameCount);
  }

  drawSoulScytheAimLines(ctx, e, frameCount);
  drawBlinkAimIndicator(ctx, e, frameCount);
  drawSoulTetherBeam(ctx, e, bob);
  drawGhostTrail(ctx, e);
  drawGothicLanterns(ctx, e, bob, frameCount, isEnraged);

  if (isVuln) drawRecoveryGliph(ctx, e, frameCount);

  ctx.restore();

  // 2. CORPO DO CHEFE (Espaço local com +X orientado para frente)
  ctx.save();

  if (isAimingBlink) {
    ctx.globalAlpha = 0.65 + Math.sin(frameCount * 0.3) * 0.25;
  }

  if (isWindup || isHarvest) {
    ctx.translate((Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 3.5);
  }

  drawReaperShadow(ctx, e, bob, isVuln);
  drawSpectralWings(ctx, e, bob, isVuln, isEnraged);
  drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged);
  drawRibcageAndCore(ctx, bob, frameCount, isVuln, isEnraged);
  drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged);
  drawOrnateScythe(ctx, e, bob, isVuln, isEnraged);

  ctx.restore();
}