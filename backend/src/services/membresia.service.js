// Lógica de negocio de membresías (T021, US-S2-02; FR-002 a FR-005).
//
// Reglas aplicadas (clarificación 2026-10-15, spec.md §Clarifications):
// - Una única membresía activa por cliente (FR-005): se rechaza con 409.
// - La fecha de fin se calcula en el backend como fecha_inicio + duración del
//   tipo (FR-002, RN-03); el cliente nunca envía la fecha de fin.
// - Solo clientes existentes y activos (RN-01) y tipos activos (RN-02).
// - La renovación (US-S2-03) extiende la vigencia de la MISMA membresía; los
//   estados suspendida y cancelada no se renuevan.
import * as membresiaModelo from '../models/membresia.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as tipoModelo from '../models/tipo-membresia.model.js';
import * as auditor from './auditoria.service.js';
import { ERRORES, ErrorDeDominio } from '../utils/respuestas.js';

// Suma días a una fecha en formato AAAA-MM-DD y devuelve AAAA-MM-DD.
function sumarDias(fechaISO, dias) {
  const fecha = new Date(`${fechaISO}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

// El estado efectivo deriva de la vigencia al momento de consultar (FR-004):
// almacenado 'activo' con fecha_fin anterior a hoy ⇒ 'vencida'. Sin
// tolerancia tras el vencimiento (clarificación Q1).
export function estadoEfectivo(membresia) {
  if (membresia.estado !== 'activo') return membresia.estado;
  const hoy = new Date().toISOString().slice(0, 10);
  return aFechaISO(membresia.fecha_fin) < hoy ? 'vencida' : 'activo';
}

// Normaliza un DATE de MySQL (que llega como objeto Date) a AAAA-MM-DD para
// que el contrato devuelva siempre texto (data-model.md).
function aFechaISO(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  return new Date(valor).toISOString().slice(0, 10);
}

// Proyección de la membresía para la respuesta, con el estado efectivo.
export function presentarMembresia(membresia) {
  return {
    id_membresia: membresia.id_membresia,
    id_cliente: membresia.id_cliente,
    tipo: membresia.tipo_nombre,
    id_tipo_membresia: membresia.id_tipo_membresia,
    fecha_inicio: aFechaISO(membresia.fecha_inicio),
    fecha_fin: aFechaISO(membresia.fecha_fin),
    estado: estadoEfectivo(membresia),
  };
}

async function verificarClienteYTipo(idCliente, idTipo) {
  const cliente = await clienteModelo.buscarClientePorId(idCliente);
  if (!cliente) throw ERRORES.noEncontrado('Cliente');
  if (cliente.estado !== 'activo') {
    throw new ErrorDeDominio(
      409,
      'El cliente está inactivo; no se le puede asignar una membresía',
      'CLIENTE_INACTIVO'
    );
  }

  const tipo = await tipoModelo.buscarTipoPorId(idTipo);
  if (!tipo) throw ERRORES.noEncontrado('Tipo de membresía');
  if (tipo.estado !== 'activo') {
    throw new ErrorDeDominio(
      409,
      'El tipo de membresía está inactivo',
      'TIPO_INACTIVO'
    );
  }
  return { cliente, tipo };
}

export async function asignarMembresia({ idCliente, idTipo, fechaInicio }, usuario) {
  const { tipo } = await verificarClienteYTipo(idCliente, idTipo);

  // Una única membresía activa por cliente (FR-005, US-S2-02 esc. 5).
  const activas = await membresiaModelo.contarActivasDeCliente(idCliente);
  if (activas > 0) {
    throw new ErrorDeDominio(
      409,
      'El cliente ya tiene una membresía activa; solo puede tener una a la vez',
      'CONFLICTO_MEMBRESIA_ACTIVA'
    );
  }

  const fechaFin = sumarDias(fechaInicio, tipo.duracion);
  const id = await membresiaModelo.crearMembresia({
    idCliente,
    idTipo,
    fechaInicio,
    fechaFin,
  });

  await auditor.registrarAccion(
    usuario.id_usuario,
    'asignar membresia',
    'membresias',
    'exitoso',
    `Membresía ${id} asignada al cliente ${idCliente}`
  );

  return buscarParaRespuesta(id);
}

async function buscarParaRespuesta(id) {
  const membresia = await membresiaModelo.buscarMembresiaPorId(id);
  if (!membresia) throw ERRORES.noEncontrado('Membresía');
  return presentarMembresia(membresia);
}

export async function obtenerMembresiaPorId(id) {
  const membresia = await membresiaModelo.buscarMembresiaPorId(id);
  if (!membresia) throw ERRORES.noEncontrado('Membresía');
  return presentarMembresia(membresia);
}

// El entrenador recibe una vista básica sin importes (principio VI).
export function presentarParaRol(membresia, rol) {
  const base = presentarMembresia(membresia);
  if (rol === 'entrenador') {
    const { tipo_precio, ...sinPrecio } = base;
    return sinPrecio;
  }
  return base;
}

export async function obtenerListado(rolSolicitante) {
  const membresias = await membresiaModelo.listarMembresias();
  return {
    membresias: membresias.map((m) => {
      const base = presentarMembresia(m);
      const conCliente = {
        ...base,
        cliente: { nombre: m.cliente_nombre, apellido: m.cliente_apellido },
      };
      if (rolSolicitante === 'entrenador') {
        const { tipo_precio, ...sinPrecio } = conCliente;
        return sinPrecio;
      }
      return conCliente;
    }),
  };
}

export async function obtenerPorCliente(idCliente) {
  const membresias = await membresiaModelo.listarMembresiasPorCliente(idCliente);
  return { membresias: membresias.map(presentarMembresia) };
}

// Estados que permiten renovar (clarificación Q1, 2026-10-15): activo y
// vencido. Suspendida o cancelada responden 409 MEMBRESIA_NO_RENOVABLE.
const ESTADOS_RENOVABLES = ['activo', 'vencida', 'vencido'];

// US-S2-03 (FR-005): la renovación extiende la vigencia de la MISMA membresía
// sumando la duración del tipo elegido a la fecha de finalización actual.
export async function renovarMembresia(id, { idTipo }, usuario) {
  const membresia = await membresiaModelo.buscarMembresiaPorId(id);
  if (!membresia) {
    throw ERRORES.noEncontrado('Membresía');
  }

  const estadoEfect = estadoEfectivo(membresia);
  if (!ESTADOS_RENOVABLES.includes(estadoEfect)) {
    throw new ErrorDeDominio(
      409,
      `La membresía está ${estadoEfect}; solo se pueden renovar las activas o vencidas`,
      'MEMBRESIA_NO_RENOVABLE'
    );
  }

  const tipo = await tipoModelo.buscarTipoPorId(idTipo);
  if (!tipo) {
    throw ERRORES.noEncontrado('Tipo de membresía');
  }
  if (tipo.estado !== 'activo') {
    throw new ErrorDeDominio(409, 'El tipo de membresía está inactivo', 'TIPO_INACTIVO');
  }

  // La nueva fecha parte de la vigente y suma la duración del tipo elegido
  // (FR-005, escenario 1 de US-S2-03).
  const fechaBase = aFechaISO(membresia.fecha_fin) > new Date().toISOString().slice(0, 10)
    ? aFechaISO(membresia.fecha_fin)
    : new Date().toISOString().slice(0, 10);
  const nuevaFechaFin = sumarDias(fechaBase, tipo.duracion);

  await membresiaModelo.extenderFechaFin(id, nuevaFechaFin, 'activo');

  await auditor.registrarAccion(
    usuario.id_usuario,
    'renovar membresia',
    'membresias',
    'exitoso',
    `Membresía ${id} renovada hasta ${nuevaFechaFin}`
  );

  const actualizada = await membresiaModelo.buscarMembresiaPorId(id);
  return presentarMembresia(actualizada);
}
