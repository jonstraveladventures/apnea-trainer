import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import { parseSessionPhases as parseSessionPhasesFromUtils } from '../utils/sessionParsers';
import { SESSION_TEMPLATES } from '../config/sessionTemplates';
import { formatTime } from '../utils/trainingLogic';
import {
  TimerState,
  Phase,
  SessionTemplate,
  SessionTemplates,
  SessionSummary,
  ExerciseInstruction,
  CustomSessions
} from '../types';

// Initial timer state
export const initialTimerState: TimerState = {
  // Timer state
  isRunning: false,
  time: 0,
  sessionTime: 0,
  isSessionActive: false,
  currentPhase: 0,
  sessionPhases: [],
  phaseTime: 0,
  isRestPhase: false,
  isPaused: false,

  // Session state
  sessionCompleted: false,
  sessionSummary: null,
  stretchConfirmed: false,
  maxHoldCompleted: false,
  currentMaxHoldPhase: 0,

  // UI state
  showInstructions: false,
  currentInstruction: null,
  showNextPhaseInstructions: false,
  nextPhaseInstruction: null,
  selectedSessionType: null,
  hasUserChangedSession: false,

  // Session templates
  sessionTemplates: SESSION_TEMPLATES
};

// Timer action types
export const TIMER_ACTIONS = {
  // Timer control
  START_TIMER: 'START_TIMER',
  PAUSE_TIMER: 'PAUSE_TIMER',
  RESET_TIMER: 'RESET_TIMER',
  UPDATE_TIME: 'UPDATE_TIME',

  // Session control
  START_SESSION: 'START_SESSION',
  PAUSE_SESSION: 'PAUSE_SESSION',
  RESUME_SESSION: 'RESUME_SESSION',
  END_SESSION: 'END_SESSION',
  RESET_SESSION: 'RESET_SESSION',

  // Phase control
  SET_CURRENT_PHASE: 'SET_CURRENT_PHASE',
  SET_PHASE_TIME: 'SET_PHASE_TIME',
  SET_SESSION_PHASES: 'SET_SESSION_PHASES',
  NEXT_PHASE: 'NEXT_PHASE',

  // Session state
  SET_SESSION_COMPLETED: 'SET_SESSION_COMPLETED',
  SET_SESSION_SUMMARY: 'SET_SESSION_SUMMARY',
  SET_STRETCH_CONFIRMED: 'SET_STRETCH_CONFIRMED',
  SET_MAX_HOLD_COMPLETED: 'SET_MAX_HOLD_COMPLETED',
  SET_CURRENT_MAX_HOLD_PHASE: 'SET_CURRENT_MAX_HOLD_PHASE',

  // UI state
  SET_SHOW_INSTRUCTIONS: 'SET_SHOW_INSTRUCTIONS',
  SET_CURRENT_INSTRUCTION: 'SET_CURRENT_INSTRUCTION',
  SET_SHOW_NEXT_PHASE_INSTRUCTIONS: 'SET_SHOW_NEXT_PHASE_INSTRUCTIONS',
  SET_NEXT_PHASE_INSTRUCTION: 'SET_NEXT_PHASE_INSTRUCTION',
  SET_SELECTED_SESSION_TYPE: 'SET_SELECTED_SESSION_TYPE',
  SET_HAS_USER_CHANGED_SESSION: 'SET_HAS_USER_CHANGED_SESSION',

  // Session templates
  SET_SESSION_TEMPLATES: 'SET_SESSION_TEMPLATES',
  UPDATE_SESSION_TEMPLATE: 'UPDATE_SESSION_TEMPLATE'
} as const;

// ---- Action discriminated union ----

