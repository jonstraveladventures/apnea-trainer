import { formatTime } from './trainingLogic';

// Helper function to add common phases (stretch confirmation, tidal breathing, cooldown)
export const addCommonPhases = (phases, template, maxHoldSeconds) => {
  const newPhases = [...phases];
  
  // Add stretch confirmation phase for all sessions if enabled
  if (template.stretchConfirmation) {
    newPhases.push({ 
      type: 'stretch_confirmation', 
      duration: 0, 
      description: 'Stretch Confirmation' 
    });
  }
  
  // Add tidal breathing phase for all sessions if enabled
  if (template.tidalBreathingDuration) {
    newPhases.push({ 
      type: 'tidal_breathing', 
      duration: template.tidalBreathingDuration, 
      description: `Tidal Breathing (${formatTime(template.tidalBreathingDuration)})`,
      isTidalBreathing: true
    });
  }
  
  return newPhases;
};

// Helper function to add cooldown phase
export const addCooldownPhase = (phases) => {
  const newPhases = [...phases];
  if (newPhases.length > 0) {
    newPhases.push({ 
      type: 'cooldown', 
      duration: 180, 
      description: 'Cool-down (3 min)' 
    });
  }
  return newPhases;
};

// Session-specific parsers
export const parseMaximalBreathHoldTraining = (template, maxHoldSeconds) => {
  const phases = [];
  
  // Evidence-based maximal breath-hold training
  const maximalAttempts = template.maximalAttempts || 3;
  const maximalRestDuration = template.restDuration || 240; // 3-4 minute rest periods
  
  for (let i = 0; i < maximalAttempts; i++) {
    phases.push({ 
      type: 'max_hold', 
      duration: 0, // Maximal holds are indefinite (user stops when needed)
      description: `Maximal Breath-Hold Attempt ${i + 1}/${maximalAttempts}`,
      isMaximalHold: true,
      instructions: 'Perform a maximal breath-hold. Stop at first sign of discomfort or when you reach your limit.'
    });
    
    if (i < maximalAttempts - 1) {
      phases.push({ 
        type: 'rest', 
        duration: maximalRestDuration, 
        description: `Rest ${i + 1}/${maximalAttempts - 1} (${formatTime(maximalRestDuration)})`,
        isMaximalRest: true
      });
    }
  }
  
  // Add recovery phase
  if (template.recoveryDuration) {
    phases.push({ 
      type: 'recovery', 
      duration: template.recoveryDuration, 
      description: `Recovery (${formatTime(template.recoveryDuration)})`,
      isMaximalRecovery: true
    });
  }
  
  return phases;
};

export const parseTraditionalCo2Tables = (template, maxHoldSeconds) => {
  const phases = [];
  
  // Traditional CO₂ tolerance training
  const co2HoldCount = template.holdCount || 5;
  const co2HoldStart = template.holdStartDuration || 45;
  const co2HoldIncrease = template.holdIncrease || 15;
  const co2RestDuration = template.restDuration || 45;
  
  for (let i = 0; i < co2HoldCount; i++) {
    const holdTime = co2HoldStart + (i * co2HoldIncrease);
    phases.push({ 
      type: 'hold', 
      duration: holdTime, 
      description: `Traditional CO₂ Hold ${i + 1}/${co2HoldCount} (${formatTime(holdTime)})` 
    });
    if (i < co2HoldCount - 1) {
      phases.push({ 
        type: 'rest', 
        duration: co2RestDuration, 
        description: `Traditional CO₂ Rest ${i + 1}/${co2HoldCount - 1} (${formatTime(co2RestDuration)})` 
      });
    }
  }
  
  return phases;
};

export const parseCo2Tolerance = (template, maxHoldSeconds) => {
  const phases = [];
  
  // Legacy CO₂ tolerance training (same as Traditional CO₂ Tables)
  const legacyCo2HoldCount = template.holdCount || 5;
  const legacyCo2HoldStart = template.holdStartDuration || 45;
  const legacyCo2HoldIncrease = template.holdIncrease || 15;
  const legacyCo2RestDuration = template.restDuration || 45;
  
  for (let i = 0; i < legacyCo2HoldCount; i++) {
    const holdTime = legacyCo2HoldStart + (i * legacyCo2HoldIncrease);
    phases.push({ 
      type: 'hold', 
      duration: holdTime, 
      description: `CO₂ Hold ${i + 1}/${legacyCo2HoldCount} (${formatTime(holdTime)})` 
    });
    if (i < legacyCo2HoldCount - 1) {
      phases.push({ 
        type: 'rest', 
        duration: legacyCo2RestDuration, 
        description: `CO₂ Rest ${i + 1}/${legacyCo2HoldCount - 1} (${formatTime(legacyCo2RestDuration)})` 
      });
    }
  }
  
  return phases;
};

