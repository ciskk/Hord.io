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

  // Fila de ações diferidas sincronizadas com o delta time (dt)
  boss.delayedActions = [];

  // 2. Janelas de Vulnerabilidade e Colapso
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;
  boss.prevHp = boss.hp;

  // 3. Litocistos Tectônicos (Orbes de Blindagem Destrutíveis)
  // Enquanto ao menos um estiver ativo, o monólito mitiga a maior parte do dano recebido.
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
  // Caso haja Litocistos ativos, a carcaça de pedra refrata 65% do dano bruto sofrido
  const activeOrbitals = e.orbitals.filter(o => o.active);
  if (activeOrbitals.length > 0 && e.actionState !== 'RECOVERY') {
    if (e.hp < e.prevHp) {
      const damageTaken = e.prevHp - e.hp;
      const absorbed = damageTaken * 0.65;
      e.hp += absorbed; // Restaura a porção mitigada pela blindagem
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

    // Onda cataclísmica de repulsão
    bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 18,
      maxRadius: 320,
      speed: 6.2,
      damage: Math.round(e.damage * 0.4),
      hitPlayer: false
    });

    // Reformulação com 4 Litocistos Magmáticos Incandescentes
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

    // Janela de Exaustão Sísmica (Sobrecarga após quebra dos Litocistos)
    case 'RECOVERY': {
      e.recoveryTimer -= dt;
      e.isVulnerable = true;

      // Partículas de colapso de pedra
      if (Math.floor(frameCount) % 6 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius,
          e.y + (Math.random() - 0.5) * e.radius,
          '#f1c40f',
          1
        );
      }

      if (e.recoveryTimer <= 0) {
        // Fim da exaustão: reconstitui os orbes com uma onda de choque defensiva
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

    // Singularidade Abissal: Sucção gravitacional + detonação radial
    case 'CHANNELING_PULL': {
      e.pullTimer -= dt;

      // Vetor de atração gravitacional suave sobre o jogador
      const pdx = e.x - player.x;
      const pdy = e.y - player.y;
      const pDist = Math.hypot(pdx, pdy);

      if (pDist > 40 && pDist < 420) {
        const pullForce = (e.isEnraged ? 1.05 : 0.85) * dt;
        player.x += (pdx / pDist) * pullForce;
        player.y += (pdy / pDist) * pullForce;
      }

      if (Math.floor(frameCount) % 3 === 0) {
        triggerShake(1.6);
        createHitParticles(
          player.x + (Math.random() - 0.5) * 60,
          player.y + (Math.random() - 0.5) * 60,
          '#c0392b',
          1
        );
      }

      // Detonação no término da canalização
      if (e.pullTimer <= 0) {
        triggerShake(15);
        triggerHaptic('heavy');
        playSfx('boss');

        // Onda anelar de compressão
        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 18,
          maxRadius: 280,
          speed: 5.2,
          damage: Math.round(e.damage * 0.55),
          hitPlayer: false
        });

        // Salva circular de fragmentos basálticos com aberturas de esquiva
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

      // Partículas convergindo para o núcleo durante o preparo
      if (Math.floor(frameCount) % 3 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 1.1,
          e.y + (Math.random() - 0.5) * e.radius * 1.1,
          '#e67e22',
          1
        );
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

      // Flutuação tectônica em perseguição cadenciada
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
 * Atualiza o movimento orbital dos Litocistos e calcula colisões contra armas do jogador.
 */
function updateLitocistos(e, dt, context) {
  // triggerHaptic removido da desestruturação para usar a função importada
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  let activeCount = 0;
  for (let o of e.orbitals) {
    if (o.hitFlash > 0) o.hitFlash -= dt;
    if (o.orbitalHitCd > 0) o.orbitalHitCd -= dt;

    if (!o.active) continue;
    activeCount++;

    o.angle += e.orbitalAngularVelocity * dt;
    const ox = e.x + Math.cos(o.angle) * o.dist;
    const oy = e.y + Math.sin(o.angle) * o.dist;

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
    boss.recoveryTimer = boss.isEnraged ? 210 : 270; // 3.5s a 4.5s
    boss.isVulnerable = true;

    context.triggerShake(14);
    triggerHaptic('heavy'); // Usando a função importada diretamente
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
    // Impacto sísmico concêntrico se o jogador estiver muito próximo
    e.currentSkill = 'SEISMIC_PULSE';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 24 : 34;
  } else if (dist > 300 && rand < 0.40) {
    // Singularidade gravitacional se o jogador tentar manter distância excessiva
    e.currentSkill = 'SINGULARITY';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 28 : 38;
  } else if (rand < 0.50) {
    // Fissura tectônica em leque
    e.currentSkill = 'FISSURE';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 26 : 36;
  } else {
    // Bombardeio basáltico preditivo
    e.currentSkill = 'BASALT_BARRAGE';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 24 : 32;
  }
}

/**
 * Executa o ataque preparado após a conclusão da telegrafia.
 */
function executePreparedSkill(e, context) {
  // triggerHaptic removido da desestruturação para usar a função importada
  const {
    player,
    enemyBullets,
    bossTelegraphs,
    bossShockwaves,
    triggerShake
  } = context;

  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const angleToPlayer = Math.atan2(dy, dx);

  switch (e.currentSkill) {
    // 1. FISSURA TECTÔNICA: Linhas de fratura que detonam em estacas e magma residual
    case 'FISSURE': {
      playSfx('boss');
      triggerShake(9);
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
            x: nodeX,
            y: nodeY,
            radius: 28,
            timer: 14 + n * 6,
            maxTimer: 14 + n * 6,
            damage: Math.round(e.damage * 0.40)
          });

          // Deixa pequenas poças incandescentes nas junções
          if (n === nodeCount && e.isEnraged) {
            e.delayedActions.push({
              timer: 14 + n * 6,
              callback: () => {
                acidPuddles.push({
                  x: nodeX,
                  y: nodeY,
                  radius: 30,
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
      e.skillCooldown = e.isEnraged ? 45 : 70;
      break;
    }

    // 2. ONDA SÍSMICA CONCÊNTRICA: Duplo pulso anelar + disparos fragmentados
    case 'SEISMIC_PULSE': {
      playSfx('boss');
      triggerShake(13);
      triggerHaptic('heavy');

      // Onda principal
      bossShockwaves.push({
        x: e.x,
        y: e.y,
        radius: 14,
        maxRadius: 260,
        speed: 4.8,
        damage: Math.round(e.damage * 0.48),
        hitPlayer: false
      });

      // Segunda onda defasada
      e.delayedActions.push({
        timer: 10,
        callback: () => {
          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 14,
            maxRadius: 240,
            speed: 4.2,
            damage: Math.round(e.damage * 0.35),
            hitPlayer: false
          });
        }
      });

      // Disparo de estilhaços basálticos radiais com rotas seguras
      const shardCount = e.isEnraged ? 12 : 8;
      for (let s = 0; s < shardCount; s++) {
        const sAng = (s * Math.PI * 2) / shardCount;
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(sAng) * 3.8,
          vy: Math.sin(sAng) * 3.8,
          radius: 6,
          damage: Math.round(e.damage * 0.22),
          life: 100
        });
      }

      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 40 : 65;
      break;
    }

    // 3. ENTRADA NA SINGULARIDADE ABISSAL
    case 'SINGULARITY': {
      playSfx('boss');
      triggerShake(7);
      e.actionState = 'CHANNELING_PULL';
      e.pullTimer = e.isEnraged ? 75 : 95;
      e.pullMaxTimer = e.pullTimer;
      break;
    }

    // 4. BOMBARDEIO BASÁLTICO PREDITIVO
    case 'BASALT_BARRAGE': {
      playSfx('shoot');
      triggerShake(6);

      const impactCount = e.isEnraged ? 4 : 3;
      for (let m = 0; m < impactCount; m++) {
        // Dispersão ao redor do curso estimado do jogador
        const offsetAng = (m * Math.PI * 2) / impactCount + Math.random() * 0.4;
        const offsetDist = 40 + Math.random() * 70;
        const targetX = player.x + Math.cos(offsetAng) * offsetDist;
        const targetY = player.y + Math.sin(offsetAng) * offsetDist;

        bossTelegraphs.push({
          x: targetX,
          y: targetY,
          radius: 46,
          timer: 38 + m * 8,
          maxTimer: 38 + m * 8,
          damage: Math.round(e.damage * 0.45)
        });
      }

      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 42 : 60;
      break;
    }

    default: {
      e.actionState = 'CHASE';
      e.skillCooldown = 60;
      break;
    }
  }
}

// ============================================================================
// SISTEMA DE RENDERIZAÇÃO PROCEDURAL VETORIAL (CANVAS 2D)
// ============================================================================

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

  // Runas quebradas em órbita do glifo
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
 * Desenha as placas tectônicas trapezoidais flutuantes que orbitam a carcaça.
 */
function drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup) {
  const plateColDark = isVuln ? '#1e272e' : (isEnraged ? '#3d0c11' : '#1e272e');
  const plateColLight = isVuln ? '#2f3640' : (isEnraged ? '#6b1118' : '#2f3640');
  const trimCol = isVuln ? '#57606f' : (isEnraged ? '#ff4757' : '#e67e22');

  for (let p of e.floatingPlates) {
    const pAng = p.angleOffset + (frameCount * (isEnraged ? 0.025 : 0.015));
    const wobble = Math.sin(frameCount * 0.08 + p.wobblePhase) * 4;
    const currentDist = isVuln ? 52 : (isWindup ? 68 : p.baseDist + wobble);
    const px = Math.cos(pAng) * currentDist;
    const py = (Math.sin(pAng) * (currentDist * 0.45)) + bob + (isVuln ? 34 : 0);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(pAng + Math.PI / 2);

    // Corpo trapezoidal da placa
    const sz = p.size;
    ctx.fillStyle = plateColDark;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.6, -sz * 0.5);
    ctx.lineTo(sz * 0.6, -sz * 0.5);
    ctx.lineTo(sz * 0.4, sz * 0.5);
    ctx.lineTo(-sz * 0.4, sz * 0.5);
    ctx.closePath();
    ctx.fill();

    // Bisel superior iluminado
    ctx.fillStyle = plateColLight;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.6, -sz * 0.5);
    ctx.lineTo(0, -sz * 0.3);
    ctx.lineTo(sz * 0.6, -sz * 0.5);
    ctx.closePath();
    ctx.fill();

    // Runa incandescente inscrita na placa
    if (!isVuln) {
      ctx.strokeStyle = trimCol;
      ctx.lineWidth = 1.4;
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

  // 1. Faceta Esquerda (Sombreada)
  ctx.fillStyle = basaltShadow;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-44, waistY);
  ctx.lineTo(-24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  // 2. Faceta Direita (Iluminada)
  ctx.fillStyle = basaltLight;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(44, waistY);
  ctx.lineTo(24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  // 3. Quilha Central (Transição Média)
  ctx.fillStyle = basaltMid;
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(-18, waistY + 4);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(18, waistY + 4);
  ctx.closePath();
  ctx.fill();

  // 4. Arestas e Contornos Rígidos
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

  // Linha da crista vertical
  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(0, botY + 6);
  ctx.stroke();

  // 5. Fissuras Rúnicas Magmáticas
  drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged);
}

