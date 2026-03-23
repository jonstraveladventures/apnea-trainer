# Apnea Trainer

Desktop + PWA breath-hold training app for freediving. React 18 + Electron 28 + TypeScript + Tailwind CSS.

## Commands

- `npm start` — React dev server (localhost:3000)
- `npm run electron-dev` — Full Electron dev mode with hot reload
- `npm run build` — Production React build
- `npm test` — Run all tests (147 tests, jest via react-scripts)
- `npm test -- --watchAll=false` — Run tests once without watch mode
- `npm run dist` — Build + package Electron app for current platform
- `npm run dist-all` — Build for macOS, Windows, Linux

## Architecture

### Routing

Uses `react-router-dom` v6 with `HashRouter` (required for Electron `file://` protocol).
Routes: `/weekplan`, `/timer`, `/progress`, `/settings`. Root `/` redirects to `/weekplan`.
Navigation is in `AppHeader.tsx` using `NavLink` components.

### State Management

Three React Contexts:

- **AppContext** (`src/context/AppContext.tsx`) — Profiles, sessions, weekly schedule, UI modals, notifications, audio preferences. Persists via Electron IPC (`window.electronAPI`) with localStorage fallback.
- **TimerContext** (`src/context/TimerContext.tsx`) — Timer state, phase progression, session templates. Uses `useRef` for mutable time values to avoid recreating the interval every tick.
- **ThemeContext** (`src/context/ThemeContext.tsx`) — Dark/light theme toggle. Persists to localStorage. Toggles `dark` class on `<html>`.

AppContext and TimerContext export typed action helpers (e.g., `actions.setSessions()`) and selector hooks (e.g., `useProfiles()`, `useTimerState()`).

### File Structure

```
src/
├── App.tsx                        # App shell, route definitions, modal rendering
├── index.tsx                      # Entry: HashRouter > ThemeProvider > AppProvider > TimerProvider
├── serviceWorkerRegistration.ts   # PWA service worker registration (prod only, skips Electron)
├── types/index.ts                 # All TypeScript interfaces
├── constants/defaults.ts          # DEFAULT_WEEKLY_SCHEDULE, DEFAULT_MAX_HOLD
├── config/sessionTemplates.ts     # 10 session template configs
├── context/
│   ├── AppContext.tsx              # Profiles, sessions, modals, persistence
│   ├── TimerContext.tsx            # Timer state, phase progression
│   └── ThemeContext.tsx            # Dark/light theme
├── hooks/
│   ├── useAudio.ts                # Simple audio playback hook
│   ├── useAudioCues.ts            # Web Audio API cues (beep, chime, tones) + mp3 countdown
│   ├── useSessionTimer.ts         # Core timer interval, phase progression, session lifecycle
│   └── useSessionSetup.ts         # Session init, phase calculation on type change
├── utils/
│   ├── trainingLogic.ts           # Schedule generation, formatTime, parseTime
│   ├── sessionParsers.ts          # Converts session templates into Phase[] arrays
│   ├── phaseUtils.ts              # getPhaseIcon, getExerciseTypeFromPhase, getPhaseGuidance
│   ├── exerciseInstructions.ts    # Instruction data for 15 exercise types
│   └── exportUtils.ts             # CSV and PDF export functions
├── components/
│   ├── Timer.tsx                  # Timer view — composition of hooks + sub-components
│   ├── WeekPlan.tsx               # Weekly calendar view
│   ├── SettingsView.tsx           # Settings page (profiles, templates, audio, schedule)
│   ├── PhaseDisplay.tsx           # Active phase timer with progress bar + animations
│   ├── ProgressChart.tsx          # Analytics dashboard (composes progress/ sub-components)
│   ├── SessionCard.tsx            # Individual session card with edit/complete
│   ├── ControlButtons.tsx         # Play/pause/skip/reset controls
│   ├── SessionSelector.tsx        # Session type dropdown
│   ├── SessionPreview.tsx         # Phase list preview
│   ├── SessionSummary.tsx         # Post-session completion summary
│   ├── MaxHoldModal.tsx           # Max hold time input modal
│   ├── PhaseCreator.tsx           # Custom phase builder form
│   ├── AudioSettings.tsx          # Per-cue audio configuration (sound, enable/disable, preview)
│   ├── AppHeader.tsx              # Header + NavLink navigation + theme toggle + install button
│   ├── ErrorBoundary.tsx          # Error boundary with "Try Again" reset
│   ├── progress/
│   │   ├── MaxHoldTrendChart.tsx  # SVG line chart of max hold over time
│   │   ├── StreakCounter.tsx      # Consecutive completed days
│   │   ├── PersonalRecords.tsx    # Best max hold, total time, sessions completed
│   │   ├── VolumeBreakdown.tsx    # Sessions per week bar chart
│   │   └── FocusDistribution.tsx  # (in ProgressChart.tsx currently)
│   └── modals/
│       ├── TemplateEditorModal.tsx          # Edit session template parameters (controlled inputs)
│       ├── ProfileModal.tsx                 # Profile management (CRUD, import/export)
│       ├── CustomSessionCreatorModal.tsx    # Build custom sessions with PhaseCreator
│       ├── CustomSessionTypeModal.tsx       # Create custom session types from WeekPlan
│       ├── SessionDetailsModal.tsx          # View session phase details
│       ├── ExerciseInstructionsModal.tsx    # Step-by-step exercise instructions
│       ├── WeeklyScheduleEditorModal.tsx    # Assign session types to days
│       └── OnboardingModal.tsx             # 4-step first-run wizard
```

