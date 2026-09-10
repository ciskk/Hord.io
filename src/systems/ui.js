import { CHARACTERS } from '../config/characters.js';
import { getRandomUpgrades, checkSynergies } from '../config/upgrades.js';
import { playSfx, triggerHaptic, setGameVolume, initAudio, audioCtx } from '../core/audio.js';
import { resetInput } from '../core/input.js';
import { 
  player, 
  setSelectedHeroKey, 
  getPersistentGold, 
  getMetaLevels, 
  META_TALENTS, 
  getMetaUpgradeCost, 
  buyMetaUpgrade, 
  resetMetaTree 
} from '../entities/player.js';
import { 
  gameState, 
  triggerShake, 
  setCurrentArenaTheme, 
  setIsWavePaused, 
  resetSpawnTimer, 
  setLastTime, 
  resetGame,
  activeBoss 
} from '../main.js';

export function togglePause() {
  if (gameState.isDead || gameState.isWon) return;
  initAudio();
  gameState.isPaused = !gameState.isPaused;
  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) {
    pauseModal.style.display = gameState.isPaused ? 'flex' : 'none';
  }
  if (!gameState.isPaused) {
    setLastTime(performance.now());
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
    card.className = `upgrade-card ${opt.rarity}`;
    card.innerHTML = `
      <span class="rarity-badge">${opt.badge}</span>
      <div class="card-title">${opt.title}</div>
      <div class="card-stat">${opt.desc} • <b>${opt.stat}</b></div>
    `;
    card.onclick = () => {
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

export function openChestModal(tier = 'BOSS') {
  playSfx('chest');
  gameState.isPaused = true;
  resetInput();

  const modal = document.getElementById('chest-modal');
  const list = document.getElementById('chest-rewards-list');
  if (!modal || !list) return;
  list.innerHTML = '';

  const isMini = tier === 'MINI_BOSS';

  const titleElem = modal.querySelector('h3');
  if (titleElem) {
    titleElem.innerText = isMini ? "TESOURO DE ELITE!" : "TESOURO DO CHEFE!";
    titleElem.style.color = isMini ? "#3498db" : "#f1c40f";
  }

  if (isMini) {
    // Miniboss concede apenas 1 aprimoramento padrão (sem fusões lendárias)
    const rewards = getRandomUpgrades(1);
    rewards.forEach(r => {
      r.apply();
      const item = document.createElement('div');
      item.className = 'chest-reward-item';
      item.style.borderColor = '#3498db';
      item.style.background = 'rgba(52, 152, 219, 0.15)';
      item.innerHTML = `<b style="color:#3498db;">${r.title}</b> • <span style="font-size:10px; color:#ddd;">${r.stat}</span>`;
      list.appendChild(item);
    });
  } else {
    // Boss concede Fusão Lendária (se os pré-requisitos existirem) + 2 aprimoramentos
    const syns = checkSynergies();
    if (syns.length > 0) {
      playSfx('evolution');
      triggerShake(14);
      const evo = syns[0];
      evo.apply();
      const evoItem = document.createElement('div');
      evoItem.className = 'chest-reward-item';
      evoItem.style.borderColor = '#f1c40f';
      evoItem.style.background = 'rgba(241, 196, 15, 0.25)';
      evoItem.innerHTML = `<span style="color:#f1c40f; font-size:13px;">EVOLUÇÃO LENDÁRIA!</span><br><b>${evo.name}</b><br><span style="font-size:10px; color:#ddd;">${evo.desc}</span>`;
      list.appendChild(evoItem);
    }

    const rewards = getRandomUpgrades(2);
    rewards.forEach(r => {
      r.apply();
      const item = document.createElement('div');
      item.className = 'chest-reward-item';
      item.innerHTML = `<b>${r.title}</b> • <span style="font-size:10px; color:#ddd;">${r.stat}</span>`;
      list.appendChild(item);
    });
  }

  const claimBtn = document.getElementById('chest-claim-btn');
  if (claimBtn) {
    claimBtn.onclick = () => {
      modal.style.display = 'none';
      gameState.isPaused = false;
      setLastTime(performance.now());

      // Só reabre o spawn das hordas se o chefe principal NÃO estiver na arena
      if (!activeBoss) {
        setCurrentArenaTheme('INDUSTRIAL');
        setIsWavePaused(false);
        resetSpawnTimer();
        triggerShake(8);
        playSfx('level');
      }
    };
  }
  modal.style.display = 'flex';
}

export function triggerDeath() {
  gameState.isDead = true;
  resetInput();
  triggerHaptic('heavy');
  const timerElem = document.getElementById('timer-val');
  const time = timerElem ? timerElem.innerText : '00:00';
  const summary = document.getElementById('death-summary');
  if (summary) {
    summary.innerHTML = 
      `Tempo Sobrevivido: <b>${time}</b><br>Inimigos Abatidos: <b>${gameState.kills}</b><br>Nível de Poder: <b>${player.level}</b><br>Ouro Acumulado: <b>${getPersistentGold()}</b>`;
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

export function openTalentsModal() {
  const charModal = document.getElementById('char-modal');
  if (charModal) charModal.style.display = 'none';

  const modal = document.getElementById('talents-modal');
  const list = document.getElementById('talents-list');
  const goldVal = document.getElementById('talents-gold-val');
  if (!modal || !list) return;

  function renderTree() {
    if (goldVal) goldVal.innerText = getPersistentGold();
    list.innerHTML = '';
    const levels = getMetaLevels();

    META_TALENTS.forEach(t => {
      const curLvl = levels[t.id] || 0;
      const isMax = curLvl >= t.maxLvl;
      const cost = getMetaUpgradeCost(t.id, curLvl);
      const canAfford = getPersistentGold() >= cost && !isMax;

      const card = document.createElement('div');
      card.className = 'talent-card';
      card.innerHTML = `
        <div class="talent-info">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <b style="color: #fff; font-size: 13px;">${t.name}</b>
            <span style="font-size: 10px; color: #f1c40f; font-weight: bold;">Nv ${curLvl}/${t.maxLvl}</span>
          </div>
          <div style="font-size: 10px; color: #8c93a8; line-height: 1.35;">${t.desc}</div>
        </div>
        <button class="card-btn talent-buy-btn" ${!canAfford ? 'disabled' : ''} style="margin: 0; padding: 7px; font-size: 11px; background: ${canAfford ? '#f39c12' : '#22283a'}; color: ${canAfford ? '#000' : '#666'}; border-color: ${canAfford ? '#f1c40f' : '#2c334d'};">
          ${isMax ? 'MÁXIMO' : `Comprar • 🪙 ${cost}`}
        </button>
      `;

      const buyBtn = card.querySelector('.talent-buy-btn');
      if (buyBtn && canAfford) {
        buyBtn.onclick = () => {
          if (buyMetaUpgrade(t.id)) {
            playSfx('level');
            renderTree();
          }
        };
      }
      list.appendChild(card);
    });
  }

  renderTree();
  modal.style.display = 'flex';
}

export function openCharacterSelect() {
  const talentsModal = document.getElementById('talents-modal');
  if (talentsModal) talentsModal.style.display = 'none';

  const deathModal = document.getElementById('death-modal');
  if (deathModal) deathModal.style.display = 'none';

  const victoryModal = document.getElementById('victory-modal');
  if (victoryModal) victoryModal.style.display = 'none';

  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) pauseModal.style.display = 'none';

  const charModal = document.getElementById('char-modal');
  const list = document.getElementById('char-list');
  if (!charModal || !list) return;

  list.innerHTML = '';

  Object.keys(CHARACTERS).forEach(key => {
    const c = CHARACTERS[key];
    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerHTML = `
      <div>
        <span class="char-badge">${c.title}</span>
        <div class="char-name">${c.name}</div>
        <div class="char-desc">${c.desc}</div>
      </div>
      <button class="card-btn" style="margin-top: 8px; padding: 7px; font-size: 11px; pointer-events: none; background: #20273d; border-color: #384266;">
        Selecionar
      </button>
    `;
    card.onclick = () => {
      setSelectedHeroKey(key);
      charModal.style.display = 'none';
      resetGame();
    };
    list.appendChild(card);
  });

  charModal.style.display = 'flex';
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

  bindClick('pause-btn', togglePause);
  bindClick('resume-btn', togglePause);
  bindClick('abandon-btn', openCharacterSelect);
  bindClick('restart-death-btn', openCharacterSelect);
  bindClick('restart-victory-btn', openCharacterSelect);

  bindClick('open-talents-btn', openTalentsModal);
  bindClick('close-talents-btn', () => {
    const talentsModal = document.getElementById('talents-modal');
    if (talentsModal) talentsModal.style.display = 'none';
    openCharacterSelect();
  });
  bindClick('reset-talents-btn', () => {
    resetMetaTree();
    playSfx('chest');
    openTalentsModal();
  });

  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', e => setGameVolume(e.target.value));
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!gameState.isPaused && !gameState.isDead && !gameState.isWon) {
        gameState.isPaused = true;
        const pauseModal = document.getElementById('pause-modal');
        if (pauseModal) pauseModal.style.display = 'flex';
        if (audioCtx && audioCtx.state === 'running') {
          audioCtx.suspend();
        }
      }
    }
  });
}