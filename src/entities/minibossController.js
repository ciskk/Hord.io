/**
 * src/entities/minibossController.js
 *
 * Módulo especializado e modular de IA, FSM (Máquina de Estados Finita),
 * rotações de habilidades e telegrafias dos 16 Minibosses de Hord.io.
 */
import { playSfx, triggerHaptic } from '../core/audio.js';
import { vecDist, vecDistSq, clamp } from '../core/math.js';
import { spawnMobCluster } from './enemies.js';

/**
 * Utilitário para tocar som de aviso ou impacto com segurança
 */
function safePlaySfx(name) {
  try { playSfx(name); } catch (e) {}
}

/**
 * Dispara o estado de Fúria (<50% HP) com feedback visual e sonoro.
 */
function checkEnrage(e, context) {
  if (!e.enraged && e.hp <= e.maxHp * 0.5) {
    e.enraged = true;
    e.hitFlash = 6;
    safePlaySfx('boss');
    if (context.triggerShake) context.triggerShake(7);
    if (context.addDamageText) context.addDamageText(e.x, e.y - 24, "FÚRIA!", true, '#e74c3c');
    if (context.createHitParticles) context.createHitParticles(e.x, e.y, '#e74c3c', 16);
  }
}

/**
 * Dicionário de Lógicas e Rotações dos 16 Arquétipos de Minibosses.
 */
