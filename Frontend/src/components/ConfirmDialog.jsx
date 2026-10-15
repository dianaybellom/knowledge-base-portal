import { useEffect, useId, useRef } from 'react';
import { Icon } from './Icon';

// Modal de confirmación accesible basado en <dialog> nativo: atrapa el foco, se cierra con
// Escape, deja inerte el resto de la página y devuelve el foco al elemento que lo abrió.
// El foco inicial va a "Cancelar" para que una pulsación accidental no borre nada.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  busy = false,
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleCancel(event) {
    // Escape dispara "cancel": se gestiona desde React para mantener el estado sincronizado.
    event.preventDefault();
    if (!busy) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={handleCancel}
      onClick={(event) => {
        // Clic en el fondo (fuera del contenido) cierra el diálogo.
        if (event.target === dialogRef.current && !busy) onCancel();
      }}
    >
      <div className="dialog__content">
        <span className={`dialog__icon dialog__icon--${tone}`} aria-hidden="true">
          <Icon name="alert" size={24} />
        </span>
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        <div id={messageId} className="dialog__message">
          {message}
        </div>
        <div className="dialog__actions">
          <button ref={cancelRef} type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${tone === 'danger' ? 'button--danger' : 'button--primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
