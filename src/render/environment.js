import { 
  camera, 
  viewW, 
  viewH, 
  currentArenaTheme, 
  bloodSplats, 
  acidPuddles, 
  frameCount 
} from '../main.js';

export function tileHash(gx, gy) {
  let n = Math.sin(gx * 374761393 + gy * 668265263) * 43758.5453;
  return n - Math.floor(n);
}

// Ruído suave de baixa frequência para gerar caminhos e manchas de terreno
function smoothNoise(x, y) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = tileHash(i, j);
  const n10 = tileHash(i + 1, j);
  const n01 = tileHash(i, j + 1);
  const n11 = tileHash(i + 1, j + 1);

  const nx0 = n00 + sx * (n10 - n00);
  const nx1 = n01 + sx * (n11 - n01);
  return nx0 + sy * (nx1 - nx0);
}

export const ambientEmbers = [];
for (let i = 0; i < 45; i++) {
  ambientEmbers.push({
    x: Math.random() * 2000 - 1000,
    y: Math.random() * 2000 - 1000,
    r: Math.random() * 1.8 + 0.6,
    speed: Math.random() * 0.45 + 0.2,
    alpha: Math.random() * 0.45 + 0.25
  });
}

export function renderEnvironment(ctx) {
  const tileSize = 96;
  const startCol = Math.floor(camera.x / tileSize) - 1;
  const endCol = Math.floor((camera.x + viewW) / tileSize) + 1;
  const startRow = Math.floor(camera.y / tileSize) - 1;
  const endRow = Math.floor((camera.y + viewH) / tileSize) + 1;

  // 1. Renderização do Solo com Macro-Zonas (Sem bordas quadradas)
  for (let c = startCol; c <= endCol; c++) {
    for (let r = startRow; r <= endRow; r++) {
      const tileX = c * tileSize;
      const tileY = r * tileSize;
      const h = tileHash(c, r);
      const macroZone = smoothNoise(c * 0.18, r * 0.18);

      if (currentArenaTheme === 'CEMETERY' || currentArenaTheme === 'INDUSTRIAL') {
        // Variação orgânica entre terra revirada, grama noturna e caminhos de pedra gótica
        if (macroZone > 0.62) {
          // Trilha de lajotas antigas desgastadas
          ctx.fillStyle = (c + r) % 2 === 0 ? '#121714' : '#161c18';
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
          
          // Detalhe de pedras de calçamento
          ctx.fillStyle = '#0c100e';
          ctx.fillRect(tileX + 10, tileY + 12, 32, 22);
          ctx.fillRect(tileX + 50, tileY + 24, 38, 26);
          ctx.fillRect(tileX + 18, tileY + 54, 44, 28);
        } else if (macroZone < 0.36) {
          // Manchas de terra úmida / cova aberta
          ctx.fillStyle = h > 0.5 ? '#0e1510' : '#080d09';
          ctx.fillRect(tileX, tileY, tileSize, tileSize);

          // Poça de água lamacenta refletindo o céu escuro
          if (h < 0.25) {
            ctx.fillStyle = 'rgba(5, 12, 10, 0.75)';
            ctx.beginPath();
            ctx.ellipse(tileX + 48, tileY + 48, 28, 14, h * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#030806';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        } else {
          // Grama de cemitério densa e escura
          ctx.fillStyle = h > 0.6 ? '#0b160f' : (h > 0.3 ? '#08120c' : '#060d09');
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
        }

        // Raízes e fissuras no solo
        if (h > 0.88) {
          ctx.strokeStyle = '#040805';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(tileX + 10, tileY + 15);
          ctx.lineTo(tileX + 45, tileY + 48);
          ctx.lineTo(tileX + 80, tileY + 52);
          ctx.stroke();
        }

      } else {
        // Fallback estilizado para os outros biomas
        const colMap = {
          VAMPIRE: ['#22060d', '#150307'],
          MONOLITH: ['#200e04', '#120601'],
          REAPER: ['#06131c', '#02090e'],
          ABYSS: ['#120420', '#07010d']
        };
        const colors = colMap[currentArenaTheme] || ['#0d1410', '#070a08'];
        ctx.fillStyle = h > 0.5 ? colors[0] : colors[1];
        ctx.fillRect(tileX, tileY, tileSize, tileSize);
      }
    }
  }

  // 2. Props e Cenografia de Primeiro Plano (Lápides, Mausoléus e Detalhes)
  if (currentArenaTheme === 'CEMETERY' || currentArenaTheme === 'INDUSTRIAL') {
    for (let c = startCol; c <= endCol; c++) {
      for (let r = startRow; r <= endRow; r++) {
        const tileX = c * tileSize;
        const tileY = r * tileSize;
        const h = tileHash(c, r);
        const h2 = tileHash(c + 71, r + 137);
        const h3 = tileHash(c - 93, r + 419);

        // Macro-Monumento: Mausoléu Antigo (a cada ~80 ladrilhos)
        if (c % 9 === 0 && r % 9 === 0) {
          const mx = tileX + 16;
          const my = tileY + 12;

          // Sombra projetada densa
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.ellipse(mx + 36, my + 64, 44, 16, 0, 0, Math.PI * 2);
          ctx.fill();

          // Estrutura do Mausoléu
          ctx.fillStyle = '#1c2420';
          ctx.fillRect(mx, my, 72, 60);
          ctx.strokeStyle = '#2d3b34';
          ctx.lineWidth = 1.8;
          ctx.strokeRect(mx, my, 72, 60);

          // Frontão triangular superior
          ctx.fillStyle = '#24302a';
          ctx.beginPath();
          ctx.moveTo(mx - 4, my);
          ctx.lineTo(mx + 36, my - 24);
          ctx.lineTo(mx + 76, my);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Grade de ferro / portão lacrado
          ctx.fillStyle = '#0a0d0b';
          ctx.fillRect(mx + 20, my + 18, 32, 42);
          ctx.strokeStyle = '#3e4a43';
          ctx.lineWidth = 1.2;
          for (let b = mx + 24; b < mx + 52; b += 6) {
            ctx.beginPath();
            ctx.moveTo(b, my + 18);
            ctx.lineTo(b, my + 60);
            ctx.stroke();
          }
          continue;
        }

        // Lápides e Cruzes Góticas com Velas Acesas
        if (h < 0.08) {
          const gx = tileX + 24 + (h2 * 36);
          const gy = tileY + 20 + (h3 * 28);
          const tw = 24, th = 34;

          // Sombra
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.beginPath();
          ctx.ellipse(gx + tw / 2, gy + th + 2, 16, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Lápide arqueada chanfrada
          ctx.fillStyle = '#202924';
          ctx.beginPath();
          ctx.moveTo(gx, gy + th);
          ctx.lineTo(gx, gy + 12);
          ctx.arc(gx + tw / 2, gy + 12, tw / 2, Math.PI, 0);
          ctx.lineTo(gx + tw, gy + th);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#3a4940';
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Cruz gravada
          ctx.strokeStyle = '#0f1411';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(gx + tw / 2, gy + 10);
          ctx.lineTo(gx + tw / 2, gy + 26);
          ctx.moveTo(gx + 6, gy + 16);
          ctx.lineTo(gx + tw - 6, gy + 16);
          ctx.stroke();

          // Vela mortuária acessa na base
          const candleX = gx + tw + 3;
          const candleY = gy + th - 2;
          const flicker = Math.sin(frameCount * 0.2 + gx) * 1.5;

          ctx.fillStyle = '#ded3aa';
          ctx.fillRect(candleX - 1.5, candleY - 8, 3, 8);

          // Chama e iluminação ambiente local
          ctx.fillStyle = 'rgba(243, 156, 18, 0.22)';
          ctx.beginPath();
          ctx.arc(candleX, candleY - 10, 10 + flicker, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f39c12';
          ctx.beginPath();
          ctx.arc(candleX, candleY - 9, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(candleX, candleY - 10, 1.2, 0, Math.PI * 2);
          ctx.fill();

        } else if (h >= 0.08 && h < 0.16) {
          // Cruz de Pedra Antiga Quebrada
          const cx = tileX + 36 + (h2 * 26);
          const cy = tileY + 24 + (h3 * 26);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 28, 14, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#28332c';
          ctx.fillRect(cx - 3, cy, 6, 28);
          ctx.fillRect(cx - 11, cy + 8, 22, 6);
          ctx.strokeStyle = '#43544a';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(cx - 3, cy, 6, 28);
          ctx.strokeRect(cx - 11, cy + 8, 22, 6);

          // Musgo acumulado
          ctx.fillStyle = '#163820';
          ctx.fillRect(cx - 4, cy + 22, 8, 6);

        } else if (h >= 0.16 && h < 0.38) {
          // Tufos de capim alto balançando
          const tx = tileX + 20 + (h2 * 55);
          const ty = tileY + 20 + (h3 * 55);
          const wind = Math.sin(frameCount * 0.04 + tx * 0.05) * 4;

          ctx.strokeStyle = '#1b3823';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx - 3 + wind, ty - 10, tx - 6 + wind * 1.5, ty - 16);
          ctx.moveTo(tx + 4, ty);
          ctx.quadraticCurveTo(tx + 3 + wind, ty - 12, tx + 4 + wind * 1.5, ty - 20);
          ctx.moveTo(tx + 8, ty);
          ctx.quadraticCurveTo(tx + 11 + wind, ty - 10, tx + 14 + wind * 1.5, ty - 15);
          ctx.stroke();
        }
      }
    }
  }

  // 3. Poças de Sangue e Ácido
  bloodSplats.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  acidPuddles.forEach(p => {
    const pulse = Math.sin(frameCount * 0.15) * 3;
    ctx.fillStyle = p.isFire ? 'rgba(230, 126, 34, 0.35)' : 'rgba(46, 204, 113, 0.28)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.isFire ? '#e67e22' : 'rgba(46, 204, 113, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // 4. Fogos-Fátuos Flutuantes (Partículas de Ambiente)
  for (let s of ambientEmbers) {
    const floatY = s.y - (frameCount * 0.3 * s.speed);
    const sway = Math.sin(frameCount * 0.03 + s.y) * 8;
    let sx = (((s.x + sway) - camera.x * s.speed) % viewW + viewW) % viewW;
    let sy = ((floatY - camera.y * s.speed) % viewH + viewH) % viewH;

    const pulse = Math.sin(frameCount * 0.05 + s.x) * 0.35 + 0.65;
    ctx.fillStyle = `rgba(46, 204, 113, ${s.alpha * 0.25 * pulse})`;
    ctx.beginPath();
    ctx.arc(camera.x + sx, camera.y + sy, s.r * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(168, 255, 219, ${s.alpha * pulse})`;
    ctx.beginPath();
    ctx.arc(camera.x + sx, camera.y + sy, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Névoa Volumétrica com Efeito de Paralaxe no Mundo
  if (currentArenaTheme === 'CEMETERY' || currentArenaTheme === 'INDUSTRIAL') {
    const mist1 = (frameCount * 0.35 + camera.x * 0.2) % 1200;
    const mist2 = (frameCount * 0.20 + camera.y * 0.15) % 1200;

    ctx.fillStyle = 'rgba(20, 50, 35, 0.04)';
    ctx.fillRect(camera.x, camera.y, viewW, viewH);

    ctx.fillStyle = 'rgba(35, 75, 55, 0.035)';
    ctx.beginPath();
    ctx.ellipse(camera.x + (viewW * 0.5) - mist1 + 600, camera.y + viewH * 0.4, 380, 90, 0.05, 0, Math.PI * 2);
    ctx.ellipse(camera.x + mist2, camera.y + viewH * 0.75, 440, 110, -0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Vinheta Periférica Sombria (Foco Dramático no Centro da Ação)
  const vignette = ctx.createRadialGradient(
    camera.x + viewW / 2, 
    camera.y + viewH / 2, 
    Math.min(viewW, viewH) * 0.35,
    camera.x + viewW / 2, 
    camera.y + viewH / 2, 
    Math.max(viewW, viewH) * 0.75
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(3, 7, 5, 0.65)');
  ctx.fillStyle = vignette;
  ctx.fillRect(camera.x, camera.y, viewW, viewH);
}
