// Extrae la última publicación de una sección de Novedades escrita en Markdown.
// Convención: cada publicación empieza con un encabezado "## " y la más reciente va primero.

const EXCERPT_MAX_LENGTH = 160;

// Quita la sintaxis de Markdown y el HTML para dejar solo el texto legible.
function toPlainText(markdown) {
  // El código en línea se aparta antes de quitar el formato, para no alterar
  // identificadores como ACC_SPEECH_RATE; al final se restituye sin las comillas invertidas.
  const codeSpans = [];
  const withoutCode = markdown.replace(/`([^`]*)`/g, (_match, code) => {
    codeSpans.push(code);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });

  return withoutCode
    .replace(/<[^>]+>/g, ' ')                          // HTML (por ejemplo, iframes de video)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')          // imágenes → texto alternativo
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')           // enlaces → texto del enlace
    .replace(/(\*\*|\*|~~)(.+?)\1/g, '$2')             // negrita, cursiva y tachado con * o ~
    .replace(/(^|\W)(__|_)(.+?)\2(?=\W|$)/g, '$1$3')   // negrita y cursiva con _ (solo entre palabras)
    .replace(/\u0000(\d+)\u0000/g, (_match, index) => codeSpans[Number(index)])
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s*>\s?/, '')                  // citas
        .replace(/^\s*([-*+]|\d+[.)])\s+/, '')    // viñetas y listas numeradas
        .trim()
    )
    .filter((line) => line && !/^\|/.test(line) && !/^-{3,}$/.test(line)) // tablas y separadores
    .map((line) => (/[.!?:;]$/.test(line) ? line : `${line}.`))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Recorta en el último espacio antes del límite para no partir palabras.
function truncate(text, maxLength = EXCERPT_MAX_LENGTH) {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:]+$/, '')}…`;
}

// Devuelve { title, excerpt } del primer bloque "## ..." del documento.
function extractLatestRelease(markdown) {
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let title = null;
  const body = [];

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    const heading = !inCodeBlock && line.match(/^#{1,2}\s+(.+?)\s*#*\s*$/);
    if (heading) {
      if (title !== null) break; // empieza la publicación anterior
      title = toPlainText(heading[1]).replace(/\.$/, '');
      body.length = 0; // el texto introductorio antes del primer encabezado no es una publicación
      continue;
    }
    if (!inCodeBlock) body.push(line);
  }

  return { title, excerpt: truncate(toPlainText(body.join('\n'))) };
}

module.exports = { extractLatestRelease };
