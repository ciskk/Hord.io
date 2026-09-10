import { player } from '../entities/player.js';

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
      if (w) w.damageMult += 0.30;
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
    },
    isAvailable: () => player.weapons.some(w => w.type === 'POTION') && (player.weapons.find(wp => wp.type === 'POTION')?.count || 1) < 5
  },
  {
    id: 'potion_potency',
    title: "Superposição Cáustica",
    rarity: "card-rare",
    badge: "Poção",
    desc: "Aumenta em +35% o dano corrosivo e a área de contaminação das poças ácidas",
    stat: "+35% Dano & Área",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'POTION');
      if (w) w.damageMult += 0.35;
    },
    isAvailable: () => player.weapons.some(w => w.type === 'POTION')
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
    },
    isAvailable: () => player.weapons.some(w => w.type === 'STAFF') && (player.weapons.find(wp => wp.type === 'STAFF')?.count || 1) < 5
  },
  {
    id: 'staff_pierce',
    title: "Poder da Fênix",
    rarity: "card-rare",
    badge: "Cajado",
    desc: "As esferas do cajado perfuram +2 inimigos e ampliam o rastro de queimadura",
    stat: "+2 Perfuração Arcana",
    apply: () => {
      player.staffPierceBonus = (player.staffPierceBonus || 0) + 2;
      const w = player.weapons.find(wp => wp.type === 'STAFF');
      if (w) w.damageMult += 0.20;
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
    },
    isAvailable: () => player.weapons.some(w => w.type === 'SWORD') && (player.weapons.find(wp => wp.type === 'SWORD')?.count || 1) < 5 && !player.evolvedSword
  },
  {
    id: 'sword_speed',
    title: "Gume Astral",
    rarity: "card-rare",
    badge: "Lâminas",
    desc: "+30% de velocidade de voo e dano letal para as espadas teleguiadas",
    stat: "+30% Voo e Dano",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'SWORD');
      if (w) w.damageMult += 0.30;
    },
    isAvailable: () => player.weapons.some(w => w.type === 'SWORD')
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
    },
    isAvailable: () => player.weapons.some(w => w.type === 'HAMMER') && (player.weapons.find(wp => wp.type === 'HAMMER')?.count || 1) < 4
  },
  {
    id: 'hammer_impact',
    title: "Golpe Demolidor",
    rarity: "card-rare",
    badge: "Martelo",
    desc: "O martelo golpeia com +45% de dano de esmagamento no epicentro e fissuras frontais",
    stat: "+45% Dano Esmagador",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'HAMMER');
      if (w) w.damageMult += 0.45;
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
    },
    isAvailable: () => (player.slowChance || 0) < 0.70
  },
  {
    id: 'dmg',
    title: "Poder Bruto",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Aumenta o dano global do herói em +15%",
    stat: "+15% Dano Global",
    apply: () => { 
      player.damage = Math.round(player.damage * 1.15); 
      player.hasPowerPassive = true; 
    },
    isAvailable: () => true
  },
  {
    id: 'haste',
    title: "Fúria Rápida",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Cadência de ataque aumentada em +22%",
    stat: "-5 Recarga de Armas",
    apply: () => {
      player.attackCooldown = Math.max(8, player.attackCooldown - 5);
      player.weapons.forEach(w => {
        w.cooldown = Math.max(8, w.cooldown - 4);
      });
    },
    isAvailable: () => player.attackCooldown > 8
  },
  {
    id: 'wings',
    title: "Asas do Vento",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Acelera a locomoção do herói",
    stat: "+0.45 Velocidade",
    apply: () => { player.baseSpeed += 0.45; player.speed = player.baseSpeed; player.hasWingsPassive = true; },
    isAvailable: () => player.baseSpeed < 6.5
  },
  {
    id: 'crit',
    title: "Foco Letal",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Aumenta as chances e o multiplicador de crítico",
    stat: "+10% Chance Crítica",
    apply: () => { player.critChance += 0.10; player.critMult += 0.25; },
    isAvailable: () => player.critChance < 0.65
  },
  {
    id: 'magnet',
    title: "Ímã Titânico",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Aumenta o alcance de atração de gemas",
    stat: "+50 Raio de Atração",
    apply: () => player.magnet += 50,
    isAvailable: () => player.magnet < 380
  },
  {
    id: 'aura',
    title: "Aura Sagrada",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Campo de dano constante ao redor do herói",
    stat: "+1 Nível de Aura",
    apply: () => player.auraLvl += 1,
    isAvailable: () => player.auraLvl < 5 && !player.evolvedAura
  },
  {
    id: 'orbitals',
    title: "Bíblias Protetoras",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Tomos celestiais giram destruindo oponentes",
    stat: "+1 Tomo Orbital",
    apply: () => player.orbitals += 1,
    isAvailable: () => player.orbitals < 4 && !player.evolvedOrbitals
  },
  {
    id: 'armor',
    title: "Armadura Rúnica",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Reforça a carcaça e eleva o limite de vitalidade",
    stat: "+45 HP Máximo",
    apply: () => { player.maxHp += 45; player.hp += 45; player.hasArmorPassive = true; },
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
  const available = upgradesPool.filter(opt => opt.isAvailable());
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  return available.slice(0, count);
}

