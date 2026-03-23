import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTimerContext } from '../../context/TimerContext';
import { SESSION_TEMPLATES } from '../../config/sessionTemplates';
import { SessionTemplate } from '../../types/index';

function TemplateEditorModal(): React.ReactElement | null {
  const { state, actions } = useAppContext();
  const { actions: timerActions } = useTimerContext();
  const { showTemplateEditor, editingSessionType } = state;

  const [editedTemplate, setEditedTemplate] = useState<SessionTemplate>({});

  useEffect(() => {
    if (editingSessionType) {
      setEditedTemplate({ ...SESSION_TEMPLATES[editingSessionType] } || {});
    }
  }, [editingSessionType]);

  if (!showTemplateEditor) return null;

  const handleClose = (): void => {
    actions.hideModal('showTemplateEditor');
    actions.setEditingSessionType(null);
  };

  const handleSave = (): void => {
    if (editingSessionType) {
      timerActions.updateSessionTemplate(editingSessionType, editedTemplate);

      actions.setNotification({
        message: `${editingSessionType} settings saved successfully!`,
        type: 'success',
        duration: 3000
      });
    }
    actions.hideModal('showTemplateEditor');
    actions.setEditingSessionType(null);
  };

  const updateField = (field: string, value: unknown): void => {
    setEditedTemplate(prev => ({ ...prev, [field]: value }));
  };

  if (!editingSessionType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="template-editor-modal-title">
      <div className="bg-white dark:bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 id="template-editor-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">Customize {editingSessionType}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 dark:text-deep-400 hover:text-gray-600 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-gray-500 dark:text-deep-300">
            Customize the parameters for {editingSessionType}. These settings will be saved to your current profile.
          </p>

          <div className="bg-gray-100 dark:bg-deep-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-ocean-400 mb-3">Session Parameters</h4>

            {editingSessionType === 'Comfortable CO\u2082 Training' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Hold Percentage (%)</label>
                    <input
                      type="number"
                      value={editedTemplate.holdPercentage ?? 40}
                      onChange={(e) => updateField('holdPercentage', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="20"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Number of Rounds</label>
                    <input
                      type="number"
                      value={editedTemplate.holdCount ?? 7}
                      onChange={(e) => updateField('holdCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="5"
                      max="10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-deep-300">Preparation Duration (minutes)</label>
                  <input
                    type="number"
                    value={Math.round((editedTemplate.preparationDuration as number ?? 300) / 60)}
                    onChange={(e) => updateField('preparationDuration', (parseInt(e.target.value) || 0) * 60)}
                    className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                    min="3"
                    max="10"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-deep-300">Rest Pattern (seconds, comma-separated)</label>
                  <div className="text-xs text-gray-400 dark:text-deep-400 mb-2">
                    Enter rest durations separated by commas (e.g., 120,105,90,75,60,75,90)
                  </div>
                  <input
                    type="text"
                    value={Array.isArray(editedTemplate.restPattern) ? editedTemplate.restPattern.join(',') : '120,105,90,75,60,75,90'}
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                      updateField('restPattern', arr);
                    }}
                    className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {editingSessionType === 'Traditional CO\u2082 Tables' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Number of Holds</label>
                    <input
                      type="number"
                      value={editedTemplate.holdCount ?? 5}
                      onChange={(e) => updateField('holdCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="3"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Starting Hold Duration (seconds)</label>
                    <input
                      type="number"
                      value={editedTemplate.holdStartDuration ?? 45}
                      onChange={(e) => updateField('holdStartDuration', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="30"
                      max="120"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Hold Increase (seconds)</label>
                    <input
                      type="number"
                      value={editedTemplate.holdIncrease ?? 15}
                      onChange={(e) => updateField('holdIncrease', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="10"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Rest Duration (seconds)</label>
                    <input
                      type="number"
                      value={editedTemplate.restDuration ?? 45}
                      onChange={(e) => updateField('restDuration', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="30"
                      max="120"
                    />
                  </div>
                </div>
              </div>
            )}

            {editingSessionType === 'O\u2082 Tolerance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Number of Holds</label>
                    <input
                      type="number"
                      value={editedTemplate.holdCount ?? 5}
                      onChange={(e) => updateField('holdCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="4"
                      max="8"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Starting Hold Percentage (%)</label>
                    <input
                      type="number"
                      value={editedTemplate.holdStartPercentage ?? 60}
                      onChange={(e) => updateField('holdStartPercentage', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="50"
                      max="70"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Hold Increase Percentage (%)</label>
                    <input
                      type="number"
                      value={editedTemplate.holdIncreasePercentage ?? 10}
                      onChange={(e) => updateField('holdIncreasePercentage', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="8"
                      max="15"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Maximum Hold Percentage (%)</label>
                    <input
                      type="number"
                      value={editedTemplate.maxHoldPercentage ?? 95}
                      onChange={(e) => updateField('maxHoldPercentage', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="85"
                      max="100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Rest Duration (seconds)</label>
                    <input
                      type="number"
                      value={editedTemplate.restDuration ?? 180}
                      onChange={(e) => updateField('restDuration', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="120"
                      max="300"
                    />
                  </div>
                </div>
                <div className="bg-gray-200 dark:bg-deep-600 rounded p-3">
                  <p className="text-xs text-gray-500 dark:text-deep-300">
                    <strong>Research Note:</strong> Based on research showing O&#8322; tables should progress to near-maximum (90-95%) for optimal adaptation. Fixed rest periods maintain consistent recovery.
                  </p>
                </div>
              </div>
            )}

            {editingSessionType === 'Breath Control' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Diaphragmatic Duration (minutes)</label>
                    <input
                      type="number"
                      value={Math.round((editedTemplate.diaphragmaticDuration as number ?? 300) / 60)}
                      onChange={(e) => updateField('diaphragmaticDuration', (parseInt(e.target.value) || 0) * 60)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="5"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Alternate Nostril Duration (minutes)</label>
                    <input
                      type="number"
                      value={Math.round((editedTemplate.alternateNostrilDuration as number ?? 300) / 60)}
                      onChange={(e) => updateField('alternateNostrilDuration', (parseInt(e.target.value) || 0) * 60)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="3"
                      max="15"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Box Breathing Duration (minutes)</label>
                    <input
                      type="number"
                      value={Math.round((editedTemplate.boxBreathingDuration as number ?? 300) / 60)}
                      onChange={(e) => updateField('boxBreathingDuration', (parseInt(e.target.value) || 0) * 60)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="3"
                      max="15"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Box Breathing Cycles</label>
                    <input
                      type="number"
                      value={editedTemplate.boxBreathingCycles ?? 0}
                      onChange={(e) => updateField('boxBreathingCycles', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="0"
                      max="15"
                    />
                  </div>
                </div>
              </div>
            )}

            {editingSessionType === 'Mental + Technique' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Visualization Duration (minutes)</label>
                    <input
                      type="number"
                      value={Math.round((editedTemplate.visualizationDuration as number ?? 900) / 60)}
                      onChange={(e) => updateField('visualizationDuration', (parseInt(e.target.value) || 0) * 60)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="10"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Mindfulness Duration (minutes)</label>
                    <input
                      type="number"
                      value={Math.round((editedTemplate.mindfulnessDuration as number ?? 600) / 60)}
                      onChange={(e) => updateField('mindfulnessDuration', (parseInt(e.target.value) || 0) * 60)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="5"
                      max="20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Mindful Hold Count</label>
                    <input
                      type="number"
                      value={editedTemplate.mindfulHoldCount ?? 2}
                      onChange={(e) => updateField('mindfulHoldCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="1"
                      max="5"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Mindful Hold Percentage (%)</label>
                    <input
                      type="number"
                      value={editedTemplate.mindfulHoldPercentage ?? 60}
                      onChange={(e) => updateField('mindfulHoldPercentage', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="40"
                      max="80"
                    />
                  </div>
                </div>
              </div>
            )}

            {editingSessionType === 'Max Breath-Hold' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-deep-300">Max Hold Percentages</label>
                  <div className="text-xs text-gray-400 dark:text-deep-400 mb-2">
                    Enter percentages separated by commas (e.g., 25,35,50,65,100,100)
                  </div>
                  <input
                    type="text"
                    value={Array.isArray(editedTemplate.maxHoldPercentages) ? editedTemplate.maxHoldPercentages.join(',') : '25,35,50,65,100,100'}
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                      updateField('maxHoldPercentages', arr);
                    }}
                    className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">CO&#8322; Tolerance Sets</label>
                    <input
                      type="number"
                      value={editedTemplate.co2ToleranceSets ?? 3}
                      onChange={(e) => updateField('co2ToleranceSets', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="2"
                      max="6"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">CO&#8322; Hold Duration (seconds)</label>
                    <input
                      type="number"
                      value={editedTemplate.co2ToleranceHoldDuration ?? 45}
                      onChange={(e) => updateField('co2ToleranceHoldDuration', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="30"
                      max="90"
                    />
                  </div>
                </div>
              </div>
            )}

            {editingSessionType === 'Advanced CO\u2082 Table' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Number of Holds</label>
                    <input
                      type="number"
                      value={editedTemplate.holdCount ?? 5}
                      onChange={(e) => updateField('holdCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="4"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Hold Percentage (%)</label>
                    <input
                      type="number"
                      value={editedTemplate.holdPercentage ?? 62.5}
                      onChange={(e) => updateField('holdPercentage', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="30"
                      max="90"
                      step="0.5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Rest Decrease (seconds)</label>
                    <input
                      type="number"
                      value={editedTemplate.restDecrease ?? 22.5}
                      onChange={(e) => updateField('restDecrease', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="10"
                      max="30"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Initial Rest Duration (seconds)</label>
                    <input
                      type="number"
                      value={editedTemplate.restStartDuration ?? 120}
                      onChange={(e) => updateField('restStartDuration', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="60"
                      max="300"
                    />
                  </div>
                </div>
              </div>
            )}

            {editingSessionType === 'Maximal Breath-Hold Training' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Number of Maximal Attempts</label>
                    <input
                      type="number"
                      value={editedTemplate.maximalAttempts ?? 3}
                      onChange={(e) => updateField('maximalAttempts', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="2"
                      max="5"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Rest Duration (minutes)</label>
                    <input
                      type="number"
                      value={Math.round((editedTemplate.restDuration as number ?? 240) / 60)}
                      onChange={(e) => updateField('restDuration', (parseInt(e.target.value) || 0) * 60)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="3"
                      max="6"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Preparation Duration (minutes)</label>
                    <input
                      type="number"
                      value={Math.round((editedTemplate.preparationDuration as number ?? 180) / 60)}
                      onChange={(e) => updateField('preparationDuration', (parseInt(e.target.value) || 0) * 60)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="2"
                      max="5"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Recovery Duration (minutes)</label>
                    <input
                      type="number"
                      value={Math.round((editedTemplate.recoveryDuration as number ?? 300) / 60)}
                      onChange={(e) => updateField('recoveryDuration', (parseInt(e.target.value) || 0) * 60)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="3"
                      max="10"
                    />
                  </div>
                </div>
                <div className="bg-gray-200 dark:bg-deep-600 rounded p-3">
                  <p className="text-xs text-gray-500 dark:text-deep-300">
                    <strong>Research Note:</strong> Studies demonstrate 15-60% improvements in breath-hold duration with maximal training protocols. Always practice with proper supervision and stop at first sign of discomfort.
                  </p>
                </div>
              </div>
            )}

            {editingSessionType === 'Recovery & Flexibility' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Diaphragm Stretch Count</label>
                    <input
                      type="number"
                      value={editedTemplate.diaphragmStretchCount ?? 3}
                      onChange={(e) => updateField('diaphragmStretchCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Diaphragm Stretch Duration (seconds)</label>
                    <input
                      type="number"
                      value={editedTemplate.diaphragmStretchDuration ?? 30}
                      onChange={(e) => updateField('diaphragmStretchDuration', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="15"
                      max="60"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Side Stretch Count</label>
                    <input
                      type="number"
                      value={editedTemplate.sideStretchCount ?? 2}
                      onChange={(e) => updateField('sideStretchCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Side Stretch Duration (seconds)</label>
                    <input
                      type="number"
                      value={editedTemplate.sideStretchDuration ?? 45}
                      onChange={(e) => updateField('sideStretchDuration', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="15"
                      max="90"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Box Breathing Duration (minutes)</label>
                    <input
                      type="number"
                      value={Math.round((editedTemplate.boxBreathingDuration as number ?? 300) / 60)}
                      onChange={(e) => updateField('boxBreathingDuration', (parseInt(e.target.value) || 0) * 60)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="3"
                      max="15"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-deep-300">Recovery Duration (minutes)</label>
                    <input
                      type="number"
                      value={Math.round((editedTemplate.recoveryDuration as number ?? 180) / 60)}
                      onChange={(e) => updateField('recoveryDuration', (parseInt(e.target.value) || 0) * 60)}
                      className="w-full bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-deep-700">
            <button
              onClick={handleSave}
              className="btn-primary flex-1"
            >
              Save Settings
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
  );
}

export default TemplateEditorModal;
