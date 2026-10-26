// Rutas de objetivos y progresos (T038, US4; contracts/api-rutinas-progreso.md).
// La autorización por rol SIEMPRE se valida en el backend (FR-025).
// Los progresos NO tienen PUT ni DELETE: el histórico es inmutable
// (FR-011, RN-17).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  crearObjetivo,
  listarObjetivos,
  modificarObjetivo,
  crearProgreso,
  listarProgresos,
} from '../controllers/progresos.controller.js';

export const rutasObjetivos = Router();
export const rutasProgresos = Router();

// ---------------------------------------------------------------------------
// Objetivos
// ---------------------------------------------------------------------------

rutasObjetivos.use(autenticar);

// Registrar y modificar: solo el entrenador de la carga (RN-19, RN-21).
rutasObjetivos.post('/', autorizar('entrenador'), crearObjetivo);
rutasObjetivos.put('/:id', autorizar('entrenador'), modificarObjetivo);

// Consulta: administrador y recepcionista en modo lectura (RN-20); el
// entrenador recibe solo los de su carga.
rutasObjetivos.get(
  '/',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  listarObjetivos
);

// ---------------------------------------------------------------------------
// Progresos
// ---------------------------------------------------------------------------

rutasProgresos.use(autenticar);

rutasProgresos.post('/', autorizar('entrenador'), crearProgreso);
rutasProgresos.get(
  '/',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  listarProgresos
);
// Sin PUT ni DELETE: RN-17, FR-011.
