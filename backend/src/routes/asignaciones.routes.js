// Rutas de asignaciones entrenador-cliente (T021, US2;
// contracts/api-entrenadores-asignaciones.md).
// La autorización por rol SIEMPRE se valida en el backend (FR-025).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  crearAsignacion,
  reasignarAsignacion,
  listarAsignaciones,
} from '../controllers/asignaciones.controller.js';

export const rutasAsignaciones = Router();

rutasAsignaciones.use(autenticar);

// Asignar y reasignar: administrador y recepcionista (FR-003).
rutasAsignaciones.post('/', autorizar('administrador', 'recepcionista'), crearAsignacion);
rutasAsignaciones.put(
  '/:id',
  autorizar('administrador', 'recepcionista'),
  reasignarAsignacion
);

// Consulta: administrador y recepcionista ven todas; el entrenador solo las
// de su carga (RN-19, FR-006); el cliente no consulta este módulo.
rutasAsignaciones.get(
  '/',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  listarAsignaciones
);
