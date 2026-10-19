// Rutas de pagos (T041 US-S2-04, T063 US-S2-05; contracts/api-pagos.md).
// Registrar y consultar historial: administrador y recepcionista.
// Consultar adeudos: solo administrador (US-S2-05).
// RN-06: no existe ninguna ruta DELETE sobre pagos.
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  registrarPago,
  listarPagos,
  consultarAdeudos,
} from '../controllers/pagos.controller.js';

export const rutasPagos = Router();

rutasPagos.use(autenticar);

rutasPagos.post('/', autorizar('administrador', 'recepcionista'), registrarPago);
rutasPagos.get('/', autorizar('administrador', 'recepcionista'), listarPagos);
rutasPagos.get('/adeudos', autorizar('administrador'), consultarAdeudos);
