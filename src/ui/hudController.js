/**
 * src/ui/hudController.js
 * Gerenciador e Controlador Diegético de HUD de Combate.
 * Responsável pelo cache do DOM (Zero Layout Thrashing), Dirty Checking,
 * Decaimento da Barra Fantasma (Ghost Bar) do jogador e do chefe, e timer de sobrevivência.
 */
import { player, updateSkillUI, getPersistentGold } from '../entities/player.js';
import { ARENA_PALETTES } from '../render/environment.js';

// Cache de nós estáticos do DOM para eliminar chamadas a document.getElementById e evitar Layout Thrashing
const hudDom = {
  hpVal: null,
  hpMaxVal: null,
  hpFill: null,
  hpGhostFill: null,
  hpPctVal: null,
  hpContainer: null,
  lvlVal: null,
  killsVal: null,
  xpVal: null,
  xpNextVal: null,
  xpFill: null,
  xpPctVal: null,
  goldVal: null,
  waveBanner: null,
  bossHud: null,
  bossHpGhostFill: null,
  bossHpFill: null,
  bossHpVal: null,
  timerVal: null
};

export function ensureHudElementsCached() {
  if (!hudDom.hpVal) {
    hudDom.hpVal = document.getElementById('hp-val');
    hudDom.hpMaxVal = document.getElementById('hp-max-val');
    hudDom.hpFill = document.getElementById('hp-fill');
    hudDom.hpGhostFill = document.getElementById('hp-ghost-fill');
    hudDom.hpPctVal = document.getElementById('hp-pct-val');
    hudDom.hpContainer = document.getElementById('hp-container');
    hudDom.lvlVal = document.getElementById('lvl-val');
    hudDom.killsVal = document.getElementById('kills-val');
    hudDom.xpVal = document.getElementById('xp-val');
    hudDom.xpNextVal = document.getElementById('xp-next-val');
    hudDom.xpFill = document.getElementById('xp-fill');
    hudDom.xpPctVal = document.getElementById('xp-pct-val');
    hudDom.goldVal = document.getElementById('gold-val');
    hudDom.waveBanner = document.getElementById('wave-banner');
    hudDom.bossHud = document.getElementById('boss-hud');
    hudDom.bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
    hudDom.bossHpFill = document.getElementById('boss-hp-fill');
    hudDom.bossHpVal = document.getElementById('boss-hp-val');
    hudDom.timerVal = document.getElementById('timer-val');
  }
}

// Estados cacheados para Dirty Checking no loop principal
let _lastHp = -1;
let _lastMaxHp = -1;
let _lastHpPct = -1;
let _lastGhostHp = -1;
let _lastLvl = -1;
let _lastKills = -1;
let _lastXp = -1;
let _lastNextXp = -1;
let _lastXpPct = -1;
let _lastGold = -1;
let _lastWaveBannerText = '';
let _lastBossHpPct = -1;
let _lastBossEnraged = null;
let _lastTimerStr = '';

let ghostHp = 120;
let ghostHpTimer = 0;

let bossGhostHp = 0;
let bossGhostHpTimer = 0;
let _lastBossGhostHp = -1;

export function resetBossGhostHp() {
  bossGhostHp = 0;
  bossGhostHpTimer = 0;
  _lastBossGhostHp = 0;
}

export function resetHUD(initialHp = 120) {
  ghostHp = initialHp;
  ghostHpTimer = 0;
  resetBossGhostHp();

  _lastHp = -1;
  _lastMaxHp = -1;
  _lastHpPct = -1;
  _lastGhostHp = -1;
  _lastLvl = -1;
  _lastKills = -1;
  _lastXp = -1;
  _lastNextXp = -1;
  _lastXpPct = -1;
  _lastGold = -1;
  _lastWaveBannerText = '';
  _lastBossHpPct = -1;
  _lastBossEnraged = null;
  _lastTimerStr = '';
}

