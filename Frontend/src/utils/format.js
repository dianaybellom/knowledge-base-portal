const dateFormatter = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

// "2026-08-14T10:00:00Z" → "14/08/2026"
export function formatDate(isoDate) {
  if (!isoDate) return '';
  return dateFormatter.format(new Date(isoDate));
}

// "Laura Méndez" → "LM"
export function initialsOf(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

// "Parámetros del sistema" → "parametros-del-sistema"
export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
