/**
 * src/entities/bosses/abyssalMonolith.js
 * Módulo de Comportamento e Renderização Procedural: Monólito Abissal (bossId: 2)
 * Survivor / Bullet-Heaven "Hord.io"
 */

import { playSfx, triggerHaptic } from '../../core/audio.js';
import { bullets, acidPuddles } from '../../main.js';

/**
 * Inicializa propriedades exclusivas, flags mecânicas e subsistemas do Monólito Abissal.
 * @param {Object} boss Entidade instanciada do chefe.
 */
export function initAbyssalMonolith(boss) {
  // 1. Máquina de Estados Principal:
  // 'CHASE', 'WINDUP', 'CHANNELING_PULL', 'RECOVERY', 'ENRAGE_TRANSITION'
  boss.actionState = 'CHASE';
  boss.actionTimer = 0;
  boss.currentSkill = null; // 'FISSURE', 'SEISMIC_PULSE', 'SINGULARITY', 'BASALT_BARRAGE'
  boss.skillCooldown = 85;
  boss.aimAngle = 0;

  // Fila de ações diferidas sincronizadas com o delta time (dt)
  boss.delayedActions = [];

  // 2. Janelas de Vulnerabilidade e Colapso
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;
  boss.prevHp = boss.hp;

  // 3. Litocistos Tectônicos (Orbes de Blindagem Destrutíveis)
  boss.orbitals = [
    { angle: 0, dist: 105, radius: 15, hp: 1100, maxHp: 1100, active: true, hitFlash: 0, orbitalHitCd: 0 },
    { angle: (Math.PI * 2) / 3, dist: 105, radius: 15, hp: 1100, maxHp: 1100, active: true, hitFlash: 0, orbitalHitCd: 0 },
    { angle: (Math.PI * 4) / 3, dist: 105, radius: 15, hp: 1100, maxHp: 1100, active: true, hitFlash: 0, orbitalHitCd: 0 }
  ];
  boss.orbitalAngularVelocity = 0.024;

  // 4. Placas Tectônicas Decorativas (Fragmentos flutuantes reativos)
  boss.floatingPlates = [
    { angleOffset: 0.78, dist: 84, baseDist: 84, size: 24, wobblePhase: 0 },
    { angleOffset: 2.35, dist: 84, baseDist: 84, size: 22, wobblePhase: 1.5 },
    { angleOffset: 3.92, dist: 84, baseDist: 84, size: 26, wobblePhase: 3.0 },
    { angleOffset: 5.49, dist: 84, baseDist: 84, size: 22, wobblePhase: 4.5 }
  ];

  // 5. Singularidade Abissal & Puxão Gravitacional
  boss.pullTimer = 0;
  boss.pullMaxTimer = 0;

  // 6. Controle de Fase e Fúria (< 45% HP)
  boss.hasEnraged = false;
  boss.isEnraged = false;

  // 7. Micro-animações procedurais e postura
  boss.floatBob = 0;
  boss.magmaPulse = 0;
  boss.facing = 1;
}

