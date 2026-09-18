/**
 * src/entities/bosses/abyssSovereign/physics.js
 * Física ambiental, singularidade gravitacional, âncoras e tentáculos do Soberano do Abismo.
 */
import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { 
  enemies, 
  enemyBullets, 
  bossShockwaves 
} from '../../../main.js';

export function scheduleDelayedAction(boss, delayFrames, callback) {
  if (!boss.delayedActions) boss.delayedActions = [];
  boss.delayedActions.push({
    timer: delayFrames,
    action: callback
  });
}

export function updateDelayedActions(boss, dt) {
  if (!boss.delayedActions || boss.delayedActions.length === 0) return;
  for (let i = boss.delayedActions.length - 1; i >= 0; i--) {
    const item = boss.delayedActions[i];
    item.timer -= dt;
    if (item.timer <= 0) {
      boss.delayedActions.splice(i, 1);
      if (typeof item.action === 'function') {
        item.action();
      }
    }
  }
}

/**
 * Restringe rigidamente a posição do Soberano para nunca ultrapassar as bordas da arena.
 * @param {Object} boss
 */
export function clampBossToArena(boss) {
  if (!boss || boss.arenaCenterX === undefined || boss.arenaCenterY === undefined || !boss.arenaRadius) return;
  const bdx = boss.x - boss.arenaCenterX;
  const bdy = boss.y - boss.arenaCenterY;
  const bDist = Math.hypot(bdx, bdy) || 1;
  const maxBossDist = Math.max(0, boss.arenaRadius - (boss.radius || 40) - 20);

  if (bDist > maxBossDist) {
    boss.x = boss.arenaCenterX + (bdx / bDist) * maxBossDist;
    boss.y = boss.arenaCenterY + (bdy / bDist) * maxBossDist;
    if (boss.vx) boss.vx = 0;
    if (boss.vy) boss.vy = 0;
  }
}

/**
 * Remove qualquer âncora remanescente do array global de inimigos de forma segura.
 * @param {Object} boss
 */
export function cleanupRiftAnchors(boss) {
  if (!boss.anchors || boss.anchors.length === 0) return;
  for (let i = 0; i < boss.anchors.length; i++) {
    const a = boss.anchors[i];
    a.active = false;
    const idx = enemies.indexOf(a);
    if (idx !== -1) {
      enemies.splice(idx, 1);
    }
  }
  boss.anchors = [];
  boss.activeAnchorsCount = 0;
}

/**
 * Instancia âncoras abissais e as registra no array global `enemies` com a flag `isBossSubTarget: true`,
 * habilitando o sistema de mira automática e priorização de projéteis/armas.
 * @param {Object} boss
 * @param {number} count Quantidade de âncoras.
 * @param {number} anchorHp HP de cada âncora.
 */
export function spawnRiftAnchors(boss, count, anchorHp) {
  cleanupRiftAnchors(boss);

  boss.anchors = [];
  const distance = 270;

  for (let i = 0; i < count; i++) {
    const baseAngle = (i * Math.PI * 2) / count + Math.PI / 4;
    const ax = boss.arenaCenterX + Math.cos(baseAngle) * distance;
    const ay = boss.arenaCenterY + Math.sin(baseAngle) * distance;

    const anchor = {
      x: ax,
      y: ay,
      baseX: ax,
      baseY: ay,
      radius: 32,
      speed: 0,
      hp: anchorHp,
      maxHp: anchorHp,
      active: true,
      floatTimer: i * 1.5,
      hitFlash: 0,
      orbitalHitCd: 0,
      axeHitCd: 0,
      isBossSubTarget: true,
      isTargetable: true,
      baseType: 'ANCHOR',
      parentBoss: boss,
      color: '#00cec9',
      damage: 0,
      xp: 0,
      behavior: 'anchor',
      combatState: 'CHASE'
    };

    boss.anchors.push(anchor);
    enemies.push(anchor);
  }
  boss.activeAnchorsCount = count;
}

/**
 * Barreira física invisível e Horizonte de Eventos do Altar do Fim dos Tempos.
 */