export const parseBreathControl = (template, maxHoldSeconds) => {
  const phases = [];
  
  // Evidence-based breath control training using template
  const breathTemplate = template;
  phases.push({ 
    type: 'breathing', 
    duration: breathTemplate.diaphragmaticDuration || 600, 
    description: `Diaphragmatic Breathing (${formatTime(breathTemplate.diaphragmaticDuration || 600)})` 
  });
  phases.push({ 
    type: 'breathing', 
    duration: breathTemplate.alternateNostrilDuration || 300, 
    description: `Alternate Nostril Breathing (${formatTime(breathTemplate.alternateNostrilDuration || 300)})` 
  });
  if (breathTemplate.boxBreathingDuration && breathTemplate.boxBreathingDuration > 0) {
    // Single continuous box-breathing phase for a fixed duration
    phases.push({
      type: 'box',
      duration: breathTemplate.boxBreathingDuration,
      description: `Box Breathing (${formatTime(breathTemplate.boxBreathingDuration)})`
    });
  } else {
    const boxCycles = breathTemplate.boxBreathingCycles || 8;
    const totalBoxDuration = boxCycles * 16; // 4 seconds per 4 segments per cycle
    phases.push({
      type: 'box',
      duration: totalBoxDuration,
      description: `Box Breathing (${boxCycles} cycles, 4-4-4-4)`
    });
  }
  if (breathTemplate.recoveryDuration) {
    phases.push({ 
      type: 'recovery', 
      duration: breathTemplate.recoveryDuration, 
      description: `Recovery (${formatTime(breathTemplate.recoveryDuration)})` 
    });
  }
  
  return phases;
};

export const parseO2Tolerance = (template, maxHoldSeconds) => {
  const phases = [];
  
  // Evidence-based O₂ tolerance training with progression to 90-95%
  const o2HoldCount = template.holdCount || 5;
  const o2HoldStartPercentage = template.holdStartPercentage || 60; // Start at 60% of max hold time
  const o2HoldIncreasePercentage = template.holdIncreasePercentage || 10; // Increase by 10-15% each round
  const o2MaxHoldPercentage = template.maxHoldPercentage || 95; // Progress up to 95% of max hold time
  const o2RestDuration = template.restDuration || 180; // Fixed 3-minute rest periods
  
  for (let i = 0; i < o2HoldCount; i++) {
    // Calculate hold percentage for this round
    const holdPercentage = Math.min(
      o2HoldStartPercentage + (i * o2HoldIncreasePercentage),
      o2MaxHoldPercentage
    );
    const holdTime = Math.round(maxHoldSeconds * (holdPercentage / 100));
    
    phases.push({ 
      type: 'hold', 
      duration: holdTime, 
      description: `O₂ Hold ${i + 1}/${o2HoldCount} (${holdPercentage}% of max - ${formatTime(holdTime)})`,
      isO2Tolerance: true
    });
    
    if (i < o2HoldCount - 1) {
      phases.push({ 
        type: 'rest', 
        duration: o2RestDuration, 
        description: `O₂ Rest ${i + 1}/${o2HoldCount - 1} (${formatTime(o2RestDuration)})`,
        isO2Tolerance: true
      });
    }
  }
  
  return phases;
};

export const parseMentalTechnique = (template, maxHoldSeconds) => {
  const phases = [];
  
  // Evidence-based mental training using template
  const mentalTemplate = template;
  phases.push({ 
    type: 'visualization', 
    duration: mentalTemplate.visualizationDuration || 900, 
    description: `Guided Visualization (${formatTime(mentalTemplate.visualizationDuration || 900)})` 
  });
  phases.push({ 
    type: 'breathing', 
    duration: mentalTemplate.mindfulnessDuration || 600, 
    description: `Mindfulness Breathing (${formatTime(mentalTemplate.mindfulnessDuration || 600)})` 
  });
  phases.push({ 
    type: 'breathing', 
    duration: mentalTemplate.progressiveRelaxationDuration || 600, 
    description: `Progressive Muscle Relaxation (${formatTime(mentalTemplate.progressiveRelaxationDuration || 600)})` 
  });
  const mindfulHoldCount = mentalTemplate.mindfulHoldCount || 2;
  const mindfulHoldPercentage = mentalTemplate.mindfulHoldPercentage || 60;
  const recoveryDuration = mentalTemplate.recoveryDuration || 180;
  for (let i = 0; i < mindfulHoldCount; i++) {
    const holdTime = Math.round(maxHoldSeconds * (mindfulHoldPercentage / 100));
    phases.push({ 
      type: 'hold', 
      duration: holdTime, 
      description: `Mindful Hold ${i + 1}/${mindfulHoldCount} (${formatTime(holdTime)})` 
    });
    if (i < mindfulHoldCount - 1) {
      phases.push({ 
        type: 'rest', 
        duration: recoveryDuration, 
        description: `Recovery ${i + 1}/${mindfulHoldCount - 1} (${formatTime(recoveryDuration)})` 
      });
    }
  }
  
  return phases;
};

