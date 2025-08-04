import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, X } from 'lucide-react';

const ControlButtons = ({
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
        >
          <Play className="w-4 h-4" />
          Start Session
        </button>
      ) : isPaused ? (
        <button
          onClick={onResumeSession}
          className="btn-primary flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Resume
        </button>
      ) : (
        <button
          onClick={onPauseSession}
          className="btn-secondary flex items-center gap-2"
        >
          <Pause className="w-4 h-4" />
          Pause
        </button>
      )}
      
      {isSessionActive && (
        <button
          onClick={onEndSession}
          className="btn-secondary flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          End Session
        </button>
      )}
      
      {isSessionActive && sessionPhases.length > 0 && currentPhase < sessionPhases.length - 1 && (
        <button
          onClick={onSkipPhase}
          className="btn-secondary flex items-center gap-2"
        >
          <SkipForward className="w-4 h-4" />
          Skip Phase
        </button>
      )}
      
      <button
        onClick={onResetTimer}
        className="btn-secondary flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </button>
    </div>
  );
};

export default ControlButtons; 