import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userRoleLabel } from '../utils/catalog';
import { initialsOf } from '../utils/format';
import { Icon } from './Icon';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuId = useId();

  // Cierra el menú al hacer clic fuera o al presionar Escape (devolviendo el foco al botón).
  useEffect(() => {
    if (!open) return undefined;
    function handlePointer(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!user) return null;
  const roleLabel = userRoleLabel(user.role);

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="user-menu__trigger"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar" aria-hidden="true">{initialsOf(user.fullName)}</span>
        <span className="user-menu__identity">
          <span className="user-menu__name">{user.fullName}</span>
          <span className="user-menu__role">{roleLabel}</span>
        </span>
        <span className="visually-hidden">: menú de la cuenta</span>
        <Icon name="chevronDown" size={16} className="user-menu__chevron" />
      </button>

      {open && (
        <div className="user-menu__panel" id={menuId}>
          <div className="user-menu__summary">
            <p className="user-menu__panel-name">{user.fullName}</p>
            <p className="user-menu__panel-email">{user.email}</p>
            <p className="badge badge--role">{roleLabel}</p>
          </div>
          <button type="button" className="user-menu__action" onClick={logout}>
            <Icon name="logout" size={18} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
