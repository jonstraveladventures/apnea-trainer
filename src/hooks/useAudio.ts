import { useRef, useEffect } from 'react';
import * as logger from '../utils/logger';

/**
 * Simple audio playback hook.
 * Creates an Audio element on mount and exposes a play() function.
 */
const useAudio = (audioFile: string): { play: () => void } => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioFile) {
      audioRef.current = new Audio(audioFile);
    }
  }, [audioFile]);

  const play = (): void => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => logger.log('Audio play failed:', e));
    }
  };

  return { play };
};

export default useAudio;