export function updateEventHorizon(boss, dt, context) {
  const { player, addDamageText, triggerShake, createHitParticles } = context;

  if (boss.arenaRadius > boss.targetArenaRadius) {
    boss.arenaRadius = Math.max(boss.targetArenaRadius, boss.arenaRadius - 0.45 * dt);
  }

  boss.horizonPulse = Math.sin(context.frameCount * 0.08);

  const pdx = player.x - boss.arenaCenterX;
  const pdy = player.y - boss.arenaCenterY;
  const pDist = Math.hypot(pdx, pdy) || 1;

  // Barreira Física Invisível Impenetrável (Ativa em todas as fases)
  const maxRadius = boss.arenaRadius - (player.radius || 14) - 2;

  if (pDist > maxRadius) {
    // Clamping físico estrito - impede qualquer fuga para fora do Altar
    player.x = boss.arenaCenterX + (pdx / pDist) * maxRadius;
    player.y = boss.arenaCenterY + (pdy / pDist) * maxRadius;

    const nx = pdx / pDist;
    const ny = pdy / pDist;

    // Cancela componentes de velocidade voltados para fora da arena (knockback, dashes)
    const pushDot = (player.pushVx || 0) * nx + (player.pushVy || 0) * ny;
    if (pushDot > 0) {
      player.pushVx -= pushDot * nx;
      player.pushVy -= pushDot * ny;
    }
    const dashDot = (player.dashVx || 0) * nx + (player.dashVy || 0) * ny;
    if (dashDot > 0) {
      player.dashVx -= dashDot * nx;
      player.dashVy -= dashDot * ny;
    }
    const ignisDot = (player.ignisDashVx || 0) * nx + (player.ignisDashVy || 0) * ny;
    if (ignisDot > 0) {
      player.ignisDashVx -= ignisDot * nx;
      player.ignisDashVy -= ignisDot * ny;
    }

    // Marcação de contato com a barreira invisível
    boss.barrierContact = 1.0;
    boss.barrierContactAngle = Math.atan2(pdy, pdx);

    if (Math.floor(context.frameCount) % 4 === 0) {
      createHitParticles(player.x + nx * 8, player.y + ny * 8, boss.phase === 3 ? '#00cec9' : '#e84393', 3);
      createHitParticles(player.x + nx * 8, player.y + ny * 8, '#ffffff', 2);
    }

    if (!boss.lastBarrierSound || context.frameCount - boss.lastBarrierSound > 22) {
      boss.lastBarrierSound = context.frameCount;
      playSfx('forcefield');
      triggerHaptic('light');
    }
  } else {
    boss.barrierContact = Math.max(0, (boss.barrierContact || 0) - 0.04 * dt);
  }

  // Dano por asfixia caso o jogador de alguma forma exceda o horizonte de eventos
  if (pDist > boss.arenaRadius) {
    boss.asphyxiaTimer += dt;
    if (boss.asphyxiaTimer >= 36 && player.iFrames <= 0) {
      boss.asphyxiaTimer = 0;
      const asphDmg = Math.max(5, Math.round(boss.damage * 0.08));
      player.hp -= asphDmg;
      player.iFrames = 18;
      triggerShake(4);
      playSfx('acid');
      addDamageText(player.x, player.y, `-${asphDmg}`, false, '#9b59b6');
      createHitParticles(player.x, player.y, '#8e44ad', 4);
    }
  } else {
    boss.asphyxiaTimer = Math.max(0, boss.asphyxiaTimer - dt);
  }
}

/**
 * Física de atração gravitacional e pulsos da Singularidade Primordial (Fase 3).
 * Balanço aplicado: intervalo estendido para 285 frames (~4.75s) e raio contido em 68% da arena.
 */
