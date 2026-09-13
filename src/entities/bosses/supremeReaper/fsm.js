/**
 * src/entities/bosses/supremeReaper/fsm.js
 * Máquina de estados FSM, progressão de fases e ciclo de vida do Ceifador Supremo.
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { enemies } from '../../../main.js';
import { REAPER_STATES, REAPER_CONFIG } from './constants.js';
import { 
  updateReaperLanterns, 
  spawnReaperLanterns, 
  updateSoulTether, 
  updateDelayedActions 
} from './mechanics.js';
import { 
  selectReaperSkill, 
  executeReaperSkill 
} from './attacks.js';

/**
 * Verifica e aciona transições de fase com base no HP restante do Ceifador.
 * @param {Object} e Entidade do chefe.
 * @param {Object} context Contexto global injetado do loop.
 */
export function checkReaperPhases(e, context) {
  const hpRatio = e.hp / e.maxHp;

  if (hpRatio < REAPER_CONFIG.ENRAGE_HP_RATIO && !e.hasEnraged) {
    e.hasEnraged = true;
    e.isEnraged = true;
    e.speed *= 1.32;
    e.lanternAngularSpeed *= 1.5;
    e.actionState = REAPER_STATES.ENRAGE_TRANSITION;
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
    spawnReaperLanterns(e, REAPER_CONFIG.P2_LANTERN_COUNT, REAPER_CONFIG.P2_LANTERN_HP, enemies);
    return;
  }

  if (hpRatio < REAPER_CONFIG.PHASE3_HP_RATIO && !e.isPhase3) {
    e.isPhase3 = true;
    e.speed *= 1.20;
    e.lanternAngularSpeed *= 1.4;
    context.triggerShake(20);
    playSfx('boss');
    context.addDamageText(e.x, e.y, "DANÇA MACABRA!", true, '#ff4757');
  }
}

/**
 * Atualiza a IA, colisões, interpolações procedurais e padrões de ataque do Ceifador Supremo.
 * @param {Object} e Entidade do chefe.
 * @param {number} dt Delta time do frame.
 * @param {Object} context Contexto global injetado do loop.
 */
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

  // 1. Processamento de Ações Agendadas
  updateDelayedActions(e, dt);

  e.floatBob = Math.sin(frameCount * 0.065) * 8;
  e.floatY = e.floatBob;
  
  if (e.actionState !== REAPER_STATES.POST_ATTACK_RECOVERY && e.actionState !== REAPER_STATES.RECOVERY) {
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
  if (activeLanterns.length > 0 && e.actionState === REAPER_STATES.CHASE) {
    e.skillCooldown -= dt * (0.20 * activeLanterns.length);
  }

  updateReaperLanterns(e, dt, context);
  checkReaperPhases(e, context);
  updateSoulTether(e, dt, context);

  // MÁQUINA DE ESTADOS PRINCIPAL
  switch (e.actionState) {
    case REAPER_STATES.ENRAGE_TRANSITION: {
      e.actionTimer -= dt;
      e.wingTargetSpan = 1.35;
      e.scytheTargetAngle = 1.2 * e.facing;
      if (Math.floor(frameCount) % 3 === 0) triggerShake(3.5);
      if (e.actionTimer <= 0) {
        e.actionState = REAPER_STATES.CHASE;
        e.skillCooldown = 25;
      }
      return;
    }

    // Janela de Exaustão de 6.0 segundos após quebra de todas as lanternas
    case REAPER_STATES.RECOVERY: {
      e.recoveryTimer -= dt;
      e.isVulnerable = true;
      e.wingTargetSpan = 0.18;
      e.scytheTargetAngle = 0.9;

      if (Math.floor(frameCount) % 5 === 0) {
        createHitParticles(e.x + (Math.random() - 0.5) * e.radius, e.y + (Math.random() - 0.5) * e.radius, '#81ecec', 1);
      }

      if (e.recoveryTimer <= 0) {
        e.isVulnerable = false;
        e.actionState = REAPER_STATES.CHASE;
        e.skillCooldown = e.isEnraged ? 40 : 65;

        triggerShake(13);
        playSfx('boss');
        addDamageText(e.x, e.y, "RECONSTITUIÇÃO ESPIRITUAL!", true, '#00cec9');
      }
      return;
    }

    // Janela de Recuperação Pós-Ataque (70 frames: punição melee)
    case REAPER_STATES.POST_ATTACK_RECOVERY: {
      e.actionTimer -= dt;
      e.wingTargetSpan = 0.30;
      e.scytheTargetAngle = 0.8;

      if (Math.floor(frameCount) % 8 === 0) {
        createHitParticles(e.x + (Math.random() - 0.5) * e.radius, e.y + (Math.random() - 0.5) * e.radius, '#81ecec', 1);
      }
      if (e.actionTimer <= 0) {
        e.actionState = REAPER_STATES.CHASE;
        e.skillCooldown = e.isEnraged ? 40 : 60;
      }
      return;
    }

    case REAPER_STATES.BLINK_AIM: {
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
        e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
        e.actionTimer = 65;
      }
      return;
    }

    case REAPER_STATES.VORTEX_HARVEST: {
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

        e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
        e.actionTimer = 70;
      }
      return;
    }

    case REAPER_STATES.WINDUP: {
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

    case REAPER_STATES.CHASE:
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
