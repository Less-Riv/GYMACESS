// Rutas de clientes (T034 US2, T051 US5, T056 US6, T061 US7; contracts/api.md).
// La autorización por rol SIEMPRE se valida en el backend (FR-005).
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  crearCliente,
  listarClientes,
  obtenerCliente,
  modificarCliente,
  obtenerMiCuenta,
} from '../controllers/clientes.controller.js';

export const rutasClientes = Router();

// Toda ruta de clientes exige autenticación (FR-004).
rutasClientes.use(autenticar);

// US7: la ruta estática se declara ANTES de /:id para que no la capture.
rutasClientes.get('/mi-cuenta', obtenerMiCuenta);

// US2: registro (administrador y recepcionista; FR-009).
rutasClientes.post('/', autorizar('administrador', 'recepcionista'), crearCliente);

// US5: consulta paginada; el entrenador recibe campos restringidos (FR-011, FR-025, FR-027).
rutasClientes.get('/', autorizar('administrador', 'recepcionista', 'entrenador'), listarClientes);

// US5: detalle con la misma proyección por rol.
rutasClientes.get(
  '/:id',
  autorizar('administrador', 'recepcionista', 'entrenador'),
  obtenerCliente
);

// US6: modificación (administrador y recepcionista; FR-010).
rutasClientes.patch('/:id', autorizar('administrador', 'recepcionista'), modificarCliente);
