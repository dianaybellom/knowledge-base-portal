import { Icon } from './Icon';

// Campo de búsqueda con ícono y botón para limpiar.
export function SearchField({ id, label, value, onChange, onClear, placeholder, size = 'default', inputRef }) {
  return (
    <div className={`search-field search-field--${size}`}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <Icon name="search" size={size === 'large' ? 22 : 18} className="search-field__icon" />
      <input
        ref={inputRef}
        id={id}
        type="search"
        className="search-field__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
      />
      {value && onClear && (
        <button type="button" className="icon-button search-field__clear" onClick={onClear} aria-label="Limpiar búsqueda">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
