/**
 * src/render/characterPreview.js
 * 
 * Motor de renderização em alta definição para o Palco de Evocação da Skin
 * ("Altar dos Condenados"). Exibe o campeão selecionado em escala ampliada (3.0x),
 * com pedestal de pedra, círculos rúnicos rotativos, partículas atmosféricas
 * elementais e alternância interativa de posturas e rotação.
 */

import { renderHeroModel } from './playerRenderer.js';
import { CHARACTERS } from '../config/characters.js';
import { playSfx, triggerHaptic } from '../core/audio.js';

let previewCanvas = null;
let previewCtx = null;
let animFrameId = null;
let isRunning = false;
let previewResizeObserver = null;
let windowListenersAttached = false;

// Estado da Prévia do Herói
let currentHeroKey = 'KNIGHT';
let currentFacing = 1;
let currentPose = 'idle'; // 'idle' | 'combat' | 'skill'
let previewTime = 0;
let shockwaves = [];
let particles = [];
let surgeTimer = 0;

// Paleta Cromática Temática
const THEME_COLORS = {
  KNIGHT: { primary: '#f1c40f', secondary: '#f39c12', glow: 'rgba(241, 196, 15, 0.35)' },
  MAGE: { primary: '#ff7675', secondary: '#d35400', glow: 'rgba(231, 76, 60, 0.40)' },
  ROGUE: { primary: '#00cec9', secondary: '#16a085', glow: 'rgba(0, 206, 201, 0.38)' },
  BARBARIAN: { primary: '#e74c3c', secondary: '#c0392b', glow: 'rgba(231, 76, 60, 0.45)' },
  ALCHEMIST: { primary: '#2ecc71', secondary: '#00cec9', glow: 'rgba(46, 204, 113, 0.38)' }
};

/**
 * Inicializa ou redimensiona o canvas da prévia respeitando a densidade de pixels (DPR).
 */
export function initPreviewCanvas(canvasElement) {
  if (!canvasElement) return false;
  previewCanvas = canvasElement;
  previewCtx = previewCanvas.getContext('2d', { alpha: true });

  // Observer inteligente para detectar qualquer alteração de tamanho CSS ou orientação
  if (typeof ResizeObserver !== 'undefined') {
    if (previewResizeObserver) {
      previewResizeObserver.disconnect();
    }
    previewResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect && (entry.contentRect.width > 0 || entry.contentRect.height > 0)) {
          resizePreviewCanvas();
        }
      }
    });
    previewResizeObserver.observe(previewCanvas);
  }

  // Ouvintes de redimensionamento de janela e rotação em mobile
  if (!windowListenersAttached && typeof window !== 'undefined') {
    windowListenersAttached = true;
    window.addEventListener('resize', () => {
      if (isRunning) resizePreviewCanvas();
    }, { passive: true });

    window.addEventListener('orientationchange', () => {
      if (isRunning) {
        setTimeout(resizePreviewCanvas, 40);
        setTimeout(resizePreviewCanvas, 160);
      }
    }, { passive: true });
  }

  resizePreviewCanvas();
  initParticles();
  return true;
}

export function resizePreviewCanvas() {
  if (!previewCanvas || !previewCtx) return;
  const rect = previewCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = previewCanvas.clientWidth || rect.width || 0;
  const h = previewCanvas.clientHeight || rect.height || 0;

  if (w > 0 && h > 0) {
    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);
    if (previewCanvas.width !== targetW || previewCanvas.height !== targetH) {
      previewCanvas.width = targetW;
      previewCanvas.height = targetH;
    }
  }

  previewCtx.setTransform(1, 0, 0, 1, 0, 0);
  previewCtx.scale(dpr, dpr);
}

/**
 * Inicializa pool de partículas elementais que flutuam ao redor do altar.
 */
