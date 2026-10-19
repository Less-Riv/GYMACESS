// Validación de entrada de membresías (T020, US-S2-02; RN-01, RN-02, RN-03).
// Restricciones citadas del modelo de datos:
// - id_cliente: obligatorio y numérico (RN-01: cliente registrado)
// - id_tipo_membresia: obligatorio y numérico (RN-02: tipo válido)
// - fecha_inicio: DATE en formato AAAA-MM-DD, obligatoria
// La fecha de finalización la calcula el backend con la duración del tipo
// (FR-002); el cliente no la envía.
import { ERRORES } from '../utils/respuestas.js';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function validarId(valor, campo) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw ERRORES.validacion(`El campo ${campo} debe ser un identificador numérico válido`);
  }
  return id;
}

function validarFecha(valor) {
  const fecha = String(valor || '').trim();
  if (!FORMATO_FECHA.test(fecha)) {
    throw ERRORES.validacion('La fecha de inicio debe tener el formato AAAA-MM-DD');
  }
  if (Number.isNaN(Date.parse(fecha))) {
    throw ERRORES.validacion('La fecha de inicio no es una fecha válida');
  }
  return fecha;
}

export function validarAsignacionMembresia(body) {
  return {
    idCliente: validarId(body?.id_cliente, 'id_cliente'),
    idTipo: validarId(body?.id_tipo_membresia, 'id_tipo_membresia'),
    fechaInicio: validarFecha(body?.fecha_inicio),
  };
}

export function validarRenovacion(body) {
  return {
    idTipo: validarId(body?.id_tipo_membresia, 'id_tipo_membresia'),
  };
}
