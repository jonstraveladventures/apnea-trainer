import { useRef, useCallback, useEffect } from 'react';
import { AudioCueType, AudioPreferences, AudioSound } from '../types';

/** Default audio preferences — countdown enabled (mp3 voice), others enabled with good defaults */
export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  countdown: { enabled: true, sound: 'singing-bowl' },
  phaseStart: { enabled: true, sound: 'double-chime-up' },
  phaseEnd: { enabled: true, sound: 'singing-bowl' },
  sessionComplete: { enabled: true, sound: 'completion-fanfare' },
};

/** Human-readable labels for each sound */
export const SOUND_LABELS: Record<AudioSound, string> = {
  'singing-bowl': 'Singing Bowl',
  'double-chime-up': 'Rising Chime',
  'double-chime-down': 'Falling Chime',
  'gentle-bell': 'Gentle Bell',
  'completion-fanfare': 'Completion Fanfare',
  'soft-pulse': 'Soft Pulse',
  'none': 'None',
};

export interface UseAudioCuesReturn {
  playCue: (cueType: AudioCueType) => void;
  playSound: (sound: AudioSound) => void;
}

// ---- Synthesis helpers ----

/** Create a gain node with an ADSR-like envelope */
function makeEnvelope(
  ctx: AudioContext,
  attack: number,
  peak: number,
  decay: number,
  sustain: number,
  release: number,
): GainNode {
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.001), now + attack + decay);
  gain.gain.setValueAtTime(Math.max(sustain, 0.001), now + attack + decay + release * 0.8);
  gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay + release);
  return gain;
}

/** Play a single oscillator with given params, connecting through optional extra nodes */
function playOsc(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  startOffset: number,
  duration: number,
  gainNode: GainNode,
  destination: AudioNode,
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
  osc.connect(gainNode);
  gainNode.connect(destination);
  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + duration);
}

/**
 * Singing bowl — layered harmonics with long natural decay.
 * Mimics a Tibetan singing bowl struck once.
 */
function playSingingBowl(ctx: AudioContext) {
  const dest = ctx.destination;
  const now = ctx.currentTime;

  // Fundamental + harmonics at decreasing volumes
  const partials = [
    { freq: 220, gain: 0.25, decay: 2.5 },  // fundamental (A3)
    { freq: 440, gain: 0.15, decay: 2.0 },  // octave
    { freq: 660, gain: 0.08, decay: 1.5 },  // fifth above octave
    { freq: 880, gain: 0.04, decay: 1.2 },  // 2nd octave
    { freq: 1320, gain: 0.02, decay: 0.8 }, // shimmer
  ];

  for (const p of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(p.freq, now);
    // Slight detuning for warmth
    osc.detune.setValueAtTime(Math.random() * 4 - 2, now);

    gain.gain.setValueAtTime(p.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + p.decay);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + p.decay + 0.05);
  }
}

/**
 * Double chime — two notes played in sequence.
 * Ascending (up) for phase start, descending (down) for phase end.
 */
function playDoubleChime(ctx: AudioContext, ascending: boolean) {
  const dest = ctx.destination;
  const notes = ascending
    ? [523.25, 659.25]  // C5 → E5 (major third up — hopeful, beginning)
    : [659.25, 523.25]; // E5 → C5 (major third down — resolved, complete)

  for (let i = 0; i < notes.length; i++) {
    const startTime = i * 0.18;

    // Main tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(notes[i], ctx.currentTime + startTime);

    const now = ctx.currentTime + startTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.65);

    // Soft harmonic overlay
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(notes[i] * 2, ctx.currentTime + startTime);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc2.connect(gain2);
    gain2.connect(dest);
    osc2.start(now);
    osc2.stop(now + 0.45);
  }
}

/**
 * Gentle bell — single bell-like tone with a soft attack and warm decay.
 * Good for subtle notifications.
 */
