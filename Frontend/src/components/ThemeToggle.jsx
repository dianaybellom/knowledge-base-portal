import { useTheme } from '../hooks/useTheme';
import { Icon } from './Icon';

// Botón de la barra superior que alterna entre el modo claro y el oscuro.
// El ícono muestra el modo al que se va a cambiar (luna en claro, sol en oscuro).
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label="Modo oscuro"
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={20} />
    </button>
  );
}
