/**
 * src/entities/bosses/abyssalMonolith/abyssalMonolith.js
 * Ponto de entrada modular e orquestrador de "Ignis Lithos, o Titã de Basalto" (Boss 2).
 */
export { MONOLITH_STATES, MONOLITH_SKILLS, MONOLITH_CONFIG } from './constants.js';
export { initAbyssalMonolith } from './init.js';
export { updateAbyssalMonolith } from './fsm.js';
export { drawAbyssalMonolith } from './render.js';
export { 
  cleanupMonolithSubTargets, 
  spawnLitocistos, 
  updateThermalVents, 
  updateLitocistos, 
  destroyLitocisto,
  scheduleDelayedAction,
  updateDelayedActions 
} from './mechanics.js';
export { 
  selectNextSkill, 
  executeTectonicSlam, 
  executeEpicenterEruption, 
  executeOuterSurge, 
  executePlateWhirl, 
  executeMagmaSiphonRelease, 
  executeVolcanicFissure, 
  executeBasaltBarrage 
} from './attacks.js';
