import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Settings, Download, Upload, X } from 'lucide-react';
import { useAppContext } from './context/AppContext';
import Timer from './components/Timer';
import ProgressChart from './components/ProgressChart';
import WeekPlan from './components/WeekPlan';
import SettingsView from './components/SettingsView';
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
import OnboardingModal from './components/modals/OnboardingModal';
import { Session, Profile, WeeklySchedule, CustomPhase } from './types';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  // ---- All state now comes from AppContext ----
  const { state, actions } = useAppContext();
  const {
    sessions, currentMaxHold, isLoading,
    currentProfile, profiles,
    showOnboarding, showProfileModal, showMaxHoldModal, showCustomSessionCreator,
    customSessionName, customSessionDescription, customSessionPhases,
    showPhaseCreator, currentPhaseType,
    showWeeklyScheduleEditor, showTemplateEditor, editingSessionType,
    weeklySchedule, newProfileName, newProfileMaxHold, notification
  } = state;

  const location = useLocation();

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

  const handleOnboardingComplete = (maxHoldSeconds: number, _focus: string) => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const schedule = generateSchedule(START_DATE, endDate, maxHoldSeconds);

    const onboardedProfile: Profile = {
      name: 'Default Profile',
      created: new Date().toISOString(),
      sessions: schedule,
      currentMaxHold: maxHoldSeconds,
      customSessions: {},
      weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE },
      hasCompletedOnboarding: true,
    };

    actions.createProfile('default', onboardedProfile);
    actions.setCurrentProfile('default');
    actions.setSessions(schedule);
    actions.setCurrentMaxHold(maxHoldSeconds);
    actions.hideModal('showOnboarding');

    actions.setNotification({
      type: 'success',
      message: 'Welcome aboard! Your training plan is ready.',
      duration: 5000,
    });
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

  const handleCreatePhase = (phaseData: Omit<CustomPhase, 'id'>) => {
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
      <div className="min-h-screen bg-gray-100 dark:bg-deep-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500 mx-auto mb-4"></div>
          <div className="text-gray-400 dark:text-deep-400">Loading Apnea Trainer...</div>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todaySession = sessions.find((s: Session) => s.date === today);
  const completedSessions = sessions.filter((s: Session) => s.completed).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-deep-900">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
          notification.type === 'success'
            ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100'
            : 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-100'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {notification.type === 'success' ? '\u{1F389}' : '\u{26A0}\u{FE0F}'}
            </span>
            <span>{notification.message}</span>
            <button
              onClick={() => actions.clearNotification()}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <AppHeader onSave={actions.saveData} />

      {/* Main Content */}
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Navigate to="/weekplan" replace />} />
          <Route path="/weekplan" element={
            <ErrorBoundary fallbackTitle="Week Plan error">
              <div className="max-w-7xl mx-auto">
                <WeekPlan
                  sessions={sessions}
                  onSessionUpdate={handleSessionUpdate}
                  onAddCustomSession={handleAddPhase}
                  onToggleComplete={handleToggleComplete}
                  currentMaxHold={currentMaxHold}
                  customSessions={profiles[currentProfile]?.customSessions || {}}
                />
              </div>
            </ErrorBoundary>
          } />
          <Route path="/timer" element={
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
          } />
          <Route path="/progress" element={
            <ErrorBoundary fallbackTitle="Progress chart error">
              <div className="max-w-6xl mx-auto">
                <ProgressChart sessions={sessions} />
              </div>
            </ErrorBoundary>
          } />
          <Route path="/settings" element={
            <ErrorBoundary fallbackTitle="Settings error">
              <SettingsView />
            </ErrorBoundary>
          } />
        </Routes>
      </main>

      {/* Quick Actions Panel - Only show on Week Plan page */}
      {location.pathname === '/weekplan' && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-white dark:bg-deep-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-deep-700">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
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

      {/* Onboarding Modal (first launch) */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <ProfileModal
        onSwitchProfile={switchProfile}
        onCreateProfile={createProfile}
        onDeleteProfile={deleteProfile}
      />

      {/* Max Hold Modal for New Profile */}
      {showMaxHoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-deep-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Set Max Breath Hold</h3>
              <button
                onClick={() => actions.hideModal('showMaxHoldModal')}
                className="text-gray-400 dark:text-deep-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-deep-300">
                <p>Profile: <strong>{newProfileName}</strong></p>
                <p className="mt-2">Please enter your current max breath hold time. This will be used to calculate personalized training sessions.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-deep-300 mb-2">
                  Max Breath Hold Time (seconds)
                </label>
                <input
                  type="number"
                  value={newProfileMaxHold}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => actions.setNewProfileMaxHold(e.target.value)}
                  placeholder="e.g., 240 for 4 minutes"
                  className="w-full bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                  min="30"
                  max="600"
                  autoFocus
                />
                <p className="text-xs text-gray-400 dark:text-deep-400 mt-1">
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
                  onClick={() => actions.hideModal('showMaxHoldModal')}
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
