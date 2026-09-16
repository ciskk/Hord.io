/**
 * src/entities/bosses/supremeReaper/attacks.js
 * Arsenal de habilidades, seleção de skills e disparo de ataques do Ceifador Supremo.
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { REAPER_STATES, REAPER_SKILLS, REAPER_CONFIG } from './constants.js';

/**
 * Seleciona a próxima habilidade com base em avaliação tática situacional (Envelope Anti-Whiff, Predição de Movimento e Combos).
 * Elimina ativações de Vínculo de Almas ou Colheita que quebravam ou erravam no vazio por falta de alcance.
 * @param {Object} e Entidade do chefe.
 * @param {number} dist Distância euclidiana até o jogador.
 * @param {Object} player Entidade do jogador.
 */
export function selectReaperSkill(e, dist, player) {
  const isEnraged = e.isEnraged || e.isPhase3;
  const isP3 = e.isPhase3;

  // 1. Tabela de Avaliação de Pesos Táticos (Utility Scoring - 9 Habilidades)
  const weights = {
    [REAPER_SKILLS.DOUBLE_CLEAVE]: 0,
    [REAPER_SKILLS.PHANTOM_BLINK]: 0,
    [REAPER_SKILLS.SOUL_SCYTHES]: 0,
    [REAPER_SKILLS.SOUL_TETHER]: 0,
    [REAPER_SKILLS.VORTEX_HARVEST]: 0,
    [REAPER_SKILLS.SCYTHE_BOOMERANG]: 0,
    [REAPER_SKILLS.DEATH_MARK_EXECUTION]: 0,
    [REAPER_SKILLS.SOUL_WELLS]: 0,
    [REAPER_SKILLS.PHANTOM_TRIAD_SLASH]: 0
  };

  // CÁLCULO DOS PESOS BASE POR FAIXA DE DISTÂNCIA
  if (dist < 170) {
    // Zona 0: Curta Distância / Melee (< 170px)
    weights[REAPER_SKILLS.DOUBLE_CLEAVE] = 45;
    weights[REAPER_SKILLS.VORTEX_HARVEST] = 25;
    if (!e.tetherActive) {
      weights[REAPER_SKILLS.SOUL_TETHER] = 25;
    }
    if (isEnraged) {
      weights[REAPER_SKILLS.PHANTOM_TRIAD_SLASH] = 35;
    }
    weights[REAPER_SKILLS.SOUL_SCYTHES] = 10;
    weights[REAPER_SKILLS.SOUL_WELLS] = 15;
  } else if (dist <= 280) {
    // Zona 1: Médio Alcance (170px a 280px)
    weights[REAPER_SKILLS.PHANTOM_BLINK] = 35;
    weights[REAPER_SKILLS.SOUL_SCYTHES] = 30;
    weights[REAPER_SKILLS.SOUL_WELLS] = 30;
    if (isEnraged) {
      weights[REAPER_SKILLS.SCYTHE_BOOMERANG] = 35;
      weights[REAPER_SKILLS.DEATH_MARK_EXECUTION] = 35;
      weights[REAPER_SKILLS.PHANTOM_TRIAD_SLASH] = 30;
    }
    if (!e.tetherActive && dist <= 260) {
      weights[REAPER_SKILLS.SOUL_TETHER] = 20;
    }
    if (dist <= 270) {
      weights[REAPER_SKILLS.VORTEX_HARVEST] = 20;
    }
  } else {
    // Zona 2: Longo Alcance (> 280px)
    // Anti-whiff rigoroso: fecha o espaço com bumerangue, guilhotina celestial ou blink!
    weights[REAPER_SKILLS.PHANTOM_BLINK] = 40;
    weights[REAPER_SKILLS.SOUL_SCYTHES] = 35;
    weights[REAPER_SKILLS.SOUL_WELLS] = 30;
    if (isEnraged) {
      weights[REAPER_SKILLS.SCYTHE_BOOMERANG] = 45;
      weights[REAPER_SKILLS.DEATH_MARK_EXECUTION] = 40;
    }
  }

  // 2. Leitura Comportamental do Jogador
  if (player) {
    const pvx = player.vx || (player.pushVx || 0);
    const pvy = player.vy || (player.pushVy || 0);
    const isMoving = player.isMoving || Math.hypot(pvx, pvy) > 0.3;

    if (isMoving && dist > 200) {
      const pdx = player.x - e.x;
      const pdy = player.y - e.y;
      const isRetreating = (pvx * pdx + pvy * pdy) > 0;
      if (isRetreating) {
        // Jogador fugindo: intensifica o Phantom Blink e a Guilhotina para cortar a rota
        weights[REAPER_SKILLS.PHANTOM_BLINK] *= 1.40;
        if (isEnraged) weights[REAPER_SKILLS.DEATH_MARK_EXECUTION] *= 1.35;
      }
    }

    // Sinergia com Lanternas Espirituais ativas: dispara mais foices cruzadas
    if (e.lanterns && e.lanterns.some(l => l.active) && dist >= 160) {
      weights[REAPER_SKILLS.SOUL_SCYTHES] *= 1.25;
    }
  }

  // 3. Anti-Spam: Reduz repetição consecutiva
  if (e.lastUsedSkill && weights[e.lastUsedSkill] > 0) {
    weights[e.lastUsedSkill] *= 0.20;
  }

  // 4. Sorteio Ponderado por Roleta
  let totalWeight = 0;
  for (const skillKey in weights) {
    totalWeight += weights[skillKey];
  }

  if (totalWeight <= 0) {
    weights[REAPER_SKILLS.SOUL_SCYTHES] = 1;
    totalWeight = 1;
  }

  let roll = Math.random() * totalWeight;
  let chosenSkill = REAPER_SKILLS.SOUL_SCYTHES;

  for (const skillKey in weights) {
    roll -= weights[skillKey];
    if (roll <= 0) {
      chosenSkill = skillKey;
      break;
    }
  }

  // 5. Preparação e Configuração da Habilidade
  e.currentSkill = chosenSkill;

  switch (chosenSkill) {
    case REAPER_SKILLS.DOUBLE_CLEAVE:
      e.actionState = REAPER_STATES.WINDUP;
      e.actionTimer = isEnraged ? 26 : 34;
      break;

    case REAPER_SKILLS.PHANTOM_BLINK: {
      const pvx = player.vx || (player.pushVx || 0);
      const pvy = player.vy || (player.pushVy || 0);
      const isMoving = player.isMoving || Math.hypot(pvx, pvy) > 0.3;

      let leadX = 0;
      let leadY = 0;
      if (isMoving) {
        const leadDist = isEnraged ? 26 : 18;
        const moveLen = Math.hypot(pvx, pvy) || 1;
        leadX = (pvx / moveLen) * leadDist;
        leadY = (pvy / moveLen) * leadDist;
      }

      const predictedX = player.x + leadX;
      const predictedY = player.y + leadY;
      const angleToPlayer = Math.atan2(predictedY - e.y, predictedX - e.x);
      const flankOffset = (Math.random() < 0.5 ? 1 : -1) * (Math.PI * 0.32);
      const blinkAngle = angleToPlayer + flankOffset;
      const safeDistance = 155;

      const targetX = predictedX + Math.cos(blinkAngle) * safeDistance;
      const targetY = predictedY + Math.sin(blinkAngle) * safeDistance;
      const intendedCleaveAngle = Math.atan2(predictedY - targetY, predictedX - targetX);

      e.blinkTarget = {
        x: targetX,
        y: targetY,
        angle: blinkAngle,
        cleaveAngle: intendedCleaveAngle
      };

      e.actionState = REAPER_STATES.BLINK_AIM;
      e.actionTimer = isEnraged ? 36 : 46;
      break;
    }

    case REAPER_SKILLS.SOUL_SCYTHES:
      e.actionState = REAPER_STATES.WINDUP;
      e.actionTimer = isEnraged ? 26 : 34;
      break;

    case REAPER_SKILLS.SOUL_TETHER:
      e.actionState = REAPER_STATES.WINDUP;
      e.actionTimer = 24;
      break;

    case REAPER_SKILLS.VORTEX_HARVEST:
      e.actionState = REAPER_STATES.WINDUP;
      e.actionTimer = isEnraged ? 24 : 32;
      break;

    case REAPER_SKILLS.SCYTHE_BOOMERANG:
      e.actionState = REAPER_STATES.WINDUP_BOOMERANG;
      e.actionTimer = isEnraged ? 26 : 34;
      break;

    case REAPER_SKILLS.DEATH_MARK_EXECUTION: {
      const execWindup = REAPER_CONFIG.EXECUTION_WINDUP || 65;
      e.actionState = REAPER_STATES.WINDUP_EXECUTION;
      e.actionTimer = execWindup;
      e.deathMark = {
        active: true,
        x: player.x,
        y: player.y,
        timer: execWindup,
        maxTimer: execWindup,
        locked: false,
        lockLead: REAPER_CONFIG.EXECUTION_LOCK_LEAD || 18,
        radius: REAPER_CONFIG.EXECUTION_RADIUS || 46
      };
      playSfx('singularity');
      break;
    }

    case REAPER_SKILLS.SOUL_WELLS:
      e.actionState = REAPER_STATES.WINDUP_SOUL_WELLS;
      e.actionTimer = isEnraged ? 28 : 36;
      break;

    case REAPER_SKILLS.PHANTOM_TRIAD_SLASH:
      e.actionState = REAPER_STATES.WINDUP_TRIAD_SLASH;
      e.actionTimer = REAPER_CONFIG.TRIAD_WINDUP || 38;
      break;
  }

  e.lastUsedSkill = chosenSkill;
}

