/**
 * src/entities/bosses/supremeReaper/fsm.js
 * Máquina de estados FSM, progressão de fases e ciclo de vida do Ceifador Supremo.
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { enemies, canSpawnEnemyBullet } from '../../../main.js';
import { REAPER_STATES, REAPER_CONFIG } from './constants.js';
import { 
  updateReaperLanterns, 
  spawnReaperLanterns, 
  updateSoulTether, 
  updateDelayedActions 
} from './mechanics.js';
import { 
  selectReaperSkill, 
  executeReaperSkill 
} from './attacks.js';

/**
 * Verifica e aciona transições de fase com base no HP restante do Ceifador.
 * @param {Object} e Entidade do chefe.
 * @param {Object} context Contexto global injetado do loop.
 */
export function checkReaperPhases(e, context) {
  if (e.actionState === REAPER_STATES.SPAWN_INTRO) return;

  const hpRatio = e.hp / e.maxHp;

  if (hpRatio < REAPER_CONFIG.ENRAGE_HP_RATIO && !e.hasEnraged) {
    e.hasEnraged = true;
    e.isEnraged = true;
    e.speed *= 1.32;
    e.lanternAngularSpeed *= 1.5;
    e.actionState = REAPER_STATES.ENRAGE_TRANSITION;
    e.actionTimer = 65;
    e.isVulnerable = false;
    e.collapseProgress = 0;

    context.triggerShake(18);
    triggerHaptic('heavy');
    playSfx('boss');
    context.addDamageText(e.x, e.y, "DESPERTAR DA CEIFA!", true, '#e74c3c');

    context.bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 18,
      maxRadius: 340,
      speed: 6.5,
      damage: Math.round(e.damage * 0.42),
      colorRgb: '255, 71, 87',
      hitPlayer: false
    });

    // Respawn da Fase de Fúria calibrado para 4.800 HP
    spawnReaperLanterns(e, REAPER_CONFIG.P2_LANTERN_COUNT, REAPER_CONFIG.P2_LANTERN_HP, enemies);
    return;
  }

  if (hpRatio < REAPER_CONFIG.PHASE3_HP_RATIO && !e.isPhase3) {
    e.isPhase3 = true;
    e.speed *= 1.20;
    e.lanternAngularSpeed *= 1.4;
    context.triggerShake(20);
    playSfx('boss');
    context.addDamageText(e.x, e.y, "DANÇA MACABRA!", true, '#ff4757');
  }
}

/**
 * Atualiza a IA, colisões, interpolações procedurais e padrões de ataque do Ceifador Supremo.
 * @param {Object} e Entidade do chefe.
 * @param {number} dt Delta time do frame.
 * @param {Object} context Contexto global injetado do loop.
 */
