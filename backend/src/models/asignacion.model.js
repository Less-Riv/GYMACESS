// Acceso a datos de la tabla asignaciones_entrenador (T017, US2/US7; FR-003,
// FR-004, RN-16). Todas las consultas usan parámetros posicionales (?).
import { obtenerPool } from '../config/database.js';

function base(conexion) {
  return conexion ?? obtenerPool();
}

// RN-16: con bloqueo (FOR UPDATE) se serializa el acceso a la fila del
// cliente dentro de la transacción de asignación (investigación §2).
export async function buscarAsignacionActivaPorCliente(idCliente, { conexion, bloquear } = {}) {
  const bloqueo = bloquear ? 'FOR UPDATE' : '';
  const [filas] = await base(conexion).query(
    `SELECT * FROM asignaciones_entrenador
     WHERE id_cliente = ? AND estado = 'activa'
     ${bloqueo}`,
    [idCliente]
  );
  return filas[0] || null;
}

export async function buscarAsignacionPorId(id, { conexion, bloquear } = {}) {
  const bloqueo = bloquear ? 'FOR UPDATE' : '';
  const [filas] = await base(conexion).query(
    `SELECT * FROM asignaciones_entrenador WHERE id_asignacion = ? ${bloqueo}`,
    [id]
  );
  return filas[0] || null;
}

export async function crearAsignacion(
  { id_cliente, id_entrenador, fecha_asignacion },
  conexion
) {
  const [resultado] = await base(conexion).query(
    `INSERT INTO asignaciones_entrenador (id_cliente, id_entrenador, fecha_asignacion)
     VALUES (?, ?, ?)`,
    [id_cliente, id_entrenador, fecha_asignacion]
  );
  return resultado.insertId;
}

// Cierre de la asignación vigente: estado 'cerrada' con fecha_fin (RN-17:
// el histórico nunca se elimina, solo se cierra).
export async function cerrarAsignacion(id, fechaFin, conexion) {
  await base(conexion).query(
    `UPDATE asignaciones_entrenador
     SET estado = 'cerrada', fecha_fin = ?
     WHERE id_asignacion = ?`,
    [fechaFin, id]
  );
}

// Baja de un entrenador (FR-001): cierra TODAS sus asignaciones activas.
export async function cerrarAsignacionesActivasDelEntrenador(idEntrenador, fechaFin, conexion) {
  const [resultado] = await base(conexion).query(
    `UPDATE asignaciones_entrenador
     SET estado = 'cerrada', fecha_fin = ?
     WHERE id_entrenador = ? AND estado = 'activa'`,
    [fechaFin, idEntrenador]
  );
  return resultado.affectedRows;
}

// Lectura bloqueante del cliente dentro de la transacción de asignación
// (RN-01: la fila del cliente es el punto de serialización, investigación §2).
export async function buscarClienteParaAsignar(idCliente, conexion) {
  const [filas] = await base(conexion).query(
    'SELECT id_cliente, estado FROM clientes WHERE id_cliente = ? FOR UPDATE',
    [idCliente]
  );
  return filas[0] || null;
}

// Entrenador candidato dentro de la misma transacción (RN-15).
export async function buscarEntrenadorParaAsignar(idEntrenador, conexion) {
  const [filas] = await base(conexion).query(
    'SELECT id_entrenador, estado FROM entrenadores WHERE id_entrenador = ? FOR UPDATE',
    [idEntrenador]
  );
  return filas[0] || null;
}

