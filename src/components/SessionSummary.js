import React from 'react';
import { formatTime } from '../utils/trainingLogic';

const SessionSummary = ({
  sessionCompleted,
  sessionSummary,
  onResetTimer,
  onResetSessionCompletion
}) => {
  if (!sessionCompleted || !sessionSummary) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
      <div className="text-center">
        <div className="text-2xl mb-2">🎉</div>
        <div className="text-lg font-semibold text-green-400 mb-2">
          Session Complete!
        </div>
        <div className="space-y-1 text-sm text-deep-300">
          <div>Focus: {sessionSummary?.focus || 'Unknown'}</div>
          <div>Total Time: {formatTime(sessionSummary?.totalTime || 0)}</div>
          <div>Phases Completed: {sessionSummary?.completedPhases || 0}/{sessionSummary?.totalPhases || 0}</div>
          <div>Based on Max Hold: {formatTime(sessionSummary?.maxHold || 0)}</div>
        </div>
        <div className="flex gap-2 justify-center mt-3">
          <button
            onClick={onResetTimer}
            className="btn-secondary text-xs"
          >
            Reset Timer
          </button>
          <button
            onClick={onResetSessionCompletion}
            className="btn-secondary text-xs"
          >
            Remove Completion
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary; 