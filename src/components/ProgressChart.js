import React from 'react';
import { TrendingUp, Calendar, Clock } from 'lucide-react';
import { formatTime } from '../utils/trainingLogic';

const ProgressChart = ({ sessions }) => {
  const completedSessions = sessions.filter(s => s.completed);
  const maxHoldSessions = sessions.filter(s => s.actualMaxHold && s.actualMaxHold > 0);
  
  const progress = (completedSessions.length / sessions.length) * 100;
  
  const maxHoldData = maxHoldSessions
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-10); // Last 10 sessions

  const getMaxHold = () => {
    if (maxHoldSessions.length === 0) return 0;
    return Math.max(...maxHoldSessions.map(s => s.actualMaxHold));
  };

  const getAverageMaxHold = () => {
    if (maxHoldSessions.length === 0) return 0;
    const sum = maxHoldSessions.reduce((acc, s) => acc + s.actualMaxHold, 0);
    return Math.round(sum / maxHoldSessions.length);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-ocean-400" />
        <h2 className="text-xl font-bold">Training Progress</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Completion Progress */}
        <div className="text-center">
          <div className="text-3xl font-bold text-ocean-400 mb-2">
            {Math.round(progress)}%
          </div>
          <div className="text-sm text-deep-400 mb-3">Completion Rate</div>
          <div className="w-full bg-deep-700 rounded-full h-2">
            <div 
              className="bg-ocean-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-deep-500 mt-2">
            {completedSessions.length} of {sessions.length} sessions
          </div>
        </div>

        {/* Max Hold */}
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {formatTime(getMaxHold())}
          </div>
          <div className="text-sm text-deep-400 mb-1">Best Max Hold</div>
          <div className="text-xs text-deep-500">
            {maxHoldSessions.length} recorded sessions
          </div>
        </div>

        {/* Average Hold */}
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {formatTime(getAverageMaxHold())}
          </div>
          <div className="text-sm text-deep-400 mb-1">Average Max Hold</div>
          <div className="text-xs text-deep-500">
            Last {maxHoldSessions.length} sessions
          </div>
        </div>
      </div>

      {/* Max Hold Progress Chart */}
      {maxHoldData.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-deep-400" />
            <h3 className="font-semibold">Max Hold Progress (Last 10 Sessions)</h3>
          </div>
          
          <div className="relative h-32 bg-deep-800 rounded-lg p-4">
            <div className="flex items-end justify-between h-full">
              {maxHoldData.map((session, index) => {
                const maxHold = Math.max(...maxHoldData.map(s => s.actualMaxHold));
                const height = (session.actualMaxHold / maxHold) * 100;
                
                return (
                  <div key={session.date} className="flex flex-col items-center">
                    <div className="text-xs text-deep-500 mb-1">
                      {formatTime(session.actualMaxHold)}
                    </div>
                    <div 
                      className="w-4 bg-ocean-500 rounded-t transition-all duration-300 hover:bg-ocean-400"
                      style={{ height: `${height}%` }}
                      title={`${session.date}: ${formatTime(session.actualMaxHold)}`}
                    ></div>
                    <div className="text-xs text-deep-500 mt-1">
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Focus Distribution */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-deep-400" />
          <h3 className="font-semibold">Focus Area Distribution</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries({
            'CO₂ Tolerance': completedSessions.filter(s => s.focus === 'CO₂ Tolerance').length,
            'Breath Control': completedSessions.filter(s => s.focus === 'Breath Control').length,
            'O₂ Tolerance': completedSessions.filter(s => s.focus === 'O₂ Tolerance').length,
            'Mental + Technique': completedSessions.filter(s => s.focus === 'Mental + Technique').length,
            'Advanced CO₂ Table': completedSessions.filter(s => s.focus === 'Advanced CO₂ Table').length,
            'Max Breath-Hold': completedSessions.filter(s => s.focus === 'Max Breath-Hold').length,
            'Recovery & Flexibility': completedSessions.filter(s => s.focus === 'Recovery & Flexibility').length
          }).map(([focus, count]) => (
            <div key={focus} className="bg-deep-800 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-ocean-400">{count}</div>
              <div className="text-xs text-deep-400 leading-tight">{focus}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressChart; 