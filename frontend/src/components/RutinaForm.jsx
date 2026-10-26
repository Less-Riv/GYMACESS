// Formulario de alta y modificación de rutinas (T030, US3; FR-007, FR-008).
// La lista de ejercicios se envía y se reemplaza en su conjunto (FR-008).
import { useState } from 'react';
import EjercicioForm from './EjercicioForm.jsx';

const EJERCICIO_VACIO = { nombre: '', series: '', repeticiones: '', carga: '', instrucciones: '' };

export default function RutinaForm({ rutina, idCliente, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(rutina?.nombre || '');
  const [descripcion, setDescripcion] = useState(rutina?.descripcion || '');
  const [ejercicios, setEjercicios] = useState(
    rutina?.ejercicios?.length ? rutina.ejercicios.map(limpiarEjercicio) : [{ ...EJERCICIO_VACIO }]
  );

  function limpiarEjercicio(ejercicio) {
    return {
      nombre: ejercicio.nombre || '',
      series: ejercicio.series ?? '',
      repeticiones: ejercicio.repeticiones ?? '',
      carga: ejercicio.carga ?? '',
      instrucciones: ejercicio.instrucciones ?? '',
    };
  }

  function cambiarEjercicio(indice, nuevo) {
    setEjercicios((anterior) =>
      anterior.map((ejercicio, i) => (i === indice ? nuevo : ejercicio))
    );
  }

  function quitarEjercicio(indice) {
    setEjercicios((anterior) => anterior.filter((_ejercicio, i) => i !== indice));
  }

  async function enviar(ev) {
    ev.preventDefault();
    // Se envían solo los campos con valor; el backend valida RN-18.
    const lista = ejercicios.map((ejercicio) => ({
      nombre: ejercicio.nombre.trim(),
      series: ejercicio.series === '' ? null : Number(ejercicio.series),
      repeticiones: ejercicio.repeticiones?.trim() || null,
      carga: ejercicio.carga?.trim() || null,
      instrucciones: ejercicio.instrucciones?.trim() || null,
    }));
    await onGuardar({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      ejercicios: lista,
      id_cliente: idCliente ? Number(idCliente) : undefined,
    });
  }

  return (
    <form onSubmit={enviar} style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
      <h2>{rutina ? 'Modificar rutina' : 'Nueva rutina'}</h2>
      <label>
        Nombre
        <input
          type="text"
          value={nombre}
          maxLength={80}
          onChange={(ev) => setNombre(ev.target.value)}
          required
        />
      </label>
      <label>
        Descripción
        <input
          type="text"
          value={descripcion}
          maxLength={255}
          onChange={(ev) => setDescripcion(ev.target.value)}
        />
      </label>

      <h3>Ejercicios</h3>
      {ejercicios.map((ejercicio, indice) => (
        <EjercicioForm
          key={indice}
          indice={indice}
          ejercicio={ejercicio}
          alCambiar={(nuevo) => cambiarEjercicio(indice, nuevo)}
          alQuitar={ejercicios.length > 1 ? () => quitarEjercicio(indice) : null}
        />
      ))}
      <button
        type="button"
        onClick={() => setEjercicios((anterior) => [...anterior, { ...EJERCICIO_VACIO }])}
      >
        Agregar ejercicio
      </button>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit">Guardar rutina</button>
        <button type="button" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
