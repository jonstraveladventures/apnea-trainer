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
  const { selectedSessionType, hasUserChangedSession } = timerState;

  // Set default session type to today's session when component loads
  useEffect(() => {
    if (todaySession?.focus && !hasUserChangedSession && !selectedSessionType) {
      timerActions.setSelectedSessionType(todaySession.focus);
    } else if (!selectedSessionType) {
      timerActions.setSelectedSessionType('Maximal Breath-Hold Training');
    }
  }, [todaySession, hasUserChangedSession, selectedSessionType]); // eslint-disable-line

  // Update session phases when selected session type changes
  useEffect(() => {
    if (selectedSessionType && currentMaxHold) {
      const phases = parseSessionPhases(selectedSessionType, currentMaxHold);
      timerActions.setSessionPhases(phases);
      timerActions.setCurrentPhase(0);
      timerActions.setPhaseTime(0);
      timerActions.setStretchConfirmed(false);
      timerActions.setMaxHoldCompleted(false);
      timerActions.setCurrentMaxHoldPhase(0);
    }
  }, [selectedSessionType, currentMaxHold]); // eslint-disable-line

  // Show max hold modal if no max hold is set
  useEffect(() => {
    if (!todaySession?.actualMaxHold) {
      onShowMaxHoldModal();
    }
  }, [todaySession]); // eslint-disable-line
};

export default useSessionSetup;
