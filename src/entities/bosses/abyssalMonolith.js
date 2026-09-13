/**
 * src/entities/bosses/abyssalMonolith.js
 * Módulo de Comportamento, Mecânica e Renderização Procedural:
 * "Ignis Lithos, o Titã de Basalto" (bossId: 2)
 *
 * Redesign Completo:
 * 1. Paridade Melee/Ranged: Substituição da onda de choque unilateral por
 *    Esmagamento Tectônico Frontal (zona cega nas costas) e Anéis de Ressonância (Donut Ripples com zonas seguras).
 * 2. Orbes Estratégicas: Destruição dos Litocistos gera Fontes Termais no solo que restauram a habilidade do herói e curam HP.
 * 3. 3 Fases Evolutivas: Despertar do Basalto (Fase 1), Sobrecarga Magmática (Fase 2) e Cataclismo de Obsidiana (Fase 3).
 * 4. Apresentação Visual e Cinemática Procedural: Placas tectônicas cinéticas, iluminação de chanfro e núcleo de caldeira vivo.
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
      dist: 112,
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
      x: boss.x + Math.cos(angle) * 112,
      y: boss.y + Math.sin(angle) * 112,
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
  // FSM de Ações: 'CHASE', 'WINDUP_SLAM', 'WINDUP_DONUT', 'DONUT_STEP_1', 'DONUT_STEP_2',
  // 'WINDUP_FISSURE', 'CHANNELING_SIPHON', 'RECOVERY', 'OVERHEAT_TRANSITION', 'POST_ATTACK_RECOVERY'
  boss.actionState = 'CHASE';
  boss.actionTimer = 0;
  boss.currentSkill = null; // 'TECTONIC_SLAM', 'DONUT_RIPPLE', 'MAGMA_SIPHON', 'VOLCANIC_FISSURE', 'BASALT_BARRAGE'
  boss.lastUsedSkill = null;
  boss.skillCooldown = 80;

  // Mira e Controle Direcional Justo
  boss.aimAngle = 0;
  boss.aimLocked = false;
  boss.slamArc = Math.PI * 0.38; // Arco de ~135° no cone frontal (costas são 100% seguras)
  boss.slamRadius = 180;

  // Controle de Anéis Concêntricos (Donut Ripples)
  boss.donutStep = 1;
  boss.donutTimer = 0;

  // Fila de Ações Agendadas
  boss.delayedActions = [];

  // Janelas de Vulnerabilidade e Colapso (5.2 segundos = 312 frames)
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;
  boss.prevHp = boss.hp;

  // Litocistos Tectônicos como Sub-Alvos (Fase 1: 3 orbes com 2.600 HP)
  boss.orbitals = [];
  boss.orbitalAngularVelocity = 0.024;
  spawnLitocistos(boss, 3, 2600, enemies);

  // Fontes Termais no Solo deixadas pela destruição dos Litocistos
  boss.thermalVents = [];

  // Placas Tectônicas Articuladas (Cinética e Postura Procedural)
  boss.floatingPlates = [
    { angleOffset: 0.78, dist: 84, baseDist: 84, size: 26, wobblePhase: 0, liftY: 0, rotOffset: 0 },
    { angleOffset: 2.35, dist: 84, baseDist: 84, size: 24, wobblePhase: 1.5, liftY: 0, rotOffset: 0 },
    { angleOffset: 3.92, dist: 84, baseDist: 84, size: 27, wobblePhase: 3.0, liftY: 0, rotOffset: 0 },
    { angleOffset: 5.49, dist: 84, baseDist: 84, size: 24, wobblePhase: 4.5, liftY: 0, rotOffset: 0 }
  ];

  // Controle de Fases e Calor Tectônico
  boss.phase = 1;
  boss.hasTransitionedP2 = false;
  boss.isPhase3 = false;
  boss.isEnraged = false;

  // Temporizadores de Efeito Ciclônico
  boss.pullTimer = 0;
  boss.pullMaxTimer = 0;

  // Animações Procedurais e Balanço Físico
  boss.floatBob = 0;
  boss.magmaPulse = 0;
  boss.heatIntensity = 0;
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

  // 2. Ondulações Procedurais de Calor e Flutuação
  e.floatBob = Math.sin(frameCount * 0.045) * 5;
  e.magmaPulse = (Math.sin(frameCount * (e.isEnraged ? 0.16 : 0.08)) + 1) * 0.5;
  e.heatIntensity = e.isPhase3 ? 1.0 : (e.isEnraged ? 0.65 : 0.3);

  // Orientação horizontal apenas quando não estiver travado golpeando
  if (e.actionState !== 'POST_ATTACK_RECOVERY' && e.actionState !== 'RECOVERY' && !e.aimLocked) {
    e.facing = (player.x - e.x) >= 0 ? 1 : -1;
  }

  // 3. Atualização das Fontes Termais no Solo (Thermal Vents)
  updateThermalVents(e, dt, context);

  // 4. Atualização e Sincronia dos Litocistos
  updateLitocistos(e, dt, context);

  // Bônus moderado de recarga se houver Litocistos ativos durante o modo de perseguição
  const activeOrbitals = e.orbitals.filter(o => o.active);
  if (activeOrbitals.length > 0 && e.actionState === 'CHASE') {
    e.skillCooldown -= dt * (0.12 * activeOrbitals.length);
  }

  // 5. PROGRESSÃO DE FASES
  const hpRatio = e.hp / e.maxHp;

  // Transição para FASE 2: Sobrecarga Magmática (< 60% HP)
  if (hpRatio < 0.60 && !e.hasTransitionedP2) {
    e.hasTransitionedP2 = true;
    e.isEnraged = true;
    e.phase = 2;
    e.speed *= 1.25;
    e.orbitalAngularVelocity *= 1.4;
    e.actionState = 'OVERHEAT_TRANSITION';
    e.actionTimer = 65;
    e.isVulnerable = false;

    triggerShake(18);
    triggerHaptic('heavy');
    playSfx('boss');
    addDamageText(e.x, e.y, "SOBRECARGA MAGMÁTICA!", true, '#e74c3c');

    // Desprende fagulhas vulcânicas e magma no ambiente
    for (let p = 0; p < 35; p++) {
      createHitParticles(e.x, e.y, '#e74c3c', 1);
      createHitParticles(e.x, e.y, '#f39c12', 1);
    }

    // Respawn de 4 Litocistos com 3.200 HP na Fase 2
    spawnLitocistos(e, 4, 3200, enemies);
    return;
  }

  // Transição para FASE 3: Cataclismo de Obsidiana (< 25% HP)
  if (hpRatio < 0.25 && !e.isPhase3) {
    e.isPhase3 = true;
    e.phase = 3;
    e.speed *= 1.10;
    triggerShake(14);
    playSfx('boss');
    addDamageText(e.x, e.y, "FUSÃO CRÍTICA!", true, '#ff1744');
  }

  // Efeito passivo de calor e fagulhas em Fúria
  if (e.isEnraged && Math.floor(frameCount) % 6 === 0) {
    createHitParticles(
      e.x + (Math.random() - 0.5) * e.radius * 1.4,
      e.y + (Math.random() - 0.5) * e.radius * 1.4,
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
        e.skillCooldown = 35;
      }
      return;
    }

    // Janela de Colapso Sísmico (Stun de 5.2s após quebrar todos os Litocistos)
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
        e.skillCooldown = e.isEnraged ? 45 : 65;

        triggerShake(10);
        playSfx('boss');
        addDamageText(e.x, e.y, "SISTEMA RESTAURADO!", true, '#3498db');
      }
      return;
    }

    // Janela de Recuperação Pós-Ataque (punição livre para o jogador)
    case 'POST_ATTACK_RECOVERY': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 8 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius,
          e.y + (Math.random() - 0.5) * e.radius,
          '#f39c12',
          1
        );
      }
      if (e.actionTimer <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = e.isPhase3 ? 38 : (e.isEnraged ? 48 : 65);
        e.aimLocked = false;
      }
      return;
    }

    // ==========================================
    // SKILL 1: ESMAGAMENTO TECTÔNICO (TECTONIC SLAM)
    // ==========================================
    case 'WINDUP_SLAM': {
      e.actionTimer -= dt;

      // Nos primeiros 65% do windup, o chefe acompanha o jogador suavemente
      const lockThreshold = e.isEnraged ? 15 : 20;
      if (e.actionTimer > lockThreshold) {
        e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
        e.aimLocked = false;
      } else {
        // Nos últimos frames, a mira TRAVA, dando o tempo ideal para o jogador correr para as costas!
        e.aimLocked = true;
      }

      // Efeito de placas acumulando pressão no alto
      if (Math.floor(frameCount) % 3 === 0) {
        const sparkDist = 30 + Math.random() * 80;
        createHitParticles(
          e.x + Math.cos(e.aimAngle) * sparkDist,
          e.y + Math.sin(e.aimAngle) * sparkDist,
          '#f39c12',
          1
        );
      }

      if (e.actionTimer <= 0) {
        executeTectonicSlam(e, context);
      }
      return;
    }

    // ==========================================
    // SKILL 2: ANÉIS CONCÊNTRICOS (DONUT RIPPLES)
    // ==========================================
    case 'WINDUP_DONUT': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 3 === 0) {
        const ringR = 140 + Math.random() * 80;
        const ang = Math.random() * Math.PI * 2;
        createHitParticles(e.x + Math.cos(ang) * ringR, e.y + Math.sin(ang) * ringR, '#e67e22', 1);
      }

      if (e.actionTimer <= 0) {
        // Dispara o Anel 1 (Externo: 125px a 240px)
        triggerDonutStep1(e, context);
      }
      return;
    }

    case 'DONUT_STEP_2': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 2 === 0) {
        const coreR = Math.random() * 95;
        const ang = Math.random() * Math.PI * 2;
        createHitParticles(e.x + Math.cos(ang) * coreR, e.y + Math.sin(ang) * coreR, '#f1c40f', 1);
      }

      if (e.actionTimer <= 0) {
        // Dispara o Anel 2 (Interno: 0 a 110px)
        triggerDonutStep2(e, context);
      }
      return;
    }

    // ==========================================
    // SKILL 3: VÓRTICE DA CALDEIRA (MAGMA SIPHON)
    // ==========================================
    case 'CHANNELING_SIPHON': {
      e.pullTimer -= dt;

      const pdx = e.x - player.x;
      const pdy = e.y - player.y;
      const pDist = Math.hypot(pdx, pdy);

      // Atração gravitacional suave (o jogador consegue resistir correndo)
      if (pDist > 45 && pDist < 420) {
        const pullForce = (e.isEnraged ? 0.85 : 0.70) * dt;
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
    // SKILL 4 & 5: FENDAS E ARTILHARIA
    // ==========================================
    case 'WINDUP_FISSURE': {
      e.actionTimer -= dt;
      if (e.actionTimer > 14) {
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
    // ESTADO BASE: PERSEGUIÇÃO E TOMADA DE DECISÃO
    // ==========================================
    case 'CHASE':
    default: {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      let curSpeed = e.speed;
      if (activeOrbitals.length > 0) curSpeed *= (1 + 0.05 * activeOrbitals.length);
      if (e.slowTimer > 0) curSpeed *= (1 - 0.18);

      if (dist > 80) {
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

    // Verifica se o jogador pisou na fonte de cristal térmico
    const distToPlayer = Math.hypot(player.x - vent.x, player.y - vent.y);
    if (distToPlayer < vent.radius + player.radius) {
      vent.active = false;

      // Bônus recompensador para Melee e Ranged:
      // 1. Recarrega instantaneamente a habilidade de classe (Dash do Cavaleiro, etc.)
      player.skillCd = 0;
      // 2. Cura 25 de HP
      const healAmount = 25;
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      // 3. Invulnerabilidade breve para reposicionamento seguro
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

  // Recoil de dano ao chefe (5% do HP máximo)
  const backlashDmg = Math.round(boss.maxHp * 0.05);
  boss.hp -= backlashDmg;

  playSfx('shatter');
  context.triggerShake(12);
  triggerHaptic('heavy');
  context.createHitParticles(ox, oy, '#d35400', 18);
  context.createHitParticles(ox, oy, '#f1c40f', 14);
  context.addDamageText(boss.x, boss.y, backlashDmg, true, '#f1c40f');
  context.addDamageText(ox, oy, "LITOCISTO QUEBRADO!", true, '#e67e22');

  // Spawna a Fonte Térmica no local por 11 segundos
  boss.thermalVents.push({
    x: ox,
    y: oy,
    radius: 32,
    life: 660,
    maxLife: 660,
    active: true,
    pulsePhase: Math.random() * Math.PI * 2
  });

  // Se destruiu todos os Litocistos: Colapso Sísmico (Stun de 5.2s)
  const activeRemaining = boss.orbitals.filter(item => item.active).length;
  if (activeRemaining === 0 && boss.actionState !== 'RECOVERY' && boss.actionState !== 'OVERHEAT_TRANSITION') {
    boss.actionState = 'RECOVERY';
    boss.recoveryTimer = 312; // 5.2 segundos
    boss.isVulnerable = true;

    context.triggerShake(16);
    triggerHaptic('heavy');
    playSfx('boss');
    context.addDamageText(boss.x, boss.y, "COLAPSO SÍSMICO!", true, '#f1c40f');
  }
}

// ==========================================
// 6. IA DE SELEÇÃO EQUILIBRADA DE SKILLS
// ==========================================

function selectNextSkill(e, dist) {
  const isEnraged = e.isEnraged;
  const isP3 = e.isPhase3;
  const rand = Math.random();

  // Em alcance Melee (< 210px):
  // 60% Esmagamento Frontal (com zona cega nas costas)
  // 40% Anéis de Ressonância (Donut Ripples: zona segura colada no chefe)
  if (dist < 210) {
    if (e.lastUsedSkill !== 'TECTONIC_SLAM' && (rand < 0.60 || e.lastUsedSkill === 'DONUT_RIPPLE')) {
      e.currentSkill = 'TECTONIC_SLAM';
      e.actionState = 'WINDUP_SLAM';
      e.actionTimer = isP3 ? 36 : (isEnraged ? 42 : 52);
    } else {
      e.currentSkill = 'DONUT_RIPPLE';
      e.actionState = 'WINDUP_DONUT';
      e.actionTimer = isP3 ? 38 : (isEnraged ? 44 : 52);
    }
  }
  // Em alcance Médio (210px a 340px):
  else if (dist <= 340) {
    if (rand < 0.40 && e.lastUsedSkill !== 'DONUT_RIPPLE') {
      e.currentSkill = 'DONUT_RIPPLE';
      e.actionState = 'WINDUP_DONUT';
      e.actionTimer = isP3 ? 38 : (isEnraged ? 44 : 52);
    } else if (rand < 0.72) {
      e.currentSkill = 'VOLCANIC_FISSURE';
      e.actionState = 'WINDUP_FISSURE';
      e.actionTimer = isP3 ? 28 : (isEnraged ? 34 : 42);
    } else {
      e.currentSkill = 'BASALT_BARRAGE';
      e.actionState = 'WINDUP_BARRAGE';
      e.actionTimer = isP3 ? 26 : (isEnraged ? 32 : 40);
    }
  }
  // Em Longa Distância (> 340px):
  else {
    if ((isEnraged || isP3) && rand < 0.45 && e.lastUsedSkill !== 'MAGMA_SIPHON') {
      e.currentSkill = 'MAGMA_SIPHON';
      e.actionState = 'CHANNELING_SIPHON';
      e.pullTimer = isP3 ? 65 : (isEnraged ? 75 : 90);
      e.pullMaxTimer = e.pullTimer;
    } else if (rand < 0.75) {
      e.currentSkill = 'BASALT_BARRAGE';
      e.actionState = 'WINDUP_BARRAGE';
      e.actionTimer = isP3 ? 28 : (isEnraged ? 32 : 40);
    } else {
      e.currentSkill = 'VOLCANIC_FISSURE';
      e.actionState = 'WINDUP_FISSURE';
      e.actionTimer = isP3 ? 30 : (isEnraged ? 35 : 44);
    }
  }

  e.lastUsedSkill = e.currentSkill;
}

// ==========================================
// 7. EXECUÇÃO DOS NOVOS ATAQUES
// ==========================================

/**
 * SKILL 1: ESMAGAMENTO TECTÔNICO (TECTONIC SLAM)
 * Substitui o antigo pulso injusto. Agora é um cone frontal com telegrafia clara
 * e ZONA CEGA NAS COSTAS, recompensando totalmente jogadores melee atentos!
 */
