# Hord.io: Survivors Evolution

Hord.io: Survivors Evolution é um jogo de sobrevivência e ação em hordas no estilo *bullet heaven / survivors*, desenvolvido inteiramente com tecnologias web nativas.

O projeto utiliza:

- HTML5
- CSS3
- JavaScript moderno com ES6 Modules
- HTML5 Canvas 2D
- Web Audio API
- Vibration API
- `localStorage`

Não há frameworks, engines ou bibliotecas externas. A arquitetura foi organizada em módulos independentes para separar configuração, entidades, sistemas de jogo, infraestrutura, renderização e interface.

---

## Visão Geral

A partida coloca o jogador em uma arena fechada contra hordas progressivamente mais fortes.

O jogador:

1. Escolhe um dos 5 sobreviventes.
2. Entra na arena com uma arma inicial exclusiva.
3. Ataca automaticamente os inimigos dentro do alcance.
4. Coleta experiência e sobe de nível.
5. Escolhe aprimoramentos durante a partida.
6. Enfrenta minibosses e chefes principais.
7. Pode criar evoluções lendárias por meio de combinações específicas.
8. Acumula ouro persistente para melhorar atributos entre partidas.
9. Enfrenta o Soberano do Abismo como chefe final.
10. Vence após derrotar o chefe final e sobreviver à progressão completa das 10 ondas.

A partida possui progressão temporal, ondas com composições diferentes, esquadrões táticos, minibosses, chefes com máquinas de estados, telegráficos de ataque, projéteis, efeitos de área e sistemas de colisão física.

---

## Destaques Técnicos

### Arquitetura modular

O jogo é dividido em módulos ES6 com responsabilidades específicas.

A separação principal é:

- `config/` — dados e balanceamento
- `core/` — infraestrutura compartilhada
- `entities/` — jogador, inimigos e chefes
- `systems/` — regras de jogo e subsistemas
- `render/` — renderização do Canvas
- arquivos de raiz — inicialização, interface e estilos

O ponto de entrada é `src/main.js`.

### Canvas 2D

A renderização acontece diretamente em um `<canvas>` usando a API 2D.

O renderer possui suporte a:

- ajuste para `devicePixelRatio`
- resolução dinâmica da janela
- *screen shake*
- partículas
- textos de dano
- efeitos de impacto
- indicadores de perigo
- personagens desenhados proceduralmente
- inimigos desenhados proceduralmente
- minibosses personalizados
- renderização especializada para cada chefe

O DPR utilizado pelo canvas é limitado a 1.5 para equilibrar qualidade visual e desempenho.

### Particionamento espacial

`src/core/spatialGrid.js` implementa uma Spatial Hash Grid 2D.

A grade utiliza células de `75px` e permite consultar somente entidades próximas durante operações que não precisam testar todos os inimigos entre si.

O sistema utiliza:

- células espaciais
- buffer de índices reutilizável
- chaves numéricas
- consultas de vizinhança
- redução do número de verificações de colisão

Isso reduz significativamente o custo de operações de proximidade e ajuda a controlar a pressão de memória durante partidas com muitas entidades.

### Física e separação de multidões

`src/systems/physics.js` trata a separação física entre entidades.

O sistema diferencia:

- inimigos comuns
- inimigos Elite
- minibosses
- chefes
- sub-alvos de chefes
- estados especiais como investidas e teletransportes

O jogador também possui um sistema de abertura de caminho através das hordas.

Alguns estados de ataque recebem hiperarmadura para impedir que o início de uma animação seja cancelado pela física.

### Áudio procedural

`src/core/audio.js` cria os efeitos sonoros diretamente pela Web Audio API.

Não são necessários arquivos `.mp3` ou `.wav` externos.

O sistema produz efeitos para:

- disparos
- impactos
- críticos
- subida de nível
- gemas
- baús
- evolução
- chefes
- vitória
- dano
- efeitos alquímicos
- eventos especiais

A coleta consecutiva de gemas utiliza uma sequência musical pentatônica.

Também existe:

- controle de volume global
- inicialização do contexto de áudio
- feedback tátil quando suportado pelo dispositivo

