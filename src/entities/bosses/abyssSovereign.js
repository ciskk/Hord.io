/**
 * src/entities/bosses/abyssSovereign.js
 * Soberano do Abismo (Boss 4 / Chefe Final)
 * Versão Final: FSM Master, Âncoras como Sub-Alvos Globais, Arsenal Telegrafado e Paridade Melee.
 */
import { playSfx, triggerHaptic } from '../../core/audio.js';
import { 
  bullets, 
  enemyBullets, 
  bossTelegraphs, 
  bossShockwaves, 
  enemies 
} from '../../main.js';

export const SOVEREIGN_STATES = Object.freeze({
  SPAWN_INTRO: 'SPAWN_INTRO',
  HOVER_CHASE: 'HOVER_CHASE',
  WINDUP: 'WINDUP',
  CASTING: 'CASTING',
  WARP_AIM: 'WARP_AIM',
  RECOVERY_STAGGER: 'RECOVERY_STAGGER',
  PHASE_TRANSITION: 'PHASE_TRANSITION'
});

export function scheduleDelayedAction(boss, delayFrames, callback) {
  if (!boss.delayedActions) boss.delayedActions = [];
  boss.delayedActions.push({
    timer: delayFrames,
    action: callback
  });
}

function updateDelayedActions(boss, dt) {
  if (!boss.delayedActions || boss.delayedActions.length === 0) return;
  for (let i = boss.delayedActions.length - 1; i >= 0; i--) {
    const item = boss.delayedActions[i];
    item.timer -= dt;
    if (item.timer <= 0) {
      boss.delayedActions.splice(i, 1);
      if (typeof item.action === 'function') {
        item.action();
      }
    }
  }
}

/**
 * Remove qualquer âncora remanescente do array global de inimigos de forma segura.
 * @param {Object} boss
 */
export function cleanupRiftAnchors(boss) {
  if (!boss.anchors || boss.anchors.length === 0) return;
  for (let i = 0; i < boss.anchors.length; i++) {
    const a = boss.anchors[i];
    a.active = false;
    const idx = enemies.indexOf(a);
    if (idx !== -1) {
      enemies.splice(idx, 1);
    }
  }
  boss.anchors = [];
  boss.activeAnchorsCount = 0;
}

/**
 * Instancia âncoras abissais e as registra no array global `enemies` com a flag `isBossSubTarget: true`,
 * habilitando o sistema de mira automática e priorização de projéteis/armas.
 * @param {Object} boss
 * @param {number} count Quantidade de âncoras.
 * @param {number} anchorHp HP de cada âncora.
 */
function spawnRiftAnchors(boss, count, anchorHp) {
  cleanupRiftAnchors(boss);

  boss.anchors = [];
  const distance = 270;

  for (let i = 0; i < count; i++) {
    const baseAngle = (i * Math.PI * 2) / count + Math.PI / 4;
    const ax = boss.arenaCenterX + Math.cos(baseAngle) * distance;
    const ay = boss.arenaCenterY + Math.sin(baseAngle) * distance;

    const anchor = {
      x: ax,
      y: ay,
      baseX: ax,
      baseY: ay,
      radius: 24,
      speed: 0,
      hp: anchorHp,
      maxHp: anchorHp,
      active: true,
      floatTimer: i * 1.5,
      hitFlash: 0,
      orbitalHitCd: 0,
      axeHitCd: 0,
      isBossSubTarget: true,
      parentBoss: boss,
      color: '#00cec9',
      damage: 0,
      xp: 0,
      behavior: 'anchor',
      combatState: 'CHASE'
    };

    boss.anchors.push(anchor);
    enemies.push(anchor);
  }
  boss.activeAnchorsCount = count;
}

export function initAbyssSovereign(boss) {
  boss.phase = 1;
  boss.hasTriggeredPhase2 = false;
  boss.hasTriggeredPhase3 = false;
  boss.actionState = SOVEREIGN_STATES.SPAWN_INTRO;
  boss.stateTimer = 0;
  boss.introTimer = 85;
  boss.transitionTimer = 0;

  boss.lastHp = boss.hp;
  boss.damageMitigation = 0.65;

  boss.staggerGauge = 0;
  boss.maxStaggerGauge = 3800;
  boss.staggerTimer = 0;
  boss.isStaggered = false;
  boss.isVulnerable = false;

  boss.anchors = [];
  boss.activeAnchorsCount = 0;

  boss.delayedActions = [];

  boss.arenaCenterX = boss.x;
  boss.arenaCenterY = boss.y;
  boss.arenaRadius = 620;
  boss.targetArenaRadius = 620;
  boss.minArenaRadius = 380;
  boss.asphyxiaTimer = 0;
  boss.horizonPulse = 0;

  boss.singularityPulseTimer = 0;
  boss.singularityOrbs = [];
  boss.orbSpawnTimer = 0;

  boss.attackCooldown = 75;
  boss.windupTimer = 0;
  boss.windupMax = 0;
  boss.castDuration = 0;
  boss.currentSkill = null;
  boss.skillCycleIndex = 0;

  boss.beamAngle = 0;
  boss.beamRotSpeed = 0.014;
  boss.beamDir = 1;
  boss.beamHasReversed = false;
  boss.salvoSpiralAngle = 0;

  boss.implosionX = 0;
  boss.implosionY = 0;
  boss.implosionRadius = 0;
  boss.implosionMaxRadius = 220;

  boss.facing = 1;
  boss.hoverAngle = 0;
  boss.tentacleCycle = 0;
  boss.accretionAngle = 0;
  boss.corePulse = 0;
  boss.warpStartX = 0;
  boss.warpStartY = 0;
  boss.warpTargetX = 0;
  boss.warpTargetY = 0;

  scheduleDelayedAction(boss, 10, () => {
    playSfx('singularity');
    triggerHaptic('heavy');
  });
}

function triggerPhaseTransition(boss, nextPhase, context) {
  const { triggerShake, addDamageText } = context;

  boss.phase = nextPhase;
  boss.actionState = SOVEREIGN_STATES.PHASE_TRANSITION;
  boss.transitionTimer = 90;
  boss.staggerGauge = 0;
  boss.isVulnerable = false;
  boss.isStaggered = false;

  boss.windupTimer = 0;
  boss.castDuration = 0;
  boss.currentSkill = null;

  const clearRadiusSq = 450 * 450;
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const dx = b.x - boss.x;
    const dy = b.y - boss.y;
    if (dx * dx + dy * dy < clearRadiusSq) {
      bullets.splice(i, 1);
    }
  }

  const waveColor = nextPhase === 2 ? '232, 67, 147' : '0, 206, 201';
  bossShockwaves.push({
    x: boss.x,
    y: boss.y,
    radius: boss.radius,
    maxRadius: 420,
    speed: 7.5,
    damage: Math.round(boss.damage * 0.25),
    hitPlayer: false,
    colorRgb: waveColor
  });

  triggerShake(20);
  triggerHaptic('heavy');

  if (nextPhase === 2) {
    playSfx('boss');
    boss.isEnraged = true;
    boss.speed *= 1.25;
    boss.targetArenaRadius = 520;
    addDamageText(boss.x, boss.y - boss.radius - 20, "FRATURA DO HORIZONTE!", true, '#e84393');
    spawnRiftAnchors(boss, 3, 6500);
  } else if (nextPhase === 3) {
    playSfx('singularity');
    boss.speed *= 1.15;
    boss.targetArenaRadius = 380;
    addDamageText(boss.x, boss.y - boss.radius - 20, "SINGULARIDADE PRIMORDIAL!", true, '#00cec9');
    cleanupRiftAnchors(boss);
  }
}

