/**
 * src/ui/modals/talentsModal.js
 * Astrolábio Cósmico e Forja do Destino: Árvore de Meta-Progressão Rúnica, Constelações e Resumo de Bênçãos.
 */
import { closeCharSelectModal, isMobileScreen } from './characterSelectModal.js';
import { 
  META_TALENTS, 
  getMetaUpgradeCost, 
  buyMetaUpgrade, 
  getMetaLevels, 
  getPersistentGold, 
  getMetaBonuses 
} from '../../entities/player.js';
import { renderIcon } from '../icons.js';
import { playSfx, triggerHaptic } from '../../core/audio.js';

// Runas Sagradas do Astrolábio (SVG Matemático Puro em Grade 24x24 para os 14 Talentos)
export const TALENT_RUNES_SVG = {
  // Guerra
  damage: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  `,
  crit: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="8"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  `,
  cooldown: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="6,2 18,2 12,12 18,22 6,22 12,12"/>
      <line x1="6" y1="2" x2="18" y2="2"/>
      <line x1="6" y1="22" x2="18" y2="22"/>
    </svg>
  `,
  execute: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M14 2l4 4-8 8-4-4 8-8z"/>
      <path d="M6 14l-4 4 4 4 4-4-4-4z"/>
      <line x1="18" y1="6" x2="22" y2="2"/>
    </svg>
  `,

  // Égide
  hp: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="12,2 20,8 18,17 12,22 6,17 4,8"/>
      <polyline points="12,2 12,22"/>
      <line x1="4" y1="8" x2="20" y2="8"/>
    </svg>
  `,
  armor: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
      <polyline points="9,10 12,13 15,10"/>
    </svg>
  `,
  speed: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M4 14l6-6 4 4 6-6"/>
      <path d="M14 6h6v6"/>
      <line x1="2" y1="18" x2="10" y2="18"/>
    </svg>
  `,
  regen: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 2v20"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      <circle cx="12" cy="12" r="6" stroke-dasharray="2, 2"/>
    </svg>
  `,
  phoenix: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 3c-1.5 2-3 4-3 7 0 2.5 1.5 4 3 6 1.5-2 3-3.5 3-6 0-3-1.5-5-3-7z"/>
      <path d="M5 10c2-1 4-1 6 1-1 3-3 4-6 4 0-2 0-4 0-5z"/>
      <path d="M19 10c-2-1-4-1-6 1 1 3 3 4 6 4 0-2 0-4 0-5z"/>
    </svg>
  `,

  // Destino
  magnet: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M5 3v6c0 3.87 3.13 7 7 7s7-3.13 7-7V3"/>
      <line x1="3" y1="7" x2="7" y2="7"/>
      <line x1="17" y1="7" x2="21" y2="7"/>
    </svg>
  `,
  gold: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="9"/>
      <polygon points="12,6 14,10 18,12 14,14 12,18 10,14 6,12 10,10"/>
    </svg>
  `,
  xp: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M2 4v16c4 0 6 2 10 2s6-2 10-2V4c-4 0-6 2-10 2S6 4 2 4z"/>
      <line x1="12" y1="6" x2="12" y2="22"/>
    </svg>
  `,
  reroll: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="3" y="3" width="18" height="18" rx="4"/>
      <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
      <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  `,
  transmute: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M3 8l9-5 9 5v10l-9 5-9-5V8z"/>
      <polygon points="12,3 12,23"/>
      <line x1="3" y1="8" x2="21" y2="8"/>
      <circle cx="12" cy="13" r="3" fill="#f1c40f"/>
    </svg>
  `
};

