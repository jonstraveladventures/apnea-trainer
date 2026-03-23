import React, { useState } from 'react';
import { CustomPhase, DurationType } from '../types';

interface PhaseData {
  type: string;
  duration: number | '';
  durationType: DurationType;
  progressiveChange: number | '';
  maxHoldPercentage: number | '';
  description: string;
  instructions: string;
}

interface PhaseCreatorProps {
  phaseType: string;
  onCreate: (phaseData: Omit<CustomPhase, 'id'>) => void;
  onCancel: () => void;
  existingPhases?: CustomPhase[];
}

const PhaseCreator: React.FC<PhaseCreatorProps> = ({ phaseType, onCreate, onCancel, existingPhases = [] }) => {
  const [phaseData, setPhaseData] = useState<PhaseData>({
    type: phaseType,
    duration: 60,
    durationType: 'fixed', // 'fixed', 'progressive', 'maxHold'
    progressiveChange: 10, // seconds to add/subtract
    maxHoldPercentage: 50, // percentage of max hold
    description: '',
    instructions: ''
  });

  const handleNumberChange = (field: keyof PhaseData, value: string) => {
    if (value === '') {
      setPhaseData(prev => ({ ...prev, [field]: '' }));
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setPhaseData(prev => ({ ...prev, [field]: numValue }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Ensure all required fields have valid values
    const validatedData: Omit<CustomPhase, 'id'> = {
      type: phaseData.type,
      duration: phaseData.duration || 60,
      durationType: phaseData.durationType,
      progressiveChange: phaseData.progressiveChange || 10,
      maxHoldPercentage: phaseData.maxHoldPercentage || 50,
      description: phaseData.description,
      instructions: phaseData.instructions
    };

    onCreate(validatedData);
  };

  const getPhaseFields = (): React.ReactNode => {
    // Check if there are previous phases of the same type
    const previousPhasesOfSameType = existingPhases.filter(phase => phase.type === phaseType);
    const hasPreviousPhase = previousPhasesOfSameType.length > 0;

    // If no previous phase and current duration type is progressive, reset to fixed
    if (!hasPreviousPhase && phaseData.durationType === 'progressive') {
      setPhaseData(prev => ({ ...prev, durationType: 'fixed' }));
    }

    // Shared duration type fields
    const renderDurationFields = (): React.ReactNode => (
      <>
        <div>
          <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Duration Type:</label>
          <select
            value={phaseData.durationType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPhaseData(prev => ({ ...prev, durationType: e.target.value as DurationType }))}
            className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
          >
            <option value="fixed">Fixed Duration</option>
            {hasPreviousPhase && (
              <option value="progressive">Progressive (add/subtract from previous {phaseType} phase)</option>
            )}
            <option value="maxHold">Percentage of Max Hold</option>
          </select>
        </div>

        {phaseData.durationType === 'fixed' && (
          <div>
            <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Duration (seconds):</label>
            <input
              type="number"
              value={phaseData.duration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhaseData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              min="1"
            />
          </div>
        )}

        {phaseData.durationType === 'progressive' && (
          <div>
            <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Change from Previous Phase (seconds):</label>
            <input
              type="number"
              value={phaseData.progressiveChange}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhaseData(prev => ({ ...prev, progressiveChange: parseInt(e.target.value) || 0 }))}
              className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              placeholder="e.g., 10 to add 10s, -5 to subtract 5s"
            />
          </div>
        )}

        {phaseData.durationType === 'maxHold' && (
          <div>
            <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Percentage of Max Hold (%):</label>
            <input
              type="number"
              value={phaseData.maxHoldPercentage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhaseData(prev => ({ ...prev, maxHoldPercentage: parseInt(e.target.value) || 0 }))}
              className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              min="1"
              max="100"
            />
          </div>
        )}
      </>
    );

    switch (phaseType) {
      case 'hold':
        return (
          <div className="space-y-4">
            {renderDurationFields()}
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Description:</label>
              <input
                type="text"
                value={phaseData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhaseData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Progressive breath hold"
                className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Instructions:</label>
              <textarea
                value={phaseData.instructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPhaseData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="e.g., Take a deep breath and hold..."
                className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white h-20"
              />
            </div>
          </div>
        );

      case 'breathing':
        return (
          <div className="space-y-4">
            {renderDurationFields()}
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Breathing Type:</label>
              <select
                value={phaseData.description}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPhaseData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              >
                <option value="">Select breathing type...</option>
                <option value="Tidal Breathing">Tidal Breathing</option>
                <option value="Diaphragmatic Breathing">Diaphragmatic Breathing</option>
                <option value="Box Breathing">Box Breathing</option>
                <option value="Alternate Nostril">Alternate Nostril</option>
                <option value="Rest Period">Rest Period</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Instructions:</label>
              <textarea
                value={phaseData.instructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPhaseData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="e.g., Breathe naturally and rhythmically..."
                className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white h-20"
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Phase Name:</label>
              <input
                type="text"
                value={phaseData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhaseData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Custom Exercise, Warm-up, Cool-down"
                className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              />
            </div>
            {renderDurationFields()}
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Instructions:</label>
              <textarea
                value={phaseData.instructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPhaseData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Describe what to do during this phase..."
                className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white h-20"
              />
            </div>
          </div>
        );

      case 'mental':
        return (
          <div className="space-y-4">
            {renderDurationFields()}
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Mental Exercise Type:</label>
              <select
                value={phaseData.description}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPhaseData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              >
                <option value="">Select mental exercise...</option>
                <option value="Visualization">Visualization</option>
                <option value="Mindfulness">Mindfulness</option>
                <option value="Relaxation">Relaxation</option>
                <option value="Focus Training">Focus Training</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300 mb-2 block">Instructions:</label>
              <textarea
                value={phaseData.instructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPhaseData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="e.g., Visualize yourself underwater..."
                className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white h-20"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {getPhaseFields()}

      <div className="flex gap-3 pt-4 border-t border-deep-700">
        <button type="submit" className="btn-primary flex-1">
          Add Phase
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PhaseCreator;
