/**
 * src/core/audio.js
 * Motor de Áudio Procedural via Web Audio API e Feedback Háptico
 * Integrado ao Design System Grim Cyber-Gothic
 */

export let audioCtx = null;
let masterGainNode = null;
let masterFilterNode = null;
let currentVolume = 1.0;

// Escala musical pentatônica para coleta fluida de gemas
let gemPitchStep = 0;
let lastGemTime = 0;
const gemScale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

// Throttling para impedir saturação acústica em momentos de alta densidade de combate
const soundCooldowns = { 
  hit: 0, 
  shoot: 0, 
  crit: 0, 
  charge: 0, 
  warp: 0,
  card_hover: 0,
  forcefield: 0,
  heal: 0,
  hammer_slam: 0,
  hammer_hit: 0,
  holy_charge: 0,
  retaliation_clang: 0,
  fire_cast: 0,
  fire_hit: 0,
  flame_dash: 0,
  blade_throw: 0,
  blade_hit: 0,
  smoke_bomb: 0,
  axe_cleave: 0,
  parry_slice: 0,
  barbarian_roar: 0,
  potion_throw: 0,
  potion_shatter: 0,
  acid_explosion: 0,
  tome_impact: 0,
  kill: 0,
  chest_rare: 0
};

// Gerador procedural de ruído para transientes, vento de lâmina, estilhaço vítreo e detonações
let noiseBuffer = null;
function getNoiseBuffer() {
  if (!audioCtx) return null;
  if (!noiseBuffer) {
    const bufferSize = Math.floor(audioCtx.sampleRate * 1.5);
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

function playProceduralNoise({ filterType = 'lowpass', filterFreq = 1000, rampFreq = null, startGain = 0.1, duration = 0.2, decay = 0.2, q = 1 }) {
  const buf = getNoiseBuffer();
  if (!buf || !audioCtx) return;
  const t = audioCtx.currentTime;
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const f = audioCtx.createBiquadFilter();
  f.type = filterType;
  f.frequency.setValueAtTime(filterFreq, t);
  if (q !== 1) f.Q.setValueAtTime(q, t);
  if (rampFreq) {
    f.frequency.exponentialRampToValueAtTime(Math.max(20, rampFreq), t + duration);
  }
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(startGain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(duration, decay));
  src.connect(f);
  f.connect(g);
  g.connect(masterGainNode);
  src.start(t);
  src.stop(t + duration);
}

export function triggerHaptic(type) {
  try {
    if (navigator.vibrate) {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(22);
      else if (type === 'heavy') navigator.vibrate([30, 40, 30]);
    }
  } catch (e) {}
}

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Roteamento Mestre: Canais Individuais -> masterGainNode -> masterFilterNode -> destination
    masterGainNode = audioCtx.createGain();
    masterGainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);

    masterFilterNode = audioCtx.createBiquadFilter();
    masterFilterNode.type = 'lowpass';
    masterFilterNode.frequency.setValueAtTime(22000, audioCtx.currentTime);

    masterGainNode.connect(masterFilterNode);
    masterFilterNode.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function setGameVolume(val) {
  currentVolume = parseFloat(val);
  const label = document.getElementById('volume-val');
  if (label) label.innerText = Math.round(currentVolume * 100) + '%';
  if (masterGainNode && audioCtx) {
    masterGainNode.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, 0.02);
  }
}

/**
 * Filtro de Necrose Auditiva (Game Over):
 * Corta agudos e médios bruscamente (low-pass a 180Hz) para simular asfixia sensorial e morte
 */
export function applyDeathAudioFilter() {
  if (!audioCtx || !masterFilterNode) return;
  const t = audioCtx.currentTime;
  masterFilterNode.frequency.cancelScheduledValues(t);
  masterFilterNode.frequency.setTargetAtTime(180, t, 0.12);
}

/**
 * Restauração do Espectro Auditivo:
 * Reabre a passagem de frequências ao renascer ou iniciar nova partida
 */
export function resetDeathAudioFilter() {
  if (!audioCtx || !masterFilterNode) return;
  const t = audioCtx.currentTime;
  masterFilterNode.frequency.cancelScheduledValues(t);
  masterFilterNode.frequency.setTargetAtTime(22000, t, 0.04);
}

