// Validación de entrada de usuarios (T039, US3/US4, FR-013; data-model.md).
// Restricciones citadas del modelo:
// - nombre: VARCHAR(100), obligatorio
// - correo: VARCHAR(150), obligatorio y con formato válido (único en MySQL)
// - password: obligatoria con longitud mínima de 8 caracteres (solo en alta)
// - rol: obligatorio dentro de ('administrador','recepcionista','entrenador','cliente')
// - apellido: VARCHAR(100), opcional; solo se usa para crear el cliente
//   asociado cuando el rol es 'cliente' (aclaración 2026-10-14).
// El alta ya NO acepta cliente_id: el backend crea o reutiliza el cliente
// dentro de una transacción (aclaración 2026-10-14).
import { ERRORES } from '../utils/respuestas.js';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ROLES_VALIDOS = ['administrador', 'recepcionista', 'entrenador', 'cliente'];
export const LONGITUD_PASSWORD_MINIMA = 8;
export const LONGITUD_APELLIDO_MAXIMA = 100;

export function validarAltaUsuario(body) {
  if (!body?.nombre || typeof body.nombre !== 'string' || !body.nombre.trim()) {
    throw ERRORES.validacion('El campo nombre es obligatorio');
  }
  if (body.nombre.trim().length > 100) {
    throw ERRORES.validacion('El campo nombre no puede exceder 100 caracteres');
  }

  if (!body.correo || typeof body.correo !== 'string' || !FORMATO_CORREO.test(body.correo.trim())) {
    throw ERRORES.validacion('El correo tiene un formato inválido');
  }
  if (body.correo.trim().length > 150) {
    throw ERRORES.validacion('El campo correo no puede exceder 150 caracteres');
  }

  if (!body.password || typeof body.password !== 'string') {
    throw ERRORES.validacion('La contraseña es obligatoria');
  }
  if (body.password.length < LONGITUD_PASSWORD_MINIMA) {
    throw ERRORES.validacion(
      `La contraseña debe tener al menos ${LONGITUD_PASSWORD_MINIMA} caracteres`
    );
  }

  if (!body.rol || !ROLES_VALIDOS.includes(body.rol)) {
    throw ERRORES.validacion(
      `El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}`
    );
  }

  // apellido: opcional y solo significativo cuando el rol es 'cliente'.
  let apellido = '';
  if (body.apellido !== undefined && body.apellido !== null && body.apellido !== '') {
    if (typeof body.apellido !== 'string') {
      throw ERRORES.validacion('El campo apellido debe ser texto');
    }
    apellido = body.apellido.trim();
    if (apellido.length > LONGITUD_APELLIDO_MAXIMA) {
      throw ERRORES.validacion(
        `El campo apellido no puede exceder ${LONGITUD_APELLIDO_MAXIMA} caracteres`
      );
    }
  }

  return {
    nombre: body.nombre.trim(),
    correo: body.correo.trim().toLowerCase(),
    password: body.password,
    rol: body.rol,
    apellido,
    // cliente_id recibido en el cuerpo se ignora deliberadamente: quien crea
    // o reutiliza el cliente es el servicio, dentro de una transacción.
  };
}

export function validarAsignacionRol(body) {
  if (!body?.rol || !ROLES_VALIDOS.includes(body.rol)) {
    throw ERRORES.validacion(
      `El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}`
    );
  }
  return { rol: body.rol, clienteId: body.cliente_id ?? null };
}
