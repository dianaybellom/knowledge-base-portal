import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { solutionsApi } from '../../api/endpoints';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormField } from '../../components/FormField';
import { Icon } from '../../components/Icon';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { ErrorState, LoadingRegion, Skeleton } from '../../components/StateViews';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFocusFirstError } from '../../hooks/useFocusFirstError';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';
import { DOC_STATUSES, MEMBER_ROLES, SOLUTION_TYPES } from '../../utils/catalog';
import { NotFoundPage } from '../NotFoundPage';
import { ComponentsManager } from './ComponentsManager';
import { DocumentsManager } from './DocumentsManager';

const CODE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LIMITS = { code: 80, name: 120, summary: 300, description: 20000, memberName: 120, members: 20 };
const MEMBER_ROLE_OPTIONS = [
  { value: 'po', label: 'Product Owner (PO)' },
  { value: 'dev', label: 'Desarrollador (Dev)' },
];

let memberKeySeed = 0;
const newMemberKey = () => `member-${++memberKeySeed}`;

const EMPTY_VALUES = { code: '', name: '', type: '', docStatus: 'pending', summary: '', description: '' };

// Mientras se escribe el código: minúsculas, sin acentos y con guiones en lugar de espacios.
function normalizeCode(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-');
}

function validate(values, members, isNew) {
  const errors = {};
  if (isNew) {
    if (!values.code) errors.code = 'Escribe el código de la solución.';
    else if (!CODE_PATTERN.test(values.code))
      errors.code = 'Usa minúsculas, números y guiones simples, sin guion al inicio ni al final (ej.: accessibility-assistant).';
  }
  if (values.name.trim().length < 2) errors.name = 'Escribe el nombre (al menos 2 caracteres).';
  if (!values.type) errors.type = 'Elige el tipo de solución.';
  if (!values.summary.trim()) errors.summary = 'Escribe un resumen corto: se muestra en las tarjetas y en la búsqueda.';
  if (!values.description.trim()) errors.description = 'Escribe la descripción de la solución.';

  members.forEach((member, index) => {
    if (!member.name.trim()) errors[`members.${index}.name`] = 'Escribe el nombre o quita esta fila.';
  });
  if (members.filter((member) => member.role === 'po').length > 1) {
    errors.members = 'Solo puede haber un PO por solución.';
  }
  return errors;
}

function toPayload(values, members, isNew) {
  const payload = {
    name: values.name.trim(),
    type: values.type,
    docStatus: values.docStatus,
    summary: values.summary.trim(),
    description: values.description.trim(),
    members: members.map((member) => ({ name: member.name.trim(), role: member.role })),
  };
  if (isNew) payload.code = values.code;
  return payload;
}

