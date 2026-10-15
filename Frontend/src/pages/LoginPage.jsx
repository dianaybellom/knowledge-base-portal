import { useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFocusFirstError } from '../hooks/useFocusFirstError';
import { validateEmail } from './authForm';

export function LoginPage() {
  useDocumentTitle('Ingresar');
  const { user, login, sessionNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const destination = location.state?.from?.pathname ?? '/';

  const focusFirstError = useFocusFirstError(formRef);

  if (user && !submitting) return <Navigate to={destination} replace />;

  function update(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = {};
    const emailError = validateEmail(values.email);
    if (emailError) nextErrors.email = emailError;
    if (!values.password) nextErrors.password = 'Ingresa tu contraseña.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError();
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(destination, { replace: true });
    } catch (err) {
      setSubmitting(false);
      if (err.details?.length) {
        setErrors(err.fieldErrors);
        focusFirstError();
      } else setFormError(err.status === 401 ? 'El correo o la contraseña no son correctos. Revisa los datos e intenta de nuevo.' : err.message);
    }
  }

  return (
    <AuthLayout title="Ingresa a tu cuenta">
      {sessionNotice && !formError && (
        <p className="notice notice--info" role="status">
          {sessionNotice}
        </p>
      )}
      {formError && (
        <p className="notice notice--error" role="alert">
          <Icon name="alert" size={18} />
          {formError}
        </p>
      )}

      <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
          required
        />
        <FormField
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          value={values.password}
          onChange={update('password')}
          error={errors.password}
          required
        />
        <button type="submit" className="button button--primary button--block" disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="auth-card__switch">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </AuthLayout>
  );
}
