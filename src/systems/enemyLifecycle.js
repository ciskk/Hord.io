/**
 * src/systems/enemyLifecycle.js
 * Subsistema de Ciclo de Vida, IA dos 31 Monstros e Processamento de Abates:
 * - Cinemática de Knockback Suave (Impulso com Fricção Exponencial)
 * - DoT de Corrosão Cáustica (Acid Shred, Stacks e Decaimento)
 * - Delegação de Chefes e Mini-Chefes (updateBoss e updateMiniBoss)
 * - Inteligência Artificial Especializada de todos os comportamentos de horda
 * - Gatilhos de Morte, Explosões Necróticas, Animações Diegéticas e Recompensas
 * - Registro e Catálogo no Códice do Bestiário
 * - Processamento de Ataques Melee (processEnemyMeleeAttacks)
 */

import { playSfx, triggerHaptic } from '../core/audio.js';
import { 
  addDamageText, 
  createHitParticles, 
  addDyingEnemy, 
  addBloodSplat, 
  dyingEnemies,
  processEnemyMeleeAttacks 
} from './combat.js';
import { canSpawnEnemyBullet } from './projectiles.js';
import { updateBoss } from '../entities/bosses/bossRegistry.js';
import { updateMiniBoss } from '../entities/minibossController.js';
import { triggerBossBark } from './barks.js';
import { 
  triggerDeath, 
  finalizeVictoryAndReturnToMenu,
  setBossRewardContext,
  ensureBossUpgradeCount
} from './ui.js';
import { recordCreatureKill } from '../config/bestiary.js';
import { createEnemy, spawnMobCluster } from '../entities/enemies.js';
import { ENEMY_TYPES } from '../config/enemies.js';
import { inputX, inputY } from '../core/input.js';
import { addPersistentGold, addXP, getPersistentGold, selectedHeroKey } from '../entities/player.js';
import { getGemConfig, spawnChest as spawnChestPickup } from './pickups.js';
import { onBossDefeated, setFirstBossKilled } from './waves.js';
import { getNeighborIndices } from '../core/spatialGrid.js';

