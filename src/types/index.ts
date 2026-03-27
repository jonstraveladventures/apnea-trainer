// ============================================================
// Core data types for the Apnea Trainer application
// ============================================================

// ---- Phase types ----

export type PhaseType =
  | 'hold'
  | 'rest'
  | 'breathing'
  | 'box'
  | 'visualization'
  | 'recovery'
  | 'warmup'
  | 'max'
  | 'stretch'
  | 'cooldown'
  | 'tidal_breathing'
  | 'max_hold'
  | 'stretch_confirmation';

export type DurationType = 'fixed' | 'progressive' | 'maxHold';

export interface Phase {
  type: PhaseType | string;
  duration: number;
  description: string;
  instructions?: string;
  // Optional flags set by parsers
  isTidalBreathing?: boolean;
  isMaximalHold?: boolean;
  isMaximalRest?: boolean;
  isMaximalRecovery?: boolean;
  isO2Tolerance?: boolean;
  isAdvancedCo2?: boolean;
  isComfortableCo2?: boolean;
  isComfortablePreparation?: boolean;
  isComfortableRecovery?: boolean;
  isCo2Tolerance?: boolean;
  isRecovery?: boolean;
  isMaxHold?: boolean;
  stopAtContractions?: boolean;
  phaseIndex?: number;
  percentage?: number;
}

/** Phase as defined in the custom session creator (user-authored) */
export interface CustomPhase {
  id: number;
  type: PhaseType | string;
  duration: number;
  durationType: DurationType;
  progressiveChange: number;
  maxHoldPercentage: number;
  description: string;
  instructions: string;
}

// ---- Session types ----

export interface Session {
  date: string;           // YYYY-MM-DD
  day?: string;           // e.g. "Friday"
  focus: string;          // session type name
  sessionType?: string;   // same as focus (legacy field)
  details?: string;       // human-readable description
  notes: string;
  actualMaxHold: number | null;
  completed: boolean;
  sessionTime?: number;   // seconds
}

export interface SessionSummary {
  totalTime: number;
  totalPhases: number;
  completedPhases: number;
  focus?: string;
  maxHold?: number | null;
}

// ---- Custom session types ----

export interface CustomSession {
  name: string;
  description: string;
  phases: CustomPhase[];
  stretchConfirmation: boolean;
  tidalBreathingDuration: number;
}

export type CustomSessions = Record<string, CustomSession>;

// ---- Session template types ----

/** Union type for session template configs — each session type has different fields */
export interface SessionTemplate {
  stretchConfirmation?: boolean;
  tidalBreathingDuration?: number;
  // Maximal Breath-Hold Training
  maximalAttempts?: number;
  preparationDuration?: number;
  recoveryDuration?: number;
  // Max Breath-Hold
  maxHoldPercentages?: number[];
  co2ToleranceSets?: number;
  co2ToleranceHoldDuration?: number;
  co2ToleranceRestDuration?: number;
  // CO2 Tables
  holdCount?: number;
  holdStartDuration?: number;
  holdIncrease?: number;
  restDuration?: number;
  sets?: number;
  // Advanced CO2
  holdPercentage?: number;
  restStartDuration?: number;
  restDecrease?: number;
  // O2 Tolerance
  holdStartPercentage?: number;
  holdIncreasePercentage?: number;
  maxHoldPercentage?: number;
  // Breath Control
  diaphragmaticDuration?: number;
  alternateNostrilDuration?: number;
  boxBreathingDuration?: number;
  boxBreathingCycles?: number;
  boxBreathingRest?: number;
  // Mental + Technique
  visualizationDuration?: number;
  mindfulnessDuration?: number;
  progressiveRelaxationDuration?: number;
  mindfulHoldCount?: number;
  mindfulHoldPercentage?: number;
  // Recovery & Flexibility
  diaphragmStretchCount?: number;
  diaphragmStretchDuration?: number;
  sideStretchCount?: number;
  sideStretchDuration?: number;
  // Comfortable CO2
  restPattern?: number[];
  // Allow extra keys for future extensibility
  [key: string]: unknown;
}

export type SessionTemplates = Record<string, SessionTemplate>;

// ---- Weekly schedule types ----

export interface WeeklySchedule {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

// ---- Profile types ----

export interface Profile {
  name: string;
  created: string;          // ISO date string
  lastUpdated?: string;     // ISO date string
  sessions: Session[];
  currentMaxHold: number | null;
  customSessions: CustomSessions;
  weeklySchedule: WeeklySchedule;
  audioPreferences?: AudioPreferences;
  hasCompletedOnboarding?: boolean;
}

export type Profiles = Record<string, Profile>;

// ---- App state types ----

export interface AppState {
  // Profile management
  currentProfile: string;
  profiles: Profiles;
  // Session data (mirrors current profile)
  sessions: Session[];
  currentMaxHold: number | null;
  weeklySchedule: WeeklySchedule;
  // UI state
  currentView: 'weekplan' | 'timer' | 'progress' | 'settings';
  isLoading: boolean;
  notification: AppNotification | null;
  // Modal states
  showOnboarding: boolean;
  showProfileModal: boolean;
  showMaxHoldModal: boolean;
  showCustomSessionCreator: boolean;
  showPhaseCreator: boolean;
  showWeeklyScheduleEditor: boolean;
  showTemplateEditor: boolean;
  // Custom session creation
  customSessionName: string;
  customSessionDescription: string;
  customSessionPhases: CustomPhase[];
  currentPhaseType: string;
  editingSessionType: string | null;
  // Profile creation
  newProfileName: string;
  newProfileMaxHold: string;
}

export interface AppNotification {
  type: 'success' | 'error';
  message: string;
  duration?: number;
}

// ---- Timer state types ----

export interface TimerState {
  // Timer mechanics
  isRunning: boolean;
  time: number;
  sessionTime: number;
  isSessionActive: boolean;
  currentPhase: number;
  sessionPhases: Phase[];
  phaseTime: number;
  isRestPhase: boolean;
  isPaused: boolean;
  // Session completion
  sessionCompleted: boolean;
  sessionSummary: SessionSummary | null;
  stretchConfirmed: boolean;
  maxHoldCompleted: boolean;
  currentMaxHoldPhase: number;
  // UI state
  showInstructions: boolean;
  currentInstruction: ExerciseInstruction | null;
  showNextPhaseInstructions: boolean;
  nextPhaseInstruction: ExerciseInstruction | null;
  selectedSessionType: string | null;
  hasUserChangedSession: boolean;
  // Templates
  sessionTemplates: SessionTemplates;
}

// ---- Exercise instruction types ----

export interface ExerciseInstruction {
  title: string;
  description: string;
  steps: string[];
}

export type ExerciseInstructionsMap = Record<string, ExerciseInstruction>;

// ---- Audio cue types ----

export type AudioCueType = 'countdown' | 'phaseStart' | 'phaseEnd' | 'sessionComplete';
export type AudioSound =
  | 'singing-bowl'
  | 'double-chime-up'
  | 'double-chime-down'
  | 'gentle-bell'
  | 'completion-fanfare'
  | 'soft-pulse'
  | 'none';

export interface AudioCueConfig {
  enabled: boolean;
  sound: AudioSound;
}

export interface AudioPreferences {
  countdown: AudioCueConfig;        // existing: 6s before phase end
  phaseStart: AudioCueConfig;       // when phase begins
  phaseEnd: AudioCueConfig;         // when phase completes
  sessionComplete: AudioCueConfig;  // when session finishes
}
