/**
 * src/entities/bosses/abyssalMonolith.js
 * Módulo de Comportamento, Mecânica e Renderização Procedural:
 * "Ignis Lithos, o Titã de Basalto" (bossId: 2)
 *
 * Atualização V2 (Calibração de Dano, Ameaça e Intuição Visual):
 * 1. Erupção do Epicentro e Onda de Fendas (Substitui os círculos rápidos confusos):
 *    - Sequência física 100% intuitiva: Primeiro o solo sob o chefe racha e explode (Epicentro: 65 de dano),
 *      depois a energia corre pelo solo e explode o anel externo (Onda: 55 de dano), deixando o centro resfriado e seguro!
 * 2. Esmagamento Tectônico Frontal de Alto Impacto:
 *    - Dano elevado para 75-88 (ameaça real se acertar em cheio).
 *    - Avanço físico pesado do chefe no impacto e telegrafia de solo com rachaduras em brasa.
 * 3. Novo Golpe Curto: Varredura de Placas 360° (Plate Whirl: 48 de dano) para evitar abuso passivo nas costas.
 * 4. Ritmo Acelerado: Redução das janelas ociosas pós-ataque e aumento da velocidade de perseguição do colosso.
 * 5. Orbes Estratégicas e Fontes Termais: Destruir Litocistos gera Fontes Termais (+25 HP, recarga de habilidade e i-frames).
 */

import { playSfx, triggerHaptic } from '../../core/audio.js';
import { bullets, acidPuddles, enemies, setLastAttackerName } from '../../main.js';
import { triggerDeath } from '../../systems/ui.js';
import { selectedHeroKey } from '../player.js';

// ==========================================
// 1. GERENCIAMENTO DE SUB-ALVOS (LITOCISTOS)
// ==========================================

export function cleanupMonolithSubTargets(boss, targetList = enemies) {
  for (let i = targetList.length - 1; i >= 0; i--) {
    if (targetList[i].parentBoss === boss) {
      targetList.splice(i, 1);
    }
  }
}

export function spawnLitocistos(boss, count, orbHp, targetList = enemies) {
  cleanupMonolithSubTargets(boss, targetList);
  boss.orbitals = [];

  for (let k = 0; k < count; k++) {
    const angle = (k * Math.PI * 2) / count;
    const orbital = {
      angle: angle,
      dist: 114,
      radius: 17,
      hp: orbHp,
      maxHp: orbHp,
      active: true,
      hitFlash: 0,
      orbitalHitCd: 0,
      axeHitCd: 0,
      isBossSubTarget: true,
      baseType: 'LITOCISTO',
      color: '#e67e22',
      parentBoss: boss,
      x: boss.x + Math.cos(angle) * 114,
      y: boss.y + Math.sin(angle) * 114,
      pulseOffset: k * 1.5
    };
    boss.orbitals.push(orbital);
    targetList.push(orbital);
  }
}

// ==========================================
// 2. INICIALIZAÇÃO DO CHEFE
// ==========================================

export function initAbyssalMonolith(boss) {
  // Estados da FSM:
  // 'CHASE', 'WINDUP_SLAM', 'WINDUP_EPICENTER', 'PROPAGATING_SURGE', 'WINDUP_WHIRL',
  // 'WINDUP_FISSURE', 'WINDUP_BARRAGE', 'CHANNELING_SIPHON', 'RECOVERY', 'OVERHEAT_TRANSITION', 'POST_ATTACK_RECOVERY'
  boss.actionState = 'CHASE';
  boss.actionTimer = 0;
  boss.currentSkill = null;
  boss.lastUsedSkill = null;
  boss.skillCooldown = 50;

  // Velocidade Dinâmica Calibrada (Colosso Ativo)
  boss.speed = 1.35;
  boss.baseCombatSpeed = 1.35;

  // Mira e Controle de Esmagamento
  boss.aimAngle = 0;
  boss.aimLocked = false;
  boss.slamArc = Math.PI * 0.38; // ~135° frontal (costas 100% seguras)
  boss.slamRadius = 185;

  // Fila de Ações Agendadas
  boss.delayedActions = [];

  // Janelas de Vulnerabilidade e Colapso (4.5 segundos = 270 frames)
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;
  boss.prevHp = boss.hp;

  // Litocistos Tectônicos (Fase 1: 3 orbes com 2.800 HP)
  boss.orbitals = [];
  boss.orbitalAngularVelocity = 0.026;
  spawnLitocistos(boss, 3, 2800, enemies);

  // Fontes Termais no Solo
  boss.thermalVents = [];

  // Placas Tectônicas Articuladas
  boss.floatingPlates = [
    { angleOffset: 0.78, dist: 84, baseDist: 84, size: 26, wobblePhase: 0 },
    { angleOffset: 2.35, dist: 84, baseDist: 84, size: 24, wobblePhase: 1.5 },
    { angleOffset: 3.92, dist: 84, baseDist: 84, size: 27, wobblePhase: 3.0 },
    { angleOffset: 5.49, dist: 84, baseDist: 84, size: 24, wobblePhase: 4.5 }
  ];

  // Controle de Fases e Fúria
  boss.phase = 1;
  boss.hasTransitionedP2 = false;
  boss.isPhase3 = false;
  boss.isEnraged = false;

  // Temporizadores do Vórtice
  boss.pullTimer = 0;
  boss.pullMaxTimer = 0;

  // Animações Procedurais
  boss.floatBob = 0;
  boss.magmaPulse = 0;
  boss.heatIntensity = 0.3;
  boss.facing = 1;
}