function triggerStabilityBreak(boss, context) {
  const { triggerShake, addDamageText, createHitParticles } = context;

  boss.actionState = SOVEREIGN_STATES.RECOVERY_STAGGER;
  boss.staggerTimer = 180;
  boss.isStaggered = true;
  boss.isVulnerable = true;
  boss.staggerGauge = 0;

  boss.windupTimer = 0;
  boss.castDuration = 0;
  boss.currentSkill = null;

  playSfx('shatter');
  triggerShake(16);
  triggerHaptic('heavy');
  createHitParticles(boss.x, boss.y, '#ffffff', 28);
  createHitParticles(boss.x, boss.y, '#a29bfe', 20);
  addDamageText(boss.x, boss.y - boss.radius - 22, "COLAPSO DE ESTABILIDADE!", true, '#f1c40f');
}

function spawnConstellationRifts(boss, player) {
  const nodeCount = boss.phase === 3 ? 6 : (boss.phase === 2 ? 5 : 4);
  const spreadDist = 130;
  let prevX = boss.x;
  let prevY = boss.y;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (i * Math.PI * 2) / nodeCount + (Math.random() - 0.5) * 0.4;
    const dist = spreadDist + (Math.random() - 0.5) * 40;
    const nodeX = player.x + Math.cos(angle) * dist;
    const nodeY = player.y + Math.sin(angle) * dist;

    bossTelegraphs.push({
      type: 'FISSURE_NODE',
      x: nodeX,
      y: nodeY,
      originX: prevX,
      originY: prevY,
      radius: 42,
      timer: 55 + i * 8,
      maxTimer: 55 + i * 8,
      damage: Math.round(boss.damage * 0.32),
      nodeIndex: i
    });

    prevX = nodeX;
    prevY = nodeY;
  }
}

function prepareNextAttack(boss, context) {
  const { player } = context;

  const skillsPhase1 = ['VOID_CRUCIFIX', 'RELATIVISTIC_SALVO', 'ABYSSAL_RIFTS'];
  const skillsPhase2 = ['VOID_CRUCIFIX', 'RELATIVISTIC_SALVO', 'ABYSSAL_RIFTS', 'VOID_WARP', 'SINGULARITY_IMPLOSION'];
  const skillsPhase3 = ['VOID_CRUCIFIX', 'RELATIVISTIC_SALVO', 'ABYSSAL_RIFTS', 'VOID_WARP', 'SINGULARITY_IMPLOSION'];

  const available = boss.phase === 1 ? skillsPhase1 : (boss.phase === 2 ? skillsPhase2 : skillsPhase3);
  boss.currentSkill = available[boss.skillCycleIndex % available.length];
  boss.skillCycleIndex++;

  boss.actionState = SOVEREIGN_STATES.WINDUP;
  boss.stateTimer = 0;
  boss.staggerGauge = 0;

  switch (boss.currentSkill) {
    case 'VOID_CRUCIFIX': {
      boss.windupTimer = boss.phase === 3 ? 42 : (boss.phase === 2 ? 50 : 64);
      boss.windupMax = boss.windupTimer;
      boss.beamAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.beamDir = Math.random() < 0.5 ? 1 : -1;
      boss.beamRotSpeed = boss.phase === 3 ? 0.016 : 0.011;
      boss.beamHasReversed = false;
      playSfx('charge');
      break;
    }

    case 'RELATIVISTIC_SALVO': {
      boss.windupTimer = boss.phase === 3 ? 34 : 46;
      boss.windupMax = boss.windupTimer;
      boss.salvoSpiralAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      playSfx('shoot');
      break;
    }

    case 'ABYSSAL_RIFTS': {
      boss.windupTimer = 44;
      boss.windupMax = 44;
      spawnConstellationRifts(boss, player);
      playSfx('boss');
      break;
    }

    case 'VOID_WARP': {
      boss.actionState = SOVEREIGN_STATES.WARP_AIM;
      boss.windupTimer = 42;
      boss.windupMax = 42;
      boss.warpStartX = boss.x;
      boss.warpStartY = boss.y;

      const leadFactor = player.isMoving ? 26 : 0;
      boss.warpTargetX = player.x + (player.facing || 1) * leadFactor + (Math.random() - 0.5) * 40;
      boss.warpTargetY = player.y + (Math.random() - 0.5) * 40;
      playSfx('warp');
      break;
    }

    case 'SINGULARITY_IMPLOSION': {
      boss.windupTimer = 58;
      boss.windupMax = 58;
      boss.implosionX = player.x;
      boss.implosionY = player.y;
      boss.implosionRadius = boss.implosionMaxRadius;
      playSfx('singularity');
      break;
    }

    default:
      boss.windupTimer = 50;
      boss.windupMax = 50;
      break;
  }
}

function startSkillCast(boss) {
  boss.actionState = SOVEREIGN_STATES.CASTING;
  boss.stateTimer = 0;

  switch (boss.currentSkill) {
    case 'VOID_CRUCIFIX':
      boss.castDuration = boss.phase === 3 ? 170 : (boss.phase === 2 ? 145 : 125);
      playSfx('boss');
      break;
    case 'RELATIVISTIC_SALVO':
      boss.castDuration = boss.phase === 3 ? 120 : 95;
      break;
    case 'ABYSSAL_RIFTS':
      boss.castDuration = 35;
      break;
    case 'SINGULARITY_IMPLOSION':
      boss.castDuration = 20;
      break;
    default:
      boss.castDuration = 60;
      break;
  }
}

