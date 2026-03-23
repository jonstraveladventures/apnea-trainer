import {
  parseSessionPhases,
  addCooldownPhase,
  parseCo2Table,
} from '../sessionParsers';
import { SESSION_TEMPLATES } from '../../config/sessionTemplates';
import { Phase } from '../../types/index';

describe('parseSessionPhases', () => {
  describe('Traditional CO2 Tables', () => {
    const sessionType = 'Traditional CO₂ Tables';
    const template = SESSION_TEMPLATES[sessionType];
    const maxHold = 240;

    it('returns an array of phases', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      expect(Array.isArray(phases)).toBe(true);
      expect(phases.length).toBeGreaterThan(0);
    });

    it('starts with stretch_confirmation and tidal_breathing', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      expect(phases[0].type).toBe('stretch_confirmation');
      expect(phases[1].type).toBe('tidal_breathing');
    });

    it('has hold durations that increase progressively', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      const holds = phases.filter((p) => p.type === 'hold');
      for (let i = 1; i < holds.length; i++) {
        expect(holds[i].duration).toBeGreaterThan(holds[i - 1].duration);
      }
    });

    it('has the correct number of hold phases', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      const holds = phases.filter((p) => p.type === 'hold');
      expect(holds).toHaveLength(template.holdCount || 5);
    });

    it('ends with a cooldown phase', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      expect(phases[phases.length - 1].type).toBe('cooldown');
    });
  });

  describe('O2 Tolerance', () => {
    const sessionType = 'O₂ Tolerance';
    const template = SESSION_TEMPLATES[sessionType];
    const maxHold = 240;

    it('has hold durations increasing from 60% to 95% of max', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      const holds = phases.filter((p) => p.type === 'hold');

      // First hold: 60% of 240 = 144
      expect(holds[0].duration).toBe(Math.round(maxHold * 0.6));
      // Last hold: min(60 + 4*10, 95) = 95% of 240 = 228
      const lastHoldPercentage = Math.min(60 + (holds.length - 1) * 10, 95);
      expect(holds[holds.length - 1].duration).toBe(Math.round(maxHold * (lastHoldPercentage / 100)));
    });

    it('has rest periods fixed at 180s', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      const rests = phases.filter((p) => p.type === 'rest');
      rests.forEach((rest) => {
        expect(rest.duration).toBe(180);
      });
    });
  });

  describe('Breath Control', () => {
    const sessionType = 'Breath Control';
    const template = SESSION_TEMPLATES[sessionType];
    const maxHold = 240;

    it('has diaphragmatic, alternate nostril, and box breathing phases', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      const descriptions = phases.map((p) => p.description);
      expect(descriptions.some((d) => d.includes('Diaphragmatic'))).toBe(true);
      expect(descriptions.some((d) => d.includes('Alternate Nostril'))).toBe(true);
      expect(descriptions.some((d) => d.includes('Box Breathing'))).toBe(true);
    });

    it('does not have a cooldown phase', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      expect(phases.some((p) => p.type === 'cooldown')).toBe(false);
    });

    it('does not have stretch_confirmation at the beginning', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      expect(phases[0].type).not.toBe('stretch_confirmation');
    });
  });

  describe('Comfortable CO2 Training', () => {
    const sessionType = 'Comfortable CO₂ Training';
    const template = SESSION_TEMPLATES[sessionType];
    const maxHold = 240;

    it('has hold duration at 40% of max (96s)', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      const holds = phases.filter((p) => p.type === 'hold');
      holds.forEach((hold) => {
        expect(hold.duration).toBe(Math.round(maxHold * 0.4));
      });
    });

    it('has 7 hold phases', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      const holds = phases.filter((p) => p.type === 'hold');
      expect(holds).toHaveLength(7);
    });

    it('has rest periods with a decreasing-then-increasing pattern', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      const rests = phases.filter((p) => p.type === 'rest' && p.isComfortableCo2);
      const expectedPattern = [120, 105, 90, 75, 60, 75];
      expect(rests).toHaveLength(expectedPattern.length);
      rests.forEach((rest, i) => {
        expect(rest.duration).toBe(expectedPattern[i]);
      });
    });

    it('has preparation phases (diaphragmatic + box breathing)', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      const prepPhases = phases.filter((p) => p.isComfortablePreparation);
      expect(prepPhases.length).toBe(2);
    });

    it('has recovery phases (natural tidal + slow-exhale)', () => {
      const phases = parseSessionPhases(sessionType, template, maxHold);
      const recoveryPhases = phases.filter((p) => p.isComfortableRecovery);
      expect(recoveryPhases.length).toBe(2);
    });
  });

  describe('default/unknown type', () => {
    it('returns an array with a default hold phase for unknown session type', () => {
      const phases = parseSessionPhases('Unknown Session', {}, 240);
      // Should have stretch_confirmation + tidal_breathing (from common) + default hold + cooldown
      const holdPhases = phases.filter((p) => p.type === 'hold');
      expect(holdPhases).toHaveLength(1);
      expect(holdPhases[0].description).toBe('Default Hold');
      expect(holdPhases[0].duration).toBe(60);
    });
  });
});

