// Acceso a datos de la tabla usuarios (T024, FR-015).
// Todas las consultas usan parámetros posicionales (?); nunca se concatena
// información del usuario en el SQL.
import { obtenerPool } from '../config/database.js';

// Las operaciones aceptan una conexión opcional para participar en una
// transacción (alta de usuario con rol cliente); sin conexión usan el pool.
function base(conexion) {
  return conexion ?? obtenerPool();
}

export async function buscarUsuarioPorCorreo(correo, conexion) {
  const [filas] = await base(conexion).query(
    'SELECT id_usuario, nombre, correo, password, rol, estado FROM usuarios WHERE correo = ?',
    [correo]
  );
  return filas[0] || null;
}

// ¿Este cliente ya está vinculado a algún usuario? (alta automática de cliente)
export async function buscarUsuarioPorClienteId(idCliente, conexion) {
  const [filas] = await base(conexion).query(
    'SELECT id_usuario FROM usuarios WHERE cliente_id = ? LIMIT 1',
    [idCliente]
  );
  return filas[0] || null;
}

export async function buscarUsuarioPorId(id) {
  const [filas] = await obtenerPool().query(
    'SELECT id_usuario, nombre, correo, rol, estado, cliente_id, fecha_creacion FROM usuarios WHERE id_usuario = ?',
    [id]
  );
  return filas[0] || null;
}

export async function listarUsuarios() {
  const [filas] = await obtenerPool().query(
    'SELECT id_usuario, nombre, correo, rol, estado, cliente_id, fecha_creacion FROM usuarios ORDER BY id_usuario'
  );
  return filas;
}

export async function crearUsuario(
  { nombre, correo, password, rol, clienteId = null },
  conexion
) {
  const [resultado] = await base(conexion).query(
    'INSERT INTO usuarios (nombre, correo, password, rol, cliente_id) VALUES (?, ?, ?, ?, ?)',
    [nombre, correo, password, rol, clienteId]
  );
  return resultado.insertId;
}

export async function actualizarRol(id, rol) {
  await obtenerPool().query('UPDATE usuarios SET rol = ? WHERE id_usuario = ?', [rol, id]);
}

export async function actualizarClienteId(id, clienteId) {
  await obtenerPool().query('UPDATE usuarios SET cliente_id = ? WHERE id_usuario = ?', [
    clienteId,
    id,
  ]);
}
