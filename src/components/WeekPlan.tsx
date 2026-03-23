import React, { useState } from 'react';
import { Calendar, Edit3, Plus, Save, X, Eye } from 'lucide-react';
import dayjs from 'dayjs';
import { formatTime } from '../utils/trainingLogic';
import { getAllSessionTypes, SESSION_TEMPLATES } from '../config/sessionTemplates';
import { getPhaseIcon, getExerciseTypeFromPhase } from '../utils/phaseUtils';
import { exerciseInstructions } from '../utils/exerciseInstructions';
import { parseSessionPhases } from '../utils/sessionParsers';
import { Session, Phase, ExerciseInstruction, CustomSessions } from '../types';

interface WeekPlanProps {
  sessions: Session[];
  onSessionUpdate: (date: string, updatedSession: Session) => void;
  onAddCustomSession: (sessionData: any) => void;
  onToggleComplete: (date: string) => void;
  currentMaxHold: number | null;
  customSessions: CustomSessions;
}

interface DayInfo {
  date: string;
  dayName: string;
  dayNumber: string;
  month: string;
}

const WeekPlan: React.FC<WeekPlanProps> = ({ sessions, onSessionUpdate, onAddCustomSession, onToggleComplete, currentMaxHold, customSessions }) => {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [showCustomSessionModal, setShowCustomSessionModal] = useState<boolean>(false);
  const [showSessionDetails, setShowSessionDetails] = useState<Session | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [currentInstruction, setCurrentInstruction] = useState<ExerciseInstruction | null>(null);
  const [customSessionName, setCustomSessionName] = useState<string>('');
  const [customSessionDescription, setCustomSessionDescription] = useState<string>('');
  const [customSessionType, setCustomSessionType] = useState<string>('custom');
  const [customSessionConfig, setCustomSessionConfig] = useState<any>({
    warmupHolds: 0,
    warmupDuration: 0,
    restDuration: 0,
    holdCount: 1,
    holdStartDuration: 60,
    holdIncrease: 0,
    holdRestDuration: 60,
    cooldownDuration: 180
  });
  const [customSessionBase, setCustomSessionBase] = useState<string>('');

  const sessionTypes = getAllSessionTypes();

  // Get next 7 days
  const getNext7Days = (): DayInfo[] => {
    const days: DayInfo[] = [];
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

  const getSessionForDate = (date: string): Session | undefined => {
    return sessions.find(s => s.date === date);
  };

  const handleSessionTypeChange = (date: string, newType: string) => {
    const existingSession = getSessionForDate(date);
    const updatedSession = {
      ...existingSession,
      focus: newType,
      sessionType: newType,
      date: date
    } as Session;
    onSessionUpdate(date, updatedSession);
    setEditingDay(null);
  };

  const calculateSessionDuration = (): number => {
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

  const showExerciseInstructions = (exerciseType: string) => {
    setCurrentInstruction(exerciseInstructions[exerciseType]);
    setShowInstructions(true);
  };

  const handleToggleComplete = (date: string) => {
    if (onToggleComplete) {
      onToggleComplete(date);
    }
  };

  const getSessionIcon = (type: string): string => {
    switch (type) {
      case 'Comfortable CO₂ Training': return '\u{1F60C}';
      case 'Breath Control': return '\u{1FAC1}';
      case 'O₂ Tolerance': return '\u{1FAC1}';
      case 'Mental + Technique': return '\u{1F9D8}';
      case 'Advanced CO₂ Table': return '\u{1F4CA}';
      case 'Max Breath-Hold': return '\u{26A1}';

      case 'Recovery & Flexibility': return '\u{1F9D8}\u{200D}\u{2640}\u{FE0F}';
      case 'Traditional CO₂ Tables': return '\u{1FAC1}';
      default: return '\u{23F1}\u{FE0F}';
    }
  };

  const getSessionColor = (type: string): string => {
    switch (type) {
      case 'Comfortable CO₂ Training': return 'bg-indigo-900/30 border-indigo-700';
      case 'Breath Control': return 'bg-green-900/30 border-green-700';
      case 'O₂ Tolerance': return 'bg-purple-900/30 border-purple-700';
      case 'Mental + Technique': return 'bg-yellow-900/30 border-yellow-700';
      case 'Advanced CO₂ Table': return 'bg-red-900/30 border-red-700';
      case 'Max Breath-Hold': return 'bg-orange-900/30 border-orange-700';

      case 'Recovery & Flexibility': return 'bg-teal-900/30 border-teal-700';
      case 'Traditional CO₂ Tables': return 'bg-blue-900/30 border-blue-700';
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
                      <select
                        value={session.focus}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSessionTypeChange(day.date, e.target.value)}
                        className="w-full bg-transparent border border-deep-600 rounded px-2 py-1 text-sm text-white font-semibold hover:bg-deep-700 focus:bg-deep-700 focus:outline-none focus:border-ocean-500"
                      >
                        {sessionTypes.map((type) => (
                          <option key={type} value={type} className="bg-deep-800">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleComplete(day.date)}
                    className={`text-sm font-medium mb-3 flex items-center gap-1 w-full justify-center py-2 rounded transition-colors ${
                      session.completed
                        ? 'text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/30'
                        : 'text-deep-400 hover:text-deep-300 bg-deep-700/50 hover:bg-deep-600/50'
                    }`}
                  >
                    <span className="text-lg">{session.completed ? '\u2713' : '\u25CB'}</span>
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
                      <select
                        value={session.focus}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSessionTypeChange(day.date, e.target.value)}
                        className="w-full bg-transparent border border-deep-600 rounded px-2 py-1 text-sm text-white font-semibold hover:bg-deep-700 focus:bg-deep-700 focus:outline-none focus:border-ocean-500"
                      >
                        {sessionTypes.map((type) => (
                          <option key={type} value={type} className="bg-deep-800">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleComplete(day.date)}
                    className={`text-sm font-medium mb-3 flex items-center gap-1 w-full justify-center py-2 rounded transition-colors ${
                      session.completed
                        ? 'text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/30'
                        : 'text-deep-400 hover:text-deep-300 bg-deep-700/50 hover:bg-deep-600/50'
                    }`}
                  >
                    <span className="text-lg">{session.completed ? '\u2713' : '\u25CB'}</span>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomSessionName(e.target.value)}
                    className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                    placeholder="e.g., Custom CO₂ Table"
                  />
                </div>
                <div>
                  <label className="text-sm text-deep-300">Session Type:</label>
                  <select
                    value={customSessionType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setCustomSessionType(e.target.value);
                      if (e.target.value !== 'custom') {
                        const template: Record<string, any> = {
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
                            holdStartDuration: Math.round((currentMaxHold || 240) * 0.6),
                            holdIncrease: 10,
                            restDuration: Math.round((currentMaxHold || 240) * 1.5)
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
                            holdStartDuration: Math.round((currentMaxHold || 240) * 0.4),
                            holdIncrease: Math.round((currentMaxHold || 240) * 0.08),
                            restDuration: Math.round((currentMaxHold || 240) * 0.4)
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
                    <option value="Comfortable CO₂ Training">Comfortable CO₂ Training</option>
                    <option value="Breath Control">Breath Control</option>
                    <option value="O₂ Tolerance">O₂ Tolerance</option>
                    <option value="Mental + Technique">Mental + Technique</option>
                    <option value="Advanced CO₂ Table">Advanced CO₂ Table</option>
                    <option value="Max Breath-Hold">Max Breath-Hold</option>
                    <option value="Recovery & Flexibility">Recovery & Flexibility</option>
                    <option value="Traditional CO₂ Tables">Traditional CO₂ Tables</option>
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
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomSessionDescription(e.target.value)}
                  className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
                  placeholder="Describe the session structure..."
                  rows={2}
                />
              </div>

              {/* Session Structure */}
              <div className="bg-deep-900 rounded-lg p-4">
                <h4 className="text-md font-semibold text-white mb-3">Session Structure</h4>

                {/* Dynamic Field Rendering */}
                {(() => {
                  const renderField = (key: string, label: string, type: string = 'number', min: number = 0, max: number = 1000, step: number = 1): React.ReactNode => {
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
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomSessionConfig({
                            ...customSessionConfig,
                            [key]: type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value
                          })}
                          className="w-full bg-deep-700 border border-deep-600 rounded px-2 py-1 text-white text-sm"
                        />
                      </div>
                    );
                  };

                  const renderArrayField = (key: string, label: string): React.ReactNode => {
                    if (!Array.isArray(customSessionConfig[key])) return null;

                    return (
                      <div key={key} className="col-span-full">
                        <label className="text-xs text-deep-400">{label}:</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {customSessionConfig[key].map((value: number, index: number) => (
                            <div key={index} className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={value}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                                  const newArray = customSessionConfig[key].filter((_: any, i: number) => i !== index);
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
                            <span className="text-ocean-400">{'\u{1F525}'}</span>
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
                            <span className="text-ocean-400">{'\u26A1'}</span>
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
                            <span className="text-ocean-400">{'\u2744\uFE0F'}</span>
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
                  {parseSessionPhases(showSessionDetails.focus, SESSION_TEMPLATES[showSessionDetails.focus] || {}, currentMaxHold || 240).map((phase: Phase, index: number) => (
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
                        parseSessionPhases(showSessionDetails.focus, SESSION_TEMPLATES[showSessionDetails.focus] || {}, currentMaxHold || 240)
                          .reduce((total: number, phase: Phase) => total + phase.duration, 0)
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
  );
};

export default WeekPlan;
