import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';

// Las páginas que renderizan Markdown se cargan bajo demanda: así el ingreso y la página
// principal no descargan las librerías de Markdown (mejor tiempo de carga inicial).
const SolutionPage = lazy(() => import('./pages/SolutionPage').then((module) => ({ default: module.SolutionPage })));
const DocumentPage = lazy(() => import('./pages/DocumentPage').then((module) => ({ default: module.DocumentPage })));
const SolutionFormPage = lazy(() =>
  import('./pages/manage/SolutionFormPage').then((module) => ({ default: module.SolutionFormPage }))
);
const UsersPage = lazy(() => import('./pages/admin/UsersPage').then((module) => ({ default: module.UsersPage })));

function Lazy({ children }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

function PageFallback() {
  return (
    <div className="page-loading page-loading--inline" role="status">
      <span className="page-loading__spinner" aria-hidden="true" />
      <span className="visually-hidden">Cargando…</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route
                  path="solutions/:code"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <SolutionPage />
                    </Suspense>
                  }
                />
                <Route
                  path="solutions/:code/docs/:type"
                  element={
                    <Suspense fallback={<PageFallback />}>
                      <DocumentPage />
                    </Suspense>
                  }
                />

                {/* Gestión: solo autores y administradores */}
                <Route element={<ProtectedRoute roles={['author', 'admin']} />}>
                  <Route path="manage/solutions/new" element={<Lazy><SolutionFormPage /></Lazy>} />
                  <Route path="manage/solutions/:code/edit" element={<Lazy><SolutionFormPage /></Lazy>} />
                </Route>

                {/* Administración: solo administradores */}
                <Route element={<ProtectedRoute roles={['admin']} />}>
                  <Route path="admin/users" element={<Lazy><UsersPage /></Lazy>} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
