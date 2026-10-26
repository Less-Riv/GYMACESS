// Controlador del dashboard (T053, US6; contracts/api-dashboard.md).
import * as dashboardService from '../services/dashboard.service.js';
import { responderExito } from '../utils/respuestas.js';

export async function obtenerDashboard(req, res, siguiente) {
  try {
    const datos = await dashboardService.obtenerIndicadores(req.query);
    return responderExito(res, 200, datos);
  } catch (error) {
    return siguiente(error);
  }
}
