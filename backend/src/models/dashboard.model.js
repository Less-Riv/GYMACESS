// Consultas consolidadas del dashboard administrativo (T051, US6; FR-016,
// FR-017, tabla de indicadores de contracts/api-dashboard.md).
// Todos los indicadores se recalculan desde los módulos de origen en cada
// consulta, sin tablas de resumen: un cambio en cualquier módulo se refleja
// de inmediato (US-S3-06 esc. 6). Todas las consultas usan parámetros (?).
import { obtenerPool } from '../config/database.js';

async function contar(sql, valores) {
  const [filas] = await obtenerPool().query(sql, valores);
  return Number(filas[0].total);
}

export async function indicadoresDeClientes() {
  const total = await contar("SELECT COUNT(*) AS total FROM clientes WHERE estado = 'activo'");
  const sinAsignar = await contar(
    `SELECT COUNT(*) AS total FROM clientes c
     WHERE c.estado = 'activo'
       AND NOT EXISTS (
         SELECT 1 FROM asignaciones_entrenador a
         WHERE a.id_cliente = c.id_cliente AND a.estado = 'activa'
       )`
  );
  const conEntrenador = await contar(
    `SELECT COUNT(DISTINCT a.id_cliente) AS total
     FROM asignaciones_entrenador a
     INNER JOIN clientes c ON c.id_cliente = a.id_cliente AND c.estado = 'activo'
     WHERE a.estado = 'activa'`
  );
  return { activos: total, conEntrenador, sinEntrenador: sinAsignar };
}

export async function indicadoresDeMembresias() {
  const vigentes = await contar(
    "SELECT COUNT(*) AS total FROM membresias WHERE estado = 'activo' AND fecha_fin >= CURDATE()"
  );
  const vencidas = await contar(
    "SELECT COUNT(*) AS total FROM membresias WHERE estado = 'activo' AND fecha_fin < CURDATE()"
  );
  return { vigentes, vencidas };
}

export async function indicadoresDeAccesos(desde, hasta) {
  const recientes = await contar(
    'SELECT COUNT(*) AS total FROM accesos WHERE fecha BETWEEN ? AND ?',
    [desde, hasta]
  );
  const rechazados = await contar(
    "SELECT COUNT(*) AS total FROM accesos WHERE fecha BETWEEN ? AND ? AND resultado = 'rechazado'",
    [desde, hasta]
  );
  return { recientes, rechazados };
}

export async function indicadoresDeEntrenadores() {
  const registrados = await contar('SELECT COUNT(*) AS total FROM entrenadores');
  const activos = await contar("SELECT COUNT(*) AS total FROM entrenadores WHERE estado = 'activo'");
  return { registrados, activos };
}

export async function indicadoresDeRutinas() {
  const activas = await contar("SELECT COUNT(*) AS total FROM rutinas WHERE estado = 'activa'");
  return { activas };
}

// Objetivos del periodo (fecha de creación dentro del rango): cumplidos y
// pendientes (pendiente o en_curso). El porcentaje se calcula en el servicio.
export async function indicadoresDeObjetivos(desde, hasta) {
  const cumplidos = await contar(
    `SELECT COUNT(*) AS total FROM objetivos_entrenamiento
     WHERE estado = 'cumplido' AND DATE(fecha_creacion) BETWEEN ? AND ?`,
    [desde, hasta]
  );
  const pendientes = await contar(
    `SELECT COUNT(*) AS total FROM objetivos_entrenamiento
     WHERE estado IN ('pendiente', 'en_curso') AND DATE(fecha_creacion) BETWEEN ? AND ?`,
    [desde, hasta]
  );
  const cancelados = await contar(
    `SELECT COUNT(*) AS total FROM objetivos_entrenamiento
     WHERE estado = 'cancelado' AND DATE(fecha_creacion) BETWEEN ? AND ?`,
    [desde, hasta]
  );
  return { cumplidos, pendientes, cancelados, total: cumplidos + pendientes + cancelados };
}

export async function indicadoresDeProgresos(desde, hasta) {
  const registrados = await contar(
    'SELECT COUNT(*) AS total FROM progresos_clientes WHERE fecha BETWEEN ? AND ?',
    [desde, hasta]
  );
  return { registrados };
}
