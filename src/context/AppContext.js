import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { generateSchedule, START_DATE } from '../utils/trainingLogic';

// Initial state
const initialState = {
  // Profile management
  currentProfile: 'default',
  profiles: {
    default: { 
      name: 'Default Profile', 
      created: new Date().toISOString(),
      sessions: [],
      currentMaxHold: null,
      customSessions: {},
      weeklySchedule: {
        monday: 'Maximal Breath-Hold Training',
        tuesday: 'Breath Control',
        wednesday: 'O₂ Tolerance',
        thursday: 'Mental + Technique',
        friday: 'Max Breath-Hold',
        saturday: 'Recovery & Flexibility',
        sunday: 'Traditional CO₂ Tables'
      }
    }
  },
  
  // Session data
  sessions: [],
  currentMaxHold: null,
  weeklySchedule: {
    monday: 'Maximal Breath-Hold Training',
    tuesday: 'Breath Control',
    wednesday: 'O₂ Tolerance',
    thursday: 'Mental + Technique',
    friday: 'Max Breath-Hold',
    saturday: 'Recovery & Flexibility',
    sunday: 'Traditional CO₂ Tables'
  },
  
  // UI state
  currentView: 'weekplan',
  isLoading: true,
  notification: null,
  
  // Modal states
  showProfileModal: false,
  showMaxHoldModal: false,
  showCustomSessionCreator: false,
  showPhaseCreator: false,
  showWeeklyScheduleEditor: false,
  showTemplateEditor: false,
  
  // Custom session creation
  customSessionName: '',
  customSessionDescription: '',
  customSessionPhases: [],
  currentPhaseType: '',
  editingSessionType: null,
  
  // Profile creation
  newProfileName: '',
  newProfileMaxHold: ''
};

