import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PhaseCreator from '../PhaseCreator';
import type { CustomPhase } from '../../types';

interface CustomSessionCreatorModalProps {
  onSave: () => void;
  onAddPhase: (phaseType: string) => void;
  onCreatePhase: (phase: Omit<CustomPhase, 'id'>) => void;
  onRemovePhase: (id: number) => void;
}

function CustomSessionCreatorModal({ onSave, onAddPhase, onCreatePhase, onRemovePhase }: CustomSessionCreatorModalProps): React.ReactElement | null {
  const { state, actions } = useAppContext();
  const {
    showCustomSessionCreator, showPhaseCreator, currentPhaseType,
    customSessionName, customSessionDescription, customSessionPhases
  } = state;

  if (!showCustomSessionCreator) return null;

  const handleClose = (): void => {
    actions.hideModal('showCustomSessionCreator');
    actions.setCustomSessionName('');
    actions.setCustomSessionDescription('');
    actions.setCustomSessionPhases([]);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="custom-session-modal-title">
        <div className="bg-white dark:bg-deep-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 id="custom-session-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">Create Custom Session Type</h3>
            <button
              onClick={() => actions.hideModal('showCustomSessionCreator')}
              className="text-gray-400 dark:text-deep-400 hover:text-gray-600 dark:hover:text-white"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Session Name */}
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Session Name:</label>
              <input
                type="text"
                value={customSessionName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => actions.setCustomSessionName(e.target.value)}
                placeholder="Enter a unique session name..."
                className="w-full bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              />
            </div>

            {/* Session Description */}
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Description:</label>
              <textarea
                value={customSessionDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => actions.setCustomSessionDescription(e.target.value)}
                placeholder="Describe what this session type does..."
                className="w-full bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white h-20"
              />
            </div>

            {/* Session Structure */}
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-3 block">Session Structure:</label>
              <div className="space-y-4">
                {/* Phase Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-100 dark:bg-deep-700 rounded-lg border border-gray-300 dark:border-deep-600">
                    <h4 className="font-semibold text-ocean-400 mb-2">Hold Phases</h4>
                    <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                      Progressive or fixed duration breath holds
                    </p>
                    <button
                      onClick={() => onAddPhase('hold')}
                      className="btn-primary w-full text-sm"
                    >
                      Add Hold Phases
                    </button>
                  </div>

                  <div className="p-4 bg-gray-100 dark:bg-deep-700 rounded-lg border border-gray-300 dark:border-deep-600">
                    <h4 className="font-semibold text-ocean-400 mb-2">Breathing Phases</h4>
                    <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                      Tidal, diaphragmatic, alternate nostril, box breathing
                    </p>
                    <button
                      onClick={() => onAddPhase('breathing')}
                      className="btn-primary w-full text-sm"
                    >
                      Add Breathing Phases
                    </button>
                  </div>

                  <div className="p-4 bg-gray-100 dark:bg-deep-700 rounded-lg border border-gray-300 dark:border-deep-600">
                    <h4 className="font-semibold text-ocean-400 mb-2">Mental Phases</h4>
                    <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                      Visualization, mindfulness, relaxation
                    </p>
                    <button
                      onClick={() => onAddPhase('mental')}
                      className="btn-primary w-full text-sm"
                    >
                      Add Mental Phases
                    </button>
                  </div>

                  <div className="p-4 bg-gray-100 dark:bg-deep-700 rounded-lg border border-gray-300 dark:border-deep-600">
                    <h4 className="font-semibold text-ocean-400 mb-2">Custom Phases</h4>
                    <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                      Create completely custom phases with your own parameters
                    </p>
                    <button
                      onClick={() => onAddPhase('custom')}
                      className="btn-primary w-full text-sm"
                    >
                      Add Custom Phase
                    </button>
                  </div>
                </div>

                {/* Added Phases Display */}
                {customSessionPhases.length > 0 && (
                  <div className="p-4 bg-gray-100 dark:bg-deep-700 rounded-lg border border-gray-300 dark:border-deep-600">
                    <h4 className="font-semibold text-ocean-400 mb-3">Added Phases ({customSessionPhases.length})</h4>
                    <div className="space-y-2">
                      {customSessionPhases.map((phase: CustomPhase, index: number) => (
                        <div key={phase.id} className="flex items-center justify-between p-3 bg-white dark:bg-deep-800 rounded border border-gray-200 dark:border-deep-600">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {index + 1}. {phase.type.charAt(0).toUpperCase() + phase.type.slice(1)} Phase
                              </span>
                              <span className="text-xs text-gray-400 dark:text-deep-400">
                                {phase.durationType === 'fixed' && `(${phase.duration}s)`}
                                {phase.durationType === 'progressive' && `(${phase.progressiveChange > 0 ? '+' : ''}${phase.progressiveChange}s from previous)`}
                                {phase.durationType === 'maxHold' && `(${phase.maxHoldPercentage}% of max hold)`}
                              </span>
                            </div>
                            {phase.description && (
                              <p className="text-sm text-gray-500 dark:text-deep-300 mt-1">{phase.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => onRemovePhase(phase.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Remove phase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-deep-700">
              <button
                onClick={onSave}
                disabled={!customSessionName.trim() || customSessionPhases.length === 0}
                className="btn-primary flex-1"
              >
                Create Session Type
              </button>
              <button
                onClick={handleClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Creator Modal */}
      {showPhaseCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="phase-creator-modal-title">
          <div className="bg-white dark:bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 id="phase-creator-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Add {currentPhaseType.charAt(0).toUpperCase() + currentPhaseType.slice(1)} Phase
              </h3>
              <button
                onClick={() => actions.hideModal('showPhaseCreator')}
                className="text-gray-400 dark:text-deep-400 hover:text-gray-600 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <PhaseCreator
              phaseType={currentPhaseType}
              onCreate={onCreatePhase}
              onCancel={() => actions.hideModal('showPhaseCreator')}
              existingPhases={customSessionPhases}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default CustomSessionCreatorModal;
