import { ENEMY_TYPES, BOSS_TYPES, MINI_BOSS_TYPES } from '../config/enemies.js';
import { player } from './player.js';
import { playSfx, triggerHaptic } from '../core/audio.js';
import { firstBossKilled } from '../systems/waves.js';
import { 
  enemies, 
  enemyBullets, 
  acidPuddles, 
  bossTelegraphs, 
  bossProjectiles, 
  gems, 
  props, 
  frameCount, 
  gameState, 
  triggerShake, 
  createHitParticles, 
  activeBoss,
  setActiveBoss, 
  setCurrentArenaTheme, 
  setIsWavePaused,
  viewW,
  viewH
} from '../main.js';

// Constantes canônicas do motor
export const MAX_ACTIVE_ENEMIES = 110;

// Cálculo Dinâmico de Spawn Seguro além das bordas visíveis
export function getSafeSpawnDistance(padding = 90) {
  const halfW = viewW / 2;
  const halfH = viewH / 2;
  return Math.hypot(halfW, halfH) + padding;
}

// Compressão de massa invisível: absorve atributos do spawn excedente em monstros fora da tela
function stackOffscreenMob(typeKey, count) {
  const t = ENEMY_TYPES[typeKey];
  if (!t) return;
  let bestEnemy = null;
  let maxDistSq = 0;
  const threshold = getSafeSpawnDistance(20);
  const thresholdSq = threshold * threshold;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.isBoss || e.isMiniBoss) continue;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dSq = dx * dx + dy * dy;
    if (dSq > thresholdSq && dSq > maxDistSq) {
      maxDistSq = dSq;
      bestEnemy = e;
    }
  }

  if (bestEnemy) {
    const seconds = Math.floor(frameCount / 60);
    const scaling = 1 + Math.pow(seconds / 60, 1.35) * 0.45;
    const addHp = t.hp * scaling * count * 0.85;
    bestEnemy.hp += addHp;
    bestEnemy.maxHp += addHp;
    bestEnemy.xp += t.xp * count;
    bestEnemy.damage = Math.min(bestEnemy.damage * 1.25, bestEnemy.damage + Math.round(count * 1.5));
    bestEnemy.radius = Math.min(bestEnemy.radius * 1.15, t.radius * 1.4);
  }
}

// Spawns de Criaturas Normais com Hard Cap e Distância Dinâmica Segura
export function spawnMobCluster(typeKey, count, eliteChance = 0) {
  if (gameState.isWavePaused) return;

  if (enemies.length >= MAX_ACTIVE_ENEMIES) {
    stackOffscreenMob(typeKey, count);
    return;
  }

  let toSpawn = count;
  if (enemies.length + toSpawn > MAX_ACTIVE_ENEMIES) {
    const overflow = (enemies.length + toSpawn) - MAX_ACTIVE_ENEMIES;
    stackOffscreenMob(typeKey, overflow);
    toSpawn -= overflow;
  }
  if (toSpawn <= 0) return;

  const angle = Math.random() * Math.PI * 2;
  const spawnDistance = getSafeSpawnDistance(90) + Math.random() * 50;
  const cx = player.x + Math.cos(angle) * spawnDistance;
  const cy = player.y + Math.sin(angle) * spawnDistance;
  const t = ENEMY_TYPES[typeKey];
  const seconds = Math.floor(frameCount / 60);
  const scaling = 1 + Math.pow(seconds / 60, 1.35) * 0.45;
  const boss1Mult = firstBossKilled ? 1.25 : 1.0;

  for (let i = 0; i < toSpawn; i++) {
    const isElite = Math.random() < eliteChance;
    const eliteMods = ['FROST', 'HASTE', 'TOXIC'];
    const mod = isElite ? eliteMods[Math.floor(Math.random() * eliteMods.length)] : null;
    const hpMult = isElite ? 2.6 : 1.0;
    const radMult = isElite ? 1.35 : 1.0;

    const offsetX = (Math.random() - 0.5) * 80;
    const offsetY = (Math.random() - 0.5) * 80;

    enemies.push({
      x: cx + offsetX,
      y: cy + offsetY,
      baseType: typeKey,
      radius: t.radius * radMult,
      speed: t.speed * (mod === 'HASTE' ? 1.5 : (0.92 + Math.random() * 0.16)),
      hp: t.hp * scaling * hpMult,
      maxHp: t.hp * scaling * hpMult,
      color: t.color,
      damage: Math.round(t.damage * (isElite ? 1.4 : 1) * boss1Mult),
      behavior: t.behavior,
      xp: t.xp * (isElite ? 4 : 1),
      isElite: isElite,
      eliteMod: mod,
      dashState: 'chase',
      dashTimer: 0,
      dashAngle: 0,
      summonTimer: 0,
      shootTimer: Math.random() * 60,
      stunTimer: 0,
      facing: 1,
      hitFlash: 0,
      orbitalHitCd: 0
    });
  }
}

