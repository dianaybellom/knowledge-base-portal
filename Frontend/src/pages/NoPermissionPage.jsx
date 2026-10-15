import { Link } from 'react-router-dom';
import { EmptyState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { userRoleLabel } from '../utils/catalog';

export function NoPermissionPage() {
  useDocumentTitle('Sin permiso');
  const { user } = useAuth();
  return (
    <div className="container page">
      <h1 className="page-title">Sin permiso</h1>
      <EmptyState
        icon="alert"
        title="Tu rol no tiene acceso a esta página"
        message={`Ingresaste como ${userRoleLabel(user?.role).toLowerCase()}. Si necesitas este acceso, pídeselo a un administrador.`}
        action={
          <Link to="/" className="button button--primary">
            Volver al catálogo
          </Link>
        }
      />
    </div>
  );
}
