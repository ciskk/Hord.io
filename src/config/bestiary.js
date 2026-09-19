/**
 * src/config/bestiary.js
 * Códice do Bestiário das Trevas, Estatísticas de Abates e Micro-Lore Gótica.
 */
import { playSfx, triggerHaptic } from '../core/audio.js';

const BESTIARY_STORAGE_KEY = 'hord_bestiary_v1';

/**
 * Registro Canônico de todas as 45 Criaturas do Hord.io
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
  // --- NOVOS MONSTROS DA HORDA EXPANDIDA (15) ---
  // ==========================================
  {
    id: 'TRAIL_CRAWLER',
    name: 'Rastejador Peçonhento',
    title: 'Flagelo dos Esgotos Imperiais',
    category: 'HORDE',
    threat: 2,
    color: '#16a085',
    hp: 160,
    damage: 18,
    speed: 'Ágil / Rastejante (1.45)',
    role: 'Negação de Rota por Rastro Tóxico',
    microLore: 'Aberração mutacionada que rasteja pelos canais subterrâneos da cidadela arruinada. Seu sangue borbulhante dissolve lajes imperiais e corrói a armadura de guerreiros descuidados.',
    tactics: 'Não persiga ou corra atrás de sua rota direta; suas poças de lodo persistente reduzem seu movimento e drenam vida. Elimine-o à distância com ataques frontais.',
    quotes: ['*sibilo viscoso escorre pelas fendas*', '*o cheiro acre de ácido queima as narinas*']
  },
  {
    id: 'CRYPT_WEAVER',
    name: 'Tecelã das Catacumbas',
    title: 'Fiandeira das Criptas Profundas',
    category: 'HORDE',
    threat: 3,
    color: '#636e72',
    hp: 210,
    damage: 16,
    speed: 'Rastejo Cadenciado (1.20)',
    role: 'Confinamento por Teia e Lentidão',
    microLore: 'Aracnídeos colossais alimentados com cinzas de nobres sepultados. Elas não caçam pela força bruta, mas pelo pânico de suas presas ao verem seus passos imobilizados pela seda cinzenta.',
    tactics: 'Observe o arco do projétil de teia. Se pisar na armadilha, use imediatamente o Dash ou habilidade de deslocamento do seu herói para romper a desaceleração.',
    quotes: ['*fios de seda fria tocam o pescoço*', '*estalos de mandíbulas articuladas na escuridão*']
  },
  {
    id: 'CHAIN_FLAYER',
    name: 'Flagelador de Correntes',
    title: 'Algoz do Cárcere dos Hereges',
    category: 'HORDE',
    threat: 4,
    color: '#b33939',
    hp: 310,
    damage: 28,
    speed: 'Passada Pesada (1.05)',
    role: 'Controle Melee de Médio Alcance',
    microLore: 'Guardas carcerários aprisionados eternamente em suas próprias sentenças. Suas correntes de ferro negro continuam açoitando o ar em busca de novos condenados.',
    tactics: 'Possui alcance corpo a corpo estendido. Ao ver o elo de corrente girando em windup, esquive na diagonal para evitar ser puxado para o meio da horda.',
    quotes: ['“Tua pena será cumprida em sangue!”', '*tinir metálico de elos pesados arrastando no chão*']
  },
  {
    id: 'BASALT_GARGOYLE',
    name: 'Gárgula de Basalto',
    title: 'Sentinela Petrificada dos Portais',
    category: 'HORDE',
    threat: 4,
    color: '#57606f',
    hp: 520,
    damage: 32,
    speed: 'Voo Pesado (1.35)',
    role: 'Bloqueio de Projéteis & Modo Fortaleza',
    microLore: 'Esculturas imperiais entalhadas em basalto vulcânico vivo. Quando bombardeadas com ataques frenéticos, suas asas se fundem em um broquel monolítico quase impenetrável.',
    tactics: 'Ao notar sua transição para a postura de estátua cinzenta (80% de redução de dano), ignore-a temporariamente e limpe os inimigos ao redor até o escudo ceder.',
    quotes: ['*atrito surdo de rocha sólida se unindo*', '“A pedra não sangra nem cede.”']
  },
  {
    id: 'TOLL_BELLRINGER',
    name: 'Arauto do Sino Fúnebre',
    title: 'Acólito da Marcha dos Condenados',
    category: 'HORDE',
    threat: 4,
    color: '#f39c12',
    hp: 240,
    damage: 15,
    speed: 'Monástico (0.90)',
    role: 'Buffer de Velocidade e Marcha Ágil',
    microLore: 'Monges renegados que entoam a liturgia do Soberano do Abismo. O ressoar estridente de seus sinos de bronze arranca os mortos da inércia e enfurece toda a fileira.',
    tactics: 'Alvo de prioridade primária! Enquanto o sino ressoar, monstros próximos ganham aceleração e ferocidade de ataque dobradas.',
    quotes: ['“DOBRAM OS SINOS PELA TUA CARNE!”', '*ressoar cavernoso de bronze faz a terra tremer*']
  },
  {
    id: 'PLAGUE_APOTHECARY',
    name: 'Boticário da Peste',
    title: 'Cirurgião das Sangrias Proibidas',
    category: 'HORDE',
    threat: 4,
    color: '#27ae60',
    hp: 260,
    damage: 18,
    speed: 'Cálculo Tático (1.00)',
    role: 'Curandeiro Balístico da Horda',
    microLore: 'Alquimistas imperiais que descobriram no éter da putrefação a cura para ferimentos fatais. Arremessam ampolas de miasma esmeralda que reconstituem tecidos cadavéricos.',
    tactics: 'Elimine os boticários antes que eles curem continuamente Golems e tropas de choque. Suas poças verdes curam monstros mas machucam o sobrevivente.',
    quotes: ['“Uma dose de podridão restaura o vigor!”', '*estilhaço de vidro e borbulhar cáustico*']
  },
  {
    id: 'RUNE_SCRIBE',
    name: 'Escriba das Runas',
    title: 'Litógrafo do Escudo Espectral',
    category: 'HORDE',
    threat: 4,
    color: '#2980b9',
    hp: 280,
    damage: 20,
    speed: 'Flutuante (0.95)',
    role: 'Elo de Barreira Arcana Protetora',
    microLore: 'Escribas cegos que registram em pergaminhos de carne humana as fórmulas de contenção astral. Vinculam elos de pura energia diamantina ao campeão mais próximo da horda.',
    tactics: 'Quebre o feixe azul destruindo o Escriba. Atacar o monstro protegido pelo escudo é desperdício de munição enquanto o elo estiver ativo.',
    quotes: ['“O selo celestial não pode ser quebrado!”', '*sussurros arcanos ecoam em frequência pura*']
  },
  {
    id: 'FORGE_PYREGUARD',
    name: 'Lança-Chamas da Forja',
    title: 'Sentinela das Forjas Infernais',
    category: 'HORDE',
    threat: 4,
    color: '#d35400',
    hp: 340,
    damage: 26,
    speed: 'Pesado (0.85)',
    role: 'Supressão Contínua de Fogo em Cone',
    microLore: 'Autômatos da fundição imperial que operam à base de óleo de enxofre e carvão da forja. Seus bicos de bronze cospem labaredas em leques contínuos de queima.',
    tactics: 'Ao notar o cone alaranjado telegrafando sua mira, circule velozmente para as costas da sentinela enquanto ela canaliza seu jato estático.',
    quotes: ['*chiado de pressão mecânica rompendo válvulas*', '*crepitar voraz de labaredas incinerando o chão*']
  },
  {
    id: 'MAIDEN_THORNS',
    name: 'Donzela das Agulhas',
    title: 'Instrumento de Suplício Ambulante',
    category: 'HORDE',
    threat: 4,
    color: '#8e44ad',
    hp: 380,
    damage: 29,
    speed: 'Cadência Fria (1.15)',
    role: 'Retaliação Radial de Espinhos',
    microLore: 'Uma dama de ferro medieval imbuída com o ódio das vítimas de inquisidores ancestrais. Cada impacto sofrido empilha pressão em suas molas internas até a liberação fatal.',
    tactics: 'Cuidado com armas orbitais contínuas (machados e bíblias) que ativam repetidamente seu gatilho de retaliação em 360°. Mantenha distância de segurança.',
    quotes: ['*rangido horrível de dobradiças enferrujadas se abrindo*', '“Vem... partilha do meu abraço eterno...”']
  },
  {
    id: 'MIRROR_BANSHEE',
    name: 'Banshee dos Espelhos',
    title: 'O Eco dos Lamentos Decaídos',
    category: 'HORDE',
    threat: 3,
    color: '#a29bfe',
    hp: 170,
    damage: 21,
    speed: 'Etérea / Veloz (2.10)',
    role: 'Ilusionista Evasiva & Clones Falsos',
    microLore: 'O espírito errante de damas da corte que se afogaram em águas de espelhos encantados. Desdobra sua essência em ilusões visuais no instante em que sua carne espectral é ferida.',
    tactics: 'Distinga a verdadeira pela sombra projetada no solo e pela barra de vida. Destruir a Banshee original dissipa instantaneamente seus reflexos ilusórios.',
    quotes: ['“Qual de nós segurará tua garganta?”', '*lamento supersônico ecoa em espelhos invisíveis*']
  },
  {
    id: 'DULLAHAN_VANGUARD',
    name: 'Cavaleiro Sem Cabeça',
    title: 'Campeão do Sepulcro Esquecido',
    category: 'HORDE',
    threat: 5,
    color: '#2c3e50',
    hp: 440,
    damage: 38,
    speed: 'Investida Relâmpago (1.10 -> 3.40)',
    role: 'Carga Pesada de Ruptura Frontal',
    microLore: 'O comandante decapitado que liderou as legiões em defesa da cidadela. Carrega seu próprio crânio em chamas e desfere cargas de justa que partem qualquer formação.',
    tactics: 'A faixa vermelha de aviso no piso precede sua investida com precisão milimétrica. Um passo lateral com timing correto o fará colidir no vazio.',
    quotes: ['“Minha honra marcha além da sepultura!”', '*trotada pesada de ferro despedaçando lajes*']
  },
  {
    id: 'SNIPER_CULTIST',
    name: 'Atirador de Éter',
    title: 'Olho da Seita Cega',
    category: 'HORDE',
    threat: 4,
    color: '#9c88ff',
    hp: 180,
    damage: 42,
    speed: 'Furtivo (0.80)',
    role: 'Artilharia Balística de Longo Alcance',
    microLore: 'Arqueiros cerimoniais que arrancaram os próprios olhos em rituais do Vazio. Sua mira laser segue as pulsações vitais da presa através das névoas mais densas.',
    tactics: 'Quando a linha de mira violeta começar a pulsar e piscar em branco, prepare-se para desviar em 90 graus para que a flecha perfure apenas o ar.',
    quotes: ['“Tua pulsação canta no éter... eu te escuto.”', '*zunido cortante de flecha quebrando a barreira do som*']
  },
  {
    id: 'VOID_SCAVENGER',
    name: 'Duende Ladrão de Gemas',
    title: 'Devorador de Éter e Almas',
    category: 'HORDE',
    threat: 3,
    color: '#00d2d3',
    hp: 190,
    damage: 14,
    speed: 'Frenético / Ágil (2.30)',
    role: 'Interrupção de Economia & Pinhata de XP',
    microLore: 'Parasitas cósmicos corcundas atraídos pela cintilação das almas desprendidas. Engolem gemas de XP e moedas vorazmente, acumulando poder e massa corporal.',
    tactics: 'Elimine-o rápido antes que ele consuma suas gemas de nível! Ao ser derrotado, devolve todo o XP acumulado multiplicado por 1.5x em uma explosão cintilante.',
    quotes: ['*risada estridente e gananciosa*', '“Tudo meu! Mais éter para o saco!”']
  },
  {
    id: 'GRAVE_GORGON',
    name: 'Carniçal Necrófago',
    title: 'O Canibal das Valas Comuns',
    category: 'HORDE',
    threat: 4,
    color: '#535c68',
    hp: 350,
    damage: 24,
    speed: 'Voraz (1.10)',
    role: 'Canibalismo & Escalonamento por Mortes',
    microLore: 'Criaturas necrófagas grotescas que consomem os restos orgânicos deixados pela batalha. A cada carcaça devorada, seus músculos expandem e sua fúria atinge novos patamares.',
    tactics: 'Evite acumular abates em massa nas proximidades de um Necrófago vivo, ou ele absorverá a vitalidade residual tornando-se um colosso incontrolável.',
    quotes: ['*mastigação repugnante de ossos e tendões*', '“Mais carne fresca para a carcaça!”']
  },
  {
    id: 'CURSED_CHEST',
    name: 'Mímico de Éter',
    title: 'A Ilusão da Cobiça Mortífera',
    category: 'HORDE',
    threat: 5,
    color: '#e056fd',
    hp: 850,
    damage: 36,
    speed: 'Dormência / Fúria (2.50)',
    role: 'Emboscada de Baú Falso & Espólio Lendário',
    microLore: 'Entidades transmutadoras do Abismo que assumem a aparência de arcas de ouro imperial. Quando a ganância do herói o faz baixar a guarda, a tampa se rompe em mandíbulas afiadas.',
    tactics: 'Identifique sua respiração quase imperceptível antes de se aproximar. Se derrotado com sucesso, libera um dilúvio de ouro e almas astrais.',
    quotes: ['“ACHOU QUE ERA UM TESOURO? EU SOU TUA MORTE!”', '*mandíbula metálica estala em fúria canina*']
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
