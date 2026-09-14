/**
 * src/entities/bosses/abyssalMonolith/constants.js
 * Estados da FSM, habilidades e configurações de "Ignis Lithos, o Titã de Basalto" (Boss 2).
 */

export const MONOLITH_STATES = Object.freeze({
  SPAWN_INTRO: 'SPAWN_INTRO',
  CHASE: 'CHASE',
  WINDUP_SLAM: 'WINDUP_SLAM',
  WINDUP_EPICENTER: 'WINDUP_EPICENTER',
  PROPAGATING_SURGE: 'PROPAGATING_SURGE',
  WINDUP_WHIRL: 'WINDUP_WHIRL',
  WINDUP_FISSURE: 'WINDUP_FISSURE',
  WINDUP_BARRAGE: 'WINDUP_BARRAGE',
  CHANNELING_SIPHON: 'CHANNELING_SIPHON',
  RECOVERY: 'RECOVERY',
  OVERHEAT_TRANSITION: 'OVERHEAT_TRANSITION',
  POST_ATTACK_RECOVERY: 'POST_ATTACK_RECOVERY'
});

export const MONOLITH_SKILLS = Object.freeze({
  TECTONIC_SLAM: 'TECTONIC_SLAM',
  EPICENTER_SURGE: 'EPICENTER_SURGE',
  PLATE_WHIRL: 'PLATE_WHIRL',
  MAGMA_SIPHON: 'MAGMA_SIPHON',
  VOLCANIC_FISSURE: 'VOLCANIC_FISSURE',
  BASALT_BARRAGE: 'BASALT_BARRAGE'
});

export const MONOLITH_CONFIG = Object.freeze({
  // Velocidades
  BASE_SPEED: 1.35,
  ENRAGED_SPEED: 1.70,
  PHASE3_SPEED: 2.05,

  // Litocistos (Orbes Orbitais)
  ORBITAL_DIST: 114,
  ORBITAL_RADIUS: 17,
  P1_ORBITAL_COUNT: 3,
  P1_ORBITAL_HP: 2800,
  P2_ORBITAL_COUNT: 4,
  P2_ORBITAL_HP: 3400,
  ORBITAL_ANGULAR_VELOCITY: 0.026,

  // Fontes Termais
  VENT_RADIUS: 32,
  VENT_LIFE: 660,
  VENT_HEAL: 25,
  VENT_IFRAMES: 24,

  // Geometria e Dimensões de Ataque
  SLAM_RADIUS: 185,
  SLAM_ARC: Math.PI * 0.38, // ~135° cone frontal
  EPICENTER_RADIUS: 115,
  OUTER_SURGE_MIN_RADIUS: 140,
  OUTER_SURGE_MAX_RADIUS: 245,
  WHIRL_RADIUS: 110,

  // Limiares de Transição de Fases
  P2_HP_RATIO: 0.60,
  P3_HP_RATIO: 0.25,

  // Duração de Colapso Sísmico (Stun de 4.5s = 270 frames)
  RECOVERY_DURATION: 270,

  // Cores Temáticas
  COLOR_NORMAL: '#e67e22',
  COLOR_ENRAGED: '#e74c3c',
  COLOR_PHASE3: '#ff1744',
  COLOR_RESTORED: '#3498db',
  COLOR_STUN: '#f1c40f',

  // Configurações da Introdução Cinemática de 5 segundos
  INTRO_DURATION: 300, // 5.0 segundos a 60 FPS
  TITLE_DURATION: 180  // 3.0 segundos de exibição na tela
});
