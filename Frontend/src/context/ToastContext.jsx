import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';

const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 5000;
const TOAST_TITLES = { info: 'Información', success: 'Listo', error: 'Error' };
const TOAST_ICONS = { info: 'download', success: 'check', error: 'alert' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  // showToast('Descarga iniciada…', { type: 'info', icon: 'download' })
  const showToast = useCallback(
    (message, { type = 'success', title, icon } = {}) => {
      const id = nextId.current++;
      setToasts((current) => [
        ...current.slice(-2),
        { id, type, message, title: title ?? TOAST_TITLES[type], icon: icon ?? TOAST_ICONS[type] },
      ]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* La región existe siempre para que los lectores de pantalla anuncien los avisos nuevos. */}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span className="toast__icon" aria-hidden="true">
              <Icon name={toast.icon} />
            </span>
            <div className="toast__body">
              <p className="toast__title">{toast.title}</p>
              <p className="toast__message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="icon-button toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Cerrar aviso"
            >
              <Icon name="close" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
}
