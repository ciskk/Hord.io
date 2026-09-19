/**
 * src/ui/modals/chestModal.js
 * Sequência Cinematográfica de Unboxing de Baús Arcanos (Chefe & Mini-Boss).
 */
import { playSfx, triggerHaptic } from '../../core/audio.js';
import { 
  gameState, 
  resetSpawnTimer, 
  setLastTime, 
  triggerShake, 
  activeBoss, 
  frameCount, 
  setIsWavePaused 
} from '../../main.js';
import { resetInput } from '../../core/input.js';
import { getRandomUpgrades, checkSynergies } from '../../config/upgrades.js';
import { player, addPersistentGold } from '../../entities/player.js';
import { renderIcon } from '../icons.js';
import { UPGRADE_ICONS } from './upgradeModal.js';
import { recordRunStats } from '../../config/achievements.js';
import { transitionToArenaTheme, getWaveArenaTheme } from '../../render/environment.js';
import { getCurrentWave, getEffectiveHordeSeconds } from '../../systems/waves.js';

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
