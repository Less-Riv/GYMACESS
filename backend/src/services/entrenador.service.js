// Lógica de negocio de entrenadores (T010, US1; FR-001, FR-002, RN-15).
// Reglas: la cuenta asociada debe existir, estar activa y tener rol
// 'entrenador'; una cuenta solo puede tener UNA ficha de entrenador; la baja
// es lógica (estado 'inactivo') y cierra sus asignaciones activas (T020, US2).
import * as entrenadorModelo from '../models/entrenador.model.js';
import * as asignacionModelo from '../models/asignacion.model.js';
import { obtenerPool } from '../config/database.js';
import { ERRORES, ErrorDeDominio } from '../utils/respuestas.js';

// Errores propios del módulo (contracts/api-entrenadores-asignaciones.md).
function errorUsuarioInvalido() {
  return new ErrorDeDominio(
    400,
    'La cuenta no existe, está inactiva o no tiene el rol entrenador',
    'USUARIO_INVALIDO'
  );
}

function errorUsuarioYaAsociado() {
  return new ErrorDeDominio(
    409,
    'La cuenta ya está asociada a otro entrenador',
    'USUARIO_YA_ASOCIADO'
  );
}

export async function obtenerListadoEntrenadores(rolSolicitante) {
  // El recepcionista solo ve entrenadores activos (contrato US-S3-07).
  const soloActivos = rolSolicitante === 'recepcionista';
  const entrenadores = await entrenadorModelo.listarEntrenadores({ soloActivos });
  return { entrenadores };
}

export async function registrarEntrenador(datos) {
  const [cuenta] = await obtenerPool().query(
    'SELECT id_usuario, rol, estado FROM usuarios WHERE id_usuario = ?',
    [datos.id_usuario]
  );
  const usuario = cuenta[0];
  if (!usuario || usuario.estado !== 'activo' || usuario.rol !== 'entrenador') {
    throw errorUsuarioInvalido();
  }

  const existente = await entrenadorModelo.buscarEntrenadorPorIdUsuario(datos.id_usuario);
  if (existente) {
    throw errorUsuarioYaAsociado();
  }

  try {
    const id = await entrenadorModelo.crearEntrenador(datos);
    return entrenadorModelo.buscarEntrenadorPorId(id);
  } catch (error) {
    // La restricción UNIQUE de MySQL es la autoridad final ante registros
    // concurrentes (RN-15); aquí se anticipa el mismo 409.
    if (error.code === 'ER_DUP_ENTRY') {
      throw errorUsuarioYaAsociado();
    }
    throw error;
  }
}

export async function modificarEntrenador(id, datos) {
  const existente = await entrenadorModelo.buscarEntrenadorPorId(id);
  if (!existente) {
    throw ERRORES.noEncontrado('Entrenador');
  }

  // FR-001 (investigación §6): la baja lógica cierra en la MISMA transacción
  // las asignaciones activas del entrenador; sus clientes quedan como
  // pendientes de asignación y él pierde acceso a ellos (RN-19).
  const baja = datos.estado === 'inactivo' && existente.estado !== 'inactivo';
  if (!baja) {
    await entrenadorModelo.actualizarEntrenador(id, datos);
    return entrenadorModelo.buscarEntrenadorPorId(id);
  }

  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();
    await entrenadorModelo.actualizarEntrenador(id, datos, conexion);
    const hoy = new Date().toISOString().slice(0, 10);
    const cerradas = await asignacionModelo.cerrarAsignacionesActivasDelEntrenador(
      id,
      hoy,
      conexion
    );
    await conexion.commit();
    const entrenador = await entrenadorModelo.buscarEntrenadorPorId(id);
    entrenador.asignaciones_cerradas = cerradas;
    return entrenador;
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (_rollbackError) {
      // La conexión ya quedó inutilizable; se libera en el finally.
    }
    throw error;
  } finally {
    conexion.release();
  }
}
