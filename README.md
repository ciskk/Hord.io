# ⚔️ Hord.io: Survivors Evolution

<p align="center">
  <img src="https://img.shields.io/badge/Tecnologia-HTML5%20%7C%20Canvas%202D-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5 Canvas 2D" />
  <img src="https://img.shields.io/badge/Linguagem-JavaScript%20(ES6%2B)-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript ES6" />
  <img src="https://img.shields.io/badge/Dependências-Zero%20(Vanilla)-success?style=for-the-badge" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/Áudio-Web%20Audio%20API%20(Procedural)-9cf?style=for-the-badge" alt="Web Audio API" />
  <img src="https://img.shields.io/badge/Plataforma-Web%20%7C%20Mobile%20Ready-blueviolet?style=for-the-badge" alt="Mobile Ready" />
</p>

**Hord.io: Survivors Evolution** é um jogo de ação e sobrevivência em hordas (*bullet heaven / survivors-like*) desenvolvido inteiramente com **tecnologias web nativas (Vanilla JS + HTML5 Canvas 2D)**.

Sem frameworks, sem bibliotecas externas e sem assets de imagem ou áudio pré-gravados: todo o pipeline gráfico, física de multidão, cenários e efeitos sonoros são **gerados proceduralmente e sintetizados em tempo real**.

---

## ⚡ Destaques do Projeto

- **Motor Próprio em Vanilla JS**: Arquitetura modular orientada a sistemas e desacoplada em ES6 Modules.
- **Renderização Procedural no Canvas 2D**: Personagens, monstros, efeitos visuais, impactos e projéteis desenhados diretamente via código, com suporte dinâmico a `devicePixelRatio` (limitado a 1.5x para máxima fluidez).
- **Spatial Hash Grid 2D**: Algoritmo de particionamento espacial em células de `75px` para checagem otimizada de colisões e vizinhança entre centenas de entidades simultâneas.
- **Física de Multidão e Resolução de Colisão**: Separação elástica de hordas com distinção de massa (comuns, elites, minibosses e chefes) e hiperarmadura de ataque.
- **Áudio Sintetizado (Web Audio API)**: Efeitos sonoros procedurais gerados via osciladores e ruído branco em tempo real, sem carregar arquivos `.mp3` ou `.wav`. Inclui escala pentatônica harmônica na coleta de gemas e feedback tátil (Vibration API).
- **Controles Híbridos**: Suporte simultâneo e responsivo para teclado/mouse (Desktop) e Joystick virtual analógico com botões touch dedicados (Mobile).

---

## 🎮 Controles

| Ação | Desktop (Teclado & Mouse) | Dispositivos Móveis |
|---|---|---|
| **Movimentação** | `W`, `A`, `S`, `D` ou `Setas` | Joystick Virtual Analógico |
| **Poder Ativo** | `Espaço`, `E` ou `Botão Direito` | Botão Touch de Habilidade |
| **Ataque Básico** | Automático (mira no alvo mais próximo) | Automático |
| **Pausar / Grimório** | `Esc` ou `P` | Botão `⏸` no topo da tela |

---

## 🛡️ Sobreviventes

Cada sobrevivente possui arquétipo, arma inicial e habilidade ativa com atributos únicos:

| Sobrevivente | Título / Arquétipo | Arma Inicial | Habilidade Ativa | Estilo Tático |
|---|---|---|---|---|
| **Sir Roland** | O Paladino | Martelo Sagrado | Investida Sagrada | Tanque retaliador: reduz 20% do dano corpo a corpo recebido e reflete 50% de volta aos agressores. |
| **Ignis** | A Piromante | Cajado da Tormenta | Passo Ígneo | DPS de artilharia ígnea: acertos críticos aplicam combustão residual contínua que drena vida ao longo do tempo. |
| **Kael** | O Andarilho Sombrio | Lâminas Espirituais | Manto de Fumaça | Assassino crítico: desfere 2.0x de dano em oponentes com <35% de vida (1.5x contra chefes/elites) e invisibilidade com 100% de crítico. |
| **Kragdor** | O Bárbaro Furioso | Machado Giratório | Rugido Ancestral | Lutador sustentável: rotação orbital destrutiva, roubo de vida (0.5% em chefes/elites) e atordoamento em área. |
| **Valéria** | A Alquimista Cáustica | Frascos Cáusticos | Reagente Volátil | Controle e corrosão: poças violetas que dissolvem projéteis inimigos, causam 70% de lentidão, acumulam corrosão (+30% dano sofrido) e concedem cura e velocidade contínuas à Valéria. |

---

## 🌟 Fusões e Evoluções Lendárias

