# Hord.io: Survivors Evolution

Jogo no estilo survivors desenvolvido em Vanilla JavaScript (ES6 Modules) e HTML5 Canvas, projetado com interface responsiva tanto para navegadores desktop quanto para dispositivos móveis com controles táteis dedicados[cite: 1].

---

## Estrutura de Pastas e Arquivos

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

## Responsabilidades dos Arquivos

### Raiz

* **index.html**: Estrutura semântica do projeto[cite: 1]. Contém o elemento `<canvas>`, as camadas de vinheta e congelamento, a HUD de combate (barras de vida, nível, tempo, chefe e abates), as estruturas de modais (seleção de sobrevivente, cartas de aprimoramento, baú de chefe, pausa com volume, tela de derrota e vitória suprema) e a importação modular do script via `type="module"`[cite: 1].
* **style.css**: Estilização visual completa[cite: 1]. Gerencia o bloqueio de rolagem e seleção acidental de toque, o desenho dos seletores e barras de progresso, gradientes da HUD, formatação de cartas de melhoria por nível de raridade (comum, raro e lendário) e a animação do botão de habilidade com máscara cônica de cooldown[cite: 1].

---

### `src/config/` (Configurações e Dados Estáticos)

Armazena tabelas de dados constantes e regras que não dependem do ciclo de execução em tempo real.

* **characters.js**: Catálogo com as definições dos 3 arquétipos de sobreviventes (`CHARACTERS`): Sir Roland (Paladino), Ignis (Piromante) e Kael (Andarilho Sombrio), guardando atributos base (HP, velocidade, recarga, dano, passivas e recarga de poder) e paleta cromática de vestimenta[cite: 1].
* **enemies.js**: Dicionário dos inimigos comuns e elites (`ENEMY_TYPES`), como zumbis, morcegos carmesim, autômatos artilheiros e divisores de células[cite: 1]. Também define a tabela de atributos e fases dos 4 grandes chefes (`BOSS_TYPES`): Lorde Vampírico, Monólito Abissal, Ceifador Supremo e Soberano do Abismo[cite: 1].
* **upgrades.js**: Catálogo das cartas de evolução tática (`upgradesPool`), métodos de filtragem e sorteio de opções (`getRandomUpgrades`) e as regras de sinergia para fusão de armas supremas (`checkSynergies`): Lâmina Dimensional, Santuário Celestial e Vórtice do Apocalipse[cite: 1].

---

### `src/core/` (Núcleo de Infraestrutura e Mecânicas de Baixo Nível)

Utilitários de sistema, processamento de entradas e estruturas de dados de alta performance.

* **audio.js**: Motor de áudio sintetizado procedural via Web Audio API[cite: 1]. Cria osciladores dinâmicos com filtros passa-baixa e curvas de ganho sem carregar arquivos de mídia externos, além de incluir o controle de volume master, progressão pentatônica para coleta de gemas e pulsos de feedback tátil para telas sensíveis ao toque (Haptic API)[cite: 1].
* **input.js**: Captura e normalização dos comandos de controle[cite: 1]. Implementa a matemática do joystick analógico flutuante em eventos touch, atalhos de teclado (barra de espaço para ativação de poder) e cancela interações padrão de navegadores móveis, como pinch-to-zoom e pull-to-refresh[cite: 1].
* **spatialGrid.js**: Implementação do particionamento espacial (*Spatial Hash Grid*)[cite: 1]. Agrupa os monstros em células de grade para permitir que projéteis e empurrões entre criaturas consultem apenas entidades adjacentes, reduzindo o custo computacional de $O(N^2)$ para $O(N)$ em hordas com centenas de unidades na tela[cite: 1].

---

### `src/entities/` (Personagens e Inimigos em Jogo)

Instanciação, estados dinâmicos e controle de atores dentro da arena.

* **player.js**: Armazena o estado dinâmico do sobrevivente ativo[cite: 1]. Controla posições, cálculo de experiência/nível, cadência de disparos automáticos (`fireWeapons`), computação de acertos críticos, halos de dano (Aura e Livros Orbitais), além da execução das habilidades especiais ativas (Investida Sagrada, Passo Ígneo e Bomba de Fumaça)[cite: 1].
* **enemies.js**: Fábrica de instanciação de adversários[cite: 1]. Gera enxames em torno da área do jogador (`spawnMobCluster`), gerencia mutações de monstros de elite, coordena o ritual de entrada de chefes com purificação de hordas menores (`triggerBossEncounter`) e distribui barris/tochas destrutíveis pelo mapa (`spawnProp`)[cite: 1].

---

### `src/systems/` (Regras de Jogo, Linha do Tempo e Interface)

Gerencia a progressão temporal, transições de estado e comunicação direta com os elementos do HTML.

* **waves.js**: Relógio do diretor de jogo da arena[cite: 1]. Determina a taxa de spawn, tipos de monstros permitidos e tamanho das hordas de acordo com o tempo decorrido, além de agendar a ativação pontual de cada um dos 4 chefes[cite: 1].
* **ui.js**: Controlador de interface[cite: 1]. Gerencia a abertura e o fechamento dos modais de escolha de cartas, tela de baú de tesouro com fusões ativas, modal de pausa, telas de morte ou vitória e os listeners dos botões interativos da aplicação[cite: 1].

---

### `src/render/` (Camada Visual Canvas 2D)

Responsável exclusivamente pela renderização dos gráficos, sem alterar variáveis de física ou regras do jogo.

* **environment.js**: Gerador procedural de terreno por meio de funções pseudoaleatórias (`tileHash`), aplicando texturas personalizadas para cada bioma da arena (Industrial, Vampírico, Monólito, Ceifador e Abismo)[cite: 1]. Desenha poças de ácido/fogo, manchas de sangue residuais e brasas atmosféricas flutuantes[cite: 1].
* **renderer.js**: Pipeline central de desenho vetorial[cite: 1]. Trata a câmera relativa, efeito de tremor de tela (*screen shake*), renderiza os sprites vetoriais dos heróis (com animações de passada e capa ondulante), monstros normais e chefes, áreas de perigo telegrafadas, orbes celestiais, projéteis e números flutuantes de dano[cite: 1].

---

### Ponto de Entrada

* **main.js**: Orquestrador do jogo (*Game Loop*)[cite: 1]. Inicializa as instâncias, calcula o intervalo de tempo delta (`dt`), executa as rotinas de colisão e atualização física a cada quadro, chama a função de renderização e coordena a reinicialização das partidas[cite: 1].

---

## Como Executar Localmente

Por utilizar a especificação oficial de **ES6 Modules** (`import` / `export`), os navegadores bloqueiam requisições de módulos rodando diretamente por arquivos locais (`file:///`). É necessário abrir o projeto por um servidor HTTP local.

1. Abra a pasta `Hord` no **Visual Studio Code**.
2. Instale a extensão **Live Server** (caso não a possua).
3. Clique com o botão direito sobre o arquivo `index.html` e selecione **Open with Live Server**.