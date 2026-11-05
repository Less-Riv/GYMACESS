// Consultas de solo lectura de los reportes del Sprint 4 (T006; FR-003,
// FR-014, FR-039).
// Los reportes nunca escriben: solo SELECT con parámetros posicionales (?).
// Las columnas, la tabla y el orden los fija el código de cada reporte, nunca
// el usuario; los valores del filtro viajan siempre como parámetros.
import { obtenerPool } from '../config/database.js';

// Listado paginado del conjunto filtrado. `tabla` y `columnas` son literales
// del código; `condiciones` son fragmentos fijos con marcadores `?` y
// `valores` sus parámetros, en el mismo orden.
export async function listarPaginado({
  tabla,
  columnas,
  condiciones = [],
  valores = [],
  pagina = 1,
  limite = 20,
  orden = 'id ASC',
}) {
  const offset = (pagina - 1) * limite;
  const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await obtenerPool().query(
    `SELECT ${columnas} FROM ${tabla} ${donde} ORDER BY ${orden} LIMIT ? OFFSET ?`,
    [...valores, Number(limite), Number(offset)]
  );
  return filas;
}

// Conteo del conjunto filtrado completo (no de la página): los totales del
// reporte se calculan sobre el conjunto entero (FR-017).
export async function contarFilas({ tabla, condiciones = [], valores = [] }) {
  const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await obtenerPool().query(
    `SELECT COUNT(*) AS total FROM ${tabla} ${donde}`,
    valores
  );
  return Number(filas[0].total);
}

// Conteo agrupado por una columna: sirve para los totales por estado
// (clientes) y por resultado (accesos).
export async function contarPorColumna({
  tabla,
  columna,
  condiciones = [],
  valores = [],
  extras = '',
}) {
  const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await obtenerPool().query(
    `SELECT ${columna} AS grupo, COUNT(*) AS total FROM ${tabla} ${donde} GROUP BY ${columna} ${extras}`,
    valores
  );
  return filas;
}

// ---------------------------------------------------------------------------
// US-S4-01: reporte de clientes (T014; FR-006, FR-012, FR-013).
// El filtro por periodo se aplica sobre la fecha de registro del cliente
// (FR-012) y el filtro por estado sobre `clientes.estado` (FR-013).
// ---------------------------------------------------------------------------

const TABLA_CLIENTES = 'clientes c';

const COLUMNAS_CLIENTES = `
  c.id_cliente,
  CONCAT(c.nombre, ' ', c.apellido) AS nombre_completo,
  c.correo,
  c.telefono,
  DATE_FORMAT(c.fecha_registro, '%Y-%m-%d') AS fecha_registro,
  c.estado`;

// Condiciones del filtro de clientes: los valores viajan como parámetros.
function condicionesClientes({ desde, hasta, estado }) {
  const condiciones = [];
  const valores = [];

  if (desde && hasta) {
    condiciones.push('DATE(c.fecha_registro) BETWEEN ? AND ?');
    valores.push(desde, hasta);
  }
  if (estado) {
    condiciones.push('c.estado = ?');
    valores.push(estado);
  }

  return { condiciones, valores };
}

export async function listarClientesReporte({ desde, hasta, estado, pagina, limite }) {
  const { condiciones, valores } = condicionesClientes({ desde, hasta, estado });
  return listarPaginado({
    tabla: TABLA_CLIENTES,
    columnas: COLUMNAS_CLIENTES,
    condiciones,
    valores,
    pagina,
    limite,
    orden: 'c.id_cliente ASC',
  });
}

export async function contarClientesReporte({ desde, hasta, estado }) {
  const { condiciones, valores } = condicionesClientes({ desde, hasta, estado });
  return contarFilas({ tabla: TABLA_CLIENTES, condiciones, valores });
}

// Totales del reporte de clientes: el total del conjunto filtrado y su
// desglose por estado (FR-006). Los totales respetan el MISMO filtro que el
// listado, de modo que la suma de las filas mostradas coincide siempre con el
// total (FR-017, SC-002).
export async function totalesClientesReporte({ desde, hasta, estado }) {
  const { condiciones, valores } = condicionesClientes({ desde, hasta, estado });
  const porEstado = await contarPorColumna({
    tabla: TABLA_CLIENTES,
    columna: 'c.estado',
    condiciones,
    valores,
  });

  const desglose = {};
  for (const fila of porEstado) {
    desglose[fila.grupo] = Number(fila.total);
  }

  const total = Object.values(desglose).reduce((suma, valor) => suma + valor, 0);
  return { total, por_estado: desglose };
}

