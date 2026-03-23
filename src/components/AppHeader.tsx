import React from 'react';
import { Calendar, Timer as TimerIcon, BarChart3, Settings, Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface AppHeaderProps {
  onSave: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onSave }) => {
  const { state, actions } = useAppContext();
  const { currentView, sessions } = state;

  const completedSessions = sessions.filter(s => s.completed).length;

  return (
    <>
      {/* Header */}
      <header className="bg-deep-800 border-b border-deep-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ocean-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🐬</span>
            </div>
            <h1 className="text-xl font-bold">Apnea Trainer</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-deep-400">
              {completedSessions} sessions completed
            </div>

            <button
              onClick={onSave}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-deep-800 border-b border-deep-700 px-6 py-2" role="navigation" aria-label="Main navigation">
        <div className="flex items-center gap-6">
          <button
            onClick={() => actions.setCurrentView('weekplan')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'weekplan'
                ? 'bg-ocean-600 text-white'
                : 'text-deep-400 hover:text-white hover:bg-deep-700'
            }`}
            aria-current={currentView === 'weekplan' ? 'page' : undefined}
          >
            <Calendar className="w-4 h-4" />
            Week Plan
          </button>

          <button
            onClick={() => actions.setCurrentView('timer')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'timer'
                ? 'bg-ocean-600 text-white'
                : 'text-deep-400 hover:text-white hover:bg-deep-700'
            }`}
            aria-current={currentView === 'timer' ? 'page' : undefined}
          >
            <TimerIcon className="w-4 h-4" />
            Timer
          </button>

          <button
            onClick={() => actions.setCurrentView('progress')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'progress'
                ? 'bg-ocean-600 text-white'
                : 'text-deep-400 hover:text-white hover:bg-deep-700'
            }`}
            aria-current={currentView === 'progress' ? 'page' : undefined}
          >
            <BarChart3 className="w-4 h-4" />
            Progress
          </button>

          <button
            onClick={() => actions.setCurrentView('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'settings'
                ? 'bg-ocean-600 text-white'
                : 'text-deep-400 hover:text-white hover:bg-deep-700'
            }`}
            aria-current={currentView === 'settings' ? 'page' : undefined}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </nav>
    </>
  );
};

export default AppHeader;