/**
 * Desenha veias e runas esculpidas no basalto com pulso térmico.
 */
function drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged) {
  if (isVuln) {
    // Fissuras apagadas (cinza carvão) durante a vulnerabilidade
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

  // Fenda lateral esquerda
  ctx.moveTo(-6, -42 + bob);
  ctx.lineTo(-26, -14 + bob);
  ctx.lineTo(-14, 22 + bob);

  // Fenda lateral direita
  ctx.moveTo(6, -42 + bob);
  ctx.lineTo(26, -14 + bob);
  ctx.lineTo(14, 22 + bob);

  // Fenda de raiz basal
  ctx.moveTo(-10, 32 + bob);
  ctx.lineTo(0, 42 + bob);
  ctx.lineTo(10, 32 + bob);
  ctx.stroke();

  // Miolo incandescente de maior calor
  ctx.strokeStyle = veinColGlow;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

/**
 * Núcleo Abissal: Câmara de magma e energia no centro do monólito.
 */
function drawAbyssalCore(ctx, bob, frameCount, isVuln, isEnraged, isChanneling) {
  const coreY = -4 + bob;
  const coreBaseRadius = isVuln ? 10 : (isChanneling ? 24 : 16);
  const pulse = isVuln ? 0 : Math.sin(frameCount * (isEnraged ? 0.22 : 0.12)) * 2.5;
  const currentR = Math.max(6, coreBaseRadius + pulse);

  // Anel de contenção rúnico ao redor do núcleo
  ctx.strokeStyle = isVuln ? '#34495e' : (isEnraged ? '#ff4757' : '#f39c12');
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(0, coreY, currentR + 4, 0, Math.PI * 2);
  ctx.stroke();

  // Gradiente radial do forno interno
  const grad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, currentR);
  if (isVuln) {
    grad.addColorStop(0, '#7f8c8d');
    grad.addColorStop(0.7, '#2c3e50');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
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

  // Pupila / Fenda de singularidade
  if (!isVuln) {
    ctx.fillStyle = '#1e0508';
    ctx.beginPath();
    ctx.ellipse(0, coreY, 2.5, currentR * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Desenha os Litocistos Tectônicos orbitais e seus filamentos de energia conectados ao monólito.
 */
function drawLitocistos(ctx, e, bob, frameCount, isEnraged) {
  const coreY = -4 + bob;

  for (let o of e.orbitals) {
    if (!o.active) continue;

    const ox = Math.cos(o.angle) * o.dist;
    const oy = (Math.sin(o.angle) * (o.dist * 0.46)) + bob;

    // 1. Filamento de plasma ligando o Litocisto ao núcleo
    ctx.save();
    ctx.strokeStyle = isEnraged ? 'rgba(255, 71, 87, 0.45)' : 'rgba(230, 126, 34, 0.4)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, coreY);
    ctx.quadraticCurveTo(ox * 0.5, oy * 0.3 - 10, ox, oy);
    ctx.stroke();
    ctx.restore();

    // 2. Corpo do Litocisto (Casca basáltica + plasma central)
    ctx.save();
    ctx.translate(ox, oy);

    if (o.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, o.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Casca rochosa externa
      ctx.fillStyle = isEnraged ? '#3d0c11' : '#2f3640';
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fill();

      // Borda com cor de magma
      ctx.strokeStyle = isEnraged ? '#ff4757' : '#e67e22';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Núcleo do orbe
      const orbGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, o.radius * 0.65);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.5, isEnraged ? '#ff6b81' : '#f1c40f');
      orbGrad.addColorStop(1, isEnraged ? '#c0392b' : '#d35400');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Arco medidor de integridade (HP do Litocisto)
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

  // O monólito afunda no solo durante a exaustão
  const bob = isVuln ? 24 : (e.floatBob || 0);

  ctx.save();
  // REMOVIDO: ctx.translate(e.x, e.y); para evitar duplicação do deslocamento feito em renderer.js

  // Tremor sísmico durante preparos e canalizações
  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 3.2, (Math.random() - 0.5) * 3.2);
  }

  // 1. Sombra projetada
  drawShadow(ctx, e, bob, isVuln);

  // 2. Glifo de Vulnerabilidade quando exausto
  if (isVuln) {
    drawVulnerabilityGliph(ctx, e, frameCount);
  }

  // 3. Placas Tectônicas Flutuantes
  drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup);

  // 4. Corpo Primário de Basalto
  drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged);

  // 5. Núcleo Abissal / Fornalha Central
  drawAbyssalCore(ctx, bob, frameCount, isVuln, isEnraged, isChanneling);

  // 6. Litocistos Tectônicos (Orbes de contenção)
  drawLitocistos(ctx, e, bob, frameCount, isEnraged);

  ctx.restore();
}