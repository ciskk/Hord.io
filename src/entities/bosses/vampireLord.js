import { playSfx, triggerHaptic } from '../../core/audio.js';
import { acidPuddles } from '../../main.js';

/**
 * Inicializa propriedades exclusivas, flags mecânicas e parâmetros visuais do Lorde Vampírico.
 * @param {Object} boss 
 */
export function initVampireLord(boss) {
  // Máquina de estados principal:
  // 'CHASE', 'WINDUP', 'RECOVERY', 'ENRAGE_TRANSITION', 'CHANNELING_SPIRAL', 'MIST_DASH', 'MIST_DASH_PAUSE', 'MIST_BRAKE', 'TELEPORTING'
  boss.actionState = 'CHASE';
  boss.actionTimer = 0;
  boss.currentSkill = null; // 'CLEAVE', 'SWARM', 'MIST_DASH', 'TELEPORT', 'BLOOD_BURST', 'SPIRAL_BARRAGE', 'PINCER_SHOT'
  boss.skillCooldown = 70;
  boss.aimAngle = 0;
  boss.isWingPrepping = false;

  // Janelas de vulnerabilidade e recuperação
  boss.recoveryTimer = 0;
  boss.isVulnerable = false;

  // Estados de investida em névoa
  boss.mistState = 'IDLE'; // 'IDLE' ou 'DASHING'
  boss.mistDuration = 0;
  boss.mistAngle = 0;
  boss.mistDashesLeft = 0;

  // Teleporte predatório e dreno
  boss.isTeleporting = false;
  boss.teleportTarget = { x: 0, y: 0 };
  boss.teleportResolveTimer = 0;

  // Estados de canalização do disparo em espiral
  boss.spiralTimer = 0;
  boss.spiralWavesLeft = 0;
  boss.spiralAngle = 0;

  // Controle de fase e fúria
  boss.hasEnraged = false;
  boss.isEnraged = false;

  // Micro-animações e postura procedural
  boss.floatBob = 0;
  boss.wingSpread = 1.0;
  boss.facing = 1;
}

/**
 * Atualiza a IA, colisões e padrões de ataque do Lorde Vampírico.
 * @param {Object} e Entidade do chefe.
 * @param {number} dt Delta time do frame.
 * @param {Object} context Contexto global injetado do loop.
 */
