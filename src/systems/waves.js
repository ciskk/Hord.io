import { triggerBossEncounter, spawnMiniBoss } from '../entities/enemies.js';
import { activeBoss, gameState } from '../main.js';

export let bossesDefeated = { m1: false, m2: false, m3: false, final: false };
export let firstBossKilled = false;

export function setFirstBossKilled(val) {
  firstBossKilled = val;
}

export function resetBossesDefeated() {
  bossesDefeated = { m1: false, m2: false, m3: false, final: false };
  firstBossKilled = false;
}

export const miniBossSchedule = [
  // Onda 2 (25s–55s): 30% = 34s, 70% = 46s
  { time: 34, type: 'BLOOD_GARGOYLE', spawned: false },
  { time: 46, type: 'ZOMBIE_ALPHA', spawned: false },
  // Onda 3 (55s–90s): 30% = 65s, 70% = 79s
  { time: 65, type: 'PHALANX_LEADER', spawned: false },
  { time: 79, type: 'SEISMIC_SMASHER', spawned: false },
  // Onda 4 (90s–130s): 30% = 102s, 70% = 118s
  { time: 102, type: 'ARTILLERY_MECH', spawned: false },
  { time: 118, type: 'FIRE_INCINERATOR', spawned: false },
  // Onda 5 (130s–170s): 30% = 142s, 70% = 158s
  { time: 142, type: 'BROOD_MATRIARCH', spawned: false },
  { time: 158, type: 'SPECTRAL_STALKER', spawned: false },
  // Onda 6 (170s–210s): 30% = 182s, 70% = 198s
  { time: 182, type: 'HIGH_OCCULTIST', spawned: false },
  { time: 198, type: 'RUNIC_WARDEN', spawned: false },
  // Onda 7 (210s–250s): 30% = 222s, 70% = 238s
  { time: 222, type: 'RUST_COLOSSUS', spawned: false },
  { time: 238, type: 'SIEGE_CAPTAIN', spawned: false },
  // Onda 8 (250s–290s): 30% = 262s, 70% = 278s
  { time: 262, type: 'MOBILE_HIVE', spawned: false },
  { time: 278, type: 'QUANTUM_SLICER', spawned: false },
  // Ondas 9 e 10 (290s+): Clímax e Repetições
  { time: 302, type: 'VOID_PRECURSOR', spawned: false },
  { time: 322, type: 'CHAOS_HERALD', spawned: false },
  { time: 360, type: 'VOID_PRECURSOR', spawned: false },
  { time: 380, type: 'CHAOS_HERALD', spawned: false }
];

export function resetMiniBossSchedule() {
  for (let i = 0; i < miniBossSchedule.length; i++) {
    miniBossSchedule[i].spawned = false;
  }
}

export function checkMiniBossSchedule(seconds) {
  for (let i = 0; i < miniBossSchedule.length; i++) {
    const entry = miniBossSchedule[i];
    if (seconds >= entry.time && !entry.spawned) {
      entry.spawned = true;
      spawnMiniBoss(entry.type);
    }
  }
}

export function checkBossSchedule(seconds) {
  if (seconds >= 60 && !bossesDefeated.m1) {
    bossesDefeated.m1 = true;
    triggerBossEncounter(1);
  } else if (seconds >= 140 && !bossesDefeated.m2) {
    bossesDefeated.m2 = true;
    triggerBossEncounter(2);
  } else if (seconds >= 220 && !bossesDefeated.m3) {
    bossesDefeated.m3 = true;
    triggerBossEncounter(3);
  } else if (seconds >= 340 && !bossesDefeated.final) {
    bossesDefeated.final = true;
    triggerBossEncounter(4);
  }
}

export function getCurrentWave(seconds) {
  if (seconds < 25) {
    return { index: 1, name: "Onda 1: Reconhecimento", types: ['ZOMBIE'], rate: 30, clusterSize: [3, 5], eliteChance: 0 };
  } else if (seconds < 55) {
    return { index: 2, name: "Onda 2: Revoada Carmesim", types: ['ZOMBIE', 'BAT'], rate: 26, clusterSize: [4, 7], eliteChance: 0.05 };
  } else if (seconds < 90) {
    return { index: 3, name: "Onda 3: Batalhão Blindado", types: ['ZOMBIE', 'SHIELDED'], rate: 22, clusterSize: [4, 8], eliteChance: 0.08 };
  } else if (seconds < 130) {
    return { index: 4, name: "Onda 4: Fogo Cruzado Industrial", types: ['SHOOTER', 'BAT', 'EXPLODER'], rate: 20, clusterSize: [5, 9], eliteChance: 0.12 };
  } else if (seconds < 170) {
    return { index: 5, name: "Onda 5: Praga Rastejante", types: ['SPLITTER', 'ZOMBIE', 'STALKER'], rate: 18, clusterSize: [6, 10], eliteChance: 0.15 };
  } else if (seconds < 210) {
    return { index: 6, name: "Onda 6: Rito das Sombras", types: ['NECRO', 'SHOOTER', 'SHIELDED'], rate: 16, clusterSize: [6, 11], eliteChance: 0.18 };
  } else if (seconds < 250) {
    return { index: 7, name: "Onda 7: Cerco de Gigantes", types: ['GOLEM', 'SHIELDED', 'EXPLODER'], rate: 15, clusterSize: [7, 12], eliteChance: 0.22 };
  } else if (seconds < 290) {
    return { index: 8, name: "Onda 8: Enxame Aberrante", types: ['SPLITTER', 'STALKER', 'BAT', 'SHOOTER'], rate: 14, clusterSize: [8, 14], eliteChance: 0.25 };
  } else if (seconds < 330) {
    return { index: 9, name: "Onda 9: Tempestade do Vazio", types: ['ZOMBIE', 'GOLEM', 'NECRO', 'SHOOTER', 'SHIELDED', 'EXPLODER'], rate: 12, clusterSize: [9, 16], eliteChance: 0.32 };
  } else {
    return { index: 10, name: "Onda 10: O Julgamento Final", types: ['ZOMBIE', 'BAT', 'GOLEM', 'STALKER', 'EXPLODER', 'NECRO', 'SHOOTER', 'SHIELDED', 'SPLITTER'], rate: 10, clusterSize: [10, 18], eliteChance: 0.40 };
  }
}