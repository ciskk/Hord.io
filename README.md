# Hord.io: Survivors Evolution

Um jogo de sobrevivência e ação em hordas (*bullet heaven / survivors*) desenvolvido puramente em **Vanilla JavaScript**, utilizando **ES6 Modules** e **HTML5 Canvas 2D**.

O projeto foi construído sem dependências de frameworks externos ou bibliotecas de terceiros, priorizando:

- Alta performance de renderização
- Código modular
- Meta-progressão permanente
- Suporte híbrido nativo para desktop e dispositivos móveis

---

## Destaques Técnicos

- **Arquitetura Modular (ES6 Modules)**  
  Código 100% desacoplado em módulos com responsabilidades únicas, incluindo configurações, entidades, chefes dedicados, sistemas, infraestrutura e renderização.

- **Particionamento Espacial (*Spatial Hash Grid*)**  
  Otimização das rotinas de colisão e afastamento físico entre monstros, reduzindo a complexidade de `O(N²)` para `O(N)` com buffer estático e reaproveitamento de memória (*Zero Garbage Collection*).

- **Áudio Procedural em Tempo Real**  
  Síntese de áudio feita diretamente via **Web Audio API**, utilizando osciladores, envelopes de ganho e filtros passa-baixa/alta, eliminando a necessidade de arquivos externos `.mp3` ou `.wav`.

- **Meta-Progressão RPG (Árvore de Talentos)**  
  Economia de ouro persistente salva em `localStorage` para compra de aprimoramentos permanentes entre partidas:
  - Vida
  - Dano
  - Velocidade
  - Rerolls
  - Atração de Gemas

  Inclui opção de reset com reembolso integral de **100%**.

- **Controles Híbridos com Paridade Total**  
  Suporte simultâneo para:
  - Mobile: joystick virtual com bloqueio estrito de gestos acidentais no iOS Safari
  - Desktop: teclado WASD/setas e mouse

  Os métodos de controle funcionam sem interferência mútua.

- **Progressão, Minibosses e Sinergias**  
  Sistema composto por:
  - 10 ondas
  - 16 minibosses únicos
  - 4 chefes com máquinas de estado (FSM) complexas
  - 7 mecânicas de fusão de armas lendárias via baús de tesouro

---

## Estrutura do Projeto

```text
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
    │   ├── enemies.js
    │   └── bosses/
    │       ├── bossRegistry.js
    │       ├── vampireLord.js
    │       ├── abyssalMonolith.js
    │       ├── supremeReaper.js
    │       └── abyssSovereign.js
    ├── systems/
    │   ├── waves.js
    │   └── ui.js
    └── render/
        ├── renderer.js
        └── environment.js
```

---

# Responsabilidade dos Módulos

## 1. Arquivos de Raiz

### `index.html`

Estrutura semântica e casca da interface do jogo.

Declara:

- Tela principal `<canvas id="game-canvas">`
- Sobreposições de efeitos visuais
  - Vinheta de borda
  - Overlay de congelamento temporal
- HUD de combate
  - HP
  - Tempo de sobrevivência
  - Nível de poder
  - Abates
  - Contador de ouro
  - Barra de vida do chefe ativo
- Telas modais
  - Seleção de Sobrevivente
  - Árvore de Talentos
  - Cartas de Evolução/Upgrades
  - Baú do Chefe
  - Menu de Pausa com slider de volume
  - Tela de Morte
  - Vitória Suprema

O motor modular é carregado através de:

```html
<script type="module" src="./src/main.js">
```

### `style.css`

Camada responsável pelo layout responsivo e pelo bloqueio de comportamentos indesejados no mobile:

- `touch-action: none`
- `user-select: none`

Também estiliza:

- Cartões de melhorias por raridade
  - Comum
  - Raro
  - Lendário
- Árvore de talentos em grid flexível
- Máscara cônica em gradiente CSS utilizada no cooldown da habilidade ativa

---

