/**
 * src/config/items.js
 * Registro Unificado de Itens, Armas, Passivas e Matriz de Sinergias (ItemRegistry).
 * Single Source of Truth para o ecossistema de itens de Hord.io.
 */

export const ITEM_CATEGORIES = {
  WEAPON: 'WEAPON',
  PASSIVE: 'PASSIVE',
  UTILITY: 'UTILITY'
};

export const ITEMS = {
  // ==========================================
  // ARMAS ATIVAS
  // ==========================================
  SWORD: {
    id: 'SWORD',
    category: ITEM_CATEGORIES.WEAPON,
    name: "Lâminas Espirituais",
    icon: "⚔️",
    badge: "Lâminas",
    description: "Espadas astrais velozes arremessadas teleguiadas contra inimigos no alcance.",
    maxLevel: 5,
    evolutionId: 'evolved_sword'
  },
  STAFF: {
    id: 'STAFF',
    category: ITEM_CATEGORIES.WEAPON,
    name: "Cajado da Tormenta",
    icon: "🔮",
    badge: "Cajado",
    description: "Canaliza e dispara esferas concentradas de poder mágico ígneo.",
    maxLevel: 5,
    evolutionId: 'evolved_staff'
  },
  POTION: {
    id: 'POTION',
    category: ITEM_CATEGORIES.WEAPON,
    name: "Frascos Cáusticos",
    icon: "🧪",
    badge: "Poção",
    description: "Bombardeia a rota dos monstros com poças gigantes de ácido corrosivo.",
    maxLevel: 5,
    evolutionId: 'evolved_potion'
  },
  HAMMER: {
    id: 'HAMMER',
    category: ITEM_CATEGORIES.WEAPON,
    name: "Martelo Sagrado",
    icon: "🔨",
    badge: "Martelo",
    description: "Esmaga o solo em 360°, anula projéteis e abre fendas incandescentes frontais.",
    maxLevel: 5,
    evolutionId: 'evolved_hammer'
  },
  AXE: {
    id: 'AXE',
    category: ITEM_CATEGORIES.WEAPON,
    name: "Machado Giratório",
    icon: "🪓",
    badge: "Machado",
    description: "Translada em órbita; o cabo repele inimigos e a ponta desfere corte crítico integral.",
    maxLevel: 4,
    evolutionId: 'evolved_axe'
  },
  ORBITALS: {
    id: 'orbitals',
    category: ITEM_CATEGORIES.WEAPON,
    name: "Bíblias Protetoras",
    icon: "📖",
    badge: "Bíblias",
    description: "Tomos celestiais giram destruindo oponentes em órbita protetora ao redor do herói.",
    maxLevel: 4,
    evolutionId: 'evolved_orbitals'
  },
  AURA: {
    id: 'aura',
    category: ITEM_CATEGORIES.WEAPON,
    name: "Aura Sagrada",
    icon: "✨",
    badge: "Aura",
    description: "Campo sagrado de dano constante em raio radiante ao redor do herói.",
    maxLevel: 5,
    evolutionId: 'evolved_aura'
  },

  // ==========================================
  // PASSIVAS UNIVERSAIS
  // ==========================================
  DMG: {
    id: 'dmg',
    category: ITEM_CATEGORIES.PASSIVE,
    name: "Poder Bruto",
    icon: "⚡",
    badge: "Passiva",
    description: "Aumenta o dano global do herói em +7% cumulativo.",
    maxLevel: 4
  },
  ARMOR: {
    id: 'armor',
    category: ITEM_CATEGORIES.PASSIVE,
    name: "Armadura Rúnica",
    icon: "🛡️",
    badge: "Passiva",
    description: "Reforça a carcaça e eleva o limite de vitalidade máxima em +45 HP.",
    maxLevel: Infinity
  },
  WINGS: {
    id: 'wings',
    category: ITEM_CATEGORIES.PASSIVE,
    name: "Asas do Vento",
    icon: "🪽",
    badge: "Passiva",
    description: "Acelera a locomoção do herói em +0.45 de velocidade base.",
    maxLevel: 5
  },
  FROST_PASSIVE: {
    id: 'frost_passive',
    category: ITEM_CATEGORIES.PASSIVE,
    name: "Golpe Criogênico",
    icon: "❄️",
    badge: "Passiva",
    description: "+15% de chance de congelar e desacelerar monstros atingidos por 2.5s.",
    maxLevel: 4
  },
  HASTE: {
    id: 'haste',
    category: ITEM_CATEGORIES.PASSIVE,
    name: "Fúria Rápida",
    icon: "⌛",
    badge: "Passiva",
    description: "Reduz o tempo de recarga de todas as armas em 12% de forma multiplicativa (teto: 45%).",
    maxLevel: 4
  },
  CRIT: {
    id: 'crit',
    category: ITEM_CATEGORIES.PASSIVE,
    name: "Foco Letal",
    icon: "🎯",
    badge: "Passiva",
    description: "Aumenta as chances (+8%) e o multiplicador de dano crítico (+0.08).",
    maxLevel: 4
  },
  MAGNET: {
    id: 'magnet',
    category: ITEM_CATEGORIES.PASSIVE,
    name: "Ímã Titânico",
    icon: "🧲",
    badge: "Passiva",
    description: "Aumenta o alcance de atração de gemas em +50px de raio.",
    maxLevel: 6
  },

  // ==========================================
  // UTILITÁRIOS
  // ==========================================
  HEAL: {
    id: 'heal',
    category: ITEM_CATEGORIES.UTILITY,
    name: "Poção Alquímica",
    icon: "🧪",
    badge: "Utilidade",
    description: "Recupera imediatamente 65% do HP máximo.",
    maxLevel: Infinity
  }
};

