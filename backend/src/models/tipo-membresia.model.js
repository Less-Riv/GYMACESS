// Acceso a datos de tipos de membresía (T010, US-S2-01; FR-001).
// Tabla creada en el Sprint 1; este sprint agrega las operaciones funcionales.
// Todas las consultas usan parámetros posicionales (?).
import { obtenerPool } from '../config/database.js';

export async function crearTipo({ nombre, descripcion = null, duracion, precio }) {
  const [resultado] = await obtenerPool().query(
    `INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio)
     VALUES (?, ?, ?, ?)`,
    [nombre, descripcion, duracion, precio]
  );
  return resultado.insertId;
}

export async function buscarTipoPorId(id) {
  const [filas] = await obtenerPool().query(
    'SELECT * FROM tipos_membresia WHERE id_tipo_membresia = ?',
    [id]
  );
  return filas[0] || null;
}

export async function listarTipos({ soloActivos = false } = {}) {
  const donde = soloActivos ? "WHERE estado = 'activo'" : '';
  const [filas] = await obtenerPool().query(
    `SELECT id_tipo_membresia, nombre, descripcion, duracion, precio, estado
     FROM tipos_membresia
     ${donde}
     ORDER BY id_tipo_membresia`
  );
  return filas;
}

// Solo actualiza los campos presentes y permitidos (FR-001).
export async function actualizarTipo(id, datos) {
  const camposPermitidos = ['nombre', 'descripcion', 'duracion', 'precio', 'estado'];
  const campos = Object.keys(datos).filter(
    (campo) => camposPermitidos.includes(campo) && datos[campo] !== undefined
  );
  if (campos.length === 0) return false;

  const asignaciones = campos.map((campo) => `${campo} = ?`).join(', ');
  const valores = campos.map((campo) => datos[campo]);
  await obtenerPool().query(
    `UPDATE tipos_membresia SET ${asignaciones} WHERE id_tipo_membresia = ?`,
    [...valores, id]
  );
  return true;
}