function updateEventHorizon(boss, dt, context) {
  const { player, addDamageText, triggerShake, createHitParticles } = context;

  if (boss.arenaRadius > boss.targetArenaRadius) {
    boss.arenaRadius = Math.max(boss.targetArenaRadius, boss.arenaRadius - 0.45 * dt);
  }

  boss.horizonPulse = Math.sin(context.frameCount * 0.08);

  const pdx = player.x - boss.arenaCenterX;
  const pdy = player.y - boss.arenaCenterY;
  const pDist = Math.hypot(pdx, pdy) || 1;

  // Barreira Física Invisível Impenetrável (Ativa em todas as fases)
  const maxRadius = boss.arenaRadius - (player.radius || 14) - 2;

  if (pDist > maxRadius) {
    // Clamping físico estrito - impede qualquer fuga para fora do Altar
    player.x = boss.arenaCenterX + (pdx / pDist) * maxRadius;
    player.y = boss.arenaCenterY + (pdy / pDist) * maxRadius;

    const nx = pdx / pDist;
    const ny = pdy / pDist;

    // Cancela componentes de velocidade voltados para fora da arena (knockback, dashes)
    const pushDot = (player.pushVx || 0) * nx + (player.pushVy || 0) * ny;
    if (pushDot > 0) {
      player.pushVx -= pushDot * nx;
      player.pushVy -= pushDot * ny;
    }
    const dashDot = (player.dashVx || 0) * nx + (player.dashVy || 0) * ny;
    if (dashDot > 0) {
      player.dashVx -= dashDot * nx;
      player.dashVy -= dashDot * ny;
    }
    const ignisDot = (player.ignisDashVx || 0) * nx + (player.ignisDashVy || 0) * ny;
    if (ignisDot > 0) {
      player.ignisDashVx -= ignisDot * nx;
      player.ignisDashVy -= ignisDot * ny;
    }

    // Marcação de contato com a barreira invisível
    boss.barrierContact = 1.0;
    boss.barrierContactAngle = Math.atan2(pdy, pdx);

    if (Math.floor(context.frameCount) % 4 === 0) {
      createHitParticles(player.x + nx * 8, player.y + ny * 8, boss.phase === 3 ? '#00cec9' : '#e84393', 3);
      createHitParticles(player.x + nx * 8, player.y + ny * 8, '#ffffff', 2);
    }

    if (!boss.lastBarrierSound || context.frameCount - boss.lastBarrierSound > 22) {
      boss.lastBarrierSound = context.frameCount;
      playSfx('forcefield');
      triggerHaptic('light');
    }
  } else {
    boss.barrierContact = Math.max(0, (boss.barrierContact || 0) - 0.04 * dt);
  }

  // Dano por asfixia caso o jogador de alguma forma exceda o horizonte de eventos
  if (pDist > boss.arenaRadius) {
    boss.asphyxiaTimer += dt;
    if (boss.asphyxiaTimer >= 36 && player.iFrames <= 0) {
      boss.asphyxiaTimer = 0;
      const asphDmg = Math.max(5, Math.round(boss.damage * 0.08));
      player.hp -= asphDmg;
      player.iFrames = 18;
      triggerShake(4);
      playSfx('acid');
      addDamageText(player.x, player.y, `-${asphDmg}`, false, '#9b59b6');
      createHitParticles(player.x, player.y, '#8e44ad', 4);
    }
  } else {
    boss.asphyxiaTimer = Math.max(0, boss.asphyxiaTimer - dt);
  }
}

function updateSingularityPhysics(boss, dt, context) {
  if (boss.phase !== 3) return;

  const { player, triggerShake, enemyBullets } = context;

  const cdx = boss.arenaCenterX - boss.x;
  const cdy = boss.arenaCenterY - boss.y;
  boss.x += cdx * 0.08 * dt;
  boss.y += cdy * 0.08 * dt;

  const vdx = boss.x - player.x;
  const vdy = boss.y - player.y;
  const vDist = Math.hypot(vdx, vdy) || 1;

  if (vDist > boss.radius + 15 && vDist < boss.arenaRadius) {
    const pullForce = 0.55 * dt;
    player.x += (vdx / vDist) * pullForce;
    player.y += (vdy / vDist) * pullForce;
  }

  boss.singularityPulseTimer += dt;
  if (boss.singularityPulseTimer >= 130) {
    boss.singularityPulseTimer = 0;
    triggerShake(8);
    playSfx('singularity');

    bossShockwaves.push({
      x: boss.x,
      y: boss.y,
      radius: boss.radius,
      maxRadius: boss.arenaRadius * 0.85,
      speed: 4.8,
      damage: Math.round(boss.damage * 0.20),
      hitPlayer: false,
      colorRgb: '0, 206, 201'
    });
  }

  boss.orbSpawnTimer += dt;
  if (boss.orbSpawnTimer >= 22) {
    boss.orbSpawnTimer = 0;
    const startAng = Math.random() * Math.PI * 2;
    boss.singularityOrbs.push({
      angle: startAng,
      orbitA: 110 + Math.random() * 50,
      orbitB: 50 + Math.random() * 25,
      rotSpeed: 0.045 + Math.random() * 0.02,
      tilt: Math.random() * Math.PI,
      life: 65,
      damage: Math.round(boss.damage * 0.22)
    });
  }

  for (let i = boss.singularityOrbs.length - 1; i >= 0; i--) {
    const orb = boss.singularityOrbs[i];
    orb.angle += orb.rotSpeed * dt;
    orb.life -= dt;

    const rawX = Math.cos(orb.angle) * orb.orbitA;
    const rawY = Math.sin(orb.angle) * orb.orbitB;
    const cosT = Math.cos(orb.tilt);
    const sinT = Math.sin(orb.tilt);
    orb.curX = boss.x + (rawX * cosT - rawY * sinT);
    orb.curY = boss.y + (rawX * sinT + rawY * cosT);

    if (orb.life <= 0) {
      const ejectAng = Math.atan2(orb.curY - boss.y, orb.curX - boss.x);
      const speed = 5.2;

      enemyBullets.push({
        x: orb.curX,
        y: orb.curY,
        vx: Math.cos(ejectAng) * speed,
        vy: Math.sin(ejectAng) * speed,
        radius: 5.5,
        damage: orb.damage,
        life: 110
      });

      playSfx('shoot');
      boss.singularityOrbs.splice(i, 1);
    }
  }
}

/**
 * Atualiza a movimentação flutuante das âncoras e processa sua destruição,
 * aplicando contragolpe de 5% ao chefe e gatilho de colapso caso todas sejam abatidas.
 * As colisões de ataque foram delegadas à malha espacial e ao pipeline global de armas.
 * @param {Object} boss
 * @param {number} dt
 * @param {Object} context
 */
