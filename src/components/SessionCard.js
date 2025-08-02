import React, { useState } from 'react';
import { Calendar, Clock, Edit3, Save, X, CheckCircle, Circle, Eye } from 'lucide-react';
import { formatTime } from '../utils/trainingLogic';

const SessionCard = ({ session, onUpdate, onToggleComplete, currentMaxHold }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editedNotes, setEditedNotes] = useState(session.notes || '');
  const [editedMaxHold, setEditedMaxHold] = useState(session.actualMaxHold || '');

  const handleSave = () => {
    onUpdate(session.date, {
      ...session,
      notes: editedNotes,
      actualMaxHold: editedMaxHold ? parseInt(editedMaxHold) : null
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNotes(session.notes || '');
    setEditedMaxHold(session.actualMaxHold || '');
    setIsEditing(false);
  };

  const parseSessionPhases = (focus, maxHoldSeconds) => {
    const phases = [];
    
    const sessionTemplates = {
      'CO₂ Tolerance': {
        holdStartDuration: 90,
        holdIncrease: 30,
        restDuration: 120
      },
      'Breath Control': {
        boxBreathingDuration: 60,
        visualizationDuration: 120,
        recoveryDuration: 60
      },
      'O₂ Tolerance': {
        holdStartDuration: 90,
        holdIncrease: 30,
        restDuration: 120
      },
      'Mental + Technique': {
        visualizationDuration: 180,
        breathingDuration: 120,
        recoveryDuration: 90
      },
      'Advanced CO₂ Table': {
        holdStartDuration: 60,
        holdIncrease: 15,
        restDuration: 90
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

    const template = sessionTemplates[focus];
    if (!template) return phases;

    switch (focus) {
      case 'CO₂ Tolerance':
        let currentHold = template.holdStartDuration;
        for (let i = 0; i < 8; i++) {
          phases.push({ 
            type: 'hold', 
            duration: currentHold, 
            description: `Hold ${i + 1} (${formatTime(currentHold)})` 
          });
          phases.push({ 
            type: 'rest', 
            duration: template.restDuration, 
            description: `Rest ${i + 1} (${formatTime(template.restDuration)})` 
          });
          currentHold += template.holdIncrease;
        }
        break;

      case 'Breath Control':
        phases.push({ 
          type: 'box', 
          duration: template.boxBreathingDuration, 
          description: `Box Breathing (${formatTime(template.boxBreathingDuration)})` 
        });
        phases.push({ 
          type: 'visualization', 
          duration: template.visualizationDuration, 
          description: `Visualization (${formatTime(template.visualizationDuration)})` 
        });
        phases.push({ 
          type: 'recovery', 
          duration: template.recoveryDuration, 
          description: `Recovery (${formatTime(template.recoveryDuration)})` 
        });
        break;

      case 'O₂ Tolerance':
        let o2CurrentHold = template.holdStartDuration;
        for (let i = 0; i < 6; i++) {
          phases.push({ 
            type: 'hold', 
            duration: o2CurrentHold, 
            description: `Hold ${i + 1} (${formatTime(o2CurrentHold)})` 
          });
          phases.push({ 
            type: 'rest', 
            duration: template.restDuration, 
            description: `Rest ${i + 1} (${formatTime(template.restDuration)})` 
          });
          o2CurrentHold += template.holdIncrease;
        }
        break;

      case 'Mental + Technique':
        phases.push({ 
          type: 'visualization', 
          duration: template.visualizationDuration, 
          description: `Visualization (${formatTime(template.visualizationDuration)})` 
        });
        phases.push({ 
          type: 'breathing', 
          duration: template.breathingDuration, 
          description: `Breathing Exercise (${formatTime(template.breathingDuration)})` 
        });
        phases.push({ 
          type: 'recovery', 
          duration: template.recoveryDuration, 
          description: `Recovery (${formatTime(template.recoveryDuration)})` 
        });
        break;

      case 'Advanced CO₂ Table':
        let advancedCurrentHold = template.holdStartDuration;
        for (let i = 0; i < 10; i++) {
          phases.push({ 
            type: 'hold', 
            duration: advancedCurrentHold, 
            description: `Hold ${i + 1} (${formatTime(advancedCurrentHold)})` 
          });
          phases.push({ 
            type: 'rest', 
            duration: template.restDuration, 
            description: `Rest ${i + 1} (${formatTime(template.restDuration)})` 
          });
          advancedCurrentHold += template.holdIncrease;
        }
        break;

      case 'Max Breath-Hold':
        const tidalBreathingDuration = template.tidalBreathingDuration || 120;
        const maxHoldPercentages = template.maxHoldPercentages || [25, 35, 50, 65, 100, 100];

        if (template.stretchConfirmation) {
          phases.push({ type: 'stretch_confirmation', duration: 0, description: 'Stretch Confirmation' });
        }

        for (let i = 0; i < maxHoldPercentages.length; i++) {
          const percentage = maxHoldPercentages[i];
          const holdDuration = Math.round(maxHoldSeconds * (percentage / 100));

          phases.push({
            type: 'tidal_breathing',
            duration: tidalBreathingDuration,
            description: `Tidal Breathing (${formatTime(tidalBreathingDuration)})`,
            phaseIndex: i,
            isTidalBreathing: true
          });

          phases.push({
            type: percentage === 100 ? 'max_hold' : 'hold',
            duration: holdDuration,
            description: percentage === 100 ? 'Max Hold' : `${percentage}% of max`,
            phaseIndex: i,
            percentage: percentage,
            isMaxHold: percentage === 100
          });
        }
        
        // CO₂ Tolerance Training after max holds
        const co2ToleranceSets = template.co2ToleranceSets || 3;
        const co2ToleranceHoldDuration = template.co2ToleranceHoldDuration || 45;
        const co2ToleranceRestDuration = template.co2ToleranceRestDuration || 45;
        
        for (let i = 0; i < co2ToleranceSets; i++) {
          phases.push({ 
            type: 'hold', 
            duration: co2ToleranceHoldDuration, 
            description: `CO₂ Tolerance Hold ${i + 1}/${co2ToleranceSets}`,
            isCo2Tolerance: true
          });
          
          if (i < co2ToleranceSets - 1) {
            phases.push({ 
              type: 'rest', 
              duration: co2ToleranceRestDuration, 
              description: `CO₂ Tolerance Rest ${i + 1}/${co2ToleranceSets - 1}`,
              isCo2Tolerance: true
            });
          }
        }
        break;

      case 'Recovery & Flexibility':
        phases.push({ 
          type: 'warmup', 
          duration: template.warmupDuration, 
          description: `Warm-up (${formatTime(template.warmupDuration)})` 
        });
        phases.push({ 
          type: 'stretch', 
          duration: template.stretchDuration, 
          description: `Stretching (${formatTime(template.stretchDuration)})` 
        });
        phases.push({ 
          type: 'cooldown', 
          duration: template.cooldownDuration, 
          description: `Cool-down (${formatTime(template.cooldownDuration)})` 
        });
        break;
    }

    return phases;
  };

  const getPhaseIcon = (type) => {
    const icons = {
      'hold': '🫁',
      'rest': '😌',
      'breathing': '🫁',
      'box': '📦',
      'visualization': '🧘',
      'recovery': '🔄',
      'warmup': '🔥',
      'stretch': '🧘‍♀️',
      'cooldown': '❄️',
      'tidal_breathing': '🌊',
      'max_hold': '⚡',
      'stretch_confirmation': '✅'
    };
    return icons[type] || '⏱️';
  };

  const getFocusColor = (focus) => {
    const colors = {
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
              onChange={(e) => setEditedMaxHold(e.target.value)}
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
              onChange={(e) => setEditedNotes(e.target.value)}
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
                  {parseSessionPhases(session.focus, currentMaxHold || 240).map((phase, index) => (
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
                        parseSessionPhases(session.focus, currentMaxHold || 240)
                          .reduce((total, phase) => total + phase.duration, 0)
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