import { CHARACTERS } from '../config/characters.js';
import { playSfx, triggerHaptic } from '../core/audio.js';
import { inputX, inputY } from '../core/input.js';
import { levelUp } from '../systems/ui.js';
import { 
  gameState, 
  triggerShake, 
  createHitParticles, 
  acidPuddles, 
  bullets, 
  enemies, 
  enemyBullets,
  addDamageText 
} from '../main.js';
import { getNeighborIndices } from '../core/spatialGrid.js';

export let selectedHeroKey = 'KNIGHT';

export function setSelectedHeroKey(key) {
  selectedHeroKey = key;
}

// Meta-Progresso Permanente (Skill Tree RPG)
const META_KEY = 'hord_meta_tree_v1';
const GOLD_KEY = 'hord_persistent_gold_v1';

export function getPersistentGold() {
  return parseInt(localStorage.getItem(GOLD_KEY) || '0', 10);
}

export function addPersistentGold(amount) {
  const current = getPersistentGold();
  const next = Math.max(0, current + amount);
  localStorage.setItem(GOLD_KEY, next.toString());
  return next;
}

export const META_TALENTS = [
  { id: 'hp', name: "Vitalidade Rúnica", maxLvl: 10, costBase: 40, costScale: 1.4, desc: "+3% Vida Máxima por nível", getBonus: lvl => lvl * 0.03 },
  { id: 'speed', name: "Passos Ligeiros", maxLvl: 10, costBase: 50, costScale: 1.4, desc: "+2% Velocidade de Movimento por nível", getBonus: lvl => lvl * 0.02 },
  { id: 'damage', name: "Poder Ancestral", maxLvl: 10, costBase: 60, costScale: 1.45, desc: "+5% Dano Global por nível", getBonus: lvl => lvl * 0.05 },
  { id: 'reroll', name: "Destino Favorável", maxLvl: 3, costBase: 120, costScale: 1.9, desc: "+1 Reroll de Upgrades por partida por nível", getBonus: lvl => lvl },
  { id: 'magnet', name: "Ímã do Vazio", maxLvl: 10, costBase: 35, costScale: 1.35, desc: "+15 Raio de Atração por nível", getBonus: lvl => lvl * 15 }
];

export function getMetaLevels() {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : { hp: 0, speed: 0, damage: 0, reroll: 0, magnet: 0 };
  } catch (e) {
    return { hp: 0, speed: 0, damage: 0, reroll: 0, magnet: 0 };
  }
}

export function saveMetaLevels(levels) {
  localStorage.setItem(META_KEY, JSON.stringify(levels));
}

export function getMetaUpgradeCost(talentId, currentLevel) {
  const talent = META_TALENTS.find(t => t.id === talentId);
  if (!talent) return 999999;
  return Math.floor(talent.costBase * Math.pow(talent.costScale, currentLevel));
}

export function buyMetaUpgrade(talentId) {
  const levels = getMetaLevels();
  const talent = META_TALENTS.find(t => t.id === talentId);
  const currentLvl = levels[talentId] || 0;
  if (!talent || currentLvl >= talent.maxLvl) return false;

  const cost = getMetaUpgradeCost(talentId, currentLvl);
  const gold = getPersistentGold();
  if (gold < cost) return false;

  addPersistentGold(-cost);
  levels[talentId] = currentLvl + 1;
  saveMetaLevels(levels);
  return true;
}

export function resetMetaTree() {
  const levels = getMetaLevels();
  let refund = 0;
  META_TALENTS.forEach(t => {
    const lvl = levels[t.id] || 0;
    for (let l = 0; l < lvl; l++) {
      refund += Math.floor(t.costBase * Math.pow(t.costScale, l));
    }
    levels[t.id] = 0;
  });
  saveMetaLevels(levels);
  addPersistentGold(refund);
  return refund;
}

export function getMetaBonuses() {
  const levels = getMetaLevels();
  return {
    hpMult: 1 + (levels.hp || 0) * 0.03,
    speedMult: 1 + (levels.speed || 0) * 0.02,
    damageMult: 1 + (levels.damage || 0) * 0.05,
    rerolls: levels.reroll || 0,
    magnetBonus: (levels.magnet || 0) * 15
  };
}

