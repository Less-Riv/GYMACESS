// Lógica de negocio de rostros (T031, US-S2-06; FR-017, FR-019).
// Registra o actualiza el descriptor facial de un cliente (un registro por
// cliente, sin duplicados) y consulta el estado del registro.
//
// SEGURIDAD BIOMÉTRICA (research.md §6): el descriptor se recibe como arreglo
// numérico calculado en el navegador; el backend lo persiste como JSON y NO lo
// devuelve jamás en una respuesta. La auditoría registra solo la acción y el
// resultado, nunca medidas ni descriptores (FR-016).
import * as rostroModelo from '../models/rostro.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as auditor from './auditoria.service.js';
import { ERRORES, ErrorDeDominio } from '../utils/respuestas.js';

// Proyecta el registro facial para la respuesta: solo metadatos y estado
// (completo/pendiente); sin descriptor (FR-017).
function presentar(rostro) {
  if (!rostro) {
    return { estado_registro: 'pendiente', fecha_registro: null };
  }
  return {
    id_cliente: rostro.id_cliente,
    estado_registro: rostro.estado === 'activo' ? 'completo' : 'pendiente',
    fecha_registro: rostro.fecha_registro,
  };
}

async function verificarClienteActivo(idCliente) {
  const cliente = await clienteModelo.buscarClientePorId(idCliente);
  if (!cliente) {
    throw ERRORES.noEncontrado('Cliente');
  }
  if (cliente.estado !== 'activo') {
    throw new ErrorDeDominio(
      409,
      'El cliente está inactivo; no se le puede registrar información facial',
      'CLIENTE_INACTIVO'
    );
  }
  return cliente;
}

export async function registrarRostro({ idCliente, descriptor }, usuario) {
  await verificarClienteActivo(idCliente);

  // Se decide 201 vs 200 según existencia previa (sin duplicar registros).
  const previo = await rostroModelo.buscarEstadoPorCliente(idCliente);
  await rostroModelo.guardarDescriptor(idCliente, JSON.stringify(descriptor));

  await auditor.registrarAccion(
    usuario.id_usuario,
    previo ? 'actualizar rostro' : 'registrar rostro',
    'rostros',
    'exitoso',
    `Información facial ${previo ? 'actualizada' : 'registrada'} para el cliente ${idCliente}`
  );

  const rostro = await rostroModelo.buscarEstadoPorCliente(idCliente);
  return { rostro: presentar(rostro), esNuevo: !previo };
}

export async function consultarEstadoRostro(idCliente) {
  const rostro = await rostroModelo.buscarEstadoPorCliente(idCliente);
  // Un cliente sin registro facial no es un 404: es un estado "pendiente".
  return presentar(rostro);
}
