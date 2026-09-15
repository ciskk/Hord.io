/**
 * src/systems/projectiles.js
 * Subsistema Balístico, Poças Ambientais e Paridade de Dano Melee (Fase 3 e 5).
 */
import { player, selectedHeroKey } from '../entities/player.js';
import { enemies, triggerShake } from '../main.js';
import { addDamageText, createHitParticles } from './combat.js';
import { playSfx, triggerHaptic } from '../core/audio.js';

export const bullets = [];
export const enemyBullets = [];
export const acidPuddles = [];

export const MAX_CONCURRENT_ENEMY_BULLETS = 14;

export function canSpawnEnemyBullet(isBoss = false) {
  return isBoss || enemyBullets.length < MAX_CONCURRENT_ENEMY_BULLETS;
}

/**
 * Atualiza projéteis do jogador e dos inimigos, aplicando regras de adrenalina melee (+25% se <= 130px).
 */
export function updateProjectiles(dt) {
  // 1. Projéteis do Jogador
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.life -= dt;

    if (b.type === 'POTION' && b.gravity) {
      b.vy = (b.vy || 0) + b.gravity * dt;
      b.angle = (b.angle || 0) + 0.18 * dt;
      if (!b.trail) b.trail = [];
      b.trail.unshift({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.pop();
    }

    b.x += (b.vx || 0) * dt;
    b.y += (b.vy || 0) * dt;

    if (b.life <= 0) {
      if (b.type === 'POTION') {
        const puddleRadius = (b.puddleRadius || 42) * (b.isEvolved ? 1.45 : 1.0);
        const puddleLife = b.puddleDuration || Math.round(340 / 1.5);

        // Impacto do ataque ao atingir o solo (dano de impacto 40% menor já calculado em b.damage)
        for (let j = 0; j < enemies.length; j++) {
          const e = enemies[j];
          if (e.hp <= 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) continue;
          if (e.isBoss && (e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
          if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;
          const dx = e.x - b.x;
          const dy = e.y - b.y;
          if (dx * dx + dy * dy <= (puddleRadius + e.radius) ** 2) {
            const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
            let impactDmg = (b.damage || 20) * (isCrit ? player.critMult : 1.0);
            let isKaelExecute = false;
            if (selectedHeroKey === 'ROGUE' && e.maxHp && (e.hp / e.maxHp) < 0.35) {
              const isBossTarget = !!(e.isBoss || e.isMiniBoss || e.isBossSubTarget);
              impactDmg *= isBossTarget ? 1.5 : 2.0;
              isKaelExecute = true;
            }
            if (player.executeBonus > 0 && e.maxHp && (e.hp / e.maxHp) < 0.30) {
              impactDmg *= (1 + player.executeBonus);
            }
            if (e.baseType === 'LITOCISTO') {
              impactDmg *= 4.0;
            } else if ((e.isBoss || e.isMiniBoss) && !e.isBossSubTarget) {
              // Resistência de Chefes contra múltiplos impactos simultâneos de frascos
              impactDmg *= 0.60;
            }
            e.hp -= impactDmg;
            e.hitFlash = 4;
            addDamageText(e.x, e.y, Math.round(impactDmg), isCrit || isKaelExecute, isKaelExecute ? '#00cec9' : (isCrit ? '#f1c40f' : (b.isEvolved ? '#00cec9' : '#2ecc71')));
            createHitParticles(e.x, e.y, isKaelExecute ? '#00cec9' : (b.isEvolved ? '#00cec9' : '#2ecc71'), isKaelExecute ? 5 : 3);

            // Ataques e poções da Valéria não causam knockback para manter os inimigos concentrados dentro do veneno
          }
        }

        acidPuddles.push({
          x: b.x,
          y: b.y,
          radius: puddleRadius,
          damage: (b.damage * 0.45) * 0.80, // 2: Dano da área envenenada 20% menor
          life: puddleLife, // 3: Some 1,5x mais rápido
          maxLife: puddleLife,
          isAlchemist: true,
          isEvolved: !!b.isEvolved
        });
        playSfx('acid');
        createHitParticles(b.x, b.y, b.isEvolved ? '#d6a2e8' : '#9b59b6', 6);
        triggerShake(3);
      }
      bullets.splice(i, 1);
      continue;
    }

    // Poções viajam em arco balístico aéreo e não colidem com inimigos no trajeto
    if (b.type === 'POTION') continue;

    const bRadius = b.radius || 6;

    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (e.hp <= 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) continue;
      if (e.isBoss && (e.mistState === 'DASHING' || e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
      if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;

      const dx = e.x - b.x;
      const dy = e.y - b.y;
      const rSum = bRadius + (e.radius || 14);

      if (dx * dx + dy * dy < rSum * rSum) {
        if (!b.hitEnemies) b.hitEnemies = new Set();
        if (b.hitEnemies.has(e)) continue;
        b.hitEnemies.add(e);

        const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
        let finalDmg = (b.damage || 20) * (isCrit ? player.critMult : 1.0);

        const isBossEntity = !!e.isBoss;
        const isSubTarget = !!e.isBossSubTarget;
        let isMeleeAdrenaline = false;

        if (isBossEntity || isSubTarget) {
          const bossRef = isBossEntity ? e : (e.parentBoss || e);
          const distToBoss = Math.hypot(player.x - bossRef.x, player.y - bossRef.y);

          // BÔNUS DE ADRENALINA MELEE (+25% de dano se dist <= 130px)
          if (distToBoss <= 130) {
            finalDmg *= 1.25;
            isMeleeAdrenaline = true;
          }

          if (e.isVulnerable || (bossRef && bossRef.isVulnerable)) {
            finalDmg *= 1.25;
          }

          // Passiva Quebra-Pedras: Martelo Sagrado estraçalha Litocistos com dano dobrado (+100%)
          if (b.type === 'HAMMER_SLAM' && isSubTarget) {
            finalDmg *= 2.0;
            isMeleeAdrenaline = true;
          }
        }

        // Passiva de Kael: 2.0x de dano em oponentes com menos de 35% de vida (1.5x contra chefes)
        let isKaelExecute = false;
        if (selectedHeroKey === 'ROGUE' && e.maxHp && (e.hp / e.maxHp) < 0.35) {
          const isBossTarget = isBossEntity || isSubTarget || !!e.isMiniBoss;
          finalDmg *= isBossTarget ? 1.5 : 2.0;
          isKaelExecute = true;
        }
        if (player.executeBonus > 0 && e.maxHp && (e.hp / e.maxHp) < 0.30) {
          finalDmg *= (1 + player.executeBonus);
        }

        // Bloqueio Frontal Ativo do Guardião Blindado (SHIELDED) e Centurião da Guarda (PHALANX_LEADER)
        let isShieldBlocked = false;
        if (e.baseType === 'SHIELDED' || e.baseType === 'PHALANX_LEADER' || e.hasFrontalShield) {
          const isFrontalHit = (b.x - e.x) * (e.facing || 1) > -e.radius * 0.25;
          if (isFrontalHit) {
            isShieldBlocked = true;
            const blockDmgFactor = e.baseType === 'PHALANX_LEADER' ? 0.15 : 0.25;
            finalDmg *= blockDmgFactor;
            e.shieldBlockFlash = 8;
            createHitParticles(e.x + (e.facing || 1) * e.radius * 0.8, e.y, e.baseType === 'PHALANX_LEADER' ? '#f1c40f' : '#74b9ff', 4);
          }
        }

        e.hp -= finalDmg;
        e.hitFlash = 4;

        // Knockback Suave: Golem e Escudeiro Bloqueador resistem 75%; Elites resistem 50%; Chefes e Mini-Chefes resistem 80%; Chefe Final possui hiperarmadura absoluta (0%)
        if (!e.isBossSubTarget) {
          const impactAngle = b.angle !== undefined ? b.angle : Math.atan2(b.vy || 0, b.vx || 0);
          // Knockback balanceado: STAFF (Ignis) agora possui o mesmo empurrão base de SWORD (Kael) = 4.5
          const baseWeaponPush = (b.type === 'HAMMER_SLAM' ? 14.0 : 4.5);
          const bossResist = e.isFinalBoss ? 0.00 : ((e.isBoss || e.isMiniBoss) ? 0.20 : (e.baseType === 'GOLEM' ? 0.25 : (isShieldBlocked ? 0.25 : (e.isElite ? 0.50 : 1.0))));
          const totalPush = baseWeaponPush * (player.knockbackDealt !== undefined ? player.knockbackDealt : 1.0) * bossResist;
          e.pushVx = (e.pushVx || 0) + Math.cos(impactAngle) * totalPush;
          e.pushVy = (e.pushVy || 0) + Math.sin(impactAngle) * totalPush;
        }

        if (isCrit || isMeleeAdrenaline || isKaelExecute) {
          playSfx('crit');
          triggerHaptic('light');
        } else {
          playSfx('hit');
        }

        let dmgTextColor = '#ffffff';
        if (isShieldBlocked) {
          dmgTextColor = '#74b9ff';
        } else if (isMeleeAdrenaline) {
          dmgTextColor = '#f1c40f';
        } else if (isKaelExecute) {
          dmgTextColor = '#00cec9';
        } else if (isCrit) {
          dmgTextColor = '#f39c12';
        } else if (b.color) {
          dmgTextColor = b.color;
        } else {
          dmgTextColor = isBossEntity ? '#e74c3c' : '#ffffff';
        }

        addDamageText(e.x, e.y, Math.round(finalDmg), isCrit || isMeleeAdrenaline || isKaelExecute, dmgTextColor);
        createHitParticles(b.x, b.y, isShieldBlocked ? '#74b9ff' : (isKaelExecute ? '#00cec9' : (isMeleeAdrenaline ? '#f1c40f' : (b.color || '#3498db'))), isCrit || isKaelExecute ? 5 : 3);

        if (player.slowChance > 0 && Math.random() < player.slowChance) {
          e.slowTimer = 150;
          e.slowFactor = 0.55;
          createHitParticles(e.x, e.y, '#74b9ff', 2);
        }

        if (b.type !== 'HAMMER_SLAM') {
          b.piercing = (b.piercing || 1) - 1;
          if (b.piercing <= 0) {
            bullets.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  // 2. Projéteis Inimigos
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    eb.life -= dt;

    // Rastreamento Suave para SHADOW_ORB (Cultista)
    if (eb.bulletType === 'SHADOW_ORB' && player.invisTimer <= 0) {
      const angleToPlayer = Math.atan2(player.y - eb.y, player.x - eb.x);
      const curAngle = Math.atan2(eb.vy, eb.vx);
      let diff = angleToPlayer - curAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const turnSpeed = 0.038 * dt;
      const newAngle = curAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
      const speed = Math.hypot(eb.vx, eb.vy);
      eb.vx = Math.cos(newAngle) * speed;
      eb.vy = Math.sin(newAngle) * speed;
    }

    eb.x += eb.vx * dt;
    eb.y += eb.vy * dt;

    if (eb.life <= 0) {
      enemyBullets.splice(i, 1);
      continue;
    }

    const pdx = player.x - eb.x;
    const pdy = player.y - eb.y;
    const hitRadius = (player.radius || 14) + (eb.radius || 6);

    const isInvulnerable = eb.isBossProjectile ? (player.bossIFrames > 0) : (player.iFrames > 0);
    if (!isInvulnerable && (pdx * pdx + pdy * pdy) < hitRadius * hitRadius) {
      let finalEbDamage = eb.damage;
      if (selectedHeroKey === 'KNIGHT') finalEbDamage = Math.round(finalEbDamage * 0.80);
      if (player.armor > 0) finalEbDamage = Math.max(1, finalEbDamage - player.armor);
      
      player.hp -= finalEbDamage;
      
      if (eb.isBossProjectile) {
        player.bossIFrames = 16; // Janela menor para não cancelar telégrafos subsequentes
      } else {
        player.iFrames = 24;
      }
      
      triggerShake(6);
      playSfx('hit');
      triggerHaptic('medium');

      const col = eb.color || (eb.bulletType === 'SHADOW_ORB' ? '#9b59b6' : '#e74c3c');
      addDamageText(player.x, player.y, `-${finalEbDamage}`, false, col);
      createHitParticles(player.x, player.y, col, 5);

      const hasSuperArmor = (player.dashDuration > 0) || (player.ignisDashDuration > 0) || (player.invisTimer > 0);
      if (!hasSuperArmor) {
        const bulletAng = Math.atan2(eb.vy || (player.y - eb.y), eb.vx || (player.x - eb.x));
        const bulletPush = 6.5 * (player.knockbackReceived !== undefined ? player.knockbackReceived : 1.0);
        player.pushVx = Math.cos(bulletAng) * bulletPush;
        player.pushVy = Math.sin(bulletAng) * bulletPush;
      }

      enemyBullets.splice(i, 1);
    }
  }
}

/**
 * Atualiza poças de ácido, lodo alquímico e chamas residuais.
 */
export function updateAcidPuddles(dt) {
  // Mapa para Anti-Stacking: consolida o dano por monstro no frame
  const enemyPuddleOverlap = new Map();

  for (let i = acidPuddles.length - 1; i >= 0; i--) {
    const p = acidPuddles[i];
    p.life -= dt;

    if (p.life <= 0) {
      acidPuddles.splice(i, 1);
      continue;
    }

    if (p.isFire || p.isAlchemist) {
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (e.hp <= 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) continue;
        if (e.isBoss && (e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
        if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        if (dx * dx + dy * dy < (p.radius + e.radius) ** 2) {
          let baseDmg = p.isAlchemist ? ((p.damage || 18) * 0.08 * 0.80) : 0.55;
          if (p.isAlchemist && e.baseType === 'LITOCISTO') {
            baseDmg *= 4.0;
          }

          const entry = enemyPuddleOverlap.get(e);
          if (!entry) {
            enemyPuddleOverlap.set(e, {
              maxBaseDmg: baseDmg,
              extraPuddles: 0,
              isAlchemist: !!p.isAlchemist,
              isEvolved: !!p.isEvolved
            });
          } else {
            entry.maxBaseDmg = Math.max(entry.maxBaseDmg, baseDmg);
            entry.extraPuddles++;
            if (p.isEvolved) entry.isEvolved = true;
          }
        }
      }
    }

    // Regeneração de vida da Valéria ao permanecer sobre as próprias poças de veneno violetas
    if (p.isAlchemist && selectedHeroKey === 'ALCHEMIST') {
      const pdx = player.x - p.x;
      const pdy = player.y - p.y;
      if ((pdx * pdx + pdy * pdy) < (p.radius + player.radius) ** 2) {
        p.healTickTimer = (p.healTickTimer || 0) + dt;
        if (p.healTickTimer >= 22) { // a cada ~0.36s (~2.7 HP por segundo)
          p.healTickTimer = 0;
          if (player.hp < player.maxHp) {
            const healAmount = p.isEvolved ? 2 : 1;
            player.hp = Math.min(player.maxHp, player.hp + healAmount);
            addDamageText(player.x, player.y, `+${healAmount}`, false, '#a29bfe');
            createHitParticles(player.x, player.y, '#d6a2e8', 2);
          }
        }
      }
    }

    if (!p.isAlchemist && !p.isFire) {
      const pdx = player.x - p.x;
      const pdy = player.y - p.y;
      if ((pdx * pdx + pdy * pdy) < (p.radius + player.radius) ** 2) {
        if (p.isCaustic) {
          player.slowTimer = Math.max(player.slowTimer || 0, 18);
        }
        if (player.iFrames <= 0) {
          p.tickTimer = (p.tickTimer || 0) + dt;
          if (p.tickTimer > 20) {
            p.tickTimer = 0;
            const dmgVal = p.isCaustic ? 4 : 6;
            player.hp -= dmgVal;
            player.iFrames = 18;
            triggerShake(2);
            playSfx('acid');
            addDamageText(player.x, player.y, `-${dmgVal}`, false, p.isCaustic ? '#00d2d3' : '#2ecc71');
            createHitParticles(player.x, player.y, p.isCaustic ? '#00d2d3' : '#2ecc71', 3);
          }
        }
      }
    }
  }

  // Aplicação consolidada de dano com Anti-Stacking e Resistência de Chefes
  for (const [e, data] of enemyPuddleOverlap.entries()) {
    if (e.hp <= 0) continue;

    // Anti-Stacking: 100% da poça principal + 15% por poça adicional (teto de +45%)
    // Evita que 5 poças sobrepostas multipliquem o dano por 5x
    const stackBonus = Math.min(0.45, data.extraPuddles * 0.15);
    let finalDot = data.maxBaseDmg * (1 + stackBonus) * dt;

    // 50% de resistência natural a veneno/ácido para Chefes e Minichefes
    if ((e.isBoss || e.isMiniBoss) && !e.isBossSubTarget) {
      finalDot *= 0.50;
    }

    e.hp -= finalDot;
    e.hitFlash = Math.max(e.hitFlash || 0, 1);

    if (data.isAlchemist) {
      e.slowTimer = Math.max(e.slowTimer || 0, 40);
      e.slowFactor = data.isEvolved ? 0.65 : 0.45;
      if (Math.random() < 0.02 * dt) {
        createHitParticles(e.x, e.y, data.isEvolved ? '#d6a2e8' : '#a29bfe', 1);
      }

      // Feedback visual periódico de dano contínuo (DoT) para as poças da Valéria
      e.acidDotAcc = (e.acidDotAcc || 0) + finalDot;
      e.acidDotTimer = (e.acidDotTimer || 0) + dt;
      if (e.acidDotTimer >= 22) {
        const displayDmg = Math.round(e.acidDotAcc);
        if (displayDmg >= 1) {
          const dotColor = data.isEvolved ? '#a29bfe' : '#9b59b6';
          addDamageText(e.x, e.y - (e.radius || 14) * 0.5, displayDmg, false, dotColor);
        }
        e.acidDotAcc = 0;
        e.acidDotTimer = 0;
      }
    }
  }
}