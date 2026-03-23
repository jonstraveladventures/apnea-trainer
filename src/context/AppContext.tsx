import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { generateSchedule, getLatestMaxHold, START_DATE, formatTime } from '../utils/trainingLogic';
import { DEFAULT_WEEKLY_SCHEDULE, DEFAULT_MAX_HOLD } from '../constants/defaults';
import {
  AppState,
  AppNotification,
  Session,
  Profile,
  Profiles,
  WeeklySchedule,
  CustomPhase,
  AudioPreferences
} from '../types';
import { DEFAULT_AUDIO_PREFERENCES } from '../hooks/useAudioCues';

// ---- Electron API type declaration ----
declare global {
  interface Window {
    electronAPI?: {
      saveData: (data: unknown) => Promise<void>;
      loadData: () => Promise<{ success: boolean; data?: PersistedData | null }>;
    };
  }
}

/** Shape of the data we persist to disk / localStorage */
interface PersistedData {
  profiles: Profiles;
  currentProfile: string;
  lastUpdated?: string;
}

// Initial state
export const initialState: AppState = {
  // Profile management
  currentProfile: 'default',
  profiles: {
    default: {
      name: 'Default Profile',
      created: new Date().toISOString(),
      sessions: [],
      currentMaxHold: null,
      customSessions: {},
      weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE }
    }
  },

  // Session data (mirrors current profile for easy access)
  sessions: [],
  currentMaxHold: null,
  weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE },

  // UI state
  currentView: 'weekplan',
  isLoading: true,
  notification: null,

  // Modal states
  showOnboarding: false,
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
} as const;

// ---- Action discriminated union ----

type AppAction =
  | { type: typeof ACTIONS.SET_CURRENT_PROFILE; payload: string }
  | { type: typeof ACTIONS.UPDATE_PROFILE; payload: { id: string; data: Partial<Profile> } }
  | { type: typeof ACTIONS.CREATE_PROFILE; payload: { id: string; profile: Profile } }
  | { type: typeof ACTIONS.DELETE_PROFILE; payload: string }
  | { type: typeof ACTIONS.LOAD_PROFILE_DATA; payload: string }
  | { type: typeof ACTIONS.SET_SESSIONS; payload: Session[] }
  | { type: typeof ACTIONS.UPDATE_SESSION; payload: { date: string; session: Partial<Session> } }
  | { type: typeof ACTIONS.TOGGLE_SESSION_COMPLETE; payload: string }
  | { type: typeof ACTIONS.SET_CURRENT_MAX_HOLD; payload: number | null }
  | { type: typeof ACTIONS.SET_WEEKLY_SCHEDULE; payload: WeeklySchedule }
  | { type: typeof ACTIONS.SET_CURRENT_VIEW; payload: AppState['currentView'] }
  | { type: typeof ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof ACTIONS.SET_NOTIFICATION; payload: AppNotification | null }
  | { type: typeof ACTIONS.CLEAR_NOTIFICATION }
  | { type: typeof ACTIONS.SHOW_MODAL; payload: string }
  | { type: typeof ACTIONS.HIDE_MODAL; payload: string }
  | { type: typeof ACTIONS.SET_CUSTOM_SESSION_NAME; payload: string }
  | { type: typeof ACTIONS.SET_CUSTOM_SESSION_DESCRIPTION; payload: string }
  | { type: typeof ACTIONS.SET_CUSTOM_SESSION_PHASES; payload: CustomPhase[] }
  | { type: typeof ACTIONS.SET_CURRENT_PHASE_TYPE; payload: string }
  | { type: typeof ACTIONS.SET_EDITING_SESSION_TYPE; payload: string | null }
  | { type: typeof ACTIONS.SET_NEW_PROFILE_NAME; payload: string }
  | { type: typeof ACTIONS.SET_NEW_PROFILE_MAX_HOLD; payload: string }
  | { type: typeof ACTIONS.LOAD_DATA; payload: Partial<AppState> }
  | { type: typeof ACTIONS.SAVE_DATA };

export type { AppAction };

// ---- Context value interface ----

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: { [key: string]: any };
}

