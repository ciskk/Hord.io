/**
 * src/entities/bosses/vampireLord/attacks.js
 * Arsenal de habilidades, seleção de skills e disparo de ataques do Lorde Vampírico.
 */
import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { acidPuddles, setLastAttackerName, canSpawnEnemyBullet } from '../../../main.js';
import { selectedHeroKey } from '../../player.js';
import { triggerDeath } from '../../../systems/ui.js';
import { VAMPIRE_STATES, VAMPIRE_SKILLS } from './constants.js';

function triggerRepulsionSkill(e, player, bossTelegraphs) {
  const isEnraged = e.isEnraged;
  const windupDuration = isEnraged ? 18 : 23; // ~0.3s a 0.38s de telegrafia
  const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);

  e.currentSkill = 'REPULSION';
  e.actionState = 'WINDUP';
  e.actionTimer = windupDuration;
  e.aimAngle = angleToPlayer;
  e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;
  e.isWingPrepping = true;

  bossTelegraphs.push({
    type: 'REPULSION',
    x: e.x,
    y: e.y,
    radius: 155,
    timer: windupDuration,
    maxTimer: windupDuration,
    damage: Math.round(e.damage * 0.055),
    color: '#ff1744',
    boss: e
  });

  playSfx('boss');
}

/**
 * Seleciona a próxima habilidade com base em avaliação tática situacional (Envelope Anti-Whiff, Distância Real e Combos).
 * Elimina bugs probabilísticos e escolhe com inteligência agressiva o fechamento de distância e punições corpo a corpo.
 */
function selectNextSkill(e, dist, player, bossTelegraphs) {
  const isEnraged = e.isEnraged;
  const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);

  // 1. Checagem de Repulsão Prioritária se o jogador estiver muito tempo grudado no chefe
  if ((e.meleeContactTimer || 0) >= 100 && (e.repulsionCooldown || 0) <= 0 && dist < 155) {
    triggerRepulsionSkill(e, player, bossTelegraphs);
    e.lastUsedSkill = 'REPULSION';
    return;
  }

  // 2. Tabela de Avaliação de Pesos Táticos (Utility Scoring)
  const weights = {
    CLEAVE: 0,
    REPULSION: 0,
    MIST_DASH: 0,
    TELEPORT: 0,
    SPIRAL_BARRAGE: 0,
    PINCER_SHOT: 0,
    BLOOD_BURST: 0,
    SWARM: 0
  };

  // CÁLCULO DOS PESOS BASE POR FAIXA DE DISTÂNCIA
  if (dist < 150) {
    // Zona 0: Curta Distância / Melee (< 150px)
    // Alternância inteligente entre corte devastador, sangue ou repulsão
    weights.CLEAVE = 55;
    if ((e.repulsionCooldown || 0) <= 0) {
      weights.REPULSION = 25;
    }
    if (isEnraged) {
      weights.BLOOD_BURST = 35;
    }
    weights.PINCER_SHOT = 15;
  } else if (dist <= 300) {
    // Zona 1: Médio Alcance (150px a 300px)
    // Faixa ideal para investidas táticas em névoa, pinças e rajada espiral
    weights.MIST_DASH = 45;
    weights.PINCER_SHOT = 40;
    weights.SPIRAL_BARRAGE = 30;
    weights.SWARM = 25;
    weights.TELEPORT = 25;
    if (isEnraged) {
      weights.BLOOD_BURST = 30;
    }
  } else {
    // Zona 2: Longo Alcance (> 300px)
    // O Vampiro NUNCA fica inerte atirando orbes lentos de longe:
    // Prioridade máxima em investida rápida em névoa (Mist Dash) ou Teleporte surpresa!
    weights.MIST_DASH = 55;
    weights.TELEPORT = 45;
    weights.SWARM = 25;
    weights.PINCER_SHOT = 15;
  }

  // 3. Leitura Comportamental do Jogador
  if (player && player.isMoving) {
    // Jogador em movimento: o Pincer Shot (garras de sangue convergentes) é excelente para punir corrida lateral
    if (dist >= 140 && dist <= 380) {
      weights.PINCER_SHOT *= 1.35;
    }

    // Se o jogador estiver correndo para longe a longa distância, prioriza ainda mais Mist Dash e Teleport
    const pdx = player.x - e.x;
    const pdy = player.y - e.y;
    const pvx = player.vx || (player.pushVx || 0);
    const pvy = player.vy || (player.pushVy || 0);
    const isRetreating = (pvx * pdx + pvy * pdy) > 0;
    if (isRetreating && dist > 260) {
      weights.MIST_DASH *= 1.4;
      weights.TELEPORT *= 1.3;
    }
  }

  // 4. Anti-Spam: Reduz repetição consecutiva da mesma habilidade
  if (e.lastUsedSkill && weights[e.lastUsedSkill] > 0) {
    weights[e.lastUsedSkill] *= 0.20;
  }

  // 5. Sorteio Ponderado por Roleta
  let totalWeight = 0;
  for (const skill in weights) {
    totalWeight += weights[skill];
  }

  if (totalWeight <= 0) {
    weights.CLEAVE = 1;
    totalWeight = 1;
  }

  let roll = Math.random() * totalWeight;
  let chosenSkill = 'CLEAVE';

  for (const skill in weights) {
    roll -= weights[skill];
    if (roll <= 0) {
      chosenSkill = skill;
      break;
    }
  }

  // 6. Preparação e Telégrafos da Habilidade Escolhida
  e.currentSkill = chosenSkill;
  e.aimAngle = angleToPlayer;
  e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;
  e.isWingPrepping = false;

  switch (chosenSkill) {
    case 'REPULSION':
      triggerRepulsionSkill(e, player, bossTelegraphs);
      break;

    case 'CLEAVE': {
      const cleaveDuration = isEnraged ? 52 : 68;
      e.actionState = 'WINDUP';
      e.actionTimer = cleaveDuration;
      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 135,
        angle: e.aimAngle,
        arcHalf: Math.PI * 0.38,
        timer: cleaveDuration,
        maxTimer: cleaveDuration,
        damage: Math.round(e.damage * 0.55),
        color: '#ff4757',
        colorRgb: '255, 71, 87',
        boss: e
      });
      break;
    }

    case 'TELEPORT':
      e.actionState = 'WINDUP';
      e.actionTimer = isEnraged ? 20 : 30;
      break;

    case 'MIST_DASH': {
      const dashWindup = isEnraged ? 22 : 32;
      e.actionState = 'WINDUP';
      e.actionTimer = dashWindup;
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
      break;
    }

    case 'SPIRAL_BARRAGE':
      e.actionState = 'WINDUP';
      e.actionTimer = isEnraged ? 24 : 34;
      break;

    case 'PINCER_SHOT':
      e.actionState = 'WINDUP';
      e.actionTimer = isEnraged ? 22 : 32;
      e.isWingPrepping = true;
      break;

    case 'BLOOD_BURST':
      e.actionState = 'WINDUP';
      e.actionTimer = 36;
      break;

    case 'SWARM':
    default:
      e.actionState = 'WINDUP';
      e.actionTimer = isEnraged ? 20 : 28;
      break;
  }

  e.lastUsedSkill = chosenSkill;
}

