export const CHARACTERS = {
  KNIGHT: {
    name: "Sir Roland",
    title: "O Paladino",
    role: "Tanque Retaliador",
    difficulty: 1,
    lore: "Um cavaleiro consagrado nas criptas imperiais, cuja armadura abençoada repele a escuridão e castiga todo algoz que ousa feri-lo.",
    passive: {
      name: "Égide da Retaliação",
      desc: "Reduz 20% do dano corpo a corpo recebido e reflete 50% do impacto de volta aos agressores."
    },
    weapon: {
      name: "Martelo Sagrado",
      type: "Impacto Sagrado 360°",
      desc: "Esmaga o solo em rotação total, anula projéteis inimigos no raio e abre fendas incandescentes à frente."
    },
    skill: {
      name: "Investida Sagrada",
      cooldown: "7s",
      desc: "Avança em disparada rasgando hordas inteiras sob imunidade total e estilhaçando defesas."
    },
    desc: "Passiva: Reduz 20% do dano corpo a corpo e reflete 50% de volta aos monstros.<br><b>Arma Inicial: Martelo Sagrado</b> (Esmaga o solo em 360°, anula projéteis inimigos no raio e abre fendas incandescentes frontais).<br><b>Poder: Investida Sagrada</b> (Avança rasgando inimigos com imunidade).",
    color: { 
      armor: "#718093", 
      armorLight: "#dcdde1", 
      armorDark: "#2f3640", 
      trim: "#fbc531", 
      trimDark: "#c79810", 
      hair: "#bdc3c7", 
      cape: "#481b6d", 
      capeInner: "#2c1045", 
      plume: "#8e44ad", 
      tabard: "#f5f6fa", 
      tabardCross: "#c23616", 
      eyeGlow: "#00d2d3",
      hammerSteel: "#57606f",
      hammerGold: "#f1c40f",
      hammerWood: "#3d271d"
    },
    startingWeapon: "HAMMER",
    stats: { 
      hp: 126, 
      maxHp: 126, 
      speed: 3.2, 
      damage: 46, 
      auraLvl: 1, 
      projectiles: 1, 
      orbitals: 0, 
      magnet: 85, 
      attackCooldown: 36, 
      critChance: 0.15, 
      skillCooldownMax: 420,
      knockbackReceived: 0.5,
      knockbackDealt: 1.5
    }
  },

  MAGE: {
    name: "Ignis",
    title: "A Piromante",
    role: "Artilharia Ígnea",
    difficulty: 2,
    lore: "Guardiã da chama viva das cinzas celestes. Seus encantamentos convertem a fúria do fogo em desintegração em massa.",
    passive: {
      name: "Combustão Residual",
      desc: "Todo acerto crítico incendeia os alvos, aplicando queimadura contínua que drena vida ao longo do tempo."
    },
    weapon: {
      name: "Cajado da Tormenta",
      type: "Projéteis Arcanos Rápidos",
      desc: "Canaliza e dispara esferas concentradas de puro plasma ígneo com alta taxa de cadência e impacto."
    },
    skill: {
      name: "Passo Ígneo",
      cooldown: "6s",
      desc: "Teletransporte térmico em alta velocidade deixando um rastro de magma e asas de fogo com imunidade."
    },
    desc: "Passiva: Críticos aplicam queimadura residual.<br><b>Arma Inicial: Cajado da Tormenta</b> (Canaliza e dispara esferas concentradas de poder mágico ígneo).<br><b>Poder: Passo Ígneo</b> (Dash veloz com rastro contínuo de fogo e fantasmas térmicos, atravessando inimigos com imunidade).",
    color: { 
      robe: "#541212", 
      robeDark: "#220808", 
      corset: "#1c1116", 
      trim: "#d35400", 
      trimGold: "#f1c40f", 
      cape: "#80121d", 
      capeInner: "#e74c3c", 
      sash: "#d35400", 
      eyeGlow: "#ffffff", 
      staffWood: "#2c1e18", 
      staffGold: "#f1c40f", 
      crystal: "#ff7675" 
    },
    startingWeapon: "STAFF",
    stats: { 
      hp: 73.5, 
      maxHp: 73.5, 
      speed: 3.5, 
      damage: 36, 
      auraLvl: 0, 
      projectiles: 1, 
      orbitals: 0, 
      magnet: 90, 
      attackCooldown: 28, 
      critChance: 0.28, 
      skillCooldownMax: 360,
      knockbackReceived: 1.0,
      knockbackDealt: 4.0
    }
  },

  ROGUE: {
    name: "Kael",
    title: "O Andarilho Sombrio",
    role: "Assassino Crítico",
    difficulty: 3,
    lore: "Um espectro letal que vagueia entre as dimensões do éter. Ele caça os feridos e jamais é visto antes do golpe fatal.",
    passive: {
      name: "Execução Espectral",
      desc: "Desfere 2.0x de dano em oponentes com menos de 35% de vida (1.5x contra chefes e elites)."
    },
    weapon: {
      name: "Lâminas Espirituais",
      type: "Lâminas Arremessadas em Arco",
      desc: "Projeta espadas astrais velozes de corte cirúrgico que perfuram linhas inimigas com alta taxa de acerto."
    },
    skill: {
      name: "Manto de Fumaça",
      cooldown: "7.5s",
      desc: "Invisibilidade instantânea com velocidade dobrada, empurrão de choque e 100% de chance crítica por 2.0s."
    },
    desc: "Passiva: 2.0x de dano em oponentes com menos de 35% de vida (1.5x contra chefes).<br><b>Arma Inicial: Lâminas Espirituais</b> (Espadas astrais velozes arremessadas contra inimigos no alcance).<br><b>Poder: Bomba de Fumaça</b> (Invisibilidade com dobro de velocidade, transposição de massa com empurrão atordoante e 100% de crítico por 2.0s).",
    color: { 
      tunic: "#1e272e", 
      tunicDark: "#0f1417", 
      leatherStraps: "#2d3436", 
      buckles: "#bdc3c7", 
      hood: "#182c25", 
      cape: "#0e4438", 
      capeInner: "#07261f", 
      capeTrim: "#16a085", 
      shadowFace: "#0a0d0e", 
      eyeGlow: "#00cec9", 
      bandages: "#7f8c8d", 
      scabbard: "#1e272e", 
      bladeSteel: "#81ecec", 
      bladeGlow: "#00cec9", 
      hiltGold: "#f1c40f" 
    },
    startingWeapon: "SWORD",
    stats: { 
      hp: 87.5, 
      maxHp: 87.5, 
      speed: 3.7, 
      damage: 35, 
      auraLvl: 0, 
      projectiles: 1, 
      orbitals: 1, 
      magnet: 150, 
      attackCooldown: 24, 
      critChance: 0.24, 
      skillCooldownMax: 450,
      knockbackReceived: 1.0,
      knockbackDealt: 4.0
    }
  },

  BARBARIAN: {
    name: "Kragdor",
    title: "O Bárbaro Furioso",
    role: "Colosso Berserker",
    difficulty: 1,
    lore: "Nascido nos cumes gelados dos reinos nórdicos, Kragdor canaliza a fúria dos ancestrais para transformar ferimentos em vitalidade pura.",
    passive: {
      name: "Sede de Sangue",
      desc: "Golpes da ponta do machado em Chefes/Elites curam 0.5% do HP máximo (cd 0.6s). Em hordas, regenera 1 HP a cada 18 abates."
    },
    weapon: {
      name: "Machado Giratório",
      type: "Órbita Perfeita em Turbilhão",
      desc: "Translada em órbita contínua ao redor do herói; o cabo repele inimigos e a ponta desfere corte crítico devastador."
    },
    skill: {
      name: "Rugido Ancestral",
      cooldown: "8s",
      desc: "Brado avassalador que atordoa a área, vaporiza projéteis inimigos e dobra a rotação do turbilhão em frenesi."
    },
    desc: "Passiva: Golpes da ponta da lâmina contra Chefes e Elites curam 0.5% do HP máximo (recarga de 0.6s). Contra hordas comuns, recupera 1 HP a cada 18 acertos.<br><b>Arma Inicial: Machado Giratório</b> (Translada em órbita; o cabo repele inimigos e a ponta desfere corte crítico integral).<br><b>Poder: Rugido Ancestral</b> (Atordoa inimigos em área por 0.6s, vaporiza projéteis e dobra a rotação do turbilhão em frenesi).",
    color: { 
      armor: "#2c1e18", 
      trim: "#d35400", 
      hair: "#d35400", 
      cape: "#7f1d1d", 
      skin: "#c67846", 
      tattoo: "#f39c12", 
      bone: "#e2d7c5", 
      axeSteel: "#7f8c8d", 
      axeEdge: "#f1c40f", 
      axeWood: "#3d271d" 
    },
    startingWeapon: "AXE",
    stats: { 
      hp: 154, 
      maxHp: 154, 
      speed: 3.1, 
      damage: 54, 
      auraLvl: 0, 
      projectiles: 1, 
      orbitals: 0, 
      magnet: 95, 
      attackCooldown: 38, 
      critChance: 0.18, 
      skillCooldownMax: 480,
      knockbackReceived: 0.5,
      knockbackDealt: 1.5
    }
  },

  ALCHEMIST: {
    name: "Valéria",
    title: "A Alquimista Cáustica",
    role: "Controle & Corrosão",
    difficulty: 2,
    lore: "Erudita dos venenos arcanos e ácidos mutagênicos. Domina a criação de compostos voláteis que derretem armaduras e desaceleram as feras.",
    passive: {
      name: "Miasma Pegajoso",
      desc: "Poças ácidas permanecem mais tempo ativas no solo e infligem lentidão severa aos inimigos que as atravessam."
    },
    weapon: {
      name: "Frascos Cáusticos",
      type: "Bombardeio Químico em Área",
      desc: "Lança frascos corrosivos a longa distância prevendo a rota dos alvos e criando zonas contínuas de dano ácido."
    },
    skill: {
      name: "Reagente Volátil",
      cooldown: "6.5s",
      desc: "Detona uma explosão radial de 6 frascos corrosivos simultâneos banhando todo o entorno em vitríolo letal."
    },
    desc: "Passiva: Poças ácidas duram mais e causam lentidão.<br><b>Arma Inicial: Frascos Cáusticos</b> (Super alcance com predição de movimento; bombardeia com antecedência a rota do alvo com poças gigantes concentradas no mesmo local).<br><b>Poder: Reagente Volátil</b> (Explosão radial de 6 frascos corrosivos).",
    color: { 
      armor: "#22312b", 
      trim: "#d4a373", 
      hair: "#3a1f47", 
      cape: "#2ecc71", 
      leather: "#2c1e18", 
      lens: "#00ffcc" 
    },
    startingWeapon: "POTION",
    stats: { 
      hp: 91, 
      maxHp: 91, 
      speed: 3.4, 
      damage: 43, 
      auraLvl: 0, 
      projectiles: 1, 
      orbitals: 0, 
      magnet: 120, 
      attackCooldown: 34, 
      critChance: 0.20, 
      skillCooldownMax: 400,
      knockbackReceived: 1.0,
      knockbackDealt: 4.0
    }
  }
};
