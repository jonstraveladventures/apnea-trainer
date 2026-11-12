import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { TimerProvider, useTimerContext } from '../../context/TimerContext';
import useSessionTimer from '../useSessionTimer';
import { Phase } from '../../types';

const makeCues = () => ({
  playCue: jest.fn(),
  playSound: jest.fn(),
  speak: jest.fn()
});

const setup = (phases: Phase[]) => {
  const audioCues = makeCues();
  const onSessionComplete = jest.fn();
  const wrapper = ({ children }: { children: React.ReactNode }) => <TimerProvider>{children}</TimerProvider>;
  const hook = renderHook(
    () => ({ ctx: useTimerContext(), timer: useSessionTimer({ audioCues, onSessionComplete }) }),
    { wrapper }
  );
  act(() => {
    hook.result.current.ctx.actions.setSessionPhases(phases);
  });
  act(() => {
    hook.result.current.timer.startSession(() => {});
  });
  return { hook, audioCues, onSessionComplete };
};

/** Advance in 100 ms steps, letting React render between steps as a browser would. */
const advance = (ms: number) => {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) {
    act(() => {
      jest.advanceTimersByTime(Math.min(100, ms - elapsed));
    });
  }
};

const cueTypes = (cues: ReturnType<typeof makeCues>) => cues.playCue.mock.calls.map((c) => c[0]);

beforeEach(() => {
  jest.useFakeTimers();
  // The clock reads performance.now(); tie it to the faked Date so tests control it.
  jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useSessionTimer', () => {
  it('advances exactly one second per second of real time', () => {
    const { hook } = setup([{ type: 'hold', duration: 60, description: 'Hold' }]);
    advance(3000);
    expect(hook.result.current.ctx.state.phaseTime).toBe(3);
    expect(hook.result.current.ctx.state.sessionTime).toBe(3);
    advance(10000);
    expect(hook.result.current.ctx.state.phaseTime).toBe(13);
  });

  it('stops the clock while paused and resumes where it left off', () => {
    const { hook } = setup([{ type: 'hold', duration: 60, description: 'Hold' }]);
    advance(2000);
    act(() => hook.result.current.timer.pauseSession());
    advance(5000);
    expect(hook.result.current.ctx.state.phaseTime).toBe(2);
    act(() => hook.result.current.timer.resumeSession());
    advance(1000);
    expect(hook.result.current.ctx.state.phaseTime).toBe(3);
  });

  it('moves through phases, plays cues on time and finishes the session once', () => {
    const { hook, audioCues, onSessionComplete } = setup([
      { type: 'hold', duration: 8, description: 'Hold' },
      { type: 'rest', duration: 2, description: 'Rest' }
    ]);
    expect(cueTypes(audioCues)).toEqual(['phaseStart']);

    advance(3000); // 5 s left in the hold
    expect(cueTypes(audioCues)).toContain('countdown');

    advance(5000);
    expect(hook.result.current.ctx.state.currentPhase).toBe(1);
    expect(hook.result.current.ctx.state.phaseTime).toBe(0);
    expect(cueTypes(audioCues).slice(-2)).toEqual(['phaseEnd', 'phaseStart']);

    advance(2000);
    expect(hook.result.current.ctx.state.isSessionActive).toBe(false);
    expect(hook.result.current.ctx.state.sessionSummary?.totalTime).toBe(10);
    expect(onSessionComplete).toHaveBeenCalledTimes(1);
    expect(onSessionComplete).toHaveBeenCalledWith(10, null);

    advance(5000);
    expect(onSessionComplete).toHaveBeenCalledTimes(1);
  });

  it('lets an open-ended max hold run past any limit and records it', () => {
    const { hook, onSessionComplete } = setup([
      { type: 'max_hold', duration: 0, description: 'Max Hold', isMaxHold: true },
      { type: 'rest', duration: 60, description: 'Rest' }
    ]);
    advance(200000);
    expect(hook.result.current.ctx.state.currentPhase).toBe(0);
    expect(hook.result.current.ctx.state.phaseTime).toBe(200);

    act(() => hook.result.current.timer.handleMaxHoldComplete());
    expect(hook.result.current.ctx.state.currentPhase).toBe(1);

    advance(10000);
    act(() => hook.result.current.timer.endSession());
    expect(hook.result.current.ctx.state.sessionSummary?.bestHold).toBe(200);
    expect(onSessionComplete).toHaveBeenCalledWith(210, 200);
  });

  it('catches up after background throttling without replaying stale cues', () => {
    const { hook, audioCues } = setup([
      { type: 'hold', duration: 10, description: 'Hold' },
      { type: 'rest', duration: 60, description: 'Rest' }
    ]);
    audioCues.playCue.mockClear();

    // 30 s pass with no timer callbacks (a throttled background tab), then one tick.
    act(() => {
      jest.setSystemTime(Date.now() + 30000);
    });
    advance(200);

    expect(hook.result.current.ctx.state.currentPhase).toBe(1);
    expect(hook.result.current.ctx.state.phaseTime).toBe(20);
    expect(hook.result.current.ctx.state.sessionTime).toBe(30);
    expect(cueTypes(audioCues)).not.toContain('countdown');
    expect(cueTypes(audioCues)).not.toContain('phaseEnd');
  });
});
