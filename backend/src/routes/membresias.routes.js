// Rutas de membresías (T023, US-S2-02/US-S2-03; contracts/api-membresias.md).
// Asignar y renovar: administrador y recepcionista (FR-003, FR-005).
// Consultar: también el entrenador (vista básica, principio VI de reglas.md).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  asignarMembresia,
  listarMembresias,
  obtenerMembresia,
  renovarMembresia,
} from '../controllers/membresias.controller.js';

export const rutasMembresias = Router();

rutasMembresias.use(autenticar);

// Asignación (US-S2-02 esc. 4) y renovación (US-S2-03): entrenador y cliente
// reciben 403.
rutasMembresias.post(
  '/',
  autorizar('administrador', 'recepcionista'),
  asignarMembresia
);
rutasMembresias.put(
  '/:id/renovar',
  autorizar('administrador', 'recepcionista'),
  renovarMembresia
);

// Consulta: entrenador con proyección básica sin importes.
rutasMembresias.get(
  '/',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  listarMembresias
);

rutasMembresias.get(
  '/:id',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  obtenerMembresia
);