type TimerAction =
  | { type: typeof TIMER_ACTIONS.START_TIMER }
  | { type: typeof TIMER_ACTIONS.PAUSE_TIMER }
  | { type: typeof TIMER_ACTIONS.RESET_TIMER }
  | { type: typeof TIMER_ACTIONS.UPDATE_TIME; payload: { time: number; sessionTime: number; phaseTime: number } }
  | { type: typeof TIMER_ACTIONS.START_SESSION; payload: { isRestPhase?: boolean } }
  | { type: typeof TIMER_ACTIONS.PAUSE_SESSION }
  | { type: typeof TIMER_ACTIONS.RESUME_SESSION }
  | { type: typeof TIMER_ACTIONS.END_SESSION; payload: { summary: SessionSummary } }
  | { type: typeof TIMER_ACTIONS.RESET_SESSION }
  | { type: typeof TIMER_ACTIONS.SET_CURRENT_PHASE; payload: number }
  | { type: typeof TIMER_ACTIONS.SET_PHASE_TIME; payload: number }
  | { type: typeof TIMER_ACTIONS.SET_SESSION_PHASES; payload: Phase[] }
  | { type: typeof TIMER_ACTIONS.NEXT_PHASE }
  | { type: typeof TIMER_ACTIONS.SET_SESSION_COMPLETED; payload: boolean }
  | { type: typeof TIMER_ACTIONS.SET_SESSION_SUMMARY; payload: SessionSummary | null }
  | { type: typeof TIMER_ACTIONS.SET_STRETCH_CONFIRMED; payload: boolean }
  | { type: typeof TIMER_ACTIONS.SET_MAX_HOLD_COMPLETED; payload: boolean }
  | { type: typeof TIMER_ACTIONS.SET_CURRENT_MAX_HOLD_PHASE; payload: number }
  | { type: typeof TIMER_ACTIONS.SET_SHOW_INSTRUCTIONS; payload: boolean }
  | { type: typeof TIMER_ACTIONS.SET_CURRENT_INSTRUCTION; payload: ExerciseInstruction | null }
  | { type: typeof TIMER_ACTIONS.SET_SHOW_NEXT_PHASE_INSTRUCTIONS; payload: boolean }
  | { type: typeof TIMER_ACTIONS.SET_NEXT_PHASE_INSTRUCTION; payload: ExerciseInstruction | null }
  | { type: typeof TIMER_ACTIONS.SET_SELECTED_SESSION_TYPE; payload: string | null }
  | { type: typeof TIMER_ACTIONS.SET_HAS_USER_CHANGED_SESSION; payload: boolean }
  | { type: typeof TIMER_ACTIONS.SET_SESSION_TEMPLATES; payload: SessionTemplates }
  | { type: typeof TIMER_ACTIONS.UPDATE_SESSION_TEMPLATE; payload: { type: string; template: SessionTemplate } };

export type { TimerAction };

// ---- Context value interface ----

interface TimerContextValue {
  state: TimerState;
  dispatch: React.Dispatch<TimerAction>;
  actions: { [key: string]: any };
}

