/**
 * src/core/audio.js
 * Motor de Áudio Procedural via Web Audio API e Feedback Háptico
 */
export let audioCtx = null;
let masterGainNode = null;
let currentVolume = 1.0;

// Escala musical pentatônica para coleta de gemas
let gemPitchStep = 0;
let lastGemTime = 0;
const gemScale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

// Cooldowns para throttling (impede saturação auditiva em eventos simultâneos)
const soundCooldowns = { hit: 0, shoot: 0, crit: 0, charge: 0, warp: 0 };

export function triggerHaptic(type) {
  try {
    if (navigator.vibrate) {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(20);
      else if (type === 'heavy') navigator.vibrate([25, 30, 25]);
    }
  } catch (e) {}
}

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGainNode = audioCtx.createGain();
    masterGainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
    masterGainNode.connect(audioCtx.destination);
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

export function playSfx(type) {
  if (!audioCtx || currentVolume <= 0) return;
  const now = performance.now();
  const t = audioCtx.currentTime;

  if (type === 'hit' && now - soundCooldowns.hit < 35) return;
  if (type === 'shoot' && now - soundCooldowns.shoot < 28) return;
  if (type === 'crit' && now - soundCooldowns.crit < 45) return;
  if (type === 'charge' && now - soundCooldowns.charge < 120) return;
  if (type === 'warp' && now - soundCooldowns.warp < 80) return;
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
      // Sub-grave expansivo da Singularidade Primordial
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
      // Glissando harmônico ascendente para telegrafia de feixes
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
      // Ruptura de matéria e destruição de âncora
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
      // Varredura de deslocamento dimensional
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
    }
  } catch (e) {}
}