### Key Data Flow

1. **Session Templates** (`sessionTemplates.ts`) define parameters for 10 session types
2. **Session Parsers** (`sessionParsers.ts`) convert templates + max hold time into `Phase[]` arrays
3. **Timer** uses `useSessionTimer` hook which runs a 1-second interval, progresses through phases, triggers audio cues via `useAudioCues`
4. **Persistence**: AppContext auto-saves to Electron's `apnea-data.json` (or localStorage in browser) whenever sessions/profiles change

### Electron Setup

- Main process: `public/electron.js` — BrowserWindow with contextIsolation, IPC for data persistence
- Preload: `public/preload.js` — exposes `electronAPI` with `saveData`, `loadData`, `saveProfileAs`, `loadProfileFromFile`
- Audio files: `public/audio/`

### PWA Setup

- `public/manifest.json` — App manifest with icons and standalone display mode
- `public/service-worker.js` — Cache-first strategy for offline support
- `src/serviceWorkerRegistration.ts` — Registers SW only in production, skips Electron
- Install prompt in AppHeader when `beforeinstallprompt` fires (non-Electron only)

## Testing

Tests are in `__tests__/` directories adjacent to the code they test. 147 tests across 6 suites.

- **Utility tests** (`utils/__tests__/`) — trainingLogic, sessionParsers, phaseUtils, exportUtils
- **Reducer tests** (`context/__tests__/`) — appReducer (37 tests), timerReducer (34 tests)

Run a specific test file: `npm test -- --testPathPattern="trainingLogic"`

## Styling

Tailwind CSS with `darkMode: 'class'` in `tailwind.config.js`:
- Dark mode (default): `deep-*` colors for backgrounds, `ocean-*` for accents
- Light mode: `white`/`gray-*` backgrounds, same `ocean-*` accents
- Toggle via sun/moon button in AppHeader, persists to localStorage
- All components use `dark:` prefix pattern: `bg-white dark:bg-deep-800`, `text-gray-900 dark:text-white`
- Component classes in `index.css`: `.btn-primary`, `.btn-secondary`, `.card`, `.input-field`
- Custom animations: `pulse-slow` (3s), `breathe` (4s scale), `box-orbit` (box breathing)

## Audio System

- **useAudioCues hook** generates tones via Web Audio API (OscillatorNode): beep (800Hz), chime (523Hz), tone-low (330Hz), tone-high (1000Hz)
- **Cue points**: countdown (-6s before phase end), phaseStart, phaseEnd, sessionComplete
- **AudioSettings component** lets users configure each cue: enable/disable, sound selection, preview
- Preferences stored per-profile in `audioPreferences` field
- Original mp3 voice countdown (`public/audio/countdown-5-4-3-2-1.mp3`) is the default for countdown cue

## CI/CD

GitHub Actions (`.github/workflows/release.yml`): Builds for macOS arm64, Windows x64, Linux x64 on tag push or manual dispatch.

## Common Patterns

- **Adding a new session type**: Add template to `sessionTemplates.ts`, add parser to `sessionParsers.ts`, add case to `parseSessionPhases` switch, add to `SESSION_CATEGORIES`
- **Adding a new modal**: Create in `components/modals/`, use `useAppContext()` for state, add `showXxx` boolean to AppState and reducer, render conditionally in App.tsx
- **Adding a new route**: Add `<Route>` in App.tsx, add `<NavLink>` in AppHeader.tsx
- **Modifying timer behavior**: Edit `useSessionTimer.ts` — the interval callback handles phase completion, audio cues, and next-phase instructions
- **Adding a new audio cue point**: Add to `AudioCueType` in types, add trigger in `useSessionTimer.ts`, add config row in `AudioSettings.tsx`
- **Theme-aware styling**: Always use paired classes: `bg-white dark:bg-deep-800`, `text-gray-900 dark:text-white`