// ==========================================
// 3. LOOP DE ATUALIZAÇÃO PRINCIPAL
// ==========================================

export function updateAbyssalMonolith(e, dt, context) {
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
  if (e.delayedActions && e.delayedActions.length > 0) {
    for (let i = e.delayedActions.length - 1; i >= 0; i--) {
      const action = e.delayedActions[i];
      action.timer -= dt;
      if (action.timer <= 0) {
        action.callback();
        e.delayedActions.splice(i, 1);
      }
    }
  }

  // 2. Ondulações Procedurais de Flutuação e Calor
  e.floatBob = Math.sin(frameCount * 0.05) * 5;
  e.magmaPulse = (Math.sin(frameCount * (e.isEnraged ? 0.18 : 0.09)) + 1) * 0.5;
  e.heatIntensity = e.isPhase3 ? 1.0 : (e.isEnraged ? 0.70 : 0.35);

  // Orientação horizontal dinâmica quando livre
  if (e.actionState !== 'POST_ATTACK_RECOVERY' && e.actionState !== 'RECOVERY' && !e.aimLocked) {
    e.facing = (player.x - e.x) >= 0 ? 1 : -1;
  }

  // 3. Atualização das Fontes Termais
  updateThermalVents(e, dt, context);

  // 4. Atualização das Orbes
  updateLitocistos(e, dt, context);

  // Redução de cooldown com orbes ativas
  const activeOrbitals = e.orbitals.filter(o => o.active);
  if (activeOrbitals.length > 0 && e.actionState === 'CHASE') {
    e.skillCooldown -= dt * (0.10 * activeOrbitals.length);
  }

  // 5. PROGRESSÃO DE FASES
  const hpRatio = e.hp / e.maxHp;

  // Fase 2: Sobrecarga Magmática (< 60% HP)
  if (hpRatio < 0.60 && !e.hasTransitionedP2) {
    e.hasTransitionedP2 = true;
    e.isEnraged = true;
    e.phase = 2;
    e.speed = 1.70;
    e.orbitalAngularVelocity *= 1.35;
    e.actionState = 'OVERHEAT_TRANSITION';
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

    spawnLitocistos(e, 4, 3400, enemies);
    return;
  }

  // Fase 3: Fusão Crítica (< 25% HP)
  if (hpRatio < 0.25 && !e.isPhase3) {
    e.isPhase3 = true;
    e.phase = 3;
    e.speed = 2.05;
    triggerShake(15);
    playSfx('boss');
    addDamageText(e.x, e.y, "FUSÃO CRÍTICA!", true, '#ff1744');
  }

  // Fagulhas e calor contínuo
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
    case 'OVERHEAT_TRANSITION': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 4 === 0) triggerShake(3.5);
      if (e.actionTimer <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = 28;
      }
      return;
    }

    // Colapso Sísmico (Stun de 4.5s após quebrar todos os Litocistos)
    case 'RECOVERY': {
      e.recoveryTimer -= dt;
      e.isVulnerable = true;

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
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 35 : 45;

        triggerShake(10);
        playSfx('boss');
        addDamageText(e.x, e.y, "SISTEMA RESTAURADO!", true, '#3498db');
      }
      return;
    }

    // Recuperação Pós-Ataque (Calibrada para 32-38 frames: punição justa sem deixar o boss inerte)
    case 'POST_ATTACK_RECOVERY': {
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
        e.actionState = 'CHASE';
        e.skillCooldown = e.isPhase3 ? 26 : (e.isEnraged ? 34 : 42);
        e.aimLocked = false;
      }
      return;
    }

    // ==========================================
    // SKILL 1: ESMAGAMENTO TECTÔNICO (TECTONIC SLAM)
    // ==========================================
    case 'WINDUP_SLAM': {
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
    case 'WINDUP_EPICENTER': {
      e.actionTimer -= dt;

      // Solo sob o chefe acumulando calor sob pressão
      if (Math.floor(frameCount) % 3 === 0) {
        const r = Math.random() * 105;
        const a = Math.random() * Math.PI * 2;
        createHitParticles(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, '#e74c3c', 1);
      }

      if (e.actionTimer <= 0) {
        // Explode o Epicentro e inicia a propagação da onda para o anel externo
        executeEpicenterEruption(e, context);
      }
      return;
    }

    case 'PROPAGATING_SURGE': {
      e.actionTimer -= dt;

      // A energia corre pelas fraturas do solo em direção ao anel externo
      if (Math.floor(frameCount) % 3 === 0) {
        const ringR = 150 + Math.random() * 90;
        const ang = Math.random() * Math.PI * 2;
        createHitParticles(e.x + Math.cos(ang) * ringR, e.y + Math.sin(ang) * ringR, '#f39c12', 1);
      }

      if (e.actionTimer <= 0) {
        // Explode a onda externa
        executeOuterSurge(e, context);
      }
      return;
    }

    // ==========================================
    // SKILL 3: VARREDURA DE PLACAS 360° (PLATE WHIRL)
    // ==========================================
    case 'WINDUP_WHIRL': {
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
    case 'CHANNELING_SIPHON': {
      e.pullTimer -= dt;

      const pdx = e.x - player.x;
      const pdy = e.y - player.y;
      const pDist = Math.hypot(pdx, pdy);

      if (pDist > 45 && pDist < 420) {
        const pullForce = (e.isEnraged ? 0.90 : 0.75) * dt;
        player.x += (pdx / pDist) * pullForce;
        player.y += (pdy / pDist) * pullForce;
      }

      if (Math.floor(frameCount) % 2 === 0) {
        triggerShake(1.2);
        const pAngle = Math.random() * Math.PI * 2;
        const spawnDist = 120 + Math.random() * 260;
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
    case 'WINDUP_FISSURE': {
      e.actionTimer -= dt;
      if (e.actionTimer > 12) {
        e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
      }
      if (Math.floor(frameCount) % 3 === 0) {
        const stepDist = 40 + Math.random() * 160;
        createHitParticles(e.x + Math.cos(e.aimAngle) * stepDist, e.y + Math.sin(e.aimAngle) * stepDist, '#e67e22', 1);
      }
      if (e.actionTimer <= 0) {
        executeVolcanicFissure(e, context);
      }
      return;
    }

    case 'WINDUP_BARRAGE': {
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
    case 'CHASE':
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
}

// ==========================================
// 4. LÓGICA DAS FONTES TERMAIS (RESIDUAL THERMAL VENTS)
// ==========================================

function updateThermalVents(boss, dt, context) {
  const { player, addDamageText, triggerShake, createHitParticles } = context;

  for (let i = boss.thermalVents.length - 1; i >= 0; i--) {
    const vent = boss.thermalVents[i];
    vent.life -= dt;

    if (vent.life <= 0 || !vent.active) {
      boss.thermalVents.splice(i, 1);
      continue;
    }

    const distToPlayer = Math.hypot(player.x - vent.x, player.y - vent.y);
    if (distToPlayer < vent.radius + player.radius) {
      vent.active = false;

      // Recompensa Tática
      player.skillCd = 0;
      const healAmount = 25;
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      player.iFrames = Math.max(player.iFrames || 0, 24);

      playSfx('powerup');
      triggerShake(5);
      triggerHaptic('medium');

      addDamageText(player.x, player.y, `+${healAmount} HP`, true, '#2ecc71');
      addDamageText(player.x, player.y - 18, "HABILIDADE RECARREGADA!", true, '#f1c40f');

      for (let p = 0; p < 18; p++) {
        createHitParticles(player.x, player.y, '#f1c40f', 1);
        createHitParticles(player.x, player.y, '#2ecc71', 1);
      }
    }
  }
}

// ==========================================
// 5. ATUALIZAÇÃO E QUEBRA DOS LITOCISTOS
// ==========================================

function updateLitocistos(e, dt, context) {
  const bob = e.isVulnerable ? 24 : (e.floatBob || 0);

  for (let o of e.orbitals) {
    if (o.hitFlash > 0) o.hitFlash -= dt;
    if (o.orbitalHitCd > 0) o.orbitalHitCd -= dt;
    if (o.axeHitCd > 0) o.axeHitCd -= dt;

    if (!o.active) continue;

    o.angle += e.orbitalAngularVelocity * dt;
    o.x = e.x + Math.cos(o.angle) * o.dist;
    o.y = e.y + Math.sin(o.angle) * o.dist + bob;

    if (o.hp <= 0) {
      destroyLitocisto(e, o, o.x, o.y, context);
    }
  }
}

function destroyLitocisto(boss, o, ox, oy, context) {
  o.active = false;

  const idx = enemies.indexOf(o);
  if (idx !== -1) enemies.splice(idx, 1);

  const backlashDmg = Math.round(boss.maxHp * 0.05);
  boss.hp -= backlashDmg;

  playSfx('shatter');
  context.triggerShake(12);
  triggerHaptic('heavy');
  context.createHitParticles(ox, oy, '#d35400', 18);
  context.createHitParticles(ox, oy, '#f1c40f', 14);
  context.addDamageText(boss.x, boss.y, backlashDmg, true, '#f1c40f');
  context.addDamageText(ox, oy, "LITOCISTO QUEBRADO!", true, '#e67e22');

  boss.thermalVents.push({
    x: ox,
    y: oy,
    radius: 32,
    life: 660,
    maxLife: 660,
    active: true,
    pulsePhase: Math.random() * Math.PI * 2
  });

  const activeRemaining = boss.orbitals.filter(item => item.active).length;
  if (activeRemaining === 0 && boss.actionState !== 'RECOVERY' && boss.actionState !== 'OVERHEAT_TRANSITION') {
    boss.actionState = 'RECOVERY';
    boss.recoveryTimer = 270; // 4.5 segundos
    boss.isVulnerable = true;

    context.triggerShake(16);
    triggerHaptic('heavy');
    playSfx('boss');
    context.addDamageText(boss.x, boss.y, "COLAPSO SÍSMICO!", true, '#f1c40f');
  }
}

// ==========================================
// 6. IA DE COMBATE EQUILIBRADA & INTELIGENTE
// ==========================================

function selectNextSkill(e, dist) {
  const isEnraged = e.isEnraged;
  const isP3 = e.isPhase3;
  const rand = Math.random();

  // Em alcance Melee (< 190px):
  if (dist < 190) {
    // 50% Esmagamento Frontal (com zona cega nas costas)
    // 30% Erupção do Epicentro (solo sob o boss racha)
    // 20% Varredura de Placas 360° (evita que melee fique colado passivamente)
    if (e.lastUsedSkill !== 'TECTONIC_SLAM' && (rand < 0.50 || e.lastUsedSkill === 'EPICENTER_SURGE')) {
      e.currentSkill = 'TECTONIC_SLAM';
      e.actionState = 'WINDUP_SLAM';
      e.actionTimer = isP3 ? 34 : (isEnraged ? 40 : 48);
    } else if (rand < 0.80) {
      e.currentSkill = 'EPICENTER_SURGE';
      e.actionState = 'WINDUP_EPICENTER';
      e.actionTimer = isP3 ? 42 : (isEnraged ? 48 : 56);
    } else {
      e.currentSkill = 'PLATE_WHIRL';
      e.actionState = 'WINDUP_WHIRL';
      e.actionTimer = isP3 ? 28 : (isEnraged ? 32 : 38);
    }
  }
  // Em alcance Médio (190px a 320px):
  else if (dist <= 320) {
    if (rand < 0.40 && e.lastUsedSkill !== 'EPICENTER_SURGE') {
      e.currentSkill = 'EPICENTER_SURGE';
      e.actionState = 'WINDUP_EPICENTER';
      e.actionTimer = isP3 ? 42 : (isEnraged ? 48 : 56);
    } else if (rand < 0.70) {
      e.currentSkill = 'VOLCANIC_FISSURE';
      e.actionState = 'WINDUP_FISSURE';
      e.actionTimer = isP3 ? 26 : (isEnraged ? 30 : 38);
    } else {
      e.currentSkill = 'BASALT_BARRAGE';
      e.actionState = 'WINDUP_BARRAGE';
      e.actionTimer = isP3 ? 24 : (isEnraged ? 28 : 36);
    }
  }
  // Em Longa Distância (> 320px):
  else {
    if ((isEnraged || isP3) && rand < 0.45 && e.lastUsedSkill !== 'MAGMA_SIPHON') {
      e.currentSkill = 'MAGMA_SIPHON';
      e.actionState = 'CHANNELING_SIPHON';
      e.pullTimer = isP3 ? 60 : (isEnraged ? 70 : 82);
      e.pullMaxTimer = e.pullTimer;
    } else if (rand < 0.75) {
      e.currentSkill = 'BASALT_BARRAGE';
      e.actionState = 'WINDUP_BARRAGE';
      e.actionTimer = isP3 ? 24 : (isEnraged ? 28 : 36);
    } else {
      e.currentSkill = 'VOLCANIC_FISSURE';
      e.actionState = 'WINDUP_FISSURE';
      e.actionTimer = isP3 ? 26 : (isEnraged ? 30 : 38);
    }
  }

  e.lastUsedSkill = e.currentSkill;
}

// ==========================================
// 7. EXECUÇÃO DOS ATAQUES RECALIBRADOS
// ==========================================

/**
 * SKILL 1: ESMAGAMENTO TECTÔNICO (TECTONIC SLAM)
 * Dano aumentado para 75-88.
 * Possui avanço frontal de 20px no impacto e zona cega nas costas.
 */
function executeTectonicSlam(e, context) {
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
  if (pDist <= e.slamRadius && angleDiff <= e.slamArc && player.iFrames <= 0) {
    let slamDamage = e.isPhase3 ? 88 : (e.isEnraged ? 82 : 75);
    if (selectedHeroKey === 'KNIGHT') slamDamage = Math.round(slamDamage * 0.80);

    player.hp -= slamDamage;
    player.iFrames = 26;
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

  // Na Fase 2/3: solta 3 fendas em leque para frente
  if (e.isEnraged || e.isPhase3) {
    const fCount = 3;
    const fSpread = 0.34;
    for (let f = 0; f < fCount; f++) {
      const fAng = e.aimAngle + (f - 1) * fSpread;
      for (let n = 1; n <= 3; n++) {
        const nodeDist = impactDist + n * 48;
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
          timer: 18 + n * 6,
          maxTimer: 18 + n * 6,
          damage: Math.round(e.damage * 0.38)
        });
      }
    }
  }

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = e.isPhase3 ? 30 : (e.isEnraged ? 34 : 40);
}

/**
 * SKILL 2 (PASSO 1): ERUPÇÃO DO EPICENTRO
 * O solo sob o chefe explode (0 a 115px). Causa 65 de dano.
 * Imediatamente inicia a propagação da onda para o anel externo.
 */
function executeEpicenterEruption(e, context) {
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
  if (pDist < 115 && player.iFrames <= 0) {
    let epicenterDmg = e.isPhase3 ? 75 : (e.isEnraged ? 70 : 65);
    if (selectedHeroKey === 'KNIGHT') epicenterDmg = Math.round(epicenterDmg * 0.80);

    player.hp -= epicenterDmg;
    player.iFrames = 26;
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

  // Transita para a propagação da onda externa (45 frames de tempo de aviso)
  e.actionState = 'PROPAGATING_SURGE';
  e.actionTimer = e.isPhase3 ? 32 : (e.isEnraged ? 38 : 45);
}

/**
 * SKILL 2 (PASSO 2): ONDA EXTERNA DE BASALTO
 * O solo sob o chefe já esfriou e está seguro!
 * O anel externo (145px a 245px) detona agora, causando 55 de dano.
 */
function executeOuterSurge(e, context) {
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
    let surgeDmg = e.isPhase3 ? 62 : (e.isEnraged ? 58 : 52);
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

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = e.isPhase3 ? 28 : (e.isEnraged ? 32 : 38);
}

/**
 * SKILL 3: VARREDURA DE PLACAS 360° (PLATE WHIRL)
 * As placas abrem em lâminas circulares e giram velozes ao redor do corpo.
 */
function executePlateWhirl(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  playSfx('hit');
  triggerShake(10);
  triggerHaptic('medium');

  for (let p = 0; p < 24; p++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 30;
    createHitParticles(e.x + Math.cos(ang) * dist, e.y + Math.sin(ang) * dist, '#ff4757', 1);
  }

  const pDist = Math.hypot(player.x - e.x, player.y - e.y);
  if (pDist <= 110 && player.iFrames <= 0) {
    let whirlDmg = e.isPhase3 ? 55 : (e.isEnraged ? 50 : 45);
    if (selectedHeroKey === 'KNIGHT') whirlDmg = Math.round(whirlDmg * 0.80);

    player.hp -= whirlDmg;
    player.iFrames = 25;
    setLastAttackerName("Varredura de Basalto");
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

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = 32;
}

/**
 * SKILL 4: VÓRTICE DA CALDEIRA (MAGMA SIPHON)
 */
function executeMagmaSiphonRelease(e, context) {
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
          const sAng = waveOffset + (s * Math.PI * 2) / shardCount;
          enemyBullets.push({
            x: e.x + Math.cos(sAng) * 65,
            y: e.y + Math.sin(sAng) * 65,
            vx: Math.cos(sAng) * (3.2 + w * 0.35),
            vy: Math.sin(sAng) * (3.2 + w * 0.35),
            radius: 6.5,
            damage: 26,
            life: 110,
            color: '#e67e22'
          });
        }
      }
    });
  }

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = 38;
}

