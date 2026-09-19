/**
 * src/systems/ui.js
 * Façade do Sistema de Interface de Usuário Grim Cyber-Gothic.
 * Re-exporta todos os modais especializados de `src/ui/modals/*` para total compatibilidade retroativa,
 * e gerencia a inicialização e escutas globais de UI (initUI).
 */

// 1. Re-exports dos Modais Especializados
export * from '../ui/modals/bossSelectModal.js';
export * from '../ui/modals/upgradeModal.js';
export * from '../ui/modals/pauseModal.js';
export * from '../ui/modals/chestModal.js';
export * from '../ui/modals/gameOverModal.js';
export * from '../ui/modals/characterSelectModal.js';
export * from '../ui/modals/talentsModal.js';
export * from '../ui/modals/codexModal.js';

// 2. Dependências para a inicialização e fiação dos eventos (initUI)
import { levelUp } from '../ui/modals/upgradeModal.js';
import { togglePause, openPause, renderPauseInventory } from '../ui/modals/pauseModal.js';
import { openCharacterSelect, isMobileScreen } from '../ui/modals/characterSelectModal.js';
import { 
  openAchievementsModal, 
  closeAchievementsModal, 
  openBestiaryModal, 
  closeBestiaryModal, 
  currentBestiaryCategory, 
  setCurrentBestiaryCategory,
  renderBestiaryRoster, 
  renderBestiaryDossier, 
  selectedCreatureId 
} from '../ui/modals/codexModal.js';
import { 
  openTalentsModal, 
  activeRenderAstrolabe, 
  setActiveRenderAstrolabe, 
  renderBlessingsSummary 
} from '../ui/modals/talentsModal.js';
import { 
  closeBossSelectModal, 
  renderBossSelectModal 
} from '../ui/modals/bossSelectModal.js';
import { resetMetaTree } from '../entities/player.js';
import { playSfx, setGameVolume, audioCtx } from '../core/audio.js';
import { gameState, activeBoss } from '../main.js';
import { onLayoutChange, updateHudBottomMetric } from '../core/responsive.js';
import { resizePreviewCanvas } from '../render/characterPreview.js';

/**
 * Inicializador da Interface de Usuário e Fiação de Eventos
 */
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
      setCurrentBestiaryCategory(cat);
      renderBestiaryRoster(cat);
      playSfx('click');
    });
  });

  bindClick('open-talents-btn', openTalentsModal);
  bindClick('close-talents-btn', () => {
    setActiveRenderAstrolabe(null);
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
        openPause();
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