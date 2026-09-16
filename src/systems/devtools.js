/**
 * src/systems/devtools.js
 * Console Secreto de Desenvolvedor & Sandbox de Testes (Atalho W + 5)
 * Totalmente invisível na UI normal (sem botões públicos).
 */

import { BOSS_TYPES, MINI_BOSS_TYPES } from '../config/enemies.js';
import { grantLevels } from '../config/upgrades.js';
import { player, addPersistentGold, getPersistentGold } from '../entities/player.js';
import { playSfx } from '../core/audio.js';
import { 
  launchBossTest, 
  launchMiniBossTest, 
  closeBossSelectModal 
} from './ui.js';
import { 
  purgeAllNormalEnemies, 
  triggerSuperMagnet, 
  warpToWaveTime 
} from '../main.js';

export const devCheats = {
  godMode: false,
  zeroCooldown: false,
  gameSpeed: 1.0,
  selectedLevel: 50,
  activeTab: 'encounters', // 'encounters' | 'cheats' | 'waves'
  minibossSearch: '',
  minibossCategory: 'all',
  isMinibossAccordionOpen: false
};

let toastTimeout = null;

/**
 * Exibe notificação flutuante temporária para ações do desenvolvedor
 */
export function showDevToast(message, isWarning = false) {
  let toast = document.getElementById('dev-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dev-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = message;
  toast.className = 'dev-toast show' + (isWarning ? ' dev-toast-warn' : '');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/**
 * Alterna o Modo Deus (God Mode)
 */
export function toggleGodMode() {
  devCheats.godMode = !devCheats.godMode;
  if (devCheats.godMode) {
    player.hp = player.maxHp;
    player.iFrames = 999999;
    showDevToast('🛡️ <b>Modo Deus:</b> ATIVADO (Imortalidade)');
    playSfx('level');
  } else {
    player.iFrames = 0;
    showDevToast('🛡️ <b>Modo Deus:</b> DESATIVADO');
    playSfx('hit');
  }
  updateCheatsUI();
}

/**
 * Alterna Recarga Zero (Zero CD para Habilidades)
 */
export function toggleZeroCooldown() {
  devCheats.zeroCooldown = !devCheats.zeroCooldown;
  if (devCheats.zeroCooldown) {
    player.skillCd = 0;
    showDevToast('⚡ <b>Zero Cooldown:</b> ATIVADO');
    playSfx('level');
  } else {
    showDevToast('⚡ <b>Zero Cooldown:</b> DESATIVADO');
    playSfx('hit');
  }
  updateCheatsUI();
}

/**
 * Aplica cura completa imediata ao herói
 */
export function healPlayerFull() {
  player.hp = player.maxHp;
  if (player.slowTimer) player.slowTimer = 0;
  showDevToast(`❤️ <b>Cura Plena:</b> Vida restaurada para ${player.maxHp} HP!`);
  playSfx('level');
}

/**
 * Concede rolagens de cartas extras
 */
export function grantExtraRerolls(count = 5) {
  player.rerolls = (player.rerolls || 0) + count;
  const countEl = document.getElementById('reroll-count');
  if (countEl) countEl.innerText = player.rerolls;
  showDevToast(`🎲 <b>+${count} Rerolls</b> concedidos! Total: ${player.rerolls}`);
  playSfx('level');
}

/**
 * Adiciona ouro persistente ao cofre
 */
export function addDevGold(amount = 1000) {
  const next = addPersistentGold(amount);
  showDevToast(`💰 <b>+${amount.toLocaleString('pt-BR')} Ouro!</b> Total: ${next.toLocaleString('pt-BR')}`);
  playSfx('chest_rare');
}

/**
 * Define a velocidade global do motor de jogo
 */
export function setGameSpeed(speed) {
  devCheats.gameSpeed = speed;
  showDevToast(`⏩ <b>Velocidade do Jogo:</b> ${speed}x`);
  playSfx('level');
  updateGameSpeedUI();
}

/**
 * Aplica a quantidade selecionada no slider diretamente ao herói em jogo
 */
export function applyLevelToCurrentHero() {
  const lvl = devCheats.selectedLevel;
  grantLevels(lvl);
  showDevToast(`✨ <b>+${lvl} Níveis & Upgrades</b> concedidos ao herói!`);
  playSfx('level');
}

/**
 * Mapeamento e categorização dos 16 minibosses
 */
const MINIBOSS_META = {
  BLOOD_GARGOYLE:   { cat: 'dash', label: 'Investida Sangrenta' },
  ZOMBIE_ALPHA:     { cat: 'chase', label: 'Perseguição Voraz' },
  PHALANX_LEADER:   { cat: 'tank', label: 'Escudo Blindado' },
  SEISMIC_SMASHER:  { cat: 'tank', label: 'Pisotão Sísmico' },
  ARTILLERY_MECH:   { cat: 'ranged', label: 'Torre Balística' },
  FIRE_INCINERATOR: { cat: 'ranged', label: 'Chamas Kamikaze' },
  BROOD_MATRIARCH:  { cat: 'chaos', label: 'Ninho de Parasitas' },
  SPECTRAL_STALKER: { cat: 'dash', label: 'Salto pelas Costas' },
  HIGH_OCCULTIST:   { cat: 'chaos', label: 'Ritual Gravitacional' },
  RUNIC_WARDEN:     { cat: 'tank', label: 'Aura Protetora' },
  RUST_COLOSSUS:    { cat: 'tank', label: 'Arremesso de Rocha' },
  SIEGE_CAPTAIN:    { cat: 'ranged', label: 'Barragem de Morteiro' },
  MOBILE_HIVE:      { cat: 'chaos', label: 'Enxame de Morcegos' },
  QUANTUM_SLICER:   { cat: 'dash', label: 'Teleporte & Golpe' },
  VOID_PRECURSOR:   { cat: 'chaos', label: 'Vórtice do Vazio' },
  CHAOS_HERALD:     { cat: 'chaos', label: 'Ciclo do Caos' }
};

/**
 * Renderiza todo o conteúdo do modal de DevTools
 */
export function renderDevToolsModal() {
  const container = document.getElementById('devtools-content');
  if (!container) return;

  renderTabsNav();
  renderActiveTab();
}

function renderTabsNav() {
  const tabsContainer = document.getElementById('devtools-tabs');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = `
    <button class="dev-tab-btn ${devCheats.activeTab === 'encounters' ? 'active' : ''}" data-tab="encounters">
      ⚔️ ENCONTROS & BOSSES
    </button>
    <button class="dev-tab-btn ${devCheats.activeTab === 'cheats' ? 'active' : ''}" data-tab="cheats">
      🧪 CHEATS & HACKS
    </button>
    <button class="dev-tab-btn ${devCheats.activeTab === 'waves' ? 'active' : ''}" data-tab="waves">
      🌊 ONDAS & RECURSOS
    </button>
  `;

  tabsContainer.querySelectorAll('.dev-tab-btn').forEach(btn => {
    btn.onclick = () => {
      devCheats.activeTab = btn.getAttribute('data-tab');
      renderTabsNav();
      renderActiveTab();
    };
  });
}

function renderActiveTab() {
  const content = document.getElementById('devtools-tab-pane');
  if (!content) return;
  content.innerHTML = '';

  if (devCheats.activeTab === 'encounters') {
    renderEncountersTab(content);
  } else if (devCheats.activeTab === 'cheats') {
    renderCheatsTab(content);
  } else if (devCheats.activeTab === 'waves') {
    renderWavesTab(content);
  }
}

/**
 * ========================================================
 * ABA 1: ENCONTROS (Slider + 4 Bosses + Accordion Minibosses)
 * ========================================================
 */
function renderEncountersTab(container) {
  // 1. Slider de Seleção de Níveis (Obrigatório)
  const sliderSection = document.createElement('div');
  sliderSection.className = 'dev-slider-section';
  sliderSection.innerHTML = `
    <div class="dev-slider-header">
      <div class="dev-slider-title-group">
        <span class="dev-tag-pill">AJUSTE DE PODER</span>
        <span class="dev-slider-label">NÍVEL PARA TESTE DO HERÓI:</span>
      </div>
      <div class="dev-slider-readout" id="dev-level-readout">NV ${devCheats.selectedLevel}</div>
    </div>

    <div class="dev-slider-track-wrap">
      <input type="range" id="dev-level-slider" class="dev-slider-input" min="1" max="100" value="${devCheats.selectedLevel}" step="1">
    </div>

    <div class="dev-presets-row">
      <div class="dev-presets-chips">
        <button class="dev-preset-chip" data-lvl="1">Nv. 1 (Base)</button>
        <button class="dev-preset-chip" data-lvl="25">Nv. 25</button>
        <button class="dev-preset-chip" data-lvl="50">Nv. 50 (Padrão)</button>
        <button class="dev-preset-chip" data-lvl="75">Nv. 75</button>
        <button class="dev-preset-chip" data-lvl="100">Nv. 100 (Max)</button>
      </div>
      <button class="dev-btn-apply-hero" id="dev-btn-apply-hero" title="Aplica os upgrades selecionados no herói agora na partida">
        ✨ Aplicar Nível ao Herói Agora
      </button>
    </div>
  `;

  container.appendChild(sliderSection);

  // Eventos do Slider
  const slider = sliderSection.querySelector('#dev-level-slider');
  const readout = sliderSection.querySelector('#dev-level-readout');
  const applyBtn = sliderSection.querySelector('#dev-btn-apply-hero');

  slider.oninput = (e) => {
    const val = parseInt(e.target.value, 10);
    devCheats.selectedLevel = val;
    readout.innerText = `NV ${val}`;
    updateActionButtonsLevelText();
  };

  sliderSection.querySelectorAll('.dev-preset-chip').forEach(chip => {
    chip.onclick = () => {
      const lvl = parseInt(chip.getAttribute('data-lvl'), 10);
      devCheats.selectedLevel = lvl;
      slider.value = lvl;
      readout.innerText = `NV ${lvl}`;
      updateActionButtonsLevelText();
    };
  });

  applyBtn.onclick = () => {
    applyLevelToCurrentHero();
  };

  // 2. Chefes Supremos de Fase (Grid de 4 Cards)
  const bossHeader = document.createElement('div');
  bossHeader.className = 'dev-section-title';
  bossHeader.innerHTML = `
    <span>⚔️ CHEFES SUPREMOS DE FASE (1 A 4)</span>
    <span class="dev-title-sub">Encontros Colossais com Mecânicas FSM</span>
  `;
  container.appendChild(bossHeader);

  const bossesGrid = document.createElement('div');
  bossesGrid.className = 'dev-bosses-grid';

  Object.keys(BOSS_TYPES).forEach(id => {
    const boss = BOSS_TYPES[id];
    const card = document.createElement('div');
    card.className = 'dev-boss-card';
    card.style.setProperty('--boss-color', boss.color || '#a855f7');

    card.innerHTML = `
      <div class="dev-boss-header">
        <div class="dev-boss-avatar" style="background: ${boss.color}22; border-color: ${boss.color}; color: ${boss.color};">
          #${id}
        </div>
        <div class="dev-boss-info">
          <div class="dev-boss-name" style="color: ${boss.color};">${boss.name}</div>
          <div class="dev-boss-stats">
            <span>❤️ ${boss.hp.toLocaleString('pt-BR')} HP</span>
            <span>💥 Dano: ${boss.damage}</span>
            ${boss.isFinalBoss ? '<span class="dev-badge-final">FINAL BOSS</span>' : ''}
          </div>
        </div>
      </div>
      <div class="dev-boss-actions">
        <button class="dev-btn-test-normal" data-boss-id="${id}">
          ⚔️ Nível Atual
        </button>
        <button class="dev-btn-test-boost" data-boss-id="${id}">
          ⚡ Nv. ${devCheats.selectedLevel}
        </button>
      </div>
    `;

    const normalBtn = card.querySelector('.dev-btn-test-normal');
    const boostBtn = card.querySelector('.dev-btn-test-boost');

    normalBtn.onclick = () => {
      launchBossTest(Number(id), 0);
    };

    boostBtn.onclick = () => {
      launchBossTest(Number(id), devCheats.selectedLevel);
    };

    bossesGrid.appendChild(card);
  });

  container.appendChild(bossesGrid);

  // 3. Minibosses de Elite - Lista Sanfona (Accordion) (Obrigatório)
  const accordionContainer = document.createElement('div');
  accordionContainer.className = 'dev-accordion-container' + (devCheats.isMinibossAccordionOpen ? ' open' : '');

  const totalMinibosses = Object.keys(MINI_BOSS_TYPES).length;

  accordionContainer.innerHTML = `
    <div class="dev-accordion-header" id="dev-accordion-toggle">
      <div class="dev-acc-header-left">
        <span class="dev-acc-icon">👾</span>
        <span class="dev-acc-title">MINIBOSSES DE ELITE</span>
        <span class="dev-acc-count">${totalMinibosses} ARQUÉTIPOS</span>
      </div>
      <div class="dev-acc-header-right">
        <span class="dev-acc-state-hint">${devCheats.isMinibossAccordionOpen ? 'Recolher Lista' : 'Expandir Lista'}</span>
        <span class="dev-acc-chevron">▼</span>
      </div>
    </div>

    <div class="dev-accordion-body" id="dev-accordion-body">
      <div class="dev-acc-controls">
        <div class="dev-acc-search-wrap">
          <span class="dev-search-icon">🔍</span>
          <input type="text" id="dev-miniboss-search" class="dev-search-input" placeholder="Buscar por nome ou comportamento..." value="${devCheats.minibossSearch}">
          ${devCheats.minibossSearch ? '<button id="dev-clear-search" class="dev-clear-search">✕</button>' : ''}
        </div>

        <div class="dev-acc-filter-chips">
          <button class="dev-filter-chip ${devCheats.minibossCategory === 'all' ? 'active' : ''}" data-cat="all">Todos (${totalMinibosses})</button>
          <button class="dev-filter-chip ${devCheats.minibossCategory === 'dash' ? 'active' : ''}" data-cat="dash">Rápidos / Dash</button>
          <button class="dev-filter-chip ${devCheats.minibossCategory === 'tank' ? 'active' : ''}" data-cat="tank">Blindados / Tanque</button>
          <button class="dev-filter-chip ${devCheats.minibossCategory === 'ranged' ? 'active' : ''}" data-cat="ranged">Artilharia / Projéteis</button>
          <button class="dev-filter-chip ${devCheats.minibossCategory === 'chaos' ? 'active' : ''}" data-cat="chaos">Caos / Invocadores</button>
        </div>
      </div>

      <div class="dev-minibosses-grid" id="dev-minibosses-grid"></div>
    </div>
  `;

  container.appendChild(accordionContainer);

  // Toggle do Accordion
  const accToggle = accordionContainer.querySelector('#dev-accordion-toggle');
  accToggle.onclick = () => {
    devCheats.isMinibossAccordionOpen = !devCheats.isMinibossAccordionOpen;
    accordionContainer.classList.toggle('open', devCheats.isMinibossAccordionOpen);
    const hint = accordionContainer.querySelector('.dev-acc-state-hint');
    if (hint) hint.innerText = devCheats.isMinibossAccordionOpen ? 'Recolher Lista' : 'Expandir Lista';
  };

  // Busca e Filtros
  const searchInput = accordionContainer.querySelector('#dev-miniboss-search');
  searchInput.oninput = (e) => {
    devCheats.minibossSearch = e.target.value.toLowerCase().trim();
    renderMinibossCards(accordionContainer.querySelector('#dev-minibosses-grid'));
  };

  const clearBtn = accordionContainer.querySelector('#dev-clear-search');
  if (clearBtn) {
    clearBtn.onclick = () => {
      devCheats.minibossSearch = '';
      searchInput.value = '';
      renderMinibossCards(accordionContainer.querySelector('#dev-minibosses-grid'));
    };
  }

  accordionContainer.querySelectorAll('.dev-filter-chip').forEach(chip => {
    chip.onclick = () => {
      devCheats.minibossCategory = chip.getAttribute('data-cat');
      accordionContainer.querySelectorAll('.dev-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderMinibossCards(accordionContainer.querySelector('#dev-minibosses-grid'));
    };
  });

  // Renderiza cards dentro do accordion
  renderMinibossCards(accordionContainer.querySelector('#dev-minibosses-grid'));
}

function renderMinibossCards(grid) {
  if (!grid) return;
  grid.innerHTML = '';

  const query = devCheats.minibossSearch;
  const category = devCheats.minibossCategory;

  const filteredKeys = Object.keys(MINI_BOSS_TYPES).filter(key => {
    const mb = MINI_BOSS_TYPES[key];
    const meta = MINIBOSS_META[key] || { cat: 'other', label: mb.behavior };

    if (category !== 'all' && meta.cat !== category) {
      return false;
    }

    if (query) {
      const matchName = mb.name.toLowerCase().includes(query);
      const matchKey = key.toLowerCase().includes(query);
      const matchLabel = meta.label.toLowerCase().includes(query);
      const matchBehavior = (mb.behavior || '').toLowerCase().includes(query);
      if (!matchName && !matchKey && !matchLabel && !matchBehavior) return false;
    }

    return true;
  });

  if (filteredKeys.length === 0) {
    grid.innerHTML = `
      <div class="dev-empty-notice">
        Nenhum miniboss corresponde ao filtro atual.
      </div>
    `;
    return;
  }

  filteredKeys.forEach(key => {
    const mb = MINI_BOSS_TYPES[key];
    const meta = MINIBOSS_META[key] || { cat: 'other', label: mb.behavior };
    const card = document.createElement('div');
    card.className = 'dev-miniboss-card';
    card.style.setProperty('--mb-color', mb.color || '#f1c40f');

    card.innerHTML = `
      <div class="dev-mb-content">
        <div class="dev-mb-dot" style="background: ${mb.color}; box-shadow: 0 0 8px ${mb.color};"></div>
        <div class="dev-mb-details">
          <div class="dev-mb-title">
            <span class="dev-mb-name">${mb.name}</span>
            <span class="dev-mb-pill">${meta.label}</span>
          </div>
          <div class="dev-mb-stats">
            <span>❤️ ${mb.hp.toLocaleString('pt-BR')} HP</span>
            <span>💥 ${mb.damage} Dano</span>
            <span>🪙 ${mb.gold} Ouro</span>
          </div>
        </div>
      </div>
      <div class="dev-mb-actions">
        <button class="dev-btn-mb-normal" title="Invocar no nível atual">
          ⚔️ Atual
        </button>
        <button class="dev-btn-mb-boost" title="Invocar com o nível selecionado no slider">
          ⚡ Nv. ${devCheats.selectedLevel}
        </button>
      </div>
    `;

    const normalBtn = card.querySelector('.dev-btn-mb-normal');
    const boostBtn = card.querySelector('.dev-btn-mb-boost');

    normalBtn.onclick = () => {
      launchMiniBossTest(key, 0);
    };

    boostBtn.onclick = () => {
      launchMiniBossTest(key, devCheats.selectedLevel);
    };

    grid.appendChild(card);
  });
}

function updateActionButtonsLevelText() {
  const lvl = devCheats.selectedLevel;
  document.querySelectorAll('.dev-btn-test-boost, .dev-btn-mb-boost').forEach(btn => {
    btn.innerText = `⚡ Nv. ${lvl}`;
  });
}

/**
 * ========================================================
 * ABA 2: CHEATS & HACKS (Sandbox de Imunidades e Modificadores)
 * ========================================================
 */
function renderCheatsTab(container) {
  const cheatsSection = document.createElement('div');
  cheatsSection.className = 'dev-cheats-section';

  cheatsSection.innerHTML = `
    <div class="dev-section-title">
      <span>🧪 MODIFICADORES & IMUNIDADES</span>
      <span class="dev-title-sub">Altere as regras da arena em tempo real</span>
    </div>

    <div class="dev-cheats-grid">
      <!-- Card Modo Deus -->
      <div class="dev-cheat-card ${devCheats.godMode ? 'active' : ''}" id="card-god-mode">
        <div class="dev-cheat-icon">🛡️</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">Modo Deus (Imortal)</div>
          <div class="dev-cheat-desc">Herói fica invulnerável a todo tipo de dano e mantém vida cheia.</div>
        </div>
        <div class="dev-cheat-toggle">
          <span class="dev-toggle-badge">${devCheats.godMode ? 'LIGADO' : 'DESLIGADO'}</span>
        </div>
      </div>

      <!-- Card Zero Cooldown -->
      <div class="dev-cheat-card ${devCheats.zeroCooldown ? 'active' : ''}" id="card-zero-cd">
        <div class="dev-cheat-icon">⚡</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">Sem Recarga (Zero CD)</div>
          <div class="dev-cheat-desc">Habilidade ativa sempre pronta sem esperar o cooldown.</div>
        </div>
        <div class="dev-cheat-toggle">
          <span class="dev-toggle-badge">${devCheats.zeroCooldown ? 'LIGADO' : 'DESLIGADO'}</span>
        </div>
      </div>

      <!-- Card Super Ímã -->
      <div class="dev-cheat-card action-card" id="card-super-magnet">
        <div class="dev-cheat-icon">🧲</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">Super Ímã Global</div>
          <div class="dev-cheat-desc">Puxa instantaneamente todos os cristais de XP e moedas de todo o mapa.</div>
        </div>
        <button class="dev-card-action-btn">Puxar Tudo</button>
      </div>

      <!-- Card Expurgar Horda -->
      <div class="dev-cheat-card action-card" id="card-purge-horde">
        <div class="dev-cheat-icon">💀</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">Expurgar Inimigos Comuns</div>
          <div class="dev-cheat-desc">Destrói instantaneamente todos os monstros normais da tela.</div>
        </div>
        <button class="dev-card-action-btn btn-danger">Expurgar</button>
      </div>

      <!-- Card Cura Plena -->
      <div class="dev-cheat-card action-card" id="card-heal-full">
        <div class="dev-cheat-icon">❤️</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">Restauração Completa</div>
          <div class="dev-cheat-desc">Restaura 100% dos pontos de vida e remove efeitos negativos.</div>
        </div>
        <button class="dev-card-action-btn">Curar Herói</button>
      </div>

      <!-- Card +5 Rerolls -->
      <div class="dev-cheat-card action-card" id="card-extra-rerolls">
        <div class="dev-cheat-icon">🎲</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">+5 Rerolls de Cartas</div>
          <div class="dev-cheat-desc">Adiciona 5 rolagens extras de cartas de evolução imediata.</div>
        </div>
        <button class="dev-card-action-btn">+5 Rerolls</button>
      </div>
    </div>
  `;

  container.appendChild(cheatsSection);

  // Handlers
  cheatsSection.querySelector('#card-god-mode').onclick = () => toggleGodMode();
  cheatsSection.querySelector('#card-zero-cd').onclick = () => toggleZeroCooldown();

  cheatsSection.querySelector('#card-super-magnet').onclick = () => {
    const count = triggerSuperMagnet();
    showDevToast(`🧲 <b>Super Ímã:</b> ${count} cristais e orbs atraídos!`);
  };

  cheatsSection.querySelector('#card-purge-horde').onclick = () => {
    const count = purgeAllNormalEnemies();
    showDevToast(`💀 <b>Expurgo:</b> ${count} monstros eliminados!`);
  };

  cheatsSection.querySelector('#card-heal-full').onclick = () => healPlayerFull();
  cheatsSection.querySelector('#card-extra-rerolls').onclick = () => grantExtraRerolls(5);
}

function updateCheatsUI() {
  const godCard = document.getElementById('card-god-mode');
  if (godCard) {
    godCard.classList.toggle('active', devCheats.godMode);
    const badge = godCard.querySelector('.dev-toggle-badge');
    if (badge) badge.innerText = devCheats.godMode ? 'LIGADO' : 'DESLIGADO';
  }

  const zeroCard = document.getElementById('card-zero-cd');
  if (zeroCard) {
    zeroCard.classList.toggle('active', devCheats.zeroCooldown);
    const badge = zeroCard.querySelector('.dev-toggle-badge');
    if (badge) badge.innerText = devCheats.zeroCooldown ? 'LIGADO' : 'DESLIGADO';
  }
}

/**
 * ========================================================
 * ABA 3: ONDAS, ECONOMIA & VELOCIDADE DO JOGO
 * ========================================================
 */
function renderWavesTab(container) {
  const section = document.createElement('div');
  section.className = 'dev-waves-section';

  section.innerHTML = `
    <!-- Seletor de Velocidade -->
    <div class="dev-section-title">
      <span>⏩ VELOCIDADE DA SIMULAÇÃO</span>
      <span class="dev-title-sub">Acelere ou desacelere o tempo da batalha</span>
    </div>
    <div class="dev-speed-selector">
      <button class="dev-speed-btn ${devCheats.gameSpeed === 0.5 ? 'active' : ''}" data-speed="0.5">0.5x (Slow)</button>
      <button class="dev-speed-btn ${devCheats.gameSpeed === 1.0 ? 'active' : ''}" data-speed="1.0">1.0x (Normal)</button>
      <button class="dev-speed-btn ${devCheats.gameSpeed === 1.5 ? 'active' : ''}" data-speed="1.5">1.5x (Ágil)</button>
      <button class="dev-speed-btn ${devCheats.gameSpeed === 2.0 ? 'active' : ''}" data-speed="2.0">2.0x (Rápido)</button>
      <button class="dev-speed-btn ${devCheats.gameSpeed === 3.0 ? 'active' : ''}" data-speed="3.0">3.0x (Ultra)</button>
    </div>

    <!-- Salto de Ondas (Wave Warp) -->
    <div class="dev-section-title" style="margin-top: 18px;">
      <span>🌊 SALTO DE ONDAS (WAVE WARP)</span>
      <span class="dev-title-sub">Teletransporte o cronômetro para qualquer horda</span>
    </div>
    <div class="dev-waves-grid">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(w => `
        <button class="dev-wave-btn ${w === 10 ? 'wave-final' : ''}" data-wave="${w}">
          <span class="dev-wave-num">ONDA ${w}</span>
          <span class="dev-wave-sub">${w === 10 ? 'O Julgamento' : w >= 7 ? 'Late Game' : w >= 4 ? 'Mid Game' : 'Early'}</span>
        </button>
      `).join('')}
    </div>

    <!-- Economia Instantânea -->
    <div class="dev-section-title" style="margin-top: 18px;">
      <span>💰 ECONOMIA & TESOUROS</span>
      <span class="dev-title-sub">Recursos rápidos para testes de evolução e astrolábio</span>
    </div>
    <div class="dev-economy-row">
      <button class="dev-btn-economy" id="dev-add-gold-1k">
        <span class="dev-eco-icon">🪙</span>
        <span class="dev-eco-text">
          <b>+1.000 Ouro</b>
          <small>Moeda Persistente / Astrolábio</small>
        </span>
      </button>

      <button class="dev-btn-economy" id="dev-add-gold-5k">
        <span class="dev-eco-icon">💎</span>
        <span class="dev-eco-text">
          <b>+5.000 Ouro</b>
          <small>Cofre Abundante de Teste</small>
        </span>
      </button>
    </div>
  `;

  container.appendChild(section);

  // Speed buttons
  section.querySelectorAll('.dev-speed-btn').forEach(btn => {
    btn.onclick = () => {
      const spd = parseFloat(btn.getAttribute('data-speed'));
      setGameSpeed(spd);
    };
  });

  // Wave warp buttons
  section.querySelectorAll('.dev-wave-btn').forEach(btn => {
    btn.onclick = () => {
      const w = parseInt(btn.getAttribute('data-wave'), 10);
      warpToWaveTime(w);
      showDevToast(`🌊 <b>Salto Temporal:</b> Iniciando Onda ${w}!`);
    };
  });

  // Economy buttons
  section.querySelector('#dev-add-gold-1k').onclick = () => addDevGold(1000);
  section.querySelector('#dev-add-gold-5k').onclick = () => addDevGold(5000);
}

function updateGameSpeedUI() {
  document.querySelectorAll('.dev-speed-btn').forEach(btn => {
    const spd = parseFloat(btn.getAttribute('data-speed'));
    btn.classList.toggle('active', Math.abs(spd - devCheats.gameSpeed) < 0.05);
  });
}
