/**
 * src/entities/bosses/vampireLord/render.js
 * Renderização procedural vetorial completa do Lorde Vampírico (Boss 1).
 */

// ============================================================================
// SISTEMA DE RENDERIZAÇÃO PROCEDURAL VETORIAL
// ============================================================================

function drawTeleportDeparture(ctx, e, frameCount) {
  const progress = Math.max(0, Math.min(1, 1 - (e.teleportResolveTimer / 50)));
  const alpha = Math.max(0, 1 - progress * 1.5);
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(26, 2, 8, 0.7)';
  ctx.beginPath();
  ctx.ellipse(0, 20, e.radius * (1 - progress * 0.6), 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const batCount = 8;
  ctx.fillStyle = '#0a0104';
  for (let i = 0; i < batCount; i++) {
    const angle = (i * Math.PI * 2 / batCount) + frameCount * 0.1;
    const dist = progress * (e.radius * 2.2) + 6;
    const bx = Math.cos(angle) * dist;
    const by = Math.sin(angle) * dist * 0.6 - progress * 24;
    const flap = Math.sin(frameCount * 0.5 + i) * 5;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 6, by - 4 + flap);
    ctx.lineTo(bx - 2, by + 3);
    ctx.lineTo(bx + 2, by + 3);
    ctx.lineTo(bx + 6, by - 4 + flap);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawMistVortex(ctx, e, frameCount) {
  const t = frameCount * 0.16;

  for (let c = 0; c < 3; c++) {
    const rOffset = Math.sin(t + c * 1.8) * 5;
    ctx.fillStyle = c === 0 ? 'rgba(142, 68, 173, 0.4)' : (c === 1 ? 'rgba(104, 8, 29, 0.45)' : 'rgba(20, 2, 8, 0.55)');
    ctx.beginPath();
    ctx.ellipse((c - 1) * 8, (c % 2 === 0 ? 4 : -4), (e.radius * 0.95) + rOffset, (e.radius * 0.65) - rOffset * 0.5, t * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const batCount = 6;
  ctx.fillStyle = '#0a0104';
  for (let i = 0; i < batCount; i++) {
    const phase = t * 2 + i * (Math.PI * 2 / batCount);
    const bx = Math.cos(phase) * (e.radius * 0.75);
    const by = Math.sin(phase) * (e.radius * 0.45);
    const flap = Math.sin(frameCount * 0.45 + i) * 6;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 7, by - 5 + flap);
    ctx.lineTo(bx - 3, by + 4);
    ctx.lineTo(bx + 3, by + 4);
    ctx.lineTo(bx + 7, by - 5 + flap);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff1744';
    ctx.fillRect(bx - 1.5, by - 1, 1.2, 1.2);
    ctx.fillRect(bx + 0.5, by - 1, 1.2, 1.2);
    ctx.fillStyle = '#0a0104';
  }
}

function drawVulnerabilityGliph(ctx, e, frameCount) {
  const pulse = Math.sin(frameCount * 0.18) * 3;
  const R = e.radius * 0.95 + pulse;

  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 40, R, 15, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
  ctx.fill();

  const runeCount = 5;
  const rot = frameCount * 0.025;
  ctx.lineWidth = 1.8;
  for (let k = 0; k < runeCount; k++) {
    const a = rot + (k * Math.PI * 2 / runeCount);
    const rx = Math.cos(a) * R;
    const ry = 40 + Math.sin(a) * 15;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry - 3);
    ctx.lineTo(rx + 3, ry + 3);
    ctx.moveTo(rx + 3, ry - 3);
    ctx.lineTo(rx - 3, ry + 3);
    ctx.stroke();
  }
}

function drawSingleWing(ctx, side, flap, span, isVuln, isEnraged, frameCount = 0) {
  ctx.save();
  ctx.scale(side, 1);

  const boneCol = isVuln ? '#1a0b12' : (isEnraged ? '#590a18' : '#1a040b');
  const boneHighlight = isVuln ? '#3a1b25' : (isEnraged ? '#c0392b' : '#3d0814');
  const membraneBase = isVuln ? 'rgba(35, 6, 15, 0.75)' : (isEnraged ? 'rgba(180, 15, 45, 0.88)' : 'rgba(95, 7, 24, 0.85)');
  const membraneShade = isVuln ? 'rgba(12, 2, 5, 0.85)' : (isEnraged ? 'rgba(80, 5, 18, 0.88)' : 'rgba(34, 3, 9, 0.88)');
  const veinCol = isVuln ? 'rgba(70, 10, 20, 0.3)' : (isEnraged ? 'rgba(255, 71, 87, 0.75)' : 'rgba(231, 76, 60, 0.45)');

  const rootX = -8;
  const rootY = -18;
  const elbowX = -52 * span;
  const elbowY = (-62 + flap) * span;

  // 4 Dígitos afiados de asa de morcego gótico
  const tip1X = -95 * span;
  const tip1Y = (-48 + flap * 1.35) * span;
  const tip2X = -88 * span;
  const tip2Y = (-2 + flap * 1.05) * span;
  const tip3X = -68 * span;
  const tip3Y = (34 + flap * 0.7) * span;
  const tip4X = -42 * span;
  const tip4Y = (62 + flap * 0.3) * span;

  // 1. Membrana alar principal (camada base)
  ctx.fillStyle = membraneBase;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(tip1X, tip1Y);
  ctx.quadraticCurveTo(tip1X + 12 * span, tip1Y + 24 * span, tip2X, tip2Y);
  ctx.quadraticCurveTo(tip2X + 10 * span, tip2Y + 20 * span, tip3X, tip3Y);
  ctx.quadraticCurveTo(tip3X + 12 * span, tip3Y + 18 * span, tip4X, tip4Y);
  ctx.quadraticCurveTo(tip4X + 14 * span, tip4Y - 12 * span, rootX, rootY + 40);
  ctx.closePath();
  ctx.fill();

  // 2. Sombra e volume de profundidade na dobra da asa
  ctx.fillStyle = membraneShade;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(tip2X, tip2Y);
  ctx.quadraticCurveTo(tip3X + 10 * span, tip3Y + 16 * span, tip4X, tip4Y);
  ctx.quadraticCurveTo(tip4X + 14 * span, tip4Y - 12 * span, rootX, rootY + 40);
  ctx.closePath();
  ctx.fill();

  // 3. Nervuras de sangue rúnico pulsante nas membranas
  ctx.strokeStyle = veinCol;
  ctx.lineWidth = isEnraged ? 2.0 : 1.2;
  ctx.beginPath();
  ctx.moveTo(elbowX * 0.6, elbowY * 0.6);
  ctx.quadraticCurveTo(elbowX - 10 * span, elbowY + 5, tip1X, tip1Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.quadraticCurveTo(elbowX - 6 * span, elbowY + 25 * span, tip2X, tip2Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.quadraticCurveTo(elbowX + 4 * span, elbowY + 45 * span, tip3X, tip3Y);
  ctx.moveTo(elbowX * 0.5, elbowY * 0.5 + 10);
  ctx.quadraticCurveTo(elbowX + 12 * span, elbowY + 65 * span, tip4X, tip4Y);
  ctx.stroke();

  // 4. Estrutura óssea primária (braço, antebraço e falanges)
  ctx.strokeStyle = boneCol;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(tip1X, tip1Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(tip2X, tip2Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(tip3X, tip3Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(tip4X, tip4Y);
  ctx.stroke();

  // 5. Brilho no topo dos ossos
  ctx.strokeStyle = boneHighlight;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY - 1);
  ctx.lineTo(elbowX, elbowY - 1);
  ctx.lineTo(tip1X + 2 * span, tip1Y - 1);
  ctx.stroke();

  // 6. Esporão e garras de obsidiana pontiagudas
  const clawColor = isEnraged ? '#ff4757' : (isVuln ? '#7f8c8d' : '#dfe4ea');
  ctx.fillStyle = clawColor;
  // Garra do cotovelo
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY - 2);
  ctx.lineTo(elbowX - 10 * span, elbowY - 12);
  ctx.lineTo(elbowX + 2 * span, elbowY + 2);
  ctx.closePath();
  ctx.fill();

  // Garras nas pontas dos 4 dedos
  const digits = [[tip1X, tip1Y], [tip2X, tip2Y], [tip3X, tip3Y], [tip4X, tip4Y]];
  for (let k = 0; k < digits.length; k++) {
    ctx.beginPath();
    ctx.arc(digits[k][0], digits[k][1], 2.8, 0, Math.PI * 2);
    ctx.fill();
    if (isEnraged) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(digits[k][0] - 1, digits[k][1] - 1, 2, 2);
      ctx.fillStyle = clawColor;
    }
  }

  ctx.restore();
}

function drawFluidCape(ctx, bob, frameCount, isVuln, isEnraged) {
  const wave1 = Math.sin(frameCount * 0.12) * 8;
  const wave2 = Math.cos(frameCount * 0.15) * 7;
  const wave3 = Math.sin(frameCount * 0.19) * 5;

  const capeOuter = isVuln ? '#140206' : (isEnraged ? '#450411' : '#180208');
  const capeInner = isVuln ? '#380511' : (isEnraged ? '#c01535' : '#7a0720');
  const goldTrim = isVuln ? '#634c02' : (isEnraged ? '#ff4757' : '#f1c40f');

  // 1. Gola Gótica Alta Majestosa (erguida atrás da nuca estilo Drácula)
  ctx.fillStyle = '#0a0104';
  ctx.beginPath();
  ctx.moveTo(-18, -26 + bob);
  ctx.lineTo(-38, -66 + bob);
  ctx.lineTo(-24, -42 + bob);
  ctx.lineTo(-12, -40 + bob);
  ctx.lineTo(12, -40 + bob);
  ctx.lineTo(24, -42 + bob);
  ctx.lineTo(38, -66 + bob);
  ctx.lineTo(18, -26 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Forro carmesim no interior da gola
  ctx.fillStyle = capeInner;
  ctx.beginPath();
  ctx.moveTo(-16, -28 + bob);
  ctx.lineTo(-32, -60 + bob);
  ctx.lineTo(-10, -42 + bob);
  ctx.lineTo(10, -42 + bob);
  ctx.lineTo(32, -60 + bob);
  ctx.lineTo(16, -28 + bob);
  ctx.closePath();
  ctx.fill();

  // 2. Forro interno do manto carmesim (visível pelo movimento lateral)
  ctx.fillStyle = capeInner;
  ctx.beginPath();
  ctx.moveTo(-26, -18 + bob);
  ctx.bezierCurveTo(-50 + wave1, 24 + bob, -36 + wave2, 64 + bob, -14 + wave3, 72 + bob);
  ctx.lineTo(14 + wave3, 72 + bob);
  ctx.bezierCurveTo(36 + wave2, 64 + bob, 50 + wave1, 24 + bob, 26, -18 + bob);
  ctx.closePath();
  ctx.fill();

  // 3. Manto exterior de seda de obsidiana com cauda recortada em asas de morcego
  ctx.fillStyle = capeOuter;
  ctx.beginPath();
  ctx.moveTo(-28, -18 + bob);
  ctx.bezierCurveTo(-54 + wave1, 26 + bob, -40 + wave2, 66 + bob, -24 + wave1, 74 + bob);
  ctx.quadraticCurveTo(-14 + wave2, 66 + bob, -6 + wave3, 76 + bob);
  ctx.quadraticCurveTo(0, 68 + bob, 6 + wave3, 76 + bob);
  ctx.quadraticCurveTo(14 + wave2, 66 + bob, 24 + wave1, 74 + bob);
  ctx.bezierCurveTo(40 + wave2, 66 + bob, 54 + wave1, 26 + bob, 28, -18 + bob);
  ctx.closePath();
  ctx.fill();

  // 4. Filete bordado a ouro / carmesim ao longo do manto
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-28, -18 + bob);
  ctx.bezierCurveTo(-54 + wave1, 26 + bob, -40 + wave2, 66 + bob, -24 + wave1, 74 + bob);
  ctx.quadraticCurveTo(-14 + wave2, 66 + bob, -6 + wave3, 76 + bob);
  ctx.quadraticCurveTo(0, 68 + bob, 6 + wave3, 76 + bob);
  ctx.quadraticCurveTo(14 + wave2, 66 + bob, 24 + wave1, 74 + bob);
  ctx.bezierCurveTo(40 + wave2, 66 + bob, 54 + wave1, 26 + bob, 28, -18 + bob);
  ctx.stroke();

  // 5. Morcegos espectrais esvoaçando discretamente perto da cauda do manto
  const batTime = frameCount * 0.08;
  ctx.fillStyle = isEnraged ? '#4a0815' : '#080104';
  for (let b = 0; b < 2; b++) {
    const bOffset = b * Math.PI;
    const bFlap = Math.sin(frameCount * 0.4 + b) * 3.5;
    const bx = (b === 0 ? -38 : 38) + Math.cos(batTime + bOffset) * 12;
    const by = 48 + bob + Math.sin(batTime * 1.5 + bOffset) * 14;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 5, by - 4 + bFlap);
    ctx.lineTo(bx - 2, by + 3);
    ctx.lineTo(bx + 2, by + 3);
    ctx.lineTo(bx + 5, by - 4 + bFlap);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGothicArmor(ctx, bob, frameCount, isVuln, isEnraged) {
  const armorSteel = isVuln ? '#100307' : (isEnraged ? '#380512' : '#1c050f');
  const armorShade = isVuln ? '#070103' : (isEnraged ? '#200208' : '#0e0207');
  const goldTrim = isVuln ? '#634c02' : (isEnraged ? '#ff4757' : '#f1c40f');
  const darkGold = isVuln ? '#3d2e01' : (isEnraged ? '#c0392b' : '#b78b02');

  // 1. Placa Peitoral de Obsidiana Lapidada
  ctx.fillStyle = armorSteel;
  ctx.beginPath();
  ctx.moveTo(-24, -26 + bob);
  ctx.lineTo(24, -26 + bob);
  ctx.lineTo(18, 18 + bob);
  ctx.lineTo(0, 28 + bob);
  ctx.lineTo(-18, 18 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Detalhe de chanfro interno na couraça
  ctx.fillStyle = armorShade;
  ctx.beginPath();
  ctx.moveTo(-16, -24 + bob);
  ctx.lineTo(0, -18 + bob);
  ctx.lineTo(16, -24 + bob);
  ctx.lineTo(12, 14 + bob);
  ctx.lineTo(0, 24 + bob);
  ctx.lineTo(-12, 14 + bob);
  ctx.closePath();
  ctx.fill();

  // 2. Ombreiras Góticas em Camadas Escalonadas (Pauldrons)
  for (let s of [-1, 1]) {
    ctx.save();
    ctx.scale(s, 1);

    // Nível superior
    ctx.fillStyle = isEnraged ? '#5a071a' : '#2e0817';
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(18, -30 + bob);
    ctx.lineTo(44, -40 + bob);
    ctx.lineTo(40, -22 + bob);
    ctx.lineTo(22, -18 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nível intermediário
    ctx.beginPath();
    ctx.moveTo(20, -20 + bob);
    ctx.lineTo(42, -22 + bob);
    ctx.lineTo(36, -8 + bob);
    ctx.lineTo(18, -8 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // 3. Arabescos e Filigranas Douradas no Peito
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-14, -18 + bob);
  ctx.lineTo(0, -6 + bob);
  ctx.lineTo(14, -18 + bob);
  ctx.moveTo(-10, -6 + bob);
  ctx.lineTo(0, 8 + bob);
  ctx.lineTo(10, -6 + bob);
  ctx.stroke();

  // 4. Coração de Rubi (Heartbeat Ruby) com Batimento Cardíaco Duplo Realista
  const tHeart = (frameCount * (isEnraged ? 0.24 : 0.13)) % (Math.PI * 2);
  const beat = Math.pow(Math.sin(tHeart), 8) * 2.2 + Math.pow(Math.sin(tHeart + 0.35), 8) * 1.5;
  const gemRadius = 5.0 + (isVuln ? 0 : beat);

  // Brilho difuso ao redor do rubi
  const rubyGlow = ctx.createRadialGradient(0, -8 + bob, 2, 0, -8 + bob, gemRadius * 2.2);
  rubyGlow.addColorStop(0, isEnraged ? 'rgba(255, 0, 55, 0.75)' : 'rgba(231, 76, 60, 0.6)');
  rubyGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rubyGlow;
  ctx.beginPath();
  ctx.arc(0, -8 + bob, gemRadius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Moldura do engaste dourado do rubi
  ctx.fillStyle = darkGold;
  ctx.beginPath();
  ctx.arc(0, -8 + bob, gemRadius + 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Gema lapidada
  ctx.fillStyle = isVuln ? '#4a0815' : (isEnraged ? '#ff0037' : '#ff1744');
  ctx.beginPath();
  ctx.arc(0, -8 + bob, gemRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Reflexo especular no rubi
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1.5, -10 + bob, 1.8, 1.8);

  // 5. Cinto Nobre com Fecho Rúnico
  ctx.fillStyle = '#0b0205';
  ctx.fillRect(-16, 14 + bob, 32, 6);
  ctx.fillStyle = goldTrim;
  ctx.fillRect(-6, 13 + bob, 12, 8);
  ctx.strokeStyle = '#0a0104';
  ctx.lineWidth = 1;
  ctx.strokeRect(-4, 15 + bob, 8, 4);
}

function drawHeadAndFace(ctx, bob, frameCount, isVuln, isEnraged) {
  const headY = (isVuln ? -22 : -32) + bob;

  // 1. Cabelos Prateados Nobres (Camada Traseira)
  const hairSway = Math.sin(frameCount * 0.14) * 4.5;
  ctx.fillStyle = '#dfe4ea';
  ctx.beginPath();
  ctx.moveTo(-10, headY - 15);
  ctx.quadraticCurveTo(-28 + hairSway, headY - 8, -38 + hairSway * 1.3, headY + 16);
  ctx.lineTo(-24, headY + 6);
  ctx.quadraticCurveTo(-16, headY - 2, -6, headY - 12);
  ctx.closePath();
  ctx.fill();

  // Mecha do lado direito
  ctx.beginPath();
  ctx.moveTo(10, headY - 15);
  ctx.quadraticCurveTo(28 - hairSway, headY - 8, 36 - hairSway * 1.3, headY + 16);
  ctx.lineTo(24, headY + 6);
  ctx.quadraticCurveTo(16, headY - 2, 6, headY - 12);
  ctx.closePath();
  ctx.fill();

  // 2. Rosto Pálido Aristocrático
  ctx.fillStyle = isVuln ? '#8395a7' : '#ecf0f1';
  ctx.beginPath();
  ctx.moveTo(0, headY - 17);
  ctx.lineTo(14, headY - 4);
  ctx.lineTo(9, headY + 13);
  ctx.lineTo(0, headY + 18);
  ctx.lineTo(-9, headY + 13);
  ctx.lineTo(-14, headY - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2f3542';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Sombreamento sob o queixo e bochechas
  ctx.fillStyle = 'rgba(47, 53, 66, 0.2)';
  ctx.beginPath();
  ctx.moveTo(-9, headY + 13);
  ctx.lineTo(0, headY + 18);
  ctx.lineTo(9, headY + 13);
  ctx.lineTo(0, headY + 12);
  ctx.closePath();
  ctx.fill();

  // 3. Franja e Topete Prateado
  ctx.fillStyle = '#f5f6fa';
  ctx.beginPath();
  ctx.moveTo(-12, headY - 17);
  ctx.lineTo(4, headY - 7);
  ctx.lineTo(-2, headY - 3);
  ctx.lineTo(-14, headY - 11);
  ctx.closePath();
  ctx.fill();

  // 4. Olhos Demoníacos Incandescentes com Efeito de Flare e Rastro de Luz
  const eyeCol = isVuln ? '#590a18' : (isEnraged ? '#ff0055' : '#ff1744');
  
  // Flare e Rastro de Fumaça Espectral saindo dos olhos
  if (!isVuln) {
    const flareLen = isEnraged ? 18 : 10;
    const flarePulse = Math.sin(frameCount * 0.3) * 2;
    
    ctx.strokeStyle = isEnraged ? 'rgba(255, 0, 85, 0.65)' : 'rgba(255, 23, 68, 0.45)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-6, headY - 1);
    ctx.lineTo(-6 - flareLen - flarePulse, headY - 3 - flarePulse * 0.5);
    ctx.moveTo(6, headY - 1);
    ctx.lineTo(6 + flareLen + flarePulse, headY - 3 - flarePulse * 0.5);
    ctx.stroke();
  }

  // Olho Esquerdo
  ctx.fillStyle = eyeCol;
  ctx.beginPath();
  ctx.ellipse(-6, headY - 1, 3.6, 2.0, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Olho Direito
  ctx.beginPath();
  ctx.ellipse(6, headY - 1, 3.6, 2.0, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Pupilas em fenda felina e ponto especular branco
  if (!isVuln) {
    ctx.fillStyle = '#0a0104';
    ctx.fillRect(-6.5, headY - 2.8, 1.4, 3.6);
    ctx.fillRect(5.1, headY - 2.8, 1.4, 3.6);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5.5, headY - 2.2, 1.2, 1.2);
    ctx.fillRect(6.1, headY - 2.2, 1.2, 1.2);
  }

  // 5. Presas Vampíricas (visíveis em modo Enraged)
  if (isEnraged && !isVuln) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-3, headY + 9);
    ctx.lineTo(-2, headY + 13);
    ctx.lineTo(-1, headY + 9);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(1, headY + 9);
    ctx.lineTo(2, headY + 13);
    ctx.lineTo(3, headY + 9);
    ctx.closePath();
    ctx.fill();
  }
}

function drawClawsAndArms(ctx, bob, frameCount, isVuln, isEnraged, isWindup, isChanneling) {
  const armCol = isVuln ? '#140308' : (isEnraged ? '#380512' : '#220815');
  const clawCol = isVuln ? '#7f1d1d' : (isEnraged ? '#f1c40f' : '#ff4757');

  const reach = (isWindup || isChanneling) ? 14 : 0;
  const armDrop = isVuln ? 14 : 0;

  // Braço esquerdo secundário em perspectiva
  ctx.strokeStyle = isEnraged ? '#28030b' : '#14030a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-18, -16 + bob);
  ctx.lineTo(-30 - reach * 0.7, -2 + bob + armDrop);
  ctx.lineTo(-38 - reach * 0.7, 8 + bob + armDrop);
  ctx.stroke();

  // Braço direito principal
  ctx.strokeStyle = armCol;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(18, -16 + bob);
  ctx.lineTo(34 + reach, -2 + bob + armDrop);
  ctx.lineTo(44 + reach, 8 + bob + armDrop);
  ctx.stroke();

  // Garras afiadas de obsidiana
  ctx.strokeStyle = clawCol;
  ctx.lineWidth = 2.4;
  const cX = 44 + reach;
  const cY = 8 + bob + armDrop;

  ctx.beginPath();
  ctx.moveTo(cX, cY - 4);
  ctx.lineTo(cX + 13, cY - 7);
  ctx.moveTo(cX + 1, cY);
  ctx.lineTo(cX + 16, cY);
  ctx.moveTo(cX, cY + 4);
  ctx.lineTo(cX + 13, cY + 7);
  ctx.stroke();

  // Brilho de corte nas pontas das garras
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cX + 12, cY - 7.5, 2, 2);
  ctx.fillRect(cX + 15, cY - 0.5, 2, 2);
  ctx.fillRect(cX + 12, cY + 6.5, 2, 2);

  // Efeito de garras flamejantes de sangue carregando o ataque em leque
  if (isWindup) {
    const clawGlow = (Math.sin(frameCount * 0.3) + 1) * 2;
    ctx.fillStyle = isEnraged ? 'rgba(255, 71, 87, 0.7)' : 'rgba(231, 76, 60, 0.65)';
    ctx.beginPath();
    ctx.arc(cX + 16, cY, 5 + clawGlow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cX + 16, cY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Renderizador Vetorial Master do Lorde Vampírico.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} e 
 * @param {number} frameCount 
 */
export function drawVampireLord(ctx, e, frameCount) {
  if (e.actionState === 'TELEPORTING') {
    drawTeleportDeparture(ctx, e, frameCount);
    return;
  }

  if (e.mistState === 'DASHING') {
    drawMistVortex(ctx, e, frameCount);
    return;
  }

  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged;
  const isWindup = e.actionState === 'WINDUP';
  const isChanneling = e.actionState === 'CHANNELING_SPIRAL';
  const bob = isVuln ? 12 : (e.floatBob || 0);

  if (isVuln) {
    drawVulnerabilityGliph(ctx, e, frameCount);
  } else {
    // 1. Miasma e Névoa Carmesim Flutuante no Solo
    const mistPulse = Math.sin(frameCount * 0.08) * 6;
    const mistGrad = ctx.createRadialGradient(0, 42, 8, 0, 42, e.radius * 1.05 + mistPulse);
    mistGrad.addColorStop(0, isEnraged ? 'rgba(192, 57, 43, 0.45)' : 'rgba(142, 68, 173, 0.35)');
    mistGrad.addColorStop(0.65, isEnraged ? 'rgba(104, 8, 29, 0.22)' : 'rgba(74, 5, 18, 0.16)');
    mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.ellipse(0, 42, e.radius * 1.05 + mistPulse, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sombra de contato no solo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 42, e.radius * 0.75 - bob * 0.4, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Faíscas sombrias em ascensão no modo Enrage
    if (isEnraged && Math.floor(frameCount) % 3 === 0) {
      const sparkX = (Math.random() - 0.5) * 55;
      const sparkY = 32 - Math.random() * 45 + bob;
      ctx.fillStyle = Math.random() < 0.5 ? '#ff4757' : '#ffa502';
      ctx.fillRect(sparkX, sparkY, 2, 2);
    }
  }

  const wingFlap = isVuln ? 0 : Math.sin(frameCount * (isEnraged ? 0.28 : 0.16)) * 14;
  const wingSpan = isVuln ? 0.55 : (isEnraged ? 1.25 : (isChanneling ? 1.38 : (e.currentSkill === 'REPULSION' ? 1.45 : (e.isWingPrepping ? 1.3 : 1.0))));

  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2.5);
  }

  drawSingleWing(ctx, -1, wingFlap, wingSpan, isVuln, isEnraged, frameCount);
  drawSingleWing(ctx, 1, wingFlap, wingSpan, isVuln, isEnraged, frameCount);

  // Orbes de carregamento nas asas para o disparo convergente
  if ((e.isWingPrepping && e.currentSkill === 'PINCER_SHOT') || (isWindup && e.currentSkill === 'PINCER_SHOT')) {
    const orbPulse = (Math.sin(frameCount * 0.3) + 1) * 2.2;
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(-58, -45 + bob, 5 + orbPulse, 0, Math.PI * 2);
    ctx.arc(58, -45 + bob, 5 + orbPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Aura de vendaval repulsor nas asas durante a preparação do Vendaval de Asas
  if (isWindup && e.currentSkill === 'REPULSION') {
    const repPulse = (Math.sin(frameCount * 0.4) + 1) * 3;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -10 + bob, 48 + repPulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Sigilo rúnico rotativo no peito durante a canalização da espiral
  if (isChanneling) {
    const rot = frameCount * 0.12;
    ctx.save();
    ctx.translate(0, -8 + bob);
    ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2;
      ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.lineTo(Math.cos(a + Math.PI) * 18, Math.sin(a + Math.PI) * 18);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Efeito de pulso concêntrico de aviso durante a frenagem da investida
  if (e.actionState === 'MIST_BRAKE') {
    const brakePulse = (e.actionTimer / 20) * 26;
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, bob, e.radius + brakePulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawFluidCape(ctx, bob, frameCount, isVuln, isEnraged);
  drawGothicArmor(ctx, bob, frameCount, isVuln, isEnraged);
  drawHeadAndFace(ctx, bob, frameCount, isVuln, isEnraged);
  drawClawsAndArms(ctx, bob, frameCount, isVuln, isEnraged, isWindup, isChanneling);
}
