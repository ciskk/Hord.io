/**
 * src/entities/bosses/abyssalMonolith/init.js
 * Inicialização e configuração de atributos de "Ignis Lithos, o Titã de Basalto" (Boss 2).
 */

import { enemies } from '../../../main.js';
import { MONOLITH_STATES, MONOLITH_CONFIG } from './constants.js';
import { spawnLitocistos } from './mechanics.js';

/**
 * Inicializa propriedades exclusivas, flags mecânicas, sub-alvos e parâmetros visuais de Ignis Lithos.
 * @param {Object} boss Entidade do chefe recém-instanciada.
 */
export function initAbyssalMonolith(boss) {
  // Máquina de estados principal
  boss.actionState = MONOLITH_STATES.SPAWN_INTRO;
  boss.actionTimer = 0;
  boss.currentSkill = null;
  boss.lastUsedSkill = null;
  boss.skillCooldown = 50;

  // Intro Cinematográfica de 5 segundos (300 frames a 60 FPS)
  boss.introDuration = MONOLITH_CONFIG.INTRO_DURATION || 300;
  boss.introTimer = boss.introDuration;
  boss.isTargetable = false;
  boss.titleTimer = 0;
  boss.titleMaxTimer = MONOLITH_CONFIG.TITLE_DURATION || 180;
  boss.hasTriggeredTitle = false;
  boss.hasRoared = false;

  // Punhos / Manoplas Megalíticas Flutuantes do Titã
  boss.gauntlets = {
    left: { x: -64, y: 10, lift: 0, rot: 0.15 },
    right: { x: 64, y: 10, lift: 0, rot: -0.15 }
  };

  // Velocidade Dinâmica Calibrada (Colosso Ativo)
  boss.speed = MONOLITH_CONFIG.BASE_SPEED;
  boss.baseCombatSpeed = MONOLITH_CONFIG.BASE_SPEED;

  // Mira e Controle de Esmagamento Frontal
  boss.aimAngle = 0;
  boss.aimLocked = false;
  boss.slamArc = MONOLITH_CONFIG.SLAM_ARC; // ~135° frontal (costas 100% seguras)
  boss.slamRadius = MONOLITH_CONFIG.SLAM_RADIUS;

  // Fila de Ações Agendadas
  boss.delayedActions = [];

  // Janelas de Vulnerabilidade e Colapso (4.5 segundos = 270 frames)
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;
  boss.prevHp = boss.hp;

  // Litocistos Tectônicos (Fase 1: 3 orbes com 2.800 HP)
  boss.orbitals = [];
  boss.orbitalAngularVelocity = MONOLITH_CONFIG.ORBITAL_ANGULAR_VELOCITY;
  spawnLitocistos(boss, MONOLITH_CONFIG.P1_ORBITAL_COUNT, MONOLITH_CONFIG.P1_ORBITAL_HP, enemies);
  boss.orbitals.forEach(o => { o.isTargetable = false; });

  // Fontes Termais no Solo
  boss.thermalVents = [];

  // Placas Tectônicas Articuladas
  boss.floatingPlates = [
    { angleOffset: 0.78, dist: 84, baseDist: 84, size: 26, wobblePhase: 0 },
    { angleOffset: 2.35, dist: 84, baseDist: 84, size: 24, wobblePhase: 1.5 },
    { angleOffset: 3.92, dist: 84, baseDist: 84, size: 27, wobblePhase: 3.0 },
    { angleOffset: 5.49, dist: 84, baseDist: 84, size: 24, wobblePhase: 4.5 }
  ];

  // Controle de Fases e Fúria
  boss.phase = 1;
  boss.hasTransitionedP2 = false;
  boss.isPhase3 = false;
  boss.isEnraged = false;

  // Temporizadores do Vórtice
  boss.pullTimer = 0;
  boss.pullMaxTimer = 0;

  // Animações Procedurais e Postura
  boss.floatBob = 0;
  boss.magmaPulse = 0;
  boss.heatIntensity = 0.3;
  boss.facing = 1;
}
