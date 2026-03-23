import React from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { WeeklySchedule } from '../../types';

interface WeeklyScheduleEditorModalProps {
  onSave: () => void;
  onChange: (day: keyof WeeklySchedule, value: string) => void;
}

function WeeklyScheduleEditorModal({ onSave, onChange }: WeeklyScheduleEditorModalProps): React.ReactElement | null {
  const { state, actions } = useAppContext();
  const { showWeeklyScheduleEditor, weeklySchedule, currentProfile, profiles } = state;

  if (!showWeeklyScheduleEditor) return null;

  const handleClose = (): void => actions.hideModal('showWeeklyScheduleEditor');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="weekly-schedule-modal-title">
      <div className="bg-white dark:bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 id="weekly-schedule-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">Edit Weekly Schedule</h3>
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
            Choose which session type to assign to each day of the week. This will determine your training schedule.
          </p>

          <div className="grid gap-4">
            {([
              { key: 'monday' as const, label: 'Monday' },
              { key: 'tuesday' as const, label: 'Tuesday' },
              { key: 'wednesday' as const, label: 'Wednesday' },
              { key: 'thursday' as const, label: 'Thursday' },
              { key: 'friday' as const, label: 'Friday' },
              { key: 'saturday' as const, label: 'Saturday' },
              { key: 'sunday' as const, label: 'Sunday' }
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-deep-700 rounded-lg border border-gray-300 dark:border-deep-600">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{label}</h4>
                  <p className="text-gray-500 dark:text-deep-300 text-sm">
                    Current: {weeklySchedule[key]}
                  </p>
                </div>
                <select
                  value={weeklySchedule[key]}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(key, e.target.value)}
                  className="bg-gray-200 dark:bg-deep-600 border border-gray-300 dark:border-deep-500 rounded px-3 py-2 text-gray-900 dark:text-white min-w-[200px]"
                >
                  <option value="Comfortable CO&#x2082; Training">Comfortable CO&#x2082; Training</option>
                  <option value="O&#x2082; Tolerance">O&#x2082; Tolerance</option>
                  <option value="Breath Control">Breath Control</option>
                  <option value="Mental + Technique">Mental + Technique</option>
                  <option value="Max Breath-Hold">Max Breath-Hold</option>
                  <option value="Recovery & Flexibility">Recovery & Flexibility</option>
                  <option value="Traditional CO&#x2082; Tables">Traditional CO&#x2082; Tables</option>
                  {Object.keys(profiles[currentProfile]?.customSessions || {}).map((sessionName: string) => (
                    <option key={sessionName} value={sessionName}>
                      {'\uD83C\uDFAF'} {sessionName}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-deep-700">
            <button
              onClick={onSave}
              className="btn-primary flex-1"
            >
              Save Weekly Schedule
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

export default WeeklyScheduleEditorModal;
