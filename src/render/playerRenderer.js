/**
 * src/render/playerRenderer.js
 * 
 * Módulo especializado na renderização do herói jogável, estados especiais
 * (phasing, invisibilidade, fúria berserk, investida sagrada, passo ígneo),
 * auras sagradas, bíblias orbitais e machados giratórios nórdicos.
 */
import { ctx, frameCount, bullets } from '../main.js';
import { player, selectedHeroKey } from '../entities/player.js';
import { CHARACTERS } from '../config/characters.js';

/**
 * Renderiza o pulso e anéis luminosos da Aura Sagrada / Santuário Celestial.
 */
export function drawPlayerAura() {
  if (player.auraLvl <= 0 && !player.evolvedAura) return;

  const auraRadius = (player.evolvedAura ? 150 : 65) + player.auraLvl * 18;
  const pulse = Math.sin(frameCount * 0.15) * 3;
  ctx.strokeStyle = player.evolvedAura ? 'rgba(241, 196, 15, 0.75)' : 'rgba(241, 196, 15, 0.4)';
  ctx.lineWidth = player.evolvedAura ? 4 : 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, auraRadius + pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = player.evolvedAura ? 'rgba(241, 196, 15, 0.12)' : 'rgba(241, 196, 15, 0.04)';
  ctx.fill();
}

/**
 * Renderiza as Bíblias Astrais / Livros Orbitais em translação circular.
 */
