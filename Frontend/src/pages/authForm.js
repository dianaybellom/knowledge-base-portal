// Validación del lado del cliente (las mismas reglas que aplica la API).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  if (!value.trim()) return 'Ingresa tu correo.';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Ingresa un correo válido, por ejemplo nombre@empresa.com.';
  return null;
}

export function validateRegistration({ fullName, email, password }) {
  const errors = {};
  if (fullName.trim().length < 2) errors.fullName = 'Ingresa tu nombre (al menos 2 caracteres).';
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  else if (password.length > 72) errors.password = 'La contraseña no puede superar 72 caracteres.';
  return errors;
}
