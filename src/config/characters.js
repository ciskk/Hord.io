export const CHARACTERS = {
  KNIGHT: {
    name: "Sir Roland",
    title: "O Paladino",
    desc: "Passiva: Reflete 50% do dano de volta aos monstros.<br><b>Poder: Investida Sagrada</b> (Avança rasgando inimigos com imunidade).",
    color: { armor: "#7f8c8d", trim: "#f1c40f", hair: "#bdc3c7", cape: "#8e44ad" },
    stats: { hp: 180, maxHp: 180, speed: 3.2, damage: 32, auraLvl: 1, projectiles: 1, orbitals: 0, magnet: 85, attackCooldown: 36, critChance: 0.15, skillCooldownMax: 420 }
  },
  MAGE: {
    name: "Ignis",
    title: "A Piromante",
    desc: "Passiva: Críticos aplicam queimadura residual.<br><b>Poder: Passo Ígneo</b> (Teleporte curto deixando labaredas de fogo no chão).",
    color: { armor: "#c0392b", trim: "#e67e22", hair: "#f39c12", cape: "#b71540" },
    stats: { hp: 105, maxHp: 105, speed: 3.5, damage: 42, auraLvl: 0, projectiles: 2, orbitals: 0, magnet: 90, attackCooldown: 26, critChance: 0.28, skillCooldownMax: 360 }
  },
  ROGUE: {
    name: "Kael",
    title: "O Andarilho Sombrio",
    desc: "Passiva: 2.5x de dano em oponentes com menos de 35% de vida.<br><b>Poder: Bomba de Fumaça</b> (Invisibilidade total e 100% de crítico por 3.5s).",
    color: { armor: "#27ae60", trim: "#2ecc71", hair: "#1e272e", cape: "#10ac84" },
    stats: { hp: 125, maxHp: 125, speed: 4.3, damage: 28, auraLvl: 0, projectiles: 1, orbitals: 1, magnet: 150, attackCooldown: 34, critChance: 0.22, skillCooldownMax: 450 }
  }
};