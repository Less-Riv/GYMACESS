// Validación de entrada de rostros (T030, US-S2-06; FR-017, research.md §1).
// Restricción central: el descriptor debe ser un arreglo de EXACTAMENTE 128
// valores numéricos finitos (face-api, distancia euclidiana 128-D).
// El backend NUNCA recibe ni devuelve imágenes: solo el descriptor numérico
// calculado en el navegador (research.md §6, seguridad biométrica).
import { ERRORES } from '../utils/respuestas.js';

export const DIMENSION_DESCRIPTOR = 128;

function validarId(valor, campo) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw ERRORES.validacion(`El campo ${campo} debe ser un identificador numérico válido`);
  }
  return id;
}

export function validarDescriptor(descriptor) {
  if (!Array.isArray(descriptor)) {
    throw ERRORES.validacion('El descriptor debe ser un arreglo de 128 valores numéricos');
  }
  if (descriptor.length !== DIMENSION_DESCRIPTOR) {
    throw ERRORES.validacion(
      `El descriptor debe contener exactamente ${DIMENSION_DESCRIPTOR} valores (recibidos: ${descriptor.length})`
    );
  }
  const todosNumericos = descriptor.every(
    (valor) => typeof valor === 'number' && Number.isFinite(valor)
  );
  if (!todosNumericos) {
    throw ERRORES.validacion('El descriptor solo puede contener valores numéricos finitos');
  }
  return descriptor;
}

export function validarRegistroRostro(body, params) {
  return {
    idCliente: validarId(params?.idCliente, 'idCliente'),
    descriptor: validarDescriptor(body?.descriptor),
  };
}