export function updateSingularityPhysics(boss, dt, context) {
  if (boss.phase !== 3) return;

  const { player, triggerShake } = context;

  const cdx = boss.arenaCenterX - boss.x;
  const cdy = boss.arenaCenterY - boss.y;
  boss.x += cdx * 0.08 * dt;
  boss.y += cdy * 0.08 * dt;

  const vdx = boss.x - player.x;
  const vdy = boss.y - player.y;
  const vDist = Math.hypot(vdx, vdy) || 1;

  if (vDist > boss.radius + 15 && vDist < boss.arenaRadius) {
    const pullForce = 0.55 * dt;
    player.x += (vdx / vDist) * pullForce;
    player.y += (vdy / vDist) * pullForce;
  }

  boss.singularityPulseTimer += dt;
  // Intervalo aumentado de 130 para 285 frames (~4.75s) para dar respiro e margem tática
  if (boss.singularityPulseTimer >= 285) {
    boss.singularityPulseTimer = 0;
    triggerShake(8);
    playSfx('singularity');

    // Raio restrito a 68% da arena, garantindo que as bordas sirvam de refúgio seguro
    bossShockwaves.push({
      x: boss.x,
      y: boss.y,
      radius: boss.radius,
      maxRadius: boss.arenaRadius * 0.68,
      speed: 4.8,
      damage: Math.round(boss.damage * 0.20),
      hitPlayer: false,
      colorRgb: '0, 206, 201'
    });
  }

  boss.orbSpawnTimer += dt;
  if (boss.orbSpawnTimer >= 22) {
    boss.orbSpawnTimer = 0;
    const startAng = Math.random() * Math.PI * 2;
    boss.singularityOrbs.push({
      angle: startAng,
      orbitA: 110 + Math.random() * 50,
      orbitB: 50 + Math.random() * 25,
      rotSpeed: 0.045 + Math.random() * 0.02,
      tilt: Math.random() * Math.PI,
      life: 65,
      damage: Math.round(boss.damage * 0.22)
    });
  }

  for (let i = boss.singularityOrbs.length - 1; i >= 0; i--) {
    const orb = boss.singularityOrbs[i];
    orb.angle += orb.rotSpeed * dt;
    orb.life -= dt;

    const rawX = Math.cos(orb.angle) * orb.orbitA;
    const rawY = Math.sin(orb.angle) * orb.orbitB;
    const cosT = Math.cos(orb.tilt);
    const sinT = Math.sin(orb.tilt);
    orb.curX = boss.x + (rawX * cosT - rawY * sinT);
    orb.curY = boss.y + (rawX * sinT + rawY * cosT);

    if (orb.life <= 0) {
      const ejectAng = Math.atan2(orb.curY - boss.y, orb.curX - boss.x);
      const speed = 5.2;

      enemyBullets.push({
        x: orb.curX,
        y: orb.curY,
        vx: Math.cos(ejectAng) * speed,
        vy: Math.sin(ejectAng) * speed,
        radius: 5.5,
        damage: orb.damage,
        life: 110,
        isBossProjectile: true
      });

      playSfx('shoot');
      boss.singularityOrbs.splice(i, 1);
    }
  }
}

/**
 * Atualiza a movimentação flutuante das âncoras e processa sua destruição.
 */
export function updateAnchors(boss, dt, context, onStabilityBreak) {
  if (!boss.anchors || boss.anchors.length === 0 || boss.activeAnchorsCount <= 0) return;

  const {
    bossShockwaves,
    triggerShake,
    createHitParticles,
    addDamageText
  } = context;

  for (let aIdx = 0; aIdx < boss.anchors.length; aIdx++) {
    const a = boss.anchors[aIdx];
    if (!a.active) continue;

    a.floatTimer += 0.04 * dt;
    a.x = a.baseX + Math.cos(a.floatTimer * 0.8) * 8;
    a.y = a.baseY + Math.sin(a.floatTimer) * 12;

    if (a.hitFlash > 0) a.hitFlash -= dt;
    if (a.orbitalHitCd > 0) a.orbitalHitCd -= dt;
    if (a.axeHitCd > 0) a.axeHitCd -= dt;

    if (a.hp <= 0) {
      a.active = false;
      boss.activeAnchorsCount--;

      const idx = enemies.indexOf(a);
      if (idx !== -1) {
        enemies.splice(idx, 1);
      }

      bossShockwaves.push({
        x: a.x,
        y: a.y,
        radius: a.radius,
        maxRadius: 130,
        speed: 6.0,
        damage: 0,
        hitPlayer: false,
        colorRgb: '0, 206, 201'
      });

      playSfx('shatter');
      triggerShake(14);
      triggerHaptic('heavy');
      createHitParticles(a.x, a.y, '#00cec9', 24);
      createHitParticles(a.x, a.y, '#a29bfe', 16);

      const backlashDmg = Math.round(boss.maxHp * 0.05);
      boss.hp -= backlashDmg;
      addDamageText(boss.x, boss.y, backlashDmg, true, '#00cec9');
      addDamageText(a.x, a.y - 14, "ORBE DESTRUÍDA!", true, '#00cec9');

      // Cancelamento do ataque do chefe garantido estritamente pela destruição da orbe
      if (typeof onStabilityBreak === 'function') {
        onStabilityBreak();
      }

      if (boss.activeAnchorsCount <= 0) {
        addDamageText(boss.x, boss.y - boss.radius - 20, "COLAPSO DO VAZIO!", true, '#00cec9');
      }
    }
  }
}

