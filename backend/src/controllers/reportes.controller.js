// Controlador de los reportes del Sprint 4 (T008; FR-001, FR-023,
// contracts/api-reportes.md).
// Solo el administrador accede a los reportes: la comprobación vive en el
// backend, en el middleware de la ruta (FR-036). Cada generación y cada
// exportación se registra en la auditoría (FR-023, FR-024).
import * as reporteService from '../services/reporte.service.js';
import * as reportePdfService from '../services/reporte-pdf.service.js';
import { validarFiltroReporte } from '../validators/reporte.validator.js';
import { responderExito } from '../utils/respuestas.js';

// Manejador común de los cinco reportes de consulta. Valida los filtros,
// pide el reporte al servicio, deja constancia en la auditoría y responde
// con el envelope del contrato.
export async function responderReporte(req, res, siguiente, tipo) {
  try {
    const filtros = validarFiltroReporte(tipo, req.query);
    const reporte = await reporteService.obtenerReporte(tipo, filtros);

    // Auditoría de la generación (FR-023). Es best-effort: si el registro
    // falla, el reporte se entrega igual.
    await reporteService.registrarAuditoriaReporte(
      req.usuario?.id_usuario,
      'generar_reporte',
      reporteService.describirOperacion(tipo, filtros, filtros.pagina)
    );

    return responderExito(res, 200, reporte);
  } catch (error) {
    return siguiente(error);
  }
}

export function obtenerReporteClientes(req, res, siguiente) {
  return responderReporte(req, res, siguiente, 'clientes');
}

export function obtenerReporteMembresias(req, res, siguiente) {
  return responderReporte(req, res, siguiente, 'membresias');
}

export function obtenerReportePagos(req, res, siguiente) {
  return responderReporte(req, res, siguiente, 'pagos');
}

export function obtenerReporteAdeudos(req, res, siguiente) {
  return responderReporte(req, res, siguiente, 'adeudos');
}

export function obtenerReporteAccesos(req, res, siguiente) {
  return responderReporte(req, res, siguiente, 'accesos');
}

// Manejador común de la exportación a PDF (US-S4-05; FR-018, FR-019, FR-021,
// FR-022, FR-024). Devuelve el conjunto filtrado COMPLETO, no la página
// visible, y expone los encabezados de control del truncamiento.
export async function exportarReporte(req, res, siguiente, tipo) {
  try {
    const filtros = validarFiltroReporte(tipo, req.query);
    const preparacion = await reporteService.prepararExportacion(tipo, filtros);

    // Un dato que el PDF no puede representar se rechaza con un error de
    // validación, en lugar de generar un archivo corrupto (FR-021).
    reportePdfService.validarCaracteresExportables(
      preparacion.filas,
      preparacion.columnas
    );

    const subtitulo = `Periodo: ${filtros.desde} a ${filtros.hasta}`;
    const aviso = preparacion.truncado
      ? `El conjunto filtrado supera el limite de ${reporteService.LIMITE_EXPORTACION} filas exportables: este archivo contiene solo las primeras ${preparacion.totalFilas} filas.`
      : null;

    const documento = reportePdfService.generarReportePdf({
      titulo: preparacion.titulo,
      subtitulo,
      columnas: preparacion.columnas,
      filas: preparacion.filas,
      totales: reporteService.totalesParaPdf(preparacion.totales),
      aviso,
    });

    // Auditoría de la exportación (FR-024).
    await reporteService.registrarAuditoriaReporte(
      req.usuario?.id_usuario,
      'exportar_reporte',
      reporteService.describirOperacion(tipo, filtros)
    );

    const nombre = `reporte-${tipo}-${filtros.desde}-${filtros.hasta}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.setHeader('X-Reporte-Total-Filas', String(preparacion.totalFilas));
    res.setHeader('X-Reporte-Filas-Exportadas', String(preparacion.totalFilas));
    res.setHeader('X-Reporte-Truncado', String(preparacion.truncado));

    documento.pipe(res);
    documento.end();
    return undefined;
  } catch (error) {
    return siguiente(error);
  }
}

export function exportarReporteClientes(req, res, siguiente) {
  return exportarReporte(req, res, siguiente, 'clientes');
}

export function exportarReporteMembresias(req, res, siguiente) {
  return exportarReporte(req, res, siguiente, 'membresias');
}

export function exportarReportePagos(req, res, siguiente) {
  return exportarReporte(req, res, siguiente, 'pagos');
}

export function exportarReporteAdeudos(req, res, siguiente) {
  return exportarReporte(req, res, siguiente, 'adeudos');
}

export function exportarReporteAccesos(req, res, siguiente) {
  return exportarReporte(req, res, siguiente, 'accesos');
}
