/**
 * src/entities/bosses/abyssalMonolith/attacks.js
 * Arsenal de habilidades, seleção de skills e disparo de ataques de "Ignis Lithos, o Titã de Basalto".
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { setLastAttackerName, canSpawnEnemyBullet } from '../../../main.js';
import { selectedHeroKey } from '../../player.js';
import { triggerDeath } from '../../../systems/ui.js';
import { MONOLITH_STATES, MONOLITH_SKILLS } from './constants.js';

/**
 * Seleciona a próxima habilidade com base na distância até o jogador, fase e histórico recente.
 * @param {Object} e Entidade do chefe.
 * @param {number} dist Distância euclidiana até o jogador.
 */
export function selectNextSkill(e, dist) {
  const isEnraged = e.isEnraged;
  const isP3 = e.isPhase3;
  const rand = Math.random();

  // Em alcance Melee (< 190px):
  if (dist < 190) {
    // 50% Esmagamento Frontal (com zona cega nas costas)
    // 30% Erupção do Epicentro (solo sob o boss racha)
    // 20% Varredura de Placas 360° (evita que melee fique colado passivamente)
    if (e.lastUsedSkill !== MONOLITH_SKILLS.TECTONIC_SLAM && (rand < 0.50 || e.lastUsedSkill === MONOLITH_SKILLS.EPICENTER_SURGE)) {
      e.currentSkill = MONOLITH_SKILLS.TECTONIC_SLAM;
      e.actionState = MONOLITH_STATES.WINDUP_SLAM;
      e.actionTimer = isP3 ? 34 : (isEnraged ? 40 : 48);
    } else if (rand < 0.80) {
      e.currentSkill = MONOLITH_SKILLS.EPICENTER_SURGE;
      e.actionState = MONOLITH_STATES.WINDUP_EPICENTER;
      e.actionTimer = isP3 ? 126 : (isEnraged ? 144 : 168);
    } else {
      e.currentSkill = MONOLITH_SKILLS.PLATE_WHIRL;
      e.actionState = MONOLITH_STATES.WINDUP_WHIRL;
      e.actionTimer = isP3 ? 28 : (isEnraged ? 32 : 38);
    }
  }
  // Em alcance Médio (190px a 550px):
  else if (dist <= 550) {
    if (rand < 0.40 && e.lastUsedSkill !== MONOLITH_SKILLS.EPICENTER_SURGE) {
      e.currentSkill = MONOLITH_SKILLS.EPICENTER_SURGE;
      e.actionState = MONOLITH_STATES.WINDUP_EPICENTER;
      e.actionTimer = isP3 ? 126 : (isEnraged ? 144 : 168);
    } else if (rand < 0.70) {
      e.currentSkill = MONOLITH_SKILLS.VOLCANIC_FISSURE;
      e.actionState = MONOLITH_STATES.WINDUP_FISSURE;
      e.actionTimer = isP3 ? 26 : (isEnraged ? 30 : 38);
    } else {
      e.currentSkill = MONOLITH_SKILLS.BASALT_BARRAGE;
      e.actionState = MONOLITH_STATES.WINDUP_BARRAGE;
      e.actionTimer = isP3 ? 24 : (isEnraged ? 28 : 36);
    }
  }
  // Em Longa Distância (> 450px):
  else {
    if ((isEnraged || isP3) && rand < 0.45 && e.lastUsedSkill !== MONOLITH_SKILLS.MAGMA_SIPHON) {
      e.currentSkill = MONOLITH_SKILLS.MAGMA_SIPHON;
      e.actionState = MONOLITH_STATES.CHANNELING_SIPHON;
      e.pullTimer = isP3 ? 60 : (isEnraged ? 70 : 82);
      e.pullMaxTimer = e.pullTimer;
    } else if (rand < 0.75) {
      e.currentSkill = MONOLITH_SKILLS.BASALT_BARRAGE;
      e.actionState = MONOLITH_STATES.WINDUP_BARRAGE;
      e.actionTimer = isP3 ? 24 : (isEnraged ? 28 : 36);
    } else {
      e.currentSkill = MONOLITH_SKILLS.VOLCANIC_FISSURE;
      e.actionState = MONOLITH_STATES.WINDUP_FISSURE;
      e.actionTimer = isP3 ? 26 : (isEnraged ? 30 : 38);
    }
  }

  e.lastUsedSkill = e.currentSkill;
}

