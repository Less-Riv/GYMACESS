// Controlador de pagos (T041, US-S2-04; T063 US-S2-05).
import * as pagoService from '../services/pago.service.js';
import { validarPago } from '../validators/pago.validator.js';
import { responderExito, ERRORES } from '../utils/respuestas.js';

export async function registrarPago(req, res, siguiente) {
  try {
    const datos = validarPago(req.body);
    const pago = await pagoService.registrarPago(datos, req.usuario);
    return responderExito(res, 201, { pago });
  } catch (error) {
    return siguiente(error);
  }
}

export async function listarPagos(req, res, siguiente) {
  try {
    const idCliente = Number(req.query.cliente_id);
    if (!Number.isInteger(idCliente) || idCliente <= 0) {
      // El historial siempre se consulta de un cliente concreto (contrato).
      return siguiente(
        ERRORES.validacion('El parámetro cliente_id es obligatorio y debe ser numérico')
      );
    }
    const resultado = await pagoService.obtenerHistorial(idCliente);
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}

export async function consultarAdeudos(_req, res, siguiente) {
  try {
    const resultado = await pagoService.consultarAdeudos();
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}
