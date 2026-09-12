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
      { type: 'STALKER', offsetForward: -32, offsetLateral: 36 }
    ]
  }
};

export function getSquadDefinition(squadKey) {
  return SQUAD_TYPES[squadKey] || null;
}