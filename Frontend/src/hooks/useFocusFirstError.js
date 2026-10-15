import { useCallback, useEffect, useState } from 'react';

// Lleva el foco al primer campo con error, pero solo cuando se pide (al enviar el formulario).
// Si dependiera del estado de errores, el foco saltaría a otro campo mientras se corrige uno.
export function useFocusFirstError(formRef) {
  const [request, setRequest] = useState(0);

  useEffect(() => {
    if (request === 0) return;
    formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [request, formRef]);

  return useCallback(() => setRequest((value) => value + 1), []);
}
