// Lógica compartida de los reportes del Sprint 4 (T007; FR-014, FR-017,
// FR-023).
// - El envelope de respuesta es el mismo para los cinco reportes:
//   { tipo, periodo, totales, filas, paginacion }.
// - Los totales se calculan SIEMPRE sobre el conjunto filtrado completo, no
//   sobre la página visible (FR-017).
// - La generación y la exportación se registran en la auditoría con el módulo
//   'reportes' y una descripción compacta con el tipo y los filtros
//   (research.md §D6). Sin usuario identificado no se registra, y un fallo del
//   registro no impide la operación.
import * as auditoriaService from './auditoria.service.js';
import * as reporteModelo from '../models/reporte.model.js';
import { LIMITE_PAGINA } from '../validators/reporte.validator.js';
import { ERRORES } from '../utils/respuestas.js';

// Mapa de manejadores por tipo de reporte. Cada historia de usuario añade su
// entrada con su función; el controlador solo despacha por tipo.
export const REPORTES = {};

// Devuelve el reporte del tipo pedido. Un tipo todavía sin historia asociada
// responde 404 en lugar de fallar con un error interno.
export async function obtenerReporte(tipo, filtros) {
  const manejador = REPORTES[tipo];
  if (!manejador) {
    throw ERRORES.noEncontrado('Reporte');
  }
  return manejador(filtros);
}

// Envelope común de la respuesta (contracts/api-reportes.md).
export function armarEnvelope({
  tipo,
  desde,
  hasta,
  totales,
  filas,
  pagina,
  limite,
  total,
}) {
  return {
    tipo,
    periodo: { desde, hasta },
    totales,
    subtotales: {},
    filas,
    paginacion: {
      pagina,
      limite,
      total,
      totalPaginas: total === 0 ? 0 : Math.ceil(total / limite),
    },
  };
}

// Registro de la auditoría de reportes (FR-023, FR-024, RN-34). Es
// best-effort: `registrarAccion` ya captura su propio fallo y, sin usuario
// identificado, no registra nada.
export async function registrarAuditoriaReporte(idUsuario, accion, descripcion) {
  await auditoriaService.registrarAccion(
    idUsuario,
    accion,
    'reportes',
    'exitoso',
    descripcion
  );
}

// Descripción compacta de la operación, con el tipo y los filtros aplicados
// (research.md §D6). Cabe en `descripcion VARCHAR(255)`.
export function describirOperacion(tipo, filtros, pagina = null) {
  const partes = [`tipo=${tipo}`, `desde=${filtros.desde}`, `hasta=${filtros.hasta}`];
  if (filtros.estado) {
    partes.push(`estado=${filtros.estado}`);
  }
  if (pagina) {
    partes.push(`pagina=${pagina}`);
  }
  return partes.join('; ');
}

// ---------------------------------------------------------------------------
// US-S4-01: reporte de clientes (T015; FR-006, FR-012, FR-013, FR-017).
// El listado y los totales comparten el mismo filtro, de modo que la suma de
// las filas mostradas coincide con el total (FR-017).
// ---------------------------------------------------------------------------

export async function obtenerReporteClientes(filtros) {
  const [filas, total, totales] = await Promise.all([
    reporteModelo.listarClientesReporte({ ...filtros, limite: LIMITE_PAGINA }),
    reporteModelo.contarClientesReporte(filtros),
    reporteModelo.totalesClientesReporte(filtros),
  ]);

  return armarEnvelope({
    tipo: 'clientes',
    desde: filtros.desde,
    hasta: filtros.hasta,
    totales,
    filas,
    pagina: filtros.pagina,
    limite: LIMITE_PAGINA,
    total,
  });
}

REPORTES.clientes = obtenerReporteClientes;

// ---------------------------------------------------------------------------
// US-S4-02: reporte de membresías (T023; FR-007, FR-012, FR-013, FR-017).
// Los cuatro grupos son disjuntos y su suma es el total de membresías del
// filtro (SC-014).
// ---------------------------------------------------------------------------

export async function obtenerReporteMembresias(filtros) {
  const [filas, total, totales] = await Promise.all([
    reporteModelo.listarMembresiasReporte({ ...filtros, limite: LIMITE_PAGINA }),
    reporteModelo.contarMembresiasReporte(filtros),
    reporteModelo.totalesMembresiasReporte(filtros),
  ]);

  return armarEnvelope({
    tipo: 'membresias',
    desde: filtros.desde,
    hasta: filtros.hasta,
    totales,
    filas,
    pagina: filtros.pagina,
    limite: LIMITE_PAGINA,
    total,
  });
}

REPORTES.membresias = obtenerReporteMembresias;

// ---------------------------------------------------------------------------
// US-S4-03: reporte de pagos e ingresos (T029; FR-008, FR-012, FR-017).
// Solo se contabilizan los pagos completados (FR-008). Los montos se devuelven
// como texto con dos decimales, igual que el resto de importes del proyecto.
// ---------------------------------------------------------------------------

