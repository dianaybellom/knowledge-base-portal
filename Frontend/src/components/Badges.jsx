import { docStatusLabel, solutionTypeLabel } from '../utils/catalog';

export function TypeBadge({ type }) {
  return <span className="badge badge--type">{solutionTypeLabel(type)}</span>;
}

// El estado se comunica con texto además del color (no depende solo del color).
export function StatusBadge({ status }) {
  return (
    <span className={`badge badge--status badge--${status}`}>
      <span className="badge__dot" aria-hidden="true" />
      Documentación {docStatusLabel(status).toLowerCase()}
    </span>
  );
}
