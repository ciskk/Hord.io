/**
 * src/entities/bosses/supremeReaper/constants.js
 * Estados da FSM, habilidades e configurações do Ceifador Supremo (Boss 3).
 */

export const REAPER_STATES = Object.freeze({
  SPAWN_INTRO: 'SPAWN_INTRO',
  CHASE: 'CHASE',
  WINDUP: 'WINDUP',
  BLINK_AIM: 'BLINK_AIM',
  VORTEX_HARVEST: 'VORTEX_HARVEST',
  RECOVERY: 'RECOVERY',
  ENRAGE_TRANSITION: 'ENRAGE_TRANSITION',
  POST_ATTACK_RECOVERY: 'POST_ATTACK_RECOVERY'
});

export const REAPER_SKILLS = Object.freeze({
  DOUBLE_CLEAVE: 'DOUBLE_CLEAVE',
  SOUL_SCYTHES: 'SOUL_SCYTHES',
  SOUL_TETHER: 'SOUL_TETHER',
  VORTEX_HARVEST: 'VORTEX_HARVEST',
  PHANTOM_BLINK: 'PHANTOM_BLINK'
});

export const REAPER_CONFIG = Object.freeze({
  // Introdução Cinemática e Banner
  INTRO_DURATION: 300, // 5.0 segundos a 60 FPS
  TITLE_DURATION: 180, // 3.0 segundos na tela

  // Lanternas Espirituais
  LANTERN_DIST: 110,
  LANTERN_DIST_Y_FACTOR: 0.48,
  LANTERN_RADIUS: 17,
  P1_LANTERN_COUNT: 3,
  P1_LANTERN_HP: 4000,
  P2_LANTERN_COUNT: 4,
  P2_LANTERN_HP: 4800,
  LANTERN_ANGULAR_SPEED: 0.026,

  // Vínculo de Almas (Soul Tether)
  TETHER_MAX_DIST: 310,
  TETHER_DURATION: 160,

  // Colapso Espiritual
  RECOVERY_DURATION: 360, // 6.0 segundos

  // Limiares de Fases
  ENRAGE_HP_RATIO: 0.45,
  PHASE3_HP_RATIO: 0.20,

  // Paleta de Cores Espectrais e de Trevas
  COLOR_VOID_BLACK: '#020509',
  COLOR_VOID_DEEP: '#061019',
  COLOR_VOID_ROBE: '#0a1a26',
  COLOR_SOUL_CYAN: '#00cec9',
  COLOR_SOUL_GLOW: '#81ecec',
  COLOR_SOUL_EMERALD: '#00b894',
  COLOR_BONE_WHITE: '#e6f2f2',
  COLOR_BONE_SHADE: '#1a333d',
  COLOR_ENRAGED: '#ff4757',
  COLOR_ENRAGED_GLOW: '#ff6b81',
  COLOR_ENRAGED_DARK: '#2c080d',
  COLOR_P3: '#ff4757',
  COLOR_RECOVERY: '#81ecec',
  COLOR_GOLD_TRIM: '#f1c40f'
});
