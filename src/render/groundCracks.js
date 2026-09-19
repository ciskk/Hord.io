/**
 * src/render/groundCracks.js
 * 
 * Simulador e renderizador procedural de alta performance de fendas tectônicas,
 * fraturas geológicas e solo consagrado para o Martelo Sagrado de Sir Roland.
 * Totalmente otimizado para altas taxas de cadência:
 * - Anti-stacking por proximidade (re-energização em vez de duplicação)
 * - Teto estrito de crateras simultâneas (máx 4)
 * - Polilinhas contínuas batched (redução de ~90% de draw calls)
 * - Zero alocações de gradientes a cada frame
 * - Debris batched sem chamadas a ctx.save/restore
 */
import { enemies, frameCount } from '../main.js';
import { addDamageText, createHitParticles } from '../systems/combat.js';

function pseudoRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const groundCraters = [];

/**
 * Adiciona ou re-energiza uma cratera de impacto telúrico no solo.
 * Se já existir uma cratera recente próxima (< 65px), re-energiza seu núcleo
 * evitando duplicações desnecessárias e sobrecarga de Canvas.
 */
export function addGroundCrater(x, y, angle, radius, count = 1, isEvolved = false, damage = 45) {
  // 1. Anti-stacking: fusão de impacto em rajada no mesmo local
  for (let i = groundCraters.length - 1; i >= 0; i--) {
    const existing = groundCraters[i];
    const dx = existing.x - x;
    const dy = existing.y - y;
    if (dx * dx + dy * dy < 65 * 65) {
      existing.life = Math.max(existing.life, 90);
      existing.maxLife = Math.max(existing.maxLife, 90);
      existing.damage = Math.max(existing.damage, damage);
      existing.radius = Math.max(existing.radius, radius);
      existing.isEvolved = existing.isEvolved || isEvolved;
      existing.pulseTimer = 16;
      return;
    }
  }

  // 2. Limite estrito de no máximo 4 crateras ativas simultâneas
  if (groundCraters.length >= 4) {
    groundCraters.shift();
  }

  const craterLifetime = 115; // ~1.9s a 60 FPS (perfeito para leitura dinâmica sem poluição)

  groundCraters.push({
    x,
    y,
    angle,
    radius,
    count,
    isEvolved,
    damage,
    crackData: generateGroundCracks(angle, radius, count, isEvolved),
    life: craterLifetime,
    maxLife: craterLifetime,
    pulseTimer: 16,
    burnCooldown: 0
  });
}

/**
 * Atualiza o ciclo de vida das crateras e aplica dano residual da terra consagrada.
 */
export function updateGroundCraters(dt) {
  if (groundCraters.length === 0) return;

  for (let i = groundCraters.length - 1; i >= 0; i--) {
    const c = groundCraters[i];
    c.life -= dt;
    if (c.pulseTimer > 0) c.pulseTimer -= dt;

    if (c.life <= 0) {
      groundCraters.splice(i, 1);
      continue;
    }

    // Dano residual da Terra Consagrada a cada 28 frames
    c.burnCooldown = (c.burnCooldown || 0) + dt;
    if (c.burnCooldown >= 28) {
      c.burnCooldown = 0;
      const progress = 1 - (c.life / c.maxLife);
      if (progress < 0.65 && c.damage > 0 && typeof enemies !== 'undefined' && enemies.length > 0) {
        const burnDmg = Math.max(1, Math.round(c.damage * 0.08));
        const radSq = (c.radius * 0.90) * (c.radius * 0.90);
        for (let j = 0; j < enemies.length; j++) {
          const e = enemies[j];
          if (!e || e.hp <= 0 || e.isTargetable === false) continue;
          const dx = e.x - c.x;
          const dy = e.y - c.y;
          if (dx * dx + dy * dy <= radSq) {
            e.hp -= burnDmg;
            e.hitFlash = 2;
            if (j % 2 === 0) {
              addDamageText(e.x, e.y, burnDmg, false, '#f1c40f');
            }
          }
        }
      }
    }
  }
}

/**
 * Renderiza todas as crateras ativas diretamente na camada do solo da arena.
 */
