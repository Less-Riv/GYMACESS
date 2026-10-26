// Formulario de un ejercicio de rutina (T030, US3; FR-008, RN-18).
// RN-18: al menos uno de series, repeticiones o instrucciones debe venir con
// valor; el backend vuelve a validar la regla antes de persistir (FR-025).
export default function EjercicioForm({ indice, ejercicio, alCambiar, alQuitar }) {
  return (
    <fieldset style={{ marginBottom: '0.5rem' }}>
      <legend>Ejercicio {indice + 1}</legend>
      <label>
        Nombre
        <input
          type="text"
          value={exerciseValue(ejercicio.nombre)}
          maxLength={80}
          onChange={(ev) => alCambiar({ ...ejercicio, nombre: ev.target.value })}
          required
        />
      </label>
      <label>
        Series
        <input
          type="number"
          min="1"
          value={exerciseValue(ejercicio.series)}
          onChange={(ev) => alCambiar({ ...ejercicio, series: ev.target.value })}
        />
      </label>
      <label>
        Repeticiones
        <input
          type="text"
          value={exerciseValue(ejercicio.repeticiones)}
          maxLength={30}
          placeholder="10-12, al fallo…"
          onChange={(ev) => alCambiar({ ...ejercicio, repeticiones: ev.target.value })}
        />
      </label>
      <label>
        Carga
        <input
          type="text"
          value={exerciseValue(ejercicio.carga)}
          maxLength={40}
          onChange={(ev) => alCambiar({ ...ejercicio, carga: ev.target.value })}
        />
      </label>
      <label>
        Instrucciones
        <input
          type="text"
          value={exerciseValue(ejercicio.instrucciones)}
          maxLength={255}
          onChange={(ev) => alCambiar({ ...ejercicio, instrucciones: ev.target.value })}
        />
      </label>
      {alQuitar && (
        <button type="button" onClick={alQuitar}>
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
