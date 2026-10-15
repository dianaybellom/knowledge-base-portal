import { useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { componentsApi, solutionsApi } from '../api/endpoints';
import { StatusBadge, TypeBadge } from '../components/Badges';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Icon } from '../components/Icon';
import { MarkdownView } from '../components/MarkdownView';
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { DOCUMENT_TYPES, documentTypeLabel } from '../utils/catalog';
import { formatDate, initialsOf } from '../utils/format';
import { splitByHeadings } from '../utils/markdownSections';
import { NotFoundPage } from './NotFoundPage';

function Members({ members }) {
  const po = members.filter((member) => member.role === 'po');
  const devs = members.filter((member) => member.role === 'dev');
  const groups = [
    { key: 'po', label: 'PO', title: 'Product Owner', people: po },
    { key: 'dev', label: 'Devs', title: 'Desarrolladores', people: devs },
  ].filter((group) => group.people.length > 0);

  if (groups.length === 0) {
    return <p className="members__empty">Sin responsables asignados.</p>;
  }

  return (
    <dl className="members">
      {groups.map((group) => (
        <div key={group.key} className="members__group">
          {/* La etiqueta ocupa tantas filas como personas tenga el grupo. */}
          <dt className="members__role" style={{ gridRow: `span ${group.people.length}` }}>
            <abbr title={group.title}>{group.label}</abbr>
          </dt>
          {group.people.map((person) => (
            <dd key={person.id} className="members__person">
              <span className="avatar avatar--small" aria-hidden="true">
                {initialsOf(person.name)}
              </span>
              {person.name}
            </dd>
          ))}
        </div>
      ))}
    </dl>
  );
}

