/**
 * Schema validators for imported data.
 *
 * Imports come from user-supplied JSON files, so we shape-check the data
 * before merging it into app state. Invalid imports return a structured
 * error rather than throwing or silently corrupting the profile.
 */

import {
  CustomPhase,
  CustomSession,
  CustomSessions,
  Profile,
  Session,
  WeeklySchedule,
} from '../types';

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

const DAY_KEYS: (keyof WeeklySchedule)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

const isValidWeeklySchedule = (v: unknown): v is WeeklySchedule => {
  if (!isObject(v)) return false;
  return DAY_KEYS.every((day) => isString(v[day]));
};

const isValidSession = (v: unknown): v is Session => {
  if (!isObject(v)) return false;
  if (!isString(v.date)) return false;
  if (!isString(v.focus)) return false;
  if ('completed' in v && v.completed !== undefined && !isBool(v.completed)) return false;
  if ('notes' in v && v.notes !== undefined && !isString(v.notes)) return false;
  if (
    'actualMaxHold' in v &&
    v.actualMaxHold !== null &&
    v.actualMaxHold !== undefined &&
    !isNumber(v.actualMaxHold)
  ) return false;
  return true;
};

const isValidCustomPhase = (v: unknown): v is CustomPhase => {
  if (!isObject(v)) return false;
  return (
    isNumber(v.id) &&
    isString(v.type) &&
    isNumber(v.duration) &&
    isString(v.durationType) &&
    isNumber(v.progressiveChange) &&
    isNumber(v.maxHoldPercentage) &&
    isString(v.description) &&
    isString(v.instructions)
  );
};

const isValidCustomSession = (v: unknown): v is CustomSession => {
  if (!isObject(v)) return false;
  if (!isString(v.name)) return false;
  if (!isString(v.description)) return false;
  if (!Array.isArray(v.phases)) return false;
  if (!v.phases.every(isValidCustomPhase)) return false;
  return true;
};

const isValidCustomSessions = (v: unknown): v is CustomSessions => {
  if (!isObject(v)) return false;
  return Object.values(v).every(isValidCustomSession);
};

/**
 * Shape used by `App.tsx` / `SettingsView.tsx` "Export Training Data".
 * All fields optional — partial imports are allowed (e.g. just custom sessions).
 */
export interface ImportedTrainingData {
  sessions?: Session[];
  currentMaxHold?: number | null;
  customSessions?: CustomSessions;
  weeklySchedule?: WeeklySchedule;
}

export const validateImportedTrainingData = (
  raw: unknown,
): ValidationResult<ImportedTrainingData> => {
  if (!isObject(raw)) {
    return { ok: false, error: 'Imported file is not a JSON object.' };
  }

  const result: ImportedTrainingData = {};

  if ('sessions' in raw && raw.sessions !== undefined) {
    if (!Array.isArray(raw.sessions) || !raw.sessions.every(isValidSession)) {
      return { ok: false, error: 'Invalid "sessions" — expected an array of session objects.' };
    }
    result.sessions = raw.sessions as Session[];
  }

  if ('currentMaxHold' in raw && raw.currentMaxHold !== undefined && raw.currentMaxHold !== null) {
    if (!isNumber(raw.currentMaxHold)) {
      return { ok: false, error: 'Invalid "currentMaxHold" — expected a number or null.' };
    }
    result.currentMaxHold = raw.currentMaxHold;
  } else if (raw.currentMaxHold === null) {
    result.currentMaxHold = null;
  }

  if ('customSessions' in raw && raw.customSessions !== undefined) {
    if (!isValidCustomSessions(raw.customSessions)) {
      return { ok: false, error: 'Invalid "customSessions" — one or more entries are malformed.' };
    }
    result.customSessions = raw.customSessions;
  }

  if ('weeklySchedule' in raw && raw.weeklySchedule !== undefined) {
    if (!isValidWeeklySchedule(raw.weeklySchedule)) {
      return { ok: false, error: 'Invalid "weeklySchedule" — must include all 7 weekday keys.' };
    }
    result.weeklySchedule = raw.weeklySchedule;
  }

  return { ok: true, value: result };
};

/**
 * Shape used by `ProfileModal.tsx` "Import Profile" — a full Profile object
 * (as written by `saveProfileAs` IPC).
 */
export const validateImportedProfile = (raw: unknown): ValidationResult<Profile> => {
  if (!isObject(raw)) {
    return { ok: false, error: 'Profile file is not a JSON object.' };
  }
  if (!isString(raw.name)) {
    return { ok: false, error: 'Profile is missing a string "name" field.' };
  }
  if (!Array.isArray(raw.sessions) || !raw.sessions.every(isValidSession)) {
    return { ok: false, error: 'Profile "sessions" is missing or malformed.' };
  }
  if (raw.currentMaxHold !== null && raw.currentMaxHold !== undefined && !isNumber(raw.currentMaxHold)) {
    return { ok: false, error: 'Profile "currentMaxHold" must be a number or null.' };
  }
  if (raw.customSessions !== undefined && !isValidCustomSessions(raw.customSessions)) {
    return { ok: false, error: 'Profile "customSessions" is malformed.' };
  }
  if (raw.weeklySchedule !== undefined && !isValidWeeklySchedule(raw.weeklySchedule)) {
    return { ok: false, error: 'Profile "weeklySchedule" is malformed.' };
  }

  const profile: Profile = {
    name: raw.name,
    created: isString(raw.created) ? raw.created : new Date().toISOString(),
    lastUpdated: isString(raw.lastUpdated) ? raw.lastUpdated : undefined,
    sessions: raw.sessions as Session[],
    currentMaxHold: (raw.currentMaxHold as number | null | undefined) ?? null,
    customSessions: (raw.customSessions as CustomSessions | undefined) ?? {},
    weeklySchedule: (raw.weeklySchedule as WeeklySchedule | undefined) ?? {
      monday: '', tuesday: '', wednesday: '', thursday: '',
      friday: '', saturday: '', sunday: '',
    },
    audioPreferences: isObject(raw.audioPreferences) ? (raw.audioPreferences as unknown as Profile['audioPreferences']) : undefined,
    hasCompletedOnboarding: isBool(raw.hasCompletedOnboarding) ? raw.hasCompletedOnboarding : undefined,
  };

  return { ok: true, value: profile };
};
