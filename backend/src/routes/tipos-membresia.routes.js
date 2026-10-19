// Rutas de tipos de membresía (T014, US-S2-01; contracts/api-membresias.md).
// La autorización por rol SIEMPRE se valida en el backend (FR-021).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  crearTipo,
  listarTipos,
  modificarTipo,
  obtenerTipo,
} from '../controllers/tipos-membresia.controller.js';

export const rutasTiposMembresia = Router();

rutasTiposMembresia.use(autenticar);

// El catálogo es administrativo en escritura (solo administrador, US-S2-01
// esc. 3). Lectura: el recepcionista necesita ver los tipos activos para poder
// asignar y renovar membresías (SC-001; decisión 2026-10-15), pero solo ve los
// activos; el administrador ve todos.
rutasTiposMembresia.get(
  '/',
  autorizar('administrador', 'recepcionista'),
  listarTipos
);

rutasTiposMembresia.post('/', autorizar('administrador'), crearTipo);
rutasTiposMembresia.get('/:id', autorizar('administrador'), obtenerTipo);
rutasTiposMembresia.put('/:id', autorizar('administrador'), modificarTipo);