/**
 * Atualiza a física inercial dos 9 tentáculos via modelo spring-damper acoplado à velocidade do chefe.
 */
export function updateTentaclePhysics(boss, dt) {
  if (!boss.tentaclePhysics) {
    boss.tentaclePhysics = [];
    for (let l = 0; l < 9; l++) {
      boss.tentaclePhysics.push([
        { angleOffset: 0, angVel: 0 },
        { angleOffset: 0, angVel: 0 },
        { angleOffset: 0, angVel: 0 },
        { angleOffset: 0, angVel: 0 }
      ]);
    }
  }

  // Rastreamento preciso da velocidade de translação do chefe
  if (boss.prevX === undefined) { boss.prevX = boss.x; boss.prevY = boss.y; }
  const rawVx = (boss.x - boss.prevX) / Math.max(0.001, dt);
  const rawVy = (boss.y - boss.prevY) / Math.max(0.001, dt);
  boss.prevX = boss.x;
  boss.prevY = boss.y;

  // Filtro exponencial para evitar solavancos ou picos de colisão
  boss.smoothVx = (boss.smoothVx || 0) * 0.82 + rawVx * 0.18;
  boss.smoothVy = (boss.smoothVy || 0) * 0.82 + rawVy * 0.18;

  const restBaseAngles = [
    -Math.PI * 0.50,      // 0: Superior vertical
    -Math.PI * 0.22,      // 1: Superior Direito
    -0.08,                // 2: Médio Direito Horizontal
    Math.PI * 0.16,       // 3: Inferior Direito
    Math.PI * 0.36,       // 4: Inferior-Direita baixo
    Math.PI * 0.50,       // 5: Inferior Vertical Central
    Math.PI * 0.64,       // 6: Inferior-Esquerda baixo
    Math.PI * 0.98,       // 7: Médio Esquerdo Horizontal
    -Math.PI * 0.78       // 8: Superior Esquerdo
  ];

  const springK = 0.085;
  const damping = 0.80;

  for (let l = 0; l < 9; l++) {
    const baseAng = restBaseAngles[l];
    // Vetor ortogonal à linha de visada do membro
    const perpX = -Math.sin(baseAng);
    const perpY = Math.cos(baseAng);
    const velPerp = boss.smoothVx * perpX + boss.smoothVy * perpY;

    const limbPhysics = boss.tentaclePhysics[l];
    for (let s = 0; s < 4; s++) {
      const seg = limbPhysics[s];
      // Força inercial contrária à velocidade que cresce em direção à ponta do tentáculo
      const dragTorque = -velPerp * (0.016 + s * 0.012);

      // Equação do Oscilador Harmônico Amortecido
      const acc = -springK * seg.angleOffset - damping * seg.angVel + dragTorque;
      seg.angVel += acc * dt;
      seg.angleOffset += seg.angVel * dt;

      // Soft clamp para evitar deformações anatômicas absurdas
      seg.angleOffset = Math.max(-0.46, Math.min(0.46, seg.angleOffset));
    }
  }
}

/**
 * Atualiza o ciclo de vida e a física de colisão contínua dos ataques ativos (Cortes e Implosões).
 */