export function calculateEffectiveDamage() {
  const meta = getMetaBonuses();
  return Math.round((player.baseDamage || 0) * (1 + (player.damagePercentBonus || 0)) * meta.damageMult);
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

  // Arquitetura de Dano Aditivo
  baseDamage: 28,
  damagePercentBonus: 0,
  damageCardCount: 0,
  get damage() {
    return calculateEffectiveDamage();
  },
  set damage(val) {
    this.baseDamage = val;
  },

  range: 320,
  projectiles: 1,
  magnet: 85,
  critChance: 0.15,
  critMult: 1.5,
  iFrames: 0,
  facing: 1,
  walkCycle: 0,
  isMoving: false,
  auraLvl: 0,
  auraTimer: 0,
  orbitals: 0,
  orbitalAngle: 0,

  // Propriedades do Machado com Translação e Orientação Radial (Kragdor)
  axeAngle: 0,
  axeSpinSpeed: 0.085,
  axeRadius: 56,
  axeCount: 0,
  axeDamageMult: 1.0,
  axeContactCds: new Map(),
  axeHitCount: 0,

  // Bônus, Habilidades e Estados Ativos
  staffPierceBonus: 0,
  evolvedSword: false,
  evolvedAura: false,
  evolvedOrbitals: false,
  evolvedAxe: false,
  evolvedStaff: false,
  evolvedHammer: false,
  evolvedPotion: false,
  hasPowerPassive: false,
  hasArmorPassive: false,
  hasWingsPassive: false,
  slowChance: 0,
  rerolls: 0,
  weapons: [],
  skillCd: 0,
  skillMaxCd: 400,
  dashDuration: 0,
  dashVx: 0,
  dashVy: 0,
  ignisDashDuration: 0,
  ignisDashVx: 0,
  ignisDashVy: 0,
  berserkTimer: 0,
  invisTimer: 0
};

export function initSkillUI() {
  const skillContainer = document.getElementById('skill-btn-container');
  if (!skillContainer) return;

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
  const skillContainer = document.getElementById('skill-btn-container');
  const skillMask = document.getElementById('skill-cooldown-mask');
  const skillText = document.getElementById('skill-timer-text');

  if (!skillContainer || !skillMask || !skillText) return;

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
    player.iFrames = 26;
    const moveAng = Math.atan2(inputY || 0.0001, inputX || player.facing);
    player.ignisDashVx = Math.cos(moveAng) * 14.2;
    player.ignisDashVy = Math.sin(moveAng) * 14.2;
    player.ignisDashDuration = 14;
    playSfx('acid');
    triggerShake(6);
    triggerHaptic('medium');
  } else if (selectedHeroKey === 'ROGUE') {
    player.invisTimer = 120;
    createHitParticles(player.x, player.y, '#34495e', 24);
    playSfx('evolution');
    triggerHaptic('light');
  } else if (selectedHeroKey === 'BARBARIAN') {
    triggerShake(18);
    playSfx('boss');
    triggerHaptic('heavy');
    createHitParticles(player.x, player.y, '#e67e22', 36);

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 260) {
        const nx = dist > 0.001 ? dx / dist : 1;
        const ny = dist > 0.001 ? dy / dist : 0;
        e.x += nx * 55;
        e.y += ny * 55;
        e.stunTimer = 110;
        e.slowTimer = 240;
        e.slowFactor = 0.65;
        e.hitFlash = 6;
        e.hp -= player.damage * 1.5;
        createHitParticles(e.x, e.y, '#d35400', 8);
      }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const eb = enemyBullets[i];
      const edx = eb.x - player.x;
      const edy = eb.y - player.y;
      if (edx * edx + edy * edy < 260 * 260) {
        createHitParticles(eb.x, eb.y, '#f1c40f', 5);
        enemyBullets.splice(i, 1);
      }
    }

    player.berserkTimer = 300;
  } else if (selectedHeroKey === 'ALCHEMIST') {
    triggerShake(8);
    playSfx('acid');
    triggerHaptic('medium');
    createHitParticles(player.x, player.y, '#2ecc71', 20);

    const flaskCount = 6;
    for (let k = 0; k < flaskCount; k++) {
      const fAng = (k * Math.PI * 2) / flaskCount;
      const targetDist = 110 + Math.random() * 40;
      bullets.push({
        type: 'POTION',
        x: player.x,
        y: player.y,
        vx: Math.cos(fAng) * 4.8,
        vy: Math.sin(fAng) * 4.8 - 2.5,
        targetX: player.x + Math.cos(fAng) * targetDist,
        targetY: player.y + Math.sin(fAng) * targetDist,
        radius: 8,
        damage: player.damage * 0.9,
        life: 28,
        angle: 0,
        trail: []
      });
    }
  }

  player.skillCd = player.skillMaxCd;
}