// Action types
export const ACTIONS = {
  // Profile actions
  SET_CURRENT_PROFILE: 'SET_CURRENT_PROFILE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  CREATE_PROFILE: 'CREATE_PROFILE',
  DELETE_PROFILE: 'DELETE_PROFILE',
  LOAD_PROFILE_DATA: 'LOAD_PROFILE_DATA',
  
  // Session actions
  SET_SESSIONS: 'SET_SESSIONS',
  UPDATE_SESSION: 'UPDATE_SESSION',
  TOGGLE_SESSION_COMPLETE: 'TOGGLE_SESSION_COMPLETE',
  SET_CURRENT_MAX_HOLD: 'SET_CURRENT_MAX_HOLD',
  SET_WEEKLY_SCHEDULE: 'SET_WEEKLY_SCHEDULE',
  
  // UI actions
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_LOADING: 'SET_LOADING',
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  
  // Modal actions
  SHOW_MODAL: 'SHOW_MODAL',
  HIDE_MODAL: 'HIDE_MODAL',
  
  // Custom session actions
  SET_CUSTOM_SESSION_NAME: 'SET_CUSTOM_SESSION_NAME',
  SET_CUSTOM_SESSION_DESCRIPTION: 'SET_CUSTOM_SESSION_DESCRIPTION',
  SET_CUSTOM_SESSION_PHASES: 'SET_CUSTOM_SESSION_PHASES',
  SET_CURRENT_PHASE_TYPE: 'SET_CURRENT_PHASE_TYPE',
  SET_EDITING_SESSION_TYPE: 'SET_EDITING_SESSION_TYPE',
  
  // Profile creation actions
  SET_NEW_PROFILE_NAME: 'SET_NEW_PROFILE_NAME',
  SET_NEW_PROFILE_MAX_HOLD: 'SET_NEW_PROFILE_MAX_HOLD',
  
  // Data persistence
  LOAD_DATA: 'LOAD_DATA',
  SAVE_DATA: 'SAVE_DATA'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_PROFILE:
      return {
        ...state,
        currentProfile: action.payload
      };
      
    case ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        profiles: {
          ...state.profiles,
          [action.payload.id]: {
            ...state.profiles[action.payload.id],
            ...action.payload.data,
            lastUpdated: new Date().toISOString()
          }
        }
      };
      
    case ACTIONS.CREATE_PROFILE:
      return {
        ...state,
        profiles: {
          ...state.profiles,
          [action.payload.id]: action.payload.profile
        }
      };
      
    case ACTIONS.DELETE_PROFILE:
      const { [action.payload]: deletedProfile, ...remainingProfiles } = state.profiles;
      return {
        ...state,
        profiles: remainingProfiles,
        currentProfile: state.currentProfile === action.payload ? 'default' : state.currentProfile
      };
      
    case ACTIONS.LOAD_PROFILE_DATA:
      const profileData = state.profiles[action.payload];
      return {
        ...state,
        sessions: profileData?.sessions || [],
        currentMaxHold: profileData?.currentMaxHold || null,
        weeklySchedule: profileData?.weeklySchedule || state.weeklySchedule
      };
      
    case ACTIONS.SET_SESSIONS:
      return {
        ...state,
        sessions: action.payload
      };
      
    case ACTIONS.UPDATE_SESSION:
      const updatedSessions = state.sessions.map(session => 
        session.date === action.payload.date ? { ...session, ...action.payload.session } : session
      );
      return {
        ...state,
        sessions: updatedSessions
      };
      
    case ACTIONS.TOGGLE_SESSION_COMPLETE:
      const toggledSessions = state.sessions.map(session => 
        session.date === action.payload ? { ...session, completed: !session.completed } : session
      );
      return {
        ...state,
        sessions: toggledSessions
      };
      
    case ACTIONS.SET_CURRENT_MAX_HOLD:
      return {
        ...state,
        currentMaxHold: action.payload
      };
      
    case ACTIONS.SET_WEEKLY_SCHEDULE:
      return {
        ...state,
        weeklySchedule: action.payload
      };
      
    case ACTIONS.SET_CURRENT_VIEW:
      return {
        ...state,
        currentView: action.payload
      };
      
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case ACTIONS.SET_NOTIFICATION:
      return {
        ...state,
        notification: action.payload
      };
      
    case ACTIONS.CLEAR_NOTIFICATION:
      return {
        ...state,
        notification: null
      };
      
    case ACTIONS.SHOW_MODAL:
      return {
        ...state,
        [action.payload]: true
      };
      
    case ACTIONS.HIDE_MODAL:
      return {
        ...state,
        [action.payload]: false
      };
      
    case ACTIONS.SET_CUSTOM_SESSION_NAME:
      return {
        ...state,
        customSessionName: action.payload
      };
      
    case ACTIONS.SET_CUSTOM_SESSION_DESCRIPTION:
      return {
        ...state,
        customSessionDescription: action.payload
      };
      
    case ACTIONS.SET_CUSTOM_SESSION_PHASES:
      return {
        ...state,
        customSessionPhases: action.payload
      };
      
    case ACTIONS.SET_CURRENT_PHASE_TYPE:
      return {
        ...state,
        currentPhaseType: action.payload
      };
      
    case ACTIONS.SET_EDITING_SESSION_TYPE:
      return {
        ...state,
        editingSessionType: action.payload
      };
      
    case ACTIONS.SET_NEW_PROFILE_NAME:
      return {
        ...state,
        newProfileName: action.payload
      };
      
    case ACTIONS.SET_NEW_PROFILE_MAX_HOLD:
      return {
        ...state,
        newProfileMaxHold: action.payload
      };
      
    case ACTIONS.LOAD_DATA:
      return {
        ...state,
        ...action.payload
      };
      
    case ACTIONS.SAVE_DATA:
      return {
        ...state,
        profiles: {
          ...state.profiles,
          [state.currentProfile]: {
            ...state.profiles[state.currentProfile],
            sessions: state.sessions,
            currentMaxHold: state.currentMaxHold,
            weeklySchedule: state.weeklySchedule,
            lastUpdated: new Date().toISOString()
          }
        }
      };
      
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

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
        monday: 'Maximal Breath-Hold Training',
        tuesday: 'Breath Control',
        wednesday: 'O₂ Tolerance',
        thursday: 'Mental + Technique',
        friday: 'Max Breath-Hold',
        saturday: 'Recovery & Flexibility',
        sunday: 'Traditional CO₂ Tables'
      }
    };
  };

  // Load data from localStorage
  const loadData = async () => {
    try {
      const savedData = localStorage.getItem('apneaTrainerData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: ACTIONS.LOAD_DATA, payload: parsedData });
      } else {
        // Initialize with default profile
        const defaultProfile = initializeDefaultProfile();
        dispatch({ 
          type: ACTIONS.CREATE_PROFILE, 
          payload: { id: 'default', profile: defaultProfile } 
        });
        dispatch({ type: ACTIONS.LOAD_PROFILE_DATA, payload: 'default' });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to default profile
      const defaultProfile = initializeDefaultProfile();
      dispatch({ 
        type: ACTIONS.CREATE_PROFILE, 
        payload: { id: 'default', profile: defaultProfile } 
      });
      dispatch({ type: ACTIONS.LOAD_PROFILE_DATA, payload: 'default' });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Save data to localStorage
  const saveData = async () => {
    try {
      const dataToSave = {
        currentProfile: state.currentProfile,
        profiles: state.profiles
      };
      localStorage.setItem('apneaTrainerData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data when profiles change
  useEffect(() => {
    if (!state.isLoading) {
      saveData();
    }
  }, [state.profiles, state.currentProfile]);

  // Load profile data when currentProfile changes
  useEffect(() => {
    if (state.profiles[state.currentProfile]) {
      dispatch({ type: ACTIONS.LOAD_PROFILE_DATA, payload: state.currentProfile });
    }
  }, [state.currentProfile, state.profiles]);

  // Auto-dismiss notification
  useEffect(() => {
    if (state.notification) {
      const timer = setTimeout(() => {
        dispatch({ type: ACTIONS.CLEAR_NOTIFICATION });
      }, state.notification.duration || 5000);
      
      return () => clearTimeout(timer);
    }
  }, [state.notification]);

  // Context value
  const value = {
    state,
    dispatch,
    actions: {
      // Profile actions
      setCurrentProfile: (profileId) => dispatch({ type: ACTIONS.SET_CURRENT_PROFILE, payload: profileId }),
      updateProfile: (id, data) => dispatch({ type: ACTIONS.UPDATE_PROFILE, payload: { id, data } }),
      createProfile: (id, profile) => dispatch({ type: ACTIONS.CREATE_PROFILE, payload: { id, profile } }),
      deleteProfile: (id) => dispatch({ type: ACTIONS.DELETE_PROFILE, payload: id }),
      
      // Session actions
      setSessions: (sessions) => dispatch({ type: ACTIONS.SET_SESSIONS, payload: sessions }),
      updateSession: (date, session) => dispatch({ type: ACTIONS.UPDATE_SESSION, payload: { date, session } }),
      toggleSessionComplete: (date) => dispatch({ type: ACTIONS.TOGGLE_SESSION_COMPLETE, payload: date }),
      setCurrentMaxHold: (maxHold) => dispatch({ type: ACTIONS.SET_CURRENT_MAX_HOLD, payload: maxHold }),
      setWeeklySchedule: (schedule) => dispatch({ type: ACTIONS.SET_WEEKLY_SCHEDULE, payload: schedule }),
      
      // UI actions
      setCurrentView: (view) => dispatch({ type: ACTIONS.SET_CURRENT_VIEW, payload: view }),
      setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
      setNotification: (notification) => dispatch({ type: ACTIONS.SET_NOTIFICATION, payload: notification }),
      clearNotification: () => dispatch({ type: ACTIONS.CLEAR_NOTIFICATION }),
      
      // Modal actions
      showModal: (modalName) => dispatch({ type: ACTIONS.SHOW_MODAL, payload: modalName }),
      hideModal: (modalName) => dispatch({ type: ACTIONS.HIDE_MODAL, payload: modalName }),
      
      // Custom session actions
      setCustomSessionName: (name) => dispatch({ type: ACTIONS.SET_CUSTOM_SESSION_NAME, payload: name }),
      setCustomSessionDescription: (description) => dispatch({ type: ACTIONS.SET_CUSTOM_SESSION_DESCRIPTION, payload: description }),
      setCustomSessionPhases: (phases) => dispatch({ type: ACTIONS.SET_CUSTOM_SESSION_PHASES, payload: phases }),
      setCurrentPhaseType: (type) => dispatch({ type: ACTIONS.SET_CURRENT_PHASE_TYPE, payload: type }),
      setEditingSessionType: (type) => dispatch({ type: ACTIONS.SET_EDITING_SESSION_TYPE, payload: type }),
      
      // Profile creation actions
      setNewProfileName: (name) => dispatch({ type: ACTIONS.SET_NEW_PROFILE_NAME, payload: name }),
      setNewProfileMaxHold: (maxHold) => dispatch({ type: ACTIONS.SET_NEW_PROFILE_MAX_HOLD, payload: maxHold }),
      
      // Data persistence
      saveData
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Selector hooks for specific state slices
export const useProfiles = () => {
  const { state } = useAppContext();
  return {
    currentProfile: state.currentProfile,
    profiles: state.profiles,
    currentProfileData: state.profiles[state.currentProfile]
  };
};

export const useSessions = () => {
  const { state } = useAppContext();
  return {
    sessions: state.sessions,
    currentMaxHold: state.currentMaxHold,
    weeklySchedule: state.weeklySchedule
  };
};

export const useUI = () => {
  const { state } = useAppContext();
  return {
    currentView: state.currentView,
    isLoading: state.isLoading,
    notification: state.notification
  };
};

export const useModals = () => {
  const { state } = useAppContext();
  return {
    showProfileModal: state.showProfileModal,
    showMaxHoldModal: state.showMaxHoldModal,
    showCustomSessionCreator: state.showCustomSessionCreator,
    showPhaseCreator: state.showPhaseCreator,
    showWeeklyScheduleEditor: state.showWeeklyScheduleEditor,
    showTemplateEditor: state.showTemplateEditor
  };
};

export const useCustomSession = () => {
  const { state } = useAppContext();
  return {
    customSessionName: state.customSessionName,
    customSessionDescription: state.customSessionDescription,
    customSessionPhases: state.customSessionPhases,
    currentPhaseType: state.currentPhaseType,
    editingSessionType: state.editingSessionType
  };
};

export const useProfileCreation = () => {
  const { state } = useAppContext();
  return {
    newProfileName: state.newProfileName,
    newProfileMaxHold: state.newProfileMaxHold
  };
}; 