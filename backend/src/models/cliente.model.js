// Acceso a datos de la tabla clientes (T032, US2/US5/US6/US7; FR-015).
// Todas las consultas usan parámetros posicionales (?).
import { obtenerPool } from '../config/database.js';

// Las operaciones aceptan una conexión opcional para participar en una
// transacción (alta de usuario con rol cliente); sin conexión usan el pool.
function base(conexion) {
  return conexion ?? obtenerPool();
}

export async function crearCliente(
  { nombre, apellido, correo, telefono = null, direccion = null },
  conexion
) {
  const [resultado] = await base(conexion).query(
    'INSERT INTO clientes (nombre, apellido, correo, telefono, direccion) VALUES (?, ?, ?, ?, ?)',
    [nombre, apellido, correo, telefono, direccion]
  );
  return resultado.insertId;
}

export async function buscarClientePorCorreo(correo, conexion) {
  const [filas] = await base(conexion).query('SELECT * FROM clientes WHERE correo = ?', [correo]);
  return filas[0] || null;
}

export async function buscarClientePorId(id) {
  const [filas] = await obtenerPool().query(
    'SELECT * FROM clientes WHERE id_cliente = ?',
    [id]
  );
  return filas[0] || null;
}

// Resuelve el cliente propio de un usuario con rol cliente (US7; aclaración
// 2026-10-09: la relación es usuarios.cliente_id → clientes).
export async function buscarClientePorIdPropio(idUsuario) {
  const [filas] = await obtenerPool().query(
    `SELECT c.* FROM clientes c
     INNER JOIN usuarios u ON u.cliente_id = c.id_cliente
     WHERE u.id_usuario = ?`,
    [idUsuario]
  );
  return filas[0] || null;
}

// Listado paginado (FR-027). Con camposEntrenador proyecta SOLO nombre,
// apellido, teléfono y estado directamente en SQL (FR-025): el backend nunca
// confía en el frontend para filtrar información.
export async function listarClientes({ pagina = 1, limite = 20, camposEntrenador = false }) {
  const offset = (pagina - 1) * limite;
  const campos = camposEntrenador
    ? 'nombre, apellido, telefono, estado'
    : 'id_cliente, nombre, apellido, correo, telefono, direccion, fecha_registro, estado';

  const [filas] = await obtenerPool().query(
    `SELECT ${campos} FROM clientes ORDER BY id_cliente LIMIT ? OFFSET ?`,
    [Number(limite), Number(offset)]
  );
  return filas;
}

export async function contarClientes() {
  const [filas] = await obtenerPool().query('SELECT COUNT(*) AS total FROM clientes');
  return filas[0].total;
}

export async function actualizarCliente(id, datos) {
  // Solo actualiza los campos presentes y permitidos; consultas parametrizadas.
  const camposPermitidos = ['nombre', 'apellido', 'correo', 'telefono', 'direccion'];
  const campos = Object.keys(datos).filter(
    (campo) => camposPermitidos.includes(campo) && datos[campo] !== undefined
  );
  if (campos.length === 0) return false;

  const asignaciones = campos.map((campo) => `${campo} = ?`).join(', ');
  const valores = campos.map((campo) => datos[campo]);
  await obtenerPool().query(
    `UPDATE clientes SET ${asignaciones} WHERE id_cliente = ?`,
    [...valores, id]
  );
  return true;
}
