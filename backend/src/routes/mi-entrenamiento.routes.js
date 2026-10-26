// Rutas de "Mi entrenamiento" (T045, US5; contracts/api-rutinas-progreso.md).
// Exclusivas del rol cliente: el resto de roles consulta los módulos
// generales (rutinas, objetivos y progresos) con sus propios permisos.
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import { obtenerMiEntrenamiento } from '../controllers/mi-entrenamiento.controller.js';

export const rutasMiEntrenamiento = Router();

rutasMiEntrenamiento.use(autenticar);
rutasMiEntrenamiento.get('/', autorizar('cliente'), obtenerMiEntrenamiento);
