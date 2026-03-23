import React, { useEffect } from 'react';
import { Calendar, Settings, Download, Upload, X, Trash2 } from 'lucide-react';
import { useAppContext } from './context/AppContext';
import Timer from './components/Timer';
import ProgressChart from './components/ProgressChart';
import WeekPlan from './components/WeekPlan';
import {
  generateSchedule,
  getLatestMaxHold,
  START_DATE,
  formatTime
} from './utils/trainingLogic';
import { DEFAULT_WEEKLY_SCHEDULE } from './constants/defaults';
import TemplateEditorModal from './components/modals/TemplateEditorModal';
import AppHeader from './components/AppHeader';
import ProfileModal from './components/modals/ProfileModal';
import WeeklyScheduleEditorModal from './components/modals/WeeklyScheduleEditorModal';
import CustomSessionCreatorModal from './components/modals/CustomSessionCreatorModal';
import { Session, Profile, WeeklySchedule, CustomPhase } from './types';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  // ---- All state now comes from AppContext ----
  const { state, actions } = useAppContext();
  const {
    sessions, currentView, currentMaxHold, isLoading,
    currentProfile, profiles,
    showProfileModal, showMaxHoldModal, showCustomSessionCreator,
    customSessionName, customSessionDescription, customSessionPhases,
    showPhaseCreator, currentPhaseType,
    showWeeklyScheduleEditor, showTemplateEditor, editingSessionType,
    weeklySchedule, newProfileName, newProfileMaxHold, notification
  } = state;

  // ---- Compatibility shims: map old setXxx names to context actions ----
  // These let the JSX keep using the same names while state lives in context.
  // They will be removed when components are extracted in Phase 2.
  const setCurrentView = actions.setCurrentView;
  const setNotification = (v: any) => v === null ? actions.clearNotification() : actions.setNotification(v);
  const setCurrentMaxHold = actions.setCurrentMaxHold;
  const setSessions = actions.setSessions;
  const setCurrentProfile = actions.setCurrentProfile;
  const setNewProfileName = actions.setNewProfileName;
  const setNewProfileMaxHold = actions.setNewProfileMaxHold;
  const setCustomSessionName = actions.setCustomSessionName;
  const setCustomSessionDescription = actions.setCustomSessionDescription;
  const setEditingSessionType = actions.setEditingSessionType;
  const setShowProfileModal = (v: boolean) => v ? actions.showModal('showProfileModal') : actions.hideModal('showProfileModal');
  const setShowMaxHoldModal = (v: boolean) => v ? actions.showModal('showMaxHoldModal') : actions.hideModal('showMaxHoldModal');
  const setShowCustomSessionCreator = (v: boolean) => v ? actions.showModal('showCustomSessionCreator') : actions.hideModal('showCustomSessionCreator');
  const setShowPhaseCreator = (v: boolean) => v ? actions.showModal('showPhaseCreator') : actions.hideModal('showPhaseCreator');
  const setShowWeeklyScheduleEditor = (v: boolean) => v ? actions.showModal('showWeeklyScheduleEditor') : actions.hideModal('showWeeklyScheduleEditor');
  const setShowTemplateEditor = (v: boolean) => v ? actions.showModal('showTemplateEditor') : actions.hideModal('showTemplateEditor');
  // Regenerate schedule when max hold changes
  useEffect(() => {
    if (currentMaxHold !== null) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const newSchedule = generateSchedule(START_DATE, endDate, currentMaxHold);

      // Merge with existing sessions to preserve user data
      const mergedSessions = newSchedule.map((newSession: Session) => {
        const existingSession = sessions.find((s: Session) => s.date === newSession.date);
        return existingSession ? { ...newSession, ...existingSession } : newSession;
      });

      actions.setSessions(mergedSessions);
    }
  }, [currentMaxHold]); // eslint-disable-line

  // ---- Handler functions (thin wrappers over context actions) ----

  const handleSessionUpdate = (date: string, updatedSession: Session) => {
    actions.updateSession(date, updatedSession);

    // Update current max hold if this session has a new max hold
    if (updatedSession.actualMaxHold) {
      const latestMaxHold = getLatestMaxHold([...sessions.filter((s: Session) => s.date !== date), updatedSession]);
      if (latestMaxHold && latestMaxHold > (currentMaxHold || 0)) {
        actions.setCurrentMaxHold(latestMaxHold);
        actions.setNotification({
          type: 'success',
          message: `New personal best! Max hold updated to ${formatTime(latestMaxHold)}`,
          duration: 5000
        });
        actions.updateProfile(currentProfile, { currentMaxHold: latestMaxHold });
      }
    }
  };

  const handleToggleComplete = (date: string) => {
    actions.toggleSessionComplete(date);
  };

  const handleTimerComplete = (sessionTime: number) => {
    const today = new Date().toISOString().split('T')[0];
    const todaySession = sessions.find((s: Session) => s.date === today);

    if (todaySession) {
      const updatedSession = {
        ...todaySession,
        sessionTime: sessionTime,
        completed: true
      };
      handleSessionUpdate(today, updatedSession);
    }
  };

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

  const createProfileWithMaxHold = () => {
    const maxHold = parseInt(newProfileMaxHold) || null;
    const profileId = `profile_${Date.now()}`;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const schedule = generateSchedule(START_DATE, endDate, maxHold);

    const newProfile: Profile = {
      name: newProfileName,
      created: new Date().toISOString(),
      sessions: schedule,
      currentMaxHold: maxHold,
      customSessions: {},
      weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE }
    };

    actions.createProfile(profileId, newProfile);
    actions.setCurrentProfile(profileId);
    actions.setSessions(schedule);
    actions.setCurrentMaxHold(maxHold);
    actions.hideModal('showMaxHoldModal');
    actions.setNewProfileName('');
    actions.setNewProfileMaxHold('');
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

  const handleAddPhase = (phaseType: string) => {
    actions.setCurrentPhaseType(phaseType);
    actions.showModal('showPhaseCreator');
  };

  const handleCreatePhase = (phaseData: any) => {
    actions.setCustomSessionPhases([...customSessionPhases, { ...phaseData, id: Date.now() }]);
    actions.hideModal('showPhaseCreator');
  };

  const handleRemovePhase = (phaseId: number) => {
    actions.setCustomSessionPhases(customSessionPhases.filter((phase: CustomPhase) => phase.id !== phaseId));
  };

  const handleSaveCustomSession = () => {
    if (!customSessionName.trim() || customSessionPhases.length === 0) return;

    const newSession = {
      name: customSessionName,
      description: customSessionDescription,
      phases: customSessionPhases,
      stretchConfirmation: true,
      tidalBreathingDuration: 120
    };

    actions.updateProfile(currentProfile, {
      customSessions: {
        ...profiles[currentProfile]?.customSessions,
        [customSessionName]: newSession
      }
    });

    actions.setNotification({
      type: 'success',
      message: `Custom session "${customSessionName}" saved to profile!`,
      duration: 3000
    });

    actions.hideModal('showCustomSessionCreator');
    actions.setCustomSessionName('');
    actions.setCustomSessionDescription('');
    actions.setCustomSessionPhases([]);
  };

  const handleWeeklyScheduleChange = (day: string, sessionType: string) => {
    actions.setWeeklySchedule({
      ...weeklySchedule,
      [day]: sessionType
    });
  };

  const handleSaveWeeklySchedule = () => {
    actions.updateProfile(currentProfile, { weeklySchedule });

    // Regenerate the schedule with the new weekly pattern
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const generateCustomSchedule = (startDate: string, endDate: Date, maxHoldSeconds: number | null): any[] => {
      const schedule: any[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const sessionType = (weeklySchedule as any)[dayOfWeek] || 'CO₂ Tolerance';

        schedule.push({
          date: currentDate.toISOString().split('T')[0],
          focus: sessionType,
          completed: false,
          sessionTime: 0,
          actualMaxHold: maxHoldSeconds
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return schedule;
    };

    const newSchedule = generateCustomSchedule(START_DATE, endDate, currentMaxHold);
    actions.setSessions(newSchedule);

    actions.setNotification({
      type: 'success',
      message: 'Weekly schedule updated and applied to your training plan!',
      duration: 3000
    });

    actions.hideModal('showWeeklyScheduleEditor');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500 mx-auto mb-4"></div>
          <div className="text-deep-400">Loading Apnea Trainer...</div>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todaySession = sessions.find((s: Session) => s.date === today);
  const completedSessions = sessions.filter((s: Session) => s.completed).length;

  return (
    <div className="min-h-screen bg-deep-900">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
          notification.type === 'success'
            ? 'bg-green-900 border-green-700 text-green-100'
            : 'bg-red-900 border-red-700 text-red-100'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {notification.type === 'success' ? '\u{1F389}' : '\u{26A0}\u{FE0F}'}
            </span>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <AppHeader onSave={actions.saveData} />

      {/* Main Content */}
      <main className="p-6">
        {currentView === 'weekplan' && (
          <ErrorBoundary fallbackTitle="Week Plan error">
          <div className="max-w-7xl mx-auto">
            <WeekPlan
              sessions={sessions}
              onSessionUpdate={handleSessionUpdate}
              onAddCustomSession={(handleAddPhase as any)}
              onToggleComplete={handleToggleComplete}
              currentMaxHold={currentMaxHold}
              customSessions={profiles[currentProfile]?.customSessions || {}}
            />
          </div>
          </ErrorBoundary>
        )}

        {currentView === 'timer' && (
          <ErrorBoundary fallbackTitle="Timer error">
          <div className="max-w-4xl mx-auto">
            <Timer
              onSessionComplete={handleTimerComplete}
              todaySession={todaySession}
              onSessionUpdate={handleSessionUpdate}
              sessions={sessions}
              currentMaxHold={currentMaxHold}
              customSessions={profiles[currentProfile]?.customSessions || {}}
            />
          </div>
          </ErrorBoundary>
        )}

        {currentView === 'progress' && (
          <ErrorBoundary fallbackTitle="Progress chart error">
          <div className="max-w-6xl mx-auto">
            <ProgressChart sessions={sessions} />
          </div>
          </ErrorBoundary>
        )}

        {currentView === 'settings' && (
          <ErrorBoundary fallbackTitle="Settings error">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Profile Management */}
              <div className="card">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  {'\u{1F464}'} Profile Management
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-deep-800 rounded-lg border border-deep-700">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Current Profile</h3>
                      <p className="text-deep-300 text-sm">Manage your training profile and max hold time</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={currentProfile}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => switchProfile(e.target.value)}
                        className="bg-deep-700 border border-deep-600 rounded px-3 py-2 text-sm text-white"
                      >
                        {Object.entries(profiles).map(([id, profile]: [string, Profile]) => (
                          <option key={id} value={id}>
                            {profile.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowProfileModal(true)}
                        className="btn-secondary flex items-center gap-1 text-sm px-3 py-2"
                      >
                        <Settings className="w-4 h-4" />
                        Manage Profiles
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-deep-800 rounded-lg border border-deep-700">
                    <div className="flex flex-col">
                      <span className="text-deep-400 text-sm">Max Hold Time:</span>
                      <span className="text-deep-500 text-xs">(add manually if needed)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={currentMaxHold || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = parseInt(e.target.value) || null;
                          setCurrentMaxHold(value);
                          if (value !== null) {
                            actions.updateProfile(currentProfile, { currentMaxHold: value });
                          }
                        }}
                        placeholder="Enter max hold (seconds)"
                        className="w-24 bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white text-sm text-center"
                        min="30"
                        max="600"
                      />
                      <span className="text-deep-400 text-sm">seconds</span>
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
                  <p className="text-deep-300">
                    Customize which session types are assigned to each day of the week. This determines your training schedule.
                  </p>

                  <button
                    onClick={() => setShowWeeklyScheduleEditor(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Edit Weekly Schedule
                  </button>
                </div>
              </div>

              {/* Session Templates */}
              <div className="card">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  {'\u2699\uFE0F'} Session Templates
                </h2>
                <div className="space-y-4">
                  <p className="text-deep-300">
                    Customize the training parameters for each session type. These settings control the duration,
                    intensity, and structure of your training sessions.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">Comfortable CO₂ Training</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Gradual CO₂ tolerance building without contractions, focusing on comfort and adaptation.
                      </p>
                      <button
                        onClick={() => {
                          setEditingSessionType('Comfortable CO₂ Training');
                          setShowTemplateEditor(true);
                        }}
                        className="btn-primary w-full text-sm"
                      >
                        Customize Comfortable CO₂ Training
                      </button>
                    </div>

                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">Traditional CO₂ Tables</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Progressive breath-hold tables with decreasing rest periods to build CO₂ tolerance.
                      </p>
                      <button
                        onClick={() => {
                          setEditingSessionType('Traditional CO₂ Tables');
                          setShowTemplateEditor(true);
                        }}
                        className="btn-primary w-full text-sm"
                      >
                        Customize Traditional CO₂ Tables
                      </button>
                    </div>

                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">Advanced CO₂ Table</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Dynamic CO₂ tolerance training based on your current max hold time.
                      </p>
                      <button
                        onClick={() => {
                          setEditingSessionType('Advanced CO₂ Table');
                          setShowTemplateEditor(true);
                        }}
                        className="btn-primary w-full text-sm"
                      >
                        Customize Advanced CO₂ Table
                      </button>
                    </div>

                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">O₂ Tolerance</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Progressive breath-holds starting at 60% of max hold time, increasing by 10-15% each round, progressing up to 90-95% of max hold time (near personal maximum). Based on research showing O₂ tables should progress to near-maximum for optimal adaptation.
                      </p>
                      <button
                        onClick={() => {
                          setEditingSessionType('O₂ Tolerance');
                          setShowTemplateEditor(true);
                        }}
                        className="btn-primary w-full text-sm"
                      >
                        Customize O₂ Training
                      </button>
                    </div>

                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">Max Breath-Hold Option 1</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Evidence-based training using maximal breath-holds for optimal physiological adaptation. 2-3 maximal attempts with 3-4 minute rest periods. Studies demonstrate 15-60% improvements in breath-hold duration.
                      </p>
                      <button
                        onClick={() => {
                          setEditingSessionType('Maximal Breath-Hold Training');
                          setShowTemplateEditor(true);
                        }}
                        className="btn-primary w-full text-sm"
                      >
                        Customize Max Breath-Hold Option 1
                      </button>
                    </div>

                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">Max Breath-Hold Option 2</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Progressive training with stretch confirmation and CO₂ tolerance integration.
                      </p>
                      <button
                        onClick={() => {
                          setEditingSessionType('Max Breath-Hold');
                          setShowTemplateEditor(true);
                        }}
                        className="btn-primary w-full text-sm"
                      >
                        Customize Max Breath-Hold Option 2
                      </button>
                    </div>

                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">Breath Control</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Advanced breathing techniques including diaphragmatic, alternate nostril, and box breathing.
                      </p>
                      <button
                        onClick={() => {
                          setEditingSessionType('Breath Control');
                          setShowTemplateEditor(true);
                        }}
                        className="btn-primary w-full text-sm"
                      >
                        Customize Breath Control
                      </button>
                    </div>

                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">Mental + Technique</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Visualization, mindfulness, and progressive relaxation techniques for mental training.
                      </p>
                      <button
                        onClick={() => {
                          setEditingSessionType('Mental + Technique');
                          setShowTemplateEditor(true);
                        }}
                        className="btn-primary w-full text-sm"
                      >
                        Customize Mental Training
                      </button>
                    </div>

                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">Recovery & Flexibility</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Stretching and recovery sessions for complete training and physical maintenance.
                      </p>
                      <button
                        onClick={() => {
                          setEditingSessionType('Recovery & Flexibility');
                          setShowTemplateEditor(true);
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
                            setShowCustomSessionCreator(true);
                          }}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          + Create Custom Session
                        </button>
                      </div>

                      {profiles[currentProfile]?.customSessions && Object.keys(profiles[currentProfile].customSessions).length > 0 ? (
                        <div className="grid gap-4">
                          {Object.entries(profiles[currentProfile].customSessions).map(([sessionName, sessionData]: [string, any]) => (
                            <div key={sessionName} className="p-4 bg-deep-700 rounded-lg border border-deep-600">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-md font-semibold text-white">{sessionName}</h4>
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
                                <p className="text-deep-300 text-sm mb-3">{sessionData.description}</p>
                              )}
                              <div className="text-sm text-deep-400">
                                <span className="font-medium">Phases:</span> {sessionData.phases.length}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-deep-700 rounded-lg border border-deep-600 text-center">
                          <p className="text-deep-300 text-sm">No custom sessions created yet.</p>
                          <p className="text-deep-400 text-xs mt-1">Click "Create Custom Session" to get started.</p>
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
                  <p className="text-deep-300">
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
                    <p className="text-deep-300 text-sm">
                      This application is for educational and training purposes only. Breath-hold training can be
                      dangerous if not practiced safely. Always train with a buddy or in a safe environment,
                      never push beyond your limits, and consult with a medical professional before starting
                      breath-hold training.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h4 className="font-semibold text-white mb-2">{'\u2705'} Safe Practices</h4>
                      <ul className="text-deep-300 text-sm space-y-1">
                        <li>• Train with a buddy or in safe environment</li>
                        <li>• Never practice in water</li>
                        <li>• Listen to your body</li>
                        <li>• Don't push beyond your limits</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h4 className="font-semibold text-white mb-2">{'\u{1F6AB}'} What to Avoid</h4>
                      <ul className="text-deep-300 text-sm space-y-1">
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
          </ErrorBoundary>
        )}
      </main>

      {/* Settings Panel - Only show on Week Plan page */}
      {currentView === 'weekplan' && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-deep-800 rounded-lg p-4 shadow-lg border border-deep-700">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Quick Actions
            </h3>

            <div className="space-y-2">
              <button
                onClick={exportData}
                className="btn-secondary w-full flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>

              <label className="btn-secondary w-full flex items-center gap-2 text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                Import Data
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
      )}

      <ProfileModal
        onSwitchProfile={switchProfile}
        onCreateProfile={createProfile}
        onDeleteProfile={deleteProfile}
      />

      {/* Max Hold Modal for New Profile */}
      {showMaxHoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-deep-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Set Max Breath Hold</h3>
              <button
                onClick={() => setShowMaxHoldModal(false)}
                className="text-deep-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-deep-300">
                <p>Profile: <strong>{newProfileName}</strong></p>
                <p className="mt-2">Please enter your current max breath hold time. This will be used to calculate personalized training sessions.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-300 mb-2">
                  Max Breath Hold Time (seconds)
                </label>
                <input
                  type="number"
                  value={newProfileMaxHold}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProfileMaxHold(e.target.value)}
                  placeholder="e.g., 240 for 4 minutes"
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  min="30"
                  max="600"
                  autoFocus
                />
                <p className="text-xs text-deep-400 mt-1">
                  Enter your best breath hold time in seconds (30-600 seconds)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={createProfileWithMaxHold}
                  className="btn-primary flex-1"
                  disabled={!newProfileMaxHold || parseInt(newProfileMaxHold) < 30}
                >
                  Create Profile
                </button>
                <button
                  onClick={() => setShowMaxHoldModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomSessionCreatorModal
        onSave={handleSaveCustomSession}
        onAddPhase={handleAddPhase}
        onCreatePhase={handleCreatePhase}
        onRemovePhase={handleRemovePhase}
      />

      <WeeklyScheduleEditorModal
        onSave={handleSaveWeeklySchedule}
        onChange={handleWeeklyScheduleChange}
      />

      {/* Template Editor Modal */}
      <TemplateEditorModal />
    </div>
  );
}

export default App;
