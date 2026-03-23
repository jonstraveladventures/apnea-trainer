import React, { useEffect, useRef, useState } from 'react';
import { formatTime } from '../utils/trainingLogic';
import { getPhaseIcon, getExerciseTypeFromPhase, getPhaseGuidance, getTimerColor } from '../utils/phaseUtils';
import { Phase } from '../types';

interface PhaseDisplayProps {
  currentPhase: number;
  sessionPhases: Phase[];
  phaseTime: number;
  isSessionActive: boolean;
  stretchConfirmed: boolean;
  onStretchConfirm: () => void;
  onMaxHoldComplete: () => void;
  onPhaseTimeAdjust?: (newTime: number) => void;
}

const PhaseDisplay: React.FC<PhaseDisplayProps> = ({
  currentPhase,
  sessionPhases,
  phaseTime,
  isSessionActive,
  stretchConfirmed,
  onStretchConfirm,
  onMaxHoldComplete,
  onPhaseTimeAdjust
}) => {
  // All hooks must be called at the top level, before any conditional returns
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lastPhaseTimeChangeMsRef = useRef<number>(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lastPhaseTimeRef = useRef<number>(phaseTime);
  const rafIdRef = useRef<number>(0);

  // Get current phase data safely
  const currentPhaseData = sessionPhases?.[currentPhase];
  const isBoxPhase = currentPhaseData?.type === 'box';

  // Box breathing animation effect
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

  // Mouse event listeners for dragging
  useEffect(() => {
    if (isDragging && currentPhaseData && onPhaseTimeAdjust) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = progressBarRef.current?.getBoundingClientRect();
        if (rect) {
          const clickX = e.clientX - rect.left;
          const progress = Math.max(0, Math.min(1, clickX / rect.width));
          const newTime = Math.round(progress * currentPhaseData.duration);
          onPhaseTimeAdjust(newTime);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, currentPhaseData, onPhaseTimeAdjust]);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !onPhaseTimeAdjust || !currentPhaseData) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = Math.round(progress * currentPhaseData.duration);

    onPhaseTimeAdjust(newTime);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressBarClick(e);
  };

  // Early return if no valid data
  if (!isSessionActive || !currentPhaseData) {
    return null;
  }

  // Box breathing calculations
  const boxCycleSeconds = 16; // 4s per side × 4 sides
  const elapsedSinceTickSec = Math.max(0, (nowMs - lastPhaseTimeChangeMsRef.current) / 1000);
  const smoothPhaseSeconds = isBoxPhase
    ? phaseTime + Math.min(1, elapsedSinceTickSec)
    : phaseTime;
  const boxT = smoothPhaseSeconds % boxCycleSeconds;
  const boxSegment = Math.floor(boxT / 4); // 0..3
  const boxSegProgress = (boxT % 4) / 4; // 0..1
  const boxSize = 120; // px (slightly smaller)

  return (
    <div className="mb-6 p-4 bg-deep-800 rounded-lg border border-deep-700">
      <div className="text-center">
        {/* Phase Timer - Prominently displayed at the top */}
        {currentPhaseData.duration > 0 && currentPhaseData.type !== 'stretch_confirmation' && (
          <div className="mb-6">
            {/* Primary time display */}
            <div className="text-4xl font-mono text-ocean-400 mb-1" role="timer" aria-live="polite">
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
                        } as React.CSSProperties}
                      />
                    </div>
                    <div className="text-sm text-blue-400 whitespace-nowrap">{rightLabel}</div>
                  </div>
                  <div className="text-xs text-deep-400">Follow the moving dot clockwise around the square</div>
                </div>
              );
            })()}
            {/* Interactive Phase Progress Bar */}
            <div
              ref={progressBarRef}
              className="w-full bg-deep-700 rounded-full h-3 mb-2 cursor-pointer relative group"
              onClick={handleProgressBarClick}
              onMouseDown={handleMouseDown}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              role="progressbar"
              aria-valuenow={phaseTime}
              aria-valuemin={0}
              aria-valuemax={currentPhaseData.duration}
              aria-label="Phase progress"
            >
              <div
                className="h-3 rounded-full transition-all duration-300 bg-ocean-400"
                style={{
                  width: `${(phaseTime / currentPhaseData.duration) * 100}%`,
                  minWidth: '0%',
                  maxWidth: '100%'
                }}
                title={`${phaseTime}s / ${currentPhaseData.duration}s = ${((phaseTime / currentPhaseData.duration) * 100).toFixed(1)}%`}
              ></div>
              {/* Hover indicator */}
              <div className="absolute inset-0 bg-transparent group-hover:bg-deep-600/20 rounded-full transition-colors duration-200"></div>
              {/* Drag indicator */}
              {isDragging && (
                <div className="absolute inset-0 bg-ocean-400/20 rounded-full"></div>
              )}
            </div>
            <div className="text-xs text-deep-400">
              {formatTime(phaseTime)} / {formatTime(currentPhaseData.duration)}
                       <span className="ml-2 text-ocean-400">(Click or drag to adjust)</span>
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
              aria-label="Confirm stretching complete"
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
              aria-label="Max hold complete"
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
