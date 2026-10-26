// Componente de asignación y reasignación de entrenador a un cliente
// (T022, US2; FR-003, FR-004, RN-16).
// La confirmación previa a la reasignación usa ModalConfirmacion (principio
// XI de docs/reglas.md); el backend valida permisos y unicidad (FR-025).
import { useCallback, useEffect, useState } from 'react';
import {
  listarEntrenadores,
  listarAsignaciones,
  asignarEntrenador,
  reasignarEntrenador,
} from '../services/api.js';
import ModalConfirmacion from './ModalConfirmacion.jsx';

export default function AsignarEntrenador({ idCliente, onCambio }) {
  const [entrenadores, setEntrenadores] = useState([]);
  const [asignacionActiva, setAsignacionActiva] = useState(null);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] = useState('');
  const [confirmarReasignacion, setConfirmarReasignacion] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [lista, asignaciones] = await Promise.all([
        listarEntrenadores(),
        listarAsignaciones(`?cliente_id=${idCliente}`),
      ]);
      setEntrenadores(lista.entrenadores.filter((e) => e.estado === 'activo'));
      setAsignacionActiva(
        asignaciones.asignaciones.find((a) => a.estado === 'activa') || null
      );
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [idCliente]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar() {
    setError('');
    try {
      if (asignacionActiva) {
        await reasignarEntrenador(asignacionActiva.id_asignacion, {
          id_entrenador: Number(entrenadorSeleccionado),
        });
      } else {
        await asignarEntrenador({
          id_cliente: Number(idCliente),
          id_entrenador: Number(entrenadorSeleccionado),
        });
      }
      setConfirmarReasignacion(false);
      setEntrenadorSeleccionado('');
      await cargar();
      if (onCambio) onCambio();
    } catch (e) {
      setError(e.message);
      setConfirmarReasignacion(false);
    }
  }

  function alEnviar(ev) {
    ev.preventDefault();
    if (!entrenadorSeleccionado) return;
    // Reasignar cambia quién sigue al cliente: requiere confirmación.
    if (asignacionActiva) {
      setConfirmarReasignacion(true);
      return;
    }
    return guardar();
  }

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2>Entrenador asignado</h2>
      {error && <p className="mensaje-error">{error}</p>}

      {asignacionActiva ? (
        <p>
          <strong>Actual:</strong> {asignacionActiva.nombre_entrenador}{' '}
          (desde {new Date(asignacionActiva.fecha_asignacion).toLocaleDateString()})
        </p>
      ) : (
        <p>Este cliente no tiene entrenador asignado.</p>
      )}

      <form onSubmit={alEnviar} style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
        <label>
          Entrenador
          <select
            value={entrenadorSeleccionado}
            onChange={(ev) => setEntrenadorSeleccionado(ev.target.value)}
            required
          >
            <option value="">Selecciona un entrenador…</option>
            {entrenadores.map((entrenador) => (
              <option key={entrenador.id_entrenador} value={entrenador.id_entrenador}>
                {entrenador.nombre} ({entrenador.clientes_asignados} clientes)
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!entrenadorSeleccionado}>
          {asignacionActiva ? 'Reasignar' : 'Asignar'}
        </button>
      </form>

      {confirmarReasignacion && (
        <ModalConfirmacion
          titulo="Confirmar reasignación"
          mensaje={`El cliente dejará de estar a cargo de ${asignacionActiva?.nombre_entrenador} y pasará al entrenador seleccionado. La asignación anterior se conserva con su fecha de fin.`}
          alConfirmar={guardar}
          alCancelar={() => setConfirmarReasignacion(false)}
          textoConfirmar="Reasignar"
        />
      )}
    </section>
  );
}
