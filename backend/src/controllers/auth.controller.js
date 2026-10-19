// Controlador de autenticación (T026, US1).
import * as authService from '../services/auth.service.js';
import { validarLogin } from '../validators/auth.validator.js';
import { responderExito } from '../utils/respuestas.js';

export async function iniciarSesion(req, res, siguiente) {
  try {
    const datos = validarLogin(req.body);
    const resultado = await authService.iniciarSesion(datos);
    // Nunca se incluye el campo password en la respuesta (contracts/api.md).
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}
