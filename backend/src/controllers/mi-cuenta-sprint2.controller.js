// Controlador de "Mi cuenta" del Sprint 2 (T073, US-S2-10).
// El cliente se resuelve SIEMPRE desde el token (FR-028, RN-14); no se
// aceptan identificadores de clientes en la petición.
import * as miCuentaService from '../services/mi-cuenta.service.js';
import { responderExito } from '../utils/respuestas.js';

async function idClientePropio(req) {
  return miCuentaService.resolverClientePropio(req.usuario.id_usuario);
}

export async function obtenerMembresia(req, res, siguiente) {
  try {
    const idCliente = await idClientePropio(req);
    const resultado = await miCuentaService.obtenerMembresiaPropia(idCliente);
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}

export async function obtenerPagos(req, res, siguiente) {
  try {
    const idCliente = await idClientePropio(req);
    const resultado = await miCuentaService.obtenerPagosPropios(idCliente);
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}

export async function obtenerAdeudo(req, res, siguiente) {
  try {
    const idCliente = await idClientePropio(req);
    const resultado = await miCuentaService.obtenerAdeudoPropio(idCliente);
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}

export async function obtenerAccesos(req, res, siguiente) {
  try {
    const idCliente = await idClientePropio(req);
    const resultado = await miCuentaService.obtenerAccesosPropios(idCliente);
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}