// Coordenadas das 3 Constelações Estelares (Porcentagens relativas ao Viewport)
export const ASTROLABE_NODE_COORDS = {
  // Guerra (Noroeste & Norte)
  damage:   { x: 38, y: 34, parentId: null },
  crit:     { x: 23, y: 25, parentId: 'damage' },
  cooldown: { x: 44, y: 18, parentId: 'damage' },
  execute:  { x: 14, y: 15, parentId: 'crit' },

  // Égide (Sudoeste & Sul)
  hp:       { x: 35, y: 64, parentId: null },
  armor:    { x: 20, y: 68, parentId: 'hp' },
  speed:    { x: 40, y: 82, parentId: 'hp' },
  regen:    { x: 16, y: 84, parentId: 'armor' },
  phoenix:  { x: 28, y: 93, parentId: 'regen' },

  // Destino (Leste & Nordeste/Sudeste)
  magnet:   { x: 65, y: 50, parentId: null },
  gold:     { x: 77, y: 34, parentId: 'magnet' },
  xp:       { x: 77, y: 66, parentId: 'magnet' },
  reroll:   { x: 89, y: 23, parentId: 'gold' },
  transmute:{ x: 89, y: 77, parentId: 'xp' }
};

// Coordenadas Mobile: Pilares Celestes Verticais Ergonômicos (Toque Amplo & Sem Embolamento)
export const ASTROLABE_MOBILE_COORDS = {
  // Guerra (Pilar de 4 nós)
  damage:   { x: 50, y: 78, parentId: null },
  crit:     { x: 28, y: 48, parentId: 'damage' },
  cooldown: { x: 72, y: 48, parentId: 'damage' },
  execute:  { x: 50, y: 18, parentId: 'crit' },

  // Égide (Pilar de 5 nós)
  hp:       { x: 50, y: 80, parentId: null },
  armor:    { x: 26, y: 52, parentId: 'hp' },
  speed:    { x: 74, y: 52, parentId: 'hp' },
  regen:    { x: 26, y: 22, parentId: 'armor' },
  phoenix:  { x: 74, y: 18, parentId: 'speed' },

  // Destino (Pilar de 5 nós)
  magnet:   { x: 50, y: 80, parentId: null },
  gold:     { x: 26, y: 52, parentId: 'magnet' },
  xp:       { x: 74, y: 52, parentId: 'magnet' },
  reroll:   { x: 26, y: 22, parentId: 'gold' },
  transmute:{ x: 74, y: 18, parentId: 'xp' }
};

export let selectedAstrolabeNodeId = 'damage';
export let activeConstellationFilter = 'all'; // 'all' | 'guerra' | 'egide' | 'destino'
export let activeRenderAstrolabe = null;

export function setActiveRenderAstrolabe(fn) {
  activeRenderAstrolabe = fn;
}

