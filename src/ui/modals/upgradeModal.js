/**
 * src/ui/modals/upgradeModal.js
 * Renderizador de Cartas de Tarô Arcano de Poder (Level-up & Bênçãos de Chefes).
 */
import { player } from '../../entities/player.js';
import { checkIsSynergyIngredient } from '../../config/items.js';
import { getRandomUpgrades } from '../../config/upgrades.js';
import { playSfx } from '../../core/audio.js';
import { resetInput } from '../../core/input.js';
import { gameState, setLastTime } from '../../main.js';
import { renderIcon } from '../icons.js';

// Biblioteca de Glifos Vetoriais Leves para Cartas de Poder
export const UPGRADE_ICONS = {
  axe_speed: `<svg viewBox="0 0 24 24"><path fill="#f1c40f" d="M14.5 2.5l7 7-4.5 4.5-7-7z M3 21l8-8-2-2-8 8z"/></svg>`,
  axe_extra: `<svg viewBox="0 0 24 24"><path fill="#e67e22" d="M12 2L2 12h5v8h10v-8h5z"/></svg>`,
  axe_radius: `<svg viewBox="0 0 24 24"><path fill="#f39c12" d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2zm1 14.93V15a1 1 0 0 1-2 0v-1.07A6 6 0 0 1 6.07 9H7a1 1 0 0 1 0-2h-.93A10 10 0 0 1 12 4v1a1 1 0 0 1 2 0V4a10 10 0 0 1 6.93 5H20a1 1 0 0 1 0 2h-.93A6 6 0 0 1 14 16.93z"/></svg>`,
  potion_volley: `<svg viewBox="0 0 24 24"><path fill="#2ecc71" d="M19 19c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2 0-3 3-7 3-10V5h1V3h6v2h1v4c0 3 3 7 3 10z"/></svg>`,
  potion_potency: `<svg viewBox="0 0 24 24"><path fill="#00cec9" d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7zm-2 18h4v2h-4z"/></svg>`,
  staff_projectiles: `<svg viewBox="0 0 24 24"><path fill="#f39c12" d="M12 2l2.5 5.5L20 10l-4 4 1 5.5L12 17l-5 2.5 1-5.5-4-4 5.5-2.5z"/></svg>`,
  staff_pierce: `<svg viewBox="0 0 24 24"><path fill="#e17055" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>`,
  sword_extra: `<svg viewBox="0 0 24 24"><path fill="#00cec9" d="M14.5 2.5L21.5 9.5l-12 12L2.5 21.5l0-7z"/></svg>`,
  sword_speed: `<svg viewBox="0 0 24 24"><path fill="#74b9ff" d="M2.5 19.5l17-17 2 2-17 17z M4 21l3-1-2-2z"/></svg>`,
  hammer_crush: `<svg viewBox="0 0 24 24"><path fill="#bdc3c7" d="M4 3h16v6H4zm6 6h4v12h-4z"/></svg>`,
  hammer_impact: `<svg viewBox="0 0 24 24"><path fill="#f39c12" d="M12 2L1 21h22L12 2zm0 4.5l7 12H5l7-12z"/></svg>`,
  frost_passive: `<svg viewBox="0 0 24 24"><path fill="#74b9ff" d="M12 2v20m-10-10h20m-15-7l10 14m0-14l-10 14"/></svg>`,
  dmg: `<svg viewBox="0 0 24 24"><path fill="#e74c3c" d="M12 2l3 7h7l-5.5 4.5 2 7-6.5-4.5-6.5 4.5 2-7L2 9h7z"/></svg>`,
  haste: `<svg viewBox="0 0 24 24"><path fill="#f1c40f" d="M13 2.5L4 13.5h6v8l9-11h-6z"/></svg>`,
  wings: `<svg viewBox="0 0 24 24"><path fill="#00cec9" d="M3 13c3.5 0 6.5-1.5 8.5-4 0 4-2 7-6 8.5C3.5 16 3 14.5 3 13zm18 0c-3.5 0-6.5-1.5-8.5-4 0 4 2 7 6 8.5 2-1.5 2.5-3 2.5-4.5z"/></svg>`,
  crit: `<svg viewBox="0 0 24 24"><path fill="#e74c3c" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>`,
  magnet: `<svg viewBox="0 0 24 24"><path fill="#3498db" d="M5 3v6c0 3.87 3.13 7 7 7s7-3.13 7-7V3h-4v6c0 1.66-1.34 3-3 3s-3-1.34-3-3V3H5z"/></svg>`,
  aura: `<svg viewBox="0 0 24 24"><path fill="#f1c40f" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/></svg>`,
  orbitals: `<svg viewBox="0 0 24 24"><path fill="#9b59b6" d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H7V9h10v2zm0-4H7V5h10v2z"/></svg>`,
  armor: `<svg viewBox="0 0 24 24"><path fill="#95a5a6" d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/></svg>`,
  heal: `<svg viewBox="0 0 24 24"><path fill="#2ecc71" d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19z"/></svg>`,
  blessing: `<svg viewBox="0 0 24 24"><path fill="#f1c40f" d="M12 2l3 7h7l-5.5 4.5 2 7-6.5-4.5-6.5 4.5 2-7L2 9h7z"/></svg>`
};

function isSynergyIngredient(optId) {
  return checkIsSynergyIngredient(optId, player);
}

export let pendingLevelUps = 0;
export let bossRewardContext = null;

export function setBossRewardContext(bossName, bossId) {
  bossRewardContext = {
    bossName: bossName || 'Chefe Supremo',
    bossId: bossId || 1,
    totalCount: 0,
    chosenCount: 0
  };
}

