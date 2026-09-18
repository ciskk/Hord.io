/**
 * src/render/bestiaryPreview.js
 * 
 * Motor de Renderização 2D dedicado para a Prévia do Códice do Bestiário.
 * Exibe a criatura selecionada sobre um pedestal de pedra rúnica com iluminação
 * temática viva, partículas etéreas ascendentes e suporte a silhueta misteriosa
 * para criaturas ainda não catalogadas.
 */

import { setMainCtx, ctx as mainGameCtx } from '../main.js';
import { drawEnemyShape } from './enemiesRenderer.js';
import { drawMiniBossShape } from './minibossesRenderer.js';
import { drawBoss, initBoss } from '../entities/bosses/bossRegistry.js';

let previewCanvas = null;
let pCtx = null;
let animFrameId = null;
let isRunning = false;
let previewFrameCount = 0;

let currentCreature = null;
let currentIsDiscovered = false;
let mockEntity = null;

// Partículas atmosféricas do pedestal
const pedestalMotes = [];
for (let i = 0; i < 20; i++) {
  pedestalMotes.push({
    x: (Math.random() - 0.5) * 110,
    y: (Math.random() - 0.5) * 20,
    speedY: 0.3 + Math.random() * 0.6,
    alpha: Math.random(),
    size: 1 + Math.random() * 2.5,
    maxHeight: 40 + Math.random() * 50
  });
}

/**
 * Cria a entidade mock adaptada para o renderizador da criatura
 */
function createMockEntity(creature, isDiscovered) {
  if (!creature) return null;

  if (creature.category === 'BOSS') {
    const bId = creature.bossId || parseInt(creature.id.replace('BOSS_', '')) || 1;
    const boss = {
      x: 0,
      y: 0,
      bossId: bId,
      name: creature.name,
      radius: bId === 4 ? 46 : (bId === 2 ? 40 : (bId === 3 ? 36 : 34)),
      facing: 1,
      color: creature.color || '#ff4757',
      hitFlash: 0,
      enraged: false,
      isEnraged: false,
      isVulnerable: false,
      attackTimer: 0,
      windupTimer: 0,
      actionState: 'IDLE',
      currentSkill: null,
      maxHp: 1000,
      hp: 1000,
      isBoss: true,
      isMiniBoss: false
    };

    try {
      initBoss(boss);
    } catch (err) {
      console.warn('Init mock boss warning:', err);
    }

    // Configuração dedicada para exposição artística no Bestiário
    // (Impede o chefe de ficar preso em cutscenes, SPAWN_INTRO ou tela preta)
    boss.actionState = 'IDLE';
    boss.introTimer = 0;
    boss.titleTimer = 0;
    boss.hasTriggeredTitle = true;
    boss.isTargetable = true;
    boss.enraged = false;
    boss.isEnraged = false;
    boss.isVulnerable = false;
    boss.phase = 1;
    boss.floatBob = 0;

    if (bId === 1) {
      boss.mistState = null;
      boss.isCleaving = false;
      boss.isWingPrepping = false;
      boss.introBats = [];
    } else if (bId === 2) {
      boss.thermalVents = [];
      boss.slamTelegraph = null;
      boss.epicenterTelegraph = null;
      boss.fissureWaves = [];
      boss.isPhase3 = false;
    } else if (bId === 3) {
      boss.soulWells = [];
      boss.isUnarmed = false;
      boss.deathMarkTarget = null;
      boss.triadClones = [];
      boss.collapseProgress = 0;
      boss.isPhase3 = false;
    } else if (bId === 4) {
      boss.healingZones = [];
      boss.gravityWell = null;
      boss.transitionWindup = 0;
      boss.transitionTimer = 0;
      boss.idleBlend = 0;
      boss.arenaCenterX = 0;
      boss.arenaCenterY = 0;
      boss.arenaRadius = 400;
    }

    return boss;
  }

  if (creature.category === 'MINIBOSS') {
    return {
      x: 0,
      y: 0,
      baseType: creature.id,
      name: creature.name,
      radius: 24,
      facing: 1,
      hitFlash: 0,
      slowTimer: 0,
      stunTimer: 0,
      enraged: false,
      color: creature.color || '#f39c12',
      isMiniBoss: true,
      isBoss: false,
      maxHp: 100,
      hp: 100,
      actionState: 'CHASE',
      castProgress: 0
    };
  }

  // Categoria HORDE
  return {
    x: 0,
    y: 0,
    baseType: creature.id,
    type: creature.id,
    radius: 20,
    facing: 1,
    hitFlash: 0,
    slowTimer: 0,
    stunTimer: 0,
    color: creature.color || '#2ecc71',
    isMiniBoss: false,
    isBoss: false,
    isElite: false,
    emergeTimer: 0,
    combatState: 'CHASE',
    variant: 0
  };
}

