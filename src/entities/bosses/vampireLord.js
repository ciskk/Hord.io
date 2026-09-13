/**
 * src/entities/bosses/vampireLord.js
 * Fachada de compatibilidade para o módulo modularizado em ./vampireLord/vampireLord.js
 * Garante retrocompatibilidade total com bossRegistry.js e outros consumidores.
 */
export { 
  initVampireLord, 
  updateVampireLord, 
  drawVampireLord,
  VAMPIRE_STATES,
  VAMPIRE_SKILLS,
  VAMPIRE_CONFIG,
  triggerRepulsionSkill,
  selectNextSkill,
  executePreparedSkill
} from './vampireLord/vampireLord.js';