/**
 * Executa a habilidade preparada pelo Ceifador Supremo ao concluir o Windup.
 * @param {Object} e Entidade do chefe.
 * @param {Object} context Contexto global injetado do loop.
 */
export function executeReaperSkill(e, context) {
  const {
    player,
    frameCount = 0,
    bossTelegraphs,
    bossProjectiles,
    triggerShake,
    addDamageText
  } = context;

  const angleToPlayer = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);

  switch (e.currentSkill) {
    case REAPER_SKILLS.DOUBLE_CLEAVE: {
      playSfx('boss');
      triggerShake(12);
      triggerHaptic('heavy');
      e.wingTargetSpan = 1.45;
      e.scytheTargetAngle = 1.4 * e.facing;
      e.scytheGlow = 1.0;

      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 180,
        angle: angleToPlayer,
        timer: 32,
        maxTimer: 32,
        damage: Math.round(e.damage * 0.45),
        color: e.isEnraged ? '#ff4757' : '#00cec9',
        colorRgb: e.isEnraged ? '255, 71, 87' : '0, 206, 201',
        boss: e
      });

      e.delayedActions.push({
        timer: 20,
        callback: () => {
          playSfx('crit');
          triggerShake(10);
          e.scytheGlow = 1.0;
          bossTelegraphs.push({
            type: 'SCYTHE_CLEAVE',
            x: e.x,
            y: e.y,
            radius: 215,
            angle: angleToPlayer + 0.38 * e.facing,
            timer: 38,
            maxTimer: 38,
            damage: Math.round(e.damage * 0.55),
            color: '#ff4757',
            colorRgb: '255, 71, 87',
            boss: e
          });
        }
      });

      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 75;
      break;
    }

    case REAPER_SKILLS.SOUL_SCYTHES: {
      playSfx('shoot');
      e.wingTargetSpan = 1.15;
      e.scytheTargetAngle = (frameCount || 0) * 0.25;
      e.scytheGlow = 0.8;

      const blades = e.isPhase3 ? 7 : (e.isEnraged ? 5 : 3);
      const arc = Math.PI * (e.isEnraged ? 0.65 : 0.45);
      const startAngle = angleToPlayer - arc / 2;
      const step = arc / (blades - 1);

      for (let i = 0; i < blades; i++) {
        const bAng = startAngle + i * step;
        bossProjectiles.push({
          type: 'SOUL_SCYTHE',
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * 6.5,
          vy: Math.sin(bAng) * 6.5,
          radius: 20,
          damage: Math.round(e.damage * 0.48),
          life: 140,
          maxLife: 140,
          color: e.isEnraged ? '#ff4757' : '#00cec9',
          isReturning: false
        });
      }

      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 60;
      break;
    }

    case REAPER_SKILLS.SOUL_TETHER: {
      playSfx('boss');
      triggerShake(7);
      e.tetherActive = true;
      e.tetherTimer = 160;
      e.actionState = REAPER_STATES.CHASE;
      e.skillCooldown = 80;
      addDamageText(player.x, player.y, "VÍNCULO DAS ALMAS!", true, '#00cec9');
      break;
    }

    case REAPER_SKILLS.VORTEX_HARVEST: {
      playSfx('boss');
      triggerShake(9);
      e.wingTargetSpan = 1.35;
      e.scytheTargetAngle = 0;
      e.actionState = REAPER_STATES.VORTEX_HARVEST;
      e.actionTimer = e.isEnraged ? 75 : 95;
      addDamageText(e.x, e.y - 45, "COLHEITA DO CREPÚSCULO!", true, e.isEnraged ? '#ff4757' : '#00cec9');
      break;
    }

    case REAPER_SKILLS.SCYTHE_BOOMERANG: {
      playSfx('boss');
      playSfx('crit');
      triggerShake(12);
      triggerHaptic('heavy');
      e.isUnarmed = true;
      e.scytheGlow = 0;

      const bAngle = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);
      const bSpeed = REAPER_CONFIG.BOOMERANG_SPEED || 9.5;
      const pdx = player.x - e.x;
      const pdy = player.y - e.y;
      const currentDist = Math.hypot(pdx, pdy);
      const targetDist = Math.min(520, Math.max(220, currentDist + 60));

      e.boomerangScythe = {
        active: true,
        x: e.x,
        y: e.y,
        vx: Math.cos(bAngle) * bSpeed,
        vy: Math.sin(bAngle) * bSpeed,
        angle: bAngle,
        rotSpeed: 0.38,
        state: 'OUT',
        travelDist: 0,
        maxDist: targetDist,
        grindTimer: 0,
        radius: REAPER_CONFIG.BOOMERANG_RADIUS || 34,
        damage: Math.round(e.damage * 0.40)
      };

      e.actionState = REAPER_STATES.BOOMERANG_ACTIVE;
      e.actionTimer = 180;
      addDamageText(e.x, e.y - 45, "FOICE DO DESTINO!", true, '#00cec9');
      break;
    }

    case REAPER_SKILLS.DEATH_MARK_EXECUTION: {
      // O retículo de marca já está ativo e rastreando no updateDeathMarkExecution
      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = e.isEnraged ? 28 : 36;
      break;
    }

    case REAPER_SKILLS.SOUL_WELLS: {
      playSfx('boss');
      triggerShake(10);
      triggerHaptic('medium');
      e.scytheTargetAngle = -1.2 * e.facing;
      e.scytheGlow = 1.0;

      e.soulWells = [];
      const wellCount = e.isEnraged ? 6 : 5;
      const wellRadius = REAPER_CONFIG.SOUL_WELL_RADIUS || 44;

      const pvx = player.vx || (player.pushVx || 0);
      const pvy = player.vy || (player.pushVy || 0);

      e.soulWells.push({
        x: player.x,
        y: player.y,
        timer: 36,
        maxTimer: 36,
        radius: wellRadius,
        detonated: false
      });

      e.soulWells.push({
        x: player.x + pvx * 16,
        y: player.y + pvy * 16,
        timer: 42,
        maxTimer: 42,
        radius: wellRadius,
        detonated: false
      });

      for (let w = 2; w < wellCount; w++) {
        const wAng = (w * Math.PI * 2) / (wellCount - 1);
        const wDist = 110 + Math.random() * 90;
        e.soulWells.push({
          x: player.x + Math.cos(wAng) * wDist,
          y: player.y + Math.sin(wAng) * wDist,
          timer: 38 + w * 4,
          maxTimer: 38 + w * 4,
          radius: wellRadius,
          detonated: false
        });
      }

      playSfx('singularity');
      addDamageText(e.x, e.y - 45, "CHAMAS SEPULCRAIS!", true, '#00cec9');
      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 42;
      break;
    }

    case REAPER_SKILLS.PHANTOM_TRIAD_SLASH: {
      playSfx('boss');
      playSfx('warp');
      triggerShake(14);
      triggerHaptic('heavy');

      const centerPlayerX = player.x;
      const centerPlayerY = player.y;
      const triadR = REAPER_CONFIG.TRIAD_DISTANCE || 180;

      const baseAngle = Math.atan2(e.y - centerPlayerY, e.x - centerPlayerX);
      e.x = centerPlayerX + Math.cos(baseAngle) * triadR;
      e.y = centerPlayerY + Math.sin(baseAngle) * triadR;
      e.aimAngle = Math.atan2(centerPlayerY - e.y, centerPlayerX - e.x);

      e.triadClones = [];
      for (let c = 1; c <= 2; c++) {
        const cAng = baseAngle + (c * Math.PI * 2) / 3;
        const cx = centerPlayerX + Math.cos(cAng) * triadR;
        const cy = centerPlayerY + Math.sin(cAng) * triadR;
        const cSlashAng = Math.atan2(centerPlayerY - cy, centerPlayerX - cx);
        e.triadClones.push({
          x: cx,
          y: cy,
          slashAngle: cSlashAng,
          timer: 28,
          slashed: false,
          fadeTimer: 20,
          alpha: 0.95
        });
      }

      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 185,
        angle: e.aimAngle,
        timer: 28,
        maxTimer: 28,
        damage: Math.round(e.damage * 0.50),
        color: '#ff4757',
        colorRgb: '255, 71, 87',
        boss: e
      });

      addDamageText(centerPlayerX, centerPlayerY - 45, "TRÍADE DA MORTE!", true, '#ff4757');
      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 65;
      break;
    }

    default: {
      e.actionState = REAPER_STATES.CHASE;
      e.skillCooldown = 60;
      break;
    }
  }
}
