import React, { useState } from 'react';
import { Calendar, Clock, Edit3, Save, X, CheckCircle, Circle, Eye } from 'lucide-react';
import { formatTime } from '../utils/trainingLogic';
import { getPhaseIcon } from '../utils/phaseUtils';
import { parseSessionPhases } from '../utils/sessionParsers';
import { SESSION_TEMPLATES } from '../config/sessionTemplates';
import { Session, Phase } from '../types';

interface SessionCardProps {
  session: Session;
  onUpdate: (date: string, updatedSession: Session) => void;
  onToggleComplete: (date: string) => void;
  currentMaxHold: number | null;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onUpdate, onToggleComplete, currentMaxHold }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [editedNotes, setEditedNotes] = useState<string>(session.notes || '');
  const [editedMaxHold, setEditedMaxHold] = useState<string | number>(session.actualMaxHold || '');

  const handleSave = () => {
    onUpdate(session.date, {
      ...session,
      notes: editedNotes,
      actualMaxHold: editedMaxHold ? parseInt(String(editedMaxHold)) : null
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNotes(session.notes || '');
    setEditedMaxHold(session.actualMaxHold || '');
    setIsEditing(false);
  };

  const getFocusColor = (focus: string): string => {
    const colors: Record<string, string> = {
      'CO₂ Tolerance': 'border-red-500 bg-red-900/20',
      'Breath Control': 'border-blue-500 bg-blue-900/20',
      'O₂ Tolerance': 'border-green-500 bg-green-900/20',
      'Mental + Technique': 'border-purple-500 bg-purple-900/20',
      'Advanced CO₂ Table': 'border-orange-500 bg-orange-900/20',
      'Max Breath-Hold': 'border-yellow-500 bg-yellow-900/20',
      'Recovery & Flexibility': 'border-teal-500 bg-teal-900/20'
    };
    return colors[focus] || 'border-deep-600 bg-deep-800';
  };

  return (
    <div className={`session-card ${getFocusColor(session.focus)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-deep-400" />
          <span className="font-medium">{session.day}</span>
          <span className="text-deep-400">•</span>
          <span className="text-sm text-deep-400">{session.date}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(true)}
            className="p-1 hover:bg-deep-700 rounded"
            title="View session details"
          >
            <Eye className="w-4 h-4 text-deep-400" />
          </button>

          <button
            onClick={() => onToggleComplete(session.date)}
            className="p-1 hover:bg-deep-700 rounded"
          >
            {session.completed ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Circle className="w-5 h-5 text-deep-500" />
            )}
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 hover:bg-deep-700 rounded"
          >
            <Edit3 className="w-4 h-4 text-deep-400" />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold text-lg mb-1">{session.focus}</h3>
        <p className="text-sm text-deep-300 mb-2">{session.sessionType}</p>
        <p className="text-sm text-deep-400 leading-relaxed">{session.details}</p>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-deep-300 mb-1">
              Max Hold Time (seconds)
            </label>
            <input
              type="number"
              value={editedMaxHold}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedMaxHold(e.target.value)}
              className="input-field w-full"
              placeholder="Enter max hold time in seconds"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-deep-300 mb-1">
              Session Notes
            </label>
            <textarea
              value={editedNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedNotes(e.target.value)}
              className="input-field w-full h-20 resize-none"
              placeholder="How did the session go? Any observations?"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {session.actualMaxHold && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-ocean-400" />
              <span className="text-ocean-400 font-mono">
                Max Hold: {formatTime(session.actualMaxHold)}
              </span>
            </div>
          )}

          {session.notes && (
            <div className="text-sm text-deep-300 bg-deep-800/50 p-2 rounded">
              {session.notes}
            </div>
          )}
        </div>
      )}

      {/* Session Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-deep-900 border border-deep-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {session.focus} - Complete Session Plan
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-1 hover:bg-deep-700 rounded"
                >
                  <X className="w-5 h-5 text-deep-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-deep-300 mb-4">
                  <p><strong>Session Type:</strong> {session.sessionType}</p>
                  <p><strong>Details:</strong> {session.details}</p>
                  {currentMaxHold && (
                    <p><strong>Based on Max Hold:</strong> {formatTime(currentMaxHold)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-white mb-3">Session Phases:</h3>
                  {parseSessionPhases(session.focus, SESSION_TEMPLATES[session.focus] || {}, currentMaxHold || 240).map((phase: Phase, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-deep-800/50 rounded-lg">
                      <span className="text-lg">{getPhaseIcon(phase.type)}</span>
                      <div className="flex-1">
                        <div className="text-white font-medium">{phase.description}</div>
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
                        parseSessionPhases(session.focus, SESSION_TEMPLATES[session.focus] || {}, currentMaxHold || 240)
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
    </div>
  );
};

export default SessionCard;
