// Controlador de "Mi entrenamiento" (T045, US5;
// contracts/api-rutinas-progreso.md).
import * as miEntrenamientoService from '../services/mi-entrenamiento.service.js';
import { responderExito } from '../utils/respuestas.js';

export async function obtenerMiEntrenamiento(req, res, siguiente) {
  try {
    // El cliente se resuelve desde el token (id_usuario), jamás desde un id
    // enviado por el navegador (FR-013, RN-22).
    const datos = await miEntrenamientoService.obtenerMiEntrenamiento(req.usuario.id_usuario);
    return responderExito(res, 200, datos);
  } catch (error) {
    return siguiente(error);
  }
}