function DownloadButton({ component }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!component.hasFile) {
    return <span className="text-muted">Sin instalable</span>;
  }

  async function handleDownload() {
    setBusy(true);
    try {
      const { url } = await componentsApi.download(component.id);
      // El archivo se guarda como adjunto (Content-Disposition), así que la página no cambia.
      window.location.assign(url);
      showToast(`Descarga iniciada: ${component.fileName}`, { type: 'info', icon: 'download' });
    } catch (err) {
      showToast(err.message, { type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="button button--primary button--small"
      onClick={handleDownload}
      disabled={busy}
      aria-label={`Descargar ${component.name} versión ${component.version}`}
    >
      <Icon name="download" size={16} />
      {busy ? 'Preparando…' : 'Descargar'}
    </button>
  );
}

// Tarjeta con título de sección; agrupa visualmente un bloque de la ficha (Gestalt: región común).
function DetailCard({ title, className = '', children }) {
  const titleId = useId();
  return (
    <section className={`card detail-card ${className}`} aria-labelledby={titleId}>
      <h2 id={titleId} className="detail-card__title">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SolutionSkeleton() {
  return (
    <LoadingRegion label="Cargando la solución…">
      <div className="container page" aria-hidden="true">
        <Skeleton width="16rem" />
        <div className="detail-layout">
          <div className="card detail-card">
            <Skeleton width="22rem" height="2rem" />
            <Skeleton width="12rem" height="1.5rem" />
          </div>
          <div className="card detail-card">
            <Skeleton width="8rem" height="1.25rem" />
            <Skeleton width="100%" />
            <Skeleton width="85%" />
          </div>
          <div className="detail-columns">
            <div className="card detail-card">
              <Skeleton width="8rem" height="1.25rem" />
              <Skeleton width="100%" height="4rem" />
            </div>
            <div className="card detail-card">
              <Skeleton width="8rem" height="1.25rem" />
              <Skeleton width="100%" height="4rem" />
            </div>
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

export function SolutionPage() {
  const { code } = useParams();
  const { data, error, loading, retry } = useApi((options) => solutionsApi.get(code, options), [code]);
  const solution = data?.solution;
  useDocumentTitle(solution?.name ?? 'Solución');
  const { user } = useAuth();
  const canEdit = user?.role === 'author' || user?.role === 'admin';

  if (loading) return <SolutionSkeleton />;
  if (error?.status === 404) return <NotFoundPage message="No encontramos esta solución. Puede que se haya eliminado o que el enlace esté incompleto." />;
  if (error) {
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={retry} />
      </div>
    );
  }

  const documentsByType = new Map(solution.documents.map((document) => [document.type, document]));
  const documents = DOCUMENT_TYPES.filter((type) => documentsByType.has(type.value));
  // La descripción es un solo Markdown: el texto inicial va en "Descripción" y cada "## …"
  // (por ejemplo, Funcionalidades) se muestra en su propia tarjeta.
  const description = splitByHeadings(solution.description);

  return (
    <>
      {/* Encabezado: banda blanca a todo el ancho con migas, título y responsables */}
      <header className="detail-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Soluciones', to: '/' }, { label: solution.name }]} />

          <div className="detail-header">
            <div className="detail-header__main">
              <h1 className="page-title">{solution.name}</h1>
              <div className="detail-header__badges">
                <TypeBadge type={solution.type} />
                <StatusBadge status={solution.docStatus} />
              </div>
              {canEdit && (
                <div>
                  <Link to={`/manage/solutions/${solution.code}/edit`} className="button button--secondary button--small">
                    <Icon name="edit" size={16} />
                    Editar solución
                  </Link>
                </div>
              )}
            </div>
            <aside className="detail-header__members" aria-label="Responsables">
              <Members members={solution.members} />
            </aside>
          </div>
        </div>
      </header>

      <div className="container detail-layout">

        {description.intro && (
          <DetailCard title="Descripción">
            <MarkdownView content={description.intro} />
          </DetailCard>
        )}

        {description.sections.map((section) => (
          <DetailCard key={section.title} title={section.title}>
            <MarkdownView content={section.content} className="markdown--description" />
          </DetailCard>
        ))}

        {/* Secciones y descargables en paralelo para aprovechar el ancho */}
        <div className="detail-columns">
          <DetailCard title="Secciones">
            {documents.length === 0 ? (
              <EmptyState icon="document" title="Todavía no hay documentación publicada" message="Las secciones aparecerán aquí cuando un autor las publique." />
            ) : (
              <ul className="document-grid">
                {documents.map((type) => (
                  <li key={type.value}>
                    <article className="card card--interactive document-card">
                      <span className="document-card__icon" aria-hidden="true">
                        <Icon name="document" size={20} />
                      </span>
                      <div>
                        <h3 className="document-card__title">
                          <Link to={`/solutions/${solution.code}/docs/${type.value}`} className="card__link">
                            {documentTypeLabel(type.value)}
                          </Link>
                        </h3>
                        <p className="document-card__date">
                          Última actualización:{' '}
                          <time dateTime={documentsByType.get(type.value).updatedAt}>
                            {formatDate(documentsByType.get(type.value).updatedAt)}
                          </time>
                        </p>
                      </div>
                      <Icon name="chevronRight" className="document-card__arrow" />
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </DetailCard>

          <DetailCard title="Componentes">
            {solution.components.length === 0 ? (
              <EmptyState icon="package" title="Aún no hay componentes" message="Cuando se publique un instalable, podrás descargarlo desde aquí." />
            ) : (
              <ul className="component-list">
                {solution.components.map((component) => (
                  <li key={component.id} className="component-list__item">
                    <span className="component-list__icon" aria-hidden="true">
                      <Icon name="package" size={20} />
                    </span>
                    <div className="component-list__info">
                      <p className="component-list__name">{component.name}</p>
                      <p className="component-list__version">Versión {component.version.replace(/^v/i, '')}</p>
                    </div>
                    <DownloadButton component={component} />
                  </li>
                ))}
              </ul>
            )}
          </DetailCard>
        </div>
      </div>
    </>
  );
}