## 2. `src/config/` — Configurações e Tabelas de Dados

Centraliza os parâmetros estáticos e constantes de balanceamento do jogo, separando o design de jogo das regras dinâmicas de código.

### `characters.js`

Configurações de atributos base, cores de vestimenta, armas iniciais e habilidades ativas dos **5 arquétipos de sobreviventes**.

#### Sir Roland — O Paladino

Reduz **20% do dano corpo a corpo** e reflete **50%** aos monstros.

- **Arma:** Martelo Sagrado
  - Impacto sísmico em área que anula projéteis inimigos
- **Habilidade:** Investida Sagrada
  - Avanço invulnerável que rasga os oponentes

#### Ignis — A Piromante

Especialista em ataques críticos que aplicam queimadura residual no solo.

- **Arma:** Cajado da Tormenta
- **Habilidade:** Passo Ígneo
  - Dash veloz com rastro de fogo e fantasmas térmicos

#### Kael — O Andarilho Sombrio

Possui amplificação de dano contra alvos enfraquecidos.

- **Arma:** Lâminas Espirituais
  - Lâminas teleguiadas
- **Habilidade:** Bomba de Fumaça
  - Invisibilidade contra inimigos normais
  - 100% de chance crítica durante 2 segundos

#### Kragdor — O Bárbaro Furioso

Recupera vida ao atingir hordas com o Machado Giratório orbital.

- **Arma:** Machado Giratório
- **Habilidade:** Rugido Ancestral
  - Atordoa monstros em área
  - Vaporiza projéteis
  - Entra em frenesi
  - Dobra a velocidade de rotação do turbilhão

#### Valéria — A Alquimista Cáustica

Especialista em controle de terreno.

- **Arma:** Frascos Cáusticos
  - Bombardeio balístico com predição de movimento
  - Cria poças corrosivas com efeito de lentidão
- **Habilidade:** Reagente Volátil
  - Salva radial de 6 frascos corrosivos

---

### `enemies.js`

Define as tabelas de criaturas presentes na arena.

#### `ENEMY_TYPES`

Monstros comuns e tropas de horda:

- Zumbi
- Morcego Carmesim
- Golem de Concreto
- Assassino Espectral
- Carniçal Ígneo
- Cultista das Sombras
- Autômato Artilheiro
- Guardião Blindado
- Parasitas Divisores

#### `MINI_BOSS_TYPES`

16 variantes de minibosses com comportamentos e ataques telegrafados únicos.

Exemplos:

- Gárgula de Sangue
- Demolidor Sísmico
- Matriarca Parasita
- Colosso Ferruginoso
- Fatiador Quântico
- Precursor do Vazio
- Arauto do Caos

#### `BOSS_TYPES`

As 4 ameaças colossais da arena:

1. Lorde Vampírico
2. Monólito Abissal
3. Ceifador Supremo
4. Soberano do Abismo

---

### `upgrades.js`

Gerencia o catálogo global de melhorias ativas/passivas (`upgradesPool`), o sorteio aleatório ponderado por subida de nível e as regras de fusão lendária de armas (`checkSynergies`).

#### ★ Lâmina Dimensional

**Lâminas Espirituais + Asas do Vento**

Espadas dimensionais gigantes com perfuração quádrupla.

#### ★ Tempestade de Aço

**Machado Giratório + Poder Bruto**

Anel orbital de 6 machados velozes.

#### ★ Dilúvio Biológico

**Frascos Cáusticos + Golpe Criogênico**

Salva concentrada que gera uma mega-zona tóxica congelante.

#### ★ Cataclismo Solar

**Cajado da Tormenta + Poder Bruto**

Supernovas que cobrem o chão de chamas.

#### ★ Martelo dos Titãs

**Martelo Sagrado + Armadura Rúnica**

Terremoto titânico de 360° com fissuras incandescentes profundas.

#### ★ Santuário Celestial

**Aura Sagrada + Armadura Rúnica**

Supernova radiante com raio expandido e regeneração contínua de HP.

