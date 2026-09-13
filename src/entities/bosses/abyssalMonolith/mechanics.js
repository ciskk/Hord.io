/**
 * src/entities/bosses/abyssalMonolith/mechanics.js
 * Gerenciamento de sub-alvos (Litocistos), fontes termais interativas e ações agendadas de Ignis Lithos.
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { enemies } from '../../../main.js';
import { MONOLITH_STATES, MONOLITH_CONFIG } from './constants.js';

/**
 * Remove com segurança do array global de inimigos qualquer sub-alvo vinculado ao chefe.
 * @param {Object} boss
 * @param {Array} targetList
 */
export function cleanupMonolithSubTargets(boss, targetList = enemies) {
  for (let i = targetList.length - 1; i >= 0; i--) {
    if (targetList[i].parentBoss === boss) {
      targetList.splice(i, 1);
    }
  }
}

/**
 * Cria os orbes orbitais destrutíveis (Litocistos) ao redor de Ignis Lithos.
 * @param {Object} boss
 * @param {number} count
 * @param {number} orbHp
 * @param {Array} targetList
 */
export function spawnLitocistos(boss, count, orbHp, targetList = enemies) {
  cleanupMonolithSubTargets(boss, targetList);
  boss.orbitals = [];

  for (let k = 0; k < count; k++) {
    const angle = (k * Math.PI * 2) / count;
    const orbital = {
      angle: angle,
      dist: MONOLITH_CONFIG.ORBITAL_DIST,
      radius: MONOLITH_CONFIG.ORBITAL_RADIUS,
      hp: orbHp,
      maxHp: orbHp,
      active: true,
      hitFlash: 0,
      orbitalHitCd: 0,
      axeHitCd: 0,
      isBossSubTarget: true,
      baseType: 'LITOCISTO',
      color: MONOLITH_CONFIG.COLOR_NORMAL,
      parentBoss: boss,
      x: boss.x + Math.cos(angle) * MONOLITH_CONFIG.ORBITAL_DIST,
      y: boss.y + Math.sin(angle) * MONOLITH_CONFIG.ORBITAL_DIST,
      pulseOffset: k * 1.5
    };
    boss.orbitals.push(orbital);
    targetList.push(orbital);
  }
}

/**
 * Atualiza o ciclo de vida das Fontes Termais geradas pela quebra de Litocistos.
 * @param {Object} boss
 * @param {number} dt
 * @param {Object} context
 */
export function updateThermalVents(boss, dt, context) {
  const { player, addDamageText, triggerShake, createHitParticles } = context;

  for (let i = boss.thermalVents.length - 1; i >= 0; i--) {
    const vent = boss.thermalVents[i];
    vent.life -= dt;

    if (vent.life <= 0 || !vent.active) {
      boss.thermalVents.splice(i, 1);
      continue;
    }

    const distToPlayer = Math.hypot(player.x - vent.x, player.y - vent.y);
    if (distToPlayer < vent.radius + player.radius) {
      vent.active = false;

      // Recompensa Tática (+25 HP, reset de cooldown e i-frames)
      player.skillCd = 0;
      const healAmount = MONOLITH_CONFIG.VENT_HEAL;
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      player.iFrames = Math.max(player.iFrames || 0, MONOLITH_CONFIG.VENT_IFRAMES);

      playSfx('powerup');
      triggerShake(5);
      triggerHaptic('medium');

      addDamageText(player.x, player.y, `+${healAmount} HP`, true, '#2ecc71');
      addDamageText(player.x, player.y - 18, "HABILIDADE RECARREGADA!", true, '#f1c40f');

      for (let p = 0; p < 18; p++) {
        createHitParticles(player.x, player.y, '#f1c40f', 1);
        createHitParticles(player.x, player.y, '#2ecc71', 1);
      }
    }
  }
}