function executeTectonicSlam(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  playSfx('boss');
  triggerShake(16);
  triggerHaptic('heavy');

  // Efeito de impacto no solo à frente
  const impactDist = 75;
  const impactX = e.x + Math.cos(e.aimAngle) * impactDist;
  const impactY = e.y + Math.sin(e.aimAngle) * impactDist;

  for (let p = 0; p < 24; p++) {
    createHitParticles(impactX, impactY, '#e67e22', 1);
    createHitParticles(impactX, impactY, '#d35400', 1);
  }

  // Avaliação geométrica no cone frontal
  const pdx = player.x - e.x;
  const pdy = player.y - e.y;
  const pDist = Math.hypot(pdx, pdy);
  const pAngle = Math.atan2(pdy, pdx);

  let angleDiff = Math.abs(pAngle - e.aimAngle);
  if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

  // Dano somente se estiver no cone frontal (< slamArc) e dentro do raio (180px)
  if (pDist <= e.slamRadius && angleDiff <= e.slamArc && player.iFrames <= 0) {
    let slamDamage = Math.round(e.damage * 0.42);
    if (selectedHeroKey === 'KNIGHT') slamDamage = Math.round(slamDamage * 0.80);

    player.hp -= slamDamage;
    player.iFrames = 26;
    setLastAttackerName("Esmagamento Tectônico");
    playSfx('hit');
    triggerShake(10);
    addDamageText(player.x, player.y, `-${slamDamage}`, false, '#e74c3c');
    createHitParticles(player.x, player.y, '#e74c3c', 8);

    // Empurrão direcional
    const pushAngle = Math.atan2(pdy, pdx);
    player.x += Math.cos(pushAngle) * 25;
    player.y += Math.sin(pushAngle) * 25;

    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  // Na Fase 2/3, o impacto ejeta 3 fendas em leque para frente
  if (e.isEnraged || e.isPhase3) {
    const fCount = 3;
    const fSpread = 0.35;
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
          timer: 20 + n * 7,
          maxTimer: 20 + n * 7,
          damage: Math.round(e.damage * 0.28)
        });
      }
    }
  }

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = e.isPhase3 ? 48 : (e.isEnraged ? 56 : 68);
}

