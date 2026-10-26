// Lógica de negocio de las rutinas (T028, US3; FR-007, FR-008, FR-009, RN-18,
// RN-19).
// Reglas transversales:
// - Solo el entrenador con ASIGNACIÓN ACTIVA del cliente puede crear o
//   modificar rutinas (RN-19); el filtro ocurre SIEMPRE en el backend.
// - Una sola rutina activa por cliente: al crear una nueva, la anterior pasa
//   a 'finalizada' en la MISMA transacción (FR-009).
// - Auditoría de crear y modificar mediante el servicio del Sprint 2 (FR-020).
import * as rutinaModelo from '../models/rutina.model.js';
import * as ejercicioModelo from '../models/ejercicio-rutina.model.js';
import * as asignacionModelo from '../models/asignacion.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import { obtenerPool } from '../config/database.js';
import { ERRORES, ErrorDeDominio } from '../utils/respuestas.js';
import { registrarAccion } from './auditoria.service.js';

// RN-19: el entrenador autenticado resuelve su propia ficha.
async function fichaDelEntrenador(idUsuario) {
  return entrenadorModelo.buscarEntrenadorPorIdUsuario(idUsuario);
}

// Comprueba la asignación activa del cliente con ese entrenador (403).
async function exigirCarga(idEntrenador, idCliente, conexion) {
  const asignacion = await asignacionModelo.buscarAsignacionActivaPorCliente(idCliente, {
    conexion,
  });
  if (!asignacion || asignacion.id_entrenador !== idEntrenador) {
    throw new ErrorDeDominio(
      403,
      'El cliente no está asignado a este entrenador',
      'AUTORIZACION'
    );
  }
}

async function adjuntarEjercicios(rutinas) {
  const ids = rutinas.map((rutina) => rutina.id_rutina);
  const ejercicios = await ejercicioModelo.listarEjerciciosPorRutinas(ids);
  const porRutina = new Map(ids.map((id) => [id, []]));
  for (const ejercicio of ejercicios) {
    porRutina.get(ejercicio.id_rutina).push(ejercicio);
  }
  return rutinas.map((rutina) => ({ ...rutina, ejercicios: porRutina.get(rutina.id_rutina) }));
}

export async function obtenerListadoRutinas(rolSolicitante, idUsuario, filtros) {
  let soloEntrenadorPropio = null;
  if (rolSolicitante === 'entrenador') {
    const ficha = await fichaDelEntrenador(idUsuario);
    if (!ficha) return { rutinas: [] };
    soloEntrenadorPropio = ficha.id_entrenador;
  }

  const rutinas = await rutinaModelo.listarRutinas({
    clienteId: filtros.cliente_id || null,
    estado: filtros.estado || null,
    soloEntrenadorPropio,
  });
  return { rutinas: await adjuntarEjercicios(rutinas) };
}

export async function crearRutina(datos, idUsuarioAuditoria) {
  const ficha = await fichaDelEntrenador(idUsuarioAuditoria);
  if (!ficha || ficha.estado !== 'activo') {
    throw ERRORES.autorizacion();
  }

  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();

    await exigirCarga(ficha.id_entrenador, datos.id_cliente, conexion);

    // FR-009: la rutina activa anterior pasa a 'finalizada'.
    await rutinaModelo.finalizarRutinaActiva(datos.id_cliente, conexion);

    const id = await rutinaModelo.crearRutina(
      {
        id_cliente: datos.id_cliente,
        id_entrenador: ficha.id_entrenador,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
      },
      conexion
    );
    await ejercicioModelo.reemplazarEjercicios(id, datos.ejercicios, conexion);
    await conexion.commit();

    await registrarAccion(
      idUsuarioAuditoria,
      'crear_rutina',
      'rutinas',
      'exitoso',
      `Rutina ${id}: cliente ${datos.id_cliente}`
    );

    return obtenerRutinaPorId(id);
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

async function rutinaEditableParaEntrenador(idRutina, idUsuarioAuditoria) {
  const rutina = await rutinaModelo.buscarRutinaPorId(idRutina);
  if (!rutina) {
    throw ERRORES.noEncontrado('Rutina');
  }
  const ficha = await fichaDelEntrenador(idUsuarioAuditoria);
  if (!ficha || ficha.estado !== 'activo' || rutina.id_entrenador !== ficha.id_entrenador) {
    // Solo el entrenador que la creó y con la carga vigente (FR-004, RN-19).
    throw ERRORES.autorizacion();
  }
  await exigirCarga(ficha.id_entrenador, rutina.id_cliente);
  return { rutina, ficha };
}

export async function obtenerRutinaPorId(id) {
  const rutina = await rutinaModelo.buscarRutinaPorId(id);
  if (!rutina) {
    throw ERRORES.noEncontrado('Rutina');
  }
  const ejercicios = await ejercicioModelo.listarEjerciciosPorRutina(id);
  return { ...rutina, ejercicios };
}

export async function modificarRutina(id, datos, idUsuarioAuditoria) {
  const { rutina } = await rutinaEditableParaEntrenador(id, idUsuarioAuditoria);

  await rutinaModelo.actualizarRutina(rutina.id_rutina, datos);
  await registrarAccion(
    idUsuarioAuditoria,
    'modificar_rutina',
    'rutinas',
    'exitoso',
    `Rutina ${rutina.id_rutina}: cliente ${rutina.id_cliente}`
  );
  return obtenerRutinaPorId(rutina.id_rutina);
}

export async function modificarEjercicios(id, ejercicios, idUsuarioAuditoria) {
  const { rutina } = await rutinaEditableParaEntrenador(id, idUsuarioAuditoria);

  // El reemplazo es en conjunto: la lista anterior se descarta y la nueva
  // entra completa (FR-008); los progresos ya registrados no se alteran.
  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();
    await ejercicioModelo.reemplazarEjercicios(rutina.id_rutina, ejercicios, conexion);
    await conexion.commit();
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

  await registrarAccion(
    idUsuarioAuditoria,
    'modificar_rutina',
    'rutinas',
    'exitoso',
    `Ejercicios de la rutina ${rutina.id_rutina}: cliente ${rutina.id_cliente}`
  );
  return obtenerRutinaPorId(rutina.id_rutina);
}
