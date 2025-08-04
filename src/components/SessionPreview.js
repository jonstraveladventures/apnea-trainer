import React from 'react';
import { formatTime } from '../utils/trainingLogic';

const SessionPreview = ({ 
  sessionPhases = [], 
  actualMaxHold, 
  isSessionActive 
}) => {
  const getPhaseIcon = (type) => {
    switch (type) {
      case 'hold': return '🫁';
      case 'rest': return '😌';
      case 'breathing': return '🫁';
      case 'box': return '📦';
      case 'visualization': return '🧘';
      case 'recovery': return '🔄';
      case 'warmup': return '🔥';
      case 'max': return '⚡';
      case 'stretch': return '🧘‍♀️';
      case 'cooldown': return '❄️';
      case 'tidal_breathing': return '🌊';
      case 'max_hold': return '⚡';
      case 'stretch_confirmation': return '✅';
      default: return '⏱️';
    }
  };

  if (!actualMaxHold || sessionPhases.length === 0 || isSessionActive) {
    return null;
  }

  const totalTime = sessionPhases.reduce((total, phase) => total + phase.duration, 0);

  return (
    <div className="mt-4">
      <div className="text-sm font-semibold text-deep-300 mb-2">Session Preview:</div>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {sessionPhases.map((phase, index) => (
          <div key={index} className="flex items-center justify-between text-xs bg-deep-700 rounded px-2 py-1">
            <div className="flex items-center gap-2">
              <span>{getPhaseIcon(phase.type)}</span>
              <span className="text-deep-300">{phase.description}</span>
            </div>
            <span className="text-deep-400 font-mono">
              {phase.type === 'max_hold' && phase.percentage === 100 ? 'Max' : formatTime(phase.duration)}
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs text-deep-500 mt-2">
        Total session time: {formatTime(totalTime)}
      </div>
    </div>
  );
};

export default SessionPreview; 