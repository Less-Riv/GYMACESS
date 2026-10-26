// Validación del filtro de periodo del dashboard (T050, US6; FR-016,
// investigación §4).
// - desde y hasta son fechas ISO YYYY-MM-DD opcionales.
// - Por defecto: primer día del mes anterior hasta hoy.
// - 400 VALIDACION si el formato es inválido o si desde > hasta.
import { ERRORES } from '../utils/respuestas.js';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

// Primer día del mes anterior (investigación §4).
function primerDiaMesAnterior() {
  const ahora = new Date();
  const anio = ahora.getUTCFullYear();
  const mes = ahora.getUTCMonth(); // 0 = enero
  const fecha = mes === 0 ? new Date(Date.UTC(anio - 1, 11, 1)) : new Date(Date.UTC(anio, mes - 1, 1));
  return fecha.toISOString().slice(0, 10);
}

function validarFechaIso(valor, campo) {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string' || !FORMATO_FECHA.test(valor) || Number.isNaN(Date.parse(valor))) {
    throw ERRORES.validacion(`El parámetro ${campo} debe tener formato YYYY-MM-DD`);
  }
  return valor;
}

export function validarPeriodo(query) {
  const desde = validarFechaIso(query?.desde, 'desde') ?? primerDiaMesAnterior();
  const hasta = validarFechaIso(query?.hasta, 'hasta') ?? hoy();

  if (desde > hasta) {
    throw ERRORES.validacion('El periodo es inválido: desde no puede ser posterior a hasta');
  }

  return { desde, hasta };
}
