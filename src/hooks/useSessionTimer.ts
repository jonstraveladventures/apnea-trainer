import { useRef, useEffect, useCallback } from 'react';
import { useTimerContext } from '../context/TimerContext';
import { getExerciseTypeFromPhase } from '../utils/phaseUtils';
import { exerciseInstructions } from '../utils/exerciseInstructions';
import { Phase } from '../types';

interface UseSessionTimerProps {
  audio: { play: () => void } | null;
  onSessionComplete?: (sessionTime: number) => void;
}

interface UseSessionTimerReturn {
  startSession: (showMaxHoldModalFn: () => void) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  resetTimer: () => void;
  resetSessionCompletion: () => void;
  handleStretchConfirm: () => void;
  handleMaxHoldComplete: () => void;
  handleSkipPhase: () => void;
  handlePhaseTimeAdjust: (newTime: number) => void;
  handleSessionTypeChange: (newSessionType: string) => void;
  setAudioEnabled: (v: boolean) => void;
  audioEnabled: boolean;
}

interface StateRefValue {
  time: number;
  sessionTime: number;
  phaseTime: number;
  audioEnabled: boolean;
}

/**
 * Core timer hook — manages the 1-second interval, phase progression,
 * audio cues, and session lifecycle (start/pause/resume/end).
 *
 * Returns handler functions that the Timer component wires to UI controls.
 */
const useSessionTimer = ({ audio, onSessionComplete }: UseSessionTimerProps): UseSessionTimerReturn => {
  const { state, actions }: any = useTimerContext();
  const {
    isRunning, time, sessionTime, isSessionActive,
    currentPhase, sessionPhases, phaseTime,
    selectedSessionType
  } = state;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mutable ref to avoid recreating interval on every tick
  const stateRef = useRef<StateRefValue>({ time, sessionTime, phaseTime, audioEnabled: true });
  stateRef.current = { time, sessionTime, phaseTime, audioEnabled: stateRef.current.audioEnabled };

  // Allow toggling audio from outside
  const setAudioEnabled = useCallback((v: boolean): void => {
    stateRef.current.audioEnabled = v;
  }, []);

  // ---- End session (used from interval AND from handlers) ----
  const endSession = useCallback((): void => {
    actions.pauseTimer();
    const s = stateRef.current;
    const summary = {
      totalTime: s.sessionTime || sessionTime,
      totalPhases: sessionPhases.length,
      completedPhases: currentPhase + 1,
      focus: selectedSessionType
    };
    actions.endSession(summary);
    if (onSessionComplete && (s.sessionTime || sessionTime) > 0) {
      onSessionComplete(s.sessionTime || sessionTime);
    }
  }, [actions, sessionTime, sessionPhases.length, currentPhase, selectedSessionType, onSessionComplete]);

  // ---- Timer interval effect ----
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const s = stateRef.current;
        const newTime = s.time + 1;
        const newSessionTime = isSessionActive ? s.sessionTime + 1 : s.sessionTime;
        const currentPhaseData: Phase | undefined = sessionPhases[currentPhase];
        let newPhaseTime = s.phaseTime;

        if (isSessionActive && currentPhaseData && currentPhaseData.type !== 'stretch_confirmation') {
          newPhaseTime = s.phaseTime + 1;

          // Audio trigger 6 seconds before phase end
          if (s.audioEnabled && audio && currentPhaseData.duration > 0 && newPhaseTime === currentPhaseData.duration - 6) {
            audio.play();
          }

          // Phase completion
          if (currentPhaseData.duration > 0 && newPhaseTime >= currentPhaseData.duration) {
            actions.setShowNextPhaseInstructions(false);
            actions.setNextPhaseInstruction(null);
            if (currentPhase < sessionPhases.length - 1) {
              actions.nextPhase();
              newPhaseTime = 0;
            } else {
              endSession();
            }
          }
        }

        // Dispatch time update
        actions.dispatch({
          type: 'UPDATE_TIME',
          payload: { time: newTime, sessionTime: newSessionTime, phaseTime: newPhaseTime }
        });

        // Show next phase instructions 10 seconds before phase ends
        if (isSessionActive && currentPhaseData && currentPhaseData.duration > 0 && newPhaseTime >= currentPhaseData.duration - 10) {
          if (currentPhase < sessionPhases.length - 1) {
            const nextPhaseData: Phase = sessionPhases[currentPhase + 1];
            const nextExerciseType = getExerciseTypeFromPhase(nextPhaseData);
            if (nextExerciseType && exerciseInstructions[nextExerciseType]) {
              actions.setNextPhaseInstruction(exerciseInstructions[nextExerciseType]);
              actions.setShowNextPhaseInstructions(true);
            }
          }
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isSessionActive, currentPhase, sessionPhases]); // eslint-disable-line

  // ---- Session lifecycle handlers ----

  const startSession = useCallback((showMaxHoldModalFn: () => void): void => {
    if (sessionPhases.length === 0) {
      showMaxHoldModalFn();
      return;
    }
    actions.startSession(sessionPhases[0]?.type === 'rest');
    actions.startTimer();
  }, [actions, sessionPhases]);

  const pauseSession = useCallback((): void => {
    actions.pauseSession();
  }, [actions]);

  const resumeSession = useCallback((): void => {
    actions.resumeSession();
    actions.startTimer();
  }, [actions]);

  const resetTimer = useCallback((): void => {
    actions.pauseTimer();
    actions.resetTimer();
    actions.resetSession();
  }, [actions]);

  const resetSessionCompletion = useCallback((): void => {
    actions.setSessionCompleted(false);
    actions.setSessionSummary(null);
  }, [actions]);

  // ---- Phase progression handlers ----

  const handleStretchConfirm = useCallback((): void => {
    actions.setStretchConfirmed(true);
    if (currentPhase < sessionPhases.length - 1) {
      actions.nextPhase();
    } else {
      endSession();
    }
  }, [actions, currentPhase, sessionPhases.length, endSession]);

  const handleMaxHoldComplete = useCallback((): void => {
    actions.setMaxHoldCompleted(true);
    if (currentPhase < sessionPhases.length - 1) {
      actions.nextPhase();
    } else {
      endSession();
    }
  }, [actions, currentPhase, sessionPhases.length, endSession]);

  const handleSkipPhase = useCallback((): void => {
    if (currentPhase < sessionPhases.length - 1) {
      actions.nextPhase();
    }
  }, [actions, currentPhase, sessionPhases.length]);

  const handlePhaseTimeAdjust = useCallback((newTime: number): void => {
    if (isSessionActive && sessionPhases[currentPhase]) {
      const currentPhaseData: Phase = sessionPhases[currentPhase];
      const clampedTime = Math.max(0, Math.min(newTime, currentPhaseData.duration));
      actions.setPhaseTime(clampedTime);
    }
  }, [actions, isSessionActive, sessionPhases, currentPhase]);

  const handleSessionTypeChange = useCallback((newSessionType: string): void => {
    actions.setSelectedSessionType(newSessionType);
    actions.setHasUserChangedSession(true);
  }, [actions]);

  return {
    // Session lifecycle
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    resetTimer,
    resetSessionCompletion,
    // Phase handlers
    handleStretchConfirm,
    handleMaxHoldComplete,
    handleSkipPhase,
    handlePhaseTimeAdjust,
    handleSessionTypeChange,
    // Audio control
    setAudioEnabled,
    audioEnabled: stateRef.current.audioEnabled
  };
};

export default useSessionTimer;
