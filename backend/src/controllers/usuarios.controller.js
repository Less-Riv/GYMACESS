// Controlador de usuarios (T041, US3; T046, US4). Exclusivo del
// administrador vía middleware de autorización en la ruta (FR-006).
import * as usuarioService from '../services/usuario.service.js';
import { buscarUsuarioPorId } from '../models/usuario.model.js';
import { validarAltaUsuario, validarAsignacionRol } from '../validators/usuario.validator.js';
import { responderExito, ERRORES } from '../utils/respuestas.js';

function idValido(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw ERRORES.validacion('Identificador de usuario inválido');
  }
  return id;
}

export async function crearUsuario(req, res, siguiente) {
  try {
    const datos = validarAltaUsuario(req.body);
    const usuario = await usuarioService.crearUsuario(datos);
    return responderExito(res, 201, { usuario });
  } catch (error) {
    return siguiente(error);
  }
}

export async function listarUsuarios(_req, res, siguiente) {
  try {
    const usuarios = await usuarioService.listarUsuarios();
    return responderExito(res, 200, { usuarios });
  } catch (error) {
    return siguiente(error);
  }
}

export async function obtenerUsuario(req, res, siguiente) {
  try {
    const id = idValido(req);
    const usuario = await buscarUsuarioPorId(id);
    if (!usuario) {
      throw ERRORES.noEncontrado('Usuario');
    }
    return responderExito(res, 200, { usuario });
  } catch (error) {
    return siguiente(error);
  }
}

// US4: asignación de rol (T046); el nuevo rol surte efecto en la siguiente
// petición porque el middleware de autenticación lee el rol desde la base.
export async function asignarRol(req, res, siguiente) {
  try {
    const id = idValido(req);
    const { rol, clienteId } = validarAsignacionRol(req.body);
    const usuario = await usuarioService.asignarRol(id, rol, clienteId);
    return responderExito(res, 200, { usuario });
  } catch (error) {
    return siguiente(error);
  }
}
