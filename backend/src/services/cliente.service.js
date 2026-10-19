// Lógica de negocio de clientes (T033 US2, T050 US5, T055 US6, T060 US7).
// Reglas transversales: sin eliminación física (FR-014), correo único (409) y
// proyección de campos por rol en el backend (FR-025).
import * as clienteModelo from '../models/cliente.model.js';
import { ERRORES, ErrorDeDominio } from '../utils/respuestas.js';

const LIMITE_PAGINA = 20; // FR-027: límite fijo por página.

export async function registrarCliente(datos) {
  const existente = await clienteModelo.buscarClientePorCorreo(datos.correo);
  if (existente) {
    // La restricción UNIQUE de MySQL es la autoridad final ante registros
    // concurrentes; aquí se anticipa un 409 claro.
    throw ERRORES.conflictCorreo();
  }

  const id = await clienteModelo.crearCliente(datos);
  return clienteModelo.buscarClientePorId(id);
}

export async function obtenerListadoClientes(rolSolicitante, pagina = 1) {
  const paginaSegura = Math.max(1, Number(pagina) || 1);
  // FR-025 (aclaración 2026-10-09): el entrenador ve solo nombre, apellido,
  // teléfono y estado; sin correo, dirección ni información financiera.
  const camposEntrenador = rolSolicitante === 'entrenador';

  const [clientes, total] = await Promise.all([
    clienteModelo.listarClientes({ pagina: paginaSegura, limite: LIMITE_PAGINA, camposEntrenador }),
    clienteModelo.contarClientes(),
  ]);

  return {
    clientes,
    pagina: paginaSegura,
    limite: LIMITE_PAGINA,
    total,
    totalPaginas: Math.ceil(total / LIMITE_PAGINA),
  };
}

export async function obtenerClienteParaRol(id, rolSolicitante) {
  const cliente = await clienteModelo.buscarClientePorId(id);
  if (!cliente) {
    throw ERRORES.noEncontrado('Cliente');
  }
  if (rolSolicitante === 'entrenador') {
    // Misma proyección que el listado, aplicada al detalle (FR-025).
    return {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      estado: cliente.estado,
    };
  }
  return cliente;
}

export async function modificarCliente(id, datos) {
  const existente = await clienteModelo.buscarClientePorId(id);
  if (!existente) {
    throw ERRORES.noEncontrado('Cliente');
  }

  // El correo solo se rechaza si pertenece a OTRO cliente (409).
  if (datos.correo && datos.correo !== existente.correo) {
    const duplicado = await clienteModelo.buscarClientePorCorreo(datos.correo);
    if (duplicado) {
      throw ERRORES.conflictCorreo();
    }
  }

  await clienteModelo.actualizarCliente(id, datos);
  return clienteModelo.buscarClientePorId(id);
}

export async function obtenerMiCuenta(idUsuario) {
  // FR-012 / RN-14: el cliente solo consulta lo propio, resuelto por
  // usuarios.cliente_id; jamás por un id enviado por el cliente.
  const cliente = await clienteModelo.buscarClientePorIdPropio(idUsuario);
  if (!cliente) {
    throw new ErrorDeDominio(
      404,
      'Tu usuario aún no tiene un cliente asociado. Contacta al administrador.',
      'CLIENTE_NO_ASOCIADO'
    );
  }
  return cliente;
}
