// Validación de entrada de objetivos y progresos (T036, US4; FR-010, FR-011,
// clarificación 2026-10-19, data-model.md).
// Restricciones citadas del modelo de datos:
// - objetivo.descripcion: VARCHAR(255), obligatorio
// - objetivo.fecha_objetivo: DATE, opcional
// - objetivo.estado: ENUM('pendiente','en_curso','cumplido','cancelado')
// - progreso.fecha: DATE, NOT NULL (la API permite omitirla: por defecto hoy)
// - progreso.comentario: VARCHAR(500), obligatorio
// - progreso.peso: DECIMAL(5,2), NULL o > 0 (kg)
// - progreso.pecho/cintura/cadera/muslos: DECIMAL(5,1), NULL o >= 0 (cm)
import { ERRORES } from '../utils/respuestas.js';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ESTADOS_OBJETIVO = ['pendiente', 'en_curso', 'cumplido', 'cancelado'];

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

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

function validarIdOpcional(valor, campo) {
  if (valor === undefined || valor === null || valor === '') return null;
  return validarId(valor, campo);
}

function validarFecha(valor, campo, { obligatorio, porDefectoHoy = false }) {
  if (valor === undefined || valor === null || valor === '') {
    if (obligatorio) throw ERRORES.validacion(`El campo ${campo} es obligatorio`);
    return porDefectoHoy ? hoy() : null;
  }
  if (typeof valor !== 'string' || !FORMATO_FECHA.test(valor) || Number.isNaN(Date.parse(valor))) {
    throw ERRORES.validacion(`El campo ${campo} debe tener formato YYYY-MM-DD`);
  }
  return valor;
}

function validarTexto(valor, campo, { obligatorio, longitud }) {
  if (valor === undefined || valor === null || valor === '') {
    if (obligatorio) throw ERRORES.validacion(`El campo ${campo} es obligatorio`);
    return null;
  }
  if (typeof valor !== 'string') {
    throw ERRORES.validacion(`El campo ${campo} debe ser texto`);
  }
  const limpio = valor.trim();
  if (limpio.length === 0 && obligatorio) {
    throw ERRORES.validacion(`El campo ${campo} es obligatorio`);
  }
  if (limpio.length > longitud) {
    throw ERRORES.validacion(`El campo ${campo} no puede exceder ${longitud} caracteres`);
  }
  return limpio.length === 0 ? null : limpio;
}

function validarNumeroOpcional(valor, campo, { minimo }) {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = Number(valor);
  if (Number.isNaN(numero) || numero < minimo) {
    throw ERRORES.validacion(`El campo ${campo} debe ser un número mayor o igual a ${minimo}`);
  }
  return numero;
}

export function validarObjetivo(body) {
  return {
    id_cliente: validarId(body?.id_cliente, 'id_cliente'),
    descripcion: validarTexto(body?.descripcion, 'descripcion', {
      obligatorio: true,
      longitud: 255,
    }),
    fecha_objetivo: validarFecha(body?.fecha_objetivo, 'fecha_objetivo', {
      obligatorio: false,
    }),
  };
}

export function validarObjetivoParcial(body) {
  if (!body || body.estado === undefined) {
    throw ERRORES.validacion('El campo estado es obligatorio');
  }
  if (!ESTADOS_OBJETIVO.includes(body.estado)) {
    throw ERRORES.validacion(
      "El campo estado solo admite 'pendiente', 'en_curso', 'cumplido' o 'cancelado'"
    );
  }
  return { estado: body.estado };
}

export function validarProgreso(body) {
  return {
    id_cliente: validarId(body?.id_cliente, 'id_cliente'),
    // Modelo de datos: NOT NULL; la API la hace opcional con el valor de hoy.
    fecha: validarFecha(body?.fecha, 'fecha', { obligatorio: false, porDefectoHoy: true }),
    comentario: validarTexto(body?.comentario, 'comentario', {
      obligatorio: true,
      longitud: 500,
    }),
    peso: validarNumeroOpcional(body?.peso, 'peso', { minimo: 0.01 }),
    pecho: validarNumeroOpcional(body?.pecho, 'pecho', { minimo: 0 }),
    cintura: validarNumeroOpcional(body?.cintura, 'cintura', { minimo: 0 }),
    cadera: validarNumeroOpcional(body?.cadera, 'cadera', { minimo: 0 }),
    muslos: validarNumeroOpcional(body?.muslos, 'muslos', { minimo: 0 }),
    id_objetivo: validarIdOpcional(body?.id_objetivo, 'id_objetivo'),
  };
}
