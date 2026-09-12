/**
 * src/systems/projectiles.js
 * Subsistema Balístico, Poças Ambientais e Paridade de Dano Melee (Fase 3 e 5).
 */
import { player } from '../entities/player.js';
import { enemies, triggerShake } from '../main.js';
import { addDamageText, createHitParticles } from './combat.js';
import { playSfx, triggerHaptic } from '../core/audio.js';

export const bullets = [];
export const enemyBullets = [];
export const acidPuddles = [];

export const MAX_CONCURRENT_ENEMY_BULLETS = 14;

export function canSpawnEnemyBullet() {
  return enemyBullets.length < MAX_CONCURRENT_ENEMY_BULLETS;
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
          if (e.hp <= 0) continue;
          const dx = e.x - b.x;
          const dy = e.y - b.y;
          if (dx * dx + dy * dy <= (puddleRadius + e.radius) ** 2) {
            const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
            let impactDmg = (b.damage || 20) * (isCrit ? player.critMult : 1.0);
            e.hp -= impactDmg;
            e.hitFlash = 4;
            addDamageText(e.x, e.y, Math.round(impactDmg), isCrit, isCrit ? '#f1c40f' : (b.isEvolved ? '#00cec9' : '#2ecc71'));
            createHitParticles(e.x, e.y, b.isEvolved ? '#00cec9' : '#2ecc71', 3);
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
        createHitParticles(b.x, b.y, b.isEvolved ? '#00cec9' : '#2ecc71', 4); // Quantidade drástica reduzida (14 -> 4)
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
      if (e.hp <= 0) continue;
      if (e.isBoss && e.mistState === 'DASHING') continue;

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
        }

        e.hp -= finalDmg;
        e.hitFlash = 4;

        if (isCrit || isMeleeAdrenaline) {
          playSfx('crit');
          triggerHaptic('light');
        } else {
          playSfx('hit');
        }

        let dmgTextColor = '#ffffff';
        if (isMeleeAdrenaline) {
          dmgTextColor = '#f1c40f';
        } else if (isCrit) {
          dmgTextColor = '#f39c12';
        } else if (b.color) {
          dmgTextColor = b.color;
        } else {
          dmgTextColor = isBossEntity ? '#e74c3c' : '#ffffff';
        }

        addDamageText(e.x, e.y, Math.round(finalDmg), isCrit || isMeleeAdrenaline, dmgTextColor);
        createHitParticles(b.x, b.y, isMeleeAdrenaline ? '#f1c40f' : (b.color || '#3498db'), isCrit ? 5 : 3);

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
    eb.x += eb.vx * dt;
    eb.y += eb.vy * dt;

    if (eb.life <= 0) {
      enemyBullets.splice(i, 1);
      continue;
    }

    const pdx = player.x - eb.x;
    const pdy = player.y - eb.y;
    const hitRadius = (player.radius || 14) + (eb.radius || 6);

    if (player.iFrames <= 0 && (pdx * pdx + pdy * pdy) < hitRadius * hitRadius) {
      player.hp -= eb.damage;
      player.iFrames = 22;
      triggerShake(6);
      playSfx('hit');
      triggerHaptic('medium');

      const col = eb.color || '#e74c3c';
      addDamageText(player.x, player.y, `-${eb.damage}`, false, col);
      createHitParticles(player.x, player.y, col, 5);

      enemyBullets.splice(i, 1);
    }
  }
}

/**
 * Atualiza poças de ácido, lodo alquímico e chamas residuais.
 */
export function updateAcidPuddles(dt) {
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
        if (e.hp <= 0) continue;
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        if (dx * dx + dy * dy < (p.radius + e.radius) ** 2) {
          // 2: Dano contínuo da área envenenada reduzido em 20% (* 0.80)
          const dotDmg = (p.isAlchemist ? ((p.damage || 18) * 0.08 * 0.80) : 0.55) * dt;
          e.hp -= dotDmg;
          e.hitFlash = Math.max(e.hitFlash || 0, 1);

          if (p.isAlchemist) {
            e.slowTimer = Math.max(e.slowTimer || 0, 40);
            e.slowFactor = p.isEvolved ? 0.65 : 0.45;
            if (Math.random() < 0.02 * dt) { // Frequência de partículas de lentidão bem mais sutil e espaçada
              createHitParticles(e.x, e.y, p.isEvolved ? '#00cec9' : '#2ecc71', 1);
            }
          }
        }
      }
    }

    if (!p.isAlchemist && !p.isFire) {
      const pdx = player.x - p.x;
      const pdy = player.y - p.y;
      if (player.iFrames <= 0 && (pdx * pdx + pdy * pdy) < (p.radius + player.radius) ** 2) {
        p.tickTimer = (p.tickTimer || 0) + dt;
        if (p.tickTimer > 20) {
          p.tickTimer = 0;
          player.hp -= 6;
          player.iFrames = 18;
          triggerShake(3);
          playSfx('acid');
          addDamageText(player.x, player.y, "-6", false, '#2ecc71');
          createHitParticles(player.x, player.y, '#2ecc71', 3);
        }
      }
    }
  }
}