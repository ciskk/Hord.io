import { player, selectedHeroKey, registerWeaponInInventory, registerPassiveInInventory } from '../entities/player.js';
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
    isAvailable: () => player.weapons.some(w => w.type === 'AXE') && (player.axeSpinSpeed || 0.085) < 0.26
  },
  {
    id: 'axe_extra',
    title: "Machado Adicional",
    rarity: "card-legendary",
    badge: "Machado",
    desc: "Adiciona +1 machado ao anel orbital que translada ao redor do bárbaro",
    stat: "+1 Machado no Anel",
    apply: () => {
      player.axeCount = (player.axeCount || 1) + 1;
      const w = player.weapons.find(wp => wp.type === 'AXE');
      if (w) {
        w.count = player.axeCount;
      }
      registerWeaponInInventory('AXE', player.axeCount);
    },
    isAvailable: () => player.weapons.some(w => w.type === 'AXE') && (player.axeCount || 1) < 4
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
    isAvailable: () => player.weapons.some(w => w.type === 'AXE') && (player.axeRadius || 56) < 110
  },

  // --- Aprimoramentos das Poções (Valéria) ---
  {
    id: 'potion_volley',
    title: "Salvo Alquímico",
    rarity: "card-legendary",
    badge: "Poção",
    desc: "Arremessa +1 frasco cáustico extra rigorosamente no mesmo epicentro da poça gigante",
    stat: "+1 Frasco Concentrado",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'POTION');
      if (w) {
        w.count += 1;
      }
      player.projectiles = (w ? w.count : 1);
      registerWeaponInInventory('POTION', w ? w.count : 1);
    },
    isAvailable: () => player.weapons.some(w => w.type === 'POTION') && (player.weapons.find(wp => wp.type === 'POTION')?.count || 1) < 5
  },
  {
    id: 'potion_potency',
    title: "Superposição Cáustica",
    rarity: "card-rare",
    badge: "Poção",
    desc: "Aumenta em +15% o dano corrosivo e a área de contaminação das poças ácidas",
    stat: "+15% Dano & Área",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'POTION');
      if (w) {
        w.damageMult += 0.15;
        w.potencyCount = (w.potencyCount || 0) + 1;
      }
    },
    isAvailable: () => {
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
    stat: "+1 Orbe Místico",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'STAFF');
      if (w) {
        w.count += 1;
      }
      registerWeaponInInventory('STAFF', w ? w.count : 1);
    },
    isAvailable: () => player.weapons.some(w => w.type === 'STAFF') && (player.weapons.find(wp => wp.type === 'STAFF')?.count || 1) < 5
  },
  {
    id: 'staff_pierce',
    title: "Poder da Fênix",
    rarity: "card-rare",
    badge: "Cajado",
    desc: "As esferas do cajado perfuram +1 inimigo e ampliam o rastro de queimadura",
    stat: "+1 Perfuração Arcana",
    apply: () => {
      player.staffPierceBonus = (player.staffPierceBonus || 0) + 1;
      const w = player.weapons.find(wp => wp.type === 'STAFF');
      if (w) w.damageMult += 0.08;
    },
    isAvailable: () => player.weapons.some(w => w.type === 'STAFF') && (player.staffPierceBonus || 0) < 4
  },

  // --- Aprimoramentos das Espadas (Kael) ---
  {
    id: 'sword_extra',
    title: "Lâminas Espirituais",
    rarity: "card-rare",
    badge: "Lâminas",
    desc: "+1 Espada espectral adicional arremessada contra oponentes avistados",
    stat: "+1 Lâmina Espectral",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'SWORD');
      if (w) {
        w.count += 1;
      }
      player.projectiles = (w ? w.count : 1);
      registerWeaponInInventory('SWORD', w ? w.count : 1);
    },
    isAvailable: () => player.weapons.some(w => w.type === 'SWORD') && (player.weapons.find(wp => wp.type === 'SWORD')?.count || 1) < 5 && !player.evolvedSword
  },
  {
    id: 'sword_speed',
    title: "Gume Astral",
    rarity: "card-rare",
    badge: "Lâminas",
    desc: "+12% de velocidade de voo e dano letal para as espadas teleguiadas",
    stat: "+12% Voo e Dano",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'SWORD');
      if (w) {
        w.damageMult += 0.12;
        w.swordSpeedCount = (w.swordSpeedCount || 0) + 1;
      }
    },
    isAvailable: () => {
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
    stat: "+24px Raio Sísmico",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'HAMMER');
      if (w) {
        w.count += 1;
        w.damageMult += 0.30;
      }
      registerWeaponInInventory('HAMMER', w ? w.count : 1);
    },
    isAvailable: () => player.weapons.some(w => w.type === 'HAMMER') && (player.weapons.find(wp => wp.type === 'HAMMER')?.count || 1) < 4
  },
  {
    id: 'hammer_impact',
    title: "Golpe Demolidor",
    rarity: "card-rare",
    badge: "Martelo",
    desc: "O martelo golpeia com +20% de dano de esmagamento no epicentro e fissuras frontais",
    stat: "+20% Dano Esmagador",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'HAMMER');
      if (w) w.damageMult += 0.20;
    },
    isAvailable: () => player.weapons.some(w => w.type === 'HAMMER')
  },

  // --- Passivas Universais ---
  {
    id: 'frost_passive',
    title: "Golpe Criogênico",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "+15% de chance de congelar e desacelerar monstros atingidos por 2.5s",
    stat: "+15% Chance Lentidão",
    apply: () => {
      player.slowChance = Math.min(0.75, (player.slowChance || 0) + 0.15);
      registerPassiveInInventory('frost_passive');
    },
    isAvailable: () => (player.slowChance || 0) < 0.70
  },
  {
    id: 'dmg',
    title: "Poder Bruto",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Aumenta o dano global do herói em +7%",
    stat: "+7% Dano Global",
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
    desc: "Reduz o tempo de recarga de todas as armas em 12% de forma multiplicativa.",
    stat: "-12% Recarga (Teto: 45%)",
    apply: () => {
      // Acumula a taxa teórica de redução de recarga respeitando o teto de 45%
      player.cooldownReduction = Math.min(0.45, (player.cooldownReduction || 0) + 0.12);

      // Reduz multiplicativamente o cooldown de ataque base do jogador (piso mínimo de 10 frames)
      player.attackCooldown = Math.max(10, Math.floor(player.attackCooldown * 0.88));

      // Aplica a redução percentual em cada arma ativa no inventário do jogador
      player.weapons.forEach(w => {
        w.cooldown = Math.max(10, Math.floor(w.cooldown * 0.88));
      });
      registerPassiveInInventory('haste');
    },
    isAvailable: () => {
      // Kragdor usa machado orbital (sem cooldown). 'haste' só entra no sorteio
      // se o machado ainda puder receber velocidade de órbita ('axe_speed')
      if (selectedHeroKey === 'BARBARIAN') {
        const axeSpeedOpt = upgradesPool.find(u => u.id === 'axe_speed');
        return !!(axeSpeedOpt && axeSpeedOpt.isAvailable());
      }

      const currentCDR = player.cooldownReduction || 0;
      const hasReducibleWeapons = player.weapons.some(w => w.cooldown > 10);
      return currentCDR < 0.45 && (player.attackCooldown > 10 || hasReducibleWeapons);
    }
  },
  {
    id: 'wings',
    title: "Asas do Vento",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Acelera a locomoção do herói",
    stat: "+0.45 Velocidade",
    apply: () => { 
      player.baseSpeed += 0.45; 
      player.speed = player.invisTimer > 0 ? player.baseSpeed * 2 : player.baseSpeed; 
      player.hasWingsPassive = true; 
      registerPassiveInInventory('wings');
    },
    isAvailable: () => player.baseSpeed < 6.5
  },
  {
    id: 'crit',
    title: "Foco Letal",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Aumenta as chances e o multiplicador de crítico",
    stat: "+8% Chance / +0.08 Mult",
    apply: () => { 
      player.critChance += 0.08; 
      player.critMult += 0.08; 
      registerPassiveInInventory('crit');
    },
    isAvailable: () => player.critChance < 0.40
  },
  {
    id: 'magnet',
    title: "Ímã Titânico",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Aumenta o alcance de atração de gemas",
    stat: "+50 Raio de Atração",
    apply: () => {
      player.magnet += 50;
      registerPassiveInInventory('magnet');
    },
    isAvailable: () => player.magnet < 380
  },
  {
    id: 'aura',
    title: "Aura Sagrada",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Campo de dano constante ao redor do herói",
    stat: "+1 Nível de Aura",
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
    stat: "+1 Tomo Orbital",
    apply: () => {
      player.orbitals += 1;
      registerWeaponInInventory('orbitals', player.orbitals);
    },
    isAvailable: () => player.orbitals < 4 && !player.evolvedOrbitals
  },
  {
    id: 'armor',
    title: "Armadura Rúnica",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Reforça a carcaça e eleva o limite de vitalidade",
    stat: "+45 HP Máximo",
    apply: () => { 
      player.maxHp += 45; 
      player.hp += 45; 
      player.hasArmorPassive = true; 
      registerPassiveInInventory('armor');
    },
    isAvailable: () => true
  },
  {
    id: 'heal',
    title: "Poção Alquímica",
    rarity: "card-common",
    badge: "Utilidade",
    desc: "Recupera imediatamente parte vital das feridas",
    stat: "Cura 65% do HP",
    apply: () => player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.65),
    isAvailable: () => player.hp < player.maxHp
  }
];