function playGentleBell(ctx: AudioContext) {
  const dest = ctx.destination;
  const now = ctx.currentTime;

  // Bell fundamental
  const freq = 587.33; // D5
  const partials = [
    { ratio: 1.0, gain: 0.2, decay: 1.2 },
    { ratio: 2.0, gain: 0.1, decay: 0.8 },
    { ratio: 3.0, gain: 0.04, decay: 0.5 },
    { ratio: 4.2, gain: 0.02, decay: 0.3 }, // inharmonic partial (bell-like)
  ];

  for (const p of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * p.ratio, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(p.gain, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + p.decay);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + p.decay + 0.05);
  }
}

/**
 * Completion fanfare — ascending 4-note arpeggio (C-E-G-C).
 * Celebratory but calm, appropriate for finishing a session.
 */
function playCompletionFanfare(ctx: AudioContext) {
  const dest = ctx.destination;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const spacing = 0.15;

  for (let i = 0; i < notes.length; i++) {
    const startTime = i * spacing;
    const isLast = i === notes.length - 1;
    const decay = isLast ? 1.8 : 0.5; // Last note rings longer

    // Main tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(notes[i], ctx.currentTime + startTime);

    const now = ctx.currentTime + startTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(isLast ? 0.25 : 0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + decay + 0.05);

    // Octave shimmer on each note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(notes[i] * 2, ctx.currentTime + startTime);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.05, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + decay * 0.6);

    osc2.connect(gain2);
    gain2.connect(dest);
    osc2.start(now);
    osc2.stop(now + decay * 0.65);
  }
}

/**
 * Soft pulse — a low, gentle throb. Good for subtle awareness cues.
 * Uses a filtered low-frequency tone with slow attack.
 */
function playSoftPulse(ctx: AudioContext) {
  const dest = ctx.destination;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(196, now); // G3 — warm, low

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.15);   // slow attack
  gain.gain.setValueAtTime(0.2, now + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 1.05);

  // Sub-harmonic for body
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(98, now); // G2

  subGain.gain.setValueAtTime(0, now);
  subGain.gain.linearRampToValueAtTime(0.1, now + 0.2);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  sub.connect(subGain);
  subGain.connect(dest);
  sub.start(now);
  sub.stop(now + 0.85);
}

// ---- Main hook ----

/**
 * Hook that generates rich audio cues using the Web Audio API.
 *
 * All sounds are synthesised with layered OscillatorNodes — no extra audio
 * assets needed. The countdown cue defaults to the mp3 voice countdown
 * when sound is set to 'singing-bowl' (the default).
 */
const useAudioCues = (preferences?: AudioPreferences): UseAudioCuesReturn => {
  const prefs = preferences ?? DEFAULT_AUDIO_PREFERENCES;

  // Lazy-init AudioContext (browsers require a user gesture first)
  const ctxRef = useRef<AudioContext | null>(null);
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Pre-load the countdown mp3
  useEffect(() => {
    countdownAudioRef.current = new Audio('/audio/countdown-5-4-3-2-1.mp3');
  }, []);

  /** Play a specific AudioSound */
  const playSound = useCallback(
    (sound: AudioSound) => {
      const ctx = getCtx();
      switch (sound) {
        case 'singing-bowl':
          playSingingBowl(ctx);
          break;
        case 'double-chime-up':
          playDoubleChime(ctx, true);
          break;
        case 'double-chime-down':
          playDoubleChime(ctx, false);
          break;
        case 'gentle-bell':
          playGentleBell(ctx);
          break;
        case 'completion-fanfare':
          playCompletionFanfare(ctx);
          break;
        case 'soft-pulse':
          playSoftPulse(ctx);
          break;
        case 'none':
        default:
          break;
      }
    },
    [getCtx],
  );

  /** Play the cue for a given cue type, respecting user preferences */
  const playCue = useCallback(
    (cueType: AudioCueType) => {
      const config = prefs[cueType];
      if (!config || !config.enabled) return;

      // Special case: countdown cue uses the mp3 voice countdown
      // (regardless of sound setting — the voice countdown is always best here)
      if (cueType === 'countdown') {
        if (countdownAudioRef.current) {
          countdownAudioRef.current.currentTime = 0;
          countdownAudioRef.current.play().catch((e) => console.log('Audio play failed:', e));
        }
        return;
      }

      playSound(config.sound);
    },
    [prefs, playSound],
  );

  return { playCue, playSound };
};

export default useAudioCues;