### Controles híbridos

O mesmo jogo funciona com:

- teclado e mouse no desktop
- joystick virtual no touch
- botão de habilidade no mobile

A movimentação é normalizada para impedir vantagem artificial nas diagonais.

O CSS também bloqueia comportamentos de navegador que poderiam interferir com a experiência de jogo, como seleção de texto e gestos de toque.

---

## Conteúdo do Jogo

### 5 Sobreviventes

Cada personagem possui atributos, arma inicial e habilidade ativa próprios.

| Sobrevivente | Arma inicial | Característica |
|---|---|---|
| **Sir Roland** | Martelo Sagrado | Resistência e retaliação corpo a corpo |
| **Ignis** | Cajado da Tormenta | Críticos e queimaduras |
| **Kael** | Lâminas Espirituais | Alto dano contra inimigos enfraquecidos |
| **Kragdor** | Machado Giratório | Combate orbital e recuperação de HP |
| **Valéria** | Frascos Cáusticos | Controle de área e lentidão |

### Sir Roland — O Paladino

- Vida base: `252`
- Velocidade base: `3.2`
- Dano base: `46`
- Chance crítica: `15%`
- Arma: Martelo Sagrado
- Poder: Investida Sagrada

Passiva:

- reduz 20% do dano corpo a corpo
- reflete 50% do dano correspondente aos monstros

O martelo produz impactos em área, podendo anular projéteis inimigos e criar efeitos de fissura.

### Ignis — A Piromante

- Vida base: `147`
- Velocidade base: `3.5`
- Dano base: `36`
- Chance crítica: `28%`
- Arma: Cajado da Tormenta
- Poder: Passo Ígneo

Críticos de Ignis deixam queimaduras residuais no terreno.

O poder ativo funciona como um dash com imunidade e rastro de fogo.

### Kael — O Andarilho Sombrio

- Vida base: `175`
- Velocidade base: `3.7`
- Dano base: `35`
- Chance crítica: `24%`
- Arma: Lâminas Espirituais
- Poder: Bomba de Fumaça

Passiva:

- `1.5x` de dano contra inimigos abaixo de 35% de HP
- `1.15x` contra chefes nessas condições

A Bomba de Fumaça concede invisibilidade contra inimigos comuns e 100% de chance crítica durante 2 segundos.

### Kragdor — O Bárbaro Furioso

- Vida base: `308`
- Velocidade base: `3.1`
- Dano base: `54`
- Chance crítica: `18%`
- Arma: Machado Giratório
- Poder: Rugido Ancestral

O machado funciona como uma arma orbital.

A passiva de Kragdor permite recuperação de vida:

- 0.5% do HP máximo ao acertar a ponta do machado em chefes e elites, com recarga de 0.6s
- 1 HP a cada 18 acertos contra hordas comuns

O Rugido Ancestral atordoa inimigos, vaporiza projéteis e aumenta temporariamente a rotação do machado.

### Valéria — A Alquimista Cáustica

- Vida base: `182`
- Velocidade base: `3.4`
- Dano base: `43`
- Chance crítica: `20%`
- Arma: Frascos Cáusticos
- Poder: Reagente Volátil

Os frascos usam predição de movimento para lançar as poções à frente dos alvos.

O impacto cria poças corrosivas capazes de causar dano contínuo e lentidão.

---

## Arsenal e Aprimoramentos

O sistema de upgrades é controlado por `src/config/upgrades.js`.

Existem aprimoramentos específicos para armas e passivas universais.

### Aprimoramentos do Machado

- **Turbilhão Violento** — aumenta a velocidade orbital e o dano.
- **Machado Adicional** — adiciona machados ao anel orbital.
- **Gume Pesado** — aumenta o raio orbital e o dano.

### Aprimoramentos das Poções

- **Salvo Alquímico** — adiciona frascos concentrados ao lançamento.
- **Superposição Cáustica** — aumenta dano e área das poças.

### Aprimoramentos do Cajado

- **Cajado da Tormenta** — adiciona orbes místicos.
- **Poder da Fênix** — aumenta a perfuração das esferas e o dano.