/**
 * Matriz Única de Sinergias e Fusões Lendárias (Single Source of Truth).
 */
export const SYNERGIES = [
  {
    id: 'evolved_sword',
    name: "Lâmina Dimensional",
    fullName: "★ Lâmina Dimensional",
    desc: "Fusão: Lâminas Espirituais + Asas do Vento! Dispara espadas espaciais gigantes com perfuração quádrupla.",
    reqText: "Espadas Nv 4 + Asas",
    weaponId: 'SWORD',
    weaponUpgradeIds: ['sword_extra', 'sword_speed'],
    passiveId: 'wings',
    isReady: (player) => {
      const sword = player.weapons.find(w => w.type === 'SWORD');
      return !!(!player.evolvedSword && sword && sword.count >= 4 && player.hasWingsPassive);
    },
    isEvolved: (player) => !!player.evolvedSword,
    apply: (player) => {
      player.evolvedSword = true;
    }
  },
  {
    id: 'evolved_axe',
    name: "Tempestade de Aço",
    fullName: "★ Tempestade de Aço",
    desc: "Fusão: Machado Giratório + Poder Bruto! 6 machados velozes transladam em anel triturando a arena.",
    reqText: "Machado Nv 3 + Poder",
    weaponId: 'AXE',
    weaponUpgradeIds: ['axe_extra', 'axe_speed', 'axe_radius'],
    passiveId: 'dmg',
    isReady: (player) => {
      return !!(!player.evolvedAxe && (player.axeCount || 1) >= 3 && player.hasPowerPassive);
    },
    isEvolved: (player) => !!player.evolvedAxe,
    apply: (player) => {
      player.evolvedAxe = true;
      player.axeCount = 6;
      player.axeSpinSpeed = (player.axeSpinSpeed || 0.085) + 0.05;
    }
  },
  {
    id: 'evolved_potion',
    name: "Dilúvio Biológico",
    fullName: "★ Dilúvio Biológico",
    desc: "Fusão: Frascos Cáusticos + Golpe Criogênico! 5 frascos concentrados criam uma mega-zona tóxica congelante.",
    reqText: "Poção Nv 3 + Gelo",
    weaponId: 'POTION',
    weaponUpgradeIds: ['potion_volley', 'potion_potency'],
    passiveId: 'frost_passive',
    isReady: (player) => {
      const potion = player.weapons.find(w => w.type === 'POTION');
      return !!(!player.evolvedPotion && potion && potion.count >= 3 && (player.slowChance || 0) >= 0.15);
    },
    isEvolved: (player) => !!player.evolvedPotion,
    apply: (player) => {
      player.evolvedPotion = true;
      const potion = player.weapons.find(w => w.type === 'POTION');
      if (potion) potion.count = 5;
    }
  },
  {
    id: 'evolved_staff',
    name: "Cataclismo Solar",
    fullName: "★ Cataclismo Solar",
    desc: "Fusão: Cajado da Tormenta + Poder Bruto! Supernovas de plasma que perfuram alvos e cobrem o chão de fogo.",
    reqText: "Cajado Nv 3 + Poder",
    weaponId: 'STAFF',
    weaponUpgradeIds: ['staff_projectiles', 'staff_pierce'],
    passiveId: 'dmg',
    isReady: (player) => {
      const staff = player.weapons.find(w => w.type === 'STAFF');
      return !!(!player.evolvedStaff && staff && staff.count >= 3 && player.hasPowerPassive);
    },
    isEvolved: (player) => !!player.evolvedStaff,
    apply: (player) => {
      player.evolvedStaff = true;
      const staff = player.weapons.find(w => w.type === 'STAFF');
      if (staff) staff.count = 4;
    }
  },
  {
    id: 'evolved_hammer',
    name: "Martelo dos Titãs",
    fullName: "★ Martelo dos Titãs",
    desc: "Fusão: Martelo Sagrado + Armadura Rúnica! Terremoto titânico em 360° com fendas incandescentes profundas.",
    reqText: "Martelo Nv 3 + Armadura",
    weaponId: 'HAMMER',
    weaponUpgradeIds: ['hammer_crush', 'hammer_impact'],
    passiveId: 'armor',
    isReady: (player) => {
      const hammer = player.weapons.find(w => w.type === 'HAMMER');
      return !!(!player.evolvedHammer && hammer && hammer.count >= 3 && player.hasArmorPassive);
    },
    isEvolved: (player) => !!player.evolvedHammer,
    apply: (player) => {
      player.evolvedHammer = true;
      const hammer = player.weapons.find(w => w.type === 'HAMMER');
      if (hammer) hammer.count = 4;
    }
  },
  {
    id: 'evolved_aura',
    name: "Santuário Celestial",
    fullName: "★ Santuário Celestial",
    desc: "Fusão: Aura Sagrada + Armadura Rúnica! Supernova radiante que expande o raio e regenera HP.",
    reqText: "Aura Nv 5 + Armadura",
    weaponId: 'AURA',
    weaponUpgradeIds: ['aura'],
    passiveId: 'armor',
    isReady: (player) => {
      return !!(!player.evolvedAura && player.auraLvl >= 5 && player.hasArmorPassive);
    },
    isEvolved: (player) => !!player.evolvedAura,
    apply: (player) => {
      player.evolvedAura = true;
    }
  },
  {
    id: 'evolved_orbitals',
    name: "Vórtice do Apocalipse",
    fullName: "★ Vórtice do Apocalipse",
    desc: "Fusão: Bíblias + Asas do Vento! 6 tomos supersônicos que trituram os inimigos sem intervalo.",
    reqText: "Bíblias Nv 4 + Asas",
    weaponId: 'ORBITALS',
    weaponUpgradeIds: ['orbitals'],
    passiveId: 'wings',
    isReady: (player) => {
      return !!(!player.evolvedOrbitals && player.orbitals >= 4 && player.hasWingsPassive);
    },
    isEvolved: (player) => !!player.evolvedOrbitals,
    apply: (player) => {
      player.evolvedOrbitals = true;
      player.orbitals = 6;
    }
  }
];