export function openTalentsModal() {
  closeCharSelectModal();

  const modal = document.getElementById('talents-modal');
  const nodesContainer = document.getElementById('astrolabe-nodes-container');
  const filamentsSvg = document.getElementById('astrolabe-filaments-svg');
  const goldVal = document.getElementById('talents-gold-val');
  const blessingsDrawer = document.getElementById('blessings-summary-drawer');
  if (blessingsDrawer) blessingsDrawer.style.display = 'none';
  if (!modal || !nodesContainer) return;

  const isMobile = isMobileScreen();
  modal.classList.toggle('is-mobile-device', isMobile);

  if (isMobile && (activeConstellationFilter === 'all' || !activeConstellationFilter)) {
    activeConstellationFilter = 'guerra';
    const firstInConst = META_TALENTS.find(t => t.constellation === 'guerra');
    if (firstInConst) selectedAstrolabeNodeId = firstInConst.id;
  }

  // Configuração das Abas de Constelação
  const tabBtns = modal.querySelectorAll('.constellation-tab');
  tabBtns.forEach(btn => {
    const cTarget = btn.getAttribute('data-constellation');
    btn.classList.toggle('active', cTarget === activeConstellationFilter);

    btn.onclick = () => {
      activeConstellationFilter = cTarget;
      try { playSfx('card_hover'); } catch(e) {}
      triggerHaptic('light');

      if (cTarget !== 'all') {
        const firstInConst = META_TALENTS.find(t => t.constellation === cTarget);
        if (firstInConst) selectedAstrolabeNodeId = firstInConst.id;
      }

      tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      renderAstrolabe();
    };
  });

  function renderAstrolabe() {
    const currentGold = getPersistentGold();
    if (goldVal) goldVal.innerText = currentGold;
    const coreGold = document.getElementById('talents-core-gold-val');
    if (coreGold) coreGold.innerText = currentGold;
    nodesContainer.innerHTML = '';

    const levels = getMetaLevels();
    const isMobileNow = isMobileScreen();
    const coordsMap = isMobileNow ? ASTROLABE_MOBILE_COORDS : ASTROLABE_NODE_COORDS;
    const centerX = 50;
    const centerY = 50;

    // Se for mobile e ainda estiver 'all', redirecionar para 'guerra'
    if (isMobileNow && activeConstellationFilter === 'all') {
      activeConstellationFilter = 'guerra';
      const firstInConst = META_TALENTS.find(t => t.constellation === 'guerra');
      if (firstInConst) selectedAstrolabeNodeId = firstInConst.id;
    }

    // Se for mobile, focar na constelação ativa para manter o pilar despoluído e legível
    const talentsToRender = (isMobileNow && activeConstellationFilter !== 'all')
      ? META_TALENTS.filter(t => t.constellation === activeConstellationFilter)
      : META_TALENTS;

    // Atualiza badges numéricas das abas com contagem de níveis investidos
    tabBtns.forEach(btn => {
      const c = btn.getAttribute('data-constellation');
      btn.classList.toggle('active', c === activeConstellationFilter);
      if (c && c !== 'all') {
        const cTalents = META_TALENTS.filter(t => t.constellation === c);
        const spent = cTalents.reduce((acc, t) => acc + (levels[t.id] || 0), 0);
        const max = cTalents.reduce((acc, t) => acc + t.maxLvl, 0);
        const countSpan = btn.querySelector('.tab-prog-badge');
        if (countSpan) {
          countSpan.innerText = isMobileNow ? `${spent}/${max}` : `${spent}/${max} Níveis`;
        }
      }
    });

    const stageBadge = document.getElementById('astrolabe-active-const-badge');
    if (stageBadge) {
      const badgeNames = {
        all: 'PLANETÁRIO CELESTE',
        guerra: 'CONSTELAÇÃO DA GUERRA',
        egide: 'CONSTELAÇÃO DA ÉGIDE',
        destino: 'CONSTELAÇÃO DO DESTINO'
      };
      stageBadge.innerText = badgeNames[activeConstellationFilter] || 'PLANETÁRIO CELESTE';
    }

    // 1. Renderização das linhas de filamento SVG interconectadas
    if (filamentsSvg) {
      filamentsSvg.innerHTML = '';
      talentsToRender.forEach(t => {
        const coords = coordsMap[t.id];
        if (!coords) return;

        let startX = centerX;
        let startY = centerY;

        if (isMobileNow) {
          if (coords.parentId && coordsMap[coords.parentId]) {
            startX = coordsMap[coords.parentId].x;
            startY = coordsMap[coords.parentId].y;
          } else {
            startX = 50;
            startY = 96;
          }
        } else {
          if (coords.parentId && coordsMap[coords.parentId]) {
            startX = coordsMap[coords.parentId].x;
            startY = coordsMap[coords.parentId].y;
          }
        }

        const targetLvl = levels[t.id] || 0;
        const parentLvl = coords.parentId ? (levels[coords.parentId] || 0) : 1;
        const isDimmed = !isMobileNow && activeConstellationFilter !== 'all' && t.constellation !== activeConstellationFilter;

        let lineClass = 'filament-line';
        if (targetLvl > 0) lineClass += ' active';
        else if (parentLvl > 0) lineClass += ' available';
        else lineClass += ' locked';

        if (isDimmed) lineClass += ' dimmed';
        lineClass += ` filament-${t.constellation}`;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${startX}%`);
        line.setAttribute('y1', `${startY}%`);
        line.setAttribute('x2', `${coords.x}%`);
        line.setAttribute('y2', `${coords.y}%`);
        line.setAttribute('class', lineClass);
        filamentsSvg.appendChild(line);
      });
    }

    // 2. Renderização dos Nós Estelares Interativos
    talentsToRender.forEach(t => {
      const coords = coordsMap[t.id] || { x: 50, y: 50 };
      const curLvl = levels[t.id] || 0;
      const isMax = curLvl >= t.maxLvl;
      const parentLvl = coords.parentId ? (levels[coords.parentId] || 0) : 1;
      const isLocked = parentLvl < 1;
      const isDimmed = !isMobileNow && activeConstellationFilter !== 'all' && t.constellation !== activeConstellationFilter;
      const runeSvg = TALENT_RUNES_SVG[t.id] || TALENT_RUNES_SVG.damage;

      const node = document.createElement('div');
      let nodeCls = `astrolabe-node node-${t.constellation}`;
      if (t.isKeystone) nodeCls += ' node-keystone';
      if (curLvl > 0) nodeCls += ' invested';
      if (isMax) nodeCls += ' maxed';
      if (isLocked) nodeCls += ' locked';
      if (t.id === selectedAstrolabeNodeId) nodeCls += ' active';
      if (isDimmed) nodeCls += ' dimmed';

      node.className = nodeCls;
      node.style.left = `${coords.x}%`;
      node.style.top = `${coords.y}%`;
      node.setAttribute('data-talent', t.id);

      node.innerHTML = `
        ${runeSvg}
        <div class="node-lvl-pip">${isLocked ? renderIcon('lock', { size: 10, color: '#8c94a8' }) : `${curLvl}/${t.maxLvl}`}</div>
        ${t.isKeystone ? '<div class="keystone-crown-glow"></div>' : ''}
      `;

      node.onclick = () => {
        try { playSfx('card_hover'); } catch(e) {}
        triggerHaptic('light');
        selectedAstrolabeNodeId = t.id;
        renderAstrolabe();
      };

      nodesContainer.appendChild(node);
    });

    // 3. Atualização da Forja do Destino (Painel de Inspeção do Nó Selecionado)
    const activeTalent = META_TALENTS.find(t => t.id === selectedAstrolabeNodeId) || META_TALENTS[0];
    const curLvl = levels[activeTalent.id] || 0;
    const isMax = curLvl >= activeTalent.maxLvl;
    const parentLvl = activeTalent.parent ? (levels[activeTalent.parent] || 0) : 1;
    const isLocked = parentLvl < 1;
    const cost = getMetaUpgradeCost(activeTalent.id, curLvl);
    const canAfford = getPersistentGold() >= cost && !isMax && !isLocked;

    // Cores dinâmicas da constelação para a identidade visual Void Astral
    const constColors = {
      guerra: '#e74c3c',
      egide: '#2ecc71',
      destino: '#a855f7'
    };
    const activeColor = constColors[activeTalent.constellation] || '#ffd166';
    modal.style.setProperty('--showcase-color', activeColor);
    modal.style.setProperty('--constellation-color', activeColor);

    const constBadge = document.getElementById('forge-constellation-badge');
    const tierBadge = document.getElementById('forge-tier-badge');
    const nameElem = document.getElementById('forge-node-name');
    const descElem = document.getElementById('forge-node-desc');
    const statBadge = document.getElementById('forge-stat-badge');
    const levelLabel = document.getElementById('forge-node-level-label');
    const loreElem = document.getElementById('forge-node-lore');
    const compCur = document.getElementById('forge-comp-current');
    const compNext = document.getElementById('forge-comp-next');
    const meterElem = document.getElementById('forge-level-meter');
    const buyBtn = document.getElementById('forge-buy-btn');

    if (constBadge) {
      const names = { guerra: 'CONSTELAÇÃO DA GUERRA', egide: 'CONSTELAÇÃO DA ÉGIDE', destino: 'CONSTELAÇÃO DO DESTINO' };
      const iconKey = activeTalent.constellation === 'guerra' ? 'constellation_guerra' : (activeTalent.constellation === 'egide' ? 'constellation_egide' : 'constellation_destino');
      constBadge.innerHTML = `${renderIcon(iconKey, { size: 13, style: 'margin-right:5px;' })} ${names[activeTalent.constellation] || 'CONSTELAÇÃO ASTRAL'}`;
      constBadge.className = `showcase-archetype-pill badge-${activeTalent.constellation}`;
      constBadge.style.color = activeColor;
      constBadge.style.borderColor = activeColor;
    }

    if (tierBadge) {
      tierBadge.innerHTML = activeTalent.isKeystone 
        ? `${renderIcon('keystone', { size: 12, color: '#f1c40f', style: 'margin-right:4px;' })} TALENTO MESTRE` 
        : `TIER ${activeTalent.tier}`;
    }

    if (statBadge) {
      statBadge.innerText = activeTalent.statLabel ? activeTalent.statLabel.toUpperCase() : 'BÊNÇÃO';
      statBadge.style.color = activeColor;
      statBadge.style.borderColor = `${activeColor}66`;
    }

    if (levelLabel) {
      levelLabel.innerText = isMax ? 'APOGEU (MÁX)' : `NÍVEL ${curLvl}/${activeTalent.maxLvl}`;
    }

    if (nameElem) nameElem.innerText = activeTalent.name;
    if (descElem) descElem.innerText = activeTalent.desc;
    if (loreElem) loreElem.innerText = activeTalent.lore ? `“${activeTalent.lore}”` : '';
    const loreCard = document.getElementById('forge-node-lore-card');
    if (loreCard) {
      loreCard.style.display = activeTalent.lore ? 'flex' : 'none';
    }

    if (compCur) compCur.innerText = activeTalent.formatVal(curLvl);
    if (compNext) compNext.innerText = isMax ? 'MÁX' : activeTalent.formatVal(curLvl + 1);

    if (meterElem) {
      let meterHtml = '<div class="segmented-meter">';
      for (let i = 1; i <= activeTalent.maxLvl; i++) {
        meterHtml += `<div class="segment-cell ${i <= curLvl ? 'filled' : ''}"></div>`;
      }
      meterHtml += '</div>';
      meterElem.innerHTML = meterHtml;
    }

    if (buyBtn) {
      buyBtn.style.setProperty('--btn-theme-color', activeColor);
      if (isLocked) {
        buyBtn.disabled = true;
        const parentT = META_TALENTS.find(p => p.id === activeTalent.parent);
        buyBtn.innerHTML = `${renderIcon('lock', { size: 13, style: 'margin-right:4px;' })} REQUER ${parentT ? parentT.name.toUpperCase() : 'NÓ ANTECESSOR'}`;
      } else if (isMax) {
        buyBtn.disabled = true;
        buyBtn.innerHTML = `${renderIcon('sparkle', { size: 13, style: 'margin-right:4px;' })} FORJA MAGISTRAL CONCLUÍDA ${renderIcon('sparkle', { size: 13, style: 'margin-left:4px;' })}`;
      } else {
        buyBtn.disabled = !canAfford;
        buyBtn.innerHTML = canAfford
          ? `${renderIcon('damage', { size: 13, style: 'margin-right:4px;' })} FUNDIR ALMAS • ${renderIcon('soul_coin', { size: 12, color: '#ffd166', style: 'margin-right:2px;' })} ${cost}`
          : `${renderIcon('soul_coin', { size: 12, color: '#ffd166', style: 'margin-right:2px;' })} ${cost} (FALTAM ${cost - getPersistentGold()} ALMAS)`;
        buyBtn.onclick = () => {
          if (buyMetaUpgrade(activeTalent.id)) {
            try { playSfx('level'); } catch(e) {}
            triggerHaptic('heavy');
            renderAstrolabe();
          }
        };
      }
    }
  }

  activeRenderAstrolabe = renderAstrolabe;
  renderAstrolabe();
  modal.classList.remove('modal-hidden');
  modal.style.removeProperty('display');
  modal.style.display = 'flex';
}

export function renderBlessingsSummary() {
  const grid = document.getElementById('blessings-summary-grid');
  if (!grid) return;
  const meta = getMetaBonuses();

  const cards = [
    { label: "Dano Global", val: `+${Math.round((meta.damageMult - 1) * 100)}%`, icon: renderIcon('sword', { size: 16, color: '#e74c3c' }), col: "#e74c3c" },
    { label: "Chance Crítica", val: `+${Math.round(meta.critBonus * 100)}%`, icon: renderIcon('crit', { size: 16, color: '#f39c12' }), col: "#f39c12" },
    { label: "Redução Recarga", val: `-${Math.round(meta.cooldownReduction * 100)}%`, icon: renderIcon('cooldown', { size: 16, color: '#e67e22' }), col: "#e67e22" },
    { label: "Fúria Executora", val: `+${Math.round(meta.executeBonus * 100)}%`, icon: renderIcon('execute', { size: 16, color: '#c0392b' }), col: "#c0392b" },

    { label: "Vida Máxima", val: `+${Math.round((meta.hpMult - 1) * 100)}%`, icon: renderIcon('heart', { size: 16, color: '#2ecc71' }), col: "#2ecc71" },
    { label: "Armadura Direta", val: `-${meta.armorBonus} Dano`, icon: renderIcon('armor', { size: 16, color: '#3498db' }), col: "#3498db" },
    { label: "Velocidade", val: `+${((meta.speedMult - 1) * 100).toFixed(1)}%`, icon: renderIcon('boot', { size: 16, color: '#1abc9c' }), col: "#1abc9c" },
    { label: "Regeneração", val: `+${meta.regenBonus.toFixed(1)} HP/s`, icon: renderIcon('regen', { size: 16, color: '#27ae60' }), col: "#27ae60" },
    { label: "Segunda Chance", val: meta.phoenixRevives > 0 ? "1 Reviver" : "Inativo", icon: renderIcon('phoenix', { size: 16, color: '#f1c40f' }), col: "#f1c40f" },

    { label: "Raio de Atração", val: `+${meta.magnetBonus} px`, icon: renderIcon('magnet', { size: 16, color: '#9b59b6' }), col: "#9b59b6" },
    { label: "Bônus de Almas", val: `+${Math.round((meta.goldMult - 1) * 100)}%`, icon: renderIcon('soul_coin', { size: 16, color: '#f1c40f' }), col: "#f1c40f" },
    { label: "Bônus de XP", val: `+${Math.round((meta.xpMult - 1) * 100)}%`, icon: renderIcon('xp_tome', { size: 16, color: '#8e44ad' }), col: "#8e44ad" },
    { label: "Rerolls de Tarô", val: `+${meta.rerolls}`, icon: renderIcon('dice', { size: 16, color: '#e056fd' }), col: "#e056fd" },
    { label: "Transmutação Cósmica", val: meta.doubleChestChance > 0 ? "25% Chance" : "Inativo", icon: renderIcon('transmute', { size: 16, color: '#f39c12' }), col: "#f39c12" }
  ];

  grid.innerHTML = cards.map(c => `
    <div class="blessing-stat-card" style="border-left-color: ${c.col};">
      <span class="blessing-icon">${c.icon}</span>
      <div class="blessing-info">
        <div class="blessing-label">${c.label}</div>
        <div class="blessing-val" style="color: ${c.col};">${c.val}</div>
      </div>
    </div>
  `).join('');
}
