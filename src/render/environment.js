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

export const ambientEmbers = [];
for (let i = 0; i < 40; i++) {
  ambientEmbers.push({
    x: Math.random() * 2000 - 1000,
    y: Math.random() * 2000 - 1000,
    r: Math.random() * 1.6 + 0.5,
    speed: Math.random() * 0.45 + 0.25,
    alpha: Math.random() * 0.4 + 0.2
  });
}

export function renderEnvironment(ctx) {
  const tileSize = 110;
  const startCol = Math.floor(camera.x / tileSize);
  const endCol = Math.floor((camera.x + viewW) / tileSize) + 1;
  const startRow = Math.floor(camera.y / tileSize);
  const endRow = Math.floor((camera.y + viewH) / tileSize) + 1;

  for (let c = startCol; c <= endCol; c++) {
    for (let r = startRow; r <= endRow; r++) {
      const tileX = c * tileSize;
      const tileY = r * tileSize;
      const h = tileHash(c, r);

      if (currentArenaTheme === 'CEMETERY' || currentArenaTheme === 'INDUSTRIAL') {
        // Grama noturna escura com variação de musgo e terra úmida
        ctx.fillStyle = h > 0.65 ? '#102216' : (h > 0.35 ? '#0c1a11' : '#08130c');
      } else if (currentArenaTheme === 'VAMPIRE') {
        ctx.fillStyle = h > 0.6 ? '#2c0c16' : (h > 0.3 ? '#1f070e' : '#130307');
      } else if (currentArenaTheme === 'MONOLITH') {
        ctx.fillStyle = h > 0.6 ? '#2b1407' : (h > 0.3 ? '#1c0d05' : '#110702');
      } else if (currentArenaTheme === 'REAPER') {
        ctx.fillStyle = h > 0.6 ? '#0b1d28' : (h > 0.3 ? '#06131c' : '#030b10');
      } else if (currentArenaTheme === 'ABYSS') {
        ctx.fillStyle = h > 0.6 ? '#1b082e' : (h > 0.3 ? '#120421' : '#090212');
      }
      ctx.fillRect(tileX, tileY, tileSize, tileSize);

      if (currentArenaTheme === 'CEMETERY' || currentArenaTheme === 'INDUSTRIAL') {
        // Fendas sutis de terra úmida entre os ladrilhos
        ctx.strokeStyle = '#050b07';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tileX + 0.5, tileY + 0.5, tileSize - 1, tileSize - 1);

        const h2 = tileHash(c + 113, r + 227);
        const h3 = tileHash(c - 79, r + 911);

        if (h < 0.08) {
          // 1. Lápide de Pedra Vertical Gótica
          const gx = tileX + 32 + (h2 * 28);
          const gy = tileY + 28 + (h3 * 22);
          const tw = 22, th = 30;

          // Sombra projetada no solo
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.ellipse(gx + tw / 2, gy + th + 1, 15, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Corpo de pedra arqueado
          ctx.fillStyle = '#222b26';
          ctx.beginPath();
          ctx.moveTo(gx, gy + th);
          ctx.lineTo(gx, gy + 11);
          ctx.arc(gx + tw / 2, gy + 11, tw / 2, Math.PI, 0);
          ctx.lineTo(gx + tw, gy + th);
          ctx.closePath();
          ctx.fill();

          // Borda de pedra
          ctx.strokeStyle = '#35433a';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Cruz entalhada na pedra
          ctx.strokeStyle = '#121815';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(gx + tw / 2, gy + 8);
          ctx.lineTo(gx + tw / 2, gy + 22);
          ctx.moveTo(gx + 5, gy + 13);
          ctx.lineTo(gx + tw - 5, gy + 13);
          ctx.stroke();

          // Musgo na base da lápide
          ctx.fillStyle = '#16331e';
          ctx.fillRect(gx - 2, gy + th - 3, tw + 4, 3);

        } else if (h >= 0.08 && h < 0.15) {
          // 2. Cruz de Pedra Gótica Antiga
          const cx = tileX + 42 + (h2 * 22);
          const cy = tileY + 30 + (h3 * 20);

          // Sombra da cruz
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 26, 12, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Haste vertical e travessão horizontal
          ctx.fillStyle = '#26322b';
          ctx.fillRect(cx - 3, cy, 6, 26);
          ctx.fillRect(cx - 10, cy + 6, 20, 5);

          // Contorno de pedra
          ctx.strokeStyle = '#38463e';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - 3, cy, 6, 26);
          ctx.strokeRect(cx - 10, cy + 6, 20, 5);

        } else if (h >= 0.15 && h < 0.22) {
          // 3. Laje Mortuária Antiga Cravada na Terra
          const sx = tileX + 22 + (h2 * 20);
          const sy = tileY + 28 + (h3 * 20);
          const lw = 46, lh = 28;

          // Rebaixo de terra escura
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.fillRect(sx + 3, sy + 3, lw, lh);

          // Laje de pedra
          ctx.fillStyle = '#1b231e';
          ctx.fillRect(sx, sy, lw, lh);
          ctx.strokeStyle = '#29352e';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx, sy, lw, lh);

          // Fissura na laje
          ctx.strokeStyle = '#0a100c';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sx + 8, sy + 5);
          ctx.lineTo(sx + 20, sy + 15);
          ctx.lineTo(sx + 36, sy + 23);
          ctx.stroke();

        } else if (h >= 0.22 && h < 0.42) {
          // 4. Tufos de Grama Alta & Ervas Selvagens
          const tx = tileX + 20 + (h2 * 60);
          const ty = tileY + 25 + (h3 * 55);

          ctx.strokeStyle = '#1b3b24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx - 4, ty - 10, tx - 7, ty - 14);
          ctx.moveTo(tx + 4, ty);
          ctx.quadraticCurveTo(tx + 2, ty - 14, tx + 1, ty - 18);
          ctx.moveTo(tx + 8, ty);
          ctx.quadraticCurveTo(tx + 12, ty - 10, tx + 15, ty - 13);
          ctx.stroke();

          // Ponta iluminada pelo luar
          ctx.strokeStyle = '#285535';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(tx + 4, ty - 8);
          ctx.lineTo(tx + 1, ty - 18);
          ctx.stroke();

        } else if (h >= 0.42 && h < 0.49) {
          // 5. Flores Funerárias Secas e Mancha de Musgo
          const fx = tileX + 30 + (h2 * 45);
          const fy = tileY + 30 + (h3 * 45);

          ctx.fillStyle = '#162e1c';
          ctx.beginPath();
          ctx.arc(fx, fy, 9, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#5c1b2c';
          ctx.beginPath();
          ctx.arc(fx - 3, fy - 2, 2.5, 0, Math.PI * 2);
          ctx.arc(fx + 3, fy - 1, 2, 0, Math.PI * 2);
          ctx.arc(fx, fy + 3, 2, 0, Math.PI * 2);
          ctx.fill();

        } else if (h >= 0.49 && h < 0.58) {
          // 6. Seixos e Pedras de Pavimento Quebrado
          const px = tileX + 25 + (h2 * 50);
          const py = tileY + 25 + (h3 * 50);

          ctx.fillStyle = '#1b2620';
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.arc(px + 9, py + 6, 2.5, 0, Math.PI * 2);
          ctx.arc(px - 7, py + 4, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#2c3b32';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

      } else if (currentArenaTheme === 'VAMPIRE') {
        ctx.strokeStyle = '#5c1022';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(tileX + 1, tileY + 1, tileSize - 2, tileSize - 2);
        if (h < 0.35) {
          ctx.fillStyle = 'rgba(142, 68, 173, 0.2)';
          ctx.beginPath();
          ctx.arc(tileX + 55, tileY + 55, 18, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (currentArenaTheme === 'MONOLITH') {
        ctx.strokeStyle = h < 0.3 ? '#e67e22' : '#3d1c0b';
        ctx.lineWidth = 3;
        ctx.strokeRect(tileX + 1, tileY + 1, tileSize - 2, tileSize - 2);
      } else if (currentArenaTheme === 'REAPER') {
        ctx.strokeStyle = '#00cec9';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tileX + 1, tileY + 1, tileSize - 2, tileSize - 2);
      } else if (currentArenaTheme === 'ABYSS') {
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 2;
        ctx.strokeRect(tileX + 1, tileY + 1, tileSize - 2, tileSize - 2);
      }
    }
  }

  // Névoa Baixa Rasteira no Cemitério (sutil e translúcida, preserva contraste de gameplay)
  if (currentArenaTheme === 'CEMETERY' || currentArenaTheme === 'INDUSTRIAL') {
    const mistShift1 = (frameCount * 0.4) % viewW;
    const mistShift2 = (frameCount * 0.25) % viewW;

    ctx.fillStyle = 'rgba(25, 55, 40, 0.04)';
    ctx.fillRect(camera.x, camera.y, viewW, viewH);

    ctx.fillStyle = 'rgba(40, 85, 60, 0.035)';
    ctx.beginPath();
    ctx.ellipse(camera.x + mistShift1, camera.y + viewH * 0.35, 260, 70, 0.08, 0, Math.PI * 2);
    ctx.ellipse(camera.x + ((mistShift1 + viewW * 0.5) % viewW), camera.y + viewH * 0.75, 320, 80, -0.06, 0, Math.PI * 2);
    ctx.ellipse(camera.x + mistShift2, camera.y + viewH * 0.55, 220, 60, 0.04, 0, Math.PI * 2);
    ctx.fill();
  }

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

  for (let s of ambientEmbers) {
    const floatY = s.y - (frameCount * 0.35 * s.speed);
    const sway = Math.sin(frameCount * 0.03 + s.y) * 6;
    let sx = (((s.x + sway) - camera.x * s.speed) % viewW + viewW) % viewW;
    let sy = ((floatY - camera.y * s.speed) % viewH + viewH) % viewH;

    if (currentArenaTheme === 'MONOLITH') {
      ctx.fillStyle = `rgba(230, 126, 34, ${s.alpha * 1.5})`;
      ctx.beginPath();
      ctx.arc(camera.x + sx, camera.y + sy, s.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentArenaTheme === 'VAMPIRE') {
      ctx.fillStyle = `rgba(192, 57, 43, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(camera.x + sx, camera.y + sy, s.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentArenaTheme === 'REAPER') {
      ctx.fillStyle = `rgba(0, 206, 201, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(camera.x + sx, camera.y + sy, s.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentArenaTheme === 'ABYSS') {
      ctx.fillStyle = `rgba(155, 89, 182, ${s.alpha * 1.4})`;
      ctx.beginPath();
      ctx.arc(camera.x + sx, camera.y + sy, s.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // CEMETERY: Fogo-fátuo / Alma Errante espectral (verde esmeralda e ciano)
      const pulse = Math.sin(frameCount * 0.06 + s.x) * 0.3 + 0.7;
      // Aura espectral externa
      ctx.fillStyle = `rgba(46, 204, 113, ${s.alpha * 0.28 * pulse})`;
      ctx.beginPath();
      ctx.arc(camera.x + sx, camera.y + sy, s.r * 2.3, 0, Math.PI * 2);
      ctx.fill();
      // Núcleo brilhante ciano-esmeralda
      ctx.fillStyle = `rgba(120, 250, 195, ${s.alpha * 1.2 * pulse})`;
      ctx.beginPath();
      ctx.arc(camera.x + sx, camera.y + sy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}