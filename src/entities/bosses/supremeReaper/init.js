/**
 * src/entities/bosses/supremeReaper/init.js
 * Inicialização e configuração de atributos do Ceifador Supremo (Boss 3).
 */

import { enemies } from '../../../main.js';
import { REAPER_STATES, REAPER_CONFIG } from './constants.js';
import { spawnReaperLanterns } from './mechanics.js';

/**
 * Inicializa propriedades exclusivas, flags mecânicas, sub-alvos e parâmetros visuais do Ceifador Supremo.
 * @param {Object} boss Entidade do chefe recém-instanciada.
 */
export function initSupremeReaper(boss) {
  boss.actionState = REAPER_STATES.CHASE;
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
  boss.lanternAngularSpeed = REAPER_CONFIG.LANTERN_ANGULAR_SPEED;
  spawnReaperLanterns(boss, REAPER_CONFIG.P1_LANTERN_COUNT, REAPER_CONFIG.P1_LANTERN_HP, enemies);

  boss.hasEnraged = false;
  boss.isEnraged = false;
  boss.isPhase3 = false;

  boss.tetherActive = false;
  boss.tetherTimer = 0;
  boss.tetherMaxDist = REAPER_CONFIG.TETHER_MAX_DIST;
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