/**
 * Atualiza a IA, colisões de projéteis com os Litocistos e habilidades do Monólito Abissal.
 * @param {Object} e Entidade do chefe.
 * @param {number} dt Delta time do frame.
 * @param {Object} context Contexto injetado da engine.
 */
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

  // Processa ações agendadas orientadas a delta time
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

  // 1. Pulso magnético e respiração geológica
  e.floatBob = Math.sin(frameCount * 0.045) * 5;
  e.magmaPulse = (Math.sin(frameCount * (e.isEnraged ? 0.14 : 0.07)) + 1) * 0.5;
  e.facing = (player.x - e.x) > 0 ? 1 : -1;

  // 2. Interceptação de Dano & Blindagem Litoclástica
  const activeOrbitals = e.orbitals.filter(o => o.active);
  if (activeOrbitals.length > 0 && e.actionState !== 'RECOVERY') {
    if (e.hp < e.prevHp) {
      const damageTaken = e.prevHp - e.hp;
      const absorbed = damageTaken * 0.65;
      e.hp += absorbed;
      if (Math.floor(frameCount) % 4 === 0) {
        createHitParticles(e.x, e.y, '#7f8c8d', 2);
      }
    }
  }
  e.prevHp = e.hp;

  // 3. Atualização dos Litocistos e Colisão com Armas do Jogador
  updateLitocistos(e, dt, context);

  // 4. Transição para Fase de Fúria (< 45% HP)
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

    e.orbitals = [
      { angle: 0, dist: 110, radius: 16, hp: 1400, maxHp: 1400, active: true, hitFlash: 0, orbitalHitCd: 0 },
      { angle: Math.PI * 0.5, dist: 110, radius: 16, hp: 1400, maxHp: 1400, active: true, hitFlash: 0, orbitalHitCd: 0 },
      { angle: Math.PI, dist: 110, radius: 16, hp: 1400, maxHp: 1400, active: true, hitFlash: 0, orbitalHitCd: 0 },
      { angle: Math.PI * 1.5, dist: 110, radius: 16, hp: 1400, maxHp: 1400, active: true, hitFlash: 0, orbitalHitCd: 0 }
    ];

    for (let p = 0; p < 30; p++) {
      createHitParticles(e.x, e.y, '#e74c3c', 1);
    }
    return;
  }

  // 5. Efeito contínuo de brasas de Fúria
  if (e.isEnraged && Math.floor(frameCount) % 5 === 0) {
    createHitParticles(
      e.x + (Math.random() - 0.5) * e.radius * 1.3,
      e.y + (Math.random() - 0.5) * e.radius * 1.3,
      '#e74c3c',
      1
    );
  }

  // 6. MÁQUINA DE ESTADOS PRINCIPAL
  switch (e.actionState) {
    case 'ENRAGE_TRANSITION': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 4 === 0) {
        triggerShake(3);
      }
      if (e.actionTimer <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = 30;
      }
      return;
    }

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
        addDamageText(e.x, e.y, "RECONSTITUIÇÃO!", true, '#3498db');

        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 16,
          maxRadius: 200,
          speed: 4.8,
          damage: Math.round(e.damage * 0.3),
          hitPlayer: false
        });

        const orbCount = e.isEnraged ? 4 : 3;
        const orbHp = e.isEnraged ? 1300 : 1000;
        e.orbitals = [];
        for (let k = 0; k < orbCount; k++) {
          e.orbitals.push({
            angle: (k * Math.PI * 2) / orbCount,
            dist: 105,
            radius: 15,
            hp: orbHp,
            maxHp: orbHp,
            active: true,
            hitFlash: 0,
            orbitalHitCd: 0
          });
        }
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

      // Partículas convergindo do perímetro externo diretamente para o núcleo
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

      // Detonação final ao expirar a canalização
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
            x: e.x,
            y: e.y,
            vx: Math.cos(sAng) * 4.2,
            vy: Math.sin(sAng) * 4.2,
            radius: 6.5,
            damage: Math.round(e.damage * 0.28),
            life: 110
          });
        }

        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 50 : 75;
      }
      return;
    }

    case 'WINDUP': {
      e.actionTimer -= dt;

      // Trava a mira suavemente antes da execução para permitir esquiva tática
      if (e.actionTimer > (e.isEnraged ? 10 : 16)) {
        e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
      }

      // Partículas contextuais específicas do ataque durante o Windup
      if (e.currentSkill === 'FISSURE') {
        if (Math.floor(frameCount) % 3 === 0) {
          const stepDist = 40 + Math.random() * 160;
          createHitParticles(
            e.x + Math.cos(e.aimAngle) * stepDist,
            e.y + Math.sin(e.aimAngle) * stepDist,
            '#e67e22',
            1
          );
        }
      } else if (e.currentSkill === 'SEISMIC_PULSE') {
        if (Math.floor(frameCount) % 2 === 0) {
          createHitParticles(
            e.x + (Math.random() - 0.5) * 60,
            e.y + (Math.random() - 0.5) * 60,
            '#f1c40f',
            1
          );
        }
      } else if (e.currentSkill === 'SINGULARITY') {
        if (Math.floor(frameCount) % 2 === 0) {
          createHitParticles(
            e.x + (Math.random() - 0.5) * 80,
            e.y + (Math.random() - 0.5) * 80,
            '#a29bfe',
            1
          );
        }
      } else if (e.currentSkill === 'BASALT_BARRAGE') {
        if (Math.floor(frameCount) % 3 === 0) {
          createHitParticles(
            e.x + (Math.random() - 0.5) * 40,
            e.y - 20 - Math.random() * 30,
            '#ff7675',
            1
          );
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
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        curSpeed *= (1 - 0.18);
      }

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

/**
 * Atualiza o movimento orbital dos Litocistos e calcula colisões perfeitamente sincronizadas com a renderização.
 */
function updateLitocistos(e, dt, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;
  const bob = e.isVulnerable ? 24 : (e.floatBob || 0);

  for (let o of e.orbitals) {
    if (o.hitFlash > 0) o.hitFlash -= dt;
    if (o.orbitalHitCd > 0) o.orbitalHitCd -= dt;

    if (!o.active) continue;

    o.angle += e.orbitalAngularVelocity * dt;
    const ox = e.x + Math.cos(o.angle) * o.dist;
    const oy = e.y + Math.sin(o.angle) * o.dist + bob;

    // Colisão com Projéteis do Jogador
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      const bdx = b.x - ox;
      const bdy = b.y - oy;
      const rSum = (b.radius || 6) + o.radius;

      if (bdx * bdx + bdy * bdy < rSum * rSum) {
        const dmg = b.damage || 22;
        o.hp -= dmg;
        o.hitFlash = 3;
        createHitParticles(ox, oy, '#e67e22', 3);
        addDamageText(ox, oy, Math.round(dmg), false, '#e67e22');
        playSfx('hit');

        b.piercing = (b.piercing || 1) - 1;
        if (b.piercing <= 0) {
          b.life = 0;
        }

        if (o.hp <= 0) {
          o.active = false;
          triggerShake(8);
          triggerHaptic('medium');
          playSfx('boss');
          createHitParticles(ox, oy, '#d35400', 14);
          addDamageText(ox, oy, "LITOCISTO QUEBRADO!", true, '#f1c40f');
          checkLitocistoCollapse(e, context);
          break;
        }
      }
    }

    // Colisão com Orbitais do Jogador (Machados / Runas)
    if (player.orbitals > 0 && o.active && o.orbitalHitCd <= 0) {
      const pOrbDist = player.evolvedOrbitals ? 88 : 72;
      for (let k = 0; k < player.orbitals; k++) {
        const pAng = player.orbitalAngle + (k * Math.PI * 2 / player.orbitals);
        const px = player.x + Math.cos(pAng) * pOrbDist;
        const py = player.y + Math.sin(pAng) * pOrbDist;

        if ((px - ox) ** 2 + (py - oy) ** 2 < (o.radius + 14) ** 2) {
          const dmg = player.damage * (player.evolvedOrbitals ? 1.1 : 0.7);
          o.hp -= dmg;
          o.hitFlash = 4;
          o.orbitalHitCd = 16;
          createHitParticles(ox, oy, '#f39c12', 3);
          addDamageText(ox, oy, Math.round(dmg), false, '#f39c12');
          playSfx('hit');

          if (o.hp <= 0) {
            o.active = false;
            triggerShake(8);
            triggerHaptic('medium');
            playSfx('boss');
            createHitParticles(ox, oy, '#d35400', 14);
            addDamageText(ox, oy, "LITOCISTO QUEBRADO!", true, '#f1c40f');
            checkLitocistoCollapse(e, context);
            break;
          }
        }
      }
    }
  }
}

/**
 * Avalia se todos os Litocistos foram destruídos para disparar o estado de Exaustão.
 */
function checkLitocistoCollapse(boss, context) {
  const activeRemaining = boss.orbitals.filter(o => o.active).length;
  if (activeRemaining === 0 && boss.actionState !== 'RECOVERY' && boss.actionState !== 'ENRAGE_TRANSITION') {
    boss.actionState = 'RECOVERY';
    boss.recoveryTimer = boss.isEnraged ? 210 : 270;
    boss.isVulnerable = true;

    context.triggerShake(14);
    triggerHaptic('heavy');
    playSfx('boss');
    context.addDamageText(boss.x, boss.y, "SOBRECARGA SÍSMICA!", true, '#f1c40f');

    for (let i = 0; i < 22; i++) {
      context.createHitParticles(boss.x, boss.y, '#e67e22', 1);
    }
  }
}

/**
 * Seleciona a próxima habilidade com base na distância e fase da luta.
 */
function selectNextSkill(e, dist) {
  const isEnraged = e.isEnraged;
  const rand = Math.random();

  if (dist < 180) {
    e.currentSkill = 'SEISMIC_PULSE';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 28 : 40;
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

/**
 * Executa o ataque preparado após a conclusão da telegrafia.
 */
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

      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 48 : 72;
      break;
    }

    case 'SEISMIC_PULSE': {
      playSfx('boss');
      triggerShake(14);
      triggerHaptic('heavy');

      // Onda de choque rápida limpa e única
      bossShockwaves.push({
        x: e.x,
        y: e.y,
        radius: 16,
        maxRadius: 270,
        speed: 5.2,
        damage: Math.round(e.damage * 0.48),
        hitPlayer: false
      });

      // Estilhaços de basalto disparados com atraso para não serem mascarados pela onda
      const shardCount = e.isEnraged ? 12 : 8;
      e.delayedActions.push({
        timer: 14,
        callback: () => {
          playSfx('shoot');
          for (let s = 0; s < shardCount; s++) {
            const sAng = (s * Math.PI * 2) / shardCount;
            enemyBullets.push({
              x: e.x + Math.cos(sAng) * 22,
              y: e.y + Math.sin(sAng) * 22,
              vx: Math.cos(sAng) * 3.4,
              vy: Math.sin(sAng) * 3.4,
              radius: 6.5,
              damage: Math.round(e.damage * 0.22),
              life: 110
            });
          }
        }
      });

      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 45 : 68;
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

      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 44 : 64;
      break;
    }

    default: {
      e.actionState = 'CHASE';
      e.skillCooldown = 60;
      break;
    }
  }
}