### Aprimoramentos das Lâminas

- **Lâminas Espirituais** — adiciona espadas espectrais.
- **Gume Astral** — aumenta velocidade de voo e dano.

### Aprimoramentos do Martelo

- **Fenda Sísmica** — aumenta raio e dano do impacto.
- **Golpe Demolidor** — aumenta o dano de esmagamento.

### Passivas universais

- **Golpe Criogênico** — aumenta a chance de aplicar lentidão.
- **Poder Bruto** — +7% de dano global por aquisição, até 4 aquisições.
- **Fúria Rápida** — reduz recargas multiplicativamente, com teto de 45%.
- **Asas do Vento** — aumenta a velocidade de movimento.
- **Foco Letal** — aumenta chance e multiplicador crítico.
- **Ímã Titânico** — aumenta o raio de atração de gemas.
- **Aura Sagrada** — cria um campo de dano ao redor do jogador.
- **Bíblias Protetoras** — adiciona tomos orbitais.
- **Armadura Rúnica** — aumenta o HP máximo.
- **Poção Alquímica** — recupera 65% do HP.

Durante uma subida de nível, o jogador recebe 3 opções sorteadas entre os aprimoramentos disponíveis.

O sistema também possui *Rerolls*.

---

## Evoluções Lendárias

As evoluções são verificadas por `checkSynergies()`.

Uma evolução aparece quando os pré-requisitos correspondentes são atingidos.

### Lâmina Dimensional

**Lâminas Espirituais + Asas do Vento**

Requer:

- pelo menos 4 lâminas
- Asas do Vento

Resultado:

- espadas dimensionais gigantes
- perfuração quádrupla

### Tempestade de Aço

**Machado Giratório + Poder Bruto**

Requer:

- pelo menos 3 machados
- Poder Bruto

Resultado:

- 6 machados orbitais
- aumento adicional da velocidade orbital

### Dilúvio Biológico

**Frascos Cáusticos + Golpe Criogênico**

Requer:

- pelo menos 3 frascos
- pelo menos 15% de chance de lentidão

Resultado:

- 5 frascos concentrados
- mega-zona tóxica congelante

### Cataclismo Solar

**Cajado da Tormenta + Poder Bruto**

Requer:

- pelo menos 3 orbes
- Poder Bruto

Resultado:

- supernovas de plasma
- perfuração ampliada
- fogo residual no terreno

### Martelo dos Titãs

**Martelo Sagrado + Armadura Rúnica**

Requer:

- pelo menos 3 níveis do martelo
- Armadura Rúnica

Resultado:

- terremoto de 360°
- fissuras incandescentes

### Santuário Celestial

**Aura Sagrada + Armadura Rúnica**

Requer:

- Aura nível 5
- Armadura Rúnica

Resultado:

- supernova radiante
- área expandida
- regeneração de HP

### Vórtice do Apocalipse

**Bíblias Protetoras + Asas do Vento**

Requer:

- 4 tomos orbitais
- Asas do Vento

Resultado:

- 6 tomos supersônicos
- órbita contínua de alta velocidade

---

## Inimigos

Os inimigos comuns são definidos em `src/config/enemies.js`.

| Inimigo | Comportamento |
|---|---|
| Zumbi Operário | Perseguição |
| Morcego Carmesim | Enxame |
| Golem de Concreto | Tanque |
| Assassino Espectral | Investida |
| Carniçal Ígneo | Kamikaze |
| Cultista das Sombras | Invocador |
| Autômato Artilheiro | Atirador |
| Guardião Blindado | Protegido |
| Parasita Divisor | Divisor |
| Parasita Célula | Perseguição |

O jogo também possui variantes Elite com modificadores de comportamento, incluindo efeitos como lentidão e toxicidade.

---

## Esquadrões Táticos

`src/config/squads.js` define composições pré-configuradas de inimigos.

Os esquadrões atuais são:

- **Falange de Cerco**
- **Enxame em Pinça**
- **Esquadrão de Ruptura**
- **Bateria de Cerco**
- **Horda de Pressão**

Cada composição utiliza posições relativas ao jogador para criar formações específicas, em vez de simplesmente gerar inimigos individualmente.

