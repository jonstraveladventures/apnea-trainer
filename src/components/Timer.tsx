import React, { useState } from 'react';
import { X } from 'lucide-react';
import { formatTime } from '../utils/trainingLogic';
import MaxHoldModal from './MaxHoldModal';
import SessionSelector from './SessionSelector';
import SessionPreview from './SessionPreview';
import PhaseDisplay from './PhaseDisplay';
import ControlButtons from './ControlButtons';
import SessionSummary from './SessionSummary';
import { parseSessionPhases as parseSessionPhasesFromUtils } from '../utils/sessionParsers';
import { useTimerContext } from '../context/TimerContext';
import { getExerciseTypeFromPhase, getPhaseGuidance, getTimerColor } from '../utils/phaseUtils';
import { exerciseInstructions } from '../utils/exerciseInstructions';
import useAudio from '../hooks/useAudio';
import useSessionTimer from '../hooks/useSessionTimer';
import useSessionSetup from '../hooks/useSessionSetup';
import { Session, Phase, CustomSessions, SessionTemplates } from '../types';

interface TimerProps {
  onSessionComplete: (sessionTime: number) => void;
  todaySession: Session | undefined;
  onSessionUpdate: (date: string, updatedSession: Session) => void;
  sessions: Session[];
  currentMaxHold: number | null;
  customSessions: CustomSessions;
}

