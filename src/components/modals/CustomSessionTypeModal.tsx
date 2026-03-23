import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { formatTime } from '../../utils/trainingLogic';

interface CustomSessionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sessionData: any) => void;
  currentMaxHold: number | null;
}

const CustomSessionTypeModal: React.FC<CustomSessionTypeModalProps> = ({ isOpen, onClose, onSave, currentMaxHold }) => {
  const [customSessionName, setCustomSessionName] = useState<string>('');
  const [customSessionDescription, setCustomSessionDescription] = useState<string>('');
  const [customSessionType, setCustomSessionType] = useState<string>('custom');
  const [customSessionConfig, setCustomSessionConfig] = useState<any>({
    warmupHolds: 0,
    warmupDuration: 0,
    restDuration: 0,
    holdCount: 1,
    holdStartDuration: 60,
    holdIncrease: 0,
    holdRestDuration: 60,
    cooldownDuration: 180
  });
  const [customSessionBase, setCustomSessionBase] = useState<string>('');

  if (!isOpen) return null;

  const calculateSessionDuration = (): number => {
    const warmupTime = (customSessionConfig.warmupHolds || 0) *
      ((customSessionConfig.warmupDuration || 0) + (customSessionConfig.restDuration || 0));
    const mainSessionTime = (customSessionConfig.holdCount || 1) *
      (customSessionConfig.holdStartDuration || 60) +
      ((customSessionConfig.holdCount || 1) - 1) * (customSessionConfig.holdRestDuration || 60);
    const cooldownTime = customSessionConfig.cooldownDuration || 180;

    return warmupTime + mainSessionTime + cooldownTime;
  };

  const handleSave = () => {
    if (customSessionName.trim()) {
      const sessionData = {
        name: customSessionName,
        description: customSessionDescription,
        type: customSessionType,
        config: customSessionConfig,
        estimatedDuration: calculateSessionDuration()
      };
      onSave(sessionData);
      // Reset state
      setCustomSessionName('');
      setCustomSessionDescription('');
      setCustomSessionType('custom');
      setCustomSessionConfig({
        warmupHolds: 0,
        warmupDuration: 0,
        restDuration: 0,
        holdCount: 1,
        holdStartDuration: 60,
        holdIncrease: 0,
        holdRestDuration: 60,
        cooldownDuration: 180
      });
      setCustomSessionBase('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Custom Session Type</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-deep-400 hover:text-gray-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300">Session Name:</label>
              <input
                type="text"
                value={customSessionName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomSessionName(e.target.value)}
                className="w-full bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                placeholder="e.g., Custom CO₂ Table"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-deep-300">Session Type:</label>
              <select
                value={customSessionType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setCustomSessionType(e.target.value);
                  if (e.target.value !== 'custom') {
                    const template: Record<string, any> = {
                      'CO₂ Tolerance': {
                        warmupHolds: 0,
                        warmupDuration: 0,
                        restDuration: 0,
                        holdCount: 5,
                        holdStartDuration: 45,
                        holdIncrease: 15,
                        holdRestDuration: 60,
                        cooldownDuration: 180
                      },
                      'Breath Control': {
                        diaphragmaticDuration: 600,
                        alternateNostrilDuration: 300,
                        boxBreathingCycles: 8,
                        boxBreathingRest: 30,
                        recoveryDuration: 120
                      },
                      'O₂ Tolerance': {
                        holdCount: 4,
                        holdStartDuration: Math.round((currentMaxHold || 240) * 0.6),
                        holdIncrease: 10,
                        restDuration: Math.round((currentMaxHold || 240) * 1.5)
                      },
                      'Mental + Technique': {
                        visualizationDuration: 900,
                        mindfulnessDuration: 600,
                        progressiveRelaxationDuration: 600,
                        mindfulHoldCount: 2,
                        mindfulHoldPercentage: 60,
                        recoveryDuration: 180
                      },
                      'Advanced CO₂ Table': {
                        holdStartDuration: Math.round((currentMaxHold || 240) * 0.4),
                        holdIncrease: Math.round((currentMaxHold || 240) * 0.08),
                        restDuration: Math.round((currentMaxHold || 240) * 0.4)
                      },
                      'Max Breath-Hold': {
                        stretchConfirmation: true,
                        tidalBreathingDuration: 120,
                        maxHoldPercentages: [25, 35, 50, 65, 100, 100],
                        co2ToleranceSets: 3,
                        co2ToleranceHoldDuration: 45,
                        co2ToleranceRestDuration: 45
                      },
                      'Recovery & Flexibility': {
                        warmupDuration: 300,
                        stretchDuration: 600,
                        cooldownDuration: 180
                      }
                    };
                    setCustomSessionConfig(template[e.target.value]);
                    setCustomSessionBase(e.target.value);
                  } else {
                    setCustomSessionConfig({
                      warmupHolds: 0,
                      warmupDuration: 0,
                      restDuration: 0,
                      holdCount: 1,
                      holdStartDuration: 60,
                      holdIncrease: 0,
                      holdRestDuration: 60,
                      cooldownDuration: 180
                    });
                    setCustomSessionBase('');
                  }
                }}
                className="w-full bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              >
                <option value="custom">Custom</option>
                <option value="Comfortable CO₂ Training">Comfortable CO₂ Training</option>
                <option value="Breath Control">Breath Control</option>
                <option value="O₂ Tolerance">O₂ Tolerance</option>
                <option value="Mental + Technique">Mental + Technique</option>
                <option value="Advanced CO₂ Table">Advanced CO₂ Table</option>
                <option value="Max Breath-Hold">Max Breath-Hold</option>
                <option value="Recovery & Flexibility">Recovery & Flexibility</option>
                <option value="Traditional CO₂ Tables">Traditional CO₂ Tables</option>
              </select>
            </div>
          </div>
          {customSessionBase && (
            <div className="text-xs text-gray-400 dark:text-deep-400 mb-2">
              Based on: <span className="font-semibold">{customSessionBase}</span>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-500 dark:text-deep-300">Description:</label>
            <textarea
              value={customSessionDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomSessionDescription(e.target.value)}
              className="w-full bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
              placeholder="Describe the session structure..."
              rows={2}
            />
          </div>

          {/* Session Structure */}
          <div className="bg-gray-50 dark:bg-deep-900 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Session Structure</h4>

            {/* Dynamic Field Rendering */}
            {(() => {
              const renderField = (key: string, label: string, type: string = 'number', min: number = 0, max: number = 1000, step: number = 1): React.ReactNode => {
                if (customSessionConfig[key] === undefined) return null;

                return (
                  <div key={key}>
                    <label className="text-xs text-gray-400 dark:text-deep-400">{label}:</label>
                    <input
                      type={type}
                      min={min}
                      max={max}
                      step={step}
                      value={customSessionConfig[key] || 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomSessionConfig({
                        ...customSessionConfig,
                        [key]: type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value
                      })}
                      className="w-full bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                );
              };

              const renderArrayField = (key: string, label: string): React.ReactNode => {
                if (!Array.isArray(customSessionConfig[key])) return null;

                return (
                  <div key={key} className="col-span-full">
                    <label className="text-xs text-gray-400 dark:text-deep-400">{label}:</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {customSessionConfig[key].map((value: number, index: number) => (
                        <div key={index} className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newArray = [...customSessionConfig[key]];
                              newArray[index] = parseInt(e.target.value) || 0;
                              setCustomSessionConfig({
                                ...customSessionConfig,
                                [key]: newArray
                              });
                            }}
                            className="w-16 bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm"
                          />
                          <button
                            onClick={() => {
                              const newArray = customSessionConfig[key].filter((_: any, i: number) => i !== index);
                              setCustomSessionConfig({
                                ...customSessionConfig,
                                [key]: newArray
                              });
                            }}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newArray = [...customSessionConfig[key], 50];
                          setCustomSessionConfig({
                            ...customSessionConfig,
                            [key]: newArray
                          });
                        }}
                        className="text-ocean-400 hover:text-ocean-300 text-sm border border-ocean-400 rounded px-2 py-1"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              };

              // Determine which sections to show based on session type
              const hasWarmupFields = ['warmupHolds', 'warmupDuration', 'restDuration'].some(key =>
                customSessionConfig[key] !== undefined
              );
              const hasMainFields = ['holdCount', 'holdStartDuration', 'holdIncrease', 'holdRestDuration',
                'diaphragmaticDuration', 'alternateNostrilDuration', 'boxBreathingCycles', 'boxBreathingRest',
                'visualizationDuration', 'mindfulnessDuration', 'progressiveRelaxationDuration',
                'mindfulHoldCount', 'mindfulHoldPercentage', 'co2ToleranceSets', 'co2ToleranceHoldDuration',
                'co2ToleranceRestDuration', 'stretchConfirmation', 'tidalBreathingDuration', 'maxHoldPercentages'
              ].some(key => customSessionConfig[key] !== undefined);

              const hasCooldownFields = ['cooldownDuration', 'recoveryDuration'].some(key =>
                customSessionConfig[key] !== undefined
              );

              return (
                <>
                  {/* Warm-up Section */}
                  {hasWarmupFields && (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-ocean-400">{'\u{1F525}'}</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-deep-300">Warm-up</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {renderField('warmupHolds', 'Breath-ups', 'number', 0, 10)}
                        {renderField('warmupDuration', 'Warm-up Duration (s)', 'number', 0, 600)}
                        {renderField('restDuration', 'Rest Duration (s)', 'number', 0, 600)}
                      </div>
                    </div>
                  )}

                  {/* Main Session Section */}
                  {hasMainFields && (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-ocean-400">{'\u26A1'}</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-deep-300">Main Session</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {renderField('holdCount', 'Hold Count', 'number', 1, 20)}
                        {renderField('holdStartDuration', 'Start Duration (s)', 'number', 30, 600)}
                        {renderField('holdIncrease', 'Duration Increase (s)', 'number', 0, 60)}
                        {renderField('holdRestDuration', 'Rest Between (s)', 'number', 0, 300)}
                        {renderField('diaphragmaticDuration', 'Diaphragmatic Breathing (s)', 'number', 0, 1200)}
                        {renderField('alternateNostrilDuration', 'Alternate Nostril (s)', 'number', 0, 600)}
                        {renderField('boxBreathingCycles', 'Box Breathing Cycles', 'number', 1, 20)}
                        {renderField('boxBreathingRest', 'Box Breathing Rest (s)', 'number', 0, 120)}
                        {renderField('visualizationDuration', 'Visualization (s)', 'number', 0, 1200)}
                        {renderField('mindfulnessDuration', 'Mindfulness (s)', 'number', 0, 1200)}
                        {renderField('progressiveRelaxationDuration', 'Progressive Relaxation (s)', 'number', 0, 1200)}
                        {renderField('mindfulHoldCount', 'Mindful Hold Count', 'number', 1, 10)}
                        {renderField('mindfulHoldPercentage', 'Mindful Hold %', 'number', 10, 100)}
                        {renderField('co2ToleranceSets', 'CO₂ Tolerance Sets', 'number', 1, 10)}
                        {renderField('co2ToleranceHoldDuration', 'CO₂ Hold Duration (s)', 'number', 10, 120)}
                        {renderField('co2ToleranceRestDuration', 'CO₂ Rest Duration (s)', 'number', 10, 120)}
                        {renderField('tidalBreathingDuration', 'Tidal Breathing (s)', 'number', 30, 300)}
                        {renderArrayField('maxHoldPercentages', 'Max Hold Percentages')}
                      </div>
                    </div>
                  )}

                  {/* Cool-down Section */}
                  {hasCooldownFields && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-ocean-400">{'\u2744\uFE0F'}</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-deep-300">Cool-down</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {renderField('cooldownDuration', 'Cool-down Duration (s)', 'number', 0, 600)}
                        {renderField('recoveryDuration', 'Recovery Duration (s)', 'number', 0, 600)}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Session Preview */}
          <div className="bg-gray-50 dark:bg-deep-900 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Session Preview</h4>
            <div className="text-sm text-gray-500 dark:text-deep-300 space-y-1">
              <div>Total estimated time: {calculateSessionDuration()} seconds</div>
              {customSessionConfig.warmupHolds !== undefined && (
                <div>Warm-up: {customSessionConfig.warmupHolds || 0} breath-ups</div>
              )}
              {customSessionConfig.holdCount !== undefined && (
                <div>Main session: {customSessionConfig.holdCount || 1} holds</div>
              )}
              {customSessionConfig.diaphragmaticDuration !== undefined && (
                <div>Diaphragmatic breathing: {formatTime(customSessionConfig.diaphragmaticDuration || 0)}</div>
              )}
              {customSessionConfig.alternateNostrilDuration !== undefined && (
                <div>Alternate nostril: {formatTime(customSessionConfig.alternateNostrilDuration || 0)}</div>
              )}
              {customSessionConfig.boxBreathingCycles !== undefined && (
                <div>Box breathing: {customSessionConfig.boxBreathingCycles || 0} cycles</div>
              )}
              {customSessionConfig.visualizationDuration !== undefined && (
                <div>Visualization: {formatTime(customSessionConfig.visualizationDuration || 0)}</div>
              )}
              {customSessionConfig.mindfulnessDuration !== undefined && (
                <div>Mindfulness: {formatTime(customSessionConfig.mindfulnessDuration || 0)}</div>
              )}
              {customSessionConfig.progressiveRelaxationDuration !== undefined && (
                <div>Progressive relaxation: {formatTime(customSessionConfig.progressiveRelaxationDuration || 0)}</div>
              )}
              {customSessionConfig.mindfulHoldCount !== undefined && (
                <div>Mindful holds: {customSessionConfig.mindfulHoldCount || 0} holds</div>
              )}
              {customSessionConfig.co2ToleranceSets !== undefined && (
                <div>CO₂ tolerance: {customSessionConfig.co2ToleranceSets || 0} sets</div>
              )}
              {customSessionConfig.maxHoldPercentages !== undefined && (
                <div>Max hold phases: {customSessionConfig.maxHoldPercentages?.length || 0} phases</div>
              )}
              {customSessionConfig.cooldownDuration !== undefined && (
                <div>Cool-down: {formatTime(customSessionConfig.cooldownDuration || 0)}</div>
              )}
              {customSessionConfig.recoveryDuration !== undefined && (
                <div>Recovery: {formatTime(customSessionConfig.recoveryDuration || 0)}</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Create Session Type
          </button>
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomSessionTypeModal;