---

## Minibosses

Existem 16 minibosses.

Cada um possui atributos próprios, comportamento específico, XP e recompensa em ouro.

### Lista

1. Gárgula de Sangue
2. Zumbi Alfa
3. Centurião da Guarda
4. Demolidor Sísmico
5. Torre Móvel
6. Incinerador Instável
7. Matriarca Parasita
8. Predador Espectral
9. Alto Sacerdote
10. Guardião Rúnico
11. Colosso Ferruginoso
12. Capitão de Cerco
13. Ninho Móvel
14. Fatiador Quântico
15. Precursor do Vazio
16. Arauto do Caos

Os minibosses possuem comportamentos como:

- dash
- escudo
- ataques de área
- disparos
- kamikaze
- divisão de inimigos
- gravidade
- aura de proteção
- lançamento de rochas
- morteiro
- invocação de morcegos
- teleporte
- vórtices
- ciclos de caos

---

## Chefes Principais

Existem 4 chefes principais, cada um implementado em um módulo próprio e registrado através de `bossRegistry.js`.

| # | Chefe | HP base | Dano |
|---|---|---:|---:|
| 1 | Lorde Vampírico | 9.500 | 30 |
| 2 | Monólito Abissal | 24.000 | 50 |
| 3 | Ceifador Supremo | 42.000 | 70 |
| 4 | Soberano do Abismo | 70.000 | 90 |

Os chefes utilizam máquinas de estados para separar perseguição, preparação de ataques, execução, recuperação, vulnerabilidade e transições especiais.

### Lorde Vampírico

Principais habilidades:

- Corte de foice
- Enxame
- Teleporte
- Investida em Névoa
- Barragem espiral
- Disparo em pinça
- Explosão de sangue

A Investida em Névoa possui estados próprios de preparação, deslocamento, pausa e frenagem.

### Monólito Abissal

O Monólito utiliza Litocistos Tectônicos como sub-alvos orbitais destrutíveis.

Principais habilidades:

- Fissuras
- Pulso sísmico
- Singularidade
- Barragem de basalto
- Puxão gravitacional

Os Litocistos possuem HP próprio e participam diretamente da luta.

### Ceifador Supremo

O Ceifador utiliza Lanternas Espirituais como sub-alvos orbitais.

Principais habilidades:

- Corte duplo
- Lâminas de almas
- Elo de almas
- Colheita em vórtice
- Teleporte fantasma

As lanternas possuem HP próprio e funcionam como elementos destrutíveis do combate.

### Soberano do Abismo

O chefe final possui um sistema de fases e estabilidade dimensional.

Fases:

- **Fase 1: Trono do Vazio**
- **Fase 2: Fratura do Horizonte**
- **Fase 3: Singularidade Primordial**

As transições ocorrem em:

- 70% de HP
- 30% de HP

O Soberano utiliza:

- Âncoras dimensionais
- Horizonte de eventos
- Singularidade
- Fendas do abismo
- Disparos relativísticos
- Crucifixo do vazio
- Teleporte do vazio
- Implosão de singularidade

Durante determinados colapsos de estabilidade, o chefe entra em estado vulnerável e sofre uma janela de recuperação.

---

## Enrage dos Chefes

Chefes possuem uma transição de fúria quando atingem menos de 45% de HP.

Nesse estado, o comportamento do chefe é intensificado e a interface destaca visualmente a barra de vida.

A implementação também utiliza estados específicos de recuperação e vulnerabilidade para criar janelas de risco e recompensa.

---

## Progressão de Ondas

`src/systems/waves.js` controla a progressão temporal da partida.

Existem 10 ondas:

| Onda | Período | Nome |
|---:|---|---|
| 1 | 0–25s | Reconhecimento |
| 2 | 25–55s | Revoada Carmesim |
| 3 | 55–90s | Batalhão Blindado |
| 4 | 90–130s | Fogo Cruzado Industrial |
| 5 | 130–170s | Praga Rastejante |
| 6 | 170–210s | Rito das Sombras |
| 7 | 210–250s | Cerco de Gigantes |
| 8 | 250–290s | Enxame Aberrante |
| 9 | 290–330s | Tempestade do Vazio |
| 10 | 330s+ | O Julgamento Final |

