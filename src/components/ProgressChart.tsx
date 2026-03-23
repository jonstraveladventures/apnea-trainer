import React from 'react';
import { TrendingUp, Calendar, Download, FileText } from 'lucide-react';
import { formatTime } from '../utils/trainingLogic';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { Session } from '../types';
import StreakCounter from './progress/StreakCounter';
import PersonalRecords from './progress/PersonalRecords';
import MaxHoldTrendChart from './progress/MaxHoldTrendChart';
import VolumeBreakdown from './progress/VolumeBreakdown';

interface ProgressChartProps {
  sessions: Session[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ sessions }) => {
  const completedSessions = sessions.filter(s => s.completed);
  const maxHoldSessions = sessions.filter(s => s.actualMaxHold && s.actualMaxHold > 0);

  const progress = sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0;

  const getMaxHold = (): number => {
    if (maxHoldSessions.length === 0) return 0;
    return Math.max(...maxHoldSessions.map(s => s.actualMaxHold as number));
  };

  return (
    <div className="card">
      {/* Header with export buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-ocean-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Training Progress</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(sessions)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
              bg-gray-100 dark:bg-deep-700 text-gray-600 dark:text-deep-300
              hover:bg-gray-200 dark:hover:bg-deep-600 transition-colors"
            title="Export as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={() => exportToPDF(sessions)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
              bg-gray-100 dark:bg-deep-700 text-gray-600 dark:text-deep-300
              hover:bg-gray-200 dark:hover:bg-deep-600 transition-colors"
            title="Export as PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Stats Row: Completion Rate, Best Max Hold, Streak */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Completion Progress */}
        <div className="text-center">
          <div className="text-3xl font-bold text-ocean-400 mb-2">
            {Math.round(progress)}%
          </div>
          <div className="text-sm text-gray-400 dark:text-deep-400 mb-3">Completion Rate</div>
          <div className="w-full bg-gray-200 dark:bg-deep-700 rounded-full h-2">
            <div
              className="bg-ocean-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 dark:text-deep-500 mt-2">
            {completedSessions.length} of {sessions.length} sessions
          </div>
        </div>

        {/* Best Max Hold */}
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {formatTime(getMaxHold())}
          </div>
          <div className="text-sm text-gray-400 dark:text-deep-400 mb-1">Best Max Hold</div>
          <div className="text-xs text-gray-400 dark:text-deep-500">
            {maxHoldSessions.length} recorded sessions
          </div>
        </div>

        {/* Streak Counter */}
        <StreakCounter sessions={sessions} />
      </div>

      {/* Max Hold Trend Chart (full width) */}
      <div className="mb-6">
        <MaxHoldTrendChart sessions={sessions} />
      </div>

      {/* Personal Records + Volume Breakdown (2 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PersonalRecords sessions={sessions} />
        <VolumeBreakdown sessions={sessions} />
      </div>

      {/* Focus Area Distribution (existing) */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-deep-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Focus Area Distribution</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries({
            'CO\u2082 Tolerance': completedSessions.filter(s => s.focus === 'CO\u2082 Tolerance').length,
            'Breath Control': completedSessions.filter(s => s.focus === 'Breath Control').length,
            'O\u2082 Tolerance': completedSessions.filter(s => s.focus === 'O\u2082 Tolerance').length,
            'Mental + Technique': completedSessions.filter(s => s.focus === 'Mental + Technique').length,
            'Advanced CO\u2082 Table': completedSessions.filter(s => s.focus === 'Advanced CO\u2082 Table').length,
            'Max Breath-Hold': completedSessions.filter(s => s.focus === 'Max Breath-Hold').length,
            'Recovery & Flexibility': completedSessions.filter(s => s.focus === 'Recovery & Flexibility').length
          }).map(([focus, count]) => (
            <div key={focus} className="bg-gray-50 dark:bg-deep-800 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-ocean-400">{count}</div>
              <div className="text-xs text-gray-400 dark:text-deep-400 leading-tight">{focus}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
