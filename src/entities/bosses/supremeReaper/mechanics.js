/**
 * src/entities/bosses/supremeReaper/mechanics.js
 * Gerenciamento de sub-alvos (Lanternas Espirituais), Vínculo de Almas e ações agendadas do Ceifador Supremo.
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { enemies, setLastAttackerName, canSpawnEnemyBullet } from '../../../main.js';
import { triggerDeath } from '../../../systems/ui.js';
import { selectedHeroKey } from '../../player.js';
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

  // Ao destruir a última lanterna da fase: Colapso por 2.0 segundos
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
      context.addDamageText(boss.x, boss.y, "COLAPSO ESPIRITUAL (2.0s)!", true, '#81ecec');
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

/**
 * Aplica dano com amortecimento de armadura, feedback visual e SFX ao jogador.
 */
function damagePlayerFromBoss(player, damage, attackerName, context, hitColor = '#00cec9') {
  if (!player || player.bossIFrames > 0) return false;
  let finalDmg = damage;
  if (selectedHeroKey === 'KNIGHT') finalDmg = Math.round(finalDmg * 0.80);
  player.hp -= finalDmg;
  player.bossIFrames = 20;
  if (typeof setLastAttackerName === 'function') setLastAttackerName(attackerName);
  playSfx('hit');
  if (context.triggerShake) context.triggerShake(9);
  if (context.addDamageText) context.addDamageText(player.x, player.y, `-${finalDmg}`, false, hitColor);
  if (context.createHitParticles) context.createHitParticles(player.x, player.y, hitColor, 8);
  if (player.hp <= 0) {
    player.hp = 0;
    triggerDeath();
    return true;
  }
  return false;
}

/**
 * Atualiza o voo, moedor giratório e retorno da Foice Bumerangue de Thanatos.
 */
export function updateScytheBoomerang(boss, dt, context) {
  const S = boss.boomerangScythe;
  if (!S || !S.active) return;

  const { player, enemyBullets, createHitParticles, triggerShake } = context;

  S.angle += S.rotSpeed * dt;

  if (Math.floor(context.frameCount || 0) % 2 === 0) {
    createHitParticles(S.x, S.y, '#00cec9', 1);
    createHitParticles(S.x, S.y, '#81ecec', 1);
  }

  // Colisão contínua de dano com o jogador
  const pdx = player.x - S.x;
  const pdy = player.y - S.y;
  const pDist = Math.hypot(pdx, pdy);
  if (pDist <= S.radius + (player.radius || 14)) {
    damagePlayerFromBoss(player, Math.round(boss.damage * 0.38), "Foice Bumerangue", context, '#00cec9');
  }

  if (S.state === 'OUT') {
    S.x += S.vx * dt;
    S.y += S.vy * dt;
    S.travelDist += Math.hypot(S.vx, S.vy) * dt;

    if (S.travelDist >= S.maxDist) {
      S.state = 'GRINDING';
      S.grindTimer = REAPER_CONFIG.BOOMERANG_GRIND_TIME || 42;
      playSfx('singularity');
      triggerShake(6);
    }
  } else if (S.state === 'GRINDING') {
    S.grindTimer -= dt;
    S.rotSpeed = 0.65; // Rotação ultra veloz de moedor
    S.x += (Math.random() - 0.5) * 2;
    S.y += (Math.random() - 0.5) * 2;

    if (Math.floor(context.frameCount || 0) % 3 === 0) {
      triggerShake(1.5);
      const sparkAng = Math.random() * Math.PI * 2;
      createHitParticles(S.x + Math.cos(sparkAng) * S.radius, S.y + Math.sin(sparkAng) * S.radius, '#00cec9', 2);
    }

    if (S.grindTimer <= 0) {
      S.state = 'RETURNING';
      playSfx('warp');
    }
  } else if (S.state === 'RETURNING') {
    const bdx = boss.x - S.x;
    const bdy = boss.y - S.y;
    const bDist = Math.hypot(bdx, bdy) || 1;
    const returnSpeed = (REAPER_CONFIG.BOOMERANG_SPEED || 9.5) * 1.25;

    S.x += (bdx / bDist) * returnSpeed * dt;
    S.y += (bdy / bDist) * returnSpeed * dt;
    S.rotSpeed = 0.45;

    if (bDist <= 42) {
      // Capturada com sucesso!
      S.active = false;
      boss.boomerangScythe = null;
      boss.isUnarmed = false;
      boss.scytheAngle = 0.4;
      boss.scytheTargetAngle = 0.4;
      boss.scytheGlow = 1.0;

      playSfx('crit');
      playSfx('boss');
      triggerShake(9);
      triggerHaptic('medium');
      createHitParticles(boss.x, boss.y, '#00cec9', 20);

      boss.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      boss.actionTimer = 24;
    }
  }

  // Enquanto desarmado, Thanatos conjura dardos de fogo espiritual pelas mãos
  if (boss.isUnarmed && boss.actionState === REAPER_STATES.BOOMERANG_ACTIVE) {
    if (boss.unarmedDartTimer === undefined) boss.unarmedDartTimer = 0;
    boss.unarmedDartTimer -= dt;

    if (boss.unarmedDartTimer <= 0) {
      boss.unarmedDartTimer = boss.isEnraged ? 24 : 32;
      const angleToPlayer = Math.atan2(player.y - boss.y, player.x - boss.x);
      const spread = 0.25;

      for (let s of [-spread, spread]) {
        if (!canSpawnEnemyBullet(true)) break;
        const sAng = angleToPlayer + s;
        enemyBullets.push({
          x: boss.x + Math.cos(sAng) * 35,
          y: boss.y + Math.sin(sAng) * 35,
          vx: Math.cos(sAng) * 4.4,
          vy: Math.sin(sAng) * 4.4,
          radius: 6.5,
          damage: Math.round(boss.damage * 0.22),
          life: 110,
          isBossProjectile: true,
          color: '#00cec9'
        });
      }
      playSfx('shoot');
      createHitParticles(boss.x, boss.y, '#81ecec', 4);
    }
  }
}

