// Middleware central de errores (FR-020, research.md D7).
// Traduce cualquier error al envelope { mensaje, codigo } y nunca expone
// detalles internos del servidor ni stack traces al cliente.
import { ErrorDeDominio, ERRORES } from '../utils/respuestas.js';

export function manejarErrores(err, _req, res, _siguiente) {
  // Errores de dominio: respuesta clara y controlada.
  if (err instanceof ErrorDeDominio) {
    return res.status(err.estado).json({ mensaje: err.mensaje, codigo: err.codigo });
  }

  // Error de JSON mal formado en el cuerpo de la petición.
  if (err.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ mensaje: 'El cuerpo de la petición no es JSON válido', codigo: 'VALIDACION' });
  }

  // Conflicto de unicidad de MySQL (código 1062) → 409 (FR-013).
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    const conflicto = ERRORES.conflictCorreo();
    return res
      .status(conflicto.estado)
      .json({ mensaje: conflicto.mensaje, codigo: conflicto.codigo });
  }

  // Cualquier otro error (incluida la indisponibilidad de MySQL) responde con un
  // mensaje genérico sin revelar información interna (caso límite del spec).
  console.error('[error interno]', err.message);
  return res
    .status(500)
    .json({ mensaje: 'Error interno del servidor', codigo: 'INTERNO' });
}
