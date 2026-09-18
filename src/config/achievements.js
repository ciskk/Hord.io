/**
 * src/config/achievements.js
 * Sistema Central de Conquistas, Estatísticas Persistentes e Desbloqueio Progressivo de Heróis.
 */
import { playSfx, triggerHaptic } from '../core/audio.js';
import { addPersistentGold } from '../entities/player.js';

const ACHIEVEMENTS_STORAGE_KEY = 'hord_achievements_v2';
const STATS_STORAGE_KEY = 'hord_stats_v2';

export const HERO_UNLOCK_MAP = {
  MAGE: 'hero_ignis',
  ROGUE: 'hero_kael',
  BARBARIAN: 'hero_kragdor',
  BERSERKER: 'hero_kragdor',
  ALCHEMIST: 'hero_valeria'
};

export const ACHIEVEMENTS = [
  // --- DESBLOQUEIOS DE HERÓIS ---
  {
    id: 'hero_ignis',
    title: "Chama Desperta",
    desc: "Derrote o Lorde Vampírico (Chefe 1) para purificar suas cinzas e despertar a Piromante Ignis.",
    category: "hero",
    heroKey: "MAGE",
    heroTitle: "Ignis, a Piromante",
    icon: "flame",
    rewardGold: 200,
    target: 1,
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(1);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Derrotado" : "Pendente"
      };
    }
  },
  {
    id: 'hero_kael',
    title: "Sombra do Abismo",
    desc: "Derrote o Monólito Abissal (Chefe 2) na Caldeira Tectônica para libertar Kael, o Andarilho Sombrio.",
    category: "hero",
    heroKey: "ROGUE",
    heroTitle: "Kael, o Andarilho Sombrio",
    icon: "dagger",
    rewardGold: 350,
    target: 1,
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(2);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Derrotado" : "Pendente"
      };
    }
  },
  {
    id: 'hero_kragdor',
    title: "Carnificina Furiosa",
    desc: "Elimine um total cumulativo de 5.000 abominações na arena para despertar a fúria de Kragdor.",
    category: "hero",
    heroKey: "BARBARIAN",
    heroTitle: "Kragdor, o Bárbaro Furioso",
    icon: "axe",
    rewardGold: 500,
    target: 5000,
    checkProgress: (stats) => ({
      current: Math.min(5000, stats.totalKills || 0),
      target: 5000,
      isMet: (stats.totalKills || 0) >= 5000,
      label: `${(stats.totalKills || 0).toLocaleString('pt-BR')} / 5.000 Abates`
    })
  },
  {
    id: 'hero_valeria',
    title: "Transmutação Proibida",
    desc: "Realize 5 Fusões / Evoluções Lendárias de armas na arena para invocar Valéria, a Alquimista Cáustica.",
    category: "hero",
    heroKey: "ALCHEMIST",
    heroTitle: "Valéria, a Alquimista Cáustica",
    icon: "potion",
    rewardGold: 500,
    target: 5,
    checkProgress: (stats) => ({
      current: Math.min(5, stats.totalEvolutions || 0),
      target: 5,
      isMet: (stats.totalEvolutions || 0) >= 5,
      label: `${Math.min(5, stats.totalEvolutions || 0)} / 5 Fusões`
    })
  },

  // --- FAÇANHAS DE COMBATE & LORE ---
  {
    id: 'first_blood',
    title: "Batismo de Sangue",
    desc: "Abata suas primeiras 1.000 abominações na arena.",
    category: "combat",
    icon: "skull",
    rewardGold: 200,
    target: 1000,
    checkProgress: (stats) => ({
      current: Math.min(1000, stats.totalKills || 0),
      target: 1000,
      isMet: (stats.totalKills || 0) >= 1000,
      label: `${Math.min(1000, stats.totalKills || 0).toLocaleString('pt-BR')} / 1.000 Abates`
    })
  },
  {
    id: 'boss_monolith',
    title: "Quebrador de Titãs",
    desc: "Destrua o Monólito Abissal (Chefe 2) na Caldeira Tectônica sob o tremor dos continentes.",
    category: "boss",
    icon: "shield",
    rewardGold: 400,
    target: 1,
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(2);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Derrotado" : "Pendente"
      };
    }
  },
  {
    id: 'boss_reaper',
    title: "Além do Véu",
    desc: "Sobreviva ao ceifar de Thanatos, o Ceifador Supremo (Chefe 3).",
    category: "boss",
    icon: "scythe",
    rewardGold: 700,
    target: 1,
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(3);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Derrotado" : "Pendente"
      };
    }
  },
  {
    id: 'abyss_conqueror',
    title: "Expurgador do Vazio",
    desc: "Derrote o Soberano do Abismo e complete a Onda 10 com Vitória Suprema Absoluta.",
    category: "boss",
    icon: "crown",
    rewardGold: 1500,
    target: 1,
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(4);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Vitória Suprema" : "Pendente"
      };
    }
  }
];

