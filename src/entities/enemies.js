/**
 * src/entities/enemies.js
 * Fábrica de Inimigos, Mini-Chefes, Chefes e Objetos do Cenário (Fase 1).
 */
import { ENEMY_TYPES, BOSS_TYPES, MINI_BOSS_TYPES } from '../config/enemies.js';
import { getSquadDefinition } from '../config/squads.js';
import { player } from './player.js';
import { 
  enemies, 
  props, 
  viewW, 
  viewH, 
  frameCount, 
  setActiveBoss, 
  triggerShake,
  setCurrentArenaTheme,
  setIsWavePaused,
  enemyBullets,
  bossTelegraphs,
  bossShockwaves,
  voidVortices
} from '../main.js';
import { playSfx, triggerHaptic } from '../core/audio.js';
import { initBoss } from './bosses/bossRegistry.js';
import { transitionToArenaTheme } from '../render/environment.js';

export const MAX_ENEMIES = 150;

/**
 * Retorna uma coordenada fora da tela de visão do jogador.
 * @param {number} minDist Distância mínima adicional além da borda da tela.
 * @param {number} maxDist Distância máxima adicional além da borda da tela.
 * @returns {{ x: number, y: number }}
 */
function getOffscreenSpawnPoint(minDist = 80, maxDist = 180) {
  const halfW = (viewW || 1200) / 2;
  const halfH = (viewH || 800) / 2;
  const screenRadius = Math.hypot(halfW, halfH);
  const dist = screenRadius + minDist + Math.random() * (maxDist - minDist);
  const ang = Math.random() * Math.PI * 2;
  return {
    x: player.x + Math.cos(ang) * dist,
    y: player.y + Math.sin(ang) * dist
  };
}

/**
 * Caso a população atinja o limite máximo (hard cap), funde os atributos
 * em um monstro comum situado fora da visão do jogador.
 * @param {string} typeKey Tipo base do inimigo.
 * @param {number} hpToAdd Quantidade de vida a acumular.
 * @param {number} xpToAdd Quantidade de XP a acumular.
 * @returns {boolean} Verdadeiro se a fusão foi realizada com sucesso.
 */
export function stackOffscreenMob(typeKey, hpToAdd, xpToAdd) {
  const halfW = (viewW || 1200) / 2;
  const halfH = (viewH || 800) / 2;
  const offscreenThresholdSq = (Math.hypot(halfW, halfH) + 160) ** 2;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.isBoss || e.isMiniBoss || e.isBossSubTarget || e.hp <= 0) continue;

    const dx = e.x - player.x;
    const dy = e.y - player.y;
    if ((dx * dx + dy * dy) > offscreenThresholdSq) {
      e.hp += hpToAdd;
      e.maxHp += hpToAdd;
      e.xp += xpToAdd;
      e.stackCount = (e.stackCount || 1) + 1;
      e.damage = Math.round(e.damage * 1.05);
      return true;
    }
  }
  return false;
}

/**
 * Cria a estrutura de dados padronizada para uma entidade inimiga comum.
 * @param {string} typeKey Chave do tipo de inimigo em ENEMY_TYPES.
 * @param {number} x Coordenada X.
 * @param {number} y Coordenada Y.
 * @param {boolean} isElite Indica se o monstro receberá modificadores de Elite.
 * @returns {Object} Instância do inimigo.
 */
export function createEnemy(typeKey, x, y, isElite = false) {
  const def = ENEMY_TYPES[typeKey] || ENEMY_TYPES.ZOMBIE;
  const minutes = frameCount / 3600;
  const scaleFactor = 1.0 + (minutes * 0.28);

  let hp = Math.round(def.hp * scaleFactor);
  let maxHp = hp;
  let damage = def.damage;
  let speed = def.speed;
  let radius = def.radius;
  let xp = def.xp;
  let color = def.color;
  let eliteMod = null;

  if (isElite) {
    hp = Math.round(hp * 2.8);
    maxHp = hp;
    damage = Math.round(damage * 1.35);
    radius = Math.round(radius * 1.25);
    xp = Math.round(xp * 3);
    eliteMod = Math.random() < 0.5 ? 'FROST' : 'TOXIC';
    color = eliteMod === 'FROST' ? '#74b9ff' : '#9b59b6';
  }

  let attackRange = 24;
  let attackWindupFrames = 20;
  let attackStrikeFrames = 4;
  let attackRecoveryFrames = 38;
  let attackCooldownMax = 30;

  if (typeKey === 'BAT') {
    attackRange = 20;
    attackWindupFrames = 16;
    attackStrikeFrames = 4;
    attackRecoveryFrames = 30;
    attackCooldownMax = 20;
  } else if (typeKey === 'GOLEM') {
    attackRange = 34;
    attackWindupFrames = 28;
    attackStrikeFrames = 6;
    attackRecoveryFrames = 48;
    attackCooldownMax = 36;
  } else if (typeKey === 'STALKER') {
    attackRange = 24;
    attackWindupFrames = 18;
    attackStrikeFrames = 4;
    attackRecoveryFrames = 32;
    attackCooldownMax = 25;
  } else {
    attackRange = Math.max(22, Math.round(radius * 1.5));
  }

  return {
    x,
    y,
    baseType: typeKey,
    variant: typeKey === 'ZOMBIE' ? Math.floor(Math.random() * 4) : 0,
    radius,
    speed,
    baseSpeed: speed,
    hp,
    maxHp,
    color,
    damage,
    behavior: def.behavior,
    xp,
    facing: (player.x >= x ? 1 : -1),
    hitFlash: 0,
    orbitalHitCd: 0,
    slowTimer: 0,
    slowFactor: 0,
    stunTimer: 0,
    isElite: !!isElite,
    eliteMod,
    // Máquina de Estados Melee (src/systems/combat.js)
    combatState: 'CHASE',
    attackTimer: 0,
    attackRange,
    attackWindupFrames,
    attackStrikeFrames,
    attackRecoveryFrames,
    attackCooldown: 0,
    attackCooldownMax,
    attackAngle: 0,
    hasHitInStrike: false,
    // Máquina de Pavio para Kamikazes (src/main.js)
    fuseState: 'CHASE',
    fuseTimer: 0,
    fuseTelegraph: null,
    explodedNaturally: false,
    // Timers de comportamentos táticos específicos
    shootTimer: Math.floor(Math.random() * 60),
    dashTimer: 0,
    dashState: 'chase',
    dashAngle: 0,
    summonTimer: 0,
    auraTimer: 0,
    throwTimer: 0,
    hiveTimer: 0,
    blinkTimer: 0,
    vortexTimer: 0,
    cycleTimer: 0,
    cycleState: 0,
    slamTimer: 0,
    mortarTimer: 0,
    ritualTimer: 0
  };
}

