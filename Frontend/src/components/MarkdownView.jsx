import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { isAllowedEmbedUrl } from '../utils/embeds';
import { slugify } from '../utils/format';

// Lista blanca: el HTML propio de Markdown, <div class="video-embed"> e <iframe> con
// src, title y allowfullscreen. Todo lo demás (scripts, estilos, eventos) se elimina.
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...defaultSchema.tagNames, 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes.div ?? []), ['className', 'video-embed']],
    iframe: ['src', 'title', 'allowFullScreen'],
  },
  protocols: { ...defaultSchema.protocols, src: ['https'] },
};

function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(textOf).join('');
}

// Plugin de rehype (se ejecuta después de sanitizar):
// - convierte los h1 del autor en h2, porque el h1 de la página es el título de la sección;
// - asigna a cada h2/h3 un id único derivado de su texto, usado por la tabla de contenidos.
function rehypeHeadingIds() {
  return (tree) => {
    const used = new Map();
    const visit = (node) => {
      if (node.type === 'element') {
        if (node.tagName === 'h1') node.tagName = 'h2';
        if (node.tagName === 'h2' || node.tagName === 'h3') {
          const base = slugify(textOf(node)) || 'seccion';
          const count = used.get(base) ?? 0;
          used.set(base, count + 1);
          node.properties = { ...node.properties, id: count === 0 ? base : `${base}-${count + 1}` };
        }
      }
      (node.children ?? []).forEach(visit);
    };
    visit(tree);
  };
}

// Todo iframe se muestra a 16:9 y solo si su origen está permitido.
function VideoFrame({ src, title }) {
  if (!src || !isAllowedEmbedUrl(src)) {
    return (
      <p className="video-blocked" role="note">
        Este video no se puede mostrar porque su origen no está permitido.
      </p>
    );
  }
  return (
    <span className="video-frame">
      <iframe
        src={src}
        title={title || 'Video incrustado'}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </span>
  );
}

const components = {
  iframe: ({ node, ...props }) => <VideoFrame {...props} />,
  // Las tablas pueden desplazarse horizontalmente sin desbordar la página en móvil;
  // tabIndex permite desplazarlas con el teclado.
  table: ({ node, ...props }) => (
    <div className="table-scroll" tabIndex={0}>
      <table {...props} />
    </div>
  ),
  a: ({ node, href, ...props }) => {
    const isExternal = /^https?:\/\//.test(href ?? '');
    return isExternal ? (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
    ) : (
      <a href={href} {...props} />
    );
  },
};

export function MarkdownView({ content, className = '' }) {
  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeHeadingIds]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