/**
 * SKILL 5: FENDAS VULCÂNICAS (VOLCANIC FISSURE)
 */
function executeVolcanicFissure(e, context) {
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
    const nodeCount = 4;
    for (let n = 1; n <= nodeCount; n++) {
      const distNode = n * 65;
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
        radius: 28,
        timer: 26 + n * 7,
        maxTimer: 26 + n * 7,
        damage: 42
      });
    }
  }

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = e.isPhase3 ? 34 : (e.isEnraged ? 38 : 44);
}

/**
 * SKILL 6: ARTILHARIA DE BASALTO (BASALT BARRAGE)
 */
function executeBasaltBarrage(e, context) {
  const { player, bossTelegraphs, triggerShake } = context;

  playSfx('shoot');
  triggerShake(6);

  const impactCount = e.isPhase3 ? 5 : (e.isEnraged ? 4 : 3);
  for (let m = 0; m < impactCount; m++) {
    const offsetAng = (m * Math.PI * 2) / impactCount + Math.random() * 0.4;
    const offsetDist = 55 + Math.random() * 85;
    const targetX = player.x + Math.cos(offsetAng) * offsetDist;
    const targetY = player.y + Math.sin(offsetAng) * offsetDist;

    bossTelegraphs.push({
      type: 'FALLING_ROCK',
      x: targetX,
      y: targetY,
      radius: 42,
      timer: 36 + m * 7,
      maxTimer: 36 + m * 7,
      damage: 48
    });
  }

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = 36;
}

