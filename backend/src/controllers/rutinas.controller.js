// Controlador de rutinas (T029, US3; contracts/api-rutinas-progreso.md).
import * as rutinaService from '../services/rutina.service.js';
import {
  validarRutina,
  validarRutinaParcial,
  validarReemplazoEjercicios,
} from '../validators/rutina.validator.js';
import { responderExito, ERRORES } from '../utils/respuestas.js';

function idDeParametro(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw ERRORES.validacion('El identificador no es válido');
  }
  return id;
}

export async function listarRutinas(req, res, siguiente) {
  try {
    // El filtrado por rol ocurre SIEMPRE en el backend (FR-025, RN-19).
    const resultado = await rutinaService.obtenerListadoRutinas(
      req.usuario.rol,
      req.usuario.id_usuario,
      req.query
    );
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}

export async function crearRutina(req, res, siguiente) {
  try {
    const datos = validarRutina(req.body);
    const { ejercicios, ...cabecera } = datos;
    const rutina = await rutinaService.crearRutina(
      { ...cabecera, ejercicios },
      req.usuario.id_usuario
    );
    return responderExito(res, 201, { rutina });
  } catch (error) {
    return siguiente(error);
  }
}

export async function modificarRutina(req, res, siguiente) {
  try {
    const id = idDeParametro(req.params.id);
    const datos = validarRutinaParcial(req.body);
    const rutina = await rutinaService.modificarRutina(id, datos, req.usuario.id_usuario);
    return responderExito(res, 200, { rutina });
  } catch (error) {
    return siguiente(error);
  }
}

export async function modificarEjercicios(req, res, siguiente) {
  try {
    const id = idDeParametro(req.params.id);
    const { ejercicios } = validarReemplazoEjercicios(req.body);
    const rutina = await rutinaService.modificarEjercicios(
      id,
      ejercicios,
      req.usuario.id_usuario
    );
    return responderExito(res, 200, { rutina });
  } catch (error) {
    return siguiente(error);
  }
}
