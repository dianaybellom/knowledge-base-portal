import { useEffect, useState } from 'react';
import { usersApi } from '../../api/endpoints';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Icon } from '../../components/Icon';
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '../../components/StateViews';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { USER_ROLES, userRoleLabel } from '../../utils/catalog';
import { formatDate, initialsOf } from '../../utils/format';

const ROLE_NOUNS = {
  consultant: { singular: 'consultor', plural: 'consultores' },
  author: { singular: 'autor técnico', plural: 'autores técnicos' },
  admin: { singular: 'administrador', plural: 'administradores' },
};

function UsersTableSkeleton() {
  return (
    <LoadingRegion label="Cargando usuarios…">
      <div className="card detail-card" aria-hidden="true">
        {[1, 2, 3, 4].map((key) => (
          <Skeleton key={key} width="100%" height="2.75rem" />
        ))}
      </div>
    </LoadingRegion>
  );
}

export function UsersPage() {
  useDocumentTitle('Usuarios');
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { data, error, loading, retry } = useApi((options) => usersApi.list(options), []);

  // Copia local para reflejar los cambios de rol y las eliminaciones sin recargar.
  const [users, setUsers] = useState([]);
  useEffect(() => setUsers(data?.users ?? []), [data]);

  const [savingId, setSavingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleRoleChange(target, role) {
    const previousRole = target.role;
    setSavingId(target.id);
    // Actualización optimista: se revierte si la API la rechaza.
    setUsers((current) => current.map((item) => (item.id === target.id ? { ...item, role } : item)));
    try {
      await usersApi.updateRole(target.id, role);
      showToast(`${target.fullName} ahora tiene el rol "${userRoleLabel(role)}".`, { type: 'success' });
    } catch (err) {
      setUsers((current) => current.map((item) => (item.id === target.id ? { ...item, role: previousRole } : item)));
      showToast(err.message, { type: 'error' });
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await usersApi.remove(toDelete.id);
      setUsers((current) => current.filter((item) => item.id !== toDelete.id));
      showToast(`Se eliminó la cuenta de ${toDelete.fullName}.`, { type: 'success' });
      setToDelete(null);
    } catch (err) {
      showToast(err.message, { type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  const countsByRole = USER_ROLES.map((role) => ({
    ...role,
    count: users.filter((item) => item.role === role.value).length,
  }));

  return (
    <div className="container page manage-page">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Usuarios' }]} />
      <header className="manage-page__header">
        <h1 className="page-title">Usuarios</h1>
        <p className="manage-page__subtitle">
          Cambia el rol de cada persona o elimina cuentas. Quien se registra empieza como consultor.
        </p>
      </header>

      {error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : loading ? (
        <UsersTableSkeleton />
      ) : users.length === 0 ? (
        <EmptyState icon="inbox" title="No hay usuarios registrados" />
      ) : (
        <div className="detail-layout">
          <ul className="role-summary" aria-label="Usuarios por rol">
            <li className="role-summary__item">
              <span className="role-summary__count">{users.length}</span> en total
            </li>
            {countsByRole.map((role) => (
              <li key={role.value} className="role-summary__item">
                <span className="role-summary__count">{role.count}</span>{' '}
                {role.count === 1 ? ROLE_NOUNS[role.value].singular : ROLE_NOUNS[role.value].plural}
              </li>
            ))}
          </ul>

          <div className="card users-card">
            <div className="table-scroll table-scroll--flat" tabIndex={0} role="region" aria-label="Tabla de usuarios">
              <table className="data-table users-table">
                <caption className="visually-hidden">Usuarios registrados, con su rol y fecha de registro</caption>
                <thead>
                  <tr>
                    <th scope="col">Usuario</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Registro</th>
                    <th scope="col">
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => {
                    const isSelf = item.id === currentUser.id;
                    const selectId = `role-${item.id}`;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="user-cell">
                            <span className="avatar avatar--small" aria-hidden="true">
                              {initialsOf(item.fullName)}
                            </span>
                            <div>
                              <p className="user-cell__name">
                                {item.fullName}
                                {isSelf && <span className="user-cell__self"> (tú)</span>}
                              </p>
                              <p className="user-cell__email">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <label htmlFor={selectId} className="visually-hidden">
                            Rol de {item.fullName}
                          </label>
                          <select
                            id={selectId}
                            className="select select--compact"
                            value={item.role}
                            disabled={isSelf || savingId === item.id}
                            onChange={(event) => handleRoleChange(item, event.target.value)}
                            aria-describedby={isSelf ? 'self-role-note' : undefined}
                          >
                            {USER_ROLES.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                        </td>
                        <td className="data-table__action">
                          {isSelf ? (
                            <span className="text-muted">—</span>
                          ) : (
                            <button
                              type="button"
                              className="button button--danger-outline button--small"
                              onClick={() => setToDelete(item)}
                              aria-label={`Eliminar la cuenta de ${item.fullName}`}
                            >
                              <Icon name="trash" size={16} />
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p id="self-role-note" className="form-field__hint">
            No puedes cambiar tu propio rol ni eliminar tu cuenta: así siempre queda al menos un administrador.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`¿Eliminar la cuenta de ${toDelete?.fullName ?? ''}?`}
        message={
          <p>
            {toDelete?.email} perderá el acceso al portal. Las soluciones que haya creado se conservan. Esta acción no se
            puede deshacer.
          </p>
        }
        confirmLabel="Eliminar cuenta"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
