/**
 * src/main.js
 * Loop Principal, Pipeline de Física/Combate e Sincronização Grim Cyber-Gothic.
 * Orquestrador central que coordena a simulação a 60 FPS delegando para subsistemas especializados:
 * - enemyLifecycle.js: IA dos 31 monstros, DoTs e mortes
 * - bossHazards.js: Ondas de choque, telegrafias e projéteis de chefes
 * - fieldEffects.js: Aura Sagrada, Bíblias orbitais e Miasma cáustico
 * - pickups.js: Gemas, baús 2.5D, compressão e quebra de props
 * - hudController.js: Dirty checking do HUD, Ghost Bar e timers
 */

import { 
  player, 
  resetPlayer, 
  updateSkillUI, 
  initSkillUI, 
  fireWeapons, 
  updateSpinningAxes, 
  selectedHeroKey 
} from './entities/player.js';
import { inputX, inputY } from './core/input.js';
import { rebuildSpatialGrid } from './core/spatialGrid.js';
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
import { groundCraters } from './render/groundCracks.js';
import { spawnSquad, spawnMobCluster, spawnProp } from './entities/enemies.js';
import { recordRunStats } from './config/achievements.js';
import { 
  getCurrentWave, 
  getEffectiveHordeSeconds,
  checkBossSchedule, 
  resetBossSchedule,
  resetBossesDefeated, 
  checkMiniBossSchedule, 
  resetMiniBossSchedule 
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
import { transitionToArenaTheme, getWaveArenaTheme, resetEnvironment } from './render/environment.js';
import { playSfx, triggerHaptic, resetDeathAudioFilter } from './core/audio.js';
import { initResponsive, layoutMetrics } from './core/responsive.js';
import { devCheats } from './systems/devtools.js';
import { clearActiveBarks } from './systems/barks.js';

// Subsistemas Especializados Extraídos
import { updateFieldEffects } from './systems/fieldEffects.js';
import { updateBossHazards } from './systems/bossHazards.js';
import { updateEnemies } from './systems/enemyLifecycle.js';
import { 
  updatePickups, 
  spawnChest as spawnChestPickup, 
  getGemConfig, 
  compressGems, 
  purgeAllNormalEnemies as purgeAllNormalEnemiesPickup, 
  triggerSuperMagnet as triggerSuperMagnetPickup 
} from './systems/pickups.js';
import { updateHUD, resetHUD, resetBossGhostHp } from './ui/hudController.js';

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

export function setMainCtx(newCtx) {
  ctx = newCtx;
}

export let dpr = 1;
export let viewW = window.innerWidth;
export let viewH = window.innerHeight;

export function calculateCameraZoom(w, h) {
  const minDim = Math.min(w, h);
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

// Controle Diegético: Rastreamento Completo da Causa Mortis
export let lastAttackerName = '';
export let deathContext = {
  name: 'A Horda do Abismo',
  category: 'HORDE', // 'BOSS' | 'MINIBOSS' | 'ELITE' | 'HORDE' | 'HAZARD' | 'PROJECTILE' | 'ENVIRONMENT'
  attackName: 'Golpe Devorador',
  damage: 0,
  enemyType: null,
  color: '#e74c3c',
  tacticTip: ''
};

export function setLastAttackerInfo(info = {}) {
  if (typeof info === 'string') {
    info = { name: info };
  }
  const name = info.name || lastAttackerName || 'A Horda do Abismo';
  lastAttackerName = name;

  let category = info.category;
  if (!category) {
    if (info.isBoss || (typeof activeBoss !== 'undefined' && activeBoss && (name.includes(activeBoss.name) || name.includes('Chefe') || name.includes('Vampírico') || name.includes('Monólito') || name.includes('Soberano') || name.includes('Thanatos') || name.includes('Meteoro') || name.includes('Foice') || name.includes('Erupção') || name.includes('Tectônica')))) {
      category = 'BOSS';
    } else if (info.isMiniBoss) {
      category = 'MINIBOSS';
    } else if (info.isElite) {
      category = 'ELITE';
    } else if (name.includes('Vórtice') || name.includes('Ácido') || name.includes('Miasma') || name.includes('Poça') || name.includes('Explosão') || name.includes('Estilhaço') || name.includes('Chamas')) {
      category = 'HAZARD';
    } else if (name.includes('Projétil') || name.includes('Orbe') || name.includes('Tiro') || name.includes('Corrente')) {
      category = 'PROJECTILE';
    } else {
      category = 'HORDE';
    }
  }

  deathContext = {
    name,
    category,
    attackName: info.attackName || (category === 'BOSS' ? 'Mecânica de Chefe' : (category === 'HAZARD' ? 'Perigo Ambiental' : (category === 'PROJECTILE' ? 'Projétil Mortal' : 'Golpe Melee'))),
    damage: Math.round(info.damage || 0),
    enemyType: info.enemyType || null,
    color: info.color || (category === 'BOSS' ? '#8e44ad' : (category === 'MINIBOSS' ? '#e67e22' : (category === 'HAZARD' ? '#e74c3c' : (category === 'PROJECTILE' ? '#9b59b6' : '#c0392b')))),
    tacticTip: info.tacticTip || ''
  };
}

export function setLastAttackerName(name, options = {}) {
  const merged = (typeof name === 'object' && name !== null) ? { ...name, ...options } : { name, ...options };
  setLastAttackerInfo(merged);
}

// Banner Cinematográfico de Transição de Ondas
export const waveAnnouncement = {
  name: '',
  index: 0,
  timer: 0,
  maxTimer: 180
};
export let lastAnnouncedWaveIndex = 0;

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
  spawnChestPickup(chests, x, y, tier);
}

export let bossTelegraphs = [];
export let bossProjectiles = [];
export let bossShockwaves = [];
export let voidVortices = [];
export let activeBoss = null;

export function setActiveBoss(boss) { activeBoss = boss; }

export { getGemConfig };

export function purgeAllNormalEnemies() {
  return purgeAllNormalEnemiesPickup(enemies, gems);
}

export function triggerSuperMagnet() {
  return triggerSuperMagnetPickup(gems);
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
  groundCraters.length = 0;
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
  clearActiveBarks();

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

  lastAttackerName = '';
  deathContext = {
    name: 'A Horda do Abismo',
    category: 'HORDE',
    attackName: 'Golpe Devorador',
    damage: 0,
    enemyType: null,
    color: '#e74c3c',
    tacticTip: ''
  };

  const canvasElem = document.getElementById('game-canvas');
  if (canvasElem) canvasElem.classList.remove('canvas-death-frozen');

  waveAnnouncement.timer = 0;
  waveAnnouncement.index = 0;
  waveAnnouncement.name = '';
  lastAnnouncedWaveIndex = 0;

  resetHUD(player.maxHp);
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

  resetBossGhostHp();
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
    recordRunStats({ wave: currentWave.index });
  }
  if (waveAnnouncement.timer > 0) {
    waveAnnouncement.timer -= dt;
  }

  // Transição suave de arena a cada 3 ondas
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
  if (player.slowTimer > 0) {
    player.slowTimer -= dt;
    isSlowed = true;
  }
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
        setLastAttackerInfo({
          name: "Vórtice do Vazio",
          category: "HAZARD",
          attackName: "Colapso Gravitacional",
          damage: v.damage,
          color: '#9b59b6',
          tacticTip: "Evite o epicentro da distorção espacial para não sofrer drenagem acelerada de vida."
        });
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

  // Knockback e Amortecimento do Jogador
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

  // Câmera Cinematográfica Dinâmica e Letterbox
  const isBossSpawning = !!(activeBoss && activeBoss.actionState === 'SPAWN_INTRO');
  cinematicCamera.isCinematic = isBossSpawning;

  let focusX = player.x;
  let focusY = player.y;

  if (isBossSpawning) {
    focusX = activeBoss.x;
    focusY = activeBoss.y;
    cinematicCamera.returningToPlayer = true;
    player.iFrames = Math.max(player.iFrames, 12);
  }

  const targetCamX = focusX - cameraViewW / 2;
  const targetCamY = focusY - cameraViewH / 2;

  if (isBossSpawning) {
    const panFactor = 1 - Math.pow(1 - 0.045, dt);
    camera.x += (targetCamX - camera.x) * panFactor;
    camera.y += (targetCamY - camera.y) * panFactor;
  } else if (cinematicCamera.returningToPlayer) {
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
    camera.x = targetCamX;
    camera.y = targetCamY;
  }

  const targetLetterbox = isBossSpawning ? 1.0 : 0.0;
  cinematicCamera.letterboxProgress += (targetLetterbox - cinematicCamera.letterboxProgress) * (1 - Math.pow(1 - 0.08, dt));

  player.weapons.forEach(w => { w.timer += dt; });
  rebuildSpatialGrid(enemies);
  fireWeapons();
  updateSpinningAxes(dt);

  // 1. Efeitos de Campo (Aura Sagrada, Bíblias Orbitais e Miasma)
  updateFieldEffects(dt, {
    player,
    enemies,
    enemyBullets,
    acidPuddles,
    frameCount,
    selectedHeroKey,
    triggerShake
  });

  checkBossSchedule(seconds);
  checkMiniBossSchedule(seconds);

  // 2. Spawner de Hordas, Esquadrões e Props
  if (!gameState.isWavePaused) {
    spawnTimer += dt;
    if (spawnTimer >= currentWave.rate) {
      const hasSquads = currentWave.allowedSquads && currentWave.allowedSquads.length > 0;
      const hasTypes = currentWave.types && currentWave.types.length > 0;
      const spawnSquadChosen = hasSquads && (!hasTypes || Math.random() < 0.65);

      if (spawnSquadChosen) {
        const squadKey = currentWave.allowedSquads[Math.floor(Math.random() * currentWave.allowedSquads.length)];
        spawnSquad(squadKey, currentWave.eliteChance);
      } else if (hasTypes) {
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

  // 3. Perigos de Arena e Chefes
  const bossResult = updateBossHazards(dt, {
    player,
    bossShockwaves,
    bossTelegraphs,
    bossProjectiles,
    enemyBullets,
    activeBoss,
    selectedHeroKey,
    triggerShake,
    setLastAttackerName
  });
  if (bossResult && bossResult.playerDied) return;

  // 4. Ciclo de Vida e IA dos Monstros
  const enemyResult = updateEnemies(dt, {
    player,
    enemies,
    frameCount,
    freezeTimer,
    setFreezeTimer: t => { freezeTimer = t; },
    enemyBullets,
    bossTelegraphs,
    bossProjectiles,
    bossShockwaves,
    voidVortices,
    acidPuddles,
    gems,
    chests,
    gameState,
    activeBoss,
    setActiveBoss: b => { activeBoss = b; },
    triggerShake,
    triggerHaptic,
    setLastAttackerName,
    resetBossGhostHp,
    setIsWavePaused
  });
  if (enemyResult && enemyResult.playerDied) return;

  // 5. Coletáveis, Baús e Drops
  const pickupsResult = updatePickups(dt, {
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
    setFreezeTimer: t => { freezeTimer = t; },
    setIsWavePaused,
    resetSpawnTimer,
    setLastAttackerName
  });
  if (pickupsResult && pickupsResult.playerDied) return;

  updateCombatVisuals(dt);

  // 6. Atualização do HUD e Decaimento Fantasma
  updateHUD(dt, {
    gameState,
    activeBoss,
    currentArenaTheme,
    seconds,
    currentWave
  });
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