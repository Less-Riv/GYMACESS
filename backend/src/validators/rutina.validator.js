// Validación de entrada de rutinas y sus ejercicios (T027, US3; FR-008,
// RN-18, data-model.md).
// Restricciones citadas del modelo de datos:
// - rutina.nombre: VARCHAR(80), obligatorio
// - rutina.descripcion: VARCHAR(255), opcional
// - ejercicio.nombre: VARCHAR(80), obligatorio
// - ejercicio.series: SMALLINT UNSIGNED, NULL o > 0
// - ejercicio.repeticiones: VARCHAR(30), opcional ("10-12", "al fallo")
// - ejercicio.carga: VARCHAR(40), opcional
// - ejercicio.instrucciones: VARCHAR(255), opcional
// RN-18: en cada ejercicio al menos uno de series, repeticiones o
// instrucciones debe venir con valor.
import { ERRORES } from '../utils/respuestas.js';

const LONGITUDES = {
  nombre_rutina: 80,
  descripcion: 255,
  nombre_ejercicio: 80,
  repeticiones: 30,
  carga: 40,
  instrucciones: 255,
};

function validarTexto(valor, campo, { obligatorio, longitud }) {
  if (valor === undefined || valor === null || valor === '') {
    if (obligatorio) {
      throw ERRORES.validacion(`El campo ${campo} es obligatorio`);
    }
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

function validarIdCliente(valor) {
  if (valor === undefined || valor === null || valor === '') {
    throw ERRORES.validacion('El campo id_cliente es obligatorio');
  }
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw ERRORES.validacion('El campo id_cliente debe ser un identificador entero válido');
  }
  return id;
}

// Valida la lista completa de ejercicios (RN-18, FR-008).
export function validarListaEjercicios(valor) {
  if (!Array.isArray(valor) || valor.length === 0) {
    throw ERRORES.validacion('La rutina debe incluir al menos un ejercicio');
  }

  return valor.map((ejercicio, indice) => {
    const posicion = indice + 1;
    const nombre = validarTexto(ejercicio?.nombre, `ejercicios[${posicion}].nombre`, {
      obligatorio: true,
      longitud: LONGITUDES.nombre_ejercicio,
    });

    let series = null;
    if (ejercicio?.series !== undefined && ejercicio?.series !== null && ejercicio?.series !== '') {
      series = Number(ejercicio.series);
      if (!Number.isInteger(series) || series <= 0) {
        throw ERRORES.validacion(
          `El ejercicio ${posicion} tiene series inválidas: debe ser un entero mayor que 0`
        );
      }
    }

    const repeticiones = validarTexto(
      ejercicio?.repeticiones,
      `ejercicios[${posicion}].repeticiones`,
      { obligatorio: false, longitud: LONGITUDES.repeticiones }
    );
    const carga = validarTexto(ejercicio?.carga, `ejercicios[${posicion}].carga`, {
      obligatorio: false,
      longitud: LONGITUDES.carga,
    });
    const instrucciones = validarTexto(
      ejercicio?.instrucciones,
      `ejercicios[${posicion}].instrucciones`,
      { obligatorio: false, longitud: LONGITUDES.instrucciones }
    );

    // RN-18: al menos uno de series, repeticiones o instrucciones.
    if (series === null && !repeticiones && !instrucciones) {
      throw ERRORES.validacion(
        `El ejercicio ${posicion} debe indicar al menos series, repeticiones o instrucciones`
      );
    }

    return { nombre, series, repeticiones, carga, instrucciones };
  });
}

export function validarRutina(body) {
  return {
    id_cliente: validarIdCliente(body?.id_cliente),
    nombre: validarTexto(body?.nombre, 'nombre', {
      obligatorio: true,
      longitud: LONGITUDES.nombre_rutina,
    }),
    descripcion: validarTexto(body?.descripcion, 'descripcion', {
      obligatorio: false,
      longitud: LONGITUDES.descripcion,
    }),
    ejercicios: validarListaEjercicios(body?.ejercicios),
  };
}

export function validarRutinaParcial(body) {
  const permitidos = ['nombre', 'descripcion'];
  const enviados = Object.keys(body || {}).filter((campo) => permitidos.includes(campo));
  if (enviados.length === 0) {
    throw ERRORES.validacion('No hay campos válidos para modificar');
  }

  const datos = {};
  if (enviados.includes('nombre')) {
    datos.nombre = validarTexto(body.nombre, 'nombre', {
      obligatorio: true,
      longitud: LONGITUDES.nombre_rutina,
    });
  }
  if (enviados.includes('descripcion')) {
    datos.descripcion = validarTexto(body.descripcion, 'descripcion', {
      obligatorio: false,
      longitud: LONGITUDES.descripcion,
    });
  }
  return datos;
}

export function validarReemplazoEjercicios(body) {
  return { ejercicios: validarListaEjercicios(body?.ejercicios) };
}
