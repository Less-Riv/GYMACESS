// Controlador de membresías (T022, US-S2-02/US-S2-03).
import * as membresiaService from '../services/membresia.service.js';
import {
  validarAsignacionMembresia,
  validarRenovacion,
} from '../validators/membresia.validator.js';
import { responderExito, ERRORES } from '../utils/respuestas.js';

export async function asignarMembresia(req, res, siguiente) {
  try {
    const datos = validarAsignacionMembresia(req.body);
    const membresia = await membresiaService.asignarMembresia(datos, req.usuario);
    return responderExito(res, 201, { membresia });
  } catch (error) {
    return siguiente(error);
  }
}

export async function listarMembresias(req, res, siguiente) {
  try {
    // Si se pide por cliente, se filtra; si no, listado general.
    if (req.query.cliente_id) {
      const idCliente = Number(req.query.cliente_id);
      const resultado = await membresiaService.obtenerPorCliente(idCliente);
      return responderExito(res, 200, resultado);
    }
    const resultado = await membresiaService.obtenerListado(req.usuario.rol);
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}

export async function obtenerMembresia(req, res, siguiente) {
  try {
    const id = Number(req.params.id);
    const membresia = await membresiaService.obtenerMembresiaPorId(id);
    return responderExito(res, 200, { membresia });
  } catch (error) {
    return siguiente(error);
  }
}

// US-S2-03: renovación que extiende la vigencia de la misma membresía.
export async function renovarMembresia(req, res, siguiente) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return siguiente(ERRORES.validacion('El identificador de la membresía no es válido'));
    }
    const datos = validarRenovacion(req.body);
    const membresia = await membresiaService.renovarMembresia(id, datos, req.usuario);
    return responderExito(res, 200, { membresia });
  } catch (error) {
    return siguiente(error);
  }
}
