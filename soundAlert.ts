// Web Audio API based Alert Sound Synthesizer for Institutional Trading Alerts

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API not supported or initialized:', e);
    return null;
  }
}

/**
 * Plays a bright, rising harmonic chime for Bullish AI Alpha signals
 */
export function playBullishAlertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6 Major Chime

  freqs.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + index * 0.08);

    gain.gain.setValueAtTime(0, now + index * 0.08);
    gain.gain.linearRampToValueAtTime(0.18, now + index * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * 0.08);
    osc.stop(now + index * 0.08 + 0.5);
  });
}

/**
 * Plays a focused, dual-tone chime for Bearish AI Alpha signals
 */
export function playBearishAlertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [880.0, 698.46, 587.33]; // A5, F5, D5

  freqs.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + index * 0.1);

    gain.gain.setValueAtTime(0, now + index * 0.1);
    gain.gain.linearRampToValueAtTime(0.15, now + index * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * 0.1);
    osc.stop(now + index * 0.1 + 0.45);
  });
}

/**
 * Test beep tone
 */
export function playTestBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.36);
}