/**
 * Gera um grupo concentrado de monstros da mesma espécie.
 * @param {string} typeKey Chave do tipo em ENEMY_TYPES.
 * @param {number} count Quantidade de monstros a gerar.
 * @param {number} eliteChance Probabilidade de spawn de elite [0, 1].
 */
export function spawnMobCluster(typeKey, count, eliteChance = 0) {
  const def = ENEMY_TYPES[typeKey] || ENEMY_TYPES.ZOMBIE;
  const minutes = frameCount / 3600;
  const scaleFactor = 1.0 + (minutes * 0.28);
  const scaledHp = Math.round(def.hp * scaleFactor);
  const pt = getOffscreenSpawnPoint(60, 140);

  for (let i = 0; i < count; i++) {
    if (enemies.length >= MAX_ENEMIES) {
      stackOffscreenMob(typeKey, scaledHp, def.xp);
      continue;
    }

    const isElite = Math.random() < eliteChance;
    const spreadR = Math.random() * 45;
    const spreadA = Math.random() * Math.PI * 2;
    const mx = pt.x + Math.cos(spreadA) * spreadR;
    const my = pt.y + Math.sin(spreadA) * spreadR;

    enemies.push(createEnemy(typeKey, mx, my, isElite));
  }
}

/**
 * Gera um esquadrão tático com formação orientada ao jogador conforme src/config/squads.js.
 * @param {string} squadKey Chave da formação em SQUAD_TYPES.
 * @param {number} eliteChance Probabilidade de spawn de elite [0, 1].
 */
export function spawnSquad(squadKey, eliteChance = 0) {
  const squadDef = getSquadDefinition(squadKey);
  if (!squadDef) {
    spawnMobCluster('ZOMBIE', 6, eliteChance);
    return;
  }

  const center = getOffscreenSpawnPoint(70, 160);
  const angleToPlayer = Math.atan2(player.y - center.y, player.x - center.x);
  const cosA = Math.cos(angleToPlayer);
  const sinA = Math.sin(angleToPlayer);

  for (let i = 0; i < squadDef.members.length; i++) {
    const member = squadDef.members[i];
    const def = ENEMY_TYPES[member.type] || ENEMY_TYPES.ZOMBIE;
    const minutes = frameCount / 3600;
    const scaleFactor = 1.0 + (minutes * 0.28);
    const scaledHp = Math.round(def.hp * scaleFactor);

    if (enemies.length >= MAX_ENEMIES) {
      stackOffscreenMob(member.type, scaledHp, def.xp);
      continue;
    }

    const fwd = member.offsetForward || 0;
    const lat = member.offsetLateral || 0;
    const mx = center.x + cosA * fwd - sinA * lat;
    const my = center.y + sinA * fwd + cosA * lat;

    const canBeElite = member.type !== 'BAT' && member.type !== 'EXPLODER';
    const isElite = canBeElite && (Math.random() < eliteChance);

    enemies.push(createEnemy(member.type, mx, my, isElite));
  }
}

/**
 * Instancia um mini-chefe programado da onda.
 * @param {string} miniBossType Chave do mini-chefe em MINI_BOSS_TYPES.
 * @returns {Object|null}
 */
