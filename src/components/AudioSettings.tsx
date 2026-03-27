import React from 'react';
import { Volume2, Play } from 'lucide-react';
import { AudioPreferences, AudioCueType, AudioSound } from '../types';
import useAudioCues, { SOUND_LABELS } from '../hooks/useAudioCues';

interface AudioSettingsProps {
  preferences: AudioPreferences;
  onSave: (prefs: AudioPreferences) => void;
}

const CUE_LABELS: Record<AudioCueType, { title: string; description: string }> = {
  countdown: {
    title: 'Countdown',
    description: 'Voice countdown "5, 4, 3, 2, 1" six seconds before phase ends',
  },
  phaseStart: {
    title: 'Phase Start',
    description: 'Plays when a new phase begins — signals time to start',
  },
  phaseEnd: {
    title: 'Phase End',
    description: 'Plays when a phase completes — you can breathe now',
  },
  sessionComplete: {
    title: 'Session Complete',
    description: 'Plays when the entire session finishes',
  },
};

/** Sounds available for non-countdown cues */
const SOUND_OPTIONS: AudioSound[] = [
  'singing-bowl',
  'double-chime-up',
  'double-chime-down',
  'gentle-bell',
  'completion-fanfare',
  'soft-pulse',
  'none',
];

const CUE_TYPES: AudioCueType[] = ['countdown', 'phaseStart', 'phaseEnd', 'sessionComplete'];

const AudioSettings: React.FC<AudioSettingsProps> = ({ preferences, onSave }) => {
  const audioCues = useAudioCues(preferences);

  const handleToggle = (cueType: AudioCueType) => {
    const updated: AudioPreferences = {
      ...preferences,
      [cueType]: {
        ...preferences[cueType],
        enabled: !preferences[cueType].enabled,
      },
    };
    onSave(updated);
  };

  const handleSoundChange = (cueType: AudioCueType, sound: AudioSound) => {
    const updated: AudioPreferences = {
      ...preferences,
      [cueType]: {
        ...preferences[cueType],
        sound,
      },
    };
    onSave(updated);
  };

  const handlePreview = (cueType: AudioCueType) => {
    if (cueType === 'countdown') {
      audioCues.playCue('countdown');
    } else {
      audioCues.playSound(preferences[cueType].sound);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Volume2 className="w-6 h-6" />
        Audio Cues
      </h2>
      <p className="text-gray-500 dark:text-deep-300 mb-4">
        Configure sounds that play at key moments during your training session.
        All sounds are synthesized — no downloads needed.
      </p>

      <div className="space-y-4">
        {CUE_TYPES.map((cueType) => {
          const config = preferences[cueType];
          const labels = CUE_LABELS[cueType];
          const isCountdown = cueType === 'countdown';

          return (
            <div
              key={cueType}
              className="p-4 bg-gray-50 dark:bg-deep-700/50 rounded-lg border border-gray-200 dark:border-deep-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {labels.title}
                  </h3>
                  <p className="text-gray-400 dark:text-deep-400 text-sm">
                    {labels.description}
                  </p>
                </div>

                {/* Enable / Disable toggle */}
                <button
                  onClick={() => handleToggle(cueType)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.enabled
                      ? 'bg-ocean-600'
                      : 'bg-gray-300 dark:bg-deep-600'
                  }`}
                  aria-label={`Toggle ${labels.title}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {config.enabled && (
                <div className="flex items-center gap-3 mt-3">
                  {isCountdown ? (
                    <span className="text-sm text-gray-500 dark:text-deep-300 italic">
                      Voice countdown (mp3)
                    </span>
                  ) : (
                    <>
                      <label className="text-sm text-gray-500 dark:text-deep-300">Sound:</label>
                      <select
                        value={config.sound}
                        onChange={(e) =>
                          handleSoundChange(cueType, e.target.value as AudioSound)
                        }
                        className="bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white"
                      >
                        {SOUND_OPTIONS.map((sound) => (
                          <option key={sound} value={sound}>
                            {SOUND_LABELS[sound]}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  <button
                    onClick={() => handlePreview(cueType)}
                    className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"
                    title="Preview sound"
                  >
                    <Play className="w-3 h-3" />
                    Preview
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AudioSettings;
