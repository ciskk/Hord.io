/**
 * src/entities/bosses/abyssalMonolith/fsm.js
 * Máquina de estados FSM, progressão de fases e ciclo de vida de "Ignis Lithos, o Titã de Basalto".
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { enemies } from '../../../main.js';
import { MONOLITH_STATES, MONOLITH_CONFIG } from './constants.js';
import { 
  updateThermalVents, 
  updateLitocistos, 
  spawnLitocistos, 
  updateDelayedActions 
} from './mechanics.js';
import { 
  selectNextSkill, 
  executeTectonicSlam, 
  executeEpicenterEruption, 
  executeOuterSurge, 
  executePlateWhirl, 
  executeMagmaSiphonRelease, 
  executeVolcanicFissure, 
  executeBasaltBarrage 
} from './attacks.js';

/**
 * Atualiza a IA, colisões, transições de fase e padrões de ataque de Ignis Lithos.
 * @param {Object} e Entidade do chefe.
 * @param {number} dt Delta time do frame.
 * @param {Object} context Contexto global injetado do loop do jogo.
 */
export function updateAbyssalMonolith(e, dt, context = {}) {
  const {
    player,
    frameCount = 0,
    triggerShake = () => {},
    triggerHaptic = () => {},
    createHitParticles = () => {},
    addDamageText = () => {},
    bossShockwaves = []
  } = context;

  // 0. Gerenciamento do Banner de Título
  if (e.titleTimer > 0) {
    e.titleTimer -= dt;
  }

  // 1. Processamento de Ações Agendadas
  updateDelayedActions(e, dt);

  // 2. Ondulações Procedurais de Flutuação e Calor
  e.floatBob = Math.sin(frameCount * 0.05) * 5;
  e.magmaPulse = (Math.sin(frameCount * (e.isEnraged ? 0.18 : 0.09)) + 1) * 0.5;
  e.heatIntensity = e.isPhase3 ? 1.0 : (e.isEnraged ? 0.70 : 0.35);

  // Cinemática Procedural dos Punhos / Manoplas Megalíticas Flutuantes
  if (!e.gauntlets) {
    e.gauntlets = { left: { x: -64, y: 10, lift: 0, rot: 0.15 }, right: { x: 64, y: 10, lift: 0, rot: -0.15 } };
  }
  if (e.actionState === MONOLITH_STATES.WINDUP_SLAM) {
    e.gauntlets.left.lift = Math.min(55, e.gauntlets.left.lift + 3.2 * dt);
    e.gauntlets.right.lift = Math.min(55, e.gauntlets.right.lift + 3.2 * dt);
    e.gauntlets.left.rot = 0.45;
    e.gauntlets.right.rot = -0.45;
  } else if (e.actionState === MONOLITH_STATES.WINDUP_WHIRL) {
    e.gauntlets.left.lift = Math.sin(frameCount * 0.25) * 12;
    e.gauntlets.right.lift = -Math.sin(frameCount * 0.25) * 12;
    e.gauntlets.left.rot += 0.25;
    e.gauntlets.right.rot += 0.25;
  } else if (e.actionState === MONOLITH_STATES.CHANNELING_SIPHON) {
    e.gauntlets.left.lift = -8;
    e.gauntlets.right.lift = -8;
    e.gauntlets.left.rot = -0.3;
    e.gauntlets.right.rot = 0.3;
  } else if (e.actionState === MONOLITH_STATES.RECOVERY) {
    e.gauntlets.left.lift = -35;
    e.gauntlets.right.lift = -35;
    e.gauntlets.left.rot = -0.6;
    e.gauntlets.right.rot = 0.6;
  } else {
    const naturalSway = Math.sin(frameCount * 0.08) * 4;
    e.gauntlets.left.lift = naturalSway;
    e.gauntlets.right.lift = -naturalSway;
    e.gauntlets.left.rot = 0.12;
    e.gauntlets.right.rot = -0.12;
  }

  // Orientação horizontal dinâmica quando livre
  if (e.actionState !== MONOLITH_STATES.POST_ATTACK_RECOVERY && e.actionState !== MONOLITH_STATES.RECOVERY && e.actionState !== MONOLITH_STATES.SPAWN_INTRO && !e.aimLocked) {
    e.facing = (player.x - e.x) >= 0 ? 1 : -1;
  }

  // 3. Atualização das Fontes Termais
  updateThermalVents(e, dt, context);

  // 4. Atualização das Orbes Orbitais (Litocistos)
  updateLitocistos(e, dt, context);

  // Redução de cooldown com orbes ativas
  const activeOrbitals = e.orbitals.filter(o => o.active);
  if (activeOrbitals.length > 0 && e.actionState === MONOLITH_STATES.CHASE) {
    e.skillCooldown -= dt * (0.10 * activeOrbitals.length);
  }

  // 5. PROGRESSÃO DE FASES (bloqueada na introdução)
  const hpRatio = e.hp / e.maxHp;

  // Fase 2: Sobrecarga Magmática (< 60% HP)
  if (e.actionState !== MONOLITH_STATES.SPAWN_INTRO && hpRatio < MONOLITH_CONFIG.P2_HP_RATIO && !e.hasTransitionedP2) {
    e.hasTransitionedP2 = true;
    e.isEnraged = true;
    e.phase = 2;
    e.speed = MONOLITH_CONFIG.ENRAGED_SPEED;
    e.orbitalAngularVelocity *= 1.35;
    e.actionState = MONOLITH_STATES.OVERHEAT_TRANSITION;
    e.actionTimer = 55;
    e.isVulnerable = false;

    triggerShake(18);
    triggerHaptic('heavy');
    playSfx('boss');
    addDamageText(e.x, e.y, "SOBRECARGA MAGMÁTICA!", true, '#e74c3c');

    for (let p = 0; p < 35; p++) {
      createHitParticles(e.x, e.y, '#e74c3c', 1);
      createHitParticles(e.x, e.y, '#f39c12', 1);
    }

    spawnLitocistos(e, MONOLITH_CONFIG.P2_ORBITAL_COUNT, MONOLITH_CONFIG.P2_ORBITAL_HP, enemies);
    return;
  }

  // Fase 3: Fusão Crítica (< 25% HP)
  if (e.actionState !== MONOLITH_STATES.SPAWN_INTRO && hpRatio < MONOLITH_CONFIG.P3_HP_RATIO && !e.isPhase3) {
    e.isPhase3 = true;
    e.phase = 3;
    e.speed = MONOLITH_CONFIG.PHASE3_SPEED;
    triggerShake(15);
    playSfx('boss');
    addDamageText(e.x, e.y, "FUSÃO CRÍTICA!", true, '#ff1744');
  }

  // Fagulhas e calor contínuo quando em fúria
  if (e.isEnraged && Math.floor(frameCount) % 5 === 0) {
    createHitParticles(
      e.x + (Math.random() - 0.5) * e.radius * 1.3,
      e.y + (Math.random() - 0.5) * e.radius * 1.3,
      e.isPhase3 ? '#ff1744' : '#e67e22',
      1
    );
  }

  // 6. MÁQUINA DE ESTADOS PRINCIPAL
  switch (e.actionState) {
    case MONOLITH_STATES.SPAWN_INTRO: {
      const introMax = e.introDuration || 300;
      e.introTimer -= dt;
      const progress = Math.min(1.0, Math.max(0, 1 - (e.introTimer / introMax)));

      e.isVulnerable = false;
      e.isTargetable = false;

      // Preenchimento contínuo de calor na barra de HP
      const hpPercent = Math.min(100, Math.round(progress * 100));
      const bossHpFill = document.getElementById('boss-hp-fill');
      if (bossHpFill) bossHpFill.style.width = `${hpPercent}%`;
      const bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
      if (bossHpGhostFill) bossHpGhostFill.style.width = `${hpPercent}%`;
      const bossHpVal = document.getElementById('boss-hp-val');
      if (bossHpVal) bossHpVal.innerText = `${hpPercent}%`;

      // ATO 1: Ruptura da Crosta Tectônica (0.00 <= progress < 0.25)
      if (progress < 0.25) {
        if (!e.hasStartedIntro) {
          e.hasStartedIntro = true;
          playSfx('charge');
        }
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(1.5 + progress * 8);
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 40 + Math.random() * 95;
          createHitParticles(
            e.x + Math.cos(pAngle) * pDist,
            e.y + Math.sin(pAngle) * (pDist * 0.45) + 48,
            '#e67e22',
            1
          );
        }
      }
      // ATO 2: Erupção e Ascensão do Colosso (0.25 <= progress < 0.55)
      else if (progress < 0.55) {
        if (!e.hasEmergedSfx) {
          e.hasEmergedSfx = true;
          playSfx('warp');
          triggerHaptic('heavy');
        }
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(3.5 + Math.sin(progress * 10) * 2.0);
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 30 + Math.random() * 70;
          createHitParticles(e.x + Math.cos(pAngle) * pDist, e.y + 48, '#d35400', 2);
          createHitParticles(e.x, e.y + 20, '#f39c12', 1);
        }
      }
      // ATO 3: Ejeção dos Litocistos e Ignição do Núcleo (0.55 <= progress < 0.80)
      else if (progress < 0.80) {
        if (!e.hasTriggeredTitle && progress >= 0.58) {
          e.hasTriggeredTitle = true;
          e.titleTimer = e.titleMaxTimer || 180;
          playSfx('forcefield');
          triggerHaptic('medium');
        }
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(3.0 + Math.sin(progress * 8) * 1.5);
          createHitParticles(
            e.x + (Math.random() - 0.5) * e.radius * 2.0,
            e.y + (Math.random() - 0.5) * e.radius * 1.5,
            '#e67e22',
            1
          );
        }
      }
      // ATO 4: Impacto Telúrico das Manoplas e Despertar (0.80 <= progress <= 1.00)
      else {
        // Impacto sísmico sincronizado com a queda violenta das manoplas (aos 93% da intro)
        if (progress >= 0.93 && !e.hasRoared) {
          e.hasRoared = true;
          playSfx('boss');
          triggerShake(24);
          triggerHaptic('heavy');
          addDamageText(e.x, e.y - 50, "DESPERTAR TELÚRICO!", true, '#e67e22');

          if (Array.isArray(bossShockwaves)) {
            bossShockwaves.push({
              x: e.x,
              y: e.y + 28,
              radius: 20,
              maxRadius: 360,
              speed: 9.5,
              damage: 0,
              colorRgb: '230, 126, 34',
              hitPlayer: false
            });
          }

          for (let p = 0; p < 45; p++) {
            const rAng = Math.random() * Math.PI * 2;
            const rDist = 20 + Math.random() * 180;
            createHitParticles(e.x + Math.cos(rAng) * rDist, e.y + Math.sin(rAng) * rDist + 20, '#e67e22', 2);
            createHitParticles(e.x + Math.cos(rAng) * rDist, e.y + Math.sin(rAng) * rDist + 20, '#f39c12', 1);
            createHitParticles(e.x, e.y + 20, '#ffffff', 1);
          }
        } else if (!e.hasRoared && Math.floor(frameCount) % 3 === 0) {
          triggerShake(2.5);
          createHitParticles(e.x - 62, e.y - 40, '#ff7675', 1);
          createHitParticles(e.x + 62, e.y - 40, '#ff7675', 1);
        }
      }

      if (e.introTimer <= 0) {
        e.isTargetable = true;
        if (e.orbitals) {
          e.orbitals.forEach(o => { o.isTargetable = true; });
        }

        const activeRemaining = e.orbitals ? e.orbitals.filter(item => item.active).length : 0;
        if (e.pendingCollapse || activeRemaining === 0) {
          e.pendingCollapse = false;
          e.actionState = MONOLITH_STATES.RECOVERY;
          e.recoveryTimer = MONOLITH_CONFIG.RECOVERY_DURATION; // 4.5 segundos
          e.isVulnerable = true;

          triggerShake(16);
          triggerHaptic('heavy');
          playSfx('boss');
          addDamageText(e.x, e.y, "COLAPSO SÍSMICO!", true, '#f1c40f');
        } else {
          e.actionState = MONOLITH_STATES.CHASE;
          e.isVulnerable = false;
          e.skillCooldown = 45;
          triggerShake(8);
          playSfx('crit');
        }
      }
      return;
    }

    case MONOLITH_STATES.OVERHEAT_TRANSITION: {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 4 === 0) triggerShake(3.5);
      if (e.actionTimer <= 0) {
        e.actionState = MONOLITH_STATES.CHASE;
        e.skillCooldown = 28;
      }
      return;
    }

    // Colapso Sísmico (Stun de 4.5s após quebrar todos os Litocistos)
    case MONOLITH_STATES.RECOVERY: {
      e.recoveryTimer -= dt;
      e.isVulnerable = true;
      e.isTargetable = true;

      if (Math.floor(frameCount) % 6 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius,
          e.y + (Math.random() - 0.5) * e.radius,
          '#f1c40f',
          1
        );
      }

      if (e.recoveryTimer <= 0) {
        e.isVulnerable = false;
        e.isTargetable = true;
        e.actionState = MONOLITH_STATES.CHASE;
        e.skillCooldown = e.isEnraged ? 35 : 45;

        triggerShake(10);
        playSfx('boss');
        addDamageText(e.x, e.y, "SISTEMA RESTAURADO!", true, '#3498db');
      }
      return;
    }

    // Recuperação Pós-Ataque (Calibrada para 32-38 frames: punição justa sem deixar o boss inerte)
    case MONOLITH_STATES.POST_ATTACK_RECOVERY: {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 7 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius,
          e.y + (Math.random() - 0.5) * e.radius,
          '#f39c12',
          1
        );
      }
      if (e.actionTimer <= 0) {
        e.actionState = MONOLITH_STATES.CHASE;
        e.skillCooldown = e.isPhase3 ? 26 : (e.isEnraged ? 34 : 42);
        e.aimLocked = false;
      }
      return;
    }

    // ==========================================
    // SKILL 1: ESMAGAMENTO TECTÔNICO (TECTONIC SLAM)
    // ==========================================
    case MONOLITH_STATES.WINDUP_SLAM: {
      e.actionTimer -= dt;

      // Trava a mira nos últimos 16 frames dando tempo de correr para as costas
      const lockThreshold = e.isEnraged ? 14 : 18;
      if (e.actionTimer > lockThreshold) {
        e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
        e.aimLocked = false;
      } else {
        e.aimLocked = true;
      }

      if (Math.floor(frameCount) % 3 === 0) {
        const sparkDist = 30 + Math.random() * 85;
        createHitParticles(
          e.x + Math.cos(e.aimAngle) * sparkDist,
          e.y + Math.sin(e.aimAngle) * sparkDist,
          '#ff4757',
          1
        );
      }

      if (e.actionTimer <= 0) {
        executeTectonicSlam(e, context);
      }
      return;
    }

    // ==========================================
    // SKILL 2: ERUPÇÃO DO EPICENTRO & ONDA DE FENDAS
    // ==========================================
    case MONOLITH_STATES.WINDUP_EPICENTER: {
      e.actionTimer -= dt;

      // Solo sob o chefe acumulando calor sob pressão
      if (Math.floor(frameCount) % 3 === 0) {
        const r = Math.random() * 105;
        const a = Math.random() * Math.PI * 2;
        createHitParticles(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, '#e74c3c', 1);
      }

      if (e.actionTimer <= 0) {
        executeEpicenterEruption(e, context);
      }
      return;
    }

    case MONOLITH_STATES.PROPAGATING_SURGE: {
      e.actionTimer -= dt;

      // A energia corre pelas fraturas do solo em direção ao anel externo
      if (Math.floor(frameCount) % 3 === 0) {
        const ringR = 150 + Math.random() * 90;
        const ang = Math.random() * Math.PI * 2;
        createHitParticles(e.x + Math.cos(ang) * ringR, e.y + Math.sin(ang) * ringR, '#f39c12', 1);
      }

      if (e.actionTimer <= 0) {
        executeOuterSurge(e, context);
      }
      return;
    }

    // ==========================================
    // SKILL 3: VARREDURA DE PLACAS 360° (PLATE WHIRL)
    // ==========================================
    case MONOLITH_STATES.WINDUP_WHIRL: {
      e.actionTimer -= dt;

      if (Math.floor(frameCount) % 3 === 0) {
        const wAng = Math.random() * Math.PI * 2;
        createHitParticles(e.x + Math.cos(wAng) * 95, e.y + Math.sin(wAng) * 95, '#ff4757', 1);
      }

      if (e.actionTimer <= 0) {
        executePlateWhirl(e, context);
      }
      return;
    }

    // ==========================================
    // SKILL 4: VÓRTICE DA CALDEIRA (MAGMA SIPHON)
    // ==========================================
    case MONOLITH_STATES.CHANNELING_SIPHON: {
      e.pullTimer -= dt;

      const pdx = e.x - player.x;
      const pdy = e.y - player.y;
      const pDist = Math.hypot(pdx, pdy);

      if (pDist > 45 && pDist < 1500) {
        const pullForce = (e.isEnraged ? 0.95 : 0.80) * dt;
        player.x += (pdx / pDist) * pullForce;
        player.y += (pdy / pDist) * pullForce;
      }

      if (Math.floor(frameCount) % 2 === 0) {
        triggerShake(1.2);
        const pAngle = Math.random() * Math.PI * 2;
        const spawnDist = 200 + Math.random() * 1000;
        createHitParticles(
          e.x + Math.cos(pAngle) * spawnDist,
          e.y + Math.sin(pAngle) * spawnDist,
          '#d35400',
          1
        );
      }

      if (e.pullTimer <= 0) {
        executeMagmaSiphonRelease(e, context);
      }
      return;
    }

    // ==========================================
    // SKILL 5 & 6: FENDAS E ARTILHARIA
    // ==========================================
    case MONOLITH_STATES.WINDUP_FISSURE: {
      e.actionTimer -= dt;
      if (e.actionTimer > 12) {
        e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
      }
      if (Math.floor(frameCount) % 3 === 0) {
        const stepDist = 40 + Math.random() * 640;
        createHitParticles(e.x + Math.cos(e.aimAngle) * stepDist, e.y + Math.sin(e.aimAngle) * stepDist, '#e67e22', 1);
      }
      if (e.actionTimer <= 0) {
        executeVolcanicFissure(e, context);
      }
      return;
    }

    case MONOLITH_STATES.WINDUP_BARRAGE: {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 3 === 0) {
        createHitParticles(e.x + (Math.random() - 0.5) * 40, e.y - 20 - Math.random() * 30, '#ff7675', 1);
      }
      if (e.actionTimer <= 0) {
        executeBasaltBarrage(e, context);
      }
      return;
    }

    // ==========================================
    // ESTADO BASE: PERSEGUIÇÃO
    // ==========================================
    case MONOLITH_STATES.CHASE:
    default: {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      let curSpeed = e.speed;
      if (e.slowTimer > 0) curSpeed *= (1 - 0.18);

      if (dist > 75) {
        const angle = Math.atan2(dy, dx);
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
      }

      e.skillCooldown -= dt;
      if (e.skillCooldown <= 0) {
        selectNextSkill(e, dist);
      }
      break;
    }
  }

  // 7. Salvaguarda Invariante: Fora da introdução cinematográfica, o chefe deve permanecer sempre alvejável
  if (e.actionState !== MONOLITH_STATES.SPAWN_INTRO) {
    e.isTargetable = true;
  }
}