export function updateSupremeReaper(e, dt, context) {
  const {
    player,
    frameCount,
    enemyBullets,
    bossTelegraphs,
    bossShockwaves,
    triggerShake,
    createHitParticles,
    addDamageText
  } = context;

  // 1. Processamento de Ações Agendadas
  updateDelayedActions(e, dt);

  // 2. Gerenciamento do Banner de Título Cinematográfico
  if (e.titleTimer > 0) {
    e.titleTimer -= dt;
  }

  // 3. Gestão de Pós-Imagens Espectrais (Afterimages)
  if (e.afterImages && e.afterImages.length > 0) {
    for (let ai = e.afterImages.length - 1; ai >= 0; ai--) {
      e.afterImages[ai].life -= dt;
      if (e.afterImages[ai].life <= 0) {
        e.afterImages.splice(ai, 1);
      }
    }
  }

  // 4. Gestão dos Rastros de Luz dos Olhos (Eye Trails)
  if (!e.eyeTrails) e.eyeTrails = [];
  if (e.actionState !== REAPER_STATES.SPAWN_INTRO || (e.introTimer && e.introTimer < 180)) {
    if (Math.floor(frameCount) % 2 === 0) {
      e.eyeTrails.push({
        x: e.x,
        y: e.y + (e.floatBob || 0) - (e.isVulnerable ? 12 : 36),
        facing: e.facing,
        life: 18,
        maxLife: 18,
        isEnraged: e.isEnraged || e.isPhase3
      });
      if (e.eyeTrails.length > 22) e.eyeTrails.shift();
    }
  }
  for (let et = e.eyeTrails.length - 1; et >= 0; et--) {
    e.eyeTrails[et].life -= dt;
    if (e.eyeTrails[et].life <= 0) e.eyeTrails.splice(et, 1);
  }

  // 5. Flutuação e Dinâmica Espectral
  e.floatBob = Math.sin(frameCount * 0.065) * 8;
  e.floatY = e.floatBob;
  
  if (
    e.actionState !== REAPER_STATES.POST_ATTACK_RECOVERY && 
    e.actionState !== REAPER_STATES.RECOVERY && 
    e.actionState !== REAPER_STATES.SPAWN_INTRO
  ) {
    e.facing = (player.x - e.x) > 0 ? 1 : -1;
  }
  e.eyePulse = (Math.sin(frameCount * (e.isEnraged ? 0.22 : 0.12)) + 1) * 0.5;

  // 6. Inércia de Inclinação e Bater de Asas
  if (e.actionState === REAPER_STATES.CHASE) {
    const dx = player.x - e.x;
    e.tiltTarget = Math.max(-0.22, Math.min(0.22, dx * 0.0012));
    e.wingFlap = Math.sin(frameCount * (e.isEnraged ? 0.16 : 0.10)) * 0.15;
  } else {
    e.tiltTarget = 0;
    e.wingFlap = Math.sin(frameCount * 0.08) * 0.08;
  }
  e.tilt = (e.tilt || 0) + ((e.tiltTarget || 0) - (e.tilt || 0)) * 0.12 * dt;

  e.wingSpan += (e.wingTargetSpan - e.wingSpan) * 0.14 * dt;
  e.scytheAngle += (e.scytheTargetAngle - e.scytheAngle) * 0.18 * dt;

  // 6.1 Inércia Física da Manivela Inferior da Foice
  const dtSafe = Math.min(Math.max(dt, 0.1), 2.5);
  const dScytheAngle = e.scytheAngle - (e.prevScytheAngle !== undefined ? e.prevScytheAngle : e.scytheAngle);
  e.prevScytheAngle = e.scytheAngle;

  const bossDx = e.x - (e.prevBossX !== undefined ? e.prevBossX : e.x);
  const bossDy = e.y - (e.prevBossY !== undefined ? e.prevBossY : e.y);
  e.prevBossX = e.x;
  e.prevBossY = e.y;

  const angularInertiaTorque = -dScytheAngle * 2.2;
  const linearInertiaTorque = -bossDx * 0.025 * (e.facing || 1);
  const idleSway = Math.sin(frameCount * 0.06) * 0.008;
  const springTorque = -0.20 * (e.crankAngle || 0);

  const totalTorque = springTorque + angularInertiaTorque + linearInertiaTorque + idleSway;
  e.crankVelocity = ((e.crankVelocity || 0) + totalTorque) * Math.pow(0.86, dtSafe);
  e.crankAngle = (e.crankAngle || 0) + e.crankVelocity * dtSafe;

  // Limitar amplitude angular para manter anatomia da arma coerente (-66° a +66°)
  if (e.crankAngle > 1.15) {
    e.crankAngle = 1.15;
    e.crankVelocity *= 0.5;
  } else if (e.crankAngle < -1.15) {
    e.crankAngle = -1.15;
    e.crankVelocity *= 0.5;
  }

  // 7. Rastro Fantasma de Movimentação
  if (Math.floor(frameCount) % 3 === 0 && e.actionState !== REAPER_STATES.SPAWN_INTRO) {
    e.ghostTrail.unshift({
      x: e.x,
      y: e.y + e.floatBob,
      alpha: e.isPhase3 ? 0.65 : 0.40,
      enraged: e.isEnraged || e.isPhase3
    });
    if (e.ghostTrail.length > 8) e.ghostTrail.pop();
  }
  for (let i = e.ghostTrail.length - 1; i >= 0; i--) {
    e.ghostTrail[i].alpha -= 0.018 * dt;
    if (e.ghostTrail[i].alpha <= 0) e.ghostTrail.splice(i, 1);
  }

  // FASE 5: Buff Ofensivo baseado nas Lanternas (absorção passiva de 70% removida)
  const activeLanterns = e.lanterns ? e.lanterns.filter(l => l.active) : [];
  if (activeLanterns.length > 0 && e.actionState === REAPER_STATES.CHASE) {
    e.skillCooldown -= dt * (0.20 * activeLanterns.length);
  }

  updateReaperLanterns(e, dt, context);
  checkReaperPhases(e, context);
  updateSoulTether(e, dt, context);

  // MÁQUINA DE ESTADOS PRINCIPAL
  switch (e.actionState) {
    // -----------------------------------------------------------------------
    // INTRODUÇÃO CINEMÁTICA EM 4 ATOS (300 FRAMES / 5.0 SEGUNDOS)
    // -----------------------------------------------------------------------
    case REAPER_STATES.SPAWN_INTRO: {
      e.introTimer -= dt;
      const introMax = e.introDuration || 300;
      const progress = Math.max(0, Math.min(1, 1 - (e.introTimer / introMax)));

      // Preenchimento cinematográfico contínuo da barra de HP (0% a 100%)
      const hpPercent = Math.min(100, Math.round(progress * 100));
      const bossHpFill = document.getElementById('boss-hp-fill');
      if (bossHpFill) bossHpFill.style.width = `${hpPercent}%`;
      const bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
      if (bossHpGhostFill) bossHpGhostFill.style.width = `${hpPercent}%`;
      const bossHpVal = document.getElementById('boss-hp-val');
      if (bossHpVal) bossHpVal.innerText = `${hpPercent}%`;

      // ATO 1: O Frio Sepulcral & Fenda no Véu (0.00 <= progress < 0.24, frames 0-72)
      if (progress < 0.24) {
        e.introAct = 1;
        e.wingTargetSpan = 0.15;
        e.scytheTargetAngle = 0.6;
        if (Math.floor(e.introTimer) === Math.floor(introMax - 4)) {
          playSfx('charge');
        }
        if (Math.floor(frameCount) % 4 === 0) {
          triggerShake(1.2 + progress * 5);
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 60 + Math.random() * 110;
          createHitParticles(
            e.x + Math.cos(pAngle) * pDist,
            e.y + Math.sin(pAngle) * pDist,
            '#00cec9',
            1
          );
        }
      } 
      // ATO 2: Convocação das Lanternas & Gaiolas de Almas (0.24 <= progress < 0.50, frames 72-150)
      else if (progress < 0.50) {
        e.introAct = 2;
        e.wingTargetSpan = 0.40;
        e.scytheTargetAngle = 0.2;
        if (Math.floor(e.introTimer) === Math.floor(introMax * 0.76)) {
          playSfx('warp');
          triggerHaptic('medium');
        }
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(2.0 + Math.sin(progress * 10) * 2);
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 30 + Math.random() * 75;
          createHitParticles(e.x + Math.cos(pAngle) * pDist, e.y + Math.sin(pAngle) * pDist, '#81ecec', 2);
          createHitParticles(e.x, e.y, '#00cec9', 1);
        }
      } 
      // ATO 3: Desdobrar do Serafim da Morte & Banner Imperial (0.50 <= progress < 0.76, frames 150-228)
      else if (progress < 0.76) {
        e.introAct = 3;
        e.wingTargetSpan = 1.25;
        e.scytheTargetAngle = -0.5;
        if (!e.hasTriggeredTitle) {
          e.hasTriggeredTitle = true;
          e.titleTimer = e.titleMaxTimer || 180;
          playSfx('forcefield');
          triggerHaptic('medium');
        }
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(2.5 + Math.sin(progress * 12) * 2);
          createHitParticles(
            e.x + (Math.random() - 0.5) * e.radius * 2.4,
            e.y + (Math.random() - 0.5) * e.radius * 2.4,
            '#00cec9',
            2
          );
        }
      } 
      // ATO 4: Golpe do Julgamento & Onda de Choque (0.76 <= progress <= 1.00, frames 228-300)
      else {
        e.introAct = 4;
        e.wingTargetSpan = 1.45;
        e.scytheTargetAngle = 1.3 * e.facing;
        if (!e.hasRoared) {
          e.hasRoared = true;
          playSfx('boss');
          triggerShake(18);
          triggerHaptic('heavy');
          addDamageText(e.x, e.y - 50, "A MORTE É O SEU DESTINO!", true, '#00cec9');

          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 20,
            maxRadius: 340,
            speed: 8.5,
            damage: 0,
            colorRgb: '0, 206, 201',
            hitPlayer: false
          });

          for (let p = 0; p < 36; p++) {
            const rAng = Math.random() * Math.PI * 2;
            const rDist = 20 + Math.random() * 150;
            createHitParticles(e.x + Math.cos(rAng) * rDist, e.y + Math.sin(rAng) * rDist, '#00cec9', 2);
          }
        }

        if (Math.floor(frameCount) % 2 === 0) {
          triggerShake(3.5);
          createHitParticles(e.x, e.y, '#ffffff', 2);
          createHitParticles(e.x, e.y, '#81ecec', 2);
        }
      }

      if (e.introTimer <= 0) {
        e.isTargetable = true;
        if (e.lanterns) {
          e.lanterns.forEach(l => { l.isTargetable = true; });
        }
        const finalHpFill = document.getElementById('boss-hp-fill');
        if (finalHpFill) finalHpFill.style.width = '100%';
        const finalHpGhostFill = document.getElementById('boss-hp-ghost-fill');
        if (finalHpGhostFill) finalHpGhostFill.style.width = '100%';
        const finalHpVal = document.getElementById('boss-hp-val');
        if (finalHpVal) finalHpVal.innerText = '100%';

        const activeCount = e.lanterns ? e.lanterns.filter(o => o.active).length : 0;
        if (e.pendingCollapse || activeCount === 0) {
          e.pendingCollapse = false;
          e.actionState = REAPER_STATES.RECOVERY;
          e.recoveryTimer = REAPER_CONFIG.RECOVERY_DURATION;
          e.isVulnerable = true;
          triggerShake(16);
          triggerHaptic('heavy');
          playSfx('boss');
          addDamageText(e.x, e.y, "COLAPSO ESPIRITUAL (6.0s)!", true, '#81ecec');
        } else {
          e.actionState = REAPER_STATES.CHASE;
          e.skillCooldown = 75;
        }
      }
      return;
    }

    case REAPER_STATES.ENRAGE_TRANSITION: {
      e.actionTimer -= dt;
      e.wingTargetSpan = 1.40;
      e.scytheTargetAngle = 1.2 * e.facing;
      if (Math.floor(frameCount) % 3 === 0) triggerShake(3.5);
      if (e.actionTimer <= 0) {
        e.actionState = REAPER_STATES.CHASE;
        e.skillCooldown = 25;
      }
      return;
    }

    // Janela de Exaustão de 6.0 segundos após quebra de todas as lanternas (Prostração de Joelhos)
    case REAPER_STATES.RECOVERY: {
      e.recoveryTimer -= dt;
      e.isVulnerable = true;
      e.isTargetable = true;
      e.wingTargetSpan = 0.12;
      e.scytheTargetAngle = 1.1;
      e.collapseProgress = Math.min(1, (e.collapseProgress || 0) + 0.08 * dt);

      if (Math.floor(frameCount) % 5 === 0) {
        createHitParticles(e.x + (Math.random() - 0.5) * e.radius, e.y + (Math.random() - 0.5) * e.radius, '#81ecec', 1);
      }

      if (e.recoveryTimer <= 0) {
        e.isVulnerable = false;
        e.isTargetable = true;
        e.collapseProgress = 0;
        e.actionState = REAPER_STATES.CHASE;
        e.skillCooldown = e.isEnraged ? 40 : 65;

        triggerShake(14);
        playSfx('boss');
        addDamageText(e.x, e.y, "RECONSTITUIÇÃO ESPIRITUAL!", true, '#00cec9');
      }
      return;
    }

    // Janela de Recuperação Pós-Ataque (70 frames: punição melee)
    case REAPER_STATES.POST_ATTACK_RECOVERY: {
      e.actionTimer -= dt;
      e.wingTargetSpan = 0.35;
      e.scytheTargetAngle = 0.7;

      if (Math.floor(frameCount) % 8 === 0) {
        createHitParticles(e.x + (Math.random() - 0.5) * e.radius, e.y + (Math.random() - 0.5) * e.radius, '#81ecec', 1);
      }
      if (e.actionTimer <= 0) {
        e.actionState = REAPER_STATES.CHASE;
        e.skillCooldown = e.isEnraged ? 40 : 60;
      }
      return;
    }

    case REAPER_STATES.BLINK_AIM: {
      e.actionTimer -= dt;
      e.wingTargetSpan = 0.12;

      if (Math.floor(frameCount) % 3 === 0 && e.blinkTarget) {
        createHitParticles(e.blinkTarget.x, e.blinkTarget.y, '#00cec9', 2);
        createHitParticles(e.x, e.y, '#00cec9', 1);
      }

      if (e.actionTimer <= 0 && e.blinkTarget) {
        playSfx('boss');
        triggerShake(10);
        triggerHaptic('heavy');

        // Cria pós-imagem na posição de saída
        if (e.afterImages) {
          e.afterImages.push({
            x: e.x,
            y: e.y,
            alpha: 0.7,
            life: 25,
            maxLife: 25,
            facing: e.facing
          });
        }

        createHitParticles(e.x, e.y, '#00cec9', 15);
        e.x = e.blinkTarget.x;
        e.y = e.blinkTarget.y;
        createHitParticles(e.x, e.y, '#00cec9', 18);

        const sideAng = e.blinkTarget.angle + Math.PI * 0.5;
        e.phantoms = [
          { x: e.x + Math.cos(sideAng) * 60, y: e.y + Math.sin(sideAng) * 60, life: 25 },
          { x: e.x - Math.cos(sideAng) * 60, y: e.y - Math.sin(sideAng) * 60, life: 25 }
        ];

        bossTelegraphs.push({
          type: 'SCYTHE_CLEAVE',
          x: e.x,
          y: e.y,
          radius: 170,
          angle: e.blinkTarget.cleaveAngle,
          timer: e.isEnraged ? 28 : 34,
          maxTimer: e.isEnraged ? 28 : 34,
          damage: Math.round(e.damage * 0.55),
          color: '#00cec9',
          colorRgb: '0, 206, 201',
          boss: e
        });

        e.blinkTarget = null;
        e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
        e.actionTimer = 65;
      }
      return;
    }

    case REAPER_STATES.VORTEX_HARVEST: {
      e.actionTimer -= dt;
      e.wingTargetSpan = 1.25;
      e.scytheTargetAngle = 0;

      const pdx = e.x - player.x;
      const pdy = e.y - player.y;
      const pDist = Math.hypot(pdx, pdy);

      if (pDist > 40 && pDist < 360) {
        const pull = (e.isEnraged ? 1.20 : 0.90) * dt;
        player.x += (pdx / pDist) * pull;
        player.y += (pdy / pDist) * pull;
      }

      if (Math.floor(frameCount) % 5 === 0) {
        triggerShake(1.8);
        createHitParticles(player.x, player.y, '#00cec9', 1);
      }

      if (e.actionTimer <= 0) {
        triggerShake(16);
        triggerHaptic('heavy');
        playSfx('boss');

        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 18,
          maxRadius: 330,
          speed: 6.5,
          damage: Math.round(e.damage * 0.55),
          colorRgb: '0, 206, 201',
          hitPlayer: false
        });

        const bladeCount = e.isEnraged ? 16 : 12;
        const spawnDist = 80;
        for (let s = 0; s < bladeCount; s++) {
          if (!canSpawnEnemyBullet(true)) break;
          const sAng = (s * Math.PI * 2) / bladeCount;
          enemyBullets.push({
            x: e.x + Math.cos(sAng) * spawnDist,
            y: e.y + Math.sin(sAng) * spawnDist,
            vx: Math.cos(sAng) * 4.6,
            vy: Math.sin(sAng) * 4.6,
            radius: 7,
            damage: Math.round(e.damage * 0.28),
            life: 120,
            isBossProjectile: true
          });
        }

        e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
        e.actionTimer = 70;
      }
      return;
    }

    case REAPER_STATES.WINDUP: {
      e.actionTimer -= dt;

      if (e.actionTimer > (e.isEnraged ? 8 : 14)) {
        e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
      }

      if (e.currentSkill === 'DOUBLE_CLEAVE') {
        e.wingTargetSpan = 1.35;
        e.scytheTargetAngle = -1.5 * e.facing;
      } else if (e.currentSkill === 'SOUL_SCYTHES') {
        e.wingTargetSpan = 0.90;
        e.scytheTargetAngle = frameCount * 0.25;
      } else if (e.currentSkill === 'VORTEX_HARVEST') {
        e.wingTargetSpan = 0.25;
        e.scytheTargetAngle = Math.PI * 0.5;
      }

      if (Math.floor(frameCount) % 3 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 1.4,
          e.y + (Math.random() - 0.5) * e.radius * 1.4,
          e.isEnraged ? '#ff4757' : '#00cec9',
          1
        );
      }

      if (e.actionTimer <= 0) {
        executeReaperSkill(e, context);
      }
      return;
    }

    case REAPER_STATES.CHASE:
    default: {
      e.wingTargetSpan = 0.60;
      e.scytheTargetAngle = -0.3;

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      let curSpeed = e.speed;
      if (activeLanterns.length > 0) curSpeed *= (1 + 0.10 * activeLanterns.length);
      if (e.slowTimer > 0) curSpeed *= (1 - 0.18);

      if (dist > 85) {
        const angle = Math.atan2(dy, dx);
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
      }

      e.skillCooldown -= dt;
      if (e.skillCooldown <= 0) {
        selectReaperSkill(e, dist, player);
      }
      break;
    }
  }

  // Salvaguarda Invariante: Fora da introdução cinematográfica, o chefe deve permanecer sempre alvejável
  if (e.actionState !== REAPER_STATES.SPAWN_INTRO) {
    e.isTargetable = true;
  }
}
