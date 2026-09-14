/**
 * src/entities/bosses/vampireLord/vampireLord.js
 * Ponto de entrada modular e orquestrador do Lorde Vampírico (Boss 1).
 */
export { VAMPIRE_STATES, VAMPIRE_SKILLS, VAMPIRE_PROJECTILES, VAMPIRE_CONFIG } from './constants.js';
export { initVampireLord } from './init.js';
export { updateVampireLord } from './fsm.js';
export { drawVampireLord } from './render.js';
export { 
  triggerRepulsionSkill, 
  selectNextSkill, 
  executePreparedSkill 
} from './attacks.js';
