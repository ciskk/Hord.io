/**
 * src/entities/bosses/abyssSovereign/abyssSovereign.js
 * Ponto de entrada modular e orquestrador do Soberano do Abismo (Boss 4 / Chefe Final).
 */
export { SOVEREIGN_STATES, SOVEREIGN_CONFIG } from './constants.js';
export { initAbyssSovereign } from './init.js';
export { 
  updateAbyssSovereign, 
  triggerPhaseTransition, 
  triggerStabilityBreak 
} from './fsm.js';
export { drawAbyssSovereign } from './render.js';
export { 
  clampBossToArena, 
  cleanupRiftAnchors, 
  spawnRiftAnchors, 
  scheduleDelayedAction,
  updateSingularityPhysics 
} from './physics.js';
export { 
  prepareNextAttack, 
  startSkillCast, 
  spawnAbyssalHomingBarrage 
} from './attacks.js';
