import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './Logo';
import { SearchField } from './SearchField';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

// Búsqueda del encabezado: lleva a la página principal con el término (no aparece en "/").
function HeaderSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const query = term.trim();
    navigate(query ? `/?search=${encodeURIComponent(query)}` : '/');
    setTerm('');
  }

  return (
    <form role="search" className="site-header__search" onSubmit={handleSubmit}>
      <SearchField
        id="header-search"
        label="Buscar soluciones"
        value={term}
        onChange={setTerm}
        placeholder="Buscar"
        size="small"
      />
    </form>
  );
}

export function Layout() {
  const location = useLocation();
  const mainRef = useRef(null);
  const isHome = location.pathname === '/';
  const { user } = useAuth();
  const canEdit = user?.role === 'author' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  // Al cambiar de página, el foco va al contenido principal para que el lector de pantalla
  // anuncie la nueva vista (en una SPA no hay recarga que lo haga).
  // Se compara con la ruta anterior (no con un "primer render") porque en desarrollo
  // StrictMode ejecuta los efectos dos veces al montar.
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>

      <header className="site-header">
        <div className="site-header__inner container">
          <Link to="/" className="brand" aria-label="Knowledge Base Portal, ir al inicio">
            <LogoMark />
            <span className="brand__name">Knowledge Base Portal</span>
          </Link>

          <nav aria-label="Principal" className="site-nav">
            <NavLink to="/" end className="site-nav__link">
              Soluciones
            </NavLink>
            {/* Enlaces de gestión según el rol */}
            {canEdit && (
              <NavLink to="/manage/solutions/new" className="site-nav__link">
                Nueva solución
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin/users" className="site-nav__link">
                Usuarios
              </NavLink>
            )}
          </nav>

          {!isHome && <HeaderSearch />}

          <div className="site-header__actions">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main id="main-content" ref={mainRef} tabIndex={-1} className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p className="container">Desarrollado por Diana Bello — HCI CSE661</p>
      </footer>
    </div>
  );
}
