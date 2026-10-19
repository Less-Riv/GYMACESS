// Controlador de clientes (T034 US2, T051 US5, T056 US6, T061 US7).
import * as clienteService from '../services/cliente.service.js';
import { validarCliente, validarClienteParcial } from '../validators/cliente.validator.js';
import { responderExito } from '../utils/respuestas.js';

export async function crearCliente(req, res, siguiente) {
  try {
    const datos = validarCliente(req.body);
    const cliente = await clienteService.registrarCliente(datos);
    return responderExito(res, 201, { cliente });
  } catch (error) {
    return siguiente(error);
  }
}

export async function listarClientes(req, res, siguiente) {
  try {
    // La proyección de campos depende del rol autenticado, nunca de parámetros
    // del cliente (FR-025).
    const resultado = await clienteService.obtenerListadoClientes(
      req.usuario.rol,
      req.query.pagina
    );
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}

export async function obtenerCliente(req, res, siguiente) {
  try {
    const id = Number(req.params.id);
    const cliente = await clienteService.obtenerClienteParaRol(id, req.usuario.rol);
    return responderExito(res, 200, { cliente });
  } catch (error) {
    return siguiente(error);
  }
}

export async function modificarCliente(req, res, siguiente) {
  try {
    const id = Number(req.params.id);
    const datos = validarClienteParcial(req.body);
    const cliente = await clienteService.modificarCliente(id, datos);
    return responderExito(res, 200, { cliente });
  } catch (error) {
    return siguiente(error);
  }
}

export async function obtenerMiCuenta(req, res, siguiente) {
  try {
    // El cliente se resuelve desde el token (id_usuario), jamás desde un id
    // enviado por el cliente (FR-012).
    const cliente = await clienteService.obtenerMiCuenta(req.usuario.id_usuario);
    return responderExito(res, 200, { cliente });
  } catch (error) {
    return siguiente(error);
  }
}