function dosDecimales(valor) {
  return Number(valor).toFixed(2);
}

export async function obtenerReportePagos(filtros) {
  const [filas, total, ingresos] = await Promise.all([
    reporteModelo.listarPagosReporte({ ...filtros, limite: LIMITE_PAGINA }),
    reporteModelo.contarPagosReporte(filtros),
    reporteModelo.totalIngresosReporte(filtros),
  ]);

  return armarEnvelope({
    tipo: 'pagos',
    desde: filtros.desde,
    hasta: filtros.hasta,
    totales: { total_pagos: total, total_ingresos: dosDecimales(ingresos) },
    filas,
    pagina: filtros.pagina,
    limite: LIMITE_PAGINA,
    total,
  });
}

REPORTES.pagos = obtenerReportePagos;

// ---------------------------------------------------------------------------
// US-S4-03: reporte de adeudos (T029; FR-011, RN-31).
// El adeudo se calcula sobre la última membresía registrada del cliente,
// descontando solo sus pagos completados (FR-011). El reporte NO se acota por
// periodo: el adeudo es una saldo actual, no una magnitud de un periodo
// (FR-012 no incluye el reporte de adeudos entre los que admiten periodo), y
// el periodo recibido se devuelve en el envelope como referencia.
// ---------------------------------------------------------------------------

export async function obtenerReporteAdeudos(filtros) {
  const [filas, total, adeudo] = await Promise.all([
    reporteModelo.listarAdeudosReporte({ pagina: filtros.pagina, limite: LIMITE_PAGINA }),
    reporteModelo.contarAdeudosReporte(),
    reporteModelo.totalAdeudoReporte(),
  ]);

  return armarEnvelope({
    tipo: 'adeudos',
    desde: filtros.desde,
    hasta: filtros.hasta,
    totales: {
      total_clientes_con_adeudo: total,
      total_adeudo: dosDecimales(adeudo),
    },
    filas,
    pagina: filtros.pagina,
    limite: LIMITE_PAGINA,
    total,
  });
}

REPORTES.adeudos = obtenerReporteAdeudos;

// ---------------------------------------------------------------------------
// US-S4-04: reporte de accesos (T036; FR-010, FR-012, FR-013, FR-017).
// Los totales separan los accesos autorizados de los rechazados del conjunto
// filtrado por periodo (FR-010).
// ---------------------------------------------------------------------------

export async function obtenerReporteAccesos(filtros) {
  const [filas, total, totales] = await Promise.all([
    reporteModelo.listarAccesosReporte({ ...filtros, limite: LIMITE_PAGINA }),
    reporteModelo.contarAccesosReporte(filtros),
    reporteModelo.totalesAccesosReporte(filtros),
  ]);

  return armarEnvelope({
    tipo: 'accesos',
    desde: filtros.desde,
    hasta: filtros.hasta,
    totales,
    filas,
    pagina: filtros.pagina,
    limite: LIMITE_PAGINA,
    total,
  });
}

REPORTES.accesos = obtenerReporteAccesos;

// ---------------------------------------------------------------------------
// US-S4-05: preparación de la exportación (T043; FR-018, FR-019).
// La exportación devuelve el CONJUNTO FILTRADO COMPLETO, no la página
// visible: el parámetro `pagina` no aplica a la exportación (research.md §D8).
// Cuando el conjunto supera el límite de filas exportables, se trunca y se
// informa con un aviso (FR-019).
// ---------------------------------------------------------------------------

export const LIMITE_EXPORTACION = 10000;

