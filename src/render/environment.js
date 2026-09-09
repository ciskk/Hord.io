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

      if (currentArenaTheme === 'INDUSTRIAL') {
        ctx.fillStyle = h > 0.6 ? '#1b1e27' : (h > 0.3 ? '#161820' : '#12141a');
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

      if (currentArenaTheme === 'INDUSTRIAL') {
        ctx.strokeStyle = '#0a0c10';
        ctx.lineWidth = 2;
        ctx.strokeRect(tileX + 1, tileY + 1, tileSize - 2, tileSize - 2);

        if (h < 0.22) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.beginPath();
          ctx.moveTo(tileX + 24, tileY + 20);
          ctx.lineTo(tileX + 42, tileY + 44);
          ctx.lineTo(tileX + 74, tileY + 88);
          ctx.stroke();
        } else if (h >= 0.22 && h < 0.34) {
          ctx.fillStyle = 'rgba(241, 196, 15, 0.22)';
          ctx.fillRect(tileX + 6, tileY + 6, tileSize - 12, 10);
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
    let sx = ((s.x - camera.x * s.speed) % viewW + viewW) % viewW;
    let sy = ((s.y - camera.y * s.speed) % viewH + viewH) % viewH;
    ctx.fillStyle = currentArenaTheme === 'MONOLITH' ? `rgba(230, 126, 34, ${s.alpha * 1.5})` :
                    currentArenaTheme === 'VAMPIRE'  ? `rgba(192, 57, 43, ${s.alpha})` :
                    currentArenaTheme === 'REAPER'   ? `rgba(0, 206, 201, ${s.alpha})` :
                    currentArenaTheme === 'ABYSS'    ? `rgba(155, 89, 182, ${s.alpha * 1.4})` : `rgba(243, 156, 18, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(camera.x + sx, camera.y + sy, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}