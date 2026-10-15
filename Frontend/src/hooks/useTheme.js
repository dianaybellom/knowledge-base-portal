import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'kbp_theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme() {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

// Tema actual ('light' | 'dark'). public/theme-init.js ya lo aplicó antes de cargar React;
// este hook lo mantiene sincronizado y guarda la elección explícita de la persona.
export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || readStoredTheme() || systemTheme()
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Mientras la persona no elija un tema, se sigue el del sistema si este cambia.
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    function handleChange(event) {
      if (!readStoredTheme()) setTheme(event.matches ? 'dark' : 'light');
    }
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Sin localStorage el cambio dura solo esta visita.
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
