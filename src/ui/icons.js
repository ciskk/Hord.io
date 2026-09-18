/**
 * src/ui/icons.js
 * Biblioteca Unificada de Ícones Vetoriais SVG (Dark Fantasy / Neo-Gothic Survivor)
 * 
 * Substitui integralmente o uso de emojis na interface por glifos vetoriais
 * de alta fidelidade, consistentes entre plataformas, escaláveis e estilizados
 * via currentColor e drop-shadows rúnicos.
 */

export const ICONS = {
  // ==========================================
  // 1. COMBATE & ARSENAL DE ARMAS
  // ==========================================
  sword: `
    <path fill="currentColor" d="M19.7 2.8a1.5 1.5 0 0 0-2.1 0l-7.3 7.3 1.4 1.4 7.3-7.3a1.5 1.5 0 0 0 0-2.1l-.7-.7z"/>
    <path fill="currentColor" d="M10.3 11.5l-6.8 6.8-.7 3.5 3.5-.7 6.8-6.8-2.8-2.8z"/>
    <path fill="currentColor" d="M14.2 15.6l-1.4-1.4 1.4-1.4 1.4 1.4-1.4 1.4z"/>
    <path fill="currentColor" d="M8.4 9.8l-1.4-1.4 1.4-1.4 1.4 1.4-1.4 1.4z"/>
  `,

  axe: `
    <path fill="currentColor" d="M9 3v18h2V3H9z"/>
    <path fill="currentColor" d="M12 4c3.5 0 8 .8 9.5 4.5-1.5 3.5-6 4.5-9.5 4.5V4z"/>
    <path fill="currentColor" d="M8 4C4.5 4 0 4.8-1.5 8.5 0 12 4.5 13 8 13V4z" transform="translate(9,0)"/>
  `,

  staff: `
    <path fill="currentColor" d="M11 7v15h2V7h-2z"/>
    <circle cx="12" cy="4.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="12" cy="4.5" r="1" fill="currentColor"/>
    <path fill="currentColor" d="M7 6c1.5-2 3.5-2.5 5-2.5s3.5.5 5 2.5c-.8.8-1.8 1.2-2.5 1-1-.2-1.5-1-2.5-1s-1.5.8-2.5 1c-.7.2-1.7-.2-2.5-1z"/>
  `,

  hammer: `
    <path fill="currentColor" d="M11 10v12h2V10h-2z"/>
    <rect x="5" y="3" width="14" height="7" rx="1.5" fill="currentColor"/>
    <path fill="#121622" d="M8 5h8v3H8z"/>
    <polygon points="12,2 14,4 10,4" fill="currentColor"/>
  `,

  potion: `
    <path fill="currentColor" d="M10 2h4v2h-4z"/>
    <path fill="currentColor" d="M11 4h2v3h-2z"/>
    <path fill="currentColor" d="M12 7l-5 9.5A3.5 3.5 0 0 0 10.1 21h3.8a3.5 3.5 0 0 0 3.1-4.5L12 7zm0 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
  `,

  orbitals: `
    <path fill="currentColor" d="M4 3h13a3 3 0 0 1 3 3v13a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V5a2 2 0 0 1 1-2zm2 15a1 1 0 0 0 1 1h11V6a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v12z"/>
    <line x1="9" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.8"/>
    <line x1="9" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.8"/>
  `,

  aura: `
    <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <path fill="currentColor" d="M12 1l1.5 3.5h-3zM12 23l-1.5-3.5h3zM1 12l3.5-1.5v3zM23 12l-3.5 1.5v-3zM4.2 4.2l3.2.7-.7 3.2zM19.8 19.8l-3.2-.7.7-3.2zM4.2 19.8l.7-3.2 3.2.7zM19.8 4.2l-.7 3.2-3.2-.7z"/>
  `,

  // ==========================================
  // 2. PASSIVAS & ATRIBUTOS
  // ==========================================
  damage: `
    <polygon points="13,1 4,14 11,14 9,23 20,9 13,9" fill="currentColor"/>
  `,

  armor: `
    <path fill="currentColor" d="M12 2L4 5.5v6c0 5.2 3.4 10.1 8 11.5 4.6-1.4 8-6.3 8-11.5v-6L12 2zm0 18.2C8.3 18.9 5.8 14.8 5.8 11.5V6.8L12 4.1l6.2 2.7v4.7c0 3.3-2.5 7.4-6.2 8.7z"/>
    <polygon points="12,6 14,10 12,14 10,10" fill="currentColor"/>
  `,

  wings: `
    <path fill="currentColor" d="M2.5 11c3.5 0 6.5-2 8.5-6 0 5-2 9-6 11-1.5.8-3 .5-2.5-5zm19 0c-3.5 0-6.5-2-8.5-6 0 5 2 9 6 11 1.5.8 3 .5 2.5-5z"/>
    <path fill="currentColor" d="M7 16c2-1 4-3 5-6 1 3 3 5 5 6-3 3-7 3-10 0z"/>
  `,

  frost: `
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M4.9 19.1L19.1 4.9"/>
    <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
  `,

  cooldown: `
    <path fill="currentColor" d="M6 2h12v3l-4 4.5 4 4.5v3H6v-3l4-4.5L6 5V2zm2 2v1.5l3.5 4-3.5 4V15h8v-1.5l-3.5-4 3.5-4V4H8z"/>
    <polygon points="12,12 14,14 10,14" fill="currentColor"/>
  `,

  crit: `
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
    <line x1="12" y1="1" x2="12" y2="5" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
    <line x1="1" y1="12" x2="5" y2="12" stroke="currentColor" stroke-width="2"/>
    <line x1="19" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>
  `,

  magnet: `
    <path fill="currentColor" d="M5 3v7c0 3.9 3.1 7 7 7s7-3.1 7-7V3h-4v7c0 1.7-1.3 3-3 3s-3-1.3-3-3V3H5z"/>
    <rect x="4" y="2" width="6" height="3" fill="currentColor"/>
    <rect x="14" y="2" width="6" height="3" fill="currentColor"/>
    <path fill="none" stroke="currentColor" stroke-width="1.5" d="M2 10a10 10 0 0 0 20 0"/>
  `,

  heal: `
    <path fill="currentColor" d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19z"/>
    <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
  `,

  // ==========================================
  // 3. CONSTELAÇÕES & ASTROLÁBIO
  // ==========================================
  constellation_all: `
    <polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="12" cy="12" r="3.5" fill="currentColor"/>
  `,

  constellation_guerra: `
    <path fill="currentColor" d="M19.5 2.5l-6 6 2 2 6-6-2-2z"/>
    <path fill="currentColor" d="M4.5 17.5l-2 4 4-2 6-6-2-2-6 6z"/>
    <path fill="currentColor" d="M4.5 2.5l2 2 6 6-2 2-6-6-2-2 2-2z"/>
    <path fill="currentColor" d="M19.5 17.5l-6-6-2 2 6 6-2 4 4-2z"/>
  `,

  constellation_egide: `
    <path fill="currentColor" d="M12 2L3 6v6c0 6 4.5 11 9 12 4.5-1 9-6 9-12V6l-9-4zm0 17c-3-1-6-4.5-6-9V7.5l6-2.5 6 2.5V10c0 4.5-3 8-6 9z"/>
    <circle cx="12" cy="11" r="3" fill="currentColor"/>
  `,

  constellation_destino: `
    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
    <ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="currentColor" stroke-width="1.5" transform="rotate(-30 12 12)"/>
  `,

  keystone: `
    <polygon points="12,3 15,9 21,5 19,17 5,17 3,5 9,9" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <rect x="5" y="17" width="14" height="4" rx="1" fill="currentColor"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  `,

  lock: `
    <path fill="currentColor" fill-rule="evenodd" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9zm3 3a1.75 1.75 0 0 0-1 3.19v2.06a1 1 0 1 0 2 0v-2.06A1.75 1.75 0 0 0 12 13z"/>
  `,

  purify: `
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M20 12A8 8 0 1 1 18 6.5"/>
    <polyline points="21 2 21 7 16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  scroll: `
    <path fill="currentColor" d="M19 3H7a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM7 5h12v11H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>
    <line x1="9" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="1.5"/>
    <line x1="9" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="1.5"/>
  `,

  // ==========================================
  // 4. RESUMO DE BÊNÇÃOS (STAT CARDS)
  // ==========================================
  execute: `
    <path fill="currentColor" d="M12 2a6 6 0 0 0-6 6c0 3 1.5 5 3 6v3h6v-3c1.5-1 3-3 3-6a6 6 0 0 0-6-6zm-2 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
    <path fill="currentColor" d="M9 18h6v3H9z"/>
  `,

  heart: `
    <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  `,

  boot: `
    <path fill="currentColor" d="M3 13c3.5 0 5.5-1.5 7-4l2 3h4l2 5H5a2 2 0 0 1-2-2v-2z"/>
    <line x1="3" y1="20" x2="19" y2="20" stroke="currentColor" stroke-width="2"/>
    <line x1="6" y1="8" x2="10" y2="12" stroke="currentColor" stroke-width="1.5"/>
  `,

  regen: `
    <path fill="currentColor" d="M12 2C7 7 5 12 7 16a6 6 0 0 0 10 0c2-4 0-9-5-14zm0 16a3.5 3.5 0 0 1-3.5-3.5c0-1.5.8-3 2-4.5 1 2 2.5 3.5 2.5 5.5A2 2 0 0 1 12 18z"/>
  `,

  phoenix: `
    <path fill="currentColor" d="M12 2c-2 3-5 5-5 9a5 5 0 0 0 10 0c0-4-3-6-5-9zm0 13a2 2 0 0 1-2-2c0-1.5 1.5-2.5 2-4 .5 1.5 2 2.5 2 4a2 2 0 0 1-2 2z"/>
    <path fill="currentColor" d="M5 12c-2 0-3 1.5-3 3.5A4.5 4.5 0 0 0 6.5 20c.5-1.5 0-3-1.5-4.5 1 0 2 .5 2.5 1 .5-2 0-3.5-2.5-4.5zm14 0c2 0 3 1.5 3 3.5A4.5 4.5 0 0 1 17.5 20c-.5-1.5 0-3 1.5-4.5-1 0-2 .5-2.5 1-.5-2 0-3.5 2.5-4.5z"/>
  `,

  soul_coin: `
    <polygon points="12,1 17,6 17,18 12,23 7,18 7,6" fill="none" stroke="currentColor" stroke-width="2"/>
    <polygon points="12,5 15,8 15,16 12,19 9,16 9,8" fill="currentColor"/>
  `,

  xp_tome: `
    <path fill="currentColor" d="M3 4v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zm16 16H5V4h14v16z"/>
    <polygon points="12,6 14,10 18,10 15,13 16,17 12,14 8,17 9,13 6,10 10,10" fill="currentColor"/>
  `,

  dice: `
    <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
  `,

  transmute: `
    <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <polygon points="12,5 18,16 6,16" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="12" cy="13" r="2.5" fill="currentColor"/>
  `,

  // ==========================================
  // 5. HUD, CONTROLES & METADADOS
  // ==========================================
  skull: `
    <path fill="currentColor" d="M12 2C7.6 2 4 5.6 4 10c0 2.8 1.4 5.3 3.6 6.8V20h8.8v-3.2c2.2-1.5 3.6-4 3.6-6.8 0-4.4-3.6-8-8-8zm-3 10a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zm6 0a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6z"/>
    <line x1="10" y1="18" x2="10" y2="20" stroke="#121622" stroke-width="1.5"/>
    <line x1="14" y1="18" x2="14" y2="20" stroke="#121622" stroke-width="1.5"/>
  `,

  blood_drop: `
    <path fill="currentColor" d="M12 2.7c-4 5.4-7 9.1-7 12.3 0 3.9 3.1 7 7 7s7-3.1 7-7c0-3.2-3-6.9-7-12.3zm-2.2 12c-.4 0-.8-.3-.8-.8 0-1.8 1.4-3.2 3.2-3.2.4 0 .8.4.8.8s-.4.8-.8.8c-1 0-1.7.7-1.7 1.6 0 .5-.3.8-.7.8z"/>
  `,

  pause: `
    <rect x="5" y="4" width="4.5" height="16" rx="1.5" fill="currentColor"/>
    <rect x="14.5" y="4" width="4.5" height="16" rx="1.5" fill="currentColor"/>
  `,

  boss_crown: `
    <polygon points="12,4 16,9 21,5 19,18 5,18 3,5 8,9" fill="currentColor"/>
    <rect x="5" y="19" width="14" height="2.5" rx="1" fill="currentColor"/>
  `,

  wave_swords: `
    <path fill="currentColor" d="M19 3l-5 5 1.5 1.5 5-5-1.5-1.5z"/>
    <path fill="currentColor" d="M5 19l-2 2 2 2 2-2-2-2z"/>
    <path fill="currentColor" d="M12.5 9.5l-6 6-1.5-1.5 6-6 1.5 1.5z"/>
    <path fill="currentColor" d="M5 3l5 5-1.5 1.5-5-5 1.5-1.5z"/>
    <path fill="currentColor" d="M19 19l2 2-2 2-2-2 2-2z"/>
    <path fill="currentColor" d="M11.5 9.5l6 6 1.5-1.5-6-6-1.5 1.5z"/>
  `,

  rotate: `
    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M20 12A8 8 0 1 1 17.5 6.3"/>
    <polyline points="20 2 20 7 15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  pose_idle: `
    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <path fill="currentColor" d="M12 3v3M12 18v3M3 12h3M18 12h3"/>
  `,

  pose_combat: `
    <path fill="currentColor" d="M14.5 2.5l7 7-12 12-7-7z"/>
    <line x1="2.5" y1="21.5" x2="6.5" y2="17.5" stroke="currentColor" stroke-width="2"/>
    <line x1="17" y1="5" x2="19" y2="7" stroke="currentColor" stroke-width="2"/>
  `,

  pose_skill: `
    <path fill="currentColor" d="M12 2C9.5 5 7 8 7 12a5 5 0 0 0 10 0c0-4-2.5-7-5-10zm0 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
  `,

  arrow_right: `
    <path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-5-5l5 5-5 5"/>
  `,

  close: `
    <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
  `,

  check: `
    <polyline points="4 12 9 17 20 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  `,

  timer: `
    <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="12" y1="13" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path fill="currentColor" d="M10 2h4v2h-4z"/>
  `,

  star_evolution: `
    <polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9" fill="currentColor"/>
  `,

  sparkle: `
    <polygon points="12,2 14,8 20,10 14,12 12,18 10,12 4,10 10,8" fill="currentColor"/>
  `,

  quote: `
    <path fill="currentColor" d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z"/>
  `
};

