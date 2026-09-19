/**
 * src/systems/projectiles.js
 * Subsistema Balístico, Poças Ambientais e Paridade de Dano Melee (Fase 3 e 5).
 */
import { player, selectedHeroKey } from '../entities/player.js';
import { enemies, triggerShake, setLastAttackerInfo } from '../main.js';
import { addDamageText, createHitParticles } from './combat.js';
import { playSfx, triggerHaptic } from '../core/audio.js';
import { getNeighborIndices } from '../core/spatialGrid.js';
import { addGroundCrater, updateGroundCraters } from '../render/groundCracks.js';
import { triggerDeath } from './ui.js';

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
    } else if (b.type === 'STAFF') {
      if (!b.trail) b.trail = [];
      b.trail.unshift({ x: b.x, y: b.y });
      const maxTrail = b.isEvolved ? 12 : 9;
      if (b.trail.length > maxTrail) b.trail.pop();
    } else if (b.type === 'SWORD') {
      if (!b.trail) b.trail = [];
      b.trail.unshift({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.pop();
    } else if (b.type === 'HAMMER_SLAM') {
      // Durante a fase de preparação (windup), o martelo acompanha o cavaleiro em tempo real
      if (b.playerRef && !b.hasImpacted) {
        b.x = b.playerRef.x;
        b.y = b.playerRef.y;
      }
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
            // Passiva de Corrosão da Valéria (+6% por stack até +30%)
            if (e.acidStacks > 0) {
              impactDmg *= (1 + e.acidStacks * 0.06);
            }
            if (e.baseType === 'LITOCISTO') {
              impactDmg *= 4.0;
            } else if ((e.isBoss || e.isMiniBoss) && !e.isBossSubTarget) {
              // Resiliência de carapaça contra impacto direto de estilhaços de vidro (-25%)
              impactDmg *= 0.75;
            }
            e.hp -= impactDmg;
            e.hitFlash = 4;
            addDamageText(e.x, e.y, Math.round(impactDmg), isCrit || isKaelExecute, isKaelExecute ? '#00cec9' : (isCrit ? '#f1c40f' : (b.isEvolved ? '#00cec9' : '#2ecc71')));
            createHitParticles(e.x, e.y, isKaelExecute ? '#00cec9' : (b.isEvolved ? '#00cec9' : '#2ecc71'), isKaelExecute ? 5 : 3);

            // FIXAÇÃO CÁUSTICA (Caminhos 1 e 3): O frasco quebra diretamente no alvo, aplicando veneno aderente
            e.acidStacks = Math.min(5, (e.acidStacks || 0) + 1);
            e.acidStackTimer = 200;
            e.acidBurnTimer = Math.max(e.acidBurnTimer || 0, 180);
            if (b.isEvolved) e.acidBurnEvolved = true;
          }
        }

        acidPuddles.push({
          x: b.x,
          y: b.y,
          radius: puddleRadius,
          damage: (b.damage || 20) * 0.40,
          life: puddleLife,
          maxLife: puddleLife,
          isAlchemist: true,
          isEvolved: !!b.isEvolved
        });
        playSfx('potion_shatter');
        createHitParticles(b.x, b.y, b.isEvolved ? '#d6a2e8' : '#9b59b6', 6);
        triggerShake(3);
      }
      bullets.splice(i, 1);
      continue;
    }

    // Poções viajam em arco balístico aéreo e não colidem com inimigos no trajeto
    if (b.type === 'POTION') continue;

    // Martelo Sagrado de Sir Roland: sincronização de windup e impacto sísmico
    if (b.type === 'HAMMER_SLAM') {
      const slamProgress = 1 - (b.life / b.maxLife);
      // Durante o windup (frames 0 a 8), o martelo ainda está no ar sendo erguido
      if (slamProgress < 0.32) {
        continue;
      }

      // No instante exato do impacto com o solo (Frame 8):
      if (!b.hasImpacted) {
        b.hasImpacted = true;
        if (b.playerRef) {
          b.x = b.playerRef.x;
          b.y = b.playerRef.y;
        }

        playSfx('hammer_slam');
        triggerShake(b.isEvolved ? 6.5 : 4.5);
        triggerHaptic('heavy');

        // Cumprimento da Lore: Anulação Real de Projéteis Inimigos no Raio Sísmico 360°
        const cancelRadiusSq = (b.radius + 15) * (b.radius + 15);
        for (let k = enemyBullets.length - 1; k >= 0; k--) {
          const eb = enemyBullets[k];
          if (eb.isBossProjectile) continue; // Tiros de chefe são resilientes
          const edx = eb.x - b.x;
          const edy = eb.y - b.y;
          if (edx * edx + edy * edy <= cancelRadiusSq) {
            createHitParticles(eb.x, eb.y, '#f1c40f', 3);
            createHitParticles(eb.x, eb.y, '#ffffff', 2);
            enemyBullets.splice(k, 1);
          }
        }

        // Ondas de partículas sagradas telúricas moderadas (sem saturar buffer de partículas)
        createHitParticles(b.x, b.y, '#f1c40f', b.isEvolved ? 8 : 6);
        createHitParticles(b.x, b.y, '#ffffff', b.isEvolved ? 5 : 4);

        // Gera ou re-energiza a cratera e fendas geológicas no solo (anti-stacking por proximidade)
        addGroundCrater(b.x, b.y, b.angle || 0, b.radius || 50, b.count || 1, !!b.isEvolved, b.damage || 45);
      }
    }

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

        // Passiva de Corrosão da Valéria (+6% por stack até +30%)
        if (e.acidStacks > 0) {
          finalDmg *= (1 + e.acidStacks * 0.06);
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

        if (b.type === 'HAMMER_SLAM') {
          playSfx('hammer_hit');
          if (isCrit || isMeleeAdrenaline || isKaelExecute) playSfx('crit');
        } else if (b.type === 'STAFF') {
          playSfx('fire_hit');
          if (isCrit || isMeleeAdrenaline || isKaelExecute) playSfx('crit');
        } else if (b.type === 'SWORD') {
          playSfx('blade_hit');
          if (isCrit || isMeleeAdrenaline || isKaelExecute) playSfx('crit');
        } else {
          if (isCrit || isMeleeAdrenaline || isKaelExecute) {
            playSfx('crit');
            triggerHaptic('light');
          } else {
            playSfx('hit');
          }
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
      
      const projName = eb.isBossProjectile ? 'Projétil de Chefe' : (eb.bulletType === 'SHADOW_ORB' ? 'Orbe Sombrio' : (eb.isHook ? 'Corrente do Flagelador' : 'Projétil Profano'));
      const projCat = eb.isBossProjectile ? 'BOSS' : (eb.isMiniBoss ? 'MINIBOSS' : 'PROJECTILE');
      setLastAttackerInfo({
        name: eb.sourceName || projName,
        category: projCat,
        attackName: projName,
        damage: Math.round(finalEbDamage),
        color: eb.color || '#9b59b6',
        tacticTip: "Mantenha esquiva circular constante para que trajetórias balísticas e projéteis teleguiados errem o alvo."
      });

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
        if (eb.isHook && eb.parentX !== undefined) {
          const pullAng = Math.atan2(eb.parentY - player.y, eb.parentX - player.x);
          player.pushVx = Math.cos(pullAng) * 12;
          player.pushVy = Math.sin(pullAng) * 12;
          addDamageText(player.x, player.y - 12, "PUXADO!", false, '#e74c3c');
        } else {
          const bulletAng = Math.atan2(eb.vy || (player.y - eb.y), eb.vx || (player.x - eb.x));
          const bulletPush = 6.5 * (player.knockbackReceived !== undefined ? player.knockbackReceived : 1.0);
          player.pushVx = Math.cos(bulletAng) * bulletPush;
          player.pushVy = Math.sin(bulletAng) * bulletPush;
        }
      }

      enemyBullets.splice(i, 1);

      if (player.hp <= 0) {
        player.hp = 0;
        triggerDeath();
        return;
      }
    }
  }
}

