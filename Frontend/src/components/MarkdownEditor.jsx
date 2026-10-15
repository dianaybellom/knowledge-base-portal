import { useId, useState } from 'react';
import { Icon } from './Icon';
import { MarkdownView } from './MarkdownView';

// Editor de Markdown: textarea con vista previa (la misma que ve el lector final).
// En pantallas anchas se ven lado a lado; en angostas se alterna con un selector.
export function MarkdownEditor({ label, value, onChange, error, hint, maxLength, rows = 16, textareaRef }) {
  const id = useId();
  const [mode, setMode] = useState('write');
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const countId = `${id}-count`;
  const describedBy = [hint && hintId, countId, error && errorId].filter(Boolean).join(' ');

  return (
    <div className={`form-field markdown-editor markdown-editor--${mode} ${error ? 'form-field--invalid' : ''}`}>
      <div className="markdown-editor__header">
        <label htmlFor={id} className="form-field__label">
          {label}
        </label>
        <div className="segmented" role="group" aria-label="Modo del editor">
          <button type="button" className="segmented__option" aria-pressed={mode === 'write'} onClick={() => setMode('write')}>
            Escribir
          </button>
          <button type="button" className="segmented__option" aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}>
            Vista previa
          </button>
        </div>
      </div>

      <div className="markdown-editor__panes">
        <textarea
          ref={textareaRef}
          id={id}
          className="input textarea markdown-editor__input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          maxLength={maxLength}
          spellCheck="true"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
        />
        <div className="markdown-editor__preview" aria-label={`Vista previa: ${label}`} role="region" tabIndex={0}>
          {value.trim() ? (
            <MarkdownView content={value} />
          ) : (
            <p className="text-muted">La vista previa aparecerá aquí cuando escribas contenido.</p>
          )}
        </div>
      </div>

      <div className="form-field__meta">
        {hint && (
          <p id={hintId} className="form-field__hint">
            {hint}
          </p>
        )}
        <p id={countId} className="form-field__count">
          {value.length.toLocaleString('es')} / {maxLength.toLocaleString('es')}
        </p>
      </div>
      {error && (
        <p id={errorId} className="form-field__error">
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}
