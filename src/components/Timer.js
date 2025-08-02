import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, SkipForward, Settings, Edit3, Save, X } from 'lucide-react';
import { formatTime, getWeekday, generateSessionDetails, generateSchedule, START_DATE } from '../utils/trainingLogic';
import dayjs from 'dayjs';
import MaxHoldModal from './MaxHoldModal';

const Timer = ({ onSessionComplete, todaySession, onSessionUpdate, sessions, currentMaxHold }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [sessionPhases, setSessionPhases] = useState([]);
  const [phaseTime, setPhaseTime] = useState(0);
  const [isRestPhase, setIsRestPhase] = useState(false);
  const [showMaxHoldModal, setShowMaxHoldModal] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showSessionEditor, setShowSessionEditor] = useState(false);
  const [showCustomSessionCreator, setShowCustomSessionCreator] = useState(false);
  const [editingSessionType, setEditingSessionType] = useState(null);
  const [customSessionName, setCustomSessionName] = useState('');
  const [customSessionTemplate, setCustomSessionTemplate] = useState(null);
  const [sessionTemplates, setSessionTemplates] = useState({
    'Max Breath-Hold': {
      stretchConfirmation: true,
      tidalBreathingDuration: 120,
      maxHoldPercentages: [25, 35, 50, 65, 100, 100],
      co2ToleranceSets: 3,
      co2ToleranceHoldDuration: 45,
      co2ToleranceRestDuration: 45
    },
    'CO₂ Tolerance': {
      holdCount: 5,
      holdStartDuration: 45, // Start at 45 seconds (evidence-based)
      holdIncrease: 15, // Increase by 15 seconds
      restDuration: 45, // 1:1 rest ratio (evidence-based)
      sets: 5
    },
    'O₂ Tolerance': {
      holdCount: 4,
      holdStartDuration: 60, // Start at 60% of max (evidence-based)
      holdIncrease: 10, // Increase by 10 seconds
      restDuration: 120, // 2:1 rest ratio for O₂ tolerance
      sets: 4
    },
    'Breath Control': {
      diaphragmaticDuration: 600, // 10 minutes diaphragmatic breathing
      alternateNostrilDuration: 300, // 5 minutes alternate nostril
      boxBreathingCycles: 8, // 8 cycles of box breathing
      boxBreathingRest: 30, // 30 seconds rest between cycles
      recoveryDuration: 120 // 2 minutes recovery
    },
    'Mental + Technique': {
      visualizationDuration: 900, // 15 minutes guided visualization
      mindfulnessDuration: 600, // 10 minutes mindfulness
      progressiveRelaxationDuration: 600, // 10 minutes PMR
      mindfulHoldCount: 2, // 2 mindful holds
      mindfulHoldPercentage: 60, // 60% of max hold
      recoveryDuration: 180 // 3 minutes recovery between holds
    }
  });
  const intervalRef = useRef(null);
  const [stretchConfirmed, setStretchConfirmed] = useState(false);
  const [maxHoldCompleted, setMaxHoldCompleted] = useState(false);
  const [currentMaxHoldPhase, setCurrentMaxHoldPhase] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState(null);

  // Exercise instructions
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

  const showExerciseInstructions = (exerciseType) => {
    setCurrentInstruction(exerciseInstructions[exerciseType]);
    setShowInstructions(true);
  };

  // Parse session details and create phases
  useEffect(() => {
    if (todaySession && todaySession.actualMaxHold) {
      const phases = parseSessionPhases(todaySession.focus, todaySession.actualMaxHold);
      setSessionPhases(phases);
    }
  }, [todaySession]);

  // Show max hold modal if no max hold is set
  useEffect(() => {
    if (!todaySession?.actualMaxHold) {
      setShowMaxHoldModal(true);
    }
  }, [todaySession]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
        if (isSessionActive && stretchConfirmed) {
          setSessionTime(prev => prev + 1);
          setPhaseTime(prev => prev + 1);
          
          // Check if current phase is complete
          if (sessionPhases[currentPhase]) {
            const currentPhaseData = sessionPhases[currentPhase];
            
            // Handle special phase types
            if (currentPhaseData.type === 'stretch_confirmation') {
              // Wait for stretch confirmation
              if (stretchConfirmed) {
                if (currentPhase < sessionPhases.length - 1) {
                  setCurrentPhase(prev => prev + 1);
                  setPhaseTime(0);
                  setIsRestPhase(sessionPhases[currentPhase + 1]?.type === 'rest');
                } else {
                  endSession();
                }
              }
            } else if (currentPhaseData.type === 'max_hold') {
              // Wait for manual completion for 100% max holds only
              if (maxHoldCompleted) {
                if (currentPhase < sessionPhases.length - 1) {
                  setCurrentPhase(prev => prev + 1);
                  setPhaseTime(0);
                  setMaxHoldCompleted(false);
                  setIsRestPhase(sessionPhases[currentPhase + 1]?.type === 'rest');
                } else {
                  endSession();
                }
              }
            } else if (phaseTime >= currentPhaseData.duration) {
              // Regular phase completion
              if (currentPhase < sessionPhases.length - 1) {
                setCurrentPhase(prev => prev + 1);
                setPhaseTime(0);
                setIsRestPhase(sessionPhases[currentPhase + 1]?.type === 'rest');
              } else {
                endSession();
              }
            }
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isSessionActive, currentPhase, sessionPhases, phaseTime, stretchConfirmed]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
    setSessionTime(0);
    setIsSessionActive(false);
    setSessionCompleted(false);
    setSessionSummary(null);
    setCurrentPhase(0);
    setPhaseTime(0);
  };

  const resetSessionCompletion = () => {
    setSessionCompleted(false);
    setSessionSummary(null);
  };

  // Parse session details into phases
  const parseSessionPhases = (focus, maxHoldSeconds) => {
    const phases = [];
    const template = sessionTemplates[focus] || {};
    
    switch (focus) {
      case 'CO₂ Tolerance':
        // Evidence-based CO₂ tolerance training
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
        const boxCycles = breathTemplate.boxBreathingCycles || 8;
        const boxRest = breathTemplate.boxBreathingRest || 30;
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
        if (breathTemplate.recoveryDuration) {
          phases.push({ 
            type: 'recovery', 
            duration: breathTemplate.recoveryDuration, 
            description: `Recovery (${formatTime(breathTemplate.recoveryDuration)})` 
          });
        }
        break;
        
      case 'O₂ Tolerance':
        // Evidence-based O₂ tolerance training
        const o2HoldCount = template.holdCount || 4;
        const o2HoldStart = template.holdStartDuration || Math.round(maxHoldSeconds * 0.6);
        const o2HoldIncrease = template.holdIncrease || 10;
        const o2RestDuration = template.restDuration || Math.round(maxHoldSeconds * 1.5);
        
        for (let i = 0; i < o2HoldCount; i++) {
          const holdTime = o2HoldStart + (i * o2HoldIncrease);
          phases.push({ 
            type: 'hold', 
            duration: holdTime, 
            description: `O₂ Hold ${i + 1}/${o2HoldCount} (${formatTime(holdTime)})` 
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
        break;
        
      case 'Advanced CO₂ Table':
        // 5× holds. Rest: 2:00 → 0:30
        for (let i = 0; i < 5; i++) {
          const holdTime = Math.round(maxHoldSeconds * 0.625);
          phases.push({ type: 'hold', duration: holdTime, description: `Hold ${i + 1}/5` });
          if (i < 4) {
            const restTime = Math.round(Math.max(30, 120 - (i * 22.5))); // Decreasing rest time, rounded
            phases.push({ type: 'rest', duration: restTime, description: `Rest ${i + 1}/4` });
          }
        }
        break;
        
      case 'Max Breath-Hold':
        // Use template or default values
        const tidalBreathingDuration = template.tidalBreathingDuration || 120;
        const maxHoldPercentages = template.maxHoldPercentages || [25, 35, 50, 65, 100, 100];
        
        // Stretch confirmation phase (if enabled)
        if (template.stretchConfirmation) {
          phases.push({ type: 'stretch_confirmation', duration: 0, description: 'Stretch Confirmation' });
        }
        
        // Progressive max hold phases
        for (let i = 0; i < maxHoldPercentages.length; i++) {
          const percentage = maxHoldPercentages[i];
          
          // Tidal breathing phase
          phases.push({ 
            type: 'tidal_breathing', 
            duration: tidalBreathingDuration, 
            description: `Tidal Breathing (${formatTime(tidalBreathingDuration)})`,
            phaseIndex: i,
            isTidalBreathing: true
          });
          
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
        break;
        
      case 'Recovery & Flexibility':
        // 3×30s diaphragm stretch, 2× side stretches, 5 min box breathing
        for (let i = 0; i < 3; i++) {
          phases.push({ type: 'stretch', duration: 30, description: `Diaphragm Stretch ${i + 1}/3` });
        }
        for (let i = 0; i < 2; i++) {
          phases.push({ type: 'stretch', duration: 45, description: `Side Stretch ${i + 1}/2` });
        }
        phases.push({ type: 'box', duration: 300, description: 'Box Breathing (5 min)' });
        break;
        
      default:
        phases.push({ type: 'hold', duration: 60, description: 'Default Hold' });
    }
    
    // Add cool-down phase to all sessions
    if (phases.length > 0) {
      phases.push({ type: 'cooldown', duration: 180, description: 'Cool-down (3 min)' });
    }
    
    return phases;
  };

  const handleMaxHoldSave = (maxHoldSeconds) => {
    // Update today's session with the max hold time
    if (todaySession && onSessionUpdate) {
      const updatedSession = {
        ...todaySession,
        actualMaxHold: maxHoldSeconds
      };
      onSessionUpdate(todaySession.date, updatedSession);
    }
    setShowMaxHoldModal(false);
  };

  const createCustomSession = (baseTemplate) => {
    setCustomSessionName('');
    setCustomSessionTemplate(JSON.parse(JSON.stringify(sessionTemplates[baseTemplate])));
    setShowCustomSessionCreator(true);
  };

  const saveCustomSession = () => {
    if (customSessionName.trim() && customSessionTemplate) {
      setSessionTemplates(prev => ({
        ...prev,
        [customSessionName]: customSessionTemplate
      }));
      setShowCustomSessionCreator(false);
      setCustomSessionName('');
      setCustomSessionTemplate(null);
    }
  };

  const startSession = () => {
    if (sessionPhases.length === 0) {
      setShowMaxHoldModal(true);
      return;
    }
    
    setIsSessionActive(true);
    setIsPaused(false);
    setSessionTime(0);
    setCurrentPhase(0);
    setPhaseTime(0);
    setIsRestPhase(sessionPhases[0]?.type === 'rest');
    startTimer();
  };

  const pauseSession = () => {
    setIsPaused(true);
    pauseTimer();
  };

  const resumeSession = () => {
    setIsPaused(false);
    startTimer();
  };

  const endSession = () => {
    setIsSessionActive(false);
    pauseTimer();
    setSessionCompleted(true);
    
    // Create session summary
    const summary = {
      totalTime: sessionTime,
      totalPhases: sessionPhases.length,
      completedPhases: currentPhase + 1,
      focus: todaySession?.focus,
      maxHold: todaySession?.actualMaxHold
    };
    setSessionSummary(summary);
    
    if (onSessionComplete && sessionTime > 0) {
      onSessionComplete(sessionTime);
    }
  };

  const getTimerColor = () => {
    if (!isSessionActive) return 'text-ocean-400';
    
    const currentPhaseData = sessionPhases[currentPhase];
    if (!currentPhaseData) return 'text-ocean-400';
    
    const progress = phaseTime / currentPhaseData.duration;
    
    if (currentPhaseData.type === 'rest') return 'text-green-400';
    if (currentPhaseData.type === 'hold' || currentPhaseData.type === 'max') {
      if (progress < 0.3) return 'text-green-400';
      if (progress < 0.6) return 'text-yellow-400';
      if (progress < 0.8) return 'text-orange-400';
      return 'text-red-400';
    }
    if (currentPhaseData.type === 'tidal_breathing') return 'text-blue-400';
    if (currentPhaseData.type === 'max_hold') {
      if (progress < 0.3) return 'text-green-400';
      if (progress < 0.6) return 'text-yellow-400';
      if (progress < 0.8) return 'text-orange-400';
      return 'text-red-400';
    }
    
    return 'text-blue-400';
  };

  const getPhaseIcon = (type) => {
    switch (type) {
      case 'hold': return '🫁';
      case 'rest': return '😌';
      case 'breathing': return '🫁';
      case 'box': return '📦';
      case 'visualization': return '🧘';
      case 'recovery': return '🔄';
      case 'warmup': return '🔥';
      case 'max': return '⚡';
      case 'stretch': return '🧘‍♀️';
      case 'cooldown': return '❄️';
      case 'tidal_breathing': return '🌊';
      case 'max_hold': return '⚡';
      case 'stretch_confirmation': return '✅';
      default: return '⏱️';
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

  const getPhaseGuidance = (phase) => {
    const type = getExerciseTypeFromPhase(phase);
    if (!type) return 'Focus on your breathing and stay relaxed.';

    const guidance = {
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
      'co2_tolerance_training': 'Take a normal breath and hold for the specified time. Focus on staying relaxed during the hold.'
    };

    return guidance[type] || 'Focus on your breathing and stay relaxed.';
  };

  return (
    <div className="card max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
          <TimerIcon className="w-6 h-6" />
          Breath-Hold Timer
        </h2>
        
        {/* Today's Session Info */}
        {todaySession && (
          <div className="mb-6 p-4 bg-deep-800 rounded-lg border border-deep-700">
            <div className="text-center">
              <div className="text-lg font-semibold text-ocean-400 mb-1">
                {todaySession.focus}
              </div>
              <div className="text-sm text-deep-400 mb-2">
                {todaySession.sessionType}
              </div>
              {todaySession.actualMaxHold ? (
                <div className="text-xs text-deep-500 mb-3">
                  Based on max hold: {formatTime(todaySession.actualMaxHold)}
                </div>
              ) : (
                <div className="text-xs text-deep-400 mb-3">
                  No max hold time set
                </div>
              )}
              
              {/* Session Preview */}
              {todaySession.actualMaxHold && sessionPhases.length > 0 && !isSessionActive && (
                <div className="mt-4">
                  <div className="text-sm font-semibold text-deep-300 mb-2">Session Preview:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {sessionPhases.map((phase, index) => (
                      <div key={index} className="flex items-center justify-between text-xs bg-deep-700 rounded px-2 py-1">
                        <div className="flex items-center gap-2">
                          <span>{getPhaseIcon(phase.type)}</span>
                          <span className="text-deep-300">{phase.description}</span>
                        </div>
                        <span className="text-deep-400 font-mono">
                          {phase.type === 'max_hold' && phase.percentage === 100 ? 'Max' : formatTime(phase.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-deep-500 mt-2">
                    Total session time: {formatTime(sessionPhases.reduce((total, phase) => total + phase.duration, 0))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Phase Display */}
        {isSessionActive && sessionPhases[currentPhase] && (
          <div className="mb-6 p-4 bg-deep-800 rounded-lg border border-deep-700">
            <div className="text-center">
              <div className="text-2xl mb-2">
                {getPhaseIcon(sessionPhases[currentPhase].type)}
              </div>
              <div className="text-lg font-semibold text-white mb-1">
                {sessionPhases[currentPhase].description}
              </div>
              <div className="text-sm text-deep-400 mb-2">
                Phase {currentPhase + 1} of {sessionPhases.length}
              </div>
              
              {/* Stretch Confirmation */}
              {sessionPhases[currentPhase].type === 'stretch_confirmation' && (
                <div className="mb-4">
                  <div className="text-sm text-deep-300 mb-3">
                    Have you completed your stretching routine?
                  </div>
                  <button
                    onClick={() => setStretchConfirmed(true)}
                    className="btn-primary px-6 py-2"
                  >
                    Yes, I'm Ready
                  </button>
                </div>
              )}
              
              {/* Max Hold Completion - Only for 100% max holds */}
              {sessionPhases[currentPhase].type === 'max_hold' && sessionPhases[currentPhase].isMaxHold && (
                <div className="mb-4">
                  <div className="text-sm text-deep-300 mb-3">
                    Press the button when you have completed your max hold
                  </div>
                  <button
                    onClick={() => setMaxHoldCompleted(true)}
                    className="btn-primary px-6 py-2"
                  >
                    Hold Completed
                  </button>
                </div>
              )}
              
              {/* Phase Progress Bar - Only show for timed phases */}
              {sessionPhases[currentPhase].duration > 0 && (
                <>
                  <div className="w-full bg-deep-700 rounded-full h-3 mb-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${getTimerColor()}`}
                      style={{ width: `${(phaseTime / sessionPhases[currentPhase].duration) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-deep-400 mb-3">
                    {formatTime(phaseTime)} / {formatTime(sessionPhases[currentPhase].duration)}
                  </div>
                </>
              )}
              

              
              {/* Session Progress */}
              <div className="border-t border-deep-700 pt-3">
                <div className="text-xs text-deep-500 mb-2">Session Progress</div>
                <div className="w-full bg-deep-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-ocean-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentPhase + (sessionPhases[currentPhase].duration > 0 ? (phaseTime / sessionPhases[currentPhase].duration) : 0)) / sessionPhases.length) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-deep-400">
                  {Math.round(((currentPhase + (sessionPhases[currentPhase].duration > 0 ? (phaseTime / sessionPhases[currentPhase].duration) : 0)) / sessionPhases.length) * 100)}% complete
                </div>
              </div>
              
              {/* Next Phase Preview */}
              {currentPhase < sessionPhases.length - 1 && (
                <div className="border-t border-deep-700 pt-3 mt-3">
                  <div className="text-xs text-deep-500 mb-1">Next: {sessionPhases[currentPhase + 1].description}</div>
                  <div className="text-xs text-deep-400">
                    {getPhaseIcon(sessionPhases[currentPhase + 1].type)} {formatTime(sessionPhases[currentPhase + 1].duration)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session Completion Summary */}
        {sessionCompleted && sessionSummary && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <div className="text-center">
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-lg font-semibold text-green-400 mb-2">
                Session Complete!
              </div>
              <div className="space-y-1 text-sm text-deep-300">
                <div>Focus: {sessionSummary.focus}</div>
                <div>Total Time: {formatTime(sessionSummary.totalTime)}</div>
                <div>Phases Completed: {sessionSummary.completedPhases}/{sessionSummary.totalPhases}</div>
                <div>Based on Max Hold: {formatTime(sessionSummary.maxHold)}</div>
              </div>
              <div className="flex gap-2 justify-center mt-3">
                <button
                  onClick={resetTimer}
                  className="btn-secondary text-xs"
                >
                  Reset Timer
                </button>
                <button
                  onClick={resetSessionCompletion}
                  className="btn-secondary text-xs"
                >
                  Remove Completion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Total Session Time */}
        <div className="mb-8">
          <div className="text-sm text-deep-400 mb-2">Total Time</div>
          <div className={`timer-display ${getTimerColor()} ${isSessionActive && sessionPhases[currentPhase]?.isTidalBreathing ? 'animate-breathe' : ''}`}>
            {formatTime(sessionTime)}
          </div>
        </div>

        {/* Phase Timer Display */}
        {isSessionActive && sessionPhases[currentPhase] && (
          <div className="mb-6">
            <div className="text-sm text-deep-400 mb-2">
              {sessionPhases[currentPhase].type === 'max_hold' ? 'Hold Time' : 'Phase Time'}
            </div>
            <div className="text-2xl font-mono text-ocean-400">
              {sessionPhases[currentPhase].type === 'max_hold' 
                ? formatTime(phaseTime) // Count up for max holds
                : formatTime(sessionPhases[currentPhase].duration - phaseTime) // Count down for other phases
              }
            </div>
          </div>
        )}

        {/* Current Phase Guidance */}
        {isSessionActive && sessionPhases[currentPhase] && (
          <div className="mb-6 p-4 bg-deep-800/50 border border-deep-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">
                {sessionPhases[currentPhase].description}
              </h3>
              <button
                onClick={() => {
                  const exerciseType = getExerciseTypeFromPhase(sessionPhases[currentPhase]);
                  if (exerciseType) {
                    showExerciseInstructions(exerciseType);
                  }
                }}
                className="text-ocean-400 hover:text-ocean-300 text-sm underline"
              >
                View Instructions
              </button>
            </div>
            <div className="text-deep-300 text-sm">
              {getPhaseGuidance(sessionPhases[currentPhase])}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          {!isSessionActive ? (
            <button
              onClick={startSession}
              className="btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Session
            </button>
          ) : isPaused ? (
            <button
              onClick={resumeSession}
              className="btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          ) : (
            <button
              onClick={pauseSession}
              className="btn-secondary flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          
          {isSessionActive && (
            <button
              onClick={endSession}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              End Session
            </button>
          )}
          
          {isSessionActive && sessionPhases.length > 0 && currentPhase < sessionPhases.length - 1 && (
            <button
              onClick={() => {
                setCurrentPhase(prev => prev + 1);
                setPhaseTime(0);
                setIsRestPhase(sessionPhases[currentPhase + 1]?.type === 'rest');
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Skip Phase
            </button>
          )}
          
          <button
            onClick={resetTimer}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Session Template Editor Button */}
        <div className="mt-4">
          <button
            onClick={() => setShowTemplateEditor(true)}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Edit Session Templates
          </button>
        </div>

        {/* Edit Session Types Button */}
        <div className="mt-2">
          <button
            onClick={() => setShowSessionEditor(true)}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit Session Types
          </button>
        </div>

        {/* Set Max Hold Button */}
        {!todaySession?.actualMaxHold && (
          <div className="mt-4">
            <button
              onClick={() => setShowMaxHoldModal(true)}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Set Max Hold Time
            </button>
          </div>
        )}
        


        {/* Max Hold Modal */}
        <MaxHoldModal
          isOpen={showMaxHoldModal}
          onClose={() => setShowMaxHoldModal(false)}
          onSave={handleMaxHoldSave}
          currentMaxHold={todaySession?.actualMaxHold}
        />

        {/* Session Template Editor Modal */}
        {showTemplateEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-deep-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Edit Session Templates</h3>
                <button
                  onClick={() => setShowTemplateEditor(false)}
                  className="text-deep-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">


                {/* Max Breath-Hold Template */}
                <div className="border border-deep-700 rounded-lg p-4">
                  <h4 className="font-semibold text-ocean-400 mb-3">Max Breath-Hold</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-deep-300">Stretch Confirmation:</label>
                      <input
                        type="checkbox"
                        checked={sessionTemplates['Max Breath-Hold'].stretchConfirmation}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Max Breath-Hold': {
                            ...prev['Max Breath-Hold'],
                            stretchConfirmation: e.target.checked
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Tidal Breathing Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Max Breath-Hold'].tidalBreathingDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Max Breath-Hold': {
                            ...prev['Max Breath-Hold'],
                            tidalBreathingDuration: parseInt(e.target.value) || 120
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="30"
                        max="300"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Max Hold Percentages (% of max hold):</label>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {sessionTemplates['Max Breath-Hold'].maxHoldPercentages.map((percent, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <span className="text-deep-300 text-xs">Phase {index + 1}:</span>
                              <input
                                type="number"
                                value={percent}
                                onChange={(e) => setSessionTemplates(prev => ({
                                  ...prev,
                                  'Max Breath-Hold': {
                                    ...prev['Max Breath-Hold'],
                                    maxHoldPercentages: prev['Max Breath-Hold'].maxHoldPercentages.map((p, i) => i === index ? parseInt(e.target.value) || 0 : p)
                                  }
                                }))}
                                className="w-16 bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white text-center text-sm"
                                min="0"
                                max="100"
                              />
                              <button
                                onClick={() => setSessionTemplates(prev => ({
                                  ...prev,
                                  'Max Breath-Hold': {
                                    ...prev['Max Breath-Hold'],
                                    maxHoldPercentages: prev['Max Breath-Hold'].maxHoldPercentages.filter((_, i) => i !== index)
                                  }
                                }))}
                                className="text-red-400 hover:text-red-300 text-xs px-1"
                                disabled={sessionTemplates['Max Breath-Hold'].maxHoldPercentages.length <= 1}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSessionTemplates(prev => ({
                              ...prev,
                              'Max Breath-Hold': {
                                ...prev['Max Breath-Hold'],
                                maxHoldPercentages: [...prev['Max Breath-Hold'].maxHoldPercentages, 50]
                              }
                            }))}
                            className="btn-secondary text-xs px-2 py-1"
                            disabled={sessionTemplates['Max Breath-Hold'].maxHoldPercentages.length >= 10}
                          >
                            + Add Phase
                          </button>
                          <button
                            onClick={() => setSessionTemplates(prev => ({
                              ...prev,
                              'Max Breath-Hold': {
                                ...prev['Max Breath-Hold'],
                                maxHoldPercentages: [25, 35, 50, 65, 100, 100]
                              }
                            }))}
                            className="btn-secondary text-xs px-2 py-1"
                          >
                            Reset to Default
                          </button>
                        </div>
                        <div className="text-xs text-deep-400">
                          {sessionTemplates['Max Breath-Hold'].maxHoldPercentages.length} phases total
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-deep-300">CO₂ Tolerance Sets:</label>
                      <input
                        type="number"
                        value={sessionTemplates['Max Breath-Hold'].co2ToleranceSets}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Max Breath-Hold': {
                            ...prev['Max Breath-Hold'],
                            co2ToleranceSets: parseInt(e.target.value) || 3
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="1"
                        max="5"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-deep-300">CO₂ Tolerance Hold Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Max Breath-Hold'].co2ToleranceHoldDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Max Breath-Hold': {
                            ...prev['Max Breath-Hold'],
                            co2ToleranceHoldDuration: parseInt(e.target.value) || 45
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="30"
                        max="90"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-deep-300">CO₂ Tolerance Rest Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Max Breath-Hold'].co2ToleranceRestDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Max Breath-Hold': {
                            ...prev['Max Breath-Hold'],
                            co2ToleranceRestDuration: parseInt(e.target.value) || 45
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="30"
                        max="90"
                      />
                    </div>
                  </div>
                </div>

                {/* CO₂ Tolerance Template */}
                <div className="border border-deep-700 rounded-lg p-4">
                  <h4 className="font-semibold text-ocean-400 mb-3">CO₂ Tolerance</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-deep-300">Number of Holds:</label>
                      <input
                        type="number"
                        value={sessionTemplates['CO₂ Tolerance'].holdCount}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'CO₂ Tolerance': {
                            ...prev['CO₂ Tolerance'],
                            holdCount: parseInt(e.target.value) || 7
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="3"
                        max="15"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Starting Hold Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['CO₂ Tolerance'].holdStartDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'CO₂ Tolerance': {
                            ...prev['CO₂ Tolerance'],
                            holdStartDuration: parseInt(e.target.value) || 45
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="30"
                        max="120"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Hold Increase (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['CO₂ Tolerance'].holdIncrease}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'CO₂ Tolerance': {
                            ...prev['CO₂ Tolerance'],
                            holdIncrease: parseInt(e.target.value) || 15
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="5"
                        max="30"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Rest Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['CO₂ Tolerance'].restDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'CO₂ Tolerance': {
                            ...prev['CO₂ Tolerance'],
                            restDuration: parseInt(e.target.value) || 45
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="15"
                        max="120"
                      />
                    </div>
                  </div>
                </div>

                {/* O₂ Tolerance Template */}
                <div className="border border-deep-700 rounded-lg p-4">
                  <h4 className="font-semibold text-ocean-400 mb-3">O₂ Tolerance</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-deep-300">Number of Holds:</label>
                      <input
                        type="number"
                        value={sessionTemplates['O₂ Tolerance'].holdCount}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'O₂ Tolerance': {
                            ...prev['O₂ Tolerance'],
                            holdCount: parseInt(e.target.value) || 7
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="3"
                        max="15"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Starting Hold Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['O₂ Tolerance'].holdStartDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'O₂ Tolerance': {
                            ...prev['O₂ Tolerance'],
                            holdStartDuration: parseInt(e.target.value) || Math.round(currentMaxHold * 0.6)
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="30"
                        max="600"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Hold Increase (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['O₂ Tolerance'].holdIncrease}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'O₂ Tolerance': {
                            ...prev['O₂ Tolerance'],
                            holdIncrease: parseInt(e.target.value) || 10
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="10"
                        max="60"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Rest Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['O₂ Tolerance'].restDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'O₂ Tolerance': {
                            ...prev['O₂ Tolerance'],
                            restDuration: parseInt(e.target.value) || Math.round(currentMaxHold * 1.5)
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="30"
                        max="600"
                      />
                    </div>
                  </div>
                </div>

                {/* Breath Control Template */}
                <div className="border border-deep-700 rounded-lg p-4">
                  <h4 className="font-semibold text-ocean-400 mb-3">Breath Control</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-deep-300">Diaphragmatic Breathing Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Breath Control'].diaphragmaticDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Breath Control': {
                            ...prev['Breath Control'],
                            diaphragmaticDuration: parseInt(e.target.value) || 600
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="300"
                        max="1800"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Alternate Nostril Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Breath Control'].alternateNostrilDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Breath Control': {
                            ...prev['Breath Control'],
                            alternateNostrilDuration: parseInt(e.target.value) || 300
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="180"
                        max="900"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Box Breathing Cycles:</label>
                      <input
                        type="number"
                        value={sessionTemplates['Breath Control'].boxBreathingCycles}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Breath Control': {
                            ...prev['Breath Control'],
                            boxBreathingCycles: parseInt(e.target.value) || 8
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="4"
                        max="20"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Box Breathing Rest (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Breath Control'].boxBreathingRest}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Breath Control': {
                            ...prev['Breath Control'],
                            boxBreathingRest: parseInt(e.target.value) || 30
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="15"
                        max="60"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Recovery Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Breath Control'].recoveryDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Breath Control': {
                            ...prev['Breath Control'],
                            recoveryDuration: parseInt(e.target.value) || 120
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="60"
                        max="300"
                      />
                    </div>
                  </div>
                </div>

                {/* Mental + Technique Template */}
                <div className="border border-deep-700 rounded-lg p-4">
                  <h4 className="font-semibold text-ocean-400 mb-3">Mental + Technique</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-deep-300">Visualization Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Mental + Technique'].visualizationDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Mental + Technique': {
                            ...prev['Mental + Technique'],
                            visualizationDuration: parseInt(e.target.value) || 900
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="600"
                        max="1800"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Mindfulness Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Mental + Technique'].mindfulnessDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Mental + Technique': {
                            ...prev['Mental + Technique'],
                            mindfulnessDuration: parseInt(e.target.value) || 600
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="300"
                        max="1200"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Progressive Relaxation Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Mental + Technique'].progressiveRelaxationDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Mental + Technique': {
                            ...prev['Mental + Technique'],
                            progressiveRelaxationDuration: parseInt(e.target.value) || 600
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="300"
                        max="1200"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Mindful Hold Count:</label>
                      <input
                        type="number"
                        value={sessionTemplates['Mental + Technique'].mindfulHoldCount}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Mental + Technique': {
                            ...prev['Mental + Technique'],
                            mindfulHoldCount: parseInt(e.target.value) || 2
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="1"
                        max="5"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Mindful Hold Percentage (% of max):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Mental + Technique'].mindfulHoldPercentage}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Mental + Technique': {
                            ...prev['Mental + Technique'],
                            mindfulHoldPercentage: parseInt(e.target.value) || 60
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="30"
                        max="80"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-deep-300">Recovery Duration (seconds):</label>
                      <input
                        type="number"
                        value={sessionTemplates['Mental + Technique'].recoveryDuration}
                        onChange={(e) => setSessionTemplates(prev => ({
                          ...prev,
                          'Mental + Technique': {
                            ...prev['Mental + Technique'],
                            recoveryDuration: parseInt(e.target.value) || 180
                          }
                        }))}
                        className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white"
                        min="120"
                        max="600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTemplateEditor(false)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Status */}
        {isSessionActive && (
          <div className="mt-4 p-3 bg-ocean-900/50 rounded-lg border border-ocean-700">
            <div className="text-sm text-ocean-300 text-center">
              {sessionPhases[currentPhase]?.type === 'rest' 
                ? '😌 Rest phase - Breathe normally and relax' 
                : sessionPhases[currentPhase]?.type === 'hold' || sessionPhases[currentPhase]?.type === 'max'
                ? '🫁 Hold phase - Focus on your breath and stay calm'
                : sessionPhases[currentPhase]?.type === 'breathing'
                ? '🫁 Breathing exercise - Follow the rhythm'
                : sessionPhases[currentPhase]?.type === 'box'
                ? '📦 Box breathing - Inhale, hold, exhale, hold'
                : sessionPhases[currentPhase]?.type === 'visualization'
                ? '🧘 Visualization - Focus on your mental state'
                : sessionPhases[currentPhase]?.type === 'recovery'
                ? '🔄 Recovery - Gentle breathing and relaxation'
                : sessionPhases[currentPhase]?.type === 'warmup'
                ? '🔥 Warm-up - Prepare for the challenge'
                : sessionPhases[currentPhase]?.type === 'stretch'
                ? '🧘‍♀️ Stretching - Gentle movement and flexibility'
                : sessionPhases[currentPhase]?.type === 'cooldown'
                ? '❄️ Cool-down - Gentle breathing and relaxation'
                : sessionPhases[currentPhase]?.type === 'tidal_breathing'
                ? '🌊 Tidal breathing - Natural, relaxed breathing'
                : sessionPhases[currentPhase]?.type === 'max_hold'
                ? '⚡ Max hold - Push your limits safely'
                : sessionPhases[currentPhase]?.type === 'stretch_confirmation'
                ? '✅ Confirm you have completed stretching'
                : sessionPhases[currentPhase]?.isCo2Tolerance
                ? '🫁 CO₂ Tolerance Training - Adapt to elevated CO₂ levels'
                : '⏱️ Training phase - Follow the instructions'
              }
            </div>
          </div>
        )}

        {/* Session Editor Modal */}
        {showSessionEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Edit Session Types</h3>
                <button
                  onClick={() => setShowSessionEditor(false)}
                  className="text-deep-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-deep-300">
                  Choose a session type to edit its parameters and create a custom version.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(sessionTemplates).map((sessionType) => (
                    <div key={sessionType} className="p-4 bg-deep-700 rounded-lg border border-deep-600">
                      <h4 className="font-semibold text-ocean-400 mb-2">{sessionType}</h4>
                      <div className="text-sm text-deep-300 mb-3">
                        {sessionType === 'CO₂ Tolerance' && 'Evidence-based progressive CO₂ tolerance training'}
                        {sessionType === 'O₂ Tolerance' && 'Evidence-based O₂ tolerance with hypoxic training'}
                        {sessionType === 'Max Breath-Hold' && 'Progressive max hold training with CO₂ tolerance'}
                        {sessionType === 'Breath Control' && 'Advanced breath control and pranayama techniques'}
                        {sessionType === 'Mental + Technique' && 'Mental training and visualization techniques'}
                        {sessionType === 'Advanced CO₂ Table' && 'Advanced CO₂ table training'}
                        {sessionType === 'Recovery & Flexibility' && 'Recovery and flexibility training'}
                      </div>
                      <button
                        onClick={() => {
                          setEditingSessionType(sessionType);
                          setShowSessionEditor(false);
                          setShowTemplateEditor(true);
                        }}
                        className="btn-primary w-full text-sm"
                      >
                        Edit {sessionType}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-deep-700 rounded-lg">
                  <h4 className="font-semibold text-green-400 mb-2">Create Custom Session</h4>
                  <p className="text-sm text-deep-300 mb-3">
                    Create a completely custom session type with your own parameters.
                  </p>
                  <button
                    onClick={() => setShowCustomSessionCreator(true)}
                    className="btn-secondary w-full"
                  >
                    Create Custom Session Type
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Session Creator Modal */}
        {showCustomSessionCreator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-deep-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Create Custom Session</h3>
                <button
                  onClick={() => {
                    setShowCustomSessionCreator(false);
                    setCustomSessionName('');
                    setCustomSessionTemplate(null);
                  }}
                  className="text-deep-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Session Name */}
                <div>
                  <label className="text-sm text-deep-300 mb-2 block">Custom Session Name:</label>
                  <input
                    type="text"
                    value={customSessionName}
                    onChange={(e) => setCustomSessionName(e.target.value)}
                    placeholder="Enter a unique session name..."
                    className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  />
                </div>

                {/* Base Template Selection */}
                {!customSessionTemplate && (
                  <div>
                    <label className="text-sm text-deep-300 mb-3 block">Create based on:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.keys(sessionTemplates).map((sessionType) => (
                        <button
                          key={sessionType}
                          onClick={() => createCustomSession(sessionType)}
                          className="p-4 bg-deep-700 rounded-lg border border-deep-600 hover:border-ocean-500 text-left"
                        >
                          <h4 className="font-semibold text-ocean-400 mb-1">{sessionType}</h4>
                          <div className="text-sm text-deep-300">
                            {sessionType === 'CO₂ Tolerance' && 'Evidence-based progressive CO₂ tolerance training'}
                            {sessionType === 'O₂ Tolerance' && 'Evidence-based O₂ tolerance with hypoxic training'}
                            {sessionType === 'Max Breath-Hold' && 'Progressive max hold training with CO₂ tolerance'}
                            {sessionType === 'Breath Control' && 'Advanced breath control and pranayama techniques'}
                            {sessionType === 'Mental + Technique' && 'Mental training and visualization techniques'}
                            {sessionType === 'Advanced CO₂ Table' && 'Advanced CO₂ table training'}
                            {sessionType === 'Recovery & Flexibility' && 'Recovery and flexibility training'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Session Editor */}
                {customSessionTemplate && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-green-400">Customize Session Parameters</h4>
                      <button
                        onClick={() => setCustomSessionTemplate(null)}
                        className="text-sm text-deep-400 hover:text-white"
                      >
                        ← Choose Different Base
                      </button>
                    </div>

                    {/* Dynamic Parameter Editor */}
                    <div className="space-y-4">
                      {Object.entries(customSessionTemplate).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm text-deep-300 mb-1 block">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          </label>
                          {typeof value === 'number' ? (
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => setCustomSessionTemplate(prev => ({
                                ...prev,
                                [key]: parseInt(e.target.value) || 0
                              }))}
                              className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                              min="0"
                              max="1000"
                            />
                          ) : typeof value === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setCustomSessionTemplate(prev => ({
                                ...prev,
                                [key]: e.target.checked
                              }))}
                              className="mr-2"
                            />
                          ) : Array.isArray(value) ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {value.map((item, index) => (
                                  <div key={index} className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={item}
                                      onChange={(e) => setCustomSessionTemplate(prev => ({
                                        ...prev,
                                        [key]: prev[key].map((v, i) => i === index ? parseInt(e.target.value) || 0 : v)
                                      }))}
                                      className="w-16 bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white text-center"
                                      min="0"
                                      max="100"
                                    />
                                    <button
                                      onClick={() => setCustomSessionTemplate(prev => ({
                                        ...prev,
                                        [key]: prev[key].filter((_, i) => i !== index)
                                      }))}
                                      className="text-red-400 hover:text-red-300 text-xs px-1"
                                      disabled={value.length <= 1}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setCustomSessionTemplate(prev => ({
                                    ...prev,
                                    [key]: [...prev[key], 50]
                                  }))}
                                  className="btn-secondary text-xs px-2 py-1"
                                  disabled={value.length >= 10}
                                >
                                  + Add Item
                                </button>
                                <button
                                  onClick={() => setCustomSessionTemplate(prev => ({
                                    ...prev,
                                    [key]: [25, 35, 50, 65, 100, 100]
                                  }))}
                                  className="btn-secondary text-xs px-2 py-1"
                                >
                                  Reset to Default
                                </button>
                              </div>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => setCustomSessionTemplate(prev => ({
                                ...prev,
                                [key]: e.target.value
                              }))}
                              className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-3 pt-4 border-t border-deep-700">
                      <button
                        onClick={saveCustomSession}
                        disabled={!customSessionName.trim()}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Custom Session
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomSessionCreator(false);
                          setCustomSessionName('');
                          setCustomSessionTemplate(null);
                        }}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
    </div>
  );
};

export default Timer; 