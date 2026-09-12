/**
 * src/systems/combat.js
 * Subsistema de combate, efeitos visuais de impacto e máquina de estados melee (Fase 3).
 */
import { playSfx, triggerHaptic } from '../core/audio.js';
import { triggerShake } from '../main.js';
import { triggerDeath } from './ui.js';
import { selectedHeroKey } from '../entities/player.js';

export const damageTexts = [];
export const particles = [];
export const bloodSplats = [];
export const dyingEnemies = [];

export function addDyingEnemy(e, hitAngle = 0) {
  if (!e || e.isBoss || e.isMiniBoss || e.isBossSubTarget) return;
  const pushSpeed = 2.2;
  dyingEnemies.push({
    x: e.x,
    y: e.y,
    vx: Math.cos(hitAngle) * pushSpeed,
    vy: Math.sin(hitAngle) * pushSpeed,
    facing: e.facing || 1,
    radius: e.radius,
    baseType: e.baseType,
    variant: e.variant || 0,
    color: e.color,
    isElite: !!e.isElite,
    timer: 11,
    maxTimer: 11
  });
}

export function addDamageText(x, y, text, isCrit = false, color = '#fff') {
  damageTexts.push({
    x: x + (Math.random() - 0.5) * 8,
    y: y - 6,
    vx: (Math.random() - 0.5) * 2.8,
    vy: isCrit ? -4.2 : -2.8,
    text: typeof text === 'number' ? Math.round(text) + (isCrit ? '!' : '') : text,
    isCrit: isCrit,
    color: isCrit ? '#f1c40f' : color,
    life: isCrit ? 38 : 30,
    maxLife: isCrit ? 38 : 30
  });
}

export function createHitParticles(x, y, color, count = 5) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5.5,
      vy: (Math.random() - 0.5) * 5.5,
      life: 18,
      color: color
    });
  }
}

export function addBloodSplat(x, y, color = 'rgba(100, 18, 18, 0.45)') {
  if (bloodSplats.length > 110) bloodSplats.shift();
  bloodSplats.push({
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 8,
    r: Math.random() * 7 + 5,
    color: color
  });
}

export function updateCombatVisuals(dt) {
  let dtWrite = 0;
  for (let i = 0; i < damageTexts.length; i++) {
    const dtItem = damageTexts[i];
    dtItem.x += dtItem.vx * dt;
    dtItem.y += dtItem.vy * dt;
    dtItem.vy += 0.16 * dt;
    dtItem.life -= dt;
    if (dtItem.life > 0) {
      damageTexts[dtWrite++] = dtItem;
    }
  }
  damageTexts.length = dtWrite;

  let pWrite = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life > 0) {
      particles[pWrite++] = p;
    }
  }
  particles.length = pWrite;

  let deWrite = 0;
  for (let i = 0; i < dyingEnemies.length; i++) {
    const de = dyingEnemies[i];
    de.x += de.vx * dt;
    de.y += de.vy * dt;
    de.vx *= Math.pow(0.85, dt);
    de.vy *= Math.pow(0.85, dt);
    de.timer -= dt;
    if (de.timer > 0) {
      dyingEnemies[deWrite++] = de;
    }
  }
  dyingEnemies.length = deWrite;
}

/**
 * Máquina de Estados de Ataque Melee dos Inimigos:
 * CHASE -> WINDUP (desaceleração e telegrafia) -> STRIKE (dano exclusivo) -> RECOVERY (vulnerabilidade).
 */