const MINIBOSS_HANDLERS = {

  // 1. GÁRGULA DE SANGUE (Onda 2)
  BLOOD_GARGOYLE: {
    init(e) {
      e.skillCooldown = 70;
      e.diveBombCount = 0;
      e.isAirborne = false;
      e.isStoneForm = false;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, bossTelegraphs, bossShockwaves, enemyBullets, createHitParticles } = ctx;

      // Habilidade especial única: Forma de Pedra aos <40% HP
      if (e.hp <= e.maxHp * 0.4 && !e.hasUsedStoneForm && e.actionState === 'CHASE') {
        e.hasUsedStoneForm = true;
        e.currentSkill = 'STONE_FORM';
        e.actionState = 'WINDUP';
        e.actionTimer = 80;
        e.actionMaxTimer = 80;
        e.isStoneForm = true;
        safePlaySfx('freeze');
        ctx.addDamageText(e.x, e.y, "PETRIFICAÇÃO!", true, '#7f8c8d');
        return;
      }

      if (e.actionState === 'CHASE') {
        // Movimento ágil de perseguição aérea
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          const rand = Math.random();
          if (rand < 0.55 || dist > 200) {
            // Rasante Predatório (Dive-Bomb)
            e.currentSkill = 'DIVE_BOMB';
            e.actionState = 'WINDUP';
            e.actionTimer = e.enraged ? 35 : 45;
            e.actionMaxTimer = e.actionTimer;
            e.targetX = player.x;
            e.targetY = player.y;
            e.isAirborne = true;
            safePlaySfx('warp');

            bossTelegraphs.push({
              type: 'FALLING_ROCK',
              x: e.targetX,
              y: e.targetY,
              radius: 65,
              timer: e.actionTimer,
              maxTimer: e.actionTimer,
              damage: Math.round(e.damage * 1.3),
              color: '#c0392b'
            });
          } else {
            // Vômito Hemático (Blood Volley)
            e.currentSkill = 'BLOOD_VOLLEY';
            e.actionState = 'WINDUP';
            e.actionTimer = 24;
            e.actionMaxTimer = 24;
            e.aimAngle = angle;
            safePlaySfx('charge');
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);

        if (e.currentSkill === 'STONE_FORM') {
          // Cura 15% gradualmente e armadura extrema
          e.hp = Math.min(e.maxHp, e.hp + (e.maxHp * 0.15) * (dt / 80));
          if (Math.floor(dt * 60) % 6 === 0) {
            createHitParticles(e.x, e.y, '#95a5a6', 2);
          }
        } else if (e.currentSkill === 'DIVE_BOMB') {
          // Desloca-se voando alto em direção ao ponto de impacto
          const toTargetAng = Math.atan2(e.targetY - e.y, e.targetX - e.x);
          e.x += Math.cos(toTargetAng) * e.speed * 2.2 * dt;
          e.y += Math.sin(toTargetAng) * e.speed * 2.2 * dt;
        }

        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'DIVE_BOMB') {
          e.isAirborne = false;
          e.x = e.targetX;
          e.y = e.targetY;
          safePlaySfx('boss');
          ctx.triggerShake(9);
          createHitParticles(e.x, e.y, '#c0392b', 18);

          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 10,
            maxRadius: 75,
            speed: 4.5,
            damage: Math.round(e.damage * 0.7),
            hitPlayer: false,
            colorRgb: '192, 57, 43'
          });

          // Dispersão de 4 projéteis de sangue
          for (let k = 0; k < 4; k++) {
            const bAng = (k * Math.PI * 0.5) + Math.PI * 0.25;
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(bAng) * 3.8,
              vy: Math.sin(bAng) * 3.8,
              radius: 5,
              damage: Math.round(e.damage * 0.4),
              life: 70,
              bulletType: 'BLOOD',
              color: '#c0392b'
            });
          }
        } else if (e.currentSkill === 'BLOOD_VOLLEY') {
          safePlaySfx('shoot');
          createHitParticles(e.x, e.y, '#e74c3c', 8);
          // 3 projéteis em leque perfurante
          for (let k = -1; k <= 1; k++) {
            const bAng = e.aimAngle + k * 0.22;
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(bAng) * 4.6,
              vy: Math.sin(bAng) * 4.6,
              radius: 5.5,
              damage: Math.round(e.damage * 0.45),
              life: 80,
              bulletType: 'BLOOD',
              color: '#ff4757'
            });
          }
        } else if (e.currentSkill === 'STONE_FORM') {
          e.isStoneForm = false;
          safePlaySfx('crit');
          createHitParticles(e.x, e.y, '#2ecc71', 12);
        }

        e.actionState = 'RECOVERY';
        e.actionTimer = e.enraged ? 20 : 32;
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        e.x += Math.cos(angle) * e.speed * 0.3 * dt;
        e.y += Math.sin(angle) * e.speed * 0.3 * dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 45 : 70;
        }
      }
    }
  },

  // 2. ZUMBI ALFA (Onda 2)
  ZOMBIE_ALPHA: {
    init(e) {
      e.skillCooldown = 80;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, enemies, bossShockwaves, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        const speedBonus = e.enraged ? 1.3 : 1.0;
        e.x += Math.cos(angle) * e.speed * speedBonus * dt;
        e.y += Math.sin(angle) * e.speed * speedBonus * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          if (dist < 140) {
            // Bote Esmagador
            e.currentSkill = 'POUNCE';
            e.actionState = 'WINDUP';
            e.actionTimer = 28;
            e.actionMaxTimer = 28;
            e.pounceAngle = angle;
            safePlaySfx('charge');
            ctx.addDamageText(e.x, e.y, "BOTE!", true, '#27ae60');
          } else {
            // Rugido de Guerra Alfa
            e.currentSkill = 'HOWL';
            e.actionState = 'WINDUP';
            e.actionTimer = 32;
            e.actionMaxTimer = 32;
            safePlaySfx('boss');
            ctx.addDamageText(e.x, e.y, "RUGIDO ALFA!", true, '#2ecc71');
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        // Treme e desacelera
        e.x += (Math.random() - 0.5) * 1.5;
        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'POUNCE') {
          safePlaySfx('crit');
          ctx.triggerShake(7);
          e.x += Math.cos(e.pounceAngle) * 55;
          e.y += Math.sin(e.pounceAngle) * 55;
          createHitParticles(e.x, e.y, '#27ae60', 14);

          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 12,
            maxRadius: 75,
            speed: 4.5,
            damage: Math.round(e.damage * 0.9),
            hitPlayer: false,
            colorRgb: '39, 174, 96'
          });
        } else if (e.currentSkill === 'HOWL') {
          safePlaySfx('boss');
          ctx.triggerShake(6);
          createHitParticles(e.x, e.y, '#2ecc71', 20);

          // Pulso visual que acelera os zumbis ao redor
          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 15,
            maxRadius: 180,
            speed: 5.5,
            damage: 0,
            hitPlayer: false,
            colorRgb: '46, 204, 113'
          });

          // Concede fúria temporária para zumbis aliados próximos
          for (let i = 0; i < enemies.length; i++) {
            const ally = enemies[i];
            if (ally && ally !== e && ally.baseType === 'ZOMBIE') {
              const aDistSq = vecDistSq(e.x, e.y, ally.x, ally.y);
              if (aDistSq < 180 * 180) {
                ally.speed = Math.min(ally.baseSpeed * 1.45, 2.5);
                ally.hitFlash = 3;
                createHitParticles(ally.x, ally.y, '#2ecc71', 2);
              }
            }
          }
        }
        e.actionState = 'RECOVERY';
        e.actionTimer = e.enraged ? 20 : 35;
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        e.x += Math.cos(angle) * e.speed * 0.4 * dt;
        e.y += Math.sin(angle) * e.speed * 0.4 * dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 50 : 85;
        }
      }
    }
  },

  // 3. CENTURIÃO DA GUARDA (Onda 3)
  PHALANX_LEADER: {
    init(e) {
      e.skillCooldown = 75;
      e.hasFrontalShield = true;
      e.hasSpawnedGuards = false;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, bossTelegraphs, createHitParticles } = ctx;

      // Invocação de Guardas aos <50% HP
      if (e.enraged && !e.hasSpawnedGuards && e.actionState === 'CHASE') {
        e.hasSpawnedGuards = true;
        safePlaySfx('boss');
        ctx.addDamageText(e.x, e.y, "FORMAÇÃO!", true, '#f1c40f');
        spawnMobCluster('SHIELDED', 2);
      }

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          if (dist > 110 && dist < 280) {
            // Investida com Escudo (Shield Bash Rush)
            e.currentSkill = 'SHIELD_CHARGE';
            e.actionState = 'WINDUP';
            e.actionTimer = 34;
            e.actionMaxTimer = 34;
            e.chargeAngle = angle;
            safePlaySfx('charge');

            bossTelegraphs.push({
              type: 'MIST_DASH_LANE',
              x: e.x,
              y: e.y,
              angle: e.chargeAngle,
              length: 190,
              width: 50,
              timer: 34,
              maxTimer: 34
            });
          } else {
            // Estocada Perfurante de Lança (Spear Thrust)
            e.currentSkill = 'SPEAR_THRUST';
            e.actionState = 'WINDUP';
            e.actionTimer = 26;
            e.actionMaxTimer = 26;
            e.thrustAngle = angle;
            safePlaySfx('charge');

            bossTelegraphs.push({
              type: 'SCYTHE_CLEAVE',
              x: e.x,
              y: e.y,
              radius: 95,
              angle: e.thrustAngle,
              arcHalf: Math.PI * 0.18,
              timer: 26,
              maxTimer: 26,
              damage: Math.round(e.damage * 1.2),
              color: '#f1c40f',
              colorRgb: '241, 196, 15'
            });
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        e.x += Math.cos(angle) * e.speed * 0.2 * dt;
        e.y += Math.sin(angle) * e.speed * 0.2 * dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
          e.strikeDuration = (e.currentSkill === 'SHIELD_CHARGE') ? 14 : 4;
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'SHIELD_CHARGE') {
          // Deslocamento fulminante da investida
          const chargeSpeed = e.speed * 4.2;
          e.x += Math.cos(e.chargeAngle) * chargeSpeed * dt;
          e.y += Math.sin(e.chargeAngle) * chargeSpeed * dt;
          createHitParticles(e.x, e.y, '#f1c40f', 2);

          // Checagem de impacto contra o jogador
          const pDist = vecDist(e.x, e.y, player.x, player.y);
          if (pDist < e.radius + player.radius && player.iFrames <= 0) {
            player.hp -= Math.round(e.damage * 0.85);
            player.iFrames = 24;
            ctx.triggerShake(9);
            safePlaySfx('hit');
            triggerHaptic('heavy');
            // Knockback massivo
            player.x += Math.cos(e.chargeAngle) * 35;
            player.y += Math.sin(e.chargeAngle) * 35;
            ctx.addDamageText(player.x, player.y, `-${Math.round(e.damage * 0.85)}`, true, '#f1c40f');
          }
        }

        e.strikeDuration -= dt;
        if (e.strikeDuration <= 0) {
          e.actionState = 'RECOVERY';
          e.actionTimer = 28;
        }
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        e.x += Math.cos(angle) * e.speed * 0.3 * dt;
        e.y += Math.sin(angle) * e.speed * 0.3 * dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 45 : 75;
        }
      }
    }
  },

  // 4. DEMOLIDOR SÍSMICO (Onda 3)
  SEISMIC_SMASHER: {
    init(e) {
      e.skillCooldown = 85;
    },
    update(e, dt, ctx, dist, angle) {
      const { bossTelegraphs, bossShockwaves, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          e.currentSkill = 'GROUND_POUND';
          e.actionState = 'WINDUP';
          e.actionTimer = e.enraged ? 36 : 48;
          e.actionMaxTimer = e.actionTimer;
          safePlaySfx('charge');
          ctx.addDamageText(e.x, e.y, "CARGA SÍSMICA!", true, '#95a5a6');

          // Telégrafo circular de aviso no solo
          bossTelegraphs.push({
            x: e.x,
            y: e.y,
            radius: 95,
            timer: e.actionTimer,
            maxTimer: e.actionTimer,
            damage: e.damage,
            color: '#95a5a6'
          });
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        // Vibração dos martelos
        e.x += (Math.random() - 0.5) * 2;
        e.y += (Math.random() - 0.5) * 2;

        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
        }
      } else if (e.actionState === 'STRIKE') {
        safePlaySfx('boss');
        ctx.triggerShake(10);
        createHitParticles(e.x, e.y, '#95a5a6', 22);

        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 12,
          maxRadius: 110,
          speed: 4.2,
          damage: e.damage,
          hitPlayer: false,
          colorRgb: '149, 165, 166'
        });

        // Onda secundária caso enfurecido
        if (e.enraged) {
          setTimeout(() => {
            bossShockwaves.push({
              x: e.x,
              y: e.y,
              radius: 14,
              maxRadius: 150,
              speed: 5.5,
              damage: Math.round(e.damage * 0.6),
              hitPlayer: false,
              colorRgb: '189, 195, 199'
            });
          }, 180);
        }

        e.actionState = 'RECOVERY';
        e.actionTimer = 35;
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 55 : 90;
        }
      }
    }
  },

  // 5. TORRE MÓVEL (Onda 4)
  ARTILLERY_MECH: {
    init(e) {
      e.skillCooldown = 70;
      e.isSiegeMode = false;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, enemyBullets, bossTelegraphs, createHitParticles } = ctx;

      // Recuo a jato defensivo se o jogador colar
      if (dist < 60 && (!e.thrusterCd || e.thrusterCd <= 0)) {
        e.thrusterCd = 140;
        e.x -= Math.cos(angle) * 75;
        e.y -= Math.sin(angle) * 75;
        safePlaySfx('warp');
        createHitParticles(e.x, e.y, '#00cec9', 10);
        ctx.addDamageText(e.x, e.y, "RECUO A JATO!", false, '#00cec9');
      }
      if (e.thrusterCd > 0) e.thrusterCd -= dt;

      if (e.actionState === 'CHASE') {
        // Mantém distância tática de 160px a 240px
        if (dist < 160) {
          e.x -= Math.cos(angle) * e.speed * dt;
          e.y -= Math.sin(angle) * e.speed * dt;
        } else if (dist > 240) {
          e.x += Math.cos(angle) * e.speed * dt;
          e.y += Math.sin(angle) * e.speed * dt;
        }

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          if (Math.random() < 0.6) {
            // Modo Cerco (Sniper Lock-On Burst)
            e.currentSkill = 'SIEGE_BURST';
            e.actionState = 'WINDUP';
            e.actionTimer = 35;
            e.actionMaxTimer = 35;
            e.isSiegeMode = true;
            e.aimAngle = angle;
            safePlaySfx('charge');
            ctx.addDamageText(e.x, e.y, "TRAVANDO MIRA!", true, '#00cec9');
          } else {
            // Salva de Mísseis
            e.currentSkill = 'MISSILE_BARRAGE';
            e.actionState = 'WINDUP';
            e.actionTimer = 30;
            e.actionMaxTimer = 30;
            safePlaySfx('shoot');

            for (let m = 0; m < 3; m++) {
              const targetOffsetX = (Math.random() - 0.5) * 60;
              const targetOffsetY = (Math.random() - 0.5) * 60;
              bossTelegraphs.push({
                type: 'FALLING_ROCK',
                x: player.x + targetOffsetX,
                y: player.y + targetOffsetY,
                radius: 40,
                timer: 30 + m * 8,
                maxTimer: 30 + m * 8,
                damage: Math.round(e.damage * 0.8),
                color: '#2980b9'
              });
            }
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        if (e.currentSkill === 'SIEGE_BURST') {
          e.aimAngle = angle;
        }
        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
          e.burstShotsLeft = 5;
          e.shotDelay = 0;
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'SIEGE_BURST') {
          e.shotDelay -= dt;
          if (e.shotDelay <= 0 && e.burstShotsLeft > 0) {
            e.shotDelay = 5;
            e.burstShotsLeft--;
            safePlaySfx('shoot');
            createHitParticles(e.x, e.y, '#00cec9', 4);
            e.x -= Math.cos(e.aimAngle) * 2.5;
            e.y -= Math.sin(e.aimAngle) * 2.5;

            const spread = (Math.random() - 0.5) * 0.14;
            const bAng = e.aimAngle + spread;
            enemyBullets.push({
              x: e.x + Math.cos(bAng) * 16,
              y: e.y + Math.sin(bAng) * 16,
              vx: Math.cos(bAng) * 5.6,
              vy: Math.sin(bAng) * 5.6,
              radius: 5,
              damage: Math.round(e.damage * 0.35),
              life: 85,
              bulletType: 'TECH',
              color: '#00cec9'
            });
          }
          if (e.burstShotsLeft <= 0) {
            e.actionState = 'RECOVERY';
            e.actionTimer = 26;
            e.isSiegeMode = false;
          }
        } else {
          e.actionState = 'RECOVERY';
          e.actionTimer = 20;
        }
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 40 : 65;
        }
      }
    }
  },

  // 6. INCINERADOR INSTÁVEL (Onda 4) - Caldeira Viva Ambulante
  FIRE_INCINERATOR: {
    init(e) {
      e.skillCooldown = 60;
      e.isFlamethrowing = false;
    },
    update(e, dt, ctx, dist, angle) {
      const { acidPuddles, bossShockwaves, enemyBullets, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          if (dist < 150) {
            // Lança-Chamas Contínuo
            e.currentSkill = 'FLAMETHROWER';
            e.actionState = 'WINDUP';
            e.actionTimer = 22;
            e.actionMaxTimer = 22;
            e.aimAngle = angle;
            safePlaySfx('charge');
            ctx.addDamageText(e.x, e.y, "LANÇA-CHAMAS!", true, '#e67e22');
          } else {
            // Purga de Vapor e Brasas
            e.currentSkill = 'STEAM_PURGE';
            e.actionState = 'WINDUP';
            e.actionTimer = 26;
            e.actionMaxTimer = 26;
            safePlaySfx('charge');
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        e.x += Math.cos(angle) * e.speed * 0.4 * dt;
        e.y += Math.sin(angle) * e.speed * 0.4 * dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
          if (e.currentSkill === 'FLAMETHROWER') {
            e.flameDuration = 40;
            e.isFlamethrowing = true;
          }
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'FLAMETHROWER') {
          e.flameDuration -= dt;
          if (Math.floor(dt * 60) % 4 === 0) {
            safePlaySfx('shoot');
            const spread = (Math.random() - 0.5) * 0.45;
            const fAng = e.aimAngle + spread;
            enemyBullets.push({
              x: e.x + Math.cos(fAng) * 14,
              y: e.y + Math.sin(fAng) * 14,
              vx: Math.cos(fAng) * 4.2,
              vy: Math.sin(fAng) * 4.2,
              radius: 6,
              damage: Math.round(e.damage * 0.28),
              life: 55,
              bulletType: 'FIRE_SHRAPNEL',
              color: '#e67e22'
            });
            createHitParticles(e.x, e.y, '#f39c12', 3);
          }

          if (e.flameDuration <= 0) {
            e.isFlamethrowing = false;
            acidPuddles.push({ x: e.x, y: e.y, radius: 26, life: 180, maxLife: 180, isFire: true });
            e.actionState = 'RECOVERY';
            e.actionTimer = 24;
          }
        } else if (e.currentSkill === 'STEAM_PURGE') {
          safePlaySfx('boss');
          ctx.triggerShake(7);
          createHitParticles(e.x, e.y, '#e67e22', 18);

          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 10,
            maxRadius: 85,
            speed: 4.8,
            damage: Math.round(e.damage * 0.5),
            hitPlayer: false,
            colorRgb: '230, 126, 34'
          });

          for (let k = 0; k < 6; k++) {
            const bAng = (k * Math.PI * 2) / 6;
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(bAng) * 3.5,
              vy: Math.sin(bAng) * 3.5,
              radius: 4.5,
              damage: Math.round(e.damage * 0.35),
              life: 65,
              bulletType: 'FIRE_SHRAPNEL',
              color: '#d35400'
            });
          }

          e.actionState = 'RECOVERY';
          e.actionTimer = 26;
        }
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 40 : 65;
        }
      }
    }
  },

  // 7. MATRIARCA PARASITA (Onda 5)
  BROOD_MATRIARCH: {
    init(e) {
      e.skillCooldown = 75;
      e.isSpawningEggs = false;
    },
    update(e, dt, ctx, dist, angle) {
      const { acidPuddles, enemyBullets, bossTelegraphs, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          const rand = Math.random();
          if (rand < 0.5) {
            // Cuspe de Casulo Ácido
            e.currentSkill = 'ACID_SPIT';
            e.actionState = 'WINDUP';
            e.actionTimer = 28;
            e.actionMaxTimer = 28;
            e.aimAngle = angle;
            safePlaySfx('charge');
            ctx.addDamageText(e.x, e.y, "CUSPE ÁCIDO!", true, '#00cec9');

            bossTelegraphs.push({
              x: ctx.player.x,
              y: ctx.player.y,
              radius: 52,
              timer: 28,
              maxTimer: 28,
              damage: Math.round(e.damage * 0.75),
              color: '#00cec9'
            });
          } else {
            // Postura de Ovos / Espinhos
            e.currentSkill = 'BROOD_EGGS';
            e.actionState = 'WINDUP';
            e.actionTimer = 34;
            e.actionMaxTimer = 34;
            e.isSpawningEggs = true;
            safePlaySfx('boss');
            ctx.addDamageText(e.x, e.y, "INCUBAÇÃO!", true, '#2ecc71');
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        e.x += Math.cos(angle) * e.speed * 0.25 * dt;
        e.y += Math.sin(angle) * e.speed * 0.25 * dt;

        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'ACID_SPIT') {
          safePlaySfx('shoot');
          createHitParticles(e.x, e.y, '#00cec9', 10);
          acidPuddles.push({
            x: ctx.player.x,
            y: ctx.player.y,
            radius: 35,
            life: 240,
            maxLife: 240,
            isFire: false
          });
        } else if (e.currentSkill === 'BROOD_EGGS') {
          e.isSpawningEggs = false;
          safePlaySfx('crit');
          createHitParticles(e.x, e.y, '#2ecc71', 14);

          for (let s = 0; s < 8; s++) {
            const sAng = (s * Math.PI * 2) / 8;
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(sAng) * 3.8,
              vy: Math.sin(sAng) * 3.8,
              radius: 4.5,
              damage: Math.round(e.damage * 0.35),
              life: 75,
              bulletType: 'CHITIN_SPIKE',
              color: '#00cec9'
            });
          }
          spawnMobCluster('SPLITTER_MINI', 2);
        }

        e.actionState = 'RECOVERY';
        e.actionTimer = 26;
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 45 : 75;
        }
      }
    }
  },

  // 8. PREDADOR ESPECTRAL (Onda 5)
  SPECTRAL_STALKER: {
    init(e) {
      e.skillCooldown = 75;
      e.isStealthed = false;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, bossTelegraphs, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          e.currentSkill = 'SHADOW_STEP';
          e.actionState = 'WINDUP';
          e.actionTimer = 38;
          e.actionMaxTimer = 38;
          e.isStealthed = true;
          safePlaySfx('warp');
          ctx.addDamageText(e.x, e.y, "CAMUFLAGEM!", true, '#6c5ce7');

          const pFacingAng = player.facing === 1 ? 0 : Math.PI;
          e.flankTargetX = player.x - Math.cos(pFacingAng) * 75;
          e.flankTargetY = player.y - Math.sin(pFacingAng) * 75;
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);

        const toFlankAng = Math.atan2(e.flankTargetY - e.y, e.flankTargetX - e.x);
        e.x += Math.cos(toFlankAng) * e.speed * 2.2 * dt;
        e.y += Math.sin(toFlankAng) * e.speed * 2.2 * dt;

        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
          e.isStealthed = false;
          safePlaySfx('crit');

          const strikeAng = Math.atan2(player.y - e.y, player.x - e.x);
          bossTelegraphs.push({
            type: 'SCYTHE_CLEAVE',
            x: e.x,
            y: e.y,
            radius: 85,
            angle: strikeAng,
            arcHalf: Math.PI * 0.35,
            timer: 18,
            maxTimer: 18,
            damage: Math.round(e.damage * 1.35),
            color: '#6c5ce7',
            colorRgb: '108, 92, 231'
          });
        }
      } else if (e.actionState === 'STRIKE') {
        createHitParticles(e.x, e.y, '#6c5ce7', 12);
        e.actionState = 'RECOVERY';
        e.actionTimer = 28;
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        e.x += Math.cos(angle) * e.speed * 0.35 * dt;
        e.y += Math.sin(angle) * e.speed * 0.35 * dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 45 : 75;
        }
      }
    }
  },

  // 9. ALTO SACERDOTE (Onda 6)
  HIGH_OCCULTIST: {
    init(e) {
      e.skillCooldown = 80;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, enemyBullets, bossTelegraphs, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        if (dist < 150) {
          e.x -= Math.cos(angle) * e.speed * dt;
          e.y -= Math.sin(angle) * e.speed * dt;
        } else if (dist > 220) {
          e.x += Math.cos(angle) * e.speed * dt;
          e.y += Math.sin(angle) * e.speed * dt;
        }

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          if (Math.random() < 0.55) {
            e.currentSkill = 'SINGULARITY';
            e.actionState = 'WINDUP';
            e.actionTimer = 44;
            e.actionMaxTimer = 44;
            e.runeX = player.x;
            e.runeY = player.y;
            safePlaySfx('singularity');
            ctx.addDamageText(e.x, e.y, "SELO ABISSAL!", true, '#341f97');

            bossTelegraphs.push({
              type: 'ABYSSAL_VOID_RIFT',
              x: e.runeX,
              y: e.runeY,
              radius: 65,
              timer: 44,
              maxTimer: 44,
              damage: Math.round(e.damage * 1.25)
            });
          } else {
            e.currentSkill = 'CURSE_ORBS';
            e.actionState = 'WINDUP';
            e.actionTimer = 26;
            e.actionMaxTimer = 26;
            safePlaySfx('charge');
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);

        if (e.currentSkill === 'SINGULARITY' && e.runeX !== undefined) {
          const rdx = e.runeX - player.x;
          const rdy = e.runeY - player.y;
          const rdist = Math.hypot(rdx, rdy);
          if (rdist < 220 && rdist > 15) {
            player.x += (rdx / rdist) * 0.9 * dt;
            player.y += (rdy / rdist) * 0.9 * dt;
          }
        }

        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'CURSE_ORBS') {
          safePlaySfx('shoot');
          createHitParticles(e.x, e.y, '#9b59b6', 10);
          for (let k = -1; k <= 1; k++) {
            const bAng = angle + k * 0.35;
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(bAng) * 3.2,
              vy: Math.sin(bAng) * 3.2,
              radius: 6,
              damage: Math.round(e.damage * 0.4),
              life: 110,
              bulletType: 'SHADOW_ORB',
              color: '#9b59b6'
            });
          }
        }
        e.actionState = 'RECOVERY';
        e.actionTimer = 28;
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 50 : 80;
        }
      }
    }
  },

  // 10. GUARDIÃO RÚNICO (Onda 6)
  RUNIC_WARDEN: {
    init(e) {
      e.skillCooldown = 75;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, bossShockwaves, bossTelegraphs, enemies, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          const rand = Math.random();
          if (rand < 0.55) {
            e.currentSkill = 'RUNIC_CAGE';
            e.actionState = 'WINDUP';
            e.actionTimer = 36;
            e.actionMaxTimer = 36;
            safePlaySfx('charge');
            ctx.addDamageText(e.x, e.y, "PRISÃO RÚNICA!", true, '#0984e3');

            bossTelegraphs.push({
              x: player.x,
              y: player.y,
              radius: 75,
              timer: 36,
              maxTimer: 36,
              damage: Math.round(e.damage * 0.8),
              color: '#0984e3'
            });
          } else {
            e.currentSkill = 'WARD_PULSE';
            e.actionState = 'WINDUP';
            e.actionTimer = 30;
            e.actionMaxTimer = 30;
            safePlaySfx('freeze');
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'WARD_PULSE') {
          safePlaySfx('freeze');
          ctx.triggerShake(5);
          createHitParticles(e.x, e.y, '#0984e3', 16);

          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 12,
            maxRadius: 140,
            speed: 5.0,
            damage: 0,
            hitPlayer: false,
            colorRgb: '9, 132, 227'
          });

          for (let i = 0; i < enemies.length; i++) {
            const ally = enemies[i];
            if (ally && ally !== e && vecDistSq(e.x, e.y, ally.x, ally.y) < 140 * 140) {
              ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * 0.15));
              ally.hitFlash = 3;
              createHitParticles(ally.x, ally.y, '#74b9ff', 3);
            }
          }
        }
        e.actionState = 'RECOVERY';
        e.actionTimer = 28;
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 45 : 75;
        }
      }
    }
  },

  // 11. COLOSSO FERRUGINOSO (Onda 7)
  RUST_COLOSSUS: {
    init(e) {
      e.skillCooldown = 80;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, bossTelegraphs, bossShockwaves, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          if (dist > 160) {
            e.currentSkill = 'BOULDER_TOSS';
            e.actionState = 'WINDUP';
            e.actionTimer = 42;
            e.actionMaxTimer = 42;
            safePlaySfx('charge');
            ctx.addDamageText(e.x, e.y, "CATAPULTA!", true, '#d35400');

            bossTelegraphs.push({
              type: 'FALLING_ROCK',
              x: player.x,
              y: player.y,
              radius: 65,
              timer: 42,
              maxTimer: 42,
              damage: Math.round(e.damage * 1.3),
              color: '#d35400'
            });
          } else {
            e.currentSkill = 'TRAIN_CHARGE';
            e.actionState = 'WINDUP';
            e.actionTimer = 34;
            e.actionMaxTimer = 34;
            e.chargeAngle = angle;
            safePlaySfx('boss');
            ctx.addDamageText(e.x, e.y, "CARGA FÉRREA!", true, '#e67e22');

            bossTelegraphs.push({
              type: 'MIST_DASH_LANE',
              x: e.x,
              y: e.y,
              angle: e.chargeAngle,
              length: 220,
              width: 55,
              timer: 34,
              maxTimer: 34
            });
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        e.x += (Math.random() - 0.5) * 1.8;
        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
          e.chargeDuration = e.currentSkill === 'TRAIN_CHARGE' ? 16 : 4;
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'TRAIN_CHARGE') {
          const speed = e.speed * 4.0;
          e.x += Math.cos(e.chargeAngle) * speed * dt;
          e.y += Math.sin(e.chargeAngle) * speed * dt;
          createHitParticles(e.x, e.y, '#d35400', 3);

          if (vecDist(e.x, e.y, player.x, player.y) < e.radius + player.radius && player.iFrames <= 0) {
            player.hp -= Math.round(e.damage * 0.9);
            player.iFrames = 25;
            ctx.triggerShake(10);
            safePlaySfx('hit');
            triggerHaptic('heavy');
            player.x += Math.cos(e.chargeAngle) * 35;
            player.y += Math.sin(e.chargeAngle) * 35;
            ctx.addDamageText(player.x, player.y, `-${Math.round(e.damage * 0.9)}`, true, '#d35400');
          }
        } else if (e.currentSkill === 'BOULDER_TOSS') {
          safePlaySfx('shoot');
          createHitParticles(e.x, e.y, '#d35400', 10);
        }

        e.chargeDuration -= dt;
        if (e.chargeDuration <= 0) {
          e.actionState = 'RECOVERY';
          e.actionTimer = 30;
        }
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 50 : 80;
        }
      }
    }
  },

  // 12. CAPITÃO DE CERCO (Onda 7)
  SIEGE_CAPTAIN: {
    init(e) {
      e.skillCooldown = 75;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, enemyBullets, bossTelegraphs, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        if (dist < 170) {
          e.x -= Math.cos(angle) * e.speed * dt;
          e.y -= Math.sin(angle) * e.speed * dt;
        } else if (dist > 250) {
          e.x += Math.cos(angle) * e.speed * dt;
          e.y += Math.sin(angle) * e.speed * dt;
        }

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          if (dist < 120) {
            e.currentSkill = 'FLAK_BLAST';
            e.actionState = 'WINDUP';
            e.actionTimer = 24;
            e.actionMaxTimer = 24;
            e.aimAngle = angle;
            safePlaySfx('charge');
            ctx.addDamageText(e.x, e.y, "METRANCAS!", true, '#b71540');
          } else {
            e.currentSkill = 'MORTAR_BARRAGE';
            e.actionState = 'WINDUP';
            e.actionTimer = 34;
            e.actionMaxTimer = 34;
            safePlaySfx('shoot');
            ctx.addDamageText(e.x, e.y, "BOMBARDEIO!", true, '#b71540');

            for (let m = 0; m < 3; m++) {
              const mAng = (m * Math.PI * 2 / 3) + Math.random() * 0.4;
              const mDist = 35 + m * 15;
              bossTelegraphs.push({
                x: player.x + Math.cos(mAng) * mDist,
                y: player.y + Math.sin(mAng) * mDist,
                radius: 50,
                timer: 34 + m * 8,
                maxTimer: 34 + m * 8,
                damage: Math.round(e.damage * 0.9),
                color: '#b71540'
              });
            }
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'FLAK_BLAST') {
          safePlaySfx('boss');
          ctx.triggerShake(7);
          createHitParticles(e.x, e.y, '#b71540', 14);

          for (let s = -3; s <= 3; s++) {
            const sAng = e.aimAngle + s * 0.14;
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(sAng) * 4.8,
              vy: Math.sin(sAng) * 4.8,
              radius: 4.5,
              damage: Math.round(e.damage * 0.35),
              life: 65,
              bulletType: 'FIRE_SHRAPNEL',
              color: '#b71540'
            });
          }
        }
        e.actionState = 'RECOVERY';
        e.actionTimer = 28;
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 45 : 75;
        }
      }
    }
  },

  // 13. NINHO MÓVEL (Onda 8)
  MOBILE_HIVE: {
    init(e) {
      e.skillCooldown = 75;
    },
    update(e, dt, ctx, dist, angle) {
      const { acidPuddles, enemyBullets, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          if (Math.random() < 0.6) {
            e.currentSkill = 'SWARM_MISSILES';
            e.actionState = 'WINDUP';
            e.actionTimer = 28;
            e.actionMaxTimer = 28;
            safePlaySfx('boss');
            ctx.addDamageText(e.x, e.y, "ENXAME!", true, '#16a085');
          } else {
            e.currentSkill = 'SMOG_CLOUD';
            e.actionState = 'WINDUP';
            e.actionTimer = 24;
            e.actionMaxTimer = 24;
            safePlaySfx('charge');
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'SWARM_MISSILES') {
          safePlaySfx('shoot');
          createHitParticles(e.x, e.y, '#16a085', 12);
          for (let m = 0; m < 4; m++) {
            const bAng = angle + (m - 1.5) * 0.28;
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(bAng) * 4.0,
              vy: Math.sin(bAng) * 4.0,
              radius: 5,
              damage: Math.round(e.damage * 0.35),
              life: 80,
              bulletType: 'BAT',
              color: '#16a085'
            });
          }
        } else if (e.currentSkill === 'SMOG_CLOUD') {
          safePlaySfx('freeze');
          acidPuddles.push({
            x: e.x,
            y: e.y,
            radius: 38,
            life: 260,
            maxLife: 260,
            isFire: false
          });
        }
        e.actionState = 'RECOVERY';
        e.actionTimer = 25;
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 45 : 75;
        }
      }
    }
  },

  // 14. FATIADOR QUÂNTICO (Onda 8)
  QUANTUM_SLICER: {
    init(e) {
      e.skillCooldown = 70;
      e.blinkCount = 0;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, bossTelegraphs, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          e.currentSkill = 'TRIPLE_BLINK';
          e.actionState = 'WINDUP';
          e.actionTimer = 18;
          e.actionMaxTimer = 18;
          e.blinkCount = 0;
          safePlaySfx('warp');
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        createHitParticles(e.x, e.y, '#a29bfe', 1);

        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
        }
      } else if (e.actionState === 'STRIKE') {
        e.blinkCount++;
        safePlaySfx('crit');
        createHitParticles(e.x, e.y, '#6c5ce7', 10);

        const flankSide = (e.blinkCount % 2 === 0 ? 1 : -1) * (Math.PI * 0.45);
        const flankAng = Math.atan2(e.y - player.y, e.x - player.x) + flankSide;
        e.x = player.x + Math.cos(flankAng) * 65;
        e.y = player.y + Math.sin(flankAng) * 65;
        createHitParticles(e.x, e.y, '#e056fd', 12);

        const cleaveAng = Math.atan2(player.y - e.y, player.x - e.x);
        bossTelegraphs.push({
          type: 'SCYTHE_CLEAVE',
          x: e.x,
          y: e.y,
          radius: 90,
          angle: cleaveAng,
          arcHalf: Math.PI * 0.35,
          timer: 16,
          maxTimer: 16,
          damage: Math.round(e.damage * 0.95),
          color: '#a29bfe',
          colorRgb: '162, 155, 254'
        });

        if (e.blinkCount < (e.enraged ? 4 : 3)) {
          e.actionState = 'WINDUP';
          e.actionTimer = 16;
          e.actionMaxTimer = 16;
        } else {
          e.actionState = 'RECOVERY';
          e.actionTimer = 32;
        }
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 40 : 70;
        }
      }
    }
  },

  // 15. PRECURSOR DO VAZIO (Onda 9)
  VOID_PRECURSOR: {
    init(e) {
      e.skillCooldown = 80;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, voidVortices, bossTelegraphs, createHitParticles } = ctx;

      if (dist < 260 && dist > 30) {
        player.x += (Math.cos(angle + Math.PI)) * 0.7 * dt;
        player.y += (Math.sin(angle + Math.PI)) * 0.7 * dt;
      }

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          if (Math.random() < 0.55) {
            e.currentSkill = 'VOID_VORTEX';
            e.actionState = 'WINDUP';
            e.actionTimer = 35;
            e.actionMaxTimer = 35;
            safePlaySfx('singularity');
            ctx.addDamageText(e.x, e.y, "VÓRTICE DO VAZIO!", true, '#8e44ad');
          } else {
            e.currentSkill = 'EVENT_HORIZON';
            e.actionState = 'WINDUP';
            e.actionTimer = 40;
            e.actionMaxTimer = 40;
            e.beamAngle = angle;
            safePlaySfx('charge');
            ctx.addDamageText(e.x, e.y, "FEIXE CÓSMICO!", true, '#9b59b6');

            bossTelegraphs.push({
              type: 'DIMENSIONAL_CLEAVE',
              x: e.x,
              y: e.y,
              angle: e.beamAngle,
              length: 650,
              width: 32,
              timer: 40,
              maxTimer: 40,
              damage: Math.round(e.damage * 1.3)
            });
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'VOID_VORTEX') {
          safePlaySfx('boss');
          ctx.triggerShake(8);
          createHitParticles(e.x, e.y, '#8e44ad', 16);

          voidVortices.push({
            x: e.x,
            y: e.y,
            radius: 70,
            life: 280,
            damage: Math.round(e.damage * 0.45)
          });
        }
        e.actionState = 'RECOVERY';
        e.actionTimer = 30;
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 50 : 80;
        }
      }
    }
  },

  // 16. ARAUTO DO CAOS (Onda 10 / Clímax)
  CHAOS_HERALD: {
    init(e) {
      e.skillCooldown = 65;
      e.cycleIndex = 0;
    },
    update(e, dt, ctx, dist, angle) {
      const { player, enemyBullets, bossTelegraphs, bossShockwaves, createHitParticles } = ctx;

      if (e.actionState === 'CHASE') {
        e.x += Math.cos(angle) * e.speed * dt;
        e.y += Math.sin(angle) * e.speed * dt;

        e.skillCooldown -= dt;
        if (e.skillCooldown <= 0) {
          e.cycleIndex = (e.cycleIndex + 1) % 3;

          if (e.cycleIndex === 0) {
            e.currentSkill = 'CHAOS_SPIRAL';
            e.actionState = 'WINDUP';
            e.actionTimer = 25;
            e.actionMaxTimer = 25;
            safePlaySfx('charge');
            ctx.addDamageText(e.x, e.y, "ESPIRAIS DO CAOS!", true, '#c0392b');
          } else if (e.cycleIndex === 1) {
            e.currentSkill = 'HELLFIRE_CHARGE';
            e.actionState = 'WINDUP';
            e.actionTimer = 32;
            e.actionMaxTimer = 32;
            e.chargeAngle = angle;
            safePlaySfx('boss');
            ctx.addDamageText(e.x, e.y, "CARGA INFERNAL!", true, '#e74c3c');

            bossTelegraphs.push({
              type: 'MIST_DASH_LANE',
              x: e.x,
              y: e.y,
              angle: e.chargeAngle,
              length: 240,
              width: 60,
              timer: 32,
              maxTimer: 32
            });
          } else {
            e.currentSkill = 'APOCALYPSE_SLAM';
            e.actionState = 'WINDUP';
            e.actionTimer = 38;
            e.actionMaxTimer = 38;
            safePlaySfx('boss');
            ctx.addDamageText(e.x, e.y, "COLAPSO DO CAOS!", true, '#c0392b');

            bossTelegraphs.push({
              x: e.x,
              y: e.y,
              radius: 120,
              timer: 38,
              maxTimer: 38,
              damage: Math.round(e.damage * 1.2),
              color: '#c0392b'
            });
          }
        }
      } else if (e.actionState === 'WINDUP') {
        e.actionTimer -= dt;
        e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
        createHitParticles(e.x, e.y, '#c0392b', 1);

        if (e.actionTimer <= 0) {
          e.actionState = 'STRIKE';
          e.chargeDuration = e.currentSkill === 'HELLFIRE_CHARGE' ? 18 : 4;
        }
      } else if (e.actionState === 'STRIKE') {
        if (e.currentSkill === 'CHAOS_SPIRAL') {
          safePlaySfx('shoot');
          const spinAng = (ctx.frameCount || 0) * 0.15;
          for (let s = 0; s < (e.enraged ? 6 : 4); s++) {
            const sOffset = spinAng + (s * Math.PI * 2) / (e.enraged ? 6 : 4);
            enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(sOffset) * 4.0,
              vy: Math.sin(sOffset) * 4.0,
              radius: 5,
              damage: Math.round(e.damage * 0.35),
              life: 85,
              bulletType: 'CHAOS',
              color: '#c0392b'
            });
          }
        } else if (e.currentSkill === 'HELLFIRE_CHARGE') {
          const speed = e.speed * 4.4;
          e.x += Math.cos(e.chargeAngle) * speed * dt;
          e.y += Math.sin(e.chargeAngle) * speed * dt;
          createHitParticles(e.x, e.y, '#e74c3c', 3);

          if (vecDist(e.x, e.y, player.x, player.y) < e.radius + player.radius && player.iFrames <= 0) {
            player.hp -= Math.round(e.damage * 0.9);
            player.iFrames = 26;
            ctx.triggerShake(11);
            safePlaySfx('hit');
            triggerHaptic('heavy');
            player.x += Math.cos(e.chargeAngle) * 40;
            player.y += Math.sin(e.chargeAngle) * 40;
            ctx.addDamageText(player.x, player.y, `-${Math.round(e.damage * 0.9)}`, true, '#c0392b');
          }
        } else if (e.currentSkill === 'APOCALYPSE_SLAM') {
          safePlaySfx('boss');
          ctx.triggerShake(12);
          createHitParticles(e.x, e.y, '#e74c3c', 26);

          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 14,
            maxRadius: 135,
            speed: 5.0,
            damage: Math.round(e.damage * 0.85),
            hitPlayer: false,
            colorRgb: '192, 57, 43'
          });
        }

        e.chargeDuration -= dt;
        if (e.chargeDuration <= 0) {
          e.actionState = 'RECOVERY';
          e.actionTimer = 26;
        }
      } else if (e.actionState === 'RECOVERY') {
        e.actionTimer -= dt;
        if (e.actionTimer <= 0) {
          e.actionState = 'CHASE';
          e.currentSkill = null;
          e.skillCooldown = e.enraged ? 35 : 60;
        }
      }
    }
  }
};

/**
 * Ponto de entrada unificado para atualização de qualquer Miniboss.
 * @param {Object} e Entidade do Miniboss
 * @param {number} dt Delta time normalizado em frames
 * @param {Object} context Contexto global do motor de jogo
 */
export function updateMiniBoss(e, dt, context) {
  if (!e || e.hp <= 0) return;

  // Inicialização sob demanda se necessário
  if (!e.actionState) {
    e.actionState = 'CHASE';
    e.actionTimer = 0;
    e.actionMaxTimer = 0;
    e.currentSkill = null;
    e.castProgress = 0;
    e.enraged = false;
    const handler = MINIBOSS_HANDLERS[e.baseType];
    if (handler && handler.init) handler.init(e);
  }

  // Verificação de Enrage dinâmico (<50% HP)
  checkEnrage(e, context);

  // Integração de distância e ângulo em relação ao jogador
  const player = context.player;
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  e.facing = dx >= 0 ? 1 : -1;

  // Despacha para o manipulador especializado do arquétipo
  const handler = MINIBOSS_HANDLERS[e.baseType];
  if (handler && handler.update) {
    handler.update(e, dt, context, dist, angle);
  } else {
    // Fallback de perseguição direta se tipo não mapeado
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;
  }
}
