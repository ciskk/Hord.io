/**
 * src/config/enemies.js
 */
export const ENEMY_TYPES = {

  ZOMBIE: { name: 'Zumbi Operário', radius: 12, speed: 1.38, hp: 175, color: '#2ecc71', behavior: 'chase', damage: 19, xp: 1 },
  BAT: { name: 'Morcego Carmesim', radius: 9, speed: 3.25, hp: 73, color: '#ff4757', behavior: 'swarm', damage: 14, xp: 1 },
  GOLEM: { name: 'Golem de Concreto', radius: 24, speed: 0.82, hp: 686, color: '#747d8c', behavior: 'tank', damage: 43, xp: 6 },
  STALKER: { name: 'Assassino Espectral', radius: 11, speed: 1.35, hp: 189, color: '#9b59b6', behavior: 'dash', damage: 26, xp: 3 },
  EXPLODER: { name: 'Carniçal Ígneo', radius: 13, speed: 2.1, hp: 147, color: '#e67e22', behavior: 'kamikaze', damage: 30, xp: 2 },
  NECRO: { name: 'Cultista das Sombras', radius: 15, speed: 0.95, hp: 294, color: '#34495e', behavior: 'summoner', damage: 26, xp: 8 },
  SHOOTER: { name: 'Autômato Artilheiro', radius: 14, speed: 1.1, hp: 231, color: '#0984e3', behavior: 'shooter', damage: 22, xp: 4 },
  SHIELDED: { name: 'Guardião Blindado', radius: 16, speed: 1.0, hp: 406, color: '#b2bec3', behavior: 'shielded', damage: 31, xp: 5 },
  SPLITTER: { name: 'Parasita Divisor', radius: 15, speed: 1.4, hp: 217, color: '#00d2d3', behavior: 'splitter', damage: 22, xp: 4 },
  SPLITTER_MINI: { name: 'Parasita Célula', radius: 9, speed: 2.2, hp: 84, color: '#48dbfb', behavior: 'chase', damage: 14, xp: 2 },

  // --- 15 NOVOS MONSTROS DA HORDA EXPANDIDA ---
  TRAIL_CRAWLER:    { name: 'Rastejador Peçonhento', radius: 13, speed: 1.45, hp: 160, color: '#16a085', behavior: 'trail_toxic', damage: 18, xp: 2 },
  CRYPT_WEAVER:     { name: 'Tecelã das Catacumbas', radius: 14, speed: 1.20, hp: 210, color: '#636e72', behavior: 'web_trapper', damage: 16, xp: 3 },
  CHAIN_FLAYER:     { name: 'Flagelador de Correntes', radius: 16, speed: 1.05, hp: 310, color: '#b33939', behavior: 'chain_hook', damage: 28, xp: 4 },
  BASALT_GARGOYLE:  { name: 'Gárgula de Basalto', radius: 18, speed: 1.35, hp: 520, color: '#57606f', behavior: 'stone_turtle', damage: 32, xp: 5 },
  TOLL_BELLRINGER:  { name: 'Arauto do Sino Fúnebre', radius: 15, speed: 0.90, hp: 240, color: '#f39c12', behavior: 'haste_chanter', damage: 15, xp: 5 },
  PLAGUE_APOTHECARY:{ name: 'Boticário da Peste', radius: 14, speed: 1.00, hp: 260, color: '#27ae60', behavior: 'horde_mender', damage: 18, xp: 6 },
  RUNE_SCRIBE:      { name: 'Escriba das Runas', radius: 15, speed: 0.95, hp: 280, color: '#2980b9', behavior: 'barrier_linker', damage: 20, xp: 6 },
  FORGE_PYREGUARD:  { name: 'Lança-Chamas da Forja', radius: 17, speed: 0.85, hp: 340, color: '#d35400', behavior: 'flamethrower_cone', damage: 26, xp: 5 },
  MAIDEN_THORNS:    { name: 'Donzela das Agulhas', radius: 16, speed: 1.15, hp: 380, color: '#8e44ad', behavior: 'spike_retaliation', damage: 29, xp: 5 },
  MIRROR_BANSHEE:   { name: 'Banshee dos Espelhos', radius: 12, speed: 2.10, hp: 170, color: '#a29bfe', behavior: 'mirror_decoy', damage: 21, xp: 4 },
  DULLAHAN_VANGUARD:{ name: 'Cavaleiro Sem Cabeça', radius: 18, speed: 1.10, hp: 440, color: '#2c3e50', behavior: 'lance_charge', damage: 38, xp: 6 },
  SNIPER_CULTIST:   { name: 'Atirador de Éter', radius: 13, speed: 0.80, hp: 180, color: '#9c88ff', behavior: 'long_range_sniper', damage: 42, xp: 5 },
  VOID_SCAVENGER:   { name: 'Duende Ladrão de Gemas', radius: 12, speed: 2.30, hp: 190, color: '#00d2d3', behavior: 'xp_devourer', damage: 14, xp: 3 },
  GRAVE_GORGON:     { name: 'Carniçal Necrófago', radius: 17, speed: 1.10, hp: 350, color: '#535c68', behavior: 'corpse_eater', damage: 24, xp: 6 },
  CURSED_CHEST:     { name: 'Mímico de Éter', radius: 18, speed: 2.50, hp: 850, color: '#e056fd', behavior: 'mimic_trap', damage: 36, xp: 15 }

};

