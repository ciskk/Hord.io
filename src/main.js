/**
 * src/main.js
 * Loop Principal, Pipeline de Física/Combate e Sincronização Grim Cyber-Gothic
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
import { getNeighborIndices, rebuildSpatialGrid } from './core/spatialGrid.js';
import { resolveWorldPhysics } from './systems/physics.js';
import { 
  damageTexts, 
  particles, 
  bloodSplats, 
  dyingEnemies,
  addDyingEnemy,
  addDamageText, 
  createHitParticles, 
  addBloodSplat, 
  processEnemyMeleeAttacks, 
  updateCombatVisuals 
} from './systems/combat.js';
import { 
  bullets, 
  enemyBullets, 
  acidPuddles, 
  updateProjectiles, 
  updateAcidPuddles, 
  canSpawnEnemyBullet 
} from './systems/projectiles.js';
import { spawnSquad, spawnMobCluster, spawnProp } from './entities/enemies.js';
import { ENEMY_TYPES } from './config/enemies.js';
import { 
  getCurrentWave, 
  getEffectiveHordeSeconds,
  checkBossSchedule, 
  resetBossSchedule,
  resetBossesDefeated, 
  onBossDefeated,
  checkMiniBossSchedule, 
  resetMiniBossSchedule,
  setFirstBossKilled 
} from './systems/waves.js';
import { 
  initUI, 
  openCharacterSelect, 
  triggerDeath, 
  triggerVictory, 
  finalizeVictoryAndReturnToMenu,
  openChestModal,
  setBossRewardContext,
  ensureBossUpgradeCount,
  resetUpgradeQueue
} from './systems/ui.js';
import { render } from './render/renderer.js';
import { transitionToArenaTheme, getWaveArenaTheme, resetEnvironment, ARENA_PALETTES } from './render/environment.js';
import { playSfx, triggerHaptic, resetDeathAudioFilter } from './core/audio.js';
import { updateBoss } from './entities/bosses/bossRegistry.js';
import { updateMiniBoss } from './entities/minibossController.js';
import { initResponsive, layoutMetrics, updateLayoutMetrics, getHudBottom } from './core/responsive.js';
import { devCheats } from './systems/devtools.js';

// Reexportações diretas das variáveis de combate e projéteis
export { 
  damageTexts, 
  particles, 
  bloodSplats, 
  dyingEnemies, 
  addDamageText, 
  createHitParticles, 
  addBloodSplat, 
  processEnemyMeleeAttacks 
};

export { 
  bullets, 
  enemyBullets, 
  acidPuddles, 
  canSpawnEnemyBullet 
};

export let canvas = null;
export let ctx = null;

export let dpr = 1;
export let viewW = window.innerWidth;
export let viewH = window.innerHeight;

export function calculateCameraZoom(w, h) {
  const minDim = Math.min(w, h);
  // Em telas amplas (PC 1080p, 720p, laptops com minDim >= 650), mantém exatamente o zoom padrão de 1.25x
  // Em smartphones e telas compactas (minDim < 650), calibra o FOV para manter visibilidade de combate equilibrada (~520px de mundo)
  if (minDim >= 650) {
    return 1.25;
  }
  return Math.min(1.25, Math.max(0.65, minDim / 520));
}

export let CAMERA_ZOOM = typeof window !== 'undefined' ? calculateCameraZoom(window.innerWidth, window.innerHeight) : 1.25;
export let cameraViewW = viewW / CAMERA_ZOOM;
export let cameraViewH = viewH / CAMERA_ZOOM;

export function resize() {
  if (!canvas) {
    canvas = document.getElementById('game-canvas');
  }
  if (canvas && !ctx) {
    ctx = canvas.getContext('2d', { alpha: false });
  }
  if (!canvas) return;

  dpr = layoutMetrics.dpr || Math.min(window.devicePixelRatio || 1, 2.0);
  viewW = layoutMetrics.viewW || window.innerWidth;
  viewH = layoutMetrics.viewH || window.innerHeight;
  CAMERA_ZOOM = calculateCameraZoom(viewW, viewH);
  cameraViewW = viewW / CAMERA_ZOOM;
  cameraViewH = viewH / CAMERA_ZOOM;
  canvas.width = Math.floor(viewW * dpr);
  canvas.height = Math.floor(viewH * dpr);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
}

initResponsive(() => {
  resize();
});

export const gameState = {
  isPaused: true,
  isDead: false,
  isWon: false,
  kills: 0,
  isWavePaused: false
};

export let frameCount = 0;
export let spawnTimer = 999;
export let screenShake = 0;
export let freezeTimer = 0;
export let currentArenaTheme = 'IVORY_OSSUARY';
export let lastTime = performance.now();

// Controle Diegético: Rastreamento da Causa Mortis e Decaimento da Barra Fantasma (Ghost Bar)
export let lastAttackerName = '';
export function setLastAttackerName(name) { lastAttackerName = name; }

// Banner Cinematográfico de Transição de Ondas
export const waveAnnouncement = {
  name: '',
  index: 0,
  timer: 0,
  maxTimer: 180
};
export let lastAnnouncedWaveIndex = 0;

let ghostHp = 120;
let ghostHpTimer = 0;

let bossGhostHp = 0;
let bossGhostHpTimer = 0;
let _lastBossGhostHp = -1;

let cachedFreezeOverlay = null;
let isFreezeOverlayVisible = false;

export function setLastTime(t) { lastTime = t; }
export function resetSpawnTimer() { spawnTimer = 999; }
export function setCurrentArenaTheme(theme) { currentArenaTheme = theme; }
export function setIsWavePaused(val) { gameState.isWavePaused = val; }
export function triggerShake(intensity) { screenShake = Math.max(screenShake, intensity); }

export const camera = { x: 0, y: 0 };
export const cinematicCamera = {
  isCinematic: false,
  returningToPlayer: false,
  letterboxProgress: 0
};
export let enemies = [];
export let gems = [];
export let props = [];
export let drops = [];
export let chests = [];

export function spawnChest(x, y, tier = 'BOSS') {
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

/**
 * Funções utilitárias integradas do Console Secreto DevTools (W + 5)
 */
