const TOKEN_KEY = 'kbp_token';

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }

  // { email: 'Ingresa un correo válido.', ... } para mostrar junto a cada campo.
  get fieldErrors() {
    return Object.fromEntries(this.details.map((detail) => [detail.field, detail.message]));
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sin acceso a localStorage la sesión dura solo mientras la pestaña esté abierta.
  }
}

// Evento que escucha AuthContext para cerrar la sesión cuando el token deja de ser válido.
export const UNAUTHORIZED_EVENT = 'kbp:unauthorized';

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const token = getStoredToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${path}`, { method, headers, body: payload, signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Respuesta sin cuerpo JSON
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: data?.error }));
    }
    throw new ApiError(
      response.status,
      data?.error || 'Ocurrió un error inesperado. Intenta de nuevo.',
      data?.details || []
    );
  }

  return data;
}
