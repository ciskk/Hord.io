/**
 * src/entities/bosses/abyssalMonolith.js
 * Módulo de Comportamento e Renderização Procedural: Monólito Abissal (bossId: 2)
 * Survivor / Bullet-Heaven "Hord.io" (Fase 5)
 */

import { playSfx, triggerHaptic } from '../../core/audio.js';
import { bullets, acidPuddles, enemies } from '../../main.js';

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
      dist: 105,
      radius: 16,
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
      x: boss.x + Math.cos(angle) * 105,
      y: boss.y + Math.sin(angle) * 105
    };
    boss.orbitals.push(orbital);
    targetList.push(orbital);
  }
}

export function initAbyssalMonolith(boss) {
  boss.actionState = 'CHASE';
  boss.actionTimer = 0;
  boss.currentSkill = null;
  boss.skillCooldown = 85;
  boss.aimAngle = 0;

  boss.delayedActions = [];

  // Janelas de Vulnerabilidade e Colapso (6.0 segundos = 360 frames)
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;
  boss.prevHp = boss.hp;

  // Litocistos Tectônicos como Sub-Alvos Selecionáveis (Fase Normal: 2.800 HP)
  boss.orbitals = [];
  boss.orbitalAngularVelocity = 0.024;
  spawnLitocistos(boss, 3, 2800, enemies);

  // Placas Tectônicas Decorativas
  boss.floatingPlates = [
    { angleOffset: 0.78, dist: 84, baseDist: 84, size: 24, wobblePhase: 0 },
    { angleOffset: 2.35, dist: 84, baseDist: 84, size: 22, wobblePhase: 1.5 },
    { angleOffset: 3.92, dist: 84, baseDist: 84, size: 26, wobblePhase: 3.0 },
    { angleOffset: 5.49, dist: 84, baseDist: 84, size: 22, wobblePhase: 4.5 }
  ];

  boss.pullTimer = 0;
  boss.pullMaxTimer = 0;

  boss.hasEnraged = false;
  boss.isEnraged = false;

  boss.floatBob = 0;
  boss.magmaPulse = 0;
  boss.facing = 1;
}

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

  e.floatBob = Math.sin(frameCount * 0.045) * 5;
  e.magmaPulse = (Math.sin(frameCount * (e.isEnraged ? 0.14 : 0.07)) + 1) * 0.5;
  
  if (e.actionState !== 'POST_ATTACK_RECOVERY' && e.actionState !== 'RECOVERY') {
    e.facing = (player.x - e.x) > 0 ? 1 : -1;
  }

  // FASE 5: Buff Ofensivo baseado nos Litocistos vivos (absorção passiva de 70% removida)
  const activeOrbitals = e.orbitals.filter(o => o.active);
  if (activeOrbitals.length > 0 && e.actionState === 'CHASE') {
    e.skillCooldown -= dt * (0.18 * activeOrbitals.length);
  }

  // Atualiza coordenadas espaciais dos Litocistos e avalia destruição
  updateLitocistos(e, dt, context);

  // Transição ÚNICA para Fase de Fúria (< 45% HP)
  const hpRatio = e.hp / e.maxHp;
  if (hpRatio < 0.45 && !e.hasEnraged) {
    e.hasEnraged = true;
    e.isEnraged = true;
    e.speed *= 1.30;
    e.orbitalAngularVelocity *= 1.5;
    e.actionState = 'ENRAGE_TRANSITION';
    e.actionTimer = 65;
    e.isVulnerable = false;

    triggerShake(18);
    triggerHaptic('heavy');
    playSfx('boss');
    addDamageText(e.x, e.y, "DESPERTAR DO CATACLISMA!", true, '#e74c3c');

    bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 18,
      maxRadius: 320,
      speed: 6.2,
      damage: Math.round(e.damage * 0.4),
      hitPlayer: false
    });

    // Respawn da Fase de Fúria calibrado para 3.600 HP
    spawnLitocistos(e, 4, 3600, enemies);

    for (let p = 0; p < 30; p++) {
      createHitParticles(e.x, e.y, '#e74c3c', 1);
    }
    return;
  }

  if (e.isEnraged && Math.floor(frameCount) % 5 === 0) {
    createHitParticles(
      e.x + (Math.random() - 0.5) * e.radius * 1.3,
      e.y + (Math.random() - 0.5) * e.radius * 1.3,
      '#e74c3c',
      1
    );
  }

  // MÁQUINA DE ESTADOS PRINCIPAL
  switch (e.actionState) {
    case 'ENRAGE_TRANSITION': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 4 === 0) triggerShake(3);
      if (e.actionTimer <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = 30;
      }
      return;
    }

    // Janela de Exaustão de 6.0 segundos após quebra de todos os orbes
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
        e.skillCooldown = e.isEnraged ? 45 : 70;

        triggerShake(10);
        playSfx('boss');
        addDamageText(e.x, e.y, "REINICIALIZADO!", true, '#3498db');
      }
      return;
    }

    // Janela de Recuperação Pós-Ataque (70 frames: punição melee)
    case 'POST_ATTACK_RECOVERY': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 8 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius,
          e.y + (Math.random() - 0.5) * e.radius,
          '#f1c40f',
          1
        );
      }
      if (e.actionTimer <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 45 : 68;
      }
      return;
    }

    case 'CHANNELING_PULL': {
      e.pullTimer -= dt;

      const pdx = e.x - player.x;
      const pdy = e.y - player.y;
      const pDist = Math.hypot(pdx, pdy);

      if (pDist > 40 && pDist < 420) {
        const pullForce = (e.isEnraged ? 1.10 : 0.90) * dt;
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
          '#8e44ad',
          1
        );
      }

      if (e.pullTimer <= 0) {
        triggerShake(15);
        triggerHaptic('heavy');
        playSfx('boss');

        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 18,
          maxRadius: 280,
          speed: 5.2,
          damage: Math.round(e.damage * 0.55),
          hitPlayer: false
        });

        const shardCount = e.isEnraged ? 16 : 12;
        for (let s = 0; s < shardCount; s++) {
          const sAng = (s * Math.PI * 2) / shardCount;
          enemyBullets.push({
            x: e.x + Math.cos(sAng) * 78,
            y: e.y + Math.sin(sAng) * 78,
            vx: Math.cos(sAng) * 4.2,
            vy: Math.sin(sAng) * 4.2,
            radius: 6.5,
            damage: Math.round(e.damage * 0.28),
            life: 110
          });
        }

        e.actionState = 'POST_ATTACK_RECOVERY';
        e.actionTimer = 65;
      }
      return;
    }

    case 'WINDUP': {
      e.actionTimer -= dt;

      if (e.actionTimer > (e.isEnraged ? 10 : 16)) {
        e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
      }

      if (e.currentSkill === 'FISSURE') {
        if (Math.floor(frameCount) % 3 === 0) {
          const stepDist = 40 + Math.random() * 160;
          createHitParticles(e.x + Math.cos(e.aimAngle) * stepDist, e.y + Math.sin(e.aimAngle) * stepDist, '#e67e22', 1);
        }
      } else if (e.currentSkill === 'SEISMIC_PULSE') {
        if (Math.floor(frameCount) % 2 === 0) {
          createHitParticles(e.x + (Math.random() - 0.5) * 60, e.y + (Math.random() - 0.5) * 60, '#f1c40f', 1);
        }
      } else if (e.currentSkill === 'SINGULARITY') {
        if (Math.floor(frameCount) % 2 === 0) {
          createHitParticles(e.x + (Math.random() - 0.5) * 80, e.y + (Math.random() - 0.5) * 80, '#a29bfe', 1);
        }
      } else if (e.currentSkill === 'BASALT_BARRAGE') {
        if (Math.floor(frameCount) % 3 === 0) {
          createHitParticles(e.x + (Math.random() - 0.5) * 40, e.y - 20 - Math.random() * 30, '#ff7675', 1);
        }
      }

      if (e.actionTimer <= 0) {
        executePreparedSkill(e, context);
      }
      return;
    }

    case 'CHASE':
    default: {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      let curSpeed = e.speed;
      if (activeOrbitals.length > 0) curSpeed *= (1 + 0.08 * activeOrbitals.length);
      if (e.slowTimer > 0) curSpeed *= (1 - 0.18);

      if (dist > 85) {
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

  // Mecânica de Contragolpe (Backlash: 5% do HP máximo do chefe)
  const backlashDmg = Math.round(boss.maxHp * 0.05);
  boss.hp -= backlashDmg;

  playSfx('shatter');
  context.triggerShake(12);
  triggerHaptic('heavy');
  context.createHitParticles(ox, oy, '#d35400', 20);
  context.createHitParticles(ox, oy, '#f1c40f', 12);
  context.addDamageText(boss.x, boss.y, backlashDmg, true, '#f1c40f');
  context.addDamageText(ox, oy, "LITOCISTO QUEBRADO!", true, '#e67e22');

  // Ao destruir o último da fase: Colapso por 6.0 segundos
  const activeRemaining = boss.orbitals.filter(item => item.active).length;
  if (activeRemaining === 0 && boss.actionState !== 'RECOVERY' && boss.actionState !== 'ENRAGE_TRANSITION') {
    boss.actionState = 'RECOVERY';
    boss.recoveryTimer = 360;
    boss.isVulnerable = true;

    context.triggerShake(16);
    triggerHaptic('heavy');
    playSfx('boss');
    context.addDamageText(boss.x, boss.y, "COLAPSO SÍSMICO (6.0s)!", true, '#f1c40f');
  }
}

function selectNextSkill(e, dist) {
  const isEnraged = e.isEnraged;
  const rand = Math.random();

  if (dist < 180) {
    e.currentSkill = 'SEISMIC_PULSE';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 38 : 52;
  } else if (dist > 300 && rand < 0.40) {
    e.currentSkill = 'SINGULARITY';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 30 : 42;
  } else if (rand < 0.50) {
    e.currentSkill = 'FISSURE';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 32 : 44;
  } else {
    e.currentSkill = 'BASALT_BARRAGE';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 28 : 38;
  }
}

function executePreparedSkill(e, context) {
  const {
    player,
    enemyBullets,
    bossTelegraphs,
    bossShockwaves,
    triggerShake
  } = context;

  const angleToPlayer = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);

  switch (e.currentSkill) {
    case 'FISSURE': {
      playSfx('boss');
      triggerShake(10);
      triggerHaptic('medium');

      const lineCount = e.isEnraged ? 5 : 3;
      const spreadArc = Math.PI * (e.isEnraged ? 0.6 : 0.42);
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
            radius: 30,
            timer: 36 + n * 9,
            maxTimer: 36 + n * 9,
            damage: Math.round(e.damage * 0.40)
          });

          if (n === nodeCount && e.isEnraged) {
            e.delayedActions.push({
              timer: 36 + n * 9,
              callback: () => {
                acidPuddles.push({
                  x: nodeX,
                  y: nodeY,
                  radius: 32,
                  life: 180,
                  maxLife: 180,
                  isFire: true
                });
              }
            });
          }
        }
      }

      e.actionState = 'POST_ATTACK_RECOVERY';
      e.actionTimer = 65;
      break;
    }

    case 'SEISMIC_PULSE': {
      playSfx('boss');
      triggerShake(14);
      triggerHaptic('heavy');

      bossShockwaves.push({
        x: e.x,
        y: e.y,
        radius: 16,
        maxRadius: 270,
        speed: 5.2,
        damage: Math.round(e.damage * 0.48),
        hitPlayer: false
      });

      const shardCount = e.isEnraged ? 12 : 8;
      e.delayedActions.push({
        timer: 14,
        callback: () => {
          playSfx('shoot');
          for (let s = 0; s < shardCount; s++) {
            const sAng = (s * Math.PI * 2) / shardCount;
            enemyBullets.push({
              x: e.x + Math.cos(sAng) * 76,
              y: e.y + Math.sin(sAng) * 76,
              vx: Math.cos(sAng) * 3.4,
              vy: Math.sin(sAng) * 3.4,
              radius: 6.5,
              damage: Math.round(e.damage * 0.22),
              life: 110
            });
          }
        }
      });

      e.actionState = 'POST_ATTACK_RECOVERY';
      e.actionTimer = 70;
      break;
    }

    case 'SINGULARITY': {
      playSfx('boss');
      triggerShake(8);
      e.actionState = 'CHANNELING_PULL';
      e.pullTimer = e.isEnraged ? 80 : 100;
      e.pullMaxTimer = e.pullTimer;
      break;
    }

    case 'BASALT_BARRAGE': {
      playSfx('shoot');
      triggerShake(6);

      const impactCount = e.isEnraged ? 4 : 3;
      for (let m = 0; m < impactCount; m++) {
        const offsetAng = (m * Math.PI * 2) / impactCount + Math.random() * 0.4;
        const offsetDist = 42 + Math.random() * 70;
        const targetX = player.x + Math.cos(offsetAng) * offsetDist;
        const targetY = player.y + Math.sin(offsetAng) * offsetDist;

        bossTelegraphs.push({
          type: 'FALLING_ROCK',
          x: targetX,
          y: targetY,
          radius: 44,
          timer: 44 + m * 9,
          maxTimer: 44 + m * 9,
          damage: Math.round(e.damage * 0.45)
        });
      }

      e.actionState = 'POST_ATTACK_RECOVERY';
      e.actionTimer = 60;
      break;
    }

    default: {
      e.actionState = 'CHASE';
      e.skillCooldown = 60;
      break;
    }
  }
}