export function updateHUD(dt, { gameState, activeBoss, currentArenaTheme, seconds, currentWave }) {
  // Atualização Visual do HUD de HP com Decaimento da Barra Fantasma (Ghost Bar)
  if (player.hp < ghostHp) {
    ghostHpTimer += dt;
    if (ghostHpTimer > 20) {
      ghostHp = Math.max(player.hp, ghostHp - 1.8 * dt);
    }
  } else {
    ghostHp = player.hp;
    ghostHpTimer = 0;
  }

  ensureHudElementsCached();

  // Dirty Checking do HUD de Vida
  const currentHp = Math.max(0, Math.ceil(player.hp));
  if (currentHp !== _lastHp) {
    _lastHp = currentHp;
    if (hudDom.hpVal) hudDom.hpVal.innerText = currentHp;
  }

  if (player.maxHp !== _lastMaxHp) {
    _lastMaxHp = player.maxHp;
    if (hudDom.hpMaxVal) hudDom.hpMaxVal.innerText = player.maxHp;
  }

  const hpPct = Math.max(0, Math.min(100, Math.round((currentHp / player.maxHp) * 100)));
  if (hpPct !== _lastHpPct) {
    _lastHpPct = hpPct;
    if (hudDom.hpPctVal) hudDom.hpPctVal.innerText = `${hpPct}%`;
    if (hudDom.hpFill) hudDom.hpFill.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
    if (hudDom.hpContainer) {
      if (hpPct <= 30 && player.hp > 0) {
        hudDom.hpContainer.classList.add('critical');
      } else {
        hudDom.hpContainer.classList.remove('critical');
      }
    }
  }

  const roundedGhostHp = Math.round(ghostHp);
  if (roundedGhostHp !== _lastGhostHp) {
    _lastGhostHp = roundedGhostHp;
    if (hudDom.hpGhostFill) hudDom.hpGhostFill.style.width = `${Math.max(0, (ghostHp / player.maxHp) * 100)}%`;
  }

  // Dirty Checking de Nível, Kills e Progressão de XP
  if (player.level !== _lastLvl) {
    _lastLvl = player.level;
    if (hudDom.lvlVal) hudDom.lvlVal.innerText = player.level;
  }

  if (gameState.kills !== _lastKills) {
    _lastKills = gameState.kills;
    if (hudDom.killsVal) hudDom.killsVal.innerText = gameState.kills;
  }

  const curXp = Math.floor(player.xp);
  if (curXp !== _lastXp) {
    _lastXp = curXp;
    if (hudDom.xpVal) hudDom.xpVal.innerText = curXp;
  }

  if (player.nextXp !== _lastNextXp) {
    _lastNextXp = player.nextXp;
    if (hudDom.xpNextVal) hudDom.xpNextVal.innerText = player.nextXp;
  }

  const xpPct = Math.min(100, Math.round((player.xp / player.nextXp) * 100));
  if (xpPct !== _lastXpPct) {
    _lastXpPct = xpPct;
    if (hudDom.xpPctVal) hudDom.xpPctVal.innerText = `${xpPct}%`;
    if (hudDom.xpFill) hudDom.xpFill.style.width = `${Math.min(100, (player.xp / player.nextXp) * 100)}%`;
  }

  const currentPersistentGold = getPersistentGold();
  if (currentPersistentGold !== _lastGold) {
    _lastGold = currentPersistentGold;
    if (hudDom.goldVal) hudDom.goldVal.innerText = currentPersistentGold;
  }
  
  let targetWaveBannerText = '';
  if (gameState.isWavePaused && !activeBoss) {
    targetWaveBannerText = "ABRA O BAÚ PARA CONTINUAR!";
  } else if (activeBoss) {
    const arenaName = ARENA_PALETTES[currentArenaTheme]?.name || '';
    targetWaveBannerText = `${activeBoss.name} • ${arenaName}`;
  } else {
    const arenaName = ARENA_PALETTES[currentArenaTheme]?.name;
    targetWaveBannerText = arenaName ? `${currentWave.name} • ${arenaName}` : (currentWave?.name || '');
  }

  if (targetWaveBannerText !== _lastWaveBannerText) {
    _lastWaveBannerText = targetWaveBannerText;
    if (hudDom.waveBanner) hudDom.waveBanner.innerText = targetWaveBannerText;
  }

  updateSkillUI();

  if (activeBoss) {
    const bossHpPct = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
    const roundedBossHpPct = Math.ceil(bossHpPct);

    // Inicializa ghostHp se desatualizado ou inicial
    if (bossGhostHp <= 0 || bossGhostHp > activeBoss.maxHp) {
      bossGhostHp = activeBoss.hp;
    }

    if (activeBoss.hp < bossGhostHp) {
      bossGhostHpTimer += dt;
      if (bossGhostHpTimer > 18) {
        bossGhostHp = Math.max(activeBoss.hp, bossGhostHp - (activeBoss.maxHp * 0.015) * dt);
      }
    } else {
      bossGhostHp = activeBoss.hp;
      bossGhostHpTimer = 0;
    }

    const bossGhostHpPct = Math.max(0, (bossGhostHp / activeBoss.maxHp) * 100);

    if (bossHpPct !== _lastBossHpPct || activeBoss.isEnraged !== _lastBossEnraged) {
      _lastBossHpPct = bossHpPct;
      _lastBossEnraged = activeBoss.isEnraged;

      if (hudDom.bossHpFill) {
        hudDom.bossHpFill.style.width = `${bossHpPct}%`;
        if (activeBoss.isEnraged) {
          hudDom.bossHpFill.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
          hudDom.bossHpFill.style.boxShadow = '0 0 12px rgba(231, 76, 60, 0.85)';
        } else {
          hudDom.bossHpFill.style.background = '';
          hudDom.bossHpFill.style.boxShadow = '';
        }
      }
      if (hudDom.bossHud) {
        if (activeBoss.isEnraged) {
          hudDom.bossHud.classList.add('enraged');
        } else {
          hudDom.bossHud.classList.remove('enraged');
        }
      }
      if (hudDom.bossHpVal) hudDom.bossHpVal.innerText = `${roundedBossHpPct}%`;
    }

    const roundedBossGhost = Math.round(bossGhostHpPct);
    if (roundedBossGhost !== _lastBossGhostHp) {
      _lastBossGhostHp = roundedBossGhost;
      if (hudDom.bossHpGhostFill) {
        hudDom.bossHpGhostFill.style.width = `${bossGhostHpPct}%`;
      }
    }
  }

  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  const currentTimerStr = `${m}:${s}`;
  if (currentTimerStr !== _lastTimerStr) {
    _lastTimerStr = currentTimerStr;
    if (hudDom.timerVal) hudDom.timerVal.innerText = currentTimerStr;
  }
}
