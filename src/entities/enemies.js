import { ENEMY_TYPES, BOSS_TYPES } from '../config/enemies.js';
import { player } from './player.js';
import { playSfx, triggerHaptic } from '../core/audio.js';
import { 
  enemies, 
  enemyBullets, 
  acidPuddles, 
  bossTelegraphs, 
  bossProjectiles, 
  gems, 
  props, 
  viewW, 
  viewH, 
  frameCount, 
  gameState, 
  triggerShake, 
  createHitParticles, 
  setActiveBoss, 
  setCurrentArenaTheme, 
  setIsWavePaused 
} from '../main.js';

// Spawns de Criaturas Normais
export function spawnMobCluster(typeKey, count, eliteChance = 0) {
  const angle = Math.random() * Math.PI * 2;
  const spawnDistance = Math.max(viewW, viewH) * 0.65 + 70;
  const cx = player.x + Math.cos(angle) * spawnDistance;
  const cy = player.y + Math.sin(angle) * spawnDistance;
  const t = ENEMY_TYPES[typeKey];
  const seconds = Math.floor(frameCount / 60);
  const scaling = 1 + (seconds / 70);

  for (let i = 0; i < count; i++) {
    const isElite = Math.random() < eliteChance;
    const eliteMods = ['FROST', 'HASTE', 'TOXIC'];
    const mod = isElite ? eliteMods[Math.floor(Math.random() * eliteMods.length)] : null;
    const hpMult = isElite ? 2.6 : 1.0;
    const radMult = isElite ? 1.35 : 1.0;

    const offsetX = (Math.random() - 0.5) * 90;
    const offsetY = (Math.random() - 0.5) * 90;

    enemies.push({
      x: cx + offsetX,
      y: cy + offsetY,
      baseType: typeKey,
      radius: t.radius * radMult,
      speed: t.speed * (mod === 'HASTE' ? 1.5 : (0.92 + Math.random() * 0.16)),
      hp: t.hp * scaling * hpMult,
      maxHp: t.hp * scaling * hpMult,
      color: t.color,
      damage: t.damage * (isElite ? 1.4 : 1),
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

// Invocação de Chefe, Expurgo de Mobs e Troca de Arena
export function triggerBossEncounter(bossIndex) {
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
  const dist = Math.random() * 450 + 260;
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