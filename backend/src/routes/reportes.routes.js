// Rutas de los reportes del Sprint 4 (T009; US-S4-01 a US-S4-06;
// contracts/api-reportes.md).
// Exclusivas del administrador: recepcionista, entrenador y cliente reciben
// 403 (FR-001, RN-25). La autorización SIEMPRE está en el backend y el
// intento denegado queda registrado en la auditoría (US-S4-06 esc. 5).
// Las rutas de exportación las añade US-S4-05 (T043).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizarConAuditoria } from '../middlewares/autorizacion.js';
import {
  obtenerReporteClientes,
  obtenerReporteMembresias,
  obtenerReportePagos,
  obtenerReporteAdeudos,
  obtenerReporteAccesos,
  exportarReporteClientes,
  exportarReporteMembresias,
  exportarReportePagos,
  exportarReporteAdeudos,
  exportarReporteAccesos,
} from '../controllers/reportes.controller.js';

export const rutasReportes = Router();

rutasReportes.use(autenticar);

rutasReportes.get(
  '/clientes',
  autorizarConAuditoria('administrador', 'clientes'),
  obtenerReporteClientes
);
rutasReportes.get(
  '/membresias',
  autorizarConAuditoria('administrador', 'membresias'),
  obtenerReporteMembresias
);
rutasReportes.get(
  '/pagos',
  autorizarConAuditoria('administrador', 'pagos'),
  obtenerReportePagos
);
rutasReportes.get(
  '/adeudos',
  autorizarConAuditoria('administrador', 'adeudos'),
  obtenerReporteAdeudos
);
rutasReportes.get(
  '/accesos',
  autorizarConAuditoria('administrador', 'accesos'),
  obtenerReporteAccesos
);

// Exportación a PDF (US-S4-05, T043). El parámetro `pagina` no aplica: el
// archivo contiene el conjunto filtrado completo.
rutasReportes.get(
  '/clientes/exportar',
  autorizarConAuditoria('administrador', 'clientes', 'exportar_reporte'),
  exportarReporteClientes
);
rutasReportes.get(
  '/membresias/exportar',
  autorizarConAuditoria('administrador', 'membresias', 'exportar_reporte'),
  exportarReporteMembresias
);
rutasReportes.get(
  '/pagos/exportar',
  autorizarConAuditoria('administrador', 'pagos', 'exportar_reporte'),
  exportarReportePagos
);
rutasReportes.get(
  '/adeudos/exportar',
  autorizarConAuditoria('administrador', 'adeudos', 'exportar_reporte'),
  exportarReporteAdeudos
);
rutasReportes.get(
  '/accesos/exportar',
  autorizarConAuditoria('administrador', 'accesos', 'exportar_reporte'),
  exportarReporteAccesos
);
