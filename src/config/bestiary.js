/**
 * src/config/bestiary.js
 * Códice do Bestiário das Trevas, Estatísticas de Abates e Micro-Lore Gótica.
 */
import { playSfx, triggerHaptic } from '../core/audio.js';

const BESTIARY_STORAGE_KEY = 'hord_bestiary_v1';

/**
 * Registro Canônico de todas as 30 Criaturas do Hord.io
 */
export const BESTIARY_ENTRIES = [
  // ==========================================
  // --- MONSTROS DA HORDA COMUM (10) ---
  // ==========================================
  {
    id: 'ZOMBIE',
    name: 'Zumbi Operário',
    title: 'Carniçal das Catacumbas',
    category: 'HORDE',
    threat: 1,
    color: '#2ecc71',
    hp: 175,
    damage: 19,
    speed: 'Lento (1.38)',
    role: 'Enxame Melee',
    microLore: 'Antigos servos e mineradores das profundezas imperiais que sucumbiram à praga de éter negro. Seus corpos ressequidos não sentem dor e continuam marchando eternamente sob o comando do Abismo.',
    tactics: 'Facilmente contornados individualmente, mas letais quando empilhados em corredores estreitos. Armas de corte circular e empurrão mantêm suas massas sob controle.',
    quotes: ['*gemidos cavernosos ecoam no concreto*', '*passos arrastados se aproximam no escuro*']
  },
  {
    id: 'BAT',
    name: 'Morcego Carmesim',
    title: 'Cria Vampírica dos Céus',
    category: 'HORDE',
    threat: 2,
    color: '#ff4757',
    hp: 73,
    damage: 14,
    speed: 'Muito Rápido (3.25)',
    role: 'Flanqueador Aéreo',
    microLore: 'Quimeras aladas geradas nas cubas de sangue coagulado sob o castelo do Lorde Vampírico. Caçam pelo calor vital e mergulham em velocidades estarrecedoras para sangrar os vivos.',
    tactics: 'Possuem baixa vida, mas sua alta velocidade ultrapassa a passada do herói. Use anéis defensivos como Orbitais ou auras circulares para desintegrá-los antes do impacto.',
    quotes: ['*guincho supersônico fura os tímpanos*', '*asas coriáceas cortam a névoa*']
  },
  {
    id: 'GOLEM',
    name: 'Golem de Concreto',
    title: 'Monólito de Almas Aprisionadas',
    category: 'HORDE',
    threat: 3,
    color: '#747d8c',
    hp: 686,
    damage: 43,
    speed: 'Pesado (0.82)',
    role: 'Tanque Devastador',
    microLore: 'Construções titânicas feitas de calcário imperial e ferragens retorcidas, animadas por centenas de almas desesperadas presas em uma agonia indescritível.',
    tactics: 'Seus golpes causam dano estrondoso capaz de esmagar armaduras. Nunca tente trocas melee sem esquiva ativa; explore sua lentidão atacando à distância.',
    quotes: ['*o chão treme com o peso do concreto*', '*ossos triturados gemem dentro do bloco*']
  },
  {
    id: 'STALKER',
    name: 'Assassino Espectral',
    title: 'Predador das Dimensões Etéreas',
    category: 'HORDE',
    threat: 3,
    color: '#9b59b6',
    hp: 189,
    damage: 26,
    speed: 'Rápido / Bote (1.35)',
    role: 'Emboscador de Arranque',
    microLore: 'Assassinos que venderam suas almas a divindades do éter. Eles viajam através das frestas da realidade e só se materializam no instante exato da lâmina nas costas.',
    tactics: 'Fique atento ao clarão roxo e ao silêncio que precede o seu bote relâmpago. Desvie em ângulo perpendicular para fazê-los errar o salto letal.',
    quotes: ['“Tua sombra já é minha...”', '*farfalhar etéreo desaparece no vazio*']
  },
  {
    id: 'EXPLODER',
    name: 'Carniçal Ígneo',
    title: 'Pavio Humano do Miasma',
    category: 'HORDE',
    threat: 3,
    color: '#e67e22',
    hp: 147,
    damage: 30,
    speed: 'Veloz / Fúria (2.1)',
    role: 'Kamikaze Incandescente',
    microLore: 'Cobaias alimentadas à força com óleo de enxofre ardente. Seus corações fervem a temperaturas vulcânicas até que a carcaça rompa em uma erupção apocalíptica.',
    tactics: 'Ao notar o círculo de aviso ou o ruído de ignição, recue imediatamente. Abater um exploder de longe pode desencadear reações em cadeia devastadoras contra outros monstros.',
    quotes: ['“QUEIME CONOSCO!”', '*chiado histérico de pavio aceso*']
  },
  {
    id: 'NECRO',
    name: 'Cultista das Sombras',
    title: 'Arquivista do Vácuo Profano',
    category: 'HORDE',
    threat: 4,
    color: '#34495e',
    hp: 294,
    damage: 26,
    speed: 'Cadenciado (0.95)',
    role: 'Invocador de Prole',
    microLore: 'Membros da nobreza que abraçaram o culto do Soberano do Abismo. Entoam ladainhas proibidas que arrancam os mortos da terra enquanto permanecem na retaguarda.',
    tactics: 'Prioridade tática absoluta de eliminação. Se deixados vivos, povoarão a arena com incontáveis zumbis secundários até sobrecarregar seu posicionamento.',
    quotes: ['“Erguei-vos, ossos sem descanso!”', '*cântico gutural faz o solo pulsar*']
  },
  {
    id: 'SHOOTER',
    name: 'Autômato Artilheiro',
    title: 'Sentinela do Império Decaído',
    category: 'HORDE',
    threat: 3,
    color: '#0984e3',
    hp: 231,
    damage: 22,
    speed: 'Tático (1.1)',
    role: 'Artilharia Balística',
    microLore: 'Engenhocas mecânicas imperiais movidas a núcleo de plasma frio. Continuam executando suas diretrizes de purga balística séculos após a queda de seus criadores.',
    tactics: 'Disparam rajadas lineares contínuas. Mantenha movimento circular ao redor do autômato para que todos os projéteis passem raspando sem acertá-lo.',
    quotes: ['*engrenagens rangem em cálculo balístico*', '*disparo mecânico sela o ar gélido*']
  },
  {
    id: 'SHIELDED',
    name: 'Guardião Blindado',
    title: 'Bastião da Guarda Sepulcral',
    category: 'HORDE',
    threat: 4,
    color: '#b2bec3',
    hp: 406,
    damage: 31,
    speed: 'Inabalável (1.0)',
    role: 'Bloqueador Frontal',
    microLore: 'Cavaleiros que juraram defender as criptas ancestrais até o fim dos tempos. Seus broquéis encantados com aço frio desviam quase todo impacto frontal.',
    tactics: 'Ataques desferidos contra a frente do escudo sofrem redução maciça de 75% no dano. Flanqueie-o ou use armas de área 360° para atingir suas costas vulneráveis.',
    quotes: ['*impacto metálico ecoa sem romper a guarda*', '“Nenhum passo além!”']
  },
  {
    id: 'SPLITTER',
    name: 'Parasita Divisor',
    title: 'Verme Quântico da Podridão',
    category: 'HORDE',
    threat: 3,
    color: '#00d2d3',
    hp: 217,
    damage: 22,
    speed: 'Ágil (1.4)',
    role: 'Multiplicador de Horda',
    microLore: 'Entidades gelatinosas parasitárias originárias dos esgotos profundos da cidadela. Ao sofrerem trauma físico fatal, sua massa se cinde em duas células vivas e vorazes.',
    tactics: 'Abater um parasita cria imediatamente duas crias velozes. Prepare-se para um contra-ataque imediato com ataques de fogo ou perfuração sequencial.',
    quotes: ['*estalo de tecido visceral se dividindo*', '*chiado viscoso rasteja sobre as lajes*']
  },
  {
    id: 'SPLITTER_MINI',
    name: 'Parasita Célula',
    title: 'Célula Voraz de Fragmento',
    category: 'HORDE',
    threat: 2,
    color: '#48dbfb',
    hp: 84,
    damage: 14,
    speed: 'Frenético (2.2)',
    role: 'Enxame Secundário',
    microLore: 'O produto residual da divisão celular aberrante. Embora frágeis, movem-se com fúria cega, desesperados para consumir matéria orgânica e regenerar o hospedeiro original.',
    tactics: 'Elimine-os imediatamente com martelos, auras ou lâminas astrais antes que comecem a cercar seus pontos de fuga.',
    quotes: ['*frenesi celular busca a jugular*']
  },

  // ==========================================
  // --- ELITES & MINI-CHEFES DA ARENA (16) ---
  // ==========================================
  {
    id: 'BLOOD_GARGOYLE',
    name: 'Gárgula de Sangue',
    title: 'Vanguarda Alada da Cripta',
    category: 'MINIBOSS',
    threat: 4,
    color: '#c0392b',
    hp: 588,
    damage: 26,
    speed: 'Investida Fulminante (2.4)',
    role: 'Elite Voador de Rasante',
    microLore: 'Monstruosidade esculpida em granito vermelho e banhada em sangue virgem. Paira sobre a névoa e mergulha em rasante destruidor antes que a vítima possa respirar.',
    tactics: 'Aviso visual no solo indica a trajetória da investida. Não corra em linha reta; dê um passo lateral e castigue seus flancos durante a frenagem.',
    quotes: ['“Teu sangue consagrará nossa pedra!”', '*rugido petrificado corta as torres*']
  },
  {
    id: 'ZOMBIE_ALPHA',
    name: 'Zumbi Alfa',
    title: 'Carniçal Primogênito',
    category: 'MINIBOSS',
    threat: 4,
    color: '#27ae60',
    hp: 952,
    damage: 30,
    speed: 'Pesado (1.1)',
    role: 'Líder da Prole Cadavérica',
    microLore: 'O primeiro a ser sepultado durante o surto do miasma. Seu crânio suporta pregos rúnicos que transmitem feromônios capazes de enfurecer qualquer morto nas cercanias.',
    tactics: 'Atrai hordas ao seu redor e suporta punições severas. Mantenha combate móvel enquanto drena sua vida.',
    quotes: ['“A carne... clama por carne fresca!”']
  },
  {
    id: 'PHALANX_LEADER',
    name: 'Centurião da Guarda',
    title: 'Comandante da Legião Sepulcral',
    category: 'MINIBOSS',
    threat: 4,
    color: '#7f8c8d',
    hp: 1190,
    damage: 34,
    speed: 'Avanço de Escudo (1.2)',
    role: 'Fortaleza com Escudo Torre',
    microLore: 'Veterano imortal das guerras de unificação imperial. Seu escudo torre de bronze negro desvia 85% dos ataques frontais e quebra a postura de quem ousa enfrentá-lo.',
    tactics: 'Ataques frontais são inúteis. Congele-o, atraia seu golpe de investida e explore suas costas desprotegidas.',
    quotes: ['“Pelo Império das Sombras! Romper fileiras!”']
  },
  {
    id: 'SEISMIC_SMASHER',
    name: 'Demolidor Sísmico',
    title: 'Martelo das Profundezas',
    category: 'MINIBOSS',
    threat: 4,
    color: '#95a5a6',
    hp: 1288,
    damage: 36,
    speed: 'Colosso (0.9)',
    role: 'Impacto Sísmico 360°',
    microLore: 'Carregador de marretas pneumáticas alimentadas a magma vivo. Cada golpe no solo projeta ondas de choque concêntricas que rasgam a rocha.',
    tactics: 'Ao vê-lo erguer o martelo com telegrafia de impacto, recue para fora do anel de choque e ataque assim que a onda se dissipar.',
    quotes: ['“QUEBREM! VOU REDUZIR ESTE CHÃO A CINZAS!”']
  },
  {
    id: 'ARTILLERY_MECH',
    name: 'Torre Móvel',
    title: 'Canhoneiro de Cerco Autônomo',
    category: 'MINIBOSS',
    threat: 4,
    color: '#2980b9',
    hp: 1050,
    damage: 24,
    speed: 'Plataforma (0.9)',
    role: 'Morteiro e Metralhadora',
    microLore: 'Plataforma de artilharia pesada criada para conter rebeliões no coração da fortaleza. Seus tambores giratórios despejam metal incandescente sem intervalo.',
    tactics: 'Interrompa sua cadência usando habilidades de controle ou circule velozmente em arco fechado.',
    quotes: ['*alerta óptico: alvo bloqueado para erradicação*']
  },
  {
    id: 'FIRE_INCINERATOR',
    name: 'Incinerador Instável',
    title: 'Caldeira Viva de Enxofre',
    category: 'MINIBOSS',
    threat: 4,
    color: '#e67e22',
    hp: 812,
    damage: 31,
    speed: 'Carga Térmica (2.0)',
    role: 'Dispersor de Chamas',
    microLore: 'Uma caldeira de pressão humana cujas válvulas foram soldadas. Vive em tormento perpétuo e explode em uma chuva circular de projéteis de napalm.',
    tactics: 'Sua detonação cobre uma área imensa. Mantenha distância de segurança assim que a vida dele chegar próxima a zero.',
    quotes: ['“TUDO DEVE PURIFICAR NO FOGO!”']
  },
  {
    id: 'BROOD_MATRIARCH',
    name: 'Matriarca Parasita',
    title: 'Ninho Cósmico Ambulante',
    category: 'MINIBOSS',
    threat: 5,
    color: '#00cec9',
    hp: 1232,
    damage: 26,
    speed: 'Rastejante (1.3)',
    role: 'Rainha Divisora',
    microLore: 'A mãe de toda a ninhada de parasitas da arena. Suas cavidades abdominais abrigam centenas de larvas que brotam conforme ela é ferida.',
    tactics: 'Use armas com penetração em massa para que os parasitas menores gerados morram no mesmo feixe de dano da Matriarca.',
    quotes: ['*pulsar repugnante de centenas de ventosas*']
  },
  {
    id: 'SPECTRAL_STALKER',
    name: 'Predador Espectral',
    title: 'Ceifador dos Cantos Escuros',
    category: 'MINIBOSS',
    threat: 5,
    color: '#6c5ce7',
    hp: 868,
    damage: 38,
    speed: 'Teletransporte (2.5)',
    role: 'Assassino Dimensional',
    microLore: 'O espírito de um mestre carrasco imperial. Ele não corre; ele dilacera o tecido do espaço e surge instantaneamente nas costas de sua presa.',
    tactics: 'Ao notar o vórtice roxo sob seus pés, use o Dash de seu herói sem hesitar para negar o golpe nas costas com invulnerabilidade.',
    quotes: ['“Feche teus olhos... o fim já veio.”']
  },
  {
    id: 'HIGH_OCCULTIST',
    name: 'Alto Sacerdote',
    title: 'Voz da Catedral Esquecida',
    category: 'MINIBOSS',
    threat: 5,
    color: '#341f97',
    hp: 1330,
    damage: 29,
    speed: 'Ritualístico (1.0)',
    role: 'Poço Gravitacional',
    microLore: 'O líder do sínodo que abriu as comportas para o Soberano do Abismo. Seus rituais geram nós gravitacionais que sugam os vivos em direção ao vácuo.',
    tactics: 'Lute contra o puxão gravitacional correndo para a borda do poço enquanto dispara habilidades no Sacerdote.',
    quotes: ['“O Vácuo tem fome... entregai vossa vontade!”']
  },
  {
    id: 'RUNIC_WARDEN',
    name: 'Guardião Rúnico',
    title: 'Sentinela dos Selos Arcanos',
    category: 'MINIBOSS',
    threat: 5,
    color: '#0984e3',
    hp: 1680,
    damage: 24,
    speed: 'Protetor (1.1)',
    role: 'Aura de Invulnerabilidade',
    microLore: 'Protetor das relíquias cósmicas celestes. Sua couraça emana uma cúpula rúnica que reduz o dano de todos os monstros próximos.',
    tactics: 'Foque todo o poder nele primeiro. Enquanto o Guardião Rúnico estiver de pé, a horda ao redor dele será quase indestrutível.',
    quotes: ['“Os selos permanecerão inquebráveis!”']
  },
  {
    id: 'RUST_COLOSSUS',
    name: 'Colosso Ferruginoso',
    title: 'Titã da Forja Arruinada',
    category: 'MINIBOSS',
    threat: 5,
    color: '#d35400',
    hp: 2240,
    damage: 42,
    speed: 'Lento / Brutal (0.85)',
    role: 'Arremessador de Rochedos',
    microLore: 'O maior construto já forjado nas fundições imperiais. Envolto em ferro oxidado e sangue seco, arremessa lajes de pedra do tamanho de carroças.',
    tactics: 'Observe a sombra do rochedo no solo para desviar a tempo. Sua grande barra de vida exige dano sustentado ou evoluções de armas.',
    quotes: ['*gemido ensurdecedor de vigas de ferro entortando*']
  },
  {
    id: 'SIEGE_CAPTAIN',
    name: 'Capitão de Cerco',
    title: 'Estrategista dos Exércitos Malditos',
    category: 'MINIBOSS',
    threat: 5,
    color: '#b71540',
    hp: 1540,
    damage: 34,
    speed: 'Militar (1.0)',
    role: 'Barragem de Morteiros',
    microLore: 'Comandante veterano que preferiu pactuar com a escuridão a assinar a rendição. Coordena bombardeios em leque com precisão letal.',
    tactics: 'Não fique estático em um mesmo quadrante da arena; o Capitão de Cerco cobre áreas inteiras com fogo de morteiro.',
    quotes: ['“Fogo em leque! Não deixem um único osso inteiro!”']
  },
  {
    id: 'MOBILE_HIVE',
    name: 'Ninho Móvel',
    title: 'Colmeia de Morcegos Vivos',
    category: 'MINIBOSS',
    threat: 5,
    color: '#16a085',
    hp: 1820,
    damage: 26,
    speed: 'Flutuante (1.3)',
    role: 'Gerador Contínuo de Morcegos',
    microLore: 'Uma carcaça oca de gárgula que serve como útero para enxames vorazes de morcegos carmesins. Enquanto vive, o céu da arena permanece vermelho.',
    tactics: 'Destrua o ninho antes que a densidade de morcegos impeça qualquer esquiva ou manobra na arena.',
    quotes: ['*revoada histérica de centenas de asas vampíricas*']
  },
  {
    id: 'QUANTUM_SLICER',
    name: 'Fatiador Quântico',
    title: 'Lâmina do Espaço-Tempo',
    category: 'MINIBOSS',
    threat: 5,
    color: '#a29bfe',
    hp: 1372,
    damage: 43,
    speed: 'Dobra Espacial (2.2)',
    role: 'Corte Relâmpago em Cadeia',
    microLore: 'Espadachim que fundiu seu espírito com uma fenda dimensional. Corta a realidade em ziguezague, rasgando tanto a matéria quanto a mente.',
    tactics: 'Seus cortes em cadeia acontecem em ritmo frenético. Guarde a habilidade de imunidade do seu herói para quebrar a sequência dele.',
    quotes: ['“Cem cortes em um piscar de olhos.”']
  },
  {
    id: 'VOID_PRECURSOR',
    name: 'Precursor do Vazio',
    title: 'Sombra dos Fins dos Tempos',
    category: 'MINIBOSS',
    threat: 5,
    color: '#8e44ad',
    hp: 2520,
    damage: 38,
    speed: 'Abissal (1.2)',
    role: 'Carregador de Vórtices',
    microLore: 'A vanguarda do Soberano do Abismo. Suas mãos canalizam fendas estelares em miniatura que distorcem o campo de visão e a física da arena.',
    tactics: 'Evite o contato com seus vórtices residuais. Concentre dano de crítico com armas evoluídas para derrubá-lo rapidamente.',
    quotes: ['“O Soberano observa teus passos insignificantes.”']
  },
  {
    id: 'CHAOS_HERALD',
    name: 'Arauto do Caos',
    title: 'O Flagelo do Apocalipse',
    category: 'MINIBOSS',
    threat: 5,
    color: '#c0392b',
    hp: 3080,
    damage: 48,
    speed: 'Implacável (1.7)',
    role: 'Ciclo Caótico de Três Fases',
    microLore: 'O mais temido dos comandantes do inferno astral. Alterna entre investidas destruidoras, explosões de plasma e invocações desesperadas de hordas.',
    tactics: 'Trate o Arauto como um chefe em escala reduzida: aprenda seu ciclo de três fases e nunca tente atacá-lo de peito aberto durante sua fase de fúria.',
    quotes: ['“EU SOU O INÍCIO DO TEU FIM!”', '“O CAOS REIVINDICA TUA CARCAÇA!”']
  },

  // ==========================================
  // --- CHEFES SUPREMOS DO ABISMO (4) ---
  // ==========================================
  {
    id: 'BOSS_1',
    bossId: 1,
    name: 'Lorde Vampírico',
    title: 'Soberano da Noite Carmesim',
    category: 'BOSS',
    threat: 5,
    color: '#8e44ad',
    hp: 28000,
    damage: 81,
    speed: 'Névoa / Fúria (1.85)',
    role: 'Chefe Supremo da Onda 4',
    microLore: 'Antigo patriarca imperial que trocou a mortalidade pelo trono de sangue eterno. Governa as sombras das criptas e comanda as legiões de morcegos da noite. Seu orgulho é tão infinito quanto sua sede de sangue humano.',
    tactics: 'Cuidado com a sua investida em forma de névoa e sua fúria aos 50% de vida. Destrua suas orbes escuras e esquive em curva durante suas rajadas de garras.',
    quotes: [
      '“A noite tem sede... e vosso sangue saciará meu trono.”',
      '“A NOITE ME PERTENCE! Rastejai sob minhas asas carmesins!”',
      '“O Monólito... já sente vosso cheiro... a terra vos devorará...”'
    ]
  },
  {
    id: 'BOSS_2',
    bossId: 2,
    name: 'Monólito Abissal',
    title: 'O Coração Tectônico da Terra',
    category: 'BOSS',
    threat: 5,
    color: '#c0392b',
    hp: 98000,
    damage: 135,
    speed: 'Colosso Telúrico (0.95)',
    role: 'Chefe Supremo da Onda 6',
    microLore: 'Uma montanha sagrada arrancada do manto terrestre e corrompida pelo núcleo do Abismo. Não possui carne nem mente: apenas ódio tectônico em forma de placas de basalto e lava pulsante.',
    tactics: 'Seus esmagamentos criam zonas de lava mortais no epicentro seguidas de ondas sísmicas externas. Mantenha distância durante o esmagamento e ataque após a dispersão das fendas.',
    quotes: [
      '“As placas despertam... silêncio para os ossos da terra.”',
      '“A TERRA REIVINDICA VOSSA CARCAÇA! RUAM!”',
      '“As correntes se romperam... Thanatos vos aguarda além do véu...”'
    ]
  },
  {
    id: 'BOSS_3',
    bossId: 3,
    name: 'Thanatos, o Ceifador Supremo',
    title: 'O Juiz das Almas Perdidas',
    category: 'BOSS',
    threat: 5,
    color: '#00cec9',
    hp: 140000,
    damage: 246,
    speed: 'Ceifa Espiritual (2.1)',
    role: 'Chefe Supremo da Onda 8',
    microLore: 'A personificação espectral da morte no plano astral. Empunha a Foice do Destino, uma relíquia capaz de separar o espírito da matéria com um único corte cirúrgico.',
    tactics: 'Nunca entre na rota de retorno de sua Foice Bumerangue. Destrua a Lanterna Espiritual para infligir Colapso Espiritual de 2.0s de vulnerabilidade no chefe.',
    quotes: [
      '“Todo pulso se aquieta diante de minha foice.”',
      '“A LÂMINA DO DESTINO NÃO CONHECE MISERICÓRDIA!”',
      '“Eu ceifo apenas a carne... o Soberano consumirá vossa própria existência...”'
    ]
  },
  {
    id: 'BOSS_4',
    bossId: 4,
    name: 'Soberano do Abismo',
    title: 'A Singularidade do Vácuo Eterno',
    category: 'BOSS',
    threat: 5,
    color: '#8e44ad',
    hp: 309400,
    damage: 365,
    speed: 'Vórtice Cósmico (1.25)',
    role: 'Chefe Final da Onda 10',
    microLore: 'A entidade primordial que devorou constelações inteiras antes do início do tempo. Sua mera presença na arena distorce o horizonte de eventos e atrai a realidade para o nada absoluto.',
    tactics: 'Luta de três fases de alta precisão. Fuja do horizonte de eventos durante a Implosão do Vazio e guarde imunidades para a onda de choque da Supernova.',
    quotes: [
      '“Estrelas nascem para morrer. O vácuo é a única verdade eterna.”',
      '“TORNAI-VOS PÓ NO HORIZONTE DE EVENTOS!”',
      '“O Vácuo... jamais poderá... ser extinto...”'
    ]
  }
];

