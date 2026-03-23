import { timerReducer, TIMER_ACTIONS, initialTimerState } from '../TimerContext';
import { TimerState, Phase, SessionSummary, SessionTemplate } from '../../types';
import { SESSION_TEMPLATES } from '../../config/sessionTemplates';

/**
 * Helper: returns a deep copy of initialTimerState so tests don't mutate the shared object.
 */
const freshState = (): TimerState => JSON.parse(JSON.stringify(initialTimerState));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makePhase = (overrides: Partial<Phase> = {}): Phase => ({
  type: 'hold',
  duration: 60,
  description: 'Hold Phase',
  ...overrides,
});

const makeSummary = (overrides: Partial<SessionSummary> = {}): SessionSummary => ({
  totalTime: 300,
  totalPhases: 5,
  completedPhases: 5,
  ...overrides,
});

// ===========================================================================
// Tests
// ===========================================================================

describe('timerReducer', () => {
  // -----------------------------------------------------------------------
  // START_TIMER
  // -----------------------------------------------------------------------
  describe('START_TIMER', () => {
    it('sets isRunning to true', () => {
      const state = freshState();
      expect(state.isRunning).toBe(false);
      const result = timerReducer(state, { type: TIMER_ACTIONS.START_TIMER });
      expect(result.isRunning).toBe(true);
    });

    it('does not mutate the original state', () => {
      const state = freshState();
      const result = timerReducer(state, { type: TIMER_ACTIONS.START_TIMER });
      expect(state.isRunning).toBe(false);
      expect(result).not.toBe(state);
    });
  });

  // -----------------------------------------------------------------------
  // PAUSE_TIMER
  // -----------------------------------------------------------------------
  describe('PAUSE_TIMER', () => {
    it('sets isRunning to false', () => {
      const state: TimerState = { ...freshState(), isRunning: true };
      const result = timerReducer(state, { type: TIMER_ACTIONS.PAUSE_TIMER });
      expect(result.isRunning).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // RESET_TIMER
  // -----------------------------------------------------------------------
  describe('RESET_TIMER', () => {
    it('resets time, sessionTime, and phaseTime to 0', () => {
      const state: TimerState = {
        ...freshState(),
        time: 120,
        sessionTime: 90,
        phaseTime: 45,
      };
      const result = timerReducer(state, { type: TIMER_ACTIONS.RESET_TIMER });
      expect(result.time).toBe(0);
      expect(result.sessionTime).toBe(0);
      expect(result.phaseTime).toBe(0);
    });

    it('preserves other state fields', () => {
      const state: TimerState = {
        ...freshState(),
        time: 120,
        isRunning: true,
        isSessionActive: true,
      };
      const result = timerReducer(state, { type: TIMER_ACTIONS.RESET_TIMER });
      expect(result.isRunning).toBe(true);
      expect(result.isSessionActive).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // UPDATE_TIME
  // -----------------------------------------------------------------------
  describe('UPDATE_TIME', () => {
    it('updates time, sessionTime, and phaseTime', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.UPDATE_TIME,
        payload: { time: 10, sessionTime: 8, phaseTime: 3 },
      });
      expect(result.time).toBe(10);
      expect(result.sessionTime).toBe(8);
      expect(result.phaseTime).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // START_SESSION
  // -----------------------------------------------------------------------
  describe('START_SESSION', () => {
    it('activates session and resets phase counters', () => {
      const state: TimerState = {
        ...freshState(),
        currentPhase: 3,
        phaseTime: 42,
        sessionTime: 200,
      };
      const result = timerReducer(state, {
        type: TIMER_ACTIONS.START_SESSION,
        payload: {},
      });
      expect(result.isSessionActive).toBe(true);
      expect(result.isPaused).toBe(false);
      expect(result.sessionTime).toBe(0);
      expect(result.currentPhase).toBe(0);
      expect(result.phaseTime).toBe(0);
      expect(result.stretchConfirmed).toBe(false);
      expect(result.maxHoldCompleted).toBe(false);
      expect(result.showNextPhaseInstructions).toBe(false);
      expect(result.nextPhaseInstruction).toBeNull();
    });

    it('sets isRestPhase from payload', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.START_SESSION,
        payload: { isRestPhase: true },
      });
      expect(result.isRestPhase).toBe(true);
    });

    it('defaults isRestPhase to false when not provided', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.START_SESSION,
        payload: {},
      });
      expect(result.isRestPhase).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // PAUSE_SESSION / RESUME_SESSION
  // -----------------------------------------------------------------------
  describe('PAUSE_SESSION', () => {
    it('sets isPaused to true', () => {
      const state: TimerState = { ...freshState(), isPaused: false };
      const result = timerReducer(state, { type: TIMER_ACTIONS.PAUSE_SESSION });
      expect(result.isPaused).toBe(true);
    });
  });

  describe('RESUME_SESSION', () => {
    it('sets isPaused to false', () => {
      const state: TimerState = { ...freshState(), isPaused: true };
      const result = timerReducer(state, { type: TIMER_ACTIONS.RESUME_SESSION });
      expect(result.isPaused).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // END_SESSION
  // -----------------------------------------------------------------------
  describe('END_SESSION', () => {
    it('sets isSessionActive false, sessionCompleted true, stores summary', () => {
      const summary = makeSummary();
      const state: TimerState = { ...freshState(), isSessionActive: true };
      const result = timerReducer(state, {
        type: TIMER_ACTIONS.END_SESSION,
        payload: { summary },
      });
      expect(result.isSessionActive).toBe(false);
      expect(result.sessionCompleted).toBe(true);
      expect(result.sessionSummary).toEqual(summary);
    });
  });

  // -----------------------------------------------------------------------
  // RESET_SESSION
  // -----------------------------------------------------------------------
  describe('RESET_SESSION', () => {
    it('resets all session-related state', () => {
      const state: TimerState = {
        ...freshState(),
        isSessionActive: true,
        sessionCompleted: true,
        sessionSummary: makeSummary(),
        currentPhase: 4,
        phaseTime: 30,
        stretchConfirmed: true,
        maxHoldCompleted: true,
        showNextPhaseInstructions: true,
        nextPhaseInstruction: { title: 'test', description: 'test', steps: [] },
      };
      const result = timerReducer(state, { type: TIMER_ACTIONS.RESET_SESSION });
      expect(result.isSessionActive).toBe(false);
      expect(result.sessionCompleted).toBe(false);
      expect(result.sessionSummary).toBeNull();
      expect(result.currentPhase).toBe(0);
      expect(result.phaseTime).toBe(0);
      expect(result.stretchConfirmed).toBe(false);
      expect(result.maxHoldCompleted).toBe(false);
      expect(result.showNextPhaseInstructions).toBe(false);
      expect(result.nextPhaseInstruction).toBeNull();
    });

    it('preserves timer running state', () => {
      const state: TimerState = { ...freshState(), isRunning: true, time: 55 };
      const result = timerReducer(state, { type: TIMER_ACTIONS.RESET_SESSION });
      expect(result.isRunning).toBe(true);
      expect(result.time).toBe(55);
    });
  });

  // -----------------------------------------------------------------------
  // SET_CURRENT_PHASE
  // -----------------------------------------------------------------------
  describe('SET_CURRENT_PHASE', () => {
    it('sets currentPhase and resets phaseTime to 0', () => {
      const state: TimerState = { ...freshState(), currentPhase: 0, phaseTime: 25 };
      const result = timerReducer(state, {
        type: TIMER_ACTIONS.SET_CURRENT_PHASE,
        payload: 3,
      });
      expect(result.currentPhase).toBe(3);
      expect(result.phaseTime).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // NEXT_PHASE
  // -----------------------------------------------------------------------
  describe('NEXT_PHASE', () => {
    it('increments currentPhase, resets phaseTime, and updates isRestPhase', () => {
      const phases: Phase[] = [
        makePhase({ type: 'hold' }),
        makePhase({ type: 'rest' }),
        makePhase({ type: 'hold' }),
      ];
      const state: TimerState = {
        ...freshState(),
        currentPhase: 0,
        phaseTime: 60,
        sessionPhases: phases,
      };
      const result = timerReducer(state, { type: TIMER_ACTIONS.NEXT_PHASE });
      expect(result.currentPhase).toBe(1);
      expect(result.phaseTime).toBe(0);
      expect(result.isRestPhase).toBe(true);
    });

    it('sets isRestPhase to false when next phase is not rest', () => {
      const phases: Phase[] = [
        makePhase({ type: 'rest' }),
        makePhase({ type: 'hold' }),
      ];
      const state: TimerState = {
        ...freshState(),
        currentPhase: 0,
        phaseTime: 30,
        sessionPhases: phases,
        isRestPhase: true,
      };
      const result = timerReducer(state, { type: TIMER_ACTIONS.NEXT_PHASE });
      expect(result.currentPhase).toBe(1);
      expect(result.isRestPhase).toBe(false);
    });

    it('handles advancing past the last phase gracefully', () => {
      const phases: Phase[] = [makePhase({ type: 'hold' })];
      const state: TimerState = {
        ...freshState(),
        currentPhase: 0,
        sessionPhases: phases,
      };
      const result = timerReducer(state, { type: TIMER_ACTIONS.NEXT_PHASE });
      expect(result.currentPhase).toBe(1);
      // sessionPhases[1] is undefined, so isRestPhase should be false
      expect(result.isRestPhase).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // SET_SESSION_PHASES
  // -----------------------------------------------------------------------
  describe('SET_SESSION_PHASES', () => {
    it('sets the sessionPhases array', () => {
      const phases: Phase[] = [
        makePhase({ type: 'hold', duration: 30 }),
        makePhase({ type: 'rest', duration: 15 }),
      ];
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_SESSION_PHASES,
        payload: phases,
      });
      expect(result.sessionPhases).toEqual(phases);
      expect(result.sessionPhases).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // SET_SELECTED_SESSION_TYPE
  // -----------------------------------------------------------------------
  describe('SET_SELECTED_SESSION_TYPE', () => {
    it('sets selectedSessionType to a string', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_SELECTED_SESSION_TYPE,
        payload: 'Breath Control',
      });
      expect(result.selectedSessionType).toBe('Breath Control');
    });

    it('sets selectedSessionType to null', () => {
      const state: TimerState = {
        ...freshState(),
        selectedSessionType: 'Breath Control',
      };
      const result = timerReducer(state, {
        type: TIMER_ACTIONS.SET_SELECTED_SESSION_TYPE,
        payload: null,
      });
      expect(result.selectedSessionType).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // UPDATE_SESSION_TEMPLATE
  // -----------------------------------------------------------------------
  describe('UPDATE_SESSION_TEMPLATE', () => {
    it('merges a template update into sessionTemplates', () => {
      const template: SessionTemplate = { stretchConfirmation: true, tidalBreathingDuration: 120 };
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.UPDATE_SESSION_TEMPLATE,
        payload: { type: 'Breath Control', template },
      });
      expect(result.sessionTemplates['Breath Control']).toEqual(template);
    });

    it('preserves other templates', () => {
      const state = freshState();
      const originalKeys = Object.keys(state.sessionTemplates);
      const template: SessionTemplate = { stretchConfirmation: false };
      const result = timerReducer(state, {
        type: TIMER_ACTIONS.UPDATE_SESSION_TEMPLATE,
        payload: { type: 'NewType', template },
      });
      originalKeys.forEach((key) => {
        expect(result.sessionTemplates[key]).toBeDefined();
      });
      expect(result.sessionTemplates['NewType']).toEqual(template);
    });
  });

  // -----------------------------------------------------------------------
  // SET_SESSION_TEMPLATES
  // -----------------------------------------------------------------------
  describe('SET_SESSION_TEMPLATES', () => {
    it('replaces the entire sessionTemplates object', () => {
      const newTemplates = { Custom: { stretchConfirmation: true } };
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_SESSION_TEMPLATES,
        payload: newTemplates,
      });
      expect(result.sessionTemplates).toEqual(newTemplates);
    });
  });

  // -----------------------------------------------------------------------
  // Simple setter actions
  // -----------------------------------------------------------------------
  describe('SET_PHASE_TIME', () => {
    it('sets phaseTime', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_PHASE_TIME,
        payload: 42,
      });
      expect(result.phaseTime).toBe(42);
    });
  });

  describe('SET_SESSION_COMPLETED', () => {
    it('sets sessionCompleted', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_SESSION_COMPLETED,
        payload: true,
      });
      expect(result.sessionCompleted).toBe(true);
    });
  });

  describe('SET_SESSION_SUMMARY', () => {
    it('sets sessionSummary', () => {
      const summary = makeSummary();
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_SESSION_SUMMARY,
        payload: summary,
      });
      expect(result.sessionSummary).toEqual(summary);
    });

    it('clears sessionSummary with null', () => {
      const state: TimerState = {
        ...freshState(),
        sessionSummary: makeSummary(),
      };
      const result = timerReducer(state, {
        type: TIMER_ACTIONS.SET_SESSION_SUMMARY,
        payload: null,
      });
      expect(result.sessionSummary).toBeNull();
    });
  });

  describe('SET_STRETCH_CONFIRMED', () => {
    it('sets stretchConfirmed', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_STRETCH_CONFIRMED,
        payload: true,
      });
      expect(result.stretchConfirmed).toBe(true);
    });
  });

  describe('SET_MAX_HOLD_COMPLETED', () => {
    it('sets maxHoldCompleted', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_MAX_HOLD_COMPLETED,
        payload: true,
      });
      expect(result.maxHoldCompleted).toBe(true);
    });
  });

  describe('SET_CURRENT_MAX_HOLD_PHASE', () => {
    it('sets currentMaxHoldPhase', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_CURRENT_MAX_HOLD_PHASE,
        payload: 2,
      });
      expect(result.currentMaxHoldPhase).toBe(2);
    });
  });

  describe('SET_SHOW_INSTRUCTIONS', () => {
    it('sets showInstructions', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_SHOW_INSTRUCTIONS,
        payload: true,
      });
      expect(result.showInstructions).toBe(true);
    });
  });

  describe('SET_CURRENT_INSTRUCTION', () => {
    it('sets currentInstruction', () => {
      const instruction = { title: 'Breathe', description: 'Inhale deeply', steps: ['Step 1'] };
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_CURRENT_INSTRUCTION,
        payload: instruction,
      });
      expect(result.currentInstruction).toEqual(instruction);
    });

    it('clears with null', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_CURRENT_INSTRUCTION,
        payload: null,
      });
      expect(result.currentInstruction).toBeNull();
    });
  });

  describe('SET_HAS_USER_CHANGED_SESSION', () => {
    it('sets hasUserChangedSession', () => {
      const result = timerReducer(freshState(), {
        type: TIMER_ACTIONS.SET_HAS_USER_CHANGED_SESSION,
        payload: true,
      });
      expect(result.hasUserChangedSession).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Default case
  // -----------------------------------------------------------------------
  describe('default case', () => {
    it('returns state unchanged for unknown action type', () => {
      const state = freshState();
      const result = timerReducer(state, { type: 'UNKNOWN_ACTION' } as any);
      expect(result).toBe(state);
    });
  });
});
