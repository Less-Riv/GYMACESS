// Validación de entrada de pagos (T039, US-S2-04; FR-020, clarificación Q2).
// Restricciones:
// - monto: numérico, mayor que 0 (RN-05).
// - metodo_pago: catálogo cerrado { efectivo, transferencia } (clarificación Q2;
//   en este sprint no hay integración con bancos ni tarjetas).
// - id_cliente e id_membresia: identificadores numéricos obligatorios.
import { ERRORES } from '../utils/respuestas.js';

// Catálogo cerrado de métodos de pago del sprint (research.md, clarificación Q2).
export const METODOS_PAGO = ['efectivo', 'transferencia'];

function validarId(valor, campo) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw ERRORES.validacion(`El campo ${campo} debe ser un identificador numérico válido`);
  }
  return id;
}

function validarMonto(valor) {
  const monto = Number(valor);
  if (Number.isNaN(monto) || monto <= 0) {
    throw ERRORES.validacion('El monto debe ser un número mayor que 0');
  }
  return monto;
}

function validarMetodo(valor) {
  const metodo = String(valor || '').trim().toLowerCase();
  if (!METODOS_PAGO.includes(metodo)) {
    throw ERRORES.validacion(
      `El método de pago debe ser uno de: ${METODOS_PAGO.join(', ')}`
    );
  }
  return metodo;
}

export function validarPago(body) {
  return {
    idCliente: validarId(body?.id_cliente, 'id_cliente'),
    idMembresia: validarId(body?.id_membresia, 'id_membresia'),
    monto: validarMonto(body?.monto),
    metodoPago: validarMetodo(body?.metodo_pago),
  };
}