// Listado con cliente y entrenador (FR-006, US-S3-07); filtros opcionales.
export async function listarAsignaciones({
  clienteId = null,
  entrenadorId = null,
  soloEntrenadorPropio = null,
  estado = null,
} = {}) {
  const condiciones = [];
  const valores = [];

  if (clienteId) {
    condiciones.push('a.id_cliente = ?');
    valores.push(clienteId);
  }
  if (entrenadorId) {
    condiciones.push('a.id_entrenador = ?');
    valores.push(entrenadorId);
  }
  if (soloEntrenadorPropio) {
    condiciones.push('a.id_entrenador = ?');
    valores.push(soloEntrenadorPropio);
  }
  if (estado) {
    condiciones.push('a.estado = ?');
    valores.push(estado);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await obtenerPool().query(
    `SELECT a.id_asignacion, a.id_cliente, a.id_entrenador,
            a.fecha_asignacion, a.fecha_fin, a.estado,
            c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
            c.estado AS estado_cliente,
            e.nombre AS nombre_entrenador, e.estado AS estado_entrenador
     FROM asignaciones_entrenador a
     INNER JOIN clientes c ON c.id_cliente = a.id_cliente
     INNER JOIN entrenadores e ON e.id_entrenador = a.id_entrenador
     ${where}
     ORDER BY a.id_asignacion DESC`,
    valores
  );
  return filas;
}

// ---------------------------------------------------------------------------
// Vista del personal (T059, US7; contracts/api-entrenadores-asignaciones.md)
// ---------------------------------------------------------------------------

// Clientes asignados de UN entrenador (usada por /api/personal y mi-carga);
// el filtro de estado controla qué asignaciones entran en el detalle.
async function clientesAsignadosDe(entrenadorId, estadoAsignacion) {
  const condiciones = [];
  const valores = [];
  if (entrenadorId) {
    condiciones.push('a.id_entrenador = ?');
    valores.push(entrenadorId);
  }
  if (estadoAsignacion) {
    condiciones.push('a.estado = ?');
    valores.push(estadoAsignacion);
  }
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await obtenerPool().query(
    `SELECT a.id_entrenador, a.id_cliente, a.fecha_asignacion, a.estado,
            c.nombre, c.apellido, c.estado AS estado_cliente
     FROM asignaciones_entrenador a
     INNER JOIN clientes c ON c.id_cliente = a.id_cliente
     ${where}
     ORDER BY c.nombre, c.apellido`,
    valores
  );
  return filas;
}

export async function listarPersonal({ entrenadorId = null, estadoAsignacion = null } = {}) {
  const condiciones = entrenadorId ? 'WHERE e.id_entrenador = ?' : '';
  const valores = entrenadorId ? [entrenadorId] : [];
  const [entrenadores] = await obtenerPool().query(
    `SELECT e.id_entrenador, e.nombre, e.estado, e.telefono, e.correo_contacto
     FROM entrenadores e
     ${condiciones}
     ORDER BY e.nombre`,
    valores
  );

  const asignaciones = await clientesAsignadosDe(entrenadorId, estadoAsignacion);
  const porEntrenador = new Map(entrenadores.map((e) => [e.id_entrenador, []]));
  for (const fila of asignaciones) {
    const lista = porEntrenador.get(fila.id_entrenador);
    if (lista) {
      lista.push({
        id_cliente: fila.id_cliente,
        nombre: `${fila.nombre} ${fila.apellido}`,
        fecha_asignacion: fila.fecha_asignacion,
        estado: fila.estado,
        estado_cliente: fila.estado_cliente,
      });
    }
  }

  return entrenadores.map((entrenador) => {
    const clientes = porEntrenador.get(entrenador.id_entrenador);
    return {
      ...entrenador,
      // La carga siempre cuenta las asignaciones VIGENTES, sin importar el
      // filtro aplicado al detalle.
      clientes_asignados: clientes.filter((c) => c.estado === 'activa').length,
      clientes,
    };
  });
}

// Clientes activos sin asignación activa: pendientes de asignación (RN-16).
export async function listarClientesPendientesDeAsignacion() {
  const [filas] = await obtenerPool().query(
    `SELECT c.id_cliente, CONCAT(c.nombre, ' ', c.apellido) AS nombre
     FROM clientes c
     WHERE c.estado = 'activo'
       AND NOT EXISTS (
         SELECT 1 FROM asignaciones_entrenador a
         WHERE a.id_cliente = c.id_cliente AND a.estado = 'activa'
       )
     ORDER BY c.nombre, c.apellido`
  );
  return filas;
}