A cada onda, a composição de inimigos, tamanho dos grupos, cadência de spawn e chance de Elite aumentam progressivamente.

---

## Agendamento de Chefes

O primeiro chefe aparece aos 60 segundos.

Depois disso, o próximo chefe não é baseado simplesmente no relógio absoluto da partida.

Quando um chefe é derrotado:

1. A duração da luta é calculada.
2. O próximo chefe recebe seu atraso configurado a partir do momento da morte do chefe anterior.
3. Os minibosses ainda não gerados também têm seus horários deslocados pela duração da luta.
4. As hordas voltam a ser liberadas após a resolução do encontro.

A fila utiliza:

| Chefe | Atraso após o chefe anterior |
|---|---:|
| Lorde Vampírico | 60s |
| Monólito Abissal | 80s |
| Ceifador Supremo | 80s |
| Soberano do Abismo | 120s |

Isso evita que um chefe seja simplesmente substituído por outro porque o relógio da partida chegou ao próximo marco enquanto a luta anterior ainda estava acontecendo.

---

## Sistema de XP

As gemas concedem experiência ao jogador.

Ao subir de nível:

- o jogo é pausado
- o jogador recebe 3 opções de aprimoramento
- o jogador pode usar *Rerolls* quando disponíveis
- a partida continua após a escolha

A próxima quantidade necessária de XP utiliza uma curva progressiva baseada no nível:

```js
player.nextXp = 12 + (player.level * 7) + Math.floor(Math.pow(player.level, 1.28));
```

---

## Ouro e Meta-Progressão

O ouro é persistido através de `localStorage`.

O jogador possui uma Árvore de Talentos permanente entre partidas.

### Talentos

| Talento | Máximo | Bônus |
|---|---:|---|
| Vitalidade Rúnica | 10 | +3% Vida por nível |
| Passos Ligeiros | 10 | +2% Velocidade por nível |
| Poder Ancestral | 10 | +5% Dano por nível |
| Destino Favorável | 3 | +1 Reroll por nível |
| Ímã do Vazio | 10 | +15 Raio de Atração por nível |

A árvore utiliza custos escalonados.

Também existe uma função de reset que devolve integralmente o ouro investido na árvore.

---

## Recompensas

Inimigos podem conceder ouro persistente.

Minibosses fornecem recompensas maiores e abrem um baú de Elite com um aprimoramento.

Chefes principais fornecem:

- XP
- ouro
- baú de chefe
- possibilidade de evolução lendária
- 2 aprimoramentos adicionais

O baú do chefe verifica automaticamente as sinergias disponíveis e aplica uma evolução lendária quando houver uma válida.

---

## Consumíveis

A arena pode gerar três tipos de consumíveis:

- **Coração** — recuperação de vida
- **Super Ímã** — atração de gemas
- **Relógio** — efeito temporal

Os consumíveis possuem duração limitada no chão e são coletados pelo jogador ao entrar em contato com eles.

---

## Sistema de Combate

O combate é dividido em subsistemas especializados.

### Ataques automáticos

As armas procuram automaticamente inimigos dentro de seu alcance.

O sistema prioriza sub-alvos de chefes quando apropriado, como:

- Litocistos
- Lanternas Espirituais

As armas principais incluem:

- Martelo
- Cajado
- Espadas
- Poções
- Machado orbital

### Críticos

O dano crítico utiliza o multiplicador armazenado em `player.critMult`.

O valor inicial é `1.5x`.

A passiva de Kael e habilidades específicas podem alterar a chance de crítico durante determinadas situações.

### Adrenalina corpo a corpo

Ataques de determinadas armas recebem uma amplificação quando o jogador está próximo do chefe ou de seus sub-alvos.

A distância utilizada é de até `130px`.

Também existem multiplicadores específicos durante estados de vulnerabilidade.

### Projéteis inimigos

O sistema mantém um limite de:

```js
MAX_CONCURRENT_ENEMY_BULLETS = 14;
```

