import React from 'react';
import { SESSION_CATEGORIES } from '../config/sessionTemplates';

const SessionSelector = ({ 
  selectedSessionType, 
  onSessionTypeChange, 
  hasUserChangedSession, 
  todaySession, 
  isSessionActive,
  customSessions = {}
}) => {
  return (
    <div className="mb-6">
      <select
        value={selectedSessionType}
        onChange={(e) => onSessionTypeChange(e.target.value)}
        className="w-full bg-deep-700 border border-deep-600 rounded px-3 py-2 text-white"
        disabled={isSessionActive}
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
        <div className="text-xs text-deep-400 mt-1">
          📅 Today's scheduled session: <span className="text-ocean-400">{todaySession.focus}</span>
        </div>
      )}
    </div>
  );
};

export default SessionSelector; 