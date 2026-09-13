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
  enemies,
  dpr,
  viewW,
  viewH
} from '../../main.js';

export const SOVEREIGN_STATES = Object.freeze({
  SPAWN_INTRO: 'SPAWN_INTRO',
  IDLE: 'IDLE',
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
 * Restringe rigidamente a posição do Soberano para nunca ultrapassar as bordas da arena.
 * @param {Object} boss
 */
export function clampBossToArena(boss) {
  if (!boss || boss.arenaCenterX === undefined || boss.arenaCenterY === undefined || !boss.arenaRadius) return;
  const bdx = boss.x - boss.arenaCenterX;
  const bdy = boss.y - boss.arenaCenterY;
  const bDist = Math.hypot(bdx, bdy) || 1;
  const maxBossDist = Math.max(0, boss.arenaRadius - (boss.radius || 40) - 20);

  if (bDist > maxBossDist) {
    boss.x = boss.arenaCenterX + (bdx / bDist) * maxBossDist;
    boss.y = boss.arenaCenterY + (bdy / bDist) * maxBossDist;
    if (boss.vx) boss.vx = 0;
    if (boss.vy) boss.vy = 0;
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
  boss.introDuration = 440; // Duração 2x maior na tela (~7.33 segundos a 60 FPS)
  boss.introTimer = 440;
  boss.isTargetable = false; // Bloqueia mira e auto-fire durante a animação de entrada
  boss.titleTimer = 220; // Reduzido em 50% (era 440 frames / ~7.3s -> agora 220 frames / ~3.6s)
  boss.titleMaxTimer = 220;
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
  boss.implosionLocked = false;
  boss.cleaveAngle = 0;
  boss.cleaveLocked = false;

  boss.idleTimer = 0;
  boss.idleDuration = 55;
  boss.smoothVx = 0;
  boss.smoothVy = 0;
  boss.prevX = boss.x;
  boss.prevY = boss.y;

  boss.activeAttacks = [];

  // Inicialização de física inercial dos 9 membros baseados na referência
  boss.tentaclePhysics = [];
  for (let l = 0; l < 9; l++) {
    boss.tentaclePhysics.push([
      { angleOffset: 0, angVel: 0 },
      { angleOffset: 0, angVel: 0 },
      { angleOffset: 0, angVel: 0 },
      { angleOffset: 0, angVel: 0 }
    ]);
  }

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

/**
 * Dispara uma sequência de fendas de vácuo perseguidoras (Bombardeio Abissal).
 * O primeiro nó mira exatamente sob os pés do jogador; os seguintes antecipam o vetor de movimento.
 * @param {Object} boss
 * @param {Object} player
 */
function spawnAbyssalHomingBarrage(boss, player) {
  const nodeCount = boss.phase === 3 ? 7 : (boss.phase === 2 ? 6 : 5);
  const interval = 9; // Intervalo de 9 frames entre cada fenda lançada

  for (let i = 0; i < nodeCount; i++) {
    scheduleDelayedAction(boss, i * interval, () => {
      if (boss.hp <= 0) return;

      // 1º nó atinge diretamente a posição atual; nós subsequentes realizam predição de movimento
      const pvx = player.vx || 0;
      const pvy = player.vy || 0;
      const isMoving = Math.hypot(pvx, pvy) > 0.4;

      let targetX = player.x;
      let targetY = player.y;

      if (i > 0 && isMoving) {
        const lead = 8 + i * 2;
        targetX += pvx * lead;
        targetY += pvy * lead;

        // Desvios laterais em leque para punir círculos fechados
        if (i % 2 === 1) {
          const perpX = -pvy;
          const perpY = pvx;
          const pLen = Math.hypot(perpX, perpY) || 1;
          const offset = (i % 4 === 1 ? 1 : -1) * 20;
          targetX += (perpX / pLen) * offset;
          targetY += (perpY / pLen) * offset;
        }
      }

      // Clamping estrito dentro dos limites da arena
      if (boss.arenaCenterX !== undefined && boss.arenaCenterY !== undefined && boss.arenaRadius) {
        const adx = targetX - boss.arenaCenterX;
        const ady = targetY - boss.arenaCenterY;
        const aDist = Math.hypot(adx, ady) || 1;
        const maxDist = boss.arenaRadius - 32;
        if (aDist > maxDist) {
          targetX = boss.arenaCenterX + (adx / aDist) * maxDist;
          targetY = boss.arenaCenterY + (ady / aDist) * maxDist;
        }
      }

      bossTelegraphs.push({
        type: 'ABYSSAL_VOID_RIFT',
        x: targetX,
        y: targetY,
        radius: 52,
        timer: 32,
        maxTimer: 32,
        damage: Math.round(boss.damage * 0.36),
        nodeIndex: i
      });

      playSfx('warp');
      triggerHaptic('light');
    });
  }
}

function prepareNextAttack(boss, context) {
  const { player } = context;

  const skillsPhase1 = ['VOID_CRUCIFIX', 'RELATIVISTIC_SALVO', 'ABYSSAL_RIFTS', 'DIMENSIONAL_CLEAVE'];
  const skillsPhase2 = ['VOID_CRUCIFIX', 'RELATIVISTIC_SALVO', 'ABYSSAL_RIFTS', 'DIMENSIONAL_CLEAVE', 'COSMIC_SUPERNOVA', 'VOID_WARP', 'SINGULARITY_IMPLOSION'];
  const skillsPhase3 = ['VOID_CRUCIFIX', 'RELATIVISTIC_SALVO', 'ABYSSAL_RIFTS', 'DIMENSIONAL_CLEAVE', 'COSMIC_SUPERNOVA', 'ASTRAL_BARRAGE', 'VOID_WARP', 'SINGULARITY_IMPLOSION'];

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
      playSfx('charge');
      break;
    }

    case 'DIMENSIONAL_CLEAVE': {
      boss.windupTimer = boss.phase === 3 ? 40 : 48;
      boss.windupMax = boss.windupTimer;
      boss.cleaveAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.cleaveLocked = false;
      playSfx('charge');
      break;
    }

    case 'COSMIC_SUPERNOVA': {
      boss.windupTimer = 58;
      boss.windupMax = 58;
      boss.supernovaOrbs = [];
      const orbCount = boss.phase === 3 ? 10 : 8;
      for (let o = 0; o < orbCount; o++) {
        boss.supernovaOrbs.push({
          baseAngle: (o * Math.PI * 2) / orbCount,
          dist: 360
        });
      }
      playSfx('singularity');
      break;
    }

    case 'ASTRAL_BARRAGE': {
      boss.windupTimer = 38;
      boss.windupMax = 38;
      boss.astralMeteorTimer = 0;
      boss.astralMeteorsLeft = 7;
      playSfx('charge');
      break;
    }

    case 'VOID_WARP': {
      boss.actionState = SOVEREIGN_STATES.WARP_AIM;
      boss.windupTimer = 42;
      boss.windupMax = 42;
      boss.warpStartX = boss.x;
      boss.warpStartY = boss.y;

      const leadFactor = player.isMoving ? 26 : 0;
      let targetX = player.x + (player.facing || 1) * leadFactor + (Math.random() - 0.5) * 40;
      let targetY = player.y + (Math.random() - 0.5) * 40;

      // Clamping rígido do destino do teleporte dentro da arena
      if (boss.arenaCenterX !== undefined && boss.arenaCenterY !== undefined && boss.arenaRadius) {
        const wdx = targetX - boss.arenaCenterX;
        const wdy = targetY - boss.arenaCenterY;
        const wDist = Math.hypot(wdx, wdy) || 1;
        const maxWarpDist = Math.max(0, boss.arenaRadius - (boss.radius || 40) - 35);
        if (wDist > maxWarpDist) {
          targetX = boss.arenaCenterX + (wdx / wDist) * maxWarpDist;
          targetY = boss.arenaCenterY + (wdy / wDist) * maxWarpDist;
        }
      }
      boss.warpTargetX = targetX;
      boss.warpTargetY = targetY;
      playSfx('warp');
      break;
    }

    case 'SINGULARITY_IMPLOSION': {
      boss.windupTimer = 58;
      boss.windupMax = 58;
      boss.implosionX = player.x;
      boss.implosionY = player.y;
      boss.implosionRadius = boss.implosionMaxRadius;
      boss.implosionLocked = false;
      playSfx('singularity');
      break;
    }

    default:
      boss.windupTimer = 50;
      boss.windupMax = 50;
      break;
  }
}

function startSkillCast(boss, context) {
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
      boss.castDuration = 65;
      playSfx('boss');
      if (context && context.player) {
        spawnAbyssalHomingBarrage(boss, context.player);
      }
      break;
    case 'DIMENSIONAL_CLEAVE': {
      boss.castDuration = 24;
      playSfx('warp');
      playSfx('boss');
      context.triggerShake(16);
      triggerHaptic('heavy');

      const cuts = boss.phase === 3 ? 4 : 3;
      const cutDefs = [];
      const baseAng = boss.cleaveAngle || 0;
      for (let l = 0; l < cuts; l++) {
        const ang = baseAng + (l - (cuts - 1) / 2) * (Math.PI / cuts);
        cutDefs.push({
          x: boss.x,
          y: boss.y,
          angle: ang,
          length: (boss.arenaRadius || 620) * 2.2,
          width: 42,
          damage: Math.round(boss.damage * 0.40)
        });
      }

      boss.activeAttacks.push({
        type: 'DIMENSIONAL_SLASH',
        cuts: cutDefs,
        timer: 24,
        maxTimer: 24
      });
      break;
    }
    case 'COSMIC_SUPERNOVA': {
      boss.castDuration = 35;
      context.triggerShake(20);
      triggerHaptic('heavy');
      playSfx('boss');
      playSfx('singularity');
      bossShockwaves.push({
        x: boss.x,
        y: boss.y,
        radius: 20,
        maxRadius: (boss.arenaRadius || 620) * 0.92,
        speed: 7.2,
        damage: Math.round(boss.damage * 0.40),
        hitPlayer: false,
        colorRgb: '224, 86, 253'
      });

      // Mira inteligente: feixe estelar primário apontado diretamente na posição do jogador
      const primaryAngle = Math.atan2(context.player.y - boss.y, context.player.x - boss.x);
      enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(primaryAngle) * 6.8,
        vy: Math.sin(primaryAngle) * 6.8,
        radius: 8.0,
        damage: Math.round(boss.damage * 0.32),
        bulletType: 'COSMIC_BOLT',
        life: 130
      });

      const beamCount = boss.phase === 3 ? 10 : 8;
      for (let b = 1; b < beamCount; b++) {
        const bAng = primaryAngle + (b * Math.PI * 2) / beamCount;
        enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(bAng) * 5.6,
          vy: Math.sin(bAng) * 5.6,
          radius: 6.0,
          damage: Math.round(boss.damage * 0.22),
          bulletType: 'COSMIC_BOLT',
          life: 120
        });
      }

      boss.activeAttacks.push({
        type: 'SUPERNOVA_FLASH',
        x: boss.x,
        y: boss.y,
        maxR: (boss.arenaRadius || 620) * 0.85,
        timer: 28,
        maxTimer: 28
      });

      boss.supernovaOrbs = [];
      break;
    }
    case 'ASTRAL_BARRAGE':
      boss.castDuration = 80;
      boss.astralMeteorTimer = 0;
      boss.astralMeteorsLeft = 7;
      playSfx('boss');
      break;
    case 'SINGULARITY_IMPLOSION': {
      boss.castDuration = 22;
      boss.activeAttacks.push({
        type: 'VOID_IMPLOSION_CORE',
        x: boss.implosionX,
        y: boss.implosionY,
        radius: boss.implosionMaxRadius,
        timer: 22,
        maxTimer: 22
      });
      break;
    }
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