Isso impede que a quantidade de projéteis inimigos cresça indefinidamente.

### Poças e áreas persistentes

O sistema de projéteis também administra áreas persistentes:

- ácido
- fogo
- poças alquímicas
- efeitos de lentidão

As áreas podem causar dano contínuo enquanto uma entidade permanece dentro delas.

---

## Sistema de Telegrafia

Ataques perigosos dos chefes possuem estados de preparação antes da execução.

Esses indicadores permitem ao jogador identificar visualmente ataques como:

- cones de foice
- linhas de investida
- fissuras
- anéis de meteoros
- áreas de singularidade
- ondas de choque
- ataques direcionados

O sistema separa preparação, execução e recuperação para evitar que ataques poderosos aconteçam sem indicação visual.

---

## Ambientes

`src/render/environment.js` cria o terreno proceduralmente usando `tileHash`.

A arena possui 5 temas:

1. Industrial
2. Vampírico
3. Monólito
4. Ceifador
5. Abismo

O ambiente também pode renderizar:

- brasas
- grades
- texturas procedurais
- poças elementais
- marcas de impacto
- elementos decorativos específicos de cada arena

---

## Interface

`index.html` fornece a estrutura da interface.

A HUD apresenta:

- HP
- tempo de sobrevivência
- nível
- abates
- ouro
- barra de XP
- onda atual
- barra de HP do chefe

Os modais incluem:

- seleção de sobrevivente
- árvore de talentos
- seleção de aprimoramentos
- tesouro de chefe
- pausa
- morte
- vitória

A barra de vida dos chefes também pode exibir:

- marcadores de 70% e 30%
- fase atual
- estado de colapso de estabilidade do Soberano do Abismo

---

## Estrutura do Projeto

```text
Hord/
├── index.html
├── style.css
├── README.md
└── src/
    ├── main.js
    │
    ├── config/
    │   ├── characters.js
    │   ├── enemies.js
    │   ├── squads.js
    │   └── upgrades.js
    │
    ├── core/
    │   ├── audio.js
    │   ├── input.js
    │   ├── math.js
    │   └── spatialGrid.js
    │
    ├── entities/
    │   ├── enemies.js
    │   ├── player.js
    │   └── bosses/
    │       ├── bossRegistry.js
    │       ├── vampireLord.js
    │       ├── abyssalMonolith.js
    │       ├── supremeReaper.js
    │       └── abyssSovereign.js
    │
    ├── systems/
    │   ├── combat.js
    │   ├── physics.js
    │   ├── projectiles.js
    │   ├── ui.js
    │   └── waves.js
    │
    └── render/
        ├── environment.js
        └── renderer.js
```

---

## Responsabilidade dos Módulos

### Arquivos de raiz

#### `index.html`

Define a estrutura da página, Canvas, HUD, botões, modais e elementos de interface.

Também configura metadados para experiência mobile e carrega:

```html
<script type="module" src="./src/main.js"></script>
```

#### `style.css`

Controla:

- layout responsivo
- HUD
- modais
- cartas de upgrade
- raridades
- árvore de talentos
- botão de habilidade
- barras
- elementos de interface
- comportamento touch
- adaptação para diferentes proporções de tela

---

### `src/config/`

#### `characters.js`

Contém os dados dos 5 sobreviventes:

- atributos
- arma inicial
- habilidade
- cores
- vida
- velocidade
- dano
- críticos
- alcance
- recarga

#### `enemies.js`

Contém as tabelas de:

- inimigos comuns
- minibosses
- chefes principais

É o principal ponto de configuração dos atributos básicos das entidades.

#### `squads.js`

Define as formações táticas utilizadas pelos spawns de horda.

#### `upgrades.js`

Contém:

- catálogo de upgrades
- raridades
- regras de disponibilidade
- sorteio ponderado
- aplicação dos upgrades
- verificações de sinergias lendárias

---

### `src/core/`

#### `audio.js`

Gerencia áudio procedural, volume e feedback tátil.

#### `input.js`

Unifica:

- teclado
- mouse
- touch
- joystick virtual
- ações de habilidade
- pausa

#### `math.js`

