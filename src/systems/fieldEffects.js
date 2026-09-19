/**
 * src/systems/fieldEffects.js
 * Subsistema de Efeitos de Campo e Passivas Reativas de Combate:
 * - Aura Sagrada (Tick e Dano via Spatial Grid)
 * - Bíblias Protetoras (Orbitais, Bloqueio de Tiros e Colisão Suave com Knockback Amortecido)
 * - Miasma Cáustico da Alquimista (Dissolução de Projéteis, Super-Slow 70%, Acid Shred e Vapor Estimulante)
 */
import { getNeighborIndices } from '../core/spatialGrid.js';
import { playSfx } from '../core/audio.js';
import { addDamageText, createHitParticles } from './combat.js';

export function updateFieldEffects(dt, { 
  player, 
  enemies, 
  enemyBullets, 
  acidPuddles, 
  frameCount, 
  selectedHeroKey, 
  triggerShake 
}) {
  // 1. Aura Sagrada (Vinculada ao Spatial Grid)
  if (player.auraLvl > 0 || player.evolvedAura) {
    player.auraTimer += dt;
    const auraInterval = player.evolvedAura ? 18 : 26;
    if (player.auraTickFlash > 0) {
      player.auraTickFlash = Math.max(0, player.auraTickFlash - 0.08 * dt);
    }
    if (player.auraTimer >= auraInterval) {
      player.auraTimer = 0;
      player.auraTickFlash = 1.0;
      const auraRadius = (player.evolvedAura ? 150 : 65) + player.auraLvl * 18;
      const aRadiusSq = auraRadius * auraRadius;
      let auraDmg = player.damage * (player.evolvedAura ? 0.85 : 0.45 * player.auraLvl);

      if (player.evolvedAura && Math.random() < 0.15 && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + 2);
        addDamageText(player.x, player.y, "+2", false, '#2ecc71');
      }

      const auraNeighbors = getNeighborIndices(player.x, player.y, auraRadius);
      const aLen = auraNeighbors.length;
      for (let k = 0; k < aLen; k++) {
        const e = enemies[auraNeighbors[k]];
        if (!e || e.hp <= 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) continue;
        if (e.isBoss && (e.mistState === 'DASHING' || e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
        if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;

        const dx = e.x - player.x;
        const dy = e.y - player.y;
        if (dx * dx + dy * dy < aRadiusSq) {
          let currentAuraDmg = auraDmg;
          if (e.isBoss || e.isBossSubTarget) {
            const bossRef = e.isBoss ? e : (e.parentBoss || e);
            const distToBoss = Math.hypot(player.x - bossRef.x, player.y - bossRef.y);
            if (distToBoss <= 130) currentAuraDmg *= 1.25;
            if (e.isVulnerable) currentAuraDmg *= 1.25;
          }
          let isKaelExecute = false;
          if (selectedHeroKey === 'ROGUE' && e.maxHp && (e.hp / e.maxHp) < 0.35) {
            const isBossTarget = !!(e.isBoss || e.isMiniBoss || e.isBossSubTarget);
            currentAuraDmg *= isBossTarget ? 1.5 : 2.0;
            isKaelExecute = true;
          }
          if (e.acidStacks > 0) {
            currentAuraDmg *= (1 + e.acidStacks * 0.06);
          }
          const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
          let finalDmg = isCrit ? currentAuraDmg * player.critMult : currentAuraDmg;

          e.hp -= finalDmg;
          e.hitFlash = 3;
          if (isCrit || isKaelExecute) playSfx('crit');
          addDamageText(e.x, e.y, finalDmg, isCrit || isKaelExecute, isKaelExecute ? '#00cec9' : '#f1c40f');
          createHitParticles(e.x, e.y, isKaelExecute ? '#00cec9' : '#f1c40f', 2);

          if (player.slowChance > 0 && Math.random() < player.slowChance) {
            e.slowTimer = 150;
            e.slowFactor = 0.55;
            createHitParticles(e.x, e.y, '#74b9ff', 2);
          }

          if (e.isBoss && (e.hp / e.maxHp) < 0.45 && !e.isEnraged) {
            e.isEnraged = true;
            e.speed *= 1.35;
            triggerShake(15);
            playSfx('boss');
            addDamageText(e.x, e.y, "EM FÚRIA!", true, '#e74c3c');
          }
        }
      }
    }
  }

  // 2. Bíblias Protetoras (Vinculadas ao Spatial Grid)
  if (player.orbitals > 0) {
    player.orbitalAngle += (player.evolvedOrbitals ? 0.13 : 0.068) * dt;
    const orbDist = player.evolvedOrbitals ? 88 : 72;
    const bookRadius = player.evolvedOrbitals ? 26 : 20;

    for (let oIdx = 0; oIdx < player.orbitals; oIdx++) {
      const angle = player.orbitalAngle + (oIdx * (Math.PI * 2 / player.orbitals));
      const ox = player.x + Math.cos(angle) * orbDist;
      const oy = player.y + Math.sin(angle) * orbDist;

      const orbNeighbors = getNeighborIndices(ox, oy, bookRadius + 45);
      const oLen = orbNeighbors.length;

      for (let k = 0; k < oLen; k++) {
        const e = enemies[orbNeighbors[k]];
        if (!e || e.hp <= 0 || e.orbitalHitCd > 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) continue;
        if (e.isBoss && (e.mistState === 'DASHING' || e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
        if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;
        const dx = e.x - ox;
        const dy = e.y - oy;
        const rSum = e.radius + bookRadius;
        if (dx * dx + dy * dy < rSum * rSum) {
          let dmg = player.damage * (player.evolvedOrbitals ? 2.3 : 1.45);
          if (e.isBoss || e.isBossSubTarget) {
            const bossRef = e.isBoss ? e : (e.parentBoss || e);
            const distToBoss = Math.hypot(player.x - bossRef.x, player.y - bossRef.y);
            if (distToBoss <= 130) dmg *= 1.25;
            if (e.isVulnerable) dmg *= 1.25;
          }
          let isKaelExecute = false;
          if (selectedHeroKey === 'ROGUE' && e.maxHp && (e.hp / e.maxHp) < 0.35) {
            const isBossTarget = !!(e.isBoss || e.isMiniBoss || e.isBossSubTarget);
            dmg *= isBossTarget ? 1.5 : 2.0;
            isKaelExecute = true;
          }
          if (e.acidStacks > 0) {
            dmg *= (1 + e.acidStacks * 0.06);
          }
          const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
          let finalDmg = isCrit ? dmg * player.critMult : dmg;

          e.hp -= finalDmg;
          e.hitFlash = 4;
          e.orbitalHitCd = player.evolvedOrbitals ? 8 : 12;
          playSfx('tome_impact');
          if (isCrit || isKaelExecute) playSfx('crit');

          // Knockback Sagrado Suave: 80% menos empurrão; Chefe Final imune (0.00)
          if (!e.isBossSubTarget) {
            const pushAng = Math.atan2(e.y - player.y, e.x - player.x);
            const basePush = player.evolvedOrbitals ? 1.36 : 0.96;
            const bossResist = e.isFinalBoss ? 0.00 : ((e.isBoss || e.isMiniBoss) ? 0.20 : (e.isElite ? 0.45 : 1.0));
            const pushForce = basePush * (player.knockbackDealt !== undefined ? player.knockbackDealt : 1.0) * bossResist;
            e.pushVx = (e.pushVx || 0) + Math.cos(pushAng) * pushForce;
            e.pushVy = (e.pushVy || 0) + Math.sin(pushAng) * pushForce;
          }

          const hitColor = player.evolvedOrbitals ? '#f1c40f' : '#00cec9';
          addDamageText(e.x, e.y, finalDmg, isCrit, player.evolvedOrbitals ? '#f1c40f' : '#3498db');
          createHitParticles(ox, oy, hitColor, player.evolvedOrbitals ? 4 : 3);

          if (player.slowChance > 0 && Math.random() < player.slowChance) {
            e.slowTimer = 150;
            e.slowFactor = 0.55;
            createHitParticles(e.x, e.y, '#74b9ff', 2);
          }

          if (e.isBoss && (e.hp / e.maxHp) < 0.45 && !e.isEnraged) {
            e.isEnraged = true;
            e.speed *= 1.35;
            triggerShake(15);
            playSfx('boss');
            addDamageText(e.x, e.y, "EM FÚRIA!", true, '#e74c3c');
          }
        }
      }
    }
  }

  // 3. Mecânicas do Miasma da Valéria: Dissolução de Tiros, Super Slow (70%), Acid Shred e Vapor Móvel
  for (let pIdx = 0; pIdx < acidPuddles.length; pIdx++) {
    const p = acidPuddles[pIdx];
    if (!p.isAlchemist) continue;

    // Dissolução de projéteis inimigos comuns que entrarem no vapor
    for (let bIdx = enemyBullets.length - 1; bIdx >= 0; bIdx--) {
      const eb = enemyBullets[bIdx];
      if (eb.isBossProjectile) continue;
      const edx = eb.x - p.x;
      const edy = eb.y - p.y;
      if (edx * edx + edy * edy < (p.radius + (eb.radius || 5)) ** 2) {
        createHitParticles(eb.x, eb.y, p.isEvolved ? '#81ecec' : '#a55eea', 4);
        enemyBullets.splice(bIdx, 1);
      }
    }

    // Super slow de 70%, quebra de dashes e stacks de corrosão em inimigos (Via Spatial Grid)
    const puddleNeighbors = getNeighborIndices(p.x, p.y, p.radius + 35);
    const pnLen = puddleNeighbors.length;
    for (let k = 0; k < pnLen; k++) {
      const e = enemies[puddleNeighbors[k]];
      if (!e || e.hp <= 0 || e.isTargetable === false) continue;
      const edx = e.x - p.x;
      const edy = e.y - p.y;
      if (edx * edx + edy * edy < (p.radius + e.radius) ** 2) {
        e.inAcidPuddle = true;
        e.slowTimer = Math.max(e.slowTimer || 0, 30);
        e.slowFactor = 0.70;
        if (e.dashState === 'dashing') {
          e.dashState = 'cooldown';
          e.dashTimer = 0;
        }
        if (Math.floor(frameCount) % 15 === 0) {
          e.acidStacks = Math.min(5, (e.acidStacks || 0) + 1);
          e.acidStackTimer = 180;
        }
        e.acidBurnTimer = Math.max(e.acidBurnTimer || 0, 160);
        if (p.isEvolved) e.acidBurnEvolved = true;
      }
    }

    // Concessão e renovação do buff portátil de Vapor Estimulante ao cruzar o miasma
    const pdx = player.x - p.x;
    const pdy = player.y - p.y;
    if (pdx * pdx + pdy * pdy < (p.radius + player.radius) ** 2) {
      player.alchemistBuffTimer = 180;
    }
  }
}
