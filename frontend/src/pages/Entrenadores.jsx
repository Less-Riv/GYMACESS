// Página de entrenadores (T013, US1; FR-001): listado del personal con su
// carga de clientes, alta y modificación para el administrador.
// El backend valida los permisos (FR-025); el frontend solo refleja el
// contrato de contracts/api-entrenadores-asignaciones.md.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listarEntrenadores,
  crearEntrenador,
  modificarEntrenador,
} from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const FORMULARIO_VACIO = {
  id_usuario: '',
  nombre: '',
  telefono: '',
  correo_contacto: '',
  estado: 'activo',
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
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Entrenadores</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {usuario.rol === 'administrador' && (
        <button onClick={abrirAlta}>Registrar entrenador</button>
      )}

      {(mostrarAlta || editando) && (
        <form onSubmit={guardar} style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
          <h2>{editando ? 'Modificar entrenador' : 'Nuevo entrenador'}</h2>

          {!editando && (
            <label>
              Cuenta de usuario (id)
              <input
                type="number"
                value={formulario.id_usuario}
                onChange={(ev) => cambiarCampo('id_usuario', ev.target.value)}
                required
              />
            </label>
          )}
          <label>
            Nombre
            <input
              type="text"
              value={formulario.nombre}
              onChange={(ev) => cambiarCampo('nombre', ev.target.value)}
              maxLength={80}
              required
            />
          </label>
          <label>
            Teléfono
            <input
              type="text"
              value={formulario.telefono}
              onChange={(ev) => cambiarCampo('telefono', ev.target.value)}
              maxLength={30}
            />
          </label>
          <label>
            Correo de contacto
            <input
              type="email"
              value={formulario.correo_contacto}
              onChange={(ev) => cambiarCampo('correo_contacto', ev.target.value)}
              maxLength={120}
            />
          </label>
          {editando && (
            <label>
              Estado
              <select
                value={formulario.estado}
                onChange={(ev) => cambiarCampo('estado', ev.target.value)}
              >
                <option value="activo">activo</option>
                <option value="inactivo">inactivo</option>
              </select>
            </label>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">{editando ? 'Guardar cambios' : 'Registrar'}</button>
            <button
              type="button"
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

      <table style={{ marginTop: '1.5rem' }}>
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
              <td>{entrenador.estado}</td>
              {usuario.rol === 'administrador' && (
                <td>
                  <button onClick={() => abrirEdicion(entrenador)}>Modificar</button>
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
    </main>
  );
}