function updateAnchors(boss, dt, context) {
  if (!boss.anchors || boss.anchors.length === 0 || boss.activeAnchorsCount <= 0) return;

  const {
    bossShockwaves,
    triggerShake,
    createHitParticles,
    addDamageText
  } = context;

  for (let aIdx = 0; aIdx < boss.anchors.length; aIdx++) {
    const a = boss.anchors[aIdx];
    if (!a.active) continue;

    a.floatTimer += 0.04 * dt;
    a.x = a.baseX + Math.cos(a.floatTimer * 0.8) * 8;
    a.y = a.baseY + Math.sin(a.floatTimer) * 12;

    if (a.hitFlash > 0) a.hitFlash -= dt;
    if (a.orbitalHitCd > 0) a.orbitalHitCd -= dt;
    if (a.axeHitCd > 0) a.axeHitCd -= dt;

    if (a.hp <= 0) {
      a.active = false;
      boss.activeAnchorsCount--;

      const idx = enemies.indexOf(a);
      if (idx !== -1) {
        enemies.splice(idx, 1);
      }

      bossShockwaves.push({
        x: a.x,
        y: a.y,
        radius: a.radius,
        maxRadius: 130,
        speed: 6.0,
        damage: 0,
        hitPlayer: false,
        colorRgb: '0, 206, 201'
      });

      playSfx('shatter');
      triggerShake(14);
      triggerHaptic('heavy');
      createHitParticles(a.x, a.y, '#00cec9', 24);
      createHitParticles(a.x, a.y, '#a29bfe', 16);

      const backlashDmg = Math.round(boss.maxHp * 0.05);
      boss.hp -= backlashDmg;
      addDamageText(boss.x, boss.y, backlashDmg, true, '#00cec9');
      addDamageText(a.x, a.y - 14, "ÂNCORA DESTRUÍDA!", true, '#00cec9');

      if (boss.activeAnchorsCount <= 0) {
        triggerStabilityBreak(boss, context);
        addDamageText(boss.x, boss.y - boss.radius - 20, "COLAPSO DO VAZIO!", true, '#00cec9');
      }
    }
  }
}

