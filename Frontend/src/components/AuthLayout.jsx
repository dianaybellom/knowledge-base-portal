import { LogoMark } from './Logo';

// Diseño de ingreso y registro: formulario a la izquierda, panel institucional a la derecha.
export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-layout">
      <main id="main-content" className="auth-layout__form-side">
        <div className="auth-card">
          <div className="auth-card__brand">
            <LogoMark size={44} />
            <p className="auth-card__app-name">Knowledge Base Portal</p>
            <p className="auth-card__tagline">Toda la documentación de nuestras soluciones en un solo lugar</p>
          </div>
          <h1 className="auth-card__title">{title}</h1>
          {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
          {children}
        </div>
      </main>

      {/* Imagen institucional recreada con CSS: decorativa, oculta para lectores de pantalla. */}
      <aside className="auth-hero" aria-hidden="true">
        <span className="auth-hero__stroke auth-hero__stroke--1" />
        <span className="auth-hero__stroke auth-hero__stroke--2" />
        <span className="auth-hero__stroke auth-hero__stroke--3" />
        <span className="auth-hero__stroke auth-hero__stroke--4" />
        <span className="auth-hero__line auth-hero__line--1" />
        <span className="auth-hero__line auth-hero__line--2" />
        <span className="auth-hero__dots" />
        <p className="auth-hero__text">
          <span>Be Limitless.</span>
          <span className="auth-hero__text--accent">Be Successful.</span>
        </p>
      </aside>
    </div>
  );
}
