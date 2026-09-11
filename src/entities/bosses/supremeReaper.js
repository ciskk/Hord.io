/**
 * src/entities/bosses/supremeReaper.js
 * Módulo de Comportamento, Física e Renderização Procedural: Ceifador Supremo (bossId: 3)
 * Survivor / Bullet-Heaven "Hord.io"
 */

import { playSfx, triggerHaptic } from '../../core/audio.js';
import { bullets, acidPuddles } from '../../main.js';

// ============================================================================
// 1. INICIALIZAÇÃO E SUBSISTEMAS DO CEIFADOR SUPREMO
// ============================================================================

export function initSupremeReaper(boss) {
  // 1. Máquina de Estados Finita (FSM)
  // 'CHASE', 'WINDUP', 'BLINK_AIM', 'VORTEX_HARVEST', 'SOUL_TETHER', 'RECOVERY', 'ENRAGE_TRANSITION'
  boss.actionState = 'CHASE';
  boss.actionTimer = 0;
  boss.currentSkill = null;
  boss.skillCooldown = 75;

  // Fila de ações diferidas sincronizadas com o delta time (dt)
  boss.delayedActions = [];

  // 2. Janelas de Vulnerabilidade e Colapso Espiritual
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;
  boss.prevHp = boss.hp;

  // 3. Lanternas das Almas dos Condenados
  boss.lanterns = [
    { angle: 0, dist: 105, radius: 16, hp: 1800, maxHp: 1800, active: true, hitFlash: 0, hitCd: 0, sway: 0, swayVel: 0 },
    { angle: (Math.PI * 2) / 3, dist: 105, radius: 16, hp: 1800, maxHp: 1800, active: true, hitFlash: 0, hitCd: 0, sway: 0, swayVel: 0 },
    { angle: (Math.PI * 4) / 3, dist: 105, radius: 16, hp: 1800, maxHp: 1800, active: true, hitFlash: 0, hitCd: 0, sway: 0, swayVel: 0 }
  ];
  boss.lanternAngularSpeed = 0.026;

  // 4. Fases
  boss.hasEnraged = false;
  boss.isEnraged = false;
  boss.isPhase3 = false;

  // 5. Vínculo e Teleporte Tático
  boss.tetherActive = false;
  boss.tetherTimer = 0;
  boss.tetherMaxDist = 310;
  boss.blinkTarget = null; // { x, y, angle }
  boss.phantoms = [];

  // 6. Micro-animações procedurais
  boss.floatY = 0;
  boss.floatBob = 0;
  boss.facing = 1;
  boss.wingSpan = 0.45;
  boss.wingTargetSpan = 0.45;
  boss.scytheAngle = -0.3;
  boss.scytheTargetAngle = -0.3;
  boss.eyePulse = 0;
  boss.ghostTrail = [];
}