Ao elevar uma arma ao nível de requisito necessário e possuir a passiva correspondente, baús de chefes e elites podem liberar **Evoluções Lendárias**:

| Evolução Lendária | Receita (Arma + Passiva) | Efeito de Combate |
|---|---|---|
| **★ Lâmina Dimensional** | Lâminas Espirituais (Nv 4) + Asas do Vento | Espadas astrais colossais com perfuração quádrupla e velocidade extrema. |
| **★ Tempestade de Aço** | Machado Giratório (Nv 3) + Poder Bruto | 6 machados orbitais acelerados que trituram toda a arena ao redor. |
| **★ Dilúvio Biológico** | Frascos Cáusticos (Nv 3) + Golpe Criogênico | Salva de 5 frascos tóxicos criando uma mega-zona corrosiva com congelamento. |
| **★ Cataclismo Solar** | Cajado da Tormenta (Nv 3) + Poder Bruto | Supernovas de plasma penetrantes que cobrem o chão de magma radiante. |
| **★ Martelo dos Titãs** | Martelo Sagrado (Nv 3) + Armadura Rúnica | Terremoto titânico de 360° com fendas incandescentes no solo. |
| **★ Santuário Celestial** | Aura Sagrada (Nv 5) + Armadura Rúnica | Supernova defensiva permanente que expande o raio e regenera o HP do jogador. |
| **★ Vórtice do Apocalipse** | Bíblias Protetoras (Nv 5) + Asas do Vento | Barreira contínua com 8 tomos sagrados supersônicos que vaporizam agressores. |

---

## 👑 Chefes e Arenas Procedurais

O jogo progride através de 10 ondas de hordas, 16 tipos de minibosses com mecânicas próprias e 4 encontros épicos com chefes:

| Chefe | Arena Temática | Mecânicas e Fases Principais |
|---|---|---|
| **Lorde Vampírico** | *Salão Carmesim* | Telegrafias de corte com foice e onda frontal de sangue, investida em névoa espectral, enxames de morcegos de longo alcance, gêiseres de sangue com adagas balísticas e repulsão tática. |
| **Monólito Abissal** | *Caldeira Tectônica* | Litocistos Tectônicos orbitais destrutíveis, fontes termais de cura (+25 HP), esmagamento frontal pesado, erupção do epicentro, onda de fendas e vórtice da caldeira. |
| **Ceifador Supremo** | *Necrópole Espectral* | Foice ornamental com manivela articulada sob inércia física, Lanternas de Almas com elo etéreo e colapso de 6.0s, cortes duplos, foices espirituais giratórias, teleporte com aviso holográfico (Blink) e vórtice colhedor. |
| **Soberano do Abismo** | *Horizonte do Vazio* | **3 fases de combate**, introdução cinematográfica em 4 atos, barreira física de contenção do Altar, horizonte de eventos contrátil com asfixia, Âncoras Cósmicas com mitigação e regeneração de vida, Santuários Celestiais de cura, crucifixo giratório de feixes, corte dimensional, bombardeio abissal e sequência dramática de derrota (DEATH_COLLAPSE) em 4 atos com Supernova Dourada. |

---

## 🏛️ Meta-Progressão Permanente

Todo o ouro e almas obtidos nos abates é salvo no `localStorage` do navegador para fortalecer seus sobreviventes entre as partidas através de uma **Árvore Astral de Talentos com 3 Constelações**:

### ⚔️ Constelação da Guerra (Ofensiva & Letalidade)
- **Poder Ancestral**: +5% Dano global por nível (até 10 níveis).
- **Precisão Letal**: +2% Chance de acerto crítico por nível (até 5 níveis).
- **Vontade Incansável**: -2% Tempo de recarga de armas e habilidades por nível (até 5 níveis).
- **Fúria Executora**: +8% Dano contra inimigos com menos de 30% de HP por nível (até 5 níveis).

### 🛡️ Constelação da Égide (Sobrevivência & Baluarte)
- **Vitalidade Rúnica**: +4% Vida máxima por nível (até 10 níveis).
- **Carapaça Blindada**: -1 Dano sofrido direto absoluto por nível (até 5 níveis).
- **Passos Ligeiros**: +2.5% Velocidade de movimento por nível (até 6 níveis).
- **Bênção Vital**: +0.5 HP/s Regeneração contínua por nível (até 5 níveis).
- **★ Renascimento da Fênix (Keystone)**: Sobrevive a 1 golpe fatal por partida, restaura 35% de vida e repele a horda com explosão solar.

