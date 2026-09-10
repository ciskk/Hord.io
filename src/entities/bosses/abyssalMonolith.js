import { playSfx } from '../../core/audio.js';

/**
 * Inicializa propriedades exclusivas do Monólito Abissal (Boss 2).
 * @param {Object} boss 
 */
export function initAbyssalMonolith(boss) {
  boss.orbCount = 4;
  boss.orbAttackTimer = 0;
  boss.orbRegenTimer = 0;
  boss.stateTimer = 0;
  boss.isVulnerable = false;
  boss.facing = 1;
}

/**
 * Atualiza a IA e padrões de ataque do Monólito Abissal.
 * @param {Object} e Entidade do chefe.
 * @param {number} dt Delta time do frame.
 * @param {Object} context Contexto global injetado do loop.
 */
export function updateAbyssalMonolith(e, dt, context) {
  const {
    player,
    bossProjectiles,
    bossTelegraphs,
    triggerShake,
    createHitParticles,
    addDamageText
  } = context;

  e.facing = (player.x - e.x) > 0 ? 1 : -1;

  let curSpeed = e.speed;
  if (e.slowTimer > 0) {
    e.slowTimer -= dt;
    curSpeed *= (1 - 0.18);
  }

  e.orbAttackTimer = (e.orbAttackTimer || 0) + dt;
  const orbInterval = e.isEnraged ? 85 : 125;

  if (e.orbCount > 0 && e.orbAttackTimer > orbInterval) {
    e.orbAttackTimer = 0;
    e.windupTimer = 16;
    e.windupMax = 16;
    e.windupAction = () => {
      e.orbCount--;
      const orbAng = Math.atan2(player.y - e.y, player.x - e.x);
      bossProjectiles.push({
        type: 'MONOLITH_ORB',
        x: e.x,
        y: e.y,
        vx: Math.cos(orbAng) * 4.6,
        vy: Math.sin(orbAng) * 4.6,
        radius: 14,
        damage: Math.round(e.damage * 0.55),
        life: 180,
        maxLife: 180
      });
      playSfx('shoot');
      triggerShake(5);
    };
  }

  if (e.orbCount === 0) {
    e.isVulnerable = true;
    e.orbRegenTimer = (e.orbRegenTimer || 0) + dt;
    if (e.orbRegenTimer > 210) {
      e.orbCount = 4;
      e.isVulnerable = false;
      e.orbRegenTimer = 0;
      triggerShake(14);
      createHitParticles(e.x, e.y, '#e67e22', 16);
      playSfx('boss');
      addDamageText(e.x, e.y, "ORBES RESTAURADOS!", true, '#e67e22');
    }
  }

  e.stateTimer = (e.stateTimer || 0) + dt;
  const attackInterval = e.isEnraged ? 55 : 90;
  if (e.stateTimer > attackInterval) {
    e.stateTimer = 0;
    e.windupTimer = 24;
    e.windupMax = 24;
    e.windupAction = () => {
      const meteorCount = e.isEnraged ? 6 : 3;
      for (let m = 0; m < meteorCount; m++) {
        bossTelegraphs.push({
          x: player.x + (Math.random() - 0.5) * 160,
          y: player.y + (Math.random() - 0.5) * 160,
          radius: e.isEnraged ? 85 : 75,
          timer: 65,
          maxTimer: 65,
          damage: Math.round(e.damage * 0.60)
        });
      }
      if (e.isEnraged) {
        bossTelegraphs.push({
          x: e.x,
          y: e.y,
          radius: 135,
          timer: 50,
          maxTimer: 50,
          damage: Math.round(e.damage * 0.70)
        });
        triggerShake(8);
      }
    };
  }

  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  e.x += Math.cos(angle) * curSpeed * dt;
  e.y += Math.sin(angle) * curSpeed * dt;
}

/**
 * Renderiza o Monólito Abissal.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} e 
 * @param {number} frameCount 
 */
export function drawAbyssalMonolith(ctx, e, frameCount) {
  for (let r = 0; r < 4; r++) {
    const orbAng = frameCount * 0.04 + (r * Math.PI / 2);
    const rx = Math.cos(orbAng) * 98;
    const ry = Math.sin(orbAng) * 98;
    ctx.fillStyle = '#1c1008';
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(rx, ry, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#140c06';
  ctx.beginPath();
  for (let s = 0; s < 6; s++) {
    const a = (s * Math.PI * 2) / 6 + (frameCount * 0.005);
    const hx = Math.cos(a) * e.radius;
    const hy = Math.sin(a) * e.radius;
    if (s === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = e.isEnraged ? '#e74c3c' : '#d35400';
  ctx.lineWidth = 5;
  ctx.stroke();

  const corePulse = Math.sin(frameCount * 0.12) * 6;
  ctx.fillStyle = 'rgba(230, 126, 34, 0.35)';
  ctx.fillRect(-26 - corePulse / 2, -26 - corePulse / 2, 52 + corePulse, 52 + corePulse);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(-20 - corePulse / 2, -20 - corePulse / 2, 40 + corePulse, 40 + corePulse);
}