// ============================================================================
// 2. ATUALIZAÇÃO DA LÓGICA E COMBATE
// ============================================================================

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

  // Processa ações agendadas orientadas a delta time
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

  // Animações procedurais básicas
  e.floatBob = Math.sin(frameCount * 0.065) * 8;
  e.floatY = e.floatBob;
  e.facing = (player.x - e.x) > 0 ? 1 : -1;
  e.eyePulse = (Math.sin(frameCount * (e.isEnraged ? 0.22 : 0.12)) + 1) * 0.5;

  e.wingSpan += (e.wingTargetSpan - e.wingSpan) * 0.12 * dt;
  e.scytheAngle += (e.scytheTargetAngle - e.scytheAngle) * 0.15 * dt;

  // Rastro fantasmagórico
  if (Math.floor(frameCount) % 3 === 0) {
    e.ghostTrail.unshift({
      x: e.x,
      y: e.y + e.floatBob,
      alpha: e.isPhase3 ? 0.6 : 0.38,
      enraged: e.isEnraged || e.isPhase3
    });
    if (e.ghostTrail.length > 7) e.ghostTrail.pop();
  }
  for (let i = e.ghostTrail.length - 1; i >= 0; i--) {
    e.ghostTrail[i].alpha -= 0.016 * dt;
    if (e.ghostTrail[i].alpha <= 0) e.ghostTrail.splice(i, 1);
  }

  // Mitigação por Lanternas Espirituais
  const activeLanterns = e.lanterns.filter(l => l.active);
  if (activeLanterns.length > 0 && e.actionState !== 'RECOVERY') {
    if (e.hp < e.prevHp) {
      const damageTaken = e.prevHp - e.hp;
      e.hp += damageTaken * 0.70;
      if (Math.floor(frameCount) % 4 === 0) {
        createHitParticles(e.x, e.y, '#00cec9', 2);
      }
    }
  }
  e.prevHp = e.hp;

  updateReaperLanterns(e, dt, context);
  checkReaperPhases(e, context);
  updateSoulTether(e, dt, context);

  // MÁQUINA DE ESTADOS PRINCIPAL
  switch (e.actionState) {
    case 'ENRAGE_TRANSITION': {
      e.actionTimer -= dt;
      e.wingTargetSpan = 1.1;
      if (Math.floor(frameCount) % 3 === 0) triggerShake(3.5);
      if (e.actionTimer <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = 25;
      }
      return;
    }

    case 'RECOVERY': {
      e.recoveryTimer -= dt;
      e.isVulnerable = true;
      e.wingTargetSpan = 0.2;
      e.scytheTargetAngle = 0.8;

      if (Math.floor(frameCount) % 5 === 0) {
        createHitParticles(e.x + (Math.random() - 0.5) * e.radius, e.y + (Math.random() - 0.5) * e.radius, '#81ecec', 1);
      }

      if (e.recoveryTimer <= 0) {
        e.isVulnerable = false;
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 40 : 65;

        triggerShake(13);
        triggerHaptic('heavy');
        playSfx('boss');
        addDamageText(e.x, e.y, "RECONSTITUIÇÃO DAS ALMAS!", true, '#00cec9');

        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 18,
          maxRadius: 260,
          speed: 5.4,
          damage: Math.round(e.damage * 0.38),
          hitPlayer: false
        });

        const lCount = e.isPhase3 ? 5 : (e.isEnraged ? 4 : 3);
        const lHp = e.isPhase3 ? 2400 : (e.isEnraged ? 2000 : 1600);
        e.lanterns = [];
        for (let k = 0; k < lCount; k++) {
          e.lanterns.push({
            angle: (k * Math.PI * 2) / lCount,
            dist: 105,
            radius: 16,
            hp: lHp,
            maxHp: lHp,
            active: true,
            hitFlash: 0,
            hitCd: 0,
            sway: 0,
            swayVel: 0
          });
        }
      }
      return;
    }

    // AVISO PRÉVIO E TELEMETRIA DO TELEPORTE
    case 'BLINK_AIM': {
      e.actionTimer -= dt;
      e.wingTargetSpan = 0.15; // Encolhe as asas enquanto se desmaterializa

      if (Math.floor(frameCount) % 3 === 0 && e.blinkTarget) {
        // Partículas fluindo do chefe até o destino
        createHitParticles(e.blinkTarget.x, e.blinkTarget.y, '#00cec9', 2);
        createHitParticles(e.x, e.y, '#00cec9', 1);
      }

      // Conclusão do salto
      if (e.actionTimer <= 0 && e.blinkTarget) {
        playSfx('boss');
        triggerShake(10);
        triggerHaptic('heavy');

        // Partículas no ponto de partida e no ponto de chegada
        createHitParticles(e.x, e.y, '#00cec9', 15);
        e.x = e.blinkTarget.x;
        e.y = e.blinkTarget.y;
        createHitParticles(e.x, e.y, '#00cec9', 18);

        // Miragens laterais
        const sideAng = e.blinkTarget.angle + Math.PI * 0.5;
        e.phantoms = [
          { x: e.x + Math.cos(sideAng) * 60, y: e.y + Math.sin(sideAng) * 60, life: 25 },
          { x: e.x - Math.cos(sideAng) * 60, y: e.y - Math.sin(sideAng) * 60, life: 25 }
        ];

        // Dispara o corte frontal na direção do jogador, mas com telegrafia visível para esquiva
        const finalAngle = Math.atan2(player.y - e.y, player.x - e.x);
        bossTelegraphs.push({
          type: 'SCYTHE_CLEAVE',
          x: e.x,
          y: e.y,
          radius: 165,
          angle: finalAngle,
          timer: e.isEnraged ? 22 : 28, // Janela de reação de quase 0.5s
          maxTimer: e.isEnraged ? 22 : 28,
          damage: Math.round(e.damage * 0.85),
          boss: e
        });

        e.blinkTarget = null;
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 42 : 62;
      }
      return;
    }

    case 'VORTEX_HARVEST': {
      e.actionTimer -= dt;
      e.wingTargetSpan = 0.95;
      e.scytheTargetAngle = Math.PI * 0.5;

      const pdx = e.x - player.x;
      const pdy = e.y - player.y;
      const pDist = Math.hypot(pdx, pdy);

      if (pDist > 40 && pDist < 480) {
        const pull = (e.isEnraged ? 1.2 : 0.9) * dt;
        player.x += (pdx / pDist) * pull;
        player.y += (pdy / pDist) * pull;
      }

      if (Math.floor(frameCount) % 5 === 0) {
        triggerShake(1.8);
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

        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 45 : 70;
      }
      return;
    }

    case 'WINDUP': {
      e.actionTimer -= dt;
      e.wingTargetSpan = 0.25;
      e.scytheTargetAngle = -1.2 * e.facing;

      if (Math.floor(frameCount) % 3 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 1.3,
          e.y + (Math.random() - 0.5) * e.radius * 1.3,
          e.isEnraged ? '#e74c3c' : '#00cec9',
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
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        curSpeed *= (1 - 0.18);
      }

      if (dist > 80) {
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

// ============================================================================
// 3. FÍSICA DAS LANTERNAS E INTERAÇÃO COM O ARSENAL DO JOGADOR
// ============================================================================

function updateReaperLanterns(e, dt, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  for (let l of e.lanterns) {
    if (l.hitFlash > 0) l.hitFlash -= dt;
    if (l.hitCd > 0) l.hitCd -= dt;

    if (!l.active) continue;

    l.angle += e.lanternAngularSpeed * dt;
    const lx = e.x + Math.cos(l.angle) * l.dist;
    const ly = e.y + Math.sin(l.angle) * (l.dist * 0.48) + e.floatBob;

    l.swayVel += -0.06 * l.sway;
    l.swayVel *= 0.94;
    l.sway += l.swayVel * dt;

    // Colisão com Projéteis
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      const bdx = b.x - lx;
      const bdy = b.y - ly;
      const rSum = (b.radius || 6) + l.radius;

      if (bdx * bdx + bdy * bdy < rSum * rSum) {
        let dmg = b.damage || 24;
        l.hp -= dmg;
        l.hitFlash = 3;
        l.swayVel += 0.8;
        createHitParticles(lx, ly, '#00cec9', 3);
        addDamageText(lx, ly, Math.round(dmg), false, '#81ecec');
        playSfx('hit');

        b.piercing = (b.piercing || 1) - 1;
        if (b.piercing <= 0) b.life = 0;

        if (l.hp <= 0) {
          destroyLantern(e, l, lx, ly, context);
          break;
        }
      }
    }

    // Colisão com Machados Orbitais
    if (player.orbitals > 0 && l.active && l.hitCd <= 0) {
      const pOrbDist = player.evolvedOrbitals ? 88 : 72;
      for (let k = 0; k < player.orbitals; k++) {
        const pAng = player.orbitalAngle + (k * Math.PI * 2 / player.orbitals);
        const px = player.x + Math.cos(pAng) * pOrbDist;
        const py = player.y + Math.sin(pAng) * pOrbDist;

        if ((px - lx) ** 2 + (py - ly) ** 2 < (l.radius + 15) ** 2) {
          const dmg = player.damage * (player.evolvedOrbitals ? 1.15 : 0.75);
          l.hp -= dmg;
          l.hitFlash = 4;
          l.hitCd = 14;
          l.swayVel += 1.2;
          createHitParticles(lx, ly, '#00cec9', 4);
          addDamageText(lx, ly, Math.round(dmg), false, '#00cec9');
          playSfx('hit');

          if (l.hp <= 0) {
            destroyLantern(e, l, lx, ly, context);
            break;
          }
        }
      }
    }

    // Colisão com Poças
    if (l.active) {
      for (let p of acidPuddles) {
        if (!p.isFire && !p.isAlchemist) continue;
        const pdx = p.x - lx;
        const pdy = p.y - ly;
        if (pdx * pdx + pdy * pdy < (p.radius + l.radius) ** 2) {
          l.hp -= 1.2 * dt;
          if (Math.floor(context.frameCount) % 10 === 0) {
            createHitParticles(lx, ly, p.isFire ? '#e67e22' : '#2ecc71', 1);
          }
          if (l.hp <= 0) {
            destroyLantern(e, l, lx, ly, context);
            break;
          }
        }
      }
    }
  }
}

function destroyLantern(boss, lantern, lx, ly, context) {
  lantern.active = false;
  context.triggerShake(9);
  triggerHaptic('medium');
  playSfx('boss');
  context.createHitParticles(lx, ly, '#00cec9', 16);
  context.addDamageText(lx, ly, "LANTERNA DESTRUÍDA!", true, '#00cec9');

  const activeCount = boss.lanterns.filter(o => o.active).length;
  if (activeCount === 0 && boss.actionState !== 'RECOVERY' && boss.actionState !== 'ENRAGE_TRANSITION') {
    boss.actionState = 'RECOVERY';
    boss.recoveryTimer = boss.isEnraged ? 210 : 270;
    boss.isVulnerable = true;

    context.triggerShake(14);
    triggerHaptic('heavy');
    playSfx('boss');
    context.addDamageText(boss.x, boss.y, "COLAPSO ESPIRITUAL!", true, '#81ecec');

    for (let i = 0; i < 24; i++) {
      context.createHitParticles(boss.x, boss.y, '#00cec9', 1);
    }
  }
}

// ============================================================================
// 4. TRANSIÇÕES DE FASE E VÍNCULO DE ALMAS
// ============================================================================

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

    e.lanterns = [
      { angle: 0, dist: 110, radius: 16, hp: 2000, maxHp: 2000, active: true, hitFlash: 0, hitCd: 0, sway: 0, swayVel: 0 },
      { angle: Math.PI * 0.5, dist: 110, radius: 16, hp: 2000, maxHp: 2000, active: true, hitFlash: 0, hitCd: 0, sway: 0, swayVel: 0 },
      { angle: Math.PI, dist: 110, radius: 16, hp: 2000, maxHp: 2000, active: true, hitFlash: 0, hitCd: 0, sway: 0, swayVel: 0 },
      { angle: Math.PI * 1.5, dist: 110, radius: 16, hp: 2000, maxHp: 2000, active: true, hitFlash: 0, hitCd: 0, sway: 0, swayVel: 0 }
    ];
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
    }
    e.hp = Math.min(e.maxHp, e.hp + 45);
    createHitParticles(e.x, e.y, '#2ecc71', 2);
  }

  if (e.tetherTimer <= 0) {
    e.tetherActive = false;
  }
}

