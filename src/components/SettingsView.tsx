import React from 'react';
import { Calendar, Settings, Download, Upload, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { generateSchedule, START_DATE } from '../utils/trainingLogic';
import { DEFAULT_WEEKLY_SCHEDULE } from '../constants/defaults';
import { Session, Profile, WeeklySchedule, CustomPhase, AudioPreferences } from '../types';
import AudioSettings from './AudioSettings';
import { DEFAULT_AUDIO_PREFERENCES } from '../hooks/useAudioCues';

const SettingsView: React.FC = () => {
  const { state, actions } = useAppContext();
  const {
    sessions, currentMaxHold, currentProfile, profiles,
    weeklySchedule, customSessionPhases, customSessionName,
    customSessionDescription, newProfileName, newProfileMaxHold
  } = state;

  // ---- Handler functions (mirrors App.tsx logic) ----

  const switchProfile = async (profileId: string) => {
    await actions.saveData();
    actions.setCurrentProfile(profileId);
    actions.loadProfileData(profileId);
  };

  const createProfile = (profileName: string) => {
    actions.setNewProfileName(profileName);
    actions.setNewProfileMaxHold('240');
    actions.hideModal('showProfileModal');
    actions.showModal('showMaxHoldModal');
  };

  const deleteProfile = async (profileId: string) => {
    if (profileId === 'default') {
      alert('Cannot delete the default profile');
      return;
    }

    if (Object.keys(profiles).length <= 1) {
      alert('Cannot delete the last profile');
      return;
    }

    actions.deleteProfile(profileId);

    if (currentProfile === profileId) {
      await switchProfile('default');
    }
  };

  const exportData = () => {
    const currentProfileData = profiles[currentProfile];
    const data = {
      sessions,
      currentMaxHold,
      customSessions: currentProfileData?.customSessions || {},
      weeklySchedule: currentProfileData?.weeklySchedule || {},
      profileName: currentProfileData?.name || 'Exported Profile',
      exportDate: new Date().toISOString(),
      completedSessions: sessions.filter((s: Session) => s.completed),
      totalSessions: sessions.length,
      trainingHistory: sessions.map((s: Session) => ({
        date: s.date,
        focus: s.focus,
        completed: s.completed,
        actualMaxHold: s.actualMaxHold,
        sessionTime: s.sessionTime,
        notes: s.notes
      })),
      profileCreated: currentProfileData?.created,
      lastUpdated: currentProfileData?.lastUpdated
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apnea-training-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const data = JSON.parse(e.target?.result as string);

          actions.setSessions(data.sessions || []);
          actions.setCurrentMaxHold(data.currentMaxHold || null);

          if (data.customSessions && Object.keys(data.customSessions).length > 0) {
            actions.updateProfile(currentProfile, {
              customSessions: {
                ...profiles[currentProfile]?.customSessions,
                ...data.customSessions
              }
            });
            actions.setNotification({
              message: `Imported ${Object.keys(data.customSessions).length} custom session(s) successfully!`,
              type: 'success',
              duration: 3000
            });
          }

          if (data.weeklySchedule) {
            actions.setWeeklySchedule(data.weeklySchedule);
            actions.updateProfile(currentProfile, { weeklySchedule: data.weeklySchedule });
          }

        } catch (error) {
          console.error('Error parsing imported data:', error);
          actions.setNotification({
            message: 'Failed to import data. Please check the file format.',
            type: 'error',
            duration: 3000
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // ---- Audio preferences ----
  const audioPreferences: AudioPreferences = profiles[currentProfile]?.audioPreferences ?? DEFAULT_AUDIO_PREFERENCES;

  const handleAudioPreferencesSave = (prefs: AudioPreferences) => {
    actions.updateProfile(currentProfile, { audioPreferences: prefs });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Profile Management */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {'\u{1F464}'} Profile Management
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Profile</h3>
                <p className="text-gray-500 dark:text-deep-300 text-sm">Manage your training profile and max hold time</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={currentProfile}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => switchProfile(e.target.value)}
                  className="bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  {Object.entries(profiles).map(([id, profile]: [string, Profile]) => (
                    <option key={id} value={id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => actions.showModal('showProfileModal')}
                  className="btn-secondary flex items-center gap-1 text-sm px-3 py-2"
                >
                  <Settings className="w-4 h-4" />
                  Manage Profiles
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
              <div className="flex flex-col">
                <span className="text-gray-400 dark:text-deep-400 text-sm">Max Hold Time:</span>
                <span className="text-gray-400 dark:text-deep-500 text-xs">(add manually if needed)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={currentMaxHold || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = parseInt(e.target.value) || null;
                    actions.setCurrentMaxHold(value);
                    if (value !== null) {
                      actions.updateProfile(currentProfile, { currentMaxHold: value });
                    }
                  }}
                  placeholder="Enter max hold (seconds)"
                  className="w-24 bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white text-sm text-center"
                  min="30"
                  max="600"
                />
                <span className="text-gray-400 dark:text-deep-400 text-sm">seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {'\u{1F4C5}'} Weekly Schedule
          </h2>
          <div className="space-y-4">
            <p className="text-gray-500 dark:text-deep-300">
              Customize which session types are assigned to each day of the week. This determines your training schedule.
            </p>

            <button
              onClick={() => actions.showModal('showWeeklyScheduleEditor')}
              className="btn-primary flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Edit Weekly Schedule
            </button>
          </div>
        </div>

        {/* Audio Cues */}
        <AudioSettings
          preferences={audioPreferences}
          onSave={handleAudioPreferencesSave}
        />

        {/* Session Templates */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {'\u2699\uFE0F'} Session Templates
          </h2>
          <div className="space-y-4">
            <p className="text-gray-500 dark:text-deep-300">
              Customize the training parameters for each session type. These settings control the duration,
              intensity, and structure of your training sessions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h3 className="text-lg font-semibold text-ocean-400 mb-2">Comfortable CO₂ Training</h3>
                <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                  Gradual CO₂ tolerance building without contractions, focusing on comfort and adaptation.
                </p>
                <button
                  onClick={() => {
                    actions.setEditingSessionType('Comfortable CO₂ Training');
                    actions.showModal('showTemplateEditor');
                  }}
                  className="btn-primary w-full text-sm"
                >
                  Customize Comfortable CO₂ Training
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h3 className="text-lg font-semibold text-ocean-400 mb-2">Traditional CO₂ Tables</h3>
                <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                  Progressive breath-hold tables with decreasing rest periods to build CO₂ tolerance.
                </p>
                <button
                  onClick={() => {
                    actions.setEditingSessionType('Traditional CO₂ Tables');
                    actions.showModal('showTemplateEditor');
                  }}
                  className="btn-primary w-full text-sm"
                >
                  Customize Traditional CO₂ Tables
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h3 className="text-lg font-semibold text-ocean-400 mb-2">Advanced CO₂ Table</h3>
                <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                  Dynamic CO₂ tolerance training based on your current max hold time.
                </p>
                <button
                  onClick={() => {
                    actions.setEditingSessionType('Advanced CO₂ Table');
                    actions.showModal('showTemplateEditor');
                  }}
                  className="btn-primary w-full text-sm"
                >
                  Customize Advanced CO₂ Table
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h3 className="text-lg font-semibold text-ocean-400 mb-2">O₂ Tolerance</h3>
                <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                  Progressive breath-holds starting at 60% of max hold time, increasing by 10-15% each round, progressing up to 90-95% of max hold time (near personal maximum). Based on research showing O₂ tables should progress to near-maximum for optimal adaptation.
                </p>
                <button
                  onClick={() => {
                    actions.setEditingSessionType('O₂ Tolerance');
                    actions.showModal('showTemplateEditor');
                  }}
                  className="btn-primary w-full text-sm"
                >
                  Customize O₂ Training
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h3 className="text-lg font-semibold text-ocean-400 mb-2">Max Breath-Hold Option 1</h3>
                <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                  Evidence-based training using maximal breath-holds for optimal physiological adaptation. 2-3 maximal attempts with 3-4 minute rest periods. Studies demonstrate 15-60% improvements in breath-hold duration.
                </p>
                <button
                  onClick={() => {
                    actions.setEditingSessionType('Maximal Breath-Hold Training');
                    actions.showModal('showTemplateEditor');
                  }}
                  className="btn-primary w-full text-sm"
                >
                  Customize Max Breath-Hold Option 1
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h3 className="text-lg font-semibold text-ocean-400 mb-2">Max Breath-Hold Option 2</h3>
                <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                  Progressive training with stretch confirmation and CO₂ tolerance integration.
                </p>
                <button
                  onClick={() => {
                    actions.setEditingSessionType('Max Breath-Hold');
                    actions.showModal('showTemplateEditor');
                  }}
                  className="btn-primary w-full text-sm"
                >
                  Customize Max Breath-Hold Option 2
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h3 className="text-lg font-semibold text-ocean-400 mb-2">Breath Control</h3>
                <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                  Advanced breathing techniques including diaphragmatic, alternate nostril, and box breathing.
                </p>
                <button
                  onClick={() => {
                    actions.setEditingSessionType('Breath Control');
                    actions.showModal('showTemplateEditor');
                  }}
                  className="btn-primary w-full text-sm"
                >
                  Customize Breath Control
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h3 className="text-lg font-semibold text-ocean-400 mb-2">Mental + Technique</h3>
                <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                  Visualization, mindfulness, and progressive relaxation techniques for mental training.
                </p>
                <button
                  onClick={() => {
                    actions.setEditingSessionType('Mental + Technique');
                    actions.showModal('showTemplateEditor');
                  }}
                  className="btn-primary w-full text-sm"
                >
                  Customize Mental Training
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h3 className="text-lg font-semibold text-ocean-400 mb-2">Recovery & Flexibility</h3>
                <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">
                  Stretching and recovery sessions for complete training and physical maintenance.
                </p>
                <button
                  onClick={() => {
                    actions.setEditingSessionType('Recovery & Flexibility');
                    actions.showModal('showTemplateEditor');
                  }}
                  className="btn-primary w-full text-sm"
                >
                  Customize Recovery & Flexibility
                </button>
              </div>

              {/* Custom Sessions */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-ocean-400">{'\u{1F3AF}'} Custom Sessions</h3>
                  <button
                    onClick={() => {
                      actions.setCustomSessionName('');
                      actions.setCustomSessionDescription('');
                      actions.setCustomSessionPhases([]);
                      actions.showModal('showCustomSessionCreator');
                    }}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    + Create Custom Session
                  </button>
                </div>

                {profiles[currentProfile]?.customSessions && Object.keys(profiles[currentProfile].customSessions).length > 0 ? (
                  <div className="grid gap-4">
                    {Object.entries(profiles[currentProfile].customSessions).map(([sessionName, sessionData]: [string, any]) => (
                      <div key={sessionName} className="p-4 bg-gray-100 dark:bg-deep-700 rounded-lg border border-gray-300 dark:border-deep-600">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white">{sessionName}</h4>
                          <button
                            onClick={() => {
                              const { [sessionName]: _removed, ...remainingSessions } = profiles[currentProfile]?.customSessions || {};
                              actions.updateProfile(currentProfile, { customSessions: remainingSessions });
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Delete custom session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {sessionData.description && (
                          <p className="text-gray-500 dark:text-deep-300 text-sm mb-3">{sessionData.description}</p>
                        )}
                        <div className="text-sm text-gray-400 dark:text-deep-400">
                          <span className="font-medium">Phases:</span> {sessionData.phases.length}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-100 dark:bg-deep-700 rounded-lg border border-gray-300 dark:border-deep-600 text-center">
                    <p className="text-gray-500 dark:text-deep-300 text-sm">No custom sessions created yet.</p>
                    <p className="text-gray-400 dark:text-deep-400 text-xs mt-1">Click "Create Custom Session" to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* Data Management */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {'\u{1F4BE}'} Data Management
          </h2>
          <div className="space-y-4">
            <p className="text-gray-500 dark:text-deep-300">
              Export your training data for backup or import data from previous sessions.
            </p>

            <div className="flex gap-4">
              <button
                onClick={exportData}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Training Data
              </button>

              <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Import Training Data
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Safety Information */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {'\u26A0\uFE0F'} Safety Information
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-red-900/20 rounded-lg border border-red-700">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Important Safety Notice</h3>
              <p className="text-gray-500 dark:text-deep-300 text-sm">
                This application is for educational and training purposes only. Breath-hold training can be
                dangerous if not practiced safely. Always train with a buddy or in a safe environment,
                never push beyond your limits, and consult with a medical professional before starting
                breath-hold training.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{'\u2705'} Safe Practices</h4>
                <ul className="text-gray-500 dark:text-deep-300 text-sm space-y-1">
                  <li>• Train with a buddy or in safe environment</li>
                  <li>• Never practice in water</li>
                  <li>• Listen to your body</li>
                  <li>• Don't push beyond your limits</li>
                </ul>
              </div>

              <div className="p-4 bg-white dark:bg-deep-800 rounded-lg border border-gray-200 dark:border-deep-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{'\u{1F6AB}'} What to Avoid</h4>
                <ul className="text-gray-500 dark:text-deep-300 text-sm space-y-1">
                  <li>• Training alone in water</li>
                  <li>• Ignoring warning signs</li>
                  <li>• Training while tired or ill</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
