/**
 * src/entities/bosses/supremeReaper.js
 * Fachada de compatibilidade para o módulo modularizado em ./supremeReaper/supremeReaper.js
 * Garante retrocompatibilidade total com bossRegistry.js e outros consumidores.
 */
export { 
  initSupremeReaper, 
  updateSupremeReaper, 
  drawSupremeReaper,
  checkReaperPhases,
  REAPER_STATES,
  REAPER_SKILLS,
  REAPER_CONFIG,
  cleanupReaperSubTargets,
  spawnReaperLanterns,
  updateReaperLanterns,
  destroyLantern,
  updateSoulTether,
  scheduleDelayedAction,
  updateDelayedActions,
  selectReaperSkill,
  executeReaperSkill
} from './supremeReaper/supremeReaper.js';