// Estruturas Zero-Alloc estáticas para consolidação de dano de poças
let _puddleFrameSeq = 0;
const _affectedEnemies = [];

/**
 * Atualiza poças de ácido, lodo alquímico e chamas residuais.
 */
export function updateAcidPuddles(dt) {
  _puddleFrameSeq++;
  _affectedEnemies.length = 0;
  let playerInAlchemistPuddle = false;
  let alchemistPuddleEvolved = false;

  for (let i = acidPuddles.length - 1; i >= 0; i--) {
    const p = acidPuddles[i];
    p.life -= dt;

    if (p.life <= 0) {
      acidPuddles.splice(i, 1);
      continue;
    }

    if (p.isFire || p.isAlchemist) {
      const candidates = getNeighborIndices(p.x, p.y, p.radius + 35);
      const candLen = candidates.length;
      for (let j = 0; j < candLen; j++) {
        const e = enemies[candidates[j]];
        if (!e || e.hp <= 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) continue;
        if (e.isBoss && (e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
        if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        if (dx * dx + dy * dy < (p.radius + e.radius) ** 2) {
          let baseDmg = p.isAlchemist ? ((p.damage || 18) * 0.045) : 0.55;
          if (p.isAlchemist && e.baseType === 'LITOCISTO') {
            baseDmg *= 4.0;
          }

          if (e._puddleFrame !== _puddleFrameSeq) {
            e._puddleFrame = _puddleFrameSeq;
            e._puddleMaxDmg = baseDmg;
            e._puddleExtra = 0;
            e._puddleAlchemist = !!p.isAlchemist;
            e._puddleEvolved = !!p.isEvolved;
            _affectedEnemies.push(e);
          } else {
            if (baseDmg > e._puddleMaxDmg) e._puddleMaxDmg = baseDmg;
            e._puddleExtra++;
            if (p.isEvolved) e._puddleEvolved = true;
            if (p.isAlchemist) e._puddleAlchemist = true;
          }
        }
      }
    }

    // Detecção de permanência da Valéria sobre o miasma aliado (sem empilhar cura por poça)
    if (p.isAlchemist && selectedHeroKey === 'ALCHEMIST') {
      const pdx = player.x - p.x;
      const pdy = player.y - p.y;
      if ((pdx * pdx + pdy * pdy) < (p.radius + player.radius) ** 2) {
        playerInAlchemistPuddle = true;
        if (p.isEvolved) alchemistPuddleEvolved = true;
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
            setLastAttackerInfo({
              name: p.isCaustic ? 'Miasma Cáustico' : 'Poça de Ácido',
              category: 'HAZARD',
              attackName: 'Corrosão Ácida',
              damage: dmgVal,
              color: p.isCaustic ? '#00d2d3' : '#2ecc71',
              tacticTip: "Evite transitar sobre fluidos tóxicos e poças corrosivas depositadas por rastejadores e chefes."
            });
            player.hp -= dmgVal;
            player.iFrames = 18;
            triggerShake(2);
            playSfx('acid');
            addDamageText(player.x, player.y, `-${dmgVal}`, false, p.isCaustic ? '#00d2d3' : '#2ecc71');
            createHitParticles(player.x, player.y, p.isCaustic ? '#00d2d3' : '#2ecc71', 3);

            if (player.hp <= 0) {
              player.hp = 0;
              triggerDeath();
              return;
            }
          }
        }
      }
    }
  }

  // Aplicação consolidada de dano com Anti-Stacking e Passiva de Corrosão (Zero-Alloc)
  const affectedCount = _affectedEnemies.length;
  for (let idx = 0; idx < affectedCount; idx++) {
    const e = _affectedEnemies[idx];
    if (e.hp <= 0) continue;

    // Anti-Stacking: 100% da poça principal + 15% por poça adicional (teto de +45%)
    // Evita que poças sobrepostas multipliquem o dano descontroladamente
    const stackBonus = Math.min(0.45, e._puddleExtra * 0.15);
    let finalDot = e._puddleMaxDmg * (1 + stackBonus) * dt;

    // Passiva de Corrosão da Valéria (+6% por stack até +30%)
    if (e.acidStacks > 0) {
      finalDot *= (1 + e.acidStacks * 0.06);
    }

    e.hp -= finalDot;
    e.hitFlash = Math.max(e.hitFlash || 0, 1);

    if (e._puddleAlchemist) {
      e.slowTimer = Math.max(e.slowTimer || 0, 40);
      e.slowFactor = e._puddleEvolved ? 0.65 : 0.45;
      
      // Ao permanecer na poça, renova o veneno aderente e a duração dos stacks
      e.acidBurnTimer = Math.max(e.acidBurnTimer || 0, 150);
      e.acidStackTimer = 200;
      if (e._puddleEvolved) e.acidBurnEvolved = true;
      if (Math.random() < 0.02 * dt) {
        createHitParticles(e.x, e.y, e._puddleEvolved ? '#d6a2e8' : '#a29bfe', 1);
      }

      // Feedback visual periódico de dano contínuo (DoT) para as poças da Valéria
      e.acidDotAcc = (e.acidDotAcc || 0) + finalDot;
      e.acidDotTimer = (e.acidDotTimer || 0) + dt;
      if (e.acidDotTimer >= 22) {
        const displayDmg = Math.round(e.acidDotAcc);
        if (displayDmg >= 1) {
          const dotColor = e._puddleEvolved ? '#a29bfe' : '#9b59b6';
          addDamageText(e.x, e.y - (e.radius || 14) * 0.5, displayDmg, false, dotColor);
        }
        e.acidDotAcc = 0;
        e.acidDotTimer = 0;
      }
    }
  }

  // Regeneração Global da Valéria (Opção A: Anti-Stacking Absoluto)
  // Calibrado para recuperar 100% da vida (105 HP) em exatamente 20 segundos
  // 105 HP / 20s = 5.25 HP/s -> +2 HP a cada 23 frames (~0.38s = 5.22 HP/s)
  if (playerInAlchemistPuddle && selectedHeroKey === 'ALCHEMIST') {
    player.alchemistHealTimer = (player.alchemistHealTimer || 0) + dt;
    if (player.alchemistHealTimer >= 23) {
      player.alchemistHealTimer = 0;
      if (player.hp < player.maxHp) {
        const healAmount = alchemistPuddleEvolved ? 3 : 2;
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        addDamageText(player.x, player.y, `+${healAmount}`, false, '#a29bfe');
        createHitParticles(player.x, player.y, '#d6a2e8', 2);
      }
    }
  } else if (player.alchemistHealTimer > 0) {
    player.alchemistHealTimer = Math.max(0, player.alchemistHealTimer - dt);
  }

  // Atualização do ciclo de vida das crateras e fendas geológicas no solo
  updateGroundCraters(dt);
}