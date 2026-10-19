// Lógica de "Mi cuenta" del Sprint 2 (T072, US-S2-10; FR-004, FR-007, FR-008,
// FR-014, FR-028).
// Compone la información propia del cliente: membresía con días restantes y
// estado efectivo, historial de pagos, adeudo (fórmula FR-007) y accesos.
// El cliente SIEMPRE se resuelve desde el token (RN-14); no se aceptan ids.
import * as miCuentaModelo from '../models/mi-cuenta.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import { estadoEfectivo } from './membresia.service.js';
import { ERRORES } from '../utils/respuestas.js';

// Normaliza un DATE de MySQL (objeto Date o string) a AAAA-MM-DD.
function aFechaISO(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  return new Date(valor).toISOString().slice(0, 10);
}

// Días naturales restantes hasta la fecha de finalización (mínimo 0).
function diasRestantes(fechaFin) {
  const iso = aFechaISO(fechaFin);
  if (!iso) return 0;
  const fin = new Date(`${iso}T00:00:00Z`).getTime();
  const hoy = new Date();
  const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.max(0, Math.ceil((fin - hoyUTC) / (24 * 60 * 60 * 1000)));
}

// Esc. 1: membresía con vigencia y estado efectivo; mensaje claro sin membresía.
export async function obtenerMembresiaPropia(idCliente) {
  const membresia = await miCuentaModelo.buscarMembresiaPropia(idCliente);
  if (!membresia) {
    return { membresia: null, mensaje: 'No tienes una membresía asignada' };
  }
  return {
    membresia: {
      tipo: membresia.tipo,
      duracion: Number(membresia.duracion),
      fecha_inicio: aFechaISO(membresia.fecha_inicio),
      fecha_fin: aFechaISO(membresia.fecha_fin),
      dias_restantes: diasRestantes(membresia.fecha_fin),
      estado: estadoEfectivo(membresia),
    },
  };
}

// Esc. 2: historial propio de pagos.
export async function obtenerPagosPropios(idCliente) {
  const pagos = await miCuentaModelo.listarPagosPropios(idCliente);
  return {
    pagos: pagos.map((pago) => ({
      id_pago: pago.id_pago,
      monto: Number(pago.monto).toFixed(2),
      fecha_pago: pago.fecha_pago,
      metodo_pago: pago.metodo_pago,
      tipo_membresia: pago.tipo_membresia,
    })),
  };
}

// Esc. 3, 6 y 7: adeudo con la fórmula FR-007 (precio vigente del tipo menos
// pagos registrados), nunca negativo, con estado de cuenta.
export async function obtenerAdeudoPropio(idCliente) {
  const [membresia, pagado] = await Promise.all([
    miCuentaModelo.buscarMembresiaPropia(idCliente),
    miCuentaModelo.sumarPagosPropios(idCliente),
  ]);

  if (!membresia && pagado === 0) {
    // Esc. 6: sin membresía ni pagos, un mensaje claro en lugar de datos vacíos.
    return { mensaje: 'No tienes una membresía ni pagos registrados' };
  }

  const precio = Number(membresia?.precio ?? 0);
  const saldo = Math.max(0, precio - pagado);

  return {
    precio_membresia: membresia ? precio.toFixed(2) : null,
    total_pagado: pagado.toFixed(2),
    saldo_pendiente: saldo.toFixed(2),
    // "al_corriente" cuando no queda saldo pendiente (US-S2-10 esc. 3).
    estado_cuenta: saldo === 0 ? 'al_corriente' : 'pendiente',
  };
}

// Esc. 4: accesos propios con fecha, hora, resultado y motivo.
export async function obtenerAccesosPropios(idCliente) {
  const accesos = await miCuentaModelo.listarAccesosPropios(idCliente);
  return {
    accesos: accesos.map((acceso) => ({
      fecha: aFechaISO(acceso.fecha),
      hora: acceso.hora,
      resultado: acceso.resultado,
      motivo: acceso.motivo,
    })),
  };
}

// Resuelve el cliente propio del usuario autenticado (rol cliente). Si el
// usuario no tiene cliente asociado, responde con un 404 claro.
export async function resolverClientePropio(idUsuario) {
  const cliente = await clienteModelo.buscarClientePorIdPropio(idUsuario);
  if (!cliente) {
    throw ERRORES.noEncontrado('Cliente');
  }
  return cliente.id_cliente;
}