export function purgeAllNormalEnemies() {
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

export function triggerSuperMagnet() {
  let count = gems.length;
  for (let i = 0; i < gems.length; i++) {
    gems[i].forcedPull = true;
  }
  playSfx('chest_rare');
  return count;
}

export function warpToWaveTime(targetWaveIndex) {
  const waveTimes = {
    1: 0,
    2: 25,
    3: 55,
    4: 90,
    5: 130,
    6: 170,
    7: 210,
    8: 250,
    9: 290,
    10: 330
  };
  const targetSec = waveTimes[targetWaveIndex] !== undefined ? waveTimes[targetWaveIndex] : 0;
  frameCount = targetSec * 60;
  lastAnnouncedWaveIndex = 0;
  playSfx('level');
}

// Cache de nós estáticos do DOM para eliminar chamadas a document.getElementById e evitar Layout Thrashing
const hudDom = {
  hpVal: null,
  hpMaxVal: null,
  hpFill: null,
  hpGhostFill: null,
  hpPctVal: null,
  hpContainer: null,
  lvlVal: null,
  killsVal: null,
  xpVal: null,
  xpNextVal: null,
  xpFill: null,
  xpPctVal: null,
  goldVal: null,
  waveBanner: null,
  bossHud: null,
  bossHpGhostFill: null,
  bossHpFill: null,
  bossHpVal: null,
  timerVal: null
};

function ensureHudElementsCached() {
  if (!hudDom.hpVal) {
    hudDom.hpVal = document.getElementById('hp-val');
    hudDom.hpMaxVal = document.getElementById('hp-max-val');
    hudDom.hpFill = document.getElementById('hp-fill');
    hudDom.hpGhostFill = document.getElementById('hp-ghost-fill');
    hudDom.hpPctVal = document.getElementById('hp-pct-val');
    hudDom.hpContainer = document.getElementById('hp-container');
    hudDom.lvlVal = document.getElementById('lvl-val');
    hudDom.killsVal = document.getElementById('kills-val');
    hudDom.xpVal = document.getElementById('xp-val');
    hudDom.xpNextVal = document.getElementById('xp-next-val');
    hudDom.xpFill = document.getElementById('xp-fill');
    hudDom.xpPctVal = document.getElementById('xp-pct-val');
    hudDom.goldVal = document.getElementById('gold-val');
    hudDom.waveBanner = document.getElementById('wave-banner');
    hudDom.bossHud = document.getElementById('boss-hud');
    hudDom.bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
    hudDom.bossHpFill = document.getElementById('boss-hp-fill');
    hudDom.bossHpVal = document.getElementById('boss-hp-val');
    hudDom.timerVal = document.getElementById('timer-val');
  }
}

// Estados cacheados para Dirty Checking no loop principal
let _lastHp = -1;
let _lastMaxHp = -1;
let _lastHpPct = -1;
let _lastGhostHp = -1;
let _lastLvl = -1;
let _lastKills = -1;
let _lastXp = -1;
let _lastNextXp = -1;
let _lastXpPct = -1;
let _lastGold = -1;
let _lastWaveBannerText = '';
let _lastBossHpPct = -1;
let _lastBossEnraged = null;
let _lastTimerStr = '';

// Array estático indexador reutilizável para compressão de gemas (Zero-Allocation)
const _offscreenGems = [];

function compressGems() {
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

export function resetGame() {
  resize();
  resetPlayer(selectedHeroKey);
  player.bossIFrames = 0;
  player.isPhasing = false;
  player.alchemistBuffTimer = 0;
  player.alchemistSkillDisoriented = false;

  enemies.length = 0;
  dyingEnemies.length = 0;
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
  resetUpgradeQueue();
  currentArenaTheme = 'IVORY_OSSUARY';
  cinematicCamera.isCinematic = false;
  cinematicCamera.returningToPlayer = false;
  cinematicCamera.letterboxProgress = 0;
  resetEnvironment();
  gameState.isWavePaused = false;
  gameState.kills = 0;
  frameCount = 0;
  spawnTimer = 999;
  screenShake = 0;
  freezeTimer = 0;
  gameState.isDead = false;
  gameState.isWon = false;
  gameState.isPaused = false;
  lastTime = performance.now();

  // Reset de Variáveis Visuais e Grim Cyber-Gothic
  lastAttackerName = '';
  waveAnnouncement.timer = 0;
  waveAnnouncement.index = 0;
  waveAnnouncement.name = '';
  lastAnnouncedWaveIndex = 0;
  ghostHp = player.maxHp;
  ghostHpTimer = 0;
  _lastHp = -1;
  _lastMaxHp = -1;
  _lastHpPct = -1;
  _lastGhostHp = -1;
  _lastLvl = -1;
  _lastKills = -1;
  _lastXp = -1;
  _lastNextXp = -1;
  _lastXpPct = -1;
  _lastGold = -1;
  _lastWaveBannerText = '';
  _lastBossHpPct = -1;
  _lastBossEnraged = null;
  _lastTimerStr = '';
  resetDeathAudioFilter();

  const bloodFilter = document.getElementById('blood-screen-filter');
  if (bloodFilter) bloodFilter.classList.remove('active');

  const victoryFade = document.getElementById('victory-fade-overlay');
  if (victoryFade) victoryFade.classList.remove('active');

  updateSkillUI();

  const hideEl = id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('modal-hidden');
      el.style.setProperty('display', 'none', 'important');
      el.style.display = 'none';
    }
  };

  hideEl('boss-hud');
  hideEl('freeze-overlay');
  isFreezeOverlayVisible = false;
  hideEl('death-modal');
  hideEl('victory-modal');
  hideEl('chest-modal');
  hideEl('upgrade-modal');
  hideEl('talents-modal');
  hideEl('char-modal');
  hideEl('boss-select-modal');

  const bossHud = document.getElementById('boss-hud');
  if (bossHud) {
    bossHud.style.display = 'none';
    bossHud.classList.remove('enraged');
  }

  const bossHpFill = document.getElementById('boss-hp-fill');
  if (bossHpFill) {
    bossHpFill.style.background = '';
    bossHpFill.style.boxShadow = '';
    bossHpFill.style.width = '100%';
  }

  const bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
  if (bossHpGhostFill) {
    bossHpGhostFill.style.transition = 'none';
    bossHpGhostFill.style.width = '100%';
  }

  bossGhostHp = 0;
  bossGhostHpTimer = 0;
  _lastBossGhostHp = -1;
  _lastBossHpPct = -1;
  _lastBossEnraged = null;
}

