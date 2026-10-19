// Rutas de "Mi cuenta" del Sprint 2 (T073, US-S2-10; contracts/api-mi-cuenta.md).
// Solo rol cliente; el id del cliente se resuelve desde el token, nunca desde
// la petición (FR-028, RN-14).
// La ruta del Sprint 1 GET /api/clientes/mi-cuenta se mantiene sin cambios.
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  obtenerMembresia,
  obtenerPagos,
  obtenerAdeudo,
  obtenerAccesos,
} from '../controllers/mi-cuenta-sprint2.controller.js';

export const rutasMiCuentaSprint2 = Router();

rutasMiCuentaSprint2.use(autenticar, autorizar('cliente'));

rutasMiCuentaSprint2.get('/membresia', obtenerMembresia);
rutasMiCuentaSprint2.get('/pagos', obtenerPagos);
rutasMiCuentaSprint2.get('/adeudo', obtenerAdeudo);
rutasMiCuentaSprint2.get('/accesos', obtenerAccesos);
