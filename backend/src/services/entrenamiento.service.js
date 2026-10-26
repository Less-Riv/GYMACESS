// Lógica de negocio de objetivos y progresos (T037, US4; FR-010, FR-011,
// FR-012, RN-17, RN-19, RN-21).
// Reglas transversales:
// - Solo el entrenador con ASIGNACIÓN ACTIVA del cliente registra o modifica
//   (RN-19); el recepcionista solo consulta (RN-20).
// - Los progresos son INMUTABLES: no existe modificación ni eliminación
//   (RN-17); el orden por fecha permite comparar la evolución (FR-012).
// - Objetivo cumplido o cancelado registra fecha_cierre (FR-010) y los
//   cambios de estado la conservan.
import * as objetivoModelo from '../models/objetivo.model.js';
import * as progresoModelo from '../models/progreso.model.js';
import * as asignacionModelo from '../models/asignacion.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import { ERRORES, ErrorDeDominio } from '../utils/respuestas.js';
import { registrarAccion } from './auditoria.service.js';

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

async function fichaDelEntrenador(idUsuario) {
  return entrenadorModelo.buscarEntrenadorPorIdUsuario(idUsuario);
}

// RN-19: el entrenador debe tener la asignación activa del cliente.
async function exigirCarga(idEntrenador, idCliente) {
  const asignacion = await asignacionModelo.buscarAsignacionActivaPorCliente(idCliente);
  if (!asignacion || asignacion.id_entrenador !== idEntrenador) {
    throw new ErrorDeDominio(
      403,
      'El cliente no está asignado a este entrenador',
      'AUTORIZACION'
    );
  }
}

async function exigirFichaActiva(idUsuario) {
  const ficha = await fichaDelEntrenador(idUsuario);
  if (!ficha || ficha.estado !== 'activo') {
    throw ERRORES.autorizacion();
  }
  return ficha;
}

// ---------------------------------------------------------------------------
// Objetivos
// ---------------------------------------------------------------------------

export async function crearObjetivo(datos, idUsuarioAuditoria) {
  const ficha = await exigirFichaActiva(idUsuarioAuditoria);
  await exigirCarga(ficha.id_entrenador, datos.id_cliente);

  const id = await objetivoModelo.crearObjetivo({ ...datos, id_entrenador: ficha.id_entrenador });

  await registrarAccion(
    idUsuarioAuditoria,
    'registrar_objetivo',
    'objetivos',
    'exitoso',
    `Objetivo ${id}: cliente ${datos.id_cliente}`
  );
  return objetivoModelo.buscarObjetivoPorId(id);
}

export async function obtenerListadoObjetivos(rolSolicitante, idUsuario, filtros) {
  let soloEntrenadorPropio = null;
  if (rolSolicitante === 'entrenador') {
    const ficha = await fichaDelEntrenador(idUsuario);
    if (!ficha) return { objetivos: [] };
    soloEntrenadorPropio = ficha.id_entrenador;
  }

  const objetivos = await objetivoModelo.listarObjetivos({
    clienteId: filtros.cliente_id || null,
    estado: filtros.estado || null,
    soloEntrenadorPropio,
  });
  return { objetivos };
}

export async function modificarObjetivo(id, datos, idUsuarioAuditoria) {
  const objetivo = await objetivoModelo.buscarObjetivoPorId(id);
  if (!objetivo) {
    throw ERRORES.noEncontrado('Objetivo');
  }

  const ficha = await exigirFichaActiva(idUsuarioAuditoria);
  if (objetivo.id_entrenador !== ficha.id_entrenador) {
    throw ERRORES.autorizacion();
  }
  await exigirCarga(ficha.id_entrenador, objetivo.id_cliente);

  // FR-010: cumplido o cancelado registra fecha_cierre; los cambios de estado
  // posteriores la conservan (COALESCE en el modelo).
  const cierra = ['cumplido', 'cancelado'].includes(datos.estado);
  await objetivoModelo.actualizarEstadoObjetivo(id, datos.estado, cierra ? hoy() : null);

  return objetivoModelo.buscarObjetivoPorId(id);
}

// ---------------------------------------------------------------------------
// Progresos (histórico inmutable, RN-17)
// ---------------------------------------------------------------------------

export async function registrarProgreso(datos, idUsuarioAuditoria) {
  const ficha = await exigirFichaActiva(idUsuarioAuditoria);
  await exigirCarga(ficha.id_entrenador, datos.id_cliente);

  // FR-011: el objetivo referenciado debe pertenecer al mismo cliente.
  if (datos.id_objetivo) {
    const objetivos = await progresoModelo.objetivosDelCliente(datos.id_cliente);
    if (!objetivos.includes(datos.id_objetivo)) {
      throw ERRORES.validacion('El objetivo indicado no pertenece a este cliente');
    }
  }

  const id = await progresoModelo.crearProgreso({
    ...datos,
    id_entrenador: ficha.id_entrenador,
  });

  await registrarAccion(
    idUsuarioAuditoria,
    'registrar_progreso',
    'progresos',
    'exitoso',
    `Progreso ${id}: cliente ${datos.id_cliente}`
  );
  return progresoModelo.buscarProgresoPorId(id);
}

export async function obtenerListadoProgresos(rolSolicitante, idUsuario, filtros) {
  let soloEntrenadorPropio = null;
  if (rolSolicitante === 'entrenador') {
    const ficha = await fichaDelEntrenador(idUsuario);
    if (!ficha) return { progresos: [] };
    soloEntrenadorPropio = ficha.id_entrenador;
  }

  const progresos = await progresoModelo.listarProgresos({
    clienteId: filtros.cliente_id || null,
    desde: filtros.desde || null,
    hasta: filtros.hasta || null,
    soloEntrenadorPropio,
  });
  return { progresos };
}