/**
 * Desenha a sombra dinâmica projetada sobre o chão.
 */
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

/**
 * Glifo circular dourado projetado no solo durante a janela de vulnerabilidade.
 */
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

/**
 * Desenha as placas tectônicas trapezoidais flutuantes reagindo à postura de cada habilidade.
 */
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
      // Postura: Placas erguidas acima do monólito como marreta sísmica
      const spread = (i - 1.5) * 24;
      const tremble = (Math.random() - 0.5) * 4;
      px = spread + tremble;
      py = -82 + bob + Math.abs(spread) * 0.3 + tremble;
      rot = (spread / 60);
    } else if (isWindup && skill === 'SINGULARITY') {
      // Postura: Vórtice cerrado girando em alta rotação ao redor do núcleo
      const fastAng = p.angleOffset + frameCount * 0.16;
      px = Math.cos(fastAng) * 42;
      py = Math.sin(fastAng) * 28 + bob;
      rot = fastAng + Math.PI / 2;
    } else if (isWindup && skill === 'FISSURE') {
      // Postura: Placas projetadas à frente formando uma cunha direcionada
      const aim = e.aimAngle || 0;
      const wedgeDist = 65 + (i % 2 === 0 ? 15 : 0);
      const wedgeSpread = (i - 1.5) * 0.35;
      px = Math.cos(aim + wedgeSpread) * wedgeDist;
      py = Math.sin(aim + wedgeSpread) * (wedgeDist * 0.55) + bob;
      rot = aim + Math.PI / 2;
    } else if (isWindup && skill === 'BASALT_BARRAGE') {
      // Postura: Placas inclinadas para o alto como canhões de morteiro
      const pAng = p.angleOffset + frameCount * 0.02;
      px = Math.cos(pAng) * 94;
      py = Math.sin(pAng) * 55 + bob - 15;
      rot = -0.4;
    } else {
      // Postura Padrão: Órbita cadenciada
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

/**
 * Desenha o corpo do megálito de basalto com facetamento isométrico tridimensional.
 */
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

/**
 * Desenha veias e runas esculpidas no basalto com pulso térmico.
 */
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

/**
 * Núcleo Abissal: Câmara de energia com reatividade aos estados de Windup e Singularidade.
 */
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

/**
 * Desenha os Litocistos Tectônicos em órbita circular estrita idêntica às coordenadas físicas.
 */
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

/**
 * Desenha a área de sucção e a detonação da Singularidade Abissal.
 */
function drawSingularityField(ctx, e, frameCount) {
  const R = 420;
  const progress = e.pullMaxTimer > 0 ? (1 - e.pullTimer / e.pullMaxTimer) : 0;

  // 1. Campo de gravidade no solo
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

  // 2. Braços espirais de sucção convergindo para o monólito
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

  // 3. Anel de contagem regressiva para a detonação (retração intuitiva)
  const warnR = R * (1 - progress);
  ctx.strokeStyle = progress > 0.8 ? '#ff4757' : '#a29bfe';
  ctx.lineWidth = progress > 0.8 ? 3.5 : 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(30, warnR), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Renderizador Vetorial Master do Monólito Abissal.
 * @param {CanvasRenderingContext2D} ctx Contexto 2D do Canvas.
 * @param {Object} e Entidade do chefe.
 * @param {number} frameCount Contador global de frames.
 */
export function drawAbyssalMonolith(ctx, e, frameCount) {
  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged;
  const isWindup = e.actionState === 'WINDUP';
  const isChanneling = e.actionState === 'CHANNELING_PULL';

  let bob = isVuln ? 24 : (e.floatBob || 0);
  if (isWindup && e.currentSkill === 'SEISMIC_PULSE') {
    bob -= 18; // Monólito levita alto antes de esmagar o chão
  }

  ctx.save();
  // Anula a escala horizontal de facing do renderer para garantir que os cálculos
  // trigonométricos de órbitas e telegrafias batam exatamente com o espaço de mundo físico
  ctx.scale(e.facing, 1);

  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.8);
  }

  // 1. Campo de Singularidade Gravitacional
  if (isChanneling) {
    drawSingularityField(ctx, e, frameCount);
  }

  // 2. Prévia Direcional da Fissura no Solo durante o Windup
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

  // 3. Sombra projetada
  drawShadow(ctx, e, bob, isVuln);

  // 4. Glifo de Vulnerabilidade quando exausto
  if (isVuln) {
    drawVulnerabilityGliph(ctx, e, frameCount);
  }

  // 5. Placas Tectônicas Flutuantes
  drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup);

  // 6. Corpo Primário de Basalto
  drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged);

  // 7. Núcleo Abissal / Fornalha Central
  drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isChanneling, isWindup);

  // 8. Litocistos Tectônicos (Orbes de contenção física sincronizada)
  drawLitocistos(ctx, e, bob, frameCount, isEnraged);

  ctx.restore();
}