Centraliza operações matemáticas utilizadas por diversos sistemas:

- `clamp`
- `lerp`
- distância entre vetores
- comprimento de vetores
- normalização
- produto escalar
- distância entre ponto e segmento

#### `spatialGrid.js`

Implementa a Spatial Hash Grid utilizada para consultas rápidas de vizinhança.

---

### `src/entities/`

#### `player.js`

Gerencia:

- estado do jogador
- atributos
- armas
- ataque automático
- habilidades
- machados orbitais
- XP
- críticos
- progressão durante a partida
- ouro persistente
- árvore de talentos
- meta-progressão
- evoluções de armas

#### `enemies.js`

Gerencia:

- criação de inimigos
- spawn de grupos
- esquadrões
- minibosses
- chefes
- pontos de spawn
- limite de entidades
- recompensas
- integração com os registros de chefes

---

### `src/entities/bosses/`

#### `bossRegistry.js`

Faz a ponte entre a entidade genérica de chefe e seu módulo especializado.

Cada chefe possui funções próprias de:

- inicialização
- atualização
- renderização

#### `vampireLord.js`

IA e renderização do Lorde Vampírico.

#### `abyssalMonolith.js`

IA e renderização do Monólito Abissal e seus Litocistos.

#### `supremeReaper.js`

IA e renderização do Ceifador Supremo e suas Lanternas.

#### `abyssSovereign.js`

IA, fases, estabilidade, âncoras e renderização do Soberano do Abismo.

---

### `src/systems/`

#### `combat.js`

Responsável por:

- ataques corpo a corpo dos inimigos
- alvos
- dano
- textos de dano
- partículas
- sangue
- estados de ataque

#### `physics.js`

Resolve:

- separação entre inimigos
- colisões físicas
- abertura de caminho
- empurrões
- interações especiais de movimento

#### `projectiles.js`

Gerencia:

- projéteis do jogador
- projéteis inimigos
- poças
- impactos
- dano contínuo
- limite de projéteis simultâneos

#### `waves.js`

Gerencia:

- ondas
- cronograma
- minibosses
- chefes
- duração dos encontros
- progressão temporal

#### `ui.js`

Integra o estado do jogo ao DOM e gerencia:

- seleção de personagem
- árvore de talentos
- compras
- upgrades
- rerolls
- baús
- pausa
- morte
- vitória
- ferramenta de teste de chefes

---

### `src/render/`

#### `environment.js`

Renderiza o terreno e os elementos ambientais proceduralmente.

#### `renderer.js`

É o pipeline visual principal do Canvas.

Renderiza:

- jogador
- inimigos
- minibosses
- chefes
- projéteis
- efeitos
- partículas
- telegráficos
- tesouros
- indicadores de perigo

---

## Ponto de Entrada

`src/main.js` coordena o loop principal da aplicação.

Suas responsabilidades incluem:

- inicializar o Canvas
- ajustar o tamanho da tela
- calcular `dt`
- atualizar o jogador
- executar armas
- atualizar projéteis
- atualizar inimigos
- atualizar chefes
- processar física
- atualizar ondas
- controlar spawns
- processar XP
- processar ouro
- atualizar consumíveis
- verificar morte
- verificar vitória
- atualizar a HUD
- chamar o renderer

O fluxo geral da partida é aproximadamente:

```text
Entrada
   ↓
Atualização do jogador
   ↓
Armas e projéteis
   ↓
Chefes e inimigos
   ↓
Física e colisões
   ↓
XP / ouro / drops
   ↓
Ondas e spawns
   ↓
HUD
   ↓
Renderização
   ↓
Próximo frame
```

---

## Controles

| Ação | Desktop | Mobile |
|---|---|---|
| Movimentação | `W`, `A`, `S`, `D` ou Setas | Joystick virtual |
| Poder ativo | `Espaço`, `E` ou Botão Direito | Botão circular |
| Pausar | `Esc` ou `P` | Botão `⏸` |
| Ataque básico | Automático | Automático |

O ataque básico não precisa ser acionado manualmente: o personagem procura automaticamente alvos dentro do alcance da arma equipada.

---

## Como Executar Localmente

