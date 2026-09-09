# Hord.io: Survivors Evolution

Um jogo de sobrevivência e ação em hordas (*bullet heaven / survivors*) desenvolvido puramente em **Vanilla JavaScript** com **ES6 Modules** e **HTML5 Canvas 2D**. O projeto foi construído sem dependências de frameworks externos ou bibliotecas de terceiros, priorizando alta performance de renderização, código modular e suporte híbrido nativo para desktop e dispositivos móveis.

---

## Destaques Técnicos

* **Arquitetura Modular (ES6 Modules):** Código 100% desacoplado em módulos com responsabilidades únicas (configurações, entidades, sistemas, infraestrutura e renderização).
* **Particionamento Espacial (*Spatial Hash Grid*):** Otimização das rotinas de colisão e afastamento entre dezenas de inimigos na tela, reduzindo o custo computacional de O(N²) para O(N).
* **Áudio Procedural em Tempo Real:** Síntese de áudio feita via **Web Audio API** através de osciladores, envelopes de ganho e filtros passa-baixa, eliminando o carregamento de arquivos externos de mídia (.mp3/.wav).
* **Controles Híbridos com Paridade Total:** Suporte simultâneo para controles mobile (joystick virtual com prevenção de toques acidentais no iOS Safari) e desktop (teclado WASD/setas e mouse), sem interferência mútua na experiência do usuário.
* **Progressão e Sinergias:** Sistema de 10 ondas escaláveis com elites modificadas, 4 chefes com ataques telegrafados e mecânica de fusão de armas lendárias via baús de tesouro.

---

## Estrutura do Projeto

Hord/
├── index.html
├── style.css
├── README.md
└── src/
    ├── main.js
    ├── config/
    │   ├── characters.js
    │   ├── enemies.js
    │   └── upgrades.js
    ├── core/
    │   ├── audio.js
    │   ├── input.js
    │   └── spatialGrid.js
    ├── entities/
    │   ├── player.js
    │   └── enemies.js
    ├── systems/
    │   ├── waves.js
    │   └── ui.js
    └── render/
        ├── renderer.js
        └── environment.js

---

## Responsabilidade dos Módulos

### 1. Arquivos de Raiz

* **`index.html`**  
  Estrutura semântica e casca da interface do jogo. Declara a tela principal `<canvas id="game-canvas">`, as sobreposições de efeitos de vinheta e congelamento, a HUD de status (vida, tempo de jogo, nível de poder, abates e barra do chefe) e as estruturas modais (seleção de sobrevivente, cartas de aprimoramento, baú de tesouro, menu de pausa com ajuste de volume, tela de derrota e vitória). Carrega o motor modular através da tag `<script type="module" src="./src/main.js">`.

* **`style.css`**  
  Camada de estilo e layout visual. Bloqueia a rolagem de tela e os gestos de seleção acidental no mobile (`user-select: none`, `touch-action: none`). Define o design escuro temático, estiliza os cards de upgrades por raridade (Comum, Raro e Lendário), estiliza a HUD fixa no topo e implementa a máscara cônica de recarga do botão flutuante de habilidade ativa.

---

### 2. `src/config/` (Configurações e Tabelas de Dados)

Centraliza os parâmetros estáticos e constantes de balanceamento do jogo, separando o design de jogo das regras dinâmicas de código.

* **`characters.js`**  
  Dicionário dos 3 arquétipos de heróis selecionáveis:
  * **Sir Roland (O Paladino):** Tanque com reflexão de dano passivo e habilidade de investida sagrada invulnerável.
  * **Ignis (A Piromante):** Especialista em ataques críticos com rastro de fogo e teleporte explosivo.
  * **Kael (O Andarilho Sombrio):** Assassino ágil com dano ampliado em alvos enfraquecidos e bomba de fumaça com invisibilidade.

