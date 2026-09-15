/**
 * src/entities/bosses/vampireLord/fsm.js
 * Máquina de estados FSM, IA de combate e ciclo de vida do Lorde Vampírico.
 */
import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { VAMPIRE_STATES } from './constants.js';
import { 
  triggerRepulsionSkill, 
  selectNextSkill, 
  executePreparedSkill 
} from './attacks.js';

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

  if (e.meleeContactTimer === undefined) e.meleeContactTimer = 0;
  if (e.repulsionCooldown === undefined) e.repulsionCooldown = 0;

  if (e.repulsionCooldown > 0) {
    e.repulsionCooldown -= dt;
  }

  // Atualização do corte de foice do Cleave
  if (e.isCleaving) {
    if (e.cleaveSlashTimer === undefined) e.cleaveSlashTimer = 0;
    e.cleaveSlashTimer -= dt;
    e.cleaveProgress = Math.max(0, e.cleaveSlashTimer / 22);
    if (e.cleaveSlashTimer <= 0) {
      e.isCleaving = false;
      e.cleaveProgress = 0;
    }
  }

  // 0. Gerenciamento do Banner de Título
  if (e.titleTimer > 0) {
    e.titleTimer -= dt;
  }

  // 0.1. Gestão de Pós-Imagens (Ghost Afterimages)
  if (e.afterImages && e.afterImages.length > 0) {
    for (let ai = e.afterImages.length - 1; ai >= 0; ai--) {
      e.afterImages[ai].life -= dt;
      if (e.afterImages[ai].life <= 0) {
        e.afterImages.splice(ai, 1);
      }
    }
  }

  // 0.2. Gestão do Rastro Espectral dos Olhos
  if (!e.eyeTrails) e.eyeTrails = [];
  if (e.actionState !== 'SPAWN_INTRO' || (e.introTimer && e.introTimer < 220)) {
    if (Math.floor(frameCount) % 2 === 0) {
      e.eyeTrails.push({
        x: e.x,
        y: e.y + (e.floatBob || 0) - (e.isVulnerable ? 22 : 32),
        facing: e.facing,
        life: 16,
        maxLife: 16,
        isEnraged: e.isEnraged
      });
      if (e.eyeTrails.length > 20) e.eyeTrails.shift();
    }
  }
  for (let et = e.eyeTrails.length - 1; et >= 0; et--) {
    e.eyeTrails[et].life -= dt;
    if (e.eyeTrails[et].life <= 0) e.eyeTrails.splice(et, 1);
  }

  // 1. Orientação horizontal e postura com mira travada
  if (e.actionState === 'WINDUP') {
    e.facing = Math.cos(e.aimAngle) >= 0 ? 1 : -1;
  } else if (
    e.actionState !== 'RECOVERY' && 
    e.actionState !== 'MIST_BRAKE' && 
    e.actionState !== 'MIST_DASH_PAUSE' && 
    e.actionState !== 'TELEPORTING' &&
    e.actionState !== 'SPAWN_INTRO'
  ) {
    e.facing = (player.x - e.x) > 0 ? 1 : -1;
  }
  e.floatBob = Math.sin(frameCount * 0.08) * 4;

  // 2. Transição para Fase de Fúria (< 45% HP) - Bloqueada durante a introdução
  const hpRatio = e.hp / e.maxHp;
  if (e.actionState !== 'SPAWN_INTRO' && hpRatio < 0.45 && !e.hasEnraged) {
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
    case 'SPAWN_INTRO': {
      const introMax = e.introDuration || 300;
      e.introTimer -= dt;
      const progress = Math.min(1.0, Math.max(0, 1 - (e.introTimer / introMax)));

      e.isVulnerable = false;
      e.isTargetable = false;

      // Preenchimento cinematográfico contínuo da barra de HP (0% a 100%)
      const hpPercent = Math.min(100, Math.round(progress * 100));
      const bossHpFill = document.getElementById('boss-hp-fill');
      if (bossHpFill) bossHpFill.style.width = `${hpPercent}%`;
      const bossHpVal = document.getElementById('boss-hp-val');
      if (bossHpVal) bossHpVal.innerText = `${hpPercent}%`;

      // ATO 1: O Selo Carmesim & Eclipse (0.00 <= progress < 0.24, frames 0-72)
      if (progress < 0.24) {
        if (Math.floor(e.introTimer) === Math.floor(introMax - 4)) {
          playSfx('charge');
        }
        if (Math.floor(frameCount) % 4 === 0) {
          triggerShake(1.2 + progress * 5);
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 70 + Math.random() * 110;
          createHitParticles(
            e.x + Math.cos(pAngle) * pDist,
            e.y + Math.sin(pAngle) * pDist,
            '#ff1744',
            1
          );
        }
      } 
      // ATO 2: Vórtice das Trevas & Olhos Espectrais (0.24 <= progress < 0.50, frames 72-150)
      else if (progress < 0.50) {
        if (Math.floor(e.introTimer) === Math.floor(introMax * 0.76)) {
          playSfx('warp');
          triggerHaptic('medium');
        }
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(2.0 + Math.sin(progress * 10) * 2);
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 25 + Math.random() * 65;
          createHitParticles(e.x + Math.cos(pAngle) * pDist, e.y + Math.sin(pAngle) * pDist, '#8e44ad', 2);
          createHitParticles(e.x, e.y, '#2c0c16', 1);
        }
      } 
      // ATO 3: Desdobrar de Asas & Banner Imperial (0.50 <= progress < 0.76, frames 150-228)
      else if (progress < 0.76) {
        if (!e.hasTriggeredTitle) {
          e.hasTriggeredTitle = true;
          e.titleTimer = e.titleMaxTimer || 180;
          playSfx('forcefield');
          triggerHaptic('medium');
        }
        if (Math.floor(frameCount) % 3 === 0) {
          triggerShake(2.5 + Math.sin(progress * 12) * 2);
          createHitParticles(
            e.x + (Math.random() - 0.5) * e.radius * 2.2,
            e.y + (Math.random() - 0.5) * e.radius * 2.2,
            '#ff1744',
            2
          );
        }
      } 
      // ATO 4: Rugido Predatório & Impacto Sísmico (0.76 <= progress <= 1.00, frames 228-300)
      else {
        if (!e.hasRoared) {
          e.hasRoared = true;
          playSfx('boss');
          triggerShake(16);
          triggerHaptic('heavy');
          addDamageText(e.x, e.y - 45, "A NOITE ME PERTENCE!", true, '#ff1744');

          bossShockwaves.push({
            x: e.x,
            y: e.y,
            radius: 20,
            maxRadius: 280,
            speed: 8.5,
            damage: 0,
            colorRgb: '255, 23, 68',
            hitPlayer: false
          });

          for (let p = 0; p < 36; p++) {
            const rAng = Math.random() * Math.PI * 2;
            const rDist = 20 + Math.random() * 140;
            createHitParticles(e.x + Math.cos(rAng) * rDist, e.y + Math.sin(rAng) * rDist, '#ff1744', 2);
          }
        }

        if (Math.floor(frameCount) % 2 === 0) {
          triggerShake(3.5);
          createHitParticles(e.x, e.y, '#ffffff', 2);
          createHitParticles(e.x, e.y, '#ff1744', 2);
        }
      }

      if (e.introTimer <= 0) {
        e.actionState = 'CHASE';
        e.isTargetable = true;
        e.isVulnerable = false;
        e.skillCooldown = 40;
        triggerShake(8);
        playSfx('crit');
      }
      return;
    }

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

      // Monitora o tempo colado durante a janela de recuperação
      const rdx = player.x - e.x;
      const rdy = player.y - e.y;
      if (rdx * rdx + rdy * rdy <= 140 * 140) {
        e.meleeContactTimer = (e.meleeContactTimer || 0) + dt;
      } else {
        e.meleeContactTimer = Math.max(0, (e.meleeContactTimer || 0) - dt * 2);
      }

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

      // Pós-imagens e névoa volumétrica
      if (Math.floor(frameCount) % 2 === 0) {
        if (!e.afterImages) e.afterImages = [];
        e.afterImages.push({
          x: e.x,
          y: e.y,
          facing: e.facing,
          life: 14,
          maxLife: 14
        });
      }

      createHitParticles(e.x, e.y, '#8e44ad', 2);
      createHitParticles(e.x, e.y, '#2c0c16', 2);
      createHitParticles(e.x, e.y, '#ff1744', 1);

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
          triggerShake(2);
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
        triggerShake(3.5);
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
        triggerShake(8);
        playSfx('shoot');

        // Anel expansivo previsível de adagas de sangue na saída da névoa
        const ringCount = e.isEnraged ? 16 : 12;
        for (let k = 0; k < ringCount; k++) {
          const fAng = (k * Math.PI * 2) / ringCount;
          enemyBullets.push({
            x: e.x, y: e.y,
            vx: Math.cos(fAng) * 4.2, vy: Math.sin(fAng) * 4.2,
            radius: 7.0, damage: Math.round(e.damage * 0.24), life: 110,
            bulletType: 'BLOOD_DAGGER',
            isBossProjectile: true,
            color: '#ff1744'
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
            radius: 7.5, damage: Math.round(e.damage * 0.22), life: 125,
            bulletType: 'BLOOD_ORB',
            isBossProjectile: true,
            color: '#ff0037'
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
      if (e.currentSkill === 'CLEAVE') {
        const cleaveMax = e.isEnraged ? 52 : 68;
        e.cleaveProgress = Math.min(1.0, Math.max(0, 1 - (e.actionTimer / cleaveMax)));
        if (Math.floor(frameCount) % 2 === 0) {
          const scAngle = e.aimAngle + (Math.random() - 0.5) * 1.4;
          const scDist = 25 + Math.random() * 95;
          createHitParticles(e.x + Math.cos(scAngle) * scDist, e.y + Math.sin(scAngle) * scDist, '#ff1744', 1);
          createHitParticles(e.x, e.y, '#2c0c16', 1);
        }
      } else if (e.currentSkill === 'REPULSION') {
        if (Math.floor(frameCount) % 2 === 0) {
          const rAng = Math.random() * Math.PI * 2;
          const rDist = Math.random() * (e.radius * 1.3);
          createHitParticles(e.x + Math.cos(rAng) * rDist, e.y + Math.sin(rAng) * rDist, '#ff1744', 1);
        }
      } else if (e.currentSkill === 'PINCER_SHOT') {
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

      // Rastreamento contínuo de curta distância
      if (dist <= 140) {
        e.meleeContactTimer = (e.meleeContactTimer || 0) + dt;
        if (e.meleeContactTimer > 80 && Math.floor(frameCount) % 5 === 0) {
          createHitParticles(e.x + (Math.random() - 0.5) * 32, e.y + (Math.random() - 0.5) * 32, '#ff1744', 1);
        }
      } else {
        e.meleeContactTimer = Math.max(0, (e.meleeContactTimer || 0) - dt * 2);
      }

      // Se completou 2 segundos colado (120 frames), dispara o golpe imediatamente
      if (e.meleeContactTimer >= 120 && (e.repulsionCooldown || 0) <= 0) {
        triggerRepulsionSkill(e, player, bossTelegraphs);
        return;
      }

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
