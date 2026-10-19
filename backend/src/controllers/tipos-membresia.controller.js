// Controlador de tipos de membresía (T013, US-S2-01).
import * as tipoService from '../services/tipo-membresia.service.js';
import {
  validarTipoMembresia,
  validarTipoMembresiaParcial,
} from '../validators/tipo-membresia.validator.js';
import { responderExito } from '../utils/respuestas.js';

export async function crearTipo(req, res, siguiente) {
  try {
    const datos = validarTipoMembresia(req.body);
    const tipo = await tipoService.crearTipo(datos);
    return responderExito(res, 201, { tipo });
  } catch (error) {
    return siguiente(error);
  }
}

export async function listarTipos(req, res, siguiente) {
  try {
    // El recepcionista solo ve los tipos activos (necesarios para asignar y
    // renovar membresías); el administrador ve todos, incluidos los inactivos.
    const soloActivos = req.usuario.rol !== 'administrador';
    const tipos = await tipoService.obtenerListadoTipos({ soloActivos });
    return responderExito(res, 200, { tipos });
  } catch (error) {
    return siguiente(error);
  }
}

export async function modificarTipo(req, res, siguiente) {
  try {
    const id = Number(req.params.id);
    const datos = validarTipoMembresiaParcial(req.body);
    const tipo = await tipoService.modificarTipo(id, datos);
    return responderExito(res, 200, { tipo });
  } catch (error) {
    return siguiente(error);
  }
}

export async function obtenerTipo(req, res, siguiente) {
  try {
    const id = Number(req.params.id);
    const tipo = await tipoService.obtenerTipoPorId(id);
    return responderExito(res, 200, { tipo });
  } catch (error) {
    return siguiente(error);
  }
}
