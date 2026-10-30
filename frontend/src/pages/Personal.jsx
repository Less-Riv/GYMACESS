// Página de la carga del personal (T061, US7; FR-006, RN-19).
// Administrador y recepcionista ven todo el equipo con su carga y los
// clientes pendientes de asignación; el entrenador usa /api/personal/mi-carga
// (el backend valida los permisos, FR-025).
// La lógica no cambia respecto de la versión anterior: mismos estados
// (personal, pendientes, entrenadorId, estadoAsignacion, expandido, error),
// mismos filtros, misma llamada GET /personal con sus parámetros y los
// mismos enlaces; solo se rediseña la vista con el tema oscuro compartido
// (EncabezadoPagina, tarjetas, tablas y chips de src/styles/tema.css).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta } from '../components/iconos.jsx';

// Chip de estado según el valor del backend. Los valores no previstos
// quedan con el estilo neutro base del chip.
const CLASES_ESTADO = {
  activo: 'chip-activo',
  activa: 'chip-activo',
  inactivo: 'chip-inactivo',
  cerrada: 'chip-inactivo',
};

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
    <main className="pagina pagina-personal">
      <EncabezadoPagina titulo="Carga del personal" />

      <div className="contenido-pagina">
        {error && (
          <div className="alerta alerta-error" role="alert">
            <IconoAlerta />
            <span className="alerta-texto">{error}</span>
            <button type="button" className="boton-reintentar" onClick={cargar}>
              Reintentar
            </button>
          </div>
        )}

        {/* Filtros: mismos campos y handlers que antes. */}
        <section className="tarjeta-oscura tarjeta-filtros">
          <div className="filtros">
            <div className="campo">
              <label htmlFor="per-entrenador">Entrenador</label>
              <select
                id="per-entrenador"
                value={entrenadorId}
                onChange={(ev) => setEntrenadorId(ev.target.value)}
              >
                <option value="">Todos</option>
                {personal.map((persona) => (
                  <option key={persona.id_entrenador} value={persona.id_entrenador}>
                    {persona.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="per-estado">Estado de la asignación</label>
              <select
                id="per-estado"
                value={estadoAsignacion}
                onChange={(ev) => setEstadoAsignacion(ev.target.value)}
              >
                <option value="">Todos</option>
                <option value="activa">activa</option>
                <option value="cerrada">cerrada</option>
              </select>
            </div>
            <button type="button" className="boton-primario" onClick={cargar}>
              Actualizar
            </button>
          </div>
        </section>

        {/* Tabla principal: entrenadores con su carga. */}
        <section className="tarjeta-oscura tarjeta-tabla">
          <div className="listado-cabecera">
            <h2>Entrenadores</h2>
            <span className="listado-total">{personal.length}</span>
          </div>
          <div className="tabla-contenedor">
            <table className="tabla-oscura">
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
                    <td>
                      <span className={`chip ${CLASES_ESTADO[persona.estado] || ''}`}>
                        {persona.estado}
                      </span>
                    </td>
                    <td>{persona.clientes_asignados}</td>
                    <td>
                      <button
                        type="button"
                        className="boton-mini"
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
          </div>
        </section>

        {expandido && (
          <section className="tarjeta-oscura">
            <h2>
              Clientes de {personal.find((p) => p.id_entrenador === expandido)?.nombre}
            </h2>
            <div className="tabla-contenedor">
              <table className="tabla-oscura">
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
                        <td>
                          <span className={`chip ${CLASES_ESTADO[cliente.estado] || ''}`}>
                            {cliente.estado}
                          </span>
                        </td>
                        <td>
                          <Link className="enlace" to={`/clientes/${cliente.id_cliente}`}>
                            Ver cliente
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="tarjeta-oscura">
          <h2>Pendientes de asignación</h2>
          {pendientes.length === 0 ? (
            <p className="estado-vacio">Todos los clientes activos tienen entrenador.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-oscura">
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
                        <Link className="enlace" to={`/clientes/${cliente.id_cliente}`}>
                          Asignar entrenador
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
