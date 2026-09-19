/**
 * src/config/squads.js
 * Definição de Esquadrões Táticos ("Mini-Hordas") e composições mecânicas.
 * Offsets definidos em espaço local orientado ao jogador:
 * - offsetForward: distância à frente em direção ao jogador (+ vanguarda, - retaguarda)
 * - offsetLateral: distância perpendicular aos flancos (- esquerda, + direita)
 */

export const SQUAD_TYPES = {
  // 1. Falange de Cerco: Barreira de choque com fogo de cobertura
  PHALANX: {
    key: 'PHALANX',
    name: 'Falange de Cerco',
    members: [
      { type: 'SHIELDED', offsetForward: 30, offsetLateral: 0 },
      { type: 'ZOMBIE',   offsetForward: 18, offsetLateral: -28 },
      { type: 'ZOMBIE',   offsetForward: 18, offsetLateral: 28 },
      { type: 'ZOMBIE',   offsetForward: -6, offsetLateral: -48 },
      { type: 'ZOMBIE',   offsetForward: -6, offsetLateral: 48 },
      { type: 'SHOOTER',  offsetForward: -36, offsetLateral: 0 }
    ]
  },

  // 2. Enxame em Pinça: 10 Morcegos divididos em dois semi-arcos opostos
  SWARM_PINCER: {
    key: 'SWARM_PINCER',
    name: 'Enxame em Pinça',
    members: [
      // Pinça Flanco Esquerdo
      { type: 'BAT', offsetForward: 35, offsetLateral: -45 },
      { type: 'BAT', offsetForward: 20, offsetLateral: -60 },
      { type: 'BAT', offsetForward: 0,  offsetLateral: -70 },
      { type: 'BAT', offsetForward: -20, offsetLateral: -60 },
      { type: 'BAT', offsetForward: -35, offsetLateral: -45 },
      // Pinça Flanco Direito
      { type: 'BAT', offsetForward: 35, offsetLateral: 45 },
      { type: 'BAT', offsetForward: 20, offsetLateral: 60 },
      { type: 'BAT', offsetForward: 0,  offsetLateral: 70 },
      { type: 'BAT', offsetForward: -20, offsetLateral: 60 },
      { type: 'BAT', offsetForward: -35, offsetLateral: 45 }
    ]
  },

  // 3. Esquadrão de Ruptura: Zona de prioridade tática (Exploder + Splitters)
  DISRUPTION: {
    key: 'DISRUPTION',
    name: 'Esquadrão de Ruptura',
    members: [
      { type: 'EXPLODER', offsetForward: 32, offsetLateral: 0 },
      { type: 'ZOMBIE',   offsetForward: 16, offsetLateral: -26 },
      { type: 'ZOMBIE',   offsetForward: 16, offsetLateral: 26 },
      { type: 'SPLITTER', offsetForward: -12, offsetLateral: -38 },
      { type: 'SPLITTER', offsetForward: -12, offsetLateral: 38 },
      { type: 'SPLITTER', offsetForward: -28, offsetLateral: 0 }
    ]
  },

  // 4. Bateria de Cerco: Bloqueio de terreno e artilharia sustentada
  SIEGE_BATTERY: {
    key: 'SIEGE_BATTERY',
    name: 'Bateria de Cerco',
    members: [
      { type: 'GOLEM',   offsetForward: 40, offsetLateral: 0 },
      { type: 'SHOOTER', offsetForward: -15, offsetLateral: -36 },
      { type: 'SHOOTER', offsetForward: -15, offsetLateral: 36 },
      { type: 'NECRO',   offsetForward: -48, offsetLateral: 0 }
    ]
  },

  // 5. Horda Básica de Pressão: Massa frontal e ameaça de flanco
  HORDE_RUSH: {
    key: 'HORDE_RUSH',
    name: 'Horda de Pressão',
    members: [
      { type: 'ZOMBIE',  offsetForward: 32, offsetLateral: -16 },
      { type: 'ZOMBIE',  offsetForward: 32, offsetLateral: 16 },
      { type: 'ZOMBIE',  offsetForward: 12, offsetLateral: -38 },
      { type: 'ZOMBIE',  offsetForward: 12, offsetLateral: 0 },
      { type: 'ZOMBIE',  offsetForward: 12, offsetLateral: 38 },
      { type: 'ZOMBIE',  offsetForward: -8, offsetLateral: -20 },
      { type: 'ZOMBIE',  offsetForward: -8, offsetLateral: 20 },
      { type: 'STALKER', offsetForward: -32, offsetLateral: -36 },
      { type: 'STALKER', offsetForward: -32, offsetLateral: 36 },
      { type: 'VOID_SCAVENGER', offsetForward: -48, offsetLateral: 0 }
    ]
  },

  // 6. Patrulha de Reconhecimento (Onda 1): Pressão inicial de zumbis sem Stalkers imediatos
  HORDE_SCOUT: {
    key: 'HORDE_SCOUT',
    name: 'Patrulha de Reconhecimento',
    members: [
      { type: 'ZOMBIE',  offsetForward: 28, offsetLateral: -18 },
      { type: 'ZOMBIE',  offsetForward: 28, offsetLateral: 18 },
      { type: 'ZOMBIE',  offsetForward: 10, offsetLateral: -32 },
      { type: 'ZOMBIE',  offsetForward: 10, offsetLateral: 32 },
      { type: 'ZOMBIE',  offsetForward: -8, offsetLateral: 0 }
    ]
  },

  // 7. Pelotão de Execução: Puxão de corrente frontal e queima em flanco cruzado
  EXECUTION_SQUAD: {
    key: 'EXECUTION_SQUAD',
    name: 'Pelotão de Execução',
    members: [
      { type: 'CHAIN_FLAYER',    offsetForward: 38, offsetLateral: 0 },
      { type: 'FORGE_PYREGUARD', offsetForward: 16, offsetLateral: -34 },
      { type: 'FORGE_PYREGUARD', offsetForward: 16, offsetLateral: 34 },
      { type: 'TRAIL_CRAWLER',   offsetForward: -10, offsetLateral: -24 },
      { type: 'TRAIL_CRAWLER',   offsetForward: -10, offsetLateral: 24 },
      { type: 'ZOMBIE',          offsetForward: -28, offsetLateral: 0 }
    ]
  },

  // 8. Procissão da Morte: Muralha pétrea acelerada pelo sino fúnebre com curandeiros
  DEATH_PROCESSION: {
    key: 'DEATH_PROCESSION',
    name: 'Procissão da Morte',
    members: [
      { type: 'BASALT_GARGOYLE',  offsetForward: 42, offsetLateral: -28 },
      { type: 'BASALT_GARGOYLE',  offsetForward: 42, offsetLateral: 28 },
      { type: 'GOLEM',            offsetForward: 24, offsetLateral: 0 },
      { type: 'TOLL_BELLRINGER',   offsetForward: -12, offsetLateral: 0 },
      { type: 'PLAGUE_APOTHECARY', offsetForward: -36, offsetLateral: -26 },
      { type: 'PLAGUE_APOTHECARY', offsetForward: -36, offsetLateral: 26 },
      { type: 'RUNE_SCRIBE',      offsetForward: -50, offsetLateral: 0 }
    ]
  },

  // 9. Cerco Balístico de Éter: Distração aérea com artilharia sniper de longo alcance
  SNIPER_PINCER: {
    key: 'SNIPER_PINCER',
    name: 'Cerco Balístico',
    members: [
      { type: 'BAT',            offsetForward: 30, offsetLateral: -35 },
      { type: 'BAT',            offsetForward: 30, offsetLateral: 35 },
      { type: 'CRYPT_WEAVER',   offsetForward: 10, offsetLateral: 0 },
      { type: 'SNIPER_CULTIST', offsetForward: -42, offsetLateral: -48 },
      { type: 'SNIPER_CULTIST', offsetForward: -42, offsetLateral: 48 }
    ]
  },

  // 10. Confraria das Sombras: Ilusionismo, retaliação e corte de cavalaria
  AMBUSH_COVEN: {
    key: 'AMBUSH_COVEN',
    name: 'Confraria das Sombras',
    members: [
      { type: 'DULLAHAN_VANGUARD', offsetForward: 45, offsetLateral: 0 },
      { type: 'MIRROR_BANSHEE',    offsetForward: 18, offsetLateral: -38 },
      { type: 'MIRROR_BANSHEE',    offsetForward: 18, offsetLateral: 38 },
      { type: 'MAIDEN_THORNS',     offsetForward: -8, offsetLateral: -20 },
      { type: 'MAIDEN_THORNS',     offsetForward: -8, offsetLateral: 20 },
      { type: 'GRAVE_GORGON',      offsetForward: -32, offsetLateral: 0 },
      { type: 'CURSED_CHEST',      offsetForward: -48, offsetLateral: 0 }
    ]
  }
};

export function getSquadDefinition(squadKey) {
  return SQUAD_TYPES[squadKey] || null;
}