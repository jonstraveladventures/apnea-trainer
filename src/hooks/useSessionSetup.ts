import { useEffect } from 'react';
import { useTimerContext } from '../context/TimerContext';
import { Session, CustomSessions, Phase } from '../types';

interface UseSessionSetupProps {
  todaySession: Session | null | undefined;
  currentMaxHold: number | null;
  customSessions: CustomSessions;
  parseSessionPhases: (focus: string, maxHoldSeconds: number) => Phase[];
  onShowMaxHoldModal: () => void;
}

/**
 * Hook that handles session setup:
 * - Sets default session type from today's schedule
 * - Recalculates phases when session type or max hold changes
 * - Triggers max hold modal for new users
 */
const useSessionSetup = ({ todaySession, currentMaxHold, customSessions, parseSessionPhases, onShowMaxHoldModal }: UseSessionSetupProps): void => {
  const { state: timerState, actions: timerActions }: any = useTimerContext();
  const { selectedSessionType, hasUserChangedSession, isSessionActive } = timerState;

  // Follow today's scheduled session until the user picks another one. The
  // Timer mounts at app start, possibly before sessions have loaded, so the
  // fallback must give way once today's session arrives.
  useEffect(() => {
    if (isSessionActive) return;
    if (todaySession?.focus && !hasUserChangedSession) {
      if (selectedSessionType !== todaySession.focus) {
        timerActions.setSelectedSessionType(todaySession.focus);
      }
    } else if (!selectedSessionType) {
      timerActions.setSelectedSessionType('Maximal Breath-Hold Training');
    }
  }, [todaySession?.focus, hasUserChangedSession, selectedSessionType, isSessionActive]); // eslint-disable-line

  // Update session phases when selected session type or max hold changes.
  // Never mid-session: a new personal best must not rebuild the running session.
  useEffect(() => {
    if (isSessionActive) return;
    if (selectedSessionType && currentMaxHold) {
      const phases = parseSessionPhases(selectedSessionType, currentMaxHold);
      timerActions.setSessionPhases(phases);
      timerActions.setCurrentPhase(0);
      timerActions.setPhaseTime(0);
      timerActions.setStretchConfirmed(false);
      timerActions.setMaxHoldCompleted(false);
      timerActions.setCurrentMaxHoldPhase(0);
    }
  }, [selectedSessionType, currentMaxHold, isSessionActive]); // eslint-disable-line

  // Show max hold modal only if the user has no max hold on file at all.
  // (Don't conflate with `todaySession.actualMaxHold`, which is the *result*
  // recorded after a session — that stays null until the session completes.)
  useEffect(() => {
    if (!currentMaxHold) {
      onShowMaxHoldModal();
    }
  }, [currentMaxHold]); // eslint-disable-line
};

export default useSessionSetup;
