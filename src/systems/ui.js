import { CHARACTERS } from '../config/characters.js';
import { getRandomUpgrades, checkSynergies } from '../config/upgrades.js';
import { playSfx, triggerHaptic, setGameVolume, initAudio, audioCtx } from '../core/audio.js';
import { resetInput } from '../core/input.js';
import { player, setSelectedHeroKey } from '../entities/player.js';
import { 
  gameState, 
  triggerShake, 
  setCurrentArenaTheme, 
  setIsWavePaused, 
  resetSpawnTimer, 
  setLastTime, 
  resetGame 
} from '../main.js';

export function togglePause() {
  if (gameState.isDead || gameState.isWon) return;
  initAudio();
  gameState.isPaused = !gameState.isPaused;
  document.getElementById('pause-modal').style.display = gameState.isPaused ? 'flex' : 'none';
  if (!gameState.isPaused) {
    setLastTime(performance.now());
  }
}

export function levelUp() {
  playSfx('level');
  gameState.isPaused = true;
  resetInput();

  const modal = document.getElementById('upgrade-modal');
  const container = document.getElementById('upgrade-list');
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
  modal.style.display = 'flex';
}

export function openChestModal() {
  playSfx('chest');
  gameState.isPaused = true;
  resetInput();

  const modal = document.getElementById('chest-modal');
  const list = document.getElementById('chest-rewards-list');
  list.innerHTML = '';

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
    evoItem.innerHTML = `<span style="color:#f1c40f; font-size:14px;">EVOLUÇÃO LENDÁRIA!</span><br><b>${evo.name}</b><br><span style="font-size:11px; color:#ddd;">${evo.desc}</span>`;
    list.appendChild(evoItem);
  }

  const rewards = getRandomUpgrades(2);
  rewards.forEach(r => {
    r.apply();
    const item = document.createElement('div');
    item.className = 'chest-reward-item';
    item.innerHTML = `<b>${r.title}</b> • <span style="font-size:11px; color:#ddd;">${r.stat}</span>`;
    list.appendChild(item);
  });

  const claimBtn = document.getElementById('chest-claim-btn');
  claimBtn.onclick = () => {
    modal.style.display = 'none';
    gameState.isPaused = false;
    setLastTime(performance.now());

    setCurrentArenaTheme('INDUSTRIAL');
    setIsWavePaused(false);
    resetSpawnTimer();
    triggerShake(8);
    playSfx('level');
  };
  modal.style.display = 'flex';
}

export function triggerDeath() {
  gameState.isDead = true;
  resetInput();
  triggerHaptic('heavy');
  const time = document.getElementById('timer-val').innerText;
  document.getElementById('death-summary').innerHTML = 
    `Tempo Sobrevivido: <b>${time}</b><br>Inimigos Abatidos: <b>${gameState.kills}</b><br>Nível de Poder: <b>${player.level}</b>`;
  document.getElementById('death-modal').style.display = 'flex';
}

export function triggerVictory() {
  gameState.isWon = true;
  gameState.isPaused = true;
  resetInput();
  playSfx('victory');
  triggerShake(20);
  triggerHaptic('heavy');
  const time = document.getElementById('timer-val').innerText;
  document.getElementById('victory-summary').innerHTML = 
    `Tempo de Combate: <b>${time}</b><br>Monstros Expurgados: <b>${gameState.kills}</b><br>Nível Alcançado: <b>${player.level}</b><br>Status: <b>Soberano do Abismo Exterminado!</b>`;
  document.getElementById('victory-modal').style.display = 'flex';
}

export function openCharacterSelect() {
  document.getElementById('death-modal').style.display = 'none';
  document.getElementById('victory-modal').style.display = 'none';
  document.getElementById('pause-modal').style.display = 'none';
  const charModal = document.getElementById('char-modal');
  const list = document.getElementById('char-list');
  list.innerHTML = '';

  Object.keys(CHARACTERS).forEach(key => {
    const c = CHARACTERS[key];
    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerHTML = `
      <div class="char-name">${c.name} <span style="font-size:11px; color:#aaa;">(${c.title})</span></div>
      <div class="char-desc">${c.desc}</div>
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
  document.getElementById('pause-btn').addEventListener('click', togglePause);
  document.getElementById('resume-btn').addEventListener('click', togglePause);
  document.getElementById('abandon-btn').addEventListener('click', openCharacterSelect);
  document.getElementById('restart-death-btn').addEventListener('click', openCharacterSelect);
  document.getElementById('restart-victory-btn').addEventListener('click', openCharacterSelect);

  const volumeSlider = document.getElementById('volume-slider');
  volumeSlider.addEventListener('input', e => setGameVolume(e.target.value));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!gameState.isPaused && !gameState.isDead && !gameState.isWon) {
        gameState.isPaused = true;
        document.getElementById('pause-modal').style.display = 'flex';
        if (audioCtx && audioCtx.state === 'running') {
          audioCtx.suspend();
        }
      }
    }
  });
}