// Panel de objetivos de entrenamiento de un cliente (T039, US4; FR-010,
// RN-21). Solo el entrenador de la carga puede crearlos y cambiarles el
// estado (RN-19); el backend vuelve a validar cada operación (FR-025).
// La lógica no cambia: mismos estados, mismas funciones cargar/agregar/
// cambiarEstado y las mismas condiciones por rol (soloLectura); solo se
// rediseña la presentación con el tema oscuro compartido.
import { useCallback, useEffect, useState } from 'react';
import { listarObjetivos, crearObjetivo, modificarObjetivo } from '../services/api.js';
import { IconoAlerta, IconoExito } from './iconos.jsx';

const ESTADOS = ['pendiente', 'en_curso', 'cumplido', 'cancelado'];

// Chip de estado según el valor del backend. Los valores no previstos
// quedan con el estilo neutro base del chip.
const CLASES_ESTADO = {
  pendiente: 'chip-pendiente',
  en_curso: 'chip-en-curso',
  cumplido: 'chip-activo',
  cancelado: 'chip-cancelada',
};

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
    <section className="tarjeta-oscura">
      <h2>Objetivos de entrenamiento</h2>
      {mensaje && (
        <div className="alerta alerta-exito" role="status">
          <IconoExito />
          <span className="alerta-texto">{mensaje}</span>
        </div>
      )}
      {error && (
        <div className="alerta alerta-error" role="alert">
          <IconoAlerta />
          <span className="alerta-texto">{error}</span>
        </div>
      )}

      <div className="tabla-contenedor">
        <table className="tabla-oscura">
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
                <td>
                  <span className={`chip ${CLASES_ESTADO[objetivo.estado] || ''}`}>
                    {objetivo.estado}
                  </span>
                </td>
                <td>{objetivo.fecha_cierre || '—'}</td>
                {!soloLectura && (
                  <td>
                    <div className="campo">
                      <select
                        aria-label="Estado del objetivo"
                        value={objetivo.estado}
                        onChange={(ev) => cambiarEstado(objetivo, ev.target.value)}
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </div>
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
      </div>

      {!soloLectura && (
        <form onSubmit={agregar} className="filtros filtros-formulario">
          <div className="campo">
            <label htmlFor="objetivo-descripcion">Nuevo objetivo</label>
            <input
              id="objetivo-descripcion"
              type="text"
              value={descripcion}
              maxLength={255}
              onChange={(ev) => setDescripcion(ev.target.value)}
              required
            />
          </div>
          <div className="campo">
            <label htmlFor="objetivo-fecha">Fecha objetivo</label>
            <input
              id="objetivo-fecha"
              type="date"
              value={fechaObjetivo}
              onChange={(ev) => setFechaObjetivo(ev.target.value)}
            />
          </div>
          <button type="submit" className="boton-primario">
            Agregar objetivo
          </button>
        </form>
      )}
    </section>
  );
}