/**
 * Atualiza a física inercial dos 9 tentáculos via modelo spring-damper acoplado à velocidade do chefe.
 */
function updateTentaclePhysics(boss, dt) {
  if (!boss.tentaclePhysics) {
    boss.tentaclePhysics = [];
    for (let l = 0; l < 9; l++) {
      boss.tentaclePhysics.push([
        { angleOffset: 0, angVel: 0 },
        { angleOffset: 0, angVel: 0 },
        { angleOffset: 0, angVel: 0 },
        { angleOffset: 0, angVel: 0 }
      ]);
    }
  }

  // Rastreamento preciso da velocidade de translação do chefe
  if (boss.prevX === undefined) { boss.prevX = boss.x; boss.prevY = boss.y; }
  const rawVx = (boss.x - boss.prevX) / Math.max(0.001, dt);
  const rawVy = (boss.y - boss.prevY) / Math.max(0.001, dt);
  boss.prevX = boss.x;
  boss.prevY = boss.y;

  // Filtro exponencial para evitar solavancos ou picos de colisão
  boss.smoothVx = (boss.smoothVx || 0) * 0.82 + rawVx * 0.18;
  boss.smoothVy = (boss.smoothVy || 0) * 0.82 + rawVy * 0.18;

  const restBaseAngles = [
    -Math.PI * 0.50,      // 0: Superior vertical
    -Math.PI * 0.22,      // 1: Superior Direito
    -0.08,                // 2: Médio Direito Horizontal
    Math.PI * 0.16,       // 3: Inferior Direito
    Math.PI * 0.36,       // 4: Inferior-Direita baixo
    Math.PI * 0.50,       // 5: Inferior Vertical Central
    Math.PI * 0.64,       // 6: Inferior-Esquerda baixo
    Math.PI * 0.98,       // 7: Médio Esquerdo Horizontal
    -Math.PI * 0.78       // 8: Superior Esquerdo
  ];

  const springK = 0.085;
  const damping = 0.80;

  for (let l = 0; l < 9; l++) {
    const baseAng = restBaseAngles[l];
    // Vetor ortogonal à linha de visada do membro
    const perpX = -Math.sin(baseAng);
    const perpY = Math.cos(baseAng);
    const velPerp = boss.smoothVx * perpX + boss.smoothVy * perpY;

    const limbPhysics = boss.tentaclePhysics[l];
    for (let s = 0; s < 4; s++) {
      const seg = limbPhysics[s];
      // Força inercial contrária à velocidade que cresce em direção à ponta do tentáculo
      const dragTorque = -velPerp * (0.016 + s * 0.012);

      // Equação do Oscilador Harmônico Amortecido
      const acc = -springK * seg.angleOffset - damping * seg.angVel + dragTorque;
      seg.angVel += acc * dt;
      seg.angleOffset += seg.angVel * dt;

      // Soft clamp para evitar deformações anatômicas absurdas
      seg.angleOffset = Math.max(-0.46, Math.min(0.46, seg.angleOffset));
    }
  }
}

/**
 * Atualiza o ciclo de vida e a física de colisão contínua dos ataques ativos (Cortes e Implosões).
 */
