/**
 * src/entities/bosses/abyssSovereign.js
 * Fachada de compatibilidade para o módulo modularizado em ./abyssSovereign/abyssSovereign.js
 * Garante retrocompatibilidade para qualquer consumidor deste arquivo.
 */
export { 
  SOVEREIGN_STATES,
  SOVEREIGN_CONFIG,
  initAbyssSovereign,
  updateAbyssSovereign,
  drawAbyssSovereign,
  clampBossToArena,
  cleanupRiftAnchors,
  spawnRiftAnchors,
  scheduleDelayedAction,
  triggerPhaseTransition,
  triggerStabilityBreak,
  prepareNextAttack,
  startSkillCast
} from './abyssSovereign/abyssSovereign.js';
