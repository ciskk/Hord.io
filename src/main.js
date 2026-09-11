/**
 * src/main.js
 */
import { 
  player, 
  resetPlayer, 
  updateSkillUI, 
  initSkillUI, 
  fireWeapons, 
  updateSpinningAxes, 
  addXP, 
  selectedHeroKey, 
  addPersistentGold, 
  getPersistentGold 
} from './entities/player.js';
import { inputX, inputY } from './core/input.js';
import { clearSpatialGrid, insertIntoGrid, getNeighborIndices } from './core/spatialGrid.js';
import { spawnMobCluster, spawnProp } from './entities/enemies.js';
import { ENEMY_TYPES } from './config/enemies.js';
import { 
  getCurrentWave, 
  checkBossSchedule, 
  resetBossSchedule,
  resetBossesDefeated, 
  onBossDefeated,
  checkMiniBossSchedule, 
  resetMiniBossSchedule,
  setFirstBossKilled 
} from './systems/waves.js';
import { initUI, openCharacterSelect, triggerDeath, triggerVictory, openChestModal } from './systems/ui.js';
import { render } from './render/renderer.js';
import { playSfx, triggerHaptic } from './core/audio.js';
import { updateBoss } from './entities/bosses/bossRegistry.js';

export let canvas = null;
export let ctx = null;

export let dpr = 1;
export let viewW = window.innerWidth;
export let viewH = window.innerHeight;

export function resize() {
  if (!canvas) {
    canvas = document.getElementById('game-canvas');
  }
  if (canvas && !ctx) {
    ctx = canvas.getContext('2d', { alpha: false });
  }
  if (!canvas) return;

  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  viewW = window.innerWidth;
  viewH = window.innerHeight;
  canvas.width = Math.floor(viewW * dpr);
  canvas.height = Math.floor(viewH * dpr);
  canvas.style.width = viewW + 'px';
  canvas.style.height = viewH + 'px';
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => { setTimeout(resize, 100); });

export const gameState = {
  isPaused: true,
  isDead: false,
  isWon: false,
  kills: 0,
  isWavePaused: false
};

export let frameCount = 0;
export let spawnTimer = 0;
export let screenShake = 0;
export let freezeTimer = 0;
export let currentArenaTheme = 'INDUSTRIAL';
export let lastTime = performance.now();

export function setLastTime(t) { lastTime = t; }
export function resetSpawnTimer() { spawnTimer = 0; }
export function setCurrentArenaTheme(theme) { currentArenaTheme = theme; }
export function setIsWavePaused(val) { gameState.isWavePaused = val; }
export function triggerShake(intensity) { screenShake = Math.max(screenShake, intensity); }

export const camera = { x: 0, y: 0 };
export let enemies = [];
export let bullets = [];
export let enemyBullets = [];
export let acidPuddles = [];
export let gems = [];
export let particles = [];
export let damageTexts = [];
export let props = [];
export let drops = [];
export let chests = [];
export let bloodSplats = [];
export let bossTelegraphs = [];
export let bossProjectiles = [];
export let bossShockwaves = [];
export let voidVortices = [];
export let activeBoss = null;

export function setActiveBoss(boss) { activeBoss = boss; }

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

function compressGems() {
  if (gems.length <= 70) return;
  const offscreen = [];
  const keepDistSq = 720 * 720;

  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i];
    const dx = g.x - player.x;
    const dy = g.y - player.y;
    if (dx * dx + dy * dy > keepDistSq) offscreen.push(i);
  }

  if (offscreen.length >= 10) {
    let accumulatedXp = 0;
    const targetX = gems[offscreen[0]].x;
    const targetY = gems[offscreen[0]].y;

    offscreen.forEach(idx => { accumulatedXp += gems[idx].value; });
    offscreen.sort((a, b) => b - a).forEach(idx => gems.splice(idx, 1));

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

export function resetGame() {
  resize();
  resetPlayer(selectedHeroKey);

  enemies.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  acidPuddles.length = 0;
  gems.length = 0;
  particles.length = 0;
  damageTexts.length = 0;
  props.length = 0;
  drops.length = 0;
  chests.length = 0;
  bloodSplats.length = 0;
  bossTelegraphs.length = 0;
  bossProjectiles.length = 0;
  bossShockwaves.length = 0;
  voidVortices.length = 0;
  activeBoss = null;

  resetBossSchedule();
  resetMiniBossSchedule();
  currentArenaTheme = 'INDUSTRIAL';
  gameState.isWavePaused = false;
  gameState.kills = 0;
  frameCount = 0;
  spawnTimer = 0;
  screenShake = 0;
  freezeTimer = 0;
  gameState.isDead = false;
  gameState.isWon = false;
  gameState.isPaused = false;
  lastTime = performance.now();

  updateSkillUI();

  const hideEl = id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  };

  hideEl('boss-hud');
  hideEl('freeze-overlay');
  hideEl('death-modal');
  hideEl('victory-modal');
  hideEl('chest-modal');
  hideEl('upgrade-modal');
  hideEl('talents-modal');
  hideEl('char-modal');
  hideEl('boss-select-modal');

  const bossHpFill = document.getElementById('boss-hp-fill');
  if (bossHpFill) {
    bossHpFill.style.background = '';
    bossHpFill.style.boxShadow = '';
  }
}