// ==========================================
// 8. RENDERIZAÇÃO PROCEDURAL ARTÍSTICA
// ==========================================

function drawShadow(ctx, e, bob, isVuln) {
  const shadowY = 56 + (isVuln ? 12 : 0);
  const shadowRadius = (e.radius * 0.90) - (isVuln ? 0 : bob * 0.35);

  const grad = ctx.createRadialGradient(0, shadowY, 6, 0, shadowY, shadowRadius);
  grad.addColorStop(0, 'rgba(15, 8, 6, 0.70)');
  grad.addColorStop(0.65, 'rgba(25, 12, 8, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowRadius, shadowRadius * 0.40, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawThermalVents(ctx, boss, frameCount) {
  for (let vent of boss.thermalVents) {
    if (!vent.active) continue;

    const relX = vent.x - boss.x;
    const relY = vent.y - boss.y;
    const pulse = Math.sin(frameCount * 0.08 + vent.pulsePhase) * 3;
    const curR = vent.radius + pulse;

    ctx.save();
    const grad = ctx.createRadialGradient(relX, relY, 4, relX, relY, curR);
    grad.addColorStop(0, 'rgba(241, 196, 15, 0.40)');
    grad.addColorStop(0.5, 'rgba(230, 126, 34, 0.20)');
    grad.addColorStop(1, 'rgba(211, 84, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(relX, relY, curR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(241, 196, 15, ${0.45 + pulse * 0.08})`;
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(relX, relY, curR * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2c3e50';
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(relX, relY - 12);
    ctx.lineTo(relX + 7, relY - 2);
    ctx.lineTo(relX, relY + 10);
    ctx.lineTo(relX - 7, relY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(relX, relY - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Desenha telegrafias animadas com clareza visual impecável.
 */
function drawTelegraphsAndZones(ctx, e, frameCount) {
  // 1. Telegrafia do Esmagamento Frontal (Cone com Rachaduras)
  if (e.actionState === 'WINDUP_SLAM') {
    const maxTimer = e.isPhase3 ? 34 : (e.isEnraged ? 40 : 48);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const aim = e.aimAngle || 0;
    const arcHalf = e.slamArc;
    const r = e.slamRadius;

    ctx.save();
    // Fundo do cone em brasa
    ctx.fillStyle = `rgba(231, 76, 60, ${0.12 + progress * 0.35})`;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.arc(0, 20, r, aim - arcHalf, aim + arcHalf);
    ctx.closePath();
    ctx.fill();

    // Contorno
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : (e.aimLocked ? '#ff1744' : '#f39c12');
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.arc(0, 20, r, aim - arcHalf, aim + arcHalf);
    ctx.stroke();

    // Linhas de fratura internas no cone
    const spineCount = 5;
    ctx.strokeStyle = `rgba(255, 234, 167, ${0.3 + progress * 0.6})`;
    ctx.lineWidth = 1.8;
    for (let s = 0; s < spineCount; s++) {
      const fracAng = aim - arcHalf + (s / (spineCount - 1)) * (arcHalf * 2);
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(Math.cos(fracAng) * (r * progress), 20 + Math.sin(fracAng) * (r * progress));
      ctx.stroke();
    }

    // Indicador visual de Mira Travada (Lock-in)
    if (e.aimLocked) {
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(Math.cos(aim) * (r * 0.75), 20 + Math.sin(aim) * (r * 0.75), 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Telegrafia do EPICENTRO (Solo sob o chefe rachando)
  if (e.actionState === 'WINDUP_EPICENTER') {
    const maxTimer = e.isPhase3 ? 42 : (e.isEnraged ? 48 : 56);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const coreR = 115;

    ctx.save();
    // Chão sob o boss brilhando em calor crescente
    const epicGrad = ctx.createRadialGradient(0, 20, 10, 0, 20, coreR);
    epicGrad.addColorStop(0, `rgba(255, 23, 68, ${0.25 + progress * 0.45})`);
    epicGrad.addColorStop(0.7, `rgba(230, 126, 34, ${0.15 + progress * 0.35})`);
    epicGrad.addColorStop(1, 'rgba(211, 84, 0, 0)');
    ctx.fillStyle = epicGrad;
    ctx.beginPath();
    ctx.arc(0, 20, coreR, 0, Math.PI * 2);
    ctx.fill();

    // Linhas de fratura em zig-zag sob o boss
    const crackCount = 8;
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#ff4757';
    ctx.lineWidth = 2.4;
    for (let c = 0; c < crackCount; c++) {
      const ca = (c * Math.PI * 2) / crackCount;
      const cDist = coreR * (0.3 + progress * 0.7);
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(Math.cos(ca) * (cDist * 0.5) + (c % 2 === 0 ? 5 : -5), 20 + Math.sin(ca) * (cDist * 0.5));
      ctx.lineTo(Math.cos(ca) * cDist, 20 + Math.sin(ca) * cDist);
      ctx.stroke();
    }

    // Anel de aviso que contrai indicando o momento exato da explosão
    const contractR = coreR + (coreR * 0.6) * (1 - progress);
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#f39c12';
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.2;
    ctx.beginPath();
    ctx.arc(0, 20, contractR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Telegrafia da ONDA EXTERNA (O centro já explodiu e é SEGURO; o anel externo vai estourar!)
  if (e.actionState === 'PROPAGATING_SURGE') {
    const maxTimer = e.isPhase3 ? 32 : (e.isEnraged ? 38 : 45);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));

    ctx.save();
    // Centro Seguro (Safe Zone de 0 a 115px) sinalizado com contorno verde/dourado suave
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.75)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 20, 115, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Anel Externo de Perigo (140px a 245px) com expansão e estacas de pedra
    ctx.fillStyle = `rgba(230, 126, 34, ${0.10 + progress * 0.30})`;
    ctx.beginPath();
    ctx.arc(0, 20, 245, 0, Math.PI * 2);
    ctx.arc(0, 20, 140, 0, Math.PI * 2, true);
    ctx.fill();

    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#ff4757';
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.arc(0, 20, 140 + (245 - 140) * progress, 0, Math.PI * 2);
    ctx.stroke();

    // Estacas de basalto emergindo no anel externo
    const spikeCount = 12;
    ctx.fillStyle = '#2c3e50';
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1.5;
    for (let sp = 0; sp < spikeCount; sp++) {
      const sa = (sp * Math.PI * 2) / spikeCount + (frameCount * 0.01);
      const sDist = 190;
      const sx = Math.cos(sa) * sDist;
      const sy = 20 + Math.sin(sa) * sDist;
      const spikeH = 14 * progress;

      ctx.beginPath();
      ctx.moveTo(sx - 6, sy);
      ctx.lineTo(sx, sy - spikeH);
      ctx.lineTo(sx + 6, sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Telegrafia da Varredura de Placas (Plate Whirl)
  if (e.actionState === 'WINDUP_WHIRL') {
    const maxTimer = e.isPhase3 ? 28 : (e.isEnraged ? 32 : 38);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const whirlR = 105;

    ctx.save();
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#ff1744';
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.2;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, 20, whirlR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(255, 23, 68, ${0.12 + progress * 0.28})`;
    ctx.beginPath();
    ctx.arc(0, 20, whirlR * progress, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup) {
  const isP3 = e.isPhase3;

  let plateColDark = isVuln ? '#151b1e' : (isP3 ? '#3a080d' : (isEnraged ? '#2d0f12' : '#1e272e'));
  let plateColLight = isVuln ? '#242b30' : (isP3 ? '#5c1018' : (isEnraged ? '#45161b' : '#2f3640'));
  let trimCol = isVuln ? '#57606f' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22'));

  for (let i = 0; i < e.floatingPlates.length; i++) {
    const p = e.floatingPlates[i];
    let px = 0;
    let py = 0;
    let rot = 0;

    if (e.actionState === 'WINDUP_SLAM') {
      // Martelos erguidos no alto
      const lift = Math.sin(frameCount * 0.3) * 4;
      const spread = (i - 1.5) * 22;
      px = spread;
      py = -82 + bob + lift + Math.abs(spread) * 0.25;
      rot = spread / 45;
    } else if (e.actionState === 'WINDUP_EPICENTER') {
      // Placas fincadas na base
      const pAng = p.angleOffset + frameCount * 0.02;
      px = Math.cos(pAng) * 72;
      py = 32 + bob + Math.sin(pAng) * 20;
      rot = pAng;
    } else if (e.actionState === 'WINDUP_WHIRL') {
      // Placas girando em lâminas afiadas
      const spinAng = p.angleOffset + frameCount * 0.25;
      px = Math.cos(spinAng) * 95;
      py = Math.sin(spinAng) * 55 + bob;
      rot = spinAng + Math.PI / 2;
    } else if (e.actionState === 'CHANNELING_SIPHON') {
      const fastAng = p.angleOffset - frameCount * 0.14;
      px = Math.cos(fastAng) * 65;
      py = Math.sin(fastAng) * 36 + bob;
      rot = fastAng + Math.PI / 2;
    } else if (isVuln) {
      const fallOffset = (i - 1.5) * 36;
      px = fallOffset;
      py = 48 + bob + (i % 2 === 0 ? 8 : -4);
      rot = (i - 1.5) * 0.35;
    } else {
      const pAng = p.angleOffset + (frameCount * (isP3 ? 0.032 : (isEnraged ? 0.024 : 0.016)));
      const wobble = Math.sin(frameCount * 0.08 + p.wobblePhase) * 4.5;
      const currentDist = p.baseDist + wobble;
      px = Math.cos(pAng) * currentDist;
      py = (Math.sin(pAng) * (currentDist * 0.45)) + bob;
      rot = pAng + Math.PI / 2;
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);

    const sz = p.size;
    ctx.fillStyle = plateColDark;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.6, -sz * 0.5);
    ctx.lineTo(sz * 0.6, -sz * 0.5);
    ctx.lineTo(sz * 0.4, sz * 0.5);
    ctx.lineTo(-sz * 0.4, sz * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = plateColLight;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.6, -sz * 0.5);
    ctx.lineTo(0, -sz * 0.3);
    ctx.lineTo(sz * 0.6, -sz * 0.5);
    ctx.closePath();
    ctx.fill();

    if (!isVuln) {
      ctx.strokeStyle = trimCol;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.25, 0);
      ctx.lineTo(sz * 0.25, 0);
      ctx.moveTo(0, -sz * 0.25);
      ctx.lineTo(0, sz * 0.25);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged, isP3) {
  const basaltShadow = isVuln ? '#0e1214' : (isP3 ? '#1c0306' : (isEnraged ? '#1e0508' : '#1a2228'));
  const basaltMid    = isVuln ? '#1a2126' : (isP3 ? '#2e070c' : (isEnraged ? '#2c080d' : '#27313a'));
  const basaltLight  = isVuln ? '#28333b' : (isP3 ? '#4a0d14' : (isEnraged ? '#420f15' : '#3d4b56'));
  const edgeTrim     = isVuln ? '#4b5760' : (isP3 ? '#ff3838' : (isEnraged ? '#ff4757' : '#718093'));

  const topY = -64 + bob;
  const waistY = -6 + bob;
  const botY = 48 + bob;

  ctx.fillStyle = basaltShadow;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-44, waistY);
  ctx.lineTo(-24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = basaltLight;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(44, waistY);
  ctx.lineTo(24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = basaltMid;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-18, waistY + 4);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(18, waistY + 4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = edgeTrim;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-44, waistY);
  ctx.lineTo(-24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(24, botY);
  ctx.lineTo(44, waistY);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(0, botY + 6);
  ctx.stroke();

  drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged, isP3);
}

function drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged, isP3) {
  if (isVuln) {
    ctx.strokeStyle = '#273c75';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-12, -32 + bob);
    ctx.lineTo(-24, -10 + bob);
    ctx.lineTo(-10, 16 + bob);
    ctx.moveTo(12, -32 + bob);
    ctx.lineTo(24, -10 + bob);
    ctx.lineTo(10, 16 + bob);
    ctx.stroke();
    return;
  }

  const pulse = Math.sin(frameCount * (isP3 ? 0.24 : (isEnraged ? 0.18 : 0.09)));
  const veinColPrimary = isP3 ? '#ff1744' : (isEnraged ? '#e74c3c' : '#d35400');
  const veinColGlow    = isP3 ? '#ff9f43' : (isEnraged ? '#f1c40f' : '#f39c12');

  ctx.strokeStyle = veinColPrimary;
  ctx.lineWidth = 2.4 + pulse * 0.7;
  ctx.beginPath();

  ctx.moveTo(-6, -44 + bob);
  ctx.lineTo(-26, -14 + bob);
  ctx.lineTo(-14, 22 + bob);

  ctx.moveTo(6, -44 + bob);
  ctx.lineTo(26, -14 + bob);
  ctx.lineTo(14, 22 + bob);

  ctx.moveTo(-10, 32 + bob);
  ctx.lineTo(0, 44 + bob);
  ctx.lineTo(10, 32 + bob);
  ctx.stroke();

  ctx.strokeStyle = veinColGlow;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isChanneling, isWindup) {
  const coreY = -4 + bob;
  let coreBaseRadius = isVuln ? 9 : (isChanneling ? 27 : 17);
  if (isWindup) coreBaseRadius += 4;

  const pulse = isVuln ? 0 : Math.sin(frameCount * (isP3 ? 0.28 : (isEnraged ? 0.20 : 0.12))) * 2.8;
  const currentR = Math.max(6, coreBaseRadius + pulse);

  ctx.strokeStyle = isVuln ? '#2f3640' : (isChanneling ? '#e67e22' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#f39c12')));
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, coreY, currentR + 4, 0, Math.PI * 2);
  ctx.stroke();

  const grad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, currentR);
  if (isVuln) {
    grad.addColorStop(0, '#57606f');
    grad.addColorStop(0.7, '#1e272e');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else if (isP3) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ff4757');
    grad.addColorStop(0.8, '#8b0000');
    grad.addColorStop(1, 'rgba(139, 0, 0, 0)');
  } else if (isEnraged || isChanneling) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, '#ff9f43');
    grad.addColorStop(0.85, '#c0392b');
    grad.addColorStop(1, 'rgba(192, 57, 43, 0)');
  } else {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#f1c40f');
    grad.addColorStop(0.85, '#d35400');
    grad.addColorStop(1, 'rgba(211, 84, 0, 0)');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, coreY, currentR, 0, Math.PI * 2);
  ctx.fill();

  if (!isVuln) {
    ctx.fillStyle = '#1e0508';
    ctx.beginPath();
    ctx.ellipse(0, coreY, 2.5, currentR * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLitocistos(ctx, e, bob, frameCount, isEnraged, isP3) {
  const coreY = -4 + bob;

  for (let o of e.orbitals) {
    if (!o.active) continue;

    const ox = Math.cos(o.angle) * o.dist;
    const oy = Math.sin(o.angle) * o.dist + bob;

    ctx.save();
    ctx.strokeStyle = isP3 ? 'rgba(255, 23, 68, 0.45)' : (isEnraged ? 'rgba(255, 71, 87, 0.40)' : 'rgba(230, 126, 34, 0.35)');
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, coreY);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(ox, oy);

    if (o.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, o.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = isP3 ? '#3d080c' : (isEnraged ? '#2d0f12' : '#2f3640');
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22');
      ctx.lineWidth = 2.0;
      ctx.stroke();

      const orbGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, o.radius * 0.65);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.5, isP3 ? '#ff4d4d' : (isEnraged ? '#ff6b81' : '#f1c40f'));
      orbGrad.addColorStop(1, isP3 ? '#8b0000' : (isEnraged ? '#c0392b' : '#d35400'));
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      const hpPct = Math.max(0, o.hp / o.maxHp);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius + 4, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPct));
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ==========================================
// 9. FUNÇÃO DE DESENHO EXPORTADA
// ==========================================

export function drawAbyssalMonolith(ctx, e, frameCount) {
  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged;
  const isP3 = e.isPhase3;
  const isWindup = e.actionState.startsWith('WINDUP');
  const isChanneling = e.actionState === 'CHANNELING_SIPHON';

  const bob = isVuln ? 24 : (e.floatBob || 0);

  // 1. Elementos em Coordenadas de Mundo Absolutas (Desespelhadas)
  ctx.save();
  if (e.facing === -1) {
    ctx.scale(-1, 1);
  }

  // Renderização das Fontes Termais no Solo
  drawThermalVents(ctx, e, frameCount);

  // Telegrafias exclusivas do chefe (Epicentro, Onda de Fendas, Slam e Giro)
  drawTelegraphsAndZones(ctx, e, frameCount);

  // Orbes Orbitais (Litocistos)
  drawLitocistos(ctx, e, bob, frameCount, isEnraged, isP3);

  ctx.restore();

  // 2. Renderização do Corpo do Chefe (Orientado em e.facing)
  ctx.save();

  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.8);
  }

  drawShadow(ctx, e, bob, isVuln);
  drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup);
  drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged, isP3);
  drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isChanneling, isWindup);

  ctx.restore();
}