* **`enemies.js`**  
  Contém as tabelas `ENEMY_TYPES` e `BOSS_TYPES`. Define dimensões de colisão, velocidade base, pontos de vida, cores, recompensas em XP e padrões de comportamento (perseguidor, enxame, atirador, invocador, divisor celular, tanque e suicida/kamikaze) para todos os inimigos normais e os 4 chefes da arena.

* **`upgrades.js`**  
  Gerencia o catálogo de melhorias disponíveis para o jogador (`upgradesPool`), o algoritmo de sorteio aleatório ponderado para subidas de nível (`getRandomUpgrades`) e as regras de verificação para fusões lendárias de armas (`checkSynergies`):
  * *Lâmina Dimensional* (Espada Arcana + Poder Bruto)
  * *Santuário Celestial* (Aura Sagrada + Armadura Rúnica)
  * *Vórtice do Apocalipse* (Bíblias Protetoras + Asas do Vento)

---

### 3. `src/core/` (Núcleo de Infraestrutura)

Módulos fundamentais que fornecem ferramentas de baixo nível essenciais para o funcionamento do motor.

* **`audio.js`**  
  Sistema de áudio sintético procedural baseado na **Web Audio API**. Cria nós osciladores e curvas dinâmicas de ganho para tiros, acertos, impactos críticos, subidas de nível e alertas de chefes. Inclui controle de volume mestre com atenuação suave, escala pentatônica musical para a coleta consecutiva de gemas de experiência e integração com a **Vibration API** (Haptic Feedback) em telas touch compatíveis.

* **`input.js`**  
  Gerenciador unificado de entradas. Normaliza os vetores de movimento (`inputX` e `inputY`) combinando:
  * Suporte a toque com joystick analógico virtual flutuante e bloqueio de comportamentos nativos indesejados no Safari/iOS (*pinch-to-zoom*, *double-tap zoom* e *pull-to-refresh*).
  * Suporte a teclado (WASD e Setas) com normalização vetorial para evitar velocidade duplicada em movimentos diagonais.
  * Suporte a atalhos de teclado (Espaço, E, Esc e P) e clique com o botão direito do mouse para ativação imediata da habilidade ativa do sobrevivente.

* **`spatialGrid.js`**  
  Implementação de uma estrutura de dados de particionamento espacial (*Spatial Hash Grid* em 2D). Distribui entidades em células de grade de 75px, permitindo que colisões de projéteis e forças de repulsão física entre monstros consultem somente os vizinhos imediatos em tempo constante.

---

### 4. `src/entities/` (Atores e Entidades do Jogo)

Instanciação, estados dinâmicos e ciclo de vida dos participantes da arena.

* **`player.js`**  
  Mantém o estado reativo do jogador (coordenadas, vida, velocidade, nível, projéteis, área de atração do ímã, cooldowns de ataque e estado de invisibilidade). Contém a lógica de disparo automático contra os alvos mais próximos (`fireWeapons`), acúmulo de experiência (`addXP`), cálculo de subida de nível e a execução prática das habilidades ativas de cada classe (`triggerHeroSkill`).

* **`enemies.js`**  
  Funções de fábrica de inimigos na arena. Cuida do nascimento de enxames em torno do campo visual do jogador (`spawnMobCluster`), sorteio de modificadores de elite (Gélido, Acelerado ou Tóxico), rotina de transição e expurgo de campo para a invocação de chefes (`triggerBossEncounter`) e geração de tochas e barris destrutíveis (`spawnProp`).

---

### 5. `src/systems/` (Regras de Negócio e Interface)

Controla o ritmo da partida, progressão de dificuldade e sincronização de eventos com a tela.

* **`waves.js`**  
  Tabela de agendamento de ondas temporais (`getCurrentWave`) e relógio de chefes (`checkBossSchedule`). Regula a taxa de spawn, tipos de monstros permitidos e densidade de hordas ao longo dos minutos de partida, além de agendar as invasões dos 4 chefes (aos 60s, 140s, 220s e 340s).