O projeto utiliza ES6 Modules nativos.

Por causa das políticas de segurança de origem dos navegadores, módulos ES6 não devem ser executados diretamente através de:

```text
file:///
```

Execute o projeto através de um servidor HTTP local.

### VS Code + Live Server

1. Abra a pasta do projeto no Visual Studio Code.
2. Instale a extensão Live Server.
3. Abra `index.html`.
4. Clique com o botão direito no arquivo.
5. Selecione **Open with Live Server**.
6. O navegador abrirá o jogo através de um endereço HTTP local.

Também é possível utilizar qualquer outro servidor HTTP local compatível com arquivos estáticos.

---

## Requisitos

O jogo foi projetado para navegadores modernos com suporte a:

- ES6 Modules
- HTML5 Canvas 2D
- Web Audio API
- `localStorage`
- Pointer/Touch Events
- Vibration API quando disponível

Nenhuma etapa de compilação ou instalação de dependências é necessária.

---

## Princípios de Arquitetura

O projeto segue alguns princípios importantes:

### Separação de responsabilidades

Configuração, lógica, física, renderização e interface são mantidas em módulos diferentes.

### Dados separados da lógica

Atributos de personagens, inimigos, minibosses, chefes, esquadrões e upgrades ficam principalmente nos arquivos de configuração.

### Sistemas especializados

Combate, física, projéteis, ondas, entrada e áudio possuem seus próprios subsistemas.

### Chefes desacoplados

Cada chefe possui seu próprio módulo de IA e renderização, enquanto `bossRegistry.js` fornece uma interface comum.

### Renderização procedural

Grande parte dos elementos visuais é desenhada diretamente pelo Canvas, sem depender de sprites externos.

### Compatibilidade multiplataforma

O mesmo núcleo de jogo suporta desktop e dispositivos touch.

---

## Estado Atual do Projeto

O projeto atualmente contém:

- 5 sobreviventes
- 5 armas iniciais
- 10 ondas
- 10 tipos de inimigos comuns, incluindo uma variante de Parasita
- 16 minibosses
- 5 esquadrões táticos
- 4 chefes principais
- 7 evoluções lendárias
- árvore de talentos permanente
- sistema de ouro persistente
- rerolls
- consumíveis
- projéteis do jogador e inimigos
- áreas de dano persistentes
- telegráficos de ataques
- máquinas de estados para chefes
- múltiplas fases do chefe final
- ambientes temáticos
- áudio procedural
- feedback tátil
- suporte desktop e mobile
- ferramenta interna de teste de chefes

---

## Arquivos Principais

| Arquivo | Função |
|---|---|
| `src/main.js` | Loop e orquestração geral |
| `src/config/characters.js` | Personagens |
| `src/config/enemies.js` | Inimigos, minibosses e chefes |
| `src/config/squads.js` | Formações táticas |
| `src/config/upgrades.js` | Upgrades e evoluções |
| `src/entities/player.js` | Estado e progressão do jogador |
| `src/entities/enemies.js` | Spawn e gerenciamento de inimigos |
| `src/entities/bosses/bossRegistry.js` | Registro de chefes |
| `src/entities/bosses/vampireLord.js` | Lorde Vampírico |
| `src/entities/bosses/abyssalMonolith.js` | Monólito Abissal |
| `src/entities/bosses/supremeReaper.js` | Ceifador Supremo |
| `src/entities/bosses/abyssSovereign.js` | Soberano do Abismo |
| `src/systems/combat.js` | Combate |
| `src/systems/physics.js` | Física |
| `src/systems/projectiles.js` | Projéteis e áreas |
| `src/systems/waves.js` | Ondas e cronogramas |
| `src/systems/ui.js` | Interface e menus |
| `src/core/audio.js` | Áudio procedural |
| `src/core/input.js` | Controles |
| `src/core/math.js` | Matemática auxiliar |
| `src/core/spatialGrid.js` | Particionamento espacial |
| `src/render/environment.js` | Ambiente |
| `src/render/renderer.js` | Renderização principal |

---

## Licença

Este repositório não define uma licença de código no estado atual do projeto.
