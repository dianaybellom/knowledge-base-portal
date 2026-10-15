import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { solutionsApi } from '../api/endpoints';
import { CoverageCard } from '../components/CoverageCard';
import { Icon } from '../components/Icon';
import { SearchField } from '../components/SearchField';
import { SolutionCard, SolutionCardSkeleton } from '../components/SolutionCard';
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '../components/StateViews';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { SOLUTION_TYPES, solutionTypeLabel } from '../utils/catalog';
import { formatDate } from '../utils/format';

const SEARCH_DEBOUNCE_MS = 300;
const RECENT_LIMIT = 5;
const TYPE_ICONS = { addon: 'package', plugin: 'plug', integration: 'link' };

function CardGrid({ loading, children, skeletons = 3 }) {
  if (loading) {
    return (
      <LoadingRegion label="Cargando soluciones…">
        <div className="card-grid">
          {Array.from({ length: skeletons }, (_, index) => (
            <SolutionCardSkeleton key={index} />
          ))}
        </div>
      </LoadingRegion>
    );
  }
  return <div className="card-grid">{children}</div>;
}

// Resultados de la búsqueda o del tipo elegido en su tarjeta (consulta la API con los parámetros de la URL).
function SearchResults({ filters, onClear, focusOnMount }) {
  const results = useApi((options) => solutionsApi.list(filters, options), [filters.search, filters.type]);
  const solutions = results.data?.solutions ?? [];
  const titleRef = useRef(null);

  useEffect(() => {
    if (focusOnMount) titleRef.current?.focus();
  }, [focusOnMount]);

  const activeFilters = [
    filters.search && `“${filters.search}”`,
    filters.type && solutionTypeLabel(filters.type),
  ].filter(Boolean);

  return (
    <section className="page-section" aria-labelledby="results-title">
      <div className="section-header">
        <h2 id="results-title" className="section-title" ref={titleRef} tabIndex={-1}>
          Resultados
        </h2>
        <button type="button" className="button button--ghost" onClick={onClear}>
          <Icon name="close" size={16} />
          Limpiar búsqueda
        </button>
      </div>

      <p className="results-summary" aria-live="polite">
        {results.loading
          ? 'Buscando…'
          : !results.error &&
            `${solutions.length} ${solutions.length === 1 ? 'solución encontrada' : 'soluciones encontradas'} para ${activeFilters.join(' · ')}`}
      </p>

      {results.error ? (
        <ErrorState error={results.error} onRetry={results.retry} title="No pudimos completar la búsqueda" />
      ) : !results.loading && solutions.length === 0 ? (
        <EmptyState
          icon="search"
          title="No encontramos soluciones con esos criterios"
          message="Prueba con otras palabras o revisa la ortografía."
          action={
            <button type="button" className="button button--secondary" onClick={onClear}>
              Ver todas las soluciones
            </button>
          }
        />
      ) : (
        <CardGrid loading={results.loading}>
          {solutions.map((solution) => (
            <SolutionCard key={solution.id} solution={solution} />
          ))}
        </CardGrid>
      )}
    </section>
  );
}

