// Controlador de asignaciones (T021, US2; contracts/api-entrenadores-asignaciones.md).
import * as asignacionService from '../services/asignacion.service.js';
import { validarAsignacion, validarReasignacion } from '../validators/asignacion.validator.js';
import { responderExito, ERRORES } from '../utils/respuestas.js';

export async function crearAsignacion(req, res, siguiente) {
  try {
    const datos = validarAsignacion(req.body);
    const asignacion = await asignacionService.registrarAsignacion(
      datos,
      req.usuario.id_usuario
    );
    return responderExito(res, 201, { asignacion });
  } catch (error) {
    return siguiente(error);
  }
}

export async function reasignarAsignacion(req, res, siguiente) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw ERRORES.validacion('El identificador de la asignación no es válido');
    }
    const datos = validarReasignacion(req.body);
    const asignacion = await asignacionService.reasignarAsignacion(
      id,
      datos,
      req.usuario.id_usuario
    );
    return responderExito(res, 200, { asignacion });
  } catch (error) {
    return siguiente(error);
  }
}

export async function listarAsignaciones(req, res, siguiente) {
  try {
    // El filtrado por rol ocurre SIEMPRE en el backend (FR-025, RN-19).
    const resultado = await asignacionService.obtenerListadoAsignaciones(
      req.usuario.rol,
      req.usuario.id_usuario,
      req.query
    );
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}
