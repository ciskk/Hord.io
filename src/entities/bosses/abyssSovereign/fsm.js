/**
 * src/entities/bosses/abyssSovereign/fsm.js
 * Máquina de Estados FSM, transições com micro-windup e estabilidade do Soberano do Abismo.
 */
import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { SOVEREIGN_STATES, SOVEREIGN_CONFIG } from './constants.js';
import { 
  bullets, 
  enemyBullets, 
  bossShockwaves, 
  bossTelegraphs,
  canSpawnEnemyBullet 
} from '../../../main.js';
import { 
  scheduleDelayedAction, 
  updateDelayedActions, 
  clampBossToArena, 
  cleanupRiftAnchors, 
  spawnRiftAnchors, 
  updateEventHorizon, 
  updateSingularityPhysics, 
  updateAnchors, 
  updateTentaclePhysics, 
  updateActiveAttacks,
  updateHealingZones 
} from './physics.js';
import { prepareNextAttack, startSkillCast } from './attacks.js';

export function triggerStabilityBreak(boss, context) {
  const { triggerShake, addDamageText, createHitParticles } = context;

  boss.actionState = SOVEREIGN_STATES.RECOVERY_STAGGER;
  boss.staggerTimer = 180;
  boss.isStaggered = true;
  boss.isVulnerable = true;
  boss.staggerGauge = 0;

  boss.windupTimer = 0;
  boss.castDuration = 0;
  boss.currentSkill = null;

  playSfx('shatter');
  triggerShake(16);
  triggerHaptic('heavy');
  createHitParticles(boss.x, boss.y, '#ffffff', 28);
  createHitParticles(boss.x, boss.y, '#a29bfe', 20);
  addDamageText(boss.x, boss.y - boss.radius - 22, "COLAPSO DE ESTABILIDADE!", true, '#f1c40f');
}

/**
 * Gatilho de Transição de Fase (70% e 30% HP).
 * Agora implementa um micro-windup de 40 frames (~0.66s) com sucção de partículas e telegrafia de implosão,
 * seguido por uma onda de repulsão radial firme com dano 0 (afasta o jogador sem arrancar HP injustamente).
 */
export function triggerPhaseTransition(boss, nextPhase, context) {
  const { triggerShake, addDamageText } = context;

  boss.phase = nextPhase;
  boss.actionState = SOVEREIGN_STATES.PHASE_TRANSITION;
  boss.transitionTimer = 90;
  boss.transitionWindup = 40; // Micro-windup de 40 frames (~0.66s) para tempo de reação
  boss.transitionDetonated = false;
  boss.staggerGauge = 0;
  boss.isVulnerable = false;
  boss.isStaggered = false;

  boss.windupTimer = 0;
  boss.castDuration = 0;
  boss.currentSkill = null;

  // Limpeza imediata de projéteis ao redor para clareza visual
  const clearRadiusSq = 450 * 450;
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const dx = b.x - boss.x;
    const dy = b.y - boss.y;
    if (dx * dx + dy * dy < clearRadiusSq) {
      bullets.splice(i, 1);
    }
  }

  // Telegrafia de Implosão Inicial: som de carga e leve tremor
  playSfx('charge');
  triggerShake(8);
  triggerHaptic('medium');

  if (nextPhase === 2) {
    boss.isEnraged = true;
    boss.speed *= 1.25;
    boss.targetArenaRadius = 520;
    addDamageText(boss.x, boss.y - boss.radius - 20, "FRATURA DO HORIZONTE!", true, '#e84393');
  } else if (nextPhase === 3) {
    playSfx('singularity');
    boss.speed *= 1.15;
    boss.targetArenaRadius = 380;
    addDamageText(boss.x, boss.y - boss.radius - 20, "SINGULARIDADE PRIMORDIAL!", true, '#00cec9');
    cleanupRiftAnchors(boss);
  }
}

