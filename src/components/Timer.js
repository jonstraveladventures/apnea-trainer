import React, { useState, useEffect, useRef } from 'react';
import { Save, X } from 'lucide-react';
import { formatTime, getWeekday, generateSessionDetails, generateSchedule, START_DATE } from '../utils/trainingLogic';
import dayjs from 'dayjs';
import MaxHoldModal from './MaxHoldModal';
import SessionSelector from './SessionSelector';
import SessionPreview from './SessionPreview';
import PhaseDisplay from './PhaseDisplay';
import ControlButtons from './ControlButtons';
import SessionSummary from './SessionSummary';
import { SESSION_TEMPLATES } from '../config/sessionTemplates';
import { parseSessionPhases as parseSessionPhasesFromUtils } from '../utils/sessionParsers';

const Timer = ({ onSessionComplete, todaySession, onSessionUpdate, sessions, currentMaxHold, customSessions }) => {
  // Local state management (reverted from context for debugging)
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
  const [sessionTemplates, setSessionTemplates] = useState(SESSION_TEMPLATES);
  const intervalRef = useRef(null);
  const [stretchConfirmed, setStretchConfirmed] = useState(false);
  const [maxHoldCompleted, setMaxHoldCompleted] = useState(false);
  const [currentMaxHoldPhase, setCurrentMaxHoldPhase] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [showNextPhaseInstructions, setShowNextPhaseInstructions] = useState(false);
  const [nextPhaseInstruction, setNextPhaseInstruction] = useState(null);
  const [selectedSessionType, setSelectedSessionType] = useState(null);
  const [hasUserChangedSession, setHasUserChangedSession] = useState(false);

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
        'Take a normal, relaxed breath in (not a deep breath)',
        'Hold your breath without forcing or straining',
        'Focus on staying completely relaxed',
        'Notice the urge to breathe but don\'t panic',
        'When you need to breathe, exhale slowly and naturally',
        'Take 2-3 normal recovery breaths before the next hold'
      ]
    },
    'o2_hold': {
      title: 'O₂ Tolerance Hold',
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
    },
    'comfortable_co2_training': {
      title: 'Comfortable CO₂ Training',
      description: 'Gradual CO₂ tolerance building without contractions',
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
      title: 'Comfortable CO₂ Preparation',
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
        'Focus on restoring normal O₂/CO₂ balance',
        'Feel the gentle return to baseline breathing',
        'Reflect on the comfortable training session'
      ]
    }
  };

  const showExerciseInstructions = (exerciseType) => {
    setCurrentInstruction(exerciseInstructions[exerciseType]);
    setShowInstructions(true);
  };

  // Set default session type to today's session when component loads
  useEffect(() => {
    if (todaySession?.focus && !hasUserChangedSession && !selectedSessionType) {
      setSelectedSessionType(todaySession.focus);
    } else if (!selectedSessionType) {
      setSelectedSessionType('Maximal Breath-Hold Training');
    }
  }, [todaySession, hasUserChangedSession, selectedSessionType]);

  // Update session phases when selected session type changes
  useEffect(() => {
    if (selectedSessionType && currentMaxHold) {
      const phases = parseSessionPhases(selectedSessionType, currentMaxHold);
      setSessionPhases(phases);
      setCurrentPhase(0);
      setPhaseTime(0);
      setStretchConfirmed(false);
      setMaxHoldCompleted(false);
      setCurrentMaxHoldPhase(0);
    }
  }, [selectedSessionType, currentMaxHold]);

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
        if (isSessionActive) {
          setSessionTime(prev => prev + 1);
          
          // Only increment phase time if not on stretch confirmation phase
          const currentPhaseData = sessionPhases[currentPhase];
          if (currentPhaseData && currentPhaseData.type !== 'stretch_confirmation') {
          setPhaseTime(prev => prev + 1);
          }
          
          // Check if current phase is complete
          if (sessionPhases[currentPhase]) {
            const currentPhaseData = sessionPhases[currentPhase];
            
            // Show next phase instructions 10 seconds before phase ends
            if (currentPhaseData.duration > 0 && phaseTime >= currentPhaseData.duration - 10) {
                if (currentPhase < sessionPhases.length - 1) {
                const nextPhase = sessionPhases[currentPhase + 1];
                const nextExerciseType = getExerciseTypeFromPhase(nextPhase);
                if (nextExerciseType && exerciseInstructions[nextExerciseType]) {
                  setNextPhaseInstruction(exerciseInstructions[nextExerciseType]);
                  setShowNextPhaseInstructions(true);
                }
              }
            }
            
            // Handle special phase types
            if (currentPhaseData.type === 'stretch_confirmation') {
              // Wait for stretch confirmation - do nothing here, let the button handle it
            } else if (currentPhaseData.type === 'max_hold') {
              // Wait for manual completion for 100% max holds only - do nothing here, let the button handle it
            } else if (phaseTime >= currentPhaseData.duration) {
              // Regular phase completion
              setShowNextPhaseInstructions(false);
              setNextPhaseInstruction(null);
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
  }, [isRunning, isSessionActive, currentPhase, sessionPhases, phaseTime]);

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
    setStretchConfirmed(false);
    setMaxHoldCompleted(false);
    setShowNextPhaseInstructions(false);
    setNextPhaseInstruction(null);
  };

  const resetSessionCompletion = () => {
    setSessionCompleted(false);
    setSessionSummary(null);
  };

  const handleSessionTypeChange = (newSessionType) => {
    setSelectedSessionType(newSessionType);
    setHasUserChangedSession(true);
  };

  const handleStretchConfirm = () => {
    setStretchConfirmed(true);
    if (currentPhase < sessionPhases.length - 1) {
      setCurrentPhase(prev => prev + 1);
      setPhaseTime(0);
      setIsRestPhase(sessionPhases[currentPhase + 1]?.type === 'rest');
    } else {
      endSession();
    }
  };

  const handleMaxHoldComplete = () => {
    setMaxHoldCompleted(true);
    if (currentPhase < sessionPhases.length - 1) {
      setCurrentPhase(prev => prev + 1);
      setPhaseTime(0);
      setIsRestPhase(sessionPhases[currentPhase + 1]?.type === 'rest');
    } else {
      endSession();
    }
  };

  const handleSkipPhase = () => {
    if (currentPhase < sessionPhases.length - 1) {
      setCurrentPhase(prev => prev + 1);
      setPhaseTime(0);
      setIsRestPhase(sessionPhases[currentPhase + 1]?.type === 'rest');
    }
  };

  // Parse session details into phases
  const parseSessionPhases = (focus, maxHoldSeconds) => {
    // Check if this is a custom session
    if (customSessions && customSessions[focus]) {
      const customSession = customSessions[focus];
      const phases = [];
      
      // Add stretch confirmation and tidal breathing if enabled
      if (customSession.stretchConfirmation) {
          phases.push({ 
          type: 'stretch_confirmation', 
          duration: 0, 
          description: 'Stretch Confirmation',
          instructions: 'Please confirm that you have stretched and are in a comfortable position.'
        });
      }
      
      if (customSession.tidalBreathingDuration) {
        phases.push({ 
          type: 'tidal_breathing', 
          duration: customSession.tidalBreathingDuration, 
          description: `Tidal Breathing (${formatTime(customSession.tidalBreathingDuration)})`,
          isTidalBreathing: true,
          instructions: 'Breathe naturally and rhythmically to prepare your body.'
        });
      }
      
      // Add custom phases
      customSession.phases.forEach((phase, index) => {
        let duration = phase.duration;
        
        // Calculate duration based on type
        if (phase.durationType === 'progressive' && index > 0) {
          // This would need to be calculated based on previous phase
          // For now, use the progressive change value
          duration = phase.progressiveChange;
        } else if (phase.durationType === 'maxHold' && maxHoldSeconds) {
          duration = Math.round((phase.maxHoldPercentage / 100) * maxHoldSeconds);
        }
        
          phases.push({ 
          type: phase.type,
          duration: duration,
          description: phase.description || `${phase.type.charAt(0).toUpperCase() + phase.type.slice(1)} Phase`,
          instructions: phase.instructions || `Complete the ${phase.type} phase.`
        });
      });
      
      return phases;
    }
    
    // Use the modular session parser for built-in session types
    const template = sessionTemplates[focus] || {};
    return parseSessionPhasesFromUtils(focus, template, maxHoldSeconds);
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
    setStretchConfirmed(false);
    setMaxHoldCompleted(false);
    setShowNextPhaseInstructions(false);
    setNextPhaseInstruction(null);
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
      focus: selectedSessionType,
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
    if (phase.description.includes('Comfortable Hold')) return 'comfortable_co2_training';
    if (phase.isComfortablePreparation) return 'comfortable_preparation';
    if (phase.description.includes('Natural Tidal') || phase.description.includes('Slow-Exhale')) return 'comfortable_recovery';
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
      'co2_tolerance_training': 'Take a normal breath and hold for the specified time. Focus on staying relaxed during the hold.',
      'comfortable_co2_training': 'Take a normal, relaxed breath and hold. Stay completely relaxed and stop immediately if you feel contractions. Remember: "Breath-holding should feel good, not bad."',
      'comfortable_preparation': 'Start with diaphragmatic breathing to lower your heart rate, then practice box breathing to enter a calm state. Prepare your mind for comfortable breath-holding.',
      'comfortable_recovery': 'Begin with natural tidal breathing, then practice slow-exhale breathing to restore normal O₂/CO₂ balance. Reflect on the comfortable training session.'
    };

    return guidance[type] || 'Focus on your breathing and stay relaxed.';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Timer */}
        <div className="card">
      <div className="text-center">
        {/* Title removed to save vertical space */}
        
            {/* Session Type Selector */}
            <SessionSelector
              selectedSessionType={selectedSessionType}
              onSessionTypeChange={handleSessionTypeChange}
              hasUserChangedSession={hasUserChangedSession}
              todaySession={todaySession}
              isSessionActive={isSessionActive}
              customSessions={customSessions}
            />
        

              
              {/* Session Preview */}
        <SessionPreview
          sessionPhases={sessionPhases}
          actualMaxHold={todaySession?.actualMaxHold}
          isSessionActive={isSessionActive}
        />

        {/* Current Phase Display */}
        <PhaseDisplay
          currentPhase={currentPhase}
          sessionPhases={sessionPhases}
          phaseTime={phaseTime}
          isSessionActive={isSessionActive}
          stretchConfirmed={stretchConfirmed}
          onStretchConfirm={handleStretchConfirm}
          onMaxHoldComplete={handleMaxHoldComplete}
        />

        {/* Session Completion Summary */}
        <SessionSummary
          sessionCompleted={sessionCompleted}
          sessionSummary={sessionSummary}
          onResetTimer={resetTimer}
          onResetSessionCompletion={resetSessionCompletion}
        />





        {/* Control Buttons */}
        <ControlButtons
          isSessionActive={isSessionActive}
          isPaused={isPaused}
          sessionPhases={sessionPhases}
          currentPhase={currentPhase}
          onStartSession={startSession}
          onPauseSession={pauseSession}
          onResumeSession={resumeSession}
          onEndSession={endSession}
          onSkipPhase={handleSkipPhase}
          onResetTimer={resetTimer}
        />




        


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
          </div>
        </div>

        {/* Right Panel - Instructions */}
        <div className="card">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
              📋 Session Instructions
            </h2>
          </div>

          {/* Current Phase Instructions */}
          {isSessionActive && sessionPhases[currentPhase] && (
            <div className="mb-6 p-4 bg-deep-800 rounded-lg border border-deep-700">
              <h3 className="text-lg font-semibold text-white mb-3">
                {sessionPhases[currentPhase].description}
              </h3>
              {(() => {
                const exerciseType = getExerciseTypeFromPhase(sessionPhases[currentPhase]);
                const instruction = exerciseType ? exerciseInstructions[exerciseType] : null;
                return instruction ? (
                  <div className="space-y-3">
                    <p className="text-deep-300">{instruction.description}</p>
                    <div>
                      <h4 className="text-white font-semibold mb-2">Steps:</h4>
                      <ol className="space-y-2">
                        {instruction.steps.map((step, index) => (
                          <li key={index} className="text-deep-300 flex">
                            <span className="text-ocean-400 font-semibold mr-2">{index + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="text-deep-300">
                    {getPhaseGuidance(sessionPhases[currentPhase])}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Next Phase Instructions (10 seconds before phase change) */}
          {showNextPhaseInstructions && nextPhaseInstruction && (
            <div className="mb-6 p-4 bg-ocean-900/20 rounded-lg border border-ocean-700">
              <h3 className="text-lg font-semibold text-ocean-400 mb-3">
                ⏰ Next Phase: {nextPhaseInstruction.title}
              </h3>
              <div className="space-y-3">
                <p className="text-deep-300">{nextPhaseInstruction.description}</p>
                <div>
                  <h4 className="text-white font-semibold mb-2">Get Ready:</h4>
                  <ol className="space-y-2">
                    {nextPhaseInstruction.steps.map((step, index) => (
                      <li key={index} className="text-deep-300 flex">
                        <span className="text-ocean-400 font-semibold mr-2">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Session Overview */}
          {!isSessionActive && todaySession && sessionPhases.length > 0 && (
            <div className="mb-6 p-4 bg-deep-800 rounded-lg border border-deep-700">
              <h3 className="text-lg font-semibold text-white mb-3">
                Session Overview
              </h3>
              <div className="space-y-2">
                <div className="text-deep-300">
                  <strong>Focus:</strong> {todaySession.focus}
                </div>
                <div className="text-deep-300">
                  <strong>Total Phases:</strong> {sessionPhases.length}
                </div>
                <div className="text-deep-300">
                  <strong>Estimated Duration:</strong> {formatTime(sessionPhases.reduce((total, phase) => total + phase.duration, 0))}
                </div>
              </div>
            </div>
          )}

          {/* Instructions when no session is active */}
          {!isSessionActive && (
            <div className="text-center text-deep-400">
              <p>Start a session to see detailed instructions here.</p>
            </div>
          )}
        </div>

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