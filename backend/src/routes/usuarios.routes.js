// Rutas de usuarios (T041 US3, T046 US4; contracts/api.md).
// FR-006: toda la gestión de usuarios es exclusiva del administrador.
import { Router } from 'express';
import { autenticar } from '../middlewares/autenticacion.js';
import { autorizar } from '../middlewares/autorizacion.js';
import {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  asignarRol,
} from '../controllers/usuarios.controller.js';

export const rutasUsuarios = Router();

rutasUsuarios.use(autenticar, autorizar('administrador'));

rutasUsuarios.post('/', crearUsuario);
rutasUsuarios.get('/', listarUsuarios);
rutasUsuarios.get('/:id', obtenerUsuario);

// US4: asignación de rol con efecto en la siguiente petición del usuario.
rutasUsuarios.patch('/:id/rol', asignarRol);