export function updateAbyssSovereign(e, dt, context) {
  if (e.hp <= 0 && e.actionState !== SOVEREIGN_STATES.DEATH_COLLAPSE) {
    cleanupRiftAnchors(e);
    return;
  }

  const {
    player,
    frameCount,
    triggerShake,
    createHitParticles,
    addDamageText
  } = context;

  // Lógica Especial da Sequência Cinematográfica de Derrota
  if (e.actionState === SOVEREIGN_STATES.DEATH_COLLAPSE) {
    cleanupRiftAnchors(e);
    if (e.healingZones) e.healingZones.length = 0;
    e.isTargetable = false;
    e.isVulnerable = false;
    e.windupTimer = 0;
    e.castDuration = 0;
    e.currentSkill = null;
    if (player) player.iFrames = 999999;

    e.defeatTimer = (e.defeatTimer !== undefined ? e.defeatTimer : 540) - dt;
    const maxDefeat = e.defeatMaxTimer || 540;
    const progress = Math.min(1.0, Math.max(0, 1 - (e.defeatTimer / maxDefeat)));
    e.defeatProgress = progress;

    // Atualiza física dos tentáculos durante o colapso
    updateTentaclePhysics(e, dt);

    // ATO 1: Fratura Fatal & Desestabilização (0.00 <= progress < 0.25)
    if (progress < 0.25) {
      if (!e.hasTriggeredDefeatShatter) {
        e.hasTriggeredDefeatShatter = true;
        playSfx('shatter');
        playSfx('crit');
        triggerShake(26);
        triggerHaptic('heavy');
        addDamageText(e.x, e.y - e.radius - 24, "COLAPSO DO VÁZIO!", true, '#f1c40f');
      }

      e.x += (Math.random() - 0.5) * 2.5;
      e.y += (Math.random() - 0.5) * 2.5;

      if (Math.floor(frameCount) % 3 === 0) {
        triggerShake(2.0 + progress * 8);
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 1.5,
          e.y + (Math.random() - 0.5) * e.radius * 1.5,
          Math.random() < 0.5 ? '#ffffff' : '#e84393',
          3
        );
      }
    }
    // ATO 2: Implosão Gravitacional de Vácuo (0.25 <= progress < 0.55)
    else if (progress < 0.55) {
      if (!e.hasTriggeredDefeatImplosion) {
        e.hasTriggeredDefeatImplosion = true;
        playSfx('singularity');
        playSfx('charge');
        triggerShake(18);
        triggerHaptic('heavy');
        addDamageText(e.x, e.y - e.radius - 20, "IMPLOSÃO GRAVITACIONAL", true, '#00cec9');
      }

      const act2Prog = (progress - 0.25) / 0.30;
      triggerShake(2.0 + act2Prog * 9);

      if (Math.floor(frameCount) % 2 === 0) {
        const pAngle = Math.random() * Math.PI * 2;
        const pDist = 100 + Math.random() * 160;
        createHitParticles(e.x + Math.cos(pAngle) * pDist, e.y + Math.sin(pAngle) * pDist, '#f1c40f', 2);
        createHitParticles(e.x + Math.cos(pAngle) * (pDist * 0.6), e.y + Math.sin(pAngle) * (pDist * 0.6), '#00cec9', 1);
      }
    }
    // ATO 3: Supernova Divina Dourada & Banner Cósmico (0.55 <= progress < 0.75)
    else if (progress < 0.75) {
      if (!e.hasTriggeredDefeatSupernova) {
        e.hasTriggeredDefeatSupernova = true;
        triggerShake(30);
        triggerHaptic('heavy');
        playSfx('victory');
        playSfx('boss');
        playSfx('chest_fanfare');
        e.supernovaFlashTimer = 35;
        e.showGoldenBanner = true;

        if (context.bossShockwaves) {
          context.bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 20,
            maxRadius: 1000,
            speed: 20,
            damage: 0,
            color: '#f1c40f',
            colorRgb: '241, 196, 15',
            thickness: 8
          });
        }

        addDamageText(e.x, e.y - e.radius - 24, "VITÓRIA SUPREMA!", true, '#f1c40f');
      }

      if (Math.floor(frameCount) % 3 === 0) {
        createHitParticles(e.x + (Math.random() - 0.5) * 80, e.y + (Math.random() - 0.5) * 80, Math.random() < 0.6 ? '#f1c40f' : '#ffffff', 3);
      }
    }
    // ATO 4: Fade-out Gradual para o Menu (0.75 <= progress <= 1.00)
    else {
      const act4Prog = (progress - 0.75) / 0.25;
      e.fadeAlpha = Math.min(1.0, act4Prog);

      const fadeEl = document.getElementById('victory-fade-overlay');
      if (fadeEl && !fadeEl.classList.contains('active')) {
        fadeEl.classList.add('active');
      }
    }

    // Fim da Sequência: Transição Final para a Seleção de Personagens
    if (e.defeatTimer <= 0) {
      if (!e.hasDefeatCompleted) {
        e.hasDefeatCompleted = true;
        if (context.onDefeatComplete) {
          context.onDefeatComplete();
        }
      }
    }

    return;
  }

  updateDelayedActions(e, dt);
  updateAnchors(e, dt, context, () => triggerStabilityBreak(e, context));
  updateEventHorizon(e, dt, context);
  updateSingularityPhysics(e, dt, context);
  updateTentaclePhysics(e, dt);
  updateActiveAttacks(e, dt, context);
  updateHealingZones(e, dt, context);

  // Sincronização explícita e reativa da pálpebra e da paleta do estado inativo (IDLE)
  if (e.eyeAperture === undefined) e.eyeAperture = 1.0;
  if (e.idleBlend === undefined) e.idleBlend = 0.0;

  if (e.actionState === SOVEREIGN_STATES.IDLE) {
    const isWakingUp = (e.idleTimer !== undefined && e.idleTimer <= 6);
    if (isWakingUp) {
      e.eyeAnimState = 'OPENING';
      e.eyeAperture = Math.min(1.0, e.eyeAperture + 0.20 * dt);
      e.idleBlend = Math.max(0.0, e.idleBlend - 0.16 * dt);
    } else {
      e.eyeAnimState = 'CLOSING';
      e.eyeAperture = Math.max(0.0, e.eyeAperture - 0.36 * dt);
      e.idleBlend = Math.min(1.0, e.idleBlend + 0.30 * dt);
      if (e.eyeAperture === 0) e.eyeAnimState = 'CLOSED';
    }
  } else {
    e.eyeAnimState = 'OPEN';
    e.eyeAperture = Math.min(1.0, e.eyeAperture + 0.14 * dt);
    e.idleBlend = Math.max(0.0, e.idleBlend - 0.10 * dt);
  }

  // Decrementa o tempo de exibição do banner de tela do chefe
  if (e.titleTimer > 0) {
    e.titleTimer -= dt;
  }

  // Regeneração dinâmica de vida pelas Âncoras Cósmicas
  const activeAnchorCount = e.anchors ? e.anchors.filter(a => a.active && a.hp > 0).length : 0;
  if (activeAnchorCount > 0 && e.hp > 0 && e.actionState !== SOVEREIGN_STATES.SPAWN_INTRO) {
    const healRatePerSec = 0.005 * activeAnchorCount;
    const healPerFrame = (e.maxHp * healRatePerSec / 60) * dt;
    e.hp = Math.min(e.maxHp, e.hp + healPerFrame);

    if (e.healPulseTimer === undefined) e.healPulseTimer = 0;
    e.healPulseTimer += dt;
    if (e.healPulseTimer >= 60) {
      e.healPulseTimer = 0;
      if (e.hp < e.maxHp) {
        const healDisplay = (activeAnchorCount * 0.5).toFixed(1).replace('.0', '');
        addDamageText(e.x, e.y - e.radius - 24, `+${healDisplay}% HP`, false, '#2ecc71');
        createHitParticles(e.x, e.y, '#2ecc71', 6);
      }
    }
  }

  if (e.lastHp === undefined) e.lastHp = e.hp;
  const rawDmgReceived = Math.max(0, e.lastHp - e.hp);

  if (e.activeAnchorsCount > 0 && rawDmgReceived > 0) {
    const mitigated = rawDmgReceived * e.damageMitigation;
    e.hp += mitigated;

    if (Math.floor(frameCount) % 4 === 0) {
      createHitParticles(e.x, e.y, '#00cec9', 2);
      createHitParticles(e.x, e.y, '#a29bfe', 2);
    }
    e.attackCooldown -= dt * 0.20;
  }

  e.lastHp = e.hp;


  const hpRatio = Math.max(0, e.hp / e.maxHp);
  if (!e.hasTriggeredPhase2 && hpRatio <= 0.70 && e.actionState !== SOVEREIGN_STATES.PHASE_TRANSITION) {
    e.hasTriggeredPhase2 = true;
    triggerPhaseTransition(e, 2, context);
    return;
  }
  if (!e.hasTriggeredPhase3 && hpRatio <= 0.30 && e.actionState !== SOVEREIGN_STATES.PHASE_TRANSITION) {
    e.hasTriggeredPhase3 = true;
    triggerPhaseTransition(e, 3, context);
    return;
  }

  e.facing = (player.x - e.x) >= 0 ? 1 : -1;

  e.tentacleCycle += (e.phase === 3 ? 0.14 : (e.phase === 2 ? 0.11 : 0.08)) * dt;
  e.accretionAngle += (e.phase === 3 ? 0.035 : (e.phase === 2 ? 0.025 : 0.015)) * dt;
  e.corePulse = Math.sin(frameCount * (e.phase === 3 ? 0.22 : 0.12));

  let curSpeed = e.speed;
  if (e.slowTimer > 0) {
    e.slowTimer -= dt;
    curSpeed *= (1 - 0.18);
  }

  switch (e.actionState) {
    case SOVEREIGN_STATES.SPAWN_INTRO: {
      const introMax = e.introDuration || 440;
      e.introTimer -= dt;
      const progress = Math.min(1.0, Math.max(0, 1 - (e.introTimer / introMax)));

      e.isVulnerable = false;
      e.isTargetable = false;

      const hpPercent = Math.min(100, Math.round(progress * 100));
      const bossHpFill = document.getElementById('boss-hp-fill');
      if (bossHpFill) bossHpFill.style.width = `${hpPercent}%`;
      const bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
      if (bossHpGhostFill) bossHpGhostFill.style.width = `${hpPercent}%`;
      const bossHpVal = document.getElementById('boss-hp-val');
      if (bossHpVal) bossHpVal.innerText = `${hpPercent}%`;

      if (progress < 0.25) {
        if (Math.floor(frameCount) % 4 === 0) {
          triggerShake(1.2 + progress * 6);
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 120 + Math.random() * 160;
          createHitParticles(
            e.x + Math.cos(pAngle) * pDist,
            e.y + Math.sin(pAngle) * pDist,
            progress > 0.12 ? '#00cec9' : '#e84393',
            2
          );
        }
        if (Math.floor(e.introTimer) === 410) {
          playSfx('charge');
        }
      } else if (progress < 0.50) {
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(2.0 + Math.sin(progress * 10) * 2);
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 40 + Math.random() * 80;
          createHitParticles(e.x + Math.cos(pAngle) * pDist, e.y + Math.sin(pAngle) * pDist, '#81ecec', 2);
          createHitParticles(e.x, e.y, '#ffffff', 1);
        }
        if (Math.floor(e.introTimer) === 270) {
          playSfx('warp');
          triggerHaptic('medium');
        }
      } else if (progress < 0.80) {
        if (!e.hasTriggeredTitle) {
          e.hasTriggeredTitle = true;
          e.titleTimer = 220;
          e.titleMaxTimer = 220;
        }

        e.hoverAngle += 0.05 * dt;
        e.y += Math.sin(e.hoverAngle) * 0.3 * dt;

        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(2.8 + Math.sin(progress * 12) * 2);
          createHitParticles(e.x + (Math.random() - 0.5) * e.radius * 2, e.y + (Math.random() - 0.5) * e.radius * 2, '#00cec9', 2);
          createHitParticles(e.x + (Math.random() - 0.5) * e.radius * 2, e.y + (Math.random() - 0.5) * e.radius * 2, '#e84393', 1);
        }

        if (Math.floor(e.introTimer) === 130) {
          playSfx('forcefield');
          triggerHaptic('medium');
        }
      } else {
        e.hoverAngle += 0.07 * dt;
        e.y += Math.sin(e.hoverAngle) * 0.4 * dt;

        if (Math.floor(frameCount) % 2 === 0) {
          triggerShake(4.5);
          createHitParticles(e.x, e.y, '#ffffff', 3);
          createHitParticles(e.x, e.y, '#00cec9', 2);
          createHitParticles(e.x, e.y, '#e84393', 2);
        }

        if (Math.floor(e.introTimer) === 50) {
          playSfx('singularity');
        }
      }

      if (e.introTimer <= 0) {
        e.actionState = SOVEREIGN_STATES.IDLE;
        e.idleTimer = 42;
        e.isTargetable = true;
        e.stateTimer = 0;

        triggerShake(24);
        triggerHaptic('heavy');
        playSfx('singularity');
        playSfx('boss');

        if (context.bossShockwaves) {
          context.bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 30,
            maxRadius: e.arenaRadius || 620,
            speed: 16,
            damage: 0,
            color: '#00cec9',
            colorRgb: '0, 206, 201',
            thickness: 6
          });
        }

        addDamageText(e.x, e.y - e.radius - 22, "O SOBERANO DESPERTOU!", true, '#00cec9');
        addDamageText(e.x, e.y - e.radius - 42, "O FIM DOS TEMPOS COMEÇOU", false, '#e84393');

        spawnRiftAnchors(e, 3, 5000);
      }
      break;
    }

    case SOVEREIGN_STATES.PHASE_TRANSITION: {
      e.transitionTimer -= dt;
      e.hoverAngle += 0.12 * dt;

      // Micro-windup telegrafado de 40 frames antes da detonação
      if (e.transitionWindup > 0) {
        e.transitionWindup -= dt;

        // Efeito de sucção gravitacional / partículas cósmicas sugadas para o centro
        const transColor = e.phase === 2 ? '#e84393' : '#00cec9';
        const pAngle = Math.random() * Math.PI * 2;
        const pDist = 80 + Math.random() * 140;
        createHitParticles(
          e.x + Math.cos(pAngle) * pDist,
          e.y + Math.sin(pAngle) * pDist,
          transColor,
          2
        );

        if (Math.floor(frameCount) % 4 === 0) {
          triggerShake(2.0 + (1 - e.transitionWindup / 40) * 4);
        }

        // Fim do micro-windup: DETONAÇÃO DA ONDA DE REPULSÃO
        if (e.transitionWindup <= 0 && !e.transitionDetonated) {
          e.transitionDetonated = true;
          triggerShake(20);
          triggerHaptic('heavy');
          playSfx('boss');
          playSfx('singularity');

          const waveColor = e.phase === 2 ? '232, 67, 147' : '0, 206, 201';
          // Onda como repulsão radial firme (knockback: 14) sem dano punitivo surpresa
          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: e.radius,
            maxRadius: 440,
            speed: 8.0,
            damage: 0,
            knockback: 14.0,
            hitPlayer: false,
            colorRgb: waveColor
          });

          if (e.phase === 2) {
            spawnRiftAnchors(e, 3, 6500);
          }
        }
      } else {
        // Pós-detonação: partículas residuais de estabilização
        if (Math.floor(frameCount) % 3 === 0) {
          const transColor = e.phase === 2 ? '#e84393' : '#00cec9';
          createHitParticles(
            e.x + (Math.random() - 0.5) * e.radius * 2,
            e.y + (Math.random() - 0.5) * e.radius * 2,
            transColor,
            2
          );
        }
      }

      if (e.transitionTimer <= 0) {
        if (e.phase === 3) {
          e.x = e.arenaCenterX;
          e.y = e.arenaCenterY;
        }
        e.actionState = SOVEREIGN_STATES.IDLE;
        e.stateTimer = 0;
        e.idleTimer = 37;
      }
      break;
    }

    case SOVEREIGN_STATES.IDLE: {
      e.stateTimer += dt;
      e.hoverAngle += 0.025 * dt;
      e.y += Math.sin(e.hoverAngle) * 0.25 * dt;

      if (e.smoothVx) e.smoothVx *= 0.88;
      if (e.smoothVy) e.smoothVy *= 0.88;

      e.idleTimer -= dt;
      if (e.idleTimer <= 0) {
        e.actionState = SOVEREIGN_STATES.HOVER_CHASE;
        e.stateTimer = 0;
        e.attackCooldown = e.phase === 3 ? 16 : (e.phase === 2 ? 22 : 28);
      }
      break;
    }

    case SOVEREIGN_STATES.HOVER_CHASE: {
      e.stateTimer += dt;

      if (e.phase !== 3) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        const targetDist = 230;
        const angle = Math.atan2(dy, dx);

        e.hoverAngle += 0.035 * dt;
        const perpX = -Math.sin(angle) * Math.cos(e.hoverAngle) * 1.35;
        const perpY = Math.cos(angle) * Math.cos(e.hoverAngle) * 1.35;

        if (dist > targetDist + 35) {
          e.x += (Math.cos(angle) * curSpeed + perpX) * dt;
          e.y += (Math.sin(angle) * curSpeed + perpY) * dt;
        } else if (dist < targetDist - 35) {
          e.x += (-Math.cos(angle) * curSpeed * 0.85 + perpX) * dt;
          e.y += (-Math.sin(angle) * curSpeed * 0.85 + perpY) * dt;
        } else {
          e.x += perpX * curSpeed * dt;
          e.y += perpY * curSpeed * dt;
        }
      }

      e.attackCooldown -= dt;
      if (e.attackCooldown <= 0) {
        prepareNextAttack(e, context);
      }
      break;
    }

    case SOVEREIGN_STATES.WINDUP: {
      e.stateTimer += dt;
      e.windupTimer -= dt;

      if (e.currentSkill === 'VOID_CRUCIFIX') {
        const aimRot = (e.phase === 3 ? 0.007 : 0.006) * e.beamDir;
        e.beamAngle += aimRot * dt;
      } else if (e.currentSkill === 'DIMENSIONAL_CLEAVE') {
        const ratio = 1 - (e.windupTimer / e.windupMax);
        if (ratio < 0.65) {
          const targetAng = Math.atan2(player.y - e.y, player.x - e.x);
          let diff = targetAng - e.cleaveAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          e.cleaveAngle += diff * 0.09 * dt;
        } else if (!e.cleaveLocked) {
          e.cleaveLocked = true;
          playSfx('charge');
          triggerHaptic('medium');
        }
      } else if (e.currentSkill === 'COSMIC_SUPERNOVA' && e.supernovaOrbs) {
        const ratio = 1 - (e.windupTimer / e.windupMax);
        const curR = SOVEREIGN_CONFIG.SUPERNOVA_HEX_RADIUS * (1 - ratio);
        for (let o = 0; o < e.supernovaOrbs.length; o++) {
          e.supernovaOrbs[o].dist = curR;
        }
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(1.5 + ratio * 4);
        }
      } else if (e.currentSkill === 'SINGULARITY_IMPLOSION') {
        const ratio = 1 - (e.windupTimer / e.windupMax);
        e.implosionRadius = e.implosionMaxRadius * (1 - ratio);

        if (ratio < 0.60) {
          e.implosionX += (player.x - e.implosionX) * 0.08 * dt;
          e.implosionY += (player.y - e.implosionY) * 0.08 * dt;
        } else if (!e.implosionLocked) {
          e.implosionLocked = true;
          playSfx('singularity');
          triggerHaptic('medium');
        }

        const vdx = e.implosionX - player.x;
        const vdy = e.implosionY - player.y;
        const vDist = Math.hypot(vdx, vdy);
        if (vDist < e.implosionMaxRadius && vDist > 15) {
          const pullForce = (0.75 + ratio * 1.2) * dt;
          player.x += (vdx / vDist) * pullForce;
          player.y += (vdy / vDist) * pullForce;
        }
      }

      if (Math.floor(frameCount) % 4 === 0) {
        const gatherAng = Math.random() * Math.PI * 2;
        const gatherDist = e.radius + 30;
        createHitParticles(
          e.x + Math.cos(gatherAng) * gatherDist,
          e.y + Math.sin(gatherAng) * gatherDist,
          '#a29bfe',
          1
        );
      }

      if (e.windupTimer <= 0) {
        startSkillCast(e, context);
      }
      break;
    }

    case SOVEREIGN_STATES.CASTING: {
      e.stateTimer += dt;
      e.castDuration -= dt;

      if (e.currentSkill === 'VOID_CRUCIFIX') {
        const armCount = 4;
        const progress = 1 - (e.castDuration / (e.phase === 3 ? 170 : (e.phase === 2 ? 145 : 125)));

        if (!e.beamHasReversed && progress >= 0.5) {
          e.beamHasReversed = true;
          e.beamDir *= -1;
          playSfx('charge');
          triggerShake(10);
          triggerHaptic('medium');
          addDamageText(e.x, e.y - e.radius - 16, "INVERSÃO!", true, '#ff7675');
        }

        const rotSpeed = (e.phase === 3 ? 0.02625 : (e.phase === 2 ? 0.02375 : 0.01875)) * e.beamDir;
        e.beamAngle += rotSpeed * dt;

        const beamLength = 1300;
        for (let arm = 0; arm < armCount; arm++) {
          const bAng = e.beamAngle + (arm * (Math.PI * 2 / armCount));
          const bx = Math.cos(bAng);
          const by = Math.sin(bAng);
          const px = player.x - e.x;
          const py = player.y - e.y;
          const proj = px * bx + py * by;

          if (proj > 0 && proj < beamLength) {
            const perpX = px - proj * bx;
            const perpY = py - proj * by;
            if (perpX * perpX + perpY * perpY < 20 * 20 && player.bossIFrames <= 0) {
              const laserDmg = Math.round(e.damage * 0.2275);
              player.hp -= laserDmg;
              player.bossIFrames = 18;
              triggerShake(10);
              playSfx('hit');
              triggerHaptic('heavy');
              addDamageText(player.x, player.y, `-${laserDmg}`, false, '#9b59b6');
              createHitParticles(player.x, player.y, '#9b59b6', 5);
            }
          }
        }
      } else if (e.currentSkill === 'RELATIVISTIC_SALVO') {
        const salvoInterval = e.phase === 3 ? 7 : (e.phase === 2 ? 9 : 12);
        if (Math.floor(e.stateTimer) % salvoInterval === 0) {
          const directAng = Math.atan2(player.y - e.y, player.x - e.x);
          const pvx = player.vx || 0;
          const pvy = player.vy || 0;
          const isMoving = Math.hypot(pvx, pvy) > 0.3;
          const leadAng = isMoving ? Math.atan2(pvy, pvx) : directAng;

          const waveStep = Math.floor(e.stateTimer / salvoInterval);
          const aimAng = (waveStep % 2 === 0) ? directAng : (directAng * 0.7 + leadAng * 0.3);
          const spreadAngles = [-0.24, -0.08, 0.08, 0.24];
          const speed = 6.4;
          const bulletDmg = Math.round(e.damage * 0.16);

          for (let sIdx = 0; sIdx < spreadAngles.length; sIdx++) {
            if (canSpawnEnemyBullet(true)) {
              const fireAng = aimAng + spreadAngles[sIdx];
              enemyBullets.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(fireAng) * speed,
                vy: Math.sin(fireAng) * speed,
                radius: 5.5,
                damage: bulletDmg,
                bulletType: 'ABYSSAL_BOLT',
                life: 120,
                isBossProjectile: true
              });
            }
          }

          playSfx('shoot');
          triggerHaptic('light');
          createHitParticles(e.x, e.y, '#00cec9', 4);
        }
      } else if (e.currentSkill === 'ASTRAL_BARRAGE') {
        e.astralMeteorTimer = (e.astralMeteorTimer || 0) + dt;
        if (e.astralMeteorTimer >= 10 && e.astralMeteorsLeft > 0) {
          e.astralMeteorTimer = 0;
          e.astralMeteorsLeft--;

          let targetX = player.x;
          let targetY = player.y;
          if (e.astralMeteorsLeft < 6) {
            const pAng = Math.random() * Math.PI * 2;
            const pDist = 25 + Math.random() * 80;
            targetX += Math.cos(pAng) * pDist;
            targetY += Math.sin(pAng) * pDist;
          }

          if (e.arenaCenterX !== undefined && e.arenaRadius) {
            const adx = targetX - e.arenaCenterX;
            const ady = targetY - e.arenaCenterY;
            const aDist = Math.hypot(adx, ady) || 1;
            const maxD = e.arenaRadius - 30;
            if (aDist > maxD) {
              targetX = e.arenaCenterX + (adx / aDist) * maxD;
              targetY = e.arenaCenterY + (ady / aDist) * maxD;
            }
          }

          bossTelegraphs.push({
            type: 'ASTRAL_METEOR_SEAL',
            x: targetX,
            y: targetY,
            radius: 65,
            timer: 36,
            maxTimer: 36,
            damage: Math.round(e.damage * 0.36)
          });

          scheduleDelayedAction(e, 18, () => {
            if (e.hp <= 0) return;
            e.activeAttacks.push({
              type: 'FALLING_ASTRAL_METEOR',
              startX: targetX + (Math.random() - 0.5) * 80,
              startY: targetY - 480,
              targetX: targetX,
              targetY: targetY,
              timer: 18,
              maxTimer: 18
            });
          });

          playSfx('charge');
        }
      } else if (e.currentSkill === 'SINGULARITY_IMPLOSION' && e.stateTimer < dt * 2) {
        triggerShake(16);
        triggerHaptic('heavy');
        playSfx('singularity');

        bossShockwaves.push({
          x: e.implosionX,
          y: e.implosionY,
          radius: 12,
          maxRadius: e.implosionMaxRadius + 30,
          speed: 7.5,
          damage: Math.round(e.damage * 0.45),
          hitPlayer: false,
          colorRgb: '142, 68, 173'
        });

        createHitParticles(e.implosionX, e.implosionY, '#8e44ad', 28);
        createHitParticles(e.implosionX, e.implosionY, '#e056fd', 18);
      }

      if (e.castDuration <= 0) {
        if (e.currentSkill === 'VOID_CRUCIFIX') {
          e.actionState = SOVEREIGN_STATES.RECOVERY_STAGGER;
          e.staggerTimer = e.phase === 3 ? 60 : 80;
          e.isStaggered = true;
          e.isVulnerable = true;
          e.staggerGauge = 0;
          addDamageText(e.x, e.y - e.radius - 14, "BRECHA SIDÉRICA!", true, '#f1c40f');
        } else {
          e.actionState = SOVEREIGN_STATES.IDLE;
          e.stateTimer = 0;
          e.idleTimer = e.phase === 3 ? 12 : (e.phase === 2 ? 16 : 20);
        }
      }
      break;
    }

    case SOVEREIGN_STATES.WARP_AIM: {
      e.windupTimer -= dt;
      if (e.windupTimer <= 0) {
        createHitParticles(e.x, e.y, '#8e44ad', 20);
        e.x = e.warpTargetX;
        e.y = e.warpTargetY;
        createHitParticles(e.x, e.y, '#e84393', 30);
        triggerShake(14);
        triggerHaptic('heavy');
        playSfx('warp');

        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 10,
          maxRadius: 175,
          speed: 6.5,
          damage: Math.round(e.damage * 0.35),
          hitPlayer: false,
          colorRgb: '232, 67, 147'
        });

        const aimToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        const shardCount = e.phase === 3 ? 12 : 8;
        for (let s = 0; s < shardCount; s++) {
          if (!canSpawnEnemyBullet(true)) break;
          const sAng = aimToPlayer + (s * Math.PI * 2) / shardCount;
          enemyBullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(sAng) * 5.5,
            vy: Math.sin(sAng) * 5.5,
            radius: 5.0,
            damage: Math.round(e.damage * 0.20),
            bulletType: 'ABYSSAL_BOLT',
            life: 95,
            isBossProjectile: true
          });
        }

        e.actionState = SOVEREIGN_STATES.IDLE;
        e.stateTimer = 0;
        e.idleTimer = e.phase === 3 ? 14 : (e.phase === 2 ? 18 : 22);
      }
      break;
    }

    case SOVEREIGN_STATES.RECOVERY_STAGGER: {
      e.isVulnerable = true;
      e.staggerTimer -= dt;

      if (Math.floor(frameCount) % 5 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 1.6,
          e.y + (Math.random() - 0.5) * e.radius * 1.6,
          '#f1c40f',
          2
        );
      }

      if (e.staggerTimer <= 0) {
        e.isVulnerable = false;
        e.isStaggered = false;
        e.actionState = SOVEREIGN_STATES.IDLE;
        e.stateTimer = 0;
        e.idleTimer = 40;
        addDamageText(e.x, e.y - e.radius - 12, "ESTABILIZADO!", true, '#8e44ad');
      }
      break;
    }

    default: {
      e.actionState = SOVEREIGN_STATES.HOVER_CHASE;
      break;
    }
  }

  clampBossToArena(e);
}
