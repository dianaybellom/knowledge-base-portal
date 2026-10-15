import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { documentsApi } from '../api/endpoints';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Icon } from '../components/Icon';
import { MarkdownView } from '../components/MarkdownView';
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '../components/StateViews';
import { TableOfContents, useHeadings } from '../components/TableOfContents';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { documentTypeLabel, isDocumentType } from '../utils/catalog';
import { formatDate } from '../utils/format';
import { NotFoundPage } from './NotFoundPage';

function DocumentSkeleton() {
  return (
    <LoadingRegion label="Cargando la sección…">
      <div className="container page" aria-hidden="true">
        <Skeleton width="20rem" />
        <Skeleton width="24rem" height="2rem" className="skeleton--spaced" />
        <Skeleton width="10rem" />
        <div className="detail-section">
          {['100%', '96%', '88%', '100%', '60%'].map((width, index) => (
            <Skeleton key={index} width={width} />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

export function DocumentPage() {
  const { code, type } = useParams();
  const validType = isDocumentType(type);
  const sectionLabel = documentTypeLabel(type);
  const contentRef = useRef(null);

  const { data, error, loading, retry } = useApi(
    (options) => (validType ? documentsApi.get(code, type, options) : Promise.resolve(null)),
    [code, type, validType]
  );
  const document = data?.document;
  const headings = useHeadings(contentRef, document?.content);
  useDocumentTitle(document ? `${sectionLabel} · ${document.solution.name}` : sectionLabel);

  if (!validType) return <NotFoundPage message="Esta sección no existe." />;
  if (loading) return <DocumentSkeleton />;

  if (error?.status === 404) {
    // 404 puede ser la solución inexistente o la sección todavía sin contenido.
    const isMissingSection = error.message.includes('sección');
    if (!isMissingSection) return <NotFoundPage message={error.message} />;
    return (
      <div className="container page">
        <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Solución', to: `/solutions/${code}` }, { label: sectionLabel }]} />
        <h1 className="page-title">{sectionLabel}</h1>
        <EmptyState
          icon="document"
          title="Esta sección todavía no tiene contenido"
          message="Revisa las otras secciones de la solución mientras se publica."
          action={
            <Link to={`/solutions/${code}`} className="button button--secondary">
              <Icon name="arrowLeft" size={16} />
              Volver a la solución
            </Link>
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <ErrorState error={error} onRetry={retry} />
      </div>
    );
  }

  return (
    <div className="container page">
      <Breadcrumbs
        items={[
          { label: 'Inicio', to: '/' },
          { label: document.solution.name, to: `/solutions/${document.solution.code}` },
          { label: sectionLabel },
        ]}
      />

      {/* Orden del DOM: título → tabla de contenidos → contenido. En móvil se ve en ese orden
          (la tabla, plegada); en escritorio el grid ubica la tabla en la columna derecha. */}
      <article className="document-layout" aria-labelledby="document-title">
        <header className="document-layout__header">
          <h1 id="document-title" className="page-title">
            {sectionLabel}
          </h1>
          <p className="document-header__date">
            Actualizado el <time dateTime={document.updatedAt}>{formatDate(document.updatedAt)}</time>
          </p>
        </header>

        <aside className="document-layout__aside">
          <TableOfContents headings={headings} />
        </aside>

        <div className="document-layout__content" ref={contentRef}>
          <MarkdownView content={document.content} />
        </div>
      </article>
    </div>
  );
}
