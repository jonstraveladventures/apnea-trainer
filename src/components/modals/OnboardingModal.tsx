import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, Brain, Wind, Waves, Dumbbell, Target } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (maxHold: number, focus: string) => void;
}

const SESSION_TYPES = [
  {
    id: 'Comfortable CO₂',
    label: 'Comfortable CO\u2082',
    icon: Wind,
    description: 'Gentle breath-hold intervals with comfortable rest periods',
  },
  {
    id: 'CO₂ Tolerance',
    label: 'Traditional CO\u2082',
    icon: Waves,
    description: 'Progressive CO\u2082 table with decreasing rest times',
  },
  {
    id: 'O₂ Tolerance',
    label: 'O\u2082 Tolerance',
    icon: Target,
    description: 'Increasing hold durations with fixed rest periods',
  },
  {
    id: 'Breath Control',
    label: 'Breath Control',
    icon: Dumbbell,
    description: 'Diaphragmatic, box breathing, and nasal exercises',
  },
  {
    id: 'Mental + Technique',
    label: 'Mental + Technique',
    icon: Brain,
    description: 'Visualization, mindfulness, and relaxation drills',
  },
  {
    id: 'Maximal Breath-Hold Training',
    label: 'Max Breath-Hold',
    icon: Clock,
    description: 'Work toward your personal best with structured attempts',
  },
];

const PRESETS = [
  { label: '2 min (120s)', value: 120 },
  { label: '3 min (180s)', value: 180 },
  { label: '4 min (240s)', value: 240 },
];

function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps): React.ReactElement | null {
  const [step, setStep] = useState(1);
  const [maxHold, setMaxHold] = useState('');
  const [selectedFocus, setSelectedFocus] = useState('');

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleComplete = () => {
    const seconds = parseInt(maxHold) || 240;
    onComplete(seconds, selectedFocus || 'Comfortable CO₂');
  };

  const canProceedFromStep3 = maxHold !== '' && parseInt(maxHold) >= 30;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-deep-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Content area */}
        <div className="p-6 sm:p-8">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="text-6xl" role="img" aria-label="Dolphin">
                🐬
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome to Apnea Trainer
                </h2>
                <p className="mt-2 text-gray-500 dark:text-deep-400">
                  Evidence-based breath-hold training for freedivers
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white
                  bg-ocean-500 hover:bg-ocean-600
                  dark:bg-ocean-600 dark:hover:bg-ocean-500
                  transition-colors"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Step 2: About */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  What is Apnea Training?
                </h2>
                <div className="mt-4 space-y-3 text-gray-600 dark:text-deep-300 text-sm leading-relaxed">
                  <p>
                    Apnea training builds your body's tolerance to CO&#8322; and
                    improves breath-hold performance through structured tables
                    and exercises. Sessions progress gradually so you can track
                    improvement over time.
                  </p>
                  <p>
                    This app generates personalised training plans based on your
                    current max hold and lets you follow guided sessions with a
                    built-in timer.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Safety first.</strong> Always train with a buddy.
                  Never practice breath-holds in water without supervision.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 py-2.5 px-4 rounded-xl font-medium
                    text-gray-600 dark:text-deep-300
                    bg-gray-100 dark:bg-deep-700 hover:bg-gray-200 dark:hover:bg-deep-600
                    transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 px-6 rounded-xl font-semibold text-white
                    bg-ocean-500 hover:bg-ocean-600
                    dark:bg-ocean-600 dark:hover:bg-ocean-500
                    transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Set Max Hold */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Set Your Max Breath Hold
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-deep-400">
                  Enter the longest comfortable breath-hold you have done on
                  dry land. Training sessions will be scaled from this value.
                </p>
              </div>

              <div>
                <label
                  htmlFor="onboarding-max-hold"
                  className="block text-sm font-medium text-gray-700 dark:text-deep-300 mb-2"
                >
                  Max breath hold (seconds)
                </label>
                <input
                  id="onboarding-max-hold"
                  type="number"
                  value={maxHold}
                  onChange={(e) => setMaxHold(e.target.value)}
                  placeholder="e.g. 180"
                  min={30}
                  max={600}
                  className="w-full bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600
                    rounded-xl px-4 py-3 text-gray-900 dark:text-white text-lg
                    focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none
                    transition-colors"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-deep-500">
                  Accepted range: 30 -- 600 seconds
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-deep-400 mb-2">
                  Quick presets
                </p>
                <div className="flex gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setMaxHold(String(p.value))}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                        ${
                          maxHold === String(p.value)
                            ? 'bg-ocean-500 text-white dark:bg-ocean-600'
                            : 'bg-gray-100 dark:bg-deep-700 text-gray-600 dark:text-deep-300 hover:bg-gray-200 dark:hover:bg-deep-600'
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 py-2.5 px-4 rounded-xl font-medium
                    text-gray-600 dark:text-deep-300
                    bg-gray-100 dark:bg-deep-700 hover:bg-gray-200 dark:hover:bg-deep-600
                    transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!canProceedFromStep3}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 px-6 rounded-xl font-semibold text-white
                    bg-ocean-500 hover:bg-ocean-600
                    dark:bg-ocean-600 dark:hover:bg-ocean-500
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Choose Focus */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Choose Your Focus
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-deep-400">
                  Pick a session type to start with. You can always change this
                  later.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {SESSION_TYPES.map((st) => {
                  const Icon = st.icon;
                  const isSelected = selectedFocus === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedFocus(st.id)}
                      className={`text-left p-3 rounded-xl border-2 transition-all
                        ${
                          isSelected
                            ? 'border-ocean-500 bg-ocean-50 dark:bg-ocean-900/20 dark:border-ocean-400'
                            : 'border-gray-200 dark:border-deep-600 bg-white dark:bg-deep-700 hover:border-gray-300 dark:hover:border-deep-500'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className={`w-4 h-4 ${
                            isSelected
                              ? 'text-ocean-500 dark:text-ocean-400'
                              : 'text-gray-400 dark:text-deep-400'
                          }`}
                        />
                        <span
                          className={`text-sm font-semibold ${
                            isSelected
                              ? 'text-ocean-700 dark:text-ocean-300'
                              : 'text-gray-800 dark:text-white'
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-deep-400 leading-snug">
                        {st.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1 py-2.5 px-4 rounded-xl font-medium
                    text-gray-600 dark:text-deep-300
                    bg-gray-100 dark:bg-deep-700 hover:bg-gray-200 dark:hover:bg-deep-600
                    transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!selectedFocus}
                  className="flex-1 py-2.5 px-6 rounded-xl font-semibold text-white
                    bg-ocean-500 hover:bg-ocean-600
                    dark:bg-ocean-600 dark:hover:bg-ocean-500
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 pb-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              className={`inline-block w-2 h-2 rounded-full transition-colors ${
                i + 1 === step
                  ? 'bg-ocean-500 dark:bg-ocean-400'
                  : i + 1 < step
                  ? 'bg-ocean-300 dark:bg-ocean-700'
                  : 'bg-gray-300 dark:bg-deep-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