// ---------------------------------------------------------------------------
// US-S4-02: reporte de membresías (T021; FR-007, FR-012, FR-013).
// El filtro por periodo se aplica sobre el PERIODO DE VIGENCIA de la
// membresía (una membresía entra si su vigencia se solapa con el periodo
// consultado) y el filtro por estado sobre `membresias.estado` (FR-013).
// ---------------------------------------------------------------------------

const TABLA_MEMBRESIAS = `
  membresias m
  INNER JOIN clientes c ON c.id_cliente = m.id_cliente
  INNER JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia`;

// Clasificación en los cuatro grupos disjuntos de FR-007, evaluada contra la
// fecha de hoy (no contra el final del periodo filtrado). El orden de las
// reglas importa: primero las suspendidas y canceladas, luego las vencidas,
// luego las próximas a vencer y por defecto las activas.
const GRUPO_MEMBRESIA = `
  CASE
    WHEN m.estado IN ('suspendida', 'cancelada') THEN 'suspendidas_o_canceladas'
    WHEN m.estado = 'vencida' OR m.fecha_fin < CURDATE() THEN 'vencidas'
    WHEN m.estado = 'activo' AND m.fecha_fin <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      THEN 'proximas_a_vencer'
    ELSE 'activas'
  END`;

const COLUMNAS_MEMBRESIAS = `
  m.id_membresia,
  m.id_cliente,
  CONCAT(c.nombre, ' ', c.apellido) AS nombre_completo,
  t.nombre AS tipo_membresia,
  DATE_FORMAT(m.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
  DATE_FORMAT(m.fecha_fin, '%Y-%m-%d') AS fecha_fin,
  m.estado,
  ${GRUPO_MEMBRESIA} AS grupo`;

function condicionesMembresias({ desde, hasta, estado }) {
  const condiciones = [];
  const valores = [];

  if (desde && hasta) {
    // La vigencia de la membresía se solapa con el periodo consultado.
    condiciones.push('m.fecha_inicio <= ? AND m.fecha_fin >= ?');
    valores.push(hasta, desde);
  }
  if (estado) {
    condiciones.push('m.estado = ?');
    valores.push(estado);
  }

  return { condiciones, valores };
}

export async function listarMembresiasReporte({ desde, hasta, estado, pagina, limite }) {
  const { condiciones, valores } = condicionesMembresias({ desde, hasta, estado });
  return listarPaginado({
    tabla: TABLA_MEMBRESIAS,
    columnas: COLUMNAS_MEMBRESIAS,
    condiciones,
    valores,
    pagina,
    limite,
    orden: 'm.id_membresia ASC',
  });
}

export async function contarMembresiasReporte({ desde, hasta, estado }) {
  const { condiciones, valores } = condicionesMembresias({ desde, hasta, estado });
  return contarFilas({ tabla: TABLA_MEMBRESIAS, condiciones, valores });
}

// Totales por grupo (FR-007). Los cuatro grupos son disjuntos y su suma es
// el total de membresías del filtro (SC-014).
export async function totalesMembresiasReporte({ desde, hasta, estado }) {
  const { condiciones, valores } = condicionesMembresias({ desde, hasta, estado });
  const porGrupo = await contarPorColumna({
    tabla: TABLA_MEMBRESIAS,
    columna: GRUPO_MEMBRESIA,
    condiciones,
    valores,
  });

  const grupos = {
    activas: 0,
    proximas_a_vencer: 0,
    vencidas: 0,
    suspendidas_o_canceladas: 0,
  };
  for (const fila of porGrupo) {
    grupos[fila.grupo] = Number(fila.total);
  }

  const total = Object.values(grupos).reduce((suma, valor) => suma + valor, 0);
  return { total, ...grupos };
}