export function spawnMiniBoss(miniBossType) {
  const def = MINI_BOSS_TYPES[miniBossType];
  if (!def) return null;

  const minutes = frameCount / 3600;
  const scaleFactor = 1.0 + (minutes * 0.28);
  const hp = Math.round(def.hp * scaleFactor);
  const pt = getOffscreenSpawnPoint(100, 200);

  const miniBoss = {
    x: pt.x,
    y: pt.y,
    name: def.name,
    baseType: miniBossType,
    radius: def.radius,
    speed: def.speed,
    baseSpeed: def.speed,
    hp: hp,
    maxHp: hp,
    color: def.color,
    damage: def.damage,
    behavior: def.behavior,
    xp: def.xp,
    goldReward: def.gold,
    isMiniBoss: true,
    isBoss: false,
    facing: player.x >= pt.x ? 1 : -1,
    hitFlash: 0,
    orbitalHitCd: 0,
    slowTimer: 0,
    slowFactor: 0,
    stunTimer: 0,
    combatState: 'CHASE',
    attackTimer: 0,
    attackRange: Math.max(26, Math.round(def.radius * 1.3)),
    attackWindupFrames: 22,
    attackStrikeFrames: 5,
    attackRecoveryFrames: 42,
    attackCooldown: 0,
    attackCooldownMax: 30,
    attackAngle: 0,
    hasHitInStrike: false,
    fuseState: 'CHASE',
    fuseTimer: 0,
    fuseTelegraph: null,
    explodedNaturally: false,
    shootTimer: 0,
    dashTimer: 0,
    dashState: 'chase',
    dashAngle: 0,
    auraTimer: 0,
    throwTimer: 0,
    hiveTimer: 0,
    blinkTimer: 0,
    vortexTimer: 0,
    cycleTimer: 0,
    cycleState: 0,
    hasSlammed: false,
    chargeAngle: null,
    slamTimer: 0,
    mortarTimer: 0,
    ritualTimer: 0
  };

  playSfx('boss');
  triggerShake(8);
  triggerHaptic('medium');

  enemies.push(miniBoss);
  return miniBoss;
}

/**
 * Dispara o encontro contra um chefe de fase.
 * @param {number} bossId Identificador do chefe (1 a 4).
 * @returns {Object|null}
 */
const BOSS_ARENA_THEMES = {
  1: 'VAMPIRE',
  2: 'MONOLITH',
  3: 'REAPER',
  4: 'ABYSS'
};

export function triggerBossEncounter(bossId) {
  const bossDef = BOSS_TYPES[bossId];
  if (!bossDef) return null;

  // 1. Limpa todos os monstros comuns, projéteis e perigos residuais da arena
  enemies.length = 0;
  enemyBullets.length = 0;
  bossTelegraphs.length = 0;
  bossShockwaves.length = 0;
  voidVortices.length = 0;

  // 2. Bloqueia o spawn de qualquer criatura comum
  setIsWavePaused(true);

  // 3. Transiciona o tema da arena para o cenário temático do Boss suavemente
  transitionToArenaTheme(BOSS_ARENA_THEMES[bossId] || 'ABYSS', 60);

  const angle = Math.random() * Math.PI * 2;
  const bx = player.x + Math.cos(angle) * 380;
  const by = player.y + Math.sin(angle) * 380;

  const boss = {
    x: bx,
    y: by,
    bossId: bossDef.bossId,
    name: bossDef.name,
    hp: bossDef.hp,
    maxHp: bossDef.hp,
    radius: bossDef.radius,
    speed: bossDef.speed,
    baseSpeed: bossDef.speed,
    color: bossDef.color,
    damage: bossDef.damage,
    xp: bossDef.xp,
    isBoss: true,
    isMiniBoss: false,
    isFinalBoss: !!bossDef.isFinalBoss,
    isEnraged: false,
    facing: player.x >= bx ? 1 : -1,
    hitFlash: 0,
    orbitalHitCd: 0,
    slowTimer: 0,
    stunTimer: 0,
    windupTimer: 0,
    windupAction: null,
    combatState: 'CHASE'
  };

  enemies.push(boss);
  setActiveBoss(boss);
  initBoss(boss);

  const bossHud = document.getElementById('boss-hud');
  if (bossHud) bossHud.style.display = 'flex';

  const bossName = document.getElementById('boss-name');
  if (bossName) bossName.innerText = bossDef.name;

  const bossHpFill = document.getElementById('boss-hp-fill');
  if (bossHpFill) {
    bossHpFill.style.width = '100%';
    bossHpFill.style.background = '';
    bossHpFill.style.boxShadow = '';
  }

  const bossHpVal = document.getElementById('boss-hp-val');
  if (bossHpVal) bossHpVal.innerText = '100%';

  playSfx('boss');
  triggerShake(16);
  triggerHaptic('heavy');

  return boss;
}

/**
 * Spawna objetos quebráveis pelo cenário (barris, caixas).
 */
export function spawnProp() {
  if (props.length >= 14) return;
  const ang = Math.random() * Math.PI * 2;
  const dist = 180 + Math.random() * 320;

  props.push({
    x: player.x + Math.cos(ang) * dist,
    y: player.y + Math.sin(ang) * dist,
    radius: 14,
    hp: 18,
    maxHp: 18,
    hitFlash: 0,
    color: '#95a5a6'
  });
}