export function updateAbyssSovereign(e, dt, context) {
  if (e.hp <= 0) {
    cleanupRiftAnchors(e);
    return;
  }

  const {
    player,
    frameCount,
    triggerShake,
    createHitParticles,
    addDamageText
  } = context;

  updateDelayedActions(e, dt);
  updateAnchors(e, dt, context);
  updateEventHorizon(e, dt, context);
  updateSingularityPhysics(e, dt, context);

  if (e.lastHp === undefined) e.lastHp = e.hp;
  const rawDmgReceived = Math.max(0, e.lastHp - e.hp);

  if (e.activeAnchorsCount > 0 && rawDmgReceived > 0) {
    const mitigated = rawDmgReceived * e.damageMitigation;
    e.hp += mitigated;

    if (Math.floor(frameCount) % 4 === 0) {
      createHitParticles(e.x, e.y, '#00cec9', 2);
      createHitParticles(e.x, e.y, '#a29bfe', 2);
    }
    e.attackCooldown -= dt * 0.20;
  }

  e.lastHp = e.hp;

  if (rawDmgReceived > 0 && (e.actionState === SOVEREIGN_STATES.WINDUP || e.actionState === SOVEREIGN_STATES.CASTING)) {
    e.staggerGauge += rawDmgReceived;
    if (e.staggerGauge >= e.maxStaggerGauge) {
      triggerStabilityBreak(e, context);
      return;
    }
  }

  const hpRatio = Math.max(0, e.hp / e.maxHp);
  if (!e.hasTriggeredPhase2 && hpRatio <= 0.70 && e.actionState !== SOVEREIGN_STATES.PHASE_TRANSITION) {
    e.hasTriggeredPhase2 = true;
    triggerPhaseTransition(e, 2, context);
    return;
  }
  if (!e.hasTriggeredPhase3 && hpRatio <= 0.30 && e.actionState !== SOVEREIGN_STATES.PHASE_TRANSITION) {
    e.hasTriggeredPhase3 = true;
    triggerPhaseTransition(e, 3, context);
    return;
  }

  e.facing = (player.x - e.x) >= 0 ? 1 : -1;

  e.tentacleCycle += (e.phase === 3 ? 0.14 : (e.phase === 2 ? 0.11 : 0.08)) * dt;
  e.accretionAngle += (e.phase === 3 ? 0.035 : (e.phase === 2 ? 0.025 : 0.015)) * dt;
  e.corePulse = Math.sin(frameCount * (e.phase === 3 ? 0.22 : 0.12));

  let curSpeed = e.speed;
  if (e.slowTimer > 0) {
    e.slowTimer -= dt;
    curSpeed *= (1 - 0.18);
  }

  switch (e.actionState) {
    case SOVEREIGN_STATES.SPAWN_INTRO: {
      e.introTimer -= dt;
      e.hoverAngle += 0.04 * dt;
      e.y += Math.sin(e.hoverAngle) * 0.4 * dt;

      if (e.introTimer <= 0) {
        e.actionState = SOVEREIGN_STATES.HOVER_CHASE;
        e.stateTimer = 0;
        e.attackCooldown = 55;
        triggerShake(10);
        playSfx('singularity');
        addDamageText(e.x, e.y - e.radius - 12, "O VAZIO DESPERTOU!", true, '#a29bfe');
        spawnRiftAnchors(e, 2, 5000);
      }
      break;
    }

    case SOVEREIGN_STATES.PHASE_TRANSITION: {
      e.transitionTimer -= dt;
      e.hoverAngle += 0.12 * dt;

      if (Math.floor(frameCount) % 3 === 0) {
        const transColor = e.phase === 2 ? '#e84393' : '#00cec9';
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 2,
          e.y + (Math.random() - 0.5) * e.radius * 2,
          transColor,
          2
        );
      }

      if (e.transitionTimer <= 0) {
        if (e.phase === 3) {
          e.x = e.arenaCenterX;
          e.y = e.arenaCenterY;
        }
        e.actionState = SOVEREIGN_STATES.HOVER_CHASE;
        e.stateTimer = 0;
        e.attackCooldown = 40;
      }
      break;
    }

    case SOVEREIGN_STATES.HOVER_CHASE: {
      e.stateTimer += dt;

      if (e.phase !== 3) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        const targetDist = 230;
        const angle = Math.atan2(dy, dx);

        e.hoverAngle += 0.035 * dt;
        const perpX = -Math.sin(angle) * Math.cos(e.hoverAngle) * 1.35;
        const perpY = Math.cos(angle) * Math.cos(e.hoverAngle) * 1.35;

        if (dist > targetDist + 35) {
          e.x += (Math.cos(angle) * curSpeed + perpX) * dt;
          e.y += (Math.sin(angle) * curSpeed + perpY) * dt;
        } else if (dist < targetDist - 35) {
          e.x += (-Math.cos(angle) * curSpeed * 0.85 + perpX) * dt;
          e.y += (-Math.sin(angle) * curSpeed * 0.85 + perpY) * dt;
        } else {
          e.x += perpX * curSpeed * dt;
          e.y += perpY * curSpeed * dt;
        }
      }

      e.attackCooldown -= dt;
      if (e.attackCooldown <= 0) {
        prepareNextAttack(e, context);
      }
      break;
    }

    case SOVEREIGN_STATES.WINDUP: {
      e.stateTimer += dt;
      e.windupTimer -= dt;

      if (e.currentSkill === 'VOID_CRUCIFIX') {
        const aimRot = (e.phase === 3 ? 0.009 : 0.006) * e.beamDir;
        e.beamAngle += aimRot * dt;
      } else if (e.currentSkill === 'SINGULARITY_IMPLOSION') {
        const ratio = 1 - (e.windupTimer / e.windupMax);
        e.implosionRadius = e.implosionMaxRadius * (1 - ratio);

        const vdx = e.implosionX - player.x;
        const vdy = e.implosionY - player.y;
        const vDist = Math.hypot(vdx, vdy);
        if (vDist < e.implosionMaxRadius && vDist > 15) {
          const pullForce = (0.75 + ratio * 1.2) * dt;
          player.x += (vdx / vDist) * pullForce;
          player.y += (vdy / vDist) * pullForce;
        }
      }

      if (Math.floor(frameCount) % 4 === 0) {
        const gatherAng = Math.random() * Math.PI * 2;
        const gatherDist = e.radius + 30;
        createHitParticles(
          e.x + Math.cos(gatherAng) * gatherDist,
          e.y + Math.sin(gatherAng) * gatherDist,
          '#a29bfe',
          1
        );
      }

      if (e.windupTimer <= 0) {
        startSkillCast(e);
      }
      break;
    }

    case SOVEREIGN_STATES.CASTING: {
      e.stateTimer += dt;
      e.castDuration -= dt;

      if (e.currentSkill === 'VOID_CRUCIFIX') {
        const armCount = e.phase === 1 ? 4 : 6;
        const progress = 1 - (e.castDuration / (e.phase === 3 ? 170 : (e.phase === 2 ? 145 : 125)));

        if (!e.beamHasReversed && progress >= 0.5) {
          e.beamHasReversed = true;
          e.beamDir *= -1;
          playSfx('charge');
          triggerShake(10);
          triggerHaptic('medium');
          addDamageText(e.x, e.y - e.radius - 16, "INVERSÃO!", true, '#ff7675');
        }

        const rotSpeed = (e.phase === 3 ? 0.028 : (e.phase === 2 ? 0.022 : 0.016)) * e.beamDir;
        e.beamAngle += rotSpeed * dt;

        const beamLength = 650;
        for (let arm = 0; arm < armCount; arm++) {
          const bAng = e.beamAngle + (arm * (Math.PI * 2 / armCount));
          const bx = Math.cos(bAng);
          const by = Math.sin(bAng);
          const px = player.x - e.x;
          const py = player.y - e.y;
          const proj = px * bx + py * by;

          if (proj > 0 && proj < beamLength) {
            const perpX = px - proj * bx;
            const perpY = py - proj * by;
            if (perpX * perpX + perpY * perpY < 20 * 20 && player.iFrames <= 0) {
              const laserDmg = Math.round(e.damage * 0.35);
              player.hp -= laserDmg;
              player.iFrames = 22;
              triggerShake(10);
              playSfx('hit');
              triggerHaptic('heavy');
              addDamageText(player.x, player.y, `-${laserDmg}`, false, '#9b59b6');
              createHitParticles(player.x, player.y, '#9b59b6', 5);
            }
          }
        }
      } else if (e.currentSkill === 'RELATIVISTIC_SALVO') {
        const salvoInterval = e.phase === 3 ? 7 : (e.phase === 2 ? 9 : 12);
        if (Math.floor(e.stateTimer) % salvoInterval === 0) {
          e.salvoSpiralAngle += 0.24 * dt;
          const speed = 4.6;
          const bulletDmg = Math.round(e.damage * 0.22);

          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(e.salvoSpiralAngle) * speed,
            vy: Math.sin(e.salvoSpiralAngle) * speed,
            radius: 5.5,
            damage: bulletDmg,
            life: 130
          });

          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(-e.salvoSpiralAngle + Math.PI) * speed,
            vy: Math.sin(-e.salvoSpiralAngle + Math.PI) * speed,
            radius: 5.5,
            damage: bulletDmg,
            life: 130
          });

          playSfx('shoot');
        }
      } else if (e.currentSkill === 'SINGULARITY_IMPLOSION' && e.stateTimer < dt * 2) {
        triggerShake(16);
        triggerHaptic('heavy');
        playSfx('singularity');

        bossShockwaves.push({
          x: e.implosionX,
          y: e.implosionY,
          radius: 12,
          maxRadius: e.implosionMaxRadius + 30,
          speed: 7.5,
          damage: Math.round(e.damage * 0.45),
          hitPlayer: false,
          colorRgb: '142, 68, 173'
        });

        createHitParticles(e.implosionX, e.implosionY, '#8e44ad', 28);
        createHitParticles(e.implosionX, e.implosionY, '#e056fd', 18);
      }

      if (e.castDuration <= 0) {
        if (e.currentSkill === 'VOID_CRUCIFIX') {
          e.actionState = SOVEREIGN_STATES.RECOVERY_STAGGER;
          e.staggerTimer = e.phase === 3 ? 60 : 80;
          e.isStaggered = true;
          e.isVulnerable = true;
          e.staggerGauge = 0;
          addDamageText(e.x, e.y - e.radius - 14, "BRECHA SIDÉRICA!", true, '#f1c40f');
        } else {
          e.actionState = SOVEREIGN_STATES.HOVER_CHASE;
          e.stateTimer = 0;
          e.attackCooldown = e.phase === 3 ? 45 : (e.phase === 2 ? 60 : 70);
        }
      }
      break;
    }

    case SOVEREIGN_STATES.WARP_AIM: {
      e.windupTimer -= dt;
      if (e.windupTimer <= 0) {
        createHitParticles(e.x, e.y, '#8e44ad', 20);
        e.x = e.warpTargetX;
        e.y = e.warpTargetY;
        createHitParticles(e.x, e.y, '#e84393', 30);
        triggerShake(14);
        triggerHaptic('heavy');
        playSfx('warp');

        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 10,
          maxRadius: 175,
          speed: 6.5,
          damage: Math.round(e.damage * 0.35),
          hitPlayer: false,
          colorRgb: '232, 67, 147'
        });

        const shardCount = e.phase === 3 ? 12 : 8;
        for (let s = 0; s < shardCount; s++) {
          const sAng = (s * Math.PI * 2) / shardCount;
          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(sAng) * 5.2,
            vy: Math.sin(sAng) * 5.2,
            radius: 5.0,
            damage: Math.round(e.damage * 0.20),
            life: 95
          });
        }

        e.actionState = SOVEREIGN_STATES.HOVER_CHASE;
        e.stateTimer = 0;
        e.attackCooldown = e.phase === 2 ? 55 : 45;
      }
      break;
    }

    case SOVEREIGN_STATES.RECOVERY_STAGGER: {
      e.isVulnerable = true;
      e.staggerTimer -= dt;

      if (Math.floor(frameCount) % 5 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 1.6,
          e.y + (Math.random() - 0.5) * e.radius * 1.6,
          '#f1c40f',
          2
        );
      }

      if (e.staggerTimer <= 0) {
        e.isVulnerable = false;
        e.isStaggered = false;
        e.actionState = SOVEREIGN_STATES.HOVER_CHASE;
        e.stateTimer = 0;
        e.attackCooldown = 50;
        addDamageText(e.x, e.y - e.radius - 12, "ESTABILIZADO!", true, '#8e44ad');
      }
      break;
    }

    default: {
      e.actionState = SOVEREIGN_STATES.HOVER_CHASE;
      break;
    }
  }
}

