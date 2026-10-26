// Página de la carga del personal (T061, US7; FR-006, RN-19).
// Administrador y recepcionista ven todo el equipo con su carga y los
// clientes pendientes de asignación; el entrenador usa /api/personal/mi-carga
// (el backend valida los permisos, FR-025).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';

export default function Personal() {
  const [personal, setPersonal] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [entrenadorId, setEntrenadorId] = useState('');
  const [estadoAsignacion, setEstadoAsignacion] = useState('');
  const [expandido, setExpandido] = useState(null); // id_entrenador detallado o null
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (entrenadorId) params.set('entrenador_id', entrenadorId);
      if (estadoAsignacion) params.set('estado_asignacion', estadoAsignacion);
      const consulta = params.toString();
      const respuesta = await pedir(`/personal${consulta ? `?${consulta}` : ''}`);
      setPersonal(respuesta.personal);
      setPendientes(respuesta.pendientes_de_asignacion || []);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [entrenadorId, estadoAsignacion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <h1>Carga del personal</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      {error && <p className="mensaje-error">{error}</p>}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
        <label>
          Entrenador
          <select value={entrenadorId} onChange={(ev) => setEntrenadorId(ev.target.value)}>
            <option value="">Todos</option>
            {personal.map((persona) => (
              <option key={persona.id_entrenador} value={persona.id_entrenador}>
                {persona.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado de la asignación
          <select value={estadoAsignacion} onChange={(ev) => setEstadoAsignacion(ev.target.value)}>
            <option value="">Todos</option>
            <option value="activa">activa</option>
            <option value="cerrada">cerrada</option>
          </select>
        </label>
        <button onClick={cargar}>Actualizar</button>
      </div>

      <table style={{ marginTop: '1.5rem' }}>
        <thead>
          <tr>
            <th>Entrenador</th>
            <th>Estado</th>
            <th>Clientes asignados</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {personal.map((persona) => (
            <tr key={persona.id_entrenador}>
              <td>{persona.nombre}</td>
              <td>{persona.estado}</td>
              <td>{persona.clientes_asignados}</td>
              <td>
                <button
                  onClick={() =>
                    setExpandido(expandido === persona.id_entrenador ? null : persona.id_entrenador)
                  }
                >
                  {expandido === persona.id_entrenador ? 'Ocultar' : 'Ver clientes'}
                </button>
              </td>
            </tr>
          ))}
          {personal.length === 0 && (
            <tr>
              <td colSpan={4}>No hay entrenadores para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>

      {expandido && (
        <section style={{ marginTop: '1rem' }}>
          <h2>
            Clientes de {personal.find((p) => p.id_entrenador === expandido)?.nombre}
          </h2>
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Asignado desde</th>
                <th>Estado de la asignación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {personal
                .find((p) => p.id_entrenador === expandido)
                ?.clientes.map((cliente) => (
                  <tr key={cliente.id_cliente}>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.fecha_asignacion}</td>
                    <td>{cliente.estado}</td>
                    <td>
                      <Link to={`/clientes/${cliente.id_cliente}`}>Ver cliente</Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}

      <section style={{ marginTop: '2rem' }}>
        <h2>Pendientes de asignación</h2>
        {pendientes.length === 0 ? (
          <p>Todos los clientes activos tienen entrenador.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((cliente) => (
                <tr key={cliente.id_cliente}>
                  <td>{cliente.nombre}</td>
                  <td>
                    <Link to={`/clientes/${cliente.id_cliente}`}>Asignar entrenador</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