function updateActiveAttacks(boss, dt, context) {
  if (!boss.activeAttacks || boss.activeAttacks.length === 0) return;
  const { player, addDamageText, triggerShake, createHitParticles } = context;

  for (let i = boss.activeAttacks.length - 1; i >= 0; i--) {
    const atk = boss.activeAttacks[i];
    atk.timer -= dt;

    if (atk.type === 'DIMENSIONAL_SLASH') {
      // Janela de dano letal ativo durante a manifestação da lâmina
      if (atk.timer > atk.maxTimer - 6 && player.iFrames <= 0) {
        const cuts = atk.cuts || [];
        for (let c = 0; c < cuts.length; c++) {
          const cut = cuts[c];
          const cosA = Math.cos(cut.angle);
          const sinA = Math.sin(cut.angle);
          const pdx = player.x - cut.x;
          const pdy = player.y - cut.y;
          const proj = pdx * cosA + pdy * sinA;
          const perpDist = Math.abs(-pdx * sinA + pdy * cosA);
          const halfLen = cut.length * 0.5;

          if (Math.abs(proj) <= halfLen && perpDist <= (cut.width || 42)) {
            player.hp -= cut.damage;
            player.iFrames = 26;
            triggerShake(14);
            playSfx('hit');
            triggerHaptic('heavy');
            addDamageText(player.x, player.y, `-${cut.damage}`, false, '#00cec9');
            createHitParticles(player.x, player.y, '#00cec9', 14);
            break;
          }
        }
      }
    }

    if (atk.timer <= 0) {
      boss.activeAttacks.splice(i, 1);
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
  updateTentaclePhysics(e, dt);
  updateActiveAttacks(e, dt, context);

  // Decrementa o tempo de exibição do banner de tela do chefe
  if (e.titleTimer > 0) {
    e.titleTimer -= dt;
  }

  // Regeneração dinâmica de vida pelas Âncoras Cósmicas (0.5% por segundo por âncora viva; 3 âncoras = 1.5% por segundo)
  const activeAnchorCount = e.anchors ? e.anchors.filter(a => a.active && a.hp > 0).length : 0;
  if (activeAnchorCount > 0 && e.hp > 0 && e.actionState !== SOVEREIGN_STATES.SPAWN_INTRO) {
    const healRatePerSec = 0.005 * activeAnchorCount;
    const healPerFrame = (e.maxHp * healRatePerSec / 60) * dt;
    e.hp = Math.min(e.maxHp, e.hp + healPerFrame);

    if (e.healPulseTimer === undefined) e.healPulseTimer = 0;
    e.healPulseTimer += dt;
    if (e.healPulseTimer >= 60) {
      e.healPulseTimer = 0;
      if (e.hp < e.maxHp) {
        const healDisplay = (activeAnchorCount * 0.5).toFixed(1).replace('.0', '');
        addDamageText(e.x, e.y - e.radius - 24, `+${healDisplay}% HP`, false, '#2ecc71');
        createHitParticles(e.x, e.y, '#2ecc71', 6);
      }
    }
  }

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
      const introMax = e.introDuration || 440;
      e.introTimer -= dt;
      const progress = Math.min(1.0, Math.max(0, 1 - (e.introTimer / introMax)));

      // Imunidade total a dano e bloqueio de mira/auto-fire durante a introdução cinematográfica
      e.isVulnerable = false;
      e.isTargetable = false;

      // Preenchimento cinematográfico dramático da barra de HP no HUD (0% a 100%)
      const hpPercent = Math.min(100, Math.round(progress * 100));
      const bossHpFill = document.getElementById('boss-hp-fill');
      if (bossHpFill) bossHpFill.style.width = `${hpPercent}%`;
      const bossHpVal = document.getElementById('boss-hp-val');
      if (bossHpVal) bossHpVal.innerText = `${hpPercent}%`;

      // ATO 1 (0.00 -> 0.25): O Rasgo da Realidade / Vácuo Gravitacional
      if (progress < 0.25) {
        if (Math.floor(frameCount) % 4 === 0) {
          triggerShake(1.2 + progress * 6);
          // Partículas cósmicas sendo tragadas para o ponto de rasgo dimensional
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 120 + Math.random() * 160;
          createHitParticles(
            e.x + Math.cos(pAngle) * pDist,
            e.y + Math.sin(pAngle) * pDist,
            progress > 0.12 ? '#00cec9' : '#e84393',
            2
          );
        }
        if (Math.floor(e.introTimer) === 410) {
          playSfx('charge');
        }
      } 
      // ATO 2 (0.25 -> 0.55): A Fenda Primordial e Relâmpagos do Vazio
      else if (progress < 0.55) {
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(2.0 + Math.sin(progress * 10) * 2);
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 40 + Math.random() * 80;
          createHitParticles(e.x + Math.cos(pAngle) * pDist, e.y + Math.sin(pAngle) * pDist, '#81ecec', 2);
          createHitParticles(e.x, e.y, '#ffffff', 1);
        }
        if (Math.floor(e.introTimer) === 270) {
          playSfx('warp');
          triggerHaptic('medium');
        }
      } 
      // ATO 3 (0.55 -> 0.85): A Manifestação Cósmica / Asas e Halos
      else if (progress < 0.85) {
        e.hoverAngle += 0.05 * dt;
        e.y += Math.sin(e.hoverAngle) * 0.3 * dt;

        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(2.8 + Math.sin(progress * 12) * 2);
          createHitParticles(
            e.x + (Math.random() - 0.5) * e.radius * 2,
            e.y + (Math.random() - 0.5) * e.radius * 2,
            '#00cec9',
            2
          );
          createHitParticles(
            e.x + (Math.random() - 0.5) * e.radius * 2,
            e.y + (Math.random() - 0.5) * e.radius * 2,
            '#e84393',
            1
          );
        }

        // Som de sincronização dos halos celestes
        if (Math.floor(e.introTimer) === 130) {
          playSfx('forcefield');
          triggerHaptic('medium');
        }
      } 
      // ATO 4 (0.85 -> 1.00): O Despertar da Singularidade e Pilar Primordial
      else {
        e.hoverAngle += 0.07 * dt;
        e.y += Math.sin(e.hoverAngle) * 0.4 * dt;

        if (Math.floor(frameCount) % 2 === 0) {
          triggerShake(4.5);
          createHitParticles(e.x, e.y, '#ffffff', 3);
          createHitParticles(e.x, e.y, '#00cec9', 2);
          createHitParticles(e.x, e.y, '#e84393', 2);
        }

        if (Math.floor(e.introTimer) === 50) {
          playSfx('singularity');
        }
      }

      // Clímax e Transição para o Combate
      if (e.introTimer <= 0) {
        e.actionState = SOVEREIGN_STATES.IDLE;
        e.idleTimer = 70;
        e.isTargetable = true; // Auto-fire e miras desbloqueados!
        e.stateTimer = 0;

        // Detonação épica de onda de choque cósmica em tela inteira
        triggerShake(24);
        triggerHaptic('heavy');
        playSfx('singularity');
        playSfx('boss');

        if (context.bossShockwaves) {
          context.bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 30,
            maxRadius: e.arenaRadius || 620,
            speed: 16,
            damage: 0,
            color: '#00cec9',
            colorRgb: '0, 206, 201',
            thickness: 6
          });
        }

        addDamageText(e.x, e.y - e.radius - 22, "O SOBERANO DESPERTOU!", true, '#00cec9');
        addDamageText(e.x, e.y - e.radius - 42, "O FIM DOS TEMPOS COMEÇOU", false, '#e84393');

        // Spawna as âncoras abissais
        spawnRiftAnchors(e, 3, 5000);
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
        e.actionState = SOVEREIGN_STATES.IDLE;
        e.stateTimer = 0;
        e.idleTimer = 45;
      }
      break;
    }

    case SOVEREIGN_STATES.IDLE: {
      // Estado Inativo: Chefe sereno flutuando em repouso estático exibindo o modelo da referência
      e.stateTimer += dt;
      e.hoverAngle += 0.025 * dt;
      e.y += Math.sin(e.hoverAngle) * 0.25 * dt;

      // Desaceleração suave da velocidade residual
      if (e.smoothVx) e.smoothVx *= 0.88;
      if (e.smoothVy) e.smoothVy *= 0.88;

      e.idleTimer -= dt;
      if (e.idleTimer <= 0) {
        e.actionState = SOVEREIGN_STATES.HOVER_CHASE;
        e.stateTimer = 0;
        e.attackCooldown = e.phase === 3 ? 30 : (e.phase === 2 ? 45 : 55);
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
      } else if (e.currentSkill === 'DIMENSIONAL_CLEAVE') {
        const ratio = 1 - (e.windupTimer / e.windupMax);
        if (ratio < 0.65) {
          // Tracking suave do vetor do jogador durante a primeira metade do windup
          const targetAng = Math.atan2(player.y - e.y, player.x - e.x);
          let diff = targetAng - e.cleaveAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          e.cleaveAngle += diff * 0.09 * dt;
        } else if (!e.cleaveLocked) {
          // Lock-on firme nos últimos 35% com aviso de perigo
          e.cleaveLocked = true;
          playSfx('charge');
          triggerHaptic('medium');
        }
      } else if (e.currentSkill === 'COSMIC_SUPERNOVA' && e.supernovaOrbs) {
        const ratio = 1 - (e.windupTimer / e.windupMax);
        const curR = 360 * (1 - ratio);
        for (let o = 0; o < e.supernovaOrbs.length; o++) {
          e.supernovaOrbs[o].dist = curR;
        }
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(1.5 + ratio * 4);
        }
      } else if (e.currentSkill === 'SINGULARITY_IMPLOSION') {
        const ratio = 1 - (e.windupTimer / e.windupMax);
        e.implosionRadius = e.implosionMaxRadius * (1 - ratio);

        if (ratio < 0.60) {
          // O centro gravitacional persegue suavemente o jogador antes de se firmar
          e.implosionX += (player.x - e.implosionX) * 0.08 * dt;
          e.implosionY += (player.y - e.implosionY) * 0.08 * dt;
        } else if (!e.implosionLocked) {
          e.implosionLocked = true;
          playSfx('singularity');
          triggerHaptic('medium');
        }

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
        startSkillCast(e, context);
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

        const beamLength = 1300;
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
              const laserDmg = Math.round(e.damage * 0.2275);
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
          // Mira intencional dinâmica em cada disparo com feixe duplo de plasma abissal
          const directAng = Math.atan2(player.y - e.y, player.x - e.x);
          const pvx = player.vx || 0;
          const pvy = player.vy || 0;
          const isMoving = Math.hypot(pvx, pvy) > 0.3;
          const leadAng = isMoving ? Math.atan2(pvy, pvx) : directAng;

          const waveStep = Math.floor(e.stateTimer / salvoInterval);
          const aimAng = (waveStep % 2 === 0) ? directAng : (directAng * 0.7 + leadAng * 0.3);
          const spread = 0.14;
          const speed = 6.2;
          const bulletDmg = Math.round(e.damage * 0.22);

          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(aimAng + spread) * speed,
            vy: Math.sin(aimAng + spread) * speed,
            radius: 5.5,
            damage: bulletDmg,
            bulletType: 'ABYSSAL_BOLT',
            life: 120
          });

          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(aimAng - spread) * speed,
            vy: Math.sin(aimAng - spread) * speed,
            radius: 5.5,
            damage: bulletDmg,
            bulletType: 'ABYSSAL_BOLT',
            life: 120
          });

          playSfx('shoot');
          triggerHaptic('light');
          createHitParticles(e.x, e.y, '#00cec9', 4);
        }
      } else if (e.currentSkill === 'ASTRAL_BARRAGE') {
        e.astralMeteorTimer = (e.astralMeteorTimer || 0) + dt;
        if (e.astralMeteorTimer >= 10 && e.astralMeteorsLeft > 0) {
          e.astralMeteorTimer = 0;
          e.astralMeteorsLeft--;

          let targetX = player.x;
          let targetY = player.y;
          if (e.astralMeteorsLeft < 6) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 25 + Math.random() * 80;
            targetX += Math.cos(pAng) * pDist;
            targetY += Math.sin(pAng) * pDist;
          }

          if (e.arenaCenterX !== undefined && e.arenaRadius) {
            const adx = targetX - e.arenaCenterX;
            const ady = targetY - e.arenaCenterY;
            const aDist = Math.hypot(adx, ady) || 1;
            const maxD = e.arenaRadius - 30;
            if (aDist > maxD) {
              targetX = e.arenaCenterX + (adx / aDist) * maxD;
              targetY = e.arenaCenterY + (ady / aDist) * maxD;
            }
          }

          bossTelegraphs.push({
            type: 'ASTRAL_METEOR_SEAL',
            x: targetX,
            y: targetY,
            radius: 65,
            timer: 36,
            maxTimer: 36,
            damage: Math.round(e.damage * 0.36)
          });

          // Dispara a animação ativa de meteoro caindo do cosmos 16 frames antes do impacto
          scheduleDelayedAction(e, 18, () => {
            if (e.hp <= 0) return;
            e.activeAttacks.push({
              type: 'FALLING_ASTRAL_METEOR',
              startX: targetX + (Math.random() - 0.5) * 80,
              startY: targetY - 480,
              targetX: targetX,
              targetY: targetY,
              timer: 18,
              maxTimer: 18
            });
          });

          playSfx('charge');
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
          e.actionState = SOVEREIGN_STATES.IDLE;
          e.stateTimer = 0;
          e.idleTimer = e.phase === 3 ? 35 : (e.phase === 2 ? 48 : 62);
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

        // Saraivada alinhada diretamente no vetor do jogador
        const aimToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        const shardCount = e.phase === 3 ? 12 : 8;
        for (let s = 0; s < shardCount; s++) {
          const sAng = aimToPlayer + (s * Math.PI * 2) / shardCount;
          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(sAng) * 5.5,
            vy: Math.sin(sAng) * 5.5,
            radius: 5.0,
            damage: Math.round(e.damage * 0.20),
            bulletType: 'ABYSSAL_BOLT',
            life: 95
          });
        }

        e.actionState = SOVEREIGN_STATES.IDLE;
        e.stateTimer = 0;
        e.idleTimer = e.phase === 2 ? 40 : 30;
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
        e.actionState = SOVEREIGN_STATES.IDLE;
        e.stateTimer = 0;
        e.idleTimer = 45;
        addDamageText(e.x, e.y - e.radius - 12, "ESTABILIZADO!", true, '#8e44ad');
      }
      break;
    }

    default: {
      e.actionState = SOVEREIGN_STATES.HOVER_CHASE;
      break;
    }
  }

  // Garante que o chefe permaneça estritamente contido dentro da arena
  clampBossToArena(e);
}

