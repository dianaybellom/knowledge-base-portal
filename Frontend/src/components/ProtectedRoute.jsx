import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NoPermissionPage } from '../pages/NoPermissionPage';

// Sin sesión → /login (recordando a dónde quería ir). Con un rol insuficiente → "Sin permiso".
export function ProtectedRoute({ roles }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div className="page-loading" role="status">
        <span className="page-loading__spinner" aria-hidden="true" />
        <span className="visually-hidden">Verificando tu sesión…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <NoPermissionPage />;
  }

  return <Outlet />;
}
