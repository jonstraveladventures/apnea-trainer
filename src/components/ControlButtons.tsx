import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, X } from 'lucide-react';
import { Phase } from '../types';

interface ControlButtonsProps {
  isSessionActive: boolean;
  isPaused: boolean;
  sessionPhases: Phase[];
  currentPhase: number;
  onStartSession: () => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onEndSession: () => void;
  onSkipPhase: () => void;
  onResetTimer: () => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isSessionActive,
  isPaused,
  sessionPhases,
  currentPhase,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onEndSession,
  onSkipPhase,
  onResetTimer
}) => {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {!isSessionActive ? (
        <button
          onClick={onStartSession}
          className="btn-primary flex items-center gap-2"
          aria-label="Start Session"
        >
          <Play className="w-4 h-4" />
          Start Session
        </button>
      ) : isPaused ? (
        <button
          onClick={onResumeSession}
          className="btn-primary flex items-center gap-2"
          aria-label="Resume Session"
        >
          <Play className="w-4 h-4" />
          Resume
        </button>
      ) : (
        <button
          onClick={onPauseSession}
          className="btn-secondary flex items-center gap-2"
          aria-label="Pause Session"
        >
          <Pause className="w-4 h-4" />
          Pause
        </button>
      )}

      {isSessionActive && (
        <button
          onClick={onEndSession}
          className="btn-secondary flex items-center gap-2"
          aria-label="End Session"
        >
          <X className="w-4 h-4" />
          End Session
        </button>
      )}

      {isSessionActive && sessionPhases.length > 0 && currentPhase < sessionPhases.length - 1 && (
        <button
          onClick={onSkipPhase}
          className="btn-secondary flex items-center gap-2"
          aria-label="Skip Phase"
        >
          <SkipForward className="w-4 h-4" />
          Skip Phase
        </button>
      )}

      <button
        onClick={onResetTimer}
        className="btn-secondary flex items-center gap-2"
        aria-label="Reset"
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </button>
    </div>
  );
};

export default ControlButtons;
