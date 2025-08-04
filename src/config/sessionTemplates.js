// Centralized session template configuration
export const SESSION_TEMPLATES = {
  'Maximal Breath-Hold Training': {
    stretchConfirmation: true,
    tidalBreathingDuration: 120,
    maximalAttempts: 3, // 2-3 maximal attempts
    restDuration: 240, // 3-4 minute rest periods (4 minutes)
    preparationDuration: 180, // 3 minutes preparation
    recoveryDuration: 300 // 5 minutes recovery
  },
  'Max Breath-Hold': {
    stretchConfirmation: true,
    tidalBreathingDuration: 120,
    maxHoldPercentages: [25, 35, 50, 65, 100, 100],
    co2ToleranceSets: 3,
    co2ToleranceHoldDuration: 45,
    co2ToleranceRestDuration: 45
  },
  'Traditional CO₂ Tables': {
    stretchConfirmation: true,
    tidalBreathingDuration: 120,
    holdCount: 5,
    holdStartDuration: 45, // Start at 45 seconds (evidence-based)
    holdIncrease: 15, // Increase by 15 seconds
    restDuration: 45, // 1:1 rest ratio (evidence-based)
    sets: 5
  },
  'CO₂ Tolerance': {
    stretchConfirmation: true,
    tidalBreathingDuration: 120,
    holdCount: 5,
    holdStartDuration: 45, // Start at 45 seconds (evidence-based)
    holdIncrease: 15, // Increase by 15 seconds
    restDuration: 45, // 1:1 rest ratio (evidence-based)
    sets: 5
  },
  'Advanced CO₂ Table': {
    stretchConfirmation: true,
    tidalBreathingDuration: 120,
    holdCount: 5,
    holdPercentage: 62.5, // 62.5% of max hold time
    restStartDuration: 120, // Start with 2 minutes rest
    restDecrease: 22.5, // Decrease by 22.5 seconds each round
    sets: 5
  },
  'O₂ Tolerance': {
    stretchConfirmation: true,
    tidalBreathingDuration: 120,
    holdCount: 5, // More rounds for progression to 90-95%
    holdStartPercentage: 60, // Start at 60% of max hold time
    holdIncreasePercentage: 10, // Increase by 10-15% each round
    maxHoldPercentage: 95, // Progress up to 95% of max hold time
    restDuration: 180, // Fixed 3-minute rest periods (research-based)
    sets: 5
  },
  'Breath Control': {
    stretchConfirmation: false,
    tidalBreathingDuration: 120,
    diaphragmaticDuration: 600, // 10 minutes diaphragmatic breathing
    alternateNostrilDuration: 300, // 5 minutes alternate nostril
    boxBreathingCycles: 8, // 8 cycles of box breathing
    boxBreathingRest: 30, // 30 seconds rest between cycles
    recoveryDuration: 120 // 2 minutes recovery
  },
  'Mental + Technique': {
    stretchConfirmation: false,
    tidalBreathingDuration: 120,
    visualizationDuration: 900, // 15 minutes guided visualization
    mindfulnessDuration: 600, // 10 minutes mindfulness
    progressiveRelaxationDuration: 600, // 10 minutes PMR
    mindfulHoldCount: 2, // 2 mindful holds
    mindfulHoldPercentage: 60, // 60% of max hold
    recoveryDuration: 180 // 3 minutes recovery between holds
  },
  'Recovery & Flexibility': {
    stretchConfirmation: false,
    tidalBreathingDuration: 120,
    diaphragmStretchCount: 3,
    diaphragmStretchDuration: 30,
    sideStretchCount: 2,
    sideStretchDuration: 45,
    boxBreathingDuration: 300, // 5 minutes box breathing
    recoveryDuration: 180
  },
  'Comfortable CO₂ Training': {
    stretchConfirmation: true,
    preparationDuration: 300, // 5 minutes preparation
    diaphragmaticDuration: 180, // 3 minutes diaphragmatic breathing
    boxBreathingDuration: 120, // 2 minutes box breathing
    holdPercentage: 40, // 40% of max hold time
    holdCount: 7, // 7 rounds maximum
    restPattern: [120, 105, 90, 75, 60, 75, 90], // Decreasing rest periods in seconds
    recoveryDuration: 300 // 5 minutes recovery
  }
};

// Session categories for organization
export const SESSION_CATEGORIES = {
  'CO₂ Training': [
    'Comfortable CO₂ Training',
    'Traditional CO₂ Tables',
    'Advanced CO₂ Table',
    'CO₂ Tolerance'
  ],
  'O₂ Training': [
    'O₂ Tolerance'
  ],
  'Max Training': [
    'Maximal Breath-Hold Training',
    'Max Breath-Hold'
  ],
  'Mental & Technical': [
    'Breath Control',
    'Mental + Technique'
  ],
  'Recovery & Flexibility': [
    'Recovery & Flexibility'
  ]
};

// Helper function to get all session types
export const getAllSessionTypes = () => {
  return Object.keys(SESSION_TEMPLATES);
};

// Helper function to get session template
export const getSessionTemplate = (sessionType) => {
  return SESSION_TEMPLATES[sessionType] || {};
};

// Helper function to check if session type exists
export const isValidSessionType = (sessionType) => {
  return sessionType in SESSION_TEMPLATES;
}; 