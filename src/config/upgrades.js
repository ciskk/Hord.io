import { player, selectedHeroKey, registerWeaponInInventory, registerPassiveInInventory, addPersistentGold } from '../entities/player.js';
import { getAvailableSynergies } from './items.js';

export const upgradesPool = [
  // --- Aprimoramentos do Machado (Kragdor) ---
  {
    id: 'axe_speed',
    title: "Turbilhão Violento",
    rarity: "card-rare",
    badge: "Machado",
    desc: "Acelera a órbita de translação do machado e reduz o intervalo entre cortes",
    stat: "+40% Velocidade de Órbita",
    apply: () => {
      player.axeSpinSpeed = (player.axeSpinSpeed || 0.085) + 0.038;
      const w = player.weapons.find(wp => wp.type === 'AXE');
      if (w) w.damageMult += 0.15;
    },
    isAvailable: () => !player.evolvedAxe && player.weapons.some(w => w.type === 'AXE') && (player.axeSpinSpeed || 0.085) < 0.22
  },
  {
    id: 'axe_extra',
    title: "Machado Adicional",
    rarity: "card-legendary",
    badge: "Machado",
    desc: "Adiciona +1 machado ao anel orbital que translada ao redor do bárbaro",
    stat: "+1 Machado no Anel (Máx: 4)",
    apply: () => {
      player.axeCount = (player.axeCount || 1) + 1;
      const w = player.weapons.find(wp => wp.type === 'AXE');
      if (w) {
        w.count = player.axeCount;
      }
      registerWeaponInInventory('AXE', player.axeCount);
    },
    isAvailable: () => !player.evolvedAxe && player.weapons.some(w => w.type === 'AXE') && (player.axeCount || 1) < 4
  },
  {
    id: 'axe_radius',
    title: "Gume Pesado",
    rarity: "card-rare",
    badge: "Machado",
    desc: "Aumenta o raio de alcance da translação do machado e o dano de corte",
    stat: "+16px Raio Orbital",
    apply: () => {
      player.axeRadius = (player.axeRadius || 56) + 16;
      const w = player.weapons.find(wp => wp.type === 'AXE');
      if (w) w.damageMult += 0.15;
    },
    isAvailable: () => !player.evolvedAxe && player.weapons.some(w => w.type === 'AXE') && (player.axeRadius || 56) < 110
  },

  // --- Aprimoramentos das Poções (Valéria) ---
  {
    id: 'potion_volley',
    title: "Salvo Alquímico",
    rarity: "card-legendary",
    badge: "Poção",
    desc: "Arremessa +1 frasco cáustico extra rigorosamente no mesmo epicentro da poça gigante",
    stat: "+1 Frasco Concentrado (Máx: 5)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'POTION');
      if (w) {
        w.count += 1;
      }
      player.projectiles = (w ? w.count : 1);
      registerWeaponInInventory('POTION', w ? w.count : 1);
    },
    isAvailable: () => !player.evolvedPotion && player.weapons.some(w => w.type === 'POTION') && (player.weapons.find(wp => wp.type === 'POTION')?.count || 1) < 5
  },
  {
    id: 'potion_potency',
    title: "Superposição Cáustica",
    rarity: "card-rare",
    badge: "Poção",
    desc: "Aumenta em +15% o dano corrosivo e a área de contaminação das poças ácidas",
    stat: "+15% Dano & Área (Máx: 3)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'POTION');
      if (w) {
        w.damageMult += 0.15;
        w.potencyCount = (w.potencyCount || 0) + 1;
      }
    },
    isAvailable: () => {
      if (player.evolvedPotion) return false;
      const w = player.weapons.find(wp => wp.type === 'POTION');
      return !!w && (w.potencyCount || 0) < 3;
    }
  },

  // --- Aprimoramentos do Cajado (Ignis) ---
  {
    id: 'staff_projectiles',
    title: "Cajado da Tormenta",
    rarity: "card-rare",
    badge: "Cajado",
    desc: "+1 Esfera mágica concentrada canalizada contra os alvos avistados",
    stat: "+1 Orbe Místico (Máx: 5)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'STAFF');
      if (w) {
        w.count += 1;
      }
      registerWeaponInInventory('STAFF', w ? w.count : 1);
    },
    isAvailable: () => !player.evolvedStaff && player.weapons.some(w => w.type === 'STAFF') && (player.weapons.find(wp => wp.type === 'STAFF')?.count || 1) < 5
  },
  {
    id: 'staff_pierce',
    title: "Poder da Fênix",
    rarity: "card-rare",
    badge: "Cajado",
    desc: "As esferas do cajado perfuram +1 inimigo e ampliam o rastro de queimadura",
    stat: "+1 Perfuração Arcana (Máx: 3)",
    apply: () => {
      player.staffPierceBonus = (player.staffPierceBonus || 0) + 1;
      const w = player.weapons.find(wp => wp.type === 'STAFF');
      if (w) w.damageMult += 0.08;
    },
    isAvailable: () => !player.evolvedStaff && player.weapons.some(w => w.type === 'STAFF') && (player.staffPierceBonus || 0) < 3
  },

  // --- Aprimoramentos das Espadas (Kael) ---
  {
    id: 'sword_extra',
    title: "Lâminas Espirituais",
    rarity: "card-rare",
    badge: "Lâminas",
    desc: "+1 Espada espectral adicional arremessada contra oponentes avistados",
    stat: "+1 Lâmina Espectral (Máx: 5)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'SWORD');
      if (w) {
        w.count += 1;
      }
      player.projectiles = (w ? w.count : 1);
      registerWeaponInInventory('SWORD', w ? w.count : 1);
    },
    isAvailable: () => !player.evolvedSword && player.weapons.some(w => w.type === 'SWORD') && (player.weapons.find(wp => wp.type === 'SWORD')?.count || 1) < 5
  },
  {
    id: 'sword_speed',
    title: "Gume Astral",
    rarity: "card-rare",
    badge: "Lâminas",
    desc: "+12% de velocidade de voo e dano letal para as espadas teleguiadas",
    stat: "+12% Voo e Dano (Máx: 3)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'SWORD');
      if (w) {
        w.damageMult += 0.12;
        w.swordSpeedCount = (w.swordSpeedCount || 0) + 1;
      }
    },
    isAvailable: () => {
      if (player.evolvedSword) return false;
      const w = player.weapons.find(wp => wp.type === 'SWORD');
      return !!w && (w.swordSpeedCount || 0) < 3;
    }
  },

  // --- Aprimoramentos do Martelo (Sir Roland) ---
  {
    id: 'hammer_crush',
    title: "Fenda Sísmica",
    rarity: "card-rare",
    badge: "Martelo",
    desc: "Aumenta o raio do impacto sísmico 360° em +24px e amplifica o estilhaço de rochas",
    stat: "+24px Raio Sísmico (Máx: 4)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'HAMMER');
      if (w) {
        w.count += 1;
        w.damageMult += 0.30;
      }
      registerWeaponInInventory('HAMMER', w ? w.count : 1);
    },
    isAvailable: () => !player.evolvedHammer && player.weapons.some(w => w.type === 'HAMMER') && (player.weapons.find(wp => wp.type === 'HAMMER')?.count || 1) < 4
  },
  {
    id: 'hammer_impact',
    title: "Golpe Demolidor",
    rarity: "card-rare",
    badge: "Martelo",
    desc: "O martelo golpeia com +20% de dano de esmagamento no epicentro e fissuras frontais",
    stat: "+20% Dano Esmagador (Máx: 4)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'HAMMER');
      if (w) {
        w.damageMult += 0.20;
        w.impactCount = (w.impactCount || 0) + 1;
      }
    },
    isAvailable: () => {
      if (player.evolvedHammer) return false;
      const w = player.weapons.find(wp => wp.type === 'HAMMER');
      return !!w && (w.impactCount || 0) < 4;
    }
  },

  // --- Passivas Universais ---
  {
    id: 'frost_passive',
    title: "Golpe Criogênico",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "+15% de chance de congelar e desacelerar monstros atingidos por 2.5s",
    stat: "+15% Chance Lentidão (Máx: 4)",
    apply: () => {
      player.frostCardCount = (player.frostCardCount || 0) + 1;
      player.slowChance = Math.min(0.60, (player.slowChance || 0) + 0.15);
      registerPassiveInInventory('frost_passive', 1, { stacks: player.frostCardCount });
    },
    isAvailable: () => (player.frostCardCount || 0) < 4
  },
  {
    id: 'dmg',
    title: "Poder Bruto",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Aumenta o dano global do herói em +7%",
    stat: "+7% Dano Global (Máx: 4)",
    apply: () => { 
      player.damagePercentBonus = (player.damagePercentBonus || 0) + 0.07;
      player.damageCardCount = (player.damageCardCount || 0) + 1;
      player.hasPowerPassive = true; 
      registerPassiveInInventory('dmg', 1, { stacks: player.damageCardCount });
    },
    isAvailable: () => (player.damageCardCount || 0) < 4
  },
  {
    id: 'haste',
    title: "Fúria Rápida",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Reduz a recarga das armas em 12% ou acelera a rotação orbital em Kragdor",
    stat: "-12% Recarga (Máx: 3)",
    apply: () => {
      player.hasteCardCount = (player.hasteCardCount || 0) + 1;
      if (selectedHeroKey === 'BARBARIAN') {
        player.axeSpinSpeed = (player.axeSpinSpeed || 0.085) + 0.035;
        const w = player.weapons.find(wp => wp.type === 'AXE');
        if (w) w.damageMult += 0.12;
      } else {
        player.cooldownReduction = Math.min(0.36, (player.cooldownReduction || 0) + 0.12);
        player.attackCooldown = Math.max(10, Math.floor(player.attackCooldown * 0.88));
        player.weapons.forEach(w => {
          w.cooldown = Math.max(10, Math.floor(w.cooldown * 0.88));
        });
      }
      registerPassiveInInventory('haste', 1, { stacks: player.hasteCardCount });
    },
    isAvailable: () => (player.hasteCardCount || 0) < 3
  },
  {
    id: 'wings',
    title: "Asas do Vento",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Acelera a locomoção do herói",
    stat: "+0.45 Velocidade (Máx: 4)",
    apply: () => { 
      player.wingsCardCount = (player.wingsCardCount || 0) + 1;
      player.baseSpeed += 0.45; 
      player.speed = player.invisTimer > 0 ? player.baseSpeed * 2 : player.baseSpeed; 
      player.hasWingsPassive = true; 
      registerPassiveInInventory('wings', 1, { stacks: player.wingsCardCount });
    },
    isAvailable: () => (player.wingsCardCount || 0) < 4
  },
  {
    id: 'crit',
    title: "Foco Letal",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Aumenta as chances e o multiplicador de crítico",
    stat: "+8% Chance / +0.08 Mult (Máx: 4)",
    apply: () => { 
      player.critCardCount = (player.critCardCount || 0) + 1;
      player.critChance += 0.08; 
      player.critMult += 0.08; 
      registerPassiveInInventory('crit', 1, { stacks: player.critCardCount });
    },
    isAvailable: () => (player.critCardCount || 0) < 4
  },
  {
    id: 'magnet',
    title: "Ímã Titânico",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Aumenta o alcance de atração de gemas",
    stat: "+50 Raio de Atração (Máx: 4)",
    apply: () => {
      player.magnetCardCount = (player.magnetCardCount || 0) + 1;
      player.magnet += 50;
      registerPassiveInInventory('magnet', 1, { stacks: player.magnetCardCount });
    },
    isAvailable: () => (player.magnetCardCount || 0) < 4
  },
  {
    id: 'aura',
    title: "Aura Sagrada",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Campo de dano constante ao redor do herói",
    stat: "+1 Nível de Aura (Máx: 5)",
    apply: () => {
      player.auraLvl += 1;
      registerWeaponInInventory('aura', player.auraLvl);
    },
    isAvailable: () => player.auraLvl < 5 && !player.evolvedAura
  },
  {
    id: 'orbitals',
    title: "Bíblias Protetoras",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Tomos celestiais giram destruindo oponentes",
    stat: "+1 Tomo Orbital (Máx: 6)",
    apply: () => {
      player.orbitals += 1;
      registerWeaponInInventory('orbitals', player.orbitals);
    },
    isAvailable: () => player.orbitals < 6 && !player.evolvedOrbitals
  },
  {
    id: 'armor',
    title: "Armadura Rúnica",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Reforça a carcaça e eleva o limite de vitalidade",
    stat: "+45 HP Máximo (Máx: 5)",
    apply: () => { 
      player.armorCardCount = (player.armorCardCount || 0) + 1;
      player.maxHp += 45; 
      player.hp += 45; 
      player.hasArmorPassive = true; 
      registerPassiveInInventory('armor', 1, { stacks: player.armorCardCount });
    },
    isAvailable: () => (player.armorCardCount || 0) < 5
  },
  {
    id: 'heal',
    title: "Poção Alquímica",
    rarity: "card-common",
    badge: "Utilidade",
    desc: "Recupera imediatamente parte vital das feridas",
    stat: "Cura 65% do HP",
    apply: () => player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.65),
    isAvailable: () => player.hp < player.maxHp * 0.95
  }
];

export const BLESSING_UPGRADE = {
  id: 'blessing',
  title: "Bênção da Fortuna",
  rarity: "card-legendary",
  badge: "Recompensa",
  desc: "Todos os poderes conhecidos atingiram o apogeu! Recupera vitalidade e concede ouro da arena.",
  stat: "Cura 35% HP & +40 Ouro",
  apply: () => {
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.35);
    addPersistentGold(40);
  },
  isAvailable: () => true
};

export function getRandomUpgrades(count) {
  const available = upgradesPool.filter(opt => opt.isAvailable());

  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const selected = available.slice(0, count);

  // Fallback: se o jogador já maximizou os upgrades disponíveis, completa as opções com a Bênção da Fortuna
  while (selected.length < count) {
    selected.push(BLESSING_UPGRADE);
  }

  return selected;
}

export function checkSynergies() {
  return getAvailableSynergies(player);
}