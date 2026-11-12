import dayjs from 'dayjs';
import { Session, WeeklySchedule } from '../types/index';

// Training schedule constants
/** Today's date in the user's own time zone, as YYYY-MM-DD (the format session dates use). */
export const todayISO = (): string => dayjs().format('YYYY-MM-DD');

/** @deprecated Fixed when the module loads; use `todayISO()`. */
export const START_DATE: string = todayISO();
export const FOCUS_AREAS: Record<number, string> = {
  1: 'Maximal Breath-Hold Training',
  2: 'Breath Control',
  3: 'O₂ Tolerance',
  4: 'Mental + Technique',
  5: 'Advanced CO₂ Table',
  6: 'Max Breath-Hold',
  7: 'Recovery & Flexibility',
  8: 'Traditional CO₂ Tables'
};

// SESSION_TYPES removed - use FOCUS_AREAS instead (they were identical)

// Generate session details based on max hold time and weekday
export function generateSessionDetails(weekday: number, maxHoldSeconds: number | null): string {
  if (!maxHoldSeconds) {
    return 'Set your max hold time to see personalized session details';
  }

  const details: Record<number, string> = {
    1: `3× maximal breath-hold attempts with 4min rest periods. Evidence-based training for optimal adaptation. ~15min total`,
    2: `10min diaphragmatic + 5min alternate nostril + 8× box breathing (4-4-4-4) + 2min recovery. ~25min total`,
    3: `5× progressive holds (60% → 95% of max). Evidence-based progression to near-maximum. Fixed 3min rest. ~25min total`,
    4: `15min visualization + 10min mindfulness + 10min PMR + 2× mindful holds (60% max). ~45min total`,
    5: `5× ${Math.round(maxHoldSeconds * 0.625)} sec holds. Rest: 2:00 → 0:30`,
    6: `2min tidal breathing + progressive holds: 25% → 35% → 50% → 65% → 2× max holds`,
    7: `3×30s diaphragm stretch, 2× side stretches, 5 min box breathing (4‑4‑4‑4)`,
    8: `5× progressive holds (45s → 75s). 1:1 rest ratio. ~25min total`
  };

  return details[weekday] || 'Rest day';
}

// Get weekday (1-7, where 1 is Monday)
export function getWeekday(date: string | Date | dayjs.Dayjs): number {
  const day = dayjs(date as string).day();
  return day === 0 ? 7 : day; // Convert Sunday (0) to 7
}

const WEEKDAY_KEYS: (keyof WeeklySchedule)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

/** The session type a weekly schedule assigns to a date (falls back to FOCUS_AREAS). */
export function sessionTypeForDate(date: string | dayjs.Dayjs, weeklySchedule?: Partial<WeeklySchedule> | null): string {
  const weekday = getWeekday(dayjs(date));
  return weeklySchedule?.[WEEKDAY_KEYS[weekday - 1]] || FOCUS_AREAS[weekday];
}

/** Short description of a session type for a given max hold. */
export function describeSessionType(sessionType: string, maxHoldSeconds: number | null): string {
  const weekdayFor: Record<string, number> = {
    'Maximal Breath-Hold Training': 1,
    'Breath Control': 2,
    'O₂ Tolerance': 3,
    'Mental + Technique': 4,
    'Advanced CO₂ Table': 5,
    'Max Breath-Hold': 6,
    'Recovery & Flexibility': 7,
    'Traditional CO₂ Tables': 8
  };
  const key = weekdayFor[sessionType];
  return key ? generateSessionDetails(key, maxHoldSeconds) : '';
}

// Generate training schedule for a date range
export function generateSchedule(
  startDate: string,
  endDate: string | Date,
  maxHoldSeconds: number | null,
  weeklySchedule?: Partial<WeeklySchedule> | null
): Session[] {
  const schedule: Session[] = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
    const focus = sessionTypeForDate(currentDate, weeklySchedule);

    schedule.push({
      date: currentDate.format('YYYY-MM-DD'),
      day: currentDate.format('dddd'),
      focus,
      sessionType: focus,
      details: describeSessionType(focus, maxHoldSeconds),
      notes: '',
      actualMaxHold: null,
      completed: false
    });

    currentDate = currentDate.add(1, 'day');
  }

  return schedule;
}

/** True when a session holds something the user did or wrote, so it must never be regenerated. */
function hasUserRecord(session: Session, today: string): boolean {
  if (session.completed) return true;
  if ((session.sessionTime ?? 0) > 0) return true;
  if (session.notes && session.notes.trim()) return true;
  // A max hold on a future, uncompleted day can't be a real result: older
  // versions stamped the current max hold on every generated day.
  if (session.actualMaxHold !== null && session.actualMaxHold !== undefined && session.date <= today) return true;
  return false;
}

/**
 * Bring a plan up to date without losing history.
 *
 * - Every session before `today` is kept exactly as it is.
 * - From `today` on, sessions with a user record (completed, timed, noted, or
 *   a max hold recorded today) are kept as they are.
 * - Other sessions from `today` on get fresh details and no max hold. With
 *   `reassignTypes` they also take the type the weekly schedule gives their
 *   weekday (used when the weekly schedule is saved); without it they keep
 *   their type, so a day changed by hand on the week plan stays changed.
 * - Missing days up to `endDate` are added from the weekly schedule.
 * The result is sorted by date.
 */
export function applyWeeklySchedule(
  sessions: Session[],
  weeklySchedule: Partial<WeeklySchedule> | null | undefined,
  maxHoldSeconds: number | null,
  today: string,
  endDate: string | Date,
  { reassignTypes = true }: { reassignTypes?: boolean } = {}
): Session[] {
  const byDate = new Map<string, Session>();
  for (const s of sessions) byDate.set(s.date, s);

  for (const planned of generateSchedule(today, endDate, maxHoldSeconds, weeklySchedule)) {
    const existing = byDate.get(planned.date);
    if (!existing) {
      byDate.set(planned.date, planned);
    } else if (!hasUserRecord(existing, today)) {
      const focus = reassignTypes ? planned.focus : existing.focus;
      byDate.set(planned.date, {
        ...existing,
        day: planned.day,
        focus,
        sessionType: focus,
        details: describeSessionType(focus, maxHoldSeconds),
        notes: existing.notes || '',
        actualMaxHold: null,
        completed: false
      });
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Get latest max hold time from session data
export function getLatestMaxHold(sessions: Session[]): number | null {
  const maxHolds = sessions
    .filter(session => session.actualMaxHold !== null && session.actualMaxHold > 0)
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

  return maxHolds.length > 0 ? maxHolds[0].actualMaxHold : null;
}

// Format time in MM:SS format
export function formatTime(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Parse time from MM:SS format
export function parseTime(timeString: string | null | undefined): number {
  if (!timeString) return 0;
  const [mins, secs] = timeString.split(':').map(Number);
  return (mins * 60) + (secs || 0);
}

// Calculate progress percentage
export function calculateProgress(sessions: Session[]): number {
  const completed = sessions.filter(s => s.completed).length;
  return sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0;
}