// Bloque de formulario con título (misma tarjeta que la ficha de la solución).
function FormCard({ title, description, children, className = '' }) {
  const titleId = `form-card-${title.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <section className={`card detail-card ${className}`} aria-labelledby={titleId}>
      <div>
        <h2 id={titleId} className="detail-card__title">
          {title}
        </h2>
        {description && <p className="form-card__description">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function MembersEditor({ members, setMembers, errors, clearError }) {
  const nameRefs = useRef(new Map());
  const addButtonRef = useRef(null);
  const [focusKey, setFocusKey] = useState(null);

  useEffect(() => {
    if (focusKey) nameRefs.current.get(focusKey)?.focus();
  }, [focusKey]);

  function addMember() {
    const key = newMemberKey();
    const hasPo = members.some((member) => member.role === 'po');
    setMembers([...members, { key, name: '', role: hasPo ? 'dev' : 'po' }]);
    setFocusKey(key);
  }

  function removeMember(key) {
    setMembers(members.filter((member) => member.key !== key));
    clearError('members');
    // El foco vuelve a un lugar estable después de quitar la fila.
    addButtonRef.current?.focus();
  }

  function updateMember(key, field, value, index) {
    setMembers(members.map((member) => (member.key === key ? { ...member, [field]: value } : member)));
    clearError(`members.${index}.${field}`);
    if (field === 'role') clearError('members');
  }

  return (
    <fieldset className="members-editor">
      <legend className="form-field__label">Responsables</legend>
      <p className="form-field__hint">Un PO (opcional) y los desarrolladores. Se muestran en la ficha de la solución.</p>

      {members.length === 0 ? (
        <p className="members-editor__empty">Todavía no hay responsables.</p>
      ) : (
        <ul className="members-editor__list">
          {members.map((member, index) => (
            <li key={member.key} className="members-editor__row">
              <FormField
                label={`Nombre del responsable ${index + 1}`}
                value={member.name}
                maxLength={LIMITS.memberName}
                onChange={(event) => updateMember(member.key, 'name', event.target.value, index)}
                error={errors[`members.${index}.name`]}
                inputRef={(element) => {
                  if (element) nameRefs.current.set(member.key, element);
                  else nameRefs.current.delete(member.key);
                }}
              />
              <FormField
                as="select"
                label={`Rol del responsable ${index + 1}`}
                value={member.role}
                onChange={(event) => updateMember(member.key, 'role', event.target.value, index)}
              >
                {MEMBER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormField>
              <button
                type="button"
                className="icon-button members-editor__remove"
                onClick={() => removeMember(member.key)}
                aria-label={`Quitar a ${member.name.trim() || `responsable ${index + 1}`}`}
                title="Quitar responsable"
              >
                <Icon name="close" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {errors.members && (
        <p className="form-field__error" role="alert">
          <Icon name="alert" size={16} />
          {errors.members}
        </p>
      )}

      <button
        ref={addButtonRef}
        type="button"
        className="button button--secondary button--small members-editor__add"
        onClick={addMember}
        disabled={members.length >= LIMITS.members}
      >
        <Icon name="plus" size={16} />
        Agregar responsable
      </button>
    </fieldset>
  );
}

function GeneralForm({ isNew, initialSolution, onSaved }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const formRef = useRef(null);

  const initial = useMemo(() => {
    if (!initialSolution) return { values: EMPTY_VALUES, members: [] };
    return {
      values: {
        code: initialSolution.code,
        name: initialSolution.name,
        type: initialSolution.type,
        docStatus: initialSolution.docStatus,
        summary: initialSolution.summary,
        description: initialSolution.description,
      },
      members: initialSolution.members.map((member) => ({ key: newMemberKey(), name: member.name, role: member.role })),
    };
  }, [initialSolution]);

  const [values, setValues] = useState(initial.values);
  const [members, setMembers] = useState(initial.members);
  const [saved, setSaved] = useState(() => JSON.stringify(toPayload(initial.values, initial.members, isNew)));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isDirty = JSON.stringify(toPayload(values, members, isNew)) !== saved;
  useUnsavedChangesWarning(isDirty && !submitting);

  const focusFirstError = useFocusFirstError(formRef);

  function clearError(field) {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function update(field) {
    return (event) => {
      const value = field === 'code' ? normalizeCode(event.target.value) : event.target.value;
      setValues((current) => ({ ...current, [field]: value }));
      clearError(field);
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    const nextErrors = validate(values, members, isNew);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Revisa los campos marcados antes de guardar.');
      focusFirstError();
      return;
    }

    setSubmitting(true);
    const payload = toPayload(values, members, isNew);
    try {
      if (isNew) {
        const { solution } = await solutionsApi.create(payload);
        setSaved(JSON.stringify(payload));
        showToast('Solución creada. Ahora puedes agregar componentes y documentación.', { type: 'success' });
        navigate(`/manage/solutions/${solution.code}/edit`, { replace: true });
      } else {
        const { solution } = await solutionsApi.update(initialSolution.code, payload);
        setSaved(JSON.stringify(payload));
        showToast('Los cambios de la solución se guardaron.', { type: 'success' });
        onSaved(solution);
      }
    } catch (err) {
      if (err.status === 409) {
        setErrors({ code: 'Ya existe una solución con este código. Elige otro.' });
        setFormError('Revisa los campos marcados antes de guardar.');
        focusFirstError();
      } else if (err.details?.length) {
        setErrors(err.fieldErrors);
        setFormError('Revisa los campos marcados antes de guardar.');
        focusFirstError();
      } else {
        setFormError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="solution-form">
      {formError && (
        <p className="notice notice--error" role="alert">
          <Icon name="alert" size={18} />
          {formError}
        </p>
      )}

      <FormCard title="Datos generales">
        <div className="form-grid">
          {isNew ? (
            <FormField
              label="Código"
              value={values.code}
              onChange={update('code')}
              error={errors.code}
              maxLength={LIMITS.code}
              hint="Nombre en inglés, en minúsculas y con guiones. Forma la dirección de la ficha y no se puede cambiar después."
              autoComplete="off"
              spellCheck="false"
              placeholder="accessibility-assistant"
            />
          ) : (
            <div className="form-field">
              <p className="form-field__label">Código</p>
              <p className="readonly-value">
                <code>{values.code}</code>
              </p>
              <p className="form-field__hint">El código no se puede cambiar porque forma la dirección de la ficha.</p>
            </div>
          )}
          <FormField label="Nombre" value={values.name} onChange={update('name')} error={errors.name} maxLength={LIMITS.name} />
          <FormField as="select" label="Tipo" value={values.type} onChange={update('type')} error={errors.type}>
            <option value="" disabled>
              Elige un tipo
            </option>
            {SOLUTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </FormField>
          <FormField
            as="select"
            label="Estado de la documentación"
            value={values.docStatus}
            onChange={update('docStatus')}
            error={errors.docStatus}
            hint="Define si aparece en Soluciones destacadas (completa) y el indicador de cobertura."
          >
            {DOC_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </FormField>
        </div>

        <FormField
          as="textarea"
          label="Resumen"
          rows={3}
          value={values.summary}
          onChange={update('summary')}
          error={errors.summary}
          maxLength={LIMITS.summary}
          showCount
          hint="Una o dos frases en texto plano: qué problema resuelve. Se muestra en las tarjetas y en la búsqueda."
        />

        <MarkdownEditor
          label="Descripción"
          value={values.description}
          onChange={(value) => {
            setValues((current) => ({ ...current, description: value }));
            clearError('description');
          }}
          error={errors.description}
          maxLength={LIMITS.description}
          rows={10}
          hint="Markdown. El texto inicial es la descripción; cada título ## (por ejemplo, ## Funcionalidades) se muestra como una tarjeta aparte en la ficha."
        />

        <MembersEditor members={members} setMembers={setMembers} errors={errors} clearError={clearError} />

        <div className="form-actions">
          <button type="submit" className="button button--primary" disabled={submitting || (!isNew && !isDirty)}>
            {submitting ? 'Guardando…' : isNew ? 'Crear solución' : 'Guardar cambios'}
          </button>
          <Link to={isNew ? '/' : `/solutions/${initialSolution.code}`} className="button button--ghost">
            {isNew ? 'Cancelar' : 'Ver ficha'}
          </Link>
          {!isNew && (
            <p className="form-actions__status" aria-live="polite">
              {isDirty ? 'Hay cambios sin guardar.' : 'Sin cambios pendientes.'}
            </p>
          )}
        </div>
      </FormCard>
    </form>
  );
}

function DangerZone({ solution }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await solutionsApi.remove(solution.code);
      showToast(`Se eliminó la solución "${solution.name}".`, { type: 'success' });
      navigate('/', { replace: true });
    } catch (err) {
      showToast(err.message, { type: 'error' });
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <FormCard
      title="Eliminar solución"
      description="Se eliminan la solución, sus responsables, sus secciones y sus componentes con sus archivos. No se puede deshacer."
      className="danger-zone"
    >
      <div>
        <button type="button" className="button button--danger-outline" onClick={() => setOpen(true)}>
          <Icon name="trash" size={16} />
          Eliminar solución
        </button>
      </div>
      <ConfirmDialog
        open={open}
        title={`¿Eliminar "${solution.name}"?`}
        message={
          <p>
            Se eliminarán {solution.documents.length} {solution.documents.length === 1 ? 'sección' : 'secciones'} y{' '}
            {solution.components.length} {solution.components.length === 1 ? 'componente' : 'componentes'}, con sus archivos.
            Esta acción no se puede deshacer.
          </p>
        }
        confirmLabel="Eliminar solución"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </FormCard>
  );
}

function FormSkeleton() {
  return (
    <LoadingRegion label="Cargando la solución…">
      <div className="detail-layout" aria-hidden="true">
        {[1, 2].map((key) => (
          <div key={key} className="card detail-card">
            <Skeleton width="10rem" height="1.25rem" />
            <Skeleton width="100%" height="2.75rem" />
            <Skeleton width="100%" height="2.75rem" />
            <Skeleton width="100%" height="8rem" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function SolutionFormPage() {
  const { code } = useParams();
  const isNew = !code;
  const { data, error, loading, retry } = useApi(
    (options) => (isNew ? Promise.resolve(null) : solutionsApi.get(code, options)),
    [code, isNew]
  );
  // Copia local para refrescar componentes y secciones sin recargar la página.
  const [solution, setSolution] = useState(null);
  useEffect(() => setSolution(data?.solution ?? null), [data]);

  const title = isNew ? 'Nueva solución' : `Editar: ${solution?.name ?? ''}`;
  useDocumentTitle(isNew ? 'Nueva solución' : solution ? `Editar ${solution.name}` : 'Editar solución');

  async function refresh() {
    const { solution: fresh } = await solutionsApi.get(code);
    setSolution(fresh);
  }

  if (!isNew && error?.status === 404) {
    return <NotFoundPage message="No encontramos la solución que quieres editar. Puede que se haya eliminado." />;
  }

  return (
    <div className="container page manage-page">
      <Breadcrumbs
        items={
          isNew
            ? [{ label: 'Inicio', to: '/' }, { label: 'Nueva solución' }]
            : [
                { label: 'Inicio', to: '/' },
                { label: solution?.name ?? 'Solución', to: `/solutions/${code}` },
                { label: 'Editar' },
              ]
        }
      />
      <header className="manage-page__header">
        <h1 className="page-title">{title}</h1>
        <p className="manage-page__subtitle">
          {isNew
            ? 'Completa los datos generales. Después de crearla podrás subir componentes y escribir sus secciones.'
            : 'Los cambios de cada bloque se guardan por separado.'}
        </p>
      </header>

      {!isNew && error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : !isNew && (loading || !solution) ? (
        <FormSkeleton />
      ) : (
        <div className="detail-layout">
          <GeneralForm key={solution?.code ?? 'new'} isNew={isNew} initialSolution={solution} onSaved={setSolution} />
          {!isNew && (
            <>
              <ComponentsManager solution={solution} onChanged={refresh} />
              <DocumentsManager solution={solution} onChanged={refresh} />
              <DangerZone solution={solution} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
