// Etiquetas visibles de los valores de catálogo que devuelve la API.

export const SOLUTION_TYPES = [
  { value: 'addon', label: 'Add-on ERP' },
  { value: 'plugin', label: 'Plugin POS' },
  { value: 'integration', label: 'Integración' },
];

export const DOC_STATUSES = [
  { value: 'complete', label: 'Completa' },
  { value: 'partial', label: 'Parcial' },
  { value: 'pending', label: 'Pendiente' },
];

// El orden del arreglo es el orden en que se muestran las secciones.
export const DOCUMENT_TYPES = [
  { value: 'technical', label: 'Documentación Técnica' },
  { value: 'release-notes', label: 'Novedades' },
  { value: 'user-guide', label: 'Guía de uso' },
  { value: 'fact-sheet', label: 'Hoja informativa' },
];

export const USER_ROLES = [
  { value: 'consultant', label: 'Consultor' },
  { value: 'author', label: 'Autor técnico' },
  { value: 'admin', label: 'Administrador' },
];

export const MEMBER_ROLES = [
  { value: 'po', label: 'PO' },
  { value: 'dev', label: 'Devs' },
];

function labelOf(list, value) {
  return list.find((item) => item.value === value)?.label ?? value;
}

export const solutionTypeLabel = (value) => labelOf(SOLUTION_TYPES, value);
export const docStatusLabel = (value) => labelOf(DOC_STATUSES, value);
export const documentTypeLabel = (value) => labelOf(DOCUMENT_TYPES, value);
export const userRoleLabel = (value) => labelOf(USER_ROLES, value);
export const isDocumentType = (value) => DOCUMENT_TYPES.some((item) => item.value === value);
