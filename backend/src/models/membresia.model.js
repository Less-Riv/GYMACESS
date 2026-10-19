// Acceso a datos de membresías (T019, US-S2-02/US-S2-03; FR-002 a FR-005).
// Tabla creada en el Sprint 1; este sprint la vuelve funcional.
// Todas las consultas usan parámetros posicionales (?).
import { obtenerPool } from '../config/database.js';

// Una membresía activa por cliente (FR-005, clarificación Q1).
export async function contarActivasDeCliente(idCliente, { excluirId = null } = {}) {
  const parametros = [idCliente];
  let excepcion = '';
  if (excluirId) {
    excepcion = 'AND id_membresia <> ?';
    parametros.push(excluirId);
  }
  const [filas] = await obtenerPool().query(
    `SELECT COUNT(*) AS total FROM membresias
     WHERE id_cliente = ? AND estado = 'activo' ${excepcion}`,
    parametros
  );
  return filas[0].total;
}

export async function crearMembresia({ idCliente, idTipo, fechaInicio, fechaFin }) {
  const [resultado] = await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, ?, ?, 'activo')`,
    [idCliente, idTipo, fechaInicio, fechaFin]
  );
  return resultado.insertId;
}

// Une con el tipo para devolver nombre, duración y precio junto a la vigencia.
export async function buscarMembresiaPorId(id) {
  const [filas] = await obtenerPool().query(
    `SELECT m.*, t.nombre AS tipo_nombre, t.duracion AS tipo_duracion,
            t.precio AS tipo_precio
     FROM membresias m
     INNER JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
     WHERE m.id_membresia = ?`,
    [id]
  );
  return filas[0] || null;
}

export async function listarMembresiasPorCliente(idCliente) {
  const [filas] = await obtenerPool().query(
    `SELECT m.*, t.nombre AS tipo_nombre, t.duracion AS tipo_duracion,
            t.precio AS tipo_precio
     FROM membresias m
     INNER JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
     WHERE m.id_cliente = ?
     ORDER BY m.fecha_inicio DESC, m.id_membresia DESC`,
    [idCliente]
  );
  return filas;
}

export async function listarMembresias() {
  const [filas] = await obtenerPool().query(
    `SELECT m.*, t.nombre AS tipo_nombre, t.duracion AS tipo_duracion,
            t.precio AS tipo_precio, c.nombre AS cliente_nombre,
            c.apellido AS cliente_apellido
     FROM membresias m
     INNER JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
     INNER JOIN clientes c ON c.id_cliente = m.id_cliente
     ORDER BY m.id_membresia DESC
     LIMIT 200`
  );
  return filas;
}

export async function extenderFechaFin(idMembresia, nuevaFechaFin, nuevoEstado = 'activo') {
  await obtenerPool().query(
    'UPDATE membresias SET fecha_fin = ?, estado = ? WHERE id_membresia = ?',
    [nuevaFechaFin, nuevoEstado, idMembresia]
  );
}
