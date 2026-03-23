import React from 'react';
import { Award } from 'lucide-react';
import { Session } from '../../types';
import { formatTime } from '../../utils/trainingLogic';

interface PersonalRecordsProps {
  sessions: Session[];
}

const PersonalRecords: React.FC<PersonalRecordsProps> = ({ sessions }) => {
  const completedSessions = sessions.filter(s => s.completed);
  const maxHoldSessions = sessions.filter(s => s.actualMaxHold && s.actualMaxHold > 0);

  const bestSession = maxHoldSessions.length > 0
    ? maxHoldSessions.reduce((best, s) =>
        (s.actualMaxHold! > (best.actualMaxHold || 0)) ? s : best
      , maxHoldSessions[0])
    : null;

  const totalTrainingTime = sessions.reduce((sum, s) => sum + (s.sessionTime || 0), 0);

  const records = [
    {
      label: 'Best Max Hold',
      value: bestSession ? formatTime(bestSession.actualMaxHold!) : 'N/A',
      detail: bestSession ? `on ${new Date(bestSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No holds recorded',
    },
    {
      label: 'Total Training Time',
      value: totalTrainingTime > 3600
        ? `${Math.floor(totalTrainingTime / 3600)}h ${Math.floor((totalTrainingTime % 3600) / 60)}m`
        : `${Math.floor(totalTrainingTime / 60)}m`,
      detail: `across ${completedSessions.length} sessions`,
    },
    {
      label: 'Sessions Completed',
      value: completedSessions.length.toString(),
      detail: `of ${sessions.length} total`,
    },
  ];

  return (
    <div className="bg-white dark:bg-deep-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-ocean-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Personal Records</h3>
      </div>
      <div className="space-y-4">
        {records.map((record) => (
          <div key={record.label} className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-deep-400">{record.label}</div>
              <div className="text-xs text-gray-400 dark:text-deep-500">{record.detail}</div>
            </div>
            <div className="text-lg font-bold text-ocean-400">{record.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalRecords;