export function playSfx(type) {
  if (!audioCtx || currentVolume <= 0) return;
  const now = performance.now();
  const t = audioCtx.currentTime;

  if (type === 'hit' && now - soundCooldowns.hit < 35) return;
  if (type === 'shoot' && now - soundCooldowns.shoot < 28) return;
  if (type === 'crit' && now - soundCooldowns.crit < 45) return;
  if (type === 'charge' && now - soundCooldowns.charge < 120) return;
  if (type === 'warp' && now - soundCooldowns.warp < 80) return;
  if (type === 'card_hover' && now - soundCooldowns.card_hover < 50) return;
  if (type === 'forcefield' && now - soundCooldowns.forcefield < 90) return;
  if (type === 'heal' && now - soundCooldowns.heal < 250) return;
  if (type === 'hammer_slam' && now - soundCooldowns.hammer_slam < 100) return;
  if (type === 'hammer_hit' && now - soundCooldowns.hammer_hit < 45) return;
  if (type === 'holy_charge' && now - soundCooldowns.holy_charge < 200) return;
  if (type === 'retaliation_clang' && now - soundCooldowns.retaliation_clang < 80) return;
  if (type === 'fire_cast' && now - soundCooldowns.fire_cast < 45) return;
  if (type === 'fire_hit' && now - soundCooldowns.fire_hit < 40) return;
  if (type === 'flame_dash' && now - soundCooldowns.flame_dash < 200) return;
  if (type === 'blade_throw' && now - soundCooldowns.blade_throw < 45) return;
  if (type === 'blade_hit' && now - soundCooldowns.blade_hit < 35) return;
  if (type === 'smoke_bomb' && now - soundCooldowns.smoke_bomb < 220) return;
  if (type === 'axe_cleave' && now - soundCooldowns.axe_cleave < 45) return;
  if (type === 'parry_slice' && now - soundCooldowns.parry_slice < 60) return;
  if (type === 'barbarian_roar' && now - soundCooldowns.barbarian_roar < 300) return;
  if (type === 'potion_throw' && now - soundCooldowns.potion_throw < 60) return;
  if (type === 'potion_shatter' && now - soundCooldowns.potion_shatter < 50) return;
  if (type === 'acid_explosion' && now - soundCooldowns.acid_explosion < 220) return;
  if (type === 'tome_impact' && now - soundCooldowns.tome_impact < 90) return;
  if (type === 'kill' && now - soundCooldowns.kill < 85) return;
  if (type === 'chest_rare' && now - soundCooldowns.chest_rare < 150) return;

  if (soundCooldowns[type] !== undefined) soundCooldowns[type] = now;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, t);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(masterGainNode);

    const pitchJitter = 0.93 + Math.random() * 0.14;

    if (type === 'shoot') {
      filter.frequency.setValueAtTime(1800, t);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.07);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.start(t);
      osc.stop(t + 0.07);
    } else if (type === 'hit') {
      filter.frequency.setValueAtTime(750, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(115 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.055);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.10, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      osc.start(t);
      osc.stop(t + 0.055);
    } else if (type === 'crit') {
      filter.frequency.setValueAtTime(2800, t);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(987.77, t + 0.04);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.start(t);
      osc.stop(t + 0.11);
      triggerHaptic('light');
    } else if (type === 'gem') {
      if (now - lastGemTime > 750) gemPitchStep = 0;
      lastGemTime = now;
      const baseFreq = gemScale[gemPitchStep % gemScale.length];
      gemPitchStep++;

      filter.frequency.setValueAtTime(3200, t);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.12, t + 0.06);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
      osc.start(t);
      osc.stop(t + 0.065);
    } else if (type === 'level') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        const f = audioCtx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 2200;
        o.connect(g);
        g.connect(f);
        f.connect(masterGainNode);
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t + idx * 0.05);
        g.gain.linearRampToValueAtTime(0.07, t + idx * 0.05 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.18);
        o.start(t + idx * 0.05);
        o.stop(t + idx * 0.05 + 0.18);
      });
      triggerHaptic('medium');
    } else if (type === 'boss') {
      filter.frequency.setValueAtTime(420, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.5);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.20, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
      triggerHaptic('heavy');
    } else if (type === 'evolution') {
      [440, 554.37, 659.25, 880, 1108.7].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(masterGainNode);
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t + idx * 0.07);
        g.gain.linearRampToValueAtTime(0.08, t + idx * 0.07 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.22);
        o.start(t + idx * 0.07);
        o.stop(t + idx * 0.07 + 0.22);
      });
      triggerHaptic('heavy');
    } else if (type === 'victory') {
      [440, 554.37, 659.25, 880, 1108.7].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(masterGainNode);
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t + idx * 0.11);
        g.gain.linearRampToValueAtTime(0.11, t + idx * 0.11 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.11 + 0.32);
        o.start(t + idx * 0.11);
        o.stop(t + idx * 0.11 + 0.32);
      });
    } else if (type === 'acid') {
      filter.frequency.setValueAtTime(900, t);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(170 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.11);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.start(t);
      osc.stop(t + 0.11);
    } else if (type === 'chest') {
      [587.33, 880].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(masterGainNode);
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t + idx * 0.08);
        g.gain.linearRampToValueAtTime(0.1, t + idx * 0.08 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);
        o.start(t + idx * 0.08);
        o.stop(t + idx * 0.08 + 0.25);
      });
    } else if (type === 'freeze') {
      [987.77, 1318.5].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(masterGainNode);
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t + idx * 0.06);
        g.gain.linearRampToValueAtTime(0.08, t + idx * 0.06 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.18);
        o.start(t + idx * 0.06);
        o.stop(t + idx * 0.06 + 0.18);
      });
    } else if (type === 'singularity') {
      filter.frequency.setValueAtTime(220, t);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(24, t + 0.65);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc.start(t);
      osc.stop(t + 0.65);
      triggerHaptic('heavy');
    } else if (type === 'charge') {
      filter.frequency.setValueAtTime(3200, t);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(920 * pitchJitter, t + 0.32);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.start(t);
      osc.stop(t + 0.32);
      triggerHaptic('medium');
    } else if (type === 'shatter') {
      filter.frequency.setValueAtTime(1400, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(36, t + 0.38);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.start(t);
      osc.stop(t + 0.38);

      const ringOsc = audioCtx.createOscillator();
      const ringGain = audioCtx.createGain();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(880, t);
      ringOsc.frequency.exponentialRampToValueAtTime(440, t + 0.3);
      ringGain.gain.setValueAtTime(0.08, t);
      ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      ringOsc.connect(ringGain);
      ringGain.connect(masterGainNode);
      ringOsc.start(t);
      ringOsc.stop(t + 0.3);
      triggerHaptic('heavy');
    } else if (type === 'warp') {
      filter.frequency.setValueAtTime(1800, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(85, t + 0.16);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.start(t);
      osc.stop(t + 0.16);
      triggerHaptic('medium');
    } else if (type === 'forcefield') {
      filter.frequency.setValueAtTime(1400, t);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(360, t + 0.12);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
      triggerHaptic('light');
    } else if (type === 'heal') {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(masterGainNode);
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t + idx * 0.04);
        g.gain.linearRampToValueAtTime(0.05, t + idx * 0.04 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.16);
        o.start(t + idx * 0.04);
        o.stop(t + idx * 0.04 + 0.16);
      });
      triggerHaptic('light');
    } 
    
    // --- Novos Efeitos da Identidade Visual Grim Cyber-Gothic ---

    else if (type === 'death_heartbeat') {
      // Batimento duplo visceral em sub-grave (60Hz descendo para 25Hz)
      [0, 0.26].forEach((offset, idx) => {
        const hOsc = audioCtx.createOscillator();
        const hGain = audioCtx.createGain();
        const hFilter = audioCtx.createBiquadFilter();

        hFilter.type = 'lowpass';
        hFilter.frequency.value = 160;

        hOsc.connect(hGain);
        hGain.connect(hFilter);
        hFilter.connect(masterGainNode);

        hOsc.type = 'sine';
        const startT = t + offset;
        hOsc.frequency.setValueAtTime(62, startT);
        hOsc.frequency.exponentialRampToValueAtTime(26, startT + 0.16);

        hGain.gain.setValueAtTime(0.001, startT);
        hGain.gain.linearRampToValueAtTime(idx === 0 ? 0.38 : 0.26, startT + 0.02);
        hGain.gain.exponentialRampToValueAtTime(0.001, startT + 0.22);

        hOsc.start(startT);
        hOsc.stop(startT + 0.22);
      });
      triggerHaptic('heavy');
    } else if (type === 'tombstone_slam') {
      // Impacto telúrico de pedra contra ferro negro na tela de morte
      filter.frequency.setValueAtTime(320, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.45);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.32, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.45);
      triggerHaptic('heavy');
    } else if (type === 'card_hover') {
      // Pequeno estalo rúnico ao sobrevoar cartas de tarô
      filter.frequency.setValueAtTime(1400, t);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, t);
      osc.frequency.exponentialRampToValueAtTime(350, t + 0.025);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.035, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      osc.start(t);
      osc.stop(t + 0.025);
    } else if (type === 'card_select') {
      // Ressonância mística de selamento ao escolher uma evolução
      [440, 880, 1320].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(masterGainNode);
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t + idx * 0.02);
        g.gain.linearRampToValueAtTime(0.08, t + idx * 0.02 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.02 + 0.28);
        o.start(t + idx * 0.02);
        o.stop(t + idx * 0.02 + 0.28);
      });
      triggerHaptic('medium');
    } else if (type === 'chest_fanfare') {
      // Arpejo cintilante de abertura do baú de chefe
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(masterGainNode);
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t + idx * 0.05);
        g.gain.linearRampToValueAtTime(0.09, t + idx * 0.05 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.35);
        o.start(t + idx * 0.05);
        o.stop(t + idx * 0.05 + 0.35);
      });
      triggerHaptic('heavy');
    }

    // =========================================================================
    // NOVOS EFEITOS SONOROS DE ARMAS, ATAQUES, HABILIDADES E IMPACTOS
    // =========================================================================

    else if (type === 'hammer_slam') {
      // Pancada física pesada e surda de martelo esmagando o solo (Impacto telúrico realista)
      // 1. Onda de pressão de sub-grave amortecida (chest thump natural, sem sino nem tom artificial)
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      const subFilter = audioCtx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(140, t);
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(85 * pitchJitter, t);
      subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.18);
      subGain.gain.setValueAtTime(0.001, t);
      subGain.gain.linearRampToValueAtTime(0.30, t + 0.005);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      subOsc.connect(subGain);
      subGain.connect(subFilter);
      subFilter.connect(masterGainNode);
      subOsc.start(t);
      subOsc.stop(t + 0.18);

      // 2. Ruído de solo e pedrisco triturado (crunch de terra compactada)
      playProceduralNoise({
        filterType: 'lowpass',
        filterFreq: 380,
        rampFreq: 75,
        startGain: 0.22,
        duration: 0.16,
        decay: 0.16
      });

      // 3. Estalo acústico curto de impacto maciço (sem ressonância tonal)
      filter.frequency.setValueAtTime(450, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.04);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.start(t);
      osc.stop(t + 0.04);

      triggerHaptic('heavy');
    } else if (type === 'hammer_hit') {
      // Esmagamento contundente e surdo contra monstro
      filter.frequency.setValueAtTime(500, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.05);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.20, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);

      playProceduralNoise({
        filterType: 'lowpass',
        filterFreq: 550,
        startGain: 0.16,
        duration: 0.045,
        decay: 0.045
      });
    } else if (type === 'holy_charge') {
      // Arrancada pesada de cavaleiro blindado: deslocamento de ar e placas de aço
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(75, t);
      subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.28);
      subGain.gain.setValueAtTime(0.001, t);
      subGain.gain.linearRampToValueAtTime(0.22, t + 0.01);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      subOsc.connect(subGain);
      subGain.connect(masterGainNode);
      subOsc.start(t);
      subOsc.stop(t + 0.28);

      playProceduralNoise({
        filterType: 'bandpass',
        filterFreq: 600,
        rampFreq: 1400,
        startGain: 0.18,
        duration: 0.24,
        decay: 0.24,
        q: 1.5
      });

      playProceduralNoise({
        filterType: 'highpass',
        filterFreq: 2400,
        startGain: 0.08,
        duration: 0.06,
        decay: 0.06
      });

      triggerHaptic('heavy');
    } else if (type === 'retaliation_clang') {
      // Bloqueio metálico seco e realista de escudo refletindo golpe
      playProceduralNoise({
        filterType: 'highpass',
        filterFreq: 2800,
        startGain: 0.14,
        duration: 0.035,
        decay: 0.035
      });
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(1400 * pitchJitter, t);
      o.frequency.exponentialRampToValueAtTime(600, t + 0.06);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      o.connect(g);
      g.connect(masterGainNode);
      o.start(t);
      o.stop(t + 0.06);
      triggerHaptic('medium');
    } else if (type === 'fire_cast') {
      // Sopro térmico de fogo saindo do cajado ("foooosh" de labareda natural)
      playProceduralNoise({
        filterType: 'bandpass',
        filterFreq: 850 * pitchJitter,
        rampFreq: 1450,
        startGain: 0.13,
        duration: 0.09,
        decay: 0.09,
        q: 1.4
      });
    } else if (type === 'fire_hit') {
      // Combustão suave e abafada ("fwhump")
      playProceduralNoise({
        filterType: 'lowpass',
        filterFreq: 800,
        rampFreq: 300,
        startGain: 0.14,
        duration: 0.08,
        decay: 0.08
      });
      filter.frequency.setValueAtTime(220, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.start(t);
      osc.stop(t + 0.06);
    } else if (type === 'flame_dash') {
      // Erupção de chamas no dash
      playProceduralNoise({
        filterType: 'bandpass',
        filterFreq: 650,
        rampFreq: 1800,
        startGain: 0.22,
        duration: 0.25,
        decay: 0.25,
        q: 1.6
      });
      const boomOsc = audioCtx.createOscillator();
      const boomGain = audioCtx.createGain();
      boomOsc.type = 'sine';
      boomOsc.frequency.setValueAtTime(65, t);
      boomOsc.frequency.exponentialRampToValueAtTime(25, t + 0.28);
      boomGain.gain.setValueAtTime(0.001, t);
      boomGain.gain.linearRampToValueAtTime(0.24, t + 0.01);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      boomOsc.connect(boomGain);
      boomGain.connect(masterGainNode);
      boomOsc.start(t);
      boomOsc.stop(t + 0.28);
      triggerHaptic('heavy');
    } else if (type === 'blade_throw') {
      // Zunido aerodinâmico realista de adaga cortando o ar ("whoosh/swish")
      playProceduralNoise({
        filterType: 'bandpass',
        filterFreq: 2800 * pitchJitter,
        rampFreq: 1200,
        startGain: 0.11,
        duration: 0.065,
        decay: 0.065,
        q: 2.8
      });
    } else if (type === 'blade_hit') {
      // Som de corte visceral e realista de lâmina afiada
      // 1. Atrito rápido de corte de lâmina
      playProceduralNoise({
        filterType: 'highpass',
        filterFreq: 3200,
        rampFreq: 1400,
        startGain: 0.16,
        duration: 0.045,
        decay: 0.045,
        q: 2.2
      });
      // 2. Transiente breve de penetração/corte ("shhk")
      playProceduralNoise({
        filterType: 'bandpass',
        filterFreq: 2200,
        rampFreq: 800,
        startGain: 0.14,
        duration: 0.05,
        decay: 0.05,
        q: 1.8
      });
      // 3. Impacto físico amortecido de corpo (sem tom sintético)
      filter.frequency.setValueAtTime(180, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.035);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      osc.start(t);
      osc.stop(t + 0.035);
    } else if (type === 'smoke_bomb') {
      // Estouro abafado e expansão de fumaça densa
      playProceduralNoise({
        filterType: 'lowpass',
        filterFreq: 550,
        rampFreq: 160,
        startGain: 0.18,
        duration: 0.28,
        decay: 0.28
      });
      const poofOsc = audioCtx.createOscillator();
      const poofGain = audioCtx.createGain();
      poofOsc.type = 'sine';
      poofOsc.frequency.setValueAtTime(80, t);
      poofOsc.frequency.exponentialRampToValueAtTime(26, t + 0.22);
      poofGain.gain.setValueAtTime(0.001, t);
      poofGain.gain.linearRampToValueAtTime(0.18, t + 0.005);
      poofGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      poofOsc.connect(poofGain);
      poofGain.connect(masterGainNode);
      poofOsc.start(t);
      poofOsc.stop(t + 0.22);
      triggerHaptic('medium');
    } else if (type === 'axe_cleave') {
      // Golpe pesado de machado cravando na horda (corte contundente realista)
      playProceduralNoise({
        filterType: 'bandpass',
        filterFreq: 1500,
        rampFreq: 600,
        startGain: 0.16,
        duration: 0.045,
        decay: 0.045,
        q: 1.8
      });
      filter.frequency.setValueAtTime(320, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.05);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'parry_slice') {
      // Aparo metálico rápido de lâmina ("clink" curto e orgânico)
      playProceduralNoise({
        filterType: 'highpass',
        filterFreq: 3200,
        startGain: 0.10,
        duration: 0.035,
        decay: 0.035
      });
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1600 * pitchJitter, t);
      o.frequency.exponentialRampToValueAtTime(800, t + 0.045);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.10, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      o.connect(g);
      g.connect(masterGainNode);
      o.start(t);
      o.stop(t + 0.045);
    } else if (type === 'barbarian_roar') {
      // Rugido gutural acústico realista (formante vocal de fúria e onda de choque)
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(65, t);
      subOsc.frequency.exponentialRampToValueAtTime(24, t + 0.42);
      subGain.gain.setValueAtTime(0.001, t);
      subGain.gain.linearRampToValueAtTime(0.26, t + 0.02);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      subOsc.connect(subGain);
      subGain.connect(masterGainNode);
      subOsc.start(t);
      subOsc.stop(t + 0.42);

      playProceduralNoise({
        filterType: 'bandpass',
        filterFreq: 320,
        rampFreq: 650,
        startGain: 0.24,
        duration: 0.42,
        decay: 0.42,
        q: 2.0
      });
      triggerHaptic('heavy');
    } else if (type === 'potion_throw') {
      // Deslocamento de ar sutil do frasco
      playProceduralNoise({
        filterType: 'bandpass',
        filterFreq: 1100 * pitchJitter,
        rampFreq: 600,
        startGain: 0.07,
        duration: 0.07,
        decay: 0.07,
        q: 1.5
      });
    } else if (type === 'potion_shatter') {
      // Estilhaço vítreo autêntico seguido de respingo cáustico
      playProceduralNoise({
        filterType: 'highpass',
        filterFreq: 3200,
        startGain: 0.16,
        duration: 0.04,
        decay: 0.04
      });
      playProceduralNoise({
        filterType: 'bandpass',
        filterFreq: 1400,
        startGain: 0.12,
        duration: 0.08,
        decay: 0.08,
        q: 1.6
      });
    } else if (type === 'acid_explosion') {
      // Detonação química múltipla
      playProceduralNoise({
        filterType: 'bandpass',
        filterFreq: 700,
        rampFreq: 220,
        startGain: 0.22,
        duration: 0.28,
        decay: 0.28,
        q: 1.4
      });
      const expOsc = audioCtx.createOscillator();
      const expGain = audioCtx.createGain();
      expOsc.type = 'sine';
      expOsc.frequency.setValueAtTime(90, t);
      expOsc.frequency.exponentialRampToValueAtTime(28, t + 0.25);
      expGain.gain.setValueAtTime(0.001, t);
      expGain.gain.linearRampToValueAtTime(0.20, t + 0.008);
      expGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      expOsc.connect(expGain);
      expGain.connect(masterGainNode);
      expOsc.start(t);
      expOsc.stop(t + 0.25);
      triggerHaptic('medium');
    } else if (type === 'tome_impact') {
      // Impacto macio e amortecido de tomo/livro (sem sino sonoro)
      filter.frequency.setValueAtTime(380, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.04);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.10, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.start(t);
      osc.stop(t + 0.04);
    } else if (type === 'kill') {
      // Abate suave e discreto (apenas feedback acústico leve, não cansativo)
      filter.frequency.setValueAtTime(320, t);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75 * pitchJitter, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.04);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.start(t);
      osc.stop(t + 0.04);
    } else if (type === 'chest_rare') {
      // Baú Raro / Super Ímã
      [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t + idx * 0.06);
        g.gain.linearRampToValueAtTime(0.10, t + idx * 0.06 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.28);
        o.connect(g);
        g.connect(masterGainNode);
        o.start(t + idx * 0.06);
        o.stop(t + idx * 0.06 + 0.28);
      });
      triggerHaptic('medium');
    }
  } catch (e) {}
}