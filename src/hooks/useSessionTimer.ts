import { useRef, useEffect, useCallback } from 'react';
import { useTimerContext } from '../context/TimerContext';
import { getExerciseTypeFromPhase } from '../utils/phaseUtils';
import { exerciseInstructions } from '../utils/exerciseInstructions';
import { Phase, TimerState } from '../types';
import { UseAudioCuesReturn } from './useAudioCues';

interface UseSessionTimerProps {
  audioCues: UseAudioCuesReturn;
  /** Called once when a session finishes, with its length and the best max hold achieved (if any). */
  onSessionComplete?: (sessionTime: number, bestHold: number | null) => void;
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

/** How often the clock checks for elapsed seconds. Seconds land within this many ms of the true boundary. */
const TICK_MS = 200;
/**
 * Seconds processed more than this far behind real time (because the tab was
 * throttled in the background) advance the session silently, so a catch-up
 * doesn't fire a burst of stale cues.
 */
const LIVE_WINDOW_SECONDS = 2;

const nowMs = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

/**
 * The session clock: the only place that advances time, progresses phases
 * and fires audio cues. Elapsed time is measured against the system clock
 * rather than by counting interval callbacks, so holds and rests keep their
 * real length even when the browser throttles timers.
 *
 * Returns handler functions that the Timer component wires to UI controls.
 */
const useSessionTimer = ({ audioCues, onSessionComplete }: UseSessionTimerProps): UseSessionTimerReturn => {
  const { state, actions }: { state: TimerState; actions: any } = useTimerContext();
  const { isRunning, isPaused, isSessionActive } = state;

  // Latest values for use inside the interval and stable callbacks.
  const latest = useRef({ state, actions, audioCues, onSessionComplete });
  latest.current = { state, actions, audioCues, onSessionComplete };

  const audioEnabledRef = useRef<boolean>(true);
  /** Clock reading at the last processed second boundary. */
  const anchorRef = useRef<number>(0);
  /** Milliseconds already elapsed in the current second when the clock stopped (pause). */
  const carryRef = useRef<number>(0);
  /** Longest max hold completed in this session, in seconds. */
  const bestHoldRef = useRef<number>(0);

  const setAudioEnabled = useCallback((v: boolean): void => {
    audioEnabledRef.current = v;
  }, []);

  /** Restart the current second, e.g. after the user moves to a new phase by hand. */
  const resetAnchor = useCallback((): void => {
    anchorRef.current = nowMs();
    carryRef.current = 0;
  }, []);

  // ---- Session end ----

  const finishSession = useCallback((totalTime?: number): void => {
    const { state: s, actions: a, audioCues: cues, onSessionComplete: onDone } = latest.current;
    const sessionTotal = totalTime ?? s.sessionTime;
    const bestHold = bestHoldRef.current > 0 ? bestHoldRef.current : null;

    a.pauseTimer();
    if (audioEnabledRef.current) {
      cues.playCue('sessionComplete');
    }
    a.endSession({
      totalTime: sessionTotal,
      totalPhases: s.sessionPhases.length,
      completedPhases: Math.min(s.currentPhase + 1, s.sessionPhases.length),
      focus: s.selectedSessionType ?? undefined,
      bestHold
    });
    if (onDone && sessionTotal > 0) {
      onDone(sessionTotal, bestHold);
    }
  }, []);

  const endSession = useCallback((): void => {
    // Ending during a max hold counts that hold.
    const { state: s } = latest.current;
    const phase = s.sessionPhases[s.currentPhase];
    if (s.isSessionActive && phase?.type === 'max_hold' && s.phaseTime > bestHoldRef.current) {
      bestHoldRef.current = s.phaseTime;
    }
    finishSession();
  }, [finishSession]);

  // ---- Advance the session by whole seconds ----

  const runSeconds = useCallback((count: number): void => {
    const { state: s, actions: a, audioCues: cues } = latest.current;
    const phases: Phase[] = s.sessionPhases;
    let { time, sessionTime, phaseTime, currentPhase, showNextPhaseInstructions } = s;
    let ended = false;

    for (let i = 0; i < count && !ended; i++) {
      const playCues = audioEnabledRef.current && count - i <= LIVE_WINDOW_SECONDS;
      time += 1;
      sessionTime += 1;

      const phase = phases[currentPhase];
      // Stretch confirmation waits for the user; the session clock still runs.
      if (!phase || phase.type === 'stretch_confirmation') continue;

      phaseTime += 1;
      // Open-ended phases (max holds) count up until the diver presses "Hold Completed".
      if (phase.duration <= 0) continue;

      const remaining = phase.duration - phaseTime;
      const phaseCtx = { phaseDescription: phase.description };

      // Spoken minute marks, kept clear of the countdown and phase-end cues.
      if (playCues && phaseTime % 60 === 0 && remaining > 10) {
        cues.playCue('minuteMark', { minutes: phaseTime / 60 });
      }

      // Countdown starts 5 seconds before the end so "five" lands as the display shows 5.
      if (playCues && remaining === 5) {
        cues.playCue('countdown', phaseCtx);
      }

      // Show the next phase's instructions in the last 10 seconds.
      if (remaining > 0 && remaining <= 10 && currentPhase < phases.length - 1 && !showNextPhaseInstructions) {
        const nextExerciseType = getExerciseTypeFromPhase(phases[currentPhase + 1]);
        if (nextExerciseType && exerciseInstructions[nextExerciseType]) {
          a.setNextPhaseInstruction(exerciseInstructions[nextExerciseType]);
          a.setShowNextPhaseInstructions(true);
          showNextPhaseInstructions = true;
        }
      }

      if (remaining <= 0) {
        if (playCues) {
          cues.playCue('phaseEnd', phaseCtx);
        }
        a.setShowNextPhaseInstructions(false);
        a.setNextPhaseInstruction(null);
        showNextPhaseInstructions = false;

        if (currentPhase < phases.length - 1) {
          currentPhase += 1;
          phaseTime = 0;
          a.nextPhase();
          if (playCues) {
            cues.playCue('phaseStart', { phaseDescription: phases[currentPhase]?.description });
          }
        } else {
          ended = true;
        }
      }
    }

    a.dispatch({
      type: 'UPDATE_TIME',
      payload: { time, sessionTime, phaseTime }
    });
    // Keep the working copy current so the next tick doesn't depend on React
    // having re-rendered in between. The next render replaces it with the
    // same values from the reducer.
    latest.current = {
      ...latest.current,
      state: { ...s, time, sessionTime, phaseTime, currentPhase, showNextPhaseInstructions }
    };

    if (ended) {
      finishSession(sessionTime);
    }
  }, [finishSession]);

  // ---- The one interval ----

  useEffect(() => {
    if (!isRunning || isPaused || !isSessionActive) return undefined;

    anchorRef.current = nowMs() - carryRef.current;
    carryRef.current = 0;

    const id = setInterval(() => {
      const due = Math.floor((nowMs() - anchorRef.current) / 1000);
      if (due <= 0) return;
      anchorRef.current += due * 1000;
      runSeconds(due);
    }, TICK_MS);

    return () => {
      clearInterval(id);
      // Keep the part-second already elapsed so pause/resume doesn't add time.
      carryRef.current = Math.max(0, Math.min(999, nowMs() - anchorRef.current));
    };
  }, [isRunning, isPaused, isSessionActive, runSeconds]);

  // ---- Session lifecycle handlers ----

  const startSession = useCallback((showMaxHoldModalFn: () => void): void => {
    const { state: s, actions: a, audioCues: cues } = latest.current;
    if (s.sessionPhases.length === 0) {
      showMaxHoldModalFn();
      return;
    }
    bestHoldRef.current = 0;
    carryRef.current = 0;
    a.startSession(s.sessionPhases[0]?.type === 'rest');
    a.startTimer();

    if (audioEnabledRef.current) {
      cues.playCue('phaseStart', { phaseDescription: s.sessionPhases[0]?.description });
    }
  }, []);

  const pauseSession = useCallback((): void => {
    latest.current.actions.pauseSession();
  }, []);

  const resumeSession = useCallback((): void => {
    const { actions: a } = latest.current;
    a.resumeSession();
    a.startTimer();
  }, []);

  const resetTimer = useCallback((): void => {
    const { actions: a } = latest.current;
    a.pauseTimer();
    a.resetTimer();
    a.resetSession();
    bestHoldRef.current = 0;
    carryRef.current = 0;
  }, []);

  const resetSessionCompletion = useCallback((): void => {
    const { actions: a } = latest.current;
    a.setSessionCompleted(false);
    a.setSessionSummary(null);
  }, []);

  // ---- Phase progression handlers ----

  /** Move to the next phase by hand (or finish), announcing it. */
  const advancePhase = useCallback((): void => {
    const { state: s, actions: a, audioCues: cues } = latest.current;
    if (s.currentPhase < s.sessionPhases.length - 1) {
      a.setShowNextPhaseInstructions(false);
      a.setNextPhaseInstruction(null);
      a.nextPhase();
      resetAnchor();
      if (audioEnabledRef.current) {
        cues.playCue('phaseStart', { phaseDescription: s.sessionPhases[s.currentPhase + 1]?.description });
      }
    } else {
      finishSession();
    }
  }, [finishSession, resetAnchor]);

  const handleStretchConfirm = useCallback((): void => {
    latest.current.actions.setStretchConfirmed(true);
    advancePhase();
  }, [advancePhase]);

  const handleMaxHoldComplete = useCallback((): void => {
    const { state: s, actions: a } = latest.current;
    if (s.phaseTime > bestHoldRef.current) {
      bestHoldRef.current = s.phaseTime;
    }
    a.setMaxHoldCompleted(true);
    advancePhase();
  }, [advancePhase]);

  const handleSkipPhase = useCallback((): void => {
    const { state: s } = latest.current;
    if (s.currentPhase < s.sessionPhases.length - 1) {
      advancePhase();
    }
  }, [advancePhase]);

  const handlePhaseTimeAdjust = useCallback((newTime: number): void => {
    const { state: s, actions: a } = latest.current;
    const phase = s.sessionPhases[s.currentPhase];
    if (s.isSessionActive && phase) {
      const clampedTime = Math.max(0, Math.min(newTime, phase.duration));
      a.setPhaseTime(clampedTime);
    }
  }, []);

  const handleSessionTypeChange = useCallback((newSessionType: string): void => {
    const { actions: a } = latest.current;
    a.setSelectedSessionType(newSessionType);
    a.setHasUserChangedSession(true);
  }, []);

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
    audioEnabled: audioEnabledRef.current
  };
};

export default useSessionTimer;