export const parseAdvancedCo2Table = (template, maxHoldSeconds) => {
  const phases = [];
  
  // Advanced CO₂ table with decreasing rest periods
  const advancedHoldCount = template.holdCount || 5;
  const advancedHoldPercentage = template.holdPercentage || 62.5;
  const advancedRestStart = template.restStartDuration || 120;
  const advancedRestDecrease = template.restDecrease || 22.5;
  
  for (let i = 0; i < advancedHoldCount; i++) {
    const holdTime = Math.round(maxHoldSeconds * (advancedHoldPercentage / 100));
    phases.push({ 
      type: 'hold', 
      duration: holdTime, 
      description: `Advanced CO₂ Hold ${i + 1}/${advancedHoldCount} (${formatTime(holdTime)})`,
      isAdvancedCo2: true
    });
    
    if (i < advancedHoldCount - 1) {
      const restTime = Math.round(Math.max(30, advancedRestStart - (i * advancedRestDecrease)));
      phases.push({ 
        type: 'rest', 
        duration: restTime, 
        description: `Advanced CO₂ Rest ${i + 1}/${advancedHoldCount - 1} (${formatTime(restTime)})`,
        isAdvancedCo2: true
      });
    }
  }
  
  return phases;
};

export const parseMaxBreathHold = (template, maxHoldSeconds) => {
  const phases = [];
  
  // Use template or default values
  const maxHoldPercentages = template.maxHoldPercentages || [25, 35, 50, 65, 100, 100];
  
  // Progressive max hold phases
  for (let i = 0; i < maxHoldPercentages.length; i++) {
    const percentage = maxHoldPercentages[i];
    
    // Max hold phase
    const holdDuration = Math.round(maxHoldSeconds * (percentage / 100));
    phases.push({ 
      type: percentage === 100 ? 'max_hold' : 'hold', // Use 'hold' for fixed times, 'max_hold' for indefinite
      duration: holdDuration,
      description: percentage === 100 ? 'Max Hold' : `${percentage}% of max`,
      phaseIndex: i,
      percentage: percentage,
      isMaxHold: percentage === 100
    });
  }
  
  // CO₂ Tolerance Training after max holds
  const co2ToleranceSets = template.co2ToleranceSets || 3;
  const co2ToleranceHoldDuration = template.co2ToleranceHoldDuration || 45;
  const co2ToleranceRestDuration = template.co2ToleranceRestDuration || 45;
  
  for (let i = 0; i < co2ToleranceSets; i++) {
    phases.push({ 
      type: 'hold', 
      duration: co2ToleranceHoldDuration, 
      description: `CO₂ Tolerance Hold ${i + 1}/${co2ToleranceSets}`,
      isCo2Tolerance: true
    });
    
    if (i < co2ToleranceSets - 1) {
      phases.push({ 
        type: 'rest', 
        duration: co2ToleranceRestDuration, 
        description: `CO₂ Tolerance Rest ${i + 1}/${co2ToleranceSets - 1}`,
        isCo2Tolerance: true
      });
    }
  }
  
  return phases;
};

