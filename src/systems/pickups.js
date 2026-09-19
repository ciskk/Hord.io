/**
 * src/systems/pickups.js
 * Subsistema de Coletáveis, Gemas de XP, Caixas Destrutíveis e Baús 2.5D:
 * - Configuração cromática e valores de Gemas
 * - Compressão de Gemas distantes para Zero-Allocation e estabilidade a 60 FPS
 * - Física balística vertical de Baús Arcanos com quiques e detecção de solo
 * - Drops de cura, super-ímã e congelamento temporal
 * - Coleta e atração magnética
 */
import { playSfx, triggerHaptic } from '../core/audio.js';
import { triggerDeath, openChestModal } from './ui.js';
import { addDamageText, createHitParticles, addBloodSplat } from './combat.js';
import { addXP } from '../entities/player.js';
import { transitionToArenaTheme, getWaveArenaTheme } from '../render/environment.js';
import { getCurrentWave, getEffectiveHordeSeconds } from './waves.js';

export function getGemConfig(xp) {
  if (xp >= 50) {
    return { radius: 10.5, color: '#e056fd', isSuper: true };
  } else if (xp >= 6) {
    return { radius: 6.5, color: '#f1c40f', isSuper: false };
  } else if (xp >= 3) {
    return { radius: 5.0, color: '#2ecc71', isSuper: false };
  } else {
    return { radius: 3.5, color: '#00d2d3', isSuper: false };
  }
}

export function spawnChest(chests, x, y, tier = 'BOSS') {
  const isMini = tier === 'MINI_BOSS';
  chests.push({
    x,
    y,
    z: 0,
    vz: isMini ? -4.5 : -5.8,
    gravity: 0.32,
    bounce: 0.52,
    radius: isMini ? 15 : 18,
    tier,
    isResting: false,
    sparkleTimer: 0,
    pulseOffset: Math.random() * Math.PI * 2
  });
}

// Array estático indexador reutilizável para compressão de gemas (Zero-Allocation)
const _offscreenGems = [];

export function compressGems(gems, player) {
  if (gems.length <= 70) return;
  _offscreenGems.length = 0;
  const keepDistSq = 720 * 720;

  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i];
    const dx = g.x - player.x;
    const dy = g.y - player.y;
    if (dx * dx + dy * dy > keepDistSq) _offscreenGems.push(i);
  }

  if (_offscreenGems.length >= 10) {
    let accumulatedXp = 0;
    const firstIdx = _offscreenGems[0];
    const targetX = gems[firstIdx].x;
    const targetY = gems[firstIdx].y;

    for (let j = 0; j < _offscreenGems.length; j++) {
      accumulatedXp += gems[_offscreenGems[j]].value;
    }

    for (let j = 0; j < _offscreenGems.length; j++) {
      gems.splice(_offscreenGems[j], 1);
    }

    const cfg = getGemConfig(accumulatedXp);
    gems.push({ 
      x: targetX, 
      y: targetY, 
      radius: cfg.radius, 
      color: cfg.color, 
      value: accumulatedXp, 
      isSuper: cfg.isSuper,
      pulseOffset: Math.random() * Math.PI * 2
    });
  }
}

export function purgeAllNormalEnemies(enemies, gems) {
  let count = 0;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e.isBoss && !e.isMiniBoss && !e.isBossSubTarget) {
      createHitParticles(e.x, e.y, '#e056fd', 8);
      addDamageText(e.x, e.y, 9999, true, '#e056fd');
      if (e.xp > 0) {
        gems.push({
          x: e.x,
          y: e.y,
          value: e.xp,
          ...getGemConfig(e.xp),
          forcedPull: true
        });
      }
      addBloodSplat(e.x, e.y);
      enemies.splice(i, 1);
      count++;
    }
  }
  playSfx('kill');
  return count;
}

export function triggerSuperMagnet(gems) {
  let count = gems.length;
  for (let i = 0; i < gems.length; i++) {
    gems[i].forcedPull = true;
  }
  playSfx('chest_rare');
  return count;
}

