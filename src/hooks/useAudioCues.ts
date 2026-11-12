import { useRef, useCallback, useEffect } from 'react';
import { AudioCueType, AudioPreferences, AudioSound } from '../types';
import * as logger from '../utils/logger';
import { useSpeech } from './useSpeech';
import { cueSentence, CueContext } from '../audio/voiceLines';
import voiceManifest from '../audio/voiceManifest.json';

export type { CueContext };

/** Recordings made by scripts/make_voice.py: sentence -> file in public/voice/. */
const VOICE_FILES: Record<string, string> = (voiceManifest as { sentences: Record<string, string> }).sentences;
const COUNTDOWN_FILE: string = (voiceManifest as { countdown: string }).countdown;
const voiceUrl = (file: string): string => `${process.env.PUBLIC_URL}/voice/${file}`;

/** Recorded file for a sentence, if there is one. */
export const recordingFor = (sentence: string): string | undefined => VOICE_FILES[sentence];

/** Most clips waiting to play; older ones are dropped so speech never falls behind the session. */
const MAX_QUEUED = 3;

/** Default audio preferences — voice cues for the spoken bits, chimes for phase boundaries. */
export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  countdown: { enabled: true, sound: 'voice' },
  phaseStart: { enabled: true, sound: 'voice' },
  phaseEnd: { enabled: true, sound: 'singing-bowl' },
  sessionComplete: { enabled: true, sound: 'voice' },
  minuteMark: { enabled: true, sound: 'voice' },
};

/** Human-readable labels for each sound */
export const SOUND_LABELS: Record<AudioSound, string> = {
  'singing-bowl': 'Singing Bowl',
  'double-chime-up': 'Rising Chime',
  'double-chime-down': 'Falling Chime',
  'gentle-bell': 'Gentle Bell',
  'completion-fanfare': 'Completion Fanfare',
  'soft-pulse': 'Soft Pulse',
  'voice': 'Voice',
  'none': 'None',
};

export interface UseAudioCuesReturn {
  playCue: (cueType: AudioCueType, context?: CueContext) => void;
  /** `volume` is 0-1; defaults to 1 (full). */
  playSound: (sound: AudioSound, volume?: number) => void;
  /** Say a sentence: its recording if there is one, otherwise the browser's voice. */
  speak: (text: string, volume?: number) => void;
}

/** Clamp + default audio volume into the 0-1 range. */
const normalizeVolume = (v: number | undefined): number => {
  if (v === undefined || Number.isNaN(v)) return 1;
  return Math.max(0, Math.min(1, v));
};

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
function playSingingBowl(ctx: AudioContext, dest: AudioNode) {
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
function playDoubleChime(ctx: AudioContext, dest: AudioNode, ascending: boolean) {
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
function playGentleBell(ctx: AudioContext, dest: AudioNode) {
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
function playCompletionFanfare(ctx: AudioContext, dest: AudioNode) {
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
function playSoftPulse(ctx: AudioContext, dest: AudioNode) {
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
 * Hook that plays the audio cues.
 *
 * Spoken cues play recordings made with Kokoro (public/voice/, listed in
 * src/audio/voiceManifest.json), queued so one never cuts off another. A
 * sentence with no recording, such as a custom session's own phase name, is
 * spoken by the browser's voice instead. Chimes are synthesised with the Web
 * Audio API.
 */
const useAudioCues = (preferences?: AudioPreferences): UseAudioCuesReturn => {
  const prefs = preferences ?? DEFAULT_AUDIO_PREFERENCES;
  const { speak: speakRaw } = useSpeech();

  // Lazy-init AudioContext (browsers require a user gesture first)
  const ctxRef = useRef<AudioContext | null>(null);
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<{ src: string; volume: number }[]>([]);
  const currentRef = useRef<HTMLAudioElement | null>(null);

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Load the countdown ahead of time so it starts exactly on its second.
  useEffect(() => {
    countdownAudioRef.current = new Audio(voiceUrl(COUNTDOWN_FILE));
    countdownAudioRef.current.preload = 'auto';
    return () => {
      queueRef.current = [];
      currentRef.current?.pause();
    };
  }, []);

  /** Play the next queued clip, if any. */
  const playNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      currentRef.current = null;
      return;
    }
    const audio = new Audio(next.src);
    audio.volume = next.volume;
    currentRef.current = audio;
    const done = () => {
      if (currentRef.current === audio) playNext();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch((e) => {
      logger.log('Voice clip failed to play:', e);
      done();
    });
  }, []);

  /** Say a sentence: its recording if there is one, otherwise the browser's voice. */
  const speak = useCallback(
    (text: string, volume?: number) => {
      if (!text) return;
      const file = VOICE_FILES[text];
      if (!file) {
        speakRaw(text, { voiceName: prefs.voiceName, volume: normalizeVolume(volume) });
        return;
      }
      queueRef.current.push({ src: voiceUrl(file), volume: normalizeVolume(volume) });
      while (queueRef.current.length > MAX_QUEUED) queueRef.current.shift();
      if (!currentRef.current) playNext();
    },
    [prefs.voiceName, speakRaw, playNext],
  );

  /** Play a specific AudioSound, optionally at a reduced volume (0-1). */
  const playSound = useCallback(
    (sound: AudioSound, volume?: number) => {
      if (sound === 'none') return;
      const ctx = getCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(normalizeVolume(volume), ctx.currentTime);
      masterGain.connect(ctx.destination);

      switch (sound) {
        case 'singing-bowl':
          playSingingBowl(ctx, masterGain);
          break;
        case 'double-chime-up':
          playDoubleChime(ctx, masterGain, true);
          break;
        case 'double-chime-down':
          playDoubleChime(ctx, masterGain, false);
          break;
        case 'gentle-bell':
          playGentleBell(ctx, masterGain);
          break;
        case 'completion-fanfare':
          playCompletionFanfare(ctx, masterGain);
          break;
        case 'soft-pulse':
          playSoftPulse(ctx, masterGain);
          break;
      }
    },
    [getCtx],
  );

  /**
   * Play the cue for a given cue type, respecting user preferences.
   * Pass `context` for cues whose words depend on the current phase
   * (phaseStart / phaseEnd / minuteMark).
   */
  const playCue = useCallback(
    (cueType: AudioCueType, context: CueContext = {}) => {
      const config = prefs[cueType];
      if (!config || !config.enabled) return;

      const volume = normalizeVolume(config.volume);

      // Spoken countdown: one recording with each word on its second.
      if (cueType === 'countdown' && config.sound === 'voice') {
        const audio = countdownAudioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.volume = volume;
          audio.play().catch((e) => logger.log('Countdown failed to play:', e));
        }
        return;
      }

      if (config.sound === 'voice') {
        speak(cueSentence(cueType, context), volume);
        return;
      }

      playSound(config.sound, volume);
    },
    [prefs, playSound, speak],
  );

  return { playCue, playSound, speak };
};

export default useAudioCues;