/**
 * Retorna as estatísticas de abates por criatura salvas na conta
 * @returns {Object} Mapa { [creatureId]: count }
 */
export function getBestiaryStats() {
  try {
    const raw = localStorage.getItem(BESTIARY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (e) {
    return {};
  }
}

/**
 * Salva as estatísticas de abates do bestiário
 */
export function saveBestiaryStats(stats) {
  try {
    localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Erro ao salvar bestiário:', e);
  }
}

/**
 * Registra um abate no bestiário e notifica caso uma nova criatura seja descoberta
 * @param {string} creatureId Identificador da criatura (ex: 'ZOMBIE', 'BLOOD_GARGOYLE', 'BOSS_1')
 */
export function recordCreatureKill(creatureId) {
  if (!creatureId) return;
  const stats = getBestiaryStats();
  const prevCount = stats[creatureId] || 0;
  stats[creatureId] = prevCount + 1;
  saveBestiaryStats(stats);
  return stats[creatureId];
}

/**
 * Retorna a contagem de abates de uma criatura específica
 */
export function getCreatureKills(creatureId) {
  const stats = getBestiaryStats();
  return stats[creatureId] || 0;
}

/**
 * Retorna se a criatura foi descoberta (pelo menos 1 abate)
 */
export function isCreatureDiscovered(creatureId) {
  return getCreatureKills(creatureId) > 0;
}

/**
 * Retorna se a lore completa da criatura foi desbloqueada
 * Hordas: 10 abates | Mini-Chefes: 1 abate | Chefes: 1 abate
 */
export function isLoreUnlocked(creature) {
  const kills = getCreatureKills(creature.id);
  if (creature.category === 'BOSS') return kills >= 1;
  if (creature.category === 'MINIBOSS') return kills >= 1;
  return kills >= 10;
}

/**
 * CHEAT DEVTOOLS (W + 5): Desbloqueia todas as 30 criaturas do Bestiário com 100 abates
 */
export function unlockAllBestiary() {
  const stats = {};
  BESTIARY_ENTRIES.forEach(entry => {
    stats[entry.id] = 100;
  });
  saveBestiaryStats(stats);
  try {
    playSfx('chest_rare');
    triggerHaptic('heavy');
  } catch (e) {}
  return true;
}

/**
 * CHEAT DEVTOOLS (W + 5): Reseta o Bestiário de volta ao estado inicial
 */
export function resetBestiary() {
  saveBestiaryStats({});
  try {
    localStorage.removeItem(BESTIARY_STORAGE_KEY);
    playSfx('hit');
    triggerHaptic('light');
  } catch (e) {}
  return true;
}
