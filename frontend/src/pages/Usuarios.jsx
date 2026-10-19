// Página de usuarios (T042, US3 y US4): alta y asignación de rol.
// Solo accesible con rol administrador (RutaProtegida + backend).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';

const ROLES = ['administrador', 'recepcionista', 'entrenador', 'cliente'];
const VACIO = { nombre: '', apellido: '', correo: '', password: '', rol: 'recepcionista' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedir('/usuarios');
      setUsuarios(respuesta.usuarios);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiar(campo) {
    return (evento) => setFormulario({ ...formulario, [campo]: evento.target.value });
  }

  async function manejarAlta(evento) {
    evento.preventDefault();
    setMensaje('');
    setError('');
    try {
      const cuerpo = {
        nombre: formulario.nombre,
        correo: formulario.correo,
        password: formulario.password,
        rol: formulario.rol,
      };
      // Con rol cliente el backend crea (o reutiliza) el cliente con el mismo
      // correo; el apellido viaja solo en ese caso y no se pide ningún id
      // (aclaración 2026-10-14).
      if (formulario.rol === 'cliente') {
        cuerpo.apellido = formulario.apellido;
      }
      await pedir('/usuarios', { metodo: 'POST', cuerpo });
      setMensaje(`Usuario ${formulario.correo} registrado correctamente.`);
      setFormulario(VACIO);
      await cargar();
    } catch (e) {
      // Muestra el mensaje de error que devuelve el backend (409, 400, 500...).
      setError(e.message);
    }
  }

  async function cambiarRol(usuario, nuevoRol) {
    setMensaje('');
    setError('');
    try {
      const cuerpo = { rol: nuevoRol };
      if (nuevoRol === 'cliente' && usuario.cliente_id) {
        cuerpo.cliente_id = usuario.cliente_id;
      }
      await pedir(`/usuarios/${usuario.id_usuario}/rol`, { metodo: 'PATCH', cuerpo });
      setMensaje(`Rol de ${usuario.correo} actualizado a ${nuevoRol}.`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Usuarios</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      <form className="tarjeta" onSubmit={manejarAlta}>
        <h2>Registrar usuario</h2>
        <label>
          Nombre *
          <input value={formulario.nombre} onChange={cambiar('nombre')} required />
        </label>
        <label>
          Correo *
          <input type="email" value={formulario.correo} onChange={cambiar('correo')} required />
        </label>
        <label>
          Contraseña * (mínimo 8 caracteres)
          <input
            type="password"
            value={formulario.password}
            onChange={cambiar('password')}
            minLength={8}
            required
          />
        </label>
        <label>
          Rol *
          <select value={formulario.rol} onChange={cambiar('rol')}>
            {ROLES.map((rol) => (
              <option key={rol} value={rol}>
                {rol}
              </option>
            ))}
          </select>
        </label>
        {formulario.rol === 'cliente' && (
          <label>
            Apellido (se guarda en el cliente que se crea con este usuario)
            <input
              value={formulario.apellido}
              onChange={cambiar('apellido')}
              maxLength={100}
              placeholder="Vacío si no se conoce"
            />
          </label>
        )}
        <button type="submit">Registrar</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Cambiar rol</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id_usuario}>
              <td>{usuario.nombre}</td>
              <td>{usuario.correo}</td>
              <td>{usuario.rol}</td>
              <td>{usuario.estado}</td>
              <td>
                <select
                  value={usuario.rol}
                  onChange={(evento) => cambiarRol(usuario, evento.target.value)}
                >
                  {ROLES.map((rol) => (
                    <option key={rol} value={rol}>
                      {rol}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