export function getRandomUpgrades(count) {
  const isBarbarian = (selectedHeroKey === 'BARBARIAN');
  const axeSpeedOpt = upgradesPool.find(u => u.id === 'axe_speed');
  const canGetAxeSpeed = isBarbarian && axeSpeedOpt && axeSpeedOpt.isAvailable();

  const available = upgradesPool.filter(opt => {
    // Se Kragdor já atingiu o teto da velocidade de órbita, descarta 'haste' do sorteio
    if (isBarbarian && opt.id === 'haste' && !canGetAxeSpeed) {
      return false;
    }
    return opt.isAvailable();
  });

  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const selected = available.slice(0, count);

  // Verificação exclusiva para Kragdor: substitui 'haste' por 'axe_speed'
  if (isBarbarian) {
    const hasteIdx = selected.findIndex(opt => opt.id === 'haste');
    if (hasteIdx !== -1) {
      const alreadyHasAxeSpeed = selected.some(opt => opt.id === 'axe_speed');
      if (canGetAxeSpeed && !alreadyHasAxeSpeed) {
        // Converte a redução de recarga em velocidade orbital do machado
        selected[hasteIdx] = axeSpeedOpt;
      } else {
        // Se 'axe_speed' já estiver entre as opções da tela ou no teto, puxa outra opção válida da fila
        const unusedOption = available.slice(count).find(opt => opt.id !== 'haste' && !selected.includes(opt));
        if (unusedOption) {
          selected[hasteIdx] = unusedOption;
        } else {
          selected.splice(hasteIdx, 1);
        }
      }
    }
  }

  return selected;
}

export function checkSynergies() {
  return getAvailableSynergies(player);
}