// Rutas de rostros (T032, US-S2-06; contracts/api-rostros-accesos.md).
// Solo administrador y recepcionista; el entrenador y el cliente reciben 403.
// Toda operación facial exige JWT (research.md §6).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import { registrarRostro, consultarRostro } from '../controllers/rostros.controller.js';

export const rutasRostros = Router();

rutasRostros.use(autenticar, autorizar('administrador', 'recepcionista'));

// POST crea (201) o actualiza (200); un registro por cliente, sin duplicados.
rutasRostros.post('/:idCliente', registrarRostro);
rutasRostros.get('/:idCliente', consultarRostro);