export function updateActiveAttacks(boss, dt, context) {
  if (!boss.activeAttacks || boss.activeAttacks.length === 0) return;
  const { player, addDamageText, triggerShake, createHitParticles } = context;

  for (let i = boss.activeAttacks.length - 1; i >= 0; i--) {
    const atk = boss.activeAttacks[i];
    atk.timer -= dt;

    if (atk.type === 'DIMENSIONAL_SLASH') {
      // Janela de dano letal ativo durante a manifestação do feixe de luz
      if (atk.timer > atk.maxTimer - 14 && player.iFrames <= 0) {
        const angles = atk.angles || [boss.cleaveAngle || 0];
        const len = atk.length || 1500;
        const mainHalfW = (atk.width || 108) * 0.5;
        const sideHalfW = (atk.sideWidth ? atk.sideWidth * 0.5 : mainHalfW * 0.65);
        const playerRadius = player.radius || 14;

        for (let a = 0; a < angles.length; a++) {
          const ang = angles[a];
          const cosA = Math.cos(ang);
          const sinA = Math.sin(ang);
          const pdx = player.x - boss.x;
          const pdy = player.y - boss.y;
          const proj = pdx * cosA + pdy * sinA;
          const perpDist = Math.abs(-pdx * sinA + pdy * cosA);
          const currentHalfW = (a === 0 ? mainHalfW : sideHalfW) + playerRadius;

          if (proj >= -playerRadius && proj < len && perpDist <= currentHalfW) {
            player.hp -= atk.damage;
            player.iFrames = 28;
            triggerShake(16);
            playSfx('hit');
            triggerHaptic('heavy');
            addDamageText(player.x, player.y, `-${atk.damage}`, false, '#00cec9');
            createHitParticles(player.x, player.y, '#00cec9', 16);
            createHitParticles(player.x, player.y, '#ffffff', 8);
            break;
          }
        }
      }
    } else if (atk.type === 'VOID_IMPLOSION_CORE') {
      // Dano direto no epicentro do buraco negro caso o jogador esteja dentro do horizonte letal
      if (atk.timer > atk.maxTimer - 12 && player.iFrames <= 0 && player.bossIFrames <= 0) {
        const pdx = player.x - atk.x;
        const pdy = player.y - atk.y;
        const distSq = pdx * pdx + pdy * pdy;
        const hitR = (atk.radius || 175) + (player.radius || 14);
        if (distSq <= hitR * hitR) {
          const coreDmg = Math.round((boss.damage || 365) * 0.46);
          player.hp -= coreDmg;
          player.iFrames = 26;
          player.bossIFrames = 26;
          triggerShake(20);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${coreDmg}`, false, '#8e44ad');
          createHitParticles(player.x, player.y, '#8e44ad', 24);
          createHitParticles(player.x, player.y, '#00cec9', 16);
          createHitParticles(player.x, player.y, '#ffffff', 10);
        }
      }
    } else if (atk.type === 'SUPERNOVA_FLASH') {
      // Dano no epicentro da supernova caso o jogador esteja próximo na detonação inicial
      if (atk.timer > atk.maxTimer - 10 && player.iFrames <= 0) {
        const pdx = player.x - atk.x;
        const pdy = player.y - atk.y;
        const distSq = pdx * pdx + pdy * pdy;
        const hitR = (atk.maxR || 275) * 0.65 + (player.radius || 14);
        if (distSq <= hitR * hitR) {
          const flashDmg = Math.round((boss.damage || 365) * 0.38);
          player.hp -= flashDmg;
          player.iFrames = 24;
          triggerShake(18);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${flashDmg}`, false, '#e84393');
          createHitParticles(player.x, player.y, '#e84393', 16);
          createHitParticles(player.x, player.y, '#ffffff', 8);
        }
      }
    }

    if (atk.timer <= 0) {
      boss.activeAttacks.splice(i, 1);
    }
  }
}

/**
 * Spawna um local de cura sagrado (Santuário Cósmico) dentro da arena do Soberano do Abismo.
 * A área de cura é 30% maior (raio 73px), dura exatamente 7 segundos (420 frames) e regenera 10% de saúde por segundo.
 * Spawna a uma distância intermediária do jogador (fora do alcance imediato, mas bem mais perto do que metade do raio da arena).
 * @param {Object} boss Entidade do Soberano do Abismo
 * @param {Object} context Contexto global do motor
 */