// Cada fila muestra la última publicación de la sección Novedades de la solución
// (o "Solución actualizada" si aún no tiene esa sección) y enlaza a ella.
function RecentList({ updates }) {
  return (
    <ul className="recent-list">
      {updates.map((update) => {
        const target =
          update.source === 'release-notes'
            ? `/solutions/${update.solution.code}/docs/release-notes`
            : `/solutions/${update.solution.code}`;
        return (
          <li key={update.solution.code} className="recent-list__item">
            <Link to={target} className="recent-list__name">
              {update.solution.name}
            </Link>
            <div className="recent-list__detail">
              <p className="recent-list__title">{update.title}</p>
              {update.excerpt && <p className="recent-list__summary">{update.excerpt}</p>}
              <p className="recent-list__date">
                <time dateTime={update.publishedAt}>{formatDate(update.publishedAt)}</time>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function HomePage() {
  useDocumentTitle('Soluciones');
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => ({
      search: searchParams.get('search') ?? '',
      type: searchParams.get('type') ?? '',
    }),
    [searchParams]
  );
  const isFiltering = Boolean(filters.search || filters.type);

  // El campo de texto se actualiza al instante; la URL (y la búsqueda) espera a que se deje de escribir.
  const [searchText, setSearchText] = useState(filters.search);
  const searchInputRef = useRef(null);
  // Si la búsqueda cambia desde fuera (el buscador del encabezado o el botón atrás), se refleja
  // en el campo; se compara sin espacios para no borrar el espacio que el usuario está escribiendo.
  useEffect(() => {
    setSearchText((current) => (current.trim() === filters.search ? current : filters.search));
  }, [filters.search]);
  useEffect(() => {
    if (searchText.trim() === filters.search) return undefined;
    const timer = window.setTimeout(() => updateFilter('search', searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchText, filters.search]);

  // Al elegir un tipo desde su tarjeta, el foco pasa a los resultados (la tarjeta desaparece).
  const [focusResults, setFocusResults] = useState(false);

  function updateFilter(key, value) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: key === 'search' }
    );
  }

  function clearFilters() {
    setSearchText('');
    setSearchParams({});
    setFocusResults(false);
    searchInputRef.current?.focus();
  }

  const catalog = useApi((options) => solutionsApi.list({}, options), []);
  const coverage = useApi((options) => solutionsApi.coverage(options), []);
  const allSolutions = catalog.data?.solutions ?? [];

  const countsByType = useMemo(() => {
    const counts = Object.fromEntries(SOLUTION_TYPES.map((type) => [type.value, 0]));
    allSolutions.forEach((solution) => {
      counts[solution.type] = (counts[solution.type] ?? 0) + 1;
    });
    return counts;
  }, [allSolutions]);

  const recentUpdates = useApi((options) => solutionsApi.recentUpdates(RECENT_LIMIT, options), []);
  const featured = allSolutions.filter((solution) => solution.docStatus === 'complete');

  return (
    <>
      <section className="home-hero" aria-labelledby="page-title">
        <div className="container container--narrow">
          <h1 id="page-title" className="home-hero__title">
            ¿Qué necesitas resolver hoy?
          </h1>
          <p className="home-hero__subtitle">Busca manuales, videos y documentación de nuestras soluciones.</p>
          <form role="search" className="home-hero__search" onSubmit={(event) => event.preventDefault()}>
            <SearchField
              id="home-search"
              label="Buscar soluciones"
              value={searchText}
              onChange={setSearchText}
              onClear={() => setSearchText('')}
              placeholder="Busca una solución o funcionalidad"
              size="large"
              inputRef={searchInputRef}
            />
          </form>
        </div>
      </section>

      <div className="container">
        {/* Tarjetas de tipo: se superponen al borde inferior del banner y siempre están visibles. */}
        <section className="home-types" aria-labelledby="types-title">
          <h2 id="types-title" className="visually-hidden">
            Explorar soluciones por tipo
          </h2>
          <ul className="type-grid">
            {SOLUTION_TYPES.map((type) => (
              <li key={type.value}>
                <button
                  type="button"
                  className="card card--interactive type-card"
                  aria-pressed={filters.type === type.value}
                  onClick={() => {
                    setFocusResults(true);
                    updateFilter('type', type.value);
                  }}
                >
                  <span className="type-card__icon" aria-hidden="true">
                    <Icon name={TYPE_ICONS[type.value]} size={22} />
                  </span>
                  <span className="type-card__label">{type.label}</span>
                  <span className="type-card__count">
                    {catalog.loading ? (
                      <Skeleton width="1.5rem" />
                    ) : (
                      `${countsByType[type.value]} ${countsByType[type.value] === 1 ? 'solución' : 'soluciones'}`
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {isFiltering ? (
          <SearchResults filters={filters} onClear={clearFilters} focusOnMount={focusResults} />
        ) : catalog.error ? (
          <div className="page-section">
            <ErrorState error={catalog.error} onRetry={catalog.retry} />
          </div>
        ) : (
          <>
            <div className="page-section home-split">
              <section aria-labelledby="recent-title">
                <h2 id="recent-title" className="section-title">
                  Novedades recientes
                </h2>
                {recentUpdates.error ? (
                  <ErrorState error={recentUpdates.error} onRetry={recentUpdates.retry} title="No pudimos cargar las novedades" />
                ) : recentUpdates.loading ? (
                  <LoadingRegion label="Cargando novedades…">
                    <div className="recent-list">
                      {[1, 2, 3].map((key) => (
                        <div key={key} className="recent-list__item">
                          <Skeleton width="60%" />
                          <Skeleton width="90%" />
                        </div>
                      ))}
                    </div>
                  </LoadingRegion>
                ) : recentUpdates.data.updates.length === 0 ? (
                  <EmptyState title="Todavía no hay novedades" message="Las publicaciones de la sección Novedades de cada solución aparecerán aquí." />
                ) : (
                  <RecentList updates={recentUpdates.data.updates} />
                )}
              </section>

              <section aria-labelledby="coverage-title">
                <h2 id="coverage-title" className="section-title">
                  Estado de la documentación
                </h2>
                {coverage.error ? (
                  <ErrorState error={coverage.error} onRetry={coverage.retry} title="No pudimos calcular la cobertura" />
                ) : (
                  <CoverageCard coverage={coverage.data} />
                )}
              </section>
            </div>

            <section className="page-section" aria-labelledby="featured-title">
              <h2 id="featured-title" className="section-title">
                Soluciones destacadas
              </h2>
              <p className="section-description">Soluciones con la documentación completa.</p>
              {!catalog.loading && featured.length === 0 ? (
                <EmptyState
                  icon="document"
                  title="Aún no hay soluciones con la documentación completa"
                  message="Cuando una solución tenga toda su documentación, aparecerá aquí."
                />
              ) : (
                <CardGrid loading={catalog.loading} skeletons={2}>
                  {featured.map((solution) => (
                    <SolutionCard key={solution.id} solution={solution} />
                  ))}
                </CardGrid>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
