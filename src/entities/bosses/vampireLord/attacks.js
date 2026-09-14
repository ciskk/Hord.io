/**
 * src/entities/bosses/vampireLord/attacks.js
 * Arsenal de habilidades, seleção de skills e disparo de ataques do Lorde Vampírico.
 */
import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { acidPuddles, setLastAttackerName } from '../../../main.js';
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
 * Seleciona a próxima habilidade com base no alcance, fase e ritmo, gerando os telégrafos imediatamente no início da preparação.
 */
function selectNextSkill(e, dist, player, bossTelegraphs) {
  const isEnraged = e.isEnraged;
  const rand = Math.random();
  const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);

  if (dist < 145) {
    if ((e.meleeContactTimer || 0) >= 120 && (e.repulsionCooldown || 0) <= 0) {
      triggerRepulsionSkill(e, player, bossTelegraphs);
      return;
    }
    const cleaveDuration = isEnraged ? 52 : 68;
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
    bossShockwaves,
    triggerShake,
    createHitParticles,
    addDamageText
  } = context;

  const targetAngle = e.aimAngle;

  switch (e.currentSkill) {
    case 'REPULSION': {
      playSfx('boss');
      triggerShake(13);
      triggerHaptic('heavy');

      // Choque de vento/sangue expansivo
      if (bossShockwaves) {
        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 16,
          maxRadius: 185,
          speed: 9.0,
          damage: 0,
          colorRgb: '255, 23, 68',
          hitPlayer: true
        });
      }

      for (let p = 0; p < 28; p++) {
        const pAng = Math.random() * Math.PI * 2;
        const pDist = 20 + Math.random() * 120;
        createHitParticles(e.x + Math.cos(pAng) * pDist, e.y + Math.sin(pAng) * pDist, '#ff1744', 1);
      }

      // Verificação de acerto no jogador
      const pdx = player.x - e.x;
      const pdy = player.y - e.y;
      const pDist = Math.hypot(pdx, pdy);

      if (pDist <= 160) {
        // Dano puramente simbólico/leve (reduzido em 75%, ~5.5% do dano base do chefe)
        let repulsionDmg = Math.max(2, Math.round(e.damage * 0.055));
        if (selectedHeroKey === 'KNIGHT') {
          repulsionDmg = Math.max(1, Math.round(repulsionDmg * 0.8));
        }

        player.hp -= repulsionDmg;
        player.iFrames = 25;
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
      playSfx('boss');
      triggerShake(12);
      triggerHaptic('heavy');

      // Avanço físico suave sincronizado com a direção exata telegrafada
      e.x += Math.cos(targetAngle) * 22;
      e.y += Math.sin(targetAngle) * 22;
      e.isCleaving = true;
      e.cleaveSlashTimer = 22;
      e.cleaveProgress = 1;

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
          radius: 8.5,
          damage: Math.round(e.damage * 0.24),
          life: 115,
          bulletType: 'VAMPIRE_BAT',
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
          life: 120,
          bulletType: 'BLOOD_CLAW',
          color: '#ff4757'
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
          radius: 7.5,
          damage: Math.round(e.damage * 0.23),
          life: 120,
          bulletType: 'BLOOD_CLAW',
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


export { triggerRepulsionSkill, selectNextSkill, executePreparedSkill };