/**
 * Atualiza os Poços de Almas e erupção de chamas sepulcrais.
 */
export function updateSoulWells(boss, dt, context) {
  if (!boss.soulWells || boss.soulWells.length === 0) return;

  const { player, createHitParticles, triggerShake } = context;

  for (let i = boss.soulWells.length - 1; i >= 0; i--) {
    const well = boss.soulWells[i];

    if (!well.detonated) {
      well.timer -= dt;

      // Faíscas de aviso subindo do solo rúnico
      if (Math.floor(context.frameCount || 0) % 3 === 0) {
        const sDist = Math.random() * well.radius;
        const sAng = Math.random() * Math.PI * 2;
        createHitParticles(well.x + Math.cos(sAng) * sDist, well.y + Math.sin(sAng) * sDist, '#00cec9', 1);
      }

      if (well.timer <= 0) {
        well.detonated = true;
        well.miasmaTimer = 140; // 2.3s de miasma residual

        playSfx('shatter');
        triggerShake(7);

        // Detonação em pilar de fogo fátuo
        for (let p = 0; p < 18; p++) {
          createHitParticles(
            well.x + (Math.random() - 0.5) * well.radius,
            well.y + (Math.random() - 0.5) * well.radius - p * 3,
            '#00cec9',
            1
          );
        }

        const wpdx = player.x - well.x;
        const wpdy = player.y - well.y;
        if (Math.hypot(wpdx, wpdy) <= well.radius) {
          damagePlayerFromBoss(player, Math.round(boss.damage * 0.44), "Poço das Almas", context, '#00cec9');
        }
      }
    } else {
      // Miasma residual no chão
      well.miasmaTimer -= dt;

      if (Math.floor(context.frameCount || 0) % 8 === 0) {
        createHitParticles(
          well.x + (Math.random() - 0.5) * well.radius * 0.8,
          well.y + (Math.random() - 0.5) * well.radius * 0.8,
          '#00cec9',
          1
        );
      }

      const wpdx = player.x - well.x;
      const wpdy = player.y - well.y;
      if (Math.hypot(wpdx, wpdy) <= well.radius && Math.floor(context.frameCount || 0) % 20 === 0) {
        damagePlayerFromBoss(player, 6, "Miasma Sepulcral", context, '#00cec9');
      }

      if (well.miasmaTimer <= 0) {
        boss.soulWells.splice(i, 1);
      }
    }
  }
}

/**
 * Atualiza o rastreamento, travamento e impacto da Guilhotina Celestial (Marca da Morte).
 */
