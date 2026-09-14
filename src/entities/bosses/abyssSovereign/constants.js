/**
 * src/entities/bosses/abyssSovereign/constants.js
 * Estados da FSM, paletas de cores e constantes geométricas do Soberano do Abismo.
 */

export const SOVEREIGN_STATES = Object.freeze({
  SPAWN_INTRO: 'SPAWN_INTRO',
  IDLE: 'IDLE',
  HOVER_CHASE: 'HOVER_CHASE',
  WINDUP: 'WINDUP',
  CASTING: 'CASTING',
  WARP_AIM: 'WARP_AIM',
  RECOVERY_STAGGER: 'RECOVERY_STAGGER',
  PHASE_TRANSITION: 'PHASE_TRANSITION',
  DEATH_COLLAPSE: 'DEATH_COLLAPSE'
});

export const SOVEREIGN_CONFIG = Object.freeze({
  ARENA_RADIUS_PHASE_1: 620,
  ARENA_RADIUS_PHASE_2: 520,
  ARENA_RADIUS_PHASE_3: 380,
  SUPERNOVA_HEX_RADIUS: 275,
  COLOR_PRIMARY_P1: '#8e44ad',
  COLOR_PRIMARY_P2: '#e84393',
  COLOR_PRIMARY_P3: '#00cec9',
  COLOR_GOLD_PRIMARY: '#f1c40f',
  COLOR_GOLD_ACCENT: '#f39c12',
  COLOR_GOLD_LIGHT: '#fff6a9'
});

