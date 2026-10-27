// Acceso a datos de la tabla progresos_clientes (T035, US4; FR-011, FR-012,
// RN-17). El histórico es INMUTABLE: este modelo NO expone operaciones de
// modificación ni eliminación.
import { obtenerPool } from '../config/database.js';
import { aFechaISO } from '../utils/fechas.js';

function base(conexion) {
  return conexion ?? obtenerPool();
}

// La columna `fecha` es DATE: se proyecta como texto AAAA-MM-DD (contrato
// api-rutinas-progreso.md) en lugar del objeto Date que devuelve mysql2.
function presentarProgreso(progreso) {
  return progreso ? { ...progreso, fecha: aFechaISO(progreso.fecha) } : null;
}

export async function crearProgreso(
  {
    id_cliente,
    id_entrenador,
    id_objetivo = null,
    fecha,
    comentario,
    peso = null,
    pecho = null,
    cintura = null,
    cadera = null,
    muslos = null,
  },
  conexion
) {
  const [resultado] = await base(conexion).query(
    `INSERT INTO progresos_clientes
       (id_cliente, id_entrenador, id_objetivo, fecha, comentario, peso, pecho, cintura, cadera, muslos)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_cliente, id_entrenador, id_objetivo, fecha, comentario, peso, pecho, cintura, cadera, muslos]
  );
  return resultado.insertId;
}

export async function buscarProgresoPorId(id, conexion) {
  const [filas] = await base(conexion).query(
    'SELECT * FROM progresos_clientes WHERE id_progreso = ?',
    [id]
  );
  return presentarProgreso(filas[0] || null);
}

// FR-012: ordenados por fecha ASC para comparar la evolución del cliente.
export async function listarProgresos({
  clienteId = null,
  desde = null,
  hasta = null,
  soloEntrenadorPropio = null,
  conexion,
} = {}) {
  const condiciones = [];
  const valores = [];

  if (clienteId) {
    condiciones.push('p.id_cliente = ?');
    valores.push(clienteId);
  }
  if (desde) {
    condiciones.push('p.fecha >= ?');
    valores.push(desde);
  }
  if (hasta) {
    condiciones.push('p.fecha <= ?');
    valores.push(hasta);
  }
  if (soloEntrenadorPropio) {
    condiciones.push('p.id_entrenador = ?');
    valores.push(soloEntrenadorPropio);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await base(conexion).query(
    `SELECT p.*, c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
            e.nombre AS nombre_entrenador,
            o.descripcion AS descripcion_objetivo
     FROM progresos_clientes p
     INNER JOIN clientes c ON c.id_cliente = p.id_cliente
     INNER JOIN entrenadores e ON e.id_entrenador = p.id_entrenador
     LEFT JOIN objetivos_entrenamiento o ON o.id_objetivo = p.id_objetivo
     ${where}
     ORDER BY p.fecha ASC, p.id_progreso ASC`,
    valores
  );
  return filas.map(presentarProgreso);
}

// FR-011: el objetivo referenciado debe pertenecer al MISMO cliente.
export async function objetivosDelCliente(idCliente, conexion) {
  const [filas] = await base(conexion).query(
    'SELECT id_objetivo FROM objetivos_entrenamiento WHERE id_cliente = ?',
    [idCliente]
  );
  return filas.map((fila) => fila.id_objetivo);
}
