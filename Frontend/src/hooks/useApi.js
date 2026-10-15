import { useCallback, useEffect, useState } from 'react';

// Ejecuta una petición y expone sus estados: cargando, datos, error y reintento.
// `request` recibe { signal } para cancelar la petición si el componente cambia o se desmonta.
export function useApi(request, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  // `deps` controla cuándo se repite la petición (igual que en useEffect).
  const run = useCallback(request, deps);

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, error: null, loading: true }));

    run({ signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ data: null, error, loading: false });
      });

    return () => controller.abort();
  }, [run, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, retry };
}
