// Rutas del dashboard administrativo (T053, US6;
// contracts/api-dashboard.md).
// Exclusivo del administrador: recepcionista, entrenador y cliente reciben
// 403 (FR-015, US-S3-06 esc. 4). La autorización SIEMPRE está en el backend
// (FR-025).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import { obtenerDashboard } from '../controllers/dashboard.controller.js';

export const rutasDashboard = Router();

rutasDashboard.use(autenticar);
rutasDashboard.get('/', autorizar('administrador'), obtenerDashboard);
