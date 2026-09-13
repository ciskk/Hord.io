/**
 * src/entities/bosses/abyssalMonolith.js
 * Fachada de compatibilidade para o módulo modularizado em ./abyssalMonolith/abyssalMonolith.js
 * Garante retrocompatibilidade total com bossRegistry.js e outros consumidores.
 */
export { 
  initAbyssalMonolith, 
  updateAbyssalMonolith, 
  drawAbyssalMonolith,
  MONOLITH_STATES,
  MONOLITH_SKILLS,
  MONOLITH_CONFIG,
  cleanupMonolithSubTargets,
  spawnLitocistos,
  updateThermalVents,
  updateLitocistos,
  destroyLitocisto,
  scheduleDelayedAction,
  updateDelayedActions,
  selectNextSkill,
  executeTectonicSlam,
  executeEpicenterEruption,
  executeOuterSurge,
  executePlateWhirl,
  executeMagmaSiphonRelease,
  executeVolcanicFissure,
  executeBasaltBarrage
} from './abyssalMonolith/abyssalMonolith.js';