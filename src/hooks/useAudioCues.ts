import { useRef, useCallback, useEffect } from 'react';
import { AudioCueType, AudioPreferences, AudioSound } from '../types';

/** Default audio preferences — countdown enabled (mp3), others disabled */
export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  countdown: { enabled: true, sound: 'beep' },
  phaseStart: { enabled: false, sound: 'chime' },
  phaseEnd: { enabled: false, sound: 'tone-low' },
  sessionComplete: { enabled: false, sound: 'chime' },
};

export interface UseAudioCuesReturn {
  playCue: (cueType: AudioCueType) => void;
  playSound: (sound: AudioSound) => void;
}

/**
 * Hook that generates audio cues using the Web Audio API.
 *
 * For the `countdown` cue the existing mp3 voice-countdown file is used when
 * the sound is set to `'beep'` (the default). All other sounds are synthesised
 * with OscillatorNode so no extra assets are needed.
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

  /** Play a synthesised tone */
  const playTone = useCallback(
    (frequency: number, durationMs: number, decay = false) => {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);

      if (decay) {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      } else {
        // Quick fade-out at the end to avoid click
        gain.gain.setValueAtTime(0.5, ctx.currentTime + (durationMs - 20) / 1000);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    },
    [getCtx],
  );

  /** Play a specific AudioSound */
  const playSound = useCallback(
    (sound: AudioSound) => {
      switch (sound) {
        case 'beep':
          playTone(800, 150);
          break;
        case 'chime':
          playTone(523, 400, true);
          break;
        case 'tone-low':
          playTone(330, 200);
          break;
        case 'tone-high':
          playTone(1000, 200);
          break;
        case 'none':
        default:
          break;
      }
    },
    [playTone],
  );

  /** Play the cue for a given cue type, respecting user preferences */
  const playCue = useCallback(
    (cueType: AudioCueType) => {
      const config = prefs[cueType];
      if (!config || !config.enabled) return;

      // Special case: countdown cue with 'beep' sound uses the mp3 voice countdown
      if (cueType === 'countdown' && config.sound === 'beep') {
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
