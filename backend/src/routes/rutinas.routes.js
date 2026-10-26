// Rutas de rutinas (T029, US3; contracts/api-rutinas-progreso.md).
// La autorización por rol SIEMPRE se valida en el backend (FR-025).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  listarRutinas,
  crearRutina,
  modificarRutina,
  modificarEjercicios,
} from '../controllers/rutinas.controller.js';

export const rutasRutinas = Router();

rutasRutinas.use(autenticar);

// Consulta: administrador y recepcionista ven todas (solo lectura, RN-20);
// el entrenador recibe SOLO las de su carga (RN-19); el cliente usa
// /api/mi-entrenamiento.
rutasRutinas.get(
  '/',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  listarRutinas
);

// Crear y modificar: exclusivas del entrenador de la carga (FR-007).
rutasRutinas.post('/', autorizar('entrenador'), crearRutina);
rutasRutinas.put('/:id', autorizar('entrenador'), modificarRutina);
rutasRutinas.put('/:id/ejercicios', autorizar('entrenador'), modificarEjercicios);
