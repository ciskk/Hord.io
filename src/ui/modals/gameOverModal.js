/**
 * src/ui/modals/gameOverModal.js
 * Modais de Desfecho da Partida: Execução de Morte Intrínseca e Triunfo de Vitória.
 */
import { 
  gameState, 
  lastAttackerName, 
  deathContext,
  bossShockwaves, 
  voidVortices, 
  bossTelegraphs, 
  bossProjectiles 
} from '../../main.js';
import { resetInput } from '../../core/input.js';
import { triggerHaptic, applyDeathAudioFilter, resetDeathAudioFilter, playSfx } from '../../core/audio.js';
import { recordRunStats } from '../../config/achievements.js';
import { BESTIARY_ENTRIES } from '../../config/bestiary.js';
import { renderIcon } from '../icons.js';
import { player, getPersistentGold } from '../../entities/player.js';
import { openCharacterSelect } from './characterSelectModal.js';

/**
 * Vereditos Poéticos da Queda (Horror Grim Cyber-Gothic)
 */
export const DEATH_VERDICTS = [
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

let deathKeydownHandler = null;

/**
 * Mapeia ícones e conselhos táticos inteligentes com base na criatura ou perigo fatal.
 */
function resolveDeathTacticsAndIcon(killerName, category, enemyType) {
  // 1. Busca por correspondência no Códice do Bestiário
  let bestiaryEntry = null;
  if (enemyType) {
    bestiaryEntry = BESTIARY_ENTRIES.find(b => b.id === enemyType);
  }
  if (!bestiaryEntry && killerName) {
    const lowerName = killerName.toLowerCase();
    bestiaryEntry = BESTIARY_ENTRIES.find(b => 
      b.name.toLowerCase() === lowerName || 
      lowerName.includes(b.name.toLowerCase()) || 
      b.name.toLowerCase().includes(lowerName)
    );
  }

  let tacticText = '';
  let threatLabel = 'LETALIDADE ALTA';
  let categoryLabel = 'ABOMINAÇÃO DA HORDA';
  let iconSvg = '';

  if (bestiaryEntry) {
    tacticText = bestiaryEntry.tactics;
    threatLabel = `AMEAÇA GRAU ${bestiaryEntry.threat || 3}`;
    if (bestiaryEntry.category === 'BOSS') {
      categoryLabel = 'CHEFE SUPREMO DO ABISMO';
      iconSvg = renderIcon('boss_crown', { size: 30, color: '#ffd166' });
    } else if (bestiaryEntry.category === 'MINIBOSS') {
      categoryLabel = 'MINI-CHEFE DEVASTADOR';
      iconSvg = renderIcon('skull', { size: 28, color: '#e67e22' });
    } else {
      categoryLabel = 'ABOMINAÇÃO DA HORDA';
      iconSvg = renderIcon('sword', { size: 28, color: '#ff4757' });
    }
  } else {
    // 2. Conselhos de Sobrevivência Contextuais para Perigos e Golpes Especiais
    switch (category) {
      case 'BOSS':
        categoryLabel = 'CHEFE SUPREMO DO ABISMO';
        threatLabel = 'PERIGO APOCALÍPTICO';
        iconSvg = renderIcon('boss_crown', { size: 30, color: '#ffd166' });
        tacticText = "Os ataques de chefes possuem telégrafos visuais no solo. Guarde a esquiva/dash para o momento em que a demarcação geométrica fechar.";
        break;

      case 'MINIBOSS':
        categoryLabel = 'MINI-CHEFE DEVASTADOR';
        threatLabel = 'AMEAÇA DEVASTADORA';
        iconSvg = renderIcon('skull', { size: 28, color: '#e67e22' });
        tacticText = "Mini-chefes possuem hiperarmadura e investidas velozes. Ataque em círculos concêntricos mantendo rota de fuga livre.";
        break;

      case 'PROJECTILE':
        categoryLabel = 'DISPARO BALÍSTICO PROFANO';
        threatLabel = 'PERIGO À DISTÂNCIA';
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#9b59b6" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="#9b59b6"/><line x1="12" y1="2" x2="12" y2="6" stroke="#9b59b6" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="#9b59b6" stroke-width="2"/></svg>`;
        tacticText = "Monstros à distância atacam com base na sua trajetória. Mantenha movimentação em arco contínuo para que os tiros passem reto.";
        break;

      case 'HAZARD':
        categoryLabel = 'CATACLISMO AMBIENTAL';
        threatLabel = 'DANO CONTÍNUO';
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24"><path fill="#e74c3c" d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>`;
        tacticText = "Zonas de solo contaminado, miasmas e vórtices drenam vida aceleradamente. Ao avistar distorções no terreno, reposicione-se de imediato.";
        break;

      default:
        categoryLabel = 'ABOMINAÇÃO DA HORDA';
        threatLabel = 'ENXAME MORTAL';
        iconSvg = renderIcon('sword', { size: 28, color: '#ff4757' });
        tacticText = "Evite ser encurralado contra as extremidades da arena. Utilize o empurrão das armas para abrir brechas no cerco dos monstros.";
        break;
    }
  }

  return { tacticText, threatLabel, categoryLabel, iconSvg };
}

/**
 * Gatilho da Morte Intrínseca com Congelamento e Desfoque da Arena
 */
export function triggerDeath() {
  gameState.isDead = true;
  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) {
    pauseModal.classList.remove('active', 'closing');
    pauseModal.style.display = 'none';
  }
  const canvasElem = document.getElementById('game-canvas');
  if (canvasElem) canvasElem.classList.remove('canvas-stasis-frozen');
  resetInput();
  triggerHaptic('heavy');
  applyDeathAudioFilter();
  playSfx('death_heartbeat');

  setTimeout(() => {
    playSfx('tombstone_slam');
  }, 300);

  // 1. Congelamento e Desfoque Cinemático da Arena
  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) {
    gameCanvas.classList.add('canvas-death-frozen');
  }

  // 2. Vinheta Vermelha Necrótica de Fundo
  const bloodFilter = document.getElementById('blood-screen-filter');
  if (bloodFilter) {
    bloodFilter.classList.add('active');
  }

  // 3. Sorteio Dinâmico do Veredito
  const randomVerdict = DEATH_VERDICTS[Math.floor(Math.random() * DEATH_VERDICTS.length)];
  const titleElem = document.getElementById('death-verdict-title');
  if (titleElem) {
    titleElem.innerText = randomVerdict;
  }

  // 4. Resolução da Causa Mortis (O Algoz e Golpe Fatal)
  const killerName = (deathContext && deathContext.name) ? deathContext.name : (lastAttackerName || 'A Horda do Abismo');
  const killerCategory = (deathContext && deathContext.category) ? deathContext.category : 'HORDE';
  const killerAttack = (deathContext && deathContext.attackName) ? deathContext.attackName : 'Golpe Melee Fatal';
  const lethalDmg = (deathContext && deathContext.damage > 0) ? `-${deathContext.damage} Dano` : 'Golpe Fatal';
  const enemyType = deathContext ? deathContext.enemyType : null;

  const { tacticText, threatLabel, categoryLabel, iconSvg } = resolveDeathTacticsAndIcon(killerName, killerCategory, enemyType);

  const emblemElem = document.getElementById('death-killer-emblem');
  if (emblemElem && iconSvg) {
    emblemElem.innerHTML = iconSvg;
  }

  const categoryBadge = document.getElementById('death-category-badge');
  if (categoryBadge) {
    categoryBadge.innerText = categoryLabel;
  }

  const threatIndicator = document.getElementById('death-threat-indicator');
  if (threatIndicator) {
    threatIndicator.innerHTML = `⚠️ ${threatLabel}`;
  }

  const killerNameElem = document.getElementById('death-killer-name');
  if (killerNameElem) {
    killerNameElem.innerText = killerName;
  }

  const attackNameElem = document.getElementById('death-attack-name');
  if (attackNameElem) {
    attackNameElem.innerText = killerAttack;
  }

  const lethalDamageElem = document.getElementById('death-lethal-damage');
  if (lethalDamageElem) {
    lethalDamageElem.innerText = lethalDmg;
  }

  const tacticDescElem = document.getElementById('death-tactic-text');
  if (tacticDescElem) {
    tacticDescElem.innerText = tacticText;
  }

  // 5. Estatísticas da Partida (Biometria em Badges Transparentes)
  const timerElem = document.getElementById('timer-val');
  const survivalTime = timerElem ? timerElem.innerText : '00:00';

  const waveElem = document.getElementById('wave-banner');
  const waveText = waveElem ? waveElem.innerText.split(':')[0] : 'Horda';

  const metricsStream = document.getElementById('death-metrics-stream');
  if (metricsStream) {
    metricsStream.innerHTML = `
      <div class="death-metric-pill">
        <div class="death-pill-header">
          <svg class="death-pill-icon" viewBox="0 0 24 24" style="color:#ffd166;"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <span class="death-pill-label">SOBREVIVÊNCIA</span>
        </div>
        <span class="death-pill-value">${survivalTime}</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('wave_swords', { size: 12, color: '#f1c40f' })}
          <span class="death-pill-label">HORDA</span>
        </div>
        <span class="death-pill-value">${waveText}</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('skull', { size: 12, color: '#ff4757' })}
          <span class="death-pill-label">ABATES</span>
        </div>
        <span class="death-pill-value highlight-crimson">${gameState.kills}</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('sparkle', { size: 12, color: '#f1c40f' })}
          <span class="death-pill-label">PODER</span>
        </div>
        <span class="death-pill-value">Nv. ${player.level}</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('gold', { size: 12, color: '#f1c40f' })}
          <span class="death-pill-label">ALMAS</span>
        </div>
        <span class="death-pill-value highlight-gold">${getPersistentGold()}</span>
      </div>
    `;
  }

  // 6. Conquistas Desbloqueadas nesta Jornada
  const newlyUnlocked = recordRunStats({
    kills: gameState.kills,
    runFinished: true
  });

  const achContainer = document.getElementById('death-achievements-container');
  if (achContainer) {
    if (newlyUnlocked && newlyUnlocked.length > 0) {
      achContainer.innerHTML = `
        <div class="death-ach-card">
          <div class="death-ach-header">
            ${renderIcon('sparkle', { size: 12, color: '#ffd166' })} CONQUISTA DESBLOQUEADA!
          </div>
          ${newlyUnlocked.map(a => `
            <div class="death-ach-item">
              <b>${a.title}</b>: ${a.heroTitle ? `Despertou <b>${a.heroTitle}</b> no Altar!` : a.desc}
            </div>
          `).join('')}
        </div>
      `;
    } else {
      achContainer.innerHTML = '';
    }
  }

  // 7. Registro de Teclas de Atalho (Espaço ou Enter para Renascer)
  if (deathKeydownHandler) {
    window.removeEventListener('keydown', deathKeydownHandler);
  }
  deathKeydownHandler = (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      const restartBtn = document.getElementById('restart-death-btn');
      if (restartBtn) restartBtn.click();
    }
  };
  window.addEventListener('keydown', deathKeydownHandler);

  // 8. Exibição da Interface Intrínseca
  const modal = document.getElementById('death-modal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

/**
 * Limpeza e Retorno ao Altar de Personagens
 */
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

  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) gameCanvas.classList.remove('canvas-death-frozen');

  if (deathKeydownHandler) {
    window.removeEventListener('keydown', deathKeydownHandler);
    deathKeydownHandler = null;
  }

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

export function closeDeathModal() {
  if (deathKeydownHandler) {
    window.removeEventListener('keydown', deathKeydownHandler);
    deathKeydownHandler = null;
  }
  const modal = document.getElementById('death-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.display = 'none';
  }
}

export function triggerVictory() {
  finalizeVictoryAndReturnToMenu();
}
