// Logo del mockup: dos cuadrados superpuestos (turquesa y azul).
export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="18" height="18" rx="2" fill="var(--color-teal)" />
      <rect x="12" y="12" width="18" height="18" rx="2" fill="var(--color-accent)" />
    </svg>
  );
}
