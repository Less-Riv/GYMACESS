// Iconos SVG en línea compartidos por las pantallas del tema oscuro.
// Solo presentación: sin librerías externas y con aria-hidden porque
// siempre acompañan a un texto visible.

// Mismo icono de mancuerna del logo de la pantalla de login.
export function IconoMancuerna() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="1.6" y="8.6" width="3.2" height="6.8" rx="1.1" />
      <rect x="19.2" y="8.6" width="3.2" height="6.8" rx="1.1" />
      <rect x="5.6" y="10.4" width="12.8" height="3.2" rx="1.6" />
    </svg>
  );
}

// Círculo con signo de exclamación: avisos de error.
export function IconoAlerta() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.6v5.2" />
      <circle cx="12" cy="16.3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Círculo con palomita: avisos de éxito.
export function IconoExito() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.3 12.4 2.5 2.5 4.9-5.2" />
    </svg>
  );
}