export function updateVampireLord(e, dt, context) {
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

  // 1. Orientação horizontal e postura com mira travada
  if (e.actionState === 'WINDUP') {
    e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;
  } else if (
    e.actionState !== 'RECOVERY' && 
    e.actionState !== 'MIST_BRAKE' && 
    e.actionState !== 'MIST_DASH_PAUSE' && 
    e.actionState !== 'TELEPORTING'
  ) {
    e.facing = (player.x - e.x) > 0 ? 1 : -1;
  }
  e.floatBob = Math.sin(frameCount * 0.08) * 4;

  // 2. Transição para Fase de Fúria (< 45% HP)
  const hpRatio = e.hp / e.maxHp;
  if (hpRatio < 0.45 && !e.hasEnraged) {
    e.hasEnraged = true;
    e.isEnraged = true;
    e.speed *= 1.28;
    e.actionState = 'ENRAGE_TRANSITION';
    e.actionTimer = 55;
    e.mistState = 'IDLE';
    e.isTeleporting = false;
    e.isWingPrepping = false;
    e.isVulnerable = false;

    triggerShake(16);
    triggerHaptic('heavy');
    playSfx('boss');
    addDamageText(e.x, e.y, "DESPERTAR DA FÚRIA!", true, '#e74c3c');

    bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 16,
      maxRadius: 240,
      speed: 5.5,
      damage: Math.round(e.damage * 0.35),
      hitPlayer: false
    });

    for (let p = 0; p < 24; p++) {
      createHitParticles(e.x, e.y, '#e74c3c', 1);
    }
    return;
  }

  // 3. Efeitos contínuos de partículas de Fúria
  if (e.isEnraged && Math.floor(frameCount) % 4 === 0) {
    createHitParticles(
      e.x + (Math.random() - 0.5) * e.radius * 1.2,
      e.y + (Math.random() - 0.5) * e.radius * 1.2,
      '#e74c3c',
      1
    );
  }

  // 4. MÁQUINA DE ESTADOS PRINCIPAL
  switch (e.actionState) {
    case 'ENRAGE_TRANSITION': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 3 === 0) {
        triggerShake(2);
      }
      if (e.actionTimer <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = 25;
      }
      return;
    }

    case 'RECOVERY': {
      e.recoveryTimer -= dt;
      e.isVulnerable = true;

      if (Math.floor(frameCount) % 6 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 0.8,
          e.y + (Math.random() - 0.5) * e.radius * 0.8,
          '#f1c40f',
          1
        );
      }

      if (e.recoveryTimer <= 0) {
        e.isVulnerable = false;
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 40 : 65;
      }
      return;
    }

    case 'MIST_DASH': {
      e.mistState = 'DASHING';
      const dashSpeed = e.speed * (e.isEnraged ? 4.2 : 3.6);
      e.x += Math.cos(e.mistAngle) * dashSpeed * dt;
      e.y += Math.sin(e.mistAngle) * dashSpeed * dt;
      e.actionTimer -= dt;

      createHitParticles(e.x, e.y, '#8e44ad', 2);
      createHitParticles(e.x, e.y, '#2c0c16', 1);

      const mdx = player.x - e.x;
      const mdy = player.y - e.y;
      if (mdx * mdx + mdy * mdy < (player.radius + e.radius * 0.75) ** 2 && player.iFrames <= 0) {
        const mistDmg = Math.round(e.damage * 0.6);
        player.hp -= mistDmg;
        player.iFrames = 25;
        triggerShake(9);
        triggerHaptic('medium');
        playSfx('hit');
        addDamageText(player.x, player.y, `-${mistDmg}`, false, '#8e44ad');
      }

      if (e.actionTimer <= 0) {
        e.mistDashesLeft--;

        if (e.mistDashesLeft > 0) {
          // Pausa tática intermediária com nova mira telegrafada
          e.actionState = 'MIST_DASH_PAUSE';
          e.actionTimer = 16;
          e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
          e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;
          triggerShake(4);

          bossTelegraphs.push({
            type: 'MIST_DASH_LANE',
            x: e.x,
            y: e.y,
            angle: e.aimAngle,
            length: e.speed * (e.isEnraged ? 4.2 : 3.6) * 26,
            width: e.radius * 1.8,
            timer: 16,
            maxTimer: 16,
            boss: e
          });
        } else {
          // Frenagem antes da detonação da salva radial de projéteis
          e.mistState = 'IDLE';
          e.actionState = 'MIST_BRAKE';
          e.actionTimer = 20;
          triggerShake(5);
          addDamageText(e.x, e.y, "CONDENSANDO...", false, '#e74c3c');
        }
      }
      return;
    }

    case 'MIST_DASH_PAUSE': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 3 === 0) {
        createHitParticles(e.x, e.y, '#8e44ad', 2);
      }
      if (e.actionTimer <= 0) {
        e.actionState = 'MIST_DASH';
        e.actionTimer = 26;
        e.mistAngle = e.aimAngle;
        playSfx('boss');
        triggerShake(6);
      }
      return;
    }

    case 'MIST_BRAKE': {
      e.actionTimer -= dt;
      if (Math.floor(frameCount) % 2 === 0) {
        const pAng = Math.random() * Math.PI * 2;
        const pDist = e.radius * 1.4;
        createHitParticles(e.x + Math.cos(pAng) * pDist, e.y + Math.sin(pAng) * pDist, '#ff1744', 1);
      }

      if (e.actionTimer <= 0) {
        triggerShake(9);
        playSfx('shoot');

        // Anel expansivo previsível de esferas na saída da névoa
        const ringCount = e.isEnraged ? 16 : 12;
        for (let k = 0; k < ringCount; k++) {
          const fAng = (k * Math.PI * 2) / ringCount;
          enemyBullets.push({
            x: e.x, y: e.y,
            vx: Math.cos(fAng) * 4.0, vy: Math.sin(fAng) * 4.0,
            radius: 6.5, damage: Math.round(e.damage * 0.24), life: 110
          });
        }

        e.actionState = 'RECOVERY';
        e.recoveryTimer = e.isEnraged ? 70 : 90;
        e.isVulnerable = true;
        addDamageText(e.x, e.y, "EXAUSTO!", true, '#f1c40f');
      }
      return;
    }

    case 'CHANNELING_SPIRAL': {
      e.spiralTimer -= dt;

      if (e.spiralTimer <= 0 && e.spiralWavesLeft > 0) {
        e.spiralTimer = e.isEnraged ? 4.5 : 6;
        e.spiralWavesLeft--;
        e.spiralAngle += (e.isEnraged ? 0.36 : 0.28);

        const arms = e.isEnraged ? 5 : 4;
        for (let a = 0; a < arms; a++) {
          const fAng = e.spiralAngle + (a * Math.PI * 2 / arms);
          const spd = e.isEnraged ? 4.6 : 3.8;
          enemyBullets.push({
            x: e.x, y: e.y,
            vx: Math.cos(fAng) * spd, vy: Math.sin(fAng) * spd,
            radius: 6, damage: Math.round(e.damage * 0.22), life: 125
          });
        }

        playSfx('shoot');
        triggerShake(2.5);
        createHitParticles(e.x, e.y, '#ff1744', 3);
      }

      if (e.spiralWavesLeft <= 0) {
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 40 : 60;
      }
      return;
    }

    case 'TELEPORTING': {
      e.teleportResolveTimer -= dt;
      e.mistState = 'DASHING'; // Torna invulnerável na posição de partida
      if (Math.floor(frameCount) % 4 === 0) {
        createHitParticles(e.x + (Math.random() - 0.5) * 20, e.y + (Math.random() - 0.5) * 20, '#8e44ad', 2);
      }
      if (e.teleportResolveTimer <= 0) {
        e.mistState = 'IDLE';
        e.isTeleporting = false;
        e.actionState = 'CHASE';
        e.skillCooldown = e.isEnraged ? 55 : 85;
      }
      return;
    }

    case 'WINDUP': {
      e.actionTimer -= dt;

      // Partículas específicas de acordo com o ataque preparado
      if (e.currentSkill === 'PINCER_SHOT') {
        const flankDist = 65;
        const leftX = e.x + Math.cos(e.aimAngle - Math.PI / 2) * flankDist;
        const leftY = e.y + Math.sin(e.aimAngle - Math.PI / 2) * flankDist;
        const rightX = e.x + Math.cos(e.aimAngle + Math.PI / 2) * flankDist;
        const rightY = e.y + Math.sin(e.aimAngle + Math.PI / 2) * flankDist;

        if (Math.floor(frameCount) % 2 === 0) {
          createHitParticles(leftX, leftY, '#ff1744', 1);
          createHitParticles(rightX, rightY, '#ff1744', 1);
        }
      } else if (e.currentSkill === 'SPIRAL_BARRAGE') {
        if (Math.floor(frameCount) % 2 === 0) {
          const vAng = frameCount * 0.25;
          createHitParticles(e.x + Math.cos(vAng) * 24, e.y + Math.sin(vAng) * 24, '#e74c3c', 1);
        }
      } else {
        if (Math.floor(frameCount) % 3 === 0) {
          createHitParticles(
            e.x + (Math.random() - 0.5) * e.radius * 0.9,
            e.y + (Math.random() - 0.5) * e.radius * 0.9,
            '#ff1744',
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

      if (dist > 60) {
        const angle = Math.atan2(dy, dx);
        e.x += Math.cos(angle) * curSpeed * dt;
        e.y += Math.sin(angle) * curSpeed * dt;
      }

      e.skillCooldown -= dt;

      if (e.skillCooldown <= 0) {
        selectNextSkill(e, dist, player, bossTelegraphs);
      }
      break;
    }
  }
}

/**
 * Seleciona a próxima habilidade com base no alcance, fase e ritmo, gerando os telégrafos imediatamente no início da preparação.
 */
function selectNextSkill(e, dist, player, bossTelegraphs) {
  const isEnraged = e.isEnraged;
  const rand = Math.random();
  const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);

  if (dist < 155) {
    const cleaveDuration = isEnraged ? 32 : 44;
    e.currentSkill = 'CLEAVE';
    e.actionState = 'WINDUP';
    e.actionTimer = cleaveDuration;
    e.aimAngle = angleToPlayer;
    e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;

    // Telégrafo gerado no frame 0 do windup para legibilidade completa
    bossTelegraphs.push({
      type: 'SCYTHE_CLEAVE',
      x: e.x,
      y: e.y,
      radius: 155,
      angle: e.aimAngle,
      timer: cleaveDuration,
      maxTimer: cleaveDuration,
      damage: Math.round(e.damage * 0.75),
      boss: e
    });
  } else if (dist > 320 && rand < 0.35) {
    e.currentSkill = 'TELEPORT';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 20 : 30;
    e.aimAngle = angleToPlayer;
    e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;
  } else if (rand < 0.22) {
    const dashWindup = isEnraged ? 22 : 32;
    e.currentSkill = 'MIST_DASH';
    e.actionState = 'WINDUP';
    e.actionTimer = dashWindup;
    e.aimAngle = angleToPlayer;
    e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;

    // Faixa telegrafada do trajeto da investida
    bossTelegraphs.push({
      type: 'MIST_DASH_LANE',
      x: e.x,
      y: e.y,
      angle: e.aimAngle,
      length: e.speed * (isEnraged ? 4.2 : 3.6) * 28,
      width: e.radius * 1.8,
      timer: dashWindup,
      maxTimer: dashWindup,
      boss: e
    });
  } else if (rand < 0.46) {
    e.currentSkill = 'SPIRAL_BARRAGE';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 24 : 34;
    e.aimAngle = angleToPlayer;
    e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;
  } else if (rand < 0.68) {
    e.currentSkill = 'PINCER_SHOT';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 22 : 32;
    e.aimAngle = angleToPlayer;
    e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;
    e.isWingPrepping = true;
  } else if (isEnraged && rand < 0.84) {
    e.currentSkill = 'BLOOD_BURST';
    e.actionState = 'WINDUP';
    e.actionTimer = 36;
    e.aimAngle = angleToPlayer;
    e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;
  } else {
    e.currentSkill = 'SWARM';
    e.actionState = 'WINDUP';
    e.actionTimer = isEnraged ? 20 : 28;
    e.aimAngle = angleToPlayer;
    e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;
  }
}

