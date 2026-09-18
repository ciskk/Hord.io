/**
 * src/systems/ui.js
 * Sistema de Interface de Usuário Grim Cyber-Gothic
 * Gerenciador de Modais, Grimório de Batalha, Cartas de Tarô e Efeitos Diegéticos
 */

import { CHARACTERS } from '../config/characters.js';
import { 
  ACHIEVEMENTS, 
  HERO_UNLOCK_MAP, 
  isHeroUnlocked, 
  getAchievementStatus, 
  getUnlockedAchievementIds, 
  getLifetimeStats, 
  recordRunStats, 
  pendingAchievementNotifications 
} from '../config/achievements.js';
import { 
  startPreview, 
  stopPreview, 
  resizePreviewCanvas,
  setPreviewHero, 
  togglePreviewFacing, 
  setPreviewPose, 
  triggerHeroSurge 
} from '../render/characterPreview.js';
import { 
  BESTIARY_ENTRIES, 
  getCreatureKills, 
  isCreatureDiscovered, 
  isLoreUnlocked, 
  getBestiaryStats 
} from '../config/bestiary.js';
import { 
  startBestiaryPreview, 
  stopBestiaryPreview, 
  setBestiaryPreviewCreature 
} from '../render/bestiaryPreview.js';
import { BOSS_TYPES, MINI_BOSS_TYPES } from '../config/enemies.js';
import { getRandomUpgrades, checkSynergies, grant50Upgrades, grantLevels } from '../config/upgrades.js';
import { renderDevToolsModal } from './devtools.js';
import { checkIsSynergyIngredient, getSynergyTrackerList } from '../config/items.js';
import { triggerBossEncounter, spawnMiniBoss } from '../entities/enemies.js';
import { 
  playSfx, 
  triggerHaptic, 
  setGameVolume, 
  initAudio, 
  audioCtx,
  applyDeathAudioFilter,
  resetDeathAudioFilter
} from '../core/audio.js';
import { resetInput } from '../core/input.js';
import { 
  player, 
  selectedHeroKey,
  setSelectedHeroKey, 
  getPersistentGold, 
  addPersistentGold,
  getMetaLevels, 
  getMetaBonuses,
  META_TALENTS, 
  getMetaUpgradeCost, 
  buyMetaUpgrade, 
  resetMetaTree 
} from '../entities/player.js';
import { onLayoutChange, layoutMetrics, updateHudBottomMetric } from '../core/responsive.js';
import { bullets, enemyBullets } from '../systems/projectiles.js';
import { 
  gameState, 
  triggerShake, 
  setCurrentArenaTheme, 
  setIsWavePaused, 
  resetSpawnTimer, 
  setLastTime, 
  resetGame,
  activeBoss,
  setActiveBoss,
  bossShockwaves,
  voidVortices,
  bossTelegraphs,
  bossProjectiles,
  lastAttackerName,
  frameCount
} from '../main.js';
import { transitionToArenaTheme, getWaveArenaTheme } from '../render/environment.js';
import { getCurrentWave, getEffectiveHordeSeconds } from '../systems/waves.js';
import { renderIcon, ICONS, WEAPON_ICONS, PASSIVE_ICONS } from '../ui/icons.js';

