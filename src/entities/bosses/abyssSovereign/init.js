/**
 * src/entities/bosses/abyssSovereign/init.js
 * Inicialização e configuração do Soberano do Abismo (Boss 4 / Chefe Final).
 */
import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { SOVEREIGN_STATES } from './constants.js';
import { scheduleDelayedAction } from './physics.js';

export function initAbyssSovereign(boss) {
  boss.phase = 1;
  boss.hasTriggeredPhase2 = false;
  boss.hasTriggeredPhase3 = false;
  boss.actionState = SOVEREIGN_STATES.SPAWN_INTRO;
  boss.stateTimer = 0;
  boss.introDuration = 440; // Duração na tela (~7.33 segundos a 60 FPS)
  boss.introTimer = 440;
  boss.isTargetable = false; // Bloqueia mira e auto-fire durante a animação de entrada
  boss.titleTimer = 0; // Disparado de forma cinematográfica no Ato 3 da introdução
  boss.titleMaxTimer = 220;
  boss.hasTriggeredTitle = false;
  boss.transitionTimer = 0;
  boss.transitionWindup = 0;
  boss.transitionDetonated = false;

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

  if (!boss.damage || boss.damage < 225) {
    boss.damage = 225;
  }

  boss.idleTimer = 0;
  boss.idleDuration = 40; // Reduzido pela metade (80 -> 40 frames)
  boss.idleBlend = 0;
  boss.eyeAperture = 1.0;
  boss.eyeAnimState = 'OPEN';
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
