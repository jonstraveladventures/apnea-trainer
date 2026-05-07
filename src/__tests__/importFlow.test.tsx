import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { AppProvider } from '../context/AppContext';
import { TimerProvider } from '../context/TimerContext';
import App from '../App';

// jsdom doesn't implement Web Audio — stub it so component imports don't blow up.
beforeAll(() => {
  // @ts-expect-error stub
  global.AudioContext = class {
    state = 'running';
    currentTime = 0;
    destination = {};
    createGain() { return { gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, value: 0 }, connect: () => {} }; }
    createOscillator() { return { type: '', frequency: { setValueAtTime: () => {} }, detune: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    resume() { return Promise.resolve(); }
  };
});

const renderApp = () =>
  render(
    <ThemeProvider>
      <HashRouter>
        <AppProvider>
          <TimerProvider>
            <App />
          </TimerProvider>
        </AppProvider>
      </HashRouter>
    </ThemeProvider>
  );

describe('Data import flow', () => {
  beforeEach(() => {
    localStorage.clear();
    // Pre-seed localStorage so onboarding does not block the UI.
    const profile = {
      name: 'Default Profile',
      created: new Date().toISOString(),
      sessions: [],
      currentMaxHold: 240,
      customSessions: {},
      weeklySchedule: {
        monday: 'CO₂', tuesday: 'CO₂', wednesday: 'CO₂', thursday: 'CO₂',
        friday: 'CO₂', saturday: 'CO₂', sunday: 'CO₂',
      },
      hasCompletedOnboarding: true,
    };
    localStorage.setItem(
      'apneaTrainerData',
      JSON.stringify({ profiles: { default: profile }, currentProfile: 'default' })
    );
  });

  const findImportInput = async (): Promise<HTMLInputElement> => {
    // Wait for the loading screen to disappear.
    await waitFor(() => expect(screen.queryByText(/Loading Apnea Trainer/)).toBeNull());
    // Then wait for the Import Data button to render (route resolution + render pass).
    await screen.findByText(/Import Data/i);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (!input) throw new Error('file input not found');
    return input;
  };

  it('rejects an import file that is not valid JSON', async () => {
    renderApp();
    const importInput = await findImportInput();

    const badFile = new File(['not json at all {{['], 'bad.json', { type: 'application/json' });
    fireEvent.change(importInput, { target: { files: [badFile] } });

    await waitFor(() =>
      expect(screen.getByText(/file is not valid JSON/i)).toBeInTheDocument()
    );
  });

  it('rejects an import file with invalid shape', async () => {
    renderApp();
    const importInput = await findImportInput();

    const wrongShape = new File(
      [JSON.stringify({ sessions: [{ totally: 'wrong' }] })],
      'wrong.json',
      { type: 'application/json' }
    );
    fireEvent.change(importInput, { target: { files: [wrongShape] } });

    await waitFor(() => expect(screen.getByText(/Import rejected/i)).toBeInTheDocument());
  });
});