function update(dt) {
  if (typeof devCheats !== 'undefined') {
    if (devCheats.godMode && player) {
      player.hp = player.maxHp;
      player.iFrames = 60;
    }
    if (devCheats.zeroCooldown && player) {
      player.skillCd = 0;
    }
  }

  frameCount += dt;
  const seconds = Math.floor(frameCount / 60);
  const hordeSeconds = getEffectiveHordeSeconds(seconds);
  const currentWave = getCurrentWave(hordeSeconds);

  // Gatilho de Anúncio Cinematográfico de Transição de Onda
  if (!activeBoss && currentWave && currentWave.index !== lastAnnouncedWaveIndex) {
    lastAnnouncedWaveIndex = currentWave.index;
    waveAnnouncement.name = currentWave.name;
    waveAnnouncement.index = currentWave.index;
    waveAnnouncement.timer = 180;
    waveAnnouncement.maxTimer = 180;
    triggerShake(4);
  }
  if (waveAnnouncement.timer > 0) {
    waveAnnouncement.timer -= dt;
  }

  // Transição suave de arena a cada 3 ondas (1-3 Ossário, 4-6 Sal Carmesim, 7-9 Basílica)
  if (!activeBoss) {
    const targetTheme = getWaveArenaTheme(currentWave.index);
    if (targetTheme !== currentArenaTheme) {
      transitionToArenaTheme(targetTheme);
    }
  }

  if (screenShake > 0) screenShake = Math.max(0, screenShake - 0.7 * dt);

  if (freezeTimer > 0) {
    freezeTimer -= dt;
    if (!isFreezeOverlayVisible) {
      if (!cachedFreezeOverlay) cachedFreezeOverlay = document.getElementById('freeze-overlay');
      if (cachedFreezeOverlay) cachedFreezeOverlay.style.display = 'block';
      isFreezeOverlayVisible = true;
    }
  } else if (isFreezeOverlayVisible) {
    if (!cachedFreezeOverlay) cachedFreezeOverlay = document.getElementById('freeze-overlay');
    if (cachedFreezeOverlay) cachedFreezeOverlay.style.display = 'none';
    isFreezeOverlayVisible = false;
  }

  // Timers do Jogador e Sincronização de Estados Reativos
  if (player.iFrames > 0) player.iFrames = Math.max(0, player.iFrames - dt);
  if (player.bossIFrames > 0) player.bossIFrames = Math.max(0, player.bossIFrames - dt);
  if (player.skillCd > 0) player.skillCd = Math.max(0, player.skillCd - dt);
  if (player.staffCastTimer > 0) player.staffCastTimer = Math.max(0, player.staffCastTimer - dt);
  if (player.potionThrowTimer > 0) player.potionThrowTimer = Math.max(0, player.potionThrowTimer - dt);
  if (player.alchemistSkillTimer > 0) player.alchemistSkillTimer = Math.max(0, player.alchemistSkillTimer - dt);

  if (player.invisTimer > 0) {
    player.invisTimer = Math.max(0, player.invisTimer - dt);
    player.isPhasing = player.invisTimer > 0;
  } else {
    player.isPhasing = false;
  }

  if (player.berserkTimer > 0) {
    player.berserkTimer = Math.max(0, player.berserkTimer - dt);
    if (Math.floor(frameCount) % 6 === 0) {
      createHitParticles(player.x + (Math.random() - 0.5) * 24, player.y + (Math.random() - 0.5) * 24, '#e74c3c', 1);
    }
  }

  if (selectedHeroKey === 'ALCHEMIST') {
    // Escape de vapor contínuo da retorta dorsal
    const ventFrequency = (player.alchemistSkillTimer > 0 || (player.alchemistBuffTimer || 0) > 0) ? 3 : (player.isMoving ? 14 : 34);
    if (Math.floor(frameCount) % ventFrequency === 0) {
      const ventX = player.x - player.facing * 9;
      const ventY = player.y - 14;
      const pColor = (player.alchemistSkillTimer > 0 || (player.alchemistBuffTimer || 0) > 0)
        ? (player.evolvedPotion ? '#e056fd' : '#d6a2e8')
        : (player.evolvedPotion ? '#a29bfe' : '#9b59b6');
      createHitParticles(ventX, ventY, pColor, (player.alchemistSkillTimer > 0) ? 3 : 1);
    }

    // Passiva: Decaimento e Partículas do Vapor Estimulante Móvel (+15% vel)
    if (player.alchemistBuffTimer > 0) {
      player.alchemistBuffTimer -= dt;
      if (Math.floor(frameCount) % 6 === 0) {
        createHitParticles(player.x + (Math.random() - 0.5) * 14, player.y + 6, '#d6a2e8', 1);
      }
    }

    // Habilidade: Reagente Volátil (0.6s de imunidade de fuga e fumaça desorientadora em 120px)
    if (player.alchemistSkillTimer > 0 && !player.alchemistSkillDisoriented) {
      player.alchemistSkillDisoriented = true;
      player.iFrames = Math.max(player.iFrames, 36);
      player.bossIFrames = Math.max(player.bossIFrames, 36);
      triggerShake(5);
      playSfx('acid');
      createHitParticles(player.x, player.y, '#a55eea', 16);
      createHitParticles(player.x, player.y, '#55efc4', 12);

      for (let k = 0; k < enemies.length; k++) {
        const en = enemies[k];
        if (!en || en.hp <= 0 || en.isBoss) continue;
        const edx = en.x - player.x;
        const edy = en.y - player.y;
        if (edx * edx + edy * edy < 120 * 120) {
          en.confusedTimer = 110;
          addDamageText(en.x, en.y - 10, "DESORIENTADO!", false, '#a55eea');
          createHitParticles(en.x, en.y, '#9b59b6', 5);
        }
      }
    } else if (player.alchemistSkillTimer <= 0) {
      player.alchemistSkillDisoriented = false;
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
      if (v.tickTimer > 24 && player.bossIFrames <= 0) {
        v.tickTimer = 0;
        player.hp -= v.damage;
        player.bossIFrames = 15;
        lastAttackerName = "Vórtice do Vazio";
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

  let currentSpeed = isSlowed ? player.baseSpeed * 0.65 : (insideVortex ? player.baseSpeed * 0.72 : player.baseSpeed);
  if (player.invisTimer > 0) {
    currentSpeed *= 2;
  }
  if (player.alchemistBuffTimer > 0) {
    currentSpeed *= 1.15;
  }
  player.speed = currentSpeed;

  if (player.dashDuration > 0) {
    player.dashDuration -= dt;

    const inputLen = Math.hypot(inputX, inputY);
    if (inputLen > 0.05) {
      const moveAng = Math.atan2(inputY, inputX);
      player.dashVx = Math.cos(moveAng) * 16;
      player.dashVy = Math.sin(moveAng) * 16;
      if (Math.abs(player.dashVx) > 0.1) {
        player.facing = player.dashVx >= 0 ? 1 : -1;
      }
    }

    player.x += player.dashVx * dt;
    player.y += player.dashVy * dt;
    createHitParticles(player.x, player.y, '#f1c40f', 3);
    createHitParticles(player.x, player.y, '#ffffff', 2);
    if (Math.floor(frameCount) % 3 === 0) {
      createHitParticles(player.x, player.y, '#00d2d3', 2);
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.hp <= 0 || e.isTargetable === false) continue;
      if (e.isBoss && (e.mistState === 'DASHING' || e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
      if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;

      const dSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
      if (dSq < (player.radius + e.radius + 20) ** 2) {
        let impactDmg = player.damage * 1.3;
        if (e.isBoss || e.isBossSubTarget) {
          impactDmg *= 1.25;
          if (e.isVulnerable) impactDmg *= 1.25;
        }
        e.hp -= impactDmg;
        e.hitFlash = 5;
        addDamageText(e.x, e.y, Math.round(impactDmg), true, '#f1c40f');
        createHitParticles(e.x, e.y, '#f1c40f', 4);
        createHitParticles(e.x, e.y, '#ffffff', 3);

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

    if (player.dashDuration <= 0) {
      triggerShake(13);
      playSfx('boss');
      triggerHaptic('heavy');
      createHitParticles(player.x, player.y, '#f1c40f', 24);
      createHitParticles(player.x, player.y, '#ffffff', 18);
      createHitParticles(player.x, player.y, '#00cec9', 14);
    }
  } else if (player.ignisDashDuration > 0) {
    player.ignisDashDuration -= dt;

    const inputLen = Math.hypot(inputX, inputY);
    if (inputLen > 0.05) {
      const moveAng = Math.atan2(inputY, inputX);
      player.ignisDashVx = Math.cos(moveAng) * 15.5;
      player.ignisDashVy = Math.sin(moveAng) * 15.5;
      if (Math.abs(player.ignisDashVx) > 0.1) {
        player.facing = player.ignisDashVx >= 0 ? 1 : -1;
      }
    }

    player.x += player.ignisDashVx * dt;
    player.y += player.ignisDashVy * dt;
    player.iFrames = Math.max(player.iFrames, 8);

    createHitParticles(player.x, player.y, '#ffffff', 2);
    createHitParticles(player.x, player.y, '#f1c40f', 3);
    createHitParticles(player.x, player.y, '#e67e22', 2);

    if (Math.floor(frameCount) % 2 === 0) {
      acidPuddles.push({
        x: player.x,
        y: player.y,
        radius: 38,
        life: 280,
        maxLife: 280,
        isFire: true
      });
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.hp <= 0 || e.isTargetable === false) continue;
      if (e.isBoss && (e.mistState === 'DASHING' || e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
      if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;

      const dSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
      if (dSq < (player.radius + e.radius + 18) ** 2) {
        let impactDmg = player.damage * 1.6;
        if (e.isBoss || e.isBossSubTarget) {
          impactDmg *= 1.25;
          if (e.isVulnerable) impactDmg *= 1.25;
        }
        e.hp -= impactDmg;
        e.hitFlash = 4;
        addDamageText(e.x, e.y, Math.round(impactDmg), true, '#f1c40f');
        createHitParticles(e.x, e.y, '#f1c40f', 3);
      }
    }

    if (player.ignisDashDuration <= 0) {
      triggerShake(11);
      playSfx('boss');
      triggerHaptic('heavy');
      createHitParticles(player.x, player.y, '#ffffff', 18);
      createHitParticles(player.x, player.y, '#f1c40f', 24);
      createHitParticles(player.x, player.y, '#e74c3c', 18);

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const edx = e.x - player.x;
        const edy = e.y - player.y;
        const dist = Math.hypot(edx, edy);
        if (dist < 85) {
          const nx = dist > 0.001 ? edx / dist : 1;
          const ny = dist > 0.001 ? edy / dist : 0;
          e.x += nx * 24;
          e.y += ny * 24;
          e.hitFlash = 5;
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

  // Knockback e Amortecimento
  player.x += (player.pushVx || 0) * dt;
  player.y += (player.pushVy || 0) * dt;
  const friction = Math.pow(0.80, dt);
  player.pushVx = (player.pushVx || 0) * friction;
  player.pushVy = (player.pushVy || 0) * friction;
  if (Math.abs(player.pushVx) < 0.05) player.pushVx = 0;
  if (Math.abs(player.pushVy) < 0.05) player.pushVy = 0;

  // Barreira Física de Contenção Dimensional (Impede fuga do Altar do Fim dos Tempos)
  if (activeBoss && (activeBoss.bossId === 4 || activeBoss.arenaCenterX !== undefined)) {
    const acx = activeBoss.arenaCenterX;
    const acy = activeBoss.arenaCenterY;
    const ar = activeBoss.arenaRadius || 620;
    const maxR = ar - (player.radius || 14) - 2;
    const pdx = player.x - acx;
    const pdy = player.y - acy;
    const pDist = Math.hypot(pdx, pdy) || 1;

    if (pDist > maxR) {
      player.x = acx + (pdx / pDist) * maxR;
      player.y = acy + (pdy / pDist) * maxR;

      const nx = pdx / pDist;
      const ny = pdy / pDist;

      const pushDot = (player.pushVx || 0) * nx + (player.pushVy || 0) * ny;
      if (pushDot > 0) {
        player.pushVx -= pushDot * nx;
        player.pushVy -= pushDot * ny;
      }
      const dashDot = (player.dashVx || 0) * nx + (player.dashVy || 0) * ny;
      if (dashDot > 0) {
        player.dashVx -= dashDot * nx;
        player.dashVy -= dashDot * ny;
      }
      const ignisDot = (player.ignisDashVx || 0) * nx + (player.ignisDashVy || 0) * ny;
      if (ignisDot > 0) {
        player.ignisDashVx -= ignisDot * nx;
        player.ignisDashVy -= ignisDot * ny;
      }

      activeBoss.barrierContact = 1.0;
      activeBoss.barrierContactAngle = Math.atan2(pdy, pdx);

      if (Math.floor(frameCount) % 4 === 0) {
        createHitParticles(player.x + nx * 6, player.y + ny * 6, activeBoss.phase === 3 ? '#00cec9' : '#e84393', 3);
        createHitParticles(player.x + nx * 6, player.y + ny * 6, '#ffffff', 2);
      }

      if (!activeBoss.lastBarrierSound || frameCount - activeBoss.lastBarrierSound > 22) {
        activeBoss.lastBarrierSound = frameCount;
        playSfx('forcefield');
        triggerHaptic('light');
      }
    }
  }

  // =========================================================================
  // CÂMERA CINEMATOGRÁFICA DINÂMICA (PANNING PARA O CHEFE E RETORNO AO JOGADOR)
  // =========================================================================
  const isBossSpawning = !!(activeBoss && activeBoss.actionState === 'SPAWN_INTRO');
  cinematicCamera.isCinematic = isBossSpawning;

  let focusX = player.x;
  let focusY = player.y;

  if (isBossSpawning) {
    focusX = activeBoss.x;
    focusY = activeBoss.y;
    cinematicCamera.returningToPlayer = true;
    // Protege o jogador durante a introdução cinematográfica do chefe
    player.iFrames = Math.max(player.iFrames, 12);
  }

  const targetCamX = focusX - cameraViewW / 2;
  const targetCamY = focusY - cameraViewH / 2;

  if (isBossSpawning) {
    // Deslize cinematográfico suave e imponente até o chefe
    const panFactor = 1 - Math.pow(1 - 0.045, dt);
    camera.x += (targetCamX - camera.x) * panFactor;
    camera.y += (targetCamY - camera.y) * panFactor;
  } else if (cinematicCamera.returningToPlayer) {
    // Retorno suave da câmera para o jogador após o fim da introdução
    const distToPlayer = Math.hypot(targetCamX - camera.x, targetCamY - camera.y);
    player.iFrames = Math.max(player.iFrames, 6);
    if (distToPlayer < 2.0) {
      cinematicCamera.returningToPlayer = false;
      camera.x = targetCamX;
      camera.y = targetCamY;
    } else {
      const returnFactor = 1 - Math.pow(1 - 0.08, dt);
      camera.x += (targetCamX - camera.x) * returnFactor;
      camera.y += (targetCamY - camera.y) * returnFactor;
    }
  } else {
    // Resposta 1:1 firme e responsiva durante o combate normal
    camera.x = targetCamX;
    camera.y = targetCamY;
  }

  // Transição suave das barras de cinema (Letterbox)
  const targetLetterbox = isBossSpawning ? 1.0 : 0.0;
  cinematicCamera.letterboxProgress += (targetLetterbox - cinematicCamera.letterboxProgress) * (1 - Math.pow(1 - 0.08, dt));

  player.weapons.forEach(w => { w.timer += dt; });
  rebuildSpatialGrid(enemies);
  fireWeapons();
  updateSpinningAxes(dt);

  // Aura Sagrada (Vinculada ao Spatial Grid)
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

  // Bíblias Protetoras (Vinculadas ao Spatial Grid)
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

          // Knockback Sagrado Suave: 80% menos empurrão (micro-stagger que interrompe o avanço sem catapultar monstros); Chefe Final imune (0.00)
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

  checkBossSchedule(seconds);
  checkMiniBossSchedule(seconds);

  if (!gameState.isWavePaused) {
    spawnTimer += dt;
    if (spawnTimer >= currentWave.rate) {
      if (currentWave.allowedSquads && currentWave.allowedSquads.length > 0) {
        const squadKey = currentWave.allowedSquads[Math.floor(Math.random() * currentWave.allowedSquads.length)];
        spawnSquad(squadKey, currentWave.eliteChance);
      } else if (currentWave.types && currentWave.types.length > 0) {
        const chosenType = currentWave.types[Math.floor(Math.random() * currentWave.types.length)];
        const count = currentWave.clusterSize 
          ? Math.floor(Math.random() * (currentWave.clusterSize[1] - currentWave.clusterSize[0] + 1)) + currentWave.clusterSize[0]
          : 5;
        spawnMobCluster(chosenType, count, currentWave.eliteChance);
      }
      if (Math.random() < 0.26) spawnProp();
      spawnTimer = 0;
    }
  }

  resolveWorldPhysics(player, enemies, dt);
  updateProjectiles(dt);
  updateAcidPuddles(dt);

  // Mecânicas do Miasma da Valéria: Dissolução de Tiros, Super Slow (70%), Acid Shred e Vapor Móvel
  for (let pIdx = 0; pIdx < acidPuddles.length; pIdx++) {
    const p = acidPuddles[pIdx];
    if (!p.isAlchemist) continue;

    // 1. Dissolução de projéteis inimigos comuns que entrarem no vapor
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

    // 2. Super slow de 70%, quebra de dashes e stacks de corrosão em inimigos (Via Spatial Grid)
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

    // 3. Concessão e renovação do buff portátil de Vapor Estimulante ao cruzar o miasma
    const pdx = player.x - p.x;
    const pdy = player.y - p.y;
    if (pdx * pdx + pdy * pdy < (p.radius + player.radius) ** 2) {
      player.alchemistBuffTimer = 180;
    }
  }

  // Ondas de Choque dos Chefes
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
        lastAttackerName = activeBoss ? activeBoss.name : "Onda de Choque Sísmica";
        triggerShake(9);
        playSfx('hit');
        const swColor = sw.color || (activeBoss && activeBoss.bossId === 3 ? '#00cec9' : '#e67e22');
        addDamageText(player.x, player.y, `-${finalSwDamage}`, false, swColor);
        createHitParticles(player.x, player.y, swColor, 5);

        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return;
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

  // Telegrafias dos Chefes e Pavios
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
          lastAttackerName = "Teleporte Carmesim";
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
          lastAttackerName = "Erupção de Sangue";
          triggerShake(8);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#ff1744');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return;
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
          lastAttackerName = "Fratura Dimensional";
          triggerShake(14);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#00cec9');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return;
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
          lastAttackerName = "Meteoro do Vazio";
          triggerShake(12);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#e84393');

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
          lastAttackerName = (tel.boss && tel.boss.bossId === 1) ? "Garras Vampíricas" : "Corte de Foice Espectral";
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
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          player.hp -= tel.damage;
          player.bossIFrames = 22;
          lastAttackerName = "Monólito Basáltico";
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
        if (tel.nodeIndex === 1 || tel.nodeIndex === 4 || tel.nodeIndex === 7 || tel.nodeIndex === 10 || tel.nodeIndex === 13) playSfx('hit');
        createHitParticles(tel.x, tel.y, '#d35400', 8);
        createHitParticles(tel.x, tel.y, '#f39c12', 5);

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          player.hp -= tel.damage;
          player.bossIFrames = 20;
          lastAttackerName = "Fissura Tectônica";
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
          lastAttackerName = "Bombardeio Abissal";
          triggerShake(12);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#00cec9');

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
      if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
        player.hp -= tel.damage;
        player.bossIFrames = 22;
        lastAttackerName = activeBoss ? activeBoss.name : "Cataclismo de Chefe";
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

  // Projéteis dos Chefes
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
      lastAttackerName = bp.type === 'SOUL_SCYTHE' ? "Foice Giratória Espiritual" : "Projétil Abissal";
      triggerShake(8);
      playSfx('hit');
      const projHitColor = bp.color || '#e74c3c';
      addDamageText(player.x, player.y, `-${bp.damage}`, false, projHitColor);
      createHitParticles(player.x, player.y, projHitColor, 6);

      if (player.hp <= 0) {
        player.hp = 0;
        triggerDeath();
        return;
      }
    }

    if (bp.life <= 0) bossProjectiles.splice(i, 1);
  }

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
            activeBoss = null;
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
            lastAttackerName = "Ritual Gravitacional";
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

      if (!e.isBoss && !e.isMiniBoss && !e.isBossSubTarget && !e.explodedNaturally) {
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
            lastAttackerName = "Explosão Necrótica";
            addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#e67e22');
            if (player.hp <= 0) {
              player.hp = 0;
              triggerDeath();
              return;
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
            lastAttackerName = "Estilhaço Suicida";
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
            freezeTimer = 16;
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
            bossGhostHp = 0;
            bossGhostHpTimer = 0;
            _lastBossGhostHp = 0;
            const bossHpVal = document.getElementById('boss-hp-val');
            if (bossHpVal) bossHpVal.innerText = 'EXPURGADO';
          }
          return;
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
        bossGhostHp = 0;
        bossGhostHpTimer = 0;
        _lastBossGhostHp = 0;
        const bossHpVal = document.getElementById('boss-hp-val');
        if (bossHpVal) bossHpVal.innerText = '0%';

        spawnChest(e.x, e.y, 'BOSS');
        activeBoss = null;
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

      playSfx('kill');
      enemies.splice(i, 1);
    }
  }

  processEnemyMeleeAttacks(player, enemies, dt);

  // Regeneração contínua de Vida (Meta-Talento: Bênção Vital)
  if (player.hpRegen > 0 && player.hp > 0 && player.hp < player.maxHp) {
    player.hp = Math.min(player.maxHp, player.hp + player.hpRegen * (dt / 60));
  }

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
      if (!lastAttackerName) lastAttackerName = "Horda Devoradora";
      player.hp = 0;
      triggerDeath();
      return;
    }
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

    // Atualização de física 2.5D (arco vertical e quiques no solo)
    if (!ch.isResting) {
      ch.z = (ch.z || 0) + (ch.vz || 0) * dt;
      ch.vz = (ch.vz || 0) + (ch.gravity || 0.32) * dt;

      // Colisão com o solo (z >= 0)
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
      // Brilhos e faíscas periódicas sutis quando assentado no solo
      ch.sparkleTimer = (ch.sparkleTimer || 0) + dt;
      if (ch.sparkleTimer > 35) {
        ch.sparkleTimer = 0;
        createHitParticles(ch.x + (Math.random() - 0.5) * 16, ch.y + (Math.random() - 0.5) * 12, ch.tier === 'MINI_BOSS' ? '#3498db' : '#f1c40f', 1);
      }
    }

    // Coleta pelo jogador (apenas se estiver em repouso ou bem rente ao chão)
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

  updateCombatVisuals(dt);

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

  // Atualização Visual do HUD de HP com Decaimento da Barra Fantasma (Ghost Bar)
  if (player.hp < ghostHp) {
    ghostHpTimer += dt;
    if (ghostHpTimer > 20) {
      ghostHp = Math.max(player.hp, ghostHp - 1.8 * dt);
    }
  } else {
    ghostHp = player.hp;
    ghostHpTimer = 0;
  }

  ensureHudElementsCached();

  // Dirty Checking do HUD de Vida
  const currentHp = Math.max(0, Math.ceil(player.hp));
  if (currentHp !== _lastHp) {
    _lastHp = currentHp;
    if (hudDom.hpVal) hudDom.hpVal.innerText = currentHp;
  }

  if (player.maxHp !== _lastMaxHp) {
    _lastMaxHp = player.maxHp;
    if (hudDom.hpMaxVal) hudDom.hpMaxVal.innerText = player.maxHp;
  }

  const hpPct = Math.max(0, Math.min(100, Math.round((currentHp / player.maxHp) * 100)));
  if (hpPct !== _lastHpPct) {
    _lastHpPct = hpPct;
    if (hudDom.hpPctVal) hudDom.hpPctVal.innerText = `${hpPct}%`;
    if (hudDom.hpFill) hudDom.hpFill.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
    if (hudDom.hpContainer) {
      if (hpPct <= 30 && player.hp > 0) {
        hudDom.hpContainer.classList.add('critical');
      } else {
        hudDom.hpContainer.classList.remove('critical');
      }
    }
  }

  const roundedGhostHp = Math.round(ghostHp);
  if (roundedGhostHp !== _lastGhostHp) {
    _lastGhostHp = roundedGhostHp;
    if (hudDom.hpGhostFill) hudDom.hpGhostFill.style.width = `${Math.max(0, (ghostHp / player.maxHp) * 100)}%`;
  }

  // Dirty Checking de Nível, Kills e Progressão de XP
  if (player.level !== _lastLvl) {
    _lastLvl = player.level;
    if (hudDom.lvlVal) hudDom.lvlVal.innerText = player.level;
  }

  if (gameState.kills !== _lastKills) {
    _lastKills = gameState.kills;
    if (hudDom.killsVal) hudDom.killsVal.innerText = gameState.kills;
  }

  const curXp = Math.floor(player.xp);
  if (curXp !== _lastXp) {
    _lastXp = curXp;
    if (hudDom.xpVal) hudDom.xpVal.innerText = curXp;
  }

  if (player.nextXp !== _lastNextXp) {
    _lastNextXp = player.nextXp;
    if (hudDom.xpNextVal) hudDom.xpNextVal.innerText = player.nextXp;
  }

  const xpPct = Math.min(100, Math.round((player.xp / player.nextXp) * 100));
  if (xpPct !== _lastXpPct) {
    _lastXpPct = xpPct;
    if (hudDom.xpPctVal) hudDom.xpPctVal.innerText = `${xpPct}%`;
    if (hudDom.xpFill) hudDom.xpFill.style.width = `${Math.min(100, (player.xp / player.nextXp) * 100)}%`;
  }

  const currentPersistentGold = getPersistentGold();
  if (currentPersistentGold !== _lastGold) {
    _lastGold = currentPersistentGold;
    if (hudDom.goldVal) hudDom.goldVal.innerText = currentPersistentGold;
  }
  
  let targetWaveBannerText = '';
  if (gameState.isWavePaused && !activeBoss) {
    targetWaveBannerText = "ABRA O BAÚ PARA CONTINUAR!";
  } else if (activeBoss) {
    const arenaName = ARENA_PALETTES[currentArenaTheme]?.name || '';
    targetWaveBannerText = `${activeBoss.name} • ${arenaName}`;
  } else {
    const arenaName = ARENA_PALETTES[currentArenaTheme]?.name;
    targetWaveBannerText = arenaName ? `${currentWave.name} • ${arenaName}` : currentWave.name;
  }

  if (targetWaveBannerText !== _lastWaveBannerText) {
    _lastWaveBannerText = targetWaveBannerText;
    if (hudDom.waveBanner) hudDom.waveBanner.innerText = targetWaveBannerText;
  }

  updateSkillUI();

  if (activeBoss) {
    const bossHpPct = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
    const roundedBossHpPct = Math.ceil(bossHpPct);

    // Inicializa ghostHp se desatualizado ou inicial
    if (bossGhostHp <= 0 || bossGhostHp > activeBoss.maxHp) {
      bossGhostHp = activeBoss.hp;
    }

    if (activeBoss.hp < bossGhostHp) {
      bossGhostHpTimer += dt;
      if (bossGhostHpTimer > 18) {
        bossGhostHp = Math.max(activeBoss.hp, bossGhostHp - (activeBoss.maxHp * 0.015) * dt);
      }
    } else {
      bossGhostHp = activeBoss.hp;
      bossGhostHpTimer = 0;
    }

    const bossGhostHpPct = Math.max(0, (bossGhostHp / activeBoss.maxHp) * 100);

    if (bossHpPct !== _lastBossHpPct || activeBoss.isEnraged !== _lastBossEnraged) {
      _lastBossHpPct = bossHpPct;
      _lastBossEnraged = activeBoss.isEnraged;

      if (hudDom.bossHpFill) {
        hudDom.bossHpFill.style.width = `${bossHpPct}%`;
        if (activeBoss.isEnraged) {
          hudDom.bossHpFill.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
          hudDom.bossHpFill.style.boxShadow = '0 0 12px rgba(231, 76, 60, 0.85)';
        } else {
          hudDom.bossHpFill.style.background = '';
          hudDom.bossHpFill.style.boxShadow = '';
        }
      }
      if (hudDom.bossHud) {
        if (activeBoss.isEnraged) {
          hudDom.bossHud.classList.add('enraged');
        } else {
          hudDom.bossHud.classList.remove('enraged');
        }
      }
      if (hudDom.bossHpVal) hudDom.bossHpVal.innerText = `${roundedBossHpPct}%`;
    }

    const roundedBossGhost = Math.round(bossGhostHpPct);
    if (roundedBossGhost !== _lastBossGhostHp) {
      _lastBossGhostHp = roundedBossGhost;
      if (hudDom.bossHpGhostFill) {
        hudDom.bossHpGhostFill.style.width = `${bossGhostHpPct}%`;
      }
    }
  }

  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  const currentTimerStr = `${m}:${s}`;
  if (currentTimerStr !== _lastTimerStr) {
    _lastTimerStr = currentTimerStr;
    if (hudDom.timerVal) hudDom.timerVal.innerText = currentTimerStr;
  }
}

function loop(now) {
  if (!now) now = performance.now();
  const rawDt = (now - lastTime) / (1000 / 60);
  lastTime = now;
  const speed = (typeof devCheats !== 'undefined' && devCheats.gameSpeed) ? devCheats.gameSpeed : 1.0;
  const dt = Math.min(Math.max(rawDt, 0.1), 2.5) * speed;

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