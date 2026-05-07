import React from 'react';
import { Volume2, Play } from 'lucide-react';
import { AudioPreferences, AudioCueType, AudioSound, AudioCueConfig } from '../types';
import useAudioCues, { SOUND_LABELS } from '../hooks/useAudioCues';
import { useSpeech } from '../hooks/useSpeech';

interface AudioSettingsProps {
  preferences: AudioPreferences;
  onSave: (prefs: AudioPreferences) => void;
}

const CUE_LABELS: Record<AudioCueType, { title: string; description: string }> = {
  countdown: {
    title: 'Countdown',
    description: 'Five-second countdown before each phase ends. Voice mode uses a precisely-timed recorded mp3.',
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
  minuteMark: {
    title: 'Minute Mark',
    description: 'Spoken every full minute into a phase ("one minute", "two minutes", …)',
  },
};

const SOUND_OPTIONS: AudioSound[] = [
  'voice',
  'singing-bowl',
  'double-chime-up',
  'double-chime-down',
  'gentle-bell',
  'completion-fanfare',
  'soft-pulse',
  'none',
];

const CUE_TYPES: AudioCueType[] = ['countdown', 'phaseStart', 'phaseEnd', 'sessionComplete', 'minuteMark'];

/** Fallback config for cues that may be missing on legacy saved profiles. */
const DEFAULT_CONFIG: Record<AudioCueType, AudioCueConfig> = {
  countdown: { enabled: true, sound: 'voice' },
  phaseStart: { enabled: true, sound: 'voice' },
  phaseEnd: { enabled: true, sound: 'singing-bowl' },
  sessionComplete: { enabled: true, sound: 'voice' },
  minuteMark: { enabled: true, sound: 'voice' },
};

const AudioSettings: React.FC<AudioSettingsProps> = ({ preferences, onSave }) => {
  const audioCues = useAudioCues(preferences);
  const { voices, speak } = useSpeech();

  /** Get the saved config for a cue, falling back to a sane default if missing. */
  const cfgFor = (cueType: AudioCueType) =>
    preferences[cueType] ?? DEFAULT_CONFIG[cueType];

  const handleToggle = (cueType: AudioCueType) => {
    const current = cfgFor(cueType);
    const updated: AudioPreferences = {
      ...preferences,
      [cueType]: { ...current, enabled: !current.enabled },
    };
    onSave(updated);
  };

  const handleSoundChange = (cueType: AudioCueType, sound: AudioSound) => {
    const updated: AudioPreferences = {
      ...preferences,
      [cueType]: { ...cfgFor(cueType), sound },
    };
    onSave(updated);
  };

  const handleVolumeChange = (cueType: AudioCueType, volume: number) => {
    const updated: AudioPreferences = {
      ...preferences,
      [cueType]: { ...cfgFor(cueType), volume },
    };
    onSave(updated);
  };

  const handleVoiceChange = (voiceName: string) => {
    onSave({ ...preferences, voiceName: voiceName || undefined });
  };

  const previewVoice = () => {
    speak('This is your training voice. Begin diaphragmatic breathing.', {
      voiceName: preferences.voiceName,
    });
  };

  const handlePreview = (cueType: AudioCueType) => {
    // Use a representative sample phrase for voice cues so the preview is meaningful.
    const sampleContext = {
      phaseDescription: 'diaphragmatic breathing',
      minutes: 1,
    };
    audioCues.playCue(cueType, sampleContext);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Volume2 className="w-6 h-6" />
        Audio Cues
      </h2>
      <p className="text-gray-500 dark:text-deep-300 mb-4">
        Configure what plays at key moments during your training session. Pick "Voice"
        for spoken cues using your system's text-to-speech engine, or one of the
        synthesised chimes.
      </p>

      {/* Global voice picker — applies to any cue whose sound is set to "voice". */}
      <div className="p-4 mb-4 bg-ocean-50 dark:bg-ocean-900/20 rounded-lg border border-ocean-200 dark:border-ocean-700/40">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voice</h3>
            <p className="text-gray-500 dark:text-deep-300 text-sm">
              Used by any cue whose sound is set to "Voice". macOS Siri voices sound
              the most natural; Windows/Linux quality varies.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={preferences.voiceName ?? ''}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="bg-white dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white max-w-xs"
              aria-label="Voice"
            >
              <option value="">System default</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <button
              onClick={previewVoice}
              className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"
              title="Preview voice"
            >
              <Play className="w-3 h-3" />
              Preview
            </button>
          </div>
        </div>
        {voices.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            No voices detected. Your browser may need a moment to load them, or your
            system may have none installed.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {CUE_TYPES.map((cueType) => {
          const config = cfgFor(cueType);
          const labels = CUE_LABELS[cueType];

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
                <div className="space-y-3 mt-3">
                  <div className="flex items-center gap-3 flex-wrap">
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

                    <button
                      onClick={() => handlePreview(cueType)}
                      className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"
                      title="Preview sound"
                    >
                      <Play className="w-3 h-3" />
                      Preview
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <label
                      htmlFor={`volume-${cueType}`}
                      className="text-sm text-gray-500 dark:text-deep-300 min-w-[3.5rem]"
                    >
                      Volume:
                    </label>
                    <input
                      id={`volume-${cueType}`}
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={config.volume ?? 1}
                      onChange={(e) =>
                        handleVolumeChange(cueType, parseFloat(e.target.value))
                      }
                      className="flex-1 accent-ocean-500"
                      aria-label={`${labels.title} volume`}
                    />
                    <span className="text-xs text-gray-500 dark:text-deep-400 min-w-[2.5rem] text-right tabular-nums">
                      {Math.round((config.volume ?? 1) * 100)}%
                    </span>
                  </div>
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
