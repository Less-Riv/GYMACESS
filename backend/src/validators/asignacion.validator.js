// Validación de entrada de asignaciones (T018, US2; FR-003, data-model.md).
// Restricciones citadas del modelo de datos:
// - id_cliente: INT UNSIGNED NOT NULL → clientes.id_cliente
// - id_entrenador: INT UNSIGNED NOT NULL → entrenadores.id_entrenador
// - fecha_asignacion: DATE NOT NULL (opcional en la API: por defecto hoy)
import { ERRORES } from '../utils/respuestas.js';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function validarId(valor, campo) {
  if (valor === undefined || valor === null || valor === '') {
    throw ERRORES.validacion(`El campo ${campo} es obligatorio`);
  }
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw ERRORES.validacion(`El campo ${campo} debe ser un identificador entero válido`);
  }
  return id;
}

function validarFechaOpcional(valor, campo) {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string' || !FORMATO_FECHA.test(valor) || Number.isNaN(Date.parse(valor))) {
    throw ERRORES.validacion(`El campo ${campo} debe tener formato YYYY-MM-DD`);
  }
  return valor;
}

export function validarAsignacion(body) {
  const fecha = validarFechaOpcional(body?.fecha_asignacion, 'fecha_asignacion');
  return {
    id_cliente: validarId(body?.id_cliente, 'id_cliente'),
    id_entrenador: validarId(body?.id_entrenador, 'id_entrenador'),
    // Modelo de datos: NOT NULL; la API la hace opcional con el valor de hoy.
    fecha_asignacion: fecha ?? new Date().toISOString().slice(0, 10),
  };
}

export function validarReasignacion(body) {
  return {
    id_entrenador: validarId(body?.id_entrenador, 'id_entrenador'),
  };
}
