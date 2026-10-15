import { Link } from 'react-router-dom';
import { EmptyState } from '../components/StateViews';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage({ message = 'La página que buscas no existe o cambió de dirección.' }) {
  useDocumentTitle('Página no encontrada');
  return (
    <div className="container page">
      <h1 className="page-title">Página no encontrada</h1>
      <EmptyState
        icon="search"
        title="No encontramos lo que buscabas"
        message={message}
        action={
          <Link to="/" className="button button--primary">
            Ir al catálogo de soluciones
          </Link>
        }
      />
    </div>
  );
}