function initParticles() {
  particles = [];
  const count = 28;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 180,
      y: 40 + Math.random() * 80,
      vy: 0.3 + Math.random() * 0.7,
      vx: (Math.random() - 0.5) * 0.4,
      size: 1.2 + Math.random() * 2.4,
      alpha: Math.random(),
      life: Math.random() * 100,
      seed: Math.random() * 10
    });
  }
}

/**
 * Define o herói atualmente exibido no palco de evocação.
 */
export function setPreviewHero(heroKey) {
  if (!CHARACTERS[heroKey]) return;
  if (currentHeroKey !== heroKey) {
    currentHeroKey = heroKey;
    triggerHeroSurge(false);
  }
}

/**
 * Alterna a orientação (espelhamento horizontal) do personagem.
 */
export function togglePreviewFacing() {
  currentFacing = currentFacing === 1 ? -1 : 1;
  triggerHaptic('light');
  return currentFacing;
}

export function setPreviewFacing(dir) {
  currentFacing = dir >= 0 ? 1 : -1;
}

/**
 * Altera a postura do herói na prévia: 'idle', 'combat' ou 'skill'.
 */
export function setPreviewPose(pose) {
  if (['idle', 'combat', 'skill'].includes(pose)) {
    currentPose = pose;
    triggerHeroSurge(true);
  }
}

export function getPreviewPose() {
  return currentPose;
}

/**
 * Dispara uma onda de energia mística ao clicar na prévia ou trocar de postura.
 */
export function triggerHeroSurge(playSound = true) {
  shockwaves.push({
    radius: 10,
    maxRadius: 110,
    alpha: 0.9,
    speed: 3.5
  });

  const colors = THEME_COLORS[currentHeroKey] || THEME_COLORS.KNIGHT;
  // Explosão radial de fagulhas
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
    const spd = 2 + Math.random() * 3.5;
    particles.push({
      x: 0,
      y: 35,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd * 0.6 - 1.2,
      size: 2.2 + Math.random() * 2.5,
      alpha: 1.0,
      life: 0,
      maxLife: 35 + Math.random() * 20,
      color: Math.random() > 0.4 ? colors.primary : colors.secondary
    });
  }

  surgeTimer = 25;
  if (playSound) {
    try {
      playSfx('charge');
    } catch (e) {}
    triggerHaptic('medium');
  }
}

/**
 * Inicia o loop de animação da prévia.
 */
export function startPreview(heroKey) {
  if (heroKey) currentHeroKey = heroKey;
  if (!previewCanvas) {
    const canvasEl = document.getElementById('char-preview-canvas');
    if (canvasEl) initPreviewCanvas(canvasEl);
  }

  if (!previewCanvas) return;
  resizePreviewCanvas();
  isRunning = true;

  if (animFrameId) cancelAnimationFrame(animFrameId);
  renderLoop();
}

/**
 * Interrompe a renderização para poupar recursos durante o gameplay.
 */