// Timer reducer
export const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
  switch (action.type) {
    case TIMER_ACTIONS.START_TIMER:
      return {
        ...state,
        isRunning: true
      };

    case TIMER_ACTIONS.PAUSE_TIMER:
      return {
        ...state,
        isRunning: false
      };

    case TIMER_ACTIONS.RESET_TIMER:
      return {
        ...state,
        time: 0,
        sessionTime: 0,
        phaseTime: 0
      };

    case TIMER_ACTIONS.UPDATE_TIME:
      return {
        ...state,
        time: action.payload.time,
        sessionTime: action.payload.sessionTime,
        phaseTime: action.payload.phaseTime
      };

    case TIMER_ACTIONS.START_SESSION:
      return {
        ...state,
        isSessionActive: true,
        isPaused: false,
        sessionTime: 0,
        currentPhase: 0,
        phaseTime: 0,
        stretchConfirmed: false,
        maxHoldCompleted: false,
        showNextPhaseInstructions: false,
        nextPhaseInstruction: null,
        isRestPhase: action.payload.isRestPhase || false
      };

    case TIMER_ACTIONS.PAUSE_SESSION:
      return {
        ...state,
        isPaused: true
      };

    case TIMER_ACTIONS.RESUME_SESSION:
      return {
        ...state,
        isPaused: false
      };

    case TIMER_ACTIONS.END_SESSION:
      return {
        ...state,
        isSessionActive: false,
        sessionCompleted: true,
        sessionSummary: action.payload.summary
      };

    case TIMER_ACTIONS.RESET_SESSION:
      return {
        ...state,
        isSessionActive: false,
        sessionCompleted: false,
        sessionSummary: null,
        currentPhase: 0,
        phaseTime: 0,
        stretchConfirmed: false,
        maxHoldCompleted: false,
        showNextPhaseInstructions: false,
        nextPhaseInstruction: null
      };

    case TIMER_ACTIONS.SET_CURRENT_PHASE:
      return {
        ...state,
        currentPhase: action.payload,
        phaseTime: 0
      };

    case TIMER_ACTIONS.SET_PHASE_TIME:
      return {
        ...state,
        phaseTime: action.payload
      };

    case TIMER_ACTIONS.SET_SESSION_PHASES:
      return {
        ...state,
        sessionPhases: action.payload
      };

    case TIMER_ACTIONS.NEXT_PHASE: {
      const nextPhase = state.currentPhase + 1;
      return {
        ...state,
        currentPhase: nextPhase,
        phaseTime: 0,
        isRestPhase: state.sessionPhases[nextPhase]?.type === 'rest'
      };
    }

    case TIMER_ACTIONS.SET_SESSION_COMPLETED:
      return {
        ...state,
        sessionCompleted: action.payload
      };

    case TIMER_ACTIONS.SET_SESSION_SUMMARY:
      return {
        ...state,
        sessionSummary: action.payload
      };

    case TIMER_ACTIONS.SET_STRETCH_CONFIRMED:
      return {
        ...state,
        stretchConfirmed: action.payload
      };

    case TIMER_ACTIONS.SET_MAX_HOLD_COMPLETED:
      return {
        ...state,
        maxHoldCompleted: action.payload
      };

    case TIMER_ACTIONS.SET_CURRENT_MAX_HOLD_PHASE:
      return {
        ...state,
        currentMaxHoldPhase: action.payload
      };

    case TIMER_ACTIONS.SET_SHOW_INSTRUCTIONS:
      return {
        ...state,
        showInstructions: action.payload
      };

    case TIMER_ACTIONS.SET_CURRENT_INSTRUCTION:
      return {
        ...state,
        currentInstruction: action.payload
      };

    case TIMER_ACTIONS.SET_SHOW_NEXT_PHASE_INSTRUCTIONS:
      return {
        ...state,
        showNextPhaseInstructions: action.payload
      };

    case TIMER_ACTIONS.SET_NEXT_PHASE_INSTRUCTION:
      return {
        ...state,
        nextPhaseInstruction: action.payload
      };

    case TIMER_ACTIONS.SET_SELECTED_SESSION_TYPE:
      return {
        ...state,
        selectedSessionType: action.payload
      };

    case TIMER_ACTIONS.SET_HAS_USER_CHANGED_SESSION:
      return {
        ...state,
        hasUserChangedSession: action.payload
      };

    case TIMER_ACTIONS.SET_SESSION_TEMPLATES:
      return {
        ...state,
        sessionTemplates: action.payload
      };

    case TIMER_ACTIONS.UPDATE_SESSION_TEMPLATE:
      return {
        ...state,
        sessionTemplates: {
          ...state.sessionTemplates,
          [action.payload.type]: action.payload.template
        }
      };

    default:
      return state;
  }
};

// Create context
const TimerContext = createContext<TimerContextValue | null>(null);

