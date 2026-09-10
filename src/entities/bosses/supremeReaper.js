import { playSfx } from '../../core/audio.js';

/**
 * Inicializa propriedades exclusivas do Ceifador Supremo (Boss 3).
 * @param {Object} boss 
 */
export function initSupremeReaper(boss) {
  boss.soulSummonTimer = 0;
  boss.cleaveCooldown = 0;
  boss.stateTimer = 0;
  boss.facing = 1;
}

/**
 * Atualiza a IA e padrões de ataque do Ceifador Supremo.
 * @param {Object} e Entidade do chefe.
 * @param {number} dt Delta time do frame.
 * @param {Object} context Contexto global injetado do loop.
 */
export function updateSupremeReaper(e, dt, context) {
  const {
    player,
    enemies,
    bossProjectiles,
    bossTelegraphs,
    addDamageText
  } = context;

  e.facing = (player.x - e.x) > 0 ? 1 : -1;

  let curSpeed = e.speed;
  if (e.slowTimer > 0) {
    e.slowTimer -= dt;
    curSpeed *= (1 - 0.18);
  }

  const distSqToPlayer = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;

  e.soulSummonTimer = (e.soulSummonTimer || 0) + dt;
  if (e.soulSummonTimer > 260) {
    e.soulSummonTimer = 0;
    const soulCount = e.isEnraged ? 5 : 3;
    for (let s = 0; s < soulCount; s++) {
      const sAngle = (s * Math.PI * 2) / soulCount;
      enemies.push({
        x: e.x + Math.cos(sAngle) * 45,
        y: e.y + Math.sin(sAngle) * 45,
        baseType: 'VENGEFUL_SOUL',
        radius: 10,
        speed: 2.25,
        hp: 140,
        maxHp: 140,
        color: '#00cec9',
        damage: Math.round(e.damage * 0.20),
        behavior: 'chase',
        xp: 2,
        facing: 1,
        hitFlash: 0,
        orbitalHitCd: 0,
        slowTimer: 0,
        slowFactor: 0,
        stunTimer: 0
      });
    }
    playSfx('boss');
    addDamageText(e.x, e.y, "ALMAS VINGATIVAS!", false, '#00cec9');
  }

  e.cleaveCooldown = (e.cleaveCooldown || 0) + dt;
  if (distSqToPlayer < 145 * 145 && e.cleaveCooldown > 150) {
    e.cleaveCooldown = 0;
    e.windupTimer = 22;
    e.windupMax = 22;
    e.windupAction = () => {
      const cleaveAngle = Math.atan2(player.y - e.y, player.x - e.x);
      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 140,
        angle: cleaveAngle,
        timer: 24,
        maxTimer: 24,
        damage: Math.round(e.damage * 0.80),
        boss: e
      });
    };
  }

  e.stateTimer = (e.stateTimer || 0) + dt;
  const attackInterval = e.isEnraged ? 60 : 100;
  if (e.stateTimer > attackInterval) {
    e.stateTimer = 0;
    e.windupTimer = 20;
    e.windupMax = 20;
    e.windupAction = () => {
      const sAng = Math.atan2(player.y - e.y, player.x - e.x);
      bossProjectiles.push({
        x: e.x, y: e.y,
        vx: Math.cos(sAng) * 6.5, vy: Math.sin(sAng) * 6.5,
        radius: 20, damage: Math.round(e.damage * 0.60), life: 160, maxLife: 160
      });
      if (e.isEnraged) {
        const oppAng = sAng + Math.PI;
        bossProjectiles.push({
          x: e.x, y: e.y,
          vx: Math.cos(oppAng) * 6.5, vy: Math.sin(oppAng) * 6.5,
          radius: 20, damage: Math.round(e.damage * 0.60), life: 160, maxLife: 160
        });
      }
      playSfx('shoot');
    };
  }

  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  e.x += Math.cos(angle) * curSpeed * dt;
  e.y += Math.sin(angle) * curSpeed * dt;
}

/**
 * Renderiza o Ceifador Supremo.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} e 
 * @param {number} frameCount 
 */
export function drawSupremeReaper(ctx, e, frameCount) {
  const drape = Math.sin(frameCount * 0.1) * 8;
  ctx.fillStyle = '#060c12';
  ctx.beginPath();
  ctx.moveTo(-35, -45);
  ctx.quadraticCurveTo(-50 + drape, 15, -30, 65);
  ctx.lineTo(30, 65);
  ctx.quadraticCurveTo(50 - drape, 15, 35, -45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.arc(0, -42, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#81ecec';
  ctx.beginPath();
  ctx.arc(-8, -44, 3.5, 0, Math.PI * 2);
  ctx.arc(8, -44, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(55, -20 + Math.sin(frameCount * 0.12) * 10);
  ctx.rotate(0.4);
  ctx.fillStyle = '#636e72';
  ctx.fillRect(-3, -60, 6, 120);
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, -60, 40, 0, Math.PI * 0.8, true);
  ctx.stroke();
  ctx.restore();
}