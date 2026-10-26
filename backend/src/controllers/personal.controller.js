// Controlador de la vista del personal (T060, US7;
// contracts/api-entrenadores-asignaciones.md).
import * as asignacionModelo from '../models/asignacion.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import { responderExito, ERRORES } from '../utils/respuestas.js';

const ESTADOS_ASIGNACION = ['activa', 'cerrada'];

// GET /api/personal: equipo con su carga y los pendientes de asignación.
export async function listarPersonal(req, res, siguiente) {
  try {
    const entrenadorId = req.query.entrenador_id ? Number(req.query.entrenador_id) : null;
    if (req.query.entrenador_id && (!Number.isInteger(entrenadorId) || entrenadorId <= 0)) {
      throw ERRORES.validacion('El parámetro entrenador_id no es válido');
    }

    let estadoAsignacion = null;
    if (req.query.estado_asignacion) {
      if (!ESTADOS_ASIGNACION.includes(req.query.estado_asignacion)) {
        throw ERRORES.validacion("El parámetro estado_asignacion solo admite 'activa' o 'cerrada'");
      }
      estadoAsignacion = req.query.estado_asignacion;
    }

    const [personal, pendientes_de_asignacion] = await Promise.all([
      asignacionModelo.listarPersonal({ entrenadorId, estadoAsignacion }),
      asignacionModelo.listarClientesPendientesDeAsignacion(),
    ]);
    return responderExito(res, 200, { personal, pendientes_de_asignacion });
  } catch (error) {
    return siguiente(error);
  }
}

// GET /api/personal/mi-carga: SOLO la carga del entrenador autenticado; el
// identificador se resuelve desde el token, nunca desde la petición (RN-19).
export async function listarMiCarga(req, res, siguiente) {
  try {
    const ficha = await entrenadorModelo.buscarEntrenadorPorIdUsuario(req.usuario.id_usuario);
    if (!ficha) {
      // Entrenador sin ficha registrada: carga vacía en lugar de un error
      // que confunda al usuario.
      return responderExito(res, 200, { personal: [], pendientes_de_asignacion: [] });
    }

    const personal = await asignacionModelo.listarPersonal({ entrenadorId: ficha.id_entrenador });
    return responderExito(res, 200, { personal, pendientes_de_asignacion: [] });
  } catch (error) {
    return siguiente(error);
  }
}