export function updateDeathMarkExecution(boss, dt, context) {
  const mark = boss.deathMark;
  if (!mark || !mark.active) return;

  const { player, createHitParticles, triggerShake, bossShockwaves } = context;

  mark.timer -= dt;

  // Fase 1: Rastreamento suave do jogador
  if (!mark.locked) {
    mark.x += (player.x - mark.x) * 0.14 * dt;
    mark.y += (player.y - mark.y) * 0.14 * dt;

    if (mark.timer <= (REAPER_CONFIG.EXECUTION_LOCK_LEAD || 18)) {
      mark.locked = true;
      mark.lockedX = mark.x;
      mark.lockedY = mark.y;
      playSfx('charge');
      triggerHaptic('medium');
      if (context.addDamageText) {
        context.addDamageText(mark.lockedX, mark.lockedY - 35, "EXECUÇÃO!", true, '#ff4757');
      }
    }
  } else {
    // Alvo travado no chão: faíscas verticais descendo do céu
    if (Math.floor(context.frameCount || 0) % 2 === 0) {
      createHitParticles(mark.lockedX, mark.lockedY, '#ff4757', 2);
    }
  }

  // Fase 2: Queda e Detonação da Guilhotina
  if (mark.timer <= 0) {
    const targetX = mark.locked ? mark.lockedX : mark.x;
    const targetY = mark.locked ? mark.lockedY : mark.y;

    playSfx('shatter');
    playSfx('boss');
    triggerShake(20);
    triggerHaptic('heavy');

    // Explosão central colossal
    for (let p = 0; p < 36; p++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * mark.radius * 1.5;
      createHitParticles(targetX + Math.cos(ang) * r, targetY + Math.sin(ang) * r, '#00cec9', 1);
      createHitParticles(targetX + Math.cos(ang) * r, targetY + Math.sin(ang) * r, '#ff4757', 1);
    }

    // Dano no ponto de impacto direto
    const pdx = player.x - targetX;
    const pdy = player.y - targetY;
    if (Math.hypot(pdx, pdy) <= mark.radius) {
      damagePlayerFromBoss(player, Math.round(boss.damage * 0.72), "Guilhotina do Juízo", context, '#ff4757');
    }

    // Fratura em Cruz (onda de choque e 4 eixos cardinais)
    if (bossShockwaves) {
      bossShockwaves.push({
        x: targetX,
        y: targetY,
        radius: 16,
        maxRadius: 280,
        speed: 8.0,
        damage: Math.round(boss.damage * 0.35),
        colorRgb: '0, 206, 201',
        hitPlayer: false
      });
    }

    // Fissuras cardinais (Norte, Sul, Leste, Oeste)
    const dirs = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    for (let d of dirs) {
      for (let step = 1; step <= 5; step++) {
        const fx = targetX + Math.cos(d) * (step * 50);
        const fy = targetY + Math.sin(d) * (step * 50);
        createHitParticles(fx, fy, '#ff4757', 3);
        const fdx = player.x - fx;
        const fdy = player.y - fy;
        if (Math.hypot(fdx, fdy) <= 32) {
          damagePlayerFromBoss(player, Math.round(boss.damage * 0.36), "Fratura em Cruz", context, '#ff4757');
        }
      }
    }

    mark.active = false;
    boss.deathMark = null;
  }
}

/**
 * Atualiza os clones e cortes convergentes da Tríade das Sombras.
 */
export function updateTriadSlash(boss, dt, context) {
  if (!boss.triadClones || boss.triadClones.length === 0) return;

  const { createHitParticles, triggerShake, bossTelegraphs } = context;

  for (let i = boss.triadClones.length - 1; i >= 0; i--) {
    const clone = boss.triadClones[i];
    clone.timer -= dt;

    if (Math.floor(context.frameCount || 0) % 4 === 0) {
      createHitParticles(clone.x, clone.y, '#00cec9', 1);
    }

    if (clone.timer <= 0 && !clone.slashed) {
      clone.slashed = true;
      clone.fadeTimer = 20;

      playSfx('crit');
      triggerShake(10);

      // Corte em direção ao centro do triângulo
      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: clone.x,
        y: clone.y,
        radius: 175,
        angle: clone.slashAngle,
        timer: 18,
        maxTimer: 18,
        damage: Math.round(boss.damage * 0.45),
        color: '#00cec9',
        colorRgb: '0, 206, 201',
        boss: boss
      });
    }

    if (clone.slashed) {
      clone.fadeTimer -= dt;
      clone.alpha = Math.max(0, clone.fadeTimer / 20);
      if (clone.fadeTimer <= 0) {
        boss.triadClones.splice(i, 1);
      }
    }
  }
}