#### ★ Vórtice do Apocalipse

**Bíblias Protetoras + Asas do Vento**

Órbita supersônica ininterrupta de 6 tomos sagrados.

---

## 3. `src/core/` — Núcleo de Infraestrutura

### `audio.js`

Motor sintetizador procedural baseado na **Web Audio API**.

Cria nós osciladores e curvas dinâmicas de ganho para:

- Tiros
- Impactos
- Cortes críticos
- Subidas de nível
- Pulso de singularidade
- Alertas sonoros de chefes

Não utiliza arquivos de áudio externos.

Também implementa:

- Escala musical pentatônica ascendente para coleta consecutiva de gemas
- Controle de volume mestre
- Resposta tátil em dispositivos compatíveis via **Vibration API**
- *Haptic Feedback*

### `input.js`

Gerenciador unificado de entradas.

Responsável por:

- Normalizar vetores de movimento (`inputX` e `inputY`)
- Suportar teclado WASD e Setas
- Evitar aceleração excessiva em diagonais
- Implementar joystick analógico virtual flutuante para telas sensíveis ao toque
- Mapear atalhos de ação

Controles de habilidades:

- Espaço
- E
- Botão Direito do Mouse

Controle de pausa:

- Esc
- P

### `spatialGrid.js`

Implementa uma estrutura de dados **Spatial Hash Grid 2D** utilizando células de `75px`.

Utiliza:

- Pool estático de coleções
- Identificadores numéricos de 32-bit
- Consultas rápidas de vizinhança
- Ausência de alocação contínua de memória em tempo de execução

---

## 4. `src/entities/` — Atores, Entidades e Chefes

### `player.js`

Mantém o ciclo de vida e o estado reativo do sobrevivente.

Gerencia:

- Posicionamento
- Vida
- Velocidade
- Nível de poder
- Mira
- Cadência de disparos automáticos
- Rotação de machados
- Execução de habilidades ativas

Também gerencia a **Meta-Progressão Permanente**, incluindo:

- Saldo de Ouro
- Níveis da Árvore de Talentos
- Persistência via `localStorage`

### `enemies.js`

Fábrica e gerenciador de inimigos na arena.

Responsável por:

- Nascimento de hordas via `spawnMobCluster`
- Limite estrito de entidades simultâneas
- `MAX_ACTIVE_ENEMIES = 110`
- Compressão de atributos fora da tela
- Spawn de minibosses via `spawnMiniBoss`
- Transição de cenários
- Expurgo do campo ao invocar chefes via `triggerBossEncounter`

### `bosses/` — Módulos Especializados de Chefes

#### `bossRegistry.js`

Padrão de registro utilizado para centralizar e delegar os ciclos de vida (`init`, `update` e `draw`) de cada chefe.

#### `vampireLord.js`

**Lorde Vampírico — Chefe 1**

IA baseada em:

- Teleporte predatório
- Disparos em espiral contínua
- Investida veloz em forma de névoa
- Corte frontal com foice

#### `abyssalMonolith.js`

**Monólito Abissal — Chefe 2**

IA baseada em:

- Litocistos Tectônicos orbitais destrutíveis
- Puxão gravitacional de singularidade
- Estilhaços
- Fendas sísmicas no solo

#### `supremeReaper.js`

**Ceifador Supremo — Chefe 3**

IA baseada em:

- Lanternas de almas como escudo físico
- Corte duplo em arco
- Teleporte com aviso antecipado de aterrissagem
- Colheita em vórtice

#### `abyssSovereign.js`

**Soberano do Abismo — Chefe Final**

Combate em múltiplas fases, incluindo:

- Âncoras dimensionais que mitigam dano
- Barreira retrátil do horizonte de eventos
- Disparos relativísticos
- Crucifixo de lasers giratórios

---

## 5. `src/systems/` — Regras de Negócio e Interface

### `waves.js`

Orquestrador temporal da partida.

Regula:

