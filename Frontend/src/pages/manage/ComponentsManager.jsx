import { useId, useRef, useState } from 'react';
import { componentsApi } from '../../api/endpoints';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormField } from '../../components/FormField';
import { Icon } from '../../components/Icon';
import { useToast } from '../../context/ToastContext';

const MAX_FILE_MB = 50;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ComponentsManager({ solution, onChanged }) {
  const { showToast } = useToast();
  const fileInputId = useId();
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  const [values, setValues] = useState({ name: '', version: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function update(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  function handleFileChange(event) {
    const selected = event.target.files?.[0] ?? null;
    setErrors((current) => ({ ...current, file: undefined }));
    if (selected && selected.size > MAX_FILE_MB * 1024 * 1024) {
      setErrors((current) => ({ ...current, file: `El archivo pesa ${formatSize(selected.size)}; el máximo es ${MAX_FILE_MB} MB.` }));
      event.target.value = '';
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Escribe el nombre del componente.';
    if (!values.version.trim()) nextErrors.version = 'Escribe la versión (ej.: 2.1.0).';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      (nextErrors.name ? nameInputRef.current : event.currentTarget.querySelector('[aria-invalid="true"]'))?.focus();
      return;
    }

    const formData = new FormData();
    formData.append('name', values.name.trim());
    formData.append('version', values.version.trim());
    if (file) formData.append('file', file);

    setUploading(true);
    try {
      await componentsApi.create(solution.code, formData);
      showToast(file ? `Componente agregado y archivo "${file.name}" subido.` : 'Componente agregado sin instalable.', { type: 'success' });
      setValues({ name: '', version: '' });
      clearFile();
      nameInputRef.current?.focus();
      await onChanged();
    } catch (err) {
      if (err.details?.length) setErrors(err.fieldErrors);
      showToast(err.message, { type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await componentsApi.remove(toDelete.id);
      showToast(`Se eliminó el componente "${toDelete.name}".`, { type: 'success' });
      setToDelete(null);
      await onChanged();
    } catch (err) {
      showToast(err.message, { type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="card detail-card" aria-labelledby="components-manager-title">
      <div>
        <h2 id="components-manager-title" className="detail-card__title">
          Componentes
        </h2>
        <p className="form-card__description">Instalables de la solución. Los consultores los descargan desde la ficha.</p>
      </div>

      {solution.components.length === 0 ? (
        <p className="text-muted">Esta solución todavía no tiene componentes.</p>
      ) : (
        <ul className="component-list">
          {solution.components.map((component) => (
            <li key={component.id} className="component-list__item">
              <span className="component-list__icon" aria-hidden="true">
                <Icon name="package" size={20} />
              </span>
              <div className="component-list__info">
                <p className="component-list__name">{component.name}</p>
                <p className="component-list__version">
                  Versión {component.version} · {component.hasFile ? component.fileName : 'sin instalable'}
                </p>
              </div>
              <button
                type="button"
                className="button button--danger-outline button--small"
                onClick={() => setToDelete(component)}
                aria-label={`Eliminar el componente ${component.name} versión ${component.version}`}
              >
                <Icon name="trash" size={16} />
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="component-form" onSubmit={handleSubmit} noValidate aria-labelledby="component-form-title">
        <h3 id="component-form-title" className="component-form__title">
          Agregar componente
        </h3>
        <div className="form-grid">
          <FormField label="Nombre" value={values.name} onChange={update('name')} error={errors.name} maxLength={120} inputRef={nameInputRef} />
          <FormField label="Versión" value={values.version} onChange={update('version')} error={errors.version} maxLength={30} placeholder="2.1.0" />
        </div>

        <div className={`form-field ${errors.file ? 'form-field--invalid' : ''}`}>
          <p className="form-field__label" id={`${fileInputId}-label`}>
            Instalable (opcional)
          </p>
          {/* El texto del selector nativo depende del idioma del navegador; se usa un control propio
              en español. El input real sigue siendo el que recibe el foco y el teclado. */}
          <div className="file-picker">
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              className="file-picker__input"
              onChange={handleFileChange}
              aria-labelledby={`${fileInputId}-label ${fileInputId}-button`}
              aria-describedby={`${fileInputId}-hint${errors.file ? ` ${fileInputId}-error` : ''}`}
              aria-invalid={errors.file ? 'true' : undefined}
            />
            <label htmlFor={fileInputId} className="file-picker__button" id={`${fileInputId}-button`}>
              <Icon name="upload" size={16} />
              Elegir archivo
            </label>
            <span className="file-picker__name" aria-hidden="true">
              {file ? file.name : 'Ningún archivo seleccionado'}
            </span>
          </div>
          <p id={`${fileInputId}-hint`} className="form-field__hint">
            Un archivo de hasta {MAX_FILE_MB} MB. Se guarda en el almacenamiento privado y se descarga con un enlace temporal.
          </p>
          {file && (
            <p className="file-input__selected">
              <Icon name="document" size={16} />
              {file.name} · {formatSize(file.size)}
              <button type="button" className="button button--ghost button--small" onClick={clearFile}>
                Quitar archivo
              </button>
            </p>
          )}
          {errors.file && (
            <p id={`${fileInputId}-error`} className="form-field__error">
              <Icon name="alert" size={16} />
              {errors.file}
            </p>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="button button--primary" disabled={uploading}>
            <Icon name={file ? 'upload' : 'plus'} size={16} />
            {uploading ? (file ? 'Subiendo archivo…' : 'Agregando…') : 'Agregar componente'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`¿Eliminar "${toDelete?.name ?? ''}"?`}
        message={
          <p>
            {toDelete?.hasFile
              ? `También se borrará su archivo "${toDelete.fileName}" del almacenamiento.`
              : 'El componente no tiene archivo asociado.'}{' '}
            Esta acción no se puede deshacer.
          </p>
        }
        confirmLabel="Eliminar componente"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}
