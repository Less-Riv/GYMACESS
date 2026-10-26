// Acceso a datos de la tabla entrenadores (T009, US1/US2/US7; FR-001).
// Todas las consultas usan parámetros posicionales (?).
import { obtenerPool } from '../config/database.js';

// Las operaciones aceptan una conexión opcional para participar en una
// transacción (baja del entrenador con cierre de asignaciones, FR-001).
function base(conexion) {
  return conexion ?? obtenerPool();
}

// Listado del personal con su carga: cuenta de clientes con asignación
// activa (FR-006, contrato api-entrenadores-asignaciones.md).
export async function listarEntrenadores({ soloActivos = false, conexion } = {}) {
  const where = soloActivos ? "WHERE e.estado = 'activo'" : '';
  const [filas] = await base(conexion).query(
    `SELECT e.id_entrenador, e.id_usuario, e.nombre, e.telefono, e.correo_contacto,
            e.estado, e.fecha_registro,
            COUNT(a.id_asignacion) AS clientes_asignados
     FROM entrenadores e
     LEFT JOIN asignaciones_entrenador a
       ON a.id_entrenador = e.id_entrenador AND a.estado = 'activa'
     ${where}
     GROUP BY e.id_entrenador
     ORDER BY e.nombre`
  );
  return filas;
}

export async function buscarEntrenadorPorId(id, conexion) {
  const [filas] = await base(conexion).query(
    'SELECT * FROM entrenadores WHERE id_entrenador = ?',
    [id]
  );
  return filas[0] || null;
}

// RN-15: la unicidad de la ficha por cuenta se garantiza con el índice único
// uq_entrenadores_usuario; esta consulta la anticipa con un 409 claro.
export async function buscarEntrenadorPorIdUsuario(idUsuario, conexion) {
  const [filas] = await base(conexion).query(
    'SELECT * FROM entrenadores WHERE id_usuario = ?',
    [idUsuario]
  );
  return filas[0] || null;
}

export async function crearEntrenador(
  { id_usuario, nombre, telefono = null, correo_contacto = null },
  conexion
) {
  const [resultado] = await base(conexion).query(
    `INSERT INTO entrenadores (id_usuario, nombre, telefono, correo_contacto)
     VALUES (?, ?, ?, ?)`,
    [id_usuario, nombre, telefono, correo_contacto]
  );
  return resultado.insertId;
}

export async function actualizarEntrenador(id, datos, conexion) {
  const camposPermitidos = ['nombre', 'telefono', 'correo_contacto', 'estado'];
  const campos = Object.keys(datos).filter(
    (campo) => camposPermitidos.includes(campo) && datos[campo] !== undefined
  );
  if (campos.length === 0) return false;

  const asignaciones = campos.map((campo) => `${campo} = ?`).join(', ');
  const valores = campos.map((campo) => datos[campo]);
  await base(conexion).query(
    `UPDATE entrenadores SET ${asignaciones} WHERE id_entrenador = ?`,
    [...valores, id]
  );
  return true;
}