export function updatePickups(dt, {
  player,
  enemies,
  gems,
  props,
  drops,
  chests,
  gameState,
  frameCount,
  cameraViewW,
  cameraViewH,
  triggerShake,
  setFreezeTimer,
  setIsWavePaused,
  resetSpawnTimer,
  setLastAttackerName
}) {
  // 1. Regeneração contínua de Vida (Meta-Talento: Bênção Vital)
  if (player.hpRegen > 0 && player.hp > 0 && player.hp < player.maxHp) {
    player.hp = Math.min(player.maxHp, player.hp + player.hpRegen * (dt / 60));
  }

  // 2. Verificação de Sobrevivência e Renascimento da Fênix
  if (player.hp <= 0 && !gameState.isDead) {
    if ((player.phoenixRevives || 0) > 0) {
      player.phoenixRevives--;
      player.hp = Math.round(player.maxHp * 0.35);
      player.iFrames = 90;
      triggerShake(16);
      try { playSfx('warp'); } catch(e) {}
      triggerHaptic('heavy');
      addDamageText(player.x, player.y, "RENASCIMENTO DA FÊNIX!", true, "#f1c40f");
      createHitParticles(player.x, player.y, "#f1c40f", 16);

      // Repele e danifica inimigos próximos
      enemies.forEach(e => {
        const dSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
        if (dSq < 240 * 240) {
          const ang = Math.atan2(e.y - player.y, e.x - player.x);
          e.pushVx = Math.cos(ang) * 16;
          e.pushVy = Math.sin(ang) * 16;
          e.hp -= 40;
          e.hitFlash = 6;
        }
      });
    } else {
      setLastAttackerName("Horda Devoradora");
      player.hp = 0;
      triggerDeath();
      return { playerDied: true };
    }
  }

  // 3. Props Destrutíveis
  for (let i = props.length - 1; i >= 0; i--) {
    const p = props[i];
    if (p.hitFlash > 0) p.hitFlash -= dt;
    if (p.hp <= 0) {
      createHitParticles(p.x, p.y, '#bdc3c7', 6);
      const rand = Math.random();
      if (rand < 0.35) drops.push({ x: p.x, y: p.y, type: 'HEART', radius: 8, life: 1200 });
      else if (rand < 0.65) drops.push({ x: p.x, y: p.y, type: 'MAGNET', radius: 8, life: 1200 });
      else drops.push({ x: p.x, y: p.y, type: 'CLOCK', radius: 8, life: 1200 });
      props.splice(i, 1);
    }
  }

  // 4. Drops de Campo (Coração, Ímã e Congelamento)
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.life -= dt;
    if (d.life <= 0) {
      drops.splice(i, 1);
      continue;
    }

    const dx = player.x - d.x;
    const dy = player.y - d.y;
    const sumR = player.radius + d.radius;

    if (dx * dx + dy * dy < sumR * sumR) {
      if (d.type === 'HEART') {
        player.hp = Math.min(player.maxHp, player.hp + 35);
        addDamageText(player.x, player.y, "+35 HP", false, "#2ecc71");
        playSfx('gem');
      } else if (d.type === 'MAGNET') {
        gems.forEach(g => { g.forcedPull = true; });
        addDamageText(player.x, player.y, "SUPER ÍMÃ!", true, "#00d2d3");
        playSfx('chest');
      } else if (d.type === 'CLOCK') {
        setFreezeTimer(240);
        addDamageText(player.x, player.y, "CONGELAMENTO!", true, "#3498db");
        playSfx('freeze');
      }
      drops.splice(i, 1);
    }
  }

  // 5. Baús Arcanos e de Chefes (Física 2.5D com Quiques no Solo)
  for (let i = chests.length - 1; i >= 0; i--) {
    const ch = chests[i];

    if (!ch.isResting) {
      ch.z = (ch.z || 0) + (ch.vz || 0) * dt;
      ch.vz = (ch.vz || 0) + (ch.gravity || 0.32) * dt;

      if (ch.z >= 0) {
        ch.z = 0;
        if (Math.abs(ch.vz) > 1.1) {
          ch.vz = -ch.vz * (ch.bounce || 0.52);
          createHitParticles(ch.x, ch.y, ch.tier === 'MINI_BOSS' ? '#3498db' : '#f1c40f', 4);
          playSfx('hit');
        } else {
          ch.vz = 0;
          ch.isResting = true;
          createHitParticles(ch.x, ch.y, ch.tier === 'MINI_BOSS' ? '#3498db' : '#f1c40f', 8);
        }
      }
    } else {
      ch.sparkleTimer = (ch.sparkleTimer || 0) + dt;
      if (ch.sparkleTimer > 35) {
        ch.sparkleTimer = 0;
        createHitParticles(ch.x + (Math.random() - 0.5) * 16, ch.y + (Math.random() - 0.5) * 12, ch.tier === 'MINI_BOSS' ? '#3498db' : '#f1c40f', 1);
      }
    }

    if (ch.isResting || Math.abs(ch.z) < 5) {
      const dx = player.x - ch.x;
      const dy = player.y - ch.y;
      const sumR = player.radius + ch.radius;
      if (dx * dx + dy * dy < sumR * sumR) {
        const tier = ch.tier || 'BOSS';
        chests.splice(i, 1);
        if (tier === 'BOSS') {
          const waveSeconds = Math.floor(frameCount / 60);
          const hordeSeconds = getEffectiveHordeSeconds(waveSeconds);
          const currentWave = getCurrentWave(hordeSeconds);
          transitionToArenaTheme(getWaveArenaTheme(currentWave.index), 120);
          setIsWavePaused(false);
          resetSpawnTimer();
        }
        openChestModal(tier);
        break;
      }
    }
  }

  // 6. Compressão de Gemas Distantes (Zero GC Spike)
  compressGems(gems, player);

  // 7. Atração Magnética e Coleta de Gemas
  const magnetSq = player.magnet * player.magnet;
  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i];
    const dx = player.x - g.x;
    const dy = player.y - g.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < magnetSq || g.forcedPull) {
      const angle = Math.atan2(dy, dx);
      const pullSpeed = g.forcedPull ? 14 : 7.5;
      g.x += Math.cos(angle) * pullSpeed * dt;
      g.y += Math.sin(angle) * pullSpeed * dt;
    }

    const collectDist = player.radius + g.radius;
    if (distSq < collectDist * collectDist) {
      addXP(g.value);
      gems.splice(i, 1);
    }
  }

  // 8. Despawn Seguro de Monstros Excessivamente Distantes (Cull de memória)
  const despawnDist = Math.hypot(cameraViewW / 2, cameraViewH / 2) + 500;
  const despawnDistSq = despawnDist * despawnDist;
  let writeIdx = 0;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    let keep = true;
    if (!e.isBoss && !e.isMiniBoss && !e.isBossSubTarget) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (dx * dx + dy * dy >= despawnDistSq) keep = false;
    }
    if (keep) enemies[writeIdx++] = e;
  }
  enemies.length = writeIdx;

  return { playerDied: false };
}
