import React, { useState } from 'react';
import { Calendar, Edit3, Plus, Save, X, Eye } from 'lucide-react';
import dayjs from 'dayjs';
import { formatTime } from '../utils/trainingLogic';

const WeekPlan = ({ sessions, onSessionUpdate, onAddCustomSession, onToggleComplete, currentMaxHold, customSessions }) => {
  const [editingDay, setEditingDay] = useState(null);
  const [showCustomSessionModal, setShowCustomSessionModal] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [customSessionName, setCustomSessionName] = useState('');
  const [customSessionDescription, setCustomSessionDescription] = useState('');
  const [customSessionType, setCustomSessionType] = useState('custom');
  const [customSessionConfig, setCustomSessionConfig] = useState({
    warmupHolds: 0,
    warmupDuration: 0,
    restDuration: 0,
    holdCount: 1,
    holdStartDuration: 60,
    holdIncrease: 0,
    holdRestDuration: 60,
    cooldownDuration: 180
  });
  const [customSessionBase, setCustomSessionBase] = useState('');

  const sessionTypes = [
    'CO₂ Tolerance',
    'Breath Control', 
    'O₂ Tolerance',
    'Mental + Technique',
    'Advanced CO₂ Table',
    'Max Breath-Hold',
    'Recovery & Flexibility'
  ];

  // Get next 7 days
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = dayjs().add(i, 'day');
      days.push({
        date: date.format('YYYY-MM-DD'),
        dayName: date.format('ddd'),
        dayNumber: date.format('D'),
        month: date.format('MMM')
      });
    }
    return days;
  };

  const getSessionForDate = (date) => {
    return sessions.find(s => s.date === date);
  };

  const handleSessionTypeChange = (date, newType) => {
    const existingSession = getSessionForDate(date);
    const updatedSession = {
      ...existingSession,
      focus: newType,
      sessionType: newType,
      date: date
    };
    onSessionUpdate(date, updatedSession);
    setEditingDay(null);
  };

  const calculateSessionDuration = () => {
    const warmupTime = (customSessionConfig.warmupHolds || 0) * 
      ((customSessionConfig.warmupDuration || 0) + (customSessionConfig.restDuration || 0));
    const mainSessionTime = (customSessionConfig.holdCount || 1) * 
      (customSessionConfig.holdStartDuration || 60) + 
      ((customSessionConfig.holdCount || 1) - 1) * (customSessionConfig.holdRestDuration || 60);
    const cooldownTime = customSessionConfig.cooldownDuration || 180;
    
    return warmupTime + mainSessionTime + cooldownTime;
  };

  const handleAddCustomSession = () => {
    if (customSessionName.trim()) {
      const sessionData = {
        name: customSessionName,
        description: customSessionDescription,
        type: customSessionType,
        config: customSessionConfig,
        estimatedDuration: calculateSessionDuration()
      };
      onAddCustomSession(sessionData);
      setCustomSessionName('');
      setCustomSessionDescription('');
      setCustomSessionType('custom');
      setCustomSessionConfig({
        warmupHolds: 0,
        warmupDuration: 0,
        restDuration: 0,
        holdCount: 1,
        holdStartDuration: 60,
        holdIncrease: 0,
        holdRestDuration: 60,
        cooldownDuration: 180
      });
      setCustomSessionBase('');
      setShowCustomSessionModal(false);
    }
  };

  // Exercise instructions (same as Timer component)
  const exerciseInstructions = {
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
      title: 'CO₂ Tolerance Hold',
      description: 'Building tolerance to carbon dioxide buildup',
      steps: [
        'Take a normal breath in',
        'Hold your breath without forcing',
        'Focus on staying relaxed',
        'Notice the urge to breathe but don\'t panic',
        'When you need to breathe, exhale slowly',
        'Take a few recovery breaths before the next hold'
      ]
    },
    'o2_hold': {
      title: 'O₂ Tolerance Hold',
      description: 'Training your body to function with lower oxygen levels',
      steps: [
        'Take a deep breath in',
        'Hold your breath comfortably',
        'Stay relaxed and avoid tension',
        'Focus on your mental state',
        'When you need to breathe, exhale slowly',
        'Take full recovery breaths between holds'
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
      title: 'CO₂ Tolerance Training',
      description: 'Post-max hold recovery and CO₂ tolerance building',
      steps: [
        'Take a normal breath in',
        'Hold for the specified duration (45 seconds)',
        'Focus on staying relaxed during the hold',
        'Exhale slowly when the time is up',
        'Rest for the specified duration (45 seconds)',
        'Repeat for the full number of sets',
        'This helps your body adapt to CO₂ buildup'
      ]
    }
  };

  const getExerciseTypeFromPhase = (phase) => {
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
    return null;
  };

  const showExerciseInstructions = (exerciseType) => {
    setCurrentInstruction(exerciseInstructions[exerciseType]);
    setShowInstructions(true);
  };

  const handleToggleComplete = (date) => {
    if (onToggleComplete) {
      onToggleComplete(date);
    }
  };

  const parseSessionPhases = (focus, maxHoldSeconds) => {
    const phases = [];
    
    const sessionTemplates = {
      'CO₂ Tolerance': {
        holdCount: 5,
        holdStartDuration: 45,
        holdIncrease: 15,
        restDuration: 45
      },
      'Breath Control': {
        diaphragmaticDuration: 600,
        alternateNostrilDuration: 300,
        boxBreathingCycles: 8,
        boxBreathingRest: 30,
        recoveryDuration: 120
      },
      'O₂ Tolerance': {
        holdCount: 4,
        holdStartDuration: Math.round(maxHoldSeconds * 0.6),
        holdIncrease: 10,
        restDuration: Math.round(maxHoldSeconds * 1.5)
      },
      'Mental + Technique': {
        visualizationDuration: 900,
        mindfulnessDuration: 600,
        progressiveRelaxationDuration: 600,
        mindfulHoldCount: 2,
        mindfulHoldPercentage: 60,
        recoveryDuration: 180
      },
      'Advanced CO₂ Table': {
        holdStartDuration: Math.round(maxHoldSeconds * 0.4),
        holdIncrease: Math.round(maxHoldSeconds * 0.08),
        restDuration: Math.round(maxHoldSeconds * 0.4)
      },
      'Max Breath-Hold': {
        stretchConfirmation: true,
        tidalBreathingDuration: 120,
        maxHoldPercentages: [25, 35, 50, 65, 100, 100],
        co2ToleranceSets: 3,
        co2ToleranceHoldDuration: 45,
        co2ToleranceRestDuration: 45
      },
      'Recovery & Flexibility': {
        warmupDuration: 300,
        stretchDuration: 600,
        cooldownDuration: 180
      }
    };

    const template = sessionTemplates[focus];
    if (!template) return phases;

    switch (focus) {
      case 'CO₂ Tolerance':
        const co2HoldCount = template.holdCount || 5;
        const co2HoldStart = template.holdStartDuration || 45;
        const co2HoldIncrease = template.holdIncrease || 15;
        const co2RestDuration = template.restDuration || 45;
        
        for (let i = 0; i < co2HoldCount; i++) {
          const holdTime = co2HoldStart + (i * co2HoldIncrease);
          phases.push({ 
            type: 'hold', 
            duration: holdTime, 
            description: `CO₂ Hold ${i + 1}/${co2HoldCount} (${formatTime(holdTime)})` 
          });
          if (i < co2HoldCount - 1) {
            phases.push({ 
              type: 'rest', 
              duration: co2RestDuration, 
              description: `CO₂ Rest ${i + 1}/${co2HoldCount - 1} (${formatTime(co2RestDuration)})` 
            });
          }
        }
        break;

      case 'Breath Control':
        phases.push({ 
          type: 'breathing', 
          duration: template.diaphragmaticDuration || 600, 
          description: `Diaphragmatic Breathing (${formatTime(template.diaphragmaticDuration || 600)})` 
        });
        phases.push({ 
          type: 'breathing', 
          duration: template.alternateNostrilDuration || 300, 
          description: `Alternate Nostril Breathing (${formatTime(template.alternateNostrilDuration || 300)})` 
        });
        const boxCycles = template.boxBreathingCycles || 8;
        const boxRest = template.boxBreathingRest || 30;
        for (let i = 0; i < boxCycles; i++) {
          phases.push({ 
            type: 'box', 
            duration: 16, 
            description: `Box Breathing ${i + 1}/${boxCycles} (4-4-4-4)` 
          });
          if (i < boxCycles - 1) {
            phases.push({ 
              type: 'rest', 
              duration: boxRest, 
              description: `Rest ${i + 1}/${boxCycles - 1} (${formatTime(boxRest)})` 
            });
          }
        }
        if (template.recoveryDuration) {
          phases.push({ 
            type: 'recovery', 
            duration: template.recoveryDuration, 
            description: `Recovery (${formatTime(template.recoveryDuration)})` 
          });
        }
        break;

      case 'O₂ Tolerance':
        const o2HoldCount = template.holdCount || 4;
        const o2HoldStart = template.holdStartDuration || Math.round(maxHoldSeconds * 0.6);
        const o2HoldIncrease = template.holdIncrease || 15;
        const o2RestDuration = template.restDuration || 180; // Fixed 3-minute rest periods
        
        for (let i = 0; i < o2HoldCount; i++) {
          const holdTime = o2HoldStart + (i * o2HoldIncrease);
          // Cap at 80% of max hold time (research-based safety limit)
          const cappedHoldTime = Math.min(holdTime, Math.round(maxHoldSeconds * 0.8));
          phases.push({ 
            type: 'hold', 
            duration: cappedHoldTime, 
            description: `O₂ Hold ${i + 1}/${o2HoldCount} (${formatTime(cappedHoldTime)})` 
          });
          if (i < o2HoldCount - 1) {
            phases.push({ 
              type: 'rest', 
              duration: o2RestDuration, 
              description: `O₂ Rest ${i + 1}/${o2HoldCount - 1} (${formatTime(o2RestDuration)})` 
            });
          }
        }
        break;

      case 'Mental + Technique':
        phases.push({ 
          type: 'visualization', 
          duration: template.visualizationDuration || 900, 
          description: `Guided Visualization (${formatTime(template.visualizationDuration || 900)})` 
        });
        phases.push({ 
          type: 'breathing', 
          duration: template.mindfulnessDuration || 600, 
          description: `Mindfulness Breathing (${formatTime(template.mindfulnessDuration || 600)})` 
        });
        phases.push({ 
          type: 'breathing', 
          duration: template.progressiveRelaxationDuration || 600, 
          description: `Progressive Muscle Relaxation (${formatTime(template.progressiveRelaxationDuration || 600)})` 
        });
        const mindfulHoldCount = template.mindfulHoldCount || 2;
        const mindfulHoldPercentage = template.mindfulHoldPercentage || 60;
        const recoveryDuration = template.recoveryDuration || 180;
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
        break;

      case 'Advanced CO₂ Table':
        let advancedCurrentHold = template.holdStartDuration;
        for (let i = 0; i < 10; i++) {
          phases.push({ 
            type: 'hold', 
            duration: advancedCurrentHold, 
            description: `Hold ${i + 1} (${formatTime(advancedCurrentHold)})` 
          });
          phases.push({ 
            type: 'rest', 
            duration: template.restDuration, 
            description: `Rest ${i + 1} (${formatTime(template.restDuration)})` 
          });
          advancedCurrentHold += template.holdIncrease;
        }
        break;

      case 'Max Breath-Hold':
        const tidalBreathingDuration = template.tidalBreathingDuration || 120;
        const maxHoldPercentages = template.maxHoldPercentages || [25, 35, 50, 65, 100, 100];

        if (template.stretchConfirmation) {
          phases.push({ type: 'stretch_confirmation', duration: 0, description: 'Stretch Confirmation' });
        }

        for (let i = 0; i < maxHoldPercentages.length; i++) {
          const percentage = maxHoldPercentages[i];
          const holdDuration = Math.round(maxHoldSeconds * (percentage / 100));

          phases.push({
            type: 'tidal_breathing',
            duration: tidalBreathingDuration,
            description: `Tidal Breathing (${formatTime(tidalBreathingDuration)})`,
            phaseIndex: i,
            isTidalBreathing: true
          });

          phases.push({
            type: percentage === 100 ? 'max_hold' : 'hold',
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
        break;

      case 'Recovery & Flexibility':
        phases.push({ 
          type: 'warmup', 
          duration: template.warmupDuration, 
          description: `Warm-up (${formatTime(template.warmupDuration)})` 
        });
        phases.push({ 
          type: 'stretch', 
          duration: template.stretchDuration, 
          description: `Stretching (${formatTime(template.stretchDuration)})` 
        });
        phases.push({ 
          type: 'cooldown', 
          duration: template.cooldownDuration, 
          description: `Cool-down (${formatTime(template.cooldownDuration)})` 
        });
        break;
    }

    return phases;
  };

  const getPhaseIcon = (type) => {
    const icons = {
      'hold': '🫁',
      'rest': '😌',
      'breathing': '🫁',
      'box': '📦',
      'visualization': '🧘',
      'recovery': '🔄',
      'warmup': '🔥',
      'stretch': '🧘‍♀️',
      'cooldown': '❄️',
      'tidal_breathing': '🌊',
      'max_hold': '⚡',
      'stretch_confirmation': '✅'
    };
    return icons[type] || '⏱️';
  };

  const getSessionIcon = (type) => {
    switch (type) {
      case 'CO₂ Tolerance': return '🫁';
      case 'Breath Control': return '🫁';
      case 'O₂ Tolerance': return '🫁';
      case 'Mental + Technique': return '🧘';
      case 'Advanced CO₂ Table': return '📊';
      case 'Max Breath-Hold': return '⚡';

      case 'Recovery & Flexibility': return '🧘‍♀️';
      default: return '⏱️';
    }
  };

  const getSessionColor = (type) => {
    switch (type) {
      case 'CO₂ Tolerance': return 'bg-blue-900/30 border-blue-700';
      case 'Breath Control': return 'bg-green-900/30 border-green-700';
      case 'O₂ Tolerance': return 'bg-purple-900/30 border-purple-700';
      case 'Mental + Technique': return 'bg-yellow-900/30 border-yellow-700';
      case 'Advanced CO₂ Table': return 'bg-red-900/30 border-red-700';
      case 'Max Breath-Hold': return 'bg-orange-900/30 border-orange-700';

      case 'Recovery & Flexibility': return 'bg-teal-900/30 border-teal-700';
      default: return 'bg-deep-800 border-deep-700';
    }
  };

  const weekDays = getNext7Days();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Next 7 day training plan
        </h2>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {weekDays.slice(0, 4).map((day) => {
          const session = getSessionForDate(day.date);
          const isToday = day.date === dayjs().format('YYYY-MM-DD');
          const isEditing = editingDay === day.date;

          return (
            <div
              key={day.date}
              className={`p-6 rounded-lg border min-h-[280px] ${
                isToday 
                  ? 'bg-ocean-900/50 border-ocean-600' 
                  : 'bg-deep-800 border-deep-700'
              }`}
            >
              {/* Day Header */}
              <div className="text-center mb-4">
                <div className="text-sm text-deep-400 font-medium">{day.dayName}</div>
                <div className="text-3xl font-bold text-white">{day.dayNumber}</div>
                <div className="text-sm text-deep-500">{day.month}</div>
                {isToday && (
                  <div className="text-xs text-ocean-400 font-semibold mt-2 bg-ocean-600/20 px-2 py-1 rounded-full">TODAY</div>
                )}
              </div>

              {/* Session Display */}
              {session && !isEditing && (
                <div className={`p-4 rounded-lg border ${getSessionColor(session.focus)} min-h-[180px] flex flex-col`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getSessionIcon(session.focus)}</span>
                    <div className="flex-1">
                      <div className="text-base font-bold text-white leading-tight">
                        {session.focus}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-deep-300 mb-3 flex-1">
                    <select
                      value={session.focus}
                      onChange={(e) => handleSessionTypeChange(day.date, e.target.value)}
                      className="w-full bg-transparent border border-deep-600 rounded px-2 py-1 text-sm text-deep-300 hover:bg-deep-700 focus:bg-deep-700 focus:outline-none focus:border-ocean-500"
                    >
                      {sessionTypes.map((type) => (
                        <option key={type} value={type} className="bg-deep-800">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleToggleComplete(day.date)}
                    className={`text-sm font-medium mb-3 flex items-center gap-1 w-full justify-center py-2 rounded transition-colors ${
                      session.completed 
                        ? 'text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/30' 
                        : 'text-deep-400 hover:text-deep-300 bg-deep-700/50 hover:bg-deep-600/50'
                    }`}
                  >
                    <span className="text-lg">{session.completed ? '✓' : '○'}</span>
                    {session.completed ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button
                    onClick={() => setShowSessionDetails(session)}
                    className="w-full btn-primary text-sm flex items-center justify-center gap-2 py-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              )}

              {/* Session Type Selector */}
              {isEditing && (
                <div className="space-y-3 min-h-[180px]">
                  <div className="text-base font-semibold text-white mb-3">Choose Session Type:</div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {sessionTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSessionTypeChange(day.date, type)}
                        className={`w-full p-3 rounded-lg text-left text-sm flex items-center gap-3 transition-colors ${
                          session?.focus === type
                            ? 'bg-ocean-600 text-white'
                            : 'bg-deep-700 text-deep-300 hover:bg-deep-600'
                        }`}
                      >
                        <span className="text-lg">{getSessionIcon(type)}</span>
                        <span className="truncate">{type}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setEditingDay(null)}
                    className="w-full btn-secondary text-sm py-2"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* No Session */}
              {!session && !isEditing && (
                <div className="text-center p-4 text-deep-400 min-h-[180px] flex flex-col justify-center">
                  <div className="text-base mb-3">No session planned</div>
                  <button
                    onClick={() => setEditingDay(day.date)}
                    className="w-full btn-secondary text-sm py-2"
                  >
                    Add Session
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Second Row - Last 3 days */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:max-w-3xl md:mx-auto">
        {weekDays.slice(4, 7).map((day) => {
          const session = getSessionForDate(day.date);
          const isToday = day.date === dayjs().format('YYYY-MM-DD');
          const isEditing = editingDay === day.date;

          return (
            <div
              key={day.date}
              className={`p-6 rounded-lg border min-h-[280px] ${
                isToday 
                  ? 'bg-ocean-900/50 border-ocean-600' 
                  : 'bg-deep-800 border-deep-700'
              }`}
            >
              {/* Day Header */}
              <div className="text-center mb-4">
                <div className="text-sm text-deep-400 font-medium">{day.dayName}</div>
                <div className="text-3xl font-bold text-white">{day.dayNumber}</div>
                <div className="text-sm text-deep-500">{day.month}</div>
                {isToday && (
                  <div className="text-xs text-ocean-400 font-semibold mt-2 bg-ocean-600/20 px-2 py-1 rounded-full">TODAY</div>
                )}
              </div>

              {/* Session Display */}
              {session && !isEditing && (
                <div className={`p-4 rounded-lg border ${getSessionColor(session.focus)} min-h-[180px] flex flex-col`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getSessionIcon(session.focus)}</span>
                    <div className="flex-1">
                      <div className="text-base font-bold text-white leading-tight">
                        {session.focus}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-deep-300 mb-3 flex-1">
                    <select
                      value={session.focus}
                      onChange={(e) => handleSessionTypeChange(day.date, e.target.value)}
                      className="w-full bg-transparent border border-deep-600 rounded px-2 py-1 text-sm text-deep-300 hover:bg-deep-700 focus:bg-deep-700 focus:outline-none focus:border-ocean-500"
                    >
                      {sessionTypes.map((type) => (
                        <option key={type} value={type} className="bg-deep-800">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleToggleComplete(day.date)}
                    className={`text-sm font-medium mb-3 flex items-center gap-1 w-full justify-center py-2 rounded transition-colors ${
                      session.completed 
                        ? 'text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/30' 
                        : 'text-deep-400 hover:text-deep-300 bg-deep-700/50 hover:bg-deep-600/50'
                    }`}
                  >
                    <span className="text-lg">{session.completed ? '✓' : '○'}</span>
                    {session.completed ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button
                    onClick={() => setShowSessionDetails(session)}
                    className="w-full btn-primary text-sm flex items-center justify-center gap-2 py-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              )}

              {/* Session Type Selector */}
              {isEditing && (
                <div className="space-y-3 min-h-[180px]">
                  <div className="text-base font-semibold text-white mb-3">Choose Session Type:</div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {sessionTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSessionTypeChange(day.date, type)}
                        className={`w-full p-3 rounded-lg text-left text-sm flex items-center gap-3 transition-colors ${
                          session?.focus === type
                            ? 'bg-ocean-600 text-white'
                            : 'bg-deep-700 text-deep-300 hover:bg-deep-600'
                        }`}
                      >
                        <span className="text-lg">{getSessionIcon(type)}</span>
                        <span className="truncate">{type}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setEditingDay(null)}
                    className="w-full btn-secondary text-sm py-2"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* No Session */}
              {!session && !isEditing && (
                <div className="text-center p-4 text-deep-400 min-h-[180px] flex flex-col justify-center">
                  <div className="text-base mb-3">No session planned</div>
                  <button
                    onClick={() => setEditingDay(day.date)}
                    className="w-full btn-secondary text-sm py-2"
                  >
                    Add Session
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Session Modal */}
      {showCustomSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Create Custom Session Type</h3>
              <button
                onClick={() => setShowCustomSessionModal(false)}
                className="text-deep-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-deep-300">Session Name:</label>
                  <input
                    type="text"
                    value={customSessionName}
                    onChange={(e) => setCustomSessionName(e.target.value)}
                    className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                    placeholder="e.g., Custom CO₂ Table"
                  />
                </div>
                <div>
                  <label className="text-sm text-deep-300">Session Type:</label>
                  <select
                    value={customSessionType}
                    onChange={(e) => {
                      setCustomSessionType(e.target.value);
                      if (e.target.value !== 'custom') {
                        const template = {
                          'CO₂ Tolerance': {
                            warmupHolds: 0,
                            warmupDuration: 0,
                            restDuration: 0,
                            holdCount: 5,
                            holdStartDuration: 45,
                            holdIncrease: 15,
                            holdRestDuration: 60,
                            cooldownDuration: 180
                          },
                          'Breath Control': {
                            diaphragmaticDuration: 600,
                            alternateNostrilDuration: 300,
                            boxBreathingCycles: 8,
                            boxBreathingRest: 30,
                            recoveryDuration: 120
                          },
                          'O₂ Tolerance': {
                            holdCount: 4,
                            holdStartDuration: Math.round(currentMaxHold * 0.6),
                            holdIncrease: 10,
                            restDuration: Math.round(currentMaxHold * 1.5)
                          },
                          'Mental + Technique': {
                            visualizationDuration: 900,
                            mindfulnessDuration: 600,
                            progressiveRelaxationDuration: 600,
                            mindfulHoldCount: 2,
                            mindfulHoldPercentage: 60,
                            recoveryDuration: 180
                          },
                          'Advanced CO₂ Table': {
                            holdStartDuration: Math.round(currentMaxHold * 0.4),
                            holdIncrease: Math.round(currentMaxHold * 0.08),
                            restDuration: Math.round(currentMaxHold * 0.4)
                          },
                          'Max Breath-Hold': {
                            stretchConfirmation: true,
                            tidalBreathingDuration: 120,
                            maxHoldPercentages: [25, 35, 50, 65, 100, 100],
                            co2ToleranceSets: 3,
                            co2ToleranceHoldDuration: 45,
                            co2ToleranceRestDuration: 45
                          },
                          'Recovery & Flexibility': {
                            warmupDuration: 300,
                            stretchDuration: 600,
                            cooldownDuration: 180
                          }
                        };
                        setCustomSessionConfig(template[e.target.value]);
                        setCustomSessionBase(e.target.value);
                      } else {
                        setCustomSessionConfig({
                          warmupHolds: 0,
                          warmupDuration: 0,
                          restDuration: 0,
                          holdCount: 1,
                          holdStartDuration: 60,
                          holdIncrease: 0,
                          holdRestDuration: 60,
                          cooldownDuration: 180
                        });
                        setCustomSessionBase('');
                      }
                    }}
                    className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  >
                    <option value="custom">Custom</option>
                    <option value="CO₂ Tolerance">CO₂ Tolerance</option>
                    <option value="Breath Control">Breath Control</option>
                    <option value="O₂ Tolerance">O₂ Tolerance</option>
                    <option value="Mental + Technique">Mental + Technique</option>
                    <option value="Advanced CO₂ Table">Advanced CO₂ Table</option>
                    <option value="Max Breath-Hold">Max Breath-Hold</option>
                    <option value="Recovery & Flexibility">Recovery & Flexibility</option>
                  </select>
                </div>
              </div>
              {customSessionBase && (
                <div className="text-xs text-deep-400 mb-2">
                  Based on: <span className="font-semibold">{customSessionBase}</span>
                </div>
              )}

              <div>
                <label className="text-sm text-deep-300">Description:</label>
                <textarea
                  value={customSessionDescription}
                  onChange={(e) => setCustomSessionDescription(e.target.value)}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  placeholder="Describe the session structure..."
                  rows="2"
                />
              </div>

              {/* Session Structure */}
              <div className="bg-deep-900 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Session Structure</h4>
                
                {/* Dynamic Field Rendering */}
                {(() => {
                  const renderField = (key, label, type = 'number', min = 0, max = 1000, step = 1) => {
                    if (customSessionConfig[key] === undefined) return null;
                    
                    return (
                      <div key={key}>
                        <label className="text-xs text-deep-400">{label}:</label>
                        <input
                          type={type}
                          min={min}
                          max={max}
                          step={step}
                          value={customSessionConfig[key] || 0}
                          onChange={(e) => setCustomSessionConfig({
                            ...customSessionConfig,
                            [key]: type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value
                          })}
                          className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white text-sm"
                        />
                      </div>
                    );
                  };

                  const renderArrayField = (key, label) => {
                    if (!Array.isArray(customSessionConfig[key])) return null;
                    
                    return (
                      <div key={key} className="col-span-full">
                        <label className="text-xs text-deep-400">{label}:</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {customSessionConfig[key].map((value, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={value}
                                onChange={(e) => {
                                  const newArray = [...customSessionConfig[key]];
                                  newArray[index] = parseInt(e.target.value) || 0;
                                  setCustomSessionConfig({
                                    ...customSessionConfig,
                                    [key]: newArray
                                  });
                                }}
                                className="w-16 bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white text-sm"
                              />
                              <button
                                onClick={() => {
                                  const newArray = customSessionConfig[key].filter((_, i) => i !== index);
                                  setCustomSessionConfig({
                                    ...customSessionConfig,
                                    [key]: newArray
                                  });
                                }}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newArray = [...customSessionConfig[key], 50];
                              setCustomSessionConfig({
                                ...customSessionConfig,
                                [key]: newArray
                              });
                            }}
                            className="text-ocean-400 hover:text-ocean-300 text-sm border border-ocean-400 rounded px-2 py-1"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    );
                  };

                  // Determine which sections to show based on session type
                  const hasWarmupFields = ['warmupHolds', 'warmupDuration', 'restDuration'].some(key => 
                    customSessionConfig[key] !== undefined
                  );
                  
                  const hasMainFields = ['holdCount', 'holdStartDuration', 'holdIncrease', 'holdRestDuration', 
                    'diaphragmaticDuration', 'alternateNostrilDuration', 'boxBreathingCycles', 'boxBreathingRest',
                    'visualizationDuration', 'mindfulnessDuration', 'progressiveRelaxationDuration', 
                    'mindfulHoldCount', 'mindfulHoldPercentage', 'co2ToleranceSets', 'co2ToleranceHoldDuration',
                    'co2ToleranceRestDuration', 'stretchConfirmation', 'tidalBreathingDuration', 'maxHoldPercentages'
                  ].some(key => customSessionConfig[key] !== undefined);
                  
                  const hasCooldownFields = ['cooldownDuration', 'recoveryDuration'].some(key => 
                    customSessionConfig[key] !== undefined
                  );

                  return (
                    <>
                      {/* Warm-up Section */}
                      {hasWarmupFields && (
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-ocean-400">🔥</span>
                            <span className="text-sm font-medium text-deep-300">Warm-up</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {renderField('warmupHolds', 'Breath-ups', 'number', 0, 10)}
                            {renderField('warmupDuration', 'Warm-up Duration (s)', 'number', 0, 600)}
                            {renderField('restDuration', 'Rest Duration (s)', 'number', 0, 600)}
                          </div>
                        </div>
                      )}

                      {/* Main Session Section */}
                      {hasMainFields && (
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-ocean-400">⚡</span>
                            <span className="text-sm font-medium text-deep-300">Main Session</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {renderField('holdCount', 'Hold Count', 'number', 1, 20)}
                            {renderField('holdStartDuration', 'Start Duration (s)', 'number', 30, 600)}
                            {renderField('holdIncrease', 'Duration Increase (s)', 'number', 0, 60)}
                            {renderField('holdRestDuration', 'Rest Between (s)', 'number', 0, 300)}
                            {renderField('diaphragmaticDuration', 'Diaphragmatic Breathing (s)', 'number', 0, 1200)}
                            {renderField('alternateNostrilDuration', 'Alternate Nostril (s)', 'number', 0, 600)}
                            {renderField('boxBreathingCycles', 'Box Breathing Cycles', 'number', 1, 20)}
                            {renderField('boxBreathingRest', 'Box Breathing Rest (s)', 'number', 0, 120)}
                            {renderField('visualizationDuration', 'Visualization (s)', 'number', 0, 1200)}
                            {renderField('mindfulnessDuration', 'Mindfulness (s)', 'number', 0, 1200)}
                            {renderField('progressiveRelaxationDuration', 'Progressive Relaxation (s)', 'number', 0, 1200)}
                            {renderField('mindfulHoldCount', 'Mindful Hold Count', 'number', 1, 10)}
                            {renderField('mindfulHoldPercentage', 'Mindful Hold %', 'number', 10, 100)}
                            {renderField('co2ToleranceSets', 'CO₂ Tolerance Sets', 'number', 1, 10)}
                            {renderField('co2ToleranceHoldDuration', 'CO₂ Hold Duration (s)', 'number', 10, 120)}
                            {renderField('co2ToleranceRestDuration', 'CO₂ Rest Duration (s)', 'number', 10, 120)}
                            {renderField('tidalBreathingDuration', 'Tidal Breathing (s)', 'number', 30, 300)}
                            {renderArrayField('maxHoldPercentages', 'Max Hold Percentages')}
                          </div>
                        </div>
                      )}

                      {/* Cool-down Section */}
                      {hasCooldownFields && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-ocean-400">❄️</span>
                            <span className="text-sm font-medium text-deep-300">Cool-down</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {renderField('cooldownDuration', 'Cool-down Duration (s)', 'number', 0, 600)}
                            {renderField('recoveryDuration', 'Recovery Duration (s)', 'number', 0, 600)}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Session Preview */}
              <div className="bg-deep-900 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Session Preview</h4>
                <div className="text-sm text-deep-300 space-y-1">
                  <div>Total estimated time: {calculateSessionDuration()} seconds</div>
                  {customSessionConfig.warmupHolds !== undefined && (
                    <div>Warm-up: {customSessionConfig.warmupHolds || 0} breath-ups</div>
                  )}
                  {customSessionConfig.holdCount !== undefined && (
                    <div>Main session: {customSessionConfig.holdCount || 1} holds</div>
                  )}
                  {customSessionConfig.diaphragmaticDuration !== undefined && (
                    <div>Diaphragmatic breathing: {formatTime(customSessionConfig.diaphragmaticDuration || 0)}</div>
                  )}
                  {customSessionConfig.alternateNostrilDuration !== undefined && (
                    <div>Alternate nostril: {formatTime(customSessionConfig.alternateNostrilDuration || 0)}</div>
                  )}
                  {customSessionConfig.boxBreathingCycles !== undefined && (
                    <div>Box breathing: {customSessionConfig.boxBreathingCycles || 0} cycles</div>
                  )}
                  {customSessionConfig.visualizationDuration !== undefined && (
                    <div>Visualization: {formatTime(customSessionConfig.visualizationDuration || 0)}</div>
                  )}
                  {customSessionConfig.mindfulnessDuration !== undefined && (
                    <div>Mindfulness: {formatTime(customSessionConfig.mindfulnessDuration || 0)}</div>
                  )}
                  {customSessionConfig.progressiveRelaxationDuration !== undefined && (
                    <div>Progressive relaxation: {formatTime(customSessionConfig.progressiveRelaxationDuration || 0)}</div>
                  )}
                  {customSessionConfig.mindfulHoldCount !== undefined && (
                    <div>Mindful holds: {customSessionConfig.mindfulHoldCount || 0} holds</div>
                  )}
                  {customSessionConfig.co2ToleranceSets !== undefined && (
                    <div>CO₂ tolerance: {customSessionConfig.co2ToleranceSets || 0} sets</div>
                  )}
                  {customSessionConfig.maxHoldPercentages !== undefined && (
                    <div>Max hold phases: {customSessionConfig.maxHoldPercentages?.length || 0} phases</div>
                  )}
                  {customSessionConfig.cooldownDuration !== undefined && (
                    <div>Cool-down: {formatTime(customSessionConfig.cooldownDuration || 0)}</div>
                  )}
                  {customSessionConfig.recoveryDuration !== undefined && (
                    <div>Recovery: {formatTime(customSessionConfig.recoveryDuration || 0)}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddCustomSession}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Session Type
              </button>
              <button
                onClick={() => setShowCustomSessionModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-deep-900 border border-deep-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {showSessionDetails.focus} - Complete Session Plan
                </h2>
                <button
                  onClick={() => setShowSessionDetails(null)}
                  className="p-1 hover:bg-deep-700 rounded"
                >
                  <X className="w-5 h-5 text-deep-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-deep-300 mb-4">
                  <p><strong>Session Type:</strong> {showSessionDetails.sessionType}</p>
                  {currentMaxHold && (
                    <p><strong>Based on Max Hold:</strong> {formatTime(currentMaxHold)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-white mb-3">Session Phases:</h3>
                  {parseSessionPhases(showSessionDetails.focus, currentMaxHold || 240).map((phase, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-deep-800/50 rounded-lg">
                      <span className="text-lg">{getPhaseIcon(phase.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{phase.description}</span>
                          <button
                            onClick={() => {
                              const exerciseType = getExerciseTypeFromPhase(phase);
                              if (exerciseType) {
                                showExerciseInstructions(exerciseType);
                              }
                            }}
                            className="text-ocean-400 hover:text-ocean-300 text-xs underline"
                          >
                            View Instructions
                          </button>
                        </div>
                        {phase.duration > 0 && (
                          <div className="text-sm text-deep-300">
                            Duration: {formatTime(phase.duration)}
                          </div>
                        )}
                        {phase.isMaxHold && (
                          <div className="text-sm text-yellow-400">
                            Indefinite hold - press button when complete
                          </div>
                        )}
                        {phase.isCo2Tolerance && (
                          <div className="text-sm text-orange-400">
                            CO₂ tolerance training
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-deep-700">
                  <div className="text-sm text-deep-300">
                    <p><strong>Total Session Time:</strong> {
                      formatTime(
                        parseSessionPhases(showSessionDetails.focus, currentMaxHold || 240)
                          .reduce((total, phase) => total + phase.duration, 0)
                      )
                    }</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Instructions Modal */}
      {showInstructions && currentInstruction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">{currentInstruction.title}</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-deep-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-deep-300 text-lg">{currentInstruction.description}</p>
              
              <div>
                <h4 className="text-white font-semibold mb-3">Instructions:</h4>
                <ol className="space-y-2">
                  {currentInstruction.steps.map((step, index) => (
                    <li key={index} className="text-deep-300 flex">
                      <span className="text-ocean-400 font-semibold mr-2">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeekPlan; 