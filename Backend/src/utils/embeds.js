// Validación de los <iframe> incrustados en el Markdown (videos de YouTube y SharePoint).
// La protección real contra XSS es la sanitización del frontend; esta validación existe
// para que el autor reciba un error claro al guardar en lugar de ver el video desaparecer.

const IFRAME_TAG = /<iframe\b[^>]*>/gi;

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3];
}

function isAllowedEmbedUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl.replace(/&amp;/g, '&'));
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();
  if (host === 'www.youtube.com' || host === 'www.youtube-nocookie.com') {
    return url.pathname.startsWith('/embed/');
  }
  if (host.endsWith('.sharepoint.com')) {
    return url.pathname.toLowerCase().includes('/_layouts/15/embed.aspx');
  }
  return false;
}

function describeHost(rawUrl) {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return rawUrl.slice(0, 60);
  }
}

// Devuelve una lista de mensajes de error (vacía si todos los iframes son válidos).
function findEmbedErrors(markdown) {
  const errors = [];
  const tags = markdown.match(IFRAME_TAG) || [];

  tags.forEach((tag, index) => {
    const label = tags.length > 1 ? `El video ${index + 1}` : 'El video';
    const src = getAttribute(tag, 'src');
    const title = getAttribute(tag, 'title');

    if (!src) {
      errors.push(`${label} no tiene el atributo src.`);
    } else if (!isAllowedEmbedUrl(src)) {
      errors.push(
        `${label} de "${describeHost(src)}" no está permitido. Usa el código para insertar de YouTube o de SharePoint.`
      );
    }
    if (!title || !title.trim()) {
      errors.push(`${label} necesita un atributo title que lo describa (se usa en lectores de pantalla).`);
    }
  });

  return errors;
}

module.exports = { findEmbedErrors };