export function checkSynergies() {
  const evolutions = [];

  // Sinergia Kael (Espada + Asas do Vento)
  const sword = player.weapons.find(w => w.type === 'SWORD');
  if (!player.evolvedSword && sword && sword.count >= 4 && player.hasWingsPassive) {
    evolutions.push({
      name: "★ Lâmina Dimensional",
      desc: "Fusão: Lâminas Espirituais + Asas do Vento! Dispara espadas espaciais gigantes com perfuração quádrupla.",
      apply: () => { player.evolvedSword = true; }
    });
  }

  // Sinergia Kragdor (Machado + Poder Bruto)
  if (!player.evolvedAxe && player.axeCount >= 3 && player.hasPowerPassive) {
    evolutions.push({
      name: "★ Tempestade de Aço",
      desc: "Fusão: Machado Giratório + Poder Bruto! 6 machados velozes transladam em anel triturando a arena.",
      apply: () => { player.evolvedAxe = true; player.axeCount = 6; player.axeSpinSpeed += 0.05; }
    });
  }

  // Sinergia Valéria (Poção + Golpe Criogênico)
  const potion = player.weapons.find(w => w.type === 'POTION');
  if (!player.evolvedPotion && potion && potion.count >= 3 && (player.slowChance || 0) >= 0.15) {
    evolutions.push({
      name: "★ Dilúvio Biológico",
      desc: "Fusão: Frascos Cáusticos + Golpe Criogênico! 5 frascos concentrados criam uma mega-zona tóxica congelante.",
      apply: () => { player.evolvedPotion = true; potion.count = 5; }
    });
  }

  // Sinergia Ignis (Cajado + Poder Bruto)
  const staff = player.weapons.find(w => w.type === 'STAFF');
  if (!player.evolvedStaff && staff && staff.count >= 3 && player.hasPowerPassive) {
    evolutions.push({
      name: "★ Cataclismo Solar",
      desc: "Fusão: Cajado da Tormenta + Poder Bruto! Supernovas de plasma que perfuram alvos e cobrem o chão de fogo.",
      apply: () => { player.evolvedStaff = true; staff.count = 4; }
    });
  }

  // Sinergia Sir Roland (Martelo + Armadura Rúnica)
  const hammer = player.weapons.find(w => w.type === 'HAMMER');
  if (!player.evolvedHammer && hammer && hammer.count >= 3 && player.hasArmorPassive) {
    evolutions.push({
      name: "★ Martelo dos Titãs",
      desc: "Fusão: Martelo Sagrado + Armadura Rúnica! Terremoto titânico em 360° com fendas incandescentes profundas.",
      apply: () => { player.evolvedHammer = true; hammer.count = 4; }
    });
  }

  // Sinergias Clássicas de Aura e Orbitais
  if (!player.evolvedAura && player.auraLvl >= 5 && player.hasArmorPassive) {
    evolutions.push({
      name: "★ Santuário Celestial",
      desc: "Fusão: Aura Sagrada + Armadura Rúnica! Supernova radiante que expande o raio e regenera HP.",
      apply: () => { player.evolvedAura = true; }
    });
  }
  if (!player.evolvedOrbitals && player.orbitals >= 4 && player.hasWingsPassive) {
    evolutions.push({
      name: "★ Vórtice do Apocalipse",
      desc: "Fusão: Bíblias + Asas do Vento! 6 tomos supersônicos que trituram os inimigos sem intervalo.",
      apply: () => { player.evolvedOrbitals = true; player.orbitals = 6; }
    });
  }

  return evolutions;
}