export function drawPlayerOrbitals() {
  if (player.orbitals <= 0) return;

  const orbDist = player.evolvedOrbitals ? 88 : 72;
  const isEvolved = !!player.evolvedOrbitals;

  // 1. Anel Guia Orbital Celestial
  ctx.strokeStyle = isEvolved 
    ? 'rgba(241, 196, 15, 0.28)' 
    : 'rgba(52, 152, 219, 0.20)';
  ctx.lineWidth = isEvolved ? 2.2 : 1.4;
  ctx.beginPath();
  ctx.arc(player.x, player.y, orbDist, 0, Math.PI * 2);
  ctx.stroke();

  // Anel pontilhado rúnico sutil no entorno
  ctx.save();
  ctx.setLineDash([4, 8]);
  ctx.strokeStyle = isEvolved 
    ? 'rgba(243, 156, 18, 0.18)' 
    : 'rgba(41, 128, 185, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, orbDist + (isEvolved ? 6 : 4), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 2. Renderização de Cada Tomo Celestial Aberto e seus Rastros
  const bookW = isEvolved ? 26 : 22;
  const bookH = isEvolved ? 18 : 15;
  const halfW = bookW / 2;
  const halfH = bookH / 2;

  for (let oIdx = 0; oIdx < player.orbitals; oIdx++) {
    const angle = player.orbitalAngle + (oIdx * (Math.PI * 2 / player.orbitals));
    const ox = player.x + Math.cos(angle) * orbDist;
    const oy = player.y + Math.sin(angle) * orbDist;

    // Rastro Estelar (Trail) atrás do tomo
    const trailLength = isEvolved ? 0.38 : 0.24;
    const trailSteps = 5;
    for (let s = 1; s <= trailSteps; s++) {
      const tAngle = angle - (trailLength * (s / trailSteps));
      const tx = player.x + Math.cos(tAngle) * orbDist;
      const ty = player.y + Math.sin(tAngle) * orbDist;
      const alpha = (1 - s / trailSteps) * (isEvolved ? 0.35 : 0.22);
      ctx.fillStyle = isEvolved 
        ? `rgba(241, 196, 15, ${alpha})` 
        : `rgba(0, 206, 201, ${alpha})`;
      ctx.beginPath();
      ctx.arc(tx, ty, (isEvolved ? 6.5 : 4.5) * (1 - s / trailSteps), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angle + Math.PI / 2);

    // Halo de Luz Sagrada ao redor do livro
    const haloRadius = isEvolved ? 26 : 20;
    const haloGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, haloRadius);
    haloGrad.addColorStop(0, isEvolved ? 'rgba(241, 196, 15, 0.35)' : 'rgba(52, 152, 219, 0.30)');
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // 1. Capa de Couro Mística Externa (ângulo aberto)
    ctx.fillStyle = isEvolved ? '#b7791f' : '#1b3a4b';
    ctx.beginPath();
    ctx.roundRect(-halfW - 1, -halfH - 1, bookW + 2, bookH + 2, 2);
    ctx.fill();
    ctx.strokeStyle = isEvolved ? '#f1c40f' : '#3498db';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Páginas de Pergaminho Abertas
    // Página Esquerda
    const pageGradLeft = ctx.createLinearGradient(-halfW, 0, 0, 0);
    pageGradLeft.addColorStop(0, '#e8e2d5');
    pageGradLeft.addColorStop(1, '#fcfbfa');
    ctx.fillStyle = pageGradLeft;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, halfW - 0.5, bookH, [2, 0, 0, 2]);
    ctx.fill();

    // Página Direita
    const pageGradRight = ctx.createLinearGradient(0, 0, halfW, 0);
    pageGradRight.addColorStop(0, '#fcfbfa');
    pageGradRight.addColorStop(1, '#e8e2d5');
    ctx.fillStyle = pageGradRight;
    ctx.beginPath();
    ctx.roundRect(0.5, -halfH, halfW - 0.5, bookH, [0, 2, 2, 0]);
    ctx.fill();

    // 3. Linhas de Encantamento / Texto Rúnico
    ctx.strokeStyle = isEvolved ? 'rgba(217, 119, 6, 0.45)' : 'rgba(41, 128, 185, 0.40)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-halfW + 2, -3); ctx.lineTo(-2, -3);
    ctx.moveTo(-halfW + 2, 0);  ctx.lineTo(-2, 0);
    ctx.moveTo(-halfW + 2, 3);  ctx.lineTo(-2, 3);
    ctx.moveTo(2, -3); ctx.lineTo(halfW - 2, -3);
    ctx.moveTo(2, 0);  ctx.lineTo(halfW - 2, 0);
    ctx.moveTo(2, 3);  ctx.lineTo(halfW - 2, 3);
    ctx.stroke();

    // 4. Lombada Central
    ctx.fillStyle = isEvolved ? '#78350f' : '#0f172a';
    ctx.fillRect(-0.75, -halfH - 1, 1.5, bookH + 2);

    // 5. Cruz Sagrada / Runa Luminosa
    ctx.fillStyle = isEvolved ? '#fef08a' : '#38bdf8';
    ctx.fillRect(-0.75, -4, 1.5, 8);
    ctx.fillRect(-3, -2, 6, 1.5);

    // Ponto de luz divino
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -1.25, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Renderiza os Machados Giratórios Nórdicos de Kragdor, arcos de vento,
 * esteiras de corte (ribbons) e indicação visual do gume afiado (sweet spot).
 */
export function drawSpinningAxes() {
  if (player.axeCount <= 0) return;

  const count = player.evolvedAxe ? Math.max(player.axeCount, 6) : player.axeCount;
  const r = player.axeRadius || 56;
  const isBerserk = (player.berserkTimer || 0) > 0;
  const isEvolved = !!player.evolvedAxe;

  // 1. Anel Guia Orbital
  ctx.strokeStyle = isEvolved 
    ? 'rgba(230, 126, 34, 0.45)' 
    : (isBerserk ? 'rgba(231, 76, 60, 0.40)' : 'rgba(241, 196, 15, 0.22)');
  ctx.lineWidth = isEvolved ? 3.0 : (isBerserk ? 2.5 : 1.8);
  ctx.beginPath();
  ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Renderização de cada Machado Nórdico e seu Rastro de Corte
  for (let i = 0; i < count; i++) {
    const angle = player.axeAngle + (i * (Math.PI * 2 / count));
    const ax = player.x + Math.cos(angle) * r;
    const ay = player.y + Math.sin(angle) * r;

    // 2.1 Esteira Dinâmica de Corte em Arco (Motion Ribbon com Sweet Spot na ponta)
    const trailLength = isBerserk ? 0.72 : (isEvolved ? 0.58 : 0.44);
    const ribbonStart = angle - trailLength;

    // Faixa exterior incandescente (indica o gume afiado do corte no arco orbital)
    ctx.strokeStyle = isBerserk 
      ? 'rgba(231, 76, 60, 0.65)' 
      : (isEvolved ? 'rgba(243, 156, 18, 0.60)' : 'rgba(241, 196, 15, 0.40)');
    ctx.lineWidth = isEvolved ? 9 : (isBerserk ? 8 : 5);
    ctx.beginPath();
    ctx.arc(player.x, player.y, r + 4, ribbonStart, angle);
    ctx.stroke();

    // Faixa de fogo/plasma estendida no vácuo de corte
    ctx.strokeStyle = isBerserk 
      ? 'rgba(243, 156, 18, 0.35)' 
      : (isEvolved ? 'rgba(230, 126, 34, 0.35)' : 'rgba(241, 196, 15, 0.18)');
    ctx.lineWidth = isEvolved ? 18 : 12;
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, ribbonStart + 0.08, angle);
    ctx.stroke();

    // 2.2 Desenho do Machado de Guerra Nórdico (Bearded Greataxe)
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle + Math.PI / 2);

    const shaftWood = '#3d271d';
    const steelDark = '#2c3e50';
    const steelMid = isEvolved ? '#d35400' : (isBerserk ? '#c0392b' : '#7f8c8d');
    const steelLight = isEvolved ? '#f39c12' : (isBerserk ? '#e74c3c' : '#bdc3c7');
    const edgeGlow = isEvolved ? '#ffffff' : (isBerserk ? '#ffffff' : '#f1c40f');

    // Cabo de Madeira Rústico voltado para o centro orbital (local +Y)
    ctx.fillStyle = shaftWood;
    ctx.fillRect(-2.5, -12, 5, 38);

    // Tiras de Couro Cruzadas no Cabo
    ctx.strokeStyle = '#1e130c';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let w = -4; w <= 20; w += 6) {
      ctx.moveTo(-2.5, w);
      ctx.lineTo(2.5, w + 3.5);
    }
    ctx.stroke();

    // Pomo Inferior de Ferro com Espigão de Contrapeso
    ctx.fillStyle = steelDark;
    ctx.fillRect(-3.5, 23, 7, 3.5);
    ctx.beginPath();
    ctx.moveTo(-2, 26.5);
    ctx.lineTo(2, 26.5);
    ctx.lineTo(0, 30.5);
    ctx.closePath();
    ctx.fill();

    // Braçadeira de Fixação da Cabeça do Machado (Eye / Collar)
    ctx.fillStyle = steelDark;
    ctx.fillRect(-3.5, -14, 7, 10);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-1.0, -11, 2, 2);

    // --- Cabeça do Machado (Lâmina Nórdica Assimétrica / Bearded Axe) ---
    // Lâmina Frontal (Voltada para a direção do corte orbital, local +X)
    ctx.fillStyle = steelMid;
    ctx.beginPath();
    ctx.moveTo(2.5, -14);
    ctx.lineTo(15, -18);                                 // Ponta superior afiada
    ctx.quadraticCurveTo(20, -9, 14, 2);                 // Curva pronunciada da barba nórdica
    ctx.quadraticCurveTo(8, -1, 2.5, -5);                // Reentrância inferior voltando ao cabo
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = steelDark;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Bisel de Desbaste Interno da Lâmina
    ctx.fillStyle = steelLight;
    ctx.beginPath();
    ctx.moveTo(4, -13);
    ctx.lineTo(14, -16.5);
    ctx.quadraticCurveTo(18, -9, 13, 0.5);
    ctx.lineTo(5, -4.5);
    ctx.closePath();
    ctx.fill();

    // Gume de Corte Afiado (Sweet Spot: Corte Crítico e Cura da Passiva)
    ctx.strokeStyle = edgeGlow;
    ctx.lineWidth = isBerserk || isEvolved ? 2.8 : 2.0;
    ctx.beginPath();
    ctx.moveTo(15, -18);
    ctx.quadraticCurveTo(20, -9, 14, 2);
    ctx.stroke();

    // Runas Mágicas Entalhadas na Lâmina
    ctx.strokeStyle = isBerserk ? '#ffffff' : (isEvolved ? '#ffffff' : '#f39c12');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(7, -12);
    ctx.lineTo(11, -9);
    ctx.lineTo(8, -6);
    ctx.stroke();

    // --- Espigão / Quebra-Armaduras Traseiro (Local -X) ---
    if (isEvolved) {
      // Na Tempestade de Aço, o machado torna-se de Lâmina Dupla Titânica
      ctx.fillStyle = steelMid;
      ctx.beginPath();
      ctx.moveTo(-2.5, -14);
      ctx.lineTo(-15, -18);
      ctx.quadraticCurveTo(-20, -9, -14, 2);
      ctx.quadraticCurveTo(-8, -1, -2.5, -5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = steelDark;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = steelLight;
      ctx.beginPath();
      ctx.moveTo(-4, -13);
      ctx.lineTo(-14, -16.5);
      ctx.quadraticCurveTo(-18, -9, -13, 0.5);
      ctx.lineTo(-5, -4.5);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = edgeGlow;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-15, -18);
      ctx.quadraticCurveTo(-20, -9, -14, 2);
      ctx.stroke();
    } else {
      // Machado Padrão: Espigão Quebra-Crânios Rústico na Traseira
      ctx.fillStyle = steelDark;
      ctx.beginPath();
      ctx.moveTo(-2.5, -13);
      ctx.lineTo(-9.5, -10);
      ctx.lineTo(-2.5, -7);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = steelLight;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Renderiza todos os equipamentos orbitais e auras ativas do jogador.
 */
export function drawPlayerEquipment() {
  drawPlayerAura();
  drawPlayerOrbitals();
  drawSpinningAxes();
}

/**
 * Renderiza proceduralmente o personagem jogável selecionado e seus efeitos corporais.
 */
export function renderHeroModel(c, heroKey, state = {}) {
  const charDef = CHARACTERS[heroKey] || CHARACTERS.KNIGHT;
  const x = state.x || 0;
  const y = state.y || 0;
  const facing = state.facing !== undefined ? state.facing : 1;
  const scale = state.scale !== undefined ? state.scale : 1;
  const isMoving = !!state.isMoving;
  const walkCycle = state.walkCycle || 0;
  const tFrame = state.tFrame !== undefined ? state.tFrame : 0;
  const berserkTimer = state.berserkTimer || 0;
  const invisTimer = state.invisTimer || 0;
  const radius = state.radius || 14;
  const dashDuration = state.dashDuration || 0;
  const ignisDashDuration = state.ignisDashDuration || 0;
  const staffCastTimer = state.staffCastTimer || 0;
  const iFrames = state.iFrames || 0;
  const isRetaliating = state.isRetaliating !== undefined ? state.isRetaliating : (iFrames > 12);
  const isHammerAttacking = !!state.isHammerAttacking;
  const isBerserk = state.isBerserk !== undefined ? state.isBerserk : (berserkTimer > 0);
  const fluidColor = state.fluidColor || (state.evolvedPotion ? '#00cec9' : '#2ecc71');
  const isCasting = state.isCasting !== undefined ? state.isCasting : (staffCastTimer > 0 || !!state.isStaffCasting);
  const isPhasing = state.isPhasing !== undefined ? state.isPhasing : (invisTimer > 0 || !!state.isPhasing);
  const isAttacking = !!state.isSwordAttacking;
  const isDashing = state.isDashing !== undefined ? state.isDashing : (dashDuration > 0 || ignisDashDuration > 0);

  c.save();
  c.translate(x, y);
  c.scale(facing * scale, scale);

  if (berserkTimer > 0 || isBerserk) {
    const bPulse = Math.sin(tFrame * 0.3) * 4;
    c.strokeStyle = 'rgba(231, 76, 60, 0.8)';
    c.lineWidth = 3.5;
    c.beginPath();
    c.arc(0, 2, radius + 10 + bPulse, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = 'rgba(230, 126, 34, 0.22)';
    c.fill();
  }

  if (invisTimer > 0) {
    c.globalAlpha = 0.45;
  }

  const bob = isMoving ? Math.sin(walkCycle * 2) * 2.5 : Math.sin(tFrame * 0.05) * 0.8;
  const legSwing = isMoving ? Math.sin(walkCycle) * 5.5 : 0;
  const capeWave = isMoving ? Math.sin(walkCycle) * 4 : Math.sin(tFrame * 0.08) * 1.5;

  if (state.showShadow !== false) {
    c.fillStyle = 'rgba(0, 0, 0, 0.45)';
    c.beginPath();
    c.ellipse(0, 15, 14, 6, 0, 0, Math.PI * 2);
    c.fill();
  }

  if (heroKey === 'KNIGHT') {
    // isDashing handled via state
    // isRetaliating handled via state
    // O martelo nas costas desaparece no instante em que o ataque HAMMER_SLAM está ativo
    // isHammerAttacking handled via state
    const cCol = charDef.color;
    const steelMid = cCol.armor || '#718093';
    const steelLight = cCol.armorLight || '#dcdde1';
    const steelDark = cCol.armorDark || '#2f3640';
    const goldTrim = cCol.trim || '#fbc531';
    const goldDark = cCol.trimDark || '#c79810';
    const plumeCol = cCol.plume || '#8e44ad';
    const tabardCol = cCol.tabard || '#f5f6fa';
    const hammerWood = cCol.hammerWood || '#3d271d';
    const hammerSteel = cCol.hammerSteel || '#57606f';
    const hammerGold = cCol.hammerGold || '#f1c40f';

    // --- ULT: Pós-Imagens Douradas e Solo Sagrado com Runas ---
    if (isDashing) {
      c.save();
      for (let g = 1; g <= 3; g++) {
        const ghostDist = g * 9;
        c.fillStyle = `rgba(241, 196, 15, ${0.32 / g})`;
        c.beginPath();
        c.ellipse(-ghostDist, 0, 12, 16, 0, 0, Math.PI * 2);
        c.fill();
      }
      // Solo Consagrado na base
      c.strokeStyle = 'rgba(241, 196, 15, 0.75)';
      c.lineWidth = 1.8;
      c.beginPath();
      c.ellipse(0, 14 + bob, 22, 7, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    // 1. Capa Nobre Dupla de Veludo
    c.fillStyle = cCol.capeInner || '#2c1045';
    c.beginPath();
    c.moveTo(-5, -2 + bob);
    c.lineTo(-17 - Math.abs(capeWave * 1.2), 17 + bob);
    c.lineTo(-10 - Math.abs(capeWave * 0.7), 19 + bob);
    c.lineTo(-3, 17 + bob);
    c.lineTo(2, -2 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = cCol.cape || '#481b6d';
    c.beginPath();
    c.moveTo(-5, -3 + bob);
    c.lineTo(-15 - Math.abs(capeWave * 1.1), 15 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.6), 17 + bob);
    c.lineTo(-2, 16 + bob);
    c.lineTo(3, -3 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.2;
    c.stroke();

    // 2. Coldre Dorsal do Martelo Sagrado (Visível em repouso, some no ataque)
    if (!isHammerAttacking) {
      c.save();
      c.translate(-2, -3 + bob);
      c.rotate(-0.58);

      // Cabo de carvalho no coldre com ataduras
      c.fillStyle = hammerWood;
      c.fillRect(-2, -4, 4, 30);
      c.strokeStyle = '#1e130c';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-2, 4); c.lineTo(2, 7);
      c.moveTo(-2, 12); c.lineTo(2, 15);
      c.stroke();

      // Pomo inferior de ferro
      c.fillStyle = hammerSteel;
      c.fillRect(-2.5, 25, 5, 3);

      // Cabeça titânica do martelo nas costas
      c.fillStyle = hammerSteel;
      c.fillRect(-9, -15, 18, 12);
      c.fillStyle = hammerGold;
      c.fillRect(-10, -13, 20, 3);
      c.fillRect(-10, -8, 20, 3);
      c.fillRect(-2, -15, 4, 12);

      // Espigão superior perfurante
      c.fillStyle = steelLight;
      c.beginPath();
      c.moveTo(0, -19);
      c.lineTo(3, -15);
      c.lineTo(-3, -15);
      c.closePath();
      c.fill();
      c.restore();
    }

    // 3. Pernas Blindadas, Grevas e Sabatons
    const legLeftX = -7 - legSwing * 0.4;
    const legRightX = 1.5 + legSwing * 0.4;

    c.fillStyle = steelDark;
    c.fillRect(legLeftX, 6 + bob, 5, 8);
    c.fillRect(legRightX, 6 + bob, 5, 8);

    c.fillStyle = steelMid;
    c.fillRect(legLeftX + 0.5, 7 + bob, 4, 6.5);
    c.fillRect(legRightX + 0.5, 7 + bob, 4, 6.5);
    c.fillStyle = steelLight;
    c.fillRect(legLeftX + 1.5, 7 + bob, 1.5, 6.5);
    c.fillRect(legRightX + 1.5, 7 + bob, 1.5, 6.5);

    // Joelheiras em losango (Poleyns)
    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(legLeftX + 2.5, 5.5 + bob);
    c.lineTo(legLeftX + 4.5, 7.5 + bob);
    c.lineTo(legLeftX + 2.5, 9.5 + bob);
    c.lineTo(legLeftX + 0.5, 7.5 + bob);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(legRightX + 2.5, 5.5 + bob);
    c.lineTo(legRightX + 4.5, 7.5 + bob);
    c.lineTo(legRightX + 2.5, 9.5 + bob);
    c.lineTo(legRightX + 0.5, 7.5 + bob);
    c.closePath();
    c.fill();

    // Sabatons
    c.fillStyle = steelDark;
    c.fillRect(legLeftX - 1, 12.5 + bob, 6.5, 3.5);
    c.fillRect(legRightX - 1, 12.5 + bob, 6.5, 3.5);
    c.fillStyle = steelLight;
    c.fillRect(legLeftX + 1, 13 + bob, 4, 1.8);
    c.fillRect(legRightX + 1, 13 + bob, 4, 1.8);

    // 4. Tronco com Couraça Chanfrada e Tabardo Sagrado
    c.fillStyle = steelMid;
    c.beginPath();
    c.moveTo(-9, -5 + bob);
    c.lineTo(9, -5 + bob);
    c.lineTo(6.5, 7 + bob);
    c.lineTo(-6.5, 7 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = steelDark;
    c.lineWidth = 1.4;
    c.stroke();

    // Tabardo monástico
    c.fillStyle = tabardCol;
    c.beginPath();
    c.moveTo(-5, -5 + bob);
    c.lineTo(5, -5 + bob);
    c.lineTo(4, 8.5 + bob);
    c.lineTo(-4, 8.5 + bob);
    c.closePath();
    c.fill();

    // Cruz frontal no tabardo
    c.fillStyle = cCol.tabardCross || '#c23616';
    c.fillRect(-1.2, -4 + bob, 2.4, 10);
    c.fillRect(-3.8, -1.5 + bob, 7.6, 2.4);

    // Cinto e correia do coldre dorsal
    c.fillStyle = '#2c1e18';
    c.fillRect(-7, 4.5 + bob, 14, 3.2);
    if (!isHammerAttacking) {
      c.strokeStyle = '#2c1e18';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(-6, -4 + bob);
      c.lineTo(5, 5 + bob);
      c.stroke();
    }
    c.fillStyle = goldTrim;
    c.fillRect(-2.5, 4.0 + bob, 5, 4.2);
    c.fillStyle = steelDark;
    c.fillRect(-1.2, 5.0 + bob, 2.4, 2.2);

    // 5. Ombreira Traseira e Braço Esquerdo
    c.fillStyle = steelDark;
    c.fillRect(-11, -3 + bob, 4, 8);
    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(-7, -6 + bob);
    c.lineTo(-14, -3 + bob);
    c.lineTo(-13, 2 + bob);
    c.lineTo(-8, 0 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = steelDark;
    c.lineWidth = 1.2;
    c.stroke();

    // 6. Cabeça e Grande Elmo Gótico (Greathelm)
    c.fillStyle = steelMid;
    c.beginPath();
    c.moveTo(-5.5, -6 + bob);
    c.lineTo(6.5, -6 + bob);
    c.lineTo(7.5, -14 + bob);
    c.lineTo(-4.5, -15.5 + bob);
    c.lineTo(-7.0, -9 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = steelDark;
    c.lineWidth = 1.4;
    c.stroke();

    // Crista superior do elmo
    c.fillStyle = steelLight;
    c.beginPath();
    c.moveTo(-1, -15.5 + bob);
    c.lineTo(2.5, -15 + bob);
    c.lineTo(2, -6 + bob);
    c.lineTo(-0.5, -6 + bob);
    c.closePath();
    c.fill();

    // Reforço em cruz de latão no visor
    c.fillStyle = goldTrim;
    c.fillRect(1.5, -13.5 + bob, 2, 7.5);
    c.fillRect(-2.5, -10.5 + bob, 8.5, 2.2);

    // Fenda ocular estilizada
    const glowCol = isDashing ? '#ffffff' : (cCol.eyeGlow || '#00d2d3');
    c.fillStyle = glowCol;
    c.fillRect(2.8, -10.2 + bob, 3.5, 1.4);
    c.fillStyle = '#ffffff';
    c.fillRect(4.5, -10.2 + bob, 1.5, 1.4);

    // Penacho Plumoso
    const plumeSway = isMoving ? Math.sin(walkCycle) * 3 : Math.sin(tFrame * 0.08) * 1.5;
    c.fillStyle = plumeCol;
    c.beginPath();
    c.moveTo(-3, -15 + bob);
    c.quadraticCurveTo(-9 - plumeSway, -21 + bob, -16 - Math.abs(plumeSway * 1.2), -15 + bob + plumeSway);
    c.quadraticCurveTo(-9 - plumeSway * 0.5, -14 + bob, -4, -13.5 + bob);
    c.closePath();
    c.fill();

    // 7. Pauldron Nobre Dianteiro
    c.fillStyle = steelLight;
    c.beginPath();
    c.moveTo(5, -6 + bob);
    c.lineTo(13.5, -4 + bob);
    c.lineTo(11.5, 2.5 + bob);
    c.lineTo(4, 0 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.6;
    c.stroke();

    // 8. Braço e Manopla (Postura Dinâmica de Empunhadura no Ataque)
    if (isHammerAttacking) {
      // Braços erguidos em postura pesada de ataque frontal de duas mãos
      c.fillStyle = steelMid;
      c.fillRect(5, -6 + bob, 6, 4.5);
      c.fillStyle = steelDark;
      c.fillRect(9, -8 + bob, 4.5, 4.5);
      c.fillStyle = goldTrim;
      c.fillRect(10, -7 + bob, 2.5, 2.5);
    } else {
      c.fillStyle = steelMid;
      c.fillRect(6, -2 + bob, 4.5, 7.5);
      c.fillStyle = steelDark;
      c.fillRect(6.5, 3 + bob, 4.5, 3.5);
      c.fillStyle = goldTrim;
      c.fillRect(7.5, 4 + bob, 1.5, 1.5);
    }

    // --- ULT: Asas Astrais de Éter e Aríete Frontal de Torre (Pavise) ---
    if (isDashing) {
      c.save();
      const wingFlap = Math.sin(tFrame * 0.45) * 6;

      // Asas Astrais Celestiais de Luz Translúcida
      c.fillStyle = 'rgba(241, 196, 15, 0.40)';
      c.strokeStyle = '#00d2d3';
      c.lineWidth = 2.0;

      // Asa Esquerda
      c.beginPath();
      c.moveTo(-4, -10 + bob);
      c.quadraticCurveTo(-18, -26 + wingFlap, -34, -18 + wingFlap);
      c.lineTo(-24, -8 + wingFlap * 0.5);
      c.lineTo(-30, 2 + wingFlap);
      c.lineTo(-14, 4 + bob);
      c.closePath();
      c.fill();
      c.stroke();

      // Asa Direita
      c.beginPath();
      c.moveTo(2, -10 + bob);
      c.quadraticCurveTo(14, -28 + wingFlap, 32, -22 + wingFlap);
      c.lineTo(22, -9 + wingFlap * 0.5);
      c.lineTo(28, 0 + wingFlap);
      c.lineTo(10, 2 + bob);
      c.closePath();
      c.fill();
      c.stroke();

      // Grande Aríete Sagrado Frontal (Escudo Torre Pavise)
      const pPulse = Math.sin(tFrame * 0.5) * 2.5;
      const shX = 16;
      c.fillStyle = 'rgba(241, 196, 15, 0.35)';
      c.strokeStyle = '#ffffff';
      c.lineWidth = 3.2;

      c.beginPath();
      c.moveTo(shX, -22 + pPulse);
      c.lineTo(shX + 11, -12);
      c.lineTo(shX + 10, 14);
      c.lineTo(shX, 22 - pPulse);
      c.lineTo(shX - 4, 16);
      c.lineTo(shX - 4, -16);
      c.closePath();
      c.fill();
      c.stroke();

      // Cruz Heráldica Incandescente no Centro do Pavise
      c.strokeStyle = '#f1c40f';
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(shX + 4, -14); c.lineTo(shX + 4, 14);
      c.moveTo(shX - 1, -2); c.lineTo(shX + 8, -2);
      c.stroke();

      // Ondas frontais de pressão e corte cinético
      c.strokeStyle = 'rgba(0, 206, 201, 0.65)';
      c.lineWidth = 2.2;
      c.beginPath();
      c.arc(shX + 8, 0, 18 + pPulse * 1.5, -Math.PI * 0.45, Math.PI * 0.45);
      c.stroke();
      c.restore();
    }

    // Glifo Rúnico de Retaliação Melee
    if (isRetaliating) {
      c.save();
      c.strokeStyle = 'rgba(0, 206, 201, 0.85)';
      c.lineWidth = 2.2;
      c.beginPath();
      for (let g = 0; g < 6; g++) {
        const ga = (g * Math.PI / 3) + tFrame * 0.05;
        const gx = Math.cos(ga) * 20;
        const gy = Math.sin(ga) * 20 + bob;
        if (g === 0) c.moveTo(gx, gy);
        else c.lineTo(gx, gy);
      }
      c.closePath();
      c.stroke();
      c.restore();
    }
  } else if (heroKey === 'BARBARIAN') {
    // isBerserk handled via state
    const skinCol = charDef.color.skin || '#c67846';
    const runeCol = isBerserk ? '#ffffff' : (charDef.color.tattoo || '#f39c12');
    const hairCol = charDef.color.hair || '#d35400';
    const capeCol = charDef.color.cape || '#7f1d1d';
    const leatherCol = charDef.color.armor || '#2c1e18';
    const boneCol = charDef.color.bone || '#e2d7c5';

    // 1. Capa Pesada de Pele de Fera com Bainha Desgastada
    c.fillStyle = capeCol;
    c.beginPath();
    c.moveTo(-6, -1 + bob);
    c.lineTo(-15 - Math.abs(capeWave * 1.1), 16 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.6), 18 + bob);
    c.lineTo(-2, 17 + bob);
    c.lineTo(4, -1 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = '#1c120c';
    c.beginPath();
    c.moveTo(-15 - Math.abs(capeWave * 1.1), 14 + bob);
    c.lineTo(-16 - Math.abs(capeWave * 1.1), 17 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.6), 19 + bob);
    c.lineTo(-2, 18 + bob);
    c.lineTo(-2, 16 + bob);
    c.closePath();
    c.fill();

    // 2. Pernas Robustas, Amarras Cruzadas e Botas Pesadas
    c.fillStyle = leatherCol;
    c.fillRect(-7.5 - legSwing * 0.45, 6.5 + bob, 5.5, 8.5);
    c.fillRect(2.0 + legSwing * 0.45, 6.5 + bob, 5.5, 8.5);

    c.strokeStyle = '#8d5524';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-7.5 - legSwing * 0.45, 8.5 + bob);
    c.lineTo(-2.0 - legSwing * 0.45, 12 + bob);
    c.moveTo(2.0 + legSwing * 0.45, 8.5 + bob);
    c.lineTo(7.5 + legSwing * 0.45, 12 + bob);
    c.stroke();

    c.fillStyle = '#1a1d20';
    c.fillRect(-8 - legSwing * 0.45, 12.5 + bob, 6.5, 3.5);
    c.fillRect(1.5 + legSwing * 0.45, 12.5 + bob, 6.5, 3.5);
    c.fillStyle = '#7f8c8d';
    c.fillRect(-7 - legSwing * 0.45, 14.5 + bob, 5, 1.5);
    c.fillRect(2.5 + legSwing * 0.45, 14.5 + bob, 5, 1.5);

    // 3. Tronco Musculoso de Colosso Tribal (Silhueta V-Taper Imponente)
    c.fillStyle = skinCol;
    c.beginPath();
    c.moveTo(-10.5, -5 + bob);
    c.lineTo(10.5, -5 + bob);
    c.lineTo(6.5, 7 + bob);
    c.lineTo(-6.5, 7 + bob);
    c.closePath();
    c.fill();

    // Tatuagens Rúnicas Corporais (Pulsam em chamas no modo Berserk)
    c.strokeStyle = runeCol;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-7, -2 + bob);
    c.lineTo(-3, 0 + bob);
    c.lineTo(-5, 3 + bob);
    c.lineTo(-1, 5 + bob);
    c.moveTo(1, -3 + bob);
    c.lineTo(5, -1 + bob);
    c.lineTo(3, 2 + bob);
    c.stroke();

    if (isBerserk) {
      c.fillStyle = '#ff7675';
      c.fillRect(-4, 0 + bob, 2.5, 2.5);
      c.fillRect(2, -1 + bob, 2.5, 2.5);
    }

    // Arnês de Couro em "X" com Broche Central
    c.strokeStyle = '#3d271d';
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(-9, -4 + bob);
    c.lineTo(6, 6 + bob);
    c.moveTo(9, -4 + bob);
    c.lineTo(-6, 6 + bob);
    c.stroke();

    c.fillStyle = '#d35400';
    c.beginPath();
    c.arc(0, 1 + bob, 2.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f1c40f';
    c.fillRect(-1, 0 + bob, 2, 2);

    // Cinturão com Fivela de Ferro Rúnico
    c.fillStyle = leatherCol;
    c.fillRect(-7.5, 4.5 + bob, 15, 3.2);
    c.fillStyle = '#7f8c8d';
    c.fillRect(-2.5, 4.0 + bob, 5, 4.2);
    c.fillStyle = '#f1c40f';
    c.fillRect(-1.2, 5.0 + bob, 2.4, 2.2);

    // 4. Ombreira Traseira de Osso / Crânio de Fera com Cravos
    c.fillStyle = boneCol;
    c.beginPath();
    c.moveTo(-11, -6 + bob);
    c.quadraticCurveTo(-15, -4 + bob, -13, 1 + bob);
    c.lineTo(-8, -1 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = '#2c1e18';
    c.lineWidth = 1.2;
    c.stroke();

    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(-13, -3 + bob);
    c.lineTo(-17, -7 + bob);
    c.lineTo(-11, -6 + bob);
    c.closePath();
    c.fill();

    // 5. Braços Musculosos com Munhequeiras Reforçadas
    c.fillStyle = skinCol;
    c.fillRect(-11, -3 + bob, 4.5, 8);
    c.fillRect(7, -3 + bob, 4.5, 8);
    c.fillStyle = leatherCol;
    c.fillRect(-11.5, 2 + bob, 5, 3.5);
    c.fillRect(6.5, 2 + bob, 5, 3.5);
    c.fillStyle = '#bdc3c7';
    c.fillRect(-10.5, 3 + bob, 1.5, 1.5);
    c.fillRect(8.0, 3 + bob, 1.5, 1.5);

    // 6. Gola de Peles de Lobo nos Ombros
    c.fillStyle = '#4a332d';
    c.beginPath();
    c.moveTo(-10, -6 + bob);
    c.quadraticCurveTo(0, -3 + bob, 10, -6 + bob);
    c.lineTo(8, -8.5 + bob);
    c.quadraticCurveTo(0, -6 + bob, -8, -8.5 + bob);
    c.closePath();
    c.fill();

    // 7. Cabeça, Rosto e Olhos Furiosos
    c.fillStyle = skinCol;
    c.beginPath();
    c.arc(0.5, -9.5 + bob, 6.2, 0, Math.PI * 2);
    c.fill();

    if (isBerserk) {
      c.fillStyle = '#ffffff';
      c.fillRect(2.0, -10.5 + bob, 3.5, 2.2);
      c.strokeStyle = '#ff3838';
      c.lineWidth = 1;
      c.strokeRect(2.0, -10.5 + bob, 3.5, 2.2);
    } else {
      c.fillStyle = '#1e272e';
      c.fillRect(2.2, -10.5 + bob, 2.5, 2.0);
      c.fillStyle = '#f39c12';
      c.fillRect(3.0, -10.2 + bob, 1.4, 1.4);
    }

    c.strokeStyle = '#4a2810';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(1.5, -11.5 + bob);
    c.lineTo(5.2, -10.2 + bob);
    c.stroke();

    // 8. Barba Ruiva Trançada com Anel de Osso e Bigode
    c.fillStyle = hairCol;
    c.beginPath();
    c.moveTo(-2.5, -8.5 + bob);
    c.lineTo(5.5, -8.5 + bob);
    c.quadraticCurveTo(8.5, -3 + bob, 6.0, 1 + bob);
    c.lineTo(1.5, 2.5 + bob);
    c.quadraticCurveTo(0.5, -3 + bob, -2.5, -8.5 + bob);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(2.0, 1.5 + bob);
    c.lineTo(5.0, 1.5 + bob);
    c.lineTo(3.5, 6.0 + bob);
    c.closePath();
    c.fill();
    c.fillStyle = boneCol;
    c.fillRect(2.2, 2.2 + bob, 2.6, 1.8);

    c.fillStyle = '#b33927';
    c.beginPath();
    c.moveTo(1.0, -7.5 + bob);
    c.lineTo(6.5, -6.0 + bob);
    c.lineTo(2.5, -5.5 + bob);
    c.closePath();
    c.fill();

    // 9. Cabelos Longos Selvagens
    const hairWave = isMoving ? Math.sin(walkCycle) * 3.5 : Math.sin(tFrame * 0.08) * 1.5;
    c.fillStyle = hairCol;
    c.beginPath();
    c.moveTo(-2, -12 + bob);
    c.quadraticCurveTo(-9 - hairWave * 0.7, -13 + bob, -14 - Math.abs(hairWave), -6 + bob + hairWave * 0.5);
    c.quadraticCurveTo(-8, -7 + bob, -4, -8 + bob);
    c.closePath();
    c.fill();

    // 10. Diadema de Ferro e Chifres Rústicos Esculpidos
    c.fillStyle = '#57606f';
    c.fillRect(-5.5, -14.5 + bob, 11, 3.2);
    c.fillStyle = '#f1c40f';
    c.fillRect(-0.8, -14.0 + bob, 2.0, 2.2);

    c.fillStyle = boneCol;
    c.strokeStyle = '#2d3436';
    c.lineWidth = 1.2;

    c.beginPath();
    c.moveTo(-5.0, -13.5 + bob);
    c.quadraticCurveTo(-11.5, -16.5 + bob, -11.0, -22 + bob);
    c.quadraticCurveTo(-7.5, -17.5 + bob, -3.5, -14.5 + bob);
    c.closePath();
    c.fill();
    c.stroke();

    c.beginPath();
    c.moveTo(3.5, -14.5 + bob);
    c.quadraticCurveTo(7.5, -17.5 + bob, 11.0, -22 + bob);
    c.quadraticCurveTo(11.5, -16.5 + bob, 5.0, -13.5 + bob);
    c.closePath();
    c.fill();
    c.stroke();
  } else if (heroKey === 'ALCHEMIST') {
    // fluidColor handled via state
    const hairSway = isMoving ? Math.sin(walkCycle) * 4.5 : Math.sin(tFrame * 0.08) * 1.5;

    // 1. Abas do Casaco / Fraque posterior (ondulam fluidas com os passos)
    c.fillStyle = '#165b4c';
    c.beginPath();
    c.moveTo(-5, 3 + bob);
    c.lineTo(-10 - Math.abs(hairSway * 0.9), 15 + bob);
    c.lineTo(-3, 15 + bob);
    c.lineTo(2, 3 + bob);
    c.closePath();
    c.fill();

    // 2. Caníster Dorsal Esguio (cilindro de vidro fino e vertical, sem sobrecarregar as costas)
    c.fillStyle = 'rgba(20, 36, 30, 0.85)';
    c.fillRect(-8.5, -5 + bob, 4.5, 11);
    c.fillStyle = fluidColor;
    c.fillRect(-8, 0 + bob, 3.5, 5.5);
    c.strokeStyle = '#d4a373';
    c.lineWidth = 1;
    c.strokeRect(-8.5, -5 + bob, 4.5, 11);
    c.fillStyle = '#d4a373';
    c.fillRect(-9, -7 + bob, 5.5, 2);

    // 3. Pernas e Botas Esbeltas
    c.fillStyle = '#1e272e';
    c.fillRect(-5 - legSwing * 0.35, 7 + bob, 3.2, 8);
    c.fillRect(1.5 + legSwing * 0.35, 7 + bob, 3.2, 8);
    c.fillStyle = '#d4a373';
    c.fillRect(-5 - legSwing * 0.35, 11 + bob, 3.2, 1.5);
    c.fillRect(1.5 + legSwing * 0.35, 11 + bob, 3.2, 1.5);

    // 4. Tronco com Silhueta Feminina (Corselete ajustado e cintura delineada)
    c.fillStyle = '#16a085';
    c.fillRect(-6, -4 + bob, 12, 10);

    // Corselete escuro acinturado
    c.fillStyle = '#2c1e18';
    c.beginPath();
    c.moveTo(-4.5, -3 + bob);
    c.lineTo(4.5, -3 + bob);
    c.lineTo(3.2, 5 + bob);
    c.lineTo(-3.2, 5 + bob);
    c.closePath();
    c.fill();

    // Amarração frontal de latão
    c.strokeStyle = '#d4a373';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-1.2, -2 + bob);
    c.lineTo(1.2, -0.5 + bob);
    c.lineTo(-1.2, 1 + bob);
    c.lineTo(1.2, 2.5 + bob);
    c.stroke();

    // Cinto fino e frascos laterais suspensos no quadril
    c.fillStyle = '#4a3525';
    c.fillRect(-5, 4.5 + bob, 10, 1.8);
    c.fillStyle = fluidColor;
    c.fillRect(3.8, 3.5 + bob, 2, 4);
    c.fillStyle = '#9b59b6';
    c.fillRect(3.8, 7.5 + bob, 2, 3.5);
    c.fillStyle = '#d4a373';
    c.fillRect(3.4, 3 + bob, 2.8, 1.2);
    c.fillRect(3.4, 7 + bob, 2.8, 1.2);

    // 5. Pescoço e Respirador Baixado (gola aberta, deixando o queixo e rosto livres)
    c.fillStyle = '#f5cd79';
    c.fillRect(-2, -6 + bob, 4, 3);
    c.fillStyle = '#34495e';
    c.fillRect(-3.5, -5 + bob, 7, 2.2);
    c.fillStyle = '#d4a373';
    c.fillRect(-4, -4.5 + bob, 1.8, 1.8);
    c.fillRect(2.2, -4.5 + bob, 1.8, 1.8);

    // 6. Rosto Feminino Visível
    c.fillStyle = '#f5cd79';
    c.beginPath();
    c.arc(0.5, -9 + bob, 5.2, 0, Math.PI * 2);
    c.fill();

    // Olho delicado e focado
    c.fillStyle = '#1e272e';
    c.fillRect(2.2, -9.5 + bob, 2.2, 1.5);
    c.fillStyle = '#00cec9';
    c.fillRect(2.7, -9.2 + bob, 1.2, 1.2);

    // 7. Cabelo Roxo Característico, Óculos na Testa e Rabo de Cavalo Fluido
    c.fillStyle = '#8e44ad';
    c.beginPath();
    c.arc(0, -10.5 + bob, 5.8, Math.PI * 0.85, Math.PI * 2.15);
    c.fill();
    c.beginPath();
    c.moveTo(1, -11 + bob);
    c.lineTo(4, -8 + bob);
    c.lineTo(2, -7 + bob);
    c.closePath();
    c.fill();

    // Óculos de alquimista (goggles) pousados na testa
    c.fillStyle = '#d4a373';
    c.fillRect(0.8, -12.5 + bob, 4.2, 2.2);
    c.fillStyle = '#00ffcc';
    c.fillRect(1.5, -12.2 + bob, 2.8, 1.4);
    c.strokeStyle = '#4a3525';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0.8, -11.5 + bob);
    c.lineTo(-4, -10.5 + bob);
    c.stroke();

    // Rabo de cavalo longo que ondula para trás com a caminhada
    c.fillStyle = '#d4a373';
    c.fillRect(-5.2, -12 + bob, 2.4, 2.4); // Presilha
    c.fillStyle = '#8e44ad';
    c.beginPath();
    c.moveTo(-4.5, -12 + bob);
    c.quadraticCurveTo(-11 - hairSway * 0.8, -13 + bob - hairSway * 0.3, -15 - Math.abs(hairSway), -4 + bob + hairSway);
    c.quadraticCurveTo(-10 - hairSway * 0.5, -7 + bob, -4.5, -9.5 + bob);
    c.closePath();
    c.fill();

    // 8. Braço e Mão Segurando Frasco Erlenmeyer
    c.fillStyle = '#16a085';
    c.fillRect(-1, -2 + bob, 3.5, 4.5);
    c.fillStyle = '#2c1e18';
    c.fillRect(1, 1 + bob, 3, 3.5);

    c.fillStyle = 'rgba(255, 255, 255, 0.65)';
    c.beginPath();
    c.moveTo(3, 3.5 + bob);
    c.lineTo(5.5, 3.5 + bob);
    c.lineTo(7, 7.5 + bob);
    c.lineTo(1.5, 7.5 + bob);
    c.closePath();
    c.fill();
    c.fillStyle = fluidColor;
    c.beginPath();
    c.moveTo(2.4, 5.5 + bob);
    c.lineTo(6.1, 5.5 + bob);
    c.lineTo(6.6, 7.2 + bob);
    c.lineTo(1.9, 7.2 + bob);
    c.closePath();
    c.fill();
  } else if (heroKey === 'MAGE') {
    // isDashing handled via state
    // isCasting handled via state
    const cCol = charDef.color;
    const robeMid = cCol.robe || '#541212';
    const robeDark = cCol.robeDark || '#220808';
    const corsetCol = cCol.corset || '#1c1116';
    const goldTrim = cCol.trimGold || '#f1c40f';
    const copperTrim = cCol.trim || '#d35400';
    const capeExt = cCol.cape || '#80121d';
    const capeIn = cCol.capeInner || '#e74c3c';
    const hairBase = cCol.hair || '#e67e22';
    const hairGlow = cCol.hairTip || '#f1c40f';
    const eyeSpark = cCol.eyeGlow || '#ffffff';
    const staffWood = cCol.staffWood || '#2c1e18';
    const staffGold = cCol.staffGold || '#f1c40f';
    const crystalCol = cCol.crystal || '#ff7675';

    // --- ULT: Pós-Imagens Térmicas e Asas Espectrais de Fênix ---
    if (isDashing) {
      c.save();
      // Fantasmas térmicos com decaimento cromático
      const ghostColors = [
        'rgba(255, 255, 255, 0.45)',
        'rgba(241, 196, 15, 0.35)',
        'rgba(230, 126, 34, 0.25)',
        'rgba(192, 57, 43, 0.15)'
      ];
      for (let g = 0; g < ghostColors.length; g++) {
        const gDist = (g + 1) * 9;
        c.fillStyle = ghostColors[g];
        c.beginPath();
        c.ellipse(-gDist, bob, 11, 15, 0, 0, Math.PI * 2);
        c.fill();
      }

      // Anéis de solo em brasa viva sob os pés
      c.strokeStyle = 'rgba(241, 196, 15, 0.85)';
      c.lineWidth = 2.0;
      c.beginPath();
      c.ellipse(0, 14 + bob, 20, 6.5, 0, 0, Math.PI * 2);
      c.stroke();

      // Asas Espectrais da Fênix de Plasma
      const wingFlap = Math.sin(tFrame * 0.55) * 5;
      c.fillStyle = 'rgba(241, 196, 15, 0.45)';
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2.2;

      // Asa Posterior
      c.beginPath();
      c.moveTo(-4, -8 + bob);
      c.quadraticCurveTo(-18, -26 + wingFlap, -36, -16 + wingFlap);
      c.lineTo(-24, -6 + wingFlap * 0.5);
      c.lineTo(-30, 4 + wingFlap);
      c.lineTo(-12, 4 + bob);
      c.closePath();
      c.fill();
      c.stroke();

      // Asa Anterior
      c.beginPath();
      c.moveTo(3, -8 + bob);
      c.quadraticCurveTo(16, -28 + wingFlap, 34, -20 + wingFlap);
      c.lineTo(24, -7 + wingFlap * 0.5);
      c.lineTo(29, 2 + wingFlap);
      c.lineTo(10, 3 + bob);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }

    // 1. Manto da Fênix (Capa Dupla Bifurcada com Ondulação Térmica)
    // Camada interna incandescente
    c.fillStyle = capeIn;
    c.beginPath();
    c.moveTo(-4, -2 + bob);
    c.lineTo(-16 - Math.abs(capeWave * 1.2), 17 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.7), 12 + bob);
    c.lineTo(-13 - Math.abs(capeWave * 1.1), 19 + bob);
    c.lineTo(-2, 16 + bob);
    c.lineTo(2, -2 + bob);
    c.closePath();
    c.fill();

    // Camada externa nobre com bainha denteada
    c.fillStyle = capeExt;
    c.beginPath();
    c.moveTo(-4, -3 + bob);
    c.lineTo(-14 - Math.abs(capeWave * 1.0), 15 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.6), 11 + bob);
    c.lineTo(-11 - Math.abs(capeWave * 0.9), 17 + bob);
    c.lineTo(-1, 15 + bob);
    c.lineTo(3, -3 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.3;
    c.stroke();

    // 2. Coldre Dorsal do Cajado da Tormenta (Exibido em repouso, esconde na conjuração)
    if (!isCasting) {
      c.save();
      c.translate(-2, -3 + bob);
      c.rotate(-0.52);

      // Haste de madeira petrificada
      c.fillStyle = staffWood;
      c.fillRect(-1.8, -12, 3.6, 36);

      // Ponteira inferior de latão
      c.fillStyle = staffGold;
      c.fillRect(-2.2, 23, 4.4, 3);

      // Coroa com garras superiores de ouro
      c.fillStyle = staffGold;
      c.beginPath();
      c.moveTo(-5.5, -12);
      c.lineTo(5.5, -12);
      c.lineTo(4.5, -18);
      c.lineTo(0, -14);
      c.lineTo(-4.5, -18);
      c.closePath();
      c.fill();

      // Cristal de Magma incandescente no núcleo da coroa
      c.fillStyle = crystalCol;
      c.beginPath();
      c.arc(0, -18, 3.8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(-1, -19, 1.4, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // 3. Pernas e Botas Arcanas de Batalha
    const legLeftX = -5.5 - legSwing * 0.35;
    const legRightX = 1.2 + legSwing * 0.35;

    c.fillStyle = robeDark;
    c.fillRect(legLeftX, 6 + bob, 4, 8);
    c.fillRect(legRightX, 6 + bob, 4, 8);

    // Botas de couro com canos de latão
    c.fillStyle = '#1e130c';
    c.fillRect(legLeftX - 0.5, 11 + bob, 5, 4.5);
    c.fillRect(legRightX - 0.5, 11 + bob, 5, 4.5);
    c.fillStyle = copperTrim;
    c.fillRect(legLeftX, 10.5 + bob, 4, 1.5);
    c.fillRect(legRightX, 10.5 + bob, 4, 1.5);

    // 4. Tronco com Túnica Flutuante, Corselete e Faixas Rituais
    c.fillStyle = robeMid;
    c.beginPath();
    c.moveTo(-7.5, -5 + bob);
    c.lineTo(7.5, -5 + bob);
    c.lineTo(5.5, 8 + bob);
    c.lineTo(-5.5, 8 + bob);
    c.closePath();
    c.fill();

    // Corselete escuro delineado
    c.fillStyle = corsetCol;
    c.beginPath();
    c.moveTo(-5.5, -4 + bob);
    c.lineTo(5.5, -4 + bob);
    c.lineTo(4, 5 + bob);
    c.lineTo(-4, 5 + bob);
    c.closePath();
    c.fill();

    // Runa Central de Confinamento Ígneo no Peitoral
    const runePulse = Math.sin(tFrame * 0.2) * 0.5 + 0.5;
    c.fillStyle = isDashing ? '#ffffff' : (runePulse > 0.5 ? goldTrim : copperTrim);
    c.fillRect(-1.2, -3.5 + bob, 2.4, 5.5);
    c.fillRect(-2.8, -1.8 + bob, 5.6, 2.0);

    // Cinto e faixa pendente ritualística com pontas chanfradas
    c.fillStyle = '#2c1e18';
    c.fillRect(-6, 4.5 + bob, 12, 2.8);
    c.fillStyle = copperTrim;
    c.beginPath();
    c.moveTo(-2, 6 + bob);
    c.lineTo(2, 6 + bob);
    c.lineTo(1.5, 13 + bob);
    c.lineTo(0, 15 + bob);
    c.lineTo(-1.5, 13 + bob);
    c.closePath();
    c.fill();

    // Fivela de Ouro Solar
    c.fillStyle = goldTrim;
    c.fillRect(-2.5, 4.0 + bob, 5, 3.8);
    c.fillStyle = '#ffffff';
    c.fillRect(-1, 5.0 + bob, 2, 1.8);

    // 5. Ombreiras em Formato de Labaredas Ascendentes
    c.fillStyle = copperTrim;
    c.beginPath();
    c.moveTo(-8, -6 + bob);
    c.lineTo(-13, -3 + bob);
    c.lineTo(-12, -9 + bob);
    c.lineTo(-6, -7 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.2;
    c.stroke();

    c.fillStyle = copperTrim;
    c.beginPath();
    c.moveTo(5, -6 + bob);
    c.lineTo(13, -3 + bob);
    c.lineTo(11, -10 + bob);
    c.lineTo(4, -7 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.2;
    c.stroke();

    // 6. Cabeça de Chama Viva Elemental (Ciclo Térmico: Vermelho -> Laranja -> Amarelo)
    const colorCycle = (tFrame * 0.04) % 3;
    let outerFlameColor, midFlameColor;

    if (colorCycle < 1) {
      // Transição: Vermelho (#e74c3c) -> Laranja (#e67e22)
      const p = colorCycle;
      outerFlameColor = `rgb(${Math.round(231 + (230 - 231) * p)}, ${Math.round(76 + (126 - 76) * p)}, ${Math.round(60 + (34 - 60) * p)})`;
      midFlameColor = `rgb(${Math.round(230 + (241 - 230) * p)}, ${Math.round(126 + (196 - 126) * p)}, ${Math.round(34 + (15 - 34) * p)})`;
    } else if (colorCycle < 2) {
      // Transição: Laranja (#e67e22) -> Amarelo (#f1c40f)
      const p = colorCycle - 1;
      outerFlameColor = `rgb(${Math.round(230 + (241 - 230) * p)}, ${Math.round(126 + (196 - 126) * p)}, ${Math.round(34 + (15 - 34) * p)})`;
      midFlameColor = `rgb(${Math.round(241 + (255 - 241) * p)}, ${Math.round(196 + (234 - 196) * p)}, ${Math.round(15 + (167 - 15) * p)})`;
    } else {
      // Transição: Amarelo (#f1c40f) -> Vermelho (#e74c3c)
      const p = colorCycle - 2;
      outerFlameColor = `rgb(${Math.round(241 + (231 - 241) * p)}, ${Math.round(196 + (76 - 196) * p)}, ${Math.round(15 + (60 - 15) * p)})`;
      midFlameColor = `rgb(${Math.round(255 + (230 - 255) * p)}, ${Math.round(234 + (126 - 234) * p)}, ${Math.round(167 + (34 - 167) * p)})`;
    }

    // Ondulações dinâmicas das labaredas
    const fWave1 = Math.sin(tFrame * 0.18) * 2.5;
    const fWave2 = Math.cos(tFrame * 0.22) * 2.2;
    const tipX = Math.sin(tFrame * 0.15) * 2.8 - (isMoving ? 2 : 0);
    const tipY = -21 + bob + Math.cos(tFrame * 0.18) * 1.8;
    const leftTongueX = -8.5 + fWave1;
    const leftTongueY = -13 + bob + fWave2 * 0.5;
    const rightTongueX = 7.5 + fWave2;
    const rightTongueY = -12.5 + bob + fWave1 * 0.5;

    // 6.1 Camada Exterior da Labareda
    c.fillStyle = outerFlameColor;
    c.beginPath();
    c.moveTo(-5, -6 + bob);
    c.quadraticCurveTo(-8, -9 + bob, leftTongueX, leftTongueY);
    c.quadraticCurveTo(-4, -13 + bob, tipX, tipY);
    c.quadraticCurveTo(4, -14 + bob, rightTongueX, rightTongueY);
    c.quadraticCurveTo(7.5, -9 + bob, 5, -6 + bob);
    c.closePath();
    c.fill();

    // 6.2 Camada Média Incandescente
    c.fillStyle = midFlameColor;
    c.beginPath();
    c.moveTo(-3.5, -6 + bob);
    c.quadraticCurveTo(-6, -8.5 + bob, leftTongueX * 0.7, leftTongueY + 2);
    c.quadraticCurveTo(-2, -11 + bob, tipX * 0.6, tipY + 3.5);
    c.quadraticCurveTo(3, -12 + bob, rightTongueX * 0.7, rightTongueY + 2);
    c.quadraticCurveTo(5.5, -8.5 + bob, 3.5, -6 + bob);
    c.closePath();
    c.fill();

    // 6.3 Núcleo Solar Branco de Plasma
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(0.5, -9.5 + bob, 2.8, 4.8, 0, 0, Math.PI * 2);
    c.fill();

    // 6.4 Fagulhas Térmicas Ascendentes Desprendendo da Ponta
    const ember1Y = tipY - 3 - ((tFrame * 0.4) % 8);
    const ember2Y = tipY - 2 - (((tFrame + 12) * 0.4) % 8);
    c.fillStyle = midFlameColor;
    c.fillRect(tipX - 1, ember1Y, 1.8, 1.8);
    c.fillStyle = '#ffffff';
    c.fillRect(tipX + 1.2, ember2Y, 1.4, 1.4);

    // 7. Olhos de Fogo Ancestrais (Fendas Arcanas Flutuantes)
    c.fillStyle = '#ffffff';
    c.strokeStyle = outerFlameColor;
    c.lineWidth = 1.0;

    // Olho Frontal
    c.beginPath();
    c.moveTo(1.5, -11 + bob);
    c.lineTo(4.5, -9.5 + bob);
    c.lineTo(1.8, -8.5 + bob);
    c.closePath();
    c.fill();
    c.stroke();

    // Olho Traseiro
    c.beginPath();
    c.moveTo(-3.5, -11 + bob);
    c.lineTo(-0.8, -9.5 + bob);
    c.lineTo(-3.2, -8.5 + bob);
    c.closePath();
    c.fill();
    c.stroke();

    // 8. Braço e Mão (Postura de Ataque com Cajado ou Repouso)
    if (isCasting) {
      // Braço projetado à frente sustentando o Cajado da Tormenta
      c.fillStyle = robeMid;
      c.fillRect(3, -4 + bob, 7, 4);
      c.fillStyle = '#f5cd79';
      c.fillRect(9, -4 + bob, 3, 3.5);

      // Cajado frontal empunhado com cristal ardente
      c.save();
      c.translate(11, -3 + bob);
      c.rotate(0.22);
      c.fillStyle = staffWood;
      c.fillRect(-1.6, -18, 3.2, 38);
      c.fillStyle = staffGold;
      c.fillRect(-2.2, -18, 4.4, 5);
      c.fillStyle = crystalCol;
      c.beginPath();
      c.arc(0, -20, 4.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(-1, -21, 1.8, 0, Math.PI * 2);
      c.fill();
      c.restore();
    } else {
      c.fillStyle = robeMid;
      c.fillRect(5, -2 + bob, 3.8, 7);
      c.fillStyle = copperTrim;
      c.fillRect(5, 2 + bob, 3.8, 2.5);
      c.fillStyle = '#f5cd79';
      c.fillRect(5.5, 4 + bob, 3, 2.5);
    }
  } else if (heroKey === 'ROGUE') {
    // isPhasing handled via state
    // isAttacking handled via state
    const cCol = charDef.color || {};

    // --- ULT/HABILIDADE: Pós-Imagens de Fumaça e Rastro Espectral ---
    if (isPhasing) {
      c.save();
      // Silhuetas residuais de névoa escura em decalque
      for (let g = 1; g <= 3; g++) {
        const ghostDist = g * 8.5;
        c.fillStyle = `rgba(16, 172, 132, ${0.30 / g})`;
        c.beginPath();
        c.ellipse(-ghostDist, bob + 1, 10, 15, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = `rgba(10, 13, 14, ${0.40 / g})`;
        c.beginPath();
        c.ellipse(-ghostDist * 0.7, bob, 8, 13, 0, 0, Math.PI * 2);
        c.fill();
      }

      // Névoa condensada rastejando no solo sob os passos
      c.strokeStyle = 'rgba(0, 206, 201, 0.65)';
      c.lineWidth = 1.5;
      c.setLineDash([4, 3]);
      c.beginPath();
      c.ellipse(0, 14 + bob, 18, 5.5, 0, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }

    // 1. Capa Esfarrapada de Três Pontas (Rasgada e Esvoaçante)
    // Forro interno escuro
    c.fillStyle = cCol.capeInner || '#07261f';
    c.beginPath();
    c.moveTo(-4, -3 + bob);
    c.lineTo(-15 - Math.abs(capeWave * 1.3), 16 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.8), 12 + bob);
    c.lineTo(-12 - Math.abs(capeWave * 1.1), 18 + bob);
    c.lineTo(-3, 15 + bob);
    c.lineTo(2, -3 + bob);
    c.closePath();
    c.fill();

    // Camada principal com gomos denteados
    c.fillStyle = cCol.cape || '#0e4438';
    c.beginPath();
    c.moveTo(-4, -4 + bob);
    c.lineTo(-13 - Math.abs(capeWave * 1.1), 14 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.6), 10 + bob);
    c.lineTo(-10 - Math.abs(capeWave * 0.9), 16 + bob);
    c.lineTo(-1, 14 + bob);
    c.lineTo(3, -4 + bob);
    c.closePath();
    c.fill();

    c.strokeStyle = cCol.capeTrim || '#16a085';
    c.lineWidth = 1.2;
    c.stroke();

    // 2. Bainhas Cruzadas nas Costas e Lâminas Espirituais
    c.save();
    c.translate(-1, -3 + bob);

    // Correia de couro cruzada que sustenta as bainhas
    c.strokeStyle = cCol.leatherStraps || '#2d3436';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(-6, -3);
    c.lineTo(5, 7);
    c.moveTo(5, -3);
    c.lineTo(-6, 7);
    c.stroke();

    // Se o herói não estiver em ataque pleno, renderiza as adagas no coldre
    if (!isAttacking) {
      // Adaga Esquerda (inclinada a -40 graus)
      c.save();
      c.rotate(-0.65);
      c.fillStyle = cCol.scabbard || '#1e272e';
      c.fillRect(-2, -10, 4, 16);
      c.fillStyle = cCol.hiltGold || '#f1c40f';
      c.fillRect(-3.5, -11, 7, 2);
      c.fillStyle = cCol.bladeGlow || '#00cec9';
      c.fillRect(-1.5, -16, 3, 5);
      c.restore();

      // Adaga Direita (inclinada a +40 graus)
      c.save();
      c.rotate(0.65);
      c.fillStyle = cCol.scabbard || '#1e272e';
      c.fillRect(-2, -10, 4, 16);
      c.fillStyle = cCol.hiltGold || '#f1c40f';
      c.fillRect(-3.5, -11, 7, 2);
      c.fillStyle = cCol.bladeGlow || '#00cec9';
      c.fillRect(-1.5, -16, 3, 5);
      c.restore();
    }
    c.restore();

    // 3. Pernas, Botas Táticas Leves e Bandagens
    const legLeftX = -6 - legSwing * 0.4;
    const legRightX = 1.5 + legSwing * 0.4;

    c.fillStyle = cCol.tunicDark || '#0f1417';
    c.fillRect(legLeftX, 6 + bob, 4.2, 8);
    c.fillRect(legRightX, 6 + bob, 4.2, 8);

    // Bandagens nas canelas
    c.strokeStyle = cCol.bandages || '#7f8c8d';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(legLeftX, 8 + bob); c.lineTo(legLeftX + 4.2, 11 + bob);
    c.moveTo(legRightX, 8 + bob); c.lineTo(legRightX + 4.2, 11 + bob);
    c.stroke();

    // Botas de couro flexível
    c.fillStyle = '#1e130c';
    c.fillRect(legLeftX - 1, 12.5 + bob, 5.5, 3.2);
    c.fillRect(legRightX - 1, 12.5 + bob, 5.5, 3.2);
    c.fillStyle = cCol.buckles || '#bdc3c7';
    c.fillRect(legLeftX + 2.5, 13 + bob, 1.5, 2);
    c.fillRect(legRightX + 2.5, 13 + bob, 1.5, 2);

    // 4. Tronco Ágil, Colete de Couro Reforçado e Cinturão de Bolsas
    c.fillStyle = cCol.tunic || '#1e272e';
    c.beginPath();
    c.moveTo(-7, -5 + bob);
    c.lineTo(7, -5 + bob);
    c.lineTo(5, 7 + bob);
    c.lineTo(-5, 7 + bob);
    c.closePath();
    c.fill();

    // Corselete / Armadura Peitoral Leve
    c.fillStyle = cCol.tunicDark || '#0f1417';
    c.beginPath();
    c.moveTo(-5, -4 + bob);
    c.lineTo(5, -4 + bob);
    c.lineTo(3.5, 4 + bob);
    c.lineTo(-3.5, 4 + bob);
    c.closePath();
    c.fill();

    // Cinturão Utilitário com bolsas e cápsulas de fumaça
    c.fillStyle = '#2d3436';
    c.fillRect(-6.5, 4.5 + bob, 13, 2.8);
    c.fillStyle = cCol.capeTrim || '#16a085';
    c.fillRect(-4.5, 4 + bob, 2.5, 3.5);
    c.fillRect(2.0, 4 + bob, 2.5, 3.5);
    c.fillStyle = cCol.buckles || '#bdc3c7';
    c.fillRect(-1, 4.2 + bob, 2, 3.2);

    // 5. Braços e Manoplas com Lâminas Ocultas
    if (isAttacking) {
      // Postura projetada para arremesso de adagas astrais
      c.fillStyle = cCol.tunic || '#1e272e';
      c.fillRect(3, -4 + bob, 7, 3.5);
      c.fillStyle = cCol.leatherStraps || '#2d3436';
      c.fillRect(7, -4 + bob, 3.5, 3.5);
      // Brilho astral na ponta dos dedos
      c.fillStyle = cCol.bladeGlow || '#00cec9';
      c.beginPath();
      c.arc(11, -2.5 + bob, 2.5, 0, Math.PI * 2);
      c.fill();
    } else {
      c.fillStyle = cCol.tunic || '#1e272e';
      c.fillRect(-9, -3 + bob, 3.5, 7);
      c.fillRect(5.5, -3 + bob, 3.5, 7);
      c.fillStyle = cCol.bandages || '#7f8c8d';
      c.fillRect(-9.5, 1.5 + bob, 4, 2.5);
      c.fillRect(5.5, 1.5 + bob, 4, 2.5);
    }

    // 6. Gola Alta e Cachecol Cobrindo a Garganta
    c.fillStyle = cCol.hood || '#182c25';
    c.beginPath();
    c.moveTo(-6, -6 + bob);
    c.lineTo(6, -6 + bob);
    c.lineTo(4, -2 + bob);
    c.lineTo(-4, -2 + bob);
    c.closePath();
    c.fill();

    // 7. Cabeça: Capuz Sombrio Pontiagudo (Shadow Cowl)
    c.fillStyle = cCol.hood || '#182c25';
    c.beginPath();
    c.moveTo(-6, -5 + bob);
    c.quadraticCurveTo(-7, -12 + bob, -2, -16.5 + bob);
    c.quadraticCurveTo(5, -14 + bob, 6.5, -5 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = cCol.capeTrim || '#16a085';
    c.lineWidth = 1.1;
    c.stroke();

    // 8. Rosto em Trevas e Fenda Ocular Espectral
    c.fillStyle = cCol.shadowFace || '#0a0d0e';
    c.beginPath();
    c.moveTo(-4.5, -6 + bob);
    c.lineTo(4.5, -6 + bob);
    c.lineTo(3.5, -12 + bob);
    c.lineTo(-3.5, -12 + bob);
    c.closePath();
    c.fill();

    // Olho Espectral Brilhante (Ciano / Lâmina Astral)
    const eyeSparkle = Math.sin(tFrame * 0.15) * 0.5 + 1.2;
    c.fillStyle = isPhasing ? '#ffffff' : (cCol.eyeGlow || '#00cec9');
    c.fillRect(1.5, -10 + bob, 3.2, 1.6);

    c.fillStyle = 'rgba(0, 206, 201, 0.45)';
    c.fillRect(0.5, -9.6 + bob, 1.5, 1.0);
    c.fillRect(4.5, -10.2 + bob, eyeSparkle, 1.2);
  } else {
    // Fallback genérico para chaves de heróis não mapeadas
    c.fillStyle = charDef.color.cape || '#7f8c8d';
    c.beginPath();
    c.moveTo(-4, -2 + bob);
    c.lineTo(-12 - Math.abs(capeWave), 13 + bob);
    c.lineTo(-2, 14 + bob);
    c.lineTo(2, -2 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = '#1e1b18';
    c.fillRect(-6 - legSwing * 0.4, 7 + bob, 4, 7);
    c.fillRect(2 + legSwing * 0.4, 7 + bob, 4, 7);

    c.fillStyle = charDef.color.armor || '#95a5a6';
    c.fillRect(-8, -4 + bob, 16, 12);
  }

  c.restore();
}

/**
 * Renderiza proceduralmente o personagem jogável selecionado na arena de combate.
 */
export function drawPlayerCharacter() {
  const isInvulnBlink = player.iFrames > 0 && Math.floor(player.iFrames / 4) % 2 === 0;
  if (isInvulnBlink) return;

  renderHeroModel(ctx, selectedHeroKey, {
    x: player.x,
    y: player.y,
    facing: player.facing,
    scale: 1,
    isMoving: player.isMoving,
    walkCycle: player.walkCycle,
    frameCount: frameCount,
    berserkTimer: player.berserkTimer,
    invisTimer: player.invisTimer,
    dashDuration: player.dashDuration,
    ignisDashDuration: player.ignisDashDuration,
    staffCastTimer: player.staffCastTimer,
    isPhasing: player.isPhasing,
    evolvedPotion: player.evolvedPotion,
    iFrames: player.iFrames,
    radius: player.radius,
    isHammerAttacking: bullets.some(b => b.type === 'HAMMER_SLAM' && b.life > 4),
    isStaffCasting: bullets.some(b => b.type === 'STAFF' && b.life > 48),
    isSwordAttacking: bullets.some(b => b.type === 'SWORD' && b.life > 45)
  });
}
