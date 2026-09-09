import { player } from '../entities/player.js';

export const upgradesPool = [
  {
    id: 'proj',
    title: "Espada Arcana",
    rarity: "card-common",
    badge: "Comum",
    desc: "+1 Projétil disparado por salva",
    stat: "+1 Projétil",
    apply: () => player.projectiles += 1,
    isAvailable: () => player.projectiles < 5 && !player.evolvedSword
  },
  {
    id: 'dmg',
    title: "Poder Bruto",
    rarity: "card-common",
    badge: "Comum",
    desc: "Aumenta o dano básico em +15 pontos",
    stat: "+15 Dano Físico",
    apply: () => { player.damage += 15; player.hasPowerPassive = true; },
    isAvailable: () => true
  },
  {
    id: 'haste',
    title: "Fúria Rápida",
    rarity: "card-rare",
    badge: "Raro",
    desc: "Cadência de ataque aumentada em +22%",
    stat: "-5 Tempo Recarga",
    apply: () => player.attackCooldown = Math.max(7, player.attackCooldown - 5),
    isAvailable: () => player.attackCooldown > 7
  },
  {
    id: 'wings',
    title: "Asas do Vento",
    rarity: "card-common",
    badge: "Comum",
    desc: "Acelera a locomoção do herói",
    stat: "+0.45 Velocidade",
    apply: () => { player.baseSpeed += 0.45; player.speed = player.baseSpeed; player.hasWingsPassive = true; },
    isAvailable: () => player.baseSpeed < 6.5
  },
  {
    id: 'crit',
    title: "Foco Letal",
    rarity: "card-rare",
    badge: "Raro",
    desc: "Aumenta as chances e o multiplicador de crítico",
    stat: "+10% Chance Crítica",
    apply: () => { player.critChance += 0.10; player.critMult += 0.25; },
    isAvailable: () => player.critChance < 0.65
  },
  {
    id: 'magnet',
    title: "Ímã Titânico",
    rarity: "card-common",
    badge: "Comum",
    desc: "Aumenta o alcance de atração de gemas",
    stat: "+50 Raio de Atração",
    apply: () => player.magnet += 50,
    isAvailable: () => player.magnet < 380
  },
  {
    id: 'aura',
    title: "Aura Sagrada",
    rarity: "card-rare",
    badge: "Raro",
    desc: "Campo de dano constante ao redor do herói",
    stat: "+1 Nível de Aura",
    apply: () => player.auraLvl += 1,
    isAvailable: () => player.auraLvl < 5 && !player.evolvedAura
  },
  {
    id: 'orbitals',
    title: "Bíblias Protetoras",
    rarity: "card-rare",
    badge: "Raro",
    desc: "Tomos celestiais giram destruindo oponentes",
    stat: "+1 Tomo Orbital",
    apply: () => player.orbitals += 1,
    isAvailable: () => player.orbitals < 4 && !player.evolvedOrbitals
  },
  {
    id: 'armor',
    title: "Armadura Rúnica",
    rarity: "card-common",
    badge: "Comum",
    desc: "Reforça a carcaça e eleva o limite de vitalidade",
    stat: "+45 HP Máximo",
    apply: () => { player.maxHp += 45; player.hp += 45; player.hasArmorPassive = true; },
    isAvailable: () => true
  },
  {
    id: 'heal',
    title: "Poção Alquímica",
    rarity: "card-common",
    badge: "Comum",
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
  if (!player.evolvedSword && player.projectiles >= 5 && player.hasPowerPassive) {
    evolutions.push({
      name: "★ Lâmina Dimensional",
      desc: "Fusão: Espada Arcana + Poder Bruto! Dispara lâminas espaciais gigantes com perfuração quádrupla.",
      apply: () => { player.evolvedSword = true; }
    });
  }
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