### 🔮 Constelação do Destino (Alquimia & Meta-Riqueza)
- **Ímã do Vazio**: +20px Raio de atração de gemas e ouro por nível (até 8 níveis).
- **Cobiça Espectral**: +5% Ouro e almas recolhidos na arena por nível (até 8 níveis).
- **Sabedoria Arcana**: +4% Ganho de XP por nível (acelera cartas de Tarô, até 5 níveis).
- **Destino Favorável**: +1 Reroll de cartas de Tarô por partida por nível (até 3 níveis).
- **★ Transmutação Cósmica (Keystone)**: 25% de chance de baús de chefes concederem dádiva dupla.

> *Inclui botão de Reset com Reembolso Integral de 100% do ouro investido na árvore.*

---

## 🏗️ Arquitetura do Repositório

Organização modular baseada em responsabilidade única e arquitetura desacoplada de chefes:

```text
Hord.io/
├── index.html                  # Interface, Canvas e modais do DOM
├── style.css                   # Design responsivo, HUD e animações da UI
├── README.md                   # Documentação oficial
└── src/
    ├── main.js                 # Ponto de entrada e orquestração do loop do jogo
    │
    ├── config/                 # Catálogos de dados e balanceamento
    │   ├── characters.js       # Atributos, armas e passivas dos 5 sobreviventes
    │   ├── enemies.js          # Configuração de monstros, elites, minibosses e chefes
    │   ├── items.js            # Registro único de armas, passivas e matriz de sinergias
    │   ├── squads.js           # Formações táticas pré-definidas de hordas
    │   └── upgrades.js         # Lógica de seleção e sorteio ponderado de cartas
    │
    ├── core/                   # Infraestrutura base e utilitários
    │   ├── audio.js            # Síntese de som procedural via Web Audio API
    │   ├── input.js            # Mapeamento unificado de teclado, mouse e touch
    │   ├── math.js             # Funções vetoriais, interpolação e colisões
    │   └── spatialGrid.js      # Spatial Hash Grid 2D para alto desempenho
    │
    ├── entities/               # Lógica de entidades de jogo
    │   ├── player.js           # Estado do herói, XP, atributos, árvore de talentos e upgrades
    │   ├── enemies.js          # Spawner de hordas, grupos e minibosses
    │   └── bosses/             # Arquitetura modular de chefes e registro central
    │       ├── bossRegistry.js # Despacho e registro unificado dos 4 chefes
    │       ├── vampireLord/    # Módulo desacoplado do Lorde Vampírico (Boss 1)
    │       ├── vampireLord.js  # Fachada de compatibilidade
    │       ├── abyssalMonolith/ # Módulo desacoplado do Monólito Abissal (Boss 2)
    │       ├── abyssalMonolith.js # Fachada de compatibilidade
    │       ├── supremeReaper/  # Módulo desacoplado do Ceifador Supremo (Boss 3)
    │       ├── supremeReaper.js # Fachada de compatibilidade
    │       ├── abyssSovereign/ # Módulo desacoplado do Soberano do Abismo (Boss 4)
    │       └── abyssSovereign.js # Fachada de compatibilidade
    │
    ├── render/                 # Pipeline gráfico em Canvas 2D
    │   ├── characterPreview.js # Desenho procedural dos heróis no menu
    │   ├── enemiesRenderer.js  # Renderização procedural de monstros e elites
    │   ├── environment.js      # Cenários procedurais, altares e arena 2.5D
    │   ├── minibossesRenderer.js # Renderização procedural dos 16 minibosses
    │   ├── playerRenderer.js   # Animações corporais e armas do jogador
    │   └── renderer.js         # Orquestrador gráfico (shake, partículas, números)
    │
    └── systems/                # Regras e subsistemas de jogo
        ├── combat.js           # Resolução de ataques, sangramento e dano
        ├── physics.js          # Separação de multidão e colisões
        ├── projectiles.js      # Balística, poças elementais e feixes
        ├── ui.js               # Sincronização da HUD, Grimório e menus
        └── waves.js            # Cronograma temporal de ondas e encontros
```

---

## 🚀 Como Executar Localmente

Como o projeto utiliza **ES6 Modules nativos**, ele deve ser executado através de um servidor local para evitar bloqueios de CORS do protocolo `file:///`.

### Opção 1: VS Code (Live Server)
1. Abra a pasta do projeto no **Visual Studio Code**.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito em `index.html` e selecione **Open with Live Server**.

### Opção 2: Node.js
```bash
npx serve .
```

### Opção 3: Python
```bash
python -m http.server 8000
```
Em seguida, abra `http://localhost:8000` no seu navegador.

---

## 💻 Requisitos

- Qualquer navegador moderno (Chrome, Edge, Firefox, Safari, Opera).
- Suporte a Canvas 2D, ES6 Modules, Web Audio API e `localStorage`.
- Zero ferramentas de build, `npm install` ou compiladores necessários!
