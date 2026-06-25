import { authService } from '../../services/auth.service';
import {
  loginSuccess,
  logout,
  setAuthLoading,
  setAuthError,
  syncProfile,    // background fetch — never overwrites overrides
  updateProfile,  // explicit user save — persists to override store
} from './authSlice';

// ── Login ──────────────────────────────────────────────────────────────────────
export const loginThunk = (credentials) => async (dispatch) => {
  dispatch(setAuthLoading(true));
  try {
    const data  = await authService.login(credentials);
    const token = data.token || data.accessToken || data.data?.token || data.data?.accessToken;
    const user  = data.user  || data.data?.user  || data.data;
    if (!token) throw new Error('No token returned from server.');
    // loginSuccess automatically re-applies the durable override store
    dispatch(loginSuccess({ token, user }));
    return { success: true };
  } catch (err) {
    let msg = 'Login failed.';
    const data = err?.response?.data;
    if (data) {
      if (Array.isArray(data.details) && data.details.length > 0) {
        msg = data.details[0].message || data.details[0].msg ||
              (typeof data.details[0] === 'string' ? data.details[0] : JSON.stringify(data.details[0]));
      } else if (typeof data.details === 'string') {
        msg = data.details;
      } else if (data.message) {
        msg = data.message;
      }
    } else if (err.message) {
      msg = err.message;
    }
    if (typeof msg !== 'string') msg = JSON.stringify(msg);

    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes('wrong password')) {
      msg = 'Almost there! Please check your password and try again';
    } else if (
      lowerMsg.includes('user not found') ||
      lowerMsg.includes('invalid email') ||
      lowerMsg.includes('wrong email') ||
      lowerMsg.includes('wrong username') ||
      lowerMsg.includes('incorrect email') ||
      lowerMsg.includes('not found') ||
      (lowerMsg.includes('login failed') && lowerMsg.includes('email:'))
    ) {
      msg = "Hmm... we couldn't recognize that username.";
    } else if (lowerMsg.includes('timeout')) {
      msg = 'Well... that took a while. Please log in again.';
    }

    dispatch(setAuthError(msg));
    return { success: false, error: msg };
  }
};

// ── Register ───────────────────────────────────────────────────────────────────
export const registerThunk = (payload) => async (dispatch) => {
  dispatch(setAuthLoading(true));
  try {
    const data  = await authService.register(payload);
    const token = data.token || data.accessToken || data.data?.token || data.data?.accessToken;
    const user  = data.user  || data.data?.user  || data.data;
    if (token) {
      dispatch(loginSuccess({ token, user }));
    } else {
      dispatch(setAuthLoading(false));
    }
    return { success: true };
  } catch (err) {
    let msg = 'Registration failed.';
    const data = err?.response?.data;
    if (data) {
      if (Array.isArray(data.details) && data.details.length > 0) {
        msg = data.details[0].message || data.details[0].msg ||
              (typeof data.details[0] === 'string' ? data.details[0] : JSON.stringify(data.details[0]));
      } else if (typeof data.details === 'string') {
        msg = data.details;
      } else if (data.message) {
        msg = data.message;
      }
    } else if (err.message) {
      msg = err.message;
    }
    if (typeof msg !== 'string') msg = JSON.stringify(msg);

    dispatch(setAuthError(msg));
    return { success: false, error: msg };
  }
};

// ── Logout ─────────────────────────────────────────────────────────────────────
export const logoutThunk = () => async (dispatch) => {
  try {
    await authService.logout();
  } catch (_) {
    // Ignore server errors — always clear local state
  } finally {
    dispatch(logout());
  }
};

// ── Fetch Profile (background sync) ───────────────────────────────────────────
// Uses syncProfile so the durable override store is ALWAYS re-applied on top
// of whatever the backend returns — user's picture is never lost.
export const fetchProfileThunk = () => async (dispatch) => {
  try {
    const data = await authService.profile();
    const user = data.user || data.data || data;
    // Normalise possible alternate field names the backend might use
    const normalisedUser = {
      ...user,
      profilePicture: user?.profilePicture || user?.avatar || user?.image || '',
    };
    // syncProfile re-applies the override store on top — never overwrites user's picture
    dispatch(syncProfile(normalisedUser));
  } catch (_) {
    // Non-fatal — user stays logged in if token is valid
  }
};

// ── Update Profile (explicit user action) ─────────────────────────────────────
// Uses updateProfile which saves to the durable override store so the
// new picture survives page navigation, background fetches, and logout → login.
export const updateProfileThunk = (payload) => async (dispatch) => {
  try {
    const data = await authService.updateProfile(payload);
    const backendUser = data.user || data.data?.user || data.data || data;

    // Normalise alternate field names
    const backendPicture =
      backendUser?.profilePicture ||
      backendUser?.avatar ||
      backendUser?.image ||
      '';

    // Build the merged user: backend fields first, then what we sent
    // (our payload wins so the UI reflects exactly what the user chose)
    const mergedUser = {
      ...backendUser,
      ...payload,
      profilePicture: payload?.profilePicture || backendPicture || '',
    };

    // updateProfile saves to the durable override store
    dispatch(updateProfile(mergedUser));
    return { success: true, user: mergedUser };
  } catch (err) {
    let msg = 'Profile update failed.';
    const respData = err?.response?.data;
    if (respData) {
      if (Array.isArray(respData.details) && respData.details.length > 0) {
        msg = respData.details[0].message || respData.details[0].msg || JSON.stringify(respData.details[0]);
      } else if (typeof respData.details === 'string') {
        msg = respData.details;
      } else if (respData.message) {
        msg = respData.message;
      }
    } else if (err.message) {
      msg = err.message;
    }
    return { success: false, error: msg };
  }
};
