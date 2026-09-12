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
  for (let oIdx = 0; oIdx < player.orbitals; oIdx++) {
    const angle = player.orbitalAngle + (oIdx * (Math.PI * 2 / player.orbitals));
    const ox = player.x + Math.cos(angle) * orbDist;
    const oy = player.y + Math.sin(angle) * orbDist;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = player.evolvedOrbitals ? '#f1c40f' : '#2980b9';
    ctx.fillRect(-6, -8, 12, 16);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -6, 4, 12);
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
export function drawPlayerCharacter() {
  const isInvulnBlink = player.iFrames > 0 && Math.floor(player.iFrames / 4) % 2 === 0;
  if (isInvulnBlink) return;

  const charDef = CHARACTERS[selectedHeroKey];
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(player.facing, 1);

  if (player.berserkTimer > 0) {
    const bPulse = Math.sin(frameCount * 0.3) * 4;
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 2, player.radius + 10 + bPulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(230, 126, 34, 0.22)';
    ctx.fill();
  }

  // O efeito visual do Passo Ígneo de Ignis é renderizado proceduralmente com fidelidade total no bloco MAGE

  if (player.invisTimer > 0) {
    ctx.globalAlpha = 0.45;
  }

  const bob = player.isMoving ? Math.sin(player.walkCycle * 2) * 2.5 : Math.sin(frameCount * 0.05) * 0.8;
  const legSwing = player.isMoving ? Math.sin(player.walkCycle) * 5.5 : 0;
  const capeWave = player.isMoving ? Math.sin(player.walkCycle) * 4 : Math.sin(frameCount * 0.08) * 1.5;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 15, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (selectedHeroKey === 'KNIGHT') {
    const isDashing = player.dashDuration > 0;
    const isRetaliating = player.iFrames > 12;
    // O martelo nas costas desaparece no instante em que o ataque HAMMER_SLAM está ativo
    const isHammerAttacking = bullets.some(b => b.type === 'HAMMER_SLAM' && b.life > 4);
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
      ctx.save();
      for (let g = 1; g <= 3; g++) {
        const ghostDist = g * 9;
        ctx.fillStyle = `rgba(241, 196, 15, ${0.32 / g})`;
        ctx.beginPath();
        ctx.ellipse(-ghostDist, 0, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Solo Consagrado na base
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.75)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 14 + bob, 22, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 1. Capa Nobre Dupla de Veludo
    ctx.fillStyle = cCol.capeInner || '#2c1045';
    ctx.beginPath();
    ctx.moveTo(-5, -2 + bob);
    ctx.lineTo(-17 - Math.abs(capeWave * 1.2), 17 + bob);
    ctx.lineTo(-10 - Math.abs(capeWave * 0.7), 19 + bob);
    ctx.lineTo(-3, 17 + bob);
    ctx.lineTo(2, -2 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cCol.cape || '#481b6d';
    ctx.beginPath();
    ctx.moveTo(-5, -3 + bob);
    ctx.lineTo(-15 - Math.abs(capeWave * 1.1), 15 + bob);
    ctx.lineTo(-9 - Math.abs(capeWave * 0.6), 17 + bob);
    ctx.lineTo(-2, 16 + bob);
    ctx.lineTo(3, -3 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. Coldre Dorsal do Martelo Sagrado (Visível em repouso, some no ataque)
    if (!isHammerAttacking) {
      ctx.save();
      ctx.translate(-2, -3 + bob);
      ctx.rotate(-0.58);

      // Cabo de carvalho no coldre com ataduras
      ctx.fillStyle = hammerWood;
      ctx.fillRect(-2, -4, 4, 30);
      ctx.strokeStyle = '#1e130c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, 4); ctx.lineTo(2, 7);
      ctx.moveTo(-2, 12); ctx.lineTo(2, 15);
      ctx.stroke();

      // Pomo inferior de ferro
      ctx.fillStyle = hammerSteel;
      ctx.fillRect(-2.5, 25, 5, 3);

      // Cabeça titânica do martelo nas costas
      ctx.fillStyle = hammerSteel;
      ctx.fillRect(-9, -15, 18, 12);
      ctx.fillStyle = hammerGold;
      ctx.fillRect(-10, -13, 20, 3);
      ctx.fillRect(-10, -8, 20, 3);
      ctx.fillRect(-2, -15, 4, 12);

      // Espigão superior perfurante
      ctx.fillStyle = steelLight;
      ctx.beginPath();
      ctx.moveTo(0, -19);
      ctx.lineTo(3, -15);
      ctx.lineTo(-3, -15);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Pernas Blindadas, Grevas e Sabatons
    const legLeftX = -7 - legSwing * 0.4;
    const legRightX = 1.5 + legSwing * 0.4;

    ctx.fillStyle = steelDark;
    ctx.fillRect(legLeftX, 6 + bob, 5, 8);
    ctx.fillRect(legRightX, 6 + bob, 5, 8);

    ctx.fillStyle = steelMid;
    ctx.fillRect(legLeftX + 0.5, 7 + bob, 4, 6.5);
    ctx.fillRect(legRightX + 0.5, 7 + bob, 4, 6.5);
    ctx.fillStyle = steelLight;
    ctx.fillRect(legLeftX + 1.5, 7 + bob, 1.5, 6.5);
    ctx.fillRect(legRightX + 1.5, 7 + bob, 1.5, 6.5);

    // Joelheiras em losango (Poleyns)
    ctx.fillStyle = goldTrim;
    ctx.beginPath();
    ctx.moveTo(legLeftX + 2.5, 5.5 + bob);
    ctx.lineTo(legLeftX + 4.5, 7.5 + bob);
    ctx.lineTo(legLeftX + 2.5, 9.5 + bob);
    ctx.lineTo(legLeftX + 0.5, 7.5 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(legRightX + 2.5, 5.5 + bob);
    ctx.lineTo(legRightX + 4.5, 7.5 + bob);
    ctx.lineTo(legRightX + 2.5, 9.5 + bob);
    ctx.lineTo(legRightX + 0.5, 7.5 + bob);
    ctx.closePath();
    ctx.fill();

    // Sabatons
    ctx.fillStyle = steelDark;
    ctx.fillRect(legLeftX - 1, 12.5 + bob, 6.5, 3.5);
    ctx.fillRect(legRightX - 1, 12.5 + bob, 6.5, 3.5);
    ctx.fillStyle = steelLight;
    ctx.fillRect(legLeftX + 1, 13 + bob, 4, 1.8);
    ctx.fillRect(legRightX + 1, 13 + bob, 4, 1.8);

    // 4. Tronco com Couraça Chanfrada e Tabardo Sagrado
    ctx.fillStyle = steelMid;
    ctx.beginPath();
    ctx.moveTo(-9, -5 + bob);
    ctx.lineTo(9, -5 + bob);
    ctx.lineTo(6.5, 7 + bob);
    ctx.lineTo(-6.5, 7 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = steelDark;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Tabardo monástico
    ctx.fillStyle = tabardCol;
    ctx.beginPath();
    ctx.moveTo(-5, -5 + bob);
    ctx.lineTo(5, -5 + bob);
    ctx.lineTo(4, 8.5 + bob);
    ctx.lineTo(-4, 8.5 + bob);
    ctx.closePath();
    ctx.fill();

    // Cruz frontal no tabardo
    ctx.fillStyle = cCol.tabardCross || '#c23616';
    ctx.fillRect(-1.2, -4 + bob, 2.4, 10);
    ctx.fillRect(-3.8, -1.5 + bob, 7.6, 2.4);

    // Cinto e correia do coldre dorsal
    ctx.fillStyle = '#2c1e18';
    ctx.fillRect(-7, 4.5 + bob, 14, 3.2);
    if (!isHammerAttacking) {
      ctx.strokeStyle = '#2c1e18';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-6, -4 + bob);
      ctx.lineTo(5, 5 + bob);
      ctx.stroke();
    }
    ctx.fillStyle = goldTrim;
    ctx.fillRect(-2.5, 4.0 + bob, 5, 4.2);
    ctx.fillStyle = steelDark;
    ctx.fillRect(-1.2, 5.0 + bob, 2.4, 2.2);

    // 5. Ombreira Traseira e Braço Esquerdo
    ctx.fillStyle = steelDark;
    ctx.fillRect(-11, -3 + bob, 4, 8);
    ctx.fillStyle = goldTrim;
    ctx.beginPath();
    ctx.moveTo(-7, -6 + bob);
    ctx.lineTo(-14, -3 + bob);
    ctx.lineTo(-13, 2 + bob);
    ctx.lineTo(-8, 0 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = steelDark;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 6. Cabeça e Grande Elmo Gótico (Greathelm)
    ctx.fillStyle = steelMid;
    ctx.beginPath();
    ctx.moveTo(-5.5, -6 + bob);
    ctx.lineTo(6.5, -6 + bob);
    ctx.lineTo(7.5, -14 + bob);
    ctx.lineTo(-4.5, -15.5 + bob);
    ctx.lineTo(-7.0, -9 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = steelDark;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Crista superior do elmo
    ctx.fillStyle = steelLight;
    ctx.beginPath();
    ctx.moveTo(-1, -15.5 + bob);
    ctx.lineTo(2.5, -15 + bob);
    ctx.lineTo(2, -6 + bob);
    ctx.lineTo(-0.5, -6 + bob);
    ctx.closePath();
    ctx.fill();

    // Reforço em cruz de latão no visor
    ctx.fillStyle = goldTrim;
    ctx.fillRect(1.5, -13.5 + bob, 2, 7.5);
    ctx.fillRect(-2.5, -10.5 + bob, 8.5, 2.2);

    // Fenda ocular estilizada
    const glowCol = isDashing ? '#ffffff' : (cCol.eyeGlow || '#00d2d3');
    ctx.fillStyle = glowCol;
    ctx.fillRect(2.8, -10.2 + bob, 3.5, 1.4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4.5, -10.2 + bob, 1.5, 1.4);

    // Penacho Plumoso
    const plumeSway = player.isMoving ? Math.sin(player.walkCycle) * 3 : Math.sin(frameCount * 0.08) * 1.5;
    ctx.fillStyle = plumeCol;
    ctx.beginPath();
    ctx.moveTo(-3, -15 + bob);
    ctx.quadraticCurveTo(-9 - plumeSway, -21 + bob, -16 - Math.abs(plumeSway * 1.2), -15 + bob + plumeSway);
    ctx.quadraticCurveTo(-9 - plumeSway * 0.5, -14 + bob, -4, -13.5 + bob);
    ctx.closePath();
    ctx.fill();

    // 7. Pauldron Nobre Dianteiro
    ctx.fillStyle = steelLight;
    ctx.beginPath();
    ctx.moveTo(5, -6 + bob);
    ctx.lineTo(13.5, -4 + bob);
    ctx.lineTo(11.5, 2.5 + bob);
    ctx.lineTo(4, 0 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 8. Braço e Manopla (Postura Dinâmica de Empunhadura no Ataque)
    if (isHammerAttacking) {
      // Braços erguidos em postura pesada de ataque frontal de duas mãos
      ctx.fillStyle = steelMid;
      ctx.fillRect(5, -6 + bob, 6, 4.5);
      ctx.fillStyle = steelDark;
      ctx.fillRect(9, -8 + bob, 4.5, 4.5);
      ctx.fillStyle = goldTrim;
      ctx.fillRect(10, -7 + bob, 2.5, 2.5);
    } else {
      ctx.fillStyle = steelMid;
      ctx.fillRect(6, -2 + bob, 4.5, 7.5);
      ctx.fillStyle = steelDark;
      ctx.fillRect(6.5, 3 + bob, 4.5, 3.5);
      ctx.fillStyle = goldTrim;
      ctx.fillRect(7.5, 4 + bob, 1.5, 1.5);
    }

    // --- ULT: Asas Astrais de Éter e Aríete Frontal de Torre (Pavise) ---
    if (isDashing) {
      ctx.save();
      const wingFlap = Math.sin(frameCount * 0.45) * 6;

      // Asas Astrais Celestiais de Luz Translúcida
      ctx.fillStyle = 'rgba(241, 196, 15, 0.40)';
      ctx.strokeStyle = '#00d2d3';
      ctx.lineWidth = 2.0;

      // Asa Esquerda
      ctx.beginPath();
      ctx.moveTo(-4, -10 + bob);
      ctx.quadraticCurveTo(-18, -26 + wingFlap, -34, -18 + wingFlap);
      ctx.lineTo(-24, -8 + wingFlap * 0.5);
      ctx.lineTo(-30, 2 + wingFlap);
      ctx.lineTo(-14, 4 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Asa Direita
      ctx.beginPath();
      ctx.moveTo(2, -10 + bob);
      ctx.quadraticCurveTo(14, -28 + wingFlap, 32, -22 + wingFlap);
      ctx.lineTo(22, -9 + wingFlap * 0.5);
      ctx.lineTo(28, 0 + wingFlap);
      ctx.lineTo(10, 2 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Grande Aríete Sagrado Frontal (Escudo Torre Pavise)
      const pPulse = Math.sin(frameCount * 0.5) * 2.5;
      const shX = 16;
      ctx.fillStyle = 'rgba(241, 196, 15, 0.35)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.2;

      ctx.beginPath();
      ctx.moveTo(shX, -22 + pPulse);
      ctx.lineTo(shX + 11, -12);
      ctx.lineTo(shX + 10, 14);
      ctx.lineTo(shX, 22 - pPulse);
      ctx.lineTo(shX - 4, 16);
      ctx.lineTo(shX - 4, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cruz Heráldica Incandescente no Centro do Pavise
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(shX + 4, -14); ctx.lineTo(shX + 4, 14);
      ctx.moveTo(shX - 1, -2); ctx.lineTo(shX + 8, -2);
      ctx.stroke();

      // Ondas frontais de pressão e corte cinético
      ctx.strokeStyle = 'rgba(0, 206, 201, 0.65)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(shX + 8, 0, 18 + pPulse * 1.5, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      ctx.restore();
    }

    // Glifo Rúnico de Retaliação Melee
    if (isRetaliating) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let g = 0; g < 6; g++) {
        const ga = (g * Math.PI / 3) + frameCount * 0.05;
        const gx = Math.cos(ga) * 20;
        const gy = Math.sin(ga) * 20 + bob;
        if (g === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  } else if (selectedHeroKey === 'BARBARIAN') {
    const isBerserk = (player.berserkTimer || 0) > 0;
    const skinCol = charDef.color.skin || '#c67846';
    const runeCol = isBerserk ? '#ffffff' : (charDef.color.tattoo || '#f39c12');
    const hairCol = charDef.color.hair || '#d35400';
    const capeCol = charDef.color.cape || '#7f1d1d';
    const leatherCol = charDef.color.armor || '#2c1e18';
    const boneCol = charDef.color.bone || '#e2d7c5';

    // 1. Capa Pesada de Pele de Fera com Bainha Desgastada
    ctx.fillStyle = capeCol;
    ctx.beginPath();
    ctx.moveTo(-6, -1 + bob);
    ctx.lineTo(-15 - Math.abs(capeWave * 1.1), 16 + bob);
    ctx.lineTo(-8 - Math.abs(capeWave * 0.6), 18 + bob);
    ctx.lineTo(-2, 17 + bob);
    ctx.lineTo(4, -1 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1c120c';
    ctx.beginPath();
    ctx.moveTo(-15 - Math.abs(capeWave * 1.1), 14 + bob);
    ctx.lineTo(-16 - Math.abs(capeWave * 1.1), 17 + bob);
    ctx.lineTo(-8 - Math.abs(capeWave * 0.6), 19 + bob);
    ctx.lineTo(-2, 18 + bob);
    ctx.lineTo(-2, 16 + bob);
    ctx.closePath();
    ctx.fill();

    // 2. Pernas Robustas, Amarras Cruzadas e Botas Pesadas
    ctx.fillStyle = leatherCol;
    ctx.fillRect(-7.5 - legSwing * 0.45, 6.5 + bob, 5.5, 8.5);
    ctx.fillRect(2.0 + legSwing * 0.45, 6.5 + bob, 5.5, 8.5);

    ctx.strokeStyle = '#8d5524';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7.5 - legSwing * 0.45, 8.5 + bob);
    ctx.lineTo(-2.0 - legSwing * 0.45, 12 + bob);
    ctx.moveTo(2.0 + legSwing * 0.45, 8.5 + bob);
    ctx.lineTo(7.5 + legSwing * 0.45, 12 + bob);
    ctx.stroke();

    ctx.fillStyle = '#1a1d20';
    ctx.fillRect(-8 - legSwing * 0.45, 12.5 + bob, 6.5, 3.5);
    ctx.fillRect(1.5 + legSwing * 0.45, 12.5 + bob, 6.5, 3.5);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(-7 - legSwing * 0.45, 14.5 + bob, 5, 1.5);
    ctx.fillRect(2.5 + legSwing * 0.45, 14.5 + bob, 5, 1.5);

    // 3. Tronco Musculoso de Colosso Tribal (Silhueta V-Taper Imponente)
    ctx.fillStyle = skinCol;
    ctx.beginPath();
    ctx.moveTo(-10.5, -5 + bob);
    ctx.lineTo(10.5, -5 + bob);
    ctx.lineTo(6.5, 7 + bob);
    ctx.lineTo(-6.5, 7 + bob);
    ctx.closePath();
    ctx.fill();

    // Tatuagens Rúnicas Corporais (Pulsam em chamas no modo Berserk)
    ctx.strokeStyle = runeCol;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-7, -2 + bob);
    ctx.lineTo(-3, 0 + bob);
    ctx.lineTo(-5, 3 + bob);
    ctx.lineTo(-1, 5 + bob);
    ctx.moveTo(1, -3 + bob);
    ctx.lineTo(5, -1 + bob);
    ctx.lineTo(3, 2 + bob);
    ctx.stroke();

    if (isBerserk) {
      ctx.fillStyle = '#ff7675';
      ctx.fillRect(-4, 0 + bob, 2.5, 2.5);
      ctx.fillRect(2, -1 + bob, 2.5, 2.5);
    }

    // Arnês de Couro em "X" com Broche Central
    ctx.strokeStyle = '#3d271d';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-9, -4 + bob);
    ctx.lineTo(6, 6 + bob);
    ctx.moveTo(9, -4 + bob);
    ctx.lineTo(-6, 6 + bob);
    ctx.stroke();

    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.arc(0, 1 + bob, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-1, 0 + bob, 2, 2);

    // Cinturão com Fivela de Ferro Rúnico
    ctx.fillStyle = leatherCol;
    ctx.fillRect(-7.5, 4.5 + bob, 15, 3.2);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(-2.5, 4.0 + bob, 5, 4.2);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-1.2, 5.0 + bob, 2.4, 2.2);

    // 4. Ombreira Traseira de Osso / Crânio de Fera com Cravos
    ctx.fillStyle = boneCol;
    ctx.beginPath();
    ctx.moveTo(-11, -6 + bob);
    ctx.quadraticCurveTo(-15, -4 + bob, -13, 1 + bob);
    ctx.lineTo(-8, -1 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2c1e18';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-13, -3 + bob);
    ctx.lineTo(-17, -7 + bob);
    ctx.lineTo(-11, -6 + bob);
    ctx.closePath();
    ctx.fill();

    // 5. Braços Musculosos com Munhequeiras Reforçadas
    ctx.fillStyle = skinCol;
    ctx.fillRect(-11, -3 + bob, 4.5, 8);
    ctx.fillRect(7, -3 + bob, 4.5, 8);
    ctx.fillStyle = leatherCol;
    ctx.fillRect(-11.5, 2 + bob, 5, 3.5);
    ctx.fillRect(6.5, 2 + bob, 5, 3.5);
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(-10.5, 3 + bob, 1.5, 1.5);
    ctx.fillRect(8.0, 3 + bob, 1.5, 1.5);

    // 6. Gola de Peles de Lobo nos Ombros
    ctx.fillStyle = '#4a332d';
    ctx.beginPath();
    ctx.moveTo(-10, -6 + bob);
    ctx.quadraticCurveTo(0, -3 + bob, 10, -6 + bob);
    ctx.lineTo(8, -8.5 + bob);
    ctx.quadraticCurveTo(0, -6 + bob, -8, -8.5 + bob);
    ctx.closePath();
    ctx.fill();

    // 7. Cabeça, Rosto e Olhos Furiosos
    ctx.fillStyle = skinCol;
    ctx.beginPath();
    ctx.arc(0.5, -9.5 + bob, 6.2, 0, Math.PI * 2);
    ctx.fill();

    if (isBerserk) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2.0, -10.5 + bob, 3.5, 2.2);
      ctx.strokeStyle = '#ff3838';
      ctx.lineWidth = 1;
      ctx.strokeRect(2.0, -10.5 + bob, 3.5, 2.2);
    } else {
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(2.2, -10.5 + bob, 2.5, 2.0);
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(3.0, -10.2 + bob, 1.4, 1.4);
    }

    ctx.strokeStyle = '#4a2810';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(1.5, -11.5 + bob);
    ctx.lineTo(5.2, -10.2 + bob);
    ctx.stroke();

    // 8. Barba Ruiva Trançada com Anel de Osso e Bigode
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.moveTo(-2.5, -8.5 + bob);
    ctx.lineTo(5.5, -8.5 + bob);
    ctx.quadraticCurveTo(8.5, -3 + bob, 6.0, 1 + bob);
    ctx.lineTo(1.5, 2.5 + bob);
    ctx.quadraticCurveTo(0.5, -3 + bob, -2.5, -8.5 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(2.0, 1.5 + bob);
    ctx.lineTo(5.0, 1.5 + bob);
    ctx.lineTo(3.5, 6.0 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = boneCol;
    ctx.fillRect(2.2, 2.2 + bob, 2.6, 1.8);

    ctx.fillStyle = '#b33927';
    ctx.beginPath();
    ctx.moveTo(1.0, -7.5 + bob);
    ctx.lineTo(6.5, -6.0 + bob);
    ctx.lineTo(2.5, -5.5 + bob);
    ctx.closePath();
    ctx.fill();

    // 9. Cabelos Longos Selvagens
    const hairWave = player.isMoving ? Math.sin(player.walkCycle) * 3.5 : Math.sin(frameCount * 0.08) * 1.5;
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.moveTo(-2, -12 + bob);
    ctx.quadraticCurveTo(-9 - hairWave * 0.7, -13 + bob, -14 - Math.abs(hairWave), -6 + bob + hairWave * 0.5);
    ctx.quadraticCurveTo(-8, -7 + bob, -4, -8 + bob);
    ctx.closePath();
    ctx.fill();

    // 10. Diadema de Ferro e Chifres Rústicos Esculpidos
    ctx.fillStyle = '#57606f';
    ctx.fillRect(-5.5, -14.5 + bob, 11, 3.2);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-0.8, -14.0 + bob, 2.0, 2.2);

    ctx.fillStyle = boneCol;
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(-5.0, -13.5 + bob);
    ctx.quadraticCurveTo(-11.5, -16.5 + bob, -11.0, -22 + bob);
    ctx.quadraticCurveTo(-7.5, -17.5 + bob, -3.5, -14.5 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(3.5, -14.5 + bob);
    ctx.quadraticCurveTo(7.5, -17.5 + bob, 11.0, -22 + bob);
    ctx.quadraticCurveTo(11.5, -16.5 + bob, 5.0, -13.5 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (selectedHeroKey === 'ALCHEMIST') {
    const fluidColor = player.evolvedPotion ? '#00cec9' : '#2ecc71';
    const hairSway = player.isMoving ? Math.sin(player.walkCycle) * 4.5 : Math.sin(frameCount * 0.08) * 1.5;

    // 1. Abas do Casaco / Fraque posterior (ondulam fluidas com os passos)
    ctx.fillStyle = '#165b4c';
    ctx.beginPath();
    ctx.moveTo(-5, 3 + bob);
    ctx.lineTo(-10 - Math.abs(hairSway * 0.9), 15 + bob);
    ctx.lineTo(-3, 15 + bob);
    ctx.lineTo(2, 3 + bob);
    ctx.closePath();
    ctx.fill();

    // 2. Caníster Dorsal Esguio (cilindro de vidro fino e vertical, sem sobrecarregar as costas)
    ctx.fillStyle = 'rgba(20, 36, 30, 0.85)';
    ctx.fillRect(-8.5, -5 + bob, 4.5, 11);
    ctx.fillStyle = fluidColor;
    ctx.fillRect(-8, 0 + bob, 3.5, 5.5);
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 1;
    ctx.strokeRect(-8.5, -5 + bob, 4.5, 11);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(-9, -7 + bob, 5.5, 2);

    // 3. Pernas e Botas Esbeltas
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(-5 - legSwing * 0.35, 7 + bob, 3.2, 8);
    ctx.fillRect(1.5 + legSwing * 0.35, 7 + bob, 3.2, 8);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(-5 - legSwing * 0.35, 11 + bob, 3.2, 1.5);
    ctx.fillRect(1.5 + legSwing * 0.35, 11 + bob, 3.2, 1.5);

    // 4. Tronco com Silhueta Feminina (Corselete ajustado e cintura delineada)
    ctx.fillStyle = '#16a085';
    ctx.fillRect(-6, -4 + bob, 12, 10);

    // Corselete escuro acinturado
    ctx.fillStyle = '#2c1e18';
    ctx.beginPath();
    ctx.moveTo(-4.5, -3 + bob);
    ctx.lineTo(4.5, -3 + bob);
    ctx.lineTo(3.2, 5 + bob);
    ctx.lineTo(-3.2, 5 + bob);
    ctx.closePath();
    ctx.fill();

    // Amarração frontal de latão
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1.2, -2 + bob);
    ctx.lineTo(1.2, -0.5 + bob);
    ctx.lineTo(-1.2, 1 + bob);
    ctx.lineTo(1.2, 2.5 + bob);
    ctx.stroke();

    // Cinto fino e frascos laterais suspensos no quadril
    ctx.fillStyle = '#4a3525';
    ctx.fillRect(-5, 4.5 + bob, 10, 1.8);
    ctx.fillStyle = fluidColor;
    ctx.fillRect(3.8, 3.5 + bob, 2, 4);
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(3.8, 7.5 + bob, 2, 3.5);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(3.4, 3 + bob, 2.8, 1.2);
    ctx.fillRect(3.4, 7 + bob, 2.8, 1.2);

    // 5. Pescoço e Respirador Baixado (gola aberta, deixando o queixo e rosto livres)
    ctx.fillStyle = '#f5cd79';
    ctx.fillRect(-2, -6 + bob, 4, 3);
    ctx.fillStyle = '#34495e';
    ctx.fillRect(-3.5, -5 + bob, 7, 2.2);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(-4, -4.5 + bob, 1.8, 1.8);
    ctx.fillRect(2.2, -4.5 + bob, 1.8, 1.8);

    // 6. Rosto Feminino Visível
    ctx.fillStyle = '#f5cd79';
    ctx.beginPath();
    ctx.arc(0.5, -9 + bob, 5.2, 0, Math.PI * 2);
    ctx.fill();

    // Olho delicado e focado
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(2.2, -9.5 + bob, 2.2, 1.5);
    ctx.fillStyle = '#00cec9';
    ctx.fillRect(2.7, -9.2 + bob, 1.2, 1.2);

    // 7. Cabelo Roxo Característico, Óculos na Testa e Rabo de Cavalo Fluido
    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(0, -10.5 + bob, 5.8, Math.PI * 0.85, Math.PI * 2.15);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1, -11 + bob);
    ctx.lineTo(4, -8 + bob);
    ctx.lineTo(2, -7 + bob);
    ctx.closePath();
    ctx.fill();

    // Óculos de alquimista (goggles) pousados na testa
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(0.8, -12.5 + bob, 4.2, 2.2);
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(1.5, -12.2 + bob, 2.8, 1.4);
    ctx.strokeStyle = '#4a3525';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0.8, -11.5 + bob);
    ctx.lineTo(-4, -10.5 + bob);
    ctx.stroke();

    // Rabo de cavalo longo que ondula para trás com a caminhada
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(-5.2, -12 + bob, 2.4, 2.4); // Presilha
    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.moveTo(-4.5, -12 + bob);
    ctx.quadraticCurveTo(-11 - hairSway * 0.8, -13 + bob - hairSway * 0.3, -15 - Math.abs(hairSway), -4 + bob + hairSway);
    ctx.quadraticCurveTo(-10 - hairSway * 0.5, -7 + bob, -4.5, -9.5 + bob);
    ctx.closePath();
    ctx.fill();

    // 8. Braço e Mão Segurando Frasco Erlenmeyer
    ctx.fillStyle = '#16a085';
    ctx.fillRect(-1, -2 + bob, 3.5, 4.5);
    ctx.fillStyle = '#2c1e18';
    ctx.fillRect(1, 1 + bob, 3, 3.5);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.moveTo(3, 3.5 + bob);
    ctx.lineTo(5.5, 3.5 + bob);
    ctx.lineTo(7, 7.5 + bob);
    ctx.lineTo(1.5, 7.5 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = fluidColor;
    ctx.beginPath();
    ctx.moveTo(2.4, 5.5 + bob);
    ctx.lineTo(6.1, 5.5 + bob);
    ctx.lineTo(6.6, 7.2 + bob);
    ctx.lineTo(1.9, 7.2 + bob);
    ctx.closePath();
    ctx.fill();
  } else if (selectedHeroKey === 'MAGE') {
    const isDashing = player.ignisDashDuration > 0;
    const isCasting = (player.staffCastTimer || 0) > 0 || bullets.some(b => b.type === 'STAFF' && b.life > 48);
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
      ctx.save();
      // Fantasmas térmicos com decaimento cromático
      const ghostColors = [
        'rgba(255, 255, 255, 0.45)',
        'rgba(241, 196, 15, 0.35)',
        'rgba(230, 126, 34, 0.25)',
        'rgba(192, 57, 43, 0.15)'
      ];
      for (let g = 0; g < ghostColors.length; g++) {
        const gDist = (g + 1) * 9;
        ctx.fillStyle = ghostColors[g];
        ctx.beginPath();
        ctx.ellipse(-gDist, bob, 11, 15, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Anéis de solo em brasa viva sob os pés
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.85)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(0, 14 + bob, 20, 6.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Asas Espectrais da Fênix de Plasma
      const wingFlap = Math.sin(frameCount * 0.55) * 5;
      ctx.fillStyle = 'rgba(241, 196, 15, 0.45)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;

      // Asa Posterior
      ctx.beginPath();
      ctx.moveTo(-4, -8 + bob);
      ctx.quadraticCurveTo(-18, -26 + wingFlap, -36, -16 + wingFlap);
      ctx.lineTo(-24, -6 + wingFlap * 0.5);
      ctx.lineTo(-30, 4 + wingFlap);
      ctx.lineTo(-12, 4 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Asa Anterior
      ctx.beginPath();
      ctx.moveTo(3, -8 + bob);
      ctx.quadraticCurveTo(16, -28 + wingFlap, 34, -20 + wingFlap);
      ctx.lineTo(24, -7 + wingFlap * 0.5);
      ctx.lineTo(29, 2 + wingFlap);
      ctx.lineTo(10, 3 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 1. Manto da Fênix (Capa Dupla Bifurcada com Ondulação Térmica)
    // Camada interna incandescente
    ctx.fillStyle = capeIn;
    ctx.beginPath();
    ctx.moveTo(-4, -2 + bob);
    ctx.lineTo(-16 - Math.abs(capeWave * 1.2), 17 + bob);
    ctx.lineTo(-9 - Math.abs(capeWave * 0.7), 12 + bob);
    ctx.lineTo(-13 - Math.abs(capeWave * 1.1), 19 + bob);
    ctx.lineTo(-2, 16 + bob);
    ctx.lineTo(2, -2 + bob);
    ctx.closePath();
    ctx.fill();

    // Camada externa nobre com bainha denteada
    ctx.fillStyle = capeExt;
    ctx.beginPath();
    ctx.moveTo(-4, -3 + bob);
    ctx.lineTo(-14 - Math.abs(capeWave * 1.0), 15 + bob);
    ctx.lineTo(-8 - Math.abs(capeWave * 0.6), 11 + bob);
    ctx.lineTo(-11 - Math.abs(capeWave * 0.9), 17 + bob);
    ctx.lineTo(-1, 15 + bob);
    ctx.lineTo(3, -3 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // 2. Coldre Dorsal do Cajado da Tormenta (Exibido em repouso, esconde na conjuração)
    if (!isCasting) {
      ctx.save();
      ctx.translate(-2, -3 + bob);
      ctx.rotate(-0.52);

      // Haste de madeira petrificada
      ctx.fillStyle = staffWood;
      ctx.fillRect(-1.8, -12, 3.6, 36);

      // Ponteira inferior de latão
      ctx.fillStyle = staffGold;
      ctx.fillRect(-2.2, 23, 4.4, 3);

      // Coroa com garras superiores de ouro
      ctx.fillStyle = staffGold;
      ctx.beginPath();
      ctx.moveTo(-5.5, -12);
      ctx.lineTo(5.5, -12);
      ctx.lineTo(4.5, -18);
      ctx.lineTo(0, -14);
      ctx.lineTo(-4.5, -18);
      ctx.closePath();
      ctx.fill();

      // Cristal de Magma incandescente no núcleo da coroa
      ctx.fillStyle = crystalCol;
      ctx.beginPath();
      ctx.arc(0, -18, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-1, -19, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Pernas e Botas Arcanas de Batalha
    const legLeftX = -5.5 - legSwing * 0.35;
    const legRightX = 1.2 + legSwing * 0.35;

    ctx.fillStyle = robeDark;
    ctx.fillRect(legLeftX, 6 + bob, 4, 8);
    ctx.fillRect(legRightX, 6 + bob, 4, 8);

    // Botas de couro com canos de latão
    ctx.fillStyle = '#1e130c';
    ctx.fillRect(legLeftX - 0.5, 11 + bob, 5, 4.5);
    ctx.fillRect(legRightX - 0.5, 11 + bob, 5, 4.5);
    ctx.fillStyle = copperTrim;
    ctx.fillRect(legLeftX, 10.5 + bob, 4, 1.5);
    ctx.fillRect(legRightX, 10.5 + bob, 4, 1.5);

    // 4. Tronco com Túnica Flutuante, Corselete e Faixas Rituais
    ctx.fillStyle = robeMid;
    ctx.beginPath();
    ctx.moveTo(-7.5, -5 + bob);
    ctx.lineTo(7.5, -5 + bob);
    ctx.lineTo(5.5, 8 + bob);
    ctx.lineTo(-5.5, 8 + bob);
    ctx.closePath();
    ctx.fill();

    // Corselete escuro delineado
    ctx.fillStyle = corsetCol;
    ctx.beginPath();
    ctx.moveTo(-5.5, -4 + bob);
    ctx.lineTo(5.5, -4 + bob);
    ctx.lineTo(4, 5 + bob);
    ctx.lineTo(-4, 5 + bob);
    ctx.closePath();
    ctx.fill();

    // Runa Central de Confinamento Ígneo no Peitoral
    const runePulse = Math.sin(frameCount * 0.2) * 0.5 + 0.5;
    ctx.fillStyle = isDashing ? '#ffffff' : (runePulse > 0.5 ? goldTrim : copperTrim);
    ctx.fillRect(-1.2, -3.5 + bob, 2.4, 5.5);
    ctx.fillRect(-2.8, -1.8 + bob, 5.6, 2.0);

    // Cinto e faixa pendente ritualística com pontas chanfradas
    ctx.fillStyle = '#2c1e18';
    ctx.fillRect(-6, 4.5 + bob, 12, 2.8);
    ctx.fillStyle = copperTrim;
    ctx.beginPath();
    ctx.moveTo(-2, 6 + bob);
    ctx.lineTo(2, 6 + bob);
    ctx.lineTo(1.5, 13 + bob);
    ctx.lineTo(0, 15 + bob);
    ctx.lineTo(-1.5, 13 + bob);
    ctx.closePath();
    ctx.fill();

    // Fivela de Ouro Solar
    ctx.fillStyle = goldTrim;
    ctx.fillRect(-2.5, 4.0 + bob, 5, 3.8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, 5.0 + bob, 2, 1.8);

    // 5. Ombreiras em Formato de Labaredas Ascendentes
    ctx.fillStyle = copperTrim;
    ctx.beginPath();
    ctx.moveTo(-8, -6 + bob);
    ctx.lineTo(-13, -3 + bob);
    ctx.lineTo(-12, -9 + bob);
    ctx.lineTo(-6, -7 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = copperTrim;
    ctx.beginPath();
    ctx.moveTo(5, -6 + bob);
    ctx.lineTo(13, -3 + bob);
    ctx.lineTo(11, -10 + bob);
    ctx.lineTo(4, -7 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 6. Cabeça de Chama Viva Elemental (Ciclo Térmico: Vermelho -> Laranja -> Amarelo)
    const colorCycle = (frameCount * 0.04) % 3;
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
    const fWave1 = Math.sin(frameCount * 0.18) * 2.5;
    const fWave2 = Math.cos(frameCount * 0.22) * 2.2;
    const tipX = Math.sin(frameCount * 0.15) * 2.8 - (player.isMoving ? 2 : 0);
    const tipY = -21 + bob + Math.cos(frameCount * 0.18) * 1.8;
    const leftTongueX = -8.5 + fWave1;
    const leftTongueY = -13 + bob + fWave2 * 0.5;
    const rightTongueX = 7.5 + fWave2;
    const rightTongueY = -12.5 + bob + fWave1 * 0.5;

    // 6.1 Camada Exterior da Labareda
    ctx.fillStyle = outerFlameColor;
    ctx.beginPath();
    ctx.moveTo(-5, -6 + bob);
    ctx.quadraticCurveTo(-8, -9 + bob, leftTongueX, leftTongueY);
    ctx.quadraticCurveTo(-4, -13 + bob, tipX, tipY);
    ctx.quadraticCurveTo(4, -14 + bob, rightTongueX, rightTongueY);
    ctx.quadraticCurveTo(7.5, -9 + bob, 5, -6 + bob);
    ctx.closePath();
    ctx.fill();

    // 6.2 Camada Média Incandescente
    ctx.fillStyle = midFlameColor;
    ctx.beginPath();
    ctx.moveTo(-3.5, -6 + bob);
    ctx.quadraticCurveTo(-6, -8.5 + bob, leftTongueX * 0.7, leftTongueY + 2);
    ctx.quadraticCurveTo(-2, -11 + bob, tipX * 0.6, tipY + 3.5);
    ctx.quadraticCurveTo(3, -12 + bob, rightTongueX * 0.7, rightTongueY + 2);
    ctx.quadraticCurveTo(5.5, -8.5 + bob, 3.5, -6 + bob);
    ctx.closePath();
    ctx.fill();

    // 6.3 Núcleo Solar Branco de Plasma
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0.5, -9.5 + bob, 2.8, 4.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6.4 Fagulhas Térmicas Ascendentes Desprendendo da Ponta
    const ember1Y = tipY - 3 - ((frameCount * 0.4) % 8);
    const ember2Y = tipY - 2 - (((frameCount + 12) * 0.4) % 8);
    ctx.fillStyle = midFlameColor;
    ctx.fillRect(tipX - 1, ember1Y, 1.8, 1.8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tipX + 1.2, ember2Y, 1.4, 1.4);

    // 7. Olhos de Fogo Ancestrais (Fendas Arcanas Flutuantes)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = outerFlameColor;
    ctx.lineWidth = 1.0;

    // Olho Frontal
    ctx.beginPath();
    ctx.moveTo(1.5, -11 + bob);
    ctx.lineTo(4.5, -9.5 + bob);
    ctx.lineTo(1.8, -8.5 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Olho Traseiro
    ctx.beginPath();
    ctx.moveTo(-3.5, -11 + bob);
    ctx.lineTo(-0.8, -9.5 + bob);
    ctx.lineTo(-3.2, -8.5 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 8. Braço e Mão (Postura de Ataque com Cajado ou Repouso)
    if (isCasting) {
      // Braço projetado à frente sustentando o Cajado da Tormenta
      ctx.fillStyle = robeMid;
      ctx.fillRect(3, -4 + bob, 7, 4);
      ctx.fillStyle = '#f5cd79';
      ctx.fillRect(9, -4 + bob, 3, 3.5);

      // Cajado frontal empunhado com cristal ardente
      ctx.save();
      ctx.translate(11, -3 + bob);
      ctx.rotate(0.22);
      ctx.fillStyle = staffWood;
      ctx.fillRect(-1.6, -18, 3.2, 38);
      ctx.fillStyle = staffGold;
      ctx.fillRect(-2.2, -18, 4.4, 5);
      ctx.fillStyle = crystalCol;
      ctx.beginPath();
      ctx.arc(0, -20, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-1, -21, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = robeMid;
      ctx.fillRect(5, -2 + bob, 3.8, 7);
      ctx.fillStyle = copperTrim;
      ctx.fillRect(5, 2 + bob, 3.8, 2.5);
      ctx.fillStyle = '#f5cd79';
      ctx.fillRect(5.5, 4 + bob, 3, 2.5);
    }
  } else if (selectedHeroKey === 'ROGUE') {
    const isPhasing = player.isPhasing || (player.invisTimer > 0);
    const isAttacking = bullets.some(b => b.type === 'SWORD' && b.life > 45);
    const cCol = charDef.color || {};

    // --- ULT/HABILIDADE: Pós-Imagens de Fumaça e Rastro Espectral ---
    if (isPhasing) {
      ctx.save();
      // Silhuetas residuais de névoa escura em decalque
      for (let g = 1; g <= 3; g++) {
        const ghostDist = g * 8.5;
        ctx.fillStyle = `rgba(16, 172, 132, ${0.30 / g})`;
        ctx.beginPath();
        ctx.ellipse(-ghostDist, bob + 1, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(10, 13, 14, ${0.40 / g})`;
        ctx.beginPath();
        ctx.ellipse(-ghostDist * 0.7, bob, 8, 13, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Névoa condensada rastejando no solo sob os passos
      ctx.strokeStyle = 'rgba(0, 206, 201, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.ellipse(0, 14 + bob, 18, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 1. Capa Esfarrapada de Três Pontas (Rasgada e Esvoaçante)
    // Forro interno escuro
    ctx.fillStyle = cCol.capeInner || '#07261f';
    ctx.beginPath();
    ctx.moveTo(-4, -3 + bob);
    ctx.lineTo(-15 - Math.abs(capeWave * 1.3), 16 + bob);
    ctx.lineTo(-9 - Math.abs(capeWave * 0.8), 12 + bob);
    ctx.lineTo(-12 - Math.abs(capeWave * 1.1), 18 + bob);
    ctx.lineTo(-3, 15 + bob);
    ctx.lineTo(2, -3 + bob);
    ctx.closePath();
    ctx.fill();

    // Camada principal com gomos denteados
    ctx.fillStyle = cCol.cape || '#0e4438';
    ctx.beginPath();
    ctx.moveTo(-4, -4 + bob);
    ctx.lineTo(-13 - Math.abs(capeWave * 1.1), 14 + bob);
    ctx.lineTo(-8 - Math.abs(capeWave * 0.6), 10 + bob);
    ctx.lineTo(-10 - Math.abs(capeWave * 0.9), 16 + bob);
    ctx.lineTo(-1, 14 + bob);
    ctx.lineTo(3, -4 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = cCol.capeTrim || '#16a085';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. Bainhas Cruzadas nas Costas e Lâminas Espirituais
    ctx.save();
    ctx.translate(-1, -3 + bob);

    // Correia de couro cruzada que sustenta as bainhas
    ctx.strokeStyle = cCol.leatherStraps || '#2d3436';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-6, -3);
    ctx.lineTo(5, 7);
    ctx.moveTo(5, -3);
    ctx.lineTo(-6, 7);
    ctx.stroke();

    // Se o herói não estiver em ataque pleno, renderiza as adagas no coldre
    if (!isAttacking) {
      // Adaga Esquerda (inclinada a -40 graus)
      ctx.save();
      ctx.rotate(-0.65);
      ctx.fillStyle = cCol.scabbard || '#1e272e';
      ctx.fillRect(-2, -10, 4, 16);
      ctx.fillStyle = cCol.hiltGold || '#f1c40f';
      ctx.fillRect(-3.5, -11, 7, 2);
      ctx.fillStyle = cCol.bladeGlow || '#00cec9';
      ctx.fillRect(-1.5, -16, 3, 5);
      ctx.restore();

      // Adaga Direita (inclinada a +40 graus)
      ctx.save();
      ctx.rotate(0.65);
      ctx.fillStyle = cCol.scabbard || '#1e272e';
      ctx.fillRect(-2, -10, 4, 16);
      ctx.fillStyle = cCol.hiltGold || '#f1c40f';
      ctx.fillRect(-3.5, -11, 7, 2);
      ctx.fillStyle = cCol.bladeGlow || '#00cec9';
      ctx.fillRect(-1.5, -16, 3, 5);
      ctx.restore();
    }
    ctx.restore();

    // 3. Pernas, Botas Táticas Leves e Bandagens
    const legLeftX = -6 - legSwing * 0.4;
    const legRightX = 1.5 + legSwing * 0.4;

    ctx.fillStyle = cCol.tunicDark || '#0f1417';
    ctx.fillRect(legLeftX, 6 + bob, 4.2, 8);
    ctx.fillRect(legRightX, 6 + bob, 4.2, 8);

    // Bandagens nas canelas
    ctx.strokeStyle = cCol.bandages || '#7f8c8d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(legLeftX, 8 + bob); ctx.lineTo(legLeftX + 4.2, 11 + bob);
    ctx.moveTo(legRightX, 8 + bob); ctx.lineTo(legRightX + 4.2, 11 + bob);
    ctx.stroke();

    // Botas de couro flexível
    ctx.fillStyle = '#1e130c';
    ctx.fillRect(legLeftX - 1, 12.5 + bob, 5.5, 3.2);
    ctx.fillRect(legRightX - 1, 12.5 + bob, 5.5, 3.2);
    ctx.fillStyle = cCol.buckles || '#bdc3c7';
    ctx.fillRect(legLeftX + 2.5, 13 + bob, 1.5, 2);
    ctx.fillRect(legRightX + 2.5, 13 + bob, 1.5, 2);

    // 4. Tronco Ágil, Colete de Couro Reforçado e Cinturão de Bolsas
    ctx.fillStyle = cCol.tunic || '#1e272e';
    ctx.beginPath();
    ctx.moveTo(-7, -5 + bob);
    ctx.lineTo(7, -5 + bob);
    ctx.lineTo(5, 7 + bob);
    ctx.lineTo(-5, 7 + bob);
    ctx.closePath();
    ctx.fill();

    // Corselete / Armadura Peitoral Leve
    ctx.fillStyle = cCol.tunicDark || '#0f1417';
    ctx.beginPath();
    ctx.moveTo(-5, -4 + bob);
    ctx.lineTo(5, -4 + bob);
    ctx.lineTo(3.5, 4 + bob);
    ctx.lineTo(-3.5, 4 + bob);
    ctx.closePath();
    ctx.fill();

    // Cinturão Utilitário com bolsas e cápsulas de fumaça
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(-6.5, 4.5 + bob, 13, 2.8);
    ctx.fillStyle = cCol.capeTrim || '#16a085';
    ctx.fillRect(-4.5, 4 + bob, 2.5, 3.5);
    ctx.fillRect(2.0, 4 + bob, 2.5, 3.5);
    ctx.fillStyle = cCol.buckles || '#bdc3c7';
    ctx.fillRect(-1, 4.2 + bob, 2, 3.2);

    // 5. Braços e Manoplas com Lâminas Ocultas
    if (isAttacking) {
      // Postura projetada para arremesso de adagas astrais
      ctx.fillStyle = cCol.tunic || '#1e272e';
      ctx.fillRect(3, -4 + bob, 7, 3.5);
      ctx.fillStyle = cCol.leatherStraps || '#2d3436';
      ctx.fillRect(7, -4 + bob, 3.5, 3.5);
      // Brilho astral na ponta dos dedos
      ctx.fillStyle = cCol.bladeGlow || '#00cec9';
      ctx.beginPath();
      ctx.arc(11, -2.5 + bob, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = cCol.tunic || '#1e272e';
      ctx.fillRect(-9, -3 + bob, 3.5, 7);
      ctx.fillRect(5.5, -3 + bob, 3.5, 7);
      ctx.fillStyle = cCol.bandages || '#7f8c8d';
      ctx.fillRect(-9.5, 1.5 + bob, 4, 2.5);
      ctx.fillRect(5.5, 1.5 + bob, 4, 2.5);
    }

    // 6. Gola Alta e Cachecol Cobrindo a Garganta
    ctx.fillStyle = cCol.hood || '#182c25';
    ctx.beginPath();
    ctx.moveTo(-6, -6 + bob);
    ctx.lineTo(6, -6 + bob);
    ctx.lineTo(4, -2 + bob);
    ctx.lineTo(-4, -2 + bob);
    ctx.closePath();
    ctx.fill();

    // 7. Cabeça: Capuz Sombrio Pontiagudo (Shadow Cowl)
    ctx.fillStyle = cCol.hood || '#182c25';
    ctx.beginPath();
    ctx.moveTo(-6, -5 + bob);
    ctx.quadraticCurveTo(-7, -12 + bob, -2, -16.5 + bob);
    ctx.quadraticCurveTo(5, -14 + bob, 6.5, -5 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = cCol.capeTrim || '#16a085';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // 8. Rosto em Trevas e Fenda Ocular Espectral
    ctx.fillStyle = cCol.shadowFace || '#0a0d0e';
    ctx.beginPath();
    ctx.moveTo(-4.5, -6 + bob);
    ctx.lineTo(4.5, -6 + bob);
    ctx.lineTo(3.5, -12 + bob);
    ctx.lineTo(-3.5, -12 + bob);
    ctx.closePath();
    ctx.fill();

    // Olho Espectral Brilhante (Ciano / Lâmina Astral)
    const eyeSparkle = Math.sin(frameCount * 0.15) * 0.5 + 1.2;
    ctx.fillStyle = isPhasing ? '#ffffff' : (cCol.eyeGlow || '#00cec9');
    ctx.fillRect(1.5, -10 + bob, 3.2, 1.6);

    ctx.fillStyle = 'rgba(0, 206, 201, 0.45)';
    ctx.fillRect(0.5, -9.6 + bob, 1.5, 1.0);
    ctx.fillRect(4.5, -10.2 + bob, eyeSparkle, 1.2);
  } else {
    // Fallback genérico para chaves de heróis não mapeadas
    ctx.fillStyle = charDef.color.cape || '#7f8c8d';
    ctx.beginPath();
    ctx.moveTo(-4, -2 + bob);
    ctx.lineTo(-12 - Math.abs(capeWave), 13 + bob);
    ctx.lineTo(-2, 14 + bob);
    ctx.lineTo(2, -2 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e1b18';
    ctx.fillRect(-6 - legSwing * 0.4, 7 + bob, 4, 7);
    ctx.fillRect(2 + legSwing * 0.4, 7 + bob, 4, 7);

    ctx.fillStyle = charDef.color.armor || '#95a5a6';
    ctx.fillRect(-8, -4 + bob, 16, 12);
  }

  ctx.restore();
}