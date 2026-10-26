// Rutas de la auditoría (contrato del Sprint 2
// specs/002-membresias-pagos-acceso-facial/contracts/api-auditoria.md;
// verificado en T063 del Sprint 3, FR-020 y SC-013).
// SOLO el administrador consulta: recepcionista, entrenador y cliente
// reciben 403 AUTORIZACION.
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import { listarAuditoria } from '../controllers/auditoria.controller.js';

export const rutasAuditoria = Router();

rutasAuditoria.use(autenticar);
rutasAuditoria.get('/', autorizar('administrador'), listarAuditoria);
