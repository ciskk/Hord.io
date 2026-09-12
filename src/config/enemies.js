/**
 * src/config/enemies.js
 */
export const ENEMY_TYPES = {
  ZOMBIE: { name: 'Zumbi Operário', radius: 12, speed: 1.35, hp: 115, color: '#2ecc71', behavior: 'chase', damage: 9, xp: 1 },
  BAT: { name: 'Morcego Carmesim', radius: 9, speed: 3.1, hp: 48, color: '#ff4757', behavior: 'swarm', damage: 7, xp: 1 },
  GOLEM: { name: 'Golem de Concreto', radius: 24, speed: 0.82, hp: 490, color: '#747d8c', behavior: 'tank', damage: 24, xp: 6 },
  STALKER: { name: 'Assassino Espectral', radius: 11, speed: 1.35, hp: 135, color: '#9b59b6', behavior: 'dash', damage: 16, xp: 3 },
  EXPLODER: { name: 'Carniçal Ígneo', radius: 13, speed: 2.1, hp: 105, color: '#e67e22', behavior: 'kamikaze', damage: 14, xp: 2 },
  NECRO: { name: 'Cultista das Sombras', radius: 15, speed: 0.95, hp: 210, color: '#34495e', behavior: 'summoner', damage: 14, xp: 8 },
  SHOOTER: { name: 'Autômato Artilheiro', radius: 14, speed: 1.1, hp: 165, color: '#0984e3', behavior: 'shooter', damage: 12, xp: 4 },
  SHIELDED: { name: 'Guardião Blindado', radius: 16, speed: 1.0, hp: 290, color: '#b2bec3', behavior: 'shielded', damage: 18, xp: 5 },
  SPLITTER: { name: 'Parasita Divisor', radius: 15, speed: 1.4, hp: 155, color: '#00d2d3', behavior: 'splitter', damage: 11, xp: 4 },
  SPLITTER_MINI: { name: 'Parasita Célula', radius: 9, speed: 2.2, hp: 60, color: '#48dbfb', behavior: 'chase', damage: 8, xp: 2 }
};

// Recalibração de HP da Fase 5 e Normalização de Economia de XP (Fase 6.1)
export const BOSS_TYPES = {
  1: { name: 'Lorde Vampírico', hp: 9500, radius: 38, speed: 1.85, color: '#8e44ad', damage: 30, xp: 450, bossId: 1 },
  2: { name: 'Monólito Abissal', hp: 24000, radius: 48, speed: 0.95, color: '#c0392b', damage: 50, xp: 1200, bossId: 2 },
  3: { name: 'Ceifador Supremo', hp: 42000, radius: 44, speed: 2.1, color: '#00cec9', damage: 70, xp: 2400, bossId: 3 },
  4: { name: 'Soberano do Abismo', hp: 70000, radius: 52, speed: 1.25, color: '#8e44ad', damage: 90, xp: 0, bossId: 4, isFinalBoss: true }
};

export const MINI_BOSS_TYPES = {
  BLOOD_GARGOYLE:   { name: 'Gárgula de Sangue', radius: 24, speed: 2.4, hp: 420, color: '#c0392b', behavior: 'dash', damage: 22, xp: 90, gold: 15 },
  ZOMBIE_ALPHA:     { name: 'Zumbi Alfa', radius: 26, speed: 1.1, hp: 680, color: '#27ae60', behavior: 'chase', damage: 25, xp: 95, gold: 20 },
  PHALANX_LEADER:   { name: 'Centurião da Guarda', radius: 28, speed: 1.2, hp: 850, color: '#7f8c8d', behavior: 'shielded', damage: 28, xp: 110, gold: 25 },
  SEISMIC_SMASHER:  { name: 'Demolidor Sísmico', radius: 26, speed: 0.9, hp: 920, color: '#95a5a6', behavior: 'ground_slam', damage: 30, xp: 120, gold: 25 },
  ARTILLERY_MECH:   { name: 'Torre Móvel', radius: 25, speed: 0.9, hp: 750, color: '#2980b9', behavior: 'shooter', damage: 20, xp: 130, gold: 22 },
  FIRE_INCINERATOR: { name: 'Incinerador Instável', radius: 20, speed: 2.0, hp: 580, color: '#e67e22', behavior: 'kamikaze_spread', damage: 26, xp: 115, gold: 20 },
  BROOD_MATRIARCH:  { name: 'Matriarca Parasita', radius: 25, speed: 1.3, hp: 880, color: '#00cec9', behavior: 'splitter_queen', damage: 22, xp: 140, gold: 30 },
  SPECTRAL_STALKER: { name: 'Predador Espectral', radius: 22, speed: 2.5, hp: 620, color: '#6c5ce7', behavior: 'backstab_dash', damage: 32, xp: 135, gold: 28 },
  HIGH_OCCULTIST:   { name: 'Alto Sacerdote', radius: 24, speed: 1.0, hp: 950, color: '#341f97', behavior: 'gravity_ritual', damage: 24, xp: 160, gold: 35 },
  RUNIC_WARDEN:     { name: 'Guardião Rúnico', radius: 27, speed: 1.1, hp: 1200, color: '#0984e3', behavior: 'protect_aura', damage: 20, xp: 150, gold: 35 },
  RUST_COLOSSUS:    { name: 'Colosso Ferruginoso', radius: 32, speed: 0.85, hp: 1600, color: '#d35400', behavior: 'boulder_throw', damage: 35, xp: 180, gold: 40 },
  SIEGE_CAPTAIN:    { name: 'Capitão de Cerco', radius: 26, speed: 1.0, hp: 1100, color: '#b71540', behavior: 'mortar_barrage', damage: 28, xp: 165, gold: 40 },
  MOBILE_HIVE:      { name: 'Ninho Móvel', radius: 28, speed: 1.3, hp: 1300, color: '#16a085', behavior: 'bat_spawner', damage: 22, xp: 200, gold: 45 },
  QUANTUM_SLICER:   { name: 'Fatiador Quântico', radius: 23, speed: 2.2, hp: 980, color: '#a29bfe', behavior: 'blink_slash', damage: 36, xp: 190, gold: 45 },
  VOID_PRECURSOR:   { name: 'Precursor do Vazio', radius: 27, speed: 1.2, hp: 1800, color: '#8e44ad', behavior: 'vortex_carrier', damage: 32, xp: 220, gold: 50 },
  CHAOS_HERALD:     { name: 'Arauto do Caos', radius: 30, speed: 1.7, hp: 2200, color: '#c0392b', behavior: 'chaos_cycle', damage: 40, xp: 220, gold: 60 }
};