/**
 * Renderização da Introdução Majestosa em 3 Atos do Chefe Final (Soberano do Abismo).
 * Manifestação cósmica com fenda no tecido espacial, asas em espiral, halos e raio primordial.
 */
function drawMajesticSpawnIntro(ctx, e, frameCount) {
  const R = e.radius;
  const introMax = e.introDuration || 220;
  const progress = Math.min(1.0, Math.max(0, 1 - (e.introTimer / introMax)));

  // Selo Abissal no Solo aumentando gradualmente de intensidade
  ctx.save();
  const groundPulse = Math.sin(frameCount * 0.12) * 6 * progress;
  const groundRot = frameCount * 0.025;
  const rx = Math.max(0.1, R * 1.8 * progress + groundPulse);
  const ry = Math.max(0.1, (R * 0.6 * progress) + groundPulse * 0.35);

  ctx.strokeStyle = `rgba(0, 206, 201, ${0.2 + progress * 0.6})`;
  ctx.lineWidth = 2 + progress * 2;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.95, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  const glyphCount = 12;
  for (let g = 0; g < glyphCount; g++) {
    const ga = groundRot + (g * Math.PI * 2) / glyphCount;
    const gx = Math.cos(ga) * rx;
    const gy = R * 0.95 + Math.sin(ga) * ry;
    ctx.fillStyle = g % 2 === 0 ? '#00cec9' : '#e84393';
    ctx.fillRect(gx - 2, gy - 2, 4, 4);
  }
  ctx.restore();

  // ==========================================
  // ATO 1: O RASGO DA REALIDADE (0.00 <= progress < 0.25)
  // ==========================================
  if (progress < 0.25) {
    const act1Prog = progress / 0.25;
    const riftH = 150 * act1Prog;
    const riftW = 8 + Math.sin(frameCount * 0.3) * 6;

    ctx.save();
    const riftGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, Math.max(10, riftH * 0.9));
    riftGlow.addColorStop(0, 'rgba(0, 206, 201, 0.85)');
    riftGlow.addColorStop(0.4, 'rgba(232, 67, 147, 0.55)');
    riftGlow.addColorStop(0.8, 'rgba(108, 92, 231, 0.25)');
    riftGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = riftGlow;
    ctx.beginPath();
    ctx.ellipse(0, 0, riftW * 5, riftH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo do rasgo dimensional
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, riftW * 0.7, riftH * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#020005';
    ctx.beginPath();
    ctx.ellipse(0, 0, riftW * 0.3, riftH * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Raios de sucção gravitacional espiral
    const suctionRays = 10;
    for (let s = 0; s < suctionRays; s++) {
      const sAngle = (s * Math.PI * 2) / suctionRays + frameCount * 0.04;
      const rayLen = (1 - ((frameCount * 2.5 + s * 16) % 80) / 80) * 140;
      const sx = Math.cos(sAngle) * rayLen;
      const sy = Math.sin(sAngle) * rayLen;
      ctx.strokeStyle = s % 2 === 0 ? 'rgba(0, 206, 201, 0.7)' : 'rgba(232, 67, 147, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx * 0.15, sy * 0.15);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==========================================
  // ATO 2: A FENDA PRIMORDIAL E RELÂMPAGOS DO VAZIO (0.25 <= progress < 0.55)
  // ==========================================
  else if (progress < 0.55) {
    const act2Prog = (progress - 0.25) / 0.30;
    const riftH = 150 + act2Prog * 70;
    const riftW = 14 + Math.sin(frameCount * 0.35) * 8;

    ctx.save();
    // Fenda estelar profunda
    const fendaGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, riftH);
    fendaGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    fendaGlow.addColorStop(0.3, 'rgba(0, 206, 201, 0.7)');
    fendaGlow.addColorStop(0.7, 'rgba(232, 67, 147, 0.4)');
    fendaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fendaGlow;
    ctx.beginPath();
    ctx.ellipse(0, 0, riftW * 4, riftH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Relâmpagos de matéria escura cortando a fenda
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    for (let l = 0; l < 4; l++) {
      const lY = (Math.sin(frameCount * 0.4 + l * 2) * riftH * 0.6);
      const lW = (Math.sin(frameCount * 0.5 + l * 1.5) * 50);
      ctx.beginPath();
      ctx.moveTo(0, lY);
      ctx.lineTo(lW * 0.4, lY + 10);
      ctx.lineTo(lW, lY - 6);
      ctx.stroke();
    }

    // Primeiro Halo Celestial engrenando
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.6)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.7, -frameCount * 0.05, Math.PI * 2 * act2Prog - frameCount * 0.05);
    ctx.stroke();

    ctx.restore();
  }

  // ==========================================
  // ATO 3: A MANIFESTAÇÃO CÓSMICA E DESABROCHAR DAS ASAS (0.55 <= progress < 0.85)
  // ==========================================
  else if (progress < 0.85) {
    const act3Prog = (progress - 0.55) / 0.30;
    const curScale = 0.35 + act3Prog * 0.70;
    const alpha = Math.min(1.0, 0.4 + act3Prog * 0.6);

    ctx.save();
    ctx.scale(curScale, curScale);
    ctx.globalAlpha = alpha;

    // Fenda residual se abrindo em anel de choque
    const blastR = R * (1.2 + Math.sin(frameCount * 0.2) * 0.15);
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, blastR, 0, Math.PI * 2);
    ctx.stroke();

    // 1. Os 3 Halos Celestes acendendo progressivamente
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.7, -frameCount * 0.05, Math.PI * 2 - frameCount * 0.05);
    ctx.stroke();

    ctx.strokeStyle = '#e84393';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.1, frameCount * 0.04, Math.PI * 2 * act3Prog + frameCount * 0.04);
    ctx.stroke();

    if (act3Prog > 0.4) {
      const h3Prog = (act3Prog - 0.4) / 0.6;
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.45, -frameCount * 0.03, Math.PI * 2 * h3Prog - frameCount * 0.03);
      ctx.stroke();
    }

    // 2. As 6 Asas de Matéria Escura desabrochando em espiral com rastro estelar
    const wingBloom = Math.min(1.0, act3Prog * 1.25);
    const armCount = 6;
    for (let arm = 0; arm < armCount; arm++) {
      const baseAng = (arm * Math.PI * 2) / armCount + frameCount * 0.02;
      const wingLength = (R * 1.55) * wingBloom;
      ctx.strokeStyle = arm % 2 === 0 ? '#00cec9' : '#e84393';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const cp1x = Math.cos(baseAng + 0.5) * (wingLength * 0.5);
      const cp1y = Math.sin(baseAng + 0.5) * (wingLength * 0.5);
      const endX = Math.cos(baseAng) * wingLength;
      const endY = Math.sin(baseAng) * wingLength;
      ctx.quadraticCurveTo(cp1x, cp1y, endX, endY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(endX, endY, 3.8 * wingBloom, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Manto Sombrio do Soberano
    ctx.fillStyle = '#08010f';
    ctx.beginPath();
    ctx.moveTo(0, -R * 0.8);
    ctx.lineTo(R * 0.6, -R * 0.2);
    ctx.lineTo(R * 0.45, R * 0.75);
    ctx.lineTo(0, R * 0.95);
    ctx.lineTo(-R * 0.45, R * 0.75);
    ctx.lineTo(-R * 0.6, -R * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Olho central abrindo
    ctx.fillStyle = '#00cec9';
    ctx.beginPath();
    ctx.ellipse(0, -R * 0.15, 8 * act3Prog, 14 * act3Prog, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -R * 0.15, 3.5 * act3Prog, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ==========================================
  // ATO 4: O DESPERTAR DA SINGULARIDADE E PILAR PRIMORDIAL (0.85 <= progress <= 1.00)
  // ==========================================
  else {
    const act4Prog = (progress - 0.85) / 0.15;
    ctx.save();

    const bossPulse = 1.0 + Math.sin(frameCount * 0.15) * 0.04;
    ctx.scale(bossPulse, bossPulse);

    // 1. Raio Primordial disparado verticalmente do Olho para o Espaço
    const beamW = 16 + Math.sin(frameCount * 0.4) * 8 + act4Prog * 18;
    const beamH = 900;
    const beamGrad = ctx.createLinearGradient(0, -R * 0.2, 0, -beamH);
    beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
    beamGrad.addColorStop(0.2, 'rgba(0, 206, 201, 0.9)');
    beamGrad.addColorStop(0.7, 'rgba(108, 92, 231, 0.45)');
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(-beamW * 0.5, -beamH, beamW, beamH);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -beamH, 6, beamH);

    // 2. Halos Celestes com rotação acelerada
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(232, 67, 147, 0.75)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(162, 155, 254, 0.75)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // 3. As 6 Asas / Tentáculos em postura de guerra
    for (let arm = 0; arm < 6; arm++) {
      const baseAng = (arm * Math.PI * 2) / 6 + Math.sin(frameCount * 0.08 + arm) * 0.12;
      const wLen = R * 1.65;
      ctx.strokeStyle = arm % 2 === 0 ? '#00cec9' : '#e84393';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const cpX = Math.cos(baseAng + 0.45) * (wLen * 0.55);
      const cpY = Math.sin(baseAng + 0.45) * (wLen * 0.55);
      const eX = Math.cos(baseAng) * wLen;
      const eY = Math.sin(baseAng) * wLen;
      ctx.quadraticCurveTo(cpX, cpY, eX, eY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eX, eY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Manto Real e Coroa Abissal
    ctx.fillStyle = '#06010c';
    ctx.beginPath();
    ctx.moveTo(0, -R * 0.95);
    ctx.lineTo(R * 0.65, -R * 0.25);
    ctx.lineTo(R * 0.5, R * 0.85);
    ctx.lineTo(0, R * 1.05);
    ctx.lineTo(-R * 0.5, R * 0.85);
    ctx.lineTo(-R * 0.65, -R * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Coroa de Espinhos da Singularidade
    ctx.fillStyle = '#00cec9';
    for (let c = -3; c <= 3; c++) {
      const cAng = (c * 0.22);
      const cxP = Math.sin(cAng) * (R * 0.7);
      const cyP = -R * 0.85 - Math.cos(cAng) * 16;
      ctx.beginPath();
      ctx.moveTo(cxP - 3, -R * 0.75);
      ctx.lineTo(cxP, cyP);
      ctx.lineTo(cxP + 3, -R * 0.75);
      ctx.closePath();
      ctx.fill();
    }

    // Olho Primordial Central em fúria estelar
    ctx.fillStyle = '#00cec9';
    ctx.beginPath();
    ctx.ellipse(0, -R * 0.2, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -R * 0.2, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Ondas de choque em anéis pré-explosão
    if (act4Prog > 0.4) {
      const ringExpand = ((act4Prog - 0.4) / 0.6) * (R * 3.2);
      const ringAlpha = 1 - ((act4Prog - 0.4) / 0.6);
      ctx.strokeStyle = `rgba(0, 206, 201, ${ringAlpha})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, ringExpand, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Renderiza o Banner Cinematográfico Apocalíptico de Entrada do Soberano do Abismo.
 * Posicionado no centro da tela, flutuando diretamente acima do herói (horizontal e vertical).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
function drawCinematicScreenTitle(ctx, e, frameCount) {
  const maxT = e.titleMaxTimer || 220;
  const titleProgress = 1 - Math.max(0, e.titleTimer / maxT);

  // Transição suave de entrada e saída (duração ajustada: ~3.6s total)
  let bannerAlpha = 1.0;
  if (titleProgress < 0.08) {
    bannerAlpha = titleProgress / 0.08;
  } else if (titleProgress > 0.80) {
    bannerAlpha = Math.max(0, (1 - titleProgress) / 0.20);
  }

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = bannerAlpha;

  const screenW = viewW || (typeof window !== 'undefined' ? window.innerWidth : 1280);
  const screenH = viewH || (typeof window !== 'undefined' ? window.innerHeight : 800);
  const isVertical = screenH > screenW || screenW < 640;

  // Em telas verticais (smartphones) e horizontais (desktop):
  // O banner é centralizado horizontalmente e posicionado flutuando diretamente acima do personagem
  const bannerW = isVertical ? Math.min(380, screenW * 0.94) : Math.min(880, screenW * 0.90);
  const bannerH = isVertical ? 58 : 94;
  const bx = (screenW - bannerW) / 2;
  const by = Math.round((screenH / 2) - bannerH - (isVertical ? 45 : 65));

  // 1. Fundo Cósmico Carmesim Profundo com Gradiente Translúcido
  const bgGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  bgGrad.addColorStop(0, 'rgba(15, 0, 4, 0)');
  bgGrad.addColorStop(0.15, 'rgba(28, 2, 8, 0.95)');
  bgGrad.addColorStop(0.5, 'rgba(52, 4, 14, 0.98)');
  bgGrad.addColorStop(0.85, 'rgba(28, 2, 8, 0.95)');
  bgGrad.addColorStop(1, 'rgba(15, 0, 4, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(bx, by, bannerW, bannerH);

  // 2. Frisos de Neon Vermelho Carmesim Superior e Inferior
  const borderGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  borderGrad.addColorStop(0, 'rgba(255, 23, 68, 0)');
  borderGrad.addColorStop(0.2, 'rgba(255, 23, 68, 0.95)');
  borderGrad.addColorStop(0.5, 'rgba(255, 107, 129, 1)');
  borderGrad.addColorStop(0.8, 'rgba(255, 23, 68, 0.95)');
  borderGrad.addColorStop(1, 'rgba(255, 23, 68, 0)');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isVertical ? 2.0 : 2.6;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bannerW, by);
  ctx.moveTo(bx, by + bannerH);
  ctx.lineTo(bx + bannerW, by + bannerH);
  ctx.stroke();

  // Frisos internos finos
  ctx.strokeStyle = 'rgba(255, 150, 160, 0.35)';
  ctx.lineWidth = 1;
  const padX = isVertical ? 24 : 45;
  ctx.beginPath();
  ctx.moveTo(bx + padX, by + 3);
  ctx.lineTo(bx + bannerW - padX, by + 3);
  ctx.moveTo(bx + padX, by + bannerH - 3);
  ctx.lineTo(bx + bannerW - padX, by + bannerH - 3);
  ctx.stroke();

  // 3. Cantoneiras Geométricas Rubras
  const cornerSize = isVertical ? 10 : 16;
  ctx.fillStyle = '#ff1744';
  ctx.fillRect(bx + padX * 0.7, by - 1.5, cornerSize, 3);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by - 1.5, cornerSize, 3);
  ctx.fillStyle = '#b71540';
  ctx.fillRect(bx + padX * 0.7, by + bannerH - 1.5, cornerSize, 3);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by + bannerH - 1.5, cornerSize, 3);

  // 4. Textos do Banner
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const pulseGlow = 12 + Math.sin(frameCount * 0.14) * 6;

  if (isVertical) {
    // --- LAYOUT PARA TELAS VERTICAIS (Compacto & Legível) ---
    // Tag Superior
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#ff6b81';
    ctx.shadowColor = 'rgba(255, 23, 68, 0.85)';
    ctx.shadowBlur = 6;
    ctx.fillText("[ ALERTA DE CATACLISMA ]", screenW / 2, by + 13);

    // Título Central
    ctx.font = 'bold 17px "Cinzel", "Cinzel Decorative", Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 23, 68, 0.95)';
    ctx.shadowBlur = pulseGlow;
    ctx.fillText("❖ SOBERANO DO ABISMO ❖", screenW / 2, by + 31);

    // Subtítulo
    ctx.font = 'italic 10px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#ffd1d1';
    ctx.shadowColor = 'rgba(183, 21, 64, 0.7)';
    ctx.shadowBlur = 3;
    ctx.fillText("✦ SENHOR DO VÁZIO PRIMORDIAL ✦", screenW / 2, by + 46);
  } else {
    // --- LAYOUT PARA TELAS HORIZONTAIS (Majestoso & Completo) ---
    // Tag Superior
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ff4d4d';
    ctx.shadowColor = 'rgba(255, 23, 68, 0.85)';
    ctx.shadowBlur = 8;
    ctx.fillText("[ ALERTA DE CATACLISMA // AMEAÇA EXISTENCIAL ]", screenW / 2, by + 20);

    // Título Central
    ctx.font = 'bold 28px "Cinzel", "Cinzel Decorative", Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 23, 68, 0.95)';
    ctx.shadowBlur = pulseGlow;
    ctx.fillText("❖ SOBERANO DO ABISMO ❖", screenW / 2, by + 48);

    // Subtítulo
    ctx.font = 'italic 12px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#ffd1d1';
    ctx.shadowColor = 'rgba(183, 21, 64, 0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText("✦ O DEVORADOR DAS ERAS E SENHOR DO VÁZIO PRIMORDIAL ✦", screenW / 2, by + 74);
  }

  ctx.restore();
}

/**
 * Renderiza as Asas Celestiais de Plasma da Singularidade na Fase 3.
 */
function drawSingularityPlasmaWings(ctx, e, R, frameCount, edgeCol, isStaggered) {
  ctx.save();
  const wingPairs = 2;
  const wingBreath = Math.sin(frameCount * 0.08) * 8;

  for (let side = -1; side <= 1; side += 2) {
    for (let w = 0; w < wingPairs; w++) {
      const wingLen = (R * (1.75 + w * 0.45)) + wingBreath;
      const wingAng = (w === 0 ? -0.38 : -0.72) + Math.sin(frameCount * 0.06 + w) * 0.08;

      ctx.save();
      ctx.scale(side, 1);

      // Pena/Feixe de plasma principal
      const rootX = R * 0.35;
      const rootY = -R * 0.15;
      const tipX = rootX + Math.cos(wingAng) * wingLen;
      const tipY = rootY + Math.sin(wingAng) * wingLen;
      const cpX = rootX + Math.cos(wingAng + 0.3) * (wingLen * 0.55);
      const cpY = rootY + Math.sin(wingAng + 0.3) * (wingLen * 0.55);

      // Gradiente de plasma
      const wingGrad = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
      wingGrad.addColorStop(0, 'rgba(215, 200, 255, 0.75)');
      wingGrad.addColorStop(0.5, 'rgba(180, 160, 255, 0.45)');
      wingGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.85)');
      wingGrad.addColorStop(1, 'rgba(215, 200, 255, 0)');

      ctx.strokeStyle = wingGrad;
      ctx.lineWidth = 4.5 - w * 1.2;
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
      ctx.stroke();

      // Feixe central superaquecido
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Renderiza o cluster de espinhos cristalinos negros apontando para baixo na base da esfera (Fiel à Referência).
 */
function drawDownwardCrystallineSpikes(ctx, e, R, frameCount) {
  ctx.save();
  // 4 agulhas cristalinas voltadas para baixo na base do orbe, emoldurando o tentáculo inferior
  const spikeDefs = [
    { x: -R * 0.40, y: R * 0.70, len: 32, ang: 0.02, w: 6.5 },
    { x: -R * 0.16, y: R * 0.80, len: 48, ang: 0.00, w: 8.5 },
    { x:  R * 0.16, y: R * 0.80, len: 48, ang: 0.00, w: 8.5 },
    { x:  R * 0.40, y: R * 0.70, len: 32, ang: -0.02, w: 6.5 }
  ];

  for (let i = 0; i < spikeDefs.length; i++) {
    const sp = spikeDefs[i];
    const tipX = sp.x + Math.sin(sp.ang) * sp.len;
    const tipY = sp.y + Math.cos(sp.ang) * sp.len;
    const perpX = Math.cos(sp.ang) * (sp.w * 0.5);
    const perpY = -Math.sin(sp.ang) * (sp.w * 0.5);

    // Corpo metálico grafite/obsidiana
    const spGrad = ctx.createLinearGradient(sp.x, sp.y, tipX, tipY);
    spGrad.addColorStop(0, '#1a1824');
    spGrad.addColorStop(0.5, '#0b0814');
    spGrad.addColorStop(1, '#05020a');
    ctx.fillStyle = spGrad;
    ctx.beginPath();
    ctx.moveTo(sp.x - perpX, sp.y - perpY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(sp.x + perpX, sp.y + perpY);
    ctx.closePath();
    ctx.fill();

    // Contorno iluminado prata-ciano
    ctx.strokeStyle = '#e0f7fa';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Aresta central de reflexo
    ctx.strokeStyle = 'rgba(129, 236, 236, 0.75)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renderiza os 9 Tentáculos Articulados com Juntas de Nodos (Bead-Joints) e Física de Inércia (Fiel à Referência).
 */
function drawCelestialLimbs(ctx, e, R, frameCount, isStaggered, isWindup, isCasting) {
  // Configuração dos 9 tentáculos na silhueta icônica da imagem de referência
  const limbConfigs = [
    // 0: Superior vertical (aponta para cima)
    { baseAng: -Math.PI * 0.50, segs: [ { len: 18, ang: -0.04 }, { len: 16, ang: 0.08 }, { len: 15, ang: -0.10 }, { len: 14, ang: 0.12 } ] },
    // 1: Superior Direito
    { baseAng: -Math.PI * 0.22, segs: [ { len: 18, ang: 0.08 }, { len: 16, ang: -0.05 }, { len: 15, ang: 0.12 }, { len: 14, ang: -0.15 } ] },
    // 2: Médio Direito Horizontal
    { baseAng: -0.08, segs: [ { len: 19, ang: 0.05 }, { len: 17, ang: 0.12 }, { len: 15, ang: -0.10 }, { len: 14, ang: 0.18 } ] },
    // 3: Inferior Direito
    { baseAng: Math.PI * 0.16, segs: [ { len: 18, ang: 0.08 }, { len: 16, ang: -0.05 }, { len: 15, ang: 0.14 }, { len: 14, ang: -0.20 } ] },
    // 4: Inferior-Direita baixo
    { baseAng: Math.PI * 0.36, segs: [ { len: 18, ang: 0.05 }, { len: 16, ang: 0.12 }, { len: 15, ang: -0.08 }, { len: 14, ang: 0.16 } ] },
    // 5: Inferior Vertical Central (desce reto entre os espinhos cristalinos)
    { baseAng: Math.PI * 0.50, segs: [ { len: 20, ang: 0.00 }, { len: 18, ang: 0.02 }, { len: 16, ang: -0.02 }, { len: 15, ang: 0.00 } ] },
    // 6: Inferior-Esquerda baixo
    { baseAng: Math.PI * 0.64, segs: [ { len: 18, ang: -0.05 }, { len: 16, ang: -0.12 }, { len: 15, ang: 0.08 }, { len: 14, ang: -0.16 } ] },
    // 7: Médio Esquerdo Horizontal
    { baseAng: Math.PI * 0.98, segs: [ { len: 19, ang: -0.05 }, { len: 17, ang: -0.10 }, { len: 15, ang: 0.12 }, { len: 14, ang: -0.18 } ] },
    // 8: Superior Esquerdo
    { baseAng: -Math.PI * 0.78, segs: [ { len: 18, ang: -0.08 }, { len: 16, ang: 0.05 }, { len: 15, ang: -0.12 }, { len: 14, ang: 0.15 } ] }
  ];

  ctx.save();
  const time = frameCount * 0.04;
  const isIdle = e.actionState === SOVEREIGN_STATES.IDLE;
  const waveAmp = isIdle ? 0.025 : (isStaggered ? 0.02 : (isWindup ? 0.14 : 0.06));

  for (let l = 0; l < limbConfigs.length; l++) {
    const limb = limbConfigs[l];
    // Ponto de ancoragem na borda externa do anel
    let currX = Math.cos(limb.baseAng) * (R * 1.05);
    let currY = Math.sin(limb.baseAng) * (R * 1.05);
    let accumAng = limb.baseAng;

    const physLimb = e.tentaclePhysics && e.tentaclePhysics[l];

    for (let s = 0; s < limb.segs.length; s++) {
      const seg = limb.segs[s];
      // Ondulação orgânica sutil de respiração
      const wave = Math.sin(time + l * 0.8 + s * 0.6) * waveAmp;
      // Inércia física dinamicamente simulada pelo sistema spring-damper
      const inOffset = (physLimb && physLimb[s]) ? physLimb[s].angleOffset : 0;
      accumAng += seg.ang + inOffset + wave;

      const nextX = currX + Math.cos(accumAng) * seg.len;
      const nextY = currY + Math.sin(accumAng) * seg.len;

      // 1. Haste do Segmento (Osso/Placa Metálica)
      const segWidth = Math.max(2.8, 6.2 - s * 0.9);

      ctx.strokeStyle = '#dcdde1';
      ctx.lineWidth = segWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(currX, currY);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      // Friso interno escuro da junta
      ctx.strokeStyle = '#2f3640';
      ctx.lineWidth = Math.max(1.0, segWidth * 0.32);
      ctx.beginPath();
      ctx.moveTo(currX + (nextX - currX) * 0.15, currY + (nextY - currY) * 0.15);
      ctx.lineTo(currX + (nextX - currX) * 0.85, currY + (nextY - currY) * 0.85);
      ctx.stroke();

      // 2. Nó/Junta Circular de Contas (Torus Bead-Joint da Referência)
      const beadR = Math.max(3.2, 5.8 - s * 0.7);

      // Glow azul-gelo sutil ao redor de cada conta
      ctx.shadowColor = 'rgba(129, 236, 236, 0.65)';
      ctx.shadowBlur = 5;

      // Aro externo brilhante da conta
      ctx.fillStyle = '#0a0614';
      ctx.beginPath();
      ctx.arc(currX, currY, beadR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f5f6fa';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Centro da conta (pino prateado)
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(168, 245, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(currX, currY, beadR * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // 3. Ponta Afilada de Agulha no último segmento
      if (s === limb.segs.length - 1) {
        // Ponta final suavemente curvada
        const tipAng = accumAng + 0.10;
        const tipLen = 12;
        const finalX = nextX + Math.cos(tipAng) * tipLen;
        const finalY = nextY + Math.sin(tipAng) * tipLen;

        ctx.strokeStyle = '#f5f6fa';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(nextX, nextY);
        ctx.lineTo(finalX, finalY);
        ctx.stroke();

        // Ponto luminoso ciano na ponta do membro
        ctx.shadowColor = '#00cec9';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#81ecec';
        ctx.beginPath();
        ctx.arc(finalX, finalY, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      currX = nextX;
      currY = nextY;
    }
  }

  ctx.restore();
}

/**
 * Renderiza a Esfera de Vácuo Central Envolta pelo Anel Translúcido Ciano com Arcos Góticos (Fiel à Referência).
 */
function drawSacredMandalaVoidSphere(ctx, e, R, frameCount, isHit, isStaggered, phase) {
  ctx.save();

  // 1. ANEL/DOMO TRANSLÚCIDO CIANO BRILHANTE (A Halo de Vidro Celeste da Referência)
  const haloR = R * 1.38;
  const haloGrad = ctx.createRadialGradient(0, 0, R * 0.85, 0, 0, haloR);
  haloGrad.addColorStop(0, 'rgba(129, 236, 236, 0.12)');
  haloGrad.addColorStop(0.65, 'rgba(168, 245, 255, 0.32)');
  haloGrad.addColorStop(0.92, 'rgba(200, 245, 255, 0.55)');
  haloGrad.addColorStop(1, 'rgba(225, 250, 255, 0.80)');

  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Borda luminosa branca-ciano reluzente do domo externo
  ctx.shadowColor = '#81ecec';
  ctx.shadowBlur = isStaggered ? 6 : 14;
  ctx.strokeStyle = isStaggered ? '#f1c40f' : '#c7f9ff';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 2. FILIGRANAS DE ARCOS GÓTICOS ENTRELAÇADOS NO INTERIOR DO ANEL CIANO
  if (!isHit) {
    ctx.strokeStyle = 'rgba(215, 245, 255, 0.42)';
    ctx.lineWidth = 1.0;

    // Círculo concêntrico intermediário fino
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.18, 0, Math.PI * 2);
    ctx.stroke();

    // 16 Arcos Góticos / Abóbada Celeste da Referência
    const archCount = 16;
    for (let a = 0; a < archCount; a++) {
      const a1 = (a * Math.PI * 2) / archCount;
      const a2 = ((a + 1) * Math.PI * 2) / archCount;
      const midA = (a1 + a2) * 0.5;

      const p1X = Math.cos(a1) * (R * 1.34);
      const p1Y = Math.sin(a1) * (R * 1.34);
      const p2X = Math.cos(a2) * (R * 1.34);
      const p2Y = Math.sin(a2) * (R * 1.34);
      const cpX = Math.cos(midA) * (R * 0.98);
      const cpY = Math.sin(midA) * (R * 0.98);

      ctx.beginPath();
      ctx.moveTo(p1X, p1Y);
      ctx.quadraticCurveTo(cpX, cpY, p2X, p2Y);
      ctx.stroke();
    }
  }

  // 3. ESFERA DE VÁCUO CENTRAL OBSIDIANA (O Núcleo Escuro)
  const coreGrad = ctx.createRadialGradient(0, 0, R * 0.15, 0, 0, R * 0.96);
  coreGrad.addColorStop(0, '#05020c');
  coreGrad.addColorStop(0.65, '#0b0617');
  coreGrad.addColorStop(1, '#150c26');

  ctx.fillStyle = isHit ? '#ffffff' : coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.96, 0, Math.PI * 2);
  ctx.fill();

  // Borda sutil de delimitação do núcleo escuro
  ctx.strokeStyle = 'rgba(168, 245, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.96, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renderiza o Olho Observador Prateado Horizontal com Fenda Vertical (Fiel à Referência).
 */
function drawColdObserverEye(ctx, e, R, frameCount, isStaggered, isWindup, isCasting, phase) {
  ctx.save();

  const isIdle = e.actionState === SOVEREIGN_STATES.IDLE;
  const coreScale = isStaggered ? 0.85 : (isIdle ? 1.0 : (1.0 + (e.corePulse || 0) * 0.08));
  const breath = Math.sin(frameCount * 0.08) * 0.8;

  const eyeW = 22 * coreScale + breath;
  const eyeH = 11.5 * coreScale + breath * 0.4;

  // 1. Moldura Externa Metálica Esbranquiçada / Grafite
  ctx.shadowColor = 'rgba(168, 245, 255, 0.45)';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = '#2f3640';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.ellipse(0, 0, eyeW + 2.5, eyeH + 2.0, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#718093';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, eyeW + 1.2, eyeH + 1.0, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Interior do Olho: Íris Elíptica Cinza Metálico / Grafite Polido (Fiel à Referência)
  const irisGrad = ctx.createRadialGradient(0, -2, 1, 0, 0, eyeW);
  irisGrad.addColorStop(0, '#57606f');
  irisGrad.addColorStop(0.45, '#3d434d');
  irisGrad.addColorStop(0.85, '#22252c');
  irisGrad.addColorStop(1, '#111216');

  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  // Olho em formato elíptico horizontal
  ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Reflexo Especular Superior Branco (Crescent Glint da Referência)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -1, eyeW * 0.72, -Math.PI * 0.82, -Math.PI * 0.18);
  ctx.stroke();

  // 4. Pupila em Fenda Vertical Negra Pura (Razor Slit Pupil)
  const pupilW = isStaggered ? 4.2 : (isWindup ? 1.4 : (isCasting ? 3.2 : 2.2));
  const pupilH = eyeH * 0.95;

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(0, 0, pupilW, pupilH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Micro reflexo de luz pontual frio
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-1.5, -2, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Renderiza todos os efeitos visuais de ataques que estão na fase ativa (CASTING/STRIKE),
 * garantindo que golpes como Corte Dimensional, Chuva Astral, Implosão e Supernova sejam visíveis na tela.
 */
function drawActiveSovereignAttacks(ctx, e, frameCount) {
  if (!e.activeAttacks || e.activeAttacks.length === 0) return;

  ctx.save();

  for (let i = 0; i < e.activeAttacks.length; i++) {
    const atk = e.activeAttacks[i];
    const progress = Math.max(0, Math.min(1, 1 - (atk.timer / (atk.maxTimer || 1))));

    if (atk.type === 'DIMENSIONAL_SLASH') {
      // Renderiza as lâminas de rasgo dimensional no espaço cortando a tela
      const cuts = atk.cuts || [];
      const alpha = Math.max(0, 1 - progress);

      for (let c = 0; c < cuts.length; c++) {
        const cut = cuts[c];
        const cosA = Math.cos(cut.angle);
        const sinA = Math.sin(cut.angle);
        const halfL = cut.length * 0.5;

        // Fissura de plasma brilhante
        ctx.save();
        ctx.strokeStyle = `rgba(0, 206, 201, ${alpha * 0.85})`;
        ctx.lineWidth = 14 * (1 - progress * 0.6);
        ctx.beginPath();
        ctx.moveTo(cut.x - cosA * halfL, cut.y - sinA * halfL);
        ctx.lineTo(cut.x + cosA * halfL, cut.y + sinA * halfL);
        ctx.stroke();

        // Lâmina central branca incandescente
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(cut.x - cosA * halfL, cut.y - sinA * halfL);
        ctx.lineTo(cut.x + cosA * halfL, cut.y + sinA * halfL);
        ctx.stroke();

        // Fagilhas e fraturas laterais
        const sparkCount = 8;
        ctx.fillStyle = '#e84393';
        for (let s = 0; s < sparkCount; s++) {
          const st = (s / sparkCount) * 2 - 1;
          const sx = cut.x + cosA * (halfL * st);
          const sy = cut.y + sinA * (halfL * st);
          const perp = (s % 2 === 0 ? 1 : -1) * (12 * (1 - progress));
          ctx.fillRect(sx - sinA * perp - 2, sy + cosA * perp - 2, 4, 4);
        }

        ctx.restore();
      }
    } else if (atk.type === 'VOID_IMPLOSION_CORE') {
      // Renderiza a singularidade negra colapsando e devorando a luz
      const alpha = Math.max(0, 1 - progress);
      const curR = Math.max(4, (atk.radius || 180) * (1 - progress * 0.7));

      ctx.save();
      // Distorção gravitacional externa
      ctx.fillStyle = `rgba(142, 68, 173, ${alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(atk.x, atk.y, curR * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Esfera negra de vácuo puro
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(atk.x, atk.y, curR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(224, 86, 253, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Raios de atração gravitacional
      const rayCount = 8;
      ctx.strokeStyle = `rgba(0, 206, 201, ${alpha * 0.6})`;
      ctx.lineWidth = 1.5;
      for (let r = 0; r < rayCount; r++) {
        const ra = (r * Math.PI * 2) / rayCount + frameCount * 0.15;
        const rx1 = atk.x + Math.cos(ra) * curR;
        const ry1 = atk.y + Math.sin(ra) * curR;
        const rx2 = atk.x + Math.cos(ra) * (curR * 1.6);
        const ry2 = atk.y + Math.sin(ra) * (curR * 1.6);
        ctx.beginPath();
        ctx.moveTo(rx1, ry1);
        ctx.lineTo(rx2, ry2);
        ctx.stroke();
      }

      ctx.restore();
    } else if (atk.type === 'SUPERNOVA_FLASH') {
      // Clarão cósmico expansivo da Supernova
      const alpha = Math.max(0, 1 - progress);
      const flashR = (atk.maxR || 420) * progress;

      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(atk.x, atk.y, flashR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(232, 67, 147, ${alpha * 0.75})`;
      ctx.lineWidth = 6 * (1 - progress);
      ctx.beginPath();
      ctx.arc(atk.x, atk.y, flashR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    } else if (atk.type === 'FALLING_ASTRAL_METEOR') {
      // Lança astral caindo velozmente do cosmos em direção ao selo
      const curX = atk.startX + (atk.targetX - atk.startX) * progress;
      const curY = atk.startY + (atk.targetY - atk.startY) * progress;

      ctx.save();
      // Cauda do meteoro
      const trailGrad = ctx.createLinearGradient(atk.startX, atk.startY, curX, curY);
      trailGrad.addColorStop(0, 'rgba(232, 67, 147, 0)');
      trailGrad.addColorStop(0.7, 'rgba(0, 206, 201, 0.6)');
      trailGrad.addColorStop(1, '#ffffff');

      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(curX - (atk.targetX - atk.startX) * 0.35, curY - (atk.targetY - atk.startY) * 0.35);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      // Cabeça incandescente do meteoro
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(curX, curY, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  ctx.restore();
}

export function drawAbyssSovereign(ctx, e, frameCount) {
  // Neutraliza o espelhamento ctx.scale(e.facing, 1) vindo do enemiesRenderer.js
  // garantindo renderização matematicamente perfeita em coordenadas de mundo e ângulos reais
  ctx.scale(e.facing || 1, 1);

  if (e.actionState === SOVEREIGN_STATES.SPAWN_INTRO) {
    drawMajesticSpawnIntro(ctx, e, frameCount);
  } else {
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
    const relCenterX = e.arenaCenterX - e.x;
    const relCenterY = e.arenaCenterY - e.y;

    ctx.save();
    ctx.translate(relCenterX, relCenterY);

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

      const relX = orb.curX - e.x;
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
      const rayAng = e.beamAngle + (arm * (Math.PI * 2 / armCount));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(rayAng) * 1300, Math.sin(rayAng) * 1300);
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
      const rayAng = e.beamAngle + (arm * (Math.PI * 2 / armCount));
      const rx = Math.cos(rayAng) * 1300;
      const ry = Math.sin(rayAng) * 1300;

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

  // Telegrafia Adicional do Corte Dimensional a partir do Soberano
  if (isWindup && e.currentSkill === 'DIMENSIONAL_CLEAVE') {
    ctx.save();
    const isLocked = e.cleaveLocked;
    ctx.strokeStyle = isLocked ? '#ffffff' : 'rgba(0, 206, 201, 0.65)';
    ctx.lineWidth = isLocked ? 2.8 : 1.6;
    ctx.setLineDash(isLocked ? [12, 6] : [6, 6]);

    const cuts = e.phase === 3 ? 4 : 3;
    const baseAng = e.cleaveAngle || 0;
    for (let l = 0; l < cuts; l++) {
      const ang = baseAng + (l - (cuts - 1) / 2) * (Math.PI / cuts);
      ctx.beginPath();
      ctx.moveTo(-Math.cos(ang) * 900, -Math.sin(ang) * 900);
      ctx.lineTo(Math.cos(ang) * 900, Math.sin(ang) * 900);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 6. Colapso de Matéria Escura
  if (isWindup && e.currentSkill === 'SINGULARITY_IMPLOSION') {
    const relX = e.implosionX - e.x;
    const relY = e.implosionY - e.y;

    ctx.save();
    ctx.strokeStyle = e.implosionLocked ? 'rgba(224, 86, 253, 0.9)' : 'rgba(142, 68, 173, 0.8)';
    ctx.lineWidth = e.implosionLocked ? 3.5 : 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(relX, relY, Math.max(10, e.implosionRadius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = e.implosionLocked ? 'rgba(224, 86, 253, 0.25)' : 'rgba(142, 68, 173, 0.15)';
    ctx.beginPath();
    ctx.arc(relX, relY, Math.max(10, e.implosionRadius), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 7. Passo Interdimensional
  if (e.actionState === SOVEREIGN_STATES.WARP_AIM) {
    const relX = e.warpTargetX - e.x;
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

      const relX = a.x - e.x;
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

  // 9. Asas de Plasma Celestial (Exclusivo Fase 3 / Despertar da Singularidade)
  if (e.phase === 3) {
    drawSingularityPlasmaWings(ctx, e, R, frameCount, edgeCol, isStaggered);
  }

  // 10. Membros Articulados Brancos com Juntas e Olhos (Fiel à Referência)
  drawCelestialLimbs(ctx, e, R, frameCount, isStaggered, isWindup, isCasting);

  // 11. Espinhos Cristalinos apontando para baixo na base da esfera
  drawDownwardCrystallineSpikes(ctx, e, R, frameCount);

  // 12. Esfera de Vácuo Central com Contorno Branco e Mandala Sagrada
  drawSacredMandalaVoidSphere(ctx, e, R, frameCount, isHit, isStaggered, e.phase);

  // 13. Olho Observador Prateado Horizontal (Fiel à Referência)
  drawColdObserverEye(ctx, e, R, frameCount, isStaggered, isWindup, isCasting, e.phase);

  // 14. Efeitos Visuais Ativos de Ataques em Execução (Cortes, Meteoros, Implosões, Supernovas)
  drawActiveSovereignAttacks(ctx, e, frameCount);


  // Orbes e Constelações da Supernova da Entropia
  if (e.supernovaOrbs && e.supernovaOrbs.length > 0) {
    ctx.save();
    const orbCount = e.supernovaOrbs.length;
    const orbRot = frameCount * 0.03;
    const orbPts = [];
    for (let o = 0; o < orbCount; o++) {
      const oDef = e.supernovaOrbs[o];
      const oAng = oDef.baseAngle + orbRot;
      const ox = Math.cos(oAng) * oDef.dist;
      const oy = Math.sin(oAng) * oDef.dist;
      orbPts.push({ x: ox, y: oy });
    }

    // Linhas de constelação estelar
    ctx.strokeStyle = 'rgba(224, 86, 253, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let o = 0; o < orbCount; o++) {
      const p1 = orbPts[o];
      const p2 = orbPts[(o + 1) % orbCount];
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    // Linhas radiais ao núcleo do Soberano
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.25)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let o = 0; o < orbCount; o++) {
      ctx.moveTo(0, 0);
      ctx.lineTo(orbPts[o].x, orbPts[o].y);
    }
    ctx.stroke();

    // Orbes estelares individuais
    for (let o = 0; o < orbCount; o++) {
      const pt = orbPts[o];
      const oPulse = 5 + Math.sin(frameCount * 0.2 + o) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = (o % 2 === 0) ? '#00cec9' : '#e84393';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, oPulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

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

  // 18. Grande Banner Cinematográfico de Tela (Tema Vermelho, Duração Reduzida em 50% e Responsivo para Telas Verticais)
  if (e.titleTimer > 0) {
    drawCinematicScreenTitle(ctx, e, frameCount);
  }
}