export function processEnemyMeleeAttacks(player, enemies, dt) {
  if (player.hp <= 0) return;

  const isKaelIntangible = player.invisTimer > 0;
  const enemyCount = enemies.length;

  for (let i = 0; i < enemyCount; i++) {
    const e = enemies[i];
    if (!e || e.isBoss || e.isBossSubTarget) continue;

    const nonMeleeBehaviors = [
      'shooter', 'kamikaze', 'kamikaze_spread', 'boulder_throw', 
      'mortar_barrage', 'summoner', 'protect_aura', 'gravity_ritual', 
      'bat_spawner', 'vortex_carrier', 'anchor'
    ];
    if (nonMeleeBehaviors.includes(e.behavior)) continue;

    if (e.stunTimer > 0) {
      if (e.combatState === 'WINDUP' || e.combatState === 'STRIKE') {
        e.combatState = 'CHASE';
        e.attackTimer = 0;
        e.attackCooldown = 20;
      }
      continue;
    }

    if (!e.combatState) e.combatState = 'CHASE';
    if (e.attackTimer === undefined) e.attackTimer = 0;
    if (e.attackCooldown === undefined) e.attackCooldown = 0;
    if (e.attackRange === undefined) e.attackRange = 28;
    if (e.attackWindupFrames === undefined) e.attackWindupFrames = 20;
    if (e.attackStrikeFrames === undefined) e.attackStrikeFrames = 4;
    if (e.attackRecoveryFrames === undefined) e.attackRecoveryFrames = 40;
    if (e.attackCooldownMax === undefined) e.attackCooldownMax = 30;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const distSq = dx * dx + dy * dy;
    const strikeLimit = player.radius + e.radius + e.attackRange;

    switch (e.combatState) {
      case 'CHASE': {
        if (e.attackCooldown > 0) {
          e.attackCooldown -= dt;
        } else if (distSq <= strikeLimit * strikeLimit) {
          e.combatState = 'WINDUP';
          e.attackTimer = e.attackWindupFrames;
          e.attackAngle = Math.atan2(dy, dx);
          e.facing = dx >= 0 ? 1 : -1;
          e.hitFlash = 1;
        }
        break;
      }

      case 'WINDUP': {
        e.attackTimer -= dt;
        e.hitFlash = Math.max(e.hitFlash || 0, 1);

        if (e.attackTimer <= 0) {
          e.combatState = 'STRIKE';
          e.attackTimer = e.attackStrikeFrames;
          e.hasHitInStrike = false;
        }
        break;
      }

      case 'STRIKE': {
        e.attackTimer -= dt;

        if (!e.hasHitInStrike && !isKaelIntangible && player.iFrames <= 0) {
          const currentDistSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
          if (currentDistSq <= strikeLimit * strikeLimit) {
            const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
            let angleDiff = Math.abs(angleToPlayer - e.attackAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            // Se estiver no cone frontal ou em contato físico direto, o dano é confirmado
            const isBodyContact = currentDistSq <= (player.radius + e.radius + 6) ** 2;
            if (angleDiff <= Math.PI * 0.6 || isBodyContact) {
              e.hasHitInStrike = true;

              let playerDmgTaken = e.damage;
              if (selectedHeroKey === 'KNIGHT') playerDmgTaken *= 0.80;
              if (player.armor > 0) playerDmgTaken = Math.max(1, playerDmgTaken - player.armor);

              player.hp -= playerDmgTaken;
              player.iFrames = 25;
              triggerShake(7);
              playSfx('hit');
              triggerHaptic('medium');
              addDamageText(player.x, player.y, `-${Math.round(playerDmgTaken)}`, false, '#e74c3c');
              createHitParticles(player.x, player.y, '#e74c3c', 6);

              // Impulso de Knockback sofrido: Leves tomam 100% e Pesados tomam 50%
              const hasSuperArmor = (player.dashDuration > 0) || (player.ignisDashDuration > 0) || (player.invisTimer > 0);
              if (!hasSuperArmor) {
                const pushAngle = Math.atan2(player.y - e.y, player.x - e.x);
                const baseMobKnockback = 9.5;
                const finalPush = baseMobKnockback * (player.knockbackReceived !== undefined ? player.knockbackReceived : 1.0);
                player.pushVx = Math.cos(pushAngle) * finalPush;
                player.pushVy = Math.sin(pushAngle) * finalPush;
              }

              // Passiva de retaliação de Sir Roland (KNIGHT) com Adrenalina Melee
              if (selectedHeroKey === 'KNIGHT') {
                let reflectDmg = e.damage * 0.5;
                const distToEnemy = Math.hypot(player.x - e.x, player.y - e.y);
                if (distToEnemy <= 130) {
                  reflectDmg *= 1.25;
                }
                e.hp -= reflectDmg;
                e.hitFlash = 4;
                addDamageText(e.x, e.y, Math.round(reflectDmg), distToEnemy <= 130, distToEnemy <= 130 ? '#f1c40f' : '#ffffff');
              }

              if (player.hp <= 0) {
                player.hp = 0;
                triggerDeath();
                return;
              }
            }
          }
        }

        if (e.attackTimer <= 0) {
          e.combatState = 'RECOVERY';
          e.attackTimer = e.attackRecoveryFrames;
        }
        break;
      }

      case 'RECOVERY': {
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.combatState = 'CHASE';
          e.attackCooldown = e.attackCooldownMax;
          e.attackTimer = 0;
        }
        break;
      }

      default:
        e.combatState = 'CHASE';
        break;
    }
  }
}

/**
 * Seleciona o melhor alvo disponível considerando pesos de prioridade tática.
 * Multiplicadores menores atraem a mira a distâncias maiores.
 */
export function getBestTarget(player, enemyList, maxRange = Infinity) {
  let bestTarget = null;
  let minWeightedDistSq = maxRange * maxRange;

  const count = enemyList.length;
  for (let i = 0; i < count; i++) {
    const e = enemyList[i];
    if (!e || e.hp <= 0) continue;

    if (e.isBossSubTarget && !e.active) continue;
    if (e.isBoss && e.mistState === 'DASHING') continue;

    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const actualDistSq = dx * dx + dy * dy;

    if (actualDistSq > maxRange * maxRange) continue;

    let priorityWeight = 1.0;
    if (e.isBossSubTarget) {
      priorityWeight = 0.35;
    } else if (e.isMiniBoss) {
      priorityWeight = 0.50;
    } else if (e.isBoss) {
      priorityWeight = 0.65;
    } else if (e.isElite) {
      priorityWeight = 0.85;
    }

    const weightedDistSq = actualDistSq * (priorityWeight * priorityWeight);
    if (weightedDistSq < minWeightedDistSq) {
      minWeightedDistSq = weightedDistSq;
      bestTarget = e;
    }
  }

  return bestTarget;
}