export function spawnSanctuaryHealingZone(boss, context) {
  if (!boss.healingZones) boss.healingZones = [];

  const player = context.player;
  const arenaRadius = boss.arenaRadius || 600;
  const halfArenaRadius = arenaRadius * 0.5;
  const zoneRadius = 73; // 30% maior que o raio original de 56 (56 * 1.30 = 72.8 ~ 73px)

  const cx = boss.arenaCenterX !== undefined ? boss.arenaCenterX : boss.x;
  const cy = boss.arenaCenterY !== undefined ? boss.arenaCenterY : boss.y;
  const maxSafeArenaDist = Math.max(60, arenaRadius - zoneRadius - 20);

  // Distância calculada a partir do jogador:
  // - "Não quero perto": pelo menos ~145px (garante que o jogador está fora do círculo e precisa se deslocar)
  // - "Realmente mais perto do que metade do raio da arena": limite máximo de ~200px (muito menor que metade do raio ~260-310px)
  const minDist = Math.max(145, zoneRadius + 60);
  const maxDist = Math.min(200, Math.max(minDist + 20, halfArenaRadius - 60));

  let hx = cx;
  let hy = cy;

  if (player && player.x !== undefined && player.y !== undefined) {
    let foundSafeSpot = false;

    // Tenta encontrar um ponto em direção aleatória ao redor do jogador que caiba 100% dentro da arena
    for (let attempt = 0; attempt < 24; attempt++) {
      const spawnDist = minDist + Math.random() * (maxDist - minDist);
      const spawnAngle = Math.random() * Math.PI * 2;
      const candX = player.x + Math.cos(spawnAngle) * spawnDist;
      const candY = player.y + Math.sin(spawnAngle) * spawnDist;

      const distFromCenter = Math.hypot(candX - cx, candY - cy);
      if (distFromCenter <= maxSafeArenaDist) {
        hx = candX;
        hy = candY;
        foundSafeSpot = true;
        break;
      }
    }

    // Se o jogador estiver na borda da arena e os ângulos aleatórios saírem da barreira,
    // projeta o ponto apontando em direção ao interior da arena (em direção ao centro a partir do jogador)
    if (!foundSafeSpot) {
      const toCenterAngle = Math.atan2(cy - player.y, cx - player.x);
      const spawnAngle = toCenterAngle + (Math.random() - 0.5) * 1.1; // arco seguro de ~60° para dentro
      const spawnDist = minDist + Math.random() * (maxDist - minDist);
      hx = player.x + Math.cos(spawnAngle) * spawnDist;
      hy = player.y + Math.sin(spawnAngle) * spawnDist;

      // Limitação estrita final para jamais vazar a barreira da arena
      const distFromCenter = Math.hypot(hx - cx, hy - cy);
      if (distFromCenter > maxSafeArenaDist) {
        hx = cx + ((hx - cx) / distFromCenter) * maxSafeArenaDist;
        hy = cy + ((hy - cy) / distFromCenter) * maxSafeArenaDist;
      }
    }
  } else {
    // Fallback defensivo caso player não esteja no contexto
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 120 + Math.random() * (halfArenaRadius - 120);
    hx = cx + Math.cos(spawnAngle) * spawnDist;
    hy = cy + Math.sin(spawnAngle) * spawnDist;
  }

  const zone = {
    x: hx,
    y: hy,
    radius: zoneRadius,
    life: 420, // 7 segundos exatos (420 frames a 60 FPS)
    maxLife: 420,
    healRatePerSec: 0.10, // Sincronizado com o HUD: 10% de saúde por segundo
    healTickTimer: 0,
    playerInside: false,
    pulseTimer: 0
  };

  boss.healingZones.push(zone);

  console.log(`[Soberano do Abismo] Santuário de Cura criado em (${Math.round(hx)}, ${Math.round(hy)}), Raio: ${zoneRadius}px, Distância do jogador: ${player ? Math.round(Math.hypot(hx - player.x, hy - player.y)) : 'N/A'}px`);

  playSfx('heal');
  triggerHaptic('medium');
  if (context.triggerShake) context.triggerShake(4);
  if (context.addDamageText) context.addDamageText(hx, hy - 32, "SANTUÁRIO DE CURA!", true, '#2ecc71');
  if (context.createHitParticles) {
    context.createHitParticles(hx, hy, '#2ecc71', 16);
    context.createHitParticles(hx, hy, '#f1c40f', 10);
  }
}