// ---------------------------------------------------------------------------
// US-S4-03: reporte de pagos e ingresos (T028; FR-008, FR-012).
// Solo se contabilizan los pagos en estado 'completado' (FR-008) y el filtro
// por periodo se aplica sobre `DATE(fecha_pago)` (research.md §D3).
// ---------------------------------------------------------------------------

const TABLA_PAGOS = `
  pagos p
  INNER JOIN clientes c ON c.id_cliente = p.id_cliente
  LEFT JOIN membresias m ON m.id_membresia = p.id_membresia
  LEFT JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia`;

const COLUMNAS_PAGOS = `
  p.id_pago,
  p.id_cliente,
  CONCAT(c.nombre, ' ', c.apellido) AS nombre_completo,
  t.nombre AS membresia,
  p.monto,
  DATE_FORMAT(p.fecha_pago, '%Y-%m-%d') AS fecha_pago,
  p.metodo_pago,
  p.estado`;

function condicionesPagos({ desde, hasta }) {
  const condiciones = ["p.estado = 'completado'"];
  const valores = [];

  if (desde && hasta) {
    condiciones.push('DATE(p.fecha_pago) BETWEEN ? AND ?');
    valores.push(desde, hasta);
  }

  return { condiciones, valores };
}

export async function listarPagosReporte({ desde, hasta, pagina, limite }) {
  const { condiciones, valores } = condicionesPagos({ desde, hasta });
  return listarPaginado({
    tabla: TABLA_PAGOS,
    columnas: COLUMNAS_PAGOS,
    condiciones,
    valores,
    pagina,
    limite,
    orden: 'p.fecha_pago DESC, p.id_pago DESC',
  });
}

export async function contarPagosReporte({ desde, hasta }) {
  const { condiciones, valores } = condicionesPagos({ desde, hasta });
  return contarFilas({ tabla: TABLA_PAGOS, condiciones, valores });
}

// Total de ingresos del periodo: la suma de los montos de los pagos
// completados (FR-008).
export async function totalIngresosReporte({ desde, hasta }) {
  const { condiciones, valores } = condicionesPagos({ desde, hasta });
  const donde = `WHERE ${condiciones.join(' AND ')}`;
  const [filas] = await obtenerPool().query(
    `SELECT COALESCE(SUM(p.monto), 0) AS total FROM pagos p ${donde}`,
    valores
  );
  return Number(filas[0].total);
}

// ---------------------------------------------------------------------------
// US-S4-03: reporte de adeudos (T028; FR-011, RN-31).
// El adeudo de cada cliente se calcula sobre su ÚLTIMA membresía registrada
// (la de fecha_inicio más reciente y, a igualdad de fecha, la de identificador
// mayor), con el precio de su tipo de membresía, menos la suma de sus pagos
// completados. El saldo nunca es negativo (research.md §D5).
// Solo se listan los clientes con adeudo pendiente.
// ---------------------------------------------------------------------------

const TABLA_ADEUDOS = `
  membresias m
  INNER JOIN clientes c ON c.id_cliente = m.id_cliente
  INNER JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
  LEFT JOIN (
    SELECT id_cliente, SUM(monto) AS total_pagado
    FROM pagos
    WHERE estado = 'completado'
    GROUP BY id_cliente
  ) pg ON pg.id_cliente = m.id_cliente`;

// La membresía base del adeudo: la última registrada del cliente.
const MEMBRESIA_BASE = `
  m.id_membresia = (
    SELECT m2.id_membresia
    FROM membresias m2
    WHERE m2.id_cliente = m.id_cliente
    ORDER BY m2.fecha_inicio DESC, m2.id_membresia DESC
    LIMIT 1
  )`;

const COLUMNAS_ADEUDOS = `
  m.id_cliente,
  CONCAT(c.nombre, ' ', c.apellido) AS nombre_completo,
  t.precio AS precio_membresia,
  COALESCE(pg.total_pagado, 0) AS total_pagado,
  GREATEST(t.precio - COALESCE(pg.total_pagado, 0), 0) AS saldo_pendiente,
  m.estado AS estado_membresia,
  DATE_FORMAT(m.fecha_fin, '%Y-%m-%d') AS fecha_fin`;

