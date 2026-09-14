/**
 * src/entities/bosses/vampireLord/constants.js
 * Estados da FSM, habilidades e paletas visuais do Lorde Vampírico (Boss 1).
 */

export const VAMPIRE_STATES = Object.freeze({
  SPAWN_INTRO: 'SPAWN_INTRO',
  CHASE: 'CHASE',
  WINDUP: 'WINDUP',
  RECOVERY: 'RECOVERY',
  ENRAGE_TRANSITION: 'ENRAGE_TRANSITION',
  CHANNELING_SPIRAL: 'CHANNELING_SPIRAL',
  MIST_DASH: 'MIST_DASH',
  MIST_DASH_PAUSE: 'MIST_DASH_PAUSE',
  MIST_BRAKE: 'MIST_BRAKE',
  TELEPORTING: 'TELEPORTING'
});

export const VAMPIRE_SKILLS = Object.freeze({
  CLEAVE: 'CLEAVE',
  SWARM: 'SWARM',
  MIST_DASH: 'MIST_DASH',
  TELEPORT: 'TELEPORT',
  BLOOD_BURST: 'BLOOD_BURST',
  SPIRAL_BARRAGE: 'SPIRAL_BARRAGE',
  PINCER_SHOT: 'PINCER_SHOT',
  REPULSION: 'REPULSION'
});

export const VAMPIRE_PROJECTILES = Object.freeze({
  BAT: 'VAMPIRE_BAT',
  ORB: 'BLOOD_ORB',
  CLAW: 'BLOOD_CLAW',
  DAGGER: 'BLOOD_DAGGER'
});

export const VAMPIRE_CONFIG = Object.freeze({
  COLOR_NORMAL: '#8e44ad',
  COLOR_ENRAGED: '#e74c3c',
  COLOR_REPULSION: '#ff1744',
  ENRAGE_HP_RATIO: 0.45,
  INTRO_DURATION: 300, // 5 segundos a 60 FPS
  TITLE_DURATION: 180  // 3 segundos na tela
});
