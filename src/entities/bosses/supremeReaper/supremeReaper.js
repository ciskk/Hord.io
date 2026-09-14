/**
 * src/entities/bosses/supremeReaper/supremeReaper.js
 * Ponto de entrada modular e orquestrador do Ceifador Supremo (Boss 3).
 */
export { REAPER_STATES, REAPER_SKILLS, REAPER_CONFIG } from './constants.js';
export { initSupremeReaper } from './init.js';
export { updateSupremeReaper, checkReaperPhases } from './fsm.js';
export { 
  drawSupremeReaper, 
  drawCinematicScreenTitle, 
  drawReaperSpawnIntro 
} from './render.js';
export { 
  cleanupReaperSubTargets, 
  spawnReaperLanterns, 
  updateReaperLanterns, 
  destroyLantern, 
  updateSoulTether, 
  scheduleDelayedAction, 
  updateDelayedActions 
} from './mechanics.js';
export { 
  selectReaperSkill, 
  executeReaperSkill 
} from './attacks.js';
