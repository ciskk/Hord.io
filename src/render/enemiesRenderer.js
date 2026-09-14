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
    if (e.eliteMod === 'FROST') aColor = '#74b9ff';
    ctx.strokeStyle = aColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 6 + auraPulse, 0, Math.PI * 2);
    ctx.stroke();

    // Coroa Elemental Flutuante acima da cabeça
    const crownY = -e.radius - 14 + Math.sin(frameCount * 0.15) * 2;
    ctx.save();
    ctx.translate(0, crownY);
    ctx.strokeStyle = aColor;
    ctx.lineWidth = 1.8;
    ctx.fillStyle = aColor;
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(-7, -4);
    ctx.lineTo(-2, -1);
    ctx.lineTo(0, -6);
    ctx.lineTo(2, -1);
    ctx.lineTo(7, -4);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(-1.5, -2, 3, 3);
    ctx.restore();

    if (e.eliteMod === 'FROST') {
      ctx.fillStyle = 'rgba(116, 185, 255, 0.85)';
      for (let cr = 0; cr < 3; cr++) {
        const crA = frameCount * 0.04 + cr * (Math.PI * 2 / 3);
        const crX = Math.cos(crA) * (e.radius + 7);
        const crY = Math.sin(crA) * (e.radius + 7);
        ctx.beginPath();
        ctx.moveTo(crX, crY - 5);
        ctx.lineTo(crX + 3.5, crY);
        ctx.lineTo(crX, crY + 5);
        ctx.lineTo(crX - 3.5, crY);
        ctx.closePath();
        ctx.fill();
      }
    } else if (e.eliteMod === 'TOXIC') {
      ctx.fillStyle = 'rgba(46, 204, 113, 0.75)';
      for (let tb = 0; tb < 4; tb++) {
        const tbA = frameCount * 0.05 + tb * 1.6;
        const tbDist = e.radius + 6 + Math.sin(frameCount * 0.12 + tb) * 3;
        ctx.beginPath();
        ctx.arc(Math.cos(tbA) * tbDist, Math.sin(tbA) * tbDist, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (e.eliteMod === 'HASTE') {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1.6;
      for (let h = 0; h < 3; h++) {
        const hA = frameCount * 0.1 + h * (Math.PI * 2 / 3);
        const hR = e.radius + 5;
        const hx = Math.cos(hA) * hR;
        const hy = Math.sin(hA) * hR;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + 3, hy - 4);
        ctx.lineTo(hx + 1, hy - 2);
        ctx.lineTo(hx + 4, hy - 6);
        ctx.stroke();
      }
    }
  }

  if (e.isMiniBoss) {
    const barW = 64;
    const barH = 6;
    const hpPct = Math.max(0, e.hp / e.maxHp);
    const offsetY = -e.radius - 22;

    ctx.save();
    // 1. Nome Dourado Estilizado do Miniboss
    ctx.font = "bold 9px 'Cinzel', 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = e.enraged ? '#ff4757' : '#f1c40f';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    const bossTitle = (e.enraged ? "⚡ " : "★ ") + (e.name ? e.name.toUpperCase() : "MINIBOSS");
    ctx.fillText(bossTitle, 0, offsetY - 3);
    ctx.shadowBlur = 0;

    // 2. Fundo e Barra de Vida Elite
    ctx.fillStyle = 'rgba(10, 12, 16, 0.9)';
    ctx.fillRect(-barW / 2, offsetY, barW, barH);
    
    // Gradiente de HP: Alaranjado dourado normal ou Vermelho carmesim se enfurecido
    ctx.fillStyle = e.enraged ? '#e74c3c' : (e.isStoneForm ? '#95a5a6' : '#f39c12');
    ctx.fillRect(-barW / 2, offsetY, barW * hpPct, barH);
    
    // Moldura Dourada Metálica
    ctx.strokeStyle = e.enraged ? '#ff6b81' : '#f1c40f';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-barW / 2, offsetY, barW, barH);

    // 3. Barra de Conjuração (Cast Bar) em tempo real durante o WINDUP
    if (e.actionState === 'WINDUP' && e.castProgress !== undefined) {
      const castW = barW - 6;
      const castH = 3.5;
      const castY = offsetY + barH + 3;
      const prog = Math.max(0, Math.min(1, e.castProgress));

      ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
      ctx.fillRect(-castW / 2, castY, castW, castH);
      ctx.fillStyle = '#00cec9';
      ctx.fillRect(-castW / 2, castY, castW * prog, castH);
      ctx.strokeStyle = '#81ecec';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-castW / 2, castY, castW, castH);
    }

    // 4. Anel de Ameaça Rúnico sob o Miniboss
    ctx.strokeStyle = e.enraged ? 'rgba(231, 76, 60, 0.65)' : 'rgba(243, 156, 18, 0.45)';
    ctx.lineWidth = e.enraged ? 2.8 : 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (e.isBoss) {
    drawBoss(ctx, e, frameCount);
  } else if (e.isMiniBoss) {
    drawMiniBossShape(e);
  } else {
    // 1. Sombra Elíptica Projetada no Solo (Drop Shadow 2.5D)
    const isFlying = e.baseType === 'BAT' || e.baseType === 'NECRO';
    const shadowBob = e.baseType === 'BAT' ? Math.sin(frameCount * 0.42) * 2 : 0;
    const shadowY = e.radius * (isFlying ? 0.95 : 0.8) + shadowBob;
    const shadowRx = Math.max(4, e.radius * (isFlying ? 0.7 : 0.85) - shadowBob * 0.5);
    const shadowRy = shadowRx * 0.38;
    ctx.fillStyle = isFlying ? 'rgba(0, 0, 0, 0.22)' : 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, shadowY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1.1 Telegrafia e Alerta de Emergência do Solo (Zumbis, Vermes e Parasitas)
    if (e.emergeTimer > 0) {
      const emergeDuration = e.emergeDuration || 26;
      const progress = Math.max(0, Math.min(1, 1 - (e.emergeTimer / emergeDuration)));
      const groundRadius = e.radius * 1.5;
      const pulseAlert = Math.sin(frameCount * 0.3) * 2;

      ctx.save();
      // Fissuras e solo rompido na terra
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let crack = 0; crack < 6; crack++) {
        const cAng = crack * (Math.PI * 2 / 6) + 0.25;
        const cDist = groundRadius * (0.6 + (crack % 3) * 0.25);
        ctx.moveTo(0, shadowY);
        ctx.lineTo(Math.cos(cAng) * cDist, shadowY + Math.sin(cAng) * (cDist * 0.45));
      }
      ctx.stroke();

      // Círculo de Alerta e Perigo Pulsante no Solo
      ctx.strokeStyle = `rgba(231, 76, 60, ${0.45 + (1 - progress) * 0.5})`;
      ctx.fillStyle = `rgba(231, 76, 60, ${0.14 + (1 - progress) * 0.22})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, shadowY, groundRadius + pulseAlert, (groundRadius + pulseAlert) * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Partículas de poeira/cascalho saltando da fenda
      ctx.fillStyle = '#636e72';
      for (let d = 0; d < 4; d++) {
        const dAng = frameCount * 0.22 + d * 1.57;
        const dDist = groundRadius * 0.75;
        const dHeight = Math.sin(progress * Math.PI) * 11;
        ctx.fillRect(Math.cos(dAng) * dDist - 1.5, shadowY + Math.sin(dAng) * (dDist * 0.4) - dHeight, 3, 3);
      }

      // Indicador de Alerta "!" flutuando sobre a fenda
      if (progress < 0.85) {
        ctx.font = "bold 13px 'Cinzel', 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = '#ff4757';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 4;
        ctx.fillText("!", 0, shadowY - e.radius - 12);
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // Translação física e subida progressiva da criatura para fora da terra
      ctx.translate(0, (1 - progress) * (e.radius * 0.75));
      ctx.scale(1, Math.max(0.25, progress));
    }

    // 2. Telegrafia Melee Intuitiva no Solo (WINDUP Threat Zone)
    if (e.combatState === 'WINDUP') {
      const windupRatio = 1 - (e.attackTimer / (e.attackWindupFrames || 20));
      const threatR = e.radius + (e.attackRange ? e.attackRange * 0.75 : 18);
      ctx.save();

      // Setor de Perigo Preenchido Translúcido no Solo
      ctx.fillStyle = `rgba(255, 71, 87, ${0.15 + windupRatio * 0.25})`;
      ctx.beginPath();
      ctx.moveTo(0, shadowY);
      ctx.arc(0, shadowY, threatR * Math.max(0.2, windupRatio), -Math.PI * 0.42, Math.PI * 0.42);
      ctx.closePath();
      ctx.fill();

      // Borda Externa de Advertência de Impacto
      ctx.strokeStyle = `rgba(255, 71, 87, ${0.6 + windupRatio * 0.4})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, shadowY, threatR, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.stroke();

      // Arco de Carga Ativa
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, shadowY, threatR * Math.max(0.2, windupRatio), -Math.PI * 0.42, Math.PI * 0.42);
      ctx.stroke();

      ctx.restore();
    }

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
      const reach1 = baseReach + (armStrike ? 6 : (armWindup ? -3 : 0));
      const reach2 = baseReach * 0.75 + (armStrike ? 4 : (armWindup ? -2 : 0));
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
      ctx.fillStyle = armWindup ? '#ff4757' : '#dfe4ea';
      ctx.fillRect(R_m * 0.05 + reach1 + 2.5, -R_m * 0.22 + lift1, 1.5, 1.5);
      ctx.fillRect(R_m * 0.05 + reach1 + 2.5, -R_m * 0.22 + lift1 + 2.5, 1.5, 1.5);

      // Efeito Visual de Golpe: Rastro em Arco de Garras (Claw Swipe Ribbon)
      if (armStrike) {
        ctx.save();
        const clawGrad = ctx.createLinearGradient(R_m * 0.6, -R_m * 0.7, R_m * 1.6, R_m * 0.7);
        clawGrad.addColorStop(0, 'rgba(255, 71, 87, 0.9)');
        clawGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.95)');
        clawGrad.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.strokeStyle = clawGrad;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(R_m * 0.3, 0, R_m * 1.25, -Math.PI * 0.38, Math.PI * 0.38);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 234, 167, 0.8)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(R_m * 0.35, 0, R_m * 1.4, -Math.PI * 0.28, Math.PI * 0.28);
        ctx.stroke();
        ctx.restore();
      }

    } else if (e.baseType === 'BAT') {
      const R_m = e.radius;
      const isBatWindup = e.combatState === 'WINDUP';
      const isBatStrike = e.combatState === 'STRIKE';
      const wingCycle = Math.sin(frameCount * (isBatStrike ? 0.65 : 0.42));
      const wingY = wingCycle * (isBatWindup ? 4 : 7.5);
      const batBody = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e1b2e');
      const membrane = isHit ? '#ffffff' : '#a31d1d';

      if (isBatWindup) {
        ctx.rotate(0.22); // Inclinação predadora de rasante
      }

      // 1. Membranas das Asas Translúcidas com Degradê
      ctx.fillStyle = membrane;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.2, 0);
      ctx.lineTo(-R_m * 1.6, -R_m * 0.9 + wingY);
      ctx.quadraticCurveTo(-R_m * 1.1, R_m * 0.15 + wingY * 0.5, -R_m * 0.35, R_m * 0.45);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, 0);
      ctx.lineTo(R_m * 1.6, -R_m * 0.9 + wingY);
      ctx.quadraticCurveTo(R_m * 1.1, R_m * 0.15 + wingY * 0.5, R_m * 0.35, R_m * 0.45);
      ctx.closePath();
      ctx.fill();

      // 2. Esqueleto e Nervuras Alares (Estilo Gótico Pontiagudo)
      ctx.strokeStyle = isHit ? '#ffffff' : '#ff4757';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -R_m * 0.25);
      ctx.lineTo(-R_m * 1.6, -R_m * 0.9 + wingY);
      ctx.lineTo(-R_m * 1.1, -R_m * 0.3 + wingY * 0.6);
      ctx.moveTo(0, -R_m * 0.25);
      ctx.lineTo(R_m * 1.6, -R_m * 0.9 + wingY);
      ctx.lineTo(R_m * 1.1, -R_m * 0.3 + wingY * 0.6);
      ctx.stroke();

      // Garras nas pontas das asas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-R_m * 1.65, -R_m * 0.95 + wingY, 2, 2);
      ctx.fillRect(R_m * 1.6, -R_m * 0.95 + wingY, 2, 2);

      // 3. Tronco e Cabeça
      ctx.fillStyle = batBody;
      ctx.beginPath();
      ctx.ellipse(0, 0, R_m * 0.48, R_m * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();

      // Orelhas pontudas
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.5);
      ctx.lineTo(-R_m * 0.55, -R_m * 1.15);
      ctx.lineTo(-R_m * 0.15, -R_m * 0.65);
      ctx.moveTo(R_m * 0.35, -R_m * 0.5);
      ctx.lineTo(R_m * 0.55, -R_m * 1.15);
      ctx.lineTo(R_m * 0.15, -R_m * 0.65);
      ctx.fill();

      // 4. Olhos e Presas Vampíricas
      const batEyeGlow = (isBatWindup || isBatStrike) ? '#ffffff' : '#ff1744';
      ctx.fillStyle = batEyeGlow;
      ctx.fillRect(-R_m * 0.25, -R_m * 0.3, 2.5, 2.5);
      ctx.fillRect(R_m * 0.05, -R_m * 0.3, 2.5, 2.5);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-R_m * 0.18, R_m * 0.1, 1.5, 2.5);
      ctx.fillRect(R_m * 0.06, R_m * 0.1, 1.5, 2.5);

      // Ondas Ultrassônicas no STRIKE
      if (isBatStrike) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.85)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(R_m * 0.6, 0, R_m * 0.75, -0.65, 0.65);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(R_m * 1.0, 0, R_m * 1.15, -0.55, 0.55);
        ctx.stroke();
        ctx.restore();
      }

    } else if (e.baseType === 'SHIELDED') {
      const R_m = e.radius;
      const walk = Math.sin(frameCount * 0.14) * 2;
      const isShieldWindup = e.combatState === 'WINDUP';
      const isShieldStrike = e.combatState === 'STRIKE';
      const spearReach = isShieldStrike ? (R_m * 1.7) : (isShieldWindup ? (R_m * 0.4) : (R_m * 0.9));

      const plateCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#34495e');
      const metalDark = isHit ? '#ffffff' : '#1e272e';
      const shieldGold = isHit ? '#ffffff' : '#f1c40f';

      // 1. Pernas Encouraçadas e Botas Pesadas
      ctx.fillStyle = metalDark;
      ctx.fillRect(-R_m * 0.45, R_m * 0.35 + walk, 4, R_m * 0.6);
      ctx.fillRect(-R_m * 0.15, R_m * 0.35 - walk, 4, R_m * 0.6);

      // 2. Tronco e Ombreira Traseira
      ctx.fillStyle = plateCol;
      ctx.beginPath();
      ctx.arc(-R_m * 0.25, walk, R_m * 0.68, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = metalDark;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ombreira metálica reforçada com rebite
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-R_m * 0.75, -R_m * 0.4 + walk, R_m * 0.45, 5);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-R_m * 0.55, -R_m * 0.35 + walk, 2, 2);

      // Elmo Fechado e Fresta de Visão Tática
      ctx.fillStyle = isShieldWindup ? '#f1c40f' : '#e74c3c';
      ctx.fillRect(-R_m * 0.1, -3 + walk, 4.5, 2.5);

      // 3. Haste da Lança de Falange
      ctx.strokeStyle = isHit ? '#ffffff' : '#dfe4ea';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.25 + walk);
      ctx.lineTo(spearReach, -R_m * 0.65 + walk);
      ctx.stroke();

      // Ponta Triangular Afiada de Lança
      ctx.fillStyle = isShieldStrike ? '#ffffff' : '#bdc3c7';
      ctx.beginPath();
      ctx.moveTo(spearReach + 9, -R_m * 0.65 + walk);
      ctx.lineTo(spearReach - 4, -R_m * 0.85 + walk);
      ctx.lineTo(spearReach - 4, -R_m * 0.45 + walk);
      ctx.closePath();
      ctx.fill();

      // Efeito de Energia e Faíscas no STRIKE
      if (isShieldStrike) {
        ctx.save();
        ctx.strokeStyle = '#00cec9';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(spearReach + 5, -R_m * 0.65 + walk);
        ctx.lineTo(spearReach + 18, -R_m * 0.65 + walk);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(spearReach + 10, -R_m * 0.75 + walk, 3, 3);
        ctx.restore();
      }

      // 4. Escudo Torre Pesado (Tower Shield) com Brasão Gótico
      const shX = R_m * 0.15;
      const shY = -R_m * 0.95 + walk;
      const shW = R_m * 0.58;
      const shH = R_m * 1.9;

      ctx.fillStyle = metalDark;
      ctx.fillRect(shX, shY, shW, shH);
      ctx.strokeStyle = isHit ? '#ffffff' : '#7f8c8d';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(shX, shY, shW, shH);

      // Cruz Dourada em Relevo
      ctx.fillStyle = shieldGold;
      ctx.fillRect(shX + shW * 0.36, shY + 3, 3.5, shH - 6);
      ctx.fillRect(shX + 2, shY + shH * 0.42, shW - 4, 3.5);

      // Rebites Prateados Reforçados nos 4 Cantos
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(shX + 2, shY + 2, 2.5, 2.5);
      ctx.fillRect(shX + shW - 4.5, shY + 2, 2.5, 2.5);
      ctx.fillRect(shX + 2, shY + shH - 4.5, 2.5, 2.5);
      ctx.fillRect(shX + shW - 4.5, shY + shH - 4.5, 2.5, 2.5);

      // Clarão de Barreira de Força quando Bloqueia Projétil
      if (e.shieldBlockFlash > 0) {
        e.shieldBlockFlash--;
        ctx.save();
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(shX + shW * 0.5, shY + shH * 0.5, shH * 0.65, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 210, 211, 0.35)';
        ctx.fill();
        ctx.restore();
      }
    } else if (e.baseType === 'GOLEM') {
      const R_m = e.radius;
      const isGolemWindup = e.combatState === 'WINDUP';
      const isGolemStrike = e.combatState === 'STRIKE';
      const missingHpRatio = Math.max(0, 1 - (e.hp / (e.maxHp || 1)));

      const stoneDark = isHit ? '#ffffff' : '#1e272e';
      const stoneMid = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#3d4a5d');
      const stoneLight = isHit ? '#ffffff' : '#576574';
      const runeGlow = isHit ? '#ffffff' : (missingHpRatio > 0.5 ? '#ff4757' : (isGolemWindup ? '#ff3838' : '#f39c12'));
      const lavaColor = isHit ? '#ffffff' : (missingHpRatio > 0.5 ? '#ffffff' : '#e67e22');

      // 1. Pernas de Rocha Ponderosas
      const stepCycle = Math.sin(frameCount * 0.1);
      ctx.fillStyle = stoneDark;
      ctx.fillRect(-R_m * 0.68, R_m * 0.5 + stepCycle * 2.5, R_m * 0.48, R_m * 0.52);
      ctx.fillRect(R_m * 0.2, R_m * 0.5 - stepCycle * 2.5, R_m * 0.48, R_m * 0.52);

      // 2. Torso Monolítico de Obsidiana e Concreto
      ctx.fillStyle = stoneMid;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.88, -R_m * 0.42);
      ctx.lineTo(R_m * 0.88, -R_m * 0.46);
      ctx.lineTo(R_m * 0.58, R_m * 0.62);
      ctx.lineTo(-R_m * 0.58, R_m * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Vergalhões de Ferro Retorcido nos Ombros (Aço Industrial)
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.72, -R_m * 0.42);
      ctx.lineTo(-R_m * 0.98, -R_m * 0.82);
      ctx.lineTo(-R_m * 0.88, -R_m * 0.95);
      ctx.moveTo(-R_m * 0.55, -R_m * 0.42);
      ctx.lineTo(-R_m * 0.68, -R_m * 0.78);
      ctx.moveTo(R_m * 0.72, -R_m * 0.42);
      ctx.lineTo(R_m * 0.98, -R_m * 0.82);
      ctx.lineTo(R_m * 0.88, -R_m * 0.95);
      ctx.stroke();

      // Placas Frontais de Rocha Angular
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

      // Fissuras de Magma Tectônico e Runas Pulsantes
      const crackPulse = (Math.sin(frameCount * 0.12) + 1) * 0.5;
      ctx.strokeStyle = (crackPulse > 0.4 || isGolemWindup) ? runeGlow : lavaColor;
      ctx.lineWidth = 2.4 + missingHpRatio * 2.5;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.1, -R_m * 0.3);
      ctx.lineTo(R_m * 0.15, -R_m * 0.05);
      ctx.lineTo(-R_m * 0.05, R_m * 0.2);
      ctx.lineTo(R_m * 0.2, R_m * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(R_m * 0.15, -R_m * 0.05);
      ctx.lineTo(R_m * 0.42, 0);
      ctx.stroke();

      if (missingHpRatio > 0.35) {
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.5, -R_m * 0.1);
        ctx.lineTo(-R_m * 0.2, R_m * 0.1);
        ctx.moveTo(R_m * 0.2, R_m * 0.1);
        ctx.lineTo(R_m * 0.6, R_m * 0.3);
        ctx.stroke();
      }

      // 3. Cabeça Encaixada no Peito com Olhos Incandescentes
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

      ctx.fillStyle = isGolemWindup ? '#ff2222' : runeGlow;
      ctx.fillRect(-R_m * 0.2, -R_m * 0.55, R_m * 0.4, 3.8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-R_m * 0.06, -R_m * 0.55, R_m * 0.16, 3.8);

      // 4. Punhos Gravitacionais com Fragmentos Orbitais
      const fistBob = Math.sin(frameCount * 0.1) * (R_m * 0.25);
      const f1Y = isGolemWindup ? (-R_m * 0.65) : (isGolemStrike ? (R_m * 0.5) : (fistBob + 2));
      const f1X = isGolemWindup ? (-R_m * 0.45) : (isGolemStrike ? (R_m * 1.05) : (-R_m * 1.1));
      const f2Y = isGolemWindup ? (-R_m * 0.55) : (isGolemStrike ? (R_m * 0.5) : (-fistBob + 2));
      const f2X = isGolemWindup ? (R_m * 0.65) : (isGolemStrike ? (R_m * 1.25) : (R_m * 1.1));

      ctx.fillStyle = stoneMid;
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.arc(f1X, f1Y, R_m * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(f2X, f2Y, R_m * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fragmentos de rocha gravitacionais orbitando os punhos
      ctx.fillStyle = stoneLight;
      for (let df = 0; df < 3; df++) {
        const dfa = frameCount * 0.12 + df * (Math.PI * 2 / 3);
        const dfx = f2X + Math.cos(dfa) * (R_m * 0.55);
        const dfy = f2Y + Math.sin(dfa) * (R_m * 0.55);
        ctx.fillRect(dfx - 2, dfy - 2, 4, 4);
      }

      // Impacto Sísmico de Golpe no STRIKE
      if (isGolemStrike) {
        ctx.save();
        ctx.strokeStyle = 'rgba(230, 126, 34, 0.95)';
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.ellipse(R_m * 1.15, R_m * 0.5, R_m * 0.95, R_m * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(243, 156, 18, 0.45)';
        ctx.fill();

        // Estilhaços de pedra e terra ejetados
        ctx.fillStyle = '#778ca3';
        for (let sp = 0; sp < 5; sp++) {
          const spA = sp * (Math.PI / 2.5) + frameCount * 0.2;
          ctx.fillRect(R_m * 1.15 + Math.cos(spA) * 18 - 2, R_m * 0.5 + Math.sin(spA) * 9 - 2, 4.5, 4.5);
        }
        ctx.restore();
      }

    } else if (e.baseType === 'EXPLODER') {
      const R_m = e.radius;
      const isFuse = e.fuseState === 'FUSE';
      const fuseRatio = isFuse ? Math.min(1, Math.max(0, 1 - (e.fuseTimer || 0) / 36)) : 0;
      const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
      const urgency = Math.min(1, Math.max(0, 1 - distToPlayer / 260));
      const pulseSpeed = 0.12 + (isFuse ? 0.45 : urgency * 0.35);
      const pustulePulse = Math.sin(frameCount * pulseSpeed) * (2.5 + (isFuse ? 6 : urgency * 4));
      const heatPhase = (Math.sin(frameCount * pulseSpeed) + 1) * 0.5;

      const fleshColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#261105');
      const fleshDark = isHit ? '#ffffff' : '#120702';

      // 1. Superaquecimento e Erupção da Pústula de Magma
      let pustuleOuter = '#c0392b';
      let pustuleInner = '#e67e22';
      let coreSpark = '#ffffff';

      if (isFuse) {
        if (fuseRatio > 0.75) {
          pustuleOuter = '#ffffff';
          pustuleInner = '#f1c40f';
          coreSpark = '#ffffff';
        } else if (fuseRatio > 0.4) {
          pustuleOuter = '#f1c40f';
          pustuleInner = '#e67e22';
          coreSpark = '#ffffff';
        } else {
          pustuleOuter = '#e67e22';
          pustuleInner = '#c0392b';
        }
      } else if (heatPhase > 0.4) {
        pustuleOuter = '#e67e22';
        pustuleInner = heatPhase > 0.6 ? '#f1c40f' : '#e67e22';
      }

      if (isHit) {
        pustuleOuter = '#ffffff';
        pustuleInner = '#ffffff';
      }

      // Pernas finas e carbonizadas
      const legWalk = Math.sin(frameCount * 0.25) * 6;
      ctx.strokeStyle = fleshDark;
      ctx.lineWidth = 3.2;
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

      // Pústula Magmática Gigante
      const pustuleR = (R_m * (isFuse ? 0.98 : 0.78)) + pustulePulse;
      ctx.fillStyle = pustuleOuter;
      ctx.beginPath();
      ctx.arc(-R_m * 0.45, -R_m * 0.4, pustuleR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pustuleInner;
      ctx.beginPath();
      ctx.arc(-R_m * 0.45, -R_m * 0.4, pustuleR * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = coreSpark;
      ctx.beginPath();
      ctx.arc(-R_m * 0.55, -R_m * 0.5, pustuleR * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Fumaça negra e fagulhas que sobem da pústula
      const sparkCount = isFuse ? 4 : 1;
      for (let sk = 0; sk < sparkCount; sk++) {
        const smY = -R_m * 0.8 - Math.random() * 10;
        const smX = -R_m * 0.45 + (Math.random() - 0.5) * 8;
        ctx.fillStyle = Math.random() < 0.5 ? 'rgba(30, 39, 46, 0.6)' : (isFuse ? '#ffffff' : '#f1c40f');
        ctx.fillRect(smX, smY, isFuse ? 3 : 2, isFuse ? 3 : 2);
      }

      // Torso Corcunda de Obsidiana e Pele Queimada
      ctx.fillStyle = fleshColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.4, -R_m * 0.1);
      ctx.quadraticCurveTo(R_m * 0.1, -R_m * 0.7, R_m * 0.45, -R_m * 0.2);
      ctx.lineTo(R_m * 0.2, R_m * 0.45);
      ctx.lineTo(-R_m * 0.3, R_m * 0.3);
      ctx.closePath();
      ctx.fill();

      // Fissuras térmicas no peito
      ctx.strokeStyle = isFuse ? '#ffffff' : '#e67e22';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.15, 0);
      ctx.lineTo(R_m * 0.1, R_m * 0.2);
      ctx.lineTo(R_m * 0.25, R_m * 0.1);
      ctx.stroke();

      // Cabeça Deformada e Mandíbula Aberta
      ctx.fillStyle = fleshDark;
      ctx.beginPath();
      ctx.arc(R_m * 0.6, -R_m * 0.1, R_m * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isFuse ? '#ffffff' : '#f1c40f';
      ctx.fillRect(R_m * 0.7, -R_m * 0.2, 3, 2.5);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(R_m * 0.65, 0, 4, 2.5);

      // Braço Longo com Garras de Carvão
      const armSway = Math.sin(frameCount * 0.2) * 3;
      ctx.strokeStyle = fleshColor;
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.15, -R_m * 0.1);
      ctx.lineTo(R_m * 0.45 + armSway, R_m * 0.5);
      ctx.lineTo(R_m * 0.62 + armSway, R_m * 0.92);
      ctx.stroke();

      ctx.strokeStyle = '#050201';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.62 + armSway, R_m * 0.92);
      ctx.lineTo(R_m * 0.78 + armSway, R_m * 1.08);
      ctx.moveTo(R_m * 0.56 + armSway, R_m * 0.92);
      ctx.lineTo(R_m * 0.68 + armSway, R_m * 1.12);
      ctx.stroke();

    } else if (e.baseType === 'NECRO') {
      const R_m = e.radius;
      const hover = Math.sin(frameCount * 0.08) * 3.5;
      const wave1 = Math.sin(frameCount * 0.14) * 4;
      const wave2 = Math.cos(frameCount * 0.16) * 4;

      const robeColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#171424');
      const trimColor = isHit ? '#ffffff' : '#6c5ce7';
      const innerVoid = isHit ? '#ffffff' : '#090810';
      const eyeColor = isHit ? '#ffffff' : '#00cec9';

      // 1. Névoa Sombria do Vazio sob o Manto
      ctx.fillStyle = 'rgba(26, 10, 40, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, R_m * 0.85 + hover, R_m * 0.8, R_m * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Manto Espectral Ondulante Rasgado
      ctx.fillStyle = robeColor;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, -R_m * 0.6 + hover);
      ctx.lineTo(R_m * 0.7, R_m * 0.7 + hover);
      ctx.quadraticCurveTo(R_m * 0.3 + wave2, R_m * 1.0 + hover, 0, R_m * 0.78 + hover);
      ctx.quadraticCurveTo(-R_m * 0.3 + wave1, R_m * 1.0 + hover, -R_m * 0.7, R_m * 0.7 + hover);
      ctx.lineTo(-R_m * 0.3, -R_m * 0.6 + hover);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = trimColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = trimColor;
      ctx.fillRect(-2, -R_m * 0.2 + hover, 4, R_m * 0.85);

      // 3. Capuz com Chifres Espectrais
      ctx.fillStyle = robeColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.52, -R_m * 0.75 + hover);
      ctx.lineTo(-R_m * 0.2, -R_m * 1.35 + hover);
      ctx.lineTo(R_m * 0.48, -R_m * 0.5 + hover);
      ctx.lineTo(R_m * 0.2, -R_m * 0.25 + hover);
      ctx.lineTo(-R_m * 0.4, -R_m * 0.3 + hover);
      ctx.closePath();
      ctx.fill();

      // Chifres sombrios na crista do capuz
      ctx.strokeStyle = '#2c0c3e';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.2, -R_m * 1.05 + hover);
      ctx.quadraticCurveTo(-R_m * 0.6, -R_m * 1.45 + hover, -R_m * 0.8, -R_m * 1.15 + hover);
      ctx.moveTo(R_m * 0.1, -R_m * 1.05 + hover);
      ctx.quadraticCurveTo(R_m * 0.5, -R_m * 1.45 + hover, R_m * 0.7, -R_m * 1.15 + hover);
      ctx.stroke();

      // Vazio Interior e Olhos Cianos Espectrais
      ctx.fillStyle = innerVoid;
      ctx.beginPath();
      ctx.ellipse(R_m * 0.1, -R_m * 0.45 + hover, R_m * 0.32, R_m * 0.25, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = eyeColor;
      ctx.fillRect(R_m * 0.04, -R_m * 0.52 + hover, 3.8, 2.2);
      ctx.fillRect(R_m * 0.22, -R_m * 0.48 + hover, 3.8, 2.2);

      // 4. Cajado com Crânio Rúnico
      const staffX = R_m * 0.88;
      const staffTopY = -R_m * 1.15 + hover;
      const staffBotY = R_m * 0.85 + hover;

      ctx.strokeStyle = isHit ? '#ffffff' : '#576574';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(staffX - 2, staffBotY);
      ctx.lineTo(staffX + 2, 0 + hover);
      ctx.lineTo(staffX, staffTopY);
      ctx.stroke();

      // Crânio no topo do cajado
      ctx.fillStyle = isHit ? '#ffffff' : '#dfe4ea';
      ctx.beginPath();
      ctx.arc(staffX, staffTopY - 4, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e082b';
      ctx.fillRect(staffX - 2, staffTopY - 5, 1.8, 1.8);
      ctx.fillRect(staffX + 1, staffTopY - 5, 1.8, 1.8);

      const summonRatio = Math.min(1, Math.max(0, (e.summonTimer || 0) / 230));
      const orbPulse = Math.sin(frameCount * (0.15 + summonRatio * 0.35)) * (2 + summonRatio * 4);
      const orbColor = summonRatio > 0.75 ? '#ff4757' : '#a29bfe';

      // Orbe de Chama Violeta
      ctx.fillStyle = isHit ? '#ffffff' : orbColor;
      ctx.beginPath();
      ctx.arc(staffX, staffTopY - 11, Math.max(2, 5 + orbPulse), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isHit ? '#ffffff' : '#dfe6e9';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (summonRatio > 0.25) {
        // Pentagrama / Glifos Arcanos de Invocação no Solo
        ctx.save();
        const circlePulse = Math.sin(frameCount * 0.2) * 1.5;
        const cX = R_m * 1.2;
        const cY = R_m * 0.9 + hover;
        ctx.strokeStyle = `rgba(155, 89, 182, ${0.45 + summonRatio * 0.55})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cX, cY, R_m * 1.1 + circlePulse, R_m * 0.48 + circlePulse * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Linhas cabalísticas rotativas
        const rotGlyph = frameCount * 0.05;
        ctx.strokeStyle = `rgba(0, 206, 201, ${0.4 + summonRatio * 0.5})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let g = 0; g < 5; g++) {
          const ga = rotGlyph + g * (Math.PI * 2 / 5);
          const gx = cX + Math.cos(ga) * (R_m * 0.9);
          const gy = cY + Math.sin(ga) * (R_m * 0.4);
          if (g === 0) ctx.moveTo(gx, gy);
          else ctx.lineTo(gx, gy);
        }
        ctx.closePath();
        ctx.stroke();

        // Raio de Canalização Mística entre o Crânio do Cajado e o Solo
        if (summonRatio > 0.65) {
          ctx.strokeStyle = '#fd79a8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(staffX, staffTopY - 11);
          ctx.lineTo(cX, cY - 4);
          ctx.stroke();
        }
        ctx.restore();
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

      // 1. Pernas Mecânicas Hidráulicas
      ctx.strokeStyle = mechMetal;
      ctx.lineWidth = 3.2;

      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, R_m * 0.2);
      ctx.lineTo(-R_m * 0.45 + legSwingA * 0.4, R_m * 0.65);
      ctx.lineTo(-R_m * 0.5 + legSwingA, R_m * 1.05);
      ctx.stroke();
      ctx.fillStyle = armorDark;
      ctx.fillRect(-R_m * 0.68 + legSwingA, R_m * 1.0, 7.5, 3.5);

      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, R_m * 0.2);
      ctx.lineTo(R_m * 0.15 + legSwingB * 0.4, R_m * 0.65);
      ctx.lineTo(R_m * 0.3 + legSwingB, R_m * 1.05);
      ctx.stroke();
      ctx.fillRect(R_m * 0.15 + legSwingB, R_m * 1.0, 7.5, 3.5);

      // 2. Chassi Blindado com Faixas de Perigo Industriais
      ctx.fillStyle = armorBase;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.65, -R_m * 0.65);
      ctx.lineTo(R_m * 0.45, -R_m * 0.65);
      ctx.lineTo(R_m * 0.7, -R_m * 0.1);
      ctx.lineTo(R_m * 0.35, R_m * 0.45);
      ctx.lineTo(-R_m * 0.55, R_m * 0.45);
      ctx.lineTo(-R_m * 0.8, -R_m * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = armorDark;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Listras Amarelas de Perigo (Hazard Stripes)
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      for (let hz = -R_m; hz <= R_m; hz += 7) {
        ctx.beginPath();
        ctx.moveTo(hz, -R_m);
        ctx.lineTo(hz + 8, R_m);
        ctx.stroke();
      }
      ctx.restore();

      // Placa central de proteção
      ctx.fillStyle = armorDark;
      ctx.fillRect(-R_m * 0.35, -R_m * 0.35, R_m * 0.65, R_m * 0.55);

      // Visor Tático Ciano com Varredura
      ctx.fillStyle = '#050c14';
      ctx.beginPath();
      ctx.ellipse(R_m * 0.2, -R_m * 0.1, R_m * 0.32, R_m * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = visorGlow;
      ctx.fillRect(R_m * 0.08, -R_m * 0.18, R_m * 0.28, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(R_m * 0.25, -R_m * 0.18, 2.5, 4);

      // 3. Escapamentos Traseiros com Fumaça
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R_m * 0.6, -R_m * 0.85, 4, 7);
      ctx.fillRect(-R_m * 0.42, -R_m * 0.85, 4, 7);

      // 4. Metralhadora Rotativa Minigun de 3 Canos no Ombro
      const isBursting = e.burstRemaining > 0;
      const isRecoil = isBursting || (e.shootTimer > 95);
      const recoilX = isRecoil ? -5 : 0;
      const barrelSpin = frameCount * (isBursting ? 0.75 : (e.shootTimer > 90 ? 0.45 : 0.12));

      ctx.fillStyle = armorDark;
      ctx.fillRect(-R_m * 0.2 + recoilX, -R_m * 0.88, R_m * 0.65, R_m * 0.38);

      const barrelHeat = (isBursting || e.shootTimer > 110) ? '#ff4757' : mechMetal;
      ctx.fillStyle = barrelHeat;
      for (let bIdx = 0; bIdx < 3; bIdx++) {
        const bOff = Math.sin(barrelSpin + bIdx * (Math.PI * 2 / 3)) * 3.5;
        ctx.fillRect(R_m * 0.45 + recoilX, -R_m * 0.78 + bOff, R_m * 0.7, 2.5);
      }

      // Linha Laser Telegrafada de Mira Pré-Disparo com Retículo
      if (e.shootTimer > 105 && !isBursting) {
        const laserAlpha = Math.min(0.9, (e.shootTimer - 105) / 38);
        ctx.save();
        ctx.strokeStyle = `rgba(255, 71, 87, ${laserAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(R_m * 1.15 + recoilX, -R_m * 0.78);
        ctx.lineTo(R_m * 4.2, -R_m * 0.78);
        ctx.stroke();
        ctx.setLineDash([]);
        // Ponto de impacto no solo
        ctx.fillStyle = `rgba(255, 71, 87, ${laserAlpha * 0.8})`;
        ctx.fillRect(R_m * 4.2 - 2, -R_m * 0.78 - 2, 4, 4);
        ctx.restore();
      }

      // Clarão Estelar de Disparo no Cano (Muzzle Flash)
      if (isBursting || e.shootTimer > 145) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(R_m * 1.2 + recoilX, -R_m * 0.88, 6, 6);
        ctx.fillStyle = '#00cec9';
        ctx.fillRect(R_m * 1.35 + recoilX, -R_m * 0.84, 5, 5);
        ctx.restore();
      }

    } else if (e.baseType === 'STALKER') {
      const R_m = e.radius;
      const isAiming = e.dashState === 'aim';
      const isDashing = e.dashState === 'dashing';
      const isStalkerStrike = e.combatState === 'STRIKE';

      const stalkerColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#3c2a99');
      const mistColor = isHit ? '#ffffff' : '#5742c7';
      const maskColor = isHit ? '#ffffff' : '#0c0728';
      const eyeColor = isAiming ? '#ff3838' : (isHit ? '#ffffff' : '#f9ca24');
      const bladeColor = isAiming ? '#e74c3c' : (isDashing ? '#00cec9' : '#a29bfe');

      // 1. Rastro Fantasma de Distorção (Ghost Trail)
      ctx.save();
      ctx.globalAlpha = isDashing ? 0.45 : (isAiming ? 0.35 : 0.2);
      ctx.fillStyle = mistColor;
      const ghostOffset = isDashing ? -12 : (isAiming ? -6 : -3);
      ctx.beginPath();
      ctx.ellipse(ghostOffset, 0, R_m * 0.9, R_m * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Manto de Fumaça e Cauda Etérea Ondulante
      const waveA = Math.sin(frameCount * 0.22) * 6;
      const waveB = Math.cos(frameCount * 0.26) * 5;

      ctx.fillStyle = mistColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, -R_m * 0.4);
      ctx.quadraticCurveTo(-R_m * 0.8, -R_m * 0.6 + waveA, -R_m * 1.7 + (isDashing ? -10 : 0), waveA * 0.8);
      ctx.quadraticCurveTo(-R_m * 0.8, R_m * 0.6 + waveB, -R_m * 0.3, R_m * 0.4);
      ctx.closePath();
      ctx.fill();

      // Corpo Sombrio
      ctx.fillStyle = stalkerColor;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, -R_m * 0.5);
      ctx.lineTo(R_m * 0.42, 0);
      ctx.lineTo(R_m * 0.2, R_m * 0.5);
      ctx.lineTo(-R_m * 0.5, R_m * 0.35);
      ctx.lineTo(-R_m * 0.6, -R_m * 0.35);
      ctx.closePath();
      ctx.fill();

      // 3. Máscara Cerimonial com Fissura Sombria
      ctx.fillStyle = maskColor;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.68, 0);
      ctx.lineTo(R_m * 0.1, -R_m * 0.48);
      ctx.lineTo(0, 0);
      ctx.lineTo(R_m * 0.1, R_m * 0.48);
      ctx.closePath();
      ctx.fill();

      // Detalhe de porcelana quebrada na máscara
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.65, 0);
      ctx.lineTo(R_m * 0.35, -R_m * 0.2);
      ctx.stroke();

      ctx.fillStyle = eyeColor;
      ctx.fillRect(R_m * 0.2, -R_m * 0.22, 4.2, 2.2);
      ctx.fillRect(R_m * 0.2, R_m * 0.12, 4.2, 2.2);

      // 4. Lâminas Gêmeas de Plasma Energético
      ctx.strokeStyle = isHit ? '#ffffff' : bladeColor;
      ctx.lineWidth = 2.8;

      if (isAiming) {
        ctx.beginPath();
        ctx.moveTo(R_m * 0.1, -R_m * 0.65);
        ctx.lineTo(R_m * 0.95, R_m * 0.65);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(R_m * 0.1, R_m * 0.65);
        ctx.lineTo(R_m * 0.95, -R_m * 0.65);
        ctx.stroke();
      } else if (isDashing) {
        ctx.beginPath();
        ctx.moveTo(R_m * 0.3, -R_m * 0.3);
        ctx.quadraticCurveTo(-R_m * 0.4, -R_m * 0.9, -R_m * 1.4, -R_m * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(R_m * 0.3, R_m * 0.3);
        ctx.quadraticCurveTo(-R_m * 0.4, R_m * 0.9, -R_m * 1.4, -R_m * 0.8);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -R_m * 0.4);
        ctx.quadraticCurveTo(R_m * 0.5, -R_m * 0.75, R_m * 1.0, -R_m * 0.25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, R_m * 0.4);
        ctx.quadraticCurveTo(R_m * 0.5, R_m * 0.75, R_m * 1.0, -R_m * 0.25);
        ctx.stroke();
      }

      // Efeito de Corte em Cruz Duplo no STRIKE
      if (isStalkerStrike) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 206, 201, 0.95)';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(R_m * 0.3, -R_m * 0.9);
        ctx.lineTo(R_m * 1.5, R_m * 0.9);
        ctx.moveTo(R_m * 0.3, R_m * 0.9);
        ctx.lineTo(R_m * 1.5, -R_m * 0.9);
        ctx.stroke();
        ctx.restore();
      }

    } else if (e.baseType === 'SPLITTER' || e.baseType === 'SPLITTER_MINI') {
      const R_m = e.radius;
      const isMini = e.baseType === 'SPLITTER_MINI';
      const isSplitterStrike = e.combatState === 'STRIKE';
      const isSplitterWindup = e.combatState === 'WINDUP';

      if (isMini) {
        // === VISUAL DA CÉLULA PARASITA (Larva Invertebrada Amorfa) ===
        const wormCycle = Math.sin(frameCount * 0.3) * 3.5;
        const larvaColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#00b894');
        const coreJelly = isHit ? '#ffffff' : '#55efc4';

        // Cauda ondulante
        ctx.strokeStyle = isHit ? '#ffffff' : '#00a884';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.4, 0);
        ctx.quadraticCurveTo(-R_m * 0.9, wormCycle, -R_m * 1.4, wormCycle * 0.7);
        ctx.stroke();

        // Corpo amorfo em gomos gelatinosos
        ctx.fillStyle = larvaColor;
        ctx.beginPath();
        ctx.ellipse(-R_m * 0.25, 0, R_m * 0.55, R_m * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(R_m * 0.25, 0, R_m * 0.45, R_m * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo bioluminescente verde-neon
        ctx.fillStyle = coreJelly;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Olhinhos vermelhos frontais
        ctx.fillStyle = '#ff3838';
        ctx.fillRect(R_m * 0.45, -2, 2.2, 2);
        ctx.fillRect(R_m * 0.45, 1, 2.2, 2);

        // Patinhas rastejantes curtas
        ctx.strokeStyle = '#00a884';
        ctx.lineWidth = 1.6;
        for (let lp = 0; lp < 2; lp++) {
          const lpx = -R_m * 0.2 + lp * (R_m * 0.4);
          const lpy = Math.sin(frameCount * 0.35 + lp * 2) * 2;
          ctx.beginPath();
          ctx.moveTo(lpx, -R_m * 0.35);
          ctx.lineTo(lpx - 2, -R_m * 0.75 + lpy);
          ctx.moveTo(lpx, R_m * 0.35);
          ctx.lineTo(lpx - 2, R_m * 0.75 - lpy);
          ctx.stroke();
        }
      } else {
        // === VISUAL DO PARASITA DIVISOR ADULTO (Artrópode Quitinosa com Ovos) ===
        const legPairs = 3;
        const shellDark = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#004d40');
        const shellLight = isHit ? '#ffffff' : '#00796b';
        const jellyColor = isHit ? '#ffffff' : 'rgba(0, 206, 201, 0.45)';
        const eggGlow = isHit ? '#ffffff' : '#c4e538';
        const mandColor = isHit ? '#ffffff' : '#1e272e';

        // 1. Pernas Articuladas com Passo Rastejante
        ctx.strokeStyle = isHit ? '#ffffff' : '#00695c';
        ctx.lineWidth = 2.2;

        for (let p = 0; p < legPairs; p++) {
          const stepPhase = Math.sin(frameCount * 0.28 + p * 1.5) * (R_m * 0.35);
          const legStartX = -R_m * 0.4 + p * (R_m * 0.45);
          const legSpreadY = R_m * 0.88;

          ctx.beginPath();
          ctx.moveTo(legStartX, -R_m * 0.2);
          ctx.lineTo(legStartX - 3, -legSpreadY + stepPhase);
          ctx.lineTo(legStartX + 3, -legSpreadY * 1.25 + stepPhase);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(legStartX, R_m * 0.2);
          ctx.lineTo(legStartX - 3, legSpreadY + stepPhase);
          ctx.lineTo(legStartX + 3, legSpreadY * 1.25 + stepPhase);
          ctx.stroke();
        }

        // 2. Abdômen Translúcido com Ovos Bioluminescentes
        ctx.fillStyle = jellyColor;
        ctx.beginPath();
        ctx.ellipse(-R_m * 0.38, 0, R_m * 0.68, R_m * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = shellDark;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        const eggPulse = Math.sin(frameCount * 0.15) * 1.4;
        ctx.fillStyle = eggGlow;
        for (let eg = 0; eg < 3; eg++) {
          const egX = -R_m * 0.55 + eg * (R_m * 0.22);
          const egY = Math.sin(frameCount * 0.1 + eg * 2) * (R_m * 0.18);
          ctx.beginPath();
          ctx.arc(egX, egY, Math.max(1, 3.5 + (eg === 0 ? eggPulse : -eggPulse)), 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Cefalotórax de Quitina Rígida
        ctx.fillStyle = shellLight;
        ctx.beginPath();
        ctx.ellipse(R_m * 0.15, 0, R_m * 0.48, R_m * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = shellDark;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = shellDark;
        ctx.fillRect(0, -R_m * 0.42, 3, R_m * 0.84);
        ctx.fillRect(R_m * 0.25, -R_m * 0.36, 3, R_m * 0.72);

        // 4. Mandíbulas Articuladas que Gotejam Ácido
        const pinch = isSplitterWindup ? 5.5 : (Math.sin(frameCount * 0.2) * 2.5);
        ctx.fillStyle = mandColor;

        ctx.beginPath();
        ctx.moveTo(R_m * 0.5, -R_m * 0.2);
        ctx.quadraticCurveTo(R_m * 0.92, -R_m * 0.38 + pinch, R_m * 1.0, -pinch);
        ctx.lineTo(R_m * 0.5, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(R_m * 0.5, R_m * 0.2);
        ctx.quadraticCurveTo(R_m * 0.92, R_m * 0.38 - pinch, R_m * 1.0, pinch);
        ctx.lineTo(R_m * 0.5, 0);
        ctx.closePath();
        ctx.fill();

        // Olhos facetados de aranha
        ctx.fillStyle = '#ff3838';
        ctx.fillRect(R_m * 0.4, -R_m * 0.28, 3, 2.5);
        ctx.fillRect(R_m * 0.4, R_m * 0.14, 3, 2.5);

        // Gotejamento de Ácido das Mandíbulas
        const dripY = (frameCount * 0.2) % 6;
        ctx.fillStyle = '#00cec9';
        ctx.fillRect(R_m * 0.9, -1 + dripY, 2, 2.5);

        // Mordida Cáustica e Gotas no STRIKE
        if (isSplitterStrike) {
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 210, 211, 0.95)';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(R_m * 0.75, 0, R_m * 0.7, -0.65, 0.65);
          ctx.stroke();

          ctx.fillStyle = '#2ecc71';
          ctx.fillRect(R_m * 1.1, -3, 3.5, 3.5);
          ctx.fillRect(R_m * 1.2, 2, 3, 3);
          ctx.restore();
        }
      }
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
      const burst = t < 0.3 ? (1 + t * 1.4) : Math.max(0.05, 1.42 - (t - 0.3) * 1.8);
      ctx.scale(burst, burst);
      ctx.fillStyle = '#006266';
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 0.65, R * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ruptura do Abdômen e Respingos de Lodo Ácido
      ctx.fillStyle = '#00d2d3';
      for (let sl = 0; sl < 4; sl++) {
        const sa = sl * (Math.PI / 2) + t * 2;
        const sDist = R * (0.6 + t * 1.2);
        ctx.beginPath();
        ctx.arc(Math.cos(sa) * sDist, Math.sin(sa) * sDist, Math.max(1, 3.5 * (1 - t)), 0, Math.PI * 2);
        ctx.fill();
      }
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