/**
 * SKILL 1: ESMAGAMENTO TECTÔNICO (TECTONIC SLAM)
 * Dano aumentado para 75-88.
 * Possui avanço frontal de 20px no impacto e zona cega nas costas.
 * @param {Object} e
 * @param {Object} context
 */
export function executeTectonicSlam(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  playSfx('boss');
  triggerShake(18);
  triggerHaptic('heavy');

  // Avanço pesado para frente no impacto
  e.x += Math.cos(e.aimAngle) * 20;
  e.y += Math.sin(e.aimAngle) * 20;

  const impactDist = 75;
  const impactX = e.x + Math.cos(e.aimAngle) * impactDist;
  const impactY = e.y + Math.sin(e.aimAngle) * impactDist;

  for (let p = 0; p < 28; p++) {
    createHitParticles(impactX, impactY, '#ff4757', 1);
    createHitParticles(impactX, impactY, '#d35400', 1);
  }

  // Avaliação geométrica no cone frontal
  const pdx = player.x - e.x;
  const pdy = player.y - e.y;
  const pDist = Math.hypot(pdx, pdy);
  const pAngle = Math.atan2(pdy, pdx);

  let angleDiff = Math.abs(pAngle - e.aimAngle);
  if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

  // Dano somente se estiver no cone frontal (< slamArc) e dentro do alcance (185px)
  if (pDist <= e.slamRadius && angleDiff <= e.slamArc && player.bossIFrames <= 0) {
    let slamDamage = e.isPhase3 ? 119 : (e.isEnraged ? 111 : 101);
    if (selectedHeroKey === 'KNIGHT') slamDamage = Math.round(slamDamage * 0.80);

    player.hp -= slamDamage;
    player.bossIFrames = 24;
    setLastAttackerName("Esmagamento Tectônico");
    playSfx('hit');
    triggerShake(12);
    addDamageText(player.x, player.y, `-${slamDamage}`, true, '#e74c3c');
    createHitParticles(player.x, player.y, '#e74c3c', 10);

    const pushAngle = Math.atan2(pdy, pdx);
    player.x += Math.cos(pushAngle) * 28;
    player.y += Math.sin(pushAngle) * 28;

    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  // Na Fase 2/3: solta 3 fendas em leque para frente (alcance 2x adicional: 700px)
  if (e.isEnraged || e.isPhase3) {
    const fCount = 3;
    const fSpread = 0.34;
    for (let f = 0; f < fCount; f++) {
      const fAng = e.aimAngle + (f - 1) * fSpread;
      for (let n = 1; n <= 12; n++) {
        const nodeDist = impactDist + n * 55;
        const nx = e.x + Math.cos(fAng) * nodeDist;
        const ny = e.y + Math.sin(fAng) * nodeDist;

        context.bossTelegraphs.push({
          type: 'FISSURE_NODE',
          x: nx,
          y: ny,
          originX: e.x,
          originY: e.y,
          lineIndex: f,
          nodeIndex: n,
          angle: fAng,
          radius: 26,
          timer: 14 + n * 4,
          maxTimer: 14 + n * 4,
          damage: Math.round(e.damage * 0.38)
        });
      }
    }
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = e.isPhase3 ? 30 : (e.isEnraged ? 34 : 40);
}

/**
 * SKILL 2 (PASSO 1): ERUPÇÃO DO EPICENTRO
 * O solo sob o chefe explode (0 a 115px).
 * Imediatamente inicia a propagação da onda para o anel externo.
 * @param {Object} e
 * @param {Object} context
 */
export function executeEpicenterEruption(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;
  playSfx('boss');
  triggerShake(16);
  triggerHaptic('heavy');

  // Efeito de coluna de lava no centro
  for (let p = 0; p < 30; p++) {
    const cAng = Math.random() * Math.PI * 2;
    const cDist = Math.random() * 110;
    createHitParticles(e.x + Math.cos(cAng) * cDist, e.y + Math.sin(cAng) * cDist, '#ff1744', 1);
    createHitParticles(e.x + Math.cos(cAng) * cDist, e.y + Math.sin(cAng) * cDist, '#f39c12', 1);
  }

  // Avaliação de Dano no Epicentro (< 115px)
  const pDist = Math.hypot(player.x - e.x, player.y - e.y);
  if (pDist < 115 && player.bossIFrames <= 0) {
    let epicenterDmg = e.isPhase3 ? 152 : (e.isEnraged ? 140 : 132);
    if (selectedHeroKey === 'KNIGHT') epicenterDmg = Math.round(epicenterDmg * 0.80);
    player.hp -= epicenterDmg;
    player.bossIFrames = 20;
    setLastAttackerName("Erupção do Epicentro");
    playSfx('hit');
    addDamageText(player.x, player.y, `-${epicenterDmg}`, true, '#ff4757');
    createHitParticles(player.x, player.y, '#ff4757', 10);
    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  // Transita para a propagação da onda externa (135 frames de tempo de aviso - 1.5x mais lento)
  e.actionState = MONOLITH_STATES.PROPAGATING_SURGE;
  e.actionTimer = e.isPhase3 ? 96 : (e.isEnraged ? 114 : 135);
}

/**
 * SKILL 2 (PASSO 2): ONDA EXTERNA DE BASALTO
 * O solo sob o chefe já esfriou e está seguro!
 * O anel externo (140px a 245px) detona agora, causando dano reduzido pela metade.
 * @param {Object} e
 * @param {Object} context
 */
export function executeOuterSurge(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  playSfx('boss');
  triggerShake(14);

  // Explosão em anel com estacas de basalto e chamas
  const ringCount = 32;
  for (let s = 0; s < ringCount; s++) {
    const rAng = (s * Math.PI * 2) / ringCount;
    const rDist = 150 + Math.random() * 90;
    createHitParticles(e.x + Math.cos(rAng) * rDist, e.y + Math.sin(rAng) * rDist, '#e67e22', 1);
    createHitParticles(e.x + Math.cos(rAng) * rDist, e.y + Math.sin(rAng) * rDist, '#f39c12', 1);
  }

  // Avaliação de Dano no Anel Externo (140 a 245px)
  const pDist = Math.hypot(player.x - e.x, player.y - e.y);
  if (pDist >= 140 && pDist <= 245 && player.iFrames <= 0) {
    let surgeDmg = e.isPhase3 ? 124 : (e.isEnraged ? 116 : 104);
    if (selectedHeroKey === 'KNIGHT') surgeDmg = Math.round(surgeDmg * 0.80);

    player.hp -= surgeDmg;
    player.iFrames = 25;
    setLastAttackerName("Onda de Fendas Tectônicas");
    playSfx('hit');
    addDamageText(player.x, player.y, `-${surgeDmg}`, false, '#e67e22');
    createHitParticles(player.x, player.y, '#e67e22', 8);

    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = e.isPhase3 ? 28 : (e.isEnraged ? 32 : 38);
}

/**
 * SKILL 3: VARREDURA DE PLACAS 360° (PLATE WHIRL)
 * As placas abrem em lâminas circulares e giram velozes ao redor do corpo.
 * @param {Object} e
 * @param {Object} context
 */
export function executePlateWhirl(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;
  playSfx('hit');
  triggerShake(10);
  triggerHaptic('medium');

  for (let p = 0; p < 24; p++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 30;
    createHitParticles(e.x + Math.cos(ang) * dist, e.y + Math.sin(ang) * dist, '#ff4757', 1);
  }

  // Avaliação de Dano no raio das placas giratórias (<= 110px)
  const pDist = Math.hypot(player.x - e.x, player.y - e.y);
  if (pDist <= 110 && player.bossIFrames <= 0) {
    let whirlDmg = e.isPhase3 ? 51 : (e.isEnraged ? 47 : 45);
    if (selectedHeroKey === 'KNIGHT') whirlDmg = Math.round(whirlDmg * 0.80);
    player.hp -= whirlDmg;
    player.bossIFrames = 22;
    setLastAttackerName("Varredura de Placas");
    playSfx('hit');
    addDamageText(player.x, player.y, `-${whirlDmg}`, false, '#ff4757');
    createHitParticles(player.x, player.y, '#ff4757', 8);
    const pushAng = Math.atan2(player.y - e.y, player.x - e.x);
    player.x += Math.cos(pushAng) * 26;
    player.y += Math.sin(pushAng) * 26;
    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = 32;
}

/**
 * SKILL 4: VÓRTICE DA CALDEIRA (MAGMA SIPHON)
 * Dispara ondas de estilhaços magmáticos em leque espiral.
 * @param {Object} e
 * @param {Object} context
 */
export function executeMagmaSiphonRelease(e, context) {
  const { enemyBullets, triggerShake } = context;

  playSfx('boss');
  triggerShake(14);
  triggerHaptic('heavy');

  const waveCount = 3;
  const shardCount = 8;
  for (let w = 0; w < waveCount; w++) {
    e.delayedActions.push({
      timer: w * 8,
      callback: () => {
        playSfx('shoot');
        const waveOffset = (w * Math.PI) / 8;
        for (let s = 0; s < shardCount; s++) {
          if (!canSpawnEnemyBullet(true)) break;
          const sAng = waveOffset + (s * Math.PI * 2) / shardCount;
          enemyBullets.push({
            x: e.x + Math.cos(sAng) * 65,
            y: e.y + Math.sin(sAng) * 65,
            vx: Math.cos(sAng) * (4.5 + w * 0.45),
            vy: Math.sin(sAng) * (4.5 + w * 0.45),
            radius: 6.5,
            damage: 26,
            life: 360, // Alcance 2x adicional: viaja até ~1620px através de toda a arena
            color: '#e67e22',
            isBossProjectile: true
          });
        }
      }
    });
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = 38;
}

/**
 * SKILL 5: FENDAS VULCÂNICAS (VOLCANIC FISSURE)
 * Sequência de círculos explosivos em leque com alcance 2x adicional (1040px).
 * @param {Object} e
 * @param {Object} context
 */
export function executeVolcanicFissure(e, context) {
  const { player, bossTelegraphs, triggerShake } = context;
  const angleToPlayer = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);

  playSfx('boss');
  triggerShake(10);
  triggerHaptic('medium');

  const lineCount = e.isPhase3 ? 5 : (e.isEnraged ? 4 : 3);
  const spreadArc = Math.PI * (e.isPhase3 ? 0.55 : 0.40);
  const startAngle = angleToPlayer - spreadArc / 2;
  const step = spreadArc / (lineCount - 1);

  for (let l = 0; l < lineCount; l++) {
    const lineAng = startAngle + (l * step);
    const nodeCount = 13; // Dobrado de 7 para 13 nós consecutivos
    for (let n = 1; n <= nodeCount; n++) {
      const distNode = n * 80; // Alcance estendido 2x adicional: atinge até 1040px (antes 525px)
      const nodeX = e.x + Math.cos(lineAng) * distNode;
      const nodeY = e.y + Math.sin(lineAng) * distNode;

      bossTelegraphs.push({
        type: 'FISSURE_NODE',
        x: nodeX,
        y: nodeY,
        originX: e.x,
        originY: e.y,
        lineIndex: l,
        nodeIndex: n,
        angle: lineAng,
        radius: 30,
        timer: 20 + n * 5,
        maxTimer: 20 + n * 5,
        damage: 42
      });
    }
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = e.isPhase3 ? 34 : (e.isEnraged ? 38 : 44);
}

/**
 * SKILL 6: ARTILHARIA DE BASALTO (BASALT BARRAGE)
 * Chuva de meteoros vulcânicos com área e dispersão 2x adicionais (até 480px).
 * @param {Object} e
 * @param {Object} context
 */
export function executeBasaltBarrage(e, context) {
  const { player, bossTelegraphs, triggerShake } = context;

  playSfx('shoot');
  triggerShake(6);

  const impactCount = e.isPhase3 ? 7 : (e.isEnraged ? 6 : 5);
  for (let m = 0; m < impactCount; m++) {
    let targetX, targetY;
    if (m === 0) {
      // Pelo menos 1 meteoro direcionado diretamente na posição do jogador
      targetX = player.x;
      targetY = player.y;
    } else {
      const offsetAng = (m * Math.PI * 2) / impactCount + Math.random() * 0.4;
      const offsetDist = 50 + Math.random() * 300;
      targetX = player.x + Math.cos(offsetAng) * offsetDist;
      targetY = player.y + Math.sin(offsetAng) * offsetDist;
    }

    bossTelegraphs.push({
      type: 'FALLING_ROCK',
      x: targetX,
      y: targetY,
      radius: 44,
      timer: 36 + m * 7,
      maxTimer: 36 + m * 7,
      damage: 48
    });
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = 36;
}
