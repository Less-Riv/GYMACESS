// Middleware de autenticación (FR-004, FR-024).
// Verifica el JWT en cada petición a rutas protegidas y comprueba que el usuario
// exista y esté activo (cubre el caso límite "desactivado con sesión activa").
import jwt from 'jsonwebtoken';
import { entorno } from '../config/entorno.js';
import { obtenerPool } from '../config/database.js';
import { ERRORES } from '../utils/respuestas.js';

export async function autenticar(req, res, siguiente) {
  const encabezado = req.headers.authorization || '';
  const [esquema, token] = encabezado.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return siguiente(ERRORES.sesionRequerida());
  }

  let payload;
  try {
    payload = jwt.verify(token, entorno.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (_error) {
    // Token expirado o manipulado: mismo rechazo 401 (FR-024, caso límite).
    return siguiente(ERRORES.tokenInvalido());
  }

  try {
    // La baja lógica se evalúa en cada petición: un usuario desactivado mientras
    // tenía una sesión activa queda rechazado en su siguiente operación.
    const [filas] = await obtenerPool().query(
      'SELECT id_usuario, nombre, correo, rol, estado FROM usuarios WHERE id_usuario = ?',
      [payload.id_usuario]
    );
    const usuario = filas[0];

    if (!usuario || usuario.estado !== 'activo') {
      return siguiente(ERRORES.tokenInvalido());
    }

    req.usuario = usuario;
    return siguiente();
  } catch (error) {
    return siguiente(error);
  }
}
