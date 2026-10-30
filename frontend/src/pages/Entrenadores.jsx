// Página de entrenadores (T013, US1; FR-001): listado del personal con su
// carga de clientes, alta y modificación para el administrador.
// El backend valida los permisos (FR-025); el frontend solo refleja el
// contrato de contracts/api-entrenadores-asignaciones.md.
// La lógica no cambia: mismos estados, mismas funciones (abrirAlta,
// abrirEdicion, cambiarCampo, guardar), mismas llamadas (listarEntrenadores,
// crearEntrenador, modificarEntrenador) y los mismos permisos por rol; solo
// se rediseña la presentación con el tema oscuro compartido.
import { useCallback, useEffect, useState } from 'react';
import {
  listarEntrenadores,
  crearEntrenador,
  modificarEntrenador,
} from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta, IconoExito } from '../components/iconos.jsx';

const FORMULARIO_VACIO = {
  id_usuario: '',
  nombre: '',
  telefono: '',
  correo_contacto: '',
  estado: 'activo',
};

// Chip de estado según el valor del backend; los no previstos quedan con el
// estilo neutro base del chip.
const CLASES_ESTADO = {
  activo: 'chip-activo',
  inactivo: 'chip-inactivo',
};

export default function Entrenadores() {
  const { usuario } = useAuth();

  const [entrenadores, setEntrenadores] = useState([]);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [editando, setEditando] = useState(null); // ficha en edición o null
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const respuesta = await listarEntrenadores();
      setEntrenadores(respuesta.entrenadores);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function abrirAlta() {
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setMostrarAlta(true);
  }

  function abrirEdicion(entrenador) {
    setEditando(entrenador);
    setFormulario({
      id_usuario: entrenador.id_usuario,
      nombre: entrenador.nombre,
      telefono: entrenador.telefono || '',
      correo_contacto: entrenador.correo_contacto || '',
      estado: entrenador.estado,
    });
    setMostrarAlta(false);
  }

  function cambiarCampo(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function guardar(ev) {
    ev.preventDefault();
    try {
      if (editando) {
        await modificarEntrenador(editando.id_entrenador, {
          nombre: formulario.nombre,
          telefono: formulario.telefono || null,
          correo_contacto: formulario.correo_contacto || null,
          estado: formulario.estado,
        });
        setMensaje(`Entrenador ${formulario.nombre} actualizado correctamente.`);
      } else {
        await crearEntrenador({
          id_usuario: Number(formulario.id_usuario),
          nombre: formulario.nombre,
          telefono: formulario.telefono || null,
          correo_contacto: formulario.correo_contacto || null,
        });
        setMensaje(`Entrenador ${formulario.nombre} registrado correctamente.`);
      }
      setEditando(null);
      setMostrarAlta(false);
      setFormulario(FORMULARIO_VACIO);
      setError('');
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="pagina pagina-entrenadores">
      <EncabezadoPagina titulo="Entrenadores" />

      <div className="contenido-pagina">
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
            <button type="button" className="boton-reintentar" onClick={cargar}>
              Reintentar
            </button>
          </div>
        )}

        {usuario.rol === 'administrador' && (
          <div className="acciones-fila">
            <button type="button" className="boton-primario" onClick={abrirAlta}>
              Registrar entrenador
            </button>
          </div>
        )}

        {(mostrarAlta || editando) && (
          <form className="tarjeta-oscura formulario" onSubmit={guardar}>
            <h2>{editando ? 'Modificar entrenador' : 'Nuevo entrenador'}</h2>

            {!editando && (
              <div className="campo">
                <label htmlFor="entrenador-cuenta">Cuenta de usuario (id)</label>
                <input
                  id="entrenador-cuenta"
                  type="number"
                  value={formulario.id_usuario}
                  onChange={(ev) => cambiarCampo('id_usuario', ev.target.value)}
                  required
                />
              </div>
            )}
            <div className="campo">
              <label htmlFor="entrenador-nombre">Nombre</label>
              <input
                id="entrenador-nombre"
                type="text"
                value={formulario.nombre}
                onChange={(ev) => cambiarCampo('nombre', ev.target.value)}
                maxLength={80}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="entrenador-telefono">Teléfono</label>
              <input
                id="entrenador-telefono"
                type="text"
                value={formulario.telefono}
                onChange={(ev) => cambiarCampo('telefono', ev.target.value)}
                maxLength={30}
              />
            </div>
            <div className="campo">
              <label htmlFor="entrenador-correo">Correo de contacto</label>
              <input
                id="entrenador-correo"
                type="email"
                value={formulario.correo_contacto}
                onChange={(ev) => cambiarCampo('correo_contacto', ev.target.value)}
                maxLength={120}
              />
            </div>
            {editando && (
              <div className="campo">
                <label htmlFor="entrenador-estado">Estado</label>
                <select
                  id="entrenador-estado"
                  value={formulario.estado}
                  onChange={(ev) => cambiarCampo('estado', ev.target.value)}
                >
                  <option value="activo">activo</option>
                  <option value="inactivo">inactivo</option>
                </select>
              </div>
            )}
            <div className="form-acciones">
              <button type="submit" className="boton-primario">
                {editando ? 'Guardar cambios' : 'Registrar'}
              </button>
              <button
                type="button"
                className="boton-secundario"
                onClick={() => {
                  setEditando(null);
                  setMostrarAlta(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <section className="tarjeta-oscura">
          <div className="listado-cabecera">
            <h2>Entrenadores registrados</h2>
            <span className="listado-total">{entrenadores.length}</span>
          </div>
          <div className="tabla-contenedor">
            <table className="tabla-oscura">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Correo de contacto</th>
                  <th>Clientes asignados</th>
                  <th>Estado</th>
                  {usuario.rol === 'administrador' && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {entrenadores.map((entrenador) => (
                  <tr key={entrenador.id_entrenador}>
                    <td>{entrenador.nombre}</td>
                    <td>{entrenador.telefono || '—'}</td>
                    <td>{entrenador.correo_contacto || '—'}</td>
                    <td>{entrenador.clientes_asignados}</td>
                    <td>
                      <span
                        className={`chip ${CLASES_ESTADO[entrenador.estado] || ''}`}
                      >
                        {entrenador.estado}
                      </span>
                    </td>
                    {usuario.rol === 'administrador' && (
                      <td>
                        <button
                          type="button"
                          className="boton-mini"
                          onClick={() => abrirEdicion(entrenador)}
                        >
                          Modificar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {entrenadores.length === 0 && (
                  <tr>
                    <td colSpan={6}>No hay entrenadores registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