// Provider component
export const TimerProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(timerReducer, initialTimerState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Use refs for mutable time values to avoid recreating the interval every second
  const stateRef = useRef<TimerState>(state);
  stateRef.current = state;

  // Timer tick effect — only depends on isRunning/isPaused, NOT on time values
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        const s = stateRef.current;
        dispatch({
          type: TIMER_ACTIONS.UPDATE_TIME,
          payload: {
            time: s.time + 1,
            sessionTime: s.isSessionActive ? s.sessionTime + 1 : s.sessionTime,
            phaseTime: s.isSessionActive ? s.phaseTime + 1 : s.phaseTime
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.isPaused]); // eslint-disable-line

  // Phase progression effect
  useEffect(() => {
    if (state.isSessionActive && state.sessionPhases.length > 0) {
      const currentPhaseData = state.sessionPhases[state.currentPhase];
      if (currentPhaseData && state.phaseTime >= currentPhaseData.duration && currentPhaseData.duration > 0) {
        // Move to next phase
        if (state.currentPhase < state.sessionPhases.length - 1) {
          dispatch({ type: TIMER_ACTIONS.NEXT_PHASE });
        } else {
          // Session completed
          dispatch({
            type: TIMER_ACTIONS.END_SESSION,
            payload: {
              summary: {
                totalTime: state.sessionTime,
                totalPhases: state.sessionPhases.length,
                completedPhases: state.currentPhase + 1
              }
            }
          });
        }
      }
    }
  }, [state.phaseTime, state.currentPhase, state.sessionPhases, state.isSessionActive, state.sessionTime]);

  // Context value
  const value: TimerContextValue = {
    state,
    dispatch,
    actions: {
      // Timer control
      startTimer: () => dispatch({ type: TIMER_ACTIONS.START_TIMER }),
      pauseTimer: () => dispatch({ type: TIMER_ACTIONS.PAUSE_TIMER }),
      resetTimer: () => dispatch({ type: TIMER_ACTIONS.RESET_TIMER }),

      // Session control
      startSession: (isRestPhase: boolean = false) => dispatch({
        type: TIMER_ACTIONS.START_SESSION,
        payload: { isRestPhase }
      }),
      pauseSession: () => dispatch({ type: TIMER_ACTIONS.PAUSE_SESSION }),
      resumeSession: () => dispatch({ type: TIMER_ACTIONS.RESUME_SESSION }),
      endSession: (summary: SessionSummary) => dispatch({
        type: TIMER_ACTIONS.END_SESSION,
        payload: { summary }
      }),
      resetSession: () => dispatch({ type: TIMER_ACTIONS.RESET_SESSION }),

      // Phase control
      setCurrentPhase: (phase: number) => dispatch({
        type: TIMER_ACTIONS.SET_CURRENT_PHASE,
        payload: phase
      }),
      setPhaseTime: (time: number) => dispatch({
        type: TIMER_ACTIONS.SET_PHASE_TIME,
        payload: time
      }),
      setSessionPhases: (phases: Phase[]) => dispatch({
        type: TIMER_ACTIONS.SET_SESSION_PHASES,
        payload: phases
      }),
      nextPhase: () => dispatch({ type: TIMER_ACTIONS.NEXT_PHASE }),

      // Session state
      setSessionCompleted: (completed: boolean) => dispatch({
        type: TIMER_ACTIONS.SET_SESSION_COMPLETED,
        payload: completed
      }),
      setSessionSummary: (summary: SessionSummary | null) => dispatch({
        type: TIMER_ACTIONS.SET_SESSION_SUMMARY,
        payload: summary
      }),
      setStretchConfirmed: (confirmed: boolean) => dispatch({
        type: TIMER_ACTIONS.SET_STRETCH_CONFIRMED,
        payload: confirmed
      }),
      setMaxHoldCompleted: (completed: boolean) => dispatch({
        type: TIMER_ACTIONS.SET_MAX_HOLD_COMPLETED,
        payload: completed
      }),
      setCurrentMaxHoldPhase: (phase: number) => dispatch({
        type: TIMER_ACTIONS.SET_CURRENT_MAX_HOLD_PHASE,
        payload: phase
      }),

      // UI state
      setShowInstructions: (show: boolean) => dispatch({
        type: TIMER_ACTIONS.SET_SHOW_INSTRUCTIONS,
        payload: show
      }),
      setCurrentInstruction: (instruction: ExerciseInstruction | null) => dispatch({
        type: TIMER_ACTIONS.SET_CURRENT_INSTRUCTION,
        payload: instruction
      }),
      setShowNextPhaseInstructions: (show: boolean) => dispatch({
        type: TIMER_ACTIONS.SET_SHOW_NEXT_PHASE_INSTRUCTIONS,
        payload: show
      }),
      setNextPhaseInstruction: (instruction: ExerciseInstruction | null) => dispatch({
        type: TIMER_ACTIONS.SET_NEXT_PHASE_INSTRUCTION,
        payload: instruction
      }),
      setSelectedSessionType: (type: string | null) => dispatch({
        type: TIMER_ACTIONS.SET_SELECTED_SESSION_TYPE,
        payload: type
      }),
      setHasUserChangedSession: (changed: boolean) => dispatch({
        type: TIMER_ACTIONS.SET_HAS_USER_CHANGED_SESSION,
        payload: changed
      }),

      // Session templates
      setSessionTemplates: (templates: SessionTemplates) => dispatch({
        type: TIMER_ACTIONS.SET_SESSION_TEMPLATES,
        payload: templates
      }),
      updateSessionTemplate: (type: string, template: SessionTemplate) => dispatch({
        type: TIMER_ACTIONS.UPDATE_SESSION_TEMPLATE,
        payload: { type, template }
      }),

      // Direct dispatch access (for Timer.js interval that needs UPDATE_TIME)
      dispatch,

      // Utility functions
      parseSessionPhases: (focus: string, maxHoldSeconds: number, customSessions: CustomSessions = {}): Phase[] => {
        // Check if this is a custom session
        if (customSessions && customSessions[focus]) {
          const customSession = customSessions[focus];
          const phases: Phase[] = [];

          // Add stretch confirmation and tidal breathing if enabled
          if (customSession.stretchConfirmation) {
            phases.push({
              type: 'stretch_confirmation',
              duration: 0,
              description: 'Stretch Confirmation',
              instructions: 'Please confirm that you have stretched and are in a comfortable position.'
            });
          }

          if (customSession.tidalBreathingDuration) {
            phases.push({
              type: 'tidal_breathing',
              duration: customSession.tidalBreathingDuration,
              description: `Tidal Breathing (${formatTime(customSession.tidalBreathingDuration)})`,
              isTidalBreathing: true,
              instructions: 'Breathe naturally and rhythmically to prepare your body.'
            });
          }

          // Add custom phases
          customSession.phases.forEach((phase, index) => {
            let duration = phase.duration;

            // Calculate duration based on type
            if (phase.durationType === 'progressive' && index > 0) {
              // This would need to be calculated based on previous phase
              // For now, use the progressive change value
              duration = phase.progressiveChange;
            } else if (phase.durationType === 'maxHold' && maxHoldSeconds) {
              duration = Math.round((phase.maxHoldPercentage / 100) * maxHoldSeconds);
            }

            phases.push({
              type: phase.type,
              duration: duration,
              description: phase.description || `${phase.type.charAt(0).toUpperCase() + phase.type.slice(1)} Phase`,
              instructions: phase.instructions || `Complete the ${phase.type} phase.`
            });
          });

          return phases;
        }

        // Use the modular session parser for built-in session types
        const template = state.sessionTemplates[focus] || {};
        return parseSessionPhasesFromUtils(focus, template, maxHoldSeconds);
      }
    }
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

// Custom hook to use the timer context
export const useTimerContext = (): TimerContextValue => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
};

// Selector hooks for specific timer state slices
export const useTimerState = () => {
  const { state } = useTimerContext();
  return {
    isRunning: state.isRunning,
    time: state.time,
    sessionTime: state.sessionTime,
    isSessionActive: state.isSessionActive,
    isPaused: state.isPaused
  };
};

export const useSessionState = () => {
  const { state } = useTimerContext();
  return {
    currentPhase: state.currentPhase,
    sessionPhases: state.sessionPhases,
    phaseTime: state.phaseTime,
    isRestPhase: state.isRestPhase,
    sessionCompleted: state.sessionCompleted,
    sessionSummary: state.sessionSummary
  };
};

export const useTimerUI = () => {
  const { state } = useTimerContext();
  return {
    showInstructions: state.showInstructions,
    currentInstruction: state.currentInstruction,
    showNextPhaseInstructions: state.showNextPhaseInstructions,
    nextPhaseInstruction: state.nextPhaseInstruction,
    selectedSessionType: state.selectedSessionType,
    hasUserChangedSession: state.hasUserChangedSession
  };
};

export const useSessionTemplates = () => {
  const { state } = useTimerContext();
  return {
    sessionTemplates: state.sessionTemplates
  };
};