/**
 * Retorna as sinergias prontas para fusão no momento para o jogador.
 */
export function getAvailableSynergies(player) {
  const readyList = [];
  for (const syn of SYNERGIES) {
    if (syn.isReady(player)) {
      readyList.push({
        id: syn.id,
        name: syn.fullName,
        desc: syn.desc,
        apply: () => syn.apply(player)
      });
    }
  }
  return readyList;
}

/**
 * Verifica se um id de upgrade de carta é ingrediente de fusão para o inventário atual do jogador.
 */
export function checkIsSynergyIngredient(upgradeId, player) {
  if (!player) return false;

  for (const syn of SYNERGIES) {
    if (syn.isEvolved(player)) continue;

    // Se o upgrade for a passiva da sinergia e o jogador possui a arma correspondente
    if (syn.passiveId === upgradeId) {
      const hasWeapon = (syn.weaponId === 'AXE' && (player.axeCount > 0 || player.weapons.some(w => w.type === 'AXE'))) ||
                        (syn.weaponId === 'ORBITALS' && player.orbitals > 0) ||
                        (syn.weaponId === 'AURA' && player.auraLvl > 0) ||
                        player.weapons.some(w => w.type === syn.weaponId);
      if (hasWeapon) return true;
    }

    // Se o upgrade for um aprimoramento da arma e o jogador já pegou a passiva necessária
    if (syn.weaponUpgradeIds && syn.weaponUpgradeIds.includes(upgradeId)) {
      const hasPassive = (syn.passiveId === 'wings' && player.hasWingsPassive) ||
                         (syn.passiveId === 'dmg' && player.hasPowerPassive) ||
                         (syn.passiveId === 'armor' && player.hasArmorPassive) ||
                         (syn.passiveId === 'frost_passive' && (player.slowChance || 0) >= 0.15);
      if (hasPassive) return true;
    }
  }

  return false;
}

/**
 * Retorna os dados completos para alimentar o Rastreador de Sinergias do Grimório Tático.
 */
export function getSynergyTrackerList(player) {
  return SYNERGIES.map(syn => ({
    name: syn.name,
    req: syn.reqText,
    isReady: syn.isReady(player),
    isEvolved: syn.isEvolved(player)
  }));
}
