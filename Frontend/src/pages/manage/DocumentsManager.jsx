import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { documentsApi } from '../../api/endpoints';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormField } from '../../components/FormField';
import { Icon } from '../../components/Icon';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { ErrorState, LoadingRegion, Skeleton } from '../../components/StateViews';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';
import { DOCUMENT_TYPES, documentTypeLabel } from '../../utils/catalog';
import { formatDate } from '../../utils/format';

const MAX_CONTENT = 200000;

const SECTION_HINTS = {
  'release-notes':
    'Cada publicación empieza con un título ## (por ejemplo, ## Versión 2.1.0) y la más reciente va primero: su primer bloque se muestra en "Novedades recientes" de la página principal.',
};
const DEFAULT_HINT =
  'Markdown: ## y ### para títulos (forman la tabla de contenidos), listas y tablas. Para un video, pega el código para insertar (iframe) de YouTube o SharePoint, con un title que lo describa.';

export function DocumentsManager({ solution, onChanged }) {
  const { showToast } = useToast();
  const [type, setType] = useState(DOCUMENT_TYPES[0].value);
  const [pendingType, setPendingType] = useState(null);
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const existing = new Map(solution.documents.map((document) => [document.type, document]));
  const exists = existing.has(type);

  // Carga el contenido de la sección elegida (404 = todavía no existe: se empieza en blanco).
  const loaded = useApi(
    (options) =>
      documentsApi.get(solution.code, type, options).catch((err) => {
        if (err.status === 404) return null;
        throw err;
      }),
    [solution.code, type]
  );

  useEffect(() => {
    if (loaded.loading || loaded.error) return;
    const text = loaded.data?.document?.content ?? '';
    setContent(text);
    setSavedContent(text);
    setError(null);
  }, [loaded.data, loaded.loading, loaded.error]);

  const isDirty = content !== savedContent;
  useUnsavedChangesWarning(isDirty);

  function requestTypeChange(nextType) {
    if (nextType === type) return;
    if (isDirty) setPendingType(nextType);
    else setType(nextType);
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!content.trim()) {
      setError('El contenido no puede quedar vacío. Si quieres quitar la sección, usa "Eliminar sección".');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await documentsApi.save(solution.code, type, content);
      setSavedContent(content);
      showToast(`${exists ? 'Se guardó' : 'Se publicó'} la sección "${documentTypeLabel(type)}".`, { type: 'success' });
      await onChanged();
    } catch (err) {
      // Los errores de validación (por ejemplo, un video no permitido) se muestran junto al editor.
      setError(err.details?.length ? err.details.map((detail) => detail.message).join(' ') : err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await documentsApi.remove(solution.code, type);
      setContent('');
      setSavedContent('');
      showToast(`Se eliminó la sección "${documentTypeLabel(type)}".`, { type: 'success' });
      setConfirmDelete(false);
      await onChanged();
    } catch (err) {
      showToast(err.message, { type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="card detail-card" aria-labelledby="documents-manager-title">
      <div>
        <h2 id="documents-manager-title" className="detail-card__title">
          Secciones de documentación
        </h2>
        <p className="form-card__description">
          Cada sección es un documento Markdown completo. Elige cuál quieres escribir o editar.
        </p>
      </div>

      <FormField
        as="select"
        label="Sección"
        value={type}
        onChange={(event) => requestTypeChange(event.target.value)}
        hint={
          exists
            ? `Publicada · actualizada el ${formatDate(existing.get(type).updatedAt)}`
            : 'Todavía no tiene contenido: al guardar se publica.'
        }
      >
        {DOCUMENT_TYPES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} {existing.has(option.value) ? '· publicada' : '· sin contenido'}
          </option>
        ))}
      </FormField>

      {loaded.error ? (
        <ErrorState error={loaded.error} onRetry={loaded.retry} title="No pudimos cargar la sección" />
      ) : loaded.loading ? (
        <LoadingRegion label="Cargando la sección…">
          <Skeleton width="100%" height="16rem" />
        </LoadingRegion>
      ) : (
        <form onSubmit={handleSave} noValidate>
          <MarkdownEditor
            label={`Contenido de "${documentTypeLabel(type)}"`}
            value={content}
            onChange={(value) => {
              setContent(value);
              if (error) setError(null);
            }}
            error={error}
            maxLength={MAX_CONTENT}
            rows={18}
            hint={SECTION_HINTS[type] ?? DEFAULT_HINT}
          />
          <div className="form-actions">
            <button type="submit" className="button button--primary" disabled={saving || !isDirty}>
              {saving ? 'Guardando…' : exists ? 'Guardar sección' : 'Publicar sección'}
            </button>
            {exists && (
              <>
                <Link to={`/solutions/${solution.code}/docs/${type}`} className="button button--ghost">
                  Ver sección
                </Link>
                <button type="button" className="button button--danger-outline" onClick={() => setConfirmDelete(true)}>
                  <Icon name="trash" size={16} />
                  Eliminar sección
                </button>
              </>
            )}
            <p className="form-actions__status" aria-live="polite">
              {isDirty ? 'Hay cambios sin guardar.' : exists ? 'Sin cambios pendientes.' : ''}
            </p>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(pendingType)}
        tone="neutral"
        title="¿Descartar los cambios sin guardar?"
        message={<p>Tienes cambios en "{documentTypeLabel(type)}" que no se guardaron. Si cambias de sección, se perderán.</p>}
        confirmLabel="Descartar y cambiar"
        cancelLabel="Seguir editando"
        onConfirm={() => {
          setType(pendingType);
          setPendingType(null);
        }}
        onCancel={() => setPendingType(null)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={`¿Eliminar la sección "${documentTypeLabel(type)}"?`}
        message={<p>Su contenido dejará de mostrarse en la ficha. Esta acción no se puede deshacer.</p>}
        confirmLabel="Eliminar sección"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </section>
  );
}