/**
 * Dispara o golpe preparado quando a telegrafia termina.
 */
function executePreparedSkill(e, context) {
  const {
    player,
    enemyBullets,
    bossTelegraphs,
    bossShockwaves,
    triggerShake,
    createHitParticles,
    addDamageText
  } = context;

  const targetAngle = e.aimAngle;

  switch (e.currentSkill) {
    case 'REPULSION': {
      playSfx('boss');
      triggerShake(9);
      triggerHaptic('heavy');

      // Choque de vento/sangue expansivo com repulsão e dano real
      if (bossShockwaves) {
        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 16,
          maxRadius: 210,
          speed: 8.0,
          damage: Math.round(e.damage * 0.18),
          knockback: 18,
          colorRgb: '255, 23, 68',
          color: '#ff1744',
          hitPlayer: false
        });
      }

      for (let p = 0; p < 28; p++) {
        const pAng = Math.random() * Math.PI * 2;
        const pDist = 20 + Math.random() * 120;
        createHitParticles(e.x + Math.cos(pAng) * pDist, e.y + Math.sin(pAng) * pDist, '#ff1744', 1);
      }

      // Verificação de acerto direto no jogador (impacto de proximidade)
      const pdx = player.x - e.x;
      const pdy = player.y - e.y;
      const pDist = Math.hypot(pdx, pdy);

      if (pDist <= 160 && player.bossIFrames <= 0) {
        // Dano leve de contato direto (~5.5% do dano base)
        let repulsionDmg = Math.max(2, Math.round(e.damage * 0.055));
        if (selectedHeroKey === 'KNIGHT') {
          repulsionDmg = Math.max(1, Math.round(repulsionDmg * 0.8));
        }

        player.hp -= repulsionDmg;
        player.bossIFrames = 20;
        playSfx('hit');
        setLastAttackerName('Lorde Vampírico');
        addDamageText(player.x, player.y, `-${repulsionDmg}`, false, '#ff1744');

        // Knockback maciço projetando o jogador para longe
        const pushAng = Math.atan2(pdy, pdx);
        const knockbackImpulse = 36;
        player.pushVx = Math.cos(pushAng) * knockbackImpulse;
        player.pushVy = Math.sin(pushAng) * knockbackImpulse;
        player.x += Math.cos(pushAng) * 24;
        player.y += Math.sin(pushAng) * 24;

        if (player.hp <= 0) {
          triggerDeath();
        }
      }

      e.isWingPrepping = false;
      e.meleeContactTimer = 0;
      e.repulsionCooldown = 180; // 3 segundos de recarga anti-spam
      e.actionState = 'CHASE';
      e.skillCooldown = e.isEnraged ? 25 : 40;
      addDamageText(e.x, e.y - 18, "REPULSÃO!", true, '#ff1744');
      break;
    }

    case 'CLEAVE': {
      // O impacto sonoro e tremor são executados no término do telégrafo em main.js
      // Avanço físico suave sincronizado com a direção exata telegrafada
      e.x += Math.cos(targetAngle) * 22;
      e.y += Math.sin(targetAngle) * 22;
      e.isCleaving = true;
      e.cleaveSlashTimer = 22;
      e.cleaveProgress = 1;

      // Dispara uma onda cortante de sangue para a frente (projétil tangível em média distância)
      if (canSpawnEnemyBullet(true)) {
        enemyBullets.push({
          x: e.x + Math.cos(targetAngle) * 28,
          y: e.y + Math.sin(targetAngle) * 28,
          vx: Math.cos(targetAngle) * 6.4,
          vy: Math.sin(targetAngle) * 6.4,
          radius: 11.5,
          damage: Math.round(e.damage * 0.32),
          life: 80,
          bulletType: 'BLOOD_CLAW',
          isBossProjectile: true,
          color: '#ff1744'
        });
      }

      // Partículas em crescente carmesim do corte da foice
      for (let sc = 0; sc < 22; sc++) {
        const scAng = (targetAngle - Math.PI * 0.45) + (sc / 21) * Math.PI * 0.9;
        const scDist = 50 + Math.random() * 85;
        createHitParticles(e.x + Math.cos(scAng) * scDist, e.y + Math.sin(scAng) * scDist, '#ff1744', 2);
      }

      // FASE 5.4: Janela de Recuperação Pós-Golpe garantida (generosa para punição melee)
      e.actionState = 'RECOVERY';
      e.recoveryTimer = e.isEnraged ? 60 : 80; // 1.0s a 1.33s imóvel
      e.isVulnerable = true;
      addDamageText(e.x, e.y, "BRECHA!", false, '#f1c40f');
      break;
    }

    case 'SWARM': {
      playSfx('shoot');
      triggerShake(5);

      const count = e.isEnraged ? 12 : 8;
      const totalArc = Math.PI * (e.isEnraged ? 0.7 : 0.55);
      const step = totalArc / (count - 1);
      const startAngle = targetAngle - totalArc / 2;

      for (let k = 0; k < count; k++) {
        if (!canSpawnEnemyBullet(true)) break;
        const bAng = startAngle + (k * step);
        const speedVar = 4.2 + (Math.abs(k - (count - 1) / 2) * 0.25);
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * speedVar,
          vy: Math.sin(bAng) * speedVar,
          radius: 8.5,
          damage: Math.round(e.damage * 0.24),
          life: 180, // Alcance expandido para atravessar a arena (~750px)
          bulletType: 'VAMPIRE_BAT',
          isBossProjectile: true,
          color: '#ff1744'
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
        if (!canSpawnEnemyBullet(true)) break;
        const progress = k / (bulletsPerFlank - 1);
        const fireAng = (targetAngle + 0.55) - (progress * 0.4);
        const spd = 4.4 + progress * 1.2;
        enemyBullets.push({
          x: leftFlankX,
          y: leftFlankY,
          vx: Math.cos(fireAng) * spd,
          vy: Math.sin(fireAng) * spd,
          radius: 7.5,
          damage: Math.round(e.damage * 0.23),
          life: 165, // Alcance expandido para alcançar alvos distantes
          bulletType: 'BLOOD_CLAW',
          isBossProjectile: true,
          color: '#ff4757'
        });
      }

      for (let k = 0; k < bulletsPerFlank; k++) {
        if (!canSpawnEnemyBullet(true)) break;
        const progress = k / (bulletsPerFlank - 1);
        const fireAng = (targetAngle - 0.55) + (progress * 0.4);
        const spd = 4.4 + progress * 1.2;
        enemyBullets.push({
          x: rightFlankX,
          y: rightFlankY,
          vx: Math.cos(fireAng) * spd,
          vy: Math.sin(fireAng) * spd,
          radius: 7.5,
          damage: Math.round(e.damage * 0.23),
          life: 165, // Alcance expandido
          bulletType: 'BLOOD_CLAW',
          isBossProjectile: true,
          color: '#ff4757'
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
      triggerShake(6);
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
      triggerShake(6);

      const geyserCount = e.isEnraged ? 4 : 3;
      for (let p = 0; p < geyserCount; p++) {
        const pAngle = Math.random() * Math.PI * 2;
        const pDist = 60 + Math.random() * 120;
        const targetX = player.x + Math.cos(pAngle) * pDist;
        const targetY = player.y + Math.sin(pAngle) * pDist;

        bossTelegraphs.push({
          x: targetX,
          y: targetY,
          radius: 42,
          timer: 45,
          maxTimer: 45,
          damage: Math.round(e.damage * 0.35),
          type: 'BLOOD_BURST_GEYSER',
          color: '#ff1744',
          colorRgb: '255, 23, 68',
          boss: e
        });
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


export { triggerRepulsionSkill, selectNextSkill, executePreparedSkill };
