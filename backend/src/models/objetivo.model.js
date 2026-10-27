// Acceso a datos de la tabla objetivos_entrenamiento (T035, US4; FR-010,
// RN-21). El histórico se conserva; nunca se eliminan registros (RN-17).
import { obtenerPool } from '../config/database.js';
import { aFechaISO } from '../utils/fechas.js';

function base(conexion) {
  return conexion ?? obtenerPool();
}

// `fecha_objetivo` y `fecha_cierre` son DATE: se proyectan como AAAA-MM-DD
// (contrato api-rutinas-progreso.md) en lugar del objeto Date de mysql2.
function presentarObjetivo(objetivo) {
  if (!objetivo) return null;
  return {
    ...objetivo,
    fecha_objetivo: aFechaISO(objetivo.fecha_objetivo),
    fecha_cierre: aFechaISO(objetivo.fecha_cierre),
  };
}

export async function crearObjetivo(
  { id_cliente, id_entrenador, descripcion, fecha_objetivo = null },
  conexion
) {
  const [resultado] = await base(conexion).query(
    `INSERT INTO objetivos_entrenamiento (id_cliente, id_entrenador, descripcion, fecha_objetivo)
     VALUES (?, ?, ?, ?)`,
    [id_cliente, id_entrenador, descripcion, fecha_objetivo]
  );
  return resultado.insertId;
}

export async function buscarObjetivoPorId(id, conexion) {
  const [filas] = await base(conexion).query(
    'SELECT * FROM objetivos_entrenamiento WHERE id_objetivo = ?',
    [id]
  );
  return presentarObjetivo(filas[0] || null);
}

export async function listarObjetivos({
  clienteId = null,
  estado = null,
  soloEntrenadorPropio = null,
  conexion,
} = {}) {
  const condiciones = [];
  const valores = [];

  if (clienteId) {
    condiciones.push('o.id_cliente = ?');
    valores.push(clienteId);
  }
  if (estado) {
    condiciones.push('o.estado = ?');
    valores.push(estado);
  }
  if (soloEntrenadorPropio) {
    condiciones.push('o.id_entrenador = ?');
    valores.push(soloEntrenadorPropio);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await base(conexion).query(
    `SELECT o.*, c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
            e.nombre AS nombre_entrenador
     FROM objetivos_entrenamiento o
     INNER JOIN clientes c ON c.id_cliente = o.id_cliente
     INNER JOIN entrenadores e ON e.id_entrenador = o.id_entrenador
     ${where}
     ORDER BY o.id_objetivo DESC`,
    valores
  );
  return filas.map(presentarObjetivo);
}

// FR-010: los cambios de estado conservan la fecha de cierre para poder
// comparar metas (US-S3-04 esc. 6).
export async function actualizarEstadoObjetivo(id, estado, fechaCierre, conexion) {
  await base(conexion).query(
    `UPDATE objetivos_entrenamiento
     SET estado = ?, fecha_cierre = COALESCE(?, fecha_cierre)
     WHERE id_objetivo = ?`,
    [estado, fechaCierre, id]
  );
}
