import dayjs from 'dayjs';

// Training schedule constants
export const START_DATE = '2025-08-02';
export const FOCUS_AREAS = {
  1: 'CO₂ Tolerance',
  2: 'Breath Control', 
  3: 'O₂ Tolerance',
  4: 'Mental + Technique',
  5: 'Advanced CO₂ Table',
  6: 'Max Breath-Hold',
  7: 'Recovery & Flexibility'
};

export const SESSION_TYPES = {
  1: 'CO₂ Tolerance',
  2: 'Breath Control',
  3: 'O₂ Tolerance',
  4: 'Mental + Technique',
  5: 'Advanced CO₂ Table',
  6: 'Max Breath-Hold',
  7: 'Recovery & Flexibility'
};

// Generate session details based on max hold time and weekday
export function generateSessionDetails(weekday, maxHoldSeconds) {
  if (!maxHoldSeconds) {
    return 'Set your max hold time to see personalized session details';
  }

  const details = {
    1: `5× progressive holds (45s → 75s). 1:1 rest ratio. ~25min total`,
    2: `10min diaphragmatic + 5min alternate nostril + 8× box breathing (4-4-4-4) + 2min recovery. ~25min total`,
    3: `4× progressive holds (60% → 75% of max). 1.5:1 rest ratio. ~20min total`,
    4: `15min visualization + 10min mindfulness + 10min PMR + 2× mindful holds (60% max). ~45min total`,
    5: `5× ${Math.round(maxHoldSeconds * 0.625)} sec holds. Rest: 2:00 → 0:30`,
    6: `2min tidal breathing + progressive holds: 25% → 35% → 50% → 65% → 2× max holds`,
    7: `3×30s diaphragm stretch, 2× side stretches, 5 min box breathing (4‑4‑4‑4)`
  };

  return details[weekday] || 'Rest day';
}

// Get weekday (1-7, where 1 is Monday)
export function getWeekday(date) {
  const day = dayjs(date).day();
  return day === 0 ? 7 : day; // Convert Sunday (0) to 7
}

// Generate training schedule for a date range
export function generateSchedule(startDate, endDate, maxHoldSeconds) {
  const schedule = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
    const weekday = getWeekday(currentDate);
    const focus = FOCUS_AREAS[weekday];
    const sessionType = SESSION_TYPES[weekday];
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
export function getLatestMaxHold(sessions) {
  const maxHolds = sessions
    .filter(session => session.actualMaxHold !== null && session.actualMaxHold > 0)
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  
  return maxHolds.length > 0 ? maxHolds[0].actualMaxHold : null;
}

// Format time in MM:SS format
export function formatTime(seconds) {
  if (!seconds || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Parse time from MM:SS format
export function parseTime(timeString) {
  if (!timeString) return 0;
  const [mins, secs] = timeString.split(':').map(Number);
  return (mins * 60) + (secs || 0);
}

// Calculate progress percentage
export function calculateProgress(sessions) {
  const completed = sessions.filter(s => s.completed).length;
  return sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0;
} 