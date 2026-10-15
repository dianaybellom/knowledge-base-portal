import { Link } from 'react-router-dom';
import { Icon } from './Icon';

// items: [{ label, to? }]; el último elemento es la página actual.
export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Migas de pan" className="breadcrumbs">
      <ol>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {isCurrent || !item.to ? (
                <span aria-current={isCurrent ? 'page' : undefined}>{item.label}</span>
              ) : (
                <Link to={item.to}>{item.label}</Link>
              )}
              {!isCurrent && <Icon name="chevronRight" size={14} className="breadcrumbs__separator" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