export function drawGroundCraters(ctx, viewLeft, viewRight, viewTop, viewBottom) {
  for (let i = 0; i < groundCraters.length; i++) {
    const c = groundCraters[i];
    if (viewLeft !== undefined && (c.x + c.radius * 1.5 < viewLeft || c.x - c.radius * 1.5 > viewRight || c.y + c.radius * 1.5 < viewTop || c.y - c.radius * 1.5 > viewBottom)) continue;

    const progress = 1 - (c.life / c.maxLife);
    // Transição suave: primeiros 55% vida total visível; últimos 45% fade out suave
    const fadeThreshold = 0.55;
    const alpha = progress < fadeThreshold ? 1.0 : Math.max(0, (1 - progress) / (1 - fadeThreshold));

    ctx.save();
    ctx.translate(c.x, c.y);
    drawDetailedGroundCracks(ctx, c.crackData, progress, alpha, c.angle, c.radius, c.isEvolved, 1.0, c.pulseTimer);
    ctx.restore();
  }
}

/**
 * Gera deterministicamente uma rede dendrítica de fraturas geológicas limpa e coesa.
 */
export function generateGroundCracks(baseAngle, radius, count = 1, isEvolved = false) {
  const seed = (Math.round(baseAngle * 100) * 19 + Math.round(radius * 11) + (count * 7)) % 10000;
  let s = seed + 1;
  const rnd = () => { s += 17.13; return pseudoRand(s); };

  const craterR = (isEvolved ? 20 : 15) + Math.min(6, (count - 1) * 2);
  const mainLen = radius * (isEvolved ? 1.45 : 1.25);

  // 1. Placas Tectônicas Deslocadas (Crust Slabs)
  const slabCount = isEvolved ? 5 : 4;
  const slabs = [];
  for (let i = 0; i < slabCount; i++) {
    const a1 = (i / slabCount) * Math.PI * 2 + (rnd() - 0.5) * 0.25;
    const a2 = ((i + 0.82) / slabCount) * Math.PI * 2 + (rnd() - 0.5) * 0.25;
    const rIn = craterR * (0.65 + rnd() * 0.2);
    const rOut = craterR * (1.15 + rnd() * 0.3);
    const midA = (a1 + a2) * 0.5;
    const disp = 2.0 + rnd() * 3.5;
    slabs.push({
      p1: { x: Math.cos(a1) * rIn, y: Math.sin(a1) * rIn * 0.78 },
      p2: { x: Math.cos(a1) * rOut + Math.cos(midA) * disp, y: (Math.sin(a1) * rOut + Math.sin(midA) * disp) * 0.78 },
      p3: { x: Math.cos(a2) * rOut + Math.cos(midA) * disp, y: (Math.sin(a2) * rOut + Math.sin(midA) * disp) * 0.78 },
      p4: { x: Math.cos(a2) * rIn, y: Math.sin(a2) * rIn * 0.78 },
      shade: rnd() > 0.45 ? '#373e4b' : '#272d36',
      highlight: rnd() > 0.4 ? '#7f8c8d' : '#57606f'
    });
  }

  // 2. Fendas Tectônicas Principais (Trunks)
  const trunkCount = isEvolved ? Math.min(4, Math.max(2, count)) : Math.min(3, Math.max(1, count));
  const trunks = [];

  for (let t = 0; t < trunkCount; t++) {
    const fanSpread = trunkCount > 1 ? (t - (trunkCount - 1) / 2) * (isEvolved ? 0.40 : 0.34) : 0;
    const trunkAng = baseAngle + fanSpread + (rnd() - 0.5) * 0.12;
    const len = mainLen * (0.85 + rnd() * 0.28);

    const segCount = isEvolved ? 6 : 5;
    const nodes = [{ x: 0, y: 0, width: isEvolved ? 9 : 7 }];
    const perpX = -Math.sin(trunkAng);
    const perpY = Math.cos(trunkAng);
    const dirX = Math.cos(trunkAng);
    const dirY = Math.sin(trunkAng);

    let curDist = 0;
    let curPerp = 0;

    for (let n = 1; n <= segCount; n++) {
      const stepProg = n / segCount;
      curDist = len * stepProg;
      const zigSign = (n % 2 === 0 ? 1 : -1);
      curPerp += zigSign * (5 + rnd() * 7) * (1 - stepProg * 0.3);
      const nx = dirX * curDist + perpX * curPerp;
      const ny = dirY * curDist + perpY * curPerp;
      const nw = Math.max(1.2, (isEvolved ? 9 : 7) * (1 - stepProg * 0.75));
      nodes.push({ x: nx, y: ny, width: nw });
    }

    // Ramificações secundárias
    const branches = [];
    if (segCount >= 4 && rnd() > 0.25) {
      const originIdx = 2;
      const origin = nodes[originIdx];
      const bSign = (rnd() > 0.5 ? 1 : -1);
      const bAng = trunkAng + bSign * (0.52 + rnd() * 0.28);
      const bLen = len * (0.28 + rnd() * 0.2);
      const bNodes = [{ x: origin.x, y: origin.y, width: origin.width * 0.6 }];
      const bPerpX = -Math.sin(bAng);
      const bPerpY = Math.cos(bAng);
      const bDirX = Math.cos(bAng);
      const bDirY = Math.sin(bAng);

      for (let bn = 1; bn <= 2; bn++) {
        const bp = bn / 2;
        const bDist = bLen * bp;
        const bZig = (bn % 2 === 0 ? 1 : -1) * (3 + rnd() * 4);
        bNodes.push({
          x: origin.x + bDirX * bDist + bPerpX * bZig,
          y: origin.y + bDirY * bDist + bPerpY * bZig,
          width: Math.max(1, origin.width * 0.5 * (1 - bp))
        });
      }
      branches.push(bNodes);
    }

    // Nós de luz sagrada ao longo das fraturas
    const radiantNodes = [];
    for (let g = 2; g < segCount; g += 2) {
      const gNode = nodes[g];
      radiantNodes.push({
        x: gNode.x,
        y: gNode.y,
        r: 3.2 + rnd() * 1.8
      });
    }

    trunks.push({ nodes, branches, radiantNodes, geysers: radiantNodes });
  }

  // 3. Fissuras Radiais 360° (Spiderweb)
  const radialCracks = [];
  const radialCount = isEvolved ? 5 : 4;
  for (let r = 0; r < radialCount; r++) {
    const rAng = (r / radialCount) * Math.PI * 2 + (rnd() - 0.5) * 0.3;
    const rLen = craterR * (1.15 + rnd() * 0.55);
    const rPerpX = -Math.sin(rAng);
    const rPerpY = Math.cos(rAng);
    const dirX = Math.cos(rAng);
    const dirY = Math.sin(rAng);

    const rNodes = [{ x: 0, y: 0 }];
    for (let rn = 1; rn <= 2; rn++) {
      const rp = rn / 2;
      const rDist = rLen * rp;
      const rZig = (rn % 2 === 0 ? 1 : -1) * (2 + rnd() * 3);
      rNodes.push({
        x: dirX * rDist + rPerpX * rZig,
        y: (dirY * rDist + rPerpY * rZig) * 0.82
      });
    }
    radialCracks.push(rNodes);
  }

  // 4. Fraturas Concêntricas
  const concentricArcs = [];
  const arcCount = isEvolved ? 2 : 1;
  for (let a = 0; a < arcCount; a++) {
    const arcR = craterR * (0.85 + a * 0.4);
    const startA = rnd() * Math.PI * 2;
    const spanA = 0.6 + rnd() * 0.9;
    concentricArcs.push({ arcR, startA, spanA });
  }

  // 5. Fragmentos de Rocha (rápidos e leves)
  const debris = [];
  const debCount = isEvolved ? 5 : 4;
  for (let d = 0; d < debCount; d++) {
    const dAng = baseAngle - 0.9 + (d / debCount) * 1.8 + (rnd() - 0.5) * 0.3;
    const dDist = (18 + rnd() * (radius * 0.6));
    const dApex = 12 + rnd() * 14;
    debris.push({
      ang: dAng,
      maxDist: dDist,
      apex: dApex,
      size: 2.2 + rnd() * 2.0,
      shade: rnd() > 0.4 ? '#57606f' : '#2f3640'
    });
  }

  return { craterR, slabs, trunks, radialCracks, concentricArcs, debris };
}

