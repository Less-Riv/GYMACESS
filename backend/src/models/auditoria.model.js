// Acceso a datos de la tabla auditoria (T005, US2/US4/US6/US8; FR-016).
// Solo inserción y consulta; los registros no se eliminan ni se modifican.
// Todas las consultas usan parámetros posicionales (?).
import { obtenerPool } from '../config/database.js';

export async function insertarRegistro(
  { idUsuario, accion, modulo, resultado, descripcion = null }
) {
  const [resultadoInsercion] = await obtenerPool().query(
    `INSERT INTO auditoria (id_usuario, accion, modulo, resultado, descripcion)
     VALUES (?, ?, ?, ?, ?)`,
    [idUsuario, accion, modulo, resultado, descripcion]
  );
  return resultadoInsercion.insertId;
}

// Consulta con filtros opcionales de fecha y módulo; exclusiva del
// administrador (FR-016).
export async function listarRegistros({ fecha = null, modulo = null } = {}) {
  const condiciones = [];
  const valores = [];

  if (fecha) {
    condiciones.push('DATE(a.fecha) = ?');
    valores.push(fecha);
  }
  if (modulo) {
    condiciones.push('a.modulo = ?');
    valores.push(modulo);
  }

  const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await obtenerPool().query(
    `SELECT a.id_auditoria, a.accion, a.modulo, a.fecha, a.resultado,
            a.descripcion, u.nombre AS usuario
     FROM auditoria a
     INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
     ${donde}
     ORDER BY a.fecha DESC, a.id_auditoria DESC
     LIMIT 200`,
    valores
  );
  return filas;
}
