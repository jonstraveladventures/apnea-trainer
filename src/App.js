import React, { useState, useEffect } from 'react';
import { Calendar, Timer as TimerIcon, BarChart3, Settings, Save, Download, Upload, X } from 'lucide-react';
import Timer from './components/Timer';
import SessionCard from './components/SessionCard';
import ProgressChart from './components/ProgressChart';
import WeekPlan from './components/WeekPlan';
import { 
  generateSchedule, 
  getLatestMaxHold, 
  START_DATE,
  formatTime 
} from './utils/trainingLogic';

function App() {
  const [sessions, setSessions] = useState([]);
  const [currentView, setCurrentView] = useState('weekplan');
  const [currentMaxHold, setCurrentMaxHold] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState('default');
  const [profiles, setProfiles] = useState({
    default: { 
      name: 'Default Profile', 
      created: new Date().toISOString(),
      sessions: [],
      currentMaxHold: null
    }
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMaxHoldModal, setShowMaxHoldModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileMaxHold, setNewProfileMaxHold] = useState('');
  const [notification, setNotification] = useState(null);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, notification.duration || 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Initialize default profile with training schedule
  const initializeDefaultProfile = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const defaultSchedule = generateSchedule(START_DATE, endDate, 240);
    
    return {
      name: 'Default Profile',
      created: new Date().toISOString(),
      sessions: defaultSchedule,
      currentMaxHold: 240
    };
  };

  // Load data on app start
  useEffect(() => {
    loadData();
  }, []);

  // Load profile data when currentProfile changes
  useEffect(() => {
    if (profiles[currentProfile]) {
      const profileData = profiles[currentProfile];
      setSessions(profileData.sessions || []);
      setCurrentMaxHold(profileData.currentMaxHold || null);
    }
  }, [currentProfile, profiles]);

  // Regenerate schedule when max hold changes
  useEffect(() => {
    if (currentMaxHold !== null) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Generate 30 days ahead
      
      const newSchedule = generateSchedule(START_DATE, endDate, currentMaxHold);
      
      // Merge with existing sessions to preserve user data
      const mergedSessions = newSchedule.map(newSession => {
        const existingSession = sessions.find(s => s.date === newSession.date);
        return existingSession ? { ...newSession, ...existingSession } : newSession;
      });
      
      setSessions(mergedSessions);
    }
  }, [currentMaxHold]);

  const loadData = async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.loadData();
        if (result.success && result.data) {
          // Load profiles
          setProfiles(result.data.profiles || {
            default: initializeDefaultProfile()
          });
          
          // Load current profile data
          const profileData = result.data.profiles?.[currentProfile];
          if (profileData) {
            setSessions(profileData.sessions || []);
            setCurrentMaxHold(profileData.currentMaxHold || 240);
          } else {
            // Initialize with default schedule
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);
            const defaultSchedule = generateSchedule(START_DATE, endDate, 240);
            setSessions(defaultSchedule);
            setCurrentMaxHold(240);
          }
        } else {
          // Initialize with default profile
          const defaultProfile = initializeDefaultProfile();
          setProfiles({ default: defaultProfile });
          setSessions(defaultProfile.sessions);
          
          // Show max hold modal for new users
          if (!result.data) {
            setNewProfileName('Default Profile');
            setNewProfileMaxHold('240');
            setShowMaxHoldModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async () => {
    try {
      if (window.electronAPI) {
        // Update current profile data
        const updatedProfiles = {
          ...profiles,
          [currentProfile]: {
            ...profiles[currentProfile],
            sessions,
            currentMaxHold,
            lastUpdated: new Date().toISOString()
          }
        };
        
        const data = {
          profiles: updatedProfiles,
          currentProfile,
          lastUpdated: new Date().toISOString()
        };
        await window.electronAPI.saveData(data);
        setProfiles(updatedProfiles);
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleSessionUpdate = (date, updatedSession) => {
    setSessions(prev => prev.map(s => s.date === date ? updatedSession : s));
    
    // Update current max hold if this session has a new max hold
    if (updatedSession.actualMaxHold) {
      const latestMaxHold = getLatestMaxHold([...sessions.filter(s => s.date !== date), updatedSession]);
      if (latestMaxHold && latestMaxHold > (currentMaxHold || 0)) {
        console.log(`Updating max hold from ${currentMaxHold} to ${latestMaxHold} seconds`);
        setCurrentMaxHold(latestMaxHold);
        
        // Show notification
        setNotification({
          type: 'success',
          message: `🎉 New personal best! Max hold updated to ${formatTime(latestMaxHold)}`,
          duration: 5000
        });
        
        // Update the profile with the new max hold
        const updatedProfiles = {
          ...profiles,
          [currentProfile]: {
            ...profiles[currentProfile],
            currentMaxHold: latestMaxHold,
            lastUpdated: new Date().toISOString()
          }
        };
        setProfiles(updatedProfiles);
        
        // Save the updated profile
        if (window.electronAPI) {
          const data = {
            profiles: updatedProfiles,
            currentProfile,
            lastUpdated: new Date().toISOString()
          };
          window.electronAPI.saveData(data);
        }
      }
    }
  };

  const handleToggleComplete = (date) => {
    setSessions(prev => prev.map(s => 
      s.date === date ? { ...s, completed: !s.completed } : s
    ));
  };

  const handleTimerComplete = (sessionTime) => {
    // Auto-save the session time to today's session
    const today = new Date().toISOString().split('T')[0];
    const todaySession = sessions.find(s => s.date === today);
    
    if (todaySession) {
      const updatedSession = {
        ...todaySession,
        sessionTime: sessionTime,
        completed: true
      };
      handleSessionUpdate(today, updatedSession);
    }
  };

  const handleAddCustomSession = (sessionData) => {
    // Log the custom session with full configuration
    console.log('Custom session added:', sessionData);
    
    // In a full implementation, this would:
    // 1. Add the custom session type to available session types
    // 2. Store the configuration for use in the timer
    // 3. Update the session templates
    
    // For now, we'll just log it and could extend this later
    // to actually integrate custom session types into the system
  };

  const switchProfile = async (profileId) => {
    // Save current profile data first
    await saveData();
    
    // Switch to new profile
    setCurrentProfile(profileId);
    
    // Load new profile data
    const profileData = profiles[profileId];
    if (profileData) {
      setSessions(profileData.sessions || []);
      setCurrentMaxHold(profileData.currentMaxHold || null);
    } else {
      // Initialize with default schedule for new profile
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const defaultSchedule = generateSchedule(START_DATE, endDate, null);
      setSessions(defaultSchedule);
      setCurrentMaxHold(null);
    }
  };

  const createProfile = async (profileName) => {
    setNewProfileName(profileName);
    setNewProfileMaxHold('240');
    setShowProfileModal(false);
    setShowMaxHoldModal(true);
  };

  const createProfileWithMaxHold = async () => {
    const maxHold = parseInt(newProfileMaxHold) || null;
    const profileId = `profile_${Date.now()}`;
    
    // Initialize new profile with schedule based on max hold
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const schedule = generateSchedule(START_DATE, endDate, maxHold);
    
    const newProfile = {
      name: newProfileName,
      created: new Date().toISOString(),
      sessions: schedule,
      currentMaxHold: maxHold
    };
    
    const updatedProfiles = {
      ...profiles,
      [profileId]: newProfile
    };
    
    // Update profiles state first
    setProfiles(updatedProfiles);
    
    // Then switch to the new profile
    setCurrentProfile(profileId);
    setSessions(schedule);
    setCurrentMaxHold(maxHold);
    
    setShowMaxHoldModal(false);
    setNewProfileName('');
    setNewProfileMaxHold('');
  };

  const deleteProfile = async (profileId) => {
    if (profileId === 'default') {
      alert('Cannot delete the default profile');
      return;
    }
    
    if (Object.keys(profiles).length <= 1) {
      alert('Cannot delete the last profile');
      return;
    }
    
    const updatedProfiles = { ...profiles };
    delete updatedProfiles[profileId];
    
    setProfiles(updatedProfiles);
    
    // Switch to default profile if current profile is being deleted
    if (currentProfile === profileId) {
      await switchProfile('default');
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ sessions, currentMaxHold }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apnea-training-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setSessions(data.sessions || []);
          setCurrentMaxHold(data.currentMaxHold || null);
        } catch (error) {
          console.error('Error parsing imported data:', error);
        }
      };
      reader.readAsText(file);
    }
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
  const todaySession = sessions.find(s => s.date === today);
  const completedSessions = sessions.filter(s => s.completed).length;

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
              {notification.type === 'success' ? '🎉' : '⚠️'}
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
      
      {/* Header */}
      <header className="bg-deep-800 border-b border-deep-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ocean-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🐬</span>
            </div>
            <h1 className="text-xl font-bold">Apnea Trainer</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-deep-400">
              {completedSessions} sessions completed
            </div>
            
            {/* Max Hold Input */}
            <div className="flex items-center gap-2">
              <span className="text-deep-400 text-sm">Max Hold:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={currentMaxHold || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || null;
                    setCurrentMaxHold(value);
                    // Save immediately when max hold changes
                    if (value !== null) {
                      const updatedProfiles = {
                        ...profiles,
                        [currentProfile]: {
                          ...profiles[currentProfile],
                          currentMaxHold: value,
                          lastUpdated: new Date().toISOString()
                        }
                      };
                      setProfiles(updatedProfiles);
                      // Trigger save
                      if (window.electronAPI) {
                        const data = {
                          profiles: updatedProfiles,
                          currentProfile,
                          lastUpdated: new Date().toISOString()
                        };
                        window.electronAPI.saveData(data);
                      }
                    }
                  }}
                  placeholder="Enter max hold (seconds)"
                  className="w-20 bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white text-sm text-center"
                  min="30"
                  max="600"
                />
                <span className="text-deep-400 text-xs">sec</span>
              </div>
            </div>
            
            {/* Profile Selector */}
            <div className="flex items-center gap-2">
              <select
                value={currentProfile}
                onChange={(e) => switchProfile(e.target.value)}
                className="bg-deep-700 border border-deep-600 rounded px-3 py-1 text-sm text-white"
              >
                {Object.entries(profiles).map(([id, profile]) => (
                  <option key={id} value={id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowProfileModal(true)}
                className="btn-secondary flex items-center gap-1 text-xs px-2 py-1"
              >
                <Settings className="w-3 h-3" />
                Profiles
              </button>
            </div>
            
            <button
              onClick={saveData}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-deep-800 border-b border-deep-700 px-6 py-2">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentView('weekplan')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'weekplan' 
                ? 'bg-ocean-600 text-white' 
                : 'text-deep-400 hover:text-white hover:bg-deep-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Week Plan
          </button>
          
          <button
            onClick={() => setCurrentView('timer')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'timer' 
                ? 'bg-ocean-600 text-white' 
                : 'text-deep-400 hover:text-white hover:bg-deep-700'
            }`}
          >
            <TimerIcon className="w-4 h-4" />
            Timer
          </button>
          
          <button
            onClick={() => setCurrentView('progress')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'progress' 
                ? 'bg-ocean-600 text-white' 
                : 'text-deep-400 hover:text-white hover:bg-deep-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Progress
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {currentView === 'weekplan' && (
          <div className="max-w-7xl mx-auto">
            <WeekPlan 
              sessions={sessions}
              onSessionUpdate={handleSessionUpdate}
              onAddCustomSession={handleAddCustomSession}
              onToggleComplete={handleToggleComplete}
              currentMaxHold={currentMaxHold}
            />
          </div>
        )}

        {currentView === 'timer' && (
          <div className="max-w-4xl mx-auto">
            <Timer 
              onSessionComplete={handleTimerComplete} 
              todaySession={todaySession}
              onSessionUpdate={handleSessionUpdate}
              sessions={sessions}
              currentMaxHold={currentMaxHold}
            />
          </div>
        )}

        {currentView === 'progress' && (
          <div className="max-w-6xl mx-auto">
            <ProgressChart sessions={sessions} />
          </div>
        )}
      </main>

      {/* Settings Panel */}
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

      {/* Profile Management Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-deep-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Profile Management</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-deep-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Current Profiles */}
              <div>
                <h4 className="text-sm font-medium text-deep-300 mb-2">Current Profiles</h4>
                <div className="space-y-2">
                  {Object.entries(profiles).map(([id, profile]) => (
                    <div key={id} className="flex items-center justify-between p-3 bg-deep-700 rounded">
                      <div>
                        <div className="text-white font-medium">{profile.name}</div>
                        <div className="text-xs text-deep-400">
                          Created: {new Date(profile.created).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentProfile === id && (
                          <span className="text-xs bg-ocean-600 text-white px-2 py-1 rounded">Active</span>
                        )}
                        {id !== 'default' && (
                          <button
                            onClick={() => deleteProfile(id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create New Profile */}
              <div>
                <h4 className="text-sm font-medium text-deep-300 mb-2">Create New Profile</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="newProfileName"
                    placeholder="Enter profile name"
                    className="flex-1 bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const name = e.target.value.trim();
                        if (name) {
                          createProfile(name);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const name = document.getElementById('newProfileName').value.trim();
                      if (name) {
                        createProfile(name);
                        document.getElementById('newProfileName').value = '';
                      }
                    }}
                    className="btn-primary px-4 py-2"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  onChange={(e) => setNewProfileMaxHold(e.target.value)}
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
    </div>
  );
}

export default App; 