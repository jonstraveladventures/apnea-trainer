import React, { useState, useEffect } from 'react';
import { Calendar, Timer as TimerIcon, BarChart3, Settings, Save, Download, Upload, X, Edit3, Trash2 } from 'lucide-react';
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

// Phase Creator Component
const PhaseCreator = ({ phaseType, onCreate, onCancel, existingPhases = [] }) => {
  const [phaseData, setPhaseData] = useState({
    type: phaseType,
    duration: 60,
    durationType: 'fixed', // 'fixed', 'progressive', 'maxHold'
    progressiveChange: 10, // seconds to add/subtract
    maxHoldPercentage: 50, // percentage of max hold
    description: '',
    instructions: ''
  });

  const handleNumberChange = (field, value) => {
    if (value === '') {
      setPhaseData(prev => ({ ...prev, [field]: '' }));
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setPhaseData(prev => ({ ...prev, [field]: numValue }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure all required fields have valid values
    const validatedData = {
      ...phaseData,
      duration: phaseData.duration || 60,
      progressiveChange: phaseData.progressiveChange || 10,
      maxHoldPercentage: phaseData.maxHoldPercentage || 50
    };
    
    onCreate(validatedData);
  };

  const getPhaseFields = () => {
    // Check if there are previous phases of the same type
    const previousPhasesOfSameType = existingPhases.filter(phase => phase.type === phaseType);
    const hasPreviousPhase = previousPhasesOfSameType.length > 0;
    
    // If no previous phase and current duration type is progressive, reset to fixed
    if (!hasPreviousPhase && phaseData.durationType === 'progressive') {
      setPhaseData(prev => ({ ...prev, durationType: 'fixed' }));
    }
    
    switch (phaseType) {
      case 'hold':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Duration Type:</label>
              <select
                value={phaseData.durationType}
                onChange={(e) => setPhaseData(prev => ({ ...prev, durationType: e.target.value }))}
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
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
                <label className="text-sm text-deep-300 mb-2 block">Duration (seconds):</label>
                <input
                  type="number"
                  value={phaseData.duration}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  min="1"
                />
              </div>
            )}
            
            {phaseData.durationType === 'progressive' && (
              <div>
                <label className="text-sm text-deep-300 mb-2 block">Change from Previous Phase (seconds):</label>
                <input
                  type="number"
                  value={phaseData.progressiveChange}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, progressiveChange: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  placeholder="e.g., 10 to add 10s, -5 to subtract 5s"
                />
              </div>
            )}
            
            {phaseData.durationType === 'maxHold' && (
              <div>
                <label className="text-sm text-deep-300 mb-2 block">Percentage of Max Hold (%):</label>
                <input
                  type="number"
                  value={phaseData.maxHoldPercentage}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, maxHoldPercentage: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  min="1"
                  max="100"
                />
              </div>
            )}
            
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Description:</label>
              <input
                type="text"
                value={phaseData.description}
                onChange={(e) => setPhaseData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Progressive breath hold"
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Instructions:</label>
              <textarea
                value={phaseData.instructions}
                onChange={(e) => setPhaseData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="e.g., Take a deep breath and hold..."
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white h-20"
              />
            </div>
          </div>
        );
      
      case 'breathing':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Duration Type:</label>
              <select
                value={phaseData.durationType}
                onChange={(e) => setPhaseData(prev => ({ ...prev, durationType: e.target.value }))}
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
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
                <label className="text-sm text-deep-300 mb-2 block">Duration (seconds):</label>
                <input
                  type="number"
                  value={phaseData.duration}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  min="1"
                />
              </div>
            )}
            
            {phaseData.durationType === 'progressive' && (
              <div>
                <label className="text-sm text-deep-300 mb-2 block">Change from Previous Phase (seconds):</label>
                <input
                  type="number"
                  value={phaseData.progressiveChange}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, progressiveChange: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  placeholder="e.g., 10 to add 10s, -5 to subtract 5s"
                />
              </div>
            )}
            
            {phaseData.durationType === 'maxHold' && (
              <div>
                <label className="text-sm text-deep-300 mb-2 block">Percentage of Max Hold (%):</label>
                <input
                  type="number"
                  value={phaseData.maxHoldPercentage}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, maxHoldPercentage: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  min="1"
                  max="100"
                />
              </div>
            )}
            
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Breathing Type:</label>
              <select
                value={phaseData.description}
                onChange={(e) => setPhaseData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
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
              <label className="text-sm text-deep-300 mb-2 block">Instructions:</label>
              <textarea
                value={phaseData.instructions}
                onChange={(e) => setPhaseData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="e.g., Breathe naturally and rhythmically..."
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white h-20"
              />
            </div>
          </div>
        );
      
      case 'custom':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Phase Name:</label>
              <input
                type="text"
                value={phaseData.description}
                onChange={(e) => setPhaseData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Custom Exercise, Warm-up, Cool-down"
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Duration Type:</label>
              <select
                value={phaseData.durationType}
                onChange={(e) => setPhaseData(prev => ({ ...prev, durationType: e.target.value }))}
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
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
                <label className="text-sm text-deep-300 mb-2 block">Duration (seconds):</label>
                <input
                  type="number"
                  value={phaseData.duration}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  min="1"
                />
              </div>
            )}
            
            {phaseData.durationType === 'progressive' && (
              <div>
                <label className="text-sm text-deep-300 mb-2 block">Change from Previous Phase (seconds):</label>
                <input
                  type="number"
                  value={phaseData.progressiveChange}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, progressiveChange: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  placeholder="e.g., 10 to add 10s, -5 to subtract 5s"
                />
              </div>
            )}
            
            {phaseData.durationType === 'maxHold' && (
              <div>
                <label className="text-sm text-deep-300 mb-2 block">Percentage of Max Hold (%):</label>
                <input
                  type="number"
                  value={phaseData.maxHoldPercentage}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, maxHoldPercentage: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  min="1"
                  max="100"
                />
              </div>
            )}
            
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Instructions:</label>
              <textarea
                value={phaseData.instructions}
                onChange={(e) => setPhaseData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Describe what to do during this phase..."
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white h-20"
              />
            </div>
          </div>
        );
      
      case 'mental':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Duration Type:</label>
              <select
                value={phaseData.durationType}
                onChange={(e) => setPhaseData(prev => ({ ...prev, durationType: e.target.value }))}
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
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
                <label className="text-sm text-deep-300 mb-2 block">Duration (seconds):</label>
                <input
                  type="number"
                  value={phaseData.duration}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  min="1"
                />
              </div>
            )}
            
            {phaseData.durationType === 'progressive' && (
              <div>
                <label className="text-sm text-deep-300 mb-2 block">Change from Previous Phase (seconds):</label>
                <input
                  type="number"
                  value={phaseData.progressiveChange}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, progressiveChange: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  placeholder="e.g., 10 to add 10s, -5 to subtract 5s"
                />
              </div>
            )}
            
            {phaseData.durationType === 'maxHold' && (
              <div>
                <label className="text-sm text-deep-300 mb-2 block">Percentage of Max Hold (%):</label>
                <input
                  type="number"
                  value={phaseData.maxHoldPercentage}
                  onChange={(e) => setPhaseData(prev => ({ ...prev, maxHoldPercentage: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  min="1"
                  max="100"
                />
              </div>
            )}
            
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Mental Exercise Type:</label>
              <select
                value={phaseData.description}
                onChange={(e) => setPhaseData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
              >
                <option value="">Select mental exercise...</option>
                <option value="Visualization">Visualization</option>
                <option value="Mindfulness">Mindfulness</option>
                <option value="Relaxation">Relaxation</option>
                <option value="Focus Training">Focus Training</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-deep-300 mb-2 block">Instructions:</label>
              <textarea
                value={phaseData.instructions}
                onChange={(e) => setPhaseData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="e.g., Visualize yourself underwater..."
                className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white h-20"
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
  const [showCustomSessionCreator, setShowCustomSessionCreator] = useState(false);
  const [customSessionName, setCustomSessionName] = useState('');
  const [customSessionDescription, setCustomSessionDescription] = useState('');
  const [customSessionPhases, setCustomSessionPhases] = useState([]);
  const [showPhaseCreator, setShowPhaseCreator] = useState(false);
  const [currentPhaseType, setCurrentPhaseType] = useState('');
  const [showWeeklyScheduleEditor, setShowWeeklyScheduleEditor] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: 'CO₂ Tolerance',
    tuesday: 'Breath Control',
    wednesday: 'O₂ Tolerance',
    thursday: 'Mental + Technique',
    friday: 'Max Breath-Hold',
    saturday: 'Recovery & Flexibility',
    sunday: 'CO₂ Tolerance'
  });
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
      currentMaxHold: 240,
      customSessions: {},
      weeklySchedule: {
        monday: 'CO₂ Tolerance',
        tuesday: 'Breath Control',
        wednesday: 'O₂ Tolerance',
        thursday: 'Mental + Technique',
        friday: 'Max Breath-Hold',
        saturday: 'Recovery & Flexibility',
        sunday: 'CO₂ Tolerance'
      }
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
      setWeeklySchedule(profileData.weeklySchedule || {
        monday: 'CO₂ Tolerance',
        tuesday: 'Breath Control',
        wednesday: 'O₂ Tolerance',
        thursday: 'Mental + Technique',
        friday: 'Max Breath-Hold',
        saturday: 'Recovery & Flexibility',
        sunday: 'CO₂ Tolerance'
      });
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
      currentMaxHold: maxHold,
      customSessions: {},
      weeklySchedule: {
        monday: 'CO₂ Tolerance',
        tuesday: 'Breath Control',
        wednesday: 'O₂ Tolerance',
        thursday: 'Mental + Technique',
        friday: 'Max Breath-Hold',
        saturday: 'Recovery & Flexibility',
        sunday: 'CO₂ Tolerance'
      }
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

  const handleAddPhase = (phaseType) => {
    setCurrentPhaseType(phaseType);
    setShowPhaseCreator(true);
  };

  const handleCreatePhase = (phaseData) => {
    setCustomSessionPhases(prev => [...prev, { ...phaseData, id: Date.now() }]);
    setShowPhaseCreator(false);
  };

  const handleRemovePhase = (phaseId) => {
    setCustomSessionPhases(prev => prev.filter(phase => phase.id !== phaseId));
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
    
    // Save the custom session to the current profile
    setProfiles(prev => ({
      ...prev,
      [currentProfile]: {
        ...prev[currentProfile],
        customSessions: {
          ...prev[currentProfile].customSessions,
          [customSessionName]: newSession
        }
      }
    }));
    
    // Show success notification
    setNotification({
      type: 'success',
      message: `Custom session "${customSessionName}" saved to profile!`,
      duration: 3000
    });
    
    // Close modal and reset
    setShowCustomSessionCreator(false);
    setCustomSessionName('');
    setCustomSessionDescription('');
    setCustomSessionPhases([]);
  };

  const handleWeeklyScheduleChange = (day, sessionType) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: sessionType
    }));
  };

  const handleSaveWeeklySchedule = () => {
    // Save the weekly schedule to the current profile
    setProfiles(prev => ({
      ...prev,
      [currentProfile]: {
        ...prev[currentProfile],
        weeklySchedule: weeklySchedule
      }
    }));
    
    // Regenerate the schedule with the new weekly pattern
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Create a custom schedule generator that uses the weekly pattern
    const generateCustomSchedule = (startDate, endDate, maxHoldSeconds) => {
      const schedule = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const sessionType = weeklySchedule[dayOfWeek] || 'CO₂ Tolerance';
        
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
    setSessions(newSchedule);
    
    // Show success notification
    setNotification({
      type: 'success',
      message: 'Weekly schedule updated and applied to your training plan!',
      duration: 3000
    });
    
    setShowWeeklyScheduleEditor(false);
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
          
          <button
            onClick={() => setCurrentView('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'settings' 
                ? 'bg-ocean-600 text-white' 
                : 'text-deep-400 hover:text-white hover:bg-deep-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
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
              customSessions={profiles[currentProfile]?.customSessions || {}}
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
              customSessions={profiles[currentProfile]?.customSessions || {}}
            />
          </div>
        )}

        {currentView === 'progress' && (
          <div className="max-w-6xl mx-auto">
            <ProgressChart sessions={sessions} />
          </div>
        )}

        {currentView === 'settings' && (
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Profile Management */}
              <div className="card">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  👤 Profile Management
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
                        onChange={(e) => switchProfile(e.target.value)}
                        className="bg-deep-700 border border-deep-600 rounded px-3 py-2 text-sm text-white"
                      >
                        {Object.entries(profiles).map(([id, profile]) => (
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
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || null;
                          setCurrentMaxHold(value);
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
                  📅 Weekly Schedule
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
                  ⚙️ Session Templates
                </h2>
                <div className="space-y-4">
                  <p className="text-deep-300">
                    Customize the training parameters for each session type. These settings control the duration, 
                    intensity, and structure of your training sessions.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">CO₂ Tolerance</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Progressive breath-hold tables with decreasing rest periods to build CO₂ tolerance.
                      </p>
                      <button
                        onClick={() => setShowTemplateEditor(true)}
                        className="btn-primary w-full text-sm"
                      >
                        Customize CO₂ Training
                      </button>
                    </div>
                    
                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">O₂ Tolerance</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Extended breath-holds with long rest periods to improve oxygen utilization.
                      </p>
                      <button
                        onClick={() => setShowTemplateEditor(true)}
                        className="btn-primary w-full text-sm"
                      >
                        Customize O₂ Training
                      </button>
                    </div>
                    
                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h3 className="text-lg font-semibold text-ocean-400 mb-2">Breath Control</h3>
                      <p className="text-deep-300 text-sm mb-3">
                        Advanced breathing techniques including diaphragmatic, alternate nostril, and box breathing.
                      </p>
                      <button
                        onClick={() => setShowTemplateEditor(true)}
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
                        onClick={() => setShowTemplateEditor(true)}
                        className="btn-primary w-full text-sm"
                      >
                        Customize Mental Training
                      </button>
                    </div>
                    
                    {/* Custom Sessions */}
                    {profiles[currentProfile]?.customSessions && Object.keys(profiles[currentProfile].customSessions).length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-ocean-400 mb-4">🎯 Custom Sessions</h3>
                        <div className="grid gap-4">
                          {Object.entries(profiles[currentProfile].customSessions).map(([sessionName, sessionData]) => (
                            <div key={sessionName} className="p-4 bg-deep-700 rounded-lg border border-deep-600">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-md font-semibold text-white">{sessionName}</h4>
                                <button
                                  onClick={() => {
                                    const updatedProfiles = { ...profiles };
                                    delete updatedProfiles[currentProfile].customSessions[sessionName];
                                    setProfiles(updatedProfiles);
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
                      </div>
                    )}
                  </div>
                </div>
              </div>



              {/* Data Management */}
              <div className="card">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  💾 Data Management
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
                  ⚠️ Safety Information
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
                      <h4 className="font-semibold text-white mb-2">✅ Safe Practices</h4>
                      <ul className="text-deep-300 text-sm space-y-1">
                        <li>• Train with a buddy or in safe environment</li>
                        <li>• Never practice in water</li>
                        <li>• Listen to your body</li>
                        <li>• Don't push beyond your limits</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-deep-800 rounded-lg border border-deep-700">
                      <h4 className="font-semibold text-white mb-2">🚫 What to Avoid</h4>
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

      {/* Custom Session Creator Modal */}
      {showCustomSessionCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-deep-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Create Custom Session Type</h3>
              <button
                onClick={() => setShowCustomSessionCreator(false)}
                className="text-deep-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
                                {/* Session Name */}
                  <div>
                    <label className="text-sm text-deep-300 mb-2 block">Session Name:</label>
                    <input
                      type="text"
                      value={customSessionName}
                      onChange={(e) => setCustomSessionName(e.target.value)}
                      placeholder="Enter a unique session name..."
                      className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                    />
                  </div>
    
                  {/* Session Description */}
                  <div>
                    <label className="text-sm text-deep-300 mb-2 block">Description:</label>
                    <textarea
                      value={customSessionDescription}
                      onChange={(e) => setCustomSessionDescription(e.target.value)}
                      placeholder="Describe what this session type does..."
                      className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white h-20"
                    />
                  </div>

              {/* Session Structure */}
              <div>
                <label className="text-sm text-deep-300 mb-3 block">Session Structure:</label>
                <div className="space-y-4">
                  {/* Phase Type Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-deep-700 rounded-lg border border-deep-600">
                          <h4 className="font-semibold text-ocean-400 mb-2">Hold Phases</h4>
                          <p className="text-deep-300 text-sm mb-3">
                            Progressive or fixed duration breath holds
                          </p>
                          <button 
                            onClick={() => handleAddPhase('hold')}
                            className="btn-primary w-full text-sm"
                          >
                            Add Hold Phases
                          </button>
                        </div>
                        
                        <div className="p-4 bg-deep-700 rounded-lg border border-deep-600">
                          <h4 className="font-semibold text-ocean-400 mb-2">Breathing Phases</h4>
                          <p className="text-deep-300 text-sm mb-3">
                            Tidal, diaphragmatic, alternate nostril, box breathing
                          </p>
                          <button 
                            onClick={() => handleAddPhase('breathing')}
                            className="btn-primary w-full text-sm"
                          >
                            Add Breathing Phases
                          </button>
                        </div>
                        
                                                <div className="p-4 bg-deep-700 rounded-lg border border-deep-600">
                          <h4 className="font-semibold text-ocean-400 mb-2">Mental Phases</h4>
                          <p className="text-deep-300 text-sm mb-3">
                            Visualization, mindfulness, relaxation
                          </p>
                          <button 
                            onClick={() => handleAddPhase('mental')}
                            className="btn-primary w-full text-sm"
                          >
                            Add Mental Phases
                          </button>
                        </div>
                        
                        <div className="p-4 bg-deep-700 rounded-lg border border-deep-600">
                          <h4 className="font-semibold text-ocean-400 mb-2">Custom Phases</h4>
                          <p className="text-deep-300 text-sm mb-3">
                            Create completely custom phases with your own parameters
                          </p>
                          <button 
                            onClick={() => handleAddPhase('custom')}
                            className="btn-primary w-full text-sm"
                          >
                            Add Custom Phase
                          </button>
                        </div>
                    </div>

                    {/* Added Phases Display */}
                    {customSessionPhases.length > 0 && (
                      <div className="p-4 bg-deep-700 rounded-lg border border-deep-600">
                        <h4 className="font-semibold text-ocean-400 mb-3">Added Phases ({customSessionPhases.length})</h4>
                        <div className="space-y-2">
                          {customSessionPhases.map((phase, index) => (
                            <div key={phase.id} className="flex items-center justify-between p-3 bg-deep-800 rounded border border-deep-600">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">
                                    {index + 1}. {phase.type.charAt(0).toUpperCase() + phase.type.slice(1)} Phase
                                  </span>
                                  <span className="text-xs text-deep-400">
                                    {phase.durationType === 'fixed' && `(${phase.duration}s)`}
                                    {phase.durationType === 'progressive' && `(${phase.progressiveChange > 0 ? '+' : ''}${phase.progressiveChange}s from previous)`}
                                    {phase.durationType === 'maxHold' && `(${phase.maxHoldPercentage}% of max hold)`}
                                  </span>
                                </div>
                                {phase.description && (
                                  <p className="text-sm text-deep-300 mt-1">{phase.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemovePhase(phase.id)}
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
                  <div className="flex gap-3 pt-4 border-t border-deep-700">
                    <button 
                      onClick={handleSaveCustomSession}
                      disabled={!customSessionName.trim() || customSessionPhases.length === 0}
                      className="btn-primary flex-1"
                    >
                      Create Session Type
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomSessionCreator(false);
                        setCustomSessionName('');
                        setCustomSessionDescription('');
                        setCustomSessionPhases([]);
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Sessions Management */}
      {profiles[currentProfile]?.customSessions && Object.keys(profiles[currentProfile].customSessions).length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            🎯 Custom Sessions
          </h2>
          <div className="space-y-4">
            <p className="text-deep-300">
              Your custom training sessions for this profile:
            </p>
            
            <div className="grid gap-4">
              {Object.entries(profiles[currentProfile].customSessions).map(([sessionName, sessionData]) => (
                <div key={sessionName} className="p-4 bg-deep-700 rounded-lg border border-deep-600">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{sessionName}</h3>
                    <button
                      onClick={() => {
                        const updatedProfiles = { ...profiles };
                        delete updatedProfiles[currentProfile].customSessions[sessionName];
                        setProfiles(updatedProfiles);
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
          </div>
        </div>
      )}

      {/* Phase Creator Modal */}
      {showPhaseCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Add {currentPhaseType.charAt(0).toUpperCase() + currentPhaseType.slice(1)} Phase
              </h3>
              <button
                onClick={() => setShowPhaseCreator(false)}
                className="text-deep-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <PhaseCreator 
              phaseType={currentPhaseType}
              onCreate={handleCreatePhase}
              onCancel={() => setShowPhaseCreator(false)}
              existingPhases={customSessionPhases}
            />
          </div>
        </div>
      )}

      {/* Weekly Schedule Editor Modal */}
      {showWeeklyScheduleEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Edit Weekly Schedule</h3>
              <button
                onClick={() => setShowWeeklyScheduleEditor(false)}
                className="text-deep-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <p className="text-deep-300">
                Choose which session type to assign to each day of the week. This will determine your training schedule.
              </p>
              
              <div className="grid gap-4">
                {[
                  { key: 'monday', label: 'Monday' },
                  { key: 'tuesday', label: 'Tuesday' },
                  { key: 'wednesday', label: 'Wednesday' },
                  { key: 'thursday', label: 'Thursday' },
                  { key: 'friday', label: 'Friday' },
                  { key: 'saturday', label: 'Saturday' },
                  { key: 'sunday', label: 'Sunday' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-deep-700 rounded-lg border border-deep-600">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{label}</h4>
                      <p className="text-deep-300 text-sm">
                        Current: {weeklySchedule[key]}
                      </p>
                    </div>
                    <select
                      value={weeklySchedule[key]}
                      onChange={(e) => handleWeeklyScheduleChange(key, e.target.value)}
                      className="bg-deep-600 border border-deep-500 rounded px-3 py-2 text-white min-w-[200px]"
                    >
                                      <option value="Comfortable CO₂ Training">Comfortable CO₂ Training</option>
                <option value="O₂ Tolerance">O₂ Tolerance</option>
                <option value="Breath Control">Breath Control</option>
                <option value="Mental + Technique">Mental + Technique</option>
                <option value="Max Breath-Hold">Max Breath-Hold</option>
                <option value="Recovery & Flexibility">Recovery & Flexibility</option>
                <option value="Traditional CO₂ Tables">Traditional CO₂ Tables</option>
                      {Object.keys(profiles[currentProfile]?.customSessions || {}).map(sessionName => (
                        <option key={sessionName} value={sessionName}>
                          🎯 {sessionName}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-deep-700">
                <button 
                  onClick={handleSaveWeeklySchedule}
                  className="btn-primary flex-1"
                >
                  Save Weekly Schedule
                </button>
                <button
                  onClick={() => setShowWeeklyScheduleEditor(false)}
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