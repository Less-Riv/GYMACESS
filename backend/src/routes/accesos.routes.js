// Rutas del control de acceso (T048 US-S2-07, T067 US-S2-09;
// contracts/api-rostros-accesos.md).
// Toda operación facial exige JWT (research.md §6); no hay rutas DELETE
// (RN-10): los registros de acceso no se eliminan.
//
// Nota de diseño: el entrenador NO participa en el punto de acceso (identificar)
// porque ese rol no valida entradas; solo consulta la vista básica de accesos.
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  identificar,
  listarAccesos,
  listarAccesosBasicos,
  listarMisAccesos,
} from '../controllers/accesos.controller.js';

export const rutasAccesos = Router();

rutasAccesos.use(autenticar);

// US-S2-07/US-S2-08: identificar y validar en el punto de acceso.
rutasAccesos.post(
  '/identificar',
  autorizar('administrador', 'recepcionista'),
  identificar
);

// US-S2-09: vistas de consulta.
rutasAccesos.get('/basicos', autorizar('administrador', 'recepcionista', 'entrenador'), listarAccesosBasicos);
rutasAccesos.get('/mis-accesos', autorizar('cliente'), listarMisAccesos);
rutasAccesos.get('/', autorizar('administrador', 'recepcionista'), listarAccesos);
