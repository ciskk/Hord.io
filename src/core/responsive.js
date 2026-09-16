/**
 * src/core/responsive.js
 * 
 * Gerenciador Universal de Responsividade, Orientação e Dimensões de Viewport.
 * Fornece métricas em tempo real, gerencia safe areas, estabiliza eventos de rotação
 * (anti-jank em iOS Safari / Android) e notifica o Canvas e os subsistemas de UI.
 */

export const layoutMetrics = {
  viewW: typeof window !== 'undefined' ? window.innerWidth : 1280,
  viewH: typeof window !== 'undefined' ? window.innerHeight : 720,
  dpr: 1,
  aspectRatio: 16 / 9,
  isPortrait: false,
  isLandscape: true,
  isCompactHeight: false, // true em celulares no modo paisagem (altura < 520px)
  isCompactWidth: false,  // true em celulares no modo retrato (largura < 600px)
  isUltraTall: false,     // true em proporções 19.5:9, 20:9 verticais (aspectRatio < 0.53)
  hudBottom: 110,         // Limite inferior medido do HUD (em pixels de tela)
  safeAreaTop: 0,
  safeAreaBottom: 0,
  safeAreaLeft: 0,
  safeAreaRight: 0
};

const layoutListeners = new Set();
let resizeTimeoutIds = [];

/**
 * Inscreve um ouvinte para mudanças de layout e orientação.
 * @param {Function} callback Recebe as layoutMetrics atualizadas.
 * @returns {Function} Função para desinscrever.
 */
export function onLayoutChange(callback) {
  layoutListeners.add(callback);
  return () => layoutListeners.delete(callback);
}

/**
 * Mede com precisão a posição inferior real do HUD DOM na tela.
 * Garante que banners no Canvas nunca sobreponham elementos do HUD.
 */
export function updateHudBottomMetric() {
  if (typeof document === 'undefined') return 110;

  const hudElem = document.getElementById('hud');
  let maxBottom = 0;

  if (hudElem) {
    const rect = hudElem.getBoundingClientRect();
    if (rect && rect.bottom > 0) {
      maxBottom = Math.max(maxBottom, rect.bottom);
    }
  }

  // Verifica se o HUD de chefe está ativo e expandindo a altura
  const bossHud = document.getElementById('boss-hud');
  if (bossHud && window.getComputedStyle(bossHud).display !== 'none') {
    const bRect = bossHud.getBoundingClientRect();
    if (bRect && bRect.bottom > 0) {
      maxBottom = Math.max(maxBottom, bRect.bottom);
    }
  }

  // Fallback seguro caso o HUD ainda não tenha sido renderizado no DOM
  if (maxBottom <= 0) {
    maxBottom = layoutMetrics.isPortrait ? 130 : 65;
  }

  layoutMetrics.hudBottom = Math.round(maxBottom);
  return layoutMetrics.hudBottom;
}

/**
 * Retorna o limite inferior do HUD para ancoragem de elementos gráficos.
 */
export function getHudBottom() {
  return layoutMetrics.hudBottom || updateHudBottomMetric();
}

/**
 * Recalcula todas as métricas de tela e aplica classes de estado no DOM.
 */
export function updateLayoutMetrics() {
  if (typeof window === 'undefined') return layoutMetrics;

  const w = window.visualViewport ? Math.round(window.visualViewport.width) : window.innerWidth;
  const h = window.visualViewport ? Math.round(window.visualViewport.height) : window.innerHeight;

  layoutMetrics.viewW = Math.max(280, w);
  layoutMetrics.viewH = Math.max(280, h);
  layoutMetrics.dpr = Math.min(window.devicePixelRatio || 1, 2.0);
  layoutMetrics.aspectRatio = layoutMetrics.viewW / layoutMetrics.viewH;

  layoutMetrics.isPortrait = layoutMetrics.viewH > layoutMetrics.viewW;
  layoutMetrics.isLandscape = !layoutMetrics.isPortrait;
  layoutMetrics.isCompactHeight = layoutMetrics.viewH < 520;
  layoutMetrics.isCompactWidth = layoutMetrics.viewW < 600;
  layoutMetrics.isUltraTall = layoutMetrics.isPortrait && (layoutMetrics.aspectRatio <= 0.54);

  // Atualiza classes semânticas no elemento raiz do documento
  if (typeof document !== 'undefined' && document.documentElement) {
    const root = document.documentElement;
    root.classList.toggle('layout-portrait', layoutMetrics.isPortrait);
    root.classList.toggle('layout-landscape', layoutMetrics.isLandscape);
    root.classList.toggle('compact-height', layoutMetrics.isCompactHeight);
    root.classList.toggle('compact-width', layoutMetrics.isCompactWidth);
    root.classList.toggle('screen-ultratall', layoutMetrics.isUltraTall);
  }

  updateHudBottomMetric();

  // Notifica todos os ouvintes inscritos
  layoutListeners.forEach(fn => {
    try {
      fn(layoutMetrics);
    } catch (e) {
      console.warn('Erro ao executar ouvinte de layout:', e);
    }
  });

  return layoutMetrics;
}

/**
 * Tratamento robusto para eventos de orientação (iOS Safari / Android WebKit).
 * Dispara verificações em cascata para cobrir a animação do sistema operacional.
 */
function handleOrientationChange() {
  // Cancela temporizadores pendentes
  resizeTimeoutIds.forEach(id => clearTimeout(id));
  resizeTimeoutIds = [];

  // 1. Atualização imediata
  updateLayoutMetrics();

  // 2. Cascata com intervalos estratégicos
  const delays = [50, 150, 300, 500];
  delays.forEach(ms => {
    const id = setTimeout(() => {
      updateLayoutMetrics();
    }, ms);
    resizeTimeoutIds.push(id);
  });
}

/**
 * Inicializador do sistema de responsividade.
 */
export function initResponsive(onResizeCallback) {
  if (typeof window === 'undefined') return;

  if (onResizeCallback) {
    onLayoutChange(onResizeCallback);
  }

  // Executa medição inicial
  updateLayoutMetrics();

  window.addEventListener('resize', () => {
    updateLayoutMetrics();
  }, { passive: true });

  window.addEventListener('orientationchange', handleOrientationChange, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      updateLayoutMetrics();
    }, { passive: true });
  }

  // Medição tardia para garantir pós-carregamento do DOM
  setTimeout(updateLayoutMetrics, 100);
}