* **`ui.js`**  
  Ponte de comunicação entre a lógica do jogo e a árvore DOM. Gerencia os modais de abertura de cartas de aprimoramento (`levelUp`), interface do baú de recompensas (`openChestModal`), transição do menu de pausa com slider de áudio (`togglePause`), e cálculo e montagem dos dados estatísticos nas telas de derrota e de vitória final.

---

### 6. `src/render/` (Camada Visual Canvas 2D)

Módulos encarregados exclusivamente do desenho gráfico, sem interferir no estado ou na física da partida.

* **`environment.js`**  
  Renderização procedural do piso da arena através de uma função determinística de hash pseudoaleatório (`tileHash`). Adapta a estética do cenário aos 5 biomas temáticos (Industrial, Vampírico, Monólito, Ceifador e Abismo). Desenha marcas no solo como poças de ácido/fogo, manchas de sangue e brasas atmosféricas flutuantes.

* **`renderer.js`**  
  Pipeline principal de desenho no Canvas. Trata a compensação de resolução para telas de alta densidade de pixels (DPR), aplica tremor de tela (*screen shake*) e projeta os elementos relativos à câmera:
  * Geometria vetorial com animação procedural de passos, balanço de capa e corte de lâmina dos sobreviventes.
  * Modelagem vetorial de todos os tipos de monstros comuns, elites com auras temáticas e os 4 chefes.
  * Projéteis de heróis e inimigos, áreas telegrafadas de impacto de meteoros, lasers giratórios, livros orbitais protetores e números de dano flutuante com indicação de acertos críticos.

---

### 7. Ponto de Entrada

* **`src/main.js`**  
  Ponto de partida e orquestrador principal do jogo.
  * Inicializa o contexto gráfico, ouvintes de redimensionamento e o estado global (`gameState`).
  * Executa o loop principal de jogo com cálculo do tempo delta (`dt` / *frame delta time*).
  * Atualiza a física de movimento, cálculo de colisão espacial, inteligência artificial dos inimigos, coleta de itens e aplicação de dano.
  * Chama o pipeline de renderização visual e monitora condições de fim de jogo (derrota ou vitória suprema).

---

## Esquema de Controles

O jogo adapta automaticamente as entradas ativas sem exigir configurações manuais:

| Ação | Controles Desktop (Teclado e Mouse) | Controles Mobile (Touch) |
| :--- | :--- | :--- |
| **Movimentação** | Teclas `W, A, S, D` ou `Setas Direcionais` | Joystick analógico virtual dinâmico |
| **Poder Ativo** | Tecla `Espaço`, Tecla `E` ou `Botão Direito do Mouse` | Botão circular flutuante de habilidade |
| **Pausar / Retomar** | Teclas `Esc` ou `P` | Botão `⏸` no topo da HUD |
| **Ataque Básico** | Automático (visa os inimigos mais próximos) | Automático (visa os inimigos mais próximos) |

---

## Como Executar o Projeto Localmente

Como o projeto utiliza **ES6 Modules** nativos (`import` / `export`), os navegadores bloqueiam a execução direta pelo protocolo local de arquivos (`file:///`) por políticas de segurança (CORS). É necessário rodar o projeto por meio de um servidor HTTP local.

### Opção 1: Via extensão Live Server no VS Code (Recomendado)
1. Abra a pasta do projeto no **Visual Studio Code**.
2. Certifique-se de possuir a extensão **Live Server** instalada.
3. Clique com o botão direito no arquivo `index.html` e selecione **Open with Live Server**.

### Opção 2: Via Node.js (`npx`)
No terminal da raiz do projeto, execute:
`npx serve .`  
Em seguida, abra o endereço exibido no terminal (geralmente `http://localhost:3000`).

### Opção 3: Via Python
Se possuir o Python instalado, execute no terminal:
`python -m http.server 8000`  
Acesse no seu navegador: `http://localhost:8000`.