// Shared phase utility functions — single source of truth
// Previously duplicated across PhaseDisplay, SessionPreview, SessionCard, Timer, WeekPlan

import { Phase } from '../types/index';

/**
 * Get emoji icon for a phase type
 */
export const getPhaseIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'hold': '🫁',
    'rest': '😌',
    'breathing': '🫁',
    'box': '📦',
    'visualization': '🧘',
    'recovery': '🔄',
    'warmup': '🔥',
    'max': '⚡',
    'stretch': '🧘‍♀️',
    'cooldown': '❄️',
    'tidal_breathing': '🌊',
    'max_hold': '⚡',
    'stretch_confirmation': '✅'
  };
  return icons[type] || '⏱️';
};

/**
 * Determine the exercise type from a phase's description string
 */
export const getExerciseTypeFromPhase = (phase: Phase): string | null => {
  if (!phase || !phase.description) return null;
  if (phase.description.includes('Tidal Breathing')) return 'tidal_breathing';
  if (phase.description.includes('Diaphragmatic')) return 'diaphragmatic_breathing';
  if (phase.description.includes('Alternate Nostril')) return 'alternate_nostril';
  if (phase.description.includes('Box Breathing')) return 'box_breathing';
  if (phase.description.includes('Visualization')) return 'visualization';
  if (phase.description.includes('Mindfulness')) return 'mindfulness';
  if (phase.description.includes('Progressive')) return 'progressive_relaxation';
  if (phase.description.includes('CO₂ Hold')) return 'co2_hold';
  if (phase.description.includes('O₂ Hold')) return 'o2_hold';
  if (phase.description.includes('Max Hold')) return 'max_hold';
  if (phase.description.includes('Stretch')) return 'stretch_confirmation';
  if (phase.description.includes('CO₂ Tolerance')) return 'co2_tolerance_training';
  if (phase.description.includes('Comfortable Hold')) return 'comfortable_co2_training';
  if (phase.isComfortablePreparation) return 'comfortable_preparation';
  if (phase.description.includes('Natural Tidal') || phase.description.includes('Slow-Exhale')) return 'comfortable_recovery';
  return null;
};

/**
 * Get guidance text for a phase
 */
export const getPhaseGuidance = (phase: Phase): string => {
  const type = getExerciseTypeFromPhase(phase);
  if (!type) return 'Focus on your breathing and stay relaxed.';

  const guidance: Record<string, string> = {
    'tidal_breathing': 'Breathe naturally and relax. Focus on the rhythm of your breath without trying to control it.',
    'diaphragmatic_breathing': 'Place one hand on your chest and one on your abdomen. Breathe deeply so your abdomen rises, not your chest.',
    'alternate_nostril': 'Use your thumb and ring finger to alternate nostrils. Breathe slowly and evenly through each nostril.',
    'box_breathing': 'Follow the 4-4-4-4 pattern: inhale 4s, hold 4s, exhale 4s, hold empty 4s. Repeat this cycle.',
    'visualization': 'Close your eyes and imagine a peaceful underwater scene. Visualize yourself swimming effortlessly.',
    'mindfulness': 'Focus your attention on your breath. When thoughts arise, acknowledge them and return to breathing.',
    'progressive_relaxation': 'Start with your toes and work up to your head. Tense each muscle group for 5 seconds, then release.',
    'co2_hold': 'Take a normal breath and hold. Focus on staying relaxed as you feel the urge to breathe.',
    'o2_hold': 'Take a deep breath and hold comfortably. Stay relaxed and focus on your mental state.',
    'max_hold': 'Take 2-3 deep breaths to prepare, then take your final breath and hold. Stay completely relaxed.',
    'stretch_confirmation': 'Perform gentle stretches for your neck, shoulders, chest, and torso. Ensure you feel loose and ready.',
    'co2_tolerance_training': 'Take a normal breath and hold for the specified time. Focus on staying relaxed during the hold.',
    'comfortable_co2_training': 'Take a normal, relaxed breath and hold. Stay completely relaxed and stop immediately if you feel contractions.',
    'comfortable_preparation': 'Start with diaphragmatic breathing to lower your heart rate, then practice box breathing to enter a calm state.',
    'comfortable_recovery': 'Begin with natural tidal breathing, then practice slow-exhale breathing to restore normal O₂/CO₂ balance.'
  };

  return guidance[type] || 'Focus on your breathing and stay relaxed.';
};

/**
 * Get timer color based on phase progress
 */
export const getTimerColor = (currentPhaseData: Phase, phaseTime: number): string => {
  if (!currentPhaseData || !currentPhaseData.duration) return 'text-blue-400';
  const progress = phaseTime / currentPhaseData.duration;

  if (currentPhaseData.type === 'rest') return 'text-green-400';
  if (currentPhaseData.type === 'tidal_breathing') return 'text-blue-400';

  if (currentPhaseData.type === 'hold' || currentPhaseData.type === 'max' || currentPhaseData.type === 'max_hold') {
    if (progress < 0.3) return 'text-green-400';
    if (progress < 0.6) return 'text-yellow-400';
    if (progress < 0.8) return 'text-orange-400';
    return 'text-red-400';
  }

  return 'text-blue-400';
};
