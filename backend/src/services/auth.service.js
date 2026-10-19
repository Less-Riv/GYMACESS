// Lógica de negocio de la autenticación (T025, US1, FR-001, FR-024).
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { entorno } from '../config/entorno.js';
import * as usuarioModelo from '../models/usuario.model.js';
import { ERRORES } from '../utils/respuestas.js';

// Credenciales incorrectas, correo inexistente y usuario inactivo comparten el
// mismo mensaje genérico: no se revela si la cuenta existe (caso límite del spec).
export async function iniciarSesion({ correo, password }) {
  const usuario = await usuarioModelo.buscarUsuarioPorCorreo(correo);

  const coincide = usuario
    ? await bcrypt.compare(password, usuario.password)
    : false;

  if (!usuario || !coincide || usuario.estado !== 'activo') {
    throw ERRORES.credenciales();
  }

  // JWT HS256 con expiración de 8 horas (FR-024, research.md D6).
  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, rol: usuario.rol },
    entorno.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: entorno.JWT_EXPIRACION }
  );

  return {
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
}