// Fila de notificações pendentes para serem exibidas na UI
export const pendingAchievementNotifications = [];

/**
 * Retorna as estatísticas vitalícias da conta
 */
export function getLifetimeStats() {
  try {
    let raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) {
      // Tenta migrar estatísticas de v1 caso existam
      const v1 = localStorage.getItem('hord_stats_v1');
      if (v1) {
        try {
          const parsedV1 = JSON.parse(v1);
          return {
            totalKills: parsedV1.totalKills || 0,
            highestWave: parsedV1.highestWave || 1,
            bossesDefeated: Array.isArray(parsedV1.bossesDefeated) ? parsedV1.bossesDefeated : [],
            totalEvolutions: parsedV1.totalEvolutions || 0,
            runsPlayed: parsedV1.runsPlayed || 0
          };
        } catch (err) {}
      }
      return {
        totalKills: 0,
        highestWave: 1,
        bossesDefeated: [],
        totalEvolutions: 0,
        runsPlayed: 0
      };
    }
    const parsed = JSON.parse(raw);
    return {
      totalKills: parsed.totalKills || 0,
      highestWave: parsed.highestWave || 1,
      bossesDefeated: Array.isArray(parsed.bossesDefeated) ? parsed.bossesDefeated : [],
      totalEvolutions: parsed.totalEvolutions || 0,
      runsPlayed: parsed.runsPlayed || 0
    };
  } catch (e) {
    return {
      totalKills: 0,
      highestWave: 1,
      bossesDefeated: [],
      totalEvolutions: 0,
      runsPlayed: 0
    };
  }
}

/**
 * Salva as estatísticas vitalícias
 */
export function saveLifetimeStats(stats) {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Erro ao salvar estatísticas:', e);
  }
}

/**
 * Retorna a lista de IDs de conquistas desbloqueadas
 */
export function getUnlockedAchievementIds() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Salva os IDs de conquistas desbloqueadas
 */
export function saveUnlockedAchievementIds(ids) {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Erro ao salvar conquistas:', e);
  }
}

/**
 * Verifica se um herói está desbloqueado
 * Sir Roland é sempre desbloqueado por padrão.
 */
export function isHeroUnlocked(heroKey) {
  if (heroKey === 'KNIGHT') return true;
  const achievementId = HERO_UNLOCK_MAP[heroKey];
  if (!achievementId) return false;
  const unlocked = getUnlockedAchievementIds();
  return unlocked.includes(achievementId);
}

/**
 * Retorna o progresso atual de uma conquista
 */
export function getAchievementStatus(achievementId) {
  const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!ach) return null;
  const unlocked = getUnlockedAchievementIds();
  const isCompleted = unlocked.includes(achievementId);
  const stats = getLifetimeStats();
  const progress = ach.checkProgress(stats);

  const percent = progress.target > 0 ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : 100;

  return {
    ...ach,
    isCompleted,
    current: progress.current,
    target: progress.target,
    percent: isCompleted ? 100 : percent,
    label: isCompleted ? "Concluído" : progress.label
  };
}

