// Lógica de negocio de tipos de membresía (T012, US-S2-01; FR-001).
// El catálogo es administrativo: solo el administrador lo gestiona.
import * as tipoModelo from '../models/tipo-membresia.model.js';
import { ERRORES } from '../utils/respuestas.js';

export async function crearTipo(datos) {
  const id = await tipoModelo.crearTipo(datos);
  return tipoModelo.buscarTipoPorId(id);
}

export async function obtenerListadoTipos({ soloActivos = false } = {}) {
  return tipoModelo.listarTipos({ soloActivos });
}

export async function modificarTipo(id, datos) {
  const existente = await tipoModelo.buscarTipoPorId(id);
  if (!existente) {
    throw ERRORES.noEncontrado('Tipo de membresía');
  }
  await tipoModelo.actualizarTipo(id, datos);
  return tipoModelo.buscarTipoPorId(id);
}

export async function obtenerTipoPorId(id) {
  const tipo = await tipoModelo.buscarTipoPorId(id);
  if (!tipo) {
    throw ERRORES.noEncontrado('Tipo de membresía');
  }
  return tipo;
}
