// Panel de objetivos de entrenamiento de un cliente (T039, US4; FR-010,
// RN-21). Solo el entrenador de la carga puede crearlos y cambiarles el
// estado (RN-19); el backend vuelve a validar cada operación (FR-025).
import { useCallback, useEffect, useState } from 'react';
import { listarObjetivos, crearObjetivo, modificarObjetivo } from '../services/api.js';

const ESTADOS = ['pendiente', 'en_curso', 'cumplido', 'cancelado'];

export default function ObjetivosPanel({ idCliente, soloLectura = false, onCambio }) {
  const [objetivos, setObjetivos] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [fechaObjetivo, setFechaObjetivo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const respuesta = await listarObjetivos(`?cliente_id=${idCliente}`);
      setObjetivos(respuesta.objetivos);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [idCliente]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function agregar(ev) {
    ev.preventDefault();
    try {
      await crearObjetivo({
        id_cliente: Number(idCliente),
        descripcion: descripcion.trim(),
        fecha_objetivo: fechaObjetivo || null,
      });
      setDescripcion('');
      setFechaObjetivo('');
      setMensaje('Objetivo registrado correctamente.');
      await cargar();
      if (onCambio) onCambio();
    } catch (e) {
      setError(e.message);
    }
  }

  async function cambiarEstado(objetivo, estado) {
    try {
      await modificarObjetivo(objetivo.id_objetivo, { estado });
      setMensaje(`Objetivo "${objetivo.descripcion}" ahora está ${estado}.`);
      await cargar();
      if (onCambio) onCambio();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2>Objetivos de entrenamiento</h2>
      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Fecha objetivo</th>
            <th>Estado</th>
            <th>Cierre</th>
            {!soloLectura && <th>Acción</th>}
          </tr>
        </thead>
        <tbody>
          {objetivos.map((objetivo) => (
            <tr key={objetivo.id_objetivo}>
              <td>{objetivo.descripcion}</td>
              <td>{objetivo.fecha_objetivo || '—'}</td>
              <td>{objetivo.estado}</td>
              <td>{objetivo.fecha_cierre || '—'}</td>
              {!soloLectura && (
                <td>
                  <select
                    value={objetivo.estado}
                    onChange={(ev) => cambiarEstado(objetivo, ev.target.value)}
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </td>
              )}
            </tr>
          ))}
          {objetivos.length === 0 && (
            <tr>
              <td colSpan={5}>Este cliente no tiene objetivos registrados.</td>
            </tr>
          )}
        </tbody>
      </table>

      {!soloLectura && (
        <form onSubmit={agregar} style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
          <label>
            Nuevo objetivo
            <input
              type="text"
              value={descripcion}
              maxLength={255}
              onChange={(ev) => setDescripcion(ev.target.value)}
              required
            />
          </label>
          <label>
            Fecha objetivo
            <input
              type="date"
              value={fechaObjetivo}
              onChange={(ev) => setFechaObjetivo(ev.target.value)}
            />
          </label>
          <button type="submit">Agregar objetivo</button>
        </form>
      )}
    </section>
  );
}
