// Acceso a datos de la tabla rutinas (T026, US3; FR-007, FR-009).
// Todas las consultas usan parámetros posicionales (?).
import { obtenerPool } from '../config/database.js';

function base(conexion) {
  return conexion ?? obtenerPool();
}

export async function listarRutinas({
  clienteId = null,
  estado = null,
  soloEntrenadorPropio = null,
  conexion,
} = {}) {
  const condiciones = [];
  const valores = [];

  if (clienteId) {
    condiciones.push('r.id_cliente = ?');
    valores.push(clienteId);
  }
  if (estado) {
    condiciones.push('r.estado = ?');
    valores.push(estado);
  }
  if (soloEntrenadorPropio) {
    condiciones.push('r.id_entrenador = ?');
    valores.push(soloEntrenadorPropio);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await base(conexion).query(
    `SELECT r.*, c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
            e.nombre AS nombre_entrenador
     FROM rutinas r
     INNER JOIN clientes c ON c.id_cliente = r.id_cliente
     INNER JOIN entrenadores e ON e.id_entrenador = r.id_entrenador
     ${where}
     ORDER BY r.id_rutina DESC`,
    valores
  );
  return filas;
}

export async function buscarRutinaPorId(id, { conexion, bloquear } = {}) {
  const bloqueo = bloquear ? 'FOR UPDATE' : '';
  const [filas] = await base(conexion).query(
    `SELECT * FROM rutinas WHERE id_rutina = ? ${bloqueo}`,
    [id]
  );
  return filas[0] || null;
}

export async function crearRutina({ id_cliente, id_entrenador, nombre, descripcion }, conexion) {
  const [resultado] = await base(conexion).query(
    `INSERT INTO rutinas (id_cliente, id_entrenador, nombre, descripcion)
     VALUES (?, ?, ?, ?)`,
    [id_cliente, id_entrenador, nombre, descripcion]
  );
  return resultado.insertId;
}

// FR-009: al crear una rutina nueva, la activa anterior del cliente pasa a
// 'finalizada'; el cliente siempre tiene como máximo una rutina activa.
export async function finalizarRutinaActiva(idCliente, conexion) {
  await base(conexion).query(
    `UPDATE rutinas SET estado = 'finalizada'
     WHERE id_cliente = ? AND estado = 'activa'`,
    [idCliente]
  );
}

export async function actualizarRutina(id, datos, conexion) {
  const camposPermitidos = ['nombre', 'descripcion'];
  const campos = Object.keys(datos).filter(
    (campo) => camposPermitidos.includes(campo) && datos[campo] !== undefined
  );
  if (campos.length === 0) return false;

  const asignaciones = campos.map((campo) => `${campo} = ?`).join(', ');
  const valores = campos.map((campo) => datos[campo]);
  await base(conexion).query(
    `UPDATE rutinas SET ${asignaciones}, fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id_rutina = ?`,
    [...valores, id]
  );
  return true;
}

// Comprueba que la rutina activa de ese cliente no esté duplicada (se usa en
// las pruebas de la regla FR-009 y en la validación transaccional).
export async function contarRutinasActivas(idCliente, conexion) {
  const [filas] = await base(conexion).query(
    `SELECT COUNT(*) AS total FROM rutinas
     WHERE id_cliente = ? AND estado = 'activa'`,
    [idCliente]
  );
  return filas[0].total;
}
