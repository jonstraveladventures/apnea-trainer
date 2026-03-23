import React, { useState } from 'react';
import { Calendar, Eye } from 'lucide-react';
import dayjs from 'dayjs';
import { getAllSessionTypes } from '../config/sessionTemplates';
import { exerciseInstructions } from '../utils/exerciseInstructions';
import { Session, ExerciseInstruction, CustomSessions } from '../types';
import ExerciseInstructionsModal from './modals/ExerciseInstructionsModal';
import SessionDetailsModal from './modals/SessionDetailsModal';
import CustomSessionTypeModal from './modals/CustomSessionTypeModal';

interface WeekPlanProps {
  sessions: Session[];
  onSessionUpdate: (date: string, updatedSession: Session) => void;
  onAddCustomSession: (phaseType: string) => void;
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
      default: return 'bg-white dark:bg-deep-800 border-gray-200 dark:border-deep-700';
    }
  };

  const weekDays = getNext7Days();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
                  : 'bg-white dark:bg-deep-800 border-gray-200 dark:border-deep-700'
              }`}
            >
              {/* Day Header */}
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 dark:text-deep-400 font-medium">{day.dayName}</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{day.dayNumber}</div>
                <div className="text-sm text-gray-400 dark:text-deep-500">{day.month}</div>
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
                        className="w-full bg-transparent border border-gray-300 dark:border-deep-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-deep-700 focus:bg-gray-100 dark:focus:bg-deep-700 focus:outline-none focus:border-ocean-500"
                      >
                        {sessionTypes.map((type) => (
                          <option key={type} value={type} className="bg-white dark:bg-deep-800">
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
                        : 'text-gray-400 dark:text-deep-400 hover:text-gray-500 dark:hover:text-deep-300 bg-gray-100 dark:bg-deep-700/50 hover:bg-gray-200 dark:hover:bg-deep-600/50'
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
                  <div className="text-base font-semibold text-gray-900 dark:text-white mb-3">Choose Session Type:</div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {sessionTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSessionTypeChange(day.date, type)}
                        className={`w-full p-3 rounded-lg text-left text-sm flex items-center gap-3 transition-colors ${
                          session?.focus === type
                            ? 'bg-ocean-600 text-white'
                            : 'bg-gray-100 dark:bg-deep-700 text-gray-500 dark:text-deep-300 hover:bg-gray-200 dark:hover:bg-deep-600'
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
                <div className="text-center p-4 text-gray-400 dark:text-deep-400 min-h-[180px] flex flex-col justify-center">
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
                  : 'bg-white dark:bg-deep-800 border-gray-200 dark:border-deep-700'
              }`}
            >
              {/* Day Header */}
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 dark:text-deep-400 font-medium">{day.dayName}</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{day.dayNumber}</div>
                <div className="text-sm text-gray-400 dark:text-deep-500">{day.month}</div>
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
                        className="w-full bg-transparent border border-gray-300 dark:border-deep-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-deep-700 focus:bg-gray-100 dark:focus:bg-deep-700 focus:outline-none focus:border-ocean-500"
                      >
                        {sessionTypes.map((type) => (
                          <option key={type} value={type} className="bg-white dark:bg-deep-800">
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
                        : 'text-gray-400 dark:text-deep-400 hover:text-gray-500 dark:hover:text-deep-300 bg-gray-100 dark:bg-deep-700/50 hover:bg-gray-200 dark:hover:bg-deep-600/50'
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
                  <div className="text-base font-semibold text-gray-900 dark:text-white mb-3">Choose Session Type:</div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {sessionTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSessionTypeChange(day.date, type)}
                        className={`w-full p-3 rounded-lg text-left text-sm flex items-center gap-3 transition-colors ${
                          session?.focus === type
                            ? 'bg-ocean-600 text-white'
                            : 'bg-gray-100 dark:bg-deep-700 text-gray-500 dark:text-deep-300 hover:bg-gray-200 dark:hover:bg-deep-600'
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
                <div className="text-center p-4 text-gray-400 dark:text-deep-400 min-h-[180px] flex flex-col justify-center">
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

      {/* Modals */}
      <CustomSessionTypeModal
        isOpen={showCustomSessionModal}
        onClose={() => setShowCustomSessionModal(false)}
        onSave={(sessionData) => {
          onAddCustomSession(sessionData);
          setShowCustomSessionModal(false);
        }}
        currentMaxHold={currentMaxHold}
      />

      <SessionDetailsModal
        session={showSessionDetails}
        onClose={() => setShowSessionDetails(null)}
        currentMaxHold={currentMaxHold}
        onShowInstructions={showExerciseInstructions}
      />

      <ExerciseInstructionsModal
        isOpen={showInstructions}
        instruction={currentInstruction}
        onClose={() => setShowInstructions(false)}
      />
    </div>
  );
};

export default WeekPlan;
