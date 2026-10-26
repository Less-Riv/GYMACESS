// Rutas de la vista del personal (T060, US7;
// contracts/api-entrenadores-asignaciones.md).
// La autorización por rol SIEMPRE se valida en el backend (FR-025):
// /api/personal es de administrador y recepcionista; /api/personal/mi-carga
// es exclusiva del entrenador (403 para cualquier otro rol).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import { listarPersonal, listarMiCarga } from '../controllers/personal.controller.js';

export const rutasPersonal = Router();

rutasPersonal.use(autenticar);

// Ruta estática declarada junto a la general; cada una con su propio rol.
rutasPersonal.get('/mi-carga', autorizar('entrenador'), listarMiCarga);
rutasPersonal.get('/', autorizar('administrador', 'recepcionista'), listarPersonal);
