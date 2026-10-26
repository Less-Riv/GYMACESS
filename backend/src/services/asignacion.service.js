// Lógica de negocio de las asignaciones entrenador-cliente (T019, US2;
// FR-003, FR-004, RN-16, RN-17).
// Reglas transversales:
// - UNA SOLA asignación activa por cliente, garantizada transaccionalmente
//   con lectura bloqueante (FOR UPDATE) de la fila del cliente (investigación §2).
// - La reasignación cierra la vigente con fecha_fin = hoy y conserva el
//   histórico (RN-17); el entrenador anterior pierde acceso a ese cliente.
// - Auditoría de asignar y reasignar mediante el servicio del Sprint 2 (FR-020).
import * as asignacionModelo from '../models/asignacion.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import { obtenerPool } from '../config/database.js';
import { ERRORES, ErrorDeDominio } from '../utils/respuestas.js';
import { registrarAccion } from './auditoria.service.js';

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function errorClienteInactivo() {
  return new ErrorDeDominio(400, 'El cliente no está activo', 'CLIENTE_INACTIVO');
}

function errorEntrenadorInactivo() {
  return new ErrorDeDominio(400, 'El entrenador no está activo', 'ENTRENADOR_INACTIVO');
}

function errorAsignacionActiva() {
  return new ErrorDeDominio(
    409,
    'El cliente ya tiene un entrenador activo; usa la reasignación',
    'ASIGNACION_ACTIVA_EXISTENTE'
  );
}

// El entrenador autenticado resuelve su propia ficha para filtrar su carga.
async function idFichaDelEntrenador(idUsuario) {
  const ficha = await entrenadorModelo.buscarEntrenadorPorIdUsuario(idUsuario);
  return ficha ? ficha.id_entrenador : null;
}

export async function registrarAsignacion(datos, idUsuarioAuditoria) {
  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();

    // Serializa por la fila del cliente antes de validar la unicidad.
    const cliente = await asignacionModelo.buscarClienteParaAsignar(datos.id_cliente, conexion);
    if (!cliente) {
      throw ERRORES.validacion('El cliente indicado no existe');
    }
    if (cliente.estado !== 'activo') {
      throw errorClienteInactivo();
    }

    const entrenador = await asignacionModelo.buscarEntrenadorParaAsignar(
      datos.id_entrenador,
      conexion
    );
    if (!entrenador) {
      throw ERRORES.validacion('El entrenador indicado no existe');
    }
    if (entrenador.estado !== 'activo') {
      throw errorEntrenadorInactivo();
    }

    const activa = await asignacionModelo.buscarAsignacionActivaPorCliente(datos.id_cliente, {
      conexion,
      bloquear: true,
    });
    if (activa) {
      throw errorAsignacionActiva();
    }

    const id = await asignacionModelo.crearAsignacion(datos, conexion);
    await conexion.commit();

    // Auditoría (FR-020): solo identificadores, nunca datos sensibles.
    await registrarAccion(
      idUsuarioAuditoria,
      'asignar_entrenador',
      'asignaciones',
      'exitoso',
      `Asignación ${id}: cliente ${datos.id_cliente} → entrenador ${datos.id_entrenador}`
    );

    return asignacionModelo.buscarAsignacionPorId(id);
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (_rollbackError) {
      // La conexión ya quedó inutilizable; se libera en el finally.
    }
    // La restricción de unicidad del modelo es la autoridad final ante
    // registros concurrentes (RN-16).
    if (error.code === 'ER_DUP_ENTRY') {
      throw errorAsignacionActiva();
    }
    throw error;
  } finally {
    conexion.release();
  }
}

export async function reasignarAsignacion(idAsignacion, datos, idUsuarioAuditoria) {
  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();

    const actual = await asignacionModelo.buscarAsignacionPorId(idAsignacion, {
      conexion,
      bloquear: true,
    });
    if (!actual || actual.estado !== 'activa') {
      throw ERRORES.noEncontrado('Asignación activa');
    }

    const entrenadorNuevo = await asignacionModelo.buscarEntrenadorParaAsignar(
      datos.id_entrenador,
      conexion
    );
    if (!entrenadorNuevo) {
      throw ERRORES.validacion('El entrenador indicado no existe');
    }
    if (entrenadorNuevo.estado !== 'activo') {
      throw errorEntrenadorInactivo();
    }

    // Cierra la vigente (RN-17: conserva el histórico con su fecha de fin).
    await asignacionModelo.cerrarAsignacion(actual.id_asignacion, hoy(), conexion);

    const id = await asignacionModelo.crearAsignacion(
      {
        id_cliente: actual.id_cliente,
        id_entrenador: datos.id_entrenador,
        fecha_asignacion: hoy(),
      },
      conexion
    );
    await conexion.commit();

    await registrarAccion(
      idUsuarioAuditoria,
      'reasignar_entrenador',
      'asignaciones',
      'exitoso',
      `Reasignación ${id}: cliente ${actual.id_cliente} → entrenador ${datos.id_entrenador}`
    );

    return asignacionModelo.buscarAsignacionPorId(id);
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

export async function obtenerListadoAsignaciones(rolSolicitante, idUsuario, filtros) {
  // RN-19: el entrenador solo recibe las asignaciones de su propia carga.
  let soloEntrenadorPropio = null;
  if (rolSolicitante === 'entrenador') {
    soloEntrenadorPropio = await idFichaDelEntrenador(idUsuario);
    if (!soloEntrenadorPropio) {
      // Un usuario entrenador sin ficha no tiene carga que consultar.
      return { asignaciones: [] };
    }
  }

  const asignaciones = await asignacionModelo.listarAsignaciones({
    clienteId: filtros.cliente_id || null,
    entrenadorId: filtros.entrenador_id || null,
    soloEntrenadorPropio,
  });
  return { asignaciones };
}