export function updateEnemies(dt, {
  player,
  enemies,
  frameCount,
  freezeTimer,
  setFreezeTimer,
  enemyBullets,
  bossTelegraphs,
  bossProjectiles,
  bossShockwaves,
  voidVortices,
  acidPuddles,
  gems,
  chests,
  gameState,
  activeBoss,
  setActiveBoss,
  triggerShake,
  triggerHaptic,
  setLastAttackerName,
  resetBossGhostHp,
  setIsWavePaused
}) {
  const seconds = Math.floor(frameCount / 60);
  const spawnChest = (x, y, tier = 'BOSS') => spawnChestPickup(chests, x, y, tier);
  let lastAttackerName = '';

  // Atualização dos Monstros
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.orbitalHitCd > 0) e.orbitalHitCd -= dt;
    if (e.axeHitCd > 0) e.axeHitCd -= dt;
    if (e.emergeTimer > 0) {
      e.emergeTimer -= dt;
      if (e.emergeTimer < 0) e.emergeTimer = 0;
    }

    if (e.isBossSubTarget) continue;

    // Integração Cinética de Knockback Suave (Impulso com Fricção Exponencial)
    if (e.pushVx || e.pushVy) {
      e.x += (e.pushVx || 0) * dt;
      e.y += (e.pushVy || 0) * dt;
      const kbFriction = Math.pow(0.82, dt);
      e.pushVx = (e.pushVx || 0) * kbFriction;
      e.pushVy = (e.pushVy || 0) * kbFriction;
      if (Math.abs(e.pushVx) < 0.05) e.pushVx = 0;
      if (Math.abs(e.pushVy) < 0.05) e.pushVy = 0;
    }

    if (e.acidStackTimer > 0) {
      e.acidStackTimer -= dt;
      if (e.acidStackTimer <= 0) e.acidStacks = 0;
    }
    if (e.confusedTimer > 0) e.confusedTimer -= dt;
    e.inAcidPuddle = false;

    // DoT Aderente de Corrosão / Fixação Cáustica (Caminhos 1 e 3)
    if (e.acidBurnTimer > 0) {
      e.acidBurnTimer -= dt;
      const stacks = Math.max(1, e.acidStacks || 1);
      // Teto rígido com 5 stacks: ~75-95 DPS estável (+30% da corrosão)
      const burnBasePerFrame = (e.acidBurnEvolved ? 0.35 : 0.24) * stacks;
      const corrosionMult = 1 + (stacks * 0.06);
      const frameDmg = burnBasePerFrame * corrosionMult * dt;

      e.hp -= frameDmg;
      e.hitFlash = Math.max(e.hitFlash || 0, 1);

      e.burnDmgAcc = (e.burnDmgAcc || 0) + frameDmg;
      e.burnTickTimer = (e.burnTickTimer || 0) + dt;
      if (e.burnTickTimer >= 20) {
        const displayDmg = Math.round(e.burnDmgAcc);
        if (displayDmg >= 1) {
          const burnColor = e.acidBurnEvolved ? '#00cec9' : '#a29bfe';
          addDamageText(e.x, e.y - (e.radius || 14) * 0.5, displayDmg, false, burnColor);
          createHitParticles(e.x, e.y, burnColor, 1);
        }
        e.burnDmgAcc = 0;
        e.burnTickTimer = 0;
      }
      if (e.acidBurnTimer <= 0) {
        e.acidBurnEvolved = false;
      }
    }

    if (e.stunTimer > 0) {
      e.stunTimer -= dt;
      continue;
    }

    if (freezeTimer <= 0) {
      const isConfused = ((player.invisTimer > 0) || (e.confusedTimer > 0)) && !e.isBoss;
      const targetX = isConfused ? (e.x + Math.sin(frameCount * 0.05 + i) * 120) : player.x;
      const targetY = isConfused ? (e.y + Math.cos(frameCount * 0.05 + i) * 120) : player.y;

      const angle = Math.atan2(targetY - e.y, targetX - e.x);
      e.facing = (targetX - e.x) > 0 ? 1 : -1;
      
      let curSpeed = e.speed;
      if (e.emergeTimer > 0) {
        curSpeed *= 0.18;
      }
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        const maxSlow = e.isBoss ? 0.18 : (e.slowFactor || 0.5);
        curSpeed *= (1 - maxSlow);
      }

      // Micro Stagger / Hit-Stun: amortece o avanço próprio do inimigo enquanto sofre impulso forte de recuo
      const pushSpeed = Math.hypot(e.pushVx || 0, e.pushVy || 0);
      if (pushSpeed > 1.8) {
        curSpeed *= 0.25;
      }

      if (e.combatState === 'WINDUP') curSpeed *= 0.15;
      else if (e.combatState === 'STRIKE') curSpeed *= 0.10;
      else if (e.combatState === 'RECOVERY') curSpeed *= -0.30;

      if (e.isBoss && e.isEnraged && Math.floor(frameCount) % 5 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 1.4,
          e.y + (Math.random() - 0.5) * e.radius * 1.4,
          '#e74c3c',
          1
        );
      }

      if (e.isBoss && e.windupAction && e.windupTimer > 0) {
        e.windupTimer -= dt;
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius,
          e.y + (Math.random() - 0.5) * e.radius,
          e.color,
          1
        );
        if (e.windupTimer <= 0) {
          e.windupAction();
          e.windupAction = null;
        }
        continue;
      }

      if (e.isBoss) {
        if (!e.enrageBarkTriggered && (e.isEnraged || (e.hp <= e.maxHp * 0.5))) {
          e.enrageBarkTriggered = true;
          triggerBossBark(e.bossId, 'ENRAGE');
        }
        updateBoss(e, dt, {
          player,
          frameCount,
          enemies,
          enemyBullets,
          bossTelegraphs,
          bossProjectiles,
          bossShockwaves,
          voidVortices,
          triggerShake,
          triggerHaptic,
          createHitParticles,
          addDamageText,
          onDefeatComplete: () => {
            activeBoss = null; if (setActiveBoss) setActiveBoss(null);
            finalizeVictoryAndReturnToMenu();
          }
        });
      } else if (e.isMiniBoss) {
        updateMiniBoss(e, dt, {
          player,
          frameCount,
          enemies,
          enemyBullets,
          bossTelegraphs,
          bossProjectiles,
          bossShockwaves,
          voidVortices,
          acidPuddles,
          triggerShake,
          triggerHaptic,
          createHitParticles,
          addDamageText
        });
      } else if (e.behavior === 'swarm') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        const isDive = distToPlayerSq < 135 * 135;
        const diveBonus = isDive ? 1.35 : 1.0;
        e.x += Math.cos(angle + Math.sin(frameCount * 0.12) * 0.35) * curSpeed * diveBonus * dt;
        e.y += Math.sin(angle + Math.sin(frameCount * 0.12) * 0.35) * curSpeed * diveBonus * dt;
      } else if (e.behavior === 'shooter') {
        const isPlayerVisible = player.invisTimer <= 0;
        if (e.thrusterCooldown > 0) e.thrusterCooldown -= dt;
        
        if (isPlayerVisible) {
          const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
          
          // Propulsão de Emergência (Aero-Dash) se o jogador invadir o perímetro próximo (< 65px)
          if (distToPlayerSq < 65 * 65 && (!e.thrusterCooldown || e.thrusterCooldown <= 0)) {
            e.thrusterCooldown = 160;
            e.x -= Math.cos(angle) * 70;
            e.y -= Math.sin(angle) * 70;
            playSfx('warp');
            createHitParticles(e.x, e.y, '#00cec9', 10);
            addDamageText(e.x, e.y, "RECUO A JATO!", false, '#00cec9');
          } else if (distToPlayerSq < 170 * 170) {
            e.x -= Math.cos(angle) * curSpeed * dt;
            e.y -= Math.sin(angle) * curSpeed * dt;
          } else if (distToPlayerSq > 240 * 240) {
            e.x += Math.cos(angle) * curSpeed * dt;
            e.y += Math.sin(angle) * curSpeed * dt;
          }

          // Rajada Tática Tripla (3-Round Burst)
          if (e.burstRemaining > 0) {
            e.burstTimer = (e.burstTimer || 0) + dt;
            if (e.burstTimer >= 6) {
              e.burstTimer = 0;
              e.burstRemaining--;
              if (canSpawnEnemyBullet()) {
                const spreadAngle = angle + (e.burstRemaining - 1) * 0.12;
                enemyBullets.push({
                  x: e.x + Math.cos(spreadAngle) * 14,
                  y: e.y + Math.sin(spreadAngle) * 14,
                  vx: Math.cos(spreadAngle) * 3.9,
                  vy: Math.sin(spreadAngle) * 3.9,
                  radius: 5.5,
                  damage: 12,
                  life: 95,
                  bulletType: 'TECH',
                  color: '#ff4757'
                });
                playSfx('shoot');
                createHitParticles(e.x + Math.cos(spreadAngle) * 16, e.y + Math.sin(spreadAngle) * 16, '#ff4757', 3);
                // Recuo mecânico
                e.x -= Math.cos(spreadAngle) * 2.5;
                e.y -= Math.sin(spreadAngle) * 2.5;
              }
            }
          } else {
            e.shootTimer += dt;
            if (e.shootTimer >= 148) {
              if (canSpawnEnemyBullet()) {
                e.shootTimer = 0;
                e.burstRemaining = 3;
                e.burstTimer = 6;
              } else {
                e.shootTimer = 148 - 25;
              }
            }
          }
        } else {
          e.x += Math.cos(angle) * curSpeed * 0.3 * dt;
          e.y += Math.sin(angle) * curSpeed * 0.3 * dt;
        }
      } else if (e.behavior === 'dash') {
        e.dashTimer = (e.dashTimer || 0) + dt;
        if (e.dashState === 'chase') {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
          if (e.dashTimer > 105) {
            e.dashState = 'aim';
            e.dashTimer = 0;
            // Emboscada de Flanco para Stalker (Assassino Espectral)
            if (e.baseType === 'STALKER' && Math.random() < 0.75) {
              createHitParticles(e.x, e.y, '#6c5ce7', 6);
              const flankOffset = (Math.random() < 0.5 ? 1 : -1) * (Math.PI * 0.4);
              const flankAng = angle + flankOffset;
              e.x = player.x - Math.cos(flankAng) * 90;
              e.y = player.y - Math.sin(flankAng) * 90;
              createHitParticles(e.x, e.y, '#a29bfe', 8);
              e.dashAngle = Math.atan2(player.y - e.y, player.x - e.x);
            } else {
              e.dashAngle = angle;
            }
          }
        } else if (e.dashState === 'aim') {
          if (e.dashTimer > 20) {
            e.dashState = 'dashing';
            e.dashTimer = 0;
          }
        } else if (e.dashState === 'dashing') {
          curSpeed = e.speed * 4.2;
          e.x += Math.cos(e.dashAngle) * curSpeed * dt;
          e.y += Math.sin(e.dashAngle) * curSpeed * dt;
          createHitParticles(e.x, e.y, '#9b59b6', 1);
          if (e.dashTimer > 18) {
            e.dashState = 'cooldown';
            e.dashTimer = 0;
          }
        } else if (e.dashState === 'cooldown') {
          curSpeed = e.speed * 0.4;
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
          if (e.dashTimer > 35) {
            e.dashState = 'chase';
            e.dashTimer = 0;
          }
        }
      } else if (e.behavior === 'kamikaze') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (e.fuseState === 'FUSE') {
          curSpeed = 0;
          e.fuseTimer -= dt;
          e.hitFlash = Math.max(e.hitFlash || 0, 1);
          if (Math.floor(frameCount) % 5 === 0) createHitParticles(e.x, e.y, '#e67e22', 1);
          if (e.fuseTimer <= 0) {
            e.hp = 0;
            e.explodedNaturally = true;
          }
        } else {
          if (distToPlayerSq <= 55 * 55) {
            e.fuseState = 'FUSE';
            e.fuseTimer = 36;
            e.fuseTelegraph = {
              type: 'FUSE_INDICATOR',
              x: e.x,
              y: e.y,
              radius: 50,
              timer: 36,
              maxTimer: 36,
              color: 'rgba(230, 126, 34, 0.45)'
            };
            bossTelegraphs.push(e.fuseTelegraph);
          } else {
            e.x += Math.cos(angle) * curSpeed * dt;
            e.y += Math.sin(angle) * curSpeed * dt;
          }
        }
      } else if (e.behavior === 'kamikaze_spread') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (e.fuseState === 'FUSE') {
          curSpeed = 0;
          e.fuseTimer -= dt;
          e.hitFlash = Math.max(e.hitFlash || 0, 1);
          if (Math.floor(frameCount) % 5 === 0) createHitParticles(e.x, e.y, '#d35400', 1);
          if (e.fuseTimer <= 0) {
            e.hp = 0;
            e.explodedNaturally = true;
          }
        } else {
          if (distToPlayerSq <= 60 * 60) {
            e.fuseState = 'FUSE';
            e.fuseTimer = 40;
            e.fuseTelegraph = {
              type: 'FUSE_INDICATOR',
              x: e.x,
              y: e.y,
              radius: 65,
              timer: 40,
              maxTimer: 40,
              color: 'rgba(211, 84, 0, 0.45)'
            };
            bossTelegraphs.push(e.fuseTelegraph);
          } else {
            e.x += Math.cos(angle) * curSpeed * 1.25 * dt;
            e.y += Math.sin(angle) * curSpeed * 1.25 * dt;
          }
        }
      } else if (e.behavior === 'backstab_dash') {
        e.dashState = e.dashState || 'chase';
        e.dashTimer = (e.dashTimer || 0) + dt;
        if (e.dashState === 'chase') {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
          if (e.dashTimer > 90) {
            e.dashState = 'aim';
            e.dashTimer = 0;
            const playerAng = player.facing === 1 ? 0 : Math.PI;
            const backX = player.x - Math.cos(playerAng) * 80;
            const backY = player.y - Math.sin(playerAng) * 80;
            e.dashAngle = Math.atan2(backY - e.y, backX - e.x);
          }
        } else if (e.dashState === 'aim') {
          curSpeed = e.speed * 0.25;
          e.x += Math.cos(e.dashAngle) * curSpeed * dt;
          e.y += Math.sin(e.dashAngle) * curSpeed * dt;
          if (e.dashTimer > 20) {
            e.dashState = 'dashing';
            e.dashTimer = 0;
            playSfx('crit');
          }
        } else if (e.dashState === 'dashing') {
          curSpeed = e.speed * 4.5;
          e.x += Math.cos(e.dashAngle) * curSpeed * dt;
          e.y += Math.sin(e.dashAngle) * curSpeed * dt;
          createHitParticles(e.x, e.y, '#6c5ce7', 2);
          if (e.dashTimer > 18) {
            e.dashState = 'cooldown';
            e.dashTimer = 0;
          }
        } else if (e.dashState === 'cooldown') {
          curSpeed = e.speed * 0.35;
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
          if (e.dashTimer > 35) {
            e.dashState = 'chase';
            e.dashTimer = 0;
          }
        }
      } else if (e.behavior === 'protect_aura') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (distToPlayerSq < 150 * 150) {
          e.x -= Math.cos(angle) * curSpeed * dt;
          e.y -= Math.sin(angle) * curSpeed * dt;
        } else if (distToPlayerSq > 230 * 230) {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        }
        e.auraTimer = (e.auraTimer || 0) + dt;
        if (e.auraTimer >= 120) {
          e.auraTimer = 0;
          playSfx('freeze');
          triggerShake(4);
          createHitParticles(e.x, e.y, '#0984e3', 14);
          addDamageText(e.x, e.y, "AURA PROTETORA!", false, '#74b9ff');
          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 12,
            maxRadius: 160,
            speed: 4.5,
            damage: 0,
            hitPlayer: false
          });
          const neighbors = getNeighborIndices(e.x, e.y, 160);
          for (let k = 0; k < neighbors.length; k++) {
            const ally = enemies[neighbors[k]];
            if (ally && ally !== e) {
              ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * 0.15));
              ally.hitFlash = 3;
              createHitParticles(ally.x, ally.y, '#00d2d3', 3);
            }
          }
        }
      } else if (e.behavior === 'boulder_throw') {
        e.throwTimer = (e.throwTimer || 0) + dt;
        if (e.throwTimer < 120) {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        } else if (e.throwTimer >= 150) {
          e.throwTimer = 0;
          playSfx('shoot');
          triggerShake(5);
          const leadX = player.x + (inputX || 0) * 40;
          const leadY = player.y + (inputY || 0) * 40;
          bossTelegraphs.push({
            x: leadX,
            y: leadY,
            radius: 55,
            timer: 40,
            maxTimer: 40,
            damage: Math.round(e.damage * 1.3)
          });
          createHitParticles(e.x, e.y, '#d35400', 8);
          addDamageText(e.x, e.y, "ARREMESSO DE ROCHA!", false, '#e67e22');
        }
      } else if (e.behavior === 'bat_spawner') {
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
        e.hiveTimer = (e.hiveTimer || 0) + dt;
        if (e.hiveTimer >= 180 && !gameState.isWavePaused) {
          e.hiveTimer = 0;
          playSfx('boss');
          addDamageText(e.x, e.y, "INVOQUE ENXAME!", false, '#16a085');
          createHitParticles(e.x, e.y, '#16a085', 10);
          const batCount = Math.floor(Math.random() * 2) + 2;
          for (let k = 0; k < batCount; k++) {
            const batDef = ENEMY_TYPES.BAT;
            enemies.push({
              x: e.x + (k - 0.5) * 24,
              y: e.y + (Math.random() - 0.5) * 18,
              baseType: 'BAT',
              radius: batDef.radius,
              speed: batDef.speed,
              hp: batDef.hp,
              maxHp: batDef.hp,
              color: batDef.color,
              damage: batDef.damage,
              behavior: batDef.behavior,
              xp: batDef.xp,
              facing: e.facing,
              hitFlash: 0,
              orbitalHitCd: 0,
              slowTimer: 0,
              slowFactor: 0,
              stunTimer: 0,
              combatState: 'CHASE',
              attackTimer: 0,
              attackRange: 20,
              attackWindupFrames: 16,
              attackStrikeFrames: 4,
              attackRecoveryFrames: 30,
              attackCooldown: 0,
              attackCooldownMax: 20,
              attackAngle: 0,
              hasHitInStrike: false,
              fuseState: 'CHASE',
              fuseTimer: 0,
              fuseTelegraph: null,
              explodedNaturally: false
            });
          }
        }
      } else if (e.behavior === 'blink_slash') {
        e.blinkTimer = (e.blinkTimer || 0) + dt;
        if (e.blinkTimer < 100) {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        } else if (e.blinkTimer < 130) {
          if (Math.floor(frameCount) % 4 === 0) createHitParticles(e.x, e.y, '#a29bfe', 2);
        } else {
          e.blinkTimer = 0;
          createHitParticles(e.x, e.y, '#6c5ce7', 12);
          const flankSide = Math.random() < 0.5 ? Math.PI * 0.5 : -Math.PI * 0.5;
          const flankAng = Math.atan2(e.y - player.y, e.x - player.x) + flankSide;
          e.x = player.x + Math.cos(flankAng) * 70;
          e.y = player.y + Math.sin(flankAng) * 70;
          createHitParticles(e.x, e.y, '#e056fd', 14);
          playSfx('crit');
          const cleaveAng = Math.atan2(player.y - e.y, player.x - e.x);
          bossTelegraphs.push({
            type: 'SCYTHE_CLEAVE',
            x: e.x,
            y: e.y,
            radius: 95,
            angle: cleaveAng,
            timer: 20,
            maxTimer: 20,
            damage: Math.round(e.damage * 1.1)
          });
          addDamageText(e.x, e.y, "CORTE QUÂNTICO!", true, '#a29bfe');
        }
      } else if (e.behavior === 'vortex_carrier') {
        e.x += Math.cos(angle) * curSpeed * 0.8 * dt;
        e.y += Math.sin(angle) * curSpeed * 0.8 * dt;
        const vdx = e.x - player.x;
        const vdy = e.y - player.y;
        const vDist = Math.hypot(vdx, vdy);
        if (vDist < 280 && vDist > 20) {
          player.x += (vdx / vDist) * 0.75 * dt;
          player.y += (vdy / vDist) * 0.75 * dt;
        }
        e.vortexTimer = (e.vortexTimer || 0) + dt;
        if (e.vortexTimer >= 200) {
          e.vortexTimer = 0;
          playSfx('boss');
          voidVortices.push({
            x: e.x,
            y: e.y,
            radius: 65,
            life: 300,
            damage: Math.round(e.damage * 0.4)
          });
          createHitParticles(e.x, e.y, '#8e44ad', 14);
          addDamageText(e.x, e.y, "VÓRTICE DO VAZIO!", true, '#8e44ad');
        }
      } else if (e.behavior === 'chaos_cycle') {
        e.cycleTimer = (e.cycleTimer || 0) + dt;
        e.cycleState = e.cycleState || 0;
        if (e.cycleState === 0) {
          e.x += Math.cos(angle) * curSpeed * 0.85 * dt;
          e.y += Math.sin(angle) * curSpeed * 0.85 * dt;
          if (Math.floor(frameCount) % 15 === 0 && canSpawnEnemyBullet()) {
            const spinAng = frameCount * 0.15;
            playSfx('shoot');
            for (let s = 0; s < 2; s++) {
              if (!canSpawnEnemyBullet()) break;
              const sOffset = spinAng + s * Math.PI;
              enemyBullets.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(sOffset) * 3.6,
                vy: Math.sin(sOffset) * 3.6,
                radius: 5,
                damage: Math.round(e.damage * 0.35),
                life: 85,
                bulletType: 'CHAOS'
              });
            }
          }
        } else if (e.cycleState === 1) {
          if (!e.chargeAngle) e.chargeAngle = angle;
          e.x += Math.cos(e.chargeAngle) * curSpeed * 2.8 * dt;
          e.y += Math.sin(e.chargeAngle) * curSpeed * 2.8 * dt;
          createHitParticles(e.x, e.y, '#c0392b', 1);
        } else if (e.cycleState === 2) {
          e.x += Math.cos(angle) * curSpeed * 0.5 * dt;
          e.y += Math.sin(angle) * curSpeed * 0.5 * dt;
          if (e.cycleTimer >= 85 && !e.hasSlammed) {
            e.hasSlammed = true;
            triggerShake(10);
            playSfx('boss');
            bossShockwaves.push({
              x: e.x,
              y: e.y,
              radius: 14,
              maxRadius: 130,
              speed: 4.5,
              damage: Math.round(e.damage * 0.8),
              hitPlayer: false
            });
            createHitParticles(e.x, e.y, '#e74c3c', 16);
            addDamageText(e.x, e.y, "COLAPSO DO CAOS!", true, '#c0392b');
          }
        }
        if (e.cycleTimer >= 90) {
          e.cycleTimer = 0;
          e.cycleState = (e.cycleState + 1) % 3;
          e.chargeAngle = null;
          e.hasSlammed = false;
        }
      } else if (e.behavior === 'summoner') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (distToPlayerSq < 160 * 160) {
          e.x -= Math.cos(angle) * curSpeed * dt;
          e.y -= Math.sin(angle) * curSpeed * dt;
        } else {
          e.x += Math.cos(angle) * curSpeed * 0.5 * dt;
          e.y += Math.sin(angle) * curSpeed * 0.5 * dt;
        }

        // Orbe Entrópico Noturno a cada ~3s quando em alcance
        e.shadowBoltTimer = (e.shadowBoltTimer || 0) + dt;
        if (e.shadowBoltTimer >= 170 && canSpawnEnemyBullet() && !gameState.isWavePaused) {
          e.shadowBoltTimer = 0;
          playSfx('shoot');
          enemyBullets.push({
            x: e.x,
            y: e.y - 10,
            vx: Math.cos(angle) * 2.175,
            vy: Math.sin(angle) * 2.175,
            radius: 6.5,
            damage: 14,
            life: 160,
            bulletType: 'SHADOW_ORB',
            color: '#9b59b6'
          });
          createHitParticles(e.x, e.y - 10, '#9b59b6', 6);
          addDamageText(e.x, e.y, "ORBE SOMBRIO!", false, '#a29bfe');
        }

        e.summonTimer = (e.summonTimer || 0) + dt;
        if (e.summonTimer > 230 && !gameState.isWavePaused) {
          e.summonTimer = 0;
          spawnMobCluster('ZOMBIE', 2);
          addDamageText(e.x, e.y, 'INVOCAR!', false, '#9b59b6');
        }
      } else if (e.behavior === 'ground_slam') {
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
        e.slamTimer = (e.slamTimer || 0) + dt;
        if (e.slamTimer >= 130) {
          e.slamTimer = 0;
          triggerShake(8);
          playSfx('boss');
          createHitParticles(e.x, e.y, e.color, 12);
          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 12,
            maxRadius: 90,
            speed: 3.5,
            damage: e.damage,
            hitPlayer: false
          });
          addDamageText(e.x, e.y, "IMPACTO SÍSMICO!", false, '#95a5a6');
        }
      } else if (e.behavior === 'mortar_barrage') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (distToPlayerSq < 170 * 170) {
          e.x -= Math.cos(angle) * curSpeed * dt;
          e.y -= Math.sin(angle) * curSpeed * dt;
        } else if (distToPlayerSq > 260 * 260) {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        }
        e.mortarTimer = (e.mortarTimer || 0) + dt;
        if (e.mortarTimer >= 140) {
          e.mortarTimer = 0;
          playSfx('shoot');
          bossTelegraphs.push({
            x: player.x,
            y: player.y,
            radius: 65,
            timer: 72,
            maxTimer: 72,
            damage: e.damage
          });
        }
      } else if (e.behavior === 'gravity_ritual') {
        e.x += Math.cos(angle) * curSpeed * 0.75 * dt;
        e.y += Math.sin(angle) * curSpeed * 0.75 * dt;
        const gdx = e.x - player.x;
        const gdy = e.y - player.y;
        const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
        if (gdist < 280 && gdist > 20) {
          player.x += (gdx / gdist) * 0.85 * dt;
          player.y += (gdy / gdist) * 0.85 * dt;
        }
        e.ritualTimer = (e.ritualTimer || 0) + dt;
        if (e.ritualTimer >= 170) {
          e.ritualTimer = 0;
          triggerShake(7);
          playSfx('boss');
          createHitParticles(e.x, e.y, '#341f97', 12);
          if (gdist < 110 && player.iFrames <= 0) {
            player.hp -= e.damage;
            player.iFrames = 25;
            lastAttackerName = "Ritual Gravitacional"; if (setLastAttackerName) setLastAttackerName("Ritual Gravitacional");
            triggerShake(8);
            playSfx('hit');
            addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#341f97');

            if (player.hp <= 0) {
              player.hp = 0;
              triggerDeath(); return { playerDied: true };
            }
          }
        }
      } else if (e.behavior === 'trail_toxic') {
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
        e.trailTimer = (e.trailTimer || 0) + dt;
        if (e.trailTimer >= 24) {
          e.trailTimer = 0;
          acidPuddles.push({
            x: e.x,
            y: e.y,
            radius: 18,
            life: 180,
            maxLife: 180,
            isCaustic: true,
            isFire: false
          });
          createHitParticles(e.x, e.y, '#16a085', 2);
        }
      } else if (e.behavior === 'web_trapper') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (distToPlayerSq > 160 * 160) {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        } else if (distToPlayerSq < 90 * 90) {
          e.x -= Math.cos(angle) * curSpeed * 0.7 * dt;
          e.y -= Math.sin(angle) * curSpeed * 0.7 * dt;
        }
        e.webTimer = (e.webTimer || 0) + dt;
        if (e.webTimer >= 150) {
          e.webTimer = 0;
          playSfx('shoot');
          acidPuddles.push({
            x: player.x,
            y: player.y,
            radius: 36,
            life: 240,
            maxLife: 240,
            isCaustic: true,
            isWeb: true,
            isFire: false
          });
          createHitParticles(player.x, player.y, '#b2bec3', 8);
          addDamageText(e.x, e.y, "TEIA!", false, '#dfe4ea');
        }
      } else if (e.behavior === 'chain_hook') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        e.hookTimer = (e.hookTimer || 0) - dt;
        if (distToPlayerSq <= 140 * 140 && e.hookTimer <= 0) {
          e.hookTimer = 160;
          playSfx('hit');
          triggerShake(3);
          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * 6.2,
            vy: Math.sin(angle) * 6.2,
            radius: 7,
            damage: Math.round(e.damage * 0.7),
            life: 24,
            bulletType: 'CHAIN_HOOK',
            isHook: true,
            parentX: e.x,
            parentY: e.y,
            color: '#b33939'
          });
          addDamageText(e.x, e.y, "CORRENTE!", false, '#e74c3c');
        } else {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        }
      } else if (e.behavior === 'stone_turtle') {
        if (e.isStoneForm) {
          e.stoneFormTimer -= dt;
          if (e.stoneFormTimer <= 0) {
            e.isStoneForm = false;
            createHitParticles(e.x, e.y, '#747d8c', 6);
          }
        } else {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
          if (e.hitFlash > 0 && e.hp < e.maxHp * 0.75 && Math.random() < 0.12) {
            e.isStoneForm = true;
            e.stoneFormTimer = 110;
            playSfx('hit');
            triggerShake(2);
            createHitParticles(e.x, e.y, '#95a5a6', 10);
            addDamageText(e.x, e.y, "PETRIFICAÇÃO!", false, '#bdc3c7');
          }
        }
      } else if (e.behavior === 'haste_chanter') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (distToPlayerSq < 160 * 160) {
          e.x -= Math.cos(angle) * curSpeed * dt;
          e.y -= Math.sin(angle) * curSpeed * dt;
        } else if (distToPlayerSq > 240 * 240) {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        }
        e.bellTimer = (e.bellTimer || 0) + dt;
        if (e.bellTimer >= 140) {
          e.bellTimer = 0;
          playSfx('chest_rare');
          triggerShake(3);
          createHitParticles(e.x, e.y, '#f1c40f', 12);
          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 10,
            maxRadius: 150,
            speed: 4.5,
            damage: 0,
            hitPlayer: false
          });
          const neighbors = getNeighborIndices(e.x, e.y, 150);
          for (let k = 0; k < neighbors.length; k++) {
            const ally = enemies[neighbors[k]];
            if (ally && ally !== e && !ally.isBoss) {
              ally.speed = (ally.baseSpeed || ally.speed) * 1.4;
              ally.hasteTimer = 110;
              createHitParticles(ally.x, ally.y, '#f1c40f', 2);
            }
          }
          addDamageText(e.x, e.y, "SINO FÚNEBRE!", false, '#f39c12');
        }
      } else if (e.behavior === 'horde_mender') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (distToPlayerSq < 150 * 150) {
          e.x -= Math.cos(angle) * curSpeed * dt;
          e.y -= Math.sin(angle) * curSpeed * dt;
        } else if (distToPlayerSq > 230 * 230) {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        }
        e.apothecaryTimer = (e.apothecaryTimer || 0) + dt;
        if (e.apothecaryTimer >= 150) {
          e.apothecaryTimer = 0;
          playSfx('freeze');
          createHitParticles(e.x, e.y, '#2ecc71', 10);
          const neighbors = getNeighborIndices(e.x, e.y, 160);
          let healedAny = false;
          for (let k = 0; k < neighbors.length; k++) {
            const ally = enemies[neighbors[k]];
            if (ally && ally.hp < ally.maxHp) {
              ally.hp = Math.min(ally.maxHp, ally.hp + 120);
              ally.hitFlash = 3;
              createHitParticles(ally.x, ally.y, '#2ecc71', 3);
              healedAny = true;
            }
          }
          if (healedAny) {
            addDamageText(e.x, e.y, "UNGUENTO DA PESTE!", false, '#27ae60');
          }
        }
      } else if (e.behavior === 'barrier_linker') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (distToPlayerSq < 160 * 160) {
          e.x -= Math.cos(angle) * curSpeed * dt;
          e.y -= Math.sin(angle) * curSpeed * dt;
        } else if (distToPlayerSq > 230 * 230) {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        }
        if (!e.linkedShieldTarget || e.linkedShieldTarget.hp <= 0 || !enemies.includes(e.linkedShieldTarget)) {
          const neighbors = getNeighborIndices(e.x, e.y, 180);
          for (let k = 0; k < neighbors.length; k++) {
            const ally = enemies[neighbors[k]];
            if (ally && ally !== e && !ally.isBoss && (!ally.shieldHp || ally.shieldHp <= 0)) {
              e.linkedShieldTarget = ally;
              ally.shieldHp = 220;
              ally.maxShieldHp = 220;
              playSfx('shield');
              createHitParticles(ally.x, ally.y, '#0984e3', 6);
              addDamageText(ally.x, ally.y, "BARREIRA RÚNICA!", false, '#74b9ff');
              break;
            }
          }
        }
      } else if (e.behavior === 'flamethrower_cone') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (e.flameState === 'chase') {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
          if (distToPlayerSq <= 125 * 125) {
            e.flameState = 'aim';
            e.flameTimer = 30;
            e.flameAngle = angle;
          }
        } else if (e.flameState === 'aim') {
          e.flameTimer -= dt;
          if (e.flameTimer <= 0) {
            e.flameState = 'firing';
            e.flameTimer = 65;
            playSfx('acid');
          }
        } else if (e.flameState === 'firing') {
          e.flameTimer -= dt;
          if (Math.floor(frameCount) % 3 === 0) {
            const fSpread = (Math.random() - 0.5) * 0.6;
            const fDist = 28 + Math.random() * 85;
            const fx = e.x + Math.cos(e.flameAngle + fSpread) * fDist;
            const fy = e.y + Math.sin(e.flameAngle + fSpread) * fDist;
            createHitParticles(fx, fy, Math.random() < 0.5 ? '#e67e22' : '#d35400', 2);
          }
          if (distToPlayerSq <= 115 * 115) {
            const playerAngleFromMob = Math.atan2(player.y - e.y, player.x - e.x);
            let angleDiff = Math.abs(playerAngleFromMob - e.flameAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
            if (angleDiff < 0.52 && player.iFrames <= 0) {
              player.hp -= 5;
              player.iFrames = 14;
              triggerShake(2);
              playSfx('hit');
              lastAttackerName = "Lança-Chamas da Forja"; if (setLastAttackerName) setLastAttackerName("Lança-Chamas da Forja");
              addDamageText(player.x, player.y, "-5", false, '#e67e22');
              createHitParticles(player.x, player.y, '#e67e22', 3);
              if (player.hp <= 0) {
                player.hp = 0;
                triggerDeath(); return { playerDied: true };
              }
            }
          }
          if (e.flameTimer <= 0) {
            e.flameState = 'cooldown';
            e.flameTimer = 55;
          }
        } else if (e.flameState === 'cooldown') {
          e.flameTimer -= dt;
          e.x += Math.cos(angle) * curSpeed * 0.4 * dt;
          e.y += Math.sin(angle) * curSpeed * 0.4 * dt;
          if (e.flameTimer <= 0) {
            e.flameState = 'chase';
          }
        }
      } else if (e.behavior === 'spike_retaliation') {
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
        if (e.hitFlash === 3) {
          e.spikeHits = (e.spikeHits || 0) + 1;
          if (e.spikeHits >= 5 && canSpawnEnemyBullet()) {
            e.spikeHits = 0;
            playSfx('crit');
            triggerShake(3);
            for (let s = 0; s < 8; s++) {
              const sa = s * (Math.PI * 2 / 8);
              enemyBullets.push({
                x: e.x + Math.cos(sa) * 12,
                y: e.y + Math.sin(sa) * 12,
                vx: Math.cos(sa) * 3.8,
                vy: Math.sin(sa) * 3.8,
                radius: 4.5,
                damage: 12,
                life: 55,
                bulletType: 'THORN_SPIKE',
                color: '#8e44ad'
              });
            }
            createHitParticles(e.x, e.y, '#8e44ad', 10);
            addDamageText(e.x, e.y, "ESP茫OS!", false, '#e056fd');
          }
        }
      } else if (e.behavior === 'mirror_decoy') {
        if (e.isDecoy) {
          e.decoyLife = (e.decoyLife || 180) - dt;
          if (e.decoyLife <= 0 || e.hp <= 0) {
            e.hp = 0;
            createHitParticles(e.x, e.y, '#a29bfe', 6);
          }
        }
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
        if (e.hitFlash > 0 && !e.hasMirrored && !e.isDecoy) {
          e.hasMirrored = true;
          playSfx('warp');
          createHitParticles(e.x, e.y, '#a29bfe', 10);
          addDamageText(e.x, e.y, "ILUSÃO!", false, '#a29bfe');
          for (let d = 0; d < 2; d++) {
            const da = angle + (d === 0 ? 1 : -1) * 0.9;
            const decoyMob = createEnemy('MIRROR_BANSHEE', e.x + Math.cos(da) * 30, e.y + Math.sin(da) * 30, false);
            decoyMob.isDecoy = true;
            decoyMob.decoyLife = 180;
            decoyMob.hp = 35;
            decoyMob.maxHp = 35;
            enemies.push(decoyMob);
          }
        }
      } else if (e.behavior === 'lance_charge') {
        if (e.lanceState === 'chase') {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
          e.lanceTimer = (e.lanceTimer || 0) + dt;
          const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
          if (e.lanceTimer >= 90 && distToPlayerSq <= 240 * 240) {
            e.lanceState = 'aim';
            e.lanceTimer = 26;
            e.lanceAngle = angle;
            playSfx('boss');
          }
        } else if (e.lanceState === 'aim') {
          e.lanceTimer -= dt;
          if (e.lanceTimer <= 0) {
            e.lanceState = 'charging';
            e.lanceTimer = 20;
            playSfx('crit');
            triggerShake(4);
          }
        } else if (e.lanceState === 'charging') {
          curSpeed = e.speed * 4.2;
          e.x += Math.cos(e.lanceAngle) * curSpeed * dt;
          e.y += Math.sin(e.lanceAngle) * curSpeed * dt;
          createHitParticles(e.x, e.y, '#2c3e50', 2);
          e.lanceTimer -= dt;
          const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
          if (distToPlayerSq <= (e.radius + player.radius + 6) ** 2 && player.iFrames <= 0) {
            player.hp -= e.damage;
            player.iFrames = 22;
            lastAttackerName = "Cavaleiro Sem Cabeça"; if (setLastAttackerName) setLastAttackerName("Cavaleiro Sem Cabeça");
            triggerShake(7);
            playSfx('hit');
            addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#2c3e50');
            createHitParticles(player.x, player.y, '#ff4757', 6);
            if (player.hp <= 0) {
              player.hp = 0;
              triggerDeath(); return { playerDied: true };
            }
          }
          if (e.lanceTimer <= 0) {
            e.lanceState = 'cooldown';
            e.lanceTimer = 40;
          }
        } else if (e.lanceState === 'cooldown') {
          e.lanceTimer -= dt;
          e.x += Math.cos(angle) * curSpeed * 0.3 * dt;
          e.y += Math.sin(angle) * curSpeed * 0.3 * dt;
          if (e.lanceTimer <= 0) {
            e.lanceState = 'chase';
            e.lanceTimer = 0;
          }
        }
      } else if (e.behavior === 'long_range_sniper') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (distToPlayerSq < 220 * 220) {
          e.x -= Math.cos(angle) * curSpeed * dt;
          e.y -= Math.sin(angle) * curSpeed * dt;
        } else if (distToPlayerSq > 300 * 300) {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        }
        e.sniperAimAngle = angle;
        e.sniperTimer = (e.sniperTimer || 0) + dt;
        if (e.sniperTimer >= 140) {
          e.sniperTimer = 0;
          if (canSpawnEnemyBullet()) {
            playSfx('shoot');
            enemyBullets.push({
              x: e.x + Math.cos(e.sniperAimAngle) * 16,
              y: e.y + Math.sin(e.sniperAimAngle) * 16,
              vx: Math.cos(e.sniperAimAngle) * 6.8,
              vy: Math.sin(e.sniperAimAngle) * 6.8,
              radius: 5,
              damage: e.damage,
              life: 110,
              bulletType: 'SNIPER_ARROW',
              color: '#9c88ff'
            });
            createHitParticles(e.x, e.y, '#9c88ff', 6);
            addDamageText(e.x, e.y, "TIRO PRECISO!", false, '#9c88ff');
          }
        }
      } else if (e.behavior === 'xp_devourer') {
        let nearestGem = null;
        let nearestDistSq = 250 * 250;
        for (let g = 0; g < gems.length; g++) {
          const gem = gems[g];
          const gdx = gem.x - e.x;
          const gdy = gem.y - e.y;
          const gdSq = gdx * gdx + gdy * gdy;
          if (gdSq < nearestDistSq) {
            nearestDistSq = gdSq;
            nearestGem = gem;
          }
        }
        if (nearestGem) {
          const gAngle = Math.atan2(nearestGem.y - e.y, nearestGem.x - e.x);
          e.x += Math.cos(gAngle) * curSpeed * 1.25 * dt;
          e.y += Math.sin(gAngle) * curSpeed * 1.25 * dt;
          if (nearestDistSq < (e.radius + nearestGem.radius + 6) ** 2) {
            const gIdx = gems.indexOf(nearestGem);
            if (gIdx !== -1) {
              gems.splice(gIdx, 1);
              e.eatenGemsCount = (e.eatenGemsCount || 0) + 1;
              e.maxHp += 45;
              e.hp += 45;
              e.radius = Math.min(24, e.radius + 0.8);
              createHitParticles(e.x, e.y, '#00d2d3', 4);
              playSfx('hit');
              addDamageText(e.x, e.y, "ÉTER DEVORADO!", false, '#00d2d3');
            }
          }
        } else {
          e.x -= Math.cos(angle + Math.sin(frameCount * 0.15) * 0.4) * curSpeed * 0.7 * dt;
          e.y -= Math.sin(angle + Math.sin(frameCount * 0.15) * 0.4) * curSpeed * 0.7 * dt;
        }
      } else if (e.behavior === 'corpse_eater') {
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
        e.devourTimer = (e.devourTimer || 0) + dt;
        if (e.devourTimer >= 30) {
          e.devourTimer = 0;
          for (let d = dyingEnemies.length - 1; d >= 0; d--) {
            const dead = dyingEnemies[d];
            const ddx = dead.x - e.x;
            const ddy = dead.y - e.y;
            if (ddx * ddx + ddy * ddy < 75 * 75) {
              e.gorgonStacks = Math.min(5, (e.gorgonStacks || 0) + 1);
              e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.15));
              e.damage = Math.round(e.damage * 1.08);
              e.radius = Math.min(26, e.radius + 1.2);
              createHitParticles(e.x, e.y, '#c0392b', 8);
              playSfx('hit');
              addDamageText(e.x, e.y, "CARNE DEVORADA!", false, '#e74c3c');
              dyingEnemies.splice(d, 1);
              break;
            }
          }
        }
      } else if (e.behavior === 'mimic_trap') {
        const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (!e.isAwakeMimic) {
          curSpeed = 0;
          if (distToPlayerSq < 52 * 52 || e.hitFlash > 0) {
            e.isAwakeMimic = true;
            playSfx('boss');
            triggerShake(6);
            createHitParticles(e.x, e.y, '#e056fd', 12);
            addDamageText(e.x, e.y, "MÍMICO DESPERTO!", true, '#e056fd');
          }
        } else {
          curSpeed = e.speed * 1.2;
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        }
      } else {
        // Pounce rápido da Célula Parasita (SPLITTER_MINI)
        if (e.baseType === 'SPLITTER_MINI') {
          if (e.pounceCooldown > 0) e.pounceCooldown -= dt;
          const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
          if (distToPlayerSq < 85 * 85 && distToPlayerSq > 15 * 15 && (!e.pounceCooldown || e.pounceCooldown <= 0)) {
            e.pounceCooldown = 90;
            curSpeed = e.speed * 2.6;
            createHitParticles(e.x, e.y, '#48dbfb', 3);
          }
        }
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
      }
    }

    if (e.isBoss && e.isFinalBoss && e.actionState === 'DEATH_COLLAPSE') {
      continue;
    }

    if (e.hp <= 0) {
      gameState.kills++;
      createHitParticles(e.x, e.y, e.color, 6);
      addBloodSplat(e.x, e.y);

      // Efervescência Necrótica: inimigos corroídos deixam uma poça secundária ao morrer
      if (selectedHeroKey === 'ALCHEMIST' && ((e.acidStacks && e.acidStacks > 0) || e.inAcidPuddle)) {
        acidPuddles.push({
          x: e.x,
          y: e.y,
          radius: 24,
          life: 120,
          maxLife: 120,
          isAlchemist: true,
          isEvolved: player.evolvedPotion
        });
        playSfx('acid');
        createHitParticles(e.x, e.y, '#a29bfe', 8);
      }

      if (!e.isBoss && !e.isBossSubTarget && !e.explodedNaturally) {
        const hitAng = Math.atan2(e.y - player.y, e.x - player.x);
        addDyingEnemy(e, hitAng);
      }

      if (e.fuseTelegraph) {
        const tIdx = bossTelegraphs.indexOf(e.fuseTelegraph);
        if (tIdx !== -1) bossTelegraphs.splice(tIdx, 1);
        e.fuseTelegraph = null;
      }

      if (e.eliteMod === 'TOXIC') {
        acidPuddles.push({ x: e.x, y: e.y, radius: 32, life: 340, maxLife: 340, isFire: false });
      } else if (e.eliteMod === 'FROST') {
        triggerShake(4);
        playSfx('freeze');
        createHitParticles(e.x, e.y, '#74b9ff', 14);
        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 8,
          maxRadius: 75,
          speed: 4.0,
          damage: 0,
          knockback: 5.0,
          color: '#74b9ff',
          hitPlayer: false
        });
      }

      if (e.behavior === 'kamikaze') {
        if (e.explodedNaturally) {
          playSfx('hit');
          triggerShake(9);
          triggerHaptic('heavy');
          createHitParticles(e.x, e.y, '#e67e22', 16);
          const pDistSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
          if (pDistSq <= 55 * 55 && player.iFrames <= 0) {
            player.hp -= e.damage;
            player.iFrames = 20;
            lastAttackerName = "Explosão Necrótica"; if (setLastAttackerName) setLastAttackerName("Explosão Necrótica");
            addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#e67e22');
            if (player.hp <= 0) {
              player.hp = 0;
              triggerDeath(); return { playerDied: true };
            }
          }
          // Dispersão de Estilhaços e Brasas Incandescentes
          const shrapnelCount = 4;
          for (let sIdx = 0; sIdx < shrapnelCount; sIdx++) {
            if (!canSpawnEnemyBullet()) break;
            const sAng = (sIdx * Math.PI * 0.5) + Math.random() * 0.3;
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(sAng) * 2.55,
              vy: Math.sin(sAng) * 2.55,
              radius: 4.5,
              damage: Math.round(e.damage * 0.35),
              life: 65,
              bulletType: 'FIRE_SHRAPNEL',
              color: '#e74c3c'
            });
          }
          acidPuddles.push({ x: e.x, y: e.y, radius: 24, life: 160, maxLife: 160, isFire: true });
        } else {
          playSfx('hit');
          triggerShake(10);
          triggerHaptic('medium');
          createHitParticles(e.x, e.y, '#e67e22', 18);
          createHitParticles(e.x, e.y, '#f39c12', 10);
          addDamageText(e.x, e.y, "COMBUSTÃO!", true, '#e67e22');

          const nearbyNeighbors = getNeighborIndices(e.x, e.y, 65);
          for (let nIdx = 0; nIdx < nearbyNeighbors.length; nIdx++) {
            const ally = enemies[nearbyNeighbors[nIdx]];
            if (ally && ally !== e) {
              const adx = ally.x - e.x;
              const ady = ally.y - e.y;
              const aDistSq = adx * adx + ady * ady;
              if (aDistSq <= 65 * 65) {
                const aDist = Math.sqrt(aDistSq) || 1;
                ally.hp -= 45;
                ally.hitFlash = 4;
                addDamageText(ally.x, ally.y, 45, false, '#e67e22');
                ally.x += (adx / aDist) * 24;
                ally.y += (ady / aDist) * 24;
                createHitParticles(ally.x, ally.y, '#d35400', 3);
              }
            }
          }
        }
      }

      if (e.behavior === 'kamikaze_spread') {
        if (e.explodedNaturally) {
          playSfx('hit');
          triggerShake(12);
          triggerHaptic('heavy');
          createHitParticles(e.x, e.y, '#e67e22', 16);
          const pDistSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
          if (pDistSq <= 60 * 60 && player.iFrames <= 0) {
            player.hp -= e.damage;
            player.iFrames = 25;
            lastAttackerName = "Estilhaço Suicida"; if (setLastAttackerName) setLastAttackerName("Estilhaço Suicida");
            triggerShake(9);
            playSfx('hit');
            addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#e67e22');
            if (player.hp <= 0) {
              player.hp = 0;
              triggerDeath(); return { playerDied: true };
            }
          }
          const spreadCount = 8;
          for (let bIdx = 0; bIdx < spreadCount; bIdx++) {
            if (!canSpawnEnemyBullet()) break;
            const bAng = (bIdx * Math.PI * 2) / spreadCount;
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(bAng) * 3.0,
              vy: Math.sin(bAng) * 3.0,
              radius: 5,
              damage: Math.round(e.damage * 0.35),
              life: 80,
              bulletType: 'FIRE_SHRAPNEL',
              color: '#e74c3c'
            });
          }
        } else {
          playSfx('hit');
          triggerShake(11);
          triggerHaptic('medium');
          createHitParticles(e.x, e.y, '#e67e22', 20);
          createHitParticles(e.x, e.y, '#d35400', 12);
          addDamageText(e.x, e.y, "COMBUSTÃO!", true, '#e67e22');

          const nearbyNeighbors = getNeighborIndices(e.x, e.y, 80);
          for (let nIdx = 0; nIdx < nearbyNeighbors.length; nIdx++) {
            const ally = enemies[nearbyNeighbors[nIdx]];
            if (ally && ally !== e) {
              const adx = ally.x - e.x;
              const ady = ally.y - e.y;
              const aDistSq = adx * adx + ady * ady;
              if (aDistSq <= 80 * 80) {
                const aDist = Math.sqrt(aDistSq) || 1;
                ally.hp -= 60;
                ally.hitFlash = 4;
                addDamageText(ally.x, ally.y, 60, false, '#e67e22');
                ally.x += (adx / aDist) * 28;
                ally.y += (ady / aDist) * 28;
                createHitParticles(ally.x, ally.y, '#d35400', 4);
              }
            }
          }
        }
      }

      if (e.behavior === 'splitter') {
        // Poça Cáustica Residual e Espículas Ácidas
        acidPuddles.push({ x: e.x, y: e.y, radius: 36, life: 180, maxLife: 180, isCaustic: true, isFire: false });
        playSfx('acid');
        createHitParticles(e.x, e.y, '#ff4757', 10);

        for (let aIdx = 0; aIdx < 4; aIdx++) {
          if (!canSpawnEnemyBullet()) break;
          const aAng = (aIdx * Math.PI * 0.5) + Math.PI * 0.25;
          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(aAng) * 2.625,
            vy: Math.sin(aAng) * 2.625,
            radius: 5,
            damage: Math.round(e.damage * 0.45),
            life: 60,
            bulletType: 'ACID_SPIT',
            color: '#ff4757'
          });
        }

        for (let k = 0; k < 2; k++) {
          const subT = ENEMY_TYPES.SPLITTER_MINI;
          enemies.push({
            x: e.x + (k === 0 ? -12 : 12),
            y: e.y + (Math.random() - 0.5) * 12,
            baseType: 'SPLITTER_MINI',
            radius: subT.radius,
            speed: subT.speed,
            hp: subT.hp,
            maxHp: subT.hp,
            color: subT.color,
            damage: subT.damage,
            behavior: subT.behavior,
            xp: subT.xp,
            facing: 1,
            hitFlash: 0,
            orbitalHitCd: 0,
            slowTimer: 0,
            slowFactor: 0,
            stunTimer: 0,
            emergeTimer: 20,
            emergeDuration: 20,
            combatState: 'CHASE',
            attackTimer: 0,
            attackRange: 24,
            attackWindupFrames: 18,
            attackStrikeFrames: 4,
            attackRecoveryFrames: 35,
            attackCooldown: 0,
            attackCooldownMax: 25,
            attackAngle: 0,
            hasHitInStrike: false,
            fuseState: 'CHASE',
            fuseTimer: 0,
            fuseTelegraph: null,
            explodedNaturally: false
          });
        }
      }

      if (!e.isMiniBoss && (Math.random() < 0.28 || e.isElite)) {
        const goldVal = e.isElite ? 5 : 1;
        addPersistentGold(goldVal);
      }

      if (e.isBoss) {
        if (e.isFinalBoss) {
          if (e.actionState !== 'DEATH_COLLAPSE') {
            e.hp = 0;
            e.actionState = 'DEATH_COLLAPSE';
            recordCreatureKill('BOSS_' + (e.bossId || 4));
            e.defeatTimer = 540; // ~9 segundos a 60 FPS
            e.defeatMaxTimer = 540;
            e.isTargetable = false;
            e.isVulnerable = false;
            e.currentSkill = null;
            e.windupTimer = 0;
            e.castDuration = 0;
            player.iFrames = 999999;
            setIsWavePaused(true);

            for (let k = 0; k < 4; k++) {
              const bAngle = (k * Math.PI * 2) / 4;
              createHitParticles(e.x + Math.cos(bAngle) * 36, e.y + Math.sin(bAngle) * 36, '#e056fd', 8);
            }

            const bossGold = 120 * (e.bossId || 1);
            addPersistentGold(bossGold);
            addDamageText(e.x, e.y - 18, `+${bossGold} OURO!`, true, '#f1c40f');

            onBossDefeated(seconds);

            // Guarda métricas consolidadas da vitória para o Banner Dourado
            const timerElem = document.getElementById('timer-val');
            e.victoryStats = {
              time: timerElem ? timerElem.innerText : '00:00',
              kills: gameState.kills || 0,
              level: player.level || 1,
              gold: getPersistentGold() || 0
            };

            // Hit-stop dramático no frame de abate fatal
            freezeTimer = 16; if (setFreezeTimer) setFreezeTimer(16);
            triggerShake(26);
            triggerHaptic('heavy');
            playSfx('shatter');
            playSfx('crit');

            // Limpa perigos residuais e outros monstros comuns da arena
            for (let rem = enemies.length - 1; rem >= 0; rem--) {
              if (enemies[rem] !== e) enemies.splice(rem, 1);
            }
            enemyBullets.length = 0;
            bossTelegraphs.length = 0;
            bossProjectiles.length = 0;
            bossShockwaves.length = 0;
            voidVortices.length = 0;

            const bossHpFill = document.getElementById('boss-hp-fill');
            if (bossHpFill) {
              bossHpFill.style.transition = 'none';
              bossHpFill.style.width = '0%';
            }
            const bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
            if (bossHpGhostFill) {
              bossHpGhostFill.style.transition = 'none';
              bossHpGhostFill.style.width = '0%';
            }
            if (resetBossGhostHp) resetBossGhostHp();
            const bossHpVal = document.getElementById('boss-hp-val');
            if (bossHpVal) bossHpVal.innerText = 'EXPURGADO';
          }
          return { playerDied: false };
        }

        triggerShake(20);
        triggerHaptic('heavy');

        if (e.bossId === 1) setFirstBossKilled(true);
        
        const bossXp = e.xp || 400;
        
        // Registra o contexto de vitória contra o chefe para exibição destacada na tela de bênçãos
        setBossRewardContext(e.name, e.bossId);
        addXP(bossXp);
        
        // Garante no mínimo 2 upgrades para o 1º chefe e 3 para os chefes avançados
        const minBossUpgrades = (e.bossId === 1) ? 2 : 3;
        ensureBossUpgradeCount(minBossUpgrades);

        for (let k = 0; k < 4; k++) {
          const bAngle = (k * Math.PI * 2) / 4;
          createHitParticles(e.x + Math.cos(bAngle) * 36, e.y + Math.sin(bAngle) * 36, '#e056fd', 8);
        }

        const bossGold = 120 * (e.bossId || 1);
        addPersistentGold(bossGold);
        addDamageText(e.x, e.y - 18, `+${bossGold} OURO!`, true, '#f1c40f');

        onBossDefeated(seconds);

        // Garante que o jogador veja a barra zerar explicitamente (0%) no instante do abate
        const bossHpFill = document.getElementById('boss-hp-fill');
        if (bossHpFill) {
          bossHpFill.style.transition = 'none';
          bossHpFill.style.width = '0%';
        }
        const bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
        if (bossHpGhostFill) {
          bossHpGhostFill.style.transition = 'none';
          bossHpGhostFill.style.width = '0%';
        }
        if (resetBossGhostHp) resetBossGhostHp();
        const bossHpVal = document.getElementById('boss-hp-val');
        if (bossHpVal) bossHpVal.innerText = '0%';

        spawnChest(e.x, e.y, 'BOSS');
        activeBoss = null; if (setActiveBoss) setActiveBoss(null);
        bossTelegraphs.length = 0;
        bossProjectiles.length = 0;
        bossShockwaves.length = 0;
        voidVortices.length = 0;
        gameState.isWavePaused = true;
        const bossHud = document.getElementById('boss-hud');
        if (bossHud) {
          setTimeout(() => {
            if (!activeBoss) bossHud.style.display = 'none';
          }, 350);
        }
      } else if (e.isMiniBoss) {
        triggerShake(10);
        triggerHaptic('medium');
        playSfx('crit');

        const goldEarned = e.goldReward || 25;
        addPersistentGold(goldEarned);
        addDamageText(e.x, e.y - 18, `+${goldEarned} OURO!`, true, '#f1c40f');

        gems.push({
          x: e.x,
          y: e.y,
          radius: 11,
          color: '#f1c40f',
          value: e.xp || 60,
          isSuper: true,
          forcedPull: true,
          pulseOffset: 0
        });

        if (e.behavior === 'splitter_queen' || e.baseType === 'BROOD_MATRIARCH') {
          for (let k = 0; k < 3; k++) spawnMobCluster('SPLITTER', 1);
          acidPuddles.push({ x: e.x, y: e.y, radius: 32, life: 240, maxLife: 240, isFire: false });
        } else if (e.baseType === 'MOBILE_HIVE') {
          spawnMobCluster('BAT', 3);
        } else if (e.baseType === 'FIRE_INCINERATOR') {
          acidPuddles.push({ x: e.x, y: e.y, radius: 30, life: 200, maxLife: 200, isFire: true });
        }

        if (Math.random() < 0.40) {
          spawnChest(e.x, e.y, 'MINI_BOSS');
        }
      } else {
        if (e.baseType === 'VOID_SCAVENGER') {
          const eatenBonus = (e.eatenGemsCount || 0) * 6;
          const totalVal = Math.round((e.xp + eatenBonus) * 1.5);
          gems.push({
            x: e.x,
            y: e.y,
            radius: 9.5,
            color: '#00d2d3',
            value: totalVal,
            isSuper: true,
            forcedPull: true,
            pulseOffset: 0
          });
          const bonusGold = 4 + (e.eatenGemsCount || 0) * 2;
          addPersistentGold(bonusGold);
          addDamageText(e.x, e.y - 12, `+${bonusGold} OURO!`, false, '#f1c40f');
        } else if (e.baseType === 'CURSED_CHEST') {
          addPersistentGold(35);
          spawnChest(e.x, e.y, 'MINI_BOSS');
          addDamageText(e.x, e.y - 15, "+35 OURO & BAÚ!", true, '#e056fd');
        } else if (e.baseType === 'TRAIL_CRAWLER') {
          acidPuddles.push({ x: e.x, y: e.y, radius: 24, life: 160, maxLife: 160, isCaustic: true, isFire: false });
        } else {
          const gCfg = getGemConfig(e.xp);
          gems.push({
            x: e.x,
            y: e.y,
            radius: gCfg.radius,
            color: gCfg.color,
            value: e.xp,
            isSuper: gCfg.isSuper,
            pulseOffset: Math.random() * Math.PI * 2
          });
        }

        if (e.baseType === 'MIRROR_BANSHEE' && !e.isDecoy) {
          for (let rem = enemies.length - 1; rem >= 0; rem--) {
            if (enemies[rem].isDecoy && enemies[rem].baseType === 'MIRROR_BANSHEE') {
              enemies[rem].hp = 0;
            }
          }
        }
      }

      const creatureKey = e.isBoss ? ('BOSS_' + e.bossId) : (e.baseType || e.type || 'ZOMBIE');
      recordCreatureKill(creatureKey);

      playSfx('kill');
      enemies.splice(i, 1);
    }
  }

  processEnemyMeleeAttacks(player, enemies, dt);
  return { playerDied: false };
}
