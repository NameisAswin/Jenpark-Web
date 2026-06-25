import { createSlice } from '@reduxjs/toolkit';

const TOKEN_KEY   = 'jenpark_web_token';
const USER_KEY    = 'jenpark_web_user';
// Separate keys that survive logout — keyed per email so different users don't share
const PICTURE_KEY = 'jenpark_profile_picture_override';
const NAME_KEY    = 'jenpark_profile_name_override';

/* ─── Override helpers ──────────────────────────────────────────────────────── */
function getPictureOverride(email) {
  if (!email) return '';
  try {
    return JSON.parse(localStorage.getItem(PICTURE_KEY) || '{}')[email] || '';
  } catch { return ''; }
}

function setPictureOverride(email, picture) {
  if (!email) return;
  try {
    const map = JSON.parse(localStorage.getItem(PICTURE_KEY) || '{}');
    if (picture) { map[email] = picture; } else { delete map[email]; }
    localStorage.setItem(PICTURE_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

function getNameOverride(email) {
  if (!email) return '';
  try {
    return JSON.parse(localStorage.getItem(NAME_KEY) || '{}')[email] || '';
  } catch { return ''; }
}

function setNameOverride(email, name) {
  if (!email) return;
  try {
    const map = JSON.parse(localStorage.getItem(NAME_KEY) || '{}');
    if (name) { map[email] = name; } else { delete map[email]; }
    localStorage.setItem(NAME_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

/** Merge overrides ON TOP of a backend-returned user object */
function applyOverrides(user) {
  if (!user) return user;
  const email   = user.email || user.username || '';
  const picture = getPictureOverride(email);
  const name    = getNameOverride(email);
  return {
    ...user,
    ...(picture ? { profilePicture: picture } : {}),
    ...(name    ? { name }                    : {}),
  };
}

/* ─── Initial state ─────────────────────────────────────────────────────────── */
const storedUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null');

const initialState = {
  token:   localStorage.getItem(TOKEN_KEY) || null,
  // Apply overrides immediately on load so the correct picture shows from the start
  user:    storedUser ? applyOverrides(storedUser) : null,
  loading: false,
  error:   null,
};

/* ─── Slice ─────────────────────────────────────────────────────────────────── */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, { payload }) {
      state.token   = payload.token;
      // Apply user-stored overrides over whatever the backend returned at login
      state.user    = applyOverrides(payload.user);
      state.loading = false;
      state.error   = null;
      localStorage.setItem(TOKEN_KEY, payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    },

    logout(state) {
      state.token   = null;
      state.user    = null;
      state.loading = false;
      state.error   = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Intentionally keep PICTURE_KEY and NAME_KEY — they survive logout
    },

    setAuthLoading(state, { payload }) {
      state.loading = payload;
    },

    setAuthError(state, { payload }) {
      state.error   = payload;
      state.loading = false;
    },

    /**
     * syncProfile — called by background fetches (fetchProfileThunk).
     * NEVER overwrites user-stored overrides; always re-applies them on top
     * of whatever the backend returned.
     */
    syncProfile(state, { payload }) {
      const email      = state.user?.email || payload?.email || '';
      const picOverride = getPictureOverride(email);
      const nameOverride = getNameOverride(email);
      state.user = {
        ...state.user,
        ...payload,
        // Override fields WIN over backend stale/test data
        ...(picOverride  ? { profilePicture: picOverride }  : {}),
        ...(nameOverride ? { name: nameOverride }            : {}),
      };
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    },

    /**
     * updateProfile — called by explicit user actions (updateProfileThunk).
     * Persists the new picture/name to the override store so they survive
     * logout → login and background refetches.
     */
    updateProfile(state, { payload }) {
      state.user = { ...state.user, ...payload };
      const email = state.user?.email || state.user?.username || '';
      // Save overrides — these survive logout and background fetches
      if (payload.profilePicture !== undefined) {
        setPictureOverride(email, payload.profilePicture);
      }
      if (payload.name !== undefined) {
        setNameOverride(email, payload.name);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    },
  },
});

export const {
  loginSuccess,
  logout,
  setAuthLoading,
  setAuthError,
  syncProfile,
  updateProfile,
} = authSlice.actions;

export const selectAuth            = (s) => s.auth;
export const selectIsAuthenticated = (s) => Boolean(s.auth.token);
export const selectUser            = (s) => s.auth.user;
export const selectIsAdmin         = (s) => s.auth.user?.role === 'admin';

export default authSlice.reducer;
