import { Icon } from './Icon';

// Bloque gris animado que ocupa el lugar del contenido mientras carga.
export function Skeleton({ width = '100%', height = '1rem', className = '' }) {
  return <span className={`skeleton ${className}`} style={{ width, height }} aria-hidden="true" />;
}

// Indica a los lectores de pantalla que la vista está cargando.
export function LoadingRegion({ label, children }) {
  return (
    <div role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}

export function EmptyState({ icon = 'inbox', title, message, action }) {
  return (
    <div className="state-view">
      <span className="state-view__icon" aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <p className="state-view__title">{title}</p>
      {message && <p className="state-view__message">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'No pudimos cargar esta información' }) {
  return (
    <div className="state-view state-view--error" role="alert">
      <span className="state-view__icon" aria-hidden="true">
        <Icon name="alert" size={28} />
      </span>
      <p className="state-view__title">{title}</p>
      <p className="state-view__message">{error?.message}</p>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
