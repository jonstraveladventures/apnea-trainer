import { appReducer, ACTIONS, initialState } from '../AppContext';
import { AppState, Session, WeeklySchedule, Profile } from '../../types';
import { DEFAULT_WEEKLY_SCHEDULE } from '../../constants/defaults';

/**
 * Helper: returns a deep copy of initialState so tests don't mutate the shared object.
 */
const freshState = (): AppState => JSON.parse(JSON.stringify(initialState));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  name: 'Test Profile',
  created: '2025-01-01T00:00:00.000Z',
  sessions: [],
  currentMaxHold: 120,
  customSessions: {},
  weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE },
  ...overrides,
});

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  date: '2025-06-01',
  focus: 'Breath Control',
  notes: '',
  actualMaxHold: null,
  completed: false,
  ...overrides,
});

// ===========================================================================
// Tests
// ===========================================================================

describe('appReducer', () => {
  // -----------------------------------------------------------------------
  // SET_CURRENT_PROFILE
  // -----------------------------------------------------------------------
  describe('SET_CURRENT_PROFILE', () => {
    it('changes currentProfile to the given value', () => {
      const state = freshState();
      const result = appReducer(state, {
        type: ACTIONS.SET_CURRENT_PROFILE,
        payload: 'athlete',
      });
      expect(result.currentProfile).toBe('athlete');
    });

    it('does not mutate the original state', () => {
      const state = freshState();
      const result = appReducer(state, {
        type: ACTIONS.SET_CURRENT_PROFILE,
        payload: 'athlete',
      });
      expect(state.currentProfile).toBe('default');
      expect(result).not.toBe(state);
    });
  });

  // -----------------------------------------------------------------------
  // CREATE_PROFILE
  // -----------------------------------------------------------------------
  describe('CREATE_PROFILE', () => {
    it('adds a new profile to profiles', () => {
      const state = freshState();
      const profile = makeProfile({ name: 'Athlete' });
      const result = appReducer(state, {
        type: ACTIONS.CREATE_PROFILE,
        payload: { id: 'athlete', profile },
      });
      expect(result.profiles.athlete).toEqual(profile);
      expect(result.profiles.default).toBeDefined();
    });

    it('does not remove existing profiles', () => {
      const state = freshState();
      const keys = Object.keys(state.profiles);
      const profile = makeProfile();
      const result = appReducer(state, {
        type: ACTIONS.CREATE_PROFILE,
        payload: { id: 'new', profile },
      });
      keys.forEach((k) => expect(result.profiles[k]).toBeDefined());
    });
  });

  // -----------------------------------------------------------------------
  // DELETE_PROFILE
  // -----------------------------------------------------------------------
  describe('DELETE_PROFILE', () => {
    it('removes the profile from profiles', () => {
      const state: AppState = {
        ...freshState(),
        profiles: {
          default: makeProfile({ name: 'Default Profile' }),
          athlete: makeProfile({ name: 'Athlete' }),
        },
      };
      const result = appReducer(state, {
        type: ACTIONS.DELETE_PROFILE,
        payload: 'athlete',
      });
      expect(result.profiles.athlete).toBeUndefined();
      expect(result.profiles.default).toBeDefined();
    });

    it('switches to default if the deleted profile was current', () => {
      const state: AppState = {
        ...freshState(),
        currentProfile: 'athlete',
        profiles: {
          default: makeProfile({ name: 'Default Profile' }),
          athlete: makeProfile({ name: 'Athlete' }),
        },
      };
      const result = appReducer(state, {
        type: ACTIONS.DELETE_PROFILE,
        payload: 'athlete',
      });
      expect(result.currentProfile).toBe('default');
    });

    it('keeps currentProfile unchanged when deleting a non-current profile', () => {
      const state: AppState = {
        ...freshState(),
        currentProfile: 'default',
        profiles: {
          default: makeProfile({ name: 'Default Profile' }),
          athlete: makeProfile({ name: 'Athlete' }),
        },
      };
      const result = appReducer(state, {
        type: ACTIONS.DELETE_PROFILE,
        payload: 'athlete',
      });
      expect(result.currentProfile).toBe('default');
    });
  });

  // -----------------------------------------------------------------------
  // LOAD_PROFILE_DATA
  // -----------------------------------------------------------------------
  describe('LOAD_PROFILE_DATA', () => {
    it('loads sessions, currentMaxHold, and weeklySchedule from the profile', () => {
      const sessions: Session[] = [makeSession({ date: '2025-06-01' })];
      const schedule: WeeklySchedule = {
        ...DEFAULT_WEEKLY_SCHEDULE,
        monday: 'Rest Day',
      };
      const state: AppState = {
        ...freshState(),
        profiles: {
          default: makeProfile(),
          athlete: makeProfile({
            sessions,
            currentMaxHold: 300,
            weeklySchedule: schedule,
          }),
        },
      };
      const result = appReducer(state, {
        type: ACTIONS.LOAD_PROFILE_DATA,
        payload: 'athlete',
      });
      expect(result.sessions).toEqual(sessions);
      expect(result.currentMaxHold).toBe(300);
      expect(result.weeklySchedule.monday).toBe('Rest Day');
    });

    it('falls back to defaults when profile data is missing', () => {
      const state: AppState = {
        ...freshState(),
        profiles: {
          empty: {} as Profile,
        },
      };
      const result = appReducer(state, {
        type: ACTIONS.LOAD_PROFILE_DATA,
        payload: 'empty',
      });
      expect(result.sessions).toEqual([]);
      expect(result.currentMaxHold).toBeNull();
      expect(result.weeklySchedule).toEqual(DEFAULT_WEEKLY_SCHEDULE);
    });

    it('falls back to defaults when profile id does not exist', () => {
      const state = freshState();
      const result = appReducer(state, {
        type: ACTIONS.LOAD_PROFILE_DATA,
        payload: 'nonexistent',
      });
      expect(result.sessions).toEqual([]);
      expect(result.currentMaxHold).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // SET_SESSIONS
  // -----------------------------------------------------------------------
  describe('SET_SESSIONS', () => {
    it('replaces the sessions array', () => {
      const sessions: Session[] = [
        makeSession({ date: '2025-06-01' }),
        makeSession({ date: '2025-06-02' }),
      ];
      const result = appReducer(freshState(), {
        type: ACTIONS.SET_SESSIONS,
        payload: sessions,
      });
      expect(result.sessions).toEqual(sessions);
      expect(result.sessions).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // UPDATE_SESSION
  // -----------------------------------------------------------------------
  describe('UPDATE_SESSION', () => {
    it('updates a specific session matched by date', () => {
      const state: AppState = {
        ...freshState(),
        sessions: [
          makeSession({ date: '2025-06-01', notes: 'old' }),
          makeSession({ date: '2025-06-02', notes: 'keep' }),
        ],
      };
      const result = appReducer(state, {
        type: ACTIONS.UPDATE_SESSION,
        payload: { date: '2025-06-01', session: { notes: 'updated' } },
      });
      expect(result.sessions[0].notes).toBe('updated');
      expect(result.sessions[1].notes).toBe('keep');
    });

    it('leaves sessions untouched when date does not match', () => {
      const sessions = [makeSession({ date: '2025-06-01', notes: 'orig' })];
      const state: AppState = { ...freshState(), sessions };
      const result = appReducer(state, {
        type: ACTIONS.UPDATE_SESSION,
        payload: { date: '2099-01-01', session: { notes: 'nope' } },
      });
      expect(result.sessions[0].notes).toBe('orig');
    });
  });

  // -----------------------------------------------------------------------
  // TOGGLE_SESSION_COMPLETE
  // -----------------------------------------------------------------------
  describe('TOGGLE_SESSION_COMPLETE', () => {
    it('toggles the completed flag for the matching session', () => {
      const state: AppState = {
        ...freshState(),
        sessions: [
          makeSession({ date: '2025-06-01', completed: false }),
          makeSession({ date: '2025-06-02', completed: true }),
        ],
      };
      const result = appReducer(state, {
        type: ACTIONS.TOGGLE_SESSION_COMPLETE,
        payload: '2025-06-01',
      });
      expect(result.sessions[0].completed).toBe(true);
      expect(result.sessions[1].completed).toBe(true); // unchanged
    });

    it('toggles from true to false', () => {
      const state: AppState = {
        ...freshState(),
        sessions: [makeSession({ date: '2025-06-01', completed: true })],
      };
      const result = appReducer(state, {
        type: ACTIONS.TOGGLE_SESSION_COMPLETE,
        payload: '2025-06-01',
      });
      expect(result.sessions[0].completed).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // SET_CURRENT_MAX_HOLD
  // -----------------------------------------------------------------------
  describe('SET_CURRENT_MAX_HOLD', () => {
    it('sets currentMaxHold to a number', () => {
      const result = appReducer(freshState(), {
        type: ACTIONS.SET_CURRENT_MAX_HOLD,
        payload: 180,
      });
      expect(result.currentMaxHold).toBe(180);
    });

    it('sets currentMaxHold to null', () => {
      const state: AppState = { ...freshState(), currentMaxHold: 200 };
      const result = appReducer(state, {
        type: ACTIONS.SET_CURRENT_MAX_HOLD,
        payload: null,
      });
      expect(result.currentMaxHold).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // SET_WEEKLY_SCHEDULE
  // -----------------------------------------------------------------------
  describe('SET_WEEKLY_SCHEDULE', () => {
    it('replaces the weekly schedule', () => {
      const newSchedule: WeeklySchedule = {
        monday: 'Rest',
        tuesday: 'Rest',
        wednesday: 'Rest',
        thursday: 'Rest',
        friday: 'Rest',
        saturday: 'Rest',
        sunday: 'Rest',
      };
      const result = appReducer(freshState(), {
        type: ACTIONS.SET_WEEKLY_SCHEDULE,
        payload: newSchedule,
      });
      expect(result.weeklySchedule).toEqual(newSchedule);
    });
  });

  // -----------------------------------------------------------------------
  // SET_NOTIFICATION / CLEAR_NOTIFICATION
  // -----------------------------------------------------------------------
  describe('SET_NOTIFICATION', () => {
    it('sets the notification', () => {
      const notification = { type: 'success' as const, message: 'Saved!' };
      const result = appReducer(freshState(), {
        type: ACTIONS.SET_NOTIFICATION,
        payload: notification,
      });
      expect(result.notification).toEqual(notification);
    });

    it('sets notification to null', () => {
      const state: AppState = {
        ...freshState(),
        notification: { type: 'error', message: 'fail' },
      };
      const result = appReducer(state, {
        type: ACTIONS.SET_NOTIFICATION,
        payload: null,
      });
      expect(result.notification).toBeNull();
    });
  });

  describe('CLEAR_NOTIFICATION', () => {
    it('clears the notification', () => {
      const state: AppState = {
        ...freshState(),
        notification: { type: 'success', message: 'hi' },
      };
      const result = appReducer(state, { type: ACTIONS.CLEAR_NOTIFICATION });
      expect(result.notification).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // SHOW_MODAL / HIDE_MODAL
  // -----------------------------------------------------------------------
  describe('SHOW_MODAL', () => {
    it('sets the specified modal flag to true', () => {
      const result = appReducer(freshState(), {
        type: ACTIONS.SHOW_MODAL,
        payload: 'showProfileModal',
      });
      expect(result.showProfileModal).toBe(true);
    });

    it('works for different modal names', () => {
      const result = appReducer(freshState(), {
        type: ACTIONS.SHOW_MODAL,
        payload: 'showMaxHoldModal',
      });
      expect(result.showMaxHoldModal).toBe(true);
    });
  });

  describe('HIDE_MODAL', () => {
    it('sets the specified modal flag to false', () => {
      const state: AppState = { ...freshState(), showProfileModal: true };
      const result = appReducer(state, {
        type: ACTIONS.HIDE_MODAL,
        payload: 'showProfileModal',
      });
      expect(result.showProfileModal).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // SAVE_DATA
  // -----------------------------------------------------------------------
  describe('SAVE_DATA', () => {
    it('syncs session data into the current profile', () => {
      const sessions = [makeSession({ date: '2025-06-01' })];
      const state: AppState = {
        ...freshState(),
        currentProfile: 'default',
        sessions,
        currentMaxHold: 250,
      };
      const result = appReducer(state, { type: ACTIONS.SAVE_DATA });
      const profile = result.profiles.default;
      expect(profile.sessions).toEqual(sessions);
      expect(profile.currentMaxHold).toBe(250);
      expect(profile.lastUpdated).toBeDefined();
    });

    it('preserves other profile fields', () => {
      const state: AppState = {
        ...freshState(),
        profiles: {
          default: makeProfile({ name: 'My Default' }),
        },
      };
      const result = appReducer(state, { type: ACTIONS.SAVE_DATA });
      expect(result.profiles.default.name).toBe('My Default');
    });
  });

  // -----------------------------------------------------------------------
  // LOAD_DATA
  // -----------------------------------------------------------------------
  describe('LOAD_DATA', () => {
    it('merges payload into state', () => {
      const result = appReducer(freshState(), {
        type: ACTIONS.LOAD_DATA,
        payload: { currentProfile: 'pro', isLoading: false },
      });
      expect(result.currentProfile).toBe('pro');
      expect(result.isLoading).toBe(false);
    });

    it('does not remove existing fields not in payload', () => {
      const state: AppState = { ...freshState(), currentMaxHold: 300 };
      const result = appReducer(state, {
        type: ACTIONS.LOAD_DATA,
        payload: { isLoading: false },
      });
      expect(result.currentMaxHold).toBe(300);
    });
  });

  // -----------------------------------------------------------------------
  // UPDATE_PROFILE
  // -----------------------------------------------------------------------
  describe('UPDATE_PROFILE', () => {
    it('merges partial data into the specified profile', () => {
      const state: AppState = {
        ...freshState(),
        profiles: {
          default: makeProfile({ name: 'Old Name' }),
        },
      };
      const result = appReducer(state, {
        type: ACTIONS.UPDATE_PROFILE,
        payload: { id: 'default', data: { name: 'New Name' } },
      });
      expect(result.profiles.default.name).toBe('New Name');
      expect(result.profiles.default.lastUpdated).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Simple setter actions
  // -----------------------------------------------------------------------
  describe('SET_CURRENT_VIEW', () => {
    it('sets currentView', () => {
      const result = appReducer(freshState(), {
        type: ACTIONS.SET_CURRENT_VIEW,
        payload: 'timer',
      });
      expect(result.currentView).toBe('timer');
    });
  });

  describe('SET_LOADING', () => {
    it('sets isLoading', () => {
      const result = appReducer(freshState(), {
        type: ACTIONS.SET_LOADING,
        payload: false,
      });
      expect(result.isLoading).toBe(false);
    });
  });

  describe('SET_CUSTOM_SESSION_NAME', () => {
    it('sets customSessionName', () => {
      const result = appReducer(freshState(), {
        type: ACTIONS.SET_CUSTOM_SESSION_NAME,
        payload: 'My Session',
      });
      expect(result.customSessionName).toBe('My Session');
    });
  });

  describe('SET_NEW_PROFILE_NAME', () => {
    it('sets newProfileName', () => {
      const result = appReducer(freshState(), {
        type: ACTIONS.SET_NEW_PROFILE_NAME,
        payload: 'Pro Diver',
      });
      expect(result.newProfileName).toBe('Pro Diver');
    });
  });

  describe('SET_NEW_PROFILE_MAX_HOLD', () => {
    it('sets newProfileMaxHold', () => {
      const result = appReducer(freshState(), {
        type: ACTIONS.SET_NEW_PROFILE_MAX_HOLD,
        payload: '300',
      });
      expect(result.newProfileMaxHold).toBe('300');
    });
  });

  // -----------------------------------------------------------------------
  // Default case
  // -----------------------------------------------------------------------
  describe('default case', () => {
    it('returns state unchanged for unknown action type', () => {
      const state = freshState();
      const result = appReducer(state, { type: 'UNKNOWN_ACTION' } as any);
      expect(result).toBe(state);
    });
  });
});