// Fábrica de Mini Bosses com Raio Dinâmico Fora da Tela
export function spawnMiniBoss(typeKey) {
  if (activeBoss || gameState.isWavePaused) return null;

  const t = MINI_BOSS_TYPES[typeKey];
  if (!t) return null;

  const angle = Math.random() * Math.PI * 2;
  const spawnDistance = getSafeSpawnDistance(90) + 40;
  const seconds = Math.floor(frameCount / 60);
  const scaling = 1 + Math.pow(seconds / 60, 1.35) * 0.38;
  const scaledHp = Math.round(t.hp * scaling);
  const boss1Mult = firstBossKilled ? 1.25 : 1.0;

  const miniBoss = {
    x: player.x + Math.cos(angle) * spawnDistance,
    y: player.y + Math.sin(angle) * spawnDistance,
    name: t.name,
    baseType: typeKey,
    radius: t.radius,
    speed: t.speed,
    hp: scaledHp,
    maxHp: scaledHp,
    color: t.color,
    damage: Math.round(t.damage * boss1Mult),
    behavior: t.behavior,
    xp: t.xp,
    goldReward: t.gold,
    isMiniBoss: true,
    isBoss: false,
    facing: 1,
    hitFlash: 0,
    orbitalHitCd: 0,
    slowTimer: 0,
    slowFactor: 0,
    stunTimer: 0,
    stateTimer: 0,
    telegraphTimer: 0,
    telegraphMax: 0,
    dashTimer: 0,
    dashState: 'chase',
    dashAngle: 0,
    shootTimer: 0,
    slamTimer: 0,
    mortarTimer: 0,
    ritualTimer: 0,
    shieldAngle: 0
  };

  enemies.push(miniBoss);
  triggerShake(7);
  playSfx('boss');
  triggerHaptic('medium');

  return miniBoss;
}

// Invocação de Chefe, Expurgo de Mobs e Troca de Arena
export function triggerBossEncounter(bossIndex) {
  if (activeBoss) return;
  setIsWavePaused(true);

  let totalPurgedXp = 0;
  for (let i = 0; i < enemies.length; i++) {
    totalPurgedXp += enemies[i].xp;
    createHitParticles(enemies[i].x, enemies[i].y, '#ffffff', 2);
  }
  enemies.length = 0;
  enemyBullets.length = 0;
  acidPuddles.length = 0;
  bossTelegraphs.length = 0;
  bossProjectiles.length = 0;

  if (totalPurgedXp > 0) {
    gems.push({ x: player.x + 40, y: player.y, radius: 8, value: totalPurgedXp, isSuper: true });
  }

  triggerShake(24);
  playSfx('evolution');
  triggerHaptic('heavy');

  const themes = ['VAMPIRE', 'MONOLITH', 'REAPER', 'ABYSS'];
  setCurrentArenaTheme(themes[bossIndex - 1]);

  const angle = Math.random() * Math.PI * 2;
  const spawnDistance = 300;
  const bData = BOSS_TYPES[bossIndex];

  const newBoss = {
    x: player.x + Math.cos(angle) * spawnDistance,
    y: player.y + Math.sin(angle) * spawnDistance,
    name: bData.name,
    bossId: bData.bossId,
    radius: bData.radius,
    speed: bData.speed,
    hp: bData.hp,
    maxHp: bData.hp,
    color: bData.color,
    damage: bData.damage,
    xp: bData.xp,
    isBoss: true,
    isEnraged: false,
    isFinalBoss: !!bData.isFinalBoss,
    facing: 1,
    hitFlash: 0,
    orbitalHitCd: 0,
    stateTimer: 0,
    teleportTimer: 0,
    stunTimer: 0,
    phase: 1,
    beamAngle: 0
  };

  setActiveBoss(newBoss);
  enemies.push(newBoss);
  
  const bossHud = document.getElementById('boss-hud');
  document.getElementById('boss-name').innerText = bData.name;
  bossHud.style.display = 'block';
}

export function spawnProp() {
  if (props.length >= 10 || gameState.isWavePaused) return;
  const angle = Math.random() * Math.PI * 2;
  const dist = getSafeSpawnDistance(60) + Math.random() * 200;
  props.push({
    x: player.x + Math.cos(angle) * dist,
    y: player.y + Math.sin(angle) * dist,
    hp: 35,
    maxHp: 35,
    radius: 14,
    type: Math.random() < 0.5 ? 'BRAZIER' : 'CRATE',
    hitFlash: 0
  });
}