function update(dt) {
  frameCount += dt;
  const seconds = Math.floor(frameCount / 60);
  const currentWave = getCurrentWave(seconds);

  if (screenShake > 0) screenShake = Math.max(0, screenShake - 0.7 * dt);

  const freezeOverlay = document.getElementById('freeze-overlay');
  if (freezeTimer > 0) {
    freezeTimer -= dt;
    if (freezeOverlay) freezeOverlay.style.display = 'block';
  } else {
    if (freezeOverlay) freezeOverlay.style.display = 'none';
  }

  if (player.iFrames > 0) player.iFrames = Math.max(0, player.iFrames - dt);
  if (player.skillCd > 0) player.skillCd = Math.max(0, player.skillCd - dt);
  if (player.invisTimer > 0) player.invisTimer = Math.max(0, player.invisTimer - dt);

  if (player.berserkTimer > 0) {
    player.berserkTimer = Math.max(0, player.berserkTimer - dt);
    if (Math.floor(frameCount) % 6 === 0) {
      createHitParticles(player.x + (Math.random() - 0.5) * 24, player.y + (Math.random() - 0.5) * 24, '#e74c3c', 1);
    }
  }

  let isSlowed = false;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.eliteMod === 'FROST') {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      if (dx * dx + dy * dy < 125 * 125) {
        isSlowed = true;
        break;
      }
    }
  }

  let insideVortex = false;
  for (let i = voidVortices.length - 1; i >= 0; i--) {
    const v = voidVortices[i];
    v.life -= dt;

    const vdx = v.x - player.x;
    const vdy = v.y - player.y;
    const vDistSq = vdx * vdx + vdy * vdy;
    const vDist = Math.sqrt(vDistSq);

    if (vDist < 240 && vDist > 12) {
      player.x += (vdx / vDist) * 0.95 * dt;
      player.y += (vdy / vDist) * 0.95 * dt;
    }

    if (vDist < v.radius) {
      insideVortex = true;
      v.tickTimer = (v.tickTimer || 0) + dt;
      if (v.tickTimer > 24 && player.iFrames <= 0) {
        v.tickTimer = 0;
        player.hp -= v.damage;
        player.iFrames = 20;
        triggerShake(5);
        playSfx('hit');
        addDamageText(player.x, player.y, `-${v.damage}`, false, '#9b59b6');
        createHitParticles(player.x, player.y, '#8e44ad', 4);
        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return;
        }
      }
    }

    if (v.life <= 0) voidVortices.splice(i, 1);
  }

  player.speed = isSlowed ? player.baseSpeed * 0.65 : (insideVortex ? player.baseSpeed * 0.72 : player.baseSpeed);

  if (player.dashDuration > 0) {
    player.dashDuration -= dt;
    player.x += player.dashVx * dt;
    player.y += player.dashVy * dt;
    createHitParticles(player.x, player.y, '#f1c40f', 2);

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.isBoss && e.mistState === 'DASHING') continue;

      const dSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
      if (dSq < (player.radius + e.radius + 18) ** 2) {
        let impactDmg = player.damage * 1.8;
        if (e.isBoss) {
          impactDmg *= 0.40;
          if (e.isVulnerable) impactDmg *= 1.25;
          const maxCap = e.maxHp * 0.035;
          if (impactDmg > maxCap) impactDmg = maxCap;
        }
        e.hp -= impactDmg;
        e.hitFlash = 4;
        addDamageText(e.x, e.y, Math.round(impactDmg), true, '#f1c40f');
        createHitParticles(e.x, e.y, '#f1c40f', 3);

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
  } else if (player.ignisDashDuration > 0) {
    player.ignisDashDuration -= dt;
    player.x += player.ignisDashVx * dt;
    player.y += player.ignisDashVy * dt;
    player.iFrames = Math.max(player.iFrames, 6);
    createHitParticles(player.x, player.y, '#e67e22', 3);

    if (Math.floor(frameCount) % 3 === 0) {
      acidPuddles.push({
        x: player.x,
        y: player.y,
        radius: 36,
        life: 280,
        maxLife: 280,
        isFire: true
      });
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.isBoss && e.mistState === 'DASHING') continue;

      const dSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
      if (dSq < (player.radius + e.radius + 16) ** 2) {
        let impactDmg = player.damage * 1.5;
        if (e.isBoss) {
          impactDmg *= 0.40;
          if (e.isVulnerable) impactDmg *= 1.25;
          const maxCap = e.maxHp * 0.035;
          if (impactDmg > maxCap) impactDmg = maxCap;
        }
        e.hp -= impactDmg;
        e.hitFlash = 3;
        addDamageText(e.x, e.y, Math.round(impactDmg), true, '#e67e22');
      }
    }
  } else {
    player.isMoving = (inputX * inputX + inputY * inputY) > 0.01;
    if (player.isMoving) {
      player.walkCycle += 0.22 * dt;
      if (Math.abs(inputX) > 0.05) player.facing = inputX > 0 ? 1 : -1;
    } else {
      player.walkCycle = 0;
    }

    player.x += inputX * player.speed * dt;
    player.y += inputY * player.speed * dt;
  }

  camera.x = player.x - viewW / 2;
  camera.y = player.y - viewH / 2;

  player.weapons.forEach(w => { w.timer += dt; });
  fireWeapons();
  updateSpinningAxes(dt);

  if (player.auraLvl > 0 || player.evolvedAura) {
    player.auraTimer += dt;
    const auraInterval = player.evolvedAura ? 18 : 26;
    if (player.auraTimer >= auraInterval) {
      player.auraTimer = 0;
      const auraRadius = (player.evolvedAura ? 150 : 65) + player.auraLvl * 18;
      const aRadiusSq = auraRadius * auraRadius;
      let auraDmg = player.damage * (player.evolvedAura ? 0.85 : 0.45 * player.auraLvl);

      if (player.evolvedAura && Math.random() < 0.15 && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + 2);
        addDamageText(player.x, player.y, "+2", false, '#2ecc71');
      }

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.isBoss && e.mistState === 'DASHING') continue;

        const dx = e.x - player.x;
        const dy = e.y - player.y;
        if (dx * dx + dy * dy < aRadiusSq) {
          let currentAuraDmg = auraDmg;
          if (e.isBoss) {
            currentAuraDmg *= 0.40;
            if (e.isVulnerable) currentAuraDmg *= 1.25;
          }
          const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
          let finalDmg = isCrit ? currentAuraDmg * player.critMult : currentAuraDmg;

          if (e.isBoss) {
            const maxCap = e.maxHp * 0.035;
            if (finalDmg > maxCap) finalDmg = maxCap;
          }

          e.hp -= finalDmg;
          e.hitFlash = 3;
          if (isCrit) playSfx('crit');
          addDamageText(e.x, e.y, finalDmg, isCrit, '#f1c40f');
          createHitParticles(e.x, e.y, '#f1c40f', 2);

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

  if (player.orbitals > 0) {
    player.orbitalAngle += (player.evolvedOrbitals ? 0.13 : 0.068) * dt;
    const orbDist = player.evolvedOrbitals ? 88 : 72;
    for (let oIdx = 0; oIdx < player.orbitals; oIdx++) {
      const angle = player.orbitalAngle + (oIdx * (Math.PI * 2 / player.orbitals));
      const ox = player.x + Math.cos(angle) * orbDist;
      const oy = player.y + Math.sin(angle) * orbDist;

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.orbitalHitCd > 0 || (e.isBoss && e.mistState === 'DASHING')) continue;
        const dx = e.x - ox;
        const dy = e.y - oy;
        const rSum = e.radius + 12;
        if (dx * dx + dy * dy < rSum * rSum) {
          let dmg = player.damage * (player.evolvedOrbitals ? 1.2 : 0.75);
          if (e.isBoss) {
            dmg *= 0.40;
            if (e.isVulnerable) dmg *= 1.25;
          }
          const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
          let finalDmg = isCrit ? dmg * player.critMult : dmg;

          if (e.isBoss) {
            const maxCap = e.maxHp * 0.035;
            if (finalDmg > maxCap) finalDmg = maxCap;
          }

          e.hp -= finalDmg;
          e.hitFlash = 4;
          e.orbitalHitCd = player.evolvedOrbitals ? 8 : 16;
          playSfx('hit');
          if (isCrit) playSfx('crit');
          addDamageText(e.x, e.y, finalDmg, isCrit, '#3498db');
          createHitParticles(ox, oy, '#00d2d3', 2);

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

  checkBossSchedule(seconds);
  checkMiniBossSchedule(seconds);

  if (!gameState.isWavePaused) {
    spawnTimer += dt;
    if (spawnTimer >= currentWave.rate) {
      const chosenType = currentWave.types[Math.floor(Math.random() * currentWave.types.length)];
      const count = Math.floor(Math.random() * (currentWave.clusterSize[1] - currentWave.clusterSize[0] + 1)) + currentWave.clusterSize[0];
      spawnMobCluster(chosenType, count, currentWave.eliteChance);
      if (Math.random() < 0.26) spawnProp();
      spawnTimer = 0;
    }
  }

  clearSpatialGrid();
  for (let i = 0; i < enemies.length; i++) {
    insertIntoGrid(enemies[i], i);
  }

  const frameMod = Math.floor(frameCount) % 2;
  for (let i = frameMod; i < enemies.length; i += 2) {
    const e1 = enemies[i];
    if (e1.baseType === 'BAT' || (e1.isBoss && e1.mistState === 'DASHING')) continue;

    const neighbors = getNeighborIndices(e1.x, e1.y, e1.radius * 2);
    for (let k = 0; k < neighbors.length; k++) {
      const j = neighbors[k];
      if (j <= i) continue;
      const e2 = enemies[j];
      if (!e2) continue;
      const dx = e2.x - e1.x;
      const dy = e2.y - e1.y;
      const distSq = dx * dx + dy * dy;
      const minDist = e1.radius + e2.radius;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = (minDist - dist) * 0.35;
        const nx = dx / dist;
        const ny = dy / dist;
        e1.x -= nx * overlap;
        e1.y -= ny * overlap;
        e2.x += nx * overlap;
        e2.y += ny * overlap;
      }
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    if (b.type === 'HAMMER_SLAM') {
      b.life -= dt;

      for (let bIdx = enemyBullets.length - 1; bIdx >= 0; bIdx--) {
        const eb = enemyBullets[bIdx];
        const edx = eb.x - b.x;
        const edy = eb.y - b.y;
        if (edx * edx + edy * edy < (b.radius + eb.radius) ** 2) {
          createHitParticles(eb.x, eb.y, '#f1c40f', 3);
          enemyBullets.splice(bIdx, 1);
        }
      }

      const nearbyIndices = getNeighborIndices(b.x, b.y, b.radius + 20);
      const targets = [];
      for (let k = 0; k < nearbyIndices.length; k++) {
        const candidate = enemies[nearbyIndices[k]];
        if (candidate) targets.push(candidate);
      }
      if (activeBoss && !targets.includes(activeBoss)) {
        targets.push(activeBoss);
      }

      for (let k = 0; k < targets.length; k++) {
        const e = targets[k];
        if (!e || b.hitSet.has(e) || (e.isBoss && e.mistState === 'DASHING')) continue;

        const dx = e.x - b.x;
        const dy = e.y - b.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < (e.radius + b.radius) ** 2) {
          b.hitSet.add(e);
          
          const hitAngle = Math.atan2(dy, dx);
          let diff = Math.abs(hitAngle - b.angle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;

          let angleMultiplier = 1.0;
          if (diff > Math.PI * 0.6) {
            angleMultiplier = 0.35;
          } else if (diff > Math.PI * 0.25) {
            angleMultiplier = 0.65;
          }

          let dmg = b.damage * angleMultiplier;
          if (e.isBoss) {
            dmg *= 0.40;
            if (e.isVulnerable) dmg *= 1.25;
          }

          const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
          let finalDmg = isCrit ? dmg * player.critMult : dmg;

          if (e.isBoss) {
            const maxHitAllowed = e.maxHp * 0.035;
            if (finalDmg > maxHitAllowed) finalDmg = maxHitAllowed;
          }

          e.hp -= finalDmg;
          e.hitFlash = 5;
          playSfx('hit');
          if (isCrit) playSfx('crit');
          addDamageText(e.x, e.y, Math.round(finalDmg), isCrit, '#f1c40f');
          createHitParticles(e.x, e.y, '#f1c40f', Math.ceil(4 * angleMultiplier));

          const pushDist = Math.sqrt(distSq) || 1;
          const force = (b.isEvolved ? 52 : 36) * angleMultiplier;
          e.x += (dx / pushDist) * force;
          e.y += (dy / pushDist) * force;
          triggerShake(5 * angleMultiplier);

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

      if (b.life <= 0) {
        bullets.splice(i, 1);
        continue;
      }
    } else if (b.type === 'POTION') {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += 0.22 * dt;
      b.angle = (b.angle || 0) + 0.22 * dt;
      b.life -= dt;

      if (b.life <= 0) {
        playSfx('acid');
        const landX = b.targetX !== undefined ? b.targetX : b.x;
        const landY = b.targetY !== undefined ? b.targetY : b.y;
        createHitParticles(landX, landY, '#2ecc71', 12);

        acidPuddles.push({
          x: landX,
          y: landY,
          radius: b.isEvolved ? 70 : 50,
          life: 280,
          maxLife: 280,
          isFire: false,
          isAlchemist: true,
          damage: b.damage
        });
        bullets.splice(i, 1);
        continue;
      }
    } else {
      b.trail.unshift({ x: b.x, y: b.y });
      if (b.trail.length > 4) b.trail.pop();

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      const nearbyIndices = getNeighborIndices(b.x, b.y, b.radius + 20);
      const targets = [];
      for (let k = 0; k < nearbyIndices.length; k++) {
        const candidate = enemies[nearbyIndices[k]];
        if (candidate) targets.push(candidate);
      }
      if (activeBoss && !targets.includes(activeBoss)) {
        targets.push(activeBoss);
      }

      for (let k = 0; k < targets.length; k++) {
        const e = targets[k];
        if (!e || (b.hitSet && b.hitSet.has(e)) || (e.isBoss && e.mistState === 'DASHING')) continue;
        const dx = e.x - b.x;
        const dy = e.y - b.y;
        const rSum = e.radius + b.radius;

        if (dx * dx + dy * dy < rSum * rSum) {
          if (b.hitSet) b.hitSet.add(e);

          let dmg = b.damage;

          if (b.type === 'STAFF') {
            dmg *= Math.pow(0.80, b.hitCount || 0);
          }

          if (b.type === 'SWORD' || b.type === 'STAFF') {
            const distToOrigin = Math.hypot(e.x - player.x, e.y - player.y);
            let falloffMult = 1.0;
            if (distToOrigin > 230) {
              falloffMult = 0.55;
            } else if (distToOrigin > 130) {
              falloffMult = 0.80;
            } else {
              falloffMult = 1.00;
            }
            dmg *= falloffMult;
          }

          if (e.isBoss) {
            dmg *= 0.40;
            if (e.isVulnerable) dmg *= 1.25;

            if (Math.hypot(player.x - e.x, player.y - e.y) > 180) {
              dmg *= 0.65;
            }
          }

          if (selectedHeroKey === 'ROGUE' && (e.hp / e.maxHp) < 0.35) {
            dmg *= e.isBoss ? 1.15 : 1.5;
          }

          if (e.baseType === 'SHIELDED' || e.behavior === 'shielded') {
            const hitAngle = Math.atan2(b.y - e.y, b.x - e.x);
            const faceAngle = e.facing > 0 ? 0 : Math.PI;
            let diff = Math.abs(hitAngle - faceAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < 1.1) {
              dmg *= 0.25;
              createHitParticles(b.x, b.y, '#b2bec3', 3);

              if (e.isMiniBoss) {
                enemyBullets.push({
                  x: b.x,
                  y: b.y,
                  vx: -b.vx * 0.5,
                  vy: -b.vy * 0.5,
                  radius: 5,
                  damage: Math.round(e.damage * 0.5),
                  life: 60
                });
                playSfx('hit');
              }
            }
          }

          const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
          let finalDmg = isCrit ? dmg * player.critMult : dmg;

          if (e.isBoss) {
            const maxHitAllowed = e.maxHp * 0.035;
            if (finalDmg > maxHitAllowed) finalDmg = maxHitAllowed;
          }

          if (b.type === 'STAFF' && (isCrit || b.isEvolved)) {
            acidPuddles.push({ x: e.x, y: e.y, radius: b.isEvolved ? 32 : 22, life: 140, maxLife: 140, isFire: true });
          }

          if (player.slowChance > 0 && Math.random() < player.slowChance) {
            e.slowTimer = 150;
            e.slowFactor = 0.55;
            createHitParticles(e.x, e.y, '#74b9ff', 2);
          }

          e.hp -= finalDmg;
          e.hitFlash = 4;
          playSfx('hit');
          if (isCrit) playSfx('crit');
          addDamageText(b.x, b.y, finalDmg, isCrit, b.type === 'STAFF' ? '#e67e22' : '#ffffff');
          createHitParticles(b.x, b.y, isCrit ? '#f1c40f' : (b.type === 'STAFF' ? '#e67e22' : '#00d2d3'), 2);

          if (e.isBoss && (e.hp / e.maxHp) < 0.45 && !e.isEnraged) {
            e.isEnraged = true;
            e.speed *= 1.35;
            triggerShake(15);
            playSfx('boss');
            addDamageText(e.x, e.y, "EM FÚRIA!", true, '#e74c3c');
          }

          b.piercing--;
          if (b.type === 'STAFF') {
            b.hitCount = (b.hitCount || 0) + 1;
          }
          if (b.piercing <= 0) {
            b.life = 0;
            break;
          }
        }
      }

      if (b.life <= 0) bullets.splice(i, 1);
    }
  }

  for (let i = bossShockwaves.length - 1; i >= 0; i--) {
    const sw = bossShockwaves[i];
    sw.radius += sw.speed * dt;

    const sdx = player.x - sw.x;
    const sdy = player.y - sw.y;
    const sDist = Math.sqrt(sdx * sdx + sdy * sdy);

    if (!sw.hitPlayer && Math.abs(sDist - sw.radius) < 16 && player.iFrames <= 0) {
      player.hp -= sw.damage;
      player.iFrames = 25;
      sw.hitPlayer = true;
      triggerShake(9);
      playSfx('hit');
      addDamageText(player.x, player.y, `-${sw.damage}`, false, '#e67e22');
      createHitParticles(player.x, player.y, '#d35400', 5);

      if (player.hp <= 0) {
        player.hp = 0;
        triggerDeath();
        return;
      }
    }

    if (sw.radius >= sw.maxRadius) bossShockwaves.splice(i, 1);
  }

  for (let i = bossTelegraphs.length - 1; i >= 0; i--) {
    const tel = bossTelegraphs[i];
    tel.timer -= dt;

    if (tel.timer <= 0) {
      if (tel.type === 'MIST_DASH_LANE') {
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
        if (dSq < tel.radius * tel.radius && player.iFrames <= 0) {
          player.hp -= tel.damage;
          player.iFrames = 25;
          triggerShake(10);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#8e44ad');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return;
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'SCYTHE_CLEAVE') {
        triggerShake(14);
        playSfx('boss');
        createHitParticles(tel.x, tel.y, '#00cec9', 16);

        const cdx = player.x - tel.x;
        const cdy = player.y - tel.y;
        const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
        const playerAng = Math.atan2(cdy, cdx);

        let angleDiff = Math.abs(playerAng - tel.angle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        if (cDist < tel.radius && angleDiff <= Math.PI * 0.52 && player.iFrames <= 0) {
          player.hp -= tel.damage;
          player.iFrames = 28;
          triggerShake(12);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, true, '#00cec9');
          player.x += Math.cos(playerAng) * 28;
          player.y += Math.sin(playerAng) * 28;

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return;
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
        if (dSq < tel.radius * tel.radius && player.iFrames <= 0) {
          player.hp -= tel.damage;
          player.iFrames = 25;
          triggerShake(10);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#e67e22');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return;
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'FISSURE_NODE') {
        triggerShake(5);
        if (tel.nodeIndex === 1 || tel.nodeIndex === 4) {
          playSfx('hit');
        }
        createHitParticles(tel.x, tel.y, '#d35400', 8);
        createHitParticles(tel.x, tel.y, '#f39c12', 5);

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.iFrames <= 0) {
          player.hp -= tel.damage;
          player.iFrames = 25;
          triggerShake(8);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#e67e22');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return;
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
      if (dSq < tel.radius * tel.radius && player.iFrames <= 0) {
        player.hp -= tel.damage;
        player.iFrames = 25;
        triggerShake(10);
        playSfx('hit');
        addDamageText(player.x, player.y, `-${tel.damage}`, false, '#e74c3c');

        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return;
        }
      }
      bossTelegraphs.splice(i, 1);
    }
  }

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
        const tgt = activeBoss ? activeBoss : player;
        const retAng = Math.atan2(tgt.y - bp.y, tgt.x - bp.x);
        bp.vx = Math.cos(retAng) * 7.5;
        bp.vy = Math.sin(retAng) * 7.5;
      }
    }

    bp.x += bp.vx * dt;
    bp.y += bp.vy * dt;

    const pdx = player.x - bp.x;
    const pdy = player.y - bp.y;
    if (player.iFrames <= 0 && (pdx * pdx + pdy * pdy) < (player.radius + bp.radius) ** 2) {
      player.hp -= bp.damage;
      player.iFrames = 25;
      triggerShake(8);
      playSfx('hit');
      addDamageText(player.x, player.y, `-${bp.damage}`, false, '#e74c3c');

      if (player.hp <= 0) {
        player.hp = 0;
        triggerDeath();
        return;
      }
    }

    if (bp.life <= 0) bossProjectiles.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    eb.x += eb.vx * dt;
    eb.y += eb.vy * dt;
    eb.life -= dt;

    const dx = player.x - eb.x;
    const dy = player.y - eb.y;
    const rSum = player.radius + eb.radius;

    if (dx * dx + dy * dy < rSum * rSum) {
      if (player.iFrames <= 0) {
        player.hp -= eb.damage;
        player.iFrames = 25;
        triggerShake(6);
        playSfx('hit');
        addDamageText(player.x, player.y, `-${eb.damage}`, false, '#e74c3c');
        createHitParticles(player.x, player.y, '#e74c3c', 4);
        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return;
        }
      }
      eb.life = 0;
    }

    if (eb.life <= 0) enemyBullets.splice(i, 1);
  }

  for (let i = acidPuddles.length - 1; i >= 0; i--) {
    const p = acidPuddles[i];
    p.life -= dt;

    if (p.isFire || p.isAlchemist) {
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (e.isBoss && e.mistState === 'DASHING') continue;
        const dSq = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
        if (dSq < p.radius * p.radius) {
          let baseRate = p.isAlchemist ? ((p.damage || 32) * 0.033) : 0.65;
          let puddleDmg = baseRate * dt;
          if (e.isBoss) {
            puddleDmg *= 0.40;
            if (e.isVulnerable) puddleDmg *= 1.25;
          }
          e.hp -= puddleDmg;
          e.hitFlash = 1;

          if (p.isAlchemist) {
            e.slowTimer = 40;
            e.slowFactor = 0.50;
          }
        }
      }
    } else {
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      if (dx * dx + dy * dy < p.radius * p.radius && player.iFrames <= 0) {
        player.hp -= 6;
        player.iFrames = 20;
        playSfx('acid');
        addDamageText(player.x, player.y, "-6", false, '#2ecc71');
        createHitParticles(player.x, player.y, '#2ecc71', 3);
        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return;
        }
      }
    }

    if (p.life <= 0) acidPuddles.splice(i, 1);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.orbitalHitCd > 0) e.orbitalHitCd -= dt;

    if (e.stunTimer > 0) {
      e.stunTimer -= dt;
      continue;
    }

    if (freezeTimer <= 0) {
      const isConfused = (player.invisTimer > 0 && !e.isBoss);
      const targetX = isConfused ? (e.x + Math.sin(frameCount * 0.05 + i) * 120) : player.x;
      const targetY = isConfused ? (e.y + Math.cos(frameCount * 0.05 + i) * 120) : player.y;

      const angle = Math.atan2(targetY - e.y, targetX - e.x);
      e.facing = (targetX - e.x) > 0 ? 1 : -1;
      
      let curSpeed = e.speed;
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        const maxSlow = e.isBoss ? 0.18 : (e.slowFactor || 0.5);
        curSpeed *= (1 - maxSlow);
      }

      if (e.isBoss && e.isEnraged && Math.floor(frameCount) % 5 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 1.4,
          e.y + (Math.random() - 0.5) * e.radius * 1.4,
          '#e74c3c',
          1
        );
      }

      if (e.isBoss && e.windupTimer > 0) {
        e.windupTimer -= dt;
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius,
          e.y + (Math.random() - 0.5) * e.radius,
          e.color,
          1
        );
        if (e.windupTimer <= 0 && e.windupAction) {
          e.windupAction();
          e.windupAction = null;
        }
        continue;
      }

      if (e.isBoss) {
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
          addDamageText
        });
      } else if (e.behavior === 'swarm') {
        e.x += Math.cos(angle + Math.sin(frameCount * 0.1) * 0.4) * curSpeed * dt;
        e.y += Math.sin(angle + Math.sin(frameCount * 0.1) * 0.4) * curSpeed * dt;
      } else if (e.behavior === 'shooter') {
        const isPlayerVisible = player.invisTimer <= 0;
        
        if (isPlayerVisible) {
          const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
          if (distToPlayerSq < 170 * 170) {
            e.x -= Math.cos(angle) * curSpeed * dt;
            e.y -= Math.sin(angle) * curSpeed * dt;
          } else if (distToPlayerSq > 240 * 240) {
            e.x += Math.cos(angle) * curSpeed * dt;
            e.y += Math.sin(angle) * curSpeed * dt;
          }
          e.shootTimer += dt;
          if (e.shootTimer >= 110) {
            e.shootTimer = 0;
            enemyBullets.push({
              x: e.x, y: e.y,
              vx: Math.cos(angle) * 4.2, vy: Math.sin(angle) * 4.2,
              radius: 5, damage: 13, life: 95
            });
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
          if (e.dashTimer > 110) {
            e.dashState = 'aim';
            e.dashTimer = 0;
            e.dashAngle = angle;
          }
        } else if (e.dashState === 'aim') {
          e.hitFlash = 1;
          if (e.dashTimer > 20) {
            e.dashState = 'dashing';
            e.dashTimer = 0;
          }
        } else if (e.dashState === 'dashing') {
          curSpeed = e.speed * 4.0;
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
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
        if ((player.x - e.x) ** 2 + (player.y - e.y) ** 2 < 36 * 36) {
          e.hp = 0;
        }
      } else if (e.behavior === 'kamikaze_spread') {
        e.x += Math.cos(angle) * curSpeed * 1.25 * dt;
        e.y += Math.sin(angle) * curSpeed * 1.25 * dt;
        if ((player.x - e.x) ** 2 + (player.y - e.y) ** 2 < 45 * 45) {
          e.hp = 0;
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
          e.hitFlash = 1;
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
              stunTimer: 0
            });
          }
        }
      } else if (e.behavior === 'blink_slash') {
        e.blinkTimer = (e.blinkTimer || 0) + dt;
        if (e.blinkTimer < 100) {
          e.x += Math.cos(angle) * curSpeed * dt;
          e.y += Math.sin(angle) * curSpeed * dt;
        } else if (e.blinkTimer < 130) {
          e.hitFlash = 1;
          if (Math.floor(frameCount) % 4 === 0) {
            createHitParticles(e.x, e.y, '#a29bfe', 2);
          }
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
          if (Math.floor(frameCount) % 15 === 0) {
            const spinAng = frameCount * 0.15;
            playSfx('shoot');
            for (let s = 0; s < 2; s++) {
              const sOffset = spinAng + s * Math.PI;
              enemyBullets.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(sOffset) * 3.6,
                vy: Math.sin(sOffset) * 3.6,
                radius: 5,
                damage: Math.round(e.damage * 0.35),
                life: 85
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
            triggerShake(8);
            playSfx('hit');
            addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#341f97');

            if (player.hp <= 0) {
              player.hp = 0;
              triggerDeath();
              return;
            }
          }
        }
      } else if (e.behavior === 'shielded') {
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
      } else {
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
      }
    }

    const pdx = player.x - e.x;
    const pdy = player.y - e.y;
    const pDistLimit = player.radius + e.radius;

    if (player.iFrames <= 0 && (pdx * pdx + pdy * pdy) < pDistLimit * pDistLimit) {
      let playerDmgTaken = e.damage;
      if (selectedHeroKey === 'KNIGHT') playerDmgTaken *= 0.80;

      player.hp -= playerDmgTaken;
      player.iFrames = 25;
      triggerShake(7);
      playSfx('hit');
      triggerHaptic('medium');
      addDamageText(player.x, player.y, `-${Math.round(playerDmgTaken)}`, false, '#e74c3c');
      createHitParticles(player.x, player.y, '#e74c3c', 6);

      if (selectedHeroKey === 'KNIGHT') {
        let reflectDmg = e.damage * 0.5;
        if (e.isBoss) {
          reflectDmg *= 0.40;
          const maxHitAllowed = e.maxHp * 0.035;
          if (reflectDmg > maxHitAllowed) reflectDmg = maxHitAllowed;
        }
        e.hp -= reflectDmg;
        e.hitFlash = 4;
        addDamageText(e.x, e.y, Math.round(reflectDmg), false, '#f1c40f');
      }

      if (player.hp <= 0) {
        player.hp = 0;
        triggerDeath();
        return;
      }
    }

    if (e.hp <= 0) {
      gameState.kills++;
      createHitParticles(e.x, e.y, e.color, 6);
      addBloodSplat(e.x, e.y);

      if (e.eliteMod === 'TOXIC') {
        acidPuddles.push({ x: e.x, y: e.y, radius: 32, life: 340, maxLife: 340, isFire: false });
      }

      if (e.behavior === 'kamikaze') {
        playSfx('hit');
        triggerShake(9);
        triggerHaptic('heavy');
        createHitParticles(e.x, e.y, '#e67e22', 12);
        if ((player.x - e.x) ** 2 + (player.y - e.y) ** 2 < 60 * 60 && player.iFrames <= 0) {
          player.hp -= e.damage;
          player.iFrames = 20;
          addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#e67e22');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return;
          }
        }
      }

      if (e.behavior === 'kamikaze_spread') {
        playSfx('hit');
        triggerShake(12);
        triggerHaptic('heavy');
        createHitParticles(e.x, e.y, '#e67e22', 16);
        const pDistSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
        if (pDistSq < 75 * 75 && player.iFrames <= 0) {
          player.hp -= e.damage;
          player.iFrames = 25;
          triggerShake(9);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#e67e22');
          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return;
          }
        }
        const spreadCount = 8;
        for (let bIdx = 0; bIdx < spreadCount; bIdx++) {
          const bAng = (bIdx * Math.PI * 2) / spreadCount;
          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(bAng) * 4.0,
            vy: Math.sin(bAng) * 4.0,
            radius: 5,
            damage: Math.round(e.damage * 0.45),
            life: 80
          });
        }
      }

      if (e.behavior === 'splitter') {
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
            stunTimer: 0
          });
        }
      }

      if (!e.isMiniBoss && (Math.random() < 0.28 || e.isElite)) {
        const goldVal = e.isElite ? 5 : 1;
        addPersistentGold(goldVal);
      }

      if (e.isBoss) {
        triggerShake(20);
        triggerHaptic('heavy');

        if (e.bossId === 1) {
          setFirstBossKilled(true);
        }
        
        const bossXp = e.xp || 400;
        gems.push({
          x: e.x,
          y: e.y,
          radius: 12,
          color: '#e056fd',
          value: Math.floor(bossXp * 0.65),
          isSuper: true,
          forcedPull: true,
          pulseOffset: 0
        });

        for (let k = 0; k < 4; k++) {
          const bAngle = (k * Math.PI * 2) / 4;
          gems.push({
            x: e.x + Math.cos(bAngle) * 36,
            y: e.y + Math.sin(bAngle) * 36,
            radius: 9,
            color: '#e056fd',
            value: Math.floor(bossXp * 0.09),
            isSuper: true,
            forcedPull: true,
            pulseOffset: k
          });
        }

        const bossGold = 120 * (e.bossId || 1);
        addPersistentGold(bossGold);
        addDamageText(e.x, e.y - 18, `+${bossGold} OURO!`, true, '#f1c40f');

        onBossDefeated(seconds);

        if (e.isFinalBoss) {
          triggerVictory();
          return;
        }

        chests.push({ x: e.x, y: e.y, radius: 16, tier: 'BOSS' });
        activeBoss = null;
        bossTelegraphs.length = 0;
        bossProjectiles.length = 0;
        bossShockwaves.length = 0;
        voidVortices.length = 0;
        const bossHud = document.getElementById('boss-hud');
        if (bossHud) bossHud.style.display = 'none';
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

        if (e.behavior === 'splitter_queen') {
          for (let k = 0; k < 3; k++) {
            spawnMobCluster('SPLITTER', 1);
          }
        }

        if (Math.random() < 0.40) {
          chests.push({ x: e.x, y: e.y, radius: 14, tier: 'MINI_BOSS' });
        }
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

      enemies.splice(i, 1);
    }
  }

  // Verificação de segurança global de integridade do jogador
  if (player.hp <= 0 && !gameState.isDead) {
    player.hp = 0;
    triggerDeath();
    return;
  }

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
        freezeTimer = 240;
        addDamageText(player.x, player.y, "CONGELAMENTO!", true, "#3498db");
        playSfx('freeze');
      }
      drops.splice(i, 1);
    }
  }

  for (let i = chests.length - 1; i >= 0; i--) {
    const ch = chests[i];
    const dx = player.x - ch.x;
    const dy = player.y - ch.y;
    const sumR = player.radius + ch.radius;
    if (dx * dx + dy * dy < sumR * sumR) {
      const tier = ch.tier || 'BOSS';
      chests.splice(i, 1);
      openChestModal(tier);
      break;
    }
  }

  compressGems();

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

  const despawnDist = Math.hypot(viewW / 2, viewH / 2) + 500;
  const despawnDistSq = despawnDist * despawnDist;
  let writeIdx = 0;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    let keep = true;
    if (!e.isBoss && !e.isMiniBoss) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (dx * dx + dy * dy >= despawnDistSq) {
        keep = false;
      }
    }
    if (keep) {
      enemies[writeIdx++] = e;
    }
  }
  enemies.length = writeIdx;

  const hpVal = document.getElementById('hp-val');
  if (hpVal) hpVal.innerText = Math.max(0, Math.ceil(player.hp));

  const hpFill = document.getElementById('hp-fill');
  if (hpFill) hpFill.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;

  const lvlVal = document.getElementById('lvl-val');
  if (lvlVal) lvlVal.innerText = player.level;

  const killsVal = document.getElementById('kills-val');
  if (killsVal) killsVal.innerText = gameState.kills;

  const xpFill = document.getElementById('xp-fill');
  if (xpFill) xpFill.style.width = `${Math.min(100, (player.xp / player.nextXp) * 100)}%`;

  const goldVal = document.getElementById('gold-val');
  if (goldVal) goldVal.innerText = getPersistentGold();
  
  const waveBanner = document.getElementById('wave-banner');
  if (waveBanner) {
    if (gameState.isWavePaused && !activeBoss) {
      waveBanner.innerText = "ABRA O BAÚ PARA CONTINUAR!";
    } else {
      waveBanner.innerText = currentWave.name;
    }
  }

  updateSkillUI();

  if (activeBoss) {
    const bossHpPct = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
    const bossHpFill = document.getElementById('boss-hp-fill');
    if (bossHpFill) {
      bossHpFill.style.width = `${bossHpPct}%`;
      if (activeBoss.isEnraged) {
        bossHpFill.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
        bossHpFill.style.boxShadow = '0 0 12px rgba(231, 76, 60, 0.85)';
      } else {
        bossHpFill.style.background = '';
        bossHpFill.style.boxShadow = '';
      }
    }
    const bossHpVal = document.getElementById('boss-hp-val');
    if (bossHpVal) bossHpVal.innerText = `${Math.ceil(bossHpPct)}%`;
  }

  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  const timerVal = document.getElementById('timer-val');
  if (timerVal) timerVal.innerText = `${m}:${s}`;
}

function loop(now) {
  if (!now) now = performance.now();
  const rawDt = (now - lastTime) / (1000 / 60);
  lastTime = now;
  const dt = Math.min(Math.max(rawDt, 0.1), 2.5);

  if (!gameState.isPaused && !gameState.isDead && !gameState.isWon) {
    update(dt);
  }
  render();
  requestAnimationFrame(loop);
}

function startApplication() {
  try {
    resize();
  } catch (err) {
    console.warn('Aviso: Falha ao redimensionar Canvas:', err);
  }

  try {
    initSkillUI();
  } catch (err) {
    console.warn('Aviso: Falha ao inicializar Skill UI:', err);
  }

  try {
    initUI();
  } catch (err) {
    console.error('Erro crítico ao inicializar UI base:', err);
  }

  try {
    openCharacterSelect();
  } catch (err) {
    console.error('Erro crítico ao abrir seletor de personagens:', err);
  }

  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApplication);
} else {
  startApplication();
}