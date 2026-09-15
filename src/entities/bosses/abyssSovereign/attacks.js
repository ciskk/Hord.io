/**
 * src/entities/bosses/abyssSovereign/attacks.js
 * Arsenal de combate, seleção de habilidades, windups e feixes estelares do Soberano do Abismo.
 */
import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { SOVEREIGN_STATES, SOVEREIGN_CONFIG } from './constants.js';
import { scheduleDelayedAction } from './physics.js';
import { 
  bullets, 
  enemyBullets, 
  bossShockwaves, 
  bossTelegraphs,
  canSpawnEnemyBullet 
} from '../../../main.js';

/**
 * Dispara uma sequência de fendas de vácuo perseguidoras (Bombardeio Abissal).
 * O primeiro nó mira sob os pés do jogador; os seguintes antecipam o vetor de movimento.
 */
export function spawnAbyssalHomingBarrage(boss, player) {
  const nodeCount = boss.phase === 3 ? 7 : (boss.phase === 2 ? 6 : 5);
  const interval = 9; // Intervalo de 9 frames entre cada fenda lançada

  for (let i = 0; i < nodeCount; i++) {
    scheduleDelayedAction(boss, i * interval, () => {
      if (boss.hp <= 0) return;

      const pvx = player.vx || 0;
      const pvy = player.vy || 0;
      const isMoving = Math.hypot(pvx, pvy) > 0.4;

      let targetX = player.x;
      let targetY = player.y;

      if (i > 0 && isMoving) {
        const lead = 8 + i * 2;
        targetX += pvx * lead;
        targetY += pvy * lead;

        // Desvios laterais em leque para punir movimentações em círculos fechados
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

export function prepareNextAttack(boss, context) {
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
      boss.beamRotSpeed = boss.phase === 3 ? 0.015 : 0.01375;
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
      const orbCount = 6; // Fixado em 6 vértices para formar um hexágono perfeito
      const hexTelegraphRadius = SOVEREIGN_CONFIG.SUPERNOVA_HEX_RADIUS; // Reduzido em 35% (179px)
      for (let o = 0; o < orbCount; o++) {
        boss.supernovaOrbs.push({
          baseAngle: (o * Math.PI * 2) / orbCount,
          dist: hexTelegraphRadius
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

export function startSkillCast(boss, context) {
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
      boss.castDuration = 28;
      playSfx('warp');
      playSfx('boss');
      context.triggerShake(18);
      triggerHaptic('heavy');

      const isPhase3 = boss.phase === 3;
      const baseAng = boss.cleaveAngle || 0;
      const angles = isPhase3 
        ? [baseAng, baseAng - 0.28, baseAng + 0.28] 
        : [baseAng];

      boss.activeAttacks.push({
        type: 'DIMENSIONAL_SLASH',
        angles: angles,
        length: 1500,
        width: isPhase3 ? 70 : 108,
        sideWidth: 46,
        damage: Math.round(boss.damage * 0.44),
        timer: 28,
        maxTimer: 28
      });
      break;
    }
    case 'COSMIC_SUPERNOVA': {
      boss.castDuration = 35;
      context.triggerShake(20);
      triggerHaptic('heavy');
      playSfx('boss');
      playSfx('singularity');

      // Onda calibrada com o raio reduzido do hexágono (179px, -35%)
      bossShockwaves.push({
        x: boss.x,
        y: boss.y,
        radius: 16,
        maxRadius: SOVEREIGN_CONFIG.SUPERNOVA_HEX_RADIUS,
        speed: 5.8,
        damage: Math.round(boss.damage * 0.40),
        hitPlayer: false,
        colorRgb: '224, 86, 253'
      });

      // Mira inteligente: feixe estelar primário apontado diretamente na posição do jogador
      const primaryAngle = Math.atan2(context.player.y - boss.y, context.player.x - boss.x);
      if (canSpawnEnemyBullet(true)) {
        enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(primaryAngle) * 6.8,
          vy: Math.sin(primaryAngle) * 6.8,
          radius: 8.0,
          damage: Math.round(boss.damage * 0.32),
          bulletType: 'COSMIC_BOLT',
          life: 130,
          isBossProjectile: true
        });
      }

      const beamCount = 6; // Alinhado aos 6 lados do hexágono
      for (let b = 1; b < beamCount; b++) {
        if (!canSpawnEnemyBullet(true)) break;
        const bAng = primaryAngle + (b * Math.PI * 2) / beamCount;
        enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(bAng) * 5.6,
          vy: Math.sin(bAng) * 5.6,
          radius: 6.0,
          damage: Math.round(boss.damage * 0.22),
          bulletType: 'COSMIC_BOLT',
          life: 120,
          isBossProjectile: true
        });
      }

      boss.activeAttacks.push({
        type: 'SUPERNOVA_FLASH',
        x: boss.x,
        y: boss.y,
        maxR: SOVEREIGN_CONFIG.SUPERNOVA_HEX_RADIUS,
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
