import { Link } from 'react-router-dom';
import { StatusBadge, TypeBadge } from './Badges';
import { Skeleton } from './StateViews';

// Toda la tarjeta es clicable, pero el enlace real es el título (un solo punto de tabulación).
export function SolutionCard({ solution, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;
  return (
    <article className="card card--interactive solution-card">
      <div className="solution-card__meta">
        <TypeBadge type={solution.type} />
      </div>
      <Heading className="solution-card__title">
        <Link to={`/solutions/${solution.code}`} className="card__link">
          {solution.name}
        </Link>
      </Heading>
      <p className="solution-card__summary">{solution.summary}</p>
      <div className="solution-card__footer">
        <StatusBadge status={solution.docStatus} />
      </div>
    </article>
  );
}

export function SolutionCardSkeleton() {
  return (
    <div className="card solution-card" aria-hidden="true">
      <Skeleton width="5.5rem" height="1.25rem" />
      <Skeleton width="70%" height="1.25rem" />
      <Skeleton width="100%" />
      <Skeleton width="85%" />
    </div>
  );
}