/**
 * Desenha o pedestal de pedra e o glifo rúnico sob a criatura
 */
function drawPedestal(pCtx, cx, cy, themeColor, isDiscovered, scale = 1.0) {
  const pulse = Math.sin(previewFrameCount * 0.05);
  const rot = previewFrameCount * 0.015;

  pCtx.save();
  pCtx.translate(cx, cy);
  pCtx.scale(scale, scale);

  // 1. Aura de brilho no solo
  const glowGrad = pCtx.createRadialGradient(0, 0, 5, 0, 0, 80);
  const glowCol = isDiscovered ? (themeColor || '#00f5d4') : '#ff4757';
  glowGrad.addColorStop(0, glowCol + '33');
  glowGrad.addColorStop(0.7, glowCol + '0a');
  glowGrad.addColorStop(1, 'transparent');
  pCtx.fillStyle = glowGrad;
  pCtx.beginPath();
  pCtx.ellipse(0, 0, 80, 32, 0, 0, Math.PI * 2);
  pCtx.fill();

  // 2. Base de Pedra Polida Escura (Dais)
  pCtx.fillStyle = '#0f131a';
  pCtx.strokeStyle = '#2d3436';
  pCtx.lineWidth = 2.5;
  pCtx.beginPath();
  pCtx.ellipse(0, 4, 66, 22, 0, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.stroke();

  // Topo do Pedestal
  pCtx.fillStyle = '#161c24';
  pCtx.strokeStyle = glowCol + '66';
  pCtx.lineWidth = 1.6;
  pCtx.beginPath();
  pCtx.ellipse(0, 0, 64, 20, 0, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.stroke();

  // 3. Anel Rúnico Giratório
  pCtx.save();
  pCtx.scale(1, 0.32);
  pCtx.rotate(rot);

  pCtx.strokeStyle = glowCol + 'aa';
  pCtx.lineWidth = 1.4;
  pCtx.setLineDash([8, 12]);
  pCtx.beginPath();
  pCtx.arc(0, 0, 52 + pulse * 1.5, 0, Math.PI * 2);
  pCtx.stroke();
  pCtx.setLineDash([]);

  // Marcadores de quadrante
  for (let m = 0; m < 4; m++) {
    const ang = m * (Math.PI / 2);
    pCtx.fillStyle = glowCol;
    pCtx.fillRect(Math.cos(ang) * 52 - 2, Math.sin(ang) * 52 - 2, 4, 4);
  }
  pCtx.restore();

  // 4. Partículas e Motes Flutuantes
  pCtx.fillStyle = glowCol + 'aa';
  for (let i = 0; i < pedestalMotes.length; i++) {
    const m = pedestalMotes[i];
    m.y -= m.speedY;
    if (m.y < -m.maxHeight) {
      m.y = 0;
      m.x = (Math.random() - 0.5) * 90;
    }
    const mAlpha = Math.max(0, 1 - Math.abs(m.y) / m.maxHeight);
    pCtx.fillStyle = glowCol + Math.round(mAlpha * 200).toString(16).padStart(2, '0');
    pCtx.fillRect(m.x, m.y, m.size, m.size);
  }

  pCtx.restore();
}

/**
 * Desenha a silhueta sombria com olhos vermelhos pulsantes
 */
function drawUndiscoveredSilhouette(pCtx, cx, cy, scale = 1.0) {
  const bob = Math.sin(previewFrameCount * 0.06) * 3;
  const eyeGlow = Math.sin(previewFrameCount * 0.08) * 0.3 + 0.7;
  const isBlinking = (previewFrameCount % 180) > 172;

  pCtx.save();
  pCtx.translate(cx, cy - 25 * scale + bob);
  pCtx.scale(scale, scale);

  // Aura sombria externa
  pCtx.shadowColor = 'rgba(255, 71, 87, 0.6)';
  pCtx.shadowBlur = 18;

  // Corpo / Manto Sombrio
  pCtx.fillStyle = '#06070a';
  pCtx.beginPath();
  pCtx.moveTo(0, -32);
  pCtx.quadraticCurveTo(24, -20, 20, 20);
  pCtx.quadraticCurveTo(0, 26, -20, 20);
  pCtx.quadraticCurveTo(-24, -20, 0, -32);
  pCtx.closePath();
  pCtx.fill();

  // Chifres / Espinhos etéreos
  pCtx.beginPath();
  pCtx.moveTo(-6, -28);
  pCtx.lineTo(-18, -42);
  pCtx.lineTo(-3, -33);
  pCtx.moveTo(6, -28);
  pCtx.lineTo(18, -42);
  pCtx.lineTo(3, -33);
  pCtx.fill();

  pCtx.shadowBlur = 0;

  // Olhos Demoníacos Escarlates
  if (!isBlinking) {
    pCtx.fillStyle = `rgba(255, 71, 87, ${eyeGlow})`;
    pCtx.shadowColor = '#ff4757';
    pCtx.shadowBlur = 8;

    // Olho esquerdo
    pCtx.beginPath();
    pCtx.ellipse(-7, -14, 3, 2, -0.2, 0, Math.PI * 2);
    pCtx.fill();

    // Olho direito
    pCtx.beginPath();
    pCtx.ellipse(7, -14, 3, 2, 0.2, 0, Math.PI * 2);
    pCtx.fill();

    // Fendas pupilares
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(-7.5, -15, 1, 3);
    pCtx.fillRect(6.5, -15, 1, 3);
  }

  pCtx.restore();

  // Selo de Registro Oculto
  pCtx.save();
  pCtx.font = "bold 9px 'Cinzel', 'Outfit', sans-serif";
  pCtx.textAlign = 'center';
  pCtx.textBaseline = 'middle';
  pCtx.fillStyle = '#ff7675';
  pCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  pCtx.shadowBlur = 4;
  pCtx.fillText("🔒 NÃO CATALOGADO", cx, cy + 24 * scale);
  pCtx.restore();
}

/**
 * Sincroniza a resolução interna do canvas com suas dimensões CSS reais
 */
function syncCanvasResolution() {
  if (!previewCanvas) return;
  const rect = previewCanvas.getBoundingClientRect();
  const w = Math.round(rect.width) || previewCanvas.width || 220;
  const h = Math.round(rect.height) || previewCanvas.height || 220;
  if (previewCanvas.width !== w || previewCanvas.height !== h) {
    previewCanvas.width = w;
    previewCanvas.height = h;
  }
}

/**
 * Loop de animação contínuo
 */
function renderFrame() {
  if (!isRunning || !previewCanvas || !pCtx) return;

  syncCanvasResolution();

  previewFrameCount++;
  const w = previewCanvas.width;
  const h = previewCanvas.height;

  pCtx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h * 0.70; // 70% da altura para o pedestal, deixando topo livre para criaturas monumentais
  const isCompact = w < 190 || h < 190;
  const pedestalScale = isCompact ? 0.82 : 1.0;

  // 1. Desenha o Pedestal Místico centrado
  drawPedestal(pCtx, cx, cy, currentCreature ? currentCreature.color : '#00f5d4', currentIsDiscovered, pedestalScale);

  // 2. Desenha a Criatura sobre o Pedestal
  if (currentCreature) {
    if (!currentIsDiscovered) {
      drawUndiscoveredSilhouette(pCtx, cx, cy, pedestalScale);
    } else if (mockEntity) {
      const originalCtx = mainGameCtx;
      setMainCtx(pCtx);

      try {
        if (currentCreature.category === 'BOSS') {
          const bId = mockEntity.bossId;

          // Calibração milimétrica de centro e escala por Chefe Supremo
          let offsetY = -42;
          let scale = isCompact ? 0.72 : 0.88;
          let bobAmp = 3.5;

          if (bId === 1) { // Lorde Vampírico
            offsetY = -40;
            scale = isCompact ? 0.74 : 0.92;
            bobAmp = 3.5;
          } else if (bId === 2) { // Monólito Abissal
            offsetY = -52;
            scale = isCompact ? 0.62 : 0.78;
            bobAmp = 2.5;
          } else if (bId === 3) { // Thanatos, o Ceifador Supremo
            offsetY = -48;
            scale = isCompact ? 0.65 : 0.82;
            bobAmp = 3.5;
          } else if (bId === 4) { // Soberano do Abismo
            offsetY = -44;
            scale = isCompact ? 0.64 : 0.80;
            bobAmp = 3.0;
          }

          // Atualiza levitação natural orgânica
          mockEntity.floatBob = Math.sin(previewFrameCount * 0.045) * bobAmp;
          mockEntity.facing = 1;
          mockEntity.x = 0;
          mockEntity.y = 0;

          pCtx.save();
          pCtx.translate(cx, cy + offsetY * scale);
          pCtx.scale(scale, scale);

          drawBoss(pCtx, mockEntity, previewFrameCount);

          pCtx.restore();

        } else if (currentCreature.category === 'MINIBOSS') {
          const scale = isCompact ? 0.85 : 1.05;
          const offsetY = -20 * scale;

          pCtx.save();
          pCtx.translate(cx, cy + offsetY);
          pCtx.scale(mockEntity.facing * scale, scale);

          drawMiniBossShape(mockEntity);

          pCtx.restore();

        } else {
          // Criaturas da Horda
          const scale = isCompact ? 0.90 : 1.15;
          const offsetY = -16 * scale;

          mockEntity.x = cx;
          mockEntity.y = cy + offsetY;

          pCtx.save();
          drawEnemyShape(mockEntity);
          pCtx.restore();
        }
      } catch (err) {
        console.warn('Erro ao renderizar modelo no bestiário:', err);
      } finally {
        setMainCtx(originalCtx);
      }
    }
  }

  animFrameId = requestAnimationFrame(renderFrame);
}

/**
 * Inicializa a prévia com um elemento canvas
 */
export function startBestiaryPreview(canvasEl, creatureEntry, isDiscovered) {
  if (!canvasEl) return;
  previewCanvas = canvasEl;
  pCtx = previewCanvas.getContext('2d', { alpha: true });

  syncCanvasResolution();
  setBestiaryPreviewCreature(creatureEntry, isDiscovered);

  if (!isRunning) {
    isRunning = true;
    animFrameId = requestAnimationFrame(renderFrame);
  }
}

/**
 * Altera a criatura exibida no pedestal
 */
export function setBestiaryPreviewCreature(creatureEntry, isDiscovered) {
  currentCreature = creatureEntry;
  currentIsDiscovered = isDiscovered;
  mockEntity = creatureEntry ? createMockEntity(creatureEntry, isDiscovered) : null;
}

/**
 * Pausa o motor de renderização da prévia
 */
export function stopBestiaryPreview() {
  isRunning = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}
