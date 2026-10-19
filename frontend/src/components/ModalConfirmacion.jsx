// Modal de confirmación para acciones sensibles (T024; principio XI de
// docs/reglas.md: confirmar antes de acciones que modifican información).
import { useEffect } from 'react';

export default function ModalConfirmacion({
  titulo,
  mensaje,
  alConfirmar,
  alCancelar,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
}) {
  // Cerrar con la tecla Escape mejora la accesibilidad.
  useEffect(() => {
    function alTeclear(evento) {
      if (evento.key === 'Escape') alCancelar();
    }
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [alCancelar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={alCancelar}
    >
      <div
        className="tarjeta"
        style={{ maxWidth: 420, margin: '1rem' }}
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2>{titulo}</h2>
        <p>{mensaje}</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="button" onClick={alConfirmar}>
            {textoConfirmar}
          </button>
          <button type="button" onClick={alCancelar}>
            {textoCancelar}
          </button>
        </div>
      </div>
    </div>
  );
}