const Timer: React.FC<TimerProps> = ({ onSessionComplete, todaySession, onSessionUpdate, sessions, currentMaxHold, customSessions }) => {
  // ---- State comes from TimerContext ----
  const { state: timerState, actions: timerActions } = useTimerContext();

  const {
    isRunning, time, sessionTime, isSessionActive,
    currentPhase, sessionPhases, phaseTime, isRestPhase,
    sessionCompleted, sessionSummary, isPaused,
    stretchConfirmed, maxHoldCompleted, currentMaxHoldPhase,
    showInstructions, currentInstruction,
    showNextPhaseInstructions, nextPhaseInstruction,
    selectedSessionType, hasUserChangedSession,
    sessionTemplates
  } = timerState;

  // ---- Local UI state ----
  const [showMaxHoldModal, setShowMaxHoldModal] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabledLocal] = useState<boolean>(true);

  // ---- Hooks ----
  const countdownAudio = useAudio('/audio/countdown-5-4-3-2-1.mp3');
  const timer = useSessionTimer({ audio: countdownAudio, onSessionComplete });

  // Parse session details into phases (handles custom sessions)
  const parseSessionPhases = (focus: string, maxHoldSeconds: number): Phase[] => {
    // Check if this is a custom session
    if (customSessions && customSessions[focus]) {
      const customSession = customSessions[focus];
      const phases: Phase[] = [];

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

  useSessionSetup({
    todaySession,
    currentMaxHold,
    customSessions,
    parseSessionPhases,
    onShowMaxHoldModal: () => setShowMaxHoldModal(true)
  });

  // ---- Audio toggle handler ----
  const handleAudioToggle = () => {
    const newValue = !audioEnabled;
    setAudioEnabledLocal(newValue);
    timer.setAudioEnabled(newValue);
  };

  // ---- Max hold save ----
  const handleMaxHoldSave = (maxHoldSeconds: number) => {
    if (todaySession && onSessionUpdate) {
      const updatedSession = {
        ...todaySession,
        actualMaxHold: maxHoldSeconds
      };
      onSessionUpdate(todaySession.date, updatedSession);
    }
    setShowMaxHoldModal(false);
  };

  // ---- Exercise instructions helper ----
  const showExerciseInstructions = (exerciseType: string) => {
    timerActions.setCurrentInstruction(exerciseInstructions[exerciseType]);
    timerActions.setShowInstructions(true);
  };

  // ---- Timer color wrapper ----
  const getTimerColorLocal = (): string => {
    if (!isSessionActive) return 'text-ocean-400';
    const currentPhaseData = sessionPhases[currentPhase];
    if (!currentPhaseData) return 'text-ocean-400';
    return getTimerColor(currentPhaseData, phaseTime);
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
              selectedSessionType={selectedSessionType ?? ''}
              onSessionTypeChange={timer.handleSessionTypeChange}
              hasUserChangedSession={hasUserChangedSession}
              todaySession={todaySession}
              isSessionActive={isSessionActive}
              customSessions={customSessions}
            />



              {/* Session Preview */}
        <SessionPreview
          sessionPhases={sessionPhases}
          actualMaxHold={todaySession?.actualMaxHold ?? null}
          isSessionActive={isSessionActive}
        />

        {/* Current Phase Display */}
        <PhaseDisplay
          currentPhase={currentPhase}
          sessionPhases={sessionPhases}
          phaseTime={phaseTime}
          isSessionActive={isSessionActive}
          stretchConfirmed={stretchConfirmed}
          onStretchConfirm={timer.handleStretchConfirm}
          onMaxHoldComplete={timer.handleMaxHoldComplete}
          onPhaseTimeAdjust={timer.handlePhaseTimeAdjust}
        />

        {/* Session Completion Summary */}
        <SessionSummary
          sessionCompleted={sessionCompleted}
          sessionSummary={sessionSummary}
          onResetTimer={timer.resetTimer}
          onResetSessionCompletion={timer.resetSessionCompletion}
        />

        {/* Audio Toggle */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleAudioToggle}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              audioEnabled
                ? 'bg-ocean-600 hover:bg-ocean-700 text-white'
                : 'bg-deep-700 hover:bg-deep-600 text-white'
            }`}
          >
            {audioEnabled ? '\u{1F50A} Audio On' : '\u{1F507} Audio Off'}
          </button>
        </div>

        {/* Control Buttons */}
        <ControlButtons
          isSessionActive={isSessionActive}
          isPaused={isPaused}
          sessionPhases={sessionPhases}
          currentPhase={currentPhase}
          onStartSession={() => timer.startSession(() => setShowMaxHoldModal(true))}
          onPauseSession={timer.pauseSession}
          onResumeSession={timer.resumeSession}
          onEndSession={timer.endSession}
          onSkipPhase={timer.handleSkipPhase}
          onResetTimer={timer.resetTimer}
        />

        {/* Max Hold Modal */}
        <MaxHoldModal
          isOpen={showMaxHoldModal}
          onClose={() => setShowMaxHoldModal(false)}
          onSave={handleMaxHoldSave}
          currentMaxHold={todaySession?.actualMaxHold ?? null}
        />

        {/* Session Status */}
        {isSessionActive && (
          <div className="mt-4 p-3 bg-ocean-900/50 rounded-lg border border-ocean-700">
            <div className="text-sm text-ocean-300 text-center">
              {sessionPhases[currentPhase]?.type === 'rest'
                ? '\u{1F60C} Rest phase - Breathe normally and relax'
                : sessionPhases[currentPhase]?.type === 'hold' || sessionPhases[currentPhase]?.type === 'max'
                ? '\u{1FAC1} Hold phase - Focus on your breath and stay calm'
                : sessionPhases[currentPhase]?.type === 'breathing'
                ? '\u{1FAC1} Breathing exercise - Follow the rhythm'
                : sessionPhases[currentPhase]?.type === 'box'
                ? '\u{1F4E6} Box breathing - Inhale, hold, exhale, hold'
                : sessionPhases[currentPhase]?.type === 'visualization'
                ? '\u{1F9D8} Visualization - Focus on your mental state'
                : sessionPhases[currentPhase]?.type === 'recovery'
                ? '\u{1F504} Recovery - Gentle breathing and relaxation'
                : sessionPhases[currentPhase]?.type === 'warmup'
                ? '\u{1F525} Warm-up - Prepare for the challenge'
                : sessionPhases[currentPhase]?.type === 'stretch'
                ? '\u{1F9D8}\u{200D}\u{2640}\u{FE0F} Stretching - Gentle movement and flexibility'
                : sessionPhases[currentPhase]?.type === 'cooldown'
                ? '\u{2744}\u{FE0F} Cool-down - Gentle breathing and relaxation'
                : sessionPhases[currentPhase]?.type === 'tidal_breathing'
                ? '\u{1F30A} Tidal breathing - Natural, relaxed breathing'
                : sessionPhases[currentPhase]?.type === 'max_hold'
                ? '\u{26A1} Max hold - Push your limits safely'
                : sessionPhases[currentPhase]?.type === 'stretch_confirmation'
                ? '\u{2705} Confirm you have completed stretching'
                : sessionPhases[currentPhase]?.isCo2Tolerance
                ? '\u{1FAC1} CO₂ Tolerance Training - Adapt to elevated CO₂ levels'
                : '\u{23F1}\u{FE0F} Training phase - Follow the instructions'
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
              {'\u{1F4CB}'} Session Instructions
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
                        {instruction.steps.map((step: string, index: number) => (
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
                {'\u23F0'} Next Phase: {nextPhaseInstruction.title}
              </h3>
              <div className="space-y-3">
                <p className="text-deep-300">{nextPhaseInstruction.description}</p>
                <div>
                  <h4 className="text-white font-semibold mb-2">Get Ready:</h4>
                  <ol className="space-y-2">
                    {nextPhaseInstruction.steps.map((step: string, index: number) => (
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

        {/* Exercise Instructions Modal */}
        {showInstructions && currentInstruction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-deep-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">{currentInstruction.title}</h3>
                <button
                  onClick={() => timerActions.setShowInstructions(false)}
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
                    {currentInstruction.steps.map((step: string, index: number) => (
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
