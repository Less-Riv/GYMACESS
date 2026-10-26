// Validación de entrada de entrenadores (T008, US1; FR-001, data-model.md).
// Restricciones citadas del modelo de datos:
// - id_usuario: INT UNSIGNED NOT NULL, ÚNICO (RN-15: una ficha por cuenta)
// - nombre: VARCHAR(80), obligatorio
// - telefono: VARCHAR(30), opcional
// - correo_contacto: VARCHAR(120), opcional
// - estado: ENUM('activo', 'inactivo'), solo en la modificación
import { ERRORES } from '../utils/respuestas.js';

const LONGITUDES = { nombre: 80, telefono: 30, correo_contacto: 120 };
const ESTADOS = ['activo', 'inactivo'];

function validarTexto(valor, campo, { obligatorio }) {
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
  if (limpio.length > LONGITUDES[campo]) {
    throw ERRORES.validacion(
      `El campo ${campo} no puede exceder ${LONGITUDES[campo]} caracteres`
    );
  }
  return limpio.length === 0 ? null : limpio;
}

function validarIdUsuario(valor) {
  if (valor === undefined || valor === null || valor === '') {
    throw ERRORES.validacion('El campo id_usuario es obligatorio');
  }
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw ERRORES.validacion('El campo id_usuario debe ser un identificador entero válido');
  }
  return id;
}

export function validarEntrenador(body) {
  return {
    id_usuario: validarIdUsuario(body?.id_usuario),
    nombre: validarTexto(body?.nombre, 'nombre', { obligatorio: true }),
    telefono: validarTexto(body?.telefono, 'telefono', { obligatorio: false }),
    correo_contacto: validarTexto(body?.correo_contacto, 'correo_contacto', {
      obligatorio: false,
    }),
  };
}

// Modificación (FR-001): solo los campos enviados; el estado solo admite los
// valores del ENUM del modelo de datos.
export function validarEntrenadorParcial(body) {
  const permitidos = ['nombre', 'telefono', 'correo_contacto', 'estado'];
  const enviados = Object.keys(body || {}).filter((campo) => permitidos.includes(campo));
  if (enviados.length === 0) {
    throw ERRORES.validacion('No hay campos válidos para modificar');
  }

  const datos = {};
  for (const campo of enviados) {
    if (campo === 'estado') {
      if (!ESTADOS.includes(body.estado)) {
        throw ERRORES.validacion("El campo estado solo admite 'activo' o 'inactivo'");
      }
      datos.estado = body.estado;
    } else {
      datos[campo] = validarTexto(body[campo], campo, { obligatorio: campo === 'nombre' });
    }
  }
  return datos;
}
