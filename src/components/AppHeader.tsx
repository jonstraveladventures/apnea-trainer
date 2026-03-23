import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Timer as TimerIcon, BarChart3, Settings, Save, Sun, Moon, Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

interface AppHeaderProps {
  onSave: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
    isActive
      ? 'bg-ocean-600 text-white'
      : 'text-gray-500 dark:text-deep-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-deep-700'
  }`;

const AppHeader: React.FC<AppHeaderProps> = ({ onSave }) => {
  const { state } = useAppContext();
  const { sessions } = state;
  const { theme, toggleTheme } = useTheme();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const isElectron = !!(window as any).electronAPI;

  useEffect(() => {
    if (isElectron) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isElectron]);

  const completedSessions = sessions.filter(s => s.completed).length;

  return (
    <>
      {/* Header */}
      <header className="bg-white dark:bg-deep-800 border-b border-gray-200 dark:border-deep-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ocean-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🐬</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Apnea Trainer</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 dark:text-deep-400">
              {completedSessions} sessions completed
            </div>

            {!isElectron && installPrompt && (
              <button
                onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }}
                className="p-2 rounded-lg transition-colors bg-ocean-600 hover:bg-ocean-700 text-white"
                title="Install App"
                aria-label="Install App"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-deep-700 dark:hover:bg-deep-600 text-gray-600 dark:text-deep-300"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

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
      <nav className="bg-white dark:bg-deep-800 border-b border-gray-200 dark:border-deep-700 px-6 py-2" role="navigation" aria-label="Main navigation">
        <div className="flex items-center gap-6">
          <NavLink to="/weekplan" className={navLinkClass}>
            <Calendar className="w-4 h-4" />
            Week Plan
          </NavLink>

          <NavLink to="/timer" className={navLinkClass}>
            <TimerIcon className="w-4 h-4" />
            Timer
          </NavLink>

          <NavLink to="/progress" className={navLinkClass}>
            <BarChart3 className="w-4 h-4" />
            Progress
          </NavLink>

          <NavLink to="/settings" className={navLinkClass}>
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
        </div>
      </nav>
    </>
  );
};

export default AppHeader;
