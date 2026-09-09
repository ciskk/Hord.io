export const ENEMY_TYPES = {
  ZOMBIE: { name: 'Zumbi Operário', radius: 12, speed: 1.35, hp: 28, color: '#2ecc71', behavior: 'chase', damage: 9, xp: 1 },
  BAT: { name: 'Morcego Carmesim', radius: 9, speed: 3.1, hp: 13, color: '#ff4757', behavior: 'swarm', damage: 7, xp: 1 },
  GOLEM: { name: 'Golem de Concreto', radius: 24, speed: 0.82, hp: 190, color: '#747d8c', behavior: 'tank', damage: 24, xp: 6 },
  STALKER: { name: 'Assassino Espectral', radius: 11, speed: 1.35, hp: 45, color: '#9b59b6', behavior: 'dash', damage: 16, xp: 3 },
  EXPLODER: { name: 'Carniçal Ígneo', radius: 13, speed: 2.1, hp: 32, color: '#e67e22', behavior: 'kamikaze', damage: 26, xp: 2 },
  NECRO: { name: 'Cultista das Sombras', radius: 15, speed: 0.95, hp: 85, color: '#34495e', behavior: 'summoner', damage: 14, xp: 8 },
  SHOOTER: { name: 'Autômato Artilheiro', radius: 14, speed: 1.1, hp: 55, color: '#0984e3', behavior: 'shooter', damage: 12, xp: 4 },
  SHIELDED: { name: 'Guardião Blindado', radius: 16, speed: 1.0, hp: 120, color: '#b2bec3', behavior: 'shielded', damage: 18, xp: 5 },
  SPLITTER: { name: 'Parasita Divisor', radius: 15, speed: 1.4, hp: 60, color: '#00d2d3', behavior: 'splitter', damage: 11, xp: 4 },
  SPLITTER_MINI: { name: 'Parasita Célula', radius: 9, speed: 2.2, hp: 25, color: '#48dbfb', behavior: 'chase', damage: 8, xp: 2 }
};

export const BOSS_TYPES = {
  1: { name: 'Lorde Vampírico', hp: 5500, radius: 56, speed: 1.85, color: '#8e44ad', damage: 30, xp: 120, bossId: 1 },
  2: { name: 'Monólito Abissal', hp: 12000, radius: 76, speed: 0.95, color: '#c0392b', damage: 60, xp: 250, bossId: 2 },
  3: { name: 'Ceifador Supremo', hp: 21000, radius: 68, speed: 2.1, color: '#d35400', damage: 75, xp: 450, bossId: 3 },
  4: { name: 'Soberano do Abismo', hp: 47500, radius: 88, speed: 1.3, color: '#e74c3c', damage: 90, xp: 1200, bossId: 4, isFinalBoss: true }
};