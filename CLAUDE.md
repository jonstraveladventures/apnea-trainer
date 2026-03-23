# Apnea Trainer

Desktop breath-hold training app for freediving. React 18 + Electron 28 + TypeScript + Tailwind CSS.

## Commands

- `npm start` — React dev server (localhost:3000)
- `npm run electron-dev` — Full Electron dev mode with hot reload
- `npm run build` — Production React build
- `npm test` — Run all tests (144 tests, jest via react-scripts)
- `npm run test -- --watchAll=false` — Run tests once without watch mode
- `npm run dist` — Build + package Electron app for current platform
- `npm run dist-all` — Build for macOS, Windows, Linux

## Architecture

### State Management

Two React Contexts power the entire app:

- **AppContext** (`src/context/AppContext.tsx`) — Profiles, sessions, weekly schedule, UI modals, notifications. Persists via Electron IPC (`window.electronAPI`) with localStorage fallback.
- **TimerContext** (`src/context/TimerContext.tsx`) — Timer state, phase progression, session templates. Uses `useRef` for mutable time values to avoid recreating the interval every tick.

Both contexts export typed action helpers (e.g., `actions.setSessions()`) and selector hooks (e.g., `useProfiles()`, `useTimerState()`).

### File Structure

```
src/
├── App.tsx                    # Main app shell, view routing, handler wiring
├── index.tsx                  # Entry point, wraps with AppProvider + TimerProvider
├── types/index.ts             # All TypeScript interfaces (Phase, Session, Profile, etc.)
├── constants/defaults.ts      # DEFAULT_WEEKLY_SCHEDULE, DEFAULT_MAX_HOLD
├── config/sessionTemplates.ts # 10 session template configs (SESSION_TEMPLATES)
├── context/                   # AppContext + TimerContext with exported reducers
├── hooks/
│   ├── useAudio.ts            # Audio playback hook
│   ├── useSessionTimer.ts     # Core timer interval, phase progression, session lifecycle
│   └── useSessionSetup.ts     # Session init, phase calculation on type change
├── utils/
│   ├── trainingLogic.ts       # Schedule generation, formatTime, parseTime
│   ├── sessionParsers.ts      # Converts session templates into phase arrays
│   ├── phaseUtils.ts          # getPhaseIcon, getExerciseTypeFromPhase, getPhaseGuidance
│   └── exerciseInstructions.ts # Instruction data for all 15 exercise types
├── components/
│   ├── Timer.tsx              # Timer view — composition of hooks + sub-components
│   ├── WeekPlan.tsx           # Weekly calendar view with session details
│   ├── PhaseDisplay.tsx       # Active phase timer with progress bar + animations
│   ├── SessionCard.tsx        # Individual session card with edit/complete
│   ├── ControlButtons.tsx     # Play/pause/skip/reset controls
│   ├── SessionSelector.tsx    # Session type dropdown
│   ├── SessionPreview.tsx     # Phase list preview before starting
│   ├── SessionSummary.tsx     # Post-session completion summary
│   ├── ProgressChart.tsx      # Training progress visualization
│   ├── MaxHoldModal.tsx       # Max hold time input modal
│   ├── PhaseCreator.tsx       # Custom phase builder form
│   ├── AppHeader.tsx          # Header + 4-button navigation
│   ├── ErrorBoundary.tsx      # Error boundary with "Try Again" reset
│   └── modals/
│       ├── TemplateEditorModal.tsx       # Edit session template parameters
│       ├── ProfileModal.tsx             # Profile management (CRUD, import/export)
│       ├── CustomSessionCreatorModal.tsx # Build custom sessions
│       └── WeeklyScheduleEditorModal.tsx # Assign sessions to days
```

### Key Data Flow

1. **Session Templates** (`sessionTemplates.ts`) define parameters for 10 session types
2. **Session Parsers** (`sessionParsers.ts`) convert templates + max hold time into `Phase[]` arrays
3. **Timer** uses `useSessionTimer` hook which runs a 1-second interval, progresses through phases, triggers audio cues
4. **Persistence**: AppContext auto-saves to Electron's `apnea-data.json` (or localStorage in browser) whenever sessions/profiles change

### Electron Setup

- Main process: `public/electron.js` — BrowserWindow with contextIsolation, IPC for data persistence
- Preload: `public/preload.js` — exposes `electronAPI` with `saveData`, `loadData`, `saveProfileAs`, `loadProfileFromFile`
- Audio files: `public/audio/`

## Testing

Tests are in `__tests__/` directories adjacent to the code they test.

- **Utility tests** (`utils/__tests__/`) — Pure function tests for trainingLogic, sessionParsers, phaseUtils
- **Reducer tests** (`context/__tests__/`) — Direct reducer state transition tests for appReducer and timerReducer

Run a specific test file: `npm test -- --testPathPattern="trainingLogic"`

## Styling

Tailwind CSS with custom theme in `tailwind.config.js`:
- `ocean-*` colors (blues) for accents
- `deep-*` colors (grays) for dark backgrounds
- Custom animations: `pulse-slow` (3s), `breathe` (4s scale)
- Component classes defined in `index.css`: `.btn-primary`, `.btn-secondary`, `.card`, `.input-field`

## CI/CD

GitHub Actions (`.github/workflows/release.yml`): Builds for macOS arm64, Windows x64, Linux x64 on tag push or manual dispatch.

## Common Patterns

- **Adding a new session type**: Add template to `sessionTemplates.ts`, add parser function to `sessionParsers.ts`, add case to `parseSessionPhases` switch, add to `SESSION_CATEGORIES`
- **Adding a new modal**: Create in `components/modals/`, use `useAppContext()` for state, add `showXxx` boolean to AppState and reducer, render conditionally in App.tsx
- **Modifying timer behavior**: Edit `useSessionTimer.ts` hook — the interval callback handles phase completion, audio cues, and next-phase instructions
