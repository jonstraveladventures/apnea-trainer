import {
  formatTime,
  parseTime,
  getWeekday,
  calculateProgress,
  generateSchedule,
  getLatestMaxHold,
} from '../trainingLogic';
import { Session } from '../../types/index';

describe('formatTime', () => {
  it('formats 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 65 seconds as 01:05', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats 3600 seconds as 60:00', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('returns 00:00 for null', () => {
    expect(formatTime(null)).toBe('00:00');
  });

  it('returns 00:00 for undefined', () => {
    expect(formatTime(undefined)).toBe('00:00');
  });

  it('returns 00:00 for negative values', () => {
    expect(formatTime(-10)).toBe('00:00');
  });
});

describe('parseTime', () => {
  it('parses "01:30" to 90 seconds', () => {
    expect(parseTime('01:30')).toBe(90);
  });

  it('parses "00:45" to 45 seconds', () => {
    expect(parseTime('00:45')).toBe(45);
  });

  it('returns 0 for null', () => {
    expect(parseTime(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(parseTime(undefined)).toBe(0);
  });

  it('parses "5" as 5 minutes (300 seconds)', () => {
    // "5".split(":") => ["5"], mins=5, secs=undefined => (5*60)+(0) = 300
    expect(parseTime('5')).toBe(300);
  });
});

describe('getWeekday', () => {
  it('returns 1 for a known Monday', () => {
    // 2025-08-04 is a Monday
    expect(getWeekday('2025-08-04')).toBe(1);
  });

  it('returns 7 for a known Sunday', () => {
    // 2025-08-03 is a Sunday
    expect(getWeekday('2025-08-03')).toBe(7);
  });

  it('returns 3 for a known Wednesday', () => {
    // 2025-08-06 is a Wednesday
    expect(getWeekday('2025-08-06')).toBe(3);
  });
});

describe('calculateProgress', () => {
  it('returns 0 for an empty array', () => {
    expect(calculateProgress([])).toBe(0);
  });

  it('returns 60 when 3 of 5 sessions are completed', () => {
    const sessions: Session[] = [
      { date: '2025-08-02', focus: 'A', notes: '', actualMaxHold: null, completed: true },
      { date: '2025-08-03', focus: 'B', notes: '', actualMaxHold: null, completed: true },
      { date: '2025-08-04', focus: 'C', notes: '', actualMaxHold: null, completed: true },
      { date: '2025-08-05', focus: 'D', notes: '', actualMaxHold: null, completed: false },
      { date: '2025-08-06', focus: 'E', notes: '', actualMaxHold: null, completed: false },
    ];
    expect(calculateProgress(sessions)).toBe(60);
  });

  it('returns 100 when all sessions are completed', () => {
    const sessions: Session[] = [
      { date: '2025-08-02', focus: 'A', notes: '', actualMaxHold: null, completed: true },
      { date: '2025-08-03', focus: 'B', notes: '', actualMaxHold: null, completed: true },
    ];
    expect(calculateProgress(sessions)).toBe(100);
  });
});

describe('generateSchedule', () => {
  it('generates the correct number of days', () => {
    // 3-day range: Aug 2, 3, 4
    const schedule = generateSchedule('2025-08-02', '2025-08-04', 240);
    expect(schedule).toHaveLength(3);
  });

  it('each session has date, focus, and completed=false', () => {
    const schedule = generateSchedule('2025-08-02', '2025-08-04', 240);
    schedule.forEach((session) => {
      expect(session.date).toBeDefined();
      expect(session.focus).toBeDefined();
      expect(session.completed).toBe(false);
    });
  });

  it('returns an empty array if start > end', () => {
    const schedule = generateSchedule('2025-08-10', '2025-08-05', 240);
    expect(schedule).toHaveLength(0);
  });

  it('generates a single-day schedule when start equals end', () => {
    const schedule = generateSchedule('2025-08-02', '2025-08-02', 240);
    expect(schedule).toHaveLength(1);
  });
});

describe('getLatestMaxHold', () => {
  it('returns the most recent non-null max hold', () => {
    const sessions: Session[] = [
      { date: '2025-08-02', focus: 'A', notes: '', actualMaxHold: 120, completed: true },
      { date: '2025-08-05', focus: 'B', notes: '', actualMaxHold: 180, completed: true },
      { date: '2025-08-03', focus: 'C', notes: '', actualMaxHold: 150, completed: true },
    ];
    // Most recent by date is Aug 5 with 180
    expect(getLatestMaxHold(sessions)).toBe(180);
  });

  it('returns null if no max holds exist', () => {
    const sessions: Session[] = [
      { date: '2025-08-02', focus: 'A', notes: '', actualMaxHold: null, completed: false },
      { date: '2025-08-03', focus: 'B', notes: '', actualMaxHold: null, completed: false },
    ];
    expect(getLatestMaxHold(sessions)).toBeNull();
  });

  it('returns null for an empty array', () => {
    expect(getLatestMaxHold([])).toBeNull();
  });

  it('skips sessions with actualMaxHold of 0', () => {
    const sessions: Session[] = [
      { date: '2025-08-02', focus: 'A', notes: '', actualMaxHold: 0, completed: true },
      { date: '2025-08-03', focus: 'B', notes: '', actualMaxHold: 200, completed: true },
    ];
    expect(getLatestMaxHold(sessions)).toBe(200);
  });
});
