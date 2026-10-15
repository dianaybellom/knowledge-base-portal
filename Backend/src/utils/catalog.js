// Valores de enum compartidos por la validación y los modelos.

const USER_ROLES = ['consultant', 'author', 'admin'];
const SOLUTION_TYPES = ['addon', 'plugin', 'integration'];
const DOC_STATUSES = ['complete', 'partial', 'pending'];
const MEMBER_ROLES = ['po', 'dev'];

// El orden del arreglo es el orden en que se muestran las secciones.
const DOCUMENT_TYPES = ['technical', 'release-notes', 'user-guide', 'fact-sheet'];

const CODE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

module.exports = {
  USER_ROLES,
  SOLUTION_TYPES,
  DOC_STATUSES,
  MEMBER_ROLES,
  DOCUMENT_TYPES,
  CODE_PATTERN,
};