/**
 * Renderiza com máxima eficiência geométrica (batched paths) as fendas e o impacto telúrico.
 */
export function drawDetailedGroundCracks(ctx, crackData, progress, alpha, angle, radius, isEvolved = false, scale = 1.0, pulseTimer = 0) {
  if (!crackData) return;

  const { craterR, slabs, trunks, radialCracks, concentricArcs, debris } = crackData;

  const reach = Math.min(1, progress / 0.12);
  const shockR = radius * (0.35 + Math.min(1, progress / 0.16) * 0.65) * scale;
  const tFrame = typeof frameCount !== 'undefined' ? frameCount : 0;
  const pulseAdd = (pulseTimer > 0 ? (pulseTimer / 16) * 0.4 : 0);
  const magmaPulse = Math.min(1.3, (Math.sin(tFrame * 0.1) * 0.15 + 0.85) + pulseAdd);

  ctx.save();
  if (scale !== 1.0) ctx.scale(scale, scale);

  // =========================================================================
  // CAMADA 1: QUEIMADURA DO SOLO (Depressão de Basalto Sombra Leve sem Gradientes)
  // =========================================================================
  const scorchR = craterR * (1.3 + progress * 0.25);
  ctx.fillStyle = `rgba(16, 12, 10, ${alpha * 0.45})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, scorchR, scorchR * 0.76, 0, 0, Math.PI * 2);
  ctx.fill();

  // Núcleo do epicentro
  ctx.fillStyle = `rgba(10, 6, 4, ${alpha * 0.70})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, craterR * 0.65, craterR * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();

  // =========================================================================
  // CAMADA 2: PLACAS DE ROCHA DESLOCADAS (Crust Slabs)
  // =========================================================================
  for (let i = 0; i < slabs.length; i++) {
    const s = slabs[i];
    ctx.fillStyle = s.shade;
    ctx.beginPath();
    ctx.moveTo(s.p1.x, s.p1.y);
    ctx.lineTo(s.p2.x, s.p2.y);
    ctx.lineTo(s.p3.x, s.p3.y);
    ctx.lineTo(s.p4.x, s.p4.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = s.highlight;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(s.p2.x, s.p2.y);
    ctx.lineTo(s.p3.x, s.p3.y);
    ctx.stroke();
  }

  // =========================================================================
  // CAMADA 3: FISSURAS RADIAIS 360° E ARCOS CONCÊNTRICOS (BATCHED)
  // =========================================================================
  // Valas escuras radiais em 1 único stroke
  ctx.strokeStyle = `rgba(15, 10, 6, ${alpha * 0.85})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let r = 0; r < radialCracks.length; r++) {
    const rNodes = radialCracks[r];
    const rLimit = Math.max(1, Math.floor(rNodes.length * reach));
    ctx.moveTo(rNodes[0].x, rNodes[0].y);
    for (let n = 1; n < rLimit; n++) {
      ctx.lineTo(rNodes[n].x, rNodes[n].y);
    }
  }
  ctx.stroke();

  // Linhas de luz rúnica radiais em 1 único stroke
  ctx.strokeStyle = isEvolved
    ? `rgba(243, 156, 18, ${alpha * 0.70 * magmaPulse})`
    : `rgba(241, 196, 15, ${alpha * 0.65 * magmaPulse})`;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let r = 0; r < radialCracks.length; r++) {
    const rNodes = radialCracks[r];
    const rLimit = Math.max(1, Math.floor(rNodes.length * reach));
    ctx.moveTo(rNodes[0].x, rNodes[0].y);
    for (let n = 1; n < rLimit; n++) {
      ctx.lineTo(rNodes[n].x, rNodes[n].y);
    }
  }
  ctx.stroke();

  // Arcos concêntricos batched
  if (reach > 0.4 && concentricArcs.length > 0) {
    ctx.strokeStyle = `rgba(241, 196, 15, ${alpha * 0.35 * magmaPulse})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let a = 0; a < concentricArcs.length; a++) {
      const arc = concentricArcs[a];
      ctx.moveTo(Math.cos(arc.startA) * arc.arcR, Math.sin(arc.startA) * arc.arcR);
      ctx.arc(0, 0, arc.arcR, arc.startA, arc.startA + arc.spanA);
    }
    ctx.stroke();
  }

  // =========================================================================
  // CAMADA 4: FENDAS TECTÔNICAS PRINCIPAIS (POLILINHAS CONTÍNUAS BATCHED)
  // =========================================================================
  // PASSE 1: Abismo profundo na rocha
  ctx.strokeStyle = '#0e0906';
  ctx.lineWidth = isEvolved ? 5.5 : 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let t = 0; t < trunks.length; t++) {
    const trunk = trunks[t];
    const activeCount = Math.max(2, Math.floor(trunk.nodes.length * reach));
    ctx.moveTo(trunk.nodes[0].x, trunk.nodes[0].y);
    for (let n = 1; n < activeCount; n++) {
      ctx.lineTo(trunk.nodes[n].x, trunk.nodes[n].y);
    }
  }
  ctx.stroke();

  // PASSE 2: Leito de magma e energia sagrada
  ctx.strokeStyle = isEvolved
    ? `rgba(230, 126, 34, ${alpha * 0.88 * magmaPulse})`
    : `rgba(243, 156, 18, ${alpha * 0.82 * magmaPulse})`;
  ctx.lineWidth = isEvolved ? 2.8 : 2.2;
  ctx.beginPath();
  for (let t = 0; t < trunks.length; t++) {
    const trunk = trunks[t];
    const activeCount = Math.max(2, Math.floor(trunk.nodes.length * reach));
    ctx.moveTo(trunk.nodes[0].x, trunk.nodes[0].y);
    for (let n = 1; n < activeCount; n++) {
      ctx.lineTo(trunk.nodes[n].x, trunk.nodes[n].y);
    }
  }
  ctx.stroke();

  // PASSE 3: Filamento celestial puro incandescente
  if (alpha > 0.25) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85 * magmaPulse})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let t = 0; t < trunks.length; t++) {
      const trunk = trunks[t];
      const activeCount = Math.max(2, Math.floor(trunk.nodes.length * reach));
      ctx.moveTo(trunk.nodes[0].x, trunk.nodes[0].y);
      for (let n = 1; n < activeCount; n++) {
        ctx.lineTo(trunk.nodes[n].x, trunk.nodes[n].y);
      }
    }
    ctx.stroke();
  }

  // Micro-fendas ramificadas batched
  if (reach > 0.35) {
    ctx.strokeStyle = isEvolved
      ? `rgba(243, 156, 18, ${alpha * 0.70 * magmaPulse})`
      : `rgba(241, 196, 15, ${alpha * 0.65 * magmaPulse})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let t = 0; t < trunks.length; t++) {
      for (let b = 0; b < trunks[t].branches.length; b++) {
        const bNodes = trunks[t].branches[b];
        ctx.moveTo(bNodes[0].x, bNodes[0].y);
        for (let bn = 1; bn < bNodes.length; bn++) {
          ctx.lineTo(bNodes[bn].x, bNodes[bn].y);
        }
      }
    }
    ctx.stroke();
  }

  // =========================================================================
  // CAMADA 5: NÓS DE ENERGIA SAGRADA (Substituição limpa dos gêiseres pesados)
  // =========================================================================
  if (progress < 0.65 && alpha > 0.2) {
    const nodePulse = Math.sin(tFrame * 0.14) * 0.2 + 0.8;
    const nodeAlpha = alpha * nodePulse;
    ctx.fillStyle = isEvolved
      ? `rgba(255, 235, 150, ${nodeAlpha * 0.85})`
      : `rgba(255, 245, 200, ${nodeAlpha * 0.80})`;
    ctx.beginPath();
    for (let t = 0; t < trunks.length; t++) {
      const rNodes = trunks[t].radiantNodes || trunks[t].geysers || [];
      for (let g = 0; g < rNodes.length; g++) {
        const nd = rNodes[g];
        ctx.moveTo(nd.x + 3, nd.y);
        ctx.arc(nd.x, nd.y, 2.5 * nodePulse, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  // =========================================================================
  // CAMADA 6: ANEL DE CHOQUE SÍSMICO (Apenas impacto inicial)
  // =========================================================================
  if (progress < 0.10) {
    const shockP = progress / 0.10;
    const shockAlpha = (1 - shockP) * alpha;

    ctx.strokeStyle = isEvolved
      ? `rgba(243, 156, 18, ${shockAlpha * 0.70})`
      : `rgba(241, 196, 15, ${shockAlpha * 0.60})`;
    ctx.lineWidth = isEvolved ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, shockR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // =========================================================================
  // CAMADA 7: ESTILHAÇOS DE ROCHA (Apenas na explosão inicial, batched)
  // =========================================================================
  if (progress < 0.15) {
    const debFlyP = progress / 0.15;
    const debAlpha = (1 - debFlyP) * alpha;

    ctx.fillStyle = '#373e4b';
    ctx.beginPath();
    for (let d = 0; d < debris.length; d++) {
      const deb = debris[d];
      const dist = deb.maxDist * Math.sin(debFlyP * Math.PI * 0.5);
      const height = Math.sin(debFlyP * Math.PI) * deb.apex;
      const sx = Math.cos(deb.ang) * dist;
      const sy = Math.sin(deb.ang) * dist * 0.82 - height;
      const s = deb.size * 0.55;

      ctx.moveTo(sx, sy - s);
      ctx.lineTo(sx + s, sy);
      ctx.lineTo(sx, sy + s);
      ctx.lineTo(sx - s, sy);
    }
    ctx.fill();

    // Centelhas douradas rápidas batched
    ctx.fillStyle = `rgba(255, 235, 150, ${debAlpha * 0.75})`;
    ctx.beginPath();
    for (let d = 0; d < debris.length; d++) {
      const deb = debris[d];
      const dist = deb.maxDist * Math.sin(debFlyP * Math.PI * 0.5);
      const height = Math.sin(debFlyP * Math.PI) * deb.apex;
      const sx = Math.cos(deb.ang) * dist;
      const sy = Math.sin(deb.ang) * dist * 0.82 - height;
      ctx.moveTo(sx + 1.2, sy);
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  ctx.restore();
}
