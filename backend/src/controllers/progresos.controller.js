// Controlador de objetivos y progresos (T038, US4;
// contracts/api-rutinas-progreso.md).
import * as entrenamientoService from '../services/entrenamiento.service.js';
import {
  validarObjetivo,
  validarObjetivoParcial,
  validarProgreso,
} from '../validators/progreso.validator.js';
import { responderExito, ERRORES } from '../utils/respuestas.js';

function idDeParametro(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw ERRORES.validacion('El identificador no es válido');
  }
  return id;
}

// ---------------------------------------------------------------------------
// Objetivos
// ---------------------------------------------------------------------------

export async function crearObjetivo(req, res, siguiente) {
  try {
    const datos = validarObjetivo(req.body);
    const objetivo = await entrenamientoService.crearObjetivo(datos, req.usuario.id_usuario);
    return responderExito(res, 201, { objetivo });
  } catch (error) {
    return siguiente(error);
  }
}

export async function listarObjetivos(req, res, siguiente) {
  try {
    const resultado = await entrenamientoService.obtenerListadoObjetivos(
      req.usuario.rol,
      req.usuario.id_usuario,
      req.query
    );
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}

export async function modificarObjetivo(req, res, siguiente) {
  try {
    const id = idDeParametro(req.params.id);
    const datos = validarObjetivoParcial(req.body);
    const objetivo = await entrenamientoService.modificarObjetivo(
      id,
      datos,
      req.usuario.id_usuario
    );
    return responderExito(res, 200, { objetivo });
  } catch (error) {
    return siguiente(error);
  }
}

// ---------------------------------------------------------------------------
// Progresos (solo alta y consulta: histórico inmutable, RN-17)
// ---------------------------------------------------------------------------

export async function crearProgreso(req, res, siguiente) {
  try {
    const datos = validarProgreso(req.body);
    const progreso = await entrenamientoService.registrarProgreso(datos, req.usuario.id_usuario);
    return responderExito(res, 201, { progreso });
  } catch (error) {
    return siguiente(error);
  }
}

export async function listarProgresos(req, res, siguiente) {
  try {
    const resultado = await entrenamientoService.obtenerListadoProgresos(
      req.usuario.rol,
      req.usuario.id_usuario,
      req.query
    );
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}