// Reducer function
export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_PROFILE:
      return { ...state, currentProfile: action.payload };

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

    case ACTIONS.DELETE_PROFILE: {
      const { [action.payload]: _deleted, ...remainingProfiles } = state.profiles;
      return {
        ...state,
        profiles: remainingProfiles,
        currentProfile: state.currentProfile === action.payload ? 'default' : state.currentProfile
      };
    }

    case ACTIONS.LOAD_PROFILE_DATA: {
      const profileData = state.profiles[action.payload];
      return {
        ...state,
        sessions: profileData?.sessions || [],
        currentMaxHold: profileData?.currentMaxHold || null,
        weeklySchedule: profileData?.weeklySchedule || { ...DEFAULT_WEEKLY_SCHEDULE }
      };
    }

    case ACTIONS.SET_SESSIONS:
      return { ...state, sessions: action.payload };

    case ACTIONS.UPDATE_SESSION: {
      const updatedSessions = state.sessions.map(session =>
        session.date === action.payload.date ? { ...session, ...action.payload.session } : session
      );
      return { ...state, sessions: updatedSessions };
    }

    case ACTIONS.TOGGLE_SESSION_COMPLETE: {
      const toggledSessions = state.sessions.map(session =>
        session.date === action.payload ? { ...session, completed: !session.completed } : session
      );
      return { ...state, sessions: toggledSessions };
    }

    case ACTIONS.SET_CURRENT_MAX_HOLD:
      return { ...state, currentMaxHold: action.payload };

    case ACTIONS.SET_WEEKLY_SCHEDULE:
      return { ...state, weeklySchedule: action.payload };

    case ACTIONS.SET_CURRENT_VIEW:
      return { ...state, currentView: action.payload };

    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ACTIONS.SET_NOTIFICATION:
      return { ...state, notification: action.payload };

    case ACTIONS.CLEAR_NOTIFICATION:
      return { ...state, notification: null };

    case ACTIONS.SHOW_MODAL:
      return { ...state, [action.payload as keyof AppState]: true };

    case ACTIONS.HIDE_MODAL:
      return { ...state, [action.payload as keyof AppState]: false };

    case ACTIONS.SET_CUSTOM_SESSION_NAME:
      return { ...state, customSessionName: action.payload };

    case ACTIONS.SET_CUSTOM_SESSION_DESCRIPTION:
      return { ...state, customSessionDescription: action.payload };

    case ACTIONS.SET_CUSTOM_SESSION_PHASES:
      return { ...state, customSessionPhases: action.payload };

    case ACTIONS.SET_CURRENT_PHASE_TYPE:
      return { ...state, currentPhaseType: action.payload };

    case ACTIONS.SET_EDITING_SESSION_TYPE:
      return { ...state, editingSessionType: action.payload };

    case ACTIONS.SET_NEW_PROFILE_NAME:
      return { ...state, newProfileName: action.payload };

    case ACTIONS.SET_NEW_PROFILE_MAX_HOLD:
      return { ...state, newProfileMaxHold: action.payload };

    case ACTIONS.LOAD_DATA:
      return { ...state, ...action.payload };

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

// ---- Persistence helpers (Electron API with localStorage fallback) ----

