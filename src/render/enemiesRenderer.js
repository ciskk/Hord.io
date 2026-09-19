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
import { drawMiniBossShape, drawDyingMiniBossShape } from './minibossesRenderer.js';

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
      // =========================================================================
      // 1. MORCEGO CARMESIM - Gárgula-quiróptero esquelética com asas bi-articuladas
      // =========================================================================
      const R_m = e.radius;
      const isBatWindup = e.combatState === 'WINDUP';
      const isBatStrike = e.combatState === 'STRIKE';
      const wingCycle = Math.sin(frameCount * (isBatStrike ? 0.68 : 0.42));
      const wingY = wingCycle * (isBatWindup ? 5.5 : 9.5);
      const isHit = e.hitFlash > 0;

      const batFlesh = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1a111a');
      const batBone = isHit ? '#ffffff' : '#3d1620';
      const membraneColor = isHit ? '#ffffff' : '#780c18';
      const membraneTorn = isHit ? '#ffffff' : '#4a0810';
      const clawColor = isHit ? '#ffffff' : '#dfe4ea';

      if (isBatWindup) {
        ctx.rotate(0.24); // Postura predatória de rasante inclinado
      }

      // 1. Patas Traseiras Atrofiadas Recolhidas com Garras em Foice
      ctx.strokeStyle = batBone;
      ctx.lineWidth = 1.8;
      for (let leg = -1; leg <= 1; leg += 2) {
        const lx = leg * (R_m * 0.28);
        const ly = R_m * 0.38;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + leg * 2, ly + R_m * 0.4);
        ctx.lineTo(lx + leg * 4.5, ly + R_m * 0.28);
        ctx.stroke();

        ctx.fillStyle = clawColor;
        ctx.beginPath();
        ctx.arc(lx + leg * 4.5, ly + R_m * 0.28, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Asas Bi-Articuladas com 4 Falanges Alongadas e Membranas Rasgadas
      for (let side = -1; side <= 1; side += 2) {
        const shoulderX = side * (R_m * 0.22);
        const shoulderY = -R_m * 0.15;
        const elbowX = side * (R_m * 0.85);
        const elbowY = -R_m * 0.65 + wingY * 0.45;
        const wristX = side * (R_m * 1.55);
        const wristY = -R_m * 1.1 + wingY;

        // Falanges estendidas da asa
        const f1X = side * (R_m * 2.15);
        const f1Y = -R_m * 0.95 + wingY * 1.15;
        const f2X = side * (R_m * 1.95);
        const f2Y = -R_m * 0.28 + wingY * 0.85;
        const f3X = side * (R_m * 1.45);
        const f3Y = R_m * 0.35 + wingY * 0.6;
        const f4X = side * (R_m * 0.88);
        const f4Y = R_m * 0.62 + wingY * 0.35;

        // Membrana Alar Gótica com Recortes Parabólicos Rasgados
        ctx.fillStyle = membraneColor;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(wristX, wristY);
        ctx.lineTo(f1X, f1Y);
        ctx.quadraticCurveTo(side * (R_m * 1.95), -R_m * 0.55 + wingY, f2X, f2Y);
        ctx.quadraticCurveTo(side * (R_m * 1.6), R_m * 0.05 + wingY * 0.7, f3X, f3Y);
        ctx.quadraticCurveTo(side * (R_m * 1.1), R_m * 0.45 + wingY * 0.45, f4X, f4Y);
        ctx.quadraticCurveTo(side * (R_m * 0.4), R_m * 0.45, side * (R_m * 0.15), R_m * 0.35);
        ctx.closePath();
        ctx.fill();

        // Camada de Sombra das Membranas Rasgadas
        ctx.fillStyle = membraneTorn;
        ctx.beginPath();
        ctx.moveTo(f1X, f1Y);
        ctx.quadraticCurveTo(side * (R_m * 1.85), -R_m * 0.65 + wingY, f2X, f2Y);
        ctx.lineTo(f2X - side * 2, f2Y - 3);
        ctx.closePath();
        ctx.fill();

        // Nervuras e Falanges Ósseas
        ctx.strokeStyle = batBone;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(wristX, wristY);
        ctx.lineTo(f1X, f1Y);
        ctx.moveTo(wristX, wristY);
        ctx.lineTo(f2X, f2Y);
        ctx.moveTo(wristX, wristY);
        ctx.lineTo(f3X, f3Y);
        ctx.moveTo(wristX, wristY);
        ctx.lineTo(f4X, f4Y);
        ctx.stroke();

        // Veias Escuras Ramificadas na Asa
        ctx.strokeStyle = isHit ? '#ffffff' : '#3d080e';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(side * (R_m * 1.25), -R_m * 0.25 + wingY * 0.65);
        ctx.lineTo(side * (R_m * 1.55), -R_m * 0.15 + wingY * 0.75);
        ctx.stroke();

        // Garra do Polegar no Pulso
        ctx.fillStyle = clawColor;
        ctx.beginPath();
        ctx.moveTo(wristX, wristY);
        ctx.lineTo(wristX + side * 3.5, wristY - 3.5);
        ctx.lineTo(wristX + side * 1.2, wristY + 1.2);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Tronco Esquelético com Caixa Torácica Marcada
      ctx.fillStyle = batFlesh;
      ctx.beginPath();
      ctx.moveTo(0, -R_m * 0.45);
      ctx.quadraticCurveTo(R_m * 0.38, 0, R_m * 0.22, R_m * 0.48);
      ctx.lineTo(-R_m * 0.22, R_m * 0.48);
      ctx.quadraticCurveTo(-R_m * 0.38, 0, 0, -R_m * 0.45);
      ctx.closePath();
      ctx.fill();

      // Costelas Esqueléticas Salientes
      ctx.strokeStyle = isHit ? '#ffffff' : '#2b131e';
      ctx.lineWidth = 1.2;
      for (let r = 0; r < 3; r++) {
        const ry = -R_m * 0.2 + r * (R_m * 0.18);
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.22, ry);
        ctx.lineTo(R_m * 0.22, ry);
        ctx.stroke();
      }

      // 4. Cabeça, Focinho com Pregas Nasais e Orelhas com Tragus
      const headY = -R_m * 0.48;
      ctx.fillStyle = batFlesh;
      ctx.beginPath();
      ctx.ellipse(0, headY, R_m * 0.42, R_m * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Orelhas Góticas Pontudas com Recorte Interno (Tragus)
      for (let ear = -1; ear <= 1; ear += 2) {
        ctx.fillStyle = batFlesh;
        ctx.beginPath();
        ctx.moveTo(ear * (R_m * 0.2), headY - R_m * 0.15);
        ctx.lineTo(ear * (R_m * 0.58), headY - R_m * 0.95);
        ctx.lineTo(ear * (R_m * 0.42), headY - R_m * 0.45);
        ctx.lineTo(ear * (R_m * 0.08), headY - R_m * 0.25);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isHit ? '#ffffff' : '#52121d';
        ctx.beginPath();
        ctx.moveTo(ear * (R_m * 0.25), headY - R_m * 0.25);
        ctx.lineTo(ear * (R_m * 0.48), headY - R_m * 0.75);
        ctx.lineTo(ear * (R_m * 0.35), headY - R_m * 0.4);
        ctx.closePath();
        ctx.fill();
      }

      // Focinho de Morcego-Vampiro em Ferradura
      ctx.fillStyle = isHit ? '#ffffff' : '#2c0c16';
      ctx.beginPath();
      ctx.arc(0, headY - 1, 3.2, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();

      // Olhos Rubis Incandescentes
      ctx.fillStyle = (isBatWindup || isBatStrike) ? '#ffffff' : '#ff1744';
      ctx.fillRect(-R_m * 0.22, headY - 3, 3, 2.5);
      ctx.fillRect(R_m * 0.06, headY - 3, 3, 2.5);

      // Boca Aberta e Presas Longas Curvadas para Baixo
      ctx.fillStyle = '#080104';
      ctx.fillRect(-R_m * 0.2, headY + 3, R_m * 0.4, 3.2);

      ctx.fillStyle = clawColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.18, headY + 3);
      ctx.lineTo(-R_m * 0.14, headY + 8);
      ctx.lineTo(-R_m * 0.08, headY + 3);
      ctx.moveTo(R_m * 0.08, headY + 3);
      ctx.lineTo(R_m * 0.14, headY + 8);
      ctx.lineTo(R_m * 0.18, headY + 3);
      ctx.fill();

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
      // =========================================================================
      // 2. GUARDIÃO BLINDADO - Legionário em armadura de placas e pavês com ameia
      // =========================================================================
      const R_m = e.radius;
      const walk = Math.sin(frameCount * 0.14) * 2;
      const isShieldWindup = e.combatState === 'WINDUP';
      const isShieldStrike = e.combatState === 'STRIKE';
      const spearReach = isShieldStrike ? (R_m * 1.75) : (isShieldWindup ? (R_m * 0.35) : (R_m * 0.95));
      const isHit = e.hitFlash > 0;

      const steelDark = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e272e');
      const steelPlate = isHit ? '#ffffff' : '#34495e';
      const mailColor = isHit ? '#ffffff' : '#2c3e50';
      const brassTrim = isHit ? '#ffffff' : '#d4af37';
      const woodOak = isHit ? '#ffffff' : '#3b2314';

      // 1. Pernas com Grevas de Placas e Sabatons Articulados
      ctx.fillStyle = steelDark;
      ctx.fillRect(-R_m * 0.52, R_m * 0.35 + walk, 4.5, R_m * 0.65);
      ctx.fillRect(-R_m * 0.18, R_m * 0.35 - walk, 4.5, R_m * 0.65);

      // Joelheiras pontiagudas (Poleyns)
      ctx.fillStyle = steelPlate;
      ctx.fillRect(-R_m * 0.56, R_m * 0.55 + walk, 5.5, 3.5);
      ctx.fillRect(-R_m * 0.22, R_m * 0.55 - walk, 5.5, 3.5);

      // 2. Saia de Cota de Malha sob a Couraça
      ctx.fillStyle = mailColor;
      ctx.fillRect(-R_m * 0.55, R_m * 0.15 + walk, R_m * 0.65, R_m * 0.35);
      ctx.strokeStyle = '#4b6584';
      ctx.lineWidth = 1;
      for (let m = 0; m < 3; m++) {
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.55, R_m * 0.22 + m * 4 + walk);
        ctx.lineTo(R_m * 0.1, R_m * 0.22 + m * 4 + walk);
        ctx.stroke();
      }

      // 3. Couraça Gótica com Vinco Central (Tapul)
      ctx.fillStyle = steelPlate;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.55, -R_m * 0.45 + walk);
      ctx.lineTo(R_m * 0.12, -R_m * 0.45 + walk);
      ctx.lineTo(R_m * 0.18, walk);
      ctx.lineTo(0, R_m * 0.28 + walk);
      ctx.lineTo(-R_m * 0.55, R_m * 0.28 + walk);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = steelDark;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Vinco longitudinal da armadura
      ctx.strokeStyle = '#576574';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.18, -R_m * 0.45 + walk);
      ctx.lineTo(-R_m * 0.08, R_m * 0.28 + walk);
      ctx.stroke();

      // 4. Ombreira Esquerda Hipertrofiada Laminada (Spaulder)
      ctx.fillStyle = steelDark;
      ctx.fillRect(-R_m * 0.82, -R_m * 0.55 + walk, R_m * 0.48, 6.5);
      ctx.fillRect(-R_m * 0.78, -R_m * 0.45 + walk, R_m * 0.42, 5.5);
      ctx.fillRect(-R_m * 0.72, -R_m * 0.36 + walk, R_m * 0.35, 4.5);
      ctx.strokeStyle = brassTrim;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-R_m * 0.82, -R_m * 0.55 + walk, R_m * 0.48, 6.5);

      // 5. Elmo Bacinete com Viseira Bico de Pardal (Hounskull)
      ctx.fillStyle = steelPlate;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.25, -R_m * 0.48 + walk);
      ctx.lineTo(R_m * 0.12, -R_m * 0.48 + walk);
      ctx.lineTo(R_m * 0.28, -R_m * 0.18 + walk); // Bico cônico pontiagudo
      ctx.lineTo(R_m * 0.05, 0 + walk);
      ctx.lineTo(-R_m * 0.25, 0 + walk);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = steelDark;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Orifícios de respiração perfurados no bico
      ctx.fillStyle = '#111111';
      ctx.fillRect(R_m * 0.15, -R_m * 0.18 + walk, 1.8, 1.8);
      ctx.fillRect(R_m * 0.2, -R_m * 0.14 + walk, 1.8, 1.8);

      // Fresta de visão sombria
      ctx.fillStyle = isShieldWindup ? '#f1c40f' : '#ff4757';
      ctx.fillRect(-R_m * 0.08, -R_m * 0.32 + walk, 5.5, 2.2);

      // 6. Alabarda / Lança de Guarda Pesada com Aletas Laterais
      ctx.strokeStyle = isHit ? '#ffffff' : '#8c7b75';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, -R_m * 0.2 + walk);
      ctx.lineTo(spearReach, -R_m * 0.72 + walk);
      ctx.stroke();

      // Lâmina de corte e ponta com aletas transversais
      ctx.fillStyle = isShieldStrike ? '#ffffff' : '#bdc3c7';
      ctx.beginPath();
      ctx.moveTo(spearReach + 12, -R_m * 0.72 + walk);
      ctx.lineTo(spearReach - 4, -R_m * 0.95 + walk);
      ctx.lineTo(spearReach - 1, -R_m * 0.72 + walk);
      ctx.lineTo(spearReach - 4, -R_m * 0.48 + walk);
      ctx.closePath();
      ctx.fill();

      // Aleta transversal (barbela)
      ctx.strokeStyle = brassTrim;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(spearReach - 2, -R_m * 0.95 + walk);
      ctx.lineTo(spearReach - 2, -R_m * 0.48 + walk);
      ctx.stroke();

      // 7. Pavês de Cerco (Tower Shield) com Textura de Carvalho e Ameia
      const shX = R_m * 0.18;
      const shY = -R_m * 0.98 + walk;
      const shW = R_m * 0.62;
      const shH = R_m * 1.95;

      // Pranchas de carvalho
      ctx.fillStyle = woodOak;
      ctx.fillRect(shX, shY, shW, shH);

      // Ameia / Recorte superior de mira
      ctx.fillStyle = '#0a0d12';
      ctx.fillRect(shX + shW - 4.5, shY, 4.5, 5.5);

      // Reforço Perimetral de Ferro Forjado
      ctx.strokeStyle = steelDark;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(shX, shY, shW, shH);

      // Cruz de Ferro e Crucifixo de Bronze em Relevo
      ctx.fillStyle = steelPlate;
      ctx.fillRect(shX + shW * 0.35, shY + 3, 4.5, shH - 6);
      ctx.fillRect(shX + 2, shY + shH * 0.4, shW - 4, 4.5);

      ctx.fillStyle = brassTrim;
      ctx.fillRect(shX + shW * 0.4, shY + 6, 2.5, shH - 12);
      ctx.fillRect(shX + 4, shY + shH * 0.42, shW - 8, 2.5);

      // Rebites Prateados nos Cantos
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(shX + 2, shY + 2, 2.2, 2.2);
      ctx.fillRect(shX + 2, shY + shH - 4.2, 2.2, 2.2);

      // Barreira de Força no Bloqueio
      if (e.shieldBlockFlash > 0) {
        e.shieldBlockFlash--;
        ctx.save();
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(shX + shW * 0.5, shY + shH * 0.5, shH * 0.65, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 210, 211, 0.35)';
        ctx.fill();
        ctx.restore();
      }

    } else if (e.baseType === 'GOLEM') {
      // =========================================================================
      // 3. GOLEM DE CONCRETO - Monólito de cantaria sobreposta e ossário imperial
      // =========================================================================
      const R_m = e.radius;
      const isGolemWindup = e.combatState === 'WINDUP';
      const isGolemStrike = e.combatState === 'STRIKE';
      const missingHpRatio = Math.max(0, 1 - (e.hp / (e.maxHp || 1)));
      const isHit = e.hitFlash > 0;

      const stoneBase = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2d3436');
      const stoneLight = isHit ? '#ffffff' : '#576574';
      const stoneDark = isHit ? '#ffffff' : '#1e272e';
      const rebarIron = isHit ? '#ffffff' : '#7f8c8d';
      const skullColor = isHit ? '#ffffff' : '#dfe4ea';
      const runeGlow = isHit ? '#ffffff' : (missingHpRatio > 0.5 ? '#ff4757' : (isGolemWindup ? '#ff3838' : '#f39c12'));

      // 1. Pilares de Sustentação Inferiores (Pernas de Alvenaria)
      const stepCycle = Math.sin(frameCount * 0.1);
      ctx.fillStyle = stoneBase;
      ctx.fillRect(-R_m * 0.72, R_m * 0.45 + stepCycle * 2.5, R_m * 0.5, R_m * 0.58);
      ctx.fillRect(R_m * 0.22, R_m * 0.45 - stepCycle * 2.5, R_m * 0.5, R_m * 0.58);
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(-R_m * 0.72, R_m * 0.45 + stepCycle * 2.5, R_m * 0.5, R_m * 0.58);
      ctx.strokeRect(R_m * 0.22, R_m * 0.45 - stepCycle * 2.5, R_m * 0.5, R_m * 0.58);

      // Cintas de ferro forjado nas pernas
      ctx.fillStyle = rebarIron;
      ctx.fillRect(-R_m * 0.72, R_m * 0.65 + stepCycle * 2.5, R_m * 0.5, 3);
      ctx.fillRect(R_m * 0.22, R_m * 0.65 - stepCycle * 2.5, R_m * 0.5, 3);

      // 2. Torso Monolítico de Cantaria com Arestas Chanfradas
      ctx.fillStyle = stoneLight;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.95, -R_m * 0.45);
      ctx.lineTo(R_m * 0.95, -R_m * 0.48);
      ctx.lineTo(R_m * 0.65, R_m * 0.62);
      ctx.lineTo(-R_m * 0.65, R_m * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 3.0;
      ctx.stroke();

      // 3. Nicho de Arco Gótico Romano Quebrado no Peito
      ctx.fillStyle = '#0f141a';
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.42, R_m * 0.45);
      ctx.lineTo(-R_m * 0.42, -R_m * 0.15);
      ctx.quadraticCurveTo(0, -R_m * 0.55, R_m * 0.42, -R_m * 0.15);
      ctx.lineTo(R_m * 0.42, R_m * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // 4. Três Crânios Petrificados Engastados no Nicho (O Ossário)
      for (let sk = -1; sk <= 1; sk++) {
        const skX = sk * (R_m * 0.26);
        const skY = (sk === 0 ? -R_m * 0.18 : R_m * 0.08);
        ctx.fillStyle = skullColor;
        ctx.beginPath();
        ctx.arc(skX, skY, 4.2, 0, Math.PI * 2);
        ctx.fill();
        // Órbitas oculares ocas
        ctx.fillStyle = '#111111';
        ctx.fillRect(skX - 2.5, skY - 1.5, 1.8, 1.8);
        ctx.fillRect(skX + 0.7, skY - 1.5, 1.8, 1.8);
      }

      // 5. Vergalhões de Ferro Quadrados em Zigue-Zague e Correntes
      ctx.strokeStyle = rebarIron;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.75, -R_m * 0.45);
      ctx.lineTo(-R_m * 1.05, -R_m * 0.85);
      ctx.lineTo(-R_m * 0.9, -R_m * 1.05);
      ctx.moveTo(R_m * 0.75, -R_m * 0.45);
      ctx.lineTo(R_m * 1.05, -R_m * 0.85);
      ctx.lineTo(R_m * 0.9, -R_m * 1.05);
      ctx.stroke();

      // Elos de correntes nos ombros
      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(-R_m * 0.85, -R_m * 0.55, 6, 0, Math.PI * 2);
      ctx.arc(R_m * 0.85, -R_m * 0.55, 6, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Fissuras Tectônicas e Magma
      const crackPulse = (Math.sin(frameCount * 0.12) + 1) * 0.5;
      ctx.strokeStyle = (crackPulse > 0.4 || isGolemWindup) ? runeGlow : '#d35400';
      ctx.lineWidth = 2.2 + missingHpRatio * 2.5;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.15, -R_m * 0.35);
      ctx.lineTo(R_m * 0.18, -R_m * 0.05);
      ctx.lineTo(-R_m * 0.08, R_m * 0.22);
      ctx.lineTo(R_m * 0.25, R_m * 0.5);
      ctx.stroke();

      // 7. Cabeça de Bloco de Cantaria Encaixada no Peito
      ctx.fillStyle = stoneDark;
      ctx.fillRect(-R_m * 0.28, -R_m * 0.78, R_m * 0.56, R_m * 0.42);
      ctx.strokeStyle = stoneLight;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-R_m * 0.28, -R_m * 0.78, R_m * 0.56, R_m * 0.42);

      // Fenda Visor com Olhos de Fogo
      ctx.fillStyle = isGolemWindup ? '#ff2222' : runeGlow;
      ctx.fillRect(-R_m * 0.2, -R_m * 0.62, R_m * 0.4, 4);

      // 8. Braços Assimétricos: Coluna Romana e Punho de Laje Quadrada
      const fistBob = Math.sin(frameCount * 0.1) * (R_m * 0.22);
      const f1Y = isGolemWindup ? (-R_m * 0.65) : (isGolemStrike ? (R_m * 0.55) : (fistBob + 2));
      const f1X = isGolemWindup ? (-R_m * 0.45) : (isGolemStrike ? (R_m * 1.05) : (-R_m * 1.15));
      const f2Y = isGolemWindup ? (-R_m * 0.55) : (isGolemStrike ? (R_m * 0.55) : (-fistBob + 2));
      const f2X = isGolemWindup ? (R_m * 0.65) : (isGolemStrike ? (R_m * 1.35) : (R_m * 1.15));

      // Braço esquerdo: Coluna canelada
      ctx.fillStyle = stoneBase;
      ctx.fillRect(f1X - 6, f1Y - 12, 12, 24);
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(f1X - 6, f1Y - 12, 12, 24);

      // Braço direito: Laje quadrada de calçamento com rebites
      ctx.fillStyle = stoneLight;
      ctx.fillRect(f2X - 10, f2Y - 10, 20, 20);
      ctx.strokeStyle = stoneDark;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(f2X - 10, f2Y - 10, 20, 20);

      // Pregos de ferro na laje
      ctx.fillStyle = rebarIron;
      ctx.fillRect(f2X - 6, f2Y - 6, 3, 3);
      ctx.fillRect(f2X + 3, f2Y - 6, 3, 3);
      ctx.fillRect(f2X - 6, f2Y + 3, 3, 3);
      ctx.fillRect(f2X + 3, f2Y + 3, 3, 3);

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
        ctx.restore();
      }

    } else if (e.baseType === 'EXPLODER') {
      // =========================================================================
      // 4. CARNIÇAL ÍGNEO - Cobaia de alquimia com fornalha biológica enxertada
      // =========================================================================
      const R_m = e.radius;
      const isFuse = e.fuseState === 'FUSE';
      const fuseRatio = isFuse ? Math.min(1, Math.max(0, 1 - (e.fuseTimer || 0) / 36)) : 0;
      const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
      const urgency = Math.min(1, Math.max(0, 1 - distToPlayer / 260));
      const pulseSpeed = 0.12 + (isFuse ? 0.48 : urgency * 0.35);
      const pustulePulse = Math.sin(frameCount * pulseSpeed) * (2.8 + (isFuse ? 6.5 : urgency * 4));
      const isHit = e.hitFlash > 0;

      const skinCharred = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#140803');
      const skinRot = isHit ? '#ffffff' : '#2e1208';
      const glassColor = 'rgba(230, 126, 34, 0.45)';
      const copperPipe = isHit ? '#ffffff' : '#b87333';
      const strapColor = isHit ? '#ffffff' : '#4a2810';

      // 1. Pernas Carbonizadas com Amarras Arrebentadas
      const legWalk = Math.sin(frameCount * 0.28) * 6;
      ctx.strokeStyle = skinCharred;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, R_m * 0.2);
      ctx.lineTo(-R_m * 0.55 + legWalk, R_m * 0.65);
      ctx.lineTo(-R_m * 0.45 + legWalk, R_m * 1.05);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(R_m * 0.15, R_m * 0.2);
      ctx.lineTo(R_m * 0.05 - legWalk, R_m * 0.65);
      ctx.lineTo(R_m * 0.25 - legWalk, R_m * 1.05);
      ctx.stroke();

      // Tiras de couro arrebentadas pendendo das pernas
      ctx.strokeStyle = strapColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.55 + legWalk, R_m * 0.65);
      ctx.lineTo(-R_m * 0.8 + legWalk, R_m * 0.85);
      ctx.stroke();

      // 2. Torso Humanoide Curvado em 4 Apoios com Costelas Expostas
      ctx.fillStyle = skinRot;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.45, -R_m * 0.1);
      ctx.quadraticCurveTo(R_m * 0.1, -R_m * 0.65, R_m * 0.52, -R_m * 0.18);
      ctx.lineTo(R_m * 0.28, R_m * 0.5);
      ctx.lineTo(-R_m * 0.35, R_m * 0.35);
      ctx.closePath();
      ctx.fill();

      // Costelas queimadas visíveis
      ctx.strokeStyle = '#050201';
      ctx.lineWidth = 1.4;
      for (let cb = 0; cb < 4; cb++) {
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.2 + cb * 3.5, 0);
        ctx.lineTo(-R_m * 0.15 + cb * 3.5, R_m * 0.32);
        ctx.stroke();
      }

      // 3. A Redoma de Vidro Enxertada na Coluna (O Alambique)
      const domeR = (R_m * (isFuse ? 0.95 : 0.76)) + pustulePulse;
      const domeX = -R_m * 0.48;
      const domeY = -R_m * 0.45;

      // Cinta metálica parafusada na coluna
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(domeX - domeR * 0.3, domeY + domeR * 0.6, domeR * 0.6, 5);

      // Vidro da redoma com líquido fervente
      ctx.fillStyle = isFuse ? (fuseRatio > 0.6 ? '#f1c40f' : '#e67e22') : '#d35400';
      ctx.beginPath();
      ctx.arc(domeX, domeY, domeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isFuse ? '#ffffff' : '#f39c12';
      ctx.beginPath();
      ctx.arc(domeX, domeY, domeR * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Reflexo vítreo curvo na redoma
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(domeX, domeY, domeR * 0.85, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();

      // 4. Tubos de Exaustão de Cobre da Nuca à Redoma
      ctx.strokeStyle = copperPipe;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(domeX + domeR * 0.4, domeY - domeR * 0.5);
      ctx.quadraticCurveTo(R_m * 0.15, -R_m * 0.8, R_m * 0.5, -R_m * 0.3);
      ctx.stroke();

      // 5. Cabeça Deformada com Mordaça de Ferro Cospe-Cinzas
      ctx.fillStyle = skinCharred;
      ctx.beginPath();
      ctx.arc(R_m * 0.62, -R_m * 0.12, R_m * 0.36, 0, Math.PI * 2);
      ctx.fill();

      // Mordaça metálica retangular forçando abertura bucal
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(R_m * 0.65, -2, 6, 6);
      ctx.fillStyle = isFuse ? '#ffffff' : '#f1c40f';
      ctx.fillRect(R_m * 0.7, 0, 3, 3); // Brasa dentro da boca

      // Olho vazado incandescente
      ctx.fillStyle = isFuse ? '#ffffff' : '#e74c3c';
      ctx.fillRect(R_m * 0.7, -R_m * 0.22, 3, 2.5);

      // Fagulhas e fuligem subindo no FUSE
      if (isFuse || Math.random() < 0.3) {
        ctx.fillStyle = Math.random() < 0.5 ? '#f1c40f' : '#e74c3c';
        ctx.fillRect(domeX + (Math.random() - 0.5) * 12, domeY - domeR - 4 - Math.random() * 8, 3, 3);
      }

    } else if (e.baseType === 'NECRO') {
      // =========================================================================
      // 5. CULTISTA DAS SOMBRAS - Pontífice herege em paramentos litúrgicos decadentes
      // =========================================================================
      const R_m = e.radius;
      const hover = Math.sin(frameCount * 0.08) * 3.5;
      const waveA = Math.sin(frameCount * 0.14) * 4;
      const waveB = Math.cos(frameCount * 0.16) * 4;
      const isHit = e.hitFlash > 0;

      const cassockColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#100c19');
      const stoleColor = isHit ? '#ffffff' : '#2b103c';
      const goldThread = isHit ? '#ffffff' : '#d4af37';
      const copeColor = isHit ? '#ffffff' : '#1d122b';
      const soulFlame = isHit ? '#ffffff' : '#00cec9';

      // 1. Túnica Talar Longa Interna com Barra Rasgada em Farrapos
      ctx.fillStyle = cassockColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.4 + hover);
      ctx.lineTo(R_m * 0.35, -R_m * 0.4 + hover);
      ctx.lineTo(R_m * 0.65, R_m * 0.85 + hover);
      ctx.quadraticCurveTo(R_m * 0.3 + waveB, R_m * 1.1 + hover, 0, R_m * 0.9 + hover);
      ctx.quadraticCurveTo(-R_m * 0.3 + waveA, R_m * 1.1 + hover, -R_m * 0.65, R_m * 0.85 + hover);
      ctx.closePath();
      ctx.fill();

      // 2. Estola Litúrgica com Cruzes Invertidas e Rosário
      ctx.fillStyle = stoleColor;
      ctx.fillRect(-R_m * 0.18, -R_m * 0.3 + hover, R_m * 0.36, R_m * 1.05);
      ctx.strokeStyle = goldThread;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-R_m * 0.18, -R_m * 0.3 + hover, R_m * 0.36, R_m * 1.05);

      // Cruzes invertidas desenhadas na estola
      ctx.fillStyle = goldThread;
      for (let cr = 0; cr < 2; cr++) {
        const cry = -R_m * 0.1 + cr * (R_m * 0.45) + hover;
        ctx.fillRect(-1.2, cry, 2.4, 7);
        ctx.fillRect(-3.5, cry + 4.5, 7, 2.2);
      }

      // Cinto de corda com rosário de vértebras
      ctx.strokeStyle = '#8c7b75';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.25, R_m * 0.1 + hover);
      ctx.lineTo(R_m * 0.25, R_m * 0.1 + hover);
      ctx.stroke();

      // 3. Manto Pluvial Aberto com Gola Alta Rígida
      ctx.fillStyle = copeColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.55, -R_m * 0.75 + hover);
      ctx.lineTo(-R_m * 0.35, -R_m * 0.4 + hover);
      ctx.lineTo(-R_m * 0.55, R_m * 0.65 + hover);
      ctx.lineTo(-R_m * 0.75, R_m * 0.65 + hover);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(R_m * 0.55, -R_m * 0.75 + hover);
      ctx.lineTo(R_m * 0.35, -R_m * 0.4 + hover);
      ctx.lineTo(R_m * 0.55, R_m * 0.65 + hover);
      ctx.lineTo(R_m * 0.75, R_m * 0.65 + hover);
      ctx.closePath();
      ctx.fill();

      // 4. Mitra Eclesiástica Corrompida com Coroa de Espinhos
      ctx.fillStyle = copeColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.65 + hover);
      ctx.lineTo(0, -R_m * 1.45 + hover); // Ápice pontiagudo da mitra
      ctx.lineTo(R_m * 0.35, -R_m * 0.65 + hover);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = goldThread;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Coroa de espinhos de arame farpado
      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -R_m * 0.85 + hover, R_m * 0.38, -0.3, Math.PI + 0.3);
      ctx.stroke();

      // 5. Véu de Gaze Negra com Olhos de Fogo-Fátuo
      ctx.fillStyle = 'rgba(10, 8, 14, 0.85)';
      ctx.beginPath();
      ctx.arc(0, -R_m * 0.55 + hover, R_m * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = soulFlame;
      ctx.fillRect(-R_m * 0.15, -R_m * 0.58 + hover, 3.5, 2.5);
      ctx.fillRect(R_m * 0.05, -R_m * 0.58 + hover, 3.5, 2.5);

      // 6. Báculo de Vértebras com Relicário de Catedral
      const stX = R_m * 0.82;
      const stTopY = -R_m * 1.25 + hover;
      const stBotY = R_m * 0.9 + hover;

      // Haste vertebral
      ctx.strokeStyle = '#576574';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(stX, stBotY);
      ctx.lineTo(stX, stTopY);
      ctx.stroke();

      // Relicário de catedral em miniatura
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(stX - 5, stTopY - 14, 10, 14);
      ctx.strokeStyle = goldThread;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(stX - 5, stTopY - 14, 10, 14);

      // Coração mumificado em chamas no topo
      const summonRatio = Math.min(1, Math.max(0, (e.summonTimer || 0) / 230));
      ctx.fillStyle = summonRatio > 0.6 ? '#ff4757' : soulFlame;
      ctx.beginPath();
      ctx.arc(stX, stTopY - 7, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Círculo Cabalístico no Solo durante a Invocação
      if (summonRatio > 0.25) {
        ctx.save();
        const cX = R_m * 1.15;
        const cY = R_m * 0.9 + hover;
        ctx.strokeStyle = 'rgba(155, 89, 182, 0.65)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(cX, cY, R_m * 1.1, R_m * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

    } else if (e.baseType === 'SHOOTER') {
      // =========================================================================
      // 6. AUTÔMATO ARTILHEIRO - Torreta de trincheira imperial a vapor em tripé
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const walkCycle = frameCount * 0.18;
      const legA = Math.sin(walkCycle) * 6;
      const legB = Math.sin(walkCycle + Math.PI) * 6;

      const ironCast = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#232b38');
      const ironDark = isHit ? '#ffffff' : '#12171f';
      const brassDetail = isHit ? '#ffffff' : '#d4af37';
      const chromePiston = isHit ? '#ffffff' : '#dfe4ea';

      // 1. Locomoção em Tripé Mecânico (2 Pernas Dianteiras + 1 Escora Traseira)
      // Perna Traseira (Escora de recuo)
      ctx.strokeStyle = ironDark;
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.5, R_m * 0.1);
      ctx.lineTo(-R_m * 0.85, R_m * 0.7);
      ctx.stroke();
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(-R_m * 1.05, R_m * 0.65, 8, 4);

      // Pernas Dianteiras com Pistões Hidráulicos
      ctx.strokeStyle = chromePiston;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.2, R_m * 0.2);
      ctx.lineTo(-R_m * 0.35 + legA * 0.4, R_m * 0.65);
      ctx.lineTo(-R_m * 0.4 + legA, R_m * 1.05);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, R_m * 0.2);
      ctx.lineTo(R_m * 0.15 + legB * 0.4, R_m * 0.65);
      ctx.lineTo(R_m * 0.3 + legB, R_m * 1.05);
      ctx.stroke();

      // Sapatas Circulares de Ancoragem
      ctx.fillStyle = ironDark;
      ctx.fillRect(-R_m * 0.55 + legA, R_m * 1.0, 9, 4);
      ctx.fillRect(R_m * 0.15 + legB, R_m * 1.0, 9, 4);

      // 2. Chassi em Domo de Sino de Ferro com Rebites Hexagonais
      ctx.fillStyle = ironCast;
      ctx.beginPath();
      ctx.arc(0, -R_m * 0.15, R_m * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ironDark;
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Fileira de Rebites Hexagonais na Borda da Caldeira
      ctx.fillStyle = brassDetail;
      for (let rv = 0; rv < 5; rv++) {
        const ra = -Math.PI * 0.75 + rv * 0.38;
        const rx = Math.cos(ra) * (R_m * 0.62);
        const ry = -R_m * 0.15 + Math.sin(ra) * (R_m * 0.62);
        ctx.fillRect(rx - 1.2, ry - 1.2, 2.5, 2.5);
      }

      // Brasão em Relevo da Águia Imperial Corroída no Peito
      ctx.fillStyle = '#1a222d';
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.25, -R_m * 0.2);
      ctx.lineTo(0, -R_m * 0.35);
      ctx.lineTo(R_m * 0.25, -R_m * 0.2);
      ctx.lineTo(R_m * 0.15, R_m * 0.15);
      ctx.lineTo(0, R_m * 0.25);
      ctx.lineTo(-R_m * 0.15, R_m * 0.15);
      ctx.closePath();
      ctx.fill();

      // 3. Fita de Cartuchos de Latão Entrando na Culatra
      ctx.fillStyle = brassDetail;
      for (let bl = 0; bl < 4; bl++) {
        ctx.fillRect(-R_m * 0.1 + bl * 3.5, -R_m * 0.55, 2.5, 5);
      }

      // 4. Canhão Gatling Rotativo de 3 Canos com Boca de Bronze
      const isBursting = e.burstRemaining > 0;
      const isRecoil = isBursting || (e.shootTimer > 95);
      const recoilX = isRecoil ? -6 : 0;
      const barrelSpin = frameCount * (isBursting ? 0.8 : (e.shootTimer > 90 ? 0.45 : 0.1));

      // Bloco da culatra
      ctx.fillStyle = ironDark;
      ctx.fillRect(R_m * 0.2 + recoilX, -R_m * 0.45, R_m * 0.45, R_m * 0.5);

      // 3 Canos com manga de resfriamento perfurada
      for (let bIdx = 0; bIdx < 3; bIdx++) {
        const bOff = Math.sin(barrelSpin + bIdx * (Math.PI * 2 / 3)) * 4.2;
        ctx.fillStyle = isBursting ? '#e74c3c' : '#7f8c8d';
        ctx.fillRect(R_m * 0.65 + recoilX, -R_m * 0.25 + bOff, R_m * 0.75, 2.8);
      }

      // Anel de contenção frontal dos canos
      ctx.fillStyle = brassDetail;
      ctx.fillRect(R_m * 1.35 + recoilX, -R_m * 0.35, 3.5, R_m * 0.4);

      // 5. Chaminé Traseira com Tampa Batente de Escape
      ctx.fillStyle = ironDark;
      ctx.fillRect(-R_m * 0.65, -R_m * 0.95, 6, 12);
      // Tampa articulada oscilante
      const flapper = Math.sin(frameCount * 0.35) * 0.35;
      ctx.save();
      ctx.translate(-R_m * 0.65, -R_m * 0.95);
      ctx.rotate(flapper);
      ctx.fillStyle = brassDetail;
      ctx.fillRect(-2, -2.5, 10, 2.5);
      ctx.restore();

      // Linha Laser de Mira Tática no Solo
      if (e.shootTimer > 105 && !isBursting) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.85)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(R_m * 1.4 + recoilX, -R_m * 0.2);
        ctx.lineTo(R_m * 4.5, -R_m * 0.2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

    } else if (e.baseType === 'STALKER') {
      // =========================================================================
      // 7. ASSASSINO ESPECTRAL - Carrasco em mortalhas de seda e máscara partida
      // =========================================================================
      const R_m = e.radius;
      const isAiming = e.dashState === 'aim';
      const isDashing = e.dashState === 'dashing';
      const isStalkerStrike = e.combatState === 'STRIKE';
      const isHit = e.hitFlash > 0;

      const shroudMain = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#23153c');
      const shroudAccent = isHit ? '#ffffff' : '#4d2b7e';
      const maskWhite = isHit ? '#ffffff' : '#dfe4ea';
      const krisColor = isHit ? '#ffffff' : (isAiming ? '#ff3838' : '#7158e2');

      // 1. Cinco Tiras Verticais de Seda Fúnebre Ondulantes
      for (let s = 0; s < 5; s++) {
        const sPhase = frameCount * 0.2 + s * 0.85;
        const sWave = Math.sin(sPhase) * (5 + (isDashing ? 8 : 0));
        const sX = -R_m * 0.35 - s * 3.5;
        ctx.fillStyle = s % 2 === 0 ? shroudMain : shroudAccent;
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.2, -R_m * 0.35);
        ctx.quadraticCurveTo(sX + sWave, 0, sX - (isDashing ? 14 : 6), R_m * 0.9 + sWave * 0.5);
        ctx.lineTo(sX - 3 - (isDashing ? 14 : 6), R_m * 0.85 + sWave * 0.5);
        ctx.quadraticCurveTo(sX + sWave - 3, 0, -R_m * 0.2, R_m * 0.35);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Torso Envolto em Bandagens de Linho Trançadas
      ctx.fillStyle = '#0f081d';
      ctx.beginPath();
      ctx.ellipse(0, 0, R_m * 0.5, R_m * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bandagens cruzadas
      ctx.strokeStyle = '#63537d';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.25);
      ctx.lineTo(R_m * 0.2, R_m * 0.25);
      ctx.moveTo(-R_m * 0.25, R_m * 0.25);
      ctx.lineTo(R_m * 0.25, -R_m * 0.2);
      ctx.stroke();

      // 3. A Máscara de Porcelana Partida em Diagonal
      const mX = R_m * 0.35;
      const mY = -R_m * 0.05;

      // Metade Direita Oca (Vazio absoluto)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(mX, mY, R_m * 0.4, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();

      // Metade Esquerda Íntegra de Porcelana
      ctx.fillStyle = maskWhite;
      ctx.beginPath();
      ctx.arc(mX, mY, R_m * 0.4, Math.PI * 0.5, Math.PI * 1.5);
      ctx.closePath();
      ctx.fill();

      // Fissura divisória em zigue-zague
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(mX, mY - R_m * 0.4);
      ctx.lineTo(mX - 2, mY);
      ctx.lineTo(mX + 1, mY + R_m * 0.4);
      ctx.stroke();

      // Olho Espectral Brilhante na metade oca
      ctx.fillStyle = isAiming ? '#ff1744' : '#e056fd';
      ctx.fillRect(mX + 3, mY - 2, 3.5, 3.5);

      // 4. Duas Adagas Onduladas (Kris) Empunhadas Invertidas
      for (let d = -1; d <= 1; d += 2) {
        const dy = d * (R_m * 0.45);
        ctx.strokeStyle = krisColor;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(R_m * 0.1, dy);
        ctx.lineTo(R_m * 0.45, dy - d * 3);
        ctx.lineTo(R_m * 0.8, dy + d * 2);
        ctx.lineTo(R_m * 1.15, dy - d * 2);
        ctx.stroke();

        // Tiras de pergaminho flutuando do pomo
        ctx.strokeStyle = '#dfe4ea';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(R_m * 0.1, dy);
        ctx.quadraticCurveTo(-R_m * 0.2, dy + d * 6, -R_m * 0.5, dy + d * 3);
        ctx.stroke();
      }

      // Corte em Cruz no STRIKE
      if (isStalkerStrike) {
        ctx.save();
        ctx.strokeStyle = 'rgba(224, 86, 253, 0.9)';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(R_m * 0.3, -R_m * 0.85);
        ctx.lineTo(R_m * 1.5, R_m * 0.85);
        ctx.moveTo(R_m * 0.3, R_m * 0.85);
        ctx.lineTo(R_m * 1.5, -R_m * 0.85);
        ctx.stroke();
        ctx.restore();
      }

    } else if (e.baseType === 'SPLITTER' || e.baseType === 'SPLITTER_MINI') {
      // =========================================================================
      // 8 & 9. PARASITA DIVISOR & CÉLULA - Carapaça clivada e larva sanguessuga
      // =========================================================================
      const R_m = e.radius;
      const isMini = e.baseType === 'SPLITTER_MINI';
      const isSplitterStrike = e.combatState === 'STRIKE';
      const isHit = e.hitFlash > 0;

      if (isMini) {
        // === 9. PARASITA CÉLULA: Larva sanguessuga anelada com boca circular ===
        const contract = Math.sin(frameCount * 0.32) * 2.5;
        const fleshColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#006266');
        const bellyBlood = isHit ? '#ffffff' : '#8b0000';

        // 5 Anéis Musculares Carnosos (Squash & Stretch)
        for (let ring = 4; ring >= 0; ring--) {
          const rx = -R_m * 0.45 * ring + contract * 0.4;
          const rSize = R_m * (0.85 - ring * 0.12);
          ctx.fillStyle = ring >= 2 ? bellyBlood : fleshColor;
          ctx.beginPath();
          ctx.ellipse(rx, 0, rSize, rSize * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#004d40';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Ventosa Bucal Circular Aberta com Dentes Espirais
        ctx.fillStyle = '#1e0810';
        ctx.beginPath();
        ctx.ellipse(R_m * 0.35, 0, R_m * 0.45, R_m * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3 Espinhos Córneos na Ventosa
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(R_m * 0.32, -4, 2, 2.5);
        ctx.fillRect(R_m * 0.32, 2, 2, 2.5);
        ctx.fillRect(R_m * 0.48, -1, 2.5, 2);

        // Ganchos Ventrais Curtos
        ctx.strokeStyle = '#00a884';
        ctx.lineWidth = 1.5;
        for (let g = 0; g < 3; g++) {
          const gx = -R_m * 0.4 * g;
          ctx.beginPath();
          ctx.moveTo(gx, R_m * 0.4);
          ctx.lineTo(gx - 3, R_m * 0.75);
          ctx.stroke();
        }
      } else {
        // === 8. PARASITA DIVISOR: Carapaça clivada ao meio com sutura de carne ===
        const chitinDark = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#042825');
        const chitinMid = isHit ? '#ffffff' : '#08483f';
        const rawFlesh = isHit ? '#ffffff' : '#b33939';
        const podColor = 'rgba(0, 206, 201, 0.42)';

        // 1. Seis Pernas Artrópodes Articuladas (Coxa, Tíbia, Tarso)
        ctx.strokeStyle = isHit ? '#ffffff' : '#0e6251';
        ctx.lineWidth = 2.4;
        for (let p = 0; p < 3; p++) {
          const stepA = Math.sin(frameCount * 0.24 + p * 1.4) * 6;
          const px = -R_m * 0.35 + p * (R_m * 0.45);
          // Superior
          ctx.beginPath();
          ctx.moveTo(px, -R_m * 0.25);
          ctx.lineTo(px - 4, -R_m * 0.85 + stepA);
          ctx.lineTo(px + 4, -R_m * 1.35 + stepA);
          ctx.stroke();
          // Inferior
          ctx.beginPath();
          ctx.moveTo(px, R_m * 0.25);
          ctx.lineTo(px - 4, R_m * 0.85 - stepA);
          ctx.lineTo(px + 4, R_m * 1.35 - stepA);
          ctx.stroke();
        }

        // 2. Carapaça Bipartida: Placa Superior e Placa Inferior
        // Placa Dorsal Superior
        ctx.fillStyle = chitinMid;
        ctx.beginPath();
        ctx.ellipse(-R_m * 0.2, -R_m * 0.28, R_m * 0.7, R_m * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = chitinDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Placa Dorsal Inferior
        ctx.fillStyle = chitinMid;
        ctx.beginPath();
        ctx.ellipse(-R_m * 0.2, R_m * 0.28, R_m * 0.7, R_m * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3. A Sutura Longitudinal de Clivagem (Carne viva se rasgando ao meio)
        ctx.fillStyle = rawFlesh;
        ctx.fillRect(-R_m * 0.8, -3, R_m * 1.25, 6);

        // Fibras elásticas esticadas cruzando a sutura
        ctx.strokeStyle = '#ff6b81';
        ctx.lineWidth = 1.6;
        for (let f = 0; f < 4; f++) {
          const fx = -R_m * 0.7 + f * (R_m * 0.3);
          ctx.beginPath();
          ctx.moveTo(fx, -4);
          ctx.lineTo(fx + 3, 4);
          ctx.stroke();
        }

        // 4. Casulos de Ninhada no Dorso Traseiro com Silhuetas
        ctx.fillStyle = podColor;
        ctx.beginPath();
        ctx.arc(-R_m * 0.55, -R_m * 0.2, 5, 0, Math.PI * 2);
        ctx.arc(-R_m * 0.55, R_m * 0.2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(-R_m * 0.58, -R_m * 0.22, 2.5, 2.5);
        ctx.fillRect(-R_m * 0.58, R_m * 0.18, 2.5, 2.5);

        // 5. Três Quelíceras Mandibulares Articuladas
        const pinch = Math.sin(frameCount * 0.25) * 3.5;
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.moveTo(R_m * 0.45, -R_m * 0.28);
        ctx.lineTo(R_m * 1.1, -pinch);
        ctx.lineTo(R_m * 0.45, 0);
        ctx.lineTo(R_m * 1.1, pinch);
        ctx.lineTo(R_m * 0.45, R_m * 0.28);
        ctx.closePath();
        ctx.fill();

        // Gota de ácido das quelíceras
        ctx.fillStyle = '#00cec9';
        ctx.fillRect(R_m * 1.05, -1, 2.5, 3.5);
      }

    } else if (e.baseType === 'TRAIL_CRAWLER') {
      // =========================================================================
      // 10. RASTEJADOR PEÇONHENTO - Scolopendra com carapaça laminada e forcípulas
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const shellMain = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#0e5344');
      const shellEdge = isHit ? '#ffffff' : '#1abc9c';
      const venomColor = isHit ? '#ffffff' : '#2ecc71';
      const legColor = isHit ? '#ffffff' : '#072b23';

      // 1. 8 Pares de Pernas de Adaga com Cadência Senoidal
      ctx.strokeStyle = legColor;
      ctx.lineWidth = 2.0;
      for (let p = 0; p < 4; p++) {
        const legWave = Math.sin(frameCount * 0.32 + p * 1.2) * 6;
        const px = -R_m * 0.45 * p;
        // Perna Superior
        ctx.beginPath();
        ctx.moveTo(px, -R_m * 0.45);
        ctx.lineTo(px - 3, -R_m * 0.95 + legWave);
        ctx.lineTo(px + 4, -R_m * 1.35 + legWave);
        ctx.stroke();
        // Perna Inferior
        ctx.beginPath();
        ctx.moveTo(px, R_m * 0.45);
        ctx.lineTo(px - 3, R_m * 0.95 - legWave);
        ctx.lineTo(px + 4, R_m * 1.35 - legWave);
        ctx.stroke();
      }

      // 2. Quatro Placas Dorsais Arqueadas Sobrepostas (Estilo Armadura Samurai)
      for (let s = 3; s >= 0; s--) {
        const segX = -R_m * 0.45 * s;
        const segY = Math.sin(frameCount * 0.25 - s * 0.8) * 2.2;
        const segW = R_m * (0.85 - s * 0.08);
        const segH = R_m * (0.75 - s * 0.06);

        // Placa quitinosa com abas laterais pontiagudas
        ctx.fillStyle = s % 2 === 0 ? shellMain : '#0b3d32';
        ctx.beginPath();
        ctx.moveTo(segX - segW * 0.5, segY - segH);
        ctx.lineTo(segX + segW * 0.65, segY - segH * 0.75);
        ctx.lineTo(segX + segW * 0.8, segY);
        ctx.lineTo(segX + segW * 0.65, segY + segH * 0.75);
        ctx.lineTo(segX - segW * 0.5, segY + segH);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = shellEdge;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Espinho oco central de veneno
        ctx.fillStyle = '#051f19';
        ctx.fillRect(segX - 2, segY - 3, 4, 6);

        // Glândulas de veneno translúcidas nas placas centrais
        if (s === 1 || s === 2) {
          ctx.fillStyle = venomColor;
          ctx.beginPath();
          ctx.arc(segX, segY - segH * 0.65, 3.2, 0, Math.PI * 2);
          ctx.arc(segX, segY + segH * 0.65, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Placa Cefálica Pesada com Forcípulas Gigantescas Serrilhadas
      const headX = R_m * 0.35;
      ctx.fillStyle = '#072b23';
      ctx.beginPath();
      ctx.ellipse(headX, 0, R_m * 0.42, R_m * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();

      // Olhos compostos múltiplos
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(headX + 2, -5, 2.5, 2.5);
      ctx.fillRect(headX + 2, 3, 2.5, 2.5);

      // Grandes pinças venenosas em tesoura (Forcípulas)
      const pinch = Math.sin(frameCount * 0.3) * 4;
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.moveTo(headX + 4, -4);
      ctx.quadraticCurveTo(headX + R_m * 0.9, -R_m * 0.6 + pinch, headX + R_m * 0.85, -pinch);
      ctx.lineTo(headX + 4, -1);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(headX + 4, 4);
      ctx.quadraticCurveTo(headX + R_m * 0.9, R_m * 0.6 - pinch, headX + R_m * 0.85, pinch);
      ctx.lineTo(headX + 4, 1);
      ctx.closePath();
      ctx.fill();

    } else if (e.baseType === 'CRYPT_WEAVER') {
      // =========================================================================
      // 11. TECELÃ DAS CATACUMBAS - Quimera aracnídea fundida a crânio e mortalhas
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const skullBone = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#95a5a6');
      const shroudCloth = isHit ? '#ffffff' : '#3d3d3d';
      const legColor = isHit ? '#ffffff' : '#1e272e';
      const legCycle = Math.sin(frameCount * 0.22);

      // 1. Seis Patas com Fêmures Nodosos e Cerdas Rígidas
      ctx.strokeStyle = legColor;
      ctx.lineWidth = 2.4;
      for (let leg = 0; leg < 3; leg++) {
        const lAngle = (leg - 1) * 0.48;
        const lPhase = (leg % 2 === 0 ? 1 : -1) * legCycle * 4;

        // Pata superior
        ctx.beginPath();
        ctx.moveTo(0, -R_m * 0.25);
        ctx.lineTo(Math.cos(lAngle - 1.2) * (R_m * 0.85), -R_m * 0.75 + lPhase);
        ctx.lineTo(Math.cos(lAngle - 1.2) * (R_m * 1.45), -R_m * 0.45 + lPhase * 0.5);
        ctx.stroke();

        // Cerdas pretas na tíbia
        ctx.fillStyle = '#111111';
        ctx.fillRect(Math.cos(lAngle - 1.2) * (R_m * 0.85) - 1, -R_m * 0.75 + lPhase - 2, 2.5, 4);

        // Pata inferior
        ctx.beginPath();
        ctx.moveTo(0, R_m * 0.25);
        ctx.lineTo(Math.cos(lAngle + 1.2) * (R_m * 0.85), R_m * 0.75 - lPhase);
        ctx.lineTo(Math.cos(lAngle + 1.2) * (R_m * 1.45), R_m * 0.45 - lPhase * 0.5);
        ctx.stroke();
        ctx.fillRect(Math.cos(lAngle + 1.2) * (R_m * 0.85) - 1, R_m * 0.75 - lPhase - 2, 2.5, 4);
      }

      // 2. Abdômen Traseiro Envolto em Tiras de Mortalha Fúnebre
      ctx.fillStyle = shroudCloth;
      ctx.beginPath();
      ctx.ellipse(-R_m * 0.52, 0, R_m * 0.72, R_m * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();

      // Faixas e nós de mortalha
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 1.4;
      for (let sh = 0; sh < 3; sh++) {
        const sx = -R_m * 0.78 + sh * (R_m * 0.28);
        ctx.beginPath();
        ctx.moveTo(sx, -R_m * 0.45);
        ctx.lineTo(sx + 5, R_m * 0.45);
        ctx.stroke();
      }

      // Fiandeiras de espículas ósseas na ponta traseira
      ctx.fillStyle = skullBone;
      ctx.beginPath();
      ctx.moveTo(-R_m * 1.15, -3);
      ctx.lineTo(-R_m * 1.35, 0);
      ctx.lineTo(-R_m * 1.15, 3);
      ctx.closePath();
      ctx.fill();

      // 3. Cefalotórax Esculpido como Crânio Humano Invertido
      const cX = R_m * 0.22;
      ctx.fillStyle = skullBone;
      ctx.beginPath();
      ctx.ellipse(cX, 0, R_m * 0.45, R_m * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Órbitas oculares do crânio com aglomerado de 6 olhos vermelhos
      ctx.fillStyle = '#080808';
      ctx.beginPath();
      ctx.arc(cX + 2, -R_m * 0.18, 4.2, 0, Math.PI * 2);
      ctx.arc(cX + 2, R_m * 0.18, 4.2, 0, Math.PI * 2);
      ctx.fill();

      // Olhos vermelhos no fundo das órbitas
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(cX + 1, -R_m * 0.22, 2.2, 2.2);
      ctx.fillRect(cX + 3, -R_m * 0.14, 2.2, 2.2);
      ctx.fillRect(cX + 1, R_m * 0.14, 2.2, 2.2);
      ctx.fillRect(cX + 3, R_m * 0.22, 2.2, 2.2);

    } else if (e.baseType === 'CHAIN_FLAYER') {
      // =========================================================================
      // 12. FLAGELADOR DE CORRENTES - Algoz inquisitorial com avental e gancho
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const skinPale = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#8c7b75');
      const apronLeather = isHit ? '#ffffff' : '#3b1c1c';
      const bloodStain = isHit ? '#ffffff' : '#5c0000';
      const ironChain = isHit ? '#ffffff' : '#95a5a6';
      const walk = Math.sin(frameCount * 0.18);

      // 1. Ombros Nus e Cicatrizes de Auto-Flagelo
      ctx.fillStyle = skinPale;
      ctx.beginPath();
      ctx.arc(0, -R_m * 0.15 + walk * 0.8, R_m * 0.62, 0, Math.PI * 2);
      ctx.fill();

      // Cicatrizes de açoite nos ombros
      ctx.strokeStyle = '#4a0808';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.4, -R_m * 0.35 + walk);
      ctx.lineTo(-R_m * 0.15, -R_m * 0.1 + walk);
      ctx.moveTo(-R_m * 0.35, -R_m * 0.05 + walk);
      ctx.lineTo(-R_m * 0.1, R_m * 0.15 + walk);
      ctx.stroke();

      // 2. Avental de Açougueiro de Couro Curtido Manchado
      ctx.fillStyle = apronLeather;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.35 + walk * 0.8);
      ctx.lineTo(R_m * 0.35, -R_m * 0.35 + walk * 0.8);
      ctx.lineTo(R_m * 0.55, R_m * 0.75 + walk * 0.8);
      ctx.lineTo(-R_m * 0.55, R_m * 0.75 + walk * 0.8);
      ctx.closePath();
      ctx.fill();

      // Manchas de sangue seco no avental
      ctx.fillStyle = bloodStain;
      ctx.fillRect(-R_m * 0.2, R_m * 0.1 + walk * 0.8, R_m * 0.45, R_m * 0.35);

      // Correias com fivelas de bronze
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.35 + walk * 0.8);
      ctx.lineTo(R_m * 0.35, R_m * 0.3 + walk * 0.8);
      ctx.stroke();

      // 3. Capuz Cego de Inquisição com Placa de Ferro e 3 Pregos
      const hX = R_m * 0.12;
      const hY = -R_m * 0.65 + walk * 1.2;

      ctx.fillStyle = '#1e1616';
      ctx.beginPath();
      ctx.moveTo(hX - R_m * 0.3, hY + R_m * 0.25);
      ctx.lineTo(hX, hY - R_m * 0.65); // Ápice cônico
      ctx.lineTo(hX + R_m * 0.3, hY + R_m * 0.25);
      ctx.closePath();
      ctx.fill();

      // Placa de ferro cegando os olhos
      ctx.fillStyle = '#576574';
      ctx.fillRect(hX - R_m * 0.22, hY - 1, R_m * 0.44, 4.5);

      // Três pregos simbólicos cravados na chapa
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(hX - R_m * 0.14, hY, 2, 2.5);
      ctx.fillRect(hX - 1, hY, 2, 2.5);
      ctx.fillRect(hX + R_m * 0.1, hY, 2, 2.5);

      // 4. Antebraço Envolto em Correntes Pesadas
      const handX = R_m * 0.45;
      const handY = R_m * 0.15 + walk * 1.5;

      ctx.fillStyle = skinPale;
      ctx.fillRect(handX - 4, handY - 4, 8, 8);

      // Voltas de corrente no pulso
      ctx.strokeStyle = ironChain;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(handX - 5, handY - 5, 10, 10);

      // 5. O Mangual: Elos Ovais Entrelaçados e Gancho de Desossa
      const chainRot = frameCount * 0.26;
      ctx.strokeStyle = ironChain;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let c = 0; c < 5; c++) {
        const cAng = chainRot + c * 0.45;
        const cDist = 9 + c * 4.2;
        const linkX = handX + Math.cos(cAng) * cDist;
        const linkY = handY + Math.sin(cAng) * (cDist * 0.6);
        if (c === 0) ctx.moveTo(handX, handY);
        ctx.lineTo(linkX, linkY);
      }
      ctx.stroke();

      // Lâmina de Gancho de Desossa Triangular Denteada
      const tipAng = chainRot + 4 * 0.45;
      const tipDist = 30;
      const tipX = handX + Math.cos(tipAng) * tipDist;
      const tipY = handY + Math.sin(tipAng) * (tipDist * 0.6);

      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(tipAng + Math.PI * 0.5);

      // Corpo do gancho de aço forjado
      ctx.fillStyle = '#dfe4ea';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 6);
      ctx.lineTo(1, 4);
      ctx.lineTo(-5, 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Dentes de serra na lâmina interna
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-2, 0, 4, 2);
      ctx.restore();

    } else if (e.baseType === 'BASALT_GARGOYLE') {
      // =========================================================================
      // 13. GÁRGULA DE BASALTO - Carranca gótica de cantaria monolítica e chifres
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const stoneMain = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (e.isStoneForm ? '#95a5a6' : '#57606f'));
      const stoneDark = isHit ? '#ffffff' : '#2f3542';
      const stoneDeep = isHit ? '#ffffff' : '#1e272e';
      const magmaVein = isHit ? '#ffffff' : '#e67e22';

      if (e.isStoneForm) {
        // === MODO ESTÁTUA: Altar Monolítico Fechado com Cruz Imperial Quebrada ===
        ctx.fillStyle = stoneMain;
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.75, -R_m * 0.95);
        ctx.lineTo(R_m * 0.75, -R_m * 0.95);
        ctx.lineTo(R_m * 0.85, R_m * 0.85);
        ctx.lineTo(-R_m * 0.85, R_m * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = stoneDeep;
        ctx.lineWidth = 2.8;
        ctx.stroke();

        // Asas fechadas formando a face do altar
        ctx.fillStyle = stoneDark;
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.65, -R_m * 0.85);
        ctx.lineTo(0, R_m * 0.65);
        ctx.lineTo(-R_m * 0.7, R_m * 0.75);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(R_m * 0.65, -R_m * 0.85);
        ctx.lineTo(0, R_m * 0.65);
        ctx.lineTo(R_m * 0.7, R_m * 0.75);
        ctx.closePath();
        ctx.fill();

        // Cruz Imperial Quebrada Esculpida
        ctx.strokeStyle = magmaVein;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -R_m * 0.65);
        ctx.lineTo(0, R_m * 0.45);
        ctx.moveTo(-R_m * 0.35, -R_m * 0.2);
        ctx.lineTo(R_m * 0.35, -R_m * 0.2);
        ctx.stroke();
      } else {
        // === MODO VOO: Carranca Gótica com Asas de Acanto e Chifres Espiralados ===
        const wingFlap = Math.sin(frameCount * 0.32) * (R_m * 0.48);

        // 1. Asas Esculpidas em Folhas de Acanto com Nervuras de Pedra
        for (let side = -1; side <= 1; side += 2) {
          ctx.fillStyle = stoneDark;
          ctx.beginPath();
          ctx.moveTo(0, -R_m * 0.2);
          // Cotovelo da asa
          const elbowX = side * (R_m * 1.1);
          const elbowY = -R_m * 0.95 + wingFlap * 0.6;
          // Pontas em folha de acanto
          const tipX = side * (R_m * 1.75);
          const tipY = -R_m * 0.8 + wingFlap;
          ctx.lineTo(elbowX, elbowY);
          ctx.lineTo(tipX, tipY);
          ctx.quadraticCurveTo(side * (R_m * 1.4), 0 + wingFlap * 0.5, side * (R_m * 1.1), R_m * 0.4);
          ctx.quadraticCurveTo(side * (R_m * 0.6), R_m * 0.2, 0, R_m * 0.1);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = stoneDeep;
          ctx.lineWidth = 2.0;
          ctx.stroke();

          // Garra de cantaria no cotovelo alar
          ctx.fillStyle = stoneMain;
          ctx.beginPath();
          ctx.moveTo(elbowX, elbowY);
          ctx.lineTo(elbowX + side * 4, elbowY - 4);
          ctx.lineTo(elbowX + side * 1, elbowY + 3);
          ctx.closePath();
          ctx.fill();
        }

        // 2. Torso Bestial Leonino com Costelas Esculpidas
        ctx.fillStyle = stoneMain;
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.45, -R_m * 0.3);
        ctx.quadraticCurveTo(0, -R_m * 0.4, R_m * 0.45, -R_m * 0.3);
        ctx.lineTo(R_m * 0.3, R_m * 0.6);
        ctx.lineTo(-R_m * 0.3, R_m * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = stoneDeep;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Costelas entalhadas no basalto
        ctx.strokeStyle = stoneDeep;
        ctx.lineWidth = 1.4;
        for (let r = 0; r < 3; r++) {
          const ry = -R_m * 0.1 + r * (R_m * 0.18);
          ctx.beginPath();
          ctx.moveTo(-R_m * 0.28, ry);
          ctx.lineTo(R_m * 0.28, ry);
          ctx.stroke();
        }

        // 3. Cabeça de Carranca com Chifres Espiralados de Bode
        const hY = -R_m * 0.52;
        ctx.fillStyle = stoneMain;
        ctx.beginPath();
        ctx.arc(0, hY, R_m * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = stoneDeep;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Chifres espiralados de cantaria
        for (let ch = -1; ch <= 1; ch += 2) {
          ctx.fillStyle = stoneDark;
          ctx.beginPath();
          ctx.moveTo(ch * (R_m * 0.2), hY - R_m * 0.2);
          ctx.quadraticCurveTo(ch * (R_m * 0.65), hY - R_m * 0.85, ch * (R_m * 0.85), hY - R_m * 0.45);
          ctx.lineTo(ch * (R_m * 0.55), hY - R_m * 0.35);
          ctx.closePath();
          ctx.fill();
        }

        // Focinho e Presas de Cantaria
        ctx.fillStyle = stoneDeep;
        ctx.fillRect(-R_m * 0.18, hY + 2, R_m * 0.36, 4);

        ctx.fillStyle = '#dfe4ea';
        ctx.fillRect(-R_m * 0.15, hY + 3, 2.5, 3);
        ctx.fillRect(R_m * 0.05, hY + 3, 2.5, 3);

        // Olhos de Brasa Vulcânica
        ctx.fillStyle = magmaVein;
        ctx.fillRect(-R_m * 0.2, hY - 4, 3.2, 2.5);
        ctx.fillRect(R_m * 0.05, hY - 4, 3.2, 2.5);
      }

    } else if (e.baseType === 'TOLL_BELLRINGER') {
      // =========================================================================
      // 14. ARAUTO DO SINO FÚNEBRE - Penitente com cadafalso de carvalho e sino
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const woodColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4a2d18');
      const bronzeColor = isHit ? '#ffffff' : '#b8860b';
      const bronzeDark = isHit ? '#ffffff' : '#785705';
      const clothColor = isHit ? '#ffffff' : '#3b2f27';
      const bellSway = Math.sin(frameCount * 0.18) * 0.28;

      // 1. Monge Penitente Decrépito Curvado em Ângulo Agudo
      ctx.fillStyle = clothColor;
      ctx.beginPath();
      ctx.ellipse(-R_m * 0.15, R_m * 0.25, R_m * 0.5, R_m * 0.62, 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Pés descalços enfaixados
      ctx.fillStyle = '#8c7b75';
      ctx.fillRect(-R_m * 0.35, R_m * 0.75, 5, 4);
      ctx.fillRect(R_m * 0.05, R_m * 0.72, 5, 4);

      // Capuz esfarrapado cobrindo o rosto
      ctx.fillStyle = '#261b14';
      ctx.beginPath();
      ctx.arc(R_m * 0.38, -R_m * 0.15, R_m * 0.34, 0, Math.PI * 2);
      ctx.fill();

      // 2. Estrutura de Madeira de Cadafalso nas Costas (Cruzeta de Carvalho)
      ctx.fillStyle = woodColor;
      // Trave vertical
      ctx.fillRect(-R_m * 0.45, -R_m * 0.85, 7, R_m * 1.35);
      // Trave horizontal (canga)
      ctx.fillRect(-R_m * 0.75, -R_m * 0.85, R_m * 1.15, 6.5);
      ctx.strokeStyle = '#1a0f08';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-R_m * 0.75, -R_m * 0.85, R_m * 1.15, 6.5);

      // Braçadeiras de ferro forjado nas junções
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(-R_m * 0.48, -R_m * 0.88, 10, 3);
      ctx.fillRect(-R_m * 0.48, -R_m * 0.78, 10, 3);

      // 3. O Grande Sino Litúrgico de Bronze com Oscilação Pendular
      ctx.save();
      ctx.translate(-R_m * 0.35, -R_m * 0.75);
      ctx.rotate(bellSway);

      // Olhal de ferro forjado
      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, -3, 4.5, 0, Math.PI * 2);
      ctx.stroke();

      // Corpo cônico do sino gótico
      ctx.fillStyle = bronzeColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.45, R_m * 0.72);
      ctx.quadraticCurveTo(-R_m * 0.35, 0, 0, -R_m * 0.15);
      ctx.quadraticCurveTo(R_m * 0.35, 0, R_m * 0.45, R_m * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = bronzeDark;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Aba grossa na boca do sino com pátina verde-azulada
      ctx.fillStyle = '#16a085';
      ctx.fillRect(-R_m * 0.52, R_m * 0.68, R_m * 1.04, 3.8);

      // Anjos da morte esculpidos em relevo na saia
      ctx.fillStyle = bronzeDark;
      ctx.fillRect(-3, R_m * 0.25, 6, 8);

      // Badalo pesado de ferro fundido
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(0, R_m * 0.8, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Braços e Corda de Puxada
      ctx.strokeStyle = '#8c7b75';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.25, R_m * 0.1);
      ctx.lineTo(-R_m * 0.1, R_m * 0.35);
      ctx.stroke();

    } else if (e.baseType === 'PLAGUE_APOTHECARY') {
      // =========================================================================
      // 15. BOTICÁRIO DA PESTE - Cirurgião alquímico com alambique e ampolas
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const coatColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#141a21');
      const maskLeather = isHit ? '#ffffff' : '#d2b48c';
      const brassTrim = isHit ? '#ffffff' : '#d4af37';
      const potionColor = isHit ? '#ffffff' : '#2ecc71';

      // 1. Sobretudo de Couro Vulcanizado Abotoado
      ctx.fillStyle = coatColor;
      ctx.beginPath();
      ctx.ellipse(0, R_m * 0.25, R_m * 0.52, R_m * 0.68, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a0d12';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Fileira dupla de botões de latão
      ctx.fillStyle = brassTrim;
      for (let b = 0; b < 3; b++) {
        const by = -R_m * 0.15 + b * (R_m * 0.24);
        ctx.fillRect(-4, by, 2.2, 2.2);
        ctx.fillRect(2, by, 2.2, 2.2);
      }

      // 2. Mochila de Destilação Traseira com Serpentina de Cobre
      ctx.fillStyle = '#4a2d18';
      ctx.fillRect(-R_m * 0.78, -R_m * 0.45, 6, R_m * 0.7);

      // Tubo de vidro com serpentina de cobre
      ctx.fillStyle = 'rgba(116, 185, 255, 0.4)';
      ctx.fillRect(-R_m * 0.88, -R_m * 0.7, 5.5, R_m * 0.55);
      ctx.strokeStyle = '#b87333';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.85, -R_m * 0.65);
      ctx.lineTo(-R_m * 0.85, -R_m * 0.2);
      ctx.stroke();

      // 3. Cinto com 4 Ampolas de Vidro Redondas com Rolhas
      for (let p = -2; p <= 1; p++) {
        const px = p * 4.5;
        const py = R_m * 0.55;
        // Ampola de vidro
        ctx.fillStyle = potionColor;
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
        // Rolha de cortiça
        ctx.fillStyle = '#8c7b75';
        ctx.fillRect(px - 1, py - 4.2, 2, 1.8);
      }

      // 4. Cartola Vitoriana
      ctx.fillStyle = '#0a0d12';
      ctx.fillRect(-R_m * 0.35, -R_m * 1.05, R_m * 0.7, R_m * 0.52);
      // Aba da cartola
      ctx.fillRect(-R_m * 0.58, -R_m * 0.55, R_m * 1.16, 3.5);
      ctx.fillStyle = brassTrim;
      ctx.fillRect(-R_m * 0.35, -R_m * 0.65, R_m * 0.7, 2);

      // 5. Máscara de Couro de Peste com Bico Longo Costurado
      const hY = -R_m * 0.32;
      ctx.fillStyle = maskLeather;
      ctx.beginPath();
      ctx.arc(R_m * 0.08, hY, R_m * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Bico longo afilado com curvatura de corvo
      ctx.beginPath();
      ctx.moveTo(R_m * 0.22, hY - R_m * 0.22);
      ctx.quadraticCurveTo(R_m * 0.7, hY - R_m * 0.1, R_m * 1.25, hY + R_m * 0.1);
      ctx.lineTo(R_m * 0.25, hY + R_m * 0.18);
      ctx.closePath();
      ctx.fill();

      // Costuras aparentes no bico
      ctx.strokeStyle = '#2c1e14';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.35, hY - 1);
      ctx.lineTo(R_m * 1.15, hY + 1);
      ctx.stroke();

      // Óculos com armação circular de latão e lentes vermelhas
      ctx.fillStyle = brassTrim;
      ctx.beginPath();
      ctx.arc(R_m * 0.2, hY - 3, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.arc(R_m * 0.2, hY - 3, 2.8, 0, Math.PI * 2);
      ctx.fill();

    } else if (e.baseType === 'RUNE_SCRIBE') {
      // =========================================================================
      // 16. ESCRIBA DAS RUNAS - Arquivista mumificado com códice e cauda de papiro
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const papiroColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#d2c29d');
      const papiroInk = isHit ? '#ffffff' : '#3d2b1f';
      const tomeLeather = isHit ? '#ffffff' : '#4a0e17';
      const runeAura = isHit ? '#ffffff' : '#00cec9';
      const levitate = Math.sin(frameCount * 0.15) * 3.5;

      ctx.save();
      ctx.translate(0, levitate);

      // 1. Cauda Espiral de Folhas de Papiro Flutuantes
      for (let p = 0; p < 4; p++) {
        const pWave = Math.sin(frameCount * 0.2 + p * 1.1) * 5;
        const py = R_m * 0.35 + p * 5.5;
        ctx.fillStyle = papiroColor;
        ctx.beginPath();
        ctx.ellipse(pWave, py, R_m * 0.45 - p * 2.5, 4, 0.2 * p, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8c7b75';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 2. Torso Envolto em Tiras de Pergaminho com Três Pregos Rituais
      ctx.fillStyle = papiroColor;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.38, -R_m * 0.4);
      ctx.lineTo(R_m * 0.38, -R_m * 0.4);
      ctx.lineTo(R_m * 0.48, R_m * 0.45);
      ctx.lineTo(-R_m * 0.48, R_m * 0.45);
      ctx.closePath();
      ctx.fill();

      // Escrituras cursivas em sépia desenhadas no peito
      ctx.strokeStyle = papiroInk;
      ctx.lineWidth = 1.0;
      for (let ln = 0; ln < 3; ln++) {
        const lny = -R_m * 0.25 + ln * 6;
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.3, lny);
        ctx.lineTo(R_m * 0.3, lny);
        ctx.stroke();
      }

      // Três pregos de bronze no peito
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(-R_m * 0.2, -R_m * 0.15, 2.5, 2.5);
      ctx.fillRect(0, -R_m * 0.15, 2.5, 2.5);
      ctx.fillRect(R_m * 0.2, -R_m * 0.15, 2.5, 2.5);

      // 3. Capuz de Arquivista Mumificado
      ctx.fillStyle = '#1c2833';
      ctx.beginPath();
      ctx.arc(0, -R_m * 0.55, R_m * 0.34, 0, Math.PI * 2);
      ctx.fill();

      // Olhos celestes cintilantes
      ctx.fillStyle = runeAura;
      ctx.fillRect(-3, -R_m * 0.58, 2.5, 2.5);
      ctx.fillRect(2, -R_m * 0.58, 2.5, 2.5);

      // 4. Códice Gótico Aberto em 120° Flutuando à Frente
      const bookX = R_m * 0.48;
      const bookY = -R_m * 0.15;

      // Capa de couro pesada com cantoneiras de ferro
      ctx.fillStyle = tomeLeather;
      ctx.fillRect(bookX - 1, bookY - 8, 11, 16);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(bookX - 1, bookY - 8, 3, 3);
      ctx.fillRect(bookX + 7, bookY - 8, 3, 3);
      ctx.fillRect(bookX - 1, bookY + 5, 3, 3);
      ctx.fillRect(bookX + 7, bookY + 5, 3, 3);

      // Páginas brancas abertas
      ctx.fillStyle = '#f5f6fa';
      ctx.fillRect(bookX + 1, bookY - 6.5, 8.5, 13);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(bookX + 4.5, bookY - 6.5, 1, 13); // Lombada divisória

      // 5. Pena de Metal Desenhadora de Runas
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(bookX + 11, bookY - 10);
      ctx.lineTo(bookX + 14, bookY - 3);
      ctx.stroke();

      // Três Runas Astrais Orbitais
      for (let r = 0; r < 3; r++) {
        const rAng = frameCount * 0.08 + r * (Math.PI * 2 / 3);
        const rx = Math.cos(rAng) * (R_m * 1.05);
        const ry = -R_m * 0.35 + Math.sin(rAng) * (R_m * 0.45);
        ctx.fillStyle = runeAura;
        ctx.fillRect(rx - 2, ry - 2, 4, 4);
      }
      ctx.restore();

    } else if (e.baseType === 'FORGE_PYREGUARD') {
      // =========================================================================
      // 17. LANÇA-CHAMAS DA FORJA - Autômato de fundição com fornalha e tromba de fogo
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const ironCast = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2c3437');
      const ironDark = isHit ? '#ffffff' : '#14181a';
      const bronzeMuzzle = isHit ? '#ffffff' : '#b87333';
      const furnaceCoal = isHit ? '#ffffff' : '#e67e22';
      const isFiring = e.flameState === 'firing';

      // 1. Tanque Traseiro Esférico com Manômetro e Chaminés Duplas
      ctx.fillStyle = '#1c2124';
      ctx.beginPath();
      ctx.arc(-R_m * 0.65, -R_m * 0.15, R_m * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // Duas chaminés inclinadas
      ctx.fillStyle = ironDark;
      ctx.fillRect(-R_m * 0.85, -R_m * 0.85, 4.5, 12);
      ctx.fillRect(-R_m * 0.65, -R_m * 0.85, 4.5, 12);

      // Manômetro circular de latão
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(-R_m * 0.65, -R_m * 0.15, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111111';
      ctx.fillRect(-R_m * 0.65, -R_m * 0.15, 2.5, 1);

      // 2. Torso de Fornalha de Ferro Fundido com Rebites
      ctx.fillStyle = ironCast;
      ctx.beginPath();
      ctx.ellipse(0, 0, R_m * 0.62, R_m * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ironDark;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Rebites perimetrais
      ctx.fillStyle = '#d4af37';
      for (let rv = 0; rv < 6; rv++) {
        const ra = rv * (Math.PI / 3);
        ctx.fillRect(Math.cos(ra) * (R_m * 0.52) - 1.2, Math.sin(ra) * (R_m * 0.58) - 1.2, 2.4, 2.4);
      }

      // 3. Porta de Fornalha no Peito com Grelha e Carvão Ardente
      ctx.fillStyle = '#0a0502';
      ctx.fillRect(-R_m * 0.28, -R_m * 0.22, R_m * 0.56, R_m * 0.45);

      ctx.fillStyle = furnaceCoal;
      ctx.fillRect(-R_m * 0.22, -R_m * 0.16, R_m * 0.44, R_m * 0.33);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-R_m * 0.14, -R_m * 0.08, R_m * 0.28, 4);

      // Grelha de ferro da fornalha
      ctx.strokeStyle = ironDark;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.08, -R_m * 0.22);
      ctx.lineTo(-R_m * 0.08, R_m * 0.23);
      ctx.moveTo(R_m * 0.08, -R_m * 0.22);
      ctx.lineTo(R_m * 0.08, R_m * 0.23);
      ctx.stroke();

      // 4. Tromba Térmica de Dois Estágios (Braço Lança-Chamas)
      ctx.fillStyle = bronzeMuzzle;
      ctx.fillRect(R_m * 0.2, -4.5, R_m * 0.45, 9); // Câmara de mistura
      ctx.fillStyle = ironDark;
      ctx.fillRect(R_m * 0.65, -3, R_m * 0.65, 6); // Cano principal

      // Bocal cônico alargado (boca de sino)
      ctx.fillStyle = isFiring ? '#e74c3c' : bronzeMuzzle;
      ctx.beginPath();
      ctx.moveTo(R_m * 1.3, -3);
      ctx.lineTo(R_m * 1.5, -6.5);
      ctx.lineTo(R_m * 1.5, 6.5);
      ctx.lineTo(R_m * 1.3, 3);
      ctx.closePath();
      ctx.fill();

      // Mangueira espiral reforçada
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, R_m * 0.35);
      ctx.quadraticCurveTo(R_m * 0.2, R_m * 0.55, R_m * 0.4, 0);
      ctx.stroke();

    } else if (e.baseType === 'MAIDEN_THORNS') {
      // =========================================================================
      // 18. DONZELA DAS AGULHAS - Dama de ferro com relevo, dobradiças e estiletes
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const ironPlate = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#232931');
      const ironDark = isHit ? '#ffffff' : '#111418';
      const brassRelief = isHit ? '#ffffff' : '#8c7b75';
      const bloodColor = isHit ? '#ffffff' : '#6b0000';

      // 1. Silhueta do Sarcófago Antropomórfico Vertical
      ctx.fillStyle = ironPlate;
      ctx.beginPath();
      ctx.ellipse(0, 0, R_m * 0.6, R_m * 0.92, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ironDark;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // 2. Relevo da Imperatriz com Capuz e Lágrimas Esculpidas
      ctx.fillStyle = brassRelief;
      ctx.beginPath();
      ctx.arc(0, -R_m * 0.55, R_m * 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Fendas dos olhos chorando
      ctx.fillStyle = '#0a0d12';
      ctx.fillRect(-3, -R_m * 0.58, 2, 4);
      ctx.fillRect(2, -R_m * 0.58, 2, 4);

      // 3. Duas Portas Bipartidas Entreabertas com Fenda Central Sombria
      ctx.fillStyle = '#05070a';
      ctx.fillRect(-2.5, -R_m * 0.75, 5, R_m * 1.55);

      // Quatro dobradiças laterais de ferro
      ctx.fillStyle = ironDark;
      ctx.fillRect(-R_m * 0.62, -R_m * 0.4, 5, 4);
      ctx.fillRect(-R_m * 0.62, R_m * 0.2, 5, 4);
      ctx.fillRect(R_m * 0.52, -R_m * 0.4, 5, 4);
      ctx.fillRect(R_m * 0.52, R_m * 0.2, 5, 4);

      // 4. Dezenas de Estiletes de Aço Cromado em Ângulos Irregulares
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 2.0;
      for (let sp = 0; sp < 4; sp++) {
        const spy = -R_m * 0.55 + sp * (R_m * 0.36);
        const lLen = 8 + (sp % 2 === 0 ? 5 : 0);
        // Lado esquerdo
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.55, spy);
        ctx.lineTo(-R_m * 0.55 - lLen, spy - 2);
        ctx.stroke();
        // Lado direito
        ctx.beginPath();
        ctx.moveTo(R_m * 0.55, spy);
        ctx.lineTo(R_m * 0.55 + lLen, spy - 2);
        ctx.stroke();
      }

      // Sangue seco escorrendo pela fenda
      ctx.fillStyle = bloodColor;
      ctx.fillRect(-1.5, R_m * 0.2, 3, R_m * 0.5);

      // 5. Pés com Rodas Dentadas na Base
      ctx.fillStyle = ironDark;
      ctx.fillRect(-R_m * 0.4, R_m * 0.85, 6, 6);
      ctx.fillRect(R_m * 0.25, R_m * 0.85, 6, 6);

    } else if (e.baseType === 'MIRROR_BANSHEE') {
      // =========================================================================
      // 19. BANSHEE DOS ESPELHOS - Espectro nupcial com cacos de espelho cravados
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const spectralAlpha = e.isDecoy ? 0.42 : 0.88;
      const bansheeCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#a29bfe');
      const shardWhite = isHit ? '#ffffff' : '#ffffff';
      const wave = Math.sin(frameCount * 0.22) * 4;

      ctx.save();
      ctx.globalAlpha *= spectralAlpha;

      // 1. Trapos de Vestido de Noiva Imperial Rasgado em Tiras Fluidas
      ctx.fillStyle = bansheeCol;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.3);
      ctx.lineTo(R_m * 0.35, -R_m * 0.3);
      ctx.quadraticCurveTo(R_m * 0.75, R_m * 0.4, R_m * 0.15 + wave, R_m * 1.25);
      ctx.quadraticCurveTo(-R_m * 0.75, R_m * 0.4, -R_m * 0.35, -R_m * 0.3);
      ctx.closePath();
      ctx.fill();

      // Cauda esfarrapada de renda
      ctx.strokeStyle = '#6c5ce7';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.2, R_m * 0.5);
      ctx.lineTo(wave, R_m * 1.3);
      ctx.moveTo(R_m * 0.2, R_m * 0.5);
      ctx.lineTo(wave + 4, R_m * 1.3);
      ctx.stroke();

      // 2. Cacos de Espelho Triangulares Cravados na Carne e no Vestido
      ctx.fillStyle = shardWhite;
      for (let sh = 0; sh < 5; sh++) {
        const shX = Math.sin(sh * 1.8) * (R_m * 0.4);
        const shY = -R_m * 0.15 + sh * (R_m * 0.22);
        ctx.beginPath();
        ctx.moveTo(shX, shY - 5);
        ctx.lineTo(shX + 4.5, shY + 4);
        ctx.lineTo(shX - 3.5, shY + 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Cabeça Cadavérica e Cabelos Flutuando contra a Gravidade
      const hY = -R_m * 0.5;
      ctx.fillStyle = '#dfe4ea';
      ctx.beginPath();
      ctx.arc(0, hY, R_m * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Mechas de cabelos longos subindo no ar
      ctx.strokeStyle = '#5f27cd';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, hY);
      ctx.quadraticCurveTo(-R_m * 0.8, hY - R_m * 0.6, -R_m * 0.5 + wave, hY - R_m * 1.1);
      ctx.moveTo(R_m * 0.3, hY);
      ctx.quadraticCurveTo(R_m * 0.8, hY - R_m * 0.6, R_m * 0.5 - wave, hY - R_m * 1.1);
      ctx.stroke();

      // Mandíbula Completamente Descolada para Baixo (Grito Silencioso)
      ctx.fillStyle = '#0a0518';
      ctx.beginPath();
      ctx.ellipse(R_m * 0.12, hY + 4, 3.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Órbitas oculares ocas
      ctx.fillRect(R_m * 0.08, hY - 3, 3, 2.5);
      ctx.restore();

    } else if (e.baseType === 'DULLAHAN_VANGUARD') {
      // =========================================================================
      // 20. CAVALEIRO SEM CABEÇA - Armadura de aço negro, cabeça na mão e justa
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const plateCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e242c');
      const plateDark = isHit ? '#ffffff' : '#0c0f12';
      const isCharging = e.lanceState === 'charging';
      const flameBob = Math.sin(frameCount * 0.35) * 2.5;

      // 1. Couraça Gótica em Aço Negro com Aresta Tapul
      ctx.fillStyle = plateCol;
      ctx.beginPath();
      ctx.ellipse(0, 0, R_m * 0.6, R_m * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = plateDark;
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Aresta central reforçada (Tapul)
      ctx.strokeStyle = '#576574';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -R_m * 0.6);
      ctx.lineTo(R_m * 0.15, 0);
      ctx.lineTo(0, R_m * 0.6);
      ctx.stroke();

      // Saia de faixas de aço articuladas (Fauld)
      ctx.fillStyle = plateDark;
      ctx.fillRect(-R_m * 0.45, R_m * 0.35, R_m * 0.9, 5);
      ctx.fillRect(-R_m * 0.38, R_m * 0.48, R_m * 0.76, 5);

      // 2. Gola Degolada Serrilhada com Labareda de Fogo-Fátuo
      ctx.fillStyle = plateDark;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.3, -R_m * 0.6);
      ctx.lineTo(-R_m * 0.35, -R_m * 0.78);
      ctx.lineTo(0, -R_m * 0.72);
      ctx.lineTo(R_m * 0.35, -R_m * 0.78);
      ctx.lineTo(R_m * 0.3, -R_m * 0.6);
      ctx.closePath();
      ctx.fill();

      // Labareda crepitando do pescoço decepado
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.22, -R_m * 0.72);
      ctx.lineTo(0, -R_m * 1.15 + flameBob);
      ctx.lineTo(R_m * 0.22, -R_m * 0.72);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(0, -R_m * 0.85 + flameBob * 0.5, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. A Cabeça Degolada com Elmo Aberto Segurada na Mão Esquerda
      const headX = -R_m * 0.55;
      const headY = R_m * 0.15;

      // Elmo de justa aberto
      ctx.fillStyle = plateDark;
      ctx.beginPath();
      ctx.arc(headX, headY, R_m * 0.34, 0, Math.PI * 2);
      ctx.fill();

      // Chifres quebrados no elmo
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(headX - 4, headY - 8);
      ctx.lineTo(headX - 10, headY - 14);
      ctx.moveTo(headX + 4, headY - 8);
      ctx.lineTo(headX + 8, headY - 12);
      ctx.stroke();

      // Crânio ressequido dentro do elmo
      ctx.fillStyle = '#dfe4ea';
      ctx.beginPath();
      ctx.arc(headX + 2, headY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Órbitas em brasas ardentes
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(headX, headY - 2, 2.2, 2.2);
      ctx.fillRect(headX + 4, headY - 2, 2.2, 2.2);

      // 4. Lança de Justa Pesada com Guarda Cônica e Flâmula
      const lanceLen = isCharging ? R_m * 2.1 : R_m * 1.45;
      ctx.fillStyle = '#57606f';
      ctx.fillRect(R_m * 0.2, -3, lanceLen, 6);

      // Protetor cônico de mão (vamplate)
      ctx.fillStyle = plateDark;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.2, -8);
      ctx.lineTo(R_m * 0.5, -4);
      ctx.lineTo(R_m * 0.5, 4);
      ctx.lineTo(R_m * 0.2, 8);
      ctx.closePath();
      ctx.fill();

      // Ponta de torneio afiada
      ctx.fillStyle = '#ecf0f1';
      ctx.beginPath();
      const lx = R_m * 0.2 + lanceLen;
      ctx.moveTo(lx, -5);
      ctx.lineTo(lx + 12, 0);
      ctx.lineTo(lx, 5);
      ctx.closePath();
      ctx.fill();

      // Flâmula heráldica rasgada de duas pontas tremulando
      const fWave = Math.sin(frameCount * 0.3) * 3;
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo(lx - 8, 3);
      ctx.lineTo(lx - 20, 10 + fWave);
      ctx.lineTo(lx - 12, 4);
      ctx.lineTo(lx - 20, 16 + fWave);
      ctx.lineTo(lx - 8, 3);
      ctx.closePath();
      ctx.fill();

    } else if (e.baseType === 'SNIPER_CULTIST') {
      // =========================================================================
      // 21. ATIRADOR DE ÉTER - Caçador de almas com arco de ossos e monóculo
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const cloakCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#22183b');
      const featherDark = isHit ? '#ffffff' : '#0c0717';
      const boneBow = isHit ? '#ffffff' : '#dfe4ea';
      const plasmaCol = isHit ? '#ffffff' : '#e056fd';

      // 1. Manto de Caçador com Gola Espessa de Penas de Corvo
      ctx.fillStyle = cloakCol;
      ctx.beginPath();
      ctx.ellipse(0, R_m * 0.15, R_m * 0.45, R_m * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gola de penas sobrepostas nos ombros
      ctx.fillStyle = featherDark;
      for (let f = -3; f <= 3; f++) {
        const fa = f * 0.25;
        ctx.fillRect(-R_m * 0.35 + f * 3.5, -R_m * 0.45, 4.5, 9);
      }

      // Bandoleira de couro cruzando o peito com tubos de flechas
      ctx.strokeStyle = '#8c7b75';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.35, -R_m * 0.3);
      ctx.lineTo(R_m * 0.25, R_m * 0.45);
      ctx.stroke();

      // 2. Capuz com Máscara e Monóculo Telescópico de 3 Lentes
      const hY = -R_m * 0.45;
      ctx.fillStyle = featherDark;
      ctx.beginPath();
      ctx.arc(0, hY, R_m * 0.36, 0, Math.PI * 2);
      ctx.fill();

      // Monóculo telescópico de latão sobre o olho direito
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(R_m * 0.18, hY - 1, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e056fd';
      ctx.beginPath();
      ctx.arc(R_m * 0.18, hY - 1, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Arco Composto Biomecânico de Ossos com Roldanas de Bronze
      const bX = R_m * 0.55;
      ctx.strokeStyle = boneBow;
      ctx.lineWidth = 2.8;

      // Corpo de costelas recurvadas
      ctx.beginPath();
      ctx.arc(bX, 0, R_m * 0.9, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      // Roldanas mecânicas de bronze nas pontas
      ctx.fillStyle = '#d4af37';
      const tip1Y = Math.sin(-Math.PI * 0.4) * R_m * 0.9;
      const tip2Y = Math.sin(Math.PI * 0.4) * R_m * 0.9;
      ctx.fillRect(bX + Math.cos(-Math.PI * 0.4) * R_m * 0.9 - 2.5, tip1Y - 2.5, 5, 5);
      ctx.fillRect(bX + Math.cos(Math.PI * 0.4) * R_m * 0.9 - 2.5, tip2Y - 2.5, 5, 5);

      // Cabos tensores duplos de aço
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bX + Math.cos(-Math.PI * 0.4) * R_m * 0.9, tip1Y);
      ctx.lineTo(R_m * 0.1, 0); // Ponto de puxada
      ctx.lineTo(bX + Math.cos(Math.PI * 0.4) * R_m * 0.9, tip2Y);
      ctx.stroke();

      // 4. Flecha de Cristal Facetado com Ponta Farpada
      ctx.fillStyle = plasmaCol;
      ctx.fillRect(R_m * 0.1, -1.8, R_m * 1.05, 3.6);

      // Ponta farpada de cristal
      ctx.beginPath();
      ctx.moveTo(R_m * 1.15, -4.5);
      ctx.lineTo(R_m * 1.38, 0);
      ctx.lineTo(R_m * 1.15, 4.5);
      ctx.lineTo(R_m * 1.05, 0);
      ctx.closePath();
      ctx.fill();

    } else if (e.baseType === 'VOID_SCAVENGER') {
      // =========================================================================
      // 22. DUENDE LADRÃO DE GEMAS - Goblin desgrenhado com sacola rasgada de espólios
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const skinCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1d7358');
      const skinDark = isHit ? '#ffffff' : '#0e4a37';
      const leatherBag = isHit ? '#ffffff' : '#734d37';
      const bagScale = 1 + Math.min(0.85, (e.eatenGemsCount || 0) * 0.16);
      const runCycle = Math.sin(frameCount * 0.35) * 4;

      // 1. Pernas Ágeis com Dedos Longos Agarrando o Solo
      ctx.strokeStyle = skinDark;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, R_m * 0.3);
      ctx.lineTo(-R_m * 0.35 + runCycle, R_m * 0.75);
      ctx.lineTo(-R_m * 0.5 + runCycle, R_m * 1.05);
      ctx.moveTo(R_m * 0.25, R_m * 0.3);
      ctx.lineTo(R_m * 0.1 - runCycle, R_m * 0.75);
      ctx.lineTo(R_m * 0.35 - runCycle, R_m * 1.05);
      ctx.stroke();

      // 2. Sacola de Espólios de Couro Cru Abarrotada com Fendas e Gemas
      const bW = R_m * 0.62 * bagScale;
      const bH = R_m * 0.55 * bagScale;
      ctx.fillStyle = leatherBag;
      ctx.beginPath();
      ctx.ellipse(-R_m * 0.52, -R_m * 0.15, bW, bH, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a2d18';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Costuras grosseiras de barbante na sacola
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.7, -R_m * 0.35);
      ctx.lineTo(-R_m * 0.35, -R_m * 0.05);
      ctx.stroke();

      // Gemas Facetadas Transbordando por Rasgos na Sacola
      // Rubi vermelho
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.65, -R_m * 0.5);
      ctx.lineTo(-R_m * 0.55, -R_m * 0.6);
      ctx.lineTo(-R_m * 0.45, -R_m * 0.5);
      ctx.lineTo(-R_m * 0.55, -R_m * 0.35);
      ctx.closePath();
      ctx.fill();

      // Safira azul
      ctx.fillStyle = '#00cec9';
      ctx.fillRect(-R_m * 0.75, -R_m * 0.2, 4.5, 4.5);

      // Topázio dourado
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(-R_m * 0.35, -R_m * 0.3, 3, 0, Math.PI * 2);
      ctx.fill();

      // 3. Tronco Esguio com Colete de Retalhos
      ctx.fillStyle = skinCol;
      ctx.beginPath();
      ctx.ellipse(R_m * 0.15, R_m * 0.1, R_m * 0.42, R_m * 0.48, 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Colete de retalhos
      ctx.fillStyle = '#3d2516';
      ctx.fillRect(-2, -R_m * 0.2, R_m * 0.35, R_m * 0.45);

      // Facas de sucata presas na lombar
      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.1, R_m * 0.35);
      ctx.lineTo(R_m * 0.25, R_m * 0.45);
      ctx.stroke();

      // 4. Cabeça com Nariz Adunco com Verrugas e Orelhas Rasgadas
      const ghX = R_m * 0.38;
      const ghY = -R_m * 0.35;
      ctx.fillStyle = skinCol;
      ctx.beginPath();
      ctx.arc(ghX, ghY, R_m * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Nariz adunco comprido
      ctx.beginPath();
      ctx.moveTo(ghX + 4, ghY - 2);
      ctx.lineTo(ghX + 11, ghY + 2);
      ctx.lineTo(ghX + 3, ghY + 5);
      ctx.closePath();
      ctx.fill();

      // Orelha comprida de morcego rasgada
      ctx.beginPath();
      ctx.moveTo(ghX - 2, ghY - 3);
      ctx.lineTo(ghX - R_m * 0.45, ghY - R_m * 0.65);
      ctx.lineTo(ghX - 3, ghY + 4);
      ctx.closePath();
      ctx.fill();

      // Brinco de argola de ferro na orelha
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ghX - R_m * 0.35, ghY - R_m * 0.5, 2, 0, Math.PI * 2);
      ctx.stroke();

      // Olhos grandes gananciosos amarelos
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(ghX + 1, ghY - 4, 3.5, 3.5);

    } else if (e.baseType === 'GRAVE_GORGON') {
      // =========================================================================
      // 23. CARNIÇAL NECRÓFAGO - Troglodita canibal com bocarra em 4 pétalas
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const fleshColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#47535e');
      const fleshDark = isHit ? '#ffffff' : '#22282e';
      const boneSpikes = isHit ? '#ffffff' : '#dfe4ea';
      const mouthRed = isHit ? '#ffffff' : '#b71540';

      // 1. Tronco de Troglodita Musculoso em Apoio Quadrúpede
      ctx.fillStyle = fleshColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, R_m * 0.68, R_m * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = fleshDark;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Braço comprido apoiado no solo (estilo gorila canibal)
      ctx.strokeStyle = fleshColor;
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(R_m * 0.3, 0);
      ctx.lineTo(R_m * 0.7, R_m * 0.55);
      ctx.lineTo(R_m * 0.85, R_m * 0.95);
      ctx.stroke();
      ctx.fillStyle = fleshDark;
      ctx.fillRect(R_m * 0.75, R_m * 0.9, 8, 5); // Nós dos dedos no chão

      // 2. Espinha Dorsal com Vértebras Hipertrofiadas em Estalagmites
      ctx.fillStyle = boneSpikes;
      for (let sp = 0; sp < 4; sp++) {
        const spx = -R_m * 0.65 + sp * (R_m * 0.28);
        const spy = -R_m * 0.45 - (sp === 1 || sp === 2 ? 6 : 2);
        ctx.beginPath();
        ctx.moveTo(spx - 3, spy + 6);
        ctx.lineTo(spx, spy - 6);
        ctx.lineTo(spx + 3, spy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2d3436';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. A Bocarra Cruciforme Carnívora em Quatro Pétalas Mandibulares
      const mX = R_m * 0.42;
      const mY = -R_m * 0.05;

      // Fundo escuro e goela avermelhada
      ctx.fillStyle = '#080204';
      ctx.beginPath();
      ctx.arc(mX, mY, R_m * 0.48, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = mouthRed;
      ctx.beginPath();
      ctx.arc(mX, mY, R_m * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // As 4 Pétalas Mandibulares (Superior, Inferior, Esquerda, Direita)
      ctx.fillStyle = fleshColor;
      // Pétala Superior
      ctx.beginPath();
      ctx.moveTo(mX - 6, mY - R_m * 0.3);
      ctx.lineTo(mX, mY - R_m * 0.65);
      ctx.lineTo(mX + 6, mY - R_m * 0.3);
      ctx.closePath();
      ctx.fill();
      // Pétala Inferior
      ctx.beginPath();
      ctx.moveTo(mX - 6, mY + R_m * 0.3);
      ctx.lineTo(mX, mY + R_m * 0.65);
      ctx.lineTo(mX + 6, mY + R_m * 0.3);
      ctx.closePath();
      ctx.fill();
      // Pétala Esquerda
      ctx.beginPath();
      ctx.moveTo(mX - R_m * 0.3, mY - 6);
      ctx.lineTo(mX - R_m * 0.55, mY);
      ctx.lineTo(mX - R_m * 0.3, mY + 6);
      ctx.closePath();
      ctx.fill();
      // Pétala Direita
      ctx.beginPath();
      ctx.moveTo(mX + R_m * 0.3, mY - 6);
      ctx.lineTo(mX + R_m * 0.65, mY);
      ctx.lineTo(mX + R_m * 0.3, mY + 6);
      ctx.closePath();
      ctx.fill();

      // Três fileiras de dentes pontiagudos de tubarão recurvados
      ctx.fillStyle = '#ffffff';
      for (let dt = 0; dt < 8; dt++) {
        const da = dt * (Math.PI / 4);
        const dx = mX + Math.cos(da) * (R_m * 0.36);
        const dy = mY + Math.sin(da) * (R_m * 0.36);
        ctx.fillRect(dx - 1.5, dy - 1.5, 3, 3);
      }

    } else if (e.baseType === 'CURSED_CHEST') {
      // =========================================================================
      // 24. MÍMICO DE ÉTER - Relicário amaldiçoado com presas de madeira e raízes
      // =========================================================================
      const R_m = e.radius;
      const isHit = e.hitFlash > 0;
      const woodOak = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#3e2718');
      const woodDark = isHit ? '#ffffff' : '#1e120a';
      const brassTrim = isHit ? '#ffffff' : '#d4af37';
      const rootColor = isHit ? '#ffffff' : '#140c06';
      const isAwake = e.isAwakeMimic;

      if (!isAwake) {
        // === MODO DISFARÇADO: Baú com Olho Secreto na Fechadura ===
        const breathe = Math.sin(frameCount * 0.12) * 1.0;

        // Pranchas de carvalho negro
        ctx.fillStyle = woodOak;
        ctx.fillRect(-R_m * 0.75, -R_m * 0.55 + breathe, R_m * 1.5, R_m * 1.1);

        // Veios de madeira entalhados
        ctx.strokeStyle = woodDark;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-R_m * 0.75, breathe);
        ctx.lineTo(R_m * 0.75, breathe);
        ctx.stroke();

        // Cantoneiras de ferro rebitadas nos cantos
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(-R_m * 0.75, -R_m * 0.55 + breathe, 6, 6);
        ctx.fillRect(R_m * 0.75 - 6, -R_m * 0.55 + breathe, 6, 6);
        ctx.fillRect(-R_m * 0.75, R_m * 0.55 - 6 + breathe, 6, 6);
        ctx.fillRect(R_m * 0.75 - 6, R_m * 0.55 - 6 + breathe, 6, 6);

        // Tranca pesada de bronze
        ctx.fillStyle = brassTrim;
        ctx.fillRect(-4, -4 + breathe, 8, 8);

        // Olho secreto piscando na fresta da fechadura
        const blink = Math.sin(frameCount * 0.08);
        if (blink > 0.4) {
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(-1.5, -2 + breathe, 3, 4);
        } else {
          ctx.fillStyle = '#111111';
          ctx.fillRect(-1, -1.5 + breathe, 2, 3);
        }
      } else {
        // === MODO DESPERTO: Bocarra cavernosa com presas de madeira e patas ===
        const bite = Math.sin(frameCount * 0.38) * 5;
        const tongueWave = Math.sin(frameCount * 0.3) * 6;

        // 1. Quatro Patas de Raízes e Vigas Lascadas Galopando
        ctx.strokeStyle = rootColor;
        ctx.lineWidth = 3.2;
        for (let leg = -1; leg <= 1; leg += 2) {
          const lWave = Math.sin(frameCount * 0.35 + leg) * 6;
          // Pata Dianteira
          ctx.beginPath();
          ctx.moveTo(leg * (R_m * 0.4), R_m * 0.45);
          ctx.lineTo(leg * (R_m * 0.7) + lWave, R_m * 0.85);
          ctx.lineTo(leg * (R_m * 0.85) + lWave, R_m * 1.25);
          ctx.stroke();
          // Pata Traseira
          ctx.beginPath();
          ctx.moveTo(-leg * (R_m * 0.4), R_m * 0.45);
          ctx.lineTo(-leg * (R_m * 0.7) - lWave, R_m * 0.85);
          ctx.lineTo(-leg * (R_m * 0.85) - lWave, R_m * 1.25);
          ctx.stroke();
        }

        // 2. Base Inferior do Baú com Dentes de Pregos Enferrujados
        ctx.fillStyle = woodOak;
        ctx.fillRect(-R_m * 0.75, 0, R_m * 1.5, R_m * 0.65);
        ctx.strokeStyle = woodDark;
        ctx.lineWidth = 2.2;
        ctx.strokeRect(-R_m * 0.75, 0, R_m * 1.5, R_m * 0.65);

        // Dentes inferiores de madeira lascada
        ctx.fillStyle = '#f5f6fa';
        for (let dt = 0; dt < 5; dt++) {
          const dtx = -R_m * 0.6 + dt * (R_m * 0.3);
          ctx.beginPath();
          ctx.moveTo(dtx, 0);
          ctx.lineTo(dtx + 3, -6);
          ctx.lineTo(dtx + 6, 0);
          ctx.closePath();
          ctx.fill();
        }

        // 3. Garganta Profunda e Língua Muscular Bifurcada
        ctx.fillStyle = '#4a0033';
        ctx.fillRect(-R_m * 0.6, -4, R_m * 1.2, 8);

        // Língua grossa chicoteante
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.moveTo(R_m * 0.2, -2);
        ctx.quadraticCurveTo(R_m * 0.8, -4 + tongueWave, R_m * 1.45, tongueWave);
        ctx.lineTo(R_m * 1.25, 3 + tongueWave);
        ctx.lineTo(R_m * 0.2, 3);
        ctx.closePath();
        ctx.fill();

        // 4. Tampa Superior Escancarada em Ângulo com Dentes Superiores
        ctx.save();
        ctx.translate(-R_m * 0.65, -2);
        ctx.rotate(-0.62 + bite * 0.05);

        ctx.fillStyle = woodOak;
        ctx.fillRect(0, -R_m * 0.6, R_m * 1.45, R_m * 0.6);
        ctx.strokeStyle = woodDark;
        ctx.lineWidth = 2.0;
        ctx.strokeRect(0, -R_m * 0.6, R_m * 1.45, R_m * 0.6);

        // Dentes superiores pontiagudos
        ctx.fillStyle = '#f5f6fa';
        for (let dt = 0; dt < 5; dt++) {
          const dtx = 4 + dt * (R_m * 0.28);
          ctx.beginPath();
          ctx.moveTo(dtx, 0);
          ctx.lineTo(dtx + 3.5, 7);
          ctx.lineTo(dtx + 7, 0);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
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
 * /**
 * Renderiza as animações de morte procedurais e dramáticas em 3 fases:
 * Fase 1: Impacto & Recoil (t < 0.35)
 * Fase 2: Colapso Estrutural & Despedaçamento (0.35 <= t < 0.75)
 * Fase 3: Dissipação, Resíduo & Cinzas (t >= 0.75)
 * 
 * Despacha mini-bosses diretamente para drawDyingMiniBossShape.
 */
export function drawDyingEnemyShape(de) {
  if (de.isMiniBoss) {
    drawDyingMiniBossShape(de);
    return;
  }

  const t = Math.max(0, Math.min(1, 1 - (de.timer / de.maxTimer)));
  const R = de.radius;

  ctx.save();
  ctx.translate(de.x, de.y);
  ctx.scale(de.facing, 1);
  if (de.rot) ctx.rotate(de.rot);

  // Fade suave de transparência apenas no último quarto do ciclo de vida
  const bodyAlpha = Math.max(0, 1 - Math.max(0, (t - 0.75) / 0.25));
  ctx.globalAlpha = bodyAlpha;

  switch (de.baseType) {
    case 'ZOMBIE': {
      const v = de.variant || 0;
      // Fase 1: Impacto joga o torso para trás; Fase 2: Joelhos dobram e desaba; Fase 3: Dissolução cadavérica
      const fallAngle = t < 0.35 ? -t * 0.8 : (-0.28 - (t - 0.35) * 1.3);
      ctx.rotate(fallAngle);
      ctx.translate(0, t * 10);
      ctx.scale(1 + t * 0.12, Math.max(0.08, 1 - t * 0.75));

      let bodyCol = '#3a3d40';
      let skinCol = '#52734d';
      if (v === 1) { bodyCol = '#1e272e'; skinCol = '#4d5d53'; }
      else if (v === 2) { bodyCol = '#808e9b'; skinCol = '#2d5a27'; }
      else if (v === 3) { bodyCol = '#5c1926'; skinCol = '#576574'; }

      // Pernas trôpegas tombadas
      ctx.fillStyle = '#242628';
      ctx.fillRect(-R * 0.4, R * 0.3, 3.5, R * 0.5 * (1 - t * 0.5));
      ctx.fillRect(-R * 0.1, R * 0.35, 3.5, R * 0.45 * (1 - t * 0.5));

      // Torso desabando
      ctx.fillStyle = bodyCol;
      ctx.fillRect(-R * 0.55, -R * 0.35, R * 0.85, R * 0.7);

      // Cabeça inclinada
      ctx.fillStyle = skinCol;
      ctx.beginPath();
      ctx.arc(R * 0.22, -R * 0.48 + t * 4, R * 0.36, 0, Math.PI * 2);
      ctx.fill();

      // Detalhe de resíduo terminal específico da variante
      if (v === 1) {
        // Chapa de sucata se soltando com faíscas
        ctx.fillStyle = '#747d8c';
        ctx.fillRect(R * 0.1 + t * 6, -R * 0.55 + t * 4, 7, 3);
        if (t > 0.2 && t < 0.6) {
          ctx.fillStyle = '#f1c40f';
          ctx.fillRect(R * 0.3 + (Math.random() - 0.5) * 6, -R * 0.6 + (Math.random() - 0.5) * 6, 2.5, 2.5);
        }
      } else if (v === 2) {
        // Pústula tóxica estourando e soltando fumaça verde
        if (t > 0.25) {
          ctx.fillStyle = 'rgba(46, 204, 113, 0.7)';
          for (let p = 0; p < 3; p++) {
            const pa = p * 1.8 + t * 3;
            ctx.beginPath();
            ctx.arc(R * 0.15 + Math.cos(pa) * (R * 0.6 * t), -R * 0.5 + Math.sin(pa) * (R * 0.4 * t), 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (v === 3) {
        // Ombreira de ferro caindo pesada
        ctx.save();
        ctx.translate(-R * 0.7 - t * 10, t * 8);
        ctx.rotate(-t * 1.5);
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(0, 0, 6, 5);
        ctx.restore();
      }
      break;
    }

    case 'BAT': {
      // Falanges travam, mergulho em espiral com rotação acelerada e névoa carmesim
      ctx.translate(0, t * 18);
      ctx.rotate(t * 1.4);
      ctx.scale(Math.max(0.05, 1 - t * 0.7), Math.max(0.05, 1 - t * 0.8));

      // Membranas murchando
      ctx.fillStyle = '#4a0810';
      ctx.beginPath();
      ctx.moveTo(-R * 1.5 * (1 - t * 0.6), -R * 0.5);
      ctx.lineTo(0, -R * 0.2);
      ctx.lineTo(R * 1.5 * (1 - t * 0.6), -R * 0.5);
      ctx.lineTo(0, R * 0.4);
      ctx.closePath();
      ctx.fill();

      // Esqueleto de morcego quebrado
      ctx.strokeStyle = '#2b131e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-R * 1.1 * (1 - t * 0.5), -R * 0.4);
      ctx.lineTo(0, 0);
      ctx.lineTo(R * 1.1 * (1 - t * 0.5), -R * 0.4);
      ctx.stroke();

      // Névoa carmesim dispersando
      if (t > 0.3) {
        ctx.fillStyle = 'rgba(255, 71, 87, 0.65)';
        for (let b = 0; b < 4; b++) {
          const ba = b * 1.57 + t * 2;
          ctx.fillRect(Math.cos(ba) * (R * 0.8 * t) - 2, Math.sin(ba) * (R * 0.8 * t) - 2, 4, 4);
        }
      }
      break;
    }

    case 'SHIELDED': {
      // Pavês arremessado para frente caindo de prancha; soldado cai de joelhos e tomba de peito
      // 1. Corpo recuando
      ctx.save();
      ctx.translate(-t * 12, t * 8);
      ctx.rotate(-t * 0.75);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-R * 0.45, -R * 0.35, R * 0.75, R * 0.6);
      // Elmo bico de pato descolando
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.arc(0, -R * 0.5, R * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Pavês desabando no chão com reverberação
      ctx.save();
      ctx.translate(R * 0.2 + t * 14, t * 10);
      ctx.rotate(t * 0.65);
      ctx.scale(1, Math.max(0.12, 1 - t * 0.65));
      ctx.fillStyle = '#3b2314';
      ctx.fillRect(0, -R * 0.8, R * 0.55, R * 1.6);
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, -R * 0.8, R * 0.55, R * 1.6);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect((R * 0.55) * 0.35, -R * 0.8 + 3, 3.5, R * 1.6 - 6);
      ctx.restore();
      break;
    }

    case 'GOLEM': {
      // Fragmentação monolítica: corpo se parte em 4 blocos que despencam em direções opostas
      ctx.translate(0, t * 10);
      const splitDist = t * 12;

      // 4 Blocos de cantaria se separando
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-R * 0.85 - splitDist, -R * 0.6 - splitDist * 0.5, R * 0.75, R * 0.6);
      ctx.fillRect(splitDist * 0.5, -R * 0.6 - splitDist * 0.5, R * 0.75, R * 0.6);
      ctx.fillRect(-R * 0.85 - splitDist * 0.5, splitDist * 0.4, R * 0.75, R * 0.6);
      ctx.fillRect(splitDist, splitDist * 0.4, R * 0.75, R * 0.6);

      // Vergalhões de ferro torcidos
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-R * 0.5, -R * 0.3);
      ctx.lineTo(-R * 0.9 - splitDist, -R * 0.7);
      ctx.moveTo(R * 0.5, -R * 0.3);
      ctx.lineTo(R * 0.9 + splitDist, -R * 0.7);
      ctx.stroke();

      // Crânios do ossário rolando
      ctx.fillStyle = '#dfe4ea';
      ctx.beginPath();
      ctx.arc(-splitDist * 0.8, -splitDist * 0.6, 3.8, 0, Math.PI * 2);
      ctx.arc(splitDist * 0.8, -splitDist * 0.4, 3.8, 0, Math.PI * 2);
      ctx.fill();

      // Poeira de impacto no solo
      if (t > 0.35) {
        ctx.fillStyle = 'rgba(127, 140, 141, 0.6)';
        for (let d = 0; d < 5; d++) {
          const da = d * 1.25 + t * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(da) * (splitDist + 8), R * 0.4 + Math.sin(da) * 5, 4 + d, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'EXPLODER': {
      // Ruptura da redoma dorsal de vidro com ejeção de piche fervente e brasas
      const burst = 1 + t * 1.8;
      ctx.scale(burst, burst);

      // Clarão central
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, R * 0.65 * (1 - t * 1.2)), 0, Math.PI * 2);
      ctx.fill();

      // Piche e brasas incandescentes
      ctx.fillStyle = '#e67e22';
      for (let sh = 0; sh < 7; sh++) {
        const sa = sh * (Math.PI * 2 / 7) + t * 1.8;
        const sDist = R * (0.8 + t * 2.2);
        ctx.fillRect(Math.cos(sa) * sDist - 2.5, Math.sin(sa) * sDist - 2.5, 5, 5);
      }
      ctx.fillStyle = '#d35400';
      ctx.fillRect(-R * 0.3, -R * 0.3, R * 0.6, R * 0.6);
      break;
    }

    case 'NECRO': {
      // As vestes escuras desabam vazias no solo enquanto três almas sobem ao céu
      ctx.translate(0, t * 10);
      ctx.scale(1 + t * 0.3, Math.max(0.05, 1 - t * 0.92));

      // Vestes colapsando
      ctx.fillStyle = '#100c19';
      ctx.beginPath();
      ctx.moveTo(-R * 0.75, R * 0.7);
      ctx.lineTo(0, -R * 0.35);
      ctx.lineTo(R * 0.75, R * 0.7);
      ctx.closePath();
      ctx.fill();

      // Estola e mitra douradas no chão
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Três chamas de alma subindo em espiral aos céus
      ctx.fillStyle = '#00cec9';
      for (let sm = 0; sm < 3; sm++) {
        const sma = sm * 2.09 + t * 4;
        const sx = Math.cos(sma) * (6 + sm * 3);
        const sy = -R * 0.4 - t * 24 - sm * 5;
        ctx.beginPath();
        ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'SHOOTER': {
      // Tripé mecânico cede, canhões disparam estalo terminal e tambor tomba
      ctx.translate(0, t * 10);
      ctx.scale(1 + t * 0.15, Math.max(0.08, 1 - t * 0.8));

      // Caldeira principal tombada
      ctx.fillStyle = '#12171f';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Canhões se desprendendo e rolando
      ctx.save();
      ctx.translate(R * 0.4 + t * 10, t * 8);
      ctx.rotate(t * 1.1);
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(0, -3.5, R * 0.85, 7);
      ctx.restore();

      // Faíscas elétricas e vapor
      if (t > 0.2) {
        ctx.fillStyle = '#74b9ff';
        ctx.fillRect((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, 3, 3);
      }
      break;
    }

    case 'STALKER': {
      // Máscara parte ao meio, adagas cravam no solo e mortalha desfaz-se em fitas
      // Metade esquerda da máscara voando para a esquerda
      ctx.save();
      ctx.translate(-t * 14, -t * 5);
      ctx.rotate(-t * 1.0);
      ctx.fillStyle = '#dfe4ea';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.4, Math.PI * 0.5, Math.PI * 1.5);
      ctx.fill();
      ctx.restore();

      // Metade direita voando para a direita
      ctx.save();
      ctx.translate(t * 14, -t * 5);
      ctx.rotate(t * 1.0);
      ctx.fillStyle = '#dfe4ea';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.4, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
      ctx.restore();

      // Adagas kris caindo no solo
      ctx.save();
      ctx.translate(0, t * 12);
      ctx.rotate(t * 1.4);
      ctx.strokeStyle = '#7158e2';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(4, 0);
      ctx.lineTo(-4, 8);
      ctx.stroke();
      ctx.restore();

      // Fitas de seda etérea dissipando
      ctx.strokeStyle = 'rgba(155, 89, 182, 0.7)';
      ctx.lineWidth = 1.5;
      for (let s = 0; s < 3; s++) {
        const sa = s * 2.1 + t * 3;
        ctx.beginPath();
        ctx.arc(0, 0, R * (0.6 + t * 0.8), sa, sa + 0.8);
        ctx.stroke();
      }
      break;
    }

    case 'SPLITTER':
    case 'SPLITTER_MINI': {
      // Sutura dorsal racha ao meio, cascas se separam e ejetam gosma e vesículas
      const burst = t < 0.3 ? (1 + t * 1.8) : Math.max(0.05, 1.54 - (t - 0.3) * 2.1);
      ctx.scale(burst, burst);

      // Duas metades da carapaça se afastando
      ctx.fillStyle = '#08483f';
      ctx.beginPath();
      ctx.ellipse(-R * 0.35, -t * 12, R * 0.6, R * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-R * 0.35, t * 12, R * 0.6, R * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Projeção de fluido verde e vesículas
      ctx.fillStyle = '#2ecc71';
      for (let sl = 0; sl < 6; sl++) {
        const sa = sl * (Math.PI * 2 / 6) + t * 2.8;
        const sDist = R * (0.6 + t * 1.8);
        ctx.fillRect(Math.cos(sa) * sDist - 2.5, Math.sin(sa) * sDist - 2.5, 5, 5);
      }
      break;
    }

    case 'TRAIL_CRAWLER': {
      // Lacraia convulsiona e os 4 segmentos se desencaixam sequencialmente
      for (let s = 0; s < 4; s++) {
        const shiftX = (s % 2 === 0 ? t * 10 : -t * 10) * (s + 1) * 0.35;
        const shiftY = (s % 2 === 0 ? t * 6 : -t * 6) + t * 8;
        const sx = -R * 0.45 * s + shiftX;
        const sy = shiftY;

        ctx.fillStyle = '#0e5344';
        ctx.beginPath();
        ctx.ellipse(sx, sy, R * 0.42, R * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }
      break;
    }

    case 'CRYPT_WEAVER': {
      // Crânio parte-se, 8 patas se curvam para dentro em espasmo e corpo vira
      ctx.translate(0, t * 10);
      ctx.rotate(t * 0.5);

      // Crânio partindo ao meio
      ctx.fillStyle = '#95a5a6';
      ctx.beginPath();
      ctx.arc(R * 0.2 - t * 4, 0, R * 0.38, 0, Math.PI * 2);
      ctx.arc(R * 0.2 + t * 4, 0, R * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Patas aracnídeas encolhendo em espasmo
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 2.0;
      for (let lp = -1; lp <= 1; lp += 2) {
        ctx.beginPath();
        ctx.moveTo(0, lp * R * 0.2);
        ctx.lineTo(-R * 0.6 * (1 - t * 0.7), lp * R * 0.6 * (1 - t * 0.7));
        ctx.stroke();
      }
      break;
    }

    case 'CHAIN_FLAYER': {
      // Algoz tomba de joelhos, correntes caem e amontoam, gancho desliza no solo
      ctx.translate(0, t * 12);
      ctx.rotate(t * 0.4);
      ctx.scale(1 + t * 0.15, Math.max(0.08, 1 - t * 0.8));

      // Corpo e avental ensanguentado
      ctx.fillStyle = '#3b1c1c';
      ctx.fillRect(-R * 0.5, -R * 0.35, R * 0.85, R * 0.8);

      // Capuz caído
      ctx.fillStyle = '#1e1616';
      ctx.beginPath();
      ctx.arc(R * 0.1, -R * 0.45, R * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Gancho e correntes amontoadas no chão
      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(R * 0.2, R * 0.35);
      ctx.lineTo(R * 0.8 + t * 10, R * 0.45);
      ctx.stroke();
      break;
    }

    case 'BASALT_GARGOYLE': {
      // Veias de magma esfriam para preto, corpo petrifica e quebra em blocos de basalto
      ctx.translate(0, t * 12);
      ctx.scale(1 + t * 0.2, Math.max(0.08, 1 - t * 0.85));

      const stoneCol = t > 0.4 ? '#2f3542' : '#57606f';
      ctx.fillStyle = stoneCol;

      // Asas de pedra partindo
      ctx.fillRect(-R * 1.2 - t * 10, -R * 0.4, R * 0.6, R * 0.5);
      ctx.fillRect(R * 0.6 + t * 10, -R * 0.4, R * 0.6, R * 0.5);

      // Cabeça de cantaria caindo
      ctx.beginPath();
      ctx.arc(0, t * 8, R * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Faíscas de magma esfriando
      if (t < 0.6) {
        ctx.fillStyle = '#e67e22';
        ctx.fillRect((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, 3.5, 3.5);
      }
      break;
    }

    case 'TOLL_BELLRINGER': {
      // Armação parte, sino tomba rolando no chão e monge desaba
      ctx.translate(0, t * 14);
      ctx.rotate(t * 0.45);

      // Monge caído
      ctx.fillStyle = '#3b2f27';
      ctx.fillRect(-R * 0.5, -R * 0.2, R * 0.7, R * 0.55);

      // Sino de bronze rolando com badalo solto
      ctx.save();
      ctx.translate(R * 0.4 + t * 10, t * 6);
      ctx.rotate(t * 1.4);
      ctx.fillStyle = '#b8860b';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a085';
      ctx.fillRect(-R * 0.48, R * 0.35, R * 0.96, 3.5);
      ctx.restore();
      break;
    }

    case 'PLAGUE_APOTHECARY': {
      // Cartola salta, frascos de poção estilhaçam em poça esmeralda e médico tomba
      ctx.translate(0, t * 10);
      ctx.rotate(-t * 0.45);

      // Corpo
      ctx.fillStyle = '#141a21';
      ctx.fillRect(-R * 0.4, -R * 0.3, R * 0.8, R * 0.7);

      // Cartola voando para o alto
      ctx.save();
      ctx.translate(-R * 0.8 - t * 8, -R * 0.6 - t * 10);
      ctx.rotate(-t * 2);
      ctx.fillStyle = '#0a0d12';
      ctx.fillRect(0, 0, 9, 9);
      ctx.restore();

      // Poções estilhaçadas e vapor tóxico verde
      ctx.fillStyle = '#2ecc71';
      for (let p = 0; p < 5; p++) {
        const pa = p * 1.3 + t * 2.5;
        ctx.fillRect(Math.cos(pa) * (R * 0.8) - 2.5, Math.sin(pa) * (R * 0.8) - 2.5, 4.5, 4.5);
      }
      break;
    }

    case 'RUNE_SCRIBE': {
      // O grimório explode em páginas incandescentes que voam em redemoinho
      ctx.scale(1 + t * 0.3, Math.max(0.05, 1 - t * 0.92));

      // Folhas de pergaminho se espalhando
      ctx.fillStyle = '#d2c29d';
      for (let pg = 0; pg < 6; pg++) {
        const pga = pg * 1.05 + t * 3.0;
        const pgd = R * (0.4 + t * 1.5);
        ctx.fillRect(Math.cos(pga) * pgd - 3.5, Math.sin(pga) * pgd - 3.5, 7, 9);
      }

      // Brasas mágicas azuis
      ctx.fillStyle = '#00cec9';
      for (let f = 0; f < 3; f++) {
        ctx.fillRect(Math.sin(t * 4 + f) * 8, -R * 0.5 - t * 14 - f * 4, 3.5, 3.5);
      }
      break;
    }

    case 'FORGE_PYREGUARD': {
      // Porta da fornalha é ejetada com coluna de chamas e chassi colapsa
      const blast = 1 + t * 0.45;
      ctx.scale(blast, Math.max(0.08, 1 - t * 0.82));

      // Caldeira principal
      ctx.fillStyle = '#14181a';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Labareda escapando
      ctx.fillStyle = t < 0.5 ? '#f1c40f' : '#e67e22';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, R * (0.85 * (1 - t))), 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'MAIDEN_THORNS': {
      // Portas se escancaram, estiletes saltam e o sarcófago tomba pesado de costas
      ctx.translate(0, t * 12);
      ctx.scale(1, Math.max(0.08, 1 - t * 0.85));

      // Sarcófago pesado
      ctx.fillStyle = '#232931';
      ctx.fillRect(-R * 0.6, -R * 0.8, R * 1.2, R * 1.6);

      // Estiletes ejetados para os lados
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-R * 0.6, -R * 0.2);
      ctx.lineTo(-R * 1.3 - t * 10, -R * 0.3);
      ctx.moveTo(R * 0.6, -R * 0.2);
      ctx.lineTo(R * 1.3 + t * 10, -R * 0.3);
      ctx.stroke();
      break;
    }

    case 'MIRROR_BANSHEE': {
      // Estilhaçamento de vidro espelhado completo: cacos refletivos em 360°
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 8; s++) {
        const sa = s * (Math.PI / 4) + t * 1.8;
        const sDist = R * (0.3 + t * 2.2);
        ctx.beginPath();
        ctx.moveTo(Math.cos(sa) * sDist, Math.sin(sa) * sDist);
        ctx.lineTo(Math.cos(sa + 0.3) * (sDist + 8), Math.sin(sa + 0.3) * (sDist + 8));
        ctx.lineTo(Math.cos(sa - 0.2) * (sDist + 6), Math.sin(sa - 0.2) * (sDist + 6));
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'DULLAHAN_VANGUARD': {
      // Lança quebra, cavaleiro cai de joelhos e elmo degolado rola com olhos apagando
      ctx.translate(0, t * 12);
      ctx.scale(1 + t * 0.1, Math.max(0.08, 1 - t * 0.82));

      // Couraça de placas
      ctx.fillStyle = '#0c0f12';
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 0.55, R * 0.68, 0, 0, Math.PI * 2);
      ctx.fill();

      // Elmo degolado rolando para a esquerda
      ctx.save();
      ctx.translate(-R * 0.8 - t * 12, t * 6);
      ctx.rotate(-t * 2.5);
      ctx.fillStyle = '#1e242c';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Lança partida ao lado
      ctx.strokeStyle = '#57606f';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(R * 0.3, 0);
      ctx.lineTo(R * 1.3 + t * 8, t * 8);
      ctx.stroke();
      break;
    }

    case 'SNIPER_CULTIST': {
      // Arco de ossos estala, penas negras dispersam e cultista tomba
      ctx.translate(0, t * 10);
      ctx.rotate(-t * 0.4);
      ctx.scale(1, Math.max(0.08, 1 - t * 0.85));

      ctx.fillStyle = '#22183b';
      ctx.fillRect(-R * 0.35, -R * 0.45, R * 0.7, R * 0.8);

      // Arco de ossos quebrado
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(R * 0.5, -R * 0.6);
      ctx.lineTo(R * 0.6 + t * 6, -R * 0.1);
      ctx.moveTo(R * 0.5, R * 0.6);
      ctx.lineTo(R * 0.6 + t * 6, R * 0.1);
      ctx.stroke();

      // Penas negras flutuando
      ctx.fillStyle = '#0c0717';
      ctx.fillRect(-t * 8, -R * 0.6 - t * 6, 4.5, 3.5);
      ctx.fillRect(t * 8, -R * 0.4 - t * 10, 4.5, 3.5);
      break;
    }

    case 'VOID_SCAVENGER': {
      // Duende capota em cambalhota, sacola rompe espalhando gemas e moedas
      ctx.translate(0, t * 12);
      ctx.rotate(t * 1.2);
      ctx.scale(Math.max(0.05, 1 - t * 0.8), Math.max(0.05, 1 - t * 0.8));

      ctx.fillStyle = '#1d7358';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Gemas saltando em leque
      const gems = ['#ff4757', '#00cec9', '#f1c40f', '#e056fd'];
      for (let g = 0; g < 7; g++) {
        const ga = g * 0.9 + t * 2.2;
        const gd = R * (0.6 + t * 2.4);
        ctx.fillStyle = gems[g % 4];
        ctx.fillRect(Math.cos(ga) * gd - 2.5, Math.sin(ga) * gd - 2.5, 5, 5);
      }
      break;
    }

    case 'GRAVE_GORGON': {
      // As 4 pétalas da mandíbula abrem em espasmo terminal e fecham imóveis
      ctx.translate(0, t * 8);
      ctx.scale(1 + t * 0.15, Math.max(0.08, 1 - t * 0.8));

      ctx.fillStyle = '#47535e';
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 0.68, R * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bocarra cavernosa
      ctx.fillStyle = '#080204';
      ctx.beginPath();
      ctx.arc(R * 0.35, 0, Math.max(1, R * 0.4 * (1 - t * 0.6)), 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'CURSED_CHEST': {
      // Tábuas de carvalho se partem, dentes e dobradiças saltam e língua derrete
      ctx.translate(0, t * 8);
      ctx.scale(1 + t * 0.2, Math.max(0.08, 1 - t * 0.85));

      // Tábuas partindo
      ctx.fillStyle = '#3e2718';
      ctx.fillRect(-R * 0.8 - t * 8, -R * 0.35, R * 0.75, R * 0.65);
      ctx.fillRect(t * 8, -R * 0.35, R * 0.75, R * 0.65);

      // Dentes e pregos espalhados
      ctx.fillStyle = '#dfe4ea';
      for (let n = 0; n < 5; n++) {
        const na = n * 1.25 + t * 3;
        ctx.fillRect(Math.cos(na) * (R * 0.8) - 2, Math.sin(na) * (R * 0.8) - 2, 4, 4);
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