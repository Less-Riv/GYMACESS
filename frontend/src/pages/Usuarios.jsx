// Página de usuarios (T042, US3 y US4): alta y asignación de rol.
// Solo accesible con rol administrador (RutaProtegida + backend).
// La lógica no cambia respecto de la versión anterior: mismos estados,
// mismas llamadas a la API (GET /usuarios, POST /usuarios,
// PATCH /usuarios/:id/rol), mismas validaciones (nombre/correo/password
// requeridos, minLength 8, apellido solo con rol cliente) y los mismos
// mensajes del backend. Solo se rediseña la vista (tema oscuro).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';
import './Usuarios.css';

const ROLES = ['administrador', 'recepcionista', 'entrenador', 'cliente'];
const VACIO = { nombre: '', apellido: '', correo: '', password: '', rol: 'recepcionista' };

// Icono del logo: mismo SVG de mancuerna que usa el login.
const ICONO_MANCUERNA = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="1.6" y="8.6" width="3.2" height="6.8" rx="1.1" />
    <rect x="19.2" y="8.6" width="3.2" height="6.8" rx="1.1" />
    <rect x="5.6" y="10.4" width="12.8" height="3.2" rx="1.6" />
  </svg>
);

// Clase del chip de rol según el valor que devuelve el backend.
const CLASES_ROL = {
  administrador: 'rol-administrador',
  recepcionista: 'rol-recepcionista',
  entrenador: 'rol-entrenador',
  cliente: 'rol-cliente',
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  // Solo presentación: alterna el tipo del input de contraseña.
  const [mostrarPassword, setMostrarPassword] = useState(false);

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
    <main className="pagina-usuarios">
      {/* Barra superior: marca, título de página y salida al inicio. */}
      <header className="barra-superior">
        <div className="barra-izquierda">
          <span className="barra-logo" aria-hidden="true">{ICONO_MANCUERNA}</span>
          <span className="barra-marca">
            Gym<span className="barra-marca-acento">Access</span>
          </span>
          <span className="barra-separador" aria-hidden="true" />
          <h1 className="barra-titulo">Usuarios</h1>
        </div>
        <Link to="/" className="boton-secundario">Volver al inicio</Link>
      </header>

      {/* Avisos de la pantalla: éxito en verde tenue; error como alerta
          oscura con borde rojo, ícono y botón para recargar la lista. */}
      <div className="avisos">
        {mensaje && (
          <div className="alerta alerta-exito" role="status">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
            </svg>
            <span>{mensaje}</span>
          </div>
        )}
        {error && (
          <div className="alerta alerta-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.6v5.2" />
              <circle cx="12" cy="16.3" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span className="alerta-texto">{error}</span>
            <button type="button" className="boton-reintentar" onClick={cargar}>
              Reintentar
            </button>
          </div>
        )}
      </div>

      <div className="contenido">
        {/* Columna izquierda: alta de usuario */}
        <section className="tarjeta-oscura tarjeta-alta">
          <h2>Registrar usuario</h2>
          <form className="formulario-alta" onSubmit={manejarAlta}>
            <div className="campo">
              <label htmlFor="usu-nombre">Nombre *</label>
              <input
                id="usu-nombre"
                value={formulario.nombre}
                onChange={cambiar('nombre')}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="usu-correo">Correo *</label>
              <input
                id="usu-correo"
                type="email"
                value={formulario.correo}
                onChange={cambiar('correo')}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="usu-password">Contraseña *</label>
              <div className="campo-password">
                <input
                  id="usu-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  value={formulario.password}
                  onChange={cambiar('password')}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="boton-ojo"
                  onClick={() => setMostrarPassword((visible) => !visible)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={mostrarPassword}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.6-6.2 10-6.2S22 12 22 12s-3.6 6.2-10 6.2S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="2.6" />
                    {mostrarPassword && <path d="M4 20 20 4" />}
                  </svg>
                </button>
              </div>
              <p className="campo-ayuda">Mínimo 8 caracteres</p>
            </div>

            <div className="campo">
              <label htmlFor="usu-rol">Rol *</label>
              <select id="usu-rol" value={formulario.rol} onChange={cambiar('rol')}>
                {ROLES.map((rol) => (
                  <option key={rol} value={rol}>
                    {rol}
                  </option>
                ))}
              </select>
            </div>

            {formulario.rol === 'cliente' && (
              <div className="campo">
                <label htmlFor="usu-apellido">
                  Apellido (se guarda en el cliente que se crea con este usuario)
                </label>
                <input
                  id="usu-apellido"
                  value={formulario.apellido}
                  onChange={cambiar('apellido')}
                  maxLength={100}
                  placeholder="Vacío si no se conoce"
                />
              </div>
            )}

            <button type="submit" className="boton-primario">Registrar</button>
          </form>
        </section>

        {/* Columna derecha: listado de usuarios */}
        <section className="tarjeta-oscura tarjeta-listado">
          <div className="listado-cabecera">
            <h2>Usuarios registrados</h2>
            <span className="listado-total">{usuarios.length}</span>
          </div>

          <div className="tabla-contenedor">
            {usuarios.length === 0 ? (
              <p className="tabla-vacia">Aún no hay usuarios registrados</p>
            ) : (
              <table className="tabla-usuarios">
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
                      <td className="celda-nombre">{usuario.nombre}</td>
                      <td className="celda-correo">{usuario.correo}</td>
                      <td>
                        <span className={`chip-rol ${CLASES_ROL[usuario.rol] || ''}`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`chip-estado ${
                            usuario.estado === 'activo' ? 'estado-activo' : 'estado-inactivo'
                          }`}
                        >
                          {usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <select
                          className="select-rol"
                          value={usuario.rol}
                          onChange={(evento) => cambiarRol(usuario, evento.target.value)}
                          aria-label={`Cambiar rol de ${usuario.correo}`}
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
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
