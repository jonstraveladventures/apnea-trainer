import React, { useState } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';

const MaxHoldModal = ({ isOpen, onClose, onSave, currentMaxHold }) => {
  const [maxHoldMinutes, setMaxHoldMinutes] = useState('');
  const [maxHoldSeconds, setMaxHoldSeconds] = useState('');
  const [error, setError] = useState('');

  // Initialize with current max hold if it exists
  React.useEffect(() => {
    if (currentMaxHold) {
      const minutes = Math.floor(currentMaxHold / 60);
      const seconds = currentMaxHold % 60;
      setMaxHoldMinutes(minutes.toString());
      setMaxHoldSeconds(seconds.toString().padStart(2, '0'));
    }
  }, [currentMaxHold]);

  const handleSave = () => {
    const minutes = parseInt(maxHoldMinutes) || 0;
    const seconds = parseInt(maxHoldSeconds) || 0;
    const totalSeconds = (minutes * 60) + seconds;

    if (totalSeconds === 0) {
      setError('Please enter a valid time');
      return;
    }

    if (totalSeconds < 30) {
      setError('Max hold time should be at least 30 seconds');
      return;
    }

    if (totalSeconds > 600) {
      setError('Max hold time should be less than 10 minutes');
      return;
    }

    setError('');
    onSave(totalSeconds);
    // Don't call onClose here - let the parent component handle it
  };

  const handleCancel = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-deep-800 rounded-xl p-6 max-w-md w-full mx-4 border border-deep-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-ocean-400" />
            <h2 className="text-xl font-bold">Set Your Max Breath-Hold Time</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-deep-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-deep-300 mb-4">
            To provide personalized training sessions, we need to know your current maximum breath-hold time. 
            This will be used to calculate appropriate training intensities.
          </p>
          
          <div className="bg-deep-900 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Safety Note</span>
            </div>
            <p className="text-xs text-deep-400">
              Only enter a time you've actually achieved in a safe training environment. 
              Never push beyond your limits during training.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-deep-300 mb-2">
            Maximum Breath-Hold Time
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="59"
                value={maxHoldMinutes}
                onChange={(e) => setMaxHoldMinutes(e.target.value)}
                className="input-field w-full text-center"
                placeholder="0"
              />
              <div className="text-xs text-deep-500 text-center mt-1">Minutes</div>
            </div>
            <div className="text-2xl text-deep-400">:</div>
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="59"
                value={maxHoldSeconds}
                onChange={(e) => setMaxHoldSeconds(e.target.value.padStart(2, '0'))}
                className="input-field w-full text-center"
                placeholder="00"
              />
              <div className="text-xs text-deep-500 text-center mt-1">Seconds</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex-1"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaxHoldModal; 