import { triggerBossEncounter } from '../entities/enemies.js';

export let bossesDefeated = { m1: false, m2: false, m3: false, final: false };

export function resetBossesDefeated() {
  bossesDefeated = { m1: false, m2: false, m3: false, final: false };
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