// Recalibração de HP da Fase 5 e Normalização de Economia de XP (Fase 6.1) + Dano dos Chefes (+35%)
export const BOSS_TYPES = {
  1: { name: 'Lorde Vampírico', hp: 28000, radius: 38, speed: 1.85, color: '#8e44ad', damage: 81, xp: 450, bossId: 1 },
  2: { name: 'Monólito Abissal', hp: 98000, radius: 48, speed: 0.95, color: '#c0392b', damage: 135, xp: 1200, bossId: 2 },
  3: { name: 'Thanatos, o Ceifador Supremo', hp: 140000, radius: 44, speed: 2.1, color: '#00cec9', damage: 246, xp: 2400, bossId: 3 },
  4: { name: 'Soberano do Abismo', hp: 309400, radius: 52, speed: 1.25, color: '#8e44ad', damage: 365, xp: 0, bossId: 4, isFinalBoss: true }
};

export const MINI_BOSS_TYPES = {
  BLOOD_GARGOYLE:   { name: 'Gárgula de Sangue', radius: 24, speed: 2.4, hp: 588, color: '#c0392b', behavior: 'dash', damage: 26, xp: 90, gold: 15 },
  ZOMBIE_ALPHA:     { name: 'Zumbi Alfa', radius: 26, speed: 1.1, hp: 952, color: '#27ae60', behavior: 'chase', damage: 30, xp: 95, gold: 20 },
  PHALANX_LEADER:   { name: 'Centurião da Guarda', radius: 28, speed: 1.2, hp: 1190, color: '#7f8c8d', behavior: 'shielded', damage: 34, xp: 110, gold: 25 },
  SEISMIC_SMASHER:  { name: 'Demolidor Sísmico', radius: 26, speed: 0.9, hp: 1288, color: '#95a5a6', behavior: 'ground_slam', damage: 36, xp: 120, gold: 25 },
  ARTILLERY_MECH:   { name: 'Torre Móvel', radius: 25, speed: 0.9, hp: 1050, color: '#2980b9', behavior: 'shooter', damage: 24, xp: 130, gold: 22 },
  FIRE_INCINERATOR: { name: 'Incinerador Instável', radius: 20, speed: 2.0, hp: 812, color: '#e67e22', behavior: 'kamikaze_spread', damage: 31, xp: 115, gold: 20 },
  BROOD_MATRIARCH:  { name: 'Matriarca Parasita', radius: 25, speed: 1.3, hp: 1232, color: '#00cec9', behavior: 'splitter_queen', damage: 26, xp: 140, gold: 30 },
  SPECTRAL_STALKER: { name: 'Predador Espectral', radius: 22, speed: 2.5, hp: 868, color: '#6c5ce7', behavior: 'backstab_dash', damage: 38, xp: 135, gold: 28 },
  HIGH_OCCULTIST:   { name: 'Alto Sacerdote', radius: 24, speed: 1.0, hp: 1330, color: '#341f97', behavior: 'gravity_ritual', damage: 29, xp: 160, gold: 35 },
  RUNIC_WARDEN:     { name: 'Guardião Rúnico', radius: 27, speed: 1.1, hp: 1680, color: '#0984e3', behavior: 'protect_aura', damage: 24, xp: 150, gold: 35 },
  RUST_COLOSSUS:    { name: 'Colosso Ferruginoso', radius: 32, speed: 0.85, hp: 2240, color: '#d35400', behavior: 'boulder_throw', damage: 42, xp: 180, gold: 40 },
  SIEGE_CAPTAIN:    { name: 'Capitão de Cerco', radius: 26, speed: 1.0, hp: 1540, color: '#b71540', behavior: 'mortar_barrage', damage: 34, xp: 165, gold: 40 },
  MOBILE_HIVE:      { name: 'Ninho Móvel', radius: 28, speed: 1.3, hp: 1820, color: '#16a085', behavior: 'bat_spawner', damage: 26, xp: 200, gold: 45 },
  QUANTUM_SLICER:   { name: 'Fatiador Quântico', radius: 23, speed: 2.2, hp: 1372, color: '#a29bfe', behavior: 'blink_slash', damage: 43, xp: 190, gold: 45 },
  VOID_PRECURSOR:   { name: 'Precursor do Vazio', radius: 27, speed: 1.2, hp: 2520, color: '#8e44ad', behavior: 'vortex_carrier', damage: 38, xp: 220, gold: 50 },
  CHAOS_HERALD:     { name: 'Arauto do Caos', radius: 30, speed: 1.7, hp: 3080, color: '#c0392b', behavior: 'chaos_cycle', damage: 48, xp: 220, gold: 60 }
};
