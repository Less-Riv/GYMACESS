// Modal de confirmación para acciones sensibles (T024; principio XI de
// docs/reglas.md: confirmar antes de acciones que modifican información).
// La lógica no cambia (cierre con Escape y callbacks); solo se rediseña la
// presentación con el tema oscuro compartido.
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
      className="modal-fondo"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={alCancelar}
    >
      <div
        className="tarjeta-oscura modal-caja"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2>{titulo}</h2>
        <p className="modal-mensaje">{mensaje}</p>
        <div className="modal-acciones">
          <button type="button" className="boton-primario" onClick={alConfirmar}>
            {textoConfirmar}
          </button>
          <button type="button" className="boton-secundario" onClick={alCancelar}>
            {textoCancelar}
          </button>
        </div>
      </div>
    </div>
  );
}
