// Página de rutinas (T031, US3; FR-007, FR-008, FR-009): listado con los
// ejercicios de cada rutina, alta y modificación para el entrenador de la
// carga; consulta en modo lectura para administrador y recepcionista.
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  listarRutinas,
  crearRutina,
  modificarRutina,
  reemplazarEjercicios,
} from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import RutinaForm from '../components/RutinaForm.jsx';
import ObjetivosPanel from '../components/ObjetivosPanel.jsx';
import RegistroProgreso from '../components/RegistroProgreso.jsx';

export default function Rutinas() {
  const { usuario } = useAuth();
  const [parametros] = useSearchParams();
  const clienteId = parametros.get('cliente_id') || '';

  const [rutinas, setRutinas] = useState([]);
  const [estado, setEstado] = useState('');
  const [editando, setEditando] = useState(null); // rutina en edición o null
  const [creando, setCreando] = useState(false);
  const [detalle, setDetalle] = useState(null); // rutina abierta o null
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const puedeEditar = usuario.rol === 'entrenador';

  const cargar = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (clienteId) params.set('cliente_id', clienteId);
      if (estado) params.set('estado', estado);
      const consulta = params.toString();
      const respuesta = await listarRutinas(consulta ? `?${consulta}` : '');
      setRutinas(respuesta.rutinas);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [clienteId, estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardarNueva(datos) {
    await crearRutina(datos);
    setCreando(false);
    setMensaje(`Rutina ${datos.nombre} creada correctamente.`);
    await cargar();
  }

  async function guardarModificacion(datos) {
    await modificarRutina(editando.id_rutina, {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
    });
    await reemplazarEjercicios(editando.id_rutina, datos.ejercicios);
    setEditando(null);
    setMensaje(`Rutina ${datos.nombre} actualizada correctamente.`);
    await cargar();
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <h1>Rutinas de entrenamiento</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
        {clienteId && (
          <>
            {' · '}
            <Link to={`/clientes/${clienteId}`}>Volver al cliente</Link>
          </>
        )}
      </p>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
        <label>
          Estado
          <select value={estado} onChange={(ev) => setEstado(ev.target.value)}>
            <option value="">Todos</option>
            <option value="activa">activa</option>
            <option value="finalizada">finalizada</option>
          </select>
        </label>
        {puedeEditar && (
          <button onClick={() => setCreando(!creando)}>{creando ? 'Ocultar formulario' : 'Nueva rutina'}</button>
        )}
      </div>

      {creando && (
        <RutinaForm
          idCliente={clienteId}
          onGuardar={guardarNueva}
          onCancelar={() => setCreando(false)}
        />
      )}

      {editando && (
        <RutinaForm
          rutina={editando}
          onGuardar={guardarModificacion}
          onCancelar={() => setEditando(null)}
        />
      )}

      <table style={{ marginTop: '1.5rem' }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cliente</th>
            <th>Entrenador</th>
            <th>Estado</th>
            <th>Ejercicios</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {rutinas.map((rutina) => (
            <tr key={rutina.id_rutina}>
              <td>{rutina.nombre}</td>
              <td>
                {rutina.nombre_cliente} {rutina.apellido_cliente}
              </td>
              <td>{rutina.nombre_entrenador}</td>
              <td>{rutina.estado}</td>
              <td>{rutina.ejercicios.length}</td>
              <td style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setDetalle(detalle?.id_rutina === rutina.id_rutina ? null : rutina)}>
                  {detalle?.id_rutina === rutina.id_rutina ? 'Ocultar' : 'Ver ejercicios'}
                </button>
                {puedeEditar && (
                  <button onClick={() => setEditando(rutina)}>Modificar</button>
                )}
              </td>
            </tr>
          ))}
          {rutinas.length === 0 && (
            <tr>
              <td colSpan={6}>No hay rutinas registradas.</td>
            </tr>
          )}
        </tbody>
      </table>

      {detalle && (
        <section style={{ marginTop: '1.5rem' }}>
          <h2>{detalle.nombre} · ejercicios</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Series</th>
                <th>Repeticiones</th>
                <th>Carga</th>
                <th>Instrucciones</th>
              </tr>
            </thead>
            <tbody>
              {detalle.ejercicios.map((ejercicio, indice) => (
                <tr key={ejercicio.id_ejercicio_rutina || indice}>
                  <td>{ejercicio.orden || indice + 1}</td>
                  <td>{ejercicio.nombre}</td>
                  <td>{ejercicio.series ?? '—'}</td>
                  <td>{ejercicio.repeticiones || '—'}</td>
                  <td>{ejercicio.carga || '—'}</td>
                  <td>{ejercicio.instrucciones || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Objetivos y progresos del cliente (US-S3-04): operativos solo para
          el entrenador de la carga; los demás roles los consultan en modo
          lectura. */}
      {clienteId && (
        <>
          <ObjetivosPanel idCliente={clienteId} soloLectura={!puedeEditar} />
          {puedeEditar && <RegistroProgreso idCliente={clienteId} />}
        </>
      )}
    </main>
  );
}
