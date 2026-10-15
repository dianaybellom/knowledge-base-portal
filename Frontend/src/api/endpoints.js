import { apiRequest } from './client';

const encode = encodeURIComponent;

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: data }),
  me: (options) => apiRequest('/auth/me', options),
};

export const solutionsApi = {
  list: (filters = {}, options) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return apiRequest(`/solutions${query ? `?${query}` : ''}`, options);
  },
  coverage: (options) => apiRequest('/solutions/coverage', options),
  recentUpdates: (limit, options) => apiRequest(`/solutions/recent-updates?limit=${limit}`, options),
  get: (code, options) => apiRequest(`/solutions/${encode(code)}`, options),
  create: (data) => apiRequest('/solutions', { method: 'POST', body: data }),
  update: (code, data) => apiRequest(`/solutions/${encode(code)}`, { method: 'PUT', body: data }),
  remove: (code) => apiRequest(`/solutions/${encode(code)}`, { method: 'DELETE' }),
};

export const documentsApi = {
  get: (code, type, options) =>
    apiRequest(`/solutions/${encode(code)}/documents/${encode(type)}`, options),
  save: (code, type, content) =>
    apiRequest(`/solutions/${encode(code)}/documents/${encode(type)}`, { method: 'PUT', body: { content } }),
  remove: (code, type) =>
    apiRequest(`/solutions/${encode(code)}/documents/${encode(type)}`, { method: 'DELETE' }),
};

export const componentsApi = {
  download: (id) => apiRequest(`/components/${encode(id)}/download`),
  // formData: name, version y file (opcional)
  create: (code, formData) =>
    apiRequest(`/solutions/${encode(code)}/components`, { method: 'POST', body: formData }),
  remove: (id) => apiRequest(`/components/${encode(id)}`, { method: 'DELETE' }),
};

export const usersApi = {
  list: (options) => apiRequest('/users', options),
  updateRole: (id, role) => apiRequest(`/users/${encode(id)}/role`, { method: 'PATCH', body: { role } }),
  remove: (id) => apiRequest(`/users/${encode(id)}`, { method: 'DELETE' }),
};