// Columnas de cada reporte en el archivo exportado (contracts/api-reportes.md).
const COLUMNAS_EXPORTACION = {
  clientes: [
    { clave: 'id_cliente', etiqueta: 'ID' },
    { clave: 'nombre_completo', etiqueta: 'Cliente' },
    { clave: 'correo', etiqueta: 'Correo' },
    { clave: 'telefono', etiqueta: 'Telefono' },
    { clave: 'fecha_registro', etiqueta: 'Registro' },
    { clave: 'estado', etiqueta: 'Estado' },
  ],
  membresias: [
    { clave: 'id_membresia', etiqueta: 'ID' },
    { clave: 'nombre_completo', etiqueta: 'Cliente' },
    { clave: 'tipo_membresia', etiqueta: 'Tipo' },
    { clave: 'fecha_inicio', etiqueta: 'Inicio' },
    { clave: 'fecha_fin', etiqueta: 'Fin' },
    { clave: 'estado', etiqueta: 'Estado' },
    { clave: 'grupo', etiqueta: 'Grupo' },
  ],
  pagos: [
    { clave: 'id_pago', etiqueta: 'ID' },
    { clave: 'nombre_completo', etiqueta: 'Cliente' },
    { clave: 'membresia', etiqueta: 'Membresia' },
    { clave: 'monto', etiqueta: 'Monto' },
    { clave: 'fecha_pago', etiqueta: 'Fecha' },
    { clave: 'metodo_pago', etiqueta: 'Metodo' },
    { clave: 'estado', etiqueta: 'Estado' },
  ],
  adeudos: [
    { clave: 'id_cliente', etiqueta: 'ID' },
    { clave: 'nombre_completo', etiqueta: 'Cliente' },
    { clave: 'precio_membresia', etiqueta: 'Precio' },
    { clave: 'total_pagado', etiqueta: 'Pagado' },
    { clave: 'saldo_pendiente', etiqueta: 'Saldo' },
    { clave: 'estado_membresia', etiqueta: 'Membresia' },
    { clave: 'fecha_fin', etiqueta: 'Fin' },
  ],
  accesos: [
    { clave: 'id_acceso', etiqueta: 'ID' },
    { clave: 'nombre_completo', etiqueta: 'Cliente' },
    { clave: 'fecha', etiqueta: 'Fecha' },
    { clave: 'hora', etiqueta: 'Hora' },
    { clave: 'resultado', etiqueta: 'Resultado' },
    { clave: 'motivo', etiqueta: 'Motivo' },
  ],
};

// Títulos de cada reporte en el archivo exportado.
const TITULOS_EXPORTACION = {
  clientes: 'Reporte de clientes',
  membresias: 'Reporte de membresías',
  pagos: 'Reporte de pagos e ingresos',
  adeudos: 'Reporte de adeudos pendientes',
  accesos: 'Reporte de accesos',
};

// Lectura del conjunto filtrado completo para cada reporte.
const LECTURAS_EXPORTACION = {
  clientes: async (filtros) => ({
    filas: await reporteModelo.listarClientesReporte({
      ...filtros,
      pagina: 1,
      limite: LIMITE_EXPORTACION,
    }),
    totales: await reporteModelo.totalesClientesReporte(filtros),
  }),
  membresias: async (filtros) => ({
    filas: await reporteModelo.listarMembresiasReporte({
      ...filtros,
      pagina: 1,
      limite: LIMITE_EXPORTACION,
    }),
    totales: await reporteModelo.totalesMembresiasReporte(filtros),
  }),
  pagos: async (filtros) => ({
    filas: await reporteModelo.listarPagosReporte({
      ...filtros,
      pagina: 1,
      limite: LIMITE_EXPORTACION,
    }),
    totales: {
      total_pagos: await reporteModelo.contarPagosReporte(filtros),
      total_ingresos: dosDecimales(await reporteModelo.totalIngresosReporte(filtros)),
    },
  }),
  adeudos: async (filtros) => ({
    filas: await reporteModelo.listarAdeudosReporte({
      pagina: 1,
      limite: LIMITE_EXPORTACION,
    }),
    totales: {
      total_clientes_con_adeudo: await reporteModelo.contarAdeudosReporte(),
      total_adeudo: dosDecimales(await reporteModelo.totalAdeudoReporte()),
    },
  }),
  accesos: async (filtros) => ({
    filas: await reporteModelo.listarAccesosReporte({
      ...filtros,
      pagina: 1,
      limite: LIMITE_EXPORTACION,
    }),
    totales: await reporteModelo.totalesAccesosReporte(filtros),
  }),
};

// Prepara los datos del archivo exportado de un reporte.
export async function prepararExportacion(tipo, filtros) {
  const lectura = LECTURAS_EXPORTACION[tipo];
  if (!lectura) {
    throw ERRORES.noEncontrado('Reporte');
  }

  const { filas, totales } = await lectura(filtros);
  const truncado = filas.length >= LIMITE_EXPORTACION;

  return {
    tipo,
    titulo: TITULOS_EXPORTACION[tipo],
    columnas: COLUMNAS_EXPORTACION[tipo],
    filas,
    totales,
    totalFilas: filas.length,
    truncado,
  };
}

// Totales del reporte en forma de lista etiqueta/valor para el PDF.
export function totalesParaPdf(totales) {
  return Object.entries(totales).map(([clave, valor]) => ({
    etiqueta: ETIQUETAS_TOTAL[clave] || clave,
    valor,
  }));
}

// Etiquetas legibles de los totales en el archivo exportado.
const ETIQUETAS_TOTAL = {
  total: 'Total',
  por_estado: 'Por estado',
  activas: 'Activas',
  proximas_a_vencer: 'Próximas a vencer',
  vencidas: 'Vencidas',
  suspendidas_o_canceladas: 'Suspendidas o canceladas',
  total_pagos: 'Pagos',
  total_ingresos: 'Ingresos',
  total_clientes_con_adeudo: 'Clientes con adeudo',
  total_adeudo: 'Total adeudo',
  autorizados: 'Autorizados',
  rechazados: 'Rechazados',
};
