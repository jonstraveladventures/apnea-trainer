import React from 'react';
import { Session } from '../../types';

interface StreakCounterProps {
  sessions: Session[];
}

const StreakCounter: React.FC<StreakCounterProps> = ({ sessions }) => {
  const calculateStreak = (): number => {
    const completedDates = new Set(
      sessions.filter(s => s.completed).map(s => s.date)
    );

    if (completedDates.size === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Walk backward from today
    const current = new Date(today);
    while (true) {
      const dateStr = current.toISOString().split('T')[0];
      if (completedDates.has(dateStr)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-orange-400 mb-2">
        {streak} <span className="text-2xl" role="img" aria-label="fire">🔥</span>
      </div>
      <div className="text-sm text-gray-400 dark:text-deep-400 mb-1">Day Streak</div>
      <div className="text-xs text-gray-400 dark:text-deep-500">
        {streak === 0 ? 'Complete today\'s session!' : `${streak} consecutive day${streak !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
};

export default StreakCounter;
