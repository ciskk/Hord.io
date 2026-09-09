import { 
  player, 
  resetPlayer, 
  updateSkillUI, 
  initSkillUI, 
  fireWeapons, 
  addXP, 
  selectedHeroKey 
} from './entities/player.js';
import { inputX, inputY } from './core/input.js';
import { clearSpatialGrid, insertIntoGrid, getNeighborIndices } from './core/spatialGrid.js';
import { spawnMobCluster, spawnProp } from './entities/enemies.js';
import { ENEMY_TYPES } from './config/enemies.js';
import { getCurrentWave, checkBossSchedule, resetBossesDefeated } from './systems/waves.js';
import { initUI, openCharacterSelect, triggerDeath, triggerVictory, openChestModal } from './systems/ui.js';
import { render } from './render/renderer.js';
import { playSfx, triggerHaptic } from './core/audio.js';

// Canvas e Contexto
export const canvas = document.getElementById('game-canvas');
export const ctx = canvas.getContext('2d');

export let dpr = 1;
export let viewW = window.innerWidth;
export let viewH = window.innerHeight;

export function resize() {
  dpr = window.devicePixelRatio || 1;
  viewW = window.innerWidth;
  viewH = window.innerHeight;
  canvas.width = Math.floor(viewW * dpr);
  canvas.height = Math.floor(viewH * dpr);
  canvas.style.width = viewW + 'px';
  canvas.style.height = viewH + 'px';
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => { setTimeout(resize, 100); });
resize();

// Estado Global de Jogo
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

// Câmera e Coleções de Entidades
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
export let activeBoss = null;

export function setActiveBoss(boss) { activeBoss = boss; }

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
  if (bloodSplats.length > 130) bloodSplats.shift();
  bloodSplats.push({
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 8,
    r: Math.random() * 7 + 5,
    color: color
  });
}

function compressGems() {
  if (gems.length <= 80) return;
  const offscreen = [];
  const keepDistSq = (Math.max(viewW, viewH) * 0.8) ** 2;

  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i];
    const dx = g.x - player.x;
    const dy = g.y - player.y;
    if (dx * dx + dy * dy > keepDistSq) offscreen.push(i);
  }

  if (offscreen.length >= 12) {
    let accumulatedXp = 0;
    const targetX = gems[offscreen[0]].x;
    const targetY = gems[offscreen[0]].y;

    offscreen.forEach(idx => { accumulatedXp += gems[idx].value; });
    offscreen.sort((a, b) => b - a).forEach(idx => gems.splice(idx, 1));

    gems.push({ x: targetX, y: targetY, radius: 7, value: accumulatedXp, isSuper: true });
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
  activeBoss = null;

  resetBossesDefeated();
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

  document.getElementById('boss-hud').style.display = 'none';
  document.getElementById('freeze-overlay').style.display = 'none';
  document.getElementById('death-modal').style.display = 'none';
  document.getElementById('victory-modal').style.display = 'none';
  document.getElementById('chest-modal').style.display = 'none';
  document.getElementById('upgrade-modal').style.display = 'none';
  document.getElementById('char-modal').style.display = 'none';
}

