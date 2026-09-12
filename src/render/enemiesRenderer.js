/**
 * src/render/enemiesRenderer.js
 * 
 * Módulo especializado na renderização de monstros comuns, efeitos visuais de status
 * (atordoamento, lentidão criogênica, auréolas de elite e barra de vida suspensa de minibosses)
 * e despacho hierárquico para renderizadores de chefes e minibosses.
 */
import { ctx, frameCount } from '../main.js';
import { player } from '../entities/player.js';
import { drawBoss } from '../entities/bosses/bossRegistry.js';
import { drawMiniBossShape } from './minibossesRenderer.js';

/**
 * Renderiza a forma, animações e overlays de um inimigo no Canvas.
 * @param {Object} e Entidade do inimigo a ser desenhado.
 */
export function drawEnemyShape(e) {
  if (e.isBossSubTarget) return;

  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(e.facing, 1);

  if (e.stunTimer > 0) {
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    for (let s = 0; s < 3; s++) {
      const starAng = frameCount * 0.18 + s * (Math.PI * 2 / 3);
      const starR = e.radius + 8;
      const sx = Math.cos(starAng) * starR;
      const sy = Math.sin(starAng) * (starR * 0.45) - (e.radius + 12);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }
  }

  if (e.slowTimer > 0) {
    const pulseSlow = Math.sin(frameCount * 0.25) * 2;
    ctx.strokeStyle = '#74b9ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 4 + pulseSlow, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(116, 185, 255, 0.65)';
    for (let sp = 0; sp < 4; sp++) {
      const spAng = sp * (Math.PI / 2) + frameCount * 0.05;
      const spDist = e.radius + 5;
      ctx.fillRect(Math.cos(spAng) * spDist - 2, Math.sin(spAng) * spDist - 2, 4, 4);
    }
  }

  if (e.isElite) {
    const auraPulse = Math.sin(frameCount * 0.2) * 3;
    let aColor = '#00d2d3';
    if (e.eliteMod === 'HASTE') aColor = '#f1c40f';
    if (e.eliteMod === 'TOXIC') aColor = '#2ecc71';
    ctx.strokeStyle = aColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 6 + auraPulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (e.isMiniBoss) {
    const barW = 44;
    const barH = 5;
    const hpPct = Math.max(0, e.hp / e.maxHp);
    const offsetY = -e.radius - 14;

    ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
    ctx.fillRect(-barW / 2, offsetY, barW, barH);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(-barW / 2, offsetY, barW * hpPct, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, offsetY, barW, barH);

    ctx.strokeStyle = 'rgba(243, 156, 18, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (e.isBoss) {
    drawBoss(ctx, e, frameCount);
  } else if (e.isMiniBoss) {
    drawMiniBossShape(e);
  } else {
    const isHit = e.hitFlash > 0;
    const baseCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : e.color);

    if (e.baseType === 'ZOMBIE') {
      const R_m = e.radius;
      const walk = Math.sin(frameCount * 0.16);
      const isAttacking = e.combatState === 'WINDUP' || e.combatState === 'STRIKE';
      const variant = e.variant || 0;

      // Paletas temáticas por variante
      let skinBase = '#52734d';
      let skinShadow = '#31492c';
      let clothMain = '#3a3d40';
      let clothAccent = '#242628';

      if (variant === 1) {
        // Sucateiro Industrial
        skinBase = '#4d5d53';
        skinShadow = '#2d3731';
        clothMain = '#1e272e';
        clothAccent = '#485460';
      } else if (variant === 2) {
        // Contaminado Tóxico
        skinBase = '#2d5a27';
        skinShadow = '#163814';
        clothMain = '#808e9b';
        clothAccent = '#27ae60';
      } else if (variant === 3) {
        // Sentinela Decaído
        skinBase = '#576574';
        skinShadow = '#38424d';
        clothMain = '#5c1926';
        clothAccent = '#2f3542';
      }

      if (isHit) {
        skinBase = '#ffffff';
        skinShadow = '#ffffff';
        clothMain = '#ffffff';
        clothAccent = '#ffffff';
      } else if (e.slowTimer > 0) {
        skinBase = '#74b9ff';
      }

      // 1. Pernas com passada trôpega assimétrica (mancando)
      ctx.fillStyle = clothAccent;
      ctx.fillRect(-R_m * 0.4, R_m * 0.2 + walk * 2.5, 3.2, R_m * 0.7 - walk * 1.8);
      ctx.fillRect(-R_m * 0.1, R_m * 0.25 - walk * 2.2, 3.2, R_m * 0.65 + walk * 1.8);

      // 2. Torso Curvado / Silhueta Corcunda
      ctx.fillStyle = clothMain;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.65, -R_m * 0.15 + walk * 0.8);
      ctx.lineTo(R_m * 0.1, -R_m * 0.35 + walk * 0.8);
      ctx.lineTo(R_m * 0.3, R_m * 0.4);
      ctx.lineTo(-R_m * 0.45, R_m * 0.45);
      ctx.closePath();
      ctx.fill();

      // Detalhes de Peito por Variante
      if (variant === 0) {
        // Rasgos expondo costelas escuras
        ctx.fillStyle = skinShadow;
        ctx.fillRect(-R_m * 0.25, -R_m * 0.05 + walk * 0.8, 3, 7);
        ctx.fillRect(-R_m * 0.1, R_m * 0.05 + walk * 0.8, 2.5, 5);
      } else if (variant === 1) {
        // Correia de couro diagonal e fivela de sucata
        ctx.strokeStyle = '#8c7b75';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.45, -R_m * 0.2 + walk * 0.8);
        ctx.lineTo(R_m * 0.15, R_m * 0.35 + walk * 0.8);
        ctx.stroke();
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-R_m * 0.18, walk * 0.8, 2.5, 2.5);
      } else if (variant === 2) {
        // Veias tóxicas bioluminescentes
        ctx.strokeStyle = isHit ? '#ffffff' : '#2ecc71';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.3, -R_m * 0.1 + walk * 0.8);
        ctx.lineTo(-R_m * 0.1, R_m * 0.15 + walk * 0.8);
        ctx.lineTo(R_m * 0.1, R_m * 0.05 + walk * 0.8);
        ctx.stroke();
      } else if (variant === 3) {
        // Ombreira de ferro militar no ombro traseiro
        ctx.fillStyle = isHit ? '#ffffff' : '#2f3542';
        ctx.fillRect(-R_m * 0.75, -R_m * 0.35 + walk * 0.8, R_m * 0.5, 4.5);
        ctx.strokeStyle = '#747d8c';
        ctx.lineWidth = 1;
        ctx.strokeRect(-R_m * 0.75, -R_m * 0.35 + walk * 0.8, R_m * 0.5, 4.5);
      }

      // 3. Cabeça e Pescoço Projetados à Frente
      const headX = R_m * 0.22;
      const headY = -R_m * 0.48 + walk * 1.2;

      ctx.fillStyle = skinBase;
      ctx.beginPath();
      ctx.ellipse(headX, headY, R_m * 0.36, R_m * 0.42, 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Mandíbula e Boca Decrépita Aberta
      ctx.fillStyle = '#111111';
      ctx.fillRect(headX + 2, headY + 2, 3, 2.5);

      // Acessórios de Cabeça e Olhos por Variante
      if (variant === 0) {
        // Mechas de cabelo desgrenhado escuro
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.moveTo(headX - 4, headY - 4);
        ctx.lineTo(headX - 1, headY - 6);
        ctx.lineTo(headX + 3, headY - 4);
        ctx.lineTo(headX + 1, headY - 1);
        ctx.fill();
        // Olhos esbranquiçados com ponto vermelho
        ctx.fillStyle = '#dfe4ea';
        ctx.fillRect(headX + 1.5, headY - 2, 2.5, 2.2);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(headX + 2.5, headY - 1.5, 1.2, 1.2);
      } else if (variant === 1) {
        // Chapa de ferro rebitada na testa
        ctx.fillStyle = isHit ? '#ffffff' : '#57606f';
        ctx.fillRect(headX - 3.5, headY - 5, 7.5, 3);
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(headX - 2.5, headY - 4.2, 1.5, 1.5);
        ctx.fillRect(headX + 1.5, headY - 4.2, 1.5, 1.5);
        // Olho cibernético amarelado vivo
        ctx.fillStyle = isHit ? '#ffffff' : '#f1c40f';
        ctx.fillRect(headX + 2, headY - 1.5, 2.5, 2.2);
      } else if (variant === 2) {
        // Pústula de fungo/bioquímica pulsante na calota craniana
        const sporePulse = Math.sin(frameCount * 0.22) * 1.2;
        ctx.fillStyle = isHit ? '#ffffff' : '#2ecc71';
        ctx.beginPath();
        ctx.arc(headX - 1, headY - 5, Math.max(1, 2.8 + sporePulse), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a8e6cf';
        ctx.fillRect(headX - 1.5, headY - 5.5, 1.5, 1.5);
        // Olho leitoso esverdeado
        ctx.fillStyle = '#2ed573';
        ctx.fillRect(headX + 2, headY - 1.5, 2.2, 2);
      } else if (variant === 3) {
        // Capacete/Barrete de guarda amassado
        ctx.fillStyle = isHit ? '#ffffff' : '#2f3542';
        ctx.beginPath();
        ctx.moveTo(headX - 4.5, headY - 2.5);
        ctx.lineTo(headX + 5, headY - 4.5);
        ctx.lineTo(headX + 1, headY - 7);
        ctx.lineTo(headX - 3.5, headY - 6);
        ctx.closePath();
        ctx.fill();
        // Fresta de visão sombria com olhos vermelhos
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(headX + 1.5, headY - 1.5, 2.8, 1.8);
      }

      // 4. Braços e Garras (Postura Dinâmica reativa a WINDUP e STRIKE)
      const armWindup = e.combatState === 'WINDUP';
      const armStrike = e.combatState === 'STRIKE';
      const baseReach = isAttacking ? R_m * 1.05 : R_m * 0.72;
      const reach1 = baseReach + (armStrike ? 4 : 0);
      const reach2 = baseReach * 0.75 + (armStrike ? 3 : 0);
      const lift1 = armWindup ? -R_m * 0.45 : (walk * 2.2);
      const lift2 = armWindup ? -R_m * 0.30 : (-walk * 1.8);

      // Braço Traseiro / Secundário
      ctx.fillStyle = skinShadow;
      ctx.fillRect(-R_m * 0.1, -R_m * 0.1 + lift2, reach2, 2.8);
      ctx.fillStyle = '#111111';
      ctx.fillRect(-R_m * 0.1 + reach2, -R_m * 0.1 + lift2 - 0.5, 2.2, 3.8);

      // Braço Principal Estendido para a Frente
      ctx.fillStyle = skinBase;
      ctx.fillRect(R_m * 0.05, -R_m * 0.22 + lift1, reach1, 3.4);

      if (variant === 1) {
        // Manopla de sucata amarrada no antebraço
        ctx.fillStyle = isHit ? '#ffffff' : '#747d8c';
        ctx.fillRect(R_m * 0.15, -R_m * 0.25 + lift1, reach1 * 0.5, 4.2);
      }

      // Mão e garras pontiagudas afiadas
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(R_m * 0.05 + reach1, -R_m * 0.22 + lift1 - 1, 3.2, 5.2);
      ctx.fillStyle = '#dfe4ea';
      ctx.fillRect(R_m * 0.05 + reach1 + 2.5, -R_m * 0.22 + lift1, 1.5, 1.5);
      ctx.fillRect(R_m * 0.05 + reach1 + 2.5, -R_m * 0.22 + lift1 + 2.5, 1.5, 1.5);

    } else if (e.baseType === 'BAT') {
      const R_m = e.radius;
      const wingCycle = Math.sin(frameCount * 0.42);
      const wingY = wingCycle * 7.5;
      const batBody = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2d3436');
      const membrane = isHit ? '#ffffff' : '#c0392b';

      ctx.fillStyle = membrane;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.2, 0);
      ctx.lineTo(-R_m * 1.5, -R_m * 0.8 + wingY);
      ctx.quadraticCurveTo(-R_m * 1.0, R_m * 0.1 + wingY * 0.5, -R_m * 0.3, R_m * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, 0);
      ctx.lineTo(R_m * 1.5, -R_m * 0.8 + wingY);
      ctx.quadraticCurveTo(R_m * 1.0, R_m * 0.1 + wingY * 0.5, R_m * 0.3, R_m * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = batBody;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -R_m * 0.2);
      ctx.lineTo(-R_m * 1.5, -R_m * 0.8 + wingY);
      ctx.moveTo(0, -R_m * 0.2);
      ctx.lineTo(R_m * 1.5, -R_m * 0.8 + wingY);
      ctx.stroke();

      ctx.fillStyle = batBody;
      ctx.beginPath();
      ctx.ellipse(0, 0, R_m * 0.45, R_m * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.5);
      ctx.lineTo(-R_m * 0.5, -R_m * 1.0);
      ctx.lineTo(-R_m * 0.15, -R_m * 0.6);
      ctx.moveTo(R_m * 0.35, -R_m * 0.5);
      ctx.lineTo(R_m * 0.5, -R_m * 1.0);
      ctx.lineTo(R_m * 0.15, -R_m * 0.6);
      ctx.fill();

      ctx.fillStyle = '#ff1744';
      ctx.fillRect(-R_m * 0.25, -R_m * 0.3, 2, 2.5);
      ctx.fillRect(R_m * 0.05, -R_m * 0.3, 2, 2.5);

    } else if (e.baseType === 'SHIELDED') {
      const R_m = e.radius;
      const walk = Math.sin(frameCount * 0.14) * 2;
      const plateCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4b6584');
      const metalDark = isHit ? '#ffffff' : '#2f3542';
      const shieldGold = isHit ? '#ffffff' : '#f1c40f';

      ctx.fillStyle = plateCol;
      ctx.beginPath();
      ctx.arc(-R_m * 0.25, walk, R_m * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = metalDark;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ff4757';
      ctx.fillRect(-R_m * 0.1, -2 + walk, 4, 2.5);

      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.2, -R_m * 0.3 + walk);
      ctx.lineTo(R_m * 0.85, -R_m * 0.65 + walk);
      ctx.stroke();

      const shX = R_m * 0.15;
      const shY = -R_m * 0.9 + walk;
      const shW = R_m * 0.55;
      const shH = R_m * 1.8;

      ctx.fillStyle = metalDark;
      ctx.fillRect(shX, shY, shW, shH);
      ctx.strokeStyle = isHit ? '#ffffff' : '#747d8c';
      ctx.lineWidth = 2;
      ctx.strokeRect(shX, shY, shW, shH);

      ctx.fillStyle = shieldGold;
      ctx.fillRect(shX + shW * 0.35, shY + 3, 3, shH - 6);
      ctx.fillRect(shX + 2, shY + shH * 0.45, shW - 4, 3);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(shX + 2, shY + 2, 2, 2);
      ctx.fillRect(shX + shW - 4, shY + 2, 2, 2);
      ctx.fillRect(shX + 2, shY + shH - 4, 2, 2);
      ctx.fillRect(shX + shW - 4, shY + shH - 4, 2, 2);
    } else if (e.baseType === 'GOLEM') {
      const R_m = e.radius;
      const stoneDark = isHit ? '#ffffff' : '#2d3436';
      const stoneMid = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4b6584');
      const stoneLight = isHit ? '#ffffff' : '#778ca3';
      const runeGlow = isHit ? '#ffffff' : '#f39c12';
      const lavaColor = isHit ? '#ffffff' : '#e74c3c';

      const stepCycle = Math.sin(frameCount * 0.1);
      ctx.fillStyle = stoneDark;
      ctx.fillRect(-R_m * 0.65, R_m * 0.5 + stepCycle * 2.5, R_m * 0.45, R_m * 0.5);
      ctx.fillRect(R_m * 0.2, R_m * 0.5 - stepCycle * 2.5, R_m * 0.45, R_m * 0.5);

      ctx.fillStyle = stoneMid;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.85, -R_m * 0.4);
      ctx.lineTo(R_m * 0.85, -R_m * 0.45);
      ctx.lineTo(R_m * 0.55, R_m * 0.6);
      ctx.lineTo(-R_m * 0.55, R_m * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = stoneLight;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.75, -R_m * 0.35);
      ctx.lineTo(0, -R_m * 0.4);
      ctx.lineTo(-R_m * 0.1, R_m * 0.3);
      ctx.lineTo(-R_m * 0.5, R_m * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -R_m * 0.4);
      ctx.lineTo(R_m * 0.75, -R_m * 0.35);
      ctx.lineTo(R_m * 0.5, R_m * 0.25);
      ctx.lineTo(R_m * 0.05, R_m * 0.35);
      ctx.closePath();
      ctx.fill();

      const crackPulse = (Math.sin(frameCount * 0.12) + 1) * 0.5;
      ctx.strokeStyle = crackPulse > 0.4 ? runeGlow : lavaColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.1, -R_m * 0.3);
      ctx.lineTo(R_m * 0.15, -R_m * 0.05);
      ctx.lineTo(-R_m * 0.05, R_m * 0.2);
      ctx.lineTo(R_m * 0.2, R_m * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R_m * 0.15, -R_m * 0.05);
      ctx.lineTo(R_m * 0.4, 0);
      ctx.stroke();

      ctx.fillStyle = stoneDark;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.75);
      ctx.lineTo(R_m * 0.35, -R_m * 0.75);
      ctx.lineTo(R_m * 0.25, -R_m * 0.25);
      ctx.lineTo(-R_m * 0.25, -R_m * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = stoneLight;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = runeGlow;
      ctx.fillRect(-R_m * 0.2, -R_m * 0.55, R_m * 0.4, 3.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-R_m * 0.05, -R_m * 0.55, R_m * 0.15, 3.5);

      const fistBob = Math.sin(frameCount * 0.1) * (R_m * 0.25);
      ctx.fillStyle = stoneMid;
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(-R_m * 1.05, fistBob + 2, R_m * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(R_m * 1.05, -fistBob + 2, R_m * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (e.baseType === 'EXPLODER') {
      const R_m = e.radius;
      const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
      const urgency = Math.min(1, Math.max(0, 1 - distToPlayer / 260));
      const pulseSpeed = 0.12 + urgency * 0.35;
      const pustulePulse = Math.sin(frameCount * pulseSpeed) * (2.5 + urgency * 4);
      const heatPhase = (Math.sin(frameCount * pulseSpeed) + 1) * 0.5;

      const fleshColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4a2810');
      const fleshDark = isHit ? '#ffffff' : '#2c1508';
      const pustuleOuter = isHit ? '#ffffff' : (heatPhase > 0.4 ? '#e67e22' : '#c0392b');
      const pustuleInner = isHit ? '#ffffff' : (heatPhase > 0.6 ? '#f1c40f' : '#e67e22');

      const legWalk = Math.sin(frameCount * 0.25) * 6;
      ctx.strokeStyle = fleshDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, R_m * 0.2);
      ctx.lineTo(-R_m * 0.5 + legWalk, R_m * 0.6);
      ctx.lineTo(-R_m * 0.4 + legWalk, R_m * 0.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, R_m * 0.2);
      ctx.lineTo(R_m * 0.1 - legWalk, R_m * 0.6);
      ctx.lineTo(R_m * 0.3 - legWalk, R_m * 0.95);
      ctx.stroke();

      const pustuleR = (R_m * 0.75) + pustulePulse;
      ctx.fillStyle = pustuleOuter;
      ctx.beginPath();
      ctx.arc(-R_m * 0.45, -R_m * 0.4, pustuleR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pustuleInner;
      ctx.beginPath();
      ctx.arc(-R_m * 0.45, -R_m * 0.4, pustuleR * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-R_m * 0.55, -R_m * 0.5, pustuleR * 0.25, 0, Math.PI * 2);
      ctx.fill();

      if (Math.floor(frameCount + e.x) % 3 === 0) {
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(-R_m * 1.3 - Math.random() * 6, -R_m * 0.4 + (Math.random() - 0.5) * 12, 2.5, 2.5);
      }

      ctx.fillStyle = fleshColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.4, -R_m * 0.1);
      ctx.quadraticCurveTo(R_m * 0.1, -R_m * 0.7, R_m * 0.45, -R_m * 0.2);
      ctx.lineTo(R_m * 0.2, R_m * 0.45);
      ctx.lineTo(-R_m * 0.3, R_m * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = fleshDark;
      ctx.beginPath();
      ctx.arc(R_m * 0.6, -R_m * 0.1, R_m * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(R_m * 0.7, -R_m * 0.2, 3, 2.5);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(R_m * 0.65, 0, 4, 2);

      const armSway = Math.sin(frameCount * 0.2) * 3;
      ctx.strokeStyle = fleshColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.15, -R_m * 0.1);
      ctx.lineTo(R_m * 0.45 + armSway, R_m * 0.5);
      ctx.lineTo(R_m * 0.6 + armSway, R_m * 0.9);
      ctx.stroke();

      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.6 + armSway, R_m * 0.9);
      ctx.lineTo(R_m * 0.75 + armSway, R_m * 1.05);
      ctx.moveTo(R_m * 0.55 + armSway, R_m * 0.9);
      ctx.lineTo(R_m * 0.65 + armSway, R_m * 1.1);
      ctx.stroke();
    } else if (e.baseType === 'NECRO') {
      const R_m = e.radius;
      const hover = Math.sin(frameCount * 0.08) * 3.5;
      const wave1 = Math.sin(frameCount * 0.14) * 4;
      const wave2 = Math.cos(frameCount * 0.16) * 4;

      const robeColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e1b2e');
      const trimColor = isHit ? '#ffffff' : '#6c5ce7';
      const innerVoid = isHit ? '#ffffff' : '#090810';
      const eyeColor = isHit ? '#ffffff' : '#00cec9';

      ctx.fillStyle = robeColor;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, -R_m * 0.6 + hover);
      ctx.lineTo(R_m * 0.65, R_m * 0.7 + hover);
      ctx.quadraticCurveTo(R_m * 0.3 + wave2, R_m * 0.95 + hover, 0, R_m * 0.75 + hover);
      ctx.quadraticCurveTo(-R_m * 0.3 + wave1, R_m * 0.95 + hover, -R_m * 0.65, R_m * 0.7 + hover);
      ctx.lineTo(-R_m * 0.3, -R_m * 0.6 + hover);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = trimColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = trimColor;
      ctx.fillRect(-2, -R_m * 0.2 + hover, 4, R_m * 0.8);

      ctx.fillStyle = robeColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.5, -R_m * 0.75 + hover);
      ctx.lineTo(-R_m * 0.2, -R_m * 1.3 + hover);
      ctx.lineTo(R_m * 0.45, -R_m * 0.5 + hover);
      ctx.lineTo(R_m * 0.2, -R_m * 0.25 + hover);
      ctx.lineTo(-R_m * 0.4, -R_m * 0.3 + hover);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = innerVoid;
      ctx.beginPath();
      ctx.ellipse(R_m * 0.1, -R_m * 0.45 + hover, R_m * 0.32, R_m * 0.25, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = eyeColor;
      ctx.fillRect(R_m * 0.05, -R_m * 0.52 + hover, 3.5, 2);
      ctx.fillRect(R_m * 0.22, -R_m * 0.48 + hover, 3.5, 2);

      const staffX = R_m * 0.85;
      const staffTopY = -R_m * 1.1 + hover;
      const staffBotY = R_m * 0.8 + hover;

      ctx.strokeStyle = isHit ? '#ffffff' : '#8395a7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(staffX - 2, staffBotY);
      ctx.lineTo(staffX + 2, 0 + hover);
      ctx.lineTo(staffX, staffTopY);
      ctx.stroke();

      const summonRatio = Math.min(1, Math.max(0, (e.summonTimer || 0) / 230));
      const orbPulse = Math.sin(frameCount * (0.15 + summonRatio * 0.35)) * (2 + summonRatio * 4);
      const orbColor = summonRatio > 0.75 ? '#ff7675' : '#a29bfe';

      ctx.fillStyle = isHit ? '#ffffff' : orbColor;
      ctx.beginPath();
      ctx.arc(staffX, staffTopY - 6, Math.max(2, 4.5 + orbPulse), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isHit ? '#ffffff' : '#dfe6e9';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (summonRatio > 0.4) {
        ctx.strokeStyle = isHit ? '#ffffff' : '#fd79a8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(staffX, staffTopY - 6, 7 + orbPulse, 3, frameCount * 0.1, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (e.baseType === 'SHOOTER') {
      const R_m = e.radius;
      const armorBase = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2c3e50');
      const armorDark = isHit ? '#ffffff' : '#1e272e';
      const mechMetal = isHit ? '#ffffff' : '#7f8c8d';
      const visorGlow = isHit ? '#ffffff' : '#00cec9';

      const walkCycle = frameCount * 0.18;
      const legSwingA = Math.sin(walkCycle) * 7;
      const legSwingB = Math.sin(walkCycle + Math.PI) * 7;

      ctx.strokeStyle = mechMetal;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, R_m * 0.2);
      ctx.lineTo(-R_m * 0.45 + legSwingA * 0.4, R_m * 0.65);
      ctx.lineTo(-R_m * 0.5 + legSwingA, R_m * 1.05);
      ctx.stroke();
      ctx.fillStyle = armorDark;
      ctx.fillRect(-R_m * 0.65 + legSwingA, R_m * 1.0, 7, 3);

      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, R_m * 0.2);
      ctx.lineTo(R_m * 0.15 + legSwingB * 0.4, R_m * 0.65);
      ctx.lineTo(R_m * 0.3 + legSwingB, R_m * 1.05);
      ctx.stroke();
      ctx.fillRect(R_m * 0.15 + legSwingB, R_m * 1.0, 7, 3);

      ctx.fillStyle = armorBase;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.6, -R_m * 0.6);
      ctx.lineTo(R_m * 0.4, -R_m * 0.6);
      ctx.lineTo(R_m * 0.65, -R_m * 0.1);
      ctx.lineTo(R_m * 0.35, R_m * 0.45);
      ctx.lineTo(-R_m * 0.55, R_m * 0.45);
      ctx.lineTo(-R_m * 0.75, -R_m * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = armorDark;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = mechMetal;
      ctx.fillRect(-R_m * 0.4, -R_m * 0.4, R_m * 0.7, R_m * 0.4);

      ctx.fillStyle = armorDark;
      ctx.beginPath();
      ctx.ellipse(R_m * 0.2, -R_m * 0.1, R_m * 0.3, R_m * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = visorGlow;
      ctx.fillRect(R_m * 0.1, -R_m * 0.18, R_m * 0.25, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(R_m * 0.25, -R_m * 0.18, 2, 4);

      const isRecoil = (e.shootTimer > 95);
      const recoilX = isRecoil ? -4.5 : 0;

      ctx.fillStyle = armorDark;
      ctx.fillRect(-R_m * 0.2 + recoilX, -R_m * 0.85, R_m * 0.6, R_m * 0.35);

      ctx.fillStyle = mechMetal;
      ctx.fillRect(R_m * 0.4 + recoilX, -R_m * 0.85, R_m * 0.65, 3.5);
      ctx.fillRect(R_m * 0.4 + recoilX, -R_m * 0.65, R_m * 0.65, 3.5);

      if (e.shootTimer > 85) {
        ctx.fillStyle = '#ff7675';
        ctx.fillRect(R_m * 1.05 + recoilX, -R_m * 0.85, 3, 3.5);
        ctx.fillRect(R_m * 1.05 + recoilX, -R_m * 0.65, 3, 3.5);
      }
    } else if (e.baseType === 'STALKER') {
      const R_m = e.radius;
      const isAiming = e.dashState === 'aim';
      const isDashing = e.dashState === 'dashing';

      const stalkerColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4834d4');
      const mistColor = isHit ? '#ffffff' : '#686de0';
      const maskColor = isHit ? '#ffffff' : '#130f40';
      const eyeColor = isHit ? '#ffffff' : '#f9ca24';
      const bladeColor = isAiming ? '#e74c3c' : (isDashing ? '#f1c40f' : '#dff9fb');

      if (isDashing) {
        ctx.fillStyle = 'rgba(72, 52, 212, 0.35)';
        ctx.beginPath();
        ctx.ellipse(-R_m * 1.1, 0, R_m * 0.8, R_m * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const waveA = Math.sin(frameCount * 0.22) * 6;
      const waveB = Math.cos(frameCount * 0.26) * 5;

      ctx.fillStyle = mistColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, -R_m * 0.4);
      ctx.quadraticCurveTo(-R_m * 0.8, -R_m * 0.6 + waveA, -R_m * 1.6 + (isDashing ? -8 : 0), waveA * 0.8);
      ctx.quadraticCurveTo(-R_m * 0.8, R_m * 0.6 + waveB, -R_m * 0.3, R_m * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = stalkerColor;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, -R_m * 0.5);
      ctx.lineTo(R_m * 0.4, 0);
      ctx.lineTo(R_m * 0.2, R_m * 0.5);
      ctx.lineTo(-R_m * 0.5, R_m * 0.35);
      ctx.lineTo(-R_m * 0.6, -R_m * 0.35);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = maskColor;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.65, 0);
      ctx.lineTo(R_m * 0.1, -R_m * 0.45);
      ctx.lineTo(0, 0);
      ctx.lineTo(R_m * 0.1, R_m * 0.45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = eyeColor;
      ctx.fillRect(R_m * 0.2, -R_m * 0.22, 4, 2);
      ctx.fillRect(R_m * 0.2, R_m * 0.12, 4, 2);

      ctx.strokeStyle = isHit ? '#ffffff' : bladeColor;
      ctx.lineWidth = 2.5;

      if (isAiming) {
        ctx.beginPath();
        ctx.moveTo(R_m * 0.1, -R_m * 0.6);
        ctx.lineTo(R_m * 0.85, R_m * 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(R_m * 0.1, R_m * 0.6);
        ctx.lineTo(R_m * 0.85, -R_m * 0.6);
        ctx.stroke();
      } else if (isDashing) {
        ctx.beginPath();
        ctx.moveTo(R_m * 0.3, -R_m * 0.3);
        ctx.quadraticCurveTo(-R_m * 0.4, -R_m * 0.9, -R_m * 1.3, -R_m * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(R_m * 0.3, R_m * 0.3);
        ctx.quadraticCurveTo(-R_m * 0.4, R_m * 0.9, -R_m * 1.3, -R_m * 0.8);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -R_m * 0.4);
        ctx.quadraticCurveTo(R_m * 0.5, -R_m * 0.7, R_m * 0.95, -R_m * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, R_m * 0.4);
        ctx.quadraticCurveTo(R_m * 0.5, R_m * 0.7, R_m * 0.95, -R_m * 0.25);
        ctx.stroke();
      }
    } else if (e.baseType === 'SPLITTER' || e.baseType === 'SPLITTER_MINI') {
      const R_m = e.radius;
      const isMini = e.baseType === 'SPLITTER_MINI';
      const legPairs = isMini ? 2 : 3;

      const shellDark = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#006266');
      const shellLight = isHit ? '#ffffff' : '#009432';
      const jellyColor = isHit ? '#ffffff' : 'rgba(18, 203, 196, 0.55)';
      const eggGlow = isHit ? '#ffffff' : '#c4e538';
      const mandColor = isHit ? '#ffffff' : '#1e272e';

      ctx.strokeStyle = isHit ? '#ffffff' : '#1289a7';
      ctx.lineWidth = isMini ? 1.5 : 2;

      for (let p = 0; p < legPairs; p++) {
        const stepPhase = Math.sin(frameCount * 0.28 + p * 1.5) * (R_m * 0.35);
        const legStartX = -R_m * 0.4 + p * (R_m * 0.45);
        const legSpreadY = R_m * 0.85;

        ctx.beginPath();
        ctx.moveTo(legStartX, -R_m * 0.2);
        ctx.lineTo(legStartX - 2, -legSpreadY + stepPhase);
        ctx.lineTo(legStartX + 3, -legSpreadY * 1.25 + stepPhase);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(legStartX, R_m * 0.2);
        ctx.lineTo(legStartX - 2, legSpreadY + stepPhase);
        ctx.lineTo(legStartX + 3, legSpreadY * 1.25 + stepPhase);
        ctx.stroke();
      }

      ctx.fillStyle = jellyColor;
      ctx.beginPath();
      ctx.ellipse(-R_m * 0.38, 0, R_m * 0.65, R_m * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shellDark;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const eggPulse = Math.sin(frameCount * 0.15) * 1.2;
      ctx.fillStyle = eggGlow;
      const eggCount = isMini ? 2 : 3;
      for (let eg = 0; eg < eggCount; eg++) {
        const egX = -R_m * 0.55 + eg * (R_m * 0.22);
        const egY = Math.sin(frameCount * 0.1 + eg * 2) * (R_m * 0.18);
        ctx.beginPath();
        ctx.arc(egX, egY, Math.max(1, (isMini ? 2.5 : 3.5) + (eg === 0 ? eggPulse : -eggPulse)), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = shellLight;
      ctx.beginPath();
      ctx.ellipse(R_m * 0.15, 0, R_m * 0.45, R_m * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shellDark;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = shellDark;
      ctx.fillRect(0, -R_m * 0.4, 3, R_m * 0.8);
      ctx.fillRect(R_m * 0.25, -R_m * 0.35, 3, R_m * 0.7);

      const pinch = Math.sin(frameCount * 0.2) * 2.5;
      ctx.fillStyle = mandColor;

      ctx.beginPath();
      ctx.moveTo(R_m * 0.5, -R_m * 0.2);
      ctx.quadraticCurveTo(R_m * 0.9, -R_m * 0.35 + pinch, R_m * 0.95, -pinch);
      ctx.lineTo(R_m * 0.5, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(R_m * 0.5, R_m * 0.2);
      ctx.quadraticCurveTo(R_m * 0.9, R_m * 0.35 - pinch, R_m * 0.95, pinch);
      ctx.lineTo(R_m * 0.5, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ff3838';
      ctx.fillRect(R_m * 0.4, -R_m * 0.25, 3, 2.5);
      ctx.fillRect(R_m * 0.4, R_m * 0.12, 3, 2.5);
    } else {
      ctx.fillStyle = baseCol;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Renderiza as animações de morte rápidas e procedurais (8 a 12 frames).
 */
export function drawDyingEnemyShape(de) {
  const t = Math.max(0, Math.min(1, 1 - (de.timer / de.maxTimer)));
  const R = de.radius;

  ctx.save();
  ctx.translate(de.x, de.y);
  ctx.scale(de.facing, 1);
  ctx.globalAlpha = Math.max(0, 1 - t);

  switch (de.baseType) {
    case 'ZOMBIE': {
      const v = de.variant || 0;
      // Tombamento clássico de costas + achatamento vertical de impacto
      ctx.rotate(-t * Math.PI * 0.48);
      ctx.scale(1 + t * 0.15, Math.max(0.06, 1 - t * 0.8));

      let bodyCol = '#3a3d40';
      let skinCol = '#52734d';
      if (v === 1) { bodyCol = '#1e272e'; skinCol = '#4d5d53'; }
      else if (v === 2) { bodyCol = '#808e9b'; skinCol = '#2d5a27'; }
      else if (v === 3) { bodyCol = '#5c1926'; skinCol = '#576574'; }

      // Torso desabando
      ctx.fillStyle = bodyCol;
      ctx.fillRect(-R * 0.5, -R * 0.3, R * 0.75, R * 0.65);

      // Cabeça inclinada
      ctx.fillStyle = skinCol;
      ctx.beginPath();
      ctx.arc(R * 0.18, -R * 0.42, R * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Detalhe de resíduo terminal específico da variante
      if (v === 1) {
        // Chapa de metal soltando micro-faísca
        ctx.fillStyle = '#747d8c';
        ctx.fillRect(R * 0.1, -R * 0.55, 6, 2.5);
        if (t < 0.45) {
          ctx.fillStyle = '#f1c40f';
          ctx.fillRect(R * 0.25 + (Math.random() - 0.5) * 4, -R * 0.6, 2, 2);
        }
      } else if (v === 2) {
        // Pústula tóxica murchando instantaneamente
        const pustuleScale = Math.max(0, 1 - t * 2.2);
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(R * 0.12, -R * 0.5, Math.max(0.5, 2.5 * pustuleScale), 0, Math.PI * 2);
        ctx.fill();
      } else if (v === 3) {
        // Ombreira de ferro se desprendendo lateralmente
        ctx.save();
        ctx.translate(-t * 6, t * 2);
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(-R * 0.7, -R * 0.3, 5, 4);
        ctx.restore();
      }
      break;
    }
    case 'BAT': {
      ctx.translate(0, t * 14);
      ctx.scale(1 + t * 0.5, Math.max(0.05, 1 - t * 0.85));
      ctx.globalAlpha = Math.max(0, 1 - t * 1.3);
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo(-R * 1.4, -R * 0.4);
      ctx.lineTo(0, -R * 0.2);
      ctx.lineTo(R * 1.4, -R * 0.4);
      ctx.lineTo(0, R * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 0.4, R * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'SHIELDED': {
      ctx.save();
      ctx.translate(-t * 9, t * 3);
      ctx.rotate(-t * 0.4);
      ctx.fillStyle = '#4b6584';
      ctx.beginPath();
      ctx.arc(-R * 0.2, 0, R * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(t * 8, t * 5);
      ctx.rotate(t * 0.35);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(R * 0.15, -R * 0.8, R * 0.5, R * 1.6);
      ctx.strokeStyle = '#747d8c';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(R * 0.15, -R * 0.8, R * 0.5, R * 1.6);
      ctx.restore();
      break;
    }
    case 'SHOOTER': {
      if (t < 0.4) ctx.translate((Math.random() - 0.5) * 3.5, 0);
      ctx.scale(1 + t * 0.25, Math.max(0.08, 1 - t * 0.8));
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(-R * 0.6, -R * 0.4, R * 1.2, R * 0.8);
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-R * 0.3, -R * 0.7, R * 0.6, R * 0.4);
      break;
    }
    case 'EXPLODER': {
      ctx.rotate(t * 0.4);
      ctx.scale(1 - t * 0.3, Math.max(0.1, 1 - t * 0.7));
      ctx.fillStyle = '#2c1508';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.arc(-R * 0.3, -R * 0.3, R * (0.5 * (1 - t * 0.7)), 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'NECRO': {
      ctx.scale(1 + t * 0.4, Math.max(0.05, 1 - t * 0.88));
      ctx.fillStyle = '#1e1b2e';
      ctx.beginPath();
      ctx.moveTo(-R * 0.6, R * 0.6);
      ctx.lineTo(0, -R * 0.5);
      ctx.lineTo(R * 0.6, R * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6c5ce7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'GOLEM': {
      ctx.scale(1 + t * 0.35, Math.max(0.1, 1 - t * 0.75));
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.moveTo(-R * 0.8, -R * 0.3);
      ctx.lineTo(R * 0.8, -R * 0.3);
      ctx.lineTo(R * 0.5, R * 0.6);
      ctx.lineTo(-R * 0.5, R * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'STALKER': {
      ctx.scale(Math.max(0.05, 1 - t * 0.8), 1 + t * 1.1);
      ctx.fillStyle = '#4834d4';
      ctx.beginPath();
      ctx.moveTo(0, -R * 1.1);
      ctx.lineTo(R * 0.4, 0);
      ctx.lineTo(0, R * 1.1);
      ctx.lineTo(-R * 0.4, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'SPLITTER':
    case 'SPLITTER_MINI': {
      const burst = t < 0.3 ? (1 + t * 0.9) : Math.max(0.05, 1.27 - (t - 0.3) * 1.8);
      ctx.scale(burst, burst);
      ctx.fillStyle = '#006266';
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 0.65, R * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.scale(1, Math.max(0.05, 1 - t));
      ctx.fillStyle = de.color || '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}