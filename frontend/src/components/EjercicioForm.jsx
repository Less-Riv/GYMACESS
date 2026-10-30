// Formulario de un ejercicio de rutina (T030, US3; FR-008, RN-18).
// RN-18: al menos uno de series, repeticiones o instrucciones debe venir con
// valor; el backend vuelve a validar la regla antes de persistir (FR-025).
// La lógica no cambia: mismas props, mismos valores controlados y el mismo
// helper exerciseValue; solo se rediseña la presentación con el tema oscuro
// (campos etiquetados y botón secundario).
export default function EjercicioForm({ indice, ejercicio, alCambiar, alQuitar }) {
  return (
    <fieldset>
      <legend>Ejercicio {indice + 1}</legend>
      <div className="campo">
        <label htmlFor={`ejercicio-${indice}-nombre`}>Nombre</label>
        <input
          id={`ejercicio-${indice}-nombre`}
          type="text"
          value={exerciseValue(ejercicio.nombre)}
          maxLength={80}
          onChange={(ev) => alCambiar({ ...ejercicio, nombre: ev.target.value })}
          required
        />
      </div>
      <div className="campo">
        <label htmlFor={`ejercicio-${indice}-series`}>Series</label>
        <input
          id={`ejercicio-${indice}-series`}
          type="number"
          min="1"
          value={exerciseValue(ejercicio.series)}
          onChange={(ev) => alCambiar({ ...ejercicio, series: ev.target.value })}
        />
      </div>
      <div className="campo">
        <label htmlFor={`ejercicio-${indice}-repeticiones`}>Repeticiones</label>
        <input
          id={`ejercicio-${indice}-repeticiones`}
          type="text"
          value={exerciseValue(ejercicio.repeticiones)}
          maxLength={30}
          placeholder="10-12, al fallo…"
          onChange={(ev) => alCambiar({ ...ejercicio, repeticiones: ev.target.value })}
        />
      </div>
      <div className="campo">
        <label htmlFor={`ejercicio-${indice}-carga`}>Carga</label>
        <input
          id={`ejercicio-${indice}-carga`}
          type="text"
          value={exerciseValue(ejercicio.carga)}
          maxLength={40}
          onChange={(ev) => alCambiar({ ...ejercicio, carga: ev.target.value })}
        />
      </div>
      <div className="campo">
        <label htmlFor={`ejercicio-${indice}-instrucciones`}>Instrucciones</label>
        <input
          id={`ejercicio-${indice}-instrucciones`}
          type="text"
          value={exerciseValue(ejercicio.instrucciones)}
          maxLength={255}
          onChange={(ev) => alCambiar({ ...ejercicio, instrucciones: ev.target.value })}
        />
      </div>
      {alQuitar && (
        <button type="button" className="boton-secundario" onClick={alQuitar}>
          Quitar ejercicio
        </button>
      )}
    </fieldset>
  );
}

// Evita valores null/undefined en los campos controlados.
function exerciseValue(valor) {
  return valor === null || valor === undefined ? '' : String(valor);
}
