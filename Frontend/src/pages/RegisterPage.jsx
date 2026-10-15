import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFocusFirstError } from '../hooks/useFocusFirstError';
import { validateRegistration } from './authForm';

export function RegisterPage() {
  useDocumentTitle('Crear cuenta');
  const { user, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [values, setValues] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const focusFirstError = useFocusFirstError(formRef);
  // Sufijo distinto en cada carga para los nombres de los campos (sin coincidencias en el historial).
  const [fieldSuffix] = useState(() => Math.random().toString(36).slice(2, 8));

  if (user && !submitting) return <Navigate to="/" replace />;

  function update(field) {
    return (event) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateRegistration(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError();
      return;
    }

    setSubmitting(true);
    try {
      await register({ fullName: values.fullName.trim(), email: values.email.trim(), password: values.password });
      showToast('Tu cuenta se creó correctamente. Te damos la bienvenida.', { type: 'success' });
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitting(false);
      if (err.status === 409) {
        setErrors({ email: 'Ya existe una cuenta con este correo. Ingresa o usa otro correo.' });
        focusFirstError();
      } else if (err.details?.length) {
        setErrors(err.fieldErrors);
        focusFirstError();
      } else setFormError(err.message);
    }
  }

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Tendrás acceso de consulta al catálogo y a la documentación.">
      {formError && (
        <p className="notice notice--error" role="alert">
          <Icon name="alert" size={18} />
          {formError}
        </p>
      )}

      {/* Sin sugerencias de autocompletado del navegador al registrarse (pedido explícito):
          autocomplete="off", nombres de campo únicos (las sugerencias de historial se buscan por
          el atributo name) y bloqueo de solo lectura hasta recibir el foco (ver FormField). */}
      <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate autoComplete="off">
        <FormField
          label="Nombre completo"
          name={`fullName-${fieldSuffix}`}
          autoComplete="off"
          suppressAutofill
          value={values.fullName}
          onChange={update('fullName')}
          error={errors.fullName}
          required
        />
        <FormField
          label="Correo electrónico"
          // Texto con teclado de correo: con type="email" Chrome lo reconoce y ofrece direcciones guardadas.
          type="text"
          inputMode="email"
          autoCapitalize="none"
          spellCheck="false"
          name={`email-${fieldSuffix}`}
          autoComplete="off"
          suppressAutofill
          value={values.email}
          onChange={update('email')}
          error={errors.email}
          required
        />
        <FormField
          label="Contraseña"
          type="password"
          name={`password-${fieldSuffix}`}
          autoComplete="off"
          suppressAutofill
          hint="Mínimo 8 caracteres."
          value={values.password}
          onChange={update('password')}
          error={errors.password}
          required
        />
        <button type="submit" className="button button--primary button--block" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="auth-card__switch">
        ¿Ya tienes cuenta? <Link to="/login">Ingresa</Link>
      </p>
    </AuthLayout>
  );
}