describe('addCooldownPhase', () => {
  it('adds a 180s cooldown phase to the end', () => {
    const phases: Phase[] = [
      { type: 'hold', duration: 60, description: 'Hold 1' },
    ];
    const result = addCooldownPhase(phases);
    expect(result).toHaveLength(2);
    expect(result[result.length - 1].type).toBe('cooldown');
    expect(result[result.length - 1].duration).toBe(180);
  });

  it('returns empty array when given empty array (no cooldown added)', () => {
    const result = addCooldownPhase([]);
    expect(result).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const original: Phase[] = [
      { type: 'hold', duration: 60, description: 'Hold 1' },
    ];
    const result = addCooldownPhase(original);
    expect(original).toHaveLength(1);
    expect(result).toHaveLength(2);
  });
});

describe('parseCo2Table', () => {
  const template = SESSION_TEMPLATES['Traditional CO₂ Tables'];

  it('uses the prefix in descriptions', () => {
    const phases = parseCo2Table(template, 240, 'Test Prefix');
    const holds = phases.filter((p) => p.type === 'hold');
    const rests = phases.filter((p) => p.type === 'rest');
    holds.forEach((h) => {
      expect(h.description).toContain('Test Prefix');
    });
    rests.forEach((r) => {
      expect(r.description).toContain('Test Prefix');
    });
  });

  it('generates correct hold/rest alternation', () => {
    const phases = parseCo2Table(template, 240, 'CO₂');
    // Pattern should be: hold, rest, hold, rest, ..., hold (last hold has no rest after)
    for (let i = 0; i < phases.length; i++) {
      if (i % 2 === 0) {
        expect(phases[i].type).toBe('hold');
      } else {
        expect(phases[i].type).toBe('rest');
      }
    }
  });

  it('generates correct number of holds and rests', () => {
    const phases = parseCo2Table(template, 240, 'CO₂');
    const holds = phases.filter((p) => p.type === 'hold');
    const rests = phases.filter((p) => p.type === 'rest');
    expect(holds).toHaveLength(template.holdCount || 5);
    expect(rests).toHaveLength((template.holdCount || 5) - 1);
  });

  it('has progressively increasing hold durations', () => {
    const phases = parseCo2Table(template, 240, 'CO₂');
    const holds = phases.filter((p) => p.type === 'hold');
    for (let i = 1; i < holds.length; i++) {
      expect(holds[i].duration).toBeGreaterThan(holds[i - 1].duration);
    }
  });

  it('uses default prefix when none provided', () => {
    const phases = parseCo2Table(template, 240);
    const holds = phases.filter((p) => p.type === 'hold');
    holds.forEach((h) => {
      expect(h.description).toContain('CO₂');
    });
  });
});