// ============================================================================
// 5. MOTOR DE HABILIDADES E SELEÇÃO DE ATAQUES
// ============================================================================

function selectReaperSkill(e, dist, player) {
  const isEnraged = e.isEnraged || e.isPhase3;
  const rand = Math.random();

  if (dist < 160) {
    e.currentSkill = 'DOUBLE_CLEAVE';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 20 : 28;
  } else if (dist > 250 && rand < 0.42) {
    // PREPARA O TELEPORTE COM AVISO DE MIRA E DISTÂNCIA SEGURA
    const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
    // Flanqueia o jogador com desvio angular a 170px de distância (não cai na cabeça)
    const flankOffset = (Math.random() < 0.5 ? 1 : -1) * (Math.PI * 0.38);
    const blinkAngle = angleToPlayer + flankOffset;
    const safeDistance = 170;

    e.blinkTarget = {
      x: player.x + Math.cos(blinkAngle) * safeDistance,
      y: player.y + Math.sin(blinkAngle) * safeDistance,
      angle: blinkAngle
    };

    e.currentSkill = 'PHANTOM_BLINK';
    e.actionState = 'BLINK_AIM';
    e.actionTimer = isEnraged ? 36 : 46; // ~0.6s - 0.75s de aviso antes do salto
  } else if (rand < 0.65) {
    e.currentSkill = 'SOUL_SCYTHES';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 22 : 30;
  } else if (!e.tetherActive && rand < 0.85) {
    e.currentSkill = 'SOUL_TETHER';
    e.actionState = 'WINDUP';
    e.actionTimer = 22;
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
    triggerShake
  } = context;

  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const angleToPlayer = Math.atan2(dy, dx);

  switch (e.currentSkill) {
    case 'DOUBLE_CLEAVE': {
      playSfx('boss');
      triggerShake(11);
      triggerHaptic('heavy');
      e.wingTargetSpan = 1.0;
      e.scytheTargetAngle = 1.3 * e.facing;

      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 175,
        angle: angleToPlayer,
        timer: 18,
        maxTimer: 18,
        damage: Math.round(e.damage * 0.75),
        boss: e
      });

      e.delayedActions.push({
        timer: 12,
        callback: () => {
          bossTelegraphs.push({
            type: 'SCYTHE_CLEAVE',
            x: e.x,
            y: e.y,
            radius: 195,
            angle: angleToPlayer + 0.35 * e.facing,
            timer: 16,
            maxTimer: 16,
            damage: Math.round(e.damage * 0.85),
            boss: e
          });
        }
      });

      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 35 : 55;
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
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * 6.6,
          vy: Math.sin(bAng) * 6.6,
          radius: 19,
          damage: Math.round(e.damage * 0.48),
          life: 140,
          maxLife: 140
        });
      }

      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 36 : 52;
      break;
    }

    case 'SOUL_TETHER': {
      playSfx('boss');
      e.tetherActive = true;
      e.tetherTimer = 160;
      e.actionState = 'CHASE';
      e.skillCooldown = 80;
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

// ============================================================================
// 6. RENDERIZADOR PROCEDURAL VETORIAL EM CAMADAS (CANVAS 2D)
// ============================================================================

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
  const wingSpan = e.wingSpan || 0.5;
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
    ctx.quadraticCurveTo(35 * wingSpan, -35 * wingSpan, 75 * wingSpan, -25 * wingSpan);
    ctx.quadraticCurveTo(55 * wingSpan, 5, 25 * wingSpan, 20);
    ctx.stroke();

    ctx.fillStyle = wingCol;
    ctx.beginPath();
    ctx.moveTo(15, 5);
    ctx.quadraticCurveTo(45 * wingSpan, -15 * wingSpan, 72 * wingSpan, -22 * wingSpan);
    ctx.lineTo(84 * wingSpan, -10 * wingSpan);
    ctx.lineTo(60 * wingSpan, 25 * wingSpan);
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

/**
 * Renderiza o feixe e o glifo do ponto de destino do teleporte.
 */
function drawBlinkAimIndicator(ctx, e, frameCount) {
  if (e.actionState !== 'BLINK_AIM' || !e.blinkTarget) return;

  const targetDx = e.blinkTarget.x - e.x;
  const targetDy = e.blinkTarget.y - e.y;

  ctx.save();

  // 1. Linha espectral pontilhada ligando o chefe até o ponto de aterrissagem
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -frameCount * 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(targetDx, targetDy);
  ctx.stroke();

  // 2. Portal rúnico de aterrissagem no solo
  const pulse = Math.sin(frameCount * 0.22) * 5;
  const ringR = 38 + pulse;

  ctx.translate(targetDx, targetDy);

  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR, ringR * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 206, 201, 0.15)';
  ctx.fill();

  // Glifo central de corte
  ctx.strokeStyle = '#81ecec';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(14, 0);
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 10);
  ctx.stroke();

  ctx.restore();
}