export function stopPreview() {
  isRunning = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

/**
 * Loop principal de animação a 60 FPS com física e iluminação dinâmica.
 */
function renderLoop() {
  if (!isRunning || !previewCanvas || !previewCtx) return;

  previewTime += 1;
  renderStage();
  animFrameId = requestAnimationFrame(renderLoop);
}

/**
 * Sincroniza dinamicamente as dimensões do buffer com as dimensões CSS do elemento.
 * Previne 100% qualquer distorção, esticamento ou deslocamento em mobile e desktop.
 */
function syncCanvasDimensions() {
  if (!previewCanvas || !previewCtx) return { width: 280, height: 320, dpr: 1, skipFrame: true };

  const rect = previewCanvas.getBoundingClientRect();
  const clientW = previewCanvas.clientWidth || rect.width || 0;
  const clientH = previewCanvas.clientHeight || rect.height || 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Se o elemento estiver com display:none ou dimensões 0 durante transições, não renderiza neste frame
  if (clientW <= 0 || clientH <= 0) {
    return {
      width: previewCanvas.width ? (previewCanvas.width / dpr) : 280,
      height: previewCanvas.height ? (previewCanvas.height / dpr) : 320,
      dpr,
      skipFrame: previewCanvas.width <= 0
    };
  }

  const targetW = Math.round(clientW * dpr);
  const targetH = Math.round(clientH * dpr);

  // Auto-ajuste per-frame à prova de falhas: garante que o buffer interno
  // tenha SEMPRE a mesmíssima proporção de aspecto que o CSS
  if (previewCanvas.width !== targetW || previewCanvas.height !== targetH) {
    previewCanvas.width = targetW;
    previewCanvas.height = targetH;
  }

  return {
    width: clientW,
    height: clientH,
    dpr,
    skipFrame: false
  };
}

/**
 * Desenha o palco completo: Altar de pedra, círculos rúnicos, partículas e o herói.
 */
function renderStage() {
  const sync = syncCanvasDimensions();
  if (sync.skipFrame) return;

  const c = previewCtx;
  const { width, height, dpr } = sync;

  // Reset total da matriz de transformação e aplicação da escala DPR a cada frame
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.scale(dpr, dpr);

  const isCompact = height < 260 || width < 260;
  const centerX = width / 2;
  const centerY = isCompact ? height * 0.60 : height * 0.58;
  const pedestalOffsetY = isCompact ? 26 : 36;

  const colors = THEME_COLORS[currentHeroKey] || THEME_COLORS.KNIGHT;

  // 1. Limpeza e Fundo com Brilho Atmosférico do Abismo
  c.clearRect(0, 0, width, height);

  // Halo atmosférico radial ao redor do herói
  const bgGlow = c.createRadialGradient(centerX, centerY - 20, 10, centerX, centerY - 10, width * 0.65);
  bgGlow.addColorStop(0, colors.glow);
  bgGlow.addColorStop(0.55, 'rgba(10, 14, 24, 0.65)');
  bgGlow.addColorStop(1, 'rgba(6, 8, 14, 0)');
  c.fillStyle = bgGlow;
  c.fillRect(0, 0, width, height);

  // 2. Pedestal de Pedra e Círculos Rúnicos Místicos
  drawSummoningPedestal(c, centerX, centerY + pedestalOffsetY, colors, isCompact);

  // 3. Ondas de Choque Arcanas (Surges)
  drawShockwaves(c, centerX, centerY + pedestalOffsetY, colors);

  // 4. Partículas Elementais Flutuantes
  drawAtmosphericParticles(c, centerX, centerY + (isCompact ? 14 : 20), colors);

  // 5. Renderização do Modelo do Herói em 3.0x (ou 2.45x em compact/mobile)
  drawHeroInstance(c, centerX, centerY, colors, isCompact);

  // Efeito de Vinheta Suave nas Bordas
  const vignette = c.createRadialGradient(centerX, height / 2, width * 0.45, centerX, height / 2, width * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(7, 9, 15, 0.75)');
  c.fillStyle = vignette;
  c.fillRect(0, 0, width, height);
}

/**
 * Desenha a base de pedra e os anéis rúnicos rotativos em direções opostas.
 */
function drawSummoningPedestal(c, x, y, colors, isCompact = false) {
  const time = previewTime * 0.02;
  const scale = isCompact ? 0.82 : 1.0;

  c.save();
  c.translate(x, y);
  c.scale(scale, scale);

  // Sombra profunda projetada pela base de pedra
  c.fillStyle = 'rgba(0, 0, 0, 0.65)';
  c.beginPath();
  c.ellipse(0, 6, 82, 28, 0, 0, Math.PI * 2);
  c.fill();

  // Pedestal Inferior (Pedra Escura Entalhada)
  const slabGrad = c.createLinearGradient(0, -12, 0, 12);
  slabGrad.addColorStop(0, '#242e42');
  slabGrad.addColorStop(0.5, '#151c29');
  slabGrad.addColorStop(1, '#0c1018');
  c.fillStyle = slabGrad;
  c.strokeStyle = '#344360';
  c.lineWidth = 1.8;
  c.beginPath();
  c.ellipse(0, 4, 76, 24, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Borda Chanfrada Superior da Pedra
  c.fillStyle = '#1a2333';
  c.strokeStyle = colors.primary;
  c.lineWidth = 1.2;
  c.beginPath();
  c.ellipse(0, 0, 72, 22, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Brilho interior do selo de invocação
  c.fillStyle = colors.glow;
  c.beginPath();
  c.ellipse(0, 0, 66, 19, 0, 0, Math.PI * 2);
  c.fill();

  // --- ANEL RÚNICO EXTERIOR (Rotação no Sentido Horário) ---
  c.save();
  c.scale(1, 0.32); // Achata a rotação para criar perspectiva 3D realista
  c.rotate(time * 0.6);

  c.strokeStyle = colors.primary;
  c.lineWidth = 1.4;
  c.setLineDash([8, 6, 3, 6]);
  c.beginPath();
  c.arc(0, 0, 64, 0, Math.PI * 2);
  c.stroke();

  // Glifos / Marcadores Cardeais no Anel Externo
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const gx = Math.cos(angle) * 64;
    const gy = Math.sin(angle) * 64;

    c.fillStyle = colors.primary;
    c.beginPath();
    c.arc(gx, gy, 2.2, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();

  // --- ANEL RÚNICO INTERIOR (Rotação no Sentido Anti-horário) ---
  c.save();
  c.scale(1, 0.32);
  c.rotate(-time * 0.9);

  c.strokeStyle = colors.secondary;
  c.lineWidth = 1.1;
  c.setLineDash([4, 4]);
  c.beginPath();
  c.arc(0, 0, 48, 0, Math.PI * 2);
  c.stroke();

  // Triângulos Arcanos Entrelaçados
  c.setLineDash([]);
  c.lineWidth = 0.9;
  c.strokeStyle = `${colors.primary}66`;
  c.beginPath();
  for (let t = 0; t < 3; t++) {
    const a = (t / 3) * Math.PI * 2;
    const tx = Math.cos(a) * 44;
    const ty = Math.sin(a) * 44;
    if (t === 0) c.moveTo(tx, ty);
    else c.lineTo(tx, ty);
  }
  c.closePath();
  c.stroke();

  c.beginPath();
  for (let t = 0; t < 3; t++) {
    const a = (t / 3) * Math.PI * 2 + Math.PI;
    const tx = Math.cos(a) * 44;
    const ty = Math.sin(a) * 44;
    if (t === 0) c.moveTo(tx, ty);
    else c.lineTo(tx, ty);
  }
  c.closePath();
  c.stroke();
  c.restore();

  c.restore();
}

/**
 * Renderiza ondas de choque e anéis de invocação após cliques ou mudanças de postura.
 */
function drawShockwaves(c, x, y, colors) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.radius += sw.speed;
    sw.alpha *= 0.94;

    if (sw.radius >= sw.maxRadius || sw.alpha <= 0.02) {
      shockwaves.splice(i, 1);
      continue;
    }

    c.save();
    c.translate(x, y);
    c.scale(1, 0.35);
    c.strokeStyle = `${colors.primary}${Math.floor(sw.alpha * 255).toString(16).padStart(2, '0')}`;
    c.lineWidth = 2.5 * sw.alpha;
    c.beginPath();
    c.arc(0, 0, sw.radius, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
}

/**
 * Desenha partículas elementais que sobem do altar (faíscas, névoa, chamas, bolhas).
 */
function drawAtmosphericParticles(c, x, y, colors) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    p.y -= p.vy;
    p.x += p.vx + Math.sin(previewTime * 0.04 + p.seed) * 0.3;
    p.alpha -= 0.008;

    if (p.maxLife) {
      p.life++;
      if (p.life >= p.maxLife) p.alpha = 0;
    }

    // Reinicia partícula ao dissipar
    if (p.alpha <= 0 || p.y < -120) {
      p.x = (Math.random() - 0.5) * 140;
      p.y = 15 + Math.random() * 25;
      p.alpha = 0.5 + Math.random() * 0.5;
      p.vy = 0.4 + Math.random() * 0.8;
      p.color = undefined;
      p.maxLife = undefined;
    }

    const pColor = p.color || (i % 2 === 0 ? colors.primary : colors.secondary);
    c.fillStyle = pColor;
    c.globalAlpha = Math.max(0, p.alpha * 0.8);
    c.beginPath();

    if (currentHeroKey === 'ALCHEMIST') {
      // Bolhas com aro translúcido
      c.arc(x + p.x, y + p.y, p.size, 0, Math.PI * 2);
      c.fill();
    } else if (currentHeroKey === 'MAGE') {
      // Brasas pontiagudas
      c.ellipse(x + p.x, y + p.y, p.size * 0.7, p.size * 1.3, 0, 0, Math.PI * 2);
      c.fill();
    } else {
      // Fagulhas circulares
      c.arc(x + p.x, y + p.y, p.size, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1.0;
  }
}

/**
 * Renderiza o campeão central ampliado com todas as camadas e estados de postura.
 */
function drawHeroInstance(c, x, y, colors, isCompact = false) {
  const isSkill = currentPose === 'skill';
  const isCombat = currentPose === 'combat';

  // Configurações dinâmicas de respiração e física
  const t = previewTime;
  const bobFactor = isCombat ? 1.2 : 1.0;
  const breathBob = Math.sin(t * 0.06) * 1.6 * bobFactor;
  const capeWave = Math.sin(t * 0.08) * 3.2 + (isSkill ? 3.0 : 0);
  const plumeSway = Math.sin(t * 0.07) * 2.8;
  const hairSway = Math.sin(t * 0.07) * 3.0;

  // Escala ampliada (adaptável para telas menores)
  const heroScale = isCompact ? 2.45 : 3.1;

  // Pulso de energia da aura
  if (isSkill || surgeTimer > 0) {
    if (surgeTimer > 0) surgeTimer--;
    const pulseRadius = 38 + Math.sin(t * 0.2) * 4;
    c.save();
    c.strokeStyle = colors.primary;
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(x, y - 2 + breathBob, pulseRadius, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = colors.glow;
    c.fill();
    c.restore();
  }

  // Montagem do estado da réplica do herói para renderHeroModel
  const heroState = {
    x: x,
    y: y + breathBob,
    facing: currentFacing,
    scale: heroScale,
    isMoving: false,
    walkCycle: 0,
    frameCount: t,
    radius: 14,
    showShadow: false, // O pedestal já desenha a sombra 3D

    // Estados Especiais de Postura
    isDashing: isSkill && (currentHeroKey === 'KNIGHT' || currentHeroKey === 'MAGE'),
    isRetaliating: isCombat && currentHeroKey === 'KNIGHT',
    isHammerAttacking: false,

    isBerserk: (isSkill || isCombat) && currentHeroKey === 'BARBARIAN',
    berserkTimer: isSkill && currentHeroKey === 'BARBARIAN' ? 120 : 0,

    isPhasing: isSkill && currentHeroKey === 'ROGUE',
    invisTimer: isSkill && currentHeroKey === 'ROGUE' ? 60 : 0,
    isSwordAttacking: false,

    isCasting: isCombat && currentHeroKey === 'MAGE',
    staffCastTimer: isSkill && currentHeroKey === 'MAGE' ? 40 : 0,

    fluidColor: isSkill ? '#00cec9' : '#2ecc71',
    evolvedPotion: isSkill
  };

  // Renderização do modelo procedural
  renderHeroModel(c, currentHeroKey, heroState);
}
