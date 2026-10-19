// Lógica de negocio de pagos (T040, US-S2-04; T062 US-S2-05; FR-006, FR-007).
//
// Reglas (clarificación Q2, 2026-10-15):
// - Métodos solo efectivo y transferencia; admite pagos parciales.
// - Adeudo = precio vigente del tipo de la membresía − pagos registrados,
//   nunca negativo. Sin anulación de pagos en este sprint.
// - RN-05: el pago debe estar asociado a una membresía del MISMO cliente
//   (validado aquí antes de persistir; responde 409 PAGO_MEMBRESIA_AJENA).
import * as pagoModelo from '../models/pago.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as membresiaModelo from '../models/membresia.model.js';
import * as auditor from './auditoria.service.js';
import { ERRORES, ErrorDeDominio } from '../utils/respuestas.js';

// Normaliza el precio/total de MySQL (DECIMAL llega como string) a número.
function aNumero(valor) {
  return Number(valor ?? 0);
}

// Presenta el pago para la respuesta (contrato api-pagos.md).
function presentarPago(pago) {
  return {
    id_pago: pago.id_pago,
    id_cliente: pago.id_cliente,
    id_membresia: pago.id_membresia,
    monto: aNumero(pago.monto).toFixed(2),
    fecha_pago: pago.fecha_pago,
    metodo_pago: pago.metodo_pago,
    ...(pago.tipo_membresia !== undefined ? { tipo_membresia: pago.tipo_membresia } : {}),
  };
}

export async function registrarPago({ idCliente, idMembresia, monto, metodoPago }, usuario) {
  const cliente = await clienteModelo.buscarClientePorId(idCliente);
  if (!cliente) {
    throw ERRORES.noEncontrado('Cliente');
  }

  // RN-05: la membresía debe existir y pertenecer al cliente indicado.
  const membresia = await membresiaModelo.buscarMembresiaPorId(idMembresia);
  if (!membresia) {
    throw ERRORES.noEncontrado('Membresía');
  }
  if (Number(membresia.id_cliente) !== Number(idCliente)) {
    throw new ErrorDeDominio(
      409,
      'La membresía no pertenece al cliente indicado',
      'PAGO_MEMBRESIA_AJENA'
    );
  }

  const id = await pagoModelo.insertarPago({ idCliente, idMembresia, monto, metodoPago });

  await auditor.registrarAccion(
    usuario.id_usuario,
    'registrar pago',
    'pagos',
    'exitoso',
    `Pago ${id} por ${monto.toFixed(2)} (${metodoPago}) del cliente ${idCliente}`
  );

  const pago = await pagoModelo.buscarPagoPorId(id);
  return presentarPago(pago);
}

export async function obtenerHistorial(idCliente) {
  const cliente = await clienteModelo.buscarClientePorId(idCliente);
  if (!cliente) {
    throw ERRORES.noEncontrado('Cliente');
  }
  const pagos = await pagoModelo.listarPagosPorCliente(idCliente);
  return { pagos: pagos.map(presentarPago) };
}

// US-S2-05 (FR-007): saldo pendiente por cliente con membresía activa.
export async function consultarAdeudos() {
  const filas = await pagoModelo.listarAdeudos();
  const adeudos = filas.map((fila) => {
    const precio = aNumero(fila.precio_membresia);
    const pagado = aNumero(fila.total_pagado);
    // El saldo nunca es negativo (si pagó de más, queda en 0).
    const saldo = Math.max(0, precio - pagado);
    return {
      id_cliente: fila.id_cliente,
      nombre_completo: fila.nombre_completo,
      precio_membresia: precio.toFixed(2),
      total_pagado: pagado.toFixed(2),
      saldo_pendiente: saldo.toFixed(2),
    };
  });
  return { adeudos };
}

// Reutilizable por mi-cuenta (US-S2-10): saldo de un cliente específico.
export async function adeudoDeCliente(idCliente) {
  const [membresias, pagado] = await Promise.all([
    membresiaModelo.listarMembresiasPorCliente(idCliente),
    pagoModelo.sumarPagosPorCliente(idCliente),
  ]);
  const membresia = membresias[0];
  if (!membresia) {
    return { precio_membresia: null, total_pagado: pagado, saldo_pendiente: null };
  }
  const precio = aNumero(membresia.tipo_precio);
  return {
    precio_membresia: precio.toFixed(2),
    total_pagado: pagado.toFixed(2),
    saldo_pendiente: Math.max(0, precio - pagado).toFixed(2),
  };
}
