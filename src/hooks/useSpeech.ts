import { useCallback, useEffect, useState } from 'react';

interface SpeakOptions {
  voiceName?: string;
  /** 0-1 */
  volume?: number;
  /** 0.1-10, default 1. Lower = calmer. */
  rate?: number;
  /** 0-2, default 1. */
  pitch?: number;
  /**
   * If true (default), cancel any in-flight speech before speaking the new
   * utterance — prevents cues from piling up. Set false when chaining
   * utterances yourself (e.g. a scheduled countdown sequence) so each piece
   * doesn't kill the previous one.
   */
  interrupt?: boolean;
}

/**
 * Hook around the Web Speech API's SpeechSynthesis. Picks a voice from the
 * browser's installed voices (no network or API costs). Quality varies by OS:
 * macOS Siri voices are excellent; Windows/Linux voices are passable.
 */
export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const load = () => {
      // Prefer English voices for an English UI; fall back to all if none match.
      const all = window.speechSynthesis.getVoices();
      const english = all.filter((v) => v.lang.toLowerCase().startsWith('en'));
      setVoices(english.length > 0 ? english : all);
    };

    load();
    // Chrome populates voices asynchronously.
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const speak = useCallback((text: string, opts: SpeakOptions = {}) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!text) return;

    if (opts.interrupt !== false) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (opts.voiceName) {
      const match = window.speechSynthesis
        .getVoices()
        .find((v) => v.name === opts.voiceName);
      if (match) utterance.voice = match;
    }
    utterance.volume = opts.volume ?? 1;
    utterance.rate = opts.rate ?? 0.95;
    utterance.pitch = opts.pitch ?? 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  return { voices, speak };
}
