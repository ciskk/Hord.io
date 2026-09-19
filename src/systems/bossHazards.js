/**
 * src/systems/bossHazards.js
 * Subsistema de Perigos de Arena e Mecânicas de Combate dos Chefes:
 * - Ondas de Choque Radiais (Expansão, Knockback, Dano e Screen Shake)
 * - Telegrafias de Perigo e Pavios (Gêiseres de Sangue, Clivagem Dimensional, Fraturas e Meteoros)
 * - Projéteis Balísticos e Homing dos Chefes (Foices Giratórias, Esferas Monolíticas)
 */
import { playSfx, triggerHaptic } from '../core/audio.js';
import { triggerDeath } from './ui.js';
import { addDamageText, createHitParticles } from './combat.js';

export function updateBossHazards(dt, {
  player,
  bossShockwaves,
  bossTelegraphs,
  bossProjectiles,
  enemyBullets,
  activeBoss,
  selectedHeroKey,
  triggerShake,
  setLastAttackerName
}) {
  // 1. Ondas de Choque dos Chefes
  for (let i = bossShockwaves.length - 1; i >= 0; i--) {
    const sw = bossShockwaves[i];
    sw.radius += sw.speed * dt;

    const sdx = player.x - sw.x;
    const sdy = player.y - sw.y;
    const sDist = Math.sqrt(sdx * sdx + sdy * sdy);

    if (!sw.hitPlayer && Math.abs(sDist - sw.radius) < 16 && player.bossIFrames <= 0) {
      let finalSwDamage = sw.damage || 0;
      if (selectedHeroKey === 'KNIGHT') finalSwDamage = Math.round(finalSwDamage * 0.80);

      // Repulsão / Knockback Radial da Onda de Choque
      if (sw.knockback && sDist > 0.1) {
        const pushForce = sw.knockback;
        player.pushVx = (sdx / sDist) * pushForce;
        player.pushVy = (sdy / sDist) * pushForce;
      }

      if (finalSwDamage > 0) {
        player.hp -= finalSwDamage;
        player.bossIFrames = 20;
        setLastAttackerName(activeBoss ? activeBoss.name : "Onda de Choque Sísmica");
        triggerShake(9);
        playSfx('hit');
        const swColor = sw.color || (activeBoss && activeBoss.bossId === 3 ? '#00cec9' : '#e67e22');
        addDamageText(player.x, player.y, `-${finalSwDamage}`, false, swColor);
        createHitParticles(player.x, player.y, swColor, 5);

        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return { playerDied: true };
        }
      } else {
        // Onda puramente de repulsão tática (sem dano punitivo surpresa)
        player.iFrames = Math.max(player.iFrames, 14);
        triggerShake(7);
        playSfx('forcefield');
        const swColor = sw.color || '#00cec9';
        createHitParticles(player.x, player.y, swColor, 4);
      }
      sw.hitPlayer = true;
    }

    if (sw.radius >= sw.maxRadius) bossShockwaves.splice(i, 1);
  }

  // 2. Telegrafias dos Chefes e Pavios
  for (let i = bossTelegraphs.length - 1; i >= 0; i--) {
    const tel = bossTelegraphs[i];
    tel.timer -= dt;

    if (tel.timer <= 0) {
      if (tel.type === 'MIST_DASH_LANE' || tel.type === 'FUSE_INDICATOR' || tel.type === 'REPULSION') {
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'VAMPIRE_TELEPORT') {
        if (tel.boss) {
          tel.boss.x = tel.x;
          tel.boss.y = tel.y;
          tel.boss.mistState = 'IDLE';
          tel.boss.isTeleporting = false;
          tel.boss.actionState = 'CHASE';
          tel.boss.skillCooldown = tel.boss.isEnraged ? 45 : 70;
        }
        triggerShake(10);
        playSfx('boss');
        createHitParticles(tel.x, tel.y, '#8e44ad', 18);

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          player.hp -= tel.damage;
          player.bossIFrames = 22;
          setLastAttackerName("Teleporte Carmesim");
          triggerShake(10);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#8e44ad');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'BLOOD_BURST_GEYSER') {
        triggerShake(6);
        playSfx('acid');
        createHitParticles(tel.x, tel.y, '#ff1744', 18);
        createHitParticles(tel.x, tel.y, '#2c0c16', 12);
        createHitParticles(tel.x, tel.y, '#ffffff', 6);

        // Dispara fragmentos carmesim na erupção do gêiser de sangue
        const shardCount = 5;
        for (let k = 0; k < shardCount; k++) {
          const sAng = (k * Math.PI * 2) / shardCount + Math.random() * 0.3;
          const sSpd = 3.6 + Math.random() * 1.2;
          enemyBullets.push({
            x: tel.x,
            y: tel.y,
            vx: Math.cos(sAng) * sSpd,
            vy: Math.sin(sAng) * sSpd,
            radius: 6.5,
            damage: Math.round(tel.damage * 0.6),
            life: 85,
            bulletType: 'BLOOD_DAGGER',
            color: '#ff1744',
            isBossProjectile: true
          });
        }

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          player.hp -= tel.damage;
          player.bossIFrames = 22;
          setLastAttackerName("Erupção de Sangue");
          triggerShake(8);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#ff1744');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'DIMENSIONAL_CLEAVE') {
        const cosA = Math.cos(tel.angle);
        const sinA = Math.sin(tel.angle);
        const pdx = player.x - tel.x;
        const pdy = player.y - tel.y;
        const proj = pdx * cosA + pdy * sinA;
        const perpDist = Math.abs(-pdx * sinA + pdy * cosA);
        const halfLen = (tel.length || 1300) * 0.5;

        triggerShake(14);
        playSfx('warp');
        triggerHaptic('heavy');
        const sparkX = tel.x + cosA * Math.max(-halfLen, Math.min(halfLen, proj));
        const sparkY = tel.y + sinA * Math.max(-halfLen, Math.min(halfLen, proj));
        createHitParticles(sparkX, sparkY, '#00cec9', 16);
        createHitParticles(sparkX, sparkY, '#e84393', 14);
        createHitParticles(sparkX, sparkY, '#ffffff', 8);

        if (Math.abs(proj) <= halfLen && perpDist <= (tel.width || 34) && player.bossIFrames <= 0) {
          player.hp -= tel.damage;
          player.bossIFrames = 24;
          setLastAttackerName("Fratura Dimensional");
          triggerShake(14);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#00cec9');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'ASTRAL_METEOR_SEAL') {
        triggerShake(14);
        playSfx('boss');
        playSfx('singularity');
        createHitParticles(tel.x, tel.y, '#e84393', 18);
        createHitParticles(tel.x, tel.y, '#00cec9', 16);
        createHitParticles(tel.x, tel.y, '#ffffff', 10);

        bossShockwaves.push({
          x: tel.x,
          y: tel.y,
          radius: 12,
          maxRadius: tel.radius || 65,
          speed: 5.5,
          damage: Math.round(tel.damage * 0.35),
          hitPlayer: false,
          colorRgb: '232, 67, 147'
        });

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < (tel.radius * tel.radius) && player.bossIFrames <= 0) {
          player.hp -= tel.damage;
          player.bossIFrames = 22;
          setLastAttackerName("Meteoro do Vazio");
          triggerShake(12);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#e84393');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'SCYTHE_CLEAVE') {
        triggerShake(14);
        playSfx('boss');
        const cleaveHitColor = tel.color || '#00cec9';
        createHitParticles(tel.x, tel.y, cleaveHitColor, 16);

        const cdx = player.x - tel.x;
        const cdy = player.y - tel.y;
        const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
        const playerAng = Math.atan2(cdy, cdx);

        let angleDiff = Math.abs(playerAng - tel.angle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        const maxAngle = tel.arcHalf !== undefined ? tel.arcHalf : Math.PI * 0.52;
        if (cDist < tel.radius && angleDiff <= maxAngle && player.bossIFrames <= 0) {
          player.hp -= tel.damage;
          player.bossIFrames = 24;
          setLastAttackerName((tel.boss && tel.boss.bossId === 1) ? "Garras Vampíricas" : "Corte de Foice Espectral");
          triggerShake(12);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, true, cleaveHitColor);
          createHitParticles(tel.x, player.y, cleaveHitColor, 16);
          const bossPushDist = 28 * (player.knockbackReceived !== undefined ? player.knockbackReceived : 1.0);
          player.x += Math.cos(playerAng) * bossPushDist;
          player.y += Math.sin(playerAng) * bossPushDist;

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'FALLING_ROCK') {
        triggerShake(10);
        playSfx('hit');
        createHitParticles(tel.x, tel.y, '#e67e22', 14);
        createHitParticles(tel.x, tel.y, '#7f8c8d', 8);

        bossShockwaves.push({
          x: tel.x,
          y: tel.y,
          radius: 10,
          maxRadius: tel.radius + 12,
          speed: 4.2,
          damage: Math.round(tel.damage * 0.3),
          hitPlayer: false
        });

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          player.hp -= tel.damage;
          player.bossIFrames = 22;
          setLastAttackerName("Monólito Basáltico");
          triggerShake(10);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#e67e22');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'FISSURE_NODE') {
        triggerShake(5);
        if (tel.nodeIndex === 1 || tel.nodeIndex === 4 || tel.nodeIndex === 7 || tel.nodeIndex === 10 || tel.nodeIndex === 13) playSfx('hit');
        createHitParticles(tel.x, tel.y, '#d35400', 8);
        createHitParticles(tel.x, tel.y, '#f39c12', 5);

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          player.hp -= tel.damage;
          player.bossIFrames = 20;
          setLastAttackerName("Fissura Tectônica");
          triggerShake(8);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#e67e22');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'ABYSSAL_VOID_RIFT') {
        triggerShake(8);
        playSfx('singularity');
        triggerHaptic('medium');
        createHitParticles(tel.x, tel.y, '#00cec9', 18);
        createHitParticles(tel.x, tel.y, '#e84393', 14);
        createHitParticles(tel.x, tel.y, '#ffffff', 8);

        bossShockwaves.push({
          x: tel.x,
          y: tel.y,
          radius: 8,
          maxRadius: (tel.radius || 52) + 14,
          speed: 6.0,
          damage: Math.round(tel.damage * 0.35),
          hitPlayer: false,
          colorRgb: '0, 206, 201'
        });

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          player.hp -= tel.damage;
          player.bossIFrames = 22;
          setLastAttackerName("Bombardeio Abissal");
          triggerShake(12);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#00cec9');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      triggerShake(12);
      playSfx('boss');
      createHitParticles(tel.x, tel.y, '#e74c3c', 14);

      bossShockwaves.push({
        x: tel.x,
        y: tel.y,
        radius: 12,
        maxRadius: tel.radius || 75,
        speed: 4.5,
        damage: Math.round(tel.damage * 0.35),
        hitPlayer: false
      });

      const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
      if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
        player.hp -= tel.damage;
        player.bossIFrames = 22;
        setLastAttackerName(activeBoss ? activeBoss.name : "Cataclismo de Chefe");
        triggerShake(10);
        playSfx('hit');
        addDamageText(player.x, player.y, `-${tel.damage}`, false, '#e74c3c');

        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return { playerDied: true };
        }
      }
      bossTelegraphs.splice(i, 1);
    }
  }

  // 3. Projéteis dos Chefes
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const bp = bossProjectiles[i];
    bp.life -= dt;
    bp.angle = (bp.angle || 0) + 0.3 * dt;

    if (bp.type === 'MONOLITH_ORB') {
      const orbRetAng = Math.atan2(player.y - bp.y, player.x - bp.x);
      bp.vx = Math.cos(orbRetAng) * 4.6;
      bp.vy = Math.sin(orbRetAng) * 4.6;
    } else {
      if (bp.life < bp.maxLife * 0.5) {
        if (!bp.isReturning) {
          bp.isReturning = true;
          bp.damage = Math.round(bp.damage * 0.75);
        }
        const tgt = activeBoss ? activeBoss : player;
        const retAng = Math.atan2(tgt.y - bp.y, tgt.x - bp.x);
        bp.vx = Math.cos(retAng) * 4.8;
        bp.vy = Math.sin(retAng) * 4.8;
      }
    }

    bp.x += bp.vx * dt;
    bp.y += bp.vy * dt;

    const pdx = player.x - bp.x;
    const pdy = player.y - bp.y;
    if (player.bossIFrames <= 0 && (pdx * pdx + pdy * pdy) < (player.radius + bp.radius) ** 2) {
      player.hp -= bp.damage;
      player.bossIFrames = 18;
      setLastAttackerName(bp.type === 'SOUL_SCYTHE' ? "Foice Giratória Espiritual" : "Projétil Abissal");
      triggerShake(8);
      playSfx('hit');
      const projHitColor = bp.color || '#e74c3c';
      addDamageText(player.x, player.y, `-${bp.damage}`, false, projHitColor);
      createHitParticles(player.x, player.y, projHitColor, 6);

      if (player.hp <= 0) {
        player.hp = 0;
        triggerDeath();
        return { playerDied: true };
      }
    }

    if (bp.life <= 0) bossProjectiles.splice(i, 1);
  }

  return { playerDied: false };
}
