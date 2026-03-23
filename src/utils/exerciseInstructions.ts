// Exercise instruction data — single source of truth
// Previously duplicated in Timer.js (~187 lines) and WeekPlan.js (~150 lines)

import { ExerciseInstructionsMap } from '../types/index';

export const exerciseInstructions: ExerciseInstructionsMap = {
  'tidal_breathing': {
    title: 'Tidal Breathing',
    description: 'Normal, relaxed breathing at your natural pace',
    steps: [
      'Sit or lie in a comfortable position',
      'Breathe naturally through your nose',
      'Focus on the rhythm of your breath',
      'Don\'t force or control the breathing',
      'Let your body find its natural breathing pattern'
    ]
  },
  'diaphragmatic_breathing': {
    title: 'Diaphragmatic Breathing',
    description: 'Deep breathing using your diaphragm for maximum oxygen intake',
    steps: [
      'Place one hand on your chest, one on your abdomen',
      'Breathe in slowly through your nose',
      'Feel your abdomen expand (not your chest)',
      'Exhale slowly through your mouth',
      'Focus on the movement of your diaphragm',
      'Aim for 6-8 breaths per minute'
    ]
  },
  'alternate_nostril': {
    title: 'Alternate Nostril Breathing',
    description: 'Balancing breathing technique that calms the nervous system',
    steps: [
      'Sit comfortably with your spine straight',
      'Close your right nostril with your right thumb',
      'Inhale slowly through your left nostril',
      'Close your left nostril with your ring finger',
      'Exhale through your right nostril',
      'Inhale through your right nostril',
      'Close your right nostril, exhale through left',
      'Continue alternating for the full duration'
    ]
  },
  'box_breathing': {
    title: 'Box Breathing (4-4-4-4)',
    description: 'Equal breathing pattern that promotes calm and focus',
    steps: [
      'Inhale slowly through your nose for 4 seconds',
      'Hold your breath for 4 seconds',
      'Exhale slowly through your mouth for 4 seconds',
      'Hold empty lungs for 4 seconds',
      'Repeat this cycle for the full duration',
      'Focus on the equal timing of each phase'
    ]
  },
  'visualization': {
    title: 'Guided Visualization',
    description: 'Mental imagery to enhance relaxation and focus',
    steps: [
      'Close your eyes and get comfortable',
      'Imagine a peaceful underwater scene',
      'Visualize yourself swimming effortlessly',
      'Feel the weightlessness and calm',
      'Picture your breath as gentle waves',
      'Stay focused on the peaceful imagery',
      'If your mind wanders, gently return to the scene'
    ]
  },
  'mindfulness': {
    title: 'Mindfulness Breathing',
    description: 'Present-moment awareness focused on the breath',
    steps: [
      'Sit in a comfortable, alert position',
      'Focus your attention on your breath',
      'Notice the sensation of air entering and leaving',
      'When thoughts arise, acknowledge them without judgment',
      'Gently return your focus to the breath',
      'Stay present with each inhale and exhale'
    ]
  },
  'progressive_relaxation': {
    title: 'Progressive Muscle Relaxation',
    description: 'Systematic tensing and relaxing of muscle groups',
    steps: [
      'Start with your toes and work up to your head',
      'Tense each muscle group for 5 seconds',
      'Release the tension and feel the relaxation',
      'Move to the next muscle group',
      'Focus on the contrast between tension and relaxation',
      'Breathe deeply throughout the process'
    ]
  },
  'co2_hold': {
    title: 'CO\u2082 Tolerance Hold',
    description: 'Building tolerance to carbon dioxide buildup',
    steps: [
      'Take a normal, relaxed breath in (not a deep breath)',
      'Hold your breath without forcing or straining',
      'Focus on staying completely relaxed',
      'Notice the urge to breathe but don\'t panic',
      'When you need to breathe, exhale slowly and naturally',
      'Take 2-3 normal recovery breaths before the next hold'
    ]
  },
  'o2_hold': {
    title: 'O\u2082 Tolerance Hold',
    description: 'Training your body to function with lower oxygen levels',
    steps: [
      'Take a deep, full breath in (fill your lungs completely)',
      'Hold your breath comfortably without straining',
      'Stay relaxed and avoid any tension',
      'Focus on your mental state and calmness',
      'When you need to breathe, exhale slowly and completely',
      'Take 3-4 full recovery breaths between holds'
    ]
  },
  'max_hold': {
    title: 'Maximum Breath Hold',
    description: 'Pushing your limits in a controlled environment',
    steps: [
      'Take 2-3 deep breaths to prepare',
      'Take your final breath and hold',
      'Stay completely relaxed',
      'Focus on your mental strength',
      'When you feel the urge to breathe, try to hold a bit longer',
      'When you release, exhale slowly and safely',
      'Take several recovery breaths'
    ]
  },
  'stretch_confirmation': {
    title: 'Pre-Session Stretching',
    description: 'Important preparation to prevent injury and improve performance',
    steps: [
      'Perform gentle neck and shoulder stretches',
      'Stretch your chest and rib cage',
      'Do some gentle torso twists',
      'Stretch your diaphragm with deep breaths',
      'Ensure you feel loose and ready',
      'Only proceed when you feel properly prepared'
    ]
  },
  'co2_tolerance_training': {
    title: 'CO\u2082 Tolerance Training',
    description: 'Post-max hold recovery and CO\u2082 tolerance building',
    steps: [
      'Take a normal breath in',
      'Hold for the specified duration (45 seconds)',
      'Focus on staying relaxed during the hold',
      'Exhale slowly when the time is up',
      'Rest for the specified duration (45 seconds)',
      'Repeat for the full number of sets',
      'This helps your body adapt to CO\u2082 buildup'
    ]
  },
  'comfortable_co2_training': {
    title: 'Comfortable CO\u2082 Training',
    description: 'Gradual CO\u2082 tolerance building without contractions',
    steps: [
      'Take a normal, relaxed breath in',
      'Hold for the specified duration (40% of max)',
      'Stay completely relaxed throughout the hold',
      'Stop immediately if you feel contractions',
      'Exhale slowly and naturally when done',
      'Rest for the decreasing rest period',
      'Focus on comfort - "breath-holding should feel good"'
    ]
  },
  'comfortable_preparation': {
    title: 'Comfortable CO\u2082 Preparation',
    description: 'Relaxation and preparation for comfortable training',
    steps: [
      'Start with 3 minutes of diaphragmatic breathing',
      'Focus on slow, deep belly breaths',
      'Then practice 2 minutes of box breathing (4-4-4-4)',
      'Lower your heart rate and enter a calm state',
      'Prepare your mind for comfortable breath-holding',
      'Remember: "Breath-holding should feel good, not bad"'
    ]
  },
  'comfortable_recovery': {
    title: 'Comfortable Recovery',
    description: 'Gentle recovery to restore normal breathing balance',
    steps: [
      'Begin with 2 minutes of natural tidal breathing',
      'Then practice slow-exhale breathing for 3 minutes',
      'Inhale for 4 counts, exhale for 8 counts',
      'Focus on restoring normal O\u2082/CO\u2082 balance',
      'Feel the gentle return to baseline breathing',
      'Reflect on the comfortable training session'
    ]
  }
};