export async function listarAdeudosReporte({ pagina, limite }) {
  return listarPaginado({
    tabla: TABLA_ADEUDOS,
    columnas: COLUMNAS_ADEUDOS,
    condiciones: [MEMBRESIA_BASE, 'GREATEST(t.precio - COALESCE(pg.total_pagado, 0), 0) > 0'],
    valores: [],
    pagina,
    limite,
    orden: 'saldo_pendiente DESC, m.id_cliente ASC',
  });
}

export async function contarAdeudosReporte() {
  return contarFilas({
    tabla: TABLA_ADEUDOS,
    condiciones: [MEMBRESIA_BASE, 'GREATEST(t.precio - COALESCE(pg.total_pagado, 0), 0) > 0'],
    valores: [],
  });
}

// Suma de los saldos pendientes de los clientes con adeudo.
export async function totalAdeudoReporte() {
  const [filas] = await obtenerPool().query(
    `SELECT COALESCE(SUM(saldo), 0) AS total FROM (
       SELECT GREATEST(t.precio - COALESCE(pg.total_pagado, 0), 0) AS saldo
       FROM membresias m
       INNER JOIN clientes c ON c.id_cliente = m.id_cliente
       INNER JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
       LEFT JOIN (
         SELECT id_cliente, SUM(monto) AS total_pagado
         FROM pagos
         WHERE estado = 'completado'
         GROUP BY id_cliente
       ) pg ON pg.id_cliente = m.id_cliente
       WHERE ${MEMBRESIA_BASE}
         AND GREATEST(t.precio - COALESCE(pg.total_pagado, 0), 0) > 0
     ) AS adeudos`
  );
  return Number(filas[0].total);
}

// ---------------------------------------------------------------------------
// US-S4-04: reporte de accesos (T035; FR-010, FR-012, FR-013).
// El filtro por periodo se aplica sobre `accesos.fecha` (columna DATE) y el
// filtro por estado sobre `accesos.resultado` (FR-013).
// ---------------------------------------------------------------------------

const TABLA_ACCESOS = `
  accesos a
  LEFT JOIN clientes c ON c.id_cliente = a.id_cliente`;

const COLUMNAS_ACCESOS = `
  a.id_acceso,
  a.id_cliente,
  CONCAT(c.nombre, ' ', c.apellido) AS nombre_completo,
  DATE_FORMAT(a.fecha, '%Y-%m-%d') AS fecha,
  TIME_FORMAT(a.hora, '%H:%i:%s') AS hora,
  a.resultado,
  a.motivo`;

function condicionesAccesos({ desde, hasta, estado }) {
  const condiciones = [];
  const valores = [];

  if (desde && hasta) {
    condiciones.push('a.fecha BETWEEN ? AND ?');
    valores.push(desde, hasta);
  }
  if (estado) {
    condiciones.push('a.resultado = ?');
    valores.push(estado);
  }

  return { condiciones, valores };
}

export async function listarAccesosReporte({ desde, hasta, estado, pagina, limite }) {
  const { condiciones, valores } = condicionesAccesos({ desde, hasta, estado });
  return listarPaginado({
    tabla: TABLA_ACCESOS,
    columnas: COLUMNAS_ACCESOS,
    condiciones,
    valores,
    pagina,
    limite,
    orden: 'a.fecha DESC, a.hora DESC, a.id_acceso DESC',
  });
}

export async function contarAccesosReporte({ desde, hasta, estado }) {
  const { condiciones, valores } = condicionesAccesos({ desde, hasta, estado });
  return contarFilas({ tabla: TABLA_ACCESOS, condiciones, valores });
}

// Totales del reporte de accesos: total, autorizados y rechazados del
// conjunto filtrado por periodo (FR-010).
export async function totalesAccesosReporte({ desde, hasta }) {
  const { condiciones, valores } = condicionesAccesos({ desde, hasta });
  const porResultado = await contarPorColumna({
    tabla: TABLA_ACCESOS,
    columna: 'a.resultado',
    condiciones,
    valores,
  });

  let autorizados = 0;
  let rechazados = 0;
  for (const fila of porResultado) {
    if (fila.grupo === 'autorizado') autorizados = Number(fila.total);
    if (fila.grupo === 'rechazado') rechazados = Number(fila.total);
  }

  return { total: autorizados + rechazados, autorizados, rechazados };
}
