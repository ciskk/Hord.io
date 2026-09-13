/**
 * src/entities/bosses/vampireLord/init.js
 * Inicialização e configuração de propriedades do Lorde Vampírico (Boss 1).
 */
import { VAMPIRE_STATES } from './constants.js';

/**
 * Inicializa propriedades exclusivas, flags mecânicas e parâmetros visuais do Lorde Vampírico.
 * @param {Object} boss 
 */
export function initVampireLord(boss) {
  // Máquina de estados principal:
  // 'CHASE', 'WINDUP', 'RECOVERY', 'ENRAGE_TRANSITION', 'CHANNELING_SPIRAL', 'MIST_DASH', 'MIST_DASH_PAUSE', 'MIST_BRAKE', 'TELEPORTING'
  boss.actionState = 'CHASE';
  boss.actionTimer = 0;
  boss.currentSkill = null; // 'CLEAVE', 'SWARM', 'MIST_DASH', 'TELEPORT', 'BLOOD_BURST', 'SPIRAL_BARRAGE', 'PINCER_SHOT'
  boss.skillCooldown = 70;
  boss.aimAngle = 0;
  boss.isWingPrepping = false;

  // Janelas de vulnerabilidade e recuperação
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;

  // Estados de investida em névoa
  boss.mistState = 'IDLE'; // 'IDLE' ou 'DASHING'
  boss.mistDuration = 0;
  boss.mistAngle = 0;
  boss.mistDashesLeft = 0;

  // Teleporte predatório e dreno
  boss.isTeleporting = false;
  boss.teleportTarget = { x: 0, y: 0 };
  boss.teleportResolveTimer = 0;

  // Estados de canalização do disparo em espiral
  boss.spiralTimer = 0;
  boss.spiralWavesLeft = 0;
  boss.spiralAngle = 0;

  // Controle de fase e fúria
  boss.hasEnraged = false;
  boss.isEnraged = false;

  // Micro-animações e postura procedural
  boss.floatBob = 0;
  boss.wingSpread = 1.0;
  boss.facing = 1;

  // Mecânica de Repulsão Melee
  boss.meleeContactTimer = 0;
  boss.repulsionCooldown = 0;
}
