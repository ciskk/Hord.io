import { CHARACTERS } from '../config/characters.js';
import { playSfx, triggerHaptic } from '../core/audio.js';
import { inputX, inputY } from '../core/input.js';
import { levelUp } from '../systems/ui.js';
import { gameState, triggerShake, createHitParticles, acidPuddles, bullets, enemies } from '../main.js';

export let selectedHeroKey = 'KNIGHT';

export function setSelectedHeroKey(key) {
  selectedHeroKey = key;
}

export const player = {
  x: 0,
  y: 0,
  radius: 14,
  speed: 3.4,
  baseSpeed: 3.4,
  hp: 120,
  maxHp: 120,
  level: 1,
  xp: 0,
  nextXp: 5,
  attackCooldown: 35,
  attackTimer: 0,
  damage: 28,
  range: 240,
  projectiles: 1,
  magnet: 85,
  critChance: 0.15,
  critMult: 2.0,
  iFrames: 0,
  facing: 1,
  walkCycle: 0,
  isMoving: false,
  auraLvl: 0,
  auraTimer: 0,
  orbitals: 0,
  orbitalAngle: 0,
  evolvedSword: false,
  evolvedAura: false,
  evolvedOrbitals: false,
  hasPowerPassive: false,
  hasArmorPassive: false,
  hasWingsPassive: false,
  skillCd: 0,
  skillMaxCd: 400,
  dashDuration: 0,
  dashVx: 0,
  dashVy: 0,
  invisTimer: 0
};

const skillContainer = document.getElementById('skill-btn-container');
const skillMask = document.getElementById('skill-cooldown-mask');
const skillText = document.getElementById('skill-timer-text');

export function initSkillUI() {
  skillContainer.addEventListener('touchstart', e => {
    e.stopPropagation();
    e.preventDefault();
    triggerHeroSkill();
  }, { passive: false });

  skillContainer.addEventListener('click', e => {
    e.stopPropagation();
    triggerHeroSkill();
  });
}

export function updateSkillUI() {
  if (player.skillCd <= 0) {
    skillMask.style.background = 'transparent';
    skillText.innerText = '';
    skillContainer.classList.add('ready');
  } else {
    skillContainer.classList.remove('ready');
    const ratio = player.skillCd / player.skillMaxCd;
    const deg = Math.floor(ratio * 360);
    skillMask.style.background = `conic-gradient(rgba(10, 12, 18, 0.82) ${deg}deg, transparent ${deg}deg)`;
    skillText.innerText = (player.skillCd / 60).toFixed(1) + 's';
  }
}

export function triggerHeroSkill() {
  if (player.skillCd > 0 || gameState.isPaused || gameState.isDead || gameState.isWon) return;

  if (selectedHeroKey === 'KNIGHT') {
    player.iFrames = 50;
    const moveAng = Math.atan2(inputY || 0.0001, inputX || player.facing);
    player.dashVx = Math.cos(moveAng) * 16;
    player.dashVy = Math.sin(moveAng) * 16;
    player.dashDuration = 22;
    playSfx('boss');
    triggerShake(9);
    triggerHaptic('heavy');
  } else if (selectedHeroKey === 'MAGE') {
    const moveAng = Math.atan2(inputY || 0.0001, inputX || player.facing);
    const jumpDist = 150;
    const origX = player.x;
    const origY = player.y;

    player.x += Math.cos(moveAng) * jumpDist;
    player.y += Math.sin(moveAng) * jumpDist;

    for (let step = 0; step <= 1; step += 0.2) {
      acidPuddles.push({
        x: origX + Math.cos(moveAng) * (jumpDist * step),
        y: origY + Math.sin(moveAng) * (jumpDist * step),
        radius: 28,
        life: 300,
        maxLife: 300,
        isFire: true
      });
    }
    playSfx('acid');
    triggerShake(6);
    triggerHaptic('medium');
  } else if (selectedHeroKey === 'ROGUE') {
    player.invisTimer = 210;
    createHitParticles(player.x, player.y, '#34495e', 24);
    playSfx('evolution');
    triggerHaptic('light');
  }

  player.skillCd = player.skillMaxCd;
}

export function fireWeapons() {
  if (enemies.length === 0) return;

  const inRange = [];
  const rangeSq = player.range * player.range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dSq = dx * dx + dy * dy;
    if (dSq <= rangeSq) inRange.push({ enemy: e, distSq: dSq });
  }

  if (inRange.length === 0) return;
  inRange.sort((a, b) => a.distSq - b.distSq);

  playSfx('shoot');
  const count = player.evolvedSword ? 6 : player.projectiles;

  for (let i = 0; i < count; i++) {
    const target = inRange[i % inRange.length].enemy;
    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    const spread = inRange.length < count ? (i - (count - 1) / 2) * 0.24 : 0;
    const angle = baseAngle + spread;

    bullets.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * (player.evolvedSword ? 11.5 : 8.8),
      vy: Math.sin(angle) * (player.evolvedSword ? 11.5 : 8.8),
      angle: angle,
      radius: player.evolvedSword ? 9 : 5,
      damage: player.damage * (player.evolvedSword ? 1.5 : 1),
      life: player.evolvedSword ? 68 : 52,
      piercing: player.evolvedSword ? 4 : 1,
      isEvolved: player.evolvedSword,
      trail: []
    });
  }
}

export function addXP(amount) {
  playSfx('gem');
  player.xp += amount;
  if (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level++;
    player.nextXp = Math.floor(player.nextXp * 1.42);
    levelUp();
  }
}

export function resetPlayer(heroKey) {
  selectedHeroKey = heroKey;
  const c = CHARACTERS[selectedHeroKey];
  player.x = 0;
  player.y = 0;
  player.hp = c.stats.hp;
  player.maxHp = c.stats.maxHp;
  player.level = 1;
  player.xp = 0;
  player.nextXp = 5;
  player.damage = c.stats.damage;
  player.attackCooldown = c.stats.attackCooldown;
  player.baseSpeed = c.stats.speed;
  player.speed = c.stats.speed;
  player.projectiles = c.stats.projectiles;
  player.magnet = c.stats.magnet;
  player.critChance = c.stats.critChance;
  player.critMult = 2.0;
  player.auraLvl = c.stats.auraLvl;
  player.orbitals = c.stats.orbitals;
  player.skillMaxCd = c.stats.skillCooldownMax;
  player.skillCd = 0;
  player.dashDuration = 0;
  player.dashVx = 0;
  player.dashVy = 0;
  player.invisTimer = 0;
  player.evolvedSword = false;
  player.evolvedAura = false;
  player.evolvedOrbitals = false;
  player.hasPowerPassive = false;
  player.hasArmorPassive = false;
  player.hasWingsPassive = false;
  player.iFrames = 0;
  player.facing = 1;
  player.walkCycle = 0;
  player.auraTimer = 0;
  player.orbitalAngle = 0;
  player.attackTimer = 0;
  player.isMoving = false;
}