- Progressão ao longo das 10 ondas
- Taxa de surgimento
- Tipos de inimigos
- Agendamento dos chefes principais
- Aparições de minibosses temáticos

Chefes principais:

| Chefe | Tempo |
|---|---:|
| Lorde Vampírico | 60s |
| Monólito Abissal | 140s |
| Ceifador Supremo | 220s |
| Soberano do Abismo | 340s |

Os minibosses temáticos aparecem a cada minuto.

### `ui.js`

Ponte de integração entre o loop do jogo e os elementos do DOM.

Controla:

- Janelas de seleção de sobreviventes
- Árvore de Talentos
- Compras de talentos
- Reset da Árvore de Talentos com devolução de 100% do ouro
- Sorteio de cartas de aprimoramento
- Sistema de *Reroll*
- Baús de chefes
- Menu de pausa
- Telas de fim de jogo

---

## 6. `src/render/` — Camada Visual Canvas 2D

### `environment.js`

Renderizador procedural do solo através da função hash determinística `tileHash`.

Adapta texturas, grades e brasas aos 5 biomas temáticos da arena:

1. Industrial
2. Vampírico
3. Monólito
4. Ceifador
5. Abismo

Também desenha:

- Poças elementais
- Marcas de impacto

### `renderer.js`

Pipeline gráfico principal no **Canvas 2D**.

Responsável por:

- Compensação para telas de alta densidade de pixels (DPR)
- Tremor de tela (*screen shake*)
- Desenho vetorial de entidades e efeitos

#### Heróis

Renderiza as silhuetas e animações dos 5 heróis, incluindo:

- Capas fluidas
- Pernas com cinemática de passos
- Halos de fúria

#### Inimigos

Renderiza:

- Geometrias procedurais dos inimigos comuns
- As 16 formas personalizadas dos minibosses

#### Indicadores de Perigo

Renderiza ataques telegrafados, incluindo:

- Cones de foice
- Faixas de investida
- Anéis retráteis de meteoros
- Linhas de fissura

#### Efeitos de Combate

Renderiza:

- Textos de dano flutuante
- Diferenciação entre acertos normais e críticos
- Partículas de impacto
- Coleta de tesouros

---

## 7. Ponto de Entrada

### `src/main.js`

Ponto de partida da aplicação.

Responsável por:

- Inicializar contextos
- Capturar eventos de redimensionamento da janela
- Executar o loop de animação
- Calcular o delta time (`dt`)
- Processar a física global
- Comprimir gemas de experiência no chão
- Coletar consumíveis
- Monitorar condições de vitória e derrota

Consumíveis:

- Coração
- Super Ímã
- Relógio

---

# Esquema de Controles

O jogo adapta automaticamente os métodos de controle sem exigir configurações manuais.

| Ação | Desktop — Teclado e Mouse | Mobile — Touch |
|---|---|---|
| **Movimentação** | `W`, `A`, `S`, `D` ou Setas Direcionais | Joystick analógico virtual flutuante |
| **Poder Ativo** | `Espaço`, `E` ou Botão Direito do Mouse | Botão circular de habilidade na tela |
| **Pausar / Retomar** | `Esc` ou `P` | Botão `⏸` no topo da HUD |
| **Ataque Básico** | Automático, mirando no alvo mais próximo dentro do alcance | Automático, mirando no alvo mais próximo dentro do alcance |

---

# Como Executar o Projeto Localmente

Por utilizar **ES6 Modules** nativos (`import` / `export`), os navegadores modernos restringem o carregamento direto pelo protocolo de arquivos locais (`file:///`) devido às políticas de segurança de origem (CORS).

Por isso, é necessário executar o projeto através de um **servidor HTTP local**.

## Live Server no VS Code

1. Abra a pasta do projeto no **Visual Studio Code**.
2. Certifique-se de que a extensão **Live Server** está instalada.
3. Clique com o botão direito no arquivo `index.html`.
4. Selecione **Open with Live Server**.