/**
 * Dispara o golpe preparado quando a telegrafia termina.
 */
function executePreparedSkill(e, context) {
  const {
    player,
    enemyBullets,
    bossTelegraphs,
    triggerShake,
    createHitParticles
  } = context;

  const targetAngle = e.aimAngle;

  switch (e.currentSkill) {
    case 'CLEAVE': {
      playSfx('boss');
      triggerShake(10);
      triggerHaptic('medium');

      // Avanço físico sincronizado com a direção exata telegrafada
      e.x += Math.cos(targetAngle) * 28;
      e.y += Math.sin(targetAngle) * 28;

      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 45 : 70;
      break;
    }

    case 'SWARM': {
      playSfx('shoot');
      triggerShake(6);

      const count = e.isEnraged ? 12 : 8;
      const totalArc = Math.PI * (e.isEnraged ? 0.7 : 0.55);
      const step = totalArc / (count - 1);
      const startAngle = targetAngle - totalArc / 2;

      for (let k = 0; k < count; k++) {
        const bAng = startAngle + (k * step);
        const speedVar = 4.2 + (Math.abs(k - (count - 1) / 2) * 0.25);
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * speedVar,
          vy: Math.sin(bAng) * speedVar,
          radius: 6.5,
          damage: Math.round(e.damage * 0.24),
          life: 115
        });
      }

      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 40 : 65;
      break;
    }

    case 'SPIRAL_BARRAGE': {
      e.actionState = 'CHANNELING_SPIRAL';
      e.spiralWavesLeft = e.isEnraged ? 8 : 6;
      e.spiralTimer = 0;
      e.spiralAngle = targetAngle;
      playSfx('boss');
      triggerShake(5);
      break;
    }

    case 'PINCER_SHOT': {
      playSfx('shoot');
      triggerShake(6);
      triggerHaptic('medium');

      const bulletsPerFlank = e.isEnraged ? 8 : 6;
      const flankOffsetDist = 65;

      const leftFlankX = e.x + Math.cos(targetAngle - Math.PI / 2) * flankOffsetDist;
      const leftFlankY = e.y + Math.sin(targetAngle - Math.PI / 2) * flankOffsetDist;
      const rightFlankX = e.x + Math.cos(targetAngle + Math.PI / 2) * flankOffsetDist;
      const rightFlankY = e.y + Math.sin(targetAngle + Math.PI / 2) * flankOffsetDist;

      for (let k = 0; k < bulletsPerFlank; k++) {
        const progress = k / (bulletsPerFlank - 1);
        const fireAng = (targetAngle + 0.55) - (progress * 0.4);
        const spd = 4.4 + progress * 1.2;
        enemyBullets.push({
          x: leftFlankX,
          y: leftFlankY,
          vx: Math.cos(fireAng) * spd,
          vy: Math.sin(fireAng) * spd,
          radius: 6.5,
          damage: Math.round(e.damage * 0.23),
          life: 120
        });
      }

      for (let k = 0; k < bulletsPerFlank; k++) {
        const progress = k / (bulletsPerFlank - 1);
        const fireAng = (targetAngle - 0.55) + (progress * 0.4);
        const spd = 4.4 + progress * 1.2;
        enemyBullets.push({
          x: rightFlankX,
          y: rightFlankY,
          vx: Math.cos(fireAng) * spd,
          vy: Math.sin(fireAng) * spd,
          radius: 6.5,
          damage: Math.round(e.damage * 0.23),
          life: 120
        });
      }

      createHitParticles(leftFlankX, leftFlankY, '#ff1744', 6);
      createHitParticles(rightFlankX, rightFlankY, '#ff1744', 6);

      e.isWingPrepping = false;
      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 45 : 70;
      break;
    }

    case 'MIST_DASH': {
      e.actionState = 'MIST_DASH';
      e.mistDashesLeft = e.isEnraged ? 2 : 1;
      e.actionTimer = 28;
      e.mistAngle = targetAngle;
      playSfx('boss');
      triggerShake(7);
      break;
    }

    case 'TELEPORT': {
      playSfx('boss');
      triggerShake(6);

      const targetX = player.x;
      const targetY = player.y;

      createHitParticles(e.x, e.y, '#8e44ad', 14);

      e.actionState = 'TELEPORTING';
      e.isTeleporting = true;
      e.mistState = 'DASHING';
      e.teleportResolveTimer = 50;

      bossTelegraphs.push({
        x: targetX,
        y: targetY,
        radius: 72,
        timer: 50,
        maxTimer: 50,
        damage: Math.round(e.damage * 0.70),
        type: 'VAMPIRE_TELEPORT',
        boss: e
      });
      break;
    }

    case 'BLOOD_BURST': {
      playSfx('acid');
      triggerShake(8);

      const puddleCount = 3;
      for (let p = 0; p < puddleCount; p++) {
        const pAngle = Math.random() * Math.PI * 2;
        const pDist = 70 + Math.random() * 110;
        const targetX = player.x + Math.cos(pAngle) * pDist;
        const targetY = player.y + Math.sin(pAngle) * pDist;

        bossTelegraphs.push({
          x: targetX,
          y: targetY,
          radius: 38,
          timer: 45,
          maxTimer: 45,
          damage: Math.round(e.damage * 0.35)
        });

        setTimeout(() => {
          acidPuddles.push({
            x: targetX,
            y: targetY,
            radius: 38,
            life: 240,
            maxLife: 240,
            isFire: false,
            isAlchemist: false
          });
        }, 750);
      }

      e.actionState = 'CHASE';
      e.skillCooldown = 80;
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
// SISTEMA DE RENDERIZAÇÃO PROCEDURAL VETORIAL
// ============================================================================

function drawTeleportDeparture(ctx, e, frameCount) {
  const progress = Math.max(0, Math.min(1, 1 - (e.teleportResolveTimer / 50)));
  const alpha = Math.max(0, 1 - progress * 1.5);
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(26, 2, 8, 0.7)';
  ctx.beginPath();
  ctx.ellipse(0, 20, e.radius * (1 - progress * 0.6), 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const batCount = 8;
  ctx.fillStyle = '#0a0104';
  for (let i = 0; i < batCount; i++) {
    const angle = (i * Math.PI * 2 / batCount) + frameCount * 0.1;
    const dist = progress * (e.radius * 2.2) + 6;
    const bx = Math.cos(angle) * dist;
    const by = Math.sin(angle) * dist * 0.6 - progress * 24;
    const flap = Math.sin(frameCount * 0.5 + i) * 5;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 6, by - 4 + flap);
    ctx.lineTo(bx - 2, by + 3);
    ctx.lineTo(bx + 2, by + 3);
    ctx.lineTo(bx + 6, by - 4 + flap);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawMistVortex(ctx, e, frameCount) {
  const t = frameCount * 0.16;

  for (let c = 0; c < 3; c++) {
    const rOffset = Math.sin(t + c * 1.8) * 5;
    ctx.fillStyle = c === 0 ? 'rgba(142, 68, 173, 0.4)' : (c === 1 ? 'rgba(104, 8, 29, 0.45)' : 'rgba(20, 2, 8, 0.55)');
    ctx.beginPath();
    ctx.ellipse((c - 1) * 8, (c % 2 === 0 ? 4 : -4), (e.radius * 0.95) + rOffset, (e.radius * 0.65) - rOffset * 0.5, t * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const batCount = 6;
  ctx.fillStyle = '#0a0104';
  for (let i = 0; i < batCount; i++) {
    const phase = t * 2 + i * (Math.PI * 2 / batCount);
    const bx = Math.cos(phase) * (e.radius * 0.75);
    const by = Math.sin(phase) * (e.radius * 0.45);
    const flap = Math.sin(frameCount * 0.45 + i) * 6;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 7, by - 5 + flap);
    ctx.lineTo(bx - 3, by + 4);
    ctx.lineTo(bx + 3, by + 4);
    ctx.lineTo(bx + 7, by - 5 + flap);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff1744';
    ctx.fillRect(bx - 1.5, by - 1, 1.2, 1.2);
    ctx.fillRect(bx + 0.5, by - 1, 1.2, 1.2);
    ctx.fillStyle = '#0a0104';
  }
}

function drawVulnerabilityGliph(ctx, e, frameCount) {
  const pulse = Math.sin(frameCount * 0.18) * 3;
  const R = e.radius * 0.95 + pulse;

  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 40, R, 15, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
  ctx.fill();

  const runeCount = 5;
  const rot = frameCount * 0.025;
  ctx.lineWidth = 1.8;
  for (let k = 0; k < runeCount; k++) {
    const a = rot + (k * Math.PI * 2 / runeCount);
    const rx = Math.cos(a) * R;
    const ry = 40 + Math.sin(a) * 15;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry - 3);
    ctx.lineTo(rx + 3, ry + 3);
    ctx.moveTo(rx + 3, ry - 3);
    ctx.lineTo(rx - 3, ry + 3);
    ctx.stroke();
  }
}

function drawSingleWing(ctx, side, flap, span, isVuln, isEnraged) {
  ctx.save();
  ctx.scale(side, 1);

  const boneCol = isVuln ? '#1a0b12' : (isEnraged ? '#4a0815' : '#140308');
  const membraneBase = isVuln ? 'rgba(40, 8, 18, 0.7)' : (isEnraged ? 'rgba(168, 15, 42, 0.85)' : 'rgba(100, 8, 26, 0.8)');
  const membraneShade = isVuln ? 'rgba(15, 2, 6, 0.8)' : (isEnraged ? 'rgba(74, 5, 18, 0.85)' : 'rgba(38, 3, 10, 0.85)');

  const rootX = -8;
  const rootY = -18;
  const elbowX = -48 * span;
  const elbowY = (-56 + flap) * span;

  const tip1X = -85 * span;
  const tip1Y = (-45 + flap * 1.3) * span;
  const tip2X = -68 * span;
  const tip2Y = (15 + flap * 0.7) * span;
  const tip3X = -46 * span;
  const tip3Y = (48 + flap * 0.3) * span;

  ctx.fillStyle = membraneBase;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(tip1X, tip1Y);
  ctx.quadraticCurveTo(tip1X + 10 * span, tip1Y + 28 * span, tip2X, tip2Y);
  ctx.quadraticCurveTo(tip2X + 8 * span, tip2Y + 20 * span, tip3X, tip3Y);
  ctx.quadraticCurveTo(tip3X + 15 * span, tip3Y - 10 * span, rootX, rootY + 38);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = membraneShade;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(tip2X, tip2Y);
  ctx.quadraticCurveTo(tip3X + 15 * span, tip3Y - 10 * span, rootX, rootY + 38);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = boneCol;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(tip1X, tip1Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(tip2X, tip2Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(tip3X, tip3Y);
  ctx.stroke();

  ctx.fillStyle = isEnraged ? '#f1c40f' : '#dfe4ea';
  const tips = [[elbowX, elbowY], [tip1X, tip1Y], [tip2X, tip2Y]];
  for (let k = 0; k < tips.length; k++) {
    ctx.beginPath();
    ctx.arc(tips[k][0], tips[k][1], 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawFluidCape(ctx, bob, frameCount, isVuln, isEnraged) {
  const wave1 = Math.sin(frameCount * 0.12) * 6;
  const wave2 = Math.cos(frameCount * 0.14) * 5;

  const capeOuter = isVuln ? '#1a0409' : (isEnraged ? '#520615' : '#22040c');
  const capeInner = isVuln ? '#420815' : (isEnraged ? '#b71540' : '#780822');
  const goldTrim = isVuln ? '#7f6000' : (isEnraged ? '#e74c3c' : '#f1c40f');

  ctx.fillStyle = '#0d0205';
  ctx.beginPath();
  ctx.moveTo(-16, -26 + bob);
  ctx.lineTo(-32, -58 + bob);
  ctx.lineTo(-10, -38 + bob);
  ctx.lineTo(10, -38 + bob);
  ctx.lineTo(32, -58 + bob);
  ctx.lineTo(16, -26 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = capeInner;
  ctx.beginPath();
  ctx.moveTo(-24, -18 + bob);
  ctx.bezierCurveTo(-42 + wave1, 20 + bob, -28 + wave2, 58 + bob, -10 + wave1, 64 + bob);
  ctx.lineTo(10 + wave2, 64 + bob);
  ctx.bezierCurveTo(28 + wave1, 58 + bob, 42 + wave2, 20 + bob, 24, -18 + bob);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = capeOuter;
  ctx.beginPath();
  ctx.moveTo(-26, -18 + bob);
  ctx.bezierCurveTo(-46 + wave1, 22 + bob, -32 + wave2, 60 + bob, 0, 68 + bob);
  ctx.bezierCurveTo(32 + wave2, 60 + bob, 46 + wave1, 22 + bob, 26, -18 + bob);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-26, -18 + bob);
  ctx.bezierCurveTo(-46 + wave1, 22 + bob, -32 + wave2, 60 + bob, 0, 68 + bob);
  ctx.bezierCurveTo(32 + wave2, 60 + bob, 46 + wave1, 22 + bob, 26, -18 + bob);
  ctx.stroke();
}

function drawGothicArmor(ctx, bob, frameCount, isVuln, isEnraged) {
  const armorSteel = isVuln ? '#120509' : (isEnraged ? '#350611' : '#1f0913');
  const goldTrim = isVuln ? '#7f6000' : (isEnraged ? '#e74c3c' : '#f1c40f');

  ctx.fillStyle = armorSteel;
  ctx.beginPath();
  ctx.moveTo(-22, -26 + bob);
  ctx.lineTo(22, -26 + bob);
  ctx.lineTo(16, 18 + bob);
  ctx.lineTo(0, 26 + bob);
  ctx.lineTo(-16, 18 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.fillStyle = isEnraged ? '#5a071a' : '#2e0817';
  ctx.beginPath();
  ctx.moveTo(-20, -28 + bob);
  ctx.lineTo(-38, -36 + bob);
  ctx.lineTo(-24, -14 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(20, -28 + bob);
  ctx.lineTo(38, -36 + bob);
  ctx.lineTo(24, -14 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, -18 + bob);
  ctx.lineTo(0, -6 + bob);
  ctx.lineTo(12, -18 + bob);
  ctx.moveTo(-8, -6 + bob);
  ctx.lineTo(0, 8 + bob);
  ctx.lineTo(8, -6 + bob);
  ctx.stroke();

  const gemPulse = Math.sin(frameCount * (isEnraged ? 0.28 : 0.15)) * 1.5;
  ctx.fillStyle = isVuln ? '#4a0815' : (isEnraged ? '#ff0037' : '#ff1744');
  ctx.beginPath();
  ctx.arc(0, -8 + bob, 4.5 + (isVuln ? 0 : gemPulse), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#0b0205';
  ctx.fillRect(-15, 12 + bob, 30, 6);
  ctx.fillStyle = goldTrim;
  ctx.fillRect(-5, 11 + bob, 10, 8);
}

function drawHeadAndFace(ctx, bob, frameCount, isVuln, isEnraged) {
  const headY = (isVuln ? -22 : -32) + bob;

  const hairSway = Math.sin(frameCount * 0.15) * 4;
  ctx.fillStyle = '#ecf0f1';
  ctx.beginPath();
  ctx.moveTo(-8, headY - 14);
  ctx.quadraticCurveTo(-26 + hairSway, headY - 8, -34 + hairSway * 1.4, headY + 12);
  ctx.lineTo(-20, headY + 2);
  ctx.quadraticCurveTo(-14, headY - 4, -4, headY - 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isVuln ? '#95a5a6' : '#dcdde1';
  ctx.beginPath();
  ctx.moveTo(0, headY - 15);
  ctx.lineTo(13, headY - 3);
  ctx.lineTo(7, headY + 12);
  ctx.lineTo(0, headY + 16);
  ctx.lineTo(-7, headY + 12);
  ctx.lineTo(-13, headY - 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2f3542';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = '#ecf0f1';
  ctx.beginPath();
  ctx.moveTo(-10, headY - 15);
  ctx.lineTo(2, headY - 6);
  ctx.lineTo(-4, headY - 2);
  ctx.lineTo(-12, headY - 10);
  ctx.closePath();
  ctx.fill();

  const eyeCol = isVuln ? '#4a0815' : (isEnraged ? '#ff0055' : '#ff1744');
  ctx.fillStyle = eyeCol;
  ctx.beginPath();
  ctx.ellipse(-5, headY - 1, 3.2, 1.8, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(5, headY - 1, 3.2, 1.8, -0.2, 0, Math.PI * 2);
  ctx.fill();

  if (!isVuln) {
    ctx.fillStyle = '#0a0104';
    ctx.fillRect(-5.5, headY - 2.5, 1.2, 3);
    ctx.fillRect(4.5, headY - 2.5, 1.2, 3);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4.5, headY - 2, 1, 1);
    ctx.fillRect(5.5, headY - 2, 1, 1);
  }
}

function drawClawsAndArms(ctx, bob, frameCount, isVuln, isEnraged, isWindup, isChanneling) {
  const armCol = isVuln ? '#140308' : (isEnraged ? '#380512' : '#220815');
  const clawCol = isVuln ? '#7f1d1d' : (isEnraged ? '#f1c40f' : '#ff4757');

  const reach = (isWindup || isChanneling) ? 14 : 0;
  const armDrop = isVuln ? 14 : 0;

  ctx.strokeStyle = armCol;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(18, -16 + bob);
  ctx.lineTo(34 + reach, -2 + bob + armDrop);
  ctx.lineTo(44 + reach, 8 + bob + armDrop);
  ctx.stroke();

  ctx.strokeStyle = clawCol;
  ctx.lineWidth = 2.4;
  const cX = 44 + reach;
  const cY = 8 + bob + armDrop;

  ctx.beginPath();
  ctx.moveTo(cX, cY - 4);
  ctx.lineTo(cX + 12, cY - 7);
  ctx.moveTo(cX + 1, cY);
  ctx.lineTo(cX + 15, cY);
  ctx.moveTo(cX, cY + 4);
  ctx.lineTo(cX + 12, cY + 7);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cX + 11, cY - 7.5, 2, 2);
  ctx.fillRect(cX + 14, cY - 0.5, 2, 2);
  ctx.fillRect(cX + 11, cY + 6.5, 2, 2);
}

/**
 * Renderizador Vetorial Master do Lorde Vampírico.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} e 
 * @param {number} frameCount 
 */
export function drawVampireLord(ctx, e, frameCount) {
  if (e.actionState === 'TELEPORTING') {
    drawTeleportDeparture(ctx, e, frameCount);
    return;
  }

  if (e.mistState === 'DASHING') {
    drawMistVortex(ctx, e, frameCount);
    return;
  }

  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged;
  const isWindup = e.actionState === 'WINDUP';
  const isChanneling = e.actionState === 'CHANNELING_SPIRAL';
  const bob = isVuln ? 12 : (e.floatBob || 0);

  if (isVuln) {
    drawVulnerabilityGliph(ctx, e, frameCount);
  } else {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 42, e.radius * 0.75 - bob * 0.4, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const wingFlap = isVuln ? 0 : Math.sin(frameCount * (isEnraged ? 0.28 : 0.16)) * 14;
  const wingSpan = isVuln ? 0.55 : (isEnraged ? 1.25 : (isChanneling ? 1.38 : (e.isWingPrepping ? 1.3 : 1.0)));

  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2.5);
  }

  drawSingleWing(ctx, -1, wingFlap, wingSpan, isVuln, isEnraged);
  drawSingleWing(ctx, 1, wingFlap, wingSpan, isVuln, isEnraged);

  // Orbes de carregamento nas asas para o disparo convergente
  if (e.isWingPrepping || (isWindup && e.currentSkill === 'PINCER_SHOT')) {
    const orbPulse = (Math.sin(frameCount * 0.3) + 1) * 2.2;
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(-58, -45 + bob, 5 + orbPulse, 0, Math.PI * 2);
    ctx.arc(58, -45 + bob, 5 + orbPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Sigilo rúnico rotativo no peito durante a canalização da espiral
  if (isChanneling) {
    const rot = frameCount * 0.12;
    ctx.save();
    ctx.translate(0, -8 + bob);
    ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2;
      ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.lineTo(Math.cos(a + Math.PI) * 18, Math.sin(a + Math.PI) * 18);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Efeito de pulso concêntrico de aviso durante a frenagem da investida
  if (e.actionState === 'MIST_BRAKE') {
    const brakePulse = (e.actionTimer / 20) * 26;
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, bob, e.radius + brakePulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawFluidCape(ctx, bob, frameCount, isVuln, isEnraged);
  drawGothicArmor(ctx, bob, frameCount, isVuln, isEnraged);
  drawHeadAndFace(ctx, bob, frameCount, isVuln, isEnraged);
  drawClawsAndArms(ctx, bob, frameCount, isVuln, isEnraged, isWindup, isChanneling);
}