export function updateSpinningAxes(dt) {
  if (player.axeCount <= 0) return;

  const currentSpinSpeed = (player.axeSpinSpeed || 0.085) * (player.berserkTimer > 0 ? 2.0 : 1.0);
  player.axeAngle += currentSpinSpeed * dt;

  for (let [enemyRef, cd] of player.axeContactCds.entries()) {
    const nextCd = cd - dt;
    if (nextCd <= 0 || !enemies.includes(enemyRef)) {
      player.axeContactCds.delete(enemyRef);
    } else {
      player.axeContactCds.set(enemyRef, nextCd);
    }
  }

  const effectiveRadius = player.axeRadius || 56;
  const count = player.evolvedAxe ? Math.max(player.axeCount, 6) : player.axeCount;

  for (let i = 0; i < count; i++) {
    const angle = player.axeAngle + (i * (Math.PI * 2 / count));
    const ax = player.x + Math.cos(angle) * effectiveRadius;
    const ay = player.y + Math.sin(angle) * effectiveRadius;
    const hitRadius = player.evolvedAxe ? 28 : 22;

    for (let bIdx = enemyBullets.length - 1; bIdx >= 0; bIdx--) {
      const eb = enemyBullets[bIdx];
      const bdx = eb.x - ax;
      const bdy = eb.y - ay;
      if (bdx * bdx + bdy * bdy < (hitRadius + eb.radius) ** 2) {
        createHitParticles(eb.x, eb.y, '#f1c40f', 5);
        playSfx('hit');
        enemyBullets.splice(bIdx, 1);
      }
    }

    const nearbyIndices = getNeighborIndices(ax, ay, hitRadius + 20);
    for (let k = 0; k < nearbyIndices.length; k++) {
      const e = enemies[nearbyIndices[k]];
      if (!e || player.axeContactCds.has(e)) continue;

      const dx = e.x - ax;
      const dy = e.y - ay;
      const rSum = e.radius + hitRadius;

      if (dx * dx + dy * dy < rSum * rSum) {
        let dmg = player.damage * player.axeDamageMult * (player.evolvedAxe ? 1.6 : 1.2);
        if (player.berserkTimer > 0) dmg *= 1.35;
        if (e.isBoss) dmg *= 0.40;

        const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
        let finalDmg = isCrit ? dmg * player.critMult : dmg;

        if (e.isBoss) {
          const maxHitAllowed = e.maxHp * 0.035;
          if (finalDmg > maxHitAllowed) finalDmg = maxHitAllowed;
        }

        e.hp -= finalDmg;
        e.hitFlash = 4;

        if (selectedHeroKey === 'BARBARIAN') {
          player.axeHitCount = (player.axeHitCount || 0) + 1;
          if (player.axeHitCount >= 18) {
            player.axeHitCount = 0;
            if (player.hp < player.maxHp) {
              player.hp = Math.min(player.maxHp, player.hp + 1);
              addDamageText(player.x, player.y, "+1 HP", false, '#2ecc71');
            }
          }
        }

        const cdFrames = Math.max(6, Math.floor(18 / (currentSpinSpeed / 0.085)));
        player.axeContactCds.set(e, cdFrames);

        playSfx('hit');
        if (isCrit) playSfx('crit');
        addDamageText(ax, ay, Math.round(finalDmg), isCrit, '#e67e22');
        createHitParticles(ax, ay, '#e67e22', 4);

        const pushAng = Math.atan2(e.y - player.y, e.x - player.x);
        const pushForce = (player.evolvedAxe ? 12 : 7) * (player.berserkTimer > 0 ? 1.6 : 1.0);
        e.x += Math.cos(pushAng) * pushForce;
        e.y += Math.sin(pushAng) * pushForce;

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

export function fireWeapons() {
  if (enemies.length === 0) return;

  player.weapons.forEach(w => {
    if (w.timer < w.cooldown) return;

    let weaponRange = 320;
    if (w.type === 'POTION') weaponRange = 480;
    else if (w.type === 'HAMMER') weaponRange = 110;
    else if (w.type === 'SWORD') weaponRange = 300;
    else if (w.type === 'STAFF') weaponRange = 340;
    else if (w.type === 'AXE') return;

    const rangeSq = weaponRange * weaponRange;
    const inRange = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dSq = dx * dx + dy * dy;
      if (dSq <= rangeSq) inRange.push({ enemy: e, distSq: dSq });
    }

    if (inRange.length === 0) return;

    w.timer = 0;
    inRange.sort((a, b) => a.distSq - b.distSq);
    const closestEnemy = inRange[0].enemy;

    if (w.type === 'SWORD') {
      playSfx('shoot');
      const count = player.evolvedSword ? 6 : w.count;

      for (let i = 0; i < count; i++) {
        const target = inRange[i % inRange.length].enemy;
        const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
        const spread = inRange.length < count ? (i - (count - 1) / 2) * 0.22 : 0;
        const angle = baseAngle + spread;

        bullets.push({
          type: 'SWORD',
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * (player.evolvedSword ? 12 : 9.2),
          vy: Math.sin(angle) * (player.evolvedSword ? 12 : 9.2),
          angle: angle,
          radius: player.evolvedSword ? 9 : 5,
          damage: player.damage * w.damageMult * (player.evolvedSword ? 1.6 : 1.1),
          life: player.evolvedSword ? 68 : 52,
          piercing: player.evolvedSword ? 4 : 2,
          isEvolved: player.evolvedSword,
          trail: []
        });
      }
    } else if (w.type === 'STAFF') {
      playSfx('shoot');
      const count = player.evolvedStaff ? Math.max(w.count, 4) : w.count;

      for (let i = 0; i < count; i++) {
        const target = inRange[i % inRange.length].enemy;
        const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
        const spread = count > 1 ? (i - (count - 1) / 2) * 0.18 : 0;
        const angle = baseAngle + spread;

        bullets.push({
          type: 'STAFF',
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * (player.evolvedStaff ? 11.5 : 9.8),
          vy: Math.sin(angle) * (player.evolvedStaff ? 11.5 : 9.8),
          angle: angle,
          radius: player.evolvedStaff ? 11 : 8,
          damage: player.damage * w.damageMult * (player.evolvedStaff ? 1.7 : 1.25),
          life: 55,
          piercing: (player.staffPierceBonus || 0) + (player.evolvedStaff ? 5 : 2),
          hitCount: 0,
          isEvolved: player.evolvedStaff,
          trail: []
        });
      }
    } else if (w.type === 'POTION') {
      playSfx('acid');
      
      const rawDx = closestEnemy.x - player.x;
      const rawDy = closestEnemy.y - player.y;
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      const flightFrames = Math.max(18, Math.min(42, Math.floor(dist / 7.2)));

      const angleToPlayer = Math.atan2(player.y - closestEnemy.y, player.x - closestEnemy.x);
      const enemyCurSpeed = closestEnemy.speed * (closestEnemy.slowTimer > 0 ? (1 - (closestEnemy.slowFactor || 0.5)) : 1.0);
      
      const leadDist = Math.min(enemyCurSpeed * flightFrames * 0.88, dist * 0.75);
      const targetX = closestEnemy.x + Math.cos(angleToPlayer) * leadDist;
      const targetY = closestEnemy.y + Math.sin(angleToPlayer) * leadDist;

      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const count = player.evolvedPotion ? Math.max(w.count, 5) : w.count;

      for (let i = 0; i < count; i++) {
        const arcOffset = i * 0.45;

        bullets.push({
          type: 'POTION',
          x: player.x,
          y: player.y,
          vx: dx / flightFrames,
          vy: (dy / flightFrames) - (3.8 + arcOffset),
          targetX: targetX,
          targetY: targetY,
          radius: 8,
          damage: player.damage * w.damageMult * (player.evolvedPotion ? 1.6 : 1.0),
          life: flightFrames,
          angle: i * 0.4,
          isEvolved: player.evolvedPotion,
          trail: []
        });
      }
    } else if (w.type === 'HAMMER') {
      playSfx('hit');
      triggerShake(10);

      const targetAngle = Math.atan2(closestEnemy.y - player.y, closestEnemy.x - player.x);
      player.facing = closestEnemy.x >= player.x ? 1 : -1;
      const slamRadius = (player.evolvedHammer ? 92 : 72) + (w.count - 1) * 10;

      bullets.push({
        type: 'HAMMER_SLAM',
        x: player.x,
        y: player.y,
        angle: targetAngle,
        radius: slamRadius,
        damage: player.damage * w.damageMult * (player.evolvedHammer ? 2.8 : 2.0),
        life: 24,
        maxLife: 24,
        hitSet: new Set(),
        isEvolved: player.evolvedHammer
      });
    }
  });
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
  const meta = getMetaBonuses();

  player.x = 0;
  player.y = 0;
  player.maxHp = Math.round(c.stats.maxHp * meta.hpMult);
  player.hp = player.maxHp;
  player.level = 1;
  player.xp = 0;
  player.nextXp = 5;

  player.baseDamage = c.stats.damage;
  player.damagePercentBonus = 0;
  player.damageCardCount = 0;

  player.attackCooldown = c.stats.attackCooldown;
  player.baseSpeed = c.stats.speed * meta.speedMult;
  player.speed = player.baseSpeed;
  player.projectiles = c.stats.projectiles;
  player.magnet = c.stats.magnet + meta.magnetBonus;
  player.critChance = c.stats.critChance;
  player.critMult = 1.5;
  player.auraLvl = c.stats.auraLvl;
  player.orbitals = c.stats.orbitals;
  player.skillMaxCd = c.stats.skillCooldownMax;
  player.skillCd = 0;
  player.dashDuration = 0;
  player.dashVx = 0;
  player.dashVy = 0;
  player.ignisDashDuration = 0;
  player.ignisDashVx = 0;
  player.ignisDashVy = 0;
  player.berserkTimer = 0;
  player.invisTimer = 0;

  player.evolvedSword = false;
  player.evolvedAura = false;
  player.evolvedOrbitals = false;
  player.evolvedAxe = false;
  player.evolvedStaff = false;
  player.evolvedHammer = false;
  player.evolvedPotion = false;
  player.hasPowerPassive = false;
  player.hasArmorPassive = false;
  player.hasWingsPassive = false;
  player.slowChance = 0;
  player.rerolls = meta.rerolls;
  player.iFrames = 0;
  player.facing = 1;
  player.walkCycle = 0;
  player.auraTimer = 0;
  player.orbitalAngle = 0;
  player.attackTimer = 0;
  player.isMoving = false;
  player.staffPierceBonus = 0;

  player.axeAngle = 0;
  player.axeSpinSpeed = 0.085;
  player.axeRadius = 56;
  player.axeCount = (c.startingWeapon === 'AXE') ? 1 : 0;
  player.axeDamageMult = 1.0;
  player.axeContactCds = new Map();
  player.axeHitCount = 0;

  if (heroKey === 'ALCHEMIST') player.range = 480;
  else if (heroKey === 'KNIGHT') player.range = 110;
  else if (heroKey === 'MAGE') player.range = 340;
  else player.range = 320;

  player.weapons = [
    {
      type: c.startingWeapon,
      level: 1,
      count: c.stats.projectiles || 1,
      damageMult: 1.0,
      timer: 0,
      cooldown: c.stats.attackCooldown
    }
  ];
}