/**
 * Renderiza uma tag SVG com classes, dimensões e estilos padronizados.
 * 
 * @param {string} name - Chave do ícone em ICONS
 * @param {Object} options - Parâmetros opcionais de estilização
 * @param {number} [options.size=16] - Largura e altura em pixels
 * @param {string} [options.className=''] - Classes CSS adicionais
 * @param {string} [options.color=null] - Cor inline (ex: '#f1c40f')
 * @param {string} [options.style=''] - Estilos CSS inline adicionais
 * @returns {string} Elemento SVG formatado em string
 */
export function renderIcon(name, { size = 11, className = '', color = null, style = '' } = {}) {
  const content = ICONS[name];
  const sizeStyle = `width:${size}px;height:${size}px;flex-shrink:0;`;
  const colorStyle = color ? `color:${color};` : '';
  const combinedStyle = `style="${sizeStyle}${colorStyle}${style}"`;

  if (!content) {
    // Fallback gracioso com um losango sutil
    return `<svg class="game-icon ${className}" viewBox="0 0 24 24" width="${size}" height="${size}" ${combinedStyle}><polygon points="12,4 20,12 12,20 4,12" fill="currentColor"/></svg>`;
  }

  return `<svg class="game-icon ${className}" viewBox="0 0 24 24" width="${size}" height="${size}" ${combinedStyle}>${content.trim()}</svg>`;
}

/**
 * Mapeamento direto de Armas do Jogador para seus Ícones Vetoriais Oficiais
 */
export const WEAPON_ICONS = {
  SWORD: 'sword',
  STAFF: 'staff',
  POTION: 'potion',
  HAMMER: 'hammer',
  AXE: 'axe',
  ORBITALS: 'orbitals',
  AURA: 'aura'
};

/**
 * Mapeamento direto de Passivas do Jogador para seus Ícones Vetoriais Oficiais
 */
export const PASSIVE_ICONS = {
  dmg: 'damage',
  armor: 'armor',
  wings: 'wings',
  frost_passive: 'frost',
  haste: 'cooldown',
  crit: 'crit',
  magnet: 'magnet',
  heal: 'heal'
};