function drawShadow(ctx, e, bob, isVuln) {
  const shadowY = 56 + (isVuln ? 10 : 0);
  const shadowRadius = (e.radius * 0.85) - (isVuln ? 0 : bob * 0.4);

  const grad = ctx.createRadialGradient(0, shadowY, 5, 0, shadowY, shadowRadius);
  grad.addColorStop(0, 'rgba(10, 5, 8, 0.65)');
  grad.addColorStop(0.7, 'rgba(15, 8, 10, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowRadius, shadowRadius * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawVulnerabilityGliph(ctx, e, frameCount) {
  const pulse = Math.sin(frameCount * 0.16) * 4;
  const R = e.radius * 1.1 + pulse;

  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 54, R, 20, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(241, 196, 15, 0.12)';
  ctx.fill();

  const runeCount = 6;
  const rot = frameCount * 0.02;
  ctx.lineWidth = 1.8;
  for (let k = 0; k < runeCount; k++) {
    const a = rot + (k * Math.PI * 2 / runeCount);
    const rx = Math.cos(a) * R;
    const ry = 54 + Math.sin(a) * 20;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry - 3);
    ctx.lineTo(rx + 3, ry + 3);
    ctx.moveTo(rx + 3, ry - 3);
    ctx.lineTo(rx - 3, ry + 3);
    ctx.stroke();
  }
}

function drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup) {
  const skill = e.currentSkill;
  let plateColDark = isVuln ? '#1e272e' : (isEnraged ? '#3d0c11' : '#1e272e');
  let plateColLight = isVuln ? '#2f3640' : (isEnraged ? '#6b1118' : '#2f3640');
  let trimCol = isVuln ? '#57606f' : (isEnraged ? '#ff4757' : '#e67e22');

  if (isWindup) {
    if (skill === 'SEISMIC_PULSE') trimCol = '#ffffff';
    else if (skill === 'SINGULARITY') trimCol = '#a29bfe';
    else if (skill === 'BASALT_BARRAGE') trimCol = '#ff7675';
    else if (skill === 'FISSURE') trimCol = '#ff9f43';
  }

  for (let i = 0; i < e.floatingPlates.length; i++) {
    const p = e.floatingPlates[i];
    let px = 0;
    let py = 0;
    let rot = 0;

    if (isWindup && skill === 'SEISMIC_PULSE') {
      const spread = (i - 1.5) * 24;
      const tremble = (Math.random() - 0.5) * 4;
      px = spread + tremble;
      py = -82 + bob + Math.abs(spread) * 0.3 + tremble;
      rot = (spread / 60);
    } else if (isWindup && skill === 'SINGULARITY') {
      const fastAng = p.angleOffset + frameCount * 0.16;
      px = Math.cos(fastAng) * 42;
      py = Math.sin(fastAng) * 28 + bob;
      rot = fastAng + Math.PI / 2;
    } else if (isWindup && skill === 'FISSURE') {
      const aim = e.aimAngle || 0;
      const wedgeDist = 65 + (i % 2 === 0 ? 15 : 0);
      const wedgeSpread = (i - 1.5) * 0.35;
      px = Math.cos(aim + wedgeSpread) * wedgeDist;
      py = Math.sin(aim + wedgeSpread) * (wedgeDist * 0.55) + bob;
      rot = aim + Math.PI / 2;
    } else if (isWindup && skill === 'BASALT_BARRAGE') {
      const pAng = p.angleOffset + frameCount * 0.02;
      px = Math.cos(pAng) * 94;
      py = Math.sin(pAng) * 55 + bob - 15;
      rot = -0.4;
    } else {
      const pAng = p.angleOffset + (frameCount * (isEnraged ? 0.025 : 0.015));
      const wobble = Math.sin(frameCount * 0.08 + p.wobblePhase) * 4;
      const currentDist = isVuln ? 52 : p.baseDist + wobble;
      px = Math.cos(pAng) * currentDist;
      py = (Math.sin(pAng) * (currentDist * 0.45)) + bob + (isVuln ? 34 : 0);
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
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.2, 0);
      ctx.lineTo(sz * 0.2, 0);
      ctx.moveTo(0, -sz * 0.25);
      ctx.lineTo(0, sz * 0.25);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged) {
  const basaltShadow = isVuln ? '#12171a' : (isEnraged ? '#200508' : '#1e272e');
  const basaltMid    = isVuln ? '#1e272e' : (isEnraged ? '#350a0f' : '#2f3640');
  const basaltLight  = isVuln ? '#2f3640' : (isEnraged ? '#4a1017' : '#485460');
  const edgeTrim     = isVuln ? '#57606f' : (isEnraged ? '#ff4757' : '#718093');

  const topY = -62 + bob;
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
  ctx.lineWidth = 2.0;
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

  drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged);
}

function drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged) {
  if (isVuln) {
    ctx.strokeStyle = '#2c3e50';
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

  const pulse = Math.sin(frameCount * (isEnraged ? 0.18 : 0.09));
  const veinColPrimary = isEnraged ? '#ff1744' : '#e74c3c';
  const veinColGlow    = isEnraged ? '#ff9f43' : '#f1c40f';

  ctx.strokeStyle = veinColPrimary;
  ctx.lineWidth = 2.2 + pulse * 0.6;
  ctx.beginPath();

  ctx.moveTo(-6, -42 + bob);
  ctx.lineTo(-26, -14 + bob);
  ctx.lineTo(-14, 22 + bob);

  ctx.moveTo(6, -42 + bob);
  ctx.lineTo(26, -14 + bob);
  ctx.lineTo(14, 22 + bob);

  ctx.moveTo(-10, 32 + bob);
  ctx.lineTo(0, 42 + bob);
  ctx.lineTo(10, 32 + bob);
  ctx.stroke();

  ctx.strokeStyle = veinColGlow;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isChanneling, isWindup) {
  const coreY = -4 + bob;
  const isSingularityWindup = isWindup && e.currentSkill === 'SINGULARITY';
  const isSeismicWindup = isWindup && e.currentSkill === 'SEISMIC_PULSE';

  let coreBaseRadius = isVuln ? 10 : (isChanneling ? 26 : 16);
  if (isSingularityWindup) coreBaseRadius = 22;
  if (isSeismicWindup) coreBaseRadius = 24;

  const pulse = isVuln ? 0 : Math.sin(frameCount * (isEnraged ? 0.22 : 0.12)) * 2.5;
  const currentR = Math.max(6, coreBaseRadius + pulse);

  ctx.strokeStyle = isVuln ? '#34495e' : (isChanneling || isSingularityWindup ? '#a29bfe' : (isEnraged ? '#ff4757' : '#f39c12'));
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, coreY, currentR + 4, 0, Math.PI * 2);
  ctx.stroke();

  const grad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, currentR);
  if (isVuln) {
    grad.addColorStop(0, '#7f8c8d');
    grad.addColorStop(0.7, '#2c3e50');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else if (isChanneling || isSingularityWindup) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, '#e056fd');
    grad.addColorStop(0.80, '#2c003e');
    grad.addColorStop(1, 'rgba(44, 0, 62, 0)');
  } else if (isSeismicWindup) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.40, '#f1c40f');
    grad.addColorStop(0.85, '#d35400');
    grad.addColorStop(1, 'rgba(211, 84, 0, 0)');
  } else if (isEnraged) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, '#ff4757');
    grad.addColorStop(0.85, '#990000');
    grad.addColorStop(1, 'rgba(153, 0, 0, 0)');
  } else {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#f1c40f');
    grad.addColorStop(0.8, '#d35400');
    grad.addColorStop(1, 'rgba(211, 84, 0, 0)');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, coreY, currentR, 0, Math.PI * 2);
  ctx.fill();

  if (!isVuln) {
    ctx.fillStyle = '#1e0508';
    ctx.beginPath();
    ctx.ellipse(0, coreY, 2.5, currentR * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLitocistos(ctx, e, bob, frameCount, isEnraged) {
  const coreY = -4 + bob;

  for (let o of e.orbitals) {
    if (!o.active) continue;

    const ox = Math.cos(o.angle) * o.dist;
    const oy = Math.sin(o.angle) * o.dist + bob;

    ctx.save();
    ctx.strokeStyle = isEnraged ? 'rgba(255, 71, 87, 0.45)' : 'rgba(230, 126, 34, 0.4)';
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
      ctx.fillStyle = isEnraged ? '#3d0c11' : '#2f3640';
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isEnraged ? '#ff4757' : '#e67e22';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      const orbGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, o.radius * 0.65);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.5, isEnraged ? '#ff6b81' : '#f1c40f');
      orbGrad.addColorStop(1, isEnraged ? '#c0392b' : '#d35400');
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

function drawSingularityField(ctx, e, frameCount) {
  const R = 420;
  const progress = e.pullMaxTimer > 0 ? (1 - e.pullTimer / e.pullMaxTimer) : 0;

  ctx.save();
  ctx.fillStyle = 'rgba(142, 68, 173, 0.05)';
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(155, 89, 182, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const arms = 4;
  const spin = -frameCount * 0.04;
  ctx.lineWidth = 2.2;
  for (let a = 0; a < arms; a++) {
    const baseAng = spin + (a * Math.PI * 2 / arms);
    ctx.strokeStyle = `rgba(162, 155, 254, ${0.25 + (a % 2 === 0 ? 0.2 : 0)})`;
    ctx.beginPath();
    for (let step = 0; step < 18; step++) {
      const stepR = R * (1 - step / 18);
      const stepA = baseAng + step * 0.18;
      const sx = Math.cos(stepA) * stepR;
      const sy = Math.sin(stepA) * stepR;
      if (step === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  const warnR = R * (1 - progress);
  ctx.strokeStyle = progress > 0.8 ? '#ff4757' : '#a29bfe';
  ctx.lineWidth = progress > 0.8 ? 3.5 : 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(30, warnR), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawAbyssalMonolith(ctx, e, frameCount) {
  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged;
  const isWindup = e.actionState === 'WINDUP';
  const isChanneling = e.actionState === 'CHANNELING_PULL';

  let bob = isVuln ? 24 : (e.floatBob || 0);
  if (isWindup && e.currentSkill === 'SEISMIC_PULSE') {
    bob -= 18;
  }

  ctx.save();
  ctx.scale(e.facing, 1);

  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.8);
  }

  if (isChanneling) {
    drawSingularityField(ctx, e, frameCount);
  }

  // Telegrafia de anel de impacto expansivo para o Pulso Sísmico
  if (isWindup && e.currentSkill === 'SEISMIC_PULSE') {
    const maxTimer = e.isEnraged ? 38 : 52;
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    ctx.save();
    ctx.strokeStyle = `rgba(241, 196, 15, ${0.4 + progress * 0.55})`;
    ctx.fillStyle = `rgba(230, 126, 34, ${progress * 0.14})`;
    ctx.lineWidth = 2.8;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, 48 + bob, 270 * progress, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (isWindup && e.currentSkill === 'FISSURE') {
    const aim = e.aimAngle || 0;
    ctx.save();
    ctx.strokeStyle = 'rgba(230, 126, 34, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(aim) * 280, Math.sin(aim) * 280);
    ctx.stroke();
    ctx.restore();
  }

  drawShadow(ctx, e, bob, isVuln);

  if (isVuln) {
    drawVulnerabilityGliph(ctx, e, frameCount);
  }

  drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup);
  drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged);
  drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isChanneling, isWindup);

  ctx.restore();

  // Desenha as orbes sem a inversão de escala horizontal do corpo do chefe
  drawLitocistos(ctx, e, bob, frameCount, isEnraged);
}