import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Session } from '../../types';

interface VolumeBreakdownProps {
  sessions: Session[];
}

const VolumeBreakdown: React.FC<VolumeBreakdownProps> = ({ sessions }) => {
  const getWeekLabel = (date: Date): string => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
    return startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWeekKey = (date: Date): string => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);
    return startOfWeek.toISOString().split('T')[0];
  };

  // Group completed sessions by week
  const completedSessions = sessions.filter(s => s.completed);
  const weekMap = new Map<string, { label: string; count: number }>();

  completedSessions.forEach(s => {
    const date = new Date(s.date);
    const key = getWeekKey(date);
    const existing = weekMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      weekMap.set(key, { label: getWeekLabel(date), count: 1 });
    }
  });

  // Sort by week key (date) and take last 8
  const weeks = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([, value]) => value);

  const maxCount = weeks.length > 0 ? Math.max(...weeks.map(w => w.count)) : 1;

  return (
    <div className="bg-white dark:bg-deep-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-ocean-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Volume</h3>
      </div>
      {weeks.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-400 dark:text-deep-500 text-sm">
          No completed sessions yet
        </div>
      ) : (
        <div className="space-y-3">
          {weeks.map((week) => (
            <div key={week.label} className="flex items-center gap-3">
              <div className="w-16 text-xs text-gray-500 dark:text-deep-400 text-right shrink-0">
                {week.label}
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-deep-700 rounded-full h-5 overflow-hidden">
                <div
                  className="bg-ocean-500 h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                  style={{ width: `${(week.count / maxCount) * 100}%`, minWidth: '24px' }}
                >
                  <span className="text-xs text-white font-medium">{week.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolumeBreakdown;
