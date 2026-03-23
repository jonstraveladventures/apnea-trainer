import React from 'react';
import { SESSION_CATEGORIES } from '../config/sessionTemplates';
import { CustomSessions, Session } from '../types';

interface SessionSelectorProps {
  selectedSessionType: string;
  onSessionTypeChange: (value: string) => void;
  hasUserChangedSession: boolean;
  todaySession: Session | null | undefined;
  isSessionActive: boolean;
  customSessions?: CustomSessions;
}

const SessionSelector: React.FC<SessionSelectorProps> = ({
  selectedSessionType,
  onSessionTypeChange,
  hasUserChangedSession,
  todaySession,
  isSessionActive,
  customSessions = {}
}) => {
  return (
    <div className="mb-6">
      <label htmlFor="session-type-select" className="sr-only">Select session type</label>
      <select
        id="session-type-select"
        value={selectedSessionType}
        onChange={(e) => onSessionTypeChange(e.target.value)}
        className="w-full bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
        disabled={isSessionActive}
        aria-label="Select session type"
        aria-disabled={isSessionActive}
      >
        {Object.entries(SESSION_CATEGORIES).map(([category, sessionTypes]) => (
          <optgroup key={category} label={category}>
            {sessionTypes.map(sessionType => (
              <option key={sessionType} value={sessionType}>
                {sessionType}
              </option>
            ))}
          </optgroup>
        ))}
        {Object.keys(customSessions).length > 0 && (
          <optgroup label="🎯 Custom Sessions">
            {Object.keys(customSessions).map(sessionName => (
              <option key={sessionName} value={sessionName}>
                {sessionName}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {hasUserChangedSession && todaySession?.focus && selectedSessionType !== todaySession.focus && (
        <div className="text-xs text-gray-400 dark:text-deep-400 mt-1">
          📅 Today's scheduled session: <span className="text-ocean-400">{todaySession.focus}</span>
        </div>
      )}
    </div>
  );
};

export default SessionSelector;
