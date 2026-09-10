import { 
  initVampireLord, 
  updateVampireLord, 
  drawVampireLord 
} from './vampireLord.js';
import { 
  initAbyssalMonolith, 
  updateAbyssalMonolith, 
  drawAbyssalMonolith 
} from './abyssalMonolith.js';
import { 
  initSupremeReaper, 
  updateSupremeReaper, 
  drawSupremeReaper 
} from './supremeReaper.js';
import { 
  initAbyssSovereign, 
  updateAbyssSovereign, 
  drawAbyssSovereign 
} from './abyssSovereign.js';

// Dicionário modular de todos os chefes do jogo
const BOSS_MODULES = {
  1: {
    init: initVampireLord,
    update: updateVampireLord,
    draw: drawVampireLord
  },
  2: {
    init: initAbyssalMonolith,
    update: updateAbyssalMonolith,
    draw: drawAbyssalMonolith
  },
  3: {
    init: initSupremeReaper,
    update: updateSupremeReaper,
    draw: drawSupremeReaper
  },
  4: {
    init: initAbyssSovereign,
    update: updateAbyssSovereign,
    draw: drawAbyssSovereign
  }
};

/**
 * Inicializa propriedades e estados específicos de um chefe via módulo dedicado.
 * @param {Object} boss Entidade do chefe recém-instanciada.
 */
export function initBoss(boss) {
  if (!boss || !boss.bossId) return;
  const mod = BOSS_MODULES[boss.bossId];
  if (mod && typeof mod.init === 'function') {
    mod.init(boss);
  }
}

/**
 * Atualiza a IA e lógica interna do chefe via módulo dedicado.
 * @param {Object} boss Entidade do chefe.
 * @param {number} dt Variação de tempo do frame.
 * @param {Object} context Contexto global do motor.
 * @returns {boolean}
 */
export function updateBoss(boss, dt, context) {
  if (!boss || !boss.bossId) return false;
  const mod = BOSS_MODULES[boss.bossId];
  if (mod && typeof mod.update === 'function') {
    mod.update(boss, dt, context);
    return true;
  }
  return false;
}

/**
 * Renderiza o chefe via módulo dedicado.
 * @param {CanvasRenderingContext2D} ctx Contexto de renderização 2D.
 * @param {Object} boss Entidade do chefe.
 * @param {number} frameCount Contador de frames global.
 * @returns {boolean}
 */
export function drawBoss(ctx, boss, frameCount) {
  if (!boss || !boss.bossId) return false;
  const mod = BOSS_MODULES[boss.bossId];
  if (mod && typeof mod.draw === 'function') {
    mod.draw(ctx, boss, frameCount);
    return true;
  }
  return false;
}