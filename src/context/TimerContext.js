import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import { parseSessionPhases as parseSessionPhasesFromUtils } from '../utils/sessionParsers';
import { SESSION_TEMPLATES } from '../config/sessionTemplates';
import { formatTime } from '../utils/trainingLogic';

// Initial timer state
const initialTimerState = {
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
};

// Timer reducer
const timerReducer = (state, action) => {
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
      
    case TIMER_ACTIONS.NEXT_PHASE:
      const nextPhase = state.currentPhase + 1;
      return {
        ...state,
        currentPhase: nextPhase,
        phaseTime: 0,
        isRestPhase: state.sessionPhases[nextPhase]?.type === 'rest'
      };
      
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
const TimerContext = createContext();

// Provider component
export const TimerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(timerReducer, initialTimerState);
  const intervalRef = useRef(null);

  // Timer tick effect
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        dispatch({
          type: TIMER_ACTIONS.UPDATE_TIME,
          payload: {
            time: state.time + 1,
            sessionTime: state.isSessionActive ? state.sessionTime + 1 : state.sessionTime,
            phaseTime: state.isSessionActive ? state.phaseTime + 1 : state.phaseTime
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
  }, [state.isRunning, state.isPaused, state.isSessionActive, state.time, state.sessionTime, state.phaseTime]);

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
  const value = {
    state,
    dispatch,
    actions: {
      // Timer control
      startTimer: () => dispatch({ type: TIMER_ACTIONS.START_TIMER }),
      pauseTimer: () => dispatch({ type: TIMER_ACTIONS.PAUSE_TIMER }),
      resetTimer: () => dispatch({ type: TIMER_ACTIONS.RESET_TIMER }),
      
      // Session control
      startSession: (isRestPhase = false) => dispatch({ 
        type: TIMER_ACTIONS.START_SESSION, 
        payload: { isRestPhase } 
      }),
      pauseSession: () => dispatch({ type: TIMER_ACTIONS.PAUSE_SESSION }),
      resumeSession: () => dispatch({ type: TIMER_ACTIONS.RESUME_SESSION }),
      endSession: (summary) => dispatch({ 
        type: TIMER_ACTIONS.END_SESSION, 
        payload: { summary } 
      }),
      resetSession: () => dispatch({ type: TIMER_ACTIONS.RESET_SESSION }),
      
      // Phase control
      setCurrentPhase: (phase) => dispatch({ 
        type: TIMER_ACTIONS.SET_CURRENT_PHASE, 
        payload: phase 
      }),
      setPhaseTime: (time) => dispatch({ 
        type: TIMER_ACTIONS.SET_PHASE_TIME, 
        payload: time 
      }),
      setSessionPhases: (phases) => dispatch({ 
        type: TIMER_ACTIONS.SET_SESSION_PHASES, 
        payload: phases 
      }),
      nextPhase: () => dispatch({ type: TIMER_ACTIONS.NEXT_PHASE }),
      
      // Session state
      setSessionCompleted: (completed) => dispatch({ 
        type: TIMER_ACTIONS.SET_SESSION_COMPLETED, 
        payload: completed 
      }),
      setSessionSummary: (summary) => dispatch({ 
        type: TIMER_ACTIONS.SET_SESSION_SUMMARY, 
        payload: summary 
      }),
      setStretchConfirmed: (confirmed) => dispatch({ 
        type: TIMER_ACTIONS.SET_STRETCH_CONFIRMED, 
        payload: confirmed 
      }),
      setMaxHoldCompleted: (completed) => dispatch({ 
        type: TIMER_ACTIONS.SET_MAX_HOLD_COMPLETED, 
        payload: completed 
      }),
      setCurrentMaxHoldPhase: (phase) => dispatch({ 
        type: TIMER_ACTIONS.SET_CURRENT_MAX_HOLD_PHASE, 
        payload: phase 
      }),
      
      // UI state
      setShowInstructions: (show) => dispatch({ 
        type: TIMER_ACTIONS.SET_SHOW_INSTRUCTIONS, 
        payload: show 
      }),
      setCurrentInstruction: (instruction) => dispatch({ 
        type: TIMER_ACTIONS.SET_CURRENT_INSTRUCTION, 
        payload: instruction 
      }),
      setShowNextPhaseInstructions: (show) => dispatch({ 
        type: TIMER_ACTIONS.SET_SHOW_NEXT_PHASE_INSTRUCTIONS, 
        payload: show 
      }),
      setNextPhaseInstruction: (instruction) => dispatch({ 
        type: TIMER_ACTIONS.SET_NEXT_PHASE_INSTRUCTION, 
        payload: instruction 
      }),
      setSelectedSessionType: (type) => dispatch({ 
        type: TIMER_ACTIONS.SET_SELECTED_SESSION_TYPE, 
        payload: type 
      }),
      setHasUserChangedSession: (changed) => dispatch({ 
        type: TIMER_ACTIONS.SET_HAS_USER_CHANGED_SESSION, 
        payload: changed 
      }),
      
      // Session templates
      setSessionTemplates: (templates) => dispatch({ 
        type: TIMER_ACTIONS.SET_SESSION_TEMPLATES, 
        payload: templates 
      }),
      updateSessionTemplate: (type, template) => dispatch({ 
        type: TIMER_ACTIONS.UPDATE_SESSION_TEMPLATE, 
        payload: { type, template } 
      }),
      
      // Utility functions
      parseSessionPhases: (focus, maxHoldSeconds, customSessions = {}) => {
        // Check if this is a custom session
        if (customSessions && customSessions[focus]) {
          const customSession = customSessions[focus];
          const phases = [];
          
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
export const useTimerContext = () => {
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