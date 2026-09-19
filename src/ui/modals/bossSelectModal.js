/**
 * src/ui/modals/bossSelectModal.js
 * Modal secreto de seleção e teste de chefes e mini-chefes.
 */
import { 
  gameState, 
  setActiveBoss, 
  bossShockwaves, 
  voidVortices, 
  setLastTime, 
  resetGame 
} from '../../main.js';
import { renderDevToolsModal } from '../../systems/devtools.js';
import { grantLevels } from '../../config/upgrades.js';
import { playSfx } from '../../core/audio.js';
import { closeCharSelectModal } from './characterSelectModal.js';
import { triggerBossEncounter, spawnMiniBoss } from '../../entities/enemies.js';

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
    if (pauseModal) {
      pauseModal.classList.remove('active', 'closing');
      pauseModal.style.display = 'none';
    }
    const canvasElem = document.getElementById('game-canvas');
    if (canvasElem) canvasElem.classList.remove('canvas-stasis-frozen');
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
    if (pauseModal) {
      pauseModal.classList.remove('active', 'closing');
      pauseModal.style.display = 'none';
    }
    const canvasElem = document.getElementById('game-canvas');
    if (canvasElem) canvasElem.classList.remove('canvas-stasis-frozen');
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
