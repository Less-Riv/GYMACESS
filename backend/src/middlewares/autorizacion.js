// Middleware de autorización por rol (FR-005, RN-13).
// La validación de permisos ocurre SIEMPRE en el backend; ocultar opciones en el
// frontend no es una medida de seguridad (constitución Principio V).
import { ERRORES } from '../utils/respuestas.js';
import * as auditoriaService from '../services/auditoria.service.js';

export function autorizar(...rolesPermitidos) {
  return (req, _res, siguiente) => {
    if (!req.usuario) {
      return siguiente(ERRORES.sesionRequerida());
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return siguiente(ERRORES.autorizacion());
    }
    return siguiente();
  };
}

// Autorización que además deja constancia del intento denegado (US-S4-06
// esc. 5; FR-025, research.md §D6). Es aditivo: `autorizar` no cambia de
// comportamiento y el resto de módulos siguen igual.
// El intento denegado se registra con resultado 'rechazado' porque hay usuario
// identificado; una petición sin token no se registra porque no hay a quién
// atribuirla.
export function autorizarConAuditoria(rolPermitido, tipo, accion = 'generar_reporte') {
  return async (req, _res, siguiente) => {
    if (!req.usuario) {
      return siguiente(ERRORES.sesionRequerida());
    }
    if (req.usuario.rol !== rolPermitido) {
      try {
        await auditoriaService.registrarAccion(
          req.usuario.id_usuario,
          accion,
          'reportes',
          'rechazado',
          describirIntento(req, tipo)
        );
      } catch (_error) {
        // La auditoría es best-effort: no impide rechazar la petición.
      }
      return siguiente(ERRORES.autorizacion());
    }
    return siguiente();
  };
}

// Descripción del intento denegado con la misma forma que el resto de
// registros de reportes (research.md §D6).
function describirIntento(req, tipo) {
  const query = req.query || {};
  return [
    `tipo=${tipo}`,
    `desde=${query.desde || 'todos'}`,
    `hasta=${query.hasta || 'todos'}`,
    `estado=${query.estado || 'todos'}`,
    `pagina=${query.pagina || '1'}`,
  ].join('; ');
}