/**
 * Registra novos dados ocorridos durante ou no término da partida
 * e avalia se novas conquistas foram desbloqueadas.
 * @param {Object} delta Dados da partida atual (ex: { kills: 50, wave: 3, bossDefeated: 1, evolution: true })
 * @returns {Array} Conquistas recém-desbloqueadas
 */
export function recordRunStats(delta = {}) {
  const stats = getLifetimeStats();
  let changed = false;

  if (typeof delta.kills === 'number' && delta.kills > 0) {
    stats.totalKills += delta.kills;
    changed = true;
  }
  if (typeof delta.wave === 'number' && delta.wave > stats.highestWave) {
    stats.highestWave = delta.wave;
    changed = true;
  }
  if (typeof delta.bossDefeated === 'number') {
    if (!stats.bossesDefeated.includes(delta.bossDefeated)) {
      stats.bossesDefeated.push(delta.bossDefeated);
      changed = true;
    }
  }
  if (delta.evolution) {
    stats.totalEvolutions = (stats.totalEvolutions || 0) + 1;
    changed = true;
  }
  if (delta.runFinished) {
    stats.runsPlayed = (stats.runsPlayed || 0) + 1;
    changed = true;
  }

  if (changed) {
    saveLifetimeStats(stats);
  }

  // Avalia conquistas pendentes
  return evaluateAchievements(stats);
}

/**
 * Avalia todas as conquistas e desbloqueia as elegíveis
 */
export function evaluateAchievements(stats = getLifetimeStats()) {
  const unlockedIds = getUnlockedAchievementIds();
  const newlyUnlocked = [];

  ACHIEVEMENTS.forEach(ach => {
    if (!unlockedIds.includes(ach.id)) {
      const prog = ach.checkProgress(stats);
      if (prog.isMet) {
        unlockedIds.push(ach.id);
        newlyUnlocked.push(ach);

        if (ach.rewardGold > 0) {
          addPersistentGold(ach.rewardGold);
        }

        pendingAchievementNotifications.push(ach);
      }
    }
  });

  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievementIds(unlockedIds);
    try {
      playSfx('chest_rare');
      triggerHaptic('heavy');
    } catch (e) {}
  }

  return newlyUnlocked;
}

/**
 * DESBLOQUEAR TODOS OS HERÓIS E CONQUISTAS (Requisito Obrigatório DevTools W + 5)
 */
export function unlockAllAchievements() {
  const allIds = ACHIEVEMENTS.map(a => a.id);
  saveUnlockedAchievementIds(allIds);

  const stats = getLifetimeStats();
  stats.highestWave = 10;
  stats.bossesDefeated = [1, 2, 3, 4];
  stats.totalKills = Math.max(stats.totalKills, 2000);
  stats.totalEvolutions = Math.max(stats.totalEvolutions, 5);
  saveLifetimeStats(stats);

  try {
    playSfx('chest_rare');
    triggerHaptic('heavy');
  } catch (e) {}

  return allIds.length;
}

/**
 * RESETAR CONQUISTAS E BLOQUEAR HERÓIS (Volta ao estado de jogador novo)
 */
export function resetAchievements() {
  saveUnlockedAchievementIds([]);
  const stats = {
    totalKills: 0,
    highestWave: 1,
    bossesDefeated: [],
    totalEvolutions: 0,
    runsPlayed: 0
  };
  saveLifetimeStats(stats);
  pendingAchievementNotifications.length = 0;

  try {
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    localStorage.removeItem('hord_achievements_v1');
    localStorage.removeItem('hord_stats_v1');
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {}

  try {
    playSfx('hit');
    triggerHaptic('light');
  } catch (e) {}

  return true;
}
