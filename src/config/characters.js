export const CHARACTERS = {
  KNIGHT: {
    name: "Sir Roland",
    title: "O Paladino",
    desc: "Passiva: Reduz 20% do dano corpo a corpo e reflete 50% de volta aos monstros.<br><b>Arma Inicial: Martelo Sagrado</b> (Esmaga o solo em 360°, anula projéteis inimigos no raio e abre fendas incandescentes frontais).<br><b>Poder: Investida Sagrada</b> (Avança rasgando inimigos com imunidade).",
    color: { armor: "#7f8c8d", trim: "#f1c40f", hair: "#bdc3c7", cape: "#8e44ad" },
    startingWeapon: "HAMMER",
    stats: { hp: 252, maxHp: 252, speed: 3.2, damage: 46, auraLvl: 1, projectiles: 1, orbitals: 0, magnet: 85, attackCooldown: 36, critChance: 0.15, skillCooldownMax: 420 }
  },
  MAGE: {
    name: "Ignis",
    title: "A Piromante",
    desc: "Passiva: Críticos aplicam queimadura residual.<br><b>Arma Inicial: Cajado da Tormenta</b> (Canaliza e dispara esferas concentradas de poder mágico ígneo).<br><b>Poder: Passo Ígneo</b> (Dash veloz com rastro contínuo de fogo e fantasmas térmicos, atravessando inimigos com imunidade).",
    color: { armor: "#c0392b", trim: "#e67e22", hair: "#f39c12", cape: "#b71540" },
    startingWeapon: "STAFF",
    stats: { hp: 147, maxHp: 147, speed: 3.5, damage: 36, auraLvl: 0, projectiles: 1, orbitals: 0, magnet: 90, attackCooldown: 28, critChance: 0.28, skillCooldownMax: 360 }
  },
  ROGUE: {
    name: "Kael",
    title: "O Andarilho Sombrio",
    desc: "Passiva: 1.5x de dano em oponentes com menos de 35% de vida (1.15x contra chefes).<br><b>Arma Inicial: Lâminas Espirituais</b> (Espadas astrais velozes arremessadas contra inimigos no alcance).<br><b>Poder: Bomba de Fumaça</b> (Invisibilidade contra inimigos comuns e 100% de crítico por 2.0s).",
    color: { armor: "#27ae60", trim: "#2ecc71", hair: "#1e272e", cape: "#10ac84" },
    startingWeapon: "SWORD",
    stats: { hp: 175, maxHp: 175, speed: 3.7, damage: 35, auraLvl: 0, projectiles: 1, orbitals: 1, magnet: 150, attackCooldown: 24, critChance: 0.24, skillCooldownMax: 450 }
  },
  BARBARIAN: {
    name: "Kragdor",
    title: "O Bárbaro Furioso",
    desc: "Passiva: Recupera 1 HP a cada 18 inimigos atingidos pelo machado orbital.<br><b>Arma Inicial: Machado Giratório</b> (Translada com o cabo voltado ao herói, triturando monstros e cortando projéteis inimigos).<br><b>Poder: Rugido Ancestral</b> (Atordoa inimigos por 1.8s, vaporiza projéteis em área e entra em frenesi dobrando a velocidade do turbilhão).",
    color: { armor: "#d35400", trim: "#e67e22", hair: "#d35400", cape: "#7f1d1d" },
    startingWeapon: "AXE",
    stats: { hp: 308, maxHp: 308, speed: 3.1, damage: 54, auraLvl: 0, projectiles: 1, orbitals: 0, magnet: 95, attackCooldown: 38, critChance: 0.18, skillCooldownMax: 480 }
  },
  ALCHEMIST: {
    name: "Valéria",
    title: "A Alquimista Cáustica",
    desc: "Passiva: Poças ácidas duram mais e causam lentidão.<br><b>Arma Inicial: Frascos Cáusticos</b> (Super alcance com predição de movimento; bombardeia com antecedência a rota do alvo com poças gigantes concentradas no mesmo local).<br><b>Poder: Reagente Volátil</b> (Explosão radial de 6 frascos corrosivos).",
    color: { armor: "#16a085", trim: "#1abc9c", hair: "#8e44ad", cape: "#27ae60" },
    startingWeapon: "POTION",
    stats: { hp: 182, maxHp: 182, speed: 3.4, damage: 43, auraLvl: 0, projectiles: 1, orbitals: 0, magnet: 120, attackCooldown: 34, critChance: 0.20, skillCooldownMax: 400 }
  }
};