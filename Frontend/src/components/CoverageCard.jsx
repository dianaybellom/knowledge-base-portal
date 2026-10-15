import { Skeleton } from './StateViews';

// Indicador RF-10: porcentaje de soluciones con documentación completa.
export function CoverageCard({ coverage }) {
  if (!coverage) {
    return (
      <div className="coverage-card" aria-hidden="true">
        <Skeleton width="5rem" height="2.25rem" />
        <Skeleton width="60%" />
        <Skeleton width="100%" height="0.5rem" />
      </div>
    );
  }

  const { coveragePercent, total, complete, partial, pending } = coverage;
  return (
    <div className="coverage-card">
      <p className="coverage-card__value">{coveragePercent}%</p>
      <p className="coverage-card__label" id="coverage-label">
        soluciones documentadas
      </p>
      <div
        className="progress"
        role="progressbar"
        aria-labelledby="coverage-label"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={coveragePercent}
        aria-valuetext={`${coveragePercent}%: ${complete} de ${total} soluciones con documentación completa`}
      >
        <span className="progress__bar" style={{ width: `${coveragePercent}%` }} />
      </div>
      <dl className="coverage-card__breakdown">
        <div>
          <dt>Completas</dt>
          <dd>{complete}</dd>
        </div>
        <div>
          <dt>Parciales</dt>
          <dd>{partial}</dd>
        </div>
        <div>
          <dt>Pendientes</dt>
          <dd>{pending}</dd>
        </div>
      </dl>
    </div>
  );
}