/**
 * SKILL 2 (PASSO 1): ANEL EXTERNO (DONUT RIPPLE - RAIO 125 A 240)
 * Quem estiver colado ao chefe (0 a 115px) está seguro!
 */
function triggerDonutStep1(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  playSfx('boss');
  triggerShake(12);

  // Explosão visual em anel no solo
  const ringStepCount = 28;
  for (let s = 0; s < ringStepCount; s++) {
    const rAng = (s * Math.PI * 2) / ringStepCount;
    const rDist = 135 + Math.random() * 85;
    createHitParticles(e.x + Math.cos(rAng) * rDist, e.y + Math.sin(rAng) * rDist, '#e67e22', 1);
  }

  // Verificação de Dano: Quem está entre 120 e 240px toma dano
  const pDist = Math.hypot(player.x - e.x, player.y - e.y);
  if (pDist >= 120 && pDist <= 240 && player.iFrames <= 0) {
    let donutDmg = Math.round(e.damage * 0.32);
    if (selectedHeroKey === 'KNIGHT') donutDmg = Math.round(donutDmg * 0.80);

    player.hp -= donutDmg;
    player.iFrames = 25;
    setLastAttackerName("Ressonância Tectônica");
    playSfx('hit');
    addDamageText(player.x, player.y, `-${donutDmg}`, false, '#e67e22');
    createHitParticles(player.x, player.y, '#e67e22', 8);

    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  // Avança imediatamente para o Passo 2: O anel interno vai explodir em 26 frames
  e.actionState = 'DONUT_STEP_2';
  e.actionTimer = e.isPhase3 ? 22 : (e.isEnraged ? 25 : 28);
}

/**
 * SKILL 2 (PASSO 2): ANEL INTERNO (RAIO 0 A 110)
 * Quem deu dois passos para fora para a zona já explodida está seguro!
 */
function triggerDonutStep2(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  playSfx('hit');
  triggerShake(14);

  // Explosão visual no núcleo imediato
  for (let p = 0; p < 25; p++) {
    const cAng = Math.random() * Math.PI * 2;
    const cDist = Math.random() * 105;
    createHitParticles(e.x + Math.cos(cAng) * cDist, e.y + Math.sin(cAng) * cDist, '#f39c12', 1);
  }

  // Verificação de Dano: Quem permaneceu colado no centro (< 115px) toma dano
  const pDist = Math.hypot(player.x - e.x, player.y - e.y);
  if (pDist < 115 && player.iFrames <= 0) {
    let coreDmg = Math.round(e.damage * 0.35);
    if (selectedHeroKey === 'KNIGHT') coreDmg = Math.round(coreDmg * 0.80);

    player.hp -= coreDmg;
    player.iFrames = 25;
    setLastAttackerName("Núcleo da Caldeira");
    playSfx('hit');
    addDamageText(player.x, player.y, `-${coreDmg}`, false, '#f39c12');
    createHitParticles(player.x, player.y, '#f39c12', 8);

    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = e.isPhase3 ? 42 : (e.isEnraged ? 50 : 60);
}

/**
 * SKILL 3: LIBERAÇÃO DO VÓRTICE (MAGMA SIPHON)
 * Em vez de uma onda mortal súbita, ejeta 3 leques de projéteis de basalto
 * com 45° de abertura entre as balas (bullet-hell legível e justo).
 */
function executeMagmaSiphonRelease(e, context) {
  const { enemyBullets, triggerShake } = context;

  playSfx('boss');
  triggerShake(14);
  triggerHaptic('heavy');

  // 3 ondas sucessivas com vãos amplos de 45°
  const waveCount = 3;
  const shardCount = 8; // 360 / 8 = 45 graus entre projéteis!
  for (let w = 0; w < waveCount; w++) {
    e.delayedActions.push({
      timer: w * 9,
      callback: () => {
        playSfx('shoot');
        const waveOffset = (w * Math.PI) / 8; // rotação suave entre as ondas
        for (let s = 0; s < shardCount; s++) {
          const sAng = waveOffset + (s * Math.PI * 2) / shardCount;
          enemyBullets.push({
            x: e.x + Math.cos(sAng) * 65,
            y: e.y + Math.sin(sAng) * 65,
            vx: Math.cos(sAng) * (3.1 + w * 0.3),
            vy: Math.sin(sAng) * (3.1 + w * 0.3),
            radius: 6.5,
            damage: Math.round(e.damage * 0.22),
            life: 110,
            color: '#e67e22'
          });
        }
      }
    });
  }

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = 62;
}

/**
 * SKILL 4: FENDAS VULCÂNICAS (VOLCANIC FISSURE)
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
        timer: 32 + n * 8,
        maxTimer: 32 + n * 8,
        damage: Math.round(e.damage * 0.35)
      });
    }
  }

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = e.isPhase3 ? 46 : (e.isEnraged ? 54 : 64);
}

/**
 * SKILL 5: ARTILHARIA DE BASALTO (BASALT BARRAGE)
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
      timer: 40 + m * 8,
      maxTimer: 40 + m * 8,
      damage: Math.round(e.damage * 0.40)
    });
  }

  e.actionState = 'POST_ATTACK_RECOVERY';
  e.actionTimer = e.isPhase3 ? 44 : 58;
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

/**
 * Desenha as Fontes Termais relativas à posição do mundo (centradas em e.x, e.y sem rotação).
 */
function drawThermalVents(ctx, boss, frameCount) {
  for (let vent of boss.thermalVents) {
    if (!vent.active) continue;

    const relX = vent.x - boss.x;
    const relY = vent.y - boss.y;
    const pulse = Math.sin(frameCount * 0.08 + vent.pulsePhase) * 3;
    const curR = vent.radius + pulse;

    ctx.save();
    // Brilho térmico suave no solo
    const grad = ctx.createRadialGradient(relX, relY, 4, relX, relY, curR);
    grad.addColorStop(0, 'rgba(241, 196, 15, 0.40)');
    grad.addColorStop(0.5, 'rgba(230, 126, 34, 0.20)');
    grad.addColorStop(1, 'rgba(211, 84, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(relX, relY, curR, 0, Math.PI * 2);
    ctx.fill();

    // Glifo Rúnico de Vigor Tectônico
    ctx.strokeStyle = `rgba(241, 196, 15, ${0.45 + pulse * 0.08})`;
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(relX, relY, curR * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cristal de Obsidiana e Magma no centro
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

    // Ícone de Chama/Vigor
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(relX, relY - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Desenha telegrafias no espaço do mundo (não espelhadas horizontalmente).
 */
function drawTelegraphsAndZones(ctx, e, frameCount) {
  // 1. Telegrafia do Cone Frontal do Esmagamento Tectônico
  if (e.actionState === 'WINDUP_SLAM') {
    const maxTimer = e.isPhase3 ? 36 : (e.isEnraged ? 42 : 52);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const aim = e.aimAngle || 0;
    const arcHalf = e.slamArc;
    const r = e.slamRadius;

    ctx.save();
    // Preenchimento do cone em brasa
    ctx.fillStyle = `rgba(230, 126, 34, ${0.12 + progress * 0.28})`;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.arc(0, 20, r, aim - arcHalf, aim + arcHalf);
    ctx.closePath();
    ctx.fill();

    // Arco de contorno
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : (e.aimLocked ? '#ff4757' : '#f39c12');
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.4;
    ctx.beginPath();
    ctx.arc(0, 20, r, aim - arcHalf, aim + arcHalf);
    ctx.stroke();

    // Linhas laterais limitando o cone
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(Math.cos(aim - arcHalf) * r, 20 + Math.sin(aim - arcHalf) * r);
    ctx.moveTo(0, 20);
    ctx.lineTo(Math.cos(aim + arcHalf) * r, 20 + Math.sin(aim + arcHalf) * r);
    ctx.stroke();
    ctx.setLineDash([]);

    // Indicador visual de trava de mira (Lock-in)
    if (e.aimLocked) {
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(Math.cos(aim) * (r * 0.7), 20 + Math.sin(aim) * (r * 0.7), 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Telegrafia dos Anéis Concêntricos (Donut Ripples)
  if (e.actionState === 'WINDUP_DONUT') {
    const maxTimer = e.isPhase3 ? 38 : (e.isEnraged ? 44 : 52);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));

    ctx.save();
    // Anel Externo de Perigo (125px a 240px)
    ctx.strokeStyle = `rgba(231, 76, 60, ${0.45 + progress * 0.45})`;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, 20, 240, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(230, 126, 34, ${0.45 + progress * 0.45})`;
    ctx.beginPath();
    ctx.arc(0, 20, 125, 0, Math.PI * 2);
    ctx.stroke();

    // Faixa intermediária de perigo
    ctx.fillStyle = `rgba(230, 126, 34, ${0.08 + progress * 0.22})`;
    ctx.beginPath();
    ctx.arc(0, 20, 240, 0, Math.PI * 2);
    ctx.arc(0, 20, 125, 0, Math.PI * 2, true);
    ctx.fill();

    // Zona Segura Melee no centro (0 a 115px) sinalizada com runas douradas
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.65)';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 20, 115, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Telegrafia do Anel Interno (Donut Step 2)
  if (e.actionState === 'DONUT_STEP_2') {
    const maxTimer = e.isPhase3 ? 22 : (e.isEnraged ? 25 : 28);
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));

    ctx.save();
    // Zona interna contraindo em aviso rápido de perigo
    ctx.fillStyle = `rgba(243, 156, 18, ${0.15 + progress * 0.35})`;
    ctx.beginPath();
    ctx.arc(0, 20, 115, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#f39c12';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 20, 115 * (1 - progress * 0.2), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup) {
  const skill = e.currentSkill;
  const isP3 = e.isPhase3;

  let plateColDark = isVuln ? '#151b1e' : (isP3 ? '#3a080d' : (isEnraged ? '#2d0f12' : '#1e272e'));
  let plateColLight = isVuln ? '#242b30' : (isP3 ? '#5c1018' : (isEnraged ? '#45161b' : '#2f3640'));
  let trimCol = isVuln ? '#57606f' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22'));

  for (let i = 0; i < e.floatingPlates.length; i++) {
    const p = e.floatingPlates[i];
    let px = 0;
    let py = 0;
    let rot = 0;

    // Posturas Cinemáticas de acordo com o ataque:
    if (e.actionState === 'WINDUP_SLAM') {
      // Placas se erguem no alto como martelos de rocha
      const lift = Math.sin(frameCount * 0.25) * 4;
      const spread = (i - 1.5) * 22;
      px = spread;
      py = -80 + bob + lift + Math.abs(spread) * 0.25;
      rot = spread / 45;
    } else if (e.actionState === 'WINDUP_DONUT') {
      // Placas se expandem para fora horizontalmente
      const pAng = p.angleOffset + frameCount * 0.035;
      px = Math.cos(pAng) * 105;
      py = Math.sin(pAng) * 58 + bob;
      rot = pAng + Math.PI / 2;
    } else if (e.actionState === 'CHANNELING_SIPHON') {
      // Placas giram aceleradamente em órbita ciclônica
      const fastAng = p.angleOffset - frameCount * 0.14;
      px = Math.cos(fastAng) * 65;
      py = Math.sin(fastAng) * 36 + bob;
      rot = fastAng + Math.PI / 2;
    } else if (isVuln) {
      // No colapso, as placas desabam no solo desordenadas
      const fallOffset = (i - 1.5) * 36;
      px = fallOffset;
      py = 48 + bob + (i % 2 === 0 ? 8 : -4);
      rot = (i - 1.5) * 0.35;
    } else {
      // Postura Normal / Perseguição com flutuação orgânica
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
    // Lado esquerdo com sombra
    ctx.fillStyle = plateColDark;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.6, -sz * 0.5);
    ctx.lineTo(sz * 0.6, -sz * 0.5);
    ctx.lineTo(sz * 0.4, sz * 0.5);
    ctx.lineTo(-sz * 0.4, sz * 0.5);
    ctx.closePath();
    ctx.fill();

    // Chanfro de luz na face superior
    ctx.fillStyle = plateColLight;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.6, -sz * 0.5);
    ctx.lineTo(0, -sz * 0.3);
    ctx.lineTo(sz * 0.6, -sz * 0.5);
    ctx.closePath();
    ctx.fill();

    // Runa esculpida na placa
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

  // Faceta Sombreada Esquerda
  ctx.fillStyle = basaltShadow;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-44, waistY);
  ctx.lineTo(-24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  // Faceta Iluminada Direita
  ctx.fillStyle = basaltLight;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(44, waistY);
  ctx.lineTo(24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  // Faceta Central de Chanfro
  ctx.fillStyle = basaltMid;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-18, waistY + 4);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(18, waistY + 4);
  ctx.closePath();
  ctx.fill();

  // Contornos Estruturais de Basalto
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

  // Espinha Tectônica Central
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(0, botY + 6);
  ctx.stroke();

  // Fendas Magmáticas Articuladas
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

  // Fendas Superiores
  ctx.moveTo(-6, -44 + bob);
  ctx.lineTo(-26, -14 + bob);
  ctx.lineTo(-14, 22 + bob);

  ctx.moveTo(6, -44 + bob);
  ctx.lineTo(26, -14 + bob);
  ctx.lineTo(14, 22 + bob);

  // Fendas Inferiores
  ctx.moveTo(-10, 32 + bob);
  ctx.lineTo(0, 44 + bob);
  ctx.lineTo(10, 32 + bob);
  ctx.stroke();

  // Brilho Incandescente Interno
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

  // Anel Rúnico ao redor do Núcleo
  ctx.strokeStyle = isVuln ? '#2f3640' : (isChanneling ? '#e67e22' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#f39c12')));
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, coreY, currentR + 4, 0, Math.PI * 2);
  ctx.stroke();

  // Gradiente em Múltiplas Camadas da Caldeira
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

  // Pupila/Fenda Térmica Vertical
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

    // Coordenadas relativas desinvertidas
    const ox = Math.cos(o.angle) * o.dist;
    const oy = Math.sin(o.angle) * o.dist + bob;

    // Linha de Conexão Tectônica com o Núcleo
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
      // Casca de Basalto da Orbe
      ctx.fillStyle = isP3 ? '#3d080c' : (isEnraged ? '#2d0f12' : '#2f3640');
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22');
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Núcleo Magmático
      const orbGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, o.radius * 0.65);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.5, isP3 ? '#ff4d4d' : (isEnraged ? '#ff6b81' : '#f1c40f'));
      orbGrad.addColorStop(1, isP3 ? '#8b0000' : (isEnraged ? '#c0392b' : '#d35400'));
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Barra de Vida Circular da Orbe
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

  // NOTA DE COORDENADAS: O contexto injetado por enemiesRenderer já está com:
  // ctx.translate(e.x, e.y); ctx.scale(e.facing, 1);
  // Para desenhar elementos do espaço do mundo que não devem ser invertidos horizontalmente
  // (Fontes Termais, Telegrafias com ângulo absoluto e Litocistos com rotação de mundo),
  // desfazemos o espelhamento temporariamente se e.facing === -1.

  // 1. Elementos em Coordenadas de Mundo Absolutas (Desespelhadas)
  ctx.save();
  if (e.facing === -1) {
    ctx.scale(-1, 1);
  }

  // Renderização das Fontes Termais no Solo
  drawThermalVents(ctx, e, frameCount);

  // Telegrafias exclusivas do chefe (cone e anéis no solo com orientação verdadeira)
  drawTelegraphsAndZones(ctx, e, frameCount);

  // Orbes Orbitais (Litocistos) girando em órbita verdadeira do mundo
  drawLitocistos(ctx, e, bob, frameCount, isEnraged, isP3);

  ctx.restore();

  // 2. Renderização do Corpo do Chefe (Orientado na direção de visualização e.facing)
  ctx.save();

  // Tremor orgânico durante o carregamento de habilidades
  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.8);
  }

  // Sombra suave no solo
  drawShadow(ctx, e, bob, isVuln);

  // Placas Tectônicas Articuladas
  drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup);

  // Corpo de Basalto Monolítico
  drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged, isP3);

  // Núcleo da Caldeira
  drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isChanneling, isWindup);

  ctx.restore();
}