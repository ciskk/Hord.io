/**
 * src/systems/ui.js
 * Sistema de Interface de Usuário Grim Cyber-Gothic
 * Gerenciador de Modais, Grimório de Batalha, Cartas de Tarô e Efeitos Diegéticos
 */

import { CHARACTERS } from '../config/characters.js';
import { 
  startPreview, 
  stopPreview, 
  resizePreviewCanvas,
  setPreviewHero, 
  togglePreviewFacing, 
  setPreviewPose, 
  triggerHeroSurge 
} from '../render/characterPreview.js';
import { BOSS_TYPES } from '../config/enemies.js';
import { getRandomUpgrades, checkSynergies } from '../config/upgrades.js';
import { checkIsSynergyIngredient, getSynergyTrackerList } from '../config/items.js';
import { triggerBossEncounter } from '../entities/enemies.js';
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
import { getCurrentWave } from '../systems/waves.js';

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

  const charModal = document.getElementById('char-modal');
  const pauseModal = document.getElementById('pause-modal');

  const isCharOpen = charModal && charModal.style.display === 'flex';
  const isPauseOpen = pauseModal && pauseModal.style.display === 'flex';

  return !!(isCharOpen || isPauseOpen);
}

export function openBossSelectModal() {
  const modal = document.getElementById('boss-select-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  playSfx('level');
}

export function closeBossSelectModal() {
  const modal = document.getElementById('boss-select-modal');
  if (modal) modal.style.display = 'none';
}

export function launchBossTest(bossId) {
  closeBossSelectModal();

  const charModal = document.getElementById('char-modal');
  const isCharOpen = charModal && charModal.style.display === 'flex';

  if (isCharOpen) {
    if (charModal) charModal.style.display = 'none';
    resetGame();
  } else {
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.style.display = 'none';
    gameState.isPaused = false;
    setLastTime(performance.now());
  }

  setActiveBoss(null);
  bossShockwaves.length = 0;
  voidVortices.length = 0;

  triggerBossEncounter(bossId);
}

export function renderBossSelectModal() {
  const container = document.getElementById('boss-select-list');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(BOSS_TYPES).forEach(id => {
    const boss = BOSS_TYPES[id];
    const btn = document.createElement('button');
    btn.className = 'card-btn';
    btn.style.margin = '3px 0';
    btn.style.padding = '8px 12px';
    btn.style.display = 'flex';
    btn.style.justifyContent = 'space-between';
    btn.style.alignItems = 'center';
    btn.style.borderLeft = `4px solid ${boss.color || '#e056fd'}`;
    btn.style.background = '#1a1e2d';
    btn.style.textAlign = 'left';

    btn.innerHTML = `
      <div>
        <div style="font-weight: bold; color: #fff; font-size: 12px;">${boss.name}</div>
        <div style="font-size: 10px; color: #8890a6;">
          Boss #${id} • HP: ${boss.hp.toLocaleString('pt-BR')} • Dano: ${boss.damage}${boss.isFinalBoss ? ' • <b style="color:#e74c3c">FINAL</b>' : ''}
        </div>
      </div>
      <span style="color: #e056fd; font-size: 11px; font-weight: bold;">TESTAR ➔</span>
    `;

    btn.onclick = (e) => {
      e.stopPropagation();
      launchBossTest(Number(id));
    };

    container.appendChild(btn);
  });
}

/**
 * Renderizador de Cartas de Tarô Arcano (Level-up)
 */
function isSynergyIngredient(optId) {
  return checkIsSynergyIngredient(optId, player);
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
      ${isSynergy ? '<span class="synergy-indicator-tag">✦ PEÇA DE FUSÃO</span>' : ''}
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
      modal.style.display = 'none';
      gameState.isPaused = false;
      setLastTime(performance.now());
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
  playSfx('level');
  gameState.isPaused = true;
  resetInput();
  renderUpgradeCards();
  const upgradeModal = document.getElementById('upgrade-modal');
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
      const wIcon = UPGRADE_ICONS[`${w.type.toLowerCase()}_extra`] || UPGRADE_ICONS[`${w.type.toLowerCase()}_speed`] || '⚔️';
      row.innerHTML = `
        <span class="name">⚔️ ${w.type}</span>
        <span class="counter">Nv ${w.count || 1}</span>
      `;
      buildList.appendChild(row);
    });

    // Passivas acumuladas
    if (player.damageCardCount) {
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">⚡ Poder Bruto</span><span class="counter">+${Math.round((player.damagePercentBonus || 0) * 100)}% (${player.damageCardCount}/4)</span></div>`;
    }
    if (player.armorCardCount || player.hasArmorPassive) {
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">🛡️ Armadura Rúnica</span><span class="counter">+${(player.armorCardCount || 1) * 45} HP (${player.armorCardCount || 1}/5)</span></div>`;
    }
    if (player.wingsCardCount || player.hasWingsPassive) {
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">🪽 Asas do Vento</span><span class="counter">+${player.speed.toFixed(1)} Vel (${player.wingsCardCount || 1}/4)</span></div>`;
    }
    if (player.frostCardCount || (player.slowChance || 0) > 0) {
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">❄️ Golpe Criogênico</span><span class="counter">${Math.round(player.slowChance * 100)}% Lentidão (${player.frostCardCount || 1}/4)</span></div>`;
    }
    if (player.orbitals > 0) {
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">📖 Bíblias Protetoras</span><span class="counter">${player.orbitals} Tomos ${player.evolvedOrbitals ? '(★ Vórtice)' : '(Máx: 6)'}</span></div>`;
    }
    if (player.auraLvl > 0) {
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">✨ Aura Sagrada</span><span class="counter">Nv ${player.auraLvl}/5 ${player.evolvedAura ? '(★ Santuário)' : ''}</span></div>`;
    }
    if (player.critCardCount || player.critChance > 0.05) {
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">🎯 Foco Letal</span><span class="counter">${Math.round(player.critChance * 100)}% Crítico (${player.critCardCount || 1}/4)</span></div>`;
    }
    if (player.hasteCardCount || (player.cooldownReduction || 0) > 0) {
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">⚡ Fúria Rápida</span><span class="counter">${selectedHeroKey === 'BARBARIAN' ? `+${(player.hasteCardCount || 1) * 12}% Velocidade` : `-${Math.round((player.cooldownReduction || 0) * 100)}% CDR`} (${player.hasteCardCount || 1}/3)</span></div>`;
    }
    if (player.magnetCardCount) {
      buildList.innerHTML += `<div class="build-item-badge"><span class="name">🧲 Ímã Titânico</span><span class="counter">+${player.magnetCardCount * 50}px (${player.magnetCardCount}/4)</span></div>`;
    }
  }

  // 2. Biometria do Sobrevivente em Tempo Real
  const statsGrid = document.getElementById('pause-stats-grid');
  if (statsGrid) {
    const totalDmg = Math.round(player.damage * (1 + (player.damagePercentBonus || 0)));
    statsGrid.innerHTML = `
      <div class="stat-box"><div class="stat-box-label">HP Total</div><div class="stat-box-value">${Math.ceil(player.hp)} / ${player.maxHp}</div></div>
      <div class="stat-box"><div class="stat-box-label">Dano Base</div><div class="stat-box-value">${totalDmg}</div></div>
      <div class="stat-box"><div class="stat-box-label">Chance Crítica</div><div class="stat-box-value">${Math.round(player.critChance * 100)}%</div></div>
      <div class="stat-box"><div class="stat-box-label">Velocidade</div><div class="stat-box-value">${player.speed.toFixed(1)}</div></div>
      <div class="stat-box"><div class="stat-box-label">Redução Recarga</div><div class="stat-box-value">-${Math.round((player.cooldownReduction || 0) * 100)}%</div></div>
      <div class="stat-box"><div class="stat-box-label">Raio de Ímã</div><div class="stat-box-value">${player.magnet}px</div></div>
    `;
  }

  // 3. Rastreador de Fusões e Sinergias (Evolution Tracker)
  const synTracker = document.getElementById('pause-synergies-tracker');
  if (synTracker) {
    const synList = getSynergyTrackerList(player);

    synTracker.innerHTML = synList.map(s => {
      let statusColor = '#e74c3c';
      let statusText = s.req;
      if (s.isEvolved) {
        statusColor = '#f1c40f';
        statusText = '★ EVOLUÍDO';
      } else if (s.isReady) {
        statusColor = '#2ecc71';
        statusText = '✓ PRONTO (ABRA BAÚ)';
      }

      return `
        <div class="synergy-row">
          <span style="font-weight: 600; color: #fff;">${s.name}</span>
          <span style="font-weight: bold; color: ${statusColor};">${statusText}</span>
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
        stat: "★ PODER MÁXIMO ★",
        badge: "Evolução",
        iconSvg: `<svg viewBox="0 0 24 24"><path fill="#f1c40f" d="M12 2l3 7h7l-5.5 4.5 2 7-6.5-4.5-6.5 4.5 2-7L2 9h7z"/></svg>`,
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
      subElem.innerHTML += ' <span style="color:#f39c12; font-weight:bold;">✨ TRANSMUTAÇÃO CÓSMICA ATIVADA! (+Dádiva Astral)</span>';
    }
    const extraUpgrades = getRandomUpgrades(1);
    if (extraUpgrades.length > 0) {
      const u = extraUpgrades[0];
      pendingRewards.push({
        isLegendary: false,
        title: `✨ ${u.title}`,
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
        title: "✨ Transmutação de Almas",
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
        ${r.isLegendary ? '<span class="legendary-pill">★ EVOLUÇÃO LENDÁRIA ★</span>' : ''}
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
            const currentWave = getCurrentWave(waveSeconds);
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

  const killerName = lastAttackerName || 'A Horda do Abismo';

  if (summary) {
    summary.innerHTML = `
      <div style="margin-bottom: 6px; border-bottom: 1px solid #3d070b; padding-bottom: 6px;">
        <span style="color: #8c94a8; font-size: 10px; text-transform: uppercase;">Sentença Final:</span><br>
        <b style="color: #e74c3c; font-size: 13px;">Executado por ${killerName}</b>
      </div>
      Tempo de Sobrevivência: <b style="color:#fff;">${time}</b><br>
      Abominações Abatidas: <b style="color:#e74c3c;">${gameState.kills}</b><br>
      Nível de Poder Atingido: <b style="color:#f1c40f;">Nível ${player.level}</b><br>
      Ouro Resgatado para a Alma: <b style="color:#f39c12;">🪙 ${getPersistentGold()}</b>
    `;
  }

  const modal = document.getElementById('death-modal');
  if (modal) modal.style.display = 'flex';
}

export function triggerVictory() {
  gameState.isWon = true;
  gameState.isPaused = true;
  resetInput();
  playSfx('victory');
  triggerShake(20);
  triggerHaptic('heavy');

  bullets.length = 0;
  enemyBullets.length = 0;
  bossTelegraphs.length = 0;
  bossProjectiles.length = 0;
  bossShockwaves.length = 0;
  voidVortices.length = 0;

  const bossHud = document.getElementById('boss-hud');
  if (bossHud) bossHud.style.display = 'none';

  const timerElem = document.getElementById('timer-val');
  const time = timerElem ? timerElem.innerText : '00:00';
  const summary = document.getElementById('victory-summary');
  if (summary) {
    summary.innerHTML = 
      `Tempo de Combate: <b>${time}</b><br>Monstros Expurgados: <b>${gameState.kills}</b><br>Nível Alcançado: <b>${player.level}</b><br>Status: <b>Soberano do Abismo Exterminado!</b><br>Ouro Total: <b>${getPersistentGold()}</b>`;
  }
  const modal = document.getElementById('victory-modal');
  if (modal) modal.style.display = 'flex';
}

// Brasões Heráldicos Vetoriais dos Campeões (Geometria 24x24)
const HERO_EMBLEMS_SVG = {
  KNIGHT: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="4" width="14" height="7" rx="1.5"/>
      <line x1="12" y1="11" x2="12" y2="22"/>
      <line x1="9" y1="22" x2="15" y2="22"/>
      <polygon points="12,1 14,4 10,4" fill="currentColor"/>
      <line x1="12" y1="6" x2="12" y2="9" stroke="#fff"/>
      <line x1="9" y1="7.5" x2="15" y2="7.5" stroke="#fff"/>
    </svg>
  `,
  PALADIN: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="4" width="14" height="7" rx="1.5"/>
      <line x1="12" y1="11" x2="12" y2="22"/>
      <line x1="9" y1="22" x2="15" y2="22"/>
      <polygon points="12,1 14,4 10,4" fill="currentColor"/>
      <line x1="12" y1="6" x2="12" y2="9" stroke="#fff"/>
      <line x1="9" y1="7.5" x2="15" y2="7.5" stroke="#fff"/>
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
      <path d="M14.5 2.5l7 7-12 12-7-7z"/>
      <line x1="2.5" y1="21.5" x2="6.5" y2="17.5"/>
      <line x1="17" y1="5" x2="19" y2="7"/>
      <path d="M5 19l14-14"/>
    </svg>
  `,
  WARRIOR: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.5 2.5l7 7-12 12-7-7z"/>
      <line x1="2.5" y1="21.5" x2="6.5" y2="17.5"/>
      <line x1="17" y1="5" x2="19" y2="7"/>
      <path d="M8 8l8 8" stroke-opacity="0.5"/>
    </svg>
  `,
  BARBARIAN: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="2" x2="12" y2="22"/>
      <path d="M12 4c3.5 0 7-1.5 8 1.5-1 3.5-3.5 4.5-8 4.5"/>
      <path d="M12 4c-3.5 0-7-1.5-8 1.5 1 3.5 3.5 4.5 8 4.5"/>
      <polygon points="12,1 14,4 10,4" fill="currentColor"/>
    </svg>
  `,
  ALCHEMIST: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 2h4"/>
      <path d="M12 2v6l-6.5 11.5A2 2 0 0 0 7.2 22h9.6a2 2 0 0 0 1.7-2.5L12 8"/>
      <path d="M8 15c2-1 6-1 8 0" stroke-opacity="0.6"/>
      <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
    </svg>
  `
};

// Configuração Cromática e Valores Numéricos de Medidores (0 a 5)
const CHARACTER_PROFILES = {
  KNIGHT: {
    themeColor: '#f1c40f',
    emblemSvg: HERO_EMBLEMS_SVG.PALADIN,
    weaponName: 'Martelo Sagrado',
    levels: { dano: 4, area: 4, vel: 1, res: 5 }
  },
  PALADIN: {
    themeColor: '#f1c40f',
    emblemSvg: HERO_EMBLEMS_SVG.PALADIN,
    weaponName: 'Martelo dos Titãs',
    levels: { dano: 4, area: 4, vel: 1, res: 5 }
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

export function isMobileScreen() {
  return window.innerWidth <= 768 || 
         ('ontouchstart' in window && window.innerWidth <= 900) || 
         /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}

export function openCharacterSelect() {
  resetDeathAudioFilter();
  const bloodFilter = document.getElementById('blood-screen-filter');
  if (bloodFilter) bloodFilter.classList.remove('active');

  const talentsModal = document.getElementById('talents-modal');
  if (talentsModal) talentsModal.style.display = 'none';

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

    setPreviewHero(heroKey);

    const badge = document.getElementById('stage-archetype-badge');
    if (badge) {
      badge.innerText = char.title.toUpperCase();
      badge.style.color = profile.themeColor;
      badge.style.borderColor = `${profile.themeColor}88`;
      badge.style.boxShadow = `0 0 14px ${profile.themeColor}33`;
    }

    showcaseContainer.style.setProperty('--showcase-color', profile.themeColor);
    charModal.style.setProperty('--showcase-color', profile.themeColor);

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

      <!-- Abas Rápidas de Alternância no Mobile (Ocultas no Desktop via CSS) -->
      <div class="mobile-tab-nav" id="mobile-char-tabs">
        <button class="mobile-tab-btn ${activeMobileTab === 'skills' ? 'active' : ''}" data-tab="skills">
          ⚔ Habilidades
        </button>
        <button class="mobile-tab-btn ${activeMobileTab === 'stats' ? 'active' : ''}" data-tab="stats">
          📊 Atributos & Lore
        </button>
      </div>

      <div class="showcase-tab-content-wrapper">
        <!-- Conteúdo 1: Cards Táticos (Habilidades & Armas) -->
        <div class="showcase-cards-container ${activeMobileTab === 'skills' ? 'mobile-active' : ''}">
          <!-- Card: Bênção Passiva -->
          <div class="tactical-card passive-card">
            <div class="card-top-tag">
              <span class="card-type-icon">🛡</span>
              <span>BÊNÇÃO PASSIVA</span>
            </div>
            <div class="card-title-text" style="color: ${profile.themeColor};">${char.passive?.name || 'Aura Sagrada'}</div>
            <div class="card-desc-text">${char.passive?.desc || ''}</div>
          </div>

          <!-- Card: Arma Inicial -->
          <div class="tactical-card weapon-card">
            <div class="card-top-tag">
              <span class="card-type-icon">⚔</span>
              <span>ARMA INICIAL · ${char.weapon?.type || profile.weaponName}</span>
            </div>
            <div class="card-title-text" style="color: ${profile.themeColor};">${char.weapon?.name || profile.weaponName}</div>
            <div class="card-desc-text">${char.weapon?.desc || ''}</div>
          </div>

          <!-- Card: Poder Ancestral -->
          <div class="tactical-card skill-card">
            <div class="card-top-tag">
              <span class="card-type-icon">⚡</span>
              <span>PODER ANCESTRAL · Recarga: ${char.skill?.cooldown || '7s'}</span>
            </div>
            <div class="card-title-text" style="color: ${profile.themeColor};">${char.skill?.name || 'Habilidade'}</div>
            <div class="card-desc-text">${char.skill?.desc || ''}</div>
          </div>
        </div>

        <!-- Conteúdo 2: Biometria & Citação de Lore -->
        <div class="showcase-radar-container ${activeMobileTab === 'stats' ? 'mobile-active' : ''}">
          <div class="showcase-lore-quote">
            “${char.lore || ''}”
          </div>

          <div class="showcase-radar-bars">
            <div class="attr-row"><span>PODER DE IMPACTO</span>${renderSegments(profile.levels.dano)}</div>
            <div class="attr-row"><span>CONTROLE DE ÁREA</span>${renderSegments(profile.levels.area)}</div>
            <div class="attr-row"><span>AGILIDADE & ESQUIVA</span>${renderSegments(profile.levels.vel)}</div>
            <div class="attr-row"><span>RESISTÊNCIA</span>${renderSegments(profile.levels.res)}</div>
          </div>
        </div>
      </div>

      <button class="card-btn btn-summon-hero" id="confirm-hero-btn">
        ⚡ DESPERTAR NA ARENA ⚡
      </button>
    `;

    // Alternância de Abas Mobile
    const tabBtns = showcaseContainer.querySelectorAll('.mobile-tab-btn');
    tabBtns.forEach(tBtn => {
      tBtn.onclick = () => {
        activeMobileTab = tBtn.getAttribute('data-tab');
        try { playSfx('card_hover'); } catch(e) {}
        renderShowcase(heroKey);
      };
    });

    const confirmBtn = document.getElementById('confirm-hero-btn');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        stopPreview();
        setSelectedHeroKey(heroKey);
        charModal.style.display = 'none';
        resetGame();
        try { playSfx('warp'); } catch(e) {}
      };
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

    const btn = document.createElement('div');
    btn.className = `char-pedestal-btn ${key === activeShowcaseHeroKey ? 'active' : ''}`;
    btn.setAttribute('data-hero', key);
    btn.style.setProperty('--btn-theme-color', profile.themeColor);
    btn.innerHTML = `
      <div class="char-pedestal-emblem" style="border-color: ${profile.themeColor}; color: ${profile.themeColor};">
        ${profile.emblemSvg}
      </div>
      <div class="char-pedestal-info">
        <div class="char-pedestal-title" style="color: ${profile.themeColor};">${c.title}</div>
        <div class="char-pedestal-name">${c.name}</div>
        <div class="char-pedestal-role-mini">${c.role || ''} · <span class="mini-diff" style="color: ${profile.themeColor};">${miniDots}</span></div>
      </div>
      <div class="pedestal-active-glow" style="background: ${profile.themeColor};"></div>
    `;

    btn.onclick = () => {
      try { playSfx('card_hover'); } catch(e) {}
      renderShowcase(key);
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

let selectedAstrolabeNodeId = 'damage';
let activeConstellationFilter = 'all'; // 'all' | 'guerra' | 'egide' | 'destino'

export function openTalentsModal() {
  stopPreview();
  const charModal = document.getElementById('char-modal');
  if (charModal) charModal.style.display = 'none';

  const modal = document.getElementById('talents-modal');
  const nodesContainer = document.getElementById('astrolabe-nodes-container');
  const filamentsSvg = document.getElementById('astrolabe-filaments-svg');
  const goldVal = document.getElementById('talents-gold-val');
  const blessingsDrawer = document.getElementById('blessings-summary-drawer');
  if (blessingsDrawer) blessingsDrawer.style.display = 'none';
  if (!modal || !nodesContainer) return;

  // Configuração das Abas de Constelação
  const tabBtns = modal.querySelectorAll('.constellation-tab');
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      const cTarget = btn.getAttribute('data-constellation');
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
    if (goldVal) goldVal.innerText = getPersistentGold();
    nodesContainer.innerHTML = '';

    const levels = getMetaLevels();
    const centerX = 50;
    const centerY = 50;

    // 1. Renderização das linhas de filamento SVG interconectadas
    if (filamentsSvg) {
      filamentsSvg.innerHTML = '';
      META_TALENTS.forEach(t => {
        const coords = ASTROLABE_NODE_COORDS[t.id];
        if (!coords) return;

        let startX = centerX;
        let startY = centerY;
        if (coords.parentId && ASTROLABE_NODE_COORDS[coords.parentId]) {
          startX = ASTROLABE_NODE_COORDS[coords.parentId].x;
          startY = ASTROLABE_NODE_COORDS[coords.parentId].y;
        }

        const targetLvl = levels[t.id] || 0;
        const parentLvl = coords.parentId ? (levels[coords.parentId] || 0) : 1;
        const isDimmed = activeConstellationFilter !== 'all' && t.constellation !== activeConstellationFilter;

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
    META_TALENTS.forEach(t => {
      const coords = ASTROLABE_NODE_COORDS[t.id] || { x: 50, y: 50 };
      const curLvl = levels[t.id] || 0;
      const isMax = curLvl >= t.maxLvl;
      const parentLvl = coords.parentId ? (levels[coords.parentId] || 0) : 1;
      const isLocked = parentLvl < 1;
      const isDimmed = activeConstellationFilter !== 'all' && t.constellation !== activeConstellationFilter;
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
        <div class="node-lvl-pip">${isLocked ? '🔒' : `${curLvl}/${t.maxLvl}`}</div>
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

    const constBadge = document.getElementById('forge-constellation-badge');
    const tierBadge = document.getElementById('forge-tier-badge');
    const nameElem = document.getElementById('forge-node-name');
    const descElem = document.getElementById('forge-node-desc');
    const loreElem = document.getElementById('forge-node-lore');
    const compCur = document.getElementById('forge-comp-current');
    const compNext = document.getElementById('forge-comp-next');
    const meterElem = document.getElementById('forge-level-meter');
    const buyBtn = document.getElementById('forge-buy-btn');

    if (constBadge) {
      const names = { guerra: '⚔️ CONSTELAÇÃO DA GUERRA', egide: '🛡️ CONSTELAÇÃO DA ÉGIDE', destino: '🔮 CONSTELAÇÃO DO DESTINO' };
      constBadge.innerText = names[activeTalent.constellation] || 'CONSTELAÇÃO ASTRAL';
      constBadge.className = `forge-constellation-badge badge-${activeTalent.constellation}`;
    }

    if (tierBadge) {
      tierBadge.innerText = activeTalent.isKeystone 
        ? '⭐ TALENTO MESTRE (KEYSTONE)' 
        : `TIER ${activeTalent.tier} · NÍVEL ${curLvl}/${activeTalent.maxLvl}`;
    }

    if (nameElem) nameElem.innerText = activeTalent.name;
    if (descElem) descElem.innerText = activeTalent.desc;
    if (loreElem) loreElem.innerText = activeTalent.lore ? `“${activeTalent.lore}”` : '';

    if (compCur) compCur.innerText = activeTalent.formatVal(curLvl);
    if (compNext) compNext.innerText = isMax ? 'APOGEU (MÁX)' : activeTalent.formatVal(curLvl + 1);

    if (meterElem) {
      let meterHtml = '<div class="forge-diamonds-bar">';
      for (let i = 1; i <= activeTalent.maxLvl; i++) {
        meterHtml += `<div class="forge-diamond-pip ${i <= curLvl ? 'filled' : ''}"></div>`;
      }
      meterHtml += '</div>';
      meterElem.innerHTML = meterHtml;
    }

    if (buyBtn) {
      if (isLocked) {
        buyBtn.disabled = true;
        const parentT = META_TALENTS.find(p => p.id === activeTalent.parent);
        buyBtn.innerHTML = `🔒 REQUER ${parentT ? parentT.name.toUpperCase() : 'NÓ ANTECESSOR'}`;
      } else if (isMax) {
        buyBtn.disabled = true;
        buyBtn.innerHTML = '✨ FORJA MAGISTRAL CONCLUÍDA ✨';
      } else {
        buyBtn.disabled = !canAfford;
        buyBtn.innerHTML = canAfford
          ? `⚡ FUNDIR ALMAS • 🪙 ${cost}`
          : `🪙 ${cost} (FALTAM ${cost - getPersistentGold()} ALMAS)`;
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

  renderAstrolabe();
  modal.style.display = 'flex';
}

function renderBlessingsSummary() {
  const grid = document.getElementById('blessings-summary-grid');
  if (!grid) return;
  const meta = getMetaBonuses();

  const cards = [
    { label: "Dano Global", val: `+${Math.round((meta.damageMult - 1) * 100)}%`, icon: "⚔️", col: "#e74c3c" },
    { label: "Chance Crítica", val: `+${Math.round(meta.critBonus * 100)}%`, icon: "🎯", col: "#f39c12" },
    { label: "Redução Recarga", val: `-${Math.round(meta.cooldownReduction * 100)}%`, icon: "⌛", col: "#e67e22" },
    { label: "Fúria Executora", val: `+${Math.round(meta.executeBonus * 100)}%`, icon: "💀", col: "#c0392b" },

    { label: "Vida Máxima", val: `+${Math.round((meta.hpMult - 1) * 100)}%`, icon: "❤️", col: "#2ecc71" },
    { label: "Armadura Direta", val: `-${meta.armorBonus} Dano`, icon: "🛡️", col: "#3498db" },
    { label: "Velocidade", val: `+${((meta.speedMult - 1) * 100).toFixed(1)}%`, icon: "👟", col: "#1abc9c" },
    { label: "Regeneração", val: `+${meta.regenBonus.toFixed(1)} HP/s`, icon: "🌿", col: "#27ae60" },
    { label: "Segunda Chance", val: meta.phoenixRevives > 0 ? "1 Reviver" : "Inativo", icon: "🔥", col: "#f1c40f" },

    { label: "Raio de Atração", val: `+${meta.magnetBonus} px`, icon: "🧲", col: "#9b59b6" },
    { label: "Bônus de Almas", val: `+${Math.round((meta.goldMult - 1) * 100)}%`, icon: "🪙", col: "#f1c40f" },
    { label: "Bônus de XP", val: `+${Math.round((meta.xpMult - 1) * 100)}%`, icon: "📖", col: "#8e44ad" },
    { label: "Rerolls de Tarô", val: `+${meta.rerolls}`, icon: "🎲", col: "#e056fd" },
    { label: "Transmutação Cósmica", val: meta.doubleChestChance > 0 ? "25% Chance" : "Inativo", icon: "✨", col: "#f39c12" }
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

  bindClick('open-talents-btn', openTalentsModal);
  bindClick('close-talents-btn', () => {
    const talentsModal = document.getElementById('talents-modal');
    if (talentsModal) talentsModal.style.display = 'none';
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
}