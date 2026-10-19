// Validación de entrada del login (T023, FR-013).
import { ERRORES } from '../utils/respuestas.js';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarLogin({ correo, password }) {
  if (!correo || typeof correo !== 'string' || !FORMATO_CORREO.test(correo.trim())) {
    throw ERRORES.validacion('El correo tiene un formato inválido');
  }
  if (!password || typeof password !== 'string' || password.length === 0) {
    throw ERRORES.validacion('La contraseña es obligatoria');
  }
  return { correo: correo.trim().toLowerCase(), password };
}