export const parseRecoveryFlexibility = (template, maxHoldSeconds) => {
  const phases = [];
  
  // Recovery and flexibility training using template
  const recoveryTemplate = template;
  const diaphragmStretchCount = recoveryTemplate.diaphragmStretchCount || 3;
  const diaphragmStretchDuration = recoveryTemplate.diaphragmStretchDuration || 30;
  const sideStretchCount = recoveryTemplate.sideStretchCount || 2;
  const sideStretchDuration = recoveryTemplate.sideStretchDuration || 45;
  const boxBreathingDuration = recoveryTemplate.boxBreathingDuration || 300;
  
  // Diaphragm stretches
  for (let i = 0; i < diaphragmStretchCount; i++) {
    phases.push({ 
      type: 'stretch', 
      duration: diaphragmStretchDuration, 
      description: `Diaphragm Stretch ${i + 1}/${diaphragmStretchCount} (${formatTime(diaphragmStretchDuration)})`,
      isRecovery: true
    });
  }
  
  // Side stretches
  for (let i = 0; i < sideStretchCount; i++) {
    phases.push({ 
      type: 'stretch', 
      duration: sideStretchDuration, 
      description: `Side Stretch ${i + 1}/${sideStretchCount} (${formatTime(sideStretchDuration)})`,
      isRecovery: true
    });
  }
  
  // Box breathing
  phases.push({ 
    type: 'box', 
    duration: boxBreathingDuration, 
    description: `Box Breathing (${formatTime(boxBreathingDuration)})`,
    isRecovery: true
  });
  
  return phases;
};

export const parseComfortableCo2Training = (template, maxHoldSeconds) => {
  const phases = [];
  
  // Phase 1: Preparation (5 minutes)
  phases.push({ 
    type: 'breathing', 
    duration: template.diaphragmaticDuration || 180, 
    description: 'Diaphragmatic Breathing (3 min)',
    isComfortablePreparation: true
  });
  phases.push({ 
    type: 'box', 
    duration: template.boxBreathingDuration || 120, 
    description: 'Box Breathing (2 min)',
    isComfortablePreparation: true
  });
  
  // Phase 2: Comfortable CO₂ Table (7 rounds)
  const comfortableHoldDuration = Math.round(maxHoldSeconds * (template.holdPercentage || 40) / 100);
  const restPattern = template.restPattern || [120, 105, 90, 75, 60, 75, 90];
  
  for (let i = 0; i < (template.holdCount || 7); i++) {
    phases.push({ 
      type: 'hold', 
      duration: comfortableHoldDuration, 
      description: `Comfortable Hold ${i + 1}/7 (${formatTime(comfortableHoldDuration)})`,
      isComfortableCo2: true,
      stopAtContractions: true
    });
    
    if (i < (template.holdCount || 7) - 1) {
      phases.push({ 
        type: 'rest', 
        duration: restPattern[i], 
        description: `Rest ${i + 1}/6 (${formatTime(restPattern[i])})`,
        isComfortableCo2: true
      });
    }
  }
  
  // Phase 3: Recovery (5 minutes)
  phases.push({ 
    type: 'breathing', 
    duration: 120, 
    description: 'Natural Tidal Breathing (2 min)',
    isComfortableRecovery: true
  });
  phases.push({ 
    type: 'breathing', 
    duration: 180, 
    description: 'Slow-Exhale Breathing (3 min)',
    isComfortableRecovery: true
  });
  
  return phases;
};

// Main parser function that routes to specific parsers
export const parseSessionPhases = (sessionType, template, maxHoldSeconds) => {
  let phases = [];
  
  // Route to specific parser based on session type
  switch (sessionType) {
    case 'Maximal Breath-Hold Training':
      phases = parseMaximalBreathHoldTraining(template, maxHoldSeconds);
      break;
    case 'Traditional CO₂ Tables':
      phases = parseTraditionalCo2Tables(template, maxHoldSeconds);
      break;
    case 'CO₂ Tolerance':
      phases = parseCo2Tolerance(template, maxHoldSeconds);
      break;
    case 'Breath Control':
      phases = parseBreathControl(template, maxHoldSeconds);
      break;
    case 'O₂ Tolerance':
      phases = parseO2Tolerance(template, maxHoldSeconds);
      break;
    case 'Mental + Technique':
      phases = parseMentalTechnique(template, maxHoldSeconds);
      break;
    case 'Advanced CO₂ Table':
      phases = parseAdvancedCo2Table(template, maxHoldSeconds);
      break;
    case 'Max Breath-Hold':
      phases = parseMaxBreathHold(template, maxHoldSeconds);
      break;
    case 'Recovery & Flexibility':
      phases = parseRecoveryFlexibility(template, maxHoldSeconds);
      break;
    case 'Comfortable CO₂ Training':
      phases = parseComfortableCo2Training(template, maxHoldSeconds);
      break;
    default:
      phases.push({ type: 'hold', duration: 60, description: 'Default Hold' });
  }
  
  // Add common phases (stretch confirmation, tidal breathing)
  phases = addCommonPhases(phases, template, maxHoldSeconds);
  
  // Add cooldown phase except for Breath Control session (no cooldown requested)
  if (sessionType !== 'Breath Control') {
    phases = addCooldownPhase(phases);
  }
  
  return phases;
}; 