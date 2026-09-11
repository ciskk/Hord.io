import { initAudio } from './audio.js';
import { triggerHeroSkill } from '../entities/player.js';
import { 
  togglePause, 
  isBossSelectAllowed, 
  openBossSelectModal, 
  closeBossSelectModal 
} from '../systems/ui.js';
import { gameState } from '../main.js';

// Rastreamento de teclas simultâneas ativas
const activeKeyCodes = new Set();

// Trava contra gestos do Safari iOS (Pinch-to-zoom / Double-tap zoom / Pull-to-refresh)[cite: 1]
document.addEventListener('gesturestart', function(e) { e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', function(e) { e.preventDefault(); }, { passive: false });

// Joystick Virtual Mobile[cite: 1]
export const stick = {
  active: false,
  touchId: null,
  startX: 0,
  startY: 0,
  curX: 0,
  curY: 0,
  radius: 48
};

export let inputX = 0;
export let inputY = 0;

// Estado das teclas pressionadas (WASD / Setas)
const keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

function updateKeyboardVector() {
  if (stick.active) return; // Se o joystick touch estiver ativo, ignora teclado

  let kx = 0;
  let ky = 0;

  if (keys.left) kx -= 1;
  if (keys.right) kx += 1;
  if (keys.up) ky -= 1;
  if (keys.down) ky += 1;

  // Normalização vetorial para evitar velocidade dobrada nas diagonais (Pitágoras)
  if (kx !== 0 && ky !== 0) {
    kx *= 0.7071;
    ky *= 0.7071;
  }

  inputX = kx;
  inputY = ky;
}

export function resetInput() {
  inputX = 0;
  inputY = 0;
  stick.active = false;
  stick.touchId = null;
  keys.up = false;
  keys.down = false;
  keys.left = false;
  keys.right = false;
  activeKeyCodes.clear();
}

window.addEventListener('blur', () => {
  activeKeyCodes.clear();
  resetInput();
});

const canvas = document.getElementById('game-canvas');

// Touch Mobile com Prevenção Estrita para iOS[cite: 1]
window.addEventListener('touchstart', e => {
  initAudio();
  if (e.target === canvas) e.preventDefault();
  if (gameState.isPaused || gameState.isDead || gameState.isWon) return;

  for (let t of e.changedTouches) {
    if (!stick.active) {
      stick.active = true;
      stick.touchId = t.identifier;
      stick.startX = t.clientX;
      stick.startY = t.clientY;
      stick.curX = t.clientX;
      stick.curY = t.clientY;
      inputX = 0;
      inputY = 0;
      break;
    }
  }
}, { passive: false });

window.addEventListener('touchmove', e => {
  if (e.target === canvas) e.preventDefault();
  if (!stick.active) return;

  for (let t of e.changedTouches) {
    if (t.identifier === stick.touchId) {
      const dx = t.clientX - stick.startX;
      const dy = t.clientY - stick.startY;
      const distSq = dx * dx + dy * dy;

      if (distSq > stick.radius * stick.radius) {
        const dist = Math.sqrt(distSq);
        stick.curX = stick.startX + (dx / dist) * stick.radius;
        stick.curY = stick.startY + (dy / dist) * stick.radius;
      } else {
        stick.curX = t.clientX;
        stick.curY = t.clientY;
      }

      inputX = (stick.curX - stick.startX) / stick.radius;
      inputY = (stick.curY - stick.startY) / stick.radius;
      break;
    }
  }
}, { passive: false });

function endTouch(e) {
  for (let t of e.changedTouches) {
    if (t.identifier === stick.touchId) {
      stick.active = false;
      stick.touchId = null;
      updateKeyboardVector(); // Retoma o controle do teclado caso alguma tecla esteja retida
      break;
    }
  }
}

window.addEventListener('touchend', endTouch);
window.addEventListener('touchcancel', endTouch);

// Suporte ao Teclado (WASD, Setas, Espaço, E, Esc e P)
window.addEventListener('keydown', e => {
  initAudio();
  activeKeyCodes.add(e.code);

  // Pausa com Esc ou P (ou fechar menu de bosses se estiver aberto)
  if (e.code === 'Escape' || e.code === 'KeyP') {
    e.preventDefault();
    const bossModal = document.getElementById('boss-select-modal');
    if (bossModal && bossModal.style.display === 'flex') {
      closeBossSelectModal();
      return;
    }
    togglePause();
    return;
  }

  // Atalho Secreto de Desenvolvedor: W + 5
  const isWPressed = activeKeyCodes.has('KeyW') || e.code === 'KeyW';
  const is5Pressed = activeKeyCodes.has('Digit5') || activeKeyCodes.has('Numpad5') || e.code === 'Digit5' || e.code === 'Numpad5' || e.key === '5';

  if (isWPressed && is5Pressed) {
    if (isBossSelectAllowed()) {
      e.preventDefault();
      openBossSelectModal();
      return;
    }
  }

  // Habilidade com Espaço ou E
  if (e.code === 'Space' || e.code === 'KeyE') {
    e.preventDefault();
    triggerHeroSkill();
    return;
  }

  // Direcionais
  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;

  updateKeyboardVector();
});

window.addEventListener('keyup', e => {
  activeKeyCodes.delete(e.code);

  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;

  updateKeyboardVector();
});

// Bloqueia zoom via Mouse Wheel e Touchpad Pinch (Ctrl + Scroll / Pinça)
window.addEventListener('wheel', e => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

// Bloqueia atalhos de teclado de zoom (Ctrl +, Ctrl -, Ctrl 0 no teclado normal e numérico)
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey) {
    const zoomKeys = [
      'Equal',          // Tecla + / =
      'Minus',          // Tecla -
      'NumpadAdd',      // + no numpad
      'NumpadSubtract', // - no numpad
      'Digit0',         // 0
      'Numpad0'         // 0 no numpad
    ];

    if (zoomKeys.includes(e.code) || e.key === '+' || e.key === '-' || e.key === '=') {
      e.preventDefault();
    }
  }
}, { passive: false });

// Habilidade ativada com Botão Direito do Mouse (sem abrir menu de contexto nativo)
window.addEventListener('contextmenu', e => {
  e.preventDefault();
  triggerHeroSkill();
});