/**
 * Atualiza e processa os locais de cura dentro da arena do Soberano do Abismo.
 * Inicia após o chefe atingir 85% de vida e reaparece ininterruptamente a cada 10 segundos.
 * @param {Object} boss Entidade do Soberano do Abismo
 * @param {number} dt Variação de tempo
 * @param {Object} context Contexto global do motor
 */
export function updateHealingZones(boss, dt, context) {
  if (!boss.healingZones) boss.healingZones = [];
  const { player, frameCount, addDamageText, createHitParticles } = context;

  const hpRatio = Math.max(0, boss.hp / (boss.maxHp || 1));

  // Condição: O ciclo inicia quando o boss atinge <= 85% de vida ou entra na Fase 2/3
  if (!boss.hasStartedHealingCycle) {
    const isReadyToStart = boss.hp > 0 && 
                           boss.actionState !== 'SPAWN_INTRO' && 
                           boss.actionState !== 'DEATH_COLLAPSE' && 
                           (hpRatio <= 0.85 || boss.phase >= 2);

    if (isReadyToStart) {
      boss.hasStartedHealingCycle = true;
      boss.healingZoneSpawnTimer = 10 * 60; // Ciclo de 10 segundos (600 frames)
      spawnSanctuaryHealingZone(boss, context);
    }
  } else {
    // Uma vez ativado, o ciclo de 10 segundos segue continuamente durante todo o restante da batalha,
    // mesmo que as Âncoras Cósmicas regenerem o HP do chefe temporariamente acima de 85%!
    if (boss.hp > 0 && boss.actionState !== 'DEATH_COLLAPSE') {
      boss.healingZoneSpawnTimer -= dt;
      if (boss.healingZoneSpawnTimer <= 0) {
        boss.healingZoneSpawnTimer = 10 * 60; // Reaparece pontualmente a cada 10 segundos
        spawnSanctuaryHealingZone(boss, context);
      }
    }
  }

  // Atualização dos locais de cura ativos
  for (let i = boss.healingZones.length - 1; i >= 0; i--) {
    const zone = boss.healingZones[i];
    zone.life -= dt;
    if (zone.life <= 0) {
      if (createHitParticles) createHitParticles(zone.x, zone.y, '#2ecc71', 8);
      boss.healingZones.splice(i, 1);
      continue;
    }

    zone.pulseTimer += dt;

    if (!player || player.hp <= 0) continue;

    const dx = player.x - zone.x;
    const dy = player.y - zone.y;
    const distSq = dx * dx + dy * dy;
    const isInside = distSq <= (zone.radius + (player.radius || 14)) ** 2;
    zone.playerInside = isInside;

    if (isInside) {
      // Regenera saúde dinamicamente com base na taxa da zona (10%/s)
      const rate = zone.healRatePerSec || 0.10;
      const healPerFrame = (player.maxHp * rate / 60) * dt;
      if (player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + healPerFrame);
      }

      // Efeito visual de partículas ascendentes enquanto o jogador está dentro
      if (Math.floor(frameCount) % 3 === 0 && createHitParticles) {
        createHitParticles(player.x + (Math.random() - 0.5) * 20, player.y + (Math.random() - 0.5) * 20, '#2ecc71', 2);
      }

      // Feedback numérico flutuante e sonoro de cura a cada 24 frames (~0.4s)
      zone.healTickTimer = (zone.healTickTimer || 0) + dt;
      if (zone.healTickTimer >= 24) {
        zone.healTickTimer = 0;
        const displayChunk = Math.round(player.maxHp * rate * 0.4);
        if (displayChunk > 0 && addDamageText) {
          addDamageText(player.x, player.y - 20, `+${displayChunk} HP`, false, '#2ecc71');
          try { playSfx('heal'); } catch (e) {}
        }
      }
    }
  }
}

