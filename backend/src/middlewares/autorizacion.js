// Middleware de autorización por rol (FR-005, RN-13).
// La validación de permisos ocurre SIEMPRE en el backend; ocultar opciones en el
// frontend no es una medida de seguridad (constitución Principio V).
import { ERRORES } from '../utils/respuestas.js';

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