// Biblioteca de Glifos Vetoriais Leves para Cartas de Poder
const UPGRADE_ICONS = {
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

export function isBossSelectAllowed() {
  if (gameState.isDead || gameState.isWon) return false;
  return true;
}

export function openBossSelectModal() {
  const modal = document.getElementById('boss-select-modal');
  if (!modal) return;

  const charModal = document.getElementById('char-modal');
  const isCharOpen = charModal && charModal.style.display === 'flex';
  if (!isCharOpen) {
    gameState.isPaused = true;
  }

  renderDevToolsModal();
  modal.style.display = 'flex';
  playSfx('level');
}

export function closeBossSelectModal() {
  const modal = document.getElementById('boss-select-modal');
  if (modal) modal.style.display = 'none';

  const charModal = document.getElementById('char-modal');
  const isCharOpen = charModal && charModal.style.display === 'flex';
  const pauseModal = document.getElementById('pause-modal');
  const isPauseOpen = pauseModal && pauseModal.style.display === 'flex';

  if (!isCharOpen && !isPauseOpen) {
    gameState.isPaused = false;
    setLastTime(performance.now());
  }
}

export function launchBossTest(bossId, levelCount = 0) {
  closeBossSelectModal();

  const charModal = document.getElementById('char-modal');
  const isCharOpen = charModal && charModal.style.display === 'flex' && !charModal.classList.contains('modal-hidden');

  if (isCharOpen) {
    closeCharSelectModal();
    resetGame();
  } else {
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.style.display = 'none';
    gameState.isPaused = false;
    setLastTime(performance.now());
  }

  const levelsToGrant = typeof levelCount === 'boolean' ? (levelCount ? 50 : 0) : Number(levelCount || 0);
  if (levelsToGrant > 0) {
    grantLevels(levelsToGrant);
  }

  setActiveBoss(null);
  bossShockwaves.length = 0;
  voidVortices.length = 0;

  triggerBossEncounter(bossId);
}

export function launchMiniBossTest(miniBossType, levelCount = 0) {
  closeBossSelectModal();

  const charModal = document.getElementById('char-modal');
  const isCharOpen = charModal && charModal.style.display === 'flex' && !charModal.classList.contains('modal-hidden');

  if (isCharOpen) {
    closeCharSelectModal();
    resetGame();
  } else {
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.style.display = 'none';
    gameState.isPaused = false;
    setLastTime(performance.now());
  }

  const levelsToGrant = typeof levelCount === 'boolean' ? (levelCount ? 50 : 0) : Number(levelCount || 0);
  if (levelsToGrant > 0) {
    grantLevels(levelsToGrant);
  }

  spawnMiniBoss(miniBossType);
}

export function renderBossSelectModal() {
  renderDevToolsModal();
}

/**
 * Renderizador de Cartas de Tarô Arcano (Level-up)
 */
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

function updateUpgradeModalHeader() {
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

function renderUpgradeCards() {
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

/**
 * Grimório Tático de Pausa: Preenchimento de Arsenal, Atributos e Sinergias
 */
function renderPauseInventory() {
  const goldVal = document.getElementById('pause-gold-val');
  if (goldVal) goldVal.innerText = getPersistentGold();

  // 1. Arsenal de Armas e Passivas Ativas
  const buildList = document.getElementById('pause-build-list');
  if (buildList) {
    buildList.innerHTML = '';

    // Armas equipadas
    player.weapons.forEach(w => {
      const row = document.createElement('div');
      row.className = 'build-item-badge';
      const iconKey = WEAPON_ICONS[w.type] || 'sword';
      const weaponSvg = renderIcon(iconKey, { size: 11, style: 'margin-right:5px; color: var(--gold-runic);' });
      row.innerHTML = `
        <span class="name">${weaponSvg} ${w.type}</span>
        <span class="counter">Nv ${w.count || 1}</span>
      `;
      buildList.appendChild(row);
    });

    // Passivas acumuladas
    if (player.damageCardCount) {
      const icon = renderIcon('damage', { size: 11, style: 'margin-right:5px; color: #e74c3c;' });
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">${icon} Poder Bruto</span><span class="counter">+${Math.round((player.damagePercentBonus || 0) * 100)}% (${player.damageCardCount}/4)</span></div>`;
    }
    if (player.armorCardCount || player.hasArmorPassive) {
      const icon = renderIcon('armor', { size: 11, style: 'margin-right:5px; color: #3498db;' });
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">${icon} Armadura Rúnica</span><span class="counter">+${(player.armorCardCount || 1) * 45} HP (${player.armorCardCount || 1}/5)</span></div>`;
    }
    if (player.wingsCardCount || player.hasWingsPassive) {
      const icon = renderIcon('wings', { size: 11, style: 'margin-right:5px; color: #00cec9;' });
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">${icon} Asas do Vento</span><span class="counter">+${player.speed.toFixed(1)} Vel (${player.wingsCardCount || 1}/4)</span></div>`;
    }
    if (player.frostCardCount || (player.slowChance || 0) > 0) {
      const icon = renderIcon('frost', { size: 11, style: 'margin-right:5px; color: #74b9ff;' });
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">${icon} Golpe Criogênico</span><span class="counter">${Math.round(player.slowChance * 100)}% Lentidão (${player.frostCardCount || 1}/4)</span></div>`;
    }
    if (player.orbitals > 0) {
      const icon = renderIcon('orbitals', { size: 11, style: 'margin-right:5px; color: #9b59b6;' });
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">${icon} Bíblias Protetoras</span><span class="counter">${player.orbitals} Tomos ${player.evolvedOrbitals ? '(Vórtice)' : '(Máx: 3)'}</span></div>`;
    }
    if (player.auraLvl > 0) {
      const icon = renderIcon('aura', { size: 11, style: 'margin-right:5px; color: #f1c40f;' });
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">${icon} Aura Sagrada</span><span class="counter">Nv ${player.auraLvl}/5 ${player.evolvedAura ? '(Santuário)' : ''}</span></div>`;
    }
    if (player.critCardCount || player.critChance > 0.05) {
      const icon = renderIcon('crit', { size: 11, style: 'margin-right:5px; color: #f39c12;' });
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">${icon} Foco Letal</span><span class="counter">${Math.round(player.critChance * 100)}% Crítico (${player.critCardCount || 1}/4)</span></div>`;
    }
    if (player.hasteCardCount || (player.cooldownReduction || 0) > 0) {
      const icon = renderIcon('cooldown', { size: 11, style: 'margin-right:5px; color: #e67e22;' });
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">${icon} Fúria Rápida</span><span class="counter">-${Math.round((player.cooldownReduction || 0) * 100)}% CDR (${player.hasteCardCount || 1}/3)</span></div>`;
    }
    if (player.magnetCardCount) {
      const icon = renderIcon('magnet', { size: 11, style: 'margin-right:5px; color: #9b59b6;' });
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">${icon} Ímã Titânico</span><span class="counter">+${player.magnetCardCount * 50}px (${player.magnetCardCount}/4)</span></div>`;
    }
  }

  // 2. Biometria do Sobrevivente em Tempo Real
  const statsGrid = document.getElementById('pause-stats-grid');
  if (statsGrid) {
    const totalDmg = Math.round(player.damage * (1 + (player.damagePercentBonus || 0)));
    statsGrid.innerHTML = `
      <div class="stat-box"><div class="stat-box-label">${renderIcon('heart', { size: 10, color: '#2ecc71', style: 'margin-right:3px;' })} HP Total</div><div class="stat-box-value">${Math.ceil(player.hp)} / ${player.maxHp}</div></div>
      <div class="stat-box"><div class="stat-box-label">${renderIcon('damage', { size: 10, color: '#e74c3c', style: 'margin-right:3px;' })} Dano Base</div><div class="stat-box-value">${totalDmg}</div></div>
      <div class="stat-box"><div class="stat-box-label">${renderIcon('crit', { size: 10, color: '#f39c12', style: 'margin-right:3px;' })} Chance Crítica</div><div class="stat-box-value">${Math.round(player.critChance * 100)}%</div></div>
      <div class="stat-box"><div class="stat-box-label">${renderIcon('boot', { size: 10, color: '#1abc9c', style: 'margin-right:3px;' })} Velocidade</div><div class="stat-box-value">${player.speed.toFixed(1)}</div></div>
      <div class="stat-box"><div class="stat-box-label">${renderIcon('cooldown', { size: 10, color: '#e67e22', style: 'margin-right:3px;' })} Redução Recarga</div><div class="stat-box-value">-${Math.round((player.cooldownReduction || 0) * 100)}%</div></div>
      <div class="stat-box"><div class="stat-box-label">${renderIcon('magnet', { size: 10, color: '#9b59b6', style: 'margin-right:3px;' })} Raio de Ímã</div><div class="stat-box-value">${player.magnet}px</div></div>
    `;
  }

  // 3. Rastreador de Fusões e Sinergias (Evolution Tracker)
  const synTracker = document.getElementById('pause-synergies-tracker');
  if (synTracker) {
    const synList = getSynergyTrackerList(player);

    synTracker.innerHTML = synList.map(s => {
      let statusColor = '#e74c3c';
      let statusContent = s.req;
      if (s.isEvolved) {
        statusColor = '#f1c40f';
        statusContent = `${renderIcon('star_evolution', { size: 9, color: '#f1c40f', style: 'margin-right:3px;' })} EVOLUÍDO`;
      } else if (s.isReady) {
        statusColor = '#2ecc71';
        statusContent = `${renderIcon('check', { size: 9, color: '#2ecc71', style: 'margin-right:3px;' })} PRONTO (ABRA BAÚ)`;
      }

      return `
        <div class="synergy-row">
          <span style="font-weight: 600; color: #fff;">${s.name}</span>
          <span style="font-weight: bold; color: ${statusColor}; display: inline-flex; align-items: center;">${statusContent}</span>
        </div>
      `;
    }).join('');
  }
}

export function togglePause() {
  if (gameState.isDead || gameState.isWon) return;
  initAudio();
  gameState.isPaused = !gameState.isPaused;
  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) {
    pauseModal.style.display = gameState.isPaused ? 'flex' : 'none';
    if (gameState.isPaused) {
      renderPauseInventory();
    }
  }
  if (!gameState.isPaused) {
    setLastTime(performance.now());
  }
}

export function openChestModal(tier = 'BOSS') {
  playSfx('chest_fanfare');
  gameState.isPaused = true;
  resetInput();

  const modal = document.getElementById('chest-modal');
  const list = document.getElementById('chest-rewards-list');
  const claimBtn = document.getElementById('chest-claim-btn');
  const titleElem = document.getElementById('chest-modal-title');
  const subElem = document.getElementById('chest-modal-sub');

  if (!modal || !list) return;
  list.innerHTML = '';

  const isMini = tier === 'MINI_BOSS';

  if (titleElem) {
    titleElem.innerText = isMini ? "TESOURO DE ELITE!" : "TESOURO DO CHEFE!";
    titleElem.style.color = isMini ? "#3498db" : "#f1c40f";
  }
  if (subElem) {
    subElem.innerText = isMini 
      ? "Campeão abatido. Relíquias arcanas desvendadas:" 
      : "A arena foi purificada. Recompensas lendárias concedidas:";
  }

  // 1. Preparar lista de recompensas
  const pendingRewards = [];

  if (isMini) {
    const upgradeCount = Math.random() < 0.25 ? 2 : 1;
    const upgrades = getRandomUpgrades(upgradeCount);
    upgrades.forEach(u => {
      pendingRewards.push({
        isLegendary: false,
        title: u.title,
        desc: u.desc,
        stat: u.stat,
        badge: u.badge || "Upgrade",
        iconSvg: UPGRADE_ICONS[u.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#3498db"/></svg>`,
        apply: () => u.apply()
      });
    });
  } else {
    const syns = checkSynergies();
    if (syns.length > 0) {
      const evo = syns[0];
      pendingRewards.push({
        isLegendary: true,
        title: evo.name,
        desc: evo.desc,
        stat: "PODER MÁXIMO",
        badge: "Evolução",
        iconSvg: `<svg viewBox="0 0 24 24"><polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9" fill="#f1c40f"/></svg>`,
        apply: () => evo.apply()
      });
    }

    const upgrades = getRandomUpgrades(2);
    upgrades.forEach(u => {
      pendingRewards.push({
        isLegendary: false,
        title: u.title,
        desc: u.desc,
        stat: u.stat,
        badge: u.badge || "Upgrade",
        iconSvg: UPGRADE_ICONS[u.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#f1c40f"/></svg>`,
        apply: () => u.apply()
      });
    });
  }

  // Fallback se todos os upgrades já foram maximizados
  if (pendingRewards.length === 0) {
    pendingRewards.push({
      isLegendary: false,
      title: "Bênção da Fortuna",
      desc: "Todos os poderes conhecidos atingiram o apogeu! Recupera vitalidade e concede ouro.",
      stat: "+100 HP & +50 Ouro",
      badge: "Fortuna",
      iconSvg: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#f1c40f"/></svg>`,
      apply: () => {
        player.hp = Math.min(player.maxHp, player.hp + 100);
        addPersistentGold(50);
      }
    });
  }

  // Bônus de Transmutação Cósmica (Keystone do Destino)
  if (player && player.doubleChestChance > 0 && Math.random() < player.doubleChestChance) {
    if (subElem) {
      subElem.innerHTML += ` <span style="color:#f39c12; font-weight:bold;">${renderIcon('transmute', { size: 13, style: 'margin-right:3px;' })} TRANSMUTAÇÃO CÓSMICA ATIVADA! (+Dádiva Astral)</span>`;
    }
    const extraUpgrades = getRandomUpgrades(1);
    if (extraUpgrades.length > 0) {
      const u = extraUpgrades[0];
      pendingRewards.push({
        isLegendary: false,
        title: u.title,
        desc: `[Transmutação Cósmica] ${u.desc}`,
        stat: u.stat,
        badge: "Dádiva Astral",
        iconSvg: `<svg viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="#f39c12"/></svg>`,
        apply: () => {
          u.apply();
          addPersistentGold(50);
        }
      });
    } else {
      pendingRewards.push({
        isLegendary: false,
        title: "Transmutação de Almas",
        desc: "A fenda cósmica duplicou o tesouro, vertendo essências imortais adicionais.",
        stat: "+100 Almas Persistentes",
        badge: "Dádiva Astral",
        iconSvg: `<svg viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="#f39c12"/></svg>`,
        apply: () => {
          addPersistentGold(100);
        }
      });
    }
  }

  // 2. Criar cartas no estado enigmático
  const cardElements = [];
  pendingRewards.forEach(r => {
    const card = document.createElement('div');
    card.className = `chest-card ${r.isLegendary ? 'legendary-card' : ''}`;
    card.innerHTML = `
      <div class="chest-card-icon">${r.iconSvg}</div>
      <div class="chest-card-info">
        ${r.isLegendary ? `<span class="legendary-pill">${renderIcon('star_evolution', { size: 11, color: '#f1c40f', style: 'margin-right:3px;' })} EVOLUÇÃO LENDÁRIA</span>` : ''}
        <div class="chest-card-title">
          <span>${r.title}</span>
          <span style="font-size: 10px; color: ${r.isLegendary ? '#f1c40f' : '#8890a6'}; font-weight: normal;">${r.badge}</span>
        </div>
        <div class="chest-card-stat">${r.stat}</div>
        <div class="chest-card-desc">${r.desc}</div>
      </div>
    `;
    list.appendChild(card);
    cardElements.push({ el: card, reward: r });
  });

  // 3. Travar o botão de claim durante a revelação
  if (claimBtn) {
    claimBtn.disabled = true;
    claimBtn.innerText = "Revelando Recompensas...";
    claimBtn.onclick = null;
  }

  modal.style.display = 'flex';

  // 4. Sequência cadenciada de Unboxing
  let currentIdx = 0;
  function revealNext() {
    if (currentIdx >= cardElements.length) {
      if (claimBtn) {
        claimBtn.disabled = false;
        claimBtn.innerText = "Equipar Poderes e Continuar";
        claimBtn.onclick = () => {
          modal.style.display = 'none';
          gameState.isPaused = false;
          setLastTime(performance.now());

          if (!activeBoss) {
            const waveSeconds = Math.floor(frameCount / 60);
            const hordeSeconds = getEffectiveHordeSeconds(waveSeconds);
            const currentWave = getCurrentWave(hordeSeconds);
            transitionToArenaTheme(getWaveArenaTheme(currentWave.index), 90);
            setIsWavePaused(false);
            resetSpawnTimer();
            triggerShake(8);
            playSfx('level');
          }
        };
      }
      return;
    }

    const { el, reward } = cardElements[currentIdx];
    reward.apply();
    el.classList.add('revealed');

    if (reward.isLegendary) {
      playSfx('evolution');
      triggerShake(12);
      triggerHaptic('heavy');
      recordRunStats({ evolution: true });
    } else {
      playSfx('card_hover');
    }

    currentIdx++;
    setTimeout(revealNext, reward.isLegendary ? 520 : 360);
  }

  // Delay para animação da tampa abrir antes da primeira carta
  setTimeout(revealNext, 450);
}

/**
 * Execução Dramática de Morte (Horror Grim Cyber-Gothic)
 */
const DEATH_VERDICTS = [
  "SUA CARNE ALIMENTA AS PROFUNDEZAS",
  "A ARENA BEBEU ATÉ SUA ÚLTIMA GOTA",
  "NÃO RESTOU ALMA PARA REIVINDICAR",
  "O ABISMO DEVOLVE APENAS OSSOS",
  "EXTINTO NO SILÊNCIO DA CRIPTA",
  "SEUS GRITOS ECOAM NO VÁCUO ETERNO",
  "A HORDA CONSAGRA SEU SACRIFÍCIO",
  "A MORTE NÃO TEVE PRESSA, APENAS PACIÊNCIA",
  "CINZAS AO PÓ, SANGUE À TERRA MALDITA",
  "VOCÊ FOI APENAS MAIS UM BANQUETE"
];

export function triggerDeath() {
  gameState.isDead = true;
  resetInput();
  triggerHaptic('heavy');
  applyDeathAudioFilter();
  playSfx('death_heartbeat');

  setTimeout(() => {
    playSfx('tombstone_slam');
  }, 350);

  // Ativação do filtro vermelho necrótico
  const bloodFilter = document.getElementById('blood-screen-filter');
  if (bloodFilter) bloodFilter.classList.add('active');

  // Sorteio dinâmico de uma das 10 sentenças
  const randomVerdict = DEATH_VERDICTS[Math.floor(Math.random() * DEATH_VERDICTS.length)];
  const titleElem = document.getElementById('death-verdict-title');
  if (titleElem) {
    titleElem.innerText = randomVerdict;
  }

  const timerElem = document.getElementById('timer-val');
  const time = timerElem ? timerElem.innerText : '00:00';
  const summary = document.getElementById('death-summary');

  const newlyUnlocked = recordRunStats({
    kills: gameState.kills,
    runFinished: true
  });

  const killerName = lastAttackerName || 'A Horda do Abismo';

  let achBanner = '';
  if (newlyUnlocked && newlyUnlocked.length > 0) {
    achBanner = `
      <div style="margin-top: 8px; padding: 6px 10px; background: rgba(0, 245, 212, 0.12); border: 1px solid rgba(0, 245, 212, 0.5); border-radius: 4px; text-align: left;">
        <span style="color: #ffd166; font-size: 10px; font-weight: bold; letter-spacing: 0.5px;">✨ CONQUISTA DESBLOQUEADA!</span><br>
        ${newlyUnlocked.map(a => `<span style="color: #00f5d4; font-size: 11px;"><b>${a.title}</b>: ${a.heroTitle ? `Despertou <b>${a.heroTitle}</b> no Altar!` : a.desc}</span>`).join('<br>')}
      </div>
    `;
  }

  if (summary) {
    summary.innerHTML = `
      <div style="margin-bottom: 6px; border-bottom: 1px solid #3d070b; padding-bottom: 6px;">
        <span style="color: #8c94a8; font-size: 10px; text-transform: uppercase;">Sentença Final:</span><br>
        <b style="color: #e74c3c; font-size: 13px;">Executado por ${killerName}</b>
      </div>
      Tempo de Sobrevivência: <b style="color:#fff;">${time}</b><br>
      Abominações Abatidas: <b style="color:#e74c3c;">${gameState.kills}</b><br>
      Nível de Poder Atingido: <b style="color:#f1c40f;">Nível ${player.level}</b><br>
      Ouro Resgatado para a Alma: <b style="color:#f39c12; display: inline-flex; align-items: center; gap: 3px;">${renderIcon('gold', { size: 11, color: '#f1c40f' })} ${getPersistentGold()}</b>
      ${achBanner}
    `;
  }

  const modal = document.getElementById('death-modal');
  if (modal) modal.style.display = 'flex';
}

export function finalizeVictoryAndReturnToMenu() {
  gameState.isWon = true;
  gameState.isPaused = false;
  resetInput();

  recordRunStats({
    kills: gameState.kills,
    wave: 10,
    bossDefeated: 4,
    runFinished: true
  });

  bullets.length = 0;
  enemyBullets.length = 0;
  bossTelegraphs.length = 0;
  bossProjectiles.length = 0;
  bossShockwaves.length = 0;
  voidVortices.length = 0;

  const bossHud = document.getElementById('boss-hud');
  if (bossHud) bossHud.style.display = 'none';

  const modal = document.getElementById('victory-modal');
  if (modal) modal.style.display = 'none';

  // Retorna triunfalmente ao menu de seleção de personagens
  openCharacterSelect();

  setTimeout(() => {
    const fadeOverlay = document.getElementById('victory-fade-overlay');
    if (fadeOverlay) {
      fadeOverlay.classList.remove('active');
      fadeOverlay.style.opacity = '0';
    }
  }, 400);
}

export function triggerVictory() {
  // Transição de segurança / legado
  finalizeVictoryAndReturnToMenu();
}

// Brasões Heráldicos Vetoriais dos Campeões (Geometria 24x24)
const HERO_EMBLEMS_SVG = {
  KNIGHT: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,1.2 13.8,4.5 10.2,4.5" fill="currentColor"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z" fill="currentColor" fill-opacity="0.18"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z"/>
      <line x1="6.5" y1="4.5" x2="6.5" y2="12"/>
      <line x1="17.5" y1="4.5" x2="17.5" y2="12"/>
      <line x1="12" y1="5.8" x2="12" y2="10.8" stroke-width="1.6"/>
      <line x1="9.5" y1="8.3" x2="14.5" y2="8.3" stroke-width="1.6"/>
      <rect x="9.8" y="12" width="4.4" height="2" rx="0.5" fill="currentColor"/>
      <line x1="12" y1="14" x2="12" y2="21.5" stroke-width="2.4"/>
      <line x1="10" y1="16.5" x2="14" y2="16.5" stroke-width="1.3"/>
      <line x1="10" y1="19" x2="14" y2="19" stroke-width="1.3"/>
      <circle cx="12" cy="22" r="1.5" fill="currentColor"/>
    </svg>
  `,
  PALADIN: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,1.2 13.8,4.5 10.2,4.5" fill="currentColor"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z" fill="currentColor" fill-opacity="0.18"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z"/>
      <line x1="6.5" y1="4.5" x2="6.5" y2="12"/>
      <line x1="17.5" y1="4.5" x2="17.5" y2="12"/>
      <line x1="12" y1="5.8" x2="12" y2="10.8" stroke-width="1.6"/>
      <line x1="9.5" y1="8.3" x2="14.5" y2="8.3" stroke-width="1.6"/>
      <rect x="9.8" y="12" width="4.4" height="2" rx="0.5" fill="currentColor"/>
      <line x1="12" y1="14" x2="12" y2="21.5" stroke-width="2.4"/>
      <line x1="10" y1="16.5" x2="14" y2="16.5" stroke-width="1.3"/>
      <line x1="10" y1="19" x2="14" y2="19" stroke-width="1.3"/>
      <circle cx="12" cy="22" r="1.5" fill="currentColor"/>
    </svg>
  `,
  MAGE: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v20"/>
      <circle cx="12" cy="5" r="3"/>
      <path d="M8 8c0 4 8 4 8 8"/>
      <polygon points="12,1 15,4 9,4" fill="currentColor"/>
      <path d="M7 3l2 2M17 3l-2 2"/>
    </svg>
  `,
  ROGUE: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="21,3 12.5,8.5 15.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="21,3 12.5,8.5 15.5,11.5"/>
      <line x1="20" y1="4" x2="14" y2="10" stroke-width="1.2"/>
      <line x1="10.8" y1="6.8" x2="17.2" y2="13.2" stroke-width="2"/>
      <line x1="14" y1="10" x2="6.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="5.5" cy="18.5" r="1.5" fill="currentColor"/>

      <polygon points="3,3 11.5,8.5 8.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="3,3 11.5,8.5 8.5,11.5"/>
      <line x1="4" y1="4" x2="10" y2="10" stroke-width="1.2"/>
      <line x1="13.2" y1="6.8" x2="6.8" y2="13.2" stroke-width="2"/>
      <line x1="10" y1="10" x2="17.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor"/>

      <circle cx="12" cy="3.5" r="0.9" fill="currentColor"/>
      <circle cx="12" cy="20.5" r="0.9" fill="currentColor"/>
    </svg>
  `,
  WARRIOR: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="21,3 12.5,8.5 15.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="21,3 12.5,8.5 15.5,11.5"/>
      <line x1="20" y1="4" x2="14" y2="10" stroke-width="1.2"/>
      <line x1="10.8" y1="6.8" x2="17.2" y2="13.2" stroke-width="2"/>
      <line x1="14" y1="10" x2="6.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="5.5" cy="18.5" r="1.5" fill="currentColor"/>

      <polygon points="3,3 11.5,8.5 8.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="3,3 11.5,8.5 8.5,11.5"/>
      <line x1="4" y1="4" x2="10" y2="10" stroke-width="1.2"/>
      <line x1="13.2" y1="6.8" x2="6.8" y2="13.2" stroke-width="2"/>
      <line x1="10" y1="10" x2="17.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor"/>

      <circle cx="12" cy="3.5" r="0.9" fill="currentColor"/>
      <circle cx="12" cy="20.5" r="0.9" fill="currentColor"/>
    </svg>
  `,
  BARBARIAN: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,1.2 13.8,4.5 10.2,4.5" fill="currentColor"/>
      <path d="M10.5 5.5C7.5 4.8 4.5 4.2 2.5 3.5c-1.2 3.2-1.2 6.8 0 10 2-.7 5-1.3 8-2z" fill="currentColor" fill-opacity="0.22"/>
      <path d="M10.5 5.5C7.5 4.8 4.5 4.2 2.5 3.5c-1.2 3.2-1.2 6.8 0 10 2-.7 5-1.3 8-2z"/>
      <path d="M13.5 5.5C16.5 4.8 19.5 4.2 21.5 3.5c1.2 3.2 1.2 6.8 0 10-2-.7-5-1.3-8-2z" fill="currentColor" fill-opacity="0.22"/>
      <path d="M13.5 5.5C16.5 4.8 19.5 4.2 21.5 3.5c1.2 3.2 1.2 6.8 0 10-2-.7-5-1.3-8-2z"/>
      <rect x="9.8" y="5.2" width="4.4" height="6.3" rx="0.6" fill="currentColor"/>
      <line x1="12" y1="11.5" x2="12" y2="21.5" stroke-width="2.4"/>
      <line x1="10" y1="14" x2="14" y2="16.5" stroke-width="1.3"/>
      <line x1="14" y1="14" x2="10" y2="16.5" stroke-width="1.3"/>
      <line x1="10" y1="17.5" x2="14" y2="20" stroke-width="1.3"/>
      <line x1="14" y1="17.5" x2="10" y2="20" stroke-width="1.3"/>
      <polygon points="12,23.5 10.2,21.5 13.8,21.5" fill="currentColor"/>
    </svg>
  `,
  ALCHEMIST: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 3h6"/>
      <line x1="10" y1="3" x2="10" y2="7"/>
      <line x1="14" y1="3" x2="14" y2="7"/>
      <path d="M10 7L5 18a2.5 2.5 0 0 0 2.2 3.5h9.6a2.5 2.5 0 0 0 2.2-3.5L14 7"/>
      <path d="M7 15c2.5-1.2 7.5-1.2 10 0" stroke-opacity="0.8"/>
      <circle cx="10" cy="18" r="1.2" fill="currentColor"/>
      <circle cx="14.5" cy="16.5" r="0.8" fill="currentColor"/>
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor"/>
    </svg>
  `
};

// Configuração Cromática e Valores Numéricos de Medidores (0 a 5)
const CHARACTER_PROFILES = {
  KNIGHT: {
    themeColor: '#f1c40f',
    emblemSvg: HERO_EMBLEMS_SVG.PALADIN,
    weaponName: 'Martelo Sagrado',
    levels: { dano: 3, area: 4, vel: 1, res: 5 }
  },
  PALADIN: {
    themeColor: '#f1c40f',
    emblemSvg: HERO_EMBLEMS_SVG.PALADIN,
    weaponName: 'Martelo dos Titãs',
    levels: { dano: 3, area: 4, vel: 1, res: 5 }
  },
  MAGE: {
    themeColor: '#ff7675',
    emblemSvg: HERO_EMBLEMS_SVG.MAGE,
    weaponName: 'Cajado da Tormenta',
    levels: { dano: 5, area: 3, vel: 3, res: 2 }
  },
  ROGUE: {
    themeColor: '#00cec9',
    emblemSvg: HERO_EMBLEMS_SVG.ROGUE,
    weaponName: 'Lâminas Espirituais',
    levels: { dano: 4, area: 2, vel: 5, res: 2 }
  },
  WARRIOR: {
    themeColor: '#00cec9',
    emblemSvg: HERO_EMBLEMS_SVG.ROGUE,
    weaponName: 'Lâminas Espectrais',
    levels: { dano: 4, area: 2, vel: 5, res: 2 }
  },
  BARBARIAN: {
    themeColor: '#e74c3c',
    emblemSvg: HERO_EMBLEMS_SVG.BARBARIAN,
    weaponName: 'Machado Orbital',
    levels: { dano: 5, area: 4, vel: 2, res: 4 }
  },
  ALCHEMIST: {
    themeColor: '#2ecc71',
    emblemSvg: HERO_EMBLEMS_SVG.ALCHEMIST,
    weaponName: 'Frascos Cáusticos',
    levels: { dano: 3, area: 5, vel: 3, res: 2 }
  }
};

let activeShowcaseHeroKey = 'KNIGHT';
let activeMobileTab = 'skills'; // 'skills' | 'stats'
let activeRenderAstrolabe = null;

export function isMobileScreen() {
  return layoutMetrics.isCompactWidth || 
         layoutMetrics.isCompactHeight || 
         window.innerWidth <= 768 || 
         ('ontouchstart' in window && window.innerWidth <= 950) || 
         /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}

export function closeCharSelectModal() {
  stopPreview();
  const charModal = document.getElementById('char-modal');
  if (charModal) {
    charModal.classList.add('modal-hidden');
    charModal.style.setProperty('display', 'none', 'important');
    charModal.style.display = 'none';
  }
}

export function openCharacterSelect() {
  gameState.isPaused = true;
  resetDeathAudioFilter();
  const bloodFilter = document.getElementById('blood-screen-filter');
  if (bloodFilter) bloodFilter.classList.remove('active');

  const talentsModal = document.getElementById('talents-modal');
  if (talentsModal) {
    talentsModal.classList.add('modal-hidden');
    talentsModal.style.setProperty('display', 'none', 'important');
    talentsModal.style.display = 'none';
  }

  const achievementsModal = document.getElementById('achievements-modal');
  if (achievementsModal) {
    achievementsModal.classList.add('modal-hidden');
    achievementsModal.style.setProperty('display', 'none', 'important');
    achievementsModal.style.display = 'none';
  }

  const bestiaryModal = document.getElementById('bestiary-modal');
  if (bestiaryModal) {
    bestiaryModal.classList.add('modal-hidden');
    bestiaryModal.style.setProperty('display', 'none', 'important');
    bestiaryModal.style.display = 'none';
  }

  const deathModal = document.getElementById('death-modal');
  if (deathModal) deathModal.style.display = 'none';

  const victoryModal = document.getElementById('victory-modal');
  if (victoryModal) victoryModal.style.display = 'none';

  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) pauseModal.style.display = 'none';

  const bossModal = document.getElementById('boss-select-modal');
  if (bossModal) bossModal.style.display = 'none';

  const charModal = document.getElementById('char-modal');
  const pedestalsContainer = document.getElementById('char-pedestals');
  const showcaseContainer = document.getElementById('char-showcase');
  if (!charModal || !pedestalsContainer || !showcaseContainer) return;

  charModal.classList.remove('modal-hidden');
  charModal.style.removeProperty('display');
  charModal.style.display = 'flex';

  // Detecção e aplicação de classe mobile para layout responsivo exclusivo
  const isMobile = isMobileScreen();
  charModal.classList.toggle('is-mobile-device', isMobile);

  // Atualizar contador de Almas no cabeçalho
  const soulsVal = document.getElementById('char-souls-val');
  if (soulsVal) {
    soulsVal.innerText = getPersistentGold();
  }

  // Função geradora de medidores segmentados estilizados
  const renderSegments = (val) => {
    let segs = '<div class="segmented-meter">';
    for (let i = 1; i <= 5; i++) {
      segs += `<div class="segment-cell ${i <= val ? 'filled' : ''}"></div>`;
    }
    segs += '</div>';
    return segs;
  };

  const heroKeys = Object.keys(CHARACTERS);

  if (!isHeroUnlocked(activeShowcaseHeroKey)) {
    activeShowcaseHeroKey = 'KNIGHT';
  }

  function selectAdjacentHero(step) {
    const curIdx = heroKeys.indexOf(activeShowcaseHeroKey);
    const nextIdx = (curIdx + step + heroKeys.length) % heroKeys.length;
    try { playSfx('card_hover'); } catch(e) {}
    triggerHaptic('light');
    renderShowcase(heroKeys[nextIdx]);

    // Rola suavemente o botão de pedestal ativo para o centro no carrossel mobile
    const activeBtn = pedestalsContainer.querySelector(`[data-hero="${heroKeys[nextIdx]}"]`);
    if (activeBtn && activeBtn.scrollIntoView) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function renderShowcase(heroKey) {
    activeShowcaseHeroKey = heroKey;
    const char = CHARACTERS[heroKey] || CHARACTERS.KNIGHT;
    const profile = CHARACTER_PROFILES[heroKey] || CHARACTER_PROFILES.KNIGHT;
    const unlocked = isHeroUnlocked(heroKey);
    const achId = HERO_UNLOCK_MAP[heroKey];
    const status = achId ? getAchievementStatus(achId) : null;

    setPreviewHero(heroKey);

    const badge = document.getElementById('stage-archetype-badge');
    if (badge) {
      badge.innerText = char.title.toUpperCase() + (!unlocked ? ' • 🔒' : '');
      badge.style.color = unlocked ? profile.themeColor : '#747d8c';
      badge.style.borderColor = unlocked ? `${profile.themeColor}aa` : '#4b5563';
      badge.style.boxShadow = unlocked ? `0 0 18px ${profile.themeColor}66` : 'none';
    }

    showcaseContainer.style.setProperty('--showcase-color', unlocked ? profile.themeColor : '#747d8c');
    charModal.style.setProperty('--showcase-color', unlocked ? profile.themeColor : '#747d8c');

    const diff = char.difficulty || 1;
    let diffDots = '';
    for (let d = 1; d <= 3; d++) {
      diffDots += `<span class="diff-dot ${d <= diff ? 'filled' : 'empty'}">◆</span>`;
    }
    const diffLabel = diff === 1 ? 'Iniciante' : (diff === 2 ? 'Equilibrado' : 'Avançado');

    showcaseContainer.innerHTML = `
      <div class="showcase-header-v2">
        <div class="showcase-title-row">
          <div class="showcase-archetype-pill" style="color: ${profile.themeColor}; border-color: ${profile.themeColor};">
            ${char.title}
          </div>
          <div class="showcase-diff-badge" title="Dificuldade do Herói">
            <span class="diff-label">${diffLabel}</span>
            <span class="diff-dots">${diffDots}</span>
          </div>
        </div>

        <div class="showcase-name-v2">${char.name}</div>
        <div class="showcase-role-tag">Função: <b>${char.role || 'Guerreiro'}</b></div>
      </div>

      ${!unlocked && status ? `
        <div class="showcase-lock-dossier">
          <div class="lock-dossier-header">
            <span class="lock-icon-lg">🔒</span>
            <div class="lock-titles">
              <span class="lock-eyebrow">SELO PRIMORDIAL • REQUISITO DE DESBLOQUEIO</span>
              <div class="lock-name">${status.title}</div>
            </div>
          </div>
          <div class="lock-desc">${status.desc}</div>
          <div class="lock-progress-box">
            <div class="lock-progress-track">
              <div class="lock-progress-fill" style="width: ${status.percent}%;"></div>
            </div>
            <div class="lock-progress-meta">
              <span class="lock-cur-val">Progresso: <b>${status.label}</b></span>
              <span class="lock-pct-val">${status.percent}%</span>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Navegador Tático Mobile Exclusivo -->
      <div class="showcase-mobile-nav">
        <button class="showcase-tab-btn ${activeMobileTab === 'skills' ? 'active' : ''}" data-tab="skills">
          ${renderIcon('sword', { size: 11, color: activeMobileTab === 'skills' ? profile.themeColor : '#8c94a8' })} COMBATE
        </button>
        <button class="showcase-tab-btn ${activeMobileTab === 'stats' ? 'active' : ''}" data-tab="stats">
          ${renderIcon('armor', { size: 11, color: activeMobileTab === 'stats' ? profile.themeColor : '#8c94a8' })} BIOGRAFIA & LORE
        </button>
      </div>

      <!-- Bento Box Tático Responsivo -->
      <div class="bento-tactical-grid" data-active-tab="${activeMobileTab}">
        <!-- Bloco 1: Arsenal & Habilidades -->
        <div class="bento-tab-pane bento-pane-skills ${activeMobileTab === 'skills' ? 'tab-visible' : ''}">
          <!-- Card 1: Arma Inicial -->
          <div class="bento-card bento-card-weapon">
            <div class="bento-card-top">
              <span class="bento-type-tag">${renderIcon(WEAPON_ICONS[char.startingWeapon] || 'sword', { size: 10, color: profile.themeColor })} ARMA INICIAL</span>
              <span class="bento-spec-badge" style="color: ${profile.themeColor}; border-color: ${profile.themeColor}55;">${char.weapon?.type || profile.weaponName}</span>
            </div>
            <div class="bento-card-title" style="color: ${profile.themeColor};">${char.weapon?.name || profile.weaponName}</div>
            <div class="bento-card-desc">${char.weapon?.desc || ''}</div>
          </div>

          <!-- Card 2: Poder Ancestral -->
          <div class="bento-card bento-card-skill">
            <div class="bento-card-top">
              <span class="bento-type-tag">${renderIcon('damage', { size: 10, color: profile.themeColor })} PODER ANCESTRAL</span>
              <span class="bento-spec-badge bento-cd-badge">${renderIcon('timer', { size: 9 })} ${char.skill?.cooldown || '7s'}</span>
            </div>
            <div class="bento-card-title" style="color: ${profile.themeColor};">${char.skill?.name || 'Habilidade'}</div>
            <div class="bento-card-desc">${char.skill?.desc || ''}</div>
          </div>

          <!-- Card 3: Bênção Passiva -->
          <div class="bento-card bento-card-passive" style="border-color: ${profile.themeColor}35;">
            <div class="bento-card-top">
              <span class="bento-type-tag">${renderIcon('armor', { size: 10, color: profile.themeColor })} BÊNÇÃO PASSIVA</span>
              <span class="bento-inline-title" style="color: ${profile.themeColor};">${char.passive?.name || 'Aura'}</span>
            </div>
            <div class="bento-card-desc">${char.passive?.desc || ''}</div>
          </div>

          <!-- Card 4 (Mobile Unificado): Medidores Rápidos de Atributos -->
          <div class="bento-mobile-stats-row">
            <div class="bento-stats-container bento-stats-compact">
              <div class="bento-attr-item"><span>DANO</span>${renderSegments(profile.levels.dano)}</div>
              <div class="bento-attr-item"><span>ÁREA</span>${renderSegments(profile.levels.area)}</div>
              <div class="bento-attr-item"><span>VEL</span>${renderSegments(profile.levels.vel)}</div>
              <div class="bento-attr-item"><span>RES</span>${renderSegments(profile.levels.res)}</div>
            </div>
          </div>
        </div>

        <!-- Bloco 2: Atributos & Biometria -->
        <div class="bento-tab-pane bento-pane-stats ${activeMobileTab === 'stats' ? 'tab-visible' : ''}">
          <div class="bento-stats-container">
            <div class="bento-attr-item"><span>DANO</span>${renderSegments(profile.levels.dano)}</div>
            <div class="bento-attr-item"><span>ÁREA</span>${renderSegments(profile.levels.area)}</div>
            <div class="bento-attr-item"><span>VEL</span>${renderSegments(profile.levels.vel)}</div>
            <div class="bento-attr-item"><span>RES</span>${renderSegments(profile.levels.res)}</div>
          </div>

          <!-- Citação de Lore Imersiva -->
          <div class="showcase-lore-quote">
            “${char.lore || ''}”
          </div>
        </div>
      </div>

      ${unlocked ? `
        <button class="card-btn btn-summon-hero" id="confirm-hero-btn">
          ${renderIcon('damage', { size: 13, style: 'margin-right:6px;' })} DESPERTAR NO VÁCUO ${renderIcon('damage', { size: 13, style: 'margin-left:6px;' })}
        </button>
      ` : `
        <button class="card-btn btn-summon-hero btn-hero-locked" id="confirm-hero-btn" disabled style="background: #231620; border-color: #ff767555; color: #ff7675; cursor: not-allowed; opacity: 0.9;">
          🔒 SELO PRIMORDIAL ATIVO (CUMPRA O REQUISITO)
        </button>
      `}
    `;

    // Eventos das Abas Mobile
    const tabBtns = showcaseContainer.querySelectorAll('.showcase-tab-btn');
    tabBtns.forEach(tBtn => {
      tBtn.onclick = () => {
        activeMobileTab = tBtn.getAttribute('data-tab');
        try { playSfx('card_hover'); } catch(e) {}
        triggerHaptic('light');
        renderShowcase(heroKey);
      };
    });

    const confirmBtn = document.getElementById('confirm-hero-btn');
    if (confirmBtn) {
      if (unlocked) {
        confirmBtn.style.setProperty('--btn-theme-color', profile.themeColor);
        confirmBtn.onclick = () => {
          setSelectedHeroKey(heroKey);
          closeCharSelectModal();
          resetGame();
          try { playSfx('warp'); } catch(e) {}
        };
      } else {
        confirmBtn.onclick = null;
      }
    }

    // Atualiza classes ativas nos botões de pedestal
    const btns = pedestalsContainer.querySelectorAll('.char-pedestal-btn');
    btns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-hero') === heroKey);
    });
  }

  pedestalsContainer.innerHTML = '';
  heroKeys.forEach(key => {
    const c = CHARACTERS[key];
    const profile = CHARACTER_PROFILES[key] || CHARACTER_PROFILES.KNIGHT;
    const diff = c.difficulty || 1;
    let miniDots = '◆'.repeat(diff) + '◇'.repeat(3 - diff);
    const unlocked = isHeroUnlocked(key);

    const btn = document.createElement('div');
    btn.className = `char-pedestal-btn ${key === activeShowcaseHeroKey ? 'active' : ''} ${!unlocked ? 'hero-locked' : ''}`;
    btn.setAttribute('data-hero', key);
    btn.setAttribute('title', `${c.name} (${c.title})${!unlocked ? ' • Bloqueado' : ''}`);
    btn.style.setProperty('--btn-theme-color', unlocked ? profile.themeColor : '#57606f');
    btn.innerHTML = `
      <div class="char-pedestal-emblem" style="border-color: ${unlocked ? profile.themeColor : '#4b5563'}; color: ${unlocked ? profile.themeColor : '#6b7280'}; position: relative;">
        ${profile.emblemSvg}
        ${!unlocked ? '<div class="pedestal-lock-badge">🔒</div>' : ''}
      </div>
      <div class="char-pedestal-info">
        <div class="char-pedestal-title" style="color: ${unlocked ? profile.themeColor : '#9ca3af'};">${c.title}</div>
        <div class="char-pedestal-name" style="${!unlocked ? 'color: #9ca3af;' : ''}">${c.name}</div>
        <div class="char-pedestal-role-mini">
          ${unlocked 
            ? `${c.role || ''} · <span class="mini-diff" style="color: ${profile.themeColor};">${miniDots}</span>` 
            : `<span style="color: #ff7675; font-weight: 700; font-size: 10px;">🔒 BLOQUEADO</span>`
          }
        </div>
      </div>
      <div class="pedestal-active-glow" style="background: ${unlocked ? profile.themeColor : '#ff7675'}; box-shadow: 0 0 12px ${unlocked ? profile.themeColor : '#ff7675'};"></div>
    `;

    btn.onclick = () => {
      try { playSfx('card_hover'); } catch(e) {}
      triggerHaptic('light');
      renderShowcase(key);
      if (btn.scrollIntoView) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    };

    pedestalsContainer.appendChild(btn);
  });

  // Setas de Navegação Rápida do Palco (Ideal para touch)
  const prevBtn = document.getElementById('btn-stage-prev');
  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      selectAdjacentHero(-1);
    };
  }

  const nextBtn = document.getElementById('btn-stage-next');
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      selectAdjacentHero(1);
    };
  }

  // Gestos de Deslize Touch (Swipe) no Palco de Evocação
  const stageViewport = document.querySelector('.char-stage-viewport');
  if (stageViewport && !stageViewport._hasSwipeAttached) {
    stageViewport._hasSwipeAttached = true;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    stageViewport.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    stageViewport.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const deltaTime = Date.now() - touchStartTime;

        // Movimento horizontal de no mínimo 38px e predominante sobre o vertical
        if (Math.abs(deltaX) > 38 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && deltaTime < 550) {
          if (deltaX < 0) {
            selectAdjacentHero(1); // Deslize para esquerda -> próximo
          } else {
            selectAdjacentHero(-1); // Deslize para direita -> anterior
          }
        }
      }
    }, { passive: true });
  }

  // Configuração dos Controles Interativos da Prévia
  const facingBtn = document.getElementById('btn-preview-facing');
  if (facingBtn) {
    facingBtn.onclick = () => {
      const dir = togglePreviewFacing();
      facingBtn.classList.toggle('flipped', dir === -1);
      try { playSfx('card_hover'); } catch(e) {}
    };
  }

  const poseBtns = document.querySelectorAll('.stage-pose-btn');
  poseBtns.forEach(pBtn => {
    pBtn.onclick = () => {
      poseBtns.forEach(b => b.classList.remove('active'));
      pBtn.classList.add('active');
      const pose = pBtn.getAttribute('data-pose');
      setPreviewPose(pose);
    };
  });

  const previewCanvasEl = document.getElementById('char-preview-canvas');
  if (previewCanvasEl) {
    previewCanvasEl.onclick = () => {
      triggerHeroSurge(true);
    };
  }

  renderShowcase(activeShowcaseHeroKey);
  charModal.style.display = 'flex';

  // Sincronização garantida de layout e canvas pós-exibição do modal
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      resizePreviewCanvas();
    });
  }
  setTimeout(() => {
    resizePreviewCanvas();
  }, 50);

  // Iniciar loop de animação da prévia em canvas
  startPreview(activeShowcaseHeroKey);
}

