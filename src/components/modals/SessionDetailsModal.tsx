import React from 'react';
import { X } from 'lucide-react';
import { Session, Phase } from '../../types';
import { parseSessionPhases } from '../../utils/sessionParsers';
import { SESSION_TEMPLATES } from '../../config/sessionTemplates';
import { getPhaseIcon, getExerciseTypeFromPhase } from '../../utils/phaseUtils';
import { formatTime } from '../../utils/trainingLogic';

interface SessionDetailsModalProps {
  session: Session | null;
  onClose: () => void;
  currentMaxHold: number | null;
  onShowInstructions: (exerciseType: string) => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({ session, onClose, currentMaxHold, onShowInstructions }) => {
  if (!session) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-deep-900 border border-gray-200 dark:border-deep-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {session.focus} - Complete Session Plan
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-deep-700 rounded"
            >
              <X className="w-5 h-5 text-gray-400 dark:text-deep-400" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-500 dark:text-deep-300 mb-4">
              <p><strong>Session Type:</strong> {session.sessionType}</p>
              {currentMaxHold && (
                <p><strong>Based on Max Hold:</strong> {formatTime(currentMaxHold)}</p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Session Phases:</h3>
              {parseSessionPhases(session.focus, SESSION_TEMPLATES[session.focus] || {}, currentMaxHold || 240).map((phase: Phase, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-deep-800/50 rounded-lg">
                  <span className="text-lg">{getPhaseIcon(phase.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{phase.description}</span>
                      <button
                        onClick={() => {
                          const exerciseType = getExerciseTypeFromPhase(phase);
                          if (exerciseType) {
                            onShowInstructions(exerciseType);
                          }
                        }}
                        className="text-ocean-400 hover:text-ocean-300 text-xs underline"
                      >
                        View Instructions
                      </button>
                    </div>
                    {phase.duration > 0 && (
                      <div className="text-sm text-gray-500 dark:text-deep-300">
                        Duration: {formatTime(phase.duration)}
                      </div>
                    )}
                    {phase.isMaxHold && (
                      <div className="text-sm text-yellow-400">
                        Indefinite hold - press button when complete
                      </div>
                    )}
                    {phase.isCo2Tolerance && (
                      <div className="text-sm text-orange-400">
                        CO₂ tolerance training
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-deep-700">
              <div className="text-sm text-gray-500 dark:text-deep-300">
                <p><strong>Total Session Time:</strong> {
                  formatTime(
                    parseSessionPhases(session.focus, SESSION_TEMPLATES[session.focus] || {}, currentMaxHold || 240)
                      .reduce((total: number, phase: Phase) => total + phase.duration, 0)
                  )
                }</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsModal;
