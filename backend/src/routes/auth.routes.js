// Rutas de autenticación (T027, US1). POST /api/auth/login es pública.
import { Router } from 'express';
import { iniciarSesion } from '../controllers/auth.controller.js';

export const rutasAuth = Router();

rutasAuth.post('/login', iniciarSesion);
