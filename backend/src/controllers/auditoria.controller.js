// Controlador de la auditoría (contrato del Sprint 2
// specs/002-membresias-pagos-acceso-facial/contracts/api-auditoria.md;
// verificado en T063 del Sprint 3, FR-020).
// La consulta es exclusiva del administrador; las inserciones las hace el
// propio backend en cada acción registrada.
import * as auditoriaService from '../services/auditoria.service.js';
import { responderExito, ERRORES } from '../utils/respuestas.js';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function listarAuditoria(req, res, siguiente) {
  try {
    const { fecha, modulo } = req.query;

    if (fecha && (typeof fecha !== 'string' || !FORMATO_FECHA.test(fecha))) {
      throw ERRORES.validacion('El parámetro fecha debe tener formato YYYY-MM-DD');
    }

    const registros = await auditoriaService.consultarRegistros({
      fecha: fecha || null,
      modulo: modulo || null,
    });
    return responderExito(res, 200, { registros });
  } catch (error) {
    return siguiente(error);
  }
}
