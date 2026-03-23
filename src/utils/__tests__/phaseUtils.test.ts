import {
  getPhaseIcon,
  getExerciseTypeFromPhase,
  getPhaseGuidance,
  getTimerColor,
} from '../phaseUtils';
import { Phase } from '../../types/index';

describe('getPhaseIcon', () => {
  it('returns lung emoji for hold', () => {
    expect(getPhaseIcon('hold')).toBe('\u{1FAC1}');
  });

  it('returns relieved face emoji for rest', () => {
    expect(getPhaseIcon('rest')).toBe('\u{1F60C}');
  });

  it('returns default timer emoji for unknown type', () => {
    expect(getPhaseIcon('unknown_type')).toBe('\u{23F1}\uFE0F');
  });

  it('returns box emoji for box type', () => {
    expect(getPhaseIcon('box')).toBe('\u{1F4E6}');
  });

  it('returns snowflake emoji for cooldown', () => {
    expect(getPhaseIcon('cooldown')).toBe('\u{2744}\uFE0F');
  });
});

describe('getExerciseTypeFromPhase', () => {
  it('returns tidal_breathing for phase with "Tidal Breathing" in description', () => {
    const phase: Phase = { type: 'tidal_breathing', duration: 120, description: 'Tidal Breathing (2:00)' };
    expect(getExerciseTypeFromPhase(phase)).toBe('tidal_breathing');
  });

  it('returns box_breathing for phase with "Box Breathing" in description', () => {
    const phase: Phase = { type: 'box', duration: 300, description: 'Box Breathing (5:00)' };
    expect(getExerciseTypeFromPhase(phase)).toBe('box_breathing');
  });

  it('returns null for phase with unrecognized description', () => {
    const phase: Phase = { type: 'hold', duration: 60, description: 'something random' };
    expect(getExerciseTypeFromPhase(phase)).toBeNull();
  });

  it('returns null for null phase', () => {
    expect(getExerciseTypeFromPhase(null as unknown as Phase)).toBeNull();
  });

  it('returns null for undefined phase', () => {
    expect(getExerciseTypeFromPhase(undefined as unknown as Phase)).toBeNull();
  });

  it('returns diaphragmatic_breathing for Diaphragmatic description', () => {
    const phase: Phase = { type: 'breathing', duration: 600, description: 'Diaphragmatic Breathing (10:00)' };
    expect(getExerciseTypeFromPhase(phase)).toBe('diaphragmatic_breathing');
  });

  it('returns stretch_confirmation for Stretch description', () => {
    const phase: Phase = { type: 'stretch_confirmation', duration: 0, description: 'Stretch Confirmation' };
    expect(getExerciseTypeFromPhase(phase)).toBe('stretch_confirmation');
  });
});

describe('getPhaseGuidance', () => {
  it('returns non-empty string for a known phase type', () => {
    const phase: Phase = { type: 'tidal_breathing', duration: 120, description: 'Tidal Breathing (2:00)' };
    const guidance = getPhaseGuidance(phase);
    expect(guidance).toBeTruthy();
    expect(guidance.length).toBeGreaterThan(0);
  });

  it('returns specific guidance for box breathing', () => {
    const phase: Phase = { type: 'box', duration: 300, description: 'Box Breathing (5:00)' };
    const guidance = getPhaseGuidance(phase);
    expect(guidance).toContain('4-4-4-4');
  });

  it('returns default guidance for unknown phase', () => {
    const phase: Phase = { type: 'hold', duration: 60, description: 'something random' };
    expect(getPhaseGuidance(phase)).toBe('Focus on your breathing and stay relaxed.');
  });

  it('returns default guidance for null phase', () => {
    expect(getPhaseGuidance(null as unknown as Phase)).toBe('Focus on your breathing and stay relaxed.');
  });
});

describe('getTimerColor', () => {
  it('returns green for rest phase', () => {
    const phase: Phase = { type: 'rest', duration: 60, description: 'Rest' };
    expect(getTimerColor(phase, 30)).toBe('text-green-400');
  });

  it('returns green for hold at 10% progress', () => {
    const phase: Phase = { type: 'hold', duration: 100, description: 'Hold' };
    // phaseTime=10, progress=0.1 => < 0.3 => green
    expect(getTimerColor(phase, 10)).toBe('text-green-400');
  });

  it('returns red for hold at 90% progress', () => {
    const phase: Phase = { type: 'hold', duration: 100, description: 'Hold' };
    // phaseTime=90, progress=0.9 => >= 0.8 => red
    expect(getTimerColor(phase, 90)).toBe('text-red-400');
  });

  it('returns blue for null phaseData', () => {
    expect(getTimerColor(null as unknown as Phase, 10)).toBe('text-blue-400');
  });

  it('returns yellow for hold at 40% progress', () => {
    const phase: Phase = { type: 'hold', duration: 100, description: 'Hold' };
    // phaseTime=40, progress=0.4 => >= 0.3 and < 0.6 => yellow
    expect(getTimerColor(phase, 40)).toBe('text-yellow-400');
  });

  it('returns orange for hold at 70% progress', () => {
    const phase: Phase = { type: 'hold', duration: 100, description: 'Hold' };
    // phaseTime=70, progress=0.7 => >= 0.6 and < 0.8 => orange
    expect(getTimerColor(phase, 70)).toBe('text-orange-400');
  });

  it('returns blue for tidal_breathing phase', () => {
    const phase: Phase = { type: 'tidal_breathing', duration: 120, description: 'Tidal' };
    expect(getTimerColor(phase, 60)).toBe('text-blue-400');
  });

  it('returns blue for phase with zero duration', () => {
    const phase: Phase = { type: 'hold', duration: 0, description: 'Hold' };
    expect(getTimerColor(phase, 0)).toBe('text-blue-400');
  });
});