// Runas Sagradas do Astrolábio (SVG Matemático Puro em Grade 24x24 para os 14 Talentos)
const TALENT_RUNES_SVG = {
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
const ASTROLABE_NODE_COORDS = {
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
const ASTROLABE_MOBILE_COORDS = {
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

let selectedAstrolabeNodeId = 'damage';
let activeConstellationFilter = 'all'; // 'all' | 'guerra' | 'egide' | 'destino'

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

function renderBlessingsSummary() {
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

export function openAchievementsModal() {
  closeCharSelectModal();

  const modal = document.getElementById('achievements-modal');
  const grid = document.getElementById('achievements-list-grid');
  const unlockedCountEl = document.getElementById('achievements-unlocked-count');
  const totalCountEl = document.getElementById('achievements-total-count');
  if (!modal || !grid) return;

  const isMobile = isMobileScreen();
  modal.classList.toggle('is-mobile-device', isMobile);

  const unlockedIds = getUnlockedAchievementIds();
  if (unlockedCountEl) unlockedCountEl.innerText = unlockedIds.length;
  if (totalCountEl) totalCountEl.innerText = ACHIEVEMENTS.length;

  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(ach => {
    const status = getAchievementStatus(ach.id);
    const card = document.createElement('div');
    card.className = `achievement-card ${status.isCompleted ? 'ach-completed' : 'ach-locked'}`;

    let rewardBadge = '';
    if (ach.heroTitle) {
      rewardBadge = `<span class="ach-reward-pill ach-hero-reward">🔓 Desbloqueia: <b>${ach.heroTitle}</b></span>`;
    } else if (ach.rewardGold > 0) {
      rewardBadge = `<span class="ach-reward-pill ach-gold-reward">${renderIcon('gold', { size: 10, color: '#f1c40f' })} +${ach.rewardGold} Almas</span>`;
    }

    card.innerHTML = `
      <div class="ach-card-icon-wrap ${status.isCompleted ? 'completed' : ''}">
        <span class="ach-emblem-icon">${status.isCompleted ? '✨' : '🔒'}</span>
      </div>
      <div class="ach-card-details">
        <div class="ach-card-top-row">
          <div class="ach-card-name ${status.isCompleted ? 'name-completed' : ''}">${ach.title}</div>
          <span class="ach-status-badge ${status.isCompleted ? 'badge-done' : 'badge-pending'}">
            ${status.isCompleted ? '✓ CONCLUÍDO' : status.label}
          </span>
        </div>
        <div class="ach-card-desc">${ach.desc}</div>
        <div class="ach-progress-container">
          <div class="ach-progress-rail">
            <div class="ach-progress-bar" style="width: ${status.percent}%;"></div>
          </div>
          <div class="ach-card-bottom-row">
            <div class="ach-reward-wrap">${rewardBadge}</div>
            <span class="ach-pct-text">${status.percent}%</span>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  modal.classList.remove('modal-hidden');
  modal.style.removeProperty('display');
  modal.style.display = 'flex';
  playSfx('level');
}

export function closeAchievementsModal() {
  const modal = document.getElementById('achievements-modal');
  if (modal) {
    modal.classList.add('modal-hidden');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.display = 'none';
  }
  openCharacterSelect();
}

// ========================================================
// CÓDICE DO BESTIÁRIO DAS TREVAS (Grimório de Criaturas)
// ========================================================
export let currentBestiaryCategory = 'ALL';
export let selectedCreatureId = 'ZOMBIE';

export function openBestiaryModal() {
  closeCharSelectModal();

  const modal = document.getElementById('bestiary-modal');
  if (!modal) return;

  const isMobile = isMobileScreen();
  modal.classList.toggle('is-mobile-device', isMobile);

  renderBestiaryRoster(currentBestiaryCategory);
  renderBestiaryDossier(selectedCreatureId);

  modal.classList.remove('modal-hidden');
  modal.style.removeProperty('display');
  modal.style.display = 'flex';
  playSfx('level');
}

export function closeBestiaryModal() {
  stopBestiaryPreview();
  const modal = document.getElementById('bestiary-modal');
  if (modal) {
    modal.classList.add('modal-hidden');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.display = 'none';
  }
  openCharacterSelect();
}

export function selectBestiaryCreature(creatureId) {
  selectedCreatureId = creatureId;
  const cards = document.querySelectorAll('.bestiary-card');
  cards.forEach(c => {
    const isTarget = c.getAttribute('data-id') === creatureId;
    c.classList.toggle('active', isTarget);
    if (isTarget) {
      try {
        c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (err) {}
    }
  });
  renderBestiaryDossier(creatureId);
  playSfx('click');
}

export function renderBestiaryRoster(filterCategory = 'ALL') {
  const rosterGrid = document.getElementById('bestiary-roster-grid');
  if (!rosterGrid) return;

  rosterGrid.innerHTML = '';

  let entries = BESTIARY_ENTRIES;
  if (filterCategory && filterCategory !== 'ALL') {
    entries = entries.filter(c => c.category === filterCategory);
  }

  // Atualizar contador de descobertos no cabeçalho
  const discoveredCount = BESTIARY_ENTRIES.filter(c => isCreatureDiscovered(c.id)).length;
  const countEl = document.getElementById('bestiary-discovered-count');
  if (countEl) countEl.innerText = discoveredCount;
  const totalEl = document.getElementById('bestiary-total-count');
  if (totalEl) totalEl.innerText = BESTIARY_ENTRIES.length;

  entries.forEach(c => {
    const isDiscovered = isCreatureDiscovered(c.id);
    const kills = getCreatureKills(c.id);
    const isSelected = c.id === selectedCreatureId;
    const stars = '★'.repeat(c.threat);

    const card = document.createElement('div');
    card.className = `bestiary-card ${isSelected ? 'active' : ''} ${isDiscovered ? 'discovered' : 'undiscovered'}`;
    card.setAttribute('data-id', c.id);

    let catBadgeClass = 'badge-horde';
    let catLabel = 'HORDA';
    if (c.category === 'BOSS') { 
      catBadgeClass = 'badge-boss'; 
      catLabel = 'CHEFE'; 
    } else if (c.category === 'MINIBOSS') { 
      catBadgeClass = 'badge-miniboss'; 
      catLabel = 'MINIBOSS'; 
    }

    card.innerHTML = `
      <div class="bcard-avatar-wrap" style="border-color: ${isDiscovered ? (c.color + 'aa') : 'rgba(255,255,255,0.1)'};">
        <span class="bcard-avatar-icon">${isDiscovered ? (c.category === 'BOSS' ? '👑' : (c.category === 'MINIBOSS' ? '⚡' : '💀')) : '🔒'}</span>
      </div>
      <div class="bcard-info">
        <div class="bcard-top-row">
          <span class="bcard-name ${isDiscovered ? '' : 'undiscovered-name'}" style="color: ${isDiscovered ? (c.color || '#fff') : '#888'};">
            ${isDiscovered ? c.name : '???'}
          </span>
          <span class="bcard-cat-pill ${catBadgeClass}">${catLabel}</span>
        </div>
        <div class="bcard-sub-row">
          <span class="bcard-kills">${isDiscovered ? `${kills} abates` : 'Não catalogado'}</span>
          <span class="bcard-threat">${stars}</span>
        </div>
      </div>
    `;

    card.onclick = (e) => {
      e.stopPropagation();
      selectBestiaryCreature(c.id);
    };

    rosterGrid.appendChild(card);
  });
}

export function renderBestiaryDossier(creatureId) {
  const dossierPanel = document.getElementById('bestiary-dossier-panel');
  if (!dossierPanel) return;

  const c = BESTIARY_ENTRIES.find(x => x.id === creatureId) || BESTIARY_ENTRIES[0];
  const kills = getCreatureKills(c.id);
  const isDiscovered = isCreatureDiscovered(c.id);
  const isLore = isLoreUnlocked(c);
  const reqKills = c.category === 'HORDE' ? 10 : 1;
  const stars = '★'.repeat(c.threat) + '☆'.repeat(Math.max(0, 5 - c.threat));

  dossierPanel.innerHTML = `
    <div class="dossier-card-wrap">
      <!-- 1. Palco da Prévia em Alta Definição -->
      <div class="bestiary-preview-viewport">
        <canvas id="bestiary-preview-canvas" width="220" height="220"></canvas>
        <div class="bestiary-category-pill" style="border-color:${isDiscovered ? c.color : '#ff4757'}; color:${isDiscovered ? c.color : '#ff7675'};">
          ${c.category === 'BOSS' ? '👑 CHEFE SUPREMO' : (c.category === 'MINIBOSS' ? '⚡ MINI-CHEFE' : '💀 HORDA DE ENXAME')}
        </div>
        <div class="bestiary-kills-pill">
          ${isDiscovered ? `⚔️ ${kills} Abates` : '🔒 Não Catalogado'}
        </div>
      </div>

      <!-- 2. Cabeçalho de Identidade -->
      <div class="dossier-identity">
        <div class="dossier-name-row">
          <h2 class="dossier-name" style="color: ${isDiscovered ? (c.color || '#00f5d4') : '#ff7675'};">
            ${isDiscovered ? c.name : '???'}
          </h2>
          <span class="dossier-threat-badge" title="Nível de Ameaça: ${c.threat}/5">
            ${stars}
          </span>
        </div>
        <div class="dossier-title">
          ${isDiscovered ? c.title : 'Espécime Oculto nas Sombras do Abismo'}
        </div>
      </div>

      <!-- 3. Parâmetros de Biometria & Combate -->
      <div class="dossier-stats-grid">
        <div class="dossier-stat-box">
          <span class="dossier-stat-label">VIDA BASE</span>
          <span class="dossier-stat-value">${isDiscovered ? c.hp.toLocaleString('pt-BR') : '???'}</span>
        </div>
        <div class="dossier-stat-box">
          <span class="dossier-stat-label">DANO DE CONTATO</span>
          <span class="dossier-stat-value">${isDiscovered ? c.damage : '???'}</span>
        </div>
        <div class="dossier-stat-box">
          <span class="dossier-stat-label">VELOCIDADE</span>
          <span class="dossier-stat-value">${isDiscovered ? c.speed : '???'}</span>
        </div>
        <div class="dossier-stat-box">
          <span class="dossier-stat-label">FUNÇÃO TÁTICA</span>
          <span class="dossier-stat-value">${isDiscovered ? c.role : '???'}</span>
        </div>
      </div>

      <!-- 4. Crônica de Origem Profana (Micro-Lore) -->
      <div class="dossier-lore-box ${isLore ? '' : 'is-locked'}">
        <div class="dossier-box-header">
          <span class="dossier-box-icon">📜</span>
          <span class="dossier-box-title">CRÔNICA DE ORIGEM PROFANA</span>
          <span class="dossier-lock-status">${isLore ? 'DESCRIPTOGRAFADO' : `🔒 Requer ${reqKills} ${reqKills === 1 ? 'abate' : 'abates'}`}</span>
        </div>
        <div class="dossier-box-content">
          ${isLore ? c.microLore : (isDiscovered ? `O véu do mistério ainda oculta a origem desta abominação. Abata mais ${Math.max(1, reqKills - kills)} espécimes para decifrar sua história ancestral.` : 'Criatura desconhecida. Elimine-a na arena para iniciar a extração de dados.')}
        </div>
      </div>

      <!-- 5. Fraquezas Táticas & Diretrizes de Sobrevivência -->
      <div class="dossier-lore-box dossier-tactics-box ${isLore ? '' : 'is-locked'}">
        <div class="dossier-box-header">
          <span class="dossier-box-icon">⚔️</span>
          <span class="dossier-box-title">FRAQUEZA & CONDUTA TÁTICA</span>
          <span class="dossier-lock-status">${isLore ? 'REVELADO' : '🔒 BLOQUEADO'}</span>
        </div>
        <div class="dossier-box-content">
          ${isLore ? c.tactics : 'Fraquezas e pontos vulneráveis desconhecidos.'}
        </div>
      </div>

      <!-- 6. Citações e Ecos do Vazio (Quotes / Barks) -->
      ${c.quotes && c.quotes.length > 0 ? `
        <div class="dossier-quotes-box ${isLore ? '' : 'is-locked'}">
          <div class="dossier-box-header">
            <span class="dossier-box-icon">💬</span>
            <span class="dossier-box-title">ECOS & CITAÇÕES DA ARENA</span>
          </div>
          <div class="dossier-quotes-list">
            ${isLore ? c.quotes.map(q => `<div class="dossier-quote-item">${q}</div>`).join('') : '<div class="dossier-quote-item locked-quote">“...” (Ecos selados pelo Abismo)</div>'}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  const previewCanvasEl = document.getElementById('bestiary-preview-canvas');
  if (previewCanvasEl) {
    startBestiaryPreview(previewCanvasEl, c, isDiscovered);
  }
}

export function initUI() {
  const bindClick = (id, handler) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', e => {
        e.stopPropagation();
        handler(e);
      });
    }
  };

  window.addEventListener('player:levelup', levelUp);

  bindClick('pause-btn', togglePause);
  bindClick('resume-btn', togglePause);
  bindClick('abandon-btn', openCharacterSelect);
  bindClick('restart-death-btn', openCharacterSelect);
  bindClick('restart-victory-btn', openCharacterSelect);

  bindClick('open-achievements-btn', openAchievementsModal);
  bindClick('close-achievements-btn', closeAchievementsModal);
  const achievementsModalEl = document.getElementById('achievements-modal');
  if (achievementsModalEl) {
    achievementsModalEl.addEventListener('click', e => {
      if (e.target === achievementsModalEl) {
        closeAchievementsModal();
      }
    });
  }

  bindClick('open-bestiary-btn', openBestiaryModal);
  bindClick('close-bestiary-btn', closeBestiaryModal);
  const bestiaryModalEl = document.getElementById('bestiary-modal');
  if (bestiaryModalEl) {
    bestiaryModalEl.addEventListener('click', e => {
      if (e.target === bestiaryModalEl) {
        closeBestiaryModal();
      }
    });
  }

  // Abas de Categoria do Bestiário
  document.querySelectorAll('.bestiary-tab-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const cat = btn.getAttribute('data-cat') || 'ALL';
      document.querySelectorAll('.bestiary-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBestiaryCategory = cat;
      renderBestiaryRoster(currentBestiaryCategory);
      playSfx('click');
    });
  });

  bindClick('open-talents-btn', openTalentsModal);
  bindClick('close-talents-btn', () => {
    activeRenderAstrolabe = null;
    const talentsModal = document.getElementById('talents-modal');
    if (talentsModal) {
      talentsModal.classList.add('modal-hidden');
      talentsModal.style.setProperty('display', 'none', 'important');
      talentsModal.style.display = 'none';
    }
    const blessingsDrawer = document.getElementById('blessings-summary-drawer');
    if (blessingsDrawer) blessingsDrawer.style.display = 'none';
    openCharacterSelect();
  });
  bindClick('reset-talents-btn', () => {
    resetMetaTree();
    playSfx('chest');
    openTalentsModal();
  });

  bindClick('open-blessings-summary-btn', () => {
    const drawer = document.getElementById('blessings-summary-drawer');
    if (drawer) {
      const isHidden = drawer.style.display === 'none' || !drawer.style.display;
      if (isHidden) {
        renderBlessingsSummary();
        drawer.style.display = 'block';
        try { playSfx('card_hover'); } catch(e) {}
      } else {
        drawer.style.display = 'none';
      }
    }
  });
  bindClick('close-blessings-drawer-btn', () => {
    const drawer = document.getElementById('blessings-summary-drawer');
    if (drawer) drawer.style.display = 'none';
  });

  bindClick('close-boss-select-btn', closeBossSelectModal);
  renderBossSelectModal();

  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', e => setGameVolume(e.target.value));
  }

  // Marcadores de Fase no Boss HUD
  try {
    const bossHudEl = document.getElementById('boss-hud');
    const bossHpFillEl = document.getElementById('boss-hp-fill');

    if (bossHudEl && bossHpFillEl && bossHpFillEl.parentElement) {
      const barContainer = bossHpFillEl.parentElement;
      barContainer.style.position = 'relative';

      let marker70 = document.getElementById('boss-marker-70');
      if (!marker70) {
        marker70 = document.createElement('div');
        marker70.id = 'boss-marker-70';
        marker70.style.cssText = 'position:absolute; left:70%; top:0; bottom:0; width:2px; background:#e84393; box-shadow:0 0 6px #e84393; z-index:4; pointer-events:none; display:none;';
        barContainer.appendChild(marker70);
      }

      let marker30 = document.getElementById('boss-marker-30');
      if (!marker30) {
        marker30 = document.createElement('div');
        marker30.id = 'boss-marker-30';
        marker30.style.cssText = 'position:absolute; left:30%; top:0; bottom:0; width:2px; background:#00cec9; box-shadow:0 0 6px #00cec9; z-index:4; pointer-events:none; display:none;';
        barContainer.appendChild(marker30);
      }

      let phaseBadge = document.getElementById('boss-phase-badge');
      if (!phaseBadge) {
        phaseBadge = document.createElement('div');
        phaseBadge.id = 'boss-phase-badge';
        phaseBadge.style.cssText = 'font-size:10px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; text-align:center; margin-top:3px; display:none;';
        bossHudEl.appendChild(phaseBadge);
      }

      const hudObserver = new MutationObserver(() => {
        if (!marker70 || !marker30 || !phaseBadge) return;
        if (activeBoss && activeBoss.bossId === 4) {
          marker70.style.display = 'block';
          marker30.style.display = 'block';
          phaseBadge.style.display = 'block';

          if (activeBoss.isStaggered) {
            phaseBadge.innerText = 'COLAPSO DE ESTABILIDADE (VULNERÁVEL)';
            phaseBadge.style.color = '#f1c40f';
            bossHpFillEl.style.background = 'linear-gradient(90deg, #f39c12, #f1c40f)';
            bossHpFillEl.style.boxShadow = '0 0 14px rgba(241, 196, 15, 0.85)';
          } else if (activeBoss.phase === 3) {
            phaseBadge.innerText = 'FASE 3: SINGULARIDADE PRIMORDIAL';
            phaseBadge.style.color = '#00cec9';
            bossHpFillEl.style.background = 'linear-gradient(90deg, #0984e3, #00cec9)';
            bossHpFillEl.style.boxShadow = '0 0 14px rgba(0, 206, 201, 0.85)';
          } else if (activeBoss.phase === 2) {
            phaseBadge.innerText = 'FASE 2: FRATURA DO HORIZONTE';
            phaseBadge.style.color = '#e84393';
            bossHpFillEl.style.background = 'linear-gradient(90deg, #c0392b, #e84393)';
            bossHpFillEl.style.boxShadow = '0 0 14px rgba(232, 67, 147, 0.85)';
          } else {
            phaseBadge.innerText = 'FASE 1: TRONO DO VÁZIO';
            phaseBadge.style.color = '#a29bfe';
            bossHpFillEl.style.background = 'linear-gradient(90deg, #341f97, #8e44ad)';
            bossHpFillEl.style.boxShadow = '0 0 14px rgba(142, 68, 173, 0.85)';
          }
        } else {
          marker70.style.display = 'none';
          marker30.style.display = 'none';
          phaseBadge.style.display = 'none';
        }
      });

      hudObserver.observe(bossHpFillEl, { attributes: true, attributeFilter: ['style'] });
    }
  } catch (err) {
    console.warn('Aviso: Falha ao inicializar marcadores do Boss HUD:', err);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!gameState.isPaused && !gameState.isDead && !gameState.isWon) {
        gameState.isPaused = true;
        const pauseModal = document.getElementById('pause-modal');
        if (pauseModal) {
          pauseModal.style.display = 'flex';
          renderPauseInventory();
        }
        if (audioCtx && audioCtx.state === 'running') {
          audioCtx.suspend();
        }
      }
    }
  });

  // Reorganização dinâmica e automática de modais e elementos visuais ao girar a tela ou redimensionar
  onLayoutChange((metrics) => {
    updateHudBottomMetric();

    const charModal = document.getElementById('char-modal');
    if (charModal && charModal.style.display === 'flex') {
      charModal.classList.toggle('is-mobile-device', isMobileScreen());
      resizePreviewCanvas();
    }

    const talentsModal = document.getElementById('talents-modal');
    if (talentsModal && talentsModal.style.display === 'flex') {
      talentsModal.classList.toggle('is-mobile-device', isMobileScreen());
      if (typeof activeRenderAstrolabe === 'function') {
        activeRenderAstrolabe();
      }
    }

    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal && pauseModal.style.display === 'flex') {
      pauseModal.classList.toggle('is-mobile-device', isMobileScreen());
      renderPauseInventory();
    }

    const achievementsModal = document.getElementById('achievements-modal');
    if (achievementsModal && achievementsModal.style.display === 'flex') {
      achievementsModal.classList.toggle('is-mobile-device', isMobileScreen());
    }

    const bestiaryModal = document.getElementById('bestiary-modal');
    if (bestiaryModal && bestiaryModal.style.display === 'flex') {
      bestiaryModal.classList.toggle('is-mobile-device', isMobileScreen());
      renderBestiaryDossier(selectedCreatureId);
    }
  });
}