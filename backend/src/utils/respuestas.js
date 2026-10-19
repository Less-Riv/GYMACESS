// Helpers de respuesta para mantener envelopes consistentes (contracts/api.md).

export function responderExito(res, estado = 200, cuerpo = {}) {
  return res.status(estado).json(cuerpo);
}

export function responderError(res, estado, mensaje, codigo) {
  return res.status(estado).json({ mensaje, codigo });
}

// Errores de dominio: transportan estado HTTP, mensaje claro y código interno.
export class ErrorDeDominio extends Error {
  constructor(estado, mensaje, codigo) {
    super(mensaje);
    this.mensaje = mensaje; // El middleware de errores responde con `mensaje`.
    this.estado = estado;
    this.codigo = codigo;
  }
}

export const ERRORES = {
  validacion: (mensaje = 'Datos de entrada inválidos') =>
    new ErrorDeDominio(400, mensaje, 'VALIDACION'),
  credenciales: () =>
    new ErrorDeDominio(401, 'Credenciales inválidas', 'AUTH_CREDENCIALES'),
  tokenInvalido: () =>
    new ErrorDeDominio(401, 'Sesión inválida o expirada', 'AUTH_TOKEN'),
  sesionRequerida: () =>
    new ErrorDeDominio(401, 'Autenticación requerida', 'AUTH_REQUERIDA'),
  autorizacion: () =>
    new ErrorDeDominio(403, 'No tienes permisos para esta operación', 'AUTORIZACION'),
  conflictCorreo: () =>
    new ErrorDeDominio(409, 'El correo ya está registrado', 'CONFLICTO_CORREO'),
  conflictClienteConUsuario: () =>
    new ErrorDeDominio(409, 'Ya existe un usuario para este cliente', 'CONFLICTO_CLIENTE_USUARIO'),
  noEncontrado: (recurso = 'Recurso') =>
    new ErrorDeDominio(404, `${recurso} no encontrado`, 'NO_ENCONTRADO'),
  interno: () =>
    new ErrorDeDominio(500, 'Error interno del servidor', 'INTERNO'),
};
