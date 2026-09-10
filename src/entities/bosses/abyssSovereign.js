import { playSfx } from '../../core/audio.js';

/**
 * Inicializa propriedades exclusivas do Soberano do Abismo (Boss 4).
 * @param {Object} boss 
 */
export function initAbyssSovereign(boss) {
  boss.vortexTimer = 0;
  boss.laserCycleTimer = 0;
  boss.laserState = 'IDLE';
  boss.laserChargeProgress = 0;
  boss.beamAngle = 0;
  boss.stateTimer = 0;
  boss.facing = 1;
}

/**
 * Atualiza a IA e padrões de ataque do Soberano do Abismo.
 * @param {Object} e Entidade do chefe.
 * @param {number} dt Delta time do frame.
 * @param {Object} context Contexto global injetado do loop.
 */
export function updateAbyssSovereign(e, dt, context) {
  const {
    player,
    frameCount,
    enemyBullets,
    voidVortices,
    triggerShake,
    addDamageText
  } = context;

  e.facing = (player.x - e.x) > 0 ? 1 : -1;

  let curSpeed = e.speed;
  if (e.slowTimer > 0) {
    e.slowTimer -= dt;
    curSpeed *= (1 - 0.18);
  }

  e.vortexTimer = (e.vortexTimer || 0) + dt;
  const vortexInterval = e.isEnraged ? 140 : 200;
  if (e.vortexTimer > vortexInterval) {
    e.vortexTimer = 0;
    e.windupTimer = 18;
    e.windupMax = 18;
    e.windupAction = () => {
      const vCount = e.isEnraged ? 3 : 2;
      for (let v = 0; v < vCount; v++) {
        const vAngle = Math.random() * Math.PI * 2;
        const vDist = Math.random() * 180 + 70;
        voidVortices.push({
          x: player.x + Math.cos(vAngle) * vDist,
          y: player.y + Math.sin(vAngle) * vDist,
          radius: 48,
          life: 340,
          maxLife: 340,
          damage: Math.round(e.damage * 0.15),
          tickTimer: 0
        });
      }
      playSfx('boss');
      triggerShake(7);
    };
  }

  const laserCount = e.isEnraged ? 6 : 4;
  const cycleTotal = e.isEnraged ? 300 : 340;
  const chargeTime = e.isEnraged ? 54 : 72;
  const fireTime = e.isEnraged ? 190 : 180;

  e.laserCycleTimer = ((e.laserCycleTimer || 0) + dt) % cycleTotal;

  if (e.laserCycleTimer < chargeTime) {
    e.laserState = 'CHARGING';
    e.laserChargeProgress = e.laserCycleTimer / chargeTime;
    e.beamAngle += (e.isEnraged ? 0.012 : 0.006) * dt;
  } else if (e.laserCycleTimer < chargeTime + fireTime) {
    e.laserState = 'FIRING';
    e.laserChargeProgress = 1;
    e.beamAngle += (e.isEnraged ? 0.035 : 0.016) * dt;

    for (let arm = 0; arm < laserCount; arm++) {
      const bAng = e.beamAngle + (arm * (Math.PI * 2 / laserCount));
      const bx = Math.cos(bAng);
      const by = Math.sin(bAng);
      const px = player.x - e.x;
      const py = player.y - e.y;
      const proj = px * bx + py * by;
      if (proj > 0 && proj < 650) {
        const perpX = px - proj * bx;
        const perpY = py - proj * by;
        if (perpX * perpX + perpY * perpY < 18 * 18 && player.iFrames <= 0) {
          const laserDmg = Math.round(e.damage * 0.35);
          player.hp -= laserDmg;
          player.iFrames = 22;
          triggerShake(9);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${laserDmg}`, false, '#9b59b6');
        }
      }
    }
  } else {
    e.laserState = 'IDLE';
    e.laserChargeProgress = 0;
    e.beamAngle += (e.isEnraged ? 0.015 : 0.008) * dt;
  }

  if (e.isEnraged) {
    const gdx = e.x - player.x;
    const gdy = e.y - player.y;
    const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
    if (gdist > 20) {
      player.x += (gdx / gdist) * 1.1 * dt;
      player.y += (gdy / gdist) * 1.1 * dt;
    }
  }

  e.stateTimer = (e.stateTimer || 0) + dt;
  const spiralInterval = e.isEnraged ? 12 : 20;
  if (Math.floor(e.stateTimer) % spiralInterval === 0) {
    const spAng = frameCount * 0.15;
    enemyBullets.push({
      x: e.x, y: e.y,
      vx: Math.cos(spAng) * 4.2, vy: Math.sin(spAng) * 4.2,
      radius: 5, damage: Math.round(e.damage * 0.20), life: 130
    });
  }

  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  e.x += Math.cos(angle) * curSpeed * dt;
  e.y += Math.sin(angle) * curSpeed * dt;
}

/**
 * Renderiza o Soberano do Abismo.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} e 
 * @param {number} frameCount 
 */
export function drawAbyssSovereign(ctx, e, frameCount) {
  for (let t = 0; t < 8; t++) {
    const baseAngle = (t * Math.PI * 2) / 8;
    ctx.strokeStyle = '#341f97';
    ctx.lineWidth = 7;
    ctx.beginPath();
    let currX = Math.cos(baseAngle) * 55;
    let currY = Math.sin(baseAngle) * 55;
    ctx.moveTo(currX, currY);
    for (let seg = 1; seg <= 4; seg++) {
      const wave = Math.sin(frameCount * 0.15 + t + seg) * 16;
      currX += Math.cos(baseAngle) * 22 + Math.cos(baseAngle + Math.PI / 2) * wave * 0.3;
      currY += Math.sin(baseAngle) * 22 + Math.sin(baseAngle + Math.PI / 2) * wave * 0.3;
      ctx.lineTo(currX, currY);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(155, 89, 182, 0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 115, 45, frameCount * 0.02, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(232, 67, 147, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 115, 45, -frameCount * 0.025, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#08010f';
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a29bfe';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#e84393';
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 10, frameCount * 0.04, 0, Math.PI * 2);
  ctx.fill();
}