export function drawAbyssSovereign(ctx, e, frameCount) {
  const R = e.radius;
  const isStaggered = e.actionState === SOVEREIGN_STATES.RECOVERY_STAGGER;
  const isTransition = e.actionState === SOVEREIGN_STATES.PHASE_TRANSITION;
  const isWindup = e.actionState === SOVEREIGN_STATES.WINDUP;
  const isCasting = e.actionState === SOVEREIGN_STATES.CASTING;
  const isHit = e.hitFlash > 0;

  let primaryCol = '#8e44ad';
  let secondaryCol = '#341f97';
  let coreCol = '#e84393';
  let edgeCol = '#a29bfe';

  if (e.phase === 2) {
    primaryCol = '#e84393';
    secondaryCol = '#6c5ce7';
    coreCol = '#ff7675';
    edgeCol = '#fd79a8';
  } else if (e.phase === 3) {
    primaryCol = '#00cec9';
    secondaryCol = '#0984e3';
    coreCol = '#ffffff';
    edgeCol = '#81ecec';
  }

  // 1. Selo Abissal no Solo
  ctx.save();
  const groundPulse = Math.sin(frameCount * 0.08) * 4;
  const groundRot = frameCount * 0.015;

  ctx.strokeStyle = isStaggered ? 'rgba(127, 140, 141, 0.4)' : (e.phase === 3 ? 'rgba(0, 206, 201, 0.4)' : 'rgba(142, 68, 173, 0.4)');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.95, R * 1.6 + groundPulse, R * 0.55 + groundPulse * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isStaggered ? 'rgba(189, 195, 199, 0.25)' : (e.phase === 3 ? 'rgba(129, 236, 236, 0.35)' : 'rgba(232, 67, 147, 0.35)');
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.ellipse(0, R * 0.95, R * 1.35 + groundPulse * 0.5, R * 0.45 + groundPulse * 0.2, -groundRot * 1.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const runeCount = 8;
  for (let rn = 0; rn < runeCount; rn++) {
    const ra = groundRot + (rn * Math.PI * 2) / runeCount;
    const rx = Math.cos(ra) * (R * 1.6 + groundPulse);
    const ry = R * 0.95 + Math.sin(ra) * (R * 0.55 + groundPulse * 0.35);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + Math.cos(ra) * 6, ry + Math.sin(ra) * 3);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Barreira do Horizonte de Eventos
  if (e.phase >= 2) {
    const relCenterX = (e.arenaCenterX - e.x) * e.facing;
    const relCenterY = e.arenaCenterY - e.y;

    ctx.save();
    ctx.translate(relCenterX, relCenterY);
    ctx.scale(e.facing, 1);

    const pulseR = e.arenaRadius + e.horizonPulse * 3;

    ctx.strokeStyle = e.phase === 3 ? 'rgba(0, 206, 201, 0.65)' : 'rgba(232, 67, 147, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, pulseR - 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const horizonRunes = 12;
    ctx.fillStyle = e.phase === 3 ? '#00d2d3' : '#e84393';
    for (let r = 0; r < horizonRunes; r++) {
      const rAng = (r * Math.PI * 2 / horizonRunes) + frameCount * 0.005;
      const rx = Math.cos(rAng) * pulseR;
      const ry = Math.sin(rAng) * pulseR;
      ctx.fillRect(rx - 3, ry - 3, 6, 6);
    }
    ctx.restore();
  }

  // 3. Orbes Elípticos da Singularidade
  if (e.phase === 3 && e.singularityOrbs && e.singularityOrbs.length > 0) {
    ctx.save();
    for (let i = 0; i < e.singularityOrbs.length; i++) {
      const orb = e.singularityOrbs[i];
      if (orb.curX === undefined) continue;

      const relX = (orb.curX - e.x) * e.facing;
      const relY = orb.curY - e.y;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(relX, relY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(relX, relY, 7.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Telegrafia do Crucifixo
  if (isWindup && e.currentSkill === 'VOID_CRUCIFIX') {
    const armCount = e.phase === 1 ? 4 : 6;
    ctx.save();
    ctx.strokeStyle = 'rgba(232, 67, 147, 0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);

    for (let arm = 0; arm < armCount; arm++) {
      const rayAng = (e.beamAngle + (arm * (Math.PI * 2 / armCount))) * e.facing;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(rayAng) * 650, Math.sin(rayAng) * 650);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 5. Feixes do Crucifixo do Vácuo
  if (isCasting && e.currentSkill === 'VOID_CRUCIFIX') {
    const armCount = e.phase === 1 ? 4 : 6;
    ctx.save();

    for (let arm = 0; arm < armCount; arm++) {
      const rayAng = (e.beamAngle + (arm * (Math.PI * 2 / armCount))) * e.facing;
      const rx = Math.cos(rayAng) * 650;
      const ry = Math.sin(rayAng) * 650;

      ctx.strokeStyle = e.phase === 3 ? 'rgba(0, 206, 201, 0.45)' : 'rgba(232, 67, 147, 0.45)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rx, ry);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 6. Colapso de Matéria Escura
  if (isWindup && e.currentSkill === 'SINGULARITY_IMPLOSION') {
    const relX = (e.implosionX - e.x) * e.facing;
    const relY = e.implosionY - e.y;

    ctx.save();
    ctx.strokeStyle = 'rgba(142, 68, 173, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(relX, relY, Math.max(10, e.implosionRadius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(142, 68, 173, 0.15)';
    ctx.beginPath();
    ctx.arc(relX, relY, Math.max(10, e.implosionRadius), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 7. Passo Interdimensional
  if (e.actionState === SOVEREIGN_STATES.WARP_AIM) {
    const relX = (e.warpTargetX - e.x) * e.facing;
    const relY = e.warpTargetY - e.y;
    const ratio = 1 - (e.windupTimer / e.windupMax);

    ctx.save();
    ctx.strokeStyle = '#e84393';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(relX, relY, 55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(relX, relY, 55 * ratio, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 8. Âncoras de Vácuo (Orbes de Singularidade Cósmica)
  if (e.anchors && e.anchors.length > 0) {
    for (let i = 0; i < e.anchors.length; i++) {
      const a = e.anchors[i];
      if (!a.active) continue;

      const relX = (a.x - e.x) * e.facing;
      const relY = a.y - e.y;
      const tetherDist = Math.hypot(relX, relY) || 1;
      const tetherAng = Math.atan2(relY, relX);

      // --- A. LIGAÇÃO ENERGÉTICA CÓSMICA (TETHER) ---
      ctx.save();

      // Feixe volumétrico externo de dispersão
      const pulseBeam = 0.25 + Math.sin(frameCount * 0.1 + i) * 0.1;
      ctx.strokeStyle = `rgba(0, 206, 201, ${pulseBeam})`;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(relX, relY);
      ctx.stroke();

      // Feixe intermediário
      ctx.strokeStyle = 'rgba(162, 155, 254, 0.65)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(relX, relY);
      ctx.stroke();

      // Filamento central superaquecido
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(relX, relY);
      ctx.stroke();

      // Espiral de energia helicoidal ao redor do feixe
      const waveSegs = 18;
      ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const perpX = -Math.sin(tetherAng);
      const perpY = Math.cos(tetherAng);
      for (let s = 0; s <= waveSegs; s++) {
        const t = s / waveSegs;
        const bx = relX * t;
        const by = relY * t;
        const wave = Math.sin(t * Math.PI * 4 - frameCount * 0.14 + i * 2) * 9;
        const wx = bx + perpX * wave;
        const wy = by + perpY * wave;
        if (s === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Sifões de matéria cósmica fluindo em direção ao Soberano
      for (let p = 0; p < 3; p++) {
        const flowT = ((frameCount * 0.04 + i * 0.33 + p * 0.33) % 1);
        const flowX = relX * (1 - flowT);
        const flowY = relY * (1 - flowT);
        const flowR = 2.5 + Math.sin(frameCount * 0.2 + p) * 1;
        ctx.fillStyle = p === 0 ? '#ffffff' : (p === 1 ? '#00d2d3' : '#e84393');
        ctx.beginPath();
        ctx.arc(flowX, flowY, flowR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- B. CORPO DA ORBE DE SINGULARIDADE ---
      ctx.save();
      ctx.translate(relX, relY);
      ctx.scale(e.facing, 1);

      const isAnchorHit = a.hitFlash > 0;
      const anchorR = a.radius;
      const hpRatio = Math.max(0, a.hp / a.maxHp);

      // 1. Halo Radial de Distorção Gravitacional
      const auraPulse = Math.sin(frameCount * 0.12 + i * 1.5) * 5;
      const glowGrad = ctx.createRadialGradient(0, 0, anchorR * 0.2, 0, 0, anchorR * 2.0 + auraPulse);
      glowGrad.addColorStop(0, isAnchorHit ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 206, 201, 0.5)');
      glowGrad.addColorStop(0.5, 'rgba(142, 68, 173, 0.28)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, anchorR * 2.0 + auraPulse, 0, Math.PI * 2);
      ctx.fill();

      // 2. Anel Giroscópico Primário com Nodos Orbitais
      const rot1 = frameCount * 0.045 + i;
      ctx.save();
      ctx.rotate(rot1);
      ctx.strokeStyle = isAnchorHit ? '#ffffff' : 'rgba(0, 206, 201, 0.8)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, anchorR * 1.55, anchorR * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();

      for (let k = 0; k < 3; k++) {
        const kAng = (k * Math.PI * 2 / 3) + frameCount * 0.06;
        const kx = Math.cos(kAng) * (anchorR * 1.55);
        const ky = Math.sin(kAng) * (anchorR * 0.65);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(kx, ky, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Anel Giroscópico Secundário Contra-Rotativo
      const rot2 = -frameCount * 0.055 + i * 1.3;
      ctx.save();
      ctx.rotate(rot2);
      ctx.strokeStyle = isAnchorHit ? '#ffffff' : 'rgba(232, 67, 147, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(0, 0, anchorR * 1.3, anchorR * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 4. Carapaça de Fragmentos Criptográficos
      const shardCount = 4;
      const shardBreath = Math.sin(frameCount * 0.14 + i) * 3;
      const shardDist = anchorR * 0.88 + shardBreath;
      const shardRot = frameCount * 0.025 + i * 0.8;

      for (let s = 0; s < shardCount; s++) {
        const sAng = shardRot + (s * Math.PI * 2 / shardCount);
        const sx = Math.cos(sAng) * shardDist;
        const sy = Math.sin(sAng) * shardDist;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sAng + Math.PI / 2);

        ctx.fillStyle = isAnchorHit ? '#ffffff' : '#08010f';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(5.5, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-5.5, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isAnchorHit ? '#ffffff' : (s % 2 === 0 ? '#00cec9' : '#a29bfe');
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // 5. Núcleo Cósmico de Singularidade
      const coreR = anchorR * 0.68;
      ctx.fillStyle = isAnchorHit ? '#ffffff' : '#040008';
      ctx.beginPath();
      ctx.arc(0, 0, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isAnchorHit ? '#ffffff' : '#00cec9';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const innerPulse = Math.sin(frameCount * 0.2 + i * 2) * 2.2;
      const nebulaGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coreR * 0.85);
      nebulaGrad.addColorStop(0, '#ffffff');
      nebulaGrad.addColorStop(0.3, '#00cec9');
      nebulaGrad.addColorStop(0.7, '#8e44ad');
      nebulaGrad.addColorStop(1, '#05010a');
      ctx.fillStyle = nebulaGrad;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, coreR * 0.72 + innerPulse), 0, Math.PI * 2);
      ctx.fill();

      // Pupila de vácuo
      ctx.fillStyle = '#020005';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.8, coreR * 0.5 + innerPulse * 0.5, frameCount * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Arcos de instabilidade quando a vida está baixa
      if (hpRatio < 0.45 || isAnchorHit) {
        const sparkAng = (frameCount * 0.35 + i * 3) % (Math.PI * 2);
        ctx.strokeStyle = '#e84393';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(sparkAng) * (coreR * 0.8), Math.sin(sparkAng) * (coreR * 0.8));
        ctx.lineTo(Math.cos(sparkAng) * (anchorR * 1.45), Math.sin(sparkAng) * (anchorR * 1.45));
        ctx.stroke();
      }

      // 6. Barra de Vida Rúnica Superior
      const barW = 44;
      const barH = 5;
      const barY = -anchorR - 14;

      ctx.fillStyle = 'rgba(6, 4, 12, 0.9)';
      ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      const barGrad = ctx.createLinearGradient(-barW / 2, 0, barW / 2, 0);
      barGrad.addColorStop(0, '#00cec9');
      barGrad.addColorStop(1, '#a29bfe');
      ctx.fillStyle = barGrad;
      ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);

      ctx.strokeStyle = isAnchorHit ? '#ffffff' : 'rgba(0, 206, 201, 0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      ctx.fillStyle = '#00cec9';
      ctx.fillRect(-barW / 2 - 3, barY - 2, 2, barH + 4);
      ctx.fillRect(barW / 2 + 1, barY - 2, 2, barH + 4);

      ctx.restore();
    }
  }

  // 9. Disco de Acreção 3D
  ctx.save();
  ctx.lineWidth = isStaggered ? 2 : (e.phase === 3 ? 4.5 : 3.5);
  ctx.strokeStyle = isStaggered ? 'rgba(255, 255, 255, 0.35)' : primaryCol;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 2.1, R * 0.82, e.accretionAngle, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isStaggered ? 'rgba(200, 200, 200, 0.25)' : secondaryCol;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 1.85, R * 0.70, -e.accretionAngle * 1.25, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 1.5, R * 0.55, e.accretionAngle * 0.75, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 10. Tentáculos Articulados (8 braços, 6 nós cada)
  for (let t = 0; t < 8; t++) {
    const baseAngle = (t * Math.PI * 2) / 8;
    let prevX = Math.cos(baseAngle) * (R * 0.78);
    let prevY = Math.sin(baseAngle) * (R * 0.78);

    let postureFlop = 1.0;
    let waveAmp = 14;
    let waveFreq = 0.8;

    if (isStaggered) {
      postureFlop = 0.3;
      waveAmp = 4;
    } else if (isWindup) {
      waveAmp = 20;
      waveFreq = 1.4;
    } else if (isCasting) {
      postureFlop = 1.35;
      waveAmp = 10;
    }

    for (let seg = 1; seg <= 6; seg++) {
      const wave = Math.sin(e.tentacleCycle * waveFreq + t * 0.85 + seg * 0.55) * waveAmp;
      const segDist = (15 + (isCasting ? 4 : 0)) * postureFlop;

      const currX = prevX + Math.cos(baseAngle) * segDist + Math.cos(baseAngle + Math.PI / 2) * (wave * 0.35);
      const currY = prevY + Math.sin(baseAngle) * segDist + Math.sin(baseAngle + Math.PI / 2) * (wave * 0.35) + (isStaggered ? seg * 2.5 : 0);

      const plateWidth = Math.max(2.5, 7.5 - seg * 0.85);
      ctx.lineWidth = plateWidth;
      ctx.strokeStyle = isStaggered ? '#7f8c8d' : (seg % 2 === 0 ? secondaryCol : primaryCol);
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(currX, currY);
      ctx.stroke();

      ctx.fillStyle = isStaggered ? '#95a5a6' : edgeCol;
      ctx.beginPath();
      ctx.arc(currX, currY, plateWidth * 0.55, 0, Math.PI * 2);
      ctx.fill();

      if (seg === 6) {
        const bladeAngle = Math.atan2(currY - prevY, currX - prevX);
        const bladeLen = isCasting ? 16 : 11;
        const tipX = currX + Math.cos(bladeAngle) * bladeLen;
        const tipY = currY + Math.sin(bladeAngle) * bladeLen;

        ctx.strokeStyle = isStaggered ? '#bdc3c7' : '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(currX, currY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        ctx.fillStyle = isStaggered ? '#bdc3c7' : (e.phase === 3 ? '#00cec9' : '#e84393');
        ctx.beginPath();
        ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      prevX = currX;
      prevY = currY;
    }
  }

  // 11. Carapaça e Fissuras
  ctx.save();
  ctx.fillStyle = isHit ? '#ffffff' : (isStaggered ? '#2c3e50' : '#08010f');
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isStaggered ? '#f1c40f' : (isTransition ? '#ffffff' : primaryCol);
  ctx.lineWidth = isTransition ? 6 : 4;
  ctx.stroke();

  ctx.strokeStyle = isStaggered ? '#34495e' : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-R * 0.6, -R * 0.3);
  ctx.lineTo(0, -R * 0.85);
  ctx.lineTo(R * 0.6, -R * 0.3);
  ctx.lineTo(0, R * 0.8);
  ctx.closePath();
  ctx.stroke();

  if (e.phase >= 2 && !isStaggered) {
    ctx.strokeStyle = e.phase === 3 ? '#00cec9' : '#e84393';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-R * 0.5, -R * 0.4);
    ctx.lineTo(-R * 0.2, -R * 0.1);
    ctx.lineTo(-R * 0.35, R * 0.2);
    ctx.lineTo(-R * 0.1, R * 0.5);

    ctx.moveTo(R * 0.4, -R * 0.45);
    ctx.lineTo(R * 0.15, -R * 0.15);
    ctx.lineTo(R * 0.3, R * 0.3);
    ctx.stroke();
  }

  const sparkSeed = Math.floor(frameCount * 0.2);
  const sparkX = Math.sin(sparkSeed * 3.7) * (R * 0.7);
  const sparkY = Math.cos(sparkSeed * 5.3) * (R * 0.7);
  ctx.fillStyle = e.phase === 3 ? '#81ecec' : '#fd79a8';
  ctx.fillRect(sparkX - 1.5, sparkY - 1.5, 3, 3);
  ctx.restore();

  // 12. Núcleo Estelar
  ctx.save();
  const coreScale = isStaggered ? 0.65 : (1.0 + e.corePulse * 0.2);

  ctx.fillStyle = isStaggered ? 'rgba(241, 196, 15, 0.3)' : (e.phase === 3 ? 'rgba(0, 206, 201, 0.35)' : 'rgba(232, 67, 147, 0.35)');
  ctx.beginPath();
  ctx.ellipse(0, 0, 32 * coreScale, 13 * coreScale, frameCount * 0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isStaggered ? '#ffffff' : coreCol;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22 * coreScale, 8 * coreScale, frameCount * 0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isStaggered ? '#000000' : (e.phase === 3 ? '#00cec9' : '#08010f');
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.5, 9 * coreScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 13. Barra de Estabilidade Dimensional
  if ((isWindup || isCasting) && e.staggerGauge > 0) {
    const barW = 54;
    const barH = 5;
    const ratio = Math.min(1, e.staggerGauge / e.maxStaggerGauge);
    ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
    ctx.fillRect(-barW / 2, -R - 18, barW, barH);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-barW / 2, -R - 18, barW * ratio, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, -R - 18, barW, barH);
  }
}