function update(dt) {
  frameCount += dt;
  const seconds = Math.floor(frameCount / 60);
  const currentWave = getCurrentWave(seconds);

  if (screenShake > 0) screenShake = Math.max(0, screenShake - 0.7 * dt);

  if (freezeTimer > 0) {
    freezeTimer -= dt;
    document.getElementById('freeze-overlay').style.display = 'block';
  } else {
    document.getElementById('freeze-overlay').style.display = 'none';
  }

  if (player.iFrames > 0) player.iFrames = Math.max(0, player.iFrames - dt);
  if (player.skillCd > 0) player.skillCd = Math.max(0, player.skillCd - dt);
  if (player.invisTimer > 0) player.invisTimer = Math.max(0, player.invisTimer - dt);

  let isSlowed = false;
  for (let e of enemies) {
    if (e.eliteMod === 'FROST') {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      if (dx * dx + dy * dy < 125 * 125) {
        isSlowed = true;
        break;
      }
    }
  }
  player.speed = isSlowed ? player.baseSpeed * 0.65 : player.baseSpeed;

  if (player.dashDuration > 0) {
    player.dashDuration -= dt;
    player.x += player.dashVx * dt;
    player.y += player.dashVy * dt;
    createHitParticles(player.x, player.y, '#f1c40f', 3);

    for (let e of enemies) {
      const dSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
      if (dSq < (player.radius + e.radius + 18) ** 2) {
        let impactDmg = player.damage * 1.8;
        if (e.isBoss) impactDmg *= 0.70;
        e.hp -= impactDmg;
        e.hitFlash = 4;
        addDamageText(e.x, e.y, Math.round(impactDmg), true, '#f1c40f');
        createHitParticles(e.x, e.y, '#f1c40f', 5);

        if (e.isBoss && (e.hp / e.maxHp) < 0.45 && !e.isEnraged) {
          e.isEnraged = true;
          e.speed *= 1.35;
          triggerShake(15);
          playSfx('boss');
          addDamageText(e.x, e.y, "EM FÚRIA!", true, '#e74c3c');
        }
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

  player.attackTimer += dt;
  if (player.attackTimer >= player.attackCooldown) {
    fireWeapons();
    player.attackTimer = 0;
  }

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

      enemies.forEach(e => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        if (dx * dx + dy * dy < aRadiusSq) {
          let currentAuraDmg = auraDmg;
          if (e.isBoss) currentAuraDmg *= 0.70;
          const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
          const finalDmg = isCrit ? currentAuraDmg * player.critMult : currentAuraDmg;
          e.hp -= finalDmg;
          e.hitFlash = 3;
          if (isCrit) playSfx('crit');
          addDamageText(e.x, e.y, finalDmg, isCrit, '#f1c40f');
          createHitParticles(e.x, e.y, '#f1c40f', 2);

          if (e.isBoss && (e.hp / e.maxHp) < 0.45 && !e.isEnraged) {
            e.isEnraged = true;
            e.speed *= 1.35;
            triggerShake(15);
            playSfx('boss');
            addDamageText(e.x, e.y, "EM FÚRIA!", true, '#e74c3c');
          }
        }
      });
    }
  }

  if (player.orbitals > 0) {
    player.orbitalAngle += (player.evolvedOrbitals ? 0.13 : 0.068) * dt;
    const orbDist = player.evolvedOrbitals ? 88 : 72;
    for (let oIdx = 0; oIdx < player.orbitals; oIdx++) {
      const angle = player.orbitalAngle + (oIdx * (Math.PI * 2 / player.orbitals));
      const ox = player.x + Math.cos(angle) * orbDist;
      const oy = player.y + Math.sin(angle) * orbDist;

      for (let e of enemies) {
        if (e.orbitalHitCd > 0) continue;
        const dx = e.x - ox;
        const dy = e.y - oy;
        const rSum = e.radius + 12;
        if (dx * dx + dy * dy < rSum * rSum) {
          let dmg = player.damage * (player.evolvedOrbitals ? 1.2 : 0.75);
          if (e.isBoss) dmg *= 0.70;
          const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
          const finalDmg = isCrit ? dmg * player.critMult : dmg;
          e.hp -= finalDmg;
          e.hitFlash = 4;
          e.orbitalHitCd = player.evolvedOrbitals ? 8 : 16;
          playSfx('hit');
          if (isCrit) playSfx('crit');
          addDamageText(e.x, e.y, finalDmg, isCrit, '#3498db');
          createHitParticles(ox, oy, '#00d2d3', 3);

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

  if (Math.floor(frameCount) % 2 === 0) {
    for (let i = 0; i < enemies.length; i++) {
      const e1 = enemies[i];
      if (e1.baseType === 'BAT') continue;

      const neighbors = getNeighborIndices(e1.x, e1.y, e1.radius * 2);
      for (let k = 0; k < neighbors.length; k++) {
        const j = neighbors[k];
        if (j <= i) continue;
        const e2 = enemies[j];
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
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.trail.unshift({ x: b.x, y: b.y });
    if (b.trail.length > 5) b.trail.pop();

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    const nearbyIndices = getNeighborIndices(b.x, b.y, b.radius + 20);
    for (let k = 0; k < nearbyIndices.length; k++) {
      const e = enemies[nearbyIndices[k]];
      if (!e) continue;
      const dx = e.x - b.x;
      const dy = e.y - b.y;
      const rSum = e.radius + b.radius;

      if (dx * dx + dy * dy < rSum * rSum) {
        let dmg = b.damage;
        if (e.isBoss) dmg *= 0.70;

        if (selectedHeroKey === 'ROGUE' && (e.hp / e.maxHp) < 0.35) {
          dmg *= 2.5;
        }

        if (e.baseType === 'SHIELDED') {
          const hitAngle = Math.atan2(b.y - e.y, b.x - e.x);
          const faceAngle = e.facing > 0 ? 0 : Math.PI;
          let diff = Math.abs(hitAngle - faceAngle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < 1.1) {
            dmg *= 0.25;
            createHitParticles(b.x, b.y, '#b2bec3', 4);
          }
        }

        const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
        const finalDmg = isCrit ? dmg * player.critMult : dmg;

        if (selectedHeroKey === 'MAGE' && isCrit) {
          acidPuddles.push({ x: e.x, y: e.y, radius: 22, life: 140, maxLife: 140, isFire: true });
        }

        e.hp -= finalDmg;
        e.hitFlash = 4;
        playSfx('hit');
        if (isCrit) playSfx('crit');
        addDamageText(b.x, b.y, finalDmg, isCrit, '#ffffff');
        createHitParticles(b.x, b.y, isCrit ? '#f1c40f' : '#00d2d3');

        if (e.isBoss && (e.hp / e.maxHp) < 0.45 && !e.isEnraged) {
          e.isEnraged = true;
          e.speed *= 1.35;
          triggerShake(15);
          playSfx('boss');
          addDamageText(e.x, e.y, "EM FÚRIA!", true, '#e74c3c');
        }

        b.piercing--;
        if (b.piercing <= 0) {
          b.life = 0;
          break;
        }
      }
    }

    if (b.life <= 0) bullets.splice(i, 1);
  }

  for (let i = bossTelegraphs.length - 1; i >= 0; i--) {
    const tel = bossTelegraphs[i];
    tel.timer -= dt;

    if (tel.timer <= 0) {
      triggerShake(12);
      playSfx('boss');
      createHitParticles(tel.x, tel.y, '#e74c3c', 22);

      const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
      if (dSq < tel.radius * tel.radius && player.iFrames <= 0) {
        player.hp -= tel.damage;
        player.iFrames = 25;
        triggerShake(10);
        playSfx('hit');
        addDamageText(player.x, player.y, `-${tel.damage}`, false, '#e74c3c');
      }
      bossTelegraphs.splice(i, 1);
    }
  }

  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const bp = bossProjectiles[i];
    bp.life -= dt;
    bp.angle = (bp.angle || 0) + 0.3 * dt;

    if (bp.life < bp.maxLife * 0.5) {
      const tgt = activeBoss ? activeBoss : player;
      const retAng = Math.atan2(tgt.y - bp.y, tgt.x - bp.x);
      bp.vx = Math.cos(retAng) * 7.5;
      bp.vy = Math.sin(retAng) * 7.5;
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
        createHitParticles(player.x, player.y, '#e74c3c', 6);
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

    if (p.isFire) {
      for (let e of enemies) {
        const dSq = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
        if (dSq < p.radius * p.radius) {
          let puddleDmg = 0.65 * dt;
          if (e.isBoss) puddleDmg *= 0.70;
          e.hp -= puddleDmg;
          e.hitFlash = 1;
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
        createHitParticles(player.x, player.y, '#2ecc71', 4);
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

    if (freezeTimer <= 0) {
      const targetX = player.invisTimer > 0 ? (e.x + Math.sin(frameCount * 0.05 + i) * 120) : player.x;
      const targetY = player.invisTimer > 0 ? (e.y + Math.cos(frameCount * 0.05 + i) * 120) : player.y;

      const angle = Math.atan2(targetY - e.y, targetX - e.x);
      e.facing = (targetX - e.x) > 0 ? 1 : -1;
      let curSpeed = e.speed;

      if (e.isBoss) {
        e.stateTimer = (e.stateTimer || 0) + dt;

        if (e.bossId === 1) {
          const attackInterval = e.isEnraged ? 35 : 65;
          if (e.stateTimer > attackInterval) {
            e.stateTimer = 0;
            if (e.isEnraged) {
              for (let wave = 0; wave < 4; wave++) {
                const waveOffset = wave * (Math.PI / 8);
                for (let k = 0; k < 12; k++) {
                  const fAng = (k * Math.PI * 2 / 12) + waveOffset;
                  const spd = 3.6 + wave * 0.7;
                  enemyBullets.push({
                    x: e.x, y: e.y,
                    vx: Math.cos(fAng) * spd, vy: Math.sin(fAng) * spd,
                    radius: 6, damage: 10, life: 110
                  });
                }
              }
              playSfx('shoot');
            } else {
              const bAng = Math.atan2(player.y - e.y, player.x - e.x);
              for (let k = -3; k <= 3; k++) {
                const fAng = bAng + (k * 0.22);
                enemyBullets.push({
                  x: e.x, y: e.y,
                  vx: Math.cos(fAng) * 4.8, vy: Math.sin(fAng) * 4.8,
                  radius: 6, damage: 8, life: 110
                });
              }
              playSfx('shoot');
            }
          }
          e.teleportTimer = (e.teleportTimer || 0) + dt;
          const teleInterval = e.isEnraged ? 240 : 360;
          if (e.teleportTimer > teleInterval) {
            e.teleportTimer = 0;
            e.x = player.x + (Math.random() - 0.5) * 260;
            e.y = player.y + (Math.random() - 0.5) * 260;
            createHitParticles(e.x, e.y, '#8e44ad', 18);
            playSfx('boss');
          }
        }
        else if (e.bossId === 2) {
          const attackInterval = e.isEnraged ? 45 : 80;
          if (e.stateTimer > attackInterval) {
            e.stateTimer = 0;
            const meteorCount = e.isEnraged ? 6 : 3;
            for (let m = 0; m < meteorCount; m++) {
              bossTelegraphs.push({
                x: player.x + (Math.random() - 0.5) * 160,
                y: player.y + (Math.random() - 0.5) * 160,
                radius: e.isEnraged ? 85 : 75,
                timer: 65,
                maxTimer: 65,
                damage: 42
              });
            }
            if (e.isEnraged) {
              bossTelegraphs.push({
                x: e.x,
                y: e.y,
                radius: 135,
                timer: 50,
                maxTimer: 50,
                damage: 50
              });
              triggerShake(8);
            }
          }
        }
        else if (e.bossId === 3) {
          const attackInterval = e.isEnraged ? 50 : 90;
          if (e.stateTimer > attackInterval) {
            e.stateTimer = 0;
            const sAng = Math.atan2(player.y - e.y, player.x - e.x);
            bossProjectiles.push({
              x: e.x, y: e.y,
              vx: Math.cos(sAng) * 6.5, vy: Math.sin(sAng) * 6.5,
              radius: 20, damage: 45, life: 160, maxLife: 160
            });
            if (e.isEnraged) {
              const oppAng = sAng + Math.PI;
              bossProjectiles.push({
                x: e.x, y: e.y,
                vx: Math.cos(oppAng) * 6.5, vy: Math.sin(oppAng) * 6.5,
                radius: 20, damage: 45, life: 160, maxLife: 160
              });
            }
            playSfx('shoot');
          }
        }
        else if (e.bossId === 4) {
          const laserCount = e.isEnraged ? 6 : 4;
          e.beamAngle += (e.isEnraged ? 0.035 : 0.016) * dt;

          if (e.isEnraged) {
            const gdx = e.x - player.x;
            const gdy = e.y - player.y;
            const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
            if (gdist > 20) {
              player.x += (gdx / gdist) * 1.1 * dt;
              player.y += (gdy / gdist) * 1.1 * dt;
            }
          }

          for (let arm = 0; arm < laserCount; arm++) {
            const bAng = e.beamAngle + (arm * (Math.PI * 2 / laserCount));
            const bx = Math.cos(bAng);
            const by = Math.sin(bAng);
            const px = player.x - e.x;
            const py = player.y - e.y;
            const proj = px * bx + py * by;
            if (proj > 0 && proj < 650) {
              const perpX = px - proj * bx;
              const perpY = py - proj * by;
              if (perpX * perpX + perpY * perpY < 18 * 18 && player.iFrames <= 0) {
                player.hp -= 24;
                player.iFrames = 22;
                triggerShake(9);
                playSfx('hit');
                addDamageText(player.x, player.y, "-24", false, '#9b59b6');
              }
            }
          }

          const spiralInterval = e.isEnraged ? 12 : 20;
          if (Math.floor(e.stateTimer) % spiralInterval === 0) {
            const spAng = frameCount * 0.15;
            enemyBullets.push({
              x: e.x, y: e.y,
              vx: Math.cos(spAng) * 4.2, vy: Math.sin(spAng) * 4.2,
              radius: 5, damage: 18, life: 130
            });
          }
        }

        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
      }
      else if (e.behavior === 'swarm') {
        e.x += Math.cos(angle + Math.sin(frameCount * 0.1) * 0.4) * curSpeed * dt;
        e.y += Math.sin(angle + Math.sin(frameCount * 0.1) * 0.4) * curSpeed * dt;
      } else if (e.behavior === 'shooter') {
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
      } else {
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
      }
    }

    const pdx = player.x - e.x;
    const pdy = player.y - e.y;
    const pDistLimit = player.radius + e.radius;

    if (player.iFrames <= 0 && (pdx * pdx + pdy * pdy) < pDistLimit * pDistLimit) {
      player.hp -= e.damage;
      player.iFrames = 25;
      triggerShake(7);
      playSfx('hit');
      triggerHaptic('medium');
      addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#e74c3c');
      createHitParticles(player.x, player.y, '#e74c3c', 7);

      if (selectedHeroKey === 'KNIGHT') {
        let reflectDmg = e.damage * 0.5;
        if (e.isBoss) reflectDmg *= 0.70;
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
      createHitParticles(e.x, e.y, e.color, 8);
      addBloodSplat(e.x, e.y);

      if (e.eliteMod === 'TOXIC') {
        acidPuddles.push({ x: e.x, y: e.y, radius: 32, life: 340, maxLife: 340, isFire: false });
      }

      if (e.behavior === 'kamikaze') {
        playSfx('hit');
        triggerShake(9);
        triggerHaptic('heavy');
        createHitParticles(e.x, e.y, '#e67e22', 15);
        if ((player.x - e.x) ** 2 + (player.y - e.y) ** 2 < 60 * 60 && player.iFrames <= 0) {
          player.hp -= e.damage;
          player.iFrames = 20;
          addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#e67e22');
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
            orbitalHitCd: 0
          });
        }
      }

      if (e.isBoss) {
        triggerShake(18);
        triggerHaptic('heavy');
        if (e.isFinalBoss) {
          triggerVictory();
          return;
        }
        chests.push({ x: e.x, y: e.y, radius: 16 });
        activeBoss = null;
        bossTelegraphs.length = 0;
        bossProjectiles.length = 0;
        document.getElementById('boss-hud').style.display = 'none';
      } else {
        gems.push({ x: e.x, y: e.y, radius: 4, value: e.xp, isSuper: false });
      }

      enemies.splice(i, 1);
    }
  }

  for (let i = props.length - 1; i >= 0; i--) {
    const p = props[i];
    if (p.hitFlash > 0) p.hitFlash -= dt;
    if (p.hp <= 0) {
      createHitParticles(p.x, p.y, '#bdc3c7', 7);
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
      chests.splice(i, 1);
      openChestModal();
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

  for (let i = damageTexts.length - 1; i >= 0; i--) {
    const dtItem = damageTexts[i];
    dtItem.x += dtItem.vx * dt;
    dtItem.y += dtItem.vy * dt;
    dtItem.vy += 0.16 * dt;
    dtItem.life -= dt;
    if (dtItem.life <= 0) damageTexts.splice(i, 1);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  const despawnDistSq = (Math.max(viewW, viewH) * 1.6) ** 2;
  enemies = enemies.filter(e => {
    if (e.isBoss) return true;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    return (dx * dx + dy * dy) < despawnDistSq;
  });

  document.getElementById('hp-val').innerText = Math.max(0, Math.ceil(player.hp));
  document.getElementById('hp-fill').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  document.getElementById('lvl-val').innerText = player.level;
  document.getElementById('kills-val').innerText = gameState.kills;
  document.getElementById('xp-fill').style.width = `${Math.min(100, (player.xp / player.nextXp) * 100)}%`;
  
  if (gameState.isWavePaused && !activeBoss) {
    document.getElementById('wave-banner').innerText = "ABRA O BAÚ PARA CONTINUAR!";
  } else {
    document.getElementById('wave-banner').innerText = currentWave.name;
  }

  updateSkillUI();

  if (activeBoss) {
    const bossHpPct = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
    document.getElementById('boss-hp-fill').style.width = `${bossHpPct}%`;
    document.getElementById('boss-hp-val').innerText = `${Math.ceil(bossHpPct)}%`;
  }

  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  document.getElementById('timer-val').innerText = `${m}:${s}`;
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

// Inicialização de UI, Habilidades e Loop
initSkillUI();
initUI();
openCharacterSelect();
requestAnimationFrame(loop);