export function ensureBossUpgradeCount(minCount) {
  if (bossRewardContext && bossRewardContext.totalCount < minCount) {
    const diff = minCount - bossRewardContext.totalCount;
    for (let k = 0; k < diff; k++) {
      levelUp();
    }
  }
}

export function resetUpgradeQueue() {
  pendingLevelUps = 0;
  bossRewardContext = null;
  const bossBanner = document.getElementById('boss-reward-banner');
  if (bossBanner) bossBanner.style.display = 'none';
}

export function updateUpgradeModalHeader() {
  const bossBanner = document.getElementById('boss-reward-banner');
  const bossTitle = document.getElementById('boss-reward-title');
  const bossCounter = document.getElementById('boss-reward-counter');
  const levelBadge = document.querySelector('.modal-box-tarot .level-up-badge');
  const headerSub = document.querySelector('.modal-box-tarot .modal-header-sub');

  if (bossRewardContext && bossRewardContext.totalCount > 0) {
    if (bossBanner) {
      bossBanner.style.display = 'flex';
      if (bossTitle) bossTitle.innerText = `VITÓRIA CONTRA ${bossRewardContext.bossName.toUpperCase()}!`;
      if (bossCounter) {
        const currentChoice = bossRewardContext.chosenCount + 1;
        const total = Math.max(bossRewardContext.totalCount, bossRewardContext.chosenCount + pendingLevelUps);
        const remaining = Math.max(0, pendingLevelUps - 1);
        bossCounter.innerHTML = `<span style="color:#f1c40f; font-weight:800;">+${total} UPGRADES CONQUISTADOS</span> &bull; Escolhendo Bênção <b>${currentChoice} de ${total}</b>${remaining > 0 ? ` (${remaining} restante${remaining > 1 ? 's' : ''})` : ' (Última Bênção)'}`;
      }
    }
    if (levelBadge) levelBadge.style.display = 'none';
    if (headerSub) headerSub.innerText = "Recompensa mística concedida pela derrota do colosso";
  } else {
    if (bossBanner) bossBanner.style.display = 'none';
    if (levelBadge) levelBadge.style.display = 'inline-block';
    if (headerSub) {
      if (pendingLevelUps > 1) {
        headerSub.innerHTML = `Invoque uma bênção arcana para remodelar o combate &bull; <b style="color:#f1c40f;">${pendingLevelUps} bênçãos na fila</b>`;
      } else {
        headerSub.innerText = "Invoque uma bênção arcana para remodelar o combate";
      }
    }
  }
}

export function renderUpgradeCards() {
  const modal = document.getElementById('upgrade-modal');
  const container = document.getElementById('upgrade-list');
  if (!container || !modal) return;
  container.innerHTML = '';

  const options = getRandomUpgrades(3);
  options.forEach(opt => {
    const card = document.createElement('div');
    card.className = `upgrade-card-pro ${opt.rarity}`;

    const iconSvg = UPGRADE_ICONS[opt.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#f1c40f"/></svg>`;
    const isSynergy = isSynergyIngredient(opt.id);

    card.innerHTML = `
      ${isSynergy ? `<span class="synergy-indicator-tag">${renderIcon('sparkle', { size: 11, color: '#f1c40f', style: 'margin-right:3px;' })} PEÇA DE FUSÃO</span>` : ''}
      <span class="rarity-badge">${opt.badge}</span>
      <div class="card-icon-wrapper">${iconSvg}</div>
      <div class="card-title" style="font-weight: 800; font-size: 13px;">${opt.title}</div>
      <div class="card-stat" style="font-size: 11px; color: #a4b0be; line-height: 1.35;">${opt.desc}</div>
      <div style="font-size: 10px; font-weight: bold; color: #f1c40f; margin-top: auto; padding-top: 4px;">${opt.stat}</div>
    `;

    card.onmouseenter = () => {
      playSfx('card_hover');
    };

    card.onclick = () => {
      playSfx('card_select');
      opt.apply();
      pendingLevelUps--;

      if (bossRewardContext) {
        bossRewardContext.chosenCount++;
      }

      if (pendingLevelUps > 0) {
        updateUpgradeModalHeader();
        renderUpgradeCards();
      } else {
        pendingLevelUps = 0;
        bossRewardContext = null;
        updateUpgradeModalHeader();
        modal.style.display = 'none';
        gameState.isPaused = false;
        setLastTime(performance.now());
      }
    };

    container.appendChild(card);
  });

  const rerollBtn = document.getElementById('reroll-btn');
  const rerollCount = document.getElementById('reroll-count');
  if (rerollBtn && rerollCount) {
    if (player.rerolls > 0) {
      rerollCount.innerText = player.rerolls;
      rerollBtn.style.display = 'block';
      rerollBtn.onclick = () => {
        player.rerolls--;
        playSfx('level');
        renderUpgradeCards();
      };
    } else {
      rerollBtn.style.display = 'none';
    }
  }
}

export function levelUp() {
  pendingLevelUps++;
  if (bossRewardContext) {
    bossRewardContext.totalCount++;
  }

  const upgradeModal = document.getElementById('upgrade-modal');
  if (upgradeModal && upgradeModal.style.display === 'flex') {
    updateUpgradeModalHeader();
    return;
  }

  playSfx('level');
  gameState.isPaused = true;
  resetInput();
  updateUpgradeModalHeader();
  renderUpgradeCards();
  if (upgradeModal) upgradeModal.style.display = 'flex';
}
