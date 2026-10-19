// Cliente HTTP del frontend (research.md D6): agrega el token JWT a cada
// petición, centraliza el parseo del envelope de errores y cierra la sesión
// ante un 401 (token expirado o usuario desactivado).
const CLAVE_TOKEN = 'gimnasio_token';
const CLAVE_USUARIO = 'gimnasio_usuario';

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function obtenerUsuarioGuardado() {
  const crudo = localStorage.getItem(CLAVE_USUARIO);
  return crudo ? JSON.parse(crudo) : null;
}

export function guardarSesion(token, usuario) {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

// Lanza ErrorApi con el mensaje del backend; en 401 borra la sesión y notifica.
export class ErrorApi extends Error {
  constructor(mensaje, estado, codigo) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
  }
}

let alCerrarSesion = null;
export function configurarCierreSesion(callback) {
  alCerrarSesion = callback;
}

export async function pedir(ruta, opciones = {}) {
  const { metodo = 'GET', cuerpo } = opciones;
  const token = obtenerToken();

  const encabezados = { 'Content-Type': 'application/json' };
  if (token) {
    encabezados.Authorization = `Bearer ${token}`;
  }

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: encabezados,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch (_error) {
    throw new ErrorApi('No se pudo conectar con el servidor', 0, 'RED');
  }

  if (respuesta.status === 401) {
    borrarSesion();
    if (alCerrarSesion) alCerrarSesion();
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (_error) {
    datos = null;
  }

  if (!respuesta.ok) {
    throw new ErrorApi(
      datos?.mensaje || 'Ocurrió un error inesperado',
      respuesta.status,
      datos?.codigo
    );
  }

  return datos;
}
