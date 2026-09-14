/**
 * src/entities/bosses/vampireLord/init.js
 * Inicialização e configuração de propriedades do Lorde Vampírico (Boss 1).
 */
import { VAMPIRE_STATES, VAMPIRE_CONFIG } from './constants.js';

/**
 * Inicializa propriedades exclusivas, flags mecânicas e parâmetros visuais do Lorde Vampírico.
 * @param {Object} boss 
 */
export function initVampireLord(boss) {
  // Máquina de estados principal:
  // 'SPAWN_INTRO', 'CHASE', 'WINDUP', 'RECOVERY', 'ENRAGE_TRANSITION', 'CHANNELING_SPIRAL', 'MIST_DASH', 'MIST_DASH_PAUSE', 'MIST_BRAKE', 'TELEPORTING'
  boss.actionState = VAMPIRE_STATES.SPAWN_INTRO;
  boss.actionTimer = 0;
  boss.currentSkill = null; // 'CLEAVE', 'SWARM', 'MIST_DASH', 'TELEPORT', 'BLOOD_BURST', 'SPIRAL_BARRAGE', 'PINCER_SHOT'
  boss.skillCooldown = 70;
  boss.aimAngle = 0;
  boss.isWingPrepping = false;

  // Intro Cinematográfica de 5 segundos (300 frames a 60 FPS)
  boss.introDuration = VAMPIRE_CONFIG.INTRO_DURATION || 300;
  boss.introTimer = boss.introDuration;
  boss.isTargetable = false; // Bloqueia mira e auto-fire durante a animação de entrada
  boss.titleTimer = 0;
  boss.titleMaxTimer = VAMPIRE_CONFIG.TITLE_DURATION || 180;
  boss.hasTriggeredTitle = false;
  boss.hasRoared = false;
  boss.introBats = [];

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

  // Micro-animações e postura procedural avançada
  boss.floatBob = 0;
  boss.wingSpread = 1.0;
  boss.facing = 1;
  boss.afterImages = [];
  boss.eyeTrails = [];
  boss.cleaveProgress = 0;
  boss.isCleaving = false;
  boss.heartBeatTimer = 0;

  // Mecânica de Repulsão Melee
  boss.meleeContactTimer = 0;
  boss.repulsionCooldown = 0;
}

