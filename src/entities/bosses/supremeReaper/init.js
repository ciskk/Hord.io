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
  // Estado inicial: Introdução Cinemática em 4 Atos
  boss.actionState = REAPER_STATES.SPAWN_INTRO;
  boss.actionTimer = 0;
  boss.currentSkill = null;
  boss.skillCooldown = 75;
  boss.aimAngle = 0;

  // Intro Cinemática de 5.0 segundos (300 frames a 60 FPS) e Banner
  boss.introDuration = REAPER_CONFIG.INTRO_DURATION || 300;
  boss.introTimer = boss.introDuration;
  boss.isTargetable = false;
  boss.titleTimer = 0;
  boss.titleMaxTimer = REAPER_CONFIG.TITLE_DURATION || 180;
  boss.hasTriggeredTitle = false;
  boss.hasRoared = false;
  boss.introAct = 1;

  boss.delayedActions = [];

  // Janelas de Vulnerabilidade e Colapso (6.0 segundos = 360 frames)
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;
  boss.collapseProgress = 0; // 0 = em pé, 1 = prostrado de joelhos
  boss.prevHp = boss.hp;

  // Lanternas Espirituais como Sub-Alvos Selecionáveis (Fase Normal: 4.000 HP)
  boss.lanterns = [];
  boss.lanternAngularSpeed = REAPER_CONFIG.LANTERN_ANGULAR_SPEED;
  spawnReaperLanterns(boss, REAPER_CONFIG.P1_LANTERN_COUNT, REAPER_CONFIG.P1_LANTERN_HP, enemies);
  boss.lanterns.forEach(l => { l.isTargetable = false; }); // Protegidas durante intro

  boss.hasEnraged = false;
  boss.isEnraged = false;
  boss.isPhase3 = false;

  boss.tetherActive = false;
  boss.tetherTimer = 0;
  boss.tetherMaxDist = REAPER_CONFIG.TETHER_MAX_DIST;
  boss.blinkTarget = null;
  boss.phantoms = [];

  // Parâmetros de Animação Procedural 2.5D e Expressividade
  boss.floatY = 0;
  boss.floatBob = 0;
  boss.tilt = 0;
  boss.tiltTarget = 0;
  boss.facing = 1;
  boss.wingSpan = 0.20;
  boss.wingTargetSpan = 0.20;
  boss.wingFlap = 0;
  boss.scytheAngle = 0.4;
  boss.scytheTargetAngle = 0.4;
  boss.scytheGlow = 0;
  boss.eyePulse = 0;
  boss.eyeTrails = [];
  boss.afterImages = [];
  boss.ghostTrail = [];
}