const persistSave = async (data: PersistedData): Promise<void> => {
  try {
    if (window.electronAPI) {
      await window.electronAPI.saveData(data);
    } else {
      localStorage.setItem('apneaTrainerData', JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

const persistLoad = async (): Promise<PersistedData | null> => {
  try {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadData();
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } else {
      const saved = localStorage.getItem('apneaTrainerData');
      return saved ? JSON.parse(saved) : null;
    }
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
};

// Create context
const AppContext = createContext<AppContextValue | null>(null);

// Helper: create a default profile with a 30-day schedule
const createDefaultProfile = (): Profile => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  const defaultSchedule = generateSchedule(START_DATE, endDate, DEFAULT_MAX_HOLD);

  return {
    name: 'Default Profile',
    created: new Date().toISOString(),
    sessions: defaultSchedule,
    currentMaxHold: DEFAULT_MAX_HOLD,
    customSessions: {},
    weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE },
    audioPreferences: { ...DEFAULT_AUDIO_PREFERENCES }
  };
};

// Provider component
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  // Use ref to track whether initial load is complete (avoids save during load)
  const hasLoadedRef = useRef<boolean>(false);

  // ---- Load data on mount ----
  useEffect(() => {
    const load = async () => {
      const data = await persistLoad();

      if (data && data.profiles) {
        // We have saved data — load profiles and set current profile
        const currentProfile = data.currentProfile || 'default';
        const profileData = data.profiles[currentProfile];

        dispatch({
          type: ACTIONS.LOAD_DATA,
          payload: {
            profiles: data.profiles,
            currentProfile,
            sessions: profileData?.sessions || [],
            currentMaxHold: profileData?.currentMaxHold || null,
            weeklySchedule: profileData?.weeklySchedule || { ...DEFAULT_WEEKLY_SCHEDULE }
          }
        });
      } else {
        // First launch — create default profile
        const defaultProfile = createDefaultProfile();
        dispatch({
          type: ACTIONS.CREATE_PROFILE,
          payload: { id: 'default', profile: defaultProfile }
        });
        dispatch({ type: ACTIONS.LOAD_PROFILE_DATA, payload: 'default' });

        // Show onboarding modal for new users
        dispatch({ type: ACTIONS.SHOW_MODAL, payload: 'showOnboarding' });
      }

      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      hasLoadedRef.current = true;
    };

    load();
  }, []);

  // ---- Auto-save when profiles or session data change ----
  useEffect(() => {
    if (!hasLoadedRef.current || state.isLoading) return;

    // Sync current session data into the profile, then persist
    const updatedProfiles: Profiles = {
      ...state.profiles,
      [state.currentProfile]: {
        ...state.profiles[state.currentProfile],
        sessions: state.sessions,
        currentMaxHold: state.currentMaxHold,
        weeklySchedule: state.weeklySchedule,
        lastUpdated: new Date().toISOString()
      }
    };

    persistSave({
      profiles: updatedProfiles,
      currentProfile: state.currentProfile,
      lastUpdated: new Date().toISOString()
    });
  }, [state.sessions, state.currentMaxHold, state.profiles, state.currentProfile, state.weeklySchedule, state.isLoading]);

  // ---- Auto-dismiss notification ----
  useEffect(() => {
    if (state.notification) {
      const timer = setTimeout(() => {
        dispatch({ type: ACTIONS.CLEAR_NOTIFICATION });
      }, state.notification.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [state.notification]);

  // ---- Exposed action helpers ----

  const saveData = useCallback(async () => {
    const updatedProfiles: Profiles = {
      ...state.profiles,
      [state.currentProfile]: {
        ...state.profiles[state.currentProfile],
        sessions: state.sessions,
        currentMaxHold: state.currentMaxHold,
        weeklySchedule: state.weeklySchedule,
        lastUpdated: new Date().toISOString()
      }
    };
    await persistSave({
      profiles: updatedProfiles,
      currentProfile: state.currentProfile,
      lastUpdated: new Date().toISOString()
    });
  }, [state]);

  // Context value
  const value: AppContextValue = {
    state,
    dispatch,
    actions: {
      // Profile actions
      setCurrentProfile: (profileId: string) => dispatch({ type: ACTIONS.SET_CURRENT_PROFILE, payload: profileId }),
      updateProfile: (id: string, data: Partial<Profile>) => dispatch({ type: ACTIONS.UPDATE_PROFILE, payload: { id, data } }),
      createProfile: (id: string, profile: Profile) => dispatch({ type: ACTIONS.CREATE_PROFILE, payload: { id, profile } }),
      deleteProfile: (id: string) => dispatch({ type: ACTIONS.DELETE_PROFILE, payload: id }),
      loadProfileData: (id: string) => dispatch({ type: ACTIONS.LOAD_PROFILE_DATA, payload: id }),

      // Session actions
      setSessions: (sessions: Session[]) => dispatch({ type: ACTIONS.SET_SESSIONS, payload: sessions }),
      updateSession: (date: string, session: Partial<Session>) => dispatch({ type: ACTIONS.UPDATE_SESSION, payload: { date, session } }),
      toggleSessionComplete: (date: string) => dispatch({ type: ACTIONS.TOGGLE_SESSION_COMPLETE, payload: date }),
      setCurrentMaxHold: (maxHold: number | null) => dispatch({ type: ACTIONS.SET_CURRENT_MAX_HOLD, payload: maxHold }),
      setWeeklySchedule: (schedule: WeeklySchedule) => dispatch({ type: ACTIONS.SET_WEEKLY_SCHEDULE, payload: schedule }),

      // UI actions
      setCurrentView: (view: AppState['currentView']) => dispatch({ type: ACTIONS.SET_CURRENT_VIEW, payload: view }),
      setLoading: (loading: boolean) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
      setNotification: (notification: AppNotification | null) => dispatch({ type: ACTIONS.SET_NOTIFICATION, payload: notification }),
      clearNotification: () => dispatch({ type: ACTIONS.CLEAR_NOTIFICATION }),

      // Modal actions
      showModal: (modalName: string) => dispatch({ type: ACTIONS.SHOW_MODAL, payload: modalName }),
      hideModal: (modalName: string) => dispatch({ type: ACTIONS.HIDE_MODAL, payload: modalName }),

      // Custom session actions
      setCustomSessionName: (name: string) => dispatch({ type: ACTIONS.SET_CUSTOM_SESSION_NAME, payload: name }),
      setCustomSessionDescription: (desc: string) => dispatch({ type: ACTIONS.SET_CUSTOM_SESSION_DESCRIPTION, payload: desc }),
      setCustomSessionPhases: (phases: CustomPhase[]) => dispatch({ type: ACTIONS.SET_CUSTOM_SESSION_PHASES, payload: phases }),
      setCurrentPhaseType: (type: string) => dispatch({ type: ACTIONS.SET_CURRENT_PHASE_TYPE, payload: type }),
      setEditingSessionType: (type: string | null) => dispatch({ type: ACTIONS.SET_EDITING_SESSION_TYPE, payload: type }),

      // Profile creation actions
      setNewProfileName: (name: string) => dispatch({ type: ACTIONS.SET_NEW_PROFILE_NAME, payload: name }),
      setNewProfileMaxHold: (maxHold: string) => dispatch({ type: ACTIONS.SET_NEW_PROFILE_MAX_HOLD, payload: maxHold }),

      // Data persistence
      saveData,

      // Helpers re-exported for convenience
      generateSchedule,
      getLatestMaxHold,
      formatTime,
      createDefaultProfile
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = (): AppContextValue => {
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
    showOnboarding: state.showOnboarding,
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