/**
 * Atualiza posições, rotação orbital e verifica destruição dos Litocistos.
 * @param {Object} e
 * @param {number} dt
 * @param {Object} context
 */
export function updateLitocistos(e, dt, context) {
  const bob = e.isVulnerable ? 24 : (e.floatBob || 0);

  for (let o of e.orbitals) {
    if (o.hitFlash > 0) o.hitFlash -= dt;
    if (o.orbitalHitCd > 0) o.orbitalHitCd -= dt;
    if (o.axeHitCd > 0) o.axeHitCd -= dt;

    if (!o.active) continue;

    o.angle += e.orbitalAngularVelocity * dt;
    o.x = e.x + Math.cos(o.angle) * o.dist;
    o.y = e.y + Math.sin(o.angle) * o.dist + bob;

    if (o.hp <= 0) {
      destroyLitocisto(e, o, o.x, o.y, context);
    }
  }
}

/**
 * Quebra de Litocisto: causa dano retaliatório ao chefe, gera Fonte Termal e aciona Stun se todos forem destruídos.
 * @param {Object} boss
 * @param {Object} o
 * @param {number} ox
 * @param {number} oy
 * @param {Object} context
 */
export function destroyLitocisto(boss, o, ox, oy, context) {
  o.active = false;

  const idx = enemies.indexOf(o);
  if (idx !== -1) enemies.splice(idx, 1);

  const backlashDmg = Math.round(boss.maxHp * 0.05);
  boss.hp -= backlashDmg;

  playSfx('shatter');
  context.triggerShake(12);
  triggerHaptic('heavy');
  context.createHitParticles(ox, oy, '#d35400', 18);
  context.createHitParticles(ox, oy, '#f1c40f', 14);
  context.addDamageText(boss.x, boss.y, backlashDmg, true, '#f1c40f');
  context.addDamageText(ox, oy, "LITOCISTO QUEBRADO!", true, '#e67e22');

  boss.thermalVents.push({
    x: ox,
    y: oy,
    radius: MONOLITH_CONFIG.VENT_RADIUS,
    life: MONOLITH_CONFIG.VENT_LIFE,
    maxLife: MONOLITH_CONFIG.VENT_LIFE,
    active: true,
    pulsePhase: Math.random() * Math.PI * 2
  });

  const activeRemaining = boss.orbitals.filter(item => item.active).length;
  if (activeRemaining === 0 && boss.actionState !== MONOLITH_STATES.RECOVERY && boss.actionState !== MONOLITH_STATES.OVERHEAT_TRANSITION) {
    boss.actionState = MONOLITH_STATES.RECOVERY;
    boss.recoveryTimer = MONOLITH_CONFIG.RECOVERY_DURATION; // 4.5 segundos
    boss.isVulnerable = true;

    context.triggerShake(16);
    triggerHaptic('heavy');
    playSfx('boss');
    context.addDamageText(boss.x, boss.y, "COLAPSO SÍSMICO!", true, '#f1c40f');
  }
}

/**
 * Agenda uma ação para ser executada após delayFrames.
 * @param {Object} boss
 * @param {number} delayFrames
 * @param {Function} callback
 */
export function scheduleDelayedAction(boss, delayFrames, callback) {
  if (!boss.delayedActions) boss.delayedActions = [];
  boss.delayedActions.push({
    timer: delayFrames,
    callback: callback
  });
}

/**
 * Atualiza e executa a fila de ações agendadas do chefe.
 * @param {Object} boss
 * @param {number} dt
 */
export function updateDelayedActions(boss, dt) {
  if (!boss.delayedActions || boss.delayedActions.length === 0) return;
  for (let i = boss.delayedActions.length - 1; i >= 0; i--) {
    const action = boss.delayedActions[i];
    action.timer -= dt;
    if (action.timer <= 0) {
      if (typeof action.callback === 'function') {
        action.callback();
      }
      boss.delayedActions.splice(i, 1);
    }
  }
}
