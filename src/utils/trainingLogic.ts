import dayjs from 'dayjs';
import { Session } from '../types/index';

// Training schedule constants
// START_DATE removed — schedules now start from today's date.
// Kept as a deprecated export for backward compatibility during migration.
/** @deprecated Use `new Date().toISOString().split('T')[0]` instead */
export const START_DATE: string = new Date().toISOString().split('T')[0];
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

// Generate training schedule for a date range
export function generateSchedule(startDate: string, endDate: string | Date, maxHoldSeconds: number | null): Session[] {
  const schedule: Session[] = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
    const weekday = getWeekday(currentDate);
    const focus = FOCUS_AREAS[weekday];
    const sessionType = FOCUS_AREAS[weekday];
    const details = generateSessionDetails(weekday, maxHoldSeconds);

    schedule.push({
      date: currentDate.format('YYYY-MM-DD'),
      day: currentDate.format('dddd'),
      focus,
      sessionType,
      details,
      notes: '',
      actualMaxHold: null,
      completed: false
    });

    currentDate = currentDate.add(1, 'day');
  }

  return schedule;
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
