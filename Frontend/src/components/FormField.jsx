import { useId, useState } from 'react';
import { Icon } from './Icon';

// Campo con label asociado; la ayuda, el contador y el error se enlazan con aria-describedby.
// as: 'input' (por defecto), 'textarea' o 'select' (las opciones van como children).
export function FormField({
  label,
  error,
  hint,
  type = 'text',
  as = 'input',
  id: providedId,
  inputRef,
  maxLength,
  showCount = false,
  suppressAutofill = false,
  children,
  ...inputProps
}) {
  // Chrome ignora autocomplete="off" en nombre, correo y contraseña. Para evitar su lista de
  // sugerencias, el campo empieza en solo lectura (Chrome no la muestra en esos campos) y se
  // habilita justo después de recibir el foco. Solo con mouse/trackpad: en pantallas táctiles el
  // modo de solo lectura podría impedir que se abra el teclado.
  const [autofillLocked, setAutofillLocked] = useState(
    () => suppressAutofill && window.matchMedia('(pointer: fine)').matches
  );
  if (autofillLocked) {
    const { onFocus, onBlur } = inputProps;
    inputProps = {
      ...inputProps,
      readOnly: true,
      onFocus: (event) => {
        window.requestAnimationFrame(() => setAutofillLocked(false));
        onFocus?.(event);
      },
      onBlur,
    };
  } else if (suppressAutofill) {
    const { onBlur } = inputProps;
    inputProps = {
      ...inputProps,
      // Al salir del campo se vuelve a bloquear para que la siguiente vez tampoco aparezcan sugerencias.
      onBlur: (event) => {
        if (window.matchMedia('(pointer: fine)').matches) setAutofillLocked(true);
        onBlur?.(event);
      },
    };
  }
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const countId = `${id}-count`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = as === 'input' && type === 'password';
  const length = typeof inputProps.value === 'string' ? inputProps.value.length : 0;

  const describedBy =
    [hint && hintId, showCount && maxLength && countId, error && errorId].filter(Boolean).join(' ') || undefined;
  const sharedProps = {
    ref: inputRef,
    id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    maxLength,
    ...inputProps,
  };

  let control;
  if (as === 'textarea') {
    control = <textarea className="input textarea" {...sharedProps} />;
  } else if (as === 'select') {
    control = (
      <select className="select" {...sharedProps}>
        {children}
      </select>
    );
  } else {
    control = <input type={isPassword && showPassword ? 'text' : type} className="input" {...sharedProps} />;
  }

  return (
    <div className={`form-field ${error ? 'form-field--invalid' : ''}`}>
      <label htmlFor={id} className="form-field__label">
        {label}
      </label>
      <div className="form-field__control">
        {control}
        {isPassword && (
          <button
            type="button"
            className="icon-button form-field__toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
          >
            <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
      </div>
      {(hint || (showCount && maxLength)) && (
        <div className="form-field__meta">
          {hint && (
            <p id={hintId} className="form-field__hint">
              {hint}
            </p>
          )}
          {showCount && maxLength && (
            <p id={countId} className="form-field__count">
              {length.toLocaleString('es')} / {maxLength.toLocaleString('es')}
            </p>
          )}
        </div>
      )}
      {error && (
        <p id={errorId} className="form-field__error">
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}
