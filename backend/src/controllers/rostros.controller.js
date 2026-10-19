// Controlador de rostros (T032, US-S2-06).
import * as rostroService from '../services/rostro.service.js';
import { validarRegistroRostro } from '../validators/rostro.validator.js';
import { responderExito } from '../utils/respuestas.js';

export async function registrarRostro(req, res, siguiente) {
  try {
    const datos = validarRegistroRostro(req.body, req.params);
    const { rostro, esNuevo } = await rostroService.registrarRostro(datos, req.usuario);
    // 201 si se creó, 200 si se actualizó el existente (contrato).
    return responderExito(res, esNuevo ? 201 : 200, { rostro });
  } catch (error) {
    return siguiente(error);
  }
}

export async function consultarRostro(req, res, siguiente) {
  try {
    const idCliente = Number(req.params.idCliente);
    const estado = await rostroService.consultarEstadoRostro(idCliente);
    return responderExito(res, 200, estado);
  } catch (error) {
    return siguiente(error);
  }
}
