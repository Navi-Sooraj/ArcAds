/**
 * Auth context: user in state + localStorage.
 * User details are stored in localStorage when logged in and cleared on logout.
 * No JWT; API uses X-User-Id header from localStorage.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  USER: 'arcads_user',
  USER_ID: 'arcads_user_id',
};

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    const id = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!raw || !id) return null;
    const u = JSON.parse(raw);
    if (u && typeof u.id !== 'undefined' && String(u.id) === String(id)) return u;
    return null;
  } catch {
    return null;
  }
}

function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
}

function setStoredUser(userData) {
  if (!userData || typeof userData.id === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  localStorage.setItem(STORAGE_KEYS.USER_ID, String(userData.id));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    else clearStoredUser();
  }, []);

  const login = useCallback((userData) => {
    if (!userData?.id) return;
    setStoredUser(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearStoredUser();
  }, []);

  const updateUser = useCallback((userData) => {
    if (!userData?.id) return;
    setStoredUser(userData);
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
