/**
 * src/systems/barks.js
 * Sistema de Citações e Provocações dos Chefes e Elites durante o combate (Boss Barks).
 * Exibe falas cinematográficas sem interromper ou pausar a ação do jogador.
 */
import { BESTIARY_ENTRIES } from '../config/bestiary.js';
import { playSfx, triggerHaptic } from '../core/audio.js';

let barkTimeout = null;
let currentBarkBossId = null;

const PHASE_LABELS = {
  SPAWN: 'SURGIMENTO',
  ENRAGE: 'FÚRIA DESATADA (50% HP)',
  DEFEAT: 'ÚLTIMO SUSPIRO',
  MINIBOSS: 'AMEAÇA DE ELITE'
};

const PHASE_COLORS = {
  SPAWN: '#ffd166',
  ENRAGE: '#ff4757',
  DEFEAT: '#a29bfe',
  MINIBOSS: '#e67e22'
};

/**
 * Dispara uma fala dinâmica de Chefe na arena
 * @param {number} bossId ID do Chefe (1 a 4)
 * @param {'SPAWN'|'ENRAGE'|'DEFEAT'} eventType Tipo do evento
 */
export function triggerBossBark(bossId, eventType = 'SPAWN') {
  const creature = BESTIARY_ENTRIES.find(b => b.bossId === bossId);
  if (!creature || !creature.quotes || creature.quotes.length === 0) return;

  let quote = '';
  if (eventType === 'SPAWN') quote = creature.quotes[0] || creature.quotes[0];
  else if (eventType === 'ENRAGE') quote = creature.quotes[1] || creature.quotes[0];
  else if (eventType === 'DEFEAT') quote = creature.quotes[2] || creature.quotes[0];
  else quote = creature.quotes[0];

  displayBarkUI(creature.name, quote, eventType, creature.color || '#ff4757');

  if (eventType === 'SPAWN') {
    try { playSfx('boss'); } catch (e) {}
  } else if (eventType === 'ENRAGE') {
    try { 
      playSfx('hit'); 
      triggerHaptic('heavy'); 
    } catch (e) {}
  } else if (eventType === 'DEFEAT') {
    try { playSfx('chest_rare'); } catch (e) {}
  }
}

/**
 * Dispara uma fala dinâmica de Mini-Chefe icônico
 * @param {string} miniBossType Chave do mini-chefe
 */
export function triggerMiniBossBark(miniBossType) {
  const creature = BESTIARY_ENTRIES.find(b => b.id === miniBossType);
  if (!creature || !creature.quotes || creature.quotes.length === 0) return;

  const quote = creature.quotes[Math.floor(Math.random() * creature.quotes.length)];
  displayBarkUI(creature.name, quote, 'MINIBOSS', creature.color || '#e67e22');
  try { playSfx('shoot'); } catch (e) {}
}

/**
 * Renderiza o widget de citação no DOM com animação suave
 */
function displayBarkUI(speaker, quote, eventType, themeColor) {
  const container = document.getElementById('boss-bark-container');
  const speakerEl = document.getElementById('boss-bark-speaker');
  const phaseTagEl = document.getElementById('boss-bark-phase-tag');
  const quoteEl = document.getElementById('boss-bark-text');

  if (!container || !speakerEl || !quoteEl) return;

  if (barkTimeout) {
    clearTimeout(barkTimeout);
    barkTimeout = null;
  }

  speakerEl.innerText = speaker.toUpperCase();
  speakerEl.style.color = themeColor;

  if (phaseTagEl) {
    phaseTagEl.innerText = PHASE_LABELS[eventType] || 'AVISO';
    phaseTagEl.style.color = PHASE_COLORS[eventType] || '#ffd166';
    phaseTagEl.style.borderColor = `${PHASE_COLORS[eventType] || '#ffd166'}55`;
  }

  quoteEl.innerText = quote;

  container.style.removeProperty('display');
  container.style.display = 'flex';
  container.classList.remove('bark-fade-out');
  container.classList.add('bark-active');

  // Duração de 4.0 segundos de exibição na arena
  barkTimeout = setTimeout(() => {
    container.classList.add('bark-fade-out');
    setTimeout(() => {
      container.classList.remove('bark-active', 'bark-fade-out');
      container.style.display = 'none';
    }, 400);
  }, 3800);
}

/**
 * Limpa citações ativas imediatamente (ao morrer, reiniciar ou trocar de tela)
 */
export function clearActiveBarks() {
  if (barkTimeout) {
    clearTimeout(barkTimeout);
    barkTimeout = null;
  }
  const container = document.getElementById('boss-bark-container');
  if (container) {
    container.classList.remove('bark-active', 'bark-fade-out');
    container.style.display = 'none';
  }
}
