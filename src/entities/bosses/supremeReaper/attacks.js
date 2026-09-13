/**
 * src/entities/bosses/supremeReaper/attacks.js
 * Arsenal de habilidades, seleção de skills e disparo de ataques do Ceifador Supremo.
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { REAPER_STATES, REAPER_SKILLS } from './constants.js';

/**
 * Seleciona a próxima habilidade com base na distância, posicionamento tático e fases de combate.
 * @param {Object} e Entidade do chefe.
 * @param {number} dist Distância euclidiana até o jogador.
 * @param {Object} player Entidade do jogador.
 */
export function selectReaperSkill(e, dist, player) {
  const isEnraged = e.isEnraged || e.isPhase3;
  const rand = Math.random();

  if (dist < 160) {
    e.currentSkill = REAPER_SKILLS.DOUBLE_CLEAVE;
    e.actionState = REAPER_STATES.WINDUP;
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

    e.currentSkill = REAPER_SKILLS.PHANTOM_BLINK;
    e.actionState = REAPER_STATES.BLINK_AIM;
    e.actionTimer = isEnraged ? 36 : 46;
  } else if (rand < 0.65) {
    e.currentSkill = REAPER_SKILLS.SOUL_SCYTHES;
    e.actionState = REAPER_STATES.WINDUP;
    e.actionTimer = isEnraged ? 26 : 34;
  } else if (!e.tetherActive && rand < 0.85) {
    e.currentSkill = REAPER_SKILLS.SOUL_TETHER;
    e.actionState = REAPER_STATES.WINDUP;
    e.actionTimer = 24;
  } else {
    e.currentSkill = REAPER_SKILLS.VORTEX_HARVEST;
    e.actionState = REAPER_STATES.WINDUP;
    e.actionTimer = isEnraged ? 24 : 32;
  }
}

/**
 * Executa a habilidade preparada pelo Ceifador Supremo ao concluir o Windup.
 * @param {Object} e Entidade do chefe.
 * @param {Object} context Contexto global injetado do loop.
 */
export function executeReaperSkill(e, context) {
  const {
    player,
    bossTelegraphs,
    bossProjectiles,
    triggerShake,
    addDamageText
  } = context;

  const angleToPlayer = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);

  switch (e.currentSkill) {
    case REAPER_SKILLS.DOUBLE_CLEAVE: {
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

      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 75;
      break;
    }

    case REAPER_SKILLS.SOUL_SCYTHES: {
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

      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 60;
      break;
    }

    case REAPER_SKILLS.SOUL_TETHER: {
      playSfx('boss');
      e.tetherActive = true;
      e.tetherTimer = 160;
      e.actionState = REAPER_STATES.CHASE;
      e.skillCooldown = 80;
      addDamageText(player.x, player.y, "VÍNCULO DE ALMAS!", true, '#00cec9');
      break;
    }

    case REAPER_SKILLS.VORTEX_HARVEST: {
      playSfx('boss');
      triggerShake(8);
      e.actionState = REAPER_STATES.VORTEX_HARVEST;
      e.actionTimer = e.isEnraged ? 75 : 95;
      break;
    }

    default: {
      e.actionState = REAPER_STATES.CHASE;
      e.skillCooldown = 60;
      break;
    }
  }
}
