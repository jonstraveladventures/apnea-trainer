import {
  validateImportedTrainingData,
  validateImportedProfile,
} from '../profileValidation';

describe('validateImportedTrainingData', () => {
  it('rejects non-object input', () => {
    expect(validateImportedTrainingData(null).ok).toBe(false);
    expect(validateImportedTrainingData('hello').ok).toBe(false);
    expect(validateImportedTrainingData(42).ok).toBe(false);
    expect(validateImportedTrainingData([1, 2, 3]).ok).toBe(false);
  });

  it('accepts an empty object (no fields to import)', () => {
    const r = validateImportedTrainingData({});
    expect(r.ok).toBe(true);
    expect(r.value).toEqual({});
  });

  it('accepts well-formed sessions', () => {
    const r = validateImportedTrainingData({
      sessions: [
        { date: '2026-01-01', focus: 'CO₂ Tolerance', completed: false, notes: '', actualMaxHold: null },
        { date: '2026-01-02', focus: 'O₂ Tolerance', completed: true, notes: 'good', actualMaxHold: 240 },
      ],
    });
    expect(r.ok).toBe(true);
    expect(r.value?.sessions).toHaveLength(2);
  });

  it('rejects sessions missing required fields', () => {
    const r = validateImportedTrainingData({
      sessions: [{ date: '2026-01-01' }],
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/sessions/);
  });

  it('accepts customSessions with valid phases', () => {
    const r = validateImportedTrainingData({
      customSessions: {
        'My Session': {
          name: 'My Session',
          description: 'Test',
          phases: [
            {
              id: 1,
              type: 'hold',
              duration: 60,
              durationType: 'fixed',
              progressiveChange: 0,
              maxHoldPercentage: 0,
              description: 'hold',
              instructions: 'breathe',
            },
          ],
          stretchConfirmation: false,
          tidalBreathingDuration: 120,
        },
      },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects malformed customSessions', () => {
    const r = validateImportedTrainingData({
      customSessions: { broken: { name: 'X' } },
    });
    expect(r.ok).toBe(false);
  });

  it('rejects weeklySchedule missing days', () => {
    const r = validateImportedTrainingData({
      weeklySchedule: { monday: 'Recovery' }, // missing tuesday-sunday
    });
    expect(r.ok).toBe(false);
  });

  it('accepts a complete weeklySchedule', () => {
    const r = validateImportedTrainingData({
      weeklySchedule: {
        monday: 'X', tuesday: 'X', wednesday: 'X', thursday: 'X',
        friday: 'X', saturday: 'X', sunday: 'X',
      },
    });
    expect(r.ok).toBe(true);
  });
});

describe('validateImportedProfile', () => {
  const validProfile = {
    name: 'Test',
    created: '2026-01-01T00:00:00.000Z',
    sessions: [{ date: '2026-01-01', focus: 'CO₂', completed: false, notes: '', actualMaxHold: null }],
    currentMaxHold: 240,
    customSessions: {},
    weeklySchedule: {
      monday: 'X', tuesday: 'X', wednesday: 'X', thursday: 'X',
      friday: 'X', saturday: 'X', sunday: 'X',
    },
  };

  it('accepts a complete valid profile', () => {
    const r = validateImportedProfile(validProfile);
    expect(r.ok).toBe(true);
    expect(r.value?.name).toBe('Test');
  });

  it('fills missing created with the current ISO date', () => {
    const { created: _c, ...rest } = validProfile;
    const r = validateImportedProfile(rest);
    expect(r.ok).toBe(true);
    expect(r.value?.created).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('rejects missing name', () => {
    const { name: _n, ...rest } = validProfile;
    const r = validateImportedProfile(rest);
    expect(r.ok).toBe(false);
  });

  it('rejects malformed sessions', () => {
    const r = validateImportedProfile({ ...validProfile, sessions: [{ date: 'x' }] });
    expect(r.ok).toBe(false);
  });
});
