import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { getStoredToken, storeToken, UNAUTHORIZED_EVENT } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Mientras se valida el token guardado, no se decide si redirigir al login.
  const [checking, setChecking] = useState(() => Boolean(getStoredToken()));
  // Aviso para la pantalla de ingreso (por ejemplo, "Tu sesión expiró").
  const [sessionNotice, setSessionNotice] = useState(null);

  useEffect(() => {
    if (!getStoredToken()) return;
    const controller = new AbortController();
    authApi
      .me({ signal: controller.signal })
      .then(({ user: current }) => setUser(current))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        storeToken(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    function handleUnauthorized(event) {
      storeToken(null);
      setUser(null);
      setSessionNotice(event.detail || 'Tu sesión terminó. Inicia sesión de nuevo.');
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const startSession = useCallback(({ token, user: sessionUser }) => {
    storeToken(token);
    setUser(sessionUser);
    setSessionNotice(null);
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await authApi.login(credentials)),
    [startSession]
  );

  const register = useCallback(
    async (data) => startSession(await authApi.register(data)),
    [startSession]
  );

  const logout = useCallback(() => {
    storeToken(null);
    setUser(null);
    setSessionNotice('Cerraste sesión correctamente.');
  }, []);

  const value = useMemo(
    () => ({ user, checking, sessionNotice, login, register, logout }),
    [user, checking, sessionNotice, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
