/**
 * src/systems/physics.js
 * Módulo de Simulação Física e Resolução de Colisões Espaciais (Fases 1.1 e 2.1)
 */
import { clearSpatialGrid, insertIntoGrid, getNeighborIndices } from '../core/spatialGrid.js';
import { inputX, inputY } from '../core/input.js';

/**
 * Resolve as interpenetrações físicas no mundo de jogo:
 * 1. Reconstrói a Spatial Grid com entidades ativas.
 * 2. Aplica separação elasto-cinemática (50% / 50%) entre inimigos na horda.
 * 3. Resolve a sobreposição física Jogador vs. Inimigos com base em massa relativa (70% mob / 30% player)
 *    ou executa o Crowd Shove de Kael caso esteja em estado de Phasing/Invisibilidade.
 * Sub-alvos estáticos de chefes (isBossSubTarget) são isentos de repulsão cinemática para preservar suas órbitas.
 * 
 * @param {Object} player - Referência do jogador
 * @param {Array<Object>} enemies - Lista de inimigos ativos
 * @param {number} dt - Delta time normalizado
 */
export function resolveWorldPhysics(player, enemies, dt) {
  const enemyCount = enemies.length;

  // 1. População da Malha Espacial
  clearSpatialGrid();
  for (let i = 0; i < enemyCount; i++) {
    const e = enemies[i];
    if (e && e.hp > 0) {
      insertIntoGrid(e, i);
    }
  }

  // 2. Separação Elástica Mútua: Inimigo vs. Inimigo (50% / 50%)
  for (let i = 0; i < enemyCount; i++) {
    const e1 = enemies[i];
    if (
      !e1 || 
      e1.hp <= 0 || 
      e1.isBossSubTarget || 
      e1.baseType === 'BAT' || 
      (e1.isBoss && (e1.mistState === 'DASHING' || e1.actionState === 'TELEPORTING'))
    ) {
      continue;
    }

    const neighbors = getNeighborIndices(e1.x, e1.y, e1.radius * 2);
    const nLen = neighbors.length;

    for (let k = 0; k < nLen; k++) {
      const j = neighbors[k];
      if (j <= i) continue;

      const e2 = enemies[j];
      if (
        !e2 || 
        e2.hp <= 0 || 
        e2.isBossSubTarget || 
        e2.baseType === 'BAT' || 
        (e2.isBoss && (e2.mistState === 'DASHING' || e2.actionState === 'TELEPORTING'))
      ) {
        continue;
      }

      const dx = e2.x - e1.x;
      const dy = e2.y - e1.y;
      const distSq = dx * dx + dy * dy;
      const minDist = e1.radius + e2.radius;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = (minDist - dist) * 0.50;
        const nx = dx / dist;
        const ny = dy / dist;

        e1.x -= nx * overlap;
        e1.y -= ny * overlap;
        e2.x += nx * overlap;
        e2.y += ny * overlap;
      }
    }
  }

  // 3. Separação Física Jogador vs. Inimigos (Crowd Parting Dinâmico, Berserk Shove e Hiperarmadura)
  const isPhasing = !!(player.isPhasing || (player.invisTimer > 0));
  const moveLen = Math.hypot(inputX, inputY);
  const isPlayerMoving = !!(player.isMoving && moveLen > 0.01);
  const pDirX = isPlayerMoving ? (inputX / moveLen) : (player.facing || 1);
  const pDirY = isPlayerMoving ? (inputY / moveLen) : 0;
  const isBerserk = (player.berserkTimer || 0) > 0;

  for (let i = 0; i < enemyCount; i++) {
    const e = enemies[i];
    if (!e || e.hp <= 0 || e.isBossSubTarget) continue;
    if (e.isBoss && (e.mistState === 'DASHING' || e.actionState === 'TELEPORTING')) continue;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    const rSum = player.radius + e.radius;

    if (dist < rSum && dist > 0.0001) {
      const nx = dx / dist; // vetor do monstro para o jogador
      const ny = dy / dist;
      const overlap = rSum - dist;

      if (isPhasing && !e.isBoss && !e.isMiniBoss) {
        // Kael Phasing / Crowd Shove: repulsão lateral amplificada e atordoamento postural
        const repelSpeed = player.speed * 3.2;
        e.x -= nx * repelSpeed * dt;
        e.y -= ny * repelSpeed * dt;
        e.stunTimer = Math.max(e.stunTimer || 0, 22);
      } else if (e.isBoss || e.isMiniBoss) {
        // Chefes e Mini-Chefes são inabaláveis: jogador recebe 100% da correção física
        player.x += nx * overlap;
        player.y += ny * overlap;
      } else {
        // Hiperarmadura: se o monstro iniciou WINDUP ou STRIKE, ele resiste ao empurrão
        // para garantir que o seu ataque não seja cancelado nem saia do alcance (strikeLimit)
        const isAttacking = e.combatState === 'WINDUP' || e.combatState === 'STRIKE';

        if (isAttacking) {
          e.x -= nx * (overlap * 0.15);
          e.y -= ny * (overlap * 0.15);
          player.x += nx * (overlap * 0.85);
          player.y += ny * (overlap * 0.85);
        } else {
          // Monstro em perseguição, recuperação ou atordoamento:
          // Aplica deslocamento radial acentuado e dispersão tangencial lateral (abrir caminho)
          const berserkMult = isBerserk ? 1.75 : 1.0;
          const eliteWeight = e.isElite ? 0.55 : 1.0;

          // 1. Repulsão radial visível
          const radialPush = (overlap * 0.85 + (isPlayerMoving ? player.speed * 0.55 : 0)) * berserkMult * eliteWeight;
          e.x -= nx * radialPush;
          e.y -= ny * radialPush;
          player.x += nx * (overlap * 0.15);
          player.y += ny * (overlap * 0.15);

          // 2. Dispersão lateral tangencial (desvia o mob para as laterais da passada do jogador)
          if (isPlayerMoving) {
            const perpX = -pDirY;
            const perpY = pDirX;
            const toEnemyX = -nx;
            const toEnemyY = -ny;
            const sideDot = toEnemyX * perpX + toEnemyY * perpY;
            const sideSign = sideDot >= 0 ? 1 : -1;

            const lateralPush = player.speed * 1.30 * berserkMult * eliteWeight * dt;
            e.x += perpX * sideSign * lateralPush;
            e.y += perpY * sideSign * lateralPush;
          }
        }
      }
    }
  }
}