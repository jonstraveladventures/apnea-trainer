// Default weekly schedule - single source of truth
// Used by AppContext, App.js, and profile creation
import { WeeklySchedule } from '../types/index';

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: 'Maximal Breath-Hold Training',
  tuesday: 'Breath Control',
  wednesday: 'O₂ Tolerance',
  thursday: 'Mental + Technique',
  friday: 'Max Breath-Hold',
  saturday: 'Recovery & Flexibility',
  sunday: 'Traditional CO₂ Tables'
};

// Default max hold time for new profiles (in seconds)
export const DEFAULT_MAX_HOLD: number = 240;