function drawSoulTetherBeam(ctx, e, bob) {
  if (!e.tetherActive) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.75)';
  ctx.lineWidth = 3.2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, -12 + bob);
  ctx.lineTo(0, 40);
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// 7. RENDERIZADOR MASTER
// ============================================================================

export function drawSupremeReaper(ctx, e, frameCount) {
  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged || e.isPhase3;
  const isWindup = e.actionState === 'WINDUP';
  const isHarvest = e.actionState === 'VORTEX_HARVEST';
  const isAimingBlink = e.actionState === 'BLINK_AIM';

  const bob = isVuln ? 22 : (e.floatBob || 0);

  ctx.save();

  // Tremor e semitransparência durante preparo do teleporte
  if (isAimingBlink) {
    ctx.globalAlpha = 0.65 + Math.sin(frameCount * 0.3) * 0.25;
  }

  if (isWindup || isHarvest) {
    ctx.translate((Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 3.5);
  }

  // 1. Indicador e Portal de Teleporte (desenhado sob tudo)
  drawBlinkAimIndicator(ctx, e, frameCount);

  // 2. Sombra e Rastro
  drawReaperShadow(ctx, e, bob, isVuln);
  drawGhostTrail(ctx, e);

  // 3. Glifo de Vulnerabilidade
  if (isVuln) drawRecoveryGliph(ctx, e, frameCount);

  // 4. Asas e Manto
  drawSpectralWings(ctx, e, bob, isVuln, isEnraged);
  drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged);

  // 5. Núcleo e Cabeça
  drawRibcageAndCore(ctx, bob, frameCount, isVuln, isEnraged);
  drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged);

  // 6. Foice e Lanternas
  drawOrnateScythe(ctx, e, bob, isVuln, isEnraged);
  drawGothicLanterns(ctx, e, bob, frameCount, isEnraged);

  // 7. Vínculo de Almas
  drawSoulTetherBeam(ctx, e, bob);

  ctx.restore();
}