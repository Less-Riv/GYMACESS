// Rutas de entrenadores (T012, US1; contracts/api-entrenadores-asignaciones.md).
// La autorización por rol SIEMPRE se valida en el backend (FR-025).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  listarEntrenadores,
  crearEntrenador,
  modificarEntrenador,
} from '../controllers/entrenadores.controller.js';

export const rutasEntrenadores = Router();

// Toda ruta de entrenadores exige autenticación.
rutasEntrenadores.use(autenticar);

// Consulta del personal: administrador y recepcionista (el entrenador usa
// /api/personal/mi-carga y el cliente no consulta este módulo).
rutasEntrenadores.get(
  '/',
  autorizar('administrador', 'recepcionista'),
  listarEntrenadores
);

// Alta y modificación: exclusivas del administrador (FR-001).
rutasEntrenadores.post('/', autorizar('administrador'), crearEntrenador);
rutasEntrenadores.put('/:id', autorizar('administrador'), modificarEntrenador);
