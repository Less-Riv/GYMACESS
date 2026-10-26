// Controlador de entrenadores (T011, US1; contracts/api-entrenadores-asignaciones.md).
import * as entrenadorService from '../services/entrenador.service.js';
import {
  validarEntrenador,
  validarEntrenadorParcial,
} from '../validators/entrenador.validator.js';
import { responderExito } from '../utils/respuestas.js';

export async function listarEntrenadores(req, res, siguiente) {
  try {
    // El alcance del listado depende del rol autenticado, nunca de parámetros
    // del cliente (FR-025).
    const resultado = await entrenadorService.obtenerListadoEntrenadores(req.usuario.rol);
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}

export async function crearEntrenador(req, res, siguiente) {
  try {
    const datos = validarEntrenador(req.body);
    const entrenador = await entrenadorService.registrarEntrenador(datos);
    return responderExito(res, 201, { entrenador });
  } catch (error) {
    return siguiente(error);
  }
}

export async function modificarEntrenador(req, res, siguiente) {
  try {
    const id = Number(req.params.id);
    const datos = validarEntrenadorParcial(req.body);
    const entrenador = await entrenadorService.modificarEntrenador(id, datos);
    return responderExito(res, 200, { entrenador });
  } catch (error) {
    return siguiente(error);
  }
}
