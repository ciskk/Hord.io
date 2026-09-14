/**
 * src/entities/bosses/supremeReaper/mechanics.js
 * Gerenciamento de sub-alvos (Lanternas Espirituais), Vínculo de Almas e ações agendadas do Ceifador Supremo.
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { enemies } from '../../../main.js';
import { REAPER_STATES, REAPER_CONFIG } from './constants.js';

/**
 * Remove com segurança do array global de inimigos qualquer sub-alvo vinculado ao chefe.
 * @param {Object} boss
 * @param {Array} targetList
 */
export function cleanupReaperSubTargets(boss, targetList = enemies) {
  for (let i = targetList.length - 1; i >= 0; i--) {
    if (targetList[i].parentBoss === boss) {
      targetList.splice(i, 1);
    }
  }
}

/**
 * Cria as Lanternas Espirituais como sub-alvos selecionáveis ao redor do Ceifador Supremo.
 * @param {Object} boss
 * @param {number} count
 * @param {number} lHp
 * @param {Array} targetList
 */
export function spawnReaperLanterns(boss, count, lHp, targetList = enemies) {
  cleanupReaperSubTargets(boss, targetList);
  boss.lanterns = [];

  const isIntro = boss.actionState === REAPER_STATES.SPAWN_INTRO;

  for (let k = 0; k < count; k++) {
    const angle = (k * Math.PI * 2) / count;
    const lantern = {
      angle: angle,
      dist: REAPER_CONFIG.LANTERN_DIST,
      radius: REAPER_CONFIG.LANTERN_RADIUS,
      hp: lHp,
      maxHp: lHp,
      active: true,
      hitFlash: 0,
      hitCd: 0,
      axeHitCd: 0,
      sway: 0,
      swayVel: 0,
      isBossSubTarget: true,
      isTargetable: !isIntro,
      baseType: 'LANTERNA',
      color: REAPER_CONFIG.COLOR_SOUL_CYAN,
      parentBoss: boss,
      flickerPhase: k * (Math.PI * 2 / count),
      x: boss.x + Math.cos(angle) * REAPER_CONFIG.LANTERN_DIST,
      y: boss.y + Math.sin(angle) * (REAPER_CONFIG.LANTERN_DIST * REAPER_CONFIG.LANTERN_DIST_Y_FACTOR)
    };
    boss.lanterns.push(lantern);
    targetList.push(lantern);
  }
}

/**
 * Atualiza posições, oscilação física e colisão de dano das Lanternas.
 * @param {Object} e
 * @param {number} dt
 * @param {Object} context
 */
export function updateReaperLanterns(e, dt, context) {
  const bob = e.isVulnerable ? 22 : (e.floatBob || 0);

  for (let l of e.lanterns) {
    if (l.hitFlash > 0) l.hitFlash -= dt;
    if (l.hitCd > 0) l.hitCd -= dt;
    if (l.axeHitCd > 0) l.axeHitCd -= dt;

    if (!l.active) continue;

    l.angle += e.lanternAngularSpeed * dt;
    l.swayVel += -0.06 * l.sway;
    l.swayVel *= 0.94;
    l.sway += l.swayVel * dt;

    l.x = e.x + Math.cos(l.angle) * l.dist;
    l.y = e.y + Math.sin(l.angle) * (l.dist * REAPER_CONFIG.LANTERN_DIST_Y_FACTOR) + bob + l.sway;

    if (l.hp <= 0) {
      destroyLantern(e, l, l.x, l.y, context);
    }
  }
}

/**
 * Destruição de Lanterna: causa dano retaliatório ao chefe (5% HP) e gera Colapso Espiritual de 6.0s se todas caírem.
 * @param {Object} boss
 * @param {Object} lantern
 * @param {number} lx
 * @param {number} ly
 * @param {Object} context
 */
export function destroyLantern(boss, lantern, lx, ly, context) {
  lantern.active = false;

  const idx = enemies.indexOf(lantern);
  if (idx !== -1) enemies.splice(idx, 1);

  // Mecânica de Contragolpe (Backlash: 5% do HP máximo do chefe)
  const backlashDmg = Math.round(boss.maxHp * 0.05);
  boss.hp -= backlashDmg;

  playSfx('shatter');
  context.triggerShake(12);
  triggerHaptic('heavy');
  context.createHitParticles(lx, ly, '#00cec9', 22);
  context.createHitParticles(lx, ly, '#81ecec', 14);
  context.addDamageText(boss.x, boss.y, backlashDmg, true, '#f1c40f');
  context.addDamageText(lx, ly, "LANTERNA DESTRUÍDA!", true, '#00cec9');

  // Ao destruir a última lanterna da fase: Colapso por 6.0 segundos
  const activeCount = boss.lanterns.filter(o => o.active).length;
  if (activeCount === 0 && boss.actionState !== REAPER_STATES.RECOVERY && boss.actionState !== REAPER_STATES.ENRAGE_TRANSITION) {
    if (boss.actionState === REAPER_STATES.SPAWN_INTRO) {
      boss.pendingCollapse = true;
    } else {
      boss.actionState = REAPER_STATES.RECOVERY;
      boss.recoveryTimer = REAPER_CONFIG.RECOVERY_DURATION;
      boss.isVulnerable = true;
      boss.isTargetable = true;

      context.triggerShake(16);
      triggerHaptic('heavy');
      playSfx('boss');
      context.addDamageText(boss.x, boss.y, "COLAPSO ESPIRITUAL (6.0s)!", true, '#81ecec');
    }
  }
}

/**
 * Atualiza a atração contínua e drenagem do Vínculo de Almas (Soul Tether).
 * @param {Object} e
 * @param {number} dt
 * @param {Object} context
 */
export function updateSoulTether(e, dt, context) {
  if (!e.tetherActive) return;

  const { player, triggerShake, addDamageText, createHitParticles } = context;
  const dx = e.x - player.x;
  const dy = e.y - player.y;
  const dist = Math.hypot(dx, dy);

  if (dist > e.tetherMaxDist) {
    e.tetherActive = false;
    triggerShake(6);
    addDamageText(player.x, player.y, "VÍNCULO QUEBRADO!", true, '#2ecc71');
    playSfx('crit');
    return;
  }

  e.tetherTimer -= dt;
  player.x += (dx / dist) * 0.65 * dt;
  player.y += (dy / dist) * 0.65 * dt;

  if (Math.floor(context.frameCount) % 15 === 0) {
    if (player.iFrames <= 0) {
      player.hp -= 5;
      player.iFrames = 15;
      playSfx('hit');
      addDamageText(player.x, player.y, "-5", false, '#00cec9');
      createHitParticles(player.x, player.y, '#00cec9', 3);
    }
    e.hp = Math.min(e.maxHp, e.hp + 45);
    createHitParticles(e.x, e.y, '#2ecc71', 2);
  }

  // Partículas de sucção da essência vital fluindo para o núcleo do Ceifador
  if (Math.floor(context.frameCount) % 4 === 0) {
    const streamT = Math.random();
    const sx = player.x + dx * streamT;
    const sy = player.y + dy * streamT;
    createHitParticles(sx, sy, '#81ecec', 1);
  }

  if (e.tetherTimer <= 0) {
    e.tetherActive = false;
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
