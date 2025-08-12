import React, { useEffect, useRef, useState } from 'react';
import { formatTime } from '../utils/trainingLogic';

const PhaseDisplay = ({ 
  currentPhase,
  sessionPhases,
  phaseTime,
  isSessionActive,
  stretchConfirmed,
  onStretchConfirm,
  onMaxHoldComplete
}) => {
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
      'comfortable_co2_training': 'Stay in your comfort zone. Stop when you feel the first contraction.',
      'comfortable_preparation': 'Prepare your body and mind for comfortable CO₂ training.',
      'comfortable_recovery': 'Allow your body to recover naturally from the training session.'
    };

    return guidance[type] || 'Focus on your breathing and stay relaxed.';
  };

  const getTimerColor = (currentPhaseData, phaseTime) => {
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

  if (!isSessionActive || !sessionPhases[currentPhase]) {
    return null;
  }

  const currentPhaseData = sessionPhases[currentPhase];
  
  // Helpers for box-breathing visualization
  const isBoxPhase = currentPhaseData.type === 'box';
  const [nowMs, setNowMs] = useState(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lastPhaseTimeChangeMsRef = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lastPhaseTimeRef = useRef(phaseTime);
  const rafIdRef = useRef(0);

  useEffect(() => {
    if (phaseTime !== lastPhaseTimeRef.current) {
      lastPhaseTimeRef.current = phaseTime;
      lastPhaseTimeChangeMsRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    }
  }, [phaseTime]);

  useEffect(() => {
    if (isSessionActive && isBoxPhase) {
      const loop = () => {
        setNowMs(typeof performance !== 'undefined' ? performance.now() : Date.now());
        rafIdRef.current = requestAnimationFrame(loop);
      };
      rafIdRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafIdRef.current);
    }
    return undefined;
  }, [isSessionActive, isBoxPhase]);

  const boxCycleSeconds = 16; // 4s per side × 4 sides
  const elapsedSinceTickSec = Math.max(0, (nowMs - lastPhaseTimeChangeMsRef.current) / 1000);
  const smoothPhaseSeconds = isBoxPhase
    ? phaseTime + Math.min(1, elapsedSinceTickSec)
    : phaseTime;
  const boxT = smoothPhaseSeconds % boxCycleSeconds;
  const boxSegment = Math.floor(boxT / 4); // 0..3
  const boxSegProgress = (boxT % 4) / 4; // 0..1
  const boxSize = 120; // px (slightly smaller)
  const getBoxDotPosition = () => {
    let x = 0;
    let y = 0;
    switch (boxSegment) {
      case 0: // top edge: left -> right
        x = boxSegProgress * boxSize;
        y = 0;
        break;
      case 1: // right edge: top -> bottom
        x = boxSize;
        y = boxSegProgress * boxSize;
        break;
      case 2: // bottom edge: right -> left
        x = boxSize - (boxSegProgress * boxSize);
        y = boxSize;
        break;
      case 3: // left edge: bottom -> top
        x = 0;
        y = boxSize - (boxSegProgress * boxSize);
        break;
      default:
        x = 0; y = 0;
    }
    // Sub-pixel smoothing to avoid rounding jumps
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  };

  return (
    <div className="mb-6 p-4 bg-deep-800 rounded-lg border border-deep-700">
      <div className="text-center">
        {/* Phase Timer - Prominently displayed at the top */}
        {currentPhaseData.duration > 0 && currentPhaseData.type !== 'stretch_confirmation' && (
          <div className="mb-6">
            {/* Primary time display */}
            <div className="text-4xl font-mono text-ocean-400 mb-1">
              {currentPhaseData.type === 'max_hold' 
                ? formatTime(phaseTime)
                : formatTime(currentPhaseData.duration - phaseTime)
              }
            </div>
            <div className="text-sm text-deep-400 mb-3">
              {currentPhaseData.type === 'max_hold' ? 'Hold Time' : 'Time Remaining'}
            </div>
            {/* Box-breathing CSS keyframes fallback (jitter-free) */}
            {isBoxPhase && (() => {
              const dotDiameter = 18; // px
              const leftLabel = 'Breathe In';
              const rightLabel = 'Breathe Out';
              return (
                <div className="flex flex-col items-center mb-4">
                  <div
                    className="grid items-center mb-2"
                    style={{ gridTemplateColumns: `auto ${boxSize}px auto`, columnGap: '10px' }}
                  >
                    <div className="text-sm text-green-400 text-right whitespace-nowrap">{leftLabel}</div>
                    <div className="relative" style={{ width: boxSize, height: boxSize }}>
                      <div className="absolute inset-0 border-2 border-deep-600 rounded-sm" />
                      <div
                        className="box-dot bg-ocean-400 shadow"
                        style={{
                          width: dotDiameter,
                          height: dotDiameter,
                          borderRadius: dotDiameter / 2,
                          '--box-size': `${boxSize - dotDiameter}px`
                        }}
                      />
                    </div>
                    <div className="text-sm text-blue-400 whitespace-nowrap">{rightLabel}</div>
                  </div>
                  <div className="text-xs text-deep-400">Follow the moving dot clockwise around the square</div>
                </div>
              );
            })()}
            {/* Phase Progress Bar */}
            <div className="w-full bg-deep-700 rounded-full h-3 mb-2">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${getTimerColor(currentPhaseData, phaseTime)}`}
                style={{ width: `${(phaseTime / currentPhaseData.duration) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-deep-400">
              {formatTime(phaseTime)} / {formatTime(currentPhaseData.duration)}
            </div>
          </div>
        )}

        {/* Phase Info */}
        <div className="mb-4">
          <div className="text-2xl mb-2">
            {getPhaseIcon(currentPhaseData.type)}
          </div>
          <div className="text-lg font-semibold text-white mb-1">
            {currentPhaseData.description}
          </div>
          <div className="text-sm text-deep-400">
            Phase {currentPhase + 1} of {sessionPhases.length}
          </div>
        </div>
        
        {/* Stretch Confirmation */}
        {currentPhaseData.type === 'stretch_confirmation' && (
          <div className="mb-4">
            <div className="text-sm text-deep-300 mb-3">
              Have you completed your stretching routine?
            </div>
            <button
              onClick={onStretchConfirm}
              className="btn-primary px-6 py-2"
            >
              Yes, I'm Ready
            </button>
          </div>
        )}
        
        {/* Max Hold Completion - Only for 100% max holds */}
        {currentPhaseData.type === 'max_hold' && currentPhaseData.isMaxHold && (
          <div className="mb-4">
            <div className="text-sm text-deep-300 mb-3">
              Press the button when you have completed your max hold
            </div>
            <button
              onClick={onMaxHoldComplete}
              className="btn-primary px-6 py-2"
            >
              Hold Completed
            </button>
          </div>
        )}
        
        {/* Session Progress (time-based across entire session) */}
        <div className="border-t border-deep-700 pt-3">
          <div className="text-xs text-deep-500 mb-2">Session Progress</div>
          {(() => {
            const totalDuration = sessionPhases.reduce((sum, p) => sum + (p.duration > 0 ? p.duration : 0), 0);
            const completedDuration = sessionPhases
              .slice(0, currentPhase)
              .reduce((sum, p) => sum + (p.duration > 0 ? p.duration : 0), 0);
            const currentContribution = currentPhaseData.duration > 0 ? Math.min(phaseTime, currentPhaseData.duration) : 0;
            const elapsed = completedDuration + currentContribution;
            const percentTime = totalDuration > 0 
              ? Math.min(100, Math.round((elapsed / totalDuration) * 100))
              : Math.round(((currentPhase + (currentPhaseData.duration > 0 ? (phaseTime / currentPhaseData.duration) : 0)) / sessionPhases.length) * 100);
            return (
              <>
                <div className="w-full bg-deep-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-ocean-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentTime}%` }}
                  ></div>
                </div>
                <div className="text-xs text-deep-400">{percentTime}% complete</div>
              </>
            );
          })()}
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
  );
};

export default PhaseDisplay; 