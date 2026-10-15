import { useEffect, useState } from 'react';
import { Icon } from './Icon';

// Lee los encabezados ya renderizados (h2/h3 con id) dentro de `containerRef`.
// Se usan los del DOM para que la tabla coincida siempre con lo que se ve.
export function useHeadings(containerRef, content) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const elements = container.querySelectorAll('h2[id], h3[id]');
    setHeadings(
      Array.from(elements).map((element) => ({
        id: element.id,
        text: element.textContent,
        level: element.tagName === 'H2' ? 2 : 3,
      }))
    );
  }, [containerRef, content]);

  return headings;
}

// Resalta el encabezado que está a la vista mientras se desplaza la página.
function useActiveHeading(headings) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (headings.length === 0) return undefined;
    setActiveId(headings[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

const WIDE_SCREEN = '(min-width: 64rem)';

export function TableOfContents({ headings }) {
  const activeId = useActiveHeading(headings);
  const [open, setOpen] = useState(() => window.matchMedia(WIDE_SCREEN).matches);
  if (headings.length === 0) return null;

  function handleClick(event, id) {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: 'start' });
    // El foco acompaña al desplazamiento para quien navega con teclado o lector de pantalla.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.replaceState(null, '', `#${id}`);
  }

  const links = (
    <ul className="toc__list">
      {headings.map((heading) => (
        <li key={heading.id} className={`toc__item toc__item--level-${heading.level}`}>
          <a
            href={`#${heading.id}`}
            className="toc__link"
            aria-current={activeId === heading.id ? 'location' : undefined}
            onClick={(event) => handleClick(event, heading.id)}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <nav className="toc" aria-labelledby="toc-title">
      {/* En pantallas pequeñas la tabla se pliega para no empujar el contenido hacia abajo. */}
      <details
        className="toc__collapsible"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary className="toc__title" id="toc-title">
          Tabla de contenidos
          <Icon name="chevronDown" size={16} className="toc__chevron" />
        </summary>
        